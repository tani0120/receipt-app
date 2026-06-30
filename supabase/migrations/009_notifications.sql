-- ============================================================
-- 通知テーブル マイグレーション
-- ============================================================
--
-- 【概要】
-- バックグラウンド処理の完了/失敗通知を永続化する。
-- 現在はメモリ管理（useNotificationCenter.ts）で、
-- ページリロードで消える。DB永続化で解決する。
--
-- 【データフロー】
-- バックグラウンド処理完了 → notifications INSERT
--   → Supabase Realtime で他タブにpush通知（将来）
--   → ナビバー🔔アイコン + 通知センタードロワーに表示
--   → スタッフが既読にする → read_by配列に追加
--
-- 【readByの設計判断】
-- TEXT[]配列を採用。理由:
--   - スタッフ数は少ない（7名程度）
--   - 既読操作の監査証跡（誰がいつ既読にしたか）は不要
--   - joinテーブルにするほどの規模ではない
--
-- 準拠:
--   - notification.types.ts（AppNotification + NotificationType）
--   - supabase_migration_plan.md Phase A-2 ②
-- ============================================================

-- § 1. notifications（アプリ通知）
CREATE TABLE IF NOT EXISTS notifications (

  /** PK: UUID */
  id                TEXT PRIMARY KEY,

  /** 通知種別（5値） */
  type              TEXT NOT NULL
                    CHECK (type IN (
                      'migration_complete',  -- 移行完了
                      'migration_failed',    -- 移行失敗
                      'batch_complete',      -- バッチ処理完了
                      'error',               -- エラー通知
                      'mention'              -- @メンション通知
                    )),

  /** 通知タイトル（例: 「TST-00011 移行完了」） */
  title             TEXT NOT NULL,

  /** 通知本文（例: 「5件移行完了。1件失敗。」） */
  body              TEXT NOT NULL DEFAULT '',

  /** 既読スタッフIDリスト（スタッフごとの既読管理。TEXT[]配列） */
  read_by           TEXT[] NOT NULL DEFAULT '{}',

  /** 関連する顧問先ID（任意） */
  client_id         TEXT
                    REFERENCES clients(client_id) ON DELETE SET NULL,

  /** 関連するジョブID（任意。移行ジョブ通知の場合） */
  job_id            TEXT,

  /** アクション（任意。JSONB。例: {label: '仕訳外ZIP DL', url: '/api/drive/download-excluded/TST-00011'}） */
  action            JSONB,

  /** 通知の宛先スタッフUUID（メンション等、特定ユーザー宛。NULL=全体通知） */
  target_staff_id   TEXT,

  /** 作成日時 */
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- § 2. インデックス
-- ============================================================

-- 新着通知の取得（作成日時降順）
CREATE INDEX idx_notifications_created_at
  ON notifications (created_at DESC);

-- 顧問先に紐づく通知の取得
CREATE INDEX idx_notifications_client_id
  ON notifications (client_id)
  WHERE client_id IS NOT NULL;

-- 特定スタッフ宛通知の取得
CREATE INDEX idx_notifications_target_staff
  ON notifications (target_staff_id)
  WHERE target_staff_id IS NOT NULL;

-- 未読チェック（read_by配列にスタッフIDが含まれていない通知）
-- GINインデックスで @> 演算子を高速化
CREATE INDEX idx_notifications_read_by
  ON notifications USING gin (read_by);

-- ============================================================
-- § 3. RLS
-- ============================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- スタッフは全通知にアクセス可能
CREATE POLICY "staff_notifications" ON notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'staff'
    )
  );

-- 顧問先ユーザーは自分宛の通知のみ参照可能
CREATE POLICY "client_user_own_notifications" ON notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_users cu
      WHERE cu.client_id = notifications.client_id AND cu.user_id = auth.uid()
    )
  );

-- ============================================================
-- § 4. コメント
-- ============================================================

COMMENT ON TABLE notifications IS 'アプリ通知。ナビバー🔔+通知センタードロワーに表示。現在メモリ管理→DB永続化';
COMMENT ON COLUMN notifications.read_by IS 'スタッフIDのTEXT配列。既読にしたスタッフのIDを追加。@>演算子で未読チェック';
COMMENT ON COLUMN notifications.action IS 'JSONB。{label: string, url: string}構造。通知に紐づくアクションボタン';
