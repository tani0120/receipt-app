<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <div class="flex-1 overflow-auto">
      <div class="vendor-master">
        <!-- ヘッダー -->
        <div class="vm-header">
          <span class="vm-header-label">全社取引先マスタ（事務所共通）</span>
          <span class="vm-header-count">{{ filteredRows.length }}件</span>
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
              <option v-for="v in uniqueVectors" :key="v" :value="v">{{ vectorLabel(v) }}</option>
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
            <span class="vm-page-range">{{ pageStart }}~{{ pageEnd }} / {{ filteredRows.length }}件</span>
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
                <th class="vm-th" style="min-width:110px;">超過借方</th>
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

                <!-- 超過借方（ドロップダウン） -->
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
import { ref, computed, watch } from 'vue';
import { VENDORS_GLOBAL } from '@/mocks/data/pipeline/vendors_global';
import type { Vendor, VendorVector } from '@/mocks/types/pipeline/vendor.type';
import { VENDOR_VECTOR_LABELS, VENDOR_VECTORS } from '@/mocks/types/pipeline/vendor.type';
import { ACCOUNT_MASTER } from '@/shared/data/account-master';
import { normalizeVendorName } from '@/mocks/utils/pipeline/vendorIdentification';

// ============================================================
// データ（VENDORS_GLOBALのディープコピー。編集はこのコピーに対して行う）
// ============================================================
const vendors = ref<Vendor[]>(structuredClone(VENDORS_GLOBAL));

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

function executeDelete() {
  if (!deleteTarget.value) return;
  const idx = vendors.value.findIndex(v => v.vendor_id === deleteTarget.value!.vendor_id);
  if (idx !== -1) {
    vendors.value.splice(idx, 1);
  }
  deleteTarget.value = null;
}

// ============================================================
// 追加
// ============================================================

/** 新規取引先を先頭に追加。IDは既存最大値+1で自動採番 */
function addVendor() {
  // 既存IDから最大番号を取得
  const maxNum = vendors.value.reduce((max, v) => {
    const n = parseInt(v.vendor_id.replace('gbl-', ''), 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  const newId = `gbl-${String(maxNum + 1).padStart(4, '0')}`;

  const newVendor: Vendor = {
    vendor_id: newId,
    company_name: '',
    match_key: '',
    display_name: null,
    aliases: [],
    t_numbers: [],
    phone_numbers: [],
    address: null,
    vendor_vector: 'unknown',
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

  vendors.value.unshift(newVendor);
  // 1ページ目に移動して新規行を表示
  page.value = 1;
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

/** 業種一覧（データに存在するもののみ。ユニーク） */
const uniqueVectors = computed(() => {
  const set = new Set(vendors.value.map(v => v.vendor_vector));
  return [...set].sort() as VendorVector[];
});

const filteredRows = computed(() => {
  let rows = [...vendors.value];

  // 検索
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    rows = rows.filter(r =>
      r.company_name.toLowerCase().includes(q) ||
      (normalizeVendorName(r.company_name) ?? '').includes(q) ||
      r.aliases.some(a => a.toLowerCase().includes(q))
    );
  }

  // 業種フィルタ
  if (vectorFilter.value) {
    rows = rows.filter(r => r.vendor_vector === vectorFilter.value);
  }

  // 入出金フィルタ
  if (directionFilter.value) {
    rows = rows.filter(r => r.direction === directionFilter.value);
  }

  // ソート
  if (sortKey.value) {
    const key = sortKey.value;
    const asc = sortAsc.value;
    rows.sort((a, b) => {
      const va = String(a[key] ?? '');
      const vb = String(b[key] ?? '');
      return asc ? va.localeCompare(vb, 'ja') : vb.localeCompare(va, 'ja');
    });
  }

  return rows;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / PAGE_SIZE)));
const pageStart = computed(() => (page.value - 1) * PAGE_SIZE + 1);
const pageEnd = computed(() => Math.min(page.value * PAGE_SIZE, filteredRows.value.length));
const pagedRows = computed(() => filteredRows.value.slice(pageStart.value - 1, pageEnd.value));

watch(filteredRows, () => { if (page.value > totalPages.value) page.value = 1; });
</script>

<style scoped>
.vendor-master {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #333;
  background: #ffffff;
  padding: 0 16px;
  overflow: auto;
}

/* ヘッダー */
.vm-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  font-size: 12px;
}
.vm-header-label { color: #1976D2; font-weight: 600; font-size: 13px; }
.vm-header-count { color: #888; font-size: 11px; }

/* 追加ボタン */
.vm-add-btn {
  margin-left: auto;
  padding: 5px 14px;
  background: #1976D2;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
.vm-add-btn:hover { background: #1565C0; }

/* 検索・フィルタ */
.vm-filters {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
}
.vm-search-group {
  position: relative;
  flex: 1;
  min-width: 240px;
  max-width: 400px;
}
.vm-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 12px;
}
.vm-search-input {
  width: 100%;
  padding: 6px 10px 6px 30px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
}
.vm-search-input:focus { border-color: #1976D2; box-shadow: 0 0 0 2px rgba(25,118,210,0.15); }
.vm-filter-group { display: flex; align-items: center; gap: 4px; }
.vm-filter-label { font-size: 11px; color: #555; font-weight: 600; }
.vm-filter-select {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 11px;
  background: #fff;
  outline: none;
  cursor: pointer;
}
.vm-filter-select:focus { border-color: #1976D2; }

/* ツールバー */
.vm-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }

/* ページネーション */
.vm-pagination { display: flex; align-items: center; gap: 2px; font-size: 12px; flex-wrap: wrap; }
.vm-pagination.bottom { justify-content: center; padding: 8px 0 12px; }
.vm-page-arrow {
  padding: 4px 10px; cursor: pointer; color: #1976D2; font-weight: 600;
  border-radius: 3px; user-select: none;
}
.vm-page-arrow:hover { background: #e3f2fd; }
.vm-page-arrow.disabled { color: #ccc; pointer-events: none; }
.vm-page-num {
  padding: 4px 10px; cursor: pointer; border-radius: 3px; color: #555;
  min-width: 28px; text-align: center; user-select: none;
}
.vm-page-num:hover { background: #e3f2fd; }
.vm-page-num.active { background: #1976D2; color: white; font-weight: 600; }
.vm-page-range { margin-left: 10px; color: #888; font-size: 11px; }

/* テーブル */
.vm-table-wrap { overflow: auto; flex: 1; min-height: 0; }
.vm-table { width: max-content; min-width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #d0d7de; }
.vm-table thead { background: #e3f2fd; position: sticky; top: 0; z-index: 1; }
.vm-th {
  padding: 6px 6px; text-align: center; font-weight: 600;
  color: #555; font-size: 11px; white-space: nowrap; border: 1px solid #d0d7de;
}
.vm-th.sortable { cursor: pointer; user-select: none; }
.vm-th.sortable:hover { background: #d0e8fc; }
.sort-icon { font-size: 9px; margin-left: 2px; color: #1976D2; }
.sort-icon.inactive { color: #ccc; }

.vm-td { padding: 3px 4px; border: 1px solid #e0e0e0; color: #333; vertical-align: middle; }
.vm-row:hover { background: #f5f9ff; }

/* 読み取り専用セル */
.vm-td-id { text-align: center; color: #999; font-size: 10px; font-family: monospace; }
.vm-td-computed { font-family: monospace; font-size: 10px; color: #888; background: #fafafa; }

/* 編集用テキスト入力 */
.vm-edit-text {
  width: 100%;
  padding: 3px 4px;
  border: 1px solid transparent;
  border-radius: 2px;
  font-size: 11px;
  color: #333;
  background: transparent;
  outline: none;
  box-sizing: border-box;
}
.vm-edit-text:hover { border-color: #ccc; }
.vm-edit-text:focus { border-color: #1976D2; background: #fff; box-shadow: 0 0 0 1px rgba(25,118,210,0.2); }

/* 編集用ドロップダウン */
.vm-edit-select {
  width: 100%;
  padding: 2px 2px;
  border: 1px solid transparent;
  border-radius: 2px;
  font-size: 10px;
  color: #333;
  background: transparent;
  outline: none;
  cursor: pointer;
  box-sizing: border-box;
}
.vm-edit-select:hover { border-color: #ccc; }
.vm-edit-select:focus { border-color: #1976D2; background: #fff; }
.vm-edit-select-sm { font-size: 10px; }

/* T番号 */
.vm-td-tnumber { white-space: nowrap; }
.vm-tnumber-row { display: flex; align-items: center; gap: 0; margin: 1px 0; }
.vm-t-prefix {
  display: inline-block;
  font-family: monospace;
  font-size: 10px;
  font-weight: 700;
  color: #1976D2;
  padding: 2px 2px 2px 0;
  user-select: none;
}
.vm-tnumber-input {
  width: 110px;
  padding: 2px 3px;
  border: 1px solid transparent;
  border-radius: 2px;
  font-family: monospace;
  font-size: 10px;
  color: #555;
  background: transparent;
  outline: none;
  box-sizing: border-box;
}
.vm-tnumber-input:hover { border-color: #ccc; }
.vm-tnumber-input:focus { border-color: #1976D2; background: #fff; }

/* 削除 */
.vm-td-delete { text-align: center; }
.vm-delete-icon {
  color: #bbb;
  font-size: 12px;
  cursor: pointer;
  transition: color 0.15s;
}
.vm-delete-icon:hover { color: #c62828; }

.vm-empty { color: #ccc; font-size: 10px; }

/* ============================================================ */
/* 削除モーダル                                                 */
/* ============================================================ */
.vm-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.vm-modal {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  padding: 24px 28px;
  min-width: 340px;
  max-width: 440px;
}
.vm-modal-title {
  font-size: 15px;
  font-weight: 700;
  color: #c62828;
  margin-bottom: 12px;
}
.vm-modal-body {
  font-size: 13px;
  color: #555;
  margin-bottom: 20px;
  line-height: 1.5;
}
.vm-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.vm-modal-btn {
  padding: 7px 20px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.vm-modal-btn-no {
  background: #e0e0e0;
  color: #555;
}
.vm-modal-btn-no:hover { background: #ccc; }
.vm-modal-btn-yes {
  background: #c62828;
  color: #fff;
}
.vm-modal-btn-yes:hover { background: #b71c1c; }
</style>
