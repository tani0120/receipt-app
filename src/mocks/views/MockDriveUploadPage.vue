<template>
  <div class="h-full overflow-y-auto flex flex-col" style="font-family: 'Noto Sans JP', sans-serif; position: relative; background: #fff;">

    <!-- ポータル共通ヘッダー -->
    <PortalHeader :clientName="clientName" />

    <!-- ===== メイン ===== -->
    <main class="flex-1 max-w-2xl mx-auto w-full px-3 py-4 pb-40" style="padding-top: 80px;">

      <!-- ===== 読み込み中 ===== -->
      <div v-if="loadState === 'loading'" class="mt-10 flex flex-col items-center">
        <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-4 text-[13px] text-gray-500">ドライブからファイルを読み込み中...</p>
      </div>

      <!-- ===== エラー ===== -->
      <div v-else-if="loadState === 'error'" class="mt-10 flex flex-col items-center">
        <div class="text-5xl mb-4">⚠️</div>
        <p class="text-[14px] font-bold text-red-600 mb-2">読み込みに失敗しました</p>
        <p class="text-[12px] text-gray-500 mb-4">{{ loadError }}</p>
        <button
          class="bg-blue-600 text-white text-[13px] font-bold py-2.5 px-6 rounded-xl active:scale-95 transition-transform"
          @click="fetchFiles"
        >再読み込み</button>
      </div>

      <!-- ===== 空 ===== -->
      <div v-else-if="driveFiles.length === 0" class="mt-10 flex flex-col items-center">
        <div class="text-6xl mb-4">📂</div>
        <p class="text-[14px] font-bold text-gray-700 mb-2">ファイルがありません</p>
        <p class="text-[12px] text-gray-400">ドライブにファイルをアップロードしてください</p>
      </div>

      <!-- ===== ファイル一覧 ===== -->
      <div v-else>
        <!-- 操作バー -->
        <div class="flex items-center justify-between mb-3">
          <button
            class="text-[12px] font-bold text-blue-600 active:scale-95 transition-transform"
            @click="toggleSelectAll"
          >
            {{ isAllSelected ? '☑ 全解除' : '☐ 全選択' }}
          </button>
          <span class="text-[11px] text-gray-400">{{ selectedCount }}件選択 / {{ driveFiles.length }}件</span>
        </div>

        <!-- ファイルリスト -->
        <div class="space-y-2">
          <div
            v-for="file in driveFiles"
            :key="file.id"
            :class="[
              'bg-white rounded-2xl px-3 py-3 flex items-center gap-3 border-2 transition-all duration-200 cursor-pointer',
              file.selected
                ? 'border-blue-400 bg-blue-50/50'
                : 'border-gray-200 hover:border-gray-300',
              file.processStatus === 'done' ? 'border-emerald-300 bg-emerald-50/30' : '',
              file.processStatus === 'error' ? 'border-red-300 bg-red-50/30' : '',
            ]"
            @click="toggleFile(file.id)"
          >
            <!-- チェックボックス -->
            <div
              :class="[
                'w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all',
                file.selected
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-white border-gray-300',
              ]"
            >
              <span v-if="file.selected" class="text-[12px] font-bold">✓</span>
            </div>

            <!-- サムネイル -->
            <div class="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
              <img
                v-if="file.thumbnailLink"
                :src="file.thumbnailLink"
                :alt="file.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-xl">
                {{ fileIcon(file.mimeType) }}
              </div>
            </div>

            <!-- ファイル情報 -->
            <div class="flex-1 min-w-0">
              <p class="text-[12px] font-semibold text-gray-800 truncate">{{ file.name }}</p>
              <p class="text-[10px] text-gray-400 mt-0.5">
                {{ formatSize(file.size) }} · {{ formatDate(file.createdTime) }}
              </p>
              <!-- 処理ステータス -->
              <p v-if="file.processStatus === 'processing'" class="text-[9px] text-blue-500 font-bold mt-0.5 animate-pulse">⏳ 処理中...</p>
              <p v-if="file.processStatus === 'done'" class="text-[9px] text-emerald-600 font-bold mt-0.5">✅ 完了</p>
              <p v-if="file.processStatus === 'error'" class="text-[9px] text-red-500 font-bold mt-0.5">❌ {{ file.processError }}</p>
              <p v-if="file.isDuplicate" class="text-[9px] text-amber-600 font-bold mt-0.5">⚠ アップロード済みの可能性</p>
            </div>

            <!-- 処理済みバッジ -->
            <div v-if="file.processStatus === 'done'" class="flex-shrink-0">
              <span class="text-emerald-500 text-xl">✅</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ===== 底部固定エリア ===== -->
    <footer v-if="driveFiles.length > 0" class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div class="max-w-2xl mx-auto">
        <!-- 進捗表示 -->
        <transition name="fade">
          <div v-if="processState === 'processing'" class="mb-2">
            <div class="flex justify-between text-[11px] text-gray-500 mb-1">
              <span class="font-semibold animate-pulse">処理中...</span>
              <span>{{ processedCount }} / {{ selectedCount }} 件</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                class="h-2 rounded-full bg-blue-500 transition-all duration-500"
                :style="{ width: `${progressPct}%` }"
              ></div>
            </div>
          </div>
          <p v-else-if="processState === 'done'" class="text-[11px] text-center text-emerald-600 font-semibold mb-2">
            全件処理完了！ ✅
          </p>
          <p v-else-if="processState === 'error'" class="text-[11px] text-center text-red-500 font-semibold mb-2">
            ⚠ 一部の処理に失敗しました
          </p>
        </transition>

        <button
          :disabled="selectedCount === 0 || processState === 'processing'"
          :class="[
            'w-full py-4 rounded-2xl text-[15px] font-bold transition-all duration-300',
            selectedCount > 0 && processState !== 'processing'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 active:scale-95 hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          ]"
          @click="handleProcess"
        >
          {{ submitLabel }}
        </button>
      </div>
    </footer>

    <!-- ===== 完了モーダル ===== -->
    <transition name="modal">
      <div v-if="showComplete"
        class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
        @click.self="showComplete = false">
        <div class="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
          <div class="text-6xl mb-4">📨</div>
          <h2 class="text-[18px] font-bold text-gray-800 mb-2">送付完了！</h2>
          <p class="text-[13px] text-gray-500 mb-2">
            <span class="font-bold text-blue-600">{{ completedCount }}件</span> の領収書を受け付けました。
          </p>
          <p class="text-[11px] text-gray-400 mb-6">
            AI分類結果は間もなく反映されます。
          </p>
          <button
            class="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform"
            @click="resetAll"
          >
            閉じる
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PortalHeader from '@/mocks/components/PortalHeader.vue'
import { useClients } from '@/features/client-management/composables/useClients'

// ===== ルート =====
const route = useRoute()
const clientId = route.params.clientId as string
const { clients } = useClients()
const clientName = clients.value.find(c => c.clientId === clientId)?.companyName ?? clientId

// ===== 型 =====
interface DriveFileEntry {
  id: string
  name: string
  mimeType: string
  size: number
  createdTime: string
  thumbnailLink: string | null
  selected: boolean
  processStatus: 'idle' | 'processing' | 'done' | 'error'
  processError: string | null
  isDuplicate: boolean
}

// ===== 状態 =====
const driveFiles = ref<DriveFileEntry[]>([])
const loadState = ref<'loading' | 'loaded' | 'error'>('loading')
const loadError = ref('')
const processState = ref<'idle' | 'processing' | 'done' | 'error'>('idle')
const showComplete = ref(false)
const completedCount = ref(0)

// ===== 集計 =====
const selectedCount = computed(() => driveFiles.value.filter(f => f.selected).length)
const isAllSelected = computed(() =>
  driveFiles.value.length > 0 && driveFiles.value.every(f => f.selected),
)
const processedCount = computed(() =>
  driveFiles.value.filter(f => f.processStatus === 'done' || f.processStatus === 'error').length,
)
const progressPct = computed(() =>
  selectedCount.value === 0 ? 0
    : Math.round(processedCount.value / selectedCount.value * 100),
)

const submitLabel = computed(() => {
  if (processState.value === 'processing') return `処理中... (${progressPct.value}%)`
  if (selectedCount.value === 0) return 'ファイルを選択してください'
  return `${selectedCount.value}件を送付する`
})

// ===== ファイル一覧取得 =====
const fetchFiles = async () => {
  loadState.value = 'loading'
  loadError.value = ''

  try {
    // 顧問先のdriveId（フォルダID）を取得
    const client = clients.value.find(c => c.clientId === clientId)
    const folderId = (client as Record<string, unknown>)?.driveId as string | undefined

    if (!folderId) {
      // モックモード: ドライブ未設定の場合はダミーデータ
      driveFiles.value = generateMockFiles()
      loadState.value = 'loaded'
      return
    }

    const res = await fetch(`/api/drive/files?folderId=${encodeURIComponent(folderId)}`)
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(data.error || `HTTP ${res.status}`)
    }

    const data = await res.json() as { files: Array<{
      id: string; name: string; mimeType: string; size: number; createdTime: string; thumbnailLink: string | null
    }> }

    driveFiles.value = data.files.map(f => ({
      ...f,
      selected: false,
      processStatus: 'idle' as const,
      processError: null,
      isDuplicate: false,
    }))
    loadState.value = 'loaded'
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : String(err)
    loadState.value = 'error'
  }
}

// ===== モックデータ生成 =====
const generateMockFiles = (): DriveFileEntry[] => {
  const names = [
    'IMG_20260401_receipt.jpg', 'IMG_20260402_lunch.jpg', 'scan_taxi_0403.pdf',
    'IMG_20260405_office.jpg', 'receipt_amazon_0406.jpg', 'IMG_20260408_parking.jpg',
    'scan_hotel_0410.pdf', 'IMG_20260412_dinner.jpg', 'receipt_train_0415.jpg',
    'IMG_20260418_supply.jpg', 'scan_meeting_0420.pdf', 'IMG_20260422_fuel.jpg',
  ]
  return names.map((name, i) => ({
    id: `mock-${i}`,
    name,
    mimeType: name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
    size: 1024 * (300 + Math.floor(Math.random() * 500)),
    createdTime: new Date(2026, 3, 1 + i).toISOString(),
    thumbnailLink: null,
    selected: false,
    processStatus: 'idle' as const,
    processError: null,
    isDuplicate: false,
  }))
}

// ===== 選択操作 =====
const toggleFile = (id: string) => {
  const file = driveFiles.value.find(f => f.id === id)
  if (file && file.processStatus === 'idle') {
    file.selected = !file.selected
  }
}

const toggleSelectAll = () => {
  const newState = !isAllSelected.value
  driveFiles.value.forEach(f => {
    if (f.processStatus === 'idle') f.selected = newState
  })
}

// ===== 処理実行 =====
const handleProcess = async () => {
  const selected = driveFiles.value.filter(f => f.selected && f.processStatus === 'idle')
  if (selected.length === 0) return

  processState.value = 'processing'

  // 選択されたファイルのステータスを処理中に
  selected.forEach(f => { f.processStatus = 'processing' })

  try {
    const res = await fetch('/api/drive/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        files: selected.map(f => ({
          fileId: f.id,
          filename: f.name,
          mimeType: f.mimeType,
        })),
      }),
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const data = await res.json() as {
      results: Array<{ fileId: string; isDuplicate: boolean }>
      errors: Array<{ fileId: string; error: string }>
    }

    // 成功結果を反映
    for (const result of data.results) {
      const file = driveFiles.value.find(f => f.id === result.fileId)
      if (file) {
        file.processStatus = 'done'
        file.isDuplicate = result.isDuplicate
        file.selected = false
      }
    }

    // エラー結果を反映
    for (const err of data.errors) {
      const file = driveFiles.value.find(f => f.id === err.fileId)
      if (file) {
        file.processStatus = 'error'
        file.processError = err.error
        file.selected = false
      }
    }

    const doneCount = data.results.length
    const errCount = data.errors.length

    if (errCount > 0 && doneCount === 0) {
      processState.value = 'error'
    } else if (errCount > 0) {
      processState.value = 'error'
    } else {
      processState.value = 'done'
      completedCount.value = doneCount
      showComplete.value = true
    }
  } catch (err) {
    // 全件エラーに
    selected.forEach(f => {
      f.processStatus = 'error'
      f.processError = err instanceof Error ? err.message : String(err)
      f.selected = false
    })
    processState.value = 'error'
  }
}

// ===== リセット =====
const resetAll = () => {
  showComplete.value = false
  processState.value = 'idle'
}

// ===== ユーティリティ =====
const fileIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return '🖼'
  if (mimeType === 'application/pdf') return '📄'
  return '📁'
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatDate = (iso: string): string => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

// ===== 初期化 =====
onMounted(() => { fetchFiles() })
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
