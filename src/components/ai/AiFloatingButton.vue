<template>
  <button
    class="ai-floating-btn"
    :class="{ 'ai-floating-btn--open': isOpen }"
    @click="$emit('toggle')"
    title="AIコマンド"
  >
    <i v-if="!isOpen" class="fa-solid fa-robot"></i>
    <i v-else class="fa-solid fa-xmark"></i>
  </button>
</template>

<script setup lang="ts">
/**
 * AiFloatingButton.vue — 右下固定ボタン（AIチャット開閉）
 *
 * 準拠: 35_parts_catalog.md 基盤（チャットUI）
 */
defineProps<{
  isOpen: boolean
}>()

defineEmits<{
  toggle: []
}>()
</script>

<style scoped>
.ai-floating-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 22px;
  cursor: pointer;
  box-shadow:
    0 4px 14px rgba(99, 102, 241, 0.4),
    0 2px 6px rgba(0, 0, 0, 0.12);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-floating-btn:hover {
  transform: scale(1.1);
  box-shadow:
    0 6px 20px rgba(99, 102, 241, 0.5),
    0 3px 8px rgba(0, 0, 0, 0.15);
}

.ai-floating-btn:active {
  transform: scale(0.95);
}

.ai-floating-btn--open {
  background: linear-gradient(135deg, #64748b, #475569);
  box-shadow:
    0 4px 14px rgba(71, 85, 105, 0.4),
    0 2px 6px rgba(0, 0, 0, 0.12);
}

.ai-floating-btn--open:hover {
  box-shadow:
    0 6px 20px rgba(71, 85, 105, 0.5),
    0 3px 8px rgba(0, 0, 0, 0.15);
}
</style>
