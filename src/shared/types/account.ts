/**
 * 勘定科目ドメイン型
 *
 * 設計根拠:
 * - streamed_mf_csv_spec.md: CSV出力時は勘定科目の名称で完全一致必須
 * - code / externalCode は不要（API連携未実装）
 * - MFクラウド会計（法人）/ MFクラウド確定申告（個人）でデフォルト科目が異なる
 */

/** 対象区分 */
export type AccountTarget = 'corp' | 'individual' | 'both'

/** 勘定科目 */
export type Account = {
    /** 内部ID（不変） */
    id: string
    /** MF正式科目名。CSV出力時にそのまま使用 */
    name: string
    /** 補助科目 */
    sub?: string
    /** 対象: 法人/個人/共通 */
    target: AccountTarget
    /** BS/PL分類（例: '流動資産', '経費'） */
    category: string
    /** デフォルト税区分ID（TaxCategory.id への参照） */
    defaultTaxCategoryId?: string
    /** AI自動選択可否 */
    aiSelectable: boolean
    /** 表示順 */
    sortOrder: number
}
