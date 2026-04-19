import { ref, computed, watch } from 'vue'
import { useStaff } from '@/features/staff-management/composables/useStaff'

/**
 * 現在のユーザー情報を提供するComposable
 *
 * Phase A: useStaff().activeStaffから動的にスタッフリストを取得
 *          UIドロップダウンでログインスタッフを切替可能
 *          選択状態はlocalStorageに永続化（ページリロードでも維持）
 * Phase B: supabase.auth.getUser() に差し替え予定
 *   → 認証基盤はSupabase Authに移行済み（src/utils/auth.ts）
 *   → 画面仕様確定後に実装
 *
 * 準拠: DL-042（STAFF_LISTハードコード廃止）
 */

const STORAGE_KEY = 'sugu-suru:current-staff-uuid'

// モジュールスコープ（全composable呼び出しで共有）
const selectedUuid = ref<string | null>(localStorage.getItem(STORAGE_KEY))

export function useCurrentUser() {
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

  /**
   * ログインスタッフを切り替える
   * @param staffUuid - 切替先のスタッフUUID
   */
  function setCurrentUser(staffUuid: string): void {
    selectedUuid.value = staffUuid
    localStorage.setItem(STORAGE_KEY, staffUuid)
    console.log(`[useCurrentUser] スタッフ切替: ${staffUuid}`)
  }

  // APIロード完了後にデフォルト設定（初回のみ）
  watch(activeStaff, (list) => {
    if (!selectedUuid.value && list.length > 0) {
      setCurrentUser(list[0].uuid)
    }
  })

  return {
    userName,
    staffList,
    currentStaffId,
    currentEmail,
    currentStaff,
    setCurrentUser,
    /** activeStaff一覧（ドロップダウンUI用） */
    activeStaffList: activeStaff,
  }
}
