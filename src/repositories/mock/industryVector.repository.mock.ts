/**
 * industryVector.repository.mock.ts — IndustryVectorRepositoryモック実装（サーバー用）
 *
 * 準拠: DL-030, DL-042
 */

import {
  getCorporate,
  getSole,
} from '../../api/services/industryVectorStore'
import type { IndustryVectorRepository } from '../types'

export const mockIndustryVectorRepo: IndustryVectorRepository = {
  getAll: async (businessType) => {
    return businessType === 'corporate' ? [...getCorporate()] : [...getSole()]
  },

  findByVector: async (businessType, vector) => {
    const entries = businessType === 'corporate' ? getCorporate() : getSole()
    return entries.find(e => e.vector === vector)
  },
}
