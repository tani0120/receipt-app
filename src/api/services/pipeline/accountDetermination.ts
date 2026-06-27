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
 *   - 結果は determination_method に推定方法を記録（トレーサビリティ）
 *
 * 移動元: src/utils/pipeline/accountDetermination.ts
 * 移動理由: load_context.md L19「すべてのロジックをAPI化せよ」準拠
 * 変更点:
 *   - 引数をオブジェクト化（DetermineAccountInput）
 *   - learningRules / industryVectors を外部注入（DI）
 *   - 第四層を業種辞書ストアに接続（TODOを実装に置換）
 */

import type { Vendor, IndustryVectorEntry } from '../../../types/pipeline/vendor.type'
import type { JournalEntryLine } from '../../../types/domain-journal'
import type { LearningRule, LearningRuleEntryLine } from '../../../types/learning_rule.type'
import type { DeterminationMethod } from '../../../types/determination-method'
import { normalizeVendorName } from '../../../utils/pipeline/vendorIdentification'
import { validateTNumber, extractTNumber } from '../../../utils/pipeline/vendorIdentification'
import { matchLearningRule } from './matchLearningRule'
import { estimateAccountByAI } from './estimateAccountByAI'
import { getAll as getAllVendors, findByTNumber as findVendorByTNumber, findByMatchKey as findVendorByMatchKey } from '../vendorStore'

// ============================================================
// § 入力型（オブジェクト引数）
// ============================================================

/** 科目確定の入力 */
export interface DetermineAccountInput {
  /** AI抽出の取引先名（生テキスト。issuer_name） */
  vendorNameRaw: string | null
  /** 摘要テキスト（line_item.description） */
  description: string
  /** 取引金額（円・整数） */
  amount: number
  /** 入出金方向 */
  direction: 'expense' | 'income'
  /** 証票種別（SourceType 11種） */
  sourceType: string | null
  /** 顧問先ID */
  clientId: string
  /** T番号（生テキスト。invoiceNumber等） */
  tNumberRaw: string | null
  /** 学習ルール（learningRuleStoreから取得済み） */
  learningRules: LearningRule[]
  /** 業種辞書（industryVectorStoreから取得済み。Client.typeで法人/個人を切り替え） */
  industryVectors: IndustryVectorEntry[]
  /** 顧問先の使用可能科目リスト（AI推定で選択肢として渡す。省略時は第5層スキップ） */
  accountMaster?: { accountId: string; name: string; defaultTaxCategoryId?: string | null }[]
}

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
  /** 確定レベル（A=TS確定、B=AI推定、insufficient=未確定） */
  level: 'A' | 'B' | 'insufficient'
  /** 推定方法 */
  determinationMethod: DeterminationMethod | null
  /** 科目候補 */
  candidates: string[]
  /** AI推定の確信度（0.0〜1.0。第5層ヒット時のみ設定） */
  confidence?: number
  /** 借方仕訳行（学習ルール適用時の複合仕訳用） */
  debitEntries: JournalEntryLine[]
  /** 貸方仕訳行（学習ルール適用時の複合仕訳用） */
  creditEntries: JournalEntryLine[]
  /**
   * 学習ルール由来の摘要（てきよう）
   *
   * ルールのentries[0]の displayName / description / targetMonth から構成。
   * 例: 「ミニストップ 事務用品購入 4月分」
   * nullの場合はLineItem.descriptionをそのまま使用。
   */
  ruleDescription: string | null
}

// ============================================================
// § UUID生成ヘルパー（仕訳行ID用）
// ============================================================

/** @deprecated フロント側の仮ID。サーバーがaddJournals()でjre_XXXXXXXX形式に上書き発番する */
function generateJournalEntryId(): string {
  return `jre-${crypto.randomUUID()}`
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
    entryId: generateJournalEntryId(),
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
        .filter(e => e.entryId !== entry.entryId && e.amountType === 'fixed' && e.fixedAmount)
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
 */
export async function determineAccount(input: DetermineAccountInput): Promise<AccountDeterminationResult> {
  // 初期値
  const result: AccountDeterminationResult = {
    vendorId: null,
    vendorName: input.vendorNameRaw, // デフォルト: AI抽出名
    determinedAccount: null,
    taxCategory: null,
    subAccount: null,
    department: null,
    ruleId: null,
    level: 'insufficient',
    determinationMethod: null,
    candidates: [],
    debitEntries: [],
    creditEntries: [],
    ruleDescription: null,
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 第一層: T番号完全一致
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (input.tNumberRaw) {
    const tNumber = validateTNumber(input.tNumberRaw) ?? extractTNumber(input.tNumberRaw)
    if (tNumber) {
      const vendor = findVendorByTNumber(tNumber)
      if (vendor) {
        applyVendor(result, vendor, 't_number', input.amount, input.direction)
        return result
      }
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 第二層: normalizeVendorName → match_key完全一致
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let matchedVendor: Vendor | undefined

  if (input.vendorNameRaw) {
    const matchKey = normalizeVendorName(input.vendorNameRaw)
    if (matchKey) {
      // match_key完全一致
      matchedVendor = findVendorByMatchKey(matchKey)

      // aliases照合（match_key不一致の場合、aliasesの中に一致するものがあるか）
      if (!matchedVendor) {
        matchedVendor = getAllVendors().find(v =>
          v.aliases.includes(matchKey),
        )
      }
    }
  }

  // 摘要テキストからも照合試行（vendorNameRawが取れなかった場合のフォールバック）
  if (!matchedVendor && input.description) {
    const descKey = normalizeVendorName(input.description)
    if (descKey) {
      matchedVendor = findVendorByMatchKey(descKey)
      if (!matchedVendor) {
        matchedVendor = getAllVendors().find(v =>
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
  const rule = matchLearningRule(
    input.description, input.amount, input.direction,
    input.sourceType, input.clientId, input.learningRules,
  )
  if (rule) {
    result.ruleId = rule.ruleId
    result.determinationMethod = 'learning_rule'
    result.level = 'A'
    result.debitEntries = expandRuleEntries(rule, input.amount, 'debit')
    result.creditEntries = expandRuleEntries(rule, input.amount, 'credit')

    // 借方の最初の行から科目情報を取得
    const firstDebit = result.debitEntries[0]
    if (firstDebit) {
      result.determinedAccount = firstDebit.account
      result.taxCategory = firstDebit.tax_category_id
      result.subAccount = firstDebit.sub_account
      result.department = firstDebit.department
    }
    result.candidates = [result.determinedAccount!].filter(Boolean)

    // 学習ルールの摘要（てきよう）を構成（断絶#15修正）
    // entries[0]のdisplayName / description / targetMonthから組み立て
    const firstEntry = rule.entries.sort((a, b) => a.displayOrder - b.displayOrder)[0]
    if (firstEntry) {
      const parts: string[] = []
      if (firstEntry.displayName) parts.push(firstEntry.displayName)
      if (firstEntry.description) parts.push(firstEntry.description)
      if (firstEntry.targetMonth) parts.push(firstEntry.targetMonth)
      if (parts.length > 0) {
        result.ruleDescription = parts.join(' ')
      }
    }

    return result
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 第三層-②: 全社マスタの debit_account
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (matchedVendor) {
    // 金額閾値チェック（断絶#36修正: direction分岐追加）
    const account = resolveVendorAccount(matchedVendor, input.amount, input.direction)
    if (account) {
      result.determinedAccount = account
      if (input.direction === 'expense') {
        result.taxCategory = matchedVendor.debit_tax_category
        result.subAccount = matchedVendor.debit_sub_account
        result.department = matchedVendor.debit_department
      } else {
        result.taxCategory = matchedVendor.credit_tax_category
        result.subAccount = matchedVendor.credit_sub_account
        result.department = matchedVendor.credit_department
      }
      result.level = 'A'
      result.determinationMethod = 'match_key'
      result.candidates = [account]
      return result
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 第四層: 業種ベクトル → 業種辞書
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (matchedVendor?.vendor_vector && input.industryVectors.length > 0) {
    const entry = input.industryVectors.find(
      e => e.vector === matchedVendor!.vendor_vector
    )
    if (entry) {
      const candidates = input.direction === 'expense'
        ? entry.expense : entry.income
      result.candidates = candidates
      result.determinationMethod = 'industry_vector'
      if (candidates.length === 1) {
        // 科目候補が1件 → 自動確定（level='A'）
        result.determinedAccount = candidates[0]!
        result.level = 'A'
      }
      // candidates.length >= 2 → level: 'insufficient'のまま（UIで選択）
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 第五層: AI推定（全層ミス時の最終フォールバック）
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DL-008: 第1〜4層（TS決定論的）が常に優先。AIは最終手段のみ
  // accountMasterが渡されていない場合はスキップ（段階A: 既存呼出元は渡さない）
  if (result.level === 'insufficient' && input.accountMaster && input.accountMaster.length > 0) {
    const aiResult = await estimateAccountByAI({
      description: input.description,
      vendorNameRaw: input.vendorNameRaw,
      direction: input.direction,
      sourceType: input.sourceType,
      accountMaster: input.accountMaster,
    })
    if (aiResult) {
      result.determinedAccount = aiResult.account
      result.taxCategory = aiResult.taxCategory
      result.level = 'B'
      result.determinationMethod = 'ai_fallback'
      result.confidence = aiResult.confidence
      result.candidates = [aiResult.account]
    }
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
  direction: 'expense' | 'income',
): void {
  result.vendorId = vendor.vendor_id
  result.vendorName = vendor.company_name
  result.determinationMethod = method

  // 金額閾値チェック（断絶#36修正: direction分岐追加）
  const account = resolveVendorAccount(vendor, amount, direction)
  if (account) {
    result.determinedAccount = account
    if (direction === 'expense') {
      result.taxCategory = vendor.debit_tax_category
      result.subAccount = vendor.debit_sub_account
      result.department = vendor.debit_department
    } else {
      result.taxCategory = vendor.credit_tax_category
      result.subAccount = vendor.credit_sub_account
      result.department = vendor.credit_department
    }
    result.level = 'A'
    result.candidates = [account]
  }
}

/**
 * 取引先マスタの金額閾値を考慮して科目を解決する
 *
 * expense: debit_account / debit_account_over
 * income:  credit_account（閾値分岐なし）
 */
function resolveVendorAccount(vendor: Vendor, amount: number, direction: 'expense' | 'income'): string | null {
  if (direction === 'income') {
    // income: credit_accountを参照（断絶#36修正）
    return vendor.credit_account ?? null
  }

  // expense: debit_accountを参照
  if (vendor.debit_account === null) return null

  // 金額閾値なし → debit_account
  if (vendor.amount_threshold === null) return vendor.debit_account

  // 金額閾値あり → 閾値以下は debit_account、超えは debit_account_over
  if (amount <= vendor.amount_threshold) {
    return vendor.debit_account
  }
  return vendor.debit_account_over ?? vendor.debit_account
}
