
import { ref } from 'vue';
import { client } from '@/client'; // Hono RPC Client
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
            // RPC call to /api/journal-status
            const res = await client.api['journal-status']['$get']();

            if (res.ok) {
                // The API returns already mapped and validated JournalStatusUi[] objects
                const data = await res.json();

                // Type assertion might be needed if RPC types aren't fully inferred yet,
                // but Hono should provide good inference if client.ts is set up right.
                // Assuming data matches JournalStatusUi[] based on backend Zod schema.
                jobs.value = data as unknown as JournalStatusUi[];
            } else {
                throw new Error('Failed to fetch journal status');
            }
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
