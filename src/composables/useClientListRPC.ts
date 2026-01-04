
import { ref, computed, onMounted } from 'vue';
import { client } from '@/client'; // Hono RPC Client
import type { ClientUi } from '@/types/ui.type';

// We must use the UI type because the API returns the mapped UI object (BFF)
// The previous logic used 'Client' which was likely an interface.
// We should check if 'Client' and 'ClientUi' are synonymous or if we need to align.
// For now, assuming Screen A expects ClientUi structure (which the API sends).

// Assuming ClientUi is the shape we want for 'clients'

export function useClientListRPC() {
    // State driven by API (BFF)
    const clients = ref<ClientUi[]>([]); // Typed as UI object
    const loading = ref(false);
    const error = ref<Error | null>(null);
    const searchQuery = ref('');

    // Modal State
    const isEditModalOpen = ref(false);
    const editingClient = ref<ClientUi | null>(null);

    // Fetch Logic (RPC)
    const fetchClients = async () => {
        loading.value = true;
        try {
            const res = await client.api.clients['$get']();
            if (res.ok) {
                // Hono RPC + Zod Type Inference
                const data = await res.json();
                clients.value = data as unknown as ClientUi[];
            } else {
                throw new Error('API Error');
            }
        } catch (err) {
            console.error('Failed to fetch clients:', err);
            error.value = err as Error;
        } finally {
            loading.value = false;
        }
    };

    // Lifecycle
    onMounted(() => {
        fetchClients();
    });

    // No subscription unsubscribe needed for RPC pull (unless we add polling)

    // Computed
    const totalCount = computed(() => clients.value.length);

    const filteredClients = computed(() => {
        if (!searchQuery.value) return clients.value;
        const q = searchQuery.value.toLowerCase();
        return clients.value.filter(c =>
            c.companyName.toLowerCase().includes(q) ||
            c.clientCode.toLowerCase().includes(q) ||
            (c.repName && c.repName.toLowerCase().includes(q))
        );
    });

    // Actions
    const openEditModal = (client: ClientUi) => {
        editingClient.value = { ...client };
        isEditModalOpen.value = true;
    };

    const closeEditModal = () => {
        isEditModalOpen.value = false;
        editingClient.value = null;
    };

    // Updated to use Hono RPC for PUT (BFF Action)
    const handleUpdateClient = async () => {
        if (!editingClient.value) return;

        // Find if this client allows editing (Validation against BFF-provided actions)
        // If frontend state is stale, we might be editing something we shouldn't.
        // But the Backend will reject it anyway.

        try {
            loading.value = true;
            const code = editingClient.value.clientCode;

            // Call PUT /:code
            const res = await client.api.clients[':code'].$put({
                param: { code },
                json: editingClient.value // Sending the whole object for now
            });

            if (res.ok) {
                const responseData = await res.json();
                console.log('Update Success:', responseData);

                // Refresh list to show changes (or optimistic update)
                await fetchClients();
                closeEditModal();
            } else {
                throw new Error('Update Failed');
            }
        } catch (err) {
            console.error('Update Error:', err);
            error.value = err as Error;
            // Optionally keep modal open to show error
        } finally {
            loading.value = false;
        }
    };

    // UI Helpers
    const isStatusActive = (c: ClientUi) => c.status === 'active';

    const getStatusLabel = (c: ClientUi) => {
        switch (c.status) {
            case 'active': return '契約中';
            case 'inactive': return '解約';
            case 'suspension': return '停止';
            default: return c.status;
        }
    };

    const getStatusClass = (c: ClientUi) => {
        switch (c.status) {
            case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'suspension': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const debugInjectClients = (badData: any[]) => {
        clients.value = badData;
    };

    return {
        clients,
        loading,
        error,
        searchQuery,
        totalCount,
        filteredClients,
        isEditModalOpen,
        editingClient,
        openEditModal,
        closeEditModal,
        handleUpdateClient,
        debugInjectClients,
        isStatusActive,
        getStatusLabel,
        getStatusClass
    };
}
