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
      monthlyJournals[dateStr]++
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

function emptyJournalSummary(monthKeys: string[]): JournalSummary {
  const monthlyJournals: Record<string, number> = {}
  monthKeys.forEach(k => { monthlyJournals[k] = 0 })
  return { unexported: 0, monthlyJournals, currentYearJournals: 0, lastYearJournals: 0 }
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
  /** 顧問先検索文字列（会社名 or 3コード部分一致） */
  searchQuery?: string
  /** 担当者フィルタ（担当者名完全一致） */
  filterStaff?: string
  /** 未出力がある顧問先のみ表示 */
  filterUnexported?: boolean
  /** ソートキー（null=デフォルト多段ソート） */
  sortKey?: string | null
  /** ソート方向 */
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
  // 1. ステータス: active→suspension→inactive
  const sa = statusOrder(a.status) - statusOrder(b.status)
  if (sa !== 0) return sa
  // 2. 未出力: 降順（多い順）
  if (a.unexported !== b.unexported) return b.unexported - a.unexported
  // 3. 資料受取日: 昇順（古い順、空白は最後）
  const aDate = a.receivedDate || '\uffff'
  const bDate = b.receivedDate || '\uffff'
  if (aDate !== bDate) return aDate < bDate ? -1 : 1
  // 4. 3コード: 昇順
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

  // 2. フィルタ: 顧問先検索
  if (query.searchQuery?.trim()) {
    const q = query.searchQuery.trim().toLowerCase()
    rows = rows.filter(r =>
      r.companyName.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q)
    )
  }

  // 3. フィルタ: 担当者
  if (query.filterStaff) {
    rows = rows.filter(r => getStaffNameForClient(r.clientId) === query.filterStaff)
  }

  // 4. フィルタ: 未出力のみ
  if (query.filterUnexported) {
    rows = rows.filter(r => r.unexported > 0)
  }

  // 5. ソート
  if (!query.sortKey) {
    // デフォルト多段ソート
    rows.sort(defaultSort)
  } else if (query.sortKey === 'fiscalMonth') {
    // 決算月ソート: 法人1-12、個人13
    const order = query.sortOrder ?? 'asc'
    rows.sort((a, b) => {
      const aVal = fiscalMonthSort(a)
      const bVal = fiscalMonthSort(b)
      const cmp = aVal - bVal
      const primary = order === 'asc' ? cmp : -cmp
      if (primary !== 0) return primary
      return a.code < b.code ? -1 : a.code > b.code ? 1 : 0
    })
  } else {
    // 通常ソート
    const order = query.sortOrder ?? 'asc'
    const key = query.sortKey
    rows.sort((a, b) => {
      const aVal = getSortValue(a, key)
      const bVal = getSortValue(b, key)
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      const primary = order === 'asc' ? cmp : -cmp
      if (primary !== 0) return primary
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
