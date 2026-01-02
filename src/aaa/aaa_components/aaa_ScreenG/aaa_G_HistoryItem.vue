<template>
    <div class="border border-gray-100 rounded-lg p-3 hover:border-blue-200 transition group animate-slide-in-right bg-white relative">
        <!-- Delete Button (Physical) - Only for Downloaded items -->
        <button v-if="log.isDownloaded" class="absolute top-[52px] right-[15px] text-red-500 hover:text-red-600 transition p-1" @click.stop="$emit('delete', log.id)">
            <i class="fa-solid fa-trash-can"></i>
        </button>

        <div class="flex justify-between items-start mb-2 pl-2">
            <div class="flex items-center gap-2 mb-1">
                <aaa_G_StatusBadge :isDownloaded="log.isDownloaded" />
                <span class="text-slate-400 font-mono text-xs font-bold">{{ log.id }}</span>
            </div>
            <!-- Date is secondary info now -->
            <span class="text-[10px] text-gray-400">{{ log.timestamp }}</span>
        </div>

        <div class="font-bold text-sm text-slate-800 mb-2 pl-2">{{ log.clientName }}</div>

        <div class="flex items-center gap-2 mb-3 pl-2">
            <div>
            <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{{ log.sourceSoftwareLabel }}</span>
                <i class="fa-solid fa-arrow-right text-gray-300 text-xs"></i>
                <span class="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">{{ log.targetSoftwareLabel }}</span>
            </div>
            <div class="font-bold text-blue-600 text-sm hover:underline cursor-pointer flex items-center gap-2" @click="$emit('download', log.id)">
               <i class="fa-regular fa-file-csv"></i> {{ log.fileName }}
            </div>
            <div class="text-[10px] text-gray-400 mt-1 flex items-center gap-3">
                <span><i class="fa-regular fa-clock"></i> {{ log.timestamp }}</span>
                <span>{{ log.fileSize }}</span>
            </div>
        </div>
        </div>


    </div>
</template>

<script setup lang="ts">
import aaa_G_StatusBadge from './aaa_G_StatusBadge.vue';
import type { ConversionLogUi } from '@/aaa/aaa_types/aaa_ScreenG_ui.type';

defineProps<{
    log: ConversionLogUi
}>()
defineEmits(['delete', 'download'])

// Logic removed: getSoftwareLabel is now handled by Mapper
</script>
