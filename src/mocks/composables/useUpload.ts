/**
 * useUpload.ts — アップロード共通ロジック（PC/モバイル統合）
 *
 * 責務:
 *   - ファイル追加 / 削除 / 撮り直し
 *   - classify API呼出 + 結果マッピング
 *   - classify API呼出 + 結果マッピング（重複チェック含む）
 *   - スライディングウィンドウ（同時4件）
 *   - プレビュー選択
 *   - 送付確定 / リセット
 *   - PC/モバイル自動判定
 */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { analyzeReceipt, type ReceiptAnalysisResult, type AnalyzeOptions } from '@/mocks/services/receiptService'
import { errorGuideMessage } from '@/shared/validationMessages'

// ===== 型定義（統一） =====

export type UploadStatus = 'queued' | 'uploading' | 'analyzing' | 'ok' | 'error'

export interface UploadEntry {
  id: string
  documentId: string   // 証票ID（crypto.randomUUID()。Supabase時はUUID PK）
  file: File | null  // 処理完了後はnull（メモリ解放）
  fileName: string   // ファイル名（file解放後もテンプレートから参照可能）
  fileSize: number   // ファイルサイズ（file解放後もテンプレートから参照可能）
  previewUrl: string
  status: UploadStatus
  errorReason: string | null
  // classify結果
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
}

// ===== ラベル定義 =====

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  receipt: '領収書', invoice_received: '請求書', tax_payment: '納付書',
  journal_voucher: '振替伝票', bank_statement: '通帳', credit_card: 'クレカ明細',
  cash_ledger: '現金出納帳', invoice_issued: '発行請求書', receipt_issued: '発行領収書',
  non_journal: '仕訳対象外', supplementary_doc: '補助資料', other: 'その他',
}

// ===== ユーティリティ =====

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

export const fileIconClass = (name: string): string => {
  if (isPdfFile(name)) return 'file-icon--doc'
  if (isImageFile(name)) return 'file-icon--img'
  if (/\.(csv|xlsx?)$/i.test(name)) return 'file-icon--csv'
  return 'file-icon--img'
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

// ===== composable本体 =====

const CONCURRENCY_PC = 4      // PC（641px以上）同時処理数
const CONCURRENCY_MOBILE = 1   // モバイル: 1枚ずつ処理（メモリ不足クラッシュ防止）
const MOBILE_BREAKPOINT = 640

export function useUpload() {
  const route = useRoute()
  const clientId = route.params.clientId as string

  // route.nameから権限（role）・端末（device）を導出
  const role = String(route.name ?? '').toLowerCase().includes('guest') ? 'guest' : 'staff'

  // デバイスは画面幅から自動判定
  const isMobile = ref(window.innerWidth < MOBILE_BREAKPOINT)
  const device = computed(() => isMobile.value ? 'mobile' : 'pc')
  const analyzeOpts = computed<AnalyzeOptions>(() => ({
    clientId, role, device: device.value,
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

  // ===== 画像圧縮 + サムネイル同時生成（1回のデコードで両方作る） =====
  const COMPRESS_MAX_WIDTH = 1280  // 圧縮後の最大幅（サーバーのpreprocessと同等）
  const COMPRESS_QUALITY = 0.8     // JPEG品質
  const THUMB_MAX = 200            // サムネイル最大幅/高さ

  interface CompressedFile {
    file: File          // 圧縮済みFile（200KB程度）
    thumbnail: string   // サムネイルdataURL（5KB程度）
    originalName: string
    originalSize: number
  }

  /** 画像を圧縮 + サムネイル同時生成。createImageBitmapでメモリ効率的にリサイズ */
  const compressAndThumbnail = async (file: File): Promise<CompressedFile> => {
    // 画像以外はそのまま
    if (!file.type.startsWith('image/')) {
      return {
        file,
        thumbnail: file.type === 'application/pdf' ? PDF_FALLBACK : PLACEHOLDER_SVG,
        originalName: file.name,
        originalSize: file.size,
      }
    }

    try {
      // ① 圧縮用bitmap（1280px幅にリサイズ済みでデコード → 48MBではなく5MB）
      const compressBitmap = await createImageBitmap(file, {
        resizeWidth: Math.min(COMPRESS_MAX_WIDTH, 4000), // 元画像がCOMPRESS_MAX_WIDTH未満でもOK
        resizeQuality: 'medium',
      })
      const cw = compressBitmap.width
      const ch = compressBitmap.height

      // 圧縮用canvas
      const compressCanvas = document.createElement('canvas')
      compressCanvas.width = cw
      compressCanvas.height = ch
      const cctx = compressCanvas.getContext('2d')!
      cctx.drawImage(compressBitmap, 0, 0)
      compressBitmap.close() // ★ 即時メモリ解放（GC不要）

      // ② サムネイル用canvas（圧縮canvasから縮小描画。追加デコードなし）
      const thumbScale = Math.min(THUMB_MAX / cw, THUMB_MAX / ch, 1)
      const tw = Math.round(cw * thumbScale)
      const th = Math.round(ch * thumbScale)
      const thumbCanvas = document.createElement('canvas')
      thumbCanvas.width = tw
      thumbCanvas.height = th
      const tctx = thumbCanvas.getContext('2d')!
      tctx.drawImage(compressCanvas, 0, 0, tw, th) // compressCanvasから縮小（追加デコードなし）
      const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.7)
      thumbCanvas.width = 0
      thumbCanvas.height = 0

      // ③ 圧縮Blob生成
      const blob = await new Promise<Blob | null>(res =>
        compressCanvas.toBlob(res, 'image/jpeg', COMPRESS_QUALITY),
      )
      compressCanvas.width = 0
      compressCanvas.height = 0

      if (blob) {
        const compressed = new File([blob], file.name, { type: 'image/jpeg' })
        console.log(`[圧縮] ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB (${Math.round(100 - (compressed.size / file.size) * 100)}%削減)`)
        return { file: compressed, thumbnail, originalName: file.name, originalSize: file.size }
      }
      return { file, thumbnail, originalName: file.name, originalSize: file.size }
    } catch {
      // createImageBitmap非対応環境のfallback
      return { file, thumbnail: PLACEHOLDER_SVG, originalName: file.name, originalSize: file.size }
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
  const rawQueue: File[] = []    // 未圧縮の元File（一時的に保持）
  let compressing = false
  const pendingFiles = ref<CompressedFile[]>([])  // 圧縮済み（軽量）
  const pendingCount = computed(() => pendingFiles.value.length + rawQueue.length)
  const totalSelected = computed(() => entries.value.length + pendingFiles.value.length + rawQueue.length)

  const processCompressQueue = async () => {
    if (compressing) return
    compressing = true
    while (rawQueue.length > 0) {
      const file = rawQueue.shift()!  // 元Fileをキューから取り出し（参照解放）
      const compressed = await compressAndThumbnail(file)
      pendingFiles.value.push(compressed)
      processQueue()  // 圧縮完了ごとにprocessQueueを呼ぶ
      // ★ ブレーキ: ブラウザの描画フレームに同期（DOM更新の反映を保証）
      await new Promise<void>(r => requestAnimationFrame(() => r()))
    }
    compressing = false
  }

  // ===== ファイル追加（rawQueueに入れて即座に圧縮開始） =====
  const addFiles = (fileList: File[]) => {
    rawQueue.push(...fileList)
    processCompressQueue()  // 1枚ずつ圧縮 → 元File即解放
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
        file: item.file,  // 圧縮済み（200KB程度）
        fileName: item.originalName,
        fileSize: item.originalSize,
        previewUrl: item.thumbnail,  // サムネイル（5KB程度。既に生成済み）
        status: 'queued',
        errorReason: null,
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
        hash: null,
      }
      entries.value.push(entry)
      processOne(entry.id)
    }
  }

  const processOne = async (id: string) => {
    const e = entries.value.find(x => x.id === id)
    if (!e || !e.file) return

    // デバッグ情報（スマホ実機でも確認可能にする）
    const fileDebug = `[${e.file.name}] mime=${e.file.type || '(空)'} size=${e.file.size}`
    console.log(`[processOne開始] ${fileDebug}`)

    e.status = 'uploading'
    await new Promise(res => setTimeout(res, 300 + Math.random() * 400))

    try {
      e.status = 'analyzing'
      const result = await analyzeReceipt(e.file, { ...analyzeOpts.value, documentId: e.documentId })

      console.log(`[processOne完了] ${fileDebug} ok=${result.ok} supplementary=${result.supplementary ?? false}`)

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
      }
    } catch (err) {
      // API通信失敗・例外時（スマホで確認可能）
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[processOne例外] ${fileDebug} error=${msg}`)
      e.status = 'error'
      e.errorReason = `通信エラー: ${msg} ${fileDebug}`
    }

    // ★ メモリ解放: 処理完了後にFile参照を削除（GC対象にする）
    e.file = null

    processQueue()
  }

  // ===== ファイル削除 =====
  const removeFile = (idOrIdx: number | string) => {
    // id（文字列）またはインデックス（数値）で削除
    const idx = typeof idOrIdx === 'string'
      ? entries.value.findIndex(e => e.id === idOrIdx)
      : idOrIdx
    const removed = entries.value[idx]
    if (removed) {
      URL.revokeObjectURL(removed.previewUrl)
      if (removed.id === selectedId.value) {
        if (selectedUrl.value) URL.revokeObjectURL(selectedUrl.value)
        selectedId.value = null
        selectedUrl.value = null
      }
    }
    entries.value.splice(idx, 1)
  }

  // ===== プレビュー選択（PC用） =====
  const selectFile = (entry: UploadEntry) => {
    if (selectedUrl.value) URL.revokeObjectURL(selectedUrl.value)
    selectedId.value = entry.id
    // 処理完了後はfileがnull → サムネイルを拡大表示に使用
    selectedUrl.value = entry.file ? URL.createObjectURL(entry.file) : entry.previewUrl
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

    // 圧縮+サムネイル生成してからentryを更新
    compressAndThumbnail(file).then(compressed => {
      entries.value[idx] = {
        id: old.id,
        documentId: generateUUID(),
        file: compressed.file,
        fileName: compressed.originalName,
        fileSize: compressed.originalSize,
        previewUrl: compressed.thumbnail,
        status: 'queued',
        errorReason: null,
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
        hash: null,
      }
      processQueue()
    })

    retakeTargetIdx.value = null
    ;(e.target as HTMLInputElement).value = ''
  }

  // ===== 送付確定 =====
  const handleConfirm = () => {
    if (!canConfirm.value) return
    confirmedCount.value = counts.value.ok
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

  // 完了済みのみソート + 未完了は末尾に追加順固定（表示用。元配列は変更しない）
  const sortedEntries = computed(() => {
    // 完了済み（error/ok）と未完了（queued/uploading/analyzing）を分離
    const done: UploadEntry[] = []
    const pending: UploadEntry[] = []
    for (const e of entries.value) {
      if (e.status === 'ok' || e.status === 'error') {
        done.push(e)
      } else {
        pending.push(e) // 追加順のまま
      }
    }

    // 完了済みのみソート: エラー → 重複グループ（親→子・昇順） → OK
    // 1) ハッシュごとにグループ化（出現順＝アップロード順を維持）
    const hashGroups = new Map<string, UploadEntry[]>()
    const noHashEntries: UploadEntry[] = []
    for (const e of done) {
      if (e.hash) {
        const group = hashGroups.get(e.hash) ?? []
        group.push(e) // 出現順（=アップロード順＝昇順）を維持
        hashGroups.set(e.hash, group)
      } else {
        noHashEntries.push(e)
      }
    }

    // 2) 重複グループ（2件以上の同一hash）と非重複を分離
    const duplicateGroups: UploadEntry[][] = []
    const singleEntries: UploadEntry[] = []
    for (const [, group] of hashGroups) {
      if (group.length >= 2) {
        duplicateGroups.push(group) // グループ内は既に昇順
      } else {
        singleEntries.push(group[0]!)
      }
    }
    singleEntries.push(...noHashEntries)

    // 3) エラー → 重複グループ（親→子・昇順） → OK の順で結合
    const errors = singleEntries.filter(e => e.status === 'error')
    const oks = singleEntries.filter(e => e.status === 'ok')

    const sorted: UploadEntry[] = [
      ...errors,
      ...duplicateGroups.flat(), // 各グループ内は親（最初）→子（後続）の昇順
      ...oks,
    ]

    // 完了済み（ソート済み） + 未完了（追加順固定）
    return [...sorted, ...pending]
  })

  // メモリ解放
  onBeforeUnmount(() => {
    entries.value.forEach(e => URL.revokeObjectURL(e.previewUrl))
    if (selectedUrl.value) URL.revokeObjectURL(selectedUrl.value)
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
