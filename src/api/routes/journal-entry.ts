
import { Hono } from 'hono'
import { JournalService, FinalizePayloadSchema } from '../services/JournalService'

const app = new Hono()

// --- 1. Types & Interfaces ---

interface JournalEntryMock {
    id: string;
    clientCode: string;
    date: string;
    summary: string;
    status: string;
    amount: number;
    lines: any[]; // Using any for lines to simplify for now, can be stricter later if needed
    aiProposal?: {
        hasProposal: boolean;
        confidenceLabel: string;
        reason: string;
        summary?: string;
        debits: any[];
        credits: any[];
    };
    driveFileUrl?: string;
}

// --- 2. Mock Data Store (In-Memory for Pilot) ---
// In real app, this accesses Firestore/DB
const MOCK_JOURNAL_DB: Record<string, JournalEntryMock> = {
    'job_draft_01': {
        id: 'job_draft_01',
        clientCode: '1001',
        date: '2024-12-01',
        summary: '1次仕訳テスト用 (消耗品)',
        status: 'ready_for_work',
        amount: 10000,
        lines: [
            {
                lineNo: 1,
                description: '1次仕訳テスト用 (消耗品)',
                debit: { account: '消耗品費', subAccount: '株式会社 テスト商事', amount: 10000, taxCode: 'TAX_PURCHASE_10' },
                credit: { account: '未払金', subAccount: '', amount: 10000, taxCode: 'TAX_PURCHASE_NONE' }
            }
        ],
        aiProposal: {
            hasProposal: true,
            confidenceLabel: '高 (90%)',
            reason: '過去の取引履歴と一致しました (消耗品費 / 未払金)',
            summary: '消耗品費 / 未払金',
            debits: [{ account: '消耗品費', subAccount: '', amount: 10000, taxRate: 10 }],
            credits: [{ account: '未払金', subAccount: '', amount: 10000, taxRate: 0 }]
        }
    }
}

// --- 3. Routes ---

const route = app
    // GET /:id - Fetch Journal Entry UI Data
    .get('/:id', (c) => {
        const id = c.req.param('id')

        try {
            // Simulating data fetch + logic
            const mockData: JournalEntryMock = MOCK_JOURNAL_DB[id] || {
                id,
                clientCode: '1002',
                date: '2024-12-01',
                summary: '(新規取引)',
                status: 'ready_for_work',
                amount: 0,
                lines: []
            }

            // UI Logic (BFF): Calculate Status Label & Mode
            const editMode = mockData.status === 'ready_for_work' ? 'work' :
                mockData.status === 'waiting_approval' ? 'approve' :
                    mockData.status === 'remanded' ? 'remand' : 'work';

            // Define alert type explicitly
            type Alert = { title: string; message: string; level: 'info' | 'warning' | 'error' };

            const uiData = {
                id: mockData.id,
                clientCode: mockData.clientCode,
                companyName: '株式会社 テスト商事', // Mock
                transactionDate: mockData.date,
                summary: mockData.summary,
                status: mockData.status,
                statusLabel: editMode === 'work' ? '未処理' : editMode === 'approve' ? '承認待ち' : '差戻し',
                isLocked: false,
                canEdit: true,
                journalEditMode: editMode,
                lines: mockData.lines.length > 0 ? mockData.lines : [{
                    lineNo: 1,
                    description: mockData.summary,
                    debit: { account: '', subAccount: '', amount: 0, taxCode: 'TAX_PURCHASE_10', taxAmount: 0 },
                    credit: { account: '', subAccount: '', amount: 0, taxCode: 'TAX_PURCHASE_NONE', taxAmount: 0 },
                    departmentCode: '',
                    invoiceIssuer: 'unknown'
                }],
                totalAmount: mockData.amount,
                aiProposal: mockData.aiProposal,
                alerts: [] as Alert[], // Explicitly typed array
                actions: [
                    { id: 'save', label: '保存', disabled: false, style: 'primary' },
                    { id: 'ai_apply', label: 'AI提案を適用', disabled: !mockData.aiProposal?.hasProposal, style: 'secondary' }
                ],
                driveFileUrl: mockData.driveFileUrl || '#'
            }

            // Validation Logic (BFF)
            if (uiData.lines.some((l: any) => l.debit.amount !== l.credit.amount)) {
                uiData.alerts.push({
                    title: '貸借不一致',
                    message: '借方と貸方の金額が一致していません。',
                    level: 'error'
                })
            }

            return c.json(uiData)
        } catch (e: unknown) {
            const err = e as Error;
            console.error('[BFF] Journal Entry Error:', err);
            return c.json({ success: false, message: err.message || 'Internal Error' }, 500);
        }
    })

    // Action Dispatcher Endpoint (RPC Style)
    .post('/:id/action', async (c) => {
        const id = c.req.param('id')
        const { action, payload } = await c.req.json()

        console.log(`[BFF] Journal Action: ${action} for ${id}`, payload)

        try {
            switch (action) {
                case 'save_draft':
                    return c.json(await JournalService.saveDraft(id, payload));

                case 'finalize':
                case 'confirmed':
                case 'approve':
                    // Validate payload if present, or pass through
                    const finalizeData = {
                        jobId: id,
                        lines: payload?.lines || [],
                        summary: payload?.summary || '',
                        transactionDate: payload?.transactionDate || ''
                    };
                    /// @ts-ignore strict payload check might fail if partial, service handles it merge
                    return c.json(await JournalService.approve(id, finalizeData));

                case 'request_approval':
                    return c.json(await JournalService.requestApproval(id, payload));

                case 'remand':
                    return c.json(await JournalService.remand(id, payload));

                case 'exclude':
                    return c.json(await JournalService.exclude(id, payload));

                case 're_analyze':
                    // AI Re-analysis
                    // payload should contain { settings: { modelId, ... } } if needed
                    // Assuming the image URI is known or passed in payload.
                    // For now, let's assume payload has { gcsUri } or we look it up from DB.
                    // Mocking gcsUri lookup from DB ID for now:
                    const gcsUri = payload.driveFileUrl // || await JournalService.getDriveUrl(id);
                    if (!gcsUri) throw new Error('No Drive File URL found for analysis');

                    const { AIProviderFactory } = await import('../lib/ai/AIProviderFactory');
                    // Context-Aware Factory: Get "OCR" phase provider.
                    // This handles Model/Mode/Provider selection automatically based on config.
                    const provider = await AIProviderFactory.getProviderForPhase('ocr');

                    // No need to manually select model - Factory limits scope
                    const analysisResult = await provider.analyzeReceipt(gcsUri);

                    // Convert analysis result to Journal Lines (Mock Mapping)
                    // In real app, this mapping logic belongs in a Service or Mapper
                    const aiProposal = {
                        hasProposal: true,
                        confidenceLabel: 'High',
                        reason: 'AI Re-analysis',
                        summary: analysisResult.merchantName || 'AI Proposal',
                        debits: [], // populate from analysisResult
                        credits: []
                    };

                    return c.json({ success: true, aiProposal });

                default:
                    return c.json({ success: false, message: 'Invalid Action' }, 400);
            }
        } catch (e: unknown) {
            const err = e as Error;
            console.error('[BFF] Action Error:', err);
            return c.json({ success: false, message: err.message || 'Action failed' }, 500);
        }
    })

export default route
