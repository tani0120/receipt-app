<template>
  <div v-if="visible" class="cfm-overlay" @click.self="close">
    <div class="cfm-modal">
      <div class="cfm-header">
        <h3>フィールド管理</h3>
        <button class="cfm-close" @click="close">&times;</button>
      </div>

      <div class="cfm-body">
        <!-- 種別絞り込み + 文字検索 -->
        <div class="cfm-filter-row">
          <input v-model="searchText" type="text" class="cfm-search" placeholder="フィールド名で検索..." />
          <select v-model="filterType" class="cfm-select">
            <option value="">全種別</option>
            <option v-for="o in FIELD_COMPONENT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
          <span class="cfm-count">{{ filteredAllFields.length }}件</span>
        </div>

        <!-- 統一一覧 -->
        <table class="cfm-table">
          <thead>
            <tr>
              <th class="cfm-th-visible">表示</th>
              <th>表示ラベル</th>
              <th class="cfm-th-type">種別</th>
              <th class="cfm-th-status">状態</th>
              <th class="cfm-th-action">操作</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="item in filteredAllFields" :key="item.key">
              <tr
                :class="{
                  'cfm-row-hidden': localHidden.includes(item.key),
                  'cfm-row-deleted': localDeleted.includes(item.key),
                  'cfm-row-locked': !item.isCustom,
                  'cfm-row-clickable': true,
                }"
                @click="onRowClick(item.key, item.component)"
              >
                <td class="cfm-td-visible" @click.stop>
                  <input type="checkbox" :checked="!localHidden.includes(item.key)" :disabled="localDeleted.includes(item.key)" @change="toggleHidden(item.key, ($event.target as HTMLInputElement).checked)">
                </td>
                <td>
                  <input type="text" v-model="localLabels[item.key]" class="cfm-input" :placeholder="item.originalLabel" :disabled="localDeleted.includes(item.key)" @click.stop>
                </td>
                <td class="cfm-td-type">
                  <span class="cfm-type-badge" :class="'cfm-type-' + item.component">{{ getComponentLabel(item.component) }}</span>
                </td>
                <td class="cfm-td-status">
                  <span v-if="!item.isCustom" class="cfm-badge cfm-badge-lock" title="初期フィールド（削除不可）"><i class="fa-solid fa-lock"></i></span>
                  <span v-else-if="localDeleted.includes(item.key)" class="cfm-badge cfm-badge-deleted">削除済</span>
                  <span v-else class="cfm-badge cfm-badge-custom">カスタム</span>
                </td>
                <td class="cfm-td-action" @click.stop>
                  <template v-if="localDeleted.includes(item.key)">
                    <button class="cfm-btn cfm-btn-restore" @click="restoreField(item.key)" title="復元"><i class="fa-solid fa-rotate-left"></i></button>
                  </template>
                  <template v-else-if="item.isCustom">
                    <button class="cfm-btn cfm-btn-del" @click="softDelete(item.key)" title="論理削除"><i class="fa-solid fa-trash-can"></i></button>
                  </template>
                  <template v-else>
                    <span class="cfm-no-action">—</span>
                  </template>
                </td>
              </tr>
              <!-- select型の選択肢インライン編集 -->
              <tr v-if="item.component === 'select' && expandedKey === item.key" :key="item.key + '-opts'" class="cfm-options-row" @click.stop>
                <td colspan="5">
                  <div class="cfm-options-editor">
                    <div class="cfm-options-title"><i class="fa-solid fa-list"></i> 「{{ localLabels[item.key] || item.originalLabel }}」の選択肢</div>
                    <div v-for="(opt, oi) in (localOptions[item.key] || [])" :key="oi" class="cfm-opt-row">
                      <input type="text" v-model="opt.label" class="cfm-input cfm-opt-input" placeholder="選択肢名" @blur="syncLocalOption(item.key)">
                      <button class="cfm-btn cfm-opt-del" @click="removeOption(item.key, oi)"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <button class="cfm-btn cfm-opt-add" @click="addOption(item.key)"><i class="fa-solid fa-plus"></i> 選択肢追加</button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <!-- カスタムフィールド追加 -->
        <div class="cfm-add-row">
          <input type="text" v-model="newLabel" class="cfm-input cfm-input-grow" placeholder="新しいフィールド名">
          <select v-model="newComponent" class="cfm-select">
            <option v-for="o in FIELD_COMPONENT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
          <select v-model="newSection" class="cfm-select">
            <option v-for="s in sectionKeys" :key="s" :value="s">{{ s }}</option>
          </select>
          <button class="cfm-btn cfm-btn-add" @click="addCustomDef" :disabled="!newLabel.trim()">＋追加</button>
        </div>
      </div>

      <div class="cfm-footer">
        <button class="cfm-btn cfm-btn-save" @click="save">保存</button>
        <button class="cfm-btn cfm-btn-cancel" @click="close">キャンセル</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { FieldDef, FieldComponent, FieldOption } from '@/types/fieldLayout';
import { FIELD_COMPONENT_OPTIONS, COMPONENT_LABEL_MAP } from '@/types/fieldLayout';
import type { CustomFieldDef } from '@/composables/useFieldLayout';

/** 統合表示用 */
interface UnifiedFieldItem {
  key: string;
  originalLabel: string;
  component: FieldComponent;
  isCustom: boolean;
}

const props = defineProps<{
  visible: boolean;
  customDefs: CustomFieldDef[];
  sectionKeys: string[];
  layoutFields: FieldDef[];
  fieldRows: string[][];
  defaultFieldKeys: string[];
  labelOverrides: Record<string, string>;
  hiddenFields: string[];
  deletedFields: string[];
  fieldOptions: Record<string, FieldOption[]>;
}>();

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'save', payload: {
    customDefs: CustomFieldDef[];
    labelOverrides: Record<string, string>;
    hiddenFields: string[];
    deletedFields: string[];
    fieldOptions: Record<string, FieldOption[]>;
  }): void;
  (e: 'focus-field', key: string): void;
}>();

const filterType = ref('');
const searchText = ref('');

/** ローカルステート */
const localCustomDefs = ref<CustomFieldDef[]>([]);
const localLabels = ref<Record<string, string>>({});
const localHidden = ref<string[]>([]);
const localDeleted = ref<string[]>([]);
const localOptions = ref<Record<string, FieldOption[]>>({});
const expandedKey = ref<string | null>(null);
const newLabel = ref('');
const newComponent = ref<FieldComponent>('text');
const newSection = ref('');

/** コンポーネント型→日本語ラベル */
const getComponentLabel = (comp: FieldComponent): string => {
  return COMPONENT_LABEL_MAP[comp] || comp;
};

/** 表示中にpropsを初期化 */
watch(() => props.visible, (v) => {
  if (v) {
    localCustomDefs.value = JSON.parse(JSON.stringify(props.customDefs));
    localHidden.value = [...props.hiddenFields];
    localDeleted.value = [...props.deletedFields];
    localOptions.value = JSON.parse(JSON.stringify(props.fieldOptions || {}));
    expandedKey.value = null;
    newSection.value = props.sectionKeys[0] || '';

    const labels: Record<string, string> = {};
    for (const f of props.layoutFields) {
      labels[f.key] = props.labelOverrides[f.key] || f.label;
    }
    localLabels.value = labels;
  }
});

/** 全フィールド統合一覧（左カラムの表示順 = fieldRows順） */
const allFields = computed<UnifiedFieldItem[]>(() => {
  // fieldRowsをフラット化した順序
  const orderedKeys = props.fieldRows.flat();
  const fieldMap = new Map<string, FieldDef>();
  for (const f of props.layoutFields) {
    fieldMap.set(f.key, f);
  }
  const items: UnifiedFieldItem[] = [];
  const seen = new Set<string>();

  // fieldRows順で追加
  for (const key of orderedKeys) {
    if (seen.has(key)) continue;
    seen.add(key);
    const f = fieldMap.get(key);
    if (!f) continue;
    items.push({
      key: f.key,
      originalLabel: f.label,
      component: f.component,
      isCustom: !props.defaultFieldKeys.includes(f.key),
    });
  }

  // fieldRowsに含まれないフィールド（非表示・削除済み等）を末尾に追加
  for (const f of props.layoutFields) {
    if (seen.has(f.key)) continue;
    seen.add(f.key);
    items.push({
      key: f.key,
      originalLabel: f.label,
      component: f.component,
      isCustom: !props.defaultFieldKeys.includes(f.key),
    });
  }

  return items;
});

/** 種別絞り込み + 文字検索 */
const filteredAllFields = computed(() => {
  let result = allFields.value;
  if (filterType.value) {
    result = result.filter(f => f.component === filterType.value);
  }
  if (searchText.value.trim()) {
    const q = searchText.value.trim().toLowerCase();
    result = result.filter(f => {
      const label = (localLabels.value[f.key] || f.originalLabel).toLowerCase();
      return label.includes(q) || f.key.toLowerCase().includes(q);
    });
  }
  return result;
});

const close = () => emit('update:visible', false);

/** 非表示切替 */
const toggleHidden = (key: string, checked: boolean) => {
  if (checked) {
    localHidden.value = localHidden.value.filter(k => k !== key);
  } else {
    if (!localHidden.value.includes(key)) localHidden.value.push(key);
  }
};

/** 行クリックで左カラムの該当フィールドにフォーカス + select型なら展開 */
const onRowClick = (key: string, component: FieldComponent) => {
  emit('focus-field', key);
  if (component === 'select') {
    expandedKey.value = expandedKey.value === key ? null : key;
  } else {
    expandedKey.value = null;
  }
};

/** 選択肢追加 */
const addOption = (fieldKey: string) => {
  if (!localOptions.value[fieldKey]) localOptions.value[fieldKey] = [];
  const idx = localOptions.value[fieldKey].length + 1;
  localOptions.value[fieldKey].push({ value: `opt_${idx}`, label: `選択肢${idx}` });
};

/** 選択肢削除 */
const removeOption = (fieldKey: string, idx: number) => {
  localOptions.value[fieldKey]?.splice(idx, 1);
};

/** 選択肢のvalueをlabelから自動生成 */
const syncLocalOption = (fieldKey: string) => {
  const opts = localOptions.value[fieldKey];
  if (!opts) return;
  for (let i = 0; i < opts.length; i++) {
    const opt = opts[i];
    if (opt && !opt.value) {
      opt.value = `opt_${i + 1}`;
    }
  }
};

/** カスタムフィールド追加 */
const addCustomDef = () => {
  if (!newLabel.value.trim()) return;
  const key = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const def: CustomFieldDef = {
    key,
    label: newLabel.value.trim(),
    section: newSection.value,
    component: newComponent.value,
    widthPercent: 20,
    order: 100 + localCustomDefs.value.length,
  };
  localCustomDefs.value.push(def);
  localLabels.value[key] = def.label;
  newLabel.value = '';
};

/** カスタムフィールド論理削除 */
const softDelete = (key: string) => {
  if (!localDeleted.value.includes(key)) {
    localDeleted.value.push(key);
  }
};

/** 論理削除復元 */
const restoreField = (key: string) => {
  localDeleted.value = localDeleted.value.filter(k => k !== key);
};

/** 保存 */
const save = () => {
  // ラベル上書きを計算（初期フィールドのみ）
  const cleanOverrides: Record<string, string> = {};
  for (const key of props.defaultFieldKeys) {
    const f = props.layoutFields.find(ff => ff.key === key);
    if (!f) continue;
    const current = localLabels.value[key];
    if (current && current.trim() !== f.label) {
      cleanOverrides[key] = current.trim();
    }
  }
  // カスタムフィールドのラベルを反映
  for (const d of localCustomDefs.value) {
    const current = localLabels.value[d.key];
    if (current && current.trim()) {
      d.label = current.trim();
    }
  }
  emit('save', {
    customDefs: JSON.parse(JSON.stringify(localCustomDefs.value)),
    labelOverrides: cleanOverrides,
    hiddenFields: [...localHidden.value],
    deletedFields: [...localDeleted.value],
    fieldOptions: JSON.parse(JSON.stringify(localOptions.value)),
  });
  close();
};
</script>

<style scoped>
.cfm-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.cfm-modal { background: #fff; border-radius: 8px; width: 860px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
.cfm-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
.cfm-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #1e293b; }
.cfm-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8; }
.cfm-close:hover { color: #1e293b; }
.cfm-body { padding: 16px 20px; overflow-y: auto; flex: 1; }
.cfm-filter-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.cfm-count { font-size: 12px; color: #94a3b8; }
.cfm-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.cfm-table thead { background: #f8fafc; position: sticky; top: 0; z-index: 1; }
.cfm-table th { padding: 8px; text-align: left; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
.cfm-table td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
.cfm-th-visible { width: 44px; text-align: center; }
.cfm-td-visible { text-align: center; }
.cfm-th-type { width: 90px; text-align: center; }
.cfm-td-type { text-align: center; }
.cfm-th-action { width: 50px; text-align: center; }
.cfm-td-action { text-align: center; }
.cfm-row-hidden { background: #fef2f2; opacity: 0.6; }
.cfm-input { padding: 5px 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; width: 100%; box-sizing: border-box; }
.cfm-input:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
.cfm-input-grow { flex: 1; }
.cfm-select { padding: 5px 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; background: #fff; }
.cfm-select:focus { border-color: #3b82f6; outline: none; }
.cfm-search { width: 33%; padding: 6px 10px; border: 2px solid #94a3b8; border-radius: 4px; font-size: 13px; background: #fff; min-width: 0; }
.cfm-search:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
.cfm-add-row { display: flex; gap: 8px; margin-top: 12px; align-items: center; padding: 8px; background: #f8fafc; border-radius: 6px; }
.cfm-btn { border: none; padding: 6px 14px; border-radius: 4px; font-size: 13px; cursor: pointer; font-weight: 600; }
.cfm-btn-add { background: #3b82f6; color: #fff; white-space: nowrap; }
.cfm-btn-add:hover { background: #2563eb; }
.cfm-btn-add:disabled { background: #cbd5e1; cursor: not-allowed; }
.cfm-btn-del { background: none; font-size: 14px; padding: 4px 8px; color: #dc2626; }
.cfm-btn-del:hover { background: #fee2e2; border-radius: 4px; }
.cfm-btn-restore { background: none; font-size: 14px; padding: 4px 8px; color: #2563eb; }
.cfm-btn-restore:hover { background: #dbeafe; border-radius: 4px; }
.cfm-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid #e2e8f0; }
.cfm-btn-save { background: #3b82f6; color: #fff; }
.cfm-btn-save:hover { background: #2563eb; }
.cfm-btn-cancel { background: #f1f5f9; color: #475569; }
.cfm-btn-cancel:hover { background: #e2e8f0; }
/* 種別バッジ */
.cfm-type-badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 600; }
.cfm-type-heading { background: #dbeafe; color: #1e40af; }
.cfm-type-spacer { background: #e0e7ff; color: #4338ca; }
.cfm-type-text, .cfm-type-textarea, .cfm-type-url, .cfm-type-email { background: #f0fdf4; color: #166534; }
.cfm-type-number, .cfm-type-amount { background: #fef3c7; color: #92400e; }
.cfm-type-date, .cfm-type-dateGroup { background: #fce7f3; color: #9d174d; }
.cfm-type-select, .cfm-type-staffSelect { background: #f3e8ff; color: #6b21a8; }
.cfm-type-checkbox { background: #ecfdf5; color: #065f46; }
.cfm-type-readonly, .cfm-type-computed, .cfm-type-link, .cfm-type-urlCopy { background: #f1f5f9; color: #475569; }
.cfm-type-contactTable, .cfm-type-custom { background: #f8fafc; color: #64748b; }
/* 状態バッジ */
.cfm-th-status { width: 70px; text-align: center; }
.cfm-td-status { text-align: center; }
.cfm-badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; }
.cfm-badge-lock { background: #f1f5f9; color: #64748b; }
.cfm-badge-custom { background: #f0fdf4; color: #166534; }
.cfm-badge-deleted { background: #fef2f2; color: #dc2626; }
/* 行スタイル */
.cfm-row-locked { border-left: 3px solid #cbd5e1; }
.cfm-row-deleted { background: #fef2f2; }
.cfm-row-deleted td { text-decoration: line-through; color: #94a3b8; }
.cfm-row-deleted .cfm-td-status, .cfm-row-deleted .cfm-td-action, .cfm-row-deleted .cfm-td-type { text-decoration: none; }
.cfm-no-action { color: #cbd5e1; font-size: 12px; }
.cfm-row-clickable { cursor: pointer; transition: background 0.15s; }
.cfm-row-clickable:hover { background: #f0f9ff; }
/* 選択肢インライン編集 */
.cfm-options-row td { padding: 0 8px 8px; }
.cfm-options-editor { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 10px; }
.cfm-options-title { font-size: 12px; font-weight: 600; color: #0369a1; margin-bottom: 6px; display: flex; align-items: center; gap: 4px; }
.cfm-opt-row { display: flex; align-items: center; gap: 4px; margin-bottom: 4px; }
.cfm-opt-input { flex: 1; font-size: 12px; padding: 4px 6px; }
.cfm-opt-del { background: none; border: none; color: #ef4444; cursor: pointer; padding: 2px 4px; font-size: 12px; }
.cfm-opt-del:hover { background: #fee2e2; border-radius: 3px; }
.cfm-opt-add { display: flex; align-items: center; gap: 4px; background: #dbeafe; border: 1px dashed #93c5fd; border-radius: 4px; color: #1e40af; font-size: 11px; font-weight: 600; padding: 4px 8px; margin-top: 4px; cursor: pointer; }
.cfm-opt-add:hover { background: #bfdbfe; }
</style>
