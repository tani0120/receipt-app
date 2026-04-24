/**
 * パイプラインAPI型定義（Step 0-1: classify / extract）
 *
 * レイヤー: route → service → postprocess で共有される型
 * 依存: domain層の型のみ
 */

// ============================================================
// source_type（12種: DL-015 + DL-028 + DL-035確定）
// ============================================================

export const SOURCE_TYPES = [
  'receipt',            // 領収書
  'invoice_received',   // 受取請求書
  'tax_payment',        // 納付書
  'journal_voucher',    // 振替伝票
  'bank_statement',     // 通帳・銀行明細
  'credit_card',        // クレカ明細
  'cash_ledger',        // 現金出納帳
  'supplementary_doc',  // 仕訳補助資料（報告書・精算書・明細書等）
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
  fileHash?: string;   // SHA-256ハッシュ（重複チェック用。フロントで計算）
}

/** Geminiが返すclassify生レスポンス */
export interface ClassifyRawResponse {
  source_type: string;
  source_type_confidence: number;
  direction: string;
  direction_confidence: number;
  classify_reason: string | null;    // 判定根拠（AIがなぜその種別を選んだか）
  document_count: number;             // 画像内の証票枚数（2以上ならエラー）
  document_count_reason: string | null; // 枚数判定の根拠
  description: string | null;        // 摘要（AI推定）
  issuer_name: string | null;        // 発行者名
  date: string | null;               // YYYY-MM-DD
  total_amount: number | null;       // 税込合計
  line_items?: ClassifyRawLineItem[];  // 行データ（通帳・クレカはN行、レシートは1行）
}

/** Geminiが返す行データ（生） */
export interface ClassifyRawLineItem {
  date: string | null;
  description: string;
  amount: number;
  direction: 'expense' | 'income';
  balance: number | null;
}

/** postprocess後のclassify最終レスポンス */
export interface ClassifyResponse {
  source_type: SourceType;
  source_type_confidence: number;
  direction: Direction;
  direction_confidence: number;
  processing_mode: ProcessingMode;
  classify_reason: string | null;    // 判定根拠
  document_count: number;             // 画像内の証票枚数（2以上ならエラー）
  document_count_reason: string | null; // 枚数判定の根拠
  description: string | null;
  issuer_name: string | null;
  date: string | null;
  total_amount: number | null;
  fallback_applied: boolean;         // fallbackが適用されたか
  line_items: ClassifyResponseLineItem[];  // 行データ（空配列 = 行抽出なし）
  /** サーバー側バリデーション結果（フロントはこれを信頼して表示するだけ） */
  validation: {
    ok: boolean;                     // バリデーション通過
    errorReason: string | null;      // NG理由（UIに表示）
    warning: string | null;          // 警告（OK判定だが注意が必要）
    supplementary: boolean;          // 補助対象ファイル
    isDuplicate: boolean;            // 重複検出（SHA-256一致）
  };
  /** SHA-256ハッシュ（重複グループ化・フロント表示用） */
  fileHash?: string;
  /** サーバー保存先URL */
  fileUrl?: string;
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

/** postprocess後の行データ（line_index付与済み） */
export interface ClassifyResponseLineItem {
  line_index: number;                 // 行番号（1始まり。postprocessで自動付番）
  date: string | null;
  description: string;
  amount: number;
  direction: 'expense' | 'income';
  balance: number | null;
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

// ============================================================
// フロント用型（Vue側が受け取る最終結果）
// ============================================================

/** classify結果をフロント向けに変換した最終型 */
export interface ReceiptAnalysisResult {
  /** バリデーション通過 */
  ok: boolean;
  /** 正常時: YYYY-MM-DD */
  date: string | null;
  /** 正常時: 合計金額（整数） */
  amount: number | null;
  /** 正常時: 取引先名（issuer_nameから変換） */
  vendor: string | null;
  /** NGの場合: 却下理由（UIに表示） */
  errorReason: string | null;
  /** 補助対象ファイル（CSV/Excel/仕訳対象外 → AI処理不要、drive-selectで人間が確認） */
  supplementary?: boolean;
  /** 警告メッセージ（OK判定だが注意が必要。例: 複数証票の可能性） */
  warning?: string | null;
  /** SHA-256重複検出（サーバー側で照合） */
  isDuplicate?: boolean;
  /** 証票枚数（classify API出力。2以上は複数証票警告） */
  documentCount?: number;
  /** SHA-256ハッシュ値（重複グループ化用。フロントで計算） */
  fileHash?: string;
  /** 行データ（通帳・N行、レシート・1行、対象外・空） */
  lineItems?: {
    line_index: number;
    date: string | null;
    description: string;
    amount: number;
    direction: 'expense' | 'income';
    balance: number | null;
  }[];
  /** テスト用メトリクス（全項目） */
  metrics?: {
    source_type: string;              // 証票種別
    source_type_confidence: number;   // 種別信頼度（0.0〜1.0）
    direction: string;                // 仕訳方向（支払/入金/振替/混在）
    direction_confidence: number;     // 方向信頼度（0.0〜1.0）
    processing_mode: string;          // 処理モード（自動/手動/除外）
    classify_reason: string | null;   // 判定根拠
    description: string | null;       // 摘要
    fallback_applied: boolean;        // フォールバック適用
    duration_ms: number;              // 処理時間（ミリ秒）
    duration_seconds: number;         // 処理時間（秒）
    prompt_tokens: number;            // 入力トークン数
    completion_tokens: number;        // 出力トークン数
    thinking_tokens: number;          // 思考トークン数
    token_count: number;              // トークン合計（入力+出力）
    cost_yen: number;                 // 利用料（円）
    model: string;                    // 使用AIモデル名
    original_size_kb: number;         // 前処理前サイズ（KB）
    processed_size_kb: number;        // 前処理後サイズ（KB）
    preprocess_reduction_pct: number; // 削減率（%）
  };
  /** サーバー保存先URL（/api/pipeline/file/{clientId}/{savedName}） */
  fileUrl?: string;
}

/** analyzeReceipt呼出し時のオプション */
export interface AnalyzeOptions {
  clientId?: string;
  role?: string;       // 'staff' | 'guest'（権限）
  device?: string;     // 'pc' | 'mobile'（端末）
  documentId?: string; // 証票ID（crypto.randomUUID()で生成。Supabase時はUUID PK）
  /** アップロード実行者情報（ログ・監査用） */
  uploadedBy?: {
    staffId: string | null;   // スタッフUUID（ゲスト時はnull）
    staffName: string | null; // スタッフ名（ゲスト時はnull）
    email: string | null;     // メールアドレス
  };
}
