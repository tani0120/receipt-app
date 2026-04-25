<template>
  <div class="history-import-page" style="font-family: 'Noto Sans JP', sans-serif">
    <div class="history-import-container">

      <!-- ヘッダー -->
      <header class="history-import-header">
        <div class="header-icon">📋</div>
        <div>
          <h1 class="header-title">過去仕訳の取込</h1>
          <p class="header-sub">MF仕訳帳CSVをアップロードすると、新規証票の仕訳時に過去の仕訳パターンを参照できます</p>
        </div>
      </header>

      <!-- メインコンテンツ: 2カラム -->
      <div class="history-import-grid">

        <!-- 左カラム: アップロード -->
        <div class="upload-area">
          <div class="upload-card">
            <h2 class="card-title"><i class="fa-solid fa-cloud-arrow-up"></i> CSVファイルをアップロード</h2>

            <div
              class="dropzone"
              :class="{ 'dropzone--dragging': isDragging }"
              @drop.prevent="handleDrop"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
            >
              <input ref="fileInput" type="file" class="hidden" accept=".csv" @change="handleFileSelect" />
              <div v-if="!uploadedFile" class="dropzone-empty">
                <div class="dropzone-icon-wrapper">
                  <i class="fa-solid fa-file-csv dropzone-icon"></i>
                </div>
                <p class="dropzone-title">過去仕訳CSV（MF仕訳帳エクスポート）</p>
                <p class="dropzone-desc">ドラッグ＆ドロップ または</p>
                <button class="dropzone-browse" @click="($refs.fileInput as HTMLInputElement).click()">
                  <i class="fa-solid fa-folder-open"></i> ファイルを選択
                </button>
                <p class="dropzone-hint">※ マネーフォワードの「仕訳帳」→「エクスポート」で取得したCSVに対応</p>
              </div>

              <div v-else class="dropzone-uploaded">
                <div class="uploaded-file-info">
                  <div class="uploaded-file-icon">
                    <i class="fa-solid fa-file-csv"></i>
                  </div>
                  <div>
                    <p class="uploaded-file-name">{{ uploadedFile.name }}</p>
                    <p class="uploaded-file-meta">
                      {{ formatFileSize(uploadedFile.size) }} ・
                      <strong>{{ rowCount }}件</strong>の仕訳データ
                    </p>
                  </div>
                </div>
                <div class="uploaded-actions">
                  <button class="btn-import" @click="executeImport" :disabled="isImporting">
                    <i class="fa-solid fa-database"></i>
                    {{ isImporting ? '取込中...' : '取込実行' }}
                  </button>
                  <button class="btn-remove" @click="removeFile" title="削除">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- 注意事項 -->
            <div class="notice-box">
              <h3 class="notice-title"><i class="fa-solid fa-circle-info"></i> 取り込み手順</h3>
              <ol class="notice-steps">
                <li>マネーフォワードにログイン</li>
                <li>「会計帳簿」→「仕訳帳」を開く</li>
                <li>対象期間を設定し「エクスポート」をクリック</li>
                <li>ダウンロードしたCSVをこの画面にアップロード</li>
              </ol>
            </div>
          </div>
        </div>

        <!-- 右カラム: 取込済みデータ -->
        <div class="history-area">
          <div class="history-card">
            <h2 class="card-title"><i class="fa-solid fa-clock-rotate-left"></i> 取込済みデータ</h2>

            <div v-if="importedFiles.length === 0" class="history-empty">
              <i class="fa-solid fa-inbox history-empty-icon"></i>
              <p class="history-empty-text">まだ過去仕訳データがありません</p>
              <p class="history-empty-sub">CSVをアップロードすると、ここに取込履歴が表示されます</p>
            </div>

            <div v-else class="history-list">
              <div v-for="item in importedFiles" :key="item.id" class="history-item">
                <div class="history-item-info">
                  <div class="history-item-icon">
                    <i class="fa-solid fa-check-circle"></i>
                  </div>
                  <div>
                    <p class="history-item-name">{{ item.fileName }}</p>
                    <p class="history-item-meta">
                      {{ item.rowCount }}件 ・ {{ item.importedAt }}
                    </p>
                  </div>
                </div>
                <button class="history-item-delete" @click="removeImported(item.id)" title="削除">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>

            <!-- 統計サマリー -->
            <div v-if="importedFiles.length > 0" class="history-summary">
              <div class="summary-item">
                <span class="summary-label">総仕訳数</span>
                <span class="summary-value">{{ totalRows }}件</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">ファイル数</span>
                <span class="summary-value">{{ importedFiles.length }}件</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 状態
const isDragging = ref(false)
const uploadedFile = ref<File | null>(null)
const rowCount = ref(0)
const isImporting = ref(false)

// 取込済みデータ
interface ImportedFile {
  id: string
  fileName: string
  rowCount: number
  importedAt: string
}
const importedFiles = ref<ImportedFile[]>([])

const totalRows = computed(() => importedFiles.value.reduce((sum, f) => sum + f.rowCount, 0))

// ファイルサイズフォーマット
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// CSVパース（行数カウント）
const processFile = async (file: File) => {
  if (!file.name.endsWith('.csv')) {
    alert('CSVファイルを選択してください')
    return
  }
  const text = await file.text()
  const lines = text.split('\n').filter(l => l.trim())
  rowCount.value = Math.max(0, lines.length - 1)
  uploadedFile.value = file
}

// ドラッグ&ドロップ
const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0 && files[0]) {
    processFile(files[0])
  }
}

// ファイル選択
const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0 && target.files[0]) {
    processFile(target.files[0])
  }
}

// ファイル削除
const removeFile = () => {
  uploadedFile.value = null
  rowCount.value = 0
}

// 取込実行
const executeImport = async () => {
  if (!uploadedFile.value) return
  isImporting.value = true

  // TODO: 実際のパース＆保存ロジックをここに実装
  await new Promise(resolve => setTimeout(resolve, 1500))

  const now = new Date()
  const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  importedFiles.value.unshift({
    id: crypto.randomUUID(),
    fileName: uploadedFile.value.name,
    rowCount: rowCount.value,
    importedAt: timestamp,
  })

  uploadedFile.value = null
  rowCount.value = 0
  isImporting.value = false
}

// 取込済みデータ削除
const removeImported = (id: string) => {
  if (confirm('この取込データを削除しますか？')) {
    importedFiles.value = importedFiles.value.filter(f => f.id !== id)
  }
}
</script>

<style scoped>
.history-import-page {
  height: 100%;
  overflow-y: auto;
  background: linear-gradient(160deg, #f8fafc 0%, #f0f4f8 40%, #faf5f0 100%);
}

.history-import-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

/* ヘッダー */
.history-import-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
}
.header-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 14px;
  flex-shrink: 0;
}
.header-title {
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 4px;
}
.header-sub {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

/* グリッド */
.history-import-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 900px) {
  .history-import-grid { grid-template-columns: 1fr; }
}

/* カード共通 */
.upload-card, .history-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
}
.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-title i {
  color: #f59e0b;
}

/* ドロップゾーン */
.hidden { display: none; }
.dropzone {
  border: 2px dashed #d1d5db;
  border-radius: 14px;
  padding: 28px 20px;
  transition: all 0.25s ease;
  background: #fafafa;
}
.dropzone--dragging {
  border-color: #f59e0b;
  background: #fffbeb;
  transform: scale(1.01);
}
.dropzone-empty {
  text-align: center;
}
.dropzone-icon-wrapper {
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dropzone-icon {
  font-size: 24px;
  color: #92400e;
}
.dropzone-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px;
}
.dropzone-desc {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 10px;
}
.dropzone-browse {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  font-size: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.dropzone-browse:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}
.dropzone-hint {
  font-size: 10px;
  color: #94a3b8;
  margin: 12px 0 0;
}

/* アップロード済み */
.dropzone-uploaded {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.uploaded-file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.uploaded-file-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #dbeafe, #93c5fd);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #1e40af;
}
.uploaded-file-name {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.uploaded-file-meta {
  font-size: 11px;
  color: #64748b;
  margin: 3px 0 0;
}
.uploaded-actions {
  display: flex;
  gap: 8px;
}
.btn-import {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  font-size: 13px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-import:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}
.btn-import:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.btn-remove {
  padding: 10px 14px;
  border-radius: 10px;
  background: none;
  border: 1px solid #e2e8f0;
  color: #94a3b8;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-remove:hover {
  color: #ef4444;
  border-color: #fecaca;
  background: #fef2f2;
}

/* 注意事項 */
.notice-box {
  margin-top: 16px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid #93c5fd;
  border-radius: 12px;
}
.notice-title {
  font-size: 12px;
  font-weight: 700;
  color: #1e40af;
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.notice-steps {
  margin: 0;
  padding: 0 0 0 18px;
  font-size: 11px;
  color: #1e40af;
  line-height: 1.9;
}

/* 取込済みデータ */
.history-empty {
  text-align: center;
  padding: 40px 20px;
}
.history-empty-icon {
  font-size: 40px;
  color: #d1d5db;
  margin-bottom: 12px;
}
.history-empty-text {
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
  margin: 0 0 4px;
}
.history-empty-sub {
  font-size: 11px;
  color: #cbd5e1;
  margin: 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.15s;
}
.history-item:hover {
  border-color: #93c5fd;
  background: #f0f7ff;
}
.history-item-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.history-item-icon {
  color: #22c55e;
  font-size: 16px;
}
.history-item-name {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.history-item-meta {
  font-size: 10px;
  color: #64748b;
  margin: 2px 0 0;
}
.history-item-delete {
  background: none;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  padding: 4px;
  transition: color 0.15s;
  font-size: 12px;
}
.history-item-delete:hover {
  color: #ef4444;
}

/* 統計サマリー */
.history-summary {
  display: flex;
  gap: 12px;
  margin-top: 14px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 1px solid #bbf7d0;
  border-radius: 10px;
}
.summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.summary-label {
  font-size: 10px;
  color: #166534;
  font-weight: 600;
}
.summary-value {
  font-size: 16px;
  font-weight: 800;
  color: #15803d;
}
</style>
