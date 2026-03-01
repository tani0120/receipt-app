/**
 * 簡易課税ルール
 *
 * みなし仕入率はTaxCategoryに持たせない。
 * 簡易課税の事業区分ごとのルールとして分離管理。
 */

/** 事業区分 */
export type BusinessType = 1 | 2 | 3 | 4 | 5 | 6

/** 簡易課税ルール */
export type SimpleTaxRule = {
    /** 事業区分（第一種〜第六種） */
    businessType: BusinessType
    /** 表示ラベル（例: 「第一種（卸売業）」） */
    label: string
    /** みなし仕入率（%） UI表示・顧問先設定用 */
    deemedRate: number
}

/** 簡易課税マスタ（不変） */
export const SIMPLE_TAX_RULES: readonly SimpleTaxRule[] = [
    { businessType: 1, label: '第一種（卸売業）', deemedRate: 90 },
    { businessType: 2, label: '第二種（小売業）', deemedRate: 80 },
    { businessType: 3, label: '第三種（製造業・建設業・農林水産業）', deemedRate: 70 },
    { businessType: 4, label: '第四種（飲食店・その他）', deemedRate: 60 },
    { businessType: 5, label: '第五種（サービス業・金融・運輸）', deemedRate: 50 },
    { businessType: 6, label: '第六種（不動産業）', deemedRate: 40 },
] as const
