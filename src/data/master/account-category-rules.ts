/**
 * 勘定科目分類ルール（データ駆動設計）
 *
 * 方針:
 *   - accountGroupから直接判定（データ駆動）
 *   - ハードコードのSALES_CATEGORIES等は廃止
 *   - getCategoryAccountGroup()は廃止（accountGroupを直接参照）
 *   - categoryが必要な箇所のみハードコード維持
 *     （BS_ASSET_PURCHASE_CATEGORIES, allowedCategories 4種）
 *
 * 参照元:
 *   - views/master/MockMasterAccountsPage.vue
 *   - views/client/MockClientAccountsPage.vue
 *   - api/services/accountMasterStore.ts
 *   - shared/validation/journalValidationCore.ts（間接）
 */
import type { AccountGroup, TaxDetermination } from '@/types/shared-account'

// ========================================
// MFカテゴリ定数（categoryレベルの判定が必要な箇所のみ）
// ========================================

/** BS資産のうちauto_purchaseを許可するMFカテゴリ（資産取得＝課税仕入） */
export const BS_ASSET_PURCHASE_CATEGORIES: readonly string[] = [
  'PROPERTY_PLANT_AND_EQUIPMENT', 'INTANGIBLE_ASSETS',
]



// ========================================
// MFカテゴリ → 日本語ラベル（UI表示用）
// ========================================

/** MFカテゴリの日本語ラベル（UI表示用。MCP生データの科目分類に対応） */
export const MF_CATEGORY_LABELS: Record<string, string> = {
  // PL収益
  'NET_SALES': '売上',
  'SALES_REVENUE': '売上（個人）',
  'REAL_ESTATE_INCOME': '不動産収入',
  'NON_OPERATING_INCOME': '営業外収益',
  'EXTRAORDINARY_INCOME': '特別利益',
  'REVERSALS': '繰戻額等',
  // PL費用
  'COST_OF_PURCHASED_GOODS': '売上原価（仕入）',
  'BEGINNING_INVENTORY': '期首棚卸高',
  'ENDING_INVENTORY': '期末棚卸高',
  'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES': '販管費',
  'EXPENSES': '経費（個人）',
  'REAL_ESTATE_EXPENSES': '不動産経費',
  'REAL_ESTATE_EMPLOYEE_SALARY': '専従者給与（不動産）',
  'NON_OPERATING_EXPENSES': '営業外費用',
  'EXTRAORDINARY_LOSSES': '特別損失',
  'PROVISIONS': '引当金繰入',
  'CORPORATE_INCOME_TAXES_CURRENT': '法人税等',
  'CORPORATE_INCOME_TAXES_DEFERRED': '法人税等調整額',
  'TRANSFERS_TO_OTHER_ACCOUNTS': '他勘定振替高',
  // BS資産
  'CASH_AND_DEPOSITS': '現金及び預金',
  'TRADE_RECEIVABLES': '売上債権',
  'MARKETABLE_SECURITIES': '有価証券',
  'INVENTORIES': '棚卸資産',
  'OTHER_CURRENT_ASSETS': 'その他流動資産',
  'PROPERTY_PLANT_AND_EQUIPMENT': '有形固定資産',
  'INTANGIBLE_ASSETS': '無形固定資産',
  'INVESTMENTS_AND_OTHER_ASSETS': '投資その他',
  'DEFERRED_ASSETS': '繰延資産',
  'OWNERS_DRAWINGS': '事業主貸',
  'SUNDRIES': '諸口',
  // BS負債
  'TRADE_PAYABLES': '仕入債務',
  'OTHER_CURRENT_LIABILITIES': 'その他流動負債',
  'NON_CURRENT_LIABILITIES': '固定負債',
  'OWNERS_CAPITAL': '事業主借',
  // BS純資産
  'CAPITAL_STOCK': '資本金',
  'EQUITY': '純資産',
  'LEGAL_CAPITAL_SURPLUS': '資本準備金',
  'OTHER_CAPITAL_SURPLUS': 'その他資本剰余金',
  'STOCK_SUBSCRIPTION_DEPOSITS': '新株式申込証拠金',
  'LEGAL_RETAINED_EARNINGS': '利益準備金',
  'APPROPRIATED_RETAINED_EARNINGS': '別途積立金',
  'RETAINED_EARNINGS_BROUGHT_FORWARD': '繰越利益剰余金',
  'TREASURY_STOCK': '自己株式',
  'TREASURY_STOCK_SUBSCRIPTION_DEPOSITS': '自己株式申込証拠金',
  'VALUATION_AND_TRANSLATION_ADJUSTMENTS': '評価・換算差額等',
  'SUBSCRIPTION_RIGHTS_TO_SHARES': '新株予約権',
}

/**
 * MFカテゴリの日本語ラベルを取得（UI表示用）
 *
 * @param category - MFカテゴリ名（英語）
 * @returns 日本語ラベル（未定義の場合はカテゴリ名をそのまま返す）
 */
export function getCategoryLabel(category: string): string {
  return MF_CATEGORY_LABELS[category] ?? category
}

// ========================================
// データ駆動ユーティリティ関数
// ========================================

/**
 * accountGroupから売上/仕入/共通の方向を判定（データ駆動）
 *
 * 旧getCategoryDirection()の代替。categoryではなくaccountGroupから直接判定。
 *
 * @param accountGroup - 勘定科目グループ（BS_ASSET等）
 * @returns 'sales' | 'purchase' | 'common'
 */
export function getAccountGroupDirection(accountGroup: AccountGroup | string): 'sales' | 'purchase' | 'common' {
  if (accountGroup === 'PL_REVENUE') return 'sales'
  if (accountGroup === 'PL_EXPENSE') return 'purchase'
  return 'common'
}

/**
 * 科目のaccountGroup・categoryに基づいて許可されるtaxDetermination値を返す
 *
 * @param accountGroup - 勘定科目グループ（BS_ASSET等）
 * @param category - MFカテゴリ名（BS_ASSET_PURCHASE判定用）
 * @param taxMethod - 課税方式
 * @returns 許可されるTaxDetermination値の配列
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
 * category変更時のtaxDetermination・defaultTaxCategoryIdの自動連動設定（データ駆動）
 *
 * accountGroupは呼び出し元で直接保持しているため、categoryから導出しない。
 *
 * @param accountGroup - 勘定科目グループ（直接指定）
 * @param taxCategories - 税区分マスタ（デフォルトID解決用。省略時はフォールバック）
 * @returns { taxDetermination, defaultTaxCategoryId } の推奨値
 */
export function deriveCategoryDefaults(
  accountGroup: AccountGroup,
  taxCategories?: { taxCategoryId: string; isSalesDefault?: boolean; isPurchaseDefault?: boolean; isExemptDefault?: boolean }[],
): {
  taxDetermination: TaxDetermination
  defaultTaxCategoryId: string
} {
  // データ駆動: マスタのフラグからデフォルト税区分IDを解決
  const salesDefault = taxCategories?.find(t => t.isSalesDefault)?.taxCategoryId ?? ''
  const purchaseDefault = taxCategories?.find(t => t.isPurchaseDefault)?.taxCategoryId ?? ''
  const exemptDefault = taxCategories?.find(t => t.isExemptDefault)?.taxCategoryId ?? ''

  const direction = getAccountGroupDirection(accountGroup)
  if (direction === 'sales') {
    return { taxDetermination: 'auto_sales', defaultTaxCategoryId: salesDefault }
  }
  if (direction === 'purchase') {
    return { taxDetermination: 'auto_purchase', defaultTaxCategoryId: purchaseDefault }
  }
  return { taxDetermination: 'fixed', defaultTaxCategoryId: exemptDefault }
}
