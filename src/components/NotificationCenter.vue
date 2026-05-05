<template>
  <!-- オーバーレイ（ドロワー外クリックで閉じる） -->
  <Teleport to="body">
    <Transition name="nc-fade">
      <div v-if="isOpen" class="nc-overlay" @click="closeDrawer"></div>
    </Transition>
    <Transition name="nc-slide">
      <div v-if="isOpen" class="nc-drawer">
        <!-- ヘッダー -->
        <div class="nc-header">
          <div class="nc-header-left">
            <i class="fa-solid fa-bell nc-header-icon"></i>
            <span class="nc-header-title">通知</span>
            <span v-if="unreadCount > 0" class="nc-header-badge">{{ unreadCount }}</span>
          </div>
          <div class="nc-header-actions">
            <button
              v-if="unreadCount > 0"
              class="nc-mark-all-btn"
              @click="markAllAsRead"
              title="すべて既読にする"
            >
              <i class="fa-solid fa-check-double"></i> 全既読
            </button>
            <button class="nc-close-btn" @click="closeDrawer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- 通知リスト -->
        <div class="nc-list">
          <div v-if="notifications.length === 0" class="nc-empty">
            <i class="fa-regular fa-bell-slash nc-empty-icon"></i>
            <p>通知はありません</p>
          </div>

          <div
            v-for="item in notifications"
            :key="item.id"
            :class="['nc-item', { 'nc-item--unread': !item.isRead }]"
            @click="handleItemClick(item)"
          >
            <!-- 種別アイコン -->
            <div :class="['nc-item-icon', `nc-item-icon--${item.type}`]">
              <i :class="typeIconMap[item.type]"></i>
            </div>

            <!-- 内容 -->
            <div class="nc-item-body">
              <div class="nc-item-title">{{ item.title }}</div>
              <div class="nc-item-text">{{ item.body }}</div>
              <div class="nc-item-time">{{ formatTime(item.createdAt) }}</div>
            </div>

            <!-- アクションボタン -->
            <button
              v-if="item.action"
              class="nc-item-action"
              @click.stop="handleAction(item)"
              :title="item.action.label"
            >
              <i class="fa-solid fa-download"></i>
              <span>{{ item.action.label }}</span>
            </button>

            <!-- 未読インジケータ -->
            <div v-if="!item.isRead" class="nc-item-dot"></div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useNotificationCenter } from '@/composables/useNotificationCenter'
import type { AppNotification } from '@/repositories/types'

const {
  notifications,
  unreadCount,
  isOpen,
  markAsRead,
  markAllAsRead,
  closeDrawer,
} = useNotificationCenter()

/** 種別→アイコンマッピング */
const typeIconMap: Record<string, string> = {
  migration_complete: 'fa-solid fa-circle-check',
  migration_failed: 'fa-solid fa-circle-xmark',
  batch_complete: 'fa-solid fa-list-check',
  error: 'fa-solid fa-triangle-exclamation',
}

/** 通知クリック時: 既読にする */
function handleItemClick(item: AppNotification): void {
  if (!item.isRead) {
    markAsRead(item.id)
  }
}

/** アクションボタンクリック時: URLを開く */
function handleAction(item: AppNotification): void {
  if (!item.action) return

  // 既読にする
  markAsRead(item.id)

  // APIエンドポイントの場合はダウンロードとして開く
  if (item.action.url.startsWith('/api/')) {
    window.open(item.action.url, '_blank')
  } else {
    // ページ遷移の場合
    window.location.hash = item.action.url
  }
}

/** 経過時間表示（「たった今」「5分前」「1時間前」等） */
function formatTime(iso: string): string {
  const now = Date.now()
  const created = new Date(iso).getTime()
  const diffMs = now - created
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHour = Math.floor(diffMs / 3_600_000)
  const diffDay = Math.floor(diffMs / 86_400_000)

  if (diffMin < 1) return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`
  if (diffHour < 24) return `${diffHour}時間前`
  if (diffDay < 7) return `${diffDay}日前`
  return new Date(iso).toLocaleDateString('ja-JP')
}
</script>

<style scoped>
/* ===== オーバーレイ ===== */
.nc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 9998;
}

/* ===== ドロワー ===== */
.nc-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 380px;
  height: 100vh;
  background: #ffffff;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  font-family: 'Noto Sans JP', 'Inter', sans-serif;
}

/* ===== ヘッダー ===== */
.nc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f0f9ff, #eff6ff);
}

.nc-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nc-header-icon {
  font-size: 16px;
  color: #3b82f6;
}

.nc-header-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}

.nc-header-badge {
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}

.nc-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nc-mark-all-btn {
  font-size: 11px;
  font-weight: 600;
  color: #3b82f6;
  background: none;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.nc-mark-all-btn:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}

.nc-close-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.nc-close-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

/* ===== リスト ===== */
.nc-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

/* ===== 空状態 ===== */
.nc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #94a3b8;
  gap: 12px;
}

.nc-empty-icon {
  font-size: 32px;
  opacity: 0.4;
}

.nc-empty p {
  font-size: 13px;
  font-weight: 500;
}

/* ===== 通知アイテム ===== */
.nc-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}

.nc-item:hover {
  background: #f8fafc;
}

.nc-item--unread {
  background: #f0f9ff;
}

.nc-item--unread:hover {
  background: #e0f2fe;
}

/* ===== 種別アイコン ===== */
.nc-item-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.nc-item-icon--migration_complete {
  background: #dcfce7;
  color: #16a34a;
}

.nc-item-icon--migration_failed {
  background: #fee2e2;
  color: #dc2626;
}

.nc-item-icon--batch_complete {
  background: #dbeafe;
  color: #2563eb;
}

.nc-item-icon--error {
  background: #fef3c7;
  color: #d97706;
}

/* ===== 本文 ===== */
.nc-item-body {
  flex: 1;
  min-width: 0;
}

.nc-item-title {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 2px;
}

.nc-item-text {
  font-size: 11px;
  color: #64748b;
  line-height: 1.5;
}

.nc-item-time {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 4px;
}

/* ===== アクションボタン ===== */
.nc-item-action {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 10px;
  font-weight: 600;
  color: #6366f1;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  white-space: nowrap;
  align-self: center;
}

.nc-item-action:hover {
  background: #e0e7ff;
  border-color: #a5b4fc;
}

/* ===== 未読ドット ===== */
.nc-item-dot {
  position: absolute;
  top: 14px;
  left: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3b82f6;
}

/* ===== アニメーション ===== */
.nc-fade-enter-active { transition: opacity 0.2s ease; }
.nc-fade-leave-active { transition: opacity 0.15s ease; }
.nc-fade-enter-from, .nc-fade-leave-to { opacity: 0; }

.nc-slide-enter-active { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.nc-slide-leave-active { transition: transform 0.2s ease-in; }
.nc-slide-enter-from { transform: translateX(100%); }
.nc-slide-leave-to { transform: translateX(100%); }
</style>
