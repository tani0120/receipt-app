import { describe, it, expect } from 'vitest';
import { mapClientDetailApiToUi } from '@/aaa/aaa_composables/aaa_ClientDetailMapper';

describe('ClientDetailMapper Ironclad Tests', () => {
    it('C-1: Handles null/undefined gracefully', () => {
        const result = mapClientDetailApiToUi(null);
        expect(result.clientCode).toBe('Unknown');
        expect(result.companyName).toBe('Unknown Client');
        expect(result.driveFolderLinks).toHaveLength(4);
        expect(result.driveFolderLinks[0].path).toBe('未連携');
    });

    it('C-1: Handles partial/corrupt data', () => {
        const input = {
            clientCode: 'TEST',
            consumptionTaxMode: 'invalid_mode', // Should default
            taxMethod: 123, // Type violation
            defaultTaxRate: 'HIGH', // Logic violation
            sharedFolderId: undefined
        };
        const result = mapClientDetailApiToUi(input);

        expect(result.clientCode).toBe('TEST');
        expect(result.consumptionTaxModeLabel).toBe('原則課税'); // Default
        expect(result.taxMethodExplicitLabel).toBe('税込経理'); // Default
        expect(result.defaultTaxRateLabel).toBe('10%'); // Default
        expect(result.driveFolderLinks[0].isLinked).toBe(false);
    });

    it('C-1: Handles long strings', () => {
        const longId = 'a'.repeat(100);
        const input = { sharedFolderId: longId };
        const result = mapClientDetailApiToUi(input);
        expect(result.driveFolderLinks[0].path.length).toBeLessThan(longId.length); // Should truncate or mask
        expect(result.driveFolderLinks[0].url).toContain(longId);
    });
});
