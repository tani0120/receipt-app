<template>
  <div class="lve-page">
    <!-- ヘッダー -->
    <div class="lve-header">
      <div class="lve-header-left">
        <button class="lve-back-btn" @click="goBack">
          <i class="fa-solid fa-arrow-left"></i> 一覧の設定に戻る
        </button>
        <h1 class="lve-title">一覧の編集: {{ viewName }}</h1>
      </div>
      <button class="lve-save-btn" @click="save">
        <i class="fa-solid fa-save"></i> 保存
      </button>
    </div>

    <!-- 一覧名 -->
    <div class="lve-section">
      <label class="lve-label">一覧名</label>
      <input v-model="viewName" class="lve-input" placeholder="一覧名を入力" />
    </div>

    <!-- 表示するフィールドと列の順序 -->
    <div class="lve-section">
      <h2 class="lve-section-title">表示するフィールドと列の順序</h2>
      <div class="lve-dual-list">
        <!-- 左: 利用可能なフィールド -->
        <div class="lve-list-panel">
          <div class="lve-list-header">
            <span>利用可能なフィールド</span>
            <span class="lve-list-count">{{ availableFields.length }}</span>
          </div>
          <input v-model="searchQuery" class="lve-search" placeholder="検索..." />
          <div class="lve-field-list" ref="availableListRef">
            <div
              v-for="field in filteredAvailable"
              :key="field.key"
              class="lve-field-item"
              @click="addField(field.key)"
            >
              <span>{{ field.label }}</span>
              <i class="fa-solid fa-chevron-right lve-add-icon"></i>
            </div>
            <div v-if="filteredAvailable.length === 0" class="lve-empty">
              該当なし
            </div>
          </div>
          <button class="lve-bulk-btn" @click="addAll">すべて追加 &gt;&gt;</button>
        </div>

        <!-- 右: 選択済み（D&D） -->
        <div class="lve-list-panel lve-selected-panel">
          <div class="lve-list-header">
            <span>選択済み（ドラッグで並替）</span>
            <span class="lve-list-count">{{ selectedColumns.length }}</span>
          </div>
          <VueDraggable
            v-model="selectedColumnsList"
            class="lve-field-list lve-selected-list"
            handle=".lve-drag-handle"
            :animation="200"
            ghost-class="lve-ghost"
            @update:model-value="onSelectedReorder"
          >
            <div
              v-for="col in selectedColumnsList"
              :key="col.key"
              class="lve-field-item lve-selected-item"
            >
              <i class="fa-solid fa-grip-vertical lve-drag-handle"></i>
              <span>{{ col.label }}</span>
              <button class="lve-remove-btn" @click="removeField(col.key)" title="削除">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </VueDraggable>
          <div v-if="selectedColumns.length === 0" class="lve-empty">
            フィールドを追加してください
          </div>
          <button class="lve-bulk-btn danger" @click="removeAll">&lt;&lt; すべて戻す</button>
        </div>
      </div>
    </div>

    <!-- 絞り込み条件 -->
    <div class="lve-section">
      <h2 class="lve-section-title">レコードの絞り込み条件</h2>
      <div v-for="(cond, idx) in filterConditions" :key="idx" class="lve-filter-row">
        <select v-model="cond.field" class="lve-select">
          <option value="">フィールド</option>
          <option v-for="f in allFieldOptions" :key="f.key" :value="f.key">{{ f.label }}</option>
        </select>
        <select v-model="cond.operator" class="lve-select lve-select-sm">
          <option value="contains">含む</option>
          <option value="eq">等しい</option>
          <option value="neq">等しくない</option>
          <option value="in">いずれか</option>
          <option value="is_empty">空</option>
          <option value="is_not_empty">空でない</option>
        </select>
        <input v-model="cond.value" class="lve-input lve-input-sm" placeholder="値" />
        <button class="lve-icon-btn danger" @click="filterConditions.splice(idx, 1)">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
      <button class="lve-add-cond-btn" @click="addFilterCondition">
        <i class="fa-solid fa-plus"></i> 条件を追加
      </button>
      <div class="lve-logic-row" v-if="filterConditions.length > 1">
        <label><input type="radio" v-model="filterLogic" value="and" /> すべての条件に一致</label>
        <label><input type="radio" v-model="filterLogic" value="or" /> いずれかの条件に一致</label>
      </div>
    </div>

    <!-- 表示順 -->
    <div class="lve-section">
      <h2 class="lve-section-title">レコードの表示順</h2>
      <div v-for="(sort, idx) in sortSettings" :key="idx" class="lve-filter-row">
        <select v-model="sort.key" class="lve-select">
          <option value="">フィールド</option>
          <option v-for="f in allFieldOptions" :key="f.key" :value="f.key">{{ f.label }}</option>
        </select>
        <select v-model="sort.order" class="lve-select lve-select-sm">
          <option value="asc">昇順</option>
          <option value="desc">降順</option>
        </select>
        <button class="lve-icon-btn danger" @click="sortSettings.splice(idx, 1)">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
      <button class="lve-add-cond-btn" @click="addSortSetting" :disabled="sortSettings.length >= 5">
        <i class="fa-solid fa-plus"></i> ソートを追加
      </button>
    </div>

    <!-- アクション -->
    <div class="lve-actions">
      <button class="lve-cancel-btn" @click="goBack">キャンセル</button>
      <button class="lve-save-btn" @click="save">
        <i class="fa-solid fa-save"></i> 保存
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { ListViewDef, FilterCondition, SortSetting } from '@/components/list-view/types';
import { useFieldLayout } from '@/composables/useFieldLayout';
import { clientSections, clientFieldsFlat } from '@/constants/clientFieldDefs';
import { leadSections, leadFields as leadFieldsFlat } from '@/constants/leadFieldDefs';
import { progressSections, progressFieldsFlat } from '@/constants/progressFieldDefs';
import { VueDraggable } from 'vue-draggable-plus';

const route = useRoute();
const router = useRouter();

/** エンティティタイプとビューキーをルートから取得 */
const entityType = computed(() => {
  if (route.path.includes('/progress/')) return 'progress';
  if (route.path.includes('/leads/')) return 'lead';
  return 'client';
});
const viewKey = computed(() => route.params.viewKey as string);

/** フィールドレイアウト（全列情報取得用） */
const fieldLayout = computed(() => {
  if (entityType.value === 'progress') {
    return useFieldLayout('progress', progressSections, progressFieldsFlat);
  }
  if (entityType.value === 'lead') {
    return useFieldLayout('lead', leadSections, leadFieldsFlat);
  }
  return useFieldLayout('client', clientSections, clientFieldsFlat);
});

/** 一覧テーブルで表示不可のコンポーネント種別 */
const NON_LIST_COMPONENTS = ['heading', 'spacer', 'contactTable', 'table'];

/** 全フィールド一覧（表示可能なもののみ） */
const allFieldOptions = computed(() => {
  return fieldLayout.value.fields.value
    .filter(f => !NON_LIST_COMPONENTS.includes(f.component))
    .filter(f => !f.isDeleted)
    .map(f => ({ key: f.key, label: f.label }));
});

/** 編集対象データ */
const viewName = ref('');
const selectedColumnKeys = ref<string[]>([]);
const filterConditions = ref<{ field: string; operator: string; value: string | string[] }[]>([]);
const filterLogic = ref<'and' | 'or'>('and');
const sortSettings = ref<{ key: string; order: 'asc' | 'desc' }[]>([]);
const searchQuery = ref('');

/** 全ビュー */
const allViews = ref<ListViewDef[]>([]);

/** D&D用オブジェクト配列（VueDraggableのv-model用） */
const selectedColumnsList = ref<{ key: string; label: string }[]>([]);

/** 選択済み列（ラベル付き）- 読み取り専用 */
const selectedColumns = computed(() => selectedColumnsList.value);

/** D&D並替時にkeysを同期 */
const onSelectedReorder = (newList: { key: string; label: string }[]) => {
  selectedColumnKeys.value = newList.map(c => c.key);
};

/** selectedColumnKeysからselectedColumnsListを再構築 */
const rebuildSelectedList = () => {
  selectedColumnsList.value = selectedColumnKeys.value.map(key => {
    const f = allFieldOptions.value.find(af => af.key === key);
    return f ?? { key, label: key };
  });
};

/** 利用可能フィールド（選択済みを除外） */
const availableFields = computed(() => {
  const selectedSet = new Set(selectedColumnKeys.value);
  return allFieldOptions.value.filter(f => !selectedSet.has(f.key));
});

/** 検索フィルタ済み利用可能フィールド */
const filteredAvailable = computed(() => {
  if (!searchQuery.value) return availableFields.value;
  const q = searchQuery.value.toLowerCase();
  return availableFields.value.filter(f =>
    f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q)
  );
});

/** API: ビュー一覧取得 */
const loadViews = async () => {
  try {
    const res = await fetch(`/api/list-views/${entityType.value}`);
    const data = await res.json();
    allViews.value = data.views ?? [];

    // 対象ビューを探す
    const target = allViews.value.find(v => v.key === viewKey.value);
    if (target) {
      viewName.value = target.name;
      selectedColumnKeys.value = target.columns ? [...target.columns] : [];
      filterConditions.value = target.defaultFilters?.map(f => ({ ...f })) ?? [];
      sortSettings.value = target.defaultSorts?.map(s => ({ ...s })) ?? [];
      rebuildSelectedList();
    }
  } catch (e) {
    console.error('[ListViewEdit] ビュー取得失敗:', e);
  }
};

/** 保存 */
const save = async () => {
  const idx = allViews.value.findIndex(v => v.key === viewKey.value);
  if (idx === -1) return;

  const existing = allViews.value[idx];
  if (!existing) return;

  allViews.value[idx] = {
    key: existing.key,
    name: viewName.value,
    columns: selectedColumnKeys.value.length > 0 ? [...selectedColumnKeys.value] : null,
    defaultFilters: filterConditions.value.filter(c => c.field) as FilterCondition[],
    defaultSorts: sortSettings.value.filter(s => s.key) as SortSetting[],
  };

  try {
    await fetch(`/api/list-views/${entityType.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ views: allViews.value }),
    });
    goBack();
  } catch (e) {
    console.error('[ListViewEdit] 保存失敗:', e);
  }
};

/** フィールド操作 */
const addField = (key: string) => {
  if (!selectedColumnKeys.value.includes(key)) {
    selectedColumnKeys.value.push(key);
    rebuildSelectedList();
  }
};
const removeField = (key: string) => {
  selectedColumnKeys.value = selectedColumnKeys.value.filter(k => k !== key);
  rebuildSelectedList();
};
const addAll = () => {
  const available = availableFields.value.map(f => f.key);
  selectedColumnKeys.value.push(...available);
  rebuildSelectedList();
};
const removeAll = () => {
  selectedColumnKeys.value = [];
  rebuildSelectedList();
};

/** フィルタ・ソート操作 */
const addFilterCondition = () => {
  filterConditions.value.push({ field: '', operator: 'contains', value: '' });
};
const addSortSetting = () => {
  if (sortSettings.value.length < 5) {
    sortSettings.value.push({ key: '', order: 'asc' });
  }
};

const goBack = () => {
  const nameMap: Record<string, string> = { progress: 'ProgressViewSettings', lead: 'LeadViewSettings', client: 'ClientViewSettings' };
  router.push({ name: nameMap[entityType.value] ?? 'ClientViewSettings' });
};

onMounted(async () => {
  fieldLayout.value.loadLayout();
  await loadViews();
});
</script>

<style scoped>
.lve-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 24px;
  font-family: 'Inter', 'Hiragino Sans', sans-serif;
  height: 100vh;
  overflow-y: auto;
}

.lve-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
  position: sticky;
  top: 0;
  background: #fff;
  padding: 16px 0;
  z-index: 10;
  border-bottom: 1px solid #e2e8f0;
}

.lve-header-left {
  flex: 1;
}

.lve-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #4a7cf7;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 0;
  margin-bottom: 16px;
}
.lve-back-btn:hover {
  text-decoration: underline;
}

.lve-title {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

/* セクション */
.lve-section {
  margin-bottom: 32px;
}

.lve-section-title {
  font-size: 15px;
  font-weight: 700;
  color: #334155;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.lve-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}

.lve-input {
  width: 100%;
  max-width: 400px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
}
.lve-input:focus {
  border-color: #4a7cf7;
  box-shadow: 0 0 0 3px rgba(74,124,247,0.1);
}

/* デュアルリスト */
.lve-dual-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.lve-list-panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.lve-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.lve-list-count {
  font-size: 11px;
  color: #94a3b8;
  background: #e2e8f0;
  padding: 1px 7px;
  border-radius: 10px;
}

.lve-search {
  margin: 8px;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}
.lve-search:focus {
  border-color: #4a7cf7;
}

.lve-field-list {
  flex: 1;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px 0;
}

.lve-field-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
  transition: background 0.1s;
}
.lve-field-item:hover {
  background: #f1f5f9;
}

.lve-add-icon {
  font-size: 10px;
  color: #94a3b8;
  opacity: 0;
  transition: opacity 0.15s;
}
.lve-field-item:hover .lve-add-icon {
  opacity: 1;
}

.lve-selected-item {
  gap: 8px;
}

.lve-drag-handle {
  color: #94a3b8;
  cursor: grab;
  font-size: 12px;
}
.lve-drag-handle:active {
  cursor: grabbing;
}

.lve-remove-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 12px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.15s;
}
.lve-remove-btn:hover {
  color: #dc2626;
  background: #fef2f2;
}

.lve-bulk-btn {
  display: block;
  width: 100%;
  padding: 8px;
  background: #f1f5f9;
  border: none;
  border-top: 1px solid #e2e8f0;
  color: #4a7cf7;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.lve-bulk-btn:hover {
  background: #e2e8f0;
}
.lve-bulk-btn.danger {
  color: #dc2626;
}

.lve-empty {
  padding: 24px 14px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

/* フィルタ/ソート行 */
.lve-filter-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.lve-select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  min-width: 160px;
  outline: none;
}
.lve-select:focus {
  border-color: #4a7cf7;
}
.lve-select-sm {
  min-width: 120px;
}

.lve-input-sm {
  max-width: 200px;
}

.lve-icon-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid transparent;
  border-radius: 6px;
  color: #94a3b8;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}
.lve-icon-btn:hover {
  background: #f1f5f9;
  color: #475569;
}
.lve-icon-btn.danger:hover {
  background: #fef2f2;
  color: #dc2626;
}

.lve-add-cond-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: none;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.lve-add-cond-btn:hover {
  border-color: #4a7cf7;
  color: #4a7cf7;
}
.lve-add-cond-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.lve-logic-row {
  display: flex;
  gap: 20px;
  margin-top: 8px;
  font-size: 13px;
  color: #475569;
}
.lve-logic-row label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

/* アクション */
.lve-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.lve-cancel-btn {
  padding: 10px 24px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.lve-cancel-btn:hover {
  background: #e2e8f0;
}

.lve-save-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: #4a7cf7;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.lve-save-btn:hover {
  background: #3b6ce6;
}

/* SortableJSゴースト */
.lve-ghost {
  opacity: 0.4;
  background: #eff6ff;
}
</style>
