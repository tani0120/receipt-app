
import { ref, computed, onMounted } from 'vue';
import type { ConversionLogUi, ConversionLogId } from '@/types/ScreenG_ui.type';

// State driven by API (BFF)
const logs = ref<ConversionLogUi[]>([]);
/** サーバーから受け取った未DLカウント（T-31-5: サーバー側で集計） */
const serverPendingCount = ref(0);

export function useDataConversion() {

    // Fetch from Hono (BFF) — T-31-5: サーバー側ソート済み+未DLカウント付きレスポンス
    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/conversion');
            if (res.ok) {
                const data = await res.json() as {
                    logs: ConversionLogUi[];
                    pendingDownloadCount: number;
                    totalCount: number;
                };
                // サーバー側でソート済みの配列をそのまま設定
                logs.value = data.logs;
                serverPendingCount.value = data.pendingDownloadCount;
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
        serverPendingCount.value++;
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
            serverPendingCount.value = Math.max(0, serverPendingCount.value - 1);
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
                    const removed = logs.value[index];
                    if (removed && !removed.isDownloaded) {
                        serverPendingCount.value = Math.max(0, serverPendingCount.value - 1);
                    }
                    logs.value.splice(index, 1);
                }
            } else {
                console.error('ログ削除失敗');
            }
        } catch (e) {
            console.error('削除エラー:', e);
        }
    };

    /** 未DLカウント（サーバー集計値 + ローカル楽観更新） */
    const pendingDownloadCount = computed(() => serverPendingCount.value);

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
        loadingStatus.value = '変換処理を開始しています...';

        // TODO: POST /api/conversion/convert に接続し、実際のCSV変換を実行
        //       現在はクライアント側でダミーCSVを生成する暫定実装
        loadingStatus.value = `${targetSoftware}形式へ変換中...`;

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
