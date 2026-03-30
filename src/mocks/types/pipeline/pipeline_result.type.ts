/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PipelineResult — パイプライン出力型（契約 v1.0）
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 【概要】
 *   AIパイプライン（Step 0〜4）の最終出力型。
 *   UI列（証票種類/証票向き/証票業種）、DB保存、CSV出力の全てがこの型を参照する。
 *
 * 【設計決定（2026-03-30 確定）】
 *   - GPT提案の `status: 'confirmed' | 'candidate'` は不採用（設計に存在しない概念）
 *   - 既存設計の `level: 'A' | 'insufficient'` を維持（vendor_vector_41_reference.md準拠）
 *   - `accountCode` は不採用（core層 JournalEntrySchema と命名衝突）
 *   - `determined_account` を採用（ACCOUNT_MASTER ID を格納）
 *   - snake_case統一（パイプライン層の規約）
 *   - GPTの `candidates` と `trace.notes` は有用なため採用
 *
 * 【変更ルール】
 *   - Breaking変更は禁止。別バージョン（v2.0）として定義すること
 *   - フィールド追加はoptionalで可
 *
 * 【参照】
 *   - vendor_vector_41_reference.md: 66種の科目候補とlevel定義
 *   - detailed_implementation_plan.md L57-69: 元の型定義
 *   - source_type.type.ts: SourceType, Direction 型
 *
 * 【保留解除条件（外部層24件の修正トリガー）】
 *   1. ✅ PipelineResult型が確定している（本ファイル）
 *   2. ✅ determined_account の命名が確定している
 *   3. ✅ level: 'A' | 'insufficient' 定義が確定している
 *   4. ⬜ pipeline.ts がモックで一通り動く
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { SourceType, Direction } from './source_type.type'

// ============================================================
// § VendorVector 型（暫定import）
// ============================================================
// TODO: T-01（vendor_vector.type.ts）作成後にimportパスを変更
// 現時点では string で代用し、T-01完了時に差し替える

/**
 * VendorVector — 取引先業種ベクトル（66種）
 *
 * 正: vendor_vector_41_reference.md
 * T-01 で正式な union型として定義予定
 */
type VendorVector = string

// ============================================================
// § PipelineResult（契約 v1.0）
// ============================================================

/**
 * パイプライン5ステップの最終出力型
 *
 * @example confirmed（自動確定）:
 * ```ts
 * {
 *   source_type: 'receipt',
 *   direction: 'expense',
 *   vendor_vector: 'taxi',
 *   determined_account: 'TRAVEL',
 *   tax_category: 'TAXABLE_PURCHASE_10',
 *   level: 'A',
 *   candidates: ['TRAVEL'],
 *   history_match_hit: true,
 *   early_return_step: 2,
 *   confidence: 0.95,
 *   trace: { completed_step: 2, notes: ['history_matchで即確定'] }
 * }
 * ```
 *
 * @example insufficient（人間判断）:
 * ```ts
 * {
 *   source_type: 'receipt',
 *   direction: 'expense',
 *   vendor_vector: 'restaurant',
 *   determined_account: null,
 *   tax_category: null,
 *   level: 'insufficient',
 *   candidates: ['MEETING', 'ENTERTAINMENT', 'WELFARE'],
 *   history_match_hit: false,
 *   early_return_step: null,
 *   confidence: 0.6,
 *   trace: { completed_step: 4, notes: ['VV=restaurant', '候補3件→人間判断'] }
 * }
 * ```
 *
 * @example non_journal（仕訳対象外）:
 * ```ts
 * {
 *   source_type: 'non_journal',
 *   direction: null,
 *   vendor_vector: null,
 *   determined_account: null,
 *   tax_category: null,
 *   level: 'insufficient',
 *   candidates: [],
 *   history_match_hit: false,
 *   early_return_step: 0,
 *   confidence: 1.0,
 *   trace: { completed_step: 0, notes: ['契約書→仕訳対象外'] }
 * }
 * ```
 */
export interface PipelineResult {
  // ============================================================
  // パイプライン判定結果（UIが直接参照する3列）
  // ============================================================

  /** 証票種類（7種）— Step 0 で判定 */
  source_type: SourceType

  /** 証票向き（3種）— Step 1 で判定。non_journal の場合 null */
  direction: Direction | null

  /** 証票業種（66種）— Step 3 で判定。Step 2 で早期終了した場合 null */
  vendor_vector: VendorVector | null

  // ============================================================
  // 科目確定結果
  // ============================================================

  /**
   * 確定した勘定科目（ACCOUNT_MASTER ID）
   *
   * level='A' の場合: 必ず値が入る（例: 'TRAVEL'）
   * level='insufficient' の場合: null（人間が candidates から選択後に設定）
   * non_journal の場合: null
   */
  determined_account: string | null

  /**
   * 税区分（ACCOUNT_MASTER の default_tax_category から自動設定）
   *
   * determined_account が確定した後に設定される
   * 科目未確定の場合: null
   */
  tax_category: string | null

  /**
   * 判定レベル
   *
   * 'A': 候補が1つ → AI自動確定（vendor_vector_41_reference.md のレベルA）
   * 'insufficient': 候補が2つ以上 → 人間がUIで選択
   */
  level: 'A' | 'insufficient'

  /**
   * 科目候補（ACCOUNT_MASTER ID の配列）
   *
   * level='A' の場合: 要素数1（自動確定された科目）
   * level='insufficient' の場合: 要素数2以上（人間が選択する候補群）
   * non_journal の場合: 空配列
   */
  candidates: string[]

  // ============================================================
  // パイプライン制御
  // ============================================================

  /** Step 2 の過去仕訳照合でヒットしたか */
  history_match_hit: boolean

  /**
   * 早期終了したステップ
   *
   * 0: non_journal → Step 0 で即終了
   * 2: history_match → Step 2 で過去仕訳から確定
   * null: 通常フロー（Step 4 まで到達）
   */
  early_return_step: 0 | 2 | null

  /**
   * 信頼度（0.0〜1.0）
   *
   * history_match_hit=true: 高い（0.8〜1.0）
   * level='A': 中程度（0.6〜0.8）
   * level='insufficient': 低い（0.3〜0.6）
   */
  confidence: number

  // ============================================================
  // トレース（デバッグ・監査用）
  // ============================================================

  /** デバッグ・監査用トレース情報 */
  trace: {
    /** パイプラインが到達した最後のステップ */
    completed_step: 0 | 1 | 2 | 3 | 4

    /** 各ステップの判定理由ログ（人間可読） */
    notes: string[]
  }
}

// ============================================================
// § PipelineResult ユーティリティ型
// ============================================================

/**
 * non_journal の場合のPipelineResult（部分型）
 * Step 0 で即終了するケース
 */
export type NonJournalResult = PipelineResult & {
  source_type: 'non_journal'
  direction: null
  vendor_vector: null
  determined_account: null
  tax_category: null
  early_return_step: 0
}

/**
 * history_match で確定した場合のPipelineResult（部分型）
 * Step 2 で早期終了するケース
 */
export type HistoryMatchResult = PipelineResult & {
  history_match_hit: true
  early_return_step: 2
  level: 'A'
  determined_account: string
  tax_category: string
}

/**
 * UI表示用のPipelineResult要約
 * 仕訳一覧テーブルの3列に対応
 */
export type PipelineResultSummary = Pick<
  PipelineResult,
  'source_type' | 'direction' | 'vendor_vector' | 'level' | 'confidence'
>
