<template>
  <div class="h-full flex flex-col bg-slate-50 font-sans text-slate-800">
    <!-- Header: Client ID & Basic Info -->
    <header class="bg-white border-b border-gray-200 px-8 py-6 shadow-sm shrink-0">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <button @click="$router.push({ name: 'ScreenA' })" class="text-xs text-slate-500 hover:text-blue-600 mb-2 flex items-center gap-1 transition-colors">
            <i class="fa-solid fa-arrow-left"></i> 顧問先一覧に戻る
          </button>
          <div class="flex items-center gap-3">
             <div class="bg-slate-800 text-white font-mono text-sm font-bold px-2 py-1 rounded">{{ clientCode }}</div>
             <h1 class="text-2xl font-bold text-slate-900">{{ clientName }}</h1>
             <span class="bg-blue-50 text-blue-700 border border-blue-100 text-xs px-2 py-0.5 rounded font-medium">{{ fiscalMonth }}月決算</span>
             <span v-if="isIndividual" class="bg-amber-50 text-amber-700 border border-amber-100 text-xs px-2 py-0.5 rounded font-medium">個人</span>
          </div>
          <div class="flex items-center gap-4 mt-2 text-sm text-slate-500">
             <div class="flex items-center gap-1"><i class="fa-solid fa-user-tie text-slate-400"></i> {{ repName }}</div>
             <div class="flex items-center gap-1"><i class="fa-solid fa-desktop text-slate-400"></i> {{ software }}</div>
             <div class="flex items-center gap-1"><i class="fa-solid fa-calculator text-slate-400"></i> {{ taxMethod }}</div>
          </div>
        </div>

        <div class="flex items-center gap-3">
            <div class="text-right mr-4">
                <div class="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Health Score</div>
                <div class="text-2xl font-bold text-green-600">A <span class="text-sm font-normal text-gray-400">/ 92</span></div>
            </div>
             <button class="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm">
                <i class="fa-solid fa-pen mr-1"></i> 編集
            </button>
        </div>
      </div>
    </header>

    <!-- Main Content: Cockpit -->
    <main class="flex-1 overflow-y-auto p-8">
        <div class="max-w-6xl mx-auto space-y-8">

            <!-- Quick Actions Grid -->
             <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                <!-- Action 1: Collection -->
                <button @click="$router.push({ name: 'ScreenC_Detail', params: { code: clientCode } })" class="group bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all text-left relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <i class="fa-solid fa-paper-plane text-6xl text-teal-600"></i>
                    </div>
                    <div class="relative z-10">
                        <div class="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                            <i class="fa-solid fa-paper-plane"></i>
                        </div>
                        <h3 class="font-bold text-lg text-slate-800 mb-1">資料回収</h3>
                        <p class="text-xs text-slate-500">領収書・通帳などの回収状況確認</p>
                        <div class="mt-4 flex items-center gap-2 text-teal-600 text-sm font-bold">
                            <span>詳細へ</span> <i class="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>
                </button>

                <!-- Action 2: Journal Entry -->
                <button @click="$router.push({ name: 'ScreenE', params: { jobId: clientCode + '_job01' } })" class="group bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <i class="fa-solid fa-pen-to-square text-6xl text-blue-600"></i>
                    </div>
                    <div class="relative z-10">
                        <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </div>
                        <h3 class="font-bold text-lg text-slate-800 mb-1">仕訳入力</h3>
                        <p class="text-xs text-slate-500">AI提案の確認・仕訳の編集</p>
                        <div class="mt-4 flex items-center gap-2 text-blue-600 text-sm font-bold">
                            <span>ワークベンチへ</span> <i class="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>
                </button>

                <!-- Action 3: Rules -->
                <button @click="$router.push({ name: 'ScreenD' })" class="group bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all text-left relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <i class="fa-solid fa-brain text-6xl text-orange-600"></i>
                    </div>
                     <div class="relative z-10">
                        <div class="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                            <i class="fa-solid fa-brain"></i>
                        </div>
                        <h3 class="font-bold text-lg text-slate-800 mb-1">AI学習ルール</h3>
                        <p class="text-xs text-slate-500">自動仕訳ルールの管理・編集</p>
                         <div class="mt-4 flex items-center gap-2 text-orange-600 text-sm font-bold">
                            <span>設定画面へ</span> <i class="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>
                </button>

                <!-- Action 4: Export (Data Conversion) -->
                 <button @click="$router.push({ name: 'aaa_DataConversion' })" class="group bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-green-300 transition-all text-left relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <i class="fa-solid fa-file-export text-6xl text-green-600"></i>
                    </div>
                    <div class="relative z-10">
                         <div class="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                            <i class="fa-solid fa-file-export"></i>
                        </div>
                        <h3 class="font-bold text-lg text-slate-800 mb-1">データ出力</h3>
                        <p class="text-xs text-slate-500">会計ソフト用CSVの出力</p>
                         <div class="mt-4 flex items-center gap-2 text-green-600 text-sm font-bold">
                            <span>出力画面へ</span> <i class="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>
                </button>
             </div>

             <!-- Status & Info Section -->
             <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Left: Status Summary -->
                <div class="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-chart-line text-slate-400"></i> 月次進捗状況
                    </h3>
                    <div class="space-y-4">
                        <!-- Progress Item 1 -->
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="font-bold text-slate-600">資料回収</span>
                                <span class="font-bold text-teal-600">85%</span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-2">
                                <div class="bg-teal-500 h-2 rounded-full" style="width: 85%"></div>
                            </div>
                        </div>
                         <!-- Progress Item 2 -->
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="font-bold text-slate-600">仕訳入力</span>
                                <span class="font-bold text-blue-600">60%</span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-2">
                                <div class="bg-blue-500 h-2 rounded-full" style="width: 60%"></div>
                            </div>
                        </div>
                         <!-- Progress Item 3 -->
                        <div>
                             <div class="flex justify-between text-sm mb-1">
                                <span class="font-bold text-slate-600">不明点確認</span>
                                <span class="font-bold text-red-500">要対応: 3件</span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-2">
                                <div class="bg-red-500 h-2 rounded-full animate-pulse" style="width: 30%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right: Recent Activity -->
                <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-clock-rotate-left text-slate-400"></i> 最近のアクティビティ
                    </h3>
                    <div class="space-y-4">
                        <div class="flex gap-3 items-start">
                            <div class="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 text-xs">
                                <i class="fa-solid fa-file-invoice"></i>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-700">領収書アップロード</p>
                                <p class="text-[10px] text-slate-500">2025/12/26 14:30 by 担当者A</p>
                            </div>
                        </div>
                        <div class="flex gap-3 items-start">
                             <div class="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0 text-xs">
                                <i class="fa-solid fa-message"></i>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-700">不明点の質問送信</p>
                                <p class="text-[10px] text-slate-500">2025/12/25 18:00 by AI System</p>
                            </div>
                        </div>
                        <div class="flex gap-3 items-start">
                             <div class="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0 text-xs">
                                <i class="fa-solid fa-check"></i>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-700">通帳データ連携完了</p>
                                <p class="text-[10px] text-slate-500">2025/12/25 10:00 by System</p>
                            </div>
                        </div>
                    </div>
                </div>
             </div>

        </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { aaa_useAccountingSystem } from '@/composables/useAccountingSystem';
import type { Client } from '@/types/firestore';

const route = useRoute();
const router = useRouter();
const { clients, fetchClients } = aaa_useAccountingSystem();

const code = computed(() => route.params.code as string);

const goBack = () => {
    router.push('/clients');
};
const client = computed(() => {
    return clients.value.find((c: Client) => c.clientCode === code.value);
});

// Computed Properties for UI
const clientCode = computed(() => client.value?.clientCode || code.value);
const clientName = computed(() => client.value?.companyName || 'Unknown Client');
const fiscalMonth = computed(() => client.value?.fiscalMonth || 12);
const repName = computed(() => client.value?.repName || '未割当');
const software = computed(() => client.value?.accountingSoftware || 'freee');
const taxMethod = computed(() => (client.value?.taxType === 'inclusive' ? '税込' : '税抜') + ' / ' + '発生主義');
const isIndividual = computed(() => false); // Mock

onMounted(() => {
    if (!clients.value.length) {
        fetchClients();
    }
});
</script>
