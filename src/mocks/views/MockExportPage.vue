<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans text-[10px] text-gray-700">
    <!-- アクションボタン -->
    <div class="bg-white px-3 py-1.5 flex items-center gap-3 border-b border-gray-300">
      <button class="px-4 py-1 bg-blue-600 text-white rounded text-[10px] font-semibold hover:bg-blue-700" @click="showDownloadModal = true">CSV形式でダウンロード</button>
      <router-link :to="'/client/export-history/' + ($route.params.clientId ?? 'ABC-00001')" class="px-4 py-1 border border-gray-300 rounded text-[10px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 no-underline">ダウンロード履歴</router-link>
    </div>

    <!-- 出力形式行 + ダウンロードファイル名 -->
    <div class="bg-white px-3 py-1.5 flex items-center gap-3 border-b border-gray-200">
      <span class="text-[13px] font-bold text-blue-700">出力形式：マネーフォワード クラウド会計</span>
      <button class="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-semibold hover:bg-blue-700" @click="showNotImplemented">変更</button>
      <div class="border-l border-gray-300 h-4 mx-1"></div>
      <span class="text-[10px] text-gray-600">ダウンロードファイル名</span>
      <input type="text" v-model="downloadFileName" placeholder="" class="border border-gray-300 px-1.5 py-0.5 rounded text-[10px] w-48">
      <span class="relative inline-flex" @mouseenter="showFileNameHelp = true" @mouseleave="showFileNameHelp = false">
        <span class="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-400 text-white text-[8px] font-bold cursor-pointer hover:bg-blue-600">?</span>
        <div v-if="showFileNameHelp" class="absolute left-5 top-0 z-50 bg-gray-800 text-white text-[9px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
          空白の場合は会計ソフト名とダウンロード日で出力します。（例：マネーフォワード_20260101）同日に複数出力した場合はマネーフォワード_20260101_2, _3...と付与します。
        </div>
      </span>
    </div>

    <!-- セグメント + 合計金額中央 -->
    <div class="bg-white px-3 py-1.5 flex items-center border-b border-gray-200 text-[10px]">
      <div class="flex items-center gap-4 flex-wrap">
        <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" v-model="showUnexported" class="w-2.5 h-2.5">未出力を表示</label>
        <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" v-model="showExcluded" class="w-2.5 h-2.5">出力対象外を表示</label>
        <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" v-model="showWarnings" class="w-2.5 h-2.5">警告を表示</label>
        <div class="border-l border-gray-300 h-4 mx-1"></div>
        <select v-model="debitAccountFilter" class="border border-gray-300 px-1.5 py-0.5 rounded text-[10px]">
          <option value="">借方勘定科目</option>
          <option v-for="name in accountNames" :key="'d-' + name" :value="name">{{ name }}</option>
        </select>
        <select v-model="creditAccountFilter" class="border border-gray-300 px-1.5 py-0.5 rounded text-[10px]">
          <option value="">貸方勘定科目</option>
          <option v-for="name in accountNames" :key="'c-' + name" :value="name">{{ name }}</option>
        </select>
      </div>
      <div class="flex-1 text-center text-[12px] text-gray-700 font-semibold">合計金額：¥{{ totalAmount.toLocaleString() }}</div>
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
        <span class="ml-2 text-[10px] text-gray-500">{{ pageStart }}~{{ pageEnd }} / 全{{ filteredRows.length }}件</span>
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
            <!-- ダウンロード対象列（ソート対応） -->
            <th class="w-[90px] p-1 border-r border-gray-300 text-center cursor-pointer hover:bg-blue-200 select-none" @click="handleSort('checked')">
              <div>ダウンロード対象 <span v-if="sortKey === 'checked'" class="text-[8px]">{{ sortDir === 'asc' ? '▲' : '▼' }}</span></div>
              <div class="mt-0.5"><input type="checkbox" class="w-2.5 h-2.5" :checked="isAllPageChecked" @change="toggleAll"></div>
            </th>
            <th class="w-[35px] p-1 border-r border-gray-300 text-center">No</th>
            <th v-for="col in sortableColumns" :key="col.key"
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
            :class="getRowClass(row, idx)"
          >
            <td class="p-1 text-center border-r border-gray-200"><input type="checkbox" class="w-2.5 h-2.5" :checked="checkedIds.has(row.id)" @change="toggleCheck(row.id)"></td>
            <td class="p-1 text-center border-r border-gray-200">{{ idx + 1 + (currentPage - 1) * PAGE_SIZE }}</td>
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
            <td :colspan="sortableColumns.length + 2" class="p-6 text-center text-gray-400">出力対象のデータがありません</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ダウンロード確認モーダル -->
    <div v-if="showDownloadModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="cancelDownload">
      <div class="bg-white rounded-lg shadow-xl p-6 min-w-[340px] text-center">
        <template v-if="!isDownloading">
          <p class="text-[14px] font-semibold text-gray-800 mb-4">CSV形式でダウンロードしますか？</p>
          <div class="flex justify-center gap-4">
            <button class="px-6 py-2 bg-blue-600 text-white rounded text-[12px] font-semibold hover:bg-blue-700" @click="startDownload">はい</button>
            <button class="px-6 py-2 border border-gray-300 rounded text-[12px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200" @click="cancelDownload">いいえ</button>
          </div>
        </template>
        <template v-else>
          <div class="flex flex-col items-center gap-4">
            <div class="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p class="text-[14px] font-semibold text-gray-800">ダウンロード中です</p>
            <p class="text-[11px] text-gray-500">最大1〜2分かかる場合があります</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { mockJournalsPhase5 } from '../data/journal_test_fixture_30cases';
import { useAccountSettings } from '@/features/account-settings/composables/useAccountSettings';

const masterSettings = useAccountSettings('master');

// --- 勘定科目マスタから科目名リスト（deprecated除外） ---
const accountNames = computed(() => {
  const names = masterSettings.accounts.value
    .filter(a => !a.deprecated)
    .map(a => a.name);
  return [...new Set(names)];
});

const debitAccountFilter = ref('');
const creditAccountFilter = ref('');


// --- ダウンロードファイル名 ---
const downloadFileName = ref('');
const showFileNameHelp = ref(false);

// --- 変更ボタン ---
const showNotImplemented = () => globalThis.alert('未実装です');

// --- セグメント ---
const showUnexported = ref(true);
const showExcluded = ref(false);
const showWarnings = ref(false);

// --- ダウンロードモーダル ---
const showDownloadModal = ref(false);
const isDownloading = ref(false);
const startDownload = () => {
  isDownloading.value = true;
};
const cancelDownload = () => {
  showDownloadModal.value = false;
  isDownloading.value = false;
};

// --- テーブルカラム定義 ---
const WARNING_LABELS = ['NEED_DOCUMENT', 'NEED_INFO', 'NEED_CONSULT', 'AMOUNT_UNCLEAR', 'DATE_OUT_OF_RANGE'];

interface Column {
  key: string;
  label: string;
  width: string;
  align: string;
}

const sortableColumns: Column[] = [
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
interface ExportRow {
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
  isExcluded: boolean;
  isWarning: boolean;
}

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}/${mm}/${dd}`;
};

// 全行（ゴミ箱のみ除外）
const allRows = computed<ExportRow[]>(() => {
  return mockJournalsPhase5
    .filter(j => j.deleted_at === null)
    .map(j => {
      const debit = j.debit_entries[0];
      const credit = j.credit_entries[0];
      const isWarning = j.labels.some(l => WARNING_LABELS.includes(l));
      const isExcluded = j.labels.includes('EXPORT_EXCLUDE');
      return {
        id: j.id,
        qualified: j.invoice_status === 'qualified' ? '○' : '',
        date: formatDate(j.voucher_date ?? ''),
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
        isExcluded,
        isWarning,
      };
    });
});

// セグメントフィルタ
const filteredRows = computed<ExportRow[]>(() => {
  return allRows.value.filter(row => {
    if (row.isExcluded && !showExcluded.value) return false;
    if (row.isWarning && !showWarnings.value) return false;
    if (debitAccountFilter.value && row.debitAccount !== debitAccountFilter.value) return false;
    if (creditAccountFilter.value && row.creditAccount !== creditAccountFilter.value) return false;
    return true;
  });
});

// ソート（checkedソート対応）
const sortedRows = computed<ExportRow[]>(() => {
  const rows = [...filteredRows.value];
  if (!sortKey.value) return rows;

  const dir = sortDir.value === 'asc' ? 1 : -1;

  if (sortKey.value === 'checked') {
    // ✓ソート: checked→unchecked or unchecked→checked
    rows.sort((a, b) => {
      const ac = checkedIds.value.has(a.id) ? 1 : 0;
      const bc = checkedIds.value.has(b.id) ? 1 : 0;
      return (ac - bc) * dir;
    });
    return rows;
  }

  const key = sortKey.value as keyof ExportRow;
  rows.sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    if (typeof av === 'boolean' && typeof bv === 'boolean') return ((av ? 1 : 0) - (bv ? 1 : 0)) * dir;
    return String(av).localeCompare(String(bv)) * dir;
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

// --- 合計金額 ---
const totalAmount = computed(() =>
  filteredRows.value.reduce((sum, r) => sum + (r.debitAmount ?? 0), 0)
);

// --- 行背景色 ---
const getRowClass = (row: ExportRow, idx: number): string => {
  if (row.isExcluded) return 'bg-gray-200 opacity-60';
  if (row.isWarning) return 'bg-red-50 border-l-[3px] border-l-red-400';
  return idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';
};

// --- チェック（ダウンロードする）管理 ---
// デフォルト: 全件ONだが、isExcludedとisWarningはOFF
const checkedIds = ref<Set<string>>(new Set());

const initChecks = () => {
  const ids = new Set<string>();
  allRows.value.forEach(r => {
    if (!r.isExcluded && !r.isWarning) ids.add(r.id);
  });
  checkedIds.value = ids;
};

// 初期化
watch(allRows, () => initChecks(), { immediate: true });

const toggleCheck = (id: string) => {
  const next = new Set(checkedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  checkedIds.value = next;
};

const isAllPageChecked = computed(() =>
  pagedRows.value.length > 0 && pagedRows.value.every(r => checkedIds.value.has(r.id))
);

const toggleAll = () => {
  const next = new Set(checkedIds.value);
  if (isAllPageChecked.value) {
    pagedRows.value.forEach(r => next.delete(r.id));
  } else {
    pagedRows.value.forEach(r => next.add(r.id));
  }
  checkedIds.value = next;
};
</script>
