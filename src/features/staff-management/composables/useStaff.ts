/**
 * useStaff — スタッフ管理composable（API接続版）
 *
 * 【設計原則】
 * - 型はrepositories/types.tsから一元参照（二重定義禁止）
 * - モジュールスコープrefでキャッシュ（ページ遷移しても保持）
 * - ref即反映 + サーバーfire-and-forget（useDocumentsと同パターン）
 * - CRUDはサーバー側staffStore.tsに委譲
 *
 * 準拠: DL-042
 */

import { ref, computed } from 'vue'
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
    email: '',
    password: '',
    role: 'general',
    status: 'active',
  }
}

/** スタッフUUIDを生成（既存の最大連番+1） */
export function generateStaffUuid(): string {
  let maxNum = 0
  for (const s of staffList.value) {
    const match = s.uuid.match(/^staff-(\d+)$/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxNum) maxNum = num
    }
  }
  return `staff-${String(maxNum + 1).padStart(4, '0')}`
}

// ============================================================
// API通信ヘルパー
// ============================================================

const API_BASE = '/api/staff'

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API GET ${path} failed: ${res.status}`)
  return res.json()
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API POST ${path} failed: ${res.status}`)
  return res.json()
}

async function apiPut(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API PUT ${path} failed: ${res.status}`)
}

// ============================================================
// モジュールスコープ（シングルトン）
// ============================================================

const staffList = ref<Staff[]>([])
let initialized = false

/** サーバーからスタッフ一覧を取得してrefに設定 */
async function refresh(): Promise<void> {
  try {
    const data = await apiGet<{ staff: Staff[] }>('')
    staffList.value = data.staff
    initialized = true
    console.log(`[useStaff] ${data.staff.length}件をサーバーから取得`)
  } catch (err) {
    console.error('[useStaff] サーバー取得失敗:', err)
  }
}

/** 初回のみサーバーから読み込み */
async function ensureLoaded(): Promise<void> {
  if (!initialized) {
    await refresh()
  }
}

// 初回自動読み込み（fire-and-forget）
ensureLoaded()

// ============================================================
// Composable
// ============================================================

/** API通信エラーメッセージ（UIで表示可能） */
const lastError = ref<string | null>(null)

export function useStaff() {
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

  /** スタッフ追加（ref即反映 + サーバーfire-and-forget） */
  function addStaff(staff: Staff): void {
    staffList.value.push(staff)
    lastError.value = null
    apiPost('', staff).catch(err => {
      const msg = `スタッフ追加の保存に失敗しました: ${err}`
      console.error('[useStaff]', msg)
      lastError.value = msg
    })
  }

  /** スタッフ更新（ref即反映 + サーバーfire-and-forget） */
  function updateStaff(uuid: string, data: Partial<Staff>): void {
    const idx = staffList.value.findIndex(s => s.uuid === uuid)
    if (idx >= 0) {
      staffList.value[idx] = { ...staffList.value[idx], ...data, uuid }
    }
    lastError.value = null
    apiPut(`/${uuid}`, data).catch(err => {
      const msg = `スタッフ更新の保存に失敗しました: ${err}`
      console.error('[useStaff]', msg)
      lastError.value = msg
    })
  }

  return {
    staffList,
    activeStaff,
    adminStaff,
    getStaffName,
    isEmailRegistered,
    getStaffByEmail,
    addStaff,
    updateStaff,
    refresh,
    lastError,
  }
}
