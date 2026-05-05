<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <div class="flex-1 overflow-auto">
      <div class="iv-master">
        <!-- ヘッダー -->
        <div class="iv-header">
          <i class="fa-solid fa-industry iv-header-icon"></i>
          <span class="iv-header-label">業種マスタ（{{ clientLabel }}）</span>
          <span class="iv-header-type-badge" :class="isCorporate ? 'corp' : 'sole'">
            <i :class="isCorporate ? 'fa-solid fa-building' : 'fa-solid fa-user'"></i>
            {{ isCorporate ? '法人' : '個人事業主' }}
          </span>
          <span class="iv-header-count">{{ entries.length }}件</span>
          <button class="iv-add-btn" @click="addEntry">
            <i class="fa-solid fa-plus"></i> 追加
          </button>
        </div>

        <!-- 検索・フィルタ -->
        <div class="iv-filters">
          <div class="iv-search-group">
            <i class="fa-solid fa-magnifying-glass iv-search-icon"></i>
            <input v-model="searchQuery" type="text" class="iv-search-input" placeholder="業種名・業種ID・科目名で検索..." />
          </div>
          <div class="iv-filter-group">
            <label class="iv-filter-label">カテゴリ:</label>
            <select v-model="categoryFilter" class="iv-filter-select">
              <option value="">全て</option>
              <option v-for="c in categories" :key="c.key" :value="c.key">{{ c.icon }} {{ c.label }}（{{ c.count }}）</option>
            </select>
          </div>
        </div>

        <!-- テーブル -->
        <div class="iv-table-wrap">
          <table class="iv-table">
            <colgroup>
              <col style="width: 40px;">
              <col :style="{ width: ivColWidths['vector'] + 'px' }">
              <col :style="{ width: ivColWidths['label'] + 'px' }">
              <col :style="{ width: ivColWidths['category'] + 'px' }">
              <col style="width: auto;">
              <col style="width: auto;">
              <col :style="{ width: ivColWidths['level'] + 'px' }">
              <col style="width: 36px;">
            </colgroup>
            <thead>
              <tr>
                <th class="iv-th">#</th>
                <th class="iv-th sortable relative" @click="sortBy('vector')">業種ID <i :class="getSortIcon('vector')"></i>
                  <div class="resize-handle" @mousedown.stop="onIvResizeStart('vector', $event)"></div>
                </th>
                <th class="iv-th sortable relative" @click="sortBy('label')">業種名 <i :class="getSortIcon('label')"></i>
                  <div class="resize-handle" @mousedown.stop="onIvResizeStart('label', $event)"></div>
                </th>
                <th class="iv-th sortable relative" @click="sortBy('category')">カテゴリ <i :class="getSortIcon('category')"></i>
                  <div class="resize-handle" @mousedown.stop="onIvResizeStart('category', $event)"></div>
                </th>
                <th class="iv-th sortable" @click="sortBy('expense')">出金時の科目候補 <i :class="getSortIcon('expense')"></i></th>
                <th class="iv-th sortable" @click="sortBy('income')">入金時の科目候補 <i :class="getSortIcon('income')"></i></th>
                <th class="iv-th sortable relative" @click="sortBy('level')">確定度 <i :class="getSortIcon('level')"></i>
                  <div class="resize-handle" @mousedown.stop="onIvResizeStart('level', $event)"></div>
                </th>
                <th class="iv-th"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in filteredRows" :key="row.vector + '-' + idx" class="iv-row" :class="{ deprecated: row.deprecated }">
                <td class="iv-td iv-td-num">{{ idx + 1 }}</td>
                <td class="iv-td"><input v-model="row.vector" class="iv-edit-text iv-edit-mono" /></td>
                <td class="iv-td iv-td-label">
                  <span class="iv-label-text">{{ vectorLabel(row.vector) }}</span>
                  <span v-if="row.deprecated" class="iv-deprecated-badge">非推奨</span>
                </td>
                <td class="iv-td iv-td-category">
                  <span class="iv-category-badge" :style="{ background: findCategory(row.vector).color }">{{ findCategory(row.vector).icon }} {{ findCategory(row.vector).label }}</span>
                </td>
                <td class="iv-td">
                  <div class="iv-accounts-edit">
                    <span v-for="(accId, ai) in row.expense" :key="ai" class="iv-account-chip-edit expense">
                      {{ accountName(accId) }}
                      <i class="fa-solid fa-xmark iv-chip-remove" @click="removeAccount(row.expense, ai)"></i>
                    </span>
                    <select class="iv-add-account-select" @change="addAccount(row.expense, $event)">
                      <option value="">＋追加</option>
                      <option v-for="acc in accountOptions" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
                    </select>
                  </div>
                </td>
                <td class="iv-td">
                  <div class="iv-accounts-edit">
                    <span v-for="(accId, ai) in row.income" :key="ai" class="iv-account-chip-edit income">
                      {{ accountName(accId) }}
                      <i class="fa-solid fa-xmark iv-chip-remove" @click="removeAccount(row.income, ai)"></i>
                    </span>
                    <select class="iv-add-account-select" @change="addAccount(row.income, $event)">
                      <option value="">＋追加</option>
                      <option v-for="acc in accountOptions" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
                    </select>
                  </div>
                </td>
                <td class="iv-td iv-td-level">
                  <span v-if="row.expense.length === 1" class="iv-level-badge a">A確定</span>
                  <span v-else-if="row.expense.length === 0" class="iv-level-badge none">—</span>
                  <span v-else class="iv-level-badge b">候補{{ row.expense.length }}件</span>
                </td>
                <td class="iv-td iv-td-delete">
                  <i class="fa-solid fa-trash-can iv-delete-icon" @click="confirmDelete(idx)"></i>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- フッター -->
        <div class="iv-footer">
          <span class="iv-footer-stat">
            全 {{ entries.length }} 業種 ·
            A確定: {{ aCount }}件 · 候補複数: {{ bCount }}件 · 未設定: {{ noneCount }}件
          </span>
          <span class="iv-footer-note">{{ isCorporate ? '法人用辞書' : '個人事業主用辞書' }}（{{ clientId }}）</span>
        </div>
      </div>
    </div>

    <!-- 削除確認モーダル -->
    <div v-if="deleteTargetIdx !== null" class="iv-modal-overlay" @click.self="deleteTargetIdx = null">
      <div class="iv-modal">
        <div class="iv-modal-title">削除しますか？</div>
        <div class="iv-modal-body">
          「{{ deleteTargetIdx !== null ? entries[deleteTargetIdx]?.vector : '' }}」を削除します。この操作は取り消せません。
        </div>
        <div class="iv-modal-actions">
          <button class="iv-modal-btn iv-modal-btn-no" @click="deleteTargetIdx = null">いいえ</button>
          <button class="iv-modal-btn iv-modal-btn-yes" @click="executeDelete">はい</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { VENDOR_VECTOR_LABELS } from '@/types/pipeline/vendor.type';
import type { VendorVector, IndustryVectorEntry } from '@/types/pipeline/vendor.type';
import { ACCOUNT_MASTER } from '@/shared/data/account-master';
import { useColumnResize } from '@/composables/useColumnResize';
import { useClients } from '@/features/client-management/composables/useClients';

// ============================================================
// 顧問先情報から法人/個人を判定
// ============================================================
const route = useRoute();
const clientId = computed(() => (route.params.clientId as string) ?? '');
const { currentClient } = useClients();

const isCorporate = computed(() => currentClient.value?.type !== 'individual');
const clientLabel = computed(() => currentClient.value?.companyName ?? clientId.value);

// ============================================================
// 列幅カスタマイズ
// ============================================================
const ivDefaultWidths: Record<string, number> = { vector: 120, label: 140, category: 80, level: 80 };
const { columnWidths: ivColWidths, onResizeStart: onIvResizeStart } = useColumnResize('client-industry-vector', ivDefaultWidths);

// ============================================================
// 編集用データ（API経由で取得）
// ============================================================
interface EditableEntry { vector: string; expense: string[]; income: string[]; deprecated: boolean; }

function toEditable(source: IndustryVectorEntry[]): EditableEntry[] {
  return source.map(e => ({ vector: e.vector, expense: [...e.expense], income: [...e.income], deprecated: e.vector === 'telecom_saas' }));
}

const entries = computed(() =>
  isCorporate.value ? corporateEntries.value : soleEntries.value
);
const corporateEntries = ref<EditableEntry[]>([]);
const soleEntries = ref<EditableEntry[]>([]);

onMounted(async () => {
  try {
    const [corpRes, soleRes] = await Promise.all([
      fetch('/api/industry-vectors?type=corporate'),
      fetch('/api/industry-vectors?type=sole'),
    ]);
    if (corpRes.ok) {
      const data = await corpRes.json() as { entries: IndustryVectorEntry[] };
      corporateEntries.value = toEditable(data.entries);
    }
    if (soleRes.ok) {
      const data = await soleRes.json() as { entries: IndustryVectorEntry[] };
      soleEntries.value = toEditable(data.entries);
    }
  } catch (e) {
    console.error('[ClientIndustryVectorPage] API取得失敗:', e);
  }
});

// ============================================================
// カテゴリ定義
// ============================================================
interface CategoryDef { key: string; label: string; icon: string; color: string; vectors: string[]; }
const CATEGORIES: CategoryDef[] = [
  { key: 'food', label: '飲食', icon: '🍽️', color: '#fff3e0', vectors: ['restaurant', 'cafe'] },
  { key: 'retail', label: '小売', icon: '🛒', color: '#e8f5e9', vectors: ['food_market','supermarket','convenience_store','general_goods','souvenir','drugstore','apparel','cosmetics','books','electronics','bicycle','sports_goods','media_disc','jewelry','florist','auto_dealer','auto_parts','building_materials','stationery'] },
  { key: 'service', label: 'サービス', icon: '🔧', color: '#e3f2fd', vectors: ['beauty','printing','advertising','post_office','waste','it_service','telecom_saas','telecom','saas','education','outsourcing','lease_rental','staffing','camera_dpe','funeral','platform','ec_site','logistics','consulting','legal_firm','construction'] },
  { key: 'realestate', label: '不動産・保険', icon: '🏢', color: '#fce4ec', vectors: ['real_estate','insurance'] },
  { key: 'sports', label: 'スポーツ・娯楽', icon: '🎾', color: '#f3e5f5', vectors: ['entertainment','leisure','cinema_music','spa','travel_agency'] },
  { key: 'transport', label: '交通機関', icon: '🚃', color: '#e0f7fa', vectors: ['gas_station','taxi','rental_car','train','bus','highway','airline_ship','parking','hotel'] },
  { key: 'public', label: '公共機関', icon: '🏛️', color: '#fff9c4', vectors: ['utility','government','social_insurance','medical','religious'] },
  { key: 'finance', label: '金融', icon: '💰', color: '#e8eaf6', vectors: ['financial'] },
  { key: 'other', label: 'その他', icon: '👤', color: '#f5f5f5', vectors: ['individual','wholesale','association','unknown'] },
];
const defaultCategory = CATEGORIES[CATEGORIES.length - 1]!;
function findCategory(vector: string): CategoryDef {
  return CATEGORIES.find(c => c.vectors.includes(vector)) ?? defaultCategory;
}

// ============================================================
// 科目
// ============================================================
const accountMap = new Map(ACCOUNT_MASTER.map(a => [a.id, a.name]));
const accountOptions = computed(() => ACCOUNT_MASTER.map(a => ({ id: a.id, name: a.name })));
function accountName(id: string): string { return accountMap.get(id) ?? id; }
function vectorLabel(v: string): string { return VENDOR_VECTOR_LABELS[v as VendorVector] ?? v; }

function addAccount(arr: string[], event: Event) {
  const select = event.target as HTMLSelectElement;
  if (select.value && !arr.includes(select.value)) arr.push(select.value);
  select.value = '';
}
function removeAccount(arr: string[], index: number) { arr.splice(index, 1); }

// ============================================================
// 追加・削除
// ============================================================
function addEntry() {
  const target = isCorporate.value ? corporateEntries : soleEntries;
  target.value.unshift({ vector: 'new_vector', expense: [], income: [], deprecated: false });
}
const deleteTargetIdx = ref<number | null>(null);
function confirmDelete(idx: number) { deleteTargetIdx.value = idx; }
function executeDelete() {
  if (deleteTargetIdx.value === null) return;
  const target = isCorporate.value ? corporateEntries : soleEntries;
  target.value.splice(deleteTargetIdx.value, 1);
  deleteTargetIdx.value = null;
}

// ============================================================
// 検索・フィルタ・ソート
// ============================================================
type SortableKey = 'vector' | 'label' | 'category' | 'expense' | 'income' | 'level';
const searchQuery = ref('');
const categoryFilter = ref('');
const sortKey = ref<SortableKey | ''>('');
const sortAsc = ref(true);

function sortBy(key: SortableKey) {
  if (sortKey.value === key) { sortAsc.value = !sortAsc.value; }
  else { sortKey.value = key; sortAsc.value = true; }
}
function getSortIcon(key: string) {
  if (sortKey.value !== key) return 'fa-solid fa-sort sort-icon inactive';
  return sortAsc.value ? 'fa-solid fa-sort-up sort-icon' : 'fa-solid fa-sort-down sort-icon';
}

const categories = computed(() =>
  CATEGORIES.map(c => ({ ...c, count: entries.value.filter(r => findCategory(r.vector).key === c.key).length })).filter(c => c.count > 0)
);

function getSortValue(row: EditableEntry, key: SortableKey): string {
  switch (key) {
    case 'vector': return row.vector;
    case 'label': return vectorLabel(row.vector);
    case 'category': return findCategory(row.vector).label;
    case 'expense': return row.expense.map(id => accountName(id)).join(',');
    case 'income': return row.income.map(id => accountName(id)).join(',');
    case 'level':
      if (row.expense.length === 1) return '0_A';
      if (row.expense.length > 1) return `1_${String(row.expense.length).padStart(3, '0')}`;
      return '2_none';
  }
}

const filteredRows = computed(() => {
  let rows = [...entries.value];
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    rows = rows.filter(r =>
      r.vector.toLowerCase().includes(q) || vectorLabel(r.vector).toLowerCase().includes(q) ||
      r.expense.some(id => accountName(id).includes(q)) || r.income.some(id => accountName(id).includes(q))
    );
  }
  if (categoryFilter.value) rows = rows.filter(r => findCategory(r.vector).key === categoryFilter.value);
  if (sortKey.value) {
    const key = sortKey.value; const asc = sortAsc.value;
    rows.sort((a, b) => { const va = getSortValue(a, key); const vb = getSortValue(b, key); return asc ? va.localeCompare(vb, 'ja') : vb.localeCompare(va, 'ja'); });
  }
  return rows;
});

const aCount = computed(() => entries.value.filter(r => r.expense.length === 1).length);
const bCount = computed(() => entries.value.filter(r => r.expense.length > 1).length);
const noneCount = computed(() => entries.value.filter(r => r.expense.length === 0).length);
</script>

<style scoped>
.iv-master { height: 100%; display: flex; flex-direction: column; font-size: 12px; color: #333; background: #fff; padding: 0 16px; overflow: auto; }
.iv-header { display: flex; align-items: center; gap: 10px; padding: 12px 0 8px; }
.iv-header-icon { color: #1976D2; font-size: 16px; }
.iv-header-label { color: #1976D2; font-weight: 700; font-size: 14px; }
.iv-header-count { color: #888; font-size: 12px; }
.iv-header-type-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; }
.iv-header-type-badge.corp { background: #e3f2fd; color: #1565c0; }
.iv-header-type-badge.sole { background: #fff3e0; color: #e65100; }
.iv-add-btn { margin-left: auto; padding: 5px 14px; background: #1976D2; color: #fff; border: none; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.iv-add-btn:hover { background: #1565C0; }
.iv-filters { display: flex; align-items: center; gap: 16px; padding: 8px 0; border-bottom: 1px solid #f0f0f0; flex-wrap: wrap; }
.iv-search-group { position: relative; flex: 1; min-width: 240px; max-width: 400px; }
.iv-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #999; font-size: 12px; }
.iv-search-input { width: 100%; padding: 6px 10px 6px 30px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px; outline: none; box-sizing: border-box; }
.iv-search-input:focus { border-color: #1976D2; box-shadow: 0 0 0 2px rgba(25,118,210,0.15); }
.iv-filter-group { display: flex; align-items: center; gap: 4px; }
.iv-filter-label { font-size: 11px; color: #555; font-weight: 600; }
.iv-filter-select { padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 11px; background: #fff; outline: none; cursor: pointer; }
.iv-filter-select:focus { border-color: #1976D2; }
.iv-table-wrap { overflow: auto; flex: 1; min-height: 0; }
.iv-table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 11px; border: 1px solid #d0d7de; }
.iv-table thead { background: #e3f2fd; position: sticky; top: 0; z-index: 1; }
.iv-th { padding: 6px 8px; text-align: center; font-weight: 600; color: #555; font-size: 11px; white-space: nowrap; border: 1px solid #d0d7de; overflow: hidden; }
.iv-th.sortable { cursor: pointer; user-select: none; }
.iv-th.sortable:hover { background: #d0e8fc; }
.sort-icon { font-size: 9px; margin-left: 2px; color: #1976D2; }
.sort-icon.inactive { color: #ccc; }
.iv-td { padding: 5px 8px; border: 1px solid #e0e0e0; color: #333; vertical-align: middle; overflow: hidden; }
.iv-row:hover { background: #f5f9ff; }
.iv-row.deprecated { opacity: 0.5; }
.iv-td-num { text-align: center; color: #999; font-size: 10px; width: 40px; }
.iv-td-label { font-weight: 600; font-size: 12px; }
.iv-label-text { margin-right: 6px; }
.iv-deprecated-badge { display: inline-block; padding: 1px 6px; background: #ffcdd2; color: #c62828; font-size: 9px; font-weight: 700; border-radius: 3px; }
.iv-edit-text { width: 100%; padding: 3px 4px; border: 1px solid transparent; border-radius: 2px; font-size: 11px; color: #333; background: transparent; outline: none; box-sizing: border-box; }
.iv-edit-text:hover { border-color: #ccc; }
.iv-edit-text:focus { border-color: #1976D2; background: #fff; box-shadow: 0 0 0 1px rgba(25,118,210,0.2); }
.iv-edit-mono { font-family: monospace; font-size: 10px; color: #666; }
.iv-td-category { text-align: center; }
.iv-category-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; color: #555; white-space: nowrap; }
.iv-accounts-edit { display: flex; flex-wrap: wrap; gap: 3px; align-items: center; }
.iv-account-chip-edit { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 500; white-space: nowrap; }
.iv-account-chip-edit.expense { background: #e3f2fd; color: #1565c0; }
.iv-account-chip-edit.income { background: #e8f5e9; color: #2e7d32; }
.iv-chip-remove { font-size: 8px; cursor: pointer; opacity: 0.5; transition: opacity 0.15s; }
.iv-chip-remove:hover { opacity: 1; color: #c62828; }
.iv-add-account-select { padding: 1px 4px; border: 1px dashed #ccc; border-radius: 3px; font-size: 9px; color: #999; background: transparent; cursor: pointer; outline: none; }
.iv-add-account-select:hover { border-color: #1976D2; color: #1976D2; }
.iv-td-level { text-align: center; }
.iv-level-badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; }
.iv-level-badge.a { background: #c8e6c9; color: #2e7d32; }
.iv-level-badge.b { background: #fff9c4; color: #f57f17; }
.iv-level-badge.none { color: #ccc; }
.iv-td-delete { text-align: center; }
.iv-delete-icon { color: #bbb; font-size: 12px; cursor: pointer; transition: color 0.15s; }
.iv-delete-icon:hover { color: #c62828; }
.iv-footer { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-top: 1px solid #e0e0e0; font-size: 11px; color: #888; }
.iv-footer-note { font-style: italic; font-size: 10px; color: #aaa; }
.relative { position: relative; }
.resize-handle { position: absolute; top: 0; right: 0; width: 4px; height: 100%; cursor: col-resize; background: transparent; transition: background 0.15s; z-index: 2; }
.resize-handle:hover { background: #1976D2; }
.iv-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.iv-modal { background: #fff; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); padding: 24px 28px; min-width: 340px; max-width: 440px; }
.iv-modal-title { font-size: 15px; font-weight: 700; color: #c62828; margin-bottom: 12px; }
.iv-modal-body { font-size: 13px; color: #555; margin-bottom: 20px; line-height: 1.5; }
.iv-modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
.iv-modal-btn { padding: 7px 20px; border: none; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; }
.iv-modal-btn-no { background: #e0e0e0; color: #555; }
.iv-modal-btn-no:hover { background: #ccc; }
.iv-modal-btn-yes { background: #c62828; color: #fff; }
.iv-modal-btn-yes:hover { background: #b71c1c; }
</style>
