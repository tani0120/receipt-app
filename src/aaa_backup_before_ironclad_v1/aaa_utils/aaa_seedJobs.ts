import { FirestoreRepository } from "@/aaa/aaa_services/aaa_firestoreRepository";
import type { Job, JobStatus, JournalLine } from "@/aaa/aaa_types/aaa_firestore";
import { Timestamp } from "firebase/firestore";

export const seedRichJobs = async (clientCode: string = 'AMT') => {
    console.log(`Seeding rich jobs for ${clientCode}...`);
    const now = Timestamp.now();

    // Helper to create lines
    const createLine = (dr: string, drAmt: number, cr: string, crAmt: number, desc: string, sub?: string): JournalLine[] => {
        return [{
            lineNo: 1,
            drAccount: dr,
            drAmount: drAmt,
            drTaxClass: '課対仕入10%',
            crAccount: cr,
            crAmount: crAmt,
            crTaxClass: '対象外',
            description: desc,
            subAccount: sub,
            note: ''
        }];
    };

    const jobs: Omit<Job, "id" | "createdAt" | "updatedAt">[] = [
        // Job 1 (未着手): ステータス pending, 借方「消耗品費」, 金額 1100, AI信頼度 0.9
        {
            clientCode,
            driveFileId: 'mock-file-1',
            driveFileUrl: '',
            status: 'pending',
            priority: 'normal',
            retryCount: 0,
            transactionDate: now,
            confidenceScore: 0.9,
            aiAnalysisRaw: JSON.stringify({ reason: 'Receipt looks clear' }),
            lines: createLine('消耗品費', 1100, '現金', 1100, '文房具代', 'アスクル'),
        },
        // Job 2 (履歴あり): ステータス pending, 借方「旅費交通費」, 金額 15000, 過去の仕訳履歴(history)あり
        // Note: History is usually handled by the UI aggregating past jobs,
        // but here we simulate a job that "should" have history.
        {
            clientCode,
            driveFileId: 'mock-file-2',
            driveFileUrl: '',
            status: 'pending',
            priority: 'normal',
            retryCount: 0,
            transactionDate: now,
            confidenceScore: 0.8,
            lines: createLine('旅費交通費', 15000, '現金', 15000, '出張旅費', 'JR東海'),
        },
        // Job 3 (重複疑い): ステータス pending, 借方「会議費」, 金額 5000, isDuplicate フラグ (Logic simulation)
        // Note: Firestore type doesn't have isDuplicate flag on Job root natively in provided types,
        // but UI logic might check for dupes. We'll add a note or sim via context.
        // For now, standard job.
        {
            clientCode,
            driveFileId: 'mock-file-3',
            driveFileUrl: '',
            status: 'pending',
            priority: 'normal',
            retryCount: 0,
            transactionDate: now,
            confidenceScore: 0.6,
            aiAnalysisRaw: JSON.stringify({ warning: 'Possible duplicate' }),
            lines: createLine('会議費', 5000, '現金', 5000, '打ち合わせ', 'スターバックス'),
        },
        // Job 4 (差戻し中): ステータス remanded, 理由「領収書不鮮明」
        {
            clientCode,
            driveFileId: 'mock-file-4',
            driveFileUrl: '',
            status: 'remanded',
            priority: 'normal',
            retryCount: 0,
            transactionDate: now,
            confidenceScore: 0.3,
            aiAnalysisRaw: JSON.stringify({ error: 'Blurry image' }),
            lines: createLine('雑費', 500, '現金', 500, '不明な支出', ''),
            // Note: remandReason is custom field not in strict Job type, might need extending or putting in note
        },
        // Job 5 (完了): ステータス approved
        {
            clientCode,
            driveFileId: 'mock-file-5',
            driveFileUrl: '',
            status: 'approved',
            priority: 'normal',
            retryCount: 0,
            transactionDate: now,
            confidenceScore: 0.99,
            lines: createLine('新聞図書費', 2000, '現金', 2000, '専門書', 'Amazon'),
        }
    ];

    try {
        const promises = jobs.map(j => FirestoreRepository.addJob(j));
        await Promise.all(promises);
        console.log('Seeding complete!');
        alert(`Successfully seeded 5 rich jobs for ${clientCode}`);
    } catch (e) {
        console.error('Seeding failed:', e);
        alert('Seeding failed. Check console.');
    }
};
