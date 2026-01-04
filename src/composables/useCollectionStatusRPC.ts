
import { ref } from 'vue';
import { client } from '@/client';

// Types (Mirrored from Zod)
export interface CollectionCellUi {
    monthIndex: number;
    year: number;
    month: number;
    isFiscalMonth: boolean;
    style: 'active-1' | 'active-2' | 'inactive';
    status: 'check' | 'cross' | 'triangle' | 'none' | 'future';
    isFuture: boolean;
}

export interface CollectionClientUi {
    jobId: string;
    code: string;
    name: string;
    fiscalMonth: number;
    type: 'corp' | 'individual';
    cells: CollectionCellUi[];
}

export interface CollectionConfigUi {
    cash: boolean;
    invoice: boolean;
    payroll: boolean;
    social: boolean;
}


export interface CollectionFileUi {
    id: string;
    name: string;
    timestamp: string;
    status: 'collected' | 'missing' | 'ignored';
    driveLink?: string;
}

export interface CollectionDetailUi {
    jobId: string;
    code: string;
    name: string;
    history: {
        year: number;
        month: number;
        status: 'check' | 'cross' | 'triangle' | 'none';
        files: CollectionFileUi[];
        memo?: string;
    }[];
}

export function useCollectionStatusRPC() {
    const clients = ref<CollectionClientUi[]>([]);
    const config = ref<CollectionConfigUi>({ cash: false, invoice: false, payroll: false, social: false });
    const viewYearStart = ref(2025);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    // Detail State
    const currentDetail = ref<CollectionDetailUi | null>(null);
    const isDetailLoading = ref(false);

    const fetchCollectionData = async (year: number) => {
        isLoading.value = true;
        error.value = null;
        try {
            const res = await client.api.collection.$get({ query: { year: String(year) } });
            if (!res.ok) throw new Error('Failed to fetch collection data');
            const data = await res.json();

            clients.value = data.clients;
            config.value = data.config;
            viewYearStart.value = data.viewYearStart;
        } catch (e) {
            console.error(e);
            error.value = 'データの取得に失敗しました';
        } finally {
            isLoading.value = false;
        }
    };

    const fetchClientDetail = async (code: string) => {
        isDetailLoading.value = true;
        currentDetail.value = null;
        try {
            const res = await client.api.collection[':code'].$get({ param: { code } });
            if (!res.ok) throw new Error('Failed to fetch detail');
            const data = await res.json();
            currentDetail.value = data as CollectionDetailUi;
        } catch (e) {
            console.error(e);
            alert('詳細データの取得に失敗しました');
        } finally {
            isDetailLoading.value = false;
        }
    };

    const updateConfig = async (newConfig: CollectionConfigUi) => {
        try {
            const res = await client.api.collection.config.$put({ json: newConfig });
            if (!res.ok) throw new Error('Failed to update config');
            const data = await res.json();
            config.value = data.config;
        } catch (e) {
            console.error(e);
            alert('設定の保存に失敗しました');
        }
    };

    return {
        clients,
        config,
        viewYearStart,
        isLoading,
        error,
        fetchCollectionData,
        updateConfig,
        // Detail Exports
        currentDetail,
        isDetailLoading,
        fetchClientDetail
    };
}

