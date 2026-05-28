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
    id: string
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
    /** 新規利用可否（廃止時はfalse。削除禁止） */
    active: boolean
    /** 非推奨フラグ（true=グレーアウト表示。物理削除禁止 → ルール3。active=falseと連動） */
    deprecated: boolean
    /** 適用開始日（ISO 8601形式。例: '2019-10-01'） */
    effectiveFrom: string
    /** 適用終了日（null=現役。旧税率は日付を設定 → ルール1） */
    effectiveTo: string | null
    /** デフォルト表示（27件=true） */
    defaultVisible: boolean
    /** 表示順（CSV並び順と一致） */
    displayOrder: number
    /** カスタム税区分フラグ（ユーザー追加=true、システム提供=false/undefined → ルール4） */
    isCustom?: boolean
    /** データ出典（'mf'=MFインポート、'default'=システム提供、'master'/'master-custom'=マスタ、'custom'/'client-custom'=顧問先独自） */
    source?: 'mf' | 'master' | 'custom' | 'default' | 'master-custom' | 'client-custom'
    /** MFクラウドの税区分ID（MFインポート時にセット。名称変更時の突合に使用） */
    mfId?: string
    /** 税率（MFインポート時にセット。0.10 = 10%。UI表示用。税額計算はMFに委譲） */
    taxRate?: number
    /** デフォルト順復元用: コピー/追加時の挿入位置直前の行ID */
    insertAfter?: string
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
