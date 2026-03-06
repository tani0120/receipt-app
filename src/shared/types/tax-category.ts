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
