import { z } from 'zod';

/**
 * ClientFormSchema - Screen A フォーム入力用スキーマ
 * Week 3: 型安全なフォーム実装のためのスキーマ
 *
 * 原則：
 * - 入力可能なフィールドのみ定義
 * - バリデーションルールを含む
 * - 自動算出フィールドは含まない（UIで算出）
 */
export const ClientFormSchema = z.object({
    // 基本情報
    clientCode: z.string()
        .length(3, '3文字で入力してください')
        .regex(/^[A-Z]{3}$/, '大文字アルファベット3文字で入力してください'),
    companyName: z.string().min(1, '会社名は必須です'),
    companyNameKana: z.string().optional(),
    type: z.enum(['corp', 'individual']).default('corp'),
    repName: z.string().optional(),
    repNameKana: z.string().optional(),
    staffName: z.string().optional(),

    // 連絡情報
    contact: z.object({
        type: z.enum(['email', 'chatwork', 'none']).default('none'),
        value: z.string().optional()
    }).optional(),
    phoneNumber: z.string().optional(),

    // 決算情報
    fiscalMonth: z.number().int().min(1).max(12).default(3),
    establishedDate: z.string()
        .regex(/^\d{8}$/, 'YYYYMMDD形式で入力してください')
        .optional(),
    status: z.enum(['active', 'inactive', 'suspension']).default('active'),

    // Drive連携（通常は自動生成、フォームでは編集不可想定）
    sharedFolderId: z.string().default(''),
    processingFolderId: z.string().default(''),
    archivedFolderId: z.string().default(''),
    excludedFolderId: z.string().default(''),
    csvOutputFolderId: z.string().default(''),
    learningCsvFolderId: z.string().default(''),
    driveLinked: z.boolean().default(false),

    // 税務設定
    taxFilingType: z.enum(['blue', 'white']).default('blue'),
    consumptionTaxMode: z.enum(['general', 'simplified', 'exempt']).default('general'),
    simplifiedTaxCategory: z.union([
        z.literal(1), z.literal(2), z.literal(3),
        z.literal(4), z.literal(5), z.literal(6)
    ]).optional(),
    defaultTaxRate: z.number().min(0).max(100).optional(),
    taxMethod: z.enum(['inclusive', 'exclusive']).default('inclusive'),
    taxCalculationMethod: z.enum(['stack', 'back']).optional(),
    isInvoiceRegistered: z.boolean().default(false),
    invoiceRegistrationNumber: z.string().optional(),
    roundingSettings: z.enum(['floor', 'round', 'ceil']).optional(),

    // 会計設定
    accountingSoftware: z.enum(['yayoi', 'freee', 'mf', 'tkc', 'other']).default('freee'),
    aiKnowledgePrompt: z.string().optional(),
    defaultPaymentMethod: z.enum(['cash', 'owner_loan', 'accounts_payable']).default('cash'),
    calculationMethod: z.enum(['accrual', 'cash', 'interim_cash']).default('accrual'),
    hasDepartmentManagement: z.boolean().default(false),

    // 報酬設定（Week 3新規）
    advisoryFee: z.number().min(0, '0以上の数値を入力してください').default(0),
    bookkeepingFee: z.number().min(0, '0以上の数値を入力してください').default(0),
    settlementFee: z.number().min(0, '0以上の数値を入力してください').default(0),
    taxFilingFee: z.number().min(0, '0以上の数値を入力してください').default(0),

    // 自動算出フィールド（フォームには含まれない）
    // monthlyTotalFee: UIで算出
    // annualTotalFee: UIで算出

    // その他
    isNew: z.boolean().optional(),
    filingCount: z.number().optional(),
});

export type ClientForm = z.infer<typeof ClientFormSchema>;
