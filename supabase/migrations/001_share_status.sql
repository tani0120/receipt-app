-- ============================================================
-- ShareStatus マイグレーション（DL-031: 認証・認可設計）
-- ============================================================
--
-- 【テーブル構成】
-- 1. user_profiles: auth.usersの拡張（role: staff / client_user）
-- 2. invitations: 招待テーブル（顧問先自己登録用）
-- 3. client_users: 顧問先×ユーザー紐付
-- 4. share_status: 顧問先ごとの共有設定ステータス
--
-- 【RLSポリシー】
-- - staff: 全テーブルフルアクセス
-- - client_user: 自分のclientIdのshare_statusのみ参照
--
-- 【トリガー】
-- - client_users INSERT時にshare_statusを自動で'active'に更新
--
-- 準拠: pipeline_design_master.md DL-031
-- ============================================================

-- § 1. user_profiles（ユーザープロファイル）
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'client_user'
               CHECK (role IN ('staff', 'client_user')),
  display_name TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- staff: 全件参照・更新可
CREATE POLICY "staff_full_access" ON user_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role = 'staff')
  );

-- 自分自身のプロファイルは参照可
CREATE POLICY "self_read" ON user_profiles
  FOR SELECT USING (user_id = auth.uid());


-- § 2. invitations（招待テーブル）
CREATE TABLE IF NOT EXISTS invitations (
  code         TEXT PRIMARY KEY,
  client_id    TEXT NOT NULL,
  created_by   UUID REFERENCES auth.users(id),
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- staff: フルアクセス
CREATE POLICY "staff_invitations" ON invitations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role = 'staff')
  );

-- 未認証ユーザー（登録前）: 有効な招待コードのみ参照可
CREATE POLICY "public_read_active" ON invitations
  FOR SELECT USING (is_active = true);


-- § 3. client_users（顧問先×ユーザー紐付）
CREATE TABLE IF NOT EXISTS client_users (
  client_id    TEXT NOT NULL,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (client_id, user_id)
);

ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;

-- staff: フルアクセス
CREATE POLICY "staff_client_users" ON client_users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role = 'staff')
  );

-- client_user: 自分の紐付のみ参照
CREATE POLICY "self_client_users" ON client_users
  FOR SELECT USING (user_id = auth.uid());


-- § 4. share_status（共有設定ステータス）
CREATE TABLE IF NOT EXISTS share_status (
  client_id    TEXT PRIMARY KEY,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'active', 'revoked')),
  invite_code  TEXT REFERENCES invitations(code),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE share_status ENABLE ROW LEVEL SECURITY;

-- staff: フルアクセス
CREATE POLICY "staff_share_status" ON share_status
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role = 'staff')
  );

-- client_user: 自分のclientIdのみ参照
CREATE POLICY "client_share_status" ON share_status
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM client_users cu WHERE cu.client_id = share_status.client_id AND cu.user_id = auth.uid())
  );


-- § 5. トリガー: client_users INSERT → share_status を 'active' に自動更新
CREATE OR REPLACE FUNCTION fn_auto_activate_share()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE share_status
  SET status = 'active', updated_at = now()
  WHERE client_id = NEW.client_id
    AND status = 'pending';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_activate_share
  AFTER INSERT ON client_users
  FOR EACH ROW
  EXECUTE FUNCTION fn_auto_activate_share();


-- § 6. Realtimeを有効化
ALTER PUBLICATION supabase_realtime ADD TABLE share_status;
