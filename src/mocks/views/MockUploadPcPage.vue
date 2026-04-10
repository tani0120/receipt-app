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

        <!-- ① 仕訳用 -->
        <div class="upload-lane">
          <div class="lane-header lane-header--journal">
            <h2 class="lane-title">◆仕訳用画像・PDF専用</h2>
            <p class="lane-desc">領収書・請求書・通帳・クレカ明細　★画像・PDF専用</p>
          </div>
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
            <p class="drop-formats">対応形式: JPEG / PNG / HEIC / PDF</p>
          </div>
          <div class="file-list" v-if="files.journal.length">
            <div v-for="(f, i) in files.journal" :key="f.id" class="file-item">
              <div class="file-icon file-icon--img">🖼</div>
              <div class="file-info">
                <p class="file-name">{{ f.file.name }}</p>
                <p class="file-size">{{ formatSize(f.file.size) }}</p>
              </div>
              <button class="file-remove" @click="removeFile('journal', i)">✕</button>
            </div>
          </div>
          <input ref="journalInput" type="file" accept="image/*,.pdf" multiple class="hidden-input" @change="handleFileSelect($event, 'journal')" />
        </div>

        <!-- ② その他 -->
        <div class="upload-lane">
          <div class="lane-header lane-header--other">
            <h2 class="lane-title">◆それ以外（CSV・エクセル・謄本や税務届等）</h2>
            <p class="lane-desc">すべてのCSV、エクセル形式ファイル、謄本や定款等</p>
          </div>
          <div
            class="drop-zone"
            :class="{ 'drop-zone--active': dragging === 'other' }"
            @dragover.prevent="dragging = 'other'"
            @dragleave.prevent="dragging = null"
            @drop.prevent="handleDrop($event, 'other')"
          >
            <div class="drop-icon-circle"><i class="drop-icon-emoji">📎</i></div>
            <h3 class="drop-title">ファイルをここにドラッグ＆ドロップ</h3>
            <p class="drop-or">または</p>
            <button class="drop-select-btn" @click.stop="openPicker('other')">ファイルを選択</button>
            <p class="drop-formats">対応形式: PDF / 画像 / CSV / Excel / Word</p>
          </div>
          <div class="file-list" v-if="files.other.length">
            <div v-for="(f, i) in files.other" :key="f.id" class="file-item">
              <div class="file-icon file-icon--doc">📄</div>
              <div class="file-info">
                <p class="file-name">{{ f.file.name }}</p>
                <p class="file-size">{{ formatSize(f.file.size) }}</p>
              </div>
              <button class="file-remove" @click="removeFile('other', i)">✕</button>
            </div>
          </div>
          <input ref="otherInput" type="file" multiple class="hidden-input" @change="handleFileSelect($event, 'other')" />
        </div>



      </div>
    </main>

    <!-- 底部固定ボタン -->
    <footer class="pc-footer" v-if="totalCount > 0">
      <div class="footer-inner">
        <div class="footer-summary">
          <span>仕訳用: <strong>{{ files.journal.length }}</strong>件</span>
          <span>その他: <strong>{{ files.other.length }}</strong>件</span>
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
import { getClientName } from '@/mocks/data/clientNames'

const route = useRoute()
const clientId = route.params.clientId as string
const clientName = getClientName(clientId)

type Category = 'journal' | 'other'

interface FileEntry {
  id: string
  file: File
}

const dragging = ref<Category | null>(null)
const showComplete = ref(false)
const submittedCount = ref(0)

const files = ref<Record<Category, FileEntry[]>>({
  journal: [],
  other: [],
})

const journalInput = ref<HTMLInputElement>()
const otherInput = ref<HTMLInputElement>()

const totalCount = computed(() =>
  files.value.journal.length + files.value.other.length
)
const totalOk = computed(() => totalCount.value) // モック: 全件OK扱い
const totalPending = computed(() => 0)

const openPicker = (cat: Category) => {
  if (cat === 'journal') journalInput.value?.click()
  else otherInput.value?.click()
}

const addFiles = (cat: Category, fileList: File[]) => {
  const entries: FileEntry[] = fileList.map(f => ({
    id: `f-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file: f,
  }))
  files.value[cat].push(...entries)
}

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

/* レーンヘッダー */
.lane-header {
  display: flex; flex-direction: column; gap: 2px;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}
.lane-title {
  font-size: 14px; font-weight: 900; color: #0f172a;
  margin: 0; letter-spacing: 0.01em;
}
.lane-desc {
  font-size: 12px; color: #475569; margin: 0; font-weight: 500;
}

.lane-header--journal { background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%); }
.lane-header--other   { background: linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%); }
.lane-header--csv     { background: linear-gradient(135deg, #fefce8 0%, #f8fafc 100%); }

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
  transition: background 0.2s;
  animation: fileSlideIn 0.3s ease;
}
.file-item:hover { background: #f1f5f9; }
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
