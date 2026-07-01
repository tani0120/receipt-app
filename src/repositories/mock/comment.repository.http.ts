/**
 * comment.repository.http.ts — CommentRepository HTTP実装（フロントエンド用）
 *
 * 準拠: DL-030, P3-5b
 */

import { createApiClient } from '../../utils/apiClient'
import type { CommentRepository } from '../types'

const api = createApiClient('/api/comments')

export const httpCommentRepo: CommentRepository = {
  getByEntity: async (entityType, entityId) => {
    return api.get(`?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`)
  },

  create: async (data) => {
    return api.post('', data)
  },

  deleteById: async (commentId) => {
    await api.del(`/${commentId}`)
  },

  update: async (commentId, data) => {
    await api.put(`/${commentId}`, data)
  },
}
