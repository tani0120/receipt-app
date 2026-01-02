
import { describe, it, expect } from 'vitest';
import { mapJournalStatusApiToUi } from '../aaa_JournalStatusMapper';
import type { JournalStatusUi } from '../../aaa_types/aaa_ScreenB_ui.type';

describe('aaa_JournalStatusMapper (Ironclad Fuzzing)', () => {

    // ----------------------------------------------------------------
    // Happy Path
    // ----------------------------------------------------------------
    it('should map valid Job data correctly', () => {
        const raw = {
            id: 'job_123',
            rowStyle: 'bg-white',
            clientName: 'Test Corp',
            clientCode: 'AAA',
            priority: 'high',
            softwareLabel: 'freee',
            fiscalMonthLabel: '3月',
            status: 'completed',
            steps: {
                receipt: { state: 'done', label: '受領済', count: 1 },
                aiAnalysis: { state: 'done', label: '解析済', count: 1 },
            },
            primaryAction: { type: 'approve', label: '承認', isEnabled: true },
        };

        const ui = mapJournalStatusApiToUi(raw);

        expect(ui.id).toBe('job_123');
        expect(ui.clientName).toBe('Test Corp');
        expect(ui.steps.receipt.state).toBe('done');
        expect(ui.primaryAction.type).toBe('approve');
    });

    // ----------------------------------------------------------------
    // Ironclad Contract: Null / Undefined Resistance
    // ----------------------------------------------------------------
    it('should return safe default object when input is null', () => {
        const ui = mapJournalStatusApiToUi(null);
        expect(ui.id).toBe('unknown');
        expect(ui.clientName).toBe('Error Loading'); // Default fallback
        expect(ui.steps.receipt.state).toBe('none');
    });

    it('should return safe default object when input is undefined', () => {
        const ui = mapJournalStatusApiToUi(undefined);
        expect(ui.clientName).toBe('Error Loading');
    });

    // ----------------------------------------------------------------
    // Partial / Broken Data
    // ----------------------------------------------------------------
    it('should handle partial object with missing nested fields', () => {
        const raw = {
            id: 'job_partial',
            // missing clientName, steps, etc.
        };
        const ui = mapJournalStatusApiToUi(raw);

        expect(ui.id).toBe('job_partial');
        expect(ui.clientName).toBe('Unknown Client'); // Safe fallback
        expect(ui.steps.receipt.state).toBe('none'); // Safe deep access
    });

    it('should handle broken types gracefully (number instead of string)', () => {
        const raw = {
            id: 99999, // Wrong type
            clientName: 12345, // Wrong type
        };
        const ui = mapJournalStatusApiToUi(raw);

        expect(ui.id).toBe('99999'); // Coerced to string
        expect(ui.clientName).toBe('12345'); // Coerced to string
    });

    // ----------------------------------------------------------------
    // Fuzzing / Attack
    // ----------------------------------------------------------------
    it('should survive malicious injection keys (prototype pollution attempt)', () => {
        const raw = JSON.parse('{"__proto__": {"isAdmin": true}, "clientName": "Hacker"}');
        const ui = mapJournalStatusApiToUi(raw);
        expect(ui.clientName).toBe('Hacker');
        // Function shouldn't crash
    });

    it('should survive array instead of object', () => {
        const raw = ["unexpected", "array"];
        const ui = mapJournalStatusApiToUi(raw);
        expect(ui.clientName).toBe('Unknown Client'); // Treated as partial obj
    });

});
