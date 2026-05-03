/**
 * usePdfRenderer — PDF.js によるCanvas描画composable
 *
 * 【使い方】
 * const { canvasRef, renderPage, pageCount, currentPage, nextPage, prevPage } = usePdfRenderer()
 * renderPage(url, scale) でPDFの現在ページをCanvasに描画
 *
 * 【設計】
 * - pdfjs-dist v5系対応
 * - ワーカーはCDNから読み込み（ビルドサイズ削減）
 * - 1ページ単位レンダリング（メモリ効率）
 */
import { ref, onUnmounted } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'

// ワーカー設定（jsDelivr npm CDN）
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

export function usePdfRenderer() {
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const pageCount = ref(0)
  const currentPage = ref(1)
  const isRendering = ref(false)

  // 内部状態
  let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null
  let currentUrl = ''

  /** PDFを読み込んで指定ページをCanvasに描画 */
  async function renderPage(url: string, scale: number = 1) {
    if (!canvasRef.value) return

    isRendering.value = true

    try {
      // URLが変わったら再読み込み
      if (url !== currentUrl) {
        if (pdfDoc) {
          pdfDoc.destroy()
          pdfDoc = null
        }
        const loadingTask = pdfjsLib.getDocument(url)
        pdfDoc = await loadingTask.promise
        pageCount.value = pdfDoc.numPages
        currentPage.value = 1
        currentUrl = url
      }

      if (!pdfDoc) return

      // ページ取得
      const page = await pdfDoc.getPage(currentPage.value)
      const viewport = page.getViewport({ scale })

      const canvas = canvasRef.value
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({
        canvas,
        canvasContext: ctx,
        viewport,
      }).promise
    } catch (err) {
      console.error('PDF描画エラー:', err)
    } finally {
      isRendering.value = false
    }
  }

  /** 次ページ */
  function nextPage() {
    if (currentPage.value < pageCount.value) {
      currentPage.value++
    }
  }

  /** 前ページ */
  function prevPage() {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  /** リソース解放 */
  function destroy() {
    if (pdfDoc) {
      pdfDoc.destroy()
      pdfDoc = null
    }
    currentUrl = ''
    pageCount.value = 0
    currentPage.value = 1
  }

  onUnmounted(() => {
    destroy()
  })

  return {
    /** canvas要素のref */
    canvasRef,
    /** 総ページ数 */
    pageCount,
    /** 現在のページ番号 */
    currentPage,
    /** 描画中フラグ */
    isRendering,
    /** PDFを描画 */
    renderPage,
    /** 次ページ */
    nextPage,
    /** 前ページ */
    prevPage,
    /** リソース解放 */
    destroy,
  }
}
