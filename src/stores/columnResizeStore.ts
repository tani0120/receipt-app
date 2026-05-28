/**
 * columnResizeStore — テーブル列幅管理Piniaストア
 *
 * useColumnResize.tsのlocalStorage手動管理をPinia + persistedstateに移行。
 * pageKeyごとに1ストアインスタンスを共有。
 *
 * 準拠: plan_pinia_persistedstate移行.md
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 全ページの列幅をまとめて管理するストア */
export const useColumnResizeStore = defineStore('columnResize', () => {
  /** pageKey → { colKey → width } */
  const allWidths = ref<Record<string, Record<string, number>>>({})

  function getWidths(pageKey: string, defaults: Record<string, number>): Record<string, number> {
    if (!allWidths.value[pageKey]) {
      // 旧localStorageからのマイグレーション
      const oldKey = `sugu-suru:column-widths:${pageKey}`
      try {
        const saved = localStorage.getItem(oldKey)
        if (saved) {
          allWidths.value[pageKey] = JSON.parse(saved)
          localStorage.removeItem(oldKey)
          console.log(`[columnResizeStore] localStorage → Pinia移行: ${pageKey}`)
        }
      } catch { /* 無視 */ }
    }
    if (!allWidths.value[pageKey]) {
      allWidths.value[pageKey] = { ...defaults }
    }
    return allWidths.value[pageKey]
  }

  function setWidth(pageKey: string, colKey: string, width: number) {
    if (!allWidths.value[pageKey]) allWidths.value[pageKey] = {}
    allWidths.value[pageKey][colKey] = width
  }

  function resetPage(pageKey: string) {
    delete allWidths.value[pageKey]
  }

  return { allWidths, getWidths, setWidth, resetPage }
}, {
  persist: {
    key: 'sugu-suru:column-widths',
    pick: ['allWidths'],
  },
})
