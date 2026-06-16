/**
 * useAccountMaster — 勘定科目マスタ composable（Piniaストア委譲版）
 *
 * 内部はaccountMasterStoreに完全委譲。returnインターフェース変更ゼロ。
 *
 * 準拠: DL-042, plan_account_ssot.md Step 3
 */
import { storeToRefs } from 'pinia'
import { useAccountMasterStore } from '@/stores/accountMasterStore'
import type { MasterAccount } from '@/stores/accountMasterStore'

// 型re-export（互換性維持）
export type { MasterAccount }

export function useAccountMaster() {
  const store = useAccountMasterStore()
  const { allAccounts, masterAccounts, visibleMasterAccounts, overrides } = storeToRefs(store)

  return {
    /** 全科目（非表示含む） */
    masterAccounts,
    /** 表示中の科目のみ */
    visibleMasterAccounts,
    /** 現在の差分データ（顧問先コピー用。overrides互換） */
    overrides,
    /** 生データ（API直接取得結果。EnrichedAccount[]） */
    allAccounts,
    toggleVisibility: store.toggleVisibility,
    addCustomAccount: store.addCustomAccount,
    removeCustomAccount: store.removeCustomAccount,
    resetToDefault: store.resetToDefault,
    isHidden: store.isHidden,
  }
}
