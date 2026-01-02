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

              <!-- Steps Grid Component -->
              <aaa_ScreenB_JobSteps
                :job="job"
                @action="(p) => $emit('action', p)"
              />

              <!-- Action Column Component -->
              <aaa_ScreenB_ActionCell
                :job="job"
                @action="(p) => $emit('action', p)"
              />
          </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import type { JournalStatusUi } from '@/aaa/aaa_types/aaa_ScreenB_ui.type';
import aaa_ScreenB_JobSteps from '@/aaa/aaa_components/aaa_ScreenB_JobSteps.vue';
import aaa_ScreenB_ActionCell from '@/aaa/aaa_components/aaa_ScreenB_ActionCell.vue';

// Phase B Refactor (Componentized)
defineProps<{
jobs: JournalStatusUi[]
}>();

defineEmits(['action']);
</script>

<style scoped>
/* No extra css needed, everything is Tailwind */
</style>
