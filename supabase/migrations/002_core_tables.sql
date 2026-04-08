-- ============================================================
-- コアテーブル マイグレーション（DL-032: スキーマ確定）
-- ============================================================
--
-- 【テーブル構成】
-- 1. clients: 顧問先マスタ（Client型 → snake_case変換）
-- 2. vendors: 取引先マスタ（Vendor型。グローバル+顧問先を統合）
-- 3. accounts: 勘定科目マスタ（Account型）
-- 4. industry_vectors: 業種ベクトル辞書（FlatIndustryVectorRow形式）
-- 5. client_accounts: 顧問先カスタム科目（Account拡張）
--
-- confirmed_journals: T-03完了後に別ファイルで作成（型がunknown）
--
-- 準拠: pipeline_design_master.md DL-032
-- ============================================================

-- § 1. clients（顧問先マスタ）
CREATE TABLE IF NOT EXISTS clients (
  client_id                   TEXT PRIMARY KEY,          -- 'LDI-00008'
  three_code                  TEXT NOT NULL,             -- 'LDI'
  company_name                TEXT NOT NULL,
  company_name_kana           TEXT NOT NULL DEFAULT '',
  type                        TEXT NOT NULL DEFAULT 'corp'
                              CHECK (type IN ('corp', 'individual')),
  rep_name                    TEXT NOT NULL DEFAULT '',
  rep_name_kana               TEXT NOT NULL DEFAULT '',
  phone_number                TEXT NOT NULL DEFAULT '',
  email                       TEXT NOT NULL DEFAULT '',
  chat_room_url               TEXT NOT NULL DEFAULT '',
  contact                     JSONB NOT NULL DEFAULT '{"type":"none","value":""}',
  fiscal_month                INTEGER NOT NULL DEFAULT 3
                              CHECK (fiscal_month BETWEEN 1 AND 12),
  fiscal_day                  TEXT NOT NULL DEFAULT '末日',
  industry                    TEXT NOT NULL DEFAULT '',
  established_date            TEXT NOT NULL DEFAULT '',
  status                      TEXT NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'inactive', 'suspension')),
  accounting_software         TEXT NOT NULL DEFAULT 'mf'
                              CHECK (accounting_software IN ('mf', 'freee', 'yayoi', 'tkc', 'other')),
  tax_filing_type             TEXT NOT NULL DEFAULT 'blue'
                              CHECK (tax_filing_type IN ('blue', 'white')),
  consumption_tax_mode        TEXT NOT NULL DEFAULT 'general'
                              CHECK (consumption_tax_mode IN ('general', 'simplified', 'exempt')),
  simplified_tax_category     INTEGER,
  tax_method                  TEXT NOT NULL DEFAULT 'inclusive'
                              CHECK (tax_method IN ('inclusive', 'exclusive')),
  calculation_method          TEXT NOT NULL DEFAULT 'accrual'
                              CHECK (calculation_method IN ('accrual', 'cash', 'interim_cash')),
  default_payment_method      TEXT NOT NULL DEFAULT 'cash'
                              CHECK (default_payment_method IN ('cash', 'owner_loan', 'accounts_payable')),
  is_invoice_registered       BOOLEAN NOT NULL DEFAULT false,
  invoice_registration_number TEXT NOT NULL DEFAULT '',
  has_department_management   BOOLEAN NOT NULL DEFAULT false,
  has_rental_income           BOOLEAN NOT NULL DEFAULT false,
  staff_id                    TEXT,
  advisory_fee                INTEGER NOT NULL DEFAULT 0,
  bookkeeping_fee             INTEGER NOT NULL DEFAULT 0,
  settlement_fee              INTEGER NOT NULL DEFAULT 0,
  tax_filing_fee              INTEGER NOT NULL DEFAULT 0,
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_clients" ON clients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role = 'staff')
  );

CREATE POLICY "client_user_own_client" ON clients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM client_users cu WHERE cu.client_id = clients.client_id AND cu.user_id = auth.uid())
  );


-- § 2. vendors（取引先マスタ — グローバル + 顧問先統合）
CREATE TABLE IF NOT EXISTS vendors (
  vendor_id              TEXT PRIMARY KEY,                  -- UUID文字列
  company_name           TEXT NOT NULL,
  match_key              TEXT NOT NULL,                     -- normalizeVendorName()出力
  display_name           TEXT,
  aliases                TEXT[] NOT NULL DEFAULT '{}',      -- PostgreSQL配列
  t_numbers              TEXT[] NOT NULL DEFAULT '{}',      -- T番号リスト
  phone_numbers          TEXT[] NOT NULL DEFAULT '{}',      -- 電話番号リスト
  brand_id               TEXT,
  address                TEXT,
  vendor_vector          TEXT                               -- VendorVector（66種） or null
                         CHECK (vendor_vector IS NULL OR length(vendor_vector) > 0),
  non_vendor_type        TEXT,                              -- NonVendorType or null
  source_category        TEXT
                         CHECK (source_category IS NULL OR source_category IN ('bank', 'credit', 'all')),
  level                  TEXT
                         CHECK (level IS NULL OR level IN ('A', 'insufficient')),
  direction              TEXT
                         CHECK (direction IS NULL OR direction IN ('expense', 'income')),
  amount_threshold       INTEGER,
  debit_account          TEXT,
  debit_account_over     TEXT,
  debit_sub_account      TEXT,
  debit_tax_category     TEXT,
  debit_department       TEXT,
  credit_account         TEXT,
  credit_sub_account     TEXT,
  credit_tax_category    TEXT,
  credit_department      TEXT,
  scope                  TEXT NOT NULL DEFAULT 'global'
                         CHECK (scope IN ('global', 'client')),
  client_id              TEXT,                              -- scope='client'時のみ
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

-- インデックス: 照合パイプラインの3レイヤー用
CREATE INDEX idx_vendors_match_key ON vendors (match_key);
CREATE INDEX idx_vendors_t_numbers ON vendors USING GIN (t_numbers);
CREATE INDEX idx_vendors_phone_numbers ON vendors USING GIN (phone_numbers);
CREATE INDEX idx_vendors_scope_client ON vendors (scope, client_id);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_vendors" ON vendors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role = 'staff')
  );

CREATE POLICY "client_user_own_vendors" ON vendors
  FOR SELECT USING (
    scope = 'global'
    OR EXISTS (SELECT 1 FROM client_users cu WHERE cu.client_id = vendors.client_id AND cu.user_id = auth.uid())
  );


-- § 3. accounts（勘定科目マスタ）
CREATE TABLE IF NOT EXISTS accounts (
  id                      TEXT PRIMARY KEY,                -- 'TRAVEL', 'ENTERTAINMENT' 等
  name                    TEXT NOT NULL,                   -- MF正式科目名
  sub                     TEXT,                            -- 補助科目
  target                  TEXT NOT NULL DEFAULT 'both'
                          CHECK (target IN ('corp', 'individual', 'both')),
  account_group           TEXT NOT NULL
                          CHECK (account_group IN ('BS_ASSET', 'BS_LIABILITY', 'BS_EQUITY', 'PL_REVENUE', 'PL_EXPENSE')),
  category                TEXT NOT NULL DEFAULT '',        -- 中分類
  default_tax_category_id TEXT,                            -- TaxCategory.id参照
  tax_determination       TEXT NOT NULL DEFAULT 'auto_purchase'
                          CHECK (tax_determination IN ('auto_purchase', 'auto_sales', 'fixed')),
  deprecated              BOOLEAN NOT NULL DEFAULT false,
  effective_from          TEXT NOT NULL DEFAULT '2019-10-01',
  effective_to            TEXT,
  sort_order              INTEGER NOT NULL DEFAULT 0,
  is_custom               BOOLEAN NOT NULL DEFAULT false,
  insert_after            TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- 科目マスタは全ユーザー参照可（認証済み）
CREATE POLICY "authenticated_read_accounts" ON accounts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "staff_manage_accounts" ON accounts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role = 'staff')
  );


-- § 4. client_accounts（顧問先カスタム科目）
CREATE TABLE IF NOT EXISTS client_accounts (
  client_id               TEXT NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
  account_id              TEXT NOT NULL REFERENCES accounts(id),
  is_enabled              BOOLEAN NOT NULL DEFAULT true,   -- 科目ON/OFF
  custom_name             TEXT,                            -- 顧問先独自名称
  custom_sub              TEXT,                            -- 独自補助科目
  custom_tax_category_id  TEXT,                            -- 独自税区分
  sort_order_override     INTEGER,                         -- 独自並び順
  created_at              TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (client_id, account_id)
);

ALTER TABLE client_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_client_accounts" ON client_accounts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role = 'staff')
  );


-- § 5. industry_vectors（業種ベクトル辞書 — フラット形式）
CREATE TABLE IF NOT EXISTS industry_vectors (
  vector                  TEXT NOT NULL,                   -- VendorVector値
  direction               TEXT NOT NULL
                          CHECK (direction IN ('expense', 'income')),
  account                 TEXT NOT NULL REFERENCES accounts(id),
  sort_order              INTEGER NOT NULL DEFAULT 0,      -- 優先度順
  PRIMARY KEY (vector, direction, account)
);

ALTER TABLE industry_vectors ENABLE ROW LEVEL SECURITY;

-- 辞書は全認証ユーザー参照可
CREATE POLICY "authenticated_read_industry_vectors" ON industry_vectors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "staff_manage_industry_vectors" ON industry_vectors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role = 'staff')
  );


-- § 6. Realtimeを有効化（変更頻度が高いテーブルのみ）
ALTER PUBLICATION supabase_realtime ADD TABLE clients;
ALTER PUBLICATION supabase_realtime ADD TABLE vendors;
