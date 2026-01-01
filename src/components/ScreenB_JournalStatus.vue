
<template>
  <div class="h-full flex flex-col bg-white rounded-lg shadow border border-gray-200 overflow-hidden animate-fade-in">
    <!-- Filter Bar -->
    <div class="p-3 border-b border-gray-200 bg-slate-50 flex justify-between items-center shrink-0">
        <div class="text-xs text-gray-500 flex items-center gap-2">
            <i class="fa-solid fa-calculator text-blue-400"></i>
            <span>全クライアントの仕訳進捗を管理できます</span>
        </div>
        <div class="flex items-center gap-2">
            <select v-model="filters.actionStatus" class="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:border-blue-500 font-bold text-slate-600">
                <option value="">すべてのアクション</option>
                <option value="rescue">エラー確認</option>
                <option value="work">1次仕訳</option>
                <option value="remand">差戻対応</option>
                <option value="approve">最終承認</option>
                <option value="export">CSV出力</option>
                <option value="archive">仕訳対象外</option>
                <option value="done">完了</option>
            </select>
            <div class="relative">
                <i class="fa-solid fa-search absolute left-2 top-1.5 text-gray-400 text-xs"></i>
                <input type="text" v-model="filters.masterSearch" placeholder="ID / 会社名で検索" class="pl-7 pr-2 py-1 text-xs border border-gray-300 rounded w-48 focus:border-blue-500">
            </div>
        </div>
    </div>

    <!-- Table Header -->
    <div class="bg-white border-b border-gray-200 flex text-[10px] sm:text-xs font-bold text-slate-600 shrink-0 shadow-sm z-10">
        <div class="p-2 w-56 border-r flex-shrink-0 flex items-center bg-slate-50">顧問先情報</div>
        <div class="flex-1 grid grid-cols-7 min-w-[700px]">
            <div class="p-2 text-center border-r bg-blue-50/30 flex items-center justify-center">STEP 1<br>資料受領</div>
            <div class="p-2 text-center border-r bg-blue-50/30 flex items-center justify-center">STEP 2<br>AI解析</div>
            <div class="p-2 text-center border-r bg-indigo-50 text-indigo-800 border-b-4 border-indigo-400 flex items-center justify-center">STEP 3<br>1次仕訳</div>
            <div class="p-2 text-center border-r bg-pink-50 text-pink-800 border-b-4 border-pink-400 flex items-center justify-center">STEP 4<br>最終承認</div>
            <div class="p-2 text-center border-r bg-orange-50 text-orange-800 border-b-4 border-orange-400 flex items-center justify-center">STEP 5<br>差戻対応</div>
            <div class="p-2 text-center border-r bg-green-50 text-green-800 border-b-4 border-green-500 flex items-center justify-center">STEP 6<br>CSV出力</div>
            <div class="p-2 text-center border-r bg-gray-50 flex items-center justify-center">STEP 7<br>原本整理</div>
        </div>
        <div class="p-2 w-40 bg-slate-100 text-center flex-shrink-0 flex items-center justify-center shadow-inner">次のアクション</div>
    </div>

    <!-- Scrollable List -->
    <div class="overflow-y-auto flex-1">
        <div v-for="client in filteredClients" :key="client.jobId"
             :class="['flex border-b border-gray-100 transition items-center h-24 group', getRowBaseClass(client)]">

            <!-- Client Info Cell -->
            <div class="p-3 w-56 border-r border-gray-100 flex flex-col justify-center h-full flex-shrink-0 transition cursor-pointer hover:bg-blue-50/50" @click="goToWorkbench(client.jobId)">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-sm truncate text-slate-800">{{ client.name }}</span>
                    <span v-if="client.isNew" class="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded animate-pulse shadow">🆕 新着</span>
                </div>
                <!-- Updated Info Row -->
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                    <!-- Code: Bold, No Background -->
                    <span class="text-[10px] font-bold text-slate-700 font-mono">{{ client.code }}</span>
                    <!-- Software: Gray Background -->
                    <span class="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-bold border border-gray-200">{{ client.settings.software }}</span>
                    <!-- Fiscal Month: Larger, Bold, Darker -->
                    <span class="text-[10px] font-extrabold text-slate-700 ml-auto">{{ client.fiscalMonth }}月決算</span>
                </div>
            </div>

            <!-- Steps Grid -->
            <div class="flex-1 grid grid-cols-7 min-w-[700px] h-full">
                <!-- Step 1: Material Receipt -->
                <div class="border-r border-gray-100 flex items-center justify-center text-lg">
                    <i v-if="client.steps.receipt.state === 'done'" class="fa-solid fa-circle-check text-green-500"></i>
                    <i v-else-if="client.steps.receipt.state === 'error'" class="fa-solid fa-circle-exclamation text-red-500"></i>
                    <span v-else class="text-gray-300">-</span>
                </div>
                <!-- Step 2: AI Analysis -->
                <div class="border-r border-gray-100 flex items-center justify-center text-lg">
                     <i v-if="client.steps.aiAnalysis.state === 'done'" class="fa-solid fa-circle-check text-green-500"></i>
                     <div v-else-if="client.steps.aiAnalysis.state === 'error'" class="text-red-600 font-bold flex flex-col items-center">
                        <i class="fa-solid fa-ban text-xl mb-1"></i>
                        <span class="text-[9px]">{{ client.steps.aiAnalysis.errorMsg || '停止中' }}</span>
                     </div>
                     <i v-else-if="client.steps.aiAnalysis.state === 'processing'" class="fa-solid fa-spinner fa-spin text-blue-500"></i>
                     <span v-else class="text-gray-300">-</span>
                </div>

                <!-- Step 3: Journal Entry -->
                <div class="border-r border-gray-100 flex items-center justify-center px-2">
                     <div v-if="client.steps.journalEntry.state === 'pending'" class="cursor-pointer w-full bg-indigo-50 border border-indigo-200 rounded overflow-hidden shadow-sm hover:shadow-md transition" @click="goToWorkbench(client.jobId, 'draft')">
                        <div class="bg-indigo-400 text-white text-[9px] font-bold text-center py-0.5">残り {{ client.steps.journalEntry.count }}件</div>
                        <div class="text-indigo-600 text-[10px] font-bold text-center py-1.5">未着手</div>
                    </div>
                    <i v-else-if="client.steps.journalEntry.state === 'done'" class="fa-solid fa-circle-check text-green-500 text-lg"></i>
                    <span v-else class="text-gray-300">-</span>
                </div>

                <!-- Step 4: Approval -->
                <div class="border-r border-gray-100 flex items-center justify-center px-2">
                     <div v-if="client.steps.approval.state === 'pending'" class="cursor-pointer w-full bg-pink-50 border border-pink-200 rounded overflow-hidden shadow-sm hover:shadow-md transition" @click="goToWorkbench(client.jobId, 'approve')">
                        <div class="bg-pink-400 text-white text-[9px] font-bold text-center py-0.5">残り {{ client.steps.approval.count }}件</div>
                        <div class="text-pink-600 text-[10px] font-bold text-center py-1.5">未承認</div>
                    </div>
                     <i v-else-if="client.steps.approval.state === 'done'" class="fa-solid fa-circle-check text-green-500 text-lg"></i>
                     <span v-else class="text-gray-300">-</span>
                </div>

                 <!-- Step 5: Remand -->
                <div class="border-r border-gray-100 flex items-center justify-center px-2">
                     <div v-if="client.steps.remand.state === 'pending'" class="cursor-pointer w-full bg-orange-50 border border-orange-200 rounded overflow-hidden shadow-sm hover:shadow-md transition" @click="goToWorkbench(client.jobId, 'remand')">
                        <div class="bg-orange-400 text-white text-[9px] font-bold text-center py-0.5">残り {{ client.steps.remand.count }}件</div>
                        <div class="text-orange-600 text-[10px] font-bold text-center py-1.5">差戻対応</div>
                    </div>
                    <i v-else-if="client.steps.remand.state === 'done'" class="fa-solid fa-circle-check text-green-500 text-lg"></i>
                    <span v-else class="text-gray-300">-</span>
                </div>


                <!-- Step 6: CSV -->
                <div class="border-r border-gray-100 flex items-center justify-center px-2 cursor-pointer hover:bg-green-50 transition" @click.stop="openDrive('export', client)">
                     <div v-if="client.steps.export.state === 'done'" class="text-[10px] font-bold flex flex-col items-center text-gray-400">
                        <i class="fa-solid fa-file-csv text-base mb-1 text-green-600"></i> 出力済
                     </div>
                     <div v-else-if="client.steps.export.state === 'ready'" class="flex items-center gap-1 text-[9px] bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 w-full justify-center shadow-sm">
                        <i class="fa-solid fa-file-export font-bold"></i> <span class="text-[10px] font-bold">未出力</span>
                    </div>
                     <span v-else class="text-gray-300">-</span>
                </div>

                <!-- Step 7: Final -->
                <div class="border-r border-gray-100 flex items-center justify-center px-2 cursor-pointer hover:bg-blue-50 transition" @click.stop="openDrive('archive', client)">
                    <i v-if="client.steps.archive.state === 'done'" class="fa-solid fa-circle-check text-green-500 text-lg"></i>
                    <div v-else-if="client.steps.archive.state === 'ready'" class="flex items-center gap-1 text-[9px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 w-full justify-center shadow-sm">
                        <i class="fa-solid fa-box-open font-bold"></i> <span class="text-[11px] font-bold">残({{ client.steps.archive.count }})</span>
                    </div>
                    <span v-else class="text-gray-300">-</span>
                </div>
            </div>


            <!-- Action Button -->
            <div class="p-3 w-40 flex-shrink-0 flex flex-col items-center justify-center gap-1 border-l border-gray-100 bg-slate-50/50">
                 <!-- 1次仕訳 (画面遷移あり) -->
                  <button v-if="client.nextAction.type === 'work'"
                         @click="handleActionClick(client)"
                         class="w-32 bg-indigo-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-indigo-700 shadow-sm animate-pulse-action transition flex items-center justify-center gap-2">
                    <i :class="client.nextAction.icon"></i> {{ client.nextAction.label }}
                </button>

                <!-- その他のアクション (モーダル表示) -->
                <button v-else-if="client.nextAction.type === 'approve'" @click="handleActionClick(client)" class="w-32 bg-pink-500 text-white px-4 py-2 rounded text-xs font-bold hover:bg-pink-600 shadow-sm animate-pulse-action transition flex items-center justify-center gap-2">
                    <i :class="client.nextAction.icon"></i> {{ client.nextAction.label }}
                </button>
                <button v-else-if="client.nextAction.type === 'remand'" @click="handleActionClick(client)" class="w-32 bg-orange-500 text-white px-4 py-2 rounded text-xs font-bold hover:bg-orange-600 shadow-sm animate-pulse-action transition flex items-center justify-center gap-2">
                    <i :class="client.nextAction.icon"></i> {{ client.nextAction.label }}
                </button>
                <button v-else-if="client.nextAction.type === 'export'" @click="handleActionClick(client)" class="w-32 bg-emerald-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-emerald-700 shadow-sm animate-pulse-action transition flex items-center justify-center gap-2">
                    <i :class="client.nextAction.icon"></i> {{ client.nextAction.label }}
                </button>
                <button v-else-if="client.nextAction.type === 'archive'" @click="handleActionClick(client)" class="w-32 bg-gray-500 text-white px-4 py-2 rounded text-[10px] font-bold hover:bg-gray-600 shadow-sm animate-pulse-action transition flex items-center justify-center gap-1">
                    <i :class="client.nextAction.icon"></i> {{ client.nextAction.label }}
                </button>
                <button v-else-if="client.nextAction.type === 'rescue'" @click="handleActionClick(client)" class="w-32 bg-red-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-red-700 shadow-sm animate-pulse-action transition flex items-center justify-center gap-2">
                    <i :class="client.nextAction.icon"></i> {{ client.nextAction.label }}
                </button>

                <!-- 完了 -->
                <button v-else class="w-32 bg-gray-300 text-gray-500 px-4 py-2 rounded text-xs font-bold cursor-not-allowed flex items-center justify-center gap-2">
                    <i :class="client.nextAction.icon"></i> {{ client.nextAction.label }}
                </button>
            </div>
        </div>
    </div>

    <!-- Modals -->
    <!-- Type: Error Rescue (Detailed) -->
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
                        <p class="text-sm text-gray-600">一部のデータ形式が不正か、必須項目が欠落しています。手動での修正が必要です。</p>
                    </div>
                </div>

                <div class="bg-slate-800 rounded p-4 mb-6 font-mono text-xs text-green-400 overflow-x-auto">
                    <div class="opacity-50 border-b border-slate-700 pb-2 mb-2">Error Log: {{ modal.path }}</div>
                    <div>TypeError: Cannot read properties of undefined (reading 'amount')</div>
                    <div>&nbsp;&nbsp;at parseInvoice (parser.js:42)</div>
                    <div>&nbsp;&nbsp;at async ProcessQueue (queue.ts:15)</div>
                    <div class="text-red-400 mt-2">>> Critical Failure at Record #1042</div>
                </div>

                <div class="flex flex-col sm:flex-row justify-end gap-3 text-sm font-bold mt-2">
                    <button @click="closeModal" class="px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-all flex items-center justify-center gap-2">
                        <i class="fa-solid fa-folder-minus"></i>
                        仕訳対象外にファイルを移動（手入力）
                    </button>
                    <button @click="closeModal" class="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                        <i class="fa-solid fa-arrow-right-to-bracket"></i>
                        1次仕訳処理にファイルを移動
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Type: Generic/Drive (Simple) -->
    <div v-else-if="modal.show" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm" @click="closeModal">
        <div class="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full transform transition-all scale-100" @click.stop>
            <div class="flex items-center gap-4 mb-4">
                <div :class="['w-12 h-12 rounded-full flex items-center justify-center text-white text-xl', modal.iconBg]">
                    <i :class="modal.icon"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 text-lg">{{ modal.title }}</h3>
                    <p class="text-xs text-gray-500">{{ modal.subtitle }}</p>
                </div>
            </div>

            <div class="bg-gray-50 p-4 rounded border border-gray-200 text-sm text-gray-600 mb-6 font-mono">
                <i class="fa-solid fa-folder-open mr-2 text-yellow-500"></i>
                {{ modal.path }}
            </div>

            <div class="flex justify-end">
                <button @click="closeModal" class="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded font-bold shadow transition">
                    OK
                </button>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive, computed, inject, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAccountingSystem, ClientActionType } from '@/composables/useAccountingSystem';
import type { Client, Job } from '@/types/firestore';

const router = useRouter();
const { clients, jobs, subscribeToAllJobs, fetchClients } = useAccountingSystem();

// --- ViewModel Interface ---
interface ClientViewModel {
    jobId: string;
    name: string;
    code: string;
    fiscalMonth: number;
    settings: { software: string };
    isNew: boolean;
    steps: {
        receipt: { state: string };
        aiAnalysis: { state: string; errorMsg?: string };
        journalEntry: { state: string; count: number };
        approval: { state: string; count: number };
        remand: { state: string; count: number };
        export: { state: string; drivePath?: string };
        archive: { state: string; count: number; drivePath?: string };
    };
    nextAction: {
        type: ClientActionType;
        label: string;
        icon: string;
        modalContext?: any;
    };
}

onMounted(async () => {
    // Ensure we have latest jobs and clients
    if (subscribeToAllJobs) {
        subscribeToAllJobs();
    }
    await fetchClients();
});

const filters = reactive({
    masterSearch: '',
    actionStatus: ''
});

const modal = reactive({
    show: false,
    type: 'normal', // 'normal' | 'error'
    title: '',
    subtitle: '',
    path: '',
    icon: '',
    iconBg: ''
});

const filteredClients = computed(() => {
    // 1. Map Raw Data to ViewModel
    const viewModelData: ClientViewModel[] = clients.value.map(client => {
        // Find active job for this client (Simple logic: take the first one or latest)
        // In real app, filter by month/status
        const clientJobs = jobs.value.filter(j => j.clientCode === client.clientCode);
        // Default State
        const steps = {
            receipt: { state: 'done' }, // Mock: Always done
            aiAnalysis: { state: 'done' }, // Mock: Always done
            journalEntry: { state: 'pending', count: 0 },
            approval: { state: 'pending', count: 0 },
            remand: { state: 'pending', count: 0 },
            export: { state: 'pending' },
            archive: { state: 'pending', count: 0 }
        };

        let nextAction = {
            type: ClientActionType.Work,
            label: '資料待ち',
            icon: 'fa-regular fa-clock'
        };

        // --- Aggregate Job Statuses ---
        // Instead of picking one activeJob, we scan ALL jobs for this client.
        const allJobs = clientJobs;
        const activeJob = allJobs[0];

        if (allJobs.length > 0) {
            // Count jobs in each state
            const draftCount = allJobs.filter(j => j.status === 'ai_processing' || j.status === 'ready_for_work').length;
            const approveCount = allJobs.filter(j => j.status === 'primary_completed' || j.status === 'review' || j.status === 'waiting_approval').length;
            const remandCount = allJobs.filter(j => j.status === 'remanded').length;
            const doneCount = allJobs.filter(j => j.status === 'approved' || j.status === 'completed' || j.status === 'excluded').length;

            // Map Counts to Steps
            if (draftCount > 0) {
                steps.journalEntry.state = 'pending'; // Active button
                steps.journalEntry.count = draftCount;
            } else if (doneCount > 0 || approveCount > 0) {
                // If past this stage
                steps.journalEntry.state = 'done';
            }

            if (approveCount > 0) {
                steps.approval.state = 'pending'; // Active button
                steps.approval.count = approveCount;
            } else if (doneCount > 0) {
                steps.approval.state = 'done';
            }

            if (remandCount > 0) {
                steps.remand.state = 'pending'; // Active button
                steps.remand.count = remandCount;
            } else if (draftCount === 0 && approveCount === 0 && doneCount > 0) {
                 // Nothing specific for remanded done state, usually just cleared or goes back to draft
                 steps.remand.state = 'none';
            }

            // Determine Primary Next Action (Priority)
            if (remandCount > 0) {
                 nextAction = { type: ClientActionType.Remand, label: '差戻対応', icon: 'fa-solid fa-reply' };
            } else if (approveCount > 0) {
                 nextAction = { type: ClientActionType.Approve, label: '最終承認', icon: 'fa-solid fa-check-double' };
            } else if (draftCount > 0) {
                 nextAction = { type: ClientActionType.Work, label: '1次仕訳', icon: 'fa-solid fa-pen-to-square' };
            } else if (doneCount > 0) {
                 nextAction = { type: ClientActionType.Export, label: 'CSV出力', icon: 'fa-solid fa-file-export' };
                 steps.export.state = 'ready';
            }
        }

        return {
            jobId: activeJob?.id || '',
            name: client.companyName,
            code: client.clientCode,
            fiscalMonth: client.fiscalMonth,
            settings: { software: client.accountingSoftware || 'freee' },
            isNew: false,
            steps: steps,
            nextAction: nextAction
        };
    });

    let result = [...viewModelData];

    // 2. Filter by Search
    if (filters.masterSearch) {
        const q = filters.masterSearch.toLowerCase();
        result = result.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.jobId.includes(q) ||
            c.code.toLowerCase().includes(q)
        );
    }

    // 3. Filter by Action Status
    if (filters.actionStatus) {
        result = result.filter(c => c.nextAction.type === filters.actionStatus);
    }

    // 4. Sort logic
    const statusPriority: Record<string, number> = {
         [ClientActionType.Rescue]: 1,
        [ClientActionType.Work]: 2,
        [ClientActionType.Remand]: 3,
        [ClientActionType.Approve]: 4,
        [ClientActionType.Export]: 5,
        [ClientActionType.Archive]: 6,
        [ClientActionType.Done]: 7
    };

    result.sort((a, b) => {
        const priorityA = statusPriority[a.nextAction.type] || 99;
        const priorityB = statusPriority[b.nextAction.type] || 99;
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        return a.code.localeCompare(b.code);
    });

    return result;
});

const goToWorkbench = (jobId: string, mode: string = 'draft') => {
    // Determine the correct job ID based on the mode if aggregating
    // But for now, we just pass the first found job or the specific one clicked.
    // Ideally, we should pass the filter to Screen E, but Screen E takes a single ID.
    // Hack: Find a job matching the mode.

    const client = filteredClients.value.find(c => c.jobId === jobId || c.jobId.startsWith(jobId.split('_')[0]));
    if (client) {
         // Re-scan jobs to find the correct one for the mode
         const cCode = client.code;
         const allJobs = jobs.value.filter(j => j.clientCode === cCode);
         let targetJob = allJobs.find(j => j.id === jobId);

         if (mode === 'draft') {
             targetJob = allJobs.find(j => j.status === 'ai_processing' || j.status === 'ready_for_work') || targetJob;
         } else if (mode === 'approve') {
             targetJob = allJobs.find(j => j.status === 'waiting_approval' || j.status === 'review' || j.status === 'primary_completed') || targetJob;
         } else if (mode === 'remand') {
             targetJob = allJobs.find(j => j.status === 'remanded') || targetJob;
         }

         if (targetJob) {
             router.push({
                path: `/journal-entry/${targetJob.id}`,
                query: { mode }
            });
            return;
         }
    }

    router.push({
        path: `/journal-entry/${jobId}`,
        query: { mode }
    });
};

/**
 * データに基づいたドライブ表示（Step 6/7 用）
 */
const openDrive = (stepKey: 'export' | 'archive', client: any) => {
    const step = client.steps[stepKey];
    if (!step?.drivePath) return;

    modal.show = true;
    modal.type = 'normal';
    modal.title = 'Drive Opened';
    modal.subtitle = stepKey === 'export' ? 'CSV出力先フォルダを開きました' : '仕訳対象外フォルダを開きました';
    modal.path = step.drivePath;
    modal.icon = stepKey === 'export' ? 'fa-solid fa-file-csv' : 'fa-solid fa-box-archive';
    modal.iconBg = stepKey === 'export' ? 'bg-green-500' : 'bg-blue-500';
};

/**
 * データに基づいたアクション実行（「次のアクション」ボタン用）
 */
const handleActionClick = (client: any) => {
    const action = client.nextAction;

    // 1次仕訳、差戻対応、最終承認は仕訳入力画面（ScreenE）へ遷移
    if (action.type === ClientActionType.Work) {
        if (!client.jobId) {
            alert('案件データが存在しません。Seedを実行するか、ファイルをアップロードしてください。');
            return;
        }
        goToWorkbench(client.jobId, 'draft');
        return;
    }
    if (action.type === ClientActionType.Remand) {
        goToWorkbench(client.jobId, 'remand');
        return;
    }
    if (action.type === ClientActionType.Approve) {
        goToWorkbench(client.jobId, 'approve');
        return;
    }

    // それ以外（Rescue, Export, Archive等）は定義されたモーダルコンテキストを表示
    if (action.modalContext) {
        modal.show = true;
        modal.type = action.modalContext.type;
        modal.title = action.modalContext.title;
        modal.subtitle = action.modalContext.subtitle || '';
        modal.path = action.modalContext.targetPath;
        modal.icon = action.modalContext.icon || action.icon;
        modal.iconBg = action.modalContext.iconBg || 'bg-gray-600';
    }
};

const closeModal = () => {
    modal.show = false;
};

const getRowBaseClass = (client: any) => {
    switch (client.nextAction.type) {
        case ClientActionType.Rescue:
            return 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500';
        case ClientActionType.Remand:
            return 'hover:bg-orange-50';
        case ClientActionType.Approve:
            return 'hover:bg-purple-50';
        case ClientActionType.Archive:
            return 'hover:bg-blue-50';
        case ClientActionType.Export:
            return 'hover:bg-green-50';
        case ClientActionType.Work:
            return 'hover:bg-indigo-50';
        case ClientActionType.Done:
            return 'hover:bg-gray-50 opacity-50 grayscale';
        default:
            return 'hover:bg-gray-50';
    }
};
</script>

<style scoped>
.animate-pulse {
    animation: customPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
.animate-pulse-subtle {
    animation: customPulseSubtle 3s ease-in-out infinite;
}
@keyframes customPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .7; }
}

/* Action Pulse Animation (Colors getting lighter and darker) */
.animate-pulse-action {
    animation: actionPulse 2s ease-in-out infinite;
}

@keyframes actionPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}
</style>
