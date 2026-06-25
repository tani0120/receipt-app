/**
 * useAccountCombobox.ts — 科目/税区分/補助科目コンボボックス composable
 *
 * JournalListLevel3Mock.vue から抽出。
 * テンプレートが参照する filterAccountGroups / selectAccountItem / blurAccountEdit 等を提供。
 */

import { computed, ref } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { UiJournal } from '@/types/journal-ui.types'
import { isImportedJournal } from '@/types/journal-list-row'
import { getCategoryLabel } from '@/data/master/account-category-rules'
import {
  MEGA_GROUPS,
  TAX_GROUP_SALES,
  TAX_GROUP_PURCHASE,
  TAX_GROUP_COMMON,
} from '@/constants/journalConstants'
import type { CombinedRow, UndoSnapshot } from '@/composables/useInlineEdit'
import { getAccountGroupDirection } from '@/data/master/account-category-rules'

// ────── 型定義 ──────

/** 補助科目の型定義（MfSubAccountEntry互換） */
export interface SubAccountCandidate {
  mfSubId: string
  name: string
  mfTaxId: string
  searchKey?: string | null
}

/** 科目グループ（optgroupラベル + 科目リスト） */
export interface AccountGroup {
  label: string
  items: { accountId: string; name: string; accountGroup: string; category: string; sortOrder: number; hidden: boolean; defaultTaxCategoryId?: string }[]
}

/** 税区分グループ */
export interface TaxGroup {
  label: string
  items: { taxCategoryId: string; name: string; direction: string }[]
}

export interface UseAccountComboboxOptions {
  editingCell: Ref<{ journalId: string; rowIndex: number; colKey: string } | null>
  editingValue: Ref<string>
  commitCellEdit: () => void
  snapshotJournal: (journalId: string) => UndoSnapshot | null
  pushUndo: (before: UndoSnapshot[], after: UndoSnapshot[]) => void
  updateJournalField: (journalId: string, patch: Record<string, unknown>, options?: { silent?: boolean }) => void
  resolveDefaultTaxForClient: (defaultTaxName: string) => string
  runAccountValidation: (journal: UiJournal) => void
  /** フィルタ済み勘定科目リスト */
  filteredAccounts: ComputedRef<{ accountId: string; name: string; accountGroup: string; category: string; sortOrder: number; hidden: boolean; defaultTaxCategoryId?: string }[]>
  /** 顧問先設定 */
  clientSettings: {
    accounts: { value: { accountId: string; name: string; accountGroup: string; defaultTaxCategoryId?: string }[] }
    visibleTaxCategories: { value: { taxCategoryId: string; name: string; direction: string }[] }
    filteredTaxCategories: (direction: 'sales' | 'purchase' | 'common', taxMode?: 'general' | 'individual' | 'proportional' | 'simplified' | 'exempt') => { taxCategoryId: string; name: string; direction: string }[]
    subAccounts: { value: Record<string, SubAccountCandidate[]> }
  }
  /** 課税方式取得 */
  consumptionTaxMode: ComputedRef<'general' | 'individual' | 'proportional' | 'simplified' | 'exempt' | null | undefined>
}

// ────── composable ──────

export function useAccountCombobox(options: UseAccountComboboxOptions) {
  const {
    editingCell,
    editingValue,
    commitCellEdit,
    snapshotJournal,
    pushUndo,
    updateJournalField,
    resolveDefaultTaxForClient,
    runAccountValidation,
    filteredAccounts,
    clientSettings,
    consumptionTaxMode,
  } = options

  // ────── 科目グルーピング ──────

  /** 仕訳入力用: 勘定科目をカテゴリでグルーピング */
  const accountGroupsForJournal = computed(() => {
    const categoryMap = new Map<string, typeof filteredAccounts.value>()
    for (const acc of filteredAccounts.value) {
      const cat = acc.category
      if (!categoryMap.has(cat)) categoryMap.set(cat, [])
      categoryMap.get(cat)!.push(acc)
    }
    const groups: { label: string; items: typeof filteredAccounts.value }[] = []
    for (const [cat, items] of categoryMap) {
      groups.push({ label: getCategoryLabel(cat), items })
    }
    return groups
  })

  /** 税区分をフィルタ+グルーピング */
  function getTaxGroupsForEntry(row: CombinedRow, colKey: string) {
    const side: 'debit' | 'credit' = colKey.startsWith('debit') ? 'debit' : 'credit'
    const entry = row[side]
    const accountName = entry?.account ?? null

    if (!accountName) {
      const visible = clientSettings.visibleTaxCategories.value
      return [
        { label: TAX_GROUP_SALES, items: visible.filter((tc) => tc.direction === 'sales') },
        { label: TAX_GROUP_PURCHASE, items: visible.filter((tc) => tc.direction === 'purchase') },
        { label: TAX_GROUP_COMMON, items: visible.filter((tc) => tc.direction === 'common') },
      ].filter((g) => g.items.length > 0)
    }

    const allAccounts = clientSettings.accounts.value
    const acc = allAccounts.find((a) => a.accountId === accountName)
    if (!acc) {
      const visible = clientSettings.visibleTaxCategories.value
      return [
        { label: TAX_GROUP_SALES, items: visible.filter((tc) => tc.direction === 'sales') },
        { label: TAX_GROUP_PURCHASE, items: visible.filter((tc) => tc.direction === 'purchase') },
        { label: TAX_GROUP_COMMON, items: visible.filter((tc) => tc.direction === 'common') },
      ].filter((g) => g.items.length > 0)
    }

    const direction = getAccountGroupDirection(acc.accountGroup ?? '')

    const taxMode = consumptionTaxMode.value ?? undefined
    const filtered = clientSettings.filteredTaxCategories(direction, taxMode)
    if (direction === 'sales') {
      return [
        { label: TAX_GROUP_SALES, items: filtered.filter((tc) => tc.direction === 'sales') },
        { label: TAX_GROUP_COMMON, items: filtered.filter((tc) => tc.direction === 'common') },
      ].filter((g) => g.items.length > 0)
    } else if (direction === 'purchase') {
      return [
        { label: TAX_GROUP_PURCHASE, items: filtered.filter((tc) => tc.direction === 'purchase') },
        { label: TAX_GROUP_COMMON, items: filtered.filter((tc) => tc.direction === 'common') },
      ].filter((g) => g.items.length > 0)
    }
    return [{ label: TAX_GROUP_COMMON, items: filtered }].filter((g) => g.items.length > 0)
  }

  // ────── フィルタ関数 ──────

  /** 勘定科目候補をテキストでフィルタ */
  function filterAccountGroups(query: string, _row?: CombinedRow, _colKey?: string) {
    const groups = accountGroupsForJournal.value
    if (!query) return groups
    const q = query.toLowerCase()
    return groups
      .map((g) => ({ ...g, items: g.items.filter((a) => a.name.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0)
  }

  /** 3大グループの展開状態管理 */
  const expandedMegaGroup = ref<string | null>(null)

  /** 3大グループ配下の勘定科目を取得 */
  function getAccountsForMegaGroup(megaLabel: string) {
    const mega = MEGA_GROUPS.find((g) => g.label === megaLabel)
    if (!mega) return []
    return filteredAccounts.value
      .filter((acc) => mega.accountGroups.includes(acc.accountGroup as typeof mega.accountGroups[number]))
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  /** 税区分候補をテキストでフィルタ */
  function filterTaxGroups(row: CombinedRow, colKey: string, query: string) {
    const groups = getTaxGroupsForEntry(row, colKey)
    if (!query) return groups
    const q = query.toLowerCase()
    return groups
      .map((g) => ({ ...g, items: g.items.filter((tc) => tc.name.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0)
  }

  // ────── 選択関数 ──────

  function selectAccountItem(
    journal: UiJournal,
    row: CombinedRow,
    colKey: string,
    accountId: string,
  ): void {
    const beforeSnap = snapshotJournal(journal.journalId)
    const side: 'debit' | 'credit' = colKey.startsWith('debit') ? 'debit' : 'credit'
    const entry = row[side]
    if (!entry) {
      editingCell.value = null
      return
    }

    entry.account = accountId || null

    if (accountId) {
      const allAccounts = clientSettings.accounts.value
      const acc = allAccounts.find((a) => a.accountId === accountId)
      if (acc?.defaultTaxCategoryId) {
        entry.tax_category_id = resolveDefaultTaxForClient(acc.defaultTaxCategoryId)
      }
      if (acc) {
        const sub = clientSettings.subAccounts.value[acc.accountId]
        entry.sub_account = sub?.length === 1 ? sub[0]?.name ?? null : null
      }
    } else {
      entry.sub_account = null
    }

    editingCell.value = null

    runAccountValidation(journal)
    if (!isImportedJournal(journal)) {
      // 科目変更時: AI推定/学習ルールのマークを除去（人間が確認・修正した）
      const updatedLabels = journal.labels.filter((l: string) => l !== 'AI_ESTIMATED')
      const patch: Record<string, unknown> = {
        debit_entries: journal.debit_entries,
        credit_entries: journal.credit_entries,
        labels: updatedLabels,
        determination_method: null,
      }
      journal.labels = updatedLabels as typeof journal.labels
      if ('determination_method' in journal) {
        (journal as unknown as Record<string, unknown>).determination_method = null
      }
      updateJournalField(journal.journalId, patch)
    }
    if (beforeSnap) {
      const afterSnap = snapshotJournal(journal.journalId)
      if (afterSnap) pushUndo([beforeSnap], [afterSnap])
    }
  }

  /** 税区分アイテム選択 */
  function selectTaxItem(_journal: UiJournal, taxId: string): void {
    editingValue.value = taxId
    commitCellEdit()
  }

  // ────── blur関数 ──────

  /** 勘定科目blur */
  function blurAccountEdit(journal: UiJournal, row: CombinedRow, colKey: string): void {
    if (!editingCell.value) return
    const val = editingValue.value
    const matched = filteredAccounts.value.find((a) => a.accountId === val || a.name === val)
    if (matched) {
      selectAccountItem(journal, row, colKey, matched.accountId)
      return
    }
    editingCell.value = null
  }

  /** 税区分blur */
  function blurTaxEdit(_journal: UiJournal): void {
    if (!editingCell.value) return
    const val = editingValue.value
    const matched = clientSettings.visibleTaxCategories.value.find(
      (tc) => tc.taxCategoryId === val || tc.name === val,
    )
    if (matched) {
      editingValue.value = matched.taxCategoryId
      commitCellEdit()
      return
    }
    editingCell.value = null
  }

  // ────── 補助科目 ──────

  /** 補助科目候補を取得 */
  function getSubAccountCandidates(row: CombinedRow, colKey: string): SubAccountCandidate[] {
    const side = colKey.startsWith('debit') ? 'debit' : 'credit'
    const entry = row[side]
    if (!entry?.account) return []
    const subs = clientSettings.subAccounts.value[entry.account]
    if (Array.isArray(subs)) return subs
    return []
  }

  /** 補助科目候補をテキストフィルタ */
  function filterSubAccountCandidates(
    row: CombinedRow,
    colKey: string,
    query: string,
  ): SubAccountCandidate[] {
    const all = getSubAccountCandidates(row, colKey)
    if (!query) return all
    const q = query.toLowerCase()
    return all.filter(
      (sa) =>
        sa.name.toLowerCase().includes(q) ||
        (sa.searchKey && sa.searchKey.toLowerCase().includes(q)),
    )
  }

  /** 補助科目選択 */
  function selectSubAccountItem(_journal: UiJournal, name: string): void {
    editingValue.value = name
    commitCellEdit()
  }

  /** 補助科目blur */
  function blurSubAccountEdit(): void {
    if (!editingCell.value) return
    commitCellEdit()
  }

  return {
    // 科目グルーピング
    accountGroupsForJournal,
    getTaxGroupsForEntry,
    // フィルタ
    filterAccountGroups,
    expandedMegaGroup,
    getAccountsForMegaGroup,
    filterTaxGroups,
    // 選択
    selectAccountItem,
    selectTaxItem,
    // blur
    blurAccountEdit,
    blurTaxEdit,
    // 補助科目
    getSubAccountCandidates,
    filterSubAccountCandidates,
    selectSubAccountItem,
    blurSubAccountEdit,
  }
}
