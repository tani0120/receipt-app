<template>
    <div class="p-8 bg-red-50 min-h-screen">
        <h1 class="text-2xl font-bold text-red-700 mb-8">Screen G: Visual Stress Test (Kill Test)</h1>

        <!-- Control Panel -->
        <div class="mb-8 p-4 bg-white rounded shadow border border-red-200">
            <h2 class="font-bold mb-2">Test Scenarios</h2>
            <div class="flex gap-4">
                <button @click="loadStressData" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                    Load Worst Case Data (Stress)
                </button>
                <button @click="loadEmptyData" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                    Load Empty/Null Data
                </button>
            </div>
        </div>

        <!-- Target Component Area -->
        <div class="border-4 border-red-500 rounded-xl overflow-hidden relative" style="height: 800px;">
             <!-- Injecting Mock Data via wrapper/props isn't possible directly as it uses composable state.
                  So we will mock the composable's return value or data *if* possible,
                  but since we are strictly testing the UI component, we might need a modified version or
                  just rely on the fact that we can manipulate the store if it was global.
                  However, here we are testing the VIEW.
                  The view uses `aaa_useDataConversion`.
                  To properly kill-test, we should probably mount a component that uses the *Mapper* directly
                  or passes data to the sub-components (`aaa_G_HistoryItem`).

                  Let's test the `aaa_G_HistoryItem` component in isolation with extreme data,
                  AND the full screen if we can mock the composable.

                  For this Kill Test, we will render a list of `aaa_G_HistoryItem` with extreme props.
             -->

             <div class="bg-white h-full overflow-y-auto p-4">
                <h3 class="font-bold mb-4">Component Isolation Test: aaa_G_HistoryItem</h3>
                <div class="flex flex-col gap-4">
                    <aaa_G_HistoryItem
                        v-for="log in stressLogs"
                        :key="log.id"
                        :log="log"
                        @delete="console.log"
                        @download="console.log"
                    />
                </div>
             </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import aaa_G_HistoryItem from '@/aaa/aaa_components/aaa_ScreenG/aaa_G_HistoryItem.vue';
import type { ConversionLogUi } from '@/aaa/aaa_types/aaa_ScreenG_ui.type';

const stressLogs = ref<ConversionLogUi[]>([]);

const LONG_TEXT = 'あ'.repeat(1000);
const SPECIAL_CHARS = '!@#$%^&*()_+|~=`{}[]:";\'<>?,./\\';

const loadStressData = () => {
    stressLogs.value = [
        {
            id: 'KILL_1' as any,
            timestamp: '2099/12/31 23:59:59',
            clientName: '極限株式会社 ' + LONG_TEXT,
            sourceSoftwareLabel: 'Unknown Soft ' + SPECIAL_CHARS,
            targetSoftwareLabel: 'Future Soft ' + SPECIAL_CHARS,
            fileName: 'very_long_file_name_' + LONG_TEXT + '.csv',
            fileSize: '999.99 TB',
            downloadUrl: 'https://example.com',
            isDownloaded: false,
            isDownloadable: true,
            rowStyle: 'bg-red-100' // Custom style test
        },
        {
            id: 'KILL_2' as any,
            timestamp: '',
            clientName: '',
            sourceSoftwareLabel: '',
            targetSoftwareLabel: '',
            fileName: '',
            fileSize: '',
            downloadUrl: '',
            isDownloaded: true,
            isDownloadable: false,
            rowStyle: 'bg-gray-50'
        }
    ];
};

const loadEmptyData = () => {
    // Even "empty" data must satisfy the UI Contract (no undefined)
    stressLogs.value = [];
};

// Initial load
loadStressData();

</script>
