import { Timestamp } from 'firebase/firestore';
import type { Client as LegacyClient, Job as LegacyJob, JobStatus as LegacyJobStatus } from '../../types/firestore';
import type {
    ClientDocument,
    WorkLogDocument,
    ReceiptDocument,
    ProcessingStatus,
    DocumentId,
    UserId,
    ClientId,
    WorkLogType,
    CurrencyCode
} from '../../types/schema_v2';

// ============================================================================
// Helpers
// ============================================================================

function mapJobStatusToProcessingStatus(status: LegacyJobStatus): ProcessingStatus {
    switch (status) {
        case 'pending': return 'pending';
        case 'ai_processing': return 'processing';
        case 'ready_for_work': return 'human_review_required';
        case 'waiting_approval': return 'human_review_required';
        case 'approved': return 'completed';
        case 'done': return 'completed';
        case 'error_retry': return 'failed';
        case 'excluded': return 'completed';
        default: return 'pending';
    }
}

function ensureId(id: string): DocumentId {
    return id;
}

// 簡易的な合計計算ロジック（Legacyの型定義に依存しますが、安全にアクセスします）
function calculateLegacyAmount(lines: any[] | undefined): number {
    if (!lines || !Array.isArray(lines)) return 0;
    return lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
}

function calculateLegacyTax(lines: any[] | undefined): number {
    if (!lines || !Array.isArray(lines)) return 0;
    return lines.reduce((sum, line) => sum + (Number(line.taxAmount) || 0), 0);
}

// ============================================================================
// Converters
// ============================================================================

/**
 * Convert Legacy Client to V2 ClientDocument
 */
export function convertLegacyClient(old: LegacyClient): ClientDocument {
    const now = Timestamp.now();

    return {
        id: ensureId(old.clientCode),
        createdAt: old.updatedAt || now,
        updatedAt: old.updatedAt,
        version: 1,

        name: old.companyName,

        management: {
            is_active: old.status === 'active',
            person_in_charge_id: 'unknown_staff', // TODO: Default value applied
            contract_start_date: old.updatedAt,   // TODO: Default value applied
            tags: []
        },

        financials: {
            currency: 'JPY',
            default_tax_rate: old.defaultTaxRate || 0.10,
            closing_date_day: 99, // End of month
            payment_term_months: 1
        },

        current_month_stats: {
            sales_total: 0,
            job_count: 0,
            last_updated: now
        }
    };
}

/**
 * Convert Legacy Job to V2 WorkLogDocument (Focus on Time/Task)
 */
export function convertLegacyJobToWorkLog(old: LegacyJob): WorkLogDocument {
    const now = Timestamp.now();

    // Map Status for WorkLog
    let status: WorkLogDocument['status'] = 'draft';
    if (old.status === 'approved' || old.status === 'done') status = 'approved';
    else if (old.status === 'waiting_approval') status = 'submitted';

    // Calculate Duration
    let durationMinutes = 0;
    if (old.startedAt && old.finishedAt) {
        const diffMs = old.finishedAt.toMillis() - old.startedAt.toMillis();
        durationMinutes = Math.floor(diffMs / 1000 / 60);
    }

    return {
        id: ensureId(old.id),
        createdAt: old.createdAt,
        updatedAt: old.updatedAt,
        version: 1,

        clientId: old.clientCode,
        workerId: old.lockedByUserId || 'unknown_worker',

        title: `Legacy Job: ${old.id}`,
        description: `Imported from Legacy Job. Status: ${old.status}`,
        type: 'development', // TODO: Mapping needed based on content?

        time_entry: {
            start: old.startedAt || old.createdAt,
            end: old.finishedAt || null,
            duration_minutes: durationMinutes,
            is_billable: true
        },

        snapshot: {
            applied_hourly_rate: 0, // TODO: Needs connection to Client config
            calculated_cost: 0      // TODO: Calculate based on duration * rate
        },

        status: status
    };
}

/**
 * Convert Legacy Job to V2 ReceiptDocument (Focus on Data/OCR)
 */
export function convertLegacyJobToReceipt(old: LegacyJob): ReceiptDocument {
    // Try to aggregate lines for initial accounting data
    // @ts-ignore Legacy definition might vary, accessing loosely
    const lines = old.lines;
    const totalAmount = calculateLegacyAmount(lines);
    const totalTax = calculateLegacyTax(lines);

    return {
        id: ensureId(old.id), // Keeps same ID as WorkLog for traceability
        createdAt: old.createdAt,
        updatedAt: old.updatedAt,
        version: 1,

        uploaderId: 'unknown_uploader',

        system_meta: {
            original_filename: old.driveFileUrl || 'unknown_file',
            mime_type: 'application/pdf',
            file_size_bytes: 0,
            storage_path: old.driveFileId || '',
            hash: 'legacy_no_hash'
        },

        status: mapJobStatusToProcessingStatus(old.status),

        ocr_data: {
            provider: 'google_vision',
            raw_text_dump: old.aiAnalysisRaw || '',
            confidence_score: old.confidenceScore || 0,
            extracted_date: old.transactionDate?.toDate().toISOString().split('T')[0],
            extracted_amount: totalAmount, // Initial guess from lines
            merchant_candidate: ''
        },

        accounting_data: {
            confirmed_date: old.transactionDate || old.createdAt,
            confirmed_amount: totalAmount,
            tax_amount: totalTax,
            merchant_name: '', // TODO: extract from OCR or User input
            currency: 'JPY',

            invoice_registration_number: old.invoiceValidationLog?.registrationNumber || '',
            is_eligible_invoice: old.invoiceValidationLog?.isValid || false
        },

        metrics: {
            processing_time_ms: 0,
            retry_count: old.retryCount || 0
        },

        human_analytics: {
            modified_by_user: !!old.lockedByUserId,
            correction_distance: 0
        }
    };
}
