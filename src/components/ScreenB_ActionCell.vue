<template>
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
</template>

<script setup lang="ts">
import type { JournalStatusUi } from '@/types/ScreenB_ui.type';
import UI_ActionButton from '@/components/UI_ActionButton.vue';

defineProps<{
  job: JournalStatusUi
}>();

defineEmits(['action']);
</script>
