/**
 * fieldLabels.ts — 各画面のフィールドラベル定数を一元管理
 *
 * 責務: マスタ設定画面・顧問先設定画面のインライン編集時に
 *       表示される「○○の△△を変更」メッセージのフィールド名を定数化。
 *
 * 移行先: Supabase移行時にfield_labelsテーブルへ投入するデータソース
 *
 * 使用箇所:
 *   - MockMasterAccountsPage.vue（acFieldLabels）
 *   - MockClientAccountsPage.vue（caFieldLabels）
 *   - MockMasterTaxCategoriesPage.vue（txFieldLabels）
 *   - MockClientTaxPage.vue（ctFieldLabels）
 *   - MockMasterClientsPage.vue（clFieldLabels）
 *   - LeadListPage.vue（clFieldLabels）
 *   - MockMasterStaffPage.vue（fieldLabels）
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 勘定科目フィールドラベル
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** マスタ勘定科目ページ用フィールドラベル */
export const ACCOUNT_FIELD_LABELS: Record<string, string> = {
  name: '科目名',
  category: '科目分類',
  defaultTaxCategoryId: 'デフォルト税区分',
  aiDetermination: '自動判定',
}

/** 顧問先勘定科目ページ用フィールドラベル（補助科目を含む） */
export const CLIENT_ACCOUNT_FIELD_LABELS: Record<string, string> = {
  ...ACCOUNT_FIELD_LABELS,
  subAccount: '補助科目',
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 税区分フィールドラベル
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 税区分ページ用フィールドラベル（マスタ/顧問先共通） */
export const TAX_CATEGORY_FIELD_LABELS: Record<string, string> = {
  direction: '取引区分',
  name: '税区分',
  rate: '税率',
  qualified: '適格判定対象',
  enabledFrom: '利用開始',
  enabledTo: '利用停止',
  effectiveFrom: '施行日',
  effectiveTo: '廃止日',
  mfCompliance: '表示',
  source: '出典',
}

/** 課税方式ラベル定数（セグメントボタン・パターン進捗で共用） */
export const TAX_METHOD_LABELS = [
  { value: 'proportional' as const, label: '原則（一括比例）', icon: 'fa-solid fa-scale-balanced' },
  { value: 'individual' as const, label: '原則（個別対応）', icon: 'fa-solid fa-list-check' },
  { value: 'simplified' as const, label: '簡易', icon: 'fa-solid fa-bolt' },
  { value: 'exempt' as const, label: '免税', icon: 'fa-solid fa-ban' },
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 顧問先/見込先フィールドラベル
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 顧問先一覧ページ用フィールドラベル */
export const CLIENT_FIELD_LABELS: Record<string, string> = {
  threeCode: '3コード',
  companyName: '会社名',
  companyNameKana: '会社名カナ',
  repName: '代表者名',
  repNameKana: '代表者名カナ',
  type: '種別',
  status: 'ステータス',
  industry: '業種',
  phoneNumber: '電話番号',
  email: 'メール',
  sharedEmail: '顧問先ログインメール',
}

/** 見込先一覧ページ用フィールドラベル（sharedEmailのみ異なる） */
export const LEAD_FIELD_LABELS: Record<string, string> = {
  ...CLIENT_FIELD_LABELS,
  sharedEmail: '見込先ログインメール',
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// スタッフフィールドラベル
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** スタッフ管理ページ用フィールドラベル */
export const STAFF_FIELD_LABELS: Record<string, string> = {
  status: 'ステータス',
  role: '権限',
  name: '名前',
  nameRomaji: 'ローマ字',
  email: 'メール',
}
