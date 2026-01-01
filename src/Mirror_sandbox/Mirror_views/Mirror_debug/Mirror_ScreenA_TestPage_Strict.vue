<template>
  <!-- [UI_Structure] Line:3 -->
  <div class="h-full flex flex-col bg-white rounded-lg shadow border border-gray-200 overflow-hidden animate-fade-in">
    <!-- [UI_Structure] Line:4 -->
    <div class="p-4 border-b border-gray-200 bg-slate-50 flex justify-between items-center shrink-0">
      <div class="font-bold text-slate-700 text-sm flex items-center gap-2">
        <i class="fa-solid fa-users text-blue-500"></i> 顧問先管理一覧
      </div>
      <div class="flex items-center gap-4">
        <!-- [UI_Structure] Line:10 -->
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

    <!-- [UI_Structure] Line:26 -->
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
              <a @click.prevent="goToClientDashboard(client)" href="#" class="font-bold text-blue-600 hover:underline text-sm flex items-center gap-2">
                {{ client.name }} <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
              </a>
            </td>
            <td class="p-3">{{ client.rep }}</td>
            <td class="p-3 text-center">
               <a v-if="client.contact.type === 'chatwork'" :href="client.contact.value" target="_blank" class="text-red-500 hover:text-red-700 text-lg"><i class="fa-brands fa-rocketchat"></i></a>
               <a v-else-if="client.contact.type === 'email'" :href="'mailto:' + client.contact.value" class="text-blue-500 hover:text-blue-700 text-lg"><i class="fa-regular fa-envelope"></i></a>
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
    <!-- Modal Logic included in Spec Part 3 -->
    <Mirror_ClientModal
        :visible="isClientModalVisible"
        :mode="clientModalMode"
        :initial-data="selectedClient"
        @close="isClientModalVisible = false"
        @save="handleClientSave"
    />
  </div>
</template>

<script setup lang="ts">
// [Internal_Import_Dependency] Line:92 - 96
import { ref, reactive, computed, inject, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Mirror_useAccountingSystem } from '@/Mirror_sandbox/Mirror_composables/Mirror_useAccountingSystem';
import type { Client } from '@/Mirror_sandbox/Mirror_types/Mirror_firestore';
import Mirror_ClientModal from '../../Mirror_components/Mirror_ClientModal.vue'; // Adjusted relative path for debug view

// [Internal_Logic_Flow] Lines 98-106
const router = useRouter();
const { clients, fetchClients } = Mirror_useAccountingSystem();
 
const showToast = inject<any>('showToast');

onMounted(() => {
    fetchClients();
});

// [Internal_Logic_Flow] Lines 108-111
const filters = reactive({
    masterSearch: '',
    status: 'active' as 'all' | 'active' | 'stopped'
});

// [Internal_State_Definition] Lines 114-116
const isClientModalVisible = ref(false);
const clientModalMode = ref<'new' | 'edit'>('new');
const selectedClient = ref<Client | null>(null);

// [Internal_Computed_Logic] Line:119 - sortedMasterClients
const sortedMasterClients = computed(() => {
    // [Internal_Function_Definition] Line:121
    const mappedList = (clients.value || []).map((c: Client) => {
        const code = c.clientCode || '???';
        const name = c.companyName || '（名称未設定）';

        // [Internal_Logic_Flow] Line:127
        let contactType = 'none';
        if (c.contactInfo?.includes('@')) contactType = 'email';
        else if (c.contactInfo?.startsWith('https://')) contactType = 'chatwork';

        return {
            ...c,
            jobId: code,
            code: code,
            name: name,
            rep: c.repName || '-',
            isActive: c.status === 'active',
            type: 'corp',
            fiscalMonth: c.fiscalMonth || 12,
            contact: {
                type: contactType,
                value: c.contactInfo || ''
            },
            settings: {
                software: c.accountingSoftware || 'freee',
                taxMethod: (c as any).taxType || 'inclusive',
                calcMethod: '切捨'
            },
            driveLinks: {
                storage: c.sharedFolderId ? `https://drive.google.com/drive/folders/${c.sharedFolderId}` : '#',
                journalOutput: '#',
                journalExclusion: '#',
                pastJournals: '#'
            }
        };
    });

    let list = mappedList;

    // [Internal_Logic_Flow] Filter Logic
    if (filters.status === 'active') {
        list = list.filter(c => c.isActive);
    } else if (filters.status === 'stopped') {
        list = list.filter(c => !c.isActive);
    }

    if (filters.masterSearch) {
        const q = filters.masterSearch.toLowerCase();
        list = list.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.code.toLowerCase().includes(q)
        );
    }

    return list.sort((a, b) => a.code.localeCompare(b.code));
});

// [Internal_Function_Definition] Method Actions
 
const goToClientDashboard = (client: any) => {
    router.push({ name: 'ScreenA_Detail', params: { code: client.code } });
};

 
const openClientModal = (mode: 'new' | 'edit', client: any | null = null) => {
    clientModalMode.value = mode;
    selectedClient.value = client;
    isClientModalVisible.value = true;
};

 
const handleClientSave = (formData: any) => {
    console.log('Save requested', formData);
    if (showToast) showToast('機能実装中: 保存処理', 'info');
    isClientModalVisible.value = false;
    fetchClients();
};
</script>

<style scoped>
/* [Style_Definition] from Spec Part 4 Items 237-263 */
.animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

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
