import type { JournalStatusUi, JournalStatusStepUi, JournalStatusActionUi, StepStateUi } from '@/aaa/aaa_types/aaa_ScreenB_ui.type';
import type { JobUi } from '@/aaa/aaa_types/aaa_ui.type'; // Assuming input is current JobUi for now, or raw.

/**
 * 安全な文字列変換
 */
const safeString = (value: unknown, fallback: string = ''): string => {
    if (value === null || value === undefined) return fallback;
    return String(value);
};

/**
 * 安全な数値変換
 */
const safeNumber = (value: unknown, fallback: number = 0): number => {
    const num = Number(value);
    if (isNaN(num)) return fallback;
    return num;
};

/**
 * Screen B 用マッパー
 * @param raw - Domain layer entity or API response (Currently compatible with JobUi structure)
 */
export const mapJournalStatusApiToUi = (raw: any): JournalStatusUi => {
    // 防御的コーディング: raw が null/undefined の場合
    if (!raw) {
        return createEmptyJournalStatus();
    }

    return {
        id: safeString(raw.id, 'unknown_id'),
        rowStyle: safeString(raw.rowStyle, ''),

        clientName: safeString(raw.clientName, 'Unknown Client'),
        clientCode: safeString(raw.clientCode, '---'),
        priority: (raw.priority === 'high' || raw.priority === 'normal' || raw.priority === 'low') ? raw.priority : 'normal',
        softwareLabel: safeString(raw.softwareLabel, ''),
        fiscalMonthLabel: safeString(raw.fiscalMonthLabel, ''),
        status: raw.status || 'unknown', // Should ideally restrict to valid unions

        steps: {
            receipt: mapStep(raw.steps?.receipt),
            aiAnalysis: mapStep(raw.steps?.aiAnalysis),
            journalEntry: mapStep(raw.steps?.journalEntry),
            approval: mapStep(raw.steps?.approval),
            remand: mapStep(raw.steps?.remand),
            export: mapStep(raw.steps?.export),
            archive: mapStep(raw.steps?.archive),
        },

        primaryAction: mapAction(raw.primaryAction),
        nextAction: mapAction(raw.nextAction),

        // Drive Links - Mocking or extracting if available.
        // current JobUi doesn't explicitly have these per job, but ClientUi does.
        // For now, safe empty strings to prevent crash.
        driveLinks: {
            export: '',
            archive: ''
        }
    };
};

const mapStep = (rawIs: any): JournalStatusStepUi => {
    if (!rawIs) return { state: 'none', label: '', count: 0 };

    return {
        state: (['pending', 'processing', 'done', 'error', 'ready', 'none'].includes(rawIs.state) ? rawIs.state : 'none') as StepStateUi,
        label: safeString(rawIs.label),
        count: safeNumber(rawIs.count)
    };
};

const mapAction = (rawAc: any): JournalStatusActionUi => {
    if (!rawAc) return { type: 'none', label: '', isEnabled: false };

    const validTypes = ['rescue', 'work', 'approve', 'remand', 'export', 'archive', 'complete_all', 'none'];
    return {
        type: validTypes.includes(rawAc.type) ? rawAc.type : 'none',
        label: safeString(rawAc.label),
        isEnabled: !!rawAc.isEnabled
    };
};

const createEmptyJournalStatus = (): JournalStatusUi => ({
    id: 'unknown',
    rowStyle: '',
    clientName: 'Error Loading',
    clientCode: '',
    priority: 'normal',
    softwareLabel: '',
    fiscalMonthLabel: '',
    status: 'error',
    steps: {
        receipt: { state: 'none', label: '', count: 0 },
        aiAnalysis: { state: 'none', label: '', count: 0 },
        journalEntry: { state: 'none', label: '', count: 0 },
        approval: { state: 'none', label: '', count: 0 },
        remand: { state: 'none', label: '', count: 0 },
        export: { state: 'none', label: '', count: 0 },
        archive: { state: 'none', label: '', count: 0 },
    },
    primaryAction: { type: 'none', label: '', isEnabled: false },
    nextAction: { type: 'none', label: '', isEnabled: false },
    driveLinks: { export: '', archive: '' }
});
