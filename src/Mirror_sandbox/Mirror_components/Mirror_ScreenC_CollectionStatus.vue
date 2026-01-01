<template>
  <div class="h-full flex flex-col bg-white rounded-lg shadow border border-gray-200 overflow-hidden animate-fade-in relative">
      <!-- MOCK CONTROLS FOR TESTING -->
      <div v-if="testControls" class="bg-red-50 p-2 text-xs border-b border-red-200 flex gap-4 items-center shrink-0">
          <span class="font-bold text-red-600">[MIRROR WORLD] Screen C</span>
          <label><input type="checkbox" v-model="mockIsDetailView"> 詳細モード</label>
          <select v-model="mockRouteParamsCode" class="border rounded px-1">
              <option value="">コードなし (一覧)</option>
              <option value="1001">1001: テスト商事</option>
              <option value="1003">1003: 鈴木商店 (個人)</option>
          </select>
      </div>

      <!-- DETAIL VIEW -->
      <div v-if="isDetailView && currentClient" class="h-full flex flex-col bg-slate-50 overflow-hidden animate-fade-in relative w-full">
          <div class="p-6 max-w-7xl mx-auto w-full overflow-y-auto">
              <button @click="goBack" class="text-xs text-gray-500 hover:text-blue-500 mb-4 flex items-center">
                  <i class="fa-solid fa-arrow-left mr-1"></i> 全社回収一覧に戻る
              </button>

              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 flex justify-between items-start">
                  <div>
                      <div class="flex items-center gap-3 mb-2">
                          <span class="bg-slate-100 text-slate-600 text-sm px-2 py-1 rounded font-mono font-bold">{{ currentClient.code }}</span>
                          <h1 class="text-2xl font-bold text-slate-800">{{ currentClient.name }}</h1>
                          <span class="text-xs bg-slate-100 px-2 py-1 rounded border text-slate-500">
                              {{ currentClient.type === 'individual' ? '個人' : '法人' }} ({{ currentClient.fiscalMonth }}月決算)
                          </span>
                      </div>
                      <div class="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 inline-flex">
                          <i class="fa-solid fa-calendar-check text-blue-500"></i>
                          <span class="text-sm text-blue-800 font-bold">第 5 期 ({{ viewYearStart }}/04 〜 {{ viewYearStart + 1 }}/03)</span>
                          <span class="text-xs text-blue-400 border-l border-blue-200 pl-3">現在 8ヶ月目</span>
                      </div>
                  </div>
                  <div class="flex flex-col items-end gap-2">
                      <button @click="openReportModal" class="bg-slate-700 text-white px-4 py-2 rounded text-sm font-bold hover:bg-slate-800 shadow-sm flex items-center gap-2">
                          <i class="fa-regular fa-copy"></i> 報告文作成
                      </button>
                      <p class="text-[10px] text-gray-400">設定に基づきリアルタイム生成します</p>
                  </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div class="lg:col-span-2 grid grid-cols-2 gap-4">
                        <!-- Receipt (Always Active) -->
                        <div class="flex flex-col justify-between p-4 rounded-lg border shadow-sm h-36 relative transition bg-green-50 border-green-200 text-green-800">
                            <div class="space-y-1">
                                <div class="font-bold text-sm flex items-center gap-2">
                                    <i class="fa-solid fa-receipt"></i> 領収書
                                </div>
                                <div class="text-xs">最新受領日: <span class="font-bold">2025/11/25</span></div>
                            </div>
                            <div class="flex justify-between items-end border-t border-green-100 pt-2">
                                <span class="text-xs text-green-600 font-bold"><i class="fa-solid fa-check"></i> 順調</span>
                            </div>
                        </div>

                        <!-- Banks (Dynamic) -->
                        <template v-for="bank in currentClient.banks" :key="bank.id">
                            <div :class="['flex flex-col justify-between p-4 rounded-lg border shadow-sm h-36 relative transition', bank.status === 'connected' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800']">
                                <button @click.stop="deleteBank(bank.id)" class="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition">
                                    <i class="fa-solid fa-trash text-xs"></i>
                                </button>
                                <div class="space-y-1 pr-4">
                                    <div class="font-bold text-sm truncate flex flex-wrap gap-x-2 items-baseline">
                                        <span class="text-xs text-slate-500"><i class="fa-solid fa-building-columns"></i></span>
                                        <span>{{ bank.bankName }}</span>
                                        <span class="text-xs font-normal">{{ bank.branchName }}</span>
                                        <span class="text-xs font-mono bg-white/50 px-1 rounded">{{ maskNumber(bank.accountNumber) }}</span>
                                    </div>
                                    <div class="text-xs mt-2">受領期間: <span class="font-bold">10/01 〜 10/31</span></div>
                                </div>
                                <div class="flex justify-between items-end border-t pt-2" :class="bank.status === 'connected' ? 'border-green-100' : 'border-red-100'">
                                    <span v-if="bank.status === 'connected'" class="text-xs text-green-600 font-bold"><i class="fa-solid fa-check"></i> 連携OK</span>
                                    <span v-else-if="bank.status === 'error'" class="text-xs text-red-600 font-bold"><i class="fa-solid fa-triangle-exclamation"></i> エラー</span>
                                    <span v-else class="text-xs text-gray-400 font-bold">手動</span>
                                </div>
                            </div>
                        </template>

                        <div v-if="!currentClient.banks?.length" class="flex flex-col justify-center items-center p-4 rounded-lg border border-dashed border-gray-300 text-gray-400 h-36">
                            <i class="fa-solid fa-building-columns text-2xl mb-2"></i>
                            <span class="text-xs">銀行口座未登録</span>
                        </div>

                        <!-- Add Bank Button -->
                        <div class="flex flex-col justify-center items-center p-4 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 text-blue-500 hover:bg-blue-50 hover:border-blue-300 cursor-pointer h-36 transition" @click="openBankModal">
                            <i class="fa-solid fa-plus text-xl mb-1"></i>
                            <span class="text-xs font-bold">銀行口座を追加</span>
                        </div>

                        <!-- Credit Cards (Dynamic) -->
                        <template v-for="card in currentClient.creditCards" :key="card.id">
                            <div :class="['flex flex-col justify-between p-4 rounded-lg border shadow-sm h-36 relative transition', card.status === 'connected' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800']">
                                <button @click.stop="deleteCard(card.id)" class="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition">
                                    <i class="fa-solid fa-trash text-xs"></i>
                                </button>
                                <div class="space-y-1 pr-4">
                                    <div class="font-bold text-sm truncate flex flex-wrap gap-x-2 items-baseline">
                                        <span class="text-xs text-slate-500"><i class="fa-regular fa-credit-card"></i></span>
                                        <span>{{ card.companyName }}</span>
                                        <span class="text-xs font-mono bg-white/50 px-1 rounded">{{ maskNumber(card.last4Digits) }}</span>
                                    </div>
                                    <div class="text-[10px] text-gray-500 pl-4">{{ card.withdrawalAccount || '引落口座未設定' }}</div>
                                    <div class="text-xs mt-1">受領期間: <span class="font-bold">10/01 〜 10/31</span></div>
                                </div>
                                <div class="flex justify-between items-end border-t pt-2" :class="card.status === 'connected' ? 'border-green-100' : 'border-red-100'">
                                    <p v-if="card.status === 'connected'" class="text-xs text-green-600 font-bold mt-1">連携OK</p>
                                    <p v-else-if="card.status === 'error'" class="text-xs text-red-500 font-bold mt-1">エラー</p>
                                    <p v-else class="text-xs text-gray-400 font-bold mt-1">手動</p>
                                </div>
                            </div>
                        </template>

                        <div v-if="!currentClient.creditCards?.length" class="flex flex-col justify-center items-center p-4 rounded-lg border border-dashed border-gray-300 text-gray-400 h-36">
                            <i class="fa-regular fa-credit-card text-2xl mb-2"></i>
                            <span class="text-xs">カード未登録</span>
                        </div>

                        <!-- Add Card Button -->
                        <div class="flex flex-col justify-center items-center p-4 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 text-blue-500 hover:bg-blue-50 hover:border-blue-300 cursor-pointer h-36 transition" @click="openCardModal">
                            <i class="fa-solid fa-plus text-xl mb-1"></i>
                            <span class="text-xs font-bold">カードを追加</span>
                        </div>

                        <!-- Other Expected Materials (Dynamic) -->
                        <template v-for="mat in materialStatuses" :key="mat.name">
                            <div :class="['flex flex-col justify-between p-4 rounded-lg border shadow-sm h-36 relative transition', mat.status === 'received' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800']">
                                <div class="space-y-1">
                                    <div class="font-bold text-sm flex items-center gap-2">
                                        <i class="fa-solid fa-file-contract"></i> {{ mat.name }}
                                    </div>
                                    <div class="text-xs mt-2" v-if="mat.status === 'received'">状態: 受領済み</div>
                                    <div class="text-xs mt-2" v-else>状態: 未受領</div>
                                </div>
                                <div class="flex justify-between items-end border-t pt-2" :class="mat.status === 'received' ? 'border-green-100' : 'border-red-100'">
                                    <span v-if="mat.status === 'received'" class="text-xs text-green-600 font-bold"><i class="fa-solid fa-check"></i> 順調</span>
                                    <span v-else class="text-xs text-red-600 font-bold"><i class="fa-solid fa-triangle-exclamation"></i> 遅延</span>
                                </div>
                            </div>
                        </template>

                        <!-- Cash (Toggleable) -->
                        <div :class="['flex flex-col justify-between p-4 rounded-lg border shadow-sm h-36 relative transition', c_config.cash ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60']">
                            <div class="space-y-1">
                                <div class="font-bold text-sm flex items-center gap-2"><i class="fa-solid fa-book"></i> 現金出納帳</div>
                                <template v-if="c_config.cash">
                                    <div class="text-xs">受領: <span class="font-bold">10月分まで</span></div>
                                    <div class="text-xs text-red-600 font-bold">未着: 11月分</div>
                                </template>
                                <div v-else class="text-xs mt-2">設定: 監視OFF</div>
                            </div>
                            <div class="flex justify-between items-end border-t border-gray-200 pt-2">
                                <span class="text-xs" v-if="c_config.cash"><i class="fa-solid fa-triangle-exclamation text-red-500"></i> 遅延</span>
                                <span class="text-xs" v-else>対象外</span>
                            </div>
                        </div>

                        <!-- Payroll (Toggleable) -->
                        <div :class="['flex flex-col justify-between p-4 rounded-lg border shadow-sm h-36 relative transition', c_config.payroll ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60']">
                            <div class="space-y-1">
                                <div class="font-bold text-sm flex items-center gap-2"><i class="fa-solid fa-file-invoice-dollar"></i> 給与台帳</div>
                                <template v-if="c_config.payroll">
                                    <div class="text-xs">受領: <span class="font-bold">11月分まで</span></div>
                                    <div class="text-xs text-gray-400">未着: なし</div>
                                </template>
                                <div v-else class="text-xs mt-2">設定: 監視OFF</div>
                            </div>
                            <div class="flex justify-between items-end border-t border-gray-200 pt-2">
                                <span class="text-xs text-green-600 font-bold" v-if="c_config.payroll"><i class="fa-solid fa-check"></i> 順調</span>
                                <span class="text-xs" v-else>対象外</span>
                            </div>
                        </div>

                        <!-- Invoice (Toggleable) -->
                        <div :class="['flex flex-col justify-between p-4 rounded-lg border shadow-sm h-36 relative transition', c_config.invoice ? 'bg-red-50 border-red-200 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60']">
                           <div class="space-y-1">
                                <div class="font-bold text-sm flex items-center gap-2"><i class="fa-solid fa-file-invoice"></i> 請求書</div>
                                <template v-if="c_config.invoice">
                                    <div class="text-xs">受領: <span class="font-bold">9月分まで</span></div>
                                    <div class="text-xs text-red-600 font-bold">未着: 10月分</div>
                                </template>
                                <div v-else class="text-xs mt-2">設定: 監視OFF</div>
                            </div>
                            <div class="flex justify-between items-end border-t border-gray-200 pt-2">
                                <span class="text-xs text-red-500 font-bold" v-if="c_config.invoice"><i class="fa-solid fa-triangle-exclamation"></i> 遅延</span>
                                <span class="text-xs" v-else>対象外</span>
                            </div>
                        </div>

                        <!-- Social (Toggleable) -->
                        <div :class="['flex flex-col justify-between p-4 rounded-lg border shadow-sm h-36 relative transition', c_config.social ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60']">
                            <div class="space-y-1">
                                <div class="font-bold text-sm flex items-center gap-2"><i class="fa-solid fa-id-card"></i> 社会保険通知</div>
                                <template v-if="c_config.social">
                                    <div class="text-xs font-bold mt-2">受領済み</div>
                                </template>
                                <div v-else class="text-xs mt-2">設定: 監視OFF</div>
                            </div>
                             <div class="flex justify-between items-end border-t border-gray-200 pt-2">
                                <span class="text-xs text-green-600 font-bold" v-if="c_config.social"><i class="fa-solid fa-check"></i> 順調</span>
                                <span class="text-xs" v-else>対象外</span>
                            </div>
                        </div>
                   </div>

                   <!-- Config Panel -->
                   <div class="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-4 h-fit shadow-sm">
                       <h3 class="text-sm font-bold text-slate-700 mb-4 flex items-center"><i class="fa-solid fa-sliders mr-2 text-gray-400"></i> クイック設定</h3>
                       <div class="space-y-4">
                           <div class="flex justify-between items-center pb-2 border-b border-gray-100">
                               <div class="flex items-center gap-2"><i class="fa-solid fa-book text-gray-400"></i><span class="text-sm text-gray-600">現金出納帳</span></div>
                               <label class="relative inline-flex items-center cursor-pointer">
                                 <input type="checkbox" v-model="c_config.cash" class="sr-only peer">
                                 <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                               </label>
                           </div>
                           <div class="flex justify-between items-center pb-2 border-b border-gray-100">
                               <div class="flex items-center gap-2"><i class="fa-solid fa-file-invoice-dollar text-gray-400"></i><span class="text-sm text-gray-600">給与台帳</span></div>
                               <label class="relative inline-flex items-center cursor-pointer">
                                 <input type="checkbox" v-model="c_config.payroll" class="sr-only peer">
                                 <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                               </label>
                           </div>
                           <div class="flex justify-between items-center pb-2 border-b border-gray-100">
                               <div class="flex items-center gap-2"><i class="fa-solid fa-id-card text-gray-400"></i><span class="text-sm text-gray-600">社会保険通知</span></div>
                               <label class="relative inline-flex items-center cursor-pointer">
                                 <input type="checkbox" v-model="c_config.social" class="sr-only peer">
                                 <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                               </label>
                           </div>
                           <div class="flex justify-between items-center pb-2 border-b border-gray-100">
                               <div class="flex items-center gap-2"><i class="fa-solid fa-file-invoice text-gray-400"></i><span class="text-sm text-gray-600">請求書</span></div>
                               <label class="relative inline-flex items-center cursor-pointer">
                                 <input type="checkbox" v-model="c_config.invoice" class="sr-only peer">
                                 <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                               </label>
                           </div>
                       </div>
                       <button @click="saveCConfig" :class="['mt-6 w-full py-2 rounded text-xs font-bold text-white transition flex justify-center items-center gap-2 shadow-sm', c_isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700']">
                           <i v-if="c_isSaving" class="fa-solid fa-circle-notch fa-spin"></i>
                           <span v-else><i class="fa-solid fa-save"></i> 設定を保存</span>
                       </button>
                   </div>
              </div>
          </div>
      </div>

      <!-- LIST VIEW -->
      <template v-else>
        <div class="p-3 border-b border-gray-200 flex justify-between items-center bg-slate-50 shrink-0">
              <div class="flex items-center gap-4">
                  <div class="font-bold text-slate-700 text-sm flex items-center gap-2 mr-4">
                      <i class="fa-solid fa-calendar-days text-blue-500"></i> 全社資料回収状況
                  </div>
                  <div class="flex items-center bg-white rounded p-0.5 text-xs border border-gray-200 shadow-sm">
                      <button @click="changeYear('prev')" class="px-3 py-1 hover:bg-gray-100 rounded-l text-gray-500"><i class="fa-solid fa-backward"></i> 過去</button>
                      <span class="px-3 font-bold text-slate-700 border-x border-gray-200 bg-white">{{ viewYearStart }}年 〜 {{ viewYearStart + 1}}年</span>
                      <button @click="changeYear('next')" class="px-3 py-1 hover:bg-gray-100 rounded-r text-gray-500">未来 <i class="fa-solid fa-forward"></i></button>
                  </div>
              </div>
              <div class="flex gap-4 text-[10px] text-gray-500 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm">
                  <span class="flex items-center"><i class="fa-solid fa-circle-check text-green-500 mr-1"></i>完了</span>
                  <span class="flex items-center"><i class="fa-solid fa-xmark text-red-500 mr-1"></i>未着</span>
                  <span class="flex items-center"><i class="fa-solid fa-triangle-exclamation text-yellow-500 mr-1"></i>一部未着</span>
                  <span class="border-l pl-3 ml-2 flex items-center"><span class="w-0.5 h-3 bg-blue-500 mr-1 block"></span> 決算月</span>
              </div>
          </div>

          <div class="overflow-auto flex-1 p-0 relative">
              <table class="w-full border-collapse text-xs min-w-[1500px]">
                  <thead class="sticky top-0 z-30 shadow-sm">
                      <tr class="bg-slate-100 text-gray-600 text-[10px] font-bold uppercase h-6 border-b border-gray-300">
                          <th class="p-0 w-64 text-left sticky left-0 z-20 bg-slate-50 border-r border-gray-200"><div class="px-3 py-1">クライアント情報</div></th>
                          <th colspan="12" class="border-r border-gray-300 text-center bg-slate-200 text-slate-700">{{ viewYearStart }}年</th>
                          <th colspan="12" class="text-center bg-slate-100 text-slate-500">{{ viewYearStart + 1 }}年</th>
                      </tr>
                      <tr class="bg-slate-50 text-gray-500 text-[9px] font-bold border-b border-gray-300 h-6">
                          <th class="sticky left-0 z-20 bg-slate-50 border-r border-gray-200"></th>
                          <th v-for="m in 24" :key="m" class="w-8 border-r text-center align-middle relative">
                              <span class="text-[7px] absolute top-0 left-0 text-gray-400 transform scale-75 origin-top-left">'{{ m <= 12 ? String(viewYearStart).slice(2) : String(viewYearStart + 1).slice(2) }}</span>
                              {{ m <= 12 ? m : m - 12 }}
                          </th>
                      </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                      <tr v-for="client in sortedCalendarDocs" :key="client.jobId" class="hover:bg-blue-50/10 transition h-10">
                          <td class="p-0 sticky left-0 z-20 border-r border-gray-200 align-middle bg-white group">
                              <div class="flex items-stretch h-10 cursor-pointer" @click="goToCollectionDetail(client)">
                                  <div class="w-10 bg-slate-100 flex items-center justify-center border-r border-slate-200 text-[10px] font-mono font-bold text-slate-500 shrink-0">{{ client.code }}</div>
                                  <div class="flex-1 px-3 flex flex-col justify-center min-w-0 hover:bg-blue-50">
                                      <div class="font-bold text-slate-700 text-xs truncate">{{ client.name }}</div>
                                      <div class="flex gap-1"><span class="text-[9px] text-blue-600 font-bold">{{ client.type === 'individual' ? '個人(12月)' : client.fiscalMonth + '月決算' }}</span></div>
                                  </div>
                                  <div class="w-8 flex items-center justify-center border-l border-slate-100 shrink-0"><i class="fa-solid fa-folder-open text-slate-300 hover:text-blue-600"></i></div>
                              </div>
                          </td>
                          <td v-for="m in 24" :key="m" :class="['w-8 h-10 border-r border-b border-gray-200 text-center align-middle relative', getCellStyle(client, m)]">
                               <div v-if="isFiscalMonth(client, m)" class="absolute right-0 top-0 bottom-0 border-r-2 border-blue-500 z-0"><span class="absolute bottom-0 right-0 bg-blue-500 text-white text-[8px] px-0.5 leading-none rounded-tl shadow-sm">決</span></div>
                               <!-- Simplified Status Icons for Test -->
                               <template v-if="shouldShowIcon(client, m)">
                                   <i v-if="getPeriodStatus(client, m) === 1" class="fa-solid fa-circle-check text-green-500 relative z-10 text-xs"></i>
                                   <i v-if="getPeriodStatus(client, m) === 0" class="fa-solid fa-xmark text-red-500 relative z-10 text-xs"></i>
                               </template>
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import moment from 'moment';

const testControls = ref(true);
const mockIsDetailView = ref(false);
const mockRouteParamsCode = ref('');

// Switch Logic
const isDetailView = computed(() => mockIsDetailView.value || !!mockRouteParamsCode.value);

const clients = ref([
    {
        clientCode: '1001',
        companyName: '株式会社 テスト商事',
        fiscalMonth: 3,
        type: 'corp',
        banks: [
            { id: '1', bankName: 'みずほ銀行', branchName: '渋谷支店', accountNumber: '1234567', status: 'connected' }
        ],
        creditCards: [],
        jobId: '1001'
    },
    {
        clientCode: '1003',
        companyName: '鈴木商店',
        fiscalMonth: 12,
        type: 'individual',
        banks: [],
        creditCards: [
             { id: '1', companyName: '楽天カード', last4Digits: '9999', status: 'error', withdrawalAccount: '未設定' }
        ],
        jobId: '1003'
    }
]);

const currentClient = computed(() => {
    if (!mockRouteParamsCode.value && !mockIsDetailView.value) return null;
    const code = mockRouteParamsCode.value || '1001';
    return clients.value.find(c => c.clientCode === code);
});

const sortedCalendarDocs = computed(() => {
    return clients.value.map(c => ({
        code: c.clientCode,
        name: c.companyName,
        fiscalMonth: c.fiscalMonth,
        type: c.type,
        jobId: c.jobId
    }));
});

const viewYearStart = ref(2025);

const changeYear = (dir: 'next' | 'prev') => {
    if (dir === 'next') viewYearStart.value++;
    else viewYearStart.value--;
};

const goBack = () => {
    mockIsDetailView.value = false;
    mockRouteParamsCode.value = '';
};

 
const goToCollectionDetail = (client: any) => {
    mockRouteParamsCode.value = client.code;
    mockIsDetailView.value = true;
};

// --- Active Period Logic (Ported from Source) ---

const currentDateMock = moment('2025-12-28'); // Fixed Date for Test Consistency

const getDateForCell = (m: number) => {
    const year = m <= 12 ? viewYearStart.value : viewYearStart.value + 1;
    const month = m <= 12 ? m : m - 12;
    return moment(`${year}-${String(month).padStart(2, '0')}-01`);
};

 
const getFiscalTermEnd = (client: any, targetDate: moment.Moment) => {
    const fiscalMonth = client.type === 'individual' ? 12 : client.fiscalMonth;
    const month = targetDate.month() + 1;
    let year = targetDate.year();
    if (month > fiscalMonth) {
        year++;
    }
    return moment(`${year}-${String(fiscalMonth).padStart(2, '0')}-01`).endOf('month');
};

 
const getActiveTerm1End = (client: any) => {
    const checkDate = currentDateMock.clone().subtract(2, 'years');
    const today = currentDateMock;

    for (let i = 0; i < 5; i++) {
        const termEnd = getFiscalTermEnd(client, checkDate);
        const filingOffset = client.type === 'individual' ? 3 : 2;
        const filingDeadline = termEnd.clone().add(filingOffset, 'months').endOf('month');

        if (today.isSameOrBefore(filingDeadline)) {
            return termEnd;
        }
        checkDate.add(1, 'year');
    }
    return getFiscalTermEnd(client, today);
};

 
const getCellStyle = (client: any, m: number) => {
    const cellDate = getDateForCell(m);

    const term1End = getActiveTerm1End(client);
    const term1Start = term1End.clone().subtract(1, 'year').add(1, 'day');

    const term2End = term1End.clone().add(1, 'year');
    const term2Start = term1End.clone().add(1, 'day');

    if (cellDate.isBetween(term1Start, term1End, 'month', '[]')) {
        return 'bg-white'; // Active 1
    }
    if (cellDate.isBetween(term2Start, term2End, 'month', '[]')) {
        return 'bg-blue-50'; // Active 2
    }

    return 'bg-diagonal'; // Inactive
};

 
const isFiscalMonth = (client: any, m: number) => {
     const displayMonth = m <= 12 ? m : m - 12;
     // Handle individual case if hardcoded in logic (usually 12)
     const fiscalMonth = client.type === 'individual' ? 12 : client.fiscalMonth;
     return fiscalMonth === displayMonth;
};

 
const shouldShowIcon = (client: any, m: number) => {
    // 1. Must be Active Period
    if (getCellStyle(client, m) === 'bg-diagonal') return false;

    // 2. Must NOT be in the future (Strict Today)
    const cellDate = getDateForCell(m);

    if (cellDate.isAfter(currentDateMock, 'month')) {
        return false;
    }

    return true;
};

 
const getPeriodStatus = (client: any, m: number) => {
    // Mimic Source: (client.jobId.charCodeAt(2) || 0) + m
    // Mock clients have jobId = clientCode e.g. '1001'
    const charCode = client.jobId ? client.jobId.charCodeAt(2) : 0;
    const seed = charCode + m;
    const mod = seed % 10;
    if (mod < 2) return 0; // x
    if (mod === 2) return 2; // triangle
    return 1; // check
};

const c_config = ref({ cash: false, invoice: false, payroll: false, social: false });
const maskNumber = (num: string) => {
    if (!num || num.length < 4) return num;
    return '**** ' + num.slice(-4);
};

const materialStatuses = computed(() => {
    // Mock Materials based on typical source output
    return [
       { name: '年末調整対応', status: 'received' },
       { name: '法定調書合計表', status: 'pending' },
       { name: '償却資産税申告', status: 'received' }
    ];
});

// Mock Actions (No-op or Alert)
const openBankModal = () => { alert('Mock: Open Bank Modal'); };
const openCardModal = () => { alert('Mock: Open Card Modal'); };
const deleteBank = () => { if(confirm('Mock: Explore delete?')) alert('Mock: Deleted'); };
const deleteCard = () => { if(confirm('Mock: Explore delete?')) alert('Mock: Deleted'); };
const saveCConfig = () => { c_isSaving.value = true; setTimeout(() => c_isSaving.value = false, 500); };
const c_isSaving = ref(false);
const c_reportText = ref('');
const showCReportModal = ref(false);
const copyCReport = () => { alert('Mock: Copy Report'); showCReportModal.value = false; };

</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
/* Diagonal stripe for inactive */
.bg-diagonal {
    background-image: linear-gradient(45deg, #f3f4f6 25%, transparent 25%, transparent 50%, #f3f4f6 50%, #f3f4f6 75%, transparent 75%, transparent);
    background-size: 10px 10px;
}
</style>
