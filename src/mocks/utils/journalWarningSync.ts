/**
 * journalWarningSync.ts — 仕訳警告ラベル同期ロジック（共通utility）
 *
 * 一覧UIと出力UIの両方で使用する。
 * JournalListLevel3Mock.vue から抽出。UIモーダル表示は呼び出し側で制御。
 */
import type { JournalPhase5Mock } from '../types/journal_phase5_mock.type'

// ────────────────────────────────────────────
// 型・定数
// ────────────────────────────────────────────

export type MegaGroupType = 'sales' | 'expense' | 'bs_al' | 'bs_equity' | null

const CONTRA_REVENUE_IDS = ['SALES_RETURNS', 'SALES_RETURNS_CORP']
const CONTRA_EXPENSE_IDS = ['PURCHASE_RETURNS', 'PURCHASE_RETURNS_CORP']

const WITHHOLDING_ACCOUNTS = ['預り金', '所得税預り金', '住民税預り金', '社会保険料預り金']
const SALARY_ACCOUNTS = ['給料手当', '役員報酬', '賞与', '雑給']
const UNPAID_ACCOUNTS = ['未払金', '未払費用']
const ADVANCE_ACCOUNTS = ['立替金', '未収入金']
const DEPOSIT_ACCOUNTS = ['普通預金', '当座預金', '定期預金']

// ────────────────────────────────────────────
// 勘定科目インターフェース（useAccountSettingsの型に依存しない最小定義）
// ────────────────────────────────────────────

export interface AccountForValidation {
  id: string
  accountGroup?: string | null
  taxDetermination?: string | null
  defaultTaxCategoryId?: string | null
}

export interface TaxCategoryForValidation {
  id: string
  direction?: string | null
}

// ────────────────────────────────────────────
// 5分類判定
// ────────────────────────────────────────────

export function getMegaGroup(accountName: string | null, accounts: AccountForValidation[]): MegaGroupType {
  if (!accountName) return null
  const acc = accounts.find(a => a.id === accountName)
  if (!acc) return null
  if (acc.accountGroup === 'PL_REVENUE') return 'sales'
  if (acc.accountGroup === 'PL_EXPENSE') return 'expense'
  if (acc.accountGroup === 'BS_EQUITY') return 'bs_equity'
  if (acc.accountGroup === 'BS_ASSET' || acc.accountGroup === 'BS_LIABILITY') return 'bs_al'
  return null
}

function isContraAccount(accountName: string | null, accounts: AccountForValidation[]): { isContraRevenue: boolean; isContraExpense: boolean } {
  if (!accountName) return { isContraRevenue: false, isContraExpense: false }
  const acc = accounts.find(a => a.id === accountName)
  if (!acc) return { isContraRevenue: false, isContraExpense: false }
  return {
    isContraRevenue: CONTRA_REVENUE_IDS.includes(acc.id),
    isContraExpense: CONTRA_EXPENSE_IDS.includes(acc.id),
  }
}

// ────────────────────────────────────────────
// バリデーション
// ────────────────────────────────────────────

export function validateDebitCreditCombination(
  debitGroup: MegaGroupType, creditGroup: MegaGroupType,
  debitAccount: string | null | undefined, creditAccount: string | null | undefined,
  accounts: AccountForValidation[]
): string | null {
  if (!debitGroup || !creditGroup) return null

  // 正常パターン
  if (debitGroup === 'expense' && creditGroup === 'bs_al') return null
  if (debitGroup === 'bs_al' && creditGroup === 'sales') return null
  if (debitGroup === 'bs_al' && creditGroup === 'bs_al') return null
  if (debitGroup === 'expense' && creditGroup === 'bs_equity') return null
  if (debitGroup === 'bs_equity' && creditGroup === 'bs_al') return null
  if (debitGroup === 'bs_al' && creditGroup === 'bs_equity') return null

  // 逆仕訳許容パターン
  if (debitGroup === 'sales' && creditGroup === 'bs_al') {
    const { isContraRevenue } = isContraAccount(debitAccount ?? null, accounts)
    if (isContraRevenue) return null
    return '売上は通常貸方です。返品・値引ですか？'
  }
  if (debitGroup === 'bs_al' && creditGroup === 'expense') {
    const { isContraExpense } = isContraAccount(creditAccount ?? null, accounts)
    if (isContraExpense) return null
    return '経費は通常借方です。戻入・返品ですか？'
  }

  // 不正パターン
  if (debitGroup === 'sales' && creditGroup === 'sales') return '借方・貸方が同じ区分（売上×売上）です'
  if (debitGroup === 'expense' && creditGroup === 'expense') return '借方・貸方が同じ区分（経費×経費）です'
  if (debitGroup === 'sales' && creditGroup === 'expense') return '借方が売上、貸方が経費は通常あり得ません'
  if (debitGroup === 'expense' && creditGroup === 'sales') return '借方が経費、貸方が売上は通常あり得ません'
  if (debitGroup === 'bs_equity' && creditGroup === 'sales') return '純資産×売上の組み合わせは通常あり得ません'
  if (debitGroup === 'bs_equity' && creditGroup === 'expense') return '純資産×経費の組み合わせは通常あり得ません'
  if (debitGroup === 'sales' && creditGroup === 'bs_equity') return '売上×純資産の組み合わせは通常あり得ません'
  if (debitGroup === 'expense' && creditGroup === 'bs_equity') return '経費×純資産の組み合わせは通常あり得ません'
  if (debitGroup === 'bs_equity' && creditGroup === 'bs_equity') return '純資産×純資産の組み合わせは通常あり得ません'

  return null
}

export function validateByVoucherType(voucherType: string, journal: JournalPhase5Mock): string | null {
  const debitAccounts = journal.debit_entries.map(e => e.account).filter(Boolean) as string[]
  const creditAccounts = journal.credit_entries.map(e => e.account).filter(Boolean) as string[]

  switch (voucherType) {
    case '給与': {
      const hasWithholding = creditAccounts.some(a => WITHHOLDING_ACCOUNTS.includes(a))
      if (!hasWithholding) return '給与仕訳ですが源泉/社保の預り金がありません'
      const hasSalary = debitAccounts.some(a => SALARY_ACCOUNTS.includes(a))
      if (!hasSalary) return '給与仕訳ですが借方が給与系科目ではありません'
      break
    }
    case 'クレカ': {
      const hasUnpaid = creditAccounts.some(a => UNPAID_ACCOUNTS.includes(a))
      if (!hasUnpaid) return 'クレカ仕訳ですが貸方が未払金ではありません'
      break
    }
    case 'クレカ引落': {
      const hasUnpaid = debitAccounts.some(a => UNPAID_ACCOUNTS.includes(a))
      if (!hasUnpaid) return 'クレカ引落ですが借方が未払金ではありません'
      break
    }
    case '立替経費': {
      const hasAdvance = creditAccounts.some(a => ADVANCE_ACCOUNTS.includes(a))
      if (!hasAdvance) return '立替経費ですが貸方が立替系科目ではありません'
      break
    }
    case '振替': {
      const debitDeposit = debitAccounts.some(a => DEPOSIT_ACCOUNTS.includes(a))
      const creditDeposit = creditAccounts.some(a => DEPOSIT_ACCOUNTS.includes(a))
      if (!debitDeposit || !creditDeposit) return '口座振替ですが片方が預金系ではありません'
      break
    }
  }
  return null
}

// ────────────────────────────────────────────
// syncWarningLabels（コアロジック。UIモーダルなし）
// ────────────────────────────────────────────

export interface SyncWarningResult {
  addedLabels: string[]
  removedLabels: string[]
}

export function syncWarningLabelsCore(
  journal: JournalPhase5Mock,
  accounts: AccountForValidation[],
  taxCategories: TaxCategoryForValidation[]
): SyncWarningResult {
  const labels = journal.labels as string[]
  const addedLabels: string[] = []
  const removedLabels: string[] = []
  // 警告詳細を初期化（存在しない場合）
  if (!(journal as any).warning_details) {
    (journal as any).warning_details = {}
  }
  const details = (journal as any).warning_details as Record<string, string>

  const dismissals = (journal as any).warning_dismissals as string[] | undefined ?? []

  function addLabel(key: string, detail?: string) {
    // warning_dismissalsに含まれる警告タイプはスキップ（ユーザーが確認済み）
    if (dismissals.includes(key)) {
      // 確認済みなので、もし既にラベルがあれば除去する
      const idx = labels.indexOf(key)
      if (idx >= 0) labels.splice(idx, 1)
      return
    }
    if (!labels.includes(key)) {
      labels.push(key)
    }
    if (detail) details[key] = detail
    addedLabels.push(key)
  }
  function removeLabel(key: string) {
    const idx = labels.indexOf(key)
    if (idx >= 0) {
      labels.splice(idx, 1)
      removedLabels.push(key)
    }
    delete details[key]
  }

  // 1. ACCOUNT_UNKNOWN
  const accountIds = new Set(accounts.map(a => a.id))
  const isValidAccount = (id: string | null) => id != null && id !== '' && accountIds.has(id)
  const unknownAccounts = [
    ...journal.debit_entries.filter(e => !isValidAccount(e.account)).map(e => `借方'${e.account ?? '(空)'}'`),
    ...journal.credit_entries.filter(e => !isValidAccount(e.account)).map(e => `貸方'${e.account ?? '(空)'}'`),
  ]
  const allAccountsValid = unknownAccounts.length === 0
  if (allAccountsValid) removeLabel('ACCOUNT_UNKNOWN')
  else addLabel('ACCOUNT_UNKNOWN', `${unknownAccounts.join(', ')}がマスタに存在しません`)

  // 2. TAX_UNKNOWN
  const emptyTaxEntries = [
    ...journal.debit_entries.filter(e => !e.tax_category_id).map((_, i) => `借方${i + 1}行目`),
    ...journal.credit_entries.filter(e => !e.tax_category_id).map((_, i) => `貸方${i + 1}行目`),
  ]
  const allTaxFilled = emptyTaxEntries.length === 0
  if (allTaxFilled) removeLabel('TAX_UNKNOWN')
  else addLabel('TAX_UNKNOWN', `${emptyTaxEntries.join(', ')}の税区分が未設定です`)

  // 3. DESCRIPTION_UNKNOWN
  if (journal.description != null && journal.description !== '') removeLabel('DESCRIPTION_UNKNOWN')
  else addLabel('DESCRIPTION_UNKNOWN', '摘要が空です')

  // 4. DATE_UNKNOWN
  if (journal.voucher_date != null && journal.voucher_date !== '') removeLabel('DATE_UNKNOWN')
  else addLabel('DATE_UNKNOWN', '日付が空です')

  // 5. AMOUNT_UNCLEAR
  const emptyAmountEntries = [
    ...journal.debit_entries.filter(e => e.amount == null).map((_, i) => `借方${i + 1}行目`),
    ...journal.credit_entries.filter(e => e.amount == null).map((_, i) => `貸方${i + 1}行目`),
  ]
  const allAmountsFilled = emptyAmountEntries.length === 0
  if (allAmountsFilled) removeLabel('AMOUNT_UNCLEAR')
  else addLabel('AMOUNT_UNCLEAR', `${emptyAmountEntries.join(', ')}の金額が未設定です`)

  // 6. DEBIT_CREDIT_MISMATCH
  const debitSum = journal.debit_entries.reduce((s, e) => s + (e.amount ?? 0), 0)
  const creditSum = journal.credit_entries.reduce((s, e) => s + (e.amount ?? 0), 0)
  if (debitSum === creditSum && debitSum > 0) removeLabel('DEBIT_CREDIT_MISMATCH')
  else addLabel('DEBIT_CREDIT_MISMATCH', `借方合計${debitSum.toLocaleString()} ≠ 貸方合計${creditSum.toLocaleString()}`)

  // 7. CATEGORY_CONFLICT
  let hasConflict = false
  let conflictDetail = ''
  for (const dEntry of journal.debit_entries) {
    for (const cEntry of journal.credit_entries) {
      const dAcct = dEntry.account ?? null
      const cAcct = cEntry.account ?? null
      if (dAcct && cAcct) {
        const msg = validateDebitCreditCombination(
          getMegaGroup(dAcct, accounts), getMegaGroup(cAcct, accounts), dAcct, cAcct, accounts
        )
        if (msg) {
          hasConflict = true
          conflictDetail = `${dAcct}×${cAcct}: ${msg}`
        }
      }
    }
  }
  if (hasConflict) addLabel('CATEGORY_CONFLICT', conflictDetail)
  else removeLabel('CATEGORY_CONFLICT')

  // 7b. SAME_ACCOUNT_BOTH_SIDES
  const debitAccountSet = new Set(journal.debit_entries.map(e => e.account).filter(Boolean) as string[])
  const creditAccountSet = new Set(journal.credit_entries.map(e => e.account).filter(Boolean) as string[])
  const sameAccounts = [...debitAccountSet].filter(a => creditAccountSet.has(a))
  if (sameAccounts.length > 0) addLabel('SAME_ACCOUNT_BOTH_SIDES', `'${sameAccounts.join("', '")}'が借方と貸方の両方に使用されています`)
  else removeLabel('SAME_ACCOUNT_BOTH_SIDES')

  // 8. VOUCHER_TYPE_CONFLICT
  const voucherType = journal.voucher_type
  const firstDebit = journal.debit_entries?.[0]?.account ?? null
  const firstCredit = journal.credit_entries?.[0]?.account ?? null
  const vtMsg = voucherType && firstDebit && firstCredit ? validateByVoucherType(voucherType, journal) : null
  if (vtMsg) {
    addLabel('VOUCHER_TYPE_CONFLICT', vtMsg)
  } else {
    removeLabel('VOUCHER_TYPE_CONFLICT')
  }

  // 9. TAX_ACCOUNT_MISMATCH
  const allEntries = [...journal.debit_entries, ...journal.credit_entries]
  let hasTaxAccountMismatch = false
  for (const entry of allEntries) {
    if (!entry.account || !entry.tax_category_id) continue
    const acct = accounts.find(a => a.id === entry.account)
    if (!acct) continue
    const taxCat = taxCategories.find(t => t.id === entry.tax_category_id)
    if (!taxCat) continue
    if (acct.taxDetermination === 'fixed') {
      if (acct.defaultTaxCategoryId) {
        const defaultTax = taxCategories.find(t => t.id === acct.defaultTaxCategoryId)
        if (defaultTax && taxCat.id !== defaultTax.id) {
          hasTaxAccountMismatch = true
          break
        }
      }
    } else if (acct.taxDetermination === 'auto_purchase') {
      if (taxCat.direction === 'sales') {
        hasTaxAccountMismatch = true
        break
      }
    } else if (acct.taxDetermination === 'auto_sales') {
      if (taxCat.direction === 'purchase') {
        hasTaxAccountMismatch = true
        break
      }
    }
  }
  if (hasTaxAccountMismatch) addLabel('TAX_ACCOUNT_MISMATCH', '科目に設定された税区分と異なる税区分が使用されています')
  else removeLabel('TAX_ACCOUNT_MISMATCH')

  return { addedLabels, removedLabels }
}
