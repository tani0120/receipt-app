
import { ref, computed, onMounted } from 'vue';
import type { ConversionLogUi } from '@/types/ScreenG_ui.type';

// State driven by API (BFF)
const logs = ref<ConversionLogUi[]>([]);
/** サーバーから受け取った未DLカウント（サーバー側で集計） */
const serverPendingCount = ref(0);

export function useDataConversion() {

    // ============================================================
    // サーバーAPI呼び出し
    // ============================================================

    /** ログ一覧取得（サーバー側でソート・集計済み） */
    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/conversion');
            if (res.ok) {
                const data = await res.json() as {
                    logs: ConversionLogUi[];
                    pendingDownloadCount: number;
                    totalCount: number;
                };
                logs.value = data.logs;
                serverPendingCount.value = data.pendingDownloadCount;
            }
        } catch (e) {
            console.error('変換ログ取得失敗:', e);
        }
    };

    // 初期読み込み
    onMounted(() => {
        fetchLogs();
    });

    /** ダウンロード済みマーク（サーバー先行 → ローカル楽観更新） */
    const markAsDownloaded = async (id: string) => {
        try {
            const res = await fetch(`/api/conversion/${id}/downloaded`, { method: 'PUT' });
            if (res.ok) {
                // ローカル楽観更新
                type Mutable<T> = { -readonly [P in keyof T]: T[P] };
                const log = logs.value.find(l => l.id === id);
                if (log) {
                    const mutableLog = log as Mutable<ConversionLogUi>;
                    mutableLog.isDownloaded = true;
                    mutableLog.rowStyle = 'bg-gray-50 opacity-70';
                    serverPendingCount.value = Math.max(0, serverPendingCount.value - 1);
                }
            }
        } catch (e) {
            console.error('ダウンロード済みマーク失敗:', e);
        }
    };

    /** ログ削除（サーバー先行） */
    const removeLog = async (id: string) => {
        try {
            const res = await fetch(`/api/conversion/${id}`, { method: 'DELETE' });
            if (res.ok) {
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

    /** 未DLカウント（サーバー集計値） */
    const pendingDownloadCount = computed(() => serverPendingCount.value);

    // ============================================================
    // CSV変換（サーバーAPI化済み）
    // ============================================================

    const isProcessing = ref(false);
    const loadingStatus = ref('');

    /** CSVファイルのバリデーション */
    const processFile = (file: File): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!file.name.toLowerCase().endsWith('.csv')) {
                reject(new Error('CSVファイルのみ対応しています'));
                return;
            }
            resolve();
        });
    };

    /**
     * CSV変換実行 — サーバーAPI（POST /api/conversion/convert）
     *
     * 旧: フロント側でダミーCSV生成 → BlobURL
     * 新: サーバーにCSVファイルを送信 → サーバー側で変換・保存 → ダウンロードURLを返却
     */
    const startDataConversion = async (
        clientName: string,
        sourceSoftware: string,
        targetSoftware: string,
        file: File,
    ): Promise<string> => {
        isProcessing.value = true;
        loadingStatus.value = '変換処理を開始しています...';

        try {
            loadingStatus.value = `${targetSoftware}形式へ変換中...`;

            const formData = new FormData();
            formData.append('file', file);
            formData.append('clientName', clientName);
            formData.append('sourceSoftware', sourceSoftware);
            formData.append('targetSoftware', targetSoftware);

            const res = await fetch('/api/conversion/convert', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error((errBody as { message?: string }).message ?? '変換に失敗しました');
            }

            const data = await res.json() as {
                success: boolean;
                log: ConversionLogUi;
            };

            // サーバーからの応答をローカルに追加
            logs.value.unshift(data.log);
            serverPendingCount.value++;

            loadingStatus.value = '変換完了！';
            return data.log.fileName;
        } catch (e) {
            loadingStatus.value = 'エラーが発生しました';
            throw e;
        } finally {
            isProcessing.value = false;
        }
    };

    return {
        logs,
        markAsDownloaded,
        removeLog,
        pendingDownloadCount,
        startDataConversion,
        processFile,
        isProcessing,
        loadingStatus
    };
}
