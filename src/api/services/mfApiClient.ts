/**
 * mfApiClient.ts — マネーフォワード 認可サーバーAPI クライアント
 *
 * レイヤー: ★service★
 * 責務: MF認可サーバーAPI（api.biz.moneyforward.com）へのHTTPリクエスト送信
 *
 * ⚠️ 会計API（api-accounting.moneyforward.com）はCloudflare WAFで全面403ブロック。
 *    会計データの取得にはMCPサーバー経由（mfMcpClient.ts）を使用すること。
 *
 * 準拠:
 *   - load_context.md L130: ロジックはAPI側に書け
 *   - 34_mf_mcp_integration.md §15: WAFブロック調査記録
 */

import { getValidAccessToken, MF_API_BASE_URL } from './mfAuthService'

// ---------- 汎用リクエスト ----------

/**
 * MF認可サーバーAPIに認証付きGETリクエストを送信する
 * @param path APIパス（例: '/v2/tenant'）
 * @param tokenKey トークンストアのキー
 */
async function mfGet<T>(path: string, tokenKey?: string): Promise<T> {
  const accessToken = await getValidAccessToken(tokenKey)

  const res = await fetch(`${MF_API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`[mfApiClient] GET ${path} 失敗 (${res.status}): ${errorBody}`)
  }

  return res.json() as Promise<T>
}

// ---------- 事業者情報（認可サーバーAPI — WAFブロック対象外） ----------

/**
 * 事業者情報を取得する（GET /v2/tenant）— 認可サーバーAPI
 * @returns tenant_code（事業者コード）, tenant_name（事業者名）
 */
export async function fetchTenant(): Promise<Record<string, unknown>> {
  return await mfGet<Record<string, unknown>>('/v2/tenant')
}
