<template>
  <div class="account-settings">
    <!-- ヘッダー -->
    <div class="as-header">
      <span class="as-header-label">出力形式：マネーフォワード クラウド会計</span>
    </div>

    <!-- タブ -->
    <div class="as-tabs">
      <button class="as-tab" :class="{ active: activeTab === 'accounts' }" @click="activeTab = 'accounts'">勘定科目</button>
      <button class="as-tab" :class="{ active: activeTab === 'tax' }" @click="activeTab = 'tax'">税区分</button>
    </div>

    <!-- ========== 勘定科目タブ ========== -->
    <div v-if="activeTab === 'accounts'">
      <div class="as-filters">
        <input type="text" placeholder="勘定科目名" class="as-filter-input">
        <input type="text" placeholder="補助科目名" class="as-filter-input">
      </div>
      <div class="as-toolbar">
        <div class="as-pagination">
          <span class="as-page-btn">＜</span>
          <span class="as-page-num active">1</span>
          <span class="as-page-num">2</span>
          <span class="as-page-btn">＞</span>
          <span class="as-page-info">1~25 / 全{{ accountRows.length }}件</span>
        </div>
        <div class="as-actions">
          <button class="as-action-btn"><i class="fa-solid fa-arrow-up-down"></i> 並び替え</button>
          <button class="as-action-btn"><i class="fa-solid fa-rotate"></i> 更新</button>
          <button class="as-action-btn primary"><i class="fa-solid fa-plus"></i> 追加</button>
        </div>
      </div>
      <table class="as-table">
        <colgroup>
          <col class="col-check">
          <col class="col-main">
          <col class="col-main">
          <col class="col-main">
          <col class="col-check">
        </colgroup>
        <thead>
          <tr>
            <th class="as-th-check"><input type="checkbox"></th>
            <th class="sortable" @click="sortAccounts('name')">
              勘定科目 <i :class="getSortIcon('accounts', 'name')"></i>
            </th>
            <th class="sortable" @click="sortAccounts('sub')">
              補助科目 <i :class="getSortIcon('accounts', 'sub')"></i>
            </th>
            <th class="sortable" @click="sortAccounts('defaultTaxCategoryId')">
              税区分 <i :class="getSortIcon('accounts', 'defaultTaxCategoryId')"></i>
            </th>
            <th class="as-th-check"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in accountRows" :key="row.name + idx"
            draggable="true"
            @dragstart="onDragStart($event, idx, 'accounts')"
            @dragover.prevent="onDragOver($event, idx, 'accounts')"
            @drop="onDrop($event, idx, 'accounts')"
            @dragend="dragIdx = -1"
            :class="{ 'drag-over': dragTarget === 'accounts' && dragOverIdx === idx }"
          >
            <td class="as-td-check"><input type="checkbox"></td>
            <td>{{ row.name }}</td>
            <td>{{ row.sub }}</td>
            <td>{{ getTaxCategoryName(row.defaultTaxCategoryId) }}</td>
            <td class="as-td-check"><i class="fa-solid fa-trash-can td-trash"></i></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ========== 税区分タブ ========== -->
    <div v-if="activeTab === 'tax'">
      <div class="as-toolbar" style="margin-top: 8px;">
        <div class="as-pagination">
          <span class="as-page-btn">＜</span>
          <span class="as-page-num active">1</span>
          <span class="as-page-btn">＞</span>
          <span class="as-page-info">1~{{ taxRows.length }} / 全{{ taxRows.length }}件</span>
        </div>
        <div class="as-actions">
          <button class="as-action-btn"><i class="fa-solid fa-arrow-up-down"></i> 並び替え</button>
          <button class="as-action-btn"><i class="fa-solid fa-rotate"></i> 更新</button>
          <button class="as-action-btn primary"><i class="fa-solid fa-plus"></i> 追加</button>
        </div>
      </div>
      <table class="as-table">
        <colgroup>
          <col class="col-check">
          <col style="width: calc((100% - 76px) / 7);">
          <col style="width: calc((100% - 76px) * 5 / 7);">
          <col style="width: calc((100% - 76px) / 7);">
          <col class="col-check">
        </colgroup>
        <thead>
          <tr>
            <th class="as-th-check"><input type="checkbox"></th>
            <th class="sortable" @click="sortTax('qualified')">
              適格対象 <i :class="getSortIcon('tax', 'qualified')"></i>
            </th>
            <th class="sortable" @click="sortTax('name')">
              税区分 <i :class="getSortIcon('tax', 'name')"></i>
            </th>
            <th class="sortable" @click="sortTax('name')">
              税率 <i :class="getSortIcon('tax', 'name')"></i>
            </th>
            <th class="as-th-check"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in taxRows" :key="row.name + idx"
            draggable="true"
            @dragstart="onDragStart($event, idx, 'tax')"
            @dragover.prevent="onDragOver($event, idx, 'tax')"
            @drop="onDrop($event, idx, 'tax')"
            @dragend="dragIdx = -1"
            :class="{ 'drag-over': dragTarget === 'tax' && dragOverIdx === idx }"
          >
            <td class="as-td-check"><input type="checkbox"></td>
            <td style="text-align: center;">{{ row.qualified ? '○' : '' }}</td>
            <td>{{ row.name }}</td>
            <td style="text-align: center;">{{ extractRateFromName(row.name) || '0%' }}</td>
            <td class="as-td-check"><i class="fa-solid fa-trash-can td-trash"></i></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { Account } from '@/shared/types/account';
import type { TaxCategory } from '@/shared/types/tax-category';
import { extractRateFromName } from '@/shared/types/tax-category';
import { TAX_CATEGORY_MASTER } from '@/shared/data/tax-category-master';

const activeTab = ref<'accounts' | 'tax'>('accounts');

/** 特殊な税区分ID（マスタ外）の表示名 */
const SPECIAL_TAX_NAMES: Record<string, string> = {
  'AUTO_PURCHASE': '自動判定(仕入)',
  'AUTO_SALES': '自動判定(売上)',
};

/** 概念IDからMF正式名称を取得 */
function getTaxCategoryName(id?: string): string {
  if (!id) return '';
  if (SPECIAL_TAX_NAMES[id]) return SPECIAL_TAX_NAMES[id];
  const found = TAX_CATEGORY_MASTER.find(tc => tc.id === id);
  return found ? found.name : id;
}

// --- 型安全ジェネリックソート ---
function compareByKey<T>(arr: T[], key: keyof T, asc: boolean): void {
  arr.sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (typeof va === 'boolean' && typeof vb === 'boolean') {
      return asc ? (va === vb ? 0 : va ? -1 : 1) : (va === vb ? 0 : va ? 1 : -1);
    }
    return asc
      ? String(va ?? '').localeCompare(String(vb ?? ''), 'ja')
      : String(vb ?? '').localeCompare(String(va ?? ''), 'ja');
  });
}

// --- ソート状態 ---
const sortState = reactive({
  accounts: { key: '' as keyof Account | '', asc: true },
  tax: { key: '' as keyof TaxCategory | '', asc: true },
});

function getSortIcon(tab: 'accounts' | 'tax', key: string) {
  const s = sortState[tab];
  if (s.key !== key) return 'fa-solid fa-sort sort-icon inactive';
  return s.asc ? 'fa-solid fa-sort-up sort-icon' : 'fa-solid fa-sort-down sort-icon';
}

function sortAccounts(key: keyof Account) {
  const s = sortState.accounts;
  if (s.key === key) { s.asc = !s.asc; } else { s.key = key; s.asc = true; }
  compareByKey(accountRows, key, s.asc);
}

function sortTax(key: keyof TaxCategory) {
  const s = sortState.tax;
  if (s.key === key) { s.asc = !s.asc; } else { s.key = key; s.asc = true; }
  compareByKey(taxRows, key, s.asc);
}

// --- ドラッグ&ドロップ ---
const dragIdx = ref(-1);
const dragOverIdx = ref(-1);
const dragTarget = ref('');

function onDragStart(e: DragEvent, idx: number, target: string) {
  dragIdx.value = idx;
  dragTarget.value = target;
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
}

function onDragOver(_e: DragEvent, idx: number, target: string) {
  if (dragTarget.value === target) dragOverIdx.value = idx;
}

function onDrop(_e: DragEvent, idx: number, target: string) {
  if (dragTarget.value !== target || dragIdx.value === idx) return;
  if (target === 'accounts') {
    const [item] = accountRows.splice(dragIdx.value, 1);
    if (item) accountRows.splice(idx, 0, item);
    sortState.accounts.key = '';
  } else {
    const [item] = taxRows.splice(dragIdx.value, 1);
    if (item) taxRows.splice(idx, 0, item);
    sortState.tax.key = '';
  }
  dragIdx.value = -1;
  dragOverIdx.value = -1;
}

// --- データ（ドメイン型準拠） ---
const accountRows: Account[] = reactive([
  { id: 'ACC_MIKAKUTEI', name: '未確定', sub: '', defaultTaxCategoryId: 'AUTO_PURCHASE', sortOrder: 1 },
  { id: 'ACC_GENKIN', name: '現金', sub: '', defaultTaxCategoryId: 'COMMON_EXEMPT', sortOrder: 2 },
  { id: 'ACC_FUTSUYO', name: '普通預金', sub: '', defaultTaxCategoryId: 'COMMON_EXEMPT', sortOrder: 3 },
  { id: 'ACC_TOUZAYO', name: '当座預金', sub: '', defaultTaxCategoryId: 'COMMON_EXEMPT', sortOrder: 4 },
  { id: 'ACC_URIKAKE', name: '売掛金', sub: '', defaultTaxCategoryId: 'COMMON_EXEMPT', sortOrder: 5 },
  { id: 'ACC_KARIBARAI', name: '仮払金', sub: '', defaultTaxCategoryId: 'COMMON_EXEMPT', sortOrder: 6 },
  { id: 'ACC_BIHIN', name: '工具器具備品', sub: '', defaultTaxCategoryId: 'AUTO_PURCHASE', sortOrder: 7 },
  { id: 'ACC_JIGYONUSHI', name: '事業主貸', sub: '', defaultTaxCategoryId: 'COMMON_EXEMPT', sortOrder: 8 },
  { id: 'ACC_KAIKAKE', name: '買掛金', sub: '', defaultTaxCategoryId: 'COMMON_EXEMPT', sortOrder: 9 },
  { id: 'ACC_TANKIKAR', name: '短期借入金', sub: '', defaultTaxCategoryId: 'COMMON_EXEMPT', sortOrder: 10 },
  { id: 'ACC_MIBARAIK', name: '未払金', sub: '', defaultTaxCategoryId: 'COMMON_EXEMPT', sortOrder: 11 },
  { id: 'ACC_MIBARAIH', name: '未払費用', sub: '', defaultTaxCategoryId: 'COMMON_EXEMPT', sortOrder: 12 },
  { id: 'ACC_KARIUKE', name: '仮受金', sub: '', defaultTaxCategoryId: 'COMMON_EXEMPT', sortOrder: 13 },
  { id: 'ACC_CHOUKIKA', name: '長期借入金', sub: '', defaultTaxCategoryId: 'COMMON_EXEMPT', sortOrder: 14 },
  { id: 'ACC_URIAGE', name: '売上高', sub: '', defaultTaxCategoryId: 'AUTO_SALES', sortOrder: 15 },
]);

const taxRows: TaxCategory[] = reactive([
  { id: 'COMMON_EXEMPT', name: '対象外', shortName: '対象外', direction: 'common', qualified: false, aiSelectable: false, active: true, defaultVisible: true, displayOrder: 2 },
  { id: 'PURCHASE_TAXABLE_10', name: '課税仕入 10%', shortName: '課仕 10%', direction: 'purchase', qualified: true, aiSelectable: true, active: true, defaultVisible: true, displayOrder: 78 },
  { id: 'PURCHASE_TAXABLE_8', name: '課税仕入 8%', shortName: '課仕 8%', direction: 'purchase', qualified: true, aiSelectable: true, active: true, defaultVisible: true, displayOrder: 84 },
  { id: 'PURCHASE_REDUCED_8', name: '課税仕入 (軽)8%', shortName: '課仕 (軽)8%', direction: 'purchase', qualified: true, aiSelectable: true, active: true, defaultVisible: true, displayOrder: 81 },
  { id: 'PURCHASE_NON_TAXABLE', name: '非課税仕入', shortName: '非仕', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: true, displayOrder: 132 },
  { id: 'SALES_TAXABLE_10', name: '課税売上 10%', shortName: '課売 10%', direction: 'sales', qualified: false, aiSelectable: true, active: true, defaultVisible: true, displayOrder: 3 },
  { id: 'SALES_TAXABLE_8', name: '課税売上 8%', shortName: '課売 8%', direction: 'sales', qualified: false, aiSelectable: true, active: true, defaultVisible: true, displayOrder: 17 },
  { id: 'SALES_REDUCED_8', name: '課税売上 (軽)8%', shortName: '課売 (軽)8%', direction: 'sales', qualified: false, aiSelectable: true, active: true, defaultVisible: true, displayOrder: 10 },
  { id: 'SALES_NON_TAXABLE', name: '非課税売上', shortName: '非売', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, displayOrder: 32 },
  { id: 'SALES_RETURN_10', name: '課税売上-返還等 10%', shortName: '課売-返還 10%', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, displayOrder: 36 },
  { id: 'SALES_RETURN_8', name: '課税売上-返還等 8%', shortName: '課売-返還 8%', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, displayOrder: 50 },
  { id: 'SALES_RETURN_REDUCED_8', name: '課税売上-返還等 (軽)8%', shortName: '課売-返還 (軽)8%', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, displayOrder: 43 },
]);
</script>

<style scoped>
.account-settings {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #333;
  background: #ffffff;
  padding: 0 16px;
}

.as-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  font-size: 12px;
}

.as-header-label {
  color: #1976D2;
  font-weight: 600;
}

.as-tabs {
  display: flex;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 0;
}

.as-tab {
  padding: 6px 16px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  font-size: 12px;
  color: #888;
  margin-right: 2px;
  transition: background 0.15s, color 0.15s;
}

.as-tab.active {
  background: #1976D2;
  color: #ffffff;
  font-weight: 600;
  border-color: #1976D2;
  border-bottom: 2px solid #ffffff;
  margin-bottom: -2px;
}

.as-filters {
  display: flex;
  gap: 8px;
  padding: 8px 0;
}

.as-filter-input {
  border: 1px solid #ccc;
  border-radius: 3px;
  padding: 4px 8px;
  font-size: 11px;
  width: 140px;
  outline: none;
}
.as-filter-input:focus { border-color: #1976D2; }

.as-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.as-pagination {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.as-page-btn { padding: 2px 6px; cursor: pointer; color: #888; }
.as-page-num { padding: 2px 8px; cursor: pointer; border-radius: 3px; color: #555; }
.as-page-num.active { background: #1976D2; color: white; }
.as-page-info { margin-left: 8px; color: #888; }

.as-actions { display: flex; gap: 8px; }
.as-action-btn {
  background: none; border: none; color: #1976D2;
  font-size: 11px; cursor: pointer; padding: 2px 4px;
  display: flex; align-items: center; gap: 3px;
}
.as-action-btn:hover { text-decoration: underline; }
.as-action-btn.primary { font-weight: 600; }

/* テーブル */
.as-table { width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #d0d7de; }

.col-check { width: 38px; }
.col-main { width: calc((100% - 76px) / 3); }

.as-table thead { background: #e3f2fd; }
.as-table th {
  padding: 6px 10px; text-align: center; font-weight: 600;
  color: #555; font-size: 11px; white-space: nowrap;
  border: 1px solid #d0d7de;
}
.as-th-check, .as-td-check { width: 38px; text-align: center; }
.as-table td { padding: 5px 10px; border: 1px solid #e0e0e0; color: #333; }
.as-table tbody tr { cursor: grab; }
.as-table tbody tr:hover { background: #f5f9ff; }
.as-table tbody tr.drag-over { border-top: 2px solid #1976D2; }

.td-trash { color: #bbb; cursor: pointer; font-size: 12px; }
.td-trash:hover { color: #e53935; }

/* ソートアイコン */
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { background: #d0e8fc; }
.sort-icon { font-size: 9px; margin-left: 2px; color: #1976D2; }
.sort-icon.inactive { color: #ccc; }
</style>
