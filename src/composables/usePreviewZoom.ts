/**
 * usePreviewZoom.ts — プレビュー選択・ズーム制御
 *
 * MockDriveSelectPage.vueから分離。
 * 責務: ファイル選択、プレビューURL、PDF判定、ズーム操作
 */

import { ref, computed, watch, nextTick, type Ref, type ComputedRef } from 'vue';
import type { DocView } from './useDriveDocuments';

export interface UsePreviewZoomReturn {
  /** 選択中インデックス */
  selectedIdx: Ref<number>;
  /** 選択中ドキュメント */
  selected: ComputedRef<DocView | null>;
  /** プレビューURL */
  previewUrl: ComputedRef<string>;
  /** PDFかどうか */
  isPdf: ComputedRef<boolean>;
  /** ズーム倍率 */
  zoomScale: Ref<number>;
  /** ズームイン */
  doZoomIn: () => void;
  /** ズームアウト */
  doZoomOut: () => void;
  /** ズームリセット */
  doZoomReset: () => void;
  /** プレビューwrapperスタイル */
  previewWrapperStyle: ComputedRef<{ width: string; height: string }>;
  /** ドキュメント選択 */
  selectDoc: (idx: number) => void;
  /** ローディングシミュレーション */
  simulateLoad: () => Promise<void>;
}

/**
 * プレビュー・ズーム制御を提供するcomposable
 *
 * @param documents - フィルタ適用後のドキュメント
 * @param isLoading - ローディング状態ref
 * @param pdfRenderPage - PDF描画関数
 * @param pdfDestroy - PDF破棄関数
 */
export function usePreviewZoom(
  documents: ComputedRef<DocView[]>,
  isLoading: Ref<boolean>,
  pdfRenderPage: (url: string, scale: number) => void,
  pdfDestroy: () => void,
): UsePreviewZoomReturn {
  const DEFAULT_ZOOM = 0.5;

  const selectedIdx = ref(0);
  const selected = computed(() => documents.value[selectedIdx.value] ?? null);

  // フィルタ中の選別操作でリストからファイルが消えた場合、selectedIdxをクランプ
  watch(() => documents.value.length, (len) => {
    if (len === 0) { selectedIdx.value = 0; return; }
    if (selectedIdx.value >= len) selectedIdx.value = len - 1;
  });

  /** プレビューURL */
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
  const zoomScale = ref(DEFAULT_ZOOM);

  /** PDFの場合、scaleを変更したらCanvas再描画 */
  const renderIfPdf = () => {
    if (isPdf.value && selected.value) {
      nextTick(() => pdfRenderPage(previewUrl.value, zoomScale.value * 2));
    }
  };

  const doZoomIn = () => { zoomScale.value = Math.min(zoomScale.value + 0.25, 5); renderIfPdf(); };
  const doZoomOut = () => { zoomScale.value = Math.max(zoomScale.value - 0.25, 0.25); renderIfPdf(); };
  const doZoomReset = () => { zoomScale.value = DEFAULT_ZOOM; renderIfPdf(); };

  /** プレビュー画像wrapperのスタイル（ズーム制御） */
  const previewWrapperStyle = computed(() => {
    const pct = zoomScale.value * 200; // 0.5 → 100%
    return {
      width: pct + '%',
      height: pct + '%',
    };
  });

  const selectDoc = (idx: number) => { selectedIdx.value = idx; };

  // --- ローディング（プレビュー切り替え時） ---
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

  return {
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
  };
}
