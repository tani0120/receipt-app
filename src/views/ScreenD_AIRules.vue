<template>
  <div class="h-full flex flex-col bg-white rounded-lg shadow border border-gray-200 overflow-hidden animate-fade-in">

    <!-- ========================================== -->
    <!-- VIEW: RULE EDITOR (DETAIL)                 -->
    <!-- ========================================== -->
    <div v-if="currentMode === 'detail'" class="flex flex-col h-full">
        <!-- Header -->
        <div class="flex flex-col border-b border-gray-200 bg-slate-50 shrink-0">
            <!-- Client Indicator -->
            <div class="px-4 py-2 bg-indigo-900 text-white flex justify-between items-center shadow-inner">
                <div class="flex items-center gap-2">
                    <button @click="currentMode = 'list'" class="mr-2 hover:bg-indigo-700 p-1 rounded transition text-indigo-200 hover:text-white">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <i class="fa-solid fa-building"></i>
                    <div class="flex flex-col leading-tight">
                        <span class="text-[10px] opacity-70">対象顧問先</span>
                        <span class="font-bold text-sm">{{ selectedClient?.name }} ({{ selectedClient?.id }})</span>
                    </div>
                </div>
                <div class="text-[10px] bg-indigo-800 px-2 py-0.5 rounded border border-indigo-700">
                    AI学習モード: <span class="font-bold text-emerald-300">有効</span>
                </div>
            </div>

            <!-- Main Toolbar -->
            <div class="p-4 flex justify-between items-center">
            <div class="flex items-center gap-4">
                <div class="font-bold text-slate-700 text-sm flex items-center gap-2">
                    <i class="fa-solid fa-robot text-purple-500"></i> AI自動仕訳ルール管理
                </div>
                <!-- Metrics (Mock) -->
                <div class="hidden md:flex gap-3 text-xs">
                    <span class="bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-600">
                        <span class="font-bold text-slate-800">{{ rules.length }}</span> 件
                    </span>
                    <span class="bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-600">
                        有効: <span class="font-bold text-emerald-600">{{ rules.filter(r => r.status === 'active').length }}</span>
                    </span>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <!-- Filter Tabs -->
                <div class="flex bg-gray-200 p-0.5 rounded text-[10px] font-bold">
                    <button
                        @click="filterStatus = 'all'"
                        class="px-2 py-1 rounded transition"
                        :class="filterStatus === 'all' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'"
                    >すべて</button>
                    <button
                        @click="filterStatus === 'active'"
                        class="px-2 py-1 rounded transition"
                        :class="filterStatus === 'active' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'"
                    >有効</button>
                    <button
                        @click="filterStatus = 'draft'"
                        class="px-2 py-1 rounded transition"
                        :class="filterStatus === 'draft' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'"
                    >ドラフト</button>
                </div>

                <button @click="handleNew" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-xs font-bold shadow-md transition flex items-center gap-2">
                    <i class="fa-solid fa-plus"></i> <span class="hidden sm:inline">新規ルール</span>
                </button>
            </div>
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-auto p-4 bg-slate-50/50">
            <div v-if="loading" class="flex justify-center items-center h-full text-gray-400">
                <i class="fa-solid fa-spinner fa-spin text-2xl"></i>
            </div>
            <div v-else-if="filteredRules.length === 0" class="flex flex-col items-center justify-center h-64 text-gray-400">
                <i class="fa-solid fa-robot text-4xl mb-3 opacity-20"></i>
                <p class="text-sm font-bold">ルールが見つかりません</p>
                <p class="text-xs">新しいルールを作成してください</p>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                <RuleCard
                    v-for="rule in filteredRules"
                    :key="rule.id"
                    :rule="rule"
                    @click="handleEdit(rule)"
                    @toggle="toggleStatus(rule)"
                />
            </div>
        </div>

        <!-- Modal -->
        <RuleDetailModal
            v-model="isModalOpen"
            :rule="editingRule"
            @save="handleSave"
        />
    </div>


    <!-- ========================================== -->
    <!-- VIEW: CLIENT SELECTION (LIST)              -->
    <!-- ========================================== -->
    <div v-else class="flex flex-col h-full">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
            <div>
                 <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <i class="fa-solid fa-building-user text-indigo-600"></i> AIルール管理 - 顧問先選択
                </h2>
                <p class="text-xs text-gray-500 mt-1">ルールを設定・管理する顧問先を選択してください</p>
            </div>
        </div>

        <!-- Client Grid -->
        <div class="flex-1 overflow-auto p-6 bg-slate-50/50">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 <div v-for="client in mockClients" :key="client.id"
                    @click="selectClient(client)"
                    class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition cursor-pointer group"
                >
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                {{ client.name.substring(0,1) }}
                            </div>
                            <div>
                                <div class="font-bold text-slate-700 group-hover:text-indigo-700 transition">{{ client.name }}</div>
                                <div class="text-[10px] text-gray-400 font-mono">{{ client.id }}</div>
                            </div>
                        </div>
                        <i class="fa-solid fa-chevron-right text-gray-300 group-hover:text-indigo-400"></i>
                    </div>

                    <div class="grid grid-cols-2 gap-2 text-xs border-t border-gray-100 pt-3">
                        <div class="text-center p-1 bg-gray-50 rounded">
                            <div class="text-[10px] text-gray-400">有効ルール</div>
                            <div class="font-bold text-emerald-600">{{ client.activeRules }}</div>
                        </div>
                        <div class="text-center p-1 bg-gray-50 rounded">
                             <div class="text-[10px] text-gray-400">総ルール</div>
                            <div class="font-bold text-slate-600">{{ client.totalRules }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useAIRules } from '@/composables/useAIRules';
import RuleCard from '@/components/RuleCard.vue';
import RuleDetailModal from '@/components/RuleDetailModal.vue';
import type { LearningRuleUi } from '@/types/LearningRuleUi';

// --- State ---
type ViewMode = 'list' | 'detail';
const currentMode = ref<ViewMode>('list');
const selectedClient = ref<{id: string, name: string, activeRules: number, totalRules: number} | null>(null);

// --- Mock Clients ---
const mockClients = ref([
    { id: 'C001', name: '株式会社サンプルクライアント', activeRules: 89, totalRules: 124 },
    { id: 'C002', name: '合同会社テックイノベーション', activeRules: 12, totalRules: 15 },
    { id: 'C003', name: '鈴木商店', activeRules: 45, totalRules: 48 },
    { id: 'C004', name: 'グローバル貿易株式会社', activeRules: 204, totalRules: 230 },
]);

// --- Rule Logic (Only active when client selected) ---
const {
    rules,
    filterStatus,
    filteredRules,
    editingRule,
    isModalOpen,
    handleNew,
    handleEdit,
    handleSave,
    toggleStatus,
    loading,
    fetchRules
} = useAIRules();

// --- Actions ---
const selectClient = (client: typeof mockClients.value[0]) => {
    selectedClient.value = client;
    // In a real app, we would load rules for this client here
    currentMode.value = 'detail';
};

onMounted(() => {
    fetchRules('client-abc');
});
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
