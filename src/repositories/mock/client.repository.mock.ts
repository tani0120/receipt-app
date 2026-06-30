/**
 * client.repository.mock.ts — ClientRepositoryモック実装
 *
 * 【責務】
 * - clientsApi.ts（共通データアクセス層）をClientRepositoryインターフェースでラップ
 * - 全メソッドはPromise<T>で統一（Supabase移行時にシグネチャ変更不要）
 *
 * 【list()のフィルタ・ソート・ページネーション】
 * clientListService.tsから統合（2026-06-30 循環参照解消）
 * Supabase移行時: SELECT ... JOIN staff ... WHERE ... ORDER BY ... LIMIT に差し替え
 *
 * 【依存方向】
 * ClientRepository → clientsApi / staffsApi（正しい方向）
 *
 * 準拠: DL-030, DL-042
 */

import {
  getAll,
  getById,
  getByStaffId,
  getActiveClients,
  create,
  updateClient,
  generateClientId as genClientId,
  getByThreeCode as getByThreeCodeStore,
  getByStatus as getByStatusStore,
} from '../../api/services/clientsApi'
import { applyFilterConditions } from '../../api/helpers/applyFilterConditions'
import type { FilterCondition } from '../../api/helpers/applyFilterConditions'
import type { ClientRepository } from '../types'
import type { Client } from '../types'

// ────────────────────────────────────────────
// UIキー → モデルプロパティ マッピング（clientListServiceから移植）
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

export const mockClientRepo: ClientRepository = {
  getAll: async () => getAll(),
  getById: async (clientId) => getById(clientId),
  getByStaffId: async (staffId) => getByStaffId(staffId),
  getActiveClients: async () => getActiveClients(),
  create: async (client) => create(client),
  update: async (clientId, partial) => { updateClient(clientId, partial) },

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
        const filteredIds = new Set(filteredExpanded.map(r => r.clientId))
        rows = rows.filter(r => filteredIds.has(r.clientId))
      } else {
        rows = applyFilterConditions(rows as unknown as Record<string, unknown>[], mappedFilters, query.logic ?? 'and') as unknown as Client[]
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
        if (sd.key === 'clientId') {
          const na = parseInt(a.clientId.split('-').pop() || '0', 10)
          const nb = parseInt(b.clientId.split('-').pop() || '0', 10)
          cmp = na - nb
        } else if (resolvedKey.startsWith('custom_')) {
          const va = String((a.extraFields ?? {})[resolvedKey] ?? '')
          const vb = String((b.extraFields ?? {})[resolvedKey] ?? '')
          cmp = va.localeCompare(vb, 'ja')
        } else {
          const key = resolvedKey as keyof Client
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

  getByThreeCode: async (code) => getByThreeCodeStore(code),
  getByStatus: async (status) => getByStatusStore(status),
  generateClientId: async () => genClientId(),
  bulkCreate: async (items) => {
    const results: { index: number; ok: boolean; clientId?: string; threeCode?: string; companyName?: string; error?: string }[] = []
    for (let i = 0; i < items.length; i++) {
      try {
        const item = { ...items[i]!, clientId: genClientId() }
        const saved = create(item as unknown as Client)
        results.push({ index: i, ok: true, clientId: saved.clientId, threeCode: saved.threeCode, companyName: saved.companyName })
      } catch (err) {
        results.push({ index: i, ok: false, error: String(err) })
      }
    }
    return { ok: true, results, total: items.length }
  },
}
