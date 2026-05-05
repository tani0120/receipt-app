/**
 * progressRoutes.ts — 進捗管理APIルート（Hono）
 *
 * レイヤー: ★route★ → progressListService
 * 責務: リクエスト受付・バリデーション・レスポンス返却
 *
 * エンドポイント:
 *   POST /api/progress/list — 進捗一覧（フィルタ+ソート+ページネーション）
 *
 * 準拠: T-31-1（31_logic_api_migration_audit.md）
 */

import { Hono } from 'hono'
import { getProgressList } from '../services/progressListService'
import type { ProgressListQuery } from '../services/progressListService'

const app = new Hono()

// ============================================================
// POST /list — 進捗一覧（フィルタ+ソート+ページネーション）
// ============================================================
app.post('/list', async (c) => {
  try {
    const body = await c.req.json<ProgressListQuery>()
    const result = getProgressList(body)
    return c.json(result)
  } catch (err) {
    console.error('[progressRoutes] /list エラー:', err)
    return c.json({ error: '進捗一覧取得に失敗しました' }, 500)
  }
})

export default app
