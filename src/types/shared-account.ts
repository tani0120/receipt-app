/**
 * 勘定科目ドメイン型
 *
 * 設計根拠:
 * - streamed_mf_csv_spec.md: CSV出力時は勘定科目の名称で完全一致必須
 * - code / externalCode は不要（API連携未実装）
 * - MFクラウド会計（法人）/ MFクラウド確定申告（個人）でデフォルト科目が異なる
 */

/** 対象区分（法人 or 個人。MFの科目体系に準拠。both廃止済み） */
export type AccountTarget = 'corp' | 'individual'

/** 大分類（財務諸表上の位置） */
export type AccountGroup = 'BS_ASSET' | 'BS_LIABILITY' | 'BS_EQUITY' | 'PL_REVENUE' | 'PL_EXPENSE'

/** 勘定科目 */
export type Account = {
    /** 内部ID（不変） */
    accountId: string
    /** MF正式科目名。CSV出力時にそのまま使用 */
    name: string
    /** 補助科目 */
    sub?: string
    /** 対象: 法人/個人（MFの科目体系に準拠。both廃止済み） */
    target: AccountTarget
    /** 大分類: BS資産/BS負債/BS純資産/PL収益/PL費用 */
    accountGroup: AccountGroup
    /** 科目分類（中分類。例: '現金及び預金', '経費'） */
    category: string
    /** デフォルト税区分ID（TaxCategory.taxCategoryId への参照） */
    defaultTaxCategoryId?: string
    /** 非推奨フラグ（true=グレーアウト表示。物理削除禁止 → ルール3） */
    deprecated: boolean
    /** 適用開始日（ISO 8601形式。例: '2019-10-01'） */
    effectiveFrom: string
    /** 適用終了日（null=現役。終了した科目は日付を設定 → ルール1） */
    effectiveTo: string | null
    /** 表示順 */
    sortOrder: number
    /** データの出自
     * - 'mcp': MFのMCP APIからインポート（全社マスタ・MF連携先の顧問先）
     * - 'client-custom': MF未連携の顧問先で手動追加したカスタム科目
     */
    source?: 'mcp' | 'client-custom'
    /** カスタム科目フラグ（ユーザー追加=true、システム提供=false/undefined → ルール4） */
    isCustom?: boolean
    /** デフォルト順復元用: コピー/追加時の挿入位置直前の行ID */
    insertAfter?: string
    /** 補助科目（顧問先別設定画面で動的に付与） */
    subAccount?: string
    /** 非表示フラグ（勘定科目設定で使用） */
    hidden?: boolean
    /** 売上返品科目フラグ（逆仕訳例外判定用。売上値引・売上返品等） */
    isContraRevenue?: boolean
    /** 仕入返品科目フラグ（逆仕訳例外判定用。仕入値引・仕入返品等） */
    isContraExpense?: boolean

    // ── MF連携フィールド（顧問先データでのみ使用。全社マスタではundefined） ──
    // MF IDは事業者（テナント）固有のため、全社テンプレートには持たない。
    // 顧問先別データにのみ保存し、MCP仕訳送信（account_id必須）に使用する。

    /** MF勘定科目ID（Base64。顧問先データでのみ設定。MCP仕訳送信のaccount_idに使用） */
    mfAccountId?: string | null
    /** MF大分類（'ASSET'/'LIABILITY'/'CAPITAL'/'REVENUE'/'EXPENSE'。顧問先データでのみ設定） */
    mfAccountGroup?: string | null
    /** MF財務諸表区分（'BALANCE_SHEET'/'PROFIT_LOSS'/'REAL_ESTATE'。顧問先データでのみ設定） */
    mfFinancialStatementType?: string | null
    // mfDefaultTaxId は削除済み（2026-06-04）。
    // MFのtax_idは事業者固有IDで事業者間一致しないため保存する意味がない。
    // 仕訳送信時はmfMappingServiceがMCPからリアルタイム取得+名前照合で解決する。
}

