/**
 * DriveFileListUI 型定義
 * Phase 6.1 Step 3: Mock Composable 用
 *
 * UI契約（props）の型定義
 */

/**
 * 顧問先の最小情報（DriveFileListUI用）
 */
export interface ClientStub {
  /** 顧問先の一意のID（Phase 6.1: 手動4文字、Phase 7: ULID 26文字） */
  clientId: string;
  /** 3コード（AAA, BBB） */
  code: string;
  /** 顧問先名 */
  name: string;
  /** この顧問先専用のドライブID */
  driveId: string;
}

/**
 * ドライブから取得したファイル情報
 */
export interface DriveFile {
  /** Google Drive の File ID */
  fileId: string;
  /** ファイル名（例: receipt_001.jpg） */
  name: string;
  /** MIME Type（image/jpeg, application/pdf, text/csv） */
  mimeType: string;
  /** アップロード日時（ISO 8601形式） */
  uploadedAt: string;
}

/**
 * DriveFileListUI のコンポーネントプロパティ
 */
export interface DriveFileListProps {
  // 顧問先（2社固定）
  clients: ClientStub[];
  selectedClientId: string | null;

  // ドライブファイル一覧
  files: DriveFile[];
  isLoadingFiles: boolean;

  // OCR処理状態
  processingFileId: string | null;

  // 結果
  createdJobId: string | null;
  error: string | null;

  // イベント
  onSelectClient(clientId: string): void;
  onProcessFile(fileId: string): Promise<void>; // Gemini OCR実行
}
