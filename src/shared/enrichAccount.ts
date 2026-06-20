/**
 * enrichAccount.ts — 勘定科目 enrich関数（フロント・バックエンド共用）
 *
 * 【責務】
 * Account（永続化形式）→ EnrichedAccount（表示用）への変換。
 * 純粋関数のみで構成。Node.js API依存なし。
 *
 * 【不変条件】
 * EnrichedAccount[] に要素を追加する全経路は、
 * 必ず enrichAccountRow() を通過しなければならない。
 *
 * 【使用箇所】
 * - バックエンド: accountMasterApi.ts（APIレスポンス生成）
 * - フロント: accountMasterStore.ts（addCustomAccount時のenrich）
 *
 * Supabase移行時: DB側VIEWで生成するか、この関数を維持するか選択。
 */

import type { Account, EnrichedAccount } from '@/types/shared-account'
import type { TaxCategory } from '@/types/shared-tax-category'
import { getAccountGroupDirection, getCategoryLabel } from '@/data/master/account-category-rules'
import { VOUCHER_TYPE_RULES } from '@/data/master/voucherTypeRules'

// ────────────────────────────────────────────
// ラベル変換ヘルパー（純粋関数）
// ────────────────────────────────────────────

/** accountGroupの日本語ラベル */
function toAccountGroupLabel(ag: string): string {
  switch (ag) {
    case 'BS_ASSET': return 'BS資産'
    case 'BS_LIABILITY': return 'BS負債'
    case 'BS_EQUITY': return 'BS純資産'
    case 'PL_REVENUE': return 'PL収益'
    case 'PL_EXPENSE': return 'PL費用'
    default: return ag
  }
}

/** targetの日本語ラベル */
function toTargetLabel(t: string): string {
  switch (t) {
    case 'corp': return '法人'
    case 'individual': return '個人'
    default: return t
  }
}

/** directionの日本語ラベル */
function toDirectionLabel(accountGroup: string): string {
  const dir = getAccountGroupDirection(accountGroup)
  switch (dir) {
    case 'sales': return '売上'
    case 'purchase': return '仕入'
    case 'common': return '共通'
    default: return dir
  }
}

/** 証票意味許容タイプを算出 */
function toAllowedVoucherTypes(row: { accountId: string; accountGroup: string; category: string }): string {
  const debitTypes: string[] = []
  const creditTypes: string[] = []
  for (const [vtName, rule] of Object.entries(VOUCHER_TYPE_RULES)) {
    const d = rule.debit
    if (d.allowedGroups?.includes(row.accountGroup) || d.allowedIds?.includes(row.accountId) || d.allowedCategories?.includes(row.category)) {
      debitTypes.push(vtName)
    }
    const c = rule.credit
    if (c.allowedGroups?.includes(row.accountGroup) || c.allowedIds?.includes(row.accountId) || c.allowedCategories?.includes(row.category)) {
      creditTypes.push(vtName)
    }
  }
  const parts: string[] = []
  if (debitTypes.length > 0) parts.push(`借:${debitTypes.join(',')}`)
  if (creditTypes.length > 0) parts.push(`貸:${creditTypes.join(',')}`)
  return parts.join(' / ') || '—'
}

/** 課税方式別のAI判定フラグマップを生成 */
function buildAiDeterminationMap(accountGroup: string): Record<string, string> {
  const dir = getAccountGroupDirection(accountGroup)
  const flag = dir !== 'common' ? '○' : ''
  return {
    proportional: flag,
    individual: flag,
    simplified: flag,
    exempt: '',
  }
}

/** 課税方式別のデフォルト税区分名マップを生成 */
function buildDefaultTaxesMap(defaultTaxCategoryId: string | undefined, taxCategories: TaxCategory[]): Record<string, string> {
  // 免税のデフォルト表示名: データ駆動（COMMON_EXEMPTのname）
  const exemptName = taxCategories.find(tc => tc.taxCategoryId === 'COMMON_EXEMPT')?.name ?? '対象外'

  if (!defaultTaxCategoryId) {
    return { proportional: '', individual: '', simplified: '', exempt: exemptName }
  }

  const baseTc = taxCategories.find(tc => tc.taxCategoryId === defaultTaxCategoryId)
  // 正式名称（name）を使用。全社税区分マスタと表示統一。
  const baseName = baseTc?.name ?? defaultTaxCategoryId

  // 対象外系（COMMON_EXEMPT等）は全方式で同じ名前
  if (baseTc && (baseTc.direction === 'common' && defaultTaxCategoryId.includes('EXEMPT'))) {
    return { proportional: baseName, individual: baseName, simplified: baseName, exempt: baseName }
  }

  // 簡易課税: baseIdで逆引き → 事業種別バリアントがあるなら「(種別選択)」付記
  let simplifiedName = baseName
  const simplifiedVariants = taxCategories.filter(tc => tc.baseId === defaultTaxCategoryId)
  if (simplifiedVariants.length > 0) {
    // 事業種別バリアントが存在 → 全社マスタでは種別未確定
    simplifiedName = `${baseName} (種別選択)`
  }

  return {
    proportional: baseName,
    individual: baseName,
    simplified: simplifiedName,
    exempt: exemptName,
  }
}

// ────────────────────────────────────────────
// enrich関数（公開API）
// ────────────────────────────────────────────

/**
 * 勘定科目行に表示用フィールドを付与
 *
 * Account（永続化形式）→ EnrichedAccount（表示用）を生成する唯一の正規経路。
 * 全てのEnrichedAccount生成はこの関数を通過しなければならない。
 *
 * @param row - Account（永続化形式）
 * @param taxCategories - 税区分マスタ（デフォルト税区分名の解決に使用）
 * @returns EnrichedAccount（表示用フィールド付き）
 */
export function enrichAccountRow(row: Account, taxCategories: TaxCategory[]): EnrichedAccount {
  return {
    ...row,
    accountGroupLabel: toAccountGroupLabel(row.accountGroup),
    targetLabel: toTargetLabel(row.target),
    directionLabel: toDirectionLabel(row.accountGroup),
    categoryLabel: getCategoryLabel(row.category),
    displayEffectiveFrom: row.effectiveFrom ?? '—',
    displayEffectiveTo: row.effectiveTo ?? '現役',
    displayAllowedVoucherTypes: toAllowedVoucherTypes(row),
    sourceLabel: row.isCustom || row.source === 'client-custom' ? 'カスタム' : row.source === 'mcp' ? 'MCP' : '全社',
    aiDetermination: buildAiDeterminationMap(row.accountGroup),
    defaultTaxes: buildDefaultTaxesMap(row.defaultTaxCategoryId, taxCategories),
  }
}
