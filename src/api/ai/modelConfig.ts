/**
 * AIモデル設定の一元管理
 *
 * モデル名のハードコードを排除し、全箇所でこの定数を参照する。
 * 変更時はここだけ修正すれば全サービスに反映される。
 *
 * 環境変数 VERTEX_MODEL_ID が設定されている場合はそちらを優先。
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

/**
 * モデル別料金テーブル（$/100万トークン）
 * 2026-05-20 公式価格: https://ai.google.dev/pricing
 */
export const MODEL_PRICING: Record<string, { input: number; output: number; thinking: number }> = {
  'gemini-2.5-flash':       { input: 0.30, output: 2.50, thinking: 0 },
  'gemini-3-flash-preview': { input: 0.50, output: 3.00, thinking: 0 },
  'gemini-3.1-flash-lite':  { input: 0.25, output: 1.50, thinking: 0 },
  'gemini-3.5-flash':       { input: 1.50, output: 9.00, thinking: 0 },
};

/** 為替レート（USD → JPY） */
export const USD_JPY_RATE = 150;
