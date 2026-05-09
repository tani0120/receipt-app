<template>
  <div
    ref="wrapperRef"
    class="dfg-wrapper"
    :style="wrapperStyle"
  >
    <div ref="containerRef" class="dfg-container">
      <VueDraggable
        v-model="localFields"
        :disabled="!isLayoutEditing"
        :animation="200"
        ghost-class="dfg-ghost"
        drag-class="dfg-drag"
        handle=".dfg-handle"
        class="dfg-drag-area"
        @end="onDragEnd"
      >
        <template v-for="(field, idx) in localFields" :key="field.key">
          <!-- フィールド本体 -->
          <div
            class="dfg-item"
            :style="itemStyle(field)"
          >
            <!-- ドラッグハンドル（レイアウト編集モード時のみ表示） -->
            <div v-if="isLayoutEditing" class="dfg-handle" title="ドラッグで移動">
              <i class="fa-solid fa-grip-vertical"></i>
            </div>

            <!-- ラベル（DFGが常に管理） -->
            <div class="dfg-label-area">
              <input
                v-if="isLayoutEditing"
                type="text"
                :value="field.label"
                class="dfg-label-input"
                @blur="onLabelBlur(field.key, $event)"
                @keydown.enter="($event.target as HTMLInputElement).blur()"
              >
              <label v-else class="dfg-label">{{ field.label }}</label>
            </div>

            <!-- フィールド本体（スロット or 自動レンダリング） -->
            <div class="dfg-content">
              <slot :name="field.key" :field="field">
                <!-- デフォルトフォールバック: field.component に基づく自動レンダリング -->
                <div v-if="formData" class="ce-field" :class="field.cssClass">
                  <!-- readonly -->
                  <template v-if="field.component === 'readonly' || field.alwaysReadonly">
                    <span class="ce-readonly" :class="field.cssClass">{{ getFieldDisplayValue(field) }}</span>
                  </template>
                  <!-- text -->
                  <template v-else-if="field.component === 'text'">
                    <input v-if="isEditing" type="text" :value="getFieldValue(field)" @input="setFieldValue(field, ($event.target as HTMLInputElement).value)" class="ce-input" :class="{ 'ce-w-sm': field.smallWidth }" :placeholder="field.placeholder" :maxlength="field.maxLength">
                    <span v-else class="ce-readonly">{{ getFieldDisplayValue(field) }}</span>
                  </template>
                  <!-- number -->
                  <template v-else-if="field.component === 'number'">
                    <input v-if="isEditing" type="number" :value="getFieldValue(field)" @input="setFieldValue(field, Number(($event.target as HTMLInputElement).value))" class="ce-input" :class="{ 'ce-w-sm': field.smallWidth }" :min="field.min">
                    <span v-else class="ce-readonly">{{ getFieldValue(field) != null ? getFieldValue(field) + '名' : '—' }}</span>
                  </template>
                  <!-- date -->
                  <template v-else-if="field.component === 'date'">
                    <input v-if="isEditing" type="date" :value="getFieldValue(field)" @input="setFieldValue(field, ($event.target as HTMLInputElement).value)" class="ce-input ce-w-sm">
                    <span v-else class="ce-readonly">{{ getFieldDisplayValue(field) }}</span>
                  </template>
                  <!-- url -->
                  <template v-else-if="field.component === 'url'">
                    <input v-if="isEditing" type="url" :value="getFieldValue(field)" @input="setFieldValue(field, ($event.target as HTMLInputElement).value)" class="ce-input" :placeholder="field.placeholder">
                    <span v-else class="ce-readonly">{{ getFieldDisplayValue(field) }}</span>
                  </template>
                  <!-- email -->
                  <template v-else-if="field.component === 'email'">
                    <input v-if="isEditing" type="email" :value="getFieldValue(field)" @input="setFieldValue(field, ($event.target as HTMLInputElement).value)" class="ce-input" :placeholder="field.placeholder">
                    <span v-else class="ce-readonly">{{ getFieldDisplayValue(field) }}</span>
                  </template>
                  <!-- select -->
                  <template v-else-if="field.component === 'select'">
                    <template v-if="isEditing">
                      <select :value="getFieldValue(field)" @change="setFieldValue(field, ($event.target as HTMLSelectElement).value)" class="ce-select">
                        <option v-for="o in getResolvedOptions(field)" :key="String(o.value)" :value="o.value">{{ o.label }}</option>
                      </select>
                    </template>
                    <span v-else class="ce-readonly">{{ getSelectLabel(field) }}</span>
                  </template>
                  <!-- textarea -->
                  <template v-else-if="field.component === 'textarea'">
                    <textarea v-if="isEditing" :value="getFieldValue(field) as string" @input="setFieldValue(field, ($event.target as HTMLTextAreaElement).value)" class="ce-input ce-textarea" rows="3" :placeholder="field.placeholder"></textarea>
                    <span v-else class="ce-readonly ce-pre-wrap">{{ getFieldDisplayValue(field) }}</span>
                  </template>
                  <!-- checkbox -->
                  <template v-else-if="field.component === 'checkbox'">
                    <template v-if="isEditing">
                      <label class="ce-checkbox"><input type="checkbox" :checked="!!getFieldValue(field)" @change="setFieldValue(field, ($event.target as HTMLInputElement).checked)"><span>{{ field.label }}</span></label>
                    </template>
                    <span v-else class="ce-readonly">{{ getFieldValue(field) ? '✅ あり' : '☐ なし' }}</span>
                  </template>
                  <!-- amount -->
                  <template v-else-if="field.component === 'amount'">
                    <template v-if="isEditing">
                      <div class="ce-amount">
                        <input type="number" :value="getFieldValue(field)" @input="setFieldValue(field, Number(($event.target as HTMLInputElement).value))" class="ce-input ce-w-sm" :min="field.min">
                        <span>円</span>
                      </div>
                    </template>
                    <span v-else class="ce-readonly">{{ (getFieldValue(field) ?? 0).toLocaleString() }} 円</span>
                  </template>
                  <!-- staffSelect -->
                  <template v-else-if="field.component === 'staffSelect'">
                    <template v-if="isEditing">
                      <select :value="getFieldValue(field)" @change="setFieldValue(field, ($event.target as HTMLSelectElement).value)" class="ce-select">
                        <option value="">{{ PLACEHOLDER_UNSET }}</option>
                        <option v-for="s in (staffList ?? [])" :key="s.uuid" :value="s.uuid">{{ s.name }}</option>
                      </select>
                    </template>
                    <span v-else class="ce-readonly">{{ getStaffLabel(field) }}</span>
                  </template>
                  <!-- その他: フォールバック -->
                  <template v-else>
                    <span class="ce-readonly">{{ getFieldDisplayValue(field) }}</span>
                  </template>
                  <!-- ヒント表示 -->
                  <span v-if="field.hint && isEditing" class="ce-hint">{{ field.hint }}</span>
                </div>
                <div v-else class="ce-field">
                  <span class="ce-readonly">—</span>
                </div>
              </slot>
            </div>

            <!-- リサイズハンドル（レイアウト編集モード時のみ） -->
            <div
              v-if="isLayoutEditing"
              class="dfg-resize"
              :title="UI_MSG.ドラッグ横幅変更"
              @mousedown="startWidthResize($event, idx)"
            >
              <i class="fa-solid fa-grip-lines-vertical"></i>
            </div>
            <!-- コピーボタン（常時、ホバーで表示） -->
            <button
              v-if="!isLayoutEditing"
              class="dfg-copy-btn"
              :title="UI_MSG.値をコピー"
              @click="copyFieldValue(field.key)"
            ><i class="fa-regular fa-copy"></i></button>

            <button
              v-if="isLayoutEditing"
              class="dfg-linebreak-btn"
              :class="{ active: field.lineBreakAfter }"
              :title="field.lineBreakAfter ? UI_MSG.行区切り解除 : UI_MSG.この後で改行"
              @click="toggleLineBreak(idx)"
            >↵</button>

            <!-- 非表示ボタン（レイアウト編集時） -->
            <button
              v-if="isLayoutEditing"
              class="dfg-hide-btn"
              :title="UI_MSG.フィールド非表示"
              @click="emit('hide-field', field.key)"
            >×</button>

            <!-- 幅%表示（レイアウト編集時） -->
            <span v-if="isLayoutEditing" class="dfg-width-label">{{ Math.round(field.widthPercent) }}%</span>
          </div>

          <!-- 行区切り: 100%幅の不可視ブロックで強制改行 -->
          <div
            v-if="field.lineBreakAfter"
            :key="'break-' + field.key"
            class="dfg-line-break"
          ></div>
        </template>
      </VueDraggable>

      <!-- ＋フィールド追加ボタン（レイアウト編集時） -->
      <button
        v-if="isLayoutEditing"
        class="dfg-add-field-btn"
        @click="emit('add-field')"
      >
        <i class="fa-solid fa-plus"></i> フィールド追加
      </button>
    </div>

    <!-- セクション縦幅リサイズハンドル -->
    <div
      v-if="isLayoutEditing"
      class="dfg-height-handle"
      :title="UI_MSG.ドラッグ高さ変更"
      @mousedown="startHeightResize"
    >
      <span class="dfg-height-handle-icon">⋯</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import type { FieldDef, FieldOption } from '@/types/fieldLayout';
import { PLACEHOLDER_UNSET } from '@/constants/clientOptions';
import { UI_MSG } from '@/constants/uiMessages';

const props = defineProps<{
  /** 表示するフィールド一覧（order順） */
  fields: FieldDef[];
  /** レイアウト編集モードか */
  isLayoutEditing: boolean;
  /** セクションの高さ（px, undefined=auto） */
  sectionHeight?: number;
  /** フォームデータ（自動レンダリング用、任意） */
  formData?: Record<string, unknown>;
  /** 編集モードか（自動レンダリング用、任意） */
  isEditing?: boolean;
  /** 選択肢文字列→配列を解決する関数（自動レンダリング用、任意） */
  resolveOptions?: (optionsKey: string) => readonly FieldOption[];
  /** スタッフリスト（staffSelect用、任意） */
  staffList?: { uuid: string; name: string }[];
}>();

const emit = defineEmits<{
  (e: 'update:order', keys: string[]): void;
  (e: 'update:width', key: string, widthPercent: number): void;
  (e: 'update:lineBreak', key: string, value: boolean): void;
  (e: 'update:sectionHeight', height: number): void;
  (e: 'hide-field', key: string): void;
  (e: 'label-edit', key: string, newLabel: string): void;
  (e: 'add-field'): void;
  (e: 'update:fieldValue', key: string, value: unknown): void;
}>();

/** フォームからフィールド値を取得 */
const getFieldValue = (field: FieldDef): unknown => {
  if (!props.formData) return undefined;
  const key = field.modelKey || field.key;
  return props.formData[key];
};

/** フォームにフィールド値を設定 */
const setFieldValue = (field: FieldDef, value: unknown) => {
  const key = field.modelKey || field.key;
  emit('update:fieldValue', key, value);
};

/** 表示用テキスト取得 */
const getFieldDisplayValue = (field: FieldDef): string => {
  const val = getFieldValue(field);
  if (val == null || val === '') return '—';
  return String(val);
};

/** 選択肢を解決 */
const getResolvedOptions = (field: FieldDef): readonly FieldOption[] => {
  if (!field.options) return [];
  if (Array.isArray(field.options)) return field.options;
  // 文字列参照 → resolveOptions関数で解決
  if (props.resolveOptions) return props.resolveOptions(field.options);
  return [];
};

/** select系フィールドの表示ラベル取得 */
const getSelectLabel = (field: FieldDef): string => {
  const val = getFieldValue(field);
  if (val == null || val === '') return '—';
  const opts = getResolvedOptions(field);
  const found = opts.find(o => String(o.value) === String(val));
  return found ? found.label : String(val);
};

/** スタッフ名取得 */
const getStaffLabel = (field: FieldDef): string => {
  const val = getFieldValue(field);
  if (!val) return UI_MSG.未設定;
  const staff = (props.staffList ?? []).find(s => s.uuid === val);
  return staff ? staff.name : UI_MSG.未設定;
};

const wrapperRef = ref<HTMLElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);

/** ローカルフィールド（D&D用） */
const localFields = ref<FieldDef[]>([...(props.fields ?? [])]);

/** propsのfields変更を監視 */
watch(() => props.fields, (nv) => {
  localFields.value = [...(nv ?? [])];
}, { deep: true });

/** ラッパースタイル（セクション高さ制御） */
const wrapperStyle = computed(() => {
  const s: Record<string, string> = {};
  if (props.sectionHeight && props.sectionHeight > 0) {
    s['height'] = `${props.sectionHeight}px`;
    s['overflow-y'] = 'auto';
  }
  return s;
});

/** 各アイテムのスタイル */
const itemStyle = (field: FieldDef) => {
  return {
    width: `${field.widthPercent}%`,
    'flex-shrink': '0',
    'flex-grow': '0',
  };
};

/** D&D終了時 */
const onDragEnd = () => {
  emit('update:order', localFields.value.map(f => f.key));
};

/** 行区切りトグル */
const toggleLineBreak = (index: number) => {
  const field = localFields.value[index];
  if (!field) return;
  field.lineBreakAfter = !field.lineBreakAfter;
  emit('update:lineBreak', field.key, !!field.lineBreakAfter);
};

/** ラベル編集完了時 */
const onLabelBlur = (key: string, event: Event) => {
  const input = event.target as HTMLInputElement;
  const newLabel = input.value.trim();
  if (newLabel) {
    emit('label-edit', key, newLabel);
  }
};

/** フィールド値をコピー */
const copyFieldValue = (key: string) => {
  // DOMからフィールドの値を取得
  const container = containerRef.value;
  if (!container) return;
  const fieldEl = container.querySelector(`[data-field-key="${key}"]`);
  if (!fieldEl) {
    // data-field-keyがない場合はテキストコンテンツから取得
    const items = container.querySelectorAll('.dfg-item');
    for (let i = 0; i < localFields.value.length; i++) {
      const item = items[i];
      if (localFields.value[i]?.key === key && item) {
        const content = item.querySelector('.dfg-content');
        if (content) {
          const text = (content as HTMLElement).innerText?.trim() || '';
          navigator.clipboard.writeText(text);
          const btn = item.querySelector('.dfg-copy-btn') as HTMLElement;
          if (btn) {
            btn.classList.add('dfg-copied');
            setTimeout(() => btn.classList.remove('dfg-copied'), 800);
          }
        }
        break;
      }
    }
  }
};

/** ─── 横幅リサイズ（%単位） ─── */
let resizingIndex = -1;
let startX = 0;
let startWidthPct = 20;
let containerWidth = 0;

const startWidthResize = (e: MouseEvent, index: number) => {
  e.preventDefault();
  const field = localFields.value[index];
  if (!field) return;
  resizingIndex = index;
  startX = e.clientX;
  startWidthPct = field.widthPercent;

  // コンテナ幅を取得（100%の基準）
  if (containerRef.value) {
    containerWidth = containerRef.value.clientWidth;
  }

  document.addEventListener('mousemove', onWidthResizeMove);
  document.addEventListener('mouseup', onWidthResizeEnd);
};

const onWidthResizeMove = (e: MouseEvent) => {
  if (resizingIndex < 0 || !containerWidth) return;
  const dx = e.clientX - startX;
  const deltaPct = (dx / containerWidth) * 100;
  const newPct = Math.max(5, Math.min(100, startWidthPct + deltaPct));

  // reactiveに更新
  const updated = [...localFields.value];
  const current = updated[resizingIndex];
  if (!current) return;
  updated[resizingIndex] = { ...current, widthPercent: newPct } as FieldDef;
  localFields.value = updated;
};

const onWidthResizeEnd = () => {
  if (resizingIndex >= 0) {
    const field = localFields.value[resizingIndex];
    if (field) {
      emit('update:width', field.key, field.widthPercent);
    }
  }
  resizingIndex = -1;
  document.removeEventListener('mousemove', onWidthResizeMove);
  document.removeEventListener('mouseup', onWidthResizeEnd);
};

/** ─── セクション縦幅リサイズ ─── */
let startY = 0;
let startHeight = 0;

const startHeightResize = (e: MouseEvent) => {
  e.preventDefault();
  startY = e.clientY;
  const el = wrapperRef.value;
  startHeight = el ? el.offsetHeight : 200;
  document.addEventListener('mousemove', onHeightResizeMove);
  document.addEventListener('mouseup', onHeightResizeEnd);
};

const onHeightResizeMove = (e: MouseEvent) => {
  const dy = e.clientY - startY;
  const newHeight = Math.max(80, startHeight + dy);
  if (wrapperRef.value) {
    wrapperRef.value.style.height = `${newHeight}px`;
    wrapperRef.value.style.overflowY = 'auto';
  }
};

const onHeightResizeEnd = () => {
  if (wrapperRef.value) {
    const h = wrapperRef.value.offsetHeight;
    emit('update:sectionHeight', h);
  }
  document.removeEventListener('mousemove', onHeightResizeMove);
  document.removeEventListener('mouseup', onHeightResizeEnd);
};

/** クリーンアップ */
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onWidthResizeMove);
  document.removeEventListener('mouseup', onWidthResizeEnd);
  document.removeEventListener('mousemove', onHeightResizeMove);
  document.removeEventListener('mouseup', onHeightResizeEnd);
});
</script>

<style scoped>
.dfg-wrapper {
  position: relative;
}

.dfg-container {
  width: 100%;
}

.dfg-drag-area {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 0;
  width: 100%;
}

.dfg-item {
  display: flex;
  align-items: stretch;
  position: relative;
  min-width: 0;
  box-sizing: border-box;
  padding: 0 4px;
}

.dfg-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  cursor: grab;
  color: #aaa;
  font-size: 10px;
  flex-shrink: 0;
  border-right: 1px dashed #ddd;
  margin-right: 4px;
  transition: color 0.15s;
}
.dfg-handle:hover {
  color: #4a8dc9;
}
.dfg-handle:active {
  cursor: grabbing;
}

.dfg-content {
  flex: 1;
  min-width: 0;
}

.dfg-resize {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  cursor: col-resize;
  color: #ccc;
  font-size: 10px;
  flex-shrink: 0;
  margin-left: 2px;
  transition: color 0.15s;
}
.dfg-resize:hover {
  color: #4a8dc9;
}

/* 幅%表示ラベル */
.dfg-width-label {
  position: absolute;
  top: 0;
  right: 14px;
  font-size: 9px;
  color: #999;
  background: rgba(255,255,255,0.8);
  padding: 0 2px;
  border-radius: 2px;
  pointer-events: none;
}

/* 行区切りボタン */
.dfg-linebreak-btn {
  position: absolute;
  bottom: 0;
  right: 14px;
  width: 18px;
  height: 18px;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 3px;
  color: #999;
  cursor: pointer;
  padding: 0;
  opacity: 0.6;
  transition: all 0.15s;
}
.dfg-linebreak-btn:hover {
  opacity: 1;
  background: #e0ecf7;
  color: #2563eb;
}
.dfg-linebreak-btn.active {
  opacity: 1;
  background: #dbeafe;
  color: #2563eb;
  border-color: #93c5fd;
}

/* 非表示ボタン */
.dfg-hide-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: #fee2e2;
  color: #dc2626;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: all 0.15s;
  z-index: 5;
}
.dfg-hide-btn:hover {
  opacity: 1;
  background: #fca5a5;
  transform: scale(1.2);
}

/* コピーボタン */
.dfg-copy-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 4px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.3;
  transition: all 0.15s;
  z-index: 5;
}
.dfg-item:hover .dfg-copy-btn {
  opacity: 0.7;
}
.dfg-copy-btn:hover {
  opacity: 1 !important;
  background: #dbeafe;
  color: #2563eb;
}
.dfg-copy-btn.dfg-copied {
  opacity: 1 !important;
  background: #dcfce7;
  color: #16a34a;
}

/* 行区切り（強制改行） */
.dfg-line-break {
  width: 100%;
  height: 0;
  flex-basis: 100%;
}

/* セクション縦幅リサイズハンドル */
.dfg-height-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 12px;
  cursor: row-resize;
  background: linear-gradient(to bottom, transparent, #f0f0f0);
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  transition: background 0.15s;
  user-select: none;
}
.dfg-height-handle:hover {
  background: linear-gradient(to bottom, transparent, #dbeafe);
}
.dfg-height-handle-icon {
  font-size: 14px;
  color: #aaa;
  letter-spacing: 2px;
  line-height: 1;
}
.dfg-height-handle:hover .dfg-height-handle-icon {
  color: #2563eb;
}

/* ドラッグ中のゴースト */
.dfg-ghost {
  opacity: 0.4;
  background: #e8f0fe;
  border: 2px dashed #4a8dc9;
  border-radius: 4px;
}

/* ドラッグ中のアイテム */
.dfg-drag {
  opacity: 0.9;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  background: #fff;
}

/* ラベルエリア */
.dfg-label-area {
  padding: 2px 4px 0;
}
.dfg-label-input {
  width: 100%;
  padding: 2px 4px;
  border: 1px solid #93c5fd;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  color: #1e293b;
  background: #eff6ff;
  box-sizing: border-box;
}
.dfg-label-input:focus {
  border-color: #3b82f6;
  outline: none;
  box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
}

/* 通常時のラベル */
.dfg-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin: 0;
  padding: 0 0 2px;
}

/* ＋フィールド追加ボタン */
.dfg-add-field-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  margin: 4px;
  border: 1px dashed #93c5fd;
  border-radius: 4px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.dfg-add-field-btn:hover {
  background: #dbeafe;
  border-color: #3b82f6;
}
</style>
