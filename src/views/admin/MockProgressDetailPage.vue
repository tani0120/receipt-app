<template>
  <div class="pg-container">
    <!-- ページタイトル（青背景） -->
    <div class="cm-header">
      <h1 class="cm-title">進捗管理</h1>
    </div>

    <!-- ツールバー（共通コンポーネント） -->
    <TableFilterToolbar
      :columns="pgAllColumns"
      v-model:visible-columns="pgVisibleColumns"
      :total-count="totalCount"
      :views="pgViews"
      v-model:active-view-index="pgActiveViewIndex"
      :filter-columns="pgFilterColumns"
      :filter-conditions="pgFilterConditions"
      :filter-logic="pgFilterLogic"
      :filter-sort="pgFilterSortSetting"
      :default-conditions="pgCurrentViewDefaults.filters"
      :default-sort="pgCurrentViewDefaults.sort"
      @filter-apply="onPgFilterApply"
      @filter-remove="onPgFilterRemove"
      @view-change="onPgViewChange"
    >
    </TableFilterToolbar>

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
import TableFilterToolbar from '@/components/TableFilterToolbar.vue';
import type { FilterCondition, FilterColumnDef, SortSetting, FilterResult } from '@/components/list-view/types';
import type { ViewDefWithDefaults } from '@/utils/urlFilterSync';

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

// ============================================================
// TableFilterToolbar用 — ビュー/フィルタ/ソート定義
// ============================================================

/** 進捗管理の全列定義 */
const pgAllColumns = [
  { key: 'status', label: 'ステータス' },
  { key: 'threeCode', label: '3コード' },
  { key: 'companyName', label: '顧問先' },
  { key: 'staffName', label: '担当者' },
  { key: 'fiscalMonth', label: '決算月' },
  { key: 'shareStatus', label: '共有状態' },
  { key: 'receivedDate', label: '受取日' },
  { key: 'unsorted', label: '未選別' },
  { key: 'unexported', label: '未出力' },
  { key: 'jobStatus', label: '取込' },
  { key: 'currentYearJournals', label: '当年' },
  { key: 'lastYearJournals', label: '前年' },
];
const pgVisibleColumns = ref<string[]>(pgAllColumns.map(c => c.key));

/** 進捗管理のビュー定義 */
const pgViews: ViewDefWithDefaults[] = [
  {
    name: 'デフォルト',
    key: 'default',
    columns: null,
    defaultFilters: [
      { field: 'clientStatus', operator: 'in', value: ['active'] },
      { field: 'unsorted', operator: 'gte', value: '1' },
      { field: 'unexported', operator: 'gte', value: '1' },
    ],
    defaultSort: { key: 'threeCode', order: 'asc' },
  },
  {
    name: '（すべて）',
    key: 'all',
    columns: null,
    defaultFilters: [],
    defaultSort: { key: 'threeCode', order: 'asc' },
  },
];

const pgActiveViewIndex = ref(0);

/** フィルタ列定義（担当者はスタッフ一覧から動的生成） */
const pgFilterColumns = computed<FilterColumnDef[]>(() => [
  { key: 'clientStatus', label: 'ステータス', filterType: 'select', filterOptions: [
    { value: 'active', label: '稼働中' },
    { value: 'suspension', label: '休眠中' },
    { value: 'inactive', label: '契約終了' },
  ] },
  { key: 'threeCode', label: '3コード', filterType: 'text' },
  { key: 'companyName', label: '顧問先', filterType: 'text' },
  { key: 'staffId', label: '担当者', filterType: 'select', filterOptions:
    allStaff.value.map(s => ({ value: s.uuid, label: s.name }))
  },
  { key: 'fiscalMonth', label: '決算月', filterType: 'select', filterOptions:
    Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}月` }))
  },
  { key: 'unsorted', label: '未選別', filterType: 'number' },
  { key: 'unexported', label: '未出力', filterType: 'number' },
]);

/** フィルタ条件state */
const initialView = pgViews[0]!;
const pgFilterConditions = ref<FilterCondition[]>([...initialView.defaultFilters]);
const pgFilterLogic = ref<'and' | 'or'>('and');
const pgFilterSortSetting = ref<SortSetting>({ ...initialView.defaultSort });

/** 現在のビューのデフォルト値 */
const pgCurrentViewDefaults = computed(() => {
  const view = pgViews[pgActiveViewIndex.value] ?? pgViews[0]!;
  return { filters: view.defaultFilters, sort: view.defaultSort };
});

/** フィルタ適用 */
const onPgFilterApply = (result: FilterResult) => {
  pgFilterConditions.value = result.conditions;
  pgFilterLogic.value = result.logic;
  pgFilterSortSetting.value = result.sort;
  sortKey.value = result.sort.key;
  sortOrder.value = result.sort.order;
};

/** フィルタ条件個別削除 */
const onPgFilterRemove = (index: number) => {
  pgFilterConditions.value.splice(index, 1);
};

/** ビュー切替 */
const onPgViewChange = (idx: number) => {
  const view = pgViews[idx] ?? pgViews[0]!;
  pgFilterConditions.value = [...view.defaultFilters];
  pgFilterSortSetting.value = { ...view.defaultSort };
  sortKey.value = view.defaultSort.key;
  sortOrder.value = view.defaultSort.order;
};

// --- ソート ---
// ソート: デフォルトは多段ソート（ステータス→未出力降順→受取日昇順→3コード昇順）
const sortKey = ref<string | null>(initialView.defaultSort.key);
const sortOrder = ref<'asc' | 'desc'>(initialView.defaultSort.order);

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

// --- フィルタ+ソート+ページネーション → API呼び出し ---
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
        filters: pgFilterConditions.value,
        logic: pgFilterLogic.value,
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
  [pgFilterConditions, pgFilterLogic, sortKey, sortOrder, currentPage],
  () => {
    if (fetchPending) return;
    fetchPending = true;
    nextTick(() => {
      fetchPending = false;
      fetchProgressList();
    });
  },
  { immediate: true, deep: true }
);
// フィルタ変更時にページを1に戻す
watch([pgFilterConditions, pgFilterLogic], () => { currentPage.value = 1; }, { deep: true });

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
@import '@/styles/master-list.css';
@import '@/styles/progress-detail.css';
</style>
