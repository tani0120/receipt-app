import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useStaff } from '@/features/staff-management/composables/useStaff'
import { useCurrentUserStore } from '@/stores/currentUserStore'

/**
 * 現在のユーザー情報を提供するComposable（Piniaストア委譲版）
 *
 * 内部はcurrentUserStoreに完全委譲。returnインターフェース変更ゼロ。
 *
 * Phase A: /api/auth/current, /api/auth/switch でサーバー管理
 *          UIドロップダウンでログインスタッフを切替可能
 * Phase B: supabase.auth.getUser() に差し替え予定（サーバー側のみ変更）
 *
 * 準拠: DL-042（STAFF_LISTハードコード廃止）
 */

export function useCurrentUser() {
  const store = useCurrentUserStore()
  const { selectedUuid } = storeToRefs(store)
  const { activeStaff, staffList: allStaff } = useStaff()

  /** スタッフ名リスト（activeStaffから動的生成） */
  const staffList = computed(() => activeStaff.value.map(s => s.name))

  /** 現在選択中のスタッフ（uuid優先ルックアップ） */
  const currentStaff = computed(() => {
    // 1. UUID指定があればそれを使用
    if (selectedUuid.value) {
      const found = allStaff.value.find(s => s.uuid === selectedUuid.value && s.status === 'active')
      if (found) return found
    }
    // 2. フォールバック: activeStaffの先頭
    return activeStaff.value[0] ?? null
  })

  /** 現在のユーザー名 */
  const userName = computed(() => currentStaff.value?.name ?? '')

  /** 現在のユーザーのstaffId */
  const currentStaffId = computed(() => currentStaff.value?.uuid ?? null)

  /** 現在のユーザーのメールアドレス */
  const currentEmail = computed(() => currentStaff.value?.email ?? '')

  /** 管理者かどうか */
  const isAdmin = computed(() => currentStaff.value?.role === 'admin')

  /**
   * ログインスタッフを切り替える
   * @param staffUuid - 切替先のスタッフUUID
   */
  function setCurrentUser(staffUuid: string): void {
    store.setUuid(staffUuid)
  }

  // APIロード完了後にデフォルト設定（初回のみ）
  watch(activeStaff, (list) => {
    if (!selectedUuid.value && list.length > 0 && list[0]) {
      store.setUuid(list[0].uuid)
    }
  })

  // 初回サーバー同期（fire-and-forget）
  store.syncFromServer()

  return {
    userName,
    staffList,
    currentStaffId,
    currentEmail,
    currentStaff,
    isAdmin,
    setCurrentUser,
    /** activeStaff一覧（ドロップダウンUI用） */
    activeStaffList: activeStaff,
  }
}
