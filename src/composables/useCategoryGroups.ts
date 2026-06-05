/**
 * useCategoryGroups.ts — カテゴリグループ構築composable（DRY）
 *
 * MFカテゴリをaccountGroupでグループ化し、日本語ラベル付きの
 * セレクトボックス用データを生成する。
 *
 * 参照元:
 *   - views/master/MockMasterAccountsPage.vue
 *   - views/client/MockClientAccountsPage.vue
 */

import { computed, type Ref } from 'vue'
import type { Account } from '@/types/shared-account'
import { MF_CATEGORY_LABELS } from '@/data/master/account-category-rules'

/** カテゴリグループの選択肢 */
export interface CategoryGroupItem {
  value: string   // MFカテゴリ名（英語）
  label: string   // 日本語ラベル
}

/** カテゴリグループ */
export interface CategoryGroup {
  label: string
  items: CategoryGroupItem[]
}

/**
 * MFカテゴリをaccountGroupでグループ化してセレクトボックス用データを返す
 *
 * @param accountRows - 科目一覧（reactive/ref）
 * @returns カテゴリグループのcomputed
 */
export function useCategoryGroups(accountRows: Account[] | Ref<Account[]>) {
  const categoryGroups = computed<CategoryGroup[]>(() => {
    const rows = 'value' in accountRows ? accountRows.value : accountRows
    const groups: CategoryGroup[] = [
      { label: 'PL収益', items: [] },
      { label: 'PL費用', items: [] },
      { label: 'BS資産', items: [] },
      { label: 'BS負債', items: [] },
      { label: 'BS純資産', items: [] },
    ]
    const groupMap: Record<string, number> = {
      PL_REVENUE: 0, PL_EXPENSE: 1, BS_ASSET: 2, BS_LIABILITY: 3, BS_EQUITY: 4,
    }
    for (const [mfCat, jpLabel] of Object.entries(MF_CATEGORY_LABELS)) {
      const acct = rows.find(a => a.category === mfCat)
      const ag = acct?.accountGroup ?? ''
      const idx = groupMap[ag]
      if (idx !== undefined) {
        if (!groups[idx]!.items.some(i => i.value === mfCat)) {
          groups[idx]!.items.push({ value: mfCat, label: jpLabel })
        }
      }
    }
    return groups.filter(g => g.items.length > 0)
  })

  return { categoryGroups }
}
