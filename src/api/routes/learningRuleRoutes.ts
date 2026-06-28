/**
 * learningRuleRoutes.ts — 学習ルールAPIルート（Hono）
 *
 * レイヤー: ★route★ → LearningRuleRepository
 * 責務: リクエスト受付・バリデーション・レスポンス返却
 *
 * エンドポイント:
 *   GET    /api/learning-rules/:clientId         — 顧問先の学習ルール一覧
 *   GET    /api/learning-rules/:clientId/:ruleId — 1件取得
 *   POST   /api/learning-rules/:clientId         — ルール追加
 *   PUT    /api/learning-rules/:clientId/:ruleId — ルール更新
 *   DELETE /api/learning-rules/:clientId/:ruleId — ルール削除
 *
 * 準拠: DL-042, Phase 4
 */

import { Hono } from 'hono'
import { apiError, apiCatchError } from '../helpers/apiError'
import { 未検出, 必須 } from '../../constants/apiMessages'
import { createMockRepositories } from '../../repositories/mock'

const learningRuleRepo = createMockRepositories().learningRule
const app = new Hono()

// ============================================================
// GET /:clientId — 顧問先の学習ルール一覧
// ============================================================
app.get('/:clientId', async (c) => {
  const clientId = c.req.param('clientId')
  const { rules } = await learningRuleRepo.getByClientId(clientId)
  return c.json({ rules, count: rules.length })
})

// ============================================================
// POST /:clientId/list — T-31-8: フィルタ/カウント/検索付き一覧
// ============================================================
app.post('/:clientId/list', async (c) => {
  const clientId = c.req.param('clientId')
  try {
    const body = await c.req.json() as {
      sourceFilter?: string
      filterMode?: string
      searchText?: string
    }
    const {
      sourceFilter = 'all',
      filterMode = 'all',
      searchText = '',
    } = body

    const result = await learningRuleRepo.list(clientId, {
      sourceFilter,
      filterMode,
      searchText,
    })

    return c.json({
      rules: result.rules,
      count: result.rules.length,
      sourceCounts: result.sourceCounts,
      statusCounts: result.statusCounts,
      generatedByCounts: result.generatedByCounts,
    })
  } catch (err) {
    return apiCatchError(c, err)
  }
})

// ============================================================
// GET /:clientId/:ruleId — 1件取得
// ============================================================
app.get('/:clientId/:ruleId', async (c) => {
  const clientId = c.req.param('clientId')
  const ruleId = c.req.param('ruleId')
  const { rules } = await learningRuleRepo.getByClientId(clientId)
  const rule = rules.find(r => r.ruleId === ruleId)
  if (!rule) {
    return apiError(c, 404, 未検出(`学習ルール ${ruleId}`))
  }
  return c.json({ rule })
})

// ============================================================
// POST /:clientId — ルール追加
// ============================================================
app.post('/:clientId', async (c) => {
  const clientId = c.req.param('clientId')
  try {
    const body = await c.req.json()
    if (!body.keyword) {
      return apiError(c, 400, 必須('keyword'))
    }
    body.clientId = clientId
    const { rule } = await learningRuleRepo.create(clientId, body)
    return c.json({ ok: true, rule })
  } catch (err) {
    return apiCatchError(c, err)
  }
})

// ============================================================
// PUT /:clientId/:ruleId — ルール更新
// ============================================================
app.put('/:clientId/:ruleId', async (c) => {
  const clientId = c.req.param('clientId')
  const ruleId = c.req.param('ruleId')
  try {
    const body = await c.req.json()
    await learningRuleRepo.update(clientId, ruleId, body)
    return c.json({ ok: true })
  } catch (err) {
    return apiCatchError(c, err)
  }
})

// ============================================================
// DELETE /:clientId/:ruleId — ルール削除
// ============================================================
app.delete('/:clientId/:ruleId', async (c) => {
  const clientId = c.req.param('clientId')
  const ruleId = c.req.param('ruleId')
  try {
    await learningRuleRepo.deleteById(clientId, ruleId)
    return c.json({ ok: true })
  } catch (err) {
    return apiCatchError(c, err)
  }
})

export default app
