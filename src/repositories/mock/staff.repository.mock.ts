/**
 * staff.repository.mock.ts — StaffRepositoryモック実装（サーバー用）
 *
 * 【依存方向】
 * StaffRepository → staffsApi（正しい方向）
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
import { getStaffList } from '../../api/services/staffListService'
import type { StaffRepository, Staff } from '../types'

export const mockStaffRepo: StaffRepository = {
  getAll: async () => getAll(),
  getById: async (uuid) => getById(uuid),
  getByEmail: async (email) => getByEmail(email),
  getActiveStaff: async () => getActiveStaff(),
  create: async (staff) => create(staff),
  update: async (uuid, partial) => { update(uuid, partial) },
  list: async (query) => {
    const result = await getStaffList(query)
    return { rows: result.rows, totalCount: result.totalCount, totalPages: result.totalPages }
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
