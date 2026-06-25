/**
 * DeterminationMethod（科目確定方法）
 *
 * 仕訳の勘定科目がどの経路で確定したかを表す。
 * determination_method フィールド名で使用（旧名: prediction_method）。
 *
 * 棚卸し: journal_attribute_inventory.md §1
 */
export type DeterminationMethod =
  | 't_number'        // T番号一致（第1層）
  | 'match_key'       // 照合キー一致（第2層）
  | 'learning_rule'   // 学習ルール（第3層）
  | 'industry_vector' // 業種辞書（第4層）
  | 'ai_fallback'     // AI推定（第5層）
  | 'manual'          // 手動確定
  | 'imported'        // 会計ソフト取込
  | 'legacy'          // 旧データ

// NULL = 科目未確定（insufficient）。意味は1つのみ。
