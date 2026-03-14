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

/** スタッフ内部ID連番カウンター（物理削除なし前提、増加のみ） */
let _staffIdCounter = 0

/** スタッフ内部ID自動発番（staff-0001形式） */
export function generateStaffUuid(): string {
    _staffIdCounter++
    return `staff-${String(_staffIdCounter).padStart(4, '0')}`
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
        uuid: 'staff-0001',
        name: '田中 太郎',
        email: 'tanaka@sugu-suru.com',
        role: 'admin',
        status: 'active',
    },
    {
        uuid: 'staff-0002',
        name: '佐藤 花子',
        email: 'sato@sugu-suru.com',
        role: 'general',
        status: 'active',
    },
    {
        uuid: 'staff-0003',
        name: '鈴木 一郎',
        email: 'suzuki@sugu-suru.com',
        role: 'general',
        status: 'inactive',
    },
    {
        uuid: 'staff-0004',
        name: '田中 次郎',
        email: 'tanaka-j@sugu-suru.com',
        role: 'general',
        status: 'active',
    },
])

// 初期データ分のカウンターを設定
_staffIdCounter = 4

// =============================================
// 担当紐付け（顧問先 ↔ スタッフ）
// Phase B TODO: Supabase APIに差し替え
// =============================================

export type AssignmentRole = 'main' | 'sub'

export interface StaffAssignment {
    staffId: string
    role: AssignmentRole
}

const ASSIGNMENT_STORAGE_KEY = 'sugu-suru:staff-assignments'

function loadAssignments(): Record<string, StaffAssignment[]> {
    try {
        const raw = localStorage.getItem(ASSIGNMENT_STORAGE_KEY)
        if (raw) return JSON.parse(raw)
    } catch { /* 破損データは無視 */ }
    return {}
}

function saveAssignments(data: Record<string, StaffAssignment[]>): void {
    localStorage.setItem(ASSIGNMENT_STORAGE_KEY, JSON.stringify(data))
}

const assignments = ref<Record<string, StaffAssignment[]>>(loadAssignments())

// =============================================
// Composable
// =============================================

export function useStaff() {
    const activeStaff = computed(() => staffList.value.filter(s => s.status === 'active'))
    const adminStaff = computed(() => staffList.value.filter(s => s.role === 'admin'))

    /** 顧問先に担当スタッフを割り当て */
    function assignStaff(clientId: string, staffId: string, role: AssignmentRole = 'sub'): void {
        if (!assignments.value[clientId]) {
            assignments.value[clientId] = []
        }
        // 既に割り当て済みなら更新
        const existing = assignments.value[clientId].find(a => a.staffId === staffId)
        if (existing) {
            existing.role = role
        } else {
            assignments.value[clientId].push({ staffId, role })
        }
        saveAssignments(assignments.value)
    }

    /** 顧問先から担当スタッフを解除 */
    function unassignStaff(clientId: string, staffId: string): void {
        if (!assignments.value[clientId]) return
        assignments.value[clientId] = assignments.value[clientId].filter(a => a.staffId !== staffId)
        if (assignments.value[clientId].length === 0) {
            delete assignments.value[clientId]
        }
        saveAssignments(assignments.value)
    }

    /** 顧問先の担当スタッフ一覧を取得 */
    function getAssignedStaff(clientId: string): (Staff & { assignmentRole: AssignmentRole })[] {
        const clientAssignments = assignments.value[clientId] ?? []
        return clientAssignments
            .map(a => {
                const staff = staffList.value.find(s => s.uuid === a.staffId)
                if (!staff) return null
                return { ...staff, assignmentRole: a.role }
            })
            .filter((s): s is Staff & { assignmentRole: AssignmentRole } => s !== null)
    }

    /** 顧問先のメイン担当スタッフ名を取得 */
    function getMainStaffName(clientId: string): string {
        const assigned = getAssignedStaff(clientId)
        const main = assigned.find(s => s.assignmentRole === 'main')
        return main?.name ?? ''
    }

    return {
        staffList,
        activeStaff,
        adminStaff,
        assignments,
        assignStaff,
        unassignStaff,
        getAssignedStaff,
        getMainStaffName,
    }
}
