-- ============================================================
-- migration_jobs テーブル マイグレーション
-- ============================================================
--
-- 【用途】
-- Drive→Supabase移行ジョブのステート管理
-- 1回の選別確定 = 1 job_id。各ファイルが1行。
--
-- 【ステート遷移】
-- DocStatus（人間が設定）:        pending → target / supporting / excluded
-- migration_status（システム管理）: queued → processing → done / failed
--
-- 設計元: 24_upload_drive_integration.md セクション10-6, 15
-- ============================================================

CREATE TABLE IF NOT EXISTS migration_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            TEXT NOT NULL,
  client_id         TEXT NOT NULL,
  drive_file_id     TEXT NOT NULL,
  doc_status        TEXT NOT NULL
                    CHECK (doc_status IN ('target', 'supporting', 'excluded')),
  migration_status  TEXT NOT NULL DEFAULT 'queued'
                    CHECK (migration_status IN ('queued', 'processing', 'done', 'failed')),
  retry_count       INTEGER NOT NULL DEFAULT 0,
  last_error        TEXT,
  -- Phase E追加カラム
  downloaded_at     TIMESTAMPTZ,
  storage_path      TEXT,
  file_hash         TEXT,
  storage_purged_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス: ワーカーがqueued/processingを取得する用
CREATE INDEX idx_migration_jobs_status
  ON migration_jobs (migration_status)
  WHERE migration_status IN ('queued', 'processing');

-- 冪等性: 同一Driveファイルの二重登録防止
CREATE UNIQUE INDEX idx_migration_jobs_drive_file
  ON migration_jobs (drive_file_id);

ALTER TABLE migration_jobs ENABLE ROW LEVEL SECURITY;

-- staffのみフルアクセス
CREATE POLICY "staff_migration_jobs" ON migration_jobs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role = 'staff')
  );
