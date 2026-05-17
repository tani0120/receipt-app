/**
 * mfAuthRoutes.ts — マネーフォワード クラウド会計API OAuth認証ルート（Hono）
 *
 * レイヤー: ★route★ → mfAuthService
 * 責務: OAuth 2.0 認可フロー（認可URL取得・コールバック・ステータス確認）
 *
 * エンドポイント:
 *   GET  /api/mf/auth/url       — 認可画面URLを取得（フロントがリダイレクト）
 *   GET  /api/mf/auth/callback  — MFからのコールバック（認可コード→トークン交換）
 *   GET  /api/mf/auth/status    — 現在の認証状態を取得
 *   POST /api/mf/auth/logout    — トークンを削除（ログアウト）
 *
 * 準拠:
 *   - load_context.md L130: ロジックはAPI側に書け
 *   - load_context.md L150: 既存エンドポイントを拡張せよ。新規エンドポイント乱立禁止
 *     → MF連携は新規ドメインなので /api/mf/ 配下に集約
 */

import { Hono } from 'hono'
import crypto from 'node:crypto'
import {
  buildAuthorizationUrl,
  exchangeCodeForToken,
  getAuthStatus,
  clearToken,
} from '../services/mfAuthService'

const app = new Hono()

// CSRF防止用stateの一時保存（メモリ。有効期限10分）
// TODO: Phase 2（Supabase移行）完了時にセッションストアに差し替え (2026-05-17)
const pendingStates = new Map<string, number>()

/** 期限切れstateの定期クリーンアップ（10分） */
const STATE_TTL_MS = 10 * 60 * 1000

function cleanExpiredStates(): void {
  const now = Date.now()
  for (const [state, createdAt] of pendingStates) {
    if (now - createdAt > STATE_TTL_MS) {
      pendingStates.delete(state)
    }
  }
}

// ---------- エンドポイント ----------

/**
 * GET /auth/url — 認可画面URLを取得
 *
 * フロント側: このURLにリダイレクトしてユーザーにMFログイン・認可を促す
 * レスポンス: { url: string }
 */
app.get('/auth/url', (c) => {
  cleanExpiredStates()

  const state = crypto.randomBytes(32).toString('hex')
  pendingStates.set(state, Date.now())

  const url = buildAuthorizationUrl(state)
  return c.json({ url })
})

/**
 * GET /auth/callback — MFからのOAuthコールバック
 *
 * MFが認可後にリダイレクトしてくるエンドポイント
 * クエリパラメータ: code（認可コード）、state（CSRF防止用）
 *
 * 成功時: フロントのトップページにリダイレクト（トークンはサーバー側に保存済み）
 * 失敗時: エラーページにリダイレクト
 */
app.get('/auth/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  const error = c.req.query('error')

  // MF側でユーザーが拒否した場合
  if (error) {
    console.error(`[mfAuthRoutes] 認可エラー: ${error}`)
    return c.redirect('/?mf_auth=error&reason=' + encodeURIComponent(error))
  }

  // パラメータ不足
  if (!code || !state) {
    console.error('[mfAuthRoutes] コールバックにcode/stateがありません')
    return c.redirect('/?mf_auth=error&reason=missing_params')
  }

  // CSRF検証
  if (!pendingStates.has(state)) {
    console.error('[mfAuthRoutes] 不正なstateパラメータ')
    return c.redirect('/?mf_auth=error&reason=invalid_state')
  }
  pendingStates.delete(state)

  try {
    // 認可コード → アクセストークン交換
    await exchangeCodeForToken(code)
    console.log('[mfAuthRoutes] MF OAuth認証成功')
    return c.redirect('/?mf_auth=success')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfAuthRoutes] トークン交換失敗: ${message}`)
    return c.redirect('/?mf_auth=error&reason=' + encodeURIComponent('token_exchange_failed'))
  }
})

/**
 * GET /auth/status — 現在の認証状態を取得
 *
 * レスポンス: { authenticated: boolean, expiresAt: string|null, officeId: string|null, officeName: string|null }
 */
app.get('/auth/status', (c) => {
  const status = getAuthStatus()
  return c.json(status)
})

/**
 * POST /auth/logout — トークンを削除
 *
 * レスポンス: { ok: true }
 */
app.post('/auth/logout', (c) => {
  clearToken()
  return c.json({ ok: true })
})

export default app
