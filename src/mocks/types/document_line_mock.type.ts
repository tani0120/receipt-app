/**
 * DocumentLine モック型定義
 *
 * 目的: 証票行データのモック検証用（Supabase実装前）
 * 準拠: 12_full_schema_design_20260311.md §5.4、migration.sql §2.2
 * 作成: 2026-03-11
 */

export interface DocumentLineMock {
    id: string;                           // 証票行ID（doc-00000001-line-003形式）
    document_id: string;                  // 親証票ID（documentsテーブル参照）
    line_index: number;                   // 行番号（1から開始）
    raw_text?: string | null;             // OCR生テキスト（この行のみ）
    normalized_text?: string | null;      // 正規化テキスト
    keywords?: string[];                  // 抽出キーワード配列
    date?: string | null;                 // この行の日付（通帳の各行の取引日等）
    amount?: number | null;               // この行の金額
    description?: string | null;          // この行の摘要
    date_on_document?: boolean | null;    // 日付の項目存在フラグ
    amount_on_document?: boolean | null;  // 金額の項目存在フラグ
    created_at?: string;                  // 作成日時（ISO 8601）
}
