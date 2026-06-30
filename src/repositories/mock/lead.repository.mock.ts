/**
 * lead.repository.mock.ts — LeadRepositoryモック実装（サーバー用）
 *
 * 【依存方向】
 * LeadRepository → leadStore / staffsApi（正しい方向）
 *
 * 【list()のフィルタ・ソート・ページネーション】
 * leadListService.tsから統合（2026-06-30 循環参照解消）
 * Supabase移行時: SELECT ... JOIN staff ... WHERE ... ORDER BY ... LIMIT に差し替え
 *
 * 準拠: DL-030, DL-042
 */

import {
  getAll,
  getById,
  create,
  updateLead,
  updateSharedFolderId,
  getActiveLeads,
  getByStatus,
  updateStaffAssignment,
  updateSharedEmail,
  generateLeadId,
  getByStaffId,
} from '../../api/services/leadStore'
import { applyFilterConditions } from '../../api/helpers/applyFilterConditions'
import type { FilterCondition } from '../../api/helpers/applyFilterConditions'
import type { LeadRepository, Lead } from '../types'

// ────────────────────────────────────────────
// UIキー → モデルプロパティ マッピング（leadListServiceから移植）
// ────────────────────────────────────────────

const FILTER_FIELD_MAP: Record<string, string> = {
  fiscalDate: 'fiscalMonth',
}

const SORT_KEY_MAP: Record<string, string> = {
}

function resolveFilterFields(conditions: FilterCondition[]): FilterCondition[] {
  return conditions.map(c => ({
    ...c,
    field: FILTER_FIELD_MAP[c.field] ?? c.field,
  }))
}

export const mockLeadRepo: LeadRepository = {
  getAll: async () => getAll(),
  getById: async (leadId) => getById(leadId),
  create: async (lead) => create(lead),
  update: async (leadId, partial) => { updateLead(leadId, partial) },
  updateSharedFolderId: async (leadId, folderId) => updateSharedFolderId(leadId, folderId),

  /**
   * フィルタ+ソート+ページネーション付き一覧取得（単一ドメインのみ）
   *
   * staffNameソートはRoute/Service層で staffRepo.getAll() と結合して行う。
   * Supabase移行時: SELECT ... WHERE ... ORDER BY ... LIMIT に差し替え
   */
  list: async (query) => {
    // 1. 全件取得
    let rows = [...getAll()]

    // 2. フィルタ適用（汎用フィルタエンジン）
    if (query.filters && query.filters.length > 0) {
      const mappedFilters = resolveFilterFields(query.filters)
      const hasCustomFilter = mappedFilters.some(f => f.field.startsWith('custom_'))
      if (hasCustomFilter) {
        const expandedRows = rows.map(r => ({ ...r, ...(r.extraFields ?? {}) }))
        const filteredExpanded = applyFilterConditions(expandedRows, mappedFilters, query.logic ?? 'and')
        const filteredIds = new Set(filteredExpanded.map(r => r.leadId))
        rows = rows.filter(r => filteredIds.has(r.leadId))
      } else {
        rows = applyFilterConditions(rows as unknown as Record<string, unknown>[], mappedFilters, query.logic ?? 'and') as unknown as Lead[]
      }
    }

    // 3. 多段ソート
    const sortDefs = (query.sorts && query.sorts.length > 0)
      ? query.sorts
      : [{ key: 'threeCode', order: 'asc' as const }]

    rows.sort((a, b) => {
      for (const sd of sortDefs) {
        let cmp = 0
        const resolvedKey = SORT_KEY_MAP[sd.key] ?? sd.key
        if (sd.key === 'leadId') {
          const na = parseInt(a.leadId.split('-').pop() || '0', 10)
          const nb = parseInt(b.leadId.split('-').pop() || '0', 10)
          cmp = na - nb
        } else if (resolvedKey.startsWith('custom_')) {
          const va = String((a.extraFields ?? {})[resolvedKey] ?? '')
          const vb = String((b.extraFields ?? {})[resolvedKey] ?? '')
          cmp = va.localeCompare(vb, 'ja')
        } else {
          const key = resolvedKey as keyof Lead
          const va = String(a[key] ?? '')
          const vb = String(b[key] ?? '')
          cmp = va.localeCompare(vb, 'ja')
        }
        if (cmp !== 0) return sd.order === 'asc' ? cmp : -cmp
      }
      return 0
    })

    // 4. ページネーション
    const totalCount = rows.length
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 50
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
    const start = (page - 1) * pageSize
    const paged = rows.slice(start, start + pageSize)

    return { rows: paged, totalCount, page, pageSize, totalPages }
  },

  getActiveLeads: async () => getActiveLeads(),
  getByStatus: async (status) => getByStatus(status as Parameters<typeof getByStatus>[0]),
  updateStaffAssignment: async (leadId, staffId) => updateStaffAssignment(leadId, staffId),
  updateSharedEmail: async (leadId, email) => updateSharedEmail(leadId, email),
  generateLeadId: async () => generateLeadId(),
  getByStaffId: async (staffId) => getByStaffId(staffId),
}
