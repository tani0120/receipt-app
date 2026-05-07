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

  /** スタッフ追加（サーバー先行。サーバーがIDを発番して返す） */
  async function addStaff(staff: Omit<Staff, 'uuid'> & { uuid?: string }): Promise<Staff> {
    lastError.value = null
    try {
      const res = await apiPost<{ ok: boolean; staff: Staff }>('', staff)
      const saved = res.staff
      staffList.value.push(saved)
      return saved
    } catch (err) {
      const msg = `スタッフ追加の保存に失敗しました: ${err}`
      console.error('[useStaff]', msg)
      lastError.value = msg
      throw err
    }
  }

  /** スタッフ更新（サーバー保存成功 → ref反映） */
  async function updateStaff(uuid: string, data: Partial<Staff>): Promise<void> {
    lastError.value = null
    try {
      await apiPut(`/${uuid}`, data)
      const idx = staffList.value.findIndex(s => s.uuid === uuid)
      if (idx >= 0) {
        const current = staffList.value[idx]!
        staffList.value[idx] = { ...current, ...data, uuid }
      }
    } catch (err) {
      const msg = `スタッフ更新の保存に失敗しました: ${err}`
      console.error('[useStaff]', msg)
      lastError.value = msg
      throw err
    }
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
