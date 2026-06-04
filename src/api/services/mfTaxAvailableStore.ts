/**
 * mfTaxAvailableStore — MF課税方式別available管理
 *
 * MFから取得した4方式分のavailableデータを永続化・参照する。
 * IDパターンマッチ（想像）を廃止し、MFのavailableを正解として使用する。
 *
 * データ構造:
 *   { proportional: { masterId: boolean }, individual: {...}, simplified: {...}, exempt: {...} }
 *
 * ファイル: data/mf-tax-available.json
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const DATA_PATH = join(process.cwd(), 'data', 'mf-tax-available.json')

/** 課税方式キー（スグスル内部名） */
export type TaxMethodKey = 'proportional' | 'individual' | 'simplified' | 'exempt'

/** 4方式分のavailableマップ: { マスタID: boolean } */
export type TaxAvailableMap = Record<string, Record<string, boolean>>

let cache: TaxAvailableMap | null = null

/** 有効な課税方式キー一覧 */
const VALID_METHODS: readonly string[] = ['proportional', 'individual', 'simplified', 'exempt']

/** JSONから読み込み（キャッシュ付き） */
export function loadTaxAvailable(): TaxAvailableMap {
  if (cache) return cache
  if (!existsSync(DATA_PATH)) {
    console.log('[mfTaxAvailableStore] ファイルなし。空で初期化')
    cache = {}
    return cache
  }
  try {
    const raw = readFileSync(DATA_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as TaxAvailableMap
    // ゴミデータ清掃: 有効なキー（4方式）以外を除去
    const cleaned: TaxAvailableMap = {}
    let removedCount = 0
    for (const key of Object.keys(parsed)) {
      if (VALID_METHODS.includes(key)) {
        cleaned[key] = parsed[key]!
      } else {
        removedCount++
      }
    }
    if (removedCount > 0) {
      console.log(`[mfTaxAvailableStore] ゴミデータ${removedCount}件を除去`)
      writeFileSync(DATA_PATH, JSON.stringify(cleaned, null, 2), 'utf-8')
    }
    cache = cleaned
    const methods = Object.keys(cache)
    console.log(`[mfTaxAvailableStore] ${methods.length}方式を読み込み (${methods.join(', ')})`)
    return cache
  } catch (err) {
    console.error('[mfTaxAvailableStore] 読み込み失敗:', err)
    cache = {}
    return cache
  }
}

/** 特定方式のavailableを更新・永続化 */
export function saveTaxAvailable(method: TaxMethodKey, available: Record<string, boolean>): void {
  const data = loadTaxAvailable()
  data[method] = available
  cache = data
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`[mfTaxAvailableStore] ${method}: ${Object.values(available).filter(v => v).length}件trueを保存`)
}

/** キャッシュを無効化して再読み込み */
export function invalidateCache(): void {
  cache = null
}

/** 全4方式分を取得 */
export function getAllTaxAvailable(): TaxAvailableMap {
  return loadTaxAvailable()
}

/** 特定方式のavailableを取得 */
export function getTaxAvailableForMethod(method: TaxMethodKey): Record<string, boolean> | null {
  const data = loadTaxAvailable()
  return data[method] ?? null
}

/**
 * マスタIDからavailableを判定
 * @param method 課税方式
 * @param masterId 税区分マスタID（例: SALES_TAXABLE_10）
 * @returns true=利用可 / false=利用不可 / null=データなし
 */
export function isAvailableByMasterId(method: TaxMethodKey, masterId: string): boolean | null {
  const methodData = getAllTaxAvailable()[method]
  if (!methodData) return null
  return methodData[masterId] ?? null
}

// 起動時に読み込み
loadTaxAvailable()
