<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans text-[12px] text-gray-700">
    <!-- 戻るリンク -->
    <div class="bg-white px-4 py-2 flex items-center gap-4 border-b border-gray-300">
      <router-link :to="'/client/export/' + clientId" class="text-blue-600 text-[12px] hover:underline flex items-center gap-1">
        <i class="fa-solid fa-arrow-left text-[10px]"></i> 出力ページに戻る
      </router-link>
      <span class="text-[15px] font-bold text-blue-700">ダウンロード履歴</span>
    </div>

    <!-- ページネーション -->
    <div class="bg-white px-4 py-2 flex items-center justify-between border-b border-gray-200">
      <div class="flex items-center gap-1.5">
        <button
          class="px-2 py-1 border border-gray-300 rounded text-[12px] bg-white text-gray-700 hover:bg-gray-100"
          @click="currentPage = Math.max(1, currentPage - 1)"
        >＜</button>
        <button
          v-for="p in displayPages" :key="p"
          class="px-2.5 py-1 border border-gray-300 rounded text-[12px] transition-colors"
          :class="p === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-100'"
          @click="currentPage = p"
        >{{ p }}</button>
        <button
          class="px-2 py-1 border border-gray-300 rounded text-[12px] bg-white text-gray-700 hover:bg-gray-100"
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
        >＞</button>
        <span class="ml-3 text-[12px] text-gray-500">{{ pageStart }}~{{ pageEnd }} / 全{{ historyData.length }}件</span>
        <button v-if="checkedIds.size > 0" class="ml-3 px-3 py-1 bg-blue-600 text-white rounded text-[12px] font-semibold hover:bg-blue-700" @click="showDownloadModal = true">再ダウンロード</button>
      </div>
      <div class="flex items-center gap-2">
        <button class="px-3 py-1 border border-gray-300 rounded text-[12px] bg-white text-gray-700 hover:bg-gray-100 flex items-center gap-1" @click="showRealtimeUpdateMsg">
          <i class="fa-solid fa-arrows-rotate text-[10px]"></i> 更新
        </button>
      </div>
    </div>

    <!-- テーブル -->
    <div class="flex-1 overflow-auto">
      <table class="w-full border-collapse text-[12px]">
        <thead>
          <tr class="bg-blue-100 text-gray-800 sticky top-0">
            <th class="w-[40px] p-2 border-r border-gray-300 text-center"><input type="checkbox" class="w-3 h-3" :checked="isAllChecked" @change="toggleAll"></th>
            <th class="w-[120px] p-2 border-r border-gray-300 text-center">出力日</th>
            <th class="p-2 border-r border-gray-300 text-left">出力ファイル名</th>
            <th class="w-[100px] p-2 border-r border-gray-300 text-right">件数</th>
            <th class="w-[100px] p-2 text-center">ステータス</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in pagedRows" :key="row.id"
            class="border-b border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer"
            :class="selectedId === row.id ? 'bg-blue-100' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')"
            @click="navigateToDetail(row.id)"
          >
            <td class="p-2 text-center border-r border-gray-200"><input type="checkbox" class="w-3 h-3" :checked="checkedIds.has(row.id)" @change="toggleCheck(row.id)" @click.stop></td>
            <td class="p-2 text-center border-r border-gray-200">{{ row.exportDate }}</td>
            <td class="p-2 border-r border-gray-200">{{ row.fileName }}</td>
            <td class="p-2 text-right border-r border-gray-200">{{ row.count.toLocaleString() }}件</td>
            <td class="p-2 text-center">{{ row.status }}</td>
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
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toMfCsvDate } from '@/shared/utils/mf-csv-date';

const route = useRoute();
const router = useRouter();
const clientId = computed(() => (route.params.clientId as string) ?? 'ABC-00001');

// --- ダウンロード履歴（localStorageから読み込み） ---
interface HistoryRow {
  id: string;
  exportDate: string;
  fileName: string;
  count: number;
  status: string;
}

const historyData = computed<HistoryRow[]>(() => {
  const key = `sugu-suru:export-history:${clientId.value}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* 破損データは無視 */ }
  // フォールバック：サンプル履歴（日付はtoMfCsvDateで統一）
  return [
    { id: 'h01', exportDate: toMfCsvDate('2025-03-07'), fileName: 'マネーフォワード_20250307',   count: 259, status: '出力済' },
    { id: 'h02', exportDate: toMfCsvDate('2025-03-07'), fileName: 'マネーフォワード_20250307_2', count: 315, status: '出力済' },
    { id: 'h03', exportDate: toMfCsvDate('2025-03-07'), fileName: 'マネーフォワード_20250307_3', count: 506, status: '出力済' },
  ];
});

// --- ページネーション（20件単位） ---
const PAGE_SIZE = 20;
const currentPage = ref(1);
const totalPages = computed(() => Math.max(1, Math.ceil(historyData.value.length / PAGE_SIZE)));
const displayPages = computed(() => {
  const pages: number[] = [];
  for (let i = 1; i <= Math.min(5, totalPages.value); i++) pages.push(i);
  return pages;
});
const pageStart = computed(() => (currentPage.value - 1) * PAGE_SIZE + 1);
const pageEnd = computed(() => Math.min(currentPage.value * PAGE_SIZE, historyData.value.length));
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return historyData.value.slice(start, start + PAGE_SIZE);
});

// --- 行クリックで詳細ページへ遷移 ---
const selectedId = ref('h10');
const navigateToDetail = (id: string) => {
  selectedId.value = id;
  router.push(`/client/export-detail/${clientId.value}/${id}`);
};

// --- チェックボックス ---
const checkedIds = ref<Set<string>>(new Set());
const toggleCheck = (id: string) => {
  const next = new Set(checkedIds.value);
  if (next.has(id)) { next.delete(id); } else { next.add(id); }
  checkedIds.value = next;
};
const isAllChecked = computed(() =>
  pagedRows.value.length > 0 && pagedRows.value.every(r => checkedIds.value.has(r.id))
);
const toggleAll = () => {
  const next = new Set(checkedIds.value);
  if (isAllChecked.value) {
    pagedRows.value.forEach(r => next.delete(r.id));
  } else {
    pagedRows.value.forEach(r => next.add(r.id));
  }
  checkedIds.value = next;
};

// --- ダウンロードモーダル ---
const showDownloadModal = ref(false);
const isDownloading = ref(false);
const startDownload = () => {
  isDownloading.value = true;
  // 再ダウンロード: localStorageから保持済みCSVデータを取得してダウンロード
  setTimeout(() => {
    const checkedArr = [...checkedIds.value];
    let downloadCount = 0;
    for (const hid of checkedArr) {
      const csvKey = `sugu-suru:export-csv:${clientId.value}:${hid}`;
      try {
        const saved = localStorage.getItem(csvKey);
        if (saved) {
          const snapshot = JSON.parse(saved);
          const blob = new Blob(['\uFEFF' + snapshot.csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = snapshot.fileName + '.csv';
          a.click();
          URL.revokeObjectURL(url);
          downloadCount++;
        }
      } catch { /* 破損データは無視 */ }
    }
    isDownloading.value = false;
    showDownloadModal.value = false;
    if (downloadCount === 0) {
      globalThis.alert('保持済みのCSVデータが見つかりません。過去の出力データは保持されていない可能性があります。');
    }
  }, 800);
};
const cancelDownload = () => {
  showDownloadModal.value = false;
  isDownloading.value = false;
};

// --- 更新ボタン ---
const showRealtimeUpdateMsg = () => globalThis.alert('現在はリアルタイム更新です');
</script>
