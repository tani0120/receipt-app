/**
 * leadExtra.repository.http.ts — LeadExtraRepository HTTP実装
 *
 * 準拠: DL-030, P3-7b
 */

import { honoClient } from '../../utils/honoClient'
import type { LeadExtraRepository } from '../types'

export const httpLeadExtraRepo: LeadExtraRepository = {
  bulkCreate: async (data) => {
    const res = await honoClient.api.leads.bulk.$post({ json: data as { items: Record<string, unknown>[] } })
    return await res.json()
  },

  convert: async (leadId) => {
    const res = await honoClient.api.leads[':leadId'].convert.$post({ param: { leadId } })
    return await res.json()
  },
}
