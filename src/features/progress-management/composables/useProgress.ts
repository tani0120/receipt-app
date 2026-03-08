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
// モックデータ定義（Phase B TODO: API化時に削除）
// =============================================

/** 顧問先ごとの仕訳数モックデータ（clientCodeで引く） */
const MOCK_JOURNAL_DATA: Record<string, {
    receivedDate: string;
    unexported: number;
    baseCount: number;
    currentYearJournals: number;
    lastYearJournals: number;
}> = {
    LDI: { receivedDate: '2026/03/01', unexported: 120, baseCount: 445, currentYearJournals: 445, lastYearJournals: 980 },
    ANE: { receivedDate: '', unexported: 0, baseCount: 446, currentYearJournals: 2680, lastYearJournals: 3120 },
    MHL: { receivedDate: '', unexported: 0, baseCount: 79, currentYearJournals: 79, lastYearJournals: 156 },
};

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

// =============================================
// Composable
// =============================================

export function useProgress() {
    const { clients: allClients } = useClients();
    const { staffList } = useStaff();
    const monthColumns = useMonthColumns(12);
    const isLoading = ref(false);

    // clientsからprogressRowsを生成（Single Source of Truth）
    const progressRows = computed<ProgressRow[]>(() => {
        const cols = monthColumns.value;

        return allClients.value.map(c => {
            const mock = MOCK_JOURNAL_DATA[c.clientCode];
            return {
                id: c.id,
                uuid: c.uuid,
                code: c.clientCode,
                status: c.status,
                type: c.type,
                fiscalMonth: c.fiscalMonth,
                companyName: c.companyName,
                staffName: c.staffName || '',
                receivedDate: mock?.receivedDate ?? '',
                unexported: mock?.unexported ?? 0,
                monthlyJournals: generateMonthlyData(cols, mock?.baseCount ?? 0),
                currentYearJournals: mock?.currentYearJournals ?? 0,
                lastYearJournals: mock?.lastYearJournals ?? 0,
            };
        });
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
