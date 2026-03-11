/**
 * Document モック型定義
 *
 * 目的: 証票データのモック検証用（Supabase実装前）
 * 準拠: 12_full_schema_design_20260311.md §5.3、migration.sql §2.1
 * 更新: 2026-03-11 migration.sql準拠に拡張
 */

export interface DocumentMock {
    id: string;                           // 証票ID（doc-00000001形式）
    client_id: string;                    // 顧問先ID
    source_type?: string | null;          // 証票種類（receipt, invoice, bank_statement等）
    file_path?: string | null;            // ファイルパス
    file_hash?: string | null;            // ファイルSHA256ハッシュ（重複検出用）
    ocr_text?: string | null;             // OCR生テキスト
    document_date?: string | null;        // 証票に記載されている日付（ISO 8601）
    uploaded_at: string;                  // アップロード日時（ISO 8601）
    ocr_completed_at?: string | null;     // OCR完了日時
    ocr_engine?: string | null;           // OCRエンジン名（google_vision等）
    ocr_version?: string | null;          // OCRバージョン
    ocr_confidence?: number | null;       // OCR信頼度（0.0000-1.0000）
    external_id?: string | null;          // 外部ID（STREAMED連携用）
    external_source?: string | null;      // 外部ソース名
    processing_time_ms?: number | null;   // 処理時間（ミリ秒）
    created_at?: string;                  // 作成日時（ISO 8601）
    created_by?: string | null;           // 作成者

    // モック専用（将来Supabase Storage連携時に置き換え）
    image_url?: string;                   // 画像URL（モック用: 相対パスまたは絶対パス）
    file_name?: string;                   // ファイル名
}
