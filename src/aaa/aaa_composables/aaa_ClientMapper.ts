import type { ClientApi } from '@/aaa/aaa_types/aaa_zod.type';
import type { ClientUi, TaxFilingTypeUi, ConsumptionTaxModeUi } from '@/aaa/aaa_types/aaa_ui.type';

// Helpers
function mapSimplifiedTaxCategoryLabel(category: number): string {
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

function mapFiscalMonthLabel(month: number): string {
    const m = Math.max(1, Math.min(12, month || 1));
    return `${m}月決算`;
}

function mapSoftwareLabel(sw: string): string {
    const map: Record<string, string> = {
        'freee': 'freee',
        'yayoi': '弥生会計',
        'mf': 'マネーフォワード',
        'other': 'その他'
    };
    return map[sw] || sw;
}

// Helpers for Ironclad Defense
const safeString = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    return String(val); // "123", "true", "NaN"
};

const safeNumber = (val: unknown): number => {
    if (typeof val === 'number') {
        if (Number.isNaN(val) || !Number.isFinite(val)) return 0;
        return val;
    }
    const parsed = Number(val);
    if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return 0;
    return parsed;
};

export function mapClientApiToUi(api: unknown): ClientUi {
    // 1. Guard: Check if input is object
    if (!api || typeof api !== 'object') {
        // Fallback for null/undefined/primitive inputs
        // Returns a safe "Empty" ClientUi object
        return {
            clientCode: 'Unknown',
            companyName: 'Unknown Client',
            repName: '',
            contactInfo: '',
            fiscalMonth: 1,
            status: 'active',
            isActive: true,
            contact: { type: 'none', value: '' },
            driveLinks: { storage: '#', journalOutput: '#', journalExclusion: '#', pastJournals: '#' },
            sharedFolderId: '', processingFolderId: '', archivedFolderId: '', excludedFolderId: '', csvOutputFolderId: '', learningCsvFolderId: '',
            taxFilingType: 'blue',
            consumptionTaxMode: 'general',
            simplifiedTaxCategory: 0,
            simplifiedTaxCategoryLabel: '特になし',
            defaultTaxRate: 10,
            accountingSoftware: 'other',
            driveLinked: false,
            fiscalMonthLabel: '1月決算',
            softwareLabel: 'その他',
            taxInfoLabel: '税込 / 切捨'
        };
    }

    const raw = api as Record<string, unknown>;

    // Primitives with Safe Mapping
    const clientCode = safeString(raw.clientCode) || 'Unknown';
    const companyName = safeString(raw.companyName) || 'Unknown Client';
    const repName = safeString(raw.repName);
    const contactInfo = safeString(raw.contactInfo);

    // Logic: Ensure 1-12
    let fiscalMonth = safeNumber(raw.fiscalMonth);
    if (fiscalMonth < 1 || fiscalMonth > 12) fiscalMonth = 1;

    // Enums
    const statusRaw = safeString(raw.status);
    const status = (statusRaw === 'active' || statusRaw === 'inactive' || statusRaw === 'suspension')
        ? statusRaw
        : 'active';

    const isActive = status === 'active';

    // Contact
    let contactType: 'email' | 'chatwork' | 'none' = 'none';
    if (contactInfo.includes('@')) contactType = 'email';
    else if (contactInfo.startsWith('http')) contactType = 'chatwork';

    const contact = {
        type: contactType,
        value: contactInfo
    };

    // Folders & Drive Links
    const sharedFolderId = safeString(raw.sharedFolderId);
    const processingFolderId = safeString(raw.processingFolderId);
    const archivedFolderId = safeString(raw.archivedFolderId);
    const excludedFolderId = safeString(raw.excludedFolderId);
    const csvOutputFolderId = safeString(raw.csvOutputFolderId);
    const learningCsvFolderId = safeString(raw.learningCsvFolderId);

    const driveLinks = {
        storage: sharedFolderId ? `https://drive.google.com/drive/folders/${sharedFolderId}` : '#',
        journalOutput: csvOutputFolderId ? `https://drive.google.com/drive/folders/${csvOutputFolderId}` : '#',
        journalExclusion: excludedFolderId ? `https://drive.google.com/drive/folders/${excludedFolderId}` : '#',
        pastJournals: archivedFolderId ? `https://drive.google.com/drive/folders/${archivedFolderId}` : '#'
    };

    // Tax Settings
    const taxTypeRaw = safeString(raw.taxFilingType);
    const taxFilingType = (['blue', 'white'].includes(taxTypeRaw) ? taxTypeRaw : 'blue') as TaxFilingTypeUi;

    const taxModeRaw = safeString(raw.consumptionTaxMode);
    const consumptionTaxMode = (['general', 'simplified', 'exempt'].includes(taxModeRaw) ? taxModeRaw : 'general') as ConsumptionTaxModeUi;

    // Simplified Tax Category Logic
    const simplifiedTaxCategory = safeNumber(raw.simplifiedTaxCategory);
    const simplifiedTaxCategoryLabel = mapSimplifiedTaxCategoryLabel(simplifiedTaxCategory);

    const defaultTaxRate = safeNumber(raw.defaultTaxRate); // Could clamp to 0, 8, 10 if needed

    const softRaw = safeString(raw.accountingSoftware);
    const accountingSoftware = (['yayoi', 'freee', 'mf', 'other'].includes(softRaw) ? softRaw : 'yayoi') as 'yayoi' | 'freee' | 'mf' | 'other';

    const driveLinked = Boolean(raw.driveLinked); // safeBoolean

    // Display Labels
    const softwareLabel = mapSoftwareLabel(accountingSoftware);
    const taxInfoLabel = '税込 / 切捨';

    return {
        clientCode,
        companyName,
        repName,
        contactInfo,
        fiscalMonth,
        status,

        isActive,
        contact,
        driveLinks,

        sharedFolderId,
        processingFolderId,
        archivedFolderId,
        excludedFolderId,
        csvOutputFolderId,
        learningCsvFolderId,

        taxFilingType,
        consumptionTaxMode,
        simplifiedTaxCategory,
        simplifiedTaxCategoryLabel,
        defaultTaxRate,

        accountingSoftware,
        driveLinked,

        fiscalMonthLabel: mapFiscalMonthLabel(fiscalMonth),
        softwareLabel,
        taxInfoLabel
    };
}
