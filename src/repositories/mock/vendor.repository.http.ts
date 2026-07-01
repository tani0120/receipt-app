/**
 * vendor.repository.http.ts — VendorRepository HTTP実装（フロントエンド用）
 *
 * 【依存方向】
 * フロント → VendorRepository(HTTP) → /api/vendors
 *
 * 準拠: DL-030, DL-042
 */

import { createApiClient } from '../../utils/apiClient'
import type { Vendor } from '../../types/pipeline/vendor.type'
import type { VendorRepository } from '../types'

const api = createApiClient('/api/vendors')

export const httpVendorRepo: VendorRepository = {
  getAll: async () => {
    const res = await api.get<{ vendors: Vendor[] }>('')
    return res.vendors
  },

  getByType: async (type) => {
    const res = await api.get<{ vendors: Vendor[] }>(`?type=${type}`)
    return res.vendors
  },

  findByMatchKey: async (key) => {
    const res = await api.get<{ vendors: Vendor[] }>(`?matchKey=${encodeURIComponent(key)}`)
    return res.vendors[0]
  },

  findByTNumber: async (tNumber) => {
    const res = await api.get<{ vendors: Vendor[] }>(`?tNumber=${encodeURIComponent(tNumber)}`)
    return res.vendors[0]
  },

  findByPhoneNumber: async (phone) => {
    const res = await api.get<{ vendors: Vendor[] }>(`?phone=${encodeURIComponent(phone)}`)
    return res.vendors[0]
  },

  create: async (vendor) => {
    return api.post<Vendor>('', vendor)
  },

  deleteById: async (vendorId) => {
    await api.del(`/${vendorId}`)
  },

  list: async (query) => {
    return api.post<{
      rows: Vendor[]
      totalCount: number
      totalPages: number
      uniqueVectors?: string[]
    }>('/list', query)
  },
}
