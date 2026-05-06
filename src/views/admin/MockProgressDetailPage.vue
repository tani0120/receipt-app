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
          <tr v-if="isLoading || pagedRows.length === 0">
            <td :colspan="12 + monthColumns.length" class="pg-empty">
              <template v-if="isLoading">
                <i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px;"></i>読み込み中…
              </template>
              <template v-else>該当する顧問先がありません</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue';
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
const isLoading = ref(true);

/** サーバーからフィルタ済み・ソート済み・ページ済みリストを取得 */
async function fetchProgressList() {
  isLoading.value = true;
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
  } finally {
    isLoading.value = false;
  }
}

// フィルタ・ソート・ページ変更時に自動再取得（バッチ化で二重発火防止）
import { watch, nextTick } from 'vue';
let fetchPending = false;
watch(
  [filterClient, filterStaff, onlyUnexported, sortKey, sortOrder, currentPage],
  () => {
    if (fetchPending) return;
    fetchPending = true;
    nextTick(() => {
      fetchPending = false;
      fetchProgressList();
    });
  },
  { immediate: true }
);
// フィルタ変更時にページを1に戻す
watch([filterClient, filterStaff, onlyUnexported], () => { currentPage.value = 1; });

// KeepAliveからの復帰時にデータを再取得
onActivated(() => { fetchProgressList(); fetchAllJobs(); });



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

<style>
@import '@/styles/progress-detail.css';
</style>
