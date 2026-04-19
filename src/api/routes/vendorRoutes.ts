/**
 * vendorRoutes.ts — 取引先JSON永続化APIルート（Hono）
 *
 * レイヤー: ★route★ → vendorStore
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
import * as vendorStore from '../services/vendorStore'

const app = new Hono()

// ============================================================
// GET / — 全件取得
// ============================================================
app.get('/', (c) => {
  const type = c.req.query('type') // 'vendor' | 'non-vendor' | undefined（全件）
  let vendors
  if (type === 'vendor') {
    vendors = vendorStore.getAll({ vendorOnly: true })
  } else if (type === 'non-vendor') {
    vendors = vendorStore.getAll({ nonVendorOnly: true })
  } else {
    vendors = vendorStore.getAll()
  }
  return c.json({ vendors, count: vendors.length })
})

// ============================================================
// GET /:vendorId — 1件取得
// ============================================================
app.get('/:vendorId', (c) => {
  const vendorId = c.req.param('vendorId')
  const vendor = vendorStore.getById(vendorId)
  if (!vendor) {
    return c.json({ error: '取引先が見つかりません', vendorId }, 404)
  }
  return c.json(vendor)
})

// ============================================================
// POST / — 新規追加
// ============================================================
app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const vendor = vendorStore.create(body)
    return c.json(vendor, 201)
  } catch (err) {
    return c.json({ error: '取引先の追加に失敗しました' }, 400)
  }
})

// ============================================================
// PUT /:vendorId — 更新
// ============================================================
app.put('/:vendorId', async (c) => {
  const vendorId = c.req.param('vendorId')
  try {
    const body = await c.req.json()
    const ok = vendorStore.update(vendorId, body)
    if (!ok) {
      return c.json({ error: '取引先が見つかりません', vendorId }, 404)
    }
    const updated = vendorStore.getById(vendorId)
    return c.json(updated)
  } catch (err) {
    return c.json({ error: '取引先の更新に失敗しました' }, 400)
  }
})

// ============================================================
// DELETE /:vendorId — 削除
// ============================================================
app.delete('/:vendorId', (c) => {
  const vendorId = c.req.param('vendorId')
  const ok = vendorStore.remove(vendorId)
  if (!ok) {
    return c.json({ error: '取引先が見つかりません', vendorId }, 404)
  }
  return c.json({ success: true, vendorId })
})

export default app
