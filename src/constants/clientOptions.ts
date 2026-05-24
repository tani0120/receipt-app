/**
 * clientOptions.ts — 顧問先関連の全ドロップダウン選択肢を一元管理
 *
 * 責務: 選択肢定数の定義 + ラベル変換関数
 * 参照元: ClientEditPage / MockMasterClientsPage / LeadListPage / LeadEditPage
 *
 * ルール: 選択肢の追加・変更はこのファイルのみで行う。
 *         各ページでのハードコードは禁止。
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 共通型・ユーティリティ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 選択肢型（value + label） */
export interface SelectOption<T = string> {
  value: T
  label: string
}

/** value → label 変換（見つからなければ value をそのまま返す） */
export function getLabel<T>(options: readonly SelectOption<T>[], value: T): string {
  return options.find(o => o.value === value)?.label ?? String(value)
}

/** label → value 逆変換（見つからなければ label をそのまま返す） */
export function getValueByLabel(options: readonly SelectOption<string>[], label: string): string {
  return options.find(o => o.label === label)?.value ?? label
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 基本情報
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 区分（法人/個人事業/個人） */
export const TYPE_OPTIONS: readonly SelectOption[] = [
  { value: 'corp', label: '法人' },
  { value: 'sole_proprietor', label: '個人事業' },
  { value: 'individual', label: '個人' },
] as const

/** ステータス（顧問先用） */
export const STATUS_OPTIONS: readonly SelectOption[] = [
  { value: 'active', label: '契約中' },
  { value: 'suspension', label: '休眠中' },
  { value: 'inactive', label: '契約終了' },
] as const

/** ステータス（見込先用） */
export const LEAD_STATUS_OPTIONS: readonly SelectOption[] = [
  { value: 'active', label: '稼働中' },
  { value: 'suspension', label: '休眠中' },
  { value: 'inactive', label: '契約終了' },
  { value: 'converted', label: '顧問先化済' },
] as const

/** 業種リスト */
export const INDUSTRY_OPTIONS: readonly SelectOption[] = [
  { value: '', label: '—' },
  // MF準拠（13種）
  { value: '製造業', label: '製造業' },
  { value: '教育', label: '教育' },
  { value: '医療/福祉', label: '医療/福祉' },
  { value: '情報通信', label: '情報通信' },
  { value: '飲食業', label: '飲食業' },
  { value: '建設業', label: '建設業' },
  { value: '運送業', label: '運送業' },
  { value: '卸売業', label: '卸売業' },
  { value: '小売業', label: '小売業' },
  { value: '金融保険業', label: '金融保険業' },
  { value: '不動産業', label: '不動産業' },
  { value: 'サービス業', label: 'サービス業' },
  { value: 'その他', label: 'その他' },
  // sugusuru独自
  { value: '商社', label: '商社' },
  { value: '保険業', label: '保険業' },
  { value: 'コンサルティング', label: 'コンサルティング' },
  { value: '専門事務所', label: '専門事務所' },
  { value: '旅行／宿泊／レジャー', label: '旅行／宿泊／レジャー' },
  { value: 'スポーツ・ヘルス関連', label: 'スポーツ・ヘルス関連' },
  { value: '理容・美容・サロン', label: '理容・美容・サロン' },
  { value: '冠婚葬祭', label: '冠婚葬祭' },
  { value: '警備関連', label: '警備関連' },
  { value: '清掃業', label: '清掃業' },
  { value: '官公庁・自治体', label: '官公庁・自治体' },
] as const

/** 売上高（年間売上規模） */
export const ANNUAL_REVENUE_OPTIONS: readonly SelectOption[] = [
  { value: '', label: '—' },
  { value: 'under_3m', label: '300万円未満' },
  { value: '3m_to_5m', label: '300万円以上～500万円未満' },
  { value: '5m_to_10m', label: '500万円以上～1000万円未満' },
  { value: '10m_to_30m', label: '1000万円以上～3000万円未満' },
  { value: '30m_to_100m', label: '3000万円以上～1億円未満' },
  { value: '100m_to_500m', label: '1億円以上～5億円未満' },
  { value: '500m_to_1b', label: '5億円以上～10億円未満' },
  { value: 'over_1b', label: '10億円以上～' },
] as const

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 会計設定
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 会計ソフト */
export const ACCOUNTING_SOFTWARE_OPTIONS: readonly SelectOption[] = [
  { value: 'mf', label: 'マネーフォワード' },
  { value: 'freee', label: 'freee' },
  { value: 'yayoi', label: '弥生' },
  { value: 'tkc', label: 'TKC' },
  { value: 'other', label: 'その他' },
] as const

/** 確定申告（青色/白色） */
export const TAX_FILING_OPTIONS: readonly SelectOption[] = [
  { value: 'blue', label: '青色' },
  { value: 'white', label: '白色' },
] as const

/** 課税方式（MF実測値: FREE / SIMPLE / INDIVIDUAL_ALLOCATION / PROPORTIONAL_ALLOCATION） */
export const TAX_MODE_OPTIONS: readonly SelectOption[] = [
  { value: 'individual_allocation', label: '原則課税（個別対応方式）' },
  { value: 'proportional_allocation', label: '原則課税（一括比例配分方式）' },
  { value: 'simplified', label: '簡易課税' },
  { value: 'exempt', label: '免税' },
] as const

/** 簡易課税事業区分 */
export const SIMPLIFIED_CATEGORY_OPTIONS: readonly SelectOption<number>[] = [
  { value: 1, label: '第一種（卸売業）90%' },
  { value: 2, label: '第二種（小売業）80%' },
  { value: 3, label: '第三種（製造業・建設業）70%' },
  { value: 4, label: '第四種（飲食店・その他）60%' },
  { value: 5, label: '第五種（サービス業）50%' },
  { value: 6, label: '第六種（不動産業）40%' },
] as const

/** 経理方式（MF実測値: TAX_INCLUDED / TAX_EXCLUDED_INCLUDED / TAX_EXCLUDED_SEPARATE） */
export const TAX_METHOD_OPTIONS: readonly SelectOption[] = [
  { value: 'tax_included', label: '税込' },
  { value: 'tax_excluded_included', label: '税抜（内税）' },
  { value: 'tax_excluded_separate', label: '税抜（別記）' },
] as const

/** 経理方式 */
export const CALCULATION_METHOD_OPTIONS: readonly SelectOption[] = [
  { value: 'accrual', label: '発生主義' },
  { value: 'cash', label: '現金主義' },
  { value: 'interim_cash', label: '中間現金主義' },
] as const

/** デフォルト支払方法 */
export const DEFAULT_PAYMENT_OPTIONS: readonly SelectOption[] = [
  { value: 'cash', label: '現金' },
  { value: 'owner_loan', label: '事業主借' },
  { value: 'accounts_payable', label: '買掛金' },
] as const

/** 消費税中間申告 */
export const CONSUMPTION_TAX_INTERIM_OPTIONS: readonly SelectOption[] = [
  { value: 'none', label: '不要' },
  { value: '1', label: '1回' },
  { value: '3', label: '3回' },
  { value: '11', label: '11回' },
] as const

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ニーズ管理
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** ニーズ（未確認/あり/なし） */
export const NEEDS_OPTIONS: readonly SelectOption[] = [
  { value: '', label: '未確認' },
  { value: 'yes', label: 'あり' },
  { value: 'no', label: 'なし' },
] as const

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 報酬情報
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 契約内容 */
export const CONTRACT_SCOPE_OPTIONS: readonly SelectOption[] = [
  { value: 'settlement_only', label: '決算のみ' },
  { value: 'advisory', label: '顧問' },
  { value: 'yearly_1', label: '年1回' },
  { value: 'yearly_2', label: '年2回' },
  { value: 'yearly_4', label: '年4回' },
  { value: 'yearly_6', label: '年6回' },
  { value: 'yearly_12', label: '年12回' },
] as const

/** 記帳代行・自計化 */
export const BOOKKEEPING_TYPE_OPTIONS: readonly SelectOption[] = [
  { value: 'self', label: '自計化' },
  { value: 'outsourced', label: '記帳代行' },
] as const

/** あり/なし汎用 */
export const YES_NO_OPTIONS: readonly SelectOption[] = [
  { value: 'no', label: 'なし' },
  { value: 'yes', label: 'あり' },
] as const

/** 引き落とし方法 */
export const PAYMENT_METHOD_OPTIONS: readonly SelectOption[] = [
  { value: 'paper', label: '紙' },
  { value: 'direct_debit', label: '口座引落し' },
] as const

/** 引き落とし日 */
export const PAYMENT_DAY_OPTIONS: readonly SelectOption[] = [
  { value: '8', label: '8日' },
  { value: 'other', label: 'その他' },
] as const

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 連絡先テーブル
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 連絡先種別 */
export const CONTACT_METHOD_OPTIONS: readonly SelectOption[] = [
  { value: 'email', label: 'メール' },
  { value: 'phone', label: '電話' },
  { value: 'chatwork', label: 'チャットワーク' },
] as const

/** 連絡先種別（フィルタ用 — 「なし」を含む） */
export const CONTACT_METHOD_FILTER_OPTIONS: readonly SelectOption[] = [
  ...CONTACT_METHOD_OPTIONS,
  { value: 'none', label: 'なし' },
] as const

/** 過去担当者 区分 */
export const STAFF_ROLE_OPTIONS: readonly SelectOption[] = [
  { value: 'main', label: '主担当' },
  { value: 'sub', label: '副担当' },
  { value: 'payroll', label: '給与社保担当' },
] as const

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// フォーム共通プレースホルダー・定数
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** プレースホルダー: 未設定 */
export const PLACEHOLDER_UNSET = '未設定'

/** 決算日 — 末日ラベル */
export const FISCAL_DAY_END_LABEL = '末日'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// スタッフ管理
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** スタッフステータス */
export const STAFF_STATUS_OPTIONS: readonly SelectOption[] = [
  { value: 'active', label: '有効' },
  { value: 'inactive', label: '停止中' },
] as const

/** スタッフ権限 */
export const STAFF_PERMISSION_OPTIONS: readonly SelectOption[] = [
  { value: 'admin', label: '管理者' },
  { value: 'member', label: '一般' },
] as const

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 選択肢レジストリ（FieldDef.optionsの定数名参照→配列解決用）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 定数名 → SelectOption[] のマッピング */
const OPTIONS_REGISTRY: Record<string, readonly SelectOption<string | number>[]> = {
  TYPE_OPTIONS,
  STATUS_OPTIONS,
  INDUSTRY_OPTIONS,
  ANNUAL_REVENUE_OPTIONS,
  ACCOUNTING_SOFTWARE_OPTIONS,
  TAX_FILING_OPTIONS,
  TAX_MODE_OPTIONS,
  SIMPLIFIED_CATEGORY_OPTIONS,
  TAX_METHOD_OPTIONS,
  CALCULATION_METHOD_OPTIONS,
  DEFAULT_PAYMENT_OPTIONS,
  CONSUMPTION_TAX_INTERIM_OPTIONS,
  NEEDS_OPTIONS,
  CONTRACT_SCOPE_OPTIONS,
  BOOKKEEPING_TYPE_OPTIONS,
  YES_NO_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_DAY_OPTIONS,
  CONTACT_METHOD_OPTIONS,
}

/**
 * FieldDef.options を FilterColumnDef.filterOptions 形式に解決
 * - FieldOption[] → そのまま返す
 * - string → OPTIONS_REGISTRYから取得
 * - undefined → 空配列
 */
export function resolveFieldOptions(
  options: readonly { value: string | number; label: string }[] | string | undefined,
): readonly { value: string; label: string }[] {
  if (!options) return []
  if (typeof options === 'string') {
    const found = OPTIONS_REGISTRY[options]
    if (!found) return []
    return found.map(o => ({ value: String(o.value), label: o.label }))
  }
  return options.map(o => ({ value: String(o.value), label: o.label }))
}
