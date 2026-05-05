import { reactive } from 'vue'

/**
 * useModalHelper — ConfirmModal / NotifyModal をPromiseベースで制御するcomposable
 *
 * 【使い方】
 * 1. setup内で const modal = useModalHelper() を呼ぶ
 * 2. テンプレートに <ConfirmModal v-bind="modal.confirmState" @confirm="modal.onConfirm" @cancel="modal.onCancel" />
 *    と <NotifyModal v-bind="modal.notifyState" @close="modal.onNotifyClose" /> を配置
 * 3. スクリプト内で await modal.confirm({ title: '保存しますか？' }) → boolean
 *    や await modal.notify({ title: '保存しました', variant: 'success' }) → void
 *
 * 準拠: DL-042
 */

// ============================================================
// 型定義（モーダルオプション）
// ============================================================

/** 確認モーダルのオプション */
export interface ConfirmOptions {
  /** タイトル（例: 「保存しますか？」） */
  title: string
  /** 本文 */
  message?: string
  /** 確認ボタンラベル（デフォルト: 「はい」） */
  confirmLabel?: string
  /** キャンセルボタンラベル（デフォルト: 「いいえ」） */
  cancelLabel?: string
  /** 色バリエーション */
  variant?: 'default' | 'danger'
}

/** 通知モーダルのオプション */
export interface NotifyOptions {
  /** タイトル */
  title: string
  /** 本文 */
  message?: string
  /** バリエーション */
  variant?: 'info' | 'success' | 'warning'
}

// ============================================================
// composable本体
// ============================================================

export function useModalHelper() {
  // --- 確認モーダル状態 ---
  const confirmState = reactive({
    show: false,
    title: '',
    message: '',
    confirmLabel: 'はい',
    cancelLabel: 'いいえ',
    variant: 'default' as 'default' | 'danger',
  })

  let confirmResolve: ((value: boolean) => void) | null = null

  /** 確認モーダルを表示し、ユーザーの選択をPromiseで返す */
  function confirm(opts: ConfirmOptions): Promise<boolean> {
    confirmState.title = opts.title
    confirmState.message = opts.message ?? ''
    confirmState.confirmLabel = opts.confirmLabel ?? 'はい'
    confirmState.cancelLabel = opts.cancelLabel ?? 'いいえ'
    confirmState.variant = opts.variant ?? 'default'
    confirmState.show = true

    return new Promise<boolean>((resolve) => {
      confirmResolve = resolve
    })
  }

  /** テンプレートから呼ぶ: 「はい」クリック */
  function onConfirm() {
    confirmState.show = false
    confirmResolve?.(true)
    confirmResolve = null
  }

  /** テンプレートから呼ぶ: 「いいえ」クリック */
  function onCancel() {
    confirmState.show = false
    confirmResolve?.(false)
    confirmResolve = null
  }

  // --- 通知モーダル状態 ---
  const notifyState = reactive({
    show: false,
    title: '',
    message: '',
    variant: 'info' as 'info' | 'success' | 'warning',
  })

  let notifyResolve: (() => void) | null = null

  /** 通知モーダルを表示し、OKクリックを待つ */
  function notify(opts: NotifyOptions): Promise<void> {
    notifyState.title = opts.title
    notifyState.message = opts.message ?? ''
    notifyState.variant = opts.variant ?? 'info'
    notifyState.show = true

    return new Promise<void>((resolve) => {
      notifyResolve = resolve
    })
  }

  /** テンプレートから呼ぶ: OK クリック */
  function onNotifyClose() {
    notifyState.show = false
    notifyResolve?.()
    notifyResolve = null
  }

  return {
    // 確認モーダル
    confirmState,
    confirm,
    onConfirm,
    onCancel,
    // 通知モーダル
    notifyState,
    notify,
    onNotifyClose,
  }
}
