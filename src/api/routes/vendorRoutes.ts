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
import { apiError, apiCatchError } from '../helpers/apiError'
import { 未検出 } from '../../constants/apiMessages'
import { createMockRepositories } from '../../repositories/mock'
import { getVendorList } from '../services/vendorListService'

const vendorRepo = createMockRepositories().vendor
const app = new Hono()

// ============================================================
// POST /list — 取引先一覧（フィルタ+ソート+ページネーション）
// ============================================================
app.post('/list', async (c) => {
  const body = await c.req.json()
  const result = await getVendorList(body)
  return c.json(result)
})

// ============================================================
// GET / — 全件取得
// ============================================================
app.get('/', async (c) => {
  const type = c.req.query('type') // 'vendor' | 'non-vendor' | undefined（全件）
  let vendors
  if (type === 'vendor' || type === 'non-vendor') {
    vendors = await vendorRepo.getByType(type)
  } else {
    vendors = await vendorRepo.getAll()
  }
  return c.json({ vendors, count: vendors.length })
})

// ============================================================
// GET /:vendorId — 1件取得
// ============================================================
app.get('/:vendorId', async (c) => {
  const vendorId = c.req.param('vendorId')
  const allVendors = await vendorRepo.getAll()
  const vendor = allVendors.find(v => v.vendor_id === vendorId)
  if (!vendor) {
    return apiError(c, 404, 未検出('取引先'))
  }
  return c.json(vendor)
})

// ============================================================
// POST / — 新規追加
// ============================================================
app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const vendor = await vendorRepo.create(body)
    return c.json(vendor, 201)
  } catch (err) {
    return apiCatchError(c, err)
  }
})

// ============================================================
// PUT /:vendorId — 更新
// ============================================================
app.put('/:vendorId', async (c) => {
  const vendorId = c.req.param('vendorId')
  try {
    const body = await c.req.json()
    // TODO: VendorRepositoryにupdateメソッドを追加し、vendorStore直接呼び出しを廃止する
    const { update, getById } = await import('../services/vendorStore')
    const ok = update(vendorId, body)
    if (!ok) {
      return apiError(c, 404, 未検出('取引先'))
    }
    const updated = getById(vendorId)
    return c.json(updated)
  } catch (err) {
    return apiCatchError(c, err)
  }
})

// ============================================================
// DELETE /:vendorId — 削除
// ============================================================
app.delete('/:vendorId', async (c) => {
  const vendorId = c.req.param('vendorId')
  try {
    await vendorRepo.deleteById(vendorId)
    return c.json({ success: true, vendorId })
  } catch (err) {
    return apiCatchError(c, err)
  }
})

export default app
