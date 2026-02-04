/**
 * DriveFileListUI Mock Composable
 * Phase 6.1 Step 3: 型安全性確認用
 *
 * 目的:
 * - UI契約（DriveFileListProps）を満たすモックデータを生成
 * - API呼び出しは一切しない
 * - 型エラーが発生しないことを確認
 */

import { ref } from 'vue';
import type { DriveFileListProps, ClientStub, DriveFile } from '@/types/DriveFileList.types';

/**
 * Mock Composable: DriveFileListUI
 *
 * @returns DriveFileListPropsを満たすオブジェクト
 */
export function useDriveFileListMock(): DriveFileListProps {
  // ========================================
  // 1. 顧問先（2社固定）
  // ========================================
  const clients: ClientStub[] = [
    {
      clientId: 'AAA1', // Phase 6.1: 手動割り当て（4文字）
      code: 'AAA',
      name: 'AAA_株式会社テスト',
      driveId: '1Y4l8fVbXS3Lf4Cl_wZa_wYh0AcbbIcMj',
    },
    {
      clientId: 'BBB1', // Phase 6.1: 手動割り当て（4文字）
      code: 'BBB',
      name: 'BBB_田中太郎',
      driveId: '1EPbLNQPCcGZZBQvKXtJUxYXnpI3-Kwqb',
    },
  ];

  const selectedClientId = ref<string | null>(null);

  // ========================================
  // 2. ドライブファイル一覧（ダミーデータ）
  // ========================================
  const files = ref<DriveFile[]>([]);
  const isLoadingFiles = ref(false);

  // ========================================
  // 3. OCR処理状態
  // ========================================
  const processingFileId = ref<string | null>(null);
  const createdJobId = ref<string | null>(null);
  const error = ref<string | null>(null);

  // ========================================
  // 4. イベントハンドラ
  // ========================================

  /**
   * 顧問先選択
   * @param clientId 選択された顧問先ID
   */
  const onSelectClient = (clientId: string): void => {
    selectedClientId.value = clientId;
    error.value = null;
    createdJobId.value = null;

    // Mock: ファイル一覧を生成
    isLoadingFiles.value = true;
    setTimeout(() => {
      files.value = [
        {
          fileId: 'file-001',
          name: 'receipt_001.jpg',
          mimeType: 'image/jpeg',
          uploadedAt: '2026-02-01T10:00:00.000Z',
        },
        {
          fileId: 'file-002',
          name: 'invoice_002.pdf',
          mimeType: 'application/pdf',
          uploadedAt: '2026-02-01T11:30:00.000Z',
        },
        {
          fileId: 'file-003',
          name: 'receipt_003.png',
          mimeType: 'image/png',
          uploadedAt: '2026-02-01T14:00:00.000Z',
        },
      ];
      isLoadingFiles.value = false;
    }, 500); // 非同期のフリ（500ms）
  };

  /**
   * ファイル処理（OCR実行）
   * @param fileId 処理するファイルID
   */
  const onProcessFile = async (fileId: string): Promise<void> => {
    processingFileId.value = fileId;
    error.value = null;
    createdJobId.value = null;

    try {
      // Mock: OCR実行のフリ（2秒待機）
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock: jobId生成
      const mockJobId = `job-${Date.now()}-${fileId}`;
      createdJobId.value = mockJobId;

      console.log(`[Mock] OCR実行完了: fileId=${fileId}, jobId=${mockJobId}`);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Mock] OCR実行エラー:', err);
    } finally {
      processingFileId.value = null;
    }
  };

  // ========================================
  // 5. UI契約を満たすオブジェクトを返す
  // ========================================
  return {
    clients,
    selectedClientId: selectedClientId.value,

    files: files.value,
    isLoadingFiles: isLoadingFiles.value,

    processingFileId: processingFileId.value,

    createdJobId: createdJobId.value,
    error: error.value,

    onSelectClient,
    onProcessFile,
  };
}
