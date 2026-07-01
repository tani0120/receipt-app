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
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { apiError } from '../helpers/apiError';
import { 未検出, 必須, リソース_スタッフ } from '../../constants/apiMessages';
import type { Staff } from '../../repositories/types';
import { createMockRepositories } from '../../repositories/mock';

const staffRepo = createMockRepositories().staff;

/** Staff専用zodスキーマ（staff.types.ts Staff型に準拠） */
const staffSchema = z.object({
  uuid: z.string().optional(),
  name: z.string(),
  nameRomaji: z.string().optional(),
  email: z.string(),
  password: z.string().optional(),
  role: z.enum(['admin', 'general']),
  status: z.enum(['active', 'inactive', 'suspension']),
}).passthrough()

/** Staff部分更新用スキーマ */
const staffPartialSchema = staffSchema.partial()

/** POST /list のリクエストbody */
const listQuerySchema = z.object({
  filters: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.union([z.string(), z.array(z.string())]),
  })).optional(),
  logic: z.enum(['and', 'or']).optional(),
  sorts: z.array(z.object({
    key: z.string(),
    order: z.enum(['asc', 'desc']),
  })).optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
}).passthrough()

const route = new Hono()
// POST /list — スタッフ一覧（フィルタ+ソート+ページネーション）
.post('/list',
  zValidator('json', listQuerySchema),
  async (c) => {
  const body = c.req.valid('json');
  const result = await staffRepo.list(body);
  return c.json(result);
})
// GET / — 全スタッフ取得
.get('/', async (c) => {
  const status = c.req.query('status');
  if (status === 'active') {
    const list = await staffRepo.getActiveStaff();
    return c.json({ staff: list, count: list.length });
  }
  const list = await staffRepo.getAll();
  return c.json({ staff: list, count: list.length });
})
// GET /email/:email — メールでスタッフ検索
.get('/email/:email', async (c) => {
  const email = decodeURIComponent(c.req.param('email'));
  const staff = await staffRepo.getByEmail(email);
  if (!staff) {
    return apiError(c, 404, 未検出(`${リソース_スタッフ}(メール: ${email})`));
  }
  return c.json({ staff });
})
// GET /:uuid — 1件取得
.get('/:uuid', async (c) => {
  const uuid = c.req.param('uuid');
  const staff = await staffRepo.getById(uuid);
  if (!staff) {
    return apiError(c, 404, 未検出(`${リソース_スタッフ} ${uuid}`));
  }
  return c.json({ staff });
})
// POST / — スタッフ追加
.post('/',
  zValidator('json', staffSchema),
  async (c) => {
  const body = c.req.valid('json');
  if (!body.name || !body.email) {
    return apiError(c, 400, 必須('name と email'));
  }
  const staff = await staffRepo.create(body as Omit<Staff, 'uuid'> & { uuid?: string });
  return c.json({ ok: true, staff });
})
// POST /bulk — スタッフ一括追加（インポート用）
.post('/bulk',
  zValidator('json', z.object({ items: z.array(staffSchema) })),
  async (c) => {
  const { items } = c.req.valid('json');
  const existing = await staffRepo.getAll();
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
      await staffRepo.create(item as Omit<Staff, 'uuid'> & { uuid?: string });
      existingEmails.add(email);
      results.push({ index: i, ok: true });
    } catch (err) {
      results.push({ index: i, ok: false, error: String(err) });
    }
  }
  return c.json({ ok: true, results, total: items.length });
})
// PUT /:uuid — スタッフ更新
.put('/:uuid',
  zValidator('json', staffPartialSchema),
  async (c) => {
  const uuid = c.req.param('uuid');
  const body = c.req.valid('json');
  await staffRepo.update(uuid, body as Partial<Staff>);
  return c.json({ ok: true });
});

export default route;
