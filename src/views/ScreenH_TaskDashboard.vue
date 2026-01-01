<template>
  <div class="h-screen flex flex-col bg-gray-50 text-gray-800 font-sans">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
      <div class="flex items-center gap-3">
        <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">全社タスク管理</h1>
        <span class="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 border border-gray-200">Mock Mode</span>
      </div>
      <div class="flex items-center gap-4 text-sm">
        <div class="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
          <i class="fa-solid fa-chart-pie"></i>
          <span class="font-medium">今月の進捗: 68%</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm">
            AD
          </span>
          <span class="font-medium text-gray-700">管理者 太郎</span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-auto p-6">
      <div class="max-w-[1400px] mx-auto space-y-8">

        <!-- 1. Global Task Summary (8 Cards) - Configured as Filters -->
        <div class="grid grid-cols-4 gap-4">

          <!-- Card 1: Material Collection -->
          <div @click="activateFilter('missingCount')"
               class="rounded-xl border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between h-40"
               :class="activeFilter === 'missingCount' ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-200' : 'bg-white border-gray-200'">
            <div class="absolute top-4 right-4 group-hover:text-teal-50 text-teal-100 transition-colors">
              <i class="fa-solid fa-paper-plane text-5xl opacity-20"></i>
            </div>
            <div class="relative z-10">
              <div class="flex items-center gap-2 text-teal-600 font-bold mb-1">
                <i class="fa-solid fa-paper-plane"></i>
                <span>CLから資料回収</span>
              </div>
              <div class="text-3xl font-extrabold text-gray-900 mt-2">3<span class="text-sm font-normal text-gray-500 ml-1">件</span></div>
              <p class="text-xs text-gray-500 mt-1">未回収の資料があります</p>
            </div>
            <div class="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center relative z-10">
              <span class="text-xs font-semibold text-teal-600 flex items-center gap-1">
                CLから資料回収管理画面へ <i class="fa-solid fa-filter text-[10px]"></i>
              </span>
            </div>
          </div>

          <!-- Card 2: Status Check -->
          <div @click="activateFilter('alertCount')"
               class="rounded-xl border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between h-40 ring-1 ring-red-100"
               :class="activeFilter === 'alertCount' ? 'bg-red-50 border-red-300 ring-2 ring-red-200' : 'bg-white border-gray-200'">
            <div class="absolute top-4 right-4 text-red-100 group-hover:text-red-50 transition-colors">
              <i class="fa-solid fa-bell text-5xl opacity-20"></i>
            </div>
            <div class="relative z-10">
              <div class="flex items-center gap-2 text-red-600 font-bold mb-1">
                <i class="fa-solid fa-bell"></i>
                <span>CLに状況確認</span>
              </div>
              <div class="text-3xl font-extrabold text-gray-900 mt-2">5<span class="text-sm font-normal text-gray-500 ml-1">件</span></div>
              <p class="text-xs text-gray-500 mt-1">要確認リスクがあります</p>
            </div>
            <div class="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center relative z-10">
              <span class="text-xs font-semibold text-red-600 flex items-center gap-1">
                CLに状況確認一覧へ <i class="fa-solid fa-filter text-[10px]"></i>
              </span>
            </div>
          </div>

          <!-- Card 3: Drafting -->
          <div @click="activateFilter('draftCount')"
               class="rounded-xl border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between h-40"
               :class="activeFilter === 'draftCount' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : 'bg-white border-gray-200'">
            <div class="absolute top-4 right-4 text-blue-100 group-hover:text-blue-50 transition-colors">
              <i class="fa-solid fa-pen-to-square text-5xl opacity-20"></i>
            </div>
            <div class="relative z-10">
              <div class="flex items-center gap-2 text-blue-600 font-bold mb-1">
                <i class="fa-solid fa-pen-to-square"></i>
                <span class="text-sm">仕訳作業</span>
              </div>
              <div class="text-3xl font-extrabold text-gray-900 mt-2">124<span class="text-sm font-normal text-gray-500 ml-1">件</span></div>
              <div class="text-[10px] font-medium text-gray-500 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                CLから資料届/作業待ち有
              </div>
            </div>
            <div class="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center relative z-10">
              <span class="text-xs font-semibold text-blue-600 flex items-center gap-1">
                仕訳作業待ち一覧へ <i class="fa-solid fa-filter text-[10px]"></i>
              </span>
            </div>
          </div>

          <!-- Card 4: Approval -->
          <div @click="activateFilter('approvalCount')"
               class="rounded-xl border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between h-40"
               :class="activeFilter === 'approvalCount' ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200' : 'bg-white border-gray-200'">
            <div class="absolute top-4 right-4 text-purple-100 group-hover:text-purple-50 transition-colors">
              <i class="fa-solid fa-gavel text-5xl opacity-20"></i>
            </div>
            <div class="relative z-10">
              <div class="flex items-center gap-2 text-purple-600 font-bold mb-1">
                <i class="fa-solid fa-gavel"></i>
                <span>仕訳承認</span>
              </div>
              <div class="text-3xl font-extrabold text-gray-900 mt-2">15<span class="text-sm font-normal text-gray-500 ml-1">件</span></div>
              <p class="text-xs text-gray-500 mt-1">承認待ちの仕訳があります</p>
            </div>
            <div class="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center relative z-10">
              <span class="text-xs font-semibold text-purple-600 flex items-center gap-1">
                承認待ち一覧へ <i class="fa-solid fa-filter text-[10px]"></i>
              </span>
            </div>
          </div>

          <!-- Card 5: CSV Export -->
          <div @click="activateFilter('exportCount')"
               class="rounded-xl border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between h-40"
               :class="activeFilter === 'exportCount' ? 'bg-green-50 border-green-300 ring-2 ring-green-200' : 'bg-white border-gray-200'">
            <div class="absolute top-4 right-4 text-green-100 group-hover:text-green-50 transition-colors">
              <i class="fa-solid fa-file-csv text-5xl opacity-20"></i>
            </div>
            <div class="relative z-10">
              <div class="flex items-center gap-2 text-green-600 font-bold mb-1">
                <i class="fa-solid fa-file-export"></i>
                <span class="text-sm">CSV出力</span>
              </div>
              <div class="text-3xl font-extrabold text-gray-900 mt-2">4<span class="text-sm font-normal text-gray-500 ml-1">ファイル</span></div>
               <div class="text-[10px] font-medium text-gray-500 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                仕訳CSV完成/DL待ち有
              </div>
            </div>
            <div class="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center relative z-10">
              <span class="text-xs font-semibold text-green-600 flex items-center gap-1">
                CSV出力待ち一覧へ <i class="fa-solid fa-filter text-[10px]"></i>
              </span>
            </div>
          </div>

          <!-- Card 6: File Management -->
          <div @click="activateFilter('filingCount')"
               class="rounded-xl border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between h-40"
               :class="activeFilter === 'filingCount' ? 'bg-gray-100 border-gray-300 ring-2 ring-gray-200' : 'bg-white border-gray-200'">
            <div class="absolute top-4 right-4 text-gray-100 group-hover:text-gray-50 transition-colors">
              <i class="fa-solid fa-folder-open text-5xl opacity-20"></i>
            </div>
            <div class="relative z-10">
              <div class="flex items-center gap-2 text-gray-600 font-bold mb-1">
                <i class="fa-solid fa-folder-tree"></i>
                <span>仕訳外ファイルの移動</span>
              </div>
              <div class="text-3xl font-extrabold text-gray-900 mt-2">12<span class="text-sm font-normal text-gray-500 ml-1">件</span></div>
              <p class="text-xs text-gray-500 mt-1">除外ファイルの移動待ちがあります</p>
            </div>
            <div class="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center relative z-10">
               <span class="text-xs font-semibold text-gray-600 flex items-center gap-1">
                移動待ち一覧へ <i class="fa-solid fa-filter text-[10px]"></i>
              </span>
            </div>
          </div>

          <!-- Card 7: Learning Rules -->
          <div @click="activateFilter('learningCount')"
               class="rounded-xl border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between h-40"
               :class="activeFilter === 'learningCount' ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-200' : 'bg-white border-gray-200'">
            <div class="absolute top-4 right-4 text-orange-100 group-hover:text-orange-50 transition-colors">
              <i class="fa-solid fa-brain text-5xl opacity-20"></i>
            </div>
            <div class="relative z-10">
              <div class="flex items-center gap-2 text-orange-600 font-bold mb-1">
                <i class="fa-solid fa-lightbulb"></i>
                <span>仕訳ルール</span>
              </div>
              <div class="text-3xl font-extrabold text-gray-900 mt-2">8<span class="text-sm font-normal text-gray-500 ml-1">件</span></div>
              <p class="text-xs text-gray-500 mt-1">新規学習候補があります</p>
            </div>
            <div class="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center relative z-10">
              <span class="text-xs font-semibold text-orange-600 flex items-center gap-1">
                仕訳ルール編集へ <i class="fa-solid fa-filter text-[10px]"></i>
              </span>
            </div>
          </div>

           <!-- Card 8: Reconciliation -->
          <div @click="activateFilter('reconcileCount')"
               class="rounded-xl border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between h-40"
               :class="activeFilter === 'reconcileCount' ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-200' : 'bg-white border-gray-200'">
            <div class="absolute top-4 right-4 text-slate-100 group-hover:text-slate-50 transition-colors">
              <i class="fa-solid fa-scale-balanced text-5xl opacity-20"></i>
            </div>
            <div class="relative z-10">
               <div class="flex items-center gap-2 text-slate-600 font-bold mb-1 tracking-tight">
                <i class="fa-solid fa-file-invoice-dollar"></i>
                <span class="text-sm">売掛金・買掛金の入出金消込</span>
              </div>
              <div class="text-3xl font-extrabold text-gray-900 mt-2">5<span class="text-sm font-normal text-gray-500 ml-1">件</span></div>
              <p class="text-xs text-gray-500 mt-1">消込未完了リスト</p>
            </div>
            <div class="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center relative z-10">
              <span class="text-xs font-semibold text-slate-600 flex items-center gap-1">
                入出金消込一覧へ <i class="fa-solid fa-filter text-[10px]"></i>
              </span>
            </div>
          </div>

        </div>

        <!-- 2. Client List -->
        <div id="client-list-section" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
            <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
              <i class="fa-solid fa-list-ul text-gray-400"></i> 顧問先別リスト
              <span v-if="activeFilter" class="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                 <i class="fa-solid fa-filter"></i> フィルタ中: {{ getFilterName(activeFilter) }}
                 <button @click="clearFilter" class="ml-2 hover:text-red-500"><i class="fa-solid fa-times"></i></button>
              </span>
            </h2>
            <div class="flex items-center gap-2">
               <div class="relative">
                <i class="fa-solid fa-search absolute left-3 top-2.5 text-gray-400 text-xs"></i>
                <input type="text" placeholder="コード・社名で検索" class="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded hover:border-blue-400 transition-colors w-64">
              </div>
            </div>
          </div>

          <div class="flex-1 overflow-auto">
            <table class="w-full text-left border-collapse min-w-[1200px]">
              <thead class="sticky top-0 bg-gray-50 shadow-sm z-10">
                <tr class="text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200 text-center">
                  <th class="px-4 py-3 font-semibold text-left sticky left-0 bg-gray-50 z-20 w-64 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">顧問先情報</th>
                  <th class="px-2 py-3 font-semibold w-24 bg-teal-50/50 text-teal-800">資料回収</th>
                  <th class="px-2 py-3 font-semibold w-24 bg-red-50/50 text-red-800">状況確認</th>
                  <th class="px-2 py-3 font-semibold w-24 bg-blue-50/50 text-blue-800">仕訳作業</th>
                  <th class="px-2 py-3 font-semibold w-24 bg-purple-50/50 text-purple-800">仕訳承認</th>
                  <th class="px-2 py-3 font-semibold w-24 bg-green-50/50 text-green-800">CSV出力</th>
                  <th class="px-2 py-3 font-semibold w-24 bg-gray-100/50 text-gray-800">仕訳外の移動</th>
                  <th class="px-2 py-3 font-semibold w-24 bg-orange-50/50 text-orange-800">ルール編集</th>
                  <th class="px-2 py-3 font-semibold w-24 bg-slate-100/50 text-slate-800">入出金消込</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 text-sm">
                <tr v-for="client in filteredClients" :key="client.code" class="hover:bg-blue-50/30 transition-colors group">
                  <!-- Fixed Client Info Column -->
                  <td class="px-4 py-3 sticky left-0 bg-white group-hover:bg-blue-50/30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10">
                     <div class="flex flex-col">
                        <div class="text-xs font-mono text-gray-400 mb-0.5">{{ client.code }}</div>
                        <div class="font-bold text-gray-800 flex items-center gap-2">
                             {{ client.name }}
                             <span v-if="client.isIndividual" class="text-[10px] bg-gray-100 text-gray-600 border px-1 rounded">個人</span>
                        </div>
                     </div>
                  </td>

                  <!-- 1. Missing Materials -->
                  <td class="px-2 py-3 text-center border-l border-gray-50">
                     <div v-if="client.missingCount > 0" class="flex flex-col gap-1">
                     <button v-if="client.missingCount > 0" @click="navigateToTask(client, 'missingCount')" class="w-full py-1 rounded bg-teal-100 text-teal-800 font-bold hover:bg-teal-200 transition">
                             {{ client.missingCount }}件
                         </button>
                         <div v-if="client.oldestMissingDate" class="text-[10px] whitespace-nowrap text-red-500 font-bold">
                              {{ client.oldestMissingDate }}~
                         </div>
                     </div>
                     <div v-else class="text-xs text-gray-300 flex flex-col items-center">
                        <i class="fa-solid fa-check text-teal-200 mb-0.5"></i>
                        <span class="scale-90">完了 12/25</span>
                     </div>
                  </td>

                  <!-- 2. Status Check -->
                  <td class="px-2 py-3 text-center border-l border-gray-50">
                      <div v-if="client.alertCount > 0" class="flex flex-col gap-1">
                      <button v-if="client.alertCount > 0" @click="navigateToTask(client, 'alertCount')" class="w-full py-1 rounded bg-red-100 text-red-800 font-bold hover:bg-red-200 transition">
                             {{ client.alertCount }}件
                         </button>
                         <div v-if="client.oldestAlertDate" class="text-[10px] whitespace-nowrap text-red-500 font-bold">
                              {{ client.oldestAlertDate }}~
                         </div>
                      </div>
                     <div v-else class="text-xs text-gray-300 flex flex-col items-center">
                        <i class="fa-solid fa-check text-red-100 mb-0.5"></i>
                         <span class="scale-90">完了 12/25</span>
                     </div>
                  </td>

                  <!-- 3. Drafting -->
                  <td class="px-2 py-3 text-center border-l border-gray-50">
                      <div v-if="client.draftCount > 0" class="flex flex-col gap-1">
                      <button class="w-full py-1 rounded bg-blue-100 text-blue-800 font-bold hover:bg-blue-200 transition" @click="navigateToTask(client, 'draftCount')">
                            {{ client.draftCount }}件
                        </button>
                         <div v-if="client.oldestDraftDate" class="text-[10px] whitespace-nowrap text-red-500 font-bold">
                              {{ client.oldestDraftDate }}~
                        </div>
                      </div>
                      <div v-else class="text-xs text-gray-300 flex flex-col items-center">
                        <i class="fa-solid fa-check text-blue-100 mb-0.5"></i>
                         <span class="scale-90">完了 12/26</span>
                     </div>
                  </td>

                  <!-- 4. Approval -->
                  <td class="px-2 py-3 text-center border-l border-gray-50">
                      <div v-if="client.approvalCount > 0" class="flex flex-col gap-1">
                      <button v-if="client.approvalCount > 0" @click="navigateToTask(client, 'approvalCount')" class="w-full py-1 rounded bg-purple-100 text-purple-800 font-bold hover:bg-purple-200 transition">
                         {{ client.approvalCount }}件
                     </button>
                         <div v-if="client.oldestApprovalDate" class="text-[10px] whitespace-nowrap text-red-500 font-bold">
                              {{ client.oldestApprovalDate }}~
                         </div>
                      </div>
                     <div v-else class="text-xs text-gray-300 flex flex-col items-center">
                        <i class="fa-solid fa-check text-purple-100 mb-0.5"></i>
                         <span class="scale-90">完了 12/26</span>
                     </div>
                  </td>

                  <!-- 5. Export -->
                  <td class="px-2 py-3 text-center border-l border-gray-50">
                      <div v-if="client.exportCount > 0" class="flex flex-col gap-1">
                        <button class="w-full py-1 rounded bg-green-100 text-green-800 font-bold hover:bg-green-200 transition" @click="navigateToTask(client, 'exportCount')">
                            {{ client.exportCount }}件
                        </button>
                        <div v-if="client.oldestExportDate" class="text-[10px] whitespace-nowrap text-red-500 font-bold">
                              {{ client.oldestExportDate }}~
                        </div>
                      </div>
                     <div v-else class="text-xs text-gray-300 flex flex-col items-center">
                        <i class="fa-solid fa-check text-green-100 mb-0.5"></i>
                         <span class="scale-90">完了 --/--</span>
                     </div>
                  </td>

                   <!-- 6. Filing -->
                  <td class="px-2 py-3 text-center border-l border-gray-50">
                      <div v-if="client.filingCount > 0" class="flex flex-col gap-1">
                      <button v-if="client.filingCount > 0" @click="navigateToTask(client, 'filingCount')" class="w-full py-1 rounded bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition">
                         {{ client.filingCount }}件
                     </button>
                         <div v-if="client.oldestFilingDate" class="text-[10px] whitespace-nowrap text-red-500 font-bold">
                              {{ client.oldestFilingDate }}~
                         </div>
                      </div>
                     <div v-else class="text-xs text-gray-300 flex flex-col items-center">
                        <i class="fa-solid fa-check text-gray-200 mb-0.5"></i>
                         <span class="scale-90">完了 --/--</span>
                     </div>
                  </td>

                   <!-- 7. Learning -->
                  <td class="px-2 py-3 text-center border-l border-gray-50">
                      <div v-if="client.learningCount > 0" class="flex flex-col gap-1">
                      <button v-if="client.learningCount > 0" @click="navigateToTask(client, 'learningCount')" class="w-full py-1 rounded bg-orange-100 text-orange-800 font-bold hover:bg-orange-200 transition">
                         {{ client.learningCount }}件
                     </button>
                         <div v-if="client.oldestLearningDate" class="text-[10px] whitespace-nowrap text-red-500 font-bold">
                              {{ client.oldestLearningDate }}~
                         </div>
                      </div>
                     <div v-else class="text-xs text-gray-300 flex flex-col items-center">
                        <i class="fa-solid fa-check text-orange-100 mb-0.5"></i>
                         <span class="scale-90">完了 --/--</span>
                     </div>
                  </td>

                   <!-- 8. Reconcile -->
                  <td class="px-2 py-3 text-center border-l border-gray-50">
                      <div v-if="client.reconcileCount > 0" class="flex flex-col gap-1">
                      <button v-if="client.reconcileCount > 0" @click="navigateToTask(client, 'reconcileCount')" class="w-full py-1 rounded bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition">
                         {{ client.reconcileCount }}件
                     </button>
                          <div v-if="client.oldestReconcileDate" class="text-[10px] whitespace-nowrap text-red-500 font-bold">
                              {{ client.oldestReconcileDate }}~
                         </div>
                      </div>
                     <div v-else class="text-xs text-gray-300 flex flex-col items-center">
                        <i class="fa-solid fa-check text-slate-200 mb-0.5"></i>
                         <span class="scale-90">完了 12/20</span>
                     </div>
                  </td>

                </tr>
              </tbody>
            </table>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 text-center">
             表示中: {{ filteredClients.length }} 件
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Filter Type
type FilterType =
  | 'missingCount'
  | 'alertCount'
  | 'draftCount'
  | 'approvalCount'
  | 'exportCount'
  | 'filingCount'
  | 'learningCount'
  | 'reconcileCount'
  | null;

const activeFilter = ref<FilterType>(null);

function activateFilter(filter: FilterType) {
    if (activeFilter.value === filter) {
        // Toggle off if same clicked
        activeFilter.value = null;
    } else {
        activeFilter.value = filter;
    }
    scrollToClientList();
}

function clearFilter() {
    activeFilter.value = null;
}

function getFilterName(key: FilterType) {
    const map: Record<string, string> = {
        'missingCount': '資料回収',
        'alertCount': '状況確認',
        'draftCount': '仕訳作業',
        'approvalCount': '仕訳承認',
        'exportCount': 'CSV出力',
        'filingCount': '仕訳外の移動',
        'learningCount': 'ルール編集',
        'reconcileCount': '入出金消込'
    };
    return key ? map[key] : '';
}

// Navigation Logic
function navigateToTask(client: MockClient, type: FilterType) {
    if (client.code === '1001') {
        // --- Special Handling for Test Shoji (Verify Feature) ---
        // User requested: 1st (Draft), Remand (Alert), Final Approval (Approval) -> All Screen E

        if (type === 'draftCount') {
            // STEP 3: 1次仕訳 -> 1001_job02 (Ready for Work)
            router.push({ name: 'ScreenE', params: { jobId: '1001_job02' } });
            return;
        }
        if (type === 'alertCount') {
            // STEP 5: 差戻対応 (Remand/Alert) -> 1001_job04 (Remanded)
            router.push({ name: 'ScreenE', params: { jobId: '1001_job04' } });
            return;
        }
        if (type === 'approvalCount') {
            // STEP 4: 最終承認 -> 1001_job03 (Waiting Approval)
            router.push({ name: 'ScreenE', params: { jobId: '1001_job03' } });
            return;
        }
    }

    // Default Routing
    switch (type) {
        case 'missingCount':
            // Screen C: Collection Status (Detail)
            router.push({ name: 'ScreenC_Detail', params: { code: client.code } });
            break;
        case 'alertCount':
            // Screen C: Status Check (assuming details are there)
            router.push({ name: 'ScreenC_Detail', params: { code: client.code } });
            break;
        case 'draftCount':
            // Screen E: Journal Entry (need JobID, using mock logic)
             router.push({ name: 'ScreenE', params: { jobId: client.code + '_job01' } });
            break;
        case 'approvalCount':
            // Screen B: Journal Status (Approval List)
            router.push({ name: 'ScreenB_Status' }); // Ideally pass filter via query
            break;
        case 'exportCount':
            // Screen G: Data Conversion (Export)
            router.push({ name: 'DataConversion' });
            break;
        case 'filingCount':
             // Screen G: Data Conversion (Filing/File Mgmt placeholder)
            router.push({ name: 'DataConversion' });
            break;
        case 'learningCount':
            // Screen D: AI Rules
            router.push({ name: 'ScreenD' });
            break;
        case 'reconcileCount':
            // Screen C: Collection (Reconciliation)
            router.push({ name: 'ScreenC_Detail', params: { code: client.code } });
            break;
    }
}

// Mock Data for Client List (Extended)
interface MockClient {
    code: string;
    name: string;
    isIndividual: boolean;
    missingCount: number;
    oldestMissingDate?: string;
    alertCount: number;
    oldestAlertDate?: string;
    draftCount: number;
    oldestDraftDate?: string;
    approvalCount: number;
    oldestApprovalDate?: string;
    exportCount: number;
    oldestExportDate?: string;
    filingCount: number;
    oldestFilingDate?: string;
    learningCount: number;
    oldestLearningDate?: string;
    reconcileCount: number;
    oldestReconcileDate?: string;
}

const allClients = ref<MockClient[]>([
  {
    code: '1001', name: '株式会社 テスト商事', isIndividual: false,
    missingCount: 1, oldestMissingDate: '12/10',
    alertCount: 2, oldestAlertDate: '12/15',
    draftCount: 45, oldestDraftDate: '12/05',
    approvalCount: 5, oldestApprovalDate: '12/24',
    exportCount: 0,
    filingCount: 2, oldestFilingDate: '12/20',
    learningCount: 0,
    reconcileCount: 1, oldestReconcileDate: '11/30'
  },
  {
    code: '1002', name: '合同会社 サンプル', isIndividual: false,
    missingCount: 0,
    alertCount: 0,
    draftCount: 12, oldestDraftDate: '12/20',
    approvalCount: 0,
    exportCount: 120, oldestExportDate: '12/25',
    filingCount: 0,
    learningCount: 2, oldestLearningDate: '12/18',
    reconcileCount: 0
  },
  {
    code: '1003', name: '鈴木商店', isIndividual: true,
    missingCount: 2, oldestMissingDate: '11/15',
    alertCount: 3, oldestAlertDate: '11/20',
    draftCount: 67, oldestDraftDate: '11/10',
    approvalCount: 10, oldestApprovalDate: '12/01',
    exportCount: 0,
    filingCount: 10, oldestFilingDate: '11/01',
    learningCount: 6, oldestLearningDate: '12/10',
    reconcileCount: 4, oldestReconcileDate: '11/05'
  },
  {
    code: '2001', name: '田中建設', isIndividual: true,
    missingCount: 0, alertCount: 0, draftCount: 0, approvalCount: 0,
    exportCount: 380, oldestExportDate: '11/30',
    filingCount: 0, learningCount: 0, reconcileCount: 0
  },
   {
    code: '2005', name: 'Tech Solutions Inc.', isIndividual: false,
    missingCount: 0, alertCount: 0, draftCount: 0, approvalCount: 0,
    exportCount: 0, filingCount: 0, learningCount: 0, reconcileCount: 0
  }
]);

// Computed Clients based on Filter
const filteredClients = computed(() => {
    if (!activeFilter.value) return allClients.value;

    return allClients.value.filter(client => {
        const val = client[activeFilter.value!];
        return typeof val === 'number' && val > 0;
    });
});

function scrollToClientList() {
  const el = document.getElementById('client-list-section');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}
</script>

<style scoped>
/* Custom Scrollbar for modern feel */
main::-webkit-scrollbar {
  width: 8px;
}
main::-webkit-scrollbar-track {
  background: transparent;
}
main::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}
</style>
