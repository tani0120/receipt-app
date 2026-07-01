/**
 * comment.repository.http.ts — CommentRepository HTTP実装（フロントエンド用）
 *
 * 準拠: DL-030, P3-5b
 */

import { honoClient } from '../../utils/honoClient'
import type { CommentRepository, Comment } from '../types'

export const httpCommentRepo: CommentRepository = {
  getByEntity: async (entityType, entityId) => {
    const res = await honoClient.api.comments.$get({ query: { entityType, entityId } })
    const data = await res.json() as { comments: Comment[] }
    return data.comments
  },

  create: async (data) => {
    const res = await honoClient.api.comments.$post({ json: data })
    const result = await res.json() as { ok: boolean; comment: Comment }
    return result.comment
  },

  deleteById: async (commentId) => {
    const res = await honoClient.api.comments[':commentId'].$delete({ param: { commentId } })
    const data = await res.json() as { ok: boolean }
    return data.ok
  },

  // deleteAllByEntity: ルートに未実装。呼び出し元0件（フロントからは使わない）
  // TODO(Supabase): Phase B でSupabase版に統合時に実装
  deleteAllByEntity: async () => {
    throw new Error('CommentRepository.deleteAllByEntity: HTTP版では未実装（サーバー側はmock版を使用）')
  },
}

