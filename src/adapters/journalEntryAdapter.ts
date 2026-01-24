/**
 * ============================================================
 * journalEntryAdapter.ts
 * ------------------------------------------------------------
 * Domain型 → UI型への変換アダプター
 * Step 4 Phase B: UI ↔ Domain型の隔離
 * ============================================================
 *
 * 責務:
 * - Zod.parse()済みのDomain型を受け取る
 * - UI表示用にフォーマット
 * - UIの"癖"を吸収（undefined/null対策）
 * - Domain型を汚染しない
 */

import type {
    JournalEntryDraft,
    JournalLineDraft
} from '@/features/journal';
import type {
    JournalEntryUI,
    JournalLineUI,
    JournalEntrySummaryUI
} from '@/types/JournalEntryUI';

/**
 * 日付フォーマット: YYYY-MM-DD → YYYY年MM月DD日
 */
function formatDate(date: string | undefined): string {
    if (!date) return '日付未設定';

    try {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}年${month}月${day}日`;
    } catch {
        return date; // パース失敗時は元の文字列
    }
}

/**
 * 金額フォーマット: 1000 → ¥1,000
 */
function formatAmount(amount: number | undefined): string {
    if (amount === undefined || amount === null) return '¥0';
    return `¥${amount.toLocaleString('ja-JP')}`;
}

/**
 * 仕訳明細行をUI型に変換
 */
export function mapLineToUI(line: JournalLineDraft): JournalLineUI {
    return {
        ...line,
        displayDebit: formatAmount(line.drAmount),
        displayCredit: formatAmount(line.crAmount),
        displayTaxAmount: formatAmount(line.taxAmountFinal),
        accountNameJa: line.drAccount || line.crAccount, // 簡易実装（後で拡張）
        vendorNameSafe: line.vendorName || '取引先未設定',
    };
}

/**
 * 仕訳エントリをUI型に変換
 *
 * @param entry - Zod.parse()済みのJournalEntryDraft
 * @returns UI表示用のJournalEntryUI
 */
export function mapToUI(entry: JournalEntryDraft): JournalEntryUI {
    // 合計金額の計算（明細行の借方合計）
    const totalAmount = entry.lines?.reduce((sum, line) => {
        return sum + (line.drAmount || 0);
    }, 0) || 0;

    return {
        ...entry,
        displayDate: formatDate(entry.date),
        displayAmount: formatAmount(totalAmount),
        linesUI: (entry.lines || []).map(mapLineToUI),
    };
}

/**
 * 仕訳エントリをサマリーUI型に変換
 *
 * @param entry - JournalEntryDraft
 * @returns 一覧表示用のサマリー
 */
export function mapToSummaryUI(entry: JournalEntryDraft): JournalEntrySummaryUI {
    // 合計金額の計算
    const totalAmount = entry.lines?.reduce((sum, line) => {
        return sum + (line.drAmount || 0);
    }, 0) || 0;

    // 警告数のカウント（簡易実装）
    const warningCount = entry.alerts?.length || 0;

    return {
        id: entry.id || 'unknown',
        displayDate: formatDate(entry.date),
        description: entry.description || '摘要未設定',
        displayAmount: formatAmount(totalAmount),
        status: entry.status as 'draft' | 'confirmed' | 'error' || 'draft',
        hasWarnings: warningCount > 0,
        warningCount,
    };
}

/**
 * UI型 → Domain型への変換（保存時用）
 *
 * @param entryUI - UI型（JournalEntryUI）
 * @returns Domain型（JournalEntryDraft）
 *
 * 注意: UI専用フィールド（displayDate等）は除外される
 */
export function mapToDomain(entryUI: JournalEntryUI): JournalEntryDraft {
    const { displayDate, displayAmount, linesUI, ...domainEntry } = entryUI;

    return {
        ...domainEntry,
        lines: linesUI?.map(lineUI => {
            const { displayDebit, displayCredit, displayTaxAmount, accountNameJa, vendorNameSafe, ...domainLine } = lineUI;
            return domainLine;
        }),
    };
}
