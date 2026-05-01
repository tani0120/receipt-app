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
                                <td class="px-6 py-4 text-right text-xl text-slate-500 font-medium">{{ data.kpiCostQuality.prevYearEnd?.registeredClients ?? 0 }} <span class="text-base text-slate-400 font-medium">件</span></td>
                            </tr>
                            <tr>
                                <td class="px-6 py-4 font-bold text-lg text-slate-600">稼働中</td>
                                <td class="px-6 py-4 text-right font-extrabold text-2xl text-emerald-600">
                                    {{ data.kpiCostQuality.activeClients }} <span class="text-base font-bold">件</span>
                                </td>
                                <td class="px-6 py-4 text-right text-xl text-slate-500 font-medium">{{ data.kpiCostQuality.prevYearEnd?.activeClients ?? 0 }} <span class="text-base text-slate-400 font-medium">件</span></td>
                            </tr>
                            <tr>
                                <td class="px-6 py-4 font-bold text-lg text-slate-600">休眠・契約停止</td>
                                <td class="px-6 py-4 text-right font-bold text-2xl text-red-500">{{ data.kpiCostQuality.stoppedClients }} <span class="text-base text-slate-400 font-medium">件</span></td>
                                <td class="px-6 py-4 text-right text-xl text-slate-500 font-medium">{{ data.kpiCostQuality.prevYearEnd?.stoppedClients ?? 0 }} <span class="text-base text-slate-400 font-medium">件</span></td>
                            </tr>
                            <tr>
                                <td class="px-6 py-4 font-bold text-lg text-slate-600">担当者数</td>
                                <td class="px-6 py-4 text-right font-extrabold text-2xl text-indigo-600">{{ data.kpiCostQuality.staffCount }} <span class="text-base font-bold">名</span></td>
                                <td class="px-6 py-4 text-right text-xl text-slate-500 font-medium">{{ data.kpiCostQuality.prevYearEnd?.staffCount ?? 0 }} <span class="text-base text-slate-400 font-medium">名</span></td>
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



    </div>
</template>

<script setup lang="ts">
import { aaa_useAdminDashboard } from '@/composables/useAdminDashboard';

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
