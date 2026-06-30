/**
 * VendorRepository モック実装（DL-030）
 *
 * データソース: vendorStore（data/vendors.json をSSOTとして参照）
 * 将来: Supabase実装に中身だけ差し替え（src/repositories/supabase/）
 *
 * 【list()のフィルタ・ソート・ページネーション】
 * Supabase移行時: SELECT ... WHERE ... ORDER BY ... LIMIT に差し替え
 *
 * 【修正履歴】
 * 2026-05-30: VENDORS_GLOBAL直接参照 → vendorStore経由に修正
 * 2026-06-30: vendorListService.tsからロジック統合（循環参照解消）
 */

import type { VendorRepository } from '@/repositories/types'
import type { Vendor } from '@/types/pipeline/vendor.type'
import { getAll as getAllVendors, findByMatchKey, findByTNumber, create as createVendor, remove as removeVendor, update as updateVendor, getById as getVendorById } from '@/api/services/vendorStore'

// ────────────────────────────────────────────
// 検索用正規化（vendorListServiceから移植）
// ────────────────────────────────────────────

function normalizeForSearch(name: string): string {
  return name
    .toLowerCase()
    .replace(/[ａ-ｚＡ-Ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/[\s　()（）「」『』【】・,、.。]/g, '')
    .replace(/(株式会社|有限会社|合同会社|合名会社|合資会社|一般社団法人|一般財団法人|公益社団法人|公益財団法人|特定非営利活動法人|医療法人|学校法人|宗教法人)/g, '')
}

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

  /**
   * フィルタ+ソート+ページネーション付き一覧取得
   * Supabase移行時: SELECT ... WHERE ... ORDER BY ... LIMIT に差し替え
   */
  list: async (query) => {
    // 1. 全件取得（タイプフィルタ）
    const allVendors = getAllVendors()
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
  },
}
