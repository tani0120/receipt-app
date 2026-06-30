-- ============================================================
-- AIコマンドログテーブル マイグレーション
-- ============================================================
--
-- 【概要】
-- AI（Gemini等）への全リクエスト/レスポンスを記録する。
-- コスト管理・品質分析・デバッグ用。
--
-- 【現在のデータ構造】
-- data/ai-command-logs.json（71件、24フィールド）:
--   {
--     "id": "ailog_hjMh0hWM",
--     "executedAt": "2026-05-24T07:09:36.018Z",
--     "staffId": "staff-0000",
--     "clientId": "default",
--     "inputText": "tskの2025年年商は？",
--     "toolName": null,
--     "toolParams": null,
--     "status": "success",
--     "responseSummary": "",
--     "writeConfirmed": null,
--     "writeResultDetail": null,
--     "writeBeforeSnapshot": null,
--     "context": null,
--     "costCategory": "chat",
--     "model": "gemini-2.0-flash",
--     "layer": "chat",
--     "promptTokens": 1234,
--     "completionTokens": 567,
--     "thinkingTokens": 0,
--     "totalTokens": 1801,
--     "inputPricePerM": 0.1,
--     "outputPricePerM": 0.4,
--     "estimatedCostYen": 0.12,
--     "toolsCalled": ["searchVendors"]
--   }
--
-- 準拠:
--   - data/ai-command-logs.json（実データ構造）
--   - supabase_migration_plan.md Phase A-2 ④
-- ============================================================

-- § 1. ai_command_logs（AIコマンドログ）
CREATE TABLE IF NOT EXISTS ai_command_logs (

  /** PK: ailog_XXXXXXXX形式 */
  id                TEXT PRIMARY KEY,

  /** 実行日時 */
  executed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  /** 実行スタッフID */
  staff_id          TEXT,

  /** 対象顧問先ID（'default'=顧問先に紐づかない操作） */
  client_id         TEXT,

  /** 入力テキスト（ユーザーの質問/指示） */
  input_text        TEXT,

  /** ツール名（function calling時） */
  tool_name         TEXT,

  /** ツールパラメータ（JSONB） */
  tool_params       JSONB,

  /** 実行ステータス */
  status            TEXT NOT NULL DEFAULT 'success'
                    CHECK (status IN ('success', 'error', 'cancelled')),

  /** レスポンス要約 */
  response_summary  TEXT,

  /** 書き込み確認フラグ（ツールが書き込みを行った場合） */
  write_confirmed   BOOLEAN,

  /** 書き込み結果詳細 */
  write_result_detail TEXT,

  /** 書き込み前スナップショット（ロールバック用） */
  write_before_snapshot JSONB,

  /** コンテキスト情報（JSONB） */
  context           JSONB,

  -- ── コスト管理 ──

  /** コストカテゴリ（chat/pipeline/batch等） */
  cost_category     TEXT,

  /** 使用モデル（gemini-2.0-flash等） */
  model             TEXT,

  /** レイヤー（chat/classify/determine等） */
  layer             TEXT,

  /** 入力トークン数 */
  prompt_tokens     INTEGER,

  /** 出力トークン数 */
  completion_tokens INTEGER,

  /** 思考トークン数（Thinking機能使用時） */
  thinking_tokens   INTEGER DEFAULT 0,

  /** 合計トークン数 */
  total_tokens      INTEGER,

  /** 入力単価（$/百万トークン） */
  input_price_per_m NUMERIC(10,4),

  /** 出力単価（$/百万トークン） */
  output_price_per_m NUMERIC(10,4),

  /** 推定コスト（円） */
  estimated_cost_yen NUMERIC(10,4),

  /** 呼び出したツール名リスト */
  tools_called      TEXT[]
);

-- ============================================================
-- § 2. インデックス
-- ============================================================

-- 日時降順（最新ログの取得）
CREATE INDEX idx_ai_command_logs_executed_at
  ON ai_command_logs (executed_at DESC);

-- スタッフ別ログ（誰がどれだけAIを使ったか）
CREATE INDEX idx_ai_command_logs_staff_id
  ON ai_command_logs (staff_id)
  WHERE staff_id IS NOT NULL;

-- 顧問先別ログ（顧問先ごとのAI使用量分析）
CREATE INDEX idx_ai_command_logs_client_id
  ON ai_command_logs (client_id)
  WHERE client_id IS NOT NULL AND client_id != 'default';

-- コストカテゴリ別集計（chat/pipeline/batchの内訳）
CREATE INDEX idx_ai_command_logs_cost_category
  ON ai_command_logs (cost_category)
  WHERE cost_category IS NOT NULL;

-- モデル別集計
CREATE INDEX idx_ai_command_logs_model
  ON ai_command_logs (model)
  WHERE model IS NOT NULL;

-- ============================================================
-- § 3. RLS（スタッフのみアクセス可能）
-- ============================================================

ALTER TABLE ai_command_logs ENABLE ROW LEVEL SECURITY;

-- スタッフのみ全件アクセス可能（AIログは内部管理情報）
CREATE POLICY "staff_only_ai_command_logs" ON ai_command_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'staff'
    )
  );

-- 顧問先ユーザーにはアクセスポリシーなし（＝アクセス不可）

-- ============================================================
-- § 4. コメント
-- ============================================================

COMMENT ON TABLE ai_command_logs IS 'AI（Gemini等）への全リクエスト/レスポンスログ。コスト管理・品質分析・デバッグ用';
COMMENT ON COLUMN ai_command_logs.cost_category IS 'chat=対話、pipeline=パイプライン処理、batch=バッチ処理';
COMMENT ON COLUMN ai_command_logs.estimated_cost_yen IS '推定コスト（円）。promptTokens×inputPricePerM + completionTokens×outputPricePerM を円換算';
COMMENT ON COLUMN ai_command_logs.tools_called IS 'function callingで呼び出したツール名のTEXT配列';
