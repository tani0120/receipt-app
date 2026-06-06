/**
 * journalValidationCore.ts — 仕訳バリデーションコアロジック（SSOT）
 *
 * A（api/services/journalValidation.ts）・B（utils/journalWarningSync.ts）・
 * C（JournalListLevel3Mock.vue内ローカル）の3系統を統合。
 *
 * 設計方針:
 *   - 最小インターフェースで型を定義（JournalPhase5Mockの全フィールドは不要）
 *   - labels を直接 mutate する破壊的方式（フロントのリアクティブ性に必要）
 *   - API側は呼び出し前に labels をコピーすれば非破壊にできる
 *   - セルハイライト情報を SyncWarningResult に含めて返す
 */

import { getBaseAccountId } from '../../data/master/voucherTypeRules'
import type { VoucherTypeRule } from '../../data/master/voucherTypeRules'
import {
  WARN_SALES_DEBIT, WARN_EXPENSE_CREDIT,
  WARN_SALES_SALES, WARN_EXPENSE_EXPENSE,
  WARN_SALES_EXPENSE, WARN_EXPENSE_SALES,
  WARN_EQUITY_SALES, WARN_EQUITY_EXPENSE,
  WARN_SALES_EQUITY, WARN_EXPENSE_EQUITY, WARN_EQUITY_EQUITY,
  warnVoucherTypeDebit, warnVoucherTypeCredit,
  warnAccountUnknown, warnTaxEmpty, warnTaxUnknown,
  WARN_DESCRIPTION_EMPTY, WARN_DATE_EMPTY,
  warnAmountEmpty, warnDebitCreditMismatch,
  warnSameAccountBothSides, WARN_TAX_ACCOUNT_MISMATCH,
  SIDE_DEBIT, SIDE_CREDIT, sideAccountLabel, sideRowLabel,
  warnFutureDate,
  warnDateOutOfRange,
  warnDirectorLoan,
  warnAutoInvoiceSmall,
} from '../../constants/validationMessages'
import { INVOICE_TRANSITION_0_DATE } from '../../constants/mfApiConstants'

// ────────────────────────────────────────────
// 型定義（正式型からPick — 乖離を構造的に防止）
// ────────────────────────────────────────────

import type { Account } from '../../types/shared-account'
import type { TaxCategory } from '../../types/shared-tax-category'

/** バリデーション用の勘定科目最小インターフェース（Account型からPick） */
export type AccountForValidation = Pick<Account,
  'accountId' | 'accountGroup' | 'category' | 'taxDetermination' |
  'defaultTaxCategoryId' | 'isContraRevenue' | 'isContraExpense'
>

/** バリデーション用の税区分最小インターフェース（TaxCategory型からPick） */
export type TaxCategoryForValidation = Pick<TaxCategory,
  'taxCategoryId' | 'direction' | 'simplifiedOnly' | 'baseId' | 'isExemptDefault' | 'isUnknownDefault'
>

/** 5分類グループ型 */
export type MegaGroupType = 'sales' | 'expense' | 'bs_al' | 'bs_equity' | null

/** バリデーション用の仕訳エントリ行（最小インターフェース） */
export interface JournalEntryForValidation {
  account: string | null
  tax_category_id: string | null | undefined
  amount: number | null
}

/**
 * バリデーション用の仕訳（最小インターフェース）
 *
 * JournalPhase5Mock はこのインターフェースの全フィールドを持つため、
 * TypeScriptの構造的型付けによりキャストなしで渡せる。
 */
export interface JournalForValidation {
  journalId: string
  voucher_date: string | null
  description: string | null
  voucher_type: string | null
  debit_entries: JournalEntryForValidation[]
  credit_entries: JournalEntryForValidation[]
  labels: string[]
  warning_dismissals?: string[]
  warning_details?: Record<string, string>
  /** インボイスステータス（少額特例判定用。オプショナル） */
  invoice_status?: string | null
}

/**
 * バリデーション用の顧問先コンテキスト（オプショナル）
 * DATE_OUT_OF_RANGE, DIRECTOR_LOAN, AUTO_INVOICE_SMALL の判定に使用。
 */
export interface ValidationContext {
  /** 決算月（1-12）。個人事業主=12。 */
  fiscalMonth?: number
  /** 役員貸付金として検出する科目IDリスト */
  directorLoanAccountIds?: string[]
}

/** syncWarningLabelsCore の返り値 */
export interface SyncWarningResult {
  /** 今回追加されたラベル */
  addedLabels: string[]
  /** 今回除去されたラベル */
  removedLabels: string[]
  /** #7 貸借科目矛盾の対象科目（セルハイライト用） */
  categoryConflicts: { debit: Set<string>; credit: Set<string> }
  /** #8 証票意味矛盾の対象科目（セルハイライト用） */
  voucherTypeConflicts: { debit: Set<string>; credit: Set<string> }
  /** #7b 借方貸方に同一科目（セルハイライト用） */
  sameAccountBothSides: Set<string>
}

// ────────────────────────────────────────────
// 定数 — なし（全てマスタ駆動に移行済み）
// ────────────────────────────────────────────

// ────────────────────────────────────────────
// 課税方式×税区分矛盾判定（共通関数）
// ────────────────────────────────────────────

/**
 * 税区分が課税方式と矛盾するかを判定（データ駆動）
 *
 * IDパターンマッチ（`_T[1-6]`）に依存せず、`simplifiedOnly`フラグで判定。
 * 顧問先独自追加の税区分でも正確に動作する。
 *
 * @param taxCategoryId - 判定対象の税区分ID
 * @param consumptionTaxMode - 顧問先の課税方式
 * @param taxCategories - 税区分マスタ
 * @returns true = 矛盾あり
 */
export function isTaxCategoryInvalidForMode(
  taxCategoryId: string,
  consumptionTaxMode: string,
  taxCategories: TaxCategoryForValidation[]
): boolean {
  if (consumptionTaxMode === 'exempt') {
    // 免税事業者: isUnknownDefault=trueの税区分（不明）は税区分未確定の一時保存用として有効
    const unknownDefault = taxCategories.find(t => t.isUnknownDefault)
    if (unknownDefault && taxCategoryId === unknownDefault.taxCategoryId) return false
    // isExemptDefault=trueの税区分（対象外）以外は不正
    const exemptDefault = taxCategories.find(t => t.isExemptDefault)
    return exemptDefault ? taxCategoryId !== exemptDefault.taxCategoryId : true
  }
  if (consumptionTaxMode === 'individual' || consumptionTaxMode === 'proportional') {
    // 原則課税: 簡易課税専用の税区分は不正
    const tc = taxCategories.find(t => t.taxCategoryId === taxCategoryId)
    return tc?.simplifiedOnly === true
  }
  return false
}

/**
 * 課税方式矛盾時の修正先税区分IDを解決する
 *
 * - 免税 → isExemptDefault=trueの税区分ID（データ駆動）
 * - 原則課税 → simplifiedOnly=trueの税区分に対応する原則用を返す
 *   方法: IDからサフィックス(_T1〜_T6)を除去して原則用IDを検索
 *   見つからなければ元のIDをそのまま返す
 *
 * @param taxCategoryId - 現在の（矛盾している）税区分ID
 * @param consumptionTaxMode - 顧問先の課税方式
 * @param taxCategories - 税区分マスタ
 * @returns 修正先の税区分ID
 */
export function resolveValidTaxCategoryForMode(
  taxCategoryId: string,
  consumptionTaxMode: string,
  taxCategories: TaxCategoryForValidation[]
): string {
  if (consumptionTaxMode === 'exempt') {
    // データ駆動: isExemptDefault=trueの税区分IDを返す
    const exemptDefault = taxCategories.find(t => t.isExemptDefault)
    return exemptDefault ? exemptDefault.taxCategoryId : taxCategoryId
  }
  if (consumptionTaxMode === 'individual' || consumptionTaxMode === 'proportional') {
    // データ駆動: baseIdフィールドで原則用税区分を直接参照
    const tc = taxCategories.find(t => t.taxCategoryId === taxCategoryId)
    if (tc?.baseId) return tc.baseId
  }
  return taxCategoryId
}

/**
 * 免税事業者のデフォルト税区分IDを取得する（データ駆動）
 *
 * マスタで`isExemptDefault: true`の税区分IDを返す。
 * 見つからない場合はフォールバックとして空文字を返す。
 */
export function getExemptDefaultTaxCategoryId(
  taxCategories: TaxCategoryForValidation[]
): string {
  const exemptDefault = taxCategories.find(t => t.isExemptDefault)
  return exemptDefault ? exemptDefault.taxCategoryId : ''
}

// ────────────────────────────────────────────
// 5分類判定
// ────────────────────────────────────────────

/** 勘定科目IDから5分類グループを判定（accountGroupベース） */
export function getMegaGroup(accountName: string | null, accounts: AccountForValidation[]): MegaGroupType {
  if (!accountName) return null
  const acc = accounts.find(a => a.accountId === accountName)
  if (!acc) return null
  if (acc.accountGroup === 'PL_REVENUE') return 'sales'
  if (acc.accountGroup === 'PL_EXPENSE') return 'expense'
  if (acc.accountGroup === 'BS_EQUITY') return 'bs_equity'
  if (acc.accountGroup === 'BS_ASSET' || acc.accountGroup === 'BS_LIABILITY') return 'bs_al'
  return null
}

/** 逆仕訳科目（売上返品・仕入返品）の判定（データ駆動。マスタのフラグで判定） */
function isContraAccount(accountName: string | null, accounts: AccountForValidation[]): { isContraRevenue: boolean; isContraExpense: boolean } {
  if (!accountName) return { isContraRevenue: false, isContraExpense: false }
  const acc = accounts.find(a => a.accountId === accountName)
  if (!acc) return { isContraRevenue: false, isContraExpense: false }
  return {
    isContraRevenue: acc.isContraRevenue === true,
    isContraExpense: acc.isContraExpense === true,
  }
}

// ────────────────────────────────────────────
// 貸借組合せチェック
// ────────────────────────────────────────────

/**
 * 借方/貸方の5分類バリデーション（逆仕訳例外付き）
 *
 * @returns null=正常、string=警告メッセージ
 */
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
    return WARN_SALES_DEBIT
  }
  if (debitGroup === 'bs_al' && creditGroup === 'expense') {
    const { isContraExpense } = isContraAccount(creditAccount ?? null, accounts)
    if (isContraExpense) return null
    return WARN_EXPENSE_CREDIT
  }

  // 不正パターン
  if (debitGroup === 'sales' && creditGroup === 'sales') return WARN_SALES_SALES
  if (debitGroup === 'expense' && creditGroup === 'expense') return WARN_EXPENSE_EXPENSE
  if (debitGroup === 'sales' && creditGroup === 'expense') return WARN_SALES_EXPENSE
  if (debitGroup === 'expense' && creditGroup === 'sales') return WARN_EXPENSE_SALES
  if (debitGroup === 'bs_equity' && creditGroup === 'sales') return WARN_EQUITY_SALES
  if (debitGroup === 'bs_equity' && creditGroup === 'expense') return WARN_EQUITY_EXPENSE
  if (debitGroup === 'sales' && creditGroup === 'bs_equity') return WARN_SALES_EQUITY
  if (debitGroup === 'expense' && creditGroup === 'bs_equity') return WARN_EXPENSE_EQUITY
  if (debitGroup === 'bs_equity' && creditGroup === 'bs_equity') return WARN_EQUITY_EQUITY

  return null
}

// ────────────────────────────────────────────
// 証票意味ルールチェック
// ────────────────────────────────────────────

/**
 * 証票意味ルールに基づく科目チェック（ホワイトリスト方式）
 * VOUCHER_TYPE_RULES テーブルを参照し、借方・貸方の各科目が許容範囲内かを検証する。
 */
export function validateByVoucherType(
  voucherType: string,
  journal: JournalForValidation,
  accounts: AccountForValidation[],
  voucherRules: Record<string, VoucherTypeRule>
): string | null {
  const rule = voucherRules[voucherType]
  if (!rule) return null // ルール未定義の証票意味はスキップ

  const accountMap = new Map(accounts.map(a => [a.accountId, a]))

  function isAllowed(accountId: string, sideRule: { allowedGroups?: string[]; allowedIds?: string[]; allowedCategories?: string[] }): boolean {
    // allowedIdsに含まれていればOK（コピー元IDも照合）
    if (sideRule.allowedIds) {
      if (sideRule.allowedIds.includes(accountId)) return true
      const baseId = getBaseAccountId(accountId)
      if (baseId !== accountId && sideRule.allowedIds.includes(baseId)) return true
    }
    // allowedGroupsでaccountGroupが一致すればOK
    if (sideRule.allowedGroups) {
      const acc = accountMap.get(accountId)
      if (acc?.accountGroup && sideRule.allowedGroups.includes(acc.accountGroup)) return true
    }
    // allowedCategoriesでcategoryが一致すればOK
    if (sideRule.allowedCategories) {
      const acc = accountMap.get(accountId)
      if (acc?.category && sideRule.allowedCategories.includes(acc.category)) return true
    }
    return false
  }

  // 借方チェック
  for (const entry of journal.debit_entries) {
    if (!entry.account) continue
    if (!isAllowed(entry.account, rule.debit)) {
      return warnVoucherTypeDebit(voucherType, entry.account)
    }
  }

  // 貸方チェック
  for (const entry of journal.credit_entries) {
    if (!entry.account) continue
    if (!isAllowed(entry.account, rule.credit)) {
      return warnVoucherTypeCredit(voucherType, entry.account)
    }
  }

  return null
}

// ────────────────────────────────────────────
// 矛盾科目特定（セルハイライト用）
// ────────────────────────────────────────────

/**
 * 証票意味バリデーションで矛盾する科目IDを返す（セルハイライト用）
 */
export function getVoucherTypeConflictAccounts(
  voucherType: string,
  journal: JournalForValidation,
  accounts: AccountForValidation[],
  voucherRules: Record<string, VoucherTypeRule>
): { debit: Set<string>; credit: Set<string> } {
  const result = { debit: new Set<string>(), credit: new Set<string>() }
  const rule = voucherRules[voucherType]
  if (!rule) return result

  const accountMap = new Map(accounts.map(a => [a.accountId, a]))

  function isAllowed(accountId: string, sideRule: { allowedGroups?: string[]; allowedIds?: string[]; allowedCategories?: string[] }): boolean {
    if (sideRule.allowedIds) {
      if (sideRule.allowedIds.includes(accountId)) return true
      const baseId = getBaseAccountId(accountId)
      if (baseId !== accountId && sideRule.allowedIds.includes(baseId)) return true
    }
    if (sideRule.allowedGroups) {
      const acc = accountMap.get(accountId)
      if (acc?.accountGroup && sideRule.allowedGroups.includes(acc.accountGroup)) return true
    }
    if (sideRule.allowedCategories) {
      const acc = accountMap.get(accountId)
      if (acc?.category && sideRule.allowedCategories.includes(acc.category)) return true
    }
    return false
  }

  for (const entry of journal.debit_entries) {
    if (!entry.account) continue
    if (!isAllowed(entry.account, rule.debit)) result.debit.add(entry.account)
  }
  for (const entry of journal.credit_entries) {
    if (!entry.account) continue
    if (!isAllowed(entry.account, rule.credit)) result.credit.add(entry.account)
  }
  return result
}

// ────────────────────────────────────────────
// syncWarningLabelsCore（統合バリデーション）
// ────────────────────────────────────────────

/**
 * 仕訳の警告ラベルを同期する（10種チェック + セルハイライト情報）
 *
 * journal.labels を直接 mutate する。
 * API側で非破壊にしたい場合は、呼び出し前に labels をコピーすること。
 *
 * @param journal - バリデーション対象の仕訳
 * @param accounts - 勘定科目マスタ
 * @param taxCategories - 税区分マスタ
 * @returns 追加/除去されたラベル + セルハイライト情報
 */
export function syncWarningLabelsCore(
  journal: JournalForValidation,
  accounts: AccountForValidation[],
  taxCategories: TaxCategoryForValidation[],
  voucherRules: Record<string, VoucherTypeRule> = {},
  context?: ValidationContext
): SyncWarningResult {
  const labels = journal.labels
  const addedLabels: string[] = []
  const removedLabels: string[] = []

  // 警告詳細を初期化（存在しない場合）
  if (!journal.warning_details) {
    journal.warning_details = {}
  }
  const details = journal.warning_details

  const dismissals = journal.warning_dismissals ?? []

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

  // ── 1. ACCOUNT_UNKNOWN（科目不明） ──
  const accountIds = new Set(accounts.map(a => a.accountId))
  const isValidAccount = (id: string | null) => id != null && id !== '' && accountIds.has(id)
  const unknownAccounts = [
    ...journal.debit_entries.filter(e => !isValidAccount(e.account)).map(e => sideAccountLabel(SIDE_DEBIT, e.account)),
    ...journal.credit_entries.filter(e => !isValidAccount(e.account)).map(e => sideAccountLabel(SIDE_CREDIT, e.account)),
  ]
  if (unknownAccounts.length === 0) removeLabel('ACCOUNT_UNKNOWN')
  else addLabel('ACCOUNT_UNKNOWN', warnAccountUnknown(unknownAccounts))

  // ── 2. TAX_UNKNOWN（税区分不明 or マスタ未存在） ──
  const taxCategoryIds = new Set(taxCategories.map(t => t.taxCategoryId))
  const emptyTaxEntries = [
    ...journal.debit_entries.filter(e => !e.tax_category_id).map((_, i) => warnTaxEmpty(SIDE_DEBIT, i + 1)),
    ...journal.credit_entries.filter(e => !e.tax_category_id).map((_, i) => warnTaxEmpty(SIDE_CREDIT, i + 1)),
  ]
  const unknownTaxEntries = [
    ...journal.debit_entries.filter(e => e.tax_category_id && !taxCategoryIds.has(e.tax_category_id)).map(e => sideAccountLabel(SIDE_DEBIT, e.tax_category_id ?? null)),
    ...journal.credit_entries.filter(e => e.tax_category_id && !taxCategoryIds.has(e.tax_category_id)).map(e => sideAccountLabel(SIDE_CREDIT, e.tax_category_id ?? null)),
  ]
  if (emptyTaxEntries.length === 0 && unknownTaxEntries.length === 0) {
    removeLabel('TAX_UNKNOWN')
  } else {
    const msgs: string[] = []
    if (emptyTaxEntries.length > 0) msgs.push(...emptyTaxEntries)
    if (unknownTaxEntries.length > 0) msgs.push(warnTaxUnknown(unknownTaxEntries))
    addLabel('TAX_UNKNOWN', msgs.join('。'))
  }

  // ── 3. DESCRIPTION_UNKNOWN（摘要なし） ──
  if (journal.description != null && journal.description !== '') removeLabel('DESCRIPTION_UNKNOWN')
  else addLabel('DESCRIPTION_UNKNOWN', WARN_DESCRIPTION_EMPTY)

  // ── 4. DATE_UNKNOWN（日付なし） ──
  if (journal.voucher_date != null && journal.voucher_date !== '') removeLabel('DATE_UNKNOWN')
  else addLabel('DATE_UNKNOWN', WARN_DATE_EMPTY)

  // ── 5. AMOUNT_UNCLEAR（金額未設定） ──
  const emptyAmountEntries = [
    ...journal.debit_entries.filter(e => e.amount == null).map((_, i) => sideRowLabel(SIDE_DEBIT, i + 1)),
    ...journal.credit_entries.filter(e => e.amount == null).map((_, i) => sideRowLabel(SIDE_CREDIT, i + 1)),
  ]
  if (emptyAmountEntries.length === 0) removeLabel('AMOUNT_UNCLEAR')
  else addLabel('AMOUNT_UNCLEAR', warnAmountEmpty(emptyAmountEntries))

  // ── 6. DEBIT_CREDIT_MISMATCH（貸借不一致） ──
  const debitSum = journal.debit_entries.reduce((s, e) => s + (e.amount ?? 0), 0)
  const creditSum = journal.credit_entries.reduce((s, e) => s + (e.amount ?? 0), 0)
  if (debitSum === creditSum && debitSum > 0) removeLabel('DEBIT_CREDIT_MISMATCH')
  else addLabel('DEBIT_CREDIT_MISMATCH', warnDebitCreditMismatch(debitSum.toLocaleString(), creditSum.toLocaleString()))

  // ── 7. CATEGORY_CONFLICT（5分類矛盾） + セルハイライト ──
  const categoryConflictDebit = new Set<string>()
  const categoryConflictCredit = new Set<string>()
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
          categoryConflictDebit.add(dAcct)
          categoryConflictCredit.add(cAcct)
          conflictDetail = `${dAcct}×${cAcct}: ${msg}`
        }
      }
    }
  }
  if (categoryConflictDebit.size > 0 || categoryConflictCredit.size > 0) {
    addLabel('CATEGORY_CONFLICT', conflictDetail)
  } else {
    removeLabel('CATEGORY_CONFLICT')
  }

  // ── 7b. SAME_ACCOUNT_BOTH_SIDES（借方貸方に同一科目） ──
  const debitAccountSet = new Set(journal.debit_entries.map(e => e.account).filter((v): v is string => v != null))
  const creditAccountSet = new Set(journal.credit_entries.map(e => e.account).filter((v): v is string => v != null))
  const sameAccounts = [...debitAccountSet].filter(a => creditAccountSet.has(a))
  const sameAccountSet = new Set(sameAccounts)
  if (sameAccounts.length > 0) addLabel('SAME_ACCOUNT_BOTH_SIDES', warnSameAccountBothSides(sameAccounts))
  else removeLabel('SAME_ACCOUNT_BOTH_SIDES')

  // ── 8. VOUCHER_TYPE_CONFLICT（証票意味矛盾） + セルハイライト ──
  const voucherType = journal.voucher_type
  const firstDebit = journal.debit_entries?.[0]?.account ?? null
  const firstCredit = journal.credit_entries?.[0]?.account ?? null
  const vtMsg = voucherType && firstDebit && firstCredit ? validateByVoucherType(voucherType, journal, accounts, voucherRules) : null
  let vtConflicts = { debit: new Set<string>(), credit: new Set<string>() }
  if (vtMsg) {
    addLabel('VOUCHER_TYPE_CONFLICT', vtMsg)
    vtConflicts = getVoucherTypeConflictAccounts(voucherType!, journal, accounts, voucherRules)
  } else {
    removeLabel('VOUCHER_TYPE_CONFLICT')
  }

  // ── 9. TAX_ACCOUNT_MISMATCH（科目×税区分不整合） ──
  const allEntries = [...journal.debit_entries, ...journal.credit_entries]
  let hasTaxAccountMismatch = false
  for (const entry of allEntries) {
    if (!entry.account || !entry.tax_category_id) continue
    const acct = accounts.find(a => a.accountId === entry.account)
    if (!acct) continue
    const taxCat = taxCategories.find(t => t.taxCategoryId === entry.tax_category_id)
    if (!taxCat) continue
    if (acct.taxDetermination === 'fixed') {
      if (acct.defaultTaxCategoryId) {
        const defaultTax = taxCategories.find(t => t.taxCategoryId === acct.defaultTaxCategoryId)
        if (defaultTax && taxCat.taxCategoryId !== defaultTax.taxCategoryId) {
          hasTaxAccountMismatch = true
          break
        }
      }
    } else if (acct.taxDetermination === 'auto_purchase') {
      if (taxCat.direction === 'sales') { hasTaxAccountMismatch = true; break }
    } else if (acct.taxDetermination === 'auto_sales') {
      if (taxCat.direction === 'purchase') { hasTaxAccountMismatch = true; break }
    }
  }
  if (hasTaxAccountMismatch) addLabel('TAX_ACCOUNT_MISMATCH', WARN_TAX_ACCOUNT_MISMATCH)
  else removeLabel('TAX_ACCOUNT_MISMATCH')

  // ── 10. FUTURE_DATE（未来日付） ──
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
  if (journal.voucher_date != null && journal.voucher_date !== '' && journal.voucher_date >= tomorrowStr) {
    addLabel('FUTURE_DATE', warnFutureDate(journal.voucher_date))
  } else {
    removeLabel('FUTURE_DATE')
  }

  // ── 11. DATE_OUT_OF_RANGE（期外日付） ──
  if (context?.fiscalMonth && journal.voucher_date != null && journal.voucher_date !== '') {
    const fm = context.fiscalMonth
    const vd = new Date(journal.voucher_date)
    // 決算月から会計年度の開始月を計算（決算月の翌月が開始月）
    // 例: 3月決算 → 4月開始、12月決算 → 1月開始
    const fyStartMonth = fm === 12 ? 0 : fm // 0-indexed（0=1月）
    // 今日の日付から当期を判定
    const todayDate = new Date()
    let fyStartYear = todayDate.getFullYear()
    // 現在の月が会計年度開始月より前なら、前年開始の会計年度
    if (todayDate.getMonth() < fyStartMonth) {
      fyStartYear -= 1
    }
    const fyStart = new Date(fyStartYear, fyStartMonth, 1)
    const fyEnd = new Date(fyStartYear + 1, fyStartMonth, 0) // 決算月末日
    if (vd < fyStart || vd > fyEnd) {
      const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      addLabel('DATE_OUT_OF_RANGE', warnDateOutOfRange(journal.voucher_date, fmtDate(fyStart), fmtDate(fyEnd)))
    } else {
      removeLabel('DATE_OUT_OF_RANGE')
    }
  } else {
    // コンテキストなし → チェックしない（既存ラベルがあれば維持）
  }

  // ── 12. DIRECTOR_LOAN（役員貸付金検出） ──
  const dlAccountIds = context?.directorLoanAccountIds ?? ['OFFICER_LOANS']
  const dlEntries = [
    ...journal.debit_entries.filter(e => e.account != null && dlAccountIds.includes(e.account)).map(e => warnDirectorLoan('借方', e.account!)),
    ...journal.credit_entries.filter(e => e.account != null && dlAccountIds.includes(e.account)).map(e => warnDirectorLoan('貸方', e.account!)),
  ]
  if (dlEntries.length > 0) {
    addLabel('DIRECTOR_LOAN', dlEntries.join('。'))
  } else {
    removeLabel('DIRECTOR_LOAN')
  }

  // ── 13. AUTO_INVOICE_SMALL（少額自動適格判定） ──
  // 条件: 税込金額 < 10,000 && インボイスステータス未設定 && 少額特例期間内（〜2029/09/30）
  const SMALL_INVOICE_THRESHOLD = 10000
  const SMALL_INVOICE_DEADLINE = INVOICE_TRANSITION_0_DATE
  const totalAmount = Math.max(
    journal.debit_entries.reduce((s, e) => s + (e.amount ?? 0), 0),
    journal.credit_entries.reduce((s, e) => s + (e.amount ?? 0), 0)
  )
  const isSmallInvoiceEligible =
    totalAmount > 0 &&
    totalAmount < SMALL_INVOICE_THRESHOLD &&
    !journal.invoice_status &&
    (journal.voucher_date == null || journal.voucher_date < SMALL_INVOICE_DEADLINE)
  if (isSmallInvoiceEligible) {
    addLabel('AUTO_INVOICE_SMALL', warnAutoInvoiceSmall(totalAmount.toLocaleString()))
  } else {
    removeLabel('AUTO_INVOICE_SMALL')
  }

  return {
    addedLabels,
    removedLabels,
    categoryConflicts: { debit: categoryConflictDebit, credit: categoryConflictCredit },
    voucherTypeConflicts: vtConflicts,
    sameAccountBothSides: sameAccountSet,
  }
}
