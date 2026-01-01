<template>
  <!-- [UI_Structure] Line:7 -->
  <div class="h-full flex flex-col bg-slate-100 p-8 overflow-y-auto animate-fade-in">
    <!-- [UI_Structure] Line:8 -->
    <div class="max-w-6xl mx-auto w-full">
      <!-- [UI_Structure] Line:10 -->
      <h1 class="text-3xl font-bold text-slate-800 mb-2">
         Admin Panel <span class="text-sm font-normal text-slate-500 ml-2">AI Accounting Platform (Mirror)</span>
      </h1>
      <p class="text-slate-500 mb-8">管理コンソールへようこそ。全社の業務状況を確認できます。</p>

      <!-- KPI Grid -->
      <!-- [UI_Structure] Line:14 -->
      <div class="grid grid-cols-4 gap-4 mb-8">
         <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
             <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">月間仕訳数</div>
             <div class="text-2xl font-bold text-gray-800 font-mono">
                 {{ adminData?.kpi.monthlyJournals.toLocaleString() }}
                 <span class="text-xs text-gray-400 font-normal">件</span>
             </div>
             <div class="mt-2 h-1 bg-gray-100 rounded overflow-hidden">
                 <div class="h-full bg-blue-500 w-[70%]"></div>
             </div>
         </div>

         <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
             <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">AI 自動化率</div>
             <div class="text-2xl font-bold text-indigo-600 font-mono">
                 {{ adminData?.kpi.autoConversionRate }} <span class="text-sm">%</span>
             </div>
             <div class="text-[10px] text-gray-400 mt-1">
                 <i class="fa-solid fa-arrow-trend-up text-green-500"></i> 前月比 +2.4%
             </div>
         </div>

         <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
             <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">AI 精度 (修正無)</div>
             <div class="text-2xl font-bold text-purple-600 font-mono">
                 {{ adminData?.kpi.aiAccuracy }} <span class="text-sm">%</span>
             </div>
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

      <!-- Main Content Grid -->
      <!-- [UI_Structure] Line:42 -->
      <div class="grid grid-cols-12 gap-8">
          <!-- Navigation Cards -->
          <div class="col-span-8 grid grid-cols-2 gap-6">

              <div @click="$router.push('/clients')" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition cursor-pointer group hover:-translate-y-1">
                  <div class="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                      <i class="fa-solid fa-users text-xl"></i>
                  </div>
                  <h3 class="font-bold text-gray-800 text-lg mb-2">顧問先管理 (Screen A)</h3>
                  <p class="text-sm text-gray-500">クライアント情報の登録・編集・検索</p>
              </div>

              <div @click="$router.push('/journal-status')" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition cursor-pointer group hover:-translate-y-1">
                  <div class="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
                      <i class="fa-solid fa-chart-line text-xl"></i>
                  </div>
                  <h3 class="font-bold text-gray-800 text-lg mb-2">仕訳進捗 (Screen B)</h3>
                  <p class="text-sm text-gray-500">月次仕訳の進捗ステータス管理</p>
              </div>

              <div @click="$router.push('/collection-status')" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition cursor-pointer group hover:-translate-y-1">
                  <div class="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition">
                      <i class="fa-solid fa-calendar-check text-xl"></i>
                  </div>
                  <h3 class="font-bold text-gray-800 text-lg mb-2">資料回収 (Screen C)</h3>
                  <p class="text-sm text-gray-500">資料提出状況の確認・リマインド</p>
              </div>

              <div @click="$router.push('/mirror_dashboard');" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition cursor-pointer group hover:-translate-y-1">
                  <div class="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition">
                      <i class="fa-solid fa-brain text-xl"></i>
                  </div>
                  <h3 class="font-bold text-gray-800 text-lg mb-2">AIルール設定 (Screen D)</h3>
                  <p class="text-sm text-gray-500">自動仕訳ルールの学習・管理</p>
              </div>
          </div>

          <!-- Staff Performance Sidebar -->
          <!-- [UI_Structure] Line:91 -->
          <div class="col-span-4 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div class="font-bold text-gray-700 mb-4 border-b border-gray-100 pb-2">担当者パフォーマンス</div>
              <div class="space-y-4">
                  <div v-for="(staff, idx) in adminData?.performance.staff" :key="idx" class="flex flex-col gap-1">
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

      <!-- NEW: System Configuration (Appended Detail) -->
      <hr class="my-8 border-gray-200 border-dashed">

      <section class="opacity-80 hover:opacity-100 transition-opacity">
         <h2 class="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
           <i class="fa-solid fa-cogs"></i> システム環境設定 (Advanced)
         </h2>

         <!-- System Status -->
         <div class="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex items-center justify-between">
            <div>
                <div class="font-bold text-gray-700">システム稼働状態</div>
                <div class="text-xs text-gray-400">緊急時の停止スイッチ</div>
            </div>
            <div class="flex items-center gap-4">
                <span class="font-mono font-bold" :class="systemStatus === 'ACTIVE' ? 'text-emerald-500' : 'text-red-500'">{{ systemStatus }}</span>
                <button @click="toggleSystemStatus" class="text-xs bg-gray-100 px-3 py-1.5 rounded font-bold border border-gray-300 hover:bg-gray-200">切り替え</button>
            </div>
         </div>

         <!-- API Keys (Collapsed-ish) -->
          <div class="bg-white rounded-lg border border-gray-200 p-4">
               <div class="font-bold text-gray-700 mb-2">API連携 (Secrets)</div>
               <div class="grid grid-cols-2 gap-4">
                  <div class="flex flex-col gap-1">
                      <label class="text-[10px] text-gray-400 uppercase font-bold">Gemini API Key</label>
                      <input type="password" v-model="form.geminiApiKey" class="border rounded px-2 py-1 text-xs font-mono" placeholder="AIza...">
                  </div>
                  <div class="flex flex-col gap-1">
                      <label class="text-[10px] text-gray-400 uppercase font-bold">NTA Invoice App ID</label>
                       <input type="password" v-model="form.invoiceApiKey" class="border rounded px-2 py-1 text-xs font-mono" placeholder="ApplicationID...">
                  </div>
               </div>
               <div class="mt-2 text-right">
                  <button class="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded hover:bg-blue-700" @click="saveSettings">保存</button>
               </div>
          </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';

// [Internal_Mock_Data] Injected to test UI in isolation
const adminData = ref({
    kpi: {
        monthlyJournals: 18542,
        autoConversionRate: 98.2,
        aiAccuracy: 99.8,
        funnel: {
             received: 156,
             exported: 137
        },
        monthlyTrend: [12000, 15000, 18542]
    },
    performance: {
        staff: [
            {
                name: "鈴木 一郎",
                backlogs: { total: 12, draft: 8 },
                velocity: { draftAvg: 45 }
            },
            {
                name: "佐藤 次郎",
                backlogs: { total: 5, draft: 2 },
                velocity: { draftAvg: 41 }
            }
        ]
    }
});

const systemStatus = ref<'ACTIVE' | 'Maintenance'>('ACTIVE');
const toggleSystemStatus = () => {
    systemStatus.value = systemStatus.value === 'ACTIVE' ? 'Maintenance' : 'ACTIVE';
};
const form = reactive({
    geminiApiKey: '',
    invoiceApiKey: ''
});
const saveSettings = () => {
    alert('Mock: Settings Saved\n' + JSON.stringify(form, null, 2));
};
</script>

<style scoped>
/* [Style_Definition] Items 92-98 */
.animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
