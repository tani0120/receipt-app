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

/** 税区分判定モード（STREAMED準拠） */
export type TaxDetermination = 'auto_purchase' | 'auto_sales' | 'fixed'

/** 大分類（財務諸表上の位置） */
export type AccountGroup = 'BS_ASSET' | 'BS_LIABILITY' | 'BS_EQUITY' | 'PL_REVENUE' | 'PL_EXPENSE'

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
    /** 大分類: BS資産/BS負債/BS純資産/PL収益/PL費用 */
    accountGroup: AccountGroup
    /** 科目分類（中分類。例: '現金及び預金', '経費'） */
    category: string
    /** デフォルト税区分ID（TaxCategory.id への参照） */
    defaultTaxCategoryId?: string
    /** 税区分判定モード: auto_purchase=自動判定（仕入）, auto_sales=自動判定（売上）, fixed=固定 */
    taxDetermination: TaxDetermination
    /** 非推奨フラグ（true=グレーアウト表示。物理削除禁止 → ルール3） */
    deprecated: boolean
    /** 適用開始日（ISO 8601形式。例: '2019-10-01'） */
    effectiveFrom: string
    /** 適用終了日（null=現役。終了した科目は日付を設定 → ルール1） */
    effectiveTo: string | null
    /** 表示順 */
    sortOrder: number
    /** カスタム科目フラグ（ユーザー追加=true、システム提供=false/undefined → ルール4） */
    isCustom?: boolean
    /** デフォルト順復元用: コピー/追加時の挿入位置直前の行ID */
    insertAfter?: string
    /** 補助科目（顧問先別設定画面で動的に付与） */
    subAccount?: string
    /** 非表示フラグ（勘定科目設定で使用） */
    hidden?: boolean
    /** マスタカスタム科目フラグ */
    isMasterCustom?: boolean
}

