/**
 * migrationRepository.json.ts — JSON永続化版 MigrationRepository（dev/test用）
 *
 * 責務:
 *   - data/migration_jobs.json にジョブ情報を永続化
 *   - Supabase不要でPhase D/Eの全機能をローカルテスト可能
 *   - 本番ではSupabase版に切り替え（環境変数で制御）
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { MigrationRepository, MigrationJob, DocStatusForMigration } from './migrationRepository';

const DATA_DIR = join(process.cwd(), 'data');
const FILE_PATH = join(DATA_DIR, 'migration_jobs.json');

// ===== JSON読み書き =====

interface JobRow {
  id: string;
  job_id: string;
  client_id: string;
  drive_file_id: string;
  doc_status: string;
  migration_status: string;
  retry_count: number;
  last_error: string | null;
  storage_path: string | null;
  file_hash: string | null;
  downloaded_at: string | null;
  storage_purged_at: string | null;
  created_at: string;
  updated_at: string;
}

function readJobs(): JobRow[] {
  if (!existsSync(FILE_PATH)) return [];
  try {
    const raw = readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(raw) as JobRow[];
  } catch {
    return [];
  }
}

function writeJobs(jobs: JobRow[]): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(FILE_PATH, JSON.stringify(jobs, null, 2), 'utf-8');
}

function toJob(row: JobRow): MigrationJob {
  return {
    id: row.id,
    jobId: row.job_id,
    clientId: row.client_id,
    driveFileId: row.drive_file_id,
    docStatus: row.doc_status as DocStatusForMigration,
    migrationStatus: row.migration_status as MigrationJob['migrationStatus'],
    retryCount: row.retry_count,
    lastError: row.last_error,
    storagePath: row.storage_path,
    fileHash: row.file_hash,
    downloadedAt: row.downloaded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ===== 実装 =====

export function createJsonMigrationRepository(): MigrationRepository {
  return {
    async enqueueMigrationJobs(jobId, clientId, files) {
      const jobs = readJobs();
      let count = 0;

      for (const f of files) {
        // drive_file_id UNIQUE: 既存があればスキップ
        if (jobs.some(j => j.drive_file_id === f.fileId)) continue;

        jobs.push({
          id: randomUUID(),
          job_id: jobId,
          client_id: clientId,
          drive_file_id: f.fileId,
          doc_status: f.status,
          migration_status: 'queued',
          retry_count: 0,
          last_error: null,
          storage_path: null,
          file_hash: null,
          downloaded_at: null,
          storage_purged_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        count++;
      }

      writeJobs(jobs);
      return count;
    },

    async dequeueJobs(limit = 5) {
      const jobs = readJobs();
      const queued = jobs
        .filter(j => j.migration_status === 'queued')
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .slice(0, limit);

      if (queued.length === 0) return [];

      // processing に遷移
      const now = new Date().toISOString();
      for (const q of queued) {
        const idx = jobs.findIndex(j => j.id === q.id);
        if (idx >= 0) {
          jobs[idx]!.migration_status = 'processing';
          jobs[idx]!.updated_at = now;
        }
      }

      writeJobs(jobs);
      return queued.map(toJob);
    },

    async markJobDone(id, storagePath, fileHash) {
      const jobs = readJobs();
      const idx = jobs.findIndex(j => j.id === id);
      if (idx >= 0) {
        jobs[idx]!.migration_status = 'done';
        jobs[idx]!.storage_path = storagePath;
        jobs[idx]!.file_hash = fileHash;
        jobs[idx]!.updated_at = new Date().toISOString();
        writeJobs(jobs);
      }
    },

    async markJobFailed(id, errorMsg, retryCount) {
      const jobs = readJobs();
      const idx = jobs.findIndex(j => j.id === id);
      if (idx >= 0) {
        jobs[idx]!.migration_status = 'failed';
        jobs[idx]!.last_error = errorMsg;
        jobs[idx]!.retry_count = retryCount;
        jobs[idx]!.updated_at = new Date().toISOString();
        writeJobs(jobs);
      }
    },

    async requeueJob(id, retryCount) {
      const jobs = readJobs();
      const idx = jobs.findIndex(j => j.id === id);
      if (idx >= 0) {
        jobs[idx]!.migration_status = 'queued';
        jobs[idx]!.retry_count = retryCount;
        jobs[idx]!.updated_at = new Date().toISOString();
        writeJobs(jobs);
      }
    },

    async getJobStatus(jobId) {
      const jobs = readJobs().filter(j => j.job_id === jobId);
      return {
        total: jobs.length,
        queued: jobs.filter(j => j.migration_status === 'queued').length,
        processing: jobs.filter(j => j.migration_status === 'processing').length,
        done: jobs.filter(j => j.migration_status === 'done').length,
        failed: jobs.filter(j => j.migration_status === 'failed').length,
      };
    },

    async recoverStaleJobs() {
      const jobs = readJobs();
      const threshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      let recovered = 0;

      for (let i = 0; i < jobs.length; i++) {
        if (jobs[i]!.migration_status === 'processing' && jobs[i]!.updated_at < threshold) {
          jobs[i]!.migration_status = 'queued';
          jobs[i]!.updated_at = new Date().toISOString();
          recovered++;
        }
      }

      if (recovered > 0) {
        writeJobs(jobs);
        console.log(`[jsonMigrationRepo] デッドレター復旧: ${recovered}件をqueuedに戻しました`);
      }
      return recovered;
    },

    async getExcludedJobs(clientId, all = false) {
      let jobs = readJobs().filter(j =>
        j.client_id === clientId &&
        j.doc_status === 'excluded' &&
        j.migration_status === 'done' &&
        !j.storage_purged_at
      );

      if (!all) {
        jobs = jobs.filter(j => !j.downloaded_at);
      }

      return jobs
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map(toJob);
    },

    async markDownloaded(ids) {
      if (ids.length === 0) return;
      const jobs = readJobs();
      const now = new Date().toISOString();
      for (const id of ids) {
        const idx = jobs.findIndex(j => j.id === id);
        if (idx >= 0) {
          jobs[idx]!.downloaded_at = now;
        }
      }
      writeJobs(jobs);
    },

    async getExcludedCount(clientId) {
      return readJobs().filter(j =>
        j.client_id === clientId &&
        j.doc_status === 'excluded' &&
        j.migration_status === 'done' &&
        !j.downloaded_at &&
        !j.storage_purged_at
      ).length;
    },

    async getExpiredExcluded() {
      const threshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      return readJobs()
        .filter(j =>
          j.doc_status === 'excluded' &&
          j.migration_status === 'done' &&
          j.downloaded_at && j.downloaded_at < threshold &&
          !j.storage_purged_at &&
          j.storage_path
        )
        .slice(0, 20)
        .map(j => ({ id: j.id, storagePath: j.storage_path! }));
    },

    async markStoragePurged(ids) {
      if (ids.length === 0) return;
      const jobs = readJobs();
      const now = new Date().toISOString();
      for (const id of ids) {
        const idx = jobs.findIndex(j => j.id === id);
        if (idx >= 0) {
          jobs[idx]!.storage_purged_at = now;
        }
      }
      writeJobs(jobs);
    },
  };
}
