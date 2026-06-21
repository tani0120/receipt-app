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

          <!-- D-2: MCPインポートカード（MF連携先のみ有効） -->
          <div class="upload-card" :class="{ 'card--disabled': !mfLinked }">
            <h2 class="card-title"><i class="fa-solid fa-cloud-arrow-down"></i> {{ UI_MSG.MFから直接取込 }}</h2>

            <div v-if="!mfLinked" class="disabled-message">
              <i class="fa-solid fa-link-slash"></i>
              <p>{{ UI_MSG.MF連携設定必要 }}</p>
            </div>

            <div v-else class="mcp-import-area">
              <!-- D-4: 進捗表示 -->
              <div v-if="mcpImporting" class="mcp-progress">
                <div class="mcp-spinner"></div>
                <p class="mcp-status">{{ mcpImportStatus }}</p>
              </div>

              <template v-else>
                <!-- 完了結果表示（折りたたみ） -->
                <div v-if="mcpImportResult" class="mcp-result-compact">
                  <div class="mcp-result-header" :class="mcpImportResult.success ? 'mcp-result--success' : 'mcp-result--error'">
                    <i :class="mcpImportResult.success ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"></i>
                    <span>{{ mcpImportResult.success ? UI_MSG.MF取込完了 : UI_MSG.MF取込失敗 }}</span>
                    <button class="mcp-toggle" @click="mcpDetailOpen = !mcpDetailOpen">
                      <i :class="mcpDetailOpen ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
                      {{ mcpDetailOpen ? UI_MSG.MF取込詳細開 : UI_MSG.MF取込詳細閉 }}
                    </button>
                  </div>
                  <ul v-if="mcpDetailOpen && mcpImportResult.results.length" class="mcp-result-list">
                    <li v-for="(r, i) in mcpImportResult.results.slice(0, 15)" :key="i">{{ r }}</li>
                    <li v-if="mcpImportResult.results.length > 15" class="mcp-result-more">
                      ...他{{ mcpImportResult.results.length - 15 }}{{ UI_MSG.件ラベル }}
                    </li>
                  </ul>
                </div>

                <!-- 取込ボタン（常時表示） -->
                <div class="mcp-ready">
                  <div class="mcp-icon-wrapper">
                    <i class="fa-solid fa-cloud-arrow-down mcp-icon"></i>
                  </div>
                  <p class="mcp-desc">{{ UI_MSG.MF取込説明 }}</p>
                  <button class="btn-mcp-import" @click="executeMcpImport">
                    <i class="fa-solid fa-download"></i>
                    {{ mcpImportResult ? UI_MSG.再取込する : UI_MSG.MFから取込実行 }}
                  </button>
                </div>
              </template>
            </div>
          </div>

          <!-- D-3: CSVアップロードカード（MF未連携先のみ有効） -->
          <div class="upload-card" :class="{ 'card--disabled': mfLinked }">
            <h2 class="card-title"><i class="fa-solid fa-cloud-arrow-up"></i> CSVファイルをアップロード</h2>

            <div v-if="mfLinked" class="disabled-message">
              <i class="fa-solid fa-ban"></i>
              <p>{{ UI_MSG.MF連携先CSV無効 }}</p>
            </div>

            <template v-else>
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
                    {{ isImporting ? UI_MSG.取込中 : UI_MSG.取込実行 }}
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
            </template>
          </div>
        </div>

        <!-- 右カラム: 取込済みデータ（2段構成） -->
        <div class="history-area">
          <div class="history-card">
            <h2 class="card-title"><i class="fa-solid fa-clock-rotate-left"></i> 取込済みデータ</h2>

            <div v-if="importedFiles.length === 0" class="history-empty">
              <i class="fa-solid fa-inbox history-empty-icon"></i>
              <p class="history-empty-text">{{ UI_MSG.取込データなし }}</p>
              <p class="history-empty-sub">{{ UI_MSG.取込データなし補足 }}</p>
            </div>

            <template v-if="importedFiles.length > 0">
              <!-- 最終取込日 -->
              <div class="last-import-banner">
                <i class="fa-solid fa-clock"></i>
                <span>{{ UI_MSG.最終取込日ラベル }}{{ latestImportDateTime }}</span>
              </div>

              <!-- サマリー -->
              <div class="history-summary">
                <div class="summary-item">
                  <span class="summary-label">{{ UI_MSG.取込済み過去仕訳 }}</span>
                  <span class="summary-value">{{ totalRows }}{{ UI_MSG.件ラベル }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">{{ UI_MSG.年度数ラベル }}</span>
                  <span class="summary-value">{{ fiscalYearGroups.length }}{{ UI_MSG.期ラベル }}</span>
                </div>
              </div>

              <!-- ■ 上段: 年度別サマリー（全期表示・最新バッチのみ詳細） -->
              <div class="history-section-title"><i class="fa-solid fa-layer-group"></i> {{ UI_MSG.年度別サマリー }}</div>
              <div class="history-list">
                <div v-for="group in allFiscalYearGroups" :key="group.year" class="fiscal-year-group">
                  <div class="fiscal-year-header">
                    <span class="fiscal-year-icon">📅</span>
                    <span class="fiscal-year-label">{{ group.year }}{{ UI_MSG.年度接尾 }}</span>
                    <template v-if="group.hasBatches">
                      <span class="fiscal-year-period">{{ group.minDate }} ～ {{ group.maxDate }}</span>
                      <span class="fiscal-year-count">{{ group.totalCount }}{{ UI_MSG.件ラベル }}</span>
                    </template>
                    <span v-else class="fiscal-year-empty">{{ UI_MSG.該当なし }}</span>
                  </div>
                  <!-- 最新バッチのみ表示 -->
                  <div v-if="group.latestBatch" class="fiscal-year-batches">
                    <div class="history-item" @click="showDownloadModal(group.latestBatch)" style="cursor: pointer;">
                      <div class="history-item-info">
                        <div class="history-item-icon"><i class="fa-solid fa-check-circle"></i></div>
                        <div>
                          <p class="history-item-name">
                            {{ UI_MSG.インポート日ラベル }}{{ formatDateTime(group.latestBatch.importedAt) }}　<span class="history-item-count">{{ group.latestBatch.rowCount }}{{ UI_MSG.件ラベル }}</span>
                          </p>
                          <p class="history-item-date">
                            {{ UI_MSG.仕訳日付ラベル }}{{ group.latestBatch.minVoucherDate }} ～ {{ group.latestBatch.maxVoucherDate }}
                          </p>
                        </div>
                      </div>
                      <button class="history-item-delete" @click.stop="removeImported(group.latestBatch.id)" title="削除">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ■ 下段: 取込履歴（バッチ時刻単位・折りたたみ） -->
              <div class="history-section-title"><i class="fa-solid fa-history"></i> {{ UI_MSG.取込履歴 }}</div>
              <div class="batch-history-list">
                <div v-for="histGroup in batchHistoryGroups" :key="histGroup.key" class="batch-history-group">
                  <button class="batch-history-header" @click="toggleBatchHistory(histGroup.key)">
                    <i :class="openBatchHistories.has(histGroup.key) ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-right'"></i>
                    <span class="batch-history-date">{{ UI_MSG.取込日ラベル }}{{ histGroup.label }}</span>
                    <span class="batch-history-summary">{{ histGroup.totalCount }}{{ UI_MSG.件ラベル }}（{{ histGroup.batches.length }}{{ UI_MSG.バッチラベル }}）</span>
                  </button>
                  <div v-if="openBatchHistories.has(histGroup.key)" class="batch-history-detail">
                    <div v-for="group in histGroup.yearGroups" :key="group.year" class="batch-history-year">
                      <div class="batch-history-year-header">
                        <span>📅 {{ group.year }}{{ UI_MSG.年度接尾 }}</span>
                        <span class="batch-history-year-count">{{ group.count }}{{ UI_MSG.件ラベル }}</span>
                      </div>
                      <div v-for="b in group.batches" :key="b.id" class="history-item" @click="showDownloadModal(b)" style="cursor: pointer;">
                        <div class="history-item-info">
                          <div class="history-item-icon"><i class="fa-solid fa-check-circle"></i></div>
                          <div>
                            <p class="history-item-name">
                              {{ b.rowCount }}{{ UI_MSG.件ラベル }}
                            </p>
                            <p class="history-item-date">
                              {{ UI_MSG.仕訳日付ラベル }}{{ b.minVoucherDate }} ～ {{ b.maxVoucherDate }}
                            </p>
                          </div>
                        </div>
                        <button class="history-item-delete" @click.stop="removeImported(b.id)" title="削除">
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                    <!-- 0件の期 -->
                    <div v-for="fy in histGroup.emptyYears" :key="fy" class="batch-history-year">
                      <div class="batch-history-year-header">
                        <span>📅 {{ fy }}{{ UI_MSG.年度接尾 }}</span>
                        <span class="batch-history-year-empty">{{ UI_MSG.ゼロ件 }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- CSVダウンロードモーダル -->
    <div v-if="downloadTarget" class="modal-overlay" @click.self="downloadTarget = null">
      <div class="modal-card">
        <h3 class="modal-title"><i class="fa-solid fa-download"></i> CSVダウンロード</h3>
        <p class="modal-desc">
          以下のバッチのCSVをダウンロードしますか？
        </p>
        <div class="modal-detail">
          <p>顧問先：{{ downloadTarget.clientId }}</p>
          <p>インポート日：{{ formatDate(downloadTarget.importedAt) }}</p>
          <p>仕訳日付：{{ downloadTarget.minVoucherDate }} ～ {{ downloadTarget.maxVoucherDate }}</p>
          <p>件数：{{ downloadTarget.rowCount }}件</p>
        </div>
        <div class="modal-actions">
          <button class="btn-modal-yes" @click="executeDownload" :disabled="isDownloading">
            {{ isDownloading ? UI_MSG.ダウンロード中 : UI_MSG.はい }}
          </button>
          <button class="btn-modal-no" @click="downloadTarget = null">いいえ</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { UI_MSG } from '@/constants/uiMessages'
import { MF_CSV_HEADER_KEYWORD, MF_CSV_HEADERS } from '@/constants/journalConstants'
import { useRepositories } from '@/composables/useRepositories'

const route = useRoute()
const clientId = route.params.clientId as string
const { repos } = useRepositories()

/**
 * CSVファイルのエンコーディングを自動検出して読み取る
 * 判定ロジック:
 *   1. 先頭3バイトがEF BB BF → UTF-8 BOM付き
 *   2. UTF-8でデコード → ヘッダーに「取引No」が含まれれば確定
 *   3. UTF-8で「取引No」が見つからない → Shift-JISで再試行
 */
async function readCsvFileAutoEncoding(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  // BOM検出
  const has_bom = bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF

  if (has_bom) {
    // BOM付きUTF-8
    return new TextDecoder('utf-8').decode(buffer)
  }

  // BOMなし: まずUTF-8で試行
  const utf8_text = new TextDecoder('utf-8').decode(buffer)
  const first_line = utf8_text.split(/\r?\n/)[0] ?? ''
  if (first_line.includes(MF_CSV_HEADER_KEYWORD)) {
    return utf8_text
  }

  // UTF-8で「取引No」が見つからない → Shift-JISで再試行
  const sjis_text = new TextDecoder('shift_jis').decode(buffer)
  const sjis_first_line = sjis_text.split(/\r?\n/)[0] ?? ''
  if (sjis_first_line.includes(MF_CSV_HEADER_KEYWORD)) {
    return sjis_text
  }

  // どちらでも見つからない場合はUTF-8のまま返す（パーサー側でエラーになる）
  return utf8_text
}

// 状態
const isDragging = ref(false)
const uploadedFile = ref<File | null>(null)
const rowCount = ref(0)
const isImporting = ref(false)

/** MF連携状態（D-1: getAuthStatusで判定。D-2/D-3のグレーアウトで使用） */
const mfLinked = ref(false)

/** D-4: MCPインポート進捗状態 */
const mcpImporting = ref(false)
const mcpImportStatus = ref('')
const mcpImportResult = ref<{ success: boolean; results: string[] } | null>(null)
const mcpDetailOpen = ref(false)

/** MFから取得した全期情報（年度別サマリーの「取込可能な全期」表示用） */
interface FiscalYearInfo {
  fiscalYear: number
  startDate: string
  endDate: string
}
const mfFiscalYears = ref<FiscalYearInfo[]>([])

/** 取込履歴の折りたたみ状態（keyはバッチ時刻ラベル） */
const openBatchHistories = ref(new Set<string>())

// 取込済みデータ
interface ImportedFile {
  id: string
  clientId: string
  rowCount: number
  importedAt: string
  minVoucherDate: string
  maxVoucherDate: string
}
const importedFiles = ref<ImportedFile[]>([])

const totalRows = computed(() => importedFiles.value.reduce((sum, f) => sum + f.rowCount, 0))

/** 年度別グルーピング（minVoucherDateの年をキーに。データがある年度のみ） */
interface FiscalYearGroup {
  year: number
  minDate: string
  maxDate: string
  totalCount: number
  hasBatches: boolean
  batches: ImportedFile[]
  latestBatch: ImportedFile | null
}
const fiscalYearGroups = computed<FiscalYearGroup[]>(() => {
  const groups = new Map<number, ImportedFile[]>()
  for (const f of importedFiles.value) {
    const year = f.minVoucherDate ? parseInt(f.minVoucherDate.slice(0, 4), 10) : 0
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year)!.push(f)
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, batches]) => {
      const dates = batches.flatMap(b => [b.minVoucherDate, b.maxVoucherDate]).filter(Boolean).sort()
      const sorted = [...batches].sort((a, b) => b.importedAt.localeCompare(a.importedAt))
      return {
        year,
        minDate: dates[0]?.slice(5) || '',
        maxDate: dates[dates.length - 1]?.slice(5) || '',
        totalCount: batches.reduce((sum, b) => sum + b.rowCount, 0),
        hasBatches: true,
        batches: sorted,
        latestBatch: sorted[0] || null,
      }
    })
})

/** 全期の年度別表示（MF期情報 + 実バッチデータを統合。バッチなし期は「該当なし」） */
const allFiscalYearGroups = computed<FiscalYearGroup[]>(() => {
  // 実バッチがある年度
  const batchYears = new Map(fiscalYearGroups.value.map(g => [g.year, g]))
  // MF期情報の年度
  const mfYears = new Set(mfFiscalYears.value.map(f => f.fiscalYear))
  // 全年度 = 実バッチ年度 ∪ MF期年度
  const allYears = new Set([...batchYears.keys(), ...mfYears])
  return [...allYears]
    .sort((a, b) => b - a)
    .map(year => {
      if (batchYears.has(year)) return batchYears.get(year)!
      return {
        year,
        minDate: '',
        maxDate: '',
        totalCount: 0,
        hasBatches: false,
        batches: [],
        latestBatch: null,
      }
    })
})

/** 最終取込日（全バッチの最新imported_at） */
const latestImportDateTime = computed(() => {
  if (importedFiles.value.length === 0) return ''
  const latest = importedFiles.value.reduce((a, b) =>
    a.importedAt > b.importedAt ? a : b
  )
  return formatDateTime(latest.importedAt)
})

/** バッチ履歴グループ（imported_at時刻単位） */
interface BatchHistoryGroup {
  key: string
  label: string
  totalCount: number
  batches: ImportedFile[]
  yearGroups: { year: number; count: number; batches: ImportedFile[] }[]
  emptyYears: number[]
}
const batchHistoryGroups = computed<BatchHistoryGroup[]>(() => {
  // imported_atの分単位でグルーピング（同一インポート操作を束ねる）
  const groups = new Map<string, ImportedFile[]>()
  for (const f of importedFiles.value) {
    const key = f.importedAt.slice(0, 16) // YYYY-MM-DDTHH:mm
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(f)
  }
  // MF期の全年度
  const mfYearSet = new Set(mfFiscalYears.value.map(f => f.fiscalYear))
  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, batches]) => {
      // 年度別に分類
      const yearMap = new Map<number, ImportedFile[]>()
      for (const b of batches) {
        const year = b.minVoucherDate ? parseInt(b.minVoucherDate.slice(0, 4), 10) : 0
        if (!yearMap.has(year)) yearMap.set(year, [])
        yearMap.get(year)!.push(b)
      }
      const yearGroups = [...yearMap.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([year, yBatches]) => ({
          year,
          count: yBatches.reduce((sum, b) => sum + b.rowCount, 0),
          batches: yBatches,
        }))
      // 0件の期（MF期にあるがこのバッチにはない年度）
      const batchYearSet = new Set(yearMap.keys())
      const emptyYears = [...mfYearSet].filter(y => !batchYearSet.has(y)).sort((a, b) => b - a)
      return {
        key,
        label: formatDateTime(key),
        totalCount: batches.reduce((sum, b) => sum + b.rowCount, 0),
        batches,
        yearGroups,
        emptyYears,
      }
    })
})

/** 取込履歴の折りたたみトグル */
const toggleBatchHistory = (key: string) => {
  const s = new Set(openBatchHistories.value)
  if (s.has(key)) s.delete(key)
  else s.add(key)
  openBatchHistories.value = s
}

// 日付フォーマット（ISO文字列 → yyyy-mm-dd）
const formatDate = (isoStr: string): string => {
  if (!isoStr) return ''
  return isoStr.slice(0, 10)
}

/** 日時フォーマット（ISO文字列 → YYYY-MM-DD HH:mm） */
const formatDateTime = (isoStr: string): string => {
  if (!isoStr) return ''
  // ISO形式 or 分単位キー（YYYY-MM-DDTHH:mm）
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr.slice(0, 16).replace('T', ' ')
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── サーバーからバッチ一覧を取得 ──
const refreshBatches = async () => {
  try {
    const { createRepositories } = await import('@/repositories');
    const repos = createRepositories();
    const data = await repos.confirmedJournal.listBatches(clientId);
    importedFiles.value = (data.batches || []).map((b) => ({
      id: b.import_batch_id,
      clientId: b.client_id || clientId,
      rowCount: b.count,
      importedAt: b.imported_at,
      minVoucherDate: b.min_voucher_date || '',
      maxVoucherDate: b.max_voucher_date || '',
    }))
    console.log(`[HistoryImport] ${importedFiles.value.length}バッチをサーバーから読み込み`)
  } catch (err) {
    console.error('[HistoryImport] バッチ一覧の取得失敗:', err)
  }
}

// 起動時に自動取得（バッチ一覧 + MF連携状態 + 全期情報）
onMounted(async () => {
  // バッチ一覧取得
  await refreshBatches()

  // D-1: MF連携状態取得（PortalPage L272の既存パターン踏襲）
  try {
    const { createRepositories } = await import('@/repositories')
    const repos = createRepositories()
    const data = await repos.mfAuth.getAuthStatus(clientId) as { authenticated: boolean }
    mfLinked.value = data.authenticated
    console.log(`[HistoryImport] MF連携状態: ${mfLinked.value ? '連携済み' : '未連携'} (clientId=${clientId})`)

    // MF連携先の場合、全期情報を取得（年度別サマリーで「該当なし」表示用）
    if (mfLinked.value) {
      try {
        const termData = await repos.mfAuth.getTermSettings(clientId) as { settings?: { term_settings?: Array<{ fiscal_year: number; start_date: string; end_date: string }> } }
        const terms = termData.settings?.term_settings || []
        if (Array.isArray(terms)) {
          mfFiscalYears.value = terms.map(t => ({
            fiscalYear: t.fiscal_year,
            startDate: t.start_date,
            endDate: t.end_date,
          }))
          console.log(`[HistoryImport] MF期情報: ${mfFiscalYears.value.length}期取得`)
        }
      } catch {
        console.warn('[HistoryImport] MF期情報の取得失敗（年度別サマリーに影響なし）')
      }
    }
  } catch {
    // 取得失敗時は未連携とみなす（グレーアウト判定に影響しない安全側）
    console.warn('[HistoryImport] MF認証状態の取得失敗（未連携として扱う）')
  }
})

/** D-2/D-4: MCPインポート実行 */
const executeMcpImport = async () => {
  mcpImporting.value = true
  mcpImportStatus.value = 'MFからデータを取込中...'
  mcpImportResult.value = null

  try {
    const data = await repos.mfAuth.importJournals({ clientId }) as {
      success?: boolean; results?: string[]; error?: string;
      fiscalYears?: FiscalYearInfo[]
    }

    if (data.success) {
      mcpImportResult.value = { success: true, results: data.results || [] }
      // 全期情報を保存（年度別サマリーで使用）
      if (data.fiscalYears) {
        mfFiscalYears.value = data.fiscalYears
      }
      console.log('[HistoryImport] MCPインポート完了:', data)
      // バッチ一覧を更新
      await refreshBatches()
    } else {
      mcpImportResult.value = { success: false, results: [data.error || '取込に失敗しました'] }
      console.error('[HistoryImport] MCPインポート失敗:', data)
    }
  } catch (err) {
    mcpImportResult.value = { success: false, results: ['ネットワークエラーが発生しました'] }
    console.error('[HistoryImport] MCPインポートエラー:', err)
  } finally {
    mcpImporting.value = false
    mcpImportStatus.value = ''
  }
}

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

  try {
    // CSVテキストを読み取り（UTF-8 / Shift-JIS 自動検出）
    const csv_text = await readCsvFileAutoEncoding(uploadedFile.value)

    // APIにPOST（Repository経由）
    const { createRepositories } = await import('@/repositories');
    const repos = createRepositories();
    const result = await repos.confirmedJournal.importCsv(clientId, csv_text);

    if (!result.ok) {
      alert(`${UI_MSG.取込エラー}: ${result.message || UI_MSG.不明なエラー}`)
      isImporting.value = false
      return
    }

    // 警告があれば表示
    if (result.warnings && result.warnings.length > 0) {
      console.warn('[HistoryImport] 警告:', result.warnings)
    }

    if (result.added === 0) {
      const warning_msg = result.warnings?.join('\n') || UI_MSG.パース失敗
      alert(`取込できませんでした：\n${warning_msg}`)
      isImporting.value = false
      return
    }

    // 成功メッセージ（重複スキップがあれば併記）
    const skip_msg = result.skipped > 0 ? `（重複${result.skipped}件スキップ）` : ''
    console.log(`[HistoryImport] ${result.added}件取込完了${skip_msg}。DB総数: ${result.total_in_db}件`)

    // バッチ一覧を再取得（voucher_date範囲等の正確なデータを取得）
    await refreshBatches()

    uploadedFile.value = null
    rowCount.value = 0
  } catch (err) {
    console.error('[HistoryImport] 取込失敗:', err)
    alert(UI_MSG.取込失敗サーバー)
  } finally {
    isImporting.value = false
  }
}

// 取込済みデータ削除（サーバーAPIからも削除）
const removeImported = async (id: string) => {
  if (!confirm(UI_MSG.取込データ削除確認)) return

  try {
    const { createRepositories } = await import('@/repositories');
    const repos = createRepositories();
    const result = await repos.confirmedJournal.deleteBatch(id);
    importedFiles.value = importedFiles.value.filter(f => f.id !== id)
    console.log(`[HistoryImport] バッチ${id}削除完了（${result.removed}件）`)
  } catch (err) {
    console.error('[HistoryImport] 削除失敗:', err)
    alert(UI_MSG.削除失敗サーバー)
  }
}

// ── CSVダウンロード ──
const downloadTarget = ref<ImportedFile | null>(null)
const isDownloading = ref(false)

const showDownloadModal = (item: ImportedFile) => {
  downloadTarget.value = item
}

const executeDownload = async () => {
  if (!downloadTarget.value) return
  isDownloading.value = true

  try {
    const { createRepositories } = await import('@/repositories');
    const repos = createRepositories();
    const data = await repos.confirmedJournal.getJournalsByBatch(downloadTarget.value.id);
    const journals = data.journals || []

    if (journals.length === 0) {
      alert(UI_MSG.仕訳データなし)
      return
    }

    const headers = [...MF_CSV_HEADERS]

    const rows: string[] = [headers.join(',')]

    for (const j of journals) {
      const max_lines = Math.max(
        (j.debit_entries || []).length,
        (j.credit_entries || []).length,
        1
      )

      for (let i = 0; i < max_lines; i++) {
        const d = (j.debit_entries || [])[i]
        const c = (j.credit_entries || [])[i]

        const fields = [
          j.mf_transaction_no ?? '',
          (j.voucher_date || '').replace(/-/g, '/'),
          d?.account ?? '',
          d?.sub_account ?? '',
          d?.department ?? '',
          d?.vendor_name ?? '',
          d?.tax_category_id ?? '',
          d?.invoice ?? '',
          d?.amount ?? '',
          d?.tax_amount ?? '',
          c?.account ?? '',
          c?.sub_account ?? '',
          c?.department ?? '',
          c?.vendor_name ?? '',
          c?.tax_category_id ?? '',
          c?.invoice ?? '',
          c?.amount ?? '',
          c?.tax_amount ?? '',
          i === 0 ? (j.description ?? '') : '',
          i === 0 ? (j.memo ?? '') : '',
          i === 0 ? (j.tags ?? '') : '',
          i === 0 ? (j.mf_journal_type ?? '') : '',
          i === 0 && j.is_closing_entry ? '○' : '',
        ]

        rows.push(fields.map(f => csvEscape(String(f))).join(','))
      }
    }

    const csv_text = rows.join('\r\n')
    const bom = '\uFEFF'
    const blob = new Blob([bom + csv_text], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `confirmed_journals_${downloadTarget.value.clientId}_${formatDate(downloadTarget.value.importedAt)}.csv`
    a.click()
    URL.revokeObjectURL(url)

    downloadTarget.value = null
    console.log(`[HistoryImport] CSV出力完了: ${journals.length}件`)
  } catch (err) {
    console.error('[HistoryImport] CSVダウンロード失敗:', err)
    alert(UI_MSG.CSVダウンロード失敗)
  } finally {
    isDownloading.value = false
  }
}

/** CSV値エスケープ */
const csvEscape = (val: string): string => {
  if (!val) return ''
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return '"' + val.replace(/"/g, '""') + '"'
  }
  return val
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
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.history-item-count {
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
}
.history-item-meta {
  font-size: 10px;
  color: #64748b;
  margin: 2px 0 0;
}
.history-item-date {
  font-size: 13px;
  font-weight: 700;
  color: #1e3a5f;
  margin: 3px 0 0;
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

/* CSVダウンロードモーダル */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-card {
  background: white;
  border-radius: 16px;
  padding: 28px 32px;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}
.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e3a5f;
  margin-bottom: 12px;
}
.modal-title i {
  color: #3b82f6;
  margin-right: 8px;
}
.modal-desc {
  font-size: 14px;
  color: #475569;
  margin-bottom: 16px;
}
.modal-detail {
  background: #f0f9ff;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 20px;
}
.modal-detail p {
  font-size: 13px;
  color: #1e3a5f;
  margin: 4px 0;
}
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
.btn-modal-yes {
  padding: 10px 28px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-modal-yes:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
}
.btn-modal-yes:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
.btn-modal-no {
  padding: 10px 28px;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-modal-no:hover {
  background: #e2e8f0;
}

/* バッチ行ホバー */
.history-item:hover {
  background: #f0f9ff;
  border-radius: 8px;
}

/* D-3: グレーアウトカード */
.card--disabled {
  opacity: 0.5;
  pointer-events: none;
  user-select: none;
}

/* D-2/D-3: 無効メッセージ */
.disabled-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: #94a3b8;
}
.disabled-message i {
  font-size: 28px;
}
.disabled-message p {
  font-size: 13px;
  margin: 0;
}

/* D-2: MCPインポートエリア */
.mcp-import-area {
  padding: 8px 0;
}
.mcp-ready {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
}
.mcp-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
  display: flex;
  align-items: center;
  justify-content: center;
}
.mcp-icon {
  font-size: 24px;
  color: #3b82f6;
}
.mcp-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  text-align: center;
}
.btn-mcp-import {
  padding: 10px 24px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-mcp-import:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
}

/* D-4: 進捗スピナー */
.mcp-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 0;
}
.mcp-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: mcp-spin 0.8s linear infinite;
}
@keyframes mcp-spin {
  to { transform: rotate(360deg); }
}
.mcp-status {
  font-size: 14px;
  color: #3b82f6;
  font-weight: 500;
  margin: 0;
}

/* D-4: 結果表示 */
.mcp-result {
  padding: 12px 0;
}
.mcp-result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
}
.mcp-result--success { color: #16a34a; }
.mcp-result--error { color: #dc2626; }
.mcp-result-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
  font-size: 12px;
  color: #475569;
}
.mcp-result-list li {
  padding: 3px 0;
  border-bottom: 1px solid #f1f5f9;
}
.mcp-result-more {
  color: #94a3b8;
  font-style: italic;
}

/* 案7: 折りたたみトグル */
.mcp-toggle {
  margin-left: auto;
  background: none;
  border: none;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.15s;
}
.mcp-toggle:hover {
  background: #f1f5f9;
}
.mcp-result-compact {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

/* 案7: 年度別グルーピング */
.fiscal-year-group {
  margin-bottom: 12px;
}
.fiscal-year-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f0f9ff, #eff6ff);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 6px;
}
.fiscal-year-icon {
  font-size: 16px;
}
.fiscal-year-label {
  flex-shrink: 0;
}
.fiscal-year-period {
  font-size: 12px;
  color: #64748b;
  font-weight: 400;
}
.fiscal-year-count {
  margin-left: auto;
  font-size: 13px;
  color: #3b82f6;
  font-weight: 700;
}
.fiscal-year-batches {
  padding-left: 8px;
}
.fiscal-year-empty {
  margin-left: auto;
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
}

/* 最終取込日バナー */
.last-import-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #1e40af;
  margin-top: 12px;
}
.last-import-banner i {
  color: #3b82f6;
}

/* セクションタイトル */
.history-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  margin: 16px 0 8px;
  padding-bottom: 6px;
  border-bottom: 2px solid #e2e8f0;
}
.history-section-title i {
  color: #64748b;
  font-size: 12px;
}

/* 取込履歴 */
.batch-history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.batch-history-group {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}
.batch-history-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  background: #f8fafc;
  border: none;
  cursor: pointer;
  font-size: 13px;
  text-align: left;
  transition: background 0.15s;
}
.batch-history-header:hover {
  background: #f1f5f9;
}
.batch-history-header i {
  color: #64748b;
  font-size: 10px;
  width: 12px;
  flex-shrink: 0;
}
.batch-history-date {
  font-weight: 600;
  color: #1e293b;
}
.batch-history-summary {
  margin-left: auto;
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}
.batch-history-detail {
  padding: 8px 12px 12px;
  border-top: 1px solid #e2e8f0;
}
.batch-history-year {
  margin-bottom: 8px;
}
.batch-history-year:last-child {
  margin-bottom: 0;
}
.batch-history-year-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: #f0f9ff;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 4px;
}
.batch-history-year-count {
  font-size: 12px;
  color: #3b82f6;
  font-weight: 700;
}
.batch-history-year-empty {
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
}
</style>
