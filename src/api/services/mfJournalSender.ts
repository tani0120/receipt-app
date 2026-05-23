/**
 * mfJournalSender.ts — Sugusru仕訳をMFに送信するサービス
 *
 * 処理フロー:
 *   1. buildAllMaps() でマッピングテーブル取得
 *   2. validateBeforeConvert() でバリデーション
 *   3. convertToMfJournal() で変換
 *   4. mcpCreateJournal() でMCPに送信
 *   5. レスポンスからMF-ID取得、結果を返す
 *
 * 準拠: mf_sugusru_field_mapping.md §5, plan_mf_journal_send.md
 */

import { buildAllMaps, type MfMappingTables } from './mfMappingService'
import { convertToMfJournal, type SourceJournal, type ConversionError } from './journalToMfConverter'
import { mcpCreateJournal } from './mfMcpClient'

// ────────────────────────────────────────────
// 結果型
// ────────────────────────────────────────────

/** 1件送信結果 */
export interface SendResult {
  /** Sugusru仕訳ID */
  sugusruId: string
  /** 成功/失敗 */
  success: boolean
  /** MFから返却されたID（成功時） */
  mfId?: string
  /** MFから返却された仕訳番号（成功時） */
  mfNumber?: number
  /** 変換エラー（バリデーション失敗時） */
  conversionErrors?: ConversionError[]
  /** 送信エラー（MCP送信失敗時） */
  sendError?: string
  /**
   * 非適格仕訳フラグ
   * trueの場合、invoice_kind=UNQUALIFIED_80/50でMFに送信済み。
   * MF管理画面での手動修正は不要。
   */
  hasNonQualified?: boolean
}

/** バッチ送信結果 */
export interface BatchSendResult {
  /** 総件数 */
  total: number
  /** 成功件数 */
  successCount: number
  /** 失敗件数 */
  failureCount: number
  /** 各件の結果 */
  results: SendResult[]
  /** 処理時間（ミリ秒） */
  elapsedMs: number
}

/** 進捗コールバック */
export type SendProgressCallback = (current: number, total: number, result: SendResult) => void

// ────────────────────────────────────────────
// 1件送信
// ────────────────────────────────────────────

/**
 * Sugusru仕訳1件をMFに送信する
 *
 * @param journal Sugusru仕訳
 * @param tokenKey mfAuthServiceのトークンストアキー
 * @param maps マッピングテーブル（省略時は自動取得）
 */
export async function sendJournalToMf(
  journal: SourceJournal,
  tokenKey: string,
  maps?: MfMappingTables,
): Promise<SendResult> {
  const sugusruId = journal.id

  try {
    // 1. マッピングテーブル取得（キャッシュ利用）
    const mappingTables = maps ?? await buildAllMaps(tokenKey)

    // 2. 変換（バリデーション含む。invoice_kindも税務的に正しく設定される）
    const { payload, errors, hasNonQualified, invoiceKind } = convertToMfJournal(journal, mappingTables)
    if (!payload) {
      return {
        sugusruId,
        success: false,
        conversionErrors: errors,
      }
    }

    // 3. invoice_kindはそのまま送信（実機テスト 2026-05-23確認済み）
    //    QUALIFIED/UNQUALIFIED_80: MF API受理
    //    NOT_TARGET: 対象外税区分とセットならMF API受理。課税税区分とセットなら拒否
    //    UNQUALIFIED_50/NOT_QUALIFIED_0: MF未対応ならenumエラーで自然停止
    //    省略: MFが税区分から自動判定（課税→QUALIFIED、対象外→NOT_TARGET）

    // 4. 非適格仕訳のログ（情報のみ。手動修正は不要）
    if (hasNonQualified) {
      console.log(
        `[mfSender] 非適格仕訳: ${sugusruId}（invoice_kind=${invoiceKind}）MFにそのまま送信`
      )
    }

    // 5. MCP送信（invoice_kind含むペイロードをそのまま送信）
    console.log(`[mfSender] 送信: ${sugusruId} → MF（${payload.branches.length}行, ${payload.transaction_date}）`)
    const response = await mcpCreateJournal(payload, tokenKey)

    // 6. レスポンス解析（MfJournalResponse型）
    const mfId = response?.id ?? undefined
    const mfNumber = response?.number ?? undefined

    console.log(`[mfSender] 成功: ${sugusruId} → MF-ID: ${mfId ?? '不明'}, 番号: ${mfNumber ?? '不明'}`)

    return {
      sugusruId,
      success: true,
      mfId,
      mfNumber,
      hasNonQualified,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[mfSender] 送信失敗: ${sugusruId}:`, message)
    return {
      sugusruId,
      success: false,
      sendError: message,
    }
  }
}


// ────────────────────────────────────────────
// バッチ送信
// ────────────────────────────────────────────

/**
 * 複数の仕訳をMFにバッチ送信する
 *
 * - 直列実行（MF APIの429レート制限を考慮）
 * - 1件失敗しても残りは続行
 * - マッピングテーブルは最初に1回だけ取得してキャッシュ利用
 *
 * @param journals Sugusru仕訳配列
 * @param tokenKey mfAuthServiceのトークンストアキー
 * @param onProgress 進捗コールバック（任意）
 */
export async function sendBatchToMf(
  journals: SourceJournal[],
  tokenKey: string,
  onProgress?: SendProgressCallback,
): Promise<BatchSendResult> {
  const startMs = Date.now()
  const results: SendResult[] = []
  let successCount = 0
  let failureCount = 0

  // マッピングテーブルを先に取得（全件で共有）
  const maps = await buildAllMaps(tokenKey)

  // 未マッチ科目/税区分があれば警告
  if (maps.unmatchedAccounts.length > 0) {
    console.warn(`[mfSender] 警告: ${maps.unmatchedAccounts.length}件の科目がMFにマッチしない:`,
      maps.unmatchedAccounts.map(a => `${a.sugusruId}(${a.sugusruName})`).join(', '))
  }
  if (maps.unmatchedTaxes.length > 0) {
    console.warn(`[mfSender] 警告: ${maps.unmatchedTaxes.length}件の税区分がMFにマッチしない:`,
      maps.unmatchedTaxes.map(t => `${t.sugusruId}(${t.sugusruName})`).join(', '))
  }

  // 直列送信（429リトライ付き）
  const MAX_RETRIES = 3          // 最大リトライ回数
  const RETRY_BASE_MS = 1000     // リトライ初回待機（ミリ秒）
  const INTERVAL_MS = 200        // 通常送信間隔（ミリ秒）

  for (let i = 0; i < journals.length; i++) {
    let result: SendResult | null = null
    let retries = 0

    while (retries <= MAX_RETRIES) {
      result = await sendJournalToMf(journals[i]!, tokenKey, maps)

      // 429レート制限エラーならリトライ
      if (!result.success && result.sendError?.includes('429') && retries < MAX_RETRIES) {
        const waitMs = RETRY_BASE_MS * Math.pow(2, retries) // 指数バックオフ: 1s→2s→4s
        console.warn(`[mfSender] 429レート制限: ${journals[i]!.id}（${waitMs}ms後にリトライ ${retries + 1}/${MAX_RETRIES}）`)
        await new Promise(resolve => setTimeout(resolve, waitMs))
        retries++
        continue
      }
      break
    }

    results.push(result!)

    if (result!.success) {
      successCount++
    } else {
      failureCount++
    }

    // 進捗通知
    if (onProgress) {
      onProgress(i + 1, journals.length, result!)
    }

    // レート制限回避: 連続送信時に200ms待機
    if (i < journals.length - 1) {
      await new Promise(resolve => setTimeout(resolve, INTERVAL_MS))
    }
  }

  const elapsedMs = Date.now() - startMs
  console.log(
    `[mfSender] バッチ完了: ${successCount}/${journals.length}件成功, ` +
    `${failureCount}件失敗, ${elapsedMs}ms`
  )

  return {
    total: journals.length,
    successCount,
    failureCount,
    results,
    elapsedMs,
  }
}

// ────────────────────────────────────────────
// MF-ID紐付け
// ────────────────────────────────────────────

/**
 * 送信結果をJournalPhase5Mockに書き戻す
 *
 * 送信成功した仕訳に対して以下を設定する:
 * - mf_journal_id: MF内部ID
 * - mf_journal_number: MF取引No
 * - mf_sent_at: 送信日時（ISO 8601）
 * - status: 'exported'（送信済み）
 *
 * @param journals 元の仕訳配列（JournalPhase5Mock）
 * @param results 送信結果配列（SendResult）
 * @returns 更新された仕訳数
 */
export function applyMfSendResults(
  journals: Array<{
    id: string
    mf_journal_id?: string | null
    mf_journal_number?: number | null
    mf_sent_at?: string | null
    status?: string | null
  }>,
  results: SendResult[],
): number {
  let updatedCount = 0
  const now = new Date().toISOString()

  for (const result of results) {
    if (!result.success || !result.mfId) continue

    const journal = journals.find(j => j.id === result.sugusruId)
    if (!journal) continue

    journal.mf_journal_id = result.mfId
    journal.mf_journal_number = result.mfNumber ?? null
    journal.mf_sent_at = now
    journal.status = 'exported'
    updatedCount++
  }

  if (updatedCount > 0) {
    console.log(`[mfSender] MF-ID紐付け: ${updatedCount}件の仕訳にMF-IDを書き戻しました`)
  }

  return updatedCount
}
