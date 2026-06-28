/**
 * comment.repository.mock.ts — CommentRepositoryモック実装（サーバー用）
 *
 * 【依存方向】
 * CommentRepository → commentStore（正しい方向）
 *
 * 準拠: DL-030, DL-042
 */

import {
  getComments,
  addComment,
  deleteComment,
  deleteAllComments,
} from '../../api/services/commentStore'
import type { CommentRepository, Comment } from '../types'

export const mockCommentRepo: CommentRepository = {
  getByEntity: async (entityType, entityId) => getComments(entityType, entityId) as Comment[],
  create: async (comment) => addComment(comment as Parameters<typeof addComment>[0]) as unknown as Comment,
  deleteById: async (commentId) => deleteComment(commentId),
  deleteAllByEntity: async (entityType, entityId) => deleteAllComments(entityType, entityId),
}
