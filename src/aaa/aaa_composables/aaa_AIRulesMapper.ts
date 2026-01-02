import type { LearningRuleUi } from '@/aaa/aaa_types/aaa_LearningRuleUi';
import type { LearningRuleApi } from '@/aaa/aaa_types/aaa_zod.type';
import { Timestamp } from 'firebase/firestore';

// Helper for Safe Stats
const safeNumber = (val: unknown, fallback = 0): number => {
    if (typeof val === 'number' && !Number.isNaN(val)) return val;
    return fallback;
};

// Helper for Date Formatting
const formatDate = (ts: unknown): string | undefined => {
    // Check for Firestore Timestamp
    if (ts && typeof (ts as any).toDate === 'function') {
        const date = (ts as any).toDate();
        return date.toISOString().split('T')[0];
    }
    // Check for raw seconds object
    if (ts && typeof (ts as object) === 'object' && 'seconds' in ts) {
        const date = new Date((ts as any).seconds * 1000);
        return date.toISOString().split('T')[0];
    }
    return undefined;
};

/**
 * Maps raw API data (Zod Schema) to strict UI Contract (Ironclad).
 */
export const mapLearningRuleApiToUi = (api: LearningRuleApi): LearningRuleUi => {

    // 1. Status Mapping
    // DB: isActive (boolean) -> UI: status ('active' | 'inactive')
    const status = api.isActive ? 'active' : 'inactive';

    // 2. Trigger Logic
    // DB: description | vendor | amount_range -> UI: description | vendor | amount
    let triggerType: 'description' | 'vendor' | 'amount' = 'description';
    if (api.targetField === 'vendor') triggerType = 'vendor';
    if (api.targetField === 'amount_range') triggerType = 'amount';

    // 3. Priority Inference (Not in DB)
    // Heuristic: Higher confidence = Higher priority? Or just default.
    // For now, default to 3 (Normal).
    const priority = 3;

    // 4. GeneratedBy Inference (Not in DB)
    // Heuristic: Confidence > 0.9 is likely AI (or very strong rule), < 0.9 might be human edit?
    // Actually, usually high confidence = AI. Let's assume 'ai' for > 0.8, 'human' otherwise for mock purposes.
    const generatedBy = api.confidenceScore >= 0.8 ? 'ai' : 'human';

    return {
        id: api.id,
        clientId: api.clientCode, // Map clientCode -> clientId
        priority,
        status,
        trigger: {
            type: triggerType,
            keyword: api.keyword,
            // amountRange: Not fully supported in DB schema yet (keyword holds string?), omit for now
        },
        result: {
            debitAccount: api.accountItem,
            targetTaxClass: api.taxClass,
            // subAccount: api.subAccount (Supported in API, but not strictly in UI type definition?
            // Wait, UI type definition above DOES NOT have subAccount in result.
            // Checked file: result: { debitAccount: string; targetTaxClass?: string; };
            // So we strictly omit it here to match contract.)
        },
        confidence: safeNumber(api.confidenceScore),
        hitCount: safeNumber(api.hitCount),
        lastUsedAt: formatDate(api.updatedAt), // Using updatedAt as proxy for lastUsed
        generatedBy
    };
};
