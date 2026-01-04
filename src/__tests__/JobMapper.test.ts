
import { describe, it, expect } from 'vitest';
import { mapJobApiToUi } from '../composables/mapper';
import type { JobUi } from '../types/ui.type';

// Phase C: Ironclad Contract - Mapper Stress Test regarding JobUi (Level 4)
// This verifies Screen B's data safety.

describe('Phase C: JobMapper Ironclad Test (Screen B)', () => {

    const assertIroncladContract = (ui: JobUi) => {
        expect(ui).toBeDefined();
        // Null checks
        expect(ui.id).not.toBeNull();
        expect(ui.clientName).not.toBeNull();
        expect(ui.status).not.toBeNull();

        // Strict Types
        expect(typeof ui.clientCode).toBe('string');
        expect(typeof ui.clientName).toBe('string');
        expect(typeof ui.status).toBe('string');

        // Nested Steps
        expect(ui.steps).toBeDefined();
        expect(ui.steps.receipt).toBeDefined();
        expect(ui.steps.aiAnalysis).toBeDefined();
        // Verify a step
        expect(typeof ui.steps.receipt.state).toBe('string');

        // Actions
        expect(ui.primaryAction).toBeDefined();
        expect(typeof ui.primaryAction.isEnabled).toBe('boolean');

        // Arrays
        expect(Array.isArray(ui.lines)).toBe(true);
        if (ui.lines.length > 0) {
            expect(typeof ui.lines[0].lineNo).toBe('number');
            expect(typeof ui.lines[0].description).toBe('string');
            expect(ui.lines[0].debit).toBeDefined();
        }
    };

    it('Lv1: Handles Null / Undefined Input', () => {
        const result = mapJobApiToUi(null);
        assertIroncladContract(result);
        expect(result.id).toBe('missing_id');

        const result2 = mapJobApiToUi(undefined);
        assertIroncladContract(result2);
    });

    it('Lv2: Handles Type Destruction', () => {
        const result = mapJobApiToUi({
            id: 12345, // Should fail if strictly string, but mapper converts
            clientCode: true,
            status: 999, // Unknown status
            lines: "Not an array"
        } as any);
        assertIroncladContract(result);
        expect(result.id).toBe('12345');
        expect(result.status).toBe('unknown'); // Fallback
        expect(result.lines).toEqual([]); // Safe Array
    });

    it('Lv3: Handles Extreme Values', () => {
        const result = mapJobApiToUi({
            aiUsageStats: {
                inputTokens: Infinity,
                estimatedCostUsd: NaN
            }
        } as any);
        assertIroncladContract(result);
        expect(result.aiUsageStats.inputTokens).toBe(0); // Safe fallback
        expect(result.aiUsageStats.estimatedCostUsd).toBe(0); // NaN Safe
    });

    it('Lv4: Handles Adversarial Input', () => {
        const result = mapJobApiToUi({
            clientCode: '\u0000\u0000',
            clientName: 'DROP TABLE jobs;',
            status: 'admin_override'
        } as any);
        assertIroncladContract(result);
        expect(result.status).toBe('unknown'); // Invalid status enum
    });
});
