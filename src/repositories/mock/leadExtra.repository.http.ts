/**
 * leadExtra.repository.http.ts — LeadExtraRepository HTTP実装
 *
 * 準拠: DL-030, P3-7b
 */

import { createApiClient } from '../../utils/apiClient'
import type { LeadExtraRepository } from '../types'

const api = createApiClient('/api/leads')

export const httpLeadExtraRepo: LeadExtraRepository = {
  bulkCreate: async (data) => {
    return api.post('/bulk', data)
  },

  convert: async (leadId) => {
    return api.post(`/${encodeURIComponent(leadId)}/convert`, {})
  },
}
