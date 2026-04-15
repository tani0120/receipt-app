/**
 * useUpload.ts — アップロード共通ロジック（PC/モバイル統合）
 *
 * 責務:
 *   - ファイル追加 / 削除 / 撮り直し
 *   - classify API呼出 + 結果マッピング
 *   - SHA-256重複チェック
 *   - スライディングウィンドウ（同時4件）
 *   - プレビュー選択
 *   - 送付確定 / リセット
 *   - PC/モバイル自動判定
 */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { analyzeReceipt, type ReceiptAnalysisResult, type AnalyzeOptions } from '@/mocks/services/receiptService'

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

// ===== composable本体 =====

const CONCURRENCY = 4
const MOBILE_BREAKPOINT = 768

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
  const knownHashes = ref<Set<string>>(new Set())
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
    entries.value.length > 0 && counts.value.ok === entries.value.length
  )

  const guideMessage = computed(() => {
    if (!entries.value.length) return ''
    if (counts.value.error > 0) return `${counts.value.error}件の不備があります。赤いカードをタップして撮り直してください`
    return ''
  })

  const confirmLabel = computed(() => {
    if (!entries.value.length) return '写真を選んでください'
    if (counts.value.processing || counts.value.queued) return `確認中... (${progressPct.value}%)`
    if (counts.value.error) return `不備を修正してください（${counts.value.error}件）`
    return `${counts.value.ok}枚を送付する`
  })

  // ===== ファイル追加 =====
  const addFiles = (fileList: File[]) => {
    const newEntries: UploadEntry[] = fileList.map(f => ({
      id: `f-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      documentId: crypto.randomUUID(),
      file: f,
      previewUrl: URL.createObjectURL(f),
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
    processQueue()
    // バックグラウンドでSHA-256ハッシュ計算
    newEntries.forEach(e => {
      const proxy = entries.value.find(x => x.id === e.id)
      if (proxy) computeHash(proxy)
    })
  }

  // ===== SHA-256 重複チェック =====
  const computeHash = async (item: UploadEntry) => {
    try {
      const buffer = await item.file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('')
      if (knownHashes.value.has(hashHex)) {
        item.isDuplicate = true
      } else {
        knownHashes.value.add(hashHex)
        item.hash = hashHex
      }
    } catch {
      // ハッシュ計算失敗は無視
    }
  }

  // ===== キュー処理 =====
  const processQueue = () => {
    const available = CONCURRENCY - counts.value.processing
    if (available <= 0) return
    entries.value
      .filter(e => e.status === 'queued')
      .slice(0, available)
      .forEach(e => processOne(e.id))
  }

  const processOne = async (id: string) => {
    const e = entries.value.find(x => x.id === id)
    if (!e) return

    e.status = 'uploading'
    await new Promise(res => setTimeout(res, 300 + Math.random() * 400))

    e.status = 'analyzing'
    const result = await analyzeReceipt(e.file, { ...analyzeOpts.value, documentId: e.documentId })

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
    } else {
      e.status = 'error'
      e.errorReason = result.errorReason
      e.sourceType = result.metrics?.source_type ?? null
      e.warning = result.warning ?? null
      e.metrics = result.metrics ?? null
      e.lineItems = null
    }

    processQueue()
  }

  // ===== ファイル削除 =====
  const removeFile = (idx: number) => {
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
      documentId: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
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

  const resetAll = () => {
    entries.value.forEach(e => URL.revokeObjectURL(e.previewUrl))
    entries.value = []
    knownHashes.value = new Set()
    showComplete.value = false
    selectedId.value = null
    if (selectedUrl.value) {
      URL.revokeObjectURL(selectedUrl.value)
      selectedUrl.value = null
    }
  }

  // メモリ解放
  onBeforeUnmount(() => {
    entries.value.forEach(e => URL.revokeObjectURL(e.previewUrl))
    if (selectedUrl.value) URL.revokeObjectURL(selectedUrl.value)
  })

  return {
    // 状態
    entries,
    isMobile,
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
    guideMessage,
    confirmLabel,
    // 操作
    addFiles,
    removeFile,
    triggerRetake,
    handleRetake,
    handleConfirm,
    resetAll,
    // コンテキスト
    clientId,
    role,
    device,
  }
}
