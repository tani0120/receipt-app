/**
 * Phase A-2 v2: 証票分類 — コード側post-processing
 *
 * 層B: Gemini出力を入力として、コードで100%正確に判定する項目
 *   B1: classification_status — ステータス判定
 *   B2: tax_calculation_mismatch — 税計算検算
 *   B3: tax_calculation_detail — 検算式文字列
 *   B4: date_anomaly — 日付異常検出
 *   B5: date_anomaly_reason — 理由文字列
 *   B6: duplicate_suspect — 同バッチ内重複検出
 *   B7: debit_credit_mismatch — 貸借検算
 *   B8: debit_credit_detail — 検算式文字列
 */

import type {
    GeminiPreviewExtractResponse,
    ClassificationStatus,
    PostProcessResult,
} from './preview_extract_schema';
import { HandwrittenFlag } from './preview_extract_schema';

// ============================================================
// 定数
// ============================================================

/** 会計期間（個人事業主・暦年） */
const FISCAL_YEAR_START = '2025-01-01';
const FISCAL_YEAR_END = '2025-12-31';

/** Gemini 2.5 Flash料金（$/token、公式料金 2026-02）
 *  https://cloud.google.com/vertex-ai/generative-ai/pricing
 */
const PRICING = {
    promptTokens: 0.30 / 1_000_000,      // $0.30/M tokens
    completionTokens: 2.50 / 1_000_000,  // $2.50/M tokens
    thinkingTokens: 2.50 / 1_000_000,    // $2.50/M tokens（出力と同額）
};

// ============================================================
// B1: ステータス判定
// ============================================================

export function determineStatus(r: GeminiPreviewExtractResponse): ClassificationStatus {
    // 1. 対象外
    if (r.is_not_applicable) return 'excluded';

    // 2. 強制 needs_review（読取不可/2枚以上）
    if (r.has_multiple_vouchers) return 'needs_review';
    if (r.amount_unreadable) return 'needs_review';
    if (r.issuer_unreadable) return 'needs_review';
    if (r.date_unreadable) return 'needs_review';

    // 3. confidence低い
    if (r.voucher_type_confidence < 0.7) return 'needs_review';

    // 4. 主要項目の存在チェック
    const hasDate = r.date !== null;
    const hasAmount = r.total_amount !== null && r.total_amount > 0;
    const hasIssuer = r.issuer_name !== null;
    // 通帳/カード明細の場合、dateとtotal_amountはnullでもOK（line_itemsがある）
    const isBulkType = r.voucher_type === 'BANK_STATEMENT' || r.voucher_type === 'CREDIT_CARD';
    const hasLineItems = Array.isArray(r.line_items) && r.line_items.length > 0;

    if (!isBulkType && (!hasDate || !hasAmount || !hasIssuer)) return 'needs_review';
    if (isBulkType && !hasLineItems && !hasAmount) return 'needs_review';

    // 5. 税計算の整合性チェック
    if (checkTaxMismatch(r).mismatch) return 'needs_review';

    // 6. 貸借不一致チェック
    if (checkDebitCreditMismatch(r).mismatch) return 'needs_review';

    // 7. 日付異常はneeds_reviewにしない（情報提供のみ）
    // → 会計期間外でもauto_confirmedにする。日付異常はフラグで報告

    // 8. 高信頼度
    if (r.voucher_type_confidence >= 0.9) return 'auto_confirmed';

    return 'needs_review';
}

// ============================================================
// B2-B3: 税計算検算
// ============================================================

interface TaxCheckResult {
    mismatch: boolean;
    detail: string;
}

export function checkTaxMismatch(r: GeminiPreviewExtractResponse): TaxCheckResult {
    // 税エントリがない場合はチェック不要
    if (!r.tax_entries || r.tax_entries.length === 0) {
        return { mismatch: false, detail: '税エントリなし' };
    }

    // total_amountがnullの場合はチェック不可
    if (r.total_amount === null || r.total_amount === 0) {
        return { mismatch: false, detail: '合計金額なし（チェック不可）' };
    }

    const taxSum = r.tax_entries.reduce((sum, e) => sum + e.taxable_amount + e.tax_amount, 0);

    if (taxSum === r.total_amount) {
        // 各税率の内訳も含めた検算式
        const parts = r.tax_entries.map(e =>
            `${e.rate}%: ${e.taxable_amount}+${e.tax_amount}=${e.taxable_amount + e.tax_amount}`
        );
        return {
            mismatch: false,
            detail: `✅ ${parts.join(', ')} → 合計${taxSum}=${r.total_amount}`,
        };
    } else {
        const parts = r.tax_entries.map(e =>
            `${e.rate}%: ${e.taxable_amount}+${e.tax_amount}=${e.taxable_amount + e.tax_amount}`
        );
        return {
            mismatch: true,
            detail: `⚠️ ${parts.join(', ')} → 合計${taxSum}≠${r.total_amount} (差額${Math.abs(taxSum - r.total_amount)})`,
        };
    }
}

// ============================================================
// B4-B5: 日付異常検出
// ============================================================

interface DateCheckResult {
    anomaly: boolean;
    reason: string;
}

export function checkDateAnomaly(r: GeminiPreviewExtractResponse): DateCheckResult {
    if (r.date === null) {
        return { anomaly: false, reason: '日付なし' };
    }

    if (r.date < FISCAL_YEAR_START) {
        return {
            anomaly: true,
            reason: `${r.date} は期首${FISCAL_YEAR_START}より前`,
        };
    }

    if (r.date > FISCAL_YEAR_END) {
        return {
            anomaly: true,
            reason: `${r.date} は期末${FISCAL_YEAR_END}より後`,
        };
    }

    return { anomaly: false, reason: '期間内' };
}

// ============================================================
// B6: 同バッチ内重複検出
// ============================================================

interface DuplicateCheckResult {
    suspect: boolean;
    detail: string;
}

/**
 * 同バッチ内の他の結果と突合し、重複の疑いがあるか判定
 */
export function checkDuplicates(
    current: GeminiPreviewExtractResponse,
    currentIndex: number,
    allResults: GeminiPreviewExtractResponse[]
): DuplicateCheckResult {
    const suspects: string[] = [];

    for (let i = 0; i < allResults.length; i++) {
        if (i === currentIndex) continue;
        const other = allResults[i];
        if (!other) continue;

        // 条件: 日付 + 金額 + 発行者が全て一致
        const sameDate = current.date !== null && current.date === other.date;
        const sameAmount = current.total_amount !== null && current.total_amount === other.total_amount;
        const sameIssuer = current.issuer_name !== null && current.issuer_name === other.issuer_name;

        // T番号が同一
        const sameInvoiceNumber = current.invoice_registration_number !== null
            && current.invoice_registration_number === other.invoice_registration_number
            && current.invoice_registration_number !== '';

        if ((sameDate && sameAmount && sameIssuer) || sameInvoiceNumber) {
            suspects.push(`#${i + 1}と重複疑い`);
        }
    }

    if (suspects.length > 0) {
        return { suspect: true, detail: suspects.join(', ') };
    }

    return { suspect: false, detail: 'なし' };
}

// ============================================================
// B7-B8: 貸借検算
// ============================================================

interface DebitCreditCheckResult {
    mismatch: boolean;
    detail: string;
}

export function checkDebitCreditMismatch(r: GeminiPreviewExtractResponse): DebitCreditCheckResult {
    if (!r.journal_entry_suggestions || r.journal_entry_suggestions.length === 0) {
        return { mismatch: false, detail: '仕訳候補なし' };
    }

    const debitSum = r.journal_entry_suggestions
        .filter(e => e.entry_type === 'debit')
        .reduce((sum, e) => sum + e.amount, 0);

    const creditSum = r.journal_entry_suggestions
        .filter(e => e.entry_type === 'credit')
        .reduce((sum, e) => sum + e.amount, 0);

    if (debitSum === creditSum) {
        return {
            mismatch: false,
            detail: `✅ 借方${debitSum}=貸方${creditSum}`,
        };
    } else {
        return {
            mismatch: true,
            detail: `⚠️ 借方${debitSum}≠貸方${creditSum} (差額${Math.abs(debitSum - creditSum)})`,
        };
    }
}

// ============================================================
// API料金計算
// ============================================================

export interface TokenUsage {
    promptTokenCount: number;
    candidatesTokenCount: number;
    thoughtsTokenCount?: number;
}

export interface CostBreakdown {
    prompt_cost_usd: number;
    completion_cost_usd: number;
    thinking_cost_usd: number;
    total_cost_usd: number;
}

export function estimateCost(usage: TokenUsage): CostBreakdown {
    const prompt_cost_usd = usage.promptTokenCount * PRICING.promptTokens;
    const completion_cost_usd = usage.candidatesTokenCount * PRICING.completionTokens;
    const thinking_cost_usd = (usage.thoughtsTokenCount || 0) * PRICING.thinkingTokens;
    return {
        prompt_cost_usd,
        completion_cost_usd,
        thinking_cost_usd,
        total_cost_usd: prompt_cost_usd + completion_cost_usd + thinking_cost_usd,
    };
}

// ============================================================
// ラベル自動生成（22種から該当分）
// ============================================================

/**
 * Gemini出力 + PostProcess結果からlabels[]配列を生成。
 * ラベル定義: パイプライン対応表（人間用）Part 1 採用ラベル22個より。
 * RULE_APPLIED/RULE_AVAILABLEは層C依存のためスキップ。
 */
export function generateLabels(
    r: GeminiPreviewExtractResponse,
    taxMismatch: boolean,
    dateAnomaly: boolean,
    duplicateSuspect: boolean,
    dcMismatch: boolean,
): string[] {
    const labels: string[] = [];

    // --- 証票ラベル（7種）: voucher_typeそのまま ---
    labels.push(r.voucher_type);

    // --- 警告ラベル（10種） ---
    // 1. DEBIT_CREDIT_MISMATCH
    if (dcMismatch) labels.push('DEBIT_CREDIT_MISMATCH');
    // 2. TAX_CALCULATION_ERROR
    if (taxMismatch) labels.push('TAX_CALCULATION_ERROR');
    // 3. MISSING_FIELD: 値null + unreadable=false（欄自体が存在しない）
    if (r.date === null && !r.date_unreadable) labels.push('MISSING_FIELD');
    if (r.total_amount === null && !r.amount_unreadable) labels.push('MISSING_FIELD');
    if (r.issuer_name === null && !r.issuer_unreadable) labels.push('MISSING_FIELD');
    // 重複除去（複数フィールドで同じラベルが付く可能性）
    // 4. UNREADABLE_FAILED: unreadable=true + 値null
    if (r.date_unreadable && r.date === null) labels.push('UNREADABLE_FAILED');
    if (r.amount_unreadable && r.total_amount === null) labels.push('UNREADABLE_FAILED');
    if (r.issuer_unreadable && r.issuer_name === null) labels.push('UNREADABLE_FAILED');
    // 5. DUPLICATE_CONFIRMED: SHA256ハッシュ比較（層B内でのファイルハッシュ比較は別途実装予定）
    // → 現時点ではrunPostProcess内では未実装。ファイルハッシュの比較はpreviewExtract_test.ts側で行う必要あり。
    // 6. MULTIPLE_VOUCHERS
    if (r.has_multiple_vouchers) labels.push('MULTIPLE_VOUCHERS');
    // 7. DUPLICATE_SUSPECT
    if (duplicateSuspect) labels.push('DUPLICATE_SUSPECT');
    // 8. FUTURE_DATE
    if (dateAnomaly) labels.push('FUTURE_DATE');
    // 9. UNREADABLE_ESTIMATED: unreadable=true + 値あり（AIが推測で埋めた）
    if (r.date_unreadable && r.date !== null) labels.push('UNREADABLE_ESTIMATED');
    if (r.amount_unreadable && r.total_amount !== null) labels.push('UNREADABLE_ESTIMATED');
    if (r.issuer_unreadable && r.issuer_name !== null) labels.push('UNREADABLE_ESTIMATED');
    // 10. MEMO_DETECTED（MEANINGFULのみ発火）
    if (r.handwritten_flag === HandwrittenFlag.MEANINGFUL) labels.push('MEMO_DETECTED');

    // --- 制度ラベル（3種） ---
    // INVOICE_QUALIFIED / INVOICE_NOT_QUALIFIED（排他）
    if (r.invoice_registration_number !== null && r.invoice_registration_number !== '') {
        labels.push('INVOICE_QUALIFIED');
    } else {
        labels.push('INVOICE_NOT_QUALIFIED');
    }
    // MULTI_TAX_RATE
    if (r.has_multiple_tax_rates) labels.push('MULTI_TAX_RATE');

    // 重複除去して返す
    return [...new Set(labels)];
}

// ============================================================
// 統合: 全post-processing実行
// ============================================================

export function runPostProcess(
    geminiResult: GeminiPreviewExtractResponse,
    currentIndex: number,
    allResults: GeminiPreviewExtractResponse[],
    tokenUsage: TokenUsage
): PostProcessResult {
    const taxCheck = checkTaxMismatch(geminiResult);
    const dateCheck = checkDateAnomaly(geminiResult);
    const dupCheck = checkDuplicates(geminiResult, currentIndex, allResults);
    const dcCheck = checkDebitCreditMismatch(geminiResult);
    const status = determineStatus(geminiResult);
    const costBreakdown = estimateCost(tokenUsage);
    const labels = generateLabels(
        geminiResult,
        taxCheck.mismatch,
        dateCheck.anomaly,
        dupCheck.suspect,
        dcCheck.mismatch,
    );

    return {
        classification_status: status,
        tax_calculation_mismatch: taxCheck.mismatch,
        tax_calculation_detail: taxCheck.detail,
        date_anomaly: dateCheck.anomaly,
        date_anomaly_reason: dateCheck.reason,
        duplicate_suspect: dupCheck.suspect,
        duplicate_suspect_detail: dupCheck.detail,
        debit_credit_mismatch: dcCheck.mismatch,
        debit_credit_detail: dcCheck.detail,
        estimated_cost_usd: costBreakdown.total_cost_usd,
        labels,
    };
}
