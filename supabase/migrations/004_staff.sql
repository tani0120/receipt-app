-- ============================================================
-- staffテーブル マイグレーション
-- ============================================================
--
-- 【テーブル構成】
-- 1. staff: スタッフマスタ（data/staff.json 互換）
--
-- 【RLSポリシー】
-- - staff（role='staff'）: フルアクセス
-- - client_user: アクセス不可
--
-- データソース: data/staff.json（7名）
-- ============================================================

-- § 1. staff（スタッフマスタ）
CREATE TABLE IF NOT EXISTS staff (
  uuid        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'general'
              CHECK (role IN ('admin', 'general')),
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'inactive')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- staff（user_profiles.role='staff'）のみフルアクセス
CREATE POLICY "staff_manage_staff" ON staff
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role = 'staff')
  );
