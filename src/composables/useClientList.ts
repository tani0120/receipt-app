import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ClientService } from '@/services/ClientService';
import type { Client } from '@/types/client';

export function useClientList() {
    // State
    const clients = ref<Client[]>([]);
    const loading = ref(false);
    const error = ref<Error | null>(null);
    const searchQuery = ref('');

    // Modal State
    const isEditModalOpen = ref(false);
    const editingClient = ref<Client | null>(null);

    // Subscription handle
    let unsubscribe: (() => void) | null = null;

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

    // Lifecycle
    onMounted(() => {
        loading.value = true;
        unsubscribe = ClientService.subscribeClientList(
            (data) => {
                clients.value = data;
                loading.value = false;
            },
            (err) => {
                error.value = err;
                loading.value = false;
            }
        );
    });

    onUnmounted(() => {
        if (unsubscribe) {
            unsubscribe();
        }
    });

    // Actions
    const openEditModal = (client: Client) => {
        // Clone object to prevent direct mutation of the list item before saving
        editingClient.value = { ...client };
        isEditModalOpen.value = true;
    };

    const closeEditModal = () => {
        isEditModalOpen.value = false;
        editingClient.value = null;
    };

    /**
     * Handle updating client data
     * This relies on editingClient state being set.
     */
    const handleUpdateClient = async () => {
        if (!editingClient.value) return;

        try {
            loading.value = true;
            await ClientService.updateClient(editingClient.value.clientCode, editingClient.value);
            closeEditModal();
        } catch (err) {
            console.error('Failed to update client:', err);
            error.value = err as Error;
        } finally {
            loading.value = false;
        }
    };

    // UI Logic Helpers (Logic Exclusion from Template)
    const isStatusActive = (client: Client) => client.status === 'active';

    const getStatusLabel = (client: Client) => {
        switch (client.status) {
            case 'active': return '契約中';
            case 'inactive': return '解約';
            case 'suspension': return '停止';
            default: return client.status;
        }
    };

    const getStatusClass = (client: Client) => {
        switch (client.status) {
            case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'suspension': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return {
        // State
        clients,
        loading,
        error,
        searchQuery,

        // Computed
        totalCount,
        filteredClients,

        // Modal State
        isEditModalOpen,
        editingClient, // Exposed for v-model binding in modal

        // Actions
        openEditModal,
        closeEditModal,
        handleUpdateClient,

        // UI Helpers
        isStatusActive,
        getStatusLabel,
        getStatusClass
    };
}
