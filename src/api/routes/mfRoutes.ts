/**
 * mfRoutes.ts — マネーフォワード クラウド会計API データ取得ルート（Hono）
 *
 * レイヤー: ★route★ → mfMcpClient / mfApiClient
 * 責務: MFデータ取得エンドポイント（MCPサーバー経由 + 認可サーバーAPI）
 *
 * エンドポイント:
 *   GET  /api/mf/tenant           — 事業者情報を取得（認可サーバーAPI）
 *   GET  /api/mf/office           — 事業者情報を取得（MCPサーバー経由）★推奨
 *   GET  /api/mf/accounts         — 勘定科目一覧を取得（MCPサーバー経由）
 *   GET  /api/mf/taxes            — 税区分一覧を取得（MCPサーバー経由）
 *   GET  /api/mf/journals         — 仕訳一覧を取得（MCPサーバー経由）
 *   GET  /api/mf/term-settings    — 会計年度設定を取得（MCPサーバー経由）
 *   GET  /api/mf/fiscal-check     — 決算月不一致チェック（MF vs sugu-sru）
 *
 * 準拠:
 *   - load_context.md L150: 既存エンドポイントを拡張せよ
 *   - 34_mf_mcp_integration.md: MF MCP連携設計
 */

import { Hono } from 'hono'
import { fetchTenant } from '../services/mfApiClient'
import { getAuthStatus, setOfficeInfo } from '../services/mfAuthService'
import {
  mcpFetchCurrentOffice,
  mcpFetchAccounts,
  mcpFetchTaxes,
  mcpFetchJournals,
  mcpFetchTermSettings,
  mcpCreateJournal,
} from '../services/mfMcpClient'
import { getById, updateClient } from '../services/clientStore'
import { mapOfficeToClient, mapTermSettingsToClient } from '../../constants/mfFieldMapping'

const app = new Hono()

// ---------- 認可サーバーAPI経由 ----------

/**
 * GET /tenant — MF認可サーバーAPIから事業者情報を取得
 * ※ 認可サーバーAPI（api.biz.moneyforward.com）はWAFブロック対象外
 */
app.get('/tenant', async (c) => {
  const clientId = c.req.query('clientId') ?? 'default'
  const status = getAuthStatus(clientId)
  if (!status.authenticated) {
    return c.json({ error: 'MF未認証です。先にOAuth認可を完了してください' }, 401)
  }

  try {
    const tenant = await fetchTenant()
    return c.json({ tenant })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfRoutes] 事業者情報取得失敗: ${message}`)
    return c.json({ error: '事業者情報の取得に失敗しました', detail: message }, 500)
  }
})

// ---------- MCPサーバー経由 ----------

/**
 * GET /office — MCPサーバー経由で事業者情報を取得（★推奨）
 * クエリ: clientId（顧問先ID。省略時は 'default'）
 * 個人/法人判定（type）、会計期間、従業員数等の業務データが取れる
 */
app.get('/office', async (c) => {
  const clientId = c.req.query('clientId') ?? 'default'
  const status = getAuthStatus(clientId)
  if (!status.authenticated) {
    return c.json({ error: 'MF未認証です。先にOAuth認可を完了してください' }, 401)
  }

  try {
    const office = await mcpFetchCurrentOffice(clientId)
    // 事業所情報をトークンに紐付け（後続APIで使用）
    setOfficeInfo(clientId, office.code, office.name)
    return c.json({ office, source: 'mcp/mfc_ca_currentOffice' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfRoutes] MCP事業者情報取得失敗: ${message}`)
    return c.json({ error: '事業者情報の取得に失敗しました（MCP経由）', detail: message }, 500)
  }
})

/**
 * GET /accounts — MCPサーバー経由で勘定科目一覧を取得
 * クエリ: clientId（顧問先ID。省略時は 'default'）
 */
app.get('/accounts', async (c) => {
  const clientId = c.req.query('clientId') ?? 'default'
  const status = getAuthStatus(clientId)
  if (!status.authenticated) {
    return c.json({ error: 'MF未認証です。先にOAuth認可を完了してください' }, 401)
  }

  try {
    const accounts = await mcpFetchAccounts(clientId)
    return c.json({ accounts, count: accounts.length, source: 'mcp/mfc_ca_getAccounts' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfRoutes] MCP勘定科目取得失敗: ${message}`)
    return c.json({ error: '勘定科目の取得に失敗しました', detail: message }, 500)
  }
})

/**
 * GET /taxes — MCPサーバー経由で税区分一覧を取得
 * クエリ: clientId（顧問先ID。省略時は 'default'）
 */
app.get('/taxes', async (c) => {
  const clientId = c.req.query('clientId') ?? 'default'
  const status = getAuthStatus(clientId)
  if (!status.authenticated) {
    return c.json({ error: 'MF未認証です。先にOAuth認可を完了してください' }, 401)
  }

  try {
    const taxes = await mcpFetchTaxes(clientId)
    return c.json({ taxes, count: taxes.length, source: 'mcp/mfc_ca_getTaxes' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfRoutes] MCP税区分取得失敗: ${message}`)
    return c.json({ error: '税区分の取得に失敗しました', detail: message }, 500)
  }
})

/**
 * GET /journals — MCPサーバー経由で仕訳一覧を取得
 * クエリ: clientId, start_date, end_date, account_id, page, per_page
 */
app.get('/journals', async (c) => {
  const clientId = c.req.query('clientId') ?? 'default'
  const status = getAuthStatus(clientId)
  if (!status.authenticated) {
    return c.json({ error: 'MF未認証です。先にOAuth認可を完了してください' }, 401)
  }

  try {
    const params: Record<string, unknown> = {}
    const startDate = c.req.query('start_date')
    const endDate = c.req.query('end_date')
    const accountId = c.req.query('account_id')
    const page = c.req.query('page')
    const perPage = c.req.query('per_page')

    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    if (accountId) params.account_id = accountId
    if (page) params.page = Number(page)
    if (perPage) params.per_page = Number(perPage)

    const journals = await mcpFetchJournals(params as Parameters<typeof mcpFetchJournals>[0], clientId)
    return c.json({ journals, count: journals.length, source: 'mcp/mfc_ca_getJournals' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfRoutes] MCP仕訳取得失敗: ${message}`)
    return c.json({ error: '仕訳の取得に失敗しました', detail: message }, 500)
  }
})

/**
 * GET /term-settings — MCPサーバー経由で会計年度設定を取得
 * クエリ: clientId, fiscal_year（省略時: 最新年度）
 */
app.get('/term-settings', async (c) => {
  const clientId = c.req.query('clientId') ?? 'default'
  const status = getAuthStatus(clientId)
  if (!status.authenticated) {
    return c.json({ error: 'MF未認証です。先にOAuth認可を完了してください' }, 401)
  }

  try {
    const fyParam = c.req.query('fiscal_year')
    const fiscalYear = fyParam ? Number(fyParam) : undefined
    const settings = await mcpFetchTermSettings(fiscalYear, clientId)
    return c.json({ settings: { term_settings: settings }, source: 'mcp/mfc_ca_getTermSettings' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfRoutes] MCP会計年度設定取得失敗: ${message}`)
    return c.json({ error: '会計年度設定の取得に失敗しました', detail: message }, 500)
  }
})

// ---------- 決算月不一致チェック ----------

/**
 * GET /fiscal-check — MF会計期間 vs sugu-sruの決算月を突合チェック
 * クエリ: clientId（必須）
 *
 * レスポンス:
 *   mismatch: true の場合 → フロントで修正モーダルを表示する想定
 *   mismatch: false の場合 → 一致。修正不要
 */
app.get('/fiscal-check', async (c) => {
  const clientId = c.req.query('clientId')
  if (!clientId) {
    return c.json({ error: 'clientIdは必須です' }, 400)
  }

  // 1. sugu-sru上の顧問先データ取得
  const client = getById(clientId)
  if (!client) {
    return c.json({ error: `顧問先が見つかりません: ${clientId}` }, 404)
  }

  // 2. MF認証チェック
  const status = getAuthStatus(clientId)
  if (!status.authenticated) {
    return c.json({ error: 'MF未認証です', mfLinked: false }, 200)
  }

  // 3. MFから会計期間を取得
  try {
    const termList = await mcpFetchTermSettings(undefined, clientId)
    // 最新年度（先頭）のend_dateから決算月を抽出
    const latest = termList[0]
    if (!latest?.end_date) {
      return c.json({ error: 'MFから会計期間を取得できませんでした', detail: 'end_dateが空' }, 500)
    }

    // end_date（例: "2026-12-31"）の月を抽出
    const mfFiscalMonth = new Date(latest.end_date).getMonth() + 1
    const localFiscalMonth = client.fiscalMonth ?? 0

    return c.json({
      clientId,
      companyName: client.companyName || client.repName || '',
      localFiscalMonth,
      mfFiscalMonth,
      mfEndDate: latest.end_date,
      mfStartDate: latest.start_date,
      mismatch: localFiscalMonth !== mfFiscalMonth,
      mfLinked: true,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfRoutes] 決算月チェック失敗: ${message}`)
    return c.json({ error: '決算月チェックに失敗しました', detail: message }, 500)
  }
})

// ---------- WRITE系 ----------

/**
 * POST /journals — MCPサーバー経由でMFに仕訳を登録（mfc_ca_postJournals）
 * 準拠: 34a_command_journal.md 仕訳投入コマンド / 35_parts_catalog.md postJournals出力部品
 * body: { clientId: string, journal: { transaction_date, journal_type, branches[], memo?, tags? } }
 */
app.post('/journals', async (c) => {
  try {
    const body = await c.req.json()
    const clientId = body.clientId as string
    if (!clientId) return c.json({ error: 'clientId必須' }, 400)
    if (!body.journal) return c.json({ error: 'journal必須' }, 400)

    const result = await mcpCreateJournal(body.journal, clientId)
    return c.json({ result, source: 'mcp/mfc_ca_postJournals' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfRoutes] 仕訳登録失敗: ${message}`)
    return c.json({ error: '仕訳登録に失敗しました', detail: message }, 500)
  }
})

// ---------- MFインポート ----------

/**
 * POST /import-offices — MF連携済み顧問先の事業所情報をMCPから取得し、clientStoreに反映
 * body: { clientIds: string[] }
 *
 * mfFieldMapping.ts のマッピングテーブル駆動で自動変換。
 * MFが正（Single Source of Truth）— MFに値があれば sugusuru を上書き。
 *
 * 取得元:
 *   1. currentOffice → 会社名, 種別, 不動産所得, 従業員数, 決算月日
 *   2. getTermSettings → 課税方式, 経理方式, 業種
 */
app.post('/import-offices', async (c) => {
  const body = await c.req.json()
  const clientIds = body.clientIds as string[]
  if (!clientIds?.length) {
    return c.json({ error: 'clientIds必須' }, 400)
  }

  const results: {
    updated: number;
    skipped: number;
    errors: string[];
    details: Array<{ clientId: string; threeCode: string; name: string; changes: string[] }>;
  } = { updated: 0, skipped: 0, errors: [], details: [] }

  for (const clientId of clientIds) {
    const client = getById(clientId)
    if (!client) {
      results.errors.push(`${clientId}: 顧問先が見つかりません`)
      continue
    }

    const status = getAuthStatus(clientId)
    if (!status.authenticated) {
      results.errors.push(`${client.threeCode || clientId}: MF未認証`)
      continue
    }

    try {
      // 1. currentOffice からマッピング
      const office = await mcpFetchCurrentOffice(clientId)
      const clientRecord = client as unknown as Record<string, unknown>
      const officeResult = mapOfficeToClient(office, clientRecord)

      // 2. getTermSettings からマッピング（最新年度）
      const termSettingsList = await mcpFetchTermSettings(undefined, clientId)
      let termResult = { updates: {} as Record<string, unknown>, changes: [] as string[] }
      if (termSettingsList.length > 0) {
        termResult = mapTermSettingsToClient(termSettingsList[0]!, clientRecord)
      }

      // マージ（termSettings側が後勝ち）
      const allUpdates = { ...officeResult.updates, ...termResult.updates }
      const allChanges = [...officeResult.changes, ...termResult.changes]

      if (Object.keys(allUpdates).length > 0) {
        updateClient(clientId, allUpdates)
        results.updated++
      } else {
        results.skipped++
      }

      results.details.push({
        clientId,
        threeCode: client.threeCode || '',
        name: client.companyName || client.repName || '',
        changes: allChanges,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      results.errors.push(`${client.threeCode || clientId}: ${message}`)
    }
  }

  console.log(`[MFインポート] 完了: 更新=${results.updated}, スキップ=${results.skipped}, エラー=${results.errors.length}`)
  return c.json(results)
})

export default app
