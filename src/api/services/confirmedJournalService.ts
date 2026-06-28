/**
 * confirmedJournalService.ts — 確定済み仕訳のCRUDサービス
 *
 * 【設計原則: DL-050】
 * Route層はリクエスト受付とレスポンス返却のみ。
 * ビジネスロジック（CSVパース、バッチID生成、重複排除等）はService層に閉じ込める。
 *
 * 【責務】
 * - CSVインポート（バッチID生成 + CSVパース + 重複排除）
 * - バッチ削除
 * - 顧問先全削除
 *
 * ※ 正規化は normalizeConfirmedJournalsService.ts が担当
 *
 * 準拠: DL-050, DL-042
 */

import crypto from 'crypto'
import { parseMfCsv } from '../../utils/pipeline/mfCsvParser'
import { createMockRepositories } from '../../repositories/mock'
const confirmedJournalRepo = createMockRepositories().confirmedJournal

// ────────────────────────────────────────────
// 型定義
// ────────────────────────────────────────────

export interface CsvImportResult {
  ok: boolean
  /** 生成されたバッチID */
  importBatchId: string
  /** 追加された仕訳件数 */
  added: number
  /** 重複スキップ件数 */
  skipped: number
  /** CSVの総行数 */
  totalRows: number
  /** パース警告 */
  warnings: string[]
  /** DB内の顧問先仕訳総数 */
  totalInDb: number
}

export interface BatchDeleteResult {
  /** 削除された仕訳件数 */
  removed: number
}

export interface ClientDeleteResult {
  /** 削除された仕訳件数 */
  removed: number
}

// ────────────────────────────────────────────
// 内部ヘルパー
// ────────────────────────────────────────────

/** バッチID生成（batch_ + 8文字ランダム） */
function generateBatchId(): string {
  const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.randomBytes(8)
  let id = 'batch_'
  for (let i = 0; i < 8; i++) {
    id += ID_CHARS[bytes[i]! % ID_CHARS.length]
  }
  return id
}

// ────────────────────────────────────────────
// サービス関数
// ────────────────────────────────────────────

/**
 * MF CSVテキストからインポート
 *
 * - バッチIDの生成
 * - CSVパース（parseMfCsv）
 * - 重複排除付き永続化（confirmedJournalRepo.importBatch()）
 *
 * @param clientId 顧問先ID
 * @param csvText CSVテキスト
 */
export async function importFromCsv(clientId: string, csvText: string): Promise<CsvImportResult> {
  const importBatchId = generateBatchId()

  // CSVパース
  const parseResult = parseMfCsv(csvText, clientId, importBatchId)

  if (parseResult.journals.length === 0) {
    return {
      ok: false,
      importBatchId,
      added: 0,
      skipped: 0,
      totalRows: parseResult.total_rows,
      warnings: parseResult.warnings,
      totalInDb: await confirmedJournalRepo.countByClientId(clientId),
    }
  }

  // 永続化（重複排除付き）— Repository経由
  const importResult = await confirmedJournalRepo.importBatch(parseResult.journals)

  return {
    ok: true,
    importBatchId,
    added: importResult.added,
    skipped: importResult.skipped,
    totalRows: parseResult.total_rows,
    warnings: parseResult.warnings,
    totalInDb: await confirmedJournalRepo.countByClientId(clientId),
  }
}

/**
 * インポートバッチを削除
 *
 * @param batchId バッチID
 */
export async function deleteBatch(batchId: string): Promise<BatchDeleteResult> {
  const result = await confirmedJournalRepo.deleteBatch(batchId)
  return { removed: result.removed }
}

/**
 * 顧問先の確定済み仕訳を全削除
 *
 * @param clientId 顧問先ID
 */
export async function deleteByClient(clientId: string): Promise<ClientDeleteResult> {
  const result = await confirmedJournalRepo.deleteByClientId(clientId)
  return { removed: result.removed }
}

