<script setup lang="ts">
import { aaa_useAccountingSystem } from '@/composables/useAccountingSystem';
const { adminData } = aaa_useAccountingSystem();
</script>

<template>
  <div class="h-full flex flex-col bg-slate-100 p-8 overflow-y-auto animate-fade-in">
    <div class="max-w-6xl mx-auto w-full">
        <!-- Header -->
        <h1 class="text-3xl font-bold text-slate-800 mb-2">AI Accounting Platform <span class="text-sm font-normal text-slate-500 ml-2">v0.1.0</span></h1>
        <p class="text-slate-500 mb-8">管理コンソールへようこそ。全社の業務状況を確認できます。</p>

        <!-- KPI Cards -->
        <div class="grid grid-cols-4 gap-4 mb-8">
            <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">月間仕訳数</div>
                <div class="text-2xl font-bold text-gray-800 font-mono">{{ adminData?.kpi.monthlyJournals.toLocaleString() }} <span class="text-xs text-gray-400 font-normal">件</span></div>
                <div class="mt-2 h-1 bg-gray-100 rounded overflow-hidden">
                    <div class="h-full bg-blue-500 w-[70%]"></div>
                </div>
            </div>
             <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">AI 自動化率</div>
                <div class="text-2xl font-bold text-indigo-600 font-mono">{{ adminData?.kpi.autoConversionRate }}<span class="text-sm">%</span></div>
                <div class="text-[10px] text-gray-400 mt-1">前月比 +2.4% <i class="fa-solid fa-arrow-trend-up text-green-500"></i></div>
            </div>
             <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">AI 精度 (修正無)</div>
                <div class="text-2xl font-bold text-purple-600 font-mono">{{ adminData?.kpi.aiAccuracy }}<span class="text-sm">%</span></div>
                <div class="text-[10px] text-gray-400 mt-1">信頼度: High</div>
            </div>
             <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">進捗状況 (Process)</div>
                <div class="flex items-end gap-1">
                    <div class="text-xl font-bold text-emerald-600 font-mono">{{ adminData?.kpi.funnel.exported }}</div>
                    <div class="text-xs text-gray-400 mb-1">/ {{ adminData?.kpi.funnel.received }}</div>
                </div>
                <div class="text-[10px] text-gray-400 mt-1">完了率 88%</div>
            </div>
        </div>

        <div class="grid grid-cols-12 gap-8">
            <!-- Navigation -->
            <div class="col-span-8 grid grid-cols-2 gap-6">
                 <!-- Card 1: Client Management -->
                <div @click="$router.push('/clients')"
                     class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition cursor-pointer group hover:-translate-y-1">
                    <div class="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                        <i class="fa-solid fa-users text-xl"></i>
                    </div>
                    <h3 class="font-bold text-gray-800 text-lg mb-2">顧問先管理 (Screen A)</h3>
                    <p class="text-sm text-gray-500">
                        顧問先一覧の確認、新規登録、ステータス管理を行います。
                    </p>
                </div>

                <!-- Card 2: Journal Status -->
                <div @click="$router.push('/journal-status')"
                     class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition cursor-pointer group hover:-translate-y-1">
                    <div class="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
                        <i class="fa-solid fa-chart-line text-xl"></i>
                    </div>
                    <h3 class="font-bold text-gray-800 text-lg mb-2">仕訳進捗 (Screen B)</h3>
                    <p class="text-sm text-gray-500">
                        全社の仕訳作業の進捗状況、KPI、担当者負荷を確認します。
                    </p>
                </div>

                <!-- Card 3: Collection Status -->
                <div @click="$router.push('/collection-status')"
                     class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition cursor-pointer group hover:-translate-y-1">
                    <div class="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition">
                        <i class="fa-solid fa-calendar-check text-xl"></i>
                    </div>
                    <h3 class="font-bold text-gray-800 text-lg mb-2">資料回収 (Screen C)</h3>
                    <p class="text-sm text-gray-500">
                        月次の資料回収状況の管理、督促対象の確認を行います。
                    </p>
                </div>

                <!-- Card 4: AI Rules -->
                <div @click="$router.push('/ai-rules')"
                     class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition cursor-pointer group hover:-translate-y-1 relative">
                    <div class="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md z-10 animate-bounce">3</div>
                    <div class="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition">
                        <i class="fa-solid fa-brain text-xl"></i>
                    </div>
                     <h3 class="font-bold text-gray-800 text-lg mb-2">AIルール設定 (Screen D)</h3>
                    <p class="text-sm text-gray-500">
                        自動仕訳の推論ルール、キーワード設定を管理します。
                    </p>
                </div>

                 <!-- Card G: Conversion -->
                <div @click="$router.push('/data-conversion')"
                     class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition cursor-pointer group hover:-translate-y-1 relative">
                    <div class="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md z-10 animate-bounce">1</div>
                    <div class="w-12 h-12 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition">
                        <i class="fa-solid fa-file-export text-xl"></i>
                    </div>
                     <h3 class="font-bold text-gray-800 text-lg mb-2">会計ソフト変換 (Screen G)</h3>
                    <p class="text-sm text-gray-500">
                        確定した仕訳データを各会計ソフト用フォーマットに変換します。
                    </p>
                </div>

                 <!-- Card H: Tasks -->
                <div @click="$router.push('/task-dashboard')"
                     class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition cursor-pointer group hover:-translate-y-1 relative">
                    <div class="w-12 h-12 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center mb-4 group-hover:bg-gray-600 group-hover:text-white transition">
                        <i class="fa-solid fa-list-check text-xl"></i>
                    </div>
                     <h3 class="font-bold text-gray-800 text-lg mb-2">全社タスク (Screen H)</h3>
                    <p class="text-sm text-gray-500">
                        全社員のタスク状況、期限管理を一覧表示します。
                    </p>
                </div>
            </div>

            <!-- Staff Performance List -->
            <div class="col-span-4 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div class="font-bold text-gray-700 mb-4 border-b border-gray-100 pb-2">担当者パフォーマンス</div>
                <div class="space-y-4">
                    <div v-for="(staff, idx) in adminData?.staff" :key="idx" class="flex flex-col gap-1">
                        <div class="flex justify-between items-center">
                            <span class="font-bold text-sm text-gray-700">{{ staff.name }}</span>
                            <span class="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">残 {{ staff.backlogs.total }}件</span>
                        </div>
                        <div class="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                             <div class="flex-1 bg-gray-100 rounded h-1.5 overflow-hidden">
                                 <div class="bg-indigo-400 h-full" :style="`width: ${(staff.backlogs.draft / staff.backlogs.total) * 100}%`"></div>
                             </div>
                             <span>処理速度: {{ staff.velocity.draftAvg }}/h</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
