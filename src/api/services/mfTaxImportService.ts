/**
 * mfTaxImportService.ts — MF税区分インポート処理（バックエンド）
 *
 * フロント（Vue）に分散していたインポートの照合・差分検知・差分適用・保存処理を
 * バックエンドに集約。フロントはAPI呼び出しと結果表示のみ。
 *
 * エンドポイント:
 *   POST /api/mf/import-taxes/preview — 差分プレビュー
 *   POST /api/mf/import-taxes/apply   — 差分適用
 */

import { mcpFetchTaxes, mcpFetchTermSettings } from './mfMcpClient'
import { getAllTaxCategories, saveAllTaxCategories } from './accountMasterStore'
import { getAllTaxAvailable, saveTaxAvailable, type TaxMethodKey } from './mfTaxAvailableStore'
import { saveMfRawData } from './mfRawDataStore'
import { getById } from './clientStore'
import { guessDirectionFromName, guessQualifiedFromName } from '../../types/shared-tax-category'
import type { TaxCategory } from '../../types/shared-tax-category'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 定数（データ駆動化済み）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** MF税区分IDのパターンキーへの変換（実測値 2026-05-29確認済み） */
export const MF_TAX_METHOD_TO_PATTERN: Record<string, TaxMethodKey> = {
  'PROPORTIONAL_ALLOCATION': 'proportional',
  'INDIVIDUAL_ALLOCATION': 'individual',
  'SIMPLE': 'simplified',        // ★実測値（SIMPLIFIEDではない）
  'FREE': 'exempt',
}

/** パターンキー→日本語ラベル */
export const PATTERN_LABELS: Record<TaxMethodKey, string> = {
  proportional: '原則（一括比例）',
  individual: '原則（個別対応）',
  simplified: '簡易',
  exempt: '免税',
}

/** 有効な課税方式キー一覧 */
const VALID_METHODS: TaxMethodKey[] = ['proportional', 'individual', 'simplified', 'exempt']

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MF税区分の型
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface MfTax {
  id: string
  name: string
  abbreviation?: string
  available: boolean
  tax_rate?: number
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 差分検知結果
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface TaxImportDiff {
  added: Array<{ name: string; mfId: string; taxRate?: number }>
  rateChanged: Array<{ name: string; mfId: string; oldRate?: number; newRate?: number }>
  deleteCandidates: Array<{ id: string; name: string; mfId: string }>
  unchanged: number
}

export interface TaxImportPreviewResult {
  pattern: TaxMethodKey
  diff: TaxImportDiff
  autoRuleApplied: number
  deprecatedReset: number
  reportLines: string[]
  hasDiff: boolean
  masterCount: number
}

export interface TaxImportApplyResult {
  success: boolean
  summary: string
  updatedMaster: TaxCategory[]
  pattern: TaxMethodKey
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 共通: 差分検知ロジック
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface DetectResult {
  pattern: TaxMethodKey
  mfTaxes: MfTax[]
  masterItems: TaxCategory[]
  nameToRow: Map<string, TaxCategory>
  diff: TaxImportDiff
  autoRuleApplied: number
  deprecatedReset: number
  availData: Record<string, Record<string, boolean>>
}

/**
 * MFからデータ取得 → マスタ照合 → 差分検知（preview/apply共通）
 */
async function detectDiff(clientId: string, dryRun: boolean = false): Promise<DetectResult> {
  // 1. MFのtermSettingsから課税方式を自動検知
  const termSettings = await mcpFetchTermSettings(undefined, clientId)
  const currentTerm = termSettings[0]
  if (!currentTerm?.tax_method) {
    throw new Error('MFから課税方式を取得できません')
  }
  const pattern = MF_TAX_METHOD_TO_PATTERN[currentTerm.tax_method]
  if (!pattern) {
    throw new Error(`未対応の課税方式: ${currentTerm.tax_method}`)
  }

  // 2. MFの税区分一覧を取得
  const mfTaxes = await mcpFetchTaxes(clientId) as MfTax[]

  // 3. サーバーのマスタデータから照合用Mapを構築（★フロント状態に依存しない）
  const masterItems: TaxCategory[] = JSON.parse(JSON.stringify(getAllTaxCategories()))
  const nameToRow = new Map<string, TaxCategory>()
  for (const row of masterItems) {
    nameToRow.set(row.name, row)
  }
  const mfNameSet = new Set(mfTaxes.map(t => t.name))

  // 4. 自動ルール: 簡易課税専用税区分を他方式で非表示化
  //    判定基準: マスタのsimplifiedOnlyフラグ（データ駆動）
  const autoRuleMethods: TaxMethodKey[] = ['proportional', 'individual', 'exempt']
  let autoRuleApplied = 0

  // availableデータをディープコピー（元データを変異させない）
  const availData: Record<string, Record<string, boolean>> = JSON.parse(JSON.stringify(getAllTaxAvailable()))
  // ゴミデータ清掃: 有効なキー以外を除去
  for (const key of Object.keys(availData)) {
    if (!VALID_METHODS.includes(key as TaxMethodKey)) {
      delete availData[key]
    }
  }

  // マスタのsimplifiedOnlyフラグでmfIdを逆引き
  const simplifiedOnlyMfIds = new Set<string>()
  for (const row of masterItems) {
    if (row.simplifiedOnly && row.mfId) {
      simplifiedOnlyMfIds.add(row.mfId)
    }
  }

  for (const t of mfTaxes) {
    if (simplifiedOnlyMfIds.has(t.id)) {
      for (const method of autoRuleMethods) {
        if (availData[method] && availData[method][t.id] === true) {
          availData[method][t.id] = false
          autoRuleApplied++
        }
      }
    }
  }

  // 自動ルール適用結果を保存（dryRun時はスキップ）
  if (autoRuleApplied > 0 && !dryRun) {
    for (const method of autoRuleMethods) {
      if (availData[method]) {
        saveTaxAvailable(method, availData[method])
      }
    }
  }

  // 5. 差分検知（名前ベース照合）
  const diff: TaxImportDiff = {
    added: [],
    rateChanged: [],
    deleteCandidates: [],
    unchanged: 0,
  }

  for (const t of mfTaxes) {
    const existing = nameToRow.get(t.name)
    if (!existing) {
      diff.added.push({ name: t.name, mfId: t.id, taxRate: t.tax_rate })
    } else {
      let changed = false
      if (t.tax_rate !== undefined && existing.taxRate !== undefined && t.tax_rate !== existing.taxRate) {
        diff.rateChanged.push({ name: t.name, mfId: t.id, oldRate: existing.taxRate, newRate: t.tax_rate })
        changed = true
      }
      if (!changed) diff.unchanged++
    }
  }

  // マスタにあるがMFにない → 削除候補（source='mf'の行のみ）
  for (const row of masterItems) {
    if (row.source === 'mf' && !mfNameSet.has(row.name)) {
      diff.deleteCandidates.push({ id: row.id, name: row.name, mfId: row.mfId ?? '' })
    }
  }

  // 6. deprecated自動リセット（availableでtrue=有効なのにdeprecated=trueの行）
  let deprecatedReset = 0
  for (const method of VALID_METHODS) {
    const methodAvail = availData[method] ?? {}
    for (const row of masterItems) {
      if (row.mfId && methodAvail[row.mfId] === true && row.deprecated) {
        row.deprecated = false
        deprecatedReset++
      }
    }
  }

  return { pattern, mfTaxes, masterItems, nameToRow, diff, autoRuleApplied, deprecatedReset, availData }
}

/**
 * 差分レポート行を生成
 */
function buildReportLines(diff: TaxImportDiff, autoRuleApplied: number, deprecatedReset: number): string[] {
  const lines: string[] = []
  if (autoRuleApplied > 0) {
    lines.push(`🔧 自動ルール: 一種〜六種の税区分 ${autoRuleApplied}件をMFインポート利用非表示化`)
  }
  if (diff.added.length > 0) {
    lines.push(`➕ 追加: ${diff.added.length}件`)
    for (const a of diff.added.slice(0, 5)) lines.push(`  ・${a.name}`)
    if (diff.added.length > 5) lines.push(`  …他${diff.added.length - 5}件`)
  }
  if (diff.rateChanged.length > 0) {
    lines.push(`📊 税率変更: ${diff.rateChanged.length}件`)
    for (const c of diff.rateChanged.slice(0, 5)) {
      const oldR = c.oldRate != null ? `${Math.round(c.oldRate * 100)}%` : '-'
      const newR = c.newRate != null ? `${Math.round(c.newRate * 100)}%` : '-'
      lines.push(`  ・${c.name}: ${oldR} → ${newR}`)
    }
  }
  if (diff.deleteCandidates.length > 0) {
    lines.push(`🗑️ 削除候補（非表示化）: ${diff.deleteCandidates.length}件`)
    for (const d of diff.deleteCandidates.slice(0, 5)) lines.push(`  ・${d.name}`)
  }
  lines.push(`✅ 変更なし: ${diff.unchanged}件`)
  if (deprecatedReset > 0) {
    lines.push(`🔄 表示リセット: ${deprecatedReset}件`)
  }
  return lines
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// preview: 差分プレビュー（データ変更なし）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function previewTaxImport(clientId: string): Promise<TaxImportPreviewResult> {
  const { pattern, diff, autoRuleApplied, deprecatedReset, masterItems } = await detectDiff(clientId, true)
  const hasDiff = diff.added.length > 0 || diff.rateChanged.length > 0 || diff.deleteCandidates.length > 0
  const reportLines = buildReportLines(diff, autoRuleApplied, deprecatedReset)

  return {
    pattern,
    diff,
    autoRuleApplied,
    deprecatedReset,
    reportLines,
    hasDiff,
    masterCount: masterItems.length,
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// apply: 差分適用（マスタ更新）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function applyTaxImport(clientId: string): Promise<TaxImportApplyResult> {
  const { pattern, mfTaxes, masterItems, nameToRow, diff, autoRuleApplied, deprecatedReset, availData } = await detectDiff(clientId, false)
  const today = new Date().toISOString().slice(0, 10)

  // --- source='mf'とtaxRateを既存行に反映 ---
  for (const t of mfTaxes) {
    const existing = nameToRow.get(t.name)
    if (existing) {
      existing.source = 'mf' as const
      if (t.tax_rate !== undefined) existing.taxRate = t.tax_rate
      if (!existing.effectiveFrom) existing.effectiveFrom = today
    }
  }

  // --- 差分適用 ---
  // 税率変更
  for (const c of diff.rateChanged) {
    const row = nameToRow.get(c.name)
    if (row && c.newRate !== undefined) row.taxRate = c.newRate
  }

  // 追加
  for (const a of diff.added) {
    const dir = guessDirectionFromName(a.name)
    const newRow: TaxCategory = {
      id: `MF_CUSTOM_${a.mfId}`,
      name: a.name,
      shortName: '',
      direction: dir,
      qualified: guessQualifiedFromName(a.name, dir),
      aiSelectable: true,
      active: true,
      deprecated: false,
      effectiveFrom: today,
      effectiveTo: null,
      defaultVisible: true,
      isCustom: true,
      source: 'mf' as const,
      mfId: a.mfId,
      taxRate: a.taxRate,
      displayOrder: masterItems.length + 1,
    }
    masterItems.push(newRow)
  }

  // 削除候補 → 非表示化
  for (const d of diff.deleteCandidates) {
    const row = masterItems.find(r => r.id === d.id)
    if (row) row.deprecated = true
  }

  // --- 新規税区分をavailableに追加（directionベースで判定） ---
  if (diff.added.length > 0) {
    for (const a of diff.added) {
      const row = masterItems.find(r => r.mfId === a.mfId)
      const dir = row?.direction ?? 'common'

      for (const method of VALID_METHODS) {
        if (!availData[method]) availData[method] = {}
        if (dir === 'common') {
          // 不明・対象外 → 全方式で有効
          availData[method][a.mfId] = true
        } else if (method === 'exempt') {
          // 免税 → 常に無効
          availData[method][a.mfId] = false
        } else {
          // それ以外 → 有効（簡易/一括比例/個別対応共通）
          availData[method][a.mfId] = true
        }
      }
    }
    // 更新を保存
    for (const method of VALID_METHODS) {
      if (availData[method]) {
        saveTaxAvailable(method, availData[method])
      }
    }
  }

  // --- マスタを保存 ---
  saveAllTaxCategories(masterItems)

  // --- MF生データを保存 ---
  const client = getById(clientId)
  const patternName = `taxes-${pattern}`
  saveMfRawData({
    clientId,
    clientName: client?.companyName ?? client?.repName ?? '',
    pattern: patternName,
    importedAt: new Date().toISOString(),
    itemCount: mfTaxes.length,
    items: mfTaxes,
  })

  // --- サマリー生成 ---
  const summaryParts = [
    diff.added.length > 0 ? `追加${diff.added.length}` : '',
    diff.rateChanged.length > 0 ? `税率変更${diff.rateChanged.length}` : '',
    diff.deleteCandidates.length > 0 ? `非表示化${diff.deleteCandidates.length}` : '',
    autoRuleApplied > 0 ? `自動ルール${autoRuleApplied}` : '',
    deprecatedReset > 0 ? `表示リセット${deprecatedReset}` : '',
  ].filter(Boolean).join(', ')

  console.log(`[mfTaxImportService] apply完了: clientId=${clientId}, pattern=${pattern}, ${summaryParts || '差分なし'}`)

  return {
    success: true,
    summary: summaryParts || '差分なし',
    updatedMaster: masterItems,
    pattern,
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 顧問先用: 税区分インポート（1回のAPI呼び出しで全処理）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** MF課税方式→consumptionTaxMode（mf-tax-available.jsonのキーと同じ値） */
export const MF_TAX_METHOD_TO_CONSUMPTION_MODE: Record<string, string> = {
  'FREE': 'exempt',
  'SIMPLE': 'simplified',
  'INDIVIDUAL_ALLOCATION': 'individual',
  'PROPORTIONAL_ALLOCATION': 'proportional',
  'SIMPLIFIED': 'simplified',
  'GENERAL': 'individual',
}

export interface ClientTaxImportResult {
  success: boolean
  imported: TaxCategory[]
  matchedCount: number
  customCount: number
  consumptionTaxMode: string | null
  availableUpdated: boolean
}

/**
 * 顧問先の税区分をMFからインポート（バックエンド一括処理）
 *
 * 処理内容:
 * 1. MFからtermSettings取得 → consumptionTaxMode自動更新
 * 2. MFから税区分一覧取得
 * 3. 全社マスタとmfIdで突合（マスタ属性を継承）
 * 4. 未マッチ → MF_CUSTOM_{mfId}で新規作成
 * 5. 結果をクライアントストアに保存
 * 6. available（利用可否）データを更新
 */
export async function importClientTaxes(clientId: string): Promise<ClientTaxImportResult> {
  const { updateClient } = await import('./clientStore')
  const { getClientTaxCategories, saveClientTaxCategories } = await import('./accountMasterStore')

  // 1. consumptionTaxMode自動更新
  let consumptionTaxMode: string | null = null
  try {
    const termSettings = await mcpFetchTermSettings(undefined, clientId)
    const currentTerm = termSettings[0]
    if (currentTerm?.tax_method) {
      const mapped = MF_TAX_METHOD_TO_CONSUMPTION_MODE[currentTerm.tax_method]
      if (mapped) {
        consumptionTaxMode = mapped
        updateClient(clientId, { consumptionTaxMode: mapped as 'individual' | 'proportional' | 'simplified' | 'exempt' })
        console.log(`[mfTaxImportService] consumptionTaxMode更新: ${currentTerm.tax_method} → ${mapped}`)
      }
    }
  } catch (err) {
    console.warn('[mfTaxImportService] termSettings取得失敗（続行）:', err)
  }

  // 2. MFから税区分一覧取得
  const mfTaxes = await mcpFetchTaxes(clientId) as MfTax[]

  // 3. 全社マスタとmfIdで突合
  const masterItems = getAllTaxCategories()
  const masterByMfId = new Map<string, TaxCategory>()
  for (const m of masterItems) {
    if (m.mfId) masterByMfId.set(m.mfId, m)
  }

  const today = new Date().toISOString().slice(0, 10)
  const isExempt = consumptionTaxMode === 'exempt'
  let matchedCount = 0
  let customCount = 0

  const imported: TaxCategory[] = mfTaxes.map((t, idx) => {
    const master = masterByMfId.get(t.id)
    if (master) {
      matchedCount++
      return {
        ...master,
        deprecated: isExempt ? master.deprecated : !t.available,
        displayOrder: idx + 1,
        source: 'mf' as const,
        mfId: t.id,
        taxRate: t.tax_rate ?? master.taxRate,
        effectiveFrom: master.effectiveFrom || today,
      }
    }
    // 未マッチ → MF独自カスタム税区分
    customCount++
    const dir = guessDirectionFromName(t.name)
    return {
      id: `MF_CUSTOM_${t.id}`,
      name: t.name,
      shortName: t.abbreviation ?? '',
      direction: dir,
      qualified: guessQualifiedFromName(t.name, dir),
      aiSelectable: true,
      active: true,
      deprecated: false,
      effectiveFrom: today,
      effectiveTo: null,
      defaultVisible: true,
      source: 'mf' as const,
      mfId: t.id,
      taxRate: t.tax_rate,
      displayOrder: idx + 1,
      isCustom: true,
    }
  })

  // 4. 顧問先ストアに保存
  saveClientTaxCategories(clientId, imported)

  // 5. available（利用可否）データを更新
  let availableUpdated = false
  if (consumptionTaxMode) {
    const patternKey = consumptionTaxMode as TaxMethodKey
    if (VALID_METHODS.includes(patternKey)) {
      const availMap: Record<string, boolean> = {}
      for (const t of mfTaxes) {
        availMap[t.id] = t.available
      }
      saveTaxAvailable(patternKey, availMap)
      availableUpdated = true
      console.log(`[mfTaxImportService] available更新: ${patternKey}, ${mfTaxes.length}件`)
    }
  }

  // 6. MF生データを保存
  const client = getById(clientId)
  saveMfRawData({
    clientId,
    clientName: client?.companyName ?? client?.repName ?? '',
    pattern: `client-taxes-${consumptionTaxMode ?? 'unknown'}`,
    importedAt: new Date().toISOString(),
    itemCount: mfTaxes.length,
    items: mfTaxes,
  })

  console.log(`[mfTaxImportService] 顧問先インポート完了: clientId=${clientId}, マスタ照合=${matchedCount}, カスタム=${customCount}`)

  return {
    success: true,
    imported,
    matchedCount,
    customCount,
    consumptionTaxMode,
    availableUpdated,
  }
}

