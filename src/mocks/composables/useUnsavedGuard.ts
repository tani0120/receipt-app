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
 * - 変更ログ（changeLog）で未保存内容の詳細をモーダルに表示
 *
 * 【使い方】
 * const modal = useModalHelper()
 * const { markDirty, markClean } = useUnsavedGuard(saveFn, modal)
 * markDirty('3コード: ABC → XYZ')  // 変更内容を記録
 *
 * 準拠: DL-042
 */
export function useUnsavedGuard(
  saveFn: (() => void) | null,
  modal?: ReturnType<typeof useModalHelper>,
) {
  const isDirty = ref(false)
  /** 変更ログ: markDirty(msg)で積み上げ、モーダルで表示 */
  const changeLog = ref<string[]>([])

  /** 変更操作後に呼ぶ（msg: 変更内容の説明。省略可） */
  function markDirty(msg?: string) {
    isDirty.value = true
    if (msg && !changeLog.value.includes(msg)) {
      changeLog.value.push(msg)
    }
  }

  /** 保存成功後に呼ぶ */
  function markClean() {
    isDirty.value = false
    changeLog.value = []
  }

  /** 変更ログをモーダル用メッセージに整形 */
  function formatChangeLog(): string {
    if (changeLog.value.length === 0) return '保存しますか？'
    const items = changeLog.value.map(m => `・${m}`).join('\n')
    return `以下の変更が未保存です:\n\n${items}\n\n保存しますか？`
  }

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
      changeLog.value = []
      return true
    }

    // カスタムモーダルで確認（変更ログ付き）
    const answer = await modal.confirm({
      title: '未保存の変更があります',
      message: formatChangeLog(),
      confirmLabel: 'はい（保存して遷移）',
      cancelLabel: 'いいえ（破棄して遷移）',
    })

    if (answer && saveFn) {
      saveFn()
    }
    isDirty.value = false
    changeLog.value = []
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

  return { isDirty, markDirty, markClean, changeLog }
}
