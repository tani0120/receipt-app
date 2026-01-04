
import { ref } from 'vue';
import { client } from '@/client';

export interface DashboardKpiUi {
    monthlyJournals: number;
    autoConversionRate: number;
    aiAccuracy: number;
    funnel: {
        received: number;
        exported: number;
    };
}

export interface StaffPerformanceUi {
    name: string;
    backlogs: {
        total: number;
        draft: number;
    };
    velocity: {
        draftAvg: number;
    };
}

export interface AdminDashboardUi {
    kpi: DashboardKpiUi;
    staff: StaffPerformanceUi[];
}

export function useAdminDashboardRPC() {
    const adminData = ref<AdminDashboardUi | null>(null);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const fetchAdminData = async () => {
        isLoading.value = true;
        try {
            const res = await client.api.admin.dashboard.$get();
            if (!res.ok) throw new Error('Failed to fetch dashboard data');
            adminData.value = await res.json();
        } catch (e) {
            console.error(e);
            error.value = 'ダッシュボードデータの取得に失敗しました';
        } finally {
            isLoading.value = false;
        }
    };

    return {
        adminData,
        isLoading,
        error,
        fetchAdminData
    };
}
