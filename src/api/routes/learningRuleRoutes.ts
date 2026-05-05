/**
 * learningRuleRoutes.ts — 学習ルールAPIルート（Hono）
 *
 * レイヤー: ★route★ → learningRuleStore
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
import { 未検出, 必須 } from '../helpers/apiMessages'
import * as store from '../services/learningRuleStore'

const app = new Hono()

// ============================================================
// GET /:clientId — 顧問先の学習ルール一覧
// ============================================================
app.get('/:clientId', (c) => {
  const clientId = c.req.param('clientId')
  const rules = store.getByClientId(clientId)
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
      filterMode?: 'all' | 'active' | 'inactive'
      searchText?: string
    }
    const {
      sourceFilter = 'all',
      filterMode = 'all',
      searchText = '',
    } = body

    const allRules = store.getByClientId(clientId)

    // カテゴリ別カウント（全ルール対象）
    const sourceCounts = {
      all: allRules.length,
      receipt: allRules.filter(r => r.sourceCategory === 'receipt').length,
      bank: allRules.filter(r => r.sourceCategory === 'bank').length,
      credit: allRules.filter(r => r.sourceCategory === 'credit').length,
    }

    // ソースカテゴリフィルタ
    let filtered = sourceFilter === 'all'
      ? allRules
      : allRules.filter(r => r.sourceCategory === sourceFilter)

    // ステータス別カウント（ソースフィルタ後）
    const statusCounts = {
      all: filtered.length,
      active: filtered.filter(r => r.isActive).length,
      inactive: filtered.filter(r => !r.isActive).length,
    }

    // 生成元別カウント（全ルール対象）
    const generatedByCounts = {
      ai: allRules.filter(r => r.generatedBy === 'ai').length,
      human: allRules.filter(r => r.generatedBy === 'human').length,
    }

    // 有効/無効フィルタ
    if (filterMode === 'active') filtered = filtered.filter(r => r.isActive)
    if (filterMode === 'inactive') filtered = filtered.filter(r => !r.isActive)

    // キーワード検索
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase()
      filtered = filtered.filter(r =>
        r.keyword.toLowerCase().includes(q) ||
        r.entries.some((e: { account: string; subAccount?: string | null }) =>
          e.account.toLowerCase().includes(q) ||
          (e.subAccount && e.subAccount.toLowerCase().includes(q))
        )
      )
    }

    return c.json({
      rules: filtered,
      count: filtered.length,
      sourceCounts,
      statusCounts,
      generatedByCounts,
    })
  } catch (err) {
    return apiCatchError(c, err)
  }
})

// ============================================================
// GET /:clientId/:ruleId — 1件取得
// ============================================================
app.get('/:clientId/:ruleId', (c) => {
  const clientId = c.req.param('clientId')
  const ruleId = c.req.param('ruleId')
  const rule = store.getById(clientId, ruleId)
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
    const rule = store.create(clientId, body)
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
    const ok = store.update(clientId, ruleId, body)
    if (!ok) {
      return apiError(c, 404, 未検出(`学習ルール ${ruleId}`))
    }
    return c.json({ ok: true })
  } catch (err) {
    return apiCatchError(c, err)
  }
})

// ============================================================
// DELETE /:clientId/:ruleId — ルール削除
// ============================================================
app.delete('/:clientId/:ruleId', (c) => {
  const clientId = c.req.param('clientId')
  const ruleId = c.req.param('ruleId')
  const ok = store.remove(clientId, ruleId)
  if (!ok) {
    return apiError(c, 404, 未検出(`学習ルール ${ruleId}`))
  }
  return c.json({ ok: true })
})

export default app
