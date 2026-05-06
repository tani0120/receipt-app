/**
 * authRoutes.ts — ログインスタッフ管理APIルート（Hono）
 *
 * レイヤー: ★route★ → authStore
 * 責務: 現在のログインスタッフの取得・切替
 *
 * エンドポイント:
 *   GET  /api/auth/current  — 現在のログインスタッフ取得
 *   PUT  /api/auth/switch   — ログインスタッフ切替
 *
 * Supabase移行時: supabase.auth.getUser() に差し替えるだけ
 * 準拠: DL-042
 */

import { Hono } from 'hono';
import { getAll } from '../services/staffStore';

const app = new Hono();

/** メモリ上の現在スタッフUUID（サーバー再起動でリセット） */
let currentStaffUuid: string | null = null;

/** GET /current — 現在のログインスタッフ取得 */
app.get('/current', (c) => {
  const staffList = getAll();
  // 現在のUUIDが有効か確認
  let staff = currentStaffUuid
    ? staffList.find(s => s.uuid === currentStaffUuid && s.status === 'active')
    : null;
  // フォールバック: activeの先頭
  if (!staff) {
    staff = staffList.find(s => s.status === 'active') ?? null;
    if (staff) currentStaffUuid = staff.uuid;
  }
  return c.json({ staff, staffId: staff?.uuid ?? null });
});

/** PUT /switch — ログインスタッフ切替 */
app.put('/switch', async (c) => {
  const body = await c.req.json<{ staffId: string }>();
  if (!body.staffId) {
    return c.json({ error: 'staffIdは必須です' }, 400);
  }
  const staffList = getAll();
  const staff = staffList.find(s => s.uuid === body.staffId && s.status === 'active');
  if (!staff) {
    return c.json({ error: 'スタッフが見つかりません' }, 404);
  }
  currentStaffUuid = body.staffId;
  return c.json({ ok: true, staff, staffId: staff.uuid });
});

export default app;
