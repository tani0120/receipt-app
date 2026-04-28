/**
 * accountDetermination.ts — 科目確定コア関数（Step4-C 辞書接続）
 *
 * 27_account_determination.md §1 のフロー第一層〜第四層を実装。
 *
 * フロー:
 *   第一層: T番号完全一致 → 即確定
 *   第二層: normalizeVendorName → match_key完全一致 → 取引先特定
 *   第三層-①: 学習ルール照合 → テンプレート仕訳適用
 *   第三層-②: 全社マスタの debit_account → 一意なら自動確定
 *   第四層: 業種ベクトル → 業種辞書 → 科目候補提示
 *
 * 設計原則:
 *   - Repository経由でデータ取得（Supabase移行時に差し替え可能）
 *   - ロジック内にデータ直接参照なし（DL-030準拠）
 *   - 結果は prediction_method に推定方法を記録（トレーサビリティ）
 */

import type { Vendor } from '@/mocks/types/pipeline/vendor.type'
import type { JournalEntryLine } from '@/domain/types/journal'
import type { LearningRule, LearningRuleEntryLine } from '@/mocks/types/learning_rule.type'
import { normalizeVendorName } from './vendorIdentification'
import { validateTNumber, extractTNumber } from './vendorIdentification'
import { matchLearningRule } from './matchLearningRule'
import { VENDORS_GLOBAL } from '@/mocks/data/pipeline/vendors_global'

// ============================================================
// § 結果型
// ============================================================

/** 科目確定の結果 */
export interface AccountDeterminationResult {
  /** 特定された取引先ID（vendors_global/client の vendor_id） */
  vendorId: string | null
  /** 取引先名（表示用。照合成功時はマスタ正式名、失敗時はAI抽出名） */
  vendorName: string | null
  /** 確定科目（ACCOUNT_MASTER ID） */
  determinedAccount: string | null
  /** 税区分 */
  taxCategory: string | null
  /** 補助科目 */
  subAccount: string | null
  /** 部門 */
  department: string | null
  /** 適用された学習ルールID */
  ruleId: string | null
  /** 確定レベル */
  level: 'A' | 'insufficient'
  /** 推定方法 */
  predictionMethod: 't_number' | 'match_key' | 'learning_rule' | 'industry_vector' | null
  /** 科目候補 */
  candidates: string[]
  /** 借方仕訳行（学習ルール適用時の複合仕訳用） */
  debitEntries: JournalEntryLine[]
  /** 貸方仕訳行（学習ルール適用時の複合仕訳用） */
  creditEntries: JournalEntryLine[]
}

// ============================================================
// § UUID生成ヘルパー（仕訳行ID用）
// ============================================================

function generateJournalEntryId(): string {
  // Node.js環境（サーバー側）: crypto.randomUUID() を使用
  try {
    return `jre-${crypto.randomUUID()}`
  } catch {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
    return `jre-${uuid}`
  }
}

// ============================================================
// § 学習ルールテンプレート → JournalEntryLine[] 展開
// ============================================================

/**
 * 学習ルールのテンプレート行を JournalEntryLine に展開する
 *
 * 金額タイプの3択（§3-2準拠）:
 *   auto:  単一仕訳=証憑金額、複合仕訳=他行との差額
 *   total: 証憑記載の金額をそのまま使用
 *   fixed: fixedAmountに指定した金額を常に使用
 */
function expandRuleEntries(
  rule: LearningRule,
  amount: number,
  side: 'debit' | 'credit',
): JournalEntryLine[] {
  const entries = rule.entries
    .filter(e => e.side === side)
    .sort((a, b) => a.displayOrder - b.displayOrder)

  return entries.map(e => ({
    id: generateJournalEntryId(),
    account: e.account,
    account_on_document: false, // ルール適用 = 証憑由来ではない
    sub_account: e.subAccount,
    department: e.department,
    amount: resolveAmount(e, amount, entries),
    amount_on_document: true,  // 金額は証憑から取得
    tax_category_id: e.taxCategory,
  }))
}

/**
 * テンプレート行の金額を解決する
 */
function resolveAmount(
  entry: LearningRuleEntryLine,
  totalAmount: number,
  allEntries: LearningRuleEntryLine[],
): number {
  switch (entry.amountType) {
    case 'total':
      return totalAmount
    case 'fixed':
      return entry.fixedAmount ?? 0
    case 'auto':
    default: {
      // auto: 他のfixed行の合計を引いた残り
      const fixedSum = allEntries
        .filter(e => e.id !== entry.id && e.amountType === 'fixed' && e.fixedAmount)
        .reduce((sum, e) => sum + (e.fixedAmount ?? 0), 0)
      return Math.max(0, totalAmount - fixedSum)
    }
  }
}

// ============================================================
// § メイン関数
// ============================================================

/**
 * 科目確定メイン関数
 *
 * 第一層 → 第二層 → 第三層 → 第四層 の順にフォールバック。
 * 最初にヒットした層で確定し、以降の層はスキップする。
 *
 * @param vendorNameRaw - AI抽出の取引先名（生テキスト。issuer_name）
 * @param description - 摘要テキスト（line_item.description）
 * @param amount - 取引金額（円・整数）
 * @param direction - 入出金方向（'expense' | 'income'）
 * @param sourceType - 証票種別（SourceType 11種）
 * @param clientId - 顧問先ID
 * @param tNumberRaw - T番号（生テキスト。invoiceNumber等）
 */
export function determineAccount(
  vendorNameRaw: string | null,
  description: string,
  amount: number,
  direction: 'expense' | 'income',
  sourceType: string | null,
  clientId: string,
  tNumberRaw: string | null = null,
): AccountDeterminationResult {
  // 初期値
  const result: AccountDeterminationResult = {
    vendorId: null,
    vendorName: vendorNameRaw, // デフォルト: AI抽出名
    determinedAccount: null,
    taxCategory: null,
    subAccount: null,
    department: null,
    ruleId: null,
    level: 'insufficient',
    predictionMethod: null,
    candidates: [],
    debitEntries: [],
    creditEntries: [],
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 第一層: T番号完全一致
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (tNumberRaw) {
    const tNumber = validateTNumber(tNumberRaw) ?? extractTNumber(tNumberRaw)
    if (tNumber) {
      const vendor = VENDORS_GLOBAL.find(v => v.t_numbers.includes(tNumber))
      if (vendor) {
        applyVendor(result, vendor, 't_number', amount, direction)
        return result
      }
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 第二層: normalizeVendorName → match_key完全一致
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let matchedVendor: Vendor | undefined

  if (vendorNameRaw) {
    const matchKey = normalizeVendorName(vendorNameRaw)
    if (matchKey) {
      // match_key完全一致
      matchedVendor = VENDORS_GLOBAL.find(v => v.match_key === matchKey)

      // aliases照合（match_key不一致の場合、aliasesの中に一致するものがあるか）
      if (!matchedVendor) {
        matchedVendor = VENDORS_GLOBAL.find(v =>
          v.aliases.includes(matchKey),
        )
      }
    }
  }

  // 摘要テキストからも照合試行（vendorNameRawが取れなかった場合のフォールバック）
  if (!matchedVendor && description) {
    const descKey = normalizeVendorName(description)
    if (descKey) {
      matchedVendor = VENDORS_GLOBAL.find(v => v.match_key === descKey)
      if (!matchedVendor) {
        matchedVendor = VENDORS_GLOBAL.find(v =>
          v.aliases.includes(descKey),
        )
      }
    }
  }

  if (matchedVendor) {
    result.vendorId = matchedVendor.vendor_id
    result.vendorName = matchedVendor.company_name
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 第三層-①: 学習ルール照合
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const rule = matchLearningRule(description, amount, direction, sourceType, clientId)
  if (rule) {
    result.ruleId = rule.id
    result.predictionMethod = 'learning_rule'
    result.level = 'A'
    result.debitEntries = expandRuleEntries(rule, amount, 'debit')
    result.creditEntries = expandRuleEntries(rule, amount, 'credit')

    // 借方の最初の行から科目情報を取得
    const firstDebit = result.debitEntries[0]
    if (firstDebit) {
      result.determinedAccount = firstDebit.account
      result.taxCategory = firstDebit.tax_category_id
      result.subAccount = firstDebit.sub_account
      result.department = firstDebit.department
    }
    result.candidates = [result.determinedAccount!].filter(Boolean)
    return result
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 第三層-②: 全社マスタの debit_account
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (matchedVendor) {
    // 金額閾値チェック
    const account = resolveVendorAccount(matchedVendor, amount)
    if (account) {
      result.determinedAccount = account
      result.taxCategory = matchedVendor.debit_tax_category
      result.subAccount = matchedVendor.debit_sub_account
      result.department = matchedVendor.debit_department
      result.level = 'A'
      result.predictionMethod = 'match_key'
      result.candidates = [account]
      return result
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 第四層: 業種ベクトル → 業種辞書
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (matchedVendor?.vendor_vector) {
    // TODO: IndustryVectorRepository.findByVector() でDB照合
    // 現時点ではvendor_vectorのみ設定し、科目候補はUIに任せる
    result.predictionMethod = 'industry_vector'
    // candidates は業種辞書から取得するが、現時点ではRepository未実装
    // → level: 'insufficient' のまま
  }

  return result
}

// ============================================================
// § ヘルパー関数
// ============================================================

/**
 * 取引先マスタヒット時に結果を設定する
 */
function applyVendor(
  result: AccountDeterminationResult,
  vendor: Vendor,
  method: 't_number' | 'match_key',
  amount: number,
  _direction: 'expense' | 'income',
): void {
  result.vendorId = vendor.vendor_id
  result.vendorName = vendor.company_name
  result.predictionMethod = method

  // 金額閾値チェック
  const account = resolveVendorAccount(vendor, amount)
  if (account) {
    result.determinedAccount = account
    result.taxCategory = vendor.debit_tax_category
    result.subAccount = vendor.debit_sub_account
    result.department = vendor.debit_department
    result.level = 'A'
    result.candidates = [account]
  }
}

/**
 * 取引先マスタの金額閾値を考慮して科目を解決する
 *
 * amount_threshold 以下 → debit_account
 * amount_threshold 超  → debit_account_over（設定時）
 */
function resolveVendorAccount(vendor: Vendor, amount: number): string | null {
  if (vendor.debit_account === null) return null

  // 金額閾値なし → debit_account
  if (vendor.amount_threshold === null) return vendor.debit_account

  // 金額閾値あり → 閾値以下は debit_account、超えは debit_account_over
  if (amount <= vendor.amount_threshold) {
    return vendor.debit_account
  }
  return vendor.debit_account_over ?? vendor.debit_account
}
