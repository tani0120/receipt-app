/**
 * useAccountSettings — 統合設定 composable（縮退版）
 *
 * 【設計経緯】
 * 元々は勘定科目と税区分の両方を管理するcomposableだったが、
 * 勘定科目側はaccountMasterStore / clientAccountStoreに直結化（SSOT化）したため、
 * 科目側はStore参照のみに縮退。enrichロジック・overrides分解・再構成は全て廃止済み。
 *
 * TODO(Phase TaxCategory):
 * Account側のStore直結化完了後、
 * TaxCategoryも同じパターンへ移行する。
 *
 * 現在は互換性維持のため旧composableを利用。
 * 移行対象: filteredTaxCategories, resolveTaxCategoryName,
 *           saveTaxCategories, toggleTaxVisibility 等
 *
 * 移行完了後、このcomposable自体が不要になる可能性がある。
 */
import { ref, computed, type Ref } from 'vue'
import { useAccountMaster } from '@/features/account-management/composables/useAccountMaster'
import { useTaxMaster } from '@/features/tax-management/composables/useTaxMaster'
import { useClientTaxCategories } from '@/features/tax-management/composables/useClientTaxCategories'
import { useClientAccountStore } from '@/stores/clientAccountStore'
import type { Account, EnrichedAccount } from '@/types/shared-account'
import type { TaxCategory } from '@/types/shared-tax-category'
import type { UnifiedAccount, UnifiedTaxCategory, AccountSettingsReturn } from '../types/account-settings.types'

export function useAccountSettings(scope: 'master'): AccountSettingsReturn
export function useAccountSettings(scope: 'client', clientId: string): AccountSettingsReturn
export function useAccountSettings(scope: 'master' | 'client', clientId?: string): AccountSettingsReturn {

  // ==============================
  // 内部composable接続
  // ==============================
  const accountMaster = useAccountMaster()
  const taxMaster = useTaxMaster()
  const clientAccountStore = useClientAccountStore()
  const clientTaxComposable = scope === 'client' && clientId
    ? useClientTaxCategories(clientId) : null

  // 旧useClientAccountsと同様に、初回アクセスで自動ロード（fire-and-forget）
  // SWRパターン: キャッシュがあれば即時表示 → 裏でfetchFresh
  if (scope === 'client' && clientId) {
    clientAccountStore.load(clientId)
  }

  // ==============================
  // 補助科目（scope='client'のみ有効）
  // ==============================
  const subAccounts: Ref<Record<string, string>> = scope === 'client' && clientId
    ? computed(() => clientAccountStore.subAccountsMap[clientId] ?? {}) as unknown as Ref<Record<string, string>>
    : ref<Record<string, string>>({})

  // ==============================
  // accounts computed（Store直結。overrides再構成は廃止済み）
  // ==============================
  const accounts = computed<UnifiedAccount[]>(() => {
    if (scope === 'master') {
      // accountMasterStore.masterAccounts → EnrichedAccount[] → UnifiedAccount互換
      return accountMaster.masterAccounts.value.map(a => {
        const source: UnifiedAccount['source'] = a.source ?? 'mcp'
        return {
          ...a,
          hidden: a.hiddenInMaster,
          hiddenInMaster: false,
          source,
        }
      })
    }
    // scope === 'client': clientAccountStore直結
    if (!clientId) {
      console.error('[useAccountSettings] scope="client" but clientId missing')
      return []
    }
    const clientAccounts = clientAccountStore.getAccounts(clientId)
    return clientAccounts.map(a => {
      const source: UnifiedAccount['source'] = a.source ?? 'mcp'
      return {
        ...a,
        hiddenInMaster: false,
        source,
      }
    })
  })

  const visibleAccounts = computed<UnifiedAccount[]>(() =>
    accounts.value.filter(a => !a.hidden && !a.hiddenInMaster)
  )

  const newMasterAccounts = computed(() => [] as Account[])

  // デフォルト科目順序（allAccountsの元順序）
  const defaultAccountOrder = computed(() =>
    new Map(accountMaster.allAccounts.value.map((a, i) => [a.accountId, i]))
  )

  // ==============================
  // taxCategories computed（税区分 — 現行維持）
  // ==============================
  const taxCategories = computed<UnifiedTaxCategory[]>(() => {
    if (scope === 'master') {
      return taxMaster.masterTaxCategories.value.map(tc => {
        const source: UnifiedTaxCategory['source'] = tc.source ?? 'mcp'
        return {
          ...tc,
          hidden: tc.hiddenInMaster,
          hiddenInMaster: false,
          defaultVisible: tc.defaultVisible,
          visibilityOverride: taxMaster.overrides.value.visibilityOverrides[tc.taxCategoryId] ?? null,
          source,
        }
      })
    }
    if (!clientTaxComposable) {
      console.error('[useAccountSettings] scope="client" but clientTaxComposable is null (clientId missing?)')
      return taxMaster.masterTaxCategories.value.map(tc => {
        const source: UnifiedTaxCategory['source'] = tc.source ?? 'mcp'
        return {
          ...tc,
          hidden: tc.hiddenInMaster,
          hiddenInMaster: false,
          defaultVisible: tc.defaultVisible,
          visibilityOverride: taxMaster.overrides.value.visibilityOverrides[tc.taxCategoryId] ?? null,
          source,
        }
      })
    }
    return clientTaxComposable.clientTaxCategories.value.map(tc => {
      const source: UnifiedTaxCategory['source'] = tc.source ?? 'mcp'
      return {
        ...tc,
        hidden: tc.hiddenInClient || tc.hiddenInMaster,
        defaultVisible: tc.defaultVisible,
        visibilityOverride: null as boolean | null,
        source,
      }
    })
  })

  const visibleTaxCategories = computed<UnifiedTaxCategory[]>(() =>
    taxCategories.value.filter(tc => !tc.hidden && !tc.hiddenInMaster)
  )

  // デフォルト税区分順序（allTaxCategoriesの元順序）
  const defaultTaxOrder = computed(() =>
    new Map(taxMaster.allTaxCategories.value.map((t, i) => [t.taxCategoryId, i]))
  )

  // ==============================
  // 税区分ユーティリティ
  // ==============================
  function filteredTaxCategories(
    direction: 'sales' | 'purchase' | 'common',
    consumptionTaxMode?: 'general' | 'individual' | 'proportional' | 'simplified' | 'exempt'
  ): UnifiedTaxCategory[] {
    const normalizedMode = consumptionTaxMode === 'individual' || consumptionTaxMode === 'proportional'
      ? 'general' : consumptionTaxMode

    return taxCategories.value.filter(tc => {
      if (tc.hidden || tc.hiddenInMaster) return false
      if (direction === 'sales' && tc.direction !== 'sales' && tc.direction !== 'common') return false
      if (direction === 'purchase' && tc.direction !== 'purchase' && tc.direction !== 'common') return false
      if (direction === 'common' && tc.direction !== 'common') return false
      if (!normalizedMode) return true
      if (normalizedMode === 'exempt') return tc.direction === 'common'
      const isSimplifiedTaxCategory = tc.simplifiedOnly === true
      if (normalizedMode === 'general') return !isSimplifiedTaxCategory
      if (normalizedMode === 'simplified') {
        if (isSimplifiedTaxCategory && tc.direction !== 'sales') return false
        return true
      }
      return true
    })
  }

  function resolveTaxCategoryName(id: string | null | undefined): string {
    if (!id) return ''
    const found = taxCategories.value.find(tc => tc.taxCategoryId === id)
    return found ? found.name : id
  }

  function resolveTaxCategoryShortName(id: string | null | undefined): string {
    if (!id) return ''
    const found = taxCategories.value.find(tc => tc.taxCategoryId === id)
    return found ? found.shortName : id
  }

  // ==============================
  // 勘定科目 書き込み操作（Store直結）
  // ==============================
  function toggleAccountVisibility(accountId: string): void {
    if (scope === 'master') {
      accountMaster.toggleVisibility(accountId)
    } else if (clientId) {
      clientAccountStore.toggleHidden(clientId, accountId)
    }
  }

  function isAccountHidden(accountId: string): boolean {
    if (scope === 'master') {
      return accountMaster.isHidden(accountId)
    }
    if (!clientId) return false
    const accts = clientAccountStore.getAccounts(clientId)
    return accts.find(a => a.accountId === accountId)?.hidden === true
  }

  function addCustomAccount(account: Account): void {
    if (scope !== 'master') {
      console.warn('addCustomAccount はscope="master"でのみ使用可能')
      return
    }
    accountMaster.addCustomAccount(account)
  }

  function removeCustomAccount(accountId: string): boolean {
    if (scope !== 'master') {
      console.warn('removeCustomAccount はscope="master"でのみ使用可能')
      return false
    }
    return accountMaster.removeCustomAccount(accountId)
  }

  function resetAccountsToDefault(): void {
    if (scope === 'master') {
      accountMaster.resetToDefault()
    }
    // 顧問先: 未実装（Store直結化後に必要ならStore側に追加）
  }

  function syncAccountsFromMaster(): number {
    // 旧composable依存を削除。Store直結化後は不要
    return 0
  }

  // ==============================
  // 税区分 書き込み操作
  // ==============================
  function toggleTaxVisibility(taxCategoryId: string): void {
    if (scope === 'master') {
      taxMaster.toggleVisibility(taxCategoryId)
    } else {
      clientTaxComposable?.toggleVisibility(taxCategoryId)
    }
  }

  function setTaxDefaultVisible(taxCategoryId: string, visible: boolean): void {
    if (scope !== 'master') {
      console.warn('setTaxDefaultVisible はscope="master"でのみ使用可能')
      return
    }
    taxMaster.setDefaultVisible(taxCategoryId, visible)
  }

  function resetTaxToDefault(): void {
    if (scope === 'master') {
      taxMaster.resetToDefault()
    } else {
      clientTaxComposable?.resetToDefault()
    }
  }

  // ==============================
  // 保存
  // ==============================
  function saveAccounts(allRows: Account[], _subAccountsInput?: Record<string, string>): void {
    if (scope === 'master') {
      // EnrichedAccountはAccount extends。実行時にはenrichフィールドが存在する
      accountMaster.allAccounts.value = allRows as EnrichedAccount[]
    } else if (clientId) {
      // 仕訳ページからの互換呼び出し用
      clientAccountStore.saveAll(clientId, allRows as EnrichedAccount[])
    }
  }

  function saveTaxCategories(allRows: TaxCategory[]): void {
    if (scope === 'master') {
      taxMaster.allTaxCategories.value = allRows
    } else {
      clientTaxComposable?.saveAll(allRows)
    }
  }

  // ==============================
  // デフォルトIDセット
  // ==============================
  const defaultAccountIds = computed(() => new Set(
    accountMaster.allAccounts.value.filter(a => !a.isCustom).map(a => a.accountId)
  ))
  const defaultTaxIds = computed(() => new Set(
    taxMaster.allTaxCategories.value.filter(t => !t.isCustom).map(t => t.taxCategoryId)
  ))

  // ==============================
  // return
  // ==============================
  return {
    // 勘定科目（読み取り — Store直結。仕訳ページ互換）
    accounts,
    visibleAccounts,
    subAccounts,
    newMasterAccounts,
    defaultAccountOrder,
    // 税区分（読み取り）
    taxCategories,
    visibleTaxCategories,
    defaultTaxOrder,
    // 税区分ユーティリティ
    filteredTaxCategories,
    resolveTaxCategoryName,
    resolveTaxCategoryShortName,
    // 勘定科目（書き込み — Store直結）
    toggleAccountVisibility,
    isAccountHidden,
    addCustomAccount,
    removeCustomAccount,
    resetAccountsToDefault,
    syncAccountsFromMaster,
    // 税区分（書き込み）
    toggleTaxVisibility,
    setTaxDefaultVisible,
    resetTaxToDefault,
    // 保存
    saveAccounts,
    saveTaxCategories,
    // メタ情報
    scope,
    clientId: clientId ?? null,
    defaultAccountIds,
    defaultTaxIds,
    // 内部composable直接参照（特殊操作用）
    _accountMasterOverrides: accountMaster.overrides,
    _taxMasterOverrides: taxMaster.overrides,
  }
}
