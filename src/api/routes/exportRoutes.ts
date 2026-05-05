/**
 * exportRoutes.ts — 仕訳出力一覧APIルート
 *
 * T-31-7: MockExportPage.vueのフロントロジックをAPI化
 *
 * POST /api/export/list — 仕訳出力一覧取得（フィルタ/ソート/ページネーション/集計）
 */

import { Hono } from 'hono'
import { getExportList, getExportDetail } from '../services/exportListService'
import type { ExportListQuery, ExportDetailQuery } from '../services/exportListService'

const app = new Hono()

/**
 * POST /api/export/list
 *
 * リクエストボディ:
 *   clientId, showTargetOnly, showExcluded, showWarnings,
 *   debitAccountFilter, creditAccountFilter,
 *   sortKey, sortDir, page, pageSize
 *
 * レスポンス:
 *   rows, totalCount, totalPages, page, pageSize,
 *   filteredJournalCount, totalAmount, accountNames
 */
app.post('/list', async (c) => {
  const body = await c.req.json<ExportListQuery>()
  if (!body.clientId) {
    return c.json({ error: 'clientIdは必須です' }, 400)
  }
  const result = getExportList(body)
  return c.json(result)
})

export const exportRoutes = app

/**
 * POST /api/export/detail
 * T-31-9: 出力詳細（historyId別仕訳一覧）
 */
app.post('/detail', async (c) => {
  const body = await c.req.json<ExportDetailQuery>()
  if (!body.clientId || !body.historyId) {
    return c.json({ error: 'clientIdとhistoryIdは必須です' }, 400)
  }
  const result = getExportDetail(body)
  return c.json(result)
})
