<template>
  <div class="pg-container">
    <!-- 上段: フィルター行 -->
    <div class="pg-filter-bar">
      <div class="pg-filters">
        <div class="pg-search-wrap">
          <i class="fa-solid fa-magnifying-glass pg-search-icon"></i>
          <input v-model="filterClient" type="text" placeholder="顧問先" class="pg-search-input">
        </div>
        <select v-model="filterStaff" class="pg-select">
          <option value="">担当者</option>
          <option v-for="s in allStaff" :key="s.uuid" :value="s.name">{{ s.name }}</option>
        </select>
        <label class="pg-check-label">
          <input type="checkbox" v-model="onlyUnexported">
          未出力がある顧問先のみ表示
        </label>
      </div>
      <div class="pg-right-info">
        <span class="pg-tag-info"><i class="fa-solid fa-tags"></i> タグ/完了日時({{ tagCount }})</span>
        <span class="pg-build-info"><i class="fa-solid fa-gear"></i> 構築番: {{ buildDate }}</span>
      </div>
    </div>

    <!-- 中段: ページネーション + アクション -->
    <div class="pg-action-bar">
      <div class="pg-pagination">
        <span class="pg-page-arrow" :class="{ disabled: currentPage <= 1 }" @click="currentPage = Math.max(1, currentPage - 1)">＜</span>
        <span
          v-for="p in displayPages" :key="p"
          class="pg-page-num" :class="{ active: p === currentPage }"
          @click="currentPage = p"
        >{{ p }}</span>
        <span class="pg-page-arrow" :class="{ disabled: currentPage >= totalPages }" @click="currentPage = Math.min(totalPages, currentPage + 1)">＞</span>
        <span class="pg-page-info">{{ pageStartIndex }}~{{ pageEndIndex }} / 全{{ totalCount }}件</span>
      </div>
      <div class="pg-actions">
        <button class="pg-btn pg-btn-secondary" @click="refreshData"><i class="fa-solid fa-arrows-rotate"></i> 更新</button>
      </div>
    </div>

    <!-- テーブル -->
    <div class="pg-table-wrap">
      <table class="pg-table">
        <colgroup>
          <col :style="{ width: pgColWidths['status'] + 'px' }">
          <col :style="{ width: pgColWidths['code'] + 'px' }">
          <col>
          <col :style="{ width: pgColWidths['staffName'] + 'px' }">
          <col :style="{ width: pgColWidths['fiscalMonth'] + 'px' }">
          <col :style="{ width: pgColWidths['shareStatus'] + 'px' }">
          <col :style="{ width: pgColWidths['receivedDate'] + 'px' }">
          <col :style="{ width: pgColWidths['unsorted'] + 'px' }">
          <col :style="{ width: pgColWidths['unexported'] + 'px' }">
          <col :style="{ width: pgColWidths['jobStatus'] + 'px' }">
          <col v-for="m in monthColumns" :key="'col-'+m.key" style="width: 36px;">
          <col :style="{ width: pgColWidths['currentYear'] + 'px' }">
          <col :style="{ width: pgColWidths['lastYear'] + 'px' }">
        </colgroup>
        <thead>
          <tr>
            <th class="sortable pg-th-status relative" @click="sortBy('status')">状態 <i :class="getSortIcon('status')"></i>
              <div class="resize-handle" @mousedown.stop="onPgResizeStart('status', $event)"></div>
            </th>
            <th class="sortable pg-th-narrow relative" @click="sortBy('code')">3コード <i :class="getSortIcon('code')"></i>
              <div class="resize-handle" @mousedown.stop="onPgResizeStart('code', $event)"></div>
            </th>
            <th class="sortable" @click="sortBy('companyName')">会社名/代表者名 <i :class="getSortIcon('companyName')"></i></th>
            <th class="sortable pg-th-narrow relative" @click="sortBy('staffName')">担当 <i :class="getSortIcon('staffName')"></i>
              <div class="resize-handle" @mousedown.stop="onPgResizeStart('staffName', $event)"></div>
            </th>
            <th class="sortable pg-th-narrow relative" @click="sortBy('fiscalMonth')">決算月 <i :class="getSortIcon('fiscalMonth')"></i>
              <div class="resize-handle" @mousedown.stop="onPgResizeStart('fiscalMonth', $event)"></div>
            </th>
            <th class="pg-th-narrow relative">共有設定
              <div class="resize-handle" @mousedown.stop="onPgResizeStart('shareStatus', $event)"></div>
            </th>
            <th class="sortable pg-th-narrow relative" @click="sortBy('receivedDate')">資料受取日 <i :class="getSortIcon('receivedDate')"></i>
              <div class="resize-handle" @mousedown.stop="onPgResizeStart('receivedDate', $event)"></div>
            </th>
            <th class="sortable pg-th-narrow pg-th-num relative" @click="sortBy('unsorted')">未選別 <i :class="getSortIcon('unsorted')"></i>
              <div class="resize-handle-light" @mousedown.stop="onPgResizeStart('unsorted', $event)"></div>
            </th>
            <th class="sortable pg-th-narrow pg-th-num relative" @click="sortBy('unexported')">未出力 <i :class="getSortIcon('unexported')"></i>
              <div class="resize-handle-light" @mousedown.stop="onPgResizeStart('unexported', $event)"></div>
            </th>
            <th class="pg-th-narrow relative">移行ジョブ
              <div class="resize-handle-light" @mousedown.stop="onPgResizeStart('jobStatus', $event)"></div>
            </th>
            <th
              v-for="m in monthColumns" :key="'th-'+m.key"
              class="sortable pg-th-month"
              @click="sortBy('month_' + m.key)"
            >{{ m.label }} <i :class="getSortIcon('month_' + m.key)"></i></th>
            <th class="sortable pg-th-num relative" @click="sortBy('currentYearJournals')">今期<br>累計 <i :class="getSortIcon('currentYearJournals')"></i>
              <div class="resize-handle-light" @mousedown.stop="onPgResizeStart('currentYear', $event)"></div>
            </th>
            <th class="sortable pg-th-num" @click="sortBy('lastYearJournals')">前期<br>合計 <i :class="getSortIcon('lastYearJournals')"></i></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in pagedRows" :key="row.clientId" class="pg-row" :class="{ 'pg-row-inactive': row.status === 'inactive', 'pg-row-suspension': row.status === 'suspension' }" @click="goToJournalList(row)" style="cursor: pointer;">
            <td class="pg-td-status">
              <span class="pg-status-badge" :class="{
                'pg-status-active': row.status === 'active',
                'pg-status-suspension': row.status === 'suspension',
                'pg-status-inactive': row.status === 'inactive'
              }">{{ row.status === 'active' ? '稼働中' : row.status === 'suspension' ? '休眠中' : '契約終了' }}</span>
            </td>
            <td class="pg-td-code">{{ row.code }}</td>
            <td class="pg-td-client">{{ row.type === 'individual' && row.repName ? row.repName : row.companyName }}</td>
            <td class="pg-td-narrow">{{ getStaffNameForClient(row.clientId) || '' }}</td>
            <td class="pg-td-fiscal">{{ row.fiscalMonth }}月</td>
            <td class="pg-td-narrow pg-td-share">
              <span v-if="getStatusFromCache(row.clientId) === 'active'" class="pg-share-badge pg-share-active">共有OK</span>
              <span v-else-if="getStatusFromCache(row.clientId) === 'pending'" class="pg-share-badge pg-share-pending">未承認</span>
              <span v-else-if="getStatusFromCache(row.clientId) === 'revoked'" class="pg-share-badge pg-share-revoked">解除済</span>
              <span v-else class="pg-share-badge pg-share-none">—</span>
            </td>
            <td class="pg-td-narrow">{{ row.receivedDate || '—' }}</td>
            <td class="pg-td-num" :class="{ 'pg-unsorted-highlight': row.unsorted > 0 }">{{ row.unsorted > 0 ? row.unsorted + '件' : '—' }}</td>
            <td class="pg-td-num" :class="{ 'pg-unexported-highlight': row.unexported > 0 }">{{ row.unexported > 0 ? row.unexported + '件' : '—' }}</td>
            <td class="pg-td-narrow pg-td-job">
              <span v-if="getLatestJob(row.clientId)" class="pg-job-badge" :class="'pg-job-' + getLatestJob(row.clientId)!.status">
                {{ getLatestJob(row.clientId)!.status === 'processing' ? '処理中' : getLatestJob(row.clientId)!.status === 'completed' ? '完了' : getLatestJob(row.clientId)!.status === 'failed' ? '失敗' : '待機中' }}
                <span class="pg-job-count">{{ getLatestJob(row.clientId)!.done }}/{{ getLatestJob(row.clientId)!.total }}</span>
              </span>
              <span v-else class="pg-share-none">—</span>
            </td>
            <td
              v-for="m in monthColumns" :key="'td-'+m.key+'-'+row.id"
              class="pg-td-month"
              :class="{ 'pg-td-month-val': (row.monthlyJournals[m.key] || 0) > 0 }"
            >{{ (row.monthlyJournals[m.key] || 0) > 0 ? row.monthlyJournals[m.key] : '—' }}</td>
            <td class="pg-td-num pg-td-total">{{ row.currentYearJournals > 0 ? row.currentYearJournals.toLocaleString() : '—' }}</td>
            <td class="pg-td-num pg-td-total">{{ row.lastYearJournals > 0 ? row.lastYearJournals.toLocaleString() : '—' }}</td>
          </tr>
          <tr v-if="pagedRows.length === 0">
            <td :colspan="12 + monthColumns.length" class="pg-empty">該当する顧問先がありません</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProgress } from '@/features/progress-management/composables/useProgress';
import { useClients } from '@/features/client-management/composables/useClients';
import { useColumnResize } from '@/composables/useColumnResize';
import { useShareStatus } from '@/composables/useShareStatus';

const pgDefaultWidths: Record<string, number> = {
  status: 60, code: 60, fiscalMonth: 60,
  staffName: 78, shareStatus: 78, receivedDate: 78, unsorted: 60, unexported: 78,
  jobStatus: 78,
  currentYear: 70, lastYear: 70,
};
const { columnWidths: pgColWidths, onResizeStart: onPgResizeStart } = useColumnResize('progress', pgDefaultWidths);

const { loadAll: loadShareStatus, getStatusFromCache } = useShareStatus();
onMounted(() => { loadShareStatus(); });

const router = useRouter();

const { progressRows, monthColumns, staffList: allStaff } = useProgress();
const { getStaffNameForClient } = useClients();

// 進捗管理ページ表示時にuseDocumentsの最新データを取得
import { useDocuments } from '@/composables/useDocuments';
const { refresh: refreshDocs } = useDocuments();
onMounted(async () => { await refreshDocs(); });

// --- ジョブ一覧（DL-047: 進捗管理画面統合） ---
interface JobSummary {
  jobId: string;
  createdAt: string;
  total: number;
  done: number;
  failed: number;
  excluded: number;
  status: string; // 'processing' | 'completed' | 'failed' | 'queued'
}
const jobsByClient = ref<Record<string, JobSummary[]>>({});

/** 顧問先の直近ジョブを取得 */
function getLatestJob(clientId: string): JobSummary | null {
  const jobs = jobsByClient.value[clientId];
  if (!jobs || jobs.length === 0) return null;
  return jobs[0]!;
}

/** 全顧問先のジョブ一覧を取得 */
async function fetchAllJobs(): Promise<void> {
  const clients = progressRows.value;
  const results: Record<string, JobSummary[]> = {};
  // 並列取得（最大10件ずつ）
  const batchSize = 10;
  for (let i = 0; i < clients.length; i += batchSize) {
    const batch = clients.slice(i, i + batchSize);
    await Promise.all(batch.map(async (row) => {
      try {
        const res = await fetch(`/api/drive/migrate/jobs/${encodeURIComponent(row.clientId)}`);
        if (!res.ok) return;
        const data = await res.json() as { jobs: Array<{ jobId: string; createdAt: string; total: number; done: number; failed: number; excluded: number }> };
        results[row.clientId] = data.jobs.map(j => ({
          ...j,
          status: j.failed > 0 ? 'failed' : j.done >= j.total ? 'completed' : j.done > 0 ? 'processing' : 'queued',
        }));
      } catch {
        // 個別の取得失敗はスキップ
      }
    }));
  }
  jobsByClient.value = results;
}
onMounted(() => { fetchAllJobs(); });

// --- フィルター ---
const filterClient = ref('');
const filterStaff = ref('');
const onlyUnexported = ref(false);

// --- ソート ---
// ソート: デフォルトは多段ソート（ステータス→未出力降順→受取日昇順→3コード昇順）
const sortKey = ref<string | null>(null);
const sortOrder = ref<'asc' | 'desc'>('asc');

const sortBy = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = key === 'unsorted' || key === 'unexported' || key === 'currentYearJournals' || key === 'lastYearJournals' || key.startsWith('month_') ? 'desc' : 'asc';
  }
};

const getSortIcon = (key: string) => {
  if (sortKey.value !== key) return 'fa-solid fa-sort pg-sort-icon';
  return sortOrder.value === 'asc'
    ? 'fa-solid fa-sort-up pg-sort-icon active'
    : 'fa-solid fa-sort-down pg-sort-icon active';
};

// --- フィルタ+ソート+ページネーション → API呼び出し（T-31-1: progressListService.tsに移植済み） ---
const filteredRows = ref<import('@/features/progress-management/types').ProgressRow[]>([]);
const totalCount = ref(0);
const totalPages = ref(1);
const PAGE_SIZE = 20;
const currentPage = ref(1);
const displayPages = computed(() => {
  const pages: number[] = [];
  for (let i = 1; i <= totalPages.value; i++) pages.push(i);
  return pages;
});
const pageStartIndex = computed(() => totalCount.value === 0 ? 0 : (currentPage.value - 1) * PAGE_SIZE + 1);
const pageEndIndex = computed(() => Math.min(currentPage.value * PAGE_SIZE, totalCount.value));
const pagedRows = computed(() => filteredRows.value);

/** サーバーからフィルタ済み・ソート済み・ページ済みリストを取得 */
async function fetchProgressList() {
  try {
    const res = await fetch('/api/progress/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchQuery: filterClient.value.trim() || undefined,
        filterStaff: filterStaff.value || undefined,
        filterUnexported: onlyUnexported.value || undefined,
        sortKey: sortKey.value,
        sortOrder: sortOrder.value,
        page: currentPage.value,
        pageSize: PAGE_SIZE,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    filteredRows.value = data.rows;
    totalCount.value = data.totalCount;
    totalPages.value = data.totalPages;
  } catch (err) {
    console.error('[MockProgressDetailPage] 進捗一覧取得失敗:', err);
    filteredRows.value = [];
    totalCount.value = 0;
    totalPages.value = 1;
  }
}

// フィルタ・ソート・ページ変更時に自動再取得
import { watch } from 'vue';
watch(
  [filterClient, filterStaff, onlyUnexported, sortKey, sortOrder, currentPage],
  () => { fetchProgressList(); },
  { immediate: true }
);
// フィルタ変更時にページを1に戻す
watch([filterClient, filterStaff, onlyUnexported], () => { currentPage.value = 1; });



// --- メタ情報 ---
const tagCount = ref(3);
const buildDate = ref(new Date().toLocaleString('ja-JP'));

const refreshData = async () => {
  const { refresh } = await import('@/composables/useDocuments').then(m => ({ refresh: m.useDocuments().refresh }));
  await refresh();
  await fetchAllJobs();
  buildDate.value = new Date().toLocaleString('ja-JP');
};

// --- 行クリック: 仕訳一覧へ遷移 ---
function goToJournalList(row: { clientId: string }) {
  router.push(`/journal-list/${row.clientId}`);
}
</script>

<style scoped>
.pg-container { padding: 0; font-family: 'Noto Sans JP', sans-serif; font-size: 12px; color: #333; }

/* フィルター行 */
.pg-filter-bar { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; background: #f0f4f8; border-bottom: 1px solid #d0d7de; }
.pg-filters { display: flex; align-items: center; gap: 8px; }
.pg-search-wrap { position: relative; }
.pg-search-icon { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 11px; }
.pg-search-input { padding: 4px 8px 4px 26px; border: 1px solid #c8cdd3; border-radius: 4px; font-size: 11px; color: #333; background: white; min-width: 120px; outline: none; }
.pg-search-input:focus { border-color: #0969da; box-shadow: 0 0 0 2px rgba(9, 105, 218, 0.15); }
.pg-select { padding: 4px 8px; border: 1px solid #c8cdd3; border-radius: 4px; font-size: 11px; color: #333; background: white; min-width: 100px; }
.pg-check-label { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #555; cursor: pointer; white-space: nowrap; }
.pg-right-info { display: flex; align-items: center; gap: 16px; font-size: 11px; color: #666; }
.pg-tag-info { color: #0969da; cursor: pointer; }
.pg-build-info { color: #888; }

/* アクション行 */
.pg-action-bar { display: flex; align-items: center; justify-content: space-between; padding: 6px 16px; background: white; border-bottom: 1px solid #e1e4e8; }
.pg-pagination { display: flex; align-items: center; gap: 4px; }
.pg-page-arrow { cursor: pointer; padding: 2px 6px; font-size: 11px; color: #0969da; border: 1px solid #d0d7de; border-radius: 3px; background: white; }
.pg-page-arrow:hover { background: #f0f4f8; }
.pg-page-arrow.disabled { opacity: 0.3; pointer-events: none; }
.pg-page-num { cursor: pointer; padding: 2px 8px; font-size: 11px; color: #333; border: 1px solid #d0d7de; border-radius: 3px; background: white; }
.pg-page-num:hover { background: #f0f4f8; }
.pg-page-num.active { background: #0969da; color: white; border-color: #0969da; }
.pg-page-info { font-size: 11px; color: #666; margin-left: 8px; }
.pg-actions { display: flex; align-items: center; gap: 6px; }
.pg-btn { padding: 4px 12px; font-size: 11px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 4px; border: 1px solid #d0d7de; white-space: nowrap; }
.pg-btn-secondary { background: white; color: #333; }
.pg-btn-secondary:hover { background: #f0f4f8; }

/* テーブル */
.pg-table-wrap { overflow-x: auto; }
.pg-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.pg-table th { background: #4a9eed; color: white; padding: 6px 4px; text-align: center; font-size: 11px; font-weight: 600; white-space: nowrap; border-right: 1px solid rgba(255,255,255,0.3); user-select: none; line-height: 1.3; }
.pg-table th:last-child { border-right: none; }
.pg-table th.sortable { cursor: pointer; }
.pg-table th.sortable:hover { background: #3a8edd; }
.pg-th-status { width: 60px; text-align: center; }
.pg-th-narrow { white-space: nowrap; }
.pg-th-num { text-align: right; }
.pg-th-month { text-align: center; font-size: 9px; padding: 6px 1px; }
.pg-th-narrow { font-size: 11px; }
.pg-sort-icon { font-size: 7px; color: rgba(255,255,255,0.5); margin-left: 1px; }
.pg-sort-icon.active { color: white; }

.pg-table td { border-bottom: 1px solid #d0d7de; border-right: 1px solid #e8ecf0; padding: 5px 4px; font-size: 12px; color: #333; white-space: nowrap; }
.pg-table td:last-child { border-right: none; }
.pg-row { transition: background 0.1s; }
.pg-row:hover { background: #fef3c7; }
.pg-row:nth-child(even) { background: #fafbfc; }
.pg-row:nth-child(even):hover { background: #fef3c7; }
.pg-row-inactive { opacity: 0.5; }
.pg-row-suspension { opacity: 0.7; }

.pg-td-status { text-align: center; }
.pg-status-badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; white-space: nowrap; }
.pg-status-active { background: #dcfce7; color: #166534; }
.pg-status-suspension { background: #fef9c3; color: #854d0e; }
.pg-status-inactive { background: #fee2e2; color: #991b1b; }
.pg-td-code { font-weight: 700; letter-spacing: 0.5px; color: #1e293b; font-family: 'Menlo', monospace; font-size: 11px; text-align: center; }
.pg-td-fiscal { text-align: center; font-size: 12px; color: #555; }
.pg-td-client { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
.pg-td-narrow { font-size: 12px; color: #555; text-align: center; }
.pg-td-num { text-align: center; font-variant-numeric: tabular-nums; }
.pg-td-month { text-align: center; font-size: 9px; font-variant-numeric: tabular-nums; color: #b0b8c4; padding: 5px 2px; }
.pg-td-month-val { color: #1e293b; font-weight: 600; }
.pg-td-total { font-weight: 600; font-size: 12px; }

.pg-empty { text-align: center; color: #94a3b8; padding: 40px 12px !important; }

/* リサイズハンドル（青ヘッダー用: 白系） */
.resize-handle {
  position: absolute; top: 0; right: 0; width: 4px; height: 100%;
  cursor: col-resize; background: transparent; transition: background 0.15s; z-index: 2;
}
.resize-handle:hover { background: rgba(255,255,255,0.5); }
.resize-handle-light {
  position: absolute; top: 0; right: 0; width: 4px; height: 100%;
  cursor: col-resize; background: transparent; transition: background 0.15s; z-index: 2;
}
.resize-handle-light:hover { background: rgba(255,255,255,0.5); }

/* 共有設定バッジ */
.pg-td-share { text-align: center; }
.pg-share-badge {
  display: inline-block; padding: 1px 6px; border-radius: 3px;
  font-size: 10px; font-weight: 600; white-space: nowrap;
}
.pg-share-active  { background: #dcfce7; color: #166534; }
.pg-share-pending { background: #dbeafe; color: #1e40af; }
.pg-share-revoked { background: #f1f5f9; color: #94a3b8; }
.pg-share-none    { color: #cbd5e1; }

/* 資料未選別ハイライト（オレンジ背景） */
.pg-unsorted-highlight { background: #fff7ed; color: #c2410c; font-weight: 700; }

/* ジョブステータスバッジ */
.pg-td-job { text-align: center; }
.pg-job-badge { display: inline-flex; align-items: center; gap: 3px; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; white-space: nowrap; }
.pg-job-count { font-weight: 400; font-size: 9px; opacity: 0.8; }
.pg-job-processing { background: #dbeafe; color: #1e40af; }
.pg-job-completed { background: #dcfce7; color: #166534; }
.pg-job-failed { background: #fee2e2; color: #991b1b; }
.pg-job-queued { background: #f1f5f9; color: #64748b; }
/* 未出力ハイライト（赤背景） */
.pg-unexported-highlight { background: #fef2f2; color: #dc2626; font-weight: 700; }
</style>
