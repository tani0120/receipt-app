
<template>
    <div class="h-full flex flex-col bg-white rounded-lg shadow border border-gray-200 overflow-hidden animate-fade-in">
        <div class="p-4 border-b border-gray-200 bg-slate-50 flex justify-between items-center shrink-0">
            <div class="font-bold text-slate-700 text-sm flex items-center gap-2">
                <i class="fa-solid fa-users text-blue-500"></i> 顧問先管理一覧
            </div>
            <div class="flex items-center gap-4">
                <!-- Status Filter -->
                <div class="flex bg-gray-200 rounded p-1 gap-1">
                    <button @click="filters.status = 'all'" :class="{'bg-white shadow text-slate-700': filters.status === 'all', 'text-gray-500 hover:text-gray-700': filters.status !== 'all'}" class="px-3 py-1 text-xs font-bold rounded transition">全て</button>
                    <button @click="filters.status = 'active'" :class="{'bg-blue-600 text-white shadow': filters.status === 'active', 'text-gray-500 hover:text-gray-700': filters.status !== 'active'}" class="px-3 py-1 text-xs font-bold rounded transition">稼働中</button>
                    <button @click="filters.status = 'stopped'" :class="{'bg-red-500 text-white shadow': filters.status === 'stopped', 'text-gray-500 hover:text-gray-700': filters.status !== 'stopped'}" class="px-3 py-1 text-xs font-bold rounded transition">停止中</button>
                </div>

                <div class="relative">
                    <i class="fa-solid fa-search absolute left-2 top-2 text-gray-400 text-xs"></i>
                    <input type="text" v-model="filters.masterSearch" placeholder="会社名 / ID で検索" class="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded w-64 focus:border-blue-500">
                </div>
                <button @click="openClientModal('new')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-bold shadow-md transition flex items-center gap-2">
                    <i class="fa-solid fa-plus"></i> 新規顧問先登録
                </button>
            </div>
        </div>

        <div class="overflow-auto flex-1 p-0">
            <table class="w-full text-left border-collapse">
                <thead class="bg-slate-100 text-gray-500 text-xs uppercase sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th class="p-3 border-b font-bold w-24 text-center">設定状況</th>
                        <th class="p-3 border-b font-bold w-24">3コード</th>
                        <th class="p-3 border-b font-bold">会社名</th>
                        <th class="p-3 border-b font-bold w-32">担当</th>
                        <th class="p-3 border-b font-bold w-16 text-center">連絡</th>
                        <th class="p-3 border-b font-bold w-24">決算月</th>
                        <th class="p-3 border-b font-bold w-40">ソフト/税/基準</th>
                        <th class="p-3 border-b font-bold">Drive連携</th>
                        <th class="p-3 border-b font-bold w-16 text-center">編集</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 text-xs">
                    <tr v-for="client in sortedMasterClients" :key="client.jobId" class="transition group" :class="{'hover:bg-blue-50/30': client.isActive, 'bg-red-50 hover:bg-red-100/50': !client.isActive}">
                        <td class="p-3 text-center">
                            <span v-if="client.isActive" class="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-green-200">稼働中</span>
                            <span v-else class="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-600">停止中</span>
                        </td>
                        <td class="p-3 font-mono font-bold text-slate-500">{{ client.code }}</td>
                        <td class="p-3">
                            <a @click.prevent="goToDetail(client.code)" href="#" class="font-bold text-blue-600 hover:underline text-sm flex items-center gap-2">
                                {{ client.name }} <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                            </a>
                        </td>
                        <td class="p-3">{{ client.rep }}</td>
                        <td class="p-3 text-center">
                            <a v-if="client.contact.type === 'chatwork'" :href="client.contact.value" target="_blank" class="text-red-500 hover:text-red-700 text-lg" title="Chatworkを開く"><i class="fa-brands fa-rocketchat"></i></a>
                            <a v-else-if="client.contact.type === 'email'" :href="'mailto:' + client.contact.value" class="text-blue-500 hover:text-blue-700 text-lg" title="メールを送る"><i class="fa-regular fa-envelope"></i></a>
                            <span v-else class="text-gray-300">-</span>
                        </td>
                        <td class="p-3 font-bold">{{ client.type === 'individual' ? '個人 (12月)' : client.fiscalMonth + '月決算' }}</td>
                        <td class="p-3 text-[10px] text-gray-500">
                            <div>{{ client.settings.software }}</div>
                            <div>{{ client.settings.taxMethod === 'inclusive' ? '税込' : '税抜' }} / {{ client.settings.calcMethod }}</div>
                        </td>
                        <td class="p-3">
                            <div class="flex flex-wrap gap-x-3 gap-y-1">
                                <a :href="client.driveLinks.storage || '#'" target="_blank" class="drive-link-compact"><i class="fa-regular fa-folder-open"></i><span>顧客保管</span></a>
                                <a :href="client.driveLinks.journalOutput || '#'" target="_blank" class="drive-link-compact"><i class="fa-solid fa-file-export"></i><span>仕訳出力</span></a>
                                <a :href="client.driveLinks.journalExclusion || '#'" target="_blank" class="drive-link-compact text-gray-500"><i class="fa-solid fa-trash-can"></i><span>仕訳除外</span></a>
                                <a :href="client.driveLinks.pastJournals || '#'" target="_blank" class="drive-link-compact text-purple-600"><i class="fa-solid fa-book"></i><span>過去仕訳等保管</span></a>
                            </div>
                        </td>
                        <td class="p-3 text-center">
                            <button @click="openClientModal('edit', client)" class="text-gray-400 hover:text-blue-600 transition"><i class="fa-solid fa-pen"></i></button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Client Modal (Reused) -->
        <aaa_ClientModal
            :visible="isClientModalVisible"
            :mode="clientModalMode"
            :initial-data="selectedClient"
            @close="isClientModalVisible = false"
            @save="handleClientSave"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, inject, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { aaa_useAccountingSystem } from '@/composables/useAccountingSystem';
import type { Client } from '@/types/firestore';
import aaa_ClientModal from './ClientModal.vue';

const router = useRouter();
const { clients, fetchClients } = aaa_useAccountingSystem();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const showToast = inject<any>('showToast');

// Fetch clients on mount to ensure data availability
onMounted(() => {
    fetchClients();
});

const filters = reactive({
    masterSearch: '',
    status: 'active' as 'all' | 'active' | 'stopped'
});

// Modal State
const isClientModalVisible = ref(false);
const clientModalMode = ref<'new' | 'edit'>('new');
const selectedClient = ref<Client | null>(null);

// Mapped property for template loop
const sortedMasterClients = computed(() => {
    // 1. Map Firestore Client -> UI Item Structure
    const mappedList = (clients.value || []).map((c: Client) => {
        // Safe defaults
        const code = c.clientCode || '???';
        const name = c.companyName || '（名称未設定）';

        // Derive Contact Type
        let contactType = 'none';
        if (c.contactInfo?.includes('@')) contactType = 'email';
        else if (c.contactInfo?.startsWith('https://')) contactType = 'chatwork'; // Mock logic

        return {
            // Mapping for Template Binding
            ...c,
            jobId: code, // Used as :key
            code: code,
            name: name,
            rep: c.repName || '-',
            isActive: c.status === 'active',
            type: 'corp', // Default to Corp
            fiscalMonth: c.fiscalMonth || 12,

            contact: {
                type: contactType,
                value: c.contactInfo || ''
            },

            settings: {
                software: c.accountingSoftware || 'freee',
                taxMethod: c.taxType || 'inclusive',
                calcMethod: '切捨' // Default
            },

            driveLinks: {
                storage: c.sharedFolderId ? `https://drive.google.com/drive/folders/${c.sharedFolderId}` : '#',
                journalOutput: '#',
                journalExclusion: '#',
                pastJournals: '#'
            }
        };
    });

    // 2. Filter
    let list = mappedList;

    // Status Filter
    if (filters.status === 'active') {
        list = list.filter(c => c.isActive);
    } else if (filters.status === 'stopped') {
        list = list.filter(c => !c.isActive);
    }

    // Search Filter
    if (filters.masterSearch) {
        const q = filters.masterSearch.toLowerCase();
        list = list.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.code.toLowerCase().includes(q)
        );
    }

    // 3. Sort
    return list.sort((a, b) => a.code.localeCompare(b.code));
});


const goToDetail = (clientCode: string) => {
    router.push({ name: 'ScreenA_Detail', params: { code: clientCode } });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const openClientModal = (mode: 'new' | 'edit', client: any | null = null) => {
    clientModalMode.value = mode;
    // We need to pass back the raw client structure if editing,
    // or rely on mapping back? For now passing the mapped object is "okay"
    // if aaa_ClientModal handles partials, but ideally we pass 'client' from raw list.
    // Let's pass the UI object for now, assuming aaa_ClientModal can handle it.
    selectedClient.value = client;
    isClientModalVisible.value = true;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleClientSave = (formData: any) => {
    // This is pseudo-implementation since we are fixing READ mainly.
    // Saving would ideally call FirestoreRepository.addClient / updateClient
    // But for now keeping logic consistent with previous behavior (local update mock)
    // or redirecting to aaa_useAccountingSystem actions.

    // For this 'Emergency Fix', we just rely on the fact that 'sortedMasterClients'
    // is read-only computed from 'clients'.
    // Real implementation should be:
    // createClient(formData) or updateClient(formData)

    // Since this function was just modifying local arrays before,
    // and we don't want to break the "Add" button completely:
    console.log("Save requested", formData);
    if (showToast) showToast('機能実装中: 保存処理', 'info');
    isClientModalVisible.value = false;

    // Refresh to see changes if backend updated
    fetchClients();
};
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Drive Link Compact Style */
.drive-link-compact {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 10px;
    color: #2563eb;
    text-decoration: none;
    padding: 2px 4px;
    border-radius: 2px;
    transition: background-color 0.2s;
}
.drive-link-compact:hover {
    background-color: #eff6ff;
    text-decoration: none;
}
.drive-link-compact span {
    text-decoration: underline;
    text-decoration-color: #93c5fd;
}
</style>
