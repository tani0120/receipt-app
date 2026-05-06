<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <div class="flex-1 overflow-auto">
      <div class="vendor-master">
        <!-- ヘッダー -->
        <div class="vm-header">
          <span class="vm-header-label">取引先外マスタ（NonVendor）</span>
          <span class="vm-header-count">{{ totalCount }}件</span>
          <button class="vm-add-btn" @click="addEntry">
            <i class="fa-solid fa-plus"></i> 追加
          </button>
        </div>

        <!-- 検索・フィルタ -->
        <div class="vm-filters">
          <div class="vm-search-group">
            <i class="fa-solid fa-magnifying-glass vm-search-icon"></i>
            <input
              v-model="searchQuery"
              type="text"
              class="vm-search-input"
              placeholder="会社名・照合キー・別名で検索..."
            />
          </div>
          <div class="vm-filter-group">
            <label class="vm-filter-label">証票種類:</label>
            <select v-model="sourceFilter" class="vm-filter-select">
              <option value="">全て</option>
              <option value="bank">🏦 銀行明細</option>
              <option value="credit">💳 クレカ明細</option>
              <option value="all">📋 全共通</option>
            </select>
          </div>
          <div class="vm-filter-group">
            <label class="vm-filter-label">入出金:</label>
            <select v-model="directionFilter" class="vm-filter-select">
              <option value="">全て</option>
              <option value="expense">出金</option>
              <option value="income">入金</option>
            </select>
          </div>
          <div class="vm-filter-group">
            <label class="vm-filter-label">確定レベル:</label>
            <select v-model="levelFilter" class="vm-filter-select">
              <option value="">全て</option>
              <option value="A">A（自動確定）</option>
              <option value="insufficient">❓ 人間判断</option>
            </select>
          </div>
        </div>

        <!-- ツールバー -->
        <div class="vm-toolbar">
          <div class="vm-pagination">
            <span
              class="vm-page-arrow"
              :class="{ disabled: page <= 1 }"
              @click="page = Math.max(1, page - 1)"
              >＜</span
            >
            <span
              v-for="p in totalPages"
              :key="p"
              class="vm-page-num"
              :class="{ active: page === p }"
              @click="page = p"
              >{{ p }}</span
            >
            <span
              class="vm-page-arrow"
              :class="{ disabled: page >= totalPages }"
              @click="page = Math.min(totalPages, page + 1)"
              >＞</span
            >
            <span class="vm-page-range"
              >{{ pageStart }}~{{ pageEnd }} / {{ totalCount }}件</span
            >
          </div>
        </div>

        <!-- テーブル -->
        <div class="vm-table-wrap">
          <table class="vm-table">
            <thead>
              <tr>
                <th class="vm-th" style="width: 50px">ID</th>
                <th class="vm-th sortable" style="min-width: 170px" @click="sortBy('company_name')">
                  会社名 <i :class="getSortIcon('company_name')"></i>
                </th>
                <th class="vm-th" style="min-width: 100px">照合キー</th>
                <th
                  class="vm-th sortable"
                  style="min-width: 150px"
                  @click="sortBy('non_vendor_type')"
                >
                  種別 <i :class="getSortIcon('non_vendor_type')"></i>
                </th>
                <th
                  class="vm-th sortable"
                  style="min-width: 100px"
                  @click="sortBy('source_category')"
                >
                  証票種類 <i :class="getSortIcon('source_category')"></i>
                </th>
                <th class="vm-th sortable" style="width: 70px" @click="sortBy('direction')">
                  入出金 <i :class="getSortIcon('direction')"></i>
                </th>
                <th
                  class="vm-th sortable"
                  style="min-width: 110px"
                  @click="sortBy('debit_account')"
                >
                  借方科目 <i :class="getSortIcon('debit_account')"></i>
                </th>
                <th class="vm-th" style="min-width: 110px">貸方科目</th>
                <th class="vm-th" style="min-width: 110px">借方税区分</th>
                <th class="vm-th sortable" style="width: 90px" @click="sortBy('level')">
                  確定レベル <i :class="getSortIcon('level')"></i>
                </th>
                <th class="vm-th" style="min-width: 150px">別名</th>
                <th class="vm-th" style="width: 36px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in pagedRows" :key="row.vendor_id" class="vm-row">
                <!-- ID -->
                <td class="vm-td vm-td-id">{{ row.vendor_id }}</td>

                <!-- 会社名 -->
                <td class="vm-td">
                  <input v-model="row.company_name" class="vm-edit-text" />
                </td>

                <!-- 照合キー（自動計算） -->
                <td class="vm-td vm-td-computed">{{ computeMatchKey(row.company_name) }}</td>

                <!-- 種別（non_vendor_type） -->
                <td class="vm-td">
                  <select v-model="row.non_vendor_type" class="vm-edit-select">
                    <option :value="null">—</option>
                    <option v-for="nvt in allNonVendorTypes" :key="nvt" :value="nvt">
                      {{ nvt }}
                    </option>
                  </select>
                </td>

                <!-- 証票種類 -->
                <td class="vm-td">
                  <select v-model="row.source_category" class="vm-edit-select vm-edit-select-sm">
                    <option :value="null">—</option>
                    <option value="bank">🏦 銀行</option>
                    <option value="credit">💳 クレカ</option>
                    <option value="all">📋 全共通</option>
                  </select>
                </td>

                <!-- 入出金 -->
                <td class="vm-td">
                  <select v-model="row.direction" class="vm-edit-select vm-edit-select-sm">
                    <option :value="null">—</option>
                    <option value="expense">出金</option>
                    <option value="income">入金</option>
                  </select>
                </td>

                <!-- 借方科目 -->
                <td class="vm-td">
                  <select v-model="row.debit_account" class="vm-edit-select">
                    <option :value="null">—</option>
                    <option v-for="acc in accountOptions" :key="acc.id" :value="acc.id">
                      {{ acc.name }}
                    </option>
                  </select>
                </td>

                <!-- 貸方科目 -->
                <td class="vm-td">
                  <select v-model="row.credit_account" class="vm-edit-select">
                    <option :value="null">—</option>
                    <option v-for="acc in accountOptions" :key="acc.id" :value="acc.id">
                      {{ acc.name }}
                    </option>
                  </select>
                </td>

                <!-- 借方税区分 -->
                <td class="vm-td">
                  <select v-model="row.debit_tax_category" class="vm-edit-select">
                    <option :value="null">—</option>
                    <option v-for="tc in taxCategoryOptions" :key="tc.id" :value="tc.id">
                      {{ tc.name }}
                    </option>
                  </select>
                </td>

                <!-- 確定レベル -->
                <td class="vm-td">
                  <select v-model="row.level" class="vm-edit-select vm-edit-select-sm">
                    <option :value="null">—</option>
                    <option value="A">A（自動確定）</option>
                    <option value="insufficient">❓ 人間判断</option>
                  </select>
                </td>

                <!-- 別名 -->
                <td class="vm-td">
                  <input
                    :value="row.aliases.join(', ')"
                    class="vm-edit-text"
                    placeholder="—"
                    @change="updateAliases(row, ($event.target as HTMLInputElement).value)"
                  />
                </td>

                <!-- 削除 -->
                <td class="vm-td vm-td-delete">
                  <i class="fa-solid fa-trash-can vm-delete-icon" @click="confirmDelete(row)"></i>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 下部ページネーション -->
        <div class="vm-pagination bottom">
          <span
            class="vm-page-arrow"
            :class="{ disabled: page <= 1 }"
            @click="page = Math.max(1, page - 1)"
            >＜</span
          >
          <span
            v-for="p in totalPages"
            :key="'b' + p"
            class="vm-page-num"
            :class="{ active: page === p }"
            @click="page = p"
            >{{ p }}</span
          >
          <span
            class="vm-page-arrow"
            :class="{ disabled: page >= totalPages }"
            @click="page = Math.min(totalPages, page + 1)"
            >＞</span
          >
        </div>
      </div>
    </div>

    <!-- 削除確認モーダル -->
    <div v-if="deleteTarget" class="vm-modal-overlay" @click.self="deleteTarget = null">
      <div class="vm-modal">
        <div class="vm-modal-title">削除しますか？</div>
        <div class="vm-modal-body">
          「{{ deleteTarget.company_name }}」を削除します。この操作は取り消せません。
        </div>
        <div class="vm-modal-actions">
          <button class="vm-modal-btn vm-modal-btn-no" @click="deleteTarget = null">いいえ</button>
          <button class="vm-modal-btn vm-modal-btn-yes" @click="executeDelete">はい</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onActivated } from "vue";
import type { NonVendorType } from "@/types/pipeline/non_vendor.type";
import type { Vendor } from "@/types/pipeline/vendor.type";
import { ACCOUNT_MASTER } from "@/data/master/account-master";
import { TAX_CATEGORY_MASTER } from "@/data/master/tax-category-master";
import { normalizeVendorName } from "@/utils/pipeline/vendorIdentification";

// ============================================================
// データ（API経由で取得）
// ============================================================
const vendors = ref<Vendor[]>([]);

onMounted(async () => {
  try {
    const res = await fetch('/api/vendors?type=non-vendor');
    if (res.ok) {
      const data = await res.json() as { vendors: Vendor[] };
      vendors.value = data.vendors;
    }
  } catch (e) {
    console.error('[NonVendorPage] API取得失敗:', e);
  }
});

// ============================================================
// ラベル変換・選択肢
// ============================================================

/** 科目ドロップダウン選択肢（ACCOUNT_MASTER準拠） */
const accountOptions = computed(() => ACCOUNT_MASTER.map((a) => ({ id: a.id, name: a.name })));

/** 税区分ドロップダウン選択肢（TAX_CATEGORY_MASTER準拠） */
const taxCategoryOptions = computed(() =>
  TAX_CATEGORY_MASTER.map((t) => ({ id: t.id, name: t.name })),
);

/** NonVendorType一覧（データから動的取得） */
const allNonVendorTypes = computed(() => {
  const set = new Set(
    vendors.value.map((v) => v.non_vendor_type).filter((v): v is NonVendorType => v !== null),
  );
  return [...set].sort();
});

// ============================================================
// 照合キー自動計算
// ============================================================
function computeMatchKey(companyName: string): string {
  return normalizeVendorName(companyName) ?? "";
}

// ============================================================
// 別名更新
// ============================================================
function updateAliases(row: Vendor, text: string) {
  row.aliases = text
    .split(/[,、，]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ============================================================
// 削除
// ============================================================
const deleteTarget = ref<Vendor | null>(null);

function confirmDelete(row: Vendor) {
  deleteTarget.value = row;
}

async function executeDelete() {
  if (!deleteTarget.value) return;
  try {
    const res = await fetch(`/api/vendors/${deleteTarget.value.vendor_id}`, { method: 'DELETE' });
    if (res.ok) {
      const idx = vendors.value.findIndex((v) => v.vendor_id === deleteTarget.value!.vendor_id);
      if (idx !== -1) vendors.value.splice(idx, 1);
      refreshList();
    }
  } catch (e) {
    console.error('[NonVendorPage] 削除失敗:', e);
  }
  deleteTarget.value = null;
}

// ============================================================
// 追加
// ============================================================
async function addEntry() {
  const newVendor: Omit<Vendor, 'vendor_id'> & { vendor_id?: string } = {
    company_name: "",
    match_key: "",
    display_name: null,
    aliases: [],
    t_numbers: [],
    phone_numbers: [],
    address: null,
    vendor_vector: null,
    non_vendor_type: null,
    source_category: null,
    level: null,
    direction: null,
    amount_threshold: null,
    debit_account: null,
    debit_account_over: null,
    debit_sub_account: null,
    debit_tax_category: null,
    debit_department: null,
    credit_account: null,
    credit_sub_account: null,
    credit_tax_category: null,
    credit_department: null,
    scope: "global",
    client_id: null,
  };

  try {
    const res = await fetch('/api/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVendor),
    });
    if (res.ok) {
      const created = await res.json() as Vendor;
      vendors.value.unshift(created);
      page.value = 1;
      refreshList();
    }
  } catch (e) {
    console.error('[NonVendorPage] 追加失敗:', e);
  }
}

// ============================================================
// 検索・フィルタ・ソート・ページネーション
// ============================================================
const PAGE_SIZE = 50;
const page = ref(1);
const searchQuery = ref("");
const sourceFilter = ref("");
const directionFilter = ref("");
const levelFilter = ref("");

const sortKey = ref<keyof Vendor | "">("");
const sortAsc = ref(true);

function sortBy(key: keyof Vendor) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value;
  } else {
    sortKey.value = key;
    sortAsc.value = true;
  }
}

function getSortIcon(key: string) {
  if (sortKey.value !== key) return "fa-solid fa-sort sort-icon inactive";
  return sortAsc.value ? "fa-solid fa-sort-up sort-icon" : "fa-solid fa-sort-down sort-icon";
}

const filteredRows = ref<Vendor[]>([]);
const totalCount = ref(0);

const totalPages = ref(1);
const pageStart = computed(() => (page.value - 1) * PAGE_SIZE + 1);
const pageEnd = computed(() => Math.min(page.value * PAGE_SIZE, totalCount.value));
const pagedRows = computed(() => filteredRows.value);
const isLoading = ref(false);

/** POST /api/vendors/list でサーバー側でフィルタ+ソート+ページネーション */
const fetchList = async () => {
  isLoading.value = true;
  try {
    const res = await fetch('/api/vendors/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        search: searchQuery.value || undefined,
        sourceFilter: sourceFilter.value || undefined,
        directionFilter: directionFilter.value || undefined,
        levelFilter: levelFilter.value || undefined,
        sortKey: sortKey.value || undefined,
        sortOrder: sortAsc.value ? 'asc' : 'desc',
        page: page.value,
        pageSize: PAGE_SIZE,
        type: 'non_vendor',
      }),
    });
    const data = await res.json();
    filteredRows.value = data.rows;
    totalCount.value = data.totalCount;
    totalPages.value = data.totalPages;
  } catch (e) {
    console.error('[NonVendorPage] リスト取得失敗:', e);
  } finally {
    isLoading.value = false;
  }
};

// フィルタ・ソート・ページ変更時に自動でAPI再呼び出し（バッチ化で二重発火防止）
let fetchPending = false;
watch([searchQuery, sourceFilter, directionFilter, levelFilter, sortKey, sortAsc, page], () => {
  if (fetchPending) return;
  fetchPending = true;
  nextTick(() => {
    fetchPending = false;
    fetchList();
  });
}, { immediate: true });


// KeepAliveからの復帰時にデータを再取得
onActivated(() => fetchList());
/** データ変更後にリストを再取得 */
const refreshList = () => fetchList();
</script>

<style>
@import '@/styles/master-non-vendor.css';
</style>
