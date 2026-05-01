/**
 * useUpload.ts — アップロード共通ロジック（PC/モバイル統合）
 *
 * 責務:
 *   - ファイル追加 / 削除 / 撮り直し
 *   - previewExtract API呼出 + 結果マッピング（重複チェック含む）
 *   - スライディングウィンドウ（同時4件）
 *   - プレビュー選択
 *   - 送付確定 / リセット
 *   - PC/モバイル自動判定
 */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { analyzeReceipt, type ReceiptAnalysisResult, type AnalyzeOptions } from '@/mocks/services/receiptService'
import { errorGuideMessage } from '@/shared/validationMessages'
import { useDocuments } from '@/composables/useDocuments'
import { useCurrentUser } from '@/mocks/composables/useCurrentUser'
import type { DocEntry, DocSource, DocStatus } from '@/repositories/types'

// ===== 型定義（統一） =====

export type UploadStatus = 'queued' | 'uploading' | 'analyzing' | 'ok' | 'error'

export interface UploadEntry {
  id: string
  documentId: string   // 証票ID（crypto.randomUUID()。Supabase時はUUID PK）
  file: File | null  // 処理完了後はnull（メモリ解放）
  fileName: string   // ファイル名（file解放後もテンプレートから参照可能）
  fileSize: number   // ファイルサイズ（file解放後もテンプレートから参照可能）
  /** MIMEタイプ（file解放後もテンプレートから参照可能。例: 'image/jpeg'） */
  mimeType: string
  previewUrl: string
  previewUrlHQ: string | null  // PC用高解像度プレビュー（800px。モバイルではnull）
  status: UploadStatus
  errorReason: string | null
  // タイムスタンプ（ソート安定化用）
  addedAt: number           // Date.now()。投入時刻
  completedAt: number | null // 処理完了時刻（ok/error確定時）
  // previewExtract結果
  date: string | null
  amount: number | null
  vendor: string | null
  supplementary: boolean
  sourceType: string | null        // 証票種別（例: 'receipt', 'bank_statement'）
  lineItemsCount: number           // 行データ件数（通帳/クレカ: N行）
  warning: string | null           // 警告（OK判定だが注意が必要）
  // メトリクス（PC版バッジ表示用）
  metrics: ReceiptAnalysisResult['metrics'] | null
  lineItems: ReceiptAnalysisResult['lineItems'] | null
  // 重複チェック
  isDuplicate: boolean
  hash: string | null
  documentCount: number            // 証票枚数（previewExtract API出力。2以上は複数証票警告）
  lite: boolean             // 軽量モード（AI分類スキップ）
  /** サーバー保存先URL（/api/pipeline/file/{clientId}/{savedName}）。リロード後も有効 */
  fileUrl: string | null
}

// ===== ラベル定義 =====

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  receipt: '領収書', invoice_received: '請求書', tax_payment: '納付書',
  journal_voucher: '振替伝票', bank_statement: '通帳', credit_card: 'クレカ明細',
  cash_ledger: '現金出納帳', invoice_issued: '発行請求書', receipt_issued: '発行領収書',
  non_journal: '仕訳対象外', supplementary_doc: '補助資料', other: 'その他',
}

// ===== ユーティリティ =====

/** メモリ使用量取得（Chrome/Android限定。iOS Safariでは取得不可=null） */
function getMemoryMB(): number | null {
  const perf = performance as unknown as { memory?: { usedJSHeapSize: number } }
  return perf.memory ? Math.round(perf.memory.usedJSHeapSize / 1024 / 1024) : null
}

/** チェックポイント送信（sendBeacon: クラッシュ直前でも送信される可能性が高い） */
function sendCheckpoint(name: string, extra?: Record<string, unknown>) {
  const data = JSON.stringify({
    mode: 'checkpoint',
    fileName: name,
    memMB: getMemoryMB(),
    ts: Date.now(),
    ...extra,
  })
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/pipeline/metrics', new Blob([data], { type: 'application/json' }))
  } else {
    fetch('/api/pipeline/metrics', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data,
    }).catch(() => {})
  }
}

export const sourceTypeLabel = (v: string) => SOURCE_TYPE_LABELS[v] ?? v

export const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export const isImageFile = (name: string) => /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(name)
export const isPdfFile = (name: string) => /\.pdf$/i.test(name)

export const fileIconEmoji = (name: string): string => {
  if (isPdfFile(name)) return '📄'
  if (isImageFile(name)) return '🖼'
  if (/\.(csv|xlsx?)$/i.test(name)) return '📊'
  return '📎'
}


// UUID生成（HTTP環境フォールバック付き）
// crypto.randomUUID()はSecure Context（HTTPS/localhost）でのみ動作
// LAN IP経由のHTTPアクセスでは使えないためフォールバック
function generateUUID(): string {
  try {
    return crypto.randomUUID()
  } catch {
    // Secure Context外: Math.randomベースのv4 UUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
  }
}

/** チャンクアップロード（File.slice 512KB単位。メモリスパイク最大512KB） */
const CHUNK_SIZE = 512 * 1024 // 512KB（モバイルのメモリスパイクを最小化）

async function uploadChunked(
  file: File,
  uploadId: string,
  filename: string,
  documentId: string,
  clientId: string,
): Promise<{ fileHash?: string; thumbnail?: string; isDuplicate?: boolean; fileUrl?: string }> {
  const totalSize = file.size

  // チャンク送信（512KBずつ。メモリに全体を乗せない）
  for (let offset = 0; offset < totalSize; offset += CHUNK_SIZE) {
    const end = Math.min(offset + CHUNK_SIZE, totalSize)
    const chunk = file.slice(offset, end)
    const res = await fetch('/api/pipeline/upload-chunk', {
      method: 'POST',
      headers: {
        'X-Upload-Id': uploadId,
        'Content-Type': 'application/octet-stream',
      },
      body: chunk,
    })
    if (!res.ok) {
      throw new Error(`チャンク送信失敗: ${res.status} (offset=${offset})`)
    }
  }

  // 全チャンク送信完了 → サーバーに結合+ハッシュ+サムネイル依頼
  const completeRes = await fetch('/api/pipeline/upload-complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadId, filename, documentId, clientId }),
  })
  if (!completeRes.ok) {
    throw new Error(`upload-complete失敗: ${completeRes.status}`)
  }
  return await completeRes.json()
}

// ===== composable本体 =====

const CONCURRENCY_PC = 6      // PC（641px以上）同時処理数
const CONCURRENCY_MOBILE = 1   // モバイル: 1枚ずつ処理（メモリ不足クラッシュ防止）
const MOBILE_BREAKPOINT = 640

export function useUpload() {
  const route = useRoute()
  const clientId = route.params.clientId as string

  // route.nameから権限（role）・端末（device）を導出
  const role = String(route.name ?? '').toLowerCase().includes('guest') ? 'guest' : 'staff'

  // アップロード実行者情報（スタッフ時のみ個人特定。ゲスト時はnull）
  const { currentStaffId, userName: staffName, currentEmail } = useCurrentUser()

  // デバイスは画面幅から自動判定
  const isMobile = ref(window.innerWidth < MOBILE_BREAKPOINT)
  const device = computed(() => isMobile.value ? 'mobile' : 'pc')
  const analyzeOpts = computed<AnalyzeOptions>(() => ({
    clientId, role, device: device.value,
    uploadedBy: {
      staffId: role === 'staff' ? currentStaffId.value : null,
      staffName: role === 'staff' ? staffName.value : null,
      email: role === 'staff' ? currentEmail.value : null,
    },
  }))

  // リサイズ監視
  const onResize = () => { isMobile.value = window.innerWidth < MOBILE_BREAKPOINT }
  onMounted(() => window.addEventListener('resize', onResize))
  onBeforeUnmount(() => window.removeEventListener('resize', onResize))

  // ===== 状態 =====
  const entries = ref<UploadEntry[]>([])
  const showComplete = ref(false)
  const confirmedCount = ref(0)

  // プレビュー用（PC）
  const selectedId = ref<string | null>(null)
  const selectedUrl = ref<string | null>(null)

  const selectedEntry = computed(() =>
    selectedId.value ? entries.value.find(e => e.id === selectedId.value) ?? null : null
  )

  // 撮り直し用（モバイル）
  const retakeTargetIdx = ref<number | null>(null)

  // ===== 集計 =====
  const counts = computed(() => ({
    ok:         entries.value.filter(e => e.status === 'ok').length,
    error:      entries.value.filter(e => e.status === 'error').length,
    processing: entries.value.filter(e => e.status === 'uploading' || e.status === 'analyzing').length,
    queued:     entries.value.filter(e => e.status === 'queued').length,
    pending:    pendingFiles.value.length,  // 内部キュー待ち
  }))

  const progressPct = computed(() => {
    const total = entries.value.length + pendingFiles.value.length
    return total === 0 ? 0
      : Math.round((counts.value.ok + counts.value.error) / total * 100)
  })

  const canConfirm = computed(() =>
    entries.value.length > 0
    && counts.value.processing === 0
    && counts.value.queued === 0
    && pendingFiles.value.length === 0  // 内部キューも空
  )

  /** エラーが1件以上ある（送付は可能だが警告表示用） */
  const hasErrors = computed(() => counts.value.error > 0)

  const guideMessage = computed(() => {
    if (!entries.value.length) return ''
    if (counts.value.error > 0) return errorGuideMessage(counts.value.error)
    return ''
  })

  const confirmLabel = computed(() => {
    const total = entries.value.length + pendingFiles.value.length
    if (!total) return '写真を選んでください'
    if (counts.value.processing || counts.value.queued || pendingFiles.value.length) {
      const done = counts.value.ok + counts.value.error
      return `${total}枚中${done}枚が処理完了 (${progressPct.value}%)`
    }
    if (counts.value.error) return `${entries.value.length}枚を送付する（${counts.value.error}件エラーあり）`
    return `${counts.value.ok}枚を送付する`
  })

  // ===== 画像サムネイル生成 + 圧縮（フラグで切替可能） =====
  /**
   * フロント側画像圧縮の有効化フラグ
   * - false（デフォルト）: 元ファイルをそのまま送信。サーバーsharpが最適な前処理を実施（高画質）
   * - true: フロントで1280px+JPEG80%に圧縮（メモリ制約環境向け。画質劣化あり）
   */
  const ENABLE_FRONTEND_COMPRESS = false
  const COMPRESS_MAX_WIDTH = 1280  // 圧縮時の最大幅
  const COMPRESS_QUALITY = 0.8     // 圧縮時のJPEG品質
  const THUMB_MAX = 200            // サムネイル最大幅/高さ
  const PREVIEW_HQ_MAX = 800       // PC用高解像度プレビュー最大幅/高さ

  interface CompressedFile {
    file: File          // 送信用File（圧縮無効時は元ファイル）
    thumbnail: string   // サムネイルdataURL（5KB程度）
    thumbnailHQ: string | null  // PC用高解像度プレビュー（800px、50KB程度。モバイルではnull）
    originalName: string
    originalSize: number
    lite?: boolean       // 軽量モードフラグ（processCompressQueueで設定）
  }

  /** ファイル種別に応じたサムネイルSVGを返す */
  const getFileTypeThumbnail = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
    const csvExts = ['csv', 'xlsx', 'xls']
    if (csvExts.includes(ext)) {
      return 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" fill="none">'
        + '<rect width="120" height="160" fill="#f0fdf4"/>'
        + '<text x="60" y="65" text-anchor="middle" font-size="36">📊</text>'
        + '<text x="60" y="95" text-anchor="middle" font-size="13" font-weight="bold" fill="#16a34a">' + ext.toUpperCase() + '</text>'
        + '<text x="60" y="115" text-anchor="middle" font-size="10" fill="#6b7280">読込完了</text>'
        + '</svg>',
      )
    }
    return 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" fill="none">'
      + '<rect width="120" height="160" fill="#f8fafc"/>'
      + '<text x="60" y="65" text-anchor="middle" font-size="36">📎</text>'
      + '<text x="60" y="95" text-anchor="middle" font-size="13" font-weight="bold" fill="#64748b">' + ext.toUpperCase() + '</text>'
      + '<text x="60" y="115" text-anchor="middle" font-size="10" fill="#6b7280">読込完了</text>'
      + '</svg>',
    )
  }

  /** サムネイル生成 + 圧縮（画像のみ。PDF/その他は種別アイコン） */
  const compressAndThumbnail = async (file: File): Promise<CompressedFile> => {
    const needHQ = !isMobile.value  // PC時のみ高解像度プレビューを生成

    // --- PDF: pdfjsで1ページ目のサムネイル生成 ---
    if (file.type === 'application/pdf') {
      let thumbnail = PDF_FALLBACK
      let thumbnailHQ: string | null = null
      try {
        const { generatePdfThumbnail } = await import('@/mocks/utils/pdfThumbnail')
        thumbnail = await generatePdfThumbnail(file, THUMB_MAX)
        if (needHQ) {
          thumbnailHQ = await generatePdfThumbnail(file, PREVIEW_HQ_MAX)
        }
      } catch (err) {
        console.warn('[サムネイル] PDFサムネイル生成失敗、アイコン表示:', err)
      }
      return { file, thumbnail, thumbnailHQ, originalName: file.name, originalSize: file.size }
    }

    // --- 画像以外（CSV/Excel/MP3等）: 種別アイコン ---
    if (!file.type.startsWith('image/')) {
      return {
        file,
        thumbnail: getFileTypeThumbnail(file.name),
        thumbnailHQ: null,
        originalName: file.name,
        originalSize: file.size,
      }
    }

    // --- 画像 ---
    try {
      if (ENABLE_FRONTEND_COMPRESS) {
        // ★ 圧縮モード: 1280px + JPEG 80%（メモリ制約環境向け）
        const compressBitmap = await createImageBitmap(file, {
          resizeWidth: Math.min(COMPRESS_MAX_WIDTH, 4000),
          resizeQuality: 'medium',
        })
        const cw = compressBitmap.width
        const ch = compressBitmap.height

        const compressCanvas = document.createElement('canvas')
        compressCanvas.width = cw
        compressCanvas.height = ch
        const cctx = compressCanvas.getContext('2d')!
        cctx.drawImage(compressBitmap, 0, 0)
        compressBitmap.close()

        // サムネイル（圧縮canvasから縮小）
        const thumbScale = Math.min(THUMB_MAX / cw, THUMB_MAX / ch, 1)
        const tw = Math.round(cw * thumbScale)
        const th = Math.round(ch * thumbScale)
        const thumbCanvas = document.createElement('canvas')
        thumbCanvas.width = tw
        thumbCanvas.height = th
        const tctx = thumbCanvas.getContext('2d')!
        tctx.drawImage(compressCanvas, 0, 0, tw, th)
        const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.7)
        thumbCanvas.width = 0
        thumbCanvas.height = 0

        // 圧縮Blob
        const blob = await new Promise<Blob | null>(res =>
          compressCanvas.toBlob(res, 'image/jpeg', COMPRESS_QUALITY),
        )
        compressCanvas.width = 0
        compressCanvas.height = 0

        if (blob) {
          const compressed = new File([blob], file.name, { type: 'image/jpeg' })
          console.log(`[圧縮] ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB (${Math.round(100 - (compressed.size / file.size) * 100)}%削減)`)
          return { file: compressed, thumbnail, thumbnailHQ: null, originalName: file.name, originalSize: file.size }
        }
        return { file, thumbnail, thumbnailHQ: null, originalName: file.name, originalSize: file.size }
      } else {
        // ★ 非圧縮モード: サムネイルのみ生成、元Fileを維持（高画質。サーバーsharpが前処理）
        // PC用高解像度プレビュー用にPREVIEW_HQ_MAXでデコード（モバイルではTHUMB_MAXのみ）
        const decodeMax = needHQ ? PREVIEW_HQ_MAX : Math.min(THUMB_MAX * 4, 800)
        const bitmap = await createImageBitmap(file, {
          resizeWidth: decodeMax,
          resizeQuality: 'medium',
        })

        // サムネイル（200px）
        const scale = Math.min(THUMB_MAX / bitmap.width, THUMB_MAX / bitmap.height, 1)
        const tw = Math.round(bitmap.width * scale)
        const th = Math.round(bitmap.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = tw
        canvas.height = th
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(bitmap, 0, 0, tw, th)
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7)
        canvas.width = 0
        canvas.height = 0

        // PC用高解像度プレビュー（800px）
        let thumbnailHQ: string | null = null
        if (needHQ) {
          const hqScale = Math.min(PREVIEW_HQ_MAX / bitmap.width, PREVIEW_HQ_MAX / bitmap.height, 1)
          const hw = Math.round(bitmap.width * hqScale)
          const hh = Math.round(bitmap.height * hqScale)
          const hqCanvas = document.createElement('canvas')
          hqCanvas.width = hw
          hqCanvas.height = hh
          const hqCtx = hqCanvas.getContext('2d')!
          hqCtx.drawImage(bitmap, 0, 0, hw, hh)
          thumbnailHQ = hqCanvas.toDataURL('image/jpeg', 0.85)
          hqCanvas.width = 0
          hqCanvas.height = 0
        }
        bitmap.close()

        console.log(`[非圧縮] ${file.name}: ${(file.size / 1024).toFixed(0)}KB（元ファイルそのまま送信）${needHQ ? ' +HQプレビュー生成' : ''}`)
        return { file, thumbnail, thumbnailHQ, originalName: file.name, originalSize: file.size }
      }
    } catch {
      // createImageBitmap非対応環境のfallback
      return { file, thumbnail: PLACEHOLDER_SVG, thumbnailHQ: null, originalName: file.name, originalSize: file.size }
    }
  }

  const PDF_FALLBACK = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" fill="none">'
    + '<rect width="120" height="160" fill="#f1f5f9"/>'
    + '<text x="60" y="70" text-anchor="middle" font-size="40">📄</text>'
    + '<text x="60" y="100" text-anchor="middle" font-size="16" font-weight="bold" fill="#dc2626">PDF</text>'
    + '</svg>',
  )

  const PLACEHOLDER_SVG = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" fill="none">'
    + '<rect width="120" height="160" fill="#f1f5f9"/>'
    + '<text x="60" y="85" text-anchor="middle" font-size="14" fill="#94a3b8">読込中...</text>'
    + '</svg>',
  )

  // ===== 圧縮キュー（1枚ずつImage()デコード → 元File即解放） =====
  interface RawQueueItem { file: File; lite: boolean }
  const rawQueue: RawQueueItem[] = []    // 未圧縮の元File（一時的に保持）
  let compressing = false
  const pendingFiles = ref<CompressedFile[]>([])  // 圧縮済み（軽量）
  const pendingCount = computed(() => pendingFiles.value.length + rawQueue.length)
  const totalSelected = computed(() => entries.value.length + pendingFiles.value.length + rawQueue.length)

  /** 軽量サムネイル生成（Image()不使用。createImageBitmap→Blob URL） */
  const createLightThumbnail = async (file: File): Promise<string> => {
    // 画像以外: SVGプレースホルダー
    if (!file.type.startsWith('image/')) {
      return getFileTypeThumbnail(file.name)
    }
    try {
      const bitmap = await createImageBitmap(file, {
        resizeWidth: THUMB_MAX,
        resizeQuality: 'low',
      })
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(bitmap, 0, 0)
      bitmap.close()
      const blob = await new Promise<Blob | null>(res =>
        canvas.toBlob(res, 'image/jpeg', 0.6),
      )
      canvas.width = 0
      canvas.height = 0
      if (blob) {
        return URL.createObjectURL(blob)
      }
    } catch {
      // createImageBitmap非対応: フォールバック
    }
    return PLACEHOLDER_SVG
  }

  const processCompressQueue = async () => {
    if (compressing) return
    compressing = true

    const batchStart = performance.now()
    const batchCount = rawQueue.length
    const batchMode = rawQueue[0]?.lite ? 'lite' : 'advanced'
    const batchEntryIds: string[] = []  // C1: このバッチのentry IDを追跡

    if (isMobile.value) {
      // モバイル: 1枚完全完了してから次（メモリ保護）
      while (rawQueue.length > 0) {
        const item = rawQueue.shift()!

        // モバイル: デコードゼロ。SVGプレースホルダーで開始、サーバーレスポンスでサムネイル置換
        sendCheckpoint('entry作成', { file: item.file.name, size: item.file.size, remaining: rawQueue.length })
        const sendFile = item.file

        const entry: UploadEntry = {
          id: `f-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          documentId: generateUUID(),
          file: sendFile,
          fileName: item.file.name,
          fileSize: item.file.size,
          mimeType: item.file.type || 'application/octet-stream',
          previewUrl: isImageFile(item.file.name) ? PLACEHOLDER_SVG : getFileTypeThumbnail(item.file.name),
          previewUrlHQ: null,
          status: 'queued',
          errorReason: null,
          addedAt: Date.now(),
          completedAt: null,
          date: null,
          amount: null,
          vendor: null,
          supplementary: false,
          sourceType: null,
          lineItemsCount: 0,
          warning: null,
          metrics: null,
          lineItems: null,
          isDuplicate: false,
          documentCount: 1,
          hash: null,
          lite: item.lite ?? false,
          fileUrl: null,
        }
        batchEntryIds.push(entry.id)
        entries.value.push(entry)

        // processOneの完了を待つ（メモリに1枚分しか乗らない）
        await new Promise<void>(resolve => {
          const onComplete = () => {
            const e = entries.value.find(x => x.id === entry.id)
            if (e && e.status !== 'queued' && e.status !== 'uploading' && e.status !== 'analyzing') {
              resolve()
            } else {
              setTimeout(onComplete, 100)
            }
          }
          processOne(entry.id)
          setTimeout(onComplete, 100)
        })

        // GCに隙を与える（メモリ解放タイミング確保）
        await new Promise<void>(r => setTimeout(r, 50))
        await new Promise<void>(r => requestAnimationFrame(() => r()))
      }
    } else {
      // PC: 最大4並列で圧縮（メモリ余裕あり）
      const COMPRESS_CONCURRENCY = 4
      while (rawQueue.length > 0) {
        const batch = rawQueue.splice(0, COMPRESS_CONCURRENCY)
        sendCheckpoint('PC圧縮バッチ', { count: batch.length, remaining: rawQueue.length })
        const results = await Promise.all(batch.map(async item => {
          const compStart = performance.now()
          const compressed = await compressAndThumbnail(item.file)
          sendCheckpoint('PC圧縮完了', { file: item.file.name, compMs: Math.round(performance.now() - compStart) })
          return { ...compressed, lite: item.lite }
        }))
        pendingFiles.value.push(...results)
        processQueue()
        // C1: PC版ではprocessQueueでentryが作られるので、直後にIDを収集
        entries.value.forEach(e => {
          if (e.status === 'queued' || e.status === 'uploading' || e.status === 'analyzing') {
            if (!batchEntryIds.includes(e.id)) {
              batchEntryIds.push(e.id)
            }
          }
        })
        await new Promise<void>(r => requestAnimationFrame(() => r()))
      }

      // C2: このバッチのentry IDだけ完了を確認（前回テスト分の誤判定防止）
      if (batchEntryIds.length > 0) {
        await new Promise<void>(resolve => {
          const checkDone = () => {
            const processing = entries.value.filter(e =>
              batchEntryIds.includes(e.id)
              && (e.status === 'queued' || e.status === 'uploading' || e.status === 'analyzing'),
            )
            if (processing.length === 0) {
              resolve()
            } else {
              setTimeout(checkDone, 200)
            }
          }
          setTimeout(checkDone, 200)
        })
      }
    }

    const batchEnd = performance.now()
    const wallMs = Math.round(batchEnd - batchStart)
    console.log(`[batch完了] ${batchMode} ${batchCount}枚 壁時計=${wallMs}ms (${(wallMs/1000).toFixed(1)}秒)`)
    // バッチ壁時計メトリクスをサーバーに送信（UA+メモリ含む）
    fetch('/api/pipeline/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: `batch_${batchMode}`, fileName: `${batchCount}枚`, totalMs: wallMs, memMB: getMemoryMB(), ua: navigator.userAgent }),
    }).catch(() => {})

    compressing = false
  }

  // ===== ファイル追加（rawQueueに入れて即座に圧縮開始） =====
  const addFiles = (fileList: File[], opts?: { lite?: boolean }) => {
    const lite = opts?.lite ?? false
    sendCheckpoint('addFiles', { count: fileList.length, lite, device: device.value })
    rawQueue.push(...fileList.map(f => ({ file: f, lite })))
    processCompressQueue()
  }


  // ===== キュー処理（圧縮済みFileから1枚ずつentriesに追加→処理→完了→次） =====
  const processQueue = () => {
    const concurrency = isMobile.value ? CONCURRENCY_MOBILE : CONCURRENCY_PC
    const available = concurrency - counts.value.processing

    // 既にqueued状態のentriesがあれば先に処理
    const queuedEntries = entries.value.filter(e => e.status === 'queued')
    if (queuedEntries.length > 0) {
      queuedEntries.slice(0, available).forEach(e => processOne(e.id))
      return
    }

    if (available <= 0) return

    // pendingFiles（圧縮済み）から1枚取り出し → entry作成 → entries追加 → processOne
    const itemsToProcess = pendingFiles.value.splice(0, available)
    for (const item of itemsToProcess) {
      const entry: UploadEntry = {
        id: `f-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        documentId: generateUUID(),
        file: item.file,  // 送信用（圧縮無効時は元ファイル）
        fileName: item.originalName,
        fileSize: item.originalSize,
        mimeType: item.file.type || 'application/octet-stream',
        previewUrl: item.thumbnail,  // サムネイル（5KB程度。既に生成済み）
        previewUrlHQ: item.thumbnailHQ,  // PC用高解像度プレビュー（800px。モバイルではnull）
        status: 'queued',
        errorReason: null,
        addedAt: Date.now(),
        completedAt: null,
        date: null,
        amount: null,
        vendor: null,
        supplementary: false,
        sourceType: null,
        lineItemsCount: 0,
        warning: null,
        metrics: null,
        lineItems: null,
        isDuplicate: false,
        documentCount: 1,
        hash: null,
        lite: item.lite ?? false,
        fileUrl: null,
      }
      entries.value.push(entry)
      processOne(entry.id)
    }
  }

  const processOne = async (id: string) => {
    const e = entries.value.find(x => x.id === id)
    if (!e || !e.file) return

    const t0 = performance.now()
    // デバッグ情報（スマホ実機でも確認可能にする）
    const fileDebug = `[${e.file.name}] mime=${e.file.type || '(空)'} size=${e.file.size}`
    console.log(`[processOne開始] ${fileDebug} lite=${e.lite}`)

    e.status = 'uploading'

    // 軽量モード: setTimeoutスキップ（不要な待ちを排除）
    if (!e.lite) {
      await new Promise(res => setTimeout(res, 300 + Math.random() * 400))
    }

    // E1対策: 処理中に削除された場合はAPI呼び出しをスキップ（Geminiコスト節約）
    if (!entries.value.find(x => x.id === id)) {
      console.log(`[processOne中断] ${fileDebug} → 削除済み。API呼び出しスキップ`)
      return
    }

    // 軽量モード: AI分類スキップ。チャンクアップロード（512KB単位）でメモリスパイク防止。
    if (e.lite) {
      try {
        // チャンクアップロード（File.slice 512KB × N回。メモリに全体を乗せない）
        sendCheckpoint('chunk-upload前', { file: e.fileName, size: e.fileSize, chunks: Math.ceil(e.fileSize / CHUNK_SIZE) })
        const t1 = performance.now()
        const data = await uploadChunked(e.file, e.documentId, e.fileName, e.documentId, clientId)
        const t2 = performance.now()
        sendCheckpoint('chunk-upload後', { file: e.fileName, uploadMs: Math.round(t2-t1) })

        // サーバーから受信: ハッシュ、サムネイル、重複フラグ
        if (data.fileHash) {
          e.hash = data.fileHash
        }
        if (data.thumbnail) {
          e.previewUrl = data.thumbnail  // サーバー生成サムネイルで置換
        }
        e.isDuplicate = data.isDuplicate ?? false
        e.fileUrl = data.fileUrl ?? null
        // クライアント側でも既存entriesとの重複確認
        if (e.hash && !e.isDuplicate) {
          e.isDuplicate = entries.value.some(x => x.id !== e.id && x.hash === e.hash)
        }

        const tEnd = performance.now()
        console.log(`[processOne軽量] ${fileDebug} 合計=${(tEnd-t0).toFixed(0)}ms chunk-upload=${(t2-t1).toFixed(0)}ms dup=${e.isDuplicate}`)
        // メトリクス送信
        fetch('/api/pipeline/metrics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'lite-chunked', fileName: e.fileName, totalMs: Math.round(tEnd-t0), uploadMs: Math.round(t2-t1), isDuplicate: e.isDuplicate, memMB: getMemoryMB() }) }).catch(() => {})
      } catch (err) {
        console.warn(`[processOne軽量] エラー:`, err)
      }
      e.status = 'ok'
      e.completedAt = Date.now()
      e.file = null
      // fileUrlはサーバーに保存済みなので維持（送付時に使用）
      processQueue()
      return
    }

    try {
      e.status = 'analyzing'
      const tApi = performance.now()
      const result = await analyzeReceipt(e.file, { ...analyzeOpts.value, documentId: e.documentId })
      const tApiEnd = performance.now()

      console.log(`[processOne高度] ${fileDebug} 合計=${(tApiEnd-t0).toFixed(0)}ms API=${(tApiEnd-tApi).toFixed(0)}ms ok=${result.ok} supplementary=${result.supplementary ?? false}`)
      // メトリクス送信（メモリ含む）
      fetch('/api/pipeline/metrics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'advanced', fileName: e.fileName, totalMs: Math.round(tApiEnd-t0), apiMs: Math.round(tApiEnd-tApi), isDuplicate: false, memMB: getMemoryMB() }) }).catch(() => {})

      if (result.ok) {
        e.status = 'ok'
        e.date = result.date
        e.amount = result.amount
        e.vendor = result.vendor
        e.supplementary = result.supplementary ?? false
        e.sourceType = result.metrics?.source_type ?? null
        e.lineItemsCount = result.lineItems?.length ?? 0
        e.warning = result.warning ?? null
        e.metrics = result.metrics ?? null
        e.lineItems = result.lineItems ?? null
        e.isDuplicate = result.isDuplicate ?? false
        e.hash = result.fileHash ?? null
        e.documentCount = result.documentCount ?? 1
        e.fileUrl = result.fileUrl ?? null

        // 補助対象の場合、デバッグ用にerrorReasonにファイル情報を保存
        if (e.supplementary) {
          e.errorReason = `参照資料 ${fileDebug}`
        }
      } else {
        e.status = 'error'
        e.errorReason = result.errorReason
        e.sourceType = result.metrics?.source_type ?? null
        e.warning = result.warning ?? null
        e.metrics = result.metrics ?? null
        e.lineItems = null
        e.hash = result.fileHash ?? null
        e.fileUrl = result.fileUrl ?? null
      }
    } catch (err) {
      // API通信失敗・例外時（スマホで確認可能）
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[processOne例外] ${fileDebug} error=${msg}`)
      e.status = 'error'
      e.errorReason = `通信エラー: ${msg} ${fileDebug}`
    }

    // ★ 完了タイムスタンプ記録
    e.completedAt = Date.now()

    // ★ メモリ解放: 処理完了後にFile参照を削除（GC対象にする）
    e.file = null

    processQueue()
  }

  // ===== ファイル削除 =====
  /** ObjectURLの場合のみrevokeする（dataURL/nullは安全にスキップ） */
  const safeRevokeUrl = (url: string | null) => {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
  }

  const removeFile = (idOrIdx: number | string) => {
    // id（文字列）またはインデックス（数値）で削除
    const idx = typeof idOrIdx === 'string'
      ? entries.value.findIndex(e => e.id === idOrIdx)
      : idOrIdx
    const removed = entries.value[idx]
    if (removed) {
      safeRevokeUrl(removed.previewUrl)
      if (removed.id === selectedId.value) {
        safeRevokeUrl(selectedUrl.value)
        selectedId.value = null
        selectedUrl.value = null
      }
    }
    entries.value.splice(idx, 1)
  }

  // ===== プレビュー選択（PC用） =====
  const selectFile = (entry: UploadEntry) => {
    safeRevokeUrl(selectedUrl.value)
    selectedId.value = entry.id
    // 優先順: 元File(ObjectURL) → HQプレビュー(800px) → サムネイル(200px)
    if (entry.file) {
      selectedUrl.value = URL.createObjectURL(entry.file)
    } else {
      selectedUrl.value = entry.previewUrlHQ ?? entry.previewUrl
    }
  }

  // ===== 撮り直し（モバイル用） =====
  const triggerRetake = (idx: number) => {
    retakeTargetIdx.value = idx
  }

  const handleRetake = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file || retakeTargetIdx.value === null) return

    const idx = retakeTargetIdx.value
    const old = entries.value[idx]
    if (!old) return

    // サムネイル生成してからentryを更新（モバイル: 軽量版、PC: 従来版）
    const generateAndUpdate = async () => {
      let thumbUrl: string
      let sendFile: File
      let hqUrl: string | null = null
      if (isMobile.value) {
        // モバイル: createLightThumbnail（48MBデコード回避）
        thumbUrl = await createLightThumbnail(file)
        sendFile = file
      } else {
        // PC: 従来通り（HQプレビュー付き）
        const compressed = await compressAndThumbnail(file)
        thumbUrl = compressed.thumbnail
        hqUrl = compressed.thumbnailHQ
        sendFile = compressed.file
      }
      safeRevokeUrl(old.previewUrl)  // 旧サムネイルBlobURL解放
      entries.value[idx] = {
        id: old.id,
        documentId: generateUUID(),
        file: sendFile,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        previewUrl: thumbUrl,
        previewUrlHQ: hqUrl,
        status: 'queued',
        errorReason: null,
        addedAt: Date.now(),
        completedAt: null,
        date: null,
        amount: null,
        vendor: null,
        supplementary: false,
        sourceType: null,
        lineItemsCount: 0,
        warning: null,
        metrics: null,
        lineItems: null,
        isDuplicate: false,
        documentCount: 1,
        hash: null,
        lite: old.lite,
        fileUrl: null,
      }
      processQueue()
    }
    generateAndUpdate()

    retakeTargetIdx.value = null
    ;(e.target as HTMLInputElement).value = ''
  }

  // ===== 送付確定 =====
  const isConfirming = ref(false)
  const handleConfirm = async () => {
    if (!canConfirm.value || isConfirming.value) return
    isConfirming.value = true

    // OKもエラーも保存（AI判定は間違える可能性あり。選別画面で人間が最終判断）
    const okEntries = entries.value.filter(e => e.status === 'ok' || e.status === 'error')
    const docEntries: DocEntry[] = []

    // 全件選別画面用にdoc-storeに送付・保存（エラー含むので要否の判断必要）
    for (const e of okEntries) {
      docEntries.push({
        id: e.documentId,
        clientId,
        source: (role === 'guest' ? 'guest-upload' : 'staff-upload') as DocSource,
        fileName: e.fileName,
        fileType: e.mimeType,
        fileSize: e.fileSize,
        fileHash: e.hash,
        driveFileId: null,
        thumbnailUrl: e.fileUrl ? `${e.fileUrl}` : e.previewUrl,
        previewUrl: e.fileUrl || null,
        status: 'pending' as DocStatus,
        receivedAt: new Date(e.completedAt ?? Date.now()).toISOString(),
        batchId: null,
        journalId: null,
        createdBy: role === 'guest' ? 'guest' : useCurrentUser().currentStaffId.value,
        updatedBy: null,
        updatedAt: null,
        statusChangedBy: null,
        statusChangedAt: null,
        // AI分類結果（previewExtract APIで取得済みの場合に保持。軽量モード時はすべてnull）
        aiDate: e.date ?? null,
        aiAmount: e.amount ?? null,
        aiVendor: e.vendor ?? null,
        aiSourceType: e.sourceType ?? null,
        aiDirection: e.metrics?.direction ?? null,
        aiDescription: e.metrics?.description ?? null,
        aiPreviewExtractReason: e.metrics?.preview_extract_reason ?? null,
        aiLineItems: e.lineItems ?? null,
        aiLineItemsCount: e.lineItemsCount,
        aiSupplementary: e.supplementary,
        aiDocumentCount: e.documentCount ?? 1,
        aiWarning: e.warning ?? null,
        aiProcessingMode: e.metrics?.processing_mode ?? null,
        aiFallbackApplied: e.metrics?.fallback_applied ?? false,
        aiMetrics: e.metrics ? {
          source_type_confidence: e.metrics.source_type_confidence,
          direction_confidence: e.metrics.direction_confidence,
          duration_ms: e.metrics.duration_ms,
          prompt_tokens: e.metrics.prompt_tokens,
          completion_tokens: e.metrics.completion_tokens,
          thinking_tokens: e.metrics.thinking_tokens,
          token_count: e.metrics.token_count,
          cost_yen: e.metrics.cost_yen,
          model: e.metrics.model,
          original_size_kb: e.metrics.original_size_kb,
          processed_size_kb: e.metrics.processed_size_kb,
          preprocess_reduction_pct: e.metrics.preprocess_reduction_pct,
        } : null,
        // 重複検出フラグ（T-AUD-5: UploadEntry→DocEntry変換時にコピー）
        isDuplicate: e.isDuplicate,
      })
    }

    // 2. documentStoreにPOST（awaitでエラーを捕捉）
    try {
      const res = await fetch('/api/doc-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: docEntries }),
      })
      if (!res.ok) {
        console.error(`[useUpload] documentStore保存失敗: HTTP ${res.status}`)
        alert('データ保存に失敗しました。再度お試しください。')
        isConfirming.value = false
        return
      }
      const result = await res.json() as { added: number; skipped: number }
      console.log(`[useUpload] handleConfirm: サーバーに${result.added}件保存（重複${result.skipped}件スキップ）(role=${role})`)
    } catch (err) {
      console.error('[useUpload] documentStore保存エラー:', err)
      alert('データ保存に失敗しました。ネットワーク接続を確認してください。')
      isConfirming.value = false
      return
    }

    // 3. フロントのキャッシュを再取得
    const { refresh } = useDocuments()
    await refresh()

    isConfirming.value = false
    confirmedCount.value = counts.value.ok + counts.value.error
    showComplete.value = true
  }

  /** サーバー側の重複ハッシュ記録をクリア（DL-038） */
  const clearServerHashes = () => {
    fetch('/api/pipeline/hashes', { method: 'DELETE' }).catch(() => {
      // サーバー未起動時は無視（モックモードでは不要）
    })
  }

  const resetAll = () => {
    entries.value.forEach(e => URL.revokeObjectURL(e.previewUrl))
    entries.value = []
    showComplete.value = false
    selectedId.value = null
    if (selectedUrl.value) {
      URL.revokeObjectURL(selectedUrl.value)
      selectedUrl.value = null
    }
    clearServerHashes()
  }

  /** 画面遷移時のクリーンアップ（onBeforeUnmountで呼出） */
  const cleanup = () => {
    clearServerHashes()
  }

  /** completedAt降順ソート（最新の完了が上） */
  const byCompletedDesc = (a: UploadEntry, b: UploadEntry) =>
    (b.completedAt ?? 0) - (a.completedAt ?? 0)

  /** completedAt昇順ソート（古い完了が上。重複グループ内用） */
  const byCompletedAsc = (a: UploadEntry, b: UploadEntry) =>
    (a.completedAt ?? 0) - (b.completedAt ?? 0)

  /** addedAt昇順ソート（投入順） */
  const byAddedAsc = (a: UploadEntry, b: UploadEntry) =>
    a.addedAt - b.addedAt

  /**
   * 5ゾーンソート（表示用。元配列は変更しない）
   * ゾーン1: エラー含む重複グループ
   * ゾーン2: 単独エラー（重複なし）
   * ゾーン3: エラーなし重複グループ
   * ゾーン4: 全てのOK（画像/PDF/CSV/Excel混在。completedAt降順）
   * ゾーン5: 処理中（addedAt昇順=投入順固定）
   */
  const sortedEntries = computed(() => {
    // 完了済み（error/ok）と未完了を分離
    const done: UploadEntry[] = []
    const pending: UploadEntry[] = []
    for (const e of entries.value) {
      if (e.status === 'ok' || e.status === 'error') {
        done.push(e)
      } else {
        pending.push(e)
      }
    }

    // 1) ハッシュごとにグループ化
    const hashGroups = new Map<string, UploadEntry[]>()
    const noHashEntries: UploadEntry[] = []
    for (const e of done) {
      if (e.hash) {
        const group = hashGroups.get(e.hash) ?? []
        group.push(e)
        hashGroups.set(e.hash, group)
      } else {
        noHashEntries.push(e)
      }
    }

    // 2) 重複グループ（2件以上）を「エラー含む」「エラーなし」に分離
    const dupWithError: UploadEntry[][] = []   // ゾーン1
    const dupNoError: UploadEntry[][] = []     // ゾーン3
    const singleEntries: UploadEntry[] = []
    for (const [, group] of hashGroups) {
      if (group.length >= 2) {
        const hasError = group.some(e => e.status === 'error')
        if (hasError) {
          // グループ内: エラーを先頭、同ステータス内はcompletedAt昇順（古い順）
          const errors = group.filter(e => e.status === 'error').sort(byCompletedAsc)
          const oks = group.filter(e => e.status !== 'error').sort(byCompletedAsc)
          dupWithError.push([...errors, ...oks])
        } else {
          dupNoError.push(group.sort(byCompletedAsc))
        }
      } else {
        singleEntries.push(group[0]!)
      }
    }
    singleEntries.push(...noHashEntries)

    // 3) 単独エントリを分類
    const zone2Errors = singleEntries
      .filter(e => e.status === 'error')
      .sort(byCompletedDesc)              // ゾーン2: 単独エラー
    const zone4Oks = singleEntries
      .filter(e => e.status === 'ok')
      .sort(byCompletedDesc)              // ゾーン4: 全てのOK（supplementary含む）

    // 4) 重複グループ間の順序: 投入順昇順（グループ番号が若い順）
    const groupSortKey = (g: UploadEntry[]) =>
      Math.min(...g.map(e => e.addedAt))
    dupWithError.sort((a, b) => groupSortKey(a) - groupSortKey(b))
    dupNoError.sort((a, b) => groupSortKey(a) - groupSortKey(b))

    // 5) 5ゾーン結合
    const sorted: UploadEntry[] = [
      ...dupWithError.flat(),     // ゾーン1: エラー含む重複
      ...zone2Errors,             // ゾーン2: 単独エラー
      ...dupNoError.flat(),       // ゾーン3: エラーなし重複
      ...zone4Oks,                // ゾーン4: 全てのOK
    ]

    // ゾーン6: 処理中（addedAt昇順=投入順固定）
    pending.sort(byAddedAsc)

    return [...sorted, ...pending]
  })

  // メモリ解放（D: Blob URL全解放 + Worker終了）
  onBeforeUnmount(() => {
    entries.value.forEach(e => {
      safeRevokeUrl(e.previewUrl)
    })
    safeRevokeUrl(selectedUrl.value)
  })

  return {
    // 状態
    entries,
    sortedEntries,
    showComplete,
    confirmedCount,
    retakeTargetIdx,
    // プレビュー
    selectedId,
    selectedUrl,
    selectedEntry,
    selectFile,
    // 集計
    counts,
    progressPct,
    canConfirm,
    hasErrors,
    guideMessage,
    confirmLabel,
    pendingCount,
    totalSelected,
    // 操作
    addFiles,
    removeFile,
    triggerRetake,
    handleRetake,
    handleConfirm,
    resetAll,
    cleanup,
    // コンテキスト
    clientId,
    role,
    device,
    isMobile,
  }
}
