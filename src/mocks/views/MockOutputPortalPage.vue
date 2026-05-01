<template>
  <div class="op-root">
    <!-- ヘッダー -->
    <div class="op-header">
      <i class="fa-solid fa-download op-header-icon"></i>
      <span class="op-title">出力</span>
      <span v-if="currentClient" class="op-client-name">— {{ currentClient.companyName }}</span>
    </div>

    <!-- カードグリッド: 出力アクション -->
    <div class="op-section-label">出力・ダウンロード</div>
    <div class="op-grid op-grid-3">
      <!-- 仕訳外ZIP -->
      <button class="op-card" @click="downloadExcluded">
        <div class="op-card-icon op-card-icon-zip">
          <i class="fa-solid fa-file-zipper"></i>
        </div>
        <div class="op-card-body">
          <div class="op-card-title">仕訳外ZIPダウンロード</div>
          <div class="op-card-desc">仕訳外に分類されたファイルをZIPにまとめてダウンロードします</div>
        </div>
        <i class="fa-solid fa-download op-card-arrow"></i>
      </button>

      <!-- 根拠資料ZIP -->
      <button class="op-card" @click="downloadSupporting">
        <div class="op-card-icon op-card-icon-supporting">
          <i class="fa-solid fa-file-lines"></i>
        </div>
        <div class="op-card-body">
          <div class="op-card-title">根拠資料ZIPダウンロード</div>
          <div class="op-card-desc">根拠資料に分類されたファイルをZIPにまとめてダウンロードします</div>
        </div>
        <i class="fa-solid fa-download op-card-arrow"></i>
      </button>

      <!-- MF用CSVダウンロード -->
      <button class="op-card" @click="goExport">
        <div class="op-card-icon op-card-icon-csv">
          <i class="fa-solid fa-file-csv"></i>
        </div>
        <div class="op-card-body">
          <div class="op-card-title">MF用CSVダウンロード</div>
          <div class="op-card-desc">仕訳データをMF形式のCSVファイルとしてダウンロードします</div>
        </div>
        <i class="fa-solid fa-chevron-right op-card-arrow"></i>
      </button>
    </div>

    <!-- 過去履歴セクション -->
    <div class="op-section-label">過去履歴</div>
    <div class="op-grid op-grid-3">
      <!-- 【過去履歴】仕訳外ZIP -->
      <button class="op-card op-card-history" @click="goExcludedHistory">
        <div class="op-card-icon op-card-icon-history-zip">
          <i class="fa-solid fa-clock-rotate-left"></i>
        </div>
        <div class="op-card-body">
          <div class="op-card-title">
            <span class="op-history-badge">過去履歴</span>
            仕訳外ZIP
          </div>
          <div class="op-card-desc">過去に出力した仕訳外ZIPの一覧・再ダウンロード</div>
        </div>
        <i class="fa-solid fa-chevron-right op-card-arrow"></i>
      </button>

      <!-- 【過去履歴】根拠資料ZIP -->
      <button class="op-card op-card-history" @click="goSupportingHistory">
        <div class="op-card-icon op-card-icon-history-supporting">
          <i class="fa-solid fa-clock-rotate-left"></i>
        </div>
        <div class="op-card-body">
          <div class="op-card-title">
            <span class="op-history-badge">過去履歴</span>
            根拠資料ZIP
          </div>
          <div class="op-card-desc">過去に出力した根拠資料ZIPの一覧・再ダウンロード</div>
        </div>
        <i class="fa-solid fa-chevron-right op-card-arrow"></i>
      </button>

      <!-- 【過去履歴】MF用CSV -->
      <button class="op-card op-card-history" @click="goExportHistory">
        <div class="op-card-icon op-card-icon-history-csv">
          <i class="fa-solid fa-clock-rotate-left"></i>
        </div>
        <div class="op-card-body">
          <div class="op-card-title">
            <span class="op-history-badge">過去履歴</span>
            MF用CSV
          </div>
          <div class="op-card-desc">過去に出力したMF用CSVの一覧・再ダウンロード</div>
        </div>
        <i class="fa-solid fa-chevron-right op-card-arrow"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClients } from '@/features/client-management/composables/useClients'
import { useGlobalToast } from '@/mocks/composables/useGlobalToast'

const route = useRoute()
const router = useRouter()
const clientId = computed(() => (route.params.clientId as string) || '')
const { currentClient } = useClients()
const { showToast } = useGlobalToast()

// --- 出力アクション ---

/** 仕訳外ZIPダウンロード（即時DL） */
async function downloadExcluded() {
  try {
    const res = await fetch(`/api/drive/download-excluded/${encodeURIComponent(clientId.value)}`)
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: res.statusText }))
      showToast({ message: data.error || 'ダウンロードに失敗しました', type: 'error' })
      return
    }

    const blob = await res.blob()
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    triggerDownload(blob, `${clientId.value}_仕訳外_${today}.zip`)
    showToast({ message: '仕訳外ZIPをダウンロードしました', type: 'success', icon: 'fa-solid fa-file-zipper' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    showToast({ message: `エラー: ${msg}`, type: 'error' })
  }
}

/** 根拠資料ZIPダウンロード（即時DL） */
async function downloadSupporting() {
  try {
    const res = await fetch(`/api/drive/download-supporting/${encodeURIComponent(clientId.value)}`)
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: res.statusText }))
      showToast({ message: data.error || 'ダウンロードに失敗しました', type: 'error' })
      return
    }

    const blob = await res.blob()
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    triggerDownload(blob, `${clientId.value}_根拠資料_${today}.zip`)
    showToast({ message: '根拠資料ZIPをダウンロードしました', type: 'success', icon: 'fa-solid fa-file-lines' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    showToast({ message: `エラー: ${msg}`, type: 'error' })
  }
}

/** ブラウザダウンロード発火ヘルパー */
function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// --- 過去履歴ナビゲーション ---

function goExcludedHistory() {
  router.push(`/excluded-history/${clientId.value}`)
}

function goSupportingHistory() {
  router.push(`/supporting-history/${clientId.value}`)
}

function goExportHistory() {
  router.push(`/export-history/${clientId.value}`)
}

function goExport() {
  router.push(`/export/${clientId.value}`)
}
</script>

<style scoped>
.op-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  font-family: 'Noto Sans JP', 'Inter', sans-serif;
}

/* ===== ヘッダー ===== */
.op-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 24px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.op-header-icon {
  font-size: 18px;
  color: #3b82f6;
}

.op-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.op-client-name {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
}

/* ===== セクションラベル ===== */
.op-section-label {
  padding: 24px 24px 0;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.5px;
}

/* ===== カードグリッド ===== */
.op-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
  padding: 12px 24px 24px;
  max-width: 960px;
}

.op-grid-3 {
  max-width: 1200px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

/* ===== カード ===== */
.op-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-family: inherit;
}

.op-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.op-card:active {
  transform: translateY(0);
}

/* 過去履歴カード（少し控えめな背景） */
.op-card-history {
  background: #fafbfc;
  border-color: #e8ecf0;
}

.op-card-history:hover {
  background: white;
  border-color: #a5b4c6;
  box-shadow: 0 4px 16px rgba(100, 116, 139, 0.1);
}

.op-card-icon {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

/* アクションカードのアイコン色 */
.op-card-icon-zip {
  background: linear-gradient(135deg, #e0e7ff, #eef2ff);
  color: #6366f1;
}

.op-card-icon-supporting {
  background: linear-gradient(135deg, #fef3c7, #fffbeb);
  color: #d97706;
}

.op-card-icon-csv {
  background: linear-gradient(135deg, #d1fae5, #ecfdf5);
  color: #059669;
}

/* 過去履歴カードのアイコン色（控えめなグレー系） */
.op-card-icon-history-zip {
  background: linear-gradient(135deg, #e8eaed, #f1f3f5);
  color: #6b7280;
}

.op-card-icon-history-supporting {
  background: linear-gradient(135deg, #ede9dd, #f5f3ee);
  color: #8b7355;
}

.op-card-icon-history-csv {
  background: linear-gradient(135deg, #e0ecf0, #eef4f7);
  color: #557a8a;
}

.op-card-body {
  flex: 1;
  min-width: 0;
}

.op-card-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.op-card-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

.op-card-arrow {
  flex-shrink: 0;
  font-size: 14px;
  color: #cbd5e1;
  transition: color 0.15s;
}

.op-card:hover .op-card-arrow {
  color: #3b82f6;
}

.op-card-history:hover .op-card-arrow {
  color: #64748b;
}

/* 過去履歴バッジ */
.op-history-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  background: #e2e8f0;
  color: #64748b;
  letter-spacing: 0.3px;
  flex-shrink: 0;
}
</style>
