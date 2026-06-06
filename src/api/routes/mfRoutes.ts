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
import { saveMfRawData, loadMfRawData, listMfRawPatterns } from '../services/mfRawDataStore'
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
import { importMfJournals } from '../services/mfJournalImporter'
import { previewTaxImport, applyTaxImport, importClientTaxes } from '../services/mfTaxImportService'
import { importMasterAccounts } from '../services/mfAccountImportService'
import { saveClientAccounts, saveClientTaxCategories, getAllAccounts, getAllTaxCategories } from '../services/accountMasterStore'
import type { Account } from '../../types/shared-account'
import { deriveMfAccountGroup, deriveTaxDetermination, deriveTarget } from '../../data/master/mf-account-category-mapping'
import { generateTaxMasterId } from '../services/taxIdGenerator'
import type { TaxCategory } from '../../types/shared-tax-category'
import { guessDirectionFromName, guessQualifiedFromName } from '../../types/shared-tax-category'
import { getAllTaxAvailable, saveTaxAvailable, invalidateCache, type TaxMethodKey } from '../services/mfTaxAvailableStore'
import { DEFAULT_EFFECTIVE_FROM } from '../../constants/mfApiConstants'

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

// ---------- P1: MF全データ同期（直接API実行） ----------

/**
 * POST /sync-all — MFの全データを一括取込（常に3期分）
 *
 * ボディ: { clientId: string }
 * 取込内容:
 *   1. 仕訳データ（3期分ループ）
 *   2. 勘定科目マスタ
 *   3. 税区分マスタ
 *   4. 事業者情報（事業所ID・名前をトークンに紐付け）
 *
 * 方針: Geminiトークン0円。直接API実行。
 * actionType: direct_api
 * costPerCall: 0
 */
app.post('/sync-all', async (c) => {
  const body = await c.req.json<{ clientId?: string }>().catch(() => ({} as { clientId?: string }))
  const clientId = c.req.query('clientId') ?? body.clientId ?? 'default'

  // MF認証チェック
  const status = getAuthStatus(clientId)
  if (!status.authenticated) {
    return c.json({
      success: false,
      error: 'MF未認証です。先にOAuth認可を完了してください。',
    }, 401)
  }

  const results: string[] = []
  const batchIds: string[] = []
  let hasWarnings = false

  try {
    // ===== 1. 事業者情報 =====
    const office = await mcpFetchCurrentOffice(clientId)
    setOfficeInfo(clientId, office.code, office.name)
    results.push(`✅ 事業者情報: ${office.name}（${office.type}）`)

    // ===== 2. 仕訳データ（3期分） =====
    const termList = await mcpFetchTermSettings(undefined, clientId)
    const periodCount = 3

    for (let i = 0; i < periodCount; i++) {
      const selected = termList[i]
      if (!selected) break

      const journals = await mcpFetchJournals(
        { start_date: selected.start_date, end_date: selected.end_date },
        clientId,
      )

      const importResult = await importMfJournals(journals, clientId)
      batchIds.push(importResult.batchId)

      if (importResult.committed) {
        results.push(
          `✅ 仕訳（${selected.fiscal_year}期: ${selected.start_date}〜${selected.end_date}）: ` +
          `${journals.length}件取得 → ${importResult.added}件追加, ${importResult.skipped}件スキップ（重複）`
        )
      } else {
        results.push(
          `⏳ 仕訳（${selected.fiscal_year}期: ${selected.start_date}〜${selected.end_date}）: ` +
          `${journals.length}件取得 → 承認待ち（${importResult.converted.length}件変換済み）`
        )
        hasWarnings = true
      }

      for (const err of importResult.skippedErrors) {
        results.push(`  ❌ ${err.message}`)
      }
      for (const warn of importResult.warnings) {
        results.push(`  ⚠️ ${warn.message}`)
      }
    }

    // ===== 3. 勘定科目マスタ =====
    const allAccounts = await mcpFetchAccounts(clientId)
    const available = allAccounts.filter((a) => a.available)
    const mapped: Account[] = available.map((a, idx) => {
      const group = deriveMfAccountGroup(a.account_group, a.category)
      return {
        accountId: a.id,
        name: a.name,
        target: deriveTarget(a.category, a.financial_statement_type),
        accountGroup: group,
        category: a.category,
        defaultTaxCategoryId: undefined,
        taxDetermination: deriveTaxDetermination(group),
        deprecated: false,
        effectiveFrom: DEFAULT_EFFECTIVE_FROM,
        effectiveTo: null,
        sortOrder: idx + 1,
        mfAccountId: a.id,
        mfAccountGroup: a.account_group,
        mfFinancialStatementType: a.financial_statement_type,
      }
    })
    saveClientAccounts(clientId, mapped)

    const sugusruAccounts = getAllAccounts()
    const sugusruNames = new Set(sugusruAccounts.map(a => a.name))
    const matchedCount = available.filter(a => sugusruNames.has(a.name)).length
    const unmatchedList = available.filter(a => !sugusruNames.has(a.name))

    let accountMsg = `✅ 勘定科目: ${allAccounts.length}件取得 → ${available.length}件保存`
    accountMsg += `（マッチ: ${matchedCount}件 / 未マッチ: ${unmatchedList.length}件）`
    results.push(accountMsg)

    // ===== 4. 税区分マスタ（名前照合でマスタ属性を引き継ぐ） =====
    const allTaxes = await mcpFetchTaxes(clientId)
    // マスタの全社税区分を名前でインデックス化（MF IDは事業者固有のため名前照合が正しい）
    const masterTaxes = getAllTaxCategories()
    const nameToMaster = new Map<string, TaxCategory>()
    for (const mt of masterTaxes) {
      nameToMaster.set(mt.name, mt as TaxCategory)
    }

    let matchedTaxCount = 0
    let unmatchedTaxCount = 0
    const taxMapped: TaxCategory[] = allTaxes.map((t, idx) => {
      const master = nameToMaster.get(t.name)
      if (master) {
        // 名前照合成功 → マスタの属性をそのまま維持（MFのavailableは信頼しない）
        matchedTaxCount++
        return {
          ...master,
          mfTaxId: t.id, // MF事業者固有ID（仕訳送信時に使用）
          displayOrder: idx + 1,
          source: 'mf' as const,
        }
      }
      // 名前がマッチしない → MF独自のカスタム税区分（ルールベースでマスタIDを生成）
      unmatchedTaxCount++
      const generatedId = generateTaxMasterId(t.name)
      if (!generatedId) {
        // ルール不一致 → 警告を追加（管理者に通知）
        hasWarnings = true
        results.push(`⚠️ 税区分「${t.name}」のマスタID自動生成に失敗。管理者に通知が必要です`)
        console.warn(`[mfRoutes] ルールベースID変換失敗: 「${t.name}」`)
      }
      const dir = guessDirectionFromName(t.name)
      return {
        taxCategoryId: generatedId ?? `UNKNOWN_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: t.name,
        shortName: t.abbreviation ?? '',
        direction: dir,
        qualified: guessQualifiedFromName(t.name, dir),
        aiSelectable: true,
        active: true,
        deprecated: false,
        effectiveFrom: DEFAULT_EFFECTIVE_FROM,
        effectiveTo: null,
        defaultVisible: true,
        displayOrder: idx + 1,
        isCustom: true,
        source: 'mf' as const,
        mfTaxId: t.id, // MF事業者固有ID（仕訳送信時に使用）
      }
    })
    saveClientTaxCategories(clientId, taxMapped)
    results.push(`✅ 税区分: ${allTaxes.length}件取得 → マスタ照合${matchedTaxCount}件, カスタム${unmatchedTaxCount}件（available=${allTaxes.filter(t => t.available).length}件）`)

    return c.json({
      success: true,
      hasWarnings,
      batchIds,
      results,
      summary: {
        office: office.name,
        periods: termList.slice(0, periodCount).map(t => t.fiscal_year),
        accountCount: available.length,
        taxCount: allTaxes.length,
        unmatchedAccounts: unmatchedList.map(a => a.name),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfRoutes] sync-all失敗: ${message}`)
    return c.json({
      success: false,
      error: 'MF全データ同期に失敗しました',
      detail: message,
      results,
    }, 500)
  }
})

// ===== MF課税方式別available管理 =====

/** GET /tax-available — 4方式分のavailableデータを返す */
app.get('/tax-available', (c) => {
  invalidateCache()
  return c.json(getAllTaxAvailable())
})

/** PUT /tax-available/:method — 特定方式のavailableを更新 */
app.put('/tax-available/:method', async (c) => {
  const method = c.req.param('method') as TaxMethodKey
  const validMethods: TaxMethodKey[] = ['proportional', 'individual', 'simplified', 'exempt']
  if (!validMethods.includes(method)) {
    return c.json({ error: `無効な方式: ${method}` }, 400)
  }
  const body = await c.req.json<{ available: Record<string, boolean> }>()
  saveTaxAvailable(method, body.available)
  return c.json({ ok: true, method, count: Object.values(body.available).filter(v => v).length })
})

// ---------- MF生データ保存・取得 ----------

/**
 * PUT /raw-data/:pattern — MF生データを保存
 *
 * ボディ: MfRawDataEnvelope（clientId, clientName, pattern, items等）
 */
app.put('/raw-data/:pattern', async (c) => {
  const pattern = c.req.param('pattern')
  const body = await c.req.json()
  saveMfRawData({ ...body, pattern })
  return c.json({ ok: true, pattern })
})

/**
 * GET /raw-data/:pattern — MF生データを取得（前回データ）
 */
app.get('/raw-data/:pattern', (c) => {
  const pattern = c.req.param('pattern')
  const data = loadMfRawData(pattern)
  if (!data) return c.json({ exists: false })
  return c.json({ exists: true, data })
})

/**
 * GET /raw-data — 全パターンのインポート履歴一覧
 */
app.get('/raw-data', (_c) => {
  const patterns = listMfRawPatterns()
  return _c.json({ patterns })
})

// ---------- 税区分インポート（バックエンド処理） ----------

/**
 * POST /import-taxes/preview — 差分プレビュー
 * body: { clientId: string }
 *
 * MFから税区分を取得し、マスタと照合して差分レポートを返す。
 * データの変更は行わない（自動ルールのavailable更新は行う）。
 */
app.post('/import-taxes/preview', async (c) => {
  const body = await c.req.json<{ clientId?: string }>()
  const clientId = body.clientId
  if (!clientId) return c.json({ error: 'clientId必須' }, 400)

  const status = getAuthStatus(clientId)
  if (!status.authenticated) {
    return c.json({ error: 'MF未認証です。先にOAuth認可を完了してください' }, 401)
  }

  try {
    const result = await previewTaxImport(clientId)
    return c.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfRoutes] import-taxes/preview失敗: ${message}`)
    return c.json({ error: '税区分インポートのプレビューに失敗しました', detail: message }, 500)
  }
})

/**
 * POST /import-taxes/apply — 差分適用
 * body: { clientId: string }
 *
 * 差分検知を再実行し（冪等性保証）、マスタに適用して保存する。
 */
app.post('/import-taxes/apply', async (c) => {
  const body = await c.req.json<{ clientId?: string }>()
  const clientId = body.clientId
  if (!clientId) return c.json({ error: 'clientId必須' }, 400)

  const status = getAuthStatus(clientId)
  if (!status.authenticated) {
    return c.json({ error: 'MF未認証です。先にOAuth認可を完了してください' }, 401)
  }

  try {
    const result = await applyTaxImport(clientId)
    return c.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfRoutes] import-taxes/apply失敗: ${message}`)
    return c.json({ error: '税区分インポートの適用に失敗しました', detail: message }, 500)
  }
})

/**
 * POST /import-client-taxes — 顧問先用税区分インポート（1回で全処理）
 * body: { clientId: string }
 *
 * consumptionTaxMode自動更新 + 税区分取得 + マスタ突合 + 保存 + available更新を一括実行。
 */
app.post('/import-client-taxes', async (c) => {
  const body = await c.req.json<{ clientId?: string }>()
  const clientId = body.clientId
  if (!clientId) return c.json({ error: 'clientId必須' }, 400)

  const status = getAuthStatus(clientId)
  if (!status.authenticated) {
    return c.json({ error: 'MF未認証です。先にOAuth認可を完了してください' }, 401)
  }

  try {
    const result = await importClientTaxes(clientId)
    return c.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfRoutes] import-client-taxes失敗: ${message}`)
    return c.json({ error: '顧問先税区分インポートに失敗しました', detail: message }, 500)
  }
})

/**
 * POST /import-master-accounts — マスタ勘定科目インポート（差分マージ）
 * body: { clientId: string }
 *
 * MFから勘定科目を取得し、全社マスタと差分マージして保存する。
 * clientIdはMF認証用（MCPトークンキー）。マスタ側は全社共通。
 * 名前変更検知は全社マスタにmfAccountIdがないため実施不可。
 * 顧問先データのmfAccountIdで検知する設計に移行予定。
 */
app.post('/import-master-accounts', async (c) => {
  const body = await c.req.json<{ clientId?: string }>()
  const clientId = body.clientId
  if (!clientId) return c.json({ error: 'clientId必須' }, 400)

  const status = getAuthStatus(clientId)
  if (!status.authenticated) {
    return c.json({ error: 'MF未認証です。先にOAuth認可を完了してください' }, 401)
  }

  try {
    const result = await importMasterAccounts(clientId)
    return c.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfRoutes] import-master-accounts失敗: ${message}`)
    return c.json({ error: 'マスタ勘定科目インポートに失敗しました', detail: message }, 500)
  }
})

export default app
