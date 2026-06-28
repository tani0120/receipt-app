/**
 * aiCommandRoutes.ts — AIコマンド実行エンドポイント（Hono）
 *
 * レイヤー: ★route★ → aiPatternMatcher + aiSuggestService + aiFunctionCallService
 * 責務: チャットUI → テキスト受信 → パターンマッチ + AI提案/FC → 結果返却
 *
 * 処理フロー:
 *   Layer 1: パターンマッチ（コード側、即時、無料）
 *   Layer 2-3: AI（MF連携済み→層3 Function Calling / 未連携→層2 カタログ+FAQ）
 *
 * エンドポイント:
 *   POST /api/ai-command  — AIコマンド実行
 *   GET  /api/ai-command/catalog — コマンドカタログJSON取得
 *   GET  /api/ai-command/cost/monthly    — 今月のコスト集計
 *   GET  /api/ai-command/cost/by-staff   — スタッフ別コスト集計
 *   GET  /api/ai-command/cost/by-client  — 顧問先別コスト集計
 *
 * 準拠:
 *   - 34_command_catalog.md 処理フロー（Layer構造）
 *   - 36_infra_ui.md §2-12: AI提案フロー
 *   - 35_parts_catalog.md: 基盤（チャットUI）+ 処理部品（aiSuggest）
 */

import { Hono } from 'hono'
import { matchPattern } from '../services/aiPatternMatcher'
import { suggestCommandsLayer2, getCommandCatalog } from '../services/aiSuggestService'
import { executeWithFunctionCalling } from '../services/aiFunctionCallService'
import { getAuthStatus } from '../services/mfAuthService'
import { getCurrentStaffUuid } from './authRoutes'
import { addCommandLog, getMonthlyTotalCost, getAllMonthlyCosts, getStaffMonthlyCosts, getClientMonthlyCosts, getCrossMonthlyCosts, getModelMonthlyCosts, getAnnualTotalCost } from '../services/aiLogStore'
import { calculateCost, MODEL_PRICING, USD_JPY_RATE, getAccountEstimateModelId } from '../ai/modelConfig'
import { createMockRepositories } from '../../repositories/mock'
const clientRepo = createMockRepositories().client
import { isBqConfigured, getMonthlySummaries, getCurrentMonthCost } from '../services/bigqueryCostService'

const app = new Hono()

/** AIコマンドで使用するモデル（環境変数 > デフォルト: gemini-3.5-flash） */
function getAiCommandModel(): string {
  return process.env['AI_COMMAND_MODEL'] ?? 'gemini-3.5-flash'
}

/**
 * テキストから3コード（英大文字3文字）を推定し、clientIdに解決する。
 * 複数見つかった場合は最初にヒットしたものを採用。
 */
async function resolveClientFromText(text: string, fallbackClientId: string): Promise<{
  clientId: string
  resolvedThreeCode: string | null
  resolvedName: string | null
}> {
  // テキスト内の英字3文字パターンを全て抽出
  const matches = text.toUpperCase().match(/\b[A-Z]{3}\b/g)
  if (matches) {
    for (const code of matches) {
      const client = await clientRepo.getByThreeCode(code)
      if (client) {
        return {
          clientId: client.clientId,
          resolvedThreeCode: client.threeCode,
          resolvedName: client.companyName || client.repName || client.clientId,
        }
      }
    }
  }
  return { clientId: fallbackClientId, resolvedThreeCode: null, resolvedName: null }
}

/**
 * MF認証済みのclientIdを探す。
 * 指定clientIdが認証済みならそれを使用。
 * 未認証なら認証済みの任意のclientIdを返す（MCPツール一覧取得用）。
 */
async function findAuthenticatedClientId(preferredId: string): Promise<string | null> {
  if (getAuthStatus(preferredId).authenticated) return preferredId
  // 全顧問先を走査して認証済みのものを探す
  const allClients = await clientRepo.getAll()
  for (const cl of allClients) {
    if (getAuthStatus(cl.clientId).authenticated) return cl.clientId
  }
  return null
}

/**
 * POST / — AIコマンド実行（層2/3統合）
 * ボディ: { text: string, clientId: string }
 *
 * 処理順序:
 *   1. パターンマッチ（即時）→ ヒットしたら結果を返す
 *   2. テキストから3コード自動推定 → clientId解決
 *   3. MF連携済み → 層3 Function Calling（LLMが自由にツール選択+回答生成）
 *   4. MF未連携 → 層2 カタログ+FAQ（コマンド候補 or 自由回答）
 */
app.post('/', async (c) => {
  const body = await c.req.json<{ text?: string; clientId?: string }>()
  const text = body.text?.trim()
  let clientId = body.clientId ?? 'default'
  const staffId = getCurrentStaffUuid() ?? 'unknown'

  if (!text) {
    return c.json({ type: 'text', content: 'テキストを入力してください。' }, 400)
  }

  try {
    // ===== Layer 1: パターンマッチ（即時） =====
    const patternResult = await matchPattern(text, clientId)

    if (patternResult) {
      return c.json(patternResult)
    }

    // ===== テキストから顧問先を自動推定 =====
    const resolved = await resolveClientFromText(text, clientId)
    if (resolved.resolvedThreeCode) {
      clientId = resolved.clientId
      console.log(`[aiCommandRoutes] 3コード自動推定: ${resolved.resolvedThreeCode} → ${clientId} (${resolved.resolvedName})`)
    }

    // ===== Layer 2-3: AI =====
    // MF連携済みのclientIdを探して層3を起動
    const tokenKey = await findAuthenticatedClientId(clientId)
    const isMfConnected = tokenKey !== null

    if (isMfConnected) {
      // ===== 層3: Function Calling（LLMが自由にツール選択+回答生成） =====
      console.log(`[aiCommandRoutes] 層3実行（MF連携済み: clientId=${clientId}, tokenKey=${tokenKey}）`)

      const fcResult = await executeWithFunctionCalling(text, clientId, tokenKey!, resolved.resolvedName ?? undefined).catch(err => {
        console.error(`[aiCommandRoutes] 層3失敗、層2にフォールバック: ${err}`)
        return null // 失敗時は層2にフォールバック
      })

      if (fcResult) {
        // ── コスト記録・永続化 ──
        if (fcResult.usage) {
          const u = fcResult.usage
          const cost = calculateCost(getAiCommandModel(), u.inputTokens, u.outputTokens)
          console.log(
            `[aiCommandRoutes] 層3完了 | ` +
            `ツール: [${fcResult.toolsCalled.join(', ')}] | ` +
            `入力: ${u.inputTokens}tok 出力: ${u.outputTokens}tok 合計: ${u.totalTokens}tok | ` +
            `コスト: ¥${cost.costYen.toFixed(4)}`
          )

          // aiLogStoreに永続化
          addCommandLog({
            staffId,
            clientId,
            inputText: text,
            toolName: fcResult.toolsCalled[0] ?? null,
            toolParams: null,
            status: 'success',
            responseSummary: (fcResult.answer ?? '').slice(0, 200),
            writeConfirmed: null,
            writeResultDetail: null,
            writeBeforeSnapshot: null,
            context: null,
            costCategory: 'mcp_query',
            model: getAiCommandModel(),
            layer: 3,
            promptTokens: u.inputTokens,
            completionTokens: u.outputTokens,
            thinkingTokens: 0,
            totalTokens: u.totalTokens,
            inputPricePerM: cost.inputPricePerM,
            outputPricePerM: cost.outputPricePerM,
            estimatedCostYen: cost.costYen,
            toolsCalled: fcResult.toolsCalled,
          })
        }

        if (fcResult.mode === 'answer' && fcResult.answer) {
          const toolInfo = fcResult.toolsCalled.length > 0
            ? `\n\n📊 取得元: ${fcResult.toolsCalled.join(', ')}`
            : ''
          return c.json({
            type: 'text' as const,
            content: fcResult.answer + toolInfo,
            suggestions: fcResult.suggestions,
            usage: fcResult.usage,
            resolvedClientId: resolved.resolvedThreeCode ? clientId : undefined,
            resolvedClientName: resolved.resolvedName ?? undefined,
          })
        }

        if (fcResult.suggestions.length > 0) {
          const content = fcResult.supplement
            ? `「${text}」に関連するコマンド:\n\n💡 ${fcResult.supplement}`
            : `「${text}」に関連するコマンド:`
          return c.json({
            type: 'suggestions' as const,
            content,
            suggestions: fcResult.suggestions,
            usage: fcResult.usage,
          })
        }
      }
    }

    // ===== 層2: カタログ+FAQ（MF未連携 or 層3フォールバック） =====
    const aiResult = await suggestCommandsLayer2(text, clientId).catch(err => {
      console.error(`[aiCommandRoutes] 層2失敗: ${err}`)
      return { mode: 'suggest' as const, suggestions: [] as never[], answer: undefined, supplement: undefined, usage: undefined }
    })

    // ── 層2コスト記録 ──
    const l2Usage = (aiResult as Record<string, unknown>).usage as { inputTokens: number; outputTokens: number; totalTokens: number } | undefined
    if (l2Usage) {
      const cost = calculateCost(getAiCommandModel(), l2Usage.inputTokens, l2Usage.outputTokens)
      addCommandLog({
        staffId,
        clientId,
        inputText: text,
        toolName: null,
        toolParams: null,
        status: 'success',
        responseSummary: (aiResult.answer ?? '').slice(0, 200),
        writeConfirmed: null,
        writeResultDetail: null,
        writeBeforeSnapshot: null,
        context: null,
        costCategory: 'mcp_query',
        model: getAiCommandModel(),
        layer: 2,
        promptTokens: l2Usage.inputTokens,
        completionTokens: l2Usage.outputTokens,
        thinkingTokens: 0,
        totalTokens: l2Usage.totalTokens,
        inputPricePerM: cost.inputPricePerM,
        outputPricePerM: cost.outputPricePerM,
        estimatedCostYen: cost.costYen,
        toolsCalled: [],
      })
    }

    if (aiResult.mode === 'answer' && aiResult.answer) {
      const content = aiResult.supplement
        ? `${aiResult.answer}\n\n${aiResult.supplement}`
        : aiResult.answer
      return c.json({
        type: 'text' as const,
        content,
        suggestions: aiResult.suggestions,
      })
    }

    if (aiResult.suggestions.length > 0) {
      const content = aiResult.supplement
        ? `「${text}」に関連するコマンド:\n\n💡 ${aiResult.supplement}`
        : `「${text}」に関連するコマンド:`
      return c.json({
        type: 'suggestions' as const,
        content,
        suggestions: aiResult.suggestions,
      })
    }

    // フォールバック
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

// ============================================================
// コスト集計API
// ============================================================

/** GET /cost/monthly — 今月の全体コスト集計（自前計測） */
app.get('/cost/monthly', (c) => {
  const total = getMonthlyTotalCost()
  const byCategory = getAllMonthlyCosts()
  return c.json({ total, byCategory })
})

/** GET /cost/by-staff — スタッフ別コスト集計（自前計測） */
app.get('/cost/by-staff', (c) => {
  return c.json({ staffCosts: getStaffMonthlyCosts() })
})

/** GET /cost/by-client — 顧問先別コスト集計（自前計測） */
app.get('/cost/by-client', (c) => {
  return c.json({ clientCosts: getClientMonthlyCosts() })
})

/** GET /cost/bigquery — BigQuery Billing Exportからのコスト（確定値。costタブ用） */
app.get('/cost/bigquery', async (c) => {
  if (!isBqConfigured()) {
    return c.json({
      configured: false,
      message: 'BigQuery Billing Export未設定。GCPコンソール > Billing > Billing Export で有効化し、環境変数 BQ_BILLING_TABLE を設定してください。',
      summaries: [],
      currentMonth: null,
    })
  }

  try {
    const summaries = await getMonthlySummaries()
    const currentMonth = await getCurrentMonthCost()
    return c.json({
      configured: true,
      message: null,
      summaries,
      currentMonth,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ configured: true, message: `BigQueryクエリ失敗: ${message}`, summaries: [], currentMonth: null }, 500)
  }
})

/** GET /cost/cross — スタッフ×顧問先クロス集計（今月） */
app.get('/cost/cross', (c) => {
  return c.json({ crossCosts: getCrossMonthlyCosts() })
})

/** GET /cost/by-model — モデル別コスト集計（今月） */
app.get('/cost/by-model', (c) => {
  return c.json({ modelCosts: getModelMonthlyCosts() })
})

/** GET /cost/config — 現在のモデル設定・単価・為替レート（動的取得用） */
app.get('/cost/config', (c) => {
  return c.json({
    currentModel: process.env['AI_COMMAND_MODEL'] ?? 'gemini-3.5-flash',
    ocrModel: process.env['VERTEX_MODEL_ID'] ?? 'gemini-3.1-flash-lite',
    accountEstimateModel: getAccountEstimateModelId(),
    pricing: MODEL_PRICING,
    usdJpyRate: USD_JPY_RATE,
    annualTotalCostYen: Math.round(getAnnualTotalCost() * 100) / 100,
  })
})

export default app
