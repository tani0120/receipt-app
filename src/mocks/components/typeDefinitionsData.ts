/**
 * 全型定義一覧データ（TypeDefinitionsPanel用）
 *
 * 横列: 初回AI / 独自アップロード / ドライブ / 本番AI / 出力 / 費用合計
 * 縦列: 全フィールドをMECE（もれなくダブりなく）で網羅
 */

export interface TypeField {
  /** フィールド名（英語） */
  field: string
  /** 日本語名 */
  label: string
  /** 型名（TypeScript表記） */
  tsType: string
  /** 初回AI（ClassifyResponse） */
  initialAi: '✅' | '❌' | '—'
  /** 独自アップロード（UploadEntry→DocEntry） */
  upload: '✅' | '❌' | '⚠️破棄' | '—'
  /** ドライブ（DriveFileItem→DocEntry+JobRow） */
  drive: '✅' | '❌' | '—'
  /** 本番AI（ExtractResponse） */
  prodAi: '✅' | '❌' | '—' | '将来'
  /** 出力（CSV/ZIP） */
  output: '✅' | '❌' | '—'
  /** 費用合計 */
  cost: '✅' | '❌' | '—'
  /** 備考 */
  note: string
}

export interface TypeSection {
  title: string
  icon: string
  fields: TypeField[]
}

export const TYPE_SECTIONS: TypeSection[] = [
  {
    title: 'A. ファイルメタデータ（基本情報）',
    icon: 'fa-solid fa-file',
    fields: [
      { field: 'id', label: 'ファイルID', tsType: 'string', initialAi: '—', upload: '✅', drive: '✅', prodAi: '—', output: '✅', cost: '—', note: '独自: crypto.randomUUID() / Drive: DriveFileItem.id' },
      { field: 'fileName', label: 'ファイル名', tsType: 'string', initialAi: '—', upload: '✅', drive: '✅', prodAi: '—', output: '✅', cost: '—', note: '独自: File.name / Drive: DriveFileItem.name' },
      { field: 'fileType / mimeType', label: 'MIMEタイプ', tsType: 'string', initialAi: '—', upload: '✅', drive: '✅', prodAi: '—', output: '—', cost: '—', note: '独自: File.type / Drive: DriveFileItem.mimeType' },
      { field: 'fileSize', label: 'ファイルサイズ', tsType: 'number', initialAi: '—', upload: '✅', drive: '✅', prodAi: '—', output: '—', cost: '—', note: 'バイト単位' },
      { field: 'fileHash', label: 'SHA-256ハッシュ', tsType: 'string | null', initialAi: '✅', upload: '✅', drive: '❌', prodAi: '—', output: '—', cost: '—', note: 'classify APIで算出。Drive側はmigrate完了後に後付け' },
      { field: 'createdTime / receivedAt', label: '作成日時', tsType: 'string', initialAi: '—', upload: '✅', drive: '✅', prodAi: '—', output: '—', cost: '—', note: '独自: completedAt / Drive: DriveFileItem.createdTime' },
      { field: 'thumbnailUrl', label: 'サムネイル', tsType: 'string | null', initialAi: '—', upload: '✅', drive: '✅', prodAi: '—', output: '—', cost: '—', note: '独自: canvas生成 / Drive: SA認証DL→base64' },
      { field: 'previewUrl', label: 'プレビューURL', tsType: 'string | null', initialAi: '✅', upload: '✅', drive: '✅', prodAi: '—', output: '—', cost: '—', note: '独自: サーバー保存先 / Drive: /api/drive/preview/:id' },
      { field: 'driveFileId', label: 'DriveファイルID', tsType: 'string | null', initialAi: '—', upload: '❌', drive: '✅', prodAi: '—', output: '—', cost: '—', note: 'Drive経路のみ' },
    ],
  },
  {
    title: 'B. AI分類結果（classify API）',
    icon: 'fa-solid fa-brain',
    fields: [
      { field: 'date', label: '日付', tsType: 'string | null', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '—', output: '✅', cost: '—', note: 'YYYY-MM-DD。仕訳入力の初期値。独自では取得後DocEntry変換時に破棄' },
      { field: 'total_amount / amount', label: '金額', tsType: 'number | null', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '—', output: '✅', cost: '—', note: '税込合計。仕訳入力の初期値' },
      { field: 'issuer_name / vendor', label: '取引先', tsType: 'string | null', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '—', output: '✅', cost: '—', note: '取引先照合の入力' },
      { field: 'source_type', label: '証票種別', tsType: 'SourceType', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '—', output: '—', cost: '—', note: '12種判定（receipt/invoice_received等）' },
      { field: 'source_type_confidence', label: '種別信頼度', tsType: 'number', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '—', output: '—', cost: '—', note: '0.0〜1.0' },
      { field: 'direction', label: '仕訳方向', tsType: 'Direction', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '—', output: '✅', cost: '—', note: 'expense/income/transfer/mixed' },
      { field: 'direction_confidence', label: '方向信頼度', tsType: 'number', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '—', output: '—', cost: '—', note: '0.0〜1.0' },
      { field: 'processing_mode', label: '処理モード', tsType: 'ProcessingMode', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '—', output: '—', cost: '—', note: 'auto/manual/excluded' },
      { field: 'description', label: '摘要', tsType: 'string | null', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '—', output: '✅', cost: '—', note: 'AI推定テキスト' },
      { field: 'classify_reason', label: '判定根拠', tsType: 'string | null', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '—', output: '—', cost: '—', note: 'AIの分類判定理由' },
      { field: 'fallback_applied', label: 'フォールバック', tsType: 'boolean', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '—', output: '—', cost: '—', note: 'フォールバックルール適用有無' },
      { field: 'supplementary', label: '補助資料フラグ', tsType: 'boolean', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '—', output: '—', cost: '—', note: '仕訳補助資料判定' },
      { field: 'warning', label: '警告', tsType: 'string | null', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '—', output: '—', cost: '—', note: 'バリデーション警告テキスト' },
      { field: 'isDuplicate', label: '重複フラグ', tsType: 'boolean', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '—', output: '—', cost: '—', note: 'SHA-256照合結果' },
      { field: 'document_count', label: '証票枚数', tsType: 'number', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '—', output: '—', cost: '—', note: '画像内の証票枚数（2以上でエラー）' },
      { field: 'document_count_reason', label: '枚数判定根拠', tsType: 'string | null', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '—', output: '—', cost: '—', note: '枚数判定の理由' },
    ],
  },
  {
    title: 'C. 行データ（line_items）',
    icon: 'fa-solid fa-list-ol',
    fields: [
      { field: 'line_index', label: '行番号', tsType: 'number', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '将来', output: '✅', cost: '—', note: '1始まり。postprocessで自動付番' },
      { field: 'line_items[].date', label: '行日付', tsType: 'string | null', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '将来', output: '✅', cost: '—', note: '通帳の各行の日付' },
      { field: 'line_items[].description', label: '行摘要', tsType: 'string', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '将来', output: '✅', cost: '—', note: '各行の摘要テキスト' },
      { field: 'line_items[].amount', label: '行金額', tsType: 'number', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '将来', output: '✅', cost: '—', note: '各行の金額' },
      { field: 'line_items[].direction', label: '行方向', tsType: "'expense' | 'income'", initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '将来', output: '✅', cost: '—', note: '支払/入金' },
      { field: 'line_items[].balance', label: '残高', tsType: 'number | null', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '将来', output: '—', cost: '—', note: '通帳の残高欄' },
      { field: 'lineItemsCount', label: '行数', tsType: 'number', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '将来', output: '—', cost: '—', note: 'line_items.length' },
    ],
  },
  {
    title: 'D. メトリクス（処理性能・費用）',
    icon: 'fa-solid fa-chart-bar',
    fields: [
      { field: 'duration_ms', label: '処理時間(ms)', tsType: 'number', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '将来', output: '—', cost: '✅', note: 'AI呼び出し処理時間' },
      { field: 'prompt_tokens', label: '入力トークン', tsType: 'number', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '将来', output: '—', cost: '✅', note: 'Geminiへの入力トークン数' },
      { field: 'completion_tokens', label: '出力トークン', tsType: 'number', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '将来', output: '—', cost: '✅', note: 'Geminiからの出力トークン数' },
      { field: 'thinking_tokens', label: '思考トークン', tsType: 'number', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '将来', output: '—', cost: '✅', note: 'Gemini内部思考トークン数' },
      { field: 'token_count', label: 'トークン合計', tsType: 'number', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '将来', output: '—', cost: '✅', note: '入力+出力合計' },
      { field: 'cost_yen', label: '利用料(円)', tsType: 'number', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '将来', output: '—', cost: '✅', note: '¥0.5〜0.6/枚。独自では取得後に破棄' },
      { field: 'model', label: '使用AIモデル', tsType: 'string', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '将来', output: '—', cost: '✅', note: 'gemini-2.5-flash等' },
      { field: 'original_size_kb', label: '元サイズ(KB)', tsType: 'number', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '—', output: '—', cost: '—', note: '前処理前のファイルサイズ' },
      { field: 'processed_size_kb', label: '圧縮後(KB)', tsType: 'number', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '—', output: '—', cost: '—', note: '前処理後のファイルサイズ' },
      { field: 'preprocess_reduction_pct', label: '削減率(%)', tsType: 'number', initialAi: '✅', upload: '⚠️破棄', drive: '❌', prodAi: '—', output: '—', cost: '—', note: '圧縮による削減率' },
    ],
  },
  {
    title: 'E. 操作者・ソース・永続化（DocEntry）',
    icon: 'fa-solid fa-user-tag',
    fields: [
      { field: 'clientId', label: '顧問先ID', tsType: 'string', initialAi: '—', upload: '✅', drive: '✅', prodAi: '—', output: '✅', cost: '—', note: 'ルートパラメータから取得' },
      { field: 'source', label: 'ソース種別', tsType: 'DocSource', initialAi: '—', upload: '✅', drive: '✅', prodAi: '—', output: '—', cost: '—', note: "独自: 'staff-upload'/'guest-upload' / Drive: 'drive'" },
      { field: 'status', label: '選別ステータス', tsType: 'DocStatus', initialAi: '—', upload: '✅', drive: '✅', prodAi: '—', output: '—', cost: '—', note: 'pending/target/supporting/excluded' },
      { field: 'createdBy', label: '操作者', tsType: 'string | null', initialAi: '—', upload: '✅', drive: '❌', prodAi: '—', output: '—', cost: '—', note: '独自: スタッフID or guest / Drive: null' },
      { field: 'updatedBy', label: '最終更新者', tsType: 'string | null', initialAi: '—', upload: '❌', drive: '❌', prodAi: '—', output: '—', cost: '—', note: '将来実装' },
      { field: 'updatedAt', label: '最終更新日時', tsType: 'string | null', initialAi: '—', upload: '❌', drive: '❌', prodAi: '—', output: '—', cost: '—', note: '将来実装' },
      { field: 'statusChangedBy', label: 'ステータス変更者', tsType: 'string | null', initialAi: '—', upload: '❌', drive: '❌', prodAi: '—', output: '—', cost: '—', note: '将来実装' },
      { field: 'statusChangedAt', label: 'ステータス変更日時', tsType: 'string | null', initialAi: '—', upload: '❌', drive: '❌', prodAi: '—', output: '—', cost: '—', note: '将来実装' },
      { field: 'batchId', label: 'バッチID', tsType: 'string | null', initialAi: '—', upload: '❌', drive: '❌', prodAi: '—', output: '—', cost: '—', note: '選別完了→送出時に付与' },
      { field: 'journalId', label: '仕訳ID', tsType: 'string | null', initialAi: '—', upload: '❌', drive: '❌', prodAi: '—', output: '✅', cost: '—', note: '選別完了→送出時に付与' },
    ],
  },
  {
    title: 'F. Drive専用（JobRow: migration_jobs）',
    icon: 'fa-brands fa-google-drive',
    fields: [
      { field: 'job_id', label: '移行バッチID', tsType: 'string', initialAi: '—', upload: '—', drive: '✅', prodAi: '—', output: '—', cost: '—', note: 'UUID。1回の確定送信=1ジョブ' },
      { field: 'drive_file_id', label: 'DriveファイルID', tsType: 'string', initialAi: '—', upload: '—', drive: '✅', prodAi: '—', output: '—', cost: '—', note: 'DocEntry.driveFileIdと対応' },
      { field: 'doc_status', label: '選別結果', tsType: 'string', initialAi: '—', upload: '—', drive: '✅', prodAi: '—', output: '—', cost: '—', note: 'DocEntry.statusと対応' },
      { field: 'migration_status', label: '移行進捗', tsType: 'string', initialAi: '—', upload: '—', drive: '✅', prodAi: '—', output: '—', cost: '—', note: 'queued/processing/done/failed' },
      { field: 'retry_count', label: 'リトライ回数', tsType: 'number', initialAi: '—', upload: '—', drive: '✅', prodAi: '—', output: '—', cost: '—', note: '失敗時の再試行回数' },
      { field: 'last_error', label: '最終エラー', tsType: 'string | null', initialAi: '—', upload: '—', drive: '✅', prodAi: '—', output: '—', cost: '—', note: '最後に発生したエラーメッセージ' },
      { field: 'storage_path', label: 'ローカル保存先', tsType: 'string | null', initialAi: '—', upload: '—', drive: '✅', prodAi: '—', output: '—', cost: '—', note: '≒ DocEntry.previewUrl' },
      { field: 'downloaded_at', label: 'ZIP DL日時', tsType: 'string | null', initialAi: '—', upload: '—', drive: '✅', prodAi: '—', output: '✅', cost: '—', note: '仕訳外ZIPダウンロード済み日時' },
      { field: 'storage_purged_at', label: 'ストレージ削除日時', tsType: 'string | null', initialAi: '—', upload: '—', drive: '✅', prodAi: '—', output: '—', cost: '—', note: 'ローカルファイル削除日時' },
    ],
  },
  {
    title: 'G. マスタ型（Staff / Client / その他）',
    icon: 'fa-solid fa-building',
    fields: [
      { field: 'Staff.uuid', label: 'スタッフID', tsType: 'string', initialAi: '—', upload: '—', drive: '—', prodAi: '—', output: '—', cost: '—', note: 'ログイン認証・担当者紐付け' },
      { field: 'Staff.name', label: 'スタッフ名', tsType: 'string', initialAi: '—', upload: '—', drive: '—', prodAi: '—', output: '—', cost: '—', note: '' },
      { field: 'Staff.email', label: 'スタッフメール', tsType: 'string', initialAi: '—', upload: '—', drive: '—', prodAi: '—', output: '—', cost: '—', note: 'ログイン認証用' },
      { field: 'Staff.role', label: 'ロール', tsType: 'StaffRole', initialAi: '—', upload: '—', drive: '—', prodAi: '—', output: '—', cost: '—', note: 'admin / general' },
      { field: 'Staff.status', label: 'スタッフ状態', tsType: 'StaffStatus', initialAi: '—', upload: '—', drive: '—', prodAi: '—', output: '—', cost: '—', note: 'active / inactive' },
      { field: 'Client（全42フィールド）', label: '顧問先', tsType: 'Client', initialAi: '—', upload: '—', drive: '—', prodAi: '—', output: '—', cost: '—', note: 'clientId/threeCode/companyName/type/fiscalMonth/industry等' },
      { field: 'ShareStatusRecord', label: '共有設定', tsType: 'ShareStatusRecord', initialAi: '—', upload: '—', drive: '—', prodAi: '—', output: '—', cost: '—', note: 'clientId/status/inviteCode/updatedAt' },
      { field: 'AppNotification', label: 'アプリ通知', tsType: 'AppNotification', initialAi: '—', upload: '—', drive: '—', prodAi: '—', output: '—', cost: '—', note: 'id/type/title/body/isRead/createdAt/clientId/jobId/action' },
      { field: 'ConfirmedJournal', label: '確定済み仕訳', tsType: 'unknown', initialAi: '—', upload: '—', drive: '—', prodAi: '—', output: '—', cost: '—', note: 'T-03未着手のため仮定義（unknown）' },
    ],
  },
]

/** 凡例 */
export const LEGEND = [
  { symbol: '✅', label: '取得・保持される', color: '#16a34a' },
  { symbol: '⚠️破棄', label: '取得後にDocEntry変換時に破棄', color: '#dc2626' },
  { symbol: '❌', label: '取得されない・未実装', color: '#94a3b8' },
  { symbol: '将来', label: '将来実装予定（extract API）', color: '#7c3aed' },
  { symbol: '—', label: '該当なし', color: '#cbd5e1' },
]
