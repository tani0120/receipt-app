<template>
  <div class="h-full overflow-y-auto bg-slate-100 flex flex-col" style="font-family: 'Noto Sans JP', sans-serif">

    <!-- ===== ヘッダー ===== -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
      <div class="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h1 class="text-[15px] font-bold text-gray-800 leading-tight">📄 領収書を送る</h1>
          <p class="text-[11px] text-gray-400 mt-0.5 truncate">{{ clientId }} ／ {{ monthLabel }}</p>
        </div>
        <!-- バッジ集計 -->
        <div class="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          <span v-if="counts.ok"
            class="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
            ✓ {{ counts.ok }}
          </span>
          <span v-if="counts.error"
            class="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
            ✗ {{ counts.error }}
          </span>
          <span v-if="counts.processing"
            class="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full animate-pulse">
            ⏳ {{ counts.processing }}
          </span>
          <span v-if="receipts.length"
            class="text-[10px] text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">
            計 {{ receipts.length }} 枚
          </span>
        </div>
      </div>
    </header>

    <!-- ===== メインコンテンツ ===== -->
    <main class="flex-1 max-w-2xl mx-auto w-full px-3 py-4 pb-40">

      <!-- 空の状態 -->
      <div
        v-if="receipts.length === 0"
        class="mt-10 flex flex-col items-center"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <!-- ドロップゾーン -->
        <div
          :class="[
            'w-full max-w-sm border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-200 cursor-pointer select-none',
            isDragging
              ? 'border-blue-400 bg-blue-50 scale-[1.02]'
              : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'
          ]"
          @click="openFilePicker()"
        >
          <div class="text-6xl mb-4 leading-none">📸</div>
          <p class="text-[16px] font-bold text-gray-700">写真を選ぶ</p>
          <p class="text-[12px] text-gray-400 mt-2 leading-relaxed">
            タップして選択<br class="sm:hidden">
            <span class="hidden sm:inline"> または </span>
            <span class="sm:hidden"> / </span>ドラッグ&ドロップ
          </p>
          <div class="mt-6 flex gap-3 justify-center">
            <button
              class="flex items-center gap-2 bg-blue-600 text-white text-[13px] font-bold py-3 px-5 rounded-2xl shadow-md hover:bg-blue-700 active:scale-95 transition-transform"
              @click.stop="openCameraPicker()"
            >
              📷 今撮る
            </button>
            <button
              class="flex items-center gap-2 bg-white text-blue-600 border-2 border-blue-600 text-[13px] font-bold py-3 px-5 rounded-2xl hover:bg-blue-50 active:scale-95 transition-all"
              @click.stop="openFilePicker()"
            >
              🖼 選んで送る
            </button>
          </div>
        </div>
        <p class="mt-5 text-[11px] text-gray-400 text-center leading-relaxed">
          200枚まで一括送信できます<br>
          <span class="text-gray-300">JPEG / PNG / HEIC / WebP 対応</span>
        </p>

        <!-- 説明カード -->
        <div class="mt-8 w-full max-w-sm space-y-3">
          <div v-for="item in howToItems" :key="item.step"
            class="flex items-start gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm">
            <span class="text-xl mt-0.5 flex-shrink-0">{{ item.icon }}</span>
            <div>
              <p class="text-[12px] font-bold text-gray-700">{{ item.title }}</p>
              <p class="text-[11px] text-gray-400 mt-0.5">{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- カードグリッド（枚数あり） -->
      <div v-else>

        <!-- 進捗バー -->
        <div class="mb-4 bg-white rounded-2xl px-4 py-3 shadow-sm">
          <div class="flex justify-between text-[11px] text-gray-500 mb-2">
            <span class="font-semibold">処理の進捗</span>
            <span>{{ counts.ok + counts.error }} / {{ receipts.length }} 件完了</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              class="h-2 rounded-full transition-all duration-700 ease-out"
              :class="counts.error > 0 ? 'bg-amber-400' : 'bg-emerald-500'"
              :style="{ width: `${progressPct}%` }"
            ></div>
          </div>
          <div class="flex gap-3 mt-2 text-[10px]">
            <span class="text-emerald-600">✅ OK: {{ counts.ok }}</span>
            <span v-if="counts.error" class="text-red-500">❌ NG: {{ counts.error }}</span>
            <span v-if="counts.processing" class="text-amber-500 animate-pulse">⏳ 処理中: {{ counts.processing }}</span>
            <span v-if="counts.queued" class="text-gray-400">待機: {{ counts.queued }}</span>
          </div>
        </div>

        <!-- グリッド -->
        <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">

          <!-- 各カード -->
          <div
            v-for="(r, idx) in receipts"
            :key="r.id"
            :class="[
              'relative rounded-2xl overflow-hidden bg-white border-2 transition-all duration-300 select-none',
              r.status === 'error'
                ? 'border-red-400 shadow-lg shadow-red-100 cursor-pointer active:scale-95'
                : r.status === 'ok'
                  ? 'border-emerald-400 shadow-sm'
                  : 'border-gray-200 shadow-sm'
            ]"
            @click="r.status === 'error' ? triggerRetake(idx) : undefined"
          >
            <!-- プレビュー画像 -->
            <div class="aspect-[3/4] relative bg-gray-100">
              <img
                :src="r.previewUrl"
                :alt="`領収書 ${idx + 1}`"
                class="w-full h-full object-cover"
                loading="lazy"
              />

              <!-- オーバーレイ: 待機中 -->
              <div v-if="r.status === 'queued'"
                class="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                <span class="text-[11px] text-white/80">待機中</span>
              </div>

              <!-- オーバーレイ: 処理中 -->
              <div v-if="r.status === 'uploading' || r.status === 'analyzing'"
                class="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1.5">
                <div class="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span class="text-[9px] text-white font-semibold">
                  {{ r.status === 'uploading' ? '送信中...' : 'AI確認中...' }}
                </span>
              </div>

              <!-- オーバーレイ: OK -->
              <div v-if="r.status === 'ok'"
                class="absolute top-1 right-1">
                <span class="text-lg drop-shadow">✅</span>
              </div>

              <!-- オーバーレイ: 重複警告 -->
              <div v-if="r.isDuplicate"
                class="absolute top-0 left-0 right-0 bg-amber-500/90 px-1 py-0.5 flex items-center justify-center">
                <span class="text-[8px] text-white font-bold">⚠ 重複の可能性</span>
              </div>

              <!-- オーバーレイ: エラー -->
              <div v-if="r.status === 'error'"
                class="absolute inset-0 bg-red-600/75 flex flex-col items-center justify-center p-2 gap-1">
                <span class="text-2xl">📷</span>
                <span class="text-white text-[8px] font-bold text-center leading-snug">
                  {{ r.errorReason }}
                </span>
                <span class="text-[8px] bg-white/30 text-white px-2 py-0.5 rounded-full mt-0.5">
                  タップで撮り直し
                </span>
              </div>
            </div>

            <!-- カード下部 -->
            <div class="px-1.5 py-1.5">
              <template v-if="r.status === 'ok'">
                <p class="text-[8px] text-emerald-700 font-bold truncate">{{ r.vendor }}</p>
                <p class="text-[8px] text-emerald-600">¥{{ r.amount?.toLocaleString() }}</p>
                <p class="text-[7px] text-gray-400">{{ r.date }}</p>
              </template>
              <template v-else>
                <p class="text-[8px] text-gray-300">{{ idx + 1 }}</p>
              </template>
            </div>
          </div>

          <!-- 追加ボタン（撮る/選ぶ の2択） -->
          <div class="aspect-[3/4] border-2 border-dashed border-gray-300 rounded-2xl bg-white flex flex-col items-center justify-center gap-2 select-none">
            <button
              class="flex flex-col items-center gap-0.5 text-gray-400 hover:text-blue-500 active:scale-95 transition-all p-2 rounded-xl"
              @click.stop="openCameraPicker()"
            >
              <span class="text-2xl leading-none">📷</span>
              <span class="text-[8px] font-semibold">撮る</span>
            </button>
            <div class="w-8 border-t border-gray-200"></div>
            <button
              class="flex flex-col items-center gap-0.5 text-gray-400 hover:text-blue-500 active:scale-95 transition-all p-2 rounded-xl"
              @click.stop="openFilePicker()"
            >
              <span class="text-2xl leading-none">🖼</span>
              <span class="text-[8px] font-semibold">選ぶ</span>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- ===== 底部固定エリア ===== -->
    <footer class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div class="max-w-2xl mx-auto">

        <!-- ガイドメッセージ -->
        <transition name="fade">
          <p v-if="guideMessage"
            class="text-[11px] text-center font-semibold mb-2 text-red-500">
            ⚠ {{ guideMessage }}
          </p>
          <p v-else-if="counts.processing"
            class="text-[11px] text-center text-amber-600 mb-2 animate-pulse">
            AIが確認しています。しばらくお待ちください...
          </p>
          <p v-else-if="canConfirm && receipts.length"
            class="text-[11px] text-center text-emerald-600 font-semibold mb-2">
            全件確認完了！送付できます ✅
          </p>
        </transition>

        <!-- 確定ボタン -->
        <button
          :disabled="!canConfirm"
          :class="[
            'w-full py-4 rounded-2xl text-[15px] font-bold transition-all duration-300',
            canConfirm
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 active:scale-95 hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          ]"
          @click="handleConfirm"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </footer>

    <!-- ===== 完了モーダル ===== -->
    <transition name="modal">
      <div v-if="showComplete"
        class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
        @click.self="showComplete = false">
        <div class="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
          <div class="text-6xl mb-4">🎉</div>
          <h2 class="text-[18px] font-bold text-gray-800 mb-2">送付完了！</h2>
          <p class="text-[13px] text-gray-500 mb-2">
            <span class="font-bold text-blue-600">{{ confirmedCount }}枚</span> の領収書を受け付けました。
          </p>
          <p class="text-[11px] text-gray-400 mb-6">
            確認後、担当者よりご連絡します。
          </p>
          <button
            class="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform"
            @click="resetAll"
          >
            続けて送る
          </button>
        </div>
      </div>
    </transition>

    <!-- 隠し input: 複数選択（アルバム/ファイル選択） -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*,.pdf"
      multiple
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- 隠し input: カメラ直接起動（背面カメラ・1枚ずつ） -->
    <input
      ref="cameraInputRef"
      type="file"
      accept="image/*"
      capture="environment"
      class="hidden"
      @change="handleCameraCapture"
    />

    <!-- 隠し input: 撮り直し（1枚） -->
    <input
      ref="retakeInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleRetake"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { analyzeReceipt, type AnalyzeOptions } from '@/mocks/services/receiptService'

// ===== ルート =====
const route = useRoute()
const clientId = route.params.clientId as string
// route.nameから権限（role）・端末（device）を導出
const role = String(route.name ?? '').toLowerCase().includes('guest') ? 'guest' : 'staff'
const device = String(route.name ?? '').toLowerCase().includes('mobile') ? 'mobile' : 'pc'
const analyzeOpts: AnalyzeOptions = { clientId, role, device }
const monthLabel = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }) + 'の領収書'

// ===== 型 =====
type ReceiptStatus = 'queued' | 'uploading' | 'analyzing' | 'ok' | 'error'

interface ReceiptItem {
  id: string
  documentId: string   // 証票ID（crypto.randomUUID()。Supabase時はUUID PK）
  file: File
  previewUrl: string
  status: ReceiptStatus
  errorReason: string | null
  date: string | null
  amount: number | null
  vendor: string | null
  isDuplicate: boolean
  hash: string | null
}

// ===== 状態 =====
const receipts       = ref<ReceiptItem[]>([])
const fileInputRef   = ref<HTMLInputElement>()
const cameraInputRef = ref<HTMLInputElement>()
const retakeInputRef = ref<HTMLInputElement>()
const retakeTargetIdx = ref<number | null>(null)
const isDragging     = ref(false)
const showComplete   = ref(false)
const confirmedCount = ref(0)
const knownHashes    = ref<Set<string>>(new Set())

const CONCURRENCY = 4

// ===== 説明カード =====
const howToItems = [
  { step: 1, icon: '📸', title: '写真を選ぶ', desc: 'カメラロールから複数まとめて選択できます' },
  { step: 2, icon: '🤖', title: '自動チェック', desc: 'AIが日付・金額・店名を確認します（約2秒/枚）' },
  { step: 3, icon: '📷', title: '不備は撮り直し', desc: '赤いカードをタップして再撮影するだけ' },
  { step: 4, icon: '✅', title: '全件OKで送付', desc: '緑になったら「送付する」ボタンを押して完了' },
]

// ===== 集計 =====
const counts = computed(() => ({
  ok:         receipts.value.filter(r => r.status === 'ok').length,
  error:      receipts.value.filter(r => r.status === 'error').length,
  processing: receipts.value.filter(r => r.status === 'uploading' || r.status === 'analyzing').length,
  queued:     receipts.value.filter(r => r.status === 'queued').length,
}))

const progressPct = computed(() =>
  receipts.value.length === 0 ? 0
    : Math.round((counts.value.ok + counts.value.error) / receipts.value.length * 100)
)

const canConfirm = computed(() =>
  receipts.value.length > 0 &&
  counts.value.ok === receipts.value.length
)

const guideMessage = computed(() => {
  if (!receipts.value.length) return ''
  if (counts.value.error > 0) return `${counts.value.error}件の不備があります。赤いカードをタップして撮り直してください`
  return ''
})

const confirmLabel = computed(() => {
  if (!receipts.value.length) return '写真を選んでください'
  if (counts.value.processing || counts.value.queued) return `確認中... (${progressPct.value}%)`
  if (counts.value.error) return `不備を修正してください（${counts.value.error}件）`
  return `${counts.value.ok}枚を送付する`
})

// ===== ファイル選択 =====
const openFilePicker  = () => fileInputRef.value?.click()
const openCameraPicker = () => cameraInputRef.value?.click()

const handleFileSelect = (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  if (files.length) addFiles(files)
  ;(e.target as HTMLInputElement).value = ''
}

const handleCameraCapture = (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  if (files.length) addFiles(files)
  ;(e.target as HTMLInputElement).value = ''
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files ?? []).filter(
    f => f.type.startsWith('image/') || f.type === 'application/pdf'
  )
  if (files.length) addFiles(files)
}

const addFiles = (files: File[]) => {
  const newItems: ReceiptItem[] = files.map(file => ({
    id: `r-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    documentId: crypto.randomUUID(),
    file,
    previewUrl: URL.createObjectURL(file),
    status: 'queued',
    errorReason: null,
    date: null,
    amount: null,
    vendor: null,
    isDuplicate: false,
    hash: null,
  }))
  receipts.value.push(...newItems)
  processQueue()
  // バックグラウンドでSHA-256ハッシュ計算（アップロードと並列・干渉しない）
  newItems.forEach(item => computeHash(item))
}

// ===== SHA-256 重複チェック =====
const computeHash = async (item: ReceiptItem) => {
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
    // ハッシュ計算失敗は無視（処理を止めない）
  }
}

// ===== キュー処理（スライディングウィンドウ） =====
const processQueue = () => {
  const available = CONCURRENCY - counts.value.processing
  if (available <= 0) return
  receipts.value
    .filter(r => r.status === 'queued')
    .slice(0, available)
    .forEach(r => processOne(r.id))
}

const processOne = async (id: string) => {
  const r = receipts.value.find(r => r.id === id)
  if (!r) return

  r.status = 'uploading'
  await new Promise(res => setTimeout(res, 300 + Math.random() * 400))

  r.status = 'analyzing'
  const result = await analyzeReceipt(r.file, { ...analyzeOpts, documentId: r.documentId })

  if (result.ok) {
    r.status = 'ok'
    r.date   = result.date
    r.amount = result.amount
    r.vendor = result.vendor
  } else {
    r.status = 'error'
    r.errorReason = result.errorReason
  }

  processQueue()
}

// ===== 撮り直し =====
const triggerRetake = (idx: number) => {
  retakeTargetIdx.value = idx
  retakeInputRef.value?.click()
}

const handleRetake = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || retakeTargetIdx.value === null) return

  const idx = retakeTargetIdx.value
  const old = receipts.value[idx]
  if (!old) return
  URL.revokeObjectURL(old.previewUrl)

  receipts.value[idx] = {
    id: old.id,
    documentId: crypto.randomUUID(),
    file,
    previewUrl: URL.createObjectURL(file),
    status: 'queued',
    errorReason: null,
    date: null,
    amount: null,
    vendor: null,
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
  receipts.value.forEach(r => URL.revokeObjectURL(r.previewUrl))
  receipts.value = []
  knownHashes.value = new Set()
  showComplete.value = false
}

// ===== メモリ解放 =====
onBeforeUnmount(() => {
  receipts.value.forEach(r => URL.revokeObjectURL(r.previewUrl))
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,
.fade-leave-to    { opacity: 0; }

.modal-enter-active,
.modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from,
.modal-leave-to    { opacity: 0; transform: translateY(40px); }
</style>
