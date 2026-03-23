/**
 * GeminiClassifyResponse → JournalPhase5Mock 変換関数
 *
 * 目的: Gemini層A出力 + 層B後処理結果 → UI用仕訳データに変換
 * 準拠: ui_pipeline_mapping.md、journal_v2_20260214.md
 *
 * 依存方向:
 *   domain ← scripts（classify_schema） ← この関数
 *   domain ← mocks（journal_phase5_mock.type）← この関数
 */

import type { GeminiClassifyResponse, PostProcessResult } from './classify_schema';
import type { JournalPhase5Mock } from '@/mocks/types/journal_phase5_mock.type';
import type { JournalEntryLine } from '@/domain/types/journal';
import { type JournalLabel, VoucherType } from '@/domain/types/journal';
import type { Yen } from '@/shared/types/yen';

// ============================================================
// ID生成（接頭辞+連番、モジュールスコープ）
// ============================================================

let journalCounter = 0;
function generateJournalId(): string {
    journalCounter++;
    return 'jrn-' + String(journalCounter).padStart(8, '0');
}

// ============================================================
// メイン変換関数
// ============================================================

/**
 * Gemini出力 + PostProcess結果 → JournalPhase5Mock に変換
 */
export function transformToJournalMock(
    gemini: GeminiClassifyResponse,
    postprocess: PostProcessResult,
    displayOrder: number,
): JournalPhase5Mock {
    // --- entries[] → debit_entries[] / credit_entries[] 分離 ---
    const debitEntries = (gemini.journal_entry_suggestions ?? [])
        .filter(e => e.entry_type === 'debit')
        .map(toEntryLine);

    const creditEntries = (gemini.journal_entry_suggestions ?? [])
        .filter(e => e.entry_type === 'credit')
        .map(toEntryLine);

    // --- labels[] 構築（Set管理で重複排除） ---
    const labels = buildLabels(gemini, postprocess);

    // --- memo（証票メモ）---
    const memo = gemini.handwritten_memo_content ?? null;

    // --- invoice ---
    const invoiceStatus = gemini.invoice_registration_number
        ? 'qualified' as const
        : 'not_qualified' as const;

    return {
        id: generateJournalId(),
        display_order: displayOrder,
        voucher_date: gemini.date ?? '',
        date_on_document: true,
        description: gemini.description ?? '',
        voucher_type: gemini.voucher_type ?? null,

        document_id: null,
        line_id: null,

        debit_entries: debitEntries,
        credit_entries: creditEntries,

        status: null,
        is_read: false,
        deleted_at: null,

        labels,

        is_credit_card_payment: gemini.is_credit_card_payment,

        rule_id: null,
        rule_confidence: null,

        invoice_status: invoiceStatus,
        invoice_number: gemini.invoice_registration_number ?? null,

        memo,
        memo_author: null,
        memo_target: null,
        memo_created_at: null,
    };
}

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * JournalSuggestionEntry → JournalEntryLine に変換
 */
function toEntryLine(entry: {
    account: string;
    sub_account: string | null;
    tax_category: string;
    amount: number;
}): JournalEntryLine {
    return {
        account: entry.account,
        account_on_document: true,
        sub_account: entry.sub_account,
        amount: entry.amount as Yen,
        amount_on_document: true,
        tax_category_id: entry.tax_category,
    };
}

/**
 * VoucherType → JournalLabel マッピング
 * VoucherType定数をimportして使用。文字列ハードコード排除。
 */
const VOUCHER_TYPE_TO_LABEL: ReadonlyMap<string, JournalLabel> = new Map([
    [VoucherType.RECEIPT, 'RECEIPT'],
    [VoucherType.INVOICE, 'INVOICE'],
    [VoucherType.TRANSPORT, 'TRANSPORT'],
    [VoucherType.CREDIT_CARD, 'CREDIT_CARD'],
    [VoucherType.BANK_STATEMENT, 'BANK_STATEMENT'],
    [VoucherType.MEDICAL, 'MEDICAL'],
    [VoucherType.NOT_APPLICABLE, 'NOT_APPLICABLE'],
]);

/**
 * Gemini出力 + PostProcess結果 → labels[] を構築
 * Set管理で重複を排除。
 *
 * 構築順序:
 *   1. 証票種類ラベル（voucher_type → マッピング定数経由）
 *   2. 警告ラベル（PostProcessResult.labels から取得）
 *   3. 制度ラベル（is_invoice_qualified, has_multiple_tax_rates）
 *   4. 複数証票（has_multiple_vouchers → MULTIPLE_VOUCHERS）
 *   5. 医療費（is_medical_expense → MEDICAL）
 *   6. 対象外（is_not_applicable → NOT_APPLICABLE）
 */
function buildLabels(
    gemini: GeminiClassifyResponse,
    postprocess: PostProcessResult,
): JournalLabel[] {
    const labelSet = new Set<JournalLabel>();

    // 1. 証票種類ラベル（VoucherType定数経由）
    const voucherLabel = VOUCHER_TYPE_TO_LABEL.get(gemini.voucher_type);
    if (voucherLabel) labelSet.add(voucherLabel);

    // 2. 警告ラベル（PostProcessResult から取得）
    // PostProcessResult.labelsはstring[]。JournalLabel以外の値が入る可能性があるため検証する。
    for (const label of postprocess.labels) {
        if (isJournalLabel(label)) {
            labelSet.add(label);
        }
    }

    // 3. 制度ラベル
    if (gemini.invoice_registration_number) {
        labelSet.add('INVOICE_QUALIFIED');
    } else {
        labelSet.add('INVOICE_NOT_QUALIFIED');
    }
    if (gemini.has_multiple_tax_rates) {
        labelSet.add('MULTI_TAX_RATE');
    }

    // 4. 複数証票
    if (gemini.has_multiple_vouchers) {
        labelSet.add('MULTIPLE_VOUCHERS');
    }

    // 5. 医療費
    if (gemini.is_medical_expense) {
        labelSet.add('MEDICAL');
    }

    // 6. 対象外
    if (gemini.is_not_applicable) {
        labelSet.add('NOT_APPLICABLE');
    }

    return Array.from(labelSet);
}

/**
 * 文字列がJournalLabelかどうかを検証する型ガード
 * asキャストを排除し、不正ラベル文字列を弾く。
 */
const VALID_JOURNAL_LABELS = new Set<string>([
    // 証憑種類
    'RECEIPT', 'INVOICE', 'TRANSPORT', 'CREDIT_CARD', 'BANK_STATEMENT', 'MEDICAL', 'NOT_APPLICABLE',
    // 警告
    'DEBIT_CREDIT_MISMATCH', 'TAX_CALCULATION_ERROR', 'MISSING_FIELD', 'UNREADABLE_FAILED',
    'DUPLICATE_CONFIRMED', 'MULTIPLE_VOUCHERS', 'DUPLICATE_SUSPECT', 'DATE_OUT_OF_RANGE',
    'UNREADABLE_ESTIMATED', 'MEMO_DETECTED',
    // 制度系
    'MULTI_TAX_RATE', 'INVOICE_QUALIFIED', 'INVOICE_NOT_QUALIFIED',
    // ルール
    'RULE_APPLIED', 'RULE_AVAILABLE',
]);

function isJournalLabel(value: string): value is JournalLabel {
    return VALID_JOURNAL_LABELS.has(value);
}
