import { ref, computed } from 'vue'
import { useAccountMaster } from '@/features/account-management/composables/useAccountMaster'
import { useTaxMaster } from '@/features/tax-management/composables/useTaxMaster'
import { useClientAccounts } from '@/features/account-management/composables/useClientAccounts'
import { useClientTaxCategories } from '@/features/tax-management/composables/useClientTaxCategories'
import { ACCOUNT_MASTER } from '@/shared/data/account-master'
import { TAX_CATEGORY_MASTER } from '@/shared/data/tax-category-master'
import type { Account } from '@/shared/types/account'
import type { TaxCategory } from '@/shared/types/tax-category'
import type { UnifiedAccount, UnifiedTaxCategory, AccountSettingsReturn } from '../types/account-settings.types'

export function useAccountSettings(scope: 'master'): AccountSettingsReturn
export function useAccountSettings(scope: 'client', clientId: string): AccountSettingsReturn
export function useAccountSettings(scope: 'master' | 'client', clientId?: string): AccountSettingsReturn {

  // ==============================
  // 内部composable接続
  // ==============================
  // ※ ページから直接importさせない。ここで全て接続する。
  const accountMaster = useAccountMaster()
  const taxMaster = useTaxMaster()
  const clientAccountsComposable = scope === 'client' && clientId
    ? useClientAccounts(clientId) : null
  const clientTaxComposable = scope === 'client' && clientId
    ? useClientTaxCategories(clientId) : null

  // ==============================
  // 旧キーマイグレーション（scope='client'のみ）
  // ==============================
  if (scope === 'client' && clientId) {
    const oldTaxKey = 'sugu-suru:client-tax-page:' + clientId
    const oldData = localStorage.getItem(oldTaxKey)
    if (oldData && clientTaxComposable) {
      try {
        const parsed = JSON.parse(oldData)
        if (Array.isArray(parsed)) {
          clientTaxComposable.saveAll(parsed)
        }
      } catch { /* 破損データは無視 */ }
      localStorage.removeItem(oldTaxKey)
    }
  }

  // ==============================
  // 補助科目（scope='client'のみ有効）
  // ==============================
  const subAccounts = scope === 'client' && clientAccountsComposable
    ? clientAccountsComposable.subAccounts
    : ref<Record<string, string>>({})

  // ==============================
  // accounts computed
  // ==============================
  const accounts = computed<UnifiedAccount[]>(() => {
    if (scope === 'master') {
      return accountMaster.masterAccounts.value.map(a => {
        const source: UnifiedAccount['source'] = a.isCustom ? 'master-custom' : 'default'
        return {
          ...a,
          hidden: a.hiddenInMaster,
          hiddenInMaster: false,
          isMasterCustom: a.isCustom,
          isClientCustom: false,
          source,
        }
      })
    }
    // scope === 'client'
    if (!clientAccountsComposable) {
      console.error('[useAccountSettings] scope="client" but clientAccountsComposable is null (clientId missing?)')
      // フォールバック: マスタデータを返す（呼び出し側でmasterSettings参照を不要にする）
      return accountMaster.masterAccounts.value.map(a => {
        const source: UnifiedAccount['source'] = a.isCustom ? 'master-custom' : 'default'
        return {
          ...a,
          hidden: a.hiddenInMaster,
          hiddenInMaster: false,
          isMasterCustom: a.isCustom,
          isClientCustom: false,
          source,
        }
      })
    }
    return clientAccountsComposable.clientAccounts.value.map(a => {
      const source: UnifiedAccount['source'] = a.isMasterCustom ? 'master-custom' : a.isCustom ? 'client-custom' : 'default'
      return {
        ...a,
        hidden: a.hiddenInClient,
        isMasterCustom: a.isMasterCustom,
        isClientCustom: a.isCustom && !a.isMasterCustom,
        source,
      }
    })
  })

  const visibleAccounts = computed<UnifiedAccount[]>(() =>
    accounts.value.filter(a => !a.hidden && !a.hiddenInMaster)
  )

  const newMasterAccounts = computed(() =>
    clientAccountsComposable ? clientAccountsComposable.newMasterAccounts.value : []
  )

  // デフォルト科目順序（ACCOUNT_MASTERの元順序）
  const defaultAccountOrder = computed(() =>
    new Map(ACCOUNT_MASTER.map((a, i) => [a.id, i]))
  )

  // ==============================
  // taxCategories computed
  // ==============================
  const taxCategories = computed<UnifiedTaxCategory[]>(() => {
    if (scope === 'master') {
      return taxMaster.masterTaxCategories.value.map(tc => {
        const source: UnifiedTaxCategory['source'] = tc.isCustom ? 'master-custom' : 'default'
        return {
          ...tc,
          hidden: tc.hiddenInMaster,
          hiddenInMaster: false,
          defaultVisible: tc.defaultVisible,
          visibilityOverride: taxMaster.overrides.value.visibilityOverrides[tc.id] ?? null,
          source,
        }
      })
    }
    if (!clientTaxComposable) {
      console.error('[useAccountSettings] scope="client" but clientTaxComposable is null (clientId missing?)')
      // フォールバック: マスタ税区分を返す
      return taxMaster.masterTaxCategories.value.map(tc => {
        const source: UnifiedTaxCategory['source'] = tc.isCustom ? 'master-custom' : 'default'
        return {
          ...tc,
          hidden: tc.hiddenInMaster,
          hiddenInMaster: false,
          defaultVisible: tc.defaultVisible,
          visibilityOverride: taxMaster.overrides.value.visibilityOverrides[tc.id] ?? null,
          source,
        }
      })
    }
    return clientTaxComposable.clientTaxCategories.value.map(tc => {
      // マスタカスタムか顧問先カスタムかの判定
      // マスタのcustomTaxCategoriesリストにIDが含まれるかで判定（hiddenInMasterに依存しない）
      const masterCustomIds = new Set(
        (taxMaster.overrides.value.customTaxCategories ?? []).map(c => c.id)
      )
      const isMasterCustom = masterCustomIds.has(tc.id) && tc.isCustom
      const isClientCustom = tc.isCustom && !isMasterCustom
      const source: UnifiedTaxCategory['source'] = isMasterCustom ? 'master-custom' : isClientCustom ? 'client-custom' : 'default'
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

  // デフォルト税区分順序（TAX_CATEGORY_MASTERの元順序）
  const defaultTaxOrder = computed(() =>
    new Map(TAX_CATEGORY_MASTER.map((t, i) => [t.id, i]))
  )

  // ==============================
  // 税区分ユーティリティ
  // ==============================
  function filteredTaxCategories(
    direction: 'sales' | 'purchase' | 'common',
    consumptionTaxMode?: 'general' | 'simplified' | 'exempt'
  ): UnifiedTaxCategory[] {
    return taxCategories.value.filter(tc => {
      if (tc.hidden || tc.hiddenInMaster) return false

      // 方向フィルタ（既存ロジック）
      if (direction === 'sales' && tc.direction !== 'sales' && tc.direction !== 'common') return false
      if (direction === 'purchase' && tc.direction !== 'purchase' && tc.direction !== 'common') return false
      if (direction === 'common' && tc.direction !== 'common') return false

      // 課税方式フィルタ（consumptionTaxMode省略時は従来動作）
      if (!consumptionTaxMode) return true

      // 免税事業者: 「対象外」のみ
      if (consumptionTaxMode === 'exempt') return tc.id === 'COMMON_EXEMPT'

      // 簡易課税判定: IDサフィックス _T1〜_T6
      const isSimplifiedTaxCategory = /_T[1-6]$/.test(tc.id)

      // 本則課税: 業種区分付き税区分を除外
      if (consumptionTaxMode === 'general') return !isSimplifiedTaxCategory

      // 簡易課税: 一般 + 業種区分付き（売上側のみ）
      if (consumptionTaxMode === 'simplified') {
        if (isSimplifiedTaxCategory && tc.direction !== 'sales') return false
        return true
      }

      return true
    })
  }

  function resolveTaxCategoryName(id: string | null | undefined): string {
    if (!id) return ''
    const found = taxCategories.value.find(tc => tc.id === id)
    return found ? found.name : id
  }

  function resolveTaxCategoryShortName(id: string | null | undefined): string {
    if (!id) return ''
    const found = taxCategories.value.find(tc => tc.id === id)
    return found ? found.shortName : id
  }

  // ==============================
  // 勘定科目 書き込み操作
  // ==============================
  function toggleAccountVisibility(accountId: string): void {
    if (scope === 'master') {
      accountMaster.toggleVisibility(accountId)
    } else {
      clientAccountsComposable?.toggleVisibility(accountId)
    }
  }

  function isAccountHidden(accountId: string): boolean {
    if (scope === 'master') {
      return accountMaster.isHidden(accountId)
    }
    if (!clientAccountsComposable) return false
    const entry = clientAccountsComposable.clientAccounts.value.find(a => a.id === accountId)
    if (!entry) return false
    return entry.hiddenInClient || entry.hiddenInMaster
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
    } else {
      clientAccountsComposable?.resetToDefault()
    }
  }

  function syncAccountsFromMaster(): number {
    if (scope !== 'client' || !clientAccountsComposable) return 0
    return clientAccountsComposable.syncFromMaster()
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
  function saveAccounts(allRows: Account[], subAccountsInput?: Record<string, string>): void {
    if (scope === 'master') {
      // マスタスコープ: overrides同期
      const hiddenIds = allRows
        .filter(r => !r.isCustom && (r.deprecated || r.effectiveTo))
        .map(r => r.id)
      // ACCOUNT_MASTERに存在しないID = カスタム追加された行（MF準拠昇格でisCustom=falseでも保持）
      const defaultAccountIds = new Set(ACCOUNT_MASTER.map(a => a.id))
      const customAccounts = allRows.filter(r => !defaultAccountIds.has(r.id))
      accountMaster.overrides.value = { hiddenIds, customAccounts }
      localStorage.setItem(
        'sugu-suru:account-master:overrides',
        JSON.stringify(accountMaster.overrides.value)
      )
    } else {
      // 顧問先スコープ: composable.saveAll()に委譲
      clientAccountsComposable?.saveAll(allRows, subAccountsInput)
    }
  }

  function saveTaxCategories(allRows: TaxCategory[]): void {
    if (scope === 'master') {
      // マスタスコープ: overrides同期
      const hiddenIds = allRows.filter(r => r.deprecated).map(r => r.id)
      // TAX_CATEGORY_MASTERに存在しないID = カスタム追加された行（MF準拠昇格でisCustom=falseでも保持）
      const defaultTaxIds = new Set(TAX_CATEGORY_MASTER.map(t => t.id))
      const customTaxCategories = allRows.filter(r => !defaultTaxIds.has(r.id))
      taxMaster.overrides.value = {
        ...taxMaster.overrides.value,
        hiddenIds,
        customTaxCategories,
      }
      localStorage.setItem(
        'sugu-suru:tax-master:overrides',
        JSON.stringify(taxMaster.overrides.value)
      )
    } else {
      // 顧問先スコープ: composable.saveAll()に委譲
      clientTaxComposable?.saveAll(allRows)
      // 旧キーが残っていたら削除
      if (clientId) {
        localStorage.removeItem('sugu-suru:client-tax-page:' + clientId)
      }
    }
  }

  // ==============================
  // デフォルトIDセット（出自判定用。カスタム追加行の末尾ソートに使用）
  // ==============================
  const defaultAccountIds = computed(() => new Set(ACCOUNT_MASTER.map(a => a.id)))
  const defaultTaxIds = computed(() => new Set(TAX_CATEGORY_MASTER.map(t => t.id)))

  // ==============================
  // return
  // ==============================
  return {
    // 勘定科目（読み取り）
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
    // 勘定科目（書き込み）
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
