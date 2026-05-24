/**
 * aiSuggestService.ts — AI提案サービス（層2: コマンド提案 + 自由回答）
 *
 * レイヤー: aiCommandRoutes → ★service★
 * 責務:
 *   - ユーザーの自由テキスト → コマンド候補提案 or 自由回答
 *   - LLM自身がモード（suggest/answer）を判定
 *
 * 準拠:
 *   - 34_command_catalog.md 処理フロー（Layer構造）
 *   - 35_parts_catalog.md 処理部品 aiSuggest
 *   - 36_infra_ui.md §2-12 AI提案フロー
 */

import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { COMMAND_CATALOG, VALID_COMMAND_IDS } from './commandCatalog'
import type { CommandDef } from './commandCatalog'
import { getLayer2SystemPrompt } from './aiContextProvider'

/** AI提案の1件 */
export interface AiSuggestion {
  command: string
  label: string
  description: string
}

/** 層2 AI応答（suggest or answer） */
export interface AiLayer2Response {
  /** モード: suggest=コマンド候補, answer=自由回答 */
  mode: 'suggest' | 'answer'
  /** コマンド候補（suggestモード） */
  suggestions: AiSuggestion[]
  /** 自由回答テキスト（answerモード） */
  answer?: string
  /** 補足説明（任意） */
  supplement?: string
  /** トークン使用量（コスト計算用） */
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}

/** 後方互換: 旧レスポンス型 */
export interface AiSuggestResponse {
  suggestions: AiSuggestion[]
}

/**
 * 層2 AI応答を取得（コマンド提案 or 自由回答）
 *
 * @param userText ユーザー入力テキスト
 * @param clientId 選択中の顧問先ID
 * @param model 使用モデル（デフォルト: gemini-3.5-flash）
 * @param thinkingLevel thinking設定（デフォルト: low）
 */
export async function suggestCommandsLayer2(
  userText: string,
  clientId: string,
  model = 'gemini-3.5-flash',
  thinkingLevel: ThinkingLevel = ThinkingLevel.LOW,
): Promise<AiLayer2Response> {
  const apiKey = process.env['GEMINI_API_KEY']
  if (!apiKey) {
    console.warn('[aiSuggestService] GEMINI_API_KEY未設定。空の提案を返します')
    return { mode: 'suggest', suggestions: [] }
  }

  const client = new GoogleGenAI({ apiKey })
  const systemPrompt = getLayer2SystemPrompt()
  const userPrompt = `ユーザー入力: 「${userText}」\n顧問先: ${clientId}`

  try {
    const response = await client.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel },
      },
    })

    const text = response.text?.trim() ?? '{}'
    const parsed = JSON.parse(text) as AiLayer2Response

    // suggestionsのバリデーション: カタログに存在するコマンドIDのみ残す
    const validatedSuggestions = (parsed.suggestions ?? []).filter(s => {
      if (!VALID_COMMAND_IDS.has(s.command)) {
        console.warn(`[aiSuggestService] カタログ外コマンド除外: ${s.command}`)
        return false
      }
      return true
    })

    // トークン使用量を取得
    const usage = response.usageMetadata
      ? {
          inputTokens: response.usageMetadata.promptTokenCount ?? 0,
          outputTokens: response.usageMetadata.candidatesTokenCount ?? 0,
          totalTokens: response.usageMetadata.totalTokenCount ?? 0,
        }
      : undefined

    return {
      mode: parsed.mode ?? (validatedSuggestions.length > 0 ? 'suggest' : 'answer'),
      suggestions: validatedSuggestions,
      answer: parsed.answer,
      supplement: parsed.supplement,
      usage,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[aiSuggestService] AI提案失敗: ${message}`)
    return { mode: 'suggest', suggestions: [] }
  }
}

/**
 * 後方互換: 層1 AI提案（コマンド候補のみ）
 * 既存のaiCommandRoutes.tsから呼ばれている箇所用
 */
export async function suggestCommands(
  userText: string,
  clientId: string,
): Promise<AiSuggestResponse> {
  const result = await suggestCommandsLayer2(userText, clientId)
  return { suggestions: result.suggestions }
}

/** コマンドカタログを公開（フロントのコマンドブラウザ用） */
export function getCommandCatalog(): Omit<CommandDef, 'keywords'>[] {
  return COMMAND_CATALOG.map(({ id, name, cat, desc }) => ({ id, name, cat, desc }))
}
