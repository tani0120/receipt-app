import { z } from 'zod';
import { JobSchema, JournalLineSchema } from './zod_schema';

// ============================================================================
// 🎯 規範UseCase (修正版): ExportJournalCSV（CSV形式変換器）
// ============================================================================
//
// 【UseCaseの責務（1行）】
//   自社システムの仕訳CSVを、会計ソフト取込用CSVに変換する
//
// 【やること】
//   ✓ CSV形式の変換（文字列 → 文字列）
//
// 【やらないこと】
//   ✗ 仕訳の確定判断
//   ✗ AI推論
//   ✗ UI表示
//
// ============================================================================

/**
 * 🔵 ExportJournalCSV Input Schema
 */
export const ExportJournalCSVInputSchema = z.object({
  /**
   * 自社システムが出力した仕訳CSV（文字列）
   */
  sourceCsv: z.string().min(1, "ソースCSVは必須です"),

  /**
   * どの会計ソフト形式に変換するか
   */
  targetSoftware: z.enum(['yayoi', 'freee', 'mf'])
});

/**
 * 🟢 ExportJournalCSV Output Schema
 */
export const ExportJournalCSVOutputSchema = z.object({
  /**
   * 変換後のCSV文字列
   */
  convertedCsv: z.string().min(1),

  /**
   * 変換した行数（検証用）
   */
  rowCount: z.number().min(0)
});

export type ExportJournalCSVInput = z.infer<typeof ExportJournalCSVInputSchema>;
export type ExportJournalCSVOutput = z.infer<typeof ExportJournalCSVOutputSchema>;

// ============================================================================
// 🎯 ImportJournalCSV（CSV形式逆変換器）
// ============================================================================
//
// 【UseCaseの責務（1行）】
//   会計ソフトのCSVを、自社システムの仕訳データ（Job）に変換する
//
// 【やること】
//   ✓ CSV形式のパース（文字列 → Job配列）
//
// 【やらないこと】
//   ✗ 会計ソフトの自動判別（sourceSoftwareで明示）
//   ✗ 仕訳の正誤判断
//   ✗ AI推論
//
// ============================================================================

/**
 * 🔵 ImportJournalCSV Input Schema
 */
export const ImportJournalCSVInputSchema = z.object({
  /**
   * 会計ソフトが出力したCSV（文字列）
   */
  sourceCsv: z.string().min(1, "ソースCSVは必須です"),

  /**
   * どの会計ソフト形式のCSVか
   *
   * この情報がないと正しく解釈できない（推論させない）
   */
  sourceSoftware: z.enum(['yayoi', 'freee', 'mf'])
});

/**
 * 🟢 ImportJournalCSV Output Schema
 */
export const ImportJournalCSVOutputSchema = z.object({
  /**
   * パースされた仕訳データ
   *
   * Phase 4で確立したJobSchemaを使用
   * usecase中身の定義はここでは行わない（Phase 4に委譲）
   */
  journals: z.array(JobSchema),

  /**
   * 読み込んだ行数（検証用）
   */
  rowCount: z.number().min(0)
});


export type ImportJournalCSVInput = z.infer<typeof ImportJournalCSVInputSchema>;
export type ImportJournalCSVOutput = z.infer<typeof ImportJournalCSVOutputSchema>;

// ============================================================================
// 🎯 ValidateJournalBalance（仕訳検証）
// ============================================================================
//
// 【UseCaseの責務（1行）】
//   仕訳明細の貸借一致と勘定科目必須を検証し、エラーを返す
//
// 【やること】
//   ✓ 貸借一致チェック（借方合計 = 貸方合計）
//   ✓ 勘定科目必須チェック（drAccount, crAccount）
//
// 【やらないこと】
//   ✗ エラーの優先度付け
//   ✗ 修正方法の提案
//   ✗ 因果関係の解析
//
// 【既存実装】
//   JournalService.validateJournal() (L111-127)
//   JournalService.calculateBalance() (L132-145)
//
// ============================================================================

/**
 * 🔵 ValidateJournalBalance Input Schema
 */
export const ValidateJournalBalanceInputSchema = z.object({
  /**
   * 検証対象の仕訳明細
   *
   * Phase 4で確立したJournalLineSchemaを使用
   */
  lines: z.array(JournalLineSchema)
});

/**
 * 🟢 ValidateJournalBalance Output Schema
 */
export const ValidateJournalBalanceOutputSchema = z.object({
  /**
   * 検証結果
   *
   * true: すべての検証に合格
   * false: 1つ以上のエラーあり
   */
  isValid: z.boolean(),

  /**
   * 貸借差額
   *
   * 計算: 借方合計 - 貸方合計
   * 0なら一致
   */
  balanceDiff: z.number(),

  /**
   * 検出されたエラーの一覧
   *
   * **重要:** 順序に意味はなく、優先度や因果関係を表さない
   * 検出された事実を列挙するのみ
   *
   * 例:
   * - []  （エラーなし）
   * - ["貸借が一致していません (差額: 1000円)"]
   * - ["貸借が一致していません (差額: 2000円)", "勘定科目が未入力の行があります"]
   */
  errors: z.array(z.string())
});

export type ValidateJournalBalanceInput = z.infer<typeof ValidateJournalBalanceInputSchema>;
export type ValidateJournalBalanceOutput = z.infer<typeof ValidateJournalBalanceOutputSchema>;

// ============================================================================
// Phase 4.5 の成功パターン（3 UseCases確立）
// ============================================================================
//
// ✅ optional = 0
// ✅ 判断なし（純変換・純検証）
// ✅ UI/AI/人間から完全分離
// ✅ 責務が1行で説明できる
// ✅ Phase 4のスキーマを再利用（JobSchema, JournalLineSchema）
//
// 確立したUseCase:
// 1. ExportJournalCSV - CSV形式変換
// 2. ImportJournalCSV - CSV形式逆変換
// 3. ValidateJournalBalance - 仕訳検証
//
// この基準を満たすUseCaseだけをPhase 4.5で扱う
// ============================================================================
