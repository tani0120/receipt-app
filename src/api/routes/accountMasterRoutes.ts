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
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { apiError } from '../helpers/apiError'
import { 必須 } from '../../constants/apiMessages'
import { createMockRepositories } from '../../repositories/mock'
import type { Account } from '../../types/shared-account'

/** Account専用zodスキーマ（shared-account.ts Account型に準拠） */
const accountSchema = z.object({
  accountId: z.string(),
  name: z.string(),
  sub: z.string().optional(),
  target: z.enum(['corp', 'individual']),
  accountGroup: z.enum(['BS_ASSET', 'BS_LIABILITY', 'BS_EQUITY', 'PL_REVENUE', 'PL_EXPENSE']),
  category: z.string(),
  defaultTaxCategoryId: z.string().optional(),
  hidden: z.boolean(),
  effectiveFrom: z.string().nullable(),
  effectiveTo: z.string().nullable(),
  sortOrder: z.number(),
  source: z.enum(['mcp', 'client-custom']).optional(),
  isCustom: z.boolean().optional(),
  insertAfter: z.string().optional(),
  subAccount: z.string().optional(),
  isContraRevenue: z.boolean().optional(),
  isContraExpense: z.boolean().optional(),
  mfAccountId: z.string().nullable().optional(),
  mfAccountGroup: z.string().nullable().optional(),
  mfFinancialStatementType: z.string().nullable().optional(),
}).passthrough()  // 将来追加フィールドを許容

const accountMasterRepo = createMockRepositories().accountMaster

// 共通バリデーションヘルパー
function parseFilterParams(c: { req: { query: (key: string) => string | undefined } }) {
  const rawBt = c.req.query('businessType')
  const businessType = rawBt ? rawBt as 'corp' | 'individual' : undefined
  const search = c.req.query('search') ?? ''
  const page = Number(c.req.query('page') ?? '1')
  const pageSize = Number(c.req.query('pageSize') ?? '50')
  return { businessType, search, page, pageSize }
}

function validateFilterParams(params: { businessType?: string; page: number; pageSize: number }) {
  if (params.businessType && !['corp', 'individual'].includes(params.businessType)) {
    return 'businessType は corp / individual のいずれかを指定してください'
  }
  if (isNaN(params.page) || params.page < 1) {
    return 'page は1以上の数値を指定してください'
  }
  if (isNaN(params.pageSize) || params.pageSize < 1 || params.pageSize > 500) {
    return 'pageSize は1〜500の数値を指定してください'
  }
  return null
}

function validateAccountsBody(body: { accounts?: Account[] }): string | null {
  if (!body.accounts || !Array.isArray(body.accounts)) {
    return 'accounts 配列が必要です'
  }
  for (const acc of body.accounts) {
    if (!acc.accountId || !acc.name) {
      return `科目にaccountId/nameが必要です: ${JSON.stringify(acc).slice(0, 100)}`
    }
  }
  return null
}

const route = new Hono()
// GET /master
.get('/master', async (c) => {
  const params = parseFilterParams(c)
  const err = validateFilterParams(params)
  if (err) return apiError(c, 400, err)

  const result = await accountMasterRepo.getFilteredMaster(params)
  return c.json({
    items: result.pagedItems,
    totalCount: result.totalCount,
    page: result.page,
    totalPages: result.totalPages,
  })
})
// PUT /master
.put('/master',
  zValidator('json', z.object({ accounts: z.array(accountSchema) })),
  async (c) => {
  const body = c.req.valid('json')
  const err = validateAccountsBody(body as { accounts?: Account[] })
  if (err) return apiError(c, 400, err)

  const result = await accountMasterRepo.saveMaster(body.accounts as Account[])
  return c.json(result)
})
// GET /client/:clientId
.get('/client/:clientId', async (c) => {
  const clientId = c.req.param('clientId')
  if (!clientId) return apiError(c, 400, 必須('clientId'))

  const params = parseFilterParams(c)
  const err = validateFilterParams(params)
  if (err) return apiError(c, 400, err)

  const result = await accountMasterRepo.getFilteredClient(clientId, params)
  const subAccountsMap = await accountMasterRepo.getClientSubAccounts(clientId)
  const departments = await accountMasterRepo.getClientDepartments(clientId)
  return c.json({
    items: result.pagedItems,
    totalCount: result.totalCount,
    page: result.page,
    totalPages: result.totalPages,
    subAccountsMap,
    departments,
  })
})
// PUT /client/:clientId
.put('/client/:clientId',
  zValidator('json', z.object({ accounts: z.array(accountSchema) })),
  async (c) => {
  const clientId = c.req.param('clientId')
  if (!clientId) return apiError(c, 400, 必須('clientId'))

  const body = c.req.valid('json')
  const err = validateAccountsBody(body as { accounts?: Account[] })
  if (err) return apiError(c, 400, err)

  const result = await accountMasterRepo.saveClient(clientId, { accounts: body.accounts as Account[] })
  return c.json(result)
})

export default route
