-- ============================================================
-- 仕訳テーブル マイグレーション
-- ============================================================
--
-- 【概要】
-- AI仕訳（ai_pipeline / manual / legacy）と
-- 確定仕訳（mf_import / system）を単一テーブルに統合する。
--
-- 【設計判断の経緯（2026-07-01 A-1.5 で確定）】
--
--   判断を確定させた3つの事実:
--     1. アプリ層が既に1テーブルとして扱っている
--        journalListService.ts L424-441:
--        通常仕訳とconfirmedを同一JournalListRow[]配列にpushして
--        ソート・検索・集計を実行。isMfJournal()（=source列判定）で分岐
--     2. 型は完全に同一
--        JournalListRow = Journal（型エイリアス）。判別はsource列のみ
--     3. 物理/ソフト削除の違いはJSON実装制約であり、DB設計制約ではない
--        DB移行後は DELETE FROM / UPDATE SET deleted_at = now() の両方が選択可能
--
--   Repository Interfaceは統合しない:
--     JournalRepository（7メソッド）→ WHERE source IN ('ai_pipeline','manual','legacy')
--     ConfirmedJournalRepository（10メソッド）→ WHERE source IN ('mf_import','system')
--     mock層は変更ゼロ。Phase 3.7の安定性に影響なし。
--
-- 【カラム設計判断（2026-07-01 依存グラフ分析で全件確定）】
--
--   J-1: debit_entries / credit_entries → JSONB列
--     根拠: 実データの95%以上が1行。クエリは全てアプリ層で配列操作。
--           DBレベルの科目別集計SQLは不要
--   J-2: labels → TEXT[]配列
--     根拠: labels.includes()（含有チェック）のみ。@>演算子+GINで高速化
--   J-3: staff_notes → JSONB列
--     根拠: アプリ層で構造全体を読む。DBレベルの検索なし
--   J-4: mf_raw → JSONB列
--     根拠: MF API全フィールド保持用
--   J-5: document_id FK → documents(id)参照
--     根拠: schema.sqlのreceiptsはアプリ未使用（grep 0件）。廃止
--   J-6: journal_id → TEXT維持（jrn_XXXXXXXX形式）
--     根拠: プレフィックスで可読性高い。UUIDにする利点なし
--
-- 準拠:
--   - journal.type.ts（統一仕訳型定義）
--   - domain-journal.ts（JournalEntryLine）
--   - 60_journal_domain_model.md
--   - supabase_migration_plan.md Phase A-2
--
-- データフロー:
--   AI経路: パイプライン → source='ai_pipeline' → 仕訳一覧 → 編集 → CSV出力
--   手動経路: スタッフ手動作成 → source='manual'
--   MF CSV取込: CSVインポート → source='mf_import' → 科目確定照合
--   MF MCP取込: MF API取得 → source='system' → 科目確定照合
--   旧データ: パイプライン実装前 → source='legacy'
-- ============================================================

-- § 1. journals（仕訳マスタ）
CREATE TABLE IF NOT EXISTS journals (

  -- ── 基本情報 ──

  /** PK: jrn_XXXXXXXX形式（TEXT。UUID移行しない） */
  journal_id        TEXT PRIMARY KEY,
  /** 顧問先ID（FK: clients.client_id） */
  client_id         TEXT NOT NULL
                    REFERENCES clients(client_id) ON DELETE CASCADE,

  -- ── データ経路（パーティション列）──

  /** 5値。NOT NULL。source列でJournalRepo/ConfirmedJournalRepoを分離 */
  source            TEXT NOT NULL
                    CHECK (source IN (
                      'ai_pipeline',  -- AI生成
                      'manual',       -- 手動作成
                      'legacy',       -- 旧データ
                      'mf_import',    -- MF CSV取込
                      'system'        -- MF MCP取込
                    )),

  -- ── 表示・日付 ──

  /** 表示順（AI仕訳専用。MF取込仕訳はDEFAULT 0） */
  display_order     INTEGER NOT NULL DEFAULT 0,
  /** 取引日（YYYY-MM-DD）。証憑から読み取れない場合NULL */
  voucher_date      TEXT,
  /** 日付の項目存在フラグ */
  date_on_document  BOOLEAN NOT NULL DEFAULT true,
  /** 摘要（空文字許容） */
  description       TEXT NOT NULL DEFAULT '',
  /** @deprecated 旧証票意味（後方互換用） */
  voucher_type      TEXT,

  -- ── パイプライン3フィールド（AI仕訳専用。MF取込仕訳はNULL）──

  /** 証票種類（12種） */
  source_type       TEXT
                    CHECK (source_type IS NULL OR source_type IN (
                      'receipt', 'invoice_received', 'tax_payment',
                      'journal_voucher', 'bank_statement', 'credit_card',
                      'cash_ledger', 'invoice_issued', 'receipt_issued',
                      'non_journal', 'supplementary_doc', 'other'
                    )),
  /** 仕訳方向（4種） */
  direction         TEXT
                    CHECK (direction IS NULL OR direction IN (
                      'expense', 'income', 'transfer', 'mixed'
                    )),
  /** 証票業種（66種。CHECK省略: 値が多すぎるため） */
  vendor_vector     TEXT,

  -- ── 取引先特定 ──

  /** 取引先ID（vendors_global/client の vendor_id） */
  vendor_id         TEXT,
  /** 取引先名（表示用） */
  vendor_name       TEXT,

  -- ── 照合キー ──

  /** normalizeVendorName(description)の出力。科目確定Step 2で使用 */
  match_key         TEXT,

  -- ── 証票紐付け ──

  /** 証票ID（FK: documents.id）。MF取込仕訳はNULL */
  document_id       TEXT
                    REFERENCES documents(id) ON DELETE SET NULL,
  /** 証票行ID（クエリ高速化用） */
  line_id           TEXT,

  -- ── N対N複合仕訳（JSONB列。J-1で確定）──

  /** 借方明細（JournalEntryLine[]のJSON配列） */
  debit_entries     JSONB NOT NULL DEFAULT '[]'::jsonb,
  /** 貸方明細（JournalEntryLine[]のJSON配列） */
  credit_entries    JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- ── ステータス・ワークフロー ──

  /** NULL=未出力, 'exported'=出力済み, 'historical'=過去仕訳 */
  status            TEXT
                    CHECK (status IS NULL OR status IN ('exported', 'historical')),
  /** 既読フラグ */
  is_read           BOOLEAN NOT NULL DEFAULT false,
  /** 既読操作者（スタッフID） */
  read_by           TEXT,
  /** 既読日時 */
  read_at           TIMESTAMPTZ,
  /** ゴミ箱日時（NULL=有効）。ソフトデリート */
  deleted_at        TIMESTAMPTZ,
  /** 削除操作者（スタッフID） */
  deleted_by        TEXT,

  -- ── ラベル（TEXT[]配列。J-2で確定）──

  /** ラベル配列（22種+導出ラベル） */
  labels            TEXT[] NOT NULL DEFAULT '{}',
  /** 警告確認済みタイプ（別テーブルjournal_warning_dismissalsにも正規化） */
  warning_dismissals TEXT[] NOT NULL DEFAULT '{}',
  -- warning_details は導出値（JSON保存除外済み）。DBにカラム不要（J-7）

  -- ── 出力・MF送信 ──

  /** 出力バッチID（CSVダウンロード時に設定） */
  export_batch_id   TEXT,
  /** クレジットカード払い判定 */
  is_credit_card_payment BOOLEAN NOT NULL DEFAULT false,

  -- ── ルール関連 ──

  /** 学習ルールID */
  rule_id           TEXT,

  -- ── インボイス関連 ──

  /** インボイスステータス */
  invoice_status    TEXT
                    CHECK (invoice_status IS NULL OR invoice_status IN (
                      'qualified', 'not_qualified'
                    )),
  /** インボイス番号（T + 13桁） */
  invoice_number    TEXT,

  -- ── メモ関連（証票メモ: 顧問先が証票に記載したメモ）──

  /** メモ内容 */
  memo              TEXT,
  /** メモ作成者 */
  memo_author       TEXT,
  /** メモ宛先 */
  memo_target       TEXT,
  /** メモ作成日時 */
  memo_created_at   TIMESTAMPTZ,

  -- ── スタッフノート（JSONB列。J-3で確定）──

  /** 4カテゴリの対応情報（NEED_DOCUMENT/NEED_INFO/REMINDER/NEED_CONSULT） */
  staff_notes       JSONB,
  /** 担当者名 */
  staff_notes_author TEXT,

  -- ── MF送信結果（MCP経由送信後に紐付け）──

  /** MF内部ID（Base64エンコード文字列） */
  mf_journal_id     TEXT,
  /** MF取引No（自動採番） */
  mf_journal_number INTEGER,
  /** MF送信日時 */
  mf_sent_at        TIMESTAMPTZ,

  -- ── 出力関連（監査）──

  /** CSV出力日時 */
  exported_at       TIMESTAMPTZ,
  /** CSV出力者（スタッフID） */
  exported_by       TEXT,

  -- ── 監査用 ──

  /** 作成日時（＝取込日） */
  created_at        TIMESTAMPTZ DEFAULT now(),
  /** 更新日時 */
  updated_at        TIMESTAMPTZ DEFAULT now(),
  /** 作成者（スタッフID or 'AI'） */
  created_by        TEXT,
  /** 更新者 */
  updated_by        TEXT,

  -- ── AI推定関連 ──

  /** AI仕訳生成完了日時 */
  ai_completed_at   TIMESTAMPTZ,
  /** 科目確定方法（8値） */
  determination_method TEXT
                    CHECK (determination_method IS NULL OR determination_method IN (
                      't_number',        -- T番号一致（第1層）
                      'match_key',       -- 照合キー一致（第2層）
                      'learning_rule',   -- 学習ルール（第3層）
                      'industry_vector', -- 業種辞書（第4層）
                      'ai_fallback',     -- AI推定（第5層）
                      'manual',          -- 手動確定
                      'imported',        -- 会計ソフト取込
                      'legacy'           -- 旧データ
                    )),
  /** 推定信頼度（0.0〜1.0） */
  prediction_score  NUMERIC(4,3),
  /** 使用モデルバージョン */
  model_version     TEXT,

  -- ── MF専用メタデータ（AI仕訳ではNULL固定）──

  /** MF仕訳タイプ（簡単入力 / 振替伝票 等） */
  mf_journal_type   TEXT,
  /** 決算整理仕訳フラグ */
  is_closing_entry  BOOLEAN,
  /** タグ */
  tags              TEXT,
  /** MF取引No（CSV元行番号。重複排除に使用） */
  mf_transaction_no INTEGER,
  /** インポートバッチID（どのCSVインポートで入ったか） */
  import_batch_id   TEXT,
  /** インポート日時 */
  imported_at       TIMESTAMPTZ,
  /** MF API生レスポンス（JSONB列。J-4で確定） */
  mf_raw            JSONB,
  /** MF側削除検出日時 */
  mf_deleted_detected_at TIMESTAMPTZ
);

-- ============================================================
-- § 2. インデックス（J-8: クエリパターンから設計）
-- ============================================================

-- 顧問先単位の一覧取得（最も頻繁なクエリ）
CREATE INDEX idx_journals_client_id
  ON journals (client_id);

-- source列でのパーティション（JournalRepo / ConfirmedJournalRepo の分離）
CREATE INDEX idx_journals_client_source
  ON journals (client_id, source);

-- 取引日ソート（仕訳一覧のデフォルトソート）
CREATE INDEX idx_journals_client_voucher_date
  ON journals (client_id, voucher_date);

-- 照合キー検索（科目確定Step 2: 過去仕訳照合）
CREATE INDEX idx_journals_match_key
  ON journals (client_id, match_key)
  WHERE match_key IS NOT NULL;

-- インポートバッチ単位の操作（バッチ削除・バッチ取得）
CREATE INDEX idx_journals_import_batch_id
  ON journals (import_batch_id)
  WHERE import_batch_id IS NOT NULL;

-- ステータスフィルタ（未出力/出力済み/過去仕訳の絞り込み）
CREATE INDEX idx_journals_client_status
  ON journals (client_id, status);

-- ゴミ箱フィルタ（ソフトデリート済み仕訳の取得）
CREATE INDEX idx_journals_deleted_at
  ON journals (client_id)
  WHERE deleted_at IS NOT NULL;

-- ラベル含有チェック（@>演算子。EXPORT_EXCLUDE等の絞り込み）
CREATE INDEX idx_journals_labels
  ON journals USING gin (labels);

-- 証票紐付け（document_id → journals の逆引き）
CREATE INDEX idx_journals_document_id
  ON journals (document_id)
  WHERE document_id IS NOT NULL;

-- MF取引No重複排除（同じCSVの二重インポート防止）
CREATE UNIQUE INDEX idx_journals_mf_dedup
  ON journals (client_id, import_batch_id, mf_transaction_no)
  WHERE import_batch_id IS NOT NULL AND mf_transaction_no IS NOT NULL;

-- ============================================================
-- § 3. RLS（J-9: 既存テーブルと同じパターン）
-- ============================================================

ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

-- スタッフは全顧問先の仕訳にアクセス可能
CREATE POLICY "staff_journals" ON journals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'staff'
    )
  );

-- 顧問先ユーザーは自分の仕訳のみ参照可能（読み取り専用）
CREATE POLICY "client_user_own_journals" ON journals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_users cu
      WHERE cu.client_id = journals.client_id AND cu.user_id = auth.uid()
    )
  );

-- ============================================================
-- § 4. updated_at 自動更新トリガー
-- ============================================================

CREATE OR REPLACE FUNCTION update_journals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journals_updated_at
  BEFORE UPDATE ON journals
  FOR EACH ROW
  EXECUTE FUNCTION update_journals_updated_at();

-- ============================================================
-- § 5. コメント（テーブル・カラム）
-- ============================================================

COMMENT ON TABLE journals IS '仕訳マスタ（AI仕訳+確定仕訳を統合。source列でパーティション）';
COMMENT ON COLUMN journals.source IS 'データ経路。JournalRepoはai_pipeline/manual/legacy、ConfirmedJournalRepoはmf_import/systemを参照';
COMMENT ON COLUMN journals.debit_entries IS 'JournalEntryLine[]のJSONB配列。10フィールド: entryId, account, account_on_document, sub_account, department, amount, amount_on_document, tax_category_id, vendor_name, invoice, tax_amount';
COMMENT ON COLUMN journals.credit_entries IS 'debit_entriesと同構造';
COMMENT ON COLUMN journals.labels IS 'JournalLabel型のTEXT配列。GINインデックスで@>演算子による含有チェック高速化';
COMMENT ON COLUMN journals.staff_notes IS '4カテゴリ対応情報のJSONB。構造: {NEED_DOCUMENT: {enabled, text, ...}, NEED_INFO: {...}, REMINDER: {...}, NEED_CONSULT: {...}}';
COMMENT ON COLUMN journals.mf_raw IS 'MF API生レスポンスのJSONB。MfMcpJournal型をまるごと格納';
COMMENT ON COLUMN journals.match_key IS 'normalizeVendorName(description)の出力。科目確定Step 2（過去仕訳照合）で使用';
