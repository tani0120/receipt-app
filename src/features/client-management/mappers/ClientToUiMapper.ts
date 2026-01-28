import { ClientSchemaWithMigration } from '@/types/zod_schema';
import { ClientUiSchema } from '../schemas/ClientUiSchema';
import type { z } from 'zod';

type ClientSource = z.infer<typeof ClientSchemaWithMigration>;
type ClientUi = z.infer<typeof ClientUiSchema>;

/**
 * ClientToUiMapper - 型安全なClientデータ変換
 * Week 3: ADR-001準拠の型安全Mapper
 *
 * 機能：
 * - Firestore（ClientSchemaWithMigration）→ UI（ClientUiSchema）
 * - 全フィールドの型安全な変換
 * - 自動算出フィールド（月次・年間報酬）の計算
 * - ラベル生成
 */
export class ClientToUiMapper {
    /**
     * Clientデータを型安全に変換
     */
    static map(source: ClientSource): ClientUi {
        // ラベル生成ヘルパー
        const getTypeLabel = (type?: 'corp' | 'individual') =>
            type === 'corp' ? '法人' : '個人';

        const getStatusLabel = (status: 'active' | 'inactive' | 'suspension') => {
            const labels = {
                active: '稼働中',
                inactive: '停止中',
                suspension: '休眠中'
            };
            return labels[status] || '不明';
        };

        const getTaxFilingLabel = (type: 'blue' | 'white') =>
            type === 'blue' ? '青色申告' : '白色申告';

        const getConsumptionTaxLabel = (mode: 'general' | 'simplified' | 'exempt') => {
            const labels = {
                general: '原則課税',
                simplified: '簡易課税',
                exempt: '免税'
            };
            return labels[mode] || '不明';
        };

        const getSoftwareLabel = (software: 'yayoi' | 'freee' | 'mf' | 'tkc' | 'other') => {
            const labels = {
                yayoi: '弥生会計',
                freee: 'freee',
                mf: 'マネーフォワード',
                tkc: 'TKC',
                other: 'その他'
            };
            return labels[software] || '不明';
        };

        const getPaymentMethodLabel = (method?: 'cash' | 'owner_loan' | 'accounts_payable') => {
            const labels = {
                cash: '現金',
                owner_loan: '社長借入金',
                accounts_payable: '未払金'
            };
            return labels[method || 'cash'];
        };

        const getCalculationMethodLabel = (method?: 'accrual' | 'cash' | 'interim_cash') => {
            const labels = {
                accrual: '発生主義',
                cash: '現金主義',
                interim_cash: '期中現金主義'
            };
            return labels[method || 'accrual'];
        };

        // 報酬計算
        const advisoryFee = source.advisoryFee || 0;
        const bookkeepingFee = source.bookkeepingFee || 0;
        const settlementFee = source.settlementFee || 0;
        const taxFilingFee = source.taxFilingFee || 0;

        const monthlyTotalFee = advisoryFee + bookkeepingFee;
        const annualTotalFee = advisoryFee * 12 + bookkeepingFee * 12 + settlementFee + taxFilingFee;

        // 型安全な変換
        const result: ClientUi = {
            // 基本情報
            clientCode: source.clientCode,
            companyName: source.companyName,
            companyNameKana: source.companyNameKana || '',
            type: source.type || 'corp',
            typeLabel: getTypeLabel(source.type),
            repName: source.repName || '',
            repNameKana: source.repNameKana || '',
            staffName: source.staffName || '',

            // 連絡情報
            contact: source.contact || { type: 'none', value: '' },
            phoneNumber: source.phoneNumber || '',

            // 決算情報
            fiscalMonth: source.fiscalMonth,
            fiscalMonthLabel: `${source.fiscalMonth}月決算`,
            establishedDate: source.establishedDate || '',
            status: source.status,
            statusLabel: getStatusLabel(source.status),

            // Drive連携
            driveLinked: source.driveLinked,
            sharedFolderId: source.sharedFolderId,
            processingFolderId: source.processingFolderId,
            archivedFolderId: source.archivedFolderId,
            excludedFolderId: source.excludedFolderId,
            csvOutputFolderId: source.csvOutputFolderId,
            learningCsvFolderId: source.learningCsvFolderId,

            // 税務設定
            taxFilingType: source.taxFilingType,
            taxFilingTypeLabel: getTaxFilingLabel(source.taxFilingType),
            consumptionTaxMode: source.consumptionTaxMode,
            consumptionTaxModeLabel: getConsumptionTaxLabel(source.consumptionTaxMode),
            simplifiedTaxCategory: source.simplifiedTaxCategory || '',
            simplifiedTaxCategoryLabel: source.simplifiedTaxCategory ? `第${source.simplifiedTaxCategory}種` : '',
            defaultTaxRate: source.defaultTaxRate || 10,
            taxMethod: source.taxMethod || 'inclusive',
            taxMethodLabel: source.taxMethod === 'exclusive' ? '税抜' : '税込',
            taxCalculationMethod: source.taxCalculationMethod || 'stack',
            taxCalculationMethodLabel: source.taxCalculationMethod === 'back' ? '割戻方式' : '積上方式',
            isInvoiceRegistered: source.isInvoiceRegistered || false,
            invoiceRegistrationLabel: source.isInvoiceRegistered ? '登録済' : '未登録',
            invoiceRegistrationNumber: source.invoiceRegistrationNumber || '',
            roundingSettings: source.roundingSettings || 'floor',
            roundingSettingsLabel: source.roundingSettings === 'round' ? '四捨五入' :
                source.roundingSettings === 'ceil' ? '切り上げ' : '切り捨て',

            // 会計設定
            accountingSoftware: source.accountingSoftware,
            softwareLabel: getSoftwareLabel(source.accountingSoftware),
            aiKnowledgePrompt: source.aiKnowledgePrompt || '',
            defaultPaymentMethod: source.defaultPaymentMethod || 'cash',
            defaultPaymentMethodLabel: getPaymentMethodLabel(source.defaultPaymentMethod),
            calculationMethod: source.calculationMethod || 'accrual',
            calculationMethodLabel: getCalculationMethodLabel(source.calculationMethod),
            calcMethodShortLabel: source.calculationMethod === 'cash' ? '現金' :
                source.calculationMethod === 'interim_cash' ? '期中現金' : '発生',
            hasDepartmentManagement: source.hasDepartmentManagement || false,

            // 報酬設定（Week 3新規）
            advisoryFee,
            bookkeepingFee,
            settlementFee,
            taxFilingFee,

            // 自動算出フィールド（Week 3新規）
            monthlyTotalFee,
            annualTotalFee,

            // その他
            updatedAt: source.updatedAt && typeof source.updatedAt === 'object' && 'toDate' in source.updatedAt
                ? source.updatedAt.toDate().toISOString()
                : new Date().toISOString(),
            isNew: source.isNew || false,
            filingCount: source.filingCount || 0,

            // UI用追加フィールド
            taxInfoLabel: `${getTaxFilingLabel(source.taxFilingType)}/${getConsumptionTaxLabel(source.consumptionTaxMode)}${source.simplifiedTaxCategory ? '第' + source.simplifiedTaxCategory + '種' : ''}`
        };

        // Zodで最終検証
        return ClientUiSchema.parse(result);
    }
}
