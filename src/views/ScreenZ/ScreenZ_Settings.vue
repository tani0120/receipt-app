<template>
    <div class="animate-fade-in p-6 space-y-6">
        <!-- Header & Status -->
        <div class="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
                <h2 class="text-lg font-bold text-slate-700 flex items-center gap-2">
                    <i class="fa-solid fa-cogs"></i> システム設計・環境設定
                </h2>
                <div class="text-xs text-slate-400 mt-1">システム全体の定数およびAPI接続設定</div>
            </div>
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span class="w-2 h-2 rounded-full" :class="data.settings.systemStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'"></span>
                    <span class="font-mono font-bold text-sm text-slate-600">{{ data.settings.systemStatus }}</span>
                </div>
                <button @click="toggleSystemStatus" class="text-xs bg-slate-100 px-3 py-1.5 rounded font-bold border border-slate-300 hover:bg-slate-200 transition">
                    稼働切替
                </button>
                <button @click="saveSettings" class="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm">
                    <i class="fa-solid fa-save mr-1"></i> 設定を保存
                </button>
            </div>
        </div>

        <!-- Main Settings Sheet -->
        <section class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                <i class="fa-solid fa-sliders text-blue-600"></i> Settings Overview
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- 1. API & Base IDs -->
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-500 uppercase">GEMINI_API_KEY</label>
                    <input type="password" v-model="data.settings.geminiApiKey" class="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 transition">
                </div>
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-500 uppercase">国税局アプリケーションID</label>
                    <input type="text" v-model="data.settings.invoiceApiKey" class="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 transition">
                </div>
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-500 uppercase">SYSTEM_ROOT_ID</label>
                    <input type="text" v-model="data.settings.systemRootId" class="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 transition" placeholder="例: 1ZWiIS...">
                    <p class="text-[10px] text-gray-400">全顧問先フォルダを格納する親フォルダのGoogle Drive ID</p>
                </div>
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-500 uppercase">MASTER_SS_ID</label>
                    <input type="text" v-model="data.settings.masterSsId" class="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 transition" placeholder="例: 1XyZ...">
                    <p class="text-[10px] text-gray-400">本システム本体（00_管理用）のスプレッドシートID</p>
                </div>

                <!-- 2. AI Model & Pricing -->
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">使用モデル名</label>
                    <div class="relative">
                        <select v-model="data.settings.modelName" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono appearance-none bg-slate-50 focus:border-blue-500 transition">
                            <option value="models/gemini-3.0-flash">Gemini 3.0 Flash</option>
                            <option value="models/gemini-3.0-pro">Gemini 3.0 Pro</option>
                            <option value="models/gemini-3.0-ultra">Gemini 3.0 Ultra</option>
                        </select>
                        <i class="fa-solid fa-chevron-down absolute right-3 top-3 text-slate-400 pointer-events-none text-xs"></i>
                    </div>
                </div>
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">為替レート (JPY/USD)</label>
                     <input type="number" v-model="data.settings.exchangeRate" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                </div>
                 <div class="space-y-2 col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-2 gap-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div>
                        <label class="block text-[10px] font-bold text-blue-600 mb-1">API入力単価 ($/1M Token)</label>
                        <input type="number" v-model="data.settings.apiPriceInput" class="w-full px-2 py-1 border border-blue-200 rounded text-xs font-mono bg-white text-slate-600" readonly>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-blue-600 mb-1">API出力単価 ($/1M Token)</label>
                        <input type="number" v-model="data.settings.apiPriceOutput" class="w-full px-2 py-1 border border-blue-200 rounded text-xs font-mono bg-white text-slate-600" readonly>
                    </div>
                </div>

                <!-- 3. Scheduling & Limits -->
                 <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">ジョブ登録間隔(分)</label>
                    <input type="number" min="1" v-model="data.settings.intervalDispatchMin" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                </div>
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">ジョブ実行間隔(分)</label>
                    <input type="number" min="1" v-model="data.settings.intervalWorkerMin" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                </div>
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">学習処理間隔(分)</label>
                    <input type="number" min="1" v-model="data.settings.intervalLearnerMin" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                </div>
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">最終確認整形間隔(分)</label>
                    <input type="number" min="1" v-model="data.settings.intervalValidatorMin" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                </div>
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">知識最適化間隔(日)</label>
                    <input type="number" min="1" v-model="data.settings.intervalOptimizerDays" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                </div>
                 <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">完了通知時刻 (カンマ区切り)</label>
                    <input type="text" v-model="data.settings.notifyHours" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono" placeholder="9,12,15,18">
                </div>
                 <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">最大処理件数/1回</label>
                    <input type="number" min="1" v-model="data.settings.maxBatchSize" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                </div>
                <div class="space-y-2">
                     <label class="block text-xs font-bold text-slate-600 mb-1">タイムアウト秒</label>
                     <input type="number" min="1" v-model="data.settings.gasTimeoutLimit" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                </div>
                 <div class="space-y-2">
                     <label class="block text-xs font-bold text-slate-600 mb-1">最大リトライ回数</label>
                     <input type="number" min="1" v-model="data.settings.maxAttemptLimit" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                </div>
                <div class="space-y-2">
                     <label class="block text-xs font-bold text-slate-600 mb-1">最適化処理数/1回</label>
                     <input type="number" min="1" v-model="data.settings.maxOptBatch" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                </div>
                 <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">データ保存期間(日)</label>
                     <input type="number" min="1" v-model="data.settings.dataRetentionDays" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                </div>
            </div>

            <!-- Debug at bottom -->
            <div class="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                 <div>
                     <div class="font-bold text-slate-700 text-xs">デバッグモード (DEBUG_MODE)</div>
                     <div class="text-[10px] text-slate-400">詳細ログを出力します</div>
                 </div>
                 <div class="relative">
                    <input type="checkbox" v-model="data.settings.debugMode" class="sr-only peer">
                    <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </div>
             </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { aaa_useAdminDashboard } from '@/composables/useAdminDashboard';

const { data } = aaa_useAdminDashboard();

// Auto-set API Prices based on Model Selection (2026 Pricing)
watch(() => data.value.settings.modelName, (newModel) => {
    switch (newModel) {
        case 'models/gemini-3.0-flash':
            data.value.settings.apiPriceInput = 0.50;
            data.value.settings.apiPriceOutput = 3.00;
            break;
        case 'models/gemini-3.0-pro':
            data.value.settings.apiPriceInput = 2.00;
            data.value.settings.apiPriceOutput = 12.00;
            break;
        case 'models/gemini-3.0-ultra':
            data.value.settings.apiPriceInput = 5.00;
            data.value.settings.apiPriceOutput = 15.00;
            break;
    }
});

const toggleSystemStatus = () => {
    if (data.value.settings.systemStatus === 'ACTIVE') {
        data.value.settings.systemStatus = 'PAUSE';
    } else {
        data.value.settings.systemStatus = 'ACTIVE';
    }
};

const saveSettings = () => {
    console.log('Saved Full Settings:', data.value.settings);
    alert('設定を保存しました (Mock)\nコンソールに保存対象データを出力しました');
};
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
