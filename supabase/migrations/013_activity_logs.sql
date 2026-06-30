-- ============================================================
-- 活動ログテーブル マイグレーション
-- ============================================================
--
-- 【概要】
-- スタッフの各ページ滞在時間を記録する。
-- アイドル検出（5分無操作→タイマー停止）で放置時間を除外。
--
-- 【計測対象ページ（TrackablePage）】
-- journal-list, drive-select, output, export, export-history
--
-- 準拠:
--   - activity.types.ts（ActivityLog + TrackablePage）
--   - supabase_migration_plan.md Phase A-2
-- ============================================================

-- § 1. activity_logs（活動ログ）
CREATE TABLE IF NOT EXISTS activity_logs (

  /** PK: 例: act-1714500000000-abc123 */
  id                TEXT PRIMARY KEY,

  /** ログインスタッフID */
  staff_id          TEXT NOT NULL,

  /** 顧問先ID（URLパラメータから取得） */
  client_id         TEXT NOT NULL,

  /** ページ種別 */
  page              TEXT NOT NULL
                    CHECK (page IN (
                      'journal-list',
                      'drive-select',
                      'output',
                      'export',
                      'export-history'
                    )),

  /** 計測開始日時 */
  started_at        TIMESTAMPTZ NOT NULL,

  /** 計測終了日時 */
  ended_at          TIMESTAMPTZ NOT NULL,

  /** アイドル除外後の実稼働ミリ秒 */
  active_ms         INTEGER NOT NULL DEFAULT 0,

  /** アイドル時間（ミリ秒） */
  idle_ms           INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- § 2. インデックス
-- ============================================================

-- スタッフ別集計
CREATE INDEX idx_activity_logs_staff_id
  ON activity_logs (staff_id);

-- 顧問先別集計
CREATE INDEX idx_activity_logs_client_id
  ON activity_logs (client_id);

-- 日付範囲検索（月次レポート等）
CREATE INDEX idx_activity_logs_started_at
  ON activity_logs (started_at DESC);

-- ページ別集計
CREATE INDEX idx_activity_logs_page
  ON activity_logs (page);

-- ============================================================
-- § 3. RLS（スタッフのみアクセス可能）
-- ============================================================

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_only_activity_logs" ON activity_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'staff'
    )
  );

-- ============================================================
-- § 4. コメント
-- ============================================================

COMMENT ON TABLE activity_logs IS 'スタッフのページ別滞在時間ログ。アイドル検出（5分無操作）で放置時間除外';
COMMENT ON COLUMN activity_logs.active_ms IS 'アイドル除外後の実稼働ミリ秒。ダッシュボードの処理時間集計に使用';
COMMENT ON COLUMN activity_logs.page IS 'TrackablePage型: journal-list, drive-select, output, export, export-history';
