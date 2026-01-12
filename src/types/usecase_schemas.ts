import { z } from 'zod';
import { JobSchema } from './zod_schema';

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
// Phase 4.5 の成功パターン（ExportJournalCSV/ImportJournalCSVで確立）
// ============================================================================
//
// ✅ optional = 0
// ✅ 判断なし（純変換）
// ✅ UI/AI/人間から完全分離
// ✅ 責務が1行で説明できる
// ✅ Phase 4のスキーマを再利用（JobSchema）
//
// この基準を満たすUseCaseだけをPhase 4.5で扱う
// ============================================================================
