import type { VendorVector } from './vendor.type'
import type { NonVendorType, TaxPaymentType } from './non_vendor.type'

/**
 * line_item.type.ts — T-LI1: LineItem v1型定義
 *
 * 目的: Gemini line_items[] 出力の受け皿型（全source_type共通・N:N統一）
 *
 * 根拠: T-P4実測（2026-04-03）
 *   - 通帳23行: date/description/amount/direction/balance を100%正確に抽出
 *   - クレカ6行: date/description/amount/direction を100%正確に抽出（balance=null）
 *
 * N:N統一設計:
 *   - レシート:     line_items.length === 1（通常）
 *   - 通帳:         line_items.length === N（複数行）
 *   - クレカ明細:   line_items.length === N（複数行）
 *   全source_typeで同一型。プロンプト分岐なし。
 *
 * 含めないフィールド（設計根拠付き）:
 *   - vendor_vector  : LineItemに追加済み（v1.1。Step 3の出力。DL-006参照）
 *   - vendor_name    : LineItemに追加済み（v1.1。T-P3の受け皖型。DL-012参照）
 *   - tax_rate       : ReceiptItem側の責務。通帳/クレカ行に税率情報はない
 *   - date_on_document: date === null でコード側導出可能（冗長）
 *   - debit_account / credit_account: classify_schema.ts旧世代の残骸（@deprecated）
 *
 * ReceiptItem との関係:
 *   ReceiptItem（レシート商品明細）は別型のまま維持。
 *   quantity / unit_price / tax_rate を持つため LineItem に統合しない。
 *
 * 変更履歴:
 *   2026-04-04: v1.0 初版（T-P4実測根拠。必須目6フィールド確定）
 *   2026-04-04: v1.1 determined_account? / tax_category? 追加
 *   2026-04-04: v1.2 vendor_vector? / vendor_name? / candidates? / level? /
 *               history_match_hit? / sub_account? / counterpart_account? 追加
 *               （A-1～A-8: 66業種確定・T-P3受け皖型・大解決）
 *   2026-04-04: v1.3 NonVendorType / TaxType 型定義追加（A-9～A-12）
 *               non_vendor_type? / tax_type? フィールド追加（DL-016確定）
 *   2026-04-05: v1.4 NonVendorType / TaxPaymentType を non_vendor.type.ts に移動
 *               （24種拡張対応。DL-017確定）
 */

// ============================================================
// § NonVendorType / TaxPaymentType — non_vendor.type.ts から再エクスポート
// ============================================================
// 定義は non_vendor.type.ts に移動（2026-04-05 v1.4）
// NonVendorType: 8種 → 24種に拡張済み（DL-017）
export type { NonVendorType, TaxPaymentType } from './non_vendor.type'

// ============================================================
// § TaxPaymentType の値（再エクスポート後のダミー継続）
// ============================================================
// 以下の旧定義は削除済み。non_vendor.type.ts を参照すること。
//   'CORPORATE_TAX'    // 法人税等
//   'CONSUMPTION_TAX'  // 消費税
//   'BUSINESS_TAX'     // 事業税
//   'WITHHOLDING_TAX'  // 源泉所得税
//   'RESIDENT_TAX'     // 住民税（人間判断）

// ============================================================
// § LineItemDirection — 行レベルの入出金方向（2種）
// ============================================================

/**
 * 行レベルの入出金方向（2種）
 *
 * source_type.type.ts の Direction（4種: expense（出金）/income（入金）/transfer（振替）/mixed（混在））とは別物。
 * 通帳・クレカ・レシートの1行は必ず expense（出金）か income（入金）のどちらか。
 * - transfer（振替）: 書類レベルの方向。個別の行には適用しない
 * - mixed（混在）:    書類レベルの方向。個別の行は必ずどちらかに確定する
 */
export type LineItemDirection = 'expense' | 'income';

// ============================================================
// § LineItem — 証票明細行（v1.3）
// ============================================================

/**
 * 証票明細行（v1）
 *
 * Geminiが line_items[] として返す1行分のデータ。
 * 全source_typeで共通。N:N統一設計（1行 = 1取引）。
 *
 * フィールド詳細:
 *   date        — YYYY-MM-DD形式。日付欄がない行は null。
 *                 MF出力時は toMfCsvDate() で yyyy/MM/dd に変換（実装済み）。
 *   description — 摘要。印字テキストそのまま。正規化前の生テキスト。
 *   amount      — 金額（円・整数）。負数は使用しない。direction で入出金を表現。
 *   direction   — 入出金方向（'expense' | 'income'）。
 *   balance     — 残高（円・整数）。通帳のみ有効。クレカ・レシートは null。
 *   line_index  — 行番号（1始まり）。Geminiには出させない。assignLineIndex() で自動付番。
 *
 * v2予定追加フィールド（T-P3完了後）:
 *   vendor_name?: string | null — 行別取引先名（N:N時。摘要から抽出）
 */
export interface LineItem {
  /** 日付（YYYY-MM-DD）。日付欄なしの行は null */
  date: string | null;
  /** 摘要（印字テキストそのまま。正規化前） */
  description: string;
  /** 金額（円・整数。負数なし。入出金は direction で区別） */
  amount: number;
  /** 入出金方向（行レベル） */
  direction: LineItemDirection;
  /** 残高（円・整数）。通帳のみ有効。クレカ・レシートは null */
  balance: number | null;
  /** 行番号（1始まり）。コード側で自動付番。Geminiには返させない */
  line_index: number;

  /**
   * 確定した勘定科目（ACCOUNT_MASTER ID）
   *
   * Step 4（科目確定）完了後に設定される。
   * - 確定: 'TRAVEL' 等の ACCOUNT_MASTER ID
   * - 未確定（人間判断待ち）: null
   * - パイプライン未実行: undefined（フィールドなし）
   */
  determined_account?: string | null;

  /**
   * 税区分（ACCOUNT_MASTER の default_tax_category から自動設定）
   *
   * determined_account 確定後に設定される。
   * - 確定: 'TAXABLE_PURCHASE_10' 等
   * - 未確定: null
   * - パイプライン未実行: undefined（フィールドなし）
   */
  tax_category?: string | null;

  /**
   * 業種ベクトル（VendorVector 66種）
   *
   * Step 3（取引先特定4層）の出力。
   * - Layer 1-3（T番号・電話・名称マッチ）: vendors_*.ts マスタから取得
   * - Layer 4（Geminiフォールバック）: 画像の文脈からGeminiが推定
   *
   * 【3状態】
   * - あり: 'taxi' 等の VendorVector 値（Layer 1-3照合済み or Layer 4推定成功）
   * - 不明: null（Step 3実行済みだが取引先特定失敗 → level: 'insufficient'）
   * - なし: undefined（Step 3未実行）
   *
   * 66種はGemini精度（T-P3）に関係なく採用確定（DL-006参照）。
   */
  vendor_vector?: VendorVector | null;

  /**
   * 行別取引先名（A-2）
   *
   * Step 3 Layer 4（Geminiフォールバック）が摘要テキストから抽出。
   * Layer 1-3（T番号・電話・名称マッチ）成功時はマスタの正式名称を使用。
   * 型は string | null で確定。精度は null で吸収（DL-012参照）。
   * - 抽出できた: '株式会社〇〇' 等
   * - 特定不能: null
   * - パイプライン未実行: undefined
   */
  vendor_name?: string | null;

  /**
   * 科目候補（A-3）
   *
   * Step 4で設定。vendor_vector × direction → industry_vector辞書引きで得た
   * ACCOUNT_MASTER ID の配列。history_match命中時は過去と同じ科目の1件配列。
   * - レベルA（候補1件）: ['TRAVEL'] 等
   * - insufficient（候補複数）: ['MEETING', 'ENTERTAINMENT'] 等
   * - パイプライン未実行: undefined
   */
  candidates?: string[];

  /**
   * 判定レベル（A-4）
   *
   * Step 4で設定。candidates の件数から決まる。
   * - 'A': candidates.length === 1（自動確定。determined_accountが設定される）
   * - 'insufficient': candidates.length >= 2（人間がUIで選択）
   * - パイプライン未実行: undefined
   */
  level?: 'A' | 'insufficient';

  /**
   * Step 2照合ヒットフラグ（A-5）
   *
   * Step 2（history_match）で過去仕訳と照合した結果。
   * true の場合、過去と同じ科目+税区分で即確定したことを示す（根拠トレース用）。
   * - true: 過去仕訳と照合でき、同じ科目で即確定
   * - false: 照合なし（Step 3以降へ）
   * - パイプライン未実行: undefined
   */
  history_match_hit?: boolean;

  /**
   * 補助科目（A-6）
   *
   * MF CSV の「借方補助科目」「貸方補助科目」列への対応。
   * 通帳の場合は銀行名が摘要に出るため推定可能（例: '三菱UFJ'）。
   * - 補助科目あり: '三菱UFJ' 等
   * - なし: null
   * - パイプライン未実行: undefined
   */
  sub_account?: string | null;

  /**
   * 相手勘定（A-7）
   *
   * source_type × direction から COUNTERPART_ACCOUNT_MAP で導出。
   * lineItemToJournalMock() での debit/credit 変換に使用。
   * - bank_statement/expense → 'ORDINARY_DEPOSIT'（普通預金）
   * - credit_card/expense   → 'ACCRUED_EXPENSES'（未払金）
   * - receipt/expense       → 'CASH'（現金）/ is_credit_card_payment時は'ACCRUED_EXPENSES'
   * - 不明・未対応: null（人間判断待ち）
   * - パイプライン未実行: undefined
   * 根拠: voucherTypeRules.ts と同一ルール（DL-009参照）
   */
  counterpart_account?: string | null;

  /**
   * 取引先外取引の種別（A-9）
   *
   * 取引先特定できない行（ATM・利息・手数料・口座間移動等）の分類。
   *
   * 設定ルール（相互排他）:
   *   - 取引先ありの行: vendor_vector が設定される。本フィールドは必ず null。
   *   - 取引先外の行: 本フィールドまたは tax_type のどちらか一方。vendor_vector は null。
   *   - tax_type との同時設定禁止（税金は独立カテゴリ）。
   *
   * - 銀行自動確定（9種）: 'ATM' / 'INTEREST_INCOME' / 'INTEREST_EXPENSE' /
   *                          'BANK_FEE' / 'ACCOUNT_FEE' / 'FOREIGN_EXCHANGE_FEE' /
   *                          'INTERNAL_TRANSFER' / 'LOAN_RECEIPT' / 'LOAN_REPAYMENT'
   *                          → level: 'A'（自動確定）
   * - クレカ自動確定（7種）: 'CREDIT_CARD_ANNUAL_FEE' / 'CREDIT_CARD_STATEMENT_FEE' /
   *                          'CREDIT_CARD_LATE_FEE' / 'REVOLVING_FEE' /
   *                          'CARD_CASH_ADVANCE_FEE' / 'CARD_CASH_ADVANCE_INTEREST' /
   *                          'FOREIGN_TRANSACTION_FEE'
   *                          → level: 'A'（自動確定。一部法人のみ）
   * - 人間判断（8種）: 'CASHBACK' / 'UNIDENTIFIED_SALARY' / 'UNIDENTIFIED_INFLOW' /
   *                   'UNIDENTIFIED_OUTFLOW' / 'PETTY_CASH_ADJUSTMENT' /
   *                   'SUBSIDY_RECEIVED' / 'INSURANCE_RECEIVED' / 'OTHER_NON_VENDOR'
   *                   → level: 'insufficient'
   * - 未設定: undefined（パイプライン未実行）
   * 根拠: DL-016（2026-04-04）/ DL-017（2026-04-05。8種→24種拡張）
   */
  non_vendor_type?: NonVendorType | null;

  /**
   * 税金の種別（A-10）
   *
   * 納付書（source_type: 'tax_payment'）および
   * 通帳・銀行明細（bank_statement）内の税金行で使用。
   *
   * 設定ルール（相互排他）:
   *   - non_vendor_type と同時展模禁止。税金は独立カテゴリ。
   *   - vendor_vector との同時展模禁止。
   *
   * - 科目推定可能: 'CORPORATE_TAX' / 'CONSUMPTION_TAX' /
   *                         'BUSINESS_TAX' / 'WITHHOLDING_TAX'
   *                         → level: 'A'（自動確定）
   * - 科目人間判断: 'RESIDENT_TAX'
   *                         → level: 'insufficient'（情報不足。事業形態で変わる）
   * - 未設定: undefined（パイプライン未実行）
   * 根拠: DL-016（2026-04-04確定）
   */
  tax_type?: TaxPaymentType | null;
}

// ============================================================
// § 型ガード関数
// ============================================================

/**
 * LineItem 型ガード
 *
 * Geminiからのレスポンスを受け取った直後に使用。
 * unknown を LineItem として安全に扱えるか検証する。
 */
export function isLineItem(v: unknown): v is LineItem {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as Record<string, unknown>;
  const dateOk =
    obj['date'] === null ||
    (typeof obj['date'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj['date']));
  return (
    dateOk &&
    typeof obj['description'] === 'string' &&
    typeof obj['amount'] === 'number' &&
    (obj['direction'] === 'expense' || obj['direction'] === 'income') &&
    (typeof obj['balance'] === 'number' || obj['balance'] === null) &&
    typeof obj['line_index'] === 'number'
  );
}

/**
 * LineItem 配列の型ガード
 *
 * Geminiが返す line_items[] 全体を一括検証する。
 */
export function isLineItemArray(v: unknown): v is LineItem[] {
  return Array.isArray(v) && v.every(isLineItem);
}

// ============================================================
// § ユーティリティ
// ============================================================

/**
 * line_index を自動付番して LineItem[] を生成する
 *
 * Geminiのレスポンスから line_index を除いた配列を受け取り、
 * 1始まりで line_index を付与して返す。
 * 空配列を渡した場合は空配列を返す（正常動作）。
 *
 * 使用例:
 *   const rawItems = geminiResponse.line_items; // line_index未付与
 *   const items = assignLineIndex(rawItems);     // 1始まりで付番
 *
 * @param rawItems - Geminiが返した line_items[]（line_index未付与）。空配列可。
 * @returns line_index 付きの LineItem[]
 */
export function assignLineIndex(
  rawItems: Omit<LineItem, 'line_index'>[]
): LineItem[] {
  return rawItems.map((item, i) => ({
    ...item,
    line_index: i + 1,
  }));
}
