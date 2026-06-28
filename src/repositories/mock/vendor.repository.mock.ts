/**
 * VendorRepository モック実装（DL-030）
 *
 * データソース: vendorStore（data/vendors.json をSSOTとして参照）
 * 将来: Supabase実装に中身だけ差し替え（src/repositories/supabase/）
 *
 * 【ロジック禁止】
 * このファイルにはデータ取得のみ記述する。
 * matchVendor() / firstAiSourceType() 等のビジネスロジックは
 * パイプラインロジック層（src/mocks/utils/pipeline/等）に配置すること。
 *
 * 【修正履歴】
 * 2026-05-30: VENDORS_GLOBAL直接参照 → vendorStore経由に修正
 *   旧: TSファイル(vendors_global.ts)を直接参照 → JSON編集が反映されないバグ
 *   新: vendorStore経由でdata/vendors.json(SSOT)を参照
 */

import type { VendorRepository } from '@/repositories/types'
import { getAll as getAllVendors, findByMatchKey, findByTNumber, create as createVendor, remove as removeVendor, update as updateVendor, getById as getVendorById } from '@/api/services/vendorStore'
import { getVendorList } from '@/api/services/vendorListService'

/**
 * 全社取引先マスタのモック実装
 *
 * vendorStore経由でdata/vendors.json（SSOT）を参照する。
 * Supabase移行時は supabaseVendorRepo に差し替えるだけ。
 */
export const mockVendorRepo: VendorRepository = {
  getAll: async () => getAllVendors(),

  getByType: async (type) => getAllVendors(
    type === 'vendor' ? { vendorOnly: true } : { nonVendorOnly: true }
  ),

  findByMatchKey: async (key) => findByMatchKey(key),

  findByTNumber: async (tNumber) => findByTNumber(tNumber),

  findByPhoneNumber: async (phone) =>
    getAllVendors().find((v) => v.phone_numbers?.includes(phone)),

  create: async (vendor) => createVendor(vendor),

  update: async (vendorId, partial) => updateVendor(vendorId, partial),

  getById: async (vendorId) => getVendorById(vendorId),

  deleteById: async (vendorId) => { removeVendor(vendorId) },

  list: async (query) => {
    const result = getVendorList(query)
    return {
      rows: result.rows,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      uniqueVectors: result.uniqueVectors,
    }
  },
}

