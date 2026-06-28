/**
 * accountMasterApi.ts — 科目マスタデータアクセス層
 *
 * 【責務】
 * - 科目マスタの読み書き
 * - サーバー側のインメモリ + JSONファイル永続化
 * - 税区分マスタはtaxCategoryMasterApi.tsに分離（B-15: #57）
 *
 * 【依存関係】
 * - AccountRepository（mock実装）がこのファイルをラップする
 * - accountMasterRoutes.ts がこのファイルを直接呼ぶ
 * - 税区分関連は後方互換のためre-export
 * - Supabase移行時にDB操作に差し替え
 *
 * 準拠: DL-042, DL-030
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'
import type { Account, AccountGroup } from '../../types/shared-account'
import type { TaxDirection } from '../../types/shared-tax-category'

// ────────────────────────────────────────────
// JSONファイルからマスタデータを読み込み
// ────────────────────────────────────────────

const DATA_DIR = join(process.cwd(), 'data')

function loadAccounts(): Account[] {
  try {
    const raw = readFileSync(join(DATA_DIR, 'account-master.json'), 'utf-8')
    const accounts = JSON.parse(raw) as Account[]
    console.log(`[accountMasterApi] 科目${accounts.length}件をJSONから読み込み`)
    return accounts
  } catch (err) {
    console.error('[accountMasterApi] account-master.json読み込み失敗:', err)
    return []
  }
}

import { loadTaxCategories, getClientTaxCategories } from './taxCategoryMasterApi'

// ────────────────────────────────────────────
// インメモリストア（将来Supabase移行時にDB呼び出しに差し替え）
// ────────────────────────────────────────────

/** マスタ科目一覧（変更可能。saveで上書き） */
let masterAccounts: Account[] = loadAccounts()

// ────────────────────────────────────────────
// 科目マスタ — enrichAccountRow
// shared/enrichAccount.ts に移設（フロント・バックエンド共用）。
// バックエンド側の既存importを維持するためre-export。
// ────────────────────────────────────────────

import { enrichAccountRow } from '../../shared/enrichAccount'
export { enrichAccountRow }

// ────────────────────────────────────────────
// 科目マスタ — 取得系
// ────────────────────────────────────────────

/** 全科目を取得 */
export function getAllAccounts(): readonly Account[] {
  return masterAccounts
}

/** 科目IDで1件取得 */
export function getAccountById(id: string): Account | undefined {
  return masterAccounts.find(a => a.accountId === id)
}


/** 顧問先別の科目をバリデーション用最小形式で返す（データ駆動） */
export function getClientAccountsForValidation(clientId: string): {
  accountId: string
  name: string
  accountGroup: AccountGroup
  category: string
  defaultTaxCategoryId?: string
  isContraRevenue?: boolean
  isContraExpense?: boolean
}[] {
  const data = getClientAccounts(clientId)
  return data.accounts.map(a => ({
    accountId: a.accountId,
    name: a.name,
    accountGroup: a.accountGroup as AccountGroup,
    category: a.category,
    defaultTaxCategoryId: a.defaultTaxCategoryId,
    isContraRevenue: a.isContraRevenue,
    isContraExpense: a.isContraExpense,
  }))
}

/** 顧問先別の税区分をバリデーション用最小形式で返す */
export function getClientTaxCategoriesForValidation(clientId: string): {
  taxCategoryId: string
  direction: TaxDirection
  simplifiedOnly?: boolean
  baseId?: string
  isExemptDefault?: boolean
  isUnknownDefault?: boolean
}[] {
  const data = getClientTaxCategories(clientId)
  return data.map(t => ({
    taxCategoryId: t.taxCategoryId,
    direction: (t.direction ?? 'common') as TaxDirection,
    simplifiedOnly: t.simplifiedOnly,
    baseId: t.baseId,
    isExemptDefault: t.isExemptDefault,
    isUnknownDefault: t.isUnknownDefault,
  }))
}

/** 科目名マップ（ID→名前）を返す */
export function getAccountNameMap(clientId?: string): Record<string, string> {
  const map: Record<string, string> = {}
  if (clientId) {
    // clientId指定時: その顧問先のEnrichedAccount[]から生成
    const data = getClientAccounts(clientId)
    for (const a of data.accounts) {
      map[a.accountId] = a.name
    }
  } else {
    // 未指定時: 全社マスタから生成（後方互換）
    for (const a of masterAccounts) {
      map[a.accountId] = a.name
    }
  }
  return map
}

// ────────────────────────────────────────────
// 科目マスタ — フィルタ・ソート・ページネーション
// ────────────────────────────────────────────

/** フィルタ条件 */
export interface AccountFilterParams {
  /** 事業形態フィルタ: corp / individual */
  businessType?: 'corp' | 'individual'
  /** テキスト検索（科目名部分一致） */
  search?: string
  /** ページ番号（1始まり） */
  page?: number
  /** 1ページあたりの件数（デフォルト50） */
  pageSize?: number
}

/** フィルタ結果 */
export interface AccountFilterResult {
  /** フィルタ後の全件 */
  items: Account[]
  /** フィルタ後の総件数 */
  totalCount: number
  /** ページネーション後の件 */
  pagedItems: Account[]
  /** 現在のページ */
  page: number
  /** 総ページ数 */
  totalPages: number
}

/**
 * マスタ科目をフィルタ・ソート・ページネーションして返す
 *
 * フロントの filteredAccountRows / pagedAccountRows computed を置換する。
 */
export function getFilteredAccounts(params: AccountFilterParams): AccountFilterResult {
  const {
    businessType,
    search = '',
    page = 1,
    pageSize = 50,
  } = params

  // フィルタ
  let filtered = masterAccounts.filter(row => {
    // 事業形態フィルタ（未指定時は全件）
    if (businessType) {
      if (row.target !== businessType) return false
    }
    // テキスト検索
    if (search && !row.name.includes(search)) return false
    return true
  })

  // ソート（sortOrder昇順）
  filtered = filtered.sort((a, b) => a.sortOrder - b.sortOrder)

  // enrich: 表示用フィールドを付与
  const taxCategories = loadTaxCategories()
  const enriched = filtered.map(row => enrichAccountRow(row, taxCategories))

  const totalCount = enriched.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  const pagedItems = enriched.slice(start, start + pageSize)

  return {
    items: enriched,
    totalCount,
    pagedItems,
    page: safePage,
    totalPages,
  }
}

// ────────────────────────────────────────────
// 科目マスタ — 保存系
// ────────────────────────────────────────────

/**
 * マスタ科目を全件上書き保存する
 *
 * フロントの saveChanges → localStorage書き込みを置換する。
 * 将来: Supabase upsert に差し替え。
 */
export function saveAllAccounts(accounts: Account[]): { ok: true; count: number } {
  masterAccounts = [...accounts]
  // JSON永続化（サーバー再起動でも変更を維持）
  try {
    writeFileSync(join(DATA_DIR, 'account-master.json'), JSON.stringify(accounts, null, 2), 'utf-8')
    console.log(`[accountMasterApi] マスタ科目を${accounts.length}件保存・永続化`)
  } catch (err) {
    console.error('[accountMasterApi] account-master.json永続化失敗:', err)
  }

  // syncMasterAccountsToClients 廃止。Override方式ではマスタ直接参照のため同期不要。

  return { ok: true, count: accounts.length }
}

// syncMasterAccountsToClients 廃止済み（Override方式移行。§53 §2参照）

// ────────────────────────────────────────────
// 顧問先別 Override ストア（§53 §3 確定アーキテクチャ）
// MF未連携: accounts_master + overrides → EnrichedAccount[]
// MF連携済み: client_mf_accounts + overrides → EnrichedAccount[]
// 将来: Supabase client_account_overrides テーブルに差し替え
// ────────────────────────────────────────────

/** Override対象フィールド（§53 Q2: hidden / sortOrder / defaultTaxCategoryId） */
interface AccountOverride {
  accountId: string
  hidden?: boolean
  sortOrder?: number
  defaultTaxCategoryId?: string
}

/** MFから取得した補助科目（事業者ごと、1:N） */
export interface MfSubAccountEntry {
  /** MF補助科目ID（URLエンコード済みBase64） */
  mfSubId: string
  /** 補助科目名 */
  name: string
  /** MFデフォルト税区分ID（MF固有。mfTaxIdToMasterIdで変換前の値） */
  mfTaxId: string
  /** sugusuru税区分ID（mfTaxIdから変換済み。未変換時はundefined） */
  taxCategoryId?: string
  /** 検索キー */
  searchKey?: string | null
}

/** MFから取得した部門（事業者ごと、木構造） */
export interface MfDepartmentEntry {
  /** MF部門ID（URLエンコード済みBase64） */
  mfDeptId: string
  /** 部門名 */
  name: string
  /** 親部門ID（null=ルート部門） */
  parentId: string | null
  /** 検索キー */
  searchKey?: string | null
}

/** 顧問先別Overrideデータ */
interface ClientOverrideData {
  accountOverrides: AccountOverride[]
  /** @deprecated 旧1:1型。新規保存ではsubAccountsMapを使用 */
  subAccounts?: Record<string, string>
}

/** 旧形式との後方互換用 */
interface ClientAccountData {
  accounts: Account[]
  subAccounts?: Record<string, string>
}

/** Overrideストア: clientId → ClientOverrideData */
const clientOverrideStore = new Map<string, ClientOverrideData>()

/** MFインポートデータストア: clientId → Account[]（MF連携済みの科目一覧） */
const clientMfAccountStore = new Map<string, Account[]>()

/** 補助科目キャッシュ: clientId → { sugusruAccountId → MfSubAccountEntry[] } */
const clientSubAccountStore = new Map<string, Record<string, MfSubAccountEntry[]>>()

/** 部門キャッシュ: clientId → MfDepartmentEntry[] */
const clientDepartmentStore = new Map<string, MfDepartmentEntry[]>()

// ── 永続化ヘルパー（Override） ──

/** OverrideをJSONに永続化 */
function persistOverrides(clientId: string, data: ClientOverrideData): void {
  try {
    const filePath = join(DATA_DIR, `overrides-${clientId}.json`)
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`[accountMasterApi] 顧問先${clientId}のOverrideを永続化（${data.accountOverrides.length}件）`)
  } catch (err) {
    console.error(`[accountMasterApi] 顧問先${clientId}のOverride永続化に失敗:`, err)
  }
}

/** MFインポートデータをJSONに永続化 */
function persistMfAccounts(clientId: string, accounts: Account[]): void {
  try {
    const filePath = join(DATA_DIR, `mf-accounts-${clientId}.json`)
    writeFileSync(filePath, JSON.stringify(accounts, null, 2), 'utf-8')
    console.log(`[accountMasterApi] 顧問先${clientId}のMFデータを永続化（${accounts.length}件）`)
  } catch (err) {
    console.error(`[accountMasterApi] 顧問先${clientId}のMFデータ永続化に失敗:`, err)
  }
}

/** 補助科目をJSONに永続化 */
export function persistSubAccounts(clientId: string, data: Record<string, MfSubAccountEntry[]>): void {
  try {
    clientSubAccountStore.set(clientId, data)
    const filePath = join(DATA_DIR, `sub-accounts-${clientId}.json`)
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    const total = Object.values(data).reduce((s, arr) => s + arr.length, 0)
    console.log(`[accountMasterApi] 顧問先${clientId}の補助科目を永続化（${total}件）`)
  } catch (err) {
    console.error(`[accountMasterApi] 顧問先${clientId}の補助科目永続化に失敗:`, err)
  }
}

/** 部門をJSONに永続化 */
export function persistDepartments(clientId: string, data: MfDepartmentEntry[]): void {
  try {
    clientDepartmentStore.set(clientId, data)
    const filePath = join(DATA_DIR, `departments-${clientId}.json`)
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`[accountMasterApi] 顧問先${clientId}の部門を永続化（${data.length}件）`)
  } catch (err) {
    console.error(`[accountMasterApi] 顧問先${clientId}の部門永続化に失敗:`, err)
  }
}

/** 補助科目を取得 */
export function getClientSubAccounts(clientId: string): Record<string, MfSubAccountEntry[]> {
  return clientSubAccountStore.get(clientId) ?? {}
}

/** 部門を取得 */
export function getClientDepartments(clientId: string): MfDepartmentEntry[] {
  return clientDepartmentStore.get(clientId) ?? []
}

/** 旧形式（accounts-{clientId}.json）からOverride/MFデータへマイグレーション */
function migrateFromLegacy(clientId: string, legacy: ClientAccountData): void {
  const hasMfData = legacy.accounts.some(a => a.mfAccountId != null)

  if (hasMfData) {
    // MF連携済み: 全件をMFデータとして保存
    clientMfAccountStore.set(clientId, legacy.accounts)
    persistMfAccounts(clientId, legacy.accounts)
    console.log(`[accountMasterApi] 顧問先${clientId}: 旧データ→MFデータにマイグレーション（${legacy.accounts.length}件）`)
  }

  // Override抽出: ベースデータとの差分をOverrideとして保存
  // M1修正: MF連携時はMFデータと比較する（マスタ比較ではない）
  const overrides: AccountOverride[] = []
  const baseData = hasMfData ? legacy.accounts : masterAccounts
  const masterById = new Map(baseData.map(a => [a.accountId, a]))


  for (const acc of legacy.accounts) {
    const master = masterById.get(acc.accountId)
    if (!master) continue // マスタにない科目（旧ID残骸等）はスキップ

    const override: AccountOverride = { accountId: acc.accountId }
    let hasDiff = false

    if (acc.hidden !== master.hidden) {
      override.hidden = acc.hidden
      hasDiff = true
    }
    if (acc.sortOrder !== master.sortOrder) {
      override.sortOrder = acc.sortOrder
      hasDiff = true
    }
    if (acc.defaultTaxCategoryId !== master.defaultTaxCategoryId) {
      override.defaultTaxCategoryId = acc.defaultTaxCategoryId
      hasDiff = true
    }

    if (hasDiff) {
      overrides.push(override)
    }
  }

  const overrideData: ClientOverrideData = {
    accountOverrides: overrides,
  }
  clientOverrideStore.set(clientId, overrideData)
  if (overrides.length > 0) {
    persistOverrides(clientId, overrideData)
    console.log(`[accountMasterApi] 顧問先${clientId}: Override${overrides.length}件を抽出・永続化`)
  }
}

/**
 * 起動時: Override + MFデータ + 補助科目 + 部門を復元
 * 1. overrides-{clientId}.json → Override復元
 * 2. mf-accounts-{clientId}.json → MFデータ復元
 * 3. sub-accounts-{clientId}.json → 補助科目復元
 * 4. departments-{clientId}.json → 部門復元
 * 5. 旧accounts-{clientId}.json → マイグレーション（overrides/mf-accountsが未作成の場合）
 */
function restoreAllClientAccounts(): void {
  if (!existsSync(DATA_DIR)) return
  const files = readdirSync(DATA_DIR)

  // 1. Override復元
  for (const file of files.filter(f => f.startsWith('overrides-') && f.endsWith('.json'))) {
    const clientId = file.replace('overrides-', '').replace('.json', '')
    try {
      const raw = readFileSync(join(DATA_DIR, file), 'utf-8')
      clientOverrideStore.set(clientId, JSON.parse(raw))
      console.log(`[accountMasterApi] 顧問先${clientId}のOverrideを復元`)
    } catch (err) {
      console.error(`[accountMasterApi] ${file}の読み込み失敗:`, err)
    }
  }

  // 2. MFデータ復元
  for (const file of files.filter(f => f.startsWith('mf-accounts-') && f.endsWith('.json'))) {
    const clientId = file.replace('mf-accounts-', '').replace('.json', '')
    try {
      const raw = readFileSync(join(DATA_DIR, file), 'utf-8')
      const parsed = JSON.parse(raw)
      // ファイル形式が Account[] か { accounts: Account[] } の両方に対応
      const accounts: Account[] = Array.isArray(parsed) ? parsed : (parsed.accounts ?? [])
      clientMfAccountStore.set(clientId, accounts)
      console.log(`[accountMasterApi] 顧問先${clientId}のMFデータを復元`)
    } catch (err) {
      console.error(`[accountMasterApi] ${file}の読み込み失敗:`, err)
    }
  }

  // 3. 補助科目復元
  for (const file of files.filter(f => f.startsWith('sub-accounts-') && f.endsWith('.json'))) {
    const clientId = file.replace('sub-accounts-', '').replace('.json', '')
    try {
      const raw = readFileSync(join(DATA_DIR, file), 'utf-8')
      clientSubAccountStore.set(clientId, JSON.parse(raw))
      console.log(`[accountMasterApi] 顧問先${clientId}の補助科目を復元`)
    } catch (err) {
      console.error(`[accountMasterApi] ${file}の読み込み失敗:`, err)
    }
  }

  // 4. 部門復元
  for (const file of files.filter(f => f.startsWith('departments-') && f.endsWith('.json'))) {
    const clientId = file.replace('departments-', '').replace('.json', '')
    try {
      const raw = readFileSync(join(DATA_DIR, file), 'utf-8')
      clientDepartmentStore.set(clientId, JSON.parse(raw))
      console.log(`[accountMasterApi] 顧問先${clientId}の部門を復元`)
    } catch (err) {
      console.error(`[accountMasterApi] ${file}の読み込み失敗:`, err)
    }
  }

  // 5. 旧形式マイグレーション（overrides未作成の場合のみ）
  for (const file of files.filter(f => f.startsWith('accounts-') && f.endsWith('.json') && f !== 'account-master.json')) {
    const clientId = file.replace('accounts-', '').replace('.json', '')
    if (clientOverrideStore.has(clientId)) continue // 既にOverrideがあればスキップ
    try {
      const raw = readFileSync(join(DATA_DIR, file), 'utf-8')
      const legacy: ClientAccountData = JSON.parse(raw)
      migrateFromLegacy(clientId, legacy)
      console.log(`[accountMasterApi] 顧問先${clientId}: 旧データからマイグレーション完了`)
    } catch (err) {
      console.error(`[accountMasterApi] ${file}のマイグレーション失敗:`, err)
    }
  }
}

/**
 * 顧問先のOverrideデータが存在するか
 */
export function hasClientAccounts(clientId: string): boolean {
  return clientOverrideStore.has(clientId) || clientMfAccountStore.has(clientId)
}

/**
 * 顧問先別の科目一覧を取得する（マスタ + Override 合成）
 *
 * §53 §3 確定アーキテクチャ:
 *   MF未連携: accounts_master + overrides → { accounts, subAccounts, departments }
 *   MF連携済み: client_mf_accounts + overrides → { accounts, subAccounts, departments }
 *
 * subAccounts: MFから取得した補助科目（sugusru科目ID→MfSubAccountEntry[]）
 * departments: MFから取得した部門（MfDepartmentEntry[]）
 */
export function getClientAccounts(clientId: string): ClientAccountData & {
  subAccountsMap: Record<string, MfSubAccountEntry[]>
  departments: MfDepartmentEntry[]
} {
  // ベースデータ: MFデータがあればMF、なければマスタ
  const baseAccounts = clientMfAccountStore.has(clientId)
    ? clientMfAccountStore.get(clientId)!
    : masterAccounts

  // Override適用
  const overrideData = clientOverrideStore.get(clientId)
  const overrideMap = new Map(
    (overrideData?.accountOverrides ?? []).map(o => [o.accountId, o])
  )

  const accounts = baseAccounts.map(a => {
    const override = overrideMap.get(a.accountId)
    if (!override) return { ...a }
    return {
      ...a,
      ...(override.hidden !== undefined && { hidden: override.hidden }),
      ...(override.sortOrder !== undefined && { sortOrder: override.sortOrder }),
      ...(override.defaultTaxCategoryId !== undefined && { defaultTaxCategoryId: override.defaultTaxCategoryId }),
    }
  })

  return {
    accounts,
    subAccountsMap: getClientSubAccounts(clientId),
    departments: getClientDepartments(clientId),
  }
}

/** フィルタ付き顧問先科目取得 */
export function getFilteredClientAccounts(
  clientId: string,
  params: AccountFilterParams,
): AccountFilterResult {
  const data = getClientAccounts(clientId)
  const {
    businessType,
    search = '',
    page = 1,
    pageSize = 50,
  } = params

  let filtered = data.accounts.filter(row => {
    if (businessType && row.target !== businessType) return false
    if (search && !row.name.includes(search)) return false
    return true
  })

  filtered = filtered.sort((a, b) => a.sortOrder - b.sortOrder)

  const taxCategories = loadTaxCategories()
  const enriched = filtered.map(row => enrichAccountRow(row, taxCategories))

  const totalCount = enriched.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  const pagedItems = enriched.slice(start, start + pageSize)

  return {
    items: enriched,
    totalCount,
    pagedItems,
    page: safePage,
    totalPages,
  }
}

/**
 * 顧問先別の科目を保存する（diff抽出→Override保存）
 *
 * §53 §4 Rule 4: 保存APIは完成形を受け取り、差分抽出はバックエンド責務。
 * フロントからEnrichedAccount[]→Account[]を受け取り、ベースとの差分をOverrideとして保存。
 */
export function saveClientAccounts(
  clientId: string,
  accounts: Account[],
): { ok: true; count: number } {
  // ベースデータ（MF or マスタ）
  const baseAccounts = clientMfAccountStore.has(clientId)
    ? clientMfAccountStore.get(clientId)!
    : masterAccounts
  const baseMap = new Map(baseAccounts.map(a => [a.accountId, a]))

  // diff抽出: ベースと異なるフィールドのみOverrideとして保存
  const overrides: AccountOverride[] = []
  for (const acc of accounts) {
    const base = baseMap.get(acc.accountId)
    if (!base) continue

    const override: AccountOverride = { accountId: acc.accountId }
    let hasDiff = false

    if (acc.hidden !== base.hidden) {
      override.hidden = acc.hidden
      hasDiff = true
    }
    if (acc.sortOrder !== base.sortOrder) {
      override.sortOrder = acc.sortOrder
      hasDiff = true
    }
    if (acc.defaultTaxCategoryId !== base.defaultTaxCategoryId) {
      override.defaultTaxCategoryId = acc.defaultTaxCategoryId
      hasDiff = true
    }

    if (hasDiff) {
      overrides.push(override)
    }
  }

  const overrideData: ClientOverrideData = {
    accountOverrides: overrides,
  }

  clientOverrideStore.set(clientId, overrideData)
  persistOverrides(clientId, overrideData)
  console.log(`[accountMasterApi] 顧問先${clientId}: Override${overrides.length}件保存（ベース${baseAccounts.length}件）`)
  return { ok: true, count: accounts.length }
}

/**
 * MFインポートデータを保存する（MF連携済み顧問先用）
 *
 * mfRoutes.tsのMFインポート処理から呼ばれる。
 * 全件上書き（MFから取得した科目リストを丸ごと保存）。
 */
export function saveMfAccounts(
  clientId: string,
  accounts: Account[],
): { ok: true; count: number } {
  clientMfAccountStore.set(clientId, [...accounts])
  persistMfAccounts(clientId, accounts)
  console.log(`[accountMasterApi] 顧問先${clientId}のMFデータを${accounts.length}件保存`)
  return { ok: true, count: accounts.length }
}


// ────────────────────────────────────────────
// 税区分マスタ → taxCategoryMasterApi.ts に分離（B-15: #57）
// 後方互換のためre-export
// ────────────────────────────────────────────

export {
  getAllTaxCategories,
  getTaxCategoryById,
  getTaxCategoryNameMap,
  enrichRow,
  getFilteredTaxCategories,
  saveAllTaxCategories,
  getFilteredClientTaxCategories,
  saveClientTaxCategories,
  getTaxCategoryCount,
  getClientTaxStoreSize,
} from './taxCategoryMasterApi'
// getClientTaxCategoriesはL41で直接importし、後方互換のため手動re-export
export { getClientTaxCategories }
export type {
  TaxCategoryFilterParams,
  TaxCategoryFilterResult,
} from './taxCategoryMasterApi'

// 起動時に永続化済みの顧問先別科目データを復元
restoreAllClientAccounts()

// syncMasterAccountsToClients / syncMasterTaxCategoriesToClients 廃止済み
// Override方式ではマスタ直接参照のため同期不要。

// §53 Rule 5/6: 孤立Override検出（安全弁・低優先）
// ────────────────────────────────────────────

/**
 * 孤立Overrideを検出してコンソールに警告ログを出力する
 *
 * §53 Rule 5: MFインポート後にOverride.accountIdに対応する科目が存在するか確認
 * §53 Rule 6: 孤立Overrideは自動削除しない。警告のみ。
 */
export function detectOrphanedOverrides(clientId: string): string[] {
  const overrideData = clientOverrideStore.get(clientId)
  if (!overrideData) return []

  // ベースデータのaccountId一覧
  const baseAccounts = clientMfAccountStore.has(clientId)
    ? clientMfAccountStore.get(clientId)!
    : masterAccounts
  const baseIdSet = new Set(baseAccounts.map(a => a.accountId))

  const orphaned: string[] = []
  for (const override of overrideData.accountOverrides) {
    if (!baseIdSet.has(override.accountId)) {
      orphaned.push(override.accountId)
    }
  }

  if (orphaned.length > 0) {
    console.warn(`[accountMasterApi] ⚠️ 顧問先${clientId}: 孤立Override ${orphaned.length}件検出: ${orphaned.join(', ')}`)
  }

  return orphaned
}

// 起動時に全顧問先の孤立Overrideをチェック
for (const clientId of clientOverrideStore.keys()) {
  detectOrphanedOverrides(clientId)
}

// ────────────────────────────────────────────
// §53 Rule 2: accountIdリネームマイグレーション
// ────────────────────────────────────────────

/**
 * accountIdをリネームする（マイグレーション用ユーティリティ）
 *
 * §53 Rule 2: 変更が必要な場合は専用マイグレーション経由のみ。
 * 更新対象: accounts_master, client_account_overrides, client_mf_accounts
 *
 * 注意: 仕訳データ（journal entries）とtax_mappingsは別途マイグレーションが必要。
 * Supabase移行後はFOREIGN KEY ON UPDATE CASCADEで強制可能。
 */
export function renameAccountId(oldId: string, newId: string): {
  updated: { master: boolean; overrides: string[]; mfAccounts: string[] }
} {
  const result = { master: false, overrides: [] as string[], mfAccounts: [] as string[] }

  // 1. マスタ更新
  const masterIdx = masterAccounts.findIndex(a => a.accountId === oldId)
  if (masterIdx >= 0) {
    masterAccounts[masterIdx] = { ...masterAccounts[masterIdx]!, accountId: newId }
    result.master = true
    saveAllAccounts(masterAccounts)
    console.log(`[renameAccountId] マスタ: ${oldId} → ${newId}`)
  }

  // 2. Override更新
  for (const [clientId, data] of clientOverrideStore.entries()) {
    const override = data.accountOverrides.find(o => o.accountId === oldId)
    if (override) {
      override.accountId = newId
      persistOverrides(clientId, data)
      result.overrides.push(clientId)
      console.log(`[renameAccountId] Override(${clientId}): ${oldId} → ${newId}`)
    }
  }

  // 3. MFデータ更新
  for (const [clientId, accounts] of clientMfAccountStore.entries()) {
    const account = accounts.find(a => a.accountId === oldId)
    if (account) {
      account.accountId = newId
      persistMfAccounts(clientId, accounts)
      result.mfAccounts.push(clientId)
      console.log(`[renameAccountId] MFデータ(${clientId}): ${oldId} → ${newId}`)
    }
  }

  return { updated: result }
}

import { getTaxCategoryCount, getClientTaxStoreSize } from './taxCategoryMasterApi'
console.log(`[accountMasterApi] 科目${masterAccounts.length}件をロード（Override: ${clientOverrideStore.size}社 / MF: ${clientMfAccountStore.size}社 / 税区分: ${getTaxCategoryCount()}件・${getClientTaxStoreSize()}社）`)
