<template>
  <div v-if="visible" class="afm-overlay" @click.self="close">
    <div class="afm-modal">
      <div class="afm-header">
        <h3>フィールド追加</h3>
        <button class="afm-close" @click="close">&times;</button>
      </div>
      <div class="afm-body">
        <div class="afm-row">
          <label class="afm-label">ラベル名</label>
          <input ref="labelInput" type="text" v-model="label" class="afm-input" placeholder="フィールド名を入力" @keydown.enter="add">
        </div>
        <div class="afm-row">
          <label class="afm-label">型</label>
          <select v-model="component" class="afm-select">
            <option value="text">テキスト</option>
            <option value="number">数値</option>
            <option value="date">日付</option>
            <option value="textarea">テキストエリア</option>
            <option value="select">選択</option>
            <option value="checkbox">チェック</option>
          </select>
        </div>
        <div class="afm-row">
          <label class="afm-label">セクション</label>
          <select v-model="section" class="afm-select">
            <option v-for="s in sectionKeys" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
      </div>
      <div class="afm-footer">
        <button class="afm-btn afm-btn-add" @click="add" :disabled="!label.trim()">追加</button>
        <button class="afm-btn afm-btn-cancel" @click="close">キャンセル</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { FieldComponent } from '@/types/fieldLayout';

const props = defineProps<{
  visible: boolean;
  sectionKeys: string[];
  defaultSection?: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'add', payload: { label: string; component: FieldComponent; section: string }): void;
}>();

const label = ref('');
const component = ref<FieldComponent>('text');
const section = ref('');
const labelInput = ref<HTMLInputElement | null>(null);

watch(() => props.visible, (v) => {
  if (v) {
    label.value = '';
    component.value = 'text';
    section.value = props.defaultSection || props.sectionKeys[0] || '';
    nextTick(() => labelInput.value?.focus());
  }
});

const close = () => emit('update:visible', false);

const add = () => {
  if (!label.value.trim()) return;
  emit('add', {
    label: label.value.trim(),
    component: component.value,
    section: section.value,
  });
  close();
};
</script>

<style scoped>
.afm-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.afm-modal { background: #fff; border-radius: 8px; width: 400px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
.afm-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid #e2e8f0; }
.afm-header h3 { margin: 0; font-size: 15px; font-weight: 700; color: #1e293b; }
.afm-close { background: none; border: none; font-size: 22px; cursor: pointer; color: #94a3b8; }
.afm-close:hover { color: #1e293b; }
.afm-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
.afm-row { display: flex; flex-direction: column; gap: 4px; }
.afm-label { font-size: 12px; font-weight: 600; color: #475569; }
.afm-input { padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; }
.afm-input:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
.afm-select { padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #fff; }
.afm-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 18px; border-top: 1px solid #e2e8f0; }
.afm-btn { border: none; padding: 8px 18px; border-radius: 4px; font-size: 13px; cursor: pointer; font-weight: 600; }
.afm-btn-add { background: #3b82f6; color: #fff; }
.afm-btn-add:hover { background: #2563eb; }
.afm-btn-add:disabled { background: #cbd5e1; cursor: not-allowed; }
.afm-btn-cancel { background: #f1f5f9; color: #475569; }
.afm-btn-cancel:hover { background: #e2e8f0; }
</style>
