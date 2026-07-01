/**
 * document.repository.http.ts — DocumentRepository HTTP実装（フロントエンド用）
 *
 * 【依存方向】
 * フロント → DocumentRepository(HTTP) → /api/doc-store
 *
 * 準拠: DL-030, DL-042
 */

import { honoClient } from '../../utils/honoClient'
import type { DocEntry } from '../types'
import type { DocumentRepository } from '../types'

export const httpDocumentRepo: DocumentRepository = {
  getAll: async () => {
    const res = await honoClient.api['doc-store'].$get()
    const data = await res.json() as { documents: DocEntry[] }
    return data.documents
  },

  getByClientId: async (clientId) => {
    const res = await honoClient.api['doc-store'].$get({ query: { clientId } })
    const data = await res.json() as { documents: DocEntry[] }
    return data.documents
  },

  updateStatus: async (id, updates) => {
    await honoClient.api['doc-store'][':id'].$put({
      param: { id },
      json: updates as { status: string },
    })
  },

  save: async (doc) => {
    await honoClient.api['doc-store'].$post({ json: { documents: [doc] } })
  },

  saveBatch: async (docs) => {
    const res = await honoClient.api['doc-store'].$post({ json: { documents: docs } })
    return await res.json() as { added: number; skipped: number }
  },

  removeByClientId: async (clientId) => {
    await honoClient.api['doc-store'].client[':clientId'].$delete({ param: { clientId } })
  },

  assignBatch: async (clientId) => {
    const res = await honoClient.api['doc-store'].batch.$post({ json: { clientId } })
    return await res.json() as { batchId: string; count: number }
  },

  clearAiFields: async (clientId) => {
    await honoClient.api['doc-store']['clear-ai'][':clientId'].$post({ param: { clientId } })
  },

  getById: async (id) => {
    try {
      const res = await honoClient.api['doc-store'][':id'].$get({ param: { id } })
      const data = await res.json() as { document: DocEntry }
      return data.document
    } catch {
      return undefined
    }
  },

  deleteById: async (id) => {
    const res = await honoClient.api['doc-store'][':id'].$delete({ param: { id } })
    const data = await res.json() as { ok: boolean }
    return data.ok
  },

  countDocuments: async (clientId) => {
    const query = clientId ? { clientId } : undefined
    const res = await honoClient.api['doc-store'].count.$get({ query: query as Record<string, string> })
    const data = await res.json() as { count: number }
    return data.count
  },

  // updateAiResults: サーバー専用（pipeline/firstAi.service.tsから呼ばれる）
  // TODO(Supabase): Phase B でSupabase版に統合時に実装
  updateAiResults: async () => {
    throw new Error('DocumentRepository.updateAiResults: HTTP版では未実装（サーバー側はmock版を使用）')
  },
}

