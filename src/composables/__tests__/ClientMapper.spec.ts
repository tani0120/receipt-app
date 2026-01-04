import { describe, it, expect } from 'vitest';
import type { ClientApi } from '@/types/zod.type';
import { mapClientApiToUi } from '@/composables/ClientMapper';

describe('ClientMapper Constitution (Ironclad Rules)', () => {

    it('Ironclad Rule 1: Exterminate Null/Undefined - Should return safe defaults', () => {
        const brokenApi: Partial<ClientApi> = {
            clientCode: 'CLI',
            companyName: 'Test Corp',
            // Missing other fields
        } as any;

        const ui = mapClientApiToUi(brokenApi as ClientApi);

        expect(ui.clientCode).toBe('CLI');
        expect(ui.companyName).toBe('Test Corp');
        expect(ui.repName).toBe('');
        expect(ui.contact.value).toBe('');
        expect(ui.fiscalMonth).toBe(1); // Default to 1
        expect(ui.fiscalMonthLabel).toBe('1月決算'); // UI helper
        expect(ui.status).toBe('active'); // Safe default
    });

    it('Ironclad Rule 2: Folder IDs Preservation - Should never return null/undefined for folders', () => {
        const brokenFolders: Partial<ClientApi> = {
            clientCode: 'CLI',
            companyName: 'Test Corp',
            processingFolderId: undefined, // Danger
        } as any;

        const ui = mapClientApiToUi(brokenFolders as ClientApi);
        expect(ui.processingFolderId).toBe('');
        expect(ui.sharedFolderId).toBe('');
    });

    it('Ironclad Rule 3: Enum & Logic Mapping - Should handle Tax Categories safely', () => {
        const apiWithTax: Partial<ClientApi> = {
            clientCode: 'TAX',
            companyName: 'Tax Corp',
            simplifiedTaxCategory: 3 as any, // 3rd category
        } as any;

        const ui = mapClientApiToUi(apiWithTax as ClientApi);

        expect(ui.simplifiedTaxCategory).toBe(3);
        expect(ui.simplifiedTaxCategoryLabel).toBe('第3種');
    });

    it('Ironclad Rule 3b: Enum Fallback - Should handle unknown/null Tax Categories', () => {
        const apiWithNullTax: Partial<ClientApi> = {
            clientCode: 'TAX',
            companyName: 'Tax Corp',
            simplifiedTaxCategory: null as any, // Explicit null
        } as any;

        const ui = mapClientApiToUi(apiWithNullTax as ClientApi);

        expect(ui.simplifiedTaxCategory).toBe(0); // 0 = None
        expect(ui.simplifiedTaxCategoryLabel).toBe('特になし'); // or "原則課税" depending on mode? No, just label for category itself.
    });

});
