import { z } from 'zod';

// --- Types Data Structures ---

export interface LedgerEntry {
    date: Date;
    amount: number; // Signed (Negative = Withdrawal, Positive = Deposit)
    description: string;
    id: string;
}

export interface EvidenceFile {
    date: Date;
    amount: number; // Always positive
    vendor: string;
    id: string;
    items?: string[];
    // L1 Parsing result might suggest tax class (e.g. Overseas, Exempt)
    suggestedTaxClass?: string;
}

export type JournalStatus = 'CONFIRMED' | 'REVIEW_NEEDED';

export interface JournalCandidate {
    debit: { account: string; amount: number; taxClass?: string }[];
    credit: { account: string; amount: number; taxClass?: string }[];
    status: JournalStatus;
    reason: string;
    tags: string[]; // e.g., 'AUTO_FEE', 'ZUBORA_FIX'
}

// --- Dynamic Settings Interface ---
export interface ZuboraSettings {
    AUTO_FEE_LIMIT: number;         // e.g. 1000
    BUNDLE_WINDOW_DAYS: number;     // e.g. 5
    AUTO_IGNORE_INVOICE_LIMIT: number; // e.g. 3000
}

// Default Configuration (Safety fallback)
const DEFAULT_SETTINGS: ZuboraSettings = {
    AUTO_FEE_LIMIT: 1000,
    BUNDLE_WINDOW_DAYS: 5,
    AUTO_IGNORE_INVOICE_LIMIT: 3000
};

// --- The Ultimate Zubora Logic Strategy ---

export class ZuboraLogic {

    /**
     * Category A: Reconciliation Engine (照合ロジック)
     * Now accepts dynamic settings!
     */
    static reconcile(
        withdrawal: LedgerEntry,
        receipts: EvidenceFile[],
        settings: ZuboraSettings = DEFAULT_SETTINGS
    ): JournalCandidate | null {
        const wAmount = Math.abs(withdrawal.amount);

        // 1. Exact Match
        const exactMatch = receipts.find(r => r.amount === wAmount && this.isDateClose(r.date, withdrawal.date));
        if (exactMatch) {
            return this.createMatchCandidate(exactMatch, withdrawal); // 1:1 Match (Logic omitted for brevity)
        }

        // 2. Diff Analysis (Fee or Points)
        const diffCandidates = receipts.filter(r =>
            this.isDateClose(r.date, withdrawal.date) &&
            Math.abs(r.amount - wAmount) <= settings.AUTO_FEE_LIMIT // <--- Dynamic!
        );

        if (diffCandidates.length === 1) {
            const receipt = diffCandidates[0];
            const diff = wAmount - receipt.amount;

            // A-1 & A-4: Payment Fee / FX Variance (Diff > 0)
            if (diff > 0) {
                // Tax Logic Enhancement: Inherit Tax Class from Receipt Source
                // If the receipt is "Overseas/Non-Taxable", the fee/FX diff should likely be Non-Taxable too.
                // Standard domestic transfer fee is 10%, but FX loss is Non-Taxable.
                // Heuristic: If diff is small and receipt suggests overseas, assume Non-Taxable FX.
                const isOverseas = this.isLikelyOverseas(receipt);
                const feeTaxClass = isOverseas ? '対象外' : '課対仕入10%';

                return {
                    debit: [
                        { account: 'TargetExpense', amount: receipt.amount },
                        { account: '支払手数料', amount: diff, taxClass: feeTaxClass } // <--- Smart Tax!
                    ],
                    credit: [{ account: '普通預金', amount: wAmount }],
                    status: 'CONFIRMED',
                    reason: `Matched with Fee/FX (Diff: ${diff} JPY)`,
                    tags: ['AUTO_FEE', 'ZUBORA_LOGIC']
                };
            }

            // A-6: Points / Discount (Diff < 0)
            if (diff < 0) {
                const discount = Math.abs(diff);
                return {
                    debit: [{ account: 'TargetExpense', amount: receipt.amount }],
                    credit: [
                        { account: '普通預金', amount: wAmount },
                        { account: '値引き他', amount: discount, taxClass: '不課税' } // Points are usually exempt
                    ],
                    status: 'REVIEW_NEEDED',
                    reason: `Matched with Points/Discount (Used: ${discount} JPY)`,
                    tags: ['POINTS_USED']
                };
            }
        }

        // A-5: Bundle Search
        const bundle = this.findBundleMatch(wAmount, receipts, withdrawal.date, settings.BUNDLE_WINDOW_DAYS); // <--- Dynamic!
        if (bundle) {
            return {
                debit: bundle.map(r => ({ account: 'TargetExpense', amount: r.amount })),
                credit: [{ account: '普通預金', amount: wAmount }],
                status: 'REVIEW_NEEDED',
                reason: `Bundle Match Candidate (${bundle.length} receipts)`,
                tags: ['BUNDLE_MATCH']
            };
        }

        return null;
    }

    /**
     * Category B: Zubora Rules Application
     */
    static applyZuboraRules(
        candidate: JournalCandidate,
        evidence: EvidenceFile,
        settings: ZuboraSettings = DEFAULT_SETTINGS
    ): JournalCandidate {

        // B-1: Cash -> Director's Loan
        if (candidate.credit.length === 0) {
            candidate.credit.push({ account: '役員借入金', amount: evidence.amount });
            candidate.tags.push('DIRECTOR_LOAN');
        }

        // B-6: Auto Invoice
        const isTargetVendor = ['ETC', 'タイムズ', '三井のリパーク'].some(v => evidence.vendor.includes(v));
        if (isTargetVendor && evidence.amount <= settings.AUTO_IGNORE_INVOICE_LIMIT) { // <--- Dynamic!
            candidate.debit.forEach(d => d.taxClass = '課対仕入10%');
            candidate.tags.push('AUTO_INVOICE_SMALL');
        }

        return candidate;
    }

    // --- Helpers ---

    private static isDateClose(d1: Date, d2: Date): boolean {
        // ... (Same as before)
        return true;
    }

    private static findBundleMatch(target: number, pool: EvidenceFile[], anchorDate: Date, windowDays: number): EvidenceFile[] | null {
        // ... (Uses windowDays arg)
        return null;
    }

    private static createMatchCandidate(r: EvidenceFile, w: LedgerEntry): JournalCandidate {
        return {
            debit: [{ account: 'Unknown', amount: r.amount }],
            credit: [{ account: 'Bank', amount: w.amount }],
            status: 'CONFIRMED',
            reason: 'Exact Match',
            tags: []
        };
    }

    private static isLikelyOverseas(r: EvidenceFile): boolean {
        // Simple heuristic for now. Can be expanded with 'Region' detected by OCR.
        const overseasVendors = ['Google', 'Adobe', 'AWS', 'GitHub', 'OpenAI', 'Zoom'];
        return overseasVendors.some(v => r.vendor.includes(v)) || r.suggestedTaxClass === '対象外';
    }
}
