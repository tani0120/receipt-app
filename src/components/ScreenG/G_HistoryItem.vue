<template>
    <div class="border border-gray-100 rounded-lg p-3 hover:border-blue-200 transition group animate-slide-in-right bg-white relative">
        <div class="flex justify-between items-start mb-2 pl-2">
            <div class="flex items-center gap-2 mb-1">
                <aaa_G_StatusBadge :isDownloaded="log.isDownloaded" />
                <span class="text-slate-400 font-mono text-xs font-bold">{{ log.id }}</span>
            </div>
            <!-- 日付（副情報） -->
            <span class="text-[10px] text-gray-400">{{ log.timestamp }}</span>
        </div>

        <div class="font-bold text-sm text-slate-800 mb-2 pl-2">{{ log.clientName }}</div>

        <div class="flex items-center justify-between mb-1 pl-2">
            <div>
                <div class="font-bold text-blue-600 text-sm hover:underline cursor-pointer flex items-center gap-2" @click="$emit('download', log.id)">
                   <i class="fa-regular fa-file-csv"></i> {{ log.fileName }}
                </div>
                <div class="text-[10px] text-gray-400 mt-1 flex items-center gap-3">
                    <span><i class="fa-regular fa-clock"></i> {{ log.timestamp }}</span>
                    <span>{{ log.fileSize }}</span>
                </div>
            </div>
            <!-- 削除ボタン: 全件で右下に表示 -->
            <button class="text-gray-300 hover:text-red-500 transition p-1 ml-2" @click.stop="$emit('delete', log.id)" title="削除">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import aaa_G_StatusBadge from './G_StatusBadge.vue';
import type { ConversionLogUi } from '@/types/ScreenG_ui.type';

defineProps<{
    log: ConversionLogUi
}>()
defineEmits(['delete', 'download'])
</script>

