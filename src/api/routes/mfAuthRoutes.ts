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
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import crypto from 'node:crypto'
import {
  buildAuthorizationUrl,
  exchangeCodeForToken,
  getAuthStatus,
  clearToken,
} from '../services/mfAuthService'

/** フロントエンドのOrigin。本番環境では環境変数 FRONTEND_URL で上書き可能 */
const FRONTEND_ORIGIN = process.env.FRONTEND_URL ?? 'http://localhost:5173'

// CSRF防止用stateの一時保存（メモリ。有効期限10分）
// TODO: Phase 2（Supabase移行）完了時にセッションストアに差し替え (2026-05-17)
const pendingStates = new Map<string, { createdAt: number; clientId: string }>()

/** 期限切れstateの定期クリーンアップ（10分） */
const STATE_TTL_MS = 10 * 60 * 1000

function cleanExpiredStates(): void {
  const now = Date.now()
  for (const [state, entry] of pendingStates) {
    if (now - entry.createdAt > STATE_TTL_MS) {
      pendingStates.delete(state)
    }
  }
}

// ---------- エンドポイント ----------

const route = new Hono()
/**
 * GET /auth/url — 認可画面URLを取得
 *
 * フロント側: このURLにリダイレクトしてユーザーにMFログイン・認可を促す
 * レスポンス: { url: string }
 */
.get('/auth/url',
  zValidator('query', z.object({ clientId: z.string().optional() })),
  (c) => {
  cleanExpiredStates()

  const clientId = c.req.valid('query').clientId ?? 'unknown'
  const state = crypto.randomBytes(32).toString('hex')
  // clientIdはMapのvalueに保存（URLエンコード問題を回避）
  pendingStates.set(state, { createdAt: Date.now(), clientId })

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
.get('/auth/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  const error = c.req.query('error')

  // MF側でユーザーが拒否した場合
  if (error) {
    console.error(`[mfAuthRoutes] 認可エラー: ${error}`)
    return c.redirect(`${FRONTEND_ORIGIN}/#/mf/connected?mf_auth=error&reason=${encodeURIComponent(error)}`)
  }

  // パラメータ不足
  if (!code || !state) {
    console.error('[mfAuthRoutes] コールバックはcode/stateがありません')
    return c.redirect(`${FRONTEND_ORIGIN}/#/mf/connected?mf_auth=error&reason=missing_params`)
  }

  // CSRF検証
  const entry = pendingStates.get(state)
  if (!entry) {
    console.error('[mfAuthRoutes] 不正なstateパラメータ')
    return c.redirect(`${FRONTEND_ORIGIN}/#/mf/connected?mf_auth=error&reason=invalid_state`)
  }
  pendingStates.delete(state)

  const tokenKey = entry.clientId && entry.clientId !== 'unknown' ? entry.clientId : 'default'
  console.log(`[mfAuthRoutes] コールバック: clientId=${tokenKey}`)

  try {
    // 認可code → アクセストークン交換（clientId別に保存）
    await exchangeCodeForToken(code, tokenKey)
    console.log(`[mfAuthRoutes] MF OAuth認証成功: clientId=${tokenKey}`)
    return c.redirect(`${FRONTEND_ORIGIN}/#/mf/connected?mf_auth=success`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfAuthRoutes] トークン交換失敗: ${message}`)
    return c.redirect(`${FRONTEND_ORIGIN}/#/mf/connected?mf_auth=error&reason=${encodeURIComponent('token_exchange_failed')}`)
  }
})

/**
 * GET /auth/status — 現在の認証状態を取得
 *
 * クエリ: clientId（省略時は 'default'）
 * レスポンス: { authenticated: boolean, expiresAt: string|null, officeId: string|null, officeName: string|null }
 */
.get('/auth/status',
  zValidator('query', z.object({ clientId: z.string().optional() })),
  (c) => {
  const clientId = c.req.valid('query').clientId ?? 'default'
  const status = getAuthStatus(clientId)
  return c.json(status)
})

/**
 * POST /auth/status/bulk — 複数clientIdの認証状態を一括取得
 *
 * ボディ: { clientIds: string[] }
 * レスポンス: { [clientId]: { authenticated: boolean } }
 *
 * Supabase移行後: WHERE client_id = ANY($1) の1クエリで高速化予定
 */
.post('/auth/status/bulk',
  zValidator('json', z.object({ clientIds: z.array(z.string()) })),
  async (c) => {
  const { clientIds } = c.req.valid('json')
  const result: Record<string, { authenticated: boolean }> = {}
  for (const id of clientIds) {
    const s = getAuthStatus(id)
    result[id] = { authenticated: s.authenticated }
  }
  return c.json(result)
})

/**
 * POST /auth/logout — トークンを削除
 *
 * レスポンス: { ok: true }
 */
.post('/auth/logout', (c) => {
  clearToken()
  return c.json({ ok: true })
})

export default route
