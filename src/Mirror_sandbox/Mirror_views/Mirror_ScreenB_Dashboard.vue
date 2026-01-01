
<template>
  <div class="p-6 bg-slate-50 min-h-screen text-slate-800 font-sans">

    <!-- Top Stats Bar -->
    <!-- Alert Section (New) -->
    <div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-down">
      <!-- Seasonal Reminder -->
      <div v-if="seasonalItems.length > 0" class="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200 shadow-sm flex items-start gap-4">
        <div class="bg-emerald-200 p-2 rounded-lg text-emerald-700">
             <i class="fa-regular fa-calendar-check text-xl"></i>
        </div>
        <div>
            <h3 class="font-bold text-emerald-800 text-sm mb-1">{{ currentMonth }}月の季節性業務 (税務カレンダー)</h3>
            <ul class="list-disc list-inside text-xs text-emerald-700 font-bold space-y-1">
                <li v-for="item in seasonalItems" :key="item">{{ item }}</li>
            </ul>
        </div>
      </div>

       <!-- Missing Materials (Routine) -->
      <div class="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 shadow-sm flex items-start gap-4">
        <div class="bg-orange-200 p-2 rounded-lg text-orange-700">
             <i class="fa-solid fa-magnifying-glass-chart text-xl"></i>
        </div>
        <div>
            <h3 class="font-bold text-orange-800 text-sm mb-1">毎月定例の資料不足 (回収リスト)</h3>
             <ul class="list-disc list-inside text-xs text-orange-700 font-bold space-y-1">
                <li v-for="item in missingItems" :key="item">{{ item }}</li>
            </ul>
        </div>
      </div>
    </div>

    <div class="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">全体の進捗</div>
        <div class="flex items-end gap-2 mt-1">
          <span class="text-3xl font-bold text-slate-800">{{ stats.progress }}</span>
          <span class="text-sm font-bold text-slate-400 mb-1">%</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
          <div class="bg-blue-500 h-1.5 rounded-full transition-all duration-500" :style="{ width: stats.progress + '%' }"></div>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">未着手</div>
        <div class="text-2xl font-bold text-slate-700 mt-1">{{ stats.pending }} <span class="text-xs text-slate-400 font-normal">件</span></div>
      </div>

      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">完了済み</div>
        <div class="text-2xl font-bold text-emerald-600 mt-1">{{ stats.completed }} <span class="text-xs text-slate-400 font-normal">件</span></div>
      </div>
    </div>

    <!-- Main Dashboard Card -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h2 class="font-bold text-lg text-slate-800">全社仕訳ステータス (Mirror)</h2>
        <div class="text-sm text-slate-500">
            <span v-if="loading" class="flex items-center gap-2">
                <span class="animate-spin h-3 w-3 border-2 border-slate-400 border-t-transparent rounded-full"></span>
                Loading...
            </span>
            <span v-else>Total: {{ stats.total }} records</span>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100">
          <thead>
            <tr class="bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th class="px-6 py-4">取引日</th>
              <th class="px-6 py-4">クライアント</th>
              <th class="px-6 py-4">内容 (AI要約)</th>
              <th class="px-6 py-4 text-center">ステータス</th>
              <th class="px-6 py-4 text-center">Step 1: 仕訳</th>
              <th class="px-6 py-4 text-center">Step 2: 承認/対応</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="job in jobs" :key="job.id" class="hover:bg-slate-50/60 transition-colors group">

              <!-- Date -->
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                {{ formatDate(job.transactionDate) }}
              </td>

              <!-- Client -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-mono font-bold text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                  {{ job.clientCode }}
                </span>
              </td>

              <!-- Content -->
              <td class="px-6 py-4">
                <div class="text-sm text-slate-700 font-bold max-w-xs truncate">
                    {{ job.lines && job.lines[0] ? job.lines[0].description : '内容なし' }}
                </div>
                <!-- AI Reasoning Snippet -->
                <div class="text-xs text-slate-400 mt-0.5" v-if="job.aiAnalysisRaw">
                    AI信頼度: {{ Math.round(job.confidenceScore * 100) }}%
                </div>
              </td>

              <!-- Status Badge -->
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span class="px-3 py-1 rounded-full text-xs font-bold border"
                      :class="getStatusBadge(job).class">
                  {{ getStatusBadge(job).label }}
                </span>
              </td>

              <!-- Step 1: Primary Action -->
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <!-- Using Helper for conditional rendering -->
                <template v-if="getPrimaryState(job).showButton">
                   <button
                     @click="navigateToWorkbench(job.id)"
                     class="px-4 py-1.5 bg-white border border-slate-300 text-slate-600 text-xs font-bold rounded-lg shadow-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all transform active:scale-95"
                   >
                     {{ getPrimaryState(job).label }}
                   </button>
                </template>
                <template v-else-if="getPrimaryState(job).showCheck">
                   <div class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                       <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                     </svg>
                   </div>
                </template>
              </td>

              <!-- Step 2: Next Action (Final / Remand) -->
              <td class="px-6 py-4 whitespace-nowrap text-center">
                 <template v-if="getNextActionState(job).showButton">
                   <button
                     @click="handleJobAction(job.id, getNextActionState(job).action!)"
                     class="px-4 py-2 rounded-lg text-xs font-bold shadow-md transition-all transform active:scale-95"
                     :class="getNextActionState(job).style"
                   >
                     {{ getNextActionState(job).label }}
                   </button>
                 </template>
                 <template v-else-if="getNextActionState(job).type === 'DONE'">
                    <span class="text-xs font-bold text-slate-300">完了済み</span>
                 </template>
                 <template v-else>
                    <span class="text-xs text-slate-300">-</span>
                 </template>
              </td>

            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Mirror_useJobDashboard } from '@/Mirror_sandbox/Mirror_composables/Mirror_useJobDashboard'; // This might also need mirroring, but keeping shared for now unless logic is specific
import { useRouter } from 'vue-router';
import { computed, ref, onMounted } from 'vue';
import { checkSeasonalList } from '@/Mirror_sandbox/Mirror_services/Mirror_DetectionLogic';
import { analyzeRecurringTransactions } from '@/Mirror_sandbox/Mirror_services/Mirror_RecurringLogic';

const currentMonth = new Date().getMonth() + 1;
const seasonalItems = computed(() => checkSeasonalList(currentMonth));
const missingItems = ref<string[]>([]);

onMounted(async () => {
    // TODO: Fetch real AccountBalances from Firestore in final version
    // For prototype demonstration, we use the mock history verified in our tests.
    const mockHistory: any[] = [
        { accountName: '地代家賃', month: currentMonth - 1, closingBalance: 100000 },
        { accountName: '地代家賃', month: currentMonth - 2, closingBalance: 100000 },
        { accountName: '地代家賃', month: currentMonth - 3, closingBalance: 100000 },
        { accountName: '通信費', month: currentMonth - 1, closingBalance: 5000 },
        { accountName: '通信費', month: currentMonth - 2, closingBalance: 5000 },
        { accountName: '通信費', month: currentMonth - 3, closingBalance: 5000 }
    ];

    // Get current items from all jobs (in memory for demo)
    // In real app, we query Firestore for current month's transactions
    const currentMonthLines: any[] = []; // Assuming empty for this specific demo scenario -> Should trigger missing

    const alerts = analyzeRecurringTransactions(mockHistory, currentMonthLines, currentMonth);
    missingItems.value = alerts.map(a =>
        // Format: "地代家賃 (Alert Message)" or just "地代家賃"
        // Let's extract the account name from ID or use the requiredMaterial field
        a.requiredMaterial ? `${a.requiredMaterial[0]} (${currentMonth}月分)` : a.title
    );
});

// 完全なロジック分離: Templateは以下の関数・変数を呼び出すだけ
const {
    jobs,
    loading,
    stats,
    handleJobAction,

    getPrimaryState,
    getNextActionState,
    getStatusBadge,
    formatDate
} = Mirror_useJobDashboard();

const router = useRouter();
const navigateToWorkbench = (jobId: string) => {
    router.push(`/mirror_journal-entry/${jobId}`); // Point to Journal Entry route (Screen E)
};
</script>
