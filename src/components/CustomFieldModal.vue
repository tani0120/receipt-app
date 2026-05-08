<template>
  <div v-if="visible" class="cfm-overlay" @click.self="close">
    <div class="cfm-modal">
      <div class="cfm-header">
        <h3>フィールド管理</h3>
        <button class="cfm-close" @click="close">&times;</button>
      </div>

      <div class="cfm-body">
        <!-- セクション絞り込み -->
        <div class="cfm-filter-row">
          <select v-model="filterSection" class="cfm-select">
            <option value="">全セクション</option>
            <option v-for="s in sectionKeys" :key="s" :value="s">{{ s }}</option>
          </select>
          <span class="cfm-count">{{ filteredAllFields.length }}件</span>
        </div>

        <!-- 統一一覧 -->
        <table class="cfm-table">
          <thead>
            <tr>
              <th class="cfm-th-visible">表示</th>
              <th>表示ラベル</th>
              <th>セクション</th>
              <th class="cfm-th-action">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredAllFields" :key="item.key" :class="{ 'cfm-row-hidden': localHidden.includes(item.key) }">
              <td class="cfm-td-visible">
                <input type="checkbox" :checked="!localHidden.includes(item.key)" @change="toggleHidden(item.key, ($event.target as HTMLInputElement).checked)">
              </td>
              <td>
                <input type="text" v-model="localLabels[item.key]" class="cfm-input" :placeholder="item.originalLabel">
              </td>
              <td>{{ item.section }}</td>
              <td class="cfm-td-action">
                <button v-if="item.isCustom" class="cfm-btn cfm-btn-del" @click="removeCustom(item.key)" title="削除">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- カスタムフィールド追加 -->
        <div class="cfm-add-row">
          <input type="text" v-model="newLabel" class="cfm-input cfm-input-grow" placeholder="新しいフィールド名">
          <select v-model="newComponent" class="cfm-select">
            <option value="text">テキスト</option>
            <option value="number">数値</option>
            <option value="date">日付</option>
            <option value="textarea">テキストエリア</option>
            <option value="select">選択</option>
            <option value="checkbox">チェック</option>
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
import type { FieldComponent } from '@/types/fieldLayout';

/** カスタムフィールド定義 */
export interface CustomFieldDef {
  key: string;
  label: string;
  section: string;
  component: FieldComponent;
  widthPercent: number;
  order: number;
}

/** 既存フィールド情報（モーダル表示用） */
interface ExistingFieldInfo {
  key: string;
  originalLabel: string;
  section: string;
  subSection?: string;
}

/** 統合表示用 */
interface UnifiedFieldItem {
  key: string;
  originalLabel: string;
  section: string;
  isCustom: boolean;
}

const props = defineProps<{
  visible: boolean;
  customDefs: CustomFieldDef[];
  sectionKeys: string[];
  existingFields: ExistingFieldInfo[];
  labelOverrides: Record<string, string>;
  hiddenFields: string[];
}>();

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'save', payload: {
    customDefs: CustomFieldDef[];
    labelOverrides: Record<string, string>;
    hiddenFields: string[];
  }): void;
}>();

const filterSection = ref('');

/** ローカルステート */
const localCustomDefs = ref<CustomFieldDef[]>([]);
const localLabels = ref<Record<string, string>>({});
const localHidden = ref<string[]>([]);
const newLabel = ref('');
const newComponent = ref<FieldComponent>('text');
const newSection = ref('');

/** 表示中にpropsを初期化 */
watch(() => props.visible, (v) => {
  if (v) {
    localCustomDefs.value = JSON.parse(JSON.stringify(props.customDefs));
    localHidden.value = [...props.hiddenFields];
    newSection.value = props.sectionKeys[0] || '';

    // ラベルを初期化（既存 + カスタム）
    const labels: Record<string, string> = {};
    for (const f of props.existingFields) {
      labels[f.key] = props.labelOverrides[f.key] || f.originalLabel;
    }
    for (const d of localCustomDefs.value) {
      labels[d.key] = d.label;
    }
    localLabels.value = labels;
  }
});

/** 全フィールド統合一覧 */
const allFields = computed<UnifiedFieldItem[]>(() => {
  const items: UnifiedFieldItem[] = [];
  for (const f of props.existingFields) {
    items.push({ key: f.key, originalLabel: f.originalLabel, section: f.section, isCustom: false });
  }
  for (const d of localCustomDefs.value) {
    items.push({ key: d.key, originalLabel: d.label, section: d.section, isCustom: true });
  }
  return items;
});

/** セクション絞り込み */
const filteredAllFields = computed(() => {
  if (!filterSection.value) return allFields.value;
  return allFields.value.filter(f => f.section === filterSection.value);
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

/** カスタムフィールド削除 */
const removeCustom = (key: string) => {
  localCustomDefs.value = localCustomDefs.value.filter(d => d.key !== key);
  delete localLabels.value[key];
};

/** 保存 */
const save = () => {
  // ラベル上書きを計算（既存フィールドのみ）
  const cleanOverrides: Record<string, string> = {};
  for (const f of props.existingFields) {
    const current = localLabels.value[f.key];
    if (current && current.trim() !== f.originalLabel) {
      cleanOverrides[f.key] = current.trim();
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
  });
  close();
};
</script>

<style scoped>
.cfm-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.cfm-modal { background: #fff; border-radius: 8px; width: 800px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
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
.cfm-th-action { width: 50px; text-align: center; }
.cfm-td-action { text-align: center; }
.cfm-key { font-family: monospace; font-size: 11px; color: #94a3b8; }
.cfm-row-hidden { background: #fef2f2; opacity: 0.6; }
.cfm-input { padding: 5px 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; width: 100%; box-sizing: border-box; }
.cfm-input:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
.cfm-input-grow { flex: 1; }
.cfm-select { padding: 5px 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; background: #fff; }
.cfm-select:focus { border-color: #3b82f6; outline: none; }
.cfm-add-row { display: flex; gap: 8px; margin-top: 12px; align-items: center; padding: 8px; background: #f8fafc; border-radius: 6px; }
.cfm-btn { border: none; padding: 6px 14px; border-radius: 4px; font-size: 13px; cursor: pointer; font-weight: 600; }
.cfm-btn-add { background: #3b82f6; color: #fff; white-space: nowrap; }
.cfm-btn-add:hover { background: #2563eb; }
.cfm-btn-add:disabled { background: #cbd5e1; cursor: not-allowed; }
.cfm-btn-del { background: none; font-size: 16px; padding: 4px 8px; }
.cfm-btn-del:hover { background: #fee2e2; border-radius: 4px; }
.cfm-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid #e2e8f0; }
.cfm-btn-save { background: #3b82f6; color: #fff; }
.cfm-btn-save:hover { background: #2563eb; }
.cfm-btn-cancel { background: #f1f5f9; color: #475569; }
.cfm-btn-cancel:hover { background: #e2e8f0; }
</style>
