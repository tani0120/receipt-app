/**
 * DriveFileListUI 型定義
 * Phase 6.1 Step 3: Mock Composable 用
 *
 * UI契約（props）の型定義
 */

import type { Ref } from 'vue';

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
 * DriveFileListUI のコンポーネントプロパティ（UI契約 - 値のみ）
 *
 * 設計方針:
 * - Props は値のみ（Ref / reactive を含めない）
 * - Vue 依存を排除
 * - 将来の再利用性を保証
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

/**
 * DriveFileListMock Composable の返り値（Ref を含む）
 *
 * Composable は状態管理に集中し、Ref を返してOK
 * Adapter が UI契約（DriveFileListProps）に変換する
 */
export interface DriveFileListMockState {
  // 顧問先（固定値）
  clients: ClientStub[];

  // リアクティブな状態（Ref）
  selectedClientId: Ref<string | null>;
  files: Ref<DriveFile[]>;
  isLoadingFiles: Ref<boolean>;
  processingFileId: Ref<string | null>;
  createdJobId: Ref<string | null>;
  error: Ref<string | null>;

  // イベントハンドラ
  onSelectClient(clientId: string): void;
  onProcessFile(fileId: string): Promise<void>;
}
