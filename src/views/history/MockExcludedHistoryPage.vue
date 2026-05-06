<template>
  <div class="eh-root">
    <!-- ヘッダー -->
    <div class="eh-header">
      <div class="eh-header-left">
        <i class="fa-solid fa-file-zipper eh-header-icon"></i>
        <span class="eh-title">仕訳外ダウンロード履歴</span>
        <span v-if="currentClient" class="eh-client-name">— {{ currentClient.companyName }}</span>
      </div>
      <div class="eh-header-right">
        <button
          class="eh-dl-btn"
          :disabled="checkedIds.size === 0 || isDownloading"
          @click="downloadChecked"
        >
          <i class="fa-solid fa-download"></i>
          {{ isDownloading ? 'DL中...' : `ダウンロード (${checkedIds.size}件)` }}
        </button>
        <button class="eh-reload-btn" @click="loadHistory" :disabled="isLoading">
          <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': isLoading }"></i>
          更新
        </button>
      </div>
    </div>

    <!-- テーブル -->
    <div class="eh-table-wrap">
      <table class="eh-table">
        <thead>
          <tr>
            <th class="eh-th eh-th-check"><input type="checkbox" :checked="isAllChecked" @change="toggleAll"></th>
            <th class="eh-th eh-th-date">出力日</th>
            <th class="eh-th eh-th-name">出力ファイル名</th>
            <th class="eh-th eh-th-count">件数</th>
            <th class="eh-th eh-th-status">ステータス</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading && rows.length === 0" class="eh-empty-row">
            <td colspan="5" class="eh-empty-cell">
              <i class="fa-solid fa-spinner fa-spin"></i> 読み込み中...
            </td>
          </tr>
          <tr v-else-if="rows.length === 0" class="eh-empty-row">
            <td colspan="5" class="eh-empty-cell">
              <i class="fa-regular fa-folder-open"></i> 仕訳外ダウンロード履歴はありません
            </td>
          </tr>
          <tr
            v-for="(row, idx) in rows"
            :key="row.jobId"
            class="eh-row"
            :class="{ 'eh-row-alt': idx % 2 === 1 }"
            style="cursor: pointer;"
            @click="onRowClick(row)"
          >
            <td class="eh-td eh-td-check" @click.stop>
              <input type="checkbox" :checked="checkedIds.has(row.jobId)" @change="toggleCheck(row.jobId)">
            </td>
            <td class="eh-td eh-td-date">{{ row.displayDate }}</td>
            <td class="eh-td eh-td-name">
              <i class="fa-solid fa-file-zipper" style="color: #6366f1; margin-right: 6px;"></i>
              {{ row.fileName }}
            </td>
            <td class="eh-td eh-td-count">{{ row.excludedCount }}件</td>
            <td class="eh-td eh-td-status">
              <span :class="['eh-badge', row.downloadedAt ? 'eh-badge-done' : 'eh-badge-pending']">
                {{ row.downloadedAt ? 'DL済み' : '未DL' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ダウンロード確認モーダル -->
    <div v-if="confirmTarget" class="eh-modal-overlay" @click="confirmTarget = null">
      <div class="eh-modal" @click.stop>
        <div class="eh-modal-icon">
          <i class="fa-solid fa-file-zipper"></i>
        </div>
        <div class="eh-modal-title">ダウンロードしますか？</div>
        <div class="eh-modal-desc">
          <span class="eh-modal-filename">{{ confirmTarget.fileName }}.zip</span>
          <span class="eh-modal-meta">{{ confirmTarget.excludedCount }}件 ・ {{ confirmTarget.displayDate }}</span>
        </div>
        <div class="eh-modal-actions">
          <button class="eh-modal-btn eh-modal-btn-cancel" @click="confirmTarget = null">いいえ</button>
          <button class="eh-modal-btn eh-modal-btn-ok" :disabled="isDownloading" @click="downloadSingle">
            <i class="fa-solid fa-download"></i> {{ isDownloading ? 'DL中...' : 'はい' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useClients } from '@/features/client-management/composables/useClients'
import { useGlobalToast } from '@/composables/useGlobalToast'

const route = useRoute()
const clientId = computed(() => (route.params.clientId as string) || '')
const { currentClient } = useClients()
const { showToast } = useGlobalToast()

// ============================================================
// § 履歴行の型
// ============================================================

interface ExcludedHistoryRow {
  /** ジョブID */
  jobId: string
  /** 顧問先ID */
  clientId: string
  /** 仕訳外ファイル件数 */
  excludedCount: number
  /** 出力ファイル名（拡張子なし） */
  fileName: string
  /** 表示用日時 */
  displayDate: string
  /** ジョブ作成日時（ISO） */
  createdAt: string
  /** DL済み日時（ISO | null） */
  downloadedAt: string | null
}

// ============================================================
// § 状態
// ============================================================

const rows = ref<ExcludedHistoryRow[]>([])
const isLoading = ref(false)
const isDownloading = ref(false)
const checkedIds = ref<Set<string>>(new Set())

// ============================================================
// § データ取得
// ============================================================

async function loadHistory() {
  isLoading.value = true
  try {
    const res = await fetch(`/api/drive/excluded-history/${encodeURIComponent(clientId.value)}`)
    if (!res.ok) {
      rows.value = []
      return
    }
    const data = await res.json() as ExcludedHistoryRow[]
    rows.value = data
  } catch {
    rows.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => loadHistory())

// ============================================================
// § チェックボックス
// ============================================================

const isAllChecked = computed(() =>
  rows.value.length > 0 && rows.value.every(r => checkedIds.value.has(r.jobId))
)

function toggleCheck(jobId: string) {
  const next = new Set(checkedIds.value)
  if (next.has(jobId)) { next.delete(jobId) } else { next.add(jobId) }
  checkedIds.value = next
}

function toggleAll() {
  const next = new Set(checkedIds.value)
  if (isAllChecked.value) {
    rows.value.forEach(r => next.delete(r.jobId))
  } else {
    rows.value.forEach(r => next.add(r.jobId))
  }
  checkedIds.value = next
}

// ============================================================
// § ダウンロード
// ============================================================

async function downloadChecked() {
  if (checkedIds.value.size === 0) return
  isDownloading.value = true

  try {
    for (const jobId of checkedIds.value) {
      const row = rows.value.find(r => r.jobId === jobId)
      if (!row) continue

      const res = await fetch(`/api/drive/download-excluded/${encodeURIComponent(clientId.value)}?jobId=${encodeURIComponent(jobId)}&all=true`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }))
        showToast({ message: `DLエラー: ${errData.error || res.statusText}`, type: 'error' })
        continue
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = row.fileName + '.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    showToast({ message: 'ダウンロード完了', type: 'success' })
    // 履歴を再取得してステータス更新
    await loadHistory()
    checkedIds.value = new Set()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    showToast({ message: `DLエラー: ${msg}`, type: 'error' })
  } finally {
    isDownloading.value = false
  }
}

// ============================================================
// § 行クリック→確認モーダル→単体DL
// ============================================================

/** 確認モーダルの対象行（null=非表示） */
const confirmTarget = ref<ExcludedHistoryRow | null>(null)

/** 行クリックハンドラ */
function onRowClick(row: ExcludedHistoryRow) {
  confirmTarget.value = row
}

/** 確認モーダル「はい」→単体DL実行 */
async function downloadSingle() {
  if (!confirmTarget.value) return
  const row = confirmTarget.value
  isDownloading.value = true

  try {
    const res = await fetch(`/api/drive/download-excluded/${encodeURIComponent(clientId.value)}?jobId=${encodeURIComponent(row.jobId)}&all=true`)
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: res.statusText }))
      showToast({ message: `DLエラー: ${errData.error || res.statusText}`, type: 'error' })
      return
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = row.fileName + '.zip'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast({ message: 'ダウンロード完了', type: 'success' })
    await loadHistory()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    showToast({ message: `DLエラー: ${msg}`, type: 'error' })
  } finally {
    isDownloading.value = false
    confirmTarget.value = null
  }
}
</script>

<style scoped>
.eh-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  font-family: 'Noto Sans JP', 'Inter', sans-serif;
  font-size: 13px;
  color: #1e293b;
}

/* ===== ヘッダー ===== */
.eh-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.eh-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.eh-header-icon {
  font-size: 16px;
  color: #6366f1;
}

.eh-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}

.eh-client-name {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

.eh-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.eh-dl-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.eh-dl-btn:hover:not(:disabled) {
  background: #4f46e5;
}

.eh-dl-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.eh-reload-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 7px 12px;
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.eh-reload-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #1e293b;
}

/* ===== テーブル ===== */
.eh-table-wrap {
  flex: 1;
  overflow: auto;
}

.eh-table {
  width: 100%;
  border-collapse: collapse;
}

.eh-th {
  position: sticky;
  top: 0;
  background: linear-gradient(135deg, #eff6ff, #eef2ff);
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #cbd5e1;
  text-align: left;
  z-index: 1;
}

.eh-th-check {
  width: 44px;
  text-align: center;
}

.eh-th-date {
  width: 150px;
}

.eh-th-count {
  width: 80px;
  text-align: right;
}

.eh-th-status {
  width: 100px;
  text-align: center;
}

/* ===== 行 ===== */
.eh-row {
  background: white;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.1s;
}

.eh-row:hover {
  background: #f0f9ff;
}

.eh-row-alt {
  background: #fafbfc;
}

.eh-row-alt:hover {
  background: #f0f9ff;
}

.eh-td {
  padding: 10px 14px;
  font-size: 12px;
  vertical-align: middle;
}

.eh-td-check {
  text-align: center;
}

.eh-td-date {
  color: #64748b;
  font-variant-numeric: tabular-nums;
}

.eh-td-name {
  font-weight: 600;
  color: #1e293b;
}

.eh-td-count {
  text-align: right;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.eh-td-status {
  text-align: center;
}

/* ===== バッジ ===== */
.eh-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
}

.eh-badge-done {
  background: #dcfce7;
  color: #15803d;
}

.eh-badge-pending {
  background: #fef3c7;
  color: #b45309;
}

/* ===== 空行 ===== */
.eh-empty-row td {
  padding: 60px 20px;
}

.eh-empty-cell {
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.eh-empty-cell i {
  font-size: 24px;
  opacity: 0.4;
}

/* ===== チェックボックス ===== */
input[type="checkbox"] {
  width: 14px;
  height: 14px;
  accent-color: #6366f1;
  cursor: pointer;
}

/* ===== 確認モーダル ===== */
.eh-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.eh-modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  min-width: 360px;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.eh-modal-icon {
  font-size: 36px;
  color: #6366f1;
  margin-bottom: 12px;
}

.eh-modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
}

.eh-modal-desc {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 24px;
}

.eh-modal-filename {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  word-break: break-all;
}

.eh-modal-meta {
  font-size: 12px;
  color: #94a3b8;
}

.eh-modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.eh-modal-btn {
  padding: 8px 24px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  transition: all 0.15s;
}

.eh-modal-btn-cancel {
  background: white;
  color: #64748b;
}

.eh-modal-btn-cancel:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.eh-modal-btn-ok {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.eh-modal-btn-ok:hover {
  background: #4f46e5;
}

.eh-modal-btn-ok:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
