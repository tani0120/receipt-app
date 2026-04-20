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
import {
  getAllShareStatus,
  getByClientId,
  getClientIdByInviteCode,
  updateStatus,
  saveInviteCode,
} from '../services/shareStatusStore';

const app = new Hono();

// ============================================================
// GET / — 全件取得
// ============================================================
app.get('/', (c) => {
  const records = getAllShareStatus();
  return c.json({ records, count: records.length });
});

// ============================================================
// GET /invite/:code — 招待コード→clientId逆引き
// ============================================================
app.get('/invite/:code', (c) => {
  const code = c.req.param('code');
  const clientId = getClientIdByInviteCode(code);
  if (!clientId) {
    return c.json({ error: `招待コード「${code}」に対応する顧問先が見つかりません` }, 404);
  }
  return c.json({ clientId });
});

// ============================================================
// GET /:clientId — clientIdで1件取得
// ============================================================
app.get('/:clientId', (c) => {
  const clientId = c.req.param('clientId');
  const record = getByClientId(clientId);
  if (!record) {
    return c.json({ error: `顧問先 ${clientId} の共有設定が見つかりません` }, 404);
  }
  return c.json({ record });
});

// ============================================================
// PUT /:clientId — ステータス更新
// ============================================================
app.put('/:clientId', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json<{ status: string }>();
  if (!body.status) {
    return c.json({ error: 'statusが必要です' }, 400);
  }
  updateStatus(clientId, body.status as import('../../repositories/types').ShareStatus);
  return c.json({ ok: true });
});

// ============================================================
// POST /invite — 招待コード保存
// ============================================================
app.post('/invite', async (c) => {
  const body = await c.req.json<{ clientId: string; code: string }>();
  if (!body.clientId || !body.code) {
    return c.json({ error: 'clientIdとcodeが必要です' }, 400);
  }
  saveInviteCode(body.clientId, body.code);
  return c.json({ ok: true });
});

export default app;
