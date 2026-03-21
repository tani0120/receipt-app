import { ref, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

/**
 * パターン2: 保存ボタン + 離脱警告
 * 未保存の変更がある状態でページ遷移しようとすると確認ダイアログを表示。
 * OK → saveFn()を呼んで保存してから遷移
 * キャンセル → 破棄して遷移
 */
export function useUnsavedGuard(saveFn: () => void) {
  const isDirty = ref(false)

  /** 変更操作後に呼ぶ */
  function markDirty() { isDirty.value = true }

  /** 保存成功後に呼ぶ */
  function markClean() { isDirty.value = false }

  // Vue Routerのルートガード
  onBeforeRouteLeave(() => {
    if (!isDirty.value) return true
    const answer = window.confirm(
      '未保存の変更があります。保存しますか？\n\nOK = 保存して元のページに留まる\nキャンセル = 破棄して移動'
    )
    if (answer) {
      saveFn()
      // 保存後、元のページに留まる（遷移をキャンセル）
      return false
    }
    // 破棄して遷移
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
