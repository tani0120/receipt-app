
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const app = new Hono()

// --- 1. Zod Schemas ---

// Standard reusable Tax/Account schemas could be shared, but defining here for BFF isolation
const TaxCodeSchema = z.string().default('TAX_PURCHASE_NONE')
const InvoiceIssuerSchema = z.enum(['qualified', 'non_qualified', 'unknown']).default('unknown')

// Line Item Schema (Nested matches JournalLineUi)
const JournalLineSideSchema = z.object({
    account: z.string().default(''),
    subAccount: z.string().default(''),
    amount: z.number().default(0),
    taxCode: TaxCodeSchema,
    taxAmount: z.number().default(0)
})

const JournalLineSchema = z.object({
    lineNo: z.number(),
    description: z.string().default(''),
    debit: JournalLineSideSchema,
    credit: JournalLineSideSchema,
    departmentCode: z.string().default(''),
    invoiceIssuer: InvoiceIssuerSchema
})

// AI Proposal Schema
const AiProposalSchema = z.object({
    hasProposal: z.boolean().default(false),
    confidenceLabel: z.string().default(''),
    reason: z.string().default(''),
    summary: z.string().optional(),
    debits: z.array(z.object({
        account: z.string(),
        subAccount: z.string().default(''),
        amount: z.number().optional(),
        taxRate: z.number().optional()
    })).default([]),
    credits: z.array(z.object({
        account: z.string(),
        subAccount: z.string().default(''),
        amount: z.number().optional(),
        taxRate: z.number().optional()
    })).default([])
})

// Main Response Schema (UI Data)
const JournalEntrySchema = z.object({
    id: z.string(),
    clientCode: z.string(),
    companyName: z.string().default(''), // Populated by BFF from Client Master
    transactionDate: z.string(), // YYYY-MM-DD
    summary: z.string().default(''),
    status: z.string(),
    statusLabel: z.string(), // e.g. "未処理", "承認待ち"

    // Logic Flags
    isLocked: z.boolean().default(false),
    canEdit: z.boolean().default(true),
    journalEditMode: z.enum(['work', 'approve', 'remand', 'locked']).default('work'),

    // Data
    lines: z.array(JournalLineSchema),
    totalAmount: z.number().default(0),

    // AI
    aiProposal: AiProposalSchema.optional(),

    // Alerts (Validation Results)
    alerts: z.array(z.object({
        title: z.string(),
        message: z.string(),
        level: z.enum(['info', 'warning', 'error'])
    })).default([]),

    // Actions (BFF Driven)
    actions: z.array(z.object({
        id: z.string(), // e.g. 'save', 'approve', 'remand'
        label: z.string(),
        disabled: z.boolean().default(false),
        style: z.string().optional() // 'primary', 'danger', etc.
    })).default([]),

    // Additional Context (Drive File)
    driveFileUrl: z.string().optional()
})

// Update Request Schema
const UpdateJournalEntrySchema = z.object({
    transactionDate: z.string(),
    summary: z.string(),
    lines: z.array(JournalLineSchema),
    status: z.string().optional() // If changing status
})

// --- 2. Mock Data Store (In-Memory for Pilot) ---
// In real app, this accesses Firestore/DB
const MOCK_JOURNAL_DB: Record<string, any> = {
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
        // const raw = MOCK_JOURNAL_DB[id] // For generic mock, might need default

        // Simulating data fetch + logic
        // For Pilot, we can return a default structure if ID not found, or specific mock
        const mockData = MOCK_JOURNAL_DB[id] || {
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
            alerts: [], // Inject validations here
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
    })

    // PUT /:id - Update Journal Entry
    .put('/:id', zValidator('json', UpdateJournalEntrySchema), async (c) => {
        const id = c.req.param('id')
        const data = c.req.valid('json')

        console.log(`[BFF] Updating Journal Entry ${id}`, data)

        // Mock Update Logic
        if (MOCK_JOURNAL_DB[id]) {
            MOCK_JOURNAL_DB[id].lines = data.lines
            MOCK_JOURNAL_DB[id].date = data.transactionDate
            MOCK_JOURNAL_DB[id].summary = data.summary
            if (data.status) MOCK_JOURNAL_DB[id].status = data.status
        }

        return c.json({ success: true, message: '保存しました', updatedId: id })
    })

export default route
