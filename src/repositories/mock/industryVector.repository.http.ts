/**
 * industryVector.repository.http.ts — IndustryVectorRepository HTTP実装（フロントエンド用）
 *
 * 準拠: DL-030, DL-042
 */

import { honoClient } from '../../utils/honoClient'
import type { IndustryVectorRepository } from '../types'
import type { IndustryVectorEntry } from '../../types/pipeline/vendor.type'

export const httpIndustryVectorRepo: IndustryVectorRepository = {
  getAll: async (businessType) => {
    const res = await honoClient.api['industry-vectors'].$get({ query: { type: businessType } })
    const data = await res.json() as { entries: IndustryVectorEntry[] }
    return data.entries
  },

  findByVector: async (businessType, vector) => {
    const res = await honoClient.api['industry-vectors'].$get({ query: { type: businessType } })
    const data = await res.json() as { entries: IndustryVectorEntry[] }
    return data.entries.find(e => e.vector === vector)
  },

  // saveAll: サーバー専用（管理画面のルートから呼ばれる）
  // TODO(Supabase): Phase B でSupabase版に統合時に実装
  saveAll: async () => {
    throw new Error('IndustryVectorRepository.saveAll: HTTP版では未実装（サーバー側はmock版を使用）')
  },
}

