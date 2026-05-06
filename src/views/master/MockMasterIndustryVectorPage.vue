<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <div class="flex-1 overflow-auto">
      <div class="iv-master">
        <!-- ヘッダー -->
        <div class="iv-header">
          <i class="fa-solid fa-industry iv-header-icon"></i>
          <span class="iv-header-label">業種マスタ（全社共通）</span>
          <span class="iv-header-count">{{ entries.length }}件</span>
          <button class="iv-add-btn" @click="addEntry">
            <i class="fa-solid fa-plus"></i> 追加
          </button>
        </div>

        <!-- 法人/個人 切替タブ -->
        <div class="iv-type-tabs">
          <button
            class="iv-type-tab"
            :class="{ active: businessType === 'corporate' }"
            @click="businessType = 'corporate'"
          >
            <i class="fa-solid fa-building"></i> 法人
          </button>
          <button
            class="iv-type-tab"
            :class="{ active: businessType === 'sole' }"
            @click="businessType = 'sole'"
          >
            <i class="fa-solid fa-user"></i> 個人事業主
          </button>
        </div>

        <!-- 検索・フィルタ -->
        <div class="iv-filters">
          <div class="iv-search-group">
            <i class="fa-solid fa-magnifying-glass iv-search-icon"></i>
            <input
              v-model="searchQuery"
              type="text"
              class="iv-search-input"
              placeholder="業種名・業種ID・科目名で検索..."
            />
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

                <!-- 業種ID（編集可能テキスト） -->
                <td class="iv-td">
                  <input v-model="row.vector" class="iv-edit-text iv-edit-mono" />
                </td>

                <!-- 業種名 -->
                <td class="iv-td iv-td-label">
                  <span class="iv-label-text">{{ vectorLabel(row.vector) }}</span>
                  <span v-if="row.deprecated" class="iv-deprecated-badge">非推奨</span>
                </td>

                <!-- カテゴリ -->
                <td class="iv-td iv-td-category">
                  <span class="iv-category-badge" :style="{ background: findCategory(row.vector).color }">{{ findCategory(row.vector).icon }} {{ findCategory(row.vector).label }}</span>
                </td>

                <!-- 出金時の科目候補（編集可能） -->
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

                <!-- 入金時の科目候補（編集可能） -->
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

                <!-- 確定度 -->
                <td class="iv-td iv-td-level">
                  <span v-if="row.expense.length === 1" class="iv-level-badge a">A確定</span>
                  <span v-else-if="row.expense.length === 0" class="iv-level-badge none">—</span>
                  <span v-else class="iv-level-badge b">候補{{ row.expense.length }}件</span>
                </td>

                <!-- 削除 -->
                <td class="iv-td iv-td-delete">
                  <i class="fa-solid fa-trash-can iv-delete-icon" @click="confirmDelete(idx)"></i>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- フッター統計 -->
        <div class="iv-footer">
          <span class="iv-footer-stat">
            全 {{ entries.length }} 業種 ·
            A確定（科目1件）: {{ aCount }}件 ·
            候補複数: {{ bCount }}件 ·
            未設定: {{ noneCount }}件
          </span>
          <span v-if="businessType === 'corporate'" class="iv-footer-note">
            法人用辞書（INDUSTRY_VECTOR_CORPORATE）
          </span>
          <span v-else class="iv-footer-note">
            個人事業主用辞書（INDUSTRY_VECTOR_SOLE）
          </span>
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
import { ref, computed, watch, onMounted, onActivated } from 'vue';
import { VENDOR_VECTOR_LABELS } from '@/types/pipeline/vendor.type';
import type { VendorVector, IndustryVectorEntry } from '@/types/pipeline/vendor.type';
import { ACCOUNT_MASTER } from '@/data/master/account-master';
import { useColumnResize } from '@/composables/useColumnResize';

// 列幅カスタマイズ
const ivDefaultWidths: Record<string, number> = {
  vector: 120,
  label: 140,
  category: 80,
  level: 80,
};
const { columnWidths: ivColWidths, onResizeStart: onIvResizeStart } = useColumnResize('master-industry-vector', ivDefaultWidths);

// ============================================================
// 事業形態切替 + 編集用データ（API経由で取得）
// ============================================================
const businessType = ref<'corporate' | 'sole'>('corporate');

/** 編集用の行データ型 */
interface EditableEntry {
  vector: string;
  expense: string[];
  income: string[];
  deprecated: boolean;
}

/** APIレスポンスを編集用に変換 */
function toEditable(source: IndustryVectorEntry[]): EditableEntry[] {
  return source.map(e => ({
    vector: e.vector,
    expense: [...e.expense],
    income: [...e.income],
    deprecated: e.vector === 'telecom_saas',
  }));
}

const corporateEntries = ref<EditableEntry[]>([]);
const soleEntries = ref<EditableEntry[]>([]);

const entries = computed(() =>
  businessType.value === 'corporate' ? corporateEntries.value : soleEntries.value
);

/** APIから業種ベクトルを取得 */
const isLoading = ref(true);

async function fetchEntries(type: 'corporate' | 'sole'): Promise<EditableEntry[]> {
  try {
    const res = await fetch(`/api/industry-vectors?type=${type}`);
    if (res.ok) {
      const data = await res.json() as { entries: IndustryVectorEntry[] };
      return toEditable(data.entries);
    }
  } catch (e) {
    console.error(`[IndustryVectorPage] ${type}取得失敗:`, e);
  }
  return [];
}

onMounted(async () => {
  isLoading.value = true;
  try {
    corporateEntries.value = await fetchEntries('corporate');
    soleEntries.value = await fetchEntries('sole');
  } finally {
    isLoading.value = false;
  }
});

// KeepAliveからの復帰時にデータを再取得
onActivated(async () => {
  isLoading.value = true;
  try {
    corporateEntries.value = await fetchEntries('corporate');
    soleEntries.value = await fetchEntries('sole');
  } finally {
    isLoading.value = false;
  }
});

// ============================================================
// カテゴリ定義
// ============================================================
interface CategoryDef {
  key: string;
  label: string;
  icon: string;
  color: string;
  vectors: string[];
}

const CATEGORIES: CategoryDef[] = [
  { key: 'food',      label: '飲食',         icon: '🍽️', color: '#fff3e0', vectors: ['restaurant', 'cafe'] },
  { key: 'retail',    label: '小売',         icon: '🛒', color: '#e8f5e9', vectors: ['food_market', 'supermarket', 'convenience_store', 'general_goods', 'souvenir', 'drugstore', 'apparel', 'cosmetics', 'books', 'electronics', 'bicycle', 'sports_goods', 'media_disc', 'jewelry', 'florist', 'auto_dealer', 'auto_parts', 'building_materials', 'stationery'] },
  { key: 'service',   label: 'サービス',     icon: '🔧', color: '#e3f2fd', vectors: ['beauty', 'printing', 'advertising', 'post_office', 'waste', 'it_service', 'telecom_saas', 'telecom', 'saas', 'education', 'outsourcing', 'lease_rental', 'staffing', 'camera_dpe', 'funeral', 'platform', 'ec_site', 'logistics', 'consulting', 'legal_firm', 'construction'] },
  { key: 'realestate',label: '不動産・保険', icon: '🏢', color: '#fce4ec', vectors: ['real_estate', 'insurance'] },
  { key: 'sports',    label: 'スポーツ・娯楽',icon: '🎾', color: '#f3e5f5', vectors: ['entertainment', 'leisure', 'cinema_music', 'spa', 'travel_agency'] },
  { key: 'transport', label: '交通機関',     icon: '🚃', color: '#e0f7fa', vectors: ['gas_station', 'taxi', 'rental_car', 'train', 'bus', 'highway', 'airline_ship', 'parking', 'hotel'] },
  { key: 'public',    label: '公共機関',     icon: '🏛️', color: '#fff9c4', vectors: ['utility', 'government', 'social_insurance', 'medical', 'religious'] },
  { key: 'finance',   label: '金融',         icon: '💰', color: '#e8eaf6', vectors: ['financial'] },
  { key: 'other',     label: 'その他',       icon: '👤', color: '#f5f5f5', vectors: ['individual', 'wholesale', 'association', 'unknown'] },
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

function accountName(id: string): string {
  return accountMap.get(id) ?? id;
}

function vectorLabel(v: string): string {
  return VENDOR_VECTOR_LABELS[v as VendorVector] ?? v;
}

// ============================================================
// 科目の追加・削除
// ============================================================
function addAccount(arr: string[], event: Event) {
  const select = event.target as HTMLSelectElement;
  const val = select.value;
  if (val && !arr.includes(val)) {
    arr.push(val);
  }
  select.value = '';
}

function removeAccount(arr: string[], index: number) {
  arr.splice(index, 1);
}

// ============================================================
// 新規追加
// ============================================================
function addEntry() {
  const target = businessType.value === 'corporate' ? corporateEntries : soleEntries;
  target.value.unshift({
    vector: 'new_vector',
    expense: [],
    income: [],
    deprecated: false,
  });
}

// ============================================================
// 削除
// ============================================================
const deleteTargetIdx = ref<number | null>(null);

function confirmDelete(idx: number) {
  deleteTargetIdx.value = idx;
}

function executeDelete() {
  if (deleteTargetIdx.value === null) return;
  const target = businessType.value === 'corporate' ? corporateEntries : soleEntries;
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
  CATEGORIES.map(c => ({
    ...c,
    count: entries.value.filter(r => findCategory(r.vector).key === c.key).length,
  })).filter(c => c.count > 0)
);

/** ソート用の値取得 */
function getSortValue(row: EditableEntry, key: SortableKey): string {
  switch (key) {
    case 'vector': return row.vector;
    case 'label': return vectorLabel(row.vector);
    case 'category': return findCategory(row.vector).label;
    case 'expense': return row.expense.map(id => accountName(id)).join(',');
    case 'income': return row.income.map(id => accountName(id)).join(',');
    case 'level':
      // A確定(1件) < 候補N件 < 未設定(0件) の順
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
      r.vector.toLowerCase().includes(q) ||
      vectorLabel(r.vector).toLowerCase().includes(q) ||
      r.expense.some(id => accountName(id).includes(q)) ||
      r.income.some(id => accountName(id).includes(q))
    );
  }

  if (categoryFilter.value) {
    rows = rows.filter(r => findCategory(r.vector).key === categoryFilter.value);
  }

  if (sortKey.value) {
    const key = sortKey.value;
    const asc = sortAsc.value;
    rows.sort((a, b) => {
      const va = getSortValue(a, key);
      const vb = getSortValue(b, key);
      return asc ? va.localeCompare(vb, 'ja') : vb.localeCompare(va, 'ja');
    });
  }

  return rows;
});

// ============================================================
// 統計
// ============================================================
const aCount = computed(() => entries.value.filter(r => r.expense.length === 1).length);
const bCount = computed(() => entries.value.filter(r => r.expense.length > 1).length);
const noneCount = computed(() => entries.value.filter(r => r.expense.length === 0).length);

// フィルタ変更時にカテゴリリセット
watch(businessType, () => {
  categoryFilter.value = '';
  searchQuery.value = '';
});
</script>

<style>
@import '@/styles/master-industry-vector.css';
</style>
