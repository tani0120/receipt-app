<template>
  <div class="upload-unified" style="font-family: 'Noto Sans JP', sans-serif">

    <!-- ===== PC: PortalHeader（CSS制御） ===== -->
    <div class="pc-only">
      <PortalHeader :clientName="clientName" />
    </div>

    <!-- ===== モバイル: ヘッダー（CSS制御） ===== -->
    <header class="mobile-header mobile-only">
      <div class="mobile-header-inner">
        <div class="mobile-header-left">
          <h1 class="mobile-header-title">📄 領収書を送る</h1>
          <p class="mobile-header-sub">{{ clientId }} ／ {{ monthLabel }}</p>
        </div>
        <div class="mobile-header-badges">
          <span v-if="counts.ok" class="m-badge m-badge--ok">✓ {{ counts.ok }}</span>
          <span v-if="counts.error" class="m-badge m-badge--error">✗ {{ counts.error }}</span>
          <span v-if="counts.processing" class="m-badge m-badge--processing">⏳ {{ counts.processing }}</span>
          <span v-if="entries.length" class="m-badge m-badge--total">計 {{ entries.length }} 枚</span>
        </div>
      </div>
    </header>

    <!-- ===== PC: 件数バッジ（CSS制御） ===== -->
    <div class="header-stats pc-only" v-if="entries.length > 0">
      <span class="stat-badge stat-ok" v-if="counts.ok">✓ {{ counts.ok }}</span>
      <span class="stat-badge stat-pending" v-if="counts.processing">⏳ {{ counts.processing }}</span>
      <span class="stat-badge stat-total">計 {{ entries.length }} 件</span>
    </div>

    <!-- ===== メインコンテンツ ===== -->
    <main class="main-content">

      <!-- ========== PC版: 2カラム（CSS制御） ========== -->
      <div class="two-col pc-only">
        <!-- 左: ドロップ+リスト -->
        <div class="upload-lane">
          <div
            class="drop-zone"
            :class="{ 'drop-zone--active': dragging }"
            @dragover.prevent="dragging = true"
            @dragleave.prevent="dragging = false"
            @drop.prevent="handleDrop"
          >
            <div class="drop-icon-circle"><i class="drop-icon-emoji">📸</i></div>
            <h3 class="drop-title">ファイルをここにドラッグ＆ドロップ</h3>
            <p class="drop-or">または</p>
            <button class="drop-select-btn" @click.stop="fileInputRef?.click()">ファイルを選択</button>
          </div>
          <div class="file-list" v-if="entries.length">
            <div
              v-for="(f, i) in entries"
              :key="f.id"
              class="file-item badge-container"
              :class="{ 'file-item--selected': selectedId === f.id }"
              @click="selectFile(f)"
            >
              <div class="file-icon" :class="fileIconClass(f.file.name)">{{ fileIconEmoji(f.file.name) }}</div>
              <div class="file-info">
                <p class="file-name">{{ f.file.name }}</p>
                <p class="file-size">{{ formatSize(f.file.size) }}</p>
                <!-- 重複バッジ -->
                <div v-if="f.isDuplicate" class="classify-badges">
                  <span class="badge badge--warning">⚠ {{ MSG_DUPLICATE_DETAIL }}</span>
                </div>
                <div class="classify-badges" v-if="classifyBadgeVisible(f)">
                  <span v-if="f.status === 'uploading' || f.status === 'analyzing'" class="badge badge--loading">⏳ 分類中...</span>
                  <span v-else-if="f.status === 'error'" class="badge badge--error">❌ {{ f.errorReason ?? '失敗' }}</span>
                  <template v-else-if="f.status === 'ok' && f.supplementary">
                    <span class="badge badge--supplementary">📎 補助対象ファイルです。</span>
                  </template>
                  <template v-else-if="f.status === 'ok'">
                    <span v-if="f.warning" class="badge badge--warning">⚠ {{ f.warning }}</span>
                    <span v-if="f.metrics?.source_type" class="badge badge--type" :class="'badge--mode-' + (f.metrics.processing_mode ?? 'auto')">{{ sourceTypeLabel(f.metrics.source_type) }}</span>
                    <span v-if="f.lineItems?.length" class="badge badge--lines">📊 {{ f.lineItems.length }}行</span>
                    <span v-if="f.vendor" class="badge badge--issuer">{{ f.vendor }}</span>
                    <span v-if="f.amount" class="badge badge--amount">¥{{ f.amount.toLocaleString() }}</span>
                    <span v-if="f.date" class="badge badge--date">{{ f.date }}</span>
                    <span v-if="f.metrics" class="badge badge--time">{{ f.metrics.duration_seconds }}秒 / ¥{{ f.metrics.cost_yen.toFixed(2) }}</span>
                  </template>
                </div>
              </div>
              <button class="file-remove" @click.stop="removeFile(i)">✕</button>
            </div>
          </div>
        </div>

        <!-- 右: プレビュー -->
        <div class="preview-panel">
          <div v-if="!selectedEntry" class="preview-empty">
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
              <p class="preview-filename">{{ selectedEntry.file.name }}</p>
              <button class="preview-close" @click="selectedId = null">✕</button>
            </div>
            <div class="preview-body">
              <img v-if="isImageFile(selectedEntry.file.name)" :src="selectedUrl!" class="preview-image" :alt="selectedEntry.file.name" />
              <iframe v-else-if="isPdfFile(selectedEntry.file.name)" :src="selectedUrl!" class="preview-pdf"></iframe>
              <div v-else class="preview-unsupported">
                <div class="preview-unsupported-icon">📄</div>
                <p>このファイル形式のプレビューには対応していません</p>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- ========== モバイル版: カードグリッド（CSS制御） ========== -->
      <div class="mobile-section mobile-only">
        <!-- 空の状態 -->
        <div v-if="entries.length === 0" class="mobile-empty"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="handleDrop"
        >
          <div :class="['mobile-drop-zone', dragging ? 'mobile-drop-zone--active' : '']" @click="fileInputRef?.click()">
            <div class="mobile-drop-emoji">📸</div>
            <p class="mobile-drop-title">写真を選ぶ</p>
            <p class="mobile-drop-sub">タップして選択 / ドラッグ&ドロップ</p>
            <div class="mobile-drop-btns">
              <button class="mobile-btn-camera" @click.stop="cameraInputRef?.click()">📷 今撮る</button>
              <button class="mobile-btn-file" @click.stop="fileInputRef?.click()">🖼 選んで送る</button>
            </div>
          </div>
          <p class="mobile-drop-hint">200枚まで一括送信できます<br><span>JPEG / PNG / HEIC / WebP / PDF 対応</span></p>

          <!-- 説明カード -->
          <div class="mobile-howto">
            <div v-for="item in howToItems" :key="item.step" class="mobile-howto-card">
              <span class="mobile-howto-icon">{{ item.icon }}</span>
              <div>
                <p class="mobile-howto-title">{{ item.title }}</p>
                <p class="mobile-howto-desc">{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- カードグリッド -->
        <div v-else>
          <!-- 進捗バー -->
          <div class="mobile-progress">
            <div class="mobile-progress-header">
              <span>処理の進捗</span>
              <span>{{ counts.ok + counts.error }} / {{ entries.length }} 件完了</span>
            </div>
            <div class="mobile-progress-track">
              <div class="mobile-progress-bar" :class="counts.error > 0 ? 'bar--warn' : 'bar--ok'" :style="{ width: `${progressPct}%` }"></div>
            </div>
            <div class="mobile-progress-counts">
              <span class="count-ok">✅ OK: {{ counts.ok }}</span>
              <span v-if="counts.error" class="count-error">❌ NG: {{ counts.error }}</span>
              <span v-if="counts.processing" class="count-processing">⏳ 処理中: {{ counts.processing }}</span>
              <span v-if="counts.queued" class="count-queued">待機: {{ counts.queued }}</span>
            </div>
          </div>

          <!-- グリッド -->
          <div class="mobile-grid">
            <div
              v-for="(r, idx) in entries"
              :key="r.id"
              :class="['mobile-card', cardStatusClass(r)]"
              @click="r.status === 'error' ? triggerRetakeAndOpen(idx) : undefined"
            >
              <div class="mobile-card-thumb">
                <template v-if="r.file.type === 'application/pdf'">
                  <iframe :src="r.previewUrl" class="mobile-pdf-thumb" tabindex="-1"></iframe>
                </template>
                <img v-else :src="r.previewUrl" :alt="`領収書 ${idx + 1}`" class="mobile-card-img" loading="lazy" />

                <!-- オーバーレイ: 待機 -->
                <div v-if="r.status === 'queued'" class="overlay overlay--queued"><span>待機中</span></div>
                <!-- オーバーレイ: 処理中 -->
                <div v-if="r.status === 'uploading' || r.status === 'analyzing'" class="overlay overlay--processing">
                  <div class="spinner"></div>
                  <span>{{ r.status === 'uploading' ? '送信中...' : 'AI確認中...' }}</span>
                </div>
                <!-- OK -->
                <div v-if="r.status === 'ok'" class="overlay-ok-badge">✅</div>
                <!-- 重複 -->
                <div v-if="r.isDuplicate" class="overlay-dup">⚠ {{ MSG_DUPLICATE_SHORT }}</div>
                <!-- 警告 -->
                <div v-if="r.warning && !r.isDuplicate" class="overlay-warn">⚠ {{ r.warning }}</div>
                <!-- エラー -->
                <div v-if="r.status === 'error'" class="overlay overlay--error">
                  <span class="overlay-error-icon">📷</span>
                  <span class="overlay-error-text">{{ r.errorReason }}</span>
                  <span class="overlay-error-hint">タップで撮り直し</span>
                </div>
              </div>

              <!-- カード下部 -->
              <div class="mobile-card-footer">
                <template v-if="r.status === 'ok' && r.supplementary">
                  <p class="card-supplementary">補助対象ファイルです。</p>
                  <p class="card-filename">{{ r.file.name }}</p>
                </template>
                <template v-else-if="r.status === 'ok'">
                  <p v-if="r.sourceType" class="card-source-type">{{ sourceTypeLabel(r.sourceType) }}</p>
                  <template v-if="r.lineItemsCount > 0 && !r.vendor">
                    <p class="card-lines">{{ r.lineItemsCount }}行</p>
                  </template>
                  <template v-else>
                    <p v-if="r.vendor" class="card-vendor">{{ r.vendor }}</p>
                    <p v-if="r.amount" class="card-amount">¥{{ r.amount.toLocaleString() }}</p>
                    <p v-if="r.date" class="card-date">{{ r.date }}</p>
                  </template>
                </template>
                <template v-else>
                  <p class="card-idx">{{ idx + 1 }}</p>
                </template>
              </div>
            </div>

            <!-- 追加ボタン -->
            <div class="mobile-add-card">
              <button class="mobile-add-btn" @click.stop="cameraInputRef?.click()">
                <span>📷</span><span>撮る</span>
              </button>
              <div class="mobile-add-divider"></div>
              <button class="mobile-add-btn" @click.stop="fileInputRef?.click()">
                <span>🖼</span><span>選ぶ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ===== 底部固定: 送付ボタン ===== -->
    <footer v-if="entries.length > 0" class="footer-bar">
      <div class="footer-inner">
        <!-- ガイドメッセージ（モバイルのみCSS表示） -->
        <div class="guide-area mobile-only">
          <transition name="fade">
            <p v-if="guideMessage" class="guide-msg guide-msg--error">⚠ {{ guideMessage }}</p>
            <p v-else-if="counts.processing" class="guide-msg guide-msg--processing">AIが確認しています。しばらくお待ちください...</p>
            <p v-else-if="canConfirm" class="guide-msg guide-msg--ok">全件確認完了！送付できます ✅</p>
          </transition>
        </div>
        <!-- PC: サマリー -->
        <div class="footer-summary pc-only">
          <span>合計: <strong>{{ entries.length }}</strong>件</span>
        </div>
        <!-- 共通: 送付ボタン -->
        <button
          :disabled="!canConfirm"
          :class="['submit-btn', canConfirm ? 'submit-btn--active' : 'submit-btn--disabled']"
          @click="handleConfirm"
        >
          <span class="pc-only">📤 {{ entries.length }}件をアップロード</span>
          <span class="mobile-only">{{ confirmLabel }}</span>
        </button>
      </div>
    </footer>

    <!-- ===== 完了モーダル ===== -->
    <transition name="modal">
      <div v-if="showComplete" class="modal-overlay" @click.self="showComplete = false">
        <div class="modal-content">
          <div class="modal-emoji">🎉</div>
          <h2 class="modal-title">アップロード完了！</h2>
          <p class="modal-desc">
            <strong>{{ confirmedCount }}件</strong>のファイルを受け付けました。
          </p>
          <button class="modal-btn" @click="resetAll">続けてアップロード</button>
        </div>
      </div>
    </transition>

    <!-- 隠しinput -->
    <input ref="fileInputRef" type="file" multiple class="hidden-input" @change="handleFileInput" />
    <input ref="cameraInputRef" type="file" capture="environment" class="hidden-input" @change="handleCameraInput" />
    <input ref="retakeInputRef" type="file" class="hidden-input" @change="handleRetakeInput" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PortalHeader from '@/mocks/components/PortalHeader.vue'
import { useClients } from '@/features/client-management/composables/useClients'
import {
  useUpload,
  sourceTypeLabel,
  formatSize,
  isImageFile,
  isPdfFile,
  fileIconEmoji,
  fileIconClass,
} from '@/mocks/composables/useUpload'
import type { UploadEntry } from '@/mocks/composables/useUpload'
import { MSG_DUPLICATE_DETAIL, MSG_DUPLICATE_SHORT } from '@/shared/validationMessages'

const {
  entries, showComplete, confirmedCount,
  selectedId, selectedUrl, selectedEntry, selectFile,
  counts, progressPct, canConfirm, guideMessage, confirmLabel,
  addFiles, removeFile, triggerRetake, handleRetake, handleConfirm, resetAll,
  clientId,
} = useUpload()

const { clients } = useClients()
const clientName = clients.value.find(c => c.clientId === clientId)?.companyName ?? clientId
const monthLabel = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }) + 'の領収書'

// refs
const fileInputRef = ref<HTMLInputElement>()
const cameraInputRef = ref<HTMLInputElement>()
const retakeInputRef = ref<HTMLInputElement>()
const dragging = ref(false)

// 説明カード
const howToItems = [
  { step: 1, icon: '📸', title: '写真を選ぶ', desc: 'カメラロールから複数まとめて選択できます' },
  { step: 2, icon: '🤖', title: '自動チェック', desc: 'AIが日付・金額・店名を確認します（約2秒/枚）' },
  { step: 3, icon: '📷', title: '不備は撮り直し', desc: '赤いカードをタップして再撮影するだけ' },
  { step: 4, icon: '✅', title: '全件OKで送付', desc: '緑になったら「送付する」ボタンを押して完了' },
]

// イベントハンドラ（PC/モバイル統合）
const handleFileInput = (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  if (files.length) addFiles(files)
  ;(e.target as HTMLInputElement).value = ''
}

const handleCameraInput = (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  if (files.length) addFiles(files)
  ;(e.target as HTMLInputElement).value = ''
}

const handleDrop = (e: DragEvent) => {
  dragging.value = false
  const files = Array.from(e.dataTransfer?.files ?? [])
  if (files.length) addFiles(files)
}

const triggerRetakeAndOpen = (idx: number) => {
  triggerRetake(idx)
  retakeInputRef.value?.click()
}

const handleRetakeInput = (e: Event) => {
  handleRetake(e)
}

// classify結果バッジ表示判定
const classifyBadgeVisible = (f: UploadEntry) =>
  (f.status === 'uploading' || f.status === 'analyzing' || f.status === 'ok' || f.status === 'error') && !f.isDuplicate

// モバイルカードのステータスクラス
const cardStatusClass = (r: UploadEntry) => {
  if (r.status === 'error') return 'mobile-card--error'
  if (r.status === 'ok') return 'mobile-card--ok'
  return ''
}
</script>

<style scoped>
/* ============================================================
   CSS設計方針（2026年モダン対応）
   - コンテンツ駆動: v-if分岐をCSS display制御に統一
   - clamp(): フォント・余白を流動的にスケーリング
   - コンテナクエリ: バッジ等のコンポーネントが親幅に適応
   ============================================================ */

/* ===== CSS変数 ===== */
:root {
  --bp-mobile: 768px;
}

/* レスポンシブ表示制御は非scopedの<style>ブロックで定義（子コンポーネント対応） */

/* ===== 全体 ===== */
.upload-unified {
  height: 100%;
  overflow-y: auto;
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
  position: relative;
}
@media (min-width: 768px) {
  .upload-unified { background: #fff; }
}
.hidden-input { display: none; }

/* ===== メインコンテンツ ===== */
.main-content {
  flex: 1; position: relative; z-index: 1;
  width: 100%;
  max-width: 640px; margin: 0 auto;
  padding: clamp(8px, 2vw, 12px) clamp(8px, 2vw, 12px) 160px;
}
@media (min-width: 768px) {
  .main-content {
    max-width: 1440px;
    padding: clamp(60px, 8vw, 80px) clamp(16px, 3vw, 24px) 120px;
  }
}

/* ===== PC: 2カラム ===== */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(16px, 2vw, 20px);
  align-items: start;
}
@media (max-width: 960px) and (min-width: 768px) {
  .two-col { grid-template-columns: 1fr; }
}

/* ===== PC: 件数バッジ ===== */
.header-stats {
  position: absolute;
  top: 56px; right: clamp(16px, 3vw, 24px);
  z-index: 30;
  display: flex; gap: 6px;
}
.stat-badge {
  font-size: clamp(9px, 1.2vw, 10px);
  font-weight: 700; padding: 3px 10px; border-radius: 12px;
}
.stat-ok { background: #dcfce7; color: #166534; }
.stat-pending { background: #fef3c7; color: #92400e; }
.stat-total { background: #f1f5f9; color: #64748b; }

/* ===== PC: アップロードレーン ===== */
.upload-lane {
  background: #fff;
  border-radius: clamp(12px, 2vw, 16px);
  box-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02);
  overflow: hidden;
  transition: box-shadow 0.2s;
}
.upload-lane:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }

/* ===== PC: ドロップゾーン ===== */
.drop-zone {
  margin: clamp(12px, 2vw, 16px);
  border: 2px dashed #d1d5db;
  border-radius: clamp(8px, 1.5vw, 12px);
  padding: clamp(20px, 4vw, 32px) clamp(12px, 2vw, 16px);
  text-align: center;
  transition: all 0.25s ease;
  background: #fff;
}
.drop-zone:hover { border-color: #93c5fd; background: #f0f7ff; }
.drop-zone--active { border-color: #22c55e; background: #f0fdf4; }
.drop-icon-circle {
  width: clamp(48px, 6vw, 64px); height: clamp(48px, 6vw, 64px);
  border-radius: 50%; background: #f1f5f9;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto clamp(10px, 1.5vw, 14px);
  transition: transform 0.3s ease, background 0.3s ease;
}
.drop-zone:hover .drop-icon-circle { transform: scale(1.08); background: #e0f2fe; }
.drop-icon-emoji { font-size: clamp(20px, 3vw, 26px); font-style: normal; line-height: 1; }
.drop-title { font-size: clamp(12px, 1.5vw, 14px); font-weight: 700; color: #374151; margin: 0 0 4px; }
.drop-or { font-size: clamp(10px, 1.2vw, 11px); color: #9ca3af; margin: 0 0 12px; }
.drop-select-btn {
  display: inline-block; background: #1e293b; color: #fff;
  padding: clamp(6px, 1vw, 8px) clamp(16px, 2.5vw, 24px);
  border-radius: 20px; border: none;
  font-size: clamp(11px, 1.3vw, 12px); font-weight: 700;
  cursor: pointer; font-family: inherit;
  transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}
.drop-select-btn:hover { background: #334155; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }

/* ===== PC: ファイルリスト ===== */
.file-list {
  padding: 0 clamp(12px, 2vw, 16px) clamp(12px, 2vw, 16px);
  display: flex; flex-direction: column; gap: 6px;
}
.file-item {
  display: flex; align-items: center; gap: clamp(8px, 1vw, 10px);
  padding: clamp(6px, 1vw, 8px) clamp(8px, 1.5vw, 12px);
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: clamp(8px, 1vw, 10px);
  transition: all 0.2s; animation: fileSlideIn 0.3s ease; cursor: pointer;
}
.file-item:hover { background: #f1f5f9; }
.file-item--selected { background: #eff6ff; border-color: #93c5fd; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
@keyframes fileSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.file-icon {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
}
.file-icon--img { background: #dbeafe; }
.file-icon--doc { background: #dcfce7; }
.file-icon--csv { background: #fef9c3; }
.file-info { flex: 1; min-width: 0; }
.file-name { font-size: clamp(10px, 1.2vw, 11px); font-weight: 600; color: #334155; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-size { font-size: clamp(8px, 1vw, 9px); color: #94a3b8; margin: 2px 0 0; }
.file-remove {
  width: 24px; height: 24px; border-radius: 6px; border: none;
  background: transparent; color: #cbd5e1; font-size: 12px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.file-remove:hover { background: #fee2e2; color: #ef4444; }

/* ===== classify結果バッジ（コンテナクエリ対応） ===== */
.badge-container { container-type: inline-size; }
.classify-badges { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.badge {
  display: inline-flex; align-items: center;
  padding: clamp(1px, 0.5cqi, 2px) clamp(4px, 2cqi, 8px);
  border-radius: 12px;
  font-size: clamp(9px, 2.5cqi, 11px); font-weight: 600; white-space: nowrap;
}
.badge--loading { background: #fff3cd; color: #856404; animation: pulse 1.5s infinite; }
.badge--error { background: #f8d7da; color: #721c24; }
.badge--supplementary { background: #dbeafe; color: #1d4ed8; font-weight: 700; }
.badge--type { color: #fff; }
.badge--mode-auto { background: linear-gradient(135deg, #667eea, #764ba2); }
.badge--mode-manual { background: linear-gradient(135deg, #f093fb, #f5576c); }
.badge--mode-excluded { background: #6c757d; }
.badge--issuer { background: #f0f0f0; color: #333; }
.badge--amount { background: #e8f5e9; color: #2e7d32; font-weight: 700; }
.badge--date { background: #e8f5e9; color: #2e7d32; }
.badge--time { background: #f5f5f5; color: #999; font-size: clamp(8px, 2cqi, 10px); }
.badge--lines { background: #ede9fe; color: #6d28d9; font-weight: 700; }
.badge--warning { background: #fff7ed; color: #c2410c; font-weight: 700; border: 1px solid #fed7aa; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

/* コンテナクエリ: 親幅が狭い場合バッジを縮小 */
@container (max-width: 300px) {
  .badge { font-size: 9px; padding: 1px 5px; }
}

/* ===== PC: プレビュー ===== */
.preview-panel {
  background: #fff; border-radius: clamp(12px, 2vw, 16px);
  box-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02);
  overflow: hidden; min-height: 400px;
  display: flex; flex-direction: column;
  position: sticky; top: 80px;
}
.preview-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: clamp(24px, 5vw, 40px); color: #94a3b8; }
.preview-empty-icon { margin-bottom: clamp(10px, 2vw, 16px); opacity: 0.5; }
.preview-empty-text { font-size: clamp(11px, 1.5vw, 13px); text-align: center; line-height: 1.6; margin: 0; }
.preview-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: clamp(8px, 1.5vw, 12px) clamp(12px, 2vw, 16px);
  border-bottom: 1px solid #f1f5f9; background: #f8fafc;
}
.preview-filename { font-size: clamp(10px, 1.3vw, 12px); font-weight: 700; color: #334155; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
.preview-close { width: 24px; height: 24px; border-radius: 6px; border: none; background: transparent; color: #94a3b8; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; margin-left: 8px; }
.preview-close:hover { background: #fee2e2; color: #ef4444; }
.preview-body { flex: 1; display: flex; align-items: center; justify-content: center; padding: clamp(12px, 2vw, 16px); background: #fafafa; min-height: 350px; }
.preview-image { max-width: 100%; max-height: 70vh; object-fit: contain; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.preview-pdf { width: 100%; height: 70vh; border: none; border-radius: 8px; }
.preview-unsupported { text-align: center; color: #94a3b8; font-size: clamp(11px, 1.5vw, 13px); }
.preview-unsupported-icon { font-size: clamp(36px, 5vw, 48px); margin-bottom: 12px; opacity: 0.5; }

/* ===== フッター（PC/モバイル統合） ===== */
.footer-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: rgba(255,255,255,0.95); backdrop-filter: blur(12px);
  border-top: 1px solid #e5e7eb;
  padding: clamp(8px, 2vw, 12px) clamp(12px, 2vw, 16px);
  z-index: 20;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
}
.footer-inner {
  max-width: 640px; margin: 0 auto;
}
@media (min-width: 768px) {
  .footer-bar { border-top-color: #e2e8f0; box-shadow: 0 -4px 20px rgba(0,0,0,0.06); }
  .footer-inner {
    max-width: 1440px;
    padding: clamp(10px, 1.5vw, 14px) clamp(16px, 3vw, 24px);
    display: flex; align-items: center; justify-content: space-between;
  }
}
.footer-summary { display: flex; gap: 16px; font-size: clamp(10px, 1.3vw, 12px); color: #64748b; }
.footer-summary strong { color: #1e293b; font-weight: 800; }

/* ===== モバイル: ヘッダー ===== */
.mobile-header {
  background: #fff; border-bottom: 1px solid #e5e7eb;
  position: sticky; top: 0; z-index: 20;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.mobile-header-inner {
  max-width: 640px; margin: 0 auto;
  padding: clamp(8px, 2vw, 12px) clamp(12px, 2vw, 16px);
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.mobile-header-left { min-width: 0; }
.mobile-header-title { font-size: clamp(13px, 3.5vw, 15px); font-weight: 700; color: #1f2937; margin: 0; }
.mobile-header-sub { font-size: clamp(9px, 2.5vw, 11px); color: #9ca3af; margin: 2px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mobile-header-badges { display: flex; gap: 4px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
.m-badge { font-size: clamp(8px, 2.2vw, 10px); font-weight: 700; padding: 2px 8px; border-radius: 10px; }
.m-badge--ok { background: #d1fae5; color: #065f46; }
.m-badge--error { background: #fee2e2; color: #dc2626; }
.m-badge--processing { background: #fef3c7; color: #d97706; animation: pulse 1.5s infinite; }
.m-badge--total { color: #9ca3af; border: 1px solid #e5e7eb; }

/* ===== モバイル: 空状態 ===== */
.mobile-empty { margin-top: clamp(20px, 6vw, 40px); display: flex; flex-direction: column; align-items: center; }
.mobile-drop-zone {
  width: 100%; max-width: 360px;
  border: 2px dashed #d1d5db; border-radius: clamp(16px, 4vw, 24px);
  padding: clamp(24px, 6vw, 40px) clamp(12px, 3vw, 16px);
  text-align: center; transition: all 0.2s; cursor: pointer; background: #fff;
}
.mobile-drop-zone:hover { border-color: #93c5fd; background: #eff6ff; }
.mobile-drop-zone--active { border-color: #22c55e; background: #f0fdf4; }
.mobile-drop-emoji { font-size: clamp(36px, 10vw, 48px); margin-bottom: clamp(10px, 3vw, 16px); }
.mobile-drop-title { font-size: clamp(14px, 3.5vw, 16px); font-weight: 700; color: #374151; margin: 0; }
.mobile-drop-sub { font-size: clamp(10px, 2.5vw, 12px); color: #9ca3af; margin: 8px 0 0; }
.mobile-drop-btns { display: flex; gap: clamp(8px, 2vw, 12px); justify-content: center; margin-top: clamp(16px, 4vw, 24px); }
.mobile-btn-camera {
  display: flex; align-items: center; gap: 6px;
  background: #2563eb; color: #fff;
  font-size: clamp(11px, 3vw, 13px); font-weight: 700;
  padding: clamp(8px, 2vw, 12px) clamp(14px, 4vw, 20px);
  border-radius: 16px; border: none; cursor: pointer;
  box-shadow: 0 2px 8px rgba(37,99,235,0.3); transition: all 0.2s; font-family: inherit;
}
.mobile-btn-camera:hover { background: #1d4ed8; }
.mobile-btn-camera:active { transform: scale(0.95); }
.mobile-btn-file {
  display: flex; align-items: center; gap: 6px;
  background: #fff; color: #2563eb; border: 2px solid #2563eb;
  font-size: clamp(11px, 3vw, 13px); font-weight: 700;
  padding: clamp(8px, 2vw, 12px) clamp(14px, 4vw, 20px);
  border-radius: 16px; cursor: pointer;
  transition: all 0.2s; font-family: inherit;
}
.mobile-btn-file:hover { background: #eff6ff; }
.mobile-btn-file:active { transform: scale(0.95); }
.mobile-drop-hint { margin-top: clamp(12px, 4vw, 20px); font-size: clamp(9px, 2.5vw, 11px); color: #9ca3af; text-align: center; line-height: 1.6; }
.mobile-drop-hint span { color: #cbd5e1; }

/* 説明カード */
.mobile-howto { margin-top: clamp(20px, 6vw, 32px); width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: clamp(8px, 2vw, 12px); }
.mobile-howto-card { display: flex; align-items: flex-start; gap: 12px; background: #fff; border-radius: 16px; padding: clamp(8px, 2vw, 12px) clamp(12px, 3vw, 16px); box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
.mobile-howto-icon { font-size: clamp(16px, 4vw, 20px); flex-shrink: 0; margin-top: 2px; }
.mobile-howto-title { font-size: clamp(10px, 2.5vw, 12px); font-weight: 700; color: #374151; margin: 0; }
.mobile-howto-desc { font-size: clamp(9px, 2.2vw, 11px); color: #9ca3af; margin: 2px 0 0; }

/* ===== モバイル: 進捗 ===== */
.mobile-progress { margin-bottom: clamp(10px, 3vw, 16px); background: #fff; border-radius: 16px; padding: clamp(8px, 2vw, 12px) clamp(12px, 3vw, 16px); box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
.mobile-progress-header { display: flex; justify-content: space-between; font-size: clamp(9px, 2.5vw, 11px); color: #6b7280; margin-bottom: 8px; }
.mobile-progress-header span:first-child { font-weight: 600; }
.mobile-progress-track { width: 100%; background: #f3f4f6; border-radius: 999px; height: 8px; overflow: hidden; }
.mobile-progress-bar { height: 8px; border-radius: 999px; transition: all 0.7s ease-out; }
.bar--ok { background: #10b981; }
.bar--warn { background: #f59e0b; }
.mobile-progress-counts { display: flex; gap: clamp(8px, 2vw, 12px); margin-top: 8px; font-size: clamp(8px, 2.2vw, 10px); }
.count-ok { color: #059669; }
.count-error { color: #ef4444; }
.count-processing { color: #f59e0b; animation: pulse 1.5s infinite; }
.count-queued { color: #9ca3af; }

/* ===== モバイル: カードグリッド ===== */
.mobile-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(6px, 1.5vw, 8px); }
@media (min-width: 480px) and (max-width: 767px) { .mobile-grid { grid-template-columns: repeat(4, 1fr); } }

.mobile-card {
  position: relative; border-radius: clamp(12px, 3vw, 16px); overflow: hidden;
  background: #fff; border: 2px solid #e5e7eb;
  transition: all 0.3s; user-select: none;
}
.mobile-card--error { border-color: #f87171; box-shadow: 0 4px 12px rgba(239,68,68,0.15); cursor: pointer; }
.mobile-card--error:active { transform: scale(0.95); }
.mobile-card--ok { border-color: #34d399; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }

.mobile-card-thumb { aspect-ratio: 3/4; position: relative; background: #f3f4f6; overflow: hidden; }
.mobile-card-img { width: 100%; height: 100%; object-fit: cover; }
.mobile-pdf-thumb { width: 200%; height: 200%; transform-origin: top left; transform: scale(0.5); pointer-events: none; border: 0; }

/* オーバーレイ */
.overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.overlay--queued { background: rgba(0,0,0,0.4); color: #fff; font-size: clamp(9px, 2.5vw, 11px); }
.overlay--processing { background: rgba(0,0,0,0.55); color: #fff; font-size: clamp(7px, 2vw, 9px); font-weight: 600; gap: 6px; }
.spinner { width: clamp(20px, 6vw, 28px); height: clamp(20px, 6vw, 28px); border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.overlay-ok-badge { position: absolute; top: 4px; right: 4px; font-size: clamp(14px, 4vw, 18px); filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); }
.overlay-dup { position: absolute; top: 0; left: 0; right: 0; background: rgba(245,158,11,0.9); padding: 2px 4px; text-align: center; font-size: clamp(6px, 1.8vw, 8px); color: #fff; font-weight: 700; }
.overlay-warn { position: absolute; top: 0; left: 0; right: 0; background: rgba(249,115,22,0.9); padding: 2px 4px; text-align: center; font-size: clamp(6px, 1.8vw, 8px); color: #fff; font-weight: 700; }
.overlay--error { background: rgba(220,38,38,0.75); padding: clamp(4px, 1.5vw, 8px); gap: 4px; }
.overlay-error-icon { font-size: clamp(16px, 5vw, 24px); }
.overlay-error-text { font-size: clamp(6px, 1.8vw, 8px); font-weight: 700; color: #fff; text-align: center; line-height: 1.3; }
.overlay-error-hint { font-size: clamp(6px, 1.8vw, 8px); background: rgba(255,255,255,0.3); color: #fff; padding: 2px 8px; border-radius: 999px; margin-top: 2px; }

/* カード下部 */
.mobile-card-footer { padding: clamp(4px, 1vw, 6px); }
.card-supplementary { font-size: clamp(6px, 1.8vw, 8px); font-weight: 700; color: #2563eb; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-filename { font-size: clamp(5px, 1.5vw, 7px); color: #9ca3af; margin: 0; }
.card-source-type { font-size: clamp(5px, 1.5vw, 7px); font-weight: 700; padding: 1px 4px; border-radius: 4px; background: #e0e7ff; color: #4338ca; display: inline-block; margin: 0 0 2px; }
.card-lines { font-size: clamp(6px, 1.8vw, 8px); font-weight: 700; color: #059669; margin: 0; }
.card-vendor { font-size: clamp(6px, 1.8vw, 8px); font-weight: 700; color: #059669; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-amount { font-size: clamp(6px, 1.8vw, 8px); color: #059669; margin: 0; }
.card-date { font-size: clamp(5px, 1.5vw, 7px); color: #9ca3af; margin: 0; }
.card-idx { font-size: clamp(6px, 1.8vw, 8px); color: #d1d5db; margin: 0; }

/* 追加ボタン */
.mobile-add-card {
  aspect-ratio: 3/4; border: 2px dashed #d1d5db; border-radius: clamp(12px, 3vw, 16px);
  background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
}
.mobile-add-btn {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  color: #9ca3af; font-size: clamp(6px, 1.8vw, 8px); font-weight: 600;
  padding: 8px; border-radius: 12px;
  border: none; background: transparent; cursor: pointer; transition: all 0.2s; font-family: inherit;
}
.mobile-add-btn span:first-child { font-size: clamp(18px, 5vw, 24px); }
.mobile-add-btn:hover { color: #3b82f6; }
.mobile-add-btn:active { transform: scale(0.95); }
.mobile-add-divider { width: 32px; border-top: 1px solid #e5e7eb; }

/* ===== ガイドメッセージ ===== */
.guide-msg { font-size: clamp(9px, 2.5vw, 11px); text-align: center; font-weight: 600; margin: 0 0 8px; }
.guide-msg--error { color: #ef4444; }
.guide-msg--processing { color: #d97706; animation: pulse 1.5s infinite; }
.guide-msg--ok { color: #059669; }

/* ===== 送付ボタン ===== */
.submit-btn {
  width: 100%; padding: clamp(10px, 2.5vw, 14px);
  border-radius: clamp(10px, 2vw, 14px); border: none;
  font-size: clamp(12px, 3vw, 14px); font-weight: 700;
  cursor: pointer; font-family: inherit;
  transition: all 0.3s;
}
.submit-btn--active {
  background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff;
  box-shadow: 0 4px 14px rgba(37,99,235,0.3);
}
.submit-btn--active:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.4); }
.submit-btn--active:active { transform: scale(0.97); }
.submit-btn--disabled { background: #e5e7eb; color: #9ca3af; cursor: not-allowed; }

/* ===== モーダル ===== */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50;
  display: flex; align-items: center; justify-content: center;
  padding: clamp(12px, 3vw, 20px);
}
.modal-content {
  background: #fff; border-radius: clamp(16px, 3vw, 24px);
  padding: clamp(24px, 5vw, 40px);
  max-width: 420px; width: 100%; text-align: center;
  box-shadow: 0 25px 50px rgba(0,0,0,0.15);
}
.modal-emoji { font-size: clamp(40px, 10vw, 56px); margin-bottom: clamp(10px, 2vw, 16px); }
.modal-title { font-size: clamp(16px, 4vw, 20px); font-weight: 800; color: #1e293b; margin: 0 0 8px; }
.modal-desc { font-size: clamp(12px, 3vw, 14px); color: #64748b; margin: 0 0 clamp(16px, 4vw, 24px); }
.modal-desc strong { color: #3b82f6; }
.modal-btn {
  width: 100%; padding: clamp(10px, 2.5vw, 14px);
  border-radius: clamp(10px, 2vw, 14px); border: none;
  background: #3b82f6; color: #fff;
  font-size: clamp(12px, 3vw, 14px); font-weight: 700;
  cursor: pointer; font-family: inherit; transition: background 0.2s;
}
.modal-btn:hover { background: #2563eb; }

/* ===== トランジション ===== */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-content, .modal-leave-to .modal-content { transform: scale(0.9) translateY(20px); }
</style>

<!-- レスポンシブ表示制御はscoped外（子コンポーネントにも適用するため） -->
<style>
/* モバイルファースト: デフォルトはモバイル表示 */
.upload-unified .pc-only { display: none !important; }
.upload-unified .mobile-only { display: block !important; }
.upload-unified header.mobile-only { display: block !important; }
.upload-unified .guide-area.mobile-only { display: block !important; }

/* PC表示: 768px以上 */
@media (min-width: 768px) {
  .upload-unified .pc-only { display: block !important; }
  .upload-unified .two-col.pc-only { display: grid !important; }
  .upload-unified .header-stats.pc-only { display: flex !important; }
  .upload-unified .footer-summary.pc-only { display: flex !important; }
  .upload-unified .mobile-only { display: none !important; }
  .upload-unified header.mobile-only { display: none !important; }
  .upload-unified .mobile-section.mobile-only { display: none !important; }
  .upload-unified .guide-area.mobile-only { display: none !important; }
  /* submit-btn内のspan制御 */
  .upload-unified .submit-btn span.pc-only { display: inline !important; }
  .upload-unified .submit-btn span.mobile-only { display: none !important; }
}
/* モバイル時のsubmit-btn内span */
@media (max-width: 767px) {
  .upload-unified .submit-btn span.pc-only { display: none !important; }
  .upload-unified .submit-btn span.mobile-only { display: inline !important; }
}
</style>
