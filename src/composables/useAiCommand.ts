/**
 * useAiCommand.ts — AIコマンド composable（SSE呼び出し+状態管理）
 *
 * レイヤー: ★composable★ → API呼び出し
 * 責務: AiChatWindowの状態管理。メッセージ履歴、送信、ローディング
 *
 * Step 1: 同期レスポンス（SSEなし）
 *
 * 準拠:
 *   - load_context.md L75: composableはモジュールスコープのrefでデータを直接保持
 *   - load_context.md L76: composableからcreateRepositories()に依存させるな
 *   - load_context.md L77: Repository/composableにロジックは絶対に入れるな
 */

import { ref } from 'vue'

/** AI提案の1件 */
export interface AiSuggestion {
  command: string
  label: string
  description: string
}

/** AI応答の構造（35_parts_catalog.md 基盤チャットUI） */
export interface AiResponse {
  type: 'text' | 'table' | 'suggestions' | 'params' | 'mixed'
  content: string
  table?: {
    headers: string[]
    rows: (string | number)[][]
  }
  suggestions?: AiSuggestion[]
}

/** チャットメッセージ */
export interface ChatMessage {
  /** メッセージID */
  id: string
  /** 送信者 */
  role: 'user' | 'ai'
  /** テキスト内容 */
  content: string
  /** AI応答の追加データ（テーブル等） */
  response?: AiResponse
  /** タイムスタンプ */
  timestamp: Date
}

// モジュールスコープ（load_context.md L75準拠）
const messages = ref<ChatMessage[]>([])
const isLoading = ref(false)
const selectedClientId = ref<string>('')

/**
 * AIコマンド composable
 * メッセージ履歴+送信+状態管理
 */
export function useAiCommand() {
  /** メッセージ送信 */
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading.value) return

    // ユーザーメッセージ追加
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }
    messages.value.push(userMsg)

    // API呼び出し
    isLoading.value = true
    try {
      const res = await fetch('/api/ai-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          clientId: selectedClientId.value || 'default',
        }),
      })

      // レスポンスがJSONでない場合（サーバー未起動等でHTMLが返る）
      const contentType = res.headers.get('content-type') ?? ''
      if (!contentType.includes('application/json')) {
        const raw = await res.text()
        throw new Error(`サーバーからJSON以外のレスポンス (${res.status}): ${raw.slice(0, 100)}`)
      }

      const data: AiResponse = await res.json()

      // AI応答メッセージ追加
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'ai',
        content: data.content,
        response: data,
        timestamp: new Date(),
      }
      messages.value.push(aiMsg)
    } catch (err) {
      // エラーメッセージ追加
      const errMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'ai',
        content: `通信エラーが発生しました: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: new Date(),
      }
      messages.value.push(errMsg)
    } finally {
      isLoading.value = false
    }
  }

  /** メッセージ履歴クリア */
  const clearMessages = () => {
    messages.value = []
  }

  /** API送信のみ（ユーザーメッセージは追加しない。呼び出し元で別途追加する） */
  const sendMessageDirect = async (apiText: string) => {
    if (!apiText.trim() || isLoading.value) return
    isLoading.value = true
    try {
      const res = await fetch('/api/ai-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: apiText.trim(),
          clientId: selectedClientId.value || 'default',
        }),
      })
      const contentType = res.headers.get('content-type') ?? ''
      if (!contentType.includes('application/json')) {
        const raw = await res.text()
        throw new Error(`サーバーからJSON以外のレスポンス (${res.status}): ${raw.slice(0, 100)}`)
      }
      const data: AiResponse = await res.json()
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'ai',
        content: data.content,
        response: data,
        timestamp: new Date(),
      }
      messages.value.push(aiMsg)
    } catch (err) {
      const errMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'ai',
        content: `通信エラーが発生しました: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: new Date(),
      }
      messages.value.push(errMsg)
    } finally {
      isLoading.value = false
    }
  }

  return {
    messages,
    isLoading,
    selectedClientId,
    sendMessage,
    sendMessageDirect,
    clearMessages,
  }
}
