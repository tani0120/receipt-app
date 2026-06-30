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
  mcpFetchDepartments,
  mcpCreateJournal,
} from '../services/mfMcpClient'
import { mapOfficeToClient, mapTermSettingsToClient, type MfMappingResult } from '../../constants/mfFieldMapping'
import { importMfJournals, commitMfImport } from '../services/mfJournalImporter'
import { previewTaxImport, applyTaxImport, importClientTaxes } from '../services/mfTaxImportService'
import { importMasterAccounts } from '../services/mfAccountImportService'
import { createMockRepositories } from '../../repositories/mock'
const repos = createMockRepositories()
const accountMasterRepo = repos.accountMaster
const taxMasterRepo = repos.taxMaster
const clientRepo = repos.client
const journalRepo = repos.journal
const confirmedJournalRepo = repos.confirmedJournal
import type { MfSubAccountEntry, MfDepartmentEntry } from '../../types/shared-sub-account'
import { clearMappingCache, buildAllMaps } from '../services/mfMappingService'
import type { Account } from '../../types/shared-account'
import { deriveMfAccountGroup, deriveTarget } from '../../data/master/mf-account-category-mapping'
import { generateMasterId } from '../services/generateMasterId'
import { generateTaxMasterId, ensureUniqueTaxId } from '../services/taxIdGenerator'
import type { TaxCategory } from '../../types/shared-tax-category'
import { guessDirectionFromName, guessQualifiedFromName } from '../../types/shared-tax-category'
import { getAllTaxAvailable, saveTaxAvailable, invalidateCache, type TaxMethodKey } from '../services/mfTaxAvailableStore'
import { DEFAULT_EFFECTIVE_FROM } from '../../constants/mfApiConstants'
import { isIndividualType } from '../../constants/clientOptions'
import { readdirSync, existsSync as fsExists, readFileSync as fsRead } from 'fs'
import { join as pathJoin } from 'path'

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
  const client = await clientRepo.getById(clientId)
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
    const body = await c.req.json<{ clientId?: string; journal?: MfJournalPayload }>()
    const clientId = body.clientId
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
  const body = await c.req.json<{ clientIds?: string[] }>()
  const clientIds = body.clientIds
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
    const client = await clientRepo.getById(clientId)
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
      const officeResult = mapOfficeToClient(office, client)

      // 2. getTermSettings からマッピング（最新年度）
      const termSettingsList = await mcpFetchTermSettings(undefined, clientId)
      let termResult: MfMappingResult = { updates: {}, changes: [] }
      if (termSettingsList.length > 0) {
        termResult = mapTermSettingsToClient(termSettingsList[0]!, client)
      }

      // マージ（termSettings側が後勝ち）
      const allUpdates = { ...officeResult.updates, ...termResult.updates }
      const allChanges = [...officeResult.changes, ...termResult.changes]

      if (Object.keys(allUpdates).length > 0) {
        await clientRepo.update(clientId, allUpdates)
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
 * 取込内容（処理順: マスタ先→仕訳後）:
 *   1. 事業者情報（事業所ID・名前をトークンに紐付け）
 *   2. マスタ（勘定科目・補助科目・部門・税区分）
 *   3. マッピングキャッシュクリア（F-2対応）
 *   4. 仕訳データ（3期分ループ）— マスタが揃った状態でインポート
 *
 * 方針: Geminiトークン0円。直接API実行。
 * actionType: direct_api
 * costPerCall: 0
 */
app.post('/sync-all', async (c) => {
  const body = await c.req.json<{ clientId?: string }>().catch((): { clientId?: string } => ({}))
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

    // ===== 2. 勘定科目マスタ（名前照合でマスタID継承 + 税区分紐づけ） =====
    // P2修正（2026-06-07）: MFのBase64 IDではなくマスタのローマ字IDを継承
    // P3修正（2026-06-07）: defaultTaxCategoryIdをBの二段階変換で設定
    const allAccounts = await mcpFetchAccounts(clientId)
    const available = allAccounts.filter((a) => a.available)

    // 名前照合用: 全社マスタ + 現在の顧問先マスタの名前→科目マップ
    // 全社マスタを先に登録し、顧問先マスタで追加（顧問先の既存IDを優先）
    // → sync-all再実行時に前回生成したIDを継承し、AIの非決定性によるID不一致を防止
    const masterAccountsList = await accountMasterRepo.getMaster()
    const nameToMaster = new Map<string, Account>()
    for (const ma of masterAccountsList) {
      nameToMaster.set(ma.name, ma)
    }
    // 顧問先マスタが保存済みの場合のみ、独自科目の既存IDを継承
    // 初回sync-allでは未保存なのでスキップ（全社マスタクローンの2重登録を防止）
    const hasExistingClientData = await accountMasterRepo.hasClientAccounts(clientId)
    if (hasExistingClientData) {
      const clientAccountData = await accountMasterRepo.getClientAccountsFull(clientId)
      for (const ca of clientAccountData.accounts) {
        if (!nameToMaster.has(ca.name)) {
          nameToMaster.set(ca.name, ca)
        }
      }
    }

    // 税区分紐づけ用: MFのtax_id→マスタ税区分IDの二段階変換
    // （B系統 mfAccountImportService.ts L88-110 と同じロジック）
    const masterTaxesForAccounts = await taxMasterRepo.getMaster()
    const taxNameToMasterId = new Map<string, string>()
    for (const t of masterTaxesForAccounts) {
      taxNameToMasterId.set(t.name, t.taxCategoryId)
    }
    const mfTaxesForAccounts = await mcpFetchTaxes(clientId)
    const mfTaxIdToMasterId = new Map<string, string>()
    for (const mt of mfTaxesForAccounts) {
      const masterId = taxNameToMasterId.get(mt.name)
      if (masterId) mfTaxIdToMasterId.set(mt.id, masterId)
    }

    const unmatchedAccountNames: string[] = []
    // 既存IDセット（重複チェック用）: 全社 + 顧問先（保存済みの場合）両方のIDを含む
    const existingIds = new Set(masterAccountsList.map(a => a.accountId))
    if (hasExistingClientData) {
      const clientAccounts = await accountMasterRepo.getClientAccountsFull(clientId)
      for (const ca of clientAccounts.accounts) {
        existingIds.add(ca.accountId)
      }
    }
    const mapped: Account[] = []
    for (const [idx, a] of available.entries()) {
      const group = deriveMfAccountGroup(a.account_group, a.category)
      const master = nameToMaster.get(a.name)
      const masterTaxId = mfTaxIdToMasterId.get(a.tax_id)

      if (master) {
        // マスタにマッチ → マスタのローマ字IDを継承、MFフィールドを付与
        mapped.push({
          ...master,
           // MFから更新するフィールド（MFがSSOT: MF管理画面で設定される科目分類）
          // ※マスタの手動調整を上書きするが、MFの科目分類変更を反映するために必要
          category: a.category,
          accountGroup: group,
          // 税区分: MCPの値を優先（顧問先のMFが正）、取れない場合のみ全社マスタでフォールバック
          defaultTaxCategoryId: masterTaxId || master.defaultTaxCategoryId,
          sortOrder: idx + 1,
          // MF連携フィールド（顧問先データでのみ使用）
          mfAccountId: a.id,
          mfAccountGroup: a.account_group,
          mfFinancialStatementType: a.financial_statement_type,
        })
        continue
      }

      // マスタに未マッチ → Gemini 3.5-flashでローマ字ID生成（データ駆動フォールバック）
      unmatchedAccountNames.push(a.name)
      const target = deriveTarget(a.category, a.financial_statement_type)
      const suffix = target === 'individual' ? 'IND' : 'CORP'
      const accountId = await generateMasterId(a.name, suffix, existingIds)
      existingIds.add(accountId) // 次の重複チェック用に追加

      mapped.push({
        accountId,
        name: a.name,
        target,
        accountGroup: group,
        category: a.category,
        defaultTaxCategoryId: masterTaxId,
        hidden: false,
        effectiveFrom: DEFAULT_EFFECTIVE_FROM,
        effectiveTo: null,
        sortOrder: idx + 1,
        mfAccountId: a.id,
        mfAccountGroup: a.account_group,
        mfFinancialStatementType: a.financial_statement_type,
      })
    }
    await accountMasterRepo.saveMfAccounts(clientId, mapped)

    // 5b. 前回の顧問先マスタにあって今回MFにない科目 → hidden=trueで保持
    let hiddenCount = 0
    if (hasExistingClientData) {
      const prevAccounts = (await accountMasterRepo.getClientAccountsFull(clientId)).accounts
      const currentNames = new Set(mapped.map(a => a.name))
      for (const prev of prevAccounts) {
        if (!currentNames.has(prev.name) && !prev.hidden) {
          mapped.push({ ...prev, hidden: true })
          hiddenCount++
        }
      }
      if (hiddenCount > 0) {
        // hidden行を含めて再保存
        await accountMasterRepo.saveMfAccounts(clientId, mapped)
      }
    }

    if (unmatchedAccountNames.length > 0) {
      console.warn(`[mfRoutes] sync-all: マスタ未マッチ科目${unmatchedAccountNames.length}件（暫定ID）: ${unmatchedAccountNames.join(', ')}`)
      hasWarnings = true
    }

    const matchedCount = available.length - unmatchedAccountNames.length
    let accountMsg = `✅ 勘定科目: ${allAccounts.length}件取得 → ${available.length}件保存`
    accountMsg += `（マッチ: ${matchedCount}件 / 未マッチ: ${unmatchedAccountNames.length}件）`
    if (hiddenCount > 0) accountMsg += `（非表示化: ${hiddenCount}件）`
    results.push(accountMsg)

    // ===== 2b. 補助科目（科目データからsub_accounts抽出） =====
    const subAccountsMap: Record<string, MfSubAccountEntry[]> = {}
    for (const mfAcct of allAccounts) {
      if (!mfAcct.sub_accounts || mfAcct.sub_accounts.length === 0) continue
      // MF科目名→sugusru科目IDに変換（名前照合）
      const matched = mapped.find(m => m.name === mfAcct.name)
      if (!matched) continue
      subAccountsMap[matched.accountId] = mfAcct.sub_accounts.map(s => ({
        mfSubId: s.id,
        name: s.name,
        mfTaxId: s.tax_id,
        taxCategoryId: mfTaxIdToMasterId.get(s.tax_id),
        searchKey: s.search_key,
      }))
    }
    await accountMasterRepo.persistSubAccounts(clientId, subAccountsMap)
    const subTotal = Object.values(subAccountsMap).reduce((s, arr) => s + arr.length, 0)
    results.push(`✅ 補助科目: ${subTotal}件（${Object.keys(subAccountsMap).length}科目）`)

    // ===== 2c. 部門（MCPから独立取得） =====
    try {
      const mfDepts = await mcpFetchDepartments(clientId)
      const deptEntries: MfDepartmentEntry[] = mfDepts.map(d => ({
        mfDeptId: d.id,
        name: d.name,
        parentId: d.parent_id,
        searchKey: d.search_key,
      }))
      await accountMasterRepo.persistDepartments(clientId, deptEntries)
      results.push(`✅ 部門: ${deptEntries.length}件`)
    } catch (deptErr) {
      console.warn(`[mfRoutes] sync-all: 部門取得失敗（続行）:`, deptErr instanceof Error ? deptErr.message : deptErr)
      results.push(`⚠️ 部門: 取得失敗（スキップ）`)
      hasWarnings = true
    }

    // ===== 2d. 税区分マスタ（名前照合でマスタ属性を引き継ぐ） =====
    const allTaxes = await mcpFetchTaxes(clientId)
    // マスタの全社税区分を名前でインデックス化（MF IDは事業者固有のため名前照合が正しい）
    const masterTaxList = await taxMasterRepo.getMaster()
    const nameToMasterTax = new Map<string, TaxCategory>()
    for (const mt of masterTaxList) {
      nameToMasterTax.set(mt.name, mt)
    }

    let matchedTaxCount = 0
    let unmatchedTaxCount = 0
    // 既存IDセット（重複チェック用）: 全社マスタのIDを含む
    const existingTaxIds = new Set(masterTaxList.map(mt => mt.taxCategoryId))
    const taxMapped: TaxCategory[] = allTaxes.map((t, idx) => {
      const master = nameToMasterTax.get(t.name)
      if (master) {
        // 名前照合成功 → マスタの属性をそのまま維持（MFのavailableは信頼しない）
        matchedTaxCount++
        return {
          ...master,
          mfTaxId: t.id, // MF事業者固有ID（仕訳送信時に使用）
          displayOrder: idx + 1,
          source: 'mcp' as const,
        }
      }
      // 名前がマッチしない → MF独自のカスタム税区分（ルールベースでマスタIDを生成）
      unmatchedTaxCount++
      const baseId = generateTaxMasterId(t.name)
      if (!baseId) {
        // ルール不一致 → throw で停止（data/tax-id-rules.json にルール追加が必要）
        throw new Error(`税区分「${t.name}」のルールベースID変換に失敗。data/tax-id-rules.json にルールを追加してください`)
      }
      const generatedId = ensureUniqueTaxId(baseId, existingTaxIds)
      existingTaxIds.add(generatedId) // 次の重複チェック用に追加
      const dir = guessDirectionFromName(t.name)
      return {
        taxCategoryId: generatedId,
        name: t.name,
        shortName: t.abbreviation ?? '',
        direction: dir,
        qualified: guessQualifiedFromName(t.name, dir),
        aiSelectable: true,
        hidden: false,
        effectiveFrom: DEFAULT_EFFECTIVE_FROM,
        effectiveTo: null,
        defaultVisible: true,
        displayOrder: idx + 1,
        isCustom: true,
        source: 'mcp' as const,
        mfTaxId: t.id, // MF事業者固有ID（仕訳送信時に使用）
      }
    })
    await taxMasterRepo.saveClient(clientId, taxMapped)
    results.push(`✅ 税区分: ${allTaxes.length}件取得 → マスタ照合${matchedTaxCount}件, カスタム${unmatchedTaxCount}件（available=${allTaxes.filter(t => t.available).length}件）`)

    // ===== 3. マッピングキャッシュクリア＋再構築（マスタ保存完了 → 仕訳インポート前） =====
    // F-2対応: buildAllMaps()の5分キャッシュが古いマスタを参照するのを防止
    // 1回だけMCPを呼んでキャッシュを再構築。3期ループ内では使い回す（MCP二重呼び出し回避）
    clearMappingCache(clientId)
    const maps = await buildAllMaps(clientId)

    // ===== 4. 仕訳データ（3期分）— マスタが揃った状態でインポート =====
    const termList = await mcpFetchTermSettings(undefined, clientId)
    const periodCount = 3

    for (let i = 0; i < periodCount; i++) {
      const selected = termList[i]
      if (!selected) break

      const journals = await mcpFetchJournals(
        { start_date: selected.start_date, end_date: selected.end_date },
        clientId,
      )

      const importResult = await importMfJournals(journals, clientId, 'tax_included', maps)
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
        unmatchedAccounts: unmatchedAccountNames,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfRoutes] sync-all失敗: ${message}`)
    if (err instanceof Error && err.stack) console.error(err.stack)
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
  const methodRaw = c.req.param('method')
  const validMethods: TaxMethodKey[] = ['proportional', 'individual', 'simplified', 'exempt']
  if (!validMethods.includes(methodRaw as TaxMethodKey)) {
    return c.json({ error: `無効な方式: ${methodRaw}` }, 400)
  }
  const method: TaxMethodKey = methodRaw as TaxMethodKey
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

// ---------- 顧問先別 勘定科目MFインポート ----------

/**
 * POST /import-client-accounts — 顧問先の勘定科目をMFから取得して保存
 *
 * sync-allの科目処理と同じロジック:
 * 1. 全社マスタ + 顧問先マスタと名前照合 → マッチしたらマスタIDを継承
 * 2. 未マッチ → Gemini 3.5-flashでローマ字ID生成
 * 3. 税区分は二段階変換（MF tax_id → MF税区分名 → マスタ税区分ID）
 *
 * フロント: MockClientAccountsPage.vue のMFインポートボタンから呼ばれる
 */
app.post('/import-client-accounts', async (c) => {
  const clientId = c.req.query('clientId') ?? 'default'
  const status = getAuthStatus(clientId)
  if (!status.authenticated) {
    return c.json({ error: 'MF未認証です。先にOAuth認可を完了してください' }, 401)
  }

  try {
    // 0. 顧問先のtype（corp/individual）を取得 → 科目のtargetに使用
    const clientData = await clientRepo.getById(clientId)
    const clientType = isIndividualType(clientData?.type) ? 'individual' : 'corp'

    // 1. MFから勘定科目取得
    const allAccounts = await mcpFetchAccounts(clientId)
    const available = allAccounts.filter((a) => a.available)

    // 2. 名前照合マップ構築（全社マスタ + 顧問先マスタ）
    const masterAccountsList = await accountMasterRepo.getMaster()
    const nameToMaster = new Map<string, Account>()
    for (const ma of masterAccountsList) {
      nameToMaster.set(ma.name, ma)
    }
    const hasExisting = await accountMasterRepo.hasClientAccounts(clientId)
    if (hasExisting) {
      const clientData = await accountMasterRepo.getClientAccountsFull(clientId)
      for (const ca of clientData.accounts) {
        if (!nameToMaster.has(ca.name)) {
          nameToMaster.set(ca.name, ca)
        }
      }
    }

    // 3. 税区分紐づけ（二段階変換）
    const masterTaxes = await taxMasterRepo.getMaster()
    const taxNameToId = new Map<string, string>()
    for (const t of masterTaxes) {
      taxNameToId.set(t.name, t.taxCategoryId)
    }
    const mfTaxes = await mcpFetchTaxes(clientId)
    const mfTaxIdToMasterId = new Map<string, string>()
    for (const mt of mfTaxes) {
      const mid = taxNameToId.get(mt.name)
      if (mid) mfTaxIdToMasterId.set(mt.id, mid)
    }

    // 4. 科目マッピング
    const unmatchedNames: string[] = []
    const existingIds = new Set(masterAccountsList.map(a => a.accountId))
    if (hasExisting) {
      const clientAccounts = await accountMasterRepo.getClientAccountsFull(clientId)
      for (const ca of clientAccounts.accounts) {
        existingIds.add(ca.accountId)
      }
    }

    const mapped: Account[] = []
    for (const [idx, a] of available.entries()) {
      const group = deriveMfAccountGroup(a.account_group, a.category)
      const master = nameToMaster.get(a.name)
      const masterTaxId = mfTaxIdToMasterId.get(a.tax_id)

      if (master) {
        mapped.push({
          ...master,
          target: clientType,
          category: a.category,
          accountGroup: group,
          defaultTaxCategoryId: master.defaultTaxCategoryId || masterTaxId,
          sortOrder: idx + 1,
          mfAccountId: a.id,
          mfAccountGroup: a.account_group,
          mfFinancialStatementType: a.financial_statement_type,
        })
        continue
      }

      unmatchedNames.push(a.name)
      const suffix = isIndividualType(clientType) ? 'IND' : 'CORP'
      const accountId = await generateMasterId(a.name, suffix, existingIds)
      existingIds.add(accountId)

      mapped.push({
        accountId,
        name: a.name,
        target: clientType,
        accountGroup: group,
        category: a.category,
        defaultTaxCategoryId: masterTaxId,
        hidden: false,
        effectiveFrom: DEFAULT_EFFECTIVE_FROM,
        effectiveTo: null,
        sortOrder: idx + 1,
        mfAccountId: a.id,
        mfAccountGroup: a.account_group,
        mfFinancialStatementType: a.financial_statement_type,
      })
    }

    // 5. 科目保存
    await accountMasterRepo.saveMfAccounts(clientId, mapped)

    // 6. 補助科目（科目データからsub_accounts抽出）
    const subAccountsMap: Record<string, MfSubAccountEntry[]> = {}
    for (const mfAcct of allAccounts) {
      if (!mfAcct.sub_accounts || mfAcct.sub_accounts.length === 0) continue
      const matchedAcct = mapped.find(m => m.name === mfAcct.name)
      if (!matchedAcct) continue
      subAccountsMap[matchedAcct.accountId] = mfAcct.sub_accounts.map(s => ({
        mfSubId: s.id,
        name: s.name,
        mfTaxId: s.tax_id,
        taxCategoryId: mfTaxIdToMasterId.get(s.tax_id),
        searchKey: s.search_key,
      }))
    }
    await accountMasterRepo.persistSubAccounts(clientId, subAccountsMap)
    const subTotal = Object.values(subAccountsMap).reduce((s, arr) => s + arr.length, 0)

    // 7. 部門（MCPから独立取得）
    let deptCount = 0
    try {
      const mfDepts = await mcpFetchDepartments(clientId)
      const deptEntries: MfDepartmentEntry[] = mfDepts.map(d => ({
        mfDeptId: d.id,
        name: d.name,
        parentId: d.parent_id,
        searchKey: d.search_key,
      }))
      await accountMasterRepo.persistDepartments(clientId, deptEntries)
      deptCount = deptEntries.length
    } catch (deptErr) {
      console.warn(`[mfRoutes] import-client-accounts: 部門取得失敗（続行）:`, deptErr instanceof Error ? deptErr.message : deptErr)
    }

    // 8. 税区分（名前照合でマスタ属性を引き継ぐ）
    const masterTaxList = await taxMasterRepo.getMaster()
    const nameToMasterTax = new Map<string, TaxCategory>()
    for (const mt of masterTaxList) {
      nameToMasterTax.set(mt.name, mt)
    }
    const existingTaxIds = new Set(masterTaxList.map(mt => mt.taxCategoryId))
    let matchedTaxCount = 0
    let unmatchedTaxCount = 0
    const taxMapped: TaxCategory[] = mfTaxes.map((t, idx) => {
      const masterTax = nameToMasterTax.get(t.name)
      if (masterTax) {
        matchedTaxCount++
        return {
          ...masterTax,
          mfTaxId: t.id,
          displayOrder: idx + 1,
          source: 'mcp' as const,
        }
      }
      unmatchedTaxCount++
      const baseId = generateTaxMasterId(t.name)
      if (!baseId) {
        throw new Error(`税区分「${t.name}」のルールベースID変換に失敗。data/tax-id-rules.json にルールを追加してください`)
      }
      const generatedId = ensureUniqueTaxId(baseId, existingTaxIds)
      existingTaxIds.add(generatedId)
      const dir = guessDirectionFromName(t.name)
      return {
        taxCategoryId: generatedId,
        name: t.name,
        shortName: t.abbreviation ?? '',
        direction: dir,
        qualified: guessQualifiedFromName(t.name, dir),
        aiSelectable: true,
        hidden: false,
        effectiveFrom: DEFAULT_EFFECTIVE_FROM,
        effectiveTo: null,
        defaultVisible: true,
        displayOrder: idx + 1,
        isCustom: true,
        source: 'mcp' as const,
        mfTaxId: t.id,
      }
    })
    await taxMasterRepo.saveClient(clientId, taxMapped)

    const matchedCount = available.length - unmatchedNames.length
    return c.json({
      ok: true,
      total: allAccounts.length,
      available: available.length,
      matched: matchedCount,
      unmatched: unmatchedNames.length,
      unmatchedNames,
      subAccountCount: subTotal,
      departmentCount: deptCount,
      taxCount: mfTaxes.length,
      taxMatched: matchedTaxCount,
      taxUnmatched: unmatchedTaxCount,
      message: `勘定科目${available.length}件 / 補助科目${subTotal}件 / 部門${deptCount}件 / 税区分${mfTaxes.length}件を保存`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfRoutes] import-client-accounts失敗: ${message}`)
    return c.json({ error: '顧問先勘定科目インポートに失敗しました', detail: message }, 500)
  }
})

// ────────────────────────────────────────────
// 個別仕訳インポート（history-importページ用）
// ────────────────────────────────────────────

/**
 * POST /import-journals — 特定顧問先のMF仕訳を直接取り込む
 *
 * sync-allのステップ2-4を個別顧問先向けに切り出したAPI。
 * history-importページの「MFから直接取込」ボタンから呼ばれる。
 *
 * 処理フロー:
 *   1. マスタ最新化（import-client-accounts相当）
 *   2. マッピングキャッシュクリア＋再構築
 *   3. 仕訳取得（periodCount期分）→ importMfJournals(maps使い回し)
 *
 * リクエスト:
 *   { clientId: string, periodCount?: number }
 *   periodCount省略時は3期分
 */
app.post('/import-journals', async (c) => {
  const body = await c.req.json<{ clientId?: string; periodCount?: number }>()
  const clientId = body.clientId
  if (!clientId) {
    return c.json({ error: 'clientIdは必須です' }, 400)
  }

  const periodCount = body.periodCount ?? 3
  const results: string[] = []
  const batchIds: string[] = []

  try {
    // ===== 1. マスタ最新化（import-client-accounts相当） =====
    results.push('⏳ マスタ最新化中...')

    // 1a. 科目
    const allAccounts = await mcpFetchAccounts(clientId)
    const existingAccounts = await accountMasterRepo.hasClientAccounts(clientId)
      ? (await accountMasterRepo.getClientAccountsFull(clientId)).accounts
      : await accountMasterRepo.getMaster()
    const existingByName = new Map(existingAccounts.map(a => [a.name, a]))

    const suffix = await (async () => {
      const client = await clientRepo.getById(clientId)
      return (client && isIndividualType(client.type)) ? 'IND' : 'CORP'
    })()
    const existingIds = new Set(existingAccounts.map(a => a.accountId))

    const mapped: Account[] = []
    for (const mf of allAccounts) {
      const existing = existingByName.get(mf.name)
      if (existing) {
        mapped.push({ ...existing, source: 'mcp' as const })
      } else {
        const accountId = await generateMasterId(mf.name, suffix, existingIds)
        existingIds.add(accountId)
        mapped.push({
          accountId,
          name: mf.name,
          target: deriveTarget(mf.name, suffix === 'IND' ? 'individual' : 'corp'),
          accountGroup: deriveMfAccountGroup(mf.name),
          category: '',
          defaultTaxCategoryId: undefined,
          hidden: false,
          effectiveFrom: DEFAULT_EFFECTIVE_FROM,
          effectiveTo: null,
          sortOrder: mapped.length + 1,
          source: 'mcp' as const,
          isCustom: false,
        })
      }
    }
    const available = mapped.filter(a => {
      const mf = allAccounts.find(m => m.name === a.name)
      return mf?.available !== false
    })
    await accountMasterRepo.saveMfAccounts(clientId, available)
    results.push(`✅ 科目: ${available.length}件保存`)

    // 1b. 税区分
    const mfTaxes = await mcpFetchTaxes(clientId)
    const existingTaxes = await taxMasterRepo.getMaster()
    const existingTaxByName = new Map(existingTaxes.map(t => [t.name, t]))
    const existingTaxIds = new Set(existingTaxes.map(t => t.taxCategoryId))

    const taxMapped: TaxCategory[] = mfTaxes.map((t, idx) => {
      const existing = existingTaxByName.get(t.name)
      if (existing) {
        return { ...existing, hidden: !t.available, source: 'mcp' as const, mfTaxId: t.id }
      }
      const baseId = generateTaxMasterId(t.name)
      const taxId = baseId
        ? ensureUniqueTaxId(baseId, existingTaxIds)
        : `CUSTOM_TAX_${t.name.replace(/\s+/g, '_').toUpperCase()}`
      existingTaxIds.add(taxId)
      const dir = guessDirectionFromName(t.name)
      return {
        taxCategoryId: taxId,
        name: t.name,
        shortName: t.abbreviation ?? '',
        direction: dir,
        qualified: guessQualifiedFromName(t.name, dir),
        aiSelectable: true,
        hidden: !t.available,
        effectiveFrom: DEFAULT_EFFECTIVE_FROM,
        effectiveTo: null,
        defaultVisible: true,
        displayOrder: idx + 1,
        isCustom: true,
        source: 'mcp' as const,
        mfTaxId: t.id,
      }
    })
    await taxMasterRepo.saveClient(clientId, taxMapped)
    results.push(`✅ 税区分: ${mfTaxes.length}件保存`)

    // ===== 2. マッピングキャッシュクリア＋再構築 =====
    clearMappingCache(clientId)
    const maps = await buildAllMaps(clientId)
    results.push('✅ マッピング再構築完了')

    // ===== 3. 仕訳取得（periodCount期分） =====
    const termList = await mcpFetchTermSettings(undefined, clientId)

    // 強制取込: 既存のconfirmed仕訳を全削除してから再挿入
    // MF連携先ではCSV無効（グレーアウト済み）なので全削除で安全
    const deleteResult = await confirmedJournalRepo.deleteByClientId(clientId)
    if (deleteResult.removed > 0) {
      results.push(`🗑️ 既存データ${deleteResult.removed}件を削除（最新データで再取込）`)
    }

    for (let i = 0; i < periodCount; i++) {
      const selected = termList[i]
      if (!selected) break

      const journals = await mcpFetchJournals(
        { start_date: selected.start_date, end_date: selected.end_date },
        clientId,
      )

      const importResult = await importMfJournals(journals, clientId, 'tax_included', maps)
      batchIds.push(importResult.batchId)

      if (importResult.committed) {
        results.push(
          `✅ 仕訳（${selected.fiscal_year}期: ${selected.start_date}〜${selected.end_date}）: ` +
          `${journals.length}件取得 → ${importResult.added}件追加, ${importResult.skipped}件スキップ（重複）`
        )
      } else {
        // 暫定: skippedErrors/warningsがあっても変換成功分（converted）は保存する
        // skippedErrorsは変換前にスキップ済み→convertedに含まれない→保存して安全
        // 将来UIで承認フローを実装した場合はこのブロックを削除
        const forceResult = await commitMfImport(importResult.batchId)
        if (forceResult) {
          results.push(
            `✅ 仕訳（${selected.fiscal_year}期: ${selected.start_date}〜${selected.end_date}）: ` +
            `${journals.length}件取得 → ${forceResult.added}件追加, ${forceResult.skipped}件スキップ（重複）`
          )
        } else {
          results.push(
            `⚠️ 仕訳（${selected.fiscal_year}期: ${selected.start_date}〜${selected.end_date}）: ` +
            `${journals.length}件取得 → commit失敗`
          )
        }
      }

      // info（自動発番通知）も結果に含める
      for (const info of importResult.infos) {
        results.push(`  ℹ️ ${info.message}`)
      }
      for (const err of importResult.skippedErrors) {
        results.push(`  ❌ ${err.message}`)
      }
      for (const warn of importResult.warnings) {
        results.push(`  ⚠️ ${warn.message}`)
      }
    }

    return c.json({
      success: true,
      batchIds,
      results,
      summary: {
        accountCount: available.length,
        taxCount: mfTaxes.length,
        periodCount: Math.min(periodCount, termList.length),
      },
      // 全期情報（フロントで年度別サマリーに使用）
      fiscalYears: termList.map(t => ({
        fiscalYear: t.fiscal_year,
        startDate: t.start_date,
        endDate: t.end_date,
      })),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfRoutes] import-journals失敗: ${message}`)
    if (err instanceof Error && err.stack) console.error(err.stack)
    return c.json({
      success: false,
      error: 'MF仕訳インポートに失敗しました',
      detail: message,
      results,
    }, 500)
  }
})

// ────────────────────────────────────────────
// 既存confirmed_journals一括正規化（Phase C-1）
// ────────────────────────────────────────────

/**
 * POST /normalize-journals — 既存仕訳のMF科目名→accountId一括変換
 *
 * confirmed_journalsに保存されているMF科目名（例: "仕入高"）を
 * accountId（例: "PURCHASES"）に変換する。
 *
 * リクエスト:
 *   { dryRun?: boolean }  // trueなら書き込まず結果のみ返す
 */
app.post('/normalize-journals', async (c) => {
  const dryRun = c.req.query('dryRun') === 'true' || false

  // 全社マスタ + 顧問先MFデータから名前→IDマップ構築
  const accountNameToId = new Map<string, string>()
  const allAccountsMaster = await accountMasterRepo.getMaster()
  for (const a of allAccountsMaster) {
    accountNameToId.set(a.name, a.accountId)
  }

  // 顧問先別MFデータ（より具体的なので上書き）
  const clientMfDir = pathJoin(process.cwd(), 'data', 'client_mf_accounts')
  if (fsExists(clientMfDir)) {
    const files: string[] = readdirSync(clientMfDir)
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      try {
        const raw = fsRead(pathJoin(clientMfDir, file), 'utf-8')
        const data = JSON.parse(raw)
        const accounts: Array<{ accountId: string; name: string }> = data.accounts ?? data
        for (const a of accounts) {
          accountNameToId.set(a.name, a.accountId)
        }
      } catch { /* 読めないファイルはスキップ */ }
    }
  }

  // 税区分マスタから名前→IDマップ構築
  const taxNameToId = new Map<string, string>()
  const allTaxesMaster = await taxMasterRepo.getMaster()
  for (const t of allTaxesMaster) {
    taxNameToId.set(t.name, t.taxCategoryId)
  }

  // 正規化判定（大文字英字+アンダースコアのみならaccountId済み）
  const isNormalized = (v: string) => /^[A-Z][A-Z0-9_]+$/.test(v)

  // clientIdループで処理（Repository経由）
  const allClients = await clientRepo.getAll()
  const clientIds = [...new Set(allClients.map(cl => cl.clientId))]

  let accountConverted = 0
  let accountAlready = 0
  let accountMiss = 0
  let taxConverted = 0
  let taxAlready = 0
  let taxMiss = 0
  let taxNull = 0
  const missedAccounts = new Set<string>()
  const missedTaxes = new Set<string>()
  let totalJournals = 0

  for (const clientId of clientIds) {
    const journals = await confirmedJournalRepo.getByClientId(clientId)
    if (journals.length === 0) continue
    totalJournals += journals.length

    for (const j of journals) {
      const entries = [...j.debit_entries, ...j.credit_entries]
      for (const entry of entries) {
        // 科目
        const acct = entry.account
        if (!acct) {
          accountMiss++
        } else if (isNormalized(acct)) {
          accountAlready++
        } else {
          const id = accountNameToId.get(acct)
          if (id) {
            if (!dryRun) entry.account = id
            accountConverted++
          } else {
            missedAccounts.add(acct)
            accountMiss++
          }
        }

        // 税区分
        if (entry.tax_category_id === null) {
          taxNull++
        } else if (isNormalized(entry.tax_category_id)) {
          taxAlready++
        } else {
          const id = taxNameToId.get(entry.tax_category_id)
          if (id) {
            if (!dryRun) entry.tax_category_id = id
            taxConverted++
          } else {
            missedTaxes.add(entry.tax_category_id)
            taxMiss++
          }
        }
      }
    }

    // 書き戻し
    if (!dryRun) {
      await confirmedJournalRepo.replaceByClientId(clientId, journals)
    }
  }

  return c.json({
    success: true,
    dryRun,
    account: {
      converted: accountConverted,
      alreadyNormalized: accountAlready,
      missed: accountMiss,
      missedNames: [...missedAccounts],
    },
    tax: {
      converted: taxConverted,
      alreadyNormalized: taxAlready,
      null: taxNull,
      missed: taxMiss,
      missedNames: [...missedTaxes],
    },
    totalJournals,
  })
})

// ────────────────────────────────────────────
// MCP仕訳送信（sugusuru → MF）
// ────────────────────────────────────────────
import { sendBatchToMf, applyMfSendResults } from '../services/mfJournalSender'
import type { SourceJournal, MfJournalPayload } from '../services/journalToMfConverter'



/**
 * POST /send-journals/:clientId — 未出力仕訳をMFにMCP送信
 *
 * リクエストボディ（任意）:
 *   { journalIds?: string[] }  — 送信対象を絞り込む場合
 *
 * レスポンス:
 *   { total, successCount, failureCount, results, elapsedMs }
 */
app.post('/send-journals/:clientId', async (c) => {
  const clientId = c.req.param('clientId')
  if (!clientId) return c.json({ error: '顧問先IDが未指定です' }, 400)

  // MF OAuth認証チェック（実際にMCPで通信可能か）
  const authStatus = getAuthStatus(clientId)
  if (!authStatus.authenticated) {
    return c.json({ error: 'MF未連携（OAuth未認証）です。先にMF連携を完了してください。' }, 401)
  }

  // 送信対象の取得（未出力仕訳）
  const allJournals = await journalRepo.list(clientId)
  let targets = allJournals.filter(j =>
    j.status === null &&
    j.deleted_at === null &&
    !(j.labels || []).includes('EXPORT_EXCLUDE')
  )

  // journalIds指定時は絞り込み
  const body = await c.req.json<{ journalIds?: string[] }>().catch((): { journalIds?: string[] } => ({}))
  const requestedIds = body.journalIds
  if (requestedIds && Array.isArray(requestedIds) && requestedIds.length > 0) {
    targets = targets.filter(j => requestedIds.includes(j.journalId))
  }

  if (targets.length === 0) {
    return c.json({ total: 0, successCount: 0, failureCount: 0, results: [], elapsedMs: 0, message: '送信対象の仕訳がありません' })
  }

  // 顧問先の課税方式を取得し、SourceJournal用の値域にマッピング
  // Client: individual/proportional/simplified/exempt
  // SourceJournal: general_individual/general_proportional/simplified/exempt
  const client = await clientRepo.getById(clientId)
  const clientTaxMode = client?.consumptionTaxMode
  const TAX_MODE_MAP: Record<string, SourceJournal['consumption_tax_mode']> = {
    individual: 'general_individual',
    proportional: 'general_proportional',
    simplified: 'simplified',
    exempt: 'exempt',
  }
  const consumptionTaxMode = clientTaxMode ? TAX_MODE_MAP[clientTaxMode] : undefined

  // SourceJournal形式に変換
  // vendor_name→directionに応じてdebit/creditの適切な側にtrade_partner_name注入
  // expense（出金）→借方に取引先、income（入金）→貸方に取引先
  // consumption_tax_mode=exempt → is_tax_exempt=true を導出（免税事業者のinvoice_kind制御）
  const sourceJournals: SourceJournal[] = targets.map(j => {
    const isIncome = j.direction === 'income'
    const vendorName = j.vendor_name ?? null
    const debitEntries = (j.debit_entries || []).map((e, idx) => ({
      ...e,
      trade_partner_name: (!isIncome && idx === 0) ? vendorName : null,
    }))
    const creditEntries = (j.credit_entries || []).map((e, idx) => ({
      ...e,
      trade_partner_name: (isIncome && idx === 0) ? vendorName : null,
    }))
    return {
      journalId: j.journalId,
      voucher_date: j.voucher_date,
      description: j.description || '',
      memo: j.memo,
      invoice_status: j.invoice_status,
      is_tax_exempt: consumptionTaxMode === 'exempt',
      consumption_tax_mode: consumptionTaxMode,
      debit_entries: debitEntries,
      credit_entries: creditEntries,
    }
  })

  // バッチ送信
  const tokenKey = clientId
  const batchResult = await sendBatchToMf(sourceJournals, tokenKey)

  // 送信成功した仕訳にMF-IDを書き戻し、status='exported'に変更
  // 断絶#39修正: updateJournal経由で永続化（saveJournals手動呼び出し不要）
  await applyMfSendResults(clientId, batchResult.results)

  return c.json(batchResult)
})

export default app
