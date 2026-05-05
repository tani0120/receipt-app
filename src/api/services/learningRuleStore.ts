/**
 * learningRuleStore.ts — 学習ルールJSON永続化ストア
 *
 * レイヤー: ★service★
 * 責務: 顧問先ごとの学習ルールのインメモリ + JSON永続化管理
 *
 * 起動時にJSONから読み込み。なければ初期シード投入。
 * 将来: Supabase learning_rules テーブルに差し替え
 * 準拠: DL-042, Phase 4
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { LearningRule } from '../../types/learning_rule.type'
import { learningRulesTST00011 } from '../../data/learning_rules_TST00011'

const DATA_DIR = join(process.cwd(), 'data')
const FILE_PATH = join(DATA_DIR, 'learning-rules.json')

/** clientId → ルール配列 */
let rulesByClient: Map<string, LearningRule[]> = new Map()

// ============================================================
// 永続化
// ============================================================

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function saveAll(): void {
  try {
    ensureDir()
    const obj: Record<string, LearningRule[]> = {}
    for (const [clientId, rules] of rulesByClient) {
      obj[clientId] = rules
    }
    writeFileSync(FILE_PATH, JSON.stringify(obj, null, 2), 'utf-8')
  } catch (err) {
    console.error('[learningRuleStore] JSON書き出しエラー:', err)
  }
}

// ============================================================
// 起動時読み込み
// ============================================================

export function loadLearningRules(): void {
  rulesByClient = new Map()
  try {
    if (existsSync(FILE_PATH)) {
      const raw = readFileSync(FILE_PATH, 'utf-8')
      const obj = JSON.parse(raw) as Record<string, LearningRule[]>
      for (const [clientId, rules] of Object.entries(obj)) {
        rulesByClient.set(clientId, rules)
      }
      const total = Array.from(rulesByClient.values()).reduce((sum, arr) => sum + arr.length, 0)
      console.log(`[learningRuleStore] ${FILE_PATH}: ${rulesByClient.size}顧問先, ${total}件読み込み`)
      return
    }
  } catch (err) {
    console.error('[learningRuleStore] 読み込みエラー:', err)
  }
  // JSONなし → シード投入
  const seed = learningRulesTST00011.map(r => ({
    ...r,
    entries: r.entries.map(e => ({ ...e })),
  }))
  rulesByClient.set('TST-00011', seed)
  console.log(`[learningRuleStore] 初期シード: TST-00011 ${seed.length}件投入`)
  saveAll()
}

// ============================================================
// CRUD
// ============================================================

/** 顧問先の学習ルール一覧 */
export function getByClientId(clientId: string): LearningRule[] {
  return (rulesByClient.get(clientId) ?? []).map(r => ({
    ...r,
    entries: r.entries.map(e => ({ ...e })),
  }))
}

/** 学習ルール1件取得 */
export function getById(clientId: string, ruleId: string): LearningRule | undefined {
  const list = rulesByClient.get(clientId)
  const rule = list?.find(r => r.id === ruleId)
  if (!rule) return undefined
  return { ...rule, entries: rule.entries.map(e => ({ ...e })) }
}

/** 学習ルール追加 */
export function create(clientId: string, rule: LearningRule): LearningRule {
  const list = rulesByClient.get(clientId) ?? []
  const cloned = { ...rule, entries: rule.entries.map(e => ({ ...e })) }
  list.push(cloned)
  rulesByClient.set(clientId, list)
  saveAll()
  console.log(`[learningRuleStore] ${clientId} にルール「${rule.keyword}」を追加（ID: ${rule.id}）`)
  return cloned
}

/** 学習ルール更新 */
export function update(clientId: string, ruleId: string, patch: Partial<LearningRule>): boolean {
  const list = rulesByClient.get(clientId)
  if (!list) return false
  const idx = list.findIndex(r => r.id === ruleId)
  if (idx === -1) return false
  list[idx] = { ...list[idx]!, ...patch, entries: patch.entries ? patch.entries.map(e => ({ ...e })) : list[idx]!.entries }
  saveAll()
  return true
}

/** 学習ルール削除 */
export function remove(clientId: string, ruleId: string): boolean {
  const list = rulesByClient.get(clientId)
  if (!list) return false
  const idx = list.findIndex(r => r.id === ruleId)
  if (idx === -1) return false
  list.splice(idx, 1)
  saveAll()
  console.log(`[learningRuleStore] ${clientId} のルール ${ruleId} を削除`)
  return true
}

// 起動時に自動読み込み
loadLearningRules()
