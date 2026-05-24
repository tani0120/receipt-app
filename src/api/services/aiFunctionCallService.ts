/**
 * aiFunctionCallService.ts — 層3 Function Calling サービス
 *
 * 責務:
 *   - MCPサーバーからツール一覧を動的取得 → READ系のみGeminiに公開
 *   - Gemini Function Calling でMCPデータ取得→自然言語回答を生成
 *   - WRITE系は定義しない → LLMは呼べない → suggestで返す
 *
 * 処理フロー:
 *   1. MCPからツール一覧を取得（キャッシュ1時間）
 *   2. post/put/delete を除外して読み取り系のみ残す
 *   3. MCPのJSON SchemaをGemini FunctionDeclarationに変換
 *   4. LLMにユーザー入力 + ツール定義を送る
 *   5. LLMがツール呼び出しを返したら → MCPで実際にデータ取得
 *   6. 取得データをLLMに返す → LLMが自然言語で最終回答を生成
 *
 * 準拠:
 *   - 34_command_catalog.md AIは馬鹿。嘘をつく。ブレる。
 *   - 37_infra_mcp.md MCPサーバー設計（READ系15ツール、WRITE系4ツール）
 */

import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import type { FunctionDeclaration, Content, Part } from '@google/genai'
import { callMcpTool, listMcpTools } from './mfMcpClient'
import type { McpToolInfo } from './mfMcpClient'
import { getLayer2SystemPrompt } from './aiContextProvider'
import { VALID_COMMAND_IDS } from './commandCatalog'
import { getAll as getAllClients } from './clientStore'
import { getAll as getAllStaff } from './staffStore'
import { getAuthStatus } from './mfAuthService'

/** AIコマンドで使用するモデル（環境変数 > デフォルト: gemini-3.5-flash） */
function getAiCommandModel(): string {
  return process.env['AI_COMMAND_MODEL'] ?? 'gemini-3.5-flash'
}

// ===== WRITE系ツール名パターン（除外対象） =====
const WRITE_TOOL_PATTERNS = ['post', 'put', 'delete', 'create', 'update']

/**
 * MCPツールがWRITE系かどうかを判定
 * post/put/delete を含むツール名をWRITE系とみなす
 */
function isWriteTool(toolName: string): boolean {
  const lower = toolName.toLowerCase()
  return WRITE_TOOL_PATTERNS.some(pattern => lower.includes(pattern))
}

/**
 * JSON Schemaの配列型プロパティにitemsがない場合にデフォルト値を補完する。
 * Gemini APIは type='array' に items を要求するが、MCPスキーマにはないことがある。
 */
function fixArrayItems(schema: Record<string, unknown>): Record<string, unknown> {
  if (!schema || typeof schema !== 'object') return schema

  const result = { ...schema }

  // 配列型でitemsがない → items: {type: 'string'} を補完
  if (result.type === 'array' && !result.items) {
    result.items = { type: 'string' }
  }

  // propertiesの再帰処理
  if (result.properties && typeof result.properties === 'object') {
    const fixedProps: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(result.properties as Record<string, unknown>)) {
      fixedProps[key] = fixArrayItems(val as Record<string, unknown>)
    }
    result.properties = fixedProps
  }

  // items自体も再帰
  if (result.items && typeof result.items === 'object') {
    result.items = fixArrayItems(result.items as Record<string, unknown>)
  }

  return result
}

/**
 * MCPツール定義 → Gemini FunctionDeclaration に変換
 * MCPのinputSchema（JSON Schema）をGemini互換に変換して渡す
 */
function mcpToolToFunctionDeclaration(tool: McpToolInfo): FunctionDeclaration {
  const rawSchema = (tool.inputSchema ?? { type: 'object', properties: {} }) as Record<string, unknown>
  const fixedSchema = fixArrayItems(rawSchema)

  return {
    name: tool.name,
    description: tool.description ?? tool.name,
    parameters: fixedSchema as FunctionDeclaration['parameters'],
  }
}

// ===== レスポンス型 =====

export interface AiFunctionCallResponse {
  /** モード: answer=自然言語回答, suggest=コマンド候補 */
  mode: 'answer' | 'suggest'
  /** 自然言語回答（answerモード時） */
  answer?: string
  /** コマンド候補（suggestモード時） */
  suggestions: Array<{ command: string; label: string; description: string }>
  /** 補足説明 */
  supplement?: string
  /** 呼び出したツール */
  toolsCalled: string[]
  /** トークン使用量 */
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}

/**
 * 顧問先マスタ・スタッフマスタをプロンプト用テキストに整形する。
 * 毎回最新のマスタデータを動的取得（起動後の変更も反映）。
 */
function buildMasterContext(): string {
  const clients = getAllClients()
  const staff = getAllStaff()

  const clientLines = clients.map(c => {
    const mfStatus = getAuthStatus(c.clientId).authenticated ? 'MF連携済' : 'MF未連携'
    const name = c.companyName || c.repName || '（名称未設定）'
    return `  ${c.threeCode}: ${name}（${mfStatus}）`
  }).join('\n')

  const staffLines = staff
    .filter(s => s.status === 'active')
    .map(s => `  ${s.name}（${s.role}）`)
    .join('\n')

  return `

## 顧問先マスタ（3コード → 会社名）
${clientLines}

## スタッフ一覧
${staffLines}

## 重要: 3コードと顧問先の対応
- ユーザーが3コード（例: TSK, GHI）を言及した場合、上記マスタから正しい顧問先名を特定して回答せよ
- MF未連携の顧問先のデータは取得できない。「MF連携が必要です」と回答せよ
`
}

// ===== 層3システムプロンプト追加指示 =====

const LAYER3_SYSTEM_PROMPT_SUFFIX = `

## ツール使用ルール
- データが必要な質問（「年商は？」「連携先は？」「科目一覧見せて」）→ 提供されたツールを使ってデータを取得し、自然言語で回答せよ
- 業務知識で答えられる質問（「3コードとは？」「手順を教えて」）→ ツールを使わず直接回答せよ
- 書き込み系コマンド（仕訳投入、仕訳取消、MFデータ取込）→ suggestionsで候補を返せ。直接実行するな。ツールとしても提供していない
- 大量データ（仕訳一覧等）は要約して回答せよ。生データを全件貼るな
- 金額はカンマ区切り円表示（例: ¥1,200,000）で表示せよ
- 回答はテキストで返せ。JSON形式で返すな。

## ツール選択ガイド（最重要 — 必ず守れ）
- 「年商」「売上」「利益」「経費」「PL」→ 必ず mfc_ca_getReportsTrialBalanceProfitLoss を呼べ。currentOfficeだけで回答するな
- 「BS」「資産」「負債」→ mfc_ca_getReportsTrialBalanceBalanceSheet
- 「科目一覧」→ mfc_ca_getAccounts
- 「仕訳一覧」→ mfc_ca_getJournals（下記ルール必読）
- 「取引先一覧」→ mfc_ca_getTradePartners
- 「事業者情報」「会計期間」→ mfc_ca_currentOffice
- 「連携サービス」「口座一覧」→ mfc_ca_getConnectedAccounts。ただしMCP beta版の制限で空配列を返す場合がある。その場合は mfc_ca_getAccounts で「普通預金」の補助科目から口座一覧を取得せよ

## mfc_ca_getJournals 使用ルール（必須）
- start_date と end_date は必須。「2025年度」→ start_date:'2025-01-01', end_date:'2025-12-31' のように日付文字列に変換せよ
- 摘要（description）フィルタはない。全件取得後にテキストで絞り込め
- per_page のデフォルトは小さい。per_page:100 を常に指定せよ
- 100件超のデータがある場合は page:2, page:3 で追加取得せよ
- 「ナカガワの仕訳」のように特定人物・取引先を聞かれた場合: 全仕訳を取得→摘要にその名前が含まれるものを抽出して回答

## 回答パターンガイド（状況に応じて最適なパターンを選べ）

### A. データ回答（ツールで取得成功）
- A1 直接回答: データを自然言語で回答（最優先）
- A2 要約回答: 大量データは件数+主要項目を要約
- A3 比較回答: 期間比較や前年比を求められたら増減を明示

### B. 部分回答（一部だけ取得できた）
- B1 取得分を回答+不足分を説明:「2026年分は1件。2025年分は追加取得が必要です」
- B2 推測+確認依頼:「おそらく〇〇ですが、確定には仕訳の確認が必要です」

### C. 実現不可（理由+解決策を必ずセットで）
- C1 MF未連携:「GHIはMF未連携です。設定画面からOAuth連携を完了すれば取得できます」
- C2 API制限:「MCPでは連携口座情報が取得できない場合があります。MF管理画面で確認してください」
- C3 データ不在:「2023年度は会計期間として登録されていないため取得できません」

### D. 確認・質問（曖昧な指示には聞き返せ）
- D1 年度・期間の確認:「どの年度ですか？2025年度(1-12月)と2026年度(1-5月)のどちらですか？」
- D2 複数候補:「"ナカガワ"は取引先名と顧問先名の両方に該当します。どちらですか？」

### E. わからない（正直に+代替フローを提示）
- E1 判断不能:「この取引の税区分判定は税理士に確認が必要です」
- E2 フロー提示:「全社横断の集計は現在のMCP(単社接続)ではできません。手順: ①各社PL個別取得→②手動集計」

### F. 書き込み操作の提案（suggestモード）
- F1 操作ボタン提案: suggestionsで候補を返す（仕訳投入、MFデータ取込など）
- F2 段階フロー:「①MFデータ取込→②仕訳確認→③承認の順で進めてください」

## 絶対禁止
- 「〇〇コマンドをお試しください」で終わるな。自分でツールを呼んでデータを取得し回答せよ
- JSON形式で返すな。自然言語テキストで返せ
- 理由なく「できません」だけで終わるな。C/D/Eパターンで理由+解決策を必ず示せ
`

/**
 * 層3 Function Calling でAI回答を生成
 */
export async function executeWithFunctionCalling(
  userText: string,
  clientId: string,
  tokenKey: string,
  clientName?: string,
): Promise<AiFunctionCallResponse> {
  const apiKey = process.env['GEMINI_API_KEY']
  if (!apiKey) {
    console.warn('[aiFunctionCallService] GEMINI_API_KEY未設定')
    return { mode: 'suggest', suggestions: [], toolsCalled: [] }
  }

  const client = new GoogleGenAI({ apiKey })

  // 顧問先マスタ・スタッフマスタを動的取得してプロンプトに含める
  const masterContext = buildMasterContext()

  // 層3固有のシステムプロンプト（層2プロンプト + マスタ情報 + 層3ツール使用ルール）
  const systemPrompt = getLayer2SystemPrompt() + masterContext + LAYER3_SYSTEM_PROMPT_SUFFIX

  const toolsCalled: string[] = []

  // ===== MCPからツール一覧を動的取得 → READ系のみ抽出 =====
  let readToolDeclarations: FunctionDeclaration[] = []
  try {
    const allTools = await listMcpTools(tokenKey)
    const readTools = allTools.filter(t => !isWriteTool(t.name))
    readToolDeclarations = readTools.map(mcpToolToFunctionDeclaration)
    console.log(`[aiFunctionCallService] MCPツール: 全${allTools.length}件 → READ系${readToolDeclarations.length}件をLLMに公開`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[aiFunctionCallService] MCPツール一覧取得失敗: ${message}`)
    // ツールなしで層2相当の動作をする
    readToolDeclarations = []
  }

  // ===== 1回目: LLMにユーザー入力を送る =====
  const clientContext = clientName
    ? `現在の対象顧問先: ${clientName}（ID: ${clientId}）`
    : `現在の対象顧問先ID: ${clientId}`
  const contents: Content[] = [
    { role: 'user', parts: [{ text: `${clientContext}\n\nユーザーの質問: ${userText}\n\n※ツールを使ってデータを取得し、自然言語で回答せよ。提案で終わるな。` }] },
  ]

  const configBase = {
    systemInstruction: systemPrompt,
    temperature: 0,
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    ...(readToolDeclarations.length > 0
      ? { tools: [{ functionDeclarations: readToolDeclarations }] }
      : {}),
  }

  try {
    let response = await client.models.generateContent({
      model: getAiCommandModel(),
      contents,
      config: configBase,
    })

    // ===== ツール呼び出しループ（最大3回） =====
    let loopCount = 0
    const MAX_LOOPS = 3

    while (loopCount < MAX_LOOPS) {
      const candidate = response.candidates?.[0]
      if (!candidate?.content?.parts) break

      // Function Call があるか確認
      const functionCalls = candidate.content.parts.filter(
        (p: Part) => p.functionCall !== undefined
      )

      if (functionCalls.length === 0) break // ツール呼び出しなし → 最終回答

      // モデルのレスポンスを会話に追加
      contents.push(candidate.content)

      // 各ツールを実行（MCPに直接呼び出し）
      const toolResultParts: Part[] = []

      for (const part of functionCalls) {
        const fc = part.functionCall!
        const toolName = fc.name!

        toolsCalled.push(toolName)
        console.log(`[aiFunctionCallService] ツール実行: ${toolName}`)

        try {
          const args = (fc.args as Record<string, unknown>) ?? {}
          // MCPツール名がそのままFunction名（動的取得なのでマッピング不要）
          const mcpResult = await callMcpTool(toolName, args, tokenKey)

          // MCPレスポンスをコンパクトにする（大量データの場合はトリム）
          const resultStr = JSON.stringify(mcpResult)
          const trimmedResult = resultStr.length > 10000
            ? JSON.stringify({
                _注意: `データが大きいため先頭10,000文字に切り詰め`,
                data: resultStr.slice(0, 10000),
              })
            : resultStr

          toolResultParts.push({
            functionResponse: {
              name: toolName,
              response: JSON.parse(trimmedResult),
            },
          })
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          console.error(`[aiFunctionCallService] ツール実行失敗: ${toolName}: ${message}`)
          toolResultParts.push({
            functionResponse: {
              name: toolName,
              response: { error: `データ取得失敗: ${message}` },
            },
          })
        }
      }

      // ツール結果を会話に追加
      contents.push({ role: 'user', parts: toolResultParts })

      // 2回目以降: LLMにツール結果を送る
      response = await client.models.generateContent({
        model: getAiCommandModel(),
        contents,
        config: configBase,
      })

      loopCount++
    }

    // ===== 最終回答を解析 =====
    const text = response.text?.trim() ?? ''

    // トークン使用量
    const usage = response.usageMetadata
      ? {
          inputTokens: response.usageMetadata.promptTokenCount ?? 0,
          outputTokens: response.usageMetadata.candidatesTokenCount ?? 0,
          totalTokens: response.usageMetadata.totalTokenCount ?? 0,
        }
      : undefined

    // JSONレスポンスの場合（suggestモード等）
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>
      const mode = String(parsed.mode ?? 'answer')

      if (mode === 'suggest') {
        const rawSuggestions = (parsed.suggestions ?? []) as Array<{ command?: string; label?: string; description?: string }>
        const suggestions = rawSuggestions
          .filter((s): s is { command: string; label: string; description: string } =>
            typeof s.command === 'string' && VALID_COMMAND_IDS.has(s.command)
          )
        return {
          mode: 'suggest',
          suggestions,
          supplement: parsed.supplement as string | undefined,
          toolsCalled,
          usage,
        }
      }

      return {
        mode: 'answer',
        answer: String(parsed.answer ?? text),
        suggestions: [],
        supplement: parsed.supplement as string | undefined,
        toolsCalled,
        usage,
      }
    } catch {
      // JSONでない場合は自然言語テキストとして扱う（これが正常パス）
      return {
        mode: 'answer',
        answer: text,
        suggestions: [],
        toolsCalled,
        usage,
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[aiFunctionCallService] 実行失敗: ${message}`)
    return { mode: 'suggest', suggestions: [], toolsCalled: [] }
  }
}
