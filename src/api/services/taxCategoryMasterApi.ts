/**
 * taxCategoryMasterApi.ts — 税区分マスタデータアクセス層
 *
 * accountMasterApi.ts（1138行/45KB）から税区分セクションを分離。
 * B-15: #57 ファイル肥大化の解消。
 *
 * 【責務】
 * - 税区分マスタの読み書き
 * - 税区分フィルタ・enrich（visibleIn + displayRate）
 * - 顧問先別税区分Override
 * - サーバー側のインメモリ + JSONファイル永続化
 *
 * 【依存関係】
 * - taxCategoryRoutes.ts がこのファイルを直接呼ぶ
 * - accountMasterApi.ts がre-exportする（後方互換）
 * - Supabase移行時にDB操作に差し替え
 *
 * 準拠: DL-042, DL-030
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'
import { getTaxAvailableForMethod } from './mfTaxAvailableStore'
import type { TaxCategory } from '../../types/shared-tax-category'

const DATA_DIR = join(process.cwd(), 'data')

// ────────────────────────────────────────────
// JSONファイルから税区分マスタを読み込み
// ────────────────────────────────────────────

export function loadTaxCategories(): TaxCategory[] {
  try {
    const raw = readFileSync(join(DATA_DIR, 'tax-category-master.json'), 'utf-8')
    const taxes = JSON.parse(raw) as TaxCategory[]
    console.log(`[taxCategoryMasterApi] 税区分${taxes.length}件をJSONから読み込み`)
    return taxes
  } catch (err) {
    console.error('[taxCategoryMasterApi] tax-category-master.json読み込み失敗:', err)
    return []
  }
}

// ────────────────────────────────────────────
// インメモリストア
// ────────────────────────────────────────────

/** マスタ税区分一覧（変更可能。saveで上書き） */
let masterTaxCategories: TaxCategory[] = loadTaxCategories()

// ────────────────────────────────────────────
// 税区分 — バックエンド判定（ドメインルール集約）
// フロントにフィルタ責務なし。フロントにデータ補完責務なし。
// ────────────────────────────────────────────

/** 課税方式キー */
const TAX_METHODS = ['proportional', 'individual', 'simplified', 'exempt'] as const
type VisibleInMap = Record<typeof TAX_METHODS[number], boolean>

/** 課税方式キー変換マップ（general→proportional等） */
const METHOD_KEY_MAP: Record<string, typeof TAX_METHODS[number]> = {
  'general': 'proportional',
  'proportional': 'proportional',
  'individual': 'individual',
  'simplified': 'simplified',
  'exempt': 'exempt',
}

/**
 * 各行にvisibleInフラグを付与（ドメインルール集約）
 *
 * available.jsonのキーはマスタID（例: SALES_TAXABLE_10）。
 * 共通ルール:
 * - direction='common'（不明・対象外）は全方式で常に表示
 * - MF独自カスタム税区分（isCustom && source='mcp'）は全方式で常に表示
 * - 免税タブ → commonのみ
 * - MFのavailableデータで判定（データ駆動）
 * - availableデータなし → !hidden && defaultVisible（安全なフォールバック）
 */
function assignVisibility(row: TaxCategory): TaxCategory {
  const visibleIn: VisibleInMap = {
    proportional: false,
    individual: false,
    simplified: false,
    exempt: false,
  }

  for (const method of TAX_METHODS) {
    // カスタム税区分 → 全タブ表示
    if (row.isCustom && row.source === 'mcp') { visibleIn[method] = true; continue }
    // common（不明・対象外）→ 全タブ表示
    if (row.direction === 'common') { visibleIn[method] = true; continue }
    // 免税タブ → commonのみ（上で処理済み）
    if (method === 'exempt') { visibleIn[method] = false; continue }
    // MFのavailableデータで判定
    const availableData = getTaxAvailableForMethod(method)
    if (availableData && row.taxCategoryId) {
      visibleIn[method] = availableData[row.taxCategoryId] === true
      continue
    }
    // フォールバック（availableデータなし）: マスタの静的属性で判定
    // simplifiedOnly（簡易課税専用）→ simplifiedのみ表示
    if (row.simplifiedOnly) {
      visibleIn[method] = method === 'simplified'
      continue
    }
    // individualOnly（個別対応専用）→ individualのみ表示
    if (row.individualOnly) {
      visibleIn[method] = method === 'individual'
      continue
    }
    // それ以外 → 非表示でなければ表示（proportional/individual/simplifiedで共通）
    visibleIn[method] = !row.hidden && row.defaultVisible !== false
  }

  return { ...row, visibleIn }
}

/**
 * 税率の表示文字列を生成（データ補完をバックエンドに集約）
 * taxRateがあれば変換、なければ名前から抽出
 */
function buildDisplayRate(row: TaxCategory): string {
  if (row.taxRate != null) {
    if (row.taxRate === 0) return '-'
    return `${Math.round(row.taxRate * 100)}%`
  }
  const match = row.name.match(/[\d.]+%/)
  return match ? match[0] : '-'
}

/** 行にバックエンド判定済みフィールド（visibleIn + displayRate）を付与 */
export function enrichRow(row: TaxCategory): TaxCategory {
  const withVisibility = assignVisibility(row)
  return { ...withVisibility, displayRate: buildDisplayRate(row) }
}

// ────────────────────────────────────────────
// 税区分マスタ — 取得系
// ────────────────────────────────────────────

/** 全税区分を取得（visibleIn + displayRate付き） */
export function getAllTaxCategories(): TaxCategory[] {
  return masterTaxCategories.map(row => enrichRow(row))
}

/** 税区分IDで1件取得 */
export function getTaxCategoryById(id: string): TaxCategory | undefined {
  return masterTaxCategories.find(t => t.taxCategoryId === id)
}

/** 税区分名マップ（ID→名前）を返す */
export function getTaxCategoryNameMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const t of masterTaxCategories) {
    map[t.taxCategoryId] = t.name
  }
  return map
}

// ────────────────────────────────────────────
// 税区分マスタ — フィルタ・ページネーション
// ────────────────────────────────────────────

/** 税区分フィルタ条件 */
export interface TaxCategoryFilterParams {
  /** 課税方式: general / individual / proportional / simplified / exempt / all（全件） */
  taxMethod?: 'general' | 'individual' | 'proportional' | 'simplified' | 'exempt' | 'all'
  /** ページ番号（1始まり） */
  page?: number
  /** 1ページあたりの件数（デフォルト50） */
  pageSize?: number
}

/** 税区分フィルタ結果 */
export interface TaxCategoryFilterResult {
  items: TaxCategory[]
  totalCount: number
  pagedItems: TaxCategory[]
  page: number
  totalPages: number
}

/**
 * マスタ税区分をフィルタ・ページネーションして返す
 * visibleInベースでフィルタ。フロントにフィルタ責務なし。
 */
export function getFilteredTaxCategories(params: TaxCategoryFilterParams): TaxCategoryFilterResult {
  const {
    taxMethod = 'general',
    page = 1,
    pageSize = 50,
  } = params

  // 全行にvisibleIn + displayRateを付与
  const enriched = masterTaxCategories.map(row => enrichRow(row))

  // taxMethod=all → 全件返却
  const filtered = taxMethod === 'all'
    ? enriched
    : enriched.filter(row => {
        const key = METHOD_KEY_MAP[taxMethod] ?? taxMethod
        return row.visibleIn?.[key as keyof VisibleInMap] === true
      })

  const totalCount = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  const pagedItems = filtered.slice(start, start + pageSize)

  return {
    items: filtered,
    totalCount,
    pagedItems,
    page: safePage,
    totalPages,
  }
}

// ────────────────────────────────────────────
// 税区分マスタ — 保存系
// ────────────────────────────────────────────

/**
 * マスタ税区分を全件上書き保存する
 *
 * フロントの saveChanges → localStorage書き込みを置換する。
 * 将来: Supabase upsert に差し替え。
 */
export function saveAllTaxCategories(taxCategories: TaxCategory[]): { ok: true; count: number } {
  masterTaxCategories = [...taxCategories]
  try {
    writeFileSync(join(DATA_DIR, 'tax-category-master.json'), JSON.stringify(taxCategories, null, 2), 'utf-8')
    console.log(`[taxCategoryMasterApi] マスタ税区分を${taxCategories.length}件保存・永続化`)
  } catch (err) {
    console.error('[taxCategoryMasterApi] tax-category-master.json永続化失敗:', err)
  }

  // syncMasterTaxCategoriesToClients 廃止。Override方式ではマスタ直接参照のため同期不要。

  return { ok: true, count: taxCategories.length }
}

// syncMasterTaxCategoriesToClients 廃止済み（Override方式移行。§53 §3参照）

// ────────────────────────────────────────────
// 顧問先別税区分 Override ストア（§53 Q3: 科目と同じ設計）
// マスタ直接参照 + Override（hidden）で合成
// 将来: Supabase client_tax_overrides テーブルに差し替え
// ────────────────────────────────────────────

/** 税区分Override（hiddenのみ） */
interface TaxCategoryOverride {
  taxCategoryId: string
  hidden?: boolean
}

/** 税区分Overrideストア: clientId → TaxCategoryOverride[] */
const clientTaxOverrideStore = new Map<string, TaxCategoryOverride[]>()

/** 旧形式ストア: 旧tax-categories-{clientId}.jsonからの復元用 */
const clientTaxStore = new Map<string, TaxCategory[]>()

// ── 永続化ヘルパー（税区分Override） ──

/** 税区分OverrideをJSONに永続化 */
function persistTaxOverrides(clientId: string, overrides: TaxCategoryOverride[]): void {
  try {
    const filePath = join(DATA_DIR, `tax-overrides-${clientId}.json`)
    writeFileSync(filePath, JSON.stringify(overrides, null, 2), 'utf-8')
    console.log(`[taxCategoryMasterApi] 顧問先${clientId}の税区分Override${overrides.length}件を永続化`)
  } catch (err) {
    console.error(`[taxCategoryMasterApi] 顧問先${clientId}の税区分Override永続化に失敗:`, err)
  }
}

/** 顧問先別税区分をJSONに永続化（旧形式・MFインポート時用） */
function persistClientTaxCategories(clientId: string, data: TaxCategory[]): void {
  try {
    const filePath = join(DATA_DIR, `tax-categories-${clientId}.json`)
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`[taxCategoryMasterApi] 顧問先${clientId}の税区分をJSONに永続化`)
  } catch (err) {
    console.error(`[taxCategoryMasterApi] 顧問先${clientId}の税区分永続化に失敗:`, err)
  }
}

/** 旧形式からOverrideへマイグレーション */
function migrateTaxFromLegacy(clientId: string, legacyTaxes: TaxCategory[]): void {
  const masterById = new Map(masterTaxCategories.map(t => [t.taxCategoryId, t]))
  const overrides: TaxCategoryOverride[] = []

  for (const tax of legacyTaxes) {
    const master = masterById.get(tax.taxCategoryId)
    if (!master) continue

    if (tax.hidden !== master.hidden) {
      overrides.push({ taxCategoryId: tax.taxCategoryId, hidden: tax.hidden })
    }
  }

  if (overrides.length > 0) {
    clientTaxOverrideStore.set(clientId, overrides)
    persistTaxOverrides(clientId, overrides)
    console.log(`[taxCategoryMasterApi] 顧問先${clientId}: 税区分Override${overrides.length}件を抽出`)
  }
}

/**
 * 起動時: 税区分Override + 旧データを復元
 */
function restoreAllClientTaxCategories(): void {
  if (!existsSync(DATA_DIR)) return
  const files = readdirSync(DATA_DIR)

  // 1. 税区分Override復元
  for (const file of files.filter(f => f.startsWith('tax-overrides-') && f.endsWith('.json'))) {
    const clientId = file.replace('tax-overrides-', '').replace('.json', '')
    try {
      const raw = readFileSync(join(DATA_DIR, file), 'utf-8')
      clientTaxOverrideStore.set(clientId, JSON.parse(raw))
      console.log(`[taxCategoryMasterApi] 顧問先${clientId}の税区分Overrideを復元`)
    } catch (err) {
      console.error(`[taxCategoryMasterApi] ${file}の読み込み失敗:`, err)
    }
  }

  // 2. 旧形式マイグレーション（tax-overridesが未作成の場合のみ）
  for (const file of files.filter(f => f.startsWith('tax-categories-') && f.endsWith('.json') && f !== 'tax-category-master.json')) {
    const clientId = file.replace('tax-categories-', '').replace('.json', '')
    try {
      const raw = readFileSync(join(DATA_DIR, file), 'utf-8')
      const legacy: TaxCategory[] = JSON.parse(raw)
      clientTaxStore.set(clientId, legacy) // 旧形式も保持（後方互換）

      if (!clientTaxOverrideStore.has(clientId)) {
        migrateTaxFromLegacy(clientId, legacy)
      }
      console.log(`[taxCategoryMasterApi] 顧問先${clientId}の税区分をJSONから復元`)
    } catch (err) {
      console.error(`[taxCategoryMasterApi] ${file}の読み込み失敗:`, err)
    }
  }
}

/**
 * 顧問先別の税区分一覧を取得する（マスタ + Override 合成）
 */
export function getClientTaxCategories(clientId: string): TaxCategory[] {
  const overrides = clientTaxOverrideStore.get(clientId) ?? []
  const overrideMap = new Map(overrides.map(o => [o.taxCategoryId, o]))

  return masterTaxCategories.map(t => {
    const override = overrideMap.get(t.taxCategoryId)
    const merged = override
      ? { ...t, ...(override.hidden !== undefined && { hidden: override.hidden }) }
      : { ...t }
    return enrichRow(merged)
  })
}

/** フィルタ付き顧問先税区分取得 */
export function getFilteredClientTaxCategories(
  clientId: string,
  params: TaxCategoryFilterParams,
): TaxCategoryFilterResult {
  const data = getClientTaxCategories(clientId)
  const {
    taxMethod = 'general',
    page = 1,
    pageSize = 50,
  } = params

  const filtered = data.filter(row => {
    if (taxMethod === 'all') return true
    return row.visibleIn?.[taxMethod as keyof NonNullable<TaxCategory['visibleIn']>] === true
  })

  const totalCount = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  const pagedItems = filtered.slice(start, start + pageSize)

  return {
    items: filtered,
    totalCount,
    pagedItems,
    page: safePage,
    totalPages,
  }
}

/**
 * 顧問先別の税区分を保存する（diff抽出→Override保存）
 */
export function saveClientTaxCategories(
  clientId: string,
  taxCategories: TaxCategory[],
): { ok: true; count: number } {
  const masterById = new Map(masterTaxCategories.map(t => [t.taxCategoryId, t]))
  const overrides: TaxCategoryOverride[] = []

  for (const tax of taxCategories) {
    const master = masterById.get(tax.taxCategoryId)
    if (!master) continue

    if (tax.hidden !== master.hidden) {
      overrides.push({ taxCategoryId: tax.taxCategoryId, hidden: tax.hidden })
    }
  }

  clientTaxOverrideStore.set(clientId, overrides)
  persistTaxOverrides(clientId, overrides)

  // 旧形式も更新（後方互換）
  clientTaxStore.set(clientId, [...taxCategories])
  persistClientTaxCategories(clientId, taxCategories)

  console.log(`[taxCategoryMasterApi] 顧問先${clientId}: 税区分Override${overrides.length}件保存`)
  return { ok: true, count: taxCategories.length }
}

// 起動時に永続化済みの顧問先別税区分データを復元
restoreAllClientTaxCategories()

/** 税区分マスタ件数（ログ用） */
export function getTaxCategoryCount(): number {
  return masterTaxCategories.length
}

/** 顧問先税区分ストア件数（ログ用） */
export function getClientTaxStoreSize(): number {
  return clientTaxStore.size
}

console.log(`[taxCategoryMasterApi] 税区分${masterTaxCategories.length}件をロード（顧問先: ${clientTaxStore.size}社）`)
