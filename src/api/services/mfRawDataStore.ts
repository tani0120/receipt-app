/**
 * mfRawDataStore.ts — MFインポート生データの保存・読み込み
 *
 * レイヤー: ★service★
 * 責務: MFから取得した生データをパターン別にJSONファイルとして永続化し、
 *       次回インポート時の差分検知のベースデータとする。
 *
 * 保存先: data/mf-raw/
 *   - taxes-{method}.json        （税区分・課税方式別）
 *   - accounts-{type}-{sub}.json （勘定科目・事業形態×課税方式別）
 *
 * Supabase移行時: ファイル → テーブルに差し替え
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

// ---------- 定数 ----------

/** 保存ディレクトリ */
const MF_RAW_DIR = resolve(process.cwd(), 'data', 'mf-raw')

// ---------- 型定義 ----------

/** 保存データの共通ヘッダ */
export interface MfRawDataEnvelope<T = unknown> {
  /** インポート元のclientId（顧問先ID） */
  clientId: string
  /** 顧問先名（表示用） */
  clientName: string
  /** パターン識別子（例: 'taxes-proportional', 'accounts-corp-proportional'） */
  pattern: string
  /** インポート日時（ISO 8601） */
  importedAt: string
  /** 件数 */
  itemCount: number
  /** MF生レスポンス */
  items: T[]
}

// ---------- ヘルパー ----------

/** ディレクトリがなければ作成 */
function ensureDir(): void {
  if (!existsSync(MF_RAW_DIR)) {
    mkdirSync(MF_RAW_DIR, { recursive: true })
  }
}

/** パターン名からファイルパスを生成 */
function getFilePath(pattern: string): string {
  return resolve(MF_RAW_DIR, `${pattern}.json`)
}

// ---------- 公開API ----------

/**
 * MF生データを保存する
 */
export function saveMfRawData<T = unknown>(envelope: MfRawDataEnvelope<T>): void {
  ensureDir()
  const filePath = getFilePath(envelope.pattern)
  writeFileSync(filePath, JSON.stringify(envelope, null, 2), 'utf8')
  console.log(`[mfRawDataStore] ${envelope.pattern}: ${envelope.itemCount}件を保存 (${filePath})`)
}

/**
 * MF生データを読み込む（前回データ）
 * @returns 前回データ。存在しない場合はnull
 */
export function loadMfRawData<T = unknown>(pattern: string): MfRawDataEnvelope<T> | null {
  const filePath = getFilePath(pattern)
  if (!existsSync(filePath)) return null
  try {
    const raw = readFileSync(filePath, 'utf8')
    return JSON.parse(raw) as MfRawDataEnvelope<T>
  } catch (e) {
    console.warn(`[mfRawDataStore] ${pattern}: 読み込み失敗:`, (e as Error).message)
    return null
  }
}

/**
 * 全パターンのインポート履歴を取得（ファイル一覧からメタ情報を抽出）
 */
export function listMfRawPatterns(): Array<{
  pattern: string
  clientId: string
  clientName: string
  importedAt: string
  itemCount: number
}> {
  ensureDir()
  const files = readdirSync(MF_RAW_DIR).filter((f: string) => f.endsWith('.json'))
  const results: Array<{
    pattern: string
    clientId: string
    clientName: string
    importedAt: string
    itemCount: number
  }> = []
  for (const file of files) {
    try {
      const raw = readFileSync(resolve(MF_RAW_DIR, file), 'utf8')
      const data = JSON.parse(raw) as MfRawDataEnvelope
      results.push({
        pattern: data.pattern,
        clientId: data.clientId,
        clientName: data.clientName,
        importedAt: data.importedAt,
        itemCount: data.itemCount,
      })
    } catch {
      // 読み込み失敗は無視
    }
  }
  return results
}
