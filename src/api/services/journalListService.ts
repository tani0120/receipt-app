/**
 * journalListService.ts — 仕訳一覧統合サービス（API側）
 *
 * Phase 1 Step 4（2026-05-02）で作成。
 * JournalListLevel3Mock.vue の journals computed ロジックをAPI側に移植。
 *
 * 機能:
 *   - 通常仕訳 + 過去仕訳CSV(confirmed_journals) の統合
 *   - 20列以上のカラムソート
 *   - 全列横断検索
 *   - チェックボックスフィルタ（未出力/出力済/対象外/ゴミ箱/証票種別）
 *   - ページネーション
 *
 * Phase 2完了（2026-05-03）: accountMap/taxMap をサーバー側 accountMasterStore から自動生成可能。
 */

import { getJournals } from './journalStore'
import { getByClientId as getConfirmedJournals } from './confirmedJournalStore'
import type { ConfirmedJournal } from '../../types/confirmed_journal.type'
import crypto from 'crypto'

// ────────────────────────────────────────────
// 型定義（API応答用の最小型。フロント側の巨大な型に依存しない）
// ────────────────────────────────────────────

/** 仕訳エントリ行（ソート・検索用） */
interface JournalEntry {
  id?: string
  account: string | null
  account_on_document?: boolean
  sub_account: string | null
  department: string | null
  amount: number | null
  amount_on_document?: boolean
  tax_category_id: string | null
  vendor_name?: string | null
}

/** 統合仕訳行（通常 + 過去仕訳CSV） */
interface JournalRow {
  id: string
  client_id: string
  display_order: number
  voucher_date: string | null
  description: string
  voucher_type: string | null
  document_id: string | null
  debit_entries: JournalEntry[]
  credit_entries: JournalEntry[]
  status: 'exported' | null
  is_read: boolean
  deleted_at: string | null
  labels: string[]
  warning_dismissals: string[]
  warning_details: Record<string, string>
  is_credit_card_payment: boolean
  rule_id: string | null
  invoice_status: string | null
  memo: string | null
  staff_notes?: Record<string, { enabled: boolean; text?: string }> | null
  [key: string]: unknown // 追加プロパティ許容
}

/** クエリパラメータ */
export interface JournalListQuery {
  sort?: string
  order?: 'asc' | 'desc'
  search?: string
  showPastCsv?: boolean
  showUnexported?: boolean
  showExported?: boolean
  showExcluded?: boolean
  showTrashed?: boolean
  voucherFilter?: string
  page?: number
  pageSize?: number
  /** 科目ID→科目名マッピング（科目名ソート用。フロントからPOSTで送信） */
  accountMap?: Record<string, string>
  /** 税区分ID→税区分名マッピング（税区分名ソート用。フロントからPOSTで送信） */
  taxMap?: Record<string, string>
}

/** API応答 */
export interface JournalListResponse {
  journals: JournalRow[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

// ────────────────────────────────────────────
// 過去仕訳CSV → JournalRow変換
// ────────────────────────────────────────────

function confirmedToJournalRow(cj: ConfirmedJournal, idx: number, clientId: string): JournalRow {
  return {
    id: `past-csv-${idx}`,
    client_id: clientId,
    display_order: 90000 + idx,
    voucher_date: cj.voucher_date || null,
    description: cj.description || '',
    voucher_type: null,
    document_id: null,
    debit_entries: (cj.debit_entries || []).map(e => ({
      id: e.id || `past-de-${idx}-${crypto.randomBytes(4).toString('hex')}`,
      account: e.account || null,
      account_on_document: false,
      sub_account: e.sub_account || null,
      department: e.department || null,
      amount: e.amount ?? null,
      amount_on_document: false,
      tax_category_id: e.tax_category_id || null,
      vendor_name: e.vendor_name || null,
    })),
    credit_entries: (cj.credit_entries || []).map(e => ({
      id: e.id || `past-ce-${idx}-${crypto.randomBytes(4).toString('hex')}`,
      account: e.account || null,
      account_on_document: false,
      sub_account: e.sub_account || null,
      department: e.department || null,
      amount: e.amount ?? null,
      amount_on_document: false,
      tax_category_id: e.tax_category_id || null,
      vendor_name: e.vendor_name || null,
    })),
    status: 'exported' as const,
    is_read: true,
    deleted_at: null,
    labels: [],
    warning_dismissals: [],
    warning_details: {},
    is_credit_card_payment: false,
    rule_id: null,
    invoice_status: null,
    memo: '過去仕訳CSV',
    staff_notes: null,
    // pastRows用の追加フィールド
    date_on_document: true,
    source_type: null,
    direction: cj.direction || null,
    vendor_vector: null,
    vendor_id: cj.vendor_id || null,
    vendor_name: cj.vendor_name || null,
    line_id: null,
    export_batch_id: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
  }
}

// ────────────────────────────────────────────
// null安全比較（compareWithNull相当）
// ────────────────────────────────────────────

function compareWithNull<T>(
  a: T | null | undefined,
  b: T | null | undefined,
  direction: 'asc' | 'desc',
  comparator: (x: T, y: T) => number
): number {
  if (a == null && b == null) return 0
  if (a == null) return direction === 'asc' ? -1 : 1
  if (b == null) return direction === 'asc' ? 1 : -1
  const r = comparator(a, b)
  return direction === 'desc' ? -r : r
}

// ────────────────────────────────────────────
// 警告ラベル重み付け（warningLabelMap相当）
// ────────────────────────────────────────────

const WARNING_WEIGHTS: Record<string, number> = {
  DEBIT_CREDIT_MISMATCH: 90,
  CATEGORY_CONFLICT: 80,
  SAME_ACCOUNT_BOTH_SIDES: 75,
  VOUCHER_TYPE_CONFLICT: 70,
  TAX_ACCOUNT_MISMATCH: 65,
  ACCOUNT_UNKNOWN: 60,
  TAX_UNKNOWN: 55,
  AMOUNT_UNCLEAR: 50,
  DATE_UNKNOWN: 45,
  DESCRIPTION_UNKNOWN: 40,
  DATE_OUT_OF_RANGE: 35,
}

function getWarningWeight(labels: string[]): number {
  for (const l of labels) {
    if (WARNING_WEIGHTS[l]) return WARNING_WEIGHTS[l]
  }
  return 0
}

// ────────────────────────────────────────────
// ソート
// ────────────────────────────────────────────

function sortJournals(
  result: JournalRow[],
  column: string,
  direction: 'asc' | 'desc',
  allJournalIds: string[],
  accountMap?: Record<string, string>,
  taxMap?: Record<string, string>,
): JournalRow[] {
  // 科目ID→科目名解決（マッピングがあれば使用、なければIDそのまま）
  const resolveAccount = (id: string | null | undefined): string | null => {
    if (!id) return null
    return accountMap?.[id] ?? id
  }
  const resolveTax = (id: string | null | undefined): string | null => {
    if (!id) return null
    return taxMap?.[id] ?? id
  }
  const sorted = [...result]
  sorted.sort((a, b) => {
    type SortValue = number | string
    let aVal: SortValue = 0
    let bVal: SortValue = 0

    switch (column) {
      case 'display_order':
        aVal = a.display_order
        bVal = b.display_order
        break
      case 'has_photo':
        aVal = a.document_id ? 1 : 0
        bVal = b.document_id ? 1 : 0
        break
      case 'staff_notes': {
        const hasNotes = (j: JournalRow): number => {
          if (!j.staff_notes) return 0
          return Object.values(j.staff_notes).some((n: { enabled: boolean }) => n.enabled) ? 1 : 0
        }
        aVal = hasNotes(a)
        bVal = hasNotes(b)
        break
      }
      case 'past_journal':
        aVal = allJournalIds.indexOf(a.id) < 25 ? 1 : 0
        bVal = allJournalIds.indexOf(b.id) < 25 ? 1 : 0
        break
      case 'requires_action': {
        const getNeedWeight = (j: JournalRow): number => {
          if (!j.staff_notes) return 0
          let w = 0
          const sn = j.staff_notes as Record<string, { enabled: boolean }>
          if (sn.NEED_DOCUMENT?.enabled) w += 8
          if (sn.NEED_INFO?.enabled) w += 4
          if (sn.REMINDER?.enabled) w += 2
          if (sn.NEED_CONSULT?.enabled) w += 1
          return w
        }
        aVal = getNeedWeight(a)
        bVal = getNeedWeight(b)
        break
      }
      case 'label_type':
        aVal = a.labels.join(',')
        bVal = b.labels.join(',')
        break
      case 'warning':
        aVal = getWarningWeight(a.labels)
        bVal = getWarningWeight(b.labels)
        break
      case 'rule': {
        const getRuleWeight = (labels: string[]) => {
          if (labels.includes('RULE_APPLIED')) return 2
          if (labels.includes('RULE_AVAILABLE')) return 1
          return 0
        }
        aVal = getRuleWeight(a.labels)
        bVal = getRuleWeight(b.labels)
        break
      }
      case 'is_credit_card_payment':
        aVal = a.is_credit_card_payment ? 1 : 0
        bVal = b.is_credit_card_payment ? 1 : 0
        break
      case 'tax_rate':
        aVal = a.labels.includes('MULTI_TAX_RATE') ? 1 : 0
        bVal = b.labels.includes('MULTI_TAX_RATE') ? 1 : 0
        break
      case 'memo':
        aVal = a.memo ? 1 : 0
        bVal = b.memo ? 1 : 0
        break
      case 'invoice': {
        const getInvoiceWeight = (labels: string[]) => {
          if (labels.includes('INVOICE_QUALIFIED')) return 2
          if (labels.includes('INVOICE_NOT_QUALIFIED')) return 1
          return 0
        }
        aVal = getInvoiceWeight(a.labels)
        bVal = getInvoiceWeight(b.labels)
        break
      }
      case 'voucher_date':
        return compareWithNull(
          a.voucher_date ? new Date(a.voucher_date).getTime() : null,
          b.voucher_date ? new Date(b.voucher_date).getTime() : null,
          direction,
          (x, y) => x - y,
        )
      case 'description':
        aVal = a.description
        bVal = b.description
        break
      case 'debit_account':
        return compareWithNull(
          resolveAccount(a.debit_entries[0]?.account),
          resolveAccount(b.debit_entries[0]?.account),
          direction,
          (x, y) => x.localeCompare(y),
        )
      case 'debit_sub_account':
        return compareWithNull(
          a.debit_entries[0]?.sub_account,
          b.debit_entries[0]?.sub_account,
          direction,
          (x, y) => x.localeCompare(y),
        )
      case 'debit_tax':
        return compareWithNull(
          resolveTax(a.debit_entries[0]?.tax_category_id),
          resolveTax(b.debit_entries[0]?.tax_category_id),
          direction,
          (x, y) => x.localeCompare(y),
        )
      case 'debit_amount': {
        const aHasAny = a.debit_entries.some(e => e.amount != null)
        const bHasAny = b.debit_entries.some(e => e.amount != null)
        const aSum = aHasAny ? a.debit_entries.reduce((s, e) => s + (e.amount ?? 0), 0) : null
        const bSum = bHasAny ? b.debit_entries.reduce((s, e) => s + (e.amount ?? 0), 0) : null
        if (aSum === null && bSum === null) return 0
        if (aSum === null) return direction === 'asc' ? -1 : 1
        if (bSum === null) return direction === 'asc' ? 1 : -1
        const r = aSum - bSum
        return direction === 'desc' ? -r : r
      }
      case 'credit_account':
        return compareWithNull(
          resolveAccount(a.credit_entries[0]?.account),
          resolveAccount(b.credit_entries[0]?.account),
          direction,
          (x, y) => x.localeCompare(y),
        )
      case 'credit_sub_account':
        return compareWithNull(
          a.credit_entries[0]?.sub_account,
          b.credit_entries[0]?.sub_account,
          direction,
          (x, y) => x.localeCompare(y),
        )
      case 'credit_tax':
        return compareWithNull(
          resolveTax(a.credit_entries[0]?.tax_category_id),
          resolveTax(b.credit_entries[0]?.tax_category_id),
          direction,
          (x, y) => x.localeCompare(y),
        )
      case 'credit_amount': {
        const aHasAny = a.credit_entries.some(e => e.amount != null)
        const bHasAny = b.credit_entries.some(e => e.amount != null)
        const aSum = aHasAny ? a.credit_entries.reduce((s, e) => s + (e.amount ?? 0), 0) : null
        const bSum = bHasAny ? b.credit_entries.reduce((s, e) => s + (e.amount ?? 0), 0) : null
        if (aSum === null && bSum === null) return 0
        if (aSum === null) return direction === 'asc' ? -1 : 1
        if (bSum === null) return direction === 'asc' ? 1 : -1
        const r = aSum - bSum
        return direction === 'desc' ? -r : r
      }
      default:
        return 0
    }

    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
  return sorted
}

// ────────────────────────────────────────────
// 全列横断検索
// ────────────────────────────────────────────

function searchJournals(result: JournalRow[], query: string): JournalRow[] {
  const q = query.trim().toLowerCase()
  if (!q) return result
  return result.filter(j => {
    const fields = [
      j.voucher_date ?? '',
      j.description ?? '',
      ...(j.debit_entries ?? []).flatMap(e => [e.account ?? '', e.sub_account ?? '', e.tax_category_id ?? '', String(e.amount ?? '')]),
      ...(j.credit_entries ?? []).flatMap(e => [e.account ?? '', e.sub_account ?? '', e.tax_category_id ?? '', String(e.amount ?? '')]),
      j.memo ?? '',
      j.voucher_type ?? '',
    ]
    return fields.some(f => f.toLowerCase().includes(q))
  })
}

// ────────────────────────────────────────────
// チェックボックスフィルタ
// ────────────────────────────────────────────

function filterJournals(
  result: JournalRow[],
  opts: {
    showUnexported: boolean
    showExported: boolean
    showExcluded: boolean
    showTrashed: boolean
    voucherFilter?: string
  }
): JournalRow[] {
  return result.filter(journal => {
    // 過去仕訳CSV行はステータスフィルタの対象外（showPastCsvの判断は結合段階で完了）
    if (journal.id.startsWith('past-csv-')) return true

    // ゴミ箱フィルタ（AND条件: OFFならtrashed非表示）
    if (journal.deleted_at !== null && !opts.showTrashed) return false

    // 証票種別フィルタ
    if (opts.voucherFilter && !journal.labels.includes(opts.voucherFilter)) return false

    const isExcluded = journal.labels.includes('EXPORT_EXCLUDE')
    const isExported = journal.status === 'exported'
    const isUnexported = journal.status === null && !isExcluded

    if (opts.showUnexported && isUnexported) return true
    if (opts.showExported && isExported) return true
    if (opts.showExcluded && isExcluded) return true
    if (opts.showTrashed && journal.deleted_at !== null) return true

    return false
  })
}

// ────────────────────────────────────────────
// 統合一覧API
// ────────────────────────────────────────────

export function getJournalList(clientId: string, query: JournalListQuery): JournalListResponse {
  // 1. 通常仕訳の取得（デフォルト日付ソート）
  const rawJournals = getJournals(clientId) as JournalRow[]
  let result = [...rawJournals].sort((a, b) => {
    return (
      new Date(a.voucher_date ?? '9999-12-31').getTime() -
      new Date(b.voucher_date ?? '9999-12-31').getTime()
    )
  })

  // 元の仕訳IDリスト（past_journalソート用）
  const allJournalIds = rawJournals.map(j => j.id)

  // 2. 過去仕訳CSVの結合（ソート前）
  if (query.showPastCsv) {
    const confirmed = getConfirmedJournals(clientId)
    const pastRows = confirmed.map((cj, idx) => confirmedToJournalRow(cj, idx, clientId))
    result.push(...pastRows)
  }

  // 3. カラムソート
  if (query.sort) {
    result = sortJournals(result, query.sort, query.order ?? 'asc', allJournalIds, query.accountMap, query.taxMap)
  }

  // 4. 全列横断検索
  if (query.search) {
    result = searchJournals(result, query.search)
  }

  // 5. チェックボックスフィルタ
  result = filterJournals(result, {
    showUnexported: query.showUnexported ?? true,
    showExported: query.showExported ?? true,
    showExcluded: query.showExcluded ?? false,
    showTrashed: query.showTrashed ?? false,
    voucherFilter: query.voucherFilter,
  })

  // 6. ページネーション
  const totalCount = result.length
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 30
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const start = (page - 1) * pageSize
  const paged = result.slice(start, start + pageSize)

  return {
    journals: paged,
    totalCount,
    page,
    pageSize,
    totalPages,
  }
}
