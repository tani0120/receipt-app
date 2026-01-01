<template>
    <div class="space-y-10 animate-fade-in pb-16 text-slate-600 font-sans max-w-[1230px] mx-auto">

        <!-- 1. 全社：コスト & 品質 -->
        <section v-if="data.kpiCostQuality">
            <div class="flex items-center gap-3 mb-4">
                <span class="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                <h2 class="font-extrabold text-2xl text-slate-700">1. 全社：コスト & 品質 <span class="text-base font-bold text-slate-400 ml-3">登録・仕訳状況</span></h2>
            </div>
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                <!-- Left: 登録状況 -->
                <div class="p-0">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 text-sm uppercase text-slate-400 font-bold border-b border-slate-100">
                            <tr>
                                <th class="px-6 py-3 w-1/2">項目</th>
                                <th class="px-6 py-3 text-right">実績値 (今月)</th>
                                <th class="px-6 py-3 text-right">前年末</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <tr>
                                <td class="px-6 py-4 font-bold text-lg text-slate-600">登録顧問先数</td>
                                <td class="px-6 py-4 text-right font-extrabold text-2xl text-indigo-600">{{ data.kpiCostQuality.registeredClients }} <span class="text-base font-bold">件</span></td>
                                <td class="px-6 py-4 text-right text-xl text-slate-500 font-medium">{{ data.kpiCostQuality.prevYearEnd?.registeredClients }} <span class="text-base text-slate-400 font-medium">件</span></td>
                            </tr>
                            <tr>
                                <td class="px-6 py-4 font-bold text-lg text-slate-600">稼働中顧問先数</td>
                                <td class="px-6 py-4 text-right font-extrabold text-2xl text-emerald-600">
                                    {{ data.kpiCostQuality.activeClients }} <span class="text-base font-bold">件</span>
                                </td>
                                <td class="px-6 py-4 text-right text-xl text-slate-500 font-medium">{{ data.kpiCostQuality.prevYearEnd?.activeClients }} <span class="text-base text-slate-400 font-medium">件</span></td>
                            </tr>
                            <tr>
                                <td class="px-6 py-4 font-bold text-lg text-slate-600">停止中顧問先数</td>
                                <td class="px-6 py-4 text-right font-bold text-2xl text-red-500">{{ data.kpiCostQuality.stoppedClients }} <span class="text-base text-slate-400 font-medium">件</span></td>
                                <td class="px-6 py-4 text-right text-xl text-slate-500 font-medium">{{ data.kpiCostQuality.prevYearEnd?.stoppedClients }} <span class="text-base text-slate-400 font-medium">件</span></td>
                            </tr>
                            <tr>
                                <td class="px-6 py-4 font-bold text-lg text-slate-600">担当者数</td>
                                <td class="px-6 py-4 text-right font-extrabold text-2xl text-indigo-600">{{ data.kpiCostQuality.staffCount }} <span class="text-base font-bold">名</span></td>
                                <td class="px-6 py-4 text-right text-xl text-slate-500 font-medium">{{ data.kpiCostQuality.prevYearEnd?.staffCount }} <span class="text-base text-slate-400 font-medium">名</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <!-- Right: 仕訳処理効率 -->
                <div class="p-0">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 text-sm uppercase text-slate-400 font-bold border-b border-slate-100">
                            <tr>
                                <th class="px-6 py-3 w-1/2">項目</th>
                                <th class="px-6 py-3 text-right">実績値 (今月)</th>
                                <th class="px-6 py-3 text-right">1年移動平均</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <tr>
                                <td class="px-6 py-4 font-bold text-lg text-slate-600">月仕訳数／処理時間</td>
                                <td class="px-6 py-4 text-right font-extrabold text-xl text-indigo-600">
                                    {{ data.kpiCostQuality.performance?.monthlyJournals }}件 / {{ data.kpiCostQuality.performance?.processingTime }}
                                </td>
                                <td class="px-6 py-4 text-right text-lg text-slate-500 font-medium">
                                    {{ data.kpiCostQuality.performanceYearAvg?.monthlyJournals }}件 / {{ data.kpiCostQuality.performanceYearAvg?.processingTime }}
                                </td>
                            </tr>
                            <tr>
                                <td class="px-6 py-4 font-bold text-lg text-slate-600">1h処理仕訳数</td>
                                <td class="px-6 py-4 text-right font-extrabold text-2xl text-indigo-600">
                                    {{ data.kpiCostQuality.performance?.velocityPerHour }} <span class="text-base font-bold">件/h</span>
                                </td>
                                <td class="px-6 py-4 text-right text-lg text-slate-500 font-medium">
                                    {{ data.kpiCostQuality.performanceYearAvg?.velocityPerHour }} <span class="text-sm text-slate-400">件/h</span>
                                </td>
                            </tr>
                            <tr>
                                <td class="px-6 py-4 font-bold text-lg text-slate-600">100仕訳処理時間</td>
                                <td class="px-6 py-4 text-right font-extrabold text-2xl text-indigo-600">
                                    {{ data.kpiCostQuality.performance?.timePer100Journals }} <span class="text-base font-bold">秒</span>
                                </td>
                                <td class="px-6 py-4 text-right text-lg text-slate-500 font-medium">
                                    {{ data.kpiCostQuality.performanceYearAvg?.timePer100Journals }} <span class="text-sm text-slate-400">秒</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- 2. 全社：生産性 -->
        <section v-if="data.kpiProductivity">
            <div class="flex items-center gap-3 mb-4">
                <span class="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                <h2 class="font-extrabold text-2xl text-slate-700">2. 全社：生産性 <span class="text-base font-bold text-slate-400 ml-3">仕訳数 & API費用</span></h2>
            </div>
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table class="w-full text-left">
                    <thead class="bg-slate-50 text-sm uppercase text-slate-400 font-bold border-b border-slate-100">
                        <tr>
                            <th class="px-6 py-3 w-1/4">期間</th>
                            <th class="px-6 py-3 text-right">仕訳数</th>
                            <th class="px-6 py-3 text-right">API費用</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        <!-- This Month -->
                        <tr class="bg-indigo-50/30">
                            <td class="px-6 py-4 font-bold text-lg text-indigo-600">今月</td>
                            <td class="px-6 py-4 text-right font-extrabold text-2xl text-indigo-600">
                                {{ data.kpiProductivity.journals?.thisMonth?.toLocaleString() }} <span class="text-base font-bold">件</span>
                                <span class="text-base text-slate-400 font-medium ml-2">（先月: {{ data.kpiProductivity.journals?.lastMonth?.toLocaleString() }}件）</span>
                            </td>
                            <td class="px-6 py-4 text-right font-extrabold text-2xl text-indigo-600">
                                ¥{{ data.kpiProductivity.apiCost?.thisMonthForecast?.toLocaleString() }}
                                <span class="text-base text-slate-400 font-medium ml-2">（先月: ¥{{ data.kpiProductivity.apiCost?.lastMonth?.toLocaleString() }}）</span>
                            </td>
                        </tr>
                        <!-- Monthly Avg -->
                        <tr>
                            <td class="px-6 py-4 font-bold text-lg text-slate-600">月平均 <span class="text-sm font-normal text-slate-400 ml-2">1年移動平均</span></td>
                            <td class="px-6 py-4 text-right text-xl text-slate-500 font-medium">{{ data.kpiProductivity.journals?.monthlyAvg?.toLocaleString() }} <span class="text-sm text-slate-400">件</span></td>
                            <td class="px-6 py-4 text-right text-xl text-slate-500 font-medium">¥{{ data.kpiProductivity.apiCost?.monthlyAvg?.toLocaleString() }}</td>
                        </tr>
                        <!-- Last Year Same Month -->
                        <tr>
                            <td class="px-6 py-4 font-bold text-lg text-slate-600">昨年同月</td>
                            <td class="px-6 py-4 text-right text-xl text-slate-500 font-medium">{{ data.kpiProductivity.journals?.lastYearSameMonth?.toLocaleString() }} <span class="text-sm text-slate-400">件</span></td>
                            <td class="px-6 py-4 text-right text-xl text-slate-500 font-medium">¥{{ data.kpiProductivity.apiCost?.lastYearSameMonth?.toLocaleString() }}</td>
                        </tr>
                        <!-- This Year Total -->
                        <tr class="bg-indigo-50/10">
                            <td class="px-6 py-4 font-bold text-lg text-indigo-600">今年 <span class="text-sm font-normal text-slate-400 ml-2">暦年合計</span></td>
                            <td class="px-6 py-4 text-right font-extrabold text-2xl text-indigo-600">{{ data.kpiProductivity.journals?.thisYear?.toLocaleString() }} <span class="text-base font-bold">件</span></td>
                            <td class="px-6 py-4 text-right font-extrabold text-2xl text-indigo-600">¥{{ data.kpiProductivity.apiCost?.thisYear?.toLocaleString() }}</td>
                        </tr>
                        <!-- Last Year Total -->
                        <tr>
                            <td class="px-6 py-4 font-bold text-lg text-slate-600">昨年 <span class="text-sm font-normal text-slate-400 ml-2">暦年合計</span></td>
                            <td class="px-6 py-4 text-right text-xl text-slate-500 font-medium">{{ data.kpiProductivity.journals?.lastYear?.toLocaleString() }} <span class="text-sm text-slate-400">件</span></td>
                            <td class="px-6 py-4 text-right text-xl text-slate-500 font-medium">¥{{ data.kpiProductivity.apiCost?.lastYear?.toLocaleString() }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- 3. 担当者管理（ファイル処理ファネル） -->
        <section v-if="data.staffList">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <span class="w-1.5 h-6 bg-indigo-400 rounded-full"></span>
                    <h2 class="font-extrabold text-2xl text-slate-700">3. 担当者管理 <span class="text-base font-bold text-slate-400 ml-3">ファイル処理ファネル</span></h2>
                </div>
                <!-- Register Button -->
                <button class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-3 rounded transition shadow-sm" @click="$emit('open-staff-modal')">
                    <i class="fa-solid fa-plus mr-2"></i> 登録
                </button>
            </div>
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table class="w-full text-left">
                    <thead class="bg-slate-50 text-sm uppercase text-slate-400 font-bold border-b border-slate-100">
                        <tr>
                            <th class="px-6 py-3 w-1/6">役職区分</th>
                            <th class="px-6 py-3 w-1/6">役割</th>
                            <th class="px-6 py-3 w-1/4">氏名</th>
                            <th class="px-6 py-3 w-1/4">メールアドレス</th>
                            <th class="px-6 py-3 text-right">アクション</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        <tr v-for="staff in data.staffList" :key="staff.id" class="group hover:bg-slate-50/50 transition">
                            <td class="px-6 py-5 font-bold text-slate-500">
                                <span class="px-3 py-1 rounded border text-sm"
                                    :class="staff.role === '管理者' ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-white border-slate-200 text-slate-500'">
                                    {{ staff.role }}
                                </span>
                            </td>
                            <td class="px-6 py-5 font-medium text-lg text-slate-600">{{ staff.role === '管理者' ? '管理者' : '実務者' }}</td>
                            <td class="px-6 py-5 font-bold text-xl text-slate-700">{{ staff.name }}</td>
                            <td class="px-6 py-5 font-mono text-base text-slate-500">{{ staff.email }}</td>
                            <td class="px-6 py-5 text-right">
                                <button class="text-indigo-600 hover:text-indigo-800 text-sm font-bold px-4 py-2 rounded hover:bg-indigo-50 transition" @click="$emit('open-staff-modal', staff)">
                                    編集 {{ staff.role === '管理者' ? '(管理者固定)' : '' }}
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- 4. 担当者個別分析 (Compact List) -->
        <section v-if="data.staffAnalysis">
            <div class="flex items-center gap-3 mb-4">
                <span class="w-1.5 h-6 bg-orange-400 rounded-full"></span>
                <h2 class="font-extrabold text-2xl text-slate-700">4. 担当者個別分析 <span class="text-base font-bold text-slate-400 ml-3">詳細指標</span></h2>
            </div>
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table class="w-full text-left">
                     <thead class="bg-slate-50 text-sm uppercase text-slate-400 font-bold border-b border-slate-100">
                        <tr>
                            <th class="px-6 py-3">担当者名</th>
                            <th class="px-6 py-3 text-right">今月仕訳数</th>
                            <th class="px-6 py-3 text-right">月平均仕訳数</th>
                            <th class="px-6 py-3 text-right">年間API利用料</th>
                            <th class="px-6 py-3 text-right">月仕訳数／平均処理時間 (今月)</th>
                            <th class="px-6 py-3 text-right">月仕訳数／平均処理時間 (平均)</th>
                            <th class="px-6 py-3 text-right">1h処理仕訳数 (平均)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 text-slate-600">
                        <tr v-for="(staff, index) in data.staffAnalysis" :key="index" class="hover:bg-slate-50/50 transition">
                            <td class="px-6 py-5 font-bold text-lg text-slate-700">{{ staff.name }}</td>
                            <td class="px-6 py-5 text-right text-xl font-extrabold text-indigo-600">{{ staff.performance.thisMonthJournals }}</td>
                            <td class="px-6 py-5 text-right text-lg text-slate-500">{{ staff.performance.monthlyAvgJournals }}</td>
                            <td class="px-6 py-5 text-right text-lg text-indigo-600 font-extrabold">¥{{ (staff.performance.annualApiCost / 1000).toFixed(0) }}千円</td>
                            <td class="px-6 py-5 text-right text-lg font-mono font-extrabold text-indigo-600">{{ staff.performance.velocityThisMonth }}</td>
                            <td class="px-6 py-5 text-right text-lg font-mono text-slate-400">{{ staff.performance.velocityAvg }}</td>
                            <td class="px-6 py-5 text-right text-xl font-bold text-slate-700">{{ staff.performance.velocityPerHourAvg }} <span class="text-sm font-normal text-slate-400">件/h</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- 5. 担当別業務滞留 (Japanese Keys) -->
        <section v-if="data.staffAnalysis">
            <div class="flex items-center gap-3 mb-4">
                <span class="w-1.5 h-6 bg-rose-500 rounded-full"></span>
                <h2 class="font-extrabold text-2xl text-slate-700">5. 担当別業務滞留 <span class="text-base font-bold text-slate-400 ml-3">プロセス別件数</span></h2>
            </div>
            <div v-for="(staff, index) in data.staffAnalysis" :key="'backlog-' + index" class="mb-6">
                <h3 class="font-bold text-lg text-slate-500 mb-2 px-2 border-l-4 border-slate-300">{{ staff.name }}</h3>
                <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-6">
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <div v-for="(status, key) in staff.backlog" :key="key"
                            class="flex items-center justify-between p-5 rounded-lg border transition bg-white border-slate-200 shadow-sm">
                            <div class="text-sm font-bold text-slate-500">{{ key }}</div>
                            <div class="font-bold font-mono text-xl">
                                <span :class="status.waiting > 0 ? 'text-red-600 font-extrabold' : 'text-indigo-600 font-medium'">
                                    {{ status.waiting }}
                                </span>
                                <span class="text-slate-300 text-sm">/ {{ status.processed }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 6. 顧問先別コスト・効率分析 (Compact List) -->
         <section v-if="data.clientAnalysis">
            <div class="flex items-center gap-3 mb-4">
                <span class="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                <h2 class="font-extrabold text-2xl text-slate-700">6. 顧問先別コスト・効率分析 <span class="text-base font-bold text-slate-400 ml-3">詳細一覧</span></h2>
            </div>
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                 <table class="w-full text-left">
                    <thead class="bg-slate-50 text-sm uppercase text-slate-400 font-bold border-b border-slate-100">
                        <tr>
                            <th class="px-6 py-3 w-16">コード</th>
                            <th class="px-6 py-3 w-1/4">会社名</th>
                            <th class="px-6 py-3 w-1/6">担当者名</th>
                            <th class="px-6 py-3 text-right">今月仕訳数</th>
                            <th class="px-6 py-3 text-right">年度仕訳数</th>
                            <th class="px-6 py-3 text-right">昨年度仕訳数</th>
                            <th class="px-6 py-3 text-right">年度API費用</th>
                            <th class="px-6 py-3 text-right">月仕訳数／時間 (今月)</th>
                            <th class="px-6 py-3 text-right">月仕訳数／時間 (平均)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 text-slate-600">
                        <tr v-for="client in data.clientAnalysis" :key="client.code" class="hover:bg-slate-50/50 transition">
                             <td class="px-6 py-5 font-mono text-lg font-bold text-slate-400">{{ client.code }}</td>
                             <td class="px-6 py-5 font-bold text-lg text-slate-700">{{ client.name }}</td>
                             <td class="px-6 py-5 text-base text-slate-600">{{ client.staffName }}</td>
                             <td class="px-6 py-5 text-right text-xl font-extrabold text-indigo-600">{{ client.performance.journalsThisMonth }}</td>
                             <td class="px-6 py-5 text-right text-lg font-extrabold text-indigo-600">{{ client.performance.journalsThisYear }}</td>
                             <td class="px-6 py-5 text-right text-lg text-slate-400">{{ client.performance.journalsLastYear }}</td>
                             <td class="px-6 py-5 text-right text-lg text-indigo-600 font-extrabold">¥{{ (client.performance.apiCostThisYear)?.toLocaleString() }}</td>
                             <td class="px-6 py-5 text-right text-lg font-mono font-extrabold text-indigo-600">{{ client.performance.velocityThisMonth }}</td>
                             <td class="px-6 py-5 text-right text-lg font-mono text-slate-400">{{ client.performance.velocityAvg }}</td>
                        </tr>
                    </tbody>
                 </table>
            </div>
         </section>

    </div>
</template>

<script setup lang="ts">
import { aaa_useAdminDashboard } from '@/aaa/aaa_composables/aaa_useAdminDashboard';

defineEmits(['open-staff-modal']);
const { data } = aaa_useAdminDashboard();
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
