/**
 * industryVector.repository.http.ts — IndustryVectorRepository HTTP実装（フロントエンド用）
 *
 * 準拠: DL-030, DL-042
 */

import { createApiClient } from '../../utils/apiClient'
import type { IndustryVectorRepository } from '../types'
import type { IndustryVectorEntry } from '../../types/pipeline/vendor.type'

const api = createApiClient('/api/industry-vectors')

export const httpIndustryVectorRepo: IndustryVectorRepository = {
  getAll: async (businessType) => {
    const data = await api.get<{ entries: IndustryVectorEntry[] }>(`?type=${businessType}`)
    return data.entries
  },

  findByVector: async (businessType, vector) => {
    const data = await api.get<{ entries: IndustryVectorEntry[] }>(`?type=${businessType}`)
    return data.entries.find(e => e.vector === vector)
  },
}
