/**
 * taxMasterStore — 税区分マスタ Piniaストア
 *
 * useTaxMaster.tsのモジュールスコープをPinia + persistedstateに移行。
 *
 * 準拠: DL-042, plan_pinia_persistedstate移行.md
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TaxCategory } from '@/types/shared-tax-category'
import { createRepositories } from '@/repositories'
import { isCacheExpired } from '@/utils/cacheUtils'

/** マスタレベルの税区分拡張 */
export interface MasterTaxCategory extends TaxCategory {
  hiddenInMaster: boolean
}

// Repository経由でデータアクセス
const repos = createRepositories()


export const useTaxMasterStore = defineStore('taxMaster', () => {
  const allTaxCategories = ref<TaxCategory[]>([])
  const cachedAt = ref<number | null>(null)
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  async function load() {
    if (allTaxCategories.value.length && !isCacheExpired(cachedAt.value)) {
      // キャッシュ有効 → 即時表示。裏でAPI取得（fire-and-forget）
      fetchFresh()
      return
    }
    // キャッシュなし or 期限切れ → APIを待つ
    await fetchFresh()
  }

  async function fetchFresh() {
    try {
      const items = await repos.taxMaster.getMaster()
      allTaxCategories.value = migrateLegacyFields(items)
      cachedAt.value = Date.now()
      console.log(`[taxMasterStore] ${items.length}件をサーバーから取得`)
    } catch (err) {
      console.error('[taxMasterStore] サーバー取得失敗:', err)
      cachedAt.value = null // 次回load()でawaitに戻す
    }
  }

  function migrateLegacyFields(items: TaxCategory[]): TaxCategory[] {
    return items.map(tc => {
      // Piniaキャッシュには旧バージョンデータが残存する可能性がある。
      // hidden が必須化される前のデータも扱うため、ここでは
      // TaxCategory として扱わず Record<string, unknown> として検査する。
      const raw = tc as unknown as Record<string, unknown>
      if ('deprecated' in raw && !('hidden' in raw)) {
        return { ...tc, hidden: Boolean(raw.deprecated) }
      }
      return tc
    })
  }

  function debounceSave(): void {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      repos.taxMaster.saveMaster(allTaxCategories.value)
        .catch(err => console.error('[taxMasterStore] サーバー保存失敗:', err))
    }, 300)
  }

  const masterTaxCategories = computed<MasterTaxCategory[]>(() => {
    return allTaxCategories.value
      .map(tc => ({
        ...tc,
        hiddenInMaster: tc.hidden === true,
      }))
      .sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999))
  })

  const visibleMasterTaxCategories = computed<MasterTaxCategory[]>(() =>
    masterTaxCategories.value.filter(tc => {
      if (tc.hiddenInMaster) return false
      return tc.defaultVisible
    })
  )

  const overrides = computed(() => ({
    hiddenIds: allTaxCategories.value.filter(tc => tc.hidden).map(tc => tc.taxCategoryId),
    visibilityOverrides: {} as Record<string, boolean>,
    customTaxCategories: allTaxCategories.value.filter(tc => tc.isCustom),
  }))

  function toggleVisibility(taxCategoryId: string): void {
    const idx = allTaxCategories.value.findIndex(tc => tc.taxCategoryId === taxCategoryId)
    if (idx >= 0) {
      const current = allTaxCategories.value[idx]!
      allTaxCategories.value[idx] = { ...current, hidden: !current.hidden }
      debounceSave()
    }
  }

  function setDefaultVisible(taxCategoryId: string, visible: boolean): void {
    const idx = allTaxCategories.value.findIndex(tc => tc.taxCategoryId === taxCategoryId)
    if (idx >= 0) {
      const current = allTaxCategories.value[idx]!
      allTaxCategories.value[idx] = { ...current, defaultVisible: visible }
      debounceSave()
    }
  }

  function resetToDefault(): void {
    allTaxCategories.value = allTaxCategories.value
      .filter(tc => !tc.isCustom)
      .map(tc => ({ ...tc, hidden: false }))
    debounceSave()
  }

  load()

  return {
    allTaxCategories, cachedAt,
    masterTaxCategories, visibleMasterTaxCategories, overrides,
    load, fetchFresh,
    toggleVisibility, setDefaultVisible, resetToDefault,
  }
}, {
  persist: {
    key: 'sugu-suru:tax-master-cache',
    pick: ['allTaxCategories', 'cachedAt'],
  },
})
