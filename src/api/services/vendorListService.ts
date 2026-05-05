/**
 * vendorListService.ts — 取引先一覧サービス（API側）
 *
 * MockMasterVendorsPage.vue の filteredRows computed ロジックをAPI側に移植。
 * staffListService.ts / journalListService.ts と同じパターン。
 *
 * Supabase移行時: getAll() を SELECT ... WHERE ... ORDER BY に差し替えるだけ。
 */

import { getAll } from './vendorStore'
import type { Vendor } from '../../mocks/types/pipeline/vendor.type'

// ────────────────────────────────────────────
// クエリパラメータ
// ────────────────────────────────────────────

export interface VendorListQuery {
  /** テキスト検索（会社名・照合キー・別名） */
  search?: string
  /** 業種フィルタ */
  vectorFilter?: string
  /** 入出金フィルタ */
  directionFilter?: string
  /** 証票種類フィルタ（NonVendor用） */
  sourceFilter?: string
  /** 確定レベルフィルタ（NonVendor用） */
  levelFilter?: string
  /** ソートキー */
  sortKey?: string
  /** ソート方向 */
  sortOrder?: 'asc' | 'desc'
  /** ページ番号 */
  page?: number
  /** ページサイズ */
  pageSize?: number
  /** タイプ: 'vendor' | 'non_vendor' */
  type?: string
}

// ────────────────────────────────────────────
// API応答
// ────────────────────────────────────────────

export interface VendorListResponse {
  rows: Vendor[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  /** データに存在するユニーク業種一覧 */
  uniqueVectors: string[]
}

// ────────────────────────────────────────────
// 照合キー生成（vendorIdentificationの簡易版）
// ────────────────────────────────────────────

function normalizeForSearch(name: string): string {
  return name
    .toLowerCase()
    .replace(/[ａ-ｚＡ-Ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/[\s　()（）「」『』【】・,、.。]/g, '')
    .replace(/(株式会社|有限会社|合同会社|合名会社|合資会社|一般社団法人|一般財団法人|公益社団法人|公益財団法人|特定非営利活動法人|医療法人|学校法人|宗教法人)/g, '')
}

// ────────────────────────────────────────────
// 統合一覧API
// ────────────────────────────────────────────

export function getVendorList(query: VendorListQuery): VendorListResponse {
  // 1. 全件取得（タイプフィルタ）
  const allVendors = getAll()
  let rows: Vendor[]
  if (query.type === 'non_vendor') {
    rows = allVendors.filter(v => v.non_vendor_type !== null)
  } else if (query.type === 'vendor') {
    rows = allVendors.filter(v => v.non_vendor_type === null)
  } else {
    rows = [...allVendors]
  }

  // ユニーク業種一覧（フィルタ前の全データから）
  const uniqueVectors = [...new Set(rows.map(v => v.vendor_vector).filter(Boolean))].sort() as string[]

  // 2. テキスト検索
  if (query.search) {
    const q = query.search.toLowerCase()
    rows = rows.filter(r =>
      r.company_name.toLowerCase().includes(q) ||
      normalizeForSearch(r.company_name).includes(q) ||
      r.aliases.some(a => a.toLowerCase().includes(q))
    )
  }

  // 3. 業種フィルタ
  if (query.vectorFilter) {
    rows = rows.filter(r => r.vendor_vector === query.vectorFilter)
  }

  // 4. 入出金フィルタ
  if (query.directionFilter) {
    rows = rows.filter(r => r.direction === query.directionFilter)
  }

  // 4b. 証票種類フィルタ（NonVendor用）
  if (query.sourceFilter) {
    rows = rows.filter(r => r.source_category === query.sourceFilter)
  }

  // 4c. 確定レベルフィルタ（NonVendor用）
  if (query.levelFilter) {
    rows = rows.filter(r => r.level === query.levelFilter)
  }

  // 5. ソート
  if (query.sortKey) {
    const key = query.sortKey as keyof Vendor
    const asc = query.sortOrder !== 'desc'
    rows.sort((a, b) => {
      const va = String(a[key] ?? '')
      const vb = String(b[key] ?? '')
      return asc ? va.localeCompare(vb, 'ja') : vb.localeCompare(va, 'ja')
    })
  }

  // 6. ページネーション
  const totalCount = rows.length
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 50
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const start = (page - 1) * pageSize
  const paged = rows.slice(start, start + pageSize)

  return {
    rows: paged,
    totalCount,
    page,
    pageSize,
    totalPages,
    uniqueVectors,
  }
}
