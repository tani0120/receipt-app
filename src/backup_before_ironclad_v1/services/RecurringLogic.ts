
import type { AccountBalance, DetectionAlert } from '@/types/detection';
import type { JournalLine } from '@/types/firestore';

/**
 * Identify missing monthly transactions based on history.
 * @param historyBalances - Aggregated monthly balances from General Ledger (past 12 months)
 * @param currentMonthLines - Processed journal lines for the current month
 * @returns List of missing items (alerts)
 */
export function analyzeRecurringTransactions(
    historyBalances: AccountBalance[],
    currentMonthLines: JournalLine[],
    currentMonth: number
): DetectionAlert[] {
    const alerts: DetectionAlert[] = [];
    const missingCandidates: string[] = [];

    // 1. Identify Recurring Accounts from History
    // Logic: Look for accounts that have activity (non-zero change) in almost every month (e.g., > 80% of months or last 3 consecutive months)
    // For simplicity V1: We look for specific "Fixed Cost" keywords or accounts that differ monthly.
    // Better V1 Logic: specific accounts like "地代家賃", "通信費", "リース料", "税理士報酬"

    const targetAccounts = ['地代家賃', '通信費', 'リース料', '支払手数料', '水道光熱費'];

    // Group history by Account Name to see frequency
    const accountFrequency = new Map<string, number>();
    historyBalances.forEach(b => {
        if (targetAccounts.some(t => b.accountName.includes(t)) && b.closingBalance !== 0) {
            // This is simplified. Ideally we need 'monthly movement', not just closing balance.
            // But GeneralLedgerService returns accumulating balance.
            // We need to infer movement or update GeneralLedgerService to return 'monthlyTurnover'.
            // For now, let's assume if it exists in history, we check it.
            const baseName = b.accountName.split('::')[0]; // Ignore sub-account for grouping? Or keep strictly?
            // Let's use strict Account Name
            accountFrequency.set(b.accountName, (accountFrequency.get(b.accountName) || 0) + 1);
        }
    });

    // 2. Check if present in Current Month
    accountFrequency.forEach((count, accountName) => {
        // If it appeared frequently in history (e.g., > 3 times), expect it this month
        if (count >= 3) {
            const existsNow = currentMonthLines.some(line =>
                line.drAccount === accountName ||
                line.description.includes(accountName) ||
                (line.drSubAccount && `${line.drAccount}::${line.drSubAccount}` === accountName)
            );

            if (!existsNow) {
                alerts.push({
                    id: `missing-${accountName}`,
                    category: 'ROUTINE',
                    title: '定例取引の欠落 (資料不足)',
                    message: `毎月発生している「${accountName}」の取引が今月見当たりません。領収書や通帳の確認が必要です。`,
                    severity: 'warning',
                    isResolved: false,
                    requiredMaterial: [accountName] // e.g., "地代家賃"
                });
            }
        }
    });

    return alerts;
}
