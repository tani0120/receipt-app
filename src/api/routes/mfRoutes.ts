/**
 * mfRoutes.ts — マネーフォワード クラウド会計API データ取得ルート（Hono）
 *
 * レイヤー: ★route★ → mfApiClient
 * 責務: MF APIのデータ取得エンドポイント（事業者/事業所情報等）
 *
 * エンドポイント:
 *   GET  /api/mf/tenant  — 事業者情報を取得（公式 /v2/tenant）
 *   GET  /api/mf/office  — 事業所情報を取得（フォールバック付き）
 *
 * 準拠:
 *   - load_context.md L150: 既存エンドポイントを拡張せよ
 *   - 34_mf_api_integration.md: MF API連携設計
 */

import { Hono } from 'hono'
import { fetchTenant, fetchOffice, fetchAccountingOffice } from '../services/mfApiClient'
import { getAuthStatus, setOfficeInfo, getValidAccessToken } from '../services/mfAuthService'

const app = new Hono()

/**
 * GET /tenant — MF認可サーバーAPIから事業者情報を取得（公式エンドポイント）
 */
app.get('/tenant', async (c) => {
  const status = getAuthStatus()
  if (!status.authenticated) {
    return c.json({ error: 'MF未認証です。先にOAuth認可を完了してください' }, 401)
  }

  try {
    const tenant = await fetchTenant()
    return c.json({ tenant })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfRoutes] 事業者情報取得失敗: ${message}`)
    return c.json({ error: '事業者情報の取得に失敗しました', detail: message }, 500)
  }
})

/**
 * GET /office — MFから事業所情報を取得
 * まず /v2/tenant を試し、失敗したら旧API /api/v1/office にフォールバック
 */
app.get('/office', async (c) => {
  const status = getAuthStatus()
  if (!status.authenticated) {
    return c.json({ error: 'MF未認証です。先にOAuth認可を完了してください' }, 401)
  }

  try {
    // 公式API（/v2/tenant）を先に試行
    const tenant = await fetchTenant()
    return c.json({ tenant, source: '/v2/tenant' })
  } catch (tenantErr) {
    console.warn(`[mfRoutes] /v2/tenant 失敗、旧API /api/v1/office にフォールバック`)
    try {
      const office = await fetchOffice()
      setOfficeInfo('default', office.id, office.name)
      return c.json({ office, source: '/api/v1/office' })
    } catch (officeErr) {
      const message = officeErr instanceof Error ? officeErr.message : String(officeErr)
      console.error(`[mfRoutes] 事業所情報取得失敗: ${message}`)
      return c.json({ error: '事業所情報の取得に失敗しました', detail: message }, 500)
    }
  }
})

/**
 * GET /accounting-office — 会計APIから事業者情報を取得（GET /v3/office）
 * 個人/法人判定、会計期間、従業員数等の業務データが取れる
 */
app.get('/accounting-office', async (c) => {
  const status = getAuthStatus()
  if (!status.authenticated) {
    return c.json({ error: 'MF未認証です。先にOAuth認可を完了してください' }, 401)
  }

  try {
    const office = await fetchAccountingOffice()
    return c.json({ office, source: 'accounting-api /v3/office' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfRoutes] 会計API事業者情報取得失敗: ${message}`)
    return c.json({ error: '会計APIからの事業者情報取得に失敗しました', detail: message }, 500)
  }
})

/**
 * GET /debug-token — デバッグ用: 現在のアクセストークンを返す（テスト後削除）
 */
app.get('/debug-token', async (c) => {
  try {
    const token = await getValidAccessToken()
    return c.json({ token: token.substring(0, 20) + '...', full: token })
  } catch (err) {
    return c.json({ error: String(err) }, 401)
  }
})

export default app

