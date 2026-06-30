/**
 * MfTaxAvailableRepository モック実装（Phase 3.7）
 *
 * 既存の mfTaxAvailableStore をラップし、Promise<T> インターフェースに変換。
 * Supabase移行時にDB版に差し替え。
 *
 * 注意: taxCategoryMasterApi.ts は循環参照回避のため③一時許容。
 *       Store直接importを維持する（Phase Bで自然消滅）。
 */

import type { MfTaxAvailableRepository } from '../types'
import {
  getAllTaxAvailable,
  getTaxAvailableForMethod,
  saveTaxAvailable,
  invalidateCache,
} from '../../api/services/mfTaxAvailableStore'
import type { TaxMethodKey } from '../types'

export const mockMfTaxAvailableRepo: MfTaxAvailableRepository = {
  async getAllTaxAvailable() {
    return getAllTaxAvailable()
  },

  async getTaxAvailableForMethod(method: TaxMethodKey) {
    return getTaxAvailableForMethod(method)
  },

  async saveTaxAvailable(method: TaxMethodKey, available: Record<string, boolean>) {
    saveTaxAvailable(method, available)
  },

  async invalidateCache() {
    invalidateCache()
  },
}
