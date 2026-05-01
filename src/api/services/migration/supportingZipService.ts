/**
 * supportingZipService.ts — 根拠資料ファイルZIPダウンロード
 *
 * 責務:
 *   - migration_jobsからsupporting（未DL or 全件）取得
 *   - Supabase Storageから逐次DL → archiver でZIPストリーム生成
 *   - DL成功後にdownloaded_atマーク（二重DL防止）
 *
 * excludedZipService.tsと同構造。doc_statusが'supporting'の行を対象とする。
 */

import archiver from 'archiver';
import type { Writable } from 'stream';
import { StorageService } from '../../lib/storage';
import {
  getSupportingJobs,
  markDownloaded,
} from './migrationRepository';

/**
 * 根拠資料ファイルをZIPストリームとして生成
 *
 * @param clientId 顧問先ID
 * @param output 書き込み先ストリーム（HTTPレスポンス等）
 * @param all trueなら全件（DL済み含む）、falseなら未DLのみ
 * @param jobId 指定時はそのジョブのsupportingファイルのみ
 * @returns ZIP化した件数
 */
export async function generateSupportingZip(
  clientId: string,
  output: Writable,
  all: boolean = false,
  jobId?: string,
): Promise<number> {
  // 1. supportingジョブ取得
  const jobs = await getSupportingJobs(clientId, all, jobId);

  if (jobs.length === 0) {
    output.end();
    return 0;
  }

  console.log(`[supportingZipService] ${clientId}: ${jobs.length}件の根拠資料ファイルをZIP生成開始`);

  // 2. archiver初期化
  const archive = archiver('zip', { zlib: { level: 5 } });
  archive.pipe(output);

  archive.on('error', (err) => {
    console.error(`[supportingZipService] archiver エラー:`, err.message);
    throw err;
  });

  // 3. Supabase Storageから逐次DL → ZIPに追加
  const downloadedIds: string[] = [];

  for (const job of jobs) {
    if (!job.storagePath) {
      console.warn(`[supportingZipService] storage_pathなし: id=${job.id}, driveFileId=${job.driveFileId}`);
      continue;
    }

    try {
      const fileBuffer = await StorageService.downloadFile(job.storagePath);

      const ext = job.storagePath.split('.').pop() || 'bin';
      const fileName = `${job.driveFileId.slice(0, 12)}_${job.fileHash?.slice(0, 8) || 'noHash'}.${ext}`;

      archive.append(fileBuffer, { name: fileName });
      downloadedIds.push(job.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[supportingZipService] DL失敗: id=${job.id}, path=${job.storagePath}: ${msg}`);
    }
  }

  // 4. ZIP確定
  await archive.finalize();

  // 5. DL済みマーク
  if (downloadedIds.length > 0) {
    try {
      await markDownloaded(downloadedIds);
      console.log(`[supportingZipService] ${downloadedIds.length}件をDL済みマーク`);
    } catch (err) {
      console.error(`[supportingZipService] DL済みマーク失敗:`, err instanceof Error ? err.message : String(err));
    }
  }

  console.log(`[supportingZipService] ${clientId}: ${downloadedIds.length}件のZIP生成完了`);
  return downloadedIds.length;
}
