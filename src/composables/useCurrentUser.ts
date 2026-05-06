import { ref, computed, watch } from 'vue'
import { useStaff } from '@/features/staff-management/composables/useStaff'

/**
 * 現在のユーザー情報を提供するComposable
 *
 * Phase A: /api/auth/current, /api/auth/switch でサーバー管理
 *          UIドロップダウンでログインスタッフを切替可能
 *          ローカルキャッシュ（localStorage）で即時反映 + サーバーfire-and-forget
 * Phase B: supabase.auth.getUser() に差し替え予定（サーバー側のみ変更）
 *
 * 準拠: DL-042（STAFF_LISTハードコード廃止）
 */

const STORAGE_KEY = 'sugu-suru:current-staff-uuid'

// モジュールスコープ（全composable呼び出しで共有）
const selectedUuid = ref<string | null>(localStorage.getItem(STORAGE_KEY))

/** 初回サーバー同期済みフラグ */
let serverSynced = false

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
   * ref即反映 + サーバーfire-and-forget（useStaffと同パターン）
   * @param staffUuid - 切替先のスタッフUUID
   */
  function setCurrentUser(staffUuid: string): void {
    // ref即反映
    selectedUuid.value = staffUuid
    localStorage.setItem(STORAGE_KEY, staffUuid)
    console.log(`[useCurrentUser] スタッフ切替: ${staffUuid}`)
    // サーバーfire-and-forget
    fetch('/api/auth/switch', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId: staffUuid }),
    }).catch(err => {
      console.error('[useCurrentUser] サーバー同期失敗:', err)
    })
  }

  // APIロード完了後にデフォルト設定（初回のみ）
  watch(activeStaff, (list) => {
    if (!selectedUuid.value && list.length > 0 && list[0]) {
      setCurrentUser(list[0].uuid)
    }
  })

  // 初回サーバー同期（fire-and-forget）
  if (!serverSynced) {
    serverSynced = true
    fetch('/api/auth/current')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.staffId && !selectedUuid.value) {
          selectedUuid.value = data.staffId
          localStorage.setItem(STORAGE_KEY, data.staffId)
        } else if (selectedUuid.value) {
          // ローカルの選択をサーバーに同期
          fetch('/api/auth/switch', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staffId: selectedUuid.value }),
          }).catch(() => { /* サイレント */ })
        }
      })
      .catch(() => { /* サイレント */ })
  }

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
