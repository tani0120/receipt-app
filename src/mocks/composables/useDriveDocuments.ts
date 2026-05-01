/**
 * useDriveDocuments.ts — Driveファイル取得・ドキュメントマージ・フィルタ
 *
 * MockDriveSelectPage.vueから分離。
 * 責務: データ取得（Drive API + doc-store）→ DocView変換 → フィルタ・ソート
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue';
import { useDocuments } from '@/composables/useDocuments';
import { useCurrentUser } from '@/mocks/composables/useCurrentUser';
import type { DocEntry, DocStatus, DocSource } from '@/repositories/types';
import type { DriveFileItemWithThumbnail } from '@/api/services/drive/driveService';

// --- ビュー型（Drive + 独自アップロード マージ） ---
export interface DocView {
  id: string;
  source: string;          // 'drive' | 'staff-upload' | 'guest-upload'
  fileName: string;
  fileType: string;
  fileSize: string;
  uploadDate: string;
  uploadDateRaw: number;   // ソート用Unix時刻
  thumbnailBase64: string;
  previewUrlFull: string;  // プレビュー用フルURL
  status: DocStatus;
  mimeType: string;
  // AI分類結果（証票分類AIが設定。未分類時はundefined）
  aiDate?: string | null;
  aiAmount?: number | null;
  aiVendor?: string | null;
  aiSourceType?: string | null;
  aiDirection?: string | null;
  aiDescription?: string | null;
  aiLineItemsCount?: number;
  aiSupplementary?: boolean;
  aiDocumentCount?: number;
  aiWarning?: string | null;
  aiProcessingMode?: string | null;
  aiFallbackApplied?: boolean;
}

// --- ユーティリティ ---
export const formatFileSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? (bytes / (1024 * 1024)).toFixed(1) + 'MB'
    : Math.round(bytes / 1024) + 'KB';

export const formatDate = (dateStr: string) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\//g, '/')
    : '';

export interface UseDriveDocumentsReturn {
  /** Drive APIから取得した生ファイルデータ */
  driveFiles: Ref<DriveFileItemWithThumbnail[]>;
  /** 独自アップロードファイル（doc-storeから取得） */
  uploadedDocs: Ref<DocEntry[]>;
  /** Driveファイルの選別結果をローカル保持 */
  driveSelections: Ref<Map<string, DocStatus>>;
  /** 仕訳外件数 */
  excludedCount: Ref<number>;
  /** ローディング状態 */
  isLoading: Ref<boolean>;
  /** Drive + アップロード マージ済み全ドキュメント */
  allDocsView: ComputedRef<DocView[]>;
  /** フィルタ適用後のドキュメント */
  documents: ComputedRef<DocView[]>;
  /** 現在のフィルタ */
  activeFilter: Ref<DocStatus | 'all'>;
  /** Driveファイル取得 */
  fetchDriveFiles: () => Promise<void>;
  /** doc-storeからアップロードファイル取得 */
  fetchUploadedDocs: () => Promise<void>;
  /** 仕訳外件数取得 */
  fetchExcludedCount: () => Promise<void>;
  /** Drive + doc-store両方を再取得 */
  handleReload: () => Promise<void>;
  /** フィルタ切替 */
  toggleFilter: (filter: DocStatus | 'all') => void;
}

/**
 * Driveファイル取得・ドキュメントマージ・フィルタを提供するcomposable
 *
 * @param clientId - 顧問先ID（ref）
 * @param sharedFolderId - 共有フォルダID取得関数
 * @param resetSelectedIdx - 選択インデックスリセット関数（フィルタ切替時）
 */
export function useDriveDocuments(
  clientId: ComputedRef<string>,
  sharedFolderId: () => string | undefined,
  resetSelectedIdx: () => void,
): UseDriveDocumentsReturn {
  const { updateStatus: updateDocStatus, addDocuments: addDocs, allDocuments } = useDocuments();
  const { currentStaffId } = useCurrentUser();

  const isLoading = ref(false);
  const driveFiles = ref<DriveFileItemWithThumbnail[]>([]);
  const driveSelections = ref<Map<string, DocStatus>>(new Map());
  const uploadedDocs = ref<DocEntry[]>([]);
  const excludedCount = ref(0);

  // --- データ取得 ---

  /** Driveファイル一覧取得（サムネイルbase64付き） → doc-storeにも登録して永続化 */
  const fetchDriveFiles = async () => {
    const folderId = sharedFolderId();
    if (!folderId) return;

    isLoading.value = true;
    try {
      const res = await fetch(`/api/drive/files?folderId=${encodeURIComponent(folderId)}&withThumbnails=true`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json() as { files: DriveFileItemWithThumbnail[] };
      driveFiles.value = data.files;

      // allDocumentsからDriveファイルの既存statusを復元（リロード対策）
      for (const f of data.files) {
        const existing = allDocuments.value.find(d => d.driveFileId === f.id);
        if (existing) {
          driveSelections.value.set(f.id, existing.status);
        } else if (!driveSelections.value.has(f.id)) {
          driveSelections.value.set(f.id, 'pending');
        }
      }

      // DriveファイルをuseDocuments経由でallDocuments ref + doc-storeに登録（重複排除付き）
      const driveDocEntries: DocEntry[] = data.files.map(f => ({
        id: f.id,
        clientId: clientId.value,
        source: 'drive' as DocSource,
        fileName: f.name,
        fileType: f.mimeType || 'application/octet-stream',
        fileSize: f.size || 0,
        fileHash: null,
        driveFileId: f.id,
        thumbnailUrl: `/api/drive/preview/${f.id}?clientId=${encodeURIComponent(clientId.value)}`,
        previewUrl: `/api/drive/preview/${f.id}?clientId=${encodeURIComponent(clientId.value)}`,
        status: driveSelections.value.get(f.id) || 'pending' as DocStatus,
        receivedAt: f.createdTime || new Date().toISOString(),
        batchId: null,
        journalId: null,
        createdBy: currentStaffId.value,
        updatedBy: null,
        updatedAt: null,
        statusChangedBy: null,
        statusChangedAt: null,
      }));
      if (driveDocEntries.length > 0) {
        addDocs(driveDocEntries);
      }

      console.log(`[useDriveDocuments] Driveファイル${data.files.length}件取得 → doc-storeに登録`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Driveファイル取得エラー: ${msg}`);
    } finally {
      isLoading.value = false;
    }
  };

  /** doc-storeからpending状態の独自アップロードファイルを取得 */
  const fetchUploadedDocs = async () => {
    try {
      const res = await fetch(`/api/doc-store?clientId=${encodeURIComponent(clientId.value)}`);
      if (!res.ok) return;
      const data = await res.json() as { documents: DocEntry[] };
      // 独自アップロードファイルを取得（Driveファイルは除外、全status表示）
      uploadedDocs.value = data.documents.filter(
        (d: DocEntry) => d.source !== 'drive'
      );
      console.log(`[useDriveDocuments] doc-store: ${uploadedDocs.value.length}件（独自アップロード）`);
    } catch (err) {
      console.warn('[useDriveDocuments] doc-store取得失敗:', err);
    }
  };

  const fetchExcludedCount = async () => {
    try {
      const res = await fetch(`/api/drive/excluded-count/${clientId.value}`);
      if (res.ok) {
        const data = await res.json() as { count: number };
        excludedCount.value = data.count;
      }
    } catch {
      // 取得失敗は無視
    }
  };

  const handleReload = async () => {
    await Promise.all([fetchDriveFiles(), fetchUploadedDocs()]);
  };

  // --- ドキュメントマージ ---

  const allDocsView = computed<DocView[]>(() => {
    // ① Drive借景ファイル
    const driveItems: DocView[] = driveFiles.value.map(f => {
      // allDocumentsからAI結果をlookup（previewExtract済みなら値がある）
      const docEntry = allDocuments.value.find(d => d.driveFileId === f.id);
      return {
        id: f.id,
        source: 'drive',
        fileName: f.name,
        fileType: f.mimeType.split('/').pop()?.toUpperCase() || f.mimeType,
        fileSize: formatFileSize(f.size),
        uploadDate: formatDate(f.createdTime),
        uploadDateRaw: f.createdTime ? new Date(f.createdTime).getTime() : 0,
        thumbnailBase64: f.thumbnailBase64 || '',
        previewUrlFull: `/api/drive/preview/${f.id}?clientId=${encodeURIComponent(clientId.value)}`,
        status: driveSelections.value.get(f.id) || 'pending' as DocStatus,
        mimeType: f.mimeType,
        // AI分類結果（DocEntryから転写）
        aiDate: docEntry?.aiDate,
        aiAmount: docEntry?.aiAmount,
        aiVendor: docEntry?.aiVendor,
        aiSourceType: docEntry?.aiSourceType,
        aiDirection: docEntry?.aiDirection,
        aiDescription: docEntry?.aiDescription,
        aiLineItemsCount: docEntry?.aiLineItemsCount,
        aiSupplementary: docEntry?.aiSupplementary,
        aiDocumentCount: docEntry?.aiDocumentCount,
        aiWarning: docEntry?.aiWarning,
        aiProcessingMode: docEntry?.aiProcessingMode,
        aiFallbackApplied: docEntry?.aiFallbackApplied,
      };
    });

    // ② doc-store（独自アップロード: staff-upload / guest-upload）
    const uploadItems: DocView[] = uploadedDocs.value.map(d => ({
      id: d.id,
      source: d.source,
      fileName: d.fileName,
      fileType: d.fileType.split('/').pop()?.toUpperCase() || d.fileType,
      fileSize: formatFileSize(d.fileSize),
      uploadDate: formatDate(d.receivedAt),
      uploadDateRaw: d.receivedAt ? new Date(d.receivedAt).getTime() : 0,
      thumbnailBase64: d.thumbnailUrl || '',
      previewUrlFull: d.previewUrl || '',
      status: d.status,
      mimeType: d.fileType,
      // AI分類結果（DocEntryから直接転写）
      aiDate: d.aiDate,
      aiAmount: d.aiAmount,
      aiVendor: d.aiVendor,
      aiSourceType: d.aiSourceType,
      aiDirection: d.aiDirection,
      aiDescription: d.aiDescription,
      aiLineItemsCount: d.aiLineItemsCount,
      aiSupplementary: d.aiSupplementary,
      aiDocumentCount: d.aiDocumentCount,
      aiWarning: d.aiWarning,
      aiProcessingMode: d.aiProcessingMode,
      aiFallbackApplied: d.aiFallbackApplied,
    }));

    // マージして日時降順ソート
    return [...driveItems, ...uploadItems]
      .sort((a, b) => b.uploadDateRaw - a.uploadDateRaw);
  });

  // --- フィルタ ---

  const activeFilter = ref<DocStatus | 'all'>('all');
  const toggleFilter = (filter: DocStatus | 'all') => {
    activeFilter.value = activeFilter.value === filter ? 'all' : filter;
    resetSelectedIdx();
  };

  const documents = computed<DocView[]>(() => {
    if (activeFilter.value === 'all') return allDocsView.value;
    return allDocsView.value.filter(d => d.status === activeFilter.value);
  });

  return {
    driveFiles,
    uploadedDocs,
    driveSelections,
    excludedCount,
    isLoading,
    allDocsView,
    documents,
    activeFilter,
    fetchDriveFiles,
    fetchUploadedDocs,
    fetchExcludedCount,
    handleReload,
    toggleFilter,
  };
}
