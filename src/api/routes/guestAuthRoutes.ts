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
import { apiError } from '../helpers/apiError';
import { 必須, メール重複, パスワード不足, ログイン失敗 } from '../helpers/apiMessages';
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
    return apiError(c, 400, 必須('email, password, displayName, clientId'));
  }

  const result = register(body.email, body.password, body.displayName, body.clientId);
  if ('error' in result) {
    // storeが返す生エラーをそのまま出さず、安全な定型文に置換
    const msg = result.error.includes('パスワード') ? パスワード不足 : メール重複;
    return apiError(c, 409, msg);
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
    return apiError(c, 400, 必須('emailとpassword'));
  }

  const result = login(body.email, body.password);
  if ('error' in result) {
    return apiError(c, 401, ログイン失敗);
  }
  return c.json({ ok: true, user: result.user });
});

export default app;
