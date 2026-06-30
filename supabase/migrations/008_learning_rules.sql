-- ============================================================
-- 学習ルールテーブル マイグレーション
-- ============================================================
--
-- 【概要】
-- 科目確定AI（Step 4）の学習ルール照合で使用する。
-- 仕訳一覧の rule_id から逆引きするFK元テーブル。
--
-- 【照合方式】
-- ストリームド・MF同等の学習機能:
--   - 照合方式: 完全一致（exact） / 部分一致（contains）を人間が選択
--   - 金額条件: MF方式（amount_min/amount_max で以上・以下・同額・範囲を表現）
--   - 複合仕訳: learning_rule_entries で借方/貸方N行のテンプレートを保持
--   - 証票種別: source_category で領収書/口座/カード/全共通を区別
--
-- 【テーブル構成】
--   learning_rules: ルール本体（1ルール = 1行）
--   learning_rule_entries: 仕訳テンプレート行（1ルールに対してN行）
--   → learning_rule.type.ts のコメントに「learning_rules + learning_rule_entries テーブル」と明記済み
--
-- 準拠:
--   - learning_rule.type.ts（LearningRule + LearningRuleEntryLine）
--   - supabase_migration_plan.md Phase A-2 ①
-- ============================================================

-- § 1. learning_rules（学習ルール本体）
CREATE TABLE IF NOT EXISTS learning_rules (

  /** PK: ルールID（journal.rule_id の FK元） */
  rule_id           TEXT PRIMARY KEY,

  /** 顧問先ID（FK: clients.client_id） */
  client_id         TEXT NOT NULL
                    REFERENCES clients(client_id) ON DELETE CASCADE,

  /** 摘要マッチキーワード（取引先名に限定しない。任意の摘要テキスト） */
  keyword           TEXT NOT NULL,

  /** 照合方式（exact=完全一致、contains=部分一致） */
  match_type        TEXT NOT NULL DEFAULT 'exact'
                    CHECK (match_type IN ('exact', 'contains')),

  /** 入出金条件（NULL=条件なし） */
  direction         TEXT
                    CHECK (direction IS NULL OR direction IN ('expense', 'income')),

  /**
   * 証票種別カテゴリ
   *   receipt = 領収書・レシート・請求書のみ
   *   bank    = 銀行明細のみ
   *   credit  = クレカ明細のみ
   *   all     = 全種別共通
   *   NULL    = 条件なし
   */
  source_category   TEXT
                    CHECK (source_category IS NULL OR source_category IN (
                      'receipt', 'bank', 'credit', 'all'
                    )),

  /** 金額下限（MF方式: この金額以上。NULL=下限なし） */
  amount_min        NUMERIC,

  /** 金額上限（MF方式: この金額以下。NULL=上限なし） */
  amount_max        NUMERIC,

  /** 有効/無効 */
  is_active         BOOLEAN NOT NULL DEFAULT true,

  /** 累計適用回数 */
  hit_count         INTEGER NOT NULL DEFAULT 0,

  /** 生成元（ai=AI自動生成、human=人間作成） */
  generated_by      TEXT NOT NULL DEFAULT 'human'
                    CHECK (generated_by IN ('ai', 'human')),

  /** 作成日時 */
  created_at        TIMESTAMPTZ DEFAULT now(),

  /** 更新日時 */
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- § 2. learning_rule_entries（仕訳テンプレート行）
CREATE TABLE IF NOT EXISTS learning_rule_entries (

  /** PK: 行ID */
  entry_id          TEXT PRIMARY KEY,

  /** FK: 親ルールID（CASCADE削除） */
  rule_id           TEXT NOT NULL
                    REFERENCES learning_rules(rule_id) ON DELETE CASCADE,

  /** 借方/貸方 */
  side              TEXT NOT NULL
                    CHECK (side IN ('debit', 'credit')),

  /** 勘定科目（ACCOUNT_MASTER ID） */
  account           TEXT NOT NULL,

  /** 補助科目 */
  sub_account       TEXT,

  /** 税区分 */
  tax_category      TEXT,

  /** 部門 */
  department        TEXT,

  /** 金額タイプ（auto=自動計算、total=取引金額、fixed=固定金額） */
  amount_type       TEXT NOT NULL DEFAULT 'auto'
                    CHECK (amount_type IN ('auto', 'total', 'fixed')),

  /** 固定金額（amount_type='fixed'の場合のみ使用） */
  fixed_amount      NUMERIC,

  /** 摘要表示名（上書き方式。照合キーワードとは別に摘要欄に書き出す取引先名） */
  display_name      TEXT,

  /** 取引内容（摘要の一部。例: 事務用品購入、電気代） */
  description       TEXT,

  /** 対象月（摘要の一部。例: 4月分） */
  target_month      TEXT,

  /** 表示順（1始まり） */
  display_order     INTEGER NOT NULL DEFAULT 1
);

-- ============================================================
-- § 3. インデックス
-- ============================================================

-- 顧問先単位のルール取得（科目確定Step 4で全ルールを取得して照合）
CREATE INDEX idx_learning_rules_client_id
  ON learning_rules (client_id);

-- 顧問先+有効ルールのみ取得（照合時のフィルタ）
CREATE INDEX idx_learning_rules_client_active
  ON learning_rules (client_id)
  WHERE is_active = true;

-- ルールIDでのエントリ取得（ルール詳細表示、テンプレート適用時）
CREATE INDEX idx_learning_rule_entries_rule_id
  ON learning_rule_entries (rule_id);

-- ============================================================
-- § 4. RLS
-- ============================================================

ALTER TABLE learning_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_rule_entries ENABLE ROW LEVEL SECURITY;

-- スタッフは全顧問先のルールにアクセス可能
CREATE POLICY "staff_learning_rules" ON learning_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'staff'
    )
  );

-- 顧問先ユーザーは自分のルールのみ参照可能
CREATE POLICY "client_user_own_learning_rules" ON learning_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_users cu
      WHERE cu.client_id = learning_rules.client_id AND cu.user_id = auth.uid()
    )
  );

-- エントリ: スタッフは全件アクセス可能
CREATE POLICY "staff_learning_rule_entries" ON learning_rule_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'staff'
    )
  );

-- エントリ: 顧問先ユーザーは自分のルールのエントリのみ参照可能
CREATE POLICY "client_user_own_learning_rule_entries" ON learning_rule_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM learning_rules lr
      JOIN client_users cu ON cu.client_id = lr.client_id
      WHERE lr.rule_id = learning_rule_entries.rule_id
        AND cu.user_id = auth.uid()
    )
  );

-- ============================================================
-- § 5. updated_at 自動更新トリガー
-- ============================================================

CREATE OR REPLACE FUNCTION update_learning_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_learning_rules_updated_at
  BEFORE UPDATE ON learning_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_rules_updated_at();

-- ============================================================
-- § 6. コメント
-- ============================================================

COMMENT ON TABLE learning_rules IS '学習ルール本体。科目確定Step 4で照合。journal.rule_id のFK元';
COMMENT ON TABLE learning_rule_entries IS '学習ルールの仕訳テンプレート行。1ルールに対してN行（借方+貸方）';
COMMENT ON COLUMN learning_rules.match_type IS 'exact=完全一致（領収書デフォルト、優先度高）、contains=部分一致（銀行・カードデフォルト）';
COMMENT ON COLUMN learning_rules.source_category IS 'SourceType（12種）をSourceCategory（4種）に集約したもの。SOURCE_CATEGORY_MAPで変換';
COMMENT ON COLUMN learning_rule_entries.amount_type IS 'auto=自動計算（単一=証憑金額、複合=差額）、total=取引金額、fixed=固定金額';
