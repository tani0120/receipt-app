/**
 * homeMenuStore — ホームメニュー順序管理Piniaストア
 *
 * MockHomePage.vueのlocalStorage手動管理をPinia + persistedstateに移行。
 *
 * 準拠: plan_pinia_persistedstate移行.md
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useHomeMenuStore = defineStore('homeMenu', () => {
  /** staffUuid → menuKey[] の順序マップ */
  const menuOrders = ref<Record<string, string[]>>({})

  function getOrder(staffUuid: string, defaultKeys: string[]): string[] {
    if (!menuOrders.value[staffUuid]) {
      // 旧localStorageからのマイグレーション
      const oldKey = `home_menu_order_${staffUuid}`
      try {
        const saved = localStorage.getItem(oldKey)
        if (saved) {
          const keys = JSON.parse(saved) as string[]
          if (keys.length === defaultKeys.length && keys.every(k => defaultKeys.includes(k))) {
            menuOrders.value[staffUuid] = keys
            localStorage.removeItem(oldKey)
            console.log(`[homeMenuStore] localStorage → Pinia移行: ${staffUuid}`)
            return keys
          }
        }
      } catch { /* 無視 */ }
      menuOrders.value[staffUuid] = [...defaultKeys]
    }
    return menuOrders.value[staffUuid]
  }

  function setOrder(staffUuid: string, keys: string[]) {
    menuOrders.value[staffUuid] = keys
  }

  return { menuOrders, getOrder, setOrder }
}, {
  persist: {
    key: 'sugu-suru:home-menu-order',
    pick: ['menuOrders'],
  },
})
