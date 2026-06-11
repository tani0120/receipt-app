/**
 * confirmedJournal.repository.http.ts — ConfirmedJournalRepository HTTP実装（フロントエンド用）
 *
 * 準拠: DL-030, DL-042
 */

import { createApiClient } from '@/utils/apiClient'
import type { ConfirmedJournalRepository } from '../types'
import type { ConfirmedJournal } from '@/types/confirmed_journal.type'

const api = createApiClient('/api/confirmed-journals')

export const httpConfirmedJournalRepo: ConfirmedJournalRepository = {
  getByClientId: async (clientId) => {
    const res = await api.get<{ journals: ConfirmedJournal[] }>(`?clientId=${clientId}`)
    return res.journals
  },

  findByMatchKey: async (clientId, matchKey) => {
    const res = await api.get<{ journals: ConfirmedJournal[] }>(
      `?clientId=${clientId}&matchKey=${encodeURIComponent(matchKey)}`
    )
    return res.journals
  },

  listBatches: async (clientId) => {
    return api.get(`/${clientId}/batches`)
  },

  importCsv: async (clientId, csvText) => {
    return api.post(`/${clientId}/import`, { csv_text: csvText })
  },

  deleteBatch: async (batchId) => {
    return api.post(`/batch/${batchId}/delete`, {})
  },

  getJournalsByBatch: async (batchId) => {
    return api.get(`/batch/${batchId}/journals`)
  },
}
