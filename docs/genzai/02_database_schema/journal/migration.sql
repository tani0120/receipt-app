-- ============================================================
-- Phase 5 全テーブルスキーマ定義 DDL（Supabase移行用）
-- ============================================================
-- 作成日: 2026-02-15
-- 最終更新: 2026-03-11（12_full_schema_design_20260311.md準拠）
-- 参照: journal_v2_20260214.md（定義B準拠）、12_full_schema_design_20260311.md
-- 目的: Supabase実装時のマイグレーションスクリプト
-- テーブル数: 18（仕訳系4 + 証票系2 + 取引先系3 + AI/ログ系9）

-- ============================================================
-- 1. ENUM型定義（1つのステータス）
-- ============================================================

CREATE TYPE journal_status AS ENUM (
  'exported'   -- 出力済み（CSV出力完了、編集不可）
);

-- ============================================================
-- 1.5 SEQUENCE定義（接頭辞+連番用）
-- ============================================================

CREATE SEQUENCE document_seq START 1;
CREATE SEQUENCE document_line_seq START 1;
CREATE SEQUENCE journal_seq START 1;
CREATE SEQUENCE journal_entry_seq START 1;
CREATE SEQUENCE export_batch_seq START 1;
CREATE SEQUENCE journal_export_seq START 1;
CREATE SEQUENCE vendor_seq START 1;
CREATE SEQUENCE decision_log_seq START 1;
CREATE SEQUENCE source_snapshot_seq START 1;
CREATE SEQUENCE ground_truth_seq START 1;
CREATE SEQUENCE ocr_run_seq START 1;
CREATE SEQUENCE ai_inference_log_seq START 1;
CREATE SEQUENCE ai_usage_seq START 1;
CREATE SEQUENCE staff_work_log_seq START 1;
CREATE SEQUENCE vendor_prediction_log_seq START 1;

-- ID生成例:
-- 'jrn-' || LPAD(nextval('journal_seq')::text, 8, '0')  → jrn-00000001
-- 'doc-' || LPAD(nextval('document_seq')::text, 8, '0') → doc-00000001

-- ============================================================
-- 2. 証票系テーブル（参照先を先に定義）
-- ============================================================

-- 2.1 documents テーブル（証票）
CREATE TABLE documents (
  id VARCHAR(20) PRIMARY KEY,                     -- 証票ID（doc-00000001形式）
  client_id VARCHAR(20) NOT NULL,                 -- 顧問先ID
  source_type VARCHAR(30) NULL,                   -- 証票種類（receipt, invoice, bank_statement等）
  file_path TEXT NULL,                            -- ファイルパス
  file_hash VARCHAR(64) NULL,                     -- ファイルSHA256ハッシュ（重複検出用）
  ocr_text TEXT NULL,                             -- OCR生テキスト
  document_date DATE NULL,                        -- 証票に記載されている日付
  uploaded_at TIMESTAMP NULL,                     -- アップロード日時
  ocr_completed_at TIMESTAMP NULL,                -- OCR完了日時
  ocr_engine VARCHAR(50) NULL,                    -- OCRエンジン名（google_vision等）
  ocr_version VARCHAR(20) NULL,                   -- OCRバージョン
  ocr_confidence NUMERIC(5,4) NULL,               -- OCR信頼度
  external_id VARCHAR(100) NULL,                  -- 外部ID（STREAMED連携用）
  external_source VARCHAR(50) NULL,               -- 外部ソース名
  processing_time_ms INTEGER NULL,                -- 処理時間（ミリ秒）
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(20) NULL                     -- 作成者
);

-- 2.2 document_lines テーブル（証票行）
CREATE TABLE document_lines (
  id VARCHAR(40) PRIMARY KEY,                     -- 証票行ID（doc-00000001-line-003形式）
  document_id VARCHAR(20) NOT NULL REFERENCES documents(id),
  line_index INTEGER NOT NULL,                    -- 行番号（1から開始）
  raw_text TEXT NULL,                             -- OCR生テキスト（この行のみ）
  normalized_text TEXT NULL,                      -- 正規化テキスト
  keywords TEXT[] DEFAULT '{}',                   -- 抽出キーワード配列
  date DATE NULL,                                 -- この行の日付（通帳の各行の取引日等）
  amount NUMERIC(15,2) NULL,                      -- この行の金額
  description TEXT NULL,                          -- この行の摘要
  date_on_document BOOLEAN NULL,                  -- 日付の項目存在フラグ
  amount_on_document BOOLEAN NULL,                -- 金額の項目存在フラグ
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. 仕訳系テーブル
-- ============================================================

-- 3.1 journals テーブル作成

CREATE TABLE journals (
  -- 基本情報
  id VARCHAR(20) PRIMARY KEY,                    -- 仕訳ID（jrn-00000001形式）
  client_id VARCHAR(20) NOT NULL,                -- 顧問先ID（ABC-00001形式）
  document_id VARCHAR(20) REFERENCES documents(id),  -- 証票ID（旧receipt_id）
  line_id VARCHAR(40) NULL,                      -- 証票行ID（冗長だがクエリ高速化用）
  display_order INTEGER NOT NULL,                 -- 表示順
  voucher_date DATE NOT NULL,                     -- 伝票日（証憑記載の日付=fact）
  description TEXT NOT NULL,                      -- 摘要
  
  -- ステータス管理（出力済みのみ）
  status journal_status NULL,                     -- NULL=未出力、'exported'=出力済
  status_updated_at TIMESTAMP NULL,
  status_updated_by VARCHAR(20) NULL,              -- ステータス更新者（スタッフID）
  -- TODO: usersテーブル定義後に REFERENCES users(id) を追加
  
  -- タイムスタンプ
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- 未読/既読（背景色管理）
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  
  -- labels（22種類、非排他的）
  -- 証憑種類5個、ルール2個、インボイス3個、事故フラグ6個、OCR2個、要対応3個、出力制御1個、その他1個
  labels TEXT[] DEFAULT '{}',
  
  -- クレジットカード払い判定（Gemini層A）
  is_credit_card_payment BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- ルール関連（オプション）
  rule_id VARCHAR(20) NULL,                       -- ルールID
  -- TODO: journal_rulesテーブル定義後に REFERENCES journal_rules(id) を追加
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
  
  -- 作成者・更新者（監査用、2026-03-11追加）
  created_by VARCHAR(20) NULL,                    -- 作成者（スタッフID or 'AI'）
  updated_by VARCHAR(20) NULL,                    -- 更新者
  
  -- AI推定関連（2026-03-11追加）
  ai_completed_at TIMESTAMP NULL,                 -- AI仕訳生成完了日時
  prediction_method VARCHAR(50) NULL,             -- 推定方法（keyword, alias, ai等）
  prediction_score NUMERIC(5,4) NULL,             -- 推定信頼度
  model_version VARCHAR(50) NULL,                 -- 使用モデルバージョン
  
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
-- 3.2 journal_entries テーブル（N対N複合仕訳）
-- ============================================================

CREATE TABLE journal_entries (
  id VARCHAR(30) PRIMARY KEY,                     -- 仕訳明細ID（jrn-00000001-d1形式）
  journal_id VARCHAR(20) NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('debit', 'credit')),
  line_number INTEGER NOT NULL,                   -- 明細行番号（1から開始）
  
  -- 仕訳明細
  account VARCHAR(100) NOT NULL,                  -- 勘定科目
  sub_account VARCHAR(100) NULL,                  -- 補助科目
  amount NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
  tax_category_id VARCHAR(50) NULL,               -- 税区分（概念ID）
  
  -- 項目存在フラグ（2026-03-11追加）
  account_on_document BOOLEAN NULL,               -- 勘定科目の項目存在フラグ
  amount_on_document BOOLEAN NULL,                -- 金額の項目存在フラグ
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- 複合UNIQUE（journal_id, entry_type, line_number）
  UNIQUE(journal_id, entry_type, line_number)
);

-- ============================================================
-- 3.3 export_batches テーブル（CSV出力履歴）
-- ============================================================

CREATE TABLE export_batches (
  id VARCHAR(20) PRIMARY KEY,                     -- バッチID（batch-20260311-01形式）
  client_id VARCHAR(20) NOT NULL,                 -- 顧問先ID
  exported_at TIMESTAMP NOT NULL DEFAULT NOW(),
  exported_by VARCHAR(20) NOT NULL,               -- 出力者（スタッフID）
  -- TODO: usersテーブル定義後に REFERENCES users(id) を追加
  journal_count INTEGER NOT NULL CHECK (journal_count > 0),
  filename TEXT NOT NULL,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3.4 journal_exports テーブル（仕訳とバッチの紐付け）
-- ============================================================

CREATE TABLE journal_exports (
  id VARCHAR(20) PRIMARY KEY,                     -- 紐付けID
  journal_id VARCHAR(20) NOT NULL REFERENCES journals(id),
  export_batch_id VARCHAR(20) NOT NULL REFERENCES export_batches(id),
  exported_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- N対N関係（重複防止）
  UNIQUE(journal_id, export_batch_id)
);



-- ============================================================
-- 4. 取引先系テーブル（2026-03-11追加）
-- ============================================================

-- 4.1 vendors テーブル（取引先マスタ）
CREATE TABLE vendors (
  id VARCHAR(20) PRIMARY KEY,                     -- 取引先ID（vendor-00000001形式）
  name VARCHAR(200) NOT NULL,                     -- 正式名称
  normalized_name VARCHAR(200) NULL,              -- 正規化名称
  invoice_number VARCHAR(14) NULL,                -- インボイス番号（T+13桁）
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4.2 vendor_aliases テーブル（取引先別名）
CREATE TABLE vendor_aliases (
  id SERIAL PRIMARY KEY,
  vendor_id VARCHAR(20) NOT NULL REFERENCES vendors(id),
  alias VARCHAR(200) NOT NULL,                    -- 別名（AMZN, amazon marketplace等）
  source VARCHAR(30) NULL,                        -- 登録元（manual, ocr, ai）
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4.3 vendor_keywords テーブル（取引先キーワード）
CREATE TABLE vendor_keywords (
  id SERIAL PRIMARY KEY,
  vendor_id VARCHAR(20) NOT NULL REFERENCES vendors(id),
  keyword VARCHAR(100) NOT NULL,                  -- キーワード
  frequency INTEGER NOT NULL DEFAULT 1,           -- 出現頻度
  approved_by VARCHAR(20) NULL,                   -- 承認者
  approved_at TIMESTAMP NULL,                     -- 承認日時
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. AI/OCR/学習系テーブル（2026-03-11追加）
-- ============================================================

-- 5.1 decision_logs テーブル（判断ログ）
CREATE TABLE decision_logs (
  id VARCHAR(20) PRIMARY KEY,
  entity_type VARCHAR(30) NOT NULL,               -- 対象種別（document, journal等）
  entity_id VARCHAR(40) NOT NULL,                 -- 対象ID
  decision_type VARCHAR(50) NOT NULL,             -- 判断種別（vendor_detection, account_prediction等）
  decision_method VARCHAR(50) NULL,               -- 判断方法（keyword, alias, ai等）
  decision_score NUMERIC(5,4) NULL,               -- 信頼度
  candidate_values JSONB NULL,                    -- 候補値
  selected_value TEXT NULL,                       -- 選択された値
  input_snapshot TEXT NULL,                       -- 入力テキスト
  model_version VARCHAR(50) NULL,                 -- モデルバージョン
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5.2 source_snapshots テーブル（入力スナップショット）
CREATE TABLE source_snapshots (
  id VARCHAR(20) PRIMARY KEY,
  entity_type VARCHAR(30) NOT NULL,               -- 対象種別
  entity_id VARCHAR(40) NOT NULL,                 -- 対象ID
  raw_text TEXT NULL,                             -- OCR生テキスト
  normalized_text TEXT NULL,                      -- 正規化テキスト
  extracted_fields JSONB NULL,                    -- 抽出されたフィールド
  keywords TEXT[] DEFAULT '{}',                   -- キーワード配列
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5.3 ground_truth テーブル（正解データ）
CREATE TABLE ground_truth (
  id VARCHAR(20) PRIMARY KEY,
  entity_type VARCHAR(30) NOT NULL,               -- 対象種別（journal等）
  entity_id VARCHAR(40) NOT NULL,                 -- 対象ID
  field_name VARCHAR(50) NOT NULL,                -- フィールド名（vendor, account等）
  predicted_value TEXT NULL,                      -- AI予測値
  correct_value TEXT NOT NULL,                    -- スタッフ修正後の正解値
  corrected_by VARCHAR(20) NULL,                  -- 修正者（スタッフID）
  corrected_at TIMESTAMP NULL,                    -- 修正日時
  prediction_confidence NUMERIC(5,4) NULL,        -- 元の推定信頼度
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5.4 processing_batches テーブル（処理バッチ）
CREATE TABLE processing_batches (
  id VARCHAR(30) PRIMARY KEY,                     -- バッチID（batch-20260311-01形式）
  batch_type VARCHAR(30) NOT NULL,                -- バッチ種別（OCR, AI_JOURNAL, KEYWORD_LEARNING等）
  client_id VARCHAR(20) NULL,                     -- 顧問先ID
  started_at TIMESTAMP NULL,                      -- 開始日時
  finished_at TIMESTAMP NULL,                     -- 終了日時
  document_count INTEGER NULL,                    -- 処理証票数
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- 処理状態（pending, running, completed, failed）
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5.5 ocr_runs テーブル（OCR実行ログ）
CREATE TABLE ocr_runs (
  id VARCHAR(20) PRIMARY KEY,
  document_id VARCHAR(20) NOT NULL REFERENCES documents(id),
  batch_id VARCHAR(30) NULL REFERENCES processing_batches(id),
  ocr_engine VARCHAR(50) NULL,                    -- OCRエンジン名
  ocr_version VARCHAR(20) NULL,                   -- OCRバージョン
  processing_time_ms INTEGER NULL,                -- 処理時間（ミリ秒）
  confidence NUMERIC(5,4) NULL,                   -- 信頼度
  raw_text_size INTEGER NULL,                     -- テキストサイズ（バイト）
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5.6 ai_inference_logs テーブル（AI推論ログ）
CREATE TABLE ai_inference_logs (
  id VARCHAR(20) PRIMARY KEY,
  document_id VARCHAR(20) NULL REFERENCES documents(id),
  journal_id VARCHAR(20) NULL REFERENCES journals(id),
  model_name VARCHAR(50) NULL,                    -- モデル名
  model_version VARCHAR(50) NULL,                 -- モデルバージョン
  prompt_hash VARCHAR(64) NULL,                   -- プロンプトハッシュ
  response_time_ms INTEGER NULL,                  -- 応答時間（ミリ秒）
  token_input INTEGER NULL,                       -- 入力トークン数
  token_output INTEGER NULL,                      -- 出力トークン数
  confidence NUMERIC(5,4) NULL,                   -- 信頼度
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5.7 ai_usage テーブル（AIコスト管理）
CREATE TABLE ai_usage (
  id VARCHAR(20) PRIMARY KEY,
  model_name VARCHAR(50) NOT NULL,                -- モデル名
  tokens_input INTEGER NOT NULL DEFAULT 0,        -- 入力トークン数
  tokens_output INTEGER NOT NULL DEFAULT 0,       -- 出力トークン数
  cost_estimate NUMERIC(10,4) NULL,               -- コスト見積もり（円）
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5.8 staff_work_logs テーブル（スタッフ作業ログ）
CREATE TABLE staff_work_logs (
  id VARCHAR(20) PRIMARY KEY,
  staff_id VARCHAR(20) NOT NULL,                  -- スタッフID
  client_id VARCHAR(20) NULL,                     -- 顧問先ID
  document_id VARCHAR(20) NULL,                   -- 証票ID（任意）
  journal_id VARCHAR(20) NULL,                    -- 仕訳ID（任意）
  work_type VARCHAR(30) NOT NULL,                 -- 作業種別（OCR確認, 仕訳修正, 取引先修正, CSV出力確認）
  start_time TIMESTAMP NULL,                      -- 開始時刻
  end_time TIMESTAMP NULL,                        -- 終了時刻
  duration_seconds INTEGER NULL,                  -- 作業時間（秒）
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5.9 vendor_prediction_logs テーブル（取引先推定ログ）
CREATE TABLE vendor_prediction_logs (
  id VARCHAR(20) PRIMARY KEY,
  document_id VARCHAR(20) NULL REFERENCES documents(id),
  line_id VARCHAR(40) NULL,                       -- 証票行ID
  vendor_candidate VARCHAR(200) NULL,             -- 候補取引先名
  method VARCHAR(30) NULL,                        -- 推定方法（T_number, phone, alias, keyword, manual）
  score NUMERIC(5,4) NULL,                        -- スコア
  selected BOOLEAN NOT NULL DEFAULT FALSE,        -- この候補が選択されたか
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. インデックス作成（20個）
-- ============================================================

-- 6.0 既存インデックス（仕訳系）

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

-- 6.10 証票系インデックス（2026-03-11追加）
CREATE INDEX idx_documents_client_id ON documents(client_id);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at);
CREATE INDEX idx_document_lines_document_id ON document_lines(document_id);

-- 6.11 取引先系インデックス
CREATE INDEX idx_vendor_aliases_vendor_id ON vendor_aliases(vendor_id);
CREATE INDEX idx_vendor_keywords_vendor_id ON vendor_keywords(vendor_id);

-- 6.12 AI/ログ系インデックス
CREATE INDEX idx_decision_logs_entity ON decision_logs(entity_type, entity_id);
CREATE INDEX idx_source_snapshots_entity ON source_snapshots(entity_type, entity_id);
CREATE INDEX idx_ground_truth_entity ON ground_truth(entity_type, entity_id);
CREATE INDEX idx_ocr_runs_document_id ON ocr_runs(document_id);
CREATE INDEX idx_ai_inference_logs_journal_id ON ai_inference_logs(journal_id);
CREATE INDEX idx_staff_work_logs_staff_id ON staff_work_logs(staff_id);
CREATE INDEX idx_vendor_prediction_logs_document_id ON vendor_prediction_logs(document_id);

-- ============================================================
-- 7. RLS（Row Level Security）設定
-- ============================================================

-- RLSを有効化
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ground_truth ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_inference_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_prediction_logs ENABLE ROW LEVEL SECURITY;

-- ポリシー例（顧問先IDによるアクセス制限）
CREATE POLICY journals_client_isolation ON journals
  FOR ALL
  USING (client_id = current_setting('app.current_client_id') OR auth.jwt() ->> 'role' = 'admin');

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

CREATE TRIGGER trigger_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. コメント（ドキュメント）
-- ============================================================

COMMENT ON TABLE journals IS 'Phase 5 仕訳テーブル（Streamed準拠、要対応管理）';
COMMENT ON COLUMN journals.status IS 'ステータス: NULL=未出力、exported=出力済';
COMMENT ON COLUMN journals.is_read IS '未読/既読（背景色管理: 未読=黄色、既読=白）';
COMMENT ON COLUMN journals.labels IS '22種類のラベル（要対応3個、出力制御1個、事故フラグ、OCR、証憑種類など）';
COMMENT ON COLUMN journals.export_exclude IS '出力対象外フラグ（TRUE: CSV出力しない。カラム管理。2026-02-20判断でEXPORT_EXCLUDEラベルとの連動を廃止）';
COMMENT ON COLUMN journals.created_by IS '作成者（スタッフID or AI）2026-03-11追加';
COMMENT ON COLUMN journals.prediction_method IS 'AI推定方法（keyword, alias, ai等）2026-03-11追加';
COMMENT ON TABLE documents IS '証票テーブル（2026-03-11追加）';
COMMENT ON TABLE document_lines IS '証票行テーブル（2026-03-11追加）';
COMMENT ON TABLE vendors IS '取引先マスタ（2026-03-11追加）';
COMMENT ON TABLE decision_logs IS '判断ログ（なぜその仕訳になったかを記録）2026-03-11追加';
COMMENT ON TABLE ground_truth IS '正解データ（スタッフ修正→学習データ化）2026-03-11追加';
COMMENT ON TABLE ai_inference_logs IS 'AI推論ログ（モデル名・トークン数・応答時間）2026-03-11追加';
COMMENT ON TABLE ai_usage IS 'AIコスト管理（トークン数・コスト見積もり）2026-03-11追加';
COMMENT ON TABLE staff_work_logs IS 'スタッフ作業ログ（工数管理・AI効果測定）2026-03-11追加';

-- ============================================================
-- 完了
-- ============================================================
