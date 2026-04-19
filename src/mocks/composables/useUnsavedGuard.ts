import { ref, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import type { useModalHelper } from './useModalHelper'

/**
 * useUnsavedGuard — 未保存変更の離脱ガード（カスタムモーダル版）
 *
 * 【設計】
 * - Vue Router 4の onBeforeRouteLeave は async/Promise<boolean> に対応
 * - useModalHelper.confirm() でカスタムモーダルを表示
 * - 「はい」→ saveFn() 実行して遷移
 * - 「いいえ」→ 破棄して遷移
 *
 * 【使い方】
 * const modal = useModalHelper()
 * const { markDirty, markClean } = useUnsavedGuard(saveFn, modal)
 *
 * 準拠: DL-042
 */
export function useUnsavedGuard(
  saveFn: (() => void) | null,
  modal?: ReturnType<typeof useModalHelper>,
) {
  const isDirty = ref(false)

  /** 変更操作後に呼ぶ */
  function markDirty() { isDirty.value = true }

  /** 保存成功後に呼ぶ */
  function markClean() { isDirty.value = false }

  // Vue Routerのルートガード
  onBeforeRouteLeave(async () => {
    if (!isDirty.value) return true

    // モーダルが渡されていない場合はフォールバック（window.confirm）
    if (!modal) {
      const answer = window.confirm(
        '未保存の変更があります。保存しますか？\n\nOK = 保存して遷移\nキャンセル = 破棄して遷移'
      )
      if (answer && saveFn) {
        saveFn()
      }
      isDirty.value = false
      return true
    }

    // カスタムモーダルで確認
    const answer = await modal.confirm({
      title: '未保存の変更があります',
      message: '保存しますか？',
      confirmLabel: 'はい（保存して遷移）',
      cancelLabel: 'いいえ（破棄して遷移）',
    })

    if (answer && saveFn) {
      saveFn()
    }
    isDirty.value = false
    return true
  })

  // ブラウザ閉じる / F5リロード対策
  const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
    if (isDirty.value) {
      e.preventDefault()
      e.returnValue = ''
    }
  }
  window.addEventListener('beforeunload', beforeUnloadHandler)
  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', beforeUnloadHandler)
  })

  return { isDirty, markDirty, markClean }
}
