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
import { 未検出, 必須, リソース_スタッフ } from '../../constants/apiMessages';
import type { Staff } from '../../repositories/types';
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
    return apiError(c, 404, 未検出(`${リソース_スタッフ}(メール: ${email})`));
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
    return apiError(c, 404, 未検出(`${リソース_スタッフ} ${uuid}`));
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
// POST /bulk — スタッフ一括追加（インポート用）
// ============================================================
app.post('/bulk', async (c) => {
  const { items } = await c.req.json<{ items: Record<string, unknown>[] }>();
  if (!Array.isArray(items)) {
    return apiError(c, 400, 必須('items（配列）'));
  }
  const existing = getAll();
  const existingEmails = new Set(existing.map(s => s.email?.toLowerCase()).filter(Boolean));
  const results: { index: number; ok: boolean; error?: string }[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    try {
      if (!item.name || !item.email) {
        results.push({ index: i, ok: false, error: 'nameとemailが必須' });
        continue;
      }
      // メール重複チェック（既存 + 同一バッチ内）
      const email = String(item.email).toLowerCase();
      if (existingEmails.has(email)) {
        results.push({ index: i, ok: false, error: `メール「${item.email}」が重複` });
        continue;
      }
      create(item as Omit<Staff, 'uuid'> & { uuid?: string });
      existingEmails.add(email);
      results.push({ index: i, ok: true });
    } catch (err) {
      results.push({ index: i, ok: false, error: String(err) });
    }
  }
  return c.json({ ok: true, results, total: items.length });
});

// ============================================================
// PUT /:uuid — スタッフ更新
// ============================================================
app.put('/:uuid', async (c) => {
  const uuid = c.req.param('uuid');
  const body = await c.req.json();
  const ok = update(uuid, body);
  if (!ok) {
    return apiError(c, 404, 未検出(`${リソース_スタッフ} ${uuid}`));
  }
  return c.json({ ok: true });
});

export default app;
