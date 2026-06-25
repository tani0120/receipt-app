/**
 * 旧仕訳の determination_method（科目確定方法）+ source（データ経路）移行
 *
 * 1. 旧キー prediction_method → 新キー determination_method にリネーム（値は引き継ぎ）
 * 2. determination_method が undefined の旧仕訳に 'legacy'（旧データ）を設定
 * 3. source が undefined の仕訳に経路を設定:
 *   - determination_method === 'legacy' → source: 'legacy'
 *   - それ以外（AI生成仕訳） → source: 'ai_pipeline'
 *
 * NULLの意味を「科目未確定」の1つに統一するため。
 *
 * 起動時に loadClient() から1回だけ呼ばれる。
 * 変更があった場合のみ true を返す（呼び出し元が save() を実行する）。
 */
export function migrateLegacyDeterminationMethod(
  journals: Record<string, unknown>[]
): boolean {
  let changed = false
  for (const journal of journals) {
    // 旧キー prediction_method → 新キー determination_method にリネーム
    if ('prediction_method' in journal && !('determination_method' in journal)) {
      journal.determination_method = journal.prediction_method
      delete journal.prediction_method
      changed = true
    }
    // determination_method 移行（未設定の旧仕訳に 'legacy' を設定）
    if (journal.determination_method === undefined || journal.determination_method === void 0) {
      journal.determination_method = 'legacy'
      changed = true
    }
    // source 移行（MF取込仕訳は既に 'mf_import' / 'system' が設定済み）
    if (journal.source === undefined || journal.source === void 0) {
      journal.source = journal.determination_method === 'legacy' ? 'legacy' : 'ai_pipeline'
      changed = true
    }
  }
  if (changed) {
    console.log(
      `[migrateLegacyDeterminationMethod] determination_method / source 未設定の仕訳を移行しました`
    )
  }
  return changed
}
