/**
 * accountMasterStore.ts — 科目・税区分マスタストア（サーバー側）
 *
 * Phase 2（2026-05-03）→ Phase 3（2026-05-22 JSON化）
 *
 * data/account-master.json / data/tax-category-master.json を
 * サーバー起動時に読み込み、API各サービスに提供する。
 *
 * 将来のSupabase移行時はDB読み込みに差し替える。
 * 現時点では顧問先カスタム科目は未対応（マスタのみ）。
 *
 * 準拠: DL-042
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'
import { getTaxAvailableForMethod } from './mfTaxAvailableStore'
import { join } from 'path'
import type { Account } from '../../types/shared-account'
import type { TaxCategory } from '../../types/shared-tax-category'

// ────────────────────────────────────────────
// JSONファイルからマスタデータを読み込み
// ────────────────────────────────────────────

const DATA_DIR = join(process.cwd(), 'data')

function loadAccounts(): Account[] {
  try {
    const raw = readFileSync(join(DATA_DIR, 'account-master.json'), 'utf-8')
    const accounts = JSON.parse(raw) as Account[]
    console.log(`[accountMasterStore] 科目${accounts.length}件をJSONから読み込み`)
    return accounts
  } catch (err) {
    console.error('[accountMasterStore] account-master.json読み込み失敗:', err)
    return []
  }
}

function loadTaxCategories(): TaxCategory[] {
  try {
    const raw = readFileSync(join(DATA_DIR, 'tax-category-master.json'), 'utf-8')
    const taxes = JSON.parse(raw) as TaxCategory[]
    console.log(`[accountMasterStore] 税区分${taxes.length}件をJSONから読み込み`)
    return taxes
  } catch (err) {
    console.error('[accountMasterStore] tax-category-master.json読み込み失敗:', err)
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
  return masterAccounts.find(a => a.id === id)
}

/** バリデーション/ヒント用の最小形式で全科目を返す */
export function getAccountsForValidation(): {
  id: string
  name: string
  sub?: string | null
  accountGroup?: string | null
  category?: string | null
  taxDetermination?: string | null
  defaultTaxCategoryId?: string | null
}[] {
  return masterAccounts.map(a => ({
    id: a.id,
    name: a.name,
    sub: null, // マスタには補助科目なし（顧問先カスタムはPhase 3以降）
    accountGroup: a.accountGroup ?? null,
    category: a.category ?? null,
    taxDetermination: a.taxDetermination ?? null,
    defaultTaxCategoryId: a.defaultTaxCategoryId ?? null,
  }))
}

/** 科目名マップ（ID→名前）を返す */
export function getAccountNameMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const a of masterAccounts) {
    map[a.id] = a.name
  }
  return map
}

// ────────────────────────────────────────────
// 科目マスタ — フィルタ・ソート・ページネーション
// ────────────────────────────────────────────

/** フィルタ条件 */
export interface AccountFilterParams {
  /** 事業形態フィルタ: corp / individual / realEstate */
  businessType?: 'corp' | 'individual' | 'realEstate'
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
    businessType = 'corp',
    search = '',
    page = 1,
    pageSize = 50,
  } = params

  // フィルタ
  let filtered = masterAccounts.filter(row => {
    // 事業形態フィルタ（排他選択）
    if (businessType === 'corp') {
      if (row.target !== 'both' && row.target !== 'corp') return false
    } else {
      // individual または realEstate
      if (row.target !== 'both' && row.target !== 'individual') return false
    }
    // 不動産フィルタ（realEstate以外は不動産科目非表示）
    if (businessType !== 'realEstate') {
      if (row.category === '不動産収入' || row.category === '不動産経費' || row.category === '不動産') return false
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
  console.log(`[accountMasterStore] マスタ科目を${accounts.length}件保存`)
  return { ok: true, count: accounts.length }
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
    console.log(`[accountMasterStore] 顧問先${clientId}の科目をJSONに永続化`)
  } catch (err) {
    console.error(`[accountMasterStore] 顧問先${clientId}の科目永続化に失敗:`, err)
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
      console.log(`[accountMasterStore] 顧問先${clientId}の科目をJSONから復元`)
    } catch (err) {
      console.error(`[accountMasterStore] ${file}の読み込み失敗:`, err)
    }
  }
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
    console.log(`[accountMasterStore] 顧問先${clientId}の科目をマスタから初期化`)
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
    if (businessType === 'corp') {
      if (row.target !== 'both' && row.target !== 'corp') return false
    } else {
      if (row.target !== 'both' && row.target !== 'individual') return false
    }
    if (businessType !== 'realEstate') {
      if (row.category === '不動産収入' || row.category === '不動産経費' || row.category === '不動産') return false
    }
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
  console.log(`[accountMasterStore] 顧問先${clientId}の科目を${accounts.length}件保存`)
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
  return masterTaxCategories.find(t => t.id === id)
}

/** バリデーション/ヒント用の最小形式で全税区分を返す */
export function getTaxCategoriesForValidation(): {
  id: string
  name: string
  shortName?: string | null
  direction?: string | null
}[] {
  return masterTaxCategories.map(t => ({
    id: t.id,
    name: t.name,
    shortName: t.shortName ?? null,
    direction: t.direction ?? null,
  }))
}

/** 税区分名マップ（ID→名前）を返す */
export function getTaxCategoryNameMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const t of masterTaxCategories) {
    map[t.id] = t.name
  }
  return map
}

// ────────────────────────────────────────────
// 税区分マスタ — フィルタ・ページネーション
// ────────────────────────────────────────────

/** 税区分フィルタ条件 */
export interface TaxCategoryFilterParams {
  /** 課税方式: general / simplified / exempt / all（全件） */
  taxMethod?: 'general' | 'simplified' | 'exempt' | 'all'
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
// IDパターンマッチ（フォールバック用: availableデータ未取得時のみ使用）
const isSimplifiedSales = (id: string) => /_T[1-6]$/.test(id)
const isIndividualPurchase = (id: string) =>
  /COMMON/.test(id) || /_NT_/.test(id) || /^PURCHASE_NT_/.test(id) || /^IMPORT_NT_/.test(id)
const isObsoleteRate = (name: string) => / 5%/.test(name) && !name.includes('(軽)')

/**
 * 課税方式に基づいて税区分をフィルタする共通関数
 *
 * 優先順位:
 * 1. MFのavailableデータが存在する場合 → availableで判定
 * 2. availableデータなし → IDパターンマッチ（フォールバック）
 *
 * 共通ルール:
 * - direction='common'（不明・対象外）は常に表示
 * - MF独自カスタム税区分（isCustom && source='mf'）は常に表示
 */
function filterByTaxMethod(row: TaxCategory, taxMethod: string): boolean {
  // MF独自カスタム税区分は常に表示（顧問先が意図的に作成したため）
  if (row.isCustom && row.source === 'mf') return true
  // direction='common'（不明・対象外）は全方式で常に表示
  if (row.direction === 'common') return true

  // --- MFのavailableベースのフィルタ ---
  const methodKeyMap: Record<string, string> = {
    'general': 'proportional',
    'proportional_allocation': 'proportional',
    'individual_allocation': 'individual',
    'individual': 'individual',
    'simplified': 'simplified',
    'exempt': 'exempt',
  }
  const methodKey = (methodKeyMap[taxMethod] ?? taxMethod) as import('./mfTaxAvailableStore').TaxMethodKey
  const availableData = getTaxAvailableForMethod(methodKey)

  if (availableData && row.mfId) {
    // availableデータあり → MFの判定を使用
    return availableData[row.mfId] === true
  }

  // --- フォールバック: IDパターンマッチ（availableデータ未取得時） ---
  if (taxMethod === 'exempt') {
    return false // commonは上で処理済み
  }
  if (taxMethod === 'simplified') {
    if (row.direction === 'sales') {
      return isSimplifiedSales(row.id) && !isObsoleteRate(row.name)
    }
    return row.active && !isIndividualPurchase(row.id)
  }
  if (taxMethod === 'individual' || taxMethod === 'individual_allocation') {
    if (isObsoleteRate(row.name)) return false
    if (row.direction === 'sales') return row.active
    return row.active || isIndividualPurchase(row.id)
  }
  // 一括比例（デフォルト）
  if (!row.active) return false
  if (isIndividualPurchase(row.id)) return false
  return row.defaultVisible
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
  console.log(`[accountMasterStore] マスタ税区分を${taxCategories.length}件保存`)
  return { ok: true, count: taxCategories.length }
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
    console.log(`[accountMasterStore] 顧問先${clientId}の税区分をJSONに永続化`)
  } catch (err) {
    console.error(`[accountMasterStore] 顧問先${clientId}の税区分永続化に失敗:`, err)
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
      console.log(`[accountMasterStore] 顧問先${clientId}の税区分をJSONから復元`)
    } catch (err) {
      console.error(`[accountMasterStore] ${file}の読み込み失敗:`, err)
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
    console.log(`[accountMasterStore] 顧問先${clientId}の税区分をマスタから初期化`)
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
  console.log(`[accountMasterStore] 顧問先${clientId}の税区分を${taxCategories.length}件保存`)
  return { ok: true, count: taxCategories.length }
}

// 起動時に永続化済みの顧問先別データを復元
restoreAllClientAccounts()
restoreAllClientTaxCategories()

console.log(`[accountMasterStore] 科目${masterAccounts.length}件 / 税区分${masterTaxCategories.length}件をロード（顧問先別: 科目${clientAccountStore.size}社 / 税区分${clientTaxStore.size}社を復元）`)
