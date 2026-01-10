
import type { WorkLogDocument } from '../../types/schema_v2';
import type { JournalStatusUi, JournalStatusStepUi, JournalStatusActionUi } from '../../types/ScreenB_ui.type';

/**
 * Map WorkLogDocument (V2) to JournalStatusUi (Screen B)
 */
export function mapWorkLogToJournalStatus(log: WorkLogDocument, clientMap?: Map<string, string>): JournalStatusUi {
    // Map Status
    // V2: 'draft' | 'submitted' | 'approved' | 'rejected'
    // UI: 'pending' | 'in_progress' | 'review' | 'waiting' | 'completed' | 'error' | 'excluded' | 'unknown'
    let uiStatus: JournalStatusUi['status'] = 'unknown';

    switch (log.status) {
        case 'draft':
            uiStatus = 'in_progress';
            break;
        case 'submitted':
            uiStatus = 'review';
            break;
        case 'approved':
            uiStatus = 'completed';
            break;
        case 'rejected':
            uiStatus = 'error'; // Or 'pending' for remand?
            break;
        default:
            uiStatus = 'pending';
    }

    // Default Step
    const defaultStep: JournalStatusStepUi = { state: 'none', label: '-', count: 0 };

    // Construct Steps based on status
    const steps = {
        receipt: { state: 'done', label: '受領済', count: 1 } as JournalStatusStepUi, // Assume receipt is done if worklog exists
        aiAnalysis: { state: 'done', label: '解析済', count: 1 } as JournalStatusStepUi, // Assume AI is done
        journalEntry: defaultStep,
        approval: defaultStep,
        remand: defaultStep,
        export: defaultStep,
        archive: defaultStep,
    };

    if (uiStatus === 'in_progress') {
        steps.journalEntry = { state: 'processing', label: '仕訳中', count: 0 };
    } else if (uiStatus === 'review') {
        steps.journalEntry = { state: 'done', label: '仕訳済', count: 0 };
        steps.approval = { state: 'pending', label: '承認待', count: 0 };
    } else if (uiStatus === 'completed') {
        steps.journalEntry = { state: 'done', label: '仕訳済', count: 0 };
        steps.approval = { state: 'done', label: '承認済', count: 0 };
        steps.export = { state: 'ready', label: '未出力', count: 0 };
    }

    // Actions
    const primaryAction: JournalStatusActionUi = { type: 'none', label: '', isEnabled: false };
    if (uiStatus === 'in_progress' || uiStatus === 'pending') {
        // Allow working on it
        Object.assign(primaryAction, { type: 'work', label: '仕訳作業', isEnabled: true });
    } else if (uiStatus === 'review') {
        Object.assign(primaryAction, { type: 'approve', label: '承認', isEnabled: true });
    }

    return {
        id: log.id,
        rowStyle: '',
        clientName: (clientMap ? clientMap.get(log.clientId) : '') || log.clientId || 'Unknown', // Lookup name
        clientCode: log.clientId,
        priority: 'normal',
        softwareLabel: 'Unknown',
        fiscalMonthLabel: '-',
        status: uiStatus,
        steps,
        primaryAction,
        nextAction: { type: 'none', label: '', isEnabled: false },
        driveLinks: {
            export: '',
            archive: ''
        }
    };
}
