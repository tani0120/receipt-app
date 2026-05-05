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

      <!-- ===== ファイル一覧（選別モード） ===== -->
      <div v-else>
        <!-- 件数集計バー -->
        <div class="flex items-center justify-between mb-3 flex-wrap gap-1">
          <div class="flex gap-2 text-[11px] font-bold">
            <span style="background: #f3f4f6; color: #6b7280; padding: 2px 8px; border-radius: 4px;">未処理: {{ counts.pending }}</span>
            <span style="background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 4px;">仕訳: {{ counts.target }}</span>
            <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px;">根拠: {{ counts.supporting }}</span>
            <span style="background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 4px;">外: {{ counts.excluded }}</span>
          </div>
          <span class="text-[11px] text-gray-400">{{ driveFiles.length }}件</span>
        </div>

        <!-- ファイルリスト -->
        <div class="space-y-2">
          <div
            v-for="(file, idx) in driveFiles"
            :key="file.id"
            :class="[
              'bg-white rounded-2xl px-3 py-3 border-2 transition-all duration-200',
              idx === selectedIdx ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200',
            ]"
            @click="selectedIdx = idx"
          >
            <div class="flex items-center gap-3">
              <!-- サムネイル（base64またはアイコン） -->
              <div class="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                <img
                  v-if="file.thumbnailBase64"
                  :src="file.thumbnailBase64"
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
              </div>

              <!-- 選別ステータスバッジ -->
              <span
                class="text-[9px] font-bold px-2 py-1 rounded flex-shrink-0"
                :style="badgeStyle(getStatus(file.id))"
              >
                {{ statusLabel(getStatus(file.id)) }}
              </span>
            </div>

            <!-- 選別ボタン（選択中のファイルのみ表示） -->
            <div v-if="idx === selectedIdx" class="mt-3 flex gap-2">
              <button
                class="flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all active:scale-95"
                :style="getStatus(file.id) === 'target' ? 'background:#1d4ed8;color:#fff;' : 'background:#dbeafe;color:#1d4ed8;'"
                @click.stop="setStatus(file.id, 'target')"
              >✓ 仕訳対象</button>
              <button
                class="flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all active:scale-95"
                :style="getStatus(file.id) === 'supporting' ? 'background:#92400e;color:#fff;' : 'background:#fef3c7;color:#92400e;'"
                @click.stop="setStatus(file.id, 'supporting')"
              >📄 根拠</button>
              <button
                class="flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all active:scale-95"
                :style="getStatus(file.id) === 'excluded' ? 'background:#dc2626;color:#fff;' : 'background:#fee2e2;color:#dc2626;'"
                @click.stop="setStatus(file.id, 'excluded')"
              >✕ 仕訳外</button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ===== 底部固定エリア: 選別確定ボタン ===== -->
    <footer v-if="driveFiles.length > 0" class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div class="max-w-2xl mx-auto">
        <button
          :disabled="counts.pending > 0"
          :class="[
            'w-full py-4 rounded-2xl text-[15px] font-bold transition-all duration-300',
            counts.pending === 0
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 active:scale-95 hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          ]"
          @click="handleComplete"
        >
          {{ counts.pending > 0 ? `残り${counts.pending}件を選別してください` : '選別を確定する' }}
        </button>
      </div>
    </footer>

    <!-- ===== 選別完了モーダル ===== -->
    <transition name="modal">
      <div v-if="showComplete"
        class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
        @click.self="showComplete = false">
        <div class="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
        <!-- 移行中: プログレスバー -->
        <template v-if="isMigrating">
          <div class="text-5xl mb-4 animate-spin">⚙️</div>
          <h2 class="text-[18px] font-bold text-gray-800 mb-2">移行中...</h2>
          <p class="text-[13px] text-gray-500 mb-2">
            {{ migrationProgress.done + migrationProgress.failed }} / {{ migrationProgress.total }}件完了
          </p>
          <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-2">
            <div
              class="h-2 rounded-full transition-all duration-500"
              :style="{
                width: migrationProgress.total > 0 ? ((migrationProgress.done + migrationProgress.failed) / migrationProgress.total * 100) + '%' : '0%',
                background: migrationProgress.failed > 0 ? '#f59e0b' : '#3b82f6',
              }"
            ></div>
          </div>
          <p v-if="migrationProgress.failed > 0" class="text-[11px] text-red-500 font-bold">
            ⚠ {{ migrationProgress.failed }}件失敗
          </p>
        </template>
        <!-- 移行完了 -->
        <template v-else-if="migrationDone">
          <div class="text-6xl mb-4">✅</div>
          <h2 class="text-[18px] font-bold text-gray-800 mb-2">移行完了</h2>
          <p class="text-[13px] text-gray-500 mb-2">
            {{ migrationProgress.done }}件移行完了。
            <span v-if="migrationProgress.failed > 0" class="text-red-500">
              {{ migrationProgress.failed }}件失敗。
            </span>
          </p>
          <p v-if="excludedInMigration > 0" class="text-[12px] text-gray-400 mb-3">
            仕訳外: {{ excludedInMigration }}件
          </p>
          <button
            v-if="excludedInMigration > 0"
            class="w-full bg-indigo-500 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform mb-2"
            @click="router.push(`/excluded-history/${clientId}`)"
          >📥 仕訳外ダウンロード履歴へ</button>
          <button
            class="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform"
            @click="finishMigration"
          >閉じる</button>
        </template>
        <!-- 選別確定確認 -->
        <template v-else>
          <div class="text-6xl mb-4">✅</div>
          <h2 class="text-[18px] font-bold text-gray-800 mb-2">選別完了</h2>
          <p class="text-[13px] text-gray-500 mb-2">
            仕訳対象: <span class="font-bold text-blue-600">{{ counts.target }}件</span> /
            根拠資料: <span class="font-bold text-amber-600">{{ counts.supporting }}件</span> /
            仕訳外: <span class="font-bold text-red-500">{{ counts.excluded }}件</span>
          </p>
          <p class="text-[13px] text-gray-700 font-semibold mb-6">
            仕訳処理に送りますか？
          </p>
          <div class="flex gap-3">
            <button
              class="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform"
              @click="sendToProcess"
            >はい</button>
            <button
              class="flex-1 bg-gray-100 text-gray-600 font-bold py-3.5 rounded-2xl active:scale-95 transition-transform"
              @click="showComplete = false"
            >いいえ</button>
          </div>
        </template>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PortalHeader from '@/components/PortalHeader.vue'
import { useClients } from '@/features/client-management/composables/useClients'
import { useUnsavedGuard } from '@/composables/useUnsavedGuard'
import type { DocStatus } from '@/repositories/types'
import type { DriveFileItemWithThumbnail } from '@/api/services/drive/driveService'

// ===== ルート =====
const route = useRoute()
const router = useRouter()
const clientId = route.params.clientId as string
const { clients } = useClients()
const clientName = computed(() => clients.value.find(c => c.clientId === clientId)?.companyName ?? clientId)

// --- ページ離脱ガード（選別中の離脱を警告） ---
const { markDirty, markClean } = useUnsavedGuard(null)

// ===== 型 =====
// DriveFileItemWithThumbnailを継承（id, name, mimeType, size, createdTime, thumbnailBase64）
type DriveFileEntry = DriveFileItemWithThumbnail

// ===== 状態 =====
const driveFiles = ref<DriveFileEntry[]>([])
const loadState = ref<'loading' | 'loaded' | 'error'>('loading')
const loadError = ref('')
const showComplete = ref(false)
const selectedIdx = ref(0)
/** 選別結果をローカルで保持（Driveには書き込まない） */
const selections = ref<Map<string, DocStatus>>(new Map())

// ===== 選別状態の取得/設定 =====
const getStatus = (fileId: string): DocStatus => selections.value.get(fileId) || 'pending'

const setStatus = (fileId: string, status: DocStatus) => {
  const current = getStatus(fileId)
  if (current === status) {
    // 同じステータスをタップ → pendingに戻す
    selections.value.set(fileId, 'pending')
  } else {
    selections.value.set(fileId, status)
  }
  // 選別操作を記録（離脱ガード）
  const file = driveFiles.value.find(f => f.id === fileId)
  if (file) markDirty(`${file.name}: ${statusLabel(getStatus(fileId))}`)

  // 次のpendingファイルに自動移動
  if (getStatus(fileId) !== 'pending') {
    const nextIdx = driveFiles.value.findIndex((f, i) => i > selectedIdx.value && getStatus(f.id) === 'pending')
    if (nextIdx !== -1) {
      selectedIdx.value = nextIdx
    } else {
      // 全件選別済みかチェック
      if (counts.value.pending === 0) {
        showComplete.value = true
      }
    }
  }
}

// ===== 件数集計 =====
const counts = computed(() => {
  const files = driveFiles.value
  return {
    pending:    files.filter(f => getStatus(f.id) === 'pending').length,
    target:     files.filter(f => getStatus(f.id) === 'target').length,
    supporting: files.filter(f => getStatus(f.id) === 'supporting').length,
    excluded:   files.filter(f => getStatus(f.id) === 'excluded').length,
  }
})

// ===== ファイル一覧取得（Drive借景方式: サムネイルbase64付き） =====
const fetchFiles = async () => {
  loadState.value = 'loading'
  loadError.value = ''

  try {
    const client = clients.value.find(c => c.clientId === clientId)
    const folderId = client?.sharedFolderId

    if (!folderId) {
      // フォルダ未設定: 空一覧
      driveFiles.value = []
      loadState.value = 'loaded'
      return
    }

    const res = await fetch(`/api/drive/files?folderId=${encodeURIComponent(folderId)}&withThumbnails=true`)
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(data.error || `HTTP ${res.status}`)
    }

    const data = await res.json() as { files: DriveFileItemWithThumbnail[] }

    driveFiles.value = data.files
    // 新規ファイルにはpendingを設定（既存の選別結果は保持）
    for (const f of data.files) {
      if (!selections.value.has(f.id)) {
        selections.value.set(f.id, 'pending')
      }
    }
    loadState.value = 'loaded'
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : String(err)
    loadState.value = 'error'
  }
}

// ===== 選別確定 =====
const handleComplete = () => {
  if (counts.value.pending > 0) return
  showComplete.value = true
}

// ===== 移行進捗状態 =====
const isMigrating = ref(false)
const migrationDone = ref(false)
const migrationProgress = ref({ total: 0, queued: 0, processing: 0, done: 0, failed: 0 })

// ===== 仕訳処理に送る（Phase D: POST /api/drive/migrate + ポーリング） =====
const sendToProcess = async () => {
  const filesToMigrate = driveFiles.value
    .filter(f => getStatus(f.id) !== 'pending')
    .map(f => ({ fileId: f.id, status: getStatus(f.id) }))

  if (filesToMigrate.length === 0) {
    showComplete.value = false
    return
  }

  isMigrating.value = true
  migrationDone.value = false

  try {
    const res = await fetch('/api/drive/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        files: filesToMigrate,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(data.error || `HTTP ${res.status}`)
    }

    const result = await res.json() as { jobId: string; queued: number }
    migrationProgress.value = { total: result.queued, queued: result.queued, processing: 0, done: 0, failed: 0 }

    // ポーリング（3秒間隔）
    const pollInterval = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/drive/migrate/status/${result.jobId}`)
        if (!statusRes.ok) return
        const status = await statusRes.json() as { total: number; queued: number; processing: number; done: number; failed: number }
        migrationProgress.value = status

        if (status.queued === 0 && status.processing === 0) {
          clearInterval(pollInterval)
          isMigrating.value = false
          migrationDone.value = true
        }
      } catch {
        // ポーリングエラーは無視
      }
    }, 3000)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    alert(`移行エラー: ${msg}`)
    isMigrating.value = false
  }
}

// ===== 移行完了後のリセット =====
const finishMigration = async () => {
  showComplete.value = false
  migrationDone.value = false
  await fetchFiles()
  await fetchExcludedCount()
  selectedIdx.value = 0
  selections.value = new Map()
  markClean()
}

// ===== 仕訳外関連 =====
const excludedCount = ref(0)
const excludedInMigration = computed(() => counts.value.excluded)

const fetchExcludedCount = async () => {
  try {
    const res = await fetch(`/api/drive/excluded-count/${clientId}`)
    if (res.ok) {
      const data = await res.json() as { count: number }
      excludedCount.value = data.count
    }
  } catch { /* 無視 */ }
}

// ===== ユーティリティ =====
const statusLabel = (s: DocStatus): string => {
  if (s === 'target') return '仕訳対象'
  if (s === 'supporting') return '根拠'
  if (s === 'excluded') return '仕訳外'
  return '未処理'
}

const badgeStyle = (s: DocStatus): Record<string, string> => {
  if (s === 'target') return { background: '#dbeafe', color: '#1d4ed8' }
  if (s === 'supporting') return { background: '#fef3c7', color: '#92400e' }
  if (s === 'excluded') return { background: '#fee2e2', color: '#dc2626' }
  return { background: '#f3f4f6', color: '#9ca3af' }
}

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
onMounted(() => { fetchFiles(); fetchExcludedCount() })
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
