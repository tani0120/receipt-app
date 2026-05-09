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

    <!-- 非表示中のフィールド -->
    <div v-if="hiddenFieldDefs.length" class="fp-section">
      <div class="fp-section-label">非表示中 ({{ hiddenFieldDefs.length }})</div>
      <VueDraggable
        v-model="hiddenFieldDefs"
        :group="{ name: dragGroup, pull: 'clone', put: false }"
        :sort="false"
        class="fp-list"
        item-key="key"
      >
        <template v-for="item in hiddenFieldDefs" :key="item.key">
          <div class="fp-item fp-item-hidden">
            <i class="fa-solid fa-eye-slash"></i>
            <span>{{ item.label }}</span>
            <button class="fp-restore-btn" @click="emit('restore-field', item.key)" title="表示に戻す">
              <i class="fa-solid fa-eye"></i>
            </button>
          </div>
        </template>
      </VueDraggable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import type { FieldDef, FieldComponent } from '@/types/fieldLayout';

interface PaletteItem {
  key: string;
  label: string;
  icon: string;
  component: FieldComponent;
}

const props = defineProps<{
  /** D&Dグループ名（DraggableFieldGridと同じ名前にする） */
  dragGroup: string;
  /** 全フィールド定義（非表示中のフィールドを検出するため） */
  allFields: FieldDef[];
  /** 非表示フィールドキー一覧 */
  hiddenKeys: string[];
}>();

const emit = defineEmits<{
  (e: 'restore-field', key: string): void;
}>();

/** 構造部材 */
const structureParts = ref<PaletteItem[]>([
  { key: '_palette_heading', label: 'タイトル', icon: 'fa-solid fa-heading', component: 'heading' },
  { key: '_palette_spacer', label: 'スペーサー', icon: 'fa-solid fa-arrows-up-down', component: 'spacer' },
]);

/** フィールド部材 */
const fieldParts = ref<PaletteItem[]>([
  { key: '_palette_text', label: 'テキスト', icon: 'fa-solid fa-font', component: 'text' },
  { key: '_palette_number', label: '数値', icon: 'fa-solid fa-hashtag', component: 'number' },
  { key: '_palette_date', label: '日付', icon: 'fa-solid fa-calendar', component: 'date' },
  { key: '_palette_select', label: '選択肢', icon: 'fa-solid fa-list', component: 'select' },
  { key: '_palette_checkbox', label: 'チェック', icon: 'fa-solid fa-square-check', component: 'checkbox' },
  { key: '_palette_textarea', label: 'テキストエリア', icon: 'fa-solid fa-align-left', component: 'textarea' },
  { key: '_palette_amount', label: '金額', icon: 'fa-solid fa-yen-sign', component: 'amount' },
  { key: '_palette_url', label: 'URL', icon: 'fa-solid fa-link', component: 'url' },
]);

/** 非表示中のフィールド定義 */
const hiddenFieldDefs = computed(() =>
  props.allFields.filter(f => props.hiddenKeys.includes(f.key))
);

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
});
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
</style>
