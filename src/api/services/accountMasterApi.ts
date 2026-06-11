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
import type { Account, AccountGroup } from '../../types/shared-account'
import type { TaxCategory, TaxDirection } from '../../types/shared-tax-category'

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

function loadTaxCategories(): TaxCategory[] {
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
export function getAccountNameMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const a of masterAccounts) {
    map[a.accountId] = a.name
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

  // 全顧問先のクローンデータに差分同期（新規追加・名前変更を反映）
  syncMasterAccountsToClients(accounts)

  return { ok: true, count: accounts.length }
}

/**
 * 全社マスタ更新時に全顧問先のクローンデータを差分同期する（科目）
 *
 * - マスタに新規追加された科目 → 顧問先データに追加
 * - マスタで名前が変更された科目 → 顧問先データの名前を更新
 * - マスタから削除された科目 → 顧問先データからは削除しない（仕訳参照を壊さないため）
 * - MFフィールド（mfAccountId等）は顧問先データにコピーしない
 */
function syncMasterAccountsToClients(masterItems: Account[]): void {
  const masterById = new Map(masterItems.map(a => [a.accountId, a]))
  let syncCount = 0

  for (const [clientId, clientData] of clientAccountStore.entries()) {
    const clientIdSet = new Set(clientData.accounts.map(a => a.accountId))
    let changed = false

    // 新規追加: マスタにあって顧問先にない科目を追加
    for (const master of masterItems) {
      if (!clientIdSet.has(master.accountId)) {
        // MFフィールドを除外してクローン（全社マスタにMFフィールドは存在しないが安全装置として残す）
        const { mfAccountId, mfAccountGroup, mfFinancialStatementType, ...rest } = master as Account & {
          mfAccountId?: string; mfAccountGroup?: string; mfFinancialStatementType?: string
        }
        clientData.accounts.push({ ...rest })
        changed = true
      }
    }

    // コアフィールド同期: マスタとIDが一致する科目のフィールドを同期
    // （MFフィールド mfAccountId等は顧問先固有なので同期しない）
    const syncFields: (keyof Account)[] = [
      'name', 'accountGroup', 'category',
      'target', 'deprecated', 'defaultTaxCategoryId',
      'isContraRevenue', 'isContraExpense',
    ]
    for (const clientAccount of clientData.accounts) {
      const master = masterById.get(clientAccount.accountId)
      if (!master) continue
      for (const field of syncFields) {
        const masterVal = master[field]
        const clientVal = clientAccount[field]
        if (masterVal !== clientVal && masterVal !== undefined) {
          ;(clientAccount as Record<string, unknown>)[field] = masterVal
          changed = true
        }
      }
    }

    if (changed) {
      persistClientAccounts(clientId, clientData)
      syncCount++
      console.log(`[accountMasterApi] 顧問先${clientId}の科目を${clientData.accounts.length}件に同期`)
    }
  }
  if (syncCount > 0) {
    console.log(`[accountMasterApi] マスタ科目変更を${syncCount}社に反映`)
  }
}

// ────────────────────────────────────────────
// 顧問先別科目ストア（clientId別に管理）
// 将来: Supabase client_accounts テーブルに差し替え
// ────────────────────────────────────────────

/** 顧問先別科目データ */
interface ClientAccountData {
  /** 科目一覧（マスタ + カスタム、非表示含む） */
  accounts: Account[]
  /** 補助科目マップ（科目ID → 補助科目名） */
  subAccounts: Record<string, string>
}

/** インメモリストア: clientId → ClientAccountData */
const clientAccountStore = new Map<string, ClientAccountData>()

// ── 永続化ヘルパー（科目） ──

/** 顧問先別科目をJSONに永続化 */
function persistClientAccounts(clientId: string, data: ClientAccountData): void {
  try {
    const filePath = join(DATA_DIR, `accounts-${clientId}.json`)
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`[accountMasterApi] 顧問先${clientId}の科目をJSONに永続化`)
  } catch (err) {
    console.error(`[accountMasterApi] 顧問先${clientId}の科目永続化に失敗:`, err)
  }
}

/** 起動時: data/accounts-{clientId}.json を読み込んで復元 */
function restoreAllClientAccounts(): void {
  if (!existsSync(DATA_DIR)) return
  const files = readdirSync(DATA_DIR)
    .filter(f => f.startsWith('accounts-') && f.endsWith('.json') && f !== 'account-master.json')
  for (const file of files) {
    const clientId = file.replace('accounts-', '').replace('.json', '')
    try {
      const raw = readFileSync(join(DATA_DIR, file), 'utf-8')
      clientAccountStore.set(clientId, JSON.parse(raw))
      console.log(`[accountMasterApi] 顧問先${clientId}の科目をJSONから復元`)
    } catch (err) {
      console.error(`[accountMasterApi] ${file}の読み込み失敗:`, err)
    }
  }
}

/**
 * 顧問先マスタがストアに存在するか（ファイルから復元済み or saveClientAccounts済み）
 * 存在しない場合、getClientAccountsは全社マスタのクローンを返す（初回）
 */
export function hasClientAccounts(clientId: string): boolean {
  return clientAccountStore.has(clientId)
}

/**
 * 顧問先別の科目一覧を取得する
 *
 * 初回アクセス時はマスタからクローンして初期化する。
 */
export function getClientAccounts(clientId: string): ClientAccountData {
  if (!clientAccountStore.has(clientId)) {
    // 初期化: マスタからクローン
    clientAccountStore.set(clientId, {
      accounts: masterAccounts.map(a => ({ ...a })),
      subAccounts: {},
    })
    console.log(`[accountMasterApi] 顧問先${clientId}の科目をマスタから初期化`)
  }
  return clientAccountStore.get(clientId)!
}

/** フィルタ付き顧問先科目取得 */
export function getFilteredClientAccounts(
  clientId: string,
  params: AccountFilterParams,
): AccountFilterResult {
  const data = getClientAccounts(clientId)
  const {
    businessType = 'corp',
    search = '',
    page = 1,
    pageSize = 50,
  } = params

  let filtered = data.accounts.filter(row => {
    if (row.target !== businessType) return false
    if (search && !row.name.includes(search)) return false
    return true
  })

  filtered = filtered.sort((a, b) => a.sortOrder - b.sortOrder)

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
 * 顧問先別の科目を全件上書き保存する
 *
 * フロントの saveChanges → localStorage書き込みを置換する。
 */
export function saveClientAccounts(
  clientId: string,
  accounts: Account[],
  subAccounts?: Record<string, string>,
): { ok: true; count: number } {
  const data: ClientAccountData = {
    accounts: [...accounts],
    subAccounts: subAccounts ?? clientAccountStore.get(clientId)?.subAccounts ?? {},
  }
  clientAccountStore.set(clientId, data)
  persistClientAccounts(clientId, data)
  console.log(`[accountMasterApi] 顧問先${clientId}の科目を${accounts.length}件保存`)
  return { ok: true, count: accounts.length }
}

// ────────────────────────────────────────────
// 税区分マスタ
// ────────────────────────────────────────────

/** マスタ税区分一覧（変更可能。saveで上書き） */
let masterTaxCategories: TaxCategory[] = loadTaxCategories()

/** 全税区分を取得 */
export function getAllTaxCategories(): readonly TaxCategory[] {
  return masterTaxCategories
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

/**
 * 課税方式に基づいて税区分をフィルタする共通関数
 *
 * MFのavailableデータで判定（データ駆動）。
 * availableデータなし → active && defaultVisible（安全なデフォルト）
 *
 * 共通ルール:
 * - direction='common'（不明・対象外）は常に表示
 * - MF独自カスタム税区分（isCustom && source='mf'）は常に表示
 */
/**
 * 課税方式で税区分をフィルタする
 *
 * available.jsonのキーはマスタID（例: SALES_TAXABLE_10）。
 * 2026-06-04にmfId→マスタIDに移行したため、row.taxCategoryIdで直接参照可能。
 * MF IDは事業者固有で事業者間一致しないため、マスタIDをキーにすることで
 * 事業者切替（TSK→TST等）してもフィルタが壊れない。
 */
function filterByTaxMethod(row: TaxCategory, taxMethod: string): boolean {
  // MF独自カスタム税区分は常に表示（顧問先が意図的に作成したため）
  if (row.isCustom && row.source === 'mf') return true
  // direction='common'（不明・対象外）は全方式で常に表示
  if (row.direction === 'common') return true

  // --- MFのavailableベースのフィルタ（データ駆動。キー=マスタID） ---
  const methodKeyMap: Record<string, string> = {
    'general': 'proportional',
    'proportional': 'proportional',
    'individual': 'individual',
    'simplified': 'simplified',
    'exempt': 'exempt',
  }
  const methodKey = (methodKeyMap[taxMethod] ?? taxMethod) as import('./mfTaxAvailableStore').TaxMethodKey
  const availableData = getTaxAvailableForMethod(methodKey)

  if (availableData && row.taxCategoryId) {
    // availableデータあり → マスタIDでフィルタ
    return availableData[row.taxCategoryId] === true
  }

  // availableデータなし → デフォルト表示（active行のみ）
  if (taxMethod === 'exempt') return false
  return row.active && row.defaultVisible
}

/**
 * マスタ税区分をフィルタ・ページネーションして返す
 *
 * フロントの filteredTaxRows computed を置換する。
 */
export function getFilteredTaxCategories(params: TaxCategoryFilterParams): TaxCategoryFilterResult {
  const {
    taxMethod = 'general',
    page = 1,
    pageSize = 50,
  } = params

  const filtered = masterTaxCategories.filter(row => {
    if (taxMethod === 'all') return true
    return filterByTaxMethod(row, taxMethod)
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
  // JSON永続化（サーバー再起動でも変更を維持）
  try {
    writeFileSync(join(DATA_DIR, 'tax-category-master.json'), JSON.stringify(taxCategories, null, 2), 'utf-8')
    console.log(`[accountMasterApi] マスタ税区分を${taxCategories.length}件保存・永続化`)
  } catch (err) {
    console.error('[accountMasterApi] tax-category-master.json永続化失敗:', err)
  }

  // 全顧問先のクローンデータに差分同期（新規追加・名前変更を反映）
  syncMasterTaxCategoriesToClients(taxCategories)

  return { ok: true, count: taxCategories.length }
}

/**
 * 全社マスタ更新時に全顧問先のクローンデータを差分同期する（税区分）
 *
 * - マスタに新規追加された税区分 → 顧問先データに追加
 * - マスタで名前・税率が変更された税区分 → 顧問先データを更新
 * - マスタから削除された税区分 → 顧問先データからは削除しない（仕訳参照を壊さないため）
 */
function syncMasterTaxCategoriesToClients(masterItems: TaxCategory[]): void {
  const masterById = new Map(masterItems.map(t => [t.taxCategoryId, t]))
  let syncCount = 0

  for (const [clientId, clientTaxes] of clientTaxStore.entries()) {
    const clientIdSet = new Set(clientTaxes.map(t => t.taxCategoryId))
    let changed = false

    // 新規追加: マスタにあって顧問先にない税区分を追加
    for (const master of masterItems) {
      if (!clientIdSet.has(master.taxCategoryId)) {
        clientTaxes.push({ ...master })
        changed = true
      }
    }

    // 名前・税率変更: マスタとIDが一致する税区分を同期
    for (const clientTax of clientTaxes) {
      const master = masterById.get(clientTax.taxCategoryId)
      if (!master) continue
      if (master.name !== clientTax.name) {
        clientTax.name = master.name
        changed = true
      }
      if (master.taxRate !== clientTax.taxRate) {
        clientTax.taxRate = master.taxRate
        changed = true
      }
    }

    if (changed) {
      persistClientTaxCategories(clientId, clientTaxes)
      syncCount++
      console.log(`[accountMasterApi] 顧問先${clientId}の税区分を${clientTaxes.length}件に同期`)
    }
  }
  if (syncCount > 0) {
    console.log(`[accountMasterApi] マスタ税区分変更を${syncCount}社に反映`)
  }
}

// ────────────────────────────────────────────
// 顧問先別税区分ストア（clientId別に管理）
// 将来: Supabase client_tax_categories テーブルに差し替え
// ────────────────────────────────────────────

/** インメモリストア: clientId → TaxCategory[] */
const clientTaxStore = new Map<string, TaxCategory[]>()

// ── 永続化ヘルパー（税区分） ──

/** 顧問先別税区分をJSONに永続化 */
function persistClientTaxCategories(clientId: string, data: TaxCategory[]): void {
  try {
    const filePath = join(DATA_DIR, `tax-categories-${clientId}.json`)
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`[accountMasterApi] 顧問先${clientId}の税区分をJSONに永続化`)
  } catch (err) {
    console.error(`[accountMasterApi] 顧問先${clientId}の税区分永続化に失敗:`, err)
  }
}

/** 起動時: data/tax-categories-{clientId}.json を読み込んで復元 */
function restoreAllClientTaxCategories(): void {
  if (!existsSync(DATA_DIR)) return
  const files = readdirSync(DATA_DIR)
    .filter(f => f.startsWith('tax-categories-') && f.endsWith('.json') && f !== 'tax-category-master.json')
  for (const file of files) {
    const clientId = file.replace('tax-categories-', '').replace('.json', '')
    try {
      const raw = readFileSync(join(DATA_DIR, file), 'utf-8')
      clientTaxStore.set(clientId, JSON.parse(raw))
      console.log(`[accountMasterApi] 顧問先${clientId}の税区分をJSONから復元`)
    } catch (err) {
      console.error(`[accountMasterApi] ${file}の読み込み失敗:`, err)
    }
  }
}

/**
 * 顧問先別の税区分一覧を取得する
 *
 * 初回アクセス時はマスタからクローンして初期化する。
 */
export function getClientTaxCategories(clientId: string): TaxCategory[] {
  if (!clientTaxStore.has(clientId)) {
    clientTaxStore.set(clientId, masterTaxCategories.map(t => ({ ...t })))
    console.log(`[accountMasterApi] 顧問先${clientId}の税区分をマスタから初期化`)
  }
  return clientTaxStore.get(clientId)!
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

  const filtered = data.filter(row => filterByTaxMethod(row, taxMethod))

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
 * 顧問先別の税区分を全件上書き保存する
 */
export function saveClientTaxCategories(
  clientId: string,
  taxCategories: TaxCategory[],
): { ok: true; count: number } {
  const data = [...taxCategories]
  clientTaxStore.set(clientId, data)
  persistClientTaxCategories(clientId, data)
  console.log(`[accountMasterApi] 顧問先${clientId}の税区分を${taxCategories.length}件保存`)
  return { ok: true, count: taxCategories.length }
}

// 起動時に永続化済みの顧問先別データを復元
restoreAllClientAccounts()
restoreAllClientTaxCategories()

// 起動時に全顧問先をマスタと同期（新規科目追加・フィールド変更を反映）
// マスタ変更後にsyncを経由せず永続化されたケース（ID移行スクリプト等）の
// 不整合を起動時に自動修復する
syncMasterAccountsToClients(masterAccounts)
syncMasterTaxCategoriesToClients(masterTaxCategories)

console.log(`[accountMasterApi] 科目${masterAccounts.length}件 / 税区分${masterTaxCategories.length}件をロード（顧問先別: 科目${clientAccountStore.size}社 / 税区分${clientTaxStore.size}社を復元・同期）`)
