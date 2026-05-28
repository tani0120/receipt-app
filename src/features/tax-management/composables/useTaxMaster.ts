/**
 * useTaxMaster — 税区分マスタ composable（Piniaストア委譲版）
 *
 * 内部はtaxMasterStoreに完全委譲。returnインターフェース変更ゼロ。
 *
 * 準拠: DL-042, plan_pinia_persistedstate移行.md
 */
import { storeToRefs } from 'pinia'
import { useTaxMasterStore } from '@/stores/taxMasterStore'
import type { MasterTaxCategory } from '@/stores/taxMasterStore'

// 型re-export（互換性維持）
export type { MasterTaxCategory }

export function useTaxMaster() {
  const store = useTaxMasterStore()
  const { allTaxCategories, masterTaxCategories, visibleMasterTaxCategories, overrides } = storeToRefs(store)

  return {
    /** 全税区分（非表示含む） */
    masterTaxCategories,
    /** 表示中の税区分のみ */
    visibleMasterTaxCategories,
    /** 現在の差分データ（overrides互換） */
    overrides,
    /** 生データ（API直接取得結果） */
    allTaxCategories,
    toggleVisibility: store.toggleVisibility,
    setDefaultVisible: store.setDefaultVisible,
    resetToDefault: store.resetToDefault,
  }
}
