/**
 * 一覧ビュー共通型定義（list-view）
 *
 * FilterModal / ColumnSelector / KintoneToolbar で共有。
 * 準拠: kintone_view_plan.md
 */

/** ビュー定義（表示列プリセット） */
export interface ViewDef {
  /** ビュー名（ドロップダウンに表示） */
  name: string
  /** 表示する列キーの配列。null = 全列表示（「すべて」ビュー用） */
  columns: string[] | null
}

/** フィルター用列定義（フィールドタイプ別に演算子を切替） */
export interface FilterColumnDef {
  /** フィールドキー（Client/Leadのプロパティ名） */
  key: string
  /** 表示ラベル */
  label: string
  /** フィールドタイプ（演算子セット決定用） */
  filterType: 'text' | 'select' | 'number' | 'date'
  /** select型の場合の選択肢 */
  filterOptions?: { value: string; label: string }[]
}

/** 演算子の種類 */
export type FilterOperator =
  | 'eq'           // = （等しい）
  | 'neq'          // ≠ （等しくない）
  | 'contains'     // 含む
  | 'not_contains' // 含まない
  | 'in'           // 次のいずれかを含む（複数選択）
  | 'not_in'       // 次のいずれも含まない
  | 'gte'          // ≧ 以上
  | 'lte'          // ≦ 以下
  | 'gt'           // > より大きい
  | 'lt'           // < より小さい
  | 'is_empty'     // 空である
  | 'is_not_empty' // 空でない

/** 演算子定義（ラベル付き） */
export interface OperatorDef {
  value: FilterOperator
  label: string
}

/** フィルター条件1行 */
export interface FilterCondition {
  /** 対象フィールドキー */
  field: string
  /** 演算子 */
  operator: FilterOperator
  /** 値（text/number/date: string、in/not_in: string[]） */
  value: string | string[]
}

/** ソート設定 */
export interface SortSetting {
  /** ソート対象フィールドキー */
  key: string
  /** ソート順 */
  order: 'asc' | 'desc'
}

/** フィルタモーダルの出力（適用時に親に渡す） */
export interface FilterResult {
  /** フィルター条件一覧 */
  conditions: FilterCondition[]
  /** 条件結合方式 */
  logic: 'and' | 'or'
  /** ソート設定 */
  sort: SortSetting
}

// --- フィールドタイプ別の演算子マップ ---

/** テキスト型で使用可能な演算子 */
export const TEXT_OPERATORS: OperatorDef[] = [
  { value: 'contains', label: '含む' },
  { value: 'not_contains', label: '含まない' },
  { value: 'eq', label: '次の値と等しい' },
  { value: 'neq', label: '次の値と等しくない' },
  { value: 'is_empty', label: '空である' },
  { value: 'is_not_empty', label: '空でない' },
]

/** 選択型で使用可能な演算子 */
export const SELECT_OPERATORS: OperatorDef[] = [
  { value: 'in', label: '次のいずれかを含む' },
  { value: 'not_in', label: '次のいずれも含まない' },
  { value: 'eq', label: '次の値と等しい' },
  { value: 'neq', label: '次の値と等しくない' },
]

/** 数値型で使用可能な演算子 */
export const NUMBER_OPERATORS: OperatorDef[] = [
  { value: 'eq', label: '次の値と等しい' },
  { value: 'neq', label: '次の値と等しくない' },
  { value: 'gte', label: '≧（以上）' },
  { value: 'lte', label: '≦（以下）' },
  { value: 'gt', label: '>（より大きい）' },
  { value: 'lt', label: '<（より小さい）' },
  { value: 'is_empty', label: '空である' },
  { value: 'is_not_empty', label: '空でない' },
]

/** 日付型で使用可能な演算子 */
export const DATE_OPERATORS: OperatorDef[] = [
  { value: 'eq', label: '次の値と等しい' },
  { value: 'neq', label: '次の値と等しくない' },
  { value: 'gte', label: '≧（以降）' },
  { value: 'lte', label: '≦（以前）' },
  { value: 'is_empty', label: '空である' },
  { value: 'is_not_empty', label: '空でない' },
]

/** フィールドタイプから演算子リストを取得 */
export function getOperatorsForType(type: FilterColumnDef['filterType']): OperatorDef[] {
  switch (type) {
    case 'text': return TEXT_OPERATORS
    case 'select': return SELECT_OPERATORS
    case 'number': return NUMBER_OPERATORS
    case 'date': return DATE_OPERATORS
    default: return TEXT_OPERATORS
  }
}

/** 演算子が値入力不要か判定（is_empty / is_not_empty） */
export function isNoValueOperator(op: FilterOperator): boolean {
  return op === 'is_empty' || op === 'is_not_empty'
}

/** 演算子が複数選択値か判定（in / not_in） */
export function isMultiValueOperator(op: FilterOperator): boolean {
  return op === 'in' || op === 'not_in'
}
