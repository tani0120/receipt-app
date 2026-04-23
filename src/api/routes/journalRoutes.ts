/**
 * journalRoutes.ts — 仕訳JSON永続化APIルート（Hono）
 *
 * エンドポイント:
 *   GET  /api/journals/:clientId        — 顧問先の仕訳データ取得
 *   PUT  /api/journals/:clientId        — 顧問先の仕訳データを全件上書き
 *   POST /api/journals/:clientId        — 顧問先の仕訳データに追加
 *
 * 準拠: DL-042（#12 useJournals localStorage脱却）
 */

import { Hono } from 'hono';
import { apiError } from '../helpers/apiError';
import { 配列必須 } from '../helpers/apiMessages';
import {
  getJournals,
  saveJournals,
  addJournals,
  countJournals,
} from '../services/journalStore';

const app = new Hono();

// ============================================================
// GET /:clientId — 顧問先の仕訳データ取得
// ============================================================
app.get('/:clientId', (c) => {
  const clientId = c.req.param('clientId');
  const journals = getJournals(clientId);
  return c.json({ journals, count: journals.length });
});

// ============================================================
// PUT /:clientId — 顧問先の仕訳データを全件上書き保存
// ============================================================
app.put('/:clientId', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json<{ journals: unknown[] }>();
  if (!body.journals || !Array.isArray(body.journals)) {
    return apiError(c, 400, 配列必須('journals'));
  }
  saveJournals(clientId, body.journals);
  return c.json({ ok: true, count: body.journals.length });
});

// ============================================================
// POST /:clientId — 顧問先の仕訳データに追加
// ============================================================
app.post('/:clientId', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json<{ journals: unknown[] }>();
  if (!body.journals || !Array.isArray(body.journals)) {
    return apiError(c, 400, 配列必須('journals'));
  }
  const added = addJournals(clientId, body.journals);
  return c.json({ ok: true, added });
});

export default app;
