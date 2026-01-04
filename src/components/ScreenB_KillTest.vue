<template>
  <div class="p-4 bg-gray-100 min-h-screen">
      <h1 class="text-xl font-bold mb-4 text-red-600">Screen B Visual Stress Test (Kill Test)</h1>
      <div class="h-[800px] border-4 border-red-500 rounded p-1">
          <ScreenB_JournalTable
            :jobs="killJobs"
            @action="logAction"
          />
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { JournalStatusUi } from '@/types/ScreenB_ui.type';
import ScreenB_JournalTable from '@/components/ScreenB_JournalTable.vue';

const LONG_TEXT = "これは極めて長いテキストでありレイアウト崩れを確認するためのものです。寿限無寿限無五劫の擦り切れ海砂利水魚の食う寝る処住む処やぶら小路の藪柑子パイポパイポパイポのシューリンガンシューリンガンのグーリンダイグーリンダイのポンポコピーのポンポコナの長久命の長助。";

const killJobs = ref<JournalStatusUi[]>([
    {
        id: 'kill_01',
        rowStyle: '',
        clientName: LONG_TEXT,
        clientCode: 'KILL01',
        priority: 'high',
        softwareLabel: 'Unknown Software with Long Name',
        fiscalMonthLabel: '99月決算',
        status: 'error',
        steps: {
            receipt: { state: 'error', label: LONG_TEXT, count: 9999 },
            aiAnalysis: { state: 'processing', label: '', count: 0 },
            journalEntry: { state: 'pending', label: '', count: 99999 },
            approval: { state: 'pending', label: '', count: 12345 },
            remand: { state: 'pending', label: '', count: 67890 },
            export: { state: 'ready', label: '', count: 0 },
            archive: { state: 'ready', label: '', count: 999999 }
        },
        primaryAction: { type: 'rescue', label: '緊急対応が必要', isEnabled: true },
        nextAction: { type: 'none', label: '', isEnabled: false },
        driveLinks: { export: '#', archive: '#' }
    },
    {
        id: 'kill_02',
        rowStyle: 'bg-red-50',
        clientName: 'Empty State Client',
        clientCode: '',
        priority: 'low',
        softwareLabel: '',
        fiscalMonthLabel: '',
        status: 'unknown',
        steps: {
            receipt: { state: 'none', label: '', count: 0 },
            aiAnalysis: { state: 'none', label: '', count: 0 },
            journalEntry: { state: 'none', label: '', count: 0 },
            approval: { state: 'none', label: '', count: 0 },
            remand: { state: 'none', label: '', count: 0 },
            export: { state: 'none', label: '', count: 0 },
            archive: { state: 'none', label: '', count: 0 }
        },
        primaryAction: { type: 'none', label: '', isEnabled: false },
        nextAction: { type: 'none', label: '', isEnabled: false },
        driveLinks: { export: '', archive: '' }
    }
]);

const logAction = (p: any) => console.log("Action:", p);
</script>
