import type { ClientUi, TaxFilingTypeUi, ConsumptionTaxModeUi } from '@/types/ui.type';

// ヘルパー関数
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
        'mf': 'MF', // ラベル固定
        'other': 'その他'
    };
    return map[sw] || sw;
}

// 型安全防御ヘルパー
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
        // フォールバック
        return {
            clientId: 'UNKNOWN_ID',
            clientCode: 'Unknown',
            companyName: 'Unknown Client',
            repName: '',
            staffName: undefined,
            fiscalMonth: 1,
            type: 'corp',
            status: 'active',
            isActive: true,
            contact: { type: 'none', value: '' },
            driveLinks: { storage: '#', journalOutput: '#', journalExclusion: '#', pastJournals: '#' },

            // フォルダID
            sharedFolderId: '',
            processingFolderId: '',
            archivedFolderId: '',
            excludedFolderId: '',
            csvOutputFolderId: '',
            learningCsvFolderId: '',

            taxFilingType: 'blue',
            consumptionTaxMode: 'general',
            simplifiedTaxCategory: undefined,
            simplifiedTaxCategoryLabel: '特になし',
            defaultTaxRate: 10,
            taxMethod: 'inclusive',

            // 新規フィールド
            taxCalculationMethod: 'stack',
            isInvoiceRegistered: false,
            invoiceRegistrationNumber: '',
            roundingSettings: 'floor',

            accountingSoftware: 'other',
            driveLinked: false,

            fiscalMonthLabel: '1月決算',
            softwareLabel: 'その他',
            taxInfoLabel: '税込 / 発生',
            calculationMethodLabel: '発生主義',
            taxMethodLabel: '税込',
            calcMethodShortLabel: '発生',

            // 新規ラベル
            taxCalculationMethodLabel: '積上計算',
            invoiceRegistrationLabel: '無',
            roundingSettingsLabel: '切り捨て',
            typeLabel: '法人',
            taxFilingTypeLabel: '青色申告',
            actions: [
                { type: 'edit' as const, label: '編集', isEnabled: true },
                { type: 'delete' as const, label: '削除', isEnabled: false }
            ]
        };
    }

    const raw = api as Record<string, unknown>;

    // プリミティブの安全なマッピング
    const clientId = safeString(raw.clientId) || 'UNKNOWN_ID';
    const clientCode = safeString(raw.clientCode) || 'Unknown';
    const companyName = safeString(raw.companyName) || 'Unknown Client';
    const repName = safeString(raw.repName);
    const contactInfo = safeString(raw.contactInfo);

    // ロジック: 1-12の範囲保証
    let fiscalMonth = safeNumber(raw.fiscalMonth);
    if (fiscalMonth < 1 || fiscalMonth > 12) fiscalMonth = 1;

    // 列挙値
    const statusRaw = safeString(raw.status);
    const status = (statusRaw === 'active' || statusRaw === 'inactive' || statusRaw === 'suspension')
        ? statusRaw
        : 'active';

    const isActive = status === 'active';

    // 連絡先
    let contactType: 'email' | 'chatwork' | 'none' = 'none';
    if (contactInfo.includes('@')) contactType = 'email';
    else if (contactInfo.startsWith('http')) contactType = 'chatwork';

    const contact = {
        type: contactType,
        value: contactInfo
    };

    // フォルダ & Driveリンク
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

    // 税設定
    const taxTypeRaw = safeString(raw.taxFilingType);
    const taxFilingType = (['blue', 'white'].includes(taxTypeRaw) ? taxTypeRaw : 'blue') as TaxFilingTypeUi;

    const taxModeRaw = safeString(raw.consumptionTaxMode);
    const consumptionTaxMode = (['general', 'simplified', 'exempt'].includes(taxModeRaw) ? taxModeRaw : 'general') as ConsumptionTaxModeUi;

    const simplifiedTaxCategoryRaw = safeNumber(raw.simplifiedTaxCategory);
    const simplifiedTaxCategory = (
        [1, 2, 3, 4, 5, 6].includes(simplifiedTaxCategoryRaw) ? simplifiedTaxCategoryRaw : undefined
    ) as 1 | 2 | 3 | 4 | 5 | 6 | undefined;

    // safeNumber returns 0 for invalid, so 0 maps to '特になし' but in UI type it is undefined optional.
    // ラベルマッピング用:
    const simplifiedTaxCategoryLabel = mapSimplifiedTaxCategoryLabel(simplifiedTaxCategoryRaw);

    const defaultTaxRate = safeNumber(raw.defaultTaxRate);

    const taxMethodRaw = safeString(raw.taxMethod);
    const taxMethod = (['inclusive', 'exclusive'].includes(taxMethodRaw) ? taxMethodRaw : 'inclusive') as 'inclusive' | 'exclusive';

    const softRaw = safeString(raw.accountingSoftware);
    const accountingSoftware = (['yayoi', 'freee', 'mf', 'other'].includes(softRaw) ? softRaw : 'yayoi') as 'yayoi' | 'freee' | 'mf' | 'other';

    const driveLinked = Boolean(raw.driveLinked); // safeBoolean

    // 表示ラベル
    const softwareLabel = mapSoftwareLabel(accountingSoftware);

    // 計算方法
    const calcMethodRaw = safeString(raw.calculationMethod);
    let calculationMethodLabel = '発生主義'; // デフォルト
    if (calcMethodRaw === 'cash') calculationMethodLabel = '現金主義';
    if (calcMethodRaw === 'interim_cash') calculationMethodLabel = '期中現金主義';

    // 新規フィールドマッピング
    const typeRaw = safeString(raw.type);
    const type = (['corp', 'individual'].includes(typeRaw) ? typeRaw : 'corp') as 'corp' | 'individual';
    const typeLabel = type === 'corp' ? '法人' : '個人';

    const taxCalcMethodRaw = safeString(raw.taxCalculationMethod);
    const taxCalculationMethod = (['stack', 'back'].includes(taxCalcMethodRaw) ? taxCalcMethodRaw : 'stack') as 'stack' | 'back';
    const taxCalculationMethodLabel = taxCalculationMethod === 'stack' ? '積上計算' : '割戻計算';

    const isInvoiceRegistered = Boolean(raw.isInvoiceRegistered);
    const invoiceRegistrationNumber = safeString(raw.invoiceRegistrationNumber);
    const invoiceRegistrationLabel = isInvoiceRegistered ? '有' : '無';

    const roundingSettingsRaw = safeString(raw.roundingSettings);
    const roundingSettings = (['floor', 'round', 'ceil'].includes(roundingSettingsRaw) ? roundingSettingsRaw : 'floor') as 'floor' | 'round' | 'ceil';
    const roundingSettingsLabel = (() => {
        if (roundingSettings === 'floor') return '切り捨て';
        if (roundingSettings === 'round') return '四捨五入';
        if (roundingSettings === 'ceil') return '切り上げ';
        return '切り捨て';
    })();


    // 複合ラベル
    const shortCalc = calculationMethodLabel.replace('主義', '');
    const taxMethodLabel = taxMethod === 'inclusive' ? '税込' : '税抜';

    // フォーマット: "税込 / 発生"


    const taxInfoLabel = `${taxMethodLabel} / ${shortCalc}`;

    const staffNameVal = safeString(raw.staffName) || undefined;
    // taxFilingTypeLabel: 申告種類ラベル
    const taxFilingTypeLabel = taxFilingType === 'blue' ? '青色申告' : '白色申告';

    return {
        clientId,
        clientCode,
        companyName,
        repName,
        staffName: staffNameVal,
        type,
        fiscalMonth,
        status,

        isActive,
        contact,
        driveLinks,

        // フォルダID（編集用に生値保持）
        sharedFolderId, processingFolderId, archivedFolderId, excludedFolderId, csvOutputFolderId, learningCsvFolderId,

        // 税生データ
        taxFilingType,
        consumptionTaxMode,
        simplifiedTaxCategory,
        defaultTaxRate,
        taxMethod,

        // 新規フィールド
        taxCalculationMethod,
        isInvoiceRegistered,
        invoiceRegistrationNumber,
        roundingSettings,

        accountingSoftware,
        driveLinked,

        // ラベル
        fiscalMonthLabel: mapFiscalMonthLabel(fiscalMonth),
        simplifiedTaxCategoryLabel,
        softwareLabel,
        taxInfoLabel,
        calculationMethodLabel,

        taxMethodLabel,
        calcMethodShortLabel: shortCalc,

        // 新規ラベル
        taxCalculationMethodLabel,
        invoiceRegistrationLabel,
        roundingSettingsLabel,
        typeLabel,
        taxFilingTypeLabel,  // 青色申告 / 白色申告

        // アクション
        actions: [
            { type: 'edit' as const, label: '編集', isEnabled: true },
            { type: 'delete' as const, label: '削除', isEnabled: status === 'active' }
        ]
    };
}
