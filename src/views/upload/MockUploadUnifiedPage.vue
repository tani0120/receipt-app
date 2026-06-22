<template>
  <div class="upload-unified" style="font-family: 'Noto Sans JP', sans-serif">

    <!-- ===== 共通ヘッダー ===== -->
    <PortalHeader :clientName="clientName" />

    <!-- ===== PC: 件数バッジ（CSS制御） ===== -->
    <div class="header-stats pc-only" v-if="entries.length > 0">
      <span class="stat-badge stat-ok" v-if="counts.ok">✓ {{ counts.ok }}</span>
      <span class="stat-badge stat-pending" v-if="counts.processing">⏳ {{ counts.processing }}</span>
      <span class="stat-badge stat-total">計 {{ entries.length }} 件</span>
    </div>

    <!-- ===== メインコンテンツ ===== -->
    <main class="main-content">

      <!-- ========== PC版: 2カラム（CSS制御） ========== -->
      <div v-if="!isMobile" class="two-col pc-only">
        <!-- 左: ドロップ+リスト -->
        <div class="upload-lane">
          <div
            class="drop-zone"
            :class="{ 'drop-zone--active': dragging }"
            @dragover.prevent="dragging = true"
            @dragleave.prevent="dragging = false"
            @drop.prevent="handleDrop"
          >
            <div class="drop-icon-circle">
              <svg class="drop-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16V8m0 0l3 3m-3-3l-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20 16.7428C21.2215 15.734 22 14.2079 22 12.5C22 9.46243 19.5376 7 16.5 7C16.2815 7 16.0771 6.886 15.9661 6.69774C14.6621 4.48484 12.2544 3 9.5 3C5.35786 3 2 6.35786 2 10.5C2 12.5661 2.83545 14.4371 4.18695 15.7935" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="drop-title">ファイルをここにドラッグ＆ドロップ</h3>
            <p class="drop-or">または</p>
            <button class="drop-select-btn" @click.stop="fileInputRef?.click()">ファイルを選択</button>
          </div>
          <div class="file-list" v-if="entries.length">
            <!-- エラー・重複子の一括削除ボタン -->
            <div v-if="bulkDeleteTargets.length" class="bulk-delete-bar">
              <button class="bulk-delete-btn" @click="showBulkDeleteConfirm = true">
                <span class="bulk-delete-icon">⚠</span>
                <span class="bulk-delete-label">エラー・重複を一括削除</span>
                <span class="bulk-delete-count">{{ bulkDeleteTargets.length }}件</span>
              </button>
            </div>
            <div
              v-for="f in sortedEntries"
              :key="f.id"
              class="file-item badge-container"
              :class="[
                { 'file-item--selected': selectedId === f.id },
                dupGroupInfo(f)?.colorClass ?? '',
                { 'dup-child': dupGroupInfo(f) && dupGroupInfo(f)!.pos >= 2 },
              ]"
              @click="selectFile(f)"
            >
              <div class="file-status-icon" :class="statusIconClass(f)">{{ statusIconText(f) }}</div>
              <div class="file-info">
                <p class="file-name">{{ f.fileName }}</p>
                <p class="file-size">{{ formatSize(f.fileSize) }}</p>
                <div class="previewExtract-badges" v-if="previewExtractBadgeVisible(f)">
                  <span v-if="f.status === 'uploading' || f.status === 'analyzing'" class="badge badge--loading">⏳ アップロード中...</span>
                  <span v-else-if="f.status === 'error'" class="badge badge--error">⚠️ {{ f.errorReason ?? '失敗' }}</span>
                  <template v-else-if="f.status === 'ok' && f.supplementary">
                    <span class="badge badge--supplementary">📎 このまま送付してください（参照資料）</span>
                  </template>
                  <template v-else-if="f.status === 'ok'">
                    <span v-if="f.warning" class="badge badge--warning">⚠ {{ f.warning }}</span>
                    <span v-if="f.metrics?.source_type" class="badge badge--type" :class="'badge--mode-' + (f.metrics.processing_mode ?? 'auto')">{{ sourceTypeLabel(f.metrics.source_type) }}</span>
                    <span v-if="f.lineItems?.length" class="badge badge--lines">📊 {{ f.lineItems.length }}行</span>
                    <span v-if="f.vendor" class="badge badge--issuer">{{ f.vendor }}</span>
                    <span v-if="f.amount" class="badge badge--amount">¥{{ f.amount.toLocaleString() }}</span>
                    <span v-if="f.date" class="badge badge--date">{{ f.date }}</span>
                  </template>
                </div>
              </div>
              <!-- 重複グループバッジ（ゴミ箱の左横） -->
              <span v-if="dupGroupInfo(f)" class="dup-tag" :class="dupGroupInfo(f)!.colorClass">グループ{{ dupGroupInfo(f)!.groupLabel }} ({{ dupGroupInfo(f)!.pos }}/{{ dupGroupInfo(f)!.size }})</span>
              <button class="file-remove" @click.stop="confirmRemove(f.id)">🗑️</button>
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
              <p class="preview-filename">{{ selectedEntry.fileName }}</p>
              <button class="preview-close" @click="selectedId = null">✕</button>
            </div>
            <div class="preview-body">
              <img v-if="isImageFile(selectedEntry.fileName)" :src="selectedUrl!" class="preview-image" :alt="selectedEntry.fileName" />
              <iframe v-else-if="isPdfFile(selectedEntry.fileName)" :src="selectedUrl! + '#zoom=page-fit'" class="preview-pdf"></iframe>
              <div v-else class="preview-unsupported">
                <div class="preview-unsupported-icon">📄</div>
                <p>このファイル形式のプレビューには対応していません</p>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- ========== モバイル版: カードグリッド（CSS制御） ========== -->
      <div v-if="isMobile" class="mobile-section mobile-only">
        <!-- 空の状態 -->
        <div v-if="entries.length === 0" class="mobile-empty"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="handleDrop"
        >
          <div :class="['mobile-drop-zone', dragging ? 'mobile-drop-zone--active' : '']" @click="fileInputRef?.click()">
            <div class="mobile-drop-icon-wrap">
              <svg class="mobile-drop-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16V8m0 0l3 3m-3-3l-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20 16.7428C21.2215 15.734 22 14.2079 22 12.5C22 9.46243 19.5376 7 16.5 7C16.2815 7 16.0771 6.886 15.9661 6.69774C14.6621 4.48484 12.2544 3 9.5 3C5.35786 3 2 6.35786 2 10.5C2 12.5661 2.83545 14.4371 4.18695 15.7935" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p class="mobile-drop-title">スマホで撮影またはファイルを選択</p>
            <p class="mobile-drop-sub">タップして選択 / ドラッグ&ドロップ</p>
            <div class="mobile-drop-btns">
              <button class="mobile-btn-camera" @click.stop="cameraInputRef?.click()">▶ 撮影する</button>
              <button class="mobile-btn-file" @click.stop="fileInputRef?.click()">📁 ファイルをアップロード</button>
            </div>
            <button class="mobile-btn-advanced" @click.stop="advancedInputRef?.click()">⚙ 高度な処理でアップロード（時間がかかるため非推奨）</button>
          </div>
          <p class="mobile-drop-hint">200枚まで一括送信できます<br><span>JPEG / PNG / PDF / CSV / その他 対応</span></p>

          <!-- 説明カード -->
          <div class="mobile-howto">
            <p class="mobile-howto-section-title"><span>ファイル共有の流れ</span></p>
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
              <span v-if="counts.error" class="count-error">⚠️ NG: {{ counts.error }}</span>
              <span v-if="counts.processing" class="count-processing">⏳ 処理中: {{ counts.processing }}</span>
              <span v-if="counts.queued" class="count-queued">待機: {{ counts.queued }}</span>
            </div>
          </div>

          <!-- グリッド -->
          <div class="mobile-grid">
            <!-- 完了済みが非表示の場合、折りたたみ表示 -->
            <div v-if="hiddenDoneCount > 0" class="mobile-hidden-summary">
              ✅ 完了済み {{ hiddenDoneCount }}件（表示省略）
            </div>
            <div
              v-for="(r, idx) in visibleMobileEntries"
              :key="r.id"
              :class="['mobile-card', cardStatusClass(r)]"
              @click="r.status === 'error' ? openErrorModal(r) : undefined"
            >
              <div class="mobile-card-thumb">
                <!-- 処理中/待機中のみimg表示。完了後はテキスト化でRenderer負荷ゼロ → クラッシュ防止 -->
                <img v-if="r.status === 'queued' || r.status === 'uploading' || r.status === 'analyzing'" :src="r.previewUrl" :alt="`領収書 ${idx + 1}`" class="mobile-card-img" loading="lazy" />
                <div v-else-if="r.status === 'ok'" class="mobile-card-done">✅</div>
                <div v-else class="mobile-card-done mobile-card-done--error">⚠️</div>

                <!-- オーバーレイ: 待機 -->
                <div v-if="r.status === 'queued'" class="overlay overlay--queued"><span>待機中</span></div>
                <!-- オーバーレイ: 処理中 -->
                <div v-if="r.status === 'uploading' || r.status === 'analyzing'" class="overlay overlay--processing">
                  <div class="spinner"></div>
                  <span>{{ r.status === 'uploading' ? UI_MSG.送信中 : UI_MSG.アップロード中 }}</span>
                </div>

                <!-- 上部ステータスバー（完了後に表示） -->
                <!-- エラー -->
                <div v-if="r.status === 'error'" class="status-bar status-bar--error">⚠ エラー</div>
                <!-- 重複（グループ番号付き） -->
                <div v-else-if="r.isDuplicate && dupGroupInfo(r)" class="status-bar status-bar--dup">⚠ 重複{{ dupGroupInfo(r)!.groupLabel }} ({{ dupGroupInfo(r)!.pos }}/{{ dupGroupInfo(r)!.size }})</div>
                <div v-else-if="r.isDuplicate" class="status-bar status-bar--dup">⚠ {{ MSG_DUPLICATE_SHORT }}</div>
                <!-- 警告 -->
                <div v-else-if="r.status === 'ok' && r.warning" class="status-bar status-bar--warn">⚠ {{ r.warning }}</div>
                <!-- OK（参照資料） -->
                <div v-else-if="r.status === 'ok' && r.supplementary" class="status-bar status-bar--ok">✅ 送信OK（参照資料）</div>
                <!-- OK -->
                <div v-else-if="r.status === 'ok'" class="status-bar status-bar--ok">✅ 送信OK</div>
              </div>
              <!-- 削除ボタン（右上） -->
              <button class="mobile-card-remove" @click.stop="confirmRemove(r.id)">🗑️</button>

              <!-- カード下部（高さ統一） -->
              <div class="mobile-card-footer">
                <p class="card-footer-text">
                  <template v-if="r.status === 'ok' && r.supplementary">{{ r.fileName }}</template>
                  <template v-else-if="r.status === 'ok'">
                    <template v-if="r.vendor">{{ r.vendor }}</template>
                    <template v-else-if="r.lineItemsCount > 0">{{ r.lineItemsCount }}行</template>
                    <template v-else>{{ r.fileName }}</template>
                  </template>
                  <template v-else-if="r.status === 'error'">{{ r.errorReason ?? UI_MSG.エラー }}</template>
                  <template v-else>{{ idx + 1 }}</template>
                </p>

              </div>
            </div>

            <!-- 追加ボタン -->
            <div class="mobile-add-card">
              <button class="mobile-add-btn" @click.stop="cameraInputRef?.click()">
                <span>📷</span><span>撮る</span>
              </button>
              <div class="mobile-add-divider"></div>
              <button class="mobile-add-btn" @click.stop="pickFiles()">
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
            <p v-if="guideMessage && !canConfirm" class="guide-msg guide-msg--error">⚠ {{ guideMessage }}</p>
            <p v-else-if="counts.processing" class="guide-msg guide-msg--processing">AIが確認しています。しばらくお待ちください...</p>
            <p v-else-if="canConfirm && hasErrors" class="guide-msg guide-msg--warn">タップして再撮影 or そのまま送付 を選択してください ⚠️</p>
            <p v-else-if="canConfirm" class="guide-msg guide-msg--ok">全件確認完了！送付できます ✅</p>
          </transition>
        </div>
        <!-- PC: サマリー -->
        <div class="footer-summary pc-only">
          <span>合計: <strong>{{ entries.length }}</strong>件</span>
        </div>
        <!-- 共通: 送付ボタン -->
        <div class="footer-buttons">
          <!-- 送付ボタン（PC/モバイル統一） -->
            <button
              :disabled="!canConfirm"
              :class="['submit-btn', canConfirm ? (hasErrors ? 'submit-btn--force' : 'submit-btn--active') : 'submit-btn--disabled']"
              @click="handleConfirm"
            >
              {{ confirmLabel }}
            </button>
        </div>
      </div>
    </footer>

    <!-- ===== 完了モーダル ===== -->
    <transition name="modal">
      <div v-if="showComplete" class="modal-overlay" @click.self="showComplete = false">
        <div class="modal-content">
          <div class="modal-emoji">🎉</div>
          <h2 class="modal-title">{{ UI_MSG.アップロード完了タイトル }}</h2>
          <p class="modal-desc">
            <strong>{{ confirmedCount }}{{ UI_MSG.件ラベル }}</strong>{{ UI_MSG.送付完了メッセージ }}
          </p>
          <div class="modal-confirm-btns modal-complete-btns">
            <button class="modal-btn modal-btn--primary" @click="goToJournalList">{{ UI_MSG.仕訳一覧で確認ボタン }}</button>
            <button class="modal-btn modal-btn--cancel" @click="resetAll">{{ UI_MSG.続けてアップロードボタン }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- エラー対応モーダル -->
    <transition name="fade">
      <div v-if="errorTargetEntry" class="modal-overlay" @click="errorTargetEntry = null">
        <div class="modal-box" @click.stop>
          <p class="modal-title">⚠️ エラーが検出されました</p>
          <p class="modal-desc">{{ errorTargetEntry.errorReason ?? 'エラー' }}</p>
          <div class="modal-confirm-btns">
            <button class="modal-btn modal-btn--danger" @click="doErrorRetake">📷 再撮影</button>
            <button class="modal-btn modal-btn--cancel" @click="errorTargetEntry = null">そのまま送る</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 削除確認モーダル -->
    <transition name="fade">
      <div v-if="removeTargetId" class="modal-overlay" @click="removeTargetId = null">
        <div class="modal-box" @click.stop>
          <p class="modal-title">🗑️ 削除しますか？</p>
          <div class="modal-confirm-btns">
            <button class="modal-btn modal-btn--danger" @click="doRemove">はい</button>
            <button class="modal-btn modal-btn--cancel" @click="removeTargetId = null">いいえ</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 一括削除確認モーダル -->
    <transition name="fade">
      <div v-if="showBulkDeleteConfirm" class="modal-overlay" @click="showBulkDeleteConfirm = false">
        <div class="modal-box" @click.stop>
          <p class="modal-title">🗑️ エラー・重複ファイルを一括削除しますか？</p>
          <p class="modal-subtitle">対象: {{ bulkDeleteTargets.length }}件（エラー + 重複子ファイル）</p>
          <div class="modal-confirm-btns">
            <button class="modal-btn modal-btn--danger" @click="doBulkDelete">削除する</button>
            <button class="modal-btn modal-btn--cancel" @click="showBulkDeleteConfirm = false">キャンセル</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 隠しinput -->
    <input ref="fileInputRef" type="file" multiple accept="image/*,.pdf,.csv,.xlsx,.xls" class="hidden-input" @change="handleFileInput" />
    <input ref="advancedInputRef" type="file" multiple accept="image/*,.pdf,.csv,.xlsx,.xls" class="hidden-input" @change="handleFileInputAdvanced" />
    <input ref="cameraInputRef" type="file" accept="image/*" capture="environment" class="hidden-input" @change="handleCameraInput" />
    <input ref="retakeInputRef" type="file" accept="image/*,.pdf" class="hidden-input" @change="handleRetakeInput" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import PortalHeader from '@/components/PortalHeader.vue'
import { useClients } from '@/features/client-management/composables/useClients'
import {
  useUpload,
  sourceTypeLabel,
  formatSize,
  isImageFile,
  isPdfFile,
  fileIconEmoji,
} from '@/composables/useUpload'
import type { UploadEntry } from '@/composables/useUpload'
import { MSG_DUPLICATE_SHORT } from '@/constants/validationMessages'
import { UI_MSG } from '@/constants/uiMessages'
import { getClientDisplayName } from '@/constants/clientOptions'

/** File System Access API（Chrome 86+）の型宣言 */
interface FilePickerHandle {
  getFile(): Promise<File>;
}
declare global {
  interface Window {
    showOpenFilePicker?(options?: { multiple?: boolean }): Promise<FilePickerHandle[]>;
  }
}

const {
  entries, sortedEntries, showComplete, confirmedCount,
  selectedId, selectedUrl, selectedEntry, selectFile,
  counts, progressPct, canConfirm, hasErrors, guideMessage, confirmLabel,
  addFiles, removeFile, triggerRetake, handleRetake, handleConfirm, resetAll, cleanup,
  clientId, isMobile,
} = useUpload()

const { clients } = useClients()
const clientName = computed(() => {
  const c = clients.value.find(c => c.clientId === clientId)
  return c ? getClientDisplayName(c) : clientId
})

// 画面遷移時にサーバー側の重複ハッシュ記録をクリア（DL-038）
onBeforeUnmount(() => {
  cleanup()
})

// 完了モーダル → 仕訳一覧遷移
const router = useRouter()
const goToJournalList = () => {
  showComplete.value = false
  router.push(`/journal-list/${clientId}`)
}

// モバイルDOM制限: 処理中を優先表示、完了済みは最新N件のみ（Rendererクラッシュ防止）
const MAX_VISIBLE_DONE = 6 // 完了済みの最大表示数（2列×3行）
const visibleMobileEntries = computed(() => {
  // 処理中/待機中は全表示
  const active = sortedEntries.value.filter(e =>
    e.status === 'queued' || e.status === 'uploading' || e.status === 'analyzing'
  )
  // 完了済み（OK/エラー）は最新N件のみ
  const done = sortedEntries.value.filter(e =>
    e.status === 'ok' || e.status === 'error'
  )
  const visibleDone = done.slice(0, Math.max(0, MAX_VISIBLE_DONE - active.length))
  return [...active, ...visibleDone]
})
const hiddenDoneCount = computed(() => {
  const totalDone = sortedEntries.value.filter(e => e.status === 'ok' || e.status === 'error').length
  const visibleDone = visibleMobileEntries.value.filter(e => e.status === 'ok' || e.status === 'error').length
  return totalDone - visibleDone
})


// refs
const fileInputRef = ref<HTMLInputElement>()
const advancedInputRef = ref<HTMLInputElement>()
const cameraInputRef = ref<HTMLInputElement>()
const retakeInputRef = ref<HTMLInputElement>()
const dragging = ref(false)

// 説明カード
const howToItems = [
  { step: 1, icon: UI_MSG.ゲストステップ1アイコン, title: UI_MSG.ゲストステップ1タイトル, desc: UI_MSG.ゲストステップ1説明 },
  { step: 2, icon: UI_MSG.ゲストステップ2アイコン, title: UI_MSG.ゲストステップ2タイトル, desc: UI_MSG.ゲストステップ2説明 },
  { step: 3, icon: UI_MSG.ゲストステップ3アイコン, title: UI_MSG.ゲストステップ3タイトル, desc: UI_MSG.ゲストステップ3説明 },
  { step: 4, icon: UI_MSG.ゲストステップ4アイコン, title: UI_MSG.ゲストステップ4タイトル, desc: UI_MSG.ゲストステップ4説明 },
]

// イベントハンドラ（PC/モバイル統合）
// スマホメインボタン: 軽量モード（AI分類スキップ）
// PC / スマホ「高度な処理」: 通常モード（AI分類あり）
const handleFileInput = (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  if (files.length) addFiles(files, { lite: isMobile.value })
  ;(e.target as HTMLInputElement).value = ''
}

// 高度な処理（AI分類あり）ボタン用ハンドラ
const handleFileInputAdvanced = (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  if (files.length) addFiles(files, { lite: false })
  ;(e.target as HTMLInputElement).value = ''
}

/**
 * モバイルファイル選択（クラッシュ防止設計）
 * Android Chrome 132+: showOpenFilePicker（Content Provider回避）
 * iOS Safari / 古いブラウザ: input動的生成（multiple外す、1枚ずつ）
 */
const supportsFilePicker = typeof window !== 'undefined' && 'showOpenFilePicker' in window

async function pickFiles() {
  if (supportsFilePicker) {
    // Android Chrome 132+: File System Access API（Blink内部バッファ回避の可能性）
    try {
      const handles = await window.showOpenFilePicker!({
        multiple: true,
      })
      const files: File[] = []
      for (const handle of handles) {
        files.push(await handle.getFile())
      }
      if (files.length) addFiles(files, { lite: isMobile.value })
    } catch (err) {
      // ユーザーがキャンセルした場合は無視
      if ((err as Error).name !== 'AbortError') {
        console.warn('[pickFiles] showOpenFilePicker失敗:', err)
      }
    }
  } else {
    // iOS Safari等: input動的生成（毎回新規作成でBlinkリーク回避）
    // multiple外す（OSが単一選択モード→Blinkバッファ最小化）
    // accept外す（OSのサムネ生成回避）
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files ?? [])
      if (files.length) addFiles(files, { lite: isMobile.value })
    }
    input.click()
  }
}

const handleCameraInput = (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  if (files.length) addFiles(files, { lite: true })
  ;(e.target as HTMLInputElement).value = ''
}

const handleDrop = (e: DragEvent) => {
  dragging.value = false
  const files = Array.from(e.dataTransfer?.files ?? [])
  if (files.length) addFiles(files, { lite: isMobile.value })
}



const handleRetakeInput = (e: Event) => {
  handleRetake(e)
}

// previewExtract結果バッジ表示判定（重複子(pos>=2)のみ非表示。親(pos=1)は表示）
const previewExtractBadgeVisible = (f: UploadEntry) => {
  if (f.status !== 'uploading' && f.status !== 'analyzing' && f.status !== 'ok' && f.status !== 'error') return false
  const dg = dupGroupInfo(f)
  if (dg && dg.pos >= 2) return false
  return true
}

// PC版ステータスアイコン（OK=✓、エラー=△!、重複=重A/B、処理中=拡張子アイコン）
const statusIconClass = (f: UploadEntry) => {
  if (f.status === 'error') return 'file-status-icon--error'
  const dg = dupGroupInfo(f)
  if (dg) return `file-status-icon--dup file-status-icon--${dg.colorClass}`
  if (f.status === 'ok') return 'file-status-icon--ok'
  return 'file-status-icon--pending'
}
const statusIconText = (f: UploadEntry) => {
  if (f.status === 'error') return '△!'
  const dg = dupGroupInfo(f)
  if (dg) return `${UI_MSG.重複接頭}${dg.groupLabel}`
  if (f.status === 'ok') return '✓'
  return fileIconEmoji(f.fileName)
}

// モバイルカードのステータスクラス
const cardStatusClass = (r: UploadEntry) => {
  if (r.status === 'error') return 'mobile-card--error'
  if (r.status === 'ok') return 'mobile-card--ok'
  return ''
}

// 重複グループ情報（グループ色・番号・カウンター）
const DUP_GROUP_COLORS = [
  'dup-color-a', 'dup-color-b', 'dup-color-c', 'dup-color-d',
  'dup-color-e', 'dup-color-f', 'dup-color-g', 'dup-color-h',
]
const DUP_GROUP_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

// 重複グループ情報のキャッシュMap（O(1)ルックアップ。テンプレートで多重呼び出しされても再計算しない）
type DupGroupResult = { colorClass: string; groupLabel: string; pos: number; size: number }
const dupGroupMap = computed(() => {
  const map = new Map<string, DupGroupResult>()
  // hashごとにグループ化
  const hashGroups = new Map<string, UploadEntry[]>()
  for (const e of entries.value) {
    if (!e.hash) continue
    const arr = hashGroups.get(e.hash) ?? []
    arr.push(e)
    hashGroups.set(e.hash, arr)
  }
  // 2件以上のhashのみ対象（ユニークhashの出現順でグループ番号を付与）
  let groupIdx = 0
  for (const [, group] of hashGroups) {
    if (group.length < 2) continue
    const colorClass = DUP_GROUP_COLORS[groupIdx % DUP_GROUP_COLORS.length]!
    const groupLabel = DUP_GROUP_LABELS[groupIdx % DUP_GROUP_LABELS.length]!
    for (let i = 0; i < group.length; i++) {
      map.set(group[i]!.id, {
        colorClass,
        groupLabel,
        pos: i + 1,
        size: group.length,
      })
    }
    groupIdx++
  }
  return map
})
const dupGroupInfo = (entry: UploadEntry): DupGroupResult | null => {
  return dupGroupMap.value.get(entry.id) ?? null
}

// エラー対応モーダル
const errorTargetEntry = ref<UploadEntry | null>(null)
const openErrorModal = (entry: UploadEntry) => {
  errorTargetEntry.value = entry
}
const doErrorRetake = () => {
  if (!errorTargetEntry.value) return
  // entries（元配列）のインデックスを逆引き
  const idx = entries.value.findIndex(e => e.id === errorTargetEntry.value!.id)
  if (idx !== -1) {
    triggerRetake(idx)
    retakeInputRef.value?.click()
  }
  errorTargetEntry.value = null
}

// 削除確認モーダル
const removeTargetId = ref<string | null>(null)
const confirmRemove = (id: string) => {
  removeTargetId.value = id
}
const doRemove = () => {
  if (removeTargetId.value) {
    removeFile(removeTargetId.value)
    removeTargetId.value = null
  }
}

// エラー・重複子の一括削除
const bulkDeleteTargets = computed(() => {
  return entries.value.filter(e => {
    // エラーファイル
    if (e.status === 'error') return true
    // 重複子（pos>=2）
    const dg = dupGroupInfo(e)
    if (dg && dg.pos >= 2) return true
    return false
  })
})
const showBulkDeleteConfirm = ref(false)
const doBulkDelete = () => {
  const targets = bulkDeleteTargets.value.map(e => e.id)
  for (const id of targets) {
    removeFile(id)
  }
  showBulkDeleteConfirm.value = false
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
  --bp-mobile: 640px;
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
@media (min-width: 641px) {
  .upload-unified { background: #fff; }
}
/* iOS Safari対応: display:noneだと.click()でピッカーが開かない */
.hidden-input {
  position: absolute;
  width: 1px; height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  clip: rect(0,0,0,0);
}

/* ===== メインコンテンツ ===== */
.main-content {
  flex: 1; position: relative; z-index: 1;
  width: 100%;
  max-width: 640px; margin: 0 auto;
  padding: clamp(8px, 2vw, 12px) clamp(8px, 2vw, 12px) 160px;
}
@media (min-width: 641px) {
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
  border: 2px dashed #c7d2fe;
  border-radius: clamp(12px, 2vw, 16px);
  padding: clamp(28px, 5vw, 44px) clamp(12px, 2vw, 16px);
  text-align: center;
  transition: all 0.3s ease;
  background: linear-gradient(145deg, #f8faff 0%, #eef2ff 50%, #f0f7ff 100%);
  position: relative;
}
.drop-zone::before {
  content: ''; position: absolute; inset: -2px;
  border-radius: inherit; padding: 2px;
  background: linear-gradient(135deg, #818cf8, #60a5fa, #34d399);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  opacity: 0; transition: opacity 0.3s;
  pointer-events: none;
}
.drop-zone:hover::before { opacity: 1; }
.drop-zone:hover { border-color: transparent; background: linear-gradient(145deg, #eef2ff 0%, #e0e7ff 50%, #eff6ff 100%); box-shadow: 0 8px 32px rgba(99,102,241,0.1); }
.drop-zone--active { border-color: #22c55e; background: linear-gradient(145deg, #f0fdf4, #dcfce7); }
.drop-zone--active::before { opacity: 0; }
.drop-icon-circle {
  width: clamp(56px, 7vw, 72px); height: clamp(56px, 7vw, 72px);
  border-radius: 50%;
  background: linear-gradient(135deg, #818cf8 0%, #60a5fa 100%);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto clamp(12px, 2vw, 16px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 16px rgba(99,102,241,0.25);
  animation: floatIcon 3s ease-in-out infinite;
}
@keyframes floatIcon {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.drop-zone:hover .drop-icon-circle { transform: scale(1.1); box-shadow: 0 8px 24px rgba(99,102,241,0.35); }
.drop-icon-svg { width: clamp(24px, 3.5vw, 32px); height: clamp(24px, 3.5vw, 32px); color: #fff; }
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
.file-status-icon {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 900; flex-shrink: 0;
  transition: all 0.3s;
}
.file-status-icon--ok { background: #dcfce7; color: #16a34a; }
.file-status-icon--error { background: #fee2e2; color: #dc2626; }
.file-status-icon--dup { background: #fef3c7; color: #92400e; }
.file-status-icon--pending { background: #e0e7ff; color: #4f46e5; }
/* 重複アイコンのグループ色連動（パステル） */
.file-status-icon--dup-color-a { background: #f5dede; color: #8b4f4f; }
.file-status-icon--dup-color-b { background: #dce5f5; color: #4a6289; }
.file-status-icon--dup-color-c { background: #f5eed8; color: #7a5f2e; }
.file-status-icon--dup-color-d { background: #e8eaed; color: #4b5563; }
.file-status-icon--dup-color-e { background: #fce8e8; color: #a06060; }
.file-status-icon--dup-color-f { background: #e4edf7; color: #5a7394; }
.file-status-icon--dup-color-g { background: #f8f0d8; color: #7a6420; }
.file-status-icon--dup-color-h { background: #eef0f2; color: #5a6370; }
.file-info { flex: 1; min-width: 0; }
.file-name { font-size: clamp(10px, 1.2vw, 11px); font-weight: 600; color: #334155; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-size { font-size: clamp(8px, 1vw, 9px); color: #94a3b8; margin: 2px 0 0; }
.file-remove {
  width: 24px; height: 24px; border-radius: 6px; border: none;
  background: transparent; color: #cbd5e1; font-size: 12px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.file-remove:hover { background: #fee2e2; color: #ef4444; }

/* ===== previewExtract結果バッジ（コンテナクエリ対応） ===== */
.badge-container { container-type: inline-size; }
.previewExtract-badges { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
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
  overflow: hidden;
  height: calc(100vh - 120px);
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
.preview-body { flex: 1; display: flex; align-items: center; justify-content: center; padding: clamp(12px, 2vw, 16px); background: #fafafa; overflow: hidden; }
.preview-image { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.preview-pdf { width: 100%; height: 100%; border: none; border-radius: 8px; }
.preview-unsupported { text-align: center; color: #94a3b8; font-size: clamp(11px, 1.5vw, 13px); }
.preview-unsupported-icon { font-size: clamp(36px, 5vw, 48px); margin-bottom: 12px; opacity: 0.5; }

/* 重複グループ左ボーダー色（8色パステル） */
.file-item.dup-color-a { border-left: 4px solid #d4868a; }  /* ローズ */
.file-item.dup-color-b { border-left: 4px solid #7fa3c4; }  /* スカイ */
.file-item.dup-color-c { border-left: 4px solid #c4a456; }  /* アンバー */
.file-item.dup-color-d { border-left: 4px solid #9ca3af; }  /* スレート */
.file-item.dup-color-e { border-left: 4px solid #e8a8a8; }  /* ピーチ */
.file-item.dup-color-f { border-left: 4px solid #a0b8d4; }  /* ラベンダー */
.file-item.dup-color-g { border-left: 4px solid #d4c478; }  /* サフラン */
.file-item.dup-color-h { border-left: 4px solid #b8bfc8; }  /* ミスト */

/* 重複グループタグ（ゴミ箱左横・パステル） */
.dup-tag {
  font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
  white-space: nowrap; flex-shrink: 0; margin-right: 4px;
}
.dup-tag.dup-color-a { background: #f5dede; color: #8b4f4f; }
.dup-tag.dup-color-b { background: #dce5f5; color: #4a6289; }
.dup-tag.dup-color-c { background: #f5eed8; color: #7a5f2e; }
.dup-tag.dup-color-d { background: #e8eaed; color: #4b5563; }
.dup-tag.dup-color-e { background: #fce8e8; color: #a06060; }
.dup-tag.dup-color-f { background: #e4edf7; color: #5a7394; }
.dup-tag.dup-color-g { background: #f8f0d8; color: #7a6420; }
.dup-tag.dup-color-h { background: #eef0f2; color: #5a6370; }

/* 重複子パネル（pos>=2）の斜めストライプ背景（濃い色） */
.file-item.dup-child {
  background: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 6px,
    rgba(0,0,0,0.08) 6px,
    rgba(0,0,0,0.08) 12px
  );
}
.file-item.dup-child:hover {
  background: repeating-linear-gradient(
    -45deg,
    #f1f5f9,
    #f1f5f9 6px,
    rgba(0,0,0,0.12) 6px,
    rgba(0,0,0,0.12) 12px
  );
}

/* 一括削除バー */
.bulk-delete-bar {
  padding: 8px 10px;
  border-bottom: 1px solid #f1f5f9;
}
.bulk-delete-btn {
  width: 100%; padding: 14px 16px;
  border: none; border-radius: 10px;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: #fff;
  font-size: 13px; font-weight: 800; cursor: pointer;
  transition: all 0.25s ease;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 2px 8px rgba(220,38,38,0.25);
  letter-spacing: 0.5px;
}
.bulk-delete-btn:hover {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 16px rgba(220,38,38,0.4);
  transform: translateY(-1px);
}
.bulk-delete-btn:active { transform: scale(0.98); }
.bulk-delete-icon { font-size: 16px; }
.bulk-delete-label { flex: 1; text-align: center; }
.bulk-delete-count {
  background: rgba(255,255,255,0.25); padding: 2px 10px; border-radius: 12px;
  font-size: 12px; font-weight: 800;
}
.modal-subtitle { font-size: 12px; color: #64748b; margin: 4px 0 12px; text-align: center; }

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
@media (min-width: 641px) {
  .footer-bar { border-top-color: #e2e8f0; box-shadow: 0 -4px 20px rgba(0,0,0,0.06); }
  .footer-inner {
    max-width: 1440px;
    padding: clamp(10px, 1.5vw, 14px) clamp(16px, 3vw, 24px);
    display: flex; align-items: center; justify-content: space-between;
  }
}
.footer-summary { display: flex; gap: 16px; font-size: clamp(10px, 1.3vw, 12px); color: #64748b; }
.footer-summary strong { color: #1e293b; font-weight: 800; }


/* ===== モバイル: バッジ（進捗表示用） ===== */
.m-badge { font-size: clamp(8px, 2.2vw, 10px); font-weight: 700; padding: 2px 8px; border-radius: 10px; }
.m-badge--ok { background: #d1fae5; color: #065f46; }
.m-badge--error { background: #fee2e2; color: #dc2626; }
.m-badge--processing { background: #fef3c7; color: #d97706; animation: pulse 1.5s infinite; }
.m-badge--total { color: #9ca3af; border: 1px solid #e5e7eb; }

/* ===== モバイル: 空状態 ===== */
.mobile-empty { margin-top: clamp(20px, 6vw, 40px); display: flex; flex-direction: column; align-items: center; }
.mobile-drop-zone {
  width: 100%; max-width: 360px;
  border: 2px dashed #c7d2fe; border-radius: clamp(20px, 5vw, 28px);
  padding: clamp(28px, 7vw, 44px) clamp(16px, 4vw, 20px);
  text-align: center; transition: all 0.3s; cursor: pointer;
  background: linear-gradient(145deg, #f8faff 0%, #eef2ff 50%, #f0f7ff 100%);
}
.mobile-drop-zone:hover { border-color: #818cf8; background: linear-gradient(145deg, #eef2ff, #e0e7ff); }
.mobile-drop-zone--active { border-color: #22c55e; background: linear-gradient(145deg, #f0fdf4, #dcfce7); }
.mobile-drop-icon-wrap {
  width: clamp(56px, 16vw, 72px); height: clamp(56px, 16vw, 72px);
  border-radius: 50%;
  background: linear-gradient(135deg, #818cf8 0%, #60a5fa 100%);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto clamp(12px, 3vw, 18px);
  box-shadow: 0 4px 20px rgba(99,102,241,0.3);
  animation: floatIcon 3s ease-in-out infinite;
}
.mobile-drop-svg { width: clamp(28px, 8vw, 36px); height: clamp(28px, 8vw, 36px); color: #fff; }
.mobile-drop-emoji { font-size: clamp(36px, 10vw, 48px); margin-bottom: clamp(10px, 3vw, 16px); }
.mobile-drop-title { font-size: clamp(14px, 3.5vw, 16px); font-weight: 700; color: #374151; margin: 0; }
.mobile-drop-sub { font-size: clamp(10px, 2.5vw, 12px); color: #9ca3af; margin: 8px 0 0; }
.mobile-drop-btns { display: flex; gap: clamp(8px, 2vw, 12px); justify-content: center; margin-top: clamp(16px, 4vw, 24px); width: 100%; max-width: 320px; margin-left: auto; margin-right: auto; }
.mobile-btn-camera {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  background: #2563eb; color: #fff;
  font-size: clamp(11px, 3vw, 13px); font-weight: 700;
  padding: clamp(8px, 2vw, 12px) 0;
  border-radius: 16px; border: none; cursor: pointer;
  box-shadow: 0 2px 8px rgba(37,99,235,0.3); transition: all 0.2s; font-family: inherit;
}
.mobile-btn-camera:hover { background: #1d4ed8; }
.mobile-btn-camera:active { transform: scale(0.95); }
.mobile-btn-file {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  background: #fff; color: #2563eb; border: 2px solid #2563eb;
  font-size: clamp(11px, 3vw, 13px); font-weight: 700;
  padding: clamp(8px, 2vw, 12px) 0;
  border-radius: 16px; cursor: pointer;
  transition: all 0.2s; font-family: inherit;
}
.mobile-btn-file:hover { background: #eff6ff; }
.mobile-btn-file:active { transform: scale(0.95); }
.mobile-btn-advanced {
  width: 100%; max-width: 280px; margin-top: 8px;
  display: flex; align-items: center; justify-content: center; gap: 4px;
  background: #f3f4f6; color: #9ca3af; border: 1px dashed #d1d5db;
  font-size: clamp(9px, 2.2vw, 10px); font-weight: 500;
  padding: clamp(6px, 1.5vw, 8px) 12px;
  border-radius: 8px; cursor: pointer;
  transition: all 0.2s; font-family: inherit;
}
.mobile-btn-advanced:hover { background: #e5e7eb; color: #6b7280; }
.mobile-btn-advanced:active { transform: scale(0.97); }
.mobile-drop-hint { margin-top: clamp(12px, 4vw, 20px); font-size: clamp(9px, 2.5vw, 11px); color: #9ca3af; text-align: center; line-height: 1.6; }
.mobile-drop-hint span { color: #cbd5e1; }

/* 説明カード */
.mobile-howto { margin-top: clamp(20px, 6vw, 32px); width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: clamp(8px, 2vw, 12px); }
.mobile-howto-section-title {
  font-size: clamp(13px, 3.5vw, 15px); font-weight: 700; color: #4f46e5;
  margin: 0 0 4px; text-align: center;
  display: flex; align-items: center; gap: 12px;
}
.mobile-howto-section-title::before,
.mobile-howto-section-title::after {
  content: ''; flex: 1; height: 1px;
  background: linear-gradient(90deg, transparent, #c7d2fe, transparent);
}
.mobile-howto-section-title span {
  white-space: nowrap;
}
.mobile-howto-card { display: flex; align-items: flex-start; gap: 12px; background: #fff; border-radius: 16px; padding: clamp(10px, 3vw, 14px) clamp(12px, 3vw, 16px); box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
.mobile-howto-icon { font-size: clamp(16px, 4vw, 20px); flex-shrink: 0; margin-top: 2px; color: #6366f1; font-weight: 700; }
.mobile-howto-title { font-size: clamp(12px, 3vw, 14px); font-weight: 700; color: #374151; margin: 0; }
.mobile-howto-desc { font-size: clamp(11px, 2.8vw, 13px); color: #6b7280; margin: 2px 0 0; }

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
.mobile-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: clamp(8px, 2vw, 12px); align-items: start; }

/* 完了済み省略サマリー（DOM制限時に表示） */
.mobile-hidden-summary {
  grid-column: 1 / -1;
  padding: 8px 12px;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-radius: 8px;
  font-size: 13px;
  color: #065f46;
  text-align: center;
  font-weight: 500;
}

.mobile-card {
  position: relative; border-radius: clamp(12px, 3vw, 16px); overflow: hidden;
  background: #fff; border: 2px solid #e5e7eb;
  transition: all 0.3s; user-select: none;
}
.mobile-card--error { border-color: #f87171; box-shadow: 0 4px 12px rgba(239,68,68,0.15), inset 0 0 0 2px #f87171; cursor: pointer; }
.mobile-card--error:active { transform: scale(0.95); }
.mobile-card--ok { border-color: #34d399; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }

.mobile-card-thumb { aspect-ratio: 3/4; position: relative; background: #f3f4f6; overflow: hidden; }

/* 完了済みカード: img非表示→アイコン表示（Renderer負荷ゼロ。クラッシュ防止） */
.mobile-card-done {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 100%; font-size: clamp(24px, 8vw, 36px);
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}
.mobile-card-done--error {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
}

/* 処理中は追加ボタン無効化 */
.mobile-add-btn:disabled {
  opacity: 0.4; pointer-events: none;
}

/* モバイルカード削除ボタン */
.mobile-card-remove {
  position: absolute; top: 4px; right: 4px; z-index: 5;
  width: clamp(22px, 6vw, 28px); height: clamp(22px, 6vw, 28px);
  border: none; border-radius: 50%; cursor: pointer;
  background: rgba(0,0,0,0.5); color: #fff;
  font-size: clamp(10px, 3vw, 14px); line-height: 1;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s; padding: 0; font-family: inherit;
}
.mobile-card-remove:active { background: rgba(220,38,38,0.8); }
.mobile-card-img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* オーバーレイ（処理中・待機） */
.overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.overlay--queued { background: rgba(0,0,0,0.4); color: #fff; font-size: clamp(9px, 2.5vw, 11px); }
.overlay--processing { background: rgba(0,0,0,0.55); color: #fff; font-size: clamp(7px, 2vw, 9px); font-weight: 600; gap: 6px; }
.spinner { width: clamp(20px, 6vw, 28px); height: clamp(20px, 6vw, 28px); border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 上部ステータスバー（完了後に表示） */
.status-bar {
  position: absolute; top: 0; left: 0; right: 0;
  padding: 3px 6px; text-align: center;
  font-size: clamp(8px, 2.2vw, 11px); font-weight: 700;
  color: #fff; z-index: 2;
}
.status-bar--ok { background: rgba(16,185,129,0.9); }
.status-bar--error { background: rgba(220,38,38,0.9); }
.status-bar--dup { background: rgba(245,158,11,0.9); }
.status-bar--warn { background: rgba(249,115,22,0.9); }

/* カード下部（高さ固定） */
.mobile-card-footer {
  padding: clamp(4px, 1vw, 6px);
  height: clamp(28px, 7vw, 36px);
  display: flex; flex-direction: column; justify-content: center;
  overflow: hidden;
}
.card-footer-text {
  font-size: clamp(8px, 2.2vw, 11px); font-weight: 600; color: #374151;
  margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  line-height: 1.3;
}

/* エラーカード下部: エラー理由 + アクション */
.mobile-card--error .card-footer-text {
  color: #dc2626;
}
.card-error-actions {
  display: flex; flex-direction: column; gap: 3px; margin-top: 4px;
  animation: fadeIn 0.2s ease;
}
.card-action-retake {
  font-size: clamp(6px, 1.6vw, 7px); font-weight: 700;
  background: #3b82f6; color: #fff;
  border: none; border-radius: 6px; padding: 3px 6px;
  cursor: pointer; font-family: inherit; transition: all 0.2s;
}
.card-action-retake:active { transform: scale(0.95); }
.card-action-skip {
  font-size: clamp(5px, 1.4vw, 6px); font-weight: 600;
  background: transparent; color: #9ca3af;
  border: 1px solid #e5e7eb; border-radius: 6px; padding: 2px 6px;
  cursor: pointer; font-family: inherit; transition: all 0.2s;
}
.card-action-skip:active { transform: scale(0.95); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

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
.guide-msg--warn { color: #d97706; }

/* ===== 送付ボタン ===== */
.footer-buttons { display: flex; gap: clamp(6px, 1.5vw, 8px); width: 100%; }
.submit-btn {
  flex: 1; padding: clamp(12px, 3vw, 17px);
  border-radius: clamp(10px, 2vw, 14px); border: none;
  font-size: clamp(13px, 3.2vw, 15px); font-weight: 700;
  cursor: pointer; font-family: inherit;
  transition: all 0.3s;
  min-height: clamp(44px, 6vw, 52px);
}
/* 全件OK → グリーン */
.submit-btn--active {
  background: linear-gradient(135deg, #10b981, #059669); color: #fff;
  box-shadow: 0 4px 14px rgba(16,185,129,0.3);
}
.submit-btn--active:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(16,185,129,0.4); }
.submit-btn--active:active { transform: scale(0.97); }
/* 処理中 → 青系パルス */
.submit-btn--disabled {
  background: linear-gradient(135deg, #3b82f6, #6366f1); color: rgba(255,255,255,0.85);
  cursor: not-allowed;
  animation: btnPulse 2s ease-in-out infinite;
}
@keyframes btnPulse {
  0%, 100% { opacity: 0.7; box-shadow: 0 2px 8px rgba(59,130,246,0.2); }
  50% { opacity: 1; box-shadow: 0 4px 16px rgba(59,130,246,0.4); }
}
.submit-btn--retry {
  background: #fff; color: #3b82f6;
  border: 2px solid #3b82f6;
}
.submit-btn--retry:hover { background: #eff6ff; }
.submit-btn--retry:active { transform: scale(0.97); }
/* エラーあり → オレンジ */
.submit-btn--force {
  background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff;
  box-shadow: 0 4px 14px rgba(245,158,11,0.3);
}
.submit-btn--force:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(245,158,11,0.4); }
.submit-btn--force:active { transform: scale(0.97); }

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
/* 完了モーダル: 2ボタン配置 */
.modal-complete-btns {
  flex-direction: column; gap: 10px;
}
.modal-btn--primary {
  flex: 1; padding: clamp(10px, 2.5vw, 14px);
  border-radius: clamp(10px, 2vw, 14px); border: none;
  background: linear-gradient(135deg, #3b82f6, #6366f1); color: #fff;
  font-size: clamp(12px, 3vw, 14px); font-weight: 700;
  cursor: pointer; font-family: inherit; transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(59,130,246,0.3);
}
.modal-btn--primary:hover { background: linear-gradient(135deg, #2563eb, #4f46e5); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(59,130,246,0.4); }

/* 削除確認モーダル */
.modal-box {
  background: #fff; border-radius: clamp(16px, 3vw, 24px);
  padding: clamp(24px, 5vw, 32px);
  max-width: 320px; width: 100%; text-align: center;
  box-shadow: 0 25px 50px rgba(0,0,0,0.15);
}
.modal-confirm-btns {
  display: flex; gap: 12px; margin-top: 16px;
}
.modal-btn--danger {
  flex: 1; padding: clamp(10px, 2.5vw, 12px);
  border-radius: clamp(8px, 2vw, 12px); border: none;
  background: #ef4444; color: #fff;
  font-size: clamp(13px, 3.5vw, 15px); font-weight: 700;
  cursor: pointer; font-family: inherit; transition: background 0.2s;
}
.modal-btn--danger:hover { background: #dc2626; }
.modal-btn--cancel {
  flex: 1; padding: clamp(10px, 2.5vw, 12px);
  border-radius: clamp(8px, 2vw, 12px); border: 2px solid #d1d5db;
  background: #fff; color: #374151;
  font-size: clamp(13px, 3.5vw, 15px); font-weight: 700;
  cursor: pointer; font-family: inherit; transition: all 0.2s;
}
.modal-btn--cancel:hover { background: #f9fafb; }

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
.upload-unified .guide-area.mobile-only { display: block !important; }

/* PC表示: 641px以上 */
@media (min-width: 641px) {
  .upload-unified .pc-only { display: block !important; }
  .upload-unified .two-col.pc-only { display: grid !important; }
  .upload-unified .header-stats.pc-only { display: flex !important; }
  .upload-unified .footer-summary.pc-only { display: flex !important; }
  .upload-unified .mobile-only { display: none !important; }
  .upload-unified .mobile-section.mobile-only { display: none !important; }
  .upload-unified .guide-area.mobile-only { display: none !important; }
  /* submit-btn内のspan制御 */
  .upload-unified .submit-btn span.pc-only { display: inline !important; }
  .upload-unified .submit-btn span.mobile-only { display: none !important; }
}
/* モバイル時のsubmit-btn内span */
@media (max-width: 640px) {
  .upload-unified .submit-btn span.pc-only { display: none !important; }
  .upload-unified .submit-btn span.mobile-only { display: inline !important; }
}
</style>
