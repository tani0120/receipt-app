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
    <div class="op-grid">
      <!-- 仕訳外ZIP -->
      <button class="op-card" @click="goExcludedHistory">
        <div class="op-card-icon op-card-icon-zip">
          <i class="fa-solid fa-file-zipper"></i>
        </div>
        <div class="op-card-body">
          <div class="op-card-title">仕訳外ZIPダウンロード</div>
          <div class="op-card-desc">仕訳外に分類されたファイルのZIPダウンロード履歴を管理します</div>
        </div>
        <i class="fa-solid fa-chevron-right op-card-arrow"></i>
      </button>

      <!-- MF用CSV -->
      <button class="op-card" @click="goExport">
        <div class="op-card-icon op-card-icon-csv">
          <i class="fa-solid fa-file-csv"></i>
        </div>
        <div class="op-card-body">
          <div class="op-card-title">MF用CSV出力</div>
          <div class="op-card-desc">マネーフォワード形式のCSVファイルを出力・ダウンロードします</div>
        </div>
        <i class="fa-solid fa-chevron-right op-card-arrow"></i>
      </button>
    </div>

    <!-- 出力履歴セクション -->
    <div class="op-section-label">出力履歴</div>
    <div class="op-grid">
      <!-- 仕訳外ZIP履歴 -->
      <button class="op-card" @click="goExcludedHistory">
        <div class="op-card-icon op-card-icon-history-zip">
          <i class="fa-solid fa-clock-rotate-left"></i>
        </div>
        <div class="op-card-body">
          <div class="op-card-title">仕訳外ZIPダウンロード履歴</div>
          <div class="op-card-desc">ジョブ単位のダウンロード済み・未ダウンロード一覧</div>
        </div>
        <i class="fa-solid fa-chevron-right op-card-arrow"></i>
      </button>

      <!-- CSV出力履歴 -->
      <button class="op-card" @click="goExportHistory">
        <div class="op-card-icon op-card-icon-history-csv">
          <i class="fa-solid fa-clock-rotate-left"></i>
        </div>
        <div class="op-card-body">
          <div class="op-card-title">CSV出力履歴</div>
          <div class="op-card-desc">過去に出力したMF用CSVファイルの一覧・再ダウンロード</div>
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

const route = useRoute()
const router = useRouter()
const clientId = computed(() => (route.params.clientId as string) || '')
const { currentClient } = useClients()

function goExport() {
  router.push(`/export/${clientId.value}`)
}

function goExcludedHistory() {
  router.push(`/excluded-history/${clientId.value}`)
}

function goExportHistory() {
  router.push(`/export-history/${clientId.value}`)
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
  text-transform: uppercase;
}

/* ===== カードグリッド ===== */
.op-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  padding: 12px 24px 24px;
  max-width: 960px;
}

/* ===== カード ===== */
.op-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
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

.op-card-icon {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.op-card-icon-csv {
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
  color: #2563eb;
}

.op-card-icon-zip {
  background: linear-gradient(135deg, #e0e7ff, #eef2ff);
  color: #6366f1;
}

.op-card-icon-history-zip {
  background: linear-gradient(135deg, #ede9fe, #f5f3ff);
  color: #7c3aed;
}

.op-card-icon-history-csv {
  background: linear-gradient(135deg, #e0f2fe, #f0f9ff);
  color: #0284c7;
}

.op-card-body {
  flex: 1;
  min-width: 0;
}

.op-card-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
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
</style>
