-- ============================================================
-- Phase 5 完全スキーマ定義 DDL（Supabase移行用）
-- ============================================================
-- 作成日: 2026-02-15
-- 参照: journal_v2_20260214.md（定義B準拠）
-- 目的: Supabase実装時のマイグレーションスクリプト

-- ============================================================
-- 1. ENUM型定義（1つのステータス）
-- ============================================================

CREATE TYPE journal_status AS ENUM (
  'exported'   -- 出力済み（CSV出力完了、編集不可）
);

-- ============================================================
-- 2. journals テーブル作成
-- ============================================================

CREATE TABLE journals (
  -- 基本情報
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,                       -- 顧問先ID（マルチテナント必須）
  receipt_id UUID REFERENCES receipts(id),       -- 証憑ID
  display_order INTEGER NOT NULL,                 -- 表示順
  transaction_date DATE NOT NULL,                 -- 取引日
  description TEXT NOT NULL,                      -- 摘要
  
  -- ステータス管理（出力済みのみ）
  status journal_status NULL,                     -- NULL=未出力、'exported'=出力済
  status_updated_at TIMESTAMP NULL,
  status_updated_by UUID NULL REFERENCES users(id),  -- ステータス更新者
  
  -- タイムスタンプ
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- 未読/既読（背景色管理）
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  
  -- labels（21種類、非排他的）
  -- 証憑種類5個、ルール2個、インボイス3個、事故フラグ6個、OCR2個、要対応3個、出力制御1個、その他1個
  labels TEXT[] DEFAULT '{}',
  
  -- ルール関連（オプション）
  rule_id UUID NULL REFERENCES journal_rules(id),
  rule_confidence NUMERIC(3,2) NULL CHECK (rule_confidence BETWEEN 0 AND 1),
  
  -- インボイス関連（オプション）
  invoice_status VARCHAR(20) NULL CHECK (invoice_status IN ('qualified', 'not_qualified')),
  invoice_number VARCHAR(14) NULL,               -- T + 13桁
  
  -- メモ機能（help/soudan/kakunin共通）
  memo TEXT NULL,
  memo_author VARCHAR(100) NULL,
  memo_target VARCHAR(100) NULL,
  memo_created_at TIMESTAMP NULL,
  
  -- 出力管理
  exported_at TIMESTAMP NULL,
  exported_by VARCHAR(100) NULL,
  export_exclude BOOLEAN NOT NULL DEFAULT FALSE,
  export_exclude_reason VARCHAR(200) NULL,
  
  -- ゴミ箱（論理削除、30日後物理削除）
  deleted_at TIMESTAMP NULL,
  deleted_by VARCHAR(100) NULL,
  
  -- ============================================================
  -- CHECK制約（4つ）
  -- ============================================================
  
  -- 1. exported同期チェック
  CONSTRAINT check_exported_sync CHECK (
    (status = 'exported' AND exported_at IS NOT NULL)
    OR (status IS NULL AND exported_at IS NULL)
  ),
  
  -- 2. メモ作成者必須
  CONSTRAINT check_memo_author CHECK (
    (memo IS NULL) 
    OR (memo IS NOT NULL AND memo_author IS NOT NULL)
  ),
  
  -- 3. 削除者必須
  CONSTRAINT check_deleted_by CHECK (
    (deleted_at IS NULL) 
    OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
  ),
  
  -- 4. 出力対象外理由必須
  CONSTRAINT check_export_exclude_reason CHECK (
    (export_exclude = FALSE)
    OR (export_exclude = TRUE AND export_exclude_reason IS NOT NULL)
  )
);

-- ============================================================
-- 3. journal_entries テーブル（N対N複合仕訳）
-- ============================================================

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('debit', 'credit')),
  line_number INTEGER NOT NULL,                   -- 明細行番号（1から開始）
  
  -- 仕訳明細
  account VARCHAR(100) NOT NULL,                  -- 勘定科目
  sub_account VARCHAR(100) NULL,                  -- 補助科目
  amount NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
  tax_category VARCHAR(50) NULL,                  -- 税区分
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- 複合UNIQUE（journal_id, entry_type, line_number）
  UNIQUE(journal_id, entry_type, line_number)
);

-- ============================================================
-- 4. export_batches テーブル（CSV出力履歴）
-- ============================================================

CREATE TABLE export_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  exported_at TIMESTAMP NOT NULL DEFAULT NOW(),
  exported_by UUID NOT NULL REFERENCES users(id),
  journal_count INTEGER NOT NULL CHECK (journal_count > 0),
  filename TEXT NOT NULL,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. journal_exports テーブル（仕訳とバッチの紐付け）
-- ============================================================

CREATE TABLE journal_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journals(id),
  export_batch_id UUID NOT NULL REFERENCES export_batches(id),
  exported_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- N対N関係（重複防止）
  UNIQUE(journal_id, export_batch_id)
);

-- ============================================================
-- 6. インデックス作成（7個）
-- ============================================================

-- 6.1 status検索（help/soudan/kakunin一覧）
CREATE INDEX idx_journals_status ON journals(status);

-- 6.2 未読一覧（黄色ハイライト）
CREATE INDEX idx_journals_is_read ON journals(is_read);

-- 6.3 ゴミ箱一覧
CREATE INDEX idx_journals_deleted_at ON journals(deleted_at);

-- 6.4 labels検索（GINインデックス）
CREATE INDEX idx_journals_labels ON journals USING GIN(labels);

-- 6.5 複合インデックス（背景色ロジック高速化）
CREATE INDEX idx_journals_status_read ON journals(status, is_read);

-- 6.6 出力履歴検索
CREATE INDEX idx_journals_exported_at ON journals(exported_at);

-- 6.7 作成日時順ソート
CREATE INDEX idx_journals_created_at ON journals(created_at DESC);

-- 6.8 顧問先ID検索（マルチテナント必須）
CREATE INDEX idx_journals_client_id ON journals(client_id);

-- 6.9 journal_entries の外部キー高速化
CREATE INDEX idx_journal_entries_journal_id ON journal_entries(journal_id);

-- ============================================================
-- 7. RLS（Row Level Security）設定
-- ============================================================

-- RLSを有効化
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_exports ENABLE ROW LEVEL SECURITY;

-- ポリシー例（顧問先IDによるアクセス制限）
CREATE POLICY journals_client_isolation ON journals
  FOR ALL
  USING (client_id = auth.uid()::uuid OR auth.jwt() ->> 'role' = 'admin');

-- ============================================================
-- 8. トリガー（updated_at自動更新）
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_journals_updated_at
  BEFORE UPDATE ON journals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. コメント（ドキュメント）
-- ============================================================

COMMENT ON TABLE journals IS 'Phase 5 仕訳テーブル（Streamed準拠、要対応管理）';
COMMENT ON COLUMN journals.status IS 'ステータス: NULL=未出力、exported=出力済';
COMMENT ON COLUMN journals.is_read IS '未読/既読（背景色管理: 未読=黄色、既読=白）';
COMMENT ON COLUMN journals.labels IS '21種類のラベル（要対応3個、出力制御1個、事故フラグ、OCR、証憑種類など）';
COMMENT ON COLUMN journals.export_exclude IS '出力対象外フラグ（TRUE: CSV出力しない。カラム管理。2026-02-20判断でEXPORT_EXCLUDEラベルとの連動を廃止）';

-- ============================================================
-- 完了
-- ============================================================
