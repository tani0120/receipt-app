-- ============================================================
-- CSV変換ログテーブル マイグレーション
-- ============================================================
--
-- 【概要】
-- 他社会計ソフト（弥生・freee）→ MF形式のCSV変換履歴を記録。
-- 変換結果のCSVファイル本体はSupabase Storageに保存。
--
-- 【データフロー】
-- スタッフがCSVをアップロード
--   → 変換処理実行
--   → conversion_logs にINSERT + CSVをStorage保存
--   → ダウンロード時に is_downloaded = true に更新
--
-- 準拠:
--   - types.ts（ConversionLog）
--   - supabase_migration_plan.md Phase A-2
-- ============================================================

-- § 1. conversion_logs（CSV変換ログ）
CREATE TABLE IF NOT EXISTS conversion_logs (

  /** PK: 変換ログID */
  id                TEXT PRIMARY KEY,

  /** 変換日時 */
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT now(),

  /** 顧問先名（変換時に指定。表示用） */
  client_name       TEXT NOT NULL,

  /** 変換元ソフト名（例: yayoi, freee） */
  source_software   TEXT NOT NULL,

  /** 変換先ソフト名（例: mf） */
  target_software   TEXT NOT NULL,

  /** 変換結果ファイル名 */
  file_name         TEXT NOT NULL,

  /** ファイルサイズ（バイト） */
  size              INTEGER NOT NULL DEFAULT 0,

  /** CSVファイルパス（Storageパス or ローカルパス） */
  csv_path          TEXT NOT NULL,

  /** ダウンロード済みフラグ */
  is_downloaded     BOOLEAN NOT NULL DEFAULT false
);

-- ============================================================
-- § 2. インデックス
-- ============================================================

-- 最新の変換履歴取得
CREATE INDEX idx_conversion_logs_timestamp
  ON conversion_logs (timestamp DESC);

-- ============================================================
-- § 3. RLS（スタッフのみアクセス可能）
-- ============================================================

ALTER TABLE conversion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_only_conversion_logs" ON conversion_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'staff'
    )
  );

-- ============================================================
-- § 4. コメント
-- ============================================================

COMMENT ON TABLE conversion_logs IS 'CSV変換ログ。弥生・freee→MF形式の変換履歴。CSVファイル本体はStorage';
COMMENT ON COLUMN conversion_logs.csv_path IS 'CSVファイルのパス。現在はローカル（data/conversions/）。Supabase移行後はStorageパス';
