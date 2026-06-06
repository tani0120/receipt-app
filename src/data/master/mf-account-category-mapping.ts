/**
 * MF勘定科目カテゴリ → 全社マスタ変換ユーティリティ
 *
 * MFのMCPレスポンス（account_group / category）を
 * 全社マスタのAccount型（accountGroup / category）に変換する。
 *
 * 設計方針（2026-06-05）:
 *   - categoryはMFの値をそのまま保持（29種への変換を廃止）
 *   - accountGroupはMFのaccount_groupから直接変換
 *   - taxDeterminationはaccountGroupから直接判定（データ駆動）
 */

import type { AccountGroup, AccountTarget, TaxDetermination } from '../../types/shared-account'
import { getAccountGroupDirection } from './account-category-rules'

// ========================================
// MF account_group → 全社マスタ大分類（accountGroup）マッピング
// ========================================

/**
 * MFのaccount_groupから全社マスタのaccountGroupを導出する。
 *
 * MFの値をそのまま5種に1対1変換。
 * 注意: MFではOWNERS_DRAWINGSがASSET、OWNERS_CAPITALがLIABILITYだが、
 * MFの分類を信頼してそのまま変換する（MF実機が事実）。
 */
export function deriveMfAccountGroup(mfAccountGroup: string, _mfCategory?: string): AccountGroup {
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
// accountGroup → 税区分判定モード（taxDetermination）導出
// ========================================

/**
 * accountGroupから税区分判定モードを導出する（データ駆動）
 *
 * 旧: SALES_CATEGORIES/PURCHASE_CATEGORIESのハードコード配列で判定
 * 新: accountGroupから直接判定
 */
export function deriveTaxDetermination(accountGroup: AccountGroup): TaxDetermination {
  const direction = getAccountGroupDirection(accountGroup)
  if (direction === 'sales') return 'auto_sales'
  if (direction === 'purchase') return 'auto_purchase'
  return 'fixed'
}

// ========================================
// 対象区分（target）推定
// ========================================

/** 個人事業専用MFカテゴリ */
const INDIVIDUAL_ONLY_CATEGORIES = [
  'OWNERS_DRAWINGS', 'OWNERS_CAPITAL',
  'REAL_ESTATE_INCOME', 'REAL_ESTATE_EXPENSES', 'REAL_ESTATE_EMPLOYEE_SALARY',
]

/** MF\u306ecategory\u304b\u3089target\u3092\u63a8\u5b9a\u3059\u308b\uff08both\u5ec3\u6b62\u6e08\u307f\u3002\u500b\u4eba\u5c02\u7528\u4ee5\u5916\u306fcorp\u3092\u8fd4\u3059\uff09 */
export function deriveTarget(mfCategory: string, mfFsType?: string): AccountTarget {
  if (INDIVIDUAL_ONLY_CATEGORIES.includes(mfCategory)) return 'individual'
  if (mfFsType === 'REAL_ESTATE') return 'individual'
  return 'corp'
}
