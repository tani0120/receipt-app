/**
 * fileTypes.ts — ファイル形式判定ユーティリティ（フロント用）
 *
 * 配置: src/shared/ — フロント（Vue）から参照
 * 責務: MIMEタイプ・拡張子のホワイトリスト判定
 */

// ============================================================
// ファイル形式ホワイトリスト（唯一の定義元）
// ============================================================

/** パイプラインで処理可能なMIMEタイプ */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
  'application/pdf',
] as const;

/** パイプラインで処理可能な拡張子（ドット付き小文字） */
export const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp', '.pdf',
] as const;

/** MFインポート用ファイルの拡張子（エラーメッセージ分岐用） */
export const MF_IMPORT_EXTENSIONS = [
  '.csv', '.xlsx', '.xls', '.ods', '.ks', '.mf',
] as const;

// ============================================================
// ファイル形式バリデーション（フロント送信前に使用）
// ============================================================

/**
 * ファイルがパイプライン処理可能か判定する
 * @returns 'ok'=AI処理対象、'supplementary'=補助対象（AI不要）
 */
export function validateFileType(file: File): 'ok' | 'supplementary' {
  const ext = ('.' + (file.name.split('.').pop() ?? '')).toLowerCase();
  const mime = file.type.toLowerCase();

  const mimeOk = (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
  const extOk = (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
  if (mimeOk || extOk) return 'ok';

  return 'supplementary';
}

/**
 * D&Dフィルタ用: MIMEタイプがドロップ受付対象か判定
 */
export function isDropAcceptable(file: File): boolean {
  return file.type.startsWith('image/') || file.type === 'application/pdf';
}
