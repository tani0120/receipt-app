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
    GeminiClassifyResponse,
    ClassificationStatus,
    PostProcessResult,
} from './classify_schema';

// ============================================================
// 定数
// ============================================================

/** 会計期間 */
const FISCAL_YEAR_START = '2025-04-01';
const FISCAL_YEAR_END = '2026-03-31';

/** Gemini 2.5 Flash料金（$/token、2026-02時点概算） */
const PRICING = {
    promptTokens: 0.075 / 1_000_000,
    completionTokens: 0.30 / 1_000_000,
    thinkingTokens: 0.35 / 1_000_000,
};

// ============================================================
// B1: ステータス判定
// ============================================================

export function determineStatus(r: GeminiClassifyResponse): ClassificationStatus {
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

export function checkTaxMismatch(r: GeminiClassifyResponse): TaxCheckResult {
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

export function checkDateAnomaly(r: GeminiClassifyResponse): DateCheckResult {
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
    current: GeminiClassifyResponse,
    currentIndex: number,
    allResults: GeminiClassifyResponse[]
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

export function checkDebitCreditMismatch(r: GeminiClassifyResponse): DebitCreditCheckResult {
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

export function estimateCost(usage: TokenUsage): number {
    const promptCost = usage.promptTokenCount * PRICING.promptTokens;
    const completionCost = usage.candidatesTokenCount * PRICING.completionTokens;
    const thinkingCost = (usage.thoughtsTokenCount || 0) * PRICING.thinkingTokens;
    return promptCost + completionCost + thinkingCost;
}

// ============================================================
// 統合: 全post-processing実行
// ============================================================

export function runPostProcess(
    geminiResult: GeminiClassifyResponse,
    currentIndex: number,
    allResults: GeminiClassifyResponse[],
    tokenUsage: TokenUsage
): PostProcessResult {
    const taxCheck = checkTaxMismatch(geminiResult);
    const dateCheck = checkDateAnomaly(geminiResult);
    const dupCheck = checkDuplicates(geminiResult, currentIndex, allResults);
    const dcCheck = checkDebitCreditMismatch(geminiResult);
    const status = determineStatus(geminiResult);
    const cost = estimateCost(tokenUsage);

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
        estimated_cost_usd: cost,
    };
}
