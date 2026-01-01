import { ref, computed } from 'vue';

export interface ConversionLog {
    id: string;
    timestamp: string;
    clientName: string;
    sourceSoftware: string;
    targetSoftware: string;
    fileName: string;
    downloadUrl: string;
    isDownloaded: boolean;
}

// Global State (Singleton pattern)
const conversionHistory = ref<ConversionLog[]>([
    {
        id: '1',
        timestamp: '2024/12/25 14:30',
        clientName: '株式会社サンプル商事',
        sourceSoftware: '弥生会計',
        targetSoftware: 'Freee',
        fileName: 'サンプル商事_弥生_変換後Freee_20241225.csv',
        downloadUrl: '#',
        isDownloaded: false
    }
]);

export function Mirror_useDataConversion() {

    const addLog = (log: ConversionLog) => {
        conversionHistory.value.unshift(log);
    };

    const markAsDownloaded = (id: string) => {
        const log = conversionHistory.value.find(l => l.id === id);
        if (log) {
            log.isDownloaded = true;
        }
    };

    const pendingDownloadCount = computed(() => {
        return conversionHistory.value.filter(log => !log.isDownloaded).length;
    });

    const logs = computed(() => conversionHistory.value);

    return {
        logs,
        addLog,
        markAsDownloaded,
        pendingDownloadCount
    };
}
