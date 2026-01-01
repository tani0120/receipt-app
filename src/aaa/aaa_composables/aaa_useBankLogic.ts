import { ref } from 'vue';
import type { BankFingerprint } from '@/aaa/aaa_types/aaa_firestore';

/**
 * aaa_useBankLogic
 * Logic for identifying banks and generating auto-masters.
 */
export function aaa_useBankLogic() {

    // Mock Fingerprint DB
    const knownFingerprints = ref<BankFingerprint[]>([
        {
            bankName: 'Mitsubishi_UFJ',
            primaryColor: '#BF0000',
            keywords: ['振込手数料', 'フリカエ', 'Eco通帳'],
            layoutType: 'red_header'
        },
        {
            bankName: 'Sumitomo_Mitsui',
            primaryColor: '#004730',
            keywords: ['お振込', 'カード振替'],
            layoutType: 'green_header'
        },
        {
            bankName: 'Rakuten_Bank',
            primaryColor: '#FFFFFF', // with specific logo
            keywords: ['楽手', '他行宛振込'],
            layoutType: 'modern_web'
        }
    ]);

    /**
     * Identify Bank based on Image Analysis and Balance Continuity
     * @param aiAnalysisResult Text extracted by Vision AI
     * @param currentBalance Balance found in the document
     * @param lastMonthBalances Map of Account -> Balance from General Ledger
     */
    const identifyBank = (
        aiAnalysisResult: string,
        currentBalance: number | null,
        lastMonthBalances: Record<string, number>
    ): { bankName: string | null; confidence: number; detectionMethod: 'fingerprint' | 'balance' | null } => {

        // 1. Balance Continuity Check (Strongest)
        if (currentBalance !== null) {
            for (const [accountName, balance] of Object.entries(lastMonthBalances)) {
                if (balance === currentBalance) {
                    console.log(`[BankLogic] Balance match found: ${accountName} (${balance})`);
                    // Extract bank name from account name (e.g., "普通預金_三菱UFJ" -> "Mitsubishi_UFJ")
                    // Logic depends on naming convention, but let's assume mapping exists or heuristic
                    return { bankName: accountName, confidence: 1.0, detectionMethod: 'balance' };
                }
            }
        }

        // 2. Visual/Keyword Fingerprinting (Fallback)
        for (const fp of knownFingerprints.value) {
            const keywordMatchCount = fp.keywords.filter(k => aiAnalysisResult.includes(k)).length;
            if (keywordMatchCount >= 1 || aiAnalysisResult.includes(fp.bankName)) {
                const confidence = keywordMatchCount > 0 ? 0.7 + (keywordMatchCount * 0.1) : 0.6;
                return { bankName: fp.bankName, confidence: Math.min(confidence, 0.95), detectionMethod: 'fingerprint' };
            }
        }

        return { bankName: null, confidence: 0, detectionMethod: null };
    };

    /**
     * Generate Auto-Master Account Name
     * @param bankName
     * @param identifier Account Number or Card Number part
     */
    const generateAutoMaster = (bankName: string, identifier: string = 'UNKNOWN'): string => {
        return `自動検知_${bankName}_${identifier}`;
    };

    /**
     * Check if a master is an auto-generated one
     */
    const isAutoMaster = (accountName: string): boolean => {
        return accountName.startsWith('自動検知_');
    };

    return {
        knownFingerprints,
        identifyBank,
        generateAutoMaster,
        isAutoMaster
    };
}
