/**
 * パイプライン証票種類 + 証票向き 型定義
 *
 * 目的: AIパイプラインStep 0（source_type判定）の型基盤
 * 準拠: vendor_vector_41_reference.md（66種拡張済み）
 *       detailed_implementation_plan.md テスト戦略統合版
 *
 * SourceType: 証票種類（7種）— AIが最初に判定する型
 * Direction: 証票向き（3種）— Step 1で判定
 * NON_JOURNAL_EXAMPLES: 仕訳対象外の文書一覧
 * MEDICAL_TRIAGE: 医療費3分岐定義
 *
 * Phase A: モック内で使用（パイプライン型基盤）
 * Phase B TODO:
 *   - Supabase ENUM型として定義
 *   - documents.source_type カラム追加
 *   - confirmed_journals.direction カラム追加
 *
 * @deprecated VoucherType（domain層）は将来廃止予定。
 *   SourceType + Direction + VendorVector の3軸で代替する。
 *   VoucherTypeは非推奨コメント付きで残す。
 */

// ============================================================
// SourceType（証票種類 — 7種）
// ============================================================

/**
 * 証票種類（7種）
 *
 * AIが最初に判定する。non_journalは最優先判定（仕訳生成しない）。
 * - non_journal: 仕訳対象外（謄本、名刺、メモ等）
 * - receipt: 領収書
 * - invoice: 請求書
 * - credit_card_statement: クレカ明細
 * - bank_statement: 銀行明細
 * - medical_certificate: 医療費証明書（確定申告用）
 * - other: その他
 */
export type SourceType =
  | "non_journal"
  | "receipt"
  | "invoice"
  | "credit_card_statement"
  | "bank_statement"
  | "medical_certificate"
  | "other";

/** SourceType全値の定数配列（網羅性チェック用） */
export const SOURCE_TYPES = [
  "non_journal",
  "receipt",
  "invoice",
  "credit_card_statement",
  "bank_statement",
  "medical_certificate",
  "other",
] as const satisfies readonly SourceType[];

// ============================================================
// Direction（証票向き — 3種）
// ============================================================

/**
 * 証票向き（3種）
 *
 * Step 1で判定。source_typeと組み合わせて貸方科目を確定する。
 * - expense: 出金（経費・仕入等）
 * - income: 入金（売上・雑収入等）
 * - transfer: 振替（口座間移動等）
 */
export type Direction = "expense" | "income" | "transfer";

/** Direction全値の定数配列（網羅性チェック用） */
export const DIRECTIONS = ["expense", "income", "transfer"] as const satisfies readonly Direction[];

// ============================================================
// 仕訳対象外（non_journal）定義
// ============================================================

/**
 * 仕訳対象外の文書と理由
 *
 * source_type = 'non_journal' に分類される文書の一覧。
 * AIが最初にこれらを検出し、パイプラインを即終了する。
 */
export const NON_JOURNAL_EXAMPLES = [
  { document: "登記簿謄本", reason: "証明書。仕訳不要" },
  { document: "返済予定表", reason: "参考資料。仕訳は引落時" },
  { document: "見積書", reason: "取引未成立" },
  { document: "名刺", reason: "参考資料" },
  { document: "メモ書き", reason: "参考資料" },
  { document: "契約書", reason: "参考資料" },
] as const;

// ============================================================
// 医療費3分岐（MEDICAL_TRIAGE）
// ============================================================

/**
 * 医療費3分岐定義
 *
 * 医療関連の証票は、目的に応じて3つのsource_typeに分岐する。
 * AIが証票内容から判定する。
 *
 * - non_journal: 医療費控除対象（仕訳しない）
 * - medical_certificate: 医療費証明書（確定申告用。仕訳生成する）
 * - receipt: 通常経費（健康診断費用等。法人→WELFARE（福利厚生費））
 */
export const MEDICAL_TRIAGE = {
  /** 医療費控除対象 → 仕訳しない（即終了） */
  deduction: {
    source_type: "non_journal" as const,
    description: "医療費控除対象の領収書",
    action: "仕訳生成しない（パイプライン即終了）",
  },
  /** 医療費証明書 → 確定申告用（仕訳生成する） */
  certificate: {
    source_type: "medical_certificate" as const,
    description: "医療費証明書",
    action: "仕訳生成する（通常パイプライン）",
  },
  /** 通常経費 → 健康診断等（法人: WELFARE、個人: OWNER_DRAWING） */
  expense: {
    source_type: "receipt" as const,
    description: "健康診断費用等",
    action: "通常パイプラインで処理（法人→WELFARE、個人→OWNER_DRAWING）",
  },
} as const;

// ============================================================
// source_type日本語ラベル（UI表示用）
// ============================================================

/** source_typeの日本語表示名 */
export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  non_journal: "仕訳対象外",
  receipt: "領収書",
  invoice: "請求書",
  credit_card_statement: "クレカ明細",
  bank_statement: "銀行明細",
  medical_certificate: "医療費証明",
  other: "その他",
};

/** directionの日本語表示名 */
export const DIRECTION_LABELS: Record<Direction, string> = {
  expense: "出金",
  income: "入金",
  transfer: "振替",
};
