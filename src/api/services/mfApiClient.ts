/**
 * mfApiClient.ts — マネーフォワード クラウド会計API クライアント
 *
 * レイヤー: ★service★
 * 責務: MF APIへのHTTPリクエスト送信（認証ヘッダー自動付与）
 *
 * 準拠:
 *   - load_context.md L130: ロジックはAPI側に書け
 *   - load_context.md L80: Repositoryはデータの出し入れだけ
 */

import { getValidAccessToken, MF_API_BASE_URL } from './mfAuthService'

// ---------- 型定義（MF APIレスポンス） ----------

/** MF 事業所情報 */
export interface MfOffice {
  /** 事業所ID */
  id: string
  /** 事業所名 */
  name: string
  /** 事業形態: 'corporate'（法人）| 'individual'（個人） */
  type: 'corporate' | 'individual'
  /** 法人番号（13桁）。個人は null */
  corporate_number: string | null
  /** インボイス登録番号。未登録は null */
  invoice_registration_number: string | null
  /** 作成日時（ISO 8601） */
  created_at: string
  /** 更新日時（ISO 8601） */
  updated_at: string
  /** 会計年度の配列 */
  fiscal_years: MfFiscalYear[]
}

/** MF 会計年度 */
export interface MfFiscalYear {
  /** 会計年度ID */
  id: number
  /** 期首日（YYYY-MM-DD） */
  start_date: string
  /** 期末日（YYYY-MM-DD） */
  end_date: string
  /** 申告区分: 'blue_return'（青色）| 'white_return'（白色） */
  tax_return_type: string
  /** 消費税の課税形式: 'general_tax'（本則）| 'simplified_tax'（簡易）| 'tax_exempt'（免税） */
  tax_scheme: string
  /** 消費税確定申告の有無 */
  has_tax_return: boolean
  /** 端数処理: 'floor'（切捨）| 'round'（四捨五入）| 'ceil'（切上） */
  tax_fraction_rule: string
}

// ---------- 汎用リクエスト ----------

/**
 * MF APIに認証付きGETリクエストを送信する（認可サーバーAPI用）
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

/** 会計API ベースURL（認可サーバーとは別） */
const MF_ACCOUNTING_BASE_URL = 'https://api-accounting.moneyforward.com'

/**
 * MF 会計APIに認証付きGETリクエストを送信する
 * @param path APIパス（例: '/v3/office'）
 * @param tokenKey トークンストアのキー
 */
async function mfAccountingGet<T>(path: string, tokenKey?: string): Promise<T> {
  const accessToken = await getValidAccessToken(tokenKey)

  const res = await fetch(`${MF_ACCOUNTING_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'sugu-suru/1.0 (MF Cloud Accounting API Client)',
    },
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`[mfApiClient] GET ${MF_ACCOUNTING_BASE_URL}${path} 失敗 (${res.status}): ${errorBody}`)
  }

  return res.json() as Promise<T>
}

// ---------- 事業者情報 ----------

/**
 * 事業者情報を取得する（GET /v2/tenant）— 認可サーバーAPI
 * @returns tenant_code, tenant_name のみ
 */
export async function fetchTenant(): Promise<Record<string, unknown>> {
  return await mfGet<Record<string, unknown>>('/v2/tenant')
}

/**
 * 事業者情報を取得する（GET /v3/office）— 会計API ★公式
 * 個人/法人判定、会計期間、従業員数等の業務データが取れる
 * @returns 事業者情報の全フィールド
 */
export async function fetchAccountingOffice(): Promise<Record<string, unknown>> {
  return await mfAccountingGet<Record<string, unknown>>('/v3/office')
}

/**
 * 事業所情報を取得する（GET /api/v1/office）（旧API — フォールバック用）
 * @returns 事業所情報
 */
export async function fetchOffice(): Promise<MfOffice> {
  const data = await mfGet<{ office: MfOffice }>('/api/v1/office')
  return data.office
}

