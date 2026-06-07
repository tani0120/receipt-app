/**
 * mfTaxImportService.ts — MF税区分インポート処理（バックエンド）
 *
 * フロント（Vue）に分散していたインポートの照合・差分検知・差分適用・保存処理を
 * バックエンドに集約。フロントはAPI呼び出しと結果表示のみ。
 *
 * ■ 照合方式: 名前ベース（MF税区分名 = マスタ税区分名）
 *   - MF IDは事業者（テナント）固有。事業者間で一致しない（MCP実機検証: TSK vs TST 0/151件一致）
 *   - 税区分名は全事業者で共通（MCP実機検証: 151/151件一致）
 *   - 2026-06-04: mfIdによる照合を全て名前照合に統一
 *
 * ■ available.jsonのキー: マスタID（例: SALES_TAXABLE_10）
 *   - 2026-06-04: mfId→マスタIDに移行（604件変換）。事業者非依存
 *
 * エンドポイント:
 *   POST /api/mf/import-taxes/preview — 差分プレビュー
 *   POST /api/mf/import-taxes/apply   — 差分適用
 *   POST /api/mf/import-client-taxes  — 顧問先税区分インポート
 */

import { mcpFetchTaxes, mcpFetchTermSettings } from './mfMcpClient'
import { getAllTaxCategories, saveAllTaxCategories } from './accountMasterStore'
import { getAllTaxAvailable, saveTaxAvailable, type TaxMethodKey } from './mfTaxAvailableStore'
import { saveMfRawData } from './mfRawDataStore'
import { getById } from './clientStore'
import { guessDirectionFromName, guessQualifiedFromName } from '../../types/shared-tax-category'
import type { TaxCategory } from '../../types/shared-tax-category'
import { generateTaxMasterId, ensureUniqueTaxId } from './taxIdGenerator'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ルールベース自動判定（simplifiedOnly / individualOnly / baseId）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 簡易課税専用か判定（名前に「一種〜六種」を含む） */
function guessSimplifiedOnly(name: string): boolean {
  return /[一二三四五六]種/.test(name)
}

/** 個別対応専用か判定（名前に「共通」or「非課税対応」を含む） */
function guessIndividualOnly(name: string): boolean {
  return /共通|非課税対応/.test(name)
}

/**
 * 簡易課税専用税区分の原則用baseIdを推測
 * 「課税売上 10% 一種」→「課税売上 10%」でマスタ検索
 * 見つからなければundefined（バリデーションの根幹には影響しない）
 */
function guessBaseId(name: string, masterItems: readonly TaxCategory[]): string | undefined {
  const baseName = name.replace(/\s*[一二三四五六]種\s*$/, '').trim()
  if (baseName === name) return undefined
  const base = masterItems.find(m => m.name === baseName)
  return base?.taxCategoryId
}

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
  added: Array<{ name: string; mfId: string; taxRate?: number; abbreviation?: string }>
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
  /** ルールベースID変換に失敗した税区分名（呼び出し元で警告表示用） */
  unknownTaxNames?: string[]
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
async function detectDiff(clientId: string, _dryRun: boolean = false): Promise<DetectResult> {
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

  // 4. availableデータを取得（MCP実機のavailableをそのまま使用。自動ルール廃止済み）
  const availData: Record<string, Record<string, boolean>> = JSON.parse(JSON.stringify(getAllTaxAvailable()))
  // ゴミデータ清掃: 有効なキー以外を除去
  for (const key of Object.keys(availData)) {
    if (!VALID_METHODS.includes(key as TaxMethodKey)) {
      delete availData[key]
    }
  }
  const autoRuleApplied = 0


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
      diff.added.push({ name: t.name, mfId: t.id, taxRate: t.tax_rate, abbreviation: t.abbreviation })
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
      diff.deleteCandidates.push({ id: row.taxCategoryId, name: row.name, mfId: '' })
    }
  }

  // 6. deprecated自動リセット — 廃止
  // 設計書40_tax_method_master.md L32-39: 「MFインポート表示」と「表示（deprecated）」は独立。
  // available=trueでもdeprecated=trueのまま維持する（5%旧税率等は非表示のままにすべき）。
  const deprecatedReset = 0

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

  // 追加（ルールベースID生成。変換失敗はthrowで停止 — 不正ID流入防止）
  const unknownTaxNames: string[] = []
  // 既存IDセット（重複チェック用）: ループ外で1回だけ構築
  const existingTaxIds = new Set(masterItems.map(r => r.taxCategoryId))
  for (const a of diff.added) {
    const baseId = generateTaxMasterId(a.name)
    if (!baseId) {
      // ルール不一致 → data/tax-id-rules.json にルール追加が必要
      throw new Error(`[mfTaxImportService] 税区分「${a.name}」のルールベースID変換に失敗。data/tax-id-rules.json にルールを追加してください`)
    }
    const generatedId = ensureUniqueTaxId(baseId, existingTaxIds)
    existingTaxIds.add(generatedId) // 次の重複チェック用に追加
    const dir = guessDirectionFromName(a.name)
    const simplified = guessSimplifiedOnly(a.name)
    const newRow: TaxCategory = {
      taxCategoryId: generatedId,
      name: a.name,
      shortName: a.abbreviation ?? '',
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
      taxRate: a.taxRate,
      displayOrder: masterItems.length + 1,
      simplifiedOnly: simplified,
      individualOnly: guessIndividualOnly(a.name),
      baseId: simplified ? guessBaseId(a.name, masterItems) : undefined,
    }
    masterItems.push(newRow)
  }

  // 削除候補 → 非表示化
  for (const d of diff.deleteCandidates) {
    const row = masterItems.find(r => r.taxCategoryId === d.id)
    if (row) row.deprecated = true
  }

  // --- MFの生データのavailableを現在の課税方式に保存（差分有無に関わらず常に実行） ---
  {
    const availMap: Record<string, boolean> = {}
    for (const t of mfTaxes) {
      const masterRow = nameToRow.get(t.name)
      const key = masterRow?.taxCategoryId ?? generateTaxMasterId(t.name) ?? `UNKNOWN_${t.name}`
      availMap[key] = t.available
    }
    saveTaxAvailable(pattern as TaxMethodKey, availMap)
    console.log(`[mfTaxImportService] available更新: ${pattern}, true=${Object.values(availMap).filter(v => v).length}件`)
  }

  // --- 新規税区分をavailableの他方式にも追加（directionベースで判定） ---
  if (diff.added.length > 0) {
    for (const a of diff.added) {
      const newRow = masterItems.find(r => r.name === a.name)
      const masterId = newRow?.taxCategoryId ?? generateTaxMasterId(a.name) ?? `UNKNOWN_${a.name}`
      const dir = newRow?.direction ?? 'common'

      for (const method of VALID_METHODS) {
        if (method === pattern) continue // 現在の方式は上で保存済み
        if (!availData[method]) availData[method] = {}
        if (dir === 'common') {
          availData[method][masterId] = true
        } else if (method === 'exempt') {
          availData[method][masterId] = false
        } else {
          availData[method][masterId] = true
        }
      }
    }
    // 他方式の更新を保存
    for (const method of VALID_METHODS) {
      if (method === pattern) continue
      if (availData[method]) {
        saveTaxAvailable(method as TaxMethodKey, availData[method])
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
    unknownTaxNames: unknownTaxNames.length > 0 ? unknownTaxNames : undefined,
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
 * 3. 全社マスタと名前で突合（マスタ属性を継承。MF IDは事業者固有のため名前照合が正しい）
 * 4. 未マッチ → ルールベースでマスタIDを生成（generateTaxMasterId）
 * 5. 結果をクライアントストアに保存
 * 6. available（利用可否）データを更新
 */
export async function importClientTaxes(clientId: string): Promise<ClientTaxImportResult> {
  const { updateClient } = await import('./clientStore')
  const { saveClientTaxCategories } = await import('./accountMasterStore')

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

  // 3. 全社マスタと名前で突合（MF IDは事業者固有のため名前照合が正しい）
  const masterItems = getAllTaxCategories()
  const masterByName = new Map<string, TaxCategory>()
  for (const m of masterItems) {
    masterByName.set(m.name, m)
  }

  const today = new Date().toISOString().slice(0, 10)
  const isExempt = consumptionTaxMode === 'exempt'
  let matchedCount = 0
  let customCount = 0
  // 既存IDセット（重複チェック用）: 全社マスタのIDを含む
  const existingClientTaxIds = new Set(masterItems.map(m => m.taxCategoryId))

  const imported: TaxCategory[] = mfTaxes.map((t, idx) => {
    const master = masterByName.get(t.name)
    if (master) {
      matchedCount++
      return {
        ...master,
        mfTaxId: t.id, // MF事業者固有ID（仕訳送信時に使用）
        deprecated: isExempt ? master.deprecated : !t.available,
        displayOrder: idx + 1,
        source: 'mf' as const,
        taxRate: t.tax_rate ?? master.taxRate,
        effectiveFrom: master.effectiveFrom || today,
      }
    }
    // 未マッチ → MF独自カスタム税区分（ルールベースでマスタID生成）
    customCount++
    const baseId = generateTaxMasterId(t.name)
    if (!baseId) {
      // ルール不一致 → data/tax-id-rules.json にルール追加が必要
      throw new Error(`[mfTaxImportService] 税区分「${t.name}」のルールベースID変換に失敗。data/tax-id-rules.json にルールを追加してください`)
    }
    const generatedId = ensureUniqueTaxId(baseId, existingClientTaxIds)
    existingClientTaxIds.add(generatedId) // 次の重複チェック用に追加
    const dir = guessDirectionFromName(t.name)
    const simplified = guessSimplifiedOnly(t.name)
    return {
      taxCategoryId: generatedId,
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
      taxRate: t.tax_rate,
      displayOrder: idx + 1,
      isCustom: true,
      simplifiedOnly: simplified,
      individualOnly: guessIndividualOnly(t.name),
      baseId: simplified ? guessBaseId(t.name, masterItems) : undefined,
      mfTaxId: t.id, // MF事業者固有ID（仕訳送信時に使用）
    }
  })

  // 4a. 前回の顧問先税区分にあって今回MFにない税区分 → deprecated=trueで保持
  // 過去仕訳の参照先を保護（TAX_UNKNOWNにしない）
  const { getClientTaxCategories } = await import('./accountMasterStore')
  let deprecatedCount = 0
  try {
    const prevTaxCategories = getClientTaxCategories(clientId)
    if (prevTaxCategories.length > 0) {
      const currentNames = new Set(imported.map(t => t.name))
      for (const prev of prevTaxCategories) {
        if (!currentNames.has(prev.name) && !prev.deprecated) {
          imported.push({ ...prev, deprecated: true })
          deprecatedCount++
        }
      }
    }
  } catch {
    // 初回インポート時は前回データがない。スキップ
  }

  // 4b. 顧問先ストアに保存
  saveClientTaxCategories(clientId, imported)

  // 5. available（利用可否）データを更新
  let availableUpdated = false
  if (consumptionTaxMode) {
    const patternKey = consumptionTaxMode as TaxMethodKey
    if (VALID_METHODS.includes(patternKey)) {
      const availMap: Record<string, boolean> = {}
      for (const t of mfTaxes) {
        const master = masterByName.get(t.name)
        const key = master?.taxCategoryId ?? generateTaxMasterId(t.name) ?? `UNKNOWN_${t.name}`
        availMap[key] = t.available
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

  console.log(`[mfTaxImportService] 顧問先インポート完了: clientId=${clientId}, マスタ照合=${matchedCount}, カスタム=${customCount}, 非表示化=${deprecatedCount}`)

  return {
    success: true,
    imported,
    matchedCount,
    customCount,
    consumptionTaxMode,
    availableUpdated,
  }
}

