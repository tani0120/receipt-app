-- ============================================================
-- 根拠資料メタデータテーブル マイグレーション
-- ============================================================
--
-- 【概要】
-- 確定送信時に保存される根拠資料（supporting）のメタデータ。
-- 仕訳に紐づく証憑を自由キーワードで検索するために使用。
--
-- 【データフロー】
-- 確定送信（Drive選別確定）
--   → supporting資料のメタを supporting_meta にINSERT
--   → search_text にファイル名・取引先・摘要等を連結して保存
--   → 仕訳詳細画面で「関連証憑」をキーワード検索
--
-- 準拠:
--   - types.ts（SupportingMeta）
--   - supabase_migration_plan.md Phase A-2
-- ============================================================

-- § 0. 必要な拡張の有効化
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- § 1. supporting_meta（根拠資料メタデータ）
CREATE TABLE IF NOT EXISTS supporting_meta (

  /** PK: ドキュメントID等 */
  id                TEXT PRIMARY KEY,

  /** 顧問先ID */
  client_id         TEXT NOT NULL
                    REFERENCES clients(client_id) ON DELETE CASCADE,

  /** ファイル名 */
  file_name         TEXT NOT NULL,

  /** プレビューURL（Storage経由） */
  preview_url       TEXT NOT NULL DEFAULT '',

  /** 証憑の日付（AIが読み取った値。NULL=不明） */
  date              DATE,

  /** 金額（AIが読み取った値。NULL=不明） */
  amount            NUMERIC,

  /** 取引先名（AIが読み取った値。NULL=不明） */
  vendor            TEXT,

  /** 摘要（AIが読み取った値。NULL=不明） */
  description       TEXT,

  /** 証票種別（SourceType相当） */
  source_type       TEXT,

  /** 検索用テキスト（ファイル名+取引先+摘要等を連結。tsvectorでFTS可能） */
  search_text       TEXT NOT NULL DEFAULT '',

  /** 保存日時 */
  saved_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- § 2. インデックス
-- ============================================================

-- 顧問先別取得
CREATE INDEX idx_supporting_meta_client_id
  ON supporting_meta (client_id);

-- 全文検索（search_textのtrigram検索。pg_trgm拡張が必要）
-- GINインデックスで LIKE '%keyword%' を高速化
CREATE INDEX idx_supporting_meta_search_text
  ON supporting_meta USING gin (search_text gin_trgm_ops);

-- 日付範囲検索
CREATE INDEX idx_supporting_meta_date
  ON supporting_meta (date)
  WHERE date IS NOT NULL;

-- ============================================================
-- § 3. RLS
-- ============================================================

ALTER TABLE supporting_meta ENABLE ROW LEVEL SECURITY;

-- スタッフは全件アクセス可能
CREATE POLICY "staff_supporting_meta" ON supporting_meta
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'staff'
    )
  );

-- 顧問先ユーザーは自分の根拠資料のみ参照可能
CREATE POLICY "client_user_own_supporting_meta" ON supporting_meta
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_users cu
      WHERE cu.client_id = supporting_meta.client_id AND cu.user_id = auth.uid()
    )
  );

-- ============================================================
-- § 4. コメント
-- ============================================================

COMMENT ON TABLE supporting_meta IS '根拠資料メタデータ。確定送信時に保存。仕訳詳細画面で関連証憑をキーワード検索';
COMMENT ON COLUMN supporting_meta.search_text IS '検索用テキスト。ファイル名+取引先+摘要等を連結。pg_trgmのGINインデックスでLIKE検索高速化';
