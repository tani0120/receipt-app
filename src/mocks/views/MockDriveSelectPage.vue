<template>
  <div class="ds-root">
    <!-- ヘッダー -->
    <div class="ds-header">
      <!-- 左: タイトル＋カウント -->
      <div class="ds-header-left">
        <span class="ds-title">資料選別</span>
        <div class="ds-counts">
          <button class="ds-count ds-count-all" :class="{ 'ds-count-active': activeFilter === 'all' }" @click="toggleFilter('all')">全ファイル: {{ allDocsView.length }}件</button>
          <button class="ds-count ds-count-pending" :class="{ 'ds-count-active': activeFilter === 'pending' }" @click="toggleFilter('pending')">未処理: {{ counts.pending }}件</button>
          <button class="ds-count ds-count-target" :class="{ 'ds-count-active': activeFilter === 'target' }" @click="toggleFilter('target')">仕訳対象: {{ counts.target }}件</button>
          <button class="ds-count ds-count-supporting" :class="{ 'ds-count-active': activeFilter === 'supporting' }" @click="toggleFilter('supporting')">根拠資料: {{ counts.supporting }}件</button>
          <button class="ds-count ds-count-excluded" :class="{ 'ds-count-active': activeFilter === 'excluded' }" @click="toggleFilter('excluded')">仕訳外: {{ counts.excluded }}件</button>
        </div>
      </div>
      <!-- 中央: 元に戻す／やり直し + 一括操作 -->
      <div class="ds-header-center">
        <button class="ds-undo-btn" :disabled="!canUndo" @click="undo" title="元に戻す (Ctrl+Z)">
          <i class="fa-solid fa-rotate-left"></i> 元に戻す
        </button>
        <button class="ds-redo-btn" :disabled="!canRedo" @click="redo" title="やり直し (Ctrl+Y)">
          <i class="fa-solid fa-rotate-right"></i> やり直し
        </button>
        <button v-if="checkedIds.size > 0" class="ds-bulk-open-btn" @click="showBulkModal = true">
          <i class="fa-solid fa-layer-group"></i> 一括操作 ({{ checkedIds.size }}件)
        </button>
      </div>
      <!-- 右: 確定送信 + 仕訳外DL + 再取得 -->
      <div class="ds-header-right">
        <button class="ds-submit-btn" :disabled="allDocsView.length === 0" @click="showCompleteModal = true">
          <i class="fa-solid fa-paper-plane"></i> 確定送信
        </button>
        <button v-if="excludedCount > 0" class="ds-import-btn" @click="downloadExcludedZip" :disabled="isDownloadingZip" style="margin-left: 8px;">
          <span class="ds-import-icon">
            <i class="fa-solid fa-file-zipper"></i>
          </span>
          <span class="ds-import-label">仕訳外DL ({{ excludedCount }})</span>
        </button>
        <button class="ds-import-btn" @click="handleReload" :disabled="isLoading" style="margin-left: 8px;">
          <span class="ds-import-icon" :class="{ 'ds-importing': isLoading }">
            <i class="fa-solid fa-arrows-rotate"></i>
          </span>
          <span class="ds-import-label">{{ isLoading ? '取得中...' : '再取得' }}</span>
        </button>
      </div>
    </div>

    <!-- メインエリア -->
    <div class="ds-main">
      <!-- 左: サムネ一覧 -->
      <div class="ds-sidebar">
        <!-- 全選択チェック -->
        <div class="ds-sidebar-header">
          <label class="ds-check-all">
            <input type="checkbox" :checked="checkedIds.size === documents.length && documents.length > 0" @change="toggleCheckAll" />
            全選択 ({{ checkedIds.size }}/{{ documents.length }})
          </label>
        </div>
        <div
          v-for="(doc, idx) in documents" :key="doc.id"
          class="ds-sidebar-item"
          :class="{ 'ds-sidebar-item-active': selectedIdx === idx }"
          @click="selectDoc(idx)"
        >
          <!-- チェックボックス -->
          <input type="checkbox" class="ds-checkbox" :checked="checkedIds.has(doc.id)" @click.stop="toggleCheck(doc.id)" />
          <!-- CSV/GIF等プレビュー不可: アイコン+ファイル名 -->
          <template v-if="isNonPreviewable(doc.fileName)">
            <div class="ds-thumb-placeholder">
              <i class="fa-solid fa-file ds-thumb-placeholder-icon"></i>
            </div>
          </template>
          <template v-else-if="doc.fileName?.toLowerCase().endsWith('.pdf')">
            <div class="ds-thumb-wrap">
              <iframe :src="doc.previewUrlFull" class="ds-thumb-pdf" tabindex="-1"></iframe>
            </div>
          </template>
          <img v-else :src="doc.previewUrlFull || doc.thumbnailBase64 || ''" :alt="doc.fileName" class="ds-thumb-img" />
          <div class="ds-sidebar-info">
            <div class="ds-sidebar-name">{{ doc.fileName }}</div>
            <div class="ds-sidebar-meta">{{ doc.fileSize }} · {{ doc.uploadDate }}</div>
            <span class="ds-source-badge" :class="sourceBadgeClass(doc.source)">{{ sourceLabel(doc.source) }}</span>
          </div>
          <span class="ds-badge" :class="statusBadgeClass(doc.status)">{{ statusLabel(doc.status) }}</span>
        </div>
      </div>

      <!-- 右: プレビュー -->
      <div class="ds-preview">
        <!-- データなし -->
        <template v-if="allDocsView.length === 0">
          <div class="ds-empty">
            <i class="fa-solid fa-inbox ds-empty-icon"></i>
            <div class="ds-empty-text">ファイルがありません</div>
            <div class="ds-empty-sub">Driveに新しい資料をアップロードしてください</div>
          </div>
        </template>
        <!-- フィルタ結果0件 -->
        <template v-else-if="documents.length === 0">
          <div class="ds-empty">
            <i class="fa-solid fa-filter ds-empty-icon"></i>
            <div class="ds-empty-text">該当ファイルなし</div>
            <div class="ds-empty-sub">フィルタを切り替えてください</div>
          </div>
        </template>

        <!-- ファイル選択中 → 常にプレビュー+操作ボタン表示（選別済みでも修正可能） -->
        <template v-else-if="selected">
          <!-- スケルトン -->
          <template v-if="isLoading">
            <div class="ds-skeleton">
              <svg class="ds-spinner" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <div class="ds-skeleton-text">読み込み中...</div>
            </div>
          </template>

          <!-- プレビュー本体 -->
          <template v-else>
            <div class="ds-preview-container">
              <!-- ズームコントロール + PDFページ送り（右上） -->
              <div class="ds-zoom-controls">
                <button class="ds-zoom-btn" @click="doZoomOut" title="縮小">
                  <i class="fa-solid fa-magnifying-glass-minus"></i>
                </button>
                <span class="ds-zoom-label">{{ Math.round(zoomScale * 100) }}%</span>
                <button class="ds-zoom-btn" @click="doZoomIn" title="拡大">
                  <i class="fa-solid fa-magnifying-glass-plus"></i>
                </button>
                <button class="ds-zoom-btn" @click="doZoomReset" title="リセット (50%)">
                  <i class="fa-solid fa-expand"></i>
                </button>
                <!-- PDFページ送り -->
                <template v-if="isPdf && pdfPageCount > 1">
                  <span class="ds-zoom-sep">|</span>
                  <button class="ds-zoom-btn" @click="pdfPrevPage" :disabled="pdfCurrentPage <= 1">
                    <i class="fa-solid fa-chevron-left"></i>
                  </button>
                  <span class="ds-zoom-label">{{ pdfCurrentPage }}/{{ pdfPageCount }}</span>
                  <button class="ds-zoom-btn" @click="pdfNextPage" :disabled="pdfCurrentPage >= pdfPageCount">
                    <i class="fa-solid fa-chevron-right"></i>
                  </button>
                </template>
              </div>

              <!-- スクロール可能なプレビューエリア -->
              <div class="ds-preview-scroll">
                <!-- PDF: Canvas描画 -->
                <template v-if="isPdf">
                  <canvas ref="pdfCanvasEl" class="ds-preview-canvas"></canvas>
                </template>
                <!-- 画像: wrapperでズーム制御、imgはobject-fit: containで枠内収まり -->
                <div v-else class="ds-preview-wrapper" :style="previewWrapperStyle">
                  <img
                    :src="previewUrl"
                    :alt="selected.fileName"
                    class="ds-preview-img"
                  />
                </div>
              </div>
            </div>

            <!-- ファイル情報 -->
            <div class="ds-file-info">
              <div class="ds-file-name">{{ selected.fileName }}</div>
              <div class="ds-file-meta">{{ selected.fileSize }} · {{ selected.fileType }} · 投入日: {{ selected.uploadDate }}</div>
              <div class="ds-file-count">{{ selectedIdx + 1 }} / {{ documents.length }}件</div>
            </div>

            <!-- 3アクションボタン（選択中=濃い、非選択=薄い） -->
            <div class="ds-actions">
              <button class="ds-action-btn ds-btn-target" :class="{ 'ds-btn-active': selected.status === 'target' }" @click="setStatus('target')">
                <i class="fa-solid fa-check"></i> 仕訳対象
              </button>
              <button class="ds-action-btn ds-btn-supporting" :class="{ 'ds-btn-active': selected.status === 'supporting' }" @click="setStatus('supporting')">
                <i class="fa-solid fa-file-lines"></i> 根拠資料
              </button>
              <button class="ds-action-btn ds-btn-excluded" :class="{ 'ds-btn-active': selected.status === 'excluded' }" @click="setStatus('excluded')">
                <i class="fa-solid fa-xmark"></i> 仕訳外
              </button>
            </div>
            <!-- キーボードショートカットガイド -->
            <div class="ds-shortcut-guide">
              <div class="ds-shortcut-row"><kbd>A</kbd>仕訳対象</div>
              <div class="ds-shortcut-row"><kbd>S</kbd>根拠資料</div>
              <div class="ds-shortcut-row"><kbd>D</kbd>仕訳外</div>
              <div class="ds-shortcut-row"><kbd>F</kbd>戻す</div>
              <div class="ds-shortcut-row"><kbd>W</kbd><kbd>Z</kbd>移動</div>
            </div>

            <div v-if="selected.status !== 'pending'" class="ds-current-status" :class="statusTextClass(selected.status)">
              現在: {{ statusLabel(selected.status) }}
            </div>


          </template>
        </template>
      </div>
    </div>

    <!-- 確定送信モーダル（人間が明示的に開く） -->
    <div v-if="showCompleteModal" class="ds-modal-overlay" @click.self="!isMigrating && (showCompleteModal = false)">
      <div class="ds-modal">
        <!-- 移行中: プログレスバー -->
        <template v-if="isMigrating">
          <div class="ds-modal-icon" style="color: #3b82f6;"><i class="fa-solid fa-spinner fa-spin"></i></div>
          <div class="ds-modal-title">移行中...</div>
          <div class="ds-modal-text">
            {{ migrationProgress.done + migrationProgress.failed }} / {{ migrationProgress.total }}件完了
          </div>
          <div style="margin: 12px 0; background: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
            <div style="height: 100%; border-radius: 4px; transition: width 0.5s;"
              :style="{
                width: migrationProgress.total > 0 ? ((migrationProgress.done + migrationProgress.failed) / migrationProgress.total * 100) + '%' : '0%',
                background: migrationProgress.failed > 0 ? '#f59e0b' : '#3b82f6',
              }"
            ></div>
          </div>
          <div v-if="migrationProgress.failed > 0" class="ds-modal-text" style="color: #dc2626;">
            ⚠ {{ migrationProgress.failed }}件失敗
          </div>
        </template>
        <!-- 移行完了 -->
        <template v-else-if="migrationDone">
          <div class="ds-modal-icon" style="color: #10b981;"><i class="fa-solid fa-circle-check"></i></div>
          <div class="ds-modal-title">移行完了</div>
          <div class="ds-modal-text">
            {{ migrationProgress.done }}件移行完了。
            <span v-if="migrationProgress.failed > 0" style="color: #dc2626;">
              {{ migrationProgress.failed }}件失敗。管理画面で確認してください。
            </span>
          </div>
          <div v-if="excludedInMigration > 0" class="ds-modal-text" style="margin-top: 8px; color: #6b7280;">
            仕訳外: {{ excludedInMigration }}件
          </div>
          <div class="ds-modal-actions">
            <button v-if="excludedInMigration > 0" class="ds-modal-btn ds-modal-btn-yes" @click="downloadExcludedZip" :disabled="isDownloadingZip" style="background: #6366f1;">
              <i class="fa-solid fa-file-zipper"></i> {{ isDownloadingZip ? 'DL中...' : '仕訳外ZIP DL' }}
            </button>
            <button class="ds-modal-btn ds-modal-btn-yes" @click="finishMigration"><i class="fa-solid fa-check"></i> 閉じる</button>
          </div>
        </template>
        <!-- 確定送信確認 -->
        <template v-else>
          <div class="ds-modal-icon"><i class="fa-solid fa-paper-plane"></i></div>
          <div class="ds-modal-title">確定送信</div>
          <div class="ds-modal-text">
            仕訳対象: {{ counts.target }}件 / 根拠資料: {{ counts.supporting }}件 / 仕訳外: {{ counts.excluded }}件
            <span v-if="counts.pending > 0" style="display: block; margin-top: 6px; color: #d97706; font-weight: 600;">
              ⚠ 未処理: {{ counts.pending }}件（送信されません）
            </span>
          </div>
          <div class="ds-modal-question">仕訳処理に送信しますか？</div>
          <div class="ds-modal-actions">
            <button class="ds-modal-btn ds-modal-btn-yes" @click="sendToProcess"><i class="fa-solid fa-paper-plane"></i> 送信</button>
            <button class="ds-modal-btn ds-modal-btn-no" @click="showCompleteModal = false">キャンセル</button>
          </div>
        </template>
      </div>
    </div>

    <!-- 一括操作モーダル -->
    <div v-if="showBulkModal" class="ds-modal-overlay" @click.self="showBulkModal = false">
      <div class="ds-modal">
        <div class="ds-modal-icon" style="color: #3b82f6;"><i class="fa-solid fa-layer-group"></i></div>
        <div class="ds-modal-title">一括操作（{{ checkedIds.size }}件）</div>
        <div class="ds-modal-text">選択した{{ checkedIds.size }}件のステータスを変更します</div>
        <div class="ds-bulk-actions" style="margin-top: 16px;">
          <button class="ds-bulk-btn ds-bulk-pending" @click="bulkSetStatus('pending')">
            <i class="fa-solid fa-rotate-left"></i> 選別前に戻す
          </button>
          <button class="ds-bulk-btn ds-bulk-target" @click="bulkSetStatus('target')">
            <i class="fa-solid fa-check"></i> 仕訳対象
          </button>
          <button class="ds-bulk-btn ds-bulk-supporting" @click="bulkSetStatus('supporting')">
            <i class="fa-solid fa-file-lines"></i> 根拠資料
          </button>
          <button class="ds-bulk-btn ds-bulk-excluded" @click="bulkSetStatus('excluded')">
            <i class="fa-solid fa-xmark"></i> 仕訳外
          </button>
        </div>
        <div class="ds-modal-actions" style="margin-top: 16px;">
          <button class="ds-modal-btn ds-modal-btn-no" @click="showBulkModal = false">キャンセル</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { usePdfRenderer } from '@/composables/usePdfRenderer';
import { useClients } from '@/features/client-management/composables/useClients';
import { useDocuments } from '@/composables/useDocuments';
import { useUnsavedGuard } from '@/mocks/composables/useUnsavedGuard';
import type { DocEntry, DocStatus, DocSource } from '@/repositories/types';
import type { DriveFileItemWithThumbnail } from '@/api/services/drive/driveService';

const route = useRoute();
const clientId = computed(() => (route.params.clientId as string) || '');
const { currentClient } = useClients();
const { updateStatus: updateDocStatus, addDocuments: addDocs, allDocuments } = useDocuments();

// --- ページ離脱ガード（選別中の離脱を警告） ---
const { markDirty, markClean } = useUnsavedGuard(null);

// --- ローディング（fetchDriveFilesより前に宣言） ---
const isLoading = ref(false);

// ===== Drive借景方式: Drive APIからファイル一覧を取得 =====

/** Driveから取得した生データ */
const driveFiles = ref<DriveFileItemWithThumbnail[]>([]);
/** 選別結果をローカルで保持（Driveには書き込まない） */
const driveSelections = ref<Map<string, DocStatus>>(new Map());

/** Driveファイル一覧取得（サムネイルbase64付き） → doc-storeにも登録して永続化 */
const fetchDriveFiles = async () => {
  const folderId = currentClient.value?.sharedFolderId;
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
      createdBy: null,
      updatedBy: null,
      updatedAt: null,
      statusChangedBy: null,
      statusChangedAt: null,
    }));
    if (driveDocEntries.length > 0) {
      addDocs(driveDocEntries);
    }

    console.log(`[MockDriveSelectPage] Driveファイル${data.files.length}件取得 → doc-storeに登録`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    alert(`Driveファイル取得エラー: ${msg}`);
  } finally {
    isLoading.value = false;
  }
};

// ===== doc-store方式: 独自アップロード済みファイルを取得 =====

/** doc-storeから取得した独自アップロードファイル */
const uploadedDocs = ref<DocEntry[]>([]);

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
    console.log(`[MockDriveSelectPage] doc-storeから${uploadedDocs.value.length}件取得（独自アップロード）`);
  } catch (err) {
    console.warn('[MockDriveSelectPage] doc-store取得失敗:', err);
  }
};

onMounted(async () => {
  await Promise.all([fetchDriveFiles(), fetchUploadedDocs()]);
  fetchExcludedCount();
});

// --- PDF.js ---
const {
  canvasRef: pdfCanvasEl, // eslint-disable-line @typescript-eslint/no-unused-vars -- template ref
  pageCount: pdfPageCount,
  currentPage: pdfCurrentPage,
  renderPage: pdfRenderPage,
  nextPage: pdfNextPage,
  prevPage: pdfPrevPage,
  destroy: pdfDestroy,
} = usePdfRenderer();

// --- ビュー型（Drive + 独自アップロード マージ） ---
interface DocView {
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
}

const formatFileSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? (bytes / (1024 * 1024)).toFixed(1) + 'MB'
    : Math.round(bytes / 1024) + 'KB';

const formatDate = (dateStr: string) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\//g, '/')
    : '';

const allDocsView = computed<DocView[]>(() => {
  // ① Drive借景ファイル
  const driveItems: DocView[] = driveFiles.value.map(f => ({
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
  }));

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
  }));

  // マージして日時降順ソート
  return [...driveItems, ...uploadItems]
    .sort((a, b) => b.uploadDateRaw - a.uploadDateRaw);
});

// --- フィルタ ---
const activeFilter = ref<DocStatus | 'all'>('all');
const toggleFilter = (filter: DocStatus | 'all') => {
  activeFilter.value = activeFilter.value === filter ? 'all' : filter;
  selectedIdx.value = 0;
};

const documents = computed<DocView[]>(() => {
  if (activeFilter.value === 'all') return allDocsView.value;
  return allDocsView.value.filter(d => d.status === activeFilter.value);
});

const selectedIdx = ref(0);
const selected = computed(() => documents.value[selectedIdx.value] ?? null);

// フィルタ中の選別操作でリストからファイルが消えた場合、selectedIdxをクランプ
watch(() => documents.value.length, (len) => {
  if (len === 0) { selectedIdx.value = 0; return; }
  if (selectedIdx.value >= len) selectedIdx.value = len - 1;
});

/** プレビューURL（ソースに応じて分岐） */
const previewUrl = computed(() => {
  if (!selected.value) return '';
  return selected.value.previewUrlFull;
});

/** PDFかどうか */
const isPdf = computed(() => {
  if (!selected.value) return false;
  return selected.value.mimeType === 'application/pdf' || selected.value.fileName.toLowerCase().endsWith('.pdf');
});

// --- 拡大縮小（デフォルト50% = 枠と同じサイズ） ---
const DEFAULT_ZOOM = 0.5;
const zoomScale = ref(DEFAULT_ZOOM);
const doZoomIn = () => { zoomScale.value = Math.min(zoomScale.value + 0.25, 5); renderIfPdf(); };
const doZoomOut = () => { zoomScale.value = Math.max(zoomScale.value - 0.25, 0.25); renderIfPdf(); };
const doZoomReset = () => { zoomScale.value = DEFAULT_ZOOM; renderIfPdf(); };

/** プレビュー画像wrapperのスタイル（ズーム制御）
 * - 0.25 → 50% x 50%（縮小）
 * - 0.50 → 100% x 100%（デフォルト=枠全体にcontain）
 * - 1.00 → 200% x 200%（拡大、スクロール）
 */
const previewWrapperStyle = computed(() => {
  const pct = zoomScale.value * 200; // 0.5 → 100%
  return {
    width: pct + '%',
    height: pct + '%',
  };
});

/** PDFの場合、scaleを変更したらCanvas再描画 */
const renderIfPdf = () => {
  if (isPdf.value && selected.value) {
    nextTick(() => pdfRenderPage(previewUrl.value, zoomScale.value * 2));
  }
};

// --- ローディング（プレビュー切り替え時のSupabaseレイテンシシミュレーション） ---
const simulateLoad = async () => {
  isLoading.value = true;
  await new Promise(r => setTimeout(r, 400));
  isLoading.value = false;

  // PDF描画
  if (isPdf.value && selected.value) {
    await nextTick();
    pdfRenderPage(previewUrl.value, zoomScale.value * 2);
  }
};

watch(selectedIdx, () => {
  zoomScale.value = DEFAULT_ZOOM;
  pdfDestroy();
  simulateLoad();
});
onMounted(() => { simulateLoad(); });

// PDFページ変更時に再描画
watch(pdfCurrentPage, () => {
  if (isPdf.value && selected.value) {
    pdfRenderPage(previewUrl.value, zoomScale.value * 2);
  }
});

const selectDoc = (idx: number) => { selectedIdx.value = idx; };

// --- 件数集計（全件から算出。フィルタの影響を受けない） ---
const counts = computed(() => {
  const docs = allDocsView.value;
  return {
    pending:    docs.filter(d => d.status === 'pending').length,
    target:     docs.filter(d => d.status === 'target').length,
    supporting: docs.filter(d => d.status === 'supporting').length,
    excluded:   docs.filter(d => d.status === 'excluded').length,
  };
});

// --- 複数選択（チェックボックス） ---
const checkedIds = ref<Set<string>>(new Set());
const toggleCheck = (id: string) => {
  const next = new Set(checkedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  checkedIds.value = next;
};
const toggleCheckAll = () => {
  if (checkedIds.value.size === documents.value.length) {
    checkedIds.value = new Set();
  } else {
    checkedIds.value = new Set(documents.value.map(d => d.id));
  }
};

// --- Undo/Redo（配列ベース: 一括操作をまとめてUndo可能） ---
interface HistoryEntry { docId: string; from: DocStatus; to: DocStatus; }
type HistoryGroup = HistoryEntry[];
const undoStack = ref<HistoryGroup[]>([]);
const redoStack = ref<HistoryGroup[]>([]);
const canUndo = computed(() => undoStack.value.length > 0);
const canRedo = computed(() => redoStack.value.length > 0);

const pushHistoryGroup = (entries: HistoryEntry[]) => {
  if (entries.length === 0) return;
  undoStack.value.push(entries);
  redoStack.value = [];
};
const undo = () => {
  const group = undoStack.value.pop();
  if (!group) return;
  for (const entry of group) {
    driveSelections.value.set(entry.docId, entry.from);
    const doc = uploadedDocs.value.find(d => d.id === entry.docId);
    if (doc) doc.status = entry.from;
    updateDocStatus(entry.docId, entry.from);
  }
  redoStack.value.push(group);
  showCompleteModal.value = false;
};
const redo = () => {
  const group = redoStack.value.pop();
  if (!group) return;
  for (const entry of group) {
    driveSelections.value.set(entry.docId, entry.to);
    const doc = uploadedDocs.value.find(d => d.id === entry.docId);
    if (doc) doc.status = entry.to;
    updateDocStatus(entry.docId, entry.to);
  }
  undoStack.value.push(group);
};

// --- モーダル ---
const showCompleteModal = ref(false);
const showBulkModal = ref(false);

// --- ステータス設定（全ソース共通: useDocuments経由でallDocuments ref + サーバー両方を更新） ---
const applyStatus = (docId: string, source: string, status: DocStatus) => {
  if (source === 'drive') {
    driveSelections.value.set(docId, status);
  } else {
    const doc = uploadedDocs.value.find(d => d.id === docId);
    if (doc) doc.status = status;
  }
  updateDocStatus(docId, status);
};

const setStatus = (status: DocStatus) => {
  if (!selected.value) return;
  const currentStatus = selected.value.status as DocStatus;
  if (currentStatus === status) return;

  pushHistoryGroup([{ docId: selected.value.id, from: currentStatus, to: status }]);
  applyStatus(selected.value.id, selected.value.source, status);
  markDirty(`${selected.value.fileName}: ${statusLabel(status)}`);

  // 次のpendingに自動移動
  const nextPendingIdx = documents.value.findIndex((d, i) => i > selectedIdx.value && d.status === 'pending');
  if (nextPendingIdx !== -1) {
    selectedIdx.value = nextPendingIdx;
  } else {
    const prevPendingIdx = documents.value.findIndex(d => d.status === 'pending');
    if (prevPendingIdx !== -1) selectedIdx.value = prevPendingIdx;
  }
};

const resetStatus = () => {
  if (!selected.value || selected.value.status === 'pending') return;
  pushHistoryGroup([{ docId: selected.value.id, from: selected.value.status as DocStatus, to: 'pending' }]);
  applyStatus(selected.value.id, selected.value.source, 'pending');
  markDirty(`${selected.value.fileName}: 未処理に戻す`);
};

// --- 一括操作 ---
const bulkSetStatus = (status: DocStatus) => {
  const entries: HistoryEntry[] = [];
  for (const id of checkedIds.value) {
    const doc = documents.value.find(d => d.id === id);
    if (!doc || (doc.status as DocStatus) === status) continue;
    entries.push({ docId: doc.id, from: doc.status as DocStatus, to: status });
    applyStatus(doc.id, doc.source, status);
  }
  if (entries.length > 0) {
    pushHistoryGroup(entries);
    markDirty(`${entries.length}件を一括「${statusLabel(status)}」に変更`);
  }
  checkedIds.value = new Set();
  showBulkModal.value = false;
};

// --- 移行進捗状態 ---
const isMigrating = ref(false);
const migrationDone = ref(false);
const migrationProgress = ref({ total: 0, queued: 0, processing: 0, done: 0, failed: 0 });

// --- 仕訳処理に送る（Phase D: POST /api/drive/migrate + ポーリング） ---
const sendToProcess = async () => {
  const filesToMigrate = documents.value
    .filter(d => d.status !== 'pending')
    .map(d => ({ fileId: d.id, status: d.status }));

  if (filesToMigrate.length === 0) {
    showCompleteModal.value = false;
    return;
  }

  isMigrating.value = true;
  migrationDone.value = false;

  try {
    const res = await fetch('/api/drive/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: clientId.value,
        files: filesToMigrate,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    const result = await res.json() as { jobId: string; queued: number };
    console.log(`[MockDriveSelectPage] 移行ジョブ登録: jobId=${result.jobId}, queued=${result.queued}`);

    migrationProgress.value = { total: result.queued, queued: result.queued, processing: 0, done: 0, failed: 0 };

    // ポーリング（3秒間隔）
    const pollInterval = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/drive/migrate/status/${result.jobId}`);
        if (!statusRes.ok) return;
        const status = await statusRes.json() as { total: number; queued: number; processing: number; done: number; failed: number };
        migrationProgress.value = status;

        // 全件完了（queued + processing === 0）
        if (status.queued === 0 && status.processing === 0) {
          clearInterval(pollInterval);
          isMigrating.value = false;
          migrationDone.value = true;
          console.log(`[MockDriveSelectPage] 移行完了: done=${status.done}, failed=${status.failed}`);
        }
      } catch {
        // ポーリングエラーは無視（次回リトライ）
      }
    }, 3000);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    alert(`移行エラー: ${msg}`);
    isMigrating.value = false;
  }
};

// --- 移行完了後のリセット ---
const finishMigration = async () => {
  showCompleteModal.value = false;
  migrationDone.value = false;
  await fetchDriveFiles();
  await fetchExcludedCount();
  selectedIdx.value = 0;
  undoStack.value = [];
  redoStack.value = [];
  markClean();
};

// --- 仕訳外ZIP DL（Phase E-5/E-6） ---
const excludedCount = ref(0);
const isDownloadingZip = ref(false);
const excludedInMigration = computed(() => counts.value.excluded);

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

const downloadExcludedZip = async () => {
  isDownloadingZip.value = true;
  try {
    const res = await fetch(`/api/drive/download-excluded/${clientId.value}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'excluded.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    // DL後にカウント更新
    await fetchExcludedCount();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    alert(`ZIP DLエラー: ${msg}`);
  } finally {
    isDownloadingZip.value = false;
  }
};

// --- リロード（Drive + doc-store両方を再取得） ---
const handleReload = async () => {
  await Promise.all([fetchDriveFiles(), fetchUploadedDocs()]);
};

// --- ステータス表示 ---
const statusLabel = (s: string) => {
  if (s === 'target') return '仕訳対象';
  if (s === 'supporting') return '根拠資料';
  if (s === 'excluded') return '仕訳外';
  return '未処理';
};
const statusBadgeClass = (s: string) => {
  if (s === 'target') return 'ds-badge-target';
  if (s === 'supporting') return 'ds-badge-supporting';
  if (s === 'excluded') return 'ds-badge-excluded';
  return 'ds-badge-pending';
};
const statusTextClass = (s: string) => {
  if (s === 'target') return 'ds-text-target';
  if (s === 'supporting') return 'ds-text-supporting';
  if (s === 'excluded') return 'ds-text-excluded';
  return '';
};

// --- ソースバッジ ---
const sourceLabel = (s: string) => {
  if (s === 'drive') return '📁 Drive';
  if (s === 'staff-upload') return '💻 スタッフ';
  if (s === 'guest-upload') return '👤 ゲスト';
  return '📎 その他';
};
const sourceBadgeClass = (s: string) => {
  if (s === 'drive') return 'ds-source-drive';
  if (s === 'staff-upload') return 'ds-source-staff';
  if (s === 'guest-upload') return 'ds-source-guest';
  return '';
};

// --- プレビュー不可ファイル判定 ---
const PREVIEWABLE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.svg', '.pdf'];
const isNonPreviewable = (fileName?: string): boolean => {
  if (!fileName) return true;
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  return !PREVIEWABLE_EXTS.includes(ext);
};

// --- キーボードショートカット ---
const handleKey = (e: KeyboardEvent) => {
  if (showCompleteModal.value || showBulkModal.value) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { undo(); e.preventDefault(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') { redo(); e.preventDefault(); return; }
  if (e.key === 'a' || e.key === 'A') { setStatus('target'); e.preventDefault(); }
  if (e.key === 's' || e.key === 'S') { setStatus('supporting'); e.preventDefault(); }
  if (e.key === 'd' || e.key === 'D') { setStatus('excluded'); e.preventDefault(); }
  if (e.key === 'f' || e.key === 'F') { resetStatus(); e.preventDefault(); }
  if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp')   { selectedIdx.value = Math.max(0, selectedIdx.value - 1); e.preventDefault(); }
  if (e.key === 'z' || e.key === 'Z' || e.key === 'ArrowDown') { selectedIdx.value = Math.min(documents.value.length - 1, selectedIdx.value + 1); e.preventDefault(); }
};
onMounted(() => window.addEventListener('keydown', handleKey));
onUnmounted(() => window.removeEventListener('keydown', handleKey));
</script>

<style scoped>
.ds-root {
  height: 100%; display: flex; flex-direction: column;
  background: #f8fafc; font-family: 'Noto Sans JP', sans-serif; color: #374151;
}

/* ========== ヘッダー ========== */
.ds-header {
  background: white; padding: 8px 16px; border-bottom: 1px solid #d1d5db;
  display: flex; align-items: center; justify-content: space-between;
}
.ds-header-left { display: flex; align-items: center; gap: 12px; }
.ds-header-center { display: flex; align-items: center; gap: 8px; }
.ds-header-right { display: flex; align-items: center; }
.ds-title { font-size: 14px; font-weight: 700; color: #1f2937; }
.ds-counts { display: flex; gap: 6px; align-items: center; }
.ds-count {
  font-size: 12px; padding: 3px 10px; border-radius: 12px; font-weight: 600;
  border: 2px solid transparent; cursor: pointer; transition: all 0.15s;
}
.ds-count:hover { transform: translateY(-1px); }
.ds-count-all { background: #e0e7ff; color: #3730a3; }
.ds-count-pending { background: #f3f4f6; color: #6b7280; }
.ds-count-target { background: #dbeafe; color: #1d4ed8; }
.ds-count-supporting { background: #fef3c7; color: #92400e; }
.ds-count-excluded { background: #fee2e2; color: #dc2626; }
/* アクティブフィルタ */
.ds-count-active { border-color: currentColor; box-shadow: 0 0 0 2px rgba(0,0,0,0.08); transform: translateY(-1px); }

/* 元に戻す／やり直し（取り込みと同サイズ） */
.ds-undo-btn, .ds-redo-btn {
  padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 700;
  background: #475569; color: white; border: none; cursor: pointer;
  display: flex; align-items: center; gap: 8px;
  transition: all 0.2s; box-shadow: 0 4px 14px rgba(71, 85, 105, 0.3);
}
.ds-undo-btn:hover, .ds-redo-btn:hover { background: #334155; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(71, 85, 105, 0.4); }
.ds-undo-btn:active, .ds-redo-btn:active { transform: translateY(0); }
.ds-undo-btn:disabled, .ds-redo-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; box-shadow: none; }

.ds-import-btn {
  padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 700;
  background: linear-gradient(135deg, #059669, #10b981); color: white;
  border: none; cursor: pointer; display: flex; align-items: center; gap: 10px;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35);
  transition: all 0.2s ease; position: relative; overflow: hidden;
}
.ds-import-btn::before {
  content: ''; position: absolute; top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
  transform: rotate(45deg); transition: left 0.5s;
}
.ds-import-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(5, 150, 105, 0.45); }
.ds-import-btn:hover::before { left: 100%; }
.ds-import-btn:active { transform: translateY(0); }
.ds-import-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.ds-import-icon { font-size: 18px; display: flex; }
.ds-import-icon.ds-importing { animation: pulse-icon 1s ease-in-out infinite; }
@keyframes pulse-icon { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.ds-import-label { letter-spacing: 0.5px; }

/* 確定送信ボタン */
.ds-submit-btn {
  padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 700;
  background: linear-gradient(135deg, #2563eb, #3b82f6); color: white;
  border: none; cursor: pointer; display: flex; align-items: center; gap: 8px;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
  transition: all 0.2s ease;
}
.ds-submit-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45); }
.ds-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

/* 一括操作ヘッダーボタン */
.ds-bulk-open-btn {
  padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 700;
  background: #6366f1; color: white; border: none; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  transition: all 0.15s;
  animation: pulse-bulk 1.5s ease-in-out infinite;
}
.ds-bulk-open-btn:hover { background: #4f46e5; transform: translateY(-1px); }
@keyframes pulse-bulk { 0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); } 50% { box-shadow: 0 0 0 6px rgba(99,102,241,0); } }

/* サムネプレースホルダー（CSV/GIF等） */
.ds-thumb-placeholder {
  width: 60px; height: 48px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: #f3f4f6; border-radius: 6px; border: 1px solid #e5e7eb;
}
.ds-thumb-placeholder-icon { font-size: 20px; color: #9ca3af; }

/* ========== メイン ========== */
.ds-main { flex: 1; display: flex; overflow: hidden; }

/* ========== サイドバー ========== */
.ds-sidebar {
  width: 280px; border-right: 1px solid #d1d5db; background: white;
  overflow-y: auto; flex-shrink: 0;
}
.ds-sidebar::-webkit-scrollbar { width: 6px; }
.ds-sidebar::-webkit-scrollbar-track { background: #f1f5f9; }
.ds-sidebar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 3px; }
.ds-sidebar::-webkit-scrollbar-thumb:hover { background: #64748b; }
.ds-sidebar-item {
  display: flex; align-items: center; gap: 8px; padding: 8px;
  cursor: pointer; border-bottom: 1px solid #f1f5f9;
  border-left: 4px solid transparent; transition: all 0.15s;
}
.ds-sidebar-item:hover { background: #f8fafc; }
.ds-sidebar-item-active { background: #eff6ff; border-left-color: #3b82f6; }
.ds-thumb-wrap { width: 50px; height: 50px; border-radius: 4px; flex-shrink: 0; background: #f1f5f9; overflow: hidden; }
.ds-thumb-pdf { width: 100px; height: 100px; transform-origin: top left; transform: scale(0.5); pointer-events: none; border: 0; }
.ds-thumb-img { width: 50px; height: 50px; border-radius: 4px; object-fit: cover; flex-shrink: 0; background: #e5e7eb; }
.ds-sidebar-info { flex: 1; min-width: 0; }
.ds-sidebar-name { font-size: 11px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ds-sidebar-meta { font-size: 10px; color: #9ca3af; }
.ds-badge { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; flex-shrink: 0; }
.ds-badge-pending { background: #f3f4f6; color: #9ca3af; }
.ds-badge-target { background: #dbeafe; color: #1d4ed8; }
.ds-badge-supporting { background: #fef3c7; color: #92400e; }
.ds-badge-excluded { background: #fee2e2; color: #dc2626; }

/* ソースバッジ（Drive / スタッフ / ゲスト） */
.ds-source-badge { font-size: 9px; font-weight: 600; padding: 1px 5px; border-radius: 3px; margin-top: 2px; display: inline-block; }
.ds-source-drive { background: #fef3c7; color: #92400e; }
.ds-source-staff { background: #dbeafe; color: #1d4ed8; }
.ds-source-guest { background: #dcfce7; color: #166534; }

/* ========== プレビュー ========== */
.ds-preview {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: flex-start; background: #f1f5f9; padding: 16px;
  overflow: auto;
}

.ds-empty { text-align: center; margin-top: 120px; }
.ds-empty-icon { font-size: 64px; color: #94a3b8; margin-bottom: 16px; display: block; }
.ds-empty-icon-done { color: #10b981; }
.ds-empty-text { font-size: 16px; font-weight: 600; color: #6b7280; }
.ds-empty-sub { font-size: 13px; color: #9ca3af; margin-top: 8px; }

.ds-skeleton {
  width: 480px; height: 360px; border-radius: 12px; background: #e5e7eb;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  margin-top: 60px;
}
.ds-spinner { width: 48px; height: 48px; color: #9ca3af; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.ds-skeleton-text { font-size: 12px; color: #9ca3af; margin-top: 12px; }

/* プレビューコンテナ */
.ds-preview-container {
  position: relative;
  width: 100%; max-width: 720px;
  height: calc(100vh - 200px);
  min-height: 300px;
  border-radius: 12px; overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  background: white; border: 1px solid #e5e7eb;
}

/* プレビューエリア: containerの高さ全体を使う */
.ds-preview-scroll {
  overflow: auto;
  width: 100%;
  height: 100%;
  background: #fff;
}
.ds-preview-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.ds-preview-scroll::-webkit-scrollbar-track { background: #f1f5f9; }
.ds-preview-scroll::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 3px; }

/* ズーム用wrapper: デフォルトで親と同じサイズ、拡大時ははみ出しスクロール */
.ds-preview-wrapper {
  margin: 0 auto;
}

/* 画像: wrapperに対して幅高さ100%で埋め、object-fit: containで全体表示 */
.ds-preview-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-orientation: from-image;
}

/* PDF Canvas */
.ds-preview-canvas {
  display: block; max-width: 100%; margin: 0 auto;
}

/* ズームコントロール */
.ds-zoom-controls {
  position: absolute; top: 8px; right: 8px; z-index: 10;
  display: flex; align-items: center; gap: 4px;
  background: rgba(0,0,0,0.6); border-radius: 8px; padding: 4px 8px;
}
.ds-zoom-btn {
  width: 28px; height: 28px; border-radius: 6px;
  background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
  color: white; cursor: pointer; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.ds-zoom-btn:hover { background: rgba(255,255,255,0.3); }
.ds-zoom-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.ds-zoom-label { color: white; font-size: 11px; font-weight: 600; min-width: 36px; text-align: center; }
.ds-zoom-sep { color: rgba(255,255,255,0.3); margin: 0 2px; }

/* キーボードショートカット */
/* キーボードショートカットガイド（ボタン下） */
.ds-shortcut-guide {
  display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
  margin-top: 8px; padding: 6px 12px;
  background: #f1f5f9; border-radius: 6px;
  font-size: 11px; color: #64748b;
}
.ds-shortcut-row {
  display: flex; align-items: center; gap: 3px;
}
.ds-shortcut-guide kbd {
  background: #e2e8f0; border: 1px solid #cbd5e1;
  border-radius: 3px; padding: 0 5px; font-size: 10px; font-weight: 700;
  font-family: inherit; color: #475569;
}

/* ファイル情報 */
.ds-file-info { margin-top: 10px; text-align: center; }
.ds-file-name { font-size: 14px; font-weight: 700; color: #1f2937; }
.ds-file-meta { font-size: 12px; color: #6b7280; margin-top: 2px; }
.ds-file-count { font-size: 11px; color: #9ca3af; margin-top: 2px; }

/* ========== アクション（非アクティブ=アウトライン、アクティブ=塗り+バー+glow） ========== */
.ds-actions { margin-top: 12px; display: flex; gap: 12px; align-items: center; justify-content: center; }
.ds-action-btn {
  padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 700;
  cursor: pointer; position: relative;
  transition: all 0.2s ease; display: flex; align-items: center; gap: 6px;
}
.ds-action-btn:hover { transform: translateY(-2px); }
.ds-action-btn:active { transform: scale(0.97); }

/* 非アクティブ: 白背景 + 薄ボーダー + 薄文字（ゴースト感） */
.ds-btn-target { background: white; border: 2px solid #bfdbfe; color: #93c5fd; box-shadow: none; }
.ds-btn-target:hover { background: #eff6ff; border-color: #93c5fd; color: #60a5fa; }
.ds-btn-supporting { background: white; border: 2px solid #fde68a; color: #fbbf24; box-shadow: none; }
.ds-btn-supporting:hover { background: #fffbeb; border-color: #fbbf24; color: #f59e0b; }
.ds-btn-excluded { background: white; border: 2px solid #fecaca; color: #fca5a5; box-shadow: none; }
.ds-btn-excluded:hover { background: #fef2f2; border-color: #fca5a5; color: #f87171; }

/* アクティブ: 濃い背景 + 白文字 + 下部バー + glow */
.ds-btn-target.ds-btn-active {
  background: #1e40af; color: white; border-color: #1e40af;
  box-shadow: 0 4px 16px rgba(30,64,175,0.4);
  animation: glow-blue 2s ease-in-out infinite;
}
.ds-btn-supporting.ds-btn-active {
  background: #92400e; color: white; border-color: #92400e;
  box-shadow: 0 4px 16px rgba(146,64,14,0.4);
  animation: glow-amber 2s ease-in-out infinite;
}
.ds-btn-excluded.ds-btn-active {
  background: #991b1b; color: white; border-color: #991b1b;
  box-shadow: 0 4px 16px rgba(153,27,27,0.4);
  animation: glow-red 2s ease-in-out infinite;
}

/* 下部インジケーターバー（アクティブ時のみ） */
.ds-btn-active::after {
  content: ''; position: absolute; bottom: -6px; left: 20%; right: 20%;
  height: 4px; border-radius: 2px;
}
.ds-btn-target.ds-btn-active::after { background: #3b82f6; }
.ds-btn-supporting.ds-btn-active::after { background: #f59e0b; }
.ds-btn-excluded.ds-btn-active::after { background: #ef4444; }

/* pulse glow アニメーション */
@keyframes glow-blue {
  0%, 100% { box-shadow: 0 4px 16px rgba(30,64,175,0.4); }
  50% { box-shadow: 0 4px 24px rgba(59,130,246,0.6); }
}
@keyframes glow-amber {
  0%, 100% { box-shadow: 0 4px 16px rgba(146,64,14,0.4); }
  50% { box-shadow: 0 4px 24px rgba(245,158,11,0.6); }
}
@keyframes glow-red {
  0%, 100% { box-shadow: 0 4px 16px rgba(153,27,27,0.4); }
  50% { box-shadow: 0 4px 24px rgba(239,68,68,0.6); }
}

.ds-current-status { margin-top: 6px; font-size: 12px; font-weight: 600; }
.ds-text-target { color: #2563eb; }
.ds-text-supporting { color: #d97706; }
.ds-text-excluded { color: #dc2626; }

/* ========== チェックボックス ========== */
.ds-sidebar-header {
  padding: 8px 10px; border-bottom: 1px solid #e5e7eb;
  background: #f9fafb; position: sticky; top: 0; z-index: 1;
}
.ds-check-all {
  font-size: 12px; font-weight: 600; color: #4b5563;
  display: flex; align-items: center; gap: 6px; cursor: pointer;
}
.ds-check-all input { width: 16px; height: 16px; cursor: pointer; accent-color: #2563eb; }
.ds-checkbox {
  width: 16px; height: 16px; flex-shrink: 0; cursor: pointer; accent-color: #2563eb;
  margin-right: 4px;
}


/* ========== 一括操作ボタン（モーダル内） ========== */
.ds-bulk-actions {
  display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;
}
.ds-bulk-btn {
  padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 700;
  border: none; cursor: pointer; display: flex; align-items: center; gap: 4px;
  transition: all 0.15s;
}
.ds-bulk-btn:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,0.12); }
.ds-bulk-pending { background: #6b7280; color: white; }
.ds-bulk-pending:hover { background: #4b5563; }
.ds-bulk-target { background: #2563eb; color: white; }
.ds-bulk-target:hover { background: #1d4ed8; }
.ds-bulk-supporting { background: #d97706; color: white; }
.ds-bulk-supporting:hover { background: #b45309; }
.ds-bulk-excluded { background: #dc2626; color: white; }
.ds-bulk-excluded:hover { background: #b91c1c; }

/* ========== モーダル ========== */
.ds-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 9999;
}
.ds-modal {
  background: white; border-radius: 16px; padding: 32px; max-width: 420px; width: 90%;
  text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: modal-in 0.25s ease;
}
@keyframes modal-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
.ds-modal-icon { font-size: 56px; color: #10b981; margin-bottom: 16px; }
.ds-modal-title { font-size: 20px; font-weight: 700; color: #1f2937; margin-bottom: 8px; }
.ds-modal-text { font-size: 13px; color: #6b7280; line-height: 1.6; }
.ds-modal-question { font-size: 15px; font-weight: 600; color: #1f2937; margin-top: 20px; }
.ds-modal-actions { margin-top: 20px; display: flex; gap: 12px; justify-content: center; }
.ds-modal-btn {
  padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;
  border: none; cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; gap: 6px;
}
.ds-modal-btn-yes { background: #2563eb; color: white; }
.ds-modal-btn-yes:hover { background: #1d4ed8; }
.ds-modal-btn-no { background: #f3f4f6; color: #6b7280; }
.ds-modal-btn-no:hover { background: #e5e7eb; }
</style>
