/**
 * vendor.repository.http.ts — VendorRepository HTTP実装（フロントエンド用）
 *
 * 【依存方向】
 * フロント → VendorRepository(HTTP) → /api/vendors
 *
 * 準拠: DL-030, DL-042
 */

import { honoClient } from '../../utils/honoClient'
import type { Vendor } from '../../types/pipeline/vendor.type'
import type { VendorRepository } from '../types'

export const httpVendorRepo: VendorRepository = {
  getAll: async () => {
    const res = await honoClient.api.vendors.$get()
    const data = await res.json() as { vendors: Vendor[] }
    return data.vendors
  },

  getByType: async (type) => {
    const res = await honoClient.api.vendors.$get({ query: { type } })
    const data = await res.json() as { vendors: Vendor[] }
    return data.vendors
  },

  getById: async (vendorId) => {
    try {
      const res = await honoClient.api.vendors[':vendorId'].$get({ param: { vendorId } })
      return await res.json() as Vendor
    } catch {
      return undefined
    }
  },

  findByMatchKey: async (key) => {
    // GET /で全件→クライアント側でフィルタ（専用APIルートなし）
    const all = await httpVendorRepo.getAll()
    return all.find(v => v.match_key === key)
  },

  findByTNumber: async (tNumber) => {
    const all = await httpVendorRepo.getAll()
    return all.find(v => v.t_numbers?.includes(tNumber))
  },

  findByPhoneNumber: async (phone) => {
    const all = await httpVendorRepo.getAll()
    return all.find(v => v.phone_numbers?.includes(phone))
  },

  create: async (vendor) => {
    const res = await honoClient.api.vendors.$post({ json: vendor as { company_name: string; match_key: string; [k: string]: unknown } })
    return await res.json() as Vendor
  },

  update: async (vendorId, partial) => {
    const res = await honoClient.api.vendors[':vendorId'].$put({
      param: { vendorId },
      json: partial as Record<string, unknown>,
    })
    const data = await res.json() as Vendor | { ok: boolean }
    return !!data
  },

  deleteById: async (vendorId) => {
    await honoClient.api.vendors[':vendorId'].$delete({ param: { vendorId } })
  },

  list: async (query) => {
    const res = await honoClient.api.vendors.list.$post({ json: query as Record<string, unknown> })
    return await res.json() as {
      rows: Vendor[]
      totalCount: number
      page: number
      pageSize: number
      totalPages: number
      uniqueVectors: string[]
    }
  },
}
