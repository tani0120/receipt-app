import { describe, it, expect } from 'vitest';
import type { LearningRuleApi } from '@/types/zod.type';
import { mapLearningRuleApiToUi } from '@/composables/LearningRuleMapper';

describe('LearningRuleMapper Constitution (Ironclad Rules)', () => {

    it('Ironclad Rule 1: Exterminate Null/Undefined - Should return safe defaults', () => {
        const brokenApi: Partial<LearningRuleApi> = {
            id: 'rule_broken',
            // Missing other fields
        } as any;

        const ui = mapLearningRuleApiToUi(brokenApi as LearningRuleApi);

        expect(ui.id).toBe('rule_broken');
        expect(ui.clientCode).toBe('');
        expect(ui.keyword).toBe('');
        expect(ui.accountItem).toBe('');
        expect(ui.confidenceScore).toBe(0);
        expect(ui.isActive).toBe(false); // Default false for safety? Or true? Let's say false if unknown.
    });

    it('Ironclad Rule 2: Date Safety - Should convert Timestamp to Date and Label', () => {
        const apiWithDate = {
            id: 'rule_date',
            updatedAt: { seconds: 1704067200, nanoseconds: 0 }, // 2024-01-01
        } as unknown as LearningRuleApi;

        const ui = mapLearningRuleApiToUi(apiWithDate);

        expect(ui.updatedAt).toBeInstanceOf(Date);
        expect(ui.updatedAtLabel).toBe('2024/01/01');
    });

    it('Ironclad Rule 3: Enum & Labels - Should handle target field safely', () => {
        const apiWithEnum: Partial<LearningRuleApi> = {
            id: 'rule_enum',
            targetField: 'description',
        } as any;

        const ui = mapLearningRuleApiToUi(apiWithEnum as LearningRuleApi);

        expect(ui.targetField).toBe('description');
        expect(ui.targetFieldLabel).toBe('摘要');
    });

    it('Ironclad Rule 3b: Enum Fallback - Should map unknown target field', () => {
        const apiWithBadEnum: Partial<LearningRuleApi> = {
            id: 'rule_bad',
            targetField: 'super_field' as any,
        } as any;

        const ui = mapLearningRuleApiToUi(apiWithBadEnum as LearningRuleApi);

        // Fallback to 'description' or handle safely?
        // Let's fallback to 'description' as default search scope
        expect(ui.targetField).toBe('description');
        expect(ui.targetFieldLabel).toBe('摘要');
    });

});
