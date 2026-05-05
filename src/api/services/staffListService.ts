/**
 * staffListService.ts — スタッフ一覧サービス（API側）
 *
 * MockMasterStaffPage.vue の filteredRows computed ロジックをAPI側に移植。
 * journalListService.ts と同じパターン（filter → sort → paginate）。
 *
 * Supabase移行時: getAll() を SELECT ... WHERE ... ORDER BY に差し替えるだけ。
 */

import { getAll } from './staffStore'
import type { Staff } from '../../repositories/types'

// ────────────────────────────────────────────
// クエリパラメータ（フロントからPOSTで送信）
// ────────────────────────────────────────────

export interface StaffListQuery {
  /** ステータスフィルタ: 'all' | 'active' | 'inactive' */
  statusFilter?: 'all' | 'active' | 'inactive'
  /** ソートキー: Staff型のキー名 */
  sortKey?: string
  /** ソート方向 */
  sortOrder?: 'asc' | 'desc'
  /** ページ番号（1始まり） */
  page?: number
  /** ページサイズ */
  pageSize?: number
}

// ────────────────────────────────────────────
// API応答
// ────────────────────────────────────────────

export interface StaffListResponse {
  rows: Staff[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

// ────────────────────────────────────────────
// 統合一覧API
// ────────────────────────────────────────────

export function getStaffList(query: StaffListQuery): StaffListResponse {
  // 1. 全件取得
  let rows = [...getAll()]

  // 2. ステータスフィルタ
  const statusFilter = query.statusFilter ?? 'active'
  if (statusFilter !== 'all') {
    rows = rows.filter(r => r.status === statusFilter)
  }

  // 3. ソート
  const sortKey = (query.sortKey ?? 'uuid') as keyof Staff
  const sortOrder = query.sortOrder ?? 'asc'
  rows.sort((a, b) => {
    const va = String(a[sortKey] ?? '')
    const vb = String(b[sortKey] ?? '')
    if (va < vb) return sortOrder === 'asc' ? -1 : 1
    if (va > vb) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  // 4. ページネーション
  const totalCount = rows.length
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 20
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const start = (page - 1) * pageSize
  const paged = rows.slice(start, start + pageSize)

  return {
    rows: paged,
    totalCount,
    page,
    pageSize,
    totalPages,
  }
}
