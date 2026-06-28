/**
 * mfMappingService.ts — スグスル概念ID → MF-ID 変換マップ生成
 *
 * 顧問先別の科目データ（マスタ+Override合成結果）の名前と
 * MF API（MCP経由getAccounts/getTaxes等）の名前を突合し、
 * { スグスル概念ID: mf固有ID } のマッピングテーブルを生成する。
 *
 * 準拠: mf_sugusru_field_mapping.md §5、§53 §11
 */

import { join } from 'path'
import { getAccountGroupDirection } from '../../data/master/account-category-rules'
import { getClientAccounts } from './accountMasterApi'
import { buildNameMap } from '../../utils/matchByName'
import {
  mcpFetchAccounts,
  mcpFetchTaxes,
  mcpFetchSubAccounts,
  mcpFetchDepartments,
  mcpFetchTradePartners,
  mcpFetchTermSettings,
  type MfMcpSubAccount,
  type MfMcpDepartment,
} from './mfMcpClient'

// ────────────────────────────────────────────
// 型定義
// ────────────────────────────────────────────

/** 科目マッピング（スグスル概念ID → MF科目ID） */
export interface AccountMapping {
  /** スグスル概念ID（例: 'CASH'） */
  sugusruId: string
  /** スグスル科目名（例: '現金'） */
  sugusruName: string
  /** MF科目ID（例: 'cqFKUwCs6dvrA8AitD0DzA%3D%3D'）。未マッチならnull */
  mfId: string | null
  /** MF科目名（マッチした場合。通常スグスル科目名と同一） */
  mfName: string | null
}

/** 税区分マッピング（スグスル概念ID → MF税区分ID） */
export interface TaxMapping {
  sugusruId: string
  sugusruName: string
  mfId: string | null
  mfName: string | null
}

/** 全マッピングテーブル */
export interface MfMappingTables {
  /** 科目: { [スグスル概念ID]: mf科目ID } */
  accountMap: Map<string, string>
  /** 税区分: { [スグスル概念ID]: mf税区分ID } */
  taxMap: Map<string, string>
  /** 補助科目: { [名前]: mf補助科目ID } */
  subAccountMap: Map<string, string>
  /** 部門: { [名前]: mf部門ID } */
  departmentMap: Map<string, string>
  /** 取引先: { [名前]: mf取引先コード } */
  tradePartnerMap: Map<string, string>
  /** 科目方向: { [スグスル概念ID]: 'sales' | 'purchase' | 'common' } */
  accountDirectionMap: Map<string, 'sales' | 'purchase' | 'common'>
  /** 税区分方向: { [スグスル概念ID]: 'sales' | 'purchase' | 'common' } */
  taxDirectionMap: Map<string, 'sales' | 'purchase' | 'common'>
  /** 簡易課税専用税区分IDのSet（データ駆動。IDパターンマッチ代替） */
  taxSimplifiedOnlySet: Set<string>
  /** 個別対応方式専用税区分IDのSet（データ駆動。_COMMON_/_NT_パターン代替） */
  taxIndividualOnlySet: Set<string>
  /** 逆マップ: MF科目名 → スグスル概念ID（MF→スグスル取込用） */
  reverseAccountMap: Map<string, string>
  /** 逆マップ: MF税区分名 → スグスル概念ID（MF→スグスル取込用） */
  reverseTaxMap: Map<string, string>
  /** マッチ失敗の科目（送信前警告用） */
  unmatchedAccounts: AccountMapping[]
  /** マッチ失敗の税区分（送信前警告用） */
  unmatchedTaxes: TaxMapping[]
  /**
   * 事業者の課税方式（MF APIから自動取得）
   * 実測値: 'FREE'=免税 / 'SIMPLE'=簡易 / 'INDIVIDUAL_ALLOCATION'=個別対応 / 'PROPORTIONAL_ALLOCATION'=一括比例
   * null=取得失敗（安全策としてinvoice_kind除去）
   */
  taxMethod: string | null
  /** 生成日時 */
  createdAt: Date
}

// ────────────────────────────────────────────
// スグスルマスタ読み込み
// ────────────────────────────────────────────

import { readFile } from 'fs/promises'

interface SugusruAccount {
  accountId: string
  name: string
  accountGroup?: string
  category?: string
}

interface SugusruTax {
  taxCategoryId: string
  name: string
  direction?: 'sales' | 'purchase' | 'common'
  simplifiedOnly?: boolean
  individualOnly?: boolean
}

/**
 * 顧問先別の科目データを取得（マスタ+Override合成結果）
 * §53 §11: loadSugusruAccounts() → clientId対応（スグスルマスタ取得）
 */
function loadClientAccountsForMapping(clientId: string): SugusruAccount[] {
  const data = getClientAccounts(clientId)
  return data.accounts
}

async function loadSugusruTaxes(): Promise<SugusruTax[]> {
  const raw = await readFile(join(process.cwd(), 'data/tax-category-master.json'), 'utf8')
  return JSON.parse(raw)
}

// ────────────────────────────────────────────
// キャッシュ
// ────────────────────────────────────────────

const TTL_MS = 5 * 60 * 1000 // 5分

interface CacheEntry {
  tables: MfMappingTables
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()

// ────────────────────────────────────────────
// マッピング生成
// ────────────────────────────────────────────

/**
 * 科目マッピングを生成する
 * スグスルマスタの名前 → MFマスタの名前で突合 → MFのaccount_idを返す
 */
export async function buildAccountMap(tokenKey: string): Promise<{
  map: Map<string, string>
  details: AccountMapping[]
}> {
  const sugusruAccounts = loadClientAccountsForMapping(tokenKey)
  const mfAccounts = await mcpFetchAccounts(tokenKey)

  // MF科目を名前→オブジェクトのマップに変換（available=trueのみ）
  const mfByName = buildNameMap(mfAccounts, mf => mf.name, mf => mf.available !== false)

  const map = new Map<string, string>()
  const details: AccountMapping[] = []

  for (const sug of sugusruAccounts) {
    const mf = mfByName.get(sug.name)
    const mapping: AccountMapping = {
      sugusruId: sug.accountId,
      sugusruName: sug.name,
      mfId: mf?.id ?? null,
      mfName: mf?.name ?? null,
    }
    details.push(mapping)
    if (mf) {
      map.set(sug.accountId, mf.id)
    }
  }

  return { map, details }
}

/**
 * 税区分マッピングを生成する
 * スグスルマスタの名前 → MFマスタの名前で突合 → MFのtax_idを返す
 */
export async function buildTaxMap(tokenKey: string): Promise<{
  map: Map<string, string>
  details: TaxMapping[]
}> {
  const sugusruTaxes = await loadSugusruTaxes()
  const mfTaxes = await mcpFetchTaxes(tokenKey)

  // MF税区分を名前→オブジェクトのマップに変換
  const mfByName = buildNameMap(mfTaxes, mf => mf.name)

  const map = new Map<string, string>()
  const details: TaxMapping[] = []

  for (const sug of sugusruTaxes) {
    const mf = mfByName.get(sug.name)
    const mapping: TaxMapping = {
      sugusruId: sug.taxCategoryId,
      sugusruName: sug.name,
      mfId: mf?.id ?? null,
      mfName: mf?.name ?? null,
    }
    details.push(mapping)
    if (mf) {
      map.set(sug.taxCategoryId, mf.id)
    }
  }

  return { map, details }
}

/**
 * 補助科目マッピングを生成する（名前→MF-ID）
 * mcpFetchSubAccountsがオブジェクトラッパー解決済みなのでArray直接受け取り
 */
export async function buildSubAccountMap(tokenKey: string): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  try {
    const subs: MfMcpSubAccount[] = await mcpFetchSubAccounts(tokenKey)
    for (const sub of subs) {
      map.set(sub.name, sub.id)
    }
  } catch (err) {
    console.warn('[mfMapping] 補助科目取得失敗（空マップで続行）:', err instanceof Error ? err.message : err)
  }
  return map
}

/**
 * 部門マッピングを生成する（名前→MF-ID）
 * mcpFetchDepartmentsがオブジェクトラッパー解決済みなのでArray直接受け取り
 */
export async function buildDepartmentMap(tokenKey: string): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  try {
    const depts: MfMcpDepartment[] = await mcpFetchDepartments(tokenKey)
    for (const dept of depts) {
      map.set(dept.name, dept.id)
    }
  } catch (err) {
    console.warn('[mfMapping] 部門取得失敗（空マップで続行）:', err instanceof Error ? err.message : err)
  }
  return map
}

/**
 * 取引先マッピングを生成する（名前→MFコード）
 */
export async function buildTradePartnerMap(tokenKey: string): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  try {
    const raw = await mcpFetchTradePartners(tokenKey)
    const mfPartners = Array.isArray(raw) ? raw : (raw as Record<string, unknown>)?.trade_partners ?? []
    for (const p of mfPartners as Array<{ name: string; code: string; available?: boolean }>) {
      if (p.available !== false) {
        map.set(p.name, p.code)
      }
    }
  } catch (err) {
    console.warn('[mfMapping] 取引先取得失敗（空マップで続行）:', err instanceof Error ? err.message : err)
  }
  return map
}

/**
 * 全マッピングテーブルを一括生成する（キャッシュ付き・TTL 5分）
 *
 * @param tokenKey mfAuthServiceのトークンストアキー（顧問先ID）
 * @param forceRefresh true指定でキャッシュを無視して再取得
 */
export async function buildAllMaps(tokenKey: string, forceRefresh = false): Promise<MfMappingTables> {
  // キャッシュ確認
  if (!forceRefresh) {
    const cached = cache.get(tokenKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.tables
    }
  }

  console.log(`[mfMapping] マッピングテーブル生成開始（tokenKey: ${tokenKey}）`)
  const startMs = Date.now()

  // 6種類を並列取得（課税方式含む）
  const [accountResult, taxResult, subAccountMap, departmentMap, tradePartnerMap, termSettings] = await Promise.all([
    buildAccountMap(tokenKey),
    buildTaxMap(tokenKey),
    buildSubAccountMap(tokenKey),
    buildDepartmentMap(tokenKey),
    buildTradePartnerMap(tokenKey),
    mcpFetchTermSettings(undefined, tokenKey).catch(err => {
      console.warn('[mfMapping] 会計年度設定取得失敗（安全策としてinvoice_kind除去）:', err instanceof Error ? err.message : err)
      return [] as Awaited<ReturnType<typeof mcpFetchTermSettings>>
    }),
  ])

  const unmatchedAccounts = accountResult.details.filter(d => d.mfId === null)
  const unmatchedTaxes = taxResult.details.filter(d => d.mfId === null)

  // 科目方向マップ生成（accountGroupから直接判定。データ駆動）
  const sugusruAccounts = loadClientAccountsForMapping(tokenKey)
  const accountDirectionMap = new Map<string, 'sales' | 'purchase' | 'common'>()
  for (const acct of sugusruAccounts) {
    accountDirectionMap.set(acct.accountId, getAccountGroupDirection(acct.accountGroup ?? ''))
  }

  // 税区分方向マップ生成（スグスルマスタのdirectionから）
  const sugusruTaxes = await loadSugusruTaxes()
  const taxDirectionMap = new Map<string, 'sales' | 'purchase' | 'common'>()
  const taxSimplifiedOnlySet = new Set<string>()
  const taxIndividualOnlySet = new Set<string>()
  for (const tax of sugusruTaxes) {
    taxDirectionMap.set(tax.taxCategoryId, tax.direction ?? 'common')
    if (tax.simplifiedOnly) taxSimplifiedOnlySet.add(tax.taxCategoryId)
    if (tax.individualOnly) taxIndividualOnlySet.add(tax.taxCategoryId)
  }

  // 逆マップ生成（MF科目名 → スグスル概念ID）
  // MCP経由のbuildAccountMap()結果から構築。MF連携先ではMCPが正（SSOT）。
  // ※ MCPが返さない過去科目（ケース2）はconvertSide()側でgenerateMasterId()自動発番（§17）
  const reverseAccountMap = new Map<string, string>()
  for (const d of accountResult.details) {
    if (d.mfName && d.sugusruId) {
      reverseAccountMap.set(d.mfName, d.sugusruId)
    }
  }

  // 逆マップ生成（MF税区分名 → スグスル概念ID）
  // MCP経由のbuildTaxMap()結果から構築
  const reverseTaxMap = new Map<string, string>()
  for (const d of taxResult.details) {
    if (d.mfName && d.sugusruId) {
      reverseTaxMap.set(d.mfName, d.sugusruId)
    }
  }

  const tables: MfMappingTables = {
    accountMap: accountResult.map,
    taxMap: taxResult.map,
    subAccountMap,
    departmentMap,
    tradePartnerMap,
    accountDirectionMap,
    taxDirectionMap,
    taxSimplifiedOnlySet,
    taxIndividualOnlySet,
    reverseAccountMap,
    reverseTaxMap,
    unmatchedAccounts,
    unmatchedTaxes,
    // 最新年度の課税方式を取得（複数年度がある場合は最新）
    taxMethod: termSettings.length > 0
      ? termSettings.sort((a, b) => b.fiscal_year - a.fiscal_year)[0]!.tax_method
      : null,
    createdAt: new Date(),
  }

  const elapsedMs = Date.now() - startMs
  console.log(
    `[mfMapping] 生成完了 ${elapsedMs}ms | ` +
    `科目: ${accountResult.map.size}件マッチ, ${unmatchedAccounts.length}件未マッチ | ` +
    `税区分: ${taxResult.map.size}件マッチ, ${unmatchedTaxes.length}件未マッチ | ` +
    `補助科目: ${subAccountMap.size}件 | 部門: ${departmentMap.size}件 | 取引先: ${tradePartnerMap.size}件`
  )

  // キャッシュ保存
  cache.set(tokenKey, { tables, expiresAt: Date.now() + TTL_MS })

  return tables
}

/**
 * キャッシュクリア
 */
export function clearMappingCache(tokenKey?: string): void {
  if (tokenKey) {
    cache.delete(tokenKey)
  } else {
    cache.clear()
  }
}
