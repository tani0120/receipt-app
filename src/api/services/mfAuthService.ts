import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/**
 * mfAuthService.ts — マネーフォワード クラウド会計API OAuth 2.0 認証サービス
 *
 * レイヤー: ★service★
 * 責務: MF APIとのOAuth認証フロー（認可URL生成・トークン取得・リフレッシュ）
 *
 * 準拠:
 *   - load_context.md L130: ロジックはAPI側に書け
 *   - load_context.md L101: APIキー・トークンのgit対象禁止
 *   - code_quality.md §0: Supabase移行後にも壊れない構造
 *
 * Supabase移行時: トークン保存先をメモリ → Supabaseテーブルに差し替えるだけ
 */

// ---------- 定数 ----------

/** MF OAuth認可エンドポイント */
const MF_AUTH_URL = 'https://api.biz.moneyforward.com/authorize'

/** MF トークンエンドポイント */
const MF_TOKEN_URL = 'https://api.biz.moneyforward.com/token'

/** MF API ベースURL */
export const MF_API_BASE_URL = 'https://api.biz.moneyforward.com'

/** OAuthスコープ（MCPサーバー要求スコープ + 事業者情報） */
const MF_SCOPES = [
  'mfc/admin/tenant.read',
  'mfc/accounting/offices.read',
  'mfc/accounting/accounts.read',
  'mfc/accounting/departments.read',
  'mfc/accounting/journal.read',
  'mfc/accounting/journal.write',
  'mfc/accounting/report.read',
  'mfc/accounting/taxes.read',
  'mfc/accounting/trade_partners.read',
  'mfc/accounting/trade_partners.write',
  'mfc/accounting/connected_account.read',
  'mfc/accounting/transaction.write',
].join(' ')

// ---------- 環境変数 ----------

function getClientId(): string {
  const id = process.env.MF_CLIENT_ID
  if (!id) throw new Error('[mfAuthService] MF_CLIENT_ID が .env.local に設定されていません')
  return id
}

function getClientSecret(): string {
  const secret = process.env.MF_CLIENT_SECRET
  if (!secret) throw new Error('[mfAuthService] MF_CLIENT_SECRET が .env.local に設定されていません')
  return secret
}

function getRedirectUri(): string {
  return process.env.MF_REDIRECT_URI ?? 'http://localhost:5173/callback'
}

// ---------- トークン保存（JSONファイル永続化 + メモリキャッシュ） ----------
// Supabase移行時にDB保存に差し替え予定

/** トークン情報（事業所単位で保持） */
export interface MfTokenData {
  /** アクセストークン */
  accessToken: string
  /** リフレッシュトークン */
  refreshToken: string
  /** アクセストークンの有効期限（Unix ms） */
  expiresAt: number
  /** 事業所ID（office_id） */
  officeId?: string
  /** 事業所名 */
  officeName?: string
}

/** トークン永続化ファイルパス（.gitignore済み） */
const TOKEN_FILE_PATH = resolve(process.cwd(), 'data', 'mf-tokens.json')

/** メモリキャッシュ（起動時にファイルから復元） */
const tokenStore = new Map<string, MfTokenData>()

/** デフォルトのトークンキー（シングルテナント開発用） */
const DEFAULT_TOKEN_KEY = 'default'

// ---------- ファイル永続化ヘルパー ----------

/** ファイルからトークンを読み込み、メモリに復元する */
function loadTokensFromFile(): void {
  try {
    if (existsSync(TOKEN_FILE_PATH)) {
      const raw = readFileSync(TOKEN_FILE_PATH, 'utf8')
      const data = JSON.parse(raw) as Record<string, MfTokenData>
      for (const [key, value] of Object.entries(data)) {
        tokenStore.set(key, value)
      }
      console.log(`[mfAuthService] トークン復元: ${Object.keys(data).length}件 (${TOKEN_FILE_PATH})`)
    }
  } catch (e) {
    console.warn('[mfAuthService] トークンファイル読み込みスキップ:', (e as Error).message)
  }
}

/** メモリのトークンをファイルに保存する */
function saveTokensToFile(): void {
  try {
    const dir = dirname(TOKEN_FILE_PATH)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    const data: Record<string, MfTokenData> = {}
    for (const [key, value] of tokenStore.entries()) {
      data[key] = value
    }
    writeFileSync(TOKEN_FILE_PATH, JSON.stringify(data, null, 2), 'utf8')
  } catch (e) {
    console.error('[mfAuthService] トークンファイル保存失敗:', (e as Error).message)
  }
}

// 起動時にファイルからトークンを復元
loadTokensFromFile()

// ---------- 認可URL生成 ----------

/**
 * MF OAuth認可画面のURLを生成する
 * @param state CSRF防止用のランダム文字列
 * @returns 認可画面URL
 */
export function buildAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: MF_SCOPES,
    state,
  })
  return `${MF_AUTH_URL}?${params.toString()}`
}

// ---------- トークン取得（認可コード → アクセストークン） ----------

/**
 * 認可コードをアクセストークンに交換する
 * @param code MFから返された認可コード
 * @returns トークン情報
 */
export async function exchangeCodeForToken(code: string, clientId: string): Promise<MfTokenData> {
  const mfClientId = getClientId()
  const clientSecret = getClientSecret()

  // CLIENT_SECRET_BASIC: Authorization ヘッダーに Base64(client_id:client_secret)
  const basicAuth = Buffer.from(`${mfClientId}:${clientSecret}`).toString('base64')

  const res = await fetch(MF_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: getRedirectUri(),
    }).toString(),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`[mfAuthService] トークン取得失敗 (${res.status}): ${errorBody}`)
  }

  const data = await res.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
  }

  const tokenData: MfTokenData = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  // clientId別に保存（メモリ + ファイル）
  tokenStore.set(clientId, tokenData)
  saveTokensToFile()
  console.log(`[mfAuthService] トークン保存: clientId=${clientId}`)

  return tokenData
}

// ---------- トークンリフレッシュ ----------

/**
 * リフレッシュトークンでアクセストークンを再取得する
 * @param key トークンストアのキー
 * @returns 更新されたトークン情報
 */
export async function refreshAccessToken(key: string = DEFAULT_TOKEN_KEY): Promise<MfTokenData> {
  const current = tokenStore.get(key)
  if (!current?.refreshToken) {
    throw new Error(`[mfAuthService] リフレッシュトークンが存在しません (key=${key})`)
  }

  const clientId = getClientId()
  const clientSecret = getClientSecret()
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(MF_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: current.refreshToken,
    }).toString(),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`[mfAuthService] トークンリフレッシュ失敗 (${res.status}): ${errorBody}`)
  }

  const data = await res.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
  }

  const updated: MfTokenData = {
    ...current,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  tokenStore.set(key, updated)
  saveTokensToFile()

  return updated
}

// ---------- トークン取得（自動リフレッシュ付き） ----------

/**
 * 有効なアクセストークンを取得する（期限切れなら自動リフレッシュ）
 * @param key トークンストアのキー
 * @returns アクセストークン文字列
 */
export async function getValidAccessToken(key: string = DEFAULT_TOKEN_KEY): Promise<string> {
  const current = tokenStore.get(key)
  if (!current) {
    throw new Error(`[mfAuthService] 未認証です。先にOAuth認可を完了してください (key=${key})`)
  }

  // 有効期限の5分前にリフレッシュ（余裕を持たせる）
  const BUFFER_MS = 5 * 60 * 1000
  if (Date.now() >= current.expiresAt - BUFFER_MS) {
    const refreshed = await refreshAccessToken(key)
    return refreshed.accessToken
  }

  return current.accessToken
}

// ---------- ステータス確認 ----------

/**
 * 現在の認証状態を取得する
 * @param key トークンストアのキー
 */
export function getAuthStatus(key: string = DEFAULT_TOKEN_KEY): {
  /** 認証済みか */
  authenticated: boolean
  /** トークンの有効期限（ISO文字列） */
  expiresAt: string | null
  /** 事業所ID */
  officeId: string | null
  /** 事業所名 */
  officeName: string | null
} {
  const token = tokenStore.get(key)
  if (!token) {
    return { authenticated: false, expiresAt: null, officeId: null, officeName: null }
  }
  return {
    authenticated: true,
    expiresAt: new Date(token.expiresAt).toISOString(),
    officeId: token.officeId ?? null,
    officeName: token.officeName ?? null,
  }
}

/**
 * トークンに事業所情報を紐付ける
 */
export function setOfficeInfo(key: string, officeId: string, officeName: string): void {
  const token = tokenStore.get(key)
  if (token) {
    token.officeId = officeId
    token.officeName = officeName
    tokenStore.set(key, token)
    saveTokensToFile()
  }
}

/**
 * トークンを削除する（ログアウト用）
 */
export function clearToken(key: string = DEFAULT_TOKEN_KEY): void {
  tokenStore.delete(key)
  saveTokensToFile()
}
