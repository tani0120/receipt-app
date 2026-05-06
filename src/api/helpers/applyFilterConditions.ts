/**
 * applyFilterConditions.ts — サーバーサイド汎用フィルタエンジン
 *
 * FilterCondition[]（フロントと同一型）を受け取り、
 * 任意のオブジェクト配列にAND/ORフィルタを適用する。
 *
 * 全ListService（client/vendor/staff/lead等）で共有。
 * Supabase移行時: WHERE句生成に差し替え。
 */

/** フィルタ演算子 */
export type FilterOperator =
  | 'eq' | 'neq'
  | 'contains' | 'not_contains'
  | 'in' | 'not_in'
  | 'gte' | 'lte' | 'gt' | 'lt'
  | 'is_empty' | 'is_not_empty'

/** フィルタ条件1行（フロントのFilterConditionと同一構造） */
export interface FilterCondition {
  field: string
  operator: FilterOperator
  value: string | string[]
}

/**
 * フィルタ条件を行配列に適用する
 *
 * @param rows - フィルタ対象の行配列
 * @param conditions - フィルタ条件（空配列なら全件返却）
 * @param logic - 条件結合方式（デフォルト: 'and'）
 * @returns フィルタ後の行配列
 */
export function applyFilterConditions<T extends Record<string, any>>(
  rows: T[],
  conditions: FilterCondition[],
  logic: 'and' | 'or' = 'and',
): T[] {
  if (!conditions || conditions.length === 0) return rows

  return rows.filter(row => {
    const results = conditions.map(cond => evaluateCondition(row, cond))
    return logic === 'and'
      ? results.every(Boolean)
      : results.some(Boolean)
  })
}

/** 単一条件を1行に対して評価 */
function evaluateCondition<T extends Record<string, any>>(
  row: T,
  cond: FilterCondition,
): boolean {
  const rawValue = row[cond.field]

  // boolean型の特別処理（isInvoiceRegistered等）
  const fieldStr = rawValue === true ? 'true'
    : rawValue === false ? 'false'
    : String(rawValue ?? '')

  switch (cond.operator) {
    case 'eq':
      return fieldStr === String(cond.value)

    case 'neq':
      return fieldStr !== String(cond.value)

    case 'contains':
      return fieldStr.toLowerCase().includes(String(cond.value).toLowerCase())

    case 'not_contains':
      return !fieldStr.toLowerCase().includes(String(cond.value).toLowerCase())

    case 'in': {
      const vals = Array.isArray(cond.value) ? cond.value : [cond.value]
      return vals.includes(fieldStr)
    }

    case 'not_in': {
      const vals = Array.isArray(cond.value) ? cond.value : [cond.value]
      return !vals.includes(fieldStr)
    }

    case 'gte':
      return Number(rawValue) >= Number(cond.value)

    case 'lte':
      return Number(rawValue) <= Number(cond.value)

    case 'gt':
      return Number(rawValue) > Number(cond.value)

    case 'lt':
      return Number(rawValue) < Number(cond.value)

    case 'is_empty':
      return rawValue === '' || rawValue == null

    case 'is_not_empty':
      return rawValue !== '' && rawValue != null

    default:
      return true
  }
}
