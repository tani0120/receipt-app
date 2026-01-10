import { ref, computed, onMounted } from 'vue';
import { clientRepository } from '@/repositories/clientRepository';
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

    // Fetch Logic (V2 Migration)
    const fetchClients = async () => {
        loading.value = true;
        try {
            const v2Clients = await clientRepository.getClients();

            // Map V2 -> UI
            clients.value = v2Clients.map(c => ({
                id: c.id,
                clientCode: c.id, // ID as code for now
                companyName: c.name,
                repName: '-', // Not in V2 Schema yet (or in management)
                contactInfo: '-',
                status: c.management?.is_active ? 'active' : 'inactive',
                // Dummy/Defaults
                fiscalMonth: 1,
                driveLinked: false,
                accountingSoftware: 'yayoi',
                salesTotal: 0,
                jobCount: 0
            } as any as ClientUi)); // Cast to ClientUi for now

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

    // Updated to use Repository (Phase 4)
    const handleUpdateClient = async () => {
        if (!editingClient.value) return;

        try {
            loading.value = true;
            const code = editingClient.value.clientCode;

            // Map UI -> ClientDocument Partial
            // Only name is editable in UI mostly?
            // We'll update 'name' and maybe 'management.is_active' based on status.
            const updateData: any = {
                name: editingClient.value.companyName,
                // Add more fields if UI supports them
            };

            if (editingClient.value.status) {
                // Example mapping back to partial management
                // This requires fetching existing or merging.
                // For now, simple name update is key.
                // updateData.management = { is_active: editingClient.value.status === 'active' };
                // Careful: Partial update on nested object in Firestore replaces the map? No, dot notation needed for nested.
                // But repository 'updateClient' takes Partial<ClientDocument>.
                // Ideally we use dot notation keys for nested updates.
                // Let's stick to 'name' update for Name Resolution fix.
            }

            await clientRepository.updateClient(code, updateData);

            console.log('Update Success (V2)');

            // Refresh list
            await fetchClients();
            closeEditModal();

        } catch (err) {
            console.error('Update Error:', err);
            error.value = err as Error;
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
