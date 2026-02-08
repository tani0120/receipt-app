/**
 * JournalUiMode
 *
 * UI状態の定義:
 * - loading: entry が存在しない（初期ロード中）
 * - editable: 編集可能（READY_FOR_WORK）
 * - remanded: 差戻状態（編集可、警告表示）
 * - readonly: 読み取り専用（Submitted, Approved）
 * - fallback: 不明なstatus
 *
 * 業務フローとの対応:
 * - Draft → fallback（schema未定義、Phase 5で決定）
 * - READY_FOR_WORK → editable（担当が仕訳処理）
 * - Submitted → readonly（上席レビュー待ち）
 * - REMANDED → remanded（差戻し、編集可）
 * - Approved → readonly（確定・ロック）
 */

export type JournalUiMode =
    | 'loading'
    | 'editable'
    | 'remanded'
    | 'readonly'
    | 'fallback'
