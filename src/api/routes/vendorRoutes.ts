/**
 * vendorRoutes.ts — 取引先JSON永続化APIルート（Hono）
 *
 * レイヤー: ★route★ → VendorRepository
 * 責務: リクエスト受付・バリデーション・レスポンス返却
 *
 * エンドポイント:
 *   GET    /api/vendors             — 全取引先取得（?type=vendor|non-vendor フィルタ任意）
 *   GET    /api/vendors/:vendorId   — 1件取得
 *   POST   /api/vendors             — 取引先追加
 *   PUT    /api/vendors/:vendorId   — 取引先更新
 *   DELETE /api/vendors/:vendorId   — 取引先削除
 *
 * 準拠: DL-042
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { apiError, apiCatchError } from '../helpers/apiError'
import { 未検出 } from '../../constants/apiMessages'
import { createMockRepositories } from '../../repositories/mock'

const vendorRepo = createMockRepositories().vendor

/** Vendor専用zodスキーマ（vendor.type.ts Vendor型の主要フィールドに準拠） */
const vendorSchema = z.object({
  vendor_id: z.string().optional(),
  company_name: z.string(),
  match_key: z.string(),
  display_name: z.string().nullable().optional(),
  aliases: z.array(z.string()).optional(),
  t_numbers: z.array(z.string()).optional(),
  phone_numbers: z.array(z.string()).optional(),
  brand_id: z.string().optional(),
  address: z.string().nullable().optional(),
  vendor_vector: z.string().nullable().optional(),
  non_vendor_type: z.string().nullable().optional(),
  source_category: z.enum(['bank', 'credit', 'all']).nullable().optional(),
  level: z.enum(['A', 'B', 'insufficient']).nullable().optional(),
  direction: z.enum(['expense', 'income']).nullable().optional(),
  amount_threshold: z.number().nullable().optional(),
  debit_account: z.string().nullable().optional(),
  debit_account_over: z.string().nullable().optional(),
  debit_sub_account: z.string().nullable().optional(),
  debit_tax_category: z.string().nullable().optional(),
  credit_account: z.string().nullable().optional(),
  credit_sub_account: z.string().nullable().optional(),
  credit_tax_category: z.string().nullable().optional(),
}).passthrough()  // 残りの仕訳テンプレートフィールド等を許容

/** Vendor部分更新用スキーマ */
const vendorPartialSchema = vendorSchema.partial()

/** POST /list のリクエストbody */
const listQuerySchema = z.object({
  filters: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.union([z.string(), z.array(z.string())]),
  })).optional(),
  logic: z.enum(['and', 'or']).optional(),
  sorts: z.array(z.object({
    key: z.string(),
    order: z.enum(['asc', 'desc']),
  })).optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
  searchText: z.string().optional(),
  typeFilter: z.string().optional(),
}).passthrough()

const route = new Hono()
// POST /list — 取引先一覧（フィルタ+ソート+ページネーション）
.post('/list',
  zValidator('json', listQuerySchema),
  async (c) => {
  const body = c.req.valid('json')
  const result = await vendorRepo.list(body)
  return c.json(result)
})
// GET / — 全件取得
.get('/', async (c) => {
  const type = c.req.query('type') // 'vendor' | 'non-vendor' | undefined（全件）
  let vendors
  if (type === 'vendor' || type === 'non-vendor') {
    vendors = await vendorRepo.getByType(type)
  } else {
    vendors = await vendorRepo.getAll()
  }
  return c.json({ vendors, count: vendors.length })
})
// GET /:vendorId — 1件取得
.get('/:vendorId', async (c) => {
  const vendorId = c.req.param('vendorId')
  const allVendors = await vendorRepo.getAll()
  const vendor = allVendors.find(v => v.vendor_id === vendorId)
  if (!vendor) {
    return apiError(c, 404, 未検出('取引先'))
  }
  return c.json(vendor)
})
// POST / — 新規追加
.post('/',
  zValidator('json', vendorSchema),
  async (c) => {
  try {
    const body = c.req.valid('json')
    const vendor = await vendorRepo.create(body as Parameters<typeof vendorRepo.create>[0])
    return c.json(vendor, 201)
  } catch (err) {
    return apiCatchError(c, err)
  }
})
// PUT /:vendorId — 更新
.put('/:vendorId',
  zValidator('json', vendorPartialSchema),
  async (c) => {
  const vendorId = c.req.param('vendorId')
  try {
    const body = c.req.valid('json')
    const ok = await vendorRepo.update(vendorId, body as Parameters<typeof vendorRepo.update>[1])
    if (!ok) {
      return apiError(c, 404, 未検出('取引先'))
    }
    const updated = await vendorRepo.getById(vendorId)
    return c.json(updated)
  } catch (err) {
    return apiCatchError(c, err)
  }
})
// DELETE /:vendorId — 削除
.delete('/:vendorId', async (c) => {
  const vendorId = c.req.param('vendorId')
  try {
    await vendorRepo.deleteById(vendorId)
    return c.json({ success: true, vendorId })
  } catch (err) {
    return apiCatchError(c, err)
  }
});

export default route
