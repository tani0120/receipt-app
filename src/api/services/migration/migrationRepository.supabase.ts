/**
 * migrationRepository.supabase.ts — Supabase版 MigrationRepository（本番用）
 *
 * 責務:
 *   - Supabase migration_jobsテーブルのCRUD
 *   - USE_SUPABASE_MIGRATION=true で有効化
 *
 * 【テーブル定義】
 * CREATE TABLE IF NOT EXISTS migration_jobs (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   job_id TEXT NOT NULL,
 *   client_id TEXT NOT NULL,
 *   drive_file_id TEXT NOT NULL,
 *   doc_status TEXT NOT NULL CHECK (doc_status IN ('target','supporting','excluded')),
 *   migration_status TEXT NOT NULL DEFAULT 'queued' CHECK (migration_status IN ('queued','processing','done','failed')),
 *   retry_count INT NOT NULL DEFAULT 0,
 *   last_error TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW(),
 *   storage_path TEXT,
 *   file_hash TEXT,
 *   downloaded_at TIMESTAMPTZ,
 *   storage_purged_at TIMESTAMPTZ,
 *   UNIQUE(drive_file_id)
 * );
 * CREATE INDEX idx_migration_jobs_status ON migration_jobs (migration_status) WHERE migration_status IN ('queued','processing');
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { MigrationRepository, MigrationJob, DocStatusForMigration } from './migrationRepository';

let _client: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('[supabaseMigrationRepo] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です');
  }
  _client = createClient(url, key);
  return _client;
}

const TABLE = 'migration_jobs';

function toJob(row: Record<string, unknown>): MigrationJob {
  return {
    id: String(row.id),
    jobId: String(row.job_id),
    clientId: String(row.client_id),
    driveFileId: String(row.drive_file_id),
    docStatus: String(row.doc_status) as DocStatusForMigration,
    migrationStatus: String(row.migration_status) as MigrationJob['migrationStatus'],
    retryCount: Number(row.retry_count),
    lastError: row.last_error ? String(row.last_error) : null,
    storagePath: row.storage_path ? String(row.storage_path) : null,
    fileHash: row.file_hash ? String(row.file_hash) : null,
    downloadedAt: row.downloaded_at ? String(row.downloaded_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function createSupabaseMigrationRepository(): MigrationRepository {
  return {
    async enqueueMigrationJobs(jobId, clientId, files) {
      const supabase = getSupabase();
      const rows = files.map(f => ({
        job_id: jobId,
        client_id: clientId,
        drive_file_id: f.fileId,
        doc_status: f.status,
        migration_status: 'queued' as const,
        retry_count: 0,
      }));

      const { data, error } = await supabase
        .from(TABLE)
        .upsert(rows, { onConflict: 'drive_file_id', ignoreDuplicates: true })
        .select('id');

      if (error) throw new Error(`[supabaseMigrationRepo] enqueue失敗: ${error.message}`);
      return data?.length ?? 0;
    },

    async dequeueJobs(limit = 5) {
      const supabase = getSupabase();
      const { data: rows, error: fetchError } = await supabase
        .from(TABLE)
        .select('*')
        .eq('migration_status', 'queued')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (fetchError) throw new Error(`[supabaseMigrationRepo] dequeue失敗: ${fetchError.message}`);
      if (!rows || rows.length === 0) return [];

      const ids = rows.map(r => String(r.id));
      const { error: updateError } = await supabase
        .from(TABLE)
        .update({ migration_status: 'processing', updated_at: new Date().toISOString() })
        .in('id', ids);

      if (updateError) {
        console.error(`[supabaseMigrationRepo] processing遷移失敗:`, updateError.message);
      }

      return rows.map(toJob);
    },

    async markJobDone(id, storagePath, fileHash) {
      const supabase = getSupabase();
      const { error } = await supabase
        .from(TABLE)
        .update({
          migration_status: 'done',
          storage_path: storagePath,
          file_hash: fileHash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw new Error(`[supabaseMigrationRepo] markDone失敗: ${error.message}`);
    },

    async markJobFailed(id, errorMsg, retryCount) {
      const supabase = getSupabase();
      const { error } = await supabase
        .from(TABLE)
        .update({
          migration_status: 'failed',
          last_error: errorMsg,
          retry_count: retryCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw new Error(`[supabaseMigrationRepo] markFailed失敗: ${error.message}`);
    },

    async requeueJob(id, retryCount) {
      const supabase = getSupabase();
      const { error } = await supabase
        .from(TABLE)
        .update({
          migration_status: 'queued',
          retry_count: retryCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw new Error(`[supabaseMigrationRepo] requeue失敗: ${error.message}`);
    },

    async getJobStatus(jobId) {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from(TABLE)
        .select('migration_status')
        .eq('job_id', jobId);

      if (error) throw new Error(`[supabaseMigrationRepo] getJobStatus失敗: ${error.message}`);

      const rows = data ?? [];
      return {
        total: rows.length,
        queued: rows.filter(r => r.migration_status === 'queued').length,
        processing: rows.filter(r => r.migration_status === 'processing').length,
        done: rows.filter(r => r.migration_status === 'done').length,
        failed: rows.filter(r => r.migration_status === 'failed').length,
      };
    },

    async recoverStaleJobs() {
      const supabase = getSupabase();
      const threshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from(TABLE)
        .update({ migration_status: 'queued', updated_at: new Date().toISOString() })
        .eq('migration_status', 'processing')
        .lt('updated_at', threshold)
        .select('id');

      if (error) {
        console.error(`[supabaseMigrationRepo] recoverStaleJobs失敗:`, error.message);
        return 0;
      }

      const recovered = data?.length ?? 0;
      if (recovered > 0) {
        console.log(`[supabaseMigrationRepo] デッドレター復旧: ${recovered}件`);
      }
      return recovered;
    },

    async getExcludedJobs(clientId, all = false, jobId) {
      const supabase = getSupabase();
      let query = supabase
        .from(TABLE)
        .select('*')
        .eq('client_id', clientId)
        .eq('doc_status', 'excluded')
        .eq('migration_status', 'done')
        .is('storage_purged_at', null);

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      if (!all) {
        query = query.is('downloaded_at', null);
      }

      const { data, error } = await query.order('created_at', { ascending: true });
      if (error) throw new Error(`[supabaseMigrationRepo] getExcludedJobs失敗: ${error.message}`);
      return (data ?? []).map(toJob);
    },

    async markDownloaded(ids) {
      if (ids.length === 0) return;
      const supabase = getSupabase();
      const { error } = await supabase
        .from(TABLE)
        .update({ downloaded_at: new Date().toISOString() })
        .in('id', ids);

      if (error) throw new Error(`[supabaseMigrationRepo] markDownloaded失敗: ${error.message}`);
    },

    async getExcludedCount(clientId) {
      const supabase = getSupabase();
      const { count, error } = await supabase
        .from(TABLE)
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('doc_status', 'excluded')
        .eq('migration_status', 'done')
        .is('downloaded_at', null)
        .is('storage_purged_at', null);

      if (error) throw new Error(`[supabaseMigrationRepo] getExcludedCount失敗: ${error.message}`);
      return count ?? 0;
    },

    async getExpiredExcluded() {
      const supabase = getSupabase();
      const threshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from(TABLE)
        .select('id, storage_path')
        .eq('doc_status', 'excluded')
        .eq('migration_status', 'done')
        .not('downloaded_at', 'is', null)
        .lt('downloaded_at', threshold)
        .is('storage_purged_at', null)
        .limit(20);

      if (error) throw new Error(`[supabaseMigrationRepo] getExpiredExcluded失敗: ${error.message}`);
      return (data ?? []).map(r => ({
        id: String(r.id),
        storagePath: String(r.storage_path),
      }));
    },

    async markStoragePurged(ids) {
      if (ids.length === 0) return;
      const supabase = getSupabase();
      const { error } = await supabase
        .from(TABLE)
        .update({ storage_purged_at: new Date().toISOString() })
        .in('id', ids);

      if (error) throw new Error(`[supabaseMigrationRepo] markStoragePurged失敗: ${error.message}`);
    },

    async getExcludedHistory(clientId) {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('client_id', clientId)
        .eq('doc_status', 'excluded')
        .eq('migration_status', 'done')
        .is('storage_purged_at', null)
        .order('created_at', { ascending: true });

      if (error) throw new Error(`[supabaseMigrationRepo] getExcludedHistory失敗: ${error.message}`);

      const rows = data ?? [];
      const grouped = new Map<string, typeof rows>();
      for (const r of rows) {
        const arr = grouped.get(String(r.job_id)) || [];
        arr.push(r);
        grouped.set(String(r.job_id), arr);
      }

      const dateCount = new Map<string, number>();
      const result: Array<{
        jobId: string; clientId: string; excludedCount: number;
        fileName: string; displayDate: string; createdAt: string; downloadedAt: string | null;
      }> = [];

      for (const [jobId, grp] of grouped) {
        const first = grp[0]!;
        const dt = new Date(String(first.created_at));
        const dateStr = dt.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = dt.toISOString().slice(11, 19).replace(/:/g, '');
        const dateKey = `${clientId}_${dateStr}`;
        const count = dateCount.get(dateKey) || 0;
        dateCount.set(dateKey, count + 1);

        const fileName = count === 0
          ? `${clientId}_仕訳外ダウンロード_${dateStr}`
          : `${clientId}_仕訳外ダウンロード_${dateStr}_${timeStr}`;

        const allDownloaded = grp.every(r => r.downloaded_at);
        const pad = (n: number) => String(n).padStart(2, '0');
        const displayDate = `${dt.getFullYear()}/${pad(dt.getMonth() + 1)}/${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;

        result.push({
          jobId,
          clientId,
          excludedCount: grp.length,
          fileName,
          displayDate,
          createdAt: String(first.created_at),
          downloadedAt: allDownloaded ? String(grp[0]!.downloaded_at) : null,
        });
      }

      return result;
    },

    async getMigrationJobs(clientId) {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from(TABLE)
        .select('job_id, client_id, doc_status, migration_status, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`[supabaseMigrationRepo] getMigrationJobs失敗: ${error.message}`);

      const rows = data ?? [];
      // jobId単位でグルーピング
      const grouped = new Map<string, typeof rows>();
      for (const r of rows) {
        const arr = grouped.get(String(r.job_id)) || [];
        arr.push(r);
        grouped.set(String(r.job_id), arr);
      }

      const result: Array<{
        jobId: string;
        clientId: string;
        createdAt: string;
        total: number;
        done: number;
        failed: number;
        excluded: number;
      }> = [];

      for (const [jobId, grp] of grouped) {
        const first = grp[0]!;
        result.push({
          jobId,
          clientId,
          createdAt: String(first.created_at),
          total: grp.length,
          done: grp.filter(r => r.migration_status === 'done').length,
          failed: grp.filter(r => r.migration_status === 'failed').length,
          excluded: grp.filter(r => r.doc_status === 'excluded').length,
        });
      }

      return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  };
}
