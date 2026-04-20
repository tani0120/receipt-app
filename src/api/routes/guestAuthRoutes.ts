/**
 * guestAuthRoutes.ts — ゲスト認証APIルート（Hono）
 *
 * レイヤー: ★route★ → guestUserStore
 * 責務: リクエスト受付・バリデーション・レスポンス返却
 *
 * エンドポイント:
 *   POST /api/guest/register  — 新規登録（メール+パスワード+表示名+clientId）
 *   POST /api/guest/login     — ログイン（メール+パスワード）
 *
 * 【移行時】
 *   Supabase Auth（signUp / signInWithPassword）に差し替え。
 *   フロント側のfetch呼び出しは変更不要（エンドポイントをSupabase SDK呼び出しに差し替えるだけ）。
 */

import { Hono } from 'hono';
import { register, login } from '../services/guestUserStore';

const app = new Hono();

// ============================================================
// POST /register — 新規登録
// ============================================================
app.post('/register', async (c) => {
  const body = await c.req.json<{
    email: string;
    password: string;
    displayName: string;
    clientId: string;
  }>();

  if (!body.email || !body.password || !body.displayName || !body.clientId) {
    return c.json({ error: 'email, password, displayName, clientIdは全て必須です' }, 400);
  }

  const result = register(body.email, body.password, body.displayName, body.clientId);
  if ('error' in result) {
    return c.json({ error: result.error }, 409);
  }
  return c.json({ ok: true, user: result.user });
});

// ============================================================
// POST /login — ログイン
// ============================================================
app.post('/login', async (c) => {
  const body = await c.req.json<{
    email: string;
    password: string;
  }>();

  if (!body.email || !body.password) {
    return c.json({ error: 'emailとpasswordは必須です' }, 400);
  }

  const result = login(body.email, body.password);
  if ('error' in result) {
    return c.json({ error: result.error }, 401);
  }
  return c.json({ ok: true, user: result.user });
});

export default app;
