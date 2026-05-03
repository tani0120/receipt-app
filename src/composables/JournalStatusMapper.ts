import type { JournalStatusUi, JournalStatusStepUi, JournalStatusActionUi, StepStateUi } from '@/types/ScreenB_ui.type';

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
export const mapJournalStatusApiToUi = (raw: Record<string, unknown> | null | undefined): JournalStatusUi => {
    // 防御的コーディング: raw が null/undefined の場合
    if (!raw) {
        return createEmptyJournalStatus();
    }

    const steps = (raw.steps ?? {}) as Record<string, unknown>;
    const validStatuses = ['pending', 'in_progress', 'review', 'waiting', 'completed', 'error', 'excluded', 'unknown'] as const;
    const rawStatus = raw.status as string;

    return {
        id: safeString(raw.id, 'unknown_id'),
        rowStyle: safeString(raw.rowStyle, ''),

        clientName: safeString(raw.clientName, 'Unknown Client'),
        clientCode: safeString(raw.clientCode, '---'),
        priority: (raw.priority === 'high' || raw.priority === 'normal' || raw.priority === 'low') ? raw.priority : 'normal',
        softwareLabel: safeString(raw.softwareLabel, ''),
        fiscalMonthLabel: safeString(raw.fiscalMonthLabel, ''),
        status: (validStatuses as readonly string[]).includes(rawStatus) ? rawStatus as JournalStatusUi['status'] : 'unknown',

        steps: {
            document: mapStep(steps.document),
            aiAnalysis: mapStep(steps.aiAnalysis),
            journalEntry: mapStep(steps.journalEntry),
            approval: mapStep(steps.approval),
            remand: mapStep(steps.remand),
            export: mapStep(steps.export),
            archive: mapStep(steps.archive),
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

const mapStep = (rawIs: unknown): JournalStatusStepUi => {
    const raw = rawIs as Record<string, unknown> | null | undefined;
    if (!raw) return { state: 'none', label: '', count: 0 };

    return {
        state: (['pending', 'processing', 'done', 'error', 'ready', 'none'].includes(raw.state as string) ? raw.state : 'none') as StepStateUi,
        label: safeString(raw.label),
        count: safeNumber(raw.count)
    };
};

const mapAction = (rawAc: unknown): JournalStatusActionUi => {
    const raw = rawAc as Record<string, unknown> | null | undefined;
    if (!raw) return { type: 'none', label: '', isEnabled: false };

    const validTypes = ['rescue', 'work', 'approve', 'remand', 'export', 'archive', 'complete_all', 'none'] as const;
    const rawType = raw.type as string;
    return {
        type: (validTypes as readonly string[]).includes(rawType) ? rawType as JournalStatusActionUi['type'] : 'none',
        label: safeString(raw.label),
        isEnabled: !!raw.isEnabled
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
        document: { state: 'none', label: '', count: 0 },
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
