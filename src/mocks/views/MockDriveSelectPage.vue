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
      <!-- 右: 確定送信 + 再取得 -->
      <div class="ds-header-right">
        <button class="ds-submit-btn" :disabled="allDocsView.length === 0" @click="showCompleteModal = true">
          <i class="fa-solid fa-paper-plane"></i> 確定送信
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

            <!-- AI分類結果パネル -->
            <div v-if="hasAiResult" class="ds-ai-panel">
              <button class="ds-ai-toggle" @click="showAiPanel = !showAiPanel">
                <i class="fa-solid fa-robot ds-ai-icon"></i>
                <span class="ds-ai-toggle-label">AI分類結果</span>
                <span v-if="selected.aiWarning" class="ds-ai-warn-badge">⚠</span>
                <i :class="showAiPanel ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'" class="ds-ai-chevron"></i>
              </button>
              <div v-show="showAiPanel" class="ds-ai-body">
                <div class="ds-ai-grid">
                  <div v-if="selected.aiDate" class="ds-ai-item">
                    <span class="ds-ai-label">日付</span>
                    <span class="ds-ai-value">{{ selected.aiDate }}</span>
                  </div>
                  <div v-if="selected.aiAmount != null" class="ds-ai-item">
                    <span class="ds-ai-label">金額</span>
                    <span class="ds-ai-value ds-ai-amount">¥{{ selected.aiAmount.toLocaleString() }}</span>
                  </div>
                  <div v-if="selected.aiVendor" class="ds-ai-item">
                    <span class="ds-ai-label">取引先</span>
                    <span class="ds-ai-value">{{ selected.aiVendor }}</span>
                  </div>
                  <div v-if="selected.aiSourceType" class="ds-ai-item">
                    <span class="ds-ai-label">証票種別</span>
                    <span class="ds-ai-value ds-ai-badge-type">{{ sourceTypeLabel(selected.aiSourceType) }}</span>
                  </div>
                  <div v-if="selected.aiDirection" class="ds-ai-item">
                    <span class="ds-ai-label">方向</span>
                    <span class="ds-ai-value" :class="directionClass(selected.aiDirection)">{{ directionLabel(selected.aiDirection) }}</span>
                  </div>
                  <div v-if="selected.aiDescription" class="ds-ai-item ds-ai-item-full">
                    <span class="ds-ai-label">摘要</span>
                    <span class="ds-ai-value">{{ selected.aiDescription }}</span>
                  </div>
                  <div v-if="selected.aiLineItemsCount" class="ds-ai-item">
                    <span class="ds-ai-label">行数</span>
                    <span class="ds-ai-value">{{ selected.aiLineItemsCount }}行</span>
                  </div>
                  <div v-if="selected.aiDocumentCount && selected.aiDocumentCount > 1" class="ds-ai-item">
                    <span class="ds-ai-label">証票枚数</span>
                    <span class="ds-ai-value ds-ai-warn">{{ selected.aiDocumentCount }}枚</span>
                  </div>
                </div>
                <!-- 全項目null（previewExtract通過したが認識不可） -->
                <div v-if="!selected.aiDate && selected.aiAmount == null && !selected.aiVendor && !selected.aiSourceType && !selected.aiDirection && !selected.aiDescription && !selected.aiLineItemsCount" class="ds-ai-empty">
                  <i class="fa-solid fa-circle-info"></i> AI認識結果なし（証票として認識できなかった可能性があります）
                </div>
                <!-- 警告 -->
                <div v-if="selected.aiWarning" class="ds-ai-warning">
                  <i class="fa-solid fa-triangle-exclamation"></i> {{ selected.aiWarning }}
                </div>
                <!-- 補助フラグ -->
                <div v-if="selected.aiSupplementary" class="ds-ai-supplementary">
                  <i class="fa-solid fa-paperclip"></i> 補助資料（AI処理スキップ）
                </div>
              </div>
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

    <!-- 確定送信モーダル（確認のみ。移行中/完了はバックグラウンド+トースト通知） -->
    <div v-if="showCompleteModal" class="ds-modal-overlay" @click.self="showCompleteModal = false">
      <div class="ds-modal">
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
          <button class="ds-modal-btn ds-modal-btn-yes" @click="sendToProcess" :disabled="isSending"><i class="fa-solid fa-paper-plane"></i> {{ isSending ? '送信中...' : '送信' }}</button>
          <button class="ds-modal-btn ds-modal-btn-no" @click="showCompleteModal = false" :disabled="isSending">キャンセル</button>
        </div>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { usePdfRenderer } from '@/composables/usePdfRenderer';
import { useClients } from '@/features/client-management/composables/useClients';
import { useUnsavedGuard } from '@/mocks/composables/useUnsavedGuard';
import { useGlobalToast } from '@/mocks/composables/useGlobalToast';
import { useMigrationPoller } from '@/mocks/composables/useMigrationPoller';
import { useDriveDocuments } from '@/mocks/composables/useDriveDocuments';
import { useDocSelection } from '@/mocks/composables/useDocSelection';
import { usePreviewZoom } from '@/mocks/composables/usePreviewZoom';
import type { DocEntry } from '@/repositories/types';

const route = useRoute();
const clientId = computed(() => (route.params.clientId as string) || '');
const { currentClient } = useClients();

// --- ページ離脱ガード（選別中の離脱を警告） ---
const { markDirty, markClean } = useUnsavedGuard(null);

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

// ===== Composable 1: データ取得・マージ =====
const {
  uploadedDocs,
  driveSelections,
  isLoading,
  allDocsView,
  documents,
  activeFilter,
  fetchDriveFiles,
  fetchUploadedDocs,
  fetchExcludedCount,
  handleReload,
  toggleFilter,
} = useDriveDocuments(
  clientId,
  () => currentClient.value?.sharedFolderId,
  () => { selectedIdx.value = 0; },
);

// ===== Composable 3: プレビュー・ズーム =====
const {
  selectedIdx,
  selected,
  previewUrl,
  isPdf,
  zoomScale,
  doZoomIn,
  doZoomOut,
  doZoomReset,
  previewWrapperStyle,
  selectDoc,
  simulateLoad,
} = usePreviewZoom(documents, isLoading, pdfRenderPage, pdfDestroy);

// ===== Composable 2: 選別操作 =====
const {
  undoStack,
  redoStack,
  canUndo,
  canRedo,
  undo,
  redo,
  setStatus,
  resetStatus,
  bulkSetStatus,
  checkedIds,
  toggleCheck,
  toggleCheckAll,
  counts,
  showCompleteModal,
  showBulkModal,
} = useDocSelection(
  driveSelections,
  uploadedDocs,
  allDocsView,
  documents,
  selected,
  selectedIdx,
  markDirty,
);

// --- onMounted ---
onMounted(async () => {
  await Promise.all([fetchDriveFiles(), fetchUploadedDocs()]);
  fetchExcludedCount();
  simulateLoad();
});

// PDFページ変更時に再描画
watch(pdfCurrentPage, () => {
  if (isPdf.value && selected.value) {
    pdfRenderPage(previewUrl.value, zoomScale.value * 2);
  }
});

// --- バックグラウンド移行基盤 ---
const { showToast } = useGlobalToast();
const { startPolling } = useMigrationPoller();
const isSending = ref(false);

// --- 仕訳変換（パイプライン接続: 選別→仕訳一覧） ---
import { lineItemToJournalMock } from '@/mocks/utils/lineItemToJournalMock';
import type { LineItem } from '@/mocks/types/pipeline/line_item.type';
import type { SourceType } from '@/mocks/types/pipeline/source_type.type';
import { useJournals } from '@/mocks/composables/useJournals';
import { useDocuments } from '@/composables/useDocuments';

const { journals } = useJournals(clientId);
const { allDocuments, clearAiFields } = useDocuments();

/**
 * DocEntry.aiLineItems → LineItem[] に変換するヘルパー
 * DocEntry型は基本フィールド+科目確定結果を持つが、LineItem型にマッピングする
 */
function docLineItemsToLineItems(
  aiLineItems: NonNullable<DocEntry['aiLineItems']>,
): LineItem[] {
  return aiLineItems.map(li => ({
    date: li.date,
    description: li.description,
    amount: li.amount,
    direction: li.direction,
    balance: li.balance,
    line_index: li.line_index,
    determined_account: li.determined_account ?? null,
    tax_category: li.tax_category ?? null,
    sub_account: li.sub_account ?? null,
    vendor_name: li.vendor_name ?? null,
    level: li.level,
    candidates: li.candidates,
  }));
}

// --- 仕訳処理に送る（Phase D + パイプライン接続） ---
const sendToProcess = async () => {
  const filesToMigrate = documents.value
    .filter(d => d.status !== 'pending')
    .map(d => ({ fileId: d.id, status: d.status }));

  if (filesToMigrate.length === 0) {
    showCompleteModal.value = false;
    return;
  }

  isSending.value = true;

  try {
    // ━━━ 1. 仕訳変換: target の DocEntry から仕訳レコードを生成 ━━━
    const targetDocViews = documents.value.filter(d => d.status === 'target');
    let generatedCount = 0;

    for (const docView of targetDocViews) {
      // DocView.id で元の DocEntry を検索（aiLineItemsを持つ完全データ）
      const docEntry = allDocuments.value.find(d => d.id === docView.id)
        || uploadedDocs.value.find(d => d.id === docView.id);

      if (!docEntry?.aiLineItems || docEntry.aiLineItems.length === 0) {
        console.log(`[sendToProcess] ${docView.id}: aiLineItemsなし（スキップ）`);
        continue;
      }

      // 科目確定結果を含むLineItem[]に変換
      const lineItems = docLineItemsToLineItems(docEntry.aiLineItems);
      const sourceType = (docEntry.aiSourceType as SourceType) || 'receipt';

      // lineItemToJournalMock() で JournalPhase5Mock[] に変換
      const newJournals = lineItemToJournalMock(
        lineItems,
        sourceType,
        clientId.value,
        false,               // isCreditCardPayment（将来: DocEntryに追加予定）
        docEntry.id,         // documentId
      );

      // useJournals に追加（autoSave watchで自動的にサーバー保存される）
      journals.value.push(...newJournals);
      generatedCount += newJournals.length;

      console.log(
        `[sendToProcess] ${docView.fileName}: ${newJournals.length}件の仕訳を生成`
        + ` (source_type=${sourceType}, lineItems=${lineItems.length})`
      );
    }

    if (generatedCount > 0) {
      console.log(`[sendToProcess] 合計${generatedCount}件の仕訳を journals-${clientId.value}.json に追加`);
    }

    // ━━━ 1.5. previewExtractデータ完全削除（設計方針: previewExtract.service.ts ヘッダー参照）━━━
    // 仕訳変換が完了したため、previewExtract起算のai*フィールドは不要。
    // Extract API（本番AI）実装後はゼロから仕訳データを再生成する。
    await clearAiFields(clientId.value);
    console.log(`[sendToProcess] previewExtractデータ完全削除: ${clientId.value}`);

    // ━━━ 2. Drive経路: migrateジョブ登録（Driveファイルのみ） ━━━
    const driveFiles = filesToMigrate.filter(f => {
      const docView = documents.value.find(d => d.id === f.fileId);
      return docView?.source === 'drive';
    });

    if (driveFiles.length > 0) {
      const res = await fetch('/api/drive/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientId.value,
          files: driveFiles,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const result = await res.json() as { jobId: string; queued: number };
      console.log(`[sendToProcess] Drive移行ジョブ登録: jobId=${result.jobId}, queued=${result.queued}`);

      // ポーリングをグローバルcomposableに委譲
      startPolling(
        result.jobId,
        currentClient.value?.companyName ?? '',
        clientId.value,
        result.queued,
        counts.value.excluded,
      );
    }

    showCompleteModal.value = false;
    markClean();

    const totalMsg = generatedCount > 0
      ? `${generatedCount}件の仕訳を生成しました。`
      : '';
    const driveMsg = driveFiles.length > 0
      ? `Drive${driveFiles.length}件はバックグラウンドで処理中。`
      : '';

    showToast({
      message: `送信完了。${totalMsg}${driveMsg}`,
      type: 'info',
      icon: 'fa-solid fa-paper-plane',
    });

    // 画面リセット
    await fetchDriveFiles();
    await fetchExcludedCount();
    selectedIdx.value = 0;
    undoStack.value = [];
    redoStack.value = [];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    showToast({
      message: `移行エラー: ${msg}`,
      type: 'error',
    });
  } finally {
    isSending.value = false;
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

// --- AI分類結果パネル ---
const showAiPanel = ref(true);
const hasAiResult = computed(() => {
  if (!selected.value) return false;
  const s = selected.value;
  // AIフィールドが1つでもundefined以外（nullも含む）＝previewExtract APIを通過済み
  return s.aiDate !== undefined
    || s.aiAmount !== undefined
    || s.aiVendor !== undefined
    || s.aiSourceType !== undefined
    || s.aiDirection !== undefined
    || s.aiDescription !== undefined
    || s.aiSupplementary !== undefined;
});

const sourceTypeLabel = (t: string) => {
  const map: Record<string, string> = {
    receipt: 'レシート', invoice: '請求書', bank_statement: '通帳',
    credit_card: 'クレカ明細', transfer: '振込明細', tax_payment: '納税',
    other: 'その他',
  };
  return map[t] || t;
};

const directionLabel = (d: string) => {
  const map: Record<string, string> = {
    expense: '支出', income: '収入', transfer: '振替', mixed: '混合',
  };
  return map[d] || d;
};

const directionClass = (d: string) => {
  if (d === 'expense') return 'ds-ai-dir-expense';
  if (d === 'income') return 'ds-ai-dir-income';
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
  justify-content: flex-start; background: #f1f5f9; padding: 12px 16px;
  overflow: hidden;
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
  flex: 1 1 0;
  min-height: 120px;
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

/* ========== AI分類結果パネル ========== */
.ds-ai-panel {
  margin-top: 10px; width: 100%; max-width: 720px;
  background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%);
  border: 1px solid #e0e7ff; border-radius: 10px;
  overflow: hidden; transition: all 0.2s;
}
.ds-ai-toggle {
  width: 100%; padding: 8px 14px; border: none; background: none;
  display: flex; align-items: center; gap: 8px;
  cursor: pointer; font-size: 13px; font-weight: 700; color: #4338ca;
  transition: background 0.15s;
}
.ds-ai-toggle:hover { background: rgba(99, 102, 241, 0.08); }
.ds-ai-icon { font-size: 16px; color: #6366f1; }
.ds-ai-toggle-label { flex: 1; text-align: left; }
.ds-ai-chevron { font-size: 11px; color: #a5b4fc; }
.ds-ai-warn-badge {
  font-size: 12px; color: #f59e0b; background: #fef3c7;
  padding: 1px 6px; border-radius: 4px; font-weight: 700;
}
.ds-ai-body { padding: 0 14px 12px; }
.ds-ai-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.ds-ai-item {
  display: flex; flex-direction: column; gap: 1px;
  background: white; border-radius: 6px; padding: 6px 10px;
  border: 1px solid #e5e7eb;
}
.ds-ai-item-full { grid-column: 1 / -1; }
.ds-ai-label { font-size: 10px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.ds-ai-value { font-size: 13px; color: #1f2937; font-weight: 500; }
.ds-ai-amount { color: #059669; font-weight: 700; font-size: 14px; }
.ds-ai-badge-type {
  display: inline-block; background: #ede9fe; color: #5b21b6;
  padding: 1px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;
}
.ds-ai-dir-expense { color: #dc2626; font-weight: 600; }
.ds-ai-dir-income { color: #059669; font-weight: 600; }
.ds-ai-warn { color: #d97706; font-weight: 700; }
.ds-ai-warning {
  margin-top: 8px; padding: 6px 10px; border-radius: 6px;
  background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 500;
  display: flex; align-items: center; gap: 6px;
}
.ds-ai-supplementary {
  margin-top: 6px; padding: 4px 10px; border-radius: 6px;
  background: #f3f4f6; color: #6b7280; font-size: 12px; font-weight: 500;
  display: flex; align-items: center; gap: 6px;
}
.ds-ai-empty {
  padding: 8px 10px; border-radius: 6px;
  background: #f9fafb; color: #9ca3af; font-size: 12px; font-weight: 500;
  display: flex; align-items: center; gap: 6px;
  font-style: italic;
}
</style>
