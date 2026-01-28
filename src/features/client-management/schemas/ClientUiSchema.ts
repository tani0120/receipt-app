import { z } from 'zod';

/**
 * ClientUiSchema - Screen A UI表示用スキーマ
 * Week 3: 型安全なUI実装のための完全なスキーマ定義
 *
 * 原則：
 * - 全フィールド必須（no optional）
 * - readonly想定（UIで表示のみ）
 * - ラベル等の表示用フィールドを含む
 */
export const ClientUiSchema = z.object({
    // 基本情報
    clientCode: z.string(),
    companyName: z.string(),
    companyNameKana: z.string(),
    type: z.enum(['corp', 'individual']),
    typeLabel: z.string(), // 「法人」「個人」
    repName: z.string(),
    repNameKana: z.string(),
    staffName: z.string(),

    // 連絡情報
    contact: z.object({
        type: z.enum(['email', 'chatwork', 'none']).optional(),
        value: z.string().optional()
    }),
    phoneNumber: z.string(),

    // 決算情報
    fiscalMonth: z.number(),
    fiscalMonthLabel: z.string(), // 「3月決算」
    establishedDate: z.string(), // YYYYMMDD
    status: z.enum(['active', 'inactive', 'suspension']),
    statusLabel: z.string(), // 「稼働中」等

    // Drive連携
    driveLinked: z.boolean(),
    sharedFolderId: z.string(),
    processingFolderId: z.string(),
    archivedFolderId: z.string(),
    excludedFolderId: z.string(),
    csvOutputFolderId: z.string(),
    learningCsvFolderId: z.string(),

    // 税務設定
    taxFilingType: z.enum(['blue', 'white']),
    taxFilingTypeLabel: z.string(), // 「青色申告」
    consumptionTaxMode: z.enum(['general', 'simplified', 'exempt']),
    consumptionTaxModeLabel: z.string(),
    simplifiedTaxCategory: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.string()]),
    simplifiedTaxCategoryLabel: z.string(),
    defaultTaxRate: z.number(),
    taxMethod: z.enum(['inclusive', 'exclusive']),
    taxMethodLabel: z.string(),
    taxCalculationMethod: z.enum(['stack', 'back']),
    taxCalculationMethodLabel: z.string(),
    isInvoiceRegistered: z.boolean(),
    invoiceRegistrationLabel: z.string(),
    invoiceRegistrationNumber: z.string(),
    roundingSettings: z.enum(['floor', 'round', 'ceil']),
    roundingSettingsLabel: z.string(),

    // 会計設定
    accountingSoftware: z.enum(['yayoi', 'freee', 'mf', 'tkc', 'other']),
    softwareLabel: z.string(), // 「弥生会計」
    aiKnowledgePrompt: z.string(),
    defaultPaymentMethod: z.enum(['cash', 'owner_loan', 'accounts_payable']),
    defaultPaymentMethodLabel: z.string(),
    calculationMethod: z.enum(['accrual', 'cash', 'interim_cash']),
    calculationMethodLabel: z.string(),
    calcMethodShortLabel: z.string(), // 「発生」「現金」
    hasDepartmentManagement: z.boolean(),

    // 報酬設定（Week 3新規）
    advisoryFee: z.number(),          // 顧問報酬（月額）
    bookkeepingFee: z.number(),       // 記帳代行（月額）
    settlementFee: z.number(),        // 決算報酬（年次）
    taxFilingFee: z.number(),         // 消費税申告報酬（年次）

    // 自動算出フィールド（Week 3新規）
    monthlyTotalFee: z.number(),      // 月次報酬合計
    annualTotalFee: z.number(),       // 年間総報酬

    // その他
    updatedAt: z.string(), // ISO 8601
    isNew: z.boolean(),
    filingCount: z.number(),

    // UI用追加フィールド
    taxInfoLabel: z.string(), // 税務情報の統合ラベル
});

export type ClientUi = z.infer<typeof ClientUiSchema>;
