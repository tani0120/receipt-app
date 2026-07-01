/**
 * taxMaster.repository.http.ts — TaxMasterRepository HTTP実装（フロントエンド用）
 *
 * 【依存方向】
 * taxMasterStore(Pinia) → TaxMasterRepository(HTTP) → /api/tax-categories
 *
 * AccountMasterRepositoryと同パターン。
 * 準拠: DL-030, DL-042
 */

import { createApiClient } from '../../utils/apiClient'
import type { TaxCategory } from '../../types/shared-tax-category'
import type { TaxMasterRepository } from '../types'

const api = createApiClient('/api/tax-categories')

export const httpTaxMasterRepo: TaxMasterRepository = {
  getMaster: async () => {
    const data = await api.get<{ items: TaxCategory[] }>('/master?pageSize=200&taxMethod=all')
    return data.items
  },
  saveMaster: async (taxCategories) => {
    await api.put('/master', { taxCategories })
  },
  getClient: async (clientId) => {
    const data = await api.get<{ items: TaxCategory[] }>(`/client/${clientId}?pageSize=200&taxMethod=all`)
    return { taxCategories: data.items }
  },
  saveClient: async (clientId, taxCategories) => {
    await api.put(`/client/${clientId}`, { taxCategories })
  },
}
