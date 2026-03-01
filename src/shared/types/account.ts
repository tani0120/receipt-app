/**
 * 勘定科目ドメイン型
 *
 * 設計根拠:
 * - streamed_mf_csv_spec.md: CSV出力時は勘定科目の名称で完全一致必須
 * - code / externalCode は不要（API連携未実装）
 */

/** 勘定科目 */
export type Account = {
    /** 内部ID（不変） */
    id: string
    /** MF正式科目名。CSV出力時にそのまま使用 */
    name: string
    /** 補助科目 */
    sub?: string
    /** デフォルト税区分ID（TaxCategory.id への参照） */
    defaultTaxCategoryId?: string
    /** 表示順 */
    sortOrder: number
}
