/**
 * pdfThumbnail.ts — PDF.jsで1ページ目をcanvasレンダリングしてdataURLを返す
 * モバイル/PCのPDFサムネイル表示用
 */
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'

// ワーカー設定（ビルドツールで自動解決）
GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

/**
 * PDFファイルの1ページ目をサムネイル画像（dataURL）に変換
 * @param file PDFファイル
 * @param maxWidth サムネイルの最大幅（px）デフォルト300
 * @returns dataURL（image/png）
 */
export async function generatePdfThumbnail(
  file: File,
  maxWidth = 300,
): Promise<string> {
  const buffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: buffer }).promise
  const page = await pdf.getPage(1)

  // ビューポートをmaxWidthに合わせてスケール
  const unscaledViewport = page.getViewport({ scale: 1 })
  const scale = maxWidth / unscaledViewport.width
  const viewport = page.getViewport({ scale })

  // Canvasにレンダリング
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')!

  await page.render({ canvasContext: ctx, viewport }).promise

  const dataUrl = canvas.toDataURL('image/png')

  // メモリ解放
  page.cleanup()
  await pdf.destroy()

  return dataUrl
}
