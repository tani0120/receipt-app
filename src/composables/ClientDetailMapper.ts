import type { ClientDetailUi, DriveLinkUi } from '@/types/ui.type';
import { mapClientApiToUi } from './ClientMapper';


// Ironclad Helpers
const safeString = (val: unknown, fallback = ''): string => {
    if (typeof val === 'string') return val;
    if (val === null || val === undefined) return fallback;
    return String(val);
};

const safeNumber = (val: unknown, fallback = 0): number => {
    if (typeof val === 'number' && !Number.isNaN(val)) return val;
    const p = Number(val);
    if (!Number.isNaN(p)) return p;
    return fallback;
};

export function mapClientDetailApiToUi(api: unknown): ClientDetailUi {
    // 1. Reuse List Mapper for base properties
    const baseUi = mapClientApiToUi(api);
    const raw = (api && typeof api === 'object') ? (api as Record<string, unknown>) : {};

    // 2. Drive Links Logic
    const makeLink = (title: string, id: unknown, color: string): DriveLinkUi => {
        const folderId = safeString(id);
        return {
            title,
            path: folderId ? `gdrive/folders/${folderId.slice(0, 10)}...` : '未連携',
            url: folderId ? `https://drive.google.com/drive/folders/${folderId}` : '#',
            iconColorClass: color,
            isLinked: !!folderId
        };
    };

    const driveFolderLinks: DriveLinkUi[] = [
        makeLink('顧客共有フォルダ', raw.sharedFolderId, 'text-yellow-400'),
        makeLink('仕訳CSV出力先', raw.csvOutputFolderId, 'text-blue-400'),
        makeLink('仕訳除外しフォルダ', raw.excludedFolderId, 'text-gray-400'),
        makeLink('過去仕訳・学習データ', raw.archivedFolderId, 'text-purple-400')
    ];

    // 3. Tax & Accounting Labels
    // Re-use logic from baseUi where possible, or enhance it.

    // consumptionTaxModeLabel is not in baseUi, so keep logic but fix it to use raw or base
    const consumptionTaxModeLabel = (raw.consumptionTaxMode === 'simplified') ? '簡易課税'
        : (raw.consumptionTaxMode === 'exempt') ? '免税'
            : '原則課税';

    // baseUi already has taxMethodLabel ('税込' / '税抜') but detail might want Explicit '税込経理'
    const taxMethodExplicitLabel = (baseUi.taxMethod === 'exclusive') ? '税抜経理' : '税込経理';

    // fractionAdjustmentLabel -> Use baseUi.roundingSettingsLabel
    const fractionAdjustmentLabel = baseUi.roundingSettingsLabel;

    const defaultTaxRateLabel = safeNumber(raw.defaultTaxRate, 10) + '%';

    // Warning logic: if mode is simplified but category is missing (0 or undefined)
    const hasSimplifiedTaxWarning = (baseUi.consumptionTaxMode === 'simplified' && !baseUi.simplifiedTaxCategory);

    const simplifiedTaxCategoryMessage = hasSimplifiedTaxWarning
        ? '現在、簡易課税のみなし仕入率は設定されていません。'
        : (baseUi.simplifiedTaxCategory ? `第${baseUi.simplifiedTaxCategory}種` : '設定なし');

    // 4. Mock Statistics (In real app, this might come from a separate specialized API or be calculated)
    const stats = {
        collectionRate: safeNumber(raw.collectionRate, 85),
        journalEntryRate: safeNumber(raw.journalEntryRate, 60),
        infoPendingCount: safeNumber(raw.infoPendingCount, 3)
    };

    // 5. Build Final UI Object
    return {
        ...baseUi,
        healthScore: 92, // Mock or calculated
        healthScoreLabel: 'A / 92',

        consumptionTaxModeLabel,
        taxMethodExplicitLabel,
        fractionAdjustmentLabel,
        defaultTaxRateLabel,
        simplifiedTaxCategoryMessage,
        hasSimplifiedTaxWarning,

        driveFolderLinks,

        stats,
        recentActivities: [
            // Mock activity log for visualization stability
            {
                icon: 'fa-file-invoice',
                iconColorClass: 'text-blue-500',
                title: '領収書アップロード',
                dateLabel: '2025/12/26 14:30'
            },
            {
                icon: 'fa-message',
                iconColorClass: 'text-red-500',
                title: '不明点の質問送信',
                dateLabel: '2025/12/25 18:00'
            },
            {
                icon: 'fa-check',
                iconColorClass: 'text-green-500',
                title: '通帳データ連携完了',
                dateLabel: '2025/12/25 10:00'
            }
        ]
    };
}
