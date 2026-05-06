/**
 * taxCategoryRoutes.ts — 税区分APIルート（Hono）
 *
 * レイヤー: ★route★ → accountMasterStore
 * 責務: リクエスト受付・クエリパラメータ解析・レスポンス返却
 *
 * エンドポイント:
 *   GET  /api/tax-categories/master             — マスタ税区分一覧取得
 *   PUT  /api/tax-categories/master             — マスタ税区分全件上書き保存
 *   GET  /api/tax-categories/client/:clientId   — 顧問先税区分一覧取得
 *   PUT  /api/tax-categories/client/:clientId   — 顧問先税区分全件上書き保存
 *
 * 準拠: DL-042, Phase 2 Step 4-5
 */

import { Hono } from 'hono'
import { apiError } from '../helpers/apiError'
import { 必須 } from '../helpers/apiMessages'
import {
  getFilteredTaxCategories,
  saveAllTaxCategories,
  getFilteredClientTaxCategories,
  saveClientTaxCategories,
} from '../services/accountMasterStore'
import type { TaxCategory } from '../../types/shared-tax-category'

const app = new Hono()

// ============================================================
// 共通バリデーションヘルパー
// ============================================================

function parseTaxFilterParams(c: { req: { query: (key: string) => string | undefined } }) {
  const taxMethod = (c.req.query('taxMethod') ?? 'general') as 'general' | 'simplified' | 'exempt'
  const page = Number(c.req.query('page') ?? '1')
  const pageSize = Number(c.req.query('pageSize') ?? '50')
  return { taxMethod, page, pageSize }
}

function validateTaxFilterParams(params: { taxMethod: string; page: number; pageSize: number }): string | null {
  if (!['general', 'simplified', 'exempt'].includes(params.taxMethod)) {
    return 'taxMethod は general / simplified / exempt のいずれかを指定してください'
  }
  if (isNaN(params.page) || params.page < 1) {
    return 'page は1以上の数値を指定してください'
  }
  if (isNaN(params.pageSize) || params.pageSize < 1 || params.pageSize > 200) {
    return 'pageSize は1〜200の数値を指定してください'
  }
  return null
}

function validateTaxCategoriesBody(body: { taxCategories?: TaxCategory[] }): string | null {
  if (!body.taxCategories || !Array.isArray(body.taxCategories)) {
    return 'taxCategories 配列が必要です'
  }
  for (const tc of body.taxCategories) {
    if (!tc.id || !tc.name) {
      return `税区分にid/nameが必要です: ${JSON.stringify(tc).slice(0, 100)}`
    }
  }
  return null
}

// ============================================================
// GET /master — マスタ税区分一覧取得
// ============================================================
app.get('/master', (c) => {
  const params = parseTaxFilterParams(c)
  const err = validateTaxFilterParams(params)
  if (err) return apiError(c, 400, err)

  const result = getFilteredTaxCategories(params)
  return c.json({
    items: result.pagedItems,
    totalCount: result.totalCount,
    page: result.page,
    totalPages: result.totalPages,
  })
})

// ============================================================
// PUT /master — マスタ税区分全件上書き保存
// ============================================================
app.put('/master', async (c) => {
  const body = await c.req.json<{ taxCategories?: TaxCategory[] }>()
  const err = validateTaxCategoriesBody(body)
  if (err) return apiError(c, 400, err)

  const result = saveAllTaxCategories(body.taxCategories!)
  return c.json(result)
})

// ============================================================
// GET /client/:clientId — 顧問先税区分一覧取得
// ============================================================
app.get('/client/:clientId', (c) => {
  const clientId = c.req.param('clientId')
  if (!clientId) return apiError(c, 400, 必須('clientId'))

  const params = parseTaxFilterParams(c)
  const err = validateTaxFilterParams(params)
  if (err) return apiError(c, 400, err)

  const result = getFilteredClientTaxCategories(clientId, params)
  return c.json({
    items: result.pagedItems,
    totalCount: result.totalCount,
    page: result.page,
    totalPages: result.totalPages,
  })
})

// ============================================================
// PUT /client/:clientId — 顧問先税区分全件上書き保存
// ============================================================
app.put('/client/:clientId', async (c) => {
  const clientId = c.req.param('clientId')
  if (!clientId) return apiError(c, 400, 必須('clientId'))

  const body = await c.req.json<{ taxCategories?: TaxCategory[] }>()
  const err = validateTaxCategoriesBody(body)
  if (err) return apiError(c, 400, err)

  const result = saveClientTaxCategories(clientId, body.taxCategories!)
  return c.json(result)
})

export default app
