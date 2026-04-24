/**
 * 通知API ルート
 *
 * GET    /api/notifications          → 全通知取得
 * POST   /api/notifications          → 通知追加
 * PUT    /api/notifications/:id/read → 既読にする
 * PUT    /api/notifications/read-all → 全既読
 * DELETE /api/notifications/:id      → 通知削除
 * DELETE /api/notifications          → 全削除
 *
 * 準拠: DL-047（exportHistoryRoutes.tsと同一パターン）
 */

import { Hono } from 'hono';
import {
  getAllNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../services/notificationStore';
import type { AppNotification } from '../../repositories/types';

const app = new Hono();

/** GET / — 全通知取得 */
app.get('/', (c) => {
  const notifications = getAllNotifications();
  return c.json({ notifications });
});

/** POST / — 通知追加 */
app.post('/', async (c) => {
  const body = await c.req.json<AppNotification>();
  addNotification(body);
  return c.json({ ok: true, id: body.id });
});

/** PUT /:id/read — 既読にする */
app.put('/:id/read', (c) => {
  const id = c.req.param('id');
  const found = markAsRead(id);
  if (!found) return c.json({ error: '通知が見つかりません' }, 404);
  return c.json({ ok: true });
});

/** PUT /read-all — 全既読 */
app.put('/read-all', (_c) => {
  markAllAsRead();
  return _c.json({ ok: true });
});

/** DELETE /:id — 通知削除 */
app.delete('/:id', (c) => {
  const id = c.req.param('id');
  const found = deleteNotification(id);
  if (!found) return c.json({ error: '通知が見つかりません' }, 404);
  return c.json({ ok: true });
});

/** DELETE / — 全削除 */
app.delete('/', (_c) => {
  clearAllNotifications();
  return _c.json({ ok: true });
});

export default app;
