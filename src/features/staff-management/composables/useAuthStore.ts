import { ref, computed } from 'vue'
import type { Staff, StaffRole } from '@/features/staff-management/composables/useStaff'

// =============================================
// 認証ストア（シングルトン）
// Phase B TODO: Firebase Auth / Supabase Auth に差し替え
// =============================================

/**
 * ログイン中スタッフの情報を管理する。
 * 初期値は最初の管理者（モック用）。
 *
 * 提供する機能:
 *   - currentStaff: ログイン中スタッフ
 *   - isAdmin: 管理者かどうか
 *   - canAccess(path): 指定パスにアクセスできるか
 *   - setCurrentStaff(staff): ログインスタッフを切り替え（モック用）
 */

/** 管理者のみアクセス可能なパス一覧 */
const ADMIN_ONLY_PATHS = [
    '/master/clients',
    '/master/staff',
    '/settings/accounts',
    '/settings/tax',
    '/master',
    '/cost',
    '/settings/admin',
] as const

const currentStaff = ref<Staff | null>(null)

export function useAuthStore() {
    /** 管理者かどうか */
    const isAdmin = computed(() => currentStaff.value?.role === 'admin')

    /** 現在のロール */
    const currentRole = computed<StaffRole | null>(() => currentStaff.value?.role ?? null)

    /** 指定パスにアクセスできるか */
    function canAccess(path: string): boolean {
        if (!currentStaff.value) return false
        if (currentStaff.value.role === 'admin') return true
        // 一般ユーザーは管理者専用パスにはアクセス不可
        return !ADMIN_ONLY_PATHS.some(p => path.startsWith(p))
    }

    /** ログインスタッフを設定（モック用） */
    function setCurrentStaff(staff: Staff) {
        currentStaff.value = staff
    }

    /** ログアウト */
    function clearCurrentStaff() {
        currentStaff.value = null
    }

    return {
        currentStaff,
        isAdmin,
        currentRole,
        canAccess,
        setCurrentStaff,
        clearCurrentStaff,
    }
}
