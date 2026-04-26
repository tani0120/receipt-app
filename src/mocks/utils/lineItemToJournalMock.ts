/**
 * lineItemToJournalMock.ts — LineItem[] → JournalPhase5Mock[] 変換ユーティリティ
 *
 * 目的: パイプライン穴②「LineItem[] → JournalPhase5Mock[]」を埋める変換関数群
 * 効果: 「テスト→Gemini→LineItem→JournalPhase5Mock→MfCsvRow→CSV」が初めてつながる
 *
 * 【ファイル構成】
 *   C-1: COUNTERPART_ACCOUNT_MAP（相手勘定マップ）定数
 *   D-1〜D-6: lineItemToJournalMock() 変換関数本体
 *
 * 【全ID根拠】
 *   勘定科目ID : ACCOUNT_MASTER（src/shared/data/account-master.ts）準拠
 *   税区分ID   : TAX_CATEGORY_MASTER（src/shared/data/tax-category-master.ts）準拠
 *   存在しないIDのハードコード禁止。存在しない場合は null
 *
 * 変更履歴:
 *   2026-04-05: C-1 新規作成（COUNTERPART_ACCOUNT_MAP定義。DL-017関連）
 *   2026-04-05: D-1〜D-6 追記（lineItemToJournalMock() 変換関数本体）
 */

import type { LineItem } from '@/mocks/types/pipeline/line_item.type'
import type { LineItemDirection } from '@/mocks/types/pipeline/line_item.type'
import type { SourceType } from '@/mocks/types/pipeline/source_type.type'
import type { JournalPhase5Mock } from '@/mocks/types/journal_phase5_mock.type'
import type { JournalEntryLine } from '@/domain/types/journal'

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
 * invoice_issued / receipt_issued / non_journal / supplementary_doc / other は
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
  // invoice_issued / receipt_issued / non_journal / supplementary_doc / other
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

// ============================================================
// § D-6: VOUCHER_TYPE_MAP — voucher_type（証票意味）マッピング定数
// ============================================================

/**
 * source_type × direction → voucher_type（MF CSV互換の証票意味）マッピング
 *
 * voucher_type は @deprecated フィールドだが現在のUI/CSV出力で使用中のため維持。
 * VOUCHER_TYPE_RULES（voucherTypeRules.ts）のキーと一致させる。
 *
 * null を返すケース:
 *   - bank_statement × income: 売上/振替/雑収入など内容次第で不定 → null（人間判断）
 *   - cash_ledger × income: 同上
 *   - その他（手入力仕訳・対象外等）
 */
export const VOUCHER_TYPE_MAP: Partial<
  Record<SourceType, Partial<Record<LineItemDirection, string | null>>>
> = {
  bank_statement:   { expense: '経費',   income: null },    // income は内容次第（振替・売上等）
  credit_card:      { expense: 'クレカ'                },    // credit_card × income は稀
  receipt:          { expense: '経費'                  },    // クレカ払い時は resolveVoucherType() で上書き
  invoice_received: { expense: '経費'                  },
  tax_payment:      { expense: '経費'                  },
  cash_ledger:      { expense: '経費',   income: null },    // income は内容次第
  journal_voucher:  { expense: '振替',   income: '振替' },
}

/**
 * source_type × direction × is_credit_card_payment → voucher_type を解決する関数（D-6）
 */
function resolveVoucherType(
  sourceType: SourceType,
  direction: LineItemDirection,
  isCreditCardPayment: boolean,
): string | null {
  if (sourceType === 'receipt' && direction === 'expense' && isCreditCardPayment) {
    return 'クレカ'
  }
  return VOUCHER_TYPE_MAP[sourceType]?.[direction] ?? null
}

// ============================================================
// § D-1〜D-5: lineItemToJournalMock() — 変換関数本体
// ============================================================

/**
 * D-1: ID生成ヘルパー
 *
 * jrn-{UUID} 形式。crypto.randomUUID() を使用。
 * Supabase時はUUID PKとしてそのまま使用可能。
 * 旧形式（jrn-00000001）は並行アップロード時の連番衝突リスクがあったため廃止。
 */
function generateJournalId(): string {
  let uuid: string
  try {
    uuid = crypto.randomUUID()
  } catch {
    // Secure Context外（HTTP+LAN IP）: Math.randomベースのv4 UUID
    uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
  }
  return `jrn-${uuid}`
}

/**
 * D-1: LineItem[] → JournalPhase5Mock[] 変換関数
 *
 * 【D-2: debit/credit変換ロジック】
 *   expense: debit = determined_account（確定科目）, credit = counterpart_account（相手勘定）
 *   income:  debit = counterpart_account（相手勘定）, credit = determined_account（確定科目）
 *   どちらかが null → entries = []（人間判断待ち）
 *
 * 【D-5: insufficient処理】
 *   level = 'insufficient' または determined_account = null の場合:
 *   → debit/credit entries = []（空）かつ labels に 'ACCOUNT_UNKNOWN' を付与
 *   ※ JournalPhase5Mock.status は 'exported' | null のみ（classification_status フィールドなし）
 *   ※ task.md の「classification_status: 'needs_review'」はフィールド不存在のため
 *      labels: ['ACCOUNT_UNKNOWN'] で代替実装（スコープ外問題として報告済み）
 *
 * @param items               - 変換元の LineItem 配列
 * @param sourceType          - 証票種別（SourceType 11種）
 * @param clientId            - 顧問先ID（例: LDI-00008）
 * @param isCreditCardPayment - クレカ払いフラグ（receipt の相手勘定・voucher_type 分岐に使用）
 * @param documentId          - 証票ID（crypto.randomUUID()でアップロード時に生成済み。未指定時はnull）
 * @returns JournalPhase5Mock[]
 */
export function lineItemToJournalMock(
  items: LineItem[],
  sourceType: SourceType,
  clientId: string,
  isCreditCardPayment = false,
  documentId: string | null = null,
): JournalPhase5Mock[] {
  return items.map((item, index) => {
    const isInsufficient =
      item.level === 'insufficient' ||
      item.determined_account === null ||
      item.determined_account === undefined

    // D-2: 相手勘定を解決
    const counterpart = resolveCounterpartAccount(sourceType, item.direction, isCreditCardPayment)

    // D-2: debit/credit エントリ生成
    // insufficient または determined_account が未確定の場合は空配列（人間判断待ち）
    let debitEntries: JournalEntryLine[] = []
    let creditEntries: JournalEntryLine[] = []

    if (!isInsufficient && item.determined_account && counterpart.account) {
      // D-3: sub_account（補助科目）のマッピング（LineItem.sub_account → JournalEntryLine.sub_account）
      const mainSubAccount = item.sub_account ?? null

      // D-4: tax_category（税区分）のマッピング
      //   主科目側: LineItem.tax_category（実際の税区分）
      //   相手勘定側: counterpart.tax_category（全件 COMMON_EXEMPT）
      const mainTaxCategoryId = item.tax_category ?? null
      const counterpartTaxCategoryId = counterpart.tax_category

      // 主科目エントリ（主科目は account_on_document: true で扱う）
      const mainEntry: JournalEntryLine = {
        account:            item.determined_account,
        account_on_document: true,
        sub_account:        mainSubAccount,
        amount:             item.amount,
        amount_on_document: true,
        tax_category_id:    mainTaxCategoryId,
      }

      // 相手勘定エントリ（相手勘定は account_on_document: false で扱う）
      const counterpartEntry: JournalEntryLine = {
        account:            counterpart.account,
        account_on_document: false,
        sub_account:        null,
        amount:             item.amount,
        amount_on_document: true,
        tax_category_id:    counterpartTaxCategoryId,
      }

      if (item.direction === 'expense') {
        // expense: 借方 = 主科目（確定科目）、貸方 = 相手勘定
        debitEntries  = [mainEntry]
        creditEntries = [counterpartEntry]
      } else {
        // income: 借方 = 相手勘定、貸方 = 主科目（確定科目）
        debitEntries  = [counterpartEntry]
        creditEntries = [mainEntry]
      }
    }

    // D-5: insufficient の場合は ACCOUNT_UNKNOWN ラベルを付与
    const labels: JournalPhase5Mock['labels'] = isInsufficient
      ? ['ACCOUNT_UNKNOWN']
      : []

    // D-6: voucher_type 解決
    const voucherType = resolveVoucherType(sourceType, item.direction, isCreditCardPayment)

    const journal: JournalPhase5Mock = {
      id:                   generateJournalId(),
      client_id:            clientId,
      display_order:        index + 1,
      voucher_date:         item.date,
      date_on_document:     item.date !== null,
      description:          item.description,
      voucher_type:         voucherType,       // @deprecated だが後方互換性のため維持
      source_type:          sourceType,
      direction:            item.direction,
      vendor_vector:        item.vendor_vector ?? null,
      document_id:          documentId,
      line_id:              documentId ? `${documentId}_line-${item.line_index}` : null,
      debit_entries:        debitEntries,
      credit_entries:       creditEntries,
      status:               null,              // 未出力（デフォルト）
      is_read:              false,
      deleted_at:           null,
      labels,
      warning_dismissals:   [],
      warning_details:      {},
      export_batch_id:      null,
      is_credit_card_payment: isCreditCardPayment,
      rule_id:              null,
      invoice_status:       null,
      invoice_number:       null,
      memo:                 null,
      memo_author:          null,
      memo_target:          null,
      memo_created_at:      null,
      created_by:           'AI',
      created_at:           new Date().toISOString(),
    }

    return journal
  })
}
