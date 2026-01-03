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
                <!-- Line 2: Tax & Accounting Details -->
                <div class="flex flex-wrap items-center gap-3">
                    <div class="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs">
                        <span class="text-slate-400 font-bold">消費税</span>
                        <span class="font-bold text-slate-700">{{ client.consumptionTaxModeLabel }}</span>
                    </div>
                     <div class="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs">
                        <span class="text-slate-400 font-bold">計算方式</span>
                        <span class="font-bold text-slate-700">{{ client.taxCalculationMethodLabel }}</span>
                    </div>
                     <div class="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs">
                        <span class="text-slate-400 font-bold">端数処理</span>
                        <span class="font-bold text-slate-700">{{ client.roundingSettingsLabel }}</span>
                    </div>
                     <div class="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs">
                        <span class="text-slate-400 font-bold">インボイス</span>
                        <span :class="['font-bold', client.isInvoiceRegistered ? 'text-blue-600' : 'text-slate-500']">
                            {{ client.invoiceRegistrationLabel }}
                            <span v-if="client.isInvoiceRegistered" class="ml-1 text-[10px] font-mono bg-blue-50 px-1 rounded">{{ client.invoiceRegistrationNumber }}</span>
                        </span>
                    </div>

                    <div class="w-px h-4 bg-slate-300 mx-1"></div>

                    <div class="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs">
                        <span class="text-slate-400 font-bold">経理方式</span>
                        <span class="font-bold text-slate-700">{{ client.taxMethodExplicitLabel }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs">
                        <span class="text-slate-400 font-bold">計上基準</span>
                        <span class="font-bold text-slate-700">{{ client.calculationMethodLabel }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs">
                        <span class="text-slate-400 font-bold">申告種類</span>
                        <span class="font-bold text-blue-600">{{ client.taxFilingTypeLabel }}</span>
                    </div>
                </div>

                <!-- Line 3: Drive Links -->
                <div class="flex flex-wrap gap-3 mt-2">
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

        <!-- Main Content (Refactored) -->
        <main class="px-8 py-8 space-y-8">

            <!-- Learning CSV Area -->
            <aaa_ScreenA_Detail_FileStorage
                @delete-file="openConfirm('delete')"
            />

            <!-- Section: AI Interaction Area -->
            <section class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Left: AI Proposals -->
                <aaa_ScreenA_Detail_AIProposalCard
                    @approve="openConfirm('approve')"
                    @reject="openConfirm('reject')"
                    @edit="openProposalEdit"
                />

                <!-- Right: Knowledge Prompt -->
                <aaa_ScreenA_Detail_AIKnowledgeCard
                    :content="currentKnowledge"
                    @edit="openKnowledgeEdit"
                />
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
import aaa_ScreenA_Detail_EditModal from './aaa_ScreenA_Detail_EditModal.vue';
import aaa_ScreenA_Detail_ConfirmModal from './aaa_ScreenA_Detail_ConfirmModal.vue';
import aaa_ScreenA_Detail_AIProposalEditModal from './aaa_ScreenA_Detail_AIProposalEditModal.vue';
import aaa_ScreenA_Detail_AIKnowledgeEditModal from './aaa_ScreenA_Detail_AIKnowledgeEditModal.vue';
// Refactored components
import aaa_ScreenA_Detail_FileStorage from './aaa_ScreenA_Detail_FileStorage.vue';
import aaa_ScreenA_Detail_AIProposalCard from './aaa_ScreenA_Detail_AIProposalCard.vue';
import aaa_ScreenA_Detail_AIKnowledgeCard from './aaa_ScreenA_Detail_AIKnowledgeCard.vue';

const route = useRoute();
const { clients, fetchClients, updateClient } = aaa_useAccountingSystem();
const isEditModalOpen = ref(false);

// Confirm Modal State (Fixed Type Definition for Delete)
const confirmModal = ref({
    visible: false,
    type: 'approve' as 'approve' | 'reject' | 'delete'
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

const handleSave = async (formData: any) => {
    // Helper to map consumption tax composite
    let consumptionTaxMode = 'general';
    let simplifiedTaxCategory: number | undefined = undefined;

    if (formData.settings.consumptionTax === 'exempt') {
        consumptionTaxMode = 'exempt';
    } else if (formData.settings.consumptionTax && formData.settings.consumptionTax.startsWith('simplified_')) {
        consumptionTaxMode = 'simplified';
        simplifiedTaxCategory = Number(formData.settings.consumptionTax.split('_')[1]);
    }

    const payload = {
        clientCode: formData.code,
        companyName: formData.name,
        repName: formData.rep,
        staffName: formData.staffName,
        type: formData.type || 'corp',
        fiscalMonth: Number(formData.fiscalMonth),
        status: (formData.isActive ? 'active' : 'inactive') as 'active' | 'inactive' | 'suspension',
        accountingSoftware: formData.settings.software,

        contactInfo: formData.contact.value,

        // Tax Settings
        taxFilingType: (formData.settings.taxType === '青色' ? 'blue' : 'white') as 'blue' | 'white',
        consumptionTaxMode: consumptionTaxMode as 'general' | 'simplified' | 'exempt',
        simplifiedTaxCategory: simplifiedTaxCategory as 1 | 2 | 3 | 4 | 5 | 6 | undefined,

        defaultTaxRate: 10, // Default if not in form
        taxMethod: formData.settings.taxMethod as 'inclusive' | 'exclusive',

        // New Fields
        taxCalculationMethod: formData.settings.taxCalculationMethod as 'stack' | 'back',
        roundingSettings: formData.settings.roundingSettings as 'floor' | 'round' | 'ceil',
        isInvoiceRegistered: Boolean(formData.settings.isInvoiceRegistered),
        invoiceRegistrationNumber: formData.settings.invoiceRegistrationNumber,

        calculationMethod: (formData.settings.calcMethod === '発生主義' ? 'accrual' : (formData.settings.calcMethod === '現金主義' ? 'cash' : 'interim_cash')) as 'accrual' | 'cash' | 'interim_cash',
    };

    try {
        await updateClient(payload.clientCode, payload);
        isEditModalOpen.value = false;
        // localClient logic removed as updateClient updates the source of truth
        localClient.value = null;
    } catch (e) {
        console.error(e);
        alert('更新に失敗しました');
    }
};

// AI Action Handlers
const openConfirm = (type: 'approve' | 'reject' | 'delete') => {
    confirmModal.value = { visible: true, type };
};

const handleConfirm = () => {
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
