<template>
  <div class="fp-palette">
    <h3 class="fp-title"><i class="fa-solid fa-puzzle-piece"></i> パーツパレット</h3>

    <!-- 構造部材 -->
    <div class="fp-section">
      <div class="fp-section-label">構造部材</div>
      <VueDraggable
        v-model="structureParts"
        :group="{ name: dragGroup, pull: 'clone', put: false }"
        :sort="false"
        :clone="cloneStructurePart"
        class="fp-list"
        item-key="key"
      >
        <template v-for="item in structureParts" :key="item.key">
          <div class="fp-item fp-item-structure">
            <i :class="item.icon"></i>
            <span>{{ item.label }}</span>
          </div>
        </template>
      </VueDraggable>
    </div>

    <!-- フィールド部材 -->
    <div class="fp-section">
      <div class="fp-section-label">フィールド</div>
      <VueDraggable
        v-model="fieldParts"
        :group="{ name: dragGroup, pull: 'clone', put: false }"
        :sort="false"
        :clone="cloneFieldPart"
        class="fp-list"
        item-key="key"
      >
        <template v-for="item in fieldParts" :key="item.key">
          <div class="fp-item fp-item-field">
            <i :class="item.icon"></i>
            <span>{{ item.label }}</span>
          </div>
        </template>
      </VueDraggable>
    </div>

    <!-- ゴミ箱ドロップエリア -->
    <div class="fp-section">
      <div class="fp-section-label"><i class="fa-solid fa-trash-can"></i> ゴミ箱</div>
      <VueDraggable
        v-model="trashBin"
        :group="{ name: dragGroup, pull: false, put: true }"
        class="fp-drop-zone fp-drop-trash"
        :class="{ 'fp-drop-zone-active': trashBin.length > 0 }"
        @add="onTrashDrop"
      >
        <template v-for="item in trashBin" :key="item.key">
          <span></span>
        </template>
        <div v-if="trashBin.length === 0" class="fp-drop-hint">
          <i class="fa-solid fa-trash-can"></i>
          <span>ここにドラッグして削除</span>
        </div>
      </VueDraggable>
    </div>

    <!-- 非表示ドロップエリア -->
    <div class="fp-section">
      <div class="fp-section-label"><i class="fa-solid fa-eye-slash"></i> 非表示 ({{ hiddenFieldDefs.length }})</div>
      <VueDraggable
        v-model="hideBin"
        :group="{ name: dragGroup, pull: false, put: true }"
        class="fp-drop-zone fp-drop-hide"
        :class="{ 'fp-drop-zone-active': hideBin.length > 0 }"
        @add="onHideDrop"
      >
        <template v-for="item in hideBin" :key="item.key">
          <span></span>
        </template>
        <div v-if="hideBin.length === 0" class="fp-drop-hint">
          <i class="fa-solid fa-eye-slash"></i>
          <span>ここにドラッグして非表示</span>
        </div>
      </VueDraggable>
      <!-- 非表示中のフィールド一覧 -->
      <div v-if="hiddenFieldDefs.length" class="fp-hidden-list">
        <div v-for="item in hiddenFieldDefs" :key="item.key" class="fp-item fp-item-hidden">
          <i class="fa-solid fa-eye-slash"></i>
          <span>{{ item.label }}</span>
          <button class="fp-restore-btn" @click="emit('restore-field', item.key)" title="表示に戻す">
            <i class="fa-solid fa-eye"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 選択肢編集（selectフィールド選択時） -->
    <div v-if="selectedField && selectedField.component === 'select'" class="fp-section fp-options-editor">
      <div class="fp-section-label">選択肢編集: {{ selectedField.label }}</div>
      <div class="fp-options-list">
        <div v-for="(opt, idx) in editingOptions" :key="idx" class="fp-option-row">
          <input
            type="text"
            v-model="opt.label"
            class="fp-option-input"
            placeholder="表示名"
            @blur="syncOptions"
          />
          <button class="fp-option-delete" @click="removeOption(idx)" title="削除">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
      <button class="fp-option-add" @click="addOption">
        <i class="fa-solid fa-plus"></i> 選択肢を追加
      </button>
    </div>

    <!-- 選択中フィールドのプロパティ編集 -->
    <div v-if="selectedField && selectedField.component !== 'heading' && selectedField.component !== 'spacer'" class="fp-section">
      <div class="fp-section-label">フィールド設定: {{ selectedField.label }}</div>
      <div class="fp-field-key">内部キー: <code>{{ selectedField.key }}</code></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import type { FieldDef, FieldComponent, FieldOption } from '@/types/fieldLayout';
import { FIELD_COMPONENT_OPTIONS } from '@/types/fieldLayout';

interface PaletteItem {
  key: string;
  label: string;
  icon: string;
  component: FieldComponent;
}

/** コンポーネント→アイコンのマップ */
const COMPONENT_ICON_MAP: Record<string, string> = {
  text: 'fa-solid fa-font',
  number: 'fa-solid fa-hashtag',
  date: 'fa-solid fa-calendar',
  select: 'fa-solid fa-list',
  checkbox: 'fa-solid fa-square-check',
  textarea: 'fa-solid fa-align-left',
  amount: 'fa-solid fa-yen-sign',
  url: 'fa-solid fa-link',
  email: 'fa-solid fa-envelope',
  file: 'fa-solid fa-paperclip',
  heading: 'fa-solid fa-heading',
  spacer: 'fa-solid fa-arrows-up-down',
};

/** 構造部材のコンポーネント種別 */
const STRUCTURE_COMPONENTS = new Set<string>(['heading', 'spacer']);

/** FIELD_COMPONENT_OPTIONSから自動生成 */
const structureParts = ref<PaletteItem[]>(
  FIELD_COMPONENT_OPTIONS
    .filter(o => STRUCTURE_COMPONENTS.has(o.value))
    .map(o => ({
      key: `_palette_${o.value}`,
      label: o.label,
      icon: COMPONENT_ICON_MAP[o.value] || 'fa-solid fa-cube',
      component: o.value,
    }))
);

const fieldParts = ref<PaletteItem[]>(
  FIELD_COMPONENT_OPTIONS
    .filter(o => !STRUCTURE_COMPONENTS.has(o.value))
    .map(o => ({
      key: `_palette_${o.value}`,
      label: o.label,
      icon: COMPONENT_ICON_MAP[o.value] || 'fa-solid fa-cube',
      component: o.value,
    }))
);

const props = defineProps<{
  /** D&Dグループ名（DraggableFieldGridと同じ名前にする） */
  dragGroup: string;
  /** 全フィールド定義（非表示中のフィールドを検出するため） */
  allFields: FieldDef[];
  /** 非表示フィールドキー一覧 */
  hiddenKeys: string[];
  /** 選択中のフィールド（左カラムでクリックされたフィールド） */
  selectedField?: FieldDef | null;
  /** カスタム選択肢（fieldKey -> FieldOption[]） */
  fieldOptions?: Record<string, FieldOption[]>;
}>();

const emit = defineEmits<{
  (e: 'restore-field', key: string): void;
  (e: 'hide-field', key: string): void;
  (e: 'delete-field', key: string): void;
  (e: 'update:fieldOptions', key: string, options: FieldOption[]): void;
}>();

/** 非表示中のフィールド定義 */
const hiddenFieldDefs = computed(() =>
  props.allFields.filter(f => props.hiddenKeys.includes(f.key))
);

/** ゴミ箱ドロップ受け */
const trashBin = ref<FieldDef[]>([]);
/** 非表示ドロップ受け */
const hideBin = ref<FieldDef[]>([]);

/** ゴミ箱にドロップされた時 */
const onTrashDrop = () => {
  for (const f of trashBin.value) {
    if (f.key.startsWith('custom_') || f.component === 'heading' || f.component === 'spacer') {
      emit('delete-field', f.key);
    }
  }
  trashBin.value = [];
};

/** 非表示エリアにドロップされた時 */
const onHideDrop = () => {
  for (const f of hideBin.value) {
    emit('hide-field', f.key);
  }
  hideBin.value = [];
};

/** 構造部材のクローン（ユニークキー生成） */
const cloneStructurePart = (item: PaletteItem): FieldDef => ({
  key: `${item.component}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
  label: item.component === 'heading' ? '新しいタイトル' : '',
  section: '',
  component: item.component,
  widthPercent: 100,
  order: 9999,
  headingSize: item.component === 'heading' ? 14 : undefined,
  headingBg: item.component === 'heading' ? '#4a8dc9' : undefined,
  spacerHeight: item.component === 'spacer' ? 20 : undefined,
});

/** フィールド部材のクローン（ユニークキー生成） */
const cloneFieldPart = (item: PaletteItem): FieldDef => ({
  key: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
  label: `新規${item.label}`,
  section: '',
  component: item.component,
  widthPercent: 20,
  order: 9999,
  options: item.component === 'select' ? [] : undefined,
});

// ============================================================
// 選択肢編集
// ============================================================

/** 編集中の選択肢リスト */
const editingOptions = ref<FieldOption[]>([]);

/** 選択中フィールドが変わったら選択肢を読み込み */
watch(() => props.selectedField, (field) => {
  if (field && field.component === 'select') {
    const saved = props.fieldOptions?.[field.key];
    const fromDef = Array.isArray(field.options) ? field.options : [];
    editingOptions.value = [...(saved ?? fromDef)];
  } else {
    editingOptions.value = [];
  }
}, { immediate: true });

/** 選択肢を追加 */
const addOption = () => {
  const idx = editingOptions.value.length + 1;
  editingOptions.value.push({ value: `opt_${idx}`, label: `選択肢${idx}` });
  syncOptions();
};

/** 選択肢を削除 */
const removeOption = (idx: number) => {
  editingOptions.value.splice(idx, 1);
  syncOptions();
};

/** 親に選択肢変更を通知 */
const syncOptions = () => {
  if (!props.selectedField) return;
  // valueをlabelから自動生成（人間がlabelだけ編集すればよい）
  const opts = editingOptions.value.map((o, i) => ({
    value: o.value || `opt_${i + 1}`,
    label: o.label || `選択肢${i + 1}`,
  }));
  emit('update:fieldOptions', props.selectedField.key, opts);
};
</script>

<style scoped>
.fp-palette {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow-y: auto;
  padding: 8px;
  background: #f8fafc;
  border-left: 1px solid #e2e8f0;
  border-radius: 0;
}
.fp-title {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  margin: 0;
  padding: 0 4px 8px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.fp-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fp-section-label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 4px;
}
.fp-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-height: 10px;
}
.fp-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: grab;
  transition: all 0.15s;
  user-select: none;
}
.fp-item:hover {
  transform: translateX(2px);
}
.fp-item:active {
  cursor: grabbing;
}
.fp-item i {
  width: 14px;
  text-align: center;
  font-size: 11px;
}
.fp-item-structure {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}
.fp-item-structure:hover {
  background: #bfdbfe;
}
.fp-item-field {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #86efac;
}
.fp-item-field:hover {
  background: #dcfce7;
}
.fp-item-hidden {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}
.fp-item-hidden:hover {
  background: #fde68a;
}
.fp-restore-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: #92400e;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 11px;
}
.fp-restore-btn:hover {
  background: rgba(0,0,0,0.1);
}
/* ドロップゾーン共通 */
.fp-drop-zone {
  min-height: 48px;
  border: 2px dashed #cbd5e1;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  position: relative;
}
.fp-drop-zone-active {
  min-height: 0;
}
.fp-drop-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #94a3b8;
  font-size: 11px;
  pointer-events: none;
}
.fp-drop-hint i {
  font-size: 16px;
}
/* ゴミ箱ゾーン */
.fp-drop-trash {
  border-color: #fca5a5;
  background: #fef2f2;
}
.fp-drop-trash:hover,
.fp-drop-trash.sortable-drag-over {
  border-color: #ef4444;
  background: #fee2e2;
}
.fp-drop-trash .fp-drop-hint {
  color: #dc2626;
}
/* 非表示ゾーン */
.fp-drop-hide {
  border-color: #fcd34d;
  background: #fffbeb;
}
.fp-drop-hide:hover,
.fp-drop-hide.sortable-drag-over {
  border-color: #f59e0b;
  background: #fef3c7;
}
.fp-drop-hide .fp-drop-hint {
  color: #d97706;
}
/* 非表示一覧 */
.fp-hidden-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 4px;
}
/* 選択肢編集 */
.fp-options-editor {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 8px;
}
.fp-options-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fp-option-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.fp-option-input {
  flex: 1;
  padding: 4px 6px;
  border: 1px solid #cbd5e1;
  border-radius: 3px;
  font-size: 12px;
}
.fp-option-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}
.fp-option-delete {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 2px 4px;
  font-size: 11px;
}
.fp-option-delete:hover {
  background: #fee2e2;
  border-radius: 3px;
}
.fp-option-add {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 5px 8px;
  margin-top: 4px;
  background: #dbeafe;
  border: 1px dashed #93c5fd;
  border-radius: 4px;
  color: #1e40af;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}
.fp-option-add:hover {
  background: #bfdbfe;
}
.fp-field-key {
  font-size: 10px;
  color: #94a3b8;
  padding: 2px 4px;
}
.fp-field-key code {
  background: #e2e8f0;
  padding: 1px 4px;
  border-radius: 2px;
  font-family: monospace;
}
</style>
