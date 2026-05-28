/**
 * useStaff — スタッフ管理composable（Piniaストア委譲版）
 *
 * 内部はstaffStoreに完全委譲。returnインターフェース変更ゼロ。
 *
 * 準拠: DL-042, plan_pinia_persistedstate移行.md
 */

import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useStaffStore } from '@/stores/staffStore'
import type { Staff, StaffRole, StaffStatus, StaffForm } from '@/repositories/types'

// re-export（外部から import type { Staff } from 'useStaff' していた箇所の互換性）
export type { Staff, StaffRole, StaffStatus, StaffForm }

// ============================================================
// ヘルパー関数（エクスポート維持）
// ============================================================

/** 空のフォームを生成 */
export function emptyStaffForm(): StaffForm {
  return {
    name: '',
    nameRomaji: '',
    email: '',
    password: '',
    role: 'general',
    status: 'active',
  }
}

/**
 * @deprecated フロント側でのスタッフUUID生成は廃止。サーバーが発番する。
 * 後方互換のため一時的に残すが、呼び出し側はサーバーレスポンスからIDを取得すべき。
 */
export function generateStaffUuid(): string {
  console.warn('[useStaff] generateStaffUuidは廃止されました。サーバー発番を使用してください。')
  return `staff-${crypto.randomUUID().slice(0, 12)}`
}

// ============================================================
// Composable
// ============================================================

export function useStaff() {
  const store = useStaffStore()
  const { staffList, lastError } = storeToRefs(store)

  const activeStaff = computed(() => staffList.value.filter(s => s.status === 'active'))
  const adminStaff = computed(() => staffList.value.filter(s => s.role === 'admin'))

  /** staffIdからスタッフ名を取得 */
  function getStaffName(staffId: string | null): string {
    if (!staffId) return ''
    return staffList.value.find(s => s.uuid === staffId)?.name ?? ''
  }

  /**
   * メールアドレスがスタッフマスタに登録済みか確認
   * Google OAuthログイン時のアクセス制御に使用
   * activeステータスのスタッフのみ許可
   */
  function isEmailRegistered(email: string): boolean {
    return staffList.value.some(
      s => s.email.toLowerCase() === email.toLowerCase() && s.status === 'active'
    )
  }

  /** メールアドレスからスタッフ情報を取得 */
  function getStaffByEmail(email: string): Staff | undefined {
    return staffList.value.find(
      s => s.email.toLowerCase() === email.toLowerCase() && s.status === 'active'
    )
  }

  return {
    staffList,
    activeStaff,
    adminStaff,
    getStaffName,
    isEmailRegistered,
    getStaffByEmail,
    addStaff: store.addStaff,
    updateStaff: store.updateStaff,
    refresh: store.fetchFresh,
    lastError,
  }
}
