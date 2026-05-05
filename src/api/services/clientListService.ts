/**
 * clientListService.ts — 顧問先一覧サービス（API側）
 *
 * MockMasterClientsPage.vue の filteredRows computed ロジックをAPI側に移植。
 * staffListService.ts と同じパターン。
 *
 * 特殊ソート: staffName（staffIdからスタッフ名を解決してソート）、clientId（数字部分のみ数値ソート）
 *
 * Supabase移行時: getAll() を JOIN ... WHERE ... ORDER BY に差し替えるだけ。
 */

import { getAll } from './clientStore'
import { getAll as getAllStaff } from './staffStore'
import type { Client } from '../../repositories/types'

// ────────────────────────────────────────────
// クエリパラメータ
// ────────────────────────────────────────────

export interface ClientListQuery {
  /** ステータスフィルタ（複数可） */
  statusFilters?: string[]
  /** ソートキー */
  sortKey?: string
  /** ソート方向 */
  sortOrder?: 'asc' | 'desc'
  /** ページ番号 */
  page?: number
  /** ページサイズ */
  pageSize?: number
}

// ────────────────────────────────────────────
// API応答
// ────────────────────────────────────────────

export interface ClientListResponse {
  rows: Client[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

// ────────────────────────────────────────────
// 統合一覧API
// ────────────────────────────────────────────

export function getClientList(query: ClientListQuery): ClientListResponse {
  // 1. 全件取得
  let rows = [...getAll()]

  // 2. ステータスフィルタ
  if (query.statusFilters && query.statusFilters.length > 0) {
    rows = rows.filter(r => query.statusFilters!.includes(r.status))
  }

  // 3. ソート
  const sortKey = query.sortKey ?? 'threeCode'
  const sortOrder = query.sortOrder ?? 'asc'

  if (sortKey === 'staffName') {
    // staffId → スタッフ名を解決してソート
    const staffAll = getAllStaff()
    const staffMap = new Map(staffAll.map(s => [s.uuid, s.name]))
    rows.sort((a, b) => {
      const sa = (a.staffId ? staffMap.get(a.staffId) : '') ?? ''
      const sb = (b.staffId ? staffMap.get(b.staffId) : '') ?? ''
      return sortOrder === 'asc'
        ? sa.localeCompare(sb, 'ja')
        : sb.localeCompare(sa, 'ja')
    })
  } else if (sortKey === 'clientId') {
    // clientId: 数字部分のみ数値ソート
    rows.sort((a, b) => {
      const na = parseInt(a.clientId.split('-').pop() || '0', 10)
      const nb = parseInt(b.clientId.split('-').pop() || '0', 10)
      return sortOrder === 'asc' ? na - nb : nb - na
    })
  } else {
    const key = sortKey as keyof Client
    rows.sort((a, b) => {
      const va = String(a[key] ?? '')
      const vb = String(b[key] ?? '')
      return sortOrder === 'asc'
        ? va.localeCompare(vb, 'ja')
        : vb.localeCompare(va, 'ja')
    })
  }

  // 4. ページネーション
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
  }
}
