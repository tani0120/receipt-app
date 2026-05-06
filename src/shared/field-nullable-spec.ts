/**
 * 仕訳フィールドのnull許容定義表
 *
 * 目的: 全フィールドのnull可否・警告ラベル対応・CSV出力時の扱いを一元管理
 * 準拠: journal_v2_20260214.md v2.1、10_nullable_on_document_plan.md
 *
 * ルール:
 *   - null = 「存在しない」または「読み取れない」（on_documentで区別）
 *   - on_document（項目存在フラグ）= false + null → 項目自体が証憑にない
 *   - on_document（項目存在フラグ）= true  + null → 項目はあるが読み取れない
 *   - 保存時バリデーションなし（止めない）
 *   - CSV出力時: nullでも出力可。ただし件数警告を表示
 *   - MFインポート: エラーは行番号付きで提示されるため、事前に候補行を警告
 *
 * 警告ラベル統合（2026-03-04）:
 *   - 廃止: TAX_CALCULATION_ERROR（税額は計算しない設計に変更）
 *   - 廃止: MISSING_FIELD / UNREADABLE_FAILED（on_document（項目存在フラグ）に役割移譲）
 *   - 採用: DATE_UNKNOWN（日付不明）/ ACCOUNT_UNKNOWN（勘定科目不明）/ AMOUNT_UNCLEAR（金額不明瞭）
 *
 * 更新日: 2026-03-04
 */

// ============================================================
// null × on_document × 警告ラベル 相関表
// ============================================================

/**
 * on_document（項目存在）  | 値          | 警告ラベル          | 日本語              | ホバーメッセージ
 * false（項目なし）          | null        | DATE_UNKNOWN等      | 日付が不明 等       | 「証憑に○○の記載がありません」
 * true（項目あり）           | null        | DATE_UNKNOWN等      | 日付が不明 等       | 「○○の読み取りに失敗しました」
 * true（項目あり）           | 値あり（低） | UNREADABLE_ESTIMATED | 判読困難（AI推測値） | 「判読困難（AI推測値）」
 * true（項目あり）           | 値あり（高） | —                   | 正常               | —
 */

// ============================================================
// フィールド別の警告ラベルマッピング
// ============================================================

/** フィールドがnullの場合に付与するラベル */
export const FIELD_NULL_WARNING_LABEL = {
  voucher_date: 'DATE_UNKNOWN',    // 日付が不明
  account: 'ACCOUNT_UNKNOWN', // 勘定科目が不明
  amount: 'AMOUNT_UNCLEAR',  // 内訳が不明瞭な金額あり
} as const;

// ============================================================
// CSV出力前チェック: MF必須フィールド
// ============================================================

/** MF CSV必須フィールド一覧（nullならCSV出力前に警告） */
export const MF_CSV_REQUIRED_FIELDS = [
  { field: 'voucher_date', displayName: '日付' },
  { field: 'account', displayName: '勘定科目' },
  { field: 'amount', displayName: '金額' },
  { field: 'description', displayName: '摘要' },
  { field: 'tax_category_id', displayName: '税区分' },
] as const;

// ============================================================
// UI表示: null時の統一表示
// ============================================================

/**
 * nullフィールドのUI表示
 * - 日付・勘定科目: 「未確定」
 * - 金額: 空白（存在しない場合）/ 類推値（存在する場合）
 * - その他: 「-」
 *
 * ソート時のnull扱い:
 *   昇順: nullは末尾
 *   降順: nullは先頭
 */
export const NULL_DISPLAY_UNKNOWN = '未確定';
export const NULL_DISPLAY_DASH = '-';

/**
 * ソート時のnull比較関数
 * nullを昇順=末尾、降順=先頭に配置する
 */
export function compareWithNull<T>(
  a: T | null | undefined,
  b: T | null | undefined,
  direction: 'asc' | 'desc',
  compareFn: (a: T, b: T) => number
): number {
  const aIsNull = a === null || a === undefined;
  const bIsNull = b === null || b === undefined;

  if (aIsNull && bIsNull) return 0;
  if (aIsNull) return direction === 'asc' ? 1 : -1;
  if (bIsNull) return direction === 'asc' ? -1 : 1;

  const result = compareFn(a, b);
  return direction === 'desc' ? -result : result;
}
