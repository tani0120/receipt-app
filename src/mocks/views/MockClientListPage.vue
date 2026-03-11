<template>
  <div class="cl-container">
    <div class="cl-header">
      <h2 class="cl-title"><i class="fa-solid fa-bars-progress"></i> 進捗管理</h2>
      <div class="cl-summary">全{{ clients.length }}件</div>
    </div>

    <!-- フィルター -->
    <div class="cl-toolbar">
      <div class="cl-search">
        <i class="fa-solid fa-magnifying-glass cl-search-icon"></i>
        <input v-model="searchQuery" type="text" placeholder="会社名・コードで検索..." class="cl-search-input">
      </div>
      <div class="cl-filter-group">
        <label class="cl-filter-cb" v-for="opt in statusOptions" :key="opt.value">
          <input type="checkbox" v-model="statusFilters" :value="opt.value">
          <span :class="'status-label-' + opt.value">{{ opt.label }}</span>
        </label>
      </div>
    </div>

    <!-- テーブル -->
    <div class="cl-table-wrap">
      <table class="cl-table">
        <colgroup>
          <col style="width: 70px;">
          <col style="width: 60px;">
          <col style="width: 50px;">
          <col style="width: 20%;">
          <col style="width: 90px;">
          <col style="width: 80px;">
          <col style="width: 90px;">
          <col style="width: 110px;">
          <col style="width: 15%;">
          <col style="width: 100px;">
        </colgroup>
        <thead>
          <tr>
            <th class="sortable" @click="sortBy('status')">ステータス <i :class="getSortIcon('status')"></i></th>
            <th class="sortable" @click="sortBy('threeCode')">3コード <i :class="getSortIcon('threeCode')"></i></th>
            <th class="sortable" @click="sortBy('type')">種別 <i :class="getSortIcon('type')"></i></th>
            <th class="sortable" @click="sortBy('companyName')">会社名 <i :class="getSortIcon('companyName')"></i></th>
            <th class="sortable" @click="sortBy('staffName')">担当者 <i :class="getSortIcon('staffName')"></i></th>
            <th class="sortable" @click="sortBy('accountingSoftware')">会計ソフト <i :class="getSortIcon('accountingSoftware')"></i></th>
            <th class="sortable" @click="sortBy('fiscalMonth')">決算日 <i :class="getSortIcon('fiscalMonth')"></i></th>
            <th>電話番号</th>
            <th>メール</th>
            <th>主な連絡手段</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in pagedRows"
            :key="row.clientId"
            :class="{ 'row-inactive': row.status === 'inactive', 'row-suspension': row.status === 'suspension' }"
            class="cl-row"
            @click="goToSettings(row)"
          >
            <td>
              <span class="cl-status-badge" :class="'status-' + row.status">
                {{ row.status === 'active' ? '稼働中' : row.status === 'suspension' ? '休眠中' : '契約終了' }}
              </span>
            </td>
            <td class="cl-code">{{ row.threeCode }}</td>
            <td>{{ row.type === 'corp' ? '法人' : '個人' }}</td>
            <td class="cl-company-name">{{ row.companyName }}</td>
            <td>{{ row.staffName || '—' }}</td>
            <td>{{ softwareLabel(row.accountingSoftware) }}</td>
            <td class="cl-fiscal">{{ row.fiscalMonth }}月/{{ row.fiscalDay === '末日' ? '末日' : row.fiscalDay + '日' }}</td>
            <td>{{ row.phoneNumber || '—' }}</td>
            <td class="cl-ellipsis">{{ row.email || '—' }}</td>
            <td class="cl-contact-cell">
              <span v-if="row.chatRoomUrl">チャットワーク</span>
              <span v-else-if="row.email" class="cl-contact-fallback">
                メール
                <i class="fa-solid fa-triangle-exclamation cl-contact-warn" title="チャットワークURLが空白です。メールを表示しています。"></i>
              </span>
              <span v-else>—</span>
            </td>
          </tr>
          <tr v-if="pagedRows.length === 0">
            <td colspan="10" class="cl-empty">該当する顧問先がありません</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ページネーション -->
    <div class="cl-pagination" v-if="totalPages > 1">
      <span class="cl-page-arrow" :class="{ disabled: currentPage <= 1 }" @click="currentPage = Math.max(1, currentPage - 1)">＜</span>
      <span
        v-for="p in totalPages" :key="p"
        class="cl-page-num" :class="{ active: p === currentPage }"
        @click="currentPage = p"
      >{{ p }}</span>
      <span class="cl-page-arrow" :class="{ disabled: currentPage >= totalPages }" @click="currentPage = Math.min(totalPages, currentPage + 1)">＞</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useClients } from '@/features/client-management/composables/useClients';
import type { Client } from '@/features/client-management/composables/useClients';

const router = useRouter();
const { clients } = useClients();

// --- 検索 ---
const searchQuery = ref('');

// --- ステータスフィルタ ---
const statusFilters = ref<string[]>(['active', 'suspension']);
const statusOptions = [
  { value: 'active', label: '稼働中' },
  { value: 'suspension', label: '休眠中' },
  { value: 'inactive', label: '契約終了' },
];

// --- ソート ---
const sortKey = ref('companyName');
const sortOrder = ref<'asc' | 'desc'>('asc');

const sortBy = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

const getSortIcon = (key: string) => {
  if (sortKey.value !== key) return 'fa-solid fa-sort cl-sort-icon';
  return sortOrder.value === 'asc'
    ? 'fa-solid fa-sort-up cl-sort-icon active'
    : 'fa-solid fa-sort-down cl-sort-icon active';
};

// --- フィルタ + ソート ---
const filteredRows = computed(() => {
  let rows = clients.value.filter(c => statusFilters.value.includes(c.status));
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    rows = rows.filter(c =>
      c.companyName.toLowerCase().includes(q) ||
      c.threeCode.toLowerCase().includes(q)
    );
  }
  rows.sort((a, b) => {
    const aVal = (a as unknown as Record<string, string | number>)[sortKey.value] ?? '';
    const bVal = (b as unknown as Record<string, string | number>)[sortKey.value] ?? '';
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortOrder.value === 'asc' ? cmp : -cmp;
  });
  return rows;
});

// --- ページネーション ---
const PAGE_SIZE = 20;
const currentPage = ref(1);
const totalPages = computed(() => Math.ceil(filteredRows.value.length / PAGE_SIZE));
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredRows.value.slice(start, start + PAGE_SIZE);
});

// --- ヘルパー ---
const softwareLabel = (s: string) => {
  const map: Record<string, string> = { mf: 'MF', freee: 'freee', yayoi: '弥生', tkc: 'TKC', other: 'その他' };
  return map[s] || s;
};

// --- 行クリックで進捗詳細ページへ遷移 ---
const goToSettings = (row: Client) => {
  const code = row.threeCode.toLowerCase();
  router.push(`/progress/${code}`);
};
</script>

<style scoped>
.cl-container { padding: 24px 32px; max-width: 1400px; margin: 0 auto; font-family: 'Noto Sans JP', sans-serif; }
.cl-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.cl-title { font-size: 20px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 10px; }
.cl-title i { color: #3b82f6; }
.cl-summary { font-size: 13px; color: #64748b; }

/* ツールバー */
.cl-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.cl-search { position: relative; width: 280px; }
.cl-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 12px; }
.cl-search-input { width: 100%; padding: 7px 12px 7px 32px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; color: #334155; background: white; outline: none; transition: border-color 0.2s; }
.cl-search-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.cl-filter-group { display: flex; align-items: center; gap: 12px; }
.cl-filter-cb { display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; }
.status-label-active { color: #166534; font-weight: 600; }
.status-label-suspension { color: #92400e; font-weight: 600; }
.status-label-inactive { color: #991b1b; font-weight: 600; }

/* テーブル */
.cl-table-wrap { overflow-x: auto; border-radius: 8px; border: 1px solid #e2e8f0; }
.cl-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.cl-table th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; white-space: nowrap; user-select: none; }
.cl-table td { border-bottom: 1px solid #f1f5f9; padding: 9px 12px; font-size: 12px; color: #334155; }
.cl-table th.sortable { cursor: pointer; }
.cl-table th.sortable:hover { background: #e2e8f0; }
.cl-sort-icon { font-size: 10px; color: #94a3b8; margin-left: 4px; }
.cl-sort-icon.active { color: #3b82f6; }
.cl-row { cursor: pointer; transition: background 0.15s; }
.cl-row:hover { background: #eff6ff; }
.cl-row.row-inactive { opacity: 0.5; background: #f1f5f9; }
.cl-row.row-suspension { opacity: 0.6; background: #fefce8; }

/* セル */
.cl-code { font-weight: 700; letter-spacing: 1px; color: #1e293b; font-family: 'Menlo', monospace; }
.cl-company-name { font-weight: 600; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cl-fiscal { font-size: 11px; font-weight: 500; }
.cl-ellipsis { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ステータスバッジ */
.cl-status-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
.status-active { background: #dcfce7; color: #166534; }
.status-inactive { background: #fee2e2; color: #991b1b; }
.status-suspension { background: #fef3c7; color: #92400e; }

/* 連絡手段 */
.cl-contact-cell { font-size: 11px; }
.cl-contact-fallback { color: #64748b; }
.cl-contact-warn { color: #f59e0b; font-size: 10px; margin-left: 4px; cursor: help; }

/* ページネーション */
.cl-pagination { display: flex; justify-content: center; align-items: center; gap: 4px; margin-top: 16px; }
.cl-page-arrow { cursor: pointer; padding: 4px 8px; font-size: 12px; color: #475569; border-radius: 4px; }
.cl-page-arrow:hover { background: #e2e8f0; }
.cl-page-arrow.disabled { opacity: 0.3; pointer-events: none; }
.cl-page-num { cursor: pointer; padding: 4px 10px; font-size: 12px; color: #475569; border-radius: 4px; }
.cl-page-num:hover { background: #e2e8f0; }
.cl-page-num.active { background: #3b82f6; color: white; }
.cl-empty { text-align: center; color: #94a3b8; padding: 40px 12px !important; }
</style>
