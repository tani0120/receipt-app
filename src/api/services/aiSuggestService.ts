/**
 * aiSuggestService.ts — AI提案サービス（gemini-3.5-flash）
 *
 * レイヤー: aiCommandRoutes → ★service★
 * 責務: ユーザーの自由テキスト → コマンドカタログから3〜5個の候補を提案
 *
 * 準拠:
 *   - 35_parts_catalog.md 処理部品 aiSuggest
 *   - 36_infra_ui.md §2-12 AI提案フロー
 */

import { GoogleGenAI } from '@google/genai'
import { COMMAND_CATALOG, CATALOG_JSON_FOR_PROMPT, VALID_COMMAND_IDS } from './commandCatalog'
import type { CommandDef } from './commandCatalog'

/** AI提案の1件 */
export interface AiSuggestion {
  command: string
  label: string
  description: string
}

/** AI提案レスポンス */
export interface AiSuggestResponse {
  suggestions: AiSuggestion[]
}

// ---------- システムプロンプト（35_parts_catalog.md aiSuggest準拠） ----------
const SYSTEM_PROMPT = `あなたは会計事務所向け業務アプリ「sugu-sru」のコマンドアシスタントです。
ユーザーの自然言語入力を受け取り、以下のコマンドカタログから
意図に合うものを3〜5個選んでください。

ルール:
1. カタログに存在するコマンドIDのみ返すこと。存在しないIDを生成するな。
2. 各候補に「このコマンドでできること」の1行説明を付けること。
   説明はユーザーの入力に合わせてカスタマイズせよ。
3. 入力が曖昧な場合は、広めに候補を出すこと（絞りすぎるな）。
4. パラメータは返すな（人間が入力する）。
5. 該当するコマンドが全くない場合は suggestions を空配列 [] で返せ。

レスポンス形式（JSON）:
{
  "suggestions": [
    { "command": "コマンドID", "label": "表示名", "description": "1行説明" }
  ]
}

コマンドカタログ:
${CATALOG_JSON_FOR_PROMPT}`

/**
 * AI提案を取得（gemini-3.5-flash）
 */
export async function suggestCommands(
  userText: string,
  clientId: string,
): Promise<AiSuggestResponse> {
  const apiKey = process.env['GEMINI_API_KEY']
  if (!apiKey) {
    console.warn('[aiSuggestService] GEMINI_API_KEY未設定。空の提案を返します')
    return { suggestions: [] }
  }

  const client = new GoogleGenAI({ apiKey })
  const userPrompt = `ユーザー入力: 「${userText}」\n顧問先: ${clientId}`

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0,
        responseMimeType: 'application/json',
      },
    })

    const text = response.text?.trim() ?? '{}'
    const parsed = JSON.parse(text) as AiSuggestResponse

    // バリデーション: カタログに存在するコマンドIDのみ残す
    const validated = (parsed.suggestions ?? []).filter(s => {
      if (!VALID_COMMAND_IDS.has(s.command)) {
        console.warn(`[aiSuggestService] カタログ外コマンド除外: ${s.command}`)
        return false
      }
      return true
    })

    return { suggestions: validated }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[aiSuggestService] AI提案失敗: ${message}`)
    return { suggestions: [] }
  }
}

/** コマンドカタログを公開（フロントのコマンドブラウザ用） */
export function getCommandCatalog(): Omit<CommandDef, 'keywords'>[] {
  return COMMAND_CATALOG.map(({ id, name, cat, desc }) => ({ id, name, cat, desc }))
}
