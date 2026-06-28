/**
 * 資料（DocEntry）ドメイン型定義
 *
 * 分割元: repositories/types.ts §7
 * 用途: 資料選別画面、進捗管理の未選別/資料受取日算出
 */

import type { DeterminationMethod } from '@/types/determination-method'

/** 資料のデータソース */
export type DocSource = 'drive' | 'upload' | 'staff-upload' | 'guest-upload'

/** 資料の選別ステータス */
export type DocStatus = 'pending' | 'target' | 'supporting' | 'excluded' | 'completed' | 'exported'

/**
 * 資料1件（Drive/PCアップロードで取り込んだファイル）
 *
 * 対象データ: Drive共有フォルダ or PCアップロードで投入された画像/PDF
 * 用途: 資料選別画面での人間チェック、進捗管理の未選別/資料受取日算出
 *
 * 準拠: DL-039（ゲスト認証・Drive権限付与設計）
 */
export interface DocEntry {
  /** UUID（一意識別子） */
  id: string
  /** 顧問先ID（例: 'LDI-00008'） */
  clientId: string
  /** データソース（'drive' | 'upload'） */
  source: DocSource
  /** ファイル名（例: 'IMG_20250305_143200.jpg'） */
  fileName: string
  /** MIMEタイプ（例: 'image/jpeg', 'application/pdf'） */
  fileType: string
  /** ファイルサイズ（バイト） */
  fileSize: number
  /** SHA-256ハッシュ（重複検知用。未算出時はnull） */
  fileHash: string | null
  /** Drive fileId（source='drive'時のみ） */
  driveFileId: string | null
  /** サムネイルURL（Googleが自動生成する200px画像 or ローカルパス） */
  thumbnailUrl: string | null
  /** プレビュー用画像パス（フルサイズ閲覧用） */
  previewUrl: string | null
  /** 選別ステータス（'pending' | 'target' | 'supporting' | 'excluded'） */
  status: DocStatus
  /** 取得日時（ISO 8601形式。バッチ取り込み時のタイムスタンプ） */
  receivedAt: string
  /** バッチID（選別完了→送出時に付与。1回の送出=1バッチ） */
  batchId: string | null
  /** 仕訳ID（選別完了→送出時に全件付与） */
  journalId: string | null
  /** 操作者スタッフID（アップロード/取込時に記録。ゲストの場合は'guest'。DL-042追加） */
  createdBy: string | null
  /** 最終更新者スタッフID（ステータス変更・メタデータ編集時に記録） */
  updatedBy: string | null
  /** 最終更新日時（ISO 8601） */
  updatedAt: string | null
  /** ステータス変更者スタッフID（選別操作の追跡用） */
  statusChangedBy: string | null
  /** ステータス変更日時（ISO 8601） */
  statusChangedAt: string | null

  // ── AI分類結果（firstAi API。独自アップロード時に取得、Drive経路はフェーズ3.5で追加予定） ──
  /** AI抽出日付（YYYY-MM-DD） */
  aiDate?: string | null
  /** AI抽出金額（整数） */
  aiAmount?: number | null
  /** AI抽出取引先名 */
  aiVendor?: string | null
  /** AI判定証票種別（例: 'receipt', 'bank_statement'） */
  aiSourceType?: string | null
  /** AI判定仕訳方向（'expense' | 'income' | 'transfer' | 'mixed'） */
  aiDirection?: string | null
  /** AI抽出摘要 */
  aiDescription?: string | null
  /** AI判定根拠 */
  aiFirstAiReason?: string | null
  /** AI抽出行データ（通帳/クレカ: N行、レシート: 1行、対象外: 空） */
  aiLineItems?: {
    line_index: number
    date: string | null
    description: string
    amount: number
    direction: 'expense' | 'income'
    balance: number | null
    // 科目確定結果（firstAi API → determineAccount() で付与。Step4-C）
    vendor_id?: string | null
    vendor_name?: string | null
    determined_account?: string | null
    tax_category?: string | null
    sub_account?: string | null
    department?: string | null
    rule_id?: string | null
    level?: 'A' | 'B' | 'insufficient'
    determination_method?: DeterminationMethod | null
    candidates?: string[]
  }[] | null
  /** AI行データ件数 */
  aiLineItemsCount?: number
  /** 補助資料フラグ（CSV/Excel等。AI処理スキップ対象） */
  aiSupplementary?: boolean
  /** AI判定証票枚数（2以上は複数証票警告） */
  aiDocumentCount?: number
  /** AI判定枚数根拠（#5修正: firstAi.document_count_reasonを転写） */
  aiDocumentCountReason?: string | null
  /** AI警告メッセージ（OK判定だが注意が必要） */
  aiWarning?: string | null
  /** AI重複検出結果（#6修正: firstAi.validation.isDuplicateを転写） */
  aiValidationIsDuplicate?: boolean
  /** クレカ払い判定（receipt/receipt_issuedのみ。AIが証票画像から判定。2026-06-28 #28追加） */
  aiIsCreditCardPayment?: boolean
  /** AI処理モード（auto/manual/excluded） */
  aiProcessingMode?: string | null
  /** AIフォールバック適用フラグ */
  aiFallbackApplied?: boolean
  /** AI処理メトリクス（コスト・トークン数等） */
  aiMetrics?: {
    source_type_confidence: number
    direction_confidence: number
    duration_ms: number
    prompt_tokens: number
    completion_tokens: number
    thinking_tokens: number
    token_count: number
    cost_yen: number
    model: string
    /** 前処理前サイズ（KB） */
    original_size_kb?: number
    /** 前処理後サイズ（KB） */
    processed_size_kb?: number
    /** 削減率（%） */
    preprocess_reduction_pct?: number
  } | null
  /** 重複検出フラグ（SHA-256ハッシュ一致。T-AUD-5: アップロード時に判定済みの値を保持） */
  // ※ isDuplicateはfirstAiデータではなくハッシュ比較結果。AI_FIELD_KEYSに含めない（削除対象外）
  isDuplicate?: boolean
}

/**
 * 確定送信時のai*フィールド管理一覧
 *
 * ■ 削除対象（clearAiFieldsでnullに設定）:
 *   aiDate, aiAmount, aiVendor, aiSourceType, aiDirection,
 *   aiDescription, aiFirstAiReason, aiLineItems, aiLineItemsCount,
 *   aiSupplementary, aiDocumentCount, aiWarning, aiProcessingMode, aiFallbackApplied
 *
 * ■ 削除しない（永続保持）:
 *   aiMetrics    — 管理ダッシュボード指標（トークン数・費用・処理時間）
 *   isDuplicate  — SHA-256ハッシュ比較結果（firstAi出力ではない）
 *
 * フィールド追加時はここと DocEntry 型定義を同時に更新すること。
 */
export const AI_FIELD_KEYS: (keyof DocEntry)[] = [
  'aiDate', 'aiAmount', 'aiVendor', 'aiSourceType', 'aiDirection',
  'aiDescription', 'aiFirstAiReason', 'aiLineItems', 'aiLineItemsCount',
  'aiSupplementary', 'aiDocumentCount', 'aiDocumentCountReason',
  'aiWarning', 'aiValidationIsDuplicate', 'aiProcessingMode',
  'aiFallbackApplied',
]
