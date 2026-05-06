/**
 * 勘定科目分類ルール（科目カテゴリ → グループ・税区分方向・導出） *
 * 概要:
 *   - mocks/views/MockMasterAccountsPage.vue L530-602
 *   - mocks/views/MockClientAccountsPage.vue L610-682
 *   - api/services/accountMasterStore.tsの内部参照用 *
 * 注意: JournalListLevel3Mock.vue L2636 にあったSALES_CATEGORIES / PURCHASE_CATEGORIES は
 *   本ファイルに統合済み。旧定義は '特別利益', '特別損失', '繰入額等' が欠落していた（バグ）。
 */
import type { AccountGroup, TaxDetermination } from '@/types/shared-account'

// ========================================
// カテゴリ定数（科目分類の中分類）// ========================================
// readonly string[] で定義: immutableを保証しつつ .includes(string) が型エラーにならない。// as const は不使用: リテラル型ユニオンを活用する箇所がないため不要。
/** PL収益系カテゴリ */
export const SALES_CATEGORIES: readonly string[] = ['売上', '不動産収入', '営業外収益', '特別利益']

/** PL費用系カテゴリ */
export const PURCHASE_CATEGORIES: readonly string[] = [
  '経費', '売上原価', '販管費', '不動産経費', '営業外費用', '繰入額等', '特別損失',
]

/** BS資産カテゴリ */
export const BS_ASSET_CATEGORIES: readonly string[] = [
  '現金及び預金', '売上債権', '有価証券', 'その他流動資産', '有形固定資産',
  '無形固定資産', '投資その他', '棚卸資産', '繰延資産',
]

/** BS負債カテゴリ */
export const BS_LIABILITY_CATEGORIES: readonly string[] = ['仕入債務', 'その他流動負債', '固定負債']

/** BS純資産カテゴリ */
export const BS_EQUITY_CATEGORIES: readonly string[] = ['純資産', '事業主貸', '事業主借', '資本の部', '諸口']

/** PLその他カテゴリ */
export const OTHER_PL_CATEGORIES: readonly string[] = ['繰戻額等']

/** BS資産のうちauto_purchaseを許可する中分類（資産取得＝課税仕入）*/
export const BS_ASSET_PURCHASE_CATEGORIES: readonly string[] = ['有形固定資産', '無形固定資産']

/**
 * カテゴリグループ定義（UIのセレクトボックス用optgroup） */
export const CATEGORY_GROUPS: readonly { label: string; items: readonly string[] }[] = [
  { label: 'PL収益', items: SALES_CATEGORIES },
  { label: 'PL費用', items: PURCHASE_CATEGORIES },
  { label: 'BS資産', items: BS_ASSET_CATEGORIES },
  { label: 'BS負債', items: BS_LIABILITY_CATEGORIES },
  { label: 'BS純資産', items: BS_EQUITY_CATEGORIES },
  { label: 'PLその他', items: OTHER_PL_CATEGORIES },
]

// ========================================
// ユーティリティ関数
// ========================================

/**
 * 科目分類（category）から勘定科目グループ（AccountGroup）を導出
 *
 * @param category - 科目分類の中分類（例: '経費', '売上等） * @returns AccountGroup（例: 'PL_EXPENSE', 'PL_REVENUE'等） */
export function getCategoryAccountGroup(category: string): AccountGroup {
  if (SALES_CATEGORIES.includes(category)) return 'PL_REVENUE'
  if (PURCHASE_CATEGORIES.includes(category)
    || OTHER_PL_CATEGORIES.includes(category)) return 'PL_EXPENSE'
  if (BS_ASSET_CATEGORIES.includes(category)) return 'BS_ASSET'
  if (BS_LIABILITY_CATEGORIES.includes(category)) return 'BS_LIABILITY'
  if (BS_EQUITY_CATEGORIES.includes(category)) return 'BS_EQUITY'
  return 'PL_EXPENSE' // フォールバック
}

/**
 * 科目分類から売上/仕入/共通の方向を導出
 *
 * @param category - 科目分類の中分類。 * @returns 'sales' | 'purchase' | 'common'
 */
export function getCategoryDirection(category: string): 'sales' | 'purchase' | 'common' {
  if (SALES_CATEGORIES.includes(category)) return 'sales'
  if (PURCHASE_CATEGORIES.includes(category)) return 'purchase'
  return 'common'
}

/**
 * 科目の大分類・中分類・課税方式に基づいて許可されるtaxDetermination値を返す
 *
 * @param accountGroup - 勘定科目グループ（BS_ASSET等） * @param category - 科目分類の中分類。 * @param taxMethod - 課税方式（taxable' | 'exempt' | 'general' | 'simplified'） * @returns 許可されるTaxDetermination値の配列
 */
export function getAllowedTaxDeterminations(
  accountGroup: AccountGroup,
  category: string,
  taxMethod: string,
): TaxDetermination[] {
  // 免税事業者: 全科目 fixed のみ
  if (taxMethod === 'exempt') return ['fixed']

  if (accountGroup === 'PL_REVENUE') return ['auto_sales', 'fixed']
  if (accountGroup === 'PL_EXPENSE') return ['auto_purchase', 'fixed']
  if (accountGroup === 'BS_ASSET'
    && BS_ASSET_PURCHASE_CATEGORIES.includes(category)) {
    return ['auto_purchase', 'fixed']
  }
  return ['fixed']
}

/**
 * taxDetermination値の日本語ラベル
 *
 * @param td - TaxDetermination値
 * @returns 日本語表示ラベル
 */
export function taxDetLabel(td: string): string {
  switch (td) {
    case 'auto_purchase': return '自動(仕入)'
    case 'auto_sales': return '自動(売上)'
    case 'fixed': return '固定'
    default: return td
  }
}

/**
 * category変更時のaccountGroup・taxDetermination・defaultTaxCategoryIdの自動連動設定 *
 * @param newCategory - 変更先のcategory
 * @returns { accountGroup, taxDetermination, defaultTaxCategoryId } の推奨値
 */
export function deriveCategoryDefaults(newCategory: string): {
  accountGroup: AccountGroup
  taxDetermination: TaxDetermination
  defaultTaxCategoryId: string
} {
  const accountGroup = getCategoryAccountGroup(newCategory)

  if (SALES_CATEGORIES.includes(newCategory)) {
    return { accountGroup, taxDetermination: 'auto_sales', defaultTaxCategoryId: 'SALES_TAXABLE_10' }
  }
  if (PURCHASE_CATEGORIES.includes(newCategory)) {
    return { accountGroup, taxDetermination: 'auto_purchase', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10' }
  }
  return { accountGroup, taxDetermination: 'fixed', defaultTaxCategoryId: 'COMMON_EXEMPT' }
}
