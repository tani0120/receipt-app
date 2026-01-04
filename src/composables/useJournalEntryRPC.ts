import { ref } from 'vue';
import { client } from '@/client';
import type { JournalEntryUi, JournalLineUi } from '@/types/ui.type';

export function useJournalEntryRPC() {
    const journalEntry = ref<JournalEntryUi | null>(null);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    // Fetch Entry
    const fetchJournalEntry = async (id: string) => {
        isLoading.value = true;
        error.value = null;
        try {
            const res = await client.api['journal-entry'][':id'].$get({
                param: { id }
            });
            if (res.ok) {
                const data = await res.json();
                journalEntry.value = data as unknown as JournalEntryUi;
            } else {
                error.value = 'Failed to fetch journal entry';
            }
        } catch (e) {
            console.error(e);
            error.value = 'Network error';
        } finally {
            isLoading.value = false;
        }
    };

    // Update Entry
    const updateJournalEntry = async (id: string, payload: any) => {
        isLoading.value = true;
        try {
            const res = await client.api['journal-entry'][':id'].$put({
                param: { id },
                json: payload
            });
            if (res.ok) {
                const result = await res.json();
                return result;
            } else {
                throw new Error('Update failed');
            }
        } catch (e) {
            console.error(e);
            throw e;
        } finally {
            isLoading.value = false;
        }
    };

    return {
        journalEntry,
        isLoading,
        error,
        fetchJournalEntry,
        updateJournalEntry
    };
}
