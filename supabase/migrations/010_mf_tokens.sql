-- ============================================================
-- MFクラウドOAuthトークンテーブル マイグレーション
-- ============================================================
--
-- 【概要】
-- MFクラウド会計との連携に必要なOAuthトークンを
-- 顧問先単位で管理する。
--
-- 【現在のデータ構造】
-- data/mf-tokens.json:
--   {
--     "c_wTdnMKDO": {
--       "accessToken": "...",
--       "refreshToken": "...",
--       "expiresAt": 1782340363935,
--       "officeId": "2388-9641",
--       "officeName": "谷風行寛"
--     }
--   }
--
-- 【セキュリティ考慮】
-- access_token / refresh_token は機密情報。
-- 本番環境ではpgcrypto拡張のpgp_sym_encrypt/decryptによる
-- 暗号化列の採用を検討する。現時点ではTEXTで保持し、
-- RLSでスタッフのみアクセス可能にする。
--
-- 準拠:
--   - data/mf-tokens.json（実データ構造）
--   - mfAuthService.ts（tokenStore操作）
--   - supabase_migration_plan.md Phase A-2 ③
-- ============================================================

-- § 1. mf_tokens（MFクラウドOAuthトークン）
CREATE TABLE IF NOT EXISTS mf_tokens (

  /** PK: 顧問先ID（1顧問先1トークン） */
  client_id         TEXT PRIMARY KEY
                    REFERENCES clients(client_id) ON DELETE CASCADE,

  /** アクセストークン（★機密情報。本番では暗号化検討） */
  access_token      TEXT NOT NULL,

  /** リフレッシュトークン（★機密情報。本番では暗号化検討） */
  refresh_token     TEXT NOT NULL,

  /** トークン有効期限（Unix timestamp ミリ秒） */
  expires_at        BIGINT NOT NULL,

  /** MF事業所ID（例: 2388-9641） */
  office_id         TEXT NOT NULL,

  /** MF事業所名（表示用） */
  office_name       TEXT NOT NULL,

  /** 作成日時 */
  created_at        TIMESTAMPTZ DEFAULT now(),

  /** 更新日時（トークンリフレッシュ時に更新） */
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- § 2. RLS（スタッフのみアクセス可能。顧問先ユーザーには非公開）
-- ============================================================

ALTER TABLE mf_tokens ENABLE ROW LEVEL SECURITY;

-- スタッフのみ全件アクセス可能（トークンは機密情報のためスタッフ限定）
CREATE POLICY "staff_only_mf_tokens" ON mf_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'staff'
    )
  );

-- 顧問先ユーザーにはアクセスポリシーなし（＝アクセス不可）

-- ============================================================
-- § 3. updated_at 自動更新トリガー
-- ============================================================

CREATE OR REPLACE FUNCTION update_mf_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mf_tokens_updated_at
  BEFORE UPDATE ON mf_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_mf_tokens_updated_at();

-- ============================================================
-- § 4. コメント
-- ============================================================

COMMENT ON TABLE mf_tokens IS 'MFクラウド会計OAuthトークン。顧問先単位。access_token/refresh_tokenは機密情報';
COMMENT ON COLUMN mf_tokens.expires_at IS 'Unix timestamp（ミリ秒）。トークン有効期限。リフレッシュ時に更新';
COMMENT ON COLUMN mf_tokens.office_id IS 'MF事業所ID。MF API呼び出しに必要';
