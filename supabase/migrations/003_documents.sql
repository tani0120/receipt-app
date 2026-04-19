-- ============================================================
-- 資料テーブル マイグレーション（DL-039: ゲスト認証・Drive権限付与設計）
-- ============================================================
--
-- 【概要】
-- Drive共有フォルダ/PCアップロードから取り込んだ資料を管理する。
-- 資料選別画面で人間が仕訳対象/対象外を判定し、
-- 仕訳対象の資料のみがclassifyパイプラインに進む。
--
-- 【データフロー】
-- 取り込み（バッチ: 1時間に1回）→ status='pending'
-- → 資料選別（人間チェック）→ status='target' or 'excluded'
-- → classify（Gemini AI分類）→ 仕訳一覧へ
--
-- 準拠: pipeline_design_master.md DL-039
-- ============================================================

-- § 1. documents（資料マスタ）
CREATE TABLE IF NOT EXISTS documents (
  id              TEXT PRIMARY KEY,                    -- UUID文字列
  client_id       TEXT NOT NULL
                  REFERENCES clients(client_id) ON DELETE CASCADE,
  source          TEXT NOT NULL
                  CHECK (source IN ('drive', 'upload')),
  file_name       TEXT NOT NULL,
  file_type       TEXT NOT NULL,                       -- MIMEタイプ
  file_size       INTEGER NOT NULL,                    -- バイト
  file_hash       TEXT,                                -- SHA-256（重複検知用）
  drive_file_id   TEXT,                                -- Drive fileId（source='drive'時）
  thumbnail_url   TEXT,                                -- サムネイルURL
  preview_url     TEXT,                                -- プレビュー用URL
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'target', 'supporting', 'excluded')),
  received_at     TIMESTAMPTZ NOT NULL,                -- 取得日時（バッチ取り込み時）
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- インデックス: 顧問先単位の一覧取得用
CREATE INDEX idx_documents_client_id ON documents (client_id);
-- インデックス: ステータス絞り込み用（未選別の一覧取得）
CREATE INDEX idx_documents_client_status ON documents (client_id, status);
-- インデックス: Drive重複チェック用（同じDriveファイルを二度取り込まない）
CREATE UNIQUE INDEX idx_documents_drive_file_id ON documents (drive_file_id)
  WHERE drive_file_id IS NOT NULL;
-- インデックス: ハッシュ重複チェック用
CREATE INDEX idx_documents_file_hash ON documents (client_id, file_hash)
  WHERE file_hash IS NOT NULL;

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- スタッフは全顧問先の資料にアクセス可能
CREATE POLICY "staff_documents" ON documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role = 'staff')
  );

-- 顧問先ユーザーは自分の資料のみ参照可能
CREATE POLICY "client_user_own_documents" ON documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM client_users cu WHERE cu.client_id = documents.client_id AND cu.user_id = auth.uid())
  );

-- Realtimeは不要（バッチ取り込みのため即時反映不要）
