/**
 * accountMasterStore.ts — 科目・税区分マスタストア（サーバー側）
 *
 * Phase 2（2026-05-03）
 *
 * shared/data/ の ACCOUNT_MASTER / TAX_CATEGORY_MASTER を
 * サーバー側から直接参照し、API各サービスに提供する。
 *
 * 将来のSupabase移行時はDB読み込みに差し替える。
 * 現時点では顧問先カスタム科目は未対応（マスタのみ）。
 *
 * 準拠: DL-042
 */

import { ACCOUNT_MASTER } from '../../shared/data/account-master'
import { TAX_CATEGORY_MASTER } from '../../shared/data/tax-category-master'
import type { Account } from '../../types/shared-account'
import type { TaxCategory } from '../../types/shared-tax-category'

// ────────────────────────────────────────────
// インメモリストア（将来Supabase移行時にDB呼び出しに差し替え）
// ────────────────────────────────────────────

/** マスタ科目一覧（変更可能。saveで上書き） */
let masterAccounts: Account[] = [...ACCOUNT_MASTER]

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
  clientAccountStore.set(clientId, {
    accounts: [...accounts],
    subAccounts: subAccounts ?? clientAccountStore.get(clientId)?.subAccounts ?? {},
  })
  console.log(`[accountMasterStore] 顧問先${clientId}の科目を${accounts.length}件保存`)
  return { ok: true, count: accounts.length }
}

// ────────────────────────────────────────────
// 税区分マスタ
// ────────────────────────────────────────────

/** マスタ税区分一覧（変更可能。saveで上書き） */
let masterTaxCategories: TaxCategory[] = [...TAX_CATEGORY_MASTER]

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
  /** 課税方式: general / simplified / exempt */
  taxMethod?: 'general' | 'simplified' | 'exempt'
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

  const isT = (id: string) => /_T[1-6]$/.test(id)

  const filtered = masterTaxCategories.filter(row => {
    if (taxMethod === 'exempt') {
      return row.id === 'COMMON_EXEMPT'
    }
    if (taxMethod === 'simplified') {
      if (!row.active && !isT(row.id)) return false
      if (row.direction === 'sales' && !isT(row.id)) return false
      return isT(row.id) || row.direction === 'purchase' || row.direction === 'common'
    }
    // 本則
    if (!row.active) return false
    return row.defaultVisible
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

  const filtered = data.filter(row => {
    if (!row.active) return false
    if (taxMethod === 'exempt') {
      return row.id === 'COMMON_EXEMPT'
    }
    if (taxMethod === 'simplified') {
      return row.defaultVisible && (
        row.direction === 'common' ||
        row.direction === 'sales' ||
        row.id === 'PURCHASE_TAXABLE_10' ||
        row.id === 'PURCHASE_REDUCED_8' ||
        row.id === 'PURCHASE_NON_TAXABLE' ||
        row.id === 'PURCHASE_EXEMPT'
      )
    }
    return row.defaultVisible
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
 * 顧問先別の税区分を全件上書き保存する
 */
export function saveClientTaxCategories(
  clientId: string,
  taxCategories: TaxCategory[],
): { ok: true; count: number } {
  clientTaxStore.set(clientId, [...taxCategories])
  console.log(`[accountMasterStore] 顧問先${clientId}の税区分を${taxCategories.length}件保存`)
  return { ok: true, count: taxCategories.length }
}

console.log(`[accountMasterStore] 科目${ACCOUNT_MASTER.length}件 / 税区分${TAX_CATEGORY_MASTER.length}件をロード`)
