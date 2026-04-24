/**
 * 全型定義一覧データ
 * ✅=存在 🔧=未済(対応可能だが未実施) ⛔=不可(物理的/技術的に不可能) 将来 —=該当なし
 */

export type CellValue = '✅' | '🔧' | '⛔' | '—' | '将来'

export interface TypeField {
  field: string; label: string; tsType: string
  uploadOwn: CellValue; uploadDrive: CellValue
  selectOwn: CellValue; selectDrive: CellValue
  prodAi: CellValue
  outMf: CellValue; outCost: CellValue; outStaffCount: CellValue; outStaffTime: CellValue
  note: string
}

export interface TypeSection { title: string; icon: string; fields: TypeField[] }

// 略称: U=upload, S=select, P=prodAi, M=outMf, C=outCost, SC=outStaffCount, ST=outStaffTime
export const TYPE_SECTIONS: TypeSection[] = [
  {
    title: 'A. ファイルメタデータ（基本情報）', icon: 'fa-solid fa-file',
    fields: [
      { field: 'id', label: 'ファイルID', tsType: 'string', uploadOwn: '✅', uploadDrive: '✅', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '独自: documentId / Drive: DriveFileItem.id' },
      { field: 'fileName', label: 'ファイル名', tsType: 'string', uploadOwn: '✅', uploadDrive: '✅', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '' },
      { field: 'fileType', label: 'MIMEタイプ', tsType: 'string', uploadOwn: '✅', uploadDrive: '✅', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '' },
      { field: 'fileSize', label: 'サイズ', tsType: 'number', uploadOwn: '✅', uploadDrive: '✅', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '' },
      { field: 'fileHash', label: 'SHA-256', tsType: 'string | null', uploadOwn: '✅', uploadDrive: '🔧', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'Drive: migrationWorkerで計算→doc-store書き戻し' },
      { field: 'receivedAt', label: '作成日時', tsType: 'string', uploadOwn: '✅', uploadDrive: '✅', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '' },
      { field: 'thumbnailUrl', label: 'サムネイル', tsType: 'string | null', uploadOwn: '✅', uploadDrive: '✅', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '' },
      { field: 'previewUrl', label: 'プレビュー', tsType: 'string | null', uploadOwn: '✅', uploadDrive: '✅', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '' },
      { field: 'driveFileId', label: 'DriveID', tsType: 'string | null', uploadOwn: '⛔', uploadDrive: '✅', selectOwn: '⛔', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '独自経路にDrive IDは物理的に存在しない' },
    ],
  },
  {
    title: 'B. AI分類結果（classify API）', icon: 'fa-solid fa-brain',
    fields: [
      { field: 'date', label: '日付', tsType: 'string | null', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'Drive: migrationWorkerでclassify実行→doc-store書き戻し' },
      { field: 'amount', label: '金額', tsType: 'number | null', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '同上' },
      { field: 'vendor', label: '取引先', tsType: 'string | null', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '同上' },
      { field: 'source_type', label: '証票種別', tsType: 'SourceType', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '同上' },
      { field: 'direction', label: '仕訳方向', tsType: 'Direction', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '同上' },
      { field: 'description', label: '摘要', tsType: 'string | null', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '同上' },
      { field: 'classify_reason', label: '判定根拠', tsType: 'string | null', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '同上' },
      { field: 'supplementary', label: '補助資料', tsType: 'boolean', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '同上' },
      { field: 'confidence', label: '信頼度(2種)', tsType: 'number', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '同上' },
      { field: 'processing_mode', label: '処理モード', tsType: 'string', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '同上 → DocEntry.aiProcessingMode' },
      { field: 'fallback', label: 'フォールバック', tsType: 'boolean', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '同上 → DocEntry.aiFallbackApplied' },
      { field: 'warning', label: '警告', tsType: 'string | null', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '同上 → DocEntry.aiWarning' },
      { field: 'isDuplicate', label: '重複フラグ', tsType: 'boolean', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '🔧', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'classifyのfileHash重複チェックで判定' },
      { field: 'document_count', label: '証票枚数', tsType: 'number', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '同上 → DocEntry.aiDocumentCount' },
    ],
  },
  {
    title: 'C. 行データ（line_items）', icon: 'fa-solid fa-list-ol',
    fields: [
      { field: 'lineItems[]', label: '行データ配列', tsType: 'Array', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '将来', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'Drive: migrationWorkerでclassify実行→doc-store書き戻し' },
      { field: 'lineItemsCount', label: '行数', tsType: 'number', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '将来', outMf: '—', outCost: '—', outStaffCount: '✅', outStaffTime: '—', note: '同上' },
    ],
  },
  {
    title: 'D. メトリクス（処理性能・費用）', icon: 'fa-solid fa-chart-bar',
    fields: [
      { field: 'duration_ms', label: '処理時間', tsType: 'number', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '将来', outMf: '—', outCost: '✅', outStaffCount: '—', outStaffTime: '✅', note: 'Drive: migrationWorkerでclassify実行→doc-store書き戻し' },
      { field: 'tokens(3種)', label: 'トークン数', tsType: 'number', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '将来', outMf: '—', outCost: '✅', outStaffCount: '—', outStaffTime: '—', note: '同上' },
      { field: 'cost_yen', label: '利用料(円)', tsType: 'number', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '将来', outMf: '—', outCost: '✅', outStaffCount: '—', outStaffTime: '—', note: '同上' },
      { field: 'model', label: 'AIモデル', tsType: 'string', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '将来', outMf: '—', outCost: '✅', outStaffCount: '—', outStaffTime: '—', note: '同上' },
      { field: 'size_kb(2種)', label: 'サイズ(KB)', tsType: 'number', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'aiMetrics.original_size_kb / processed_size_kb' },
      { field: 'reduction_pct', label: '削減率(%)', tsType: 'number', uploadOwn: '✅', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'aiMetrics.preprocess_reduction_pct' },
    ],
  },
  {
    title: 'E. 入口・操作者（DocEntry基本）', icon: 'fa-solid fa-user-tag',
    fields: [
      { field: 'clientId', label: '顧問先ID', tsType: 'string', uploadOwn: '✅', uploadDrive: '✅', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '✅', outCost: '—', outStaffCount: '✅', outStaffTime: '✅', note: '' },
      { field: 'source', label: 'ソース種別', tsType: 'DocSource', uploadOwn: '⛔', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '永続化時(handleConfirm)に付与。一時バッファには不要' },
      { field: 'createdBy', label: '操作者', tsType: 'string | null', uploadOwn: '⛔', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '✅', outStaffTime: '✅', note: 'Drive: fetchDriveFiles時にcurrentStaffId付与' },
      { field: 'updatedBy', label: '最終更新者', tsType: 'string | null', uploadOwn: '⛔', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'updateStatus()でstaffId付与。選別操作時に記録' },
      { field: 'updatedAt', label: '最終更新日時', tsType: 'string | null', uploadOwn: '⛔', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '同上' },
    ],
  },
  {
    title: 'F. 資料選別（選別→送出）', icon: 'fa-solid fa-filter',
    fields: [
      { field: 'status', label: '選別ステータス', tsType: 'DocStatus', uploadOwn: '✅', uploadDrive: '✅', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '' },
      { field: 'statusChangedBy', label: '選別操作者', tsType: 'string | null', uploadOwn: '⛔', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'updateStatus()でstaffId付与。選別操作時に記録' },
      { field: 'statusChangedAt', label: '選別日時', tsType: 'string | null', uploadOwn: '⛔', uploadDrive: '⛔', selectOwn: '✅', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '同上' },
      { field: 'batchId', label: 'バッチID', tsType: 'string | null', uploadOwn: '⛔', uploadDrive: '⛔', selectOwn: '⛔', selectDrive: '⛔', prodAi: '—', outMf: '🔧', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '送出フェーズで付与。選別時点では物理的に未存在' },
      { field: 'journalId', label: '仕訳ID', tsType: 'string | null', uploadOwn: '⛔', uploadDrive: '⛔', selectOwn: '⛔', selectDrive: '⛔', prodAi: '—', outMf: '✅', outCost: '—', outStaffCount: '✅', outStaffTime: '—', note: '同上' },
    ],
  },
  {
    title: 'G. Drive専用（JobRow）', icon: 'fa-brands fa-google-drive',
    fields: [
      { field: 'job_id', label: '移行バッチID', tsType: 'string', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '' },
      { field: 'migration_status', label: '移行進捗', tsType: 'string', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '' },
      { field: 'retry_count', label: 'リトライ', tsType: 'number', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '' },
      { field: 'last_error', label: '最終エラー', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '' },
      { field: 'storage_path', label: '保存先', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '' },
      { field: 'downloaded_at', label: 'ZIP DL日時', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '' },
      { field: 'storage_purged_at', label: '削除日時', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '✅', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '' },
    ],
  },
  {
    title: 'H. マスタ型（Staff / Client / その他）', icon: 'fa-solid fa-building',
    fields: [
      { field: 'Staff', label: 'スタッフ(5項目)', tsType: 'Staff', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '' },
      { field: 'Client', label: '顧問先(42項目)', tsType: 'Client', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '' },
      { field: 'ShareStatus', label: '共有設定', tsType: 'ShareStatusRecord', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '' },
      { field: 'Notification', label: 'アプリ通知', tsType: 'AppNotification', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '' },
      { field: 'ConfirmedJournal', label: '確定済み仕訳', tsType: 'unknown', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'T-03未着手' },
    ],
  },
]

export const LEGEND = [
  { symbol: '✅', label: 'データが存在する', color: '#16a34a' },
  { symbol: '🔧', label: '未済（対応可能だが未実施）', color: '#f59e0b' },
  { symbol: '⛔', label: '不可（物理的/技術的に不可能）', color: '#dc2626' },
  { symbol: '将来', label: '将来実装予定', color: '#7c3aed' },
  { symbol: '—', label: '該当なし', color: '#cbd5e1' },
]
