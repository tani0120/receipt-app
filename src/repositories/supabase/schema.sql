-- ============================================================================
-- PostgreSQL Migration Schema (Streamed互換設計)
-- 重要修正3点統合済み
-- ============================================================================

-- ============================================================================
-- 🔴 修正① status を ENUM 型にする（typo完全防止）
-- ============================================================================
CREATE TYPE receipt_status AS ENUM (
  'uploaded',
  'preprocessed',
  'ocr_done',
  'suggested',
  'reviewing',
  'confirmed',
  'rejected'
);

-- ============================================================================
-- receipts テーブル（正規帳簿）
-- ============================================================================
CREATE TABLE receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  drive_file_id text NOT NULL UNIQUE,
  
  -- ✅ 核心: status は ENUM型（typo不可能、意識的変更強制）
  status receipt_status NOT NULL DEFAULT 'uploaded',
  
  current_version int NOT NULL DEFAULT 1,
  confirmed_journal jsonb,
  display_snapshot jsonb,  -- UI表示用（壊れてもOK、正解を守る盾）
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 🔴 修正③ confirmed時はjournalが必須（DB制約で強制）
ALTER TABLE receipts
ADD CONSTRAINT confirmed_requires_journal
CHECK (
  (status = 'confirmed' AND confirmed_journal IS NOT NULL)
  OR (status != 'confirmed')
);

CREATE INDEX idx_receipts_status ON receipts(status);
CREATE INDEX idx_receipts_client_id ON receipts(client_id);

-- ============================================================================
-- audit_logs テーブル（監査証跡）
-- ============================================================================
CREATE TABLE audit_logs (
  id bigserial PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  actor text NOT NULL,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- 🔴 修正② トランザクション関数（状態変更＋監査を原子的に）
-- ============================================================================
CREATE OR REPLACE FUNCTION update_receipt_status(
  p_id uuid,
  p_new_status receipt_status,
  p_actor text
) RETURNS void AS $$
DECLARE
  v_before jsonb;
BEGIN
  -- 1. 現在の状態を取得（監査ログ用）
  SELECT row_to_json(receipts.*)::jsonb
  INTO v_before
  FROM receipts
  WHERE id = p_id;

  -- 2. 状態更新
  UPDATE receipts
    SET status = p_new_status,
        updated_at = now()
  WHERE id = p_id;

  -- 3. 監査ログ記録（同一トランザクション内）
  INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    actor,
    before_json,
    after_json
  ) VALUES (
    'receipt',
    p_id,
    'status_change',
    p_actor,
    v_before,
    jsonb_build_object('status', p_new_status)
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 使用例（コメント）
-- ============================================================================
-- SELECT update_receipt_status(
--   'receipt-uuid'::uuid,
--   'confirmed'::receipt_status,
--   'user@example.com'
-- );
