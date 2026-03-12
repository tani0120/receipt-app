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
        <span class="pg-page-info">{{ pageStartIndex }}~{{ pageEndIndex }} / 全{{ filteredRows.length }}件</span>
      </div>
      <div class="pg-actions">
        <button class="pg-btn pg-btn-secondary" @click="refreshData"><i class="fa-solid fa-arrows-rotate"></i> 更新</button>
      </div>
    </div>

    <!-- テーブル -->
    <div class="pg-table-wrap">
      <table class="pg-table">
        <colgroup>
          <col style="width: 60px;">
          <col style="width: 60px;">
          <col style="width: 60px;">
          <col>
          <col style="width: 78px;">
          <col style="width: 78px;">
          <col style="width: 78px;">
          <col v-for="m in monthColumns" :key="'col-'+m.key" style="width: 36px;">
          <col style="width: 70px;">
          <col style="width: 70px;">
        </colgroup>
        <thead>
          <tr>
            <th class="sortable pg-th-status" @click="sortBy('status')">状態 <i :class="getSortIcon('status')"></i></th>
            <th class="sortable pg-th-narrow" @click="sortBy('code')">3コード <i :class="getSortIcon('code')"></i></th>
            <th class="sortable pg-th-narrow" @click="sortBy('fiscalMonth')">決算月 <i :class="getSortIcon('fiscalMonth')"></i></th>
            <th class="sortable" @click="sortBy('companyName')">顧問先 <i :class="getSortIcon('companyName')"></i></th>
            <th class="sortable pg-th-narrow" @click="sortBy('staffName')">担当 <i :class="getSortIcon('staffName')"></i></th>
            <th class="sortable pg-th-narrow" @click="sortBy('receivedDate')">資料受取日 <i :class="getSortIcon('receivedDate')"></i></th>
            <th class="sortable pg-th-narrow pg-th-num" @click="sortBy('unexported')">未出力 <i :class="getSortIcon('unexported')"></i></th>
            <th
              v-for="m in monthColumns" :key="'th-'+m.key"
              class="sortable pg-th-month"
              @click="sortBy('month_' + m.key)"
            >{{ m.label }} <i :class="getSortIcon('month_' + m.key)"></i></th>
            <th class="sortable pg-th-num" @click="sortBy('currentYearJournals')">今期<br>累計 <i :class="getSortIcon('currentYearJournals')"></i></th>
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
            <td class="pg-td-fiscal">{{ row.fiscalMonth }}月</td>
            <td class="pg-td-client">{{ row.companyName }}</td>
            <td class="pg-td-narrow">{{ row.staffName || '' }}</td>
            <td class="pg-td-narrow">{{ row.receivedDate || '—' }}</td>
            <td class="pg-td-num">{{ row.unexported > 0 ? row.unexported + '件' : '—' }}</td>
            <td
              v-for="m in monthColumns" :key="'td-'+m.key+'-'+row.id"
              class="pg-td-month"
              :class="{ 'pg-td-month-val': (row.monthlyJournals[m.key] || 0) > 0 }"
            >{{ (row.monthlyJournals[m.key] || 0) > 0 ? row.monthlyJournals[m.key] : '—' }}</td>
            <td class="pg-td-num pg-td-total">{{ row.currentYearJournals > 0 ? row.currentYearJournals.toLocaleString() : '—' }}</td>
            <td class="pg-td-num pg-td-total">{{ row.lastYearJournals > 0 ? row.lastYearJournals.toLocaleString() : '—' }}</td>
          </tr>
          <tr v-if="pagedRows.length === 0">
            <td :colspan="9 + monthColumns.length" class="pg-empty">該当する顧問先がありません</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useProgress } from '@/features/progress-management/composables/useProgress';

const router = useRouter();

const { progressRows, monthColumns, staffList: allStaff, getSortValue } = useProgress();

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
    sortOrder.value = key === 'unexported' || key === 'currentYearJournals' || key === 'lastYearJournals' || key.startsWith('month_') ? 'desc' : 'asc';
  }
};

const getSortIcon = (key: string) => {
  if (sortKey.value !== key) return 'fa-solid fa-sort pg-sort-icon';
  return sortOrder.value === 'asc'
    ? 'fa-solid fa-sort-up pg-sort-icon active'
    : 'fa-solid fa-sort-down pg-sort-icon active';
};

/** ステータス → ソート優先度（active=0, suspension=1, inactive=2） */
const statusOrder = (s: string): number => s === 'active' ? 0 : s === 'suspension' ? 1 : 2;

/** 決算月ソート値: 法人は月そのまま（1-12）、個人は13（法人12の後に来る） */
const fiscalMonthSort = (row: { type: string; fiscalMonth: number }, asc: boolean): number => {
  if (row.type === 'individual') return asc ? 13 : 13;
  return row.fiscalMonth;
};

/** デフォルト多段ソート比較関数 */
const defaultSort = (a: import('@/features/progress-management/types').ProgressRow, b: import('@/features/progress-management/types').ProgressRow): number => {
  // 1. ステータス: active→suspension→inactive
  const sa = statusOrder(a.status) - statusOrder(b.status);
  if (sa !== 0) return sa;
  // 2. 未出力: 降順（多い順）
  if (a.unexported !== b.unexported) return b.unexported - a.unexported;
  // 3. 資料受取日: 昇順（古い順、空白は最後）
  const aDate = a.receivedDate || '\uffff';
  const bDate = b.receivedDate || '\uffff';
  if (aDate !== bDate) return aDate < bDate ? -1 : 1;
  // 4. 3コード: 昇順
  return a.code < b.code ? -1 : a.code > b.code ? 1 : 0;
};

// --- フィルタ+ソート ---
const filteredRows = computed(() => {
  let rows = progressRows.value;
  if (filterClient.value.trim()) {
    const q = filterClient.value.trim().toLowerCase();
    rows = rows.filter(r =>
      r.companyName.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q)
    );
  }
  if (filterStaff.value) {
    rows = rows.filter(r => r.staffName === filterStaff.value);
  }
  if (onlyUnexported.value) {
    rows = rows.filter(r => r.unexported > 0);
  }
  // ソート
  if (sortKey.value === null) {
    // デフォルト多段ソート
    rows = [...rows].sort(defaultSort);
  } else if (sortKey.value === 'fiscalMonth') {
    // 決算月ソート: 法人1-12、個人13
    rows = [...rows].sort((a, b) => {
      const aVal = fiscalMonthSort(a, sortOrder.value === 'asc');
      const bVal = fiscalMonthSort(b, sortOrder.value === 'asc');
      const cmp = aVal - bVal;
      const primary = sortOrder.value === 'asc' ? cmp : -cmp;
      if (primary !== 0) return primary;
      return a.code < b.code ? -1 : a.code > b.code ? 1 : 0;
    });
  } else {
    // 通常ソート
    rows = [...rows].sort((a, b) => {
      const aVal = getSortValue(a, sortKey.value!);
      const bVal = getSortValue(b, sortKey.value!);
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      const primary = sortOrder.value === 'asc' ? cmp : -cmp;
      if (primary !== 0) return primary;
      return a.code < b.code ? -1 : a.code > b.code ? 1 : 0;
    });
  }
  return rows;
});

// --- ページネーション ---
const PAGE_SIZE = 20;
const currentPage = ref(1);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / PAGE_SIZE)));
const displayPages = computed(() => {
  const pages: number[] = [];
  for (let i = 1; i <= totalPages.value; i++) pages.push(i);
  return pages;
});
const pageStartIndex = computed(() => (currentPage.value - 1) * PAGE_SIZE + 1);
const pageEndIndex = computed(() => Math.min(currentPage.value * PAGE_SIZE, filteredRows.value.length));
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredRows.value.slice(start, start + PAGE_SIZE);
});



// --- メタ情報 ---
const tagCount = ref(3);
const buildDate = ref(new Date().toLocaleString('ja-JP'));

const refreshData = () => {
  buildDate.value = new Date().toLocaleString('ja-JP');
};

// --- 行クリック: 仕訳一覧へ遷移 ---
function goToJournalList(row: { clientId: string }) {
  router.push(`/client/journal-list/${row.clientId}`);
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
.pg-row:hover { background: #f0f7ff; }
.pg-row:nth-child(even) { background: #fafbfc; }
.pg-row:nth-child(even):hover { background: #f0f7ff; }
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
</style>
