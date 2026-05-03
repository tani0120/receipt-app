/**
 * accountMasterRoutes.ts — 勘定科目APIルート（Hono）
 *
 * レイヤー: ★route★ → accountMasterStore
 * 責務: リクエスト受付・クエリパラメータ解析・レスポンス返却
 *
 * エンドポイント:
 *   GET  /api/accounts/master             — マスタ科目一覧取得
 *   PUT  /api/accounts/master             — マスタ科目全件上書き保存
 *   GET  /api/accounts/client/:clientId   — 顧問先科目一覧取得
 *   PUT  /api/accounts/client/:clientId   — 顧問先科目全件上書き保存
 *
 * 準拠: DL-042, Phase 2 Step 2-3
 */

import { Hono } from 'hono'
import { apiError } from '../helpers/apiError'
import { 必須 } from '../helpers/apiMessages'
import {
  getFilteredAccounts,
  saveAllAccounts,
  getFilteredClientAccounts,
  saveClientAccounts,
} from '../services/accountMasterStore'
import type { Account } from '../../shared/types/account'

const app = new Hono()

// ============================================================
// 共通バリデーションヘルパー
// ============================================================

function parseFilterParams(c: { req: { query: (key: string) => string | undefined } }) {
  const businessType = (c.req.query('businessType') ?? 'corp') as 'corp' | 'individual' | 'realEstate'
  const search = c.req.query('search') ?? ''
  const page = Number(c.req.query('page') ?? '1')
  const pageSize = Number(c.req.query('pageSize') ?? '50')
  return { businessType, search, page, pageSize }
}

function validateFilterParams(params: { businessType: string; page: number; pageSize: number }) {
  if (!['corp', 'individual', 'realEstate'].includes(params.businessType)) {
    return 'businessType は corp / individual / realEstate のいずれかを指定してください'
  }
  if (isNaN(params.page) || params.page < 1) {
    return 'page は1以上の数値を指定してください'
  }
  if (isNaN(params.pageSize) || params.pageSize < 1 || params.pageSize > 200) {
    return 'pageSize は1〜200の数値を指定してください'
  }
  return null
}

function validateAccountsBody(body: { accounts?: Account[] }): string | null {
  if (!body.accounts || !Array.isArray(body.accounts)) {
    return 'accounts 配列が必要です'
  }
  for (const acc of body.accounts) {
    if (!acc.id || !acc.name) {
      return `科目にid/nameが必要です: ${JSON.stringify(acc).slice(0, 100)}`
    }
  }
  return null
}

// ============================================================
// GET /master — マスタ科目一覧取得（フィルタ・ソート・ページネーション）
// ============================================================
app.get('/master', (c) => {
  const params = parseFilterParams(c)
  const err = validateFilterParams(params)
  if (err) return apiError(c, 400, err)

  const result = getFilteredAccounts(params)
  return c.json({
    items: result.pagedItems,
    totalCount: result.totalCount,
    page: result.page,
    totalPages: result.totalPages,
  })
})

// ============================================================
// PUT /master — マスタ科目全件上書き保存
// ============================================================
app.put('/master', async (c) => {
  const body = await c.req.json<{ accounts?: Account[] }>()
  const err = validateAccountsBody(body)
  if (err) return apiError(c, 400, err)

  const result = saveAllAccounts(body.accounts!)
  return c.json(result)
})

// ============================================================
// GET /client/:clientId — 顧問先科目一覧取得
// ============================================================
app.get('/client/:clientId', (c) => {
  const clientId = c.req.param('clientId')
  if (!clientId) return apiError(c, 400, 必須('clientId'))

  const params = parseFilterParams(c)
  const err = validateFilterParams(params)
  if (err) return apiError(c, 400, err)

  const result = getFilteredClientAccounts(clientId, params)
  return c.json({
    items: result.pagedItems,
    totalCount: result.totalCount,
    page: result.page,
    totalPages: result.totalPages,
  })
})

// ============================================================
// PUT /client/:clientId — 顧問先科目全件上書き保存（subAccounts含む）
// ============================================================
app.put('/client/:clientId', async (c) => {
  const clientId = c.req.param('clientId')
  if (!clientId) return apiError(c, 400, 必須('clientId'))

  const body = await c.req.json<{
    accounts?: Account[]
    subAccounts?: Record<string, string>
  }>()
  const err = validateAccountsBody(body)
  if (err) return apiError(c, 400, err)

  const result = saveClientAccounts(clientId, body.accounts!, body.subAccounts)
  return c.json(result)
})

export default app
