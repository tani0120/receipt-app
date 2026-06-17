/**
 * clientTaxCategory.repository.http.ts — ClientTaxCategoryRepository HTTP実装
 *
 * 準拠: DL-030, P3-7a
 */

import { createApiClient } from '@/utils/apiClient'
import type { ClientTaxCategoryRepository } from '../types'

const api = createApiClient('/api/tax-categories/client')

export const httpClientTaxCategoryRepo: ClientTaxCategoryRepository = {
  getByClient: async (clientId, params) => {
    const qs = new URLSearchParams()
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
    if (params?.taxMethod) qs.set('taxMethod', params.taxMethod)
    const query = qs.toString()
    return api.get(`/${encodeURIComponent(clientId)}${query ? `?${query}` : ''}`)
  },

  saveByClient: async (clientId, data) => {
    const res = await fetch(`/api/tax-categories/client/${encodeURIComponent(clientId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`ClientTaxCategory save failed: ${res.status}`)
  },
}
