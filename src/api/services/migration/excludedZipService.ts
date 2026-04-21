/**
 * excludedZipService.ts — 仕訳外ファイルZIPダウンロード（Phase E-2）
 *
 * 責務:
 *   - migration_jobsからexcluded（未DL or 全件）取得
 *   - Supabase Storageから逐次DL → archiver でZIPストリーム生成
 *   - DL成功後にdownloaded_atマーク（二重DL防止）
 */

import archiver from 'archiver';
import type { Writable } from 'stream';
import { StorageService } from '../../lib/storage';
import {
  getExcludedJobs,
  markDownloaded,
} from './migrationRepository';

/**
 * 仕訳外ファイルをZIPストリームとして生成
 *
 * @param clientId 顧問先ID
 * @param output 書き込み先ストリーム（HTTPレスポンス等）
 * @param all trueなら全件（DL済み含む）、falseなら未DLのみ
 * @returns ZIP化した件数
 */
export async function generateExcludedZip(
  clientId: string,
  output: Writable,
  all: boolean = false,
): Promise<number> {
  // 1. excludedジョブ取得
  const jobs = await getExcludedJobs(clientId, all);

  if (jobs.length === 0) {
    // ストリームを閉じないとクライアントがハングする
    output.end();
    return 0;
  }

  console.log(`[excludedZipService] ${clientId}: ${jobs.length}件のexcludedファイルをZIP生成開始`);

  // 2. archiver初期化
  const archive = archiver('zip', { zlib: { level: 5 } });
  archive.pipe(output);

  // エラーハンドリング
  archive.on('error', (err) => {
    console.error(`[excludedZipService] archiver エラー:`, err.message);
    throw err;
  });

  // 3. Supabase Storageから逐次DL → ZIPに追加
  const downloadedIds: string[] = [];

  for (const job of jobs) {
    if (!job.storagePath) {
      console.warn(`[excludedZipService] storage_pathなし: id=${job.id}, driveFileId=${job.driveFileId}`);
      continue;
    }

    try {
      // Supabase Storageからダウンロード
      const fileBuffer = await StorageService.downloadFile(job.storagePath);

      // ファイル名: drive_file_idのハッシュ先頭 + 元の拡張子
      const ext = job.storagePath.split('.').pop() || 'bin';
      const fileName = `${job.driveFileId.slice(0, 12)}_${job.fileHash?.slice(0, 8) || 'noHash'}.${ext}`;

      archive.append(fileBuffer, { name: fileName });
      downloadedIds.push(job.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[excludedZipService] DL失敗: id=${job.id}, path=${job.storagePath}: ${msg}`);
      // 1件失敗しても他のファイルは続行
    }
  }

  // 4. ZIP確定
  await archive.finalize();

  // 5. DL済みマーク（未DLモードの場合のみ）
  if (!all && downloadedIds.length > 0) {
    try {
      await markDownloaded(downloadedIds);
      console.log(`[excludedZipService] ${downloadedIds.length}件をDL済みマーク`);
    } catch (err) {
      // マーク失敗してもZIPは送出済み。次回重複DLされるが問題なし
      console.error(`[excludedZipService] DL済みマーク失敗:`, err instanceof Error ? err.message : String(err));
    }
  }

  console.log(`[excludedZipService] ${clientId}: ${downloadedIds.length}件のZIP生成完了`);
  return downloadedIds.length;
}
