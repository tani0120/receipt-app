/**
 * 税区分ドメイン型
 *
 * 設計根拠:
 * - streamed_design_policy.md: エンジンは税区分名を決めるだけ。税額計算はMFに委譲
 * - streamed_mf_csv_spec.md: CSV出力時は税区分の「名称」で完全一致必須
 * - 税区分設定1.csv: マスタ列は 名称, 省略名, 使用, 検索キー, 並び順
 *
 * rate（税率）はドメインに持たない。エンジンの責務外（MF管理）。
 * UIで税率を表示する場合は name から抽出する。
 */

/** 税区分の方向（売上/仕入/共通） */
export type TaxDirection = 'sales' | 'purchase' | 'common'

/** 税区分 */
export type TaxCategory = {
    /** 概念ID（不変・意味付き）例: PURCHASE_TAXABLE_10 */
    taxCategoryId: string
    /** MF正式名称。CSV出力時にそのまま使用。MF登録名と完全一致必須 */
    name: string
    /** 省略名（UI表示用） */
    shortName: string
    /** 方向: 売上/仕入/共通 */
    direction: TaxDirection
    /** 適格判定対象 */
    qualified: boolean
    /** AI自動選択可否（マスタ初期値。顧問先単位で上書き可能 → ルール9） */
    aiSelectable: boolean
    /** 表示/非表示フラグ（true=UIで非表示。物理削除禁止 → ルール3） */
    hidden: boolean
    /** 施行日（ISO 8601形式。例: '2019-10-01'。MF未照合行はnull=不明） */
    effectiveFrom: string | null
    /** 廃止日（null=現役。旧税率は日付を設定 → ルール1） */
    effectiveTo: string | null
    /** 利用開始日（この事務所/顧問先で使い始めた日。MFインポート日など） */
    enabledFrom?: string | null
    /** 利用停止日（非表示化した日。null=利用中） */
    enabledTo?: string | null
    /** デフォルト表示（27件=true） */
    defaultVisible: boolean
    /** 表示順（CSV並び順と一致） */
    displayOrder: number
    /** カスタム税区分フラグ（ユーザー追加=true、システム提供=false/undefined → ルール4） */
    isCustom?: boolean
    /** データ出典
     * - 'mcp': MFのMCP APIからインポート（全社マスタ・MF連携先の顧問先）
     * - 'client-custom': MF未連携の顧問先で手動追加したカスタム税区分
     */
    source?: 'mcp' | 'client-custom'
    // mfId（旧: 全社マスタ・顧問先共通）は2026-06-04に削除済み。
    // MFのtax_idは事業者固有IDで事業者間一致しない（MCP実機: TSK vs TST 0/151件一致）。
    // → 全社マスタには持たない。
    // → 顧問先別にのみ mfTaxId として保持する（同一事業者内では安定。仕訳送信時に使用）。
    /**
     * MF事業者固有の税区分ID（顧問先別データでのみ使用）
     * - sync-all / importClientTaxes 時にMCPから取得して保存
     * - 仕訳送信時にこのIDを使う（毎回MCP取得を避ける）
     * - 全社マスタには入れない（事業者間で不一致のため）
     * - MF側で変更があればsync-all再実行で更新される
     */
    mfTaxId?: string
    /** 税率（MFインポート時にセット。0.10 = 10%。UI表示用。税額計算はMFに委譲） */
    taxRate?: number
    /** 簡易課税専用フラグ（true=簡易課税方式でのみ使用。原則課税・免税では非表示） */
    simplifiedOnly?: boolean
    /** 原則用ベース税区分ID（simplifiedOnly=trueの場合のみ設定。対応する原則用税区分のID） */
    baseId?: string
    /** 個別対応方式専用フラグ（true=個別対応方式でのみ使用可。一括比例では不正） */
    individualOnly?: boolean
    /** 免税事業者デフォルトフラグ（免税時の矛盾修正先。マスタで1件のみtrue） */
    isExemptDefault?: boolean
    /** 不明（未確定）税区分フラグ（一時保存用。マスタで1件のみtrue） */
    isUnknownDefault?: boolean
    /** 売上系のデフォルト税区分フラグ（新規売上科目のデフォルト。マスタで1件のみtrue） */
    isSalesDefault?: boolean
    /** 仕入系のデフォルト税区分フラグ（新規仕入科目のデフォルト。マスタで1件のみtrue） */
    isPurchaseDefault?: boolean
    /** デフォルト順復元用: コピー/追加時の挿入位置直前の行ID */
    insertAfter?: string
    /** 課税方式別の表示可否（バックエンドで判定済み。読み取り専用） */
    visibleIn?: {
      proportional: boolean
      individual: boolean
      simplified: boolean
      exempt: boolean
    }
    /** 表示用税率文字列（バックエンドで生成。読み取り専用）例: "10%", "7.8%", "-" */
    displayRate?: string
}

/**
 * 税区分名から税率文字列を抽出するユーティリティ
 * UIの税率列表示に使用。ドメインロジックには使用しないこと。
 *
 * @example extractRateFromName('課税仕入 10%') // '10%'
 * @example extractRateFromName('非課税仕入')    // ''
 */
export function extractRateFromName(name: string): string {
    const match = name.match(/[\d.]+%/)
    return match ? match[0] : ''
}

/**
 * MF税区分名から取引区分（direction）を推定する
 *
 * 消費税法の法定用語に基づいて判定:
 * - 「売上」「輸出」を含む → sales
 * - 「仕入」「輸入」「特定課税」を含む → purchase
 * - それ以外（「対象外」「不明」等）→ common
 *
 * 税制改正で新税率（0%/7%等）が追加されても、
 * 法定用語は変わらないため安全に動作する。
 */
export function guessDirectionFromName(name: string): TaxDirection {
    if (name.includes('売上') || name.includes('輸出')) return 'sales'
    if (name.includes('仕入') || name.includes('輸入') || name.includes('特定課税')) return 'purchase'
    return 'common'
}

/**
 * MF税区分名から適格判定対象（qualified）を推定する
 *
 * 適格判定対象 = インボイス登録番号の確認が必要な税区分。
 * 仕入側の課税取引のみが対象。
 *
 * @param name MF税区分名
 * @param direction guessDirectionFromNameで推定した取引区分
 */
export function guessQualifiedFromName(name: string, direction: TaxDirection): boolean {
    if (direction !== 'purchase') return false
    if (name.includes('非課税仕入') || name.includes('対象外仕入')) return false
    return name.includes('課税仕入') || name.includes('輸入仕入') || name.includes('特定課税仕入')
}
