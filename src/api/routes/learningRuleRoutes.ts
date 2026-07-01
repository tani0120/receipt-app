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
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { apiError, apiCatchError } from '../helpers/apiError'
import { 未検出, 必須 } from '../../constants/apiMessages'
import { createMockRepositories } from '../../repositories/mock'

const learningRuleRepo = createMockRepositories().learningRule

/** LearningRuleEntryLine専用zodスキーマ */
const entryLineSchema = z.object({
  entryId: z.string(),
  ruleId: z.string(),
  side: z.enum(['debit', 'credit']),
  account: z.string(),
  subAccount: z.string().nullable(),
  taxCategory: z.string().nullable(),
  department: z.string().nullable(),
  amountType: z.enum(['auto', 'total', 'fixed']),
  fixedAmount: z.number().nullable(),
  displayName: z.string().nullable(),
  description: z.string().nullable(),
  targetMonth: z.string().nullable(),
  displayOrder: z.number(),
}).passthrough()

/** LearningRule専用zodスキーマ（learning_rule.type.ts LearningRule型に準拠） */
const learningRuleSchema = z.object({
  ruleId: z.string().optional(),
  clientId: z.string().optional(),
  keyword: z.string(),
  matchType: z.enum(['exact', 'contains']),
  direction: z.enum(['expense', 'income']).nullable(),
  sourceCategory: z.enum(['receipt', 'bank', 'credit', 'all']).nullable(),
  amountMin: z.number().nullable(),
  amountMax: z.number().nullable(),
  entries: z.array(entryLineSchema),
  isActive: z.boolean(),
  hitCount: z.number().optional(),
  generatedBy: z.enum(['ai', 'human']),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough()

/** LearningRule部分更新用スキーマ */
const learningRulePartialSchema = learningRuleSchema.partial()

/** POST /:clientId/list のリクエストbody */
const listFilterSchema = z.object({
  sourceFilter: z.string().optional(),
  filterMode: z.string().optional(),
  searchText: z.string().optional(),
}).passthrough()

const route = new Hono()
// GET /:clientId — 顧問先の学習ルール一覧
.get('/:clientId', async (c) => {
  const clientId = c.req.param('clientId')
  const { rules } = await learningRuleRepo.getByClientId(clientId)
  return c.json({ rules, count: rules.length })
})
// POST /:clientId/list — T-31-8: フィルタ/カウント/検索付き一覧
.post('/:clientId/list',
  zValidator('json', listFilterSchema),
  async (c) => {
  const clientId = c.req.param('clientId')
  try {
    const body = c.req.valid('json')
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
// GET /:clientId/:ruleId — 1件取得
.get('/:clientId/:ruleId', async (c) => {
  const clientId = c.req.param('clientId')
  const ruleId = c.req.param('ruleId')
  const { rules } = await learningRuleRepo.getByClientId(clientId)
  const rule = rules.find(r => r.ruleId === ruleId)
  if (!rule) {
    return apiError(c, 404, 未検出(`学習ルール ${ruleId}`))
  }
  return c.json({ rule })
})
// POST /:clientId — ルール追加
.post('/:clientId',
  zValidator('json', learningRuleSchema),
  async (c) => {
  const clientId = c.req.param('clientId')
  try {
    const body = c.req.valid('json') as Record<string, unknown>
    if (!body.keyword) {
      return apiError(c, 400, 必須('keyword'))
    }
    body.clientId = clientId
    const { rule } = await learningRuleRepo.create(clientId, body as Parameters<typeof learningRuleRepo.create>[1])
    return c.json({ ok: true, rule })
  } catch (err) {
    return apiCatchError(c, err)
  }
})
// PUT /:clientId/:ruleId — ルール更新
.put('/:clientId/:ruleId',
  zValidator('json', learningRulePartialSchema),
  async (c) => {
  const clientId = c.req.param('clientId')
  const ruleId = c.req.param('ruleId')
  try {
    const body = c.req.valid('json')
    await learningRuleRepo.update(clientId, ruleId, body)
    return c.json({ ok: true })
  } catch (err) {
    return apiCatchError(c, err)
  }
})
// DELETE /:clientId/:ruleId — ルール削除
.delete('/:clientId/:ruleId', async (c) => {
  const clientId = c.req.param('clientId')
  const ruleId = c.req.param('ruleId')
  try {
    await learningRuleRepo.deleteById(clientId, ruleId)
    return c.json({ ok: true })
  } catch (err) {
    return apiCatchError(c, err)
  }
});

export default route
