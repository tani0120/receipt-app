/**
 * lineItemToJournalMock.ts — LineItem[] → JournalPhase5Mock[] 変換ユーティリティ
 *
 * 目的: パイプライン穴②「LineItem[] → JournalPhase5Mock[]」を埋める変換関数群
 * 効果: 「テスト→Gemini→LineItem→JournalPhase5Mock→MfCsvRow→CSV」が初めてつながる
 *
 * 【ファイル構成】
 *   C-1（本ファイル現在）: COUNTERPART_ACCOUNT_MAP（相手勘定マップ）定数
 *   D-1〜D-6（次フェーズ）: lineItemToJournalMock() 変換関数本体
 *
 * 【全ID根拠】
 *   勘定科目ID : ACCOUNT_MASTER（src/shared/data/account-master.ts）準拠
 *   税区分ID   : TAX_CATEGORY_MASTER（src/shared/data/tax-category-master.ts）準拠
 *   存在しないIDのハードコード禁止。存在しない場合は null
 *
 * 変更履歴:
 *   2026-04-05: C-1 新規作成（COUNTERPART_ACCOUNT_MAP定義。DL-017関連）
 */

import type { LineItemDirection } from '@/mocks/types/pipeline/line_item.type'
import type { SourceType } from '@/mocks/types/pipeline/source_type.type'

// ============================================================
// § CounterpartEntry — 相手勘定エントリ型
// ============================================================

/**
 * 相手勘定エントリ
 *
 * source_type（証票種別）× direction（入出金方向）から導出される
 * 仕訳の相手勘定（貸方 or 借方のうち「決まっている側」）。
 *
 * 税区分は相手勘定（資産・負債科目）側は全件 COMMON_EXEMPT（対象外）。
 * 税区分の実質的な設定は主科目（determined_account）側で行う。
 *
 * account = null の場合: insufficient（人間判断が必要）
 */
export interface CounterpartEntry {
  /** 相手勘定科目（ACCOUNT_MASTER ID）。null = insufficient */
  account: string | null
  /** 税区分（TAX_CATEGORY_MASTER ID）。相手勘定は全件 COMMON_EXEMPT */
  tax_category: string | null
}

// ============================================================
// § COUNTERPART_ACCOUNT_MAP — 相手勘定マップ定数（C-1）
// ============================================================

/**
 * source_type（証票種別）× direction（入出金方向）→ 相手勘定のマッピング
 *
 * 【設計根拠】
 * - voucherTypeRules.ts と同一ルール（証票種別ごとに相手勘定が決まる）
 * - 相手勘定の税区分は全件 COMMON_EXEMPT（対象外）
 *   （税区分の実質設定は主科目 determined_account 側で行う）
 *
 * 【レシートのクレカ払い分岐】
 * receipt は is_credit_card_payment フラグで相手勘定が変わる。
 * デフォルト（現金払い）: CASH（現金）
 * クレカ払い時 上書き  : ACCRUED_EXPENSES（未払金）
 * → resolveCounterpartAccount() 関数で統合解決すること。
 *
 * 【journal_voucher の扱い】
 * 振替伝票は借方・貸方の両勘定が文脈依存で決まる。
 * 相手勘定を一律に定義できないため null（insufficient）とする。
 *
 * 【手入力仕訳・仕訳対象外】
 * invoice_issued / receipt_issued / non_journal / other は
 * COUNTERPART_ACCOUNT_MAP の対象外。null（insufficient）を返す。
 *
 * 全科目ID確認済み（ACCOUNT_MASTER）:
 *   ORDINARY_DEPOSIT（普通預金）  L39  target: both ✅
 *   ACCRUED_EXPENSES（未払金）    L262 target: both ✅
 *   CASH（現金）                  L26  target: both ✅
 *   ACCOUNTS_PAYABLE（買掛金）    L249 target: both ✅
 */
export const COUNTERPART_ACCOUNT_MAP: Partial<
  Record<SourceType, Partial<Record<LineItemDirection, CounterpartEntry>>>
> = {
  // ── 🏦 通帳・銀行明細（bank_statement）──────────────────────
  // 相手勘定: 普通預金（ORDINARY_DEPOSIT）
  bank_statement: {
    expense: { account: 'ORDINARY_DEPOSIT', tax_category: 'COMMON_EXEMPT' }, // 普通預金
    income:  { account: 'ORDINARY_DEPOSIT', tax_category: 'COMMON_EXEMPT' }, // 普通預金
  },

  // ── 💳 クレカ・Pay・スマホ決済明細（credit_card）────────────
  // 相手勘定: 未払金（ACCRUED_EXPENSES）
  credit_card: {
    expense: { account: 'ACCRUED_EXPENSES', tax_category: 'COMMON_EXEMPT' }, // 未払金
    income:  { account: 'ACCRUED_EXPENSES', tax_category: 'COMMON_EXEMPT' }, // 未払金
  },

  // ── 🧾 領収書・レシート（receipt）──────────────────────────
  // 相手勘定: 現金（CASH）が基本。is_credit_card_payment=true 時は未払金（ACCRUED_EXPENSES）
  // ※分岐は resolveCounterpartAccount() で処理。ここはデフォルト（現金払い）を定義。
  receipt: {
    expense: { account: 'CASH', tax_category: 'COMMON_EXEMPT' }, // 現金（クレカ払い時はACCRUED_EXPENSES）
    // income は通常発生しない（返金などで稀に発生する場合も現金）
    income:  { account: 'CASH', tax_category: 'COMMON_EXEMPT' }, // 現金
  },

  // ── 📄 受取請求書（invoice_received）────────────────────────
  // 相手勘定: 買掛金（ACCOUNTS_PAYABLE）
  invoice_received: {
    expense: { account: 'ACCOUNTS_PAYABLE', tax_category: 'COMMON_EXEMPT' }, // 買掛金
  },

  // ── 🏛️ 納付書（tax_payment）─────────────────────────────────
  // 相手勘定: 普通預金（ORDINARY_DEPOSIT）（口座振替での納付）
  tax_payment: {
    expense: { account: 'ORDINARY_DEPOSIT', tax_category: 'COMMON_EXEMPT' }, // 普通預金
  },

  // ── 📒 現金出納帳（cash_ledger）─────────────────────────────
  // 相手勘定: 現金（CASH）
  cash_ledger: {
    expense: { account: 'CASH', tax_category: 'COMMON_EXEMPT' }, // 現金
    income:  { account: 'CASH', tax_category: 'COMMON_EXEMPT' }, // 現金
  },

  // ── 📋 振替伝票（journal_voucher）───────────────────────────
  // 相手勘定: 文脈依存（一律定義不可）→ null（insufficient）
  journal_voucher: {
    expense: { account: null, tax_category: null },
    income:  { account: null, tax_category: null },
  },

  // ── 手入力仕訳・仕訳対象外 ──────────────────────────────────
  // invoice_issued / receipt_issued / non_journal / other
  // → 本マップ外。resolveCounterpartAccount() で null を返す。
}

// ============================================================
// § クレカ払いレシートの上書き定数
// ============================================================

/**
 * レシートのクレカ払い時の相手勘定（is_credit_card_payment = true）
 *
 * COUNTERPART_ACCOUNT_MAP の receipt.expense をこれで上書きする。
 * resolveCounterpartAccount() で参照する。
 */
export const COUNTERPART_RECEIPT_CREDIT_CARD: CounterpartEntry = {
  account: 'ACCRUED_EXPENSES', // 未払金（クレカ払い時）
  tax_category: 'COMMON_EXEMPT',
}

// ============================================================
// § resolveCounterpartAccount() — 相手勘定解決関数
// ============================================================

/**
 * source_type × direction → 相手勘定を解決する関数
 *
 * COUNTERPART_ACCOUNT_MAP のラッパー。
 * receipt の is_credit_card_payment フラグによる分岐を吸収する。
 *
 * @param sourceType      - 証票種別
 * @param direction       - 入出金方向（'expense' | 'income'）
 * @param isCreditCardPayment - レシートのクレカ払いフラグ（receipt のみ有効）
 * @returns CounterpartEntry（account=null の場合は insufficient）
 */
export function resolveCounterpartAccount(
  sourceType: SourceType,
  direction: LineItemDirection,
  isCreditCardPayment = false,
): CounterpartEntry {
  // レシート × クレカ払い → 上書き
  if (sourceType === 'receipt' && direction === 'expense' && isCreditCardPayment) {
    return COUNTERPART_RECEIPT_CREDIT_CARD
  }

  // 通常マップ参照
  const entry = COUNTERPART_ACCOUNT_MAP[sourceType]?.[direction]
  if (entry !== undefined) return entry

  // マップ外（手入力仕訳・仕訳対象外 等）
  return { account: null, tax_category: null }
}
