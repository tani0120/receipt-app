/**
 * AIモデル設定の一元管理
 *
 * モデル名のハードコードを排除し、全箇所でこの定数を参照する。
 * 変更時はここだけ修正すれば全サービスに反映される。
 *
 * 環境変数 VERTEX_MODEL_ID が設定されている場合はそちらを優先。
 *
 * モデル用途別:
 *   - VERTEX_MODEL_ID: previewExtract（証票分類・OCR）用
 *   - ACCOUNT_ESTIMATE_MODEL: estimateAccountByAI（科目推定・第5層）用
 *   - AI_COMMAND_MODEL: AIコマンド（チャット）用（aiCommandRoutes.tsで管理）
 */

/** デフォルトモデルID（環境変数未設定時のフォールバック） */
export const DEFAULT_MODEL_ID = 'gemini-3.1-flash-lite';

/**
 * 現在のモデルIDを取得する。
 * 環境変数 VERTEX_MODEL_ID > DEFAULT_MODEL_ID の優先順。
 */
export function getDefaultModelId(): string {
  return process.env['VERTEX_MODEL_ID'] ?? DEFAULT_MODEL_ID;
}

/** 科目推定用デフォルトモデルID（環境変数未設定時のフォールバック） */
export const ACCOUNT_ESTIMATE_MODEL_ID = 'gemini-3.1-flash-lite';

/**
 * 科目推定用モデルIDを取得する。
 * 環境変数 ACCOUNT_ESTIMATE_MODEL > ACCOUNT_ESTIMATE_MODEL_ID の優先順。
 */
export function getAccountEstimateModelId(): string {
  return process.env['ACCOUNT_ESTIMATE_MODEL'] ?? ACCOUNT_ESTIMATE_MODEL_ID;
}

/**
 * モデル別料金テーブル（$/100万トークン）
 * 2026-05-20 公式価格: https://ai.google.dev/pricing
 */
export const MODEL_PRICING: Record<string, { input: number; output: number; thinking: number }> = {
  'gemini-2.5-flash':       { input: 0.30, output: 2.50, thinking: 0 },
  'gemini-3-flash-preview': { input: 0.50, output: 3.00, thinking: 0 },
  'gemini-3.1-flash-lite':  { input: 0.25, output: 1.50, thinking: 0 },
  'gemini-3.5-flash':       { input: 1.50, output: 9.00, thinking: 0 },
  'gemini-3.1-pro':         { input: 2.00, output: 12.00, thinking: 0 },
};

/** 為替レート（USD → JPY） */
export const USD_JPY_RATE = 150;

/** コスト計算結果 */
export interface CostCalcResult {
  /** 推定コスト（円） */
  costYen: number
  /** 入力単価（$/1Mトークン） */
  inputPricePerM: number
  /** 出力単価（$/1Mトークン） */
  outputPricePerM: number
}

/**
 * トークン数とモデル名からコスト（円）を計算する。
 * 記録時点の単価も返す（後の検算用）。
 */
export function calculateCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number,
  thinkingTokens = 0,
): CostCalcResult {
  const price = MODEL_PRICING[modelId] ?? MODEL_PRICING[DEFAULT_MODEL_ID]!;
  const costUsd =
    (promptTokens * price.input / 1_000_000) +
    (completionTokens * price.output / 1_000_000) +
    (thinkingTokens * price.thinking / 1_000_000);
  return {
    costYen: Math.round(costUsd * USD_JPY_RATE * 10000) / 10000,
    inputPricePerM: price.input,
    outputPricePerM: price.output,
  };
}

