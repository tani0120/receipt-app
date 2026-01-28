
import type { JournalEntry } from '@/types/journal';

export const e2eTestTransactions: JournalEntry[] = [
    // 1. Loan (>1M JPY, non-sales)
    {
        id: 101, transactionDate: '2025-01-10', vendor: '日本政策金融公庫',
        description: '公庫借入', totalAmount: 2000000,
        imageTitle: '通帳コピー', status: 'pending', mode: 'new', isDuplicate: false, isExcluded: false,
        aiInference: { phase: 1, phaseName: 'Test', reason: '', confidence: 'high' },
        proposal: {
            debits: [{ accountItem: '普通預金', amount: 2000000, taxType: '不課税' }],
            credits: [{ accountItem: '借入金', amount: 2000000, taxType: '不課税' }]
        },
        history: []
    },
    // 2. Asset Purchase (>300k, 消耗品費)
    {
        id: 102, transactionDate: '2025-01-12', vendor: 'Apple Store',
        description: 'MacBook Pro 5台', totalAmount: 350000,
        imageTitle: '請求書', status: 'pending', mode: 'new', isDuplicate: false, isExcluded: false,
        aiInference: { phase: 1, phaseName: 'Test', reason: '', confidence: 'high' },
        proposal: {
            debits: [{ accountItem: '消耗品費', amount: 350000, taxType: '課対仕入10%' }],
            credits: [{ accountItem: '普通預金', amount: 350000, taxType: '対象外' }]
        },
        history: []
    },
    // 5. Ambiguous (Keywords: NTT Finance)
    {
        id: 105, transactionDate: '2025-01-16', vendor: 'NTTファイナンス',
        description: '電話料金等', totalAmount: 12000,
        imageTitle: '請求書', status: 'pending', mode: 'new', isDuplicate: false, isExcluded: false,
        aiInference: { phase: 1, phaseName: 'Test', reason: '', confidence: 'high' },
        proposal: {
            debits: [{ accountItem: '通信費', amount: 12000, taxType: '課対仕入10%' }],
            credits: [{ accountItem: '普通預金', amount: 12000, taxType: '対象外' }]
        },
        history: []
    },
    // 5. Ambiguous (Keywords: Amazon, sub=消耗品)
    {
        id: 151, transactionDate: '2025-01-16', vendor: 'AMAZON.CO.JP',
        description: '備品購入', totalAmount: 2000,
        imageTitle: '領収書', status: 'pending', mode: 'new', isDuplicate: false, isExcluded: false,
        aiInference: { phase: 1, phaseName: 'Test', reason: '', confidence: 'high' },
        proposal: {
            debits: [{ accountItem: '消耗品費', amount: 2000, taxType: '課対仕入10%' }],
            credits: [{ accountItem: 'カード', amount: 2000, taxType: '対象外' }]
        },
        history: []
    },
    // 6. Funds Transfer (Keywords: 振替, 自分)
    {
        id: 106, transactionDate: '2025-01-18', vendor: '自社口座',
        description: '振替 自分の口座より', totalAmount: 50000,
        imageTitle: '通帳', status: 'pending', mode: 'new', isDuplicate: false, isExcluded: false,
        aiInference: { phase: 1, phaseName: 'Test', reason: '', confidence: 'high' },
        proposal: {
            debits: [{ accountItem: '普通預金', amount: 50000, taxType: '対象外' }],
            credits: [{ accountItem: '売上高', amount: 50000, taxType: '課税売上10%' }]
        },
        history: []
    },
    // 7. Entertainment (>5000)
    {
        id: 107, transactionDate: '2025-01-20', vendor: '叙々苑',
        description: '会食', totalAmount: 15000,
        imageTitle: '領収書', status: 'pending', mode: 'new', isDuplicate: false, isExcluded: false,
        aiInference: { phase: 1, phaseName: 'Test', reason: '', confidence: 'high' },
        proposal: {
            debits: [{ accountItem: '交際費', amount: 15000, taxType: '課対仕入10%' }],
            credits: [{ accountItem: '現金', amount: 15000, taxType: '対象外' }]
        },
        history: []
    },
    // 8. Insurance/Donation
    {
        id: 108, transactionDate: '2025-01-22', vendor: '日本赤十字社',
        description: '寄付', totalAmount: 10000,
        imageTitle: '受領証', status: 'pending', mode: 'new', isDuplicate: false, isExcluded: false,
        aiInference: { phase: 1, phaseName: 'Test', reason: '', confidence: 'high' },
        proposal: {
            debits: [{ accountItem: '寄付金', amount: 10000, taxType: '不課税' }],
            credits: [{ accountItem: '現金', amount: 10000, taxType: '対象外' }]
        },
        history: []
    },
    // 9. Double Payment (Set A)
    {
        id: 109, transactionDate: '2025-01-25', vendor: '大家さん',
        description: '2月分家賃', totalAmount: 110000,
        imageTitle: '通帳', status: 'pending', mode: 'new', isDuplicate: false, isExcluded: false,
        aiInference: { phase: 1, phaseName: 'Test', reason: '', confidence: 'high' },
        proposal: {
            debits: [{ accountItem: '地代家賃', amount: 110000, taxType: '課対仕入10%' }],
            credits: [{ accountItem: '普通預金', amount: 110000, taxType: '対象外' }]
        },
        history: []
    },
    // 9. Double Payment (Set B - Duplicate)
    {
        id: 110, transactionDate: '2025-01-26', vendor: '大家さん',
        description: '2月分家賃', totalAmount: 110000,
        imageTitle: '通帳', status: 'pending', mode: 'new', isDuplicate: false, isExcluded: false,
        aiInference: { phase: 1, phaseName: 'Test', reason: '', confidence: 'high' },
        proposal: {
            debits: [{ accountItem: '地代家賃', amount: 110000, taxType: '課対仕入10%' }],
            credits: [{ accountItem: '普通預金', amount: 110000, taxType: '対象外' }]
        },
        history: []
    },
    // 10. Invoice (Mocked via logic override or metadata prop if added to JE)
    // Note: JournalEntry in aaa_useAccountingSystem doesn't have metadata yet.
    // Assuming DetectionLogic checks 'metadata' on the LINE.
    // Easiest is to mock it via property injection in the test file, casting as any.
    {
        id: 111, transactionDate: '2025-01-28', vendor: 'デザイン事務所',
        description: 'デザイン料', totalAmount: 55000,
        imageTitle: '請求書', status: 'pending', mode: 'new', isDuplicate: false, isExcluded: false,
        aiInference: { phase: 1, phaseName: 'Test', reason: '', confidence: 'high' },
        proposal: {
            debits: [{ accountItem: '外注費', amount: 55000, taxType: '課対仕入10%' }],
            credits: [{ accountItem: '普通預金', amount: 55000, taxType: '対象外' }]
        },
        history: [],
        metadata: { hasTNumber: false }
    } as any,
    // 11. Withholding (>50000, 報酬)
    {
        id: 112, transactionDate: '2025-01-29', vendor: '税理士',
        description: '報酬', totalAmount: 60000,
        imageTitle: '請求書', status: 'pending', mode: 'new', isDuplicate: false, isExcluded: false,
        aiInference: { phase: 1, phaseName: 'Test', reason: '', confidence: 'high' },
        proposal: {
            debits: [{ accountItem: '支払報酬料', amount: 60000, taxType: '課対仕入10%' }],
            credits: [{ accountItem: '普通預金', amount: 60000, taxType: '対象外' }]
        },
        history: []
    },
    // 12. Cutoff (Outside Fiscal Year)
    {
        id: 113, transactionDate: '2024-12-25', vendor: 'NTT',
        description: '12月分電話代', totalAmount: 3000,
        imageTitle: '領収書', status: 'pending', mode: 'new', isDuplicate: false, isExcluded: false,
        aiInference: { phase: 1, phaseName: 'Test', reason: '', confidence: 'high' },
        proposal: {
            debits: [{ accountItem: '通信費', amount: 3000, taxType: '課対仕入10%' }],
            credits: [{ accountItem: '未払金', amount: 3000, taxType: '対象外' }]
        },
        history: []
    }
];
