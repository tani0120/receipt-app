/**
 * commentRoutes.ts — コメントAPI ルート（Hono）
 *
 * エンドポイント:
 *   GET    /api/comments?entityType=client&entityId=xxx — コメント取得
 *   POST   /api/comments                               — コメント追加
 *   DELETE /api/comments/:commentId                     — コメント削除
 *
 * localStorage脱却（DL-042準拠）
 */

import { Hono } from 'hono';
import { apiError } from '../helpers/apiError';
import { 必須 } from '../../constants/apiMessages';
import { createMockRepositories } from '../../repositories/mock';
import type { Comment } from '../../repositories/types';

const commentRepo = createMockRepositories().comment;

const app = new Hono();

// GET / — コメント取得（entityType + entityId 必須）
app.get('/', async (c) => {
  const entityType = c.req.query('entityType');
  const entityId = c.req.query('entityId');
  if (!entityType || !entityId) {
    return apiError(c, 400, 必須('entityType と entityId'));
  }
  const comments = await commentRepo.getByEntity(entityType, entityId);
  return c.json({ comments, count: comments.length });
});

// POST / — コメント追加
app.post('/', async (c) => {
  const body = await c.req.json();
  if (!body.entityType || !body.entityId || !body.body) {
    return apiError(c, 400, 必須('entityType, entityId, body'));
  }
  const comment = await commentRepo.create({
    id: body.id || `cmt-${crypto.randomUUID().slice(0, 8)}`,
    entityType: body.entityType,
    entityId: body.entityId,
    author: body.author || '不明',
    body: body.body,
    date: body.date || new Date().toLocaleString('ja-JP'),
  } as Comment);
  return c.json({ ok: true, comment });
});

// DELETE /:commentId — コメント削除
app.delete('/:commentId', async (c) => {
  const commentId = c.req.param('commentId');
  const ok = await commentRepo.deleteById(commentId);
  if (!ok) {
    return apiError(c, 404, `コメント ${commentId} が見つかりません`);
  }
  return c.json({ ok: true });
});

export default app;
