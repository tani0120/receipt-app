<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-box" :class="{ 'modal-success': variant === 'success', 'modal-warning': variant === 'warning' }">
        <div class="modal-icon" v-if="variant === 'success'">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <div class="modal-icon modal-icon-warning" v-else-if="variant === 'warning'">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <div class="modal-icon modal-icon-info" v-else>
          <i class="fa-solid fa-circle-info"></i>
        </div>
        <div class="modal-title">{{ title }}</div>
        <div v-if="message" class="modal-body">{{ message }}</div>
        <div class="modal-actions">
          <button class="modal-btn modal-btn-ok" @click="$emit('close')">OK</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * NotifyModal — 汎用通知モーダル（OKのみ）
 *
 * 用途: 保存完了通知、バリデーションエラー通知など
 * globalThis.alert の完全置換コンポーネント
 *
 * 準拠: DL-042
 */
withDefaults(defineProps<{
  /** モーダル表示状態 */
  show: boolean
  /** タイトル */
  title: string
  /** 本文（任意） */
  message?: string
  /** バリエーション */
  variant?: 'info' | 'success' | 'warning'
}>(), {
  message: '',
  variant: 'info',
})

defineEmits<{
  close: []
}>()
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.15s ease;
}

.modal-box {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 8px 36px rgba(0, 0, 0, 0.22);
  padding: 28px 32px;
  min-width: 340px;
  max-width: 460px;
  text-align: center;
  animation: slideUp 0.2s ease;
}

.modal-icon {
  font-size: 36px;
  color: #3b82f6;
  margin-bottom: 12px;
}

.modal-icon-warning {
  color: #f59e0b;
}

.modal-success .modal-icon {
  color: #22c55e;
}

.modal-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 10px;
}

.modal-body {
  font-size: 13px;
  color: #555;
  margin-bottom: 20px;
  line-height: 1.6;
  white-space: pre-line;
  text-align: left;
}

.modal-actions {
  display: flex;
  justify-content: center;
}

.modal-btn-ok {
  padding: 8px 32px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: #3b82f6;
  color: #fff;
  transition: background 0.15s, transform 0.1s;
}

.modal-btn-ok:hover {
  background: #2563eb;
}

.modal-btn-ok:active {
  transform: scale(0.97);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(12px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
