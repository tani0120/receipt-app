# useAccountSettings 統一composable 詳細設計書

> 作成日: 2026-03-15
> 目的: 各ページが`TAX_CATEGORY_MASTER`/`ACCOUNT_MASTER`をimportせず、composable経由でデータ取得を一元化する
> 前提: 00_モック実装時のルール.md §15「localStorage保存ルール」に準拠

---

## 1. 現状の問題（なぜ必要か）

### 1.1 ハードコード参照の構造的欠陥

```
現状: 各ページが個別にimportして自前フィルタ

MockMasterAccountsPage ──── import ACCOUNT_MASTER ──── ハードコード定数
MockMasterTaxCategoriesPage ── import TAX_CATEGORY_MASTER ── ハードコード定数
MockClientAccountsPage ──── import ACCOUNT_MASTER ──── ハードコード定数
MockClientTaxPage ──────── import TAX_CATEGORY_MASTER ── ハードコード定数
JournalListLevel3Mock ──── import ACCOUNT_MASTER ──── ハードコード定数

問題:
- カスタム行が含まれない → 「COMMON_UNKNOWN_COPY_3_COPY」のようなID表示
- 修正するたびに「他にハードコードが残ってないか」全件チェックが必要
- composableを経由しないlocalStorage直書きが発生しやすい
```

### 1.2 目指す姿

```
目標: 全ページがuseAccountSettingsのみを通じてデータ取得

MockMasterAccountsPage ─┐
MockMasterTaxCategoriesPage ─┤
MockClientAccountsPage ─┤─── useAccountSettings(scope, clientId?)
MockClientTaxPage ──────┤
JournalListLevel3Mock ──┘
                              │
                    ┌─────────┴──────────┐
                    │  useAccountMaster   │  ← 内部依存（外部import不要）
                    │  useTaxMaster       │
                    │  useClientAccounts  │
                    │  useClientTaxCategories │
                    └────────────────────┘
```

**効果: ページが`TAX_CATEGORY_MASTER`や`ACCOUNT_MASTER`を直接importすることが不可能になる**

---

## 2. useAccountSettings API設計

### 2.1 呼び出しパターン

```typescript
// マスタページ
const settings = useAccountSettings('master')

// 顧問先ページ
const settings = useAccountSettings('client', clientId)

// 仕訳リスト（顧問先コンテキスト）
const settings = useAccountSettings('client', clientId)
```

### 2.2 戻り値の型

```typescript
interface AccountSettingsReturn {
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

  // ============ 内部composable直接参照（overrides操作用。通常は使わない） ============
  /** マスタ勘定科目のoverrides ref（saveAccounts内で自動更新されるが、マスタページの特殊操作用に公開） */
  _accountMasterOverrides: Ref<{ hiddenIds: string[]; customAccounts: Account[] }>
  /** マスタ税区分のoverrides ref */
  _taxMasterOverrides: Ref<{ hiddenIds: string[]; visibilityOverrides: Record<string, boolean>; customTaxCategories?: TaxCategory[] }>
}
```

### 2.3 統一型

```typescript
/** 統一科目型（マスタ/顧問先の区別なく使える） */
interface UnifiedAccount extends Account {
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
interface UnifiedTaxCategory extends TaxCategory {
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
```

---

## 3. 内部実装の詳細

### 3.1 ファイル構成

```
src/features/account-settings/
  composables/
    useAccountSettings.ts     ← [NEW] 統一composable
  types/
    account-settings.types.ts ← [NEW] UnifiedAccount, UnifiedTaxCategory, AccountSettingsReturn
```

### 3.2 useAccountSettings内部ロジック

```typescript
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { useAccountMaster } from '@/features/account-management/composables/useAccountMaster'
import { useTaxMaster } from '@/features/tax-management/composables/useTaxMaster'
import { useClientAccounts } from '@/features/account-management/composables/useClientAccounts'
import { useClientTaxCategories } from '@/features/tax-management/composables/useClientTaxCategories'
import { ACCOUNT_MASTER } from '@/shared/data/account-master'
import { TAX_CATEGORY_MASTER } from '@/shared/data/tax-category-master'
import type { Account } from '@/shared/types/account'
import type { TaxCategory } from '@/shared/types/tax-category'
import type { UnifiedAccount, UnifiedTaxCategory, AccountSettingsReturn } from '../types/account-settings.types'

// localStorageキー（マスタページのrowsスナップショット用）
const ACCOUNT_ROWS_KEY = 'sugu-suru:account-master:rows'
const TAX_ROWS_KEY = 'sugu-suru:tax-categories:rows'

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
      return accountMaster.masterAccounts.value.map(a => ({
        ...a,
        hidden: a.hiddenInMaster,
        hiddenInMaster: false,
        isMasterCustom: a.isCustom,
        isClientCustom: false,
        source: (a.isCustom ? 'master-custom' : 'default') as const,
      }))
    }
    // scope === 'client'
    if (!clientAccountsComposable) return []
    return clientAccountsComposable.clientAccounts.value.map(a => ({
      ...a,
      hidden: a.hiddenInClient,
      isMasterCustom: a.isMasterCustom,
      isClientCustom: a.isCustom && !a.isMasterCustom,
      source: (a.isMasterCustom ? 'master-custom' : a.isCustom ? 'client-custom' : 'default') as const,
    }))
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
      return taxMaster.masterTaxCategories.value.map(tc => ({
        ...tc,
        hidden: tc.hiddenInMaster,
        hiddenInMaster: false,
        defaultVisible: tc.defaultVisible,
        visibilityOverride: taxMaster.overrides.value.visibilityOverrides[tc.id] ?? null,
        source: (tc.isCustom ? 'master-custom' : 'default') as const,
      }))
    }
    if (!clientTaxComposable) return []
    return clientTaxComposable.clientTaxCategories.value.map(tc => {
      // マスタカスタムか顧問先カスタムかの判定
      const isMasterCustom = tc.isCustom && !tc.hiddenInMaster // マスタにある=マスタカスタム
      const isClientCustom = tc.isCustom && !isMasterCustom
      return {
        ...tc,
        hidden: tc.hiddenInClient,
        defaultVisible: tc.defaultVisible,
        visibilityOverride: null, // 顧問先レベルではvisibilityOverrideなし
        source: (isMasterCustom ? 'master-custom' : isClientCustom ? 'client-custom' : 'default') as const,
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
  function filteredTaxCategories(direction: 'sales' | 'purchase' | 'common'): UnifiedTaxCategory[] {
    return taxCategories.value.filter(tc => {
      if (tc.hidden || tc.hiddenInMaster) return false
      if (direction === 'sales') return tc.direction === 'sales' || tc.direction === 'common'
      if (direction === 'purchase') return tc.direction === 'purchase' || tc.direction === 'common'
      return tc.direction === 'common'
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
      // マスタスコープ: rowsスナップショット + overrides同期
      localStorage.setItem(ACCOUNT_ROWS_KEY, JSON.stringify(allRows))
      const hiddenIds = allRows
        .filter(r => r.deprecated || r.effectiveTo)
        .map(r => r.id)
      const customAccounts = allRows.filter(r => r.isCustom)
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
      // マスタスコープ: rowsスナップショット + overrides同期
      localStorage.setItem(TAX_ROWS_KEY, JSON.stringify(allRows))
      const hiddenIds = allRows.filter(r => r.deprecated).map(r => r.id)
      const customTaxCategories = allRows.filter(r => r.isCustom)
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
    // 内部composable直接参照（特殊操作用）
    _accountMasterOverrides: accountMaster.overrides,
    _taxMasterOverrides: taxMaster.overrides,
  }
}
```

---

## 4. 各ページの修正内容（詳細）

### 4.1 共通ルール

| ルール | 内容 |
|--------|------|
| **import禁止** | ページファイルで`TAX_CATEGORY_MASTER`/`ACCOUNT_MASTER`を**import禁止** |
| **composable一本化** | 全データ取得は`useAccountSettings`経由 |
| **localStorage直書き禁止** | `saveAccounts()`/`saveTaxCategories()`経由のみ |
| **source分岐** | 「マスタ」「マスタ（カスタム）」「顧問先独自」の判定は`row.source`プロパティで |

---

### 4.2 MockMasterAccountsPage.vue

#### 現在のimport（削除対象）
```typescript
// 削除
import { ACCOUNT_MASTER } from '@/shared/data/account-master';
import { useAccountMaster } from '@/features/account-management/composables/useAccountMaster';
import { useTaxMaster } from '@/features/tax-management/composables/useTaxMaster';
```

#### 新しいimport
```typescript
import { useAccountSettings } from '@/features/account-settings/composables/useAccountSettings';
```

#### 変更箇所一覧

| 行範囲 | 現在のコード | 新しいコード |
|--------|------------|------------|
| L189 | `import { useTaxMaster }` | 削除（useAccountSettings経由） |
| L190 | `import { ACCOUNT_MASTER }` | 削除 |
| L191 | `import { useAccountMaster }` | `import { useAccountSettings }` |
| L198 | `const { masterAccounts, overrides, ... } = useAccountMaster()` | `const settings = useAccountSettings('master')` |
| L199 | `const { masterTaxCategories } = useTaxMaster()` | 削除（settings.taxCategories経由） |
| L437 | `masterTaxCategories.value.filter(tc => { ... })` | `settings.filteredTaxCategories(dir)` |
| L478 | `masterTaxCategories.value.find(tc => tc.id === id)` | `settings.resolveTaxCategoryShortName(id)` |
| L511 | `ACCOUNT_MASTER.map((a, i) => [a.id, i])` | 据え置き（デフォルト順ソート基準は定数が正当） ※後述 |

#### デフォルト順ソートの扱い

`ACCOUNT_MASTER`のデフォルト順ソートは「元の並び順を参照する」ため、**定数参照が正当**。ただし`useAccountSettings`経由で提供する方が一貫性がある。

**方針**: `settings.defaultAccountOrder`を追加し、composable内部で`ACCOUNT_MASTER.map((a, i) => [a.id, i])`のMapを作成して返す。ページは定数を直接参照しない。

---

### 4.3 MockMasterTaxCategoriesPage.vue

| 行範囲 | 現在のコード | 新しいコード |
|--------|------------|------------|
| L177 | `import { TAX_CATEGORY_MASTER }` | `import { useAccountSettings }` |
| composable接続 | `useTaxMaster()` | `useAccountSettings('master')` |
| L470 | `TAX_CATEGORY_MASTER.map((t, i) => [t.id, i])` | `settings.defaultTaxOrder` |

---

### 4.4 MockClientAccountsPage.vue

| 行範囲 | 現在のコード | 新しいコード |
|--------|------------|------------|
| L208 | `import { useTaxMaster }` | 削除 |
| L209 | `import { ACCOUNT_MASTER }` | 削除 |
| L211 | `import { useClientAccounts }` | `import { useAccountSettings }` |
| L212 | `import { useClientTaxCategories }` | 削除 |
| L230-235 | `clientTaxComposable` + `clientTaxCategories` computed | `settings.visibleTaxCategories` |
| L241 | `useClientAccounts(clientId.value)` | `useAccountSettings('client', clientId.value)` |
| L133 | `isMasterCustomAccount(row.id)` | `row.source === 'master-custom'` |
| L293-300 | `isMasterCustomAccount()` 関数 | 削除（sourceプロパティで判定） |
| L615 | `ACCOUNT_MASTER.map(...)` | `settings.defaultAccountOrder` |

---

### 4.5 MockClientTaxPage.vue

| 行範囲 | 現在のコード | 新しいコード |
|--------|------------|------------|
| L189 | `import { TAX_CATEGORY_MASTER }` | 削除 |
| composable接続 | `useClientTaxCategories(clientId.value)` | `useAccountSettings('client', clientId.value)` |
| L228 | `[...TAX_CATEGORY_MASTER]` | `settings.taxCategories.value`から取得 |
| L243 | `[...TAX_CATEGORY_MASTER]` | `settings.taxCategories.value` |
| L516 | `TAX_CATEGORY_MASTER.map(...)` | `settings.defaultTaxOrder` |

---

### 4.6 JournalListLevel3Mock.vue

| 行範囲 | 現在のコード | 新しいコード |
|--------|------------|------------|
| L967 | `import { ACCOUNT_MASTER }` | 削除 |
| L968-999 | `useClients` + `useClientAccounts` + `useTaxMaster` | `useAccountSettings('client', clientId)` |
| L1010 | `ACCOUNT_MASTER` フォールバック | `settings.visibleAccounts.value` |
| L1059 | `ACCOUNT_MASTER` フォールバック | `settings.accounts.value` |
| L1118 | `ACCOUNT_MASTER` フォールバック | `settings.accounts.value` |
| L1121 | `masterTaxCategories.value.find(...)` | `settings.resolveTaxCategoryName(id)` |
| L1158 | `ACCOUNT_MASTER` フォールバック | `settings.accounts.value` |
| L2491 | `masterTaxCategories.value.find(...)` | `settings.resolveTaxCategoryName(id)` |

---

## 5. localStorage キーの変更

**変更なし。** useAccountSettingsは内部composableに委譲するため、localStorageキーはそのまま。

| キー | composable | 変更 |
|------|-----------|:----:|
| `sugu-suru:account-master:overrides` | useAccountMaster | なし |
| `sugu-suru:account-master:rows` | MockMasterAccountsPage | なし |
| `sugu-suru:tax-master:overrides` | useTaxMaster | なし |
| `sugu-suru:tax-categories:rows` | MockMasterTaxCategoriesPage | なし |
| `sugu-suru:client-accounts:{clientId}` | useClientAccounts | なし |
| `sugu-suru:client-tax:{clientId}` | useClientTaxCategories | なし |

---

## 6. 既存composableの変更

**既存composableは一切変更しない。** useAccountSettingsはラッパーとして上に被さるだけ。

| composable | 変更 | 理由 |
|-----------|:----:|------|
| useAccountMaster | なし | 内部でそのまま使用 |
| useTaxMaster | なし | 内部でそのまま使用 |
| useClientAccounts | なし | 内部でそのまま使用 |
| useClientTaxCategories | なし | 内部でそのまま使用 |

---

## 7. 失敗防止チェックリスト

### 7.1 実装時のチェック

- [ ] ページファイルに`TAX_CATEGORY_MASTER`の直接importが**0件**であること
- [ ] ページファイルに`ACCOUNT_MASTER`の直接importが**0件**であること（ソート用の`defaultAccountOrder`は除く）
- [ ] ページファイルに`useAccountMaster`/`useTaxMaster`/`useClientAccounts`/`useClientTaxCategories`の直接importが**0件**であること
- [ ] 全ページが`useAccountSettings`の**1つのimport**だけでデータ取得していること
- [ ] `source`プロパティで「マスタ」「マスタ（カスタム）」「顧問先独自」を判定していること
- [ ] `filteredTaxCategories()`がカスタム税区分も含めて返していること
- [ ] `resolveTaxCategoryName()`がカスタム税区分も名前解決できること

### 7.2 検証コマンド

```powershell
# 1. 型チェック
npx vue-tsc --noEmit

# 2. TAX_CATEGORY_MASTER のページ直接参照が0件であること
# （composable内と定義ファイルは除外）
rg "TAX_CATEGORY_MASTER" src/mocks/ src/views/ --include="*.vue"

# 3. ACCOUNT_MASTER のページ直接参照が0件であること
rg "ACCOUNT_MASTER" src/mocks/ src/views/ --include="*.vue"

# 4. 旧composable直接importが0件であること
rg "useAccountMaster|useTaxMaster|useClientAccounts|useClientTaxCategories" src/mocks/ --include="*.vue"
```

### 7.3 ブラウザ検証（ユーザー実施）

| # | 操作 | 期待結果 |
|---|------|---------|
| 1 | マスタ税区分でカスタム税区分追加→保存 | 保存成功 |
| 2 | マスタ勘定科目タブでF5→カスタム科目の税区分ドロップダウン | カスタム税区分が表示される |
| 3 | 顧問先勘定科目タブでF5 | マスタ由来が「マスタ（カスタム）」と表示 |
| 4 | 仕訳リストで新規勘定科目を選択 | 税区分名（IDではない）と補助科目が自動セット |
| 5 | 全ページで保存→F5 | データが正しく保持される |

---

## 8. 実施順序

| ステップ | 内容 | 影響範囲 |
|---------|------|---------|
| 1 | `account-settings.types.ts` 作成 | 新規ファイル |
| 2 | `useAccountSettings.ts` 作成 | 新規ファイル |
| 3 | `MockMasterAccountsPage.vue` リファクタリング | 既存ファイル |
| 4 | `vue-tsc` 確認 | — |
| 5 | `MockMasterTaxCategoriesPage.vue` リファクタリング | 既存ファイル |
| 6 | `vue-tsc` 確認 | — |
| 7 | `MockClientAccountsPage.vue` リファクタリング | 既存ファイル |
| 8 | `vue-tsc` 確認 | — |
| 9 | `MockClientTaxPage.vue` リファクタリング | 既存ファイル |
| 10 | `vue-tsc` 確認 | — |
| 11 | `JournalListLevel3Mock.vue` リファクタリング | 既存ファイル |
| 12 | `vue-tsc` 確認 | — |
| 13 | 全4検証コマンド実行 | — |
| 14 | ユーザーにブラウザ検証依頼 | — |

**各ステップで`vue-tsc`を挟む理由**: 1ファイルずつ確認することで、エラーの原因を特定しやすくする。複数ファイルを一気に変更するとエラーの切り分けが困難になる。

---

## 9. 省略・不完全箇所の補足（正直申告）

> **注意**: 以下は§1-8で省略・曖昧に記載した箇所の正直な補足。
> 実装時にこれらを見落とすと**同じ失敗を繰り返す。**

### 9.1 マスタページの`rows`キー保存

**省略していた事実**: マスタ勘定科目/税区分ページは`overrides`キーだけでなく`rows`キー（全行のスナップショット）もlocalStorageに保存している。

| キー | 保存元 | 内容 |
|------|-------|------|
| `sugu-suru:account-master:rows` | MockMasterAccountsPage.saveChanges() | 全行データ（並び順含む） |
| `sugu-suru:tax-categories:rows` | MockMasterTaxCategoriesPage.saveChanges() | 全行データ（並び順含む） |
| `sugu-suru:account-master:overrides` | useAccountMaster | hiddenIds + customAccounts |
| `sugu-suru:tax-master:overrides` | useTaxMaster | hiddenIds + customTaxCategories + visibilityOverrides |

**決定が必要**: `rows`キーの保存をuseAccountSettingsに移すか、ページに残すか。

**推奨**: `rows`キーはページのUI状態（並び順のスナップショット）であるため、**ページに残す**。ただし`saveAccounts()`実行時に`rows`も一緒に保存する`saveAccountRows(allRows)`をuseAccountSettingsに追加し、ページ側での直接localStorage操作を排除する。

---

### 9.2 マスタページの`overrides` ref直接操作

**省略していた事実**: MockMasterAccountsPage.vue L346-349で、composableの`overrides` refを直接操作してカスタム行を同期している。

```typescript
// 現在のコード（L346-349）
overrides.value = {
  hiddenIds: accountRows.filter(r => !r.isCustom && (r.deprecated || r.effectiveTo)).map(r => r.id),
  customAccounts: accountRows.filter(r => r.isCustom),
};
```

**問題**: useAccountSettingsでoverridesを隠蔽すると、この操作ができなくなる。

**対策**: `saveAccounts(allRows)`内でhiddenIdsとcustomAccountsの分解を行い、内部composableのoverridesを更新する。ページはoverridesに触らない。

```typescript
// useAccountSettings内のsaveAccounts
function saveAccounts(allRows: Account[], subAccounts?: Record<string, string>): void {
  if (scope === 'master') {
    // マスタスコープ: useAccountMasterのoverridesを更新
    const hiddenIds = allRows.filter(r => !r.isCustom && (r.deprecated || r.effectiveTo)).map(r => r.id)
    const customAccounts = allRows.filter(r => r.isCustom)
    accountMaster.overrides.value = { hiddenIds, customAccounts }
    // rowsキーも保存
    localStorage.setItem('sugu-suru:account-master:rows', JSON.stringify(allRows))
    localStorage.setItem('sugu-suru:account-master:overrides', JSON.stringify(accountMaster.overrides.value))
  } else {
    // 顧問先スコープ: useClientAccountsのsaveAll()に委譲
    clientAccountsComposable?.saveAll(allRows, subAccounts)
  }
}
```

---

### 9.3 税区分の`visibilityOverrides`と`defaultVisible`

**省略していた事実**: useTaxMasterには`setDefaultVisible()`と`visibilityOverrides`マップがあり、§2.3のUnifiedTaxCategory型にこの概念が反映されていない。

**影響**: マスタ税区分ページの「デフォルトで表示」チェックボックスに影響する。

**対策**: UnifiedTaxCategoryに以下を追加。

```typescript
interface UnifiedTaxCategory extends TaxCategory {
  // ... 既存フィールド
  /** デフォルト表示設定（マスタで上書き可能） */
  defaultVisible: boolean
  /** マスタでの表示設定の上書き値（null=デフォルトを使用） */
  visibilityOverride: boolean | null
}
```

useAccountSettingsの公開APIに追加:
```typescript
/** 税区分のデフォルト表示を上書き（scope='master'のみ） */
setTaxDefaultVisible: (taxCategoryId: string, visible: boolean) => void
```

---

### 9.4 仕訳リストのbusinessType/hasRentalIncomeフィルタ

**省略していた事実**: 仕訳リスト（JournalListLevel3Mock）のfilteredAccountsは、顧問先のtypeとhasRentalIncomeで科目をフィルタしている（L1002-1023）。設計書の`visibleAccounts`にはこのフィルタが含まれていない。

```typescript
// 現在のJournalListLevel3Mock L1002-1023
const filteredAccounts = computed(() => {
  const client = activeClientFull.value;
  const clientType = client?.type ?? 'corp';
  const hasRental = client?.hasRentalIncome ?? false;
  const source = clientAccountsComposable.value
    ? clientAccountsComposable.value.visibleClientAccounts.value
    : ACCOUNT_MASTER;
  return source
    .filter(acc => {
      if (acc.deprecated) return false;
      if (acc.target === 'both') return true;
      if (acc.target === clientType) {
        if (clientType === 'individual' && !hasRental && acc.category.includes('不動産')) return false;
        return true;
      }
      return false;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
});
```

**決定が必要**: このフィルタをuseAccountSettingsに含めるか。

**推奨**: 含めない。このフィルタはページ固有（仕訳リスト用）であり、マスタ/顧問先設定ページでは不要。`visibleAccounts`はhidden系フラグのフィルタのみ行い、businessType/hasRentalIncomeフィルタはページ側で追加適用する。

```typescript
// 仕訳リストでの使い方
const settings = useAccountSettings('client', clientId)
const filteredAccounts = computed(() => {
  return settings.visibleAccounts.value.filter(acc => {
    if (acc.deprecated) return false
    if (acc.target === 'both') return true
    if (acc.target === clientType.value) { ... }
    return false
  })
})
```

---

### 9.5 `addCustomAccount`/`removeCustomAccount`の公開

**省略していた事実**: useAccountMasterには`addCustomAccount()`と`removeCustomAccount()`がある。§2.2のAccountSettingsReturnにこれらが含まれていない。

**影響**: マスタ勘定科目ページの「追加」ボタンと「削除」ボタンが動作しなくなる。

**対策**: AccountSettingsReturnに追加。

```typescript
interface AccountSettingsReturn {
  // ... 既存フィールド

  // ============ カスタム科目操作（scope='master'のみ） ============
  /** カスタム科目を追加 */
  addCustomAccount: (account: Account) => void
  /** カスタム科目を削除 */
  removeCustomAccount: (accountId: string) => boolean
  /** カスタム税区分を追加（暗黙的にsaveTaxCategories内で処理） */
  // ← 税区分のカスタム追加はsaveTaxCategories()経由で行う
}
```

---

### 9.6 旧キーマイグレーション

**省略していた事実**: MockClientTaxPage.vue L220-238に旧キー（`sugu-suru:client-tax-page:`）から新キー（`sugu-suru:client-tax:`）への移行処理がある。

```typescript
// 現在のMockClientTaxPage L220-238
if (clientId.value) {
  const oldKey = 'sugu-suru:client-tax-page:' + clientId.value;
  const oldData = localStorage.getItem(oldKey);
  if (oldData && clientTaxComposable) {
    // 旧キー→新キーへ移行
    ...
    localStorage.removeItem(oldKey);
  }
}
```

**対策**: この処理はuseAccountSettingsに移動する。`scope='client'`初期化時に旧キーを検出し、新キーへ移行する。

```typescript
// useAccountSettings内の初期化
if (scope === 'client' && clientId) {
  migrateOldTaxKey(clientId)
}
```

---

### 9.7 旧画面（ScreenS_AccountSettings.vue）

**省略していた事実**: `src/views/ScreenS_AccountSettings.vue`に`TAX_CATEGORY_MASTER`の直接参照が4箇所残っている（L198, L266, L303, L363）。

**明示的な決定**: この画面は`/old/`ルート配下の旧UIであり、以下の理由でスコープ外とする。

| 理由 | 詳細 |
|------|------|
| 廃止予定 | 新しいMockMasterAccountsPage/MockClientAccountsPageに置き換え済み |
| ルーティング | `/old/settings/:clientId`でのみアクセス可能 |
| 影響範囲 | ユーザーが意図的に旧URLにアクセスしない限り使われない |
| リスク | 旧画面を修正すると予期しない副作用が発生する可能性 |

**推奨**: Phase B/Cでの旧画面削除時にまとめて対処。今回は触らない。

---

### 9.8 マスタ税区分ページの`overrides`同期

**省略していた事実**: MockMasterTaxCategoriesPage.vueのsaveChanges()でも、マスタ勘定科目と同様にcomposableの`overrides` refを直接操作してカスタム行とhiddenIdsを同期している。

**対策**: §9.2と同じパターン。`saveTaxCategories(allRows)`内でhiddenIds/customTaxCategories/visibilityOverridesの分解を行い、内部composableのoverridesを更新する。

```typescript
function saveTaxCategories(allRows: TaxCategory[]): void {
  if (scope === 'master') {
    const hiddenIds = allRows.filter(r => r.deprecated).map(r => r.id)
    const customTaxCategories = allRows.filter(r => r.isCustom)
    taxMaster.overrides.value = {
      ...taxMaster.overrides.value,
      hiddenIds,
      customTaxCategories,
    }
    localStorage.setItem('sugu-suru:tax-categories:rows', JSON.stringify(allRows))
    localStorage.setItem('sugu-suru:tax-master:overrides', JSON.stringify(taxMaster.overrides.value))
  } else {
    clientTaxComposable?.saveAll(allRows)
  }
}
```
