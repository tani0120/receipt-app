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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 基本情報
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 区分（法人/個人事業/個人） */
export const TYPE_OPTIONS: readonly SelectOption[] = [
  { value: 'corp', label: '法人' },
  { value: 'sole_proprietor', label: '個人事業' },
  { value: 'individual', label: '個人' },
] as const

/** ステータス */
export const STATUS_OPTIONS: readonly SelectOption[] = [
  { value: 'active', label: '契約中' },
  { value: 'suspension', label: '休眠中' },
  { value: 'inactive', label: '契約終了' },
] as const

/** 業種リスト */
export const INDUSTRY_OPTIONS: readonly string[] = [
  '', '飲食業', '建設業', '製造業・メーカー', '卸売業・小売業', '商社',
  '不動産業', '銀行・金融', '保険業', '医療・福祉関係業', 'コンサルティング',
  '専門事務所', '運輸・運送業', '旅行／宿泊／レジャー', 'IT・ソフトウェア関連',
  'スポーツ・ヘルス関連', '理容・美容・サロン', '冠婚葬祭', '警備関連',
  '清掃業', '教育業', '他サービス業', '官公庁・自治体', 'その他',
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

/** 課税方式 */
export const TAX_MODE_OPTIONS: readonly SelectOption[] = [
  { value: 'general', label: '原則課税' },
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

/** 税込/税抜 */
export const TAX_METHOD_OPTIONS: readonly SelectOption[] = [
  { value: 'inclusive', label: '税込' },
  { value: 'exclusive', label: '税抜' },
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

/** 過去担当者 区分 */
export const STAFF_ROLE_OPTIONS: readonly SelectOption[] = [
  { value: 'main', label: '主担当' },
  { value: 'sub', label: '副担当' },
  { value: 'payroll', label: '給与社保担当' },
] as const
