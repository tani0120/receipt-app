/**
 * shareStatusRoutes.ts — 共有設定JSON永続化APIルート（Hono）
 *
 * レイヤー: ★route★ → shareStatusStore
 * 責務: リクエスト受付・バリデーション・レスポンス返却
 *
 * エンドポイント:
 *   GET  /api/share-status             — 全件取得
 *   GET  /api/share-status/invite/:code — 招待コード→clientId逆引き
 *   PUT  /api/share-status/:clientId    — ステータス更新
 *   POST /api/share-status/invite       — 招待コード保存
 *
 * 【移行時】
 *   Supabase接続時にshareStatusStoreの中身をDB操作に差し替え。
 *   フロント側のAPI呼び出しは変更不要。
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import crypto from 'crypto';
import { apiError } from '../helpers/apiError';
import { 未検出, 必須 } from '../../constants/apiMessages';
import { createMockRepositories } from '../../repositories/mock';
import type { ShareStatus } from '../../repositories/types';

const shareStatusRepo = createMockRepositories().shareStatus;

const route = new Hono()
// GET / — 全件取得
.get('/', async (c) => {
  const records = await shareStatusRepo.getAll();
  return c.json({ records, count: records.length });
})
// GET /invite/:code — 招待コード→clientId逆引き
.get('/invite/:code', async (c) => {
  const code = c.req.param('code');
  const clientId = await shareStatusRepo.resolveInviteCode(code);
  if (!clientId) {
    return apiError(c, 404, 未検出(`招待コード「${code}」の顧問先`));
  }
  return c.json({ clientId });
})
// GET /:clientId — clientIdで1件取得
.get('/:clientId', async (c) => {
  const clientId = c.req.param('clientId');
  const record = await shareStatusRepo.getByClientId(clientId);
  if (!record) {
    return apiError(c, 404, 未検出(`顧問先 ${clientId} の共有設定`));
  }
  return c.json({ record });
})
// PUT /:clientId — ステータス更新
.put('/:clientId',
  zValidator('json', z.object({ status: z.enum(['pending', 'active', 'revoked']) })),
  async (c) => {
  const clientId = c.req.param('clientId');
  const body = c.req.valid('json');
  await shareStatusRepo.updateStatus(clientId, body.status as ShareStatus);
  return c.json({ ok: true });
})
// POST /invite — 招待コード発番（サーバーが常にコードを生成）
.post('/invite',
  zValidator('json', z.object({ clientId: z.string() })),
  async (c) => {
  const body = c.req.valid('json');
  // サーバーがランダム招待コードを生成
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i]! % chars.length];
  }
  await shareStatusRepo.saveInviteCode(body.clientId, code);
  return c.json({ ok: true, code });
});

export default route;
