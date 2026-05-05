/**
 * useMigrationPoller.ts — バックグラウンド移行ポーリングcomposable
 *
 * 責務: 画面遷移しても生き続けるグローバルポーリング。
 *       移行ジョブの完了/失敗をバックグラウンドで監視し、
 *       トースト通知 + 通知センター記録を行う。
 *
 * モジュールスコープのrefで状態を保持（画面遷移で消えない）。
 *
 * ルール:
 *   - composableにロジックは入れない（状態管理 + API呼び出しのみ）
 *   - ポーリング間隔: 3秒（既存のMockDriveSelectPageと同一）
 */

import { ref } from 'vue'
import { useGlobalToast } from './useGlobalToast'
import { useNotificationCenter } from './useNotificationCenter'
import { useDocuments } from '@/composables/useDocuments'

// ============================================================
// § ポーリング中のジョブ情報
// ============================================================

interface PollerEntry {
  /** ジョブID */
  jobId: string
  /** 顧問先名（通知表示用） */
  clientName: string
  /** 顧問先ID（ZIP DL URL生成用） */
  clientId: string
  /** 総件数 */
  total: number
  /** 仕訳外件数（ZIP DLアクション有無判定用） */
  excludedCount: number
  /** ポーリングタイマーID */
  timerId: ReturnType<typeof setInterval> | null
}

// ============================================================
// § モジュールスコープ（グローバルシングルトン）
// ============================================================

/** ポーリング中のジョブ一覧 */
const activePollers = ref<Map<string, PollerEntry>>(new Map())

// ============================================================
// § ポーリング間隔（ms）
// ============================================================

const POLL_INTERVAL_MS = 3000

// ============================================================
// § 公開関数
// ============================================================

/**
 * ジョブのバックグラウンドポーリングを開始する
 *
 * @param jobId - 移行ジョブID（POST /api/drive/migrateの戻り値）
 * @param clientName - 顧問先名（通知メッセージ用）
 * @param clientId - 顧問先ID（ZIP DL URL用）
 * @param total - 総件数
 * @param excludedCount - 仕訳外件数
 */
function startPolling(
  jobId: string,
  clientName: string,
  clientId: string,
  total: number,
  excludedCount: number,
): void {
  // 既にポーリング中なら二重起動しない
  if (activePollers.value.has(jobId)) {
    console.warn(`[useMigrationPoller] 既にポーリング中: ${jobId}`)
    return
  }

  const entry: PollerEntry = {
    jobId,
    clientName,
    clientId,
    total,
    excludedCount,
    timerId: null,
  }

  // ポーリングタイマー開始
  entry.timerId = setInterval(() => {
    pollJobStatus(jobId)
  }, POLL_INTERVAL_MS)

  activePollers.value.set(jobId, entry)
  console.log(`[useMigrationPoller] ポーリング開始: jobId=${jobId}, total=${total}`)
}

/**
 * ジョブステータスを1回確認する（ポーリングのコールバック）
 */
async function pollJobStatus(jobId: string): Promise<void> {
  const entry = activePollers.value.get(jobId)
  if (!entry) return

  try {
    const res = await fetch(`/api/drive/migrate/status/${jobId}`)
    if (!res.ok) return

    const status = await res.json() as {
      total: number
      queued: number
      processing: number
      done: number
      failed: number
    }

    // 全件完了判定（queued + processing === 0）
    if (status.queued === 0 && status.processing === 0) {
      // ポーリング停止
      stopPolling(jobId)

      // 結果通知
      notifyCompletion(entry, status.done, status.failed)
    }
  } catch {
    // ポーリングエラーは無視（次回リトライ）
    console.warn(`[useMigrationPoller] ポーリングエラー: jobId=${jobId}`)
  }
}

/**
 * ポーリングを停止する
 */
function stopPolling(jobId: string): void {
  const entry = activePollers.value.get(jobId)
  if (!entry) return

  if (entry.timerId !== null) {
    clearInterval(entry.timerId)
  }
  activePollers.value.delete(jobId)
  console.log(`[useMigrationPoller] ポーリング停止: jobId=${jobId}`)
}

/**
 * 移行完了/失敗通知（トースト + 通知センター）
 */
function notifyCompletion(entry: PollerEntry, doneCount: number, failedCount: number): void {
  const { showToast } = useGlobalToast()
  const { addNotification } = useNotificationCenter()
  const { refresh } = useDocuments()

  // migrationWorkerがdoc-storeに書き込んだAI分類結果をフロント側refに反映
  refresh(entry.clientId).catch(err => {
    console.warn('[useMigrationPoller] doc-storeリフレッシュ失敗:', err)
  })

  const clientLabel = entry.clientName || entry.clientId

  if (failedCount > 0) {
    // 一部失敗
    showToast({
      message: `${clientLabel} の移行に${failedCount}件失敗しました`,
      type: 'error',
    })

    addNotification({
      type: 'migration_failed',
      title: `${clientLabel} 移行に失敗あり`,
      body: `${doneCount}件完了、${failedCount}件失敗。管理画面で確認してください。`,
      clientId: entry.clientId,
      jobId: entry.jobId,
    })
  } else {
    // 全件成功
    showToast({
      message: `${clientLabel} 移行完了（${doneCount}件）`,
      type: 'success',
    })

    // 通知センターに記録（仕訳外があればZIP DLアクション付き）
    const notification: Parameters<typeof addNotification>[0] = {
      type: 'migration_complete',
      title: `${clientLabel} 移行完了`,
      body: `${doneCount}件の移行が完了しました。`,
      clientId: entry.clientId,
      jobId: entry.jobId,
    }

    // 仕訳外ファイルがある場合、ZIP DLアクションを追加
    if (entry.excludedCount > 0) {
      notification.body += ` 仕訳外${entry.excludedCount}件。`
      notification.action = {
        label: '仕訳外ZIP DL',
        url: `/api/drive/download-excluded/${entry.clientId}`,
      }
    }

    addNotification(notification)
  }
}

// ============================================================
// § composable export
// ============================================================

export function useMigrationPoller() {
  return {
    /** ポーリング中のジョブ一覧 */
    activePollers,
    /** ポーリングを開始する */
    startPolling,
    /** ポーリングを停止する */
    stopPolling,
  }
}
