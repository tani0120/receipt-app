<template>
  <div class="ct-wrapper">
    <table ref="tableEl" class="ct-table">
      <thead>
        <tr>
          <th v-for="col in localColumns" :key="col.key" :style="colWidthStyle(col)" @dblclick="isLayoutMode && startHeaderEdit(col.key)">
            <input
              v-if="isLayoutMode && editingHeader === col.key"
              ref="headerInput"
              type="text"
              v-model="col.label"
              class="ct-header-input"
              @blur="endHeaderEdit"
              @keydown.enter="endHeaderEdit"
            >
            <span v-else>{{ col.label }}</span>
            <button v-if="isLayoutMode" class="ct-col-del-btn" @click.stop="removeColumn(col.key)" title="列削除">&times;</button>
            <div v-if="isLayoutMode" class="ct-col-resize" @mousedown.stop.prevent="startColResize($event, col.key)" title="ドラッグで列幅変更"></div>
          </th>
          <th v-if="isLayoutMode" class="ct-actions-col">
            <button class="ct-col-add-btn" @click="addColumn" title="列追加">＋</button>
          </th>
        </tr>
      </thead>
      <!-- レイアウト管理: 型プレビュー＋型変更＋選択肢編集 -->
      <tbody v-if="isLayoutMode">
        <!-- 型プレビュー行 -->
        <tr>
          <td v-for="col in localColumns" :key="col.key" :style="colWidthStyle(col)" class="ct-layout-cell">
            <template v-if="col.type === 'select'">
              <select disabled class="ct-select ct-preview"><option>— 選択 —</option></select>
            </template>
            <template v-else-if="col.type === 'textarea'">
              <textarea disabled class="ct-input ct-preview" rows="1" placeholder="テキストエリア"></textarea>
            </template>
            <template v-else-if="col.type === 'number'">
              <input type="number" disabled class="ct-input ct-preview" placeholder="0">
            </template>
            <template v-else-if="col.type === 'date'">
              <input type="date" disabled class="ct-input ct-preview">
            </template>
            <template v-else-if="col.type === 'url'">
              <input type="url" disabled class="ct-input ct-preview" placeholder="https://...">
            </template>
            <template v-else-if="col.type === 'email'">
              <input type="email" disabled class="ct-input ct-preview" placeholder="email@example.com">
            </template>
            <template v-else-if="col.type === 'checkbox'">
              <label class="ct-preview" style="display:flex;align-items:center;gap:4px;"><input type="checkbox" disabled><span>チェック</span></label>
            </template>
            <template v-else>
              <input type="text" disabled class="ct-input ct-preview" placeholder="テキスト入力">
            </template>
          </td>
          <td></td>
        </tr>
        <!-- 型変更行 -->
        <tr>
          <td v-for="col in localColumns" :key="col.key" :style="colWidthStyle(col)" class="ct-layout-cell">
            <select v-model="col.type" class="ct-type-select" @change="onTypeChange(col)">
              <option value="text">テキスト</option>
              <option value="number">数値</option>
              <option value="date">日付</option>
              <option value="url">URL</option>
              <option value="email">メール</option>
              <option value="select">選択</option>
              <option value="checkbox">チェック</option>
              <option value="textarea">テキストエリア</option>
            </select>
          </td>
          <td></td>
        </tr>
        <!-- 選択肢編集行（select型の列がある場合のみ） -->
        <tr v-if="localColumns.some(c => c.type === 'select')">
          <td v-for="col in localColumns" :key="col.key" class="ct-layout-cell ct-layout-options">
            <template v-if="col.type === 'select'">
              <div class="ct-opt-list">
                <div v-for="(_opt, oi) in (col.options || [])" :key="oi" class="ct-opt-row">
                  <input type="text" v-model="col.options![oi]" class="ct-opt-input" @blur="emitColumns" placeholder="選択肢">
                  <button class="ct-opt-del" @click="removeColOption(col, oi)">&times;</button>
                </div>
                <button class="ct-opt-add" @click="addColOption(col)">＋ 追加</button>
              </div>
            </template>
          </td>
          <td></td>
        </tr>
      </tbody>
      <!-- 通常: データ行 -->
      <tbody v-else>
        <tr v-for="(row, rIdx) in localContacts" :key="rIdx">
          <td v-for="col in localColumns" :key="col.key" :style="colWidthStyle(col)" @dblclick="isEditing && startCellEdit(rIdx, col.key)">
            <template v-if="col.type === 'select'">
              <select v-if="isEditing && editingCell?.row === rIdx && editingCell?.col === col.key" v-model="row[col.key]" class="ct-select" @blur="endCellEdit" @change="endCellEdit">
                <option value="">{{ PLACEHOLDER_DIVIDER }}</option>
                <option v-for="opt in col.options" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <span v-else class="ct-cell-text">{{ row[col.key] || '—' }}</span>
            </template>
            <template v-else-if="col.type === 'checkbox'">
              <label style="display:flex;align-items:center;gap:4px;cursor:pointer;">
                <input type="checkbox" :checked="row[col.key] === 'true' || row[col.key] === '1'" @change="row[col.key] = ($event.target as HTMLInputElement).checked ? 'true' : ''" :disabled="!isEditing">
              </label>
            </template>
            <template v-else-if="col.type === 'date'">
              <input v-if="isEditing && editingCell?.row === rIdx && editingCell?.col === col.key" type="date" v-model="row[col.key]" class="ct-input" @blur="endCellEdit">
              <span v-else class="ct-cell-text">{{ row[col.key] || '—' }}</span>
            </template>
            <template v-else-if="col.type === 'url'">
              <input v-if="isEditing && editingCell?.row === rIdx && editingCell?.col === col.key" type="url" v-model="row[col.key]" class="ct-input" @blur="endCellEdit" @keydown.enter="endCellEdit" placeholder="https://...">
              <a v-else-if="row[col.key]" :href="row[col.key]" target="_blank" class="ct-cell-link">{{ row[col.key] }}</a>
              <span v-else class="ct-cell-text">—</span>
            </template>
            <template v-else-if="col.type === 'email'">
              <input v-if="isEditing && editingCell?.row === rIdx && editingCell?.col === col.key" type="email" v-model="row[col.key]" class="ct-input" @blur="endCellEdit" @keydown.enter="endCellEdit" placeholder="email@example.com">
              <a v-else-if="row[col.key]" :href="'mailto:' + row[col.key]" class="ct-cell-link">{{ row[col.key] }}</a>
              <span v-else class="ct-cell-text">—</span>
            </template>
            <template v-else-if="col.type === 'number'">
              <input v-if="isEditing && editingCell?.row === rIdx && editingCell?.col === col.key" type="number" v-model="row[col.key]" class="ct-input" @blur="endCellEdit" @keydown.enter="endCellEdit">
              <span v-else class="ct-cell-text">{{ row[col.key] || '—' }}</span>
            </template>
            <template v-else>
              <input v-if="isEditing && editingCell?.row === rIdx && editingCell?.col === col.key" ref="cellInput" type="text" v-model="row[col.key]" class="ct-input" @blur="endCellEdit" @keydown.enter="endCellEdit" @keydown.tab="endCellEdit">
              <span v-else class="ct-cell-text">{{ row[col.key] || '—' }}</span>
            </template>
          </td>
          <td v-if="isEditing" class="ct-actions">
            <template v-if="isProtectedRow(rIdx)">
              <span class="ct-lock" title="代表連絡先（削除不可）">🔒</span>
            </template>
            <template v-else>
              <button class="ct-btn ct-btn-add" @click="addRow(rIdx)" title="行追加">＋</button>
              <button class="ct-btn ct-btn-remove" @click="removeRow(rIdx)" title="行削除" :disabled="localContacts.length <= protectedRowCount">−</button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { ClientContact } from '@/repositories/types';
import { PLACEHOLDER_DIVIDER } from '@/constants/vendorOptions';
import { UI_MSG } from '@/constants/uiMessages';

/** 列定義 */
export interface ContactColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'url' | 'email' | 'select' | 'checkbox' | 'textarea';
  options?: string[];
  isDefault?: boolean;
  /** 列幅(%単位)。0=自動均等 */
  width?: number;
}

/** デフォルト5列 */
const DEFAULT_COLUMNS: ContactColumn[] = [
  { key: 'name', label: UI_MSG.連絡先_担当者名, type: 'text', isDefault: true },
  { key: 'method', label: UI_MSG.連絡先_連絡種別, type: 'select', options: ['電話', 'メール', 'チャット'], isDefault: true },
  { key: 'value', label: UI_MSG.連絡先_連絡先, type: 'text', isDefault: true },
  { key: 'usage', label: UI_MSG.連絡先_自由記載, type: 'text', isDefault: true },
  { key: 'memo', label: UI_MSG.連絡先_連絡先備考, type: 'text', isDefault: true },
];

/** デフォルト3行（電話・メール・チャットワーク）— 削除不可 */
const DEFAULT_ROWS: { method: string; placeholder: string }[] = [
  { method: '電話', placeholder: '03-1234-5678' },
  { method: 'メール', placeholder: 'example@mail.com' },
  { method: 'チャット', placeholder: 'https://www.chatwork.com/#!rid...' },
];
/** 保護された行数（デフォルト3行） */
const protectedRowCount = DEFAULT_ROWS.length;

const props = defineProps<{
  contacts: ClientContact[];
  columns?: ContactColumn[];
  /** 編集モード（false=閲覧専用） */
  isEditing?: boolean;
  /** レイアウト管理モード（列追加/削除/ヘッダー編集を許可） */
  isLayoutMode?: boolean;
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

/** デフォルト3行を生成 */
const makeDefaultRows = (): Record<string, string>[] => {
  return DEFAULT_ROWS.map(dr => {
    const row: Record<string, string> = {};
    for (const col of localColumns.value) {
      row[col.key] = '';
    }
    row.method = dr.method;
    return row;
  });
};

/** ローカル連絡先データ（フラット形式） */
const localContacts = ref<Record<string, string>[]>(
  props.contacts?.length && props.contacts.length >= protectedRowCount
    ? props.contacts.map(flattenRow)
    : (() => {
        // 既存データがデフォルト行数未満の場合、デフォルト行で補完
        const existing = props.contacts?.length ? props.contacts.map(flattenRow) : [];
        const defaults = makeDefaultRows();
        // 既存データをデフォルト行にマージ
        for (let i = 0; i < defaults.length; i++) {
          if (existing[i]) {
            defaults[i] = { ...defaults[i], ...existing[i] };
          }
        }
        return defaults;
      })()
);

/** 行が保護されたデフォルト行か判定 */
const isProtectedRow = (idx: number): boolean => idx < protectedRowCount;

/** 編集中セル */
const editingCell = ref<{ row: number; col: string } | null>(null);
const editingHeader = ref<string | null>(null);
const cellInput = ref<HTMLInputElement[] | null>(null);
const headerInput = ref<HTMLInputElement[] | null>(null);

/** propsの変更を監視 */
watch(() => props.contacts, (nv) => {
  if (nv?.length && nv.length >= protectedRowCount) {
    localContacts.value = nv.map(flattenRow);
  } else {
    const existing = nv?.length ? nv.map(flattenRow) : [];
    const defaults = makeDefaultRows();
    for (let i = 0; i < defaults.length; i++) {
      if (existing[i]) {
        defaults[i] = { ...defaults[i], ...existing[i] };
      }
    }
    localContacts.value = defaults;
  }
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

/** 外部からcolumnsが変更された場合に同期（無限ループ防止: JSON比較） */
watch(() => props.columns, (nv) => {
  if (nv?.length) {
    const incoming = JSON.stringify(nv);
    if (JSON.stringify(localColumns.value) !== incoming) {
      localColumns.value = JSON.parse(incoming);
    }
  }
});

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
  if (isProtectedRow(idx)) return; // デフォルト行は削除不可
  if (localContacts.value.length <= protectedRowCount) return;
  localContacts.value.splice(idx, 1);
};

/** 列追加 */
const addColumn = () => {
  const key = `col_${Date.now()}`;
  localColumns.value.push({ key, label: UI_MSG.連絡先_新しい列, type: 'text' });
  // 既存行に空値追加
  for (const row of localContacts.value) {
    row[key] = '';
  }
};

/** 列削除 */
const removeColumn = (colKey: string) => {
  const idx = localColumns.value.findIndex(c => c.key === colKey);
  if (idx < 0) return;
  localColumns.value.splice(idx, 1);
  // 行データからも削除
  for (const row of localContacts.value) {
    delete row[colKey];
  }
};

/** 列定義変更を手動emit */
const emitColumns = () => {
  emit('update:columns', JSON.parse(JSON.stringify(localColumns.value)));
};

/** 列の型変更 */
const onTypeChange = (col: ContactColumn) => {
  if (col.type === 'select' && !col.options) {
    col.options = [];
  }
  emitColumns();
};

/** 列の選択肢追加 */
const addColOption = (col: ContactColumn) => {
  if (!col.options) col.options = [];
  col.options.push('');
  emitColumns();
};

/** 列の選択肢削除 */
const removeColOption = (col: ContactColumn, idx: number) => {
  col.options?.splice(idx, 1);
  emitColumns();
};

/** 列幅スタイル（0=自動均等、1〜100=%指定） */
const colWidthStyle = (col: ContactColumn): Record<string, string> => {
  if (col.width && col.width > 0) {
    return { width: `${col.width}%` };
  }
  return {};
};

/** ─── 列幅ドラッグリサイズ ─── */
const tableEl = ref<HTMLTableElement | null>(null);
let resizingColKey: string | null = null;
let resizeStartX = 0;
let resizeStartWidth = 0;

/** ドラッグ開始 */
const startColResize = (e: MouseEvent, colKey: string) => {
  resizingColKey = colKey;
  resizeStartX = e.clientX;
  const col = localColumns.value.find(c => c.key === colKey);
  resizeStartWidth = col?.width ?? 0;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  document.addEventListener('mousemove', onColResizeMove);
  document.addEventListener('mouseup', onColResizeEnd);
};

/** ドラッグ中 */
const onColResizeMove = (e: MouseEvent) => {
  if (!resizingColKey || !tableEl.value) return;
  const tableWidth = tableEl.value.offsetWidth;
  if (tableWidth <= 0) return;
  const deltaPx = e.clientX - resizeStartX;
  const deltaPct = (deltaPx / tableWidth) * 100;
  const newPct = Math.max(5, Math.min(80, resizeStartWidth + deltaPct));
  const col = localColumns.value.find(c => c.key === resizingColKey);
  if (col) col.width = Math.round(newPct);
};

/** ドラッグ終了 */
const onColResizeEnd = () => {
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  document.removeEventListener('mousemove', onColResizeMove);
  document.removeEventListener('mouseup', onColResizeEnd);
  if (resizingColKey) {
    emitColumns();
    resizingColKey = null;
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
.ct-input { width: 100%; padding: 4px 6px; border: 1px solid #3b82f6; border-radius: 3px; font-size: 13px; box-sizing: border-box; background: #fff; }
.ct-input:focus { outline: none; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
.ct-select { padding: 4px 6px; border: 1px solid #3b82f6; border-radius: 3px; font-size: 13px; background: #fff; min-width: 80px; }
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
.ct-col-del-btn { position: absolute; top: 2px; right: 2px; background: none; border: none; color: rgba(255,255,255,0.5); font-size: 14px; cursor: pointer; padding: 0 3px; line-height: 1; }
.ct-col-del-btn:hover { color: #fca5a5; }

/* レイアウト管理用 */
.ct-layout-cell { vertical-align: top; padding: 6px 8px; }
.ct-preview { opacity: 0.6; pointer-events: none; width: 100%; box-sizing: border-box; }
.ct-type-select { width: 100%; padding: 3px 4px; border: 1px solid #cbd5e1; border-radius: 3px; font-size: 11px; background: #f8fafc; color: #334155; box-sizing: border-box; }
.ct-type-select:focus { outline: none; border-color: #3b82f6; }
.ct-layout-options { vertical-align: top; }
.ct-opt-list { display: flex; flex-direction: column; gap: 3px; }
.ct-opt-row { display: flex; align-items: center; gap: 3px; }
.ct-opt-input { flex: 1; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 3px; font-size: 12px; box-sizing: border-box; }
.ct-opt-input:focus { outline: none; border-color: #3b82f6; }
.ct-opt-del { border: none; background: none; color: #ef4444; cursor: pointer; font-size: 14px; padding: 0 2px; }
.ct-opt-add { border: 1px dashed #94a3b8; background: none; color: #64748b; padding: 2px 6px; border-radius: 3px; font-size: 11px; cursor: pointer; margin-top: 2px; }
.ct-opt-add:hover { background: #f1f5f9; border-color: #3b82f6; color: #2563eb; }
.ct-cell-link { color: #2563eb; text-decoration: underline; font-size: 13px; word-break: break-all; }

/* 列幅リサイズハンドル */
.ct-col-resize {
  position: absolute; top: 0; right: -2px; width: 5px; height: 100%;
  cursor: col-resize; z-index: 2;
  display: flex; align-items: center; justify-content: center;
}
.ct-col-resize::after {
  content: '⋮⋮'; font-size: 10px; color: rgba(255,255,255,0.5); letter-spacing: -2px;
}
.ct-col-resize:hover::after { color: #fff; }

/* デフォルト行の鍵マーク */
.ct-lock {
  font-size: 11px;
  filter: saturate(2) brightness(1.1);
  cursor: help;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
</style>

