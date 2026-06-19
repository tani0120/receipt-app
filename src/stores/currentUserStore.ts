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
  // 注意: Pinia永続化キー(L60)も 'sugu-suru:current-staff-uuid' だが、
  //   Piniaは {"selectedUuid":"..."} 形式でJSON保存する。
  //   旧形式は "staff-0001" のような生文字列。両方をハンドリングする。
  const PERSIST_KEY = 'sugu-suru:current-staff-uuid'
  const oldValue = localStorage.getItem(PERSIST_KEY)
  if (oldValue && !selectedUuid.value) {
    // Pinia永続化形式（JSON）か旧形式（生文字列）かを判定
    try {
      const parsed = JSON.parse(oldValue) as { selectedUuid?: string }
      if (parsed.selectedUuid) {
        selectedUuid.value = parsed.selectedUuid
      }
    } catch {
      // JSON.parseに失敗 = 旧形式の生文字列
      selectedUuid.value = oldValue
    }
    console.log(`[currentUserStore] localStorage復元: ${selectedUuid.value}`)
  }

  return { selectedUuid, setUuid, syncFromServer }
}, {
  persist: {
    key: 'sugu-suru:current-staff-uuid',
    pick: ['selectedUuid'],
  },
})
