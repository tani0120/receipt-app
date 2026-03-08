/**
 * useProgress — 進捗管理 composable
 * Phase B TODO: モックデータを Supabase API (fetch) に差し替え
 * パターン: useClients / useStaff と同一構成
 */
import { ref, computed } from 'vue';
import { useClients } from '@/features/client-management/composables/useClients';
import { useStaff } from '@/features/staff-management/composables/useStaff';
import { useMonthColumns } from '../utils/monthColumns';
import type { ProgressRow, MonthColumn } from '../types';

// =============================================
// ヘルパー関数
// =============================================

/** モック用: 月次データ生成（API化時に削除） */
function generateMonthlyData(cols: MonthColumn[], baseCount: number): Record<string, number> {
    const data: Record<string, number> = {};
    if (baseCount === 0) {
        cols.forEach(c => { data[c.key] = 0; });
    } else {
        cols.forEach(c => {
            data[c.key] = Math.floor(Math.random() * baseCount * 0.3);
        });
    }
    return data;
}

/** モック行ファクトリ（API化時に削除） */
function mkRow(
    id: string, code: string, fm: number, name: string,
    staff: string, rd: string, unexp: number,
    cols: MonthColumn[], base: number, cur: number, last: number,
): ProgressRow {
    return {
        id, code, fiscalMonth: fm, companyName: name,
        staffName: staff, receivedDate: rd, unexported: unexp,
        monthlyJournals: generateMonthlyData(cols, base),
        currentYearJournals: cur, lastYearJournals: last,
    };
}

// =============================================
// Composable
// =============================================

export function useProgress() {
    const { clients: allClients } = useClients();
    const { staffList } = useStaff();
    const monthColumns = useMonthColumns(12);
    const isLoading = ref(false);

    // Phase B TODO: Supabase API fetch に差し替え
    const progressRows = computed<ProgressRow[]>(() => {
        const cols = monthColumns.value;

        const existing: ProgressRow[] = allClients.value.map(c => ({
            id: c.id,
            code: c.clientCode,
            fiscalMonth: c.fiscalMonth,
            companyName: c.companyName,
            staffName: c.staffName || '',
            receivedDate: '',
            unexported: 0,
            monthlyJournals: generateMonthlyData(cols, 0),
            currentYearJournals: 0,
            lastYearJournals: 0,
        }));

        const imageRows = [
            { id: 'JTR', code: 'JTR', fm: 3, name: 'JTR', staff: '', rd: '', unexp: 0, base: 0, cur: 0, last: 0 },
            { id: 'AMT', code: 'AMT', fm: 12, name: 'AMT', staff: '', rd: '', unexp: 0, base: 0, cur: 0, last: 0 },
            { id: 'ANE', code: 'ANE', fm: 9, name: 'ANE', staff: '', rd: '', unexp: 0, base: 446, cur: 2680, last: 3120 },
            { id: 'ORDER', code: 'ORD', fm: 6, name: 'ORDER壱口店 吉井芳然', staff: '', rd: '', unexp: 0, base: 0, cur: 0, last: 0 },
            { id: 'EDL', code: 'EDL', fm: 3, name: 'EDL', staff: '', rd: '', unexp: 0, base: 0, cur: 0, last: 0 },
            { id: 'FPC', code: 'FPC', fm: 12, name: 'FPC', staff: '', rd: '', unexp: 0, base: 0, cur: 0, last: 0 },
            { id: 'GAC', code: 'GAC', fm: 3, name: 'GAC', staff: '', rd: '', unexp: 0, base: 0, cur: 0, last: 0 },
            { id: 'HIR', code: 'HIR', fm: 6, name: 'HIR', staff: '', rd: '', unexp: 0, base: 0, cur: 0, last: 0 },
            { id: 'KFP', code: 'KFP', fm: 9, name: 'KFP', staff: '', rd: '', unexp: 0, base: 0, cur: 0, last: 0 },
            { id: 'KHK', code: 'KHK', fm: 12, name: 'KHK', staff: '', rd: '', unexp: 0, base: 0, cur: 0, last: 0 },
            { id: 'LDI', code: 'LDI', fm: 3, name: 'LDI', staff: '', rd: '2026/03/01', unexp: 120, base: 445, cur: 445, last: 980 },
            { id: 'LIG', code: 'LIG', fm: 6, name: 'LIG', staff: '', rd: '', unexp: 0, base: 0, cur: 0, last: 0 },
            { id: 'MHL', code: 'MHL', fm: 9, name: 'MHL', staff: '', rd: '', unexp: 0, base: 79, cur: 79, last: 156 },
            { id: 'MUKU', code: 'MUK', fm: 12, name: 'MUKU', staff: '', rd: '', unexp: 0, base: 0, cur: 0, last: 0 },
            { id: 'NDF', code: 'NDF', fm: 3, name: 'NDF', staff: '', rd: '', unexp: 0, base: 0, cur: 0, last: 0 },
            { id: 'NOV', code: 'NOV', fm: 6, name: 'NOV', staff: '', rd: '', unexp: 0, base: 0, cur: 0, last: 0 },
            { id: 'QRN', code: 'QRN', fm: 9, name: 'QRN', staff: '', rd: '', unexp: 0, base: 0, cur: 0, last: 0 },
        ];

        const imageData: ProgressRow[] = imageRows.map(r =>
            mkRow(r.id, r.code, r.fm, r.name, r.staff, r.rd, r.unexp, cols, r.base, r.cur, r.last),
        );

        return [...existing, ...imageData];
    });

    /** ソート値取得（月列 "month_2025-04" 形式に対応） */
    function getSortValue(row: ProgressRow, key: string): string | number {
        if (key.startsWith('month_')) {
            const monthKey = key.replace('month_', '');
            return row.monthlyJournals[monthKey] || 0;
        }
        return (row as unknown as Record<string, string | number>)[key] ?? '';
    }

    return {
        progressRows,
        monthColumns,
        staffList,
        isLoading,
        getSortValue,
    };
}
