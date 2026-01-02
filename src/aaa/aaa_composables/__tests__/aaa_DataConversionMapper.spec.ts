import { describe, it, expect } from 'vitest';
import { mapConversionLogApiToUi } from '../aaa_DataConversionMapper';

describe('aaa_DataConversionMapper (Ironclad Fuzzing)', () => {

    it('Should handle valid full data', () => {
        const input = {
            id: '123',
            timestamp: '2025/01/01 10:00',
            clientName: 'Test Client',
            sourceSoftware: 'Yayoi',
            targetSoftware: 'Freee',
            fileName: 'test.csv',
            size: 1024,
            downloadUrl: 'http://example.com/dl',
            isDownloaded: true
        };
        const output = mapConversionLogApiToUi(input);
        expect(output.id).toBe('123');
        expect(output.clientName).toBe('Test Client');
        expect(output.fileSize).toBe('1 KB');
        expect(output.isDownloadable).toBe(true);
        expect(output.rowStyle).toContain('bg-gray-50');
    });

    it('Should handle null/undefined input', () => {
        const output1 = mapConversionLogApiToUi(null);
        expect(output1.id).toBe('unknown');
        expect(output1.clientName).toBe('（名称未設定）');

        const output2 = mapConversionLogApiToUi(undefined);
        expect(output2.id).toBe('unknown');
    });

    it('Should handle empty/partial object', () => {
        const output = mapConversionLogApiToUi({});
        expect(output.id).toBe('unknown');
        expect(output.clientName).toBe('（名称未設定）');
        expect(output.sourceSoftwareLabel).toBe('不明');
        expect(output.fileSize).toBe('0 Bytes');
        expect(output.isDownloaded).toBe(false);
    });

    it('Should handle wrong types (Fuzzing)', () => {
        const input = {
            id: 12345, // Number instead of string
            timestamp: new Date(), // Object instad of string
            clientName: ['Invalid'], // Array
            size: 'Huge', // String instead of number
            isDownloaded: 'yes' // String instead of boolean
        };
        const output = mapConversionLogApiToUi(input);

        expect(output.id).toBe('unknown'); // Should reject number
        expect(output.timestamp).toBe('Invalid Date');
        expect(output.clientName).toBe('（名称未設定）');
        expect(output.fileSize).toBe('0 Bytes'); // Fallback for invalid size
        expect(output.isDownloaded).toBe(true); // Boolean('yes') is true, strictly checked? boolean(r.isDownloaded)
    });

    it('Should handle dangerous strings (XSS/Injection Sim)', () => {
        const dangerous = '<script>alert(1)</script>';
        const input = {
            clientName: dangerous,
            fileName: dangerous
        };
        const output = mapConversionLogApiToUi(input);

        expect(output.clientName).toBe(dangerous); // Mapper doesn't sanitize HTML (Vue handles it), but it must pass through string
        expect(output.fileName).toBe(dangerous);
    });

    it('Should handle extreme numbers', () => {
        const input = {
            size: 999999999999999, // Huge
        };
        const output = mapConversionLogApiToUi(input);
        expect(output.fileSize).toBe('> 1 TB');
    });

    it('Should handle negative numbers', () => {
        const input = {
            size: -100
        };
        const output = mapConversionLogApiToUi(input);
        expect(output.fileSize).toBe('0 Bytes');
    });
});
