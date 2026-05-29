/**
 * MF勘定科目カテゴリ → 全社マスタカテゴリ マッピングテーブル
 *
 * MFのMCPレスポンス（account_group / category）を
 * 全社マスタのAccount型（accountGroup / category）に変換する。
 *
 * 根拠: MCP取得データ108件と全社マスタ143件の名前照合分析（94件一致）から導出。
 */

import type { AccountGroup, AccountTarget, TaxDetermination } from '../../types/shared-account'

// ========================================
// MFカテゴリ → 全社マスタ中分類（category）マッピング
// ========================================

/** MFのcategory値 → 全社マスタのcategory値 */
export const MF_CATEGORY_MAP: Record<string, string> = {
  // BS資産系
  CASH_AND_DEPOSITS: '現金及び預金',
  TRADE_RECEIVABLES: '売上債権',
  MARKETABLE_SECURITIES: '有価証券',
  OTHER_CURRENT_ASSETS: 'その他流動資産',
  INVENTORIES: '棚卸資産',
  PROPERTY_PLANT_AND_EQUIPMENT: '有形固定資産',
  INTANGIBLE_ASSETS: '無形固定資産',
  INVESTMENTS_AND_OTHER_ASSETS: '投資その他',
  DEFERRED_ASSETS: '繰延資産',

  // BS純資産系（MFではASSET/LIABILITYに分類されるが全社マスタではBS_EQUITY）
  OWNERS_DRAWINGS: '事業主貸',
  SUNDRIES: '諸口',
  EQUITY: '資本の部',
  OWNERS_CAPITAL: '事業主借',

  // BS負債系
  TRADE_PAYABLES: '仕入債務',
  OTHER_CURRENT_LIABILITIES: 'その他流動負債',
  NON_CURRENT_LIABILITIES: '固定負債',

  // PL費用系
  COST_OF_PURCHASED_GOODS: '売上原価',
  BEGINNING_MERCHANDISE_INVENTORY: '売上原価',
  ENDING_MERCHANDISE_INVENTORY: '売上原価',
  EXPENSES: '経費',
  PROVISIONS: '繰入額等',
  REAL_ESTATE_EXPENSES: '不動産経費',
  REAL_ESTATE_EMPLOYEE_SALARY: '不動産経費',

  // PL収益系
  SALES_REVENUE: '売上',
  REAL_ESTATE_INCOME: '不動産収入',

  // PL特殊（MFではREVENUEだが全社マスタではPL_EXPENSE）
  REVERSALS: '繰戻額等',
}

// ========================================
// MF account_group + category → 全社マスタ大分類（accountGroup）マッピング
// ========================================

/**
 * MFのaccount_group/categoryから全社マスタのaccountGroupを導出する。
 * account_group単独では不十分（事業主貸/諸口等の例外あり）。
 */
export function deriveMfAccountGroup(mfAccountGroup: string, mfCategory: string): AccountGroup {
  // 例外: MFではASSETだが全社マスタではBS_EQUITY
  if (mfCategory === 'OWNERS_DRAWINGS') return 'BS_EQUITY'
  if (mfCategory === 'SUNDRIES') return 'BS_EQUITY'

  // 例外: MFではLIABILITYだが全社マスタではBS_EQUITY
  if (mfCategory === 'OWNERS_CAPITAL') return 'BS_EQUITY'

  // 例外: MFではREVENUEだが全社マスタではPL_EXPENSE
  if (mfCategory === 'REVERSALS') return 'PL_EXPENSE'

  // 標準マッピング
  switch (mfAccountGroup) {
    case 'ASSET': return 'BS_ASSET'
    case 'CAPITAL': return 'BS_EQUITY'
    case 'EXPENSE': return 'PL_EXPENSE'
    case 'LIABILITY': return 'BS_LIABILITY'
    case 'REVENUE': return 'PL_REVENUE'
    default: return 'PL_EXPENSE' // フォールバック
  }
}

// ========================================
// 中分類 → 税区分判定モード（taxDetermination）導出
// ========================================

/** account-category-rules.tsと同じロジックだが、MFカテゴリから直接導出する版 */
import { SALES_CATEGORIES, PURCHASE_CATEGORIES } from './account-category-rules'

export function deriveTaxDetermination(masterCategory: string): TaxDetermination {
  if (SALES_CATEGORIES.includes(masterCategory)) return 'auto_sales'
  if (PURCHASE_CATEGORIES.includes(masterCategory)) return 'auto_purchase'
  return 'fixed'
}

// ========================================
// 対象区分（target）推定
// ========================================

/** 個人事業専用カテゴリ（全社マスタの中分類ベース） */
const INDIVIDUAL_ONLY_CATEGORIES = ['事業主貸', '事業主借', '不動産収入', '不動産経費']

/** MFのfinancial_statement_typeとcategoryからtargetを推定する */
export function deriveTarget(masterCategory: string, mfFsType?: string): AccountTarget {
  if (INDIVIDUAL_ONLY_CATEGORIES.includes(masterCategory)) return 'individual'
  if (mfFsType === 'REAL_ESTATE') return 'individual'
  return 'both' // 個人事業のデータから取得しているが、共通科目が大半
}
