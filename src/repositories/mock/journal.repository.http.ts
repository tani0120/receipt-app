/**
 * journal.repository.http.ts — JournalRepository HTTP実装（フロントエンド用）
 *
 * 準拠: DL-030, P3-8
 */

import { createApiClient } from '@/utils/apiClient'
import type { JournalRepository } from '../types'

const api = createApiClient('/api/journals')

export const httpJournalRepo: JournalRepository = {
  createJournals: async (clientId, data) => {
    return api.post(`/${encodeURIComponent(clientId)}`, data)
  },
}
