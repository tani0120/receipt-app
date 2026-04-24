/**
 * 資料算出ユーティリティ
 *
 * 【設計原則】
 * - composable/Repositoryにロジックを入れない（フェーズルール）
 * - 算出関数はここに集約
 *
 * 用途: 進捗管理画面の「資料受取日」「未選別」を動的算出
 */
import type { DocEntry } from '@/repositories/types'

/**
 * 未選別件数を算出（送信確定前のトータル書類枚数）
 *
 * 「未選別」の定義:
 * - pending（未処理）だけではなく、選別済み（target/supporting/excluded）も含む
 * - 「送信して確定する前」の全書類が対象
 * - migrate（確定送信）後に0になる
 */
export function countUnsorted(docs: DocEntry[]): number {
  return docs.length
}

/**
 * 最新の資料受取日を算出（receivedAtの最大値）
 * 資料がない場合は空文字を返す
 *
 * 返り値: 'YYYY/MM/DD' 形式
 */
export function latestReceivedDate(docs: DocEntry[]): string {
  if (docs.length === 0) return ''
  const latest = docs.reduce((max, d) =>
    d.receivedAt > max.receivedAt ? d : max
  )
  const date = new Date(latest.receivedAt)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}/${mm}/${dd}`
}

/**
 * CSV未出力のうち最古の資料受取日を算出
 * （将来用。現在は資料→仕訳の紐付けが未実装のため未使用）
 */
export function oldestUnexportedDate(docs: DocEntry[]): string {
  const pending = docs.filter(d => d.status === 'target')
  if (pending.length === 0) return ''
  const oldest = pending.reduce((min, d) =>
    d.receivedAt < min.receivedAt ? d : min
  )
  const date = new Date(oldest.receivedAt)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}/${mm}/${dd}`
}
