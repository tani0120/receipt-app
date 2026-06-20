<template>
  <!-- 過去仕訳検索モーダル（Teleportでbody直下に移動） -->
  <Teleport to="body">
    <div
      v-if="visible"
      ref="pastJournalModalRef"
      :style="{
        top: pastJournalPos.top + 'px',
        left: pastJournalPos.left + 'px',
        zIndex: pastJournalZ,
      }"
      class="fixed bg-white rounded-lg shadow-2xl flex flex-col pointer-events-auto border-2 border-gray-300 overflow-auto w-[600px] h-[600px] cursor-move"
      style="resize: both; min-width: 300px; min-height: 200px"
      @click.stop
      @mousedown="modalDrag(startPastJournalDrag, $event)"
    >
      <!-- モーダルヘッダー（ドラッグハンドル） -->
      <div
        class="bg-blue-100 px-4 py-3 border-b flex justify-between items-center cursor-move select-none rounded-t-lg"
        @mousedown="startPastJournalDrag"
      >
        <h2 class="text-sm font-bold text-gray-900">
          {{ UI_MSG.過去仕訳検索 }} <span class="font-normal text-xs text-amber-600">{{ UI_MSG.移動可能 }}</span>
        </h2>
        <div class="flex items-center gap-2">
          <button
            @click="emit('toggle-pin')"
            class="text-gray-500 hover:text-gray-700"
            :title="pinned ? UI_MSG.ピン留め解除 : UI_MSG.ピン留め"
          >
            <i :class="pinned ? 'fa-solid fa-thumbtack text-blue-500' : 'fa-solid fa-thumbtack text-gray-400'" class="text-sm"></i>
          </button>
          <button @click="emit('close')" class="text-gray-500 hover:text-gray-700">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
      </div>

      <!-- 検索条件 -->
      <div class="p-4 border-b bg-gray-50">
        <div class="grid grid-cols-3 gap-4 mb-3">
          <!-- 摘要 -->
          <div>
            <label class="text-xs text-gray-700 block mb-1">{{ UI_MSG.摘要 }}</label>
            <input
              type="text"
              v-model="pastJournalSearch.vendor"
              :placeholder="UI_MSG.サンプル建物名"
              class="w-full px-2 py-1 text-xs border rounded"
            />
          </div>
        </div>

        <!-- 日付 -->
        <div class="mb-3">
          <label class="text-xs text-gray-700 block mb-1">{{ UI_MSG.日付 }}</label>
          <div class="flex items-center gap-2">
            <input
              type="date"
              v-model="pastJournalSearch.dateFrom"
              class="w-40 px-2 py-1 text-xs border rounded"
            />
            <span class="text-xs">〜</span>
            <input
              type="date"
              v-model="pastJournalSearch.dateTo"
              class="w-40 px-2 py-1 text-xs border rounded"
            />
          </div>
        </div>

        <!-- 金額条件 -->
        <div class="mb-3">
          <label class="text-xs text-gray-700 block mb-1">{{ UI_MSG.金額条件 }}</label>
          <div class="flex items-center gap-2">
            <select
              v-model="pastJournalSearch.amountCondition"
              class="w-40 px-2 py-1 text-xs border rounded"
            >
              <option value="">{{ PLACEHOLDER_SELECT }}</option>
              <option v-for="o in AMOUNT_CONDITION_OPTIONS" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
            <input
              type="number"
              v-model.number="pastJournalSearch.amount"
              :placeholder="UI_MSG.金額入力"
              class="w-32 px-2 py-1 text-xs border rounded"
            />
          </div>
        </div>

        <!-- 借方勘定科目、貸方勘定科目 -->
        <div class="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label class="text-xs text-gray-700 block mb-1">{{ UI_MSG.借方勘定科目 }}</label>
            <select
              v-model="pastJournalSearch.debitAccount"
              class="w-full px-2 py-1 text-xs border rounded"
            >
              <option value="">{{ PLACEHOLDER_SELECT }}</option>
              <option v-for="o in accountOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-700 block mb-1">{{ UI_MSG.貸方勘定科目 }}</label>
            <select
              v-model="pastJournalSearch.creditAccount"
              class="w-full px-2 py-1 text-xs border rounded"
            >
              <option value="">{{ PLACEHOLDER_SELECT }}</option>
              <option v-for="o in accountOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
        </div>

        <!-- 絞り込みボタン -->
        <div class="flex gap-2">
          <button
            @click="
              () => {
                /* TODO (2026-05): searchPastJournals。Supabase移行後に実装 */
              }
            "
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-xs"
          >
            {{ UI_MSG.絞り込み }}
          </button>
        </div>
      </div>

      <!-- タブ -->
      <div class="flex border-b">
        <button
          @click="pastJournalTab = 'streamed'"
          :class="[
            'px-4 py-2 text-xs font-medium',
            pastJournalTab === 'streamed'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800',
          ]"
        >
          {{ UI_MSG.システム上の過去仕訳 }}
        </button>
        <button
          @click="
            pastJournalTab = 'accounting';
            emit('fetch-confirmed');
          "
          :class="[
            'px-4 py-2 text-xs font-medium',
            pastJournalTab === 'accounting'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800',
          ]"
        >
          {{ UI_MSG.会計ソフト過去仕訳 }}
          <span
            v-if="confirmedJournals.length > 0"
            class="ml-1 px-1.5 py-0.5 text-[9px] bg-amber-100 text-amber-700 rounded-full font-bold"
            >{{ confirmedJournals.length }}</span
          >
        </button>
      </div>

      <!-- 検索結果テーブル -->
      <div class="flex-1 overflow-auto p-4">
        <!-- ローディング表示（会計タブ） -->
        <div
          v-if="pastJournalTab === 'accounting' && isConfirmedLoading"
          class="text-center py-8 text-gray-400 text-sm"
        >
          <i class="fa-solid fa-spinner fa-spin mr-2"></i>{{ UI_MSG.過去仕訳読込中 }}
        </div>
        <!-- 件数サマリー（会計タブ） -->
        <div
          v-if="
            pastJournalTab === 'accounting' && !isConfirmedLoading && confirmedJournals.length > 0
          "
          class="text-xs text-gray-500 mb-2"
        >
          {{ UI_MSG.取込済み過去仕訳 }}:
          <span class="font-bold text-gray-700">{{ confirmedJournals.length }}{{ UI_MSG.件表示接尾 }}</span>
          <span v-if="filteredPastJournals.length !== confirmedJournals.length" class="ml-2"
            >{{ UI_MSG.絞込結果接頭 }}
            <span class="font-bold text-blue-600">{{ filteredPastJournals.length }}{{ UI_MSG.件表示接尾 }}</span></span
          >
        </div>
        <div class="text-xs text-gray-600 mb-2" v-if="pastJournalTab !== 'accounting'">
          {{ UI_MSG.行の背景色 }}
          <button
            @click="toggleOutputFilter('unexported')"
            :class="[
              'inline-block px-4 py-0.5 ml-2 text-xs cursor-pointer rounded',
              outputFilter === 'unexported'
                ? 'bg-blue-200 border-2 border-blue-500 font-bold'
                : 'bg-blue-50 border border-blue-300',
            ]"
          >
            {{ UI_MSG.未出力 }}
          </button>
          <button
            @click="toggleOutputFilter('exported')"
            :class="[
              'inline-block px-4 py-0.5 ml-2 text-xs cursor-pointer rounded',
              outputFilter === 'exported'
                ? 'bg-gray-200 border-2 border-black font-bold'
                : 'bg-white border border-black',
            ]"
          >
            {{ UI_MSG.出力済み }}
          </button>
        </div>

        <table class="w-full text-[10px] border-collapse">
          <thead class="bg-gray-100 sticky top-0">
            <tr>
              <th class="border px-2 py-1 text-center">{{ UI_MSG.TH_日付 }}</th>
              <th class="border px-2 py-1 text-center">{{ UI_MSG.TH_摘要 }}</th>
              <th class="border px-2 py-1 text-center">{{ UI_MSG.TH_借方勘定科目 }}</th>
              <th class="border px-2 py-1 text-center">{{ UI_MSG.TH_借方補助科目 }}</th>
              <th class="border px-2 py-1 text-center">{{ UI_MSG.TH_借方税区分 }}</th>
              <th class="border px-2 py-1 text-center">{{ UI_MSG.TH_貸方勘定科目 }}</th>
              <th class="border px-2 py-1 text-center">{{ UI_MSG.TH_貸方補助科目 }}</th>
              <th class="border px-2 py-1 text-center">{{ UI_MSG.TH_貸方税区分 }}</th>
              <th class="border px-2 py-1 text-center">{{ UI_MSG.TH_証憑種別 }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(result, index) in paginatedPastJournals"
              :key="index"
              :class="result.status === 'exported' ? 'bg-white' : 'bg-blue-50'"
              class="hover:bg-blue-100 cursor-pointer"
            >
              <td class="border px-2 py-1 text-center">
                {{ result.voucher_date ? formatDate(result.voucher_date) : "-" }}
              </td>
              <td class="border px-2 py-1">{{ result.description }}</td>
              <td class="border px-2 py-1">
                {{ resolveAccountName(result.debit_entries[0]?.account) || "" }}
              </td>
              <td class="border px-2 py-1">{{ result.debit_entries[0]?.sub_account || "" }}</td>
              <td class="border px-2 py-1 text-center">
                {{ resolveTaxCategoryName(result.debit_entries[0]?.tax_category_id) }}
              </td>
              <td class="border px-2 py-1">
                {{ resolveAccountName(result.credit_entries[0]?.account) || "" }}
              </td>
              <td class="border px-2 py-1">{{ result.credit_entries[0]?.sub_account || "" }}</td>
              <td class="border px-2 py-1 text-center">
                {{ resolveTaxCategoryName(result.credit_entries[0]?.tax_category_id) }}
              </td>
              <td class="border px-2 py-1 text-center">
                <span v-if="result.labels.includes('TRANSPORT')">領</span>
                <span v-if="result.labels.includes('RECEIPT')">レ</span>
                <span v-if="result.labels.includes('INVOICE')">請</span>
              </td>
            </tr>
            <tr v-if="paginatedPastJournals.length === 0">
              <td colspan="9" class="border px-2 py-4 text-center text-gray-500">
                {{ UI_MSG.検索結果なし }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- ページネーション -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-1 mt-3">
          <button
            @click="goToPage(pastJournalPage - 1)"
            :disabled="pastJournalPage <= 1"
            class="px-2 py-1 text-xs border rounded"
            :class="
              pastJournalPage <= 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100 cursor-pointer'
            "
          >
            &lt;
          </button>
          <button
            v-for="page in totalPages"
            :key="page"
            @click="goToPage(page)"
            class="px-2 py-1 text-xs border rounded min-w-[28px]"
            :class="
              page === pastJournalPage
                ? 'bg-blue-500 text-white border-blue-500 font-bold'
                : 'text-gray-600 hover:bg-gray-100 cursor-pointer'
            "
          >
            {{ page }}
          </button>
          <button
            @click="goToPage(pastJournalPage + 1)"
            :disabled="pastJournalPage >= totalPages"
            class="px-2 py-1 text-xs border rounded"
            :class="
              pastJournalPage >= totalPages
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100 cursor-pointer'
            "
          >
            &gt;
          </button>
        </div>
      </div>
      <!-- リサイズグリップインジケーター -->
      <div
        class="sticky bottom-0 ml-auto w-5 h-5 pointer-events-none shrink-0"
        style="
          background: linear-gradient(
            135deg,
            transparent 50%,
            rgba(59, 130, 246, 0.5) 50%,
            rgba(59, 130, 246, 0.7) 100%
          );
          border-radius: 0 0 0.5rem 0;
        "
      ></div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useDraggable } from "@/composables/useDraggable";
import { modalDrag } from "@/utils/modalDrag";
import { UI_MSG } from "@/constants/uiMessages";
import { AMOUNT_CONDITION_OPTIONS, PLACEHOLDER_SELECT } from "@/constants/vendorOptions";
import { toMfCsvDate } from "@/utils/mf-csv-date";
import { NULL_DISPLAY_UNKNOWN } from "@/shared/field-nullable-spec";
import type { SelectOption } from "@/constants/clientOptions";
import type {
  JournalPhase5Mock,
  JournalLabelMock,
} from "@/types/journal_phase5_mock.type";
import type { ConfirmedJournal } from "@/types/confirmed_journal.type";

// ── props / emit ──
const props = defineProps<{
  visible: boolean;
  pinned: boolean;
  journals: JournalPhase5Mock[];
  confirmedJournals: ConfirmedJournal[];
  isConfirmedLoading: boolean;
  accountOptions: SelectOption[];
  resolveAccountName: (id: string | null | undefined) => string;
  resolveTaxCategoryName: (id: string | null | undefined) => string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "toggle-pin"): void;
  (e: "fetch-confirmed"): void;
}>();

// ── ドラッグ ──
const pastJournalModalRef = ref<HTMLElement | null>(null);
const {
  position: pastJournalPos,
  zIndex: pastJournalZ,
  startDrag: startPastJournalDrag,
} = useDraggable(pastJournalModalRef);

// ── モーダル内部状態 ──
const pastJournalTab = ref<"streamed" | "accounting">("streamed");
const pastJournalSearch = ref({
  vendor: "",
  dateFrom: "",
  dateTo: "",
  amountCondition: "",
  amount: null as number | null,
  debitAccount: "",
  creditAccount: "",
});

const outputFilter = ref<"all" | "unexported" | "exported">("all");
const pastJournalPage = ref<number>(1);
const PAST_JOURNAL_PAGE_SIZE = 50;

// NULL_DISPLAY_UNKNOWN は @/shared/field-nullable-spec からimport済み

// ── ユーティリティ ──
function formatDate(date: unknown): string {
  if (date == null || date === "") return NULL_DISPLAY_UNKNOWN;
  const result = toMfCsvDate(String(date));
  return result || NULL_DISPLAY_UNKNOWN;
}

// ── 共通フィルタ関数 ──
interface Filterable {
  description: string;
  voucher_date: string | null;
  debit_entries: { account: string | null; sub_account?: string | null; tax_category_id?: string | null; amount?: number | null }[];
  credit_entries: { account: string | null; sub_account?: string | null; tax_category_id?: string | null; amount?: number | null }[];
}

function applySearchFilters<T extends Filterable>(
  items: T[],
): T[] {
  let results = [...items];

  // 摘要フィルタ
  if (pastJournalSearch.value.vendor) {
    results = results.filter((j) => j.description.includes(pastJournalSearch.value.vendor));
  }

  // 日付範囲フィルタ
  if (pastJournalSearch.value.dateFrom) {
    results = results.filter(
      (j) => j.voucher_date !== null && j.voucher_date >= pastJournalSearch.value.dateFrom,
    );
  }
  if (pastJournalSearch.value.dateTo) {
    results = results.filter(
      (j) => j.voucher_date !== null && j.voucher_date <= pastJournalSearch.value.dateTo,
    );
  }

  // 金額フィルタ
  if (pastJournalSearch.value.amount !== null && pastJournalSearch.value.amountCondition) {
    results = results.filter((j) => {
      const debitTotal = j.debit_entries.reduce((sum, e) => sum + (e.amount ?? 0), 0);
      const creditTotal = j.credit_entries.reduce((sum, e) => sum + (e.amount ?? 0), 0);
      const amount = Math.max(debitTotal, creditTotal);

      switch (pastJournalSearch.value.amountCondition) {
        case "equal":
          return amount === pastJournalSearch.value.amount;
        case "greater":
          return amount >= (pastJournalSearch.value.amount || 0);
        case "less":
          return amount <= (pastJournalSearch.value.amount || 0);
        default:
          return true;
      }
    });
  }

  // 借方勘定科目IDフィルタ
  if (pastJournalSearch.value.debitAccount) {
    results = results.filter((j) =>
      j.debit_entries.some(
        (e) => e.account === pastJournalSearch.value.debitAccount,
      ),
    );
  }

  // 貸方勘定科目IDフィルタ
  if (pastJournalSearch.value.creditAccount) {
    results = results.filter((j) =>
      j.credit_entries.some(
        (e) => e.account === pastJournalSearch.value.creditAccount,
      ),
    );
  }

  return results;
}

// ── filteredPastJournals ──
const filteredPastJournals = computed(() => {
  // タブによる表示制御
  if (pastJournalTab.value === "accounting") {
    // 会計ソフトから取り込んだ過去仕訳（confirmed_journals API）
    const cjResults = applySearchFilters(props.confirmedJournals);
    // JournalPhase5Mock互換オブジェクトに変換して返す
    return cjResults.map((cj) => ({
      id: cj.journalId,
      voucher_date: cj.voucher_date,
      description: cj.description,
      debit_entries: cj.debit_entries.map((e) => ({
        account: e.account,
        sub_account: e.sub_account,
        tax_category_id: e.tax_category_id,
        amount: e.amount,
      })),
      credit_entries: cj.credit_entries.map((e) => ({
        account: e.account,
        sub_account: e.sub_account,
        tax_category_id: e.tax_category_id,
        amount: e.amount,
      })),
      status: "exported" as const,
      labels: [] as JournalLabelMock[],
      source: cj.source,
    }));
  }

  // スグスル仕訳タブ
  let results = applySearchFilters(props.journals);

  // 出力ステータスフィルタ
  if (outputFilter.value === "unexported") {
    results = results.filter((j) => j.status === null);
  } else if (outputFilter.value === "exported") {
    results = results.filter((j) => j.status === "exported");
  }

  return results;
});

const paginatedPastJournals = computed(() => {
  const start = (pastJournalPage.value - 1) * PAST_JOURNAL_PAGE_SIZE;
  return filteredPastJournals.value.slice(start, start + PAST_JOURNAL_PAGE_SIZE);
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredPastJournals.value.length / PAST_JOURNAL_PAGE_SIZE));
});

function toggleOutputFilter(filter: "unexported" | "exported") {
  if (outputFilter.value === filter) {
    outputFilter.value = "all";
  } else {
    outputFilter.value = filter;
  }
  pastJournalPage.value = 1;
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    pastJournalPage.value = page;
  }
}
</script>
