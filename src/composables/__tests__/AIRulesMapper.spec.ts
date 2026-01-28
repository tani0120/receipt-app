import { describe, it, expect } from 'vitest';
import { mapLearningRuleApiToUi } from '../AIRulesMapper';
import type { LearningRuleApi } from '@/types/zod.type';
import { Timestamp } from 'firebase/firestore';

describe('aaa_AIRulesMapper', () => {
    it('should correctly map a standard active rule', () => {
        const mockApi: LearningRuleApi = {
            id: 'test-1',
            clientCode: 'C001',
            keyword: 'Amazon',
            targetField: 'vendor',
            accountItem: '消耗品費',
            confidenceScore: 0.95,
            hitCount: 10,
            isActive: true,
            updatedAt: { seconds: 1672531200, nanoseconds: 0 } as any // 2023-01-01
        } as LearningRuleApi; // Force Type for mock

        const result = mapLearningRuleApiToUi(mockApi);

        expect(result.id).toBe('test-1');
        expect(result.clientId).toBe('C001');
        expect(result.status).toBe('active');
        expect(result.trigger.type).toBe('vendor');
        expect(result.trigger.keyword).toBe('Amazon');
        expect(result.result.debitAccount).toBe('消耗品費');
        expect(result.confidence).toBe(0.95);
        expect(result.hitCount).toBe(10);
        expect(result.generatedBy).toBe('ai'); // Score > 0.8
        expect(result.lastUsedAt).toBe('2023-01-01');
    });

    it('should map inactive rule and low confidence', () => {
        const mockApi: LearningRuleApi = {
            id: 'test-2',
            clientCode: 'C002',
            keyword: 'Coffee',
            targetField: 'description',
            accountItem: '会議費',
            confidenceScore: 0.5,
            hitCount: 0,
            isActive: false,
            updatedAt: { seconds: 1672531200, nanoseconds: 0 } as any
        } as LearningRuleApi;

        const result = mapLearningRuleApiToUi(mockApi);

        expect(result.status).toBe('inactive');
        expect(result.trigger.type).toBe('description');
        expect(result.generatedBy).toBe('human'); // Score < 0.8
    });
});
