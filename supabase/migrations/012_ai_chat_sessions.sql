-- ============================================================
-- AI会話セッションテーブル マイグレーション
-- ============================================================
--
-- 【概要】
-- AIコマンド機能の会話履歴をスタッフ全員共有で管理する。
-- 1セッション = 複数メッセージ（messages JSONB配列）。
--
-- 【データフロー】
-- スタッフがAIコマンドで質問
--   → セッション作成 or 既存セッションにメッセージ追加
--   → messages配列にuser/assistantメッセージを追加
--
-- 【messagesの構造（AiChatMessage[]）】
-- [
--   { id, role: 'user', content: '...', timestamp: '...' },
--   { id, role: 'assistant', content: '...', responseType: 'text', timestamp: '...' }
-- ]
--
-- 準拠:
--   - ai-command.types.ts（AiChatSession + AiChatMessage）
--   - supabase_migration_plan.md Phase A-2
-- ============================================================

-- § 1. ai_chat_sessions（AI会話セッション）
CREATE TABLE IF NOT EXISTS ai_chat_sessions (

  /** PK: セッションID */
  id                TEXT PRIMARY KEY,

  /** 開始したスタッフID */
  staff_id          TEXT NOT NULL,

  /** 会話メッセージ一覧（JSONB配列。AiChatMessage[]） */
  messages          JSONB NOT NULL DEFAULT '[]'::jsonb,

  /** 作成日時 */
  created_at        TIMESTAMPTZ DEFAULT now(),

  /** 最終更新日時（メッセージ追加時に更新） */
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- § 2. インデックス
-- ============================================================

-- スタッフ別セッション取得
CREATE INDEX idx_ai_chat_sessions_staff_id
  ON ai_chat_sessions (staff_id);

-- 最新セッション取得
CREATE INDEX idx_ai_chat_sessions_updated_at
  ON ai_chat_sessions (updated_at DESC);

-- ============================================================
-- § 3. RLS（スタッフのみアクセス可能）
-- ============================================================

ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_only_ai_chat_sessions" ON ai_chat_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'staff'
    )
  );

-- ============================================================
-- § 4. updated_at 自動更新トリガー
-- ============================================================

CREATE OR REPLACE FUNCTION update_ai_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ai_chat_sessions_updated_at
  BEFORE UPDATE ON ai_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_chat_sessions_updated_at();

-- ============================================================
-- § 5. コメント
-- ============================================================

COMMENT ON TABLE ai_chat_sessions IS 'AIコマンドの会話セッション。スタッフ全員共有。messagesはJSONB配列（AiChatMessage[]）';
COMMENT ON COLUMN ai_chat_sessions.messages IS 'AiChatMessage[]。各要素: {id, role, content, responseType?, tableData?, actions?, suggestions?, timestamp}';
