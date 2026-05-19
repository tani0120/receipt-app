/**
 * mfMcpClient.ts — マネーフォワード MCPサーバー クライアント
 *
 * レイヤー: ★service★
 * 責務: MF MCPサーバー（JSON-RPC over HTTP）への接続・ツール呼び出し
 *
 * 背景:
 *   会計API（api-accounting.moneyforward.com）はCloudflare WAFで全面403ブロック。
 *   MF公式MCPサーバー経由でのアクセスに方針転換（2026-05-18確定）。
 *
 * 準拠:
 *   - load_context.md L130: ロジックはAPI側に書け
 *   - 34_mf_api_integration.md §14: MCPサーバー設計
 *   - code_quality.md §0: Supabase移行後にも壊れない構造
 *
 * Supabase移行時: トランスポート層の差し替えのみ。ツール呼び出しインターフェースは不変。
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { getValidAccessToken } from './mfAuthService'

// ---------- 定数 ----------

/** MF MCPサーバーURL（beta版・推奨） */
const MF_MCP_URL = 'https://beta.mcp.developers.biz.moneyforward.com/mcp/ca/v3'

/** MCPクライアント識別情報 */
const CLIENT_INFO = { name: 'sugu-suru', version: '1.0.0' }

// ---------- 型定義（MCPツールレスポンス） ----------

/** MCPツール呼び出し結果（テキストコンテンツ） */
interface McpToolResult {
  /** ツールが返したコンテンツ配列 */
  content: Array<{
    /** コンテンツ種別（通常 'text'） */
    type: string
    /** テキスト内容（JSON文字列の場合あり） */
    text?: string
  }>
  /** エラー発生フラグ */
  isError?: boolean
}

// ---------- MF MCPレスポンス型 ----------

/** 事業者情報（mfc_ca_currentOffice レスポンス） */
export interface MfMcpOffice {
  /** 事業者名 */
  name: string
  /** 事業者コード（例: 'XXXX-XXXX'） */
  code: string
  /** 種別: 'INDIVIDUAL'（個人）| 'CORPORATE'（法人） ★大文字 */
  type: 'INDIVIDUAL' | 'CORPORATE'
  /** 不動産所得フラグ（個人のみ） */
  is_real_estate?: boolean
  /** 製造原価報告書フラグ */
  is_manufacturing?: boolean
  /** 従業員数区分（法人のみ） */
  employee_count?: string
  /** PL表示オプション（法人のみ） */
  pl_name_value_display_option?: string
  /** 会計期間配列（降順） */
  accounting_periods: Array<{
    /** 会計年度 */
    fiscal_year: number
    /** 期首日（YYYY-MM-DD） */
    start_date: string
    /** 期末日（YYYY-MM-DD） */
    end_date: string
  }>
}

/** 会計年度設定（mfc_ca_getTermSettings レスポンス） */
export interface MfMcpTermSettings {
  /** 会計年度 */
  fiscal_year: number
  /** 期首日 */
  start_date: string
  /** 期末日 */
  end_date: string
  /** 課税形式（'FREE'=免税 / 'GENERAL'=一般 / 'SIMPLIFIED'=簡易 / 'INDIVIDUAL_ALLOCATION'=個別対応 / 'PROPORTIONAL_ALLOCATION'=一括比例） */
  tax_method: string
  /** 経理方式（法人のみ） */
  accounting_method?: string
  /** 業種 */
  business_types: string[]
  /** 都道府県 */
  prefecture: string
  /** 売上消費税端数処理 */
  sales_rounding_method: string
  /** 仕入消費税端数処理 */
  purchases_rounding_method: string
}

/** 勘定科目（mfc_ca_getAccounts レスポンス要素） */
export interface MfMcpAccount {
  /** 勘定科目ID */
  id: string
  /** 科目名 */
  name: string
  /** 勘定科目グループ（'ASSET' / 'LIABILITY' / 'CAPITAL' / 'REVENUE' / 'EXPENSE'） */
  account_group: string
  /** 科目カテゴリ */
  category: string
  /** BS/PL区分 */
  financial_statement_type: string
  /** 利用可否 */
  available: boolean
  /** 検索キー */
  search_key: string
  /** デフォルト税区分ID */
  tax_id: string
  /** 紐づく補助科目 */
  sub_accounts: Array<{
    id: string
    name: string
    search_key: string | null
    tax_id: string
  }>
}

/** 税区分（mfc_ca_getTaxes レスポンス要素） */
export interface MfMcpTax {
  /** 税区分ID */
  id: string
  /** 税区分名（正式名） */
  name: string
  /** 略称 */
  abbreviation: string
  /** 税率（例: 0.1 = 10%） */
  tax_rate: number
  /** 利用可否 */
  available: boolean
  /** 検索キー */
  search_key: string
}

/** 仕訳行の借方/貸方（共通構造） */
export interface MfMcpJournalSide {
  /** 勘定科目ID */
  account_id: string
  /** 勘定科目名（名前解決済み） */
  account_name: string
  /** 金額 */
  value: number
  /** 税区分ID */
  tax_id: string | null
  /** 税区分名 */
  tax_name: string
  /** 税区分正式名 */
  tax_long_name: string
  /** 税額 */
  tax_value: number
  /** 部門ID */
  department_id: string | null
  /** 部門名 */
  department_name: string | null
  /** 補助科目ID */
  sub_account_id: string | null
  /** 補助科目名 */
  sub_account_name: string | null
  /** 取引先コード */
  trade_partner_code: string | null
  /** 取引先名 */
  trade_partner_name: string | null
  /** インボイス区分 */
  invoice_kind: string
}

/** 仕訳（mfc_ca_getJournals レスポンス要素） */
export interface MfMcpJournal {
  /** 仕訳ID */
  id: string
  /** 仕訳番号 */
  number: number
  /** 取引日（YYYY-MM-DD） */
  transaction_date: string
  /** 仕訳種別（'journal_entry' / 'adjusting_entry'） */
  journal_type: string
  /** 入力方法 */
  entered_by: string
  /** 実現済みか */
  is_realized: boolean
  /** メモ */
  memo: string
  /** タグ */
  tags: string[]
  /** 所属会計年度 */
  term_period: number
  /** 作成日時（ISO 8601） */
  create_time: string
  /** 更新日時（ISO 8601） */
  update_time: string
  /** 証憑ファイルID配列 */
  voucher_file_ids: string[]
  /** 仕訳行（借方・貸方の配列） */
  branches: Array<{
    /** 借方 */
    debitor: MfMcpJournalSide
    /** 貸方 */
    creditor: MfMcpJournalSide
    /** 摘要 */
    remark: string
  }>
}

// ---------- 接続管理 ----------

/**
 * トークン別にMCPクライアントをキャッシュする。
 * テナント（clientId）ごとに異なるアクセストークンを使い分けるため Map で管理。
 * key: accessToken文字列 / value: Clientインスタンス
 */
const clientCache = new Map<string, Client>()

/**
 * MCPサーバーに接続し、Clientインスタンスを返す。
 * tokenKey が変わると異なるトークンで接続するためキャッシュミスになる。
 *
 * 接続順序:
 *   1. StreamableHTTP（推奨・MCP標準）
 *   2. SSE（レガシーフォールバック）
 *
 * @param tokenKey mfAuthService のトークンストアキー（clientId = 顧問先ID）
 */
async function getOrCreateClient(tokenKey: string): Promise<Client> {
  const accessToken = await getValidAccessToken(tokenKey)

  // 同一トークンのキャッシュがあればそのまま返す
  const cached = clientCache.get(accessToken)
  if (cached) return cached

  const url = new URL(MF_MCP_URL)
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
  }

  // --- StreamableHTTP を試行 ---
  try {
    const transport = new StreamableHTTPClientTransport(url, {
      requestInit: { headers },
    })
    const client = new Client(CLIENT_INFO)
    await client.connect(transport)
    clientCache.set(accessToken, client)
    console.log(`[mfMcpClient] MCPサーバー接続成功（StreamableHTTP）tokenKey=${tokenKey}`)
    return client
  } catch (streamableErr) {
    console.warn(
      '[mfMcpClient] StreamableHTTP接続失敗、SSEにフォールバック:',
      (streamableErr as Error).message,
    )
  }

  // --- SSE フォールバック ---
  try {
    const transport = new SSEClientTransport(url, {
      requestInit: { headers },
    })
    const client = new Client(CLIENT_INFO)
    await client.connect(transport)
    clientCache.set(accessToken, client)
    console.log(`[mfMcpClient] MCPサーバー接続成功（SSE フォールバック）tokenKey=${tokenKey}`)
    return client
  } catch (sseErr) {
    throw new Error(
      `[mfMcpClient] MCPサーバー接続失敗（StreamableHTTP・SSE両方失敗）: ${(sseErr as Error).message}`,
    )
  }
}

// ---------- 汎用ツール呼び出し ----------

/**
 * MCPツールを呼び出し、結果をパースして返す。
 *
 * @param toolName ツール名（例: 'mfc_ca_currentOffice'）
 * @param args ツール引数（省略時は空オブジェクト）
 * @param tokenKey mfAuthService のトークンストアキー（省略時: 'default'）
 * @returns パース済みのJSONオブジェクト
 */
export async function callMcpTool<T = unknown>(
  toolName: string,
  args: Record<string, unknown> = {},
  tokenKey: string = 'default',
): Promise<T> {
  const client = await getOrCreateClient(tokenKey)

  const result = await client.callTool({
    name: toolName,
    arguments: args,
  }) as McpToolResult

  if (result.isError) {
    const errorText = result.content
      ?.map((c) => c.text ?? '')
      .join('\n') ?? '不明なエラー'
    throw new Error(`[mfMcpClient] ツール「${toolName}」エラー: ${errorText}`)
  }

  // テキストコンテンツからJSONをパース
  const textContent = result.content?.find((c) => c.type === 'text')
  if (!textContent?.text) {
    throw new Error(`[mfMcpClient] ツール「${toolName}」: テキストレスポンスが空です`)
  }

  try {
    return JSON.parse(textContent.text) as T
  } catch {
    // JSONでない場合はテキストをそのまま返す
    return textContent.text as unknown as T
  }
}

// ---------- 個別ツールラッパー ----------
// 全ラッパーに tokenKey 引数を追加。省略時は 'default'（後方互換）

/**
 * 事業者情報を取得する（mfc_ca_currentOffice）
 * @param tokenKey mfAuthService のトークンストアキー（顧問先clientId）
 */
export async function mcpFetchCurrentOffice(tokenKey: string = 'default'): Promise<MfMcpOffice> {
  return await callMcpTool<MfMcpOffice>('mfc_ca_currentOffice', {}, tokenKey)
}

/**
 * 会計年度設定を取得する（mfc_ca_getTermSettings）
 * @param fiscalYear 会計年度（省略時: 最新）
 * @param tokenKey mfAuthService のトークンストアキー
 */
export async function mcpFetchTermSettings(fiscalYear?: number, tokenKey: string = 'default'): Promise<MfMcpTermSettings> {
  const args: Record<string, unknown> = {}
  if (fiscalYear !== undefined) args.fiscal_year = fiscalYear
  return await callMcpTool<MfMcpTermSettings>('mfc_ca_getTermSettings', args, tokenKey)
}

/**
 * 勘定科目一覧を取得する（mfc_ca_getAccounts）
 * @param tokenKey mfAuthService のトークンストアキー
 */
export async function mcpFetchAccounts(tokenKey: string = 'default'): Promise<MfMcpAccount[]> {
  return await callMcpTool<MfMcpAccount[]>('mfc_ca_getAccounts', {}, tokenKey)
}

/**
 * 税区分一覧を取得する（mfc_ca_getTaxes）
 * @param tokenKey mfAuthService のトークンストアキー
 */
export async function mcpFetchTaxes(tokenKey: string = 'default'): Promise<MfMcpTax[]> {
  return await callMcpTool<MfMcpTax[]>('mfc_ca_getTaxes', {}, tokenKey)
}

/**
 * 仕訳一覧を取得する（mfc_ca_getJournals）
 * @param params 検索パラメータ
 * @param tokenKey mfAuthService のトークンストアキー
 */
export async function mcpFetchJournals(params?: {
  /** 取引日の開始日（YYYY-MM-DD） */
  start_date?: string
  /** 取引日の終了日（YYYY-MM-DD） */
  end_date?: string
  /** 勘定科目IDで絞込 */
  account_id?: string
  /** 未実現仕訳フラグ */
  is_realized?: boolean
  /** ページ番号 */
  page?: number
  /** 1ページあたり件数 */
  per_page?: number
}, tokenKey: string = 'default'): Promise<MfMcpJournal[]> {
  const args: Record<string, unknown> = {}
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) args[key] = value
    }
  }
  return await callMcpTool<MfMcpJournal[]>('mfc_ca_getJournals', args, tokenKey)
}

/**
 * 仕訳を個別取得する（mfc_ca_getJournalById）
 * @param journalId 仕訳ID
 * @param tokenKey mfAuthService のトークンストアキー
 */
export async function mcpFetchJournalById(journalId: string, tokenKey: string = 'default'): Promise<MfMcpJournal> {
  return await callMcpTool<MfMcpJournal>('mfc_ca_getJournalById', { id: journalId }, tokenKey)
}

/**
 * 取引先一覧を取得する（mfc_ca_getTradePartners）
 * @param tokenKey mfAuthService のトークンストアキー
 */
export async function mcpFetchTradePartners(tokenKey: string = 'default'): Promise<Array<{
  code: string
  name: string
  search_key: string
  corporate_number: string
  invoice_registration_number: string
  available: boolean
}>> {
  return await callMcpTool('mfc_ca_getTradePartners', {}, tokenKey)
}

/**
 * 部門一覧を取得する（mfc_ca_getDepartments）
 * @param tokenKey mfAuthService のトークンストアキー
 */
export async function mcpFetchDepartments(tokenKey: string = 'default'): Promise<Array<{
  id: string
  name: string
}>> {
  return await callMcpTool('mfc_ca_getDepartments', {}, tokenKey)
}

/**
 * 補助科目一覧を取得する（mfc_ca_getSubAccounts）
 * @param tokenKey mfAuthService のトークンストアキー
 */
export async function mcpFetchSubAccounts(tokenKey: string = 'default'): Promise<Array<{
  id: string
  account_id: string
  name: string
  search_key: string | null
  tax_id: string
}>> {
  return await callMcpTool('mfc_ca_getSubAccounts', {}, tokenKey)
}

/**
 * 連携サービス一覧を取得する（mfc_ca_getConnectedAccounts）
 * @param tokenKey mfAuthService のトークンストアキー
 */
export async function mcpFetchConnectedAccounts(tokenKey: string = 'default'): Promise<Array<{
  id: string
  name: string
}>> {
  return await callMcpTool('mfc_ca_getConnectedAccounts', {}, tokenKey)
}

// ---------- WRITE系ツール ----------

/**
 * 仕訳を作成する（mfc_ca_postJournals）
 * @param journal 仕訳データ
 */
export async function mcpCreateJournal(journal: {
  transaction_date: string
  journal_type: string
  branches: Array<{
    debitor: {
      account_id: string
      value: number
      tax_id?: string
      sub_account_id?: string
      department_id?: string
      trade_partner_code?: string
      invoice_kind?: string
    }
    creditor: {
      account_id: string
      value: number
      tax_id?: string
      sub_account_id?: string
      department_id?: string
      trade_partner_code?: string
      invoice_kind?: string
    }
    remark?: string
  }>
  memo?: string
  tags?: string[]
}): Promise<unknown> {
  return await callMcpTool('mfc_ca_postJournals', journal as unknown as Record<string, unknown>)
}

/**
 * 仕訳を更新する（mfc_ca_putJournals）
 * @param journal 仕訳データ（id必須）
 */
export async function mcpUpdateJournal(journal: {
  id: string
  transaction_date: string
  journal_type: string
  branches: Array<{
    debitor: {
      account_id: string
      value: number
      tax_id?: string
    }
    creditor: {
      account_id: string
      value: number
      tax_id?: string
    }
    remark?: string
  }>
}): Promise<unknown> {
  return await callMcpTool('mfc_ca_putJournals', journal as unknown as Record<string, unknown>)
}

/**
 * 取引先を作成する（mfc_ca_postTradePartners）
 */
export async function mcpCreateTradePartner(partner: {
  name: string
  search_key?: string
  corporate_number?: string
  invoice_registration_number?: string
}): Promise<unknown> {
  return await callMcpTool('mfc_ca_postTradePartners', partner as unknown as Record<string, unknown>)
}

// ---------- 接続管理 ----------

/**
 * 全MCPクライアントを切断する（サーバーシャットダウン時に呼ぶ）
 */
export async function disconnectMcp(): Promise<void> {
  for (const [token, client] of clientCache) {
    try {
      await client.close()
    } catch {
      // 無視
    }
    clientCache.delete(token)
  }
  console.log('[mfMcpClient] 全MCPクライアント切断')
}
