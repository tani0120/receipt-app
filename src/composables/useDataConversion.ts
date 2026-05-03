
import { ref, computed, onMounted } from 'vue';
import type { ConversionLogUi, ConversionLogId } from '@/types/ScreenG_ui.type';

// State driven by API (BFF)
const logs = ref<ConversionLogUi[]>([]);

export function useDataConversion() {

    // Fetch from Hono (BFF)
    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/conversion');
            if (res.ok) {
                const data = await res.json();
                logs.value = data as ConversionLogUi[];
            }
        } catch (e) {
            console.error('変換ログ取得失敗:', e);
        }
    };

    // Initial Fetch
    onMounted(() => {
        fetchLogs();
    });

    interface AddLogInput {
        id?: string;
        timestamp: string;
        clientName: string;
        sourceSoftware: string;
        targetSoftware: string;
        fileName: string;
        downloadUrl: string;
        isDownloaded: boolean;
    }

    const addLog = (log: AddLogInput) => {
        // Local simulation for immediate feedback
        const uiLog: ConversionLogUi = {
            id: (log.id || 'new') as ConversionLogId,
            timestamp: log.timestamp,
            clientName: log.clientName,
            sourceSoftwareLabel: log.sourceSoftware, // Simple mapping
            targetSoftwareLabel: log.targetSoftware,
            fileName: log.fileName,
            fileSize: 'Calculating...',
            downloadUrl: log.downloadUrl,
            isDownloaded: log.isDownloaded,
            isDownloadable: true,
            rowStyle: 'bg-white'
        };
        logs.value.unshift(uiLog);
    };

    // Note: In BFF pattern, mutations should ideally go to API too.
    // For this Pilot, we manipulate the local state which is now the "source of truth" for the UI.
    const markAsDownloaded = (id: string) => {
        const log = logs.value.find(l => l.id === id);
        if (log) {
            // readonly制約をローカルUI更新のために解除（Mutable型ヘルパー）
            type Mutable<T> = { -readonly [P in keyof T]: T[P] };
            const mutableLog = log as Mutable<ConversionLogUi>;
            mutableLog.isDownloaded = true;
            mutableLog.rowStyle = 'bg-gray-50 opacity-70';
        }
    };

    // Updated: DELETE via RPC
    const removeLog = async (id: string) => {
        try {
            const res = await fetch(`/api/conversion/${id}`, { method: 'DELETE' });
            if (res.ok) {
                // Update local state on success
                const index = logs.value.findIndex(l => l.id === id);
                if (index !== -1) {
                    logs.value.splice(index, 1);
                }
            } else {
                console.error('ログ削除失敗');
            }
        } catch (e) {
            console.error('削除エラー:', e);
        }
    };

    const pendingDownloadCount = computed(() => {
        return logs.value.filter(log => !log.isDownloaded).length;
    });

    // --- Legacy / Simulation Logic Below (Kept for creating new dummy logs) ---
    const isProcessing = ref(false);
    const loadingStatus = ref('');

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

    const startDataConversion = async (clientName: string, sourceSoftware: string, targetSoftware: string, _file: File) => {
        isProcessing.value = true;
        loadingStatus.value = 'CSVファイルを解析中...';

        await new Promise(r => setTimeout(r, 1000));
        loadingStatus.value = 'フォーマットを標準化しています...';

        await new Promise(r => setTimeout(r, 1000));
        loadingStatus.value = `${targetSoftware}形式へ変換中...`;

        await new Promise(r => setTimeout(r, 1000));
        loadingStatus.value = 'ファイルを生成しています...';

        await new Promise(r => setTimeout(r, 1000));

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
        startDataConversion,
        processFile,
        isProcessing,
        loadingStatus
    };
}
