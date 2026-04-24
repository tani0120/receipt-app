/**
 * useNotificationCenter.ts — 通知センターcomposable
 *
 * 責務: ナビバーの🔔アイコン + 通知センタードロワーの状態管理。
 *       モジュールスコープのrefで状態を保持し、画面遷移しても維持される。
 *
 * 型定義: AppNotification（repositories/types.ts）— Supabase移行を見据えた恒久的型
 *
 * ルール:
 *   - composableにロジックは入れない（状態の出し入れのみ）
 *   - Supabase移行時はこのcomposableの内部をAPI呼び出しに差し替える
 */

import { ref, computed } from 'vue'
import type { AppNotification } from '@/repositories/types'

// ============================================================
// § モジュールスコープ（グローバルシングルトン）
// ============================================================

/** 通知一覧（新しい順） */
const notifications = ref<AppNotification[]>([])

/** 通知センタードロワーの開閉状態 */
const isOpen = ref(false)

/** 通知ID生成用カウンタ */
let notificationIdCounter = 0

// ============================================================
// § 導出プロパティ
// ============================================================

/** 未読通知件数（🔔バッジ表示用） */
const unreadCount = computed(() =>
  notifications.value.filter(n => !n.isRead).length
)

// ============================================================
// § 公開関数
// ============================================================

/**
 * 通知を追加する
 *
 * @param options - 通知の内容
 * @returns 通知ID
 */
function addNotification(options: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>): string {
  const id = `notif-${++notificationIdCounter}-${Date.now()}`

  const notification: AppNotification = {
    ...options,
    id,
    isRead: false,
    createdAt: new Date().toISOString(),
  }

  // 先頭に追加（新しい順）
  notifications.value.unshift(notification)

  // 最大50件に制限（古いものから削除）
  if (notifications.value.length > 50) {
    notifications.value = notifications.value.slice(0, 50)
  }

  return id
}

/**
 * 通知を既読にする
 *
 * @param id - 通知ID
 */
function markAsRead(id: string): void {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.isRead = true
  }
}

/**
 * 全通知を既読にする
 */
function markAllAsRead(): void {
  for (const n of notifications.value) {
    n.isRead = true
  }
}

/**
 * 通知センタードロワーを開く
 */
function openDrawer(): void {
  isOpen.value = true
}

/**
 * 通知センタードロワーを閉じる
 */
function closeDrawer(): void {
  isOpen.value = false
}

/**
 * 通知センタードロワーの開閉を切り替える
 */
function toggleDrawer(): void {
  isOpen.value = !isOpen.value
}

// ============================================================
// § composable export
// ============================================================

export function useNotificationCenter() {
  return {
    /** 通知一覧（新しい順） */
    notifications,
    /** 未読通知件数 */
    unreadCount,
    /** ドロワー開閉状態 */
    isOpen,
    /** 通知を追加する */
    addNotification,
    /** 通知を既読にする */
    markAsRead,
    /** 全通知を既読にする */
    markAllAsRead,
    /** ドロワーを開く */
    openDrawer,
    /** ドロワーを閉じる */
    closeDrawer,
    /** ドロワー開閉切替 */
    toggleDrawer,
  }
}
