
import { describe, it, expect } from 'vitest';
import { mapClientApiToUi } from '../aaa_composables/aaa_ClientMapper';
import type { ClientUi } from '../aaa_types/aaa_ui.type';

// Phase C: Ironclad Contract - Mapper Stress Test (Lv4)
describe('Phase C: ClientMapper Ironclad Test', () => {

    // Helper to check ironclad contract properties
    const assertIroncladContract = (ui: ClientUi) => {
        expect(ui).toBeDefined();
        expect(ui).not.toBeNull();

        // String fields must be strings (normalized)
        expect(typeof ui.clientCode).toBe('string');
        expect(typeof ui.companyName).toBe('string');
        expect(typeof ui.repName).toBe('string');

        // Mapped Labels
        expect(typeof ui.fiscalMonthLabel).toBe('string');
        expect(typeof ui.softwareLabel).toBe('string');
        expect(typeof ui.taxInfoLabel).toBe('string');

        // No "undefined" strings
        expect(ui.clientCode).not.toBe('undefined');
        expect(ui.companyName).not.toBe('undefined');

        // Nested Strictness
        expect(ui.contact).toBeDefined();
        expect(typeof ui.contact.type).toBe('string');
        expect(typeof ui.contact.value).toBe('string');

        expect(ui.driveLinks).toBeDefined();
        expect(typeof ui.driveLinks.storage).toBe('string');
    };

    it('Lv1: Handles Null / Undefined / Missing Keys', () => {
        const result = mapClientApiToUi(null as any);
        assertIroncladContract(result);
        expect(result.companyName).toContain('Unknown'); // Safe Fallback

        const result2 = mapClientApiToUi(undefined as any);
        assertIroncladContract(result2);

        const result3 = mapClientApiToUi({} as any);
        assertIroncladContract(result3);
    });

    it('Lv2: Handles Type Destruction (Number/Bool in String fields)', () => {
        const result = mapClientApiToUi({
            clientCode: 12345,
            companyName: true,
            repName: { complex: 'object' },
            fiscalMonth: 'NotANumber',
            status: 999
        } as any);
        assertIroncladContract(result);
        // Ensure normalization
        expect(result.clientCode).toBe('12345');
        expect(result.companyName).toBe('true');
    });

    it('Lv3: Handles Extreme Values', () => {
        const result = mapClientApiToUi({
            fiscalMonth: 999999, // Should default to safe month or clamp
        } as any);
        assertIroncladContract(result);
    });

    it('Lv4: Handles Adversarial Input (NaN, Infinity, Control Chars)', () => {
        const inputs = [
            NaN, Infinity, -Infinity,
            '\u0000', '\n\t\r',
            'javascript:alert(1)',
            'DROP TABLE clients;'
        ];

        inputs.forEach(input => {
            const result = mapClientApiToUi({
                clientCode: input,
                companyName: input
            } as any);
            assertIroncladContract(result);
        });
    });

    it('Lv4: Handles Long Text (10,000 chars)', () => {
        const longPath = 'A'.repeat(10000);
        const result = mapClientApiToUi({
            companyName: longPath
        } as any);
        assertIroncladContract(result);
        expect(result.companyName.length).toBe(10000);
    });
});
