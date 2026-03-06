<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <!-- 共通ナビバー -->
    <MockNavBar />
    <!-- 税区分マスタ コンテンツ -->
    <div class="flex-1 overflow-auto">
      <div class="account-settings">
        <!-- ヘッダー -->
        <div class="as-header">
          <router-link to="/master" class="as-back-link">
            <i class="fa-solid fa-arrow-left"></i> マスタ管理
          </router-link>
          <span class="as-header-label">税区分マスタ（事務所共通）</span>
        </div>

        <!-- 切替セレクター -->
        <div class="as-selectors-center">
          <div class="as-selector-group-lg">
            <span class="as-selector-label-lg">課税方式:</span>
            <select v-model="taxTabMethod" class="as-selector-lg">
              <option value="general">本則課税</option>
              <option value="simplified">簡易課税</option>
              <option value="exempt">免税事業者</option>
            </select>
          </div>
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
                  <i :class="getSortIcon('qualified')"></i>
                </th>
                <th class="sortable" @click="sortTax('direction')">
                  取引区分 <i :class="getSortIcon('direction')"></i>
                </th>
                <th class="sortable" @click="sortTax('name')">
                  税区分 <i :class="getSortIcon('name')"></i>
                </th>
                <th class="sortable" @click="sortTaxByRate()">
                  税率 <i :class="getSortIcon('_rate')"></i>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import type { TaxCategory, TaxDirection } from '@/shared/types/tax-category';
import { extractRateFromName } from '@/shared/types/tax-category';
import { TAX_CATEGORY_MASTER } from '@/shared/data/tax-category-master';
import MockNavBar from '@/mocks/components/MockNavBar.vue';

const PAGE_SIZE = 50;

// =============== 税区分マスタ ===============
type TaxMethodType = 'general' | 'simplified' | 'exempt';
const taxTabMethod = ref<TaxMethodType>('general');
const taxPage = ref(1);

const allTaxRows: TaxCategory[] = reactive([...TAX_CATEGORY_MASTER]);

const filteredTaxRows = computed(() => {
  return allTaxRows.filter(row => {
    if (!row.active) return false;
    if (taxTabMethod.value === 'exempt') {
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

// =============== 共通ユーティリティ ===============
function directionLabel(dir: TaxDirection): string {
  switch (dir) { case 'sales': return '売上'; case 'purchase': return '仕入'; case 'common': return '共通'; }
}

function compareByKey<T>(arr: T[], key: keyof T, asc: boolean): void {
  arr.sort((a, b) => {
    const va = a[key]; const vb = b[key];
    if (typeof va === 'boolean' && typeof vb === 'boolean') return asc ? (va === vb ? 0 : va ? -1 : 1) : (va === vb ? 0 : va ? 1 : -1);
    return asc ? String(va ?? '').localeCompare(String(vb ?? ''), 'ja') : String(vb ?? '').localeCompare(String(va ?? ''), 'ja');
  });
}

const sortState = reactive({ key: '' as keyof TaxCategory | '' | '_rate', asc: true });

function getSortIcon(key: string) {
  if (sortState.key !== key) return 'fa-solid fa-sort sort-icon inactive';
  return sortState.asc ? 'fa-solid fa-sort-up sort-icon' : 'fa-solid fa-sort-down sort-icon';
}

function sortTax(key: keyof TaxCategory) {
  if (sortState.key === key) { sortState.asc = !sortState.asc; } else { sortState.key = key; sortState.asc = true; }
  compareByKey(allTaxRows, key, sortState.asc);
}

function sortTaxByRate() {
  if (sortState.key === '_rate') { sortState.asc = !sortState.asc; } else { sortState.key = '_rate'; sortState.asc = true; }
  allTaxRows.sort((a, b) => {
    const pa = parseFloat(extractRateFromName(a.name));
    const pb = parseFloat(extractRateFromName(b.name));
    const ra = isNaN(pa) ? -1 : pa;
    const rb = isNaN(pb) ? -1 : pb;
    return sortState.asc ? ra - rb : rb - ra;
  });
}

function resetTaxOrder() {
  allTaxRows.splice(0, allTaxRows.length, ...TAX_CATEGORY_MASTER);
  sortState.key = '';
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
.as-back-link {
  color: #1976D2;
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}
.as-back-link:hover { text-decoration: underline; }
.as-header-label { color: #1976D2; font-weight: 600; }

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

.td-trash { color: #bbb; cursor: pointer; font-size: 12px; }
.td-trash:hover { color: #e53935; }
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
