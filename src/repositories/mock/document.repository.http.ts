/**
 * document.repository.http.ts — DocumentRepository HTTP実装（フロントエンド用）
 *
 * 【依存方向】
 * フロント → DocumentRepository(HTTP) → /api/doc-store
 *
 * 準拠: DL-030, DL-042
 */

import { createApiClient } from '@/utils/apiClient'
import type { DocEntry } from '@/repositories/types'
import type { DocumentRepository } from '../types'

const api = createApiClient('/api/doc-store')

export const httpDocumentRepo: DocumentRepository = {
  getAll: async () => {
    const res = await api.get<{ documents: DocEntry[] }>('')
    return res.documents
  },

  getByClientId: async (clientId) => {
    const res = await api.get<{ documents: DocEntry[] }>(`?clientId=${clientId}`)
    return res.documents
  },

  updateStatus: async (id, updates) => {
    await api.put(`/${id}`, updates)
  },

  save: async (doc) => {
    await api.post<{ added: number }>('', { documents: [doc] })
  },

  saveBatch: async (docs) => {
    return api.post<{ added: number; skipped: number }>('', { documents: docs })
  },

  removeByClientId: async (clientId) => {
    await api.del(`/client/${clientId}`)
  },

  assignBatch: async (clientId) => {
    return api.post<{ batchId: string; count: number }>('/batch', { clientId })
  },

  clearAiFields: async (clientId) => {
    await api.post(`/clear-ai/${clientId}`, {})
  },
}
