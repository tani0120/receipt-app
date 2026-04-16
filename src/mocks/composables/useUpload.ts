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
import { generatePdfThumbnail } from '@/mocks/utils/pdfThumbnail'
import { analyzeReceipt, type ReceiptAnalysisResult, type AnalyzeOptions } from '@/mocks/services/receiptService'
import { errorGuideMessage } from '@/shared/validationMessages'

// ===== 型定義（統一） =====

export type UploadStatus = 'queued' | 'uploading' | 'analyzing' | 'ok' | 'error'

export interface UploadEntry {
  id: string
  documentId: string   // 証票ID（crypto.randomUUID()。Supabase時はUUID PK）
  file: File
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
  }))

  const progressPct = computed(() =>
    entries.value.length === 0 ? 0
      : Math.round((counts.value.ok + counts.value.error) / entries.value.length * 100)
  )

  const canConfirm = computed(() =>
    entries.value.length > 0
    && counts.value.processing === 0
    && counts.value.queued === 0
  )

  /** エラーが1件以上ある（送付は可能だが警告表示用） */
  const hasErrors = computed(() => counts.value.error > 0)

  const guideMessage = computed(() => {
    if (!entries.value.length) return ''
    if (counts.value.error > 0) return errorGuideMessage(counts.value.error)
    return ''
  })

  const confirmLabel = computed(() => {
    if (!entries.value.length) return '写真を選んでください'
    if (counts.value.processing || counts.value.queued) return `アップロード中... (${progressPct.value}%)`
    if (counts.value.error) return `${entries.value.length}枚を送付する（${counts.value.error}件エラーあり）`
    return `${counts.value.ok}枚を送付する`
  })

  // ===== サムネイル生成（画像をcanvasで縮小。メモリ節約） =====
  const THUMB_MAX = 200 // サムネイル最大幅/高さ（px）
  const generateImageThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        // 縮小率計算
        const scale = Math.min(THUMB_MAX / img.width, THUMB_MAX / img.height, 1)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
          // メモリ解放（BlobURL + canvas + Image）
          URL.revokeObjectURL(url)
          canvas.width = 0
          canvas.height = 0
          resolve(dataUrl)
        } else {
          resolve(url)
        }
      }
      img.onerror = () => {
        resolve(url)
      }
      img.src = url
    })
  }

  // サムネイル生成キュー（複数回addFilesでも同時に1枚だけデコード）
  const thumbQueue: Array<{ entry: UploadEntry; file: File }> = []
  let thumbProcessing = false
  const processThumbnailQueue = async () => {
    if (thumbProcessing) return // 既に処理中なら何もしない（前の処理が完了すれば自動で次へ）
    thumbProcessing = true
    while (thumbQueue.length > 0) {
      const item = thumbQueue.shift()!
      if (item.file.type === 'application/pdf') {
        try {
          item.entry.previewUrl = await generatePdfThumbnail(item.file)
        } catch {
          item.entry.previewUrl = PDF_FALLBACK
        }
      } else if (item.file.type.startsWith('image/')) {
        try {
          item.entry.previewUrl = await generateImageThumbnail(item.file)
        } catch {
          // fallbackはプレースホルダーのまま
        }
      }
    }
    thumbProcessing = false
  }

  const PDF_FALLBACK = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" fill="none">'
    + '<rect width="120" height="160" fill="#f1f5f9"/>'
    + '<text x="60" y="70" text-anchor="middle" font-size="40">📄</text>'
    + '<text x="60" y="100" text-anchor="middle" font-size="16" font-weight="bold" fill="#dc2626">PDF</text>'
    + '</svg>',
  )

  // プレースホルダーSVG（サムネイル生成中の表示用）
  const PLACEHOLDER_SVG = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" fill="none">'
    + '<rect width="120" height="160" fill="#f1f5f9"/>'
    + '<text x="60" y="85" text-anchor="middle" font-size="14" fill="#94a3b8">読込中...</text>'
    + '</svg>',
  )

  // ===== ファイル追加 =====
  const addFiles = (fileList: File[]) => {
    const newEntries: UploadEntry[] = fileList.map(f => ({
      id: `f-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      documentId: generateUUID(),
      file: f,
      previewUrl: PLACEHOLDER_SVG, // 初期表示はプレースホルダー（メモリ節約）
      status: 'queued' as const,
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
    }))
    entries.value.push(...newEntries)

    // サムネイルキューに追加（同時デコードは常に1枚）
    for (const entry of newEntries) {
      thumbQueue.push({ entry, file: entry.file })
    }
    processThumbnailQueue() // キュー処理開始（既に処理中なら何もしない）

    processQueue()
  }


  // ===== キュー処理 =====
  const processQueue = () => {
    const concurrency = isMobile.value ? CONCURRENCY_MOBILE : CONCURRENCY_PC
    const available = concurrency - counts.value.processing
    if (available <= 0) return
    entries.value
      .filter(e => e.status === 'queued')
      .slice(0, available)
      .forEach(e => processOne(e.id))
  }

  const processOne = async (id: string) => {
    const e = entries.value.find(x => x.id === id)
    if (!e) return

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
    selectedUrl.value = URL.createObjectURL(entry.file)
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
    URL.revokeObjectURL(old.previewUrl)

    entries.value[idx] = {
      id: old.id,
      documentId: generateUUID(),
      file,
      previewUrl: PLACEHOLDER_SVG, // サムネイル生成は非同期
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

    // 撮り直しファイルのサムネイルをキューに追加
    const newEntry = entries.value[idx]
    if (newEntry) {
      thumbQueue.push({ entry: newEntry, file })
      processThumbnailQueue()
    }

    retakeTargetIdx.value = null
    ;(e.target as HTMLInputElement).value = ''
    processQueue()
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
  }
}
