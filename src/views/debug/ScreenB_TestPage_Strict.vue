<template>
  <div class="h-screen flex flex-col bg-gray-50 p-6 font-sans text-slate-800">
     <!-- Filter Bar -->
    <div class="p-3 border-b border-gray-200 bg-slate-50 flex justify-between items-center shrink-0 rounded-t-lg border-t border-x shadow-sm">
        <div class="text-xs text-gray-500 flex items-center gap-2">
            <i class="fa-solid fa-calculator text-blue-400"></i>
            <span>全クライアントの仕訳進捗を管理できます (Strict Spec Ver.)</span>
        </div>
        <div class="flex items-center gap-2">
            <select v-model="filters.actionStatus" class="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:border-blue-500 font-bold text-slate-600 shadow-sm">
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
                <input type="text" v-model="filters.masterSearch" placeholder="ID / 会社名で検索" class="pl-7 pr-2 py-1 text-xs border border-gray-300 rounded w-48 focus:border-blue-500 shadow-sm">
            </div>
        </div>
    </div>

    <!-- Table Header -->
    <div class="bg-white border-x border-b border-gray-200 flex text-[10px] sm:text-xs font-bold text-slate-600 shrink-0 shadow-sm z-10">
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
    <div class="overflow-y-auto flex-1 border-x border-b border-gray-200 bg-white rounded-b-lg shadow-sm">
        <div v-for="client in filteredClients" :key="client.id"
             :class="['flex border-b border-gray-100 transition items-center h-24 group', getRowBaseClass(client)]">

            <!-- Client Info Cell -->
            <div class="p-3 w-56 border-r border-gray-100 flex flex-col justify-center h-full flex-shrink-0 transition cursor-pointer hover:bg-blue-50/50">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-sm truncate text-slate-800">{{ client.name }}</span>
                    <span v-if="client.isNew" class="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded animate-pulse shadow">🆕 新着</span>
                </div>
                <!-- Updated Info Row -->
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                    <!-- Code: Bold, No Background -->
                    <span class="text-[10px] font-bold text-slate-700 font-mono">{{ client.code }}</span>
                    <!-- Software: Gray Background -->
                    <span class="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-bold border border-gray-200">{{ client.software }}</span>
                    <!-- Fiscal Month: Larger, Bold, Darker -->
                    <span class="text-[10px] font-extrabold text-slate-700 ml-auto">{{ client.fiscalMonth }}月決算</span>
                </div>
            </div>

            <!-- Steps Grid -->
            <div class="flex-1 grid grid-cols-7 min-w-[700px] h-full">
                <!-- Step 1: Material Receipt -->
                <div class="border-r border-gray-100 flex items-center justify-center text-lg">
                    <i v-if="client.steps.receipt === 'done'" class="fa-solid fa-circle-check text-green-500"></i>
                    <i v-else-if="client.steps.receipt === 'error'" class="fa-solid fa-circle-exclamation text-red-500"></i>
                    <span v-else class="text-gray-300">-</span>
                </div>
                <!-- Step 2: AI Analysis -->
                <div class="border-r border-gray-100 flex items-center justify-center text-lg">
                     <i v-if="client.steps.aiAnalysis.state === 'done'" class="fa-solid fa-circle-check text-green-500"></i>
                     <div v-else-if="client.steps.aiAnalysis.state === 'error'" class="text-red-600 font-bold flex flex-col items-center">
                        <i class="fa-solid fa-ban text-xl mb-1"></i>
                        <span class="text-[9px]">{{ client.steps.aiAnalysis.msg || '停止中' }}</span>
                     </div>
                     <i v-else-if="client.steps.aiAnalysis.state === 'processing'" class="fa-solid fa-spinner fa-spin text-blue-500"></i>
                     <span v-else class="text-gray-300">-</span>
                </div>

                <!-- Step 3: Journal Entry -->
                <div class="border-r border-gray-100 flex items-center justify-center px-2">
                     <div v-if="client.steps.journalEntry.state === 'pending'" class="cursor-pointer w-full bg-indigo-50 border border-indigo-200 rounded overflow-hidden shadow-sm hover:shadow-md transition">
                        <div class="bg-indigo-400 text-white text-[9px] font-bold text-center py-0.5">残り {{ client.steps.journalEntry.count }}件</div>
                        <div class="text-indigo-600 text-[10px] font-bold text-center py-1.5">未着手</div>
                    </div>
                    <i v-else-if="client.steps.journalEntry.state === 'done'" class="fa-solid fa-circle-check text-green-500 text-lg"></i>
                    <span v-else class="text-gray-300">-</span>
                </div>

                <!-- Step 4: Approval -->
                <div class="border-r border-gray-100 flex items-center justify-center px-2">
                     <div v-if="client.steps.approval.state === 'pending'" class="cursor-pointer w-full bg-pink-50 border border-pink-200 rounded overflow-hidden shadow-sm hover:shadow-md transition">
                        <div class="bg-pink-400 text-white text-[9px] font-bold text-center py-0.5">残り {{ client.steps.approval.count }}件</div>
                        <div class="text-pink-600 text-[10px] font-bold text-center py-1.5">未承認</div>
                    </div>
                     <i v-else-if="client.steps.approval.state === 'done'" class="fa-solid fa-circle-check text-green-500 text-lg"></i>
                     <span v-else class="text-gray-300">-</span>
                </div>

                 <!-- Step 5: Remand -->
                <div class="border-r border-gray-100 flex items-center justify-center px-2">
                     <div v-if="client.steps.remand.state === 'pending'" class="cursor-pointer w-full bg-orange-50 border border-orange-200 rounded overflow-hidden shadow-sm hover:shadow-md transition">
                        <div class="bg-orange-400 text-white text-[9px] font-bold text-center py-0.5">残り {{ client.steps.remand.count }}件</div>
                        <div class="text-orange-600 text-[10px] font-bold text-center py-1.5">差戻対応</div>
                    </div>
                    <i v-else-if="client.steps.remand.state === 'done'" class="fa-solid fa-circle-check text-green-500 text-lg"></i>
                    <span v-else class="text-gray-300">-</span>
                </div>

                <!-- Step 6: CSV -->
                <div class="border-r border-gray-100 flex items-center justify-center px-2 cursor-pointer hover:bg-green-50 transition" @click="handleOpenDrive('export', client)">
                     <div v-if="client.steps.export === 'done'" class="text-[10px] font-bold flex flex-col items-center text-gray-400">
                        <i class="fa-solid fa-file-csv text-base mb-1 text-green-600"></i> 出力済
                     </div>
                     <div v-else-if="client.steps.export === 'ready'" class="flex items-center gap-1 text-[9px] bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 w-full justify-center shadow-sm">
                        <i class="fa-solid fa-file-export font-bold"></i> <span class="text-[10px] font-bold">未出力</span>
                    </div>
                     <span v-else class="text-gray-300">-</span>
                </div>

                <!-- Step 7: Final -->
                <div class="border-r border-gray-100 flex items-center justify-center px-2 cursor-pointer hover:bg-blue-50 transition" @click="handleOpenDrive('archive', client)">
                    <i v-if="client.steps.archive.state === 'done'" class="fa-solid fa-circle-check text-green-500 text-lg"></i>
                    <div v-else-if="client.steps.archive.state === 'ready'" class="flex items-center gap-1 text-[9px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 w-full justify-center shadow-sm">
                        <i class="fa-solid fa-box-open font-bold"></i> <span class="text-[11px] font-bold">残({{ client.steps.archive.count }})</span>
                    </div>
                    <span v-else class="text-gray-300">-</span>
                </div>
            </div>

            <!-- Action Button -->
            <div class="p-3 w-40 flex-shrink-0 flex flex-col items-center justify-center gap-1 border-l border-gray-100 bg-slate-50/50">
                 <button v-if="client.nextAction === 'work'"
                         @click="handleAction(client)"
                         class="w-32 bg-indigo-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-indigo-700 shadow-sm animate-pulse-action transition flex items-center justify-center gap-2">
                    <i class="fa-solid fa-pen-to-square"></i> 1次仕訳
                </button>

                <button v-else-if="client.nextAction === 'approve'" @click="handleAction(client)" class="w-32 bg-pink-500 text-white px-4 py-2 rounded text-xs font-bold hover:bg-pink-600 shadow-sm animate-pulse-action transition flex items-center justify-center gap-2">
                    <i class="fa-solid fa-check-double"></i> 最終承認
                </button>
                <button v-else-if="client.nextAction === 'remand'" @click="handleAction(client)" class="w-32 bg-orange-500 text-white px-4 py-2 rounded text-xs font-bold hover:bg-orange-600 shadow-sm animate-pulse-action transition flex items-center justify-center gap-2">
                    <i class="fa-solid fa-reply"></i> 差戻対応
                </button>
                <button v-else-if="client.nextAction === 'export'" @click="handleAction(client)" class="w-32 bg-emerald-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-emerald-700 shadow-sm animate-pulse-action transition flex items-center justify-center gap-2">
                    <i class="fa-solid fa-file-export"></i> CSV出力
                </button>
                <button v-else-if="client.nextAction === 'archive'" @click="handleAction(client)" class="w-32 bg-gray-500 text-white px-4 py-2 rounded text-[10px] font-bold hover:bg-gray-600 shadow-sm animate-pulse-action transition flex items-center justify-center gap-1">
                    <i class="fa-solid fa-box-archive"></i> 仕訳対象外
                </button>
                <button v-else-if="client.nextAction === 'rescue'" @click="handleRescue(client)" class="w-32 bg-red-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-red-700 shadow-sm animate-pulse-action transition flex items-center justify-center gap-2">
                    <i class="fa-solid fa-triangle-exclamation"></i> エラー確認
                </button>

                <button v-else class="w-32 bg-gray-300 text-gray-500 px-4 py-2 rounded text-xs font-bold cursor-not-allowed flex items-center justify-center gap-2">
                    <i class="fa-solid fa-check"></i> 完了
                </button>
            </div>
        </div>
    </div>

    <!-- Modals -->
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
import { reactive, computed } from 'vue';

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

// Mock Data strictly following Spec
const mockClients = [
    {
        id: '1',
        name: '株式会社エーアイシステム',
        code: '1001',
        software: 'freee',
        fiscalMonth: 3,
        isNew: true,
        steps: {
            receipt: 'done',
            aiAnalysis: { state: 'error', msg: 'フォーマット違反' },
            journalEntry: { state: 'pending', count: 0 },
            approval: { state: 'pending', count: 0 },
            remand: { state: 'pending', count: 0 },
            export: 'pending',
            archive: { state: 'pending', count: 0 }
        },
        nextAction: 'rescue'
    },
    {
        id: '2',
        name: '合同会社ベータ企画',
        code: '1002',
        software: 'マネーフォワード',
        fiscalMonth: 12,
        isNew: false,
        steps: {
            receipt: 'done',
            aiAnalysis: { state: 'done' },
            journalEntry: { state: 'pending', count: 124 },
            approval: { state: 'pending', count: 0 },
            remand: { state: 'pending', count: 0 },
            export: 'pending',
            archive: { state: 'pending', count: 0 }
        },
        nextAction: 'work'
    },
    {
        id: '3',
        name: 'Gamma Holdings',
        code: '1003',
        software: '弥生会計',
        fiscalMonth: 6,
        isNew: false,
        steps: {
            receipt: 'done',
            aiAnalysis: { state: 'done' },
            journalEntry: { state: 'done', count: 0 },
            approval: { state: 'pending', count: 15 },
            remand: { state: 'pending', count: 0 },
            export: 'pending',
            archive: { state: 'pending', count: 0 }
        },
        nextAction: 'approve'
    },
    {
        id: '4',
        name: 'Delta Services',
        code: '1004',
        software: 'freee',
        fiscalMonth: 9,
        isNew: false,
        steps: {
            receipt: 'done',
            aiAnalysis: { state: 'done' },
            journalEntry: { state: 'done', count: 0 },
            approval: { state: 'done', count: 0 },
            remand: { state: 'done', count: 0 },
            export: 'ready',
            archive: { state: 'pending', count: 0 }
        },
        nextAction: 'export'
    },
    {
        id: '5',
        name: 'Epsilon Trading',
        code: '1005',
        software: 'freee',
        fiscalMonth: 3,
        isNew: false,
        steps: {
            receipt: 'done',
            aiAnalysis: { state: 'done' },
            journalEntry: { state: 'done', count: 0 },
            approval: { state: 'done', count: 0 },
            remand: { state: 'done', count: 0 },
            export: 'done',
            archive: { state: 'ready', count: 3 }
        },
        nextAction: 'archive'
    },
    {
        id: '6',
        name: 'Zeta Corp',
        code: '1006',
        software: 'freee',
        fiscalMonth: 12,
        isNew: false,
        steps: {
            receipt: 'done',
            aiAnalysis: { state: 'done' },
            journalEntry: { state: 'done', count: 0 },
            approval: { state: 'done', count: 0 },
            remand: { state: 'pending', count: 3 },
            export: 'pending',
            archive: { state: 'pending', count: 0 }
        },
        nextAction: 'remand'
    },
    {
        id: '7',
        name: 'Eta Solutions',
        code: '1007',
        software: 'freee',
        fiscalMonth: 3,
        isNew: false,
        steps: {
            receipt: 'done',
            aiAnalysis: { state: 'done' },
            journalEntry: { state: 'done', count: 0 },
            approval: { state: 'done', count: 0 },
            remand: { state: 'done', count: 0 },
            export: 'done',
            archive: { state: 'done', count: 0 }
        },
        nextAction: 'done'
    }
];

const filteredClients = computed(() => {
    let result = mockClients;
    if (filters.actionStatus) {
        result = result.filter(c => c.nextAction === filters.actionStatus);
    }
    if (filters.masterSearch) {
        const q = filters.masterSearch.toLowerCase();
        result = result.filter(c => c.name.toLowerCase().includes(q) || c.code.includes(q));
    }
    return result;
});

const getRowBaseClass = (client: any) => {
    switch (client.nextAction) {
        case 'rescue': return 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500';
        case 'remand': return 'hover:bg-orange-50';
        case 'approve': return 'hover:bg-purple-50';
        case 'archive': return 'hover:bg-blue-50';
        case 'export': return 'hover:bg-green-50';
        case 'work': return 'hover:bg-indigo-50';
        case 'done': return 'hover:bg-gray-50 opacity-50 grayscale';
        default: return 'hover:bg-gray-50';
    }
};

const handleAction = (client: any) => {
    console.log('Action Clicked', client.nextAction);
    if (['work', 'approve', 'remand'].includes(client.nextAction)) {
        alert(`Navigating to Journal Entry for ${client.nextAction}`);
    } else {
        handleOpenDrive(client.nextAction, client);
    }
};

const handleRescue = (client: any) => {
    modal.show = true;
    modal.type = 'error';
    modal.data = client;
};

const handleOpenDrive = (type: string, client: any) => {
    modal.show = true;
    modal.type = 'drive';
    modal.title = type === 'export' ? 'CSV Export' : 'Archive';
    modal.subtitle = type;
    modal.data = client;
};

const closeModal = () => {
    modal.show = false;
};
</script>

<style scoped>
.animate-pulse-action {
    animation: actionPulse 2s ease-in-out infinite;
}
@keyframes actionPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}
</style>
