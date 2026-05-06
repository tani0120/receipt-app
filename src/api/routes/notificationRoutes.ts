/**
 * 通知API ルート
 *
 * GET    /api/notifications?staffId=xxx  → スタッフ宛通知取得
 * POST   /api/notifications             → 通知追加
 * POST   /api/notifications/mention      → メンション通知発行（サーバー側でメンション検出）
 * PUT    /api/notifications/:id/read    → 既読にする（staffId必須）
 * PUT    /api/notifications/read-all    → 全既読（staffId必須）
 * DELETE /api/notifications/:id         → 通知削除
 * DELETE /api/notifications             → 全削除
 *
 * 準拠: DL-047
 */

import { Hono } from 'hono';
import {
  getAllNotifications,
  getNotificationsForStaff,
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../services/notificationStore';
import { getAll as getAllStaff } from '../services/staffStore';
import type { AppNotification } from '../../repositories/types';

const app = new Hono();

// ============================================================
// GET / — 通知取得（staffIdフィルタ対応）
// ============================================================
app.get('/', (c) => {
  const staffId = c.req.query('staffId');
  if (staffId) {
    const notifications = getNotificationsForStaff(staffId);
    return c.json({ notifications });
  }
  // staffId未指定は全件返却（管理用）
  const notifications = getAllNotifications();
  return c.json({ notifications });
});

// ============================================================
// POST / — 通知追加（汎用）
// ============================================================
app.post('/', async (c) => {
  const body = await c.req.json<AppNotification>();
  // readByがない場合は空配列で初期化
  if (!body.readBy) body.readBy = [];
  addNotification(body);
  return c.json({ ok: true, id: body.id });
});

// ============================================================
// POST /mention — メンション通知発行（サーバー側でメンション検出）
// ============================================================
app.post('/mention', async (c) => {
  const body = await c.req.json<{
    commentBody: string;
    authorName: string;
    authorStaffId: string;
    clientId: string;
    clientName: string;
  }>();

  const { commentBody, authorName, authorStaffId, clientId, clientName } = body;
  const allStaff = getAllStaff();
  const createdNotifications: string[] = [];

  console.log(`[通知API/mention] commentBody="${commentBody}", authorStaffId="${authorStaffId}"`);
  console.log(`[通知API/mention] スタッフ ${allStaff.length}名: ${allStaff.map(s => s.name).join(', ')}`);

  if (commentBody.includes('@all')) {
    // @all: 全activeスタッフに通知
    for (const s of allStaff) {
      if (s.status === 'active') {
        const id = `notif-mention-${Date.now()}-${s.uuid}`;
        addNotification({
          id,
          type: 'mention',
          title: `@${authorName} から全員メンション`,
          body: `「${clientName || '顧問先'}」のコメント: ${commentBody.slice(0, 80)}`,
          readBy: [],
          createdAt: new Date().toISOString(),
          clientId,
          targetStaffId: s.uuid,
        });
        createdNotifications.push(id);
      }
    }
  } else {
    // 個別メンション: スタッフ名で直接マッチ
    for (const s of allStaff) {
      if (commentBody.includes(`@${s.name}`) && s.status === 'active') {
        const id = `notif-mention-${Date.now()}-${s.uuid}`;
        addNotification({
          id,
          type: 'mention',
          title: `@${authorName} からメンション`,
          body: `「${clientName || '顧問先'}」のコメント: ${commentBody.slice(0, 80)}`,
          readBy: [],
          createdAt: new Date().toISOString(),
          clientId,
          targetStaffId: s.uuid,
        });
        createdNotifications.push(id);
      }
    }
  }

  console.log(`[通知API] メンション通知 ${createdNotifications.length}件発行 by ${authorName}`);
  return c.json({ ok: true, count: createdNotifications.length, ids: createdNotifications });
});

// ============================================================
// PUT /:id/read — 既読にする（staffId必須）
// ============================================================
app.put('/:id/read', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ staffId: string }>().catch(() => ({ staffId: '' }));
  if (!body.staffId) {
    return c.json({ error: 'staffIdが必要です' }, 400);
  }
  const found = markAsRead(id, body.staffId);
  if (!found) return c.json({ error: '通知が見つかりません' }, 404);
  return c.json({ ok: true });
});

// ============================================================
// PUT /read-all — 全既読（staffId必須）
// ============================================================
app.put('/read-all', async (c) => {
  const body = await c.req.json<{ staffId: string }>().catch(() => ({ staffId: '' }));
  if (!body.staffId) {
    return c.json({ error: 'staffIdが必要です' }, 400);
  }
  markAllAsRead(body.staffId);
  return c.json({ ok: true });
});

// ============================================================
// DELETE /:id — 通知削除
// ============================================================
app.delete('/:id', (c) => {
  const id = c.req.param('id');
  const found = deleteNotification(id);
  if (!found) return c.json({ error: '通知が見つかりません' }, 404);
  return c.json({ ok: true });
});

// ============================================================
// DELETE / — 全削除
// ============================================================
app.delete('/', (_c) => {
  clearAllNotifications();
  return _c.json({ ok: true });
});

export default app;
