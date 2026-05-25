<template>
  <div class="ai-cmd-browser">
    <div class="ai-cmd-browser-header">
      <span class="ai-cmd-browser-title">コマンドを探す</span>
      <button class="ai-cmd-browser-close" @click="$emit('close')" title="閉じる">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <!-- 検索 -->
    <div class="ai-cmd-search-wrap">
      <i class="fa-solid fa-magnifying-glass ai-cmd-search-icon"></i>
      <input
        ref="searchRef"
        v-model="searchText"
        class="ai-cmd-search"
        placeholder="コマンド名・説明で検索..."
        @input="filterCommands"
      />
    </div>

    <!-- カテゴリタブ -->
    <div class="ai-cmd-tabs">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="ai-cmd-tab"
        :class="{ 'ai-cmd-tab--active': activeCat === cat.key }"
        @click="activeCat = cat.key"
      >{{ cat.label }}
        <span class="ai-cmd-tab-count">{{ getCatCount(cat.key) }}</span>
      </button>
    </div>

    <!-- コマンドリスト -->
    <div class="ai-cmd-list">
      <button
        v-for="cmd in filteredCommands"
        :key="cmd.id"
        class="ai-cmd-item"
        @click="$emit('select', cmd)"
      >
        <div class="ai-cmd-item-top">
          <span class="ai-cmd-item-name">{{ cmd.name }}</span>
          <span v-if="cmd.actionType === 'direct_api'" class="ai-cmd-badge ai-cmd-badge--direct">⚡ 直接実行</span>
          <span v-else-if="cmd.actionType === 'ai_fc'" class="ai-cmd-badge ai-cmd-badge--ai">🤖 AI分析</span>
          <span v-else class="ai-cmd-badge ai-cmd-badge--mcp">📡 MCP</span>
        </div>
        <span class="ai-cmd-item-desc">{{ cmd.desc }}</span>
      </button>
      <div v-if="filteredCommands.length === 0" class="ai-cmd-empty">
        該当するコマンドがありません
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * AiCommandBrowser.vue — コマンドブラウザ（カテゴリタブ+検索フィルタ）
 *
 * 準拠:
 *   - 35_parts_catalog.md 基盤（チャットUI）コマンドブラウザ
 *   - 36_infra_ui.md §2-12 「その他のコマンドを見る」
 */
import { ref, computed, onMounted, nextTick } from 'vue'
import type { CommandDef } from '@/api/services/commandCatalog'

export type CatalogCommand = Omit<CommandDef, 'keywords' | 'legacyIds'>

const props = defineProps<{
  catalog: CatalogCommand[]
}>()

defineEmits<{
  close: []
  select: [cmd: CatalogCommand]
}>()

const searchText = ref('')
const activeCat = ref('全て')
const searchRef = ref<HTMLInputElement | null>(null)

const categories = [
  { key: '全て', label: '全て' },
  { key: '仕訳', label: '仕訳' },
  { key: '分析', label: '分析' },
  { key: 'データ', label: 'データ' },
]

const filteredCommands = computed(() => {
  let list = props.catalog
  if (activeCat.value !== '全て') {
    list = list.filter(c => c.cat === activeCat.value)
  }
  if (searchText.value.trim()) {
    const q = searchText.value.trim().toLowerCase()
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
    )
  }
  return list
})

const getCatCount = (cat: string) => {
  if (cat === '全て') return props.catalog.length
  return props.catalog.filter(c => c.cat === cat).length
}

const filterCommands = () => {
  // リアクティブなので何もしなくてよい（inputイベントでv-model更新）
}

onMounted(() => {
  nextTick(() => searchRef.value?.focus())
})
</script>

<style scoped>
.ai-cmd-browser {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  max-height: 360px;
}

.ai-cmd-browser-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.ai-cmd-browser-title {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.ai-cmd-browser-close {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 4px;
  border-radius: 4px;
  transition: all 0.15s;
}

.ai-cmd-browser-close:hover {
  color: #475569;
  background: #e2e8f0;
}

/* 検索 */
.ai-cmd-search-wrap {
  position: relative;
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.ai-cmd-search-icon {
  position: absolute;
  left: 22px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 12px;
}

.ai-cmd-search {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 10px 6px 30px;
  font-size: 12.5px;
  outline: none;
  transition: border-color 0.15s;
}

.ai-cmd-search:focus {
  border-color: #818cf8;
  box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.12);
}

/* カテゴリタブ */
.ai-cmd-tabs {
  display: flex;
  gap: 2px;
  padding: 6px 12px;
  border-bottom: 1px solid #f1f5f9;
  overflow-x: auto;
}

.ai-cmd-tab {
  background: none;
  border: none;
  padding: 4px 10px;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.ai-cmd-tab:hover {
  background: #f1f5f9;
}

.ai-cmd-tab--active {
  background: #e0e7ff;
  color: #4f46e5;
  font-weight: 600;
}

.ai-cmd-tab-count {
  font-size: 10px;
  background: #e2e8f0;
  color: #64748b;
  padding: 1px 5px;
  border-radius: 8px;
}

.ai-cmd-tab--active .ai-cmd-tab-count {
  background: #c7d2fe;
  color: #4338ca;
}

/* コマンドリスト */
.ai-cmd-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px 8px;
}

.ai-cmd-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.12s;
  text-align: left;
}

.ai-cmd-item:hover {
  background: #e0e7ff;
}

.ai-cmd-item-name {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.ai-cmd-item:hover .ai-cmd-item-name {
  color: #4f46e5;
}

.ai-cmd-item-top {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-cmd-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 6px;
  font-weight: 600;
  white-space: nowrap;
}

.ai-cmd-badge--direct {
  background: #dcfce7;
  color: #166534;
}

.ai-cmd-badge--ai {
  background: #fef3c7;
  color: #92400e;
}

.ai-cmd-badge--mcp {
  background: #e0e7ff;
  color: #3730a3;
}

.ai-cmd-item-desc {
  font-size: 11px;
  color: #64748b;
  line-height: 1.3;
}

.ai-cmd-empty {
  text-align: center;
  padding: 24px;
  color: #94a3b8;
  font-size: 13px;
}
</style>
