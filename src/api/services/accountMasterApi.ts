/**
 * accountMasterApi.ts — 科目・税区分マスタデータアクセス層（共通）
 *
 * 【責務】
 * - 科目・税区分マスタの読み書き
 * - サーバー側のインメモリ + JSONファイル永続化
 *
 * 【依存関係】
 * - AccountRepository（mock実装）がこのファイルをラップする
 * - accountMasterRoutes.ts / taxCategoryRoutes.ts がこのファイルを直接呼ぶ
 * - Supabase移行時にDB操作に差し替え
 *
 * 準拠: DL-042, DL-030
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'
import { getTaxAvailableForMethod } from './mfTaxAvailableStore'
import { join } from 'path'
import type { Account, AccountGroup, EnrichedAccount } from '../../types/shared-account'
import type { TaxCategory, TaxDirection } from '../../types/shared-tax-category'
import { getAccountGroupDirection, getCategoryLabel } from '../../data/master/account-category-rules'
import { VOUCHER_TYPE_RULES } from '../../data/master/voucherTypeRules'

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

export function loadTaxCategories(): TaxCategory[] {
  try {
    const raw = readFileSync(join(DATA_DIR, 'tax-category-master.json'), 'utf-8')
    const taxes = JSON.parse(raw) as TaxCategory[]
    console.log(`[accountMasterApi] 税区分${taxes.length}件をJSONから読み込み`)
    return taxes
  } catch (err) {
    console.error('[accountMasterApi] tax-category-master.json読み込み失敗:', err)
    return []
  }
}

// ────────────────────────────────────────────
// インメモリストア（将来Supabase移行時にDB呼び出しに差し替え）
// ────────────────────────────────────────────

/** マスタ科目一覧（変更可能。saveで上書き） */
let masterAccounts: Account[] = loadAccounts()

// ────────────────────────────────────────────
// 科目マスタ — enrichAccountRow（バックエンド責務集約）
// EnrichedAccount型はshared-account.tsで定義（ドメイン型）
// ────────────────────────────────────────────

/** accountGroupの日本語ラベル */
function toAccountGroupLabel(ag: string): string {
  switch (ag) {
    case 'BS_ASSET': return 'BS資産'
    case 'BS_LIABILITY': return 'BS負債'
    case 'BS_EQUITY': return 'BS純資産'
    case 'PL_REVENUE': return 'PL収益'
    case 'PL_EXPENSE': return 'PL費用'
    default: return ag
  }
}

/** targetの日本語ラベル */
function toTargetLabel(t: string): string {
  switch (t) {
    case 'corp': return '法人'
    case 'individual': return '個人'
    default: return t
  }
}

/** directionの日本語ラベル */
function toDirectionLabel(accountGroup: string): string {
  const dir = getAccountGroupDirection(accountGroup)
  switch (dir) {
    case 'sales': return '売上'
    case 'purchase': return '仕入'
    case 'common': return '共通'
    default: return dir
  }
}

/** 証票意味許容タイプを算出 */
function toAllowedVoucherTypes(row: { accountId: string; accountGroup: string; category: string }): string {
  const debitTypes: string[] = []
  const creditTypes: string[] = []
  for (const [vtName, rule] of Object.entries(VOUCHER_TYPE_RULES)) {
    const d = rule.debit
    if (d.allowedGroups?.includes(row.accountGroup) || d.allowedIds?.includes(row.accountId) || d.allowedCategories?.includes(row.category)) {
      debitTypes.push(vtName)
    }
    const c = rule.credit
    if (c.allowedGroups?.includes(row.accountGroup) || c.allowedIds?.includes(row.accountId) || c.allowedCategories?.includes(row.category)) {
      creditTypes.push(vtName)
    }
  }
  const parts: string[] = []
  if (debitTypes.length > 0) parts.push(`借:${debitTypes.join(',')}`)
  if (creditTypes.length > 0) parts.push(`貸:${creditTypes.join(',')}`)
  return parts.join(' / ') || '—'
}

/** 課税方式別のAI判定フラグマップを生成 */
function buildAiDeterminationMap(accountGroup: string): Record<string, string> {
  const dir = getAccountGroupDirection(accountGroup)
  const flag = dir !== 'common' ? '○' : ''
  return {
    proportional: flag,
    individual: flag,
    simplified: flag,
    exempt: '',
  }
}

/** 課税方式別のデフォルト税区分名マップを生成 */
function buildDefaultTaxesMap(defaultTaxCategoryId: string | undefined, taxCategories: TaxCategory[]): Record<string, string> {
  // 免税のデフォルト表示名: データ駆動（COMMON_EXEMPTのname）
  const exemptName = taxCategories.find(tc => tc.taxCategoryId === 'COMMON_EXEMPT')?.name ?? '対象外'

  if (!defaultTaxCategoryId) {
    return { proportional: '', individual: '', simplified: '', exempt: exemptName }
  }

  const baseTc = taxCategories.find(tc => tc.taxCategoryId === defaultTaxCategoryId)
  // 正式名称（name）を使用。全社税区分マスタと表示統一。
  const baseName = baseTc?.name ?? defaultTaxCategoryId

  // 対象外系（COMMON_EXEMPT等）は全方式で同じ名前
  if (baseTc && (baseTc.direction === 'common' && defaultTaxCategoryId.includes('EXEMPT'))) {
    return { proportional: baseName, individual: baseName, simplified: baseName, exempt: baseName }
  }

  // 簡易課税: baseIdで逆引き → 事業種別バリアントがあるなら「(種別選択)」付記
  let simplifiedName = baseName
  const simplifiedVariants = taxCategories.filter(tc => tc.baseId === defaultTaxCategoryId)
  if (simplifiedVariants.length > 0) {
    // 事業種別バリアントが存在 → 全社マスタでは種別未確定
    simplifiedName = `${baseName} (種別選択)`
  }

  return {
    proportional: baseName,
    individual: baseName,
    simplified: simplifiedName,
    exempt: exemptName,
  }
}

/**
 * 勘定科目行に表示用フィールドを付与（バックエンド責務）
 *
 * 税区分のenrichRow()と同じアーキテクチャ。
 * フロントはこの値をそのまま表示するだけ。
 */
export function enrichAccountRow(row: Account, taxCategories: TaxCategory[]): EnrichedAccount {
  return {
    ...row,
    accountGroupLabel: toAccountGroupLabel(row.accountGroup),
    targetLabel: toTargetLabel(row.target),
    directionLabel: toDirectionLabel(row.accountGroup),
    categoryLabel: getCategoryLabel(row.category),
    displayEffectiveFrom: row.effectiveFrom ?? '—',
    displayEffectiveTo: row.effectiveTo ?? '現役',
    displayAllowedVoucherTypes: toAllowedVoucherTypes(row),
    sourceLabel: row.isCustom || row.source === 'client-custom' ? 'カスタム' : row.source === 'mcp' ? 'MCP' : '全社',
    aiDetermination: buildAiDeterminationMap(row.accountGroup),
    defaultTaxes: buildDefaultTaxesMap(row.defaultTaxCategoryId, taxCategories),
  }
}

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
  const hasMfData = legacy.accounts.some(a => (a as Record<string, unknown>).mfAccountId != null)

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
// 税区分マスタ
// ────────────────────────────────────────────

/** マスタ税区分一覧（変更可能。saveで上書き） */
let masterTaxCategories: TaxCategory[] = loadTaxCategories()

/** 全税区分を取得（visibleIn + displayRate付き） */
export function getAllTaxCategories(): TaxCategory[] {
  return masterTaxCategories.map(row => enrichRow(row))
}

/** 税区分IDで1件取得 */
export function getTaxCategoryById(id: string): TaxCategory | undefined {
  return masterTaxCategories.find(t => t.taxCategoryId === id)
}


/** 税区分名マップ（ID→名前）を返す */
export function getTaxCategoryNameMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const t of masterTaxCategories) {
    map[t.taxCategoryId] = t.name
  }
  return map
}

// ────────────────────────────────────────────
// 税区分マスタ — フィルタ・ページネーション
// ────────────────────────────────────────────

/** 税区分フィルタ条件 */
export interface TaxCategoryFilterParams {
  /** 課税方式: general / individual / proportional / simplified / exempt / all（全件） */
  taxMethod?: 'general' | 'individual' | 'proportional' | 'simplified' | 'exempt' | 'all'
  /** ページ番号（1始まり） */
  page?: number
  /** 1ページあたりの件数（デフォルト50） */
  pageSize?: number
}

/** 税区分フィルタ結果 */
export interface TaxCategoryFilterResult {
  items: TaxCategory[]
  totalCount: number
  pagedItems: TaxCategory[]
  page: number
  totalPages: number
}
// --- 課税方式別フィルタ共通関数 ---

// ────────────────────────────────────────────
// 税区分 — バックエンド判定（ドメインルール集約）
// フロントにフィルタ責務なし。フロントにデータ補完責務なし。
// ────────────────────────────────────────────

/** 課税方式キー */
const TAX_METHODS = ['proportional', 'individual', 'simplified', 'exempt'] as const
type VisibleInMap = Record<typeof TAX_METHODS[number], boolean>

/** 課税方式キー変換マップ（general→proportional等） */
const METHOD_KEY_MAP: Record<string, typeof TAX_METHODS[number]> = {
  'general': 'proportional',
  'proportional': 'proportional',
  'individual': 'individual',
  'simplified': 'simplified',
  'exempt': 'exempt',
}

/**
 * 各行にvisibleInフラグを付与（ドメインルール集約）
 *
 * available.jsonのキーはマスタID（例: SALES_TAXABLE_10）。
 * 共通ルール:
 * - direction='common'（不明・対象外）は全方式で常に表示
 * - MF独自カスタム税区分（isCustom && source='mcp'）は全方式で常に表示
 * - 免税タブ → commonのみ
 * - MFのavailableデータで判定（データ駆動）
 * - availableデータなし → !hidden && defaultVisible（安全なフォールバック）
 */
function assignVisibility(row: TaxCategory): TaxCategory {
  const visibleIn: VisibleInMap = {
    proportional: false,
    individual: false,
    simplified: false,
    exempt: false,
  }

  for (const method of TAX_METHODS) {
    // カスタム税区分 → 全タブ表示
    if (row.isCustom && row.source === 'mcp') { visibleIn[method] = true; continue }
    // common（不明・対象外）→ 全タブ表示
    if (row.direction === 'common') { visibleIn[method] = true; continue }
    // 免税タブ → commonのみ（上で処理済み）
    if (method === 'exempt') { visibleIn[method] = false; continue }
    // MFのavailableデータで判定
    const availableData = getTaxAvailableForMethod(method)
    if (availableData && row.taxCategoryId) {
      visibleIn[method] = availableData[row.taxCategoryId] === true
      continue
    }
    // フォールバック（availableデータなし）: マスタの静的属性で判定
    // simplifiedOnly（簡易課税専用）→ simplifiedのみ表示
    if (row.simplifiedOnly) {
      visibleIn[method] = method === 'simplified'
      continue
    }
    // individualOnly（個別対応専用）→ individualのみ表示
    if (row.individualOnly) {
      visibleIn[method] = method === 'individual'
      continue
    }
    // それ以外 → 非表示でなければ表示（proportional/individual/simplifiedで共通）
    visibleIn[method] = !row.hidden && row.defaultVisible !== false
  }

  return { ...row, visibleIn }
}

/**
 * 税率の表示文字列を生成（データ補完をバックエンドに集約）
 * taxRateがあれば変換、なければ名前から抽出
 */
function buildDisplayRate(row: TaxCategory): string {
  if (row.taxRate != null) {
    if (row.taxRate === 0) return '-'
    return `${Math.round(row.taxRate * 100)}%`
  }
  const match = row.name.match(/[\d.]+%/)
  return match ? match[0] : '-'
}

/** 行にバックエンド判定済みフィールド（visibleIn + displayRate）を付与 */
export function enrichRow(row: TaxCategory): TaxCategory {
  const withVisibility = assignVisibility(row)
  return { ...withVisibility, displayRate: buildDisplayRate(row) }
}

/**
 * マスタ税区分をフィルタ・ページネーションして返す
 * visibleInベースでフィルタ。フロントにフィルタ責務なし。
 */
export function getFilteredTaxCategories(params: TaxCategoryFilterParams): TaxCategoryFilterResult {
  const {
    taxMethod = 'general',
    page = 1,
    pageSize = 50,
  } = params

  // 全行にvisibleIn + displayRateを付与
  const enriched = masterTaxCategories.map(row => enrichRow(row))

  // taxMethod=all → 全件返却
  const filtered = taxMethod === 'all'
    ? enriched
    : enriched.filter(row => {
        const key = METHOD_KEY_MAP[taxMethod] ?? taxMethod
        return row.visibleIn?.[key as keyof VisibleInMap] === true
      })

  const totalCount = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  const pagedItems = filtered.slice(start, start + pageSize)

  return {
    items: filtered,
    totalCount,
    pagedItems,
    page: safePage,
    totalPages,
  }
}

// ────────────────────────────────────────────
// 税区分マスタ — 保存系
// ────────────────────────────────────────────

/**
 * マスタ税区分を全件上書き保存する
 *
 * フロントの saveChanges → localStorage書き込みを置換する。
 * 将来: Supabase upsert に差し替え。
 */
export function saveAllTaxCategories(taxCategories: TaxCategory[]): { ok: true; count: number } {
  masterTaxCategories = [...taxCategories]
  try {
    writeFileSync(join(DATA_DIR, 'tax-category-master.json'), JSON.stringify(taxCategories, null, 2), 'utf-8')
    console.log(`[accountMasterApi] マスタ税区分を${taxCategories.length}件保存・永続化`)
  } catch (err) {
    console.error('[accountMasterApi] tax-category-master.json永続化失敗:', err)
  }

  // syncMasterTaxCategoriesToClients 廃止。Override方式ではマスタ直接参照のため同期不要。

  return { ok: true, count: taxCategories.length }
}

// syncMasterTaxCategoriesToClients 廃止済み（Override方式移行。§53 §3参照）

// ────────────────────────────────────────────
// 顧問先別税区分 Override ストア（§53 Q3: 科目と同じ設計）
// マスタ直接参照 + Override（hidden）で合成
// 将来: Supabase client_tax_overrides テーブルに差し替え
// ────────────────────────────────────────────

/** 税区分Override（hiddenのみ） */
interface TaxCategoryOverride {
  taxCategoryId: string
  hidden?: boolean
}

/** 税区分Overrideストア: clientId → TaxCategoryOverride[] */
const clientTaxOverrideStore = new Map<string, TaxCategoryOverride[]>()

/** 旧形式ストア: 旧tax-categories-{clientId}.jsonからの復元用 */
const clientTaxStore = new Map<string, TaxCategory[]>()

// ── 永続化ヘルパー（税区分Override） ──

/** 税区分OverrideをJSONに永続化 */
function persistTaxOverrides(clientId: string, overrides: TaxCategoryOverride[]): void {
  try {
    const filePath = join(DATA_DIR, `tax-overrides-${clientId}.json`)
    writeFileSync(filePath, JSON.stringify(overrides, null, 2), 'utf-8')
    console.log(`[accountMasterApi] 顧問先${clientId}の税区分Override${overrides.length}件を永続化`)
  } catch (err) {
    console.error(`[accountMasterApi] 顧問先${clientId}の税区分Override永続化に失敗:`, err)
  }
}

/** 顧問先別税区分をJSONに永続化（旧形式・MFインポート時用） */
function persistClientTaxCategories(clientId: string, data: TaxCategory[]): void {
  try {
    const filePath = join(DATA_DIR, `tax-categories-${clientId}.json`)
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`[accountMasterApi] 顧問先${clientId}の税区分をJSONに永続化`)
  } catch (err) {
    console.error(`[accountMasterApi] 顧問先${clientId}の税区分永続化に失敗:`, err)
  }
}

/** 旧形式からOverrideへマイグレーション */
function migrateTaxFromLegacy(clientId: string, legacyTaxes: TaxCategory[]): void {
  const masterById = new Map(masterTaxCategories.map(t => [t.taxCategoryId, t]))
  const overrides: TaxCategoryOverride[] = []

  for (const tax of legacyTaxes) {
    const master = masterById.get(tax.taxCategoryId)
    if (!master) continue

    if (tax.hidden !== master.hidden) {
      overrides.push({ taxCategoryId: tax.taxCategoryId, hidden: tax.hidden })
    }
  }

  if (overrides.length > 0) {
    clientTaxOverrideStore.set(clientId, overrides)
    persistTaxOverrides(clientId, overrides)
    console.log(`[accountMasterApi] 顧問先${clientId}: 税区分Override${overrides.length}件を抽出`)
  }
}

/**
 * 起動時: 税区分Override + 旧データを復元
 */
function restoreAllClientTaxCategories(): void {
  if (!existsSync(DATA_DIR)) return
  const files = readdirSync(DATA_DIR)

  // 1. 税区分Override復元
  for (const file of files.filter(f => f.startsWith('tax-overrides-') && f.endsWith('.json'))) {
    const clientId = file.replace('tax-overrides-', '').replace('.json', '')
    try {
      const raw = readFileSync(join(DATA_DIR, file), 'utf-8')
      clientTaxOverrideStore.set(clientId, JSON.parse(raw))
      console.log(`[accountMasterApi] 顧問先${clientId}の税区分Overrideを復元`)
    } catch (err) {
      console.error(`[accountMasterApi] ${file}の読み込み失敗:`, err)
    }
  }

  // 2. 旧形式マイグレーション（tax-overridesが未作成の場合のみ）
  for (const file of files.filter(f => f.startsWith('tax-categories-') && f.endsWith('.json') && f !== 'tax-category-master.json')) {
    const clientId = file.replace('tax-categories-', '').replace('.json', '')
    try {
      const raw = readFileSync(join(DATA_DIR, file), 'utf-8')
      const legacy: TaxCategory[] = JSON.parse(raw)
      clientTaxStore.set(clientId, legacy) // 旧形式も保持（後方互換）

      if (!clientTaxOverrideStore.has(clientId)) {
        migrateTaxFromLegacy(clientId, legacy)
      }
      console.log(`[accountMasterApi] 顧問先${clientId}の税区分をJSONから復元`)
    } catch (err) {
      console.error(`[accountMasterApi] ${file}の読み込み失敗:`, err)
    }
  }
}

/**
 * 顧問先別の税区分一覧を取得する（マスタ + Override 合成）
 */
export function getClientTaxCategories(clientId: string): TaxCategory[] {
  const overrides = clientTaxOverrideStore.get(clientId) ?? []
  const overrideMap = new Map(overrides.map(o => [o.taxCategoryId, o]))

  return masterTaxCategories.map(t => {
    const override = overrideMap.get(t.taxCategoryId)
    const merged = override
      ? { ...t, ...(override.hidden !== undefined && { hidden: override.hidden }) }
      : { ...t }
    return enrichRow(merged)
  })
}

/** フィルタ付き顧問先税区分取得 */
export function getFilteredClientTaxCategories(
  clientId: string,
  params: TaxCategoryFilterParams,
): TaxCategoryFilterResult {
  const data = getClientTaxCategories(clientId)
  const {
    taxMethod = 'general',
    page = 1,
    pageSize = 50,
  } = params

  const filtered = data.filter(row => {
    if (taxMethod === 'all') return true
    return row.visibleIn?.[taxMethod as keyof NonNullable<TaxCategory['visibleIn']>] === true
  })

  const totalCount = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  const pagedItems = filtered.slice(start, start + pageSize)

  return {
    items: filtered,
    totalCount,
    pagedItems,
    page: safePage,
    totalPages,
  }
}

/**
 * 顧問先別の税区分を保存する（diff抽出→Override保存）
 */
export function saveClientTaxCategories(
  clientId: string,
  taxCategories: TaxCategory[],
): { ok: true; count: number } {
  const masterById = new Map(masterTaxCategories.map(t => [t.taxCategoryId, t]))
  const overrides: TaxCategoryOverride[] = []

  for (const tax of taxCategories) {
    const master = masterById.get(tax.taxCategoryId)
    if (!master) continue

    if (tax.hidden !== master.hidden) {
      overrides.push({ taxCategoryId: tax.taxCategoryId, hidden: tax.hidden })
    }
  }

  clientTaxOverrideStore.set(clientId, overrides)
  persistTaxOverrides(clientId, overrides)

  // 旧形式も更新（後方互換）
  clientTaxStore.set(clientId, [...taxCategories])
  persistClientTaxCategories(clientId, taxCategories)

  console.log(`[accountMasterApi] 顧問先${clientId}: 税区分Override${overrides.length}件保存`)
  return { ok: true, count: taxCategories.length }
}

// 起動時に永続化済みの顧問先別データを復元
restoreAllClientAccounts()
restoreAllClientTaxCategories()

// syncMasterAccountsToClients / syncMasterTaxCategoriesToClients 廃止済み
// Override方式ではマスタ直接参照のため同期不要。

// ────────────────────────────────────────────
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

console.log(`[accountMasterApi] 科目${masterAccounts.length}件 / 税区分${masterTaxCategories.length}件をロード（Override: ${clientOverrideStore.size}社 / MF: ${clientMfAccountStore.size}社 / 税区分: ${clientTaxStore.size}社）`)
