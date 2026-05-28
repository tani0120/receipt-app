/**
 * currentUserStore — ログインスタッフ管理Piniaストア
 *
 * useCurrentUser.tsのモジュールスコープ（localStorage手動管理）を
 * Pinia + persistedstateに移行。
 *
 * 準拠: DL-042
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCurrentUserStore = defineStore('currentUser', () => {
  const selectedUuid = ref<string | null>(null)
  let serverSynced = false

  function setUuid(uuid: string) {
    selectedUuid.value = uuid
    console.log(`[currentUserStore] スタッフ切替: ${uuid}`)
    // サーバーfire-and-forget
    fetch('/api/auth/switch', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId: uuid }),
    }).catch(err => {
      console.error('[currentUserStore] サーバー同期失敗:', err)
    })
  }

  function syncFromServer() {
    if (serverSynced) return
    serverSynced = true
    fetch('/api/auth/current')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.staffId && !selectedUuid.value) {
          selectedUuid.value = data.staffId
        } else if (selectedUuid.value) {
          fetch('/api/auth/switch', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staffId: selectedUuid.value }),
          }).catch(() => { /* サイレント */ })
        }
      })
      .catch(() => { /* サイレント */ })
  }

  // 旧localStorageからのマイグレーション（1回限り）
  const oldKey = 'sugu-suru:current-staff-uuid'
  const oldValue = localStorage.getItem(oldKey)
  if (oldValue && !selectedUuid.value) {
    selectedUuid.value = oldValue
    localStorage.removeItem(oldKey)
    console.log('[currentUserStore] localStorage → Pinia移行完了')
  }

  return { selectedUuid, setUuid, syncFromServer }
}, {
  persist: {
    key: 'sugu-suru:current-staff-uuid',
    pick: ['selectedUuid'],
  },
})
