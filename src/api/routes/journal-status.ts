
import { Hono } from 'hono'
import { z } from 'zod'

const app = new Hono()

// --- 1. Zod Schemas (BFF Layer) ---

// Step State Schema
const StepStateSchema = z.enum(['pending', 'processing', 'done', 'error', 'ready', 'none']);

const JournalStatusStepSchema = z.object({
    state: StepStateSchema.default('none'),
    label: z.string().default(''),
    count: z.number().default(0)
});

// Action Schema
const ActionTypeSchema = z.enum(['rescue', 'work', 'approve', 'remand', 'export', 'archive', 'complete_all', 'none']);

const JournalStatusActionSchema = z.object({
    type: ActionTypeSchema.default('none'),
    label: z.string().default(''),
    isEnabled: z.boolean().default(false)
});

// Main Journal Status Schema
const JournalStatusUiSchema = z.object({
    id: z.string(),
    rowStyle: z.string().default(''), // For UI highlighting
    clientName: z.string().default('Unknown Client'),
    clientCode: z.string().default('---'),
    priority: z.enum(['high', 'normal', 'low']).default('normal'),

    // Labels pre-formatted for UI
    softwareLabel: z.string().default(''),
    fiscalMonthLabel: z.string().default(''),
    status: z.string().default('unknown'), // Internal raw status if needed

    // Steps
    steps: z.object({
        receipt: JournalStatusStepSchema,
        aiAnalysis: JournalStatusStepSchema,
        journalEntry: JournalStatusStepSchema,
        approval: JournalStatusStepSchema,
        remand: JournalStatusStepSchema,
        export: JournalStatusStepSchema,
        archive: JournalStatusStepSchema,
    }),

    // Computed Actions (The backend decides what the button does)
    primaryAction: JournalStatusActionSchema,
    nextAction: JournalStatusActionSchema,

    // Modals data injection
    driveLinks: z.object({
        export: z.string().default(''),
        archive: z.string().default('')
    })
});

// --- 2. Helper Logic (Ported from Mapper & Business Logic) ---

const mapStep = (rawIs: any) => {
    if (!rawIs) return { state: 'none', label: '', count: 0 };
    return {
        state: ['pending', 'processing', 'done', 'error', 'ready', 'none'].includes(rawIs.state) ? rawIs.state : 'none',
        label: String(rawIs.label || ''),
        count: Number(rawIs.count || 0)
    };
};

const mapAction = (rawAc: any) => {
    if (!rawAc) return { type: 'none', label: '', isEnabled: false };
    const validTypes = ['rescue', 'work', 'approve', 'remand', 'export', 'archive', 'complete_all', 'none'];
    return {
        type: validTypes.includes(rawAc.type) ? rawAc.type : 'none',
        label: String(rawAc.label || ''),
        isEnabled: !!rawAc.isEnabled
    };
};

const safeString = (val: unknown) => (val === null || val === undefined) ? '' : String(val);

// --- 3. BFF Route ---

const route = app.get('/', (c) => {
    // Mock Data Source (Simulating DB)
    const rawJobs = [
        {
            id: 'job_001',
            clientCode: 'CLI001',
            clientName: '株式会社エーアイシステム',
            priority: 'normal',
            softwareLabel: 'freee',
            fiscalMonthLabel: '3月決算',
            status: 'processing',
            steps: {
                receipt: { state: 'done', label: '受領済', count: 15 },
                aiAnalysis: { state: 'done', label: '解析完了', count: 15 },
                journalEntry: { state: 'processing', label: '仕訳中', count: 10 },
                approval: { state: 'pending', label: '承認待', count: 0 },
            },
            primaryAction: { type: 'work', label: '仕訳作業', isEnabled: true },
            nextAction: { type: 'none', label: '', isEnabled: false }
        },
        {
            id: 'job_002',
            clientCode: 'CLI002',
            clientName: '合同会社テックイノベーション',
            priority: 'high',
            rowStyle: 'bg-red-50', // Highlight style
            softwareLabel: '弥生会計',
            fiscalMonthLabel: '12月決算',
            status: 'error',
            steps: {
                receipt: { state: 'done', label: '受領済', count: 50 },
                aiAnalysis: { state: 'error', label: '解析エラー', count: 1 }, // Error State
            },
            primaryAction: { type: 'rescue', label: 'エラー修正', isEnabled: true }, // Explicitly tells UI to open Rescue Modal
            nextAction: { type: 'none', label: '', isEnabled: false }
        },
        {
            id: 'job_003',
            clientCode: 'CLI003',
            clientName: '山田 太郎 (個人)',
            priority: 'low',
            softwareLabel: 'その他',
            fiscalMonthLabel: '-',
            status: 'done',
            steps: {
                receipt: { state: 'done', label: '完了', count: 5 },
                aiAnalysis: { state: 'done', label: '完了', count: 5 },
                journalEntry: { state: 'done', label: '完了', count: 5 },
                approval: { state: 'done', label: '承認済', count: 5 },
                export: { state: 'ready', label: '出力可', count: 0 }
            },
            primaryAction: { type: 'export', label: 'データ出力', isEnabled: true }, // Opens Drive Modal
            nextAction: { type: 'archive', label: 'アーカイブ', isEnabled: true }
        }
    ];

    // Transformation
    const processed = rawJobs.map((raw: any) => {
        return {
            id: raw.id,
            rowStyle: safeString(raw.rowStyle),
            clientName: safeString(raw.clientName),
            clientCode: safeString(raw.clientCode),
            priority: raw.priority || 'normal',
            softwareLabel: safeString(raw.softwareLabel),
            fiscalMonthLabel: safeString(raw.fiscalMonthLabel),
            status: raw.status || 'unknown',

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

            // Drive Links specific to this job context
            driveLinks: {
                export: `https://drive.google.com/drive/folders/mock_${raw.clientCode}_export`,
                archive: `https://drive.google.com/drive/folders/mock_${raw.clientCode}_archive`
            }
        };
    });

    const validated = z.array(JournalStatusUiSchema).parse(processed);
    return c.json(validated);
});

export default route
