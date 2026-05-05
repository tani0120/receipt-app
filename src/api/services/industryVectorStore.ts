/**
 * industryVectorStore.ts — 業種ベクトルJSON永続化ストア
 *
 * レイヤー: ★service★
 * 責務: 業種ベクトル（法人用/個人事業主用）のインメモリ + JSON永続化管理
 *
 * 起動時にJSONから読み込み。なければ初期シード投入。
 * 将来: Supabase industry_vectors テーブルに差し替え
 * 準拠: DL-042, Phase 2 Step 8
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { IndustryVectorEntry } from '../../types/pipeline/vendor.type'
import { INDUSTRY_VECTOR_CORPORATE } from '../../data/pipeline/industry_vector_corporate'
import { INDUSTRY_VECTOR_SOLE } from '../../data/pipeline/industry_vector_sole'

const DATA_DIR = join(process.cwd(), 'data')
const CORPORATE_FILE = join(DATA_DIR, 'industry-vectors-corporate.json')
const SOLE_FILE = join(DATA_DIR, 'industry-vectors-sole.json')

// インメモリストア
let corporateList: IndustryVectorEntry[] = []
let soleList: IndustryVectorEntry[] = []

// ============================================================
// 永続化
// ============================================================

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function saveCorporate(): void {
  try {
    ensureDir()
    writeFileSync(CORPORATE_FILE, JSON.stringify(corporateList, null, 2), 'utf-8')
  } catch (err) {
    console.error('[industryVectorStore] 法人JSON書き出しエラー:', err)
  }
}

function saveSole(): void {
  try {
    ensureDir()
    writeFileSync(SOLE_FILE, JSON.stringify(soleList, null, 2), 'utf-8')
  } catch (err) {
    console.error('[industryVectorStore] 個人JSON書き出しエラー:', err)
  }
}

// ============================================================
// 起動時読み込み
// ============================================================

function loadFile(filePath: string, seed: IndustryVectorEntry[]): IndustryVectorEntry[] {
  try {
    if (existsSync(filePath)) {
      const raw = readFileSync(filePath, 'utf-8')
      const data = JSON.parse(raw) as IndustryVectorEntry[]
      console.log(`[industryVectorStore] ${filePath}: ${data.length}件をJSONから読み込み`)
      return data
    }
  } catch (err) {
    console.error(`[industryVectorStore] ${filePath} 読み込みエラー:`, err)
  }
  // JSONなしまたはエラー → シードを投入
  const cloned = seed.map(e => ({ ...e, expense: [...e.expense], income: [...e.income] }))
  console.log(`[industryVectorStore] ${filePath}: 初期シード${cloned.length}件を投入`)
  return cloned
}

export function loadIndustryVectors(): void {
  corporateList = loadFile(CORPORATE_FILE, INDUSTRY_VECTOR_CORPORATE)
  soleList = loadFile(SOLE_FILE, INDUSTRY_VECTOR_SOLE)
  // 初回のみJSON書き出し
  if (!existsSync(CORPORATE_FILE)) saveCorporate()
  if (!existsSync(SOLE_FILE)) saveSole()
}

// ============================================================
// 法人用
// ============================================================

/** 法人用業種ベクトル一覧 */
export function getCorporate(): IndustryVectorEntry[] {
  return corporateList.map(e => ({ ...e, expense: [...e.expense], income: [...e.income] }))
}

/** 法人用業種ベクトルを全件上書き保存 */
export function saveCorporateAll(entries: IndustryVectorEntry[]): { ok: true; count: number } {
  corporateList = entries.map(e => ({ ...e, expense: [...e.expense], income: [...e.income] }))
  saveCorporate()
  console.log(`[industryVectorStore] 法人用を${entries.length}件保存`)
  return { ok: true, count: entries.length }
}

// ============================================================
// 個人事業主用
// ============================================================

/** 個人事業主用業種ベクトル一覧 */
export function getSole(): IndustryVectorEntry[] {
  return soleList.map(e => ({ ...e, expense: [...e.expense], income: [...e.income] }))
}

/** 個人事業主用業種ベクトルを全件上書き保存 */
export function saveSoleAll(entries: IndustryVectorEntry[]): { ok: true; count: number } {
  soleList = entries.map(e => ({ ...e, expense: [...e.expense], income: [...e.income] }))
  saveSole()
  console.log(`[industryVectorStore] 個人事業主用を${entries.length}件保存`)
  return { ok: true, count: entries.length }
}

// 起動時に自動読み込み
loadIndustryVectors()
