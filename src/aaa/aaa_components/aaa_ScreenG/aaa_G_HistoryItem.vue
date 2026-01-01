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
            <!-- Source Label: Plain style, no hover button effect -->
            <span class="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-700 cursor-default">{{ log.sourceSoftware }}</span>
            <i class="fa-solid fa-arrow-right text-gray-400 text-xs"></i>
            <span class="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded">{{ log.targetSoftwareLabel }}</span>
        </div>

        <a :href="log.downloadUrl" :download="log.fileName" @click="$emit('download', log.id)" class="bg-slate-50 rounded p-2 pl-3 flex items-center justify-between group-hover:bg-slate-100 transition text-decoration-none">
            <div class="flex items-center gap-2 overflow-hidden">
                <i class="fa-solid fa-file-csv text-green-600"></i>
                <span class="text-xs font-mono text-gray-600 truncate flex-1">{{ log.fileName }}</span>
                <span class="text-[10px] text-gray-400 shrink-0 ml-2 border-l border-gray-200 pl-2">{{ log.fileSizeLabel }}</span>
            </div>
            <i class="fa-solid fa-download text-gray-400 group-hover:text-blue-500 transition"></i>
        </a>
    </div>
</template>

<script setup lang="ts">
import aaa_G_StatusBadge from './aaa_G_StatusBadge.vue';
import type { ConversionLogUi } from '@/aaa/aaa_types/aaa_ui.type'; // Updated import

defineProps<{
    log: ConversionLogUi
}>()
defineEmits(['delete', 'download'])

// Logic removed: getSoftwareLabel is now handled by Mapper
</script>
