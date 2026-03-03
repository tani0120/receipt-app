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
      <!-- 切替セレクター（読み取り専用） -->
      <div class="as-selectors-center">
        <div class="as-selector-group-lg">
          <span class="as-selector-label-lg">事業形態:</span>
          <select v-model="accountBusinessType" class="as-selector-lg as-selector-locked">
            <option value="individual" :disabled="storeEntityToMaster(settingsStore.entityType) !== 'individual'">個人事業主</option>
            <option value="corp" :disabled="storeEntityToMaster(settingsStore.entityType) !== 'corp'">法人</option>
          </select>
        </div>
        <div class="as-selector-group-lg" v-if="accountBusinessType === 'individual'">
          <label class="as-checkbox-label-lg as-checkbox-locked">
            <input type="checkbox" v-model="accountHasRealEstate" disabled class="as-checkbox-lg">
            <span>不動産所得あり</span>
          </label>
        </div>
        <span class="as-store-hint">※基本情報で変更</span>
      </div>

      <div class="as-filters">
        <input type="text" v-model="accountFilter" placeholder="科目名で絞り込み" class="as-filter-input">
        <span class="as-page-info-text">全{{ filteredAccountRows.length }}件</span>
      </div>
      <div class="as-toolbar">
        <div class="as-pagination">
          <span class="as-page-arrow" :class="{ disabled: accountPage <= 1 }" @click="accountPage = Math.max(1, accountPage - 1)">＜</span>
          <span
            v-for="p in accountTotalPages" :key="p"
            class="as-page-num" :class="{ active: accountPage === p }"
            @click="accountPage = p"
          >{{ p }}</span>
          <span class="as-page-arrow" :class="{ disabled: accountPage >= accountTotalPages }" @click="accountPage = Math.min(accountTotalPages, accountPage + 1)">＞</span>
          <span class="as-page-range">{{ accountPageStart }}~{{ accountPageEnd }} / {{ filteredAccountRows.length }}件</span>
        </div>
        <div class="as-actions">
          <button class="as-action-btn" @click="resetAccountOrder"><i class="fa-solid fa-rotate"></i> デフォルト順</button>
          <button class="as-action-btn primary"><i class="fa-solid fa-plus"></i> 追加</button>
        </div>
      </div>
      <div class="as-table-wrap">
        <table class="as-table">
          <colgroup>
            <col class="col-check">
            <col style="width: 20%;">
            <col style="width: 20%;">
            <col style="width: 30%;">
            <col style="width: 8%;">
            <col class="col-check">
          </colgroup>
          <thead>
            <tr>
              <th class="as-th-check"><input type="checkbox"></th>
              <th class="sortable" @click="sortAccounts('name')">
                勘定科目 <i :class="getSortIcon('accounts', 'name')"></i>
              </th>
              <th class="sortable" @click="sortAccounts('category')">
                分類 <i :class="getSortIcon('accounts', 'category')"></i>
              </th>
              <th class="sortable" @click="sortAccounts('defaultTaxCategoryId')">
                税区分 <i :class="getSortIcon('accounts', 'defaultTaxCategoryId')"></i>
              </th>
              <th>AI</th>
              <th class="as-th-check"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedAccountRows" :key="row.id">
              <td class="as-td-check"><input type="checkbox"></td>
              <td>{{ row.name }}</td>
              <td class="td-category">{{ row.category }}</td>
              <td>{{ getTaxCategoryName(row.defaultTaxCategoryId) }}</td>
              <td class="td-ai">{{ row.aiSelectable ? '○' : '' }}</td>
              <td class="as-td-check"><i class="fa-solid fa-trash-can td-trash"></i></td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- 下部ページネーション -->
      <div class="as-pagination bottom">
        <span class="as-page-arrow" :class="{ disabled: accountPage <= 1 }" @click="accountPage = Math.max(1, accountPage - 1)">＜</span>
        <span
          v-for="p in accountTotalPages" :key="'b' + p"
          class="as-page-num" :class="{ active: accountPage === p }"
          @click="accountPage = p"
        >{{ p }}</span>
        <span class="as-page-arrow" :class="{ disabled: accountPage >= accountTotalPages }" @click="accountPage = Math.min(accountTotalPages, accountPage + 1)">＞</span>
      </div>
    </div>

    <!-- ========== 税区分タブ ========== -->
    <div v-if="activeTab === 'tax'">
      <!-- 切替セレクター（読み取り専用） -->
      <div class="as-selectors-center">
        <div class="as-selector-group-lg">
          <span class="as-selector-label-lg">課税方式:</span>
          <select v-model="taxTabMethod" class="as-selector-lg as-selector-locked">
            <option value="general" :disabled="settingsStore.taxMethod !== 'general'">本則課税</option>
            <option value="simplified" :disabled="settingsStore.taxMethod !== 'simplified'">簡易課税</option>
            <option value="exempt" :disabled="settingsStore.taxMethod !== 'exempt'">免税事業者</option>
          </select>
        </div>
        <span class="as-store-hint">※基本情報で変更</span>
      </div>

      <div class="as-toolbar" style="margin-top: 8px;">
        <div class="as-pagination">
          <span class="as-page-arrow" :class="{ disabled: taxPage <= 1 }" @click="taxPage = Math.max(1, taxPage - 1)">＜</span>
          <span
            v-for="p in taxTotalPages" :key="p"
            class="as-page-num" :class="{ active: taxPage === p }"
            @click="taxPage = p"
          >{{ p }}</span>
          <span class="as-page-arrow" :class="{ disabled: taxPage >= taxTotalPages }" @click="taxPage = Math.min(taxTotalPages, taxPage + 1)">＞</span>
          <span class="as-page-range">{{ taxPageStart }}~{{ taxPageEnd }} / {{ filteredTaxRows.length }}件</span>
        </div>
        <div class="as-actions">
          <button class="as-action-btn" @click="resetTaxOrder"><i class="fa-solid fa-rotate"></i> デフォルト順</button>
          <button class="as-action-btn primary"><i class="fa-solid fa-plus"></i> 追加</button>
        </div>
      </div>
      <div class="as-table-wrap">
        <table class="as-table">
          <colgroup>
            <col class="col-check">
            <col style="width: 8%;">
            <col style="width: 10%;">
            <col style="width: auto;">
            <col style="width: 10%;">
            <col style="width: 8%;">
            <col class="col-check">
          </colgroup>
          <thead>
            <tr>
              <th class="as-th-check"><input type="checkbox"></th>
              <th class="sortable" @click="sortTax('qualified')">
                適格判定対象 <i class="fa-solid fa-circle-question th-help" title="この税区分を使う際、取引先のインボイス登録番号の確認が必要かどうか。仕入側の課税取引にのみ○がつきます。"></i>
                <i :class="getSortIcon('tax', 'qualified')"></i>
              </th>
              <th class="sortable" @click="sortTax('direction')">
                取引区分 <i :class="getSortIcon('tax', 'direction')"></i>
              </th>
              <th class="sortable" @click="sortTax('name')">
                税区分 <i :class="getSortIcon('tax', 'name')"></i>
              </th>
              <th class="sortable" @click="sortTaxByRate()">
                税率 <i :class="getSortIcon('tax', '_rate')"></i>
              </th>
              <th>AI</th>
              <th class="as-th-check"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedTaxRows" :key="row.id">
              <td class="as-td-check"><input type="checkbox"></td>
              <td style="text-align: center;">{{ row.qualified ? '○' : '' }}</td>
              <td class="td-direction" :class="'dir-' + row.direction">{{ directionLabel(row.direction) }}</td>
              <td>{{ row.name }}</td>
              <td style="text-align: center;">{{ extractRateFromName(row.name) || '-' }}</td>
              <td class="td-ai">{{ row.aiSelectable ? '○' : '' }}</td>
              <td class="as-td-check"><i class="fa-solid fa-trash-can td-trash"></i></td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- 下部ページネーション -->
      <div class="as-pagination bottom">
        <span class="as-page-arrow" :class="{ disabled: taxPage <= 1 }" @click="taxPage = Math.max(1, taxPage - 1)">＜</span>
        <span
          v-for="p in taxTotalPages" :key="'b' + p"
          class="as-page-num" :class="{ active: taxPage === p }"
          @click="taxPage = p"
        >{{ p }}</span>
        <span class="as-page-arrow" :class="{ disabled: taxPage >= taxTotalPages }" @click="taxPage = Math.min(taxTotalPages, taxPage + 1)">＞</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import type { Account } from '@/shared/types/account';
import type { TaxCategory, TaxDirection } from '@/shared/types/tax-category';
import { extractRateFromName } from '@/shared/types/tax-category';
import { TAX_CATEGORY_MASTER } from '@/shared/data/tax-category-master';
import { ACCOUNT_MASTER } from '@/shared/data/account-master';
import { useSettingsStore } from '@/stores/settingsStore';

const settingsStore = useSettingsStore();

const props = withDefaults(defineProps<{ defaultTab?: 'accounts' | 'tax' }>(), {
  defaultTab: 'accounts'
});

const activeTab = ref<'accounts' | 'tax'>(props.defaultTab);
const PAGE_SIZE = 50;

// =============== 基本情報ストアからのマッピング ===============
// corporate→corp の変換（ストアは 'corporate'/'individual'、マスターは 'corp'/'individual'）
function storeEntityToMaster(entity: string): 'corp' | 'individual' {
  return entity === 'corporate' ? 'corp' : 'individual';
}

// =============== 勘定科目タブ ===============
const accountBusinessType = ref<'corp' | 'individual'>(storeEntityToMaster(settingsStore.entityType));
const accountHasRealEstate = ref(settingsStore.hasRealEstate);
const accountFilter = ref('');
const accountPage = ref(1);

// ストア変更を監視して同期
watch(() => settingsStore.entityType, (v) => { accountBusinessType.value = storeEntityToMaster(v); });
watch(() => settingsStore.hasRealEstate, (v) => { accountHasRealEstate.value = v; });

const accountRows: Account[] = reactive([...ACCOUNT_MASTER]);

const filteredAccountRows = computed(() => {
  return accountRows.filter(row => {
    if (row.target !== 'both' && row.target !== accountBusinessType.value) return false;
    if (accountBusinessType.value === 'individual' && !accountHasRealEstate.value) {
      if (row.category === '不動産収入' || row.category === '不動産経費' || row.category === '不動産') return false;
    }
    if (accountFilter.value && !row.name.includes(accountFilter.value)) return false;
    return true;
  });
});

const accountTotalPages = computed(() => Math.max(1, Math.ceil(filteredAccountRows.value.length / PAGE_SIZE)));
const accountPageStart = computed(() => (accountPage.value - 1) * PAGE_SIZE + 1);
const accountPageEnd = computed(() => Math.min(accountPage.value * PAGE_SIZE, filteredAccountRows.value.length));
const pagedAccountRows = computed(() => filteredAccountRows.value.slice(accountPageStart.value - 1, accountPageEnd.value));

watch(filteredAccountRows, () => { if (accountPage.value > accountTotalPages.value) accountPage.value = 1; });

// =============== 税区分タブ ===============
type TaxMethodType = 'general' | 'simplified' | 'exempt';
const taxTabMethod = ref<TaxMethodType>(settingsStore.taxMethod);
const taxPage = ref(1);

watch(() => settingsStore.taxMethod, (v) => { taxTabMethod.value = v; });

const allTaxRows: TaxCategory[] = reactive([...TAX_CATEGORY_MASTER]);

const filteredTaxRows = computed(() => {
  return allTaxRows.filter(row => {
    if (!row.active) return false;
    if (taxTabMethod.value === 'exempt') {
      // 免税事業者は「対象外」のみ（「不明」はAI内部ステータスのため除外）
      return row.id === 'COMMON_EXEMPT';
    }
    if (taxTabMethod.value === 'simplified') {
      return row.defaultVisible && (
        row.direction === 'common' ||
        row.direction === 'sales' ||
        row.id === 'PURCHASE_TAXABLE_10' ||
        row.id === 'PURCHASE_REDUCED_8' ||
        row.id === 'PURCHASE_NON_TAXABLE' ||
        row.id === 'PURCHASE_EXEMPT'
      );
    }
    return row.defaultVisible;
  });
});

const taxTotalPages = computed(() => Math.max(1, Math.ceil(filteredTaxRows.value.length / PAGE_SIZE)));
const taxPageStart = computed(() => (taxPage.value - 1) * PAGE_SIZE + 1);
const taxPageEnd = computed(() => Math.min(taxPage.value * PAGE_SIZE, filteredTaxRows.value.length));
const pagedTaxRows = computed(() => filteredTaxRows.value.slice(taxPageStart.value - 1, taxPageEnd.value));

watch(filteredTaxRows, () => { if (taxPage.value > taxTotalPages.value) taxPage.value = 1; });

// =============== 共通 ===============
function directionLabel(dir: TaxDirection): string {
  switch (dir) { case 'sales': return '売上'; case 'purchase': return '仕入'; case 'common': return '共通'; }
}

function getTaxCategoryName(id?: string): string {
  if (!id) return '';
  const found = TAX_CATEGORY_MASTER.find(tc => tc.id === id);
  return found ? found.shortName : id;
}

function compareByKey<T>(arr: T[], key: keyof T, asc: boolean): void {
  arr.sort((a, b) => {
    const va = a[key]; const vb = b[key];
    if (typeof va === 'boolean' && typeof vb === 'boolean') return asc ? (va === vb ? 0 : va ? -1 : 1) : (va === vb ? 0 : va ? 1 : -1);
    return asc ? String(va ?? '').localeCompare(String(vb ?? ''), 'ja') : String(vb ?? '').localeCompare(String(va ?? ''), 'ja');
  });
}

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
  compareByKey(allTaxRows, key, s.asc);
}

/** 税率の数値ソート */
function sortTaxByRate() {
  const s = sortState.tax;
  if (s.key === '_rate' as any) { s.asc = !s.asc; } else { s.key = '_rate' as any; s.asc = true; }
  allTaxRows.sort((a, b) => {
    const pa = parseFloat(extractRateFromName(a.name));
    const pb = parseFloat(extractRateFromName(b.name));
    const ra = isNaN(pa) ? -1 : pa;
    const rb = isNaN(pb) ? -1 : pb;
    return s.asc ? ra - rb : rb - ra;
  });
}

/** デフォルト順に戻す */
function resetAccountOrder() {
  accountRows.splice(0, accountRows.length, ...ACCOUNT_MASTER);
  sortState.accounts.key = '';
}
function resetTaxOrder() {
  allTaxRows.splice(0, allTaxRows.length, ...TAX_CATEGORY_MASTER);
  sortState.tax.key = '';
}
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
  overflow: auto;
}

.as-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  font-size: 12px;
}
.as-header-label { color: #1976D2; font-weight: 600; }

.as-tabs { display: flex; border-bottom: 2px solid #e0e0e0; margin-bottom: 0; }
.as-tab {
  padding: 6px 16px; background: #f5f5f5; border: 1px solid #e0e0e0;
  border-bottom: none; border-radius: 4px 4px 0 0; cursor: pointer;
  font-size: 12px; color: #888; margin-right: 2px; transition: background 0.15s, color 0.15s;
}
.as-tab.active {
  background: #1976D2; color: #ffffff; font-weight: 600;
  border-color: #1976D2; border-bottom: 2px solid #ffffff; margin-bottom: -2px;
}

/* ========== セレクター（中央・大きめ） ========== */
.as-selectors-center {
  display: flex; justify-content: center; align-items: center;
  gap: 24px; padding: 14px 0; border-bottom: 1px solid #f0f0f0;
}
.as-selector-group-lg { display: flex; align-items: center; gap: 10px; }
.as-selector-label-lg { font-size: 15px; color: #555; font-weight: 700; }
.as-selector-lg {
  padding: 8px 14px; font-size: 16px; border: 2px solid #ccc;
  border-radius: 6px; background: #fff; color: #333; cursor: pointer; outline: none;
  min-width: 160px;
}
.as-selector-lg:focus { border-color: #1976D2; }
.as-checkbox-label-lg {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; color: #333; cursor: pointer;
}
.as-checkbox-lg { width: 18px; height: 18px; accent-color: #1976D2; cursor: pointer; }

/* ロック状態 */
.as-selector-locked {
  border-color: #1976D2; background: #e8f0fe; color: #1565C0;
  font-weight: 700; cursor: default;
}
.as-selector-locked option:disabled {
  color: #bbb; font-weight: 400;
}
.as-checkbox-locked { opacity: 0.7; cursor: default; }
.as-store-hint {
  font-size: 11px; color: #999; font-style: italic;
}

/* ========== フィルター等 ========== */
.as-filters { display: flex; align-items: center; gap: 8px; padding: 8px 0; }
.as-filter-input {
  border: 1px solid #ccc; border-radius: 3px; padding: 4px 8px;
  font-size: 11px; width: 200px; outline: none;
}
.as-filter-input:focus { border-color: #1976D2; }
.as-page-info-text { margin-left: auto; color: #888; font-size: 11px; }

.as-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }

/* ========== ページネーション ========== */
.as-pagination { display: flex; align-items: center; gap: 2px; font-size: 12px; }
.as-pagination.bottom { justify-content: center; padding: 8px 0 12px; }
.as-page-arrow {
  padding: 4px 10px; cursor: pointer; color: #1976D2; font-weight: 600;
  border-radius: 3px; user-select: none;
}
.as-page-arrow:hover { background: #e3f2fd; }
.as-page-arrow.disabled { color: #ccc; pointer-events: none; }
.as-page-num {
  padding: 4px 10px; cursor: pointer; border-radius: 3px; color: #555;
  min-width: 28px; text-align: center; user-select: none;
}
.as-page-num:hover { background: #e3f2fd; }
.as-page-num.active { background: #1976D2; color: white; font-weight: 600; }
.as-page-range { margin-left: 10px; color: #888; font-size: 11px; }

.as-actions { display: flex; gap: 8px; }
.as-action-btn {
  background: none; border: none; color: #1976D2;
  font-size: 11px; cursor: pointer; padding: 2px 4px;
  display: flex; align-items: center; gap: 3px;
}
.as-action-btn:hover { text-decoration: underline; }
.as-action-btn.primary { font-weight: 600; }

/* ========== テーブル ========== */
.as-table-wrap { overflow: auto; flex: 1; min-height: 0; }
.as-table { width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #d0d7de; }
.col-check { width: 38px; }
.as-table thead { background: #e3f2fd; position: sticky; top: 0; z-index: 1; }
.as-table th {
  padding: 6px 10px; text-align: center; font-weight: 600;
  color: #555; font-size: 11px; white-space: nowrap; border: 1px solid #d0d7de;
}
.as-th-check, .as-td-check { width: 38px; text-align: center; }
.as-table td { padding: 5px 10px; border: 1px solid #e0e0e0; color: #333; }
.as-table tbody tr { cursor: grab; }
.as-table tbody tr:hover { background: #f5f9ff; }
.as-table tbody tr.drag-over { border-top: 2px solid #1976D2; }

.td-trash { color: #bbb; cursor: pointer; font-size: 12px; }
.td-trash:hover { color: #e53935; }
.td-category { color: #888; font-size: 11px; }
.td-ai { text-align: center; color: #1976D2; font-weight: 600; }
.td-direction { text-align: center; font-size: 10px; font-weight: 600; }
.dir-sales { color: #2e7d32; }
.dir-purchase { color: #c62828; }
.dir-common { color: #555; }

.sortable { cursor: pointer; user-select: none; }
.sortable:hover { background: #d0e8fc; }
.sort-icon { font-size: 9px; margin-left: 2px; color: #1976D2; }
.sort-icon.inactive { color: #ccc; }
.th-help { color: #999; font-size: 10px; cursor: help; margin-left: 2px; }
</style>
