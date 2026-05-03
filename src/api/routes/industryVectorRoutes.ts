/**
 * industryVectorRoutes.ts — 業種ベクトルAPIルート（Hono）
 *
 * レイヤー: ★route★ → industryVectorStore
 * 責務: リクエスト受付・バリデーション・レスポンス返却
 *
 * エンドポイント:
 *   GET  /api/industry-vectors?type=corporate|sole  — 業種ベクトル一覧
 *   PUT  /api/industry-vectors?type=corporate|sole  — 全件上書き保存
 *
 * 準拠: DL-042, Phase 2 Step 8
 */

import { Hono } from 'hono'
import { apiError, apiCatchError } from '../helpers/apiError'
import * as ivStore from '../services/industryVectorStore'

const app = new Hono()

// ============================================================
// バリデーションヘルパー
// ============================================================

type BusinessType = 'corporate' | 'sole'

function parseType(raw: string | undefined): BusinessType | null {
  if (raw === 'corporate' || raw === 'sole') return raw
  return null
}

// ============================================================
// GET / — 業種ベクトル一覧
// ============================================================
app.get('/', (c) => {
  const type = parseType(c.req.query('type'))
  if (!type) {
    return apiError(c, 400, 'クエリパラメータ type=corporate|sole は必須です')
  }
  const entries = type === 'corporate' ? ivStore.getCorporate() : ivStore.getSole()
  return c.json({ entries, count: entries.length, type })
})

// ============================================================
// PUT / — 全件上書き保存
// ============================================================
app.put('/', async (c) => {
  const type = parseType(c.req.query('type'))
  if (!type) {
    return apiError(c, 400, 'クエリパラメータ type=corporate|sole は必須です')
  }
  try {
    const body = await c.req.json()
    if (!Array.isArray(body.entries)) {
      return apiError(c, 400, 'リクエストボディに entries 配列が必要です')
    }
    const result = type === 'corporate'
      ? ivStore.saveCorporateAll(body.entries)
      : ivStore.saveSoleAll(body.entries)
    return c.json(result)
  } catch (err) {
    return apiCatchError(c, err)
  }
})

export default app
