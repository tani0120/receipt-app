<template>
  <div class="h-full flex flex-col bg-white rounded-lg shadow border border-gray-200 overflow-hidden animate-fade-in font-sans text-slate-700">
      <!-- Header -->
      <div class="p-3 border-b border-gray-200 bg-slate-50 flex justify-between items-center shrink-0">
          <div class="text-xs text-gray-500 flex items-center gap-2"><i class="fa-solid fa-calculator text-blue-400"></i><span>全クライアントの月次処理進捗を一元管理します。(Phase A Rebuild)</span></div>
          <div class="flex items-center gap-2">
              <select class="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:border-blue-500 font-bold text-slate-600">
                  <option value="all">全てのアクション</option><option value="rescue">エラー確認</option><option value="work">1次仕訳</option><option value="approve">承認</option><option value="remand">差戻し対応</option><option value="export">CSV出力</option><option value="archive">仕訳対象外を移動</option><option value="complete">すべて完了</option>
              </select>
              <div class="relative">
                  <i class="fa-solid fa-search absolute left-2 top-1.5 text-gray-400 text-xs"></i>
                  <input type="text" placeholder="ID / 会社名で検索" class="pl-7 pr-2 py-1 text-xs border border-gray-300 rounded w-48 focus:border-blue-500">
              </div>
          </div>
      </div>

      <!-- Table Header -->
      <div class="bg-white border-b border-gray-200 flex text-[10px] sm:text-xs font-bold text-slate-600 shrink-0 shadow-sm z-10">
          <div class="p-2 w-56 border-r flex-shrink-0 flex items-center bg-slate-50">顧問先情報</div>
          <div class="flex-1 grid grid-cols-7 min-w-[700px]">
              <div class="p-2 text-center border-r bg-blue-50/30 flex items-center justify-center">STEP 1<br>資料受領</div>
              <div class="p-2 text-center border-r bg-blue-50/30 flex items-center justify-center">STEP 2<br>AI解析</div>
              <div class="p-2 text-center border-r bg-indigo-50 text-indigo-800 border-b-4 border-indigo-400 flex items-center justify-center">STEP 3<br>1次仕訳</div>
              <div class="p-2 text-center border-r bg-pink-50 text-pink-800 border-b-4 border-pink-400 flex items-center justify-center">STEP 4<br>最終承認</div>
              <div class="p-2 text-center border-r bg-orange-50 text-orange-800 border-b-4 border-orange-400 flex items-center justify-center">STEP 5<br>差戻対応</div>
              <div class="p-2 text-center border-r bg-green-50 text-green-800 border-b-4 border-green-500 flex items-center justify-center">STEP 6<br>CSV出力</div>
              <div class="p-2 text-center border-r bg-gray-50 flex items-center justify-center">STEP 7<br>仕訳外移動</div>
          </div>
          <div class="p-2 w-40 bg-slate-100 text-center flex-shrink-0 flex items-center justify-center shadow-inner">次のアクション</div>
      </div>

      <!-- Table Body -->
      <div class="overflow-y-auto flex-1">
          <div v-for="job in jobs" :key="job.id" :class="['flex border-b border-gray-100 transition items-center min-h-24 group py-2', job.rowStyle]">
              <!-- Client Info -->
              <div class="p-3 w-56 border-r border-gray-100 flex flex-col justify-center h-full flex-shrink-0 transition cursor-pointer hover:bg-blue-50/50">
                  <div class="flex items-center gap-2">
                       <span :class="['font-bold text-sm break-all', job.status === 'completed' ? 'text-gray-500' : 'text-slate-800']">{{ job.clientName }}</span>
                       <span v-if="job.priority === 'high'" class="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded animate-pulse shadow">特急</span>
                  </div>
                  <div class="flex gap-1 mt-1 flex-wrap">
                      <span :class="['text-[9px] px-1 rounded font-mono', job.status === 'completed' ? 'bg-gray-200 text-gray-500' : 'bg-slate-200 text-slate-600']">{{ job.clientCode }}</span>

                      <!-- Logic for Tax/Software badge -->
                      <span v-if="job.softwareLabel==='freee'" :class="['text-[9px] px-1 rounded border font-bold', job.status === 'completed' ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-gray-100 text-gray-500 border-gray-200']">freee</span>
                      <span v-else :class="['text-[9px] px-1 rounded border font-bold', job.status === 'completed' ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-blue-50 text-blue-600 border-blue-100']">{{ job.softwareLabel }}</span>

                      <span class="text-[9px] text-gray-400">{{ job.fiscalMonthLabel }}</span>
                  </div>
              </div>

              <!-- Steps Grid -->
              <div class="flex-1 grid grid-cols-7 min-w-[700px] h-full">
                  <!-- Step 1 -->
                  <div class="border-r border-gray-100 flex items-center justify-center text-lg">
                      <UI_StatusIcon :status="job.steps.receipt.state" />
                  </div>

                  <!-- Step 2 -->
                  <div class="border-r border-gray-100 flex items-center justify-center text-lg">
                      <div v-if="job.steps.aiAnalysis.state === 'processing'" class="text-gray-500 font-bold flex flex-col items-center animate-pulse">
                          <i class="fa-solid fa-spinner fa-spin text-xl mb-1"></i><span class="text-[9px]">解析中...</span>
                      </div>
                      <div v-else-if="job.steps.aiAnalysis.state === 'error'" class="text-red-600 font-bold flex flex-col items-center">
                          <i class="fa-solid fa-ban text-xl mb-1"></i><span class="text-[9px]">停止中</span>
                      </div>
                      <UI_StatusIcon v-else :status="job.steps.aiAnalysis.state" />
                  </div>

                  <!-- Step 3 (Journal Entry) -->
                  <div class="border-r border-gray-100 flex items-center justify-center px-2">
                      <UI_StepBox
                          v-if="job.steps.journalEntry.state === 'pending'"
                          color="indigo"
                          top-label="1次仕訳"
                          :bottom-label="`残${job.steps.journalEntry.count}件`"
                          @click="$emit('action', { job, type: 'work' })"
                      />
                      <UI_StatusIcon v-else :status="job.steps.journalEntry.state" />
                  </div>

                  <!-- Step 4 (Approval) -->
                  <div class="border-r border-gray-100 flex items-center justify-center px-2">
                       <UI_StepBox
                          v-if="job.steps.approval.state === 'pending'"
                          color="pink"
                          top-label="未承認"
                          :bottom-label="`残${job.steps.approval.count}件`"
                          @click="$emit('action', { job, type: 'approve' })"
                      />
                      <UI_StatusIcon v-else :status="job.steps.approval.state" />
                  </div>

                  <!-- Step 5 (Remand) -->
                  <div class="border-r border-gray-100 flex items-center justify-center px-2">
                      <UI_StepBox
                          v-if="job.steps.remand.state === 'pending'"
                          color="orange"
                          top-label="差戻対応"
                          :bottom-label="`残 ${job.steps.remand.count}件`"
                          @click="$emit('action', { job, type: 'remand' })"
                      />
                      <UI_StatusIcon v-else :status="job.steps.remand.state" />
                  </div>

                  <!-- Step 6 (Export) -->
                  <div class="border-r border-gray-100 flex items-center justify-center px-2">
                      <button v-if="job.steps.export.state === 'ready'" @click="$emit('action', { job, type: 'export' })" class="w-full bg-white border border-green-500 text-green-600 rounded py-1 text-[10px] font-bold hover:bg-green-50 shadow-sm transition"><i class="fa-solid fa-download mr-1"></i> 未出力</button>
                      <button v-else-if="job.steps.export.state === 'done'" @click="$emit('action', { job, type: 'export' })" class="w-full text-[10px] font-bold flex flex-col items-center text-gray-400 hover:text-green-600 cursor-pointer"><i class="fa-solid fa-file-csv text-base mb-1"></i> 出力済</button>
                      <UI_StatusIcon v-else :status="job.steps.export.state" />
                  </div>

                  <!-- Step 7 (Archive -> Move to Excluded) -->
                  <div class="border-r border-gray-100 flex items-center justify-center px-2">
                      <div v-if="job.steps.archive.state === 'ready'" @click="$emit('action', { job, type: 'archive' })" class="flex items-center gap-1 text-[9px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 w-full justify-center cursor-pointer hover:bg-blue-100 transition">
                          <i class="fa-solid fa-box-open"></i> 未移動{{ job.steps.archive.count }}件
                      </div>
                      <div v-else-if="job.steps.archive.state === 'done'" @click="$emit('action', { job, type: 'archive' })" class="cursor-pointer hover:text-blue-500 transition">
                           <i class="fa-solid fa-check text-gray-400"></i>
                      </div>
                      <UI_StatusIcon v-else :status="job.steps.archive.state" />
                  </div>
              </div>

              <!-- Action Column -->
              <div class="p-3 w-40 flex-shrink-0 flex flex-col items-center justify-center gap-1 border-l border-gray-100 bg-slate-50/50">
                   <!-- Analysis Wait -->
                  <UI_ActionButton
                    v-if="job.steps.aiAnalysis.state === 'processing'"
                    variant="processing"
                    icon="fa-solid fa-spinner fa-spin"
                    label="解析待機"
                    disabled
                  />

                  <!-- Primary Actions -->
                  <UI_ActionButton
                    v-else-if="job.primaryAction.type === 'work'"
                    variant="work"
                    icon="fa-solid fa-file-invoice-dollar"
                    label="1次仕訳"
                    @click="$emit('action', { job, type: 'work' })"
                  />

                  <UI_ActionButton
                    v-else-if="job.nextAction.type === 'approve'"
                    variant="approve"
                    icon="fa-solid fa-stamp"
                    label="最終承認"
                    @click="$emit('action', { job, type: 'approve' })"
                  />

                  <UI_ActionButton
                    v-else-if="job.nextAction.type === 'remand'"
                    variant="remand"
                    icon="fa-solid fa-rotate-left"
                    label="差戻対応"
                    @click="$emit('action', { job, type: 'remand' })"
                  />

                  <UI_ActionButton
                    v-else-if="job.primaryAction.type === 'rescue'"
                    variant="rescue"
                    icon="fa-solid fa-triangle-exclamation"
                    label="エラー確認"
                    @click="$emit('action', { job, type: 'rescue_error' })"
                  />

                  <UI_ActionButton
                    v-else-if="job.primaryAction.type === 'archive'"
                    variant="archive"
                    icon="fa-solid fa-box-open"
                    label="仕訳外移動"
                    @click="$emit('action', { job, type: 'archive' })"
                  />

                  <!-- Fallback: Complete -->
                  <UI_ActionButton
                    v-else-if="job.nextAction.type === 'complete_all'"
                    variant="complete"
                    icon="fa-solid fa-check-double"
                    label="すべて完了"
                  />
              </div>
          </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import type { JobUi } from '@/aaa/aaa_types/aaa_ui.type';
import UI_StatusIcon from '@/aaa/aaa_components/aaa_UI_StatusIcon.vue';
import UI_StepBox from '@/aaa/aaa_components/aaa_UI_StepBox.vue';
import UI_ActionButton from '@/aaa/aaa_components/aaa_UI_ActionButton.vue';

// Phase B Refactor (Componentized)
defineProps<{
jobs: JobUi[]
}>();

defineEmits(['action']);
</script>

<style scoped>
/* No extra css needed, everything is Tailwind */
</style>
