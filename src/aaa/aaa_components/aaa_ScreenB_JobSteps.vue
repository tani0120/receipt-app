<template>
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
</template>

<script setup lang="ts">
import type { JobUi } from '@/aaa/aaa_types/aaa_ui.type';
import UI_StatusIcon from '@/aaa/aaa_components/aaa_UI_StatusIcon.vue';
import UI_StepBox from '@/aaa/aaa_components/aaa_UI_StepBox.vue';

defineProps<{
  job: JobUi
}>();

defineEmits(['action']);
</script>
