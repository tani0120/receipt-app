/**
 * パイプライン証票種類 + 仕訳方向 + 処理区分 型定義
 *
 * 目的: AIパイプラインStep 0（source_type判定）の型基盤
 * 準拠: vendor_vector_41_reference.md（66種拡張済み）
 *       detailed_implementation_plan.md テスト戦略統合版
 *       source_type_redesign_checklist.md（2026-04-02 再設計）
 *
 * SourceType: 証票種類（11種）— AIが最初に判定する型
 * ProcessingMode: 処理区分（3種）— source_typeから導出
 * Direction: 仕訳方向（4種）— Step 1で判定
 * NON_JOURNAL_EXAMPLES: 仕訳対象外の文書一覧
 *
 * Phase A: モック内で使用（パイプライン型基盤）
 * Phase B TODO:
 *   - Supabase ENUM型として定義
 *   - documents.source_type カラム追加
 *   - confirmed_journals.direction（仕訳方向）カラム追加
 *
 * @deprecated VoucherType（domain層）は将来廃止予定。
 *   SourceType + Direction + VendorVector の3軸で代替する。
 *   VoucherTypeは非推奨コメント付きで残す。
 *
 * 変更履歴:
 *   2026-03-29: 初版（7種 + Direction 3種 + MEDICAL_TRIAGE）
 *   2026-04-02: 再設計（11種 + ProcessingMode + Direction 4種 + MEDICAL_TRIAGE削除）
 *     - invoice → invoice_received に改名
 *     - credit_card_statement → credit_card に改名
 *     - medical_certificate 削除（医療費は全てnon_journal）
 *     - invoice_issued（発行請求書）追加
 *     - receipt_issued（発行領収書）追加
 *     - tax_payment（納付書）追加
 *     - journal_voucher（振替伝票）追加
 *     - cash_ledger（現金出納帳）追加
 *     - ProcessingMode型 + PROCESSING_MODE_MAP 追加
 *     - Direction に mixed（混在）追加
 *     - MEDICAL_TRIAGE 削除（医療費は全てnon_journal扱い）
 */

// ============================================================
// SourceType（証票種類 — 11種）
// ============================================================

/**
 * 証票種類（11種）
 *
 * AIが最初に判定する。source_typeから処理区分（ProcessingMode）が一意に決まる。
 *
 * ── 自動仕訳対象（auto — 7種）──
 * - receipt: 領収書・レシート
 * - invoice_received: 受取請求書（仕入・経費）
 * - tax_payment: 納付書（税金・社会保険）
 * - journal_voucher: 振替伝票・入出金伝票
 * - bank_statement: 通帳・銀行明細
 * - credit_card: クレカ・Pay・スマホ決済明細
 * - cash_ledger: 現金出納帳
 *
 * ── 手入力仕訳対象（manual — 2種）──
 * - invoice_issued: 発行請求書（自社が発行。摘要は人間入力）
 * - receipt_issued: 発行領収書（自社が発行。摘要は人間入力）
 *
 * ── 仕訳対象外（excluded — 2種）──
 * - non_journal: 仕訳対象外（見積書・名刺・メモ・医療費等）
 * - other: 判別不能（AI分類失敗時のフォールバック）
 */
export type SourceType =
  // ── 自動仕訳対象（7種）──
  | "receipt"           // 領収書・レシート
  | "invoice_received"  // 受取請求書（仕入・経費）
  | "tax_payment"       // 納付書（税金・社会保険）
  | "journal_voucher"   // 振替伝票・入出金伝票
  | "bank_statement"    // 通帳・銀行明細
  | "credit_card"       // クレカ・Pay・スマホ決済明細
  | "cash_ledger"       // 現金出納帳
  // ── 手入力仕訳対象（2種）──
  | "invoice_issued"    // 発行請求書（自社が発行。摘要は人間入力）
  | "receipt_issued"    // 発行領収書（自社が発行。摘要は人間入力）
  // ── 仕訳対象外（2種）──
  | "non_journal"       // 仕訳対象外（見積書・名刺・メモ・医療費等）
  | "other";            // 判別不能（AI分類失敗時のフォールバック）

/** SourceType全値の定数配列（網羅性チェック用） */
export const SOURCE_TYPES = [
  // 自動仕訳対象（7種）
  "receipt",
  "invoice_received",
  "tax_payment",
  "journal_voucher",
  "bank_statement",
  "credit_card",
  "cash_ledger",
  // 手入力仕訳対象（2種）
  "invoice_issued",
  "receipt_issued",
  // 仕訳対象外（2種）
  "non_journal",
  "other",
] as const satisfies readonly SourceType[];

// ============================================================
// ProcessingMode（処理区分 — 3種。source_typeから導出）
// ============================================================

/**
 * 処理区分（3種）
 *
 * source_type から PROCESSING_MODE_MAP で1回のルックアップで決定する。
 * - auto: 自動仕訳対象（AIフル自動で仕訳生成）
 * - manual: 手入力仕訳対象（仕訳は必要だが人間の入力が必須）
 * - excluded: 仕訳対象外（仕訳不要。drive-selectで人間が再判定可能）
 */
export type ProcessingMode = "auto" | "manual" | "excluded";

/**
 * source_type → 処理区分の導出テーブル
 *
 * このテーブルで source_type から処理区分が一意に決まる。
 * drive-select UIの振り分け（自動/手入力/対象外）に直結する。
 */
export const PROCESSING_MODE_MAP: Record<SourceType, ProcessingMode> = {
  // 自動仕訳対象（7種）
  receipt:          "auto",      // 領収書 → 自動
  invoice_received: "auto",      // 受取請求書 → 自動
  tax_payment:      "auto",      // 納付書 → 自動
  journal_voucher:  "auto",      // 振替伝票 → 自動
  bank_statement:   "auto",      // 通帳 → 自動
  credit_card:      "auto",      // クレカ明細 → 自動
  cash_ledger:      "auto",      // 現金出納帳 → 自動
  // 手入力仕訳対象（2種）
  invoice_issued:   "manual",    // 発行請求書 → 手入力
  receipt_issued:   "manual",    // 発行領収書 → 手入力
  // 仕訳対象外（2種）
  non_journal:      "excluded",  // 仕訳対象外 → 対象外
  other:            "excluded",  // 判別不能 → 対象外
} as const;

/** source_type（証票種類）から処理区分を取得する */
export function getProcessingMode(type: SourceType): ProcessingMode {
  return PROCESSING_MODE_MAP[type];
}

// ============================================================
// Direction（仕訳方向 — 4種）
// ============================================================

/**
 * 仕訳方向（4種）
 *
 * Step 1で判定。source_typeと組み合わせて貸方科目を確定する。
 * - expense: 出金（経費・仕入等）
 * - income: 入金（売上・雑収入等）
 * - transfer: 振替（口座間移動等）
 * - mixed: 混在（通帳・現金出納帳など入出金が混在する書類）
 */
export type Direction = "expense" | "income" | "transfer" | "mixed";

/** Direction全値の定数配列（網羅性チェック用） */
export const DIRECTIONS = [
  "expense",
  "income",
  "transfer",
  "mixed",
] as const satisfies readonly Direction[];

// ============================================================
// 仕訳対象外（non_journal）定義
// ============================================================

/**
 * 仕訳対象外の文書と理由
 *
 * source_type = 'non_journal' に分類される文書の一覧。
 * AIが最初にこれらを検出し、パイプラインを即終了する。
 *
 * 注意: 医療費は全てnon_journal扱い（2026-04-02 設計変更）。
 * 法人の福利厚生費（健康診断等）は drive-select UIで
 * 人間が「仕訳対象」に再判定可能。
 */
export const NON_JOURNAL_EXAMPLES = [
  // 既存6件
  { document: "登記簿謄本", reason: "証明書。仕訳不要" },
  { document: "返済予定表", reason: "参考資料。仕訳は引落時" },
  { document: "見積書", reason: "取引未成立" },
  { document: "名刺", reason: "参考資料" },
  { document: "メモ書き", reason: "参考資料" },
  { document: "契約書", reason: "参考資料" },
  // 追加6件
  { document: "保険証券", reason: "証券。仕訳は保険料支払時" },
  { document: "ふるさと納税証明書", reason: "証明書。仕訳不要" },
  { document: "年金通知書", reason: "通知書。仕訳不要" },
  { document: "確定申告書の控え", reason: "控え。仕訳不要" },
  { document: "届出書（税務署向け）", reason: "届出。仕訳不要" },
  { document: "委任状", reason: "参考資料" },
  // ブラックリスト差分6件
  { document: "カタログ", reason: "参考資料" },
  { document: "議事録", reason: "参考資料" },
  { document: "給与明細", reason: "給与仕訳は別途処理" },
  // 医療費関連（2026-04-02 MEDICAL_TRIAGE削除に伴い追加）
  { document: "診療費領収書", reason: "医療費。全てnon_journal扱い" },
  { document: "医療費控除用領収書", reason: "医療費。全てnon_journal扱い" },
  { document: "薬局領収書", reason: "医療費。全てnon_journal扱い" },
] as const;

// ============================================================
// ガード関数
// ============================================================

/** 仕訳対象外か判定 */
export function isNonJournal(type: SourceType): boolean {
  return type === "non_journal";
}

// ============================================================
// source_type 日本語ラベル（UI表示用）
// ============================================================

/** source_type（証票種類）の日本語表示名 */
export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  // 自動仕訳対象（7種）
  receipt:          "領収書",
  invoice_received: "受取請求書",
  tax_payment:      "納付書",
  journal_voucher:  "振替伝票",
  bank_statement:   "通帳・銀行明細",
  credit_card:      "クレカ明細",
  cash_ledger:      "現金出納帳",
  // 手入力仕訳対象（2種）
  invoice_issued:   "発行請求書",
  receipt_issued:   "発行領収書",
  // 仕訳対象外（2種）
  non_journal:      "仕訳対象外",
  other:            "その他",
};

/** source_type（証票種類）の日本語ラベルを取得する */
export function getSourceTypeLabel(type: SourceType): string {
  return SOURCE_TYPE_LABELS[type];
}

/** direction（仕訳方向）の日本語表示名 */
export const DIRECTION_LABELS: Record<Direction, string> = {
  expense:  "出金",
  income:   "入金",
  transfer: "振替",
  mixed:    "混在",
};

/** direction（仕訳方向）の日本語ラベルを取得する */
export function getDirectionLabel(dir: Direction): string {
  return DIRECTION_LABELS[dir];
}

/** processing_mode（処理区分）の日本語表示名 */
export const PROCESSING_MODE_LABELS: Record<ProcessingMode, string> = {
  auto:     "自動仕訳",
  manual:   "手入力仕訳",
  excluded: "対象外",
};
