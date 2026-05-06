<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <div class="flex-1 overflow-auto">
      <div class="vendor-master">
        <!-- ヘッダー -->
        <div class="vm-header">
          <span class="vm-header-label">全社取引先マスタ（事務所共通）</span>
          <span class="vm-header-count">{{ totalCount }}件</span>
          <button class="vm-add-btn" @click="addVendor">
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
            <label class="vm-filter-label">業種:</label>
            <select v-model="vectorFilter" class="vm-filter-select">
              <option value="">全て</option>
              <option v-for="v in uniqueVectors" :key="v" :value="v">{{ vectorLabel(v as VendorVector) }}</option>
            </select>
          </div>
          <div class="vm-filter-group">
            <label class="vm-filter-label">入出金:</label>
            <select v-model="directionFilter" class="vm-filter-select">
              <option value="">全て</option>
              <option value="expense">{{ directionLabel('expense') }}</option>
              <option value="income">{{ directionLabel('income') }}</option>
            </select>
          </div>
        </div>

        <!-- ツールバー -->
        <div class="vm-toolbar">
          <div class="vm-pagination">
            <span class="vm-page-arrow" :class="{ disabled: page <= 1 }" @click="page = Math.max(1, page - 1)">＜</span>
            <span
              v-for="p in totalPages" :key="p"
              class="vm-page-num" :class="{ active: page === p }"
              @click="page = p"
            >{{ p }}</span>
            <span class="vm-page-arrow" :class="{ disabled: page >= totalPages }" @click="page = Math.min(totalPages, page + 1)">＞</span>
            <span class="vm-page-range">{{ pageStart }}~{{ pageEnd }} / {{ totalCount }}件</span>
          </div>
        </div>

        <!-- テーブル -->
        <div class="vm-table-wrap">
          <table class="vm-table">
            <thead>
              <tr>
                <th class="vm-th" style="width:50px;">ID</th>
                <th class="vm-th sortable" style="min-width:170px;" @click="sortBy('company_name')">会社名 <i :class="getSortIcon('company_name')"></i></th>
                <th class="vm-th" style="min-width:130px;">照合キー</th>
                <th class="vm-th" style="min-width:110px;">表示名</th>
                <th class="vm-th sortable" style="min-width:150px;" @click="sortBy('vendor_vector')">業種 <i :class="getSortIcon('vendor_vector')"></i></th>
                <th class="vm-th sortable" style="width:70px;" @click="sortBy('direction')">入出金 <i :class="getSortIcon('direction')"></i></th>
                <th class="vm-th sortable" style="min-width:110px;" @click="sortBy('debit_account')">借方科目 <i :class="getSortIcon('debit_account')"></i></th>
                <th class="vm-th" style="min-width:110px;">借方科目（金額超）</th>
                <th class="vm-th" style="min-width:110px;">貸方科目</th>
                <th class="vm-th" style="min-width:170px;">T番号</th>
                <th class="vm-th" style="min-width:150px;">別名</th>
                <th class="vm-th" style="width:36px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in pagedRows" :key="row.vendor_id" class="vm-row">
                <!-- ID（読み取り専用） -->
                <td class="vm-td vm-td-id">{{ row.vendor_id.replace('gbl-', '') }}</td>

                <!-- 会社名（テキスト編集） -->
                <td class="vm-td">
                  <input v-model="row.company_name" class="vm-edit-text" />
                </td>

                <!-- 照合キー（自動計算・読み取り専用） -->
                <td class="vm-td vm-td-computed">{{ computeMatchKey(row.company_name) }}</td>

                <!-- 表示名（テキスト編集） -->
                <td class="vm-td">
                  <input :value="row.display_name ?? ''" class="vm-edit-text" placeholder="—" @input="row.display_name = ($event.target as HTMLInputElement).value || null" />
                </td>

                <!-- 業種（ドロップダウン） -->
                <td class="vm-td">
                  <select v-model="row.vendor_vector" class="vm-edit-select">
                    <option v-for="vv in allVectors" :key="vv" :value="vv">{{ vectorLabel(vv) }}</option>
                  </select>
                </td>

                <!-- 入出金（ドロップダウン） -->
                <td class="vm-td">
                  <select v-model="row.direction" class="vm-edit-select vm-edit-select-sm">
                    <option :value="null">—</option>
                    <option value="expense">{{ directionLabel('expense') }}</option>
                    <option value="income">{{ directionLabel('income') }}</option>
                  </select>
                </td>

                <!-- 借方科目（ドロップダウン） -->
                <td class="vm-td">
                  <select v-model="row.debit_account" class="vm-edit-select">
                    <option :value="null">—</option>
                    <option v-for="acc in accountOptions" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
                  </select>
                </td>

                <!-- 借方科目（金額超）（ドロップダウン） -->
                <td class="vm-td">
                  <select v-model="row.debit_account_over" class="vm-edit-select">
                    <option :value="null">—</option>
                    <option v-for="acc in accountOptions" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
                  </select>
                </td>

                <!-- 貸方科目（ドロップダウン） -->
                <td class="vm-td">
                  <select v-model="row.credit_account" class="vm-edit-select">
                    <option :value="null">—</option>
                    <option v-for="acc in accountOptions" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
                  </select>
                </td>

                <!-- T番号（T枠外 + 数字のみ編集） -->
                <td class="vm-td vm-td-tnumber">
                  <div v-for="(t, i) in row.t_numbers" :key="i" class="vm-tnumber-row">
                    <span class="vm-t-prefix">T</span>
                    <input
                      :value="t.replace(/^T/, '')"
                      class="vm-tnumber-input"
                      maxlength="13"
                      @input="updateTNumber(row, i, ($event.target as HTMLInputElement).value)"
                    />
                  </div>
                  <span v-if="!row.t_numbers.length" class="vm-empty">—</span>
                </td>

                <!-- 別名（カンマ区切りテキスト編集） -->
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
          <span class="vm-page-arrow" :class="{ disabled: page <= 1 }" @click="page = Math.max(1, page - 1)">＜</span>
          <span
            v-for="p in totalPages" :key="'b' + p"
            class="vm-page-num" :class="{ active: page === p }"
            @click="page = p"
          >{{ p }}</span>
          <span class="vm-page-arrow" :class="{ disabled: page >= totalPages }" @click="page = Math.min(totalPages, page + 1)">＞</span>
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
import { ref, computed, watch, nextTick, onMounted, onActivated } from 'vue';
import type { Vendor, VendorVector } from '@/types/pipeline/vendor.type';
import { VENDOR_VECTOR_LABELS, VENDOR_VECTORS } from '@/types/pipeline/vendor.type';
import { ACCOUNT_MASTER } from '@/data/master/account-master';
import { normalizeVendorName } from '@/utils/pipeline/vendorIdentification';

// ============================================================
// データ（API経由で取得。編集はローカルrefに対して行う）
// ============================================================
const vendors = ref<Vendor[]>([]);

onMounted(async () => {
  try {
    const res = await fetch('/api/vendors?type=vendor');
    if (res.ok) {
      const data = await res.json() as { vendors: Vendor[] };
      vendors.value = data.vendors;
    }
  } catch (e) {
    console.error('[VendorsPage] API取得失敗:', e);
  }
});

// ============================================================
// ラベル変換（全てimport元のデータから導出。ハードコードなし）
// ============================================================

/** 業種ID → 日本語ラベル（VENDOR_VECTOR_LABELS準拠） */
function vectorLabel(v: VendorVector): string {
  return VENDOR_VECTOR_LABELS[v] ?? v;
}

/**
 * 入出金区分 → 日本語ラベル
 * vendor.type.ts L338: "入出金区分（'expense' | 'income' | null）"
 * vendor.type.ts L330: "UI表示: ... | 入出金 | ..."
 */
const DIRECTION_LABELS: Record<string, string> = {
  expense: '出金',
  income: '入金',
};
function directionLabel(d: string | null): string {
  if (!d) return '—';
  return DIRECTION_LABELS[d] ?? d;
}



/** 科目ドロップダウン選択肢（ACCOUNT_MASTER準拠） */
const accountOptions = computed(() =>
  ACCOUNT_MASTER.map(a => ({ id: a.id, name: a.name }))
);

/** 業種ドロップダウン選択肢（VENDOR_VECTORS準拠） */
const allVectors = VENDOR_VECTORS;

// ============================================================
// 照合キー自動計算（normalizeVendorName準拠）
// ============================================================
function computeMatchKey(companyName: string): string {
  return normalizeVendorName(companyName) ?? '';
}

// ============================================================
// T番号・別名の更新
// ============================================================

/** T番号更新: 数字のみ保持し、Tプレフィックスを付与して格納 */
function updateTNumber(row: Vendor, index: number, digits: string) {
  const cleanDigits = digits.replace(/\D/g, '').slice(0, 13);
  row.t_numbers[index] = 'T' + cleanDigits;
}

/** 別名更新: カンマ区切りテキスト → 配列 */
function updateAliases(row: Vendor, text: string) {
  row.aliases = text.split(/[,、，]/).map(s => s.trim()).filter(s => s.length > 0);
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
      const idx = vendors.value.findIndex(v => v.vendor_id === deleteTarget.value!.vendor_id);
      if (idx !== -1) vendors.value.splice(idx, 1);
      refreshList();
    }
  } catch (e) {
    console.error('[VendorsPage] 削除失敗:', e);
  }
  deleteTarget.value = null;
}

// ============================================================
// 追加
// ============================================================

/** 新規取引先を先頭に追加。API POSTで永続化。 */
async function addVendor() {
  const newVendor: Omit<Vendor, 'vendor_id'> & { vendor_id?: string } = {
    company_name: '',
    match_key: '',
    display_name: null,
    aliases: [],
    t_numbers: [],
    phone_numbers: [],
    address: null,
    vendor_vector: 'unknown',
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
    scope: 'global',
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
    console.error('[VendorsPage] 追加失敗:', e);
  }
}

// ============================================================
// 検索・フィルタ・ソート・ページネーション
// ============================================================
const PAGE_SIZE = 50;
const page = ref(1);
const searchQuery = ref('');
const vectorFilter = ref('');
const directionFilter = ref('');

const sortKey = ref<keyof Vendor | ''>('');
const sortAsc = ref(true);

function sortBy(key: keyof Vendor) {
  if (sortKey.value === key) { sortAsc.value = !sortAsc.value; }
  else { sortKey.value = key; sortAsc.value = true; }
}

function getSortIcon(key: string) {
  if (sortKey.value !== key) return 'fa-solid fa-sort sort-icon inactive';
  return sortAsc.value ? 'fa-solid fa-sort-up sort-icon' : 'fa-solid fa-sort-down sort-icon';
}

/** 業種一覧（API応答から取得） */
const uniqueVectors = ref<string[]>([]);

const filteredRows = ref<Vendor[]>([]);
const totalCount = ref(0);

const totalPages = ref(1);
const pageStart = computed(() => (page.value - 1) * PAGE_SIZE + 1);
const pageEnd = computed(() => Math.min(page.value * PAGE_SIZE, totalCount.value));
const pagedRows = computed(() => filteredRows.value);
const isLoading = ref(false);

/** POST /api/vendors/list でサーバー側でフィルタ+ソート+ページネーション */
const fetchVendorList = async () => {
  isLoading.value = true;
  try {
    const res = await fetch('/api/vendors/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        search: searchQuery.value || undefined,
        vectorFilter: vectorFilter.value || undefined,
        directionFilter: directionFilter.value || undefined,
        sortKey: sortKey.value || undefined,
        sortOrder: sortAsc.value ? 'asc' : 'desc',
        page: page.value,
        pageSize: PAGE_SIZE,
        type: 'vendor',
      }),
    });
    const data = await res.json();
    filteredRows.value = data.rows;
    totalCount.value = data.totalCount;
    totalPages.value = data.totalPages;
    uniqueVectors.value = data.uniqueVectors ?? [];
  } catch (e) {
    console.error('[VendorsPage] リスト取得失敗:', e);
  } finally {
    isLoading.value = false;
  }
};

// フィルタ・ソート・ページ・検索変更時に自動でAPI再呼び出し（バッチ化で二重発火防止）
let fetchPending = false;
watch([searchQuery, vectorFilter, directionFilter, sortKey, sortAsc, page], () => {
  if (fetchPending) return;
  fetchPending = true;
  nextTick(() => {
    fetchPending = false;
    fetchVendorList();
  });
}, { immediate: true });


// KeepAliveからの復帰時にデータを再取得
onActivated(() => fetchVendorList());
/** データ変更後にリストを再取得 */
const refreshList = () => fetchVendorList();
</script>

<style>
@import '@/styles/master-vendors.css';
</style>
