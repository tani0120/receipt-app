<template>
  <div class="h-full flex flex-col bg-slate-100 overflow-hidden text-slate-800 font-sans">

    <!-- Header -->
    <header class="bg-white/80 backdrop-blur-md border-b border-gray-200 h-20 shrink-0 flex items-center justify-between px-8 z-10 sticky top-0">
        <div class="flex items-center gap-4">
            <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-3 cursor-pointer tracking-tight" @click="currentView = 'dashboard'">
                管理者専用画面 <span class="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">AI Accounting Platform</span>
            </h1>
            <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 shadow-sm">
                <span class="w-2 h-2 rounded-full" :class="{
                    'bg-emerald-500': data.settings.systemStatus === 'ACTIVE',
                    'bg-amber-500': data.settings.systemStatus === 'PAUSE',
                    'bg-rose-500 animate-pulse': data.settings.systemStatus === 'EMERGENCY_STOP'
                }"></span>
                <span class="font-bold font-mono text-xs text-slate-600">{{ data.settings.systemStatus }}</span>
            </div>
        </div>

        <div class="flex items-center gap-4">
            <button @click="toggleEmergency" class="bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white transition px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 group shadow-sm">
                <i class="fa-solid fa-power-off"></i> 緊急停止
            </button>
            <button @click="isCsvModalOpen = true" class="bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-600 hover:text-white transition px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-100">
                <i class="fa-solid fa-file-csv"></i> 一括CSV出力
            </button>
            <button @click="isNavOpen = true" class="bg-slate-800 text-white hover:bg-slate-700 transition px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-slate-200">
                <i class="fa-solid fa-sliders"></i> 環境設定等
            </button>
        </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto p-6 relative">
        <ScreenZ_Dashboard
            v-if="currentView === 'dashboard'"
            @open-staff-modal="isStaffModalOpen = true"
        />

        <div v-else-if="currentView === 'rules_detail'" class="max-w-[1230px] mx-auto">
            <ScreenZ_RuleDetail
                v-if="currentRule"
                :rule-id="currentRule.id"
                :rule-name="currentRule.name"
                :initial-content="currentRule.description"
                @back="currentView = 'rules'"
                @save="handleRuleSave"
            />
        </div>

        <div v-else-if="currentView === 'prompts_detail'" class="max-w-[1230px] mx-auto">
            <ScreenZ_PromptDetail
                v-if="currentPrompt"
                :prompt-id="currentPrompt.id"
                :prompt-name="currentPrompt.name"
                :initial-content="currentPrompt.value"
                @back="currentView = 'prompts'"
                @save="handlePromptSave"
            />
        </div>

        <div v-else class="max-w-[1230px] mx-auto">
            <div class="flex items-center gap-2 text-sm mb-6 text-gray-500">
                <span class="hover:text-blue-600 cursor-pointer" @click="currentView = 'dashboard'"><i class="fa-solid fa-home"></i> Dashboard</span>
                <i class="fa-solid fa-chevron-right text-xs"></i>
                <span class="font-bold text-slate-700">{{ viewTitle }}</span>
            </div>

            <component
                :is="activeComponent"
                @select-rule="handleSelectRule"
                @select-prompt="handleSelectPrompt"
                @create-prompt="handleCreatePrompt"
            />
        </div>
    </main>

    <!-- Navigation Drawer -->
    <div v-if="isNavOpen" @click="isNavOpen = false" class="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm transition-opacity"></div>
    <div class="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col"
         :class="isNavOpen ? 'translate-x-0' : 'translate-x-full'">

        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
            <h2 class="font-bold text-slate-700 text-lg flex items-center gap-2">
                <i class="fa-solid fa-sliders text-gray-400"></i> 設定メニュー
            </h2>
            <button @click="isNavOpen = false" class="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition">
                <i class="fa-solid fa-times"></i>
            </button>
        </div>

        <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
            <button @click="switchView('settings')" class="w-full text-left p-3 rounded-lg flex items-center gap-3 hover:bg-blue-50 hover:text-blue-600 transition group" :class="{'bg-blue-50 text-blue-600 border border-blue-100': currentView === 'settings'}">
                <div class="w-8 h-8 rounded bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-blue-200 group-hover:text-blue-600 transition">
                    <i class="fa-solid fa-cogs"></i>
                </div>
                <div>
                    <div class="font-bold text-sm">システム設計・環境設定</div>
                    <div class="text-[10px] text-gray-400">API Key, システム定数</div>
                </div>
            </button>
            <button @click="switchView('masters')" class="w-full text-left p-3 rounded-lg flex items-center gap-3 hover:bg-green-50 hover:text-green-600 transition group" :class="{'bg-green-50 text-green-600 border border-green-100': currentView === 'masters'}">
                 <div class="w-8 h-8 rounded bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-green-200 group-hover:text-green-600 transition">
                    <i class="fa-solid fa-book"></i>
                </div>
                <div>
                    <div class="font-bold text-sm">標準科目等マスタ</div>
                    <div class="text-[10px] text-gray-400">推移先ページの設定</div>
                </div>
            </button>
            <button @click="switchView('rules')" class="w-full text-left p-3 rounded-lg flex items-center gap-3 hover:bg-orange-50 hover:text-orange-600 transition group" :class="{'bg-orange-50 text-orange-600 border border-orange-100': currentView === 'rules'}">
                 <div class="w-8 h-8 rounded bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-orange-200 group-hover:text-orange-600 transition">
                    <i class="fa-solid fa-gavel"></i>
                </div>
                <div>
                    <div class="font-bold text-sm">共通処理ルール編集</div>
                    <div class="text-[10px] text-gray-400">AIルール, 税区分, 出力形式</div>
                </div>
            </button>
            <button @click="switchView('prompts')" class="w-full text-left p-3 rounded-lg flex items-center gap-3 hover:bg-purple-50 hover:text-purple-600 transition group" :class="{'bg-purple-50 text-purple-600 border border-purple-100': currentView === 'prompts'}">
                 <div class="w-8 h-8 rounded bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-purple-200 group-hover:text-purple-600 transition">
                    <i class="fa-solid fa-terminal"></i>
                </div>
                <div>
                    <div class="font-bold text-sm">プロンプト編集</div>
                    <div class="text-[10px] text-gray-400">AIプロンプト, GASプロンプト</div>
                </div>
            </button>
            <button @click="switchView('migration')" class="w-full text-left p-3 rounded-lg flex items-center gap-3 hover:bg-slate-50 hover:text-slate-600 transition group" :class="{'bg-slate-50 text-slate-600 border border-slate-100': currentView === 'migration'}">
                 <div class="w-8 h-8 rounded bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-slate-200 group-hover:text-slate-600 transition">
                    <i class="fa-solid fa-truck-fast"></i>
                </div>
                <div>
                    <div class="font-bold text-sm">データ移行ツール (Dev)</div>
                    <div class="text-[10px] text-gray-400">Migration Tester</div>
                </div>
            </button>

            <div class="pt-4 mt-4 border-t border-gray-100">
                <div class="text-xs font-bold text-gray-400 px-2 mb-2 uppercase">External Links</div>
                <a :href="`https://docs.google.com/spreadsheets/d/${data.settings.masterSsId}`" target="_blank" class="w-full text-left p-2 rounded-lg flex items-center gap-3 hover:bg-emerald-50 hover:text-emerald-700 transition group text-slate-600">
                    <i class="fa-solid fa-table w-5 text-center text-emerald-500"></i>
                    <span class="text-xs font-bold">MASTER SS (本体)</span>
                    <i class="fa-solid fa-external-link-alt ml-auto text-[10px] opacity-0 group-hover:opacity-100"></i>
                </a>
                <a :href="`https://drive.google.com/drive/folders/${data.settings.systemRootId}`" target="_blank" class="w-full text-left p-2 rounded-lg flex items-center gap-3 hover:bg-blue-50 hover:text-blue-700 transition group text-slate-600">
                    <i class="fa-brands fa-google-drive w-5 text-center text-blue-500"></i>
                    <span class="text-xs font-bold">システムROOT</span>
                    <i class="fa-solid fa-external-link-alt ml-auto text-[10px] opacity-0 group-hover:opacity-100"></i>
                </a>
                <a href="https://script.google.com" target="_blank" class="w-full text-left p-2 rounded-lg flex items-center gap-3 hover:bg-yellow-50 hover:text-yellow-700 transition group text-slate-600">
                    <i class="fa-solid fa-code w-5 text-center text-yellow-500"></i>
                    <span class="text-xs font-bold">Google Apps Script</span>
                    <i class="fa-solid fa-external-link-alt ml-auto text-[10px] opacity-0 group-hover:opacity-100"></i>
                </a>
            </div>
        </nav>
        <div class="p-4 bg-gray-50 border-t border-gray-200 text-center">
            <button @click="switchView('dashboard')" class="text-xs font-bold text-gray-500 hover:text-blue-600 flex items-center justify-center gap-2 w-full py-2 hover:bg-gray-100 rounded">
                <i class="fa-solid fa-home"></i> ダッシュボードに戻る
            </button>
        </div>
    </div>

    <!-- Modals -->
    <Z_StaffModal
        :visible="isStaffModalOpen"
        @close="isStaffModalOpen = false"
        @save="handleStaffSave"
        @delete="handleStaffDelete"
    />

    <!-- CSV Confirmation Modal -->
    <div v-if="isCsvModalOpen" class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div class="p-6 text-center">
                <div class="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fa-solid fa-file-csv text-3xl"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-800 mb-2">ダウンロードしますか？</h3>
                <p class="text-slate-500 text-sm mb-6">すべての詳細データをCSV形式で出力します。<br>この操作はログに記録されます。</p>
                <div class="flex gap-3">
                    <button @click="isCsvModalOpen = false" class="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition">
                        いいえ
                    </button>
                    <button @click="handleCsvDownload" class="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2" :disabled="isDownloading">
                        <i v-if="isDownloading" class="fa-solid fa-circle-notch fa-spin"></i>
                        <span v-else>はい</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAdminDashboard } from '@/composables/useAdminDashboard';
import type { RuleCategory, PromptItem } from '@/composables/useAdminDashboard';

// Components
import ScreenZ_Dashboard from './ScreenZ/ScreenZ_Dashboard.vue';
import ScreenZ_Settings from './ScreenZ/ScreenZ_Settings.vue';
import ScreenZ_Masters from './ScreenZ/ScreenZ_Masters.vue';
import ScreenZ_Rules from './ScreenZ/ScreenZ_Rules.vue';
import ScreenZ_Prompts from './ScreenZ/ScreenZ_Prompts.vue';
import ScreenZ_RuleDetail from './ScreenZ/ScreenZ_RuleDetail.vue';
import ScreenZ_PromptDetail from './ScreenZ/ScreenZ_PromptDetail.vue';
import Z_StaffModal from './ScreenZ/Z_StaffModal.vue';
import MigrationTester from '@/components/debug/MigrationTester.vue';

const { data } = useAdminDashboard();

// View State
type ViewType = 'dashboard' | 'settings' | 'masters' | 'rules' | 'prompts' | 'rules_detail' | 'prompts_detail' | 'migration';
const currentView = ref<ViewType>('dashboard');
const currentRule = ref<RuleCategory | null>(null);
const currentPrompt = ref<PromptItem | null>(null);
const isNavOpen = ref(false);
const isStaffModalOpen = ref(false);

const activeComponent = computed(() => {
    switch(currentView.value) {
        case 'settings': return ScreenZ_Settings;
        case 'masters': return ScreenZ_Masters;
        case 'rules': return ScreenZ_Rules;
        case 'prompts': return ScreenZ_Prompts;
        case 'migration': return MigrationTester;
        default: return ScreenZ_Dashboard;
    }
});

const viewTitle = computed(() => {
    switch(currentView.value) {
        case 'settings': return 'システム設計・環境設定';
        case 'masters': return '標準科目等マスタ推移';
        case 'rules': return '共通処理ルール編集';
        case 'prompts': return 'プロンプト編集';
        case 'rules_detail': return '共通処理ルール編集 - 詳細';
        case 'prompts_detail': return 'プロンプト編集 - 詳細';
        case 'migration': return 'データ移行ツール (Migration Tester)';
        default: return 'Dashboard';
    }
});

const switchView = (view: ViewType) => {
    console.log('Switching view to:', view); // Debug Log
    currentView.value = view;
    isNavOpen.value = false;
};

// --- Handlers ---

const handleSelectRule = (rule: RuleCategory) => {
    currentRule.value = rule;
    currentView.value = 'rules_detail';
};
const handleRuleSave = (newContent: string) => {
    alert('ルール定義を保存しました: ' + newContent.substring(0, 20) + '...');
    currentView.value = 'rules';
};

const handleSelectPrompt = (prompt: PromptItem) => {
    currentPrompt.value = prompt;
    currentView.value = 'prompts_detail';
};

const handleCreatePrompt = (type: 'AI' | 'GAS') => {
    // Auto Generate ID
    const list = type === 'AI' ? data.value.prompts.ai : data.value.prompts.gas;
    const prefix = type === 'AI' ? 'P' : 'G';
    const maxNum = list
        .map(p => parseInt(p.id.split('-')[1] || '0'))
        .reduce((a, b) => Math.max(a, b), 0);
    const newId = `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;

    // Set new prompt state
    currentPrompt.value = {
        id: newId,
        name: `新規${type}プロンプト`,
        value: ''
    };
    currentView.value = 'prompts_detail';
};

const handlePromptSave = (newContent: string) => {
    alert('プロンプト内容を保存しました: ' + newContent.substring(0, 20) + '...');
    currentView.value = 'prompts';
};

// Emergency Stop Mock
const toggleEmergency = () => {
    if (data.value.settings.systemStatus === 'EMERGENCY_STOP') {
        if(confirm('緊急停止を解除し、システムをACTIVEにしますか？')) {
            data.value.settings.systemStatus = 'ACTIVE';
        }
    } else {
        const input = prompt('緊急停止を実行しますか？実行する場合は "EMERGENCY" と入力してください。');
        if (input === 'EMERGENCY') {
            data.value.settings.systemStatus = 'EMERGENCY_STOP';
        }
    }
};

// Staff Mock Actions
const handleStaffSave = (staffData: Record<string, unknown> & { name: string; email: string }) => {
    alert(`担当者登録: ${staffData.name} (${staffData.email})`);
    isStaffModalOpen.value = false;
};
const handleStaffDelete = () => {
    alert(`担当者を削除しました`);
    isStaffModalOpen.value = false;
};

// CSV Export
const isCsvModalOpen = ref(false);
const isDownloading = ref(false);
const { downloadCsv } = useAdminDashboard();

const handleCsvDownload = async () => {
    isDownloading.value = true;
    const success = await downloadCsv();
    isDownloading.value = false;
    isCsvModalOpen.value = false;
    if(success) alert('CSVダウンロードが完了しました');
};
</script>

<style scoped>
nav::-webkit-scrollbar {
    width: 4px;
}
nav::-webkit-scrollbar-thumb {
    background-color: #e2e8f0;
    border-radius: 4px;
}
</style>
