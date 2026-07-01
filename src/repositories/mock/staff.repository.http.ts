/**
 * staff.repository.http.ts — StaffRepository HTTP実装（フロントエンド用）
 *
 * 【依存方向】
 * staffStore(Pinia) → StaffRepository(HTTP) → /api/staff
 *
 * 準拠: DL-030, DL-042
 */

import { createApiClient } from '../../utils/apiClient'
import type { Staff } from '../types'
import type { StaffRepository } from '../types'

const api = createApiClient('/api/staff')

export const httpStaffRepo: StaffRepository = {
  getAll: async () => {
    const data = await api.get<{ staff: Staff[] }>('')
    return data.staff
  },

  getById: async (uuid) => {
    try {
      const res = await api.get<{ staff: Staff }>(`/${uuid}`)
      return res.staff
    } catch {
      return undefined
    }
  },

  getByEmail: async (email) => {
    try {
      const res = await api.get<{ staff: Staff }>(`?email=${encodeURIComponent(email)}`)
      return res.staff
    } catch {
      return undefined
    }
  },

  getActiveStaff: async () => {
    const data = await api.get<{ staff: Staff[] }>('?status=active')
    return data.staff
  },

  create: async (staff) => {
    const res = await api.post<{ ok: boolean; staff: Staff }>('', staff)
    return res.staff
  },

  update: async (uuid, partial) => {
    await api.put(`/${uuid}`, partial)
  },

  list: async (query) => {
    return api.post<{ rows: Staff[]; totalCount: number; totalPages: number }>('/list', query)
  },

  bulkCreate: async (items) => {
    return api.post<{
      ok: boolean
      results: { index: number; ok: boolean; uuid?: string; error?: string }[]
      total: number
    }>('/bulk', { items })
  },
}
