/**
 * fetchWithRetry — 指数バックオフ付きfetch
 *
 * ネットワークエラー（ECONNREFUSED等）時のみリトライ。
 * HTTP応答あり（4xx/5xx含む）はリトライしない。
 *
 * リトライ設計根拠:
 * - APIサーバー起動時間: 実測2.6秒
 * - maxRetries=3, baseDelay=1000ms → 最大待機: 1+2+4=7秒
 * - 2.6秒で起動するなら2回目（1秒後）または3回目（3秒後）で成功する
 *
 * Supabase移行後もネットワーク瞬断対策として活用可能。
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = baseDelayMs * 2 ** attempt;
      console.warn(
        `[fetchWithRetry] ${String(input)} 失敗（${attempt + 1}/${maxRetries + 1}）。${delay}ms後にリトライ`
      );
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('unreachable');
}
