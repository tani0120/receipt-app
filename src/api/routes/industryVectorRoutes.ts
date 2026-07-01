/**
 * industryVectorRoutes.ts — 業種ベクトルAPIルート（Hono）
 *
 * レイヤー: ★route★ → IndustryVectorRepository
 * 責務: リクエスト受付・バリデーション・レスポンス返却
 *
 * エンドポイント:
 *   GET  /api/industry-vectors?type=corporate|sole  — 業種ベクトル一覧
 *   PUT  /api/industry-vectors?type=corporate|sole  — 全件上書き保存
 *
 * 準拠: DL-042, Phase 2 Step 8
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { apiError, apiCatchError } from '../helpers/apiError'
import { createMockRepositories } from '../../repositories/mock'

const industryVectorRepo = createMockRepositories().industryVector

type BusinessType = 'corporate' | 'sole'

function parseType(raw: string | undefined): BusinessType | null {
  if (raw === 'corporate' || raw === 'sole') return raw
  return null
}

const industryVectorEntrySchema = z.object({
  vector: z.string(),
  expense: z.array(z.string()),
  income: z.array(z.string()),
})

const route = new Hono()
// GET / — 業種ベクトル一覧
.get('/', async (c) => {
  const type = parseType(c.req.query('type'))
  if (!type) {
    return apiError(c, 400, 'クエリパラメータ type=corporate|sole は必須です')
  }
  const entries = await industryVectorRepo.getAll(type)
  return c.json({ entries, count: entries.length, type })
})
// PUT / — 全件上書き保存
.put('/',
  zValidator('json', z.object({ entries: z.array(industryVectorEntrySchema) })),
  async (c) => {
  const type = parseType(c.req.query('type'))
  if (!type) {
    return apiError(c, 400, 'クエリパラメータ type=corporate|sole は必須です')
  }
  try {
    const body = c.req.valid('json')
    // IndustryVectorRepository.saveAll経由で保存
    const result = await industryVectorRepo.saveAll(type, body.entries as Parameters<typeof industryVectorRepo.saveAll>[1])
    return c.json(result)
  } catch (err) {
    return apiCatchError(c, err)
  }
});

export default route

