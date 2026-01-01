import { describe, it, expect } from 'vitest';
import type { JobApi, JournalLineApi } from '@/aaa/aaa_types/aaa_zod.type';
import { mapJobApiToUi } from '@/aaa/aaa_composables/aaa_mapper';
// Note: mapJobApiToUi will be created in the next step.
// This test file defines the "Constitution" (Rules) that the implementation must follow.

describe('JobMapper Constitution (Ironclad Rules)', () => {

  // ==========================================================================
  // Rule 1: Null / Optional Extermination
  // UI must NEVER receive null or undefined.
  // ==========================================================================

  it('Ironclad Rule 1: Exterminate Null/Undefined - Should return safe defaults for missing fields', () => {
    // A completely broken API response with missing optional fields
    const brokenApi: Partial<JobApi> = {
      id: 'job_broken',
      // clientCode missing
      // status missing
      // lines missing
      // invoiceValidationLog missing
      // aiUsageStats missing
    } as any; // Force cast to simulate runtime incompleteness despite Types

    const ui = mapJobApiToUi(brokenApi as JobApi);

    // Assertions: UI Types must be safe
    expect(ui.id).toBe('job_broken');
    expect(ui.clientCode).toBe(''); // Default string
    expect(ui.status).toBe('unknown'); // Safe Enum Fallback
    expect(ui.lines).toEqual([]); // Empty Array, not undefined
    expect(ui.invoiceValidationLog).toBeDefined();
    expect(ui.invoiceValidationLog.isChecked).toBe(false);
    expect(ui.aiUsageStats).toBeDefined();
    expect(ui.aiUsageStats.inputTokens).toBe(0);
  });

  // ==========================================================================
  // Rule 2: Date Safety
  // UI must receive formatted strings (or safe objects), never Timestamp or null.
  // ==========================================================================

  it('Ironclad Rule 2: Date Safety - Should convert Timestamp to formatted string', () => {
    // Mocking a Firestore-like Timestamp object (or just strict structure check)
    const apiWithDate = {
      id: 'job_date',
      transactionDate: { seconds: 1704067200, nanoseconds: 0, toDate: () => new Date('2024-01-01T00:00:00Z') }, // 2024-01-01
      updatedAt: null, // Missing date
    } as unknown as JobApi;

    const ui = mapJobApiToUi(apiWithDate);

    // Valid Date String
    expect(ui.transactionDate).toMatch(/\d{4}\/\d{1,2}\/\d{1,2}/);
    // e.g., 2024/1/1 or 2024/01/01

    // Missing Date -> Default Placeholder
    expect(ui.updatedAt).toBe('—'); // Or "未設定"
  });

  // ==========================================================================
  // Rule 3: Business Logic Application (Tax Rates / Status)
  // Mapper interprets the data meaning.
  // ==========================================================================

  it('Ironclad Rule 3: Business Logic - Should handle unknown tax rates safely', () => {
    const apiWithWeirdTax = {
      id: 'job_tax',
      lines: [
        {
          lineNo: 1,
          drAmount: 1000,
          taxDetails: { rate: 7, type: 'taxable' } // 7% is invalid in current logic
        }
      ]
    } as unknown as JobApi;

    const ui = mapJobApiToUi(apiWithWeirdTax);

    expect(ui.lines[0].debit.taxRate).toBe('unknown'); // Fallback to 'unknown' if not 10, 8, or 0
  });

  it('Ironclad Rule 3: Status Aggregation - Should map unknown status to safe fallback', () => {
    const apiWithUnknownStatus = {
      id: 'job_status',
      status: 'super_processing_v2' // Unknown enum from API
    } as unknown as JobApi;

    const ui = mapJobApiToUi(apiWithUnknownStatus);

    expect(ui.status).toBe('unknown'); // or 'pending' fallback
    expect(ui.statusLabel).toBe('不明');
    expect(ui.statusColor).toBe('bg-gray-100 text-gray-800'); // Default styling
  });

  // ==========================================================================
  // Rule 4: Deep Structure Safety
  // Arrays and nested objects must be safeguarded.
  // ==========================================================================

  it('Ironclad Rule 4: Deep Structure - Should flatten or safeguard nested objects', () => {
    const apiWithNullLog = {
      id: 'job_deep',
      invoiceValidationLog: null // Explicit null from API
    } as unknown as JobApi;

    const ui = mapJobApiToUi(apiWithNullLog);

    expect(ui.invoiceValidationLog).not.toBeNull();
    expect(ui.invoiceValidationLog.isValid).toBe(false);
    expect(ui.invoiceValidationLog.registrationNumber).toBe('');
    expect(ui.invoiceValidationLog.checkedAtLabel).toBe('—'); // "未確認" -> Default Fallback
  });

});
