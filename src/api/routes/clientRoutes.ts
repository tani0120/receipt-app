/**
 * clientRoutes.ts — 顧問先JSON永続化APIルート（Hono）
 *
 * レイヤー: ★route★ → clientStore
 * 責務: リクエスト受付・バリデーション・レスポンス返却
 *
 * エンドポイント:
 *   GET  /api/clients                       — 全顧問先取得（?status, ?staffId フィルタ任意）
 *   GET  /api/clients/:clientId             — 1件取得
 *   POST /api/clients                       — 顧問先追加
 *   PUT  /api/clients/:clientId             — 顧問先更新
 *   PUT  /api/clients/:clientId/staff       — 担当者変更
 *   PUT  /api/clients/:clientId/shared-folder — Drive共有フォルダ設定
 *   PUT  /api/clients/:clientId/shared-email  — 顧問先メール設定
 *
 * 準拠: DL-042
 */

import { Hono } from 'hono';
import { apiError } from '../helpers/apiError';
import { 未検出, 必須 } from '../helpers/apiMessages';
import type { ClientStatus } from '../../repositories/types';
import {
  getAll,
  getById,
  create,
  updateClient,
  getByStaffId,
  getActiveClients,
  getByStatus,
  updateStaffAssignment,
  updateSharedFolderId,
  updateSharedEmail,
  createClientId,
} from '../services/clientStore';
import { getClientList } from '../services/clientListService';

const app = new Hono();

// ============================================================
// POST /list — 顧問先一覧（フィルタ+ソート+ページネーション）
// ============================================================
app.post('/list', async (c) => {
  const body = await c.req.json();
  const result = getClientList(body);
  return c.json(result);
});

// ============================================================
// GET / — 全顧問先取得
// ============================================================
app.get('/', (c) => {
  const status = c.req.query('status');
  const staffId = c.req.query('staffId');

  if (status === 'active') {
    const list = getActiveClients();
    return c.json({ clients: list, count: list.length });
  }
  if (status) {
    const list = getByStatus(status as ClientStatus);
    return c.json({ clients: list, count: list.length });
  }
  if (staffId) {
    const list = getByStaffId(staffId);
    return c.json({ clients: list, count: list.length });
  }
  const list = getAll();
  return c.json({ clients: list, count: list.length });
});

// ============================================================
// GET /:clientId — 1件取得
// ============================================================
app.get('/:clientId', (c) => {
  const clientId = c.req.param('clientId');
  const client = getById(clientId);
  if (!client) {
    return apiError(c, 404, 未検出(`顧問先 ${clientId}`));
  }
  return c.json({ client });
});

// ============================================================
// POST / — 顧問先追加
// ============================================================
app.post('/', async (c) => {
  const body = await c.req.json();
  if (!body.threeCode || !body.companyName) {
    return apiError(c, 400, 必須('threeCode と companyName'));
  }
  // clientIdを自動発番（bodyにclientIdがなければ）
  if (!body.clientId) {
    body.clientId = createClientId(body.threeCode);
  }
  const client = create(body);
  return c.json({ ok: true, client });
});

// ============================================================
// PUT /:clientId — 顧問先更新
// ============================================================
app.put('/:clientId', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json();
  const ok = updateClient(clientId, body);
  if (!ok) {
    return apiError(c, 404, 未検出(`顧問先 ${clientId}`));
  }
  return c.json({ ok: true });
});

// ============================================================
// PUT /:clientId/staff — 担当者変更
// ============================================================
app.put('/:clientId/staff', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json<{ staffId: string | null }>();
  const ok = updateStaffAssignment(clientId, body.staffId);
  if (!ok) {
    return apiError(c, 404, 未検出(`顧問先 ${clientId}`));
  }
  return c.json({ ok: true });
});

// ============================================================
// PUT /:clientId/shared-folder — Drive共有フォルダ設定
// ============================================================
app.put('/:clientId/shared-folder', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json<{ folderId: string }>();
  const ok = updateSharedFolderId(clientId, body.folderId);
  if (!ok) {
    return apiError(c, 404, 未検出(`顧問先 ${clientId}`));
  }
  return c.json({ ok: true });
});

// ============================================================
// PUT /:clientId/shared-email — 顧問先メール設定
// ============================================================
app.put('/:clientId/shared-email', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json<{ email: string }>();
  const ok = updateSharedEmail(clientId, body.email);
  if (!ok) {
    return apiError(c, 404, 未検出(`顧問先 ${clientId}`));
  }
  return c.json({ ok: true });
});

export default app;
