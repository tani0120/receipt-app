<template>
    <!-- Root: Whole page scrollable (h-full + overflow-y-auto) -->
    <div class="h-full bg-slate-50 font-sans text-slate-800 overflow-y-auto">
        <!-- Header Area -->
        <header class="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
            <!-- Top Row: Navigation & Edit -->
            <div class="flex items-center justify-between mb-4">
                <button @click="$router.push({ name: 'aaa_ScreenA' })" class="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                    <i class="fa-solid fa-arrow-left"></i> 顧問先一覧に戻る
                </button>
                <button @click="isEditModalOpen = true" class="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded shadow-sm text-sm font-bold transition flex items-center gap-2">
                    <i class="fa-solid fa-pen"></i> 修正
                </button>
            </div>

            <!-- Main Info Row -->
            <div v-if="client" class="flex flex-col gap-4">
                <!-- Line 1: Basic Stats -->
                <div class="flex flex-wrap items-center gap-4">
                    <span class="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded border border-green-200">稼働中</span>
                    <span class="bg-slate-800 text-white font-mono text-sm font-bold px-2 py-1 rounded">{{ client.clientCode }}</span>
                    <h1 class="text-2xl font-bold text-slate-900">{{ client.companyName }}</h1>
                    <span class="bg-blue-50 text-blue-700 border border-blue-100 text-xs px-2 py-0.5 rounded font-bold">{{ client.fiscalMonth }}月決算</span>
                    <div class="flex items-center gap-2 text-sm text-slate-600">
                        <i class="fa-solid fa-desktop text-slate-400"></i>
                        <!-- Custom Display for Software -->
                        <span class="font-bold">{{
                            client.accountingSoftware === 'freee' ? 'Freee' :
                            client.accountingSoftware === '弥生会計' ? '弥生' :
                            client.accountingSoftware === 'MFクラウド' ? 'MF' : client.accountingSoftware
                        }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-slate-600">
                        <i class="fa-solid fa-user-tie text-slate-400"></i>
                        <span>担当: <span class="font-bold">{{ client.staffName }}</span></span>
                    </div>
                    <div class="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                        第5期 (2025/01/01 ～ 2025/12/31)
                    </div>
                </div>

                <!-- Line 2: Tax & Accounting Details -->
                <div class="flex flex-wrap items-center gap-3">
                    <div class="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs">
                        <span class="text-slate-400 font-bold">課税区分</span>
                        <span class="font-bold text-slate-700">{{ client.consumptionTaxModeLabel }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs">
                        <span class="text-slate-400 font-bold">計上基準</span>
                        <span class="font-bold text-slate-700">{{ client.taxMethodExplicitLabel }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs">
                        <span class="text-slate-400 font-bold">申告種類</span>
                        <span class="font-bold text-blue-600">{{ client.taxFilingTypeLabel }}</span>
                    </div>
                </div>

                <!-- Line 3: Drive Links -->
                <div class="flex flex-wrap gap-3 mt-2">
                    <!-- Updated Names and Structure for future linking -->
                    <a href="https://drive.google.com/drive/folders/mock1" target="_blank" class="flex items-center gap-2 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 text-slate-600 px-4 py-2 rounded transition shadow-sm text-sm font-bold">
                        <i class="fa-brands fa-google-drive text-yellow-400 text-lg"></i>
                        顧客共有用
                    </a>
                    <a href="https://drive.google.com/drive/folders/mock2" target="_blank" class="flex items-center gap-2 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 text-slate-600 px-4 py-2 rounded transition shadow-sm text-sm font-bold">
                        <i class="fa-brands fa-google-drive text-blue-400 text-lg"></i>
                        仕訳後CSV
                    </a>
                    <a href="https://drive.google.com/drive/folders/mock3" target="_blank" class="flex items-center gap-2 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 text-slate-600 px-4 py-2 rounded transition shadow-sm text-sm font-bold">
                        <i class="fa-brands fa-google-drive text-gray-400 text-lg"></i>
                        仕訳から除外
                    </a>
                </div>
            </div>
        </header>

        <!-- Main Content (No internal scroll, flows naturally) -->
        <main class="px-8 py-8 space-y-8">

            <!-- Learning CSV Area -->
            <section class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 class="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-database text-indigo-500"></i> 学習用CSV保管エリア
                </h2>

                <div class="flex flex-col lg:flex-row gap-8">
                    <!-- Drop Zone -->
                    <div class="flex-1 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-colors p-8 flex flex-col items-center justify-center text-center cursor-pointer group min-h-[200px]">
                        <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                            <i class="fa-solid fa-cloud-arrow-up text-3xl text-indigo-400"></i>
                        </div>
                        <p class="text-sm font-bold text-slate-700 mb-1">ファイルをここにドラッグ＆ドロップ</p>
                        <p class="text-xs text-slate-400 mb-4">または</p>
                        <button class="bg-white border border-slate-300 text-slate-600 hover:text-indigo-600 hover:border-indigo-400 px-4 py-1.5 rounded text-xs font-bold transition">
                            ファイルを選択
                        </button>
                        <p class="text-[10px] text-slate-400 mt-4">
                            学習用に <span class="font-bold text-slate-500">仕訳CSV</span> <span class="font-bold text-slate-500">総勘定元帳CSV</span> <span class="font-bold text-slate-500">決算書一式PDF</span> を保存してください。
                        </p>
                    </div>

                    <!-- File List -->
                    <div class="flex-1 space-y-4">
                        <!-- Group: General Ledger -->
                         <div>
                            <h3 class="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                                <i class="fa-solid fa-list-ol"></i> 総勘定元帳CSV
                            </h3>
                            <div class="space-y-2">
                                <div v-for="i in 3" :key="'gl-'+i" class="flex items-center justify-between bg-white border border-slate-200 p-3 rounded text-sm hover:border-indigo-200 transition">
                                    <a :href="'/mock/gl_csv_'+i+'.csv'" download class="flex items-center gap-3 hover:underline decoration-slate-400 underline-offset-4">
                                        <i class="fa-solid fa-file-csv text-green-500 text-lg"></i>
                                        <span class="font-mono text-slate-700">202{{i}}年12月決算_総勘定元帳CSV_202{{i}}0101-202{{i}}1231.csv</span>
                                    </a>
                                    <button class="text-slate-400 hover:text-red-500 transition px-2">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Group: Journal -->
                        <div>
                            <h3 class="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                                <i class="fa-solid fa-book"></i> 仕訳帳CSV
                            </h3>
                            <div class="space-y-2">
                                <div v-for="i in 3" :key="'j-'+i" class="flex items-center justify-between bg-white border border-slate-200 p-3 rounded text-sm hover:border-indigo-200 transition">
                                    <a :href="'/mock/journal_csv_'+i+'.csv'" download class="flex items-center gap-3 hover:underline decoration-slate-400 underline-offset-4">
                                        <i class="fa-solid fa-file-csv text-blue-500 text-lg"></i>
                                        <span class="font-mono text-slate-700">202{{i}}年12月決算_仕訳帳CSV_202{{i}}0101-202{{i}}1231.csv</span>
                                    </a>
                                    <button class="text-slate-400 hover:text-red-500 transition px-2">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                         <!-- Group: PDF -->
                        <div>
                            <h3 class="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                                <i class="fa-solid fa-file-pdf"></i> 決算書一式PDF
                            </h3>
                            <div class="space-y-2">
                                <div v-for="i in 3" :key="'pdf-'+i" class="flex items-center justify-between bg-white border border-slate-200 p-3 rounded text-sm hover:border-indigo-200 transition">
                                    <a :href="'/mock/final_report_'+i+'.pdf'" download class="flex items-center gap-3 hover:underline decoration-slate-400 underline-offset-4">
                                        <i class="fa-solid fa-file-pdf text-red-500 text-lg"></i>
                                        <span class="font-mono text-slate-700">202{{i}}年12月決算_決算申告書.pdf</span>
                                    </a>
                                    <button class="text-slate-400 hover:text-red-500 transition px-2">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Section: AI Knowledge Prompt Area -->
            <section class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Left: AI Proposals -->
                <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
                    <h2 class="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-robot text-purple-500"></i> AI提案ルール
                    </h2>
                    <div class="flex-1 overflow-auto border border-slate-100 rounded-lg">
                        <table class="w-full text-sm text-left">
                            <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                <tr>
                                    <th class="px-4 py-3 whitespace-nowrap">コード / 会社名</th>
                                    <th class="px-4 py-3">AI提案内容・理由・効果</th>
                                    <th class="px-4 py-3 w-32">アクション</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 text-slate-700">
                                <tr class="hover:bg-slate-50/50">
                                    <td class="px-4 py-3 align-top">
                                        <div class="font-mono font-bold">AMT</div>
                                        <div class="text-xs text-slate-500">アマテラス商事</div>
                                    </td>
                                    <td class="px-4 py-3 align-top">
                                        <p class="leading-relaxed">
                                            <span class="font-bold text-purple-600">提案:</span> ドールト社の領収書は駐車場だが、過去仕訳では3回「旅費交通費」で計上。次回から「旅費交通費」で統一する。
                                        </p>
                                    </td>
                                    <td class="px-4 py-3 align-top">
                                        <div class="flex flex-col gap-1.5">
                                            <button @click="openConfirm('approve')" class="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded font-bold transition">承認</button>
                                            <button @click="openProposalEdit('ドールト社の領収書は駐車場だが、過去仕訳では3回「旅費交通費」で計上。次回から「旅費交通費」で統一する。')" class="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs rounded transition">修正</button>
                                            <button @click="openConfirm('reject')" class="px-2 py-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs rounded font-bold transition">却下</button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Right: Current AI Rules (Editor) -->
                <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-bold text-slate-700 flex items-center gap-2">
                            <i class="fa-solid fa-scroll text-emerald-500"></i> 現時点のAI知識プロンプト
                        </h2>
                        <button @click="openKnowledgeEdit" class="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-full font-bold transition">
                            <i class="fa-solid fa-pen mr-1"></i> 修正
                        </button>
                    </div>

                    <div class="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-sm leading-relaxed text-slate-700 overflow-y-auto whitespace-pre-wrap">{{ currentKnowledge }}</div>
                </div>
            </section>
        </main>

        <!-- Modals -->
        <aaa_ScreenA_Detail_EditModal
            :visible="isEditModalOpen"
            :initialData="client"
            @close="isEditModalOpen = false"
            @save="handleSave"
        />

        <aaa_ScreenA_Detail_ConfirmModal
            :visible="confirmModal.visible"
            :type="confirmModal.type"
            @cancel="confirmModal.visible = false"
            @confirm="handleConfirm"
        />

        <aaa_ScreenA_Detail_AIProposalEditModal
            :visible="proposalEditModal.visible"
            :initialContent="proposalEditModal.content"
            @close="proposalEditModal.visible = false"
            @save="handleProposalSave"
        />

        <aaa_ScreenA_Detail_AIKnowledgeEditModal
             :visible="knowledgeEditModal.visible"
             :initialContent="currentKnowledge"
             @close="knowledgeEditModal.visible = false"
             @save="handleKnowledgeSave"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { aaa_useAccountingSystem } from '@/aaa/aaa_composables/aaa_useAccountingSystem';
import { mapClientDetailApiToUi } from '@/aaa/aaa_composables/aaa_ClientDetailMapper';
import type { ClientDetailUi } from '@/aaa/aaa_types/aaa_ui.type';
import aaa_ScreenA_Detail_EditModal from './aaa_ScreenA_Detail_EditModal.vue';
import aaa_ScreenA_Detail_ConfirmModal from './aaa_ScreenA_Detail_ConfirmModal.vue';
import aaa_ScreenA_Detail_AIProposalEditModal from './aaa_ScreenA_Detail_AIProposalEditModal.vue';
import aaa_ScreenA_Detail_AIKnowledgeEditModal from './aaa_ScreenA_Detail_AIKnowledgeEditModal.vue';

const route = useRoute();
const { clients, fetchClients } = aaa_useAccountingSystem();
const isEditModalOpen = ref(false);

// Confirm Modal State
const confirmModal = ref({
    visible: false,
    type: 'approve' as 'approve' | 'reject'
});

// Proposal Edit Modal State
const proposalEditModal = ref({
    visible: false,
    content: ''
});

// Knowledge Edit Modal State
const knowledgeEditModal = ref({
    visible: false
});

// Mock knowledge data
const currentKnowledge = ref(`【固有ルール】
・Amazonの領収書は「消耗品費」ではなく、金額5万円以上なら「工具器具備品」として提案すること。
・「カフェ・ベローチェ」は会議費として処理する。
・インボイス登録番号のないタクシー利用は「旅費交通費(免税)」とすること。`);


const code = computed(() => route.params.code as string);
const rawClient = computed(() => clients.value.find(c => c.clientCode === code.value));

const localClient = ref<any>(null);

const client = computed(() => {
    if (localClient.value) {
        const form = localClient.value;
        const base = mapClientDetailApiToUi(rawClient.value || {});
        return {
            ...base,
            companyName: form.name,
            clientCode: form.code,
            staffName: form.staffName,
            fiscalMonth: form.fiscalMonth,
            accountingSoftware: form.settings.software,
        };
    }
    return mapClientDetailApiToUi(rawClient.value || {});
});

const handleSave = (updatedForm: any) => {
    localClient.value = updatedForm;
};

// AI Action Handlers
const openConfirm = (type: 'approve' | 'reject') => {
    confirmModal.value = { visible: true, type };
};

const handleConfirm = () => {
    // Process approve/reject here (Phase C will call API)
    console.log(`Action confirmed: ${confirmModal.value.type}`);
    confirmModal.value.visible = false;
};

const openProposalEdit = (content: string) => {
    proposalEditModal.value = { visible: true, content };
};

const handleProposalSave = (newContent: string) => {
    console.log(`Proposal updated: ${newContent}`);
    // Update local proposal state here
};

const openKnowledgeEdit = () => {
    knowledgeEditModal.value.visible = true;
};

const handleKnowledgeSave = (newContent: string) => {
    currentKnowledge.value = newContent;
};

onMounted(() => {
    if (!clients.value.length) {
        fetchClients();
    }
});
</script>
