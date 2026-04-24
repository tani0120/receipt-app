/**
 * migrationRepository.ts — MigrationRepository interface + ファクトリ（Phase D/E）
 *
 * 責務:
 *   - MigrationRepository interface 定義
 *   - 型定義（MigrationJob, MigrationStatus, DocStatusForMigration）
 *   - ファクトリ関数: 環境変数でJSON版/Supabase版を切り替え
 *
 * 【切り替え方式】
 * - USE_SUPABASE_MIGRATION=true: Supabaseからデータ取得
 * - USE_SUPABASE_MIGRATION未設定（デフォルト）: JSONファイル永続化
 */

// ===== 型 =====

export type MigrationStatus = 'queued' | 'processing' | 'done' | 'failed';
export type DocStatusForMigration = 'target' | 'supporting' | 'excluded';

export interface MigrationJob {
  id: string;
  jobId: string;
  clientId: string;
  driveFileId: string;
  docStatus: DocStatusForMigration;
  migrationStatus: MigrationStatus;
  retryCount: number;
  lastError: string | null;
  storagePath: string | null;
  fileHash: string | null;
  downloadedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ===== Repository Interface =====

export interface MigrationRepository {
  /** 移行ジョブを一括登録（drive_file_id重複はスキップ） */
  enqueueMigrationJobs(
    jobId: string,
    clientId: string,
    files: Array<{ fileId: string; status: string }>,
  ): Promise<number>;

  /** queued状態のジョブを最大N件取得し、processingに遷移 */
  dequeueJobs(limit?: number): Promise<MigrationJob[]>;

  /** ジョブを完了にする（storage_pathとfile_hashも記録） */
  markJobDone(id: string, storagePath: string, fileHash: string): Promise<void>;

  /** ジョブを失敗にする（リトライカウント更新） */
  markJobFailed(id: string, errorMsg: string, retryCount: number): Promise<void>;

  /** ジョブをキューに戻す（リトライ用） */
  requeueJob(id: string, retryCount: number): Promise<void>;

  /** jobIdの全件ステータス集計 */
  getJobStatus(jobId: string): Promise<{
    total: number;
    queued: number;
    processing: number;
    done: number;
    failed: number;
  }>;

  /** processing状態のまま放置されたジョブをqueuedに戻す */
  recoverStaleJobs(): Promise<number>;

  // --- Phase E: 仕訳外ファイル操作 ---

  /** 未DLのexcludedジョブを取得（ZIP DL用。jobId指定時はそのジョブのみ） */
  getExcludedJobs(clientId: string, all?: boolean, jobId?: string): Promise<MigrationJob[]>;

  /** excludedジョブのDL済みマークをつける */
  markDownloaded(ids: string[]): Promise<void>;

  /** 未DLのexcluded件数を取得（バッジ表示用） */
  getExcludedCount(clientId: string): Promise<number>;

  /** DL済み90日超のexcluded StorageパスとIDを取得（パージ対象） */
  getExpiredExcluded(): Promise<Array<{ id: string; storagePath: string }>>;

  /** Storage削除済みマークをつける */
  markStoragePurged(ids: string[]): Promise<void>;

  /** 仕訳外ダウンロード履歴取得（jobId単位でグルーピング） */
  getExcludedHistory(clientId: string): Promise<Array<{
    jobId: string;
    clientId: string;
    excludedCount: number;
    fileName: string;
    displayDate: string;
    createdAt: string;
    downloadedAt: string | null;
  }>>;

  /** 顧問先の移行ジョブ一覧取得（jobId単位でグルーピング） */
  getMigrationJobs(clientId: string): Promise<Array<{
    jobId: string;
    clientId: string;
    createdAt: string;
    total: number;
    done: number;
    failed: number;
    excluded: number;
  }>>;
}

// ===== ファクトリ =====
import { createSupabaseMigrationRepository } from './migrationRepository.supabase';
import { createJsonMigrationRepository } from './migrationRepository.json';

let _repo: MigrationRepository | null = null;

export function getMigrationRepository(): MigrationRepository {
  if (_repo) return _repo;

  const useSupabase = process.env.USE_SUPABASE_MIGRATION === 'true';

  if (useSupabase) {
    _repo = createSupabaseMigrationRepository();
  } else {
    _repo = createJsonMigrationRepository();
  }

  console.log(`[migrationRepository] ${useSupabase ? 'Supabase' : 'JSON'}版を使用`);
  return _repo!;
}

// ===== 互換性: 既存の関数呼び出しをそのまま使えるようにエクスポート =====

export async function enqueueMigrationJobs(
  jobId: string,
  clientId: string,
  files: Array<{ fileId: string; status: string }>,
): Promise<number> {
  return getMigrationRepository().enqueueMigrationJobs(jobId, clientId, files);
}

export async function dequeueJobs(limit?: number): Promise<MigrationJob[]> {
  return getMigrationRepository().dequeueJobs(limit);
}

export async function markJobDone(id: string, storagePath: string, fileHash: string): Promise<void> {
  return getMigrationRepository().markJobDone(id, storagePath, fileHash);
}

export async function markJobFailed(id: string, errorMsg: string, retryCount: number): Promise<void> {
  return getMigrationRepository().markJobFailed(id, errorMsg, retryCount);
}

export async function requeueJob(id: string, retryCount: number): Promise<void> {
  return getMigrationRepository().requeueJob(id, retryCount);
}

export async function getJobStatus(jobId: string): Promise<{
  total: number; queued: number; processing: number; done: number; failed: number;
}> {
  return getMigrationRepository().getJobStatus(jobId);
}

export async function recoverStaleJobs(): Promise<number> {
  return getMigrationRepository().recoverStaleJobs();
}

export async function getExcludedJobs(clientId: string, all?: boolean, jobId?: string): Promise<MigrationJob[]> {
  return getMigrationRepository().getExcludedJobs(clientId, all, jobId);
}

export async function markDownloaded(ids: string[]): Promise<void> {
  return getMigrationRepository().markDownloaded(ids);
}

export async function getExcludedCount(clientId: string): Promise<number> {
  return getMigrationRepository().getExcludedCount(clientId);
}

export async function getExpiredExcluded(): Promise<Array<{ id: string; storagePath: string }>> {
  return getMigrationRepository().getExpiredExcluded();
}

export async function markStoragePurged(ids: string[]): Promise<void> {
  return getMigrationRepository().markStoragePurged(ids);
}

export async function getExcludedHistory(clientId: string) {
  return getMigrationRepository().getExcludedHistory(clientId);
}

export async function getMigrationJobs(clientId: string) {
  return getMigrationRepository().getMigrationJobs(clientId);
}
