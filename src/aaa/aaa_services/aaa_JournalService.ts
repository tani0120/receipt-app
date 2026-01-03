import { db } from '@/aaa/aaa_firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import type { JournalEntry, JournalLine, ValidationResult } from '@/aaa/aaa_types/aaa_journal';
import type { Job } from '@/aaa/aaa_types/aaa_job';
import type { Client } from '@/aaa/aaa_types/aaa_firestore';
import { JobService } from '@/aaa/aaa_services/aaa_JobService';

const COLLECTION_NAME = 'jobs';

export const JournalService = {
    /**
     * 仕訳データの取得 (Job -> JournalEntry 変換)
     * @param jobId
     */
    async fetchJournalById(jobId: string): Promise<JournalEntry | null> {
        // TEMPORARY: Return Mock Data for User Verification
        if (jobId === 'mock-job-001' || jobId === '1001' || jobId === 'job_draft_01') {
            console.log('Returning Mock Journal Entry for:', jobId);
            return {
                id: jobId,
                clientCode: '1001',
                status: 'pending',
                evidenceUrl: 'mock-invoice.pdf', // Dummy
                evidenceId: 'evidence-1001',
                transactionDate: new Date('2025-01-12'),
                lines: [
                    {
                        lineNo: 1,
                        description: 'MacBook Pro 5台 DEBUG_TOKEN',
                        drAccount: '消耗品費',
                        drTaxClass: 'TAX_PURCHASE_10',
                        drAmount: 1650000,
                        crAccount: '未払金',
                        crTaxClass: 'TAX_NONE',
                        crAmount: 1650000,
                        flags: { isTaxDiff: false }
                    }
                ],
                totalAmount: 1650000,
                balanceDiff: 0,
                remandReason: '',
                remandCount: 0,
                updatedAt: new Date(),
                consumptionTaxMode: 'general',
                simplifiedTaxCategory: undefined
            };
        }

        try {
            const docRef = doc(db, COLLECTION_NAME, jobId);
            const snap = await getDoc(docRef);

            if (!snap.exists()) return null;

            const data = snap.data() as Job;

            // Fetch Client for Tax Settings
            const clientSnap = await getDoc(doc(db, 'clients', data.clientCode));
            const client = clientSnap.exists() ? (clientSnap.data() as Client) : {} as Partial<Client>;

            // 計算: 合計と差額
            const { total, diff } = this.calculateBalance(data.lines || []);

            return {
                id: snap.id,
                evidenceUrl: data.driveFileUrl,
                evidenceId: data.driveFileId,
                lines: data.lines || [],
                totalAmount: total,
                balanceDiff: diff,
                clientCode: data.clientCode,
                status: data.status,
                transactionDate: data.transactionDate.toDate(),
                remandReason: data.remandReason,
                remandCount: (data as any).remandCount || 0, // DBにない場合は0
                updatedAt: data.updatedAt.toDate(),

                // Client Tax Settings
                consumptionTaxMode: client.consumptionTaxMode || 'general',
                simplifiedTaxCategory: client.simplifiedTaxCategory
            };
        } catch (error) {
            console.error('JournalService: fetch error', error);
            throw error;
        }
    },

    /**
     * 仕訳の保存
     * @param id Job ID
     * @param entry 編集済みデータ
     */
    async saveJournal(id: string, entry: Partial<JournalEntry>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);

        const updateData: any = {
            updatedAt: Timestamp.now()
        };

        if (entry.lines) updateData.lines = entry.lines;
        if (entry.remandReason !== undefined) updateData.remandReason = entry.remandReason;
        if (entry.remandCount !== undefined) updateData.remandCount = entry.remandCount;
        // Date -> Timestamp 変換が必要な場合はここで行う (transactionDateなど編集可にするなら)

        await updateDoc(docRef, updateData);
    },

    /**
     * バリデーションロジック (貸借一致確認)
     */
    validateJournal(lines: JournalLine[]): ValidationResult {
        const { diff } = this.calculateBalance(lines);
        const isValid = diff === 0;
        const errors = [];

        if (!isValid) {
            errors.push(`貸借が一致していません (差額: ${diff}円)`);
        }

        // 他のバリデーション (必須項目など) もここに追加可能
        const hasEmptyAccount = lines.some(l => !l.drAccount || !l.crAccount);
        if (hasEmptyAccount) {
            errors.push('勘定科目が未入力の行があります');
        }

        return { isValid, errors, balanceDiff: diff };
    },

    /**
     * ヘルパー: 貸借計算
     */
    calculateBalance(lines: JournalLine[]) {
        let drTotal = 0;
        let crTotal = 0;

        lines.forEach(line => {
            drTotal += Number(line.drAmount || 0);
            crTotal += Number(line.crAmount || 0);
        });

        return {
            total: Math.max(drTotal, crTotal),
            diff: drTotal - crTotal
        };
    },

    /**
     * ステータス連携用ラップ関数
     * Screen B への反映を確実にするため、JobServiceを内部で呼ぶ
     */
    async completePrimaryStage(jobId: string) {
        // 必要ならここで最終保存やバリデーションチェックを挟む
        await JobService.updateJobProgress(jobId, 'COMPLETE_PRIMARY');
    },

    async resolveRemand(jobId: string) {
        await JobService.updateJobProgress(jobId, 'RESOLVE_REMAND');
    }
};
