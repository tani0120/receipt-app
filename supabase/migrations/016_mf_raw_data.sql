-- ============================================================
-- MFインポート生データテーブル マイグレーション
-- ============================================================
--
-- 【概要】
-- MFクラウド会計APIから取得した生データを永続化する。
-- 次回インポート時の差分検知ベースデータとして使用。
--
-- 【データ構造（MfRawDataEnvelope）】
-- パターン識別子（例: 'taxes-proportional', 'accounts-corp-proportional'）
-- ごとに1件のエンベロープを保存。内容はMF APIレスポンス全体。
--
-- 【主キー設計】
-- pattern をPKとする（1パターン1レコード）。
-- 同じパターンの再インポート時はUPSERT。
--
-- 準拠:
--   - types.ts（MfRawDataEnvelope<T>）
--   - supabase_migration_plan.md Phase A-2
-- ============================================================

-- § 1. mf_raw_data（MFインポート生データ）
CREATE TABLE IF NOT EXISTS mf_raw_data (

  /** PK: パターン識別子（例: taxes-proportional） */
  pattern           TEXT PRIMARY KEY,

  /** 顧問先ID */
  client_id         TEXT NOT NULL,

  /** 顧問先名（表示用） */
  client_name       TEXT NOT NULL DEFAULT '',

  /** インポート日時 */
  imported_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  /** 件数 */
  item_count        INTEGER NOT NULL DEFAULT 0,

  /** MF生レスポンス（JSONB配列） */
  items             JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- ============================================================
-- § 2. インデックス
-- ============================================================

-- 顧問先別の生データ一覧取得
CREATE INDEX idx_mf_raw_data_client_id
  ON mf_raw_data (client_id);

-- ============================================================
-- § 3. RLS（スタッフのみアクセス可能）
-- ============================================================

ALTER TABLE mf_raw_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_only_mf_raw_data" ON mf_raw_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'staff'
    )
  );

-- ============================================================
-- § 4. コメント
-- ============================================================

COMMENT ON TABLE mf_raw_data IS 'MFクラウド会計APIの生レスポンス。パターン別に1レコード。次回インポートの差分検知ベース';
COMMENT ON COLUMN mf_raw_data.pattern IS 'パターン識別子。例: taxes-proportional, accounts-corp-proportional';
COMMENT ON COLUMN mf_raw_data.items IS 'MF APIレスポンスの配列（JSONB）。型はパターンにより異なる';
