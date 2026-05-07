<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans text-[10px] text-gray-700">
    <!-- アクションボタン -->
    <div class="bg-white px-3 py-1.5 flex items-center gap-3 border-b border-gray-300">
      <button
        class="px-4 py-1 bg-blue-600 text-white rounded text-[10px] font-semibold hover:bg-blue-700"
        @click="showDownloadModal = true"
      >
        CSV形式でダウンロード
      </button>
      <router-link
        :to="'/export-history/' + ($route.params.clientId ?? 'ABC-00001')"
        class="px-4 py-1 border border-gray-300 rounded text-[10px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 no-underline"
        >ダウンロード履歴</router-link
      >
    </div>

    <!-- 出力形式行 + ダウンロードファイル名 -->
    <div class="bg-white px-3 py-1.5 flex items-center gap-3 border-b border-gray-200">
      <span class="text-[13px] font-bold text-blue-700"
        >出力形式：マネーフォワード クラウド会計</span
      >
      <button
        class="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-semibold hover:bg-blue-700"
        @click="showNotImplemented"
      >
        変更
      </button>
      <div class="border-l border-gray-300 h-4 mx-1"></div>
      <span class="text-[10px] text-gray-600">ダウンロードファイル名</span>
      <input
        type="text"
        v-model="downloadFileName"
        placeholder=""
        class="border border-gray-300 px-1.5 py-0.5 rounded text-[10px] w-48"
      />
      <span
        class="relative inline-flex"
        @mouseenter="showFileNameHelp = true"
        @mouseleave="showFileNameHelp = false"
      >
        <span
          class="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-400 text-white text-[8px] font-bold cursor-pointer hover:bg-blue-600"
          >?</span
        >
        <div
          v-if="showFileNameHelp"
          class="absolute left-5 top-0 z-50 bg-gray-800 text-white text-[9px] px-2 py-1 rounded shadow-lg whitespace-nowrap"
        >
          空白の場合は会計ソフト名とダウンロード日で出力します。（例：マネーフォワード_20260101）同日に複数出力した場合はマネーフォワード_20260101_2,
          _3...と付与します。
        </div>
      </span>
    </div>

    <!-- セグメント + 合計金額中央 -->
    <div class="bg-white px-3 py-1.5 flex items-center border-b border-gray-200 text-[10px]">
      <div class="flex items-center gap-4 flex-wrap">
        <label class="flex items-center gap-1 cursor-pointer"
          ><input type="checkbox" v-model="showTargetOnly" class="w-2.5 h-2.5" />未出力を表示</label
        >
        <label class="flex items-center gap-1 cursor-pointer"
          ><input
            type="checkbox"
            v-model="showExcluded"
            class="w-2.5 h-2.5"
          />出力対象外を表示</label
        >
        <label class="flex items-center gap-1 cursor-pointer"
          ><input type="checkbox" v-model="showWarnings" class="w-2.5 h-2.5" />警告を表示</label
        >
        <div class="border-l border-gray-300 h-4 mx-1"></div>
        <select
          v-model="debitAccountFilter"
          class="border border-gray-300 px-1.5 py-0.5 rounded text-[10px]"
        >
          <option value="">借方勘定科目</option>
          <option v-for="name in accountNames" :key="'d-' + name" :value="name">{{ name }}</option>
        </select>
        <select
          v-model="creditAccountFilter"
          class="border border-gray-300 px-1.5 py-0.5 rounded text-[10px]"
        >
          <option value="">貸方勘定科目</option>
          <option v-for="name in accountNames" :key="'c-' + name" :value="name">{{ name }}</option>
        </select>
      </div>
      <div class="flex-1 text-center text-[12px] text-gray-700 font-semibold">
        合計金額：¥{{ totalAmount.toLocaleString() }}
      </div>
    </div>

    <!-- ページネーション -->
    <div class="bg-white px-3 py-1.5 flex items-center justify-between border-b border-gray-200">
      <div class="flex items-center gap-1">
        <button
          v-for="p in displayPages"
          :key="p"
          class="px-1.5 py-0.5 border border-gray-300 rounded text-[10px] transition-colors"
          :class="
            p === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          "
          @click="currentPage = p"
        >
          {{ p }}
        </button>
        <button
          class="px-1.5 py-0.5 border border-gray-300 rounded text-[10px] bg-white text-gray-700 hover:bg-gray-100"
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
        >
          ＞
        </button>
        <span class="ml-2 text-[10px] text-gray-500"
          >全{{ filteredJournalCount }}件（{{ filteredRows.length }}行）</span
        >
      </div>
      <div class="flex items-center gap-2">
        <button
          class="px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white text-gray-700 hover:bg-gray-100 flex items-center gap-1"
          @click="showRealtimeUpdateMsg"
        >
          <i class="fa-solid fa-arrows-rotate text-[8px]"></i> 更新
        </button>
      </div>
    </div>

    <!-- テーブル -->
    <div class="flex-1 overflow-auto">
      <table class="w-full border-collapse text-[10px]" style="table-layout: fixed">
        <thead>
          <tr class="bg-blue-100 text-gray-800 sticky top-0">
            <!-- ダウンロード対象列（ソート対応） -->
            <th
              class="p-1 border-r border-gray-300 text-center cursor-pointer hover:bg-blue-200 select-none relative"
              :style="{ width: exColWidths['checked'] + 'px' }"
              @click="handleSort('checked')"
            >
              <div>
                ダウンロード対象
                <span v-if="sortKey === 'checked'" class="text-[8px]">{{
                  sortDir === "asc" ? "▲" : "▼"
                }}</span>
              </div>
              <div class="mt-0.5">
                <input
                  type="checkbox"
                  class="w-2.5 h-2.5"
                  :checked="isAllPageChecked"
                  @change="toggleAll"
                />
              </div>
              <div class="resize-handle" @mousedown.stop="onExResizeStart('checked', $event)"></div>
            </th>
            <th class="p-1 border-r border-gray-300 text-center" style="width: 35px">No</th>
            <th
              v-for="col in sortableColumns"
              :key="col.key"
              class="p-1 border-r border-gray-300 cursor-pointer hover:bg-blue-200 select-none relative"
              :class="[col.align]"
              :style="{ width: exColWidths[col.key] + 'px' }"
              @click="handleSort(col.key)"
            >
              {{ col.label }}
              <span v-if="sortKey === col.key" class="text-[8px]">{{
                sortDir === "asc" ? "▲" : "▼"
              }}</span>
              <div class="resize-handle" @mousedown.stop="onExResizeStart(col.key, $event)"></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in pagedRows"
            :key="row.id"
            class="border-b border-gray-200 hover:bg-blue-50 transition-colors"
            :class="getRowClass(row, idx)"
          >
            <td class="p-1 text-center border-r border-gray-200">
              <input
                type="checkbox"
                class="w-2.5 h-2.5"
                :checked="checkedIds.has(row.id)"
                @change="toggleCheck(row.id)"
              />
            </td>
            <td class="p-1 text-center border-r border-gray-200">
              {{ idx + 1 + (currentPage - 1) * PAGE_SIZE }}
            </td>
            <td class="p-1 text-center border-r border-gray-200">{{ row.qualified }}</td>
            <td class="p-1 text-center border-r border-gray-200">{{ row.date }}</td>
            <td class="p-1 border-r border-gray-200 truncate max-w-[200px]">
              {{ row.description }}
            </td>
            <td class="p-1 text-center border-r border-gray-200">{{ row.debitAccount }}</td>
            <td class="p-1 text-center border-r border-gray-200">{{ row.debitSub }}</td>
            <td class="p-1 text-center border-r border-gray-200">{{ row.debitTax }}</td>
            <td class="p-1 text-right border-r border-gray-200">
              {{ row.debitAmount != null ? "¥" + row.debitAmount.toLocaleString() : "" }}
            </td>
            <td class="p-1 text-center border-r border-gray-200">{{ row.creditAccount }}</td>
            <td class="p-1 text-center border-r border-gray-200">{{ row.creditSub }}</td>
            <td class="p-1 text-center border-r border-gray-200">{{ row.creditTax }}</td>
            <td class="p-1 text-right border-r border-gray-200">
              {{ row.creditAmount != null ? "¥" + row.creditAmount.toLocaleString() : "" }}
            </td>
            <td class="p-1 text-center">{{ row.importDate }}</td>
          </tr>
          <tr v-if="pagedRows.length === 0">
            <td :colspan="sortableColumns.length + 2" class="p-6 text-center text-gray-400">
              出力対象のデータがありません
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ダウンロード確認モーダル -->
    <div
      v-if="showDownloadModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="cancelDownload"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 min-w-[340px] text-center">
        <template v-if="!isDownloading">
          <p class="text-[14px] font-semibold text-gray-800 mb-4">
            CSV形式でダウンロードしますか？
          </p>
          <div class="flex justify-center gap-4">
            <button
              class="px-6 py-2 bg-blue-600 text-white rounded text-[12px] font-semibold hover:bg-blue-700"
              @click="startDownload"
            >
              はい
            </button>
            <button
              class="px-6 py-2 border border-gray-300 rounded text-[12px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200"
              @click="cancelDownload"
            >
              いいえ
            </button>
          </div>
        </template>
        <template v-else>
          <div class="flex flex-col items-center gap-4">
            <div
              class="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"
            ></div>
            <p class="text-[14px] font-semibold text-gray-800">ダウンロード中です</p>
            <p class="text-[11px] text-gray-500">最大1〜2分かかる場合があります</p>
          </div>
        </template>
      </div>
    </div>
  </div>

  <NotifyModal
    :show="modal.notifyState.show"
    :title="modal.notifyState.title"
    :message="modal.notifyState.message"
    :variant="modal.notifyState.variant"
    @close="modal.onNotifyClose"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useJournals } from "@/composables/useJournals";
import { useAccountSettings } from "@/features/account-settings/composables/useAccountSettings";
import { useColumnResize } from "@/composables/useColumnResize";
import { useModalHelper } from '@/composables/useModalHelper';
import NotifyModal from '@/components/NotifyModal.vue';
import {
  validateForCsvExport,
  buildMfCsvContent,
  downloadMfCsv,
} from "@/utils/exportMfCsv";
import { syncWarningLabelsCore } from "@/utils/journalWarningSync";
import { toMfCsvDate } from "@/utils/mf-csv-date";
import { useCurrentUser } from "@/composables/useCurrentUser";

const route = useRoute();
const { currentStaffId } = useCurrentUser();
const clientId = computed(() => (route.params.clientId as string) ?? "LDI-00008");
const { journals } = useJournals(clientId);

// 列幅カスタマイズ
const exDefaultWidths: Record<string, number> = {
  checked: 90,
  qualified: 30,
  date: 70,
  description: 180,
  debitAccount: 100,
  debitSub: 80,
  debitTax: 80,
  debitAmount: 80,
  creditAccount: 100,
  creditSub: 80,
  creditTax: 80,
  creditAmount: 80,
  importDate: 70,
};
const { columnWidths: exColWidths, onResizeStart: onExResizeStart } = useColumnResize(
  "export",
  exDefaultWidths,
);

const clientSettings = useAccountSettings("client", clientId.value);

// 出力ページ初期化時: 全仕訳の警告ラベルを同期（顧問先設定でバリデーション）
onMounted(() => {
  // 顧問先設定の科目・税区分でバリデーション（顧問先設定外→ACCOUNT_UNKNOWN/TAX_UNKNOWN）
  const accounts = clientSettings.accounts.value;
  const taxCategories = clientSettings.taxCategories.value;
  journals.value.forEach((j) => syncWarningLabelsCore(j, accounts, taxCategories));
});

// --- 勘定科目名リスト（T-31-7: サーバーから取得） ---
const accountNames = ref<string[]>([]);

const debitAccountFilter = ref("");
const creditAccountFilter = ref("");

function resolveAccountName(id: string | null | undefined): string {
  if (!id) return "";
  // 顧問先設定を優先、見つからなければマスタ全体からフォールバック
  const account = clientSettings.accounts.value.find((a) => a.id === id);
  return account ? account.name : id;
}

function resolveTaxCategoryName(id: string | null | undefined): string {
  if (!id) return "";
  const entry = clientSettings.taxCategories.value.find((tc) => tc.id === id);
  return entry ? entry.name : id;
}

// --- ダウンロードファイル名 ---
const downloadFileName = ref("");
const showFileNameHelp = ref(false);

// --- 変更ボタン ---
const modal = useModalHelper();
const showNotImplemented = () => modal.notify({ title: '未実装です', variant: 'warning' });
const showRealtimeUpdateMsg = () => modal.notify({ title: '現在はリアルタイム更新です' });

// --- セグメント ---
const showTargetOnly = ref(true);
const showExcluded = ref(false);
const showWarnings = ref(false);

// --- ダウンロードモーダル ---
const showDownloadModal = ref(false);
const isDownloading = ref(false);
const startDownload = async () => {
  isDownloading.value = true;
  // composableから仕訳データを取得
  // checkedIdsは展開後のid（jrn-00000001-0）なので、元のjournal id（jrn-00000001）を抽出
  const sourceJournals = journals.value;
  const checkedJournalIds = new Set([...checkedIds.value].map((rid) => rid.replace(/-\d+$/, "")));
  const checkedJournals = sourceJournals.filter(
    (j) => j.deleted_at === null && checkedJournalIds.has(j.id),
  );
  if (checkedJournals.length === 0) {
    isDownloading.value = false;
    showDownloadModal.value = false;
    await modal.notify({ title: 'ダウンロード対象の仕訳がありません。', variant: 'warning' });
    return;
  }
  // バリデーション適用（警告付き仕訳を除外）
  const { valid, excluded } = validateForCsvExport(checkedJournals);
  if (valid.length === 0) {
    isDownloading.value = false;
    showDownloadModal.value = false;
    await modal.notify({ title: `出力可能な仕訳がありません`, message: `除外: ${excluded.length}件`, variant: 'warning' });
    return;
  }
  // スピナー表示後、少し待ってからダウンロード
  setTimeout(async () => {
    const csvContent = buildMfCsvContent(valid, resolveAccountName, resolveTaxCategoryName);
    const clientCode = clientId.value.split("-")[0] ?? clientId.value.slice(0, 3);
    const fname =
      downloadFileName.value ||
      `${clientCode}_マネーフォワード_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
    downloadMfCsv(csvContent, `${fname}.csv`);
    // 出力した仕訳のstatusをexportedに変更（二重出力防止）
    // JSTオフセット付きISO 8601
    const now = new Date();
    const jstOffset = 9 * 60; // JST = UTC+9
    const local = new Date(now.getTime() + jstOffset * 60000);
    const exportedAt = local.toISOString().replace('Z', '+09:00');
    // CSV行数をカウント（ヘッダー行を除く）
    const csvLineCount = csvContent.split('\n').filter(line => line.trim().length > 0).length - 1;
    // ダウンロード履歴をサーバーに保存（サーバーがhistoryIdを発番）
    const historyId = await saveDownloadHistory(`${fname}.csv`, valid.length, csvLineCount);
    for (const v of valid) {
      const target = journals.value.find((j) => j.id === v.id);
      if (target) {
        target.status = "exported";
        target.exported_at = exportedAt;
        target.exported_by = currentStaffId.value ?? 'unknown';
        target.export_batch_id = historyId; // サーバーが発番したバッチIDを紐付け
      }
    }
    // CSVスナップショットをサーバーに保存（再ダウンロード用）
    fetch(`/api/export-history/${encodeURIComponent(clientId.value)}/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        historyId,
        fileName: fname,
        exportDate: toMfCsvDate(new Date().toISOString().slice(0, 10)),
        journalCount: valid.length,
        csvContent,
      }),
    }).catch(err => console.error('[ExportPage] CSVスナップショット保存エラー:', err));
    isDownloading.value = false;
    showDownloadModal.value = false;
  }, 500);
};

/** ダウンロード履歴をサーバーに保存（サーバーがIDを発番して返す） */
async function saveDownloadHistory(fileName: string, count: number, csvLineCount: number): Promise<string> {
  const today = new Date();
  try {
    const res = await fetch(`/api/export-history/${encodeURIComponent(clientId.value)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exportDate: toMfCsvDate(today.toISOString().slice(0, 10)),
        fileName,
        count,
        csvLineCount,
        staffId: currentStaffId.value ?? 'unknown',
        status: "出力済",
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { ok: boolean; id: string };
    return data.id;
  } catch (err) {
    console.error('[ExportPage] 履歴保存エラー:', err);
    // フォールバック: ローカル仮ID
    return `h_local_${crypto.randomUUID().slice(0, 8)}`;
  }
}
const cancelDownload = () => {
  showDownloadModal.value = false;
  isDownloading.value = false;
};

// --- テーブルカラム定義 ---
// 警告ラベルはexportMfCsv.tsのEXCLUDE_LABELSで一元管理

interface Column {
  key: string;
  label: string;
  width: string;
  align: string;
}

const sortableColumns: Column[] = [
  { key: "qualified", label: "適格", width: "w-[30px]", align: "text-center" },
  { key: "date", label: "日付", width: "w-[70px]", align: "text-center" },
  { key: "description", label: "摘要", width: "min-w-[180px]", align: "text-left" },
  { key: "debitAccount", label: "借方勘定科目", width: "w-[100px]", align: "text-center" },
  { key: "debitSub", label: "借方補助科目", width: "w-[80px]", align: "text-center" },
  { key: "debitTax", label: "借方税区分", width: "w-[80px]", align: "text-center" },
  { key: "debitAmount", label: "借方金額", width: "w-[80px]", align: "text-right" },
  { key: "creditAccount", label: "貸方勘定科目", width: "w-[100px]", align: "text-center" },
  { key: "creditSub", label: "貸方補助科目", width: "w-[80px]", align: "text-center" },
  { key: "creditTax", label: "貸方税区分", width: "w-[80px]", align: "text-center" },
  { key: "creditAmount", label: "貸方金額", width: "w-[80px]", align: "text-right" },
  { key: "importDate", label: "取込日", width: "w-[70px]", align: "text-center" },
];

// --- ソート ---
const sortKey = ref<string | null>(null);
const sortDir = ref<"asc" | "desc">("asc");
const handleSort = (key: string) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortDir.value = "asc";
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
  isExported: boolean;
}

// 日付表示はtoMfCsvDate（YYYY/MM/DD）に統一

// T-31-7: 全データはAPI（POST /api/export/list）から取得
const PAGE_SIZE = 25;
const currentPage = ref(1);
const pagedRows = ref<ExportRow[]>([]);
const filteredJournalCount = ref(0);
const totalAmount = ref(0);
const totalPages = ref(1);
const totalCount = ref(0);
const displayPages = computed(() => {
  const pages: number[] = [];
  for (let i = 1; i <= Math.min(5, totalPages.value); i++) pages.push(i);
  return pages;
});
// filteredRows は pagedRows と同義（テンプレート互換用）
const filteredRows = computed(() => ({ length: totalCount.value }));

async function fetchExportList() {
  try {
    const res = await fetch('/api/export/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: clientId.value,
        showTargetOnly: showTargetOnly.value,
        showExcluded: showExcluded.value,
        showWarnings: showWarnings.value,
        debitAccountFilter: debitAccountFilter.value || undefined,
        creditAccountFilter: creditAccountFilter.value || undefined,
        sortKey: sortKey.value,
        sortDir: sortDir.value,
        page: currentPage.value,
        pageSize: PAGE_SIZE,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as {
      rows: ExportRow[];
      totalCount: number;
      totalPages: number;
      page: number;
      filteredJournalCount: number;
      totalAmount: number;
      accountNames: string[];
    };
    pagedRows.value = data.rows;
    totalCount.value = data.totalCount;
    totalPages.value = data.totalPages;
    filteredJournalCount.value = data.filteredJournalCount;
    totalAmount.value = data.totalAmount;
    accountNames.value = data.accountNames;
  } catch (err) {
    console.error('[ExportPage] 出力一覧取得エラー:', err);
  }
}

// フィルタ/ソート/ページ変更時に自動再取得
watch(
  [showTargetOnly, showExcluded, showWarnings, debitAccountFilter, creditAccountFilter, sortKey, sortDir, currentPage],
  () => { fetchExportList(); },
);
onMounted(() => { fetchExportList(); });

// --- 行背景色 ---
const getRowClass = (row: ExportRow, idx: number): string => {
  if (row.isExcluded) return "bg-gray-200 opacity-60";
  if (row.isWarning) return "bg-red-50 border-l-[3px] border-l-red-400";
  return idx % 2 === 0 ? "bg-white" : "bg-gray-50";
};

// --- チェック（ダウンロードする）管理 ---
// デフォルト: 全件ONだが、isExcludedとisWarningはOFF
const checkedIds = ref<Set<string>>(new Set());

const initChecks = () => {
  const ids = new Set<string>();
  pagedRows.value.forEach((r) => {
    if (!r.isExcluded && !r.isWarning) ids.add(r.id);
  });
  // 既存のチェック済みIDと統合（ページ切替時に消えないように）
  for (const existing of checkedIds.value) {
    ids.add(existing);
  }
  checkedIds.value = ids;
};

// API取得後にチェック初期化
watch(pagedRows, () => initChecks());

const toggleCheck = (id: string) => {
  const next = new Set(checkedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  checkedIds.value = next;
};

const isAllPageChecked = computed(
  () => pagedRows.value.length > 0 && pagedRows.value.every((r) => checkedIds.value.has(r.id)),
);

const toggleAll = () => {
  const next = new Set(checkedIds.value);
  if (isAllPageChecked.value) {
    pagedRows.value.forEach((r) => next.delete(r.id));
  } else {
    pagedRows.value.forEach((r) => next.add(r.id));
  }
  checkedIds.value = next;
};
</script>

<style scoped>
/* リサイズハンドル */
.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  transition: background 0.15s;
  z-index: 2;
}
.resize-handle:hover {
  background: #1976d2;
}
</style>
