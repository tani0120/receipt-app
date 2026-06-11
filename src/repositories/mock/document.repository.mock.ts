/**
 * document.repository.mock.ts — DocumentRepositoryモック実装（サーバー用）
 *
 * 【依存方向】
 * DocumentRepository → documentsApi（正しい方向）
 *
 * 準拠: DL-030, DL-042
 */

import {
  getDocuments,
  updateDocumentStatus,
  addDocuments,
  removeByClientId,
  assignBatchAndJournalIds,
  clearAiFieldsByClientId,
} from '../../api/services/documentsApi'
import type { DocumentRepository } from '../types'

export const mockDocumentRepo: DocumentRepository = {
  getAll: async () => getDocuments(),

  getByClientId: async (clientId) => getDocuments(clientId),

  updateStatus: async (id, updates) => {
    const { status, ...extra } = updates
    if (status) {
      updateDocumentStatus(id, status, extra as { statusChangedBy?: string | null; statusChangedAt?: string | null })
    }
  },

  save: async (doc) => {
    addDocuments([doc])
  },

  saveBatch: async (docs) => {
    return addDocuments(docs)
  },

  removeByClientId: async (clientId) => {
    removeByClientId(clientId)
  },

  assignBatch: async (clientId) => {
    return assignBatchAndJournalIds(clientId)
  },

  clearAiFields: async (clientId) => {
    clearAiFieldsByClientId(clientId)
  },
}
