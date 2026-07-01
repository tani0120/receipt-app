/**
 * staff.repository.http.ts — StaffRepository HTTP実装（フロントエンド用）
 *
 * 【依存方向】
 * staffStore(Pinia) → StaffRepository(HTTP) → /api/staff
 *
 * 準拠: DL-030, DL-042
 */

import { honoClient } from '../../utils/honoClient'
import type { Staff } from '../types'
import type { StaffRepository } from '../types'

export const httpStaffRepo: StaffRepository = {
  getAll: async () => {
    const res = await honoClient.api.staff.$get()
    const data = await res.json() as { staff: Staff[] }
    return data.staff
  },

  getById: async (uuid) => {
    try {
      const res = await honoClient.api.staff[':uuid'].$get({ param: { uuid } })
      const data = await res.json() as { staff: Staff }
      return data.staff
    } catch {
      return undefined
    }
  },

  getByEmail: async (email) => {
    try {
      const res = await honoClient.api.staff.email[':email'].$get({ param: { email: encodeURIComponent(email) } })
      const data = await res.json() as { staff: Staff }
      return data.staff
    } catch {
      return undefined
    }
  },

  getActiveStaff: async () => {
    const res = await honoClient.api.staff.$get({ query: { status: 'active' } })
    const data = await res.json() as { staff: Staff[] }
    return data.staff
  },

  create: async (staff) => {
    const res = await honoClient.api.staff.$post({ json: staff as Record<string, unknown> })
    const data = await res.json() as { ok: boolean; staff: Staff }
    return data.staff
  },

  update: async (uuid, partial) => {
    await honoClient.api.staff[':uuid'].$put({
      param: { uuid },
      json: partial as Record<string, unknown>,
    })
  },

  list: async (query) => {
    const res = await honoClient.api.staff.list.$post({ json: query as Record<string, unknown> })
    return await res.json() as { rows: Staff[]; totalCount: number; totalPages: number }
  },

  bulkCreate: async (items) => {
    const res = await honoClient.api.staff.bulk.$post({ json: { items } as Record<string, unknown> })
    return await res.json() as {
      ok: boolean
      results: { index: number; ok: boolean; uuid?: string; error?: string }[]
      total: number
    }
  },
}
