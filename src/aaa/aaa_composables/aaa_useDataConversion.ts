import { ref, computed } from 'vue';
import type { ConversionLogUi } from '@/aaa/aaa_types/aaa_ui.type';
import { mapConversionLogUi } from '@/aaa/aaa_composables/aaa_mapper';

// Internal State (Raw Data)
const conversionHistory = ref<unknown[]>([
    {
        id: 'XYZ',
        timestamp: '2024/12/25 14:30',
        clientName: '株式会社サンプル商事',
        sourceSoftware: '弥生会計',
        targetSoftware: 'Freee',
        fileName: 'サンプル商事_弥生_変換後Freee_20241225.csv',
        size: 1024 * 1024 * 1.5, // 1.5MB
        downloadUrl: '#',
        isDownloaded: false
    }
]);

export function aaa_useDataConversion() {

    const addLog = (log: unknown) => {
        conversionHistory.value.unshift(log);
    };

    const markAsDownloaded = (id: string) => {
        const log = conversionHistory.value.find((l: any) => l.id === id);
        if (log) {
            log.isDownloaded = true;
        }
    };

    const pendingDownloadCount = computed(() => {
        // Use mapped data for accurate counting using IsDownloaded status safely
        return logs.value.filter(log => !log.isDownloaded).length;
    });

    // Return strictly typed UI data using Central Mapper
    const logs = computed<ConversionLogUi[]>(() =>
        conversionHistory.value.map(mapConversionLogUi)
    );

    const removeLog = (id: string) => {
        const index = conversionHistory.value.findIndex((l: any) => l.id === id);
        if (index !== -1) {
            conversionHistory.value.splice(index, 1);
        }
    };

    return {
        logs,
        addLog,
        markAsDownloaded,
        removeLog,
        pendingDownloadCount
    };
}
