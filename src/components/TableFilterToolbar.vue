<template>
  <div class="tft-toolbar">
    <div class="tft-toolbar-left">
      <!-- ステータスフィルター（ドロップダウン） -->
      <div class="tft-filter-group">
        <select v-model="localStatus" class="tft-filter-select" @change="emitChange">
          <option value="">全ステータス</option>
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <!-- 表示列（ドロップダウン） -->
      <div class="tft-filter-group">
        <div class="tft-column-dropdown-wrap">
          <button class="tft-filter-select tft-column-toggle-btn" @click.stop="showColumnDropdown = !showColumnDropdown">
            <i class="fa-solid fa-table-columns"></i> 表示列
            <i class="fa-solid fa-chevron-down tft-chevron"></i>
          </button>
          <div v-if="showColumnDropdown" class="tft-column-dropdown" @click.stop>
            <label v-for="col in columns" :key="col.key" class="tft-column-dropdown-item">
              <input type="checkbox" :value="col.key" v-model="localVisibleCols">
              <span>{{ col.label }}</span>
            </label>
          </div>
        </div>
      </div>
      <!-- ファンネルアイコン（フィルター適用） -->
      <button class="tft-filter-funnel" :class="{ active: localStatus }" @click="emitChange" title="フィルター適用">
        <i class="fa-solid fa-filter"></i>
      </button>
      <span class="tft-page-info">全{{ totalCount }}件</span>
    </div>
    <div class="tft-toolbar-right">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

/** 列定義 */
export interface ColumnDef {
  key: string
  label: string
}

/** ステータス選択肢 */
export interface StatusOption {
  value: string
  label: string
}

const props = defineProps<{
  /** ステータス選択肢 */
  statusOptions: StatusOption[]
  /** 現在のステータスフィルター値 */
  statusFilter: string
  /** 全列定義 */
  columns: ColumnDef[]
  /** 現在の表示列キー配列 */
  visibleColumns: string[]
  /** 表示中の件数 */
  totalCount: number
}>()

const emit = defineEmits<{
  (e: 'update:statusFilter', value: string): void
  (e: 'update:visibleColumns', value: string[]): void
  (e: 'filterChange'): void
}>()

// ローカルstate
const localStatus = ref(props.statusFilter)
const localVisibleCols = ref<string[]>([...props.visibleColumns])
const showColumnDropdown = ref(false)

// propsからの同期
watch(() => props.statusFilter, (v) => { localStatus.value = v })
watch(() => props.visibleColumns, (v) => { localVisibleCols.value = [...v] }, { deep: true })

// ステータス変更時
watch(localStatus, (v) => {
  emit('update:statusFilter', v)
  emit('filterChange')
})

// 表示列変更時
watch(localVisibleCols, (v) => {
  emit('update:visibleColumns', [...v])
  emit('filterChange')
}, { deep: true })

const emitChange = () => {
  emit('update:statusFilter', localStatus.value)
  emit('update:visibleColumns', [...localVisibleCols.value])
  emit('filterChange')
}

// ドロップダウン外クリックで閉じる
const closeDropdown = () => { showColumnDropdown.value = false }
onMounted(() => document.addEventListener('click', closeDropdown))
onUnmounted(() => document.removeEventListener('click', closeDropdown))
</script>

<style scoped>
.tft-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 8px 0; }
.tft-toolbar-left { display: flex; align-items: center; gap: 12px; }
.tft-toolbar-right { display: flex; align-items: center; gap: 8px; }
.tft-filter-group { display: flex; align-items: center; }
.tft-filter-select { border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 10px; font-size: 12px; color: #334155; background: white; cursor: pointer; outline: none; }
.tft-filter-select:focus { border-color: #3b82f6; }
.tft-page-info { font-size: 12px; color: #64748b; }

/* ファンネルアイコン */
.tft-filter-funnel {
  width: 32px; height: 32px; border-radius: 6px;
  border: 1px solid #cbd5e1; background: white;
  color: #94a3b8; font-size: 13px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.tft-filter-funnel:hover { border-color: #3b82f6; color: #3b82f6; }
.tft-filter-funnel.active { background: #eff6ff; border-color: #3b82f6; color: #3b82f6; }

/* 表示列ドロップダウン */
.tft-column-dropdown-wrap { position: relative; }
.tft-column-toggle-btn {
  display: flex; align-items: center; gap: 4px;
  cursor: pointer; white-space: nowrap;
}
.tft-chevron { font-size: 9px; margin-left: 4px; }
.tft-column-dropdown {
  position: absolute; top: 100%; left: 0; z-index: 100;
  background: white; border: 1px solid #e2e8f0; border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  padding: 8px 0; min-width: 180px; max-height: 320px; overflow-y: auto;
}
.tft-column-dropdown-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 14px; font-size: 12px; cursor: pointer;
  transition: background 0.1s;
}
.tft-column-dropdown-item:hover { background: #f8fafc; }
.tft-column-dropdown-item input[type="checkbox"] { accent-color: #3b82f6; }
</style>
