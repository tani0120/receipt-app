/**
 * migrationWorker.ts — Drive→Supabase移行バックグラウンドワーカー（Phase D-4）
 *
 * 責務:
 *   - setInterval(5000) で定期実行
 *   - migration_jobs から queued を最大5件取得（④小分け）
 *   - 1件ずつ: DL → SHA-256 → previewExtract API → Storage PUT → doc-store書き戻し → ゴミ箱移動
 *   - ③リトライ: 404/401/403 → 即failed、429/5xx → requeue、3回超 → failed
 *   - 起動時デッドレター処理: processing → queued に戻す（クラッシュ復旧）
 *   - excluded はpreviewExtractをスキップ（コスト削減）
 */

import { createHash } from 'crypto';
import { getFilePreview } from '../drive/driveService';
import { trashDriveFile } from '../drive/driveService';
import { StorageService } from '../../lib/storage';
import { previewExtractImage } from '../pipeline/previewExtract.service';
import type { PreviewExtractResponse } from '../pipeline/types';
import { updateAiResults } from '../documentStore';
import {
  dequeueJobs,
  markJobDone,
  markJobFailed,
  requeueJob,
  recoverStaleJobs,
  getExpiredExcluded,
  markStoragePurged,
  type MigrationJob,
} from './migrationRepository';

let _intervalId: ReturnType<typeof setInterval> | null = null;
let _processing = false;

// ===== HTTP ステータスコード判定 =====

/** リトライ不要なエラーか（404/401/403） */
function isNonRetryableError(errMsg: string): boolean {
  return /\b(404|401|403)\b/.test(errMsg);
}

// ===== ゴミ箱移動（即3回リトライ） =====

async function trashWithRetry(driveFileId: string): Promise<void> {
  const delays = [5000, 25000, 125000]; // 5秒→25秒→125秒

  for (let attempt = 0; attempt < delays.length; attempt++) {
    try {
      await trashDriveFile(driveFileId);
      console.log(`[migrationWorker] ゴミ箱移動成功: ${driveFileId}`);
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[migrationWorker] ゴミ箱移動リトライ ${attempt + 1}/${delays.length}: ${msg}`);
      if (attempt < delays.length - 1) {
        await new Promise(r => setTimeout(r, delays[attempt]!));
      }
    }
  }
  // 3回失敗 → ログのみ（status=doneは確定。データ損失なし）
  console.error(`[migrationWorker] ゴミ箱移動最終失敗: ${driveFileId}。Driveに残存するが冪等性で問題なし`);
}

// ===== 1件処理 =====

async function processOneJob(job: MigrationJob): Promise<void> {
  const t0 = Date.now();

  try {
    // 1. Drive API DL（getFilePreview流用）
    const preview = await getFilePreview(job.driveFileId);

    // 2. SHA-256ハッシュ計算
    const hash = createHash('sha256').update(preview.buffer).digest('hex');

    // 3. previewExtract API呼び出し（excluded以外のみ）
    // 設計判断: excludedはAI分類不要でコスト削減。
    // 将来「仕訳外→仕訳対象に戻す」機能が必要な場合、
    // ステータス変更時に個別previewExtractを実行する設計で対応する。
    let previewExtractResult: PreviewExtractResponse | null = null;
    if (job.docStatus !== 'excluded') {
      try {
        const base64 = Buffer.from(preview.buffer).toString('base64');
        previewExtractResult = await previewExtractImage({
          image: base64,
          mimeType: preview.mimeType,
          clientId: job.clientId,
          filename: job.driveFileId,
          fileHash: hash,
        });
        console.log(
          `[migrationWorker] previewExtract完了: ${job.driveFileId}`
          + ` → ${previewExtractResult.source_type} (${previewExtractResult.source_type_confidence})`
          + ` ${previewExtractResult.line_items.length}行`
          + ` fallback=${previewExtractResult.fallback_applied}`,
        );
      } catch (previewExtractErr) {
        // previewExtract失敗でもDL+Storageは続行（AI結果なしでジョブ完了）
        const msg = previewExtractErr instanceof Error ? previewExtractErr.message : String(previewExtractErr);
        console.error(`[migrationWorker] previewExtract失敗（続行）: ${job.driveFileId}: ${msg}`);
      }
    }

    // 4. Supabase Storage PUT
    const ext = preview.mimeType.split('/').pop() || 'bin';
    const storagePath = `documents/${job.clientId}/${hash}.${ext}`;
    await StorageService.uploadImage(
      Buffer.from(preview.buffer),
      storagePath,
      preview.mimeType,
    );

    // 5. ジョブ完了（storage_pathとfile_hashを記録）
    await markJobDone(job.id, storagePath, hash);

    // 6. AI分類結果をdoc-storeに書き戻し（previewExtractが成功した場合のみ）
    if (previewExtractResult) {
      updateAiResults(job.driveFileId, previewExtractResult, hash);
    }

    // 7. Driveゴミ箱移動（全3種別。Supabase移動完了後にDriveを空にする）
    // 非同期で実行（ジョブの完了を待たない）
    trashWithRetry(job.driveFileId).catch(() => {});

    const elapsed = Date.now() - t0;
    console.log(
      `[migrationWorker] done: ${job.driveFileId} (${job.docStatus})`
      + ` (${(preview.buffer.byteLength / 1024).toFixed(0)}KB, ${elapsed}ms)`
      + ` hash=${hash.slice(0, 12)}... path=${storagePath}`
      + (previewExtractResult ? ` ai=${previewExtractResult.source_type}` : ' ai=skipped'),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const elapsed = Date.now() - t0;
    const newRetryCount = job.retryCount + 1;

    console.error(
      `[migrationWorker] error: ${job.driveFileId}`
      + ` retry=${newRetryCount} (${elapsed}ms): ${msg}`,
    );

    if (isNonRetryableError(msg)) {
      // 404/401/403 → 即failed（リトライ不要）
      await markJobFailed(job.id, msg, newRetryCount);
    } else if (newRetryCount >= 3) {
      // 3回超 → failed
      await markJobFailed(job.id, msg, newRetryCount);
    } else {
      // 429/5xx → queued に戻す（再キュー）
      await requeueJob(job.id, newRetryCount);
    }
  }
}

// ===== ワーカーループ =====

async function tick(): Promise<void> {
  if (_processing) return;
  _processing = true;

  try {
    const jobs = await dequeueJobs(5);
    if (jobs.length === 0) return;

    console.log(`[migrationWorker] ${jobs.length}件処理開始`);

    // 1件ずつ逐次処理（並列にするとDrive API rate limit超過の恐れ）
    for (const job of jobs) {
      await processOneJob(job);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[migrationWorker] tick エラー:`, msg);
  } finally {
    // パージは毎tick軽量チェック（実行は10tickに1回）
    await purgeExpiredExcluded().catch(() => {});
    _processing = false;
  }
}

// ===== excluded Storageパージ（Phase E-7） =====

let _purgeCounter = 0;

/** DL済み90日超のexcludedファイルをSupabase Storageから削除 */
async function purgeExpiredExcluded(): Promise<void> {
  _purgeCounter++;
  // 10tick（約50秒）に1回だけ実行
  if (_purgeCounter % 10 !== 0) return;

  try {
    const expired = await getExpiredExcluded();
    if (expired.length === 0) return;

    const purgedIds: string[] = [];
    for (const item of expired) {
      try {
        await StorageService.deleteFile(item.storagePath);
        purgedIds.push(item.id);
        console.log(`[migrationWorker] Storageパージ: ${item.storagePath}`);
      } catch (err) {
        console.error(`[migrationWorker] Storageパージ失敗: ${item.storagePath}:`, err instanceof Error ? err.message : String(err));
      }
    }

    if (purgedIds.length > 0) {
      await markStoragePurged(purgedIds);
      console.log(`[migrationWorker] ${purgedIds.length}件のexpired excludedをStorageから削除`);
    }
  } catch (err) {
    console.error('[migrationWorker] purgeExpiredExcluded エラー:', err instanceof Error ? err.message : String(err));
  }
}

// ===== 公開API =====

/**
 * ワーカーを起動（Phase D-5: server.ts から呼び出し）
 */
export async function startMigrationWorker(): Promise<void> {
  if (_intervalId) {
    console.warn('[migrationWorker] 既に起動中。二重起動を防止');
    return;
  }

  // 起動時デッドレター処理
  try {
    const recovered = await recoverStaleJobs();
    if (recovered > 0) {
      console.log(`[migrationWorker] 起動時デッドレター復旧: ${recovered}件`);
    }
  } catch (err) {
    // Supabase未接続時はスキップ（開発環境向け）
    console.warn('[migrationWorker] デッドレター復旧スキップ:', err instanceof Error ? err.message : String(err));
  }

  _intervalId = setInterval(() => {
    tick().catch(err => {
      console.error('[migrationWorker] tick未捕捉エラー:', err);
    });
  }, 5000);

  console.log('[migrationWorker] 起動完了（5秒間隔）');
}

/**
 * ワーカーを停止（サーバー終了時のクリーンアップ用）
 */
export function stopMigrationWorker(): void {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
    console.log('[migrationWorker] 停止');
  }
}
