import { ref, computed } from 'vue'

// =============================================
// 型定義
// =============================================

/** スタッフのロール */
export type StaffRole = 'admin' | 'general'

/** スタッフのステータス */
export type StaffStatus = 'active' | 'inactive'

/** スタッフ（一覧・詳細で共通利用） */
export interface Staff {
    uuid: string
    name: string
    email: string
    // passwordはサーバーサイドのみ。フロントエンドには返らない
    role: StaffRole
    status: StaffStatus
}

/** パネルフォーム用型（Staffからuuidを除外、新規登録時のみパスワード入力） */
export interface StaffForm {
    name: string
    email: string
    password: string    // 新規登録・パスワード変更時のみ使用
    role: StaffRole
    status: StaffStatus
}

// =============================================
// ヘルパー関数
// =============================================

/** UUID自動発番 */
export function generateStaffUuid(): string {
    const seg = () => Math.random().toString(36).substring(2, 6)
    return `STF-${seg()}-${seg()}-${seg()}`
}

/** 空のフォームを生成 */
export function emptyStaffForm(): StaffForm {
    return {
        name: '',
        email: '',
        password: '',
        role: 'general',
        status: 'active',
    }
}

// =============================================
// モジュールスコープ（シングルトン）
// Phase B TODO: Supabase APIに差し替え
// =============================================

const staffList = ref<Staff[]>([
    {
        uuid: generateStaffUuid(),
        name: '田中 太郎',
        email: 'tanaka@sugu-suru.com',
        role: 'admin',
        status: 'active',
    },
    {
        uuid: generateStaffUuid(),
        name: '佐藤 花子',
        email: 'sato@sugu-suru.com',
        role: 'general',
        status: 'active',
    },
    {
        uuid: generateStaffUuid(),
        name: '鈴木 一郎',
        email: 'suzuki@sugu-suru.com',
        role: 'general',
        status: 'inactive',
    },
])

// =============================================
// Composable
// =============================================

export function useStaff() {
    const activeStaff = computed(() => staffList.value.filter(s => s.status === 'active'))
    const adminStaff = computed(() => staffList.value.filter(s => s.role === 'admin'))

    return {
        staffList,
        activeStaff,
        adminStaff,
    }
}
