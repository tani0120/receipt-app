/**
 * urlFilterSync.ts — URL ⇔ フィルタ状態の相互変換ユーティリティ
 *
 * kintone準拠のURL設計:
 *   ?view=basic&query=status in ("active") order by threeCode asc
 *
 * 簡略化形式（URLエンコード軽減）:
 *   ?view=basic&q=status.in.active&sort=threeCode.asc
 *   ?view=all&q=status.in.active,type.eq.corp&logic=and&sort=companyName.desc
 *
 * パラメータ:
 *   view   — ビュー名（basic, all等）
 *   q      — フィルタ条件（ドット区切り、カンマで複数条件連結）
 *   logic  — 条件結合方式（and/or、省略時=and）
 *   sort   — ソート設定（フィールド.順序）
 */
import type { FilterCondition, SortSetting } from '@/components/list-view/types'
import type { LocationQuery } from 'vue-router'

// ============================================================
// URL → 状態復元
// ============================================================

/** URLクエリからビュー名を取得 */
export function parseViewFromQuery(query: LocationQuery): string | null {
  const v = query.view
  return typeof v === 'string' ? v : null
}

/** URLクエリからフィルタ条件を復元 */
export function parseFiltersFromQuery(query: LocationQuery): FilterCondition[] {
  const q = query.q
  if (typeof q !== 'string' || !q) return []

  return q.split(',').map(chunk => {
    // 形式: field.operator.value  または  field.operator.val1|val2（in/not_in）
    const parts = chunk.split('.')
    if (parts.length < 2) return null

    const field = parts[0]!
    const operator = parts[1]!
    const rawValue = parts.slice(2).join('.')  // 値にドットが含まれる場合を考慮

    // in/not_in の場合はパイプ区切りで配列化
    if (operator === 'in' || operator === 'not_in') {
      return {
        field,
        operator,
        value: rawValue ? rawValue.split('|') : [],
      } as FilterCondition
    }

    return {
      field,
      operator,
      value: rawValue,
    } as FilterCondition
  }).filter((c): c is FilterCondition => c !== null)
}

/** URLクエリから条件結合方式を取得 */
export function parseLogicFromQuery(query: LocationQuery): 'and' | 'or' {
  const l = query.logic
  return l === 'or' ? 'or' : 'and'
}

/** URLクエリからソート設定を取得（多段対応） */
export function parseSortsFromQuery(query: LocationQuery, defaultSorts: SortSetting[]): SortSetting[] {
  const s = query.sort
  if (typeof s !== 'string' || !s) return defaultSorts

  const parts = s.split(',')
  const results: SortSetting[] = []
  for (const part of parts) {
    const [key, order] = part.split('.')
    if (key) {
      results.push({ key, order: order === 'desc' ? 'desc' : 'asc' })
    }
  }
  return results.length > 0 ? results : defaultSorts
}

// ============================================================
// 状態 → URL生成
// ============================================================

/** フィルタ条件をURLクエリ文字列形式にシリアライズ */
export function serializeFilters(conditions: FilterCondition[]): string {
  if (!conditions.length) return ''

  return conditions.map(c => {
    const value = Array.isArray(c.value) ? c.value.join('|') : c.value
    // is_empty/is_not_empty は値なし
    if (c.operator === 'is_empty' || c.operator === 'is_not_empty') {
      return `${c.field}.${c.operator}`
    }
    return `${c.field}.${c.operator}.${value}`
  }).join(',')
}

/** ソート設定をURLクエリ文字列形式にシリアライズ（多段対応） */
export function serializeSorts(sorts: SortSetting[]): string {
  return sorts.map(s => `${s.key}.${s.order}`).join(',')
}

/** 全状態をURLクエリオブジェクトに変換 */
export function buildQueryParams(opts: {
  viewName: string
  conditions: FilterCondition[]
  logic: 'and' | 'or'
  sorts: SortSetting[]
  defaultViewName?: string
  defaultConditions?: FilterCondition[]
  defaultSorts?: SortSetting[]
}): Record<string, string> {
  const query: Record<string, string> = {}

  // ビュー（デフォルトと同じなら省略可能だが、明示する方針）
  query.view = opts.viewName

  // フィルタ条件
  const filterStr = serializeFilters(opts.conditions)
  if (filterStr) query.q = filterStr

  // 条件結合方式（andはデフォルトなので省略）
  if (opts.logic === 'or') query.logic = 'or'

  // ソート
  const sortStr = serializeSorts(opts.sorts)
  if (sortStr) query.sort = sortStr

  return query
}

// ============================================================
// ビューデフォルト定義（拡張ViewDef）
// ============================================================

/** ビュー定義（デフォルトフィルタ・ソート付き） */
export interface ViewDefWithDefaults {
  /** ビュー名（URLパラメータ / ドロップダウン表示） */
  name: string
  /** URL用キー（英字小文字） */
  key: string
  /** 表示する列キーの配列。null = 全列表示 */
  columns: string[] | null
  /** このビューのデフォルトフィルタ条件 */
  defaultFilters: FilterCondition[]
  /** このビューのデフォルトソート（多段） */
  defaultSorts: SortSetting[]
}

/** ビューキーからビュー定義を取得 */
export function findViewByKey(
  views: ViewDefWithDefaults[],
  key: string | null,
): ViewDefWithDefaults | undefined {
  if (!key) return views[0]
  return views.find(v => v.key === key) ?? views[0]
}

/** ビューインデックスからビューキーを取得 */
export function getViewKey(views: ViewDefWithDefaults[], index: number): string {
  return views[index]?.key ?? views[0]?.key ?? 'basic'
}
