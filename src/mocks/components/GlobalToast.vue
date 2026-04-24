<template>
  <Teleport to="body">
    <div class="global-toast-container">
      <TransitionGroup name="toast-slide">
        <div
          v-for="item in toasts"
          :key="item.id"
          :class="['global-toast', `global-toast--${item.type}`]"
          @click="dismissToast(item.id)"
        >
          <i v-if="item.icon" :class="['global-toast-icon', item.icon]"></i>
          <span class="global-toast-message">{{ item.message }}</span>
          <button class="global-toast-close" @click.stop="dismissToast(item.id)">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useGlobalToast } from '@/mocks/composables/useGlobalToast'

const { toasts, dismissToast } = useGlobalToast()
</script>

<style scoped>
/* ===== コンテナ: 右下に固定スタック ===== */
.global-toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

/* ===== トースト本体 ===== */
.global-toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  min-width: 320px;
  max-width: 480px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Noto Sans JP', 'Inter', sans-serif;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.18),
    0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  pointer-events: auto;
  backdrop-filter: blur(12px);
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.global-toast:hover {
  transform: translateX(-4px);
}

/* ===== 種別カラー ===== */
.global-toast--success {
  background: linear-gradient(135deg, #065f46, #047857);
  color: #d1fae5;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.global-toast--info {
  background: linear-gradient(135deg, #1e3a5f, #1e40af);
  color: #dbeafe;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.global-toast--error {
  background: linear-gradient(135deg, #7f1d1d, #b91c1c);
  color: #fee2e2;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

/* ===== アイコン ===== */
.global-toast-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.global-toast--success .global-toast-icon { color: #34d399; }
.global-toast--info .global-toast-icon { color: #60a5fa; }
.global-toast--error .global-toast-icon { color: #f87171; }

/* ===== メッセージ ===== */
.global-toast-message {
  flex: 1;
  line-height: 1.5;
}

/* ===== 閉じるボタン ===== */
.global-toast-close {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: inherit;
  font-size: 10px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.15s, background 0.15s;
}

.global-toast-close:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.25);
}

/* ===== アニメーション ===== */
.toast-slide-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-slide-leave-active {
  transition: all 0.25s ease-in;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(100px) scale(0.9);
}

.toast-slide-move {
  transition: transform 0.3s ease;
}
</style>
