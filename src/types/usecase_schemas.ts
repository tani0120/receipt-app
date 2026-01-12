import { z } from 'zod';
import { JobSchema, JournalLineSchema, ClientSchema } from './zod_schema';

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
// 🎯 ValidateJournalBalance（仕訳貸借一致検証）
// ============================================================================
//
// 【UseCaseの責務（1行）】
//   仕訳明細の貸借一致を検証し、差額を返す
//
// 【やること】
//   ✓ 借方合計・貸方合計の計算
//   ✓ 貸借差額の算出
//   ✓ 一致判定（差額 = 0）
//
// 【やらないこと】
//   ✗ 仕訳の修正
//   ✗ エラーの自動修正
//   ✗ AI判定
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
   * 貸借一致判定
   *
   * true: 貸借一致（差額 = 0）
   * false: 貸借不一致
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
   * エラーメッセージ
   *
   * 例: ["貸借が一致していません (差額: 1000円)"]
   * 空配列 = 正常
   */
  errors: z.array(z.string())
});

export type ValidateJournalBalanceInput = z.infer<typeof ValidateJournalBalanceInputSchema>;
export type ValidateJournalBalanceOutput = z.infer<typeof ValidateJournalBalanceOutputSchema>;

// ============================================================================
// 🎯 FormatClientMaster（クライアント情報整形）
// ============================================================================
//
// 【UseCaseの責務（1行）】
//   クライアント情報を表示用・エクスポート用の形式に整形する
//
// 【やること】
//   ✓ 会社名の整形（株式会社の位置統一等）
//   ✓ クライアントコードの正規化
//   ✓ 決算月の表示形式変換
//
// 【やらないこと】
//   ✗ クライアント情報の検証
//   ✗ データの保存
//   ✗ AI判定
//
// ============================================================================

/**
 * 🔵 FormatClientMaster Input Schema
 */
export const FormatClientMasterInputSchema = z.object({
  /**
   * 整形対象のクライアント情報
   *
   * Phase 4で確立したClientSchemaを使用
   */
  client: ClientSchema
});

/**
 * 🟢 FormatClientMaster Output Schema
 */
export const FormatClientMasterOutputSchema = z.object({
  /**
   * 整形された会社名
   *
   * 例: "株式会社サンプル" → "サンプル（株）"
   */
  formattedName: z.string(),

  /**
   * 整形されたクライアントコード
   *
   * 例: "cli001" → "CLI001" (大文字統一)
   */
  formattedCode: z.string(),

  /**
   * 決算月の表示形式
   *
   * 例: 3 → "3月", 12 → "12月"
   */
  fiscalYearEnd: z.string()
});

export type FormatClientMasterInput = z.infer<typeof FormatClientMasterInputSchema>;
export type FormatClientMasterOutput = z.infer<typeof FormatClientMasterOutputSchema>;

// ============================================================================
// Phase 4.5 の成功パターン（4 UseCases確立）
// ============================================================================
//
// ✅ optional = 0
// ✅ 判断なし（純変換・純検証・純整形）
// ✅ UI/AI/人間から完全分離
// ✅ 責務が1行で説明できる
// ✅ Phase 4スキーマ再利用（JobSchema, JournalLineSchema, ClientSchema）
//
// 確立したUseCase:
// 1. ExportJournalCSV - CSV形式変換
// 2. ImportJournalCSV - CSV形式逆変換
// 3. ValidateJournalBalance - 貸借一致検証
// 4. FormatClientMaster - クライアント情報整形
//
// この基準を満たすUseCaseだけをPhase 4.5で扱う
// ============================================================================

