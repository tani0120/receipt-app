<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans text-slate-800">
     <!-- Container Component: Handles Data & Modals Only -->
     <ScreenB_JournalTable
        v-if="!isLoading"
        :jobs="sortedJobs"
        @action="handleTableAction"
     />
     <div v-else class="flex justify-center items-center h-64">
        <i class="fa-solid fa-spinner fa-spin text-3xl text-blue-500"></i>
     </div>

    <!-- Modals (Kept in Container) -->
    <!-- Rescue Modal -->
    <div v-if="modal.show && modal.type === 'error'" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm" @click="closeModal">
        <div class="bg-white rounded-lg shadow-2xl overflow-hidden max-w-lg w-full" @click.stop>
            <div class="bg-red-600 px-4 py-3 flex justify-between items-center">
                 <h3 class="font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-triangle-exclamation"></i> エラー詳細 (Error Rescue)
                </h3>
                <button @click="closeModal" class="text-white hover:text-red-100"><i class="fa-solid fa-times"></i></button>
            </div>
            <div class="p-6">
                 <div class="flex items-start gap-4 mb-6">
                    <div class="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-bug text-xl"></i>
                    </div>
                    <div>
                        <div class="font-bold text-gray-800 text-lg mb-1">AI解析エラーが発生しました</div>
                        <p class="text-sm text-gray-600">データ形式が不正か、必須項目が欠落しています。</p>
                    </div>
                </div>
                <div class="bg-slate-800 rounded p-4 mb-6 font-mono text-xs text-green-400">
                    <div class="opacity-50 border-b border-slate-700 pb-2 mb-2">Log: {{ modal.data.id }}</div>
                    <div>TypeError: Cannot read properties of undefined</div>
                    <div class="text-red-400 mt-2">>> Critical Failure at Record #1042</div>
                </div>
                <div class="flex flex-col sm:flex-row justify-end gap-3 text-sm font-bold mt-2">
                    <button @click="closeModal" class="px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg">キャンセル</button>
                    <button @click="closeModal" class="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-lg">修正する</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Drive Modal -->
    <div v-if="modal.show && modal.type === 'drive'" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm" @click="closeModal">
        <div class="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full" @click.stop>
            <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl bg-green-500">
                    <i class="fa-solid fa-folder-open"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 text-lg">Drive Opened</h3>
                    <p class="text-xs text-gray-500">{{ modal.title }}</p>
                </div>
            </div>
            <div class="bg-gray-50 p-4 rounded border border-gray-200 text-sm text-gray-600 mb-6 font-mono">
                <i class="fa-solid fa-folder-open mr-2 text-yellow-500"></i>
                /G-Drive/Clients/{{ modal.data.name }}/{{ modal.subtitle }}
            </div>
            <div class="flex justify-end">
                <button @click="closeModal" class="bg-gray-800 text-white px-6 py-2 rounded font-bold shadow">OK</button>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
// Import from Mirror Composables safely
import { useJournalStatusRPC } from '@/composables/useJournalStatusRPC';
import type { JournalStatusUi } from '@/types/ScreenB_ui.type';
// Mapper is internal to RPC now, or handled by the view if needed.
// But useJournalStatusRPC should return "journalStatusList" which is already UI type.
import ScreenB_JournalTable from '@/components/ScreenB_JournalTable.vue';

const router = useRouter();
const { journalStatusList, fetchJournalStatus, isLoading } = useJournalStatusRPC();

// Alias for compatibility (Removed as unused)

onMounted(() => {
    fetchJournalStatus();
});

const filters = reactive({
    masterSearch: '',
    actionStatus: ''
});

const modal = reactive({
    show: false,
    type: '', // 'error' | 'drive'
    title: '',
    subtitle: '',
    data: {} as any
});

// Ironclad: Pure Filter & Sort Logic.
const sortedJobs = computed<JournalStatusUi[]>(() => {
    const listProp = journalStatusList.value || [];

    // 1. Map FIRST (RPC returns UI types directly now, so no mapping needed if RPC is correct)
    // If useJournalStatusRPC returns JournalStatusUi[], we use it directly.
    let list: JournalStatusUi[] = listProp;

    // Filter Logic
    if (filters.actionStatus) {
        // We filter based on the nextAction.type or primaryAction.type
        // Mapping UI filter value to job property.
        list = list.filter(job =>
             job.nextAction.type === filters.actionStatus ||
             job.primaryAction.type === filters.actionStatus
        );
    }

    if (filters.masterSearch) {
        const q = filters.masterSearch.toLowerCase();
        list = list.filter(job => job.clientCode.toLowerCase().includes(q));
    }

    // Sort Logic (e.g. priority to error, then date)
    // For now simple sort by code
    return [...list].sort((a, b) => a.clientCode.localeCompare(b.clientCode));
});

// Handler for events emitted by the Table Component
const handleTableAction = (payload: { job: JournalStatusUi, type: string }) => {
    const { job, type } = payload;
    if (['work', 'approve', 'remand'].includes(type)) {
        router.push({
            path: `/journal-entry/${job.id}`,
            query: { mode: type }
        });
    } else if (type === 'rescue_error') { // Assuming type for error rescue
         handleRescue(job);
    } else {
        handleOpenDrive(type, job);
    }
};

// Internal Modal Logic
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleRescue = (job: any) => {
    modal.show = true;
    modal.type = 'error';
    modal.data = job;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleOpenDrive = (type: string, job: any) => {
    modal.show = true;
    modal.type = 'drive';
    modal.title = type === 'export' ? 'CSV Export' : 'Archive';
    modal.subtitle = type;
    modal.data = { name: `Client ${job.clientCode}`, ...job }; // Mock for modal display compatibility
};

const closeModal = () => {
    modal.show = false;
};
</script>
