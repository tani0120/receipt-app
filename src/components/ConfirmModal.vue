<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="$emit('cancel')">
      <div class="modal-box" :class="{ 'modal-danger': variant === 'danger' }">
        <div class="modal-title">{{ title }}</div>
        <div v-if="message" class="modal-body">{{ message }}</div>
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel" @click="$emit('cancel')">{{ cancelLabel }}</button>
          <button
            class="modal-btn modal-btn-confirm"
            :class="{ 'btn-danger': variant === 'danger' }"
            @click="$emit('confirm')"
          >{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * ConfirmModal — 汎用確認モーダル（はい / いいえ）
 *
 * 用途: 保存確認、削除確認、離脱確認など
 * globalThis.confirm の完全置換コンポーネント
 *
 * 準拠: DL-042
 */
withDefaults(defineProps<{
  /** モーダル表示状態 */
  show: boolean
  /** タイトル（例: 「保存しますか？」） */
  title: string
  /** 本文（任意） */
  message?: string
  /** 確認ボタンラベル */
  confirmLabel?: string
  /** キャンセルボタンラベル */
  cancelLabel?: string
  /** 色バリエーション（'danger'で赤ボタン） */
  variant?: 'default' | 'danger'
}>(), {
  message: '',
  confirmLabel: 'はい',
  cancelLabel: 'いいえ',
  variant: 'default',
})

defineEmits<{
  confirm: []
  cancel: []
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
  min-width: 360px;
  max-width: 480px;
  animation: slideUp 0.2s ease;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
}

.modal-danger .modal-title {
  color: #c62828;
}

.modal-body {
  font-size: 13px;
  color: #555;
  margin-bottom: 20px;
  line-height: 1.6;
  white-space: pre-line;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-btn {
  padding: 8px 22px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}

.modal-btn:active {
  transform: scale(0.97);
}

.modal-btn-cancel {
  background: #e5e7eb;
  color: #555;
}

.modal-btn-cancel:hover {
  background: #d1d5db;
}

.modal-btn-confirm {
  background: #3b82f6;
  color: #fff;
}

.modal-btn-confirm:hover {
  background: #2563eb;
}

.modal-btn-confirm.btn-danger {
  background: #c62828;
}

.modal-btn-confirm.btn-danger:hover {
  background: #b71c1c;
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
