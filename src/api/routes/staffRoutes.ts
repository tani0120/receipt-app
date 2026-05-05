/**
 * staffRoutes.ts — スタッフJSON永続化APIルート（Hono）
 *
 * レイヤー: ★route★ → staffStore
 * 責務: リクエスト受付・バリデーション・レスポンス返却
 *
 * エンドポイント:
 *   GET  /api/staff              — 全スタッフ取得（?status フィルタ任意）
 *   GET  /api/staff/:uuid        — 1件取得
 *   POST /api/staff              — スタッフ追加
 *   PUT  /api/staff/:uuid        — スタッフ更新
 *   GET  /api/staff/email/:email — メールでスタッフ検索
 *
 * 準拠: DL-042
 */

import { Hono } from 'hono';
import { apiError } from '../helpers/apiError';
import { 未検出, 必須 } from '../helpers/apiMessages';
import {
  getAll,
  getById,
  create,
  update,
  getByEmail,
  getActiveStaff,
} from '../services/staffStore';
import { getStaffList } from '../services/staffListService';

const app = new Hono();

// ============================================================
// POST /list — スタッフ一覧（フィルタ+ソート+ページネーション）
// ============================================================
app.post('/list', async (c) => {
  const body = await c.req.json();
  const result = getStaffList(body);
  return c.json(result);
});

// ============================================================
// GET / — 全スタッフ取得
// ============================================================
app.get('/', (c) => {
  const status = c.req.query('status');
  if (status === 'active') {
    const list = getActiveStaff();
    return c.json({ staff: list, count: list.length });
  }
  const list = getAll();
  return c.json({ staff: list, count: list.length });
});

// ============================================================
// GET /email/:email — メールでスタッフ検索
// ============================================================
app.get('/email/:email', (c) => {
  const email = decodeURIComponent(c.req.param('email'));
  const staff = getByEmail(email);
  if (!staff) {
    return apiError(c, 404, 未検出(`スタッフ(メール: ${email})`));
  }
  return c.json({ staff });
});

// ============================================================
// GET /:uuid — 1件取得
// ============================================================
app.get('/:uuid', (c) => {
  const uuid = c.req.param('uuid');
  const staff = getById(uuid);
  if (!staff) {
    return apiError(c, 404, 未検出(`スタッフ ${uuid}`));
  }
  return c.json({ staff });
});

// ============================================================
// POST / — スタッフ追加
// ============================================================
app.post('/', async (c) => {
  const body = await c.req.json();
  if (!body.name || !body.email) {
    return apiError(c, 400, 必須('name と email'));
  }
  const staff = create(body);
  return c.json({ ok: true, staff });
});

// ============================================================
// PUT /:uuid — スタッフ更新
// ============================================================
app.put('/:uuid', async (c) => {
  const uuid = c.req.param('uuid');
  const body = await c.req.json();
  const ok = update(uuid, body);
  if (!ok) {
    return apiError(c, 404, 未検出(`スタッフ ${uuid}`));
  }
  return c.json({ ok: true });
});

export default app;
