/**
 * 出力履歴 + CSVスナップショット APIルート
 *
 * GET  /api/export-history/:clientId         → 履歴一覧
 * POST /api/export-history/:clientId         → 履歴追加
 * GET  /api/export-history/:clientId/csv/:historyId → CSVスナップショット取得
 * POST /api/export-history/:clientId/csv     → CSVスナップショット保存
 *
 * 準拠: DL-042（localStorage依存排除）
 */

import { Hono } from 'hono';
import { apiError } from '../helpers/apiError';
import { CSV未検出 } from '../helpers/apiMessages';
import {
  getExportHistory,
  addExportHistory,
  getCsvSnapshot,
  saveCsvSnapshot,
} from '../services/exportHistoryStore';

const app = new Hono();

/** 履歴一覧取得 */
app.get('/:clientId', (c) => {
  const clientId = c.req.param('clientId');
  return c.json(getExportHistory(clientId));
});

/** 履歴追加 */
app.post('/:clientId', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json();
  addExportHistory(clientId, body);
  return c.json({ ok: true });
});

/** CSVスナップショット取得 */
app.get('/:clientId/csv/:historyId', (c) => {
  const clientId = c.req.param('clientId');
  const historyId = c.req.param('historyId');
  const snapshot = getCsvSnapshot(clientId, historyId);
  if (!snapshot) return apiError(c, 404, CSV未検出);
  return c.json(snapshot);
});

/** CSVスナップショット保存 */
app.post('/:clientId/csv', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json();
  saveCsvSnapshot(clientId, body);
  return c.json({ ok: true });
});

export default app;
