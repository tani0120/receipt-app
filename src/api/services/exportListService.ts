/**
 * exportListService.ts — 仕訳出力一覧サービス（サーバー側）
 *
 * T-31-7: MockExportPage.vue の allRows / filteredRows / sortedRows / pagedRows / totalAmount
 * をサーバー側に移植。
 *
 * 責務:
 *   1. journalStoreから仕訳取得
 *   2. 顧問先科目/税区分名を解決
 *   3. 複合仕訳を行展開（ExportRow[]）
 *   4. セグメントフィルタ + 科目フィルタ
 *   5. ソート
 *   6. ページネーション
 *   7. 合計金額集計
 *
 * Supabase移行時: getJournals → supabase.from('journals').select()
 */

import { createMockRepositories } from '../../repositories/mock'
import type { Journal as _Journal } from '../../types/journal.type'
const repos = createMockRepositories()
const journalRepo = repos.journal
const exportHistoryRepo = repos.exportHistory
const accountMasterRepo = repos.accountMaster
const taxMasterRepo = repos.taxMaster

// ━━━ 除外ラベル定義（exportMfCsv.ts と同一） ━━━
const EXCLUDE_LABELS = [
  'DEBIT_CREDIT_MISMATCH', 'DATE_UNKNOWN', 'ACCOUNT_UNKNOWN', 'AMOUNT_UNCLEAR',
  'DUPLICATE_CONFIRMED', 'MULTIPLE_VOUCHERS',
  'DUPLICATE_SUSPECT', 'FUTURE_DATE', 'UNREADABLE_ESTIMATED', 'MEMO_DETECTED',
  'CATEGORY_CONFLICT', 'TAX_UNKNOWN', 'DESCRIPTION_UNKNOWN', 'VOUCHER_TYPE_CONFLICT',
  'TAX_ACCOUNT_MISMATCH',
  'NEED_DOCUMENT', 'NEED_INFO', 'REMINDER', 'NEED_CONSULT',
  'EXPORT_EXCLUDE',
] as const

// ━━━ 型定義 ━━━

/** 出力一覧の1行（複合仕訳展開後） */
export interface ExportRow {
  id: string
  qualified: string
  date: string
  description: string
  debitAccount: string
  debitSub: string
  debitDept: string
  debitTax: string
  debitAmount: number | null
  creditAccount: string
  creditSub: string
  creditDept: string
  creditTax: string
  creditAmount: number | null
  vendorName: string
  memo: string
  importDate: string
  isExcluded: boolean
  isWarning: boolean
  isExported: boolean
}

/** クエリパラメータ */
export interface ExportListQuery {
  clientId: string
  showTargetOnly?: boolean
  showExcluded?: boolean
  showWarnings?: boolean
  debitAccountFilter?: string
  creditAccountFilter?: string
  sortKey?: string | null
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

/** レスポンス */
export interface ExportListResult {
  rows: ExportRow[]
  totalCount: number
  totalPages: number
  page: number
  pageSize: number
  filteredJournalCount: number
  totalAmount: number
  /** 非推奨除外後の科目名リスト（フィルタ用セレクトボックス） */
  accountNames: string[]
}

// ━━━ 名前解決ヘルパー ━━━

async function buildAccountNameResolver(clientId: string): Promise<(id: string | null | undefined) => string> {
  const data = await accountMasterRepo.getClientAccountsFull(clientId)
  const map = new Map<string, string>()
  for (const a of data.accounts) {
    map.set(a.accountId, a.name)
  }
  return (id) => {
    if (!id) return ''
    return map.get(id) ?? id
  }
}

async function buildTaxNameResolver(clientId: string): Promise<(id: string | null | undefined) => string> {
  const catsData = await taxMasterRepo.getClient(clientId)
  const cats = catsData.taxCategories
  const map = new Map<string, string>()
  for (const t of cats) {
    map.set(t.taxCategoryId, t.name)
  }
  return (id) => {
    if (!id) return ''
    return map.get(id) ?? id
  }
}

// ━━━ 日付フォーマット ━━━

function toDisplayDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  // YYYY-MM-DD → YYYY/MM/DD
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}/${m[2]}/${m[3]}`
  return dateStr
}

// ━━━ メインロジック ━━━

export async function getExportList(query: ExportListQuery): Promise<ExportListResult> {
  const {
    clientId,
    showTargetOnly = true,
    showExcluded = false,
    showWarnings = false,
    debitAccountFilter = '',
    creditAccountFilter = '',
    sortKey = null,
    sortDir = 'asc',
    page = 1,
    pageSize = 25,
  } = query

  const resolveAccount = await buildAccountNameResolver(clientId)
  const resolveTax = await buildTaxNameResolver(clientId)

  // 1. 仕訳取得（Repository経由）
  const journals = await journalRepo.list(clientId)

  // 2. 全行展開（未出力・非削除のみ）
  const allRows: ExportRow[] = []
  for (const j of journals) {
    if (j.deleted_at !== null) continue
    if ((j.status as string) === 'exported') continue

    const dismissals = j.warning_dismissals ?? []
    const isWarning = j.labels.some(
      (l: string) => (EXCLUDE_LABELS as readonly string[]).includes(l) && !dismissals.includes(l)
    )
    const isExcluded = j.labels.includes('EXPORT_EXCLUDE')
    const isExported = j.status === 'exported'
    const maxLen = Math.max(j.debit_entries.length, j.credit_entries.length)

    for (let i = 0; i < maxLen; i++) {
      const debit = j.debit_entries[i]
      const credit = j.credit_entries[i]
      allRows.push({
        id: `${j.journalId}-${i}`,
        qualified: i === 0 ? (j.invoice_status === 'qualified' ? '○' : '') : '',
        date: i === 0 ? toDisplayDate(j.voucher_date) : '',
        description: i === 0 ? j.description : '',
        debitAccount: debit ? resolveAccount(debit.account) : '',
        debitSub: debit?.sub_account ?? '',
        debitDept: debit?.department ?? '',
        debitTax: debit ? resolveTax(debit.tax_category_id) : '',
        debitAmount: debit?.amount ?? null,
        creditAccount: credit ? resolveAccount(credit.account) : '',
        creditSub: credit?.sub_account ?? '',
        creditDept: credit?.department ?? '',
        creditTax: credit ? resolveTax(credit.tax_category_id) : '',
        creditAmount: credit?.amount ?? null,
        vendorName: i === 0 ? (j.vendor_name ?? '') : '',
        memo: i === 0 ? (j.memo ?? '') : '',
        importDate: toDisplayDate(j.created_at),
        isExcluded,
        isWarning,
        isExported,
      })
    }
  }

  // 3. セグメントフィルタ
  const filtered = allRows.filter(row => {
    const isTarget = !row.isExcluded && !row.isWarning
    if (isTarget && showTargetOnly) { /* 表示 */ }
    else if (row.isExcluded && showExcluded) { /* 表示 */ }
    else if (row.isWarning && showWarnings) { /* 表示 */ }
    else return false

    if (debitAccountFilter && row.debitAccount !== debitAccountFilter) return false
    if (creditAccountFilter && row.creditAccount !== creditAccountFilter) return false
    return true
  })

  // 4. 仕訳単位の件数
  const journalIds = new Set(filtered.map(r => r.id.replace(/-\d+$/, '')))
  const filteredJournalCount = journalIds.size

  // 5. ソート（checkedソートはクライアント側のみ。サーバーではスキップ）
  const sorted = [...filtered]
  if (sortKey && sortKey !== 'checked') {
    const dir = sortDir === 'asc' ? 1 : -1
    const key = sortKey as keyof ExportRow
    sorted.sort((a, b) => {
      const av = a[key]
      const bv = b[key]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      if (typeof av === 'boolean' && typeof bv === 'boolean') return ((av ? 1 : 0) - (bv ? 1 : 0)) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }

  // 6. 合計金額
  const totalAmount = filtered.reduce((sum, r) => sum + (r.debitAmount ?? 0), 0)

  // 7. ページネーション
  const totalCount = sorted.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  const rows = sorted.slice(start, start + pageSize)

  // 8. 科目名リスト（フィルタセレクトボックス用）
  const clientAccounts = await accountMasterRepo.getClientAccountsFull(clientId)
  const accountNames = [...new Set(
    clientAccounts.accounts.filter(a => !a.hidden).map(a => a.name)
  )]

  return {
    rows,
    totalCount,
    totalPages,
    page: safePage,
    pageSize,
    filteredJournalCount,
    totalAmount,
    accountNames,
  }
}

// ━━━ T-31-9: 出力詳細（MockExportDetailPage.vue） ━━━

/** 出力詳細の1行 */
export interface ExportDetailRow {
  id: string
  qualified: string
  date: string
  description: string
  debitAccount: string
  debitSub: string
  debitDept: string
  debitTax: string
  debitAmount: number | null
  creditAccount: string
  creditSub: string
  creditDept: string
  creditTax: string
  creditAmount: number | null
  vendorName: string
  memo: string
  importDate: string
}

/** 出力詳細クエリ */
export interface ExportDetailQuery {
  clientId: string
  historyId: string
  sortKey?: string | null
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

/** 出力詳細レスポンス */
export interface ExportDetailResult {
  rows: ExportDetailRow[]
  totalCount: number
  totalPages: number
  page: number
  pageSize: number
  historyFileName: string
}

/** 履歴IDからファイル名を解決（exportHistoryStoreから取得） */
async function resolveHistoryFileName(clientId: string, historyId: string): Promise<string> {
  const history = await exportHistoryRepo.getByClientId(clientId)
  const entry = history.find(h => h.id === historyId)
  return entry?.fileName ?? historyId
}

export async function getExportDetail(query: ExportDetailQuery): Promise<ExportDetailResult> {
  const {
    clientId,
    historyId,
    sortKey = null,
    sortDir = 'asc',
    page = 1,
    pageSize = 25,
  } = query

  const resolveAccount = await buildAccountNameResolver(clientId)
  const resolveTax = await buildTaxNameResolver(clientId)

  // 仕訳取得（Repository経由）
  const journals = await journalRepo.list(clientId)

  // export_batch_idで絞り込み（historyIdに一致する仕訳のみ）
  const allRows: ExportDetailRow[] = []
  for (const j of journals) {
    if (j.deleted_at !== null) continue
    // export_batch_idが一致する仕訳のみ表示
    if (j.export_batch_id !== historyId) continue

    const maxLen = Math.max(j.debit_entries.length, j.credit_entries.length)
    for (let i = 0; i < maxLen; i++) {
      const debit = j.debit_entries[i]
      const credit = j.credit_entries[i]
      allRows.push({
        id: `${j.journalId}-${i}`,
        qualified: i === 0 ? (j.invoice_status === 'qualified' ? '○' : '') : '',
        date: i === 0 ? toDisplayDate(j.voucher_date) : '',
        description: i === 0 ? j.description : '',
        debitAccount: debit ? resolveAccount(debit.account) : '',
        debitSub: debit?.sub_account ?? '',
        debitDept: debit?.department ?? '',
        debitTax: debit ? resolveTax(debit.tax_category_id) : '',
        debitAmount: debit?.amount ?? null,
        creditAccount: credit ? resolveAccount(credit.account) : '',
        creditSub: credit?.sub_account ?? '',
        creditDept: credit?.department ?? '',
        creditTax: credit ? resolveTax(credit.tax_category_id) : '',
        creditAmount: credit?.amount ?? null,
        vendorName: i === 0 ? (j.vendor_name ?? '') : '',
        memo: i === 0 ? (j.memo ?? '') : '',
        importDate: toDisplayDate(j.created_at),
      })
    }
  }

  // ソート
  const sorted = [...allRows]
  if (sortKey) {
    const dir = sortDir === 'asc' ? 1 : -1
    const key = sortKey as keyof ExportDetailRow
    sorted.sort((a, b) => {
      const av = a[key]
      const bv = b[key]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv), 'ja') * dir
    })
  }

  // ページネーション
  const totalCount = sorted.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  const rows = sorted.slice(start, start + pageSize)

  return {
    rows,
    totalCount,
    totalPages,
    page: safePage,
    pageSize,
    historyFileName: await resolveHistoryFileName(clientId, historyId),
  }
}
