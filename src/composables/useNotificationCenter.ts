/**
 * useNotificationCenter.ts — 通知センターcomposable
 *
 * 責務: ナビバーの🔔アイコン + 通知センタードロワーの状態管理。
 *       モジュールスコープのrefで状態を保持し、画面遷移しても維持される。
 *       サーバーAPI（/api/notifications）経由でJSON永続化。
 *       ページリロードしても通知は消えない。
 *
 * 型定義: AppNotification（repositories/types.ts）— Supabase移行を見据えた恒久的型
 *
 * ルール:
 *   - composableにロジックは入れない（状態の出し入れのみ）
 *   - Supabase移行時はAPI側をSupabase版に差し替えるだけでフロント変更なし
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

/** 初回ロード済みフラグ（重複fetch防止） */
let initialLoadDone = false

// ============================================================
// § API通信
// ============================================================

/** サーバーから通知一覧を取得してrefに反映 */
async function fetchNotifications(): Promise<void> {
  try {
    const res = await fetch('/api/notifications')
    if (!res.ok) return
    const data = await res.json() as { notifications: AppNotification[] }
    notifications.value = data.notifications
  } catch {
    // ネットワークエラーはサイレントに無視（メモリ内の通知はそのまま残る）
  }
}

/** 初回ロード（画面起動時に1回だけ呼ぶ） */
async function loadIfNeeded(): Promise<void> {
  if (initialLoadDone) return
  initialLoadDone = true
  await fetchNotifications()
}

/** サーバーに通知を永続化（fire-and-forget） */
function persistNotification(notification: AppNotification): void {
  fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notification),
  }).catch(() => { /* サイレント */ })
}

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

  // サーバーに永続化（fire-and-forget）
  persistNotification(notification)

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
    // サーバーに反映（fire-and-forget）
    fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PUT',
    }).catch(() => { /* サイレント */ })
  }
}

/**
 * 全通知を既読にする
 */
function markAllAsRead(): void {
  for (const n of notifications.value) {
    n.isRead = true
  }
  // サーバーに反映（fire-and-forget）
  fetch('/api/notifications/read-all', {
    method: 'PUT',
  }).catch(() => { /* サイレント */ })
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
  // 初回呼び出し時にサーバーから通知を取得（非同期だが待たない）
  loadIfNeeded()

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
    /** サーバーから再取得 */
    fetchNotifications,
  }
}
