/**
 * clientListService.ts — 顧問先一覧サービス（API側）
 *
 * MockMasterClientsPage.vue の filteredRows computed ロジックをAPI側に移植。
 * staffListService.ts と同じパターン。
 *
 * 特殊ソート: staffName（staffIdからスタッフ名を解決してソート）、clientId（数字部分のみ数値ソート）
 *
 * Supabase移行時: getAll() を JOIN ... WHERE ... ORDER BY に差し替えるだけ。
 */

import { getAll } from './clientStore'
import { getAll as getAllStaff } from './staffStore'
import type { Client } from '../../repositories/types'
import { applyFilterConditions } from '../helpers/applyFilterConditions'
import type { FilterCondition } from '../helpers/applyFilterConditions'

// ────────────────────────────────────────────
// クエリパラメータ
// ────────────────────────────────────────────

export interface ClientListQuery {
  /** 汎用フィルタ条件（FilterCondition[]） */
  filters?: FilterCondition[]
  /** 条件結合方式（デフォルト: 'and'） */
  logic?: 'and' | 'or'
  /** 旧: ステータスフィルタ（後方互換。filtersが空の場合のフォールバック） */
  statusFilters?: string[]
  /** ソート設定（多段、優先順位順） */
  sorts?: { key: string; order: 'asc' | 'desc' }[]
  /** 旧: ソートキー（後方互換。sortsが空の場合のフォールバック） */
  sortKey?: string
  /** 旧: ソート方向 */
  sortOrder?: 'asc' | 'desc'
  /** ページ番号 */
  page?: number
  /** ページサイズ */
  pageSize?: number
}

// ────────────────────────────────────────────
// API応答
// ────────────────────────────────────────────

export interface ClientListResponse {
  rows: Client[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

// ────────────────────────────────────────────
// UIキー → モデルプロパティ マッピング
// ────────────────────────────────────────────

/**
 * フィルタ用キーマッピング
 * clientFieldDefs.tsのkey（UI側）と Client型のプロパティ名が異なるケースを解消
 */
const FILTER_FIELD_MAP: Record<string, string> = {
  fiscalDate: 'fiscalMonth',        // fieldDefsのkey='fiscalDate' → Client.fiscalMonth
}

/**
 * ソート用キーマッピング
 * staffName / clientId は特殊処理があるためマッピング対象外
 */
const SORT_KEY_MAP: Record<string, string> = {
}

/**
 * フィルタ条件のfield名をモデルプロパティ名にマッピング
 * progressListService.ts のmappedFiltersパターンと同一
 */
function resolveFilterFields(conditions: FilterCondition[]): FilterCondition[] {
  return conditions.map(c => ({
    ...c,
    field: FILTER_FIELD_MAP[c.field] ?? c.field,
  }))
}

// ────────────────────────────────────────────
// 統合一覧API
// ────────────────────────────────────────────

export function getClientList(query: ClientListQuery): ClientListResponse {
  // 1. 全件取得
  let rows = [...getAll()]

  // 2. フィルタ適用（汎用フィルタエンジン）
  if (query.filters && query.filters.length > 0) {
    // UIキー → モデルプロパティのマッピング（不整合解消）
    const mappedFilters = resolveFilterFields(query.filters)
    // カスタムフィールド(custom_*)はextraFieldsから展開してフィルタ対象にする
    const hasCustomFilter = mappedFilters.some(f => f.field.startsWith('custom_'))
    if (hasCustomFilter) {
      const expandedRows = rows.map(r => ({ ...r, ...(r.extraFields ?? {}) }))
      const filteredExpanded = applyFilterConditions(expandedRows, mappedFilters, query.logic ?? 'and')
      const filteredIds = new Set(filteredExpanded.map(r => r.clientId))
      rows = rows.filter(r => filteredIds.has(r.clientId))
    } else {
      rows = applyFilterConditions(rows as unknown as Record<string, unknown>[], mappedFilters, query.logic ?? 'and') as unknown as Client[]
    }
  } else if (query.statusFilters && query.statusFilters.length > 0) {
    // 後方互換: 旧statusFiltersパラメータ
    rows = rows.filter(r => query.statusFilters!.includes(r.status))
  }

  // 3. 多段ソート
  // sorts配列が渡された場合はそちらを優先、なければ旧sortKey/sortOrderをフォールバック
  const sortDefs = (query.sorts && query.sorts.length > 0)
    ? query.sorts
    : [{ key: query.sortKey ?? 'threeCode', order: query.sortOrder ?? 'asc' }]

  // staffName用のスタッフマップ（必要時のみ生成）
  let staffMap: Map<string, string> | null = null
  if (sortDefs.some(s => s.key === 'staffId')) {
    const staffAll = getAllStaff()
    staffMap = new Map(staffAll.map(s => [s.uuid, s.name]))
  }

  rows.sort((a, b) => {
    for (const sd of sortDefs) {
      let cmp = 0
      // ソートキーのマッピング（UIキー → モデルプロパティ）
      const resolvedKey = SORT_KEY_MAP[sd.key] ?? sd.key
      if (sd.key === 'staffId') {
        const sa = (a.staffId ? staffMap!.get(a.staffId) : '') ?? ''
        const sb = (b.staffId ? staffMap!.get(b.staffId) : '') ?? ''
        cmp = sa.localeCompare(sb, 'ja')
      } else if (sd.key === 'clientId') {
        const na = parseInt(a.clientId.split('-').pop() || '0', 10)
        const nb = parseInt(b.clientId.split('-').pop() || '0', 10)
        cmp = na - nb
      } else if (resolvedKey.startsWith('custom_')) {
        // カスタムフィールドはextraFieldsから取得
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

  return {
    rows: paged,
    totalCount,
    page,
    pageSize,
    totalPages,
  }
}

