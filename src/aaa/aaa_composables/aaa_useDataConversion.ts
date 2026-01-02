import { ref, computed } from 'vue';
import type { ConversionLogUi } from '@/aaa/aaa_types/aaa_ScreenG_ui.type';
import { mapConversionLogApiToUi } from '@/aaa/aaa_composables/aaa_DataConversionMapper'; // Updated import

// Internal Type Definition
type InternalConversionLog = {
    id: string;
    timestamp: string;
    clientName: string;
    sourceSoftware: string;
    targetSoftware: string;
    fileName: string;
    size?: number;
    downloadUrl: string;
    isDownloaded: boolean;
};

// Internal State (Raw Data)
const conversionHistory = ref<InternalConversionLog[]>([
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

    const addLog = (log: InternalConversionLog) => {
        conversionHistory.value.unshift(log);
    };

    const markAsDownloaded = (id: string) => {
        const log = conversionHistory.value.find(l => l.id === id);
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
        conversionHistory.value.map(mapConversionLogApiToUi)
    );

    const removeLog = (id: string) => {
        const index = conversionHistory.value.findIndex(l => l.id === id);
        if (index !== -1) {
            conversionHistory.value.splice(index, 1);
        }
    };

    const isProcessing = ref(false);
    const loadingStatus = ref('');

    const SOFTWARE_LABELS = {
        'Yayoi': '弥生会計',
        'MF': 'マネーフォワード',
        'Freee': 'freee',
        'Unknown': '不明'
    } as const;

    // Helper: Generate Random 3-Char ID
    const generateId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 3; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const processFile = (file: File): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!file.name.toLowerCase().endsWith('.csv')) {
                reject(new Error('CSVファイルのみ対応しています'));
                return;
            }
            resolve();
        });
    };

    const startDataConversion = async (clientName: string, sourceSoftware: string, targetSoftware: string, file: File) => {
        isProcessing.value = true;
        loadingStatus.value = 'CSVファイルを解析中...';

        // Mock Simulation
        await new Promise(r => setTimeout(r, 1000));
        loadingStatus.value = 'フォーマットを標準化しています...';

        await new Promise(r => setTimeout(r, 1000));
        const targetLabel = SOFTWARE_LABELS[targetSoftware as keyof typeof SOFTWARE_LABELS] || targetSoftware;
        loadingStatus.value = `${targetLabel}形式へ変換中...`;

        await new Promise(r => setTimeout(r, 1000));
        loadingStatus.value = 'ファイルを生成しています...';

        await new Promise(r => setTimeout(r, 1000));

        // Complete
        const today = new Date();
        const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
        const fileName = `${clientName}_${sourceSoftware}_変換後${targetSoftware}_${yyyymmdd}.csv`;
        const content = '日付,借方勘定科目,借方金額,貸方勘定科目,貸方金額,摘要\n' +
            `2024/12/26,消耗品費,1000,現金,1000,変換テストデータ\n`;
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        addLog({
            id: generateId(),
            timestamp: today.toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
            clientName: clientName,
            sourceSoftware: sourceSoftware,
            targetSoftware: targetSoftware,
            fileName: fileName,
            downloadUrl: url,
            isDownloaded: false
        });

        isProcessing.value = false;
        return fileName;
    };

    return {
        logs,
        addLog,
        markAsDownloaded,
        removeLog,
        pendingDownloadCount,
        // Conversion Logic
        startDataConversion,
        processFile,
        isProcessing,
        loadingStatus
    };
}
