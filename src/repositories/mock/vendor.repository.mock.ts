/**
 * VendorRepository モック実装（DL-030）
 *
 * データソース: vendors_global.ts（全社共通取引先マスタ 224件）
 * 将来: Supabase実装に中身だけ差し替え（src/repositories/supabase/）
 *
 * 【ロジック禁止】
 * このファイルにはデータ取得のみ記述する。
 * matchVendor() / classifySourceType() 等のビジネスロジックは
 * パイプラインロジック層（src/mocks/utils/pipeline/等）に配置すること。
 */

import type { VendorRepository } from '@/repositories/types'
import { VENDORS_GLOBAL } from '@/mocks/data/pipeline/vendors_global'

/**
 * 全社取引先マスタのモック実装
 *
 * TSファイル（VENDORS_GLOBAL配列）から直接検索する。
 * Supabase移行時は supabaseVendorRepo に差し替えるだけ。
 */
export const mockVendorRepo: VendorRepository = {
  /**
   * 全社共通取引先マスタ全件取得
   * モック: VENDORS_GLOBAL配列をそのまま返す
   */
  getAll: async () => VENDORS_GLOBAL,

  /**
   * match_key（照合キー）で完全一致検索（Step 3-3）
   * モック: 配列をfindで線形探索
   * Supabase: .eq('match_key', key).maybeSingle()
   */
  findByMatchKey: async (key) =>
    VENDORS_GLOBAL.find((v) => v.match_key === key),

  /**
   * T番号（インボイス番号）で検索（Step 3-1）
   * モック: t_numbers配列にincludesで検索
   * Supabase: .contains('t_numbers', [tNumber]).maybeSingle()
   */
  findByTNumber: async (tNumber) =>
    VENDORS_GLOBAL.find((v) => v.t_numbers.includes(tNumber)),

  /**
   * 電話番号で検索（Step 3-2）
   * モック: phone_numbers配列にincludesで検索
   * Supabase: .contains('phone_numbers', [phone]).maybeSingle()
   */
  findByPhoneNumber: async (phone) =>
    VENDORS_GLOBAL.find((v) => v.phone_numbers?.includes(phone)),
}
