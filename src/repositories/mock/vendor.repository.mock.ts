/**
 * VendorRepository モック実装（DL-030）
 *
 * データソース: vendorStore（data/vendors.json をSSOTとして参照）
 * 将来: Supabase実装に中身だけ差し替え（src/repositories/supabase/）
 *
 * 【ロジック禁止】
 * このファイルにはデータ取得のみ記述する。
 * matchVendor() / previewExtractSourceType() 等のビジネスロジックは
 * パイプラインロジック層（src/mocks/utils/pipeline/等）に配置すること。
 *
 * 【修正履歴】
 * 2026-05-30: VENDORS_GLOBAL直接参照 → vendorStore経由に修正
 *   旧: TSファイル(vendors_global.ts)を直接参照 → JSON編集が反映されないバグ
 *   新: vendorStore経由でdata/vendors.json(SSOT)を参照
 */

import type { VendorRepository } from '@/repositories/types'
import { getAll as getAllVendors, findByMatchKey, findByTNumber } from '@/api/services/vendorStore'

/**
 * 全社取引先マスタのモック実装
 *
 * vendorStore経由でdata/vendors.json（SSOT）を参照する。
 * Supabase移行時は supabaseVendorRepo に差し替えるだけ。
 */
export const mockVendorRepo: VendorRepository = {
  /**
   * 全社共通取引先マスタ全件取得
   * vendorStore.getAll() → data/vendors.json
   */
  getAll: async () => getAllVendors(),

  /**
   * match_key（照合キー）で完全一致検索（Step 3-3）
   * vendorStore.findByMatchKey() → data/vendors.json
   * Supabase: .eq('match_key', key).maybeSingle()
   */
  findByMatchKey: async (key) => findByMatchKey(key),

  /**
   * T番号（インボイス番号）で検索（Step 3-1）
   * vendorStore.findByTNumber() → data/vendors.json
   * Supabase: .contains('t_numbers', [tNumber]).maybeSingle()
   */
  findByTNumber: async (tNumber) => findByTNumber(tNumber),

  /**
   * 電話番号で検索（Step 3-2）
   * vendorStore.getAll()から線形探索 → data/vendors.json
   * Supabase: .contains('phone_numbers', [phone]).maybeSingle()
   */
  findByPhoneNumber: async (phone) =>
    getAllVendors().find((v) => v.phone_numbers?.includes(phone)),
}

