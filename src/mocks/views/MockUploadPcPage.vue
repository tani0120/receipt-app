<template>
  <div class="pc-upload" style="font-family: 'Noto Sans JP', sans-serif">

    <!-- 装飾背景 -->
    <div class="bg-deco bg-deco--1"></div>
    <div class="bg-deco bg-deco--2"></div>

    <!-- ポータル共通ヘッダー -->
    <PortalHeader :clientName="clientName" />

    <!-- 件数バッジ（ファイル追加時のみ表示） -->
    <div class="header-stats" v-if="totalCount > 0">
      <span class="stat-badge stat-ok" v-if="totalOk">✓ {{ totalOk }}</span>
      <span class="stat-badge stat-pending" v-if="totalPending">⏳ {{ totalPending }}</span>
      <span class="stat-badge stat-total">計 {{ totalCount }} 件</span>
    </div>

    <!-- 3カラム均等レイアウト -->
    <main class="pc-main">
      <div class="three-col">

        <!-- ① ファイルアップロード -->
        <div class="upload-lane">
          <div
            class="drop-zone"
            :class="{ 'drop-zone--active': dragging === 'journal' }"
            @dragover.prevent="dragging = 'journal'"
            @dragleave.prevent="dragging = null"
            @drop.prevent="handleDrop($event, 'journal')"
          >
            <div class="drop-icon-circle"><i class="drop-icon-emoji">📸</i></div>
            <h3 class="drop-title">ファイルをここにドラッグ＆ドロップ</h3>
            <p class="drop-or">または</p>
            <button class="drop-select-btn" @click.stop="openPicker('journal')">ファイルを選択</button>
          </div>
          <div class="file-list" v-if="files.journal.length">
            <div
              v-for="(f, i) in files.journal"
              :key="f.id"
              class="file-item"
              :class="{ 'file-item--selected': selectedFileId === f.id }"
              @click="selectFile(f)"
            >
              <div class="file-icon" :class="fileIconClass(f.file.name)">{{ fileIconEmoji(f.file.name) }}</div>
              <div class="file-info">
                <p class="file-name">{{ f.file.name }}</p>
                <p class="file-size">{{ formatSize(f.file.size) }}</p>
                <!-- classify結果バッジ -->
                <!-- 重複バッジ -->
                <div v-if="f.isDuplicate" class="classify-badges">
                  <span class="badge badge--warning">⚠ 重複の可能性があります</span>
                </div>
                <div class="classify-badges" v-if="f.classifyStatus && !f.isDuplicate">
                  <span v-if="f.classifyStatus === 'loading'" class="badge badge--loading">⏳ 分類中...</span>
                  <span v-else-if="f.classifyStatus === 'error'" class="badge badge--error">❌ {{ f.errorReason ?? '失敗' }}</span>
                  <template v-else-if="f.classifyStatus === 'done' && f.result?.supplementary">
                    <span class="badge badge--supplementary">📎 補助対象ファイルです。</span>
                  </template>
                  <template v-else-if="f.classifyStatus === 'done'">
                    <span v-if="f.result?.warning" class="badge badge--warning">⚠ {{ f.result.warning }}</span>
                    <span v-if="f.result?.metrics?.source_type" class="badge badge--type" :class="'badge--mode-' + (f.result.metrics.processing_mode ?? 'auto')">{{ sourceTypeLabel(f.result.metrics.source_type) }}</span>
                    <span v-if="f.result?.lineItems?.length" class="badge badge--lines">📊 {{ f.result.lineItems.length }}行</span>
                    <span v-if="f.result?.vendor" class="badge badge--issuer">{{ f.result.vendor }}</span>
                    <span v-if="f.result?.amount" class="badge badge--amount">¥{{ f.result.amount.toLocaleString() }}</span>
                    <span v-if="f.result?.date" class="badge badge--date">{{ f.result.date }}</span>
                    <span v-if="f.result?.metrics" class="badge badge--time">{{ f.result.metrics.duration_seconds }}秒 / ¥{{ f.result.metrics.cost_yen.toFixed(2) }}</span>
                  </template>
                </div>
              </div>
              <button class="file-remove" @click.stop="removeFile('journal', i)">✕</button>
            </div>
          </div>
          <input ref="journalInput" type="file" multiple class="hidden-input" @change="handleFileSelect($event, 'journal')" />
        </div>

        <!-- ② プレビューパネル -->
        <div class="preview-panel">
          <div v-if="!selectedFile" class="preview-empty">
            <div class="preview-empty-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="10" width="36" height="28" rx="4" stroke="#cbd5e1" stroke-width="2" fill="none"/>
                <circle cx="18" cy="22" r="4" stroke="#cbd5e1" stroke-width="2" fill="none"/>
                <path d="M6 32 L18 24 L26 30 L34 20 L42 28" stroke="#cbd5e1" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p class="preview-empty-text">ファイルを選択またはドロップすると<br>プレビューが表示されます</p>
          </div>
          <template v-else>
            <div class="preview-header">
              <p class="preview-filename">{{ selectedFile.file.name }}</p>
              <button class="preview-close" @click="selectedFileId = null">✕</button>
            </div>
            <div class="preview-body">
              <img
                v-if="isImageFile(selectedFile.file.name)"
                :src="selectedFileUrl"
                class="preview-image"
                :alt="selectedFile.file.name"
              />
              <iframe
                v-else-if="isPdfFile(selectedFile.file.name)"
                :src="selectedFileUrl"
                class="preview-pdf"
              ></iframe>
              <div v-else class="preview-unsupported">
                <div class="preview-unsupported-icon">📄</div>
                <p>このファイル形式のプレビューには対応していません</p>
              </div>
            </div>
          </template>
        </div>



      </div>
    </main>

    <!-- 底部固定ボタン -->
    <footer class="pc-footer" v-if="totalCount > 0">
      <div class="footer-inner">
        <div class="footer-summary">
        <span>合計: <strong>{{ files.journal.length }}</strong>件</span>
        </div>
        <button class="submit-btn" @click="handleSubmit">
          📤 {{ totalCount }}件をアップロード
        </button>
      </div>
    </footer>

    <!-- 完了モーダル -->
    <transition name="modal">
      <div v-if="showComplete" class="modal-overlay" @click.self="showComplete = false">
        <div class="modal-content">
          <div class="modal-emoji">🎉</div>
          <h2 class="modal-title">アップロード完了！</h2>
          <p class="modal-desc">
            <strong>{{ submittedCount }}件</strong>のファイルを受け付けました。
          </p>
          <button class="modal-btn" @click="resetAll">続けてアップロード</button>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import PortalHeader from '@/mocks/components/PortalHeader.vue'
import { useClients } from '@/features/client-management/composables/useClients'
import { analyzeReceipt, type ReceiptAnalysisResult, type AnalyzeOptions } from '@/mocks/services/receiptService'

const route = useRoute()
const clientId = route.params.clientId as string
const { clients } = useClients()
const clientName = clients.value.find(c => c.clientId === clientId)?.companyName ?? clientId
// route.nameから権限（role）・端末（device）を導出
const role = String(route.name ?? '').toLowerCase().includes('guest') ? 'guest' : 'staff'
const device = String(route.name ?? '').toLowerCase().includes('mobile') ? 'mobile' : 'pc'
const analyzeOpts: AnalyzeOptions = { clientId, role, device }

type Category = 'journal'

interface FileEntry {
  id: string
  documentId: string   // 証票ID（crypto.randomUUID()。Supabase時はUUID PK）
  file: File
  classifyStatus?: 'loading' | 'done' | 'error'
  errorReason?: string | null
  result?: ReceiptAnalysisResult
  isDuplicate: boolean
  hash: string | null
}

// SHA-256重複チェック用
const knownHashes = ref<Set<string>>(new Set())

const dragging = ref<Category | null>(null)
const showComplete = ref(false)
const submittedCount = ref(0)

// プレビュー用
const selectedFileId = ref<string | null>(null)
const selectedFileUrl = ref<string | null>(null)

const selectedFile = computed(() =>
  selectedFileId.value
    ? files.value.journal.find(f => f.id === selectedFileId.value) ?? null
    : null
)

const selectFile = (entry: FileEntry) => {
  // 前のオブジェクトURLを破棄
  if (selectedFileUrl.value) URL.revokeObjectURL(selectedFileUrl.value)
  selectedFileId.value = entry.id
  selectedFileUrl.value = URL.createObjectURL(entry.file)
}

const isImageFile = (name: string) => /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(name)
const isPdfFile = (name: string) => /\.pdf$/i.test(name)

const fileIconEmoji = (name: string) => {
  if (isPdfFile(name)) return '📄'
  if (isImageFile(name)) return '🖼'
  if (/\.(csv|xlsx?)$/i.test(name)) return '📊'
  return '📎'
}
const fileIconClass = (name: string) => {
  if (isPdfFile(name)) return 'file-icon--doc'
  if (isImageFile(name)) return 'file-icon--img'
  if (/\.(csv|xlsx?)$/i.test(name)) return 'file-icon--csv'
  return 'file-icon--img'
}

const files = ref<Record<Category, FileEntry[]>>({
  journal: [],
})

const journalInput = ref<HTMLInputElement>()

const totalCount = computed(() =>
  files.value.journal.length
)
const totalOk = computed(() =>
  files.value.journal.filter(f => f.classifyStatus === 'done').length
)
const totalPending = computed(() =>
  files.value.journal.filter(f => f.classifyStatus === 'loading').length
)

const openPicker = (_cat: Category) => {
  journalInput.value?.click()
}

const addFiles = (cat: Category, fileList: File[]) => {
  const entries: FileEntry[] = fileList.map(f => ({
    id: `f-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    documentId: crypto.randomUUID(),
    file: f,
    isDuplicate: false,
    hash: null,
  }))
  files.value[cat].push(...entries)

  // journal画像はclassify APIを自動呼び出し + 重複チェック
  // ※ push後にプロキシ化された参照をIDで検索して渡す（リアクティビティ確保）
  if (cat === 'journal') {
    for (const e of entries) {
      const proxy = files.value[cat].find(f => f.id === e.id)
      if (proxy) {
        classifyFile(proxy)
        computeHash(proxy)
      }
    }
  }
}

// ===== SHA-256 重複チェック =====
const computeHash = async (item: FileEntry) => {
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

/** analyzeReceiptを使ってclassify + バリデーション */
const classifyFile = async (entry: FileEntry) => {
  entry.classifyStatus = 'loading'
  try {
    const result = await analyzeReceipt(entry.file, { ...analyzeOpts, documentId: entry.documentId })
    entry.result = result
    if (result.ok) {
      entry.classifyStatus = 'done'
    } else {
      entry.classifyStatus = 'error'
      entry.errorReason = result.errorReason
    }
  } catch (err) {
    console.error('[classify] 失敗:', entry.file.name, err)
    entry.classifyStatus = 'error'
    entry.errorReason = '通信エラー'
  }
}

// ラベル変換
const SOURCE_TYPE_LABELS: Record<string, string> = {
  receipt: '領収書', invoice_received: '請求書', tax_payment: '納付書',
  journal_voucher: '振替伝票', bank_statement: '通帳', credit_card: 'クレカ',
  cash_ledger: '現金出納帳', invoice_issued: '発行請求書', receipt_issued: '発行領収書',
  non_journal: '仕訳対象外', supplementary_doc: '補助資料', other: 'その他',
}
const sourceTypeLabel = (v: string) => SOURCE_TYPE_LABELS[v] ?? v

const handleDrop = (e: DragEvent, cat: Category) => {
  dragging.value = null
  const dropped = Array.from(e.dataTransfer?.files ?? [])
  if (dropped.length) addFiles(cat, dropped)
}

const handleFileSelect = (e: Event, cat: Category) => {
  const selected = Array.from((e.target as HTMLInputElement).files ?? [])
  if (selected.length) addFiles(cat, selected)
  ;(e.target as HTMLInputElement).value = ''
}

const removeFile = (cat: Category, idx: number) => {
  const removed = files.value[cat][idx]
  if (removed && removed.id === selectedFileId.value) {
    if (selectedFileUrl.value) URL.revokeObjectURL(selectedFileUrl.value)
    selectedFileId.value = null
    selectedFileUrl.value = null
  }
  files.value[cat].splice(idx, 1)
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const handleSubmit = () => {
  submittedCount.value = totalCount.value
  showComplete.value = true
}

const resetAll = () => {
  files.value = { journal: [], other: [] }
  showComplete.value = false
}
</script>

<style scoped>
/* ===== classify結果バッジ ===== */
.classify-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.badge--loading {
  background: #fff3cd;
  color: #856404;
  animation: pulse 1.5s infinite;
}
.badge--error {
  background: #f8d7da;
  color: #721c24;
}
.badge--supplementary {
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 700;
}
.badge--type {
  color: #fff;
}
.badge--mode-auto {
  background: linear-gradient(135deg, #667eea, #764ba2);
}
.badge--mode-manual {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}
.badge--mode-excluded {
  background: #6c757d;
}
.badge--dir {
  background: #e3f2fd;
  color: #1565c0;
}
.badge--conf {
  font-weight: 700;
}
.conf-high { background: #d4edda; color: #155724; }
.conf-mid  { background: #fff3cd; color: #856404; }
.conf-low  { background: #f8d7da; color: #721c24; }
.badge--issuer {
  background: #f0f0f0;
  color: #333;
}
.badge--amount {
  background: #e8f5e9;
  color: #2e7d32;
  font-weight: 700;
}
.badge--time {
  background: #f5f5f5;
  color: #999;
  font-size: 10px;
}
.badge--lines {
  background: #ede9fe;
  color: #6d28d9;
  font-weight: 700;
}
.badge--warning {
  background: #fff7ed;
  color: #c2410c;
  font-weight: 700;
  border: 1px solid #fed7aa;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ===== ページ全体 ===== */
.pc-upload {
  height: 100%;
  overflow-y: auto;
  background: #fff;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 装飾背景 */
.bg-deco {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}
.bg-deco--1 {
  top: -60px; right: -60px;
  width: 320px; height: 320px;
  background: radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%);
}
.bg-deco--2 {
  bottom: 80px; left: -80px;
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%);
}



/* ===== 件数バッジ ===== */
.header-stats {
  position: absolute;
  top: 56px; right: 24px;
  z-index: 30;
  display: flex; gap: 6px;
}
.stat-badge {
  font-size: 10px; font-weight: 700;
  padding: 3px 10px; border-radius: 12px;
}
.stat-ok { background: #dcfce7; color: #166534; }
.stat-pending { background: #fef3c7; color: #92400e; }
.stat-total { background: #f1f5f9; color: #64748b; }

/* ===== メイン ===== */
.pc-main {
  flex: 1; position: relative; z-index: 1;
  max-width: 1440px; margin: 0 auto; width: 100%;
  padding: 80px 24px 120px;
}


.three-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 960px) {
  .three-col { grid-template-columns: 1fr; }
}

/* ===== レーン（各カテゴリ） ===== */
.upload-lane {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02);
  overflow: hidden;
  transition: box-shadow 0.2s;
}
.upload-lane:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.07);
}

/* ===== プレビューパネル ===== */
.preview-panel {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02);
  overflow: hidden;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 80px;
}
.preview-empty {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 40px;
  color: #94a3b8;
}
.preview-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}
.preview-empty-text {
  font-size: 13px;
  text-align: center;
  line-height: 1.6;
  margin: 0;
}
.preview-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}
.preview-filename {
  font-size: 12px; font-weight: 700; color: #334155;
  margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  flex: 1;
}
.preview-close {
  width: 24px; height: 24px;
  border-radius: 6px; border: none;
  background: transparent; color: #94a3b8;
  font-size: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-left: 8px;
}
.preview-close:hover { background: #fee2e2; color: #ef4444; }
.preview-body {
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  background: #fafafa;
  min-height: 350px;
}
.preview-image {
  max-width: 100%; max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.preview-pdf {
  width: 100%; height: 70vh;
  border: none; border-radius: 8px;
}
.preview-unsupported {
  text-align: center; color: #94a3b8;
  font-size: 13px;
}
.preview-unsupported-icon {
  font-size: 48px; margin-bottom: 12px; opacity: 0.5;
}

/* ===== ドロップゾーン（ScreenG準拠） ===== */
.drop-zone {
  margin: 16px;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 32px 16px;
  text-align: center;
  transition: all 0.25s ease;
  background: #fff;
}
.drop-zone:hover {
  border-color: #93c5fd;
  background: #f0f7ff;
}
.drop-zone--active {
  border-color: #22c55e;
  background: #f0fdf4;
}

/* 丸アイコン */
.drop-icon-circle {
  width: 64px; height: 64px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px;
  transition: transform 0.3s ease, background 0.3s ease;
}
.drop-zone:hover .drop-icon-circle {
  transform: scale(1.08);
  background: #e0f2fe;
}
.drop-icon-emoji {
  font-size: 26px;
  font-style: normal;
  line-height: 1;
}

.drop-title {
  font-size: 14px; font-weight: 700; color: #374151;
  margin: 0 0 4px;
}
.drop-or {
  font-size: 11px; color: #9ca3af;
  margin: 0 0 12px;
}

/* 黒ボタン（ScreenGと同じ） */
.drop-select-btn {
  display: inline-block;
  background: #1e293b;
  color: #fff;
  padding: 8px 24px;
  border-radius: 20px;
  border: none;
  font-size: 12px; font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}
.drop-select-btn:hover {
  background: #334155;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.drop-formats {
  font-size: 10px; color: #9ca3af;
  margin: 14px 0 0;
}

/* ===== ファイルリスト ===== */
.file-list {
  padding: 0 16px 16px;
  display: flex; flex-direction: column; gap: 6px;
}
.file-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.2s;
  animation: fileSlideIn 0.3s ease;
  cursor: pointer;
}
.file-item:hover { background: #f1f5f9; }
.file-item--selected {
  background: #eff6ff;
  border-color: #93c5fd;
  box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
}
@keyframes fileSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.file-icon {
  width: 32px; height: 32px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
}
.file-icon--img { background: #dbeafe; }
.file-icon--doc { background: #dcfce7; }
.file-icon--csv { background: #fef9c3; }
.file-info { flex: 1; min-width: 0; }
.file-name {
  font-size: 11px; font-weight: 600; color: #334155;
  margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.file-size { font-size: 9px; color: #94a3b8; margin: 2px 0 0; }
.file-remove {
  width: 24px; height: 24px;
  border-radius: 6px; border: none;
  background: transparent; color: #cbd5e1;
  font-size: 12px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.file-remove:hover { background: #fee2e2; color: #ef4444; }

.hidden-input { display: none; }

/* ===== フッター ===== */
.pc-footer {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid #e2e8f0;
  z-index: 20;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
}
.footer-inner {
  max-width: 1440px; margin: 0 auto;
  padding: 14px 24px;
  display: flex; align-items: center; justify-content: space-between;
}
.footer-summary {
  display: flex; gap: 16px;
  font-size: 12px; color: #64748b;
}
.footer-summary strong { color: #1e293b; font-weight: 800; }
.submit-btn {
  padding: 12px 32px;
  border-radius: 12px; border: none;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff; font-size: 14px; font-weight: 800;
  cursor: pointer; font-family: inherit;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(37,99,235,0.3);
}
.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37,99,235,0.4);
}
.submit-btn:active { transform: scale(0.97); }

/* ===== モーダル ===== */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 50;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.modal-content {
  background: #fff;
  border-radius: 24px;
  padding: 40px;
  max-width: 420px; width: 100%;
  text-align: center;
  box-shadow: 0 25px 50px rgba(0,0,0,0.15);
}
.modal-emoji { font-size: 56px; margin-bottom: 16px; }
.modal-title { font-size: 20px; font-weight: 800; color: #1e293b; margin: 0 0 8px; }
.modal-desc { font-size: 14px; color: #64748b; margin: 0 0 24px; }
.modal-desc strong { color: #3b82f6; }
.modal-btn {
  width: 100%; padding: 14px;
  border-radius: 14px; border: none;
  background: #3b82f6; color: #fff;
  font-size: 14px; font-weight: 700;
  cursor: pointer; font-family: inherit;
  transition: background 0.2s;
}
.modal-btn:hover { background: #2563eb; }

/* トランジション */
.modal-enter-active,
.modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
.modal-enter-from .modal-content,
.modal-leave-to .modal-content { transform: scale(0.9) translateY(20px); }
</style>
