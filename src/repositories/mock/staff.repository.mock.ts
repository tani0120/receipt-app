/**
 * staff.repository.mock.ts — StaffRepositoryモック実装（サーバー用）
 *
 * 【依存方向】
 * StaffRepository → staffsApi（正しい方向）
 *
 * 【list()のフィルタ・ソート・ページネーション】
 * staffListService.tsから統合（2026-06-30 循環参照解消）
 * Supabase移行時: SELECT ... WHERE ... ORDER BY ... LIMIT に差し替え
 *
 * 準拠: DL-030, DL-042
 */

import {
  getAll,
  getById,
  getByEmail,
  getActiveStaff,
  create,
  update,
} from '../../api/services/staffsApi'
import type { StaffRepository, Staff } from '../types'

export const mockStaffRepo: StaffRepository = {
  getAll: async () => getAll(),
  getById: async (uuid) => getById(uuid),
  getByEmail: async (email) => getByEmail(email),
  getActiveStaff: async () => getActiveStaff(),
  create: async (staff) => create(staff),
  update: async (uuid, partial) => { update(uuid, partial) },

  /**
   * フィルタ+ソート+ページネーション付き一覧取得
   * staffListService.tsから統合（2026-06-30）
   * Supabase移行時: SELECT ... WHERE status = ? ORDER BY ... LIMIT に差し替え
   */
  list: async (query) => {
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

    return { rows: paged, totalCount, totalPages }
  },

  bulkCreate: async (items) => {
    const results: { index: number; ok: boolean; uuid?: string; error?: string }[] = []
    for (let i = 0; i < items.length; i++) {
      try {
        const saved = create(items[i] as unknown as Staff)
        results.push({ index: i, ok: true, uuid: saved.uuid })
      } catch (err) {
        results.push({ index: i, ok: false, error: String(err) })
      }
    }
    return { ok: true, results, total: items.length }
  },
}
