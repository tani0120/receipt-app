import { ref, computed, watch } from 'vue'
import { useStaff } from '@/features/staff-management/composables/useStaff'

/**
 * 現在のユーザー情報を提供するComposable
 *
 * Phase A: useStaff().activeStaffから動的にスタッフリストを取得
 * Phase B: supabase.auth.getUser() に差し替え予定
 *   → 認証基盤はSupabase Authに移行済み（src/utils/auth.ts）
 *   → 画面仕様確定後に実装
 *
 * 準拠: DL-042（STAFF_LISTハードコード廃止）
 */

export function useCurrentUser() {
  const { activeStaff, staffList: allStaff } = useStaff()

  /** スタッフ名リスト（activeStaffから動的生成） */
  const staffList = computed(() => activeStaff.value.map(s => s.name))

  /** 現在のユーザー名（初期値はactiveStaffの先頭。APIロード完了後に更新） */
  const userName = ref<string>(activeStaff.value[0]?.name ?? '')

  /** 現在のユーザーのstaffId（staffNameからルックアップ） */
  const currentStaffId = computed(() => {
    const staff = allStaff.value.find(s => s.name === userName.value && s.status === 'active')
    return staff?.uuid ?? null
  })

  // #8修正: APIロード完了後にuserNameが空なら先頭スタッフ名を設定
  watch(activeStaff, (list) => {
    if (!userName.value && list.length > 0) {
      userName.value = list[0].name
    }
  })

  return {
    userName,
    staffList,
    currentStaffId,
  }
}
