/**
 * AIコマンド（AiCommand）ドメイン型定義
 *
 * 分割元: repositories/types.ts §10
 * 用途: AIコマンド機能の操作ログ・会話履歴・コスト管理
 * 設計書: docs/genzai/35_ai_command_design.md
 */

/** AIコマンドのコスト分類（2分類: 仕訳操作 vs 質問・MCP） */
export type AiCostCategory = 'journal_operation' | 'mcp_query'

/** AIコマンド操作ログ（§2-9: 再実行 + WRITE修復の2役割） */
export interface AiCommandLog {
  /** 一意ID（例: ai-log-20260520T130000-abc123） */
  id: string
  /** 実行日時（ISO 8601） */
  executedAt: string
  /** 実行したスタッフID */
  staffId: string
  /** 対象顧問先ID（クロス集計用） */
  clientId: string
  /** ユーザーの自然言語入力 */
  inputText: string
  /** AIが判定したツール名 */
  toolName: string | null
  /** AIが判定したパラメータ（JSON） */
  toolParams: Record<string, unknown> | null
  /** 実行結果: 成功/失敗 */
  status: 'success' | 'failure' | 'cancelled'
  /** レスポンス要約（AI生成の自然言語） */
  responseSummary: string
  /** WRITE操作の場合: 確認モーダルの承認/拒否 */
  writeConfirmed: boolean | null
  /** WRITE操作の結果詳細（作成された仕訳ID・取引先コード等。修復時に使用） */
  writeResultDetail: Record<string, unknown> | null
  /** WRITE操作の変更前スナップショット（更新操作の場合） */
  writeBeforeSnapshot: Record<string, unknown> | null
  /** コンテキスト情報（ページパス・選択テキスト等） */
  context: AiCommandContext | null
  /** コスト分類 */
  costCategory: AiCostCategory

  // ── クロス集計用フィールド（コスト追跡） ──

  /** 使用モデル名（例: 'gemini-3.5-flash'） */
  model?: string
  /** 処理層（2=カタログ+FAQ, 3=Function Calling） */
  layer?: 2 | 3
  /** 入力トークン数 */
  promptTokens?: number
  /** 出力トークン数 */
  completionTokens?: number
  /** 思考トークン数 */
  thinkingTokens?: number
  /** 合計トークン数 */
  totalTokens?: number
  /** 入力単価（$/1Mトークン。記録時点の料金。後の検算用） */
  inputPricePerM?: number
  /** 出力単価（$/1Mトークン） */
  outputPricePerM?: number
  /** 推定コスト（円） */
  estimatedCostYen?: number
  /** 層3で呼び出したMCPツール名一覧 */
  toolsCalled?: string[]
}

/** AIコマンドのコンテキスト情報（§2-10: 4レベル） */
export interface AiCommandContext {
  /** 現在のページパス（Vue Router route.path） */
  pagePath: string | null
  /** ページパラメータ（route.params。例: { clientId: 'c_rODnkCDN' }） */
  pageParams: Record<string, string> | null
  /** ユーザーが選択したテキスト（window.getSelection()） */
  selectedText: string | null
  /** 表示中のUI情報（テーブルデータ等。コンポーネントが提供） */
  visibleData: Record<string, unknown> | null
}

/** AI会話メッセージ（§2-4: 会話履歴） */
export interface AiChatMessage {
  /** メッセージID */
  id: string
  /** ロール: ユーザー入力 or AI応答 */
  role: 'user' | 'assistant'
  /** メッセージ本文 */
  content: string
  /** 応答形式（AI応答時のみ） */
  responseType?: 'text' | 'table' | 'action' | 'mixed'
  /** テーブルデータ（type='table' or 'mixed' の場合） */
  tableData?: { headers: string[]; rows: string[][] } | null
  /** アクションボタン（type='action' or 'mixed' の場合） */
  actions?: AiActionButton[] | null
  /** 次の操作候補（AIが提案） */
  suggestions?: string[] | null
  /** 送信日時（ISO 8601） */
  timestamp: string
}

/** AIアクションボタン（§2-3: アクションボタン付き応答） */
export interface AiActionButton {
  /** ボタンラベル（例: '仕訳を作成'） */
  label: string
  /** 実行するコマンド（ツール名） */
  command: string
  /** コマンドパラメータ */
  params: Record<string, unknown>
  /** 確認モーダルが必要か（WRITE操作=true） */
  requireConfirm: boolean
}

/** AI会話セッション（§2-4: スタッフ全員共有） */
export interface AiChatSession {
  /** セッションID */
  id: string
  /** 開始したスタッフID */
  staffId: string
  /** 会話メッセージ一覧 */
  messages: AiChatMessage[]
  /** 作成日時（ISO 8601） */
  createdAt: string
  /** 最終更新日時（ISO 8601） */
  updatedAt: string
}

/** AIコスト記録（§2-7: 月額上限管理） */
export interface AiCostRecord {
  /** 年月（YYYY-MM形式） */
  yearMonth: string
  /** コスト分類 */
  category: AiCostCategory
  /** リクエスト数 */
  requestCount: number
  /** 推定費用（円） */
  estimatedCostYen: number
  /** プロンプトトークン数 */
  promptTokens: number
  /** 補完トークン数 */
  completionTokens: number
}

/** AIコスト上限設定（管理者が設定。§2-7） */
export interface AiCostLimit {
  /** コスト分類 */
  category: AiCostCategory
  /** 月額上限（リクエスト数。0=無制限） */
  monthlyRequestLimit: number
  /** 月額上限（円。0=無制限） */
  monthlyCostLimitYen: number
}
