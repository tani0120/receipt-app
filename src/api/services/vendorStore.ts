/**
 * vendorStore.ts — 取引先JSON永続化ストア
 *
 * 【設計原則】
 * - サーバー側のインメモリ + JSONファイル永続化
 * - 起動時にJSONから読み込み。JSONが存在しなければ初期シード（VENDORS_GLOBAL）を投入
 * - Supabase移行時にDB操作に差し替え
 * - 型はmocks/types/pipeline/vendor.typeから参照（repositories/types.ts経由）
 *
 * 【ファイル場所】
 * - data/vendors.json（.gitignoreに追加推奨）
 *
 * 準拠: DL-042
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { Vendor } from '../../types/pipeline/vendor.type'
import { VENDORS_GLOBAL } from '../../data/pipeline/vendors_global'

const DATA_DIR = join(process.cwd(), 'data')
const DATA_FILE = join(DATA_DIR, 'vendors.json')

// インメモリストア
let vendorList: Vendor[] = []

// ID連番カウンター（gbl-NNNN形式）
let idCounter = 0

// ============================================================
// シードデータ（JSONが存在しない場合のみ使用）
// ============================================================

function loadSeedData(): Vendor[] {
  return [...VENDORS_GLOBAL]
}

// ============================================================
// 永続化
// ============================================================

function save(): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true })
    }
    writeFileSync(DATA_FILE, JSON.stringify(vendorList, null, 2), 'utf-8')
  } catch (err) {
    console.error('[vendorStore] JSON書き出しエラー:', err)
  }
}

/** 起動時にJSONから読み込み。なければ初期シード投入 */
export function loadVendors(): void {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8')
      vendorList = JSON.parse(raw) as Vendor[]
      console.log(`[vendorStore] ${vendorList.length}件をJSONから読み込み`)
    } else {
      vendorList = loadSeedData()
      save()
      console.log(`[vendorStore] JSONなし。初期シード${vendorList.length}件を投入`)
    }
  } catch (err) {
    console.error('[vendorStore] JSON読み込みエラー:', err)
    vendorList = loadSeedData()
    save()
  }
  // IDカウンターを既存データの最大値に設定
  updateIdCounter()
}

function updateIdCounter(): void {
  for (const v of vendorList) {
    const match = v.vendor_id.match(/^gbl-(\d+)$/)
    if (match && match[1]) {
      const num = parseInt(match[1], 10)
      if (num > idCounter) idCounter = num
    }
  }
}

// ============================================================
// 基本CRUD
// ============================================================

/** 全件取得（オプション: vendor_vectorフィルタ） */
export function getAll(opts?: { vendorOnly?: boolean; nonVendorOnly?: boolean }): Vendor[] {
  if (opts?.vendorOnly) {
    return vendorList.filter(v => v.vendor_vector !== null)
  }
  if (opts?.nonVendorOnly) {
    return vendorList.filter(v => v.vendor_vector === null)
  }
  return [...vendorList]
}

/** vendor_idで1件取得 */
export function getById(vendorId: string): Vendor | undefined {
  return vendorList.find(v => v.vendor_id === vendorId)
}

/** 1件追加 */
export function create(vendor: Omit<Vendor, 'vendor_id'> & { vendor_id?: string }): Vendor {
  const vendor_id = vendor.vendor_id || generateId()
  const newVendor: Vendor = { ...vendor, vendor_id } as Vendor
  vendorList.push(newVendor)
  save()
  console.log(`[vendorStore] 追加: ${newVendor.company_name} (${vendor_id})`)
  return newVendor
}

/** 部分更新 */
export function update(vendorId: string, partial: Partial<Vendor>): boolean {
  const idx = vendorList.findIndex(v => v.vendor_id === vendorId)
  if (idx < 0) return false
  vendorList[idx] = { ...vendorList[idx], ...partial, vendor_id: vendorId } as Vendor
  save()
  return true
}

/** 1件削除 */
export function remove(vendorId: string): boolean {
  const idx = vendorList.findIndex(v => v.vendor_id === vendorId)
  if (idx < 0) return false
  vendorList.splice(idx, 1)
  save()
  console.log(`[vendorStore] 削除: ${vendorId}`)
  return true
}

/** 件数取得 */
export function count(): number {
  return vendorList.length
}

// ============================================================
// 検索
// ============================================================

/** match_keyで検索 */
export function findByMatchKey(key: string): Vendor | undefined {
  const normalized = key.toLowerCase()
  return vendorList.find(v => v.match_key.toLowerCase() === normalized)
}

/** T番号で検索 */
export function findByTNumber(tNumber: string): Vendor | undefined {
  return vendorList.find(v => v.t_numbers.includes(tNumber))
}

// ============================================================
// ヘルパー
// ============================================================

function generateId(): string {
  idCounter++
  return `gbl-${String(idCounter).padStart(4, '0')}`
}

// 起動時に自動読み込み
loadVendors()

