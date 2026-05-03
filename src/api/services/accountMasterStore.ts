/**
 * accountMasterStore.ts — 科目・税区分マスタストア（サーバー側）
 *
 * Phase 2（2026-05-03）
 *
 * shared/data/ の ACCOUNT_MASTER / TAX_CATEGORY_MASTER を
 * サーバー側から直接参照し、API各サービスに提供する。
 *
 * 将来のSupabase移行時はDB読み込みに差し替える。
 * 現時点では顧問先カスタム科目は未対応（マスタのみ）。
 *
 * 準拠: DL-042
 */

import { ACCOUNT_MASTER } from '../../shared/data/account-master'
import { TAX_CATEGORY_MASTER } from '../../shared/data/tax-category-master'
import type { Account } from '../../shared/types/account'
import type { TaxCategory } from '../../shared/types/tax-category'

// ────────────────────────────────────────────
// 科目マスタ
// ────────────────────────────────────────────

/** 全科目を取得 */
export function getAllAccounts(): readonly Account[] {
  return ACCOUNT_MASTER
}

/** 科目IDで1件取得 */
export function getAccountById(id: string): Account | undefined {
  return ACCOUNT_MASTER.find(a => a.id === id)
}

/** バリデーション/ヒント用の最小形式で全科目を返す */
export function getAccountsForValidation(): {
  id: string
  name: string
  sub?: string | null
  accountGroup?: string | null
  category?: string | null
  taxDetermination?: string | null
  defaultTaxCategoryId?: string | null
}[] {
  return ACCOUNT_MASTER.map(a => ({
    id: a.id,
    name: a.name,
    sub: null, // マスタには補助科目なし（顧問先カスタムはPhase 3以降）
    accountGroup: a.accountGroup ?? null,
    category: a.category ?? null,
    taxDetermination: a.taxDetermination ?? null,
    defaultTaxCategoryId: a.defaultTaxCategoryId ?? null,
  }))
}

/** 科目名マップ（ID→名前）を返す */
export function getAccountNameMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const a of ACCOUNT_MASTER) {
    map[a.id] = a.name
  }
  return map
}

// ────────────────────────────────────────────
// 税区分マスタ
// ────────────────────────────────────────────

/** 全税区分を取得 */
export function getAllTaxCategories(): readonly TaxCategory[] {
  return TAX_CATEGORY_MASTER
}

/** 税区分IDで1件取得 */
export function getTaxCategoryById(id: string): TaxCategory | undefined {
  return TAX_CATEGORY_MASTER.find(t => t.id === id)
}

/** バリデーション/ヒント用の最小形式で全税区分を返す */
export function getTaxCategoriesForValidation(): {
  id: string
  name: string
  shortName?: string | null
  direction?: string | null
}[] {
  return TAX_CATEGORY_MASTER.map(t => ({
    id: t.id,
    name: t.name,
    shortName: t.shortName ?? null,
    direction: t.direction ?? null,
  }))
}

/** 税区分名マップ（ID→名前）を返す */
export function getTaxCategoryNameMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const t of TAX_CATEGORY_MASTER) {
    map[t.id] = t.name
  }
  return map
}

console.log(`[accountMasterStore] 科目${ACCOUNT_MASTER.length}件 / 税区分${TAX_CATEGORY_MASTER.length}件をロード`)
