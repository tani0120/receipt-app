/**
 * IndustryVectorRepository Supabase実装（DL-032）
 *
 * industry_vectorsテーブルへのCRUD（フラット形式 → プロパティ方式に変換）。
 * データアクセスのみ。ロジックなし。
 *
 * 準拠: pipeline_design_master.md DL-030, DL-032
 */

import { getSupabase } from '@/lib/supabase'
import type { IndustryVectorRepository } from '@/repositories/types'
import type { IndustryVectorEntry, VendorVector } from '@/mocks/types/pipeline/vendor.type'

/**
 * DB行（フラット形式）→ IndustryVectorEntry（プロパティ方式）に集約
 *
 * DB: [{ vector: 'taxi', direction: 'expense', account: 'TRAVEL' }]
 * TS: [{ vector: 'taxi', expense: ['TRAVEL'], income: [] }]
 */
function aggregateRows(
  rows: Array<{ vector: string; direction: string; account: string }>
): IndustryVectorEntry[] {
  const map = new Map<string, IndustryVectorEntry>()

  for (const row of rows) {
    let entry = map.get(row.vector)
    if (!entry) {
      entry = { vector: row.vector as VendorVector, expense: [], income: [] }
      map.set(row.vector, entry)
    }
    if (row.direction === 'expense') {
      entry.expense.push(row.account)
    } else if (row.direction === 'income') {
      entry.income.push(row.account)
    }
  }

  return Array.from(map.values())
}

export const supabaseIndustryVectorRepo: IndustryVectorRepository = {
  async getAll(_businessType: 'corporate' | 'sole'): Promise<IndustryVectorEntry[]> {
    // 現時点ではbusinessTypeによる分岐なし（法人/個人で同一辞書）
    // フェーズ5で分岐が必要になったらbusiness_typeカラムを追加
    const { data, error } = await getSupabase()
      .from('industry_vectors')
      .select('vector, direction, account')
      .order('sort_order')

    if (error) throw new Error(`[IndustryVectorRepository] getAll失敗: ${error.message}`)
    return aggregateRows(data ?? [])
  },

  async findByVector(
    _businessType: 'corporate' | 'sole',
    vector: VendorVector
  ): Promise<IndustryVectorEntry | undefined> {
    const { data, error } = await getSupabase()
      .from('industry_vectors')
      .select('vector, direction, account')
      .eq('vector', vector)
      .order('sort_order')

    if (error) throw new Error(`[IndustryVectorRepository] findByVector失敗: ${error.message}`)
    if (!data || data.length === 0) return undefined

    const entries = aggregateRows(data)
    return entries[0]
  },
}
