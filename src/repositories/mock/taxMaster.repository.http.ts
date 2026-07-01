/**
 * taxMaster.repository.http.ts — TaxMasterRepository HTTP実装（フロントエンド用）
 *
 * 【依存方向】
 * taxMasterStore(Pinia) → TaxMasterRepository(HTTP) → /api/tax-categories
 *
 * AccountMasterRepositoryと同パターン。
 * 準拠: DL-030, DL-042
 */

import { honoClient } from '../../utils/honoClient'
import type { TaxCategory } from '../../types/shared-tax-category'
import type { TaxMasterRepository } from '../types'

export const httpTaxMasterRepo: TaxMasterRepository = {
  getMaster: async () => {
    const res = await honoClient.api['tax-categories'].master.$get({
      query: { pageSize: '200', taxMethod: 'all' },
    })
    const data = await res.json() as { items: TaxCategory[] }
    return data.items
  },

  saveMaster: async (taxCategories) => {
    const res = await honoClient.api['tax-categories'].master.$put({
      json: { taxCategories },
    })
    return await res.json() as { ok: true; count: number }
  },

  getClient: async (clientId) => {
    const res = await honoClient.api['tax-categories'].client[':clientId'].$get({
      param: { clientId },
      query: { pageSize: '200', taxMethod: 'all' },
    })
    const data = await res.json() as { items: TaxCategory[] }
    return { taxCategories: data.items }
  },

  saveClient: async (clientId, taxCategories) => {
    const res = await honoClient.api['tax-categories'].client[':clientId'].$put({
      param: { clientId },
      json: { taxCategories },
    })
    return await res.json() as { ok: true; count: number }
  },

  getFilteredMaster: async (params) => {
    const res = await honoClient.api['tax-categories'].master.$get({
      query: {
        taxMethod: params.taxMethod,
        page: String(params.page),
        pageSize: String(params.pageSize),
      },
    })
    return await res.json() as {
      pagedItems: TaxCategory[]
      totalCount: number
      page: number
      totalPages: number
    }
  },

  getFilteredClient: async (clientId, params) => {
    const res = await honoClient.api['tax-categories'].client[':clientId'].$get({
      param: { clientId },
      query: {
        taxMethod: params.taxMethod,
        page: String(params.page),
        pageSize: String(params.pageSize),
      },
    })
    return await res.json() as {
      pagedItems: TaxCategory[]
      totalCount: number
      page: number
      totalPages: number
    }
  },

  // --- 以下はサーバー専用メソッド ---
  // 呼び出し元: getNameMap → journalValidation.ts（サーバー側のみ）
  // 呼び出し元: getClientTaxCategoriesForValidation → journalValidation.ts（サーバー側のみ）
  // TODO(Supabase): Phase B でSupabase版に統合時に実装

  getNameMap: async () => {
    throw new Error('TaxMasterRepository.getNameMap: HTTP版では未実装（サーバー側はmock版を使用）')
  },

  getClientTaxCategoriesForValidation: async () => {
    throw new Error('TaxMasterRepository.getClientTaxCategoriesForValidation: HTTP版では未実装（サーバー側はmock版を使用）')
  },
}
