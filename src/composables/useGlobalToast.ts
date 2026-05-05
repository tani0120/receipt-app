/**
 * useGlobalToast.ts — グローバルトースト通知composable
 *
 * 責務: 全画面共通の一過性トースト通知を管理する。
 *       モジュールスコープのrefで状態を保持し、画面遷移しても維持される。
 *
 * 用途:
 *   - バックグラウンド処理の送信完了通知（情報）
 *   - バックグラウンド処理の完了通知（成功）
 *   - エラー通知（失敗）
 *
 * ルール:
 *   - アクションボタンはトースト内に入れない（一過性UIのため）
 *   - 恒久的な操作が必要な場合はuseNotificationCenter経由で通知センターに記録する
 */

import { ref } from 'vue'

// ============================================================
// § トースト1件の型定義
// ============================================================

export interface ToastItem {
  /** 一意ID（表示管理用） */
  id: string
  /** 表示メッセージ */
  message: string
  /** 種別（成功/失敗/情報） */
  type: 'success' | 'error' | 'info'
  /** FontAwesomeアイコンクラス（任意） */
  icon?: string
  /** 表示時間（ms）。省略時はtypeに応じたデフォルト */
  duration?: number
}

// ============================================================
// § モジュールスコープ（グローバルシングルトン）
// ============================================================

/** 表示中トースト配列（最大3件） */
const toasts = ref<ToastItem[]>([])

/** トーストID生成用カウンタ */
let toastIdCounter = 0

// ============================================================
// § typeごとのデフォルト表示時間（ms）
// ============================================================

const DEFAULT_DURATION: Record<ToastItem['type'], number> = {
  success: 4000,
  info: 3000,
  error: 6000,
}

// ============================================================
// § typeごとのデフォルトアイコン
// ============================================================

const DEFAULT_ICON: Record<ToastItem['type'], string> = {
  success: 'fa-solid fa-circle-check',
  info: 'fa-solid fa-circle-info',
  error: 'fa-solid fa-triangle-exclamation',
}

// ============================================================
// § 公開関数
// ============================================================

/**
 * トーストを表示する
 *
 * @param options - メッセージ・種別・アイコン・表示時間
 * @returns トーストID（手動dismissに使用）
 */
function showToast(options: {
  message: string
  type?: ToastItem['type']
  icon?: string
  duration?: number
}): string {
  const type = options.type ?? 'info'
  const id = `toast-${++toastIdCounter}`

  const item: ToastItem = {
    id,
    message: options.message,
    type,
    icon: options.icon ?? DEFAULT_ICON[type],
    duration: options.duration ?? DEFAULT_DURATION[type],
  }

  // 最大3件制限（古いものから削除）
  if (toasts.value.length >= 3) {
    toasts.value.shift()
  }

  toasts.value.push(item)

  // 自動消去タイマー
  if (item.duration && item.duration > 0) {
    setTimeout(() => {
      dismissToast(id)
    }, item.duration)
  }

  return id
}

/**
 * トーストを手動で閉じる
 *
 * @param id - showToastの戻り値
 */
function dismissToast(id: string): void {
  const idx = toasts.value.findIndex(t => t.id === id)
  if (idx >= 0) {
    toasts.value.splice(idx, 1)
  }
}

// ============================================================
// § composable export
// ============================================================

export function useGlobalToast() {
  return {
    /** 表示中トースト配列（readonly推奨） */
    toasts,
    /** トーストを表示する */
    showToast,
    /** トーストを手動で閉じる */
    dismissToast,
  }
}
