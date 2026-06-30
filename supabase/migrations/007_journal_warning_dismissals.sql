-- ============================================================
-- 警告確認済みテーブル マイグレーション
-- ============================================================
--
-- 【概要】
-- 仕訳ごとの「確認済み警告」を正規化テーブルで管理する。
--
-- 【背景】
-- journals.warning_dismissals（TEXT[]配列）にも同じデータを保持するが、
-- 正規化テーブルにすることで以下の利点がある:
--   1. 「誰がいつ確認したか」の監査証跡を記録できる
--   2. 特定の警告タイプを確認済みにした仕訳の一覧検索が容易
--   3. 将来的にjournals.warning_dismissals列を廃止し、
--      このテーブルのみで管理できる（段階的移行）
--
-- 【データフロー】
-- ユーザーが仕訳画面で警告を「確認済み」にする
--   → journals.warning_dismissals にラベル名を追加（配列操作）
--   → journal_warning_dismissals にINSERT（監査証跡）
--   → exportListService で dismissals.includes(label) チェック
--     → 確認済みならCSV出力対象から除外しない
--
-- 【使用箇所】
-- - exportListService.ts L156-158:
--     const dismissals = j.warning_dismissals ?? []
--     const isWarning = j.labels.some(l => EXCLUDE_LABELS.includes(l) && !dismissals.includes(l))
-- - journalStore.ts L215: PATCH対象フィールドリスト
--
-- 準拠:
--   - journal.type.ts L192: warning_dismissals: string[]
--   - supabase_migration_plan.md Phase A-2 テーブル一覧
-- ============================================================

-- § 1. journal_warning_dismissals（警告確認済み）
CREATE TABLE IF NOT EXISTS journal_warning_dismissals (

  /** PK: 自動採番 */
  id                BIGSERIAL PRIMARY KEY,

  /** FK: 仕訳ID（journals.journal_id）。仕訳削除時にCASCADE */
  journal_id        TEXT NOT NULL
                    REFERENCES journals(journal_id) ON DELETE CASCADE,

  /** 確認済みにした警告ラベル名（JournalLabel型の値） */
  warning_label     TEXT NOT NULL,

  /** 確認操作者（スタッフID） */
  dismissed_by      TEXT,

  /** 確認日時 */
  dismissed_at      TIMESTAMPTZ DEFAULT now(),

  -- ── 同一仕訳・同一警告の二重登録防止 ──
  UNIQUE (journal_id, warning_label)
);

-- ============================================================
-- § 2. インデックス
-- ============================================================

-- 仕訳IDでの取得（仕訳詳細画面で確認済み一覧を表示）
CREATE INDEX idx_jwd_journal_id
  ON journal_warning_dismissals (journal_id);

-- 警告ラベルでの検索（「DEBIT_CREDIT_MISMATCHを確認済みにした仕訳一覧」等）
CREATE INDEX idx_jwd_warning_label
  ON journal_warning_dismissals (warning_label);

-- ============================================================
-- § 3. RLS（journalsと同じパターン）
-- ============================================================

ALTER TABLE journal_warning_dismissals ENABLE ROW LEVEL SECURITY;

-- スタッフは全件アクセス可能
CREATE POLICY "staff_jwd" ON journal_warning_dismissals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'staff'
    )
  );

-- 顧問先ユーザーは自分の仕訳の確認済み情報のみ参照可能
CREATE POLICY "client_user_own_jwd" ON journal_warning_dismissals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM journals j
      JOIN client_users cu ON cu.client_id = j.client_id
      WHERE j.journal_id = journal_warning_dismissals.journal_id
        AND cu.user_id = auth.uid()
    )
  );

-- ============================================================
-- § 4. コメント
-- ============================================================

COMMENT ON TABLE journal_warning_dismissals IS '仕訳の警告確認済みテーブル（正規化）。journals.warning_dismissals配列と二重管理だが、監査証跡（誰がいつ確認したか）を記録するために必要';
COMMENT ON COLUMN journal_warning_dismissals.warning_label IS 'JournalLabel型の値。例: DEBIT_CREDIT_MISMATCH, ACCOUNT_UNKNOWN, FUTURE_DATE等';
COMMENT ON COLUMN journal_warning_dismissals.dismissed_by IS '確認操作を行ったスタッフID。将来的にstaff(staff_id) FKを追加可能';
