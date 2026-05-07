/**
 * progressListService.ts — 進捗一覧サービス（API側）
 *
 * MockProgressDetailPage.vue の filteredRows / pagedRows computed ロジックをAPI側に移植。
 * staffListService.ts と同じパターン（filter → sort → paginate）。
 *
 * ★重要: composable（useClients等）を使わず、store（clientStore等）から直接取得。
 *   理由: サーバー側ではVueリアクティブシステムが不要であり、
 *         composableは@/パスエイリアスの依存チェーンを引き込むため。
 *
 * Supabase移行時: store呼び出しを SELECT ... JOIN ... WHERE ... ORDER BY に差し替えるだけ。
 */

import { getAll as getAllClients } from './clientStore'
import { getAll as getAllStaff } from './staffStore'
import { getDocuments } from './documentStore'
import { getJournals } from './journalStore'
import { countUnsorted, latestReceivedDate } from '../../utils/documentUtils'
import type { ProgressRow } from '../../features/progress-management/types'
import { applyFilterConditions } from '../helpers/applyFilterConditions'
import type { FilterCondition } from '../../components/list-view/types'

// ────────────────────────────────────────────
// 仕訳サマリ取得（useProgress.ts から移植）
// ────────────────────────────────────────────

interface JournalSummary {
  /** 未出力（仕訳残の件数） */
  unexported: number
  /** 月別仕訳数 キー: "2025-04" 形式 */
  monthlyJournals: Record<string, number>
  /** 今年度仕訳数 */
  currentYearJournals: number
  /** 前年度仕訳数 */
  lastYearJournals: number
}

/** journalStoreから仕訳サマリを集計 */
function buildJournalSummary(clientId: string, monthKeys: string[]): JournalSummary {
  const journals = getJournals(clientId)

  // 月別仕訳数を集計
  const monthlyJournals: Record<string, number> = {}
  monthKeys.forEach(k => { monthlyJournals[k] = 0 })

  const now = new Date()
  const currentYear = now.getFullYear()
  let currentYearCount = 0
  let lastYearCount = 0

  for (const j of journals) {
    const vd = (j as Record<string, unknown>).voucher_date as string | null | undefined
    if (!vd) continue
    const dateStr = vd.slice(0, 7) // "2025-04"
    if (dateStr in monthlyJournals) {
      monthlyJournals[dateStr] = (monthlyJournals[dateStr] ?? 0) + 1
    }
    const year = parseInt(vd.slice(0, 4), 10)
    if (year === currentYear) currentYearCount++
    else if (year === currentYear - 1) lastYearCount++
  }

  // 未出力（exported=false かつ export_batch_id=null）
  const unexported = journals.filter(j => {
    const rec = j as Record<string, unknown>
    return !rec.exported && !rec.export_batch_id
  }).length

  return {
    unexported,
    monthlyJournals,
    currentYearJournals: currentYearCount,
    lastYearJournals: lastYearCount,
  }
}

// ────────────────────────────────────────────
// progressRows 生成（useProgress.ts progressRows computed から移植）
// ────────────────────────────────────────────

/** 直近N月の月キーを生成（"2025-04" 形式） */
function generateMonthKeys(count: number): string[] {
  const keys: string[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    keys.push(`${y}-${m}`)
  }
  return keys
}

/** 全顧問先のprogressRowsを生成（store直接取得） */
function buildProgressRows(): ProgressRow[] {
  const clientList = getAllClients()
  const docs = getDocuments() // 全件取得
  const monthKeys = generateMonthKeys(12)

  return clientList.map(c => {
    const summary = buildJournalSummary(c.clientId, monthKeys)
    const clientDocs = docs.filter(d => d.clientId === c.clientId)
    return {
      clientId: c.clientId,
      code: c.threeCode,
      status: c.status as 'active' | 'inactive' | 'suspension',
      type: c.type as 'corp' | 'individual',
      fiscalMonth: c.fiscalMonth,
      companyName: c.companyName,
      repName: c.repName || '',
      receivedDate: latestReceivedDate(clientDocs),
      unsorted: countUnsorted(clientDocs),
      unexported: summary.unexported,
      monthlyJournals: summary.monthlyJournals,
      currentYearJournals: summary.currentYearJournals,
      lastYearJournals: summary.lastYearJournals,
    }
  })
}


// ────────────────────────────────────────────
// クエリパラメータ（フロントからPOSTで送信）
// ────────────────────────────────────────────

export interface ProgressListQuery {
  /** 汎用フィルタ条件（FilterCondition[]） */
  filters?: FilterCondition[]
  /** 条件結合方式（デフォルト: 'and'） */
  logic?: 'and' | 'or'
  /** ソート設定（多段、優先順位順） */
  sorts?: { key: string; order: 'asc' | 'desc' }[]
  /** 旧: 顧問先検索文字列（後方互換） */
  searchQuery?: string
  /** 旧: 担当者フィルタ（後方互換） */
  filterStaff?: string
  /** 旧: 未出力がある顧問先のみ表示（後方互換） */
  filterUnexported?: boolean
  /** 旧: ソートキー（後方互換） */
  sortKey?: string | null
  /** 旧: ソート方向（後方互換） */
  sortOrder?: 'asc' | 'desc'
  /** ページ番号（1始まり） */
  page?: number
  /** ページサイズ */
  pageSize?: number
}

// ────────────────────────────────────────────
// API応答
// ────────────────────────────────────────────

export interface ProgressListResponse {
  rows: ProgressRow[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

// ────────────────────────────────────────────
// ソートロジック（MockProgressDetailPage.vue から移植）
// ────────────────────────────────────────────

/** ステータス → ソート優先度（active=0, suspension=1, inactive=2） */
const statusOrder = (s: string): number => s === 'active' ? 0 : s === 'suspension' ? 1 : 2

/** 決算月ソート値: 法人は月そのまま（1-12）、個人は13 */
const fiscalMonthSort = (row: ProgressRow): number => {
  if (row.type === 'individual') return 13
  return row.fiscalMonth
}

/** デフォルト多段ソート比較関数 */
const defaultSort = (a: ProgressRow, b: ProgressRow): number => {
  const sa = statusOrder(a.status) - statusOrder(b.status)
  if (sa !== 0) return sa
  if (a.unexported !== b.unexported) return b.unexported - a.unexported
  const aDate = a.receivedDate || '\uffff'
  const bDate = b.receivedDate || '\uffff'
  if (aDate !== bDate) return aDate < bDate ? -1 : 1
  return a.code < b.code ? -1 : a.code > b.code ? 1 : 0
}

/** ソート値取得（月列 "month_2025-04" 形式に対応） */
function getSortValue(row: ProgressRow, key: string): string | number {
  if (key.startsWith('month_')) {
    const monthKey = key.replace('month_', '')
    return row.monthlyJournals[monthKey] || 0
  }
  const val = (row as Record<string, unknown>)[key]
  return typeof val === 'string' || typeof val === 'number' ? val : ''
}

// ────────────────────────────────────────────
// 担当者名取得（store直接版）
// ────────────────────────────────────────────

function getStaffNameForClient(clientId: string): string {
  const clients = getAllClients()
  const client = clients.find(c => c.clientId === clientId)
  if (!client?.staffId) return ''
  const staffAll = getAllStaff()
  const staff = staffAll.find(s => s.uuid === client.staffId)
  return staff?.name || ''
}

// ────────────────────────────────────────────
// 統合一覧API（filter → sort → paginate）
// ────────────────────────────────────────────

export function getProgressList(query: ProgressListQuery): ProgressListResponse {
  // 1. 全progressRows生成
  let rows = buildProgressRows()

  // 2. フィルタ適用
  if (query.filters && query.filters.length > 0) {
    // clientStatus → status にマッピング（フロントはclientStatusで送信）
    const mappedFilters = query.filters.map(f => {
      if (f.field === 'clientStatus') return { ...f, field: 'status' }
      if (f.field === 'staffId') return null // 別途処理
      return f
    }).filter((f): f is FilterCondition => f !== null)

    // staffIdフィルタは別途処理（ProgressRowにstaffIdが無いため）
    const staffFilter = query.filters.find(f => f.field === 'staffId')
    if (staffFilter) {
      const staffIds = Array.isArray(staffFilter.value) ? staffFilter.value : [staffFilter.value]
      const clients = getAllClients()
      const clientIdSet = new Set(
        clients.filter(c => c.staffId && staffIds.includes(c.staffId)).map(c => c.clientId)
      )
      rows = rows.filter(r => clientIdSet.has(r.clientId))
    }

    if (mappedFilters.length > 0) {
      rows = applyFilterConditions(rows, mappedFilters, query.logic ?? 'and')
    }
  } else {
    // 旧パラメータによるフォールバック
    if (query.searchQuery?.trim()) {
      const q = query.searchQuery.trim().toLowerCase()
      rows = rows.filter(r =>
        r.companyName.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q)
      )
    }
    if (query.filterStaff) {
      rows = rows.filter(r => getStaffNameForClient(r.clientId) === query.filterStaff)
    }
    if (query.filterUnexported) {
      rows = rows.filter(r => r.unexported > 0)
    }
  }

  // 3. ソート（多段対応）
  const sortDefs = (query.sorts && query.sorts.length > 0)
    ? query.sorts
    : query.sortKey
      ? [{ key: query.sortKey, order: (query.sortOrder ?? 'asc') as 'asc' | 'desc' }]
      : null

  if (!sortDefs) {
    rows.sort(defaultSort)
  } else {
    rows.sort((a, b) => {
      for (const sd of sortDefs) {
        let cmp = 0
        if (sd.key === 'fiscalMonth') {
          cmp = fiscalMonthSort(a) - fiscalMonthSort(b)
        } else {
          const aVal = getSortValue(a, sd.key)
          const bVal = getSortValue(b, sd.key)
          cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        }
        if (cmp !== 0) return sd.order === 'asc' ? cmp : -cmp
      }
      return a.code < b.code ? -1 : a.code > b.code ? 1 : 0
    })
  }

  // 6. ページネーション
  const totalCount = rows.length
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 20
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
