-- ============================================================
-- MF課税方式別availableテーブル マイグレーション
-- ============================================================
--
-- 【概要】
-- MFクラウド会計から取得した課税方式別のavailableデータを保存。
-- 税区分マスタの「この課税方式ではこの税区分が使用可能か」を管理。
--
-- 【データ構造（TaxAvailableMap）】
-- { 方式キー: { マスタID: boolean } }
-- 例: { 'proportional': { 'tax_001': true, 'tax_002': false, ... } }
--
-- 【主キー設計】
-- method をPKとする（4方式 = 最大4レコード）。
-- availableマップは JSONB で保持。
--
-- 準拠:
--   - types.ts（TaxMethodKey + TaxAvailableMap）
--   - supabase_migration_plan.md Phase A-2
-- ============================================================

-- § 1. mf_tax_available（MF課税方式別available）
CREATE TABLE IF NOT EXISTS mf_tax_available (

  /** PK: 課税方式キー（4値） */
  method            TEXT PRIMARY KEY
                    CHECK (method IN (
                      'proportional',  -- 個別対応方式
                      'individual',    -- 一括比例配分方式
                      'simplified',    -- 簡易課税
                      'exempt'         -- 免税
                    )),

  /** availableマップ: { マスタID: boolean } */
  available         JSONB NOT NULL DEFAULT '{}'::jsonb,

  /** 更新日時 */
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- § 2. RLS（スタッフのみアクセス可能）
-- ============================================================

ALTER TABLE mf_tax_available ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_only_mf_tax_available" ON mf_tax_available
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'staff'
    )
  );

-- ============================================================
-- § 3. updated_at 自動更新トリガー
-- ============================================================

CREATE OR REPLACE FUNCTION update_mf_tax_available_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mf_tax_available_updated_at
  BEFORE UPDATE ON mf_tax_available
  FOR EACH ROW
  EXECUTE FUNCTION update_mf_tax_available_updated_at();

-- ============================================================
-- § 4. 初期データ（4方式分の空レコード）
-- ============================================================

INSERT INTO mf_tax_available (method, available) VALUES
  ('proportional', '{}'::jsonb),
  ('individual', '{}'::jsonb),
  ('simplified', '{}'::jsonb),
  ('exempt', '{}'::jsonb)
ON CONFLICT (method) DO NOTHING;

-- ============================================================
-- § 5. コメント
-- ============================================================

COMMENT ON TABLE mf_tax_available IS 'MF課税方式別の税区分available管理。4方式×N個の税区分IDのマップ';
COMMENT ON COLUMN mf_tax_available.method IS '課税方式: proportional(個別対応), individual(一括比例配分), simplified(簡易課税), exempt(免税)';
COMMENT ON COLUMN mf_tax_available.available IS 'JSONB。{マスタID: boolean}のマップ。MFインポート時に更新';
