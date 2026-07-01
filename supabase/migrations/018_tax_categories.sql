-- ============================================================
-- 税区分マスタテーブル マイグレーション
-- ============================================================
--
-- 【概要】
-- 消費税区分マスタ。仕訳の税区分選択に使用。
-- 元々seed.sqlにCREATE TABLEが含まれていたが、
-- マイグレーションファイルに分離して正しい実行順序を保証する。
--
-- 準拠:
--   - supabase_migration_plan.md Phase A-4
-- ============================================================

CREATE TABLE IF NOT EXISTS tax_categories (
  tax_category_id    TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  short_name         TEXT NOT NULL DEFAULT '',
  direction          TEXT NOT NULL DEFAULT 'common',
  qualified          BOOLEAN NOT NULL DEFAULT false,
  ai_selectable      BOOLEAN NOT NULL DEFAULT true,
  active             BOOLEAN NOT NULL DEFAULT true,
  deprecated         BOOLEAN NOT NULL DEFAULT false,
  effective_from     TEXT,
  effective_to       TEXT,
  default_visible    BOOLEAN NOT NULL DEFAULT true,
  display_order      INTEGER NOT NULL DEFAULT 0,
  is_custom          BOOLEAN NOT NULL DEFAULT false,
  tax_rate           NUMERIC NOT NULL DEFAULT 0,
  source             TEXT NOT NULL DEFAULT 'mcp',
  is_unknown_default BOOLEAN NOT NULL DEFAULT false,
  enabled_from       TEXT,
  enabled_to         TEXT,
  visible_in         JSONB,
  display_rate       TEXT
);

COMMENT ON TABLE tax_categories IS '消費税区分マスタ。仕訳入力時の税区分選択肢';
