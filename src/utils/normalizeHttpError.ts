/**
 * normalizeHttpError.ts — fetchレスポンスを共通エラー型に正規化
 *
 * 移行後もfetch（Drive API等の独自エンドポイント）は残るため、このファイルは変更不要。
 * Supabaseクライアント用には normalizeSupabaseError.ts を追加する。
 */

/** 共通エラー型（全正規化関数がこれを返す） */
export interface AppError {
  /** HTTPステータスコード（表示・分岐用） */
  コード: number;
  /** エラーメッセージ（安全な定型文） */
  メッセージ: string;
  /** リクエスト先パス */
  パス: string;
  /** サーバー発行のリクエストID（ログ検索キー） */
  リクエストID: string;
}

/**
 * fetch Response → AppError に変換。
 *
 * 使い方:
 *   const res = await fetch('/api/xxx');
 *   if (!res.ok) return handleApiError(router, res);
 */
export async function normalizeHttpError(res: Response): Promise<AppError> {
  let メッセージ = res.statusText || `HTTP ${res.status}`;
  let リクエストID = res.headers.get('X-Request-Id') || '';

  // JSONレスポンスからerrorメッセージとrequestIdを取得（あれば）
  try {
    const body = await res.clone().json();
    if (body?.error && typeof body.error === 'string') {
      メッセージ = body.error;
    }
    if (body?.requestId && typeof body.requestId === 'string') {
      リクエストID = body.requestId;
    }
  } catch {
    // JSONでない場合は無視
  }

  return {
    コード: res.status,
    メッセージ,
    パス: new URL(res.url).pathname,
    リクエストID,
  };
}

