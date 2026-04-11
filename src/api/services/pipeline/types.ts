/**
 * パイプラインAPI型定義（Step 0-1: classify / extract）
 *
 * レイヤー: route → service → postprocess で共有される型
 * 依存: domain層の型のみ
 */

// ============================================================
// source_type（11種: DL-015 + DL-028確定）
// ============================================================

export const SOURCE_TYPES = [
  'receipt',            // 領収書
  'invoice_received',   // 受取請求書
  'tax_payment',        // 納付書
  'journal_voucher',    // 振替伝票
  'bank_statement',     // 通帳・銀行明細
  'credit_card',        // クレカ明細
  'cash_ledger',        // 現金出納帳
  'invoice_issued',     // 発行請求書（manual）
  'receipt_issued',     // 発行領収書（manual）
  'non_journal',        // 仕訳対象外（excluded）
  'other',              // その他（excluded）
] as const;

export type SourceType = typeof SOURCE_TYPES[number];

// ============================================================
// direction（4種: DL-001確定）
// ============================================================

export const DIRECTIONS = [
  'expense',    // 出金・支払
  'income',     // 入金・受取
  'transfer',   // 振替（口座間移動等）
  'mixed',      // 混在（通帳ページ等）
] as const;

export type Direction = typeof DIRECTIONS[number];

// ============================================================
// ProcessingMode（3種: Step 0判定結果）
// ============================================================

export type ProcessingMode = 'auto' | 'manual' | 'excluded';

// ============================================================
// classify API 入出力
// ============================================================

/** POST /api/pipeline/classify リクエスト */
export interface ClassifyRequest {
  image: string;       // base64エンコード画像
  mimeType: string;    // image/jpeg, image/png, application/pdf 等
  clientId: string;    // 顧問先ID
  filename?: string;   // 元ファイル名（ログ用）
}

/** Geminiが返すclassify生レスポンス */
export interface ClassifyRawResponse {
  source_type: string;
  source_type_confidence: number;
  direction: string;
  direction_confidence: number;
  description: string | null;        // 摘要（AI推定）
  issuer_name: string | null;        // 発行者名
  date: string | null;               // YYYY-MM-DD
  total_amount: number | null;       // 税込合計
}

/** postprocess後のclassify最終レスポンス */
export interface ClassifyResponse {
  source_type: SourceType;
  source_type_confidence: number;
  direction: Direction;
  direction_confidence: number;
  processing_mode: ProcessingMode;
  description: string | null;
  issuer_name: string | null;
  date: string | null;
  total_amount: number | null;
  fallback_applied: boolean;         // fallbackが適用されたか
  metadata: {
    duration_ms: number;
    duration_seconds: number;         // 処理時間（秒）
    prompt_tokens: number;
    completion_tokens: number;
    thinking_tokens: number;
    token_count: number;              // 入力+出力トークン合計
    cost_yen: number;                 // 利用料（円）
    model: string;
    original_size_kb: number;         // 前処理前サイズ（KB）
    processed_size_kb: number;        // 前処理後サイズ（KB）
    preprocess_reduction_pct: number; // 削減率（%）
  };
}

// ============================================================
// extract API 入出力（将来用。classify確定後に実装）
// ============================================================

/** POST /api/pipeline/extract リクエスト */
export interface ExtractRequest {
  image: string;
  mimeType: string;
  clientId: string;
  source_type: SourceType;
  direction: Direction;
  filename?: string;
}

/** line_item（extract結果の1行） */
export interface ExtractLineItem {
  date: string | null;
  description: string;
  amount: number;
  direction: 'expense' | 'income';
  balance: number | null;
}

/** postprocess後のextract最終レスポンス */
export interface ExtractResponse {
  line_items: ExtractLineItem[];
  metadata: {
    duration_ms: number;
    prompt_tokens: number;
    completion_tokens: number;
    thinking_tokens: number;
    model: string;
  };
}

// ============================================================
// ログ構造
// ============================================================

/** パイプラインログエントリ */
export interface PipelineLogEntry {
  timestamp: string;
  step: 'classify' | 'extract';
  input: {
    filename: string;
    mimeType: string;
    sizeBytes: number;
    clientId: string;
  };
  ai_raw: Record<string, unknown>;   // Gemini生出力
  postprocess: Record<string, unknown>; // 整形後
  error: string | null;
  duration_ms: number;
}
