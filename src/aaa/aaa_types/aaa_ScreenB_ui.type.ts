/**
 * ============================================================
 * aaa_ScreenB_ui.type.ts
 * ------------------------------------------------------------
 * Screen B (Journal Status) 専用の厳格なUI型
 * Ironclad Architecture Phase C
 * ============================================================
 */

export type StepStateUi = 'pending' | 'processing' | 'done' | 'error' | 'ready' | 'none';

export type JournalStatusStepUi = {
    readonly state: StepStateUi;
    readonly label: string;
    readonly count: number;
};

export type JournalStatusActionUi = {
    readonly type: 'rescue' | 'work' | 'approve' | 'remand' | 'export' | 'archive' | 'complete_all' | 'none';
    readonly label: string;
    readonly isEnabled: boolean;
};

export type JournalStatusUi = {
    readonly id: string;
    readonly rowStyle: string;

    // Client Info
    readonly clientName: string;
    readonly clientCode: string;
    readonly priority: 'high' | 'normal' | 'low';
    readonly softwareLabel: string;
    readonly fiscalMonthLabel: string;
    readonly status: 'pending' | 'in_progress' | 'review' | 'waiting' | 'completed' | 'error' | 'excluded' | 'unknown';

    // Steps
    readonly steps: {
        readonly receipt: JournalStatusStepUi;
        readonly aiAnalysis: JournalStatusStepUi;
        readonly journalEntry: JournalStatusStepUi;
        readonly approval: JournalStatusStepUi;
        readonly remand: JournalStatusStepUi;
        readonly export: JournalStatusStepUi;
        readonly archive: JournalStatusStepUi;
    };

    // Actions
    readonly primaryAction: JournalStatusActionUi;
    readonly nextAction: JournalStatusActionUi;

    // Drive Links (for buttons)
    readonly driveLinks: {
        readonly export: string;
        readonly archive: string;
    };
};
