<template>
  <div class="h-full flex flex-col bg-white overflow-hidden text-[#333] font-sans relative" tabindex="0" ref="containerRef">

    <!-- 1. Header Area (Ironclad) -->
    <header class="shrink-0 z-50 bg-white border-b border-gray-200 shadow-sm relative">
        <!-- Main Nav Bar -->
        <div class="h-12 flex items-center justify-between px-4">
             <div class="flex items-center gap-4 w-full">
                <!-- Client Info & Link -->
                <div class="text-xs font-bold flex items-center gap-1 shrink-0 text-gray-500">
                    <button @click="router.push('/journal-status')" class="hover:underline">全社仕訳 (リンク)</button>
                    <i class="fa-solid fa-chevron-right text-[10px]"></i>
                    <span>{{ client?.companyName || '読込中...' }} ({{ client?.clientCode }})</span>
                </div>

                <div class="h-4 w-px bg-gray-300 mx-1"></div>

                <!-- Navigation Buttons (Simplified) -->
                <div class="flex gap-2 shrink-0">
                    <button @click="goBack" class="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded transition shadow-sm border bg-white text-slate-700 hover:bg-slate-100 border-gray-300 active:scale-95">
                        <i class="fa-solid fa-arrow-left"></i> 一覧に戻る
                    </button>
                    <!-- Next button removed for Single Mode -->
                </div>

                <!-- Spacer -->
                <div class="flex-1"></div>

                <!-- Right Side Controls -->
                <div class="relative ml-4 flex items-center gap-4">
                     <!-- Lock Warning (Simulation Toggle) -->
                     <button @click="toggleLock" :class="['text-[10px] font-bold px-2 py-1 rounded border', currentJob?.isLocked ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'text-gray-400 border-gray-200']">
                        <i class="fa-solid fa-lock"></i> ロック (検証)
                     </button>
                </div>
             </div>
        </div>

        <!-- Mode Indicator Bar (Full Width) -->
        <div class="w-full flex justify-end px-4 py-2 border-t border-gray-100 bg-slate-50 relative overflow-hidden">
             <!-- Lock Warning Banner -->
             <div v-if="currentJob?.journalEditMode === 'locked'" class="absolute inset-0 bg-yellow-400 flex items-center justify-center z-10 animate-stripe">
                 <span class="text-yellow-900 font-bold text-xs flex items-center gap-2">
                     <i class="fa-solid fa-user-lock"></i> 👨‍💼 他のユーザーが現在この仕訳を編集中です。変更は保存されません。
                 </span>
             </div>

             <div v-if="isLoading" class="flex items-center gap-2 text-xs font-bold text-gray-500">
                <i class="fa-solid fa-spinner fa-spin"></i> 読込中...
             </div>
             <div v-else-if="error" class="flex items-center gap-2 text-xs font-bold text-red-500">
                <i class="fa-solid fa-circle-exclamation"></i> {{ error }}
             </div>

             <div v-else-if="currentJob?.journalEditMode === 'work'" class="bg-blue-600 text-white px-6 py-1.5 rounded text-sm font-bold shadow-md flex items-center gap-2 transition-all">
                <i class="fa-solid fa-pen-to-square"></i> 🟦 1次仕訳入力モード
             </div>
             <div v-else-if="currentJob?.journalEditMode === 'remand'" class="bg-red-600 text-white px-6 py-1.5 rounded text-sm font-bold shadow-md flex items-center gap-2 animate-pulse transition-all">
                <i class="fa-solid fa-triangle-exclamation"></i> 🟥 ⚠ 差戻し対応モード
             </div>
             <div v-else-if="currentJob?.journalEditMode === 'approve'" class="bg-pink-600 text-white px-6 py-1.5 rounded text-sm font-bold shadow-md flex items-center gap-2 transition-all">
                <i class="fa-solid fa-stamp"></i> 🟪 最終承認決済モード
             </div>
        </div>
    </header>

    <!-- 2. Main Content -->
    <main class="flex-1 flex overflow-hidden">
        <!-- Left Column: Form & Alerts -->
        <section class="w-[60%] flex flex-col bg-slate-50 border-r border-gray-200 relative z-10">
            <div class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">

                <!-- Alert Stack (Driven by JobUi.alerts) -->
                <div class="space-y-2">
                    <div v-for="(alert, idx) in currentJob?.alerts" :key="idx"
                         :class="['border-l-4 p-3 rounded shadow-sm flex items-start gap-3',
                                  alert.level === 'error' ? 'bg-red-50 border-red-500 border-red-200' :
                                  alert.level === 'warning' ? 'bg-yellow-50 border-yellow-500 border-yellow-200' : 'bg-blue-50 border-blue-500 border-blue-200']">
                        <div :class="['text-lg', alert.level === 'error' ? 'text-red-600' : alert.level === 'warning' ? 'text-yellow-600' : 'text-blue-600']">
                             <i :class="alert.level === 'error' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-info'"></i>
                        </div>
                        <div>
                            <h4 :class="['font-bold text-xs', alert.level === 'error' ? 'text-red-800' : 'text-slate-800']">{{ alert.title }}</h4>
                            <p :class="['text-[11px] font-bold', alert.level === 'error' ? 'text-red-700' : 'text-slate-700']">{{ alert.message }}</p>
                        </div>
                    </div>
                </div>

                <!-- 3. Main Form (Grid Layout) -->
                <div class="bg-white border border-slate-300 rounded-lg p-4 shadow-sm space-y-3">
                    <!-- Summary (Top) -->
                    <div>
                        <label class="block text-[10px] text-gray-500 font-bold mb-1">摘要 <span class="font-normal">(全行共通)</span></label>
                        <input type="text" v-model="selectedJobSummary" class="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-sm text-slate-800 focus:bg-white transition" :disabled="!currentJob?.canEdit">
                    </div>

                    <!-- Date & Totals Header -->
                    <div class="grid grid-cols-12 gap-3">
                        <div class="col-span-4">
                            <label class="block text-[10px] text-gray-500 font-bold mb-1">取引日付</label>
                            <input type="date" v-model="transactionDateStr" class="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-sm font-mono" :disabled="!currentJob?.canEdit">
                        </div>
                        <div class="col-span-4">
                            <label class="block text-[10px] text-gray-500 font-bold mb-1">合計金額 (税込)</label>
                            <input type="text" :value="totalAmount.toLocaleString()" disabled class="w-full bg-gray-100 border border-slate-300 rounded px-2 py-1.5 text-sm font-mono text-right text-gray-600">
                        </div>
                        <div class="col-span-4 flex items-end justify-end pb-1">
                            <div v-if="isBalanced" class="text-xs font-bold text-green-600 flex items-center bg-green-50 px-2 py-1 rounded border border-green-200">
                                <i class="fa-solid fa-check-circle mr-1"></i> 貸借一致
                            </div>
                            <div v-else class="text-xs font-bold text-red-600 flex items-center bg-red-50 px-2 py-1 rounded border border-red-200 animate-pulse">
                                <i class="fa-solid fa-scale-unbalanced mr-1"></i> 差額: {{ balanceDiff.toLocaleString() }}
                            </div>
                        </div>
                    </div>

                    <!-- Debit / Credit Split Area -->
                    <div class="flex gap-4 border-t border-slate-100 pt-3 items-stretch">
                        <!-- Debit Side -->
                        <div class="relative flex-1 flex flex-col">
                            <div class="text-xs font-bold text-blue-600 flex items-center mb-2"><i class="fa-solid fa-arrow-right-to-bracket mr-1"></i> 借方 (費用)</div>
                            <div v-for="(row, idx) in debitRows" :key="'dr-'+idx" class="mb-3 relative group bg-blue-50/30 p-2 rounded border border-blue-100 flex flex-col gap-2">
                                <button v-if="currentJob?.canEdit && debitRows.length > 1" @click="removeDebitRow(idx)" class="absolute -right-2 -top-2 bg-white rounded-full border border-gray-200 p-1 text-gray-400 hover:text-red-500 shadow-sm z-10 w-5 h-5 flex items-center justify-center text-[10px]"><i class="fa-solid fa-trash"></i></button>

                                <label class="block text-[10px] text-gray-500 mb-0.5">勘定科目</label>
                                <input type="text" v-model="row.drAccount" :disabled="!currentJob?.canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-sm font-bold text-slate-800 mb-2" placeholder="科目">

                                <label class="block text-[10px] text-gray-500 mb-0.5">補助科目</label>
                                <input type="text" v-model="row.drSub" :disabled="!currentJob?.canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-xs mb-2" placeholder="(指定なし)">

                                <label class="block text-[10px] text-gray-500 mb-0.5">税区分</label>
                                <select v-model="row.drTaxClass" :disabled="!currentJob?.canEdit" class="w-full border border-slate-300 rounded px-1 py-1 text-[10px] bg-white mb-2">
                                    <option v-for="opt in filteredDebitTaxOptions" :key="opt.code" :value="opt.code">
                                        {{ opt.label }}
                                    </option>
                                </select>

                                <label class="block text-[10px] text-gray-500 mb-0.5">金額</label>
                                <div class="relative">
                                    <input type="number" v-model.number="row.drAmount" :disabled="!currentJob?.canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-sm font-mono text-right bg-white">
                                    <div v-if="row.drTaxClass !== 'TAX_PURCHASE_NONE' && row.drTaxClass !== 'TAX_SALES_NONE'" class="text-[9px] text-gray-400 text-right mt-1">(内税)</div>
                                </div>
                            </div>
                            <button v-if="currentJob?.canEdit" @click="addDebitRow" class="text-[10px] text-blue-500 hover:text-blue-700 flex items-center font-bold mt-1"><i class="fa-solid fa-plus-circle mr-1"></i> 行を追加</button>
                        </div>

                        <!-- Credit Side -->
                        <div class="relative flex-1 flex flex-col">
                            <div class="text-xs font-bold text-green-600 flex items-center justify-end mb-2">貸方 (決済) <i class="fa-solid fa-arrow-right-from-bracket ml-1"></i></div>
                            <div v-for="(row, idx) in creditRows" :key="'cr-'+idx" class="mb-3 relative group bg-green-50/30 p-2 rounded border border-green-100 flex flex-col gap-2">
                                <button v-if="currentJob?.canEdit && creditRows.length > 1" @click="removeCreditRow(idx)" class="absolute -left-2 -top-2 bg-white rounded-full border border-gray-200 p-1 text-gray-400 hover:text-red-500 shadow-sm z-10 w-5 h-5 flex items-center justify-center text-[10px]"><i class="fa-solid fa-trash"></i></button>

                                <label class="block text-[10px] text-gray-500 mb-0.5 text-right">勘定科目</label>
                                <input type="text" v-model="row.crAccount" :disabled="!currentJob?.canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-sm font-bold text-slate-800 mb-2 text-right" placeholder="科目">

                                <label class="block text-[10px] text-gray-500 mb-0.5 text-right">補助科目</label>
                                <input type="text" v-model="row.crSub" :disabled="!currentJob?.canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-xs mb-2 text-right" placeholder="(指定なし)">

                                <label class="block text-[10px] text-gray-500 mb-0.5 text-right">税区分</label>
                                <select v-model="row.crTaxClass" :disabled="!currentJob?.canEdit" class="w-full border border-slate-300 rounded px-1 py-1 text-[10px] bg-white mb-2">
                                    <option v-for="opt in filteredCreditTaxOptions" :key="opt.code" :value="opt.code">
                                        {{ opt.label }}
                                    </option>
                                </select>

                                <label class="block text-[10px] text-gray-500 mb-0.5 text-right">金額</label>
                                <input type="number" v-model.number="row.crAmount" :disabled="!currentJob?.canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-sm font-mono text-right bg-white">
                            </div>
                            <button v-if="currentJob?.canEdit" @click="addCreditRow" class="text-[10px] text-green-500 hover:text-green-700 flex items-center font-bold justify-end w-full mt-1">行を追加 <i class="fa-solid fa-plus-circle ml-1"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- AI Analysis Panel (Singleton) -->
            <div class="pb-10 px-4">
                <div class="bg-white border border-purple-100 rounded-lg shadow-sm overflow-hidden">
                     <div class="bg-purple-50 px-3 py-2 border-b border-purple-100 flex justify-between items-center">
                         <h5 class="text-[10px] font-bold text-purple-700 flex items-center gap-1"><i class="fa-solid fa-robot"></i> AI推論</h5>
                         <button v-if="currentJob?.canEdit && currentJob?.aiProposal?.hasProposal" @click="applyAIProposal" class="bg-purple-600 text-white text-[9px] px-2 py-0.5 rounded shadow hover:bg-purple-700 font-bold">採用する</button>
                     </div>
                     <div class="p-2">
                         <p class="text-[10px] text-gray-600 leading-relaxed">
                            {{ currentJob?.aiProposal?.reason || 'AI提案はありません。' }}
                         </p>
                         <div v-if="currentJob?.aiProposal?.hasProposal" class="mt-1 text-[9px] text-purple-600 font-bold">
                             {{ currentJob?.aiProposal?.confidenceLabel }}
                         </div>
                     </div>
                </div>
            </div>

            <!-- Sticky Footer (RPC Actions) -->
            <div class="bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 flex gap-3 h-20 items-stretch">
                <!-- 1. Remand / Unknown Button -->
                <button v-if="currentJob?.journalEditMode === 'approve'"
                        @click="toggleDecision('remand')"
                        :disabled="isProcessing"
                        :class="['flex-1 rounded-lg font-bold transition shadow-sm flex items-center justify-center text-lg border', 'bg-red-500 hover:bg-red-600 text-white border-red-600 opacity-90', isProcessing ? 'opacity-50 cursor-wait' : '']">
                    <i class="fa-solid fa-rotate-left mr-2"></i> 差戻し
                </button>
                <button v-else
                        @click="toggleDecision('unknown')"
                        :disabled="isProcessing"
                        :class="['flex-1 rounded-lg font-bold transition shadow-sm flex items-center justify-center text-lg border', 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-yellow-500 opacity-90', isProcessing ? 'opacity-50 cursor-wait' : '']">
                    <i class="fa-solid fa-circle-question mr-2"></i> 不明仕訳あり
                </button>

                <!-- 2. Exclude Button -->
                <button @click="toggleDecision('exclude')"
                        :disabled="isProcessing"
                        :class="['flex-1 rounded-lg font-bold transition shadow-sm flex items-center justify-center text-lg border', 'bg-red-600 hover:bg-red-700 text-white border-red-700 opacity-90', isProcessing ? 'opacity-50 cursor-wait' : '']">
                    <i class="fa-solid fa-ban mr-2"></i> 仕訳から除外
                </button>

                <!-- 3. Confirm / CSV Button -->
                <button v-if="currentJob?.journalEditMode === 'approve'"
                        @click="toggleDecision('csv')"
                        :disabled="!isBalanced || isProcessing"
                        :class="['flex-1 rounded-lg font-bold transition shadow-sm flex items-center justify-center text-lg border', isBalanced ? 'bg-blue-600 hover:bg-blue-700 text-white opacity-90' : 'bg-gray-300 cursor-not-allowed border-gray-300', isProcessing ? 'cursor-wait' : '']">
                    <i class="fa-solid fa-file-csv mr-2"></i> 仕訳CSV化
                </button>
                <button v-else
                        @click="toggleDecision('confirmed')"
                        :disabled="!isBalanced || isProcessing"
                        :class="['flex-1 rounded-lg font-bold transition shadow-sm flex items-center justify-center text-lg border', isBalanced ? 'bg-blue-600 hover:bg-blue-700 text-white opacity-90' : 'bg-gray-300 cursor-not-allowed border-gray-300', isProcessing ? 'cursor-wait' : '']">
                     <span v-if="isProcessing"><i class="fa-solid fa-spinner fa-spin mr-2"></i> 保存中...</span>
                     <span v-else><i class="fa-solid fa-check-circle mr-2"></i> 仕訳確定済み</span>
                </button>
            </div>
        </section>

        <!-- Right Column: Image Viewer -->
        <section class="w-[40%] bg-slate-800 relative z-20 flex flex-col">
             <!-- Overlay Info Header -->
             <div class="absolute top-0 left-0 right-0 h-10 bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center gap-2 px-2 shadow-sm">
                 <span class="text-[11px] text-slate-800 font-bold bg-white/90 px-2 py-1 rounded shadow-sm border border-white">{{ client?.fiscalMonthLabel || '-' }}</span>
                 <span class="text-[11px] text-slate-800 font-bold bg-white/90 px-2 py-1 rounded shadow-sm border border-white">{{ client?.softwareLabel || '-' }}</span>
                 <span class="text-[11px] text-slate-800 font-bold bg-white/90 px-2 py-1 rounded shadow-sm border border-white">{{ client?.taxInfoLabel || '-' }}</span>
             </div>

             <!-- Image Area -->
             <div class="flex-1 flex items-center justify-center overflow-hidden relative group">
                 <!-- Zoom Controls (Floating) -->
                 <div class="absolute left-4 top-20 bg-black/60 backdrop-blur rounded-lg flex flex-col gap-1 p-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button class="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded"><i class="fa-solid fa-plus"></i></button>
                     <button class="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded"><i class="fa-solid fa-minus"></i></button>
                     <button class="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded"><i class="fa-solid fa-rotate-right"></i></button>
                 </div>

                 <img v-if="selectedJob?.driveFileUrl" :src="selectedJob.driveFileUrl" class="max-w-full max-h-full object-contain shadow-2xl transition-transform duration-200" alt="Receipt">
                 <div v-else class="text-gray-500 flex flex-col items-center">
                     <i class="fa-regular fa-image text-5xl mb-2"></i>
                     <span class="text-xs">画像未選択</span>
                 </div>
             </div>
        </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useJournalEntryRPC } from '@/composables/useJournalEntryRPC';
import type { JournalLineUi } from '@/types/ui.type';
import { TAX_OPTIONS } from '@/constants/options';

const route = useRoute();
const router = useRouter();
const containerRef = ref<HTMLElement|null>(null);

const { journalEntry, fetchJournalEntry, updateJournalEntry, isLoading, error } = useJournalEntryRPC();

// Alias for Template Compatibility
const currentJob = computed(() => journalEntry.value);
const selectedJob = computed(() => journalEntry.value); // Deprecated alias

const client = computed(() => ({
    companyName: journalEntry.value?.companyName || '',
    clientCode: journalEntry.value?.clientCode || '',
    // Mock other client props or fetch if needed
    fiscalMonthLabel: '3月決算',
    softwareLabel: '弥生会計',
    taxInfoLabel: '原則課税'
}));

// -- UI State --
const selectedJobSummary = ref('');
const isProcessing = ref(false);

const filteredDebitTaxOptions = computed(() => {
    return TAX_OPTIONS.filter(opt => opt.type === 'purchase' || opt.code === 'TAX_SALES_NONE');
});
const filteredCreditTaxOptions = computed(() => {
    return TAX_OPTIONS.filter(opt => opt.type === 'sales' || opt.code === 'TAX_PURCHASE_NONE');
});

// Date Binding
const transactionDateStr = computed({
    get: () => journalEntry.value?.transactionDate?.replace(/\//g, '-') || new Date().toISOString().split('T')[0],
    set: (v) => {
        // Local update only, save triggers API
        // For now, no-op or local ref update. In real app, bind to a form object.
        console.log('Date update requested:', v);
    }
});

// UI Form Helper Interface (Flat Support)
interface EditableJournalLine {
    lineNo: number;
    drAccount: string;
    drSubAccount: string;
    drSub: string;
    drAmount: number;
    drTaxClass: string;
    drTaxAmount: number;
    crAccount: string;
    crSubAccount: string;
    crSub: string;
    crAmount: number;
    crTaxClass: string;
    crTaxAmount: number;
    description: string;
    departmentCode: string;
    note: string;
    invoiceIssuer: string;
    taxRate: number;
}

const debitRows = ref<EditableJournalLine[]>([]);
const creditRows = ref<EditableJournalLine[]>([]);

const totalAmount = computed(() => debitRows.value.reduce((sum, r) => sum + (Number(r.drAmount) || 0), 0));
const creditTotal = computed(() => creditRows.value.reduce((sum, r) => sum + (Number(r.crAmount) || 0), 0));
const isBalanced = computed(() => Math.abs(totalAmount.value - creditTotal.value) < 1 && totalAmount.value > 0);
const balanceDiff = computed(() => totalAmount.value - creditTotal.value);

// Lifecycle
onMounted(async () => {
    containerRef.value?.focus();
    const routeJobId = route.params.id as string;
    if (routeJobId) {
        await fetchJournalEntry(routeJobId);
        initializeForm();
    }
});

// Watch for data load
watch(journalEntry, () => {
    if (journalEntry.value) {
         initializeForm();
    }
});

function initializeForm() {
    if (!journalEntry.value) return;
    const lines = journalEntry.value.lines;

    // Mapping Logic (BFF Nested -> UI Flat)
    const mapToEditable = (l?: JournalLineUi): EditableJournalLine => {
         if (!l) return createEmptyRow(1);
         return {
             lineNo: l.lineNo,
             drAccount: l.debit.account,
             drSubAccount: l.debit.subAccount,
             drSub: l.debit.subAccount,
             drAmount: l.debit.amount,
             drTaxClass: l.debit.taxCode,
             drTaxAmount: 0,
             crAccount: l.credit.account,
             crSubAccount: l.credit.subAccount,
             crSub: l.credit.subAccount,
             crAmount: l.credit.amount,
             crTaxClass: l.credit.taxCode,
             crTaxAmount: 0,
             description: l.description,
             departmentCode: '', note: '',
             invoiceIssuer: 'unknown', taxRate: 10
         };
    };

    if (!lines || lines.length === 0) {
        const def = createEmptyRow(1);
        debitRows.value = [def];
        creditRows.value = [{...def}];
    } else {
        debitRows.value = lines.map(mapToEditable);
        creditRows.value = lines.map(mapToEditable);
    }
    selectedJobSummary.value = journalEntry.value.summary || '';
}

function createEmptyRow(lineNo: number): EditableJournalLine {
    return {
        lineNo,
        drAccount: '', drSubAccount: '', drSub: '', drAmount: 0, drTaxClass: 'TAX_PURCHASE_10', drTaxAmount: 0,
        crAccount: '', crSubAccount: '', crSub: '', crAmount: 0, crTaxClass: 'TAX_PURCHASE_NONE', crTaxAmount: 0,
        description: selectedJobSummary.value,
        departmentCode: '', note: '', invoiceIssuer: 'unknown', taxRate: 10
    };
}

// Row Operations
function addDebitRow() { debitRows.value.push(createEmptyRow(debitRows.value.length + 1)); }
function removeDebitRow(idx: number) { debitRows.value.splice(idx, 1); }
function addCreditRow() { creditRows.value.push(createEmptyRow(creditRows.value.length + 1)); }
function removeCreditRow(idx: number) { creditRows.value.splice(idx, 1); }

// Navigation (Simplified)
function goBack() { router.push('/journal-status'); }

// Actions
async function toggleDecision(decision: string) {
    if (!journalEntry.value) return;
    try {
        isProcessing.value = true;
        // Construct payload
        const payload = {
            transactionDate: transactionDateStr.value,
            summary: selectedJobSummary.value,
            status: decision, // 'approve', 'remand', etc.
            lines: debitRows.value.map(row => ({
                lineNo: row.lineNo,
                description: row.description,
                debit: {
                    account: row.drAccount,
                    subAccount: row.drSubAccount,
                    amount: row.drAmount,
                    taxCode: row.drTaxClass,
                    taxAmount: 0
                },
                credit: {
                    account: row.crAccount,
                    subAccount: row.crSubAccount,
                    amount: row.crAmount,
                    taxCode: row.crTaxClass,
                    taxAmount: 0
                },
                departmentCode: row.departmentCode,
                invoiceIssuer: row.invoiceIssuer
            }))
        };

        await updateJournalEntry(journalEntry.value.id, payload);
        alert('保存しました');
        goBack();
    } catch (e) {
        console.error(e);
        alert('エラーが発生しました');
    } finally {
        isProcessing.value = false;
    }
}

function applyAIProposal() {
    if (!journalEntry.value?.aiProposal?.hasProposal) return;
    const p = journalEntry.value.aiProposal;

    // Map AI Proposal to Rows
    const newDebits: EditableJournalLine[] = [];
    p.debits.forEach((d, i) => {
        const r = createEmptyRow(i+1);
        r.drAccount = d.account;
        r.drSubAccount = d.subAccount;
        r.drAmount = d.amount || 0;
        newDebits.push(r);
    });

    const newCredits: EditableJournalLine[] = [];
    p.credits.forEach((c, i) => {
        const r = createEmptyRow(i+1);
        r.crAccount = c.account;
        r.crSubAccount = c.subAccount;
        r.crAmount = c.amount || 0;
        newCredits.push(r);
    });

    if (newDebits.length > 0) debitRows.value = newDebits;
    if (newCredits.length > 0) creditRows.value = newCredits;
    selectedJobSummary.value = p.summary || '';
}

function toggleLock() { alert('ロック機能はBFF管理下に移行しました'); }

</script>

<style scoped>
/* Keyframes kept from original if needed */
@keyframes stripe {
    0% { background-position: 0 0; }
    100% { background-position: 30px 60px; }
}
.animate-stripe {
    background-image: linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.15) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.15) 50%,
        rgba(255, 255, 255, 0.15) 75%,
        transparent 75%,
        transparent
    );
    background-size: 30px 30px;
    animation: stripe 2s linear infinite;
}
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>
