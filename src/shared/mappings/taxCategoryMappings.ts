/**
 * 税区分変換テーブル（会計ソフト別）
 *
 * マスタID → 各会計ソフトの税区分名マッピング。
 * CSVエクスポート・仕訳画面表示・AIプロンプト生成で使用。
 *
 * ■ データ駆動設計:
 *   MF列: マスタのname/shortNameから動的に解決（ハードコードなし）
 *   弥生/Freee列: 静的オーバーライドテーブルから取得（実機データ取得後に埋める）
 *   → MFインポートでマスタが更新されても自動追従する
 *
 * 生成日: 2026-06-04
 */

import type { TaxCategory } from '@/types/shared-tax-category'

/** 会計ソフト識別子 */
export type AccountingSoftwareKey = 'mf' | 'yayoi' | 'freee'

/**
 * 弥生/Freee用の静的オーバーライドテーブル
 * 実機データ取得後にここに追加する。
 * MFはマスタのname/shortNameがそのままMF名なのでオーバーライド不要。
 */
export const TAX_NAME_OVERRIDES: Record<
  Exclude<AccountingSoftwareKey, 'mf'>,
  Record<string, string>
> = {
  yayoi: {
    // 実機データ取得後に埋める（P3）
    // 例: SALES_TAXABLE_10: '課税売上込10%',
  },
  freee: {
    // 実機データ取得後に埋める（P3）
    // 例: SALES_TAXABLE_10: '課税売上10%',
  },
}

/**
 * マスタIDから指定会計ソフトの税区分名を取得する（データ駆動）
 *
 * @param masterId - マスタID（例: SALES_TAXABLE_10）
 * @param software - 会計ソフト識別子（例: 'mf', 'yayoi', 'freee'）
 * @param masterTaxCategories - 全社マスタまたは顧問先別税区分の配列
 * @returns 該当ソフトの税区分名。見つからない場合はmasterIdをそのまま返す
 */
export function resolveTaxNameForSoftware(
  masterId: string,
  software: AccountingSoftwareKey,
  masterTaxCategories: TaxCategory[],
): string {
  // MFの場合: マスタのnameをそのまま返す（マスタがSSOT）
  if (software === 'mf') {
    const master = masterTaxCategories.find(t => t.taxCategoryId === masterId)
    return master?.name ?? masterId
  }

  // 弥生/Freeeの場合: 静的オーバーライドを優先
  const override = TAX_NAME_OVERRIDES[software]?.[masterId]
  if (override) return override

  // フォールバック: マスタのnameを返す
  const master = masterTaxCategories.find(t => t.taxCategoryId === masterId)
  return master?.name ?? masterId
}

/**
 * マスタIDから指定会計ソフトの税区分略称を取得する（データ駆動）
 *
 * @param masterId - マスタID
 * @param software - 会計ソフト識別子
 * @param masterTaxCategories - 全社マスタまたは顧問先別税区分の配列
 * @returns 該当ソフトの税区分略称。見つからない場合はnameにフォールバック
 */
export function resolveTaxShortNameForSoftware(
  masterId: string,
  software: AccountingSoftwareKey,
  masterTaxCategories: TaxCategory[],
): string {
  const master = masterTaxCategories.find(t => t.taxCategoryId === masterId)
  if (!master) return masterId

  // MFの場合: shortNameがあればそれを返す
  if (software === 'mf') {
    return master.shortName || master.name
  }

  // 弥生/Freee: オーバーライドがあればそれを返す、なければMF名
  const override = TAX_NAME_OVERRIDES[software]?.[masterId]
  return override ?? master.shortName ?? master.name
}
