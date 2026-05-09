/**
 * schemaDescriptions.ts — previewExtract用Structured Outputスキーマの
 * description文言を一元管理する定数ファイル。
 *
 * 目的:
 *   - AIモデルへの指示文（description）を1箇所で管理し、変更時の影響範囲を限定
 *   - 監査ツール（audit-hardcode.cjs）の検出対象から除外するための集約
 *   - フロント側UI文言（uiMessages.ts）とは責務が異なるため、別ファイルとして管理
 *
 * 対象:
 *   previewExtract.service.ts の PREVIEW_EXTRACT_SCHEMA 内 description フィールド
 *   + REQUEST_PROMPT
 */

// ============================================================
// トップレベルフィールド
// ============================================================

/** source_type: 証票種別 */
export const DESC_SOURCE_TYPE = '証票種別（12種から1つ選択）';

/** source_type_confidence: 信頼度 */
export const DESC_SOURCE_TYPE_CONFIDENCE = '証票種別の信頼度（0.0〜1.0）';

/** direction: 仕訳方向 */
export const DESC_DIRECTION = '仕訳方向（4種から1つ選択）';

/** direction_confidence: 信頼度 */
export const DESC_DIRECTION_CONFIDENCE = '仕訳方向の信頼度（0.0〜1.0）';

/** preview_extract_reason: 判定根拠 */
export const DESC_EXTRACT_REASON =
  '判定根拠。なぜそのsource_typeを選んだかの理由を日本語で1、2文で説明';

/** document_count: 情報源数 */
export const DESC_DOCUMENT_COUNT =
  '画像内の独立した情報源の数。純粋に1枚の証票だけが写っている場合のみ1。それ以外は2以上を返す';

/** document_count_reason: 情報源数の判定根拠 */
export const DESC_DOCUMENT_COUNT_REASON =
  '画像内の情報源数の判定根拠。他の書類・証票の端や影が写っていないかを確認した結果を日本語で1、2文で説明';

/** description: 摘要 */
export const DESC_DESCRIPTION = '摘要（取引内容の要約）';

/** issuer_name: 発行者名 */
export const DESC_ISSUER_NAME = '発行者名（会社名・店舗名）';

/** date: 取引日 */
export const DESC_DATE = '取引日（YYYY-MM-DD）';

/** total_amount: 合計金額 */
export const DESC_TOTAL_AMOUNT = '合計金額（税込）';

/** line_items: 行データ配列 */
export const DESC_LINE_ITEMS =
  '行データ。通帳・クレカは全行、レシートは1行、仕訳対象外は空配列。';

// ============================================================
// line_items 内フィールド
// ============================================================

/** line_items[].date: 行の取引日 */
export const DESC_LINE_DATE = '取引日（YYYY-MM-DD）。日付欄がない行はnull';

/** line_items[].description: 摘要 */
export const DESC_LINE_DESCRIPTION = '摘要（印字テキストそのまま）';

/** line_items[].amount: 金額 */
export const DESC_LINE_AMOUNT = '金額（円・整数・負数なし）';

/** line_items[].direction: 入出金方向 */
export const DESC_LINE_DIRECTION = '入出金方向（行レベル）';

/** line_items[].balance: 残高 */
export const DESC_LINE_BALANCE = '残高。通帳のみ有効。クレカ・レシートはnull';

// ============================================================
// リクエストプロンプト
// ============================================================

/** ユーザーメッセージとしてAIに送信する指示文 */
export const REQUEST_PROMPT =
  'この証票画像を分析し、証票種別と仕訳方向を判定し、行データを抽出してください。';
