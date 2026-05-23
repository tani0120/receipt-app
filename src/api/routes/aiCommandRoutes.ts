/**
 * aiCommandRoutes.ts — AIコマンド実行エンドポイント（Hono）
 *
 * レイヤー: ★route★ → aiPatternMatcher + aiSuggestService
 * 責務: チャットUI → テキスト受信 → パターンマッチ + AI提案 → 結果返却
 *
 * エンドポイント:
 *   POST /api/ai-command  — AIコマンド実行（パターンマッチ + AI提案 並列）
 *   GET  /api/ai-command/catalog — コマンドカタログJSON取得
 *
 * 準拠:
 *   - 36_infra_ui.md §2-12: AI提案フロー
 *   - 35_parts_catalog.md: 基盤（チャットUI）+ 処理部品（aiSuggest）
 */

import { Hono } from 'hono'
import { matchPattern } from '../services/aiPatternMatcher'
import { suggestCommands, getCommandCatalog } from '../services/aiSuggestService'

const app = new Hono()

/**
 * POST / — AIコマンド実行
 * ボディ: { text: string, clientId: string }
 *
 * 並列実行:
 *   1. パターンマッチ（即時）→ ヒットしたら結果を返す
 *   2. AI提案（3秒）→ 候補ボタンを追加で返す
 */
app.post('/', async (c) => {
  const body = await c.req.json<{ text?: string; clientId?: string }>()
  const text = body.text?.trim()
  const clientId = body.clientId ?? 'default'

  if (!text) {
    return c.json({ type: 'text', content: 'テキストを入力してください。' }, 400)
  }

  // 注: 顧問先チェックはフロント側（AiChatWindow.vue）で行う
  // コマンド候補表示段階ではclientIdは不要

  try {
    // 並列実行: パターンマッチ（即時）+ AI提案（非同期）
    const [patternResult, aiSuggestResult] = await Promise.all([
      matchPattern(text, clientId),
      suggestCommands(text, clientId).catch(err => {
        console.error(`[aiCommandRoutes] AI提案失敗: ${err}`)
        return { suggestions: [] }
      }),
    ])

    // パターンマッチがヒットした場合: 結果 + AI提案を合わせて返す
    // パターンマッチがミスした場合（null）: AI提案のみ返す

    if (patternResult) {
      // パターンマッチがサブ選択肢を持つ場合はそちらを優先
      const suggestions = patternResult.suggestions?.length
        ? patternResult.suggestions
        : aiSuggestResult.suggestions
      return c.json({
        ...patternResult,
        suggestions,
      })
    }

    // パターンマッチなし → AI提案のみ
    if (aiSuggestResult.suggestions.length > 0) {
      return c.json({
        type: 'suggestions' as const,
        content: `「${text}」に関連するコマンド:`,
        suggestions: aiSuggestResult.suggestions,
      })
    }

    // AI提案も空 → フォールバックメッセージ
    return c.json({
      type: 'text' as const,
      content: `すみません、「${text}」に該当するコマンドが見つかりませんでした。\n\n左下の [≡] を押すと利用できる全コマンドを確認できます。`,
      suggestions: [],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[aiCommandRoutes] コマンド実行失敗: ${message}`)
    return c.json({
      type: 'text' as const,
      content: `エラーが発生しました: ${message}`,
    }, 500)
  }
})

/**
 * GET /catalog — コマンドカタログJSON取得
 * フロントのコマンドブラウザ用
 */
app.get('/catalog', (c) => {
  return c.json({ catalog: getCommandCatalog() })
})

export default app
