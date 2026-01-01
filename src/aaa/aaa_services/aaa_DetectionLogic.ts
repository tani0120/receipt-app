import type { JournalLine } from '@/aaa/aaa_types/aaa_firestore';
import type {
    AccountBalance,
    InstitutionFingerprint,
    DetectionAlert
} from '@/aaa/aaa_types/aaa_detection';

/**
 * DetectionLogic Service
 * Implements the "Comprehensive Detection Logic Matrix" defined in the design.
 */

// ============================================================================
// 1. Financial Institution Identification (Balance Continuity)
// ============================================================================

export function identifyInstitutionByBalance(
    detectedStartBalance: number,
    detectedEndBalance: number,
    historyBalances: AccountBalance[]
): string | null {
    // Logic: Find an account where Previous Month's End Balance == Current Start Balance
    // or Current Month's End Balance matches known history (if parallel processing).

    // Strongest Match: Start Balance == Prev End Balance
    const exactMatch = historyBalances.find(b => Math.abs(b.closingBalance - detectedStartBalance) < 1);

    if (exactMatch) {
        return exactMatch.accountId; // Return the specific General Ledger Account ID
    }

    return null;
}

export function identifyInstitutionByFingerprint(
    text: string,
    colors: string[],
    fingerprints: InstitutionFingerprint[]
): { id: string; confidence: number } | null {
    let bestMatch = null;
    let maxScore = 0;

    for (const fp of fingerprints) {
        let score = 0;
        // 1. Keyword Match
        const keywordHits = fp.features.keywords.filter(k => text.includes(k)).length;
        score += keywordHits * 0.3;

        // 2. Color Match (Simplified placeholder)
        if (colors.some(c => fp.features.primaryColors.includes(c))) {
            score += 0.2;
        }

        if (score > maxScore && score > 0.4) {
            maxScore = score;
            bestMatch = fp.id;
        }
    }

    return bestMatch ? { id: bestMatch, confidence: maxScore } : null;
}


// ============================================================================
// 2. Extended Detection Matrix (Risk, Clarification, AR/AP)
// ============================================================================

// Local type extension to include data usually found in the parent 'Job' or 'Enriched' context
export interface EnrichedLine extends JournalLine {
    transactionDate?: string | Date; // Optional, used for duplicate checking
}

export interface FiscalContext {
    fiscalYearStart: Date;
    fiscalYearEnd: Date;
    knownVendors?: Set<string>; // For First Time Transaction check
}

export function analyzeDetectionMatrix(item: EnrichedLine, allItems: EnrichedLine[], fiscalInfo?: FiscalContext): DetectionAlert[] {
    const alerts: DetectionAlert[] = [];

    // ========================================================================
    // A. Asset & Finance
    // ========================================================================
    // 1. New Loan (>1M JPY from non-sales source)
    if (item.crAmount > 1000000 && !item.crAccount.includes('売上')) {
        alerts.push({
            id: `loan-${item.lineNo}`,
            category: 'ASSET_FINANCE',
            title: '融資の可能性 (大口入金)',
            message: '100万円以上の入金です。借入金可能性があります。返済予定表・契約書が必要です。',
            severity: 'warning',
            isResolved: false
        });
    }

    // 2. Asset Purchase (>300k JPY expense)
    if (item.drAmount > 300000 && ['消耗品費', '雑費', '備品費'].includes(item.drAccount)) {
        alerts.push({
            id: `asset-${item.lineNo}`,
            category: 'ASSET_FINANCE',
            title: '資産計上の可能性 (高額出金)',
            message: '30万円超の支出です。固定資産への計上が必要か確認してください（見積書・カタログ等）。',
            severity: 'warning',
            isResolved: false
        });
    }

    // ========================================================================
    // B. Clarification
    // ========================================================================
    // 5. Ambiguous Detail (Composite vendors)
    // 5. Ambiguous Detail (Composite vendors & Payment Platforms)
    const ambiguousKeywords = [
        // EM/EC (Major Platforms)
        'Amazon', 'Rakuten', 'Askul', 'Monotaro', 'Yahoo', 'Mercari',
        'アマゾン', '楽天', 'アスクル', 'モノタロウ', 'ヤフー', 'メルカリ',
        'Qoo10', 'ZOZO', 'Shopify', 'BASE', 'STORES',
        // Payment Platforms & Gateways
        'PayPal', 'Stripe', 'Square', 'GMO', 'SB Payment', 'ROBOT PAYMENT',
        'ペイパル', 'ストライプ', 'スクエア',
        // QR/Electronics & Points
        'PayPay', 'LinePay', 'Merpay', 'Suica', 'Pasmo', 'Icoca',
        'ペイペイ', 'ラインペイ', 'メルペイ', 'スイカ', 'パスモ',
        'd払い', 'au PAY', 'R Pay', '楽天ペイ', 'Pay-easy',
        // Credit Card Common Ambiguous Descriptors
        'VISA', 'MASTER', 'JCB', 'AMEX', 'DINERS', 'CARD',
        'VISA DEBIT', 'Mastercard', 'J-Debit',
        'ETC', 'VIEW', 'LUMINE', 'AEON',
        // Subscription / Tech Services (often mixed)
        'Google', 'Apple', 'Adobe', 'Microsoft', 'Zoom', 'AWS', 'Xserver',
        'グーグル', 'アップル', 'アドビ', 'マイクロソフト',
        // Mobile Carriers (often mixed with payments)
        'SoftBank', 'KDDI', 'NTT DOCOMO', 'NTT FINANCE',
        'ソフトバンク', 'ドコモ', 'NTTファイナンス'
    ];

    if (ambiguousKeywords.some(k => item.description.includes(k))) {
        alerts.push({
            id: `ambiguous-${item.lineNo}`,
            category: 'CLARIFICATION',
            title: '明細不明 (複合・決済サービス)',
            message: '決済サービスまたはECサイトのため内容が不明です。購入明細（Invoice）や内訳書を添付してください。',
            severity: 'info',
            isResolved: false
        });
    }

    // 7. Entertainment Checks (>5,000 JPY)
    if (item.drAmount > 5000 && ['交際費', '会議費'].includes(item.drAccount)) {
        alerts.push({
            id: `ent-${item.lineNo}`,
            category: 'CLARIFICATION',
            title: '交際費・会議費の確認',
            message: '参加者、人数、目的の記録が必要です（5,000円基準/損金算入判定のため）。',
            severity: 'info',
            isResolved: false
        });
    }

    // 8. Insurance/Donation
    if (['保険料', '寄付金'].includes(item.drAccount) || ['生命', '損保', 'NPO', '協会'].some(k => item.description.includes(k))) {
        alerts.push({
            id: `ins-don-${item.lineNo}`,
            category: 'CLARIFICATION',
            title: '保険・寄付の詳細確認',
            message: '証券内容（法人/個人受取）や寄付先の詳細確認が必要です。',
            severity: 'info',
            isResolved: false
        });
    }

    // ========================================================================
    // C. Compliance (Risk)
    // ========================================================================
    // 9. Double Payment Check (Same amount, same payee, within 7 days approx - simplified here)
    // Note: requires scanning 'allItems'. This is computationally heavy if allItems is large.
    // Optimization: Trigger this only if amount is specific or round number.
    const duplicate = allItems.find(other =>
        other.lineNo !== item.lineNo &&
        other.drAmount === item.drAmount &&
        other.drAmount > 0 &&
        other.description === item.description
    );
    if (duplicate) {
        alerts.push({
            id: `double-${item.lineNo}`,
            category: 'COMPLIANCE',
            title: '二重払いの可能性',
            message: `類似の支払が別日 (${duplicate.transactionDate}) に存在します。重複ではありませんか？`,
            severity: 'warning',
            isResolved: false
        });
    }

    // 10. Invoice System (T-Number check)
    // We check if the amount is significant (> 10,000) and if T-Number metadata is explicitly false.
    // If metadata is undefined, we assume we don't know yet (no alert).
    if (item.metadata && item.metadata.hasTNumber === false && item.drAmount > 10000 && !['給料手当', '法定福利費'].includes(item.drAccount)) {
        alerts.push({
            id: `invoice-${item.lineNo}`,
            category: 'COMPLIANCE',
            title: 'インボイス登録番号の不在',
            message: '請求書に登録番号（T番号）が見当たりません。経過措置（80%控除）の確認が必要です。',
            severity: 'warning',
            isResolved: false
        });
    }

    // 11. Withholding Tax (Professional Fees)
    if (['報酬', '外注費'].includes(item.drAccount) && item.drAmount > 50000) {
        // Simple heuristic for individual name detection could go here
        alerts.push({
            id: `withhold-${item.lineNo}`,
            category: 'COMPLIANCE',
            title: '源泉徴収の確認',
            message: '個人への支払の場合、源泉徴収が必要な可能性があります。',
            severity: 'warning',
            isResolved: false
        });
    }

    // 12. Period Cutoff
    if (item.transactionDate && fiscalInfo) {
        const tDate = new Date(item.transactionDate);
        if (tDate < fiscalInfo.fiscalYearStart || tDate > fiscalInfo.fiscalYearEnd) {
            alerts.push({
                id: `cutoff-${item.lineNo}`,
                category: 'COMPLIANCE',
                title: '期ズレ (Cutoff) の可能性',
                message: '日付が決算期間外です。未払金/前払金として処理するか、除外が必要です。',
                severity: 'warning',
                isResolved: false
            });
        }
    }

    // ========================================================================
    // D. AR / AP (Accrual Basis)
    // ========================================================================
    // 15. During-Term AR/AP Reconciliation (Accrual Rec)
    // If Cash/Bank increases and no AR decrease found, OR Expense increases w/o AP increase?
    // Actually, simple logic: IF Input is Deposit, AND Description matches an outstanding AR customer.
    // Simplifying: If `item` is deposit (Dr=Cash/Bank), look for Sales/AR in `allItems`.
    // Reverse: If `item` is withdrawal (Cr=Cash/Bank), look for Expense/AP.

    // For this prototype, let's implement the specific logic:
    // "期中に発生した売掛金・買掛金の入出金消込候補を表示"
    // Use Case: User books "Sales" (AR) on Jan 10. User books "Deposit" on Jan 31.
    // If Deposit is recorded as "Sales" (Cash Basis) instead of "AR Collection" (Accrual), Flag it.

    if (['普通預金', '現金', '当座預金'].includes(item.drAccount) && item.crAccount.includes('売上')) {
        // Suspicious: Cash Basis recording in Accrual context
        // Check if there is an AR for this client (simplified check)
        alerts.push({
            id: `accrual-ar-${item.lineNo}`,
            category: 'AR_AP',
            title: '売掛金の消込提案 (発生主義)',
            message: '売上として計上されていますが、発生主義の場合は「売掛金」の回収入力が必要です。',
            severity: 'info',
            isResolved: false
        });
    }

    if (['普通預金', '現金', '当座預金'].includes(item.crAccount) && ['仕入', '消耗品費', '外注費'].includes(item.drAccount)) {
        // Suspicious: Cash Basis payment in Accrual context
        alerts.push({
            id: `accrual-ap-${item.lineNo}`,
            category: 'AR_AP',
            title: '買掛金の消込提案 (発生主義)',
            message: '費用として計上されていますが、発生主義の場合は「買掛金/未払金」の支払入力が必要です。',
            severity: 'info',
            isResolved: false
        });
    }


    // 6. Funds Transfer Suspicion
    const transferKeywords = ['振替', '移動', '自分', '資金移動'];
    if (transferKeywords.some(k => item.description.includes(k)) && (item.drAmount > 0 || item.crAmount > 0)) {
        alerts.push({
            id: `transfer-${item.lineNo}`,
            category: 'CLARIFICATION',
            title: '資金移動の確認',
            message: '「振替」等のキーワードが含まれています。売上・経費ではなく「資金移動（預金振替）」ではありませんか？',
            severity: 'info',
            isResolved: false
        });
    }

    // 4. First Time Transaction
    // If we have historyContext, checks if vendor is new.
    if (fiscalInfo && fiscalInfo.knownVendors && item.description) {
        // Simplified vendor name extraction (naive)
        // Ideally we use a named entity recognition or pre-processed vendor field.
        // For now, check if description partially matches any known vendor.
        const isKnown = Array.from(fiscalInfo.knownVendors).some(v => item.description.includes(v));

        // Only trigger if description is long enough to be a name and not a generic keyword
        if (!isKnown && item.description.length > 3) {
            alerts.push({
                id: `new-vendor-${item.lineNo}`,
                category: 'ASSET_FINANCE',
                title: '新規取引先の検出',
                message: '過去の取引実績がありません。科目は「消耗品費」で提案してよろしいですか？',
                severity: 'info',
                isResolved: false
            });
        }
    }

    return alerts;
}

export function checkSeasonalList(month: number): string[] {
    const suggestions = [];
    if (month === 5) suggestions.push('自動車税納付書'); // May
    if (month === 6) suggestions.push('労働保険申告書'); // June
    if (month === 12) suggestions.push('年末調整関係書類'); // Dec
    return suggestions;
}


