<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans text-[10px] text-gray-700">
    <!-- 戻るリンク -->
    <div class="bg-white px-3 py-1.5 flex items-center gap-3 border-b border-gray-300">
      <router-link :to="'/client/export-history/' + clientId" class="text-blue-600 text-[10px] hover:underline flex items-center gap-1">
        <i class="fa-solid fa-arrow-left text-[8px]"></i> ダウンロード履歴に戻る
      </router-link>
      <span class="text-[13px] font-bold text-blue-700">出力詳細：{{ historyFileName }}</span>
      <span class="text-[10px] text-gray-500 ml-2">（{{ allRows.length }}件）</span>
    </div>

    <!-- ページネーション -->
    <div class="bg-white px-3 py-1.5 flex items-center justify-between border-b border-gray-200">
      <div class="flex items-center gap-1">
        <button
          v-for="p in displayPages" :key="p"
          class="px-1.5 py-0.5 border border-gray-300 rounded text-[10px] transition-colors"
          :class="p === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-100'"
          @click="currentPage = p"
        >{{ p }}</button>
        <button
          class="px-1.5 py-0.5 border border-gray-300 rounded text-[10px] bg-white text-gray-700 hover:bg-gray-100"
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
        >＞</button>
        <span class="ml-2 text-[10px] text-gray-500">{{ pageStart }}~{{ pageEnd }} / 全{{ allRows.length }}件</span>
      </div>
      <div class="flex items-center gap-2">
        <button class="px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white text-gray-700 hover:bg-gray-100 flex items-center gap-1">
          <i class="fa-solid fa-arrows-rotate text-[8px]"></i> 更新
        </button>
      </div>
    </div>

    <!-- テーブル -->
    <div class="flex-1 overflow-auto">
      <table class="w-full border-collapse text-[10px]">
        <thead>
          <tr class="bg-blue-100 text-gray-800 sticky top-0">
            <th v-for="col in columns" :key="col.key"
                :class="[col.width, 'p-1 border-r border-gray-300 cursor-pointer hover:bg-blue-200 select-none', col.align]"
                @click="handleSort(col.key)">
              {{ col.label }}
              <span v-if="sortKey === col.key" class="text-[8px]">{{ sortDir === 'asc' ? '▲' : '▼' }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in pagedRows" :key="row.id"
            class="border-b border-gray-200 hover:bg-blue-50 transition-colors"
            :class="idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
          >
            <td class="p-1 text-center border-r border-gray-200">{{ row.qualified }}</td>
            <td class="p-1 text-center border-r border-gray-200">{{ row.date }}</td>
            <td class="p-1 border-r border-gray-200 truncate max-w-[200px]">{{ row.description }}</td>
            <td class="p-1 text-center border-r border-gray-200">{{ row.debitAccount }}</td>
            <td class="p-1 text-center border-r border-gray-200">{{ row.debitSub }}</td>
            <td class="p-1 text-center border-r border-gray-200">{{ row.debitTax }}</td>
            <td class="p-1 text-right border-r border-gray-200">{{ row.debitAmount != null ? '¥' + row.debitAmount.toLocaleString() : '' }}</td>
            <td class="p-1 text-center border-r border-gray-200">{{ row.creditAccount }}</td>
            <td class="p-1 text-center border-r border-gray-200">{{ row.creditSub }}</td>
            <td class="p-1 text-center border-r border-gray-200">{{ row.creditTax }}</td>
            <td class="p-1 text-right border-r border-gray-200">{{ row.creditAmount != null ? '¥' + row.creditAmount.toLocaleString() : '' }}</td>
            <td class="p-1 text-center">{{ row.importDate }}</td>
          </tr>
          <tr v-if="pagedRows.length === 0">
            <td :colspan="columns.length" class="p-6 text-center text-gray-400">データがありません</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { mockJournalsPhase5 } from '../data/journal_test_fixture_30cases';

const route = useRoute();
const clientId = computed(() => (route.params.clientId as string) ?? 'ABC-00001');
const historyId = computed(() => route.params.historyId as string);

// 履歴IDからファイル名を解決（モック）
const historyFileMap: Record<string, string> = {
  h01: 'マネーフォワード_20250307',
  h02: 'マネーフォワード_20250307_2',
  h03: 'マネーフォワード_20250307_3',
  h04: 'マネーフォワード_20240807',
  h05: 'マネーフォワード_20240731',
  h06: 'マネーフォワード_20240110',
  h07: 'マネーフォワード_20240110_2',
  h08: 'マネーフォワード_20240109',
  h09: 'マネーフォワード_20240109_2',
  h10: 'マネーフォワード_20230311',
  h11: 'マネーフォワード_20230311_2',
};
const historyFileName = computed(() => historyFileMap[historyId.value] ?? historyId.value);

// --- カラム定義（ダウンロード対象列・No列なし） ---
interface Column {
  key: string;
  label: string;
  width: string;
  align: string;
}

const columns: Column[] = [
  { key: 'qualified',     label: '適格',         width: 'w-[30px]',      align: 'text-center' },
  { key: 'date',          label: '日付',         width: 'w-[70px]',      align: 'text-center' },
  { key: 'description',   label: '摘要',         width: 'min-w-[180px]', align: 'text-left' },
  { key: 'debitAccount',  label: '借方勘定科目', width: 'w-[100px]',     align: 'text-center' },
  { key: 'debitSub',      label: '借方補助科目', width: 'w-[80px]',      align: 'text-center' },
  { key: 'debitTax',      label: '借方税区分',   width: 'w-[80px]',      align: 'text-center' },
  { key: 'debitAmount',   label: '借方金額',     width: 'w-[80px]',      align: 'text-right' },
  { key: 'creditAccount', label: '貸方勘定科目', width: 'w-[100px]',     align: 'text-center' },
  { key: 'creditSub',     label: '貸方補助科目', width: 'w-[80px]',      align: 'text-center' },
  { key: 'creditTax',     label: '貸方税区分',   width: 'w-[80px]',      align: 'text-center' },
  { key: 'creditAmount',  label: '貸方金額',     width: 'w-[80px]',      align: 'text-right' },
  { key: 'importDate',    label: '取込日',       width: 'w-[70px]',      align: 'text-center' },
];

// --- ソート ---
const sortKey = ref<string | null>(null);
const sortDir = ref<'asc' | 'desc'>('asc');
const handleSort = (key: string) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
};

// --- データ型 ---
interface DetailRow {
  id: string;
  qualified: string;
  date: string;
  description: string;
  debitAccount: string;
  debitSub: string;
  debitTax: string;
  debitAmount: number | null;
  creditAccount: string;
  creditSub: string;
  creditTax: string;
  creditAmount: number | null;
  importDate: string;
}

const formatDate = (iso: string): string => {
  const d = new Date(iso ?? '');
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}/${mm}/${dd}`;
};

// 全行（モック: 全仕訳をそのまま表示）
const allRows = computed<DetailRow[]>(() => {
  return mockJournalsPhase5
    .filter(j => j.deleted_at === null)
    .map(j => {
      const debit = j.debit_entries[0];
      const credit = j.credit_entries[0];
      return {
        id: j.id,
        qualified: j.invoice_status === 'qualified' ? '○' : '',
        date: formatDate(j.transaction_date ?? ''),
        description: j.description,
        debitAccount: debit?.account ?? '',
        debitSub: debit?.sub_account ?? '',
        debitTax: debit?.tax_category_id ?? '',
        debitAmount: debit?.amount ?? null,
        creditAccount: credit?.account ?? '',
        creditSub: credit?.sub_account ?? '',
        creditTax: credit?.tax_category_id ?? '',
        creditAmount: credit?.amount ?? null,
        importDate: '26/03/04',
      };
    });
});

// ソート
const sortedRows = computed<DetailRow[]>(() => {
  const rows = [...allRows.value];
  if (!sortKey.value) return rows;
  const key = sortKey.value;
  const dir = sortDir.value === 'asc' ? 1 : -1;
  rows.sort((a, b) => {
    const va = (a as unknown as Record<string, unknown>)[key];
    const vb = (b as unknown as Record<string, unknown>)[key];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
    return String(va).localeCompare(String(vb), 'ja') * dir;
  });
  return rows;
});

// --- ページネーション ---
const PAGE_SIZE = 25;
const currentPage = ref(1);
const totalPages = computed(() => Math.max(1, Math.ceil(sortedRows.value.length / PAGE_SIZE)));
const displayPages = computed(() => {
  const pages: number[] = [];
  for (let i = 1; i <= Math.min(5, totalPages.value); i++) pages.push(i);
  return pages;
});
const pageStart = computed(() => (currentPage.value - 1) * PAGE_SIZE + 1);
const pageEnd = computed(() => Math.min(currentPage.value * PAGE_SIZE, sortedRows.value.length));
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return sortedRows.value.slice(start, start + PAGE_SIZE);
});
</script>
