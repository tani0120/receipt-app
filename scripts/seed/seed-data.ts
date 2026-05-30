/**
 * seed-data.ts — 初期シードデータ生成スクリプト
 *
 * JSONファイルが存在しない場合に、TSシードファイルからJSONを生成する。
 * 各StoreはJSON不在時に自動でTSシードを読み込むが、
 * このスクリプトを手動実行すれば事前にJSONを生成できる。
 *
 * 使い方:
 *   npx tsx scripts/seed/seed-data.ts
 *
 * 生成ファイル:
 *   data/vendors.json                    — 全社共通取引先マスタ
 *   data/industry-vectors-corporate.json — 法人用業種ベクトル辞書
 *   data/industry-vectors-sole.json      — 個人事業主用業種ベクトル辞書
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { VENDORS_GLOBAL } from './vendors_global'
import { INDUSTRY_VECTOR_CORPORATE } from './industry_vector_corporate'
import { INDUSTRY_VECTOR_SOLE } from './industry_vector_sole'

const DATA_DIR = join(process.cwd(), 'data')

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function writeIfAbsent(filePath: string, data: unknown, label: string): void {
  if (existsSync(filePath)) {
    console.log(`[seed] ${label}: すでに存在 → スキップ`)
    return
  }
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`[seed] ${label}: ${Array.isArray(data) ? data.length : 0}件を書き出し`)
}

// メイン
ensureDir()
writeIfAbsent(join(DATA_DIR, 'vendors.json'), VENDORS_GLOBAL, '取引先マスタ')
writeIfAbsent(join(DATA_DIR, 'industry-vectors-corporate.json'), INDUSTRY_VECTOR_CORPORATE, '法人用業種ベクトル')
writeIfAbsent(join(DATA_DIR, 'industry-vectors-sole.json'), INDUSTRY_VECTOR_SOLE, '個人用業種ベクトル')

console.log('[seed] 完了')
