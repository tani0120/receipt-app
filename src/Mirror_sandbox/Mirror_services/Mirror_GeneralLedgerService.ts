
import * as XLSX from 'xlsx';
import type { AccountBalance } from '@/Mirror_sandbox/Mirror_types/Mirror_detection';
import { db } from '@/Mirror_sandbox/Mirror_firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';

interface LedgerRow {
    '日付': string | number;
    '借方勘定科目': string;
    '借方補助科目'?: string;
    '借方金額': number | string;
    '貸方勘定科目': string;
    '貸方補助科目'?: string;
    '貸方金額': number | string;
    '摘要'?: string;
}

export class GeneralLedgerService {
    /**
     * Parse General Ledger (or Journal) CSV/Excel and return AccountBalances
     */
    async parseLedgerFile(file: File, clientId: string, fiscalYear: number): Promise<AccountBalance[]> {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' }); // xlsx handles encoding usually
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error('No sheet found');
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) throw new Error('Sheet is empty');
        const rows: LedgerRow[] = XLSX.utils.sheet_to_json(sheet);

        // Map to store balances: Key = AccountID_SubAccountID
        const balanceMap = new Map<string, { [month: number]: number }>();

        rows.forEach(row => {
            const dateStr = this.parseDate(row['日付']);
            if (!dateStr) return;
            const date = new Date(dateStr);
            const month = date.getMonth() + 1; // 1-12

            // Normalize amounts
            const drAmount = Number(row['借方金額'] || 0);
            const crAmount = Number(row['貸方金額'] || 0);

            // Process Debit Side
            if (row['借方勘定科目']) {
                const key = this.getAccountKey(row['借方勘定科目'], row['借方補助科目']);
                this.updateBalance(balanceMap, key, month, drAmount); // Debit increases asset/expense
            }

            // Process Credit Side
            if (row['貸方勘定科目']) {
                const key = this.getAccountKey(row['貸方勘定科目'], row['貸方補助科目']);
                this.updateBalance(balanceMap, key, month, -crAmount); // Credit decreases asset/expense
            }
        });

        // Convert Map to AccountBalance list (Accumulating balances)
        const results: AccountBalance[] = [];
        balanceMap.forEach((monthlyChanges, key) => {
            let runningBalance = 0;
            // Iterate 1 to 12
            for (let m = 1; m <= 12; m++) {
                runningBalance += (monthlyChanges[m] || 0);

                const parts = key.split('::');
                const acc = parts[0];
                const sub = parts[1];

                results.push({
                    clientId,
                    fiscalYear,
                    month: m,
                    accountId: key,
                    accountName: sub ? `${acc} (${sub})` : acc,
                    closingBalance: runningBalance,
                    source: 'GL'
                });
            }
        });

        return results;
    }

    /**
     * Save AccountBalances to Firestore
     */
    async saveAccountBalances(clientId: string, balances: AccountBalance[]): Promise<void> {
        const batch = writeBatch(db);
        const balancesRef = collection(db, 'clients', clientId, 'account_balances');

        balances.forEach(balance => {
            // ID format: FY_Month_AccountID (e.g., 2025_01_Cash)
            // Sanitize AccountID for doc ID use
            const safeAccountId = balance.accountId.replace(/[:\/]/g, '_');
            const docId = `${balance.fiscalYear}_${String(balance.month).padStart(2, '0')}_${safeAccountId}`;
            const docRef = doc(balancesRef, docId);
            batch.set(docRef, balance);
        });

        await batch.commit();
        console.log(`Saved ${balances.length} balance records for client ${clientId}`);
    }

    private parseDate(val: string | number): string | null {
        if (!val) return null;
        // Handle Excel Serial Date
        if (typeof val === 'number') {
            const d = new Date(Math.round((val - 25569) * 86400 * 1000));
            return d.toISOString();
        }
        // Handle Strings (YYYY/MM/DD)
        return val.toString(); // Naive, assumes standard format
    }

    private getAccountKey(acc: string, sub?: string): string {
        return sub ? `${acc}::${sub}` : acc;
    }

    private updateBalance(map: Map<string, { [m: number]: number }>, key: string, month: number, amount: number) {
        if (!map.has(key)) map.set(key, {});
        const mData = map.get(key)!;
        mData[month] = (mData[month] || 0) + amount;
    }
}
