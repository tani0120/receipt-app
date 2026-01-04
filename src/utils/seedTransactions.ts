import { FirestoreRepository } from '../services/firestoreRepository';
import type { Job, JobStatus, JournalLine } from '../types/firestore';
import { Timestamp } from 'firebase/firestore';

const MOCK_JOURNAL_ENTRIES = [
    {
        id: 1,
        transactionDate: '2024-11-12',
        vendor: '有限会社トラスティーサービス',
        description: '火災警報器取替',
        totalAmount: 21450,
        imageTitle: '御請求書',
        status: 'pending',
        mode: 'history',
        isDuplicate: false,
        isExcluded: false,
        aiInference: {
            phase: 6,
            phaseName: '推論ロジック',
            reason: '明細「火災報知器取替」より修繕費を適用',
            confidence: 'medium',
            matchedKeywords: ['火災', '取替']
        },
        proposal: {
            debits: [{ accountItem: '修繕費', amount: 21450, taxType: '課対仕入10%' }],
            credits: [{ accountItem: '未払金', amount: 21450, taxType: '対象外' }]
        },
        // History omitted for brevity as it's not essential for Job list display
    },
    {
        id: 2,
        transactionDate: '2024-11-13',
        vendor: 'Amazon.co.jp',
        description: '複合仕訳テスト',
        totalAmount: 50000,
        imageTitle: '領収書',
        status: 'pending',
        mode: 'manual',
        isDuplicate: false,
        isExcluded: false,
        aiInference: {
            phase: 5,
            phaseName: '複合仕訳判定',
            reason: '消耗品と送料が混在しているため複合仕訳として提案',
            confidence: 'high'
        },
        proposal: {
            debits: [
                { accountItem: '消耗品費', amount: 48000, taxType: '課対仕入10%' },
                { accountItem: '通信費', amount: 2000, taxType: '課対仕入10%' }
            ],
            credits: [{ accountItem: '未払金', amount: 50000, taxType: '対象外' }]
        }
    },
    {
        id: 3,
        transactionDate: '2024-11-14',
        vendor: '不明株式会社',
        description: '(新規取引)',
        totalAmount: 10000,
        imageTitle: '領収書(初)',
        status: 'pending',
        mode: 'new',
        isDuplicate: false,
        isExcluded: false,
        aiInference: {
            phase: 7,
            phaseName: '新規取引',
            reason: '過去実績がないため、内容より仮払金として提案',
            confidence: 'low'
        },
        proposal: {
            debits: [{ accountItem: '仮払金', amount: 10000, taxType: '不課税' }],
            credits: [{ accountItem: '現金', amount: 10000, taxType: '対象外' }]
        }
    },
    {
        id: 4,
        transactionDate: '2024-11-15',
        vendor: '株式会社サンプル商事',
        description: 'オフィス用品一式',
        totalAmount: 15800,
        imageTitle: '請求書',
        status: 'pending',
        mode: 'history',
        isDuplicate: true,
        isExcluded: false,
        aiInference: {
            phase: 6,
            phaseName: '重複検出',
            reason: '同一取引先・同額の取引が過去1週間以内に存在',
            confidence: 'high',
            matchedKeywords: ['オフィス用品']
        },
        proposal: {
            debits: [{ accountItem: '消耗品費', amount: 15800, taxType: '課対仕入10%' }],
            credits: [{ accountItem: '未払金', amount: 15800, taxType: '対象外' }]
        }
    },
    {
        id: 5,
        transactionDate: '2024-12-25',
        vendor: '個人事業主 田中様',
        description: '来期分コンサルティング料',
        totalAmount: 100000,
        imageTitle: '請求書',
        status: 'pending',
        mode: 'new',
        isDuplicate: false,
        isExcluded: false,
        aiInference: {
            phase: 3,
            phaseName: '期間判定',
            reason: '取引日が計算期間外の可能性あり（来期分）',
            confidence: 'medium'
        },
        proposal: {
            debits: [{ accountItem: '前払費用', amount: 100000, taxType: '対象外' }],
            credits: [{ accountItem: '未払金', amount: 100000, taxType: '対象外' }]
        }
    }
];

export async function seedMockJobs() {
    console.log("Starting to seed mock jobs for client 'AMT'...");
    const clientCode = "AMT";

    for (const entry of MOCK_JOURNAL_ENTRIES) {
        // Map Mock Entry -> Job (One Job per Entry for this simulation)

        // 1. Convert Date
        const dateParts = entry.transactionDate.split('-');
        const dateObj = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
        const timestamp = Timestamp.fromDate(dateObj);

        // 2. Map Status
        let jobStatus: JobStatus = 'pending';
        // Mock logic: randomly assign some status for variety if needed, or stick to pending
        if (entry.status === 'confirmed') jobStatus = 'approved';

        // 3. Map Confidence
        let confidence = 0.5;
        if (entry.aiInference.confidence === 'high') confidence = 0.95;
        if (entry.aiInference.confidence === 'medium') confidence = 0.75;
        if (entry.aiInference.confidence === 'low') confidence = 0.3;

        // 4. Create Lines from Proposal
        const lines: JournalLine[] = [];
        let lineNo = 1;

        // Handle composite journal (multiple debits)
        if (entry.proposal && entry.proposal.debits) {
            for (let i = 0; i < entry.proposal.debits.length; i++) {
                const debit = entry.proposal.debits[i];
                // For simplified 1:1 line structure, we assume 1 credit matches ?
                // Or we create multiple lines with shared credit?
                // Logic: If multiple debits, we might need multiple lines or split credit.
                // For simplicity in this mock, we'll take the first credit for each debit,
                // or just map 1-to-1 if possible.
                // The Type definition 'JournalLine' implies 1 DR and 1 CR per line.
                // If we have 2 DR and 1 CR (50k total), we probably split the CR.

                const credit = entry.proposal.credits[0]; // Assume single credit for now for simplicity

                // Calculate proportional credit amount or just use debit amount for balance?
                // Double entry must balance per transaction.
                // Usually JournalLine means a "Row" in a standard view.
                // Let's just use debit amount for crAmount to keep it balanced per line if that's the UI expectation,
                // OR we accept that 'crAmount' might need to be set differently.
                // Getting simple: Use debit amount for both sides on this line.

                lines.push({
                    lineNo: lineNo++,
                    drAccount: debit.accountItem,
                    drAmount: debit.amount,
                    drTaxClass: debit.taxType,
                    crAccount: credit ? credit.accountItem : '未払金',
                    crAmount: debit.amount, // Force balance on line level for display
                    crTaxClass: credit ? credit.taxType : '対象外',
                    description: entry.description,
                    subAccount: entry.vendor,
                    note: entry.aiInference.reason
                });
            }
        }

        const jobData = {
            clientCode: clientCode,
            driveFileId: `mock_drive_${entry.id}_${Date.now()}`,
            driveFileUrl: "", // Mock URL
            status: jobStatus,
            transactionDate: timestamp,
            confidenceScore: confidence,
            aiAnalysisRaw: JSON.stringify(entry.aiInference),
            lines: lines
        };

        try {
            const jobId = await FirestoreRepository.addJob(jobData);
            console.log(`Created Job ${jobId} for Mock Entry ${entry.id}`);
        } catch (e) {
            console.error(`Failed to seed job for entry ${entry.id}`, e);
        }
    }
    console.log("Seeding complete.");
    alert("Mock Data Seeding Complete! Please refresh Screen B.");
}
