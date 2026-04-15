/**
 * validationMessages.ts — バリデーション・エラー文言の一元管理
 *
 * 配置: src/shared/ — サーバー側・フロント側の両方からimport可能
 *
 * ルール:
 *   - 文言の追加・修正はこのファイルのみで行う
 *   - 各コンポーネントは必ずここからimportして使う
 *   - ハードコード禁止
 */

// ============================================================
// A. サーバー側バリデーション（validateClassifyResult.ts で使用）
// ============================================================

/** 複数証票エラー（document_count >= 2） */
export const multiDocumentError = (count: number) =>
  `この画像には${count}枚の証票が写っています。1枚ずつ撮影してください`

/** AI処理失敗（fallback_applied） */
export const MSG_FALLBACK_ERROR = 'AI処理に失敗しました。撮り直してください'

/** 取引先が読み取れない */
export const MSG_ISSUER_MISSING = '取引先が読み取れません。撮り直してください'

/** 日付が読み取れない */
export const MSG_DATE_MISSING = '日付が読み取れません。撮り直してください'

/** 金額が読み取れない */
export const MSG_AMOUNT_MISSING = '金額が読み取れません。撮り直してください'

// ============================================================
// B. 重複チェック文言（フロントUI表示用）
// ============================================================

/** PC版リスト: 重複バッジ（詳細版） */
export const MSG_DUPLICATE_DETAIL = 'すでにアップロードしたファイルの可能性。削除してください。'

/** モバイル版オーバーレイ: 重複（短縮版） */
export const MSG_DUPLICATE_SHORT = 'アップロード済みの可能性'

// ============================================================
// C. UIガイド文言
// ============================================================

/** エラーガイド（不備件数を含む） */
export const errorGuideMessage = (count: number) =>
  `${count}件の不備があります。赤いカードをタップして撮り直してください`

// ============================================================
// D. エラーハンドリング（receiptService.ts で使用）
// ============================================================

/** サーバーエラー */
export const serverErrorMessage = (status: number) =>
  `サーバーエラー (${status})`

/** 通信エラー（詳細あり） */
export const networkErrorMessage = (detail: string) =>
  `通信エラー: ${detail}`

// ============================================================
// E. モック用エラーリスト（VITE_USE_MOCK時に使用）
// ============================================================

/** モック用ランダムエラー文言 */
export const MOCK_ERROR_REASONS = [
  MSG_AMOUNT_MISSING,
  MSG_DATE_MISSING,
  MSG_ISSUER_MISSING,
  multiDocumentError(2),
]
