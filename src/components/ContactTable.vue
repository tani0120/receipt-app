<template>
  <div class="ct-wrapper">
    <table class="ct-table">
      <thead>
        <tr>
          <th v-for="col in localColumns" :key="col.key" @dblclick="startHeaderEdit(col.key)">
            <input
              v-if="editingHeader === col.key"
              ref="headerInput"
              type="text"
              v-model="col.label"
              class="ct-header-input"
              @blur="endHeaderEdit"
              @keydown.enter="endHeaderEdit"
            >
            <span v-else>{{ col.label }}</span>
          </th>
          <th class="ct-actions-col">
            <button class="ct-col-add-btn" @click="addColumn" title="列追加">＋</button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rIdx) in localContacts" :key="rIdx">
          <td v-for="col in localColumns" :key="col.key" @dblclick="startCellEdit(rIdx, col.key)">
            <!-- 連絡種別はselect -->
            <template v-if="col.type === 'select'">
              <select v-if="editingCell?.row === rIdx && editingCell?.col === col.key" v-model="row[col.key]" class="ct-select" @blur="endCellEdit" @change="endCellEdit">
                <option value="">{{ PLACEHOLDER_DIVIDER }}</option>
                <option v-for="opt in col.options" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <span v-else class="ct-cell-text">{{ row[col.key] || '—' }}</span>
            </template>
            <!-- それ以外はtext -->
            <template v-else>
              <input v-if="editingCell?.row === rIdx && editingCell?.col === col.key" ref="cellInput" type="text" v-model="row[col.key]" class="ct-input" @blur="endCellEdit" @keydown.enter="endCellEdit" @keydown.tab="endCellEdit">
              <span v-else class="ct-cell-text">{{ row[col.key] || '—' }}</span>
            </template>
          </td>
          <td class="ct-actions">
            <button class="ct-btn ct-btn-add" @click="addRow(rIdx)" title="行追加">＋</button>
            <button class="ct-btn ct-btn-remove" @click="removeRow(rIdx)" title="行削除" :disabled="localContacts.length <= 1">−</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import type { ClientContact } from '@/repositories/types';
import { PLACEHOLDER_DIVIDER } from '@/constants/vendorOptions';

/** 列定義 */
export interface ContactColumn {
  key: string;
  label: string;
  type: 'text' | 'select' | 'textarea';
  options?: string[];
  isDefault?: boolean;
}

/** デフォルト5列 */
const DEFAULT_COLUMNS: ContactColumn[] = [
  { key: 'name', label: '担当者名', type: 'text', isDefault: true },
  { key: 'method', label: '連絡種別', type: 'select', options: ['電話', 'メール', 'チャット'], isDefault: true },
  { key: 'value', label: '連絡先', type: 'text', isDefault: true },
  { key: 'usage', label: '自由記載', type: 'text', isDefault: true },
  { key: 'memo', label: '連絡先備考', type: 'text', isDefault: true },
];

const props = defineProps<{
  contacts: ClientContact[];
  columns?: ContactColumn[];
}>();

const emit = defineEmits<{
  (e: 'update:contacts', contacts: ClientContact[]): void;
  (e: 'update:columns', columns: ContactColumn[]): void;
}>();

/** 列定義 */
const localColumns = ref<ContactColumn[]>(
  props.columns?.length ? JSON.parse(JSON.stringify(props.columns)) : JSON.parse(JSON.stringify(DEFAULT_COLUMNS))
);

/** 行をフラット化（固定列 + extra列を統合） */
const flattenRow = (c: ClientContact): Record<string, string> => {
  const row: Record<string, string> = {
    name: c.name || '',
    method: c.method || '',
    value: c.value || '',
    usage: c.usage || '',
    memo: c.memo || '',
  };
  if (c.extra) {
    for (const [k, v] of Object.entries(c.extra)) {
      row[k] = v;
    }
  }
  return row;
};

/** フラット行をClientContactに戻す */
const unflattenRow = (row: Record<string, string>): ClientContact => {
  const defaultKeys = ['name', 'method', 'value', 'usage', 'memo'];
  const extra: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    if (!defaultKeys.includes(k)) {
      extra[k] = v;
    }
  }
  return {
    name: row.name || '',
    method: row.method || '',
    value: row.value || '',
    usage: row.usage || '',
    memo: row.memo || '',
    extra: Object.keys(extra).length ? extra : undefined,
  };
};

const emptyRow = (): Record<string, string> => {
  const row: Record<string, string> = {};
  for (const col of localColumns.value) {
    row[col.key] = '';
  }
  return row;
};

/** ローカル連絡先データ（フラット形式） */
const localContacts = ref<Record<string, string>[]>(
  props.contacts?.length ? props.contacts.map(flattenRow) : [emptyRow()]
);

/** 編集中セル */
const editingCell = ref<{ row: number; col: string } | null>(null);
const editingHeader = ref<string | null>(null);
const cellInput = ref<HTMLInputElement[] | null>(null);
const headerInput = ref<HTMLInputElement[] | null>(null);

/** propsの変更を監視 */
watch(() => props.contacts, (nv) => {
  localContacts.value = nv?.length ? nv.map(flattenRow) : [emptyRow()];
}, { deep: true });

watch(() => props.columns, (nv) => {
  if (nv?.length) localColumns.value = JSON.parse(JSON.stringify(nv));
}, { deep: true });

/** ローカル変更を親に通知 */
watch(localContacts, (nv) => {
  emit('update:contacts', nv.map(unflattenRow));
}, { deep: true });

watch(localColumns, (nv) => {
  emit('update:columns', JSON.parse(JSON.stringify(nv)));
}, { deep: true });

/** セル編集 */
const startCellEdit = (row: number, col: string) => {
  editingCell.value = { row, col };
  nextTick(() => { if (cellInput.value?.[0]) cellInput.value[0].focus(); });
};
const endCellEdit = () => { editingCell.value = null; };

/** ヘッダー編集 */
const startHeaderEdit = (key: string) => {
  editingHeader.value = key;
  nextTick(() => { if (headerInput.value?.[0]) headerInput.value[0].focus(); });
};
const endHeaderEdit = () => { editingHeader.value = null; };

/** 行追加/削除 */
const addRow = (afterIdx: number) => {
  localContacts.value.splice(afterIdx + 1, 0, emptyRow());
};
const removeRow = (idx: number) => {
  if (localContacts.value.length <= 1) return;
  localContacts.value.splice(idx, 1);
};

/** 列追加 */
const addColumn = () => {
  const key = `col_${Date.now()}`;
  localColumns.value.push({ key, label: '新しい列', type: 'text' });
  // 既存行に空値追加
  for (const row of localContacts.value) {
    row[key] = '';
  }
};
</script>

<style scoped>
.ct-wrapper { width: 100%; overflow-x: auto; }
.ct-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.ct-table thead { background: #0284c7; color: #fff; }
.ct-table th { padding: 8px 12px; font-weight: 600; text-align: left; white-space: nowrap; font-size: 12px; cursor: pointer; position: relative; }
.ct-table th:hover { background: #0369a1; }
.ct-table td { padding: 4px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; cursor: pointer; min-height: 32px; }
.ct-table tbody tr:hover { background: #f8fafc; }
.ct-cell-text { display: block; padding: 4px 2px; min-height: 20px; }
.ct-header-input { width: 100%; padding: 4px 6px; border: 1px solid #fff; border-radius: 3px; font-size: 12px; font-weight: 600; background: rgba(255,255,255,0.2); color: #fff; box-sizing: border-box; }
.ct-header-input:focus { outline: none; background: rgba(255,255,255,0.3); }
.ct-input { width: 100%; padding: 4px 6px; border: 1px solid #3b82f6; border-radius: 3px; font-size: 13px; box-sizing: border-box; background: #eff6ff; }
.ct-input:focus { outline: none; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
.ct-select { padding: 4px 6px; border: 1px solid #3b82f6; border-radius: 3px; font-size: 13px; background: #eff6ff; min-width: 80px; }
.ct-select:focus { outline: none; }
.ct-actions-col { width: 70px; text-align: center; }
.ct-actions { display: flex; gap: 4px; align-items: center; justify-content: center; }
.ct-btn { width: 24px; height: 24px; border: none; border-radius: 50%; font-size: 13px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; line-height: 1; }
.ct-btn-add { background: #3b82f6; color: #fff; }
.ct-btn-add:hover { background: #2563eb; }
.ct-btn-remove { background: #94a3b8; color: #fff; }
.ct-btn-remove:hover { background: #ef4444; }
.ct-btn-remove:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }
.ct-col-add-btn { background: none; border: 1px dashed rgba(255,255,255,0.6); color: rgba(255,255,255,0.8); border-radius: 4px; padding: 2px 8px; font-size: 13px; font-weight: bold; cursor: pointer; }
.ct-col-add-btn:hover { background: rgba(255,255,255,0.15); border-color: #fff; color: #fff; }
</style>
