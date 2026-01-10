import { ref } from 'vue';
import { receiptRepository } from '@/repositories/receiptRepository';
import { clientRepository } from '@/repositories/clientRepository';
import { mapWorkLogToJournalStatus } from '@/libs/adapters/v2_to_ui';
import type { JournalStatusUi } from '@/types/ScreenB_ui.type'; // Using the specific type for Screen B

export function useJournalStatusRPC() {
    // State
    const jobs = ref<JournalStatusUi[]>([]);
    const loading = ref(false);
    const error = ref<Error | null>(null);

    // Fetch Logic
    const fetchJournalStatus = async () => {
        loading.value = true;
        try {
            // V2 Migration: Fetch WorkLogs AND Clients (for name resolution)
            const [logs, clients] = await Promise.all([
                receiptRepository.getWorkLogs(50),
                clientRepository.getClients()
            ]);

            // Build Client Map (ID -> Name)
            const clientMap = new Map<string, string>();
            clients.forEach(c => {
                if (c.id) clientMap.set(c.id, c.name);
            });

            // Map to UI
            jobs.value = logs.map(log => mapWorkLogToJournalStatus(log, clientMap));

            console.log('[useJournalStatus] Fetched from V2 Repo:', jobs.value.length);
        } catch (err) {
            console.error('API Error:', err);
            error.value = err as Error;
        } finally {
            loading.value = false;
        }
    };

    return {
        journalStatusList: jobs,
        isLoading: loading,
        error,
        fetchJournalStatus
    };
}
