/**
 * taxMaster.repository.mock.ts — TaxMasterRepositoryモック実装（サーバー用）
 *
 * 【依存方向】
 * TaxMasterRepository → accountMasterApi（正しい方向）
 *
 * AccountMasterRepositoryと同パターン。
 * 準拠: DL-030, DL-042
 */

import {
  getFilteredTaxCategories,
  saveAllTaxCategories,
  getClientTaxCategories,
  saveClientTaxCategories,
  getFilteredClientTaxCategories,
  getTaxCategoryNameMap,
} from '../../api/services/taxCategoryMasterApi'
import { getClientTaxCategoriesForValidation } from '../../api/services/accountMasterApi'
import type { TaxMasterRepository } from '../types'

export const mockTaxMasterRepo: TaxMasterRepository = {
  getMaster: async () => {
    const result = getFilteredTaxCategories({ taxMethod: 'all', page: 1, pageSize: 200 })
    return result.pagedItems
  },
  saveMaster: async (taxCategories) => {
    return saveAllTaxCategories(taxCategories)
  },
  getClient: async (clientId) => {
    const taxCategories = getClientTaxCategories(clientId)
    return { taxCategories }
  },
  saveClient: async (clientId, taxCategories) => {
    return saveClientTaxCategories(clientId, taxCategories)
  },
  getFilteredMaster: async (params) => {
    return getFilteredTaxCategories(params)
  },
  getFilteredClient: async (clientId, params) => {
    return getFilteredClientTaxCategories(clientId, params)
  },
  getNameMap: async () => {
    return getTaxCategoryNameMap()
  },
  getClientTaxCategoriesForValidation: async (clientId) => getClientTaxCategoriesForValidation(clientId),
}
