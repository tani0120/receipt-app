/**
 * useNotificationCenter.ts — 通知センターcomposable（API完全依存版）
 *
 * 責務: ナビバーの🔔アイコン + 通知センタードロワーの状態管理。
 *       サーバーAPI（/api/notifications）経由でフィルタ済み通知を取得。
 *       フロント側にフィルタロジックは持たない。
 *
 * 型定義: AppNotification（repositories/types.ts）
 *
 * ルール:
 *   - composableにロジックは入れない（状態の出し入れのみ）
 *   - Supabase移行時はAPI側をSupabase版に差し替えるだけでフロント変更なし
 */

import { ref, computed } from 'vue'
import type { AppNotification } from '@/repositories/types'
import { useCurrentUser } from '@/composables/useCurrentUser'

// ============================================================
// § モジュールスコープ（グローバルシングルトン）
// ============================================================

/** 自分宛の通知一覧（サーバーからフィルタ済みで取得） */
const notifications = ref<AppNotification[]>([])

/** 通知センタードロワーの開閉状態 */
const isOpen = ref(false)

/** 初回ロード済みフラグ（重複fetch防止） */
let initialLoadDone = false

// ============================================================
// § ログインユーザーID取得
// ============================================================

let _currentStaffId: (() => string | null) | null = null
function getCurrentStaffId(): string | null {
  if (!_currentStaffId) {
    try {
      const { currentStaffId } = useCurrentUser()
      _currentStaffId = () => currentStaffId.value
    } catch { return null }
  }
  return _currentStaffId()
}

// ============================================================
// § API通信
// ============================================================

/** サーバーから自分宛の通知一覧を取得してrefに反映 */
async function fetchNotifications(): Promise<void> {
  const staffId = getCurrentStaffId()
  try {
    const url = staffId
      ? `/api/notifications?staffId=${encodeURIComponent(staffId)}`
      : '/api/notifications'
    const res = await fetch(url)
    if (!res.ok) return
    const data = await res.json() as { notifications: AppNotification[] }
    notifications.value = data.notifications
  } catch {
    // ネットワークエラーはサイレントに無視
  }
}

/** 初回ロード（画面起動時に1回だけ呼ぶ） */
async function loadIfNeeded(): Promise<void> {
  if (initialLoadDone) return
  initialLoadDone = true
  await fetchNotifications()
}

// ============================================================
// § 導出プロパティ
// ============================================================

/** 未読通知件数（🔔バッジ表示用） */
const unreadCount = computed(() => {
  const myId = getCurrentStaffId()
  if (!myId) return 0
  return notifications.value.filter(n => !n.readBy.includes(myId)).length
})

// ============================================================
// § 公開関数
// ============================================================

/**
 * メンション通知をサーバーAPIで発行する
 *
 * サーバー側でメンション検出→通知作成。フロントはAPIを呼ぶだけ。
 */
async function sendMentionNotification(params: {
  commentBody: string
  authorName: string
  authorStaffId: string
  clientId?: string
  leadId?: string
  clientName: string
}): Promise<void> {
  try {
    await fetch('/api/notifications/mention', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    // 通知発行後に自分の通知リストを再取得（自分宛に通知が来たかもしれない）
    await fetchNotifications()
  } catch (err) {
    console.error('[通知] メンション通知API呼び出し失敗:', err)
  }
}

/**
 * 汎用通知を追加する（移行完了等の全体通知用）
 * サーバーに永続化 + ローカルrefに追加
 */
async function addNotification(options: Omit<AppNotification, 'id' | 'readBy' | 'createdAt'>): Promise<string> {
  const notification: Omit<AppNotification, 'id'> & { id?: string } = {
    ...options,
    readBy: [],
    createdAt: new Date().toISOString(),
  }

  try {
    // サーバーがIDを発番して返す
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { ok: boolean; id: string }
    const savedNotification: AppNotification = {
      ...notification,
      id: data.id,
    } as AppNotification
    notifications.value.unshift(savedNotification)
    return data.id
  } catch (err) {
    console.error('[通知] 通知追加失敗:', err)
    // フォールバック: ローカルで仮ID生成
    const fallbackId = `ntf_local_${crypto.randomUUID().slice(0, 8)}`
    const fallbackNotification: AppNotification = {
      ...notification,
      id: fallbackId,
    } as AppNotification
    notifications.value.unshift(fallbackNotification)
    return fallbackId
  }
}

/**
 * 通知を既読にする
 */
function markAsRead(id: string): void {
  const myId = getCurrentStaffId()
  if (!myId) return
  const notification = notifications.value.find(n => n.id === id)
  if (notification && !notification.readBy.includes(myId)) {
    notification.readBy.push(myId)
  }
  // サーバーに反映
  fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staffId: myId }),
  }).catch(() => { /* サイレント */ })
}

/**
 * 全通知を既読にする
 */
function markAllAsRead(): void {
  const myId = getCurrentStaffId()
  if (!myId) return
  for (const n of notifications.value) {
    if (!n.readBy.includes(myId)) {
      n.readBy.push(myId)
    }
  }
  // サーバーに反映
  fetch('/api/notifications/read-all', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staffId: myId }),
  }).catch(() => { /* サイレント */ })
}

function openDrawer(): void { isOpen.value = true }
function closeDrawer(): void { isOpen.value = false }
function toggleDrawer(): void { isOpen.value = !isOpen.value }

// ============================================================
// § composable export
// ============================================================

/**
 * 通知を削除する
 */
function deleteNotification(id: string): void {
  notifications.value = notifications.value.filter(n => n.id !== id)
  // サーバーに反映
  fetch(`/api/notifications/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).catch(() => { /* サイレント */ })
}

export function useNotificationCenter() {
  // 初回呼び出し時にサーバーから通知を取得
  loadIfNeeded()

  return {
    /** 自分宛の通知一覧（サーバーからフィルタ済み） */
    notifications,
    /** 未読通知件数 */
    unreadCount,
    /** ドロワー開閉状態 */
    isOpen,
    /** メンション通知をサーバーAPIで発行 */
    sendMentionNotification,
    /** 汎用通知を追加（移行完了等） */
    addNotification,
    /** 通知を既読にする */
    markAsRead,
    /** 全通知を既読にする */
    markAllAsRead,
    /** 通知を削除する */
    deleteNotification,
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
