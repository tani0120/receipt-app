/**
 * staffStore — スタッフ管理Piniaストア
 *
 * useStaff.tsのモジュールスコープをPinia + persistedstateに移行。
 *
 * 準拠: DL-042, plan_pinia_persistedstate移行.md
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Staff } from '@/repositories/types'
import { createApiClient } from '@/utils/apiClient'

const api = createApiClient('/api/staff')

export const useStaffStore = defineStore('staff', () => {
  const staffList = ref<Staff[]>([])
  const cachedAt = ref<number | null>(null)
  const lastError = ref<string | null>(null)

  async function load() {
    if (staffList.value.length) {
      // キャッシュあり → 即時表示。裏でAPI取得（fire-and-forget）
      fetchFresh()
      return
    }
    // キャッシュなし → APIを待つ
    await fetchFresh()
  }

  async function fetchFresh() {
    try {
      const data = await api.get<{ staff: Staff[] }>('')
      staffList.value = data.staff
      cachedAt.value = Date.now()
      console.log(`[staffStore] ${data.staff.length}件をサーバーから取得`)
    } catch (err) {
      console.error('[staffStore] サーバー取得失敗:', err)
    }
  }

  async function addStaff(staff: Omit<Staff, 'uuid'> & { uuid?: string }): Promise<Staff> {
    lastError.value = null
    try {
      const res = await api.post<{ ok: boolean; staff: Staff }>('', staff)
      const saved = res.staff
      staffList.value.push(saved)
      return saved
    } catch (err) {
      const msg = `スタッフ追加の保存に失敗しました: ${err}`
      console.error('[staffStore]', msg)
      lastError.value = msg
      throw err
    }
  }

  async function updateStaff(uuid: string, data: Partial<Staff>): Promise<void> {
    lastError.value = null
    try {
      await api.put(`/${uuid}`, data)
      const idx = staffList.value.findIndex(s => s.uuid === uuid)
      if (idx >= 0) {
        const current = staffList.value[idx]!
        staffList.value[idx] = { ...current, ...data, uuid }
      }
    } catch (err) {
      const msg = `スタッフ更新の保存に失敗しました: ${err}`
      console.error('[staffStore]', msg)
      lastError.value = msg
      throw err
    }
  }

  load()

  return {
    staffList, cachedAt, lastError,
    load, fetchFresh, addStaff, updateStaff,
  }
}, {
  persist: {
    key: 'sugu-suru:staff-cache',
    pick: ['staffList', 'cachedAt'],
  },
})
