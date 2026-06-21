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
import { getByClientId as getConfirmedJournals } from './confirmedJournalsApi'
import { type JournalListRow, isMfJournal, isAiJournal } from '../../types/journal-list-row'
import type { StaffNotes } from '../../types/staff_notes'

/** クエリパラメータ */
export interface JournalListQuery {
  sort?: string
  order?: 'asc' | 'desc'
  search?: string
  showImported?: boolean
  showUnexported?: boolean
  showExported?: boolean
  showExcluded?: boolean
  showTrashed?: boolean
  voucherFilter?: string
  /** 期間フィルタ: 開始日（YYYY-MM-DD）。決算年度バーから自動算出。 */
  dateFrom?: string
  /** 期間フィルタ: 終了日（YYYY-MM-DD）。決算年度バーから自動算出。 */
  dateTo?: string
  /** 月フィルタ: 表示対象の月番号配列（1-12）。歯抜け月選択対応。 */
  filterMonths?: number[]
  page?: number
  pageSize?: number
  /** 科目ID→科目名マッピング（科目名ソート用。フロントからPOSTで送信） */
  accountMap?: Record<string, string>
  /** 税区分ID→税区分名マッピング（税区分名ソート用。フロントからPOSTで送信） */
  taxMap?: Record<string, string>
}

/** API応答 */
export interface JournalListResponse {
  journals: JournalListRow[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

// ────────────────────────────────────────────
// ヘルパー: JournalListRowから安全にフィールド取得
// 過去仕訳にはlabels/status/staff_notes等が存在しないため、
// 型ガードで分岐して安全にアクセスする
// ────────────────────────────────────────────


/** 仕訳一覧行のラベル取得（過去仕訳はラベル概念なし→空配列） */
function getRowLabels(row: JournalListRow): string[] {
  if (isMfJournal(row)) return []
  return row.labels
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
  FUTURE_DATE: 30,
  DIRECTOR_LOAN: 25,
  AUTO_INVOICE_SMALL: 5,
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
  result: JournalListRow[],
  column: string,
  direction: 'asc' | 'desc',
  allJournalIds: string[],
  accountMap?: Record<string, string>,
  taxMap?: Record<string, string>,
): JournalListRow[] {
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
        aVal = isAiJournal(a) ? a.display_order : 90000
        bVal = isAiJournal(b) ? b.display_order : 90000
        break
      case 'has_photo':
        aVal = isAiJournal(a) && a.document_id ? 1 : 0
        bVal = isAiJournal(b) && b.document_id ? 1 : 0
        break
      case 'staff_notes': {
        const hasNotes = (j: JournalListRow): number => {
          if (isMfJournal(j)) return 0
          if (!j.staff_notes) return 0
          return Object.values(j.staff_notes).some((n: { enabled: boolean }) => n.enabled) ? 1 : 0
        }
        aVal = hasNotes(a)
        bVal = hasNotes(b)
        break
      }
      case 'past_journal':
        aVal = isAiJournal(a) ? (allJournalIds.indexOf(a.journalId) < 25 ? 1 : 0) : 0
        bVal = isAiJournal(b) ? (allJournalIds.indexOf(b.journalId) < 25 ? 1 : 0) : 0
        break
      case 'requires_action': {
        const getNeedWeight = (j: JournalListRow): number => {
          if (isMfJournal(j)) return 0
          if (!j.staff_notes) return 0
          let w = 0
          const sn: StaffNotes = j.staff_notes
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
        aVal = getRowLabels(a).join(',')
        bVal = getRowLabels(b).join(',')
        break
      case 'warning':
        aVal = getWarningWeight(getRowLabels(a))
        bVal = getWarningWeight(getRowLabels(b))
        break
      case 'rule': {
        const getRuleWeight = (labels: string[]) => {
          if (labels.includes('RULE_APPLIED')) return 2
          if (labels.includes('RULE_AVAILABLE')) return 1
          return 0
        }
        aVal = getRuleWeight(getRowLabels(a))
        bVal = getRuleWeight(getRowLabels(b))
        break
      }
      case 'is_credit_card_payment':
        aVal = isAiJournal(a) && a.is_credit_card_payment ? 1 : 0
        bVal = isAiJournal(b) && b.is_credit_card_payment ? 1 : 0
        break
      case 'tax_rate':
        aVal = getRowLabels(a).includes('MULTI_TAX_RATE') ? 1 : 0
        bVal = getRowLabels(b).includes('MULTI_TAX_RATE') ? 1 : 0
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
        aVal = getInvoiceWeight(getRowLabels(a))
        bVal = getInvoiceWeight(getRowLabels(b))
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

function searchJournals(
  result: JournalListRow[],
  query: string,
  accountMap?: Record<string, string>,
  taxMap?: Record<string, string>,
): JournalListRow[] {
  const q = query.trim().toLowerCase()
  if (!q) return result
  // accountId/taxCategoryId → 表示名に変換（マップがあれば）
  const resolveAccount = (id: string | null | undefined): string => {
    if (!id) return ''
    return accountMap?.[id] ?? id
  }
  const resolveTax = (id: string | null | undefined): string => {
    if (!id) return ''
    return taxMap?.[id] ?? id
  }
  return result.filter(j => {
    const fields = [
      j.voucher_date ?? '',
      j.description ?? '',
      // 借方・貸方エントリの科目・補助・税区分・金額（共通フィールド）
      ...(j.debit_entries ?? []).flatMap(e => [
        e.account ?? '', resolveAccount(e.account),
        e.sub_account ?? '',
        e.tax_category_id ?? '', resolveTax(e.tax_category_id),
        String(e.amount ?? ''),
      ]),
      ...(j.credit_entries ?? []).flatMap(e => [
        e.account ?? '', resolveAccount(e.account),
        e.sub_account ?? '',
        e.tax_category_id ?? '', resolveTax(e.tax_category_id),
        String(e.amount ?? ''),
      ]),
      j.memo ?? '',
      // 通常仕訳固有フィールド（証票意味）
      ...(isAiJournal(j) ? [j.voucher_type ?? ''] : []),
    ]
    return fields.some(f => f.toLowerCase().includes(q))
  })
}

// ────────────────────────────────────────────
// チェックボックスフィルタ
// ────────────────────────────────────────────

function filterJournals(
  result: JournalListRow[],
  opts: {
    showUnexported: boolean
    showExported: boolean
    showExcluded: boolean
    showTrashed: boolean
    voucherFilter?: string
  }
): JournalListRow[] {
  return result.filter(journal => {
    // 過去仕訳（MFインポート/CSV）はステータスフィルタの対象外
    // （showImportedの判断は結合段階で完了済み）
    if (isMfJournal(journal)) return true

    // 以下は通常仕訳のみの処理
    // ゴミ箱フィルタ（AND条件: OFFならtrashed非表示）
    if (journal.deleted_at !== null && !opts.showTrashed) return false

    // 証票種別フィルタ
    if (opts.voucherFilter && !getRowLabels(journal).includes(opts.voucherFilter)) return false

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
  const rawJournals = getJournals<JournalListRow>(clientId)
  let result: JournalListRow[] = [...rawJournals].sort((a, b) => {
    return (
      new Date(a.voucher_date ?? '9999-12-31').getTime() -
      new Date(b.voucher_date ?? '9999-12-31').getTime()
    )
  })

  // 元の仕訳IDリスト（past_journalソート用）
  const allJournalIds = rawJournals.map(j => isAiJournal(j) ? j.journalId : '')

  // 2. 過去仕訳（MFインポート/CSV）の結合（偽装なし、そのまま追加）
  if (query.showImported) {
    const confirmed = getConfirmedJournals(clientId)
    result.push(...confirmed)
  }

  // 3. カラムソート
  if (query.sort) {
    result = sortJournals(result, query.sort, query.order ?? 'asc', allJournalIds, query.accountMap, query.taxMap)
  }

  // 4. 全列横断検索（科目名・税区分名の解決済み文字列も検索対象に含める）
  if (query.search) {
    result = searchJournals(result, query.search, query.accountMap, query.taxMap)
  }

  // 5. 期間フィルタ（決算年度バー）
  if (query.dateFrom || query.dateTo || query.filterMonths) {
    const monthSet = query.filterMonths ? new Set(query.filterMonths) : null
    result = result.filter(j => {
      const d = j.voucher_date
      if (!d) return true // 日付未設定の仕訳は常に表示
      if (query.dateFrom && d < query.dateFrom) return false
      if (query.dateTo && d > query.dateTo) return false
      // 月フィルタ: voucher_dateの月が選択月に含まれているか
      if (monthSet) {
        const month = new Date(d).getMonth() + 1 // 1-12
        if (!monthSet.has(month)) return false
      }
      return true
    })
  }

  // 6. チェックボックスフィルタ
  result = filterJournals(result, {
    showUnexported: query.showUnexported ?? true,
    showExported: query.showExported ?? true,
    showExcluded: query.showExcluded ?? false,
    showTrashed: query.showTrashed ?? false,
    voucherFilter: query.voucherFilter,
  })

  // 7. ページネーション
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
