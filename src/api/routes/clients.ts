
import { Hono } from 'hono'
import { z } from 'zod'

const app = new Hono()

// --- 1. Zod Schemas (BFF Layer) ---

// Helpers for Logic
const mapSimplifiedTaxCategoryLabel = (category: number): string => {
    const map: Record<number, string> = {
        0: '特になし',
        1: '第1種',
        2: '第2種',
        3: '第3種',
        4: '第4種',
        5: '第5種',
        6: '第6種'
    };
    return map[category] || '不明';
}

const mapFiscalMonthLabel = (month: number): string => {
    const m = Math.max(1, Math.min(12, month || 1));
    return `${m}月決算`;
}

const mapSoftwareLabel = (sw: string): string => {
    const map: Record<string, string> = {
        'freee': 'freee',
        'yayoi': '弥生会計',
        'mf': 'MF',
        'other': 'その他'
    };
    return map[sw] || sw;
}

// Client Schema (Strict Output Definition)
const ClientUiSchema = z.object({
    clientCode: z.string().default('Unknown'),
    companyName: z.string().default('Unknown Client'),
    repName: z.string().default(''),
    staffName: z.string().default(''),
    type: z.enum(['corp', 'individual']).default('corp'),
    fiscalMonth: z.number().int().min(1).max(12).default(1),
    status: z.enum(['active', 'inactive', 'suspension']).default('active'),
    isActive: z.boolean().default(true),

    contact: z.object({
        type: z.enum(['email', 'chatwork', 'none']).default('none'),
        value: z.string().default('')
    }),

    driveLinks: z.object({
        storage: z.string().default('#'),
        journalOutput: z.string().default('#'),
        journalExclusion: z.string().default('#'),
        pastJournals: z.string().default('#')
    }),

    // IDs
    sharedFolderId: z.string().default(''),
    processingFolderId: z.string().default(''),
    archivedFolderId: z.string().default(''),
    excludedFolderId: z.string().default(''),
    csvOutputFolderId: z.string().default(''),
    learningCsvFolderId: z.string().default(''),

    // Tax Settings
    taxFilingType: z.enum(['blue', 'white']).default('blue'),
    consumptionTaxMode: z.enum(['general', 'simplified', 'exempt']).default('general'),
    simplifiedTaxCategory: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]).optional(),
    defaultTaxRate: z.number().default(10),
    taxMethod: z.enum(['inclusive', 'exclusive']).default('inclusive'),

    // New Fields
    taxCalculationMethod: z.enum(['stack', 'back']).default('stack'),
    isInvoiceRegistered: z.boolean().default(false),
    invoiceRegistrationNumber: z.string().default(''),
    roundingSettings: z.enum(['floor', 'round', 'ceil']).default('floor'),
    accountingSoftware: z.enum(['yayoi', 'freee', 'mf', 'other']).default('other'),
    driveLinked: z.boolean().default(false),

    // Labels
    fiscalMonthLabel: z.string(),
    simplifiedTaxCategoryLabel: z.string(),
    softwareLabel: z.string(),
    taxInfoLabel: z.string(),
    calculationMethodLabel: z.string(),
    taxMethodLabel: z.string(),
    calcMethodShortLabel: z.string(),
    taxCalculationMethodLabel: z.string(),
    invoiceRegistrationLabel: z.string(),
    roundingSettingsLabel: z.string(),
    typeLabel: z.string()
})

// --- 2. BFF Route ---
const route = app.get('/', (c) => {
    // Mock Data from DB (Simulating raw DB response)
    const rawClients = [
        {
            clientCode: 'CLI001',
            companyName: '株式会社エーアイシステム',
            repName: '山田 太郎',
            fiscalMonth: 3,
            status: 'active',
            contactInfo: 'yamada@example.com',
            accountingSoftware: 'freee',
            taxFilingType: 'blue',
            consumptionTaxMode: 'general',
            isInvoiceRegistered: true,
            invoiceRegistrationNumber: 'T1234567890123'
        },
        {
            clientCode: 'CLI002',
            companyName: '合同会社テックイノベーション',
            repName: '鈴木 次郎',
            fiscalMonth: 12,
            status: 'active',
            contactInfo: 'https://chatwork.com/g/12345',
            accountingSoftware: 'yayoi',
            taxFilingType: 'blue',
            consumptionTaxMode: 'simplified',
            simplifiedTaxCategory: 3,
            isInvoiceRegistered: false
        },
        {
            clientCode: 'CLI999',
            companyName: '（解約済みクライアント）',
            status: 'inactive'
        }
    ];

    // Transformation Logic (Ported from ClientMapper.ts)
    const processedClients = rawClients.map((raw: any) => {
        const fiscalMonth = Math.max(1, Math.min(12, raw.fiscalMonth || 1));
        const software = raw.accountingSoftware || 'other';
        const taxMethod = raw.taxMethod === 'exclusive' ? 'exclusive' : 'inclusive';
        const taxMethodLabel = taxMethod === 'inclusive' ? '税込' : '税抜';
        const calculationMethodLabel = raw.calculationMethod === 'cash' ? '現金主義' : '発生主義';
        const shortCalc = calculationMethodLabel.replace('主義', '');

        // Contact Type Logic
        let contactType = 'none';
        if ((raw.contactInfo || '').includes('@')) contactType = 'email';
        else if ((raw.contactInfo || '').startsWith('http')) contactType = 'chatwork';

        // Simplified Tax
        const simpTaxRaw = raw.simplifiedTaxCategory || 0;
        const simplifiedTaxCategory = [1, 2, 3, 4, 5, 6].includes(simpTaxRaw) ? simpTaxRaw : undefined;

        // Rounding
        const rounding = raw.roundingSettings || 'floor';
        const roundingLabel = rounding === 'round' ? '四捨五入' : (rounding === 'ceil' ? '切り上げ' : '切り捨て');

        // Logic: Drive Links (Mock for now)
        const driveLinks = {
            storage: '#',
            journalOutput: '#',
            journalExclusion: '#',
            pastJournals: '#'
        };

        return {
            clientCode: raw.clientCode,
            companyName: raw.companyName,
            repName: raw.repName || '',
            staffName: raw.staffName || '',
            type: raw.type || 'corp',
            fiscalMonth: fiscalMonth,
            status: raw.status || 'active',
            isActive: raw.status !== 'inactive' && raw.status !== 'suspension',
            contact: {
                type: contactType as 'email' | 'chatwork' | 'none',
                value: raw.contactInfo || ''
            },

            driveLinks,

            accountingSoftware: software,
            taxFilingType: raw.taxFilingType || 'blue',
            consumptionTaxMode: raw.consumptionTaxMode || 'general',
            simplifiedTaxCategory,
            defaultTaxRate: raw.defaultTaxRate || 10,
            taxMethod: taxMethod,

            isInvoiceRegistered: Boolean(raw.isInvoiceRegistered),
            invoiceRegistrationNumber: raw.invoiceRegistrationNumber || '',

            // New Fields that might be missing in raw
            taxCalculationMethod: raw.taxCalculationMethod || 'stack',
            roundingSettings: rounding,
            driveLinked: Boolean(raw.driveLinked),

            // Labels
            fiscalMonthLabel: mapFiscalMonthLabel(fiscalMonth),
            simplifiedTaxCategoryLabel: mapSimplifiedTaxCategoryLabel(simpTaxRaw),
            softwareLabel: mapSoftwareLabel(software),
            taxInfoLabel: `${taxMethodLabel} / ${shortCalc}`,
            calculationMethodLabel,
            taxMethodLabel,
            calcMethodShortLabel: shortCalc,
            taxCalculationMethodLabel: raw.taxCalculationMethod === 'back' ? '割戻計算' : '積上計算',
            invoiceRegistrationLabel: raw.isInvoiceRegistered ? '有' : '無',
            roundingSettingsLabel: roundingLabel,
            typeLabel: raw.type === 'individual' ? '個人' : '法人',

            // ID Placeholders
            sharedFolderId: '',
            processingFolderId: '',
            archivedFolderId: '',
            excludedFolderId: '',
            csvOutputFolderId: '',
            learningCsvFolderId: ''
        };
    });

    // Final Validation
    const validated = z.array(ClientUiSchema).parse(processedClients);
    return c.json(validated);
})

export default route
