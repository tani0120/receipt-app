import type { Ref, ComputedRef } from 'vue'
import type { Account } from '@/shared/types/account'
import type { TaxCategory } from '@/shared/types/tax-category'

// =============================================
// 統一型（マスタ/顧問先の区別なく使える）
// =============================================

/** 統一科目型 */
export interface UnifiedAccount extends Account {
  /** 非表示か（scope='master'ならマスタ非表示、scope='client'なら顧問先非表示） */
  hidden: boolean
  /** マスタレベルで非表示か（scope='client'のみ。scope='master'では常にfalse） */
  hiddenInMaster: boolean
  /** マスタカスタム科目か */
  isMasterCustom: boolean
  /** 顧問先カスタム科目か（scope='client'のみ） */
  isClientCustom: boolean
  /** ソース区分（テンプレート表示用） */
  source: 'default' | 'master-custom' | 'client-custom'
}

/** 統一税区分型 */
export interface UnifiedTaxCategory extends TaxCategory {
  /** 非表示か */
  hidden: boolean
  /** マスタレベルで非表示か */
  hiddenInMaster: boolean
  /** デフォルト表示設定 */
  defaultVisible: boolean
  /** マスタでの表示設定の上書き値（null=デフォルトを使用。scope='master'のみ有効） */
  visibilityOverride: boolean | null
  /** ソース区分 */
  source: 'default' | 'master-custom' | 'client-custom'
}

// =============================================
// useAccountSettings 戻り値の型
// =============================================

export interface AccountSettingsReturn {
  // ============ 勘定科目（読み取り） ============
  /** 全科目（非表示含む） */
  accounts: ComputedRef<UnifiedAccount[]>
  /** 表示中の科目のみ（hiddenフラグがfalseの行） */
  visibleAccounts: ComputedRef<UnifiedAccount[]>
  /** 補助科目マップ（科目ID → 補助科目名）。scope='client'のみ有効。scope='master'では空オブジェクト */
  subAccounts: Ref<Record<string, string>>
  /** マスタから新規追加された科目（scope='client'のみ有効。scope='master'では空配列） */
  newMasterAccounts: ComputedRef<Account[]>
  /** デフォルト科目順序Map（id → index）。ソート「デフォルト順に戻す」用 */
  defaultAccountOrder: ComputedRef<Map<string, number>>

  // ============ 税区分（読み取り） ============
  /** 全税区分（非表示含む） */
  taxCategories: ComputedRef<UnifiedTaxCategory[]>
  /** 表示中の税区分のみ */
  visibleTaxCategories: ComputedRef<UnifiedTaxCategory[]>
  /** デフォルト税区分順序Map（id → index）。ソート「デフォルト順に戻す」用 */
  defaultTaxOrder: ComputedRef<Map<string, number>>

  // ============ 税区分ユーティリティ ============
  /** direction指定でフィルタ済み税区分を返す（勘定科目の税区分ドロップダウン用） */
  filteredTaxCategories: (direction: 'sales' | 'purchase' | 'common') => UnifiedTaxCategory[]
  /** 税区分IDからname（MF正式名称）を解決する。見つからなければIDをそのまま返す */
  resolveTaxCategoryName: (id: string | null | undefined) => string
  /** 税区分IDからshortName（短縮名）を解決する。見つからなければIDをそのまま返す */
  resolveTaxCategoryShortName: (id: string | null | undefined) => string

  // ============ 勘定科目（書き込み） ============
  /** 科目の表示/非表示をトグル */
  toggleAccountVisibility: (accountId: string) => void
  /** 科目が非表示かどうか */
  isAccountHidden: (accountId: string) => boolean
  /** カスタム科目を追加（scope='master'のみ有効。scope='client'ではページ側でreactive配列にpush） */
  addCustomAccount: (account: Account) => void
  /** カスタム科目を削除（scope='master'のみ有効） */
  removeCustomAccount: (accountId: string) => boolean
  /** 勘定科目をデフォルト設定にリセット */
  resetAccountsToDefault: () => void
  /** マスタから新規追加された科目を同期（scope='client'のみ有効） */
  syncAccountsFromMaster: () => number

  // ============ 税区分（書き込み） ============
  /** 税区分の表示/非表示をトグル */
  toggleTaxVisibility: (taxCategoryId: string) => void
  /** 税区分のデフォルト表示を上書き（scope='master'のみ有効） */
  setTaxDefaultVisible: (taxCategoryId: string, visible: boolean) => void
  /** 税区分をデフォルト設定にリセット */
  resetTaxToDefault: () => void

  // ============ 保存 ============
  /** 勘定科目の全行データを保存。マスタ: overrides+rowsキーに保存。顧問先: composable.saveAll()に委譲 */
  saveAccounts: (allRows: Account[], subAccounts?: Record<string, string>) => void
  /** 税区分の全行データを保存。マスタ: overrides+rowsキーに保存。顧問先: composable.saveAll()に委譲 */
  saveTaxCategories: (allRows: TaxCategory[]) => void

  // ============ メタ情報 ============
  /** スコープ */
  scope: 'master' | 'client'
  /** 顧問先ID（scope='client'の場合のみ。scope='master'ではnull） */
  clientId: string | null
  /** マスタ定数のIDセット（出自判定用。カスタム追加行の末尾ソートに使用） */
  defaultAccountIds: ComputedRef<Set<string>>
  /** マスタ定数のIDセット（出自判定用。カスタム追加行の末尾ソートに使用） */
  defaultTaxIds: ComputedRef<Set<string>>

  // ============ 内部composable直接参照（overrides操作用。通常は使わない） ============
  /** マスタ勘定科目のoverrides ref（saveAccounts内で自動更新されるが、マスタページの特殊操作用に公開） */
  _accountMasterOverrides: Ref<{ hiddenIds: string[]; customAccounts: Account[] }>
  /** マスタ税区分のoverrides ref */
  _taxMasterOverrides: Ref<{ hiddenIds: string[]; visibilityOverrides: Record<string, boolean>; customTaxCategories?: TaxCategory[] }>
}
