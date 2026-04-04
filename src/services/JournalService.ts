import { db } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { JournalEntry, JournalLine, ValidationResult } from '@/types/journal';
import { JobService } from '@/services/JobService';
import {
  TaxCodeEnum,
  InvoiceDeductionEnum,
  TaxTypeEnum,
  TaxAmountSourceEnum,
} from '@/core/journal';

const COLLECTION_NAME = 'jobs';

export const JournalService = {
    /**
     * 仕訳データの取得（モック版）
     * Phase 6.3: Firestore直読みはScreenE_Workbench実装時に復元
     */
    async fetchJournalById(jobId: string): Promise<JournalEntry | null> {
        // モックデータ（ScreenE_Workbench.vue開発/デバッグ用）
        if (jobId === 'mock-job-001' || jobId === '1001' || jobId === 'job_draft_01') {
            console.log('Returning Mock Journal Entry for:', jobId);
            const now = new Date().toISOString();
            return {
                id: jobId,
                clientId: 'LDI-00008',
                clientCode: 'LDI',
                status: 'READY_FOR_WORK',
                date: '2025-01-12',
                description: 'MacBook Pro 5台 FAKE_TOKEN',
                totalAmount: 1650000,
                lines: [
                    {
                        lineId: `${jobId}-line-001`,
                        accountCode: 'SUPPLIES',
                        accountName: '消耗品費',
                        debit: 1650000,
                        credit: 0,
                        taxCode: TaxCodeEnum.enum.TAXABLE_PURCHASE_10,
                        invoiceDeduction: InvoiceDeductionEnum.enum.QUALIFIED,
                        taxType: TaxTypeEnum.enum.consumption,
                        taxDocumentSource: 'NOT_PRESENT',
                        taxAmountCalculated: 150000,
                        taxCalculationMethod: 'SIMPLE_RATE',
                        taxAmountFinal: 150000,
                        taxAmountSource: TaxAmountSourceEnum.enum.CALCULATED,
                        isAIGenerated: true,
                        description: 'MacBook Pro 5台',
                    },
                    {
                        lineId: `${jobId}-line-002`,
                        accountCode: 'ACCRUED_EXPENSES',
                        accountName: '未払金',
                        debit: 0,
                        credit: 1650000,
                        taxCode: TaxCodeEnum.enum.OUT_OF_SCOPE_PURCHASE,
                        invoiceDeduction: InvoiceDeductionEnum.enum.QUALIFIED,
                        taxType: TaxTypeEnum.enum.none,
                        taxDocumentSource: 'NOT_PRESENT',
                        taxAmountCalculated: 0,
                        taxCalculationMethod: 'SIMPLE_RATE',
                        taxAmountFinal: 0,
                        taxAmountSource: TaxAmountSourceEnum.enum.CALCULATED,
                        isAIGenerated: true,
                    },
                ],
                aiSourceType: 'gemini',
                aiConfidence: 0.95,
                sourceFiles: [],
                createdAt: now,
                createdBy: 'system',
                updatedAt: now,
                isConfirmed: false,
                duplicateCheckHash: `mock-hash-${jobId}`,
            };
        }

        // TODO Phase 6.3: Firestore直読みはScreenE_Workbench.vue実装時に復元
        // ScreenE_Workbench.vue は現在 mvp.ts でコメントアウト中
        throw new Error(`fetchJournalById: Firestore直読み未実装 (jobId: ${jobId})`);
    },

    /**
     * 仕訳の保存
     * @param id Job ID
     * @param entry 編集済みデータ
     */
    async saveJournal(id: string, entry: Partial<JournalEntry>): Promise<void> {
        // TODO Phase 6.3: Firestoreへの保存。ScreenE_Workbench.vue実装時に完全実装
        const docRef = doc(db, COLLECTION_NAME, id);

        const updateData: Record<string, unknown> = {
            updatedAt: new Date().toISOString()  // JournalEntry.updatedAt: string
        };

        if (entry.lines) updateData.lines = entry.lines;
        // remandReason/remandCountはJournalEntryに存在しないため削除済み
        // （Job型側のフィールドはPhase 6.3でJobServiceを通じて更新）

        await updateDoc(docRef, updateData);
    },

    /**
     * バリデーションロジック (貸借一致確認)
     */
    validateJournal(lines: JournalLine[]): ValidationResult {
        const { diff } = this.calculateBalance(lines);
        const isValid = diff === 0;
        const errors: string[] = [];

        if (!isValid) {
            errors.push(`貸借が一致していません (差額: ${diff}円)`);
        }

        // 新型: accountCode で空チェック（旧: drAccount/crAccount）
        const hasEmptyAccount = lines.some(l => !l.accountCode);
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
            drTotal += Number(line.debit || 0);   // 新型: debit（旧: drAmount）
            crTotal += Number(line.credit || 0);  // 新型: credit（旧: crAmount）
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
