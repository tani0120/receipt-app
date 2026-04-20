<template>
  <div class="ds-root">
    <!-- ヘッダー -->
    <div class="ds-header">
      <!-- 左: タイトル＋カウント -->
      <div class="ds-header-left">
        <span class="ds-title">資料選別</span>
        <div class="ds-counts">
          <span class="ds-count ds-count-pending">未処理: {{ counts.pending }}件</span>
          <span class="ds-count ds-count-target">仕訳対象: {{ counts.target }}件</span>
          <span class="ds-count ds-count-supporting">根拠資料: {{ counts.supporting }}件</span>
          <span class="ds-count ds-count-excluded">仕訳外: {{ counts.excluded }}件</span>
        </div>
      </div>
      <!-- 中央: 元に戻す／やり直し -->
      <div class="ds-header-center">
        <button class="ds-undo-btn" :disabled="!canUndo" @click="undo" title="元に戻す (Ctrl+Z)">
          <i class="fa-solid fa-rotate-left"></i> 元に戻す
        </button>
        <button class="ds-redo-btn" :disabled="!canRedo" @click="redo" title="やり直し (Ctrl+Y)">
          <i class="fa-solid fa-rotate-right"></i> やり直し
        </button>
      </div>
      <!-- 右: 取り込みボタン -->
      <div class="ds-header-right">
        <button class="ds-import-btn" @click="handleImport" :disabled="isImporting">
          <span class="ds-import-icon" :class="{ 'ds-importing': isImporting }">
            <i class="fa-solid fa-cloud-arrow-down"></i>
          </span>
          <span class="ds-import-label">{{ isImporting ? '取り込み中...' : '取り込み' }}</span>
        </button>
      </div>
    </div>

    <!-- メインエリア -->
    <div class="ds-main">
      <!-- 左: サムネ一覧 -->
      <div class="ds-sidebar">
        <div
          v-for="(doc, idx) in documents" :key="doc.id"
          class="ds-sidebar-item"
          :class="{ 'ds-sidebar-item-active': selectedIdx === idx }"
          @click="selectDoc(idx)"
        >
          <template v-if="doc.fileName?.toLowerCase().endsWith('.pdf')">
            <div class="ds-thumb-wrap">
              <iframe :src="doc.imagePath" class="ds-thumb-pdf" tabindex="-1"></iframe>
            </div>
          </template>
          <img v-else :src="doc.imagePath" :alt="doc.fileName" class="ds-thumb-img" />
          <div class="ds-sidebar-info">
            <div class="ds-sidebar-name">{{ doc.fileName }}</div>
            <div class="ds-sidebar-meta">{{ doc.fileSize }} · {{ doc.uploadDate }}</div>
          </div>
          <span class="ds-badge" :class="statusBadgeClass(doc.status)">{{ statusLabel(doc.status) }}</span>
        </div>
      </div>

      <!-- 右: プレビュー -->
      <div class="ds-preview">
        <!-- 未選別0件・全データなし -->
        <template v-if="counts.pending === 0 && documents.length === 0">
          <div class="ds-empty">
            <i class="fa-solid fa-inbox ds-empty-icon"></i>
            <div class="ds-empty-text">未選別のファイルはありません</div>
            <div class="ds-empty-sub">「取り込み」ボタンで新しい資料を取得してください</div>
          </div>
        </template>

        <template v-else-if="counts.pending === 0 && !showCompleteModal">
          <div class="ds-empty">
            <i class="fa-solid fa-check-circle ds-empty-icon ds-empty-icon-done"></i>
            <div class="ds-empty-text">未選別のファイルはありません</div>
          </div>
        </template>

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
                  <canvas ref="pdfCanvasRef" class="ds-preview-canvas"></canvas>
                </template>
                <!-- 画像: width%ベースで中央配置 -->
                <img v-else
                  :src="selected.imagePath"
                  :alt="selected.fileName"
                  class="ds-preview-img"
                  :style="{ width: (zoomScale * 100) + '%' }"
                />
              </div>

              <!-- キーボードショートカット オーバーレイ -->
              <div class="ds-shortcut-overlay">
                <kbd>A</kbd> <span>仕訳対象</span>
                <kbd>S</kbd> <span>根拠資料</span>
                <kbd>D</kbd> <span>仕訳外</span>
                <kbd>F</kbd> <span>戻す</span>
                <span class="ds-shortcut-sep">|</span>
                <span>移動</span> <kbd>W</kbd><kbd>Z</kbd>
              </div>
            </div>

            <!-- ファイル情報 -->
            <div class="ds-file-info">
              <div class="ds-file-name">{{ selected.fileName }}</div>
              <div class="ds-file-meta">{{ selected.fileSize }} · {{ selected.fileType }} · 投入日: {{ selected.uploadDate }}</div>
              <div class="ds-file-count">{{ selectedIdx + 1 }} / {{ documents.length }}件</div>
            </div>

            <!-- 3アクションボタン -->
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

            <div v-if="selected.status !== 'pending'" class="ds-current-status" :class="statusTextClass(selected.status)">
              現在: {{ statusLabel(selected.status) }}
            </div>
          </template>
        </template>
      </div>
    </div>

    <!-- 全選別完了モーダル -->
    <div v-if="showCompleteModal" class="ds-modal-overlay" @click.self="showCompleteModal = false">
      <div class="ds-modal">
        <div class="ds-modal-icon"><i class="fa-solid fa-circle-check"></i></div>
        <div class="ds-modal-title">選別完了</div>
        <div class="ds-modal-text">
          全{{ documents.length }}件の選別が完了しました。<br>
          仕訳対象: {{ counts.target }}件 / 根拠資料: {{ counts.supporting }}件 / 仕訳外: {{ counts.excluded }}件
        </div>
        <div class="ds-modal-question">次の仕訳処理に送りますか？</div>
        <div class="ds-modal-actions">
          <button class="ds-modal-btn ds-modal-btn-yes" @click="sendToProcess"><i class="fa-solid fa-paper-plane"></i> はい</button>
          <button class="ds-modal-btn ds-modal-btn-no" @click="showCompleteModal = false">いいえ</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useDocuments } from '@/composables/useDocuments';
import { usePdfRenderer } from '@/composables/usePdfRenderer';
import { useClients } from '@/features/client-management/composables/useClients';
import { useCurrentUser } from '@/mocks/composables/useCurrentUser';
import type { DocStatus } from '@/repositories/types';

// ページ表示時にサーバーから最新データを取得
const { refresh: refreshDocs } = useDocuments();
onMounted(async () => { await refreshDocs(); });

const route = useRoute();
const clientId = computed(() => (route.params.clientId as string) || '');
const { getByClientId, updateStatus: updateDocStatus, removeByClientId, assignBatchAndJournalIds } = useDocuments();
const { currentClient } = useClients();
const { currentStaffId } = useCurrentUser();
// リアクティブ: clientIdが変わったら自動的に再フィルタ
const clientDocs = computed(() => getByClientId(clientId.value).value);

// --- PDF.js ---
const {
  // canvasRef: テンプレートではimg表示のため未使用
  pageCount: pdfPageCount,
  currentPage: pdfCurrentPage,
  renderPage: pdfRenderPage,
  nextPage: pdfNextPage,
  prevPage: pdfPrevPage,
  destroy: pdfDestroy,
} = usePdfRenderer();

// --- ビュー型 ---
const documents = computed(() =>
  clientDocs.value.map(doc => ({
    id: doc.id,
    fileName: doc.fileName,
    fileType: doc.fileType.split('/').pop()?.toUpperCase() || doc.fileType,
    fileSize: doc.fileSize >= 1024 * 1024
      ? (doc.fileSize / (1024 * 1024)).toFixed(1) + 'MB'
      : Math.round(doc.fileSize / 1024) + 'KB',
    uploadDate: new Date(doc.receivedAt).toLocaleDateString('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\//g, '/'),
    imagePath: doc.previewUrl || doc.thumbnailUrl || '',
    status: doc.status,
    mimeType: doc.fileType,
  }))
);

const selectedIdx = ref(0);
const selected = computed(() => documents.value[selectedIdx.value] ?? null);
/** PDFかどうか（fileNameだけでなくpreviewURLも.pdfの場合のみCanvas描画） */
const isPdf = computed(() => {
  if (!selected.value) return false;
  const path = selected.value.imagePath.toLowerCase();
  return path.endsWith('.pdf');
});

// --- 拡大縮小（widthベース、デフォルト50%） ---
const DEFAULT_ZOOM = 0.5;
const zoomScale = ref(DEFAULT_ZOOM);
const doZoomIn = () => { zoomScale.value = Math.min(zoomScale.value + 0.25, 5); renderIfPdf(); };
const doZoomOut = () => { zoomScale.value = Math.max(zoomScale.value - 0.25, 0.25); renderIfPdf(); };
const doZoomReset = () => { zoomScale.value = DEFAULT_ZOOM; renderIfPdf(); };

/** PDFの場合、scaleを変更したらCanvas再描画 */
const renderIfPdf = () => {
  if (isPdf.value && selected.value) {
    nextTick(() => pdfRenderPage(selected.value!.imagePath, zoomScale.value * 2));
  }
};

// --- ローディング ---
const isLoading = ref(false);
const simulateLoad = async () => {
  isLoading.value = true;
  // 実データ時は読み込み時間が発生するのでawait
  await new Promise(r => setTimeout(r, 400));
  isLoading.value = false;

  // PDF描画
  if (isPdf.value && selected.value) {
    await nextTick();
    pdfRenderPage(selected.value.imagePath, zoomScale.value * 2);
  }
};

watch(selectedIdx, () => {
  zoomScale.value = DEFAULT_ZOOM;
  pdfDestroy(); // 前のPDFリソース解放
  simulateLoad();
});
onMounted(() => { simulateLoad(); });

// PDFページ変更時に再描画
watch(pdfCurrentPage, () => {
  if (isPdf.value && selected.value) {
    pdfRenderPage(selected.value.imagePath, zoomScale.value * 2);
  }
});

const selectDoc = (idx: number) => { selectedIdx.value = idx; };

// --- 件数集計 ---
const counts = computed(() => {
  const docs = documents.value;
  return {
    pending:    docs.filter(d => d.status === 'pending').length,
    target:     docs.filter(d => d.status === 'target').length,
    supporting: docs.filter(d => d.status === 'supporting').length,
    excluded:   docs.filter(d => d.status === 'excluded').length,
  };
});

// --- Undo/Redo ---
interface HistoryEntry { docId: string; from: DocStatus; to: DocStatus; }
const undoStack = ref<HistoryEntry[]>([]);
const redoStack = ref<HistoryEntry[]>([]);
const canUndo = computed(() => undoStack.value.length > 0);
const canRedo = computed(() => redoStack.value.length > 0);

const pushHistory = (docId: string, from: DocStatus, to: DocStatus) => {
  undoStack.value.push({ docId, from, to });
  redoStack.value = [];
};
const undo = () => {
  const entry = undoStack.value.pop();
  if (!entry) return;
  updateDocStatus(entry.docId, entry.from, currentStaffId.value);
  redoStack.value.push(entry);
  showCompleteModal.value = false;
};
const redo = () => {
  const entry = redoStack.value.pop();
  if (!entry) return;
  updateDocStatus(entry.docId, entry.to, currentStaffId.value);
  undoStack.value.push(entry);
};

// --- 全選別完了モーダル ---
const showCompleteModal = ref(false);

// --- ステータス設定 ---
const setStatus = (status: DocStatus) => {
  if (!selected.value) return;
  const currentStatus = selected.value.status as DocStatus;
  if (currentStatus === status) return;

  pushHistory(selected.value.id, currentStatus, status);
  updateDocStatus(selected.value.id, status, currentStaffId.value);

  const remainingPending = documents.value.filter(
    (d, i) => d.status === 'pending' && !(i === selectedIdx.value)
  ).length;

  if (remainingPending === 0) {
    showCompleteModal.value = true;
    return;
  }

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
  pushHistory(selected.value.id, selected.value.status as DocStatus, 'pending');
  updateDocStatus(selected.value.id, 'pending', currentStaffId.value);
  showCompleteModal.value = false;
};

// --- 仕訳処理に送る ---
const sendToProcess = () => {
  // batchId + journalIdを全件付与（status問わず）
  assignBatchAndJournalIds(clientId.value);

  showCompleteModal.value = false;
  removeByClientId(clientId.value);
  selectedIdx.value = 0;
  undoStack.value = [];
  redoStack.value = [];
};

// --- 取り込み（Drive API接続） ---
const isImporting = ref(false);
const importMessage = ref('');
const handleImport = async () => {
  const folderId = currentClient.value?.sharedFolderId;
  if (!folderId) {
    alert('Drive共有フォルダが未作成です。先にフォルダを作成してください。');
    return;
  }

  isImporting.value = true;
  importMessage.value = 'ファイル一覧を取得中...';

  try {
    // 1. Driveフォルダ内のファイル一覧取得
    const filesRes = await fetch(`/api/drive/files?folderId=${encodeURIComponent(folderId)}`);
    if (!filesRes.ok) {
      const data = await filesRes.json().catch(() => ({ error: filesRes.statusText }));
      throw new Error(data.error || `HTTP ${filesRes.status}`);
    }
    const filesData = await filesRes.json() as {
      files: Array<{ id: string; name: string; mimeType: string; size: number; createdTime: string; thumbnailLink: string | null }>
    };

    if (filesData.files.length === 0) {
      importMessage.value = '';
      isImporting.value = false;
      alert('新しいファイルはありません。');
      return;
    }

    importMessage.value = `${filesData.files.length}件を処理中...（DL+ハッシュ+サムネイル）`;

    // 2. 各ファイルをDL+ハッシュ+サムネイル+ゴミ箱移動
    const processRes = await fetch('/api/drive/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: filesData.files.map(f => ({
          fileId: f.id,
          filename: f.name,
          mimeType: f.mimeType,
        })),
        clientId: clientId.value,
      }),
    });
    if (!processRes.ok) {
      const data = await processRes.json().catch(() => ({ error: processRes.statusText }));
      throw new Error(data.error || `HTTP ${processRes.status}`);
    }
    const processData = await processRes.json() as {
      results: Array<{
        fileId: string; filename: string; fileHash: string;
        sizeBytes: number; thumbnail: string | null; mimeType: string; isDuplicate: boolean;
      }>;
      errors: Array<{ fileId: string; error: string }>;
    };

    // 3. サーバー側でdocumentStoreに保存済み → フロントのキャッシュを全件再取得
    const { refresh } = useDocuments();
    await refresh();

    importMessage.value = '';
    isImporting.value = false;

    const errorMsg = processData.errors.length > 0
      ? `\n※ ${processData.errors.length}件の取り込みに失敗しました`
      : '';
    alert(`取り込み完了: ${processData.results.length}件${errorMsg}`);
  } catch (err) {
    importMessage.value = '';
    isImporting.value = false;
    const msg = err instanceof Error ? err.message : String(err);
    alert(`取り込みエラー: ${msg}`);
  }
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

// --- キーボードショートカット ---
const handleKey = (e: KeyboardEvent) => {
  if (showCompleteModal.value) return;
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
.ds-counts { display: flex; gap: 8px; align-items: center; }
.ds-count { font-size: 12px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
.ds-count-pending { background: #f3f4f6; color: #6b7280; }
.ds-count-target { background: #dbeafe; color: #1d4ed8; }
.ds-count-supporting { background: #fef3c7; color: #92400e; }
.ds-count-excluded { background: #fee2e2; color: #dc2626; }

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
  border-radius: 12px; overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  background: white; border: 1px solid #e5e7eb;
}

/* スクロール可能なプレビューエリア */
.ds-preview-scroll {
  overflow: auto; max-height: 480px;
  display: flex; justify-content: center; align-items: flex-start;
  background: #e5e7eb;
}
.ds-preview-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.ds-preview-scroll::-webkit-scrollbar-track { background: #f1f5f9; }
.ds-preview-scroll::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 3px; }

/* 画像: widthベースで拡大縮小＋中央配置 */
.ds-preview-img {
  display: block; max-width: none;
  transition: width 0.15s ease;
}

/* PDF Canvas */
.ds-preview-canvas {
  display: block; max-width: 100%;
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
.ds-shortcut-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: rgba(0, 0, 0, 0.65); color: white;
  padding: 8px 16px; font-size: 12px;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.ds-shortcut-overlay kbd {
  background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4);
  border-radius: 3px; padding: 1px 6px; font-size: 11px; font-weight: 700;
  font-family: inherit;
}
.ds-shortcut-sep { opacity: 0.4; margin: 0 4px; }

/* ファイル情報 */
.ds-file-info { margin-top: 10px; text-align: center; }
.ds-file-name { font-size: 14px; font-weight: 700; color: #1f2937; }
.ds-file-meta { font-size: 12px; color: #6b7280; margin-top: 2px; }
.ds-file-count { font-size: 11px; color: #9ca3af; margin-top: 2px; }

/* ========== アクション ========== */
.ds-actions { margin-top: 12px; display: flex; gap: 10px; align-items: center; justify-content: center; }
.ds-action-btn {
  padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 700;
  border: 2px solid transparent; cursor: pointer;
  transition: all 0.15s; display: flex; align-items: center; gap: 6px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}
.ds-action-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.ds-action-btn:active { transform: scale(0.97); }

.ds-btn-target { background: #2563eb; color: white; }
.ds-btn-target:hover { background: #1d4ed8; }
.ds-btn-target.ds-btn-active { background: #1e40af; box-shadow: 0 0 0 4px rgba(59,130,246,0.3); }

.ds-btn-supporting { background: #d97706; color: white; }
.ds-btn-supporting:hover { background: #b45309; }
.ds-btn-supporting.ds-btn-active { background: #92400e; box-shadow: 0 0 0 4px rgba(217,119,6,0.3); }

.ds-btn-excluded { background: #dc2626; color: white; }
.ds-btn-excluded:hover { background: #b91c1c; }
.ds-btn-excluded.ds-btn-active { background: #991b1b; box-shadow: 0 0 0 4px rgba(220,38,38,0.3); }

.ds-current-status { margin-top: 6px; font-size: 12px; font-weight: 600; }
.ds-text-target { color: #2563eb; }
.ds-text-supporting { color: #d97706; }
.ds-text-excluded { color: #dc2626; }

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
