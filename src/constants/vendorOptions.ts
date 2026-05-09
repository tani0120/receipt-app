/**
 * vendorOptions.ts — 取引先・取引先外（NonVendor）関連の選択肢を一元管理
 *
 * 責務: 選択肢定数の定義
 * 参照元: MockMasterNonVendorPage / MockMasterVendorsPage / JournalListLevel3Mock
 *
 * ルール: 選択肢の追加・変更はこのファイルのみで行う。
 *         各ページでのハードコードは禁止。
 */

import type { SelectOption } from "@/constants/clientOptions";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 証票種類（source_category）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 証票種類 — フィルタ用（短縮ラベル） */
export const SOURCE_CATEGORY_FILTER_OPTIONS: readonly SelectOption[] = [
  { value: "bank", label: "🏦 銀行明細" },
  { value: "credit", label: "💳 クレカ明細" },
  { value: "all", label: "📋 全共通" },
] as const;

/** 証票種類 — インラインselect用（短縮ラベル） */
export const SOURCE_CATEGORY_OPTIONS: readonly SelectOption[] = [
  { value: "bank", label: "🏦 銀行" },
  { value: "credit", label: "💳 クレカ" },
  { value: "all", label: "📋 全共通" },
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 真偽値フィルタ（あり/なし）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 真偽値フィルタ用選択肢 */
export const BOOLEAN_FILTER_OPTIONS: readonly SelectOption[] = [
  { value: 'true', label: 'あり' },
  { value: 'false', label: 'なし' },
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 入出金（direction）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 入出金 */
export const DIRECTION_OPTIONS: readonly SelectOption[] = [
  { value: "expense", label: "出金" },
  { value: "income", label: "入金" },
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 確定レベル（level）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 確定レベル */
export const LEVEL_OPTIONS: readonly SelectOption[] = [
  { value: "A", label: "A（自動確定）" },
  { value: "insufficient", label: "❓ 人間判断" },
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 税区分 — 取引区分（direction）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 税区分の取引区分（共通/売上/仕入） */
export const TAX_DIRECTION_OPTIONS: readonly SelectOption[] = [
  { value: "common", label: "共通" },
  { value: "sales", label: "売上" },
  { value: "purchase", label: "仕入" },
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 税区分 — 適格判定対象（qualified）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 適格判定のboolean選択肢 */
export const QUALIFIED_OPTIONS: readonly SelectOption[] = [
  { value: "true", label: "○" },
  { value: "false", label: "" },
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 課税方式
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 課税方式（本則/簡易/免税） */
export const TAX_METHOD_TYPE_OPTIONS: readonly SelectOption[] = [
  { value: "general", label: "本則" },
  { value: "simplified", label: "簡易" },
  { value: "exempt", label: "免税" },
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 仕訳リスト
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 確認状態（チェックマーク） */
export const CHECK_STATUS_OPTIONS: readonly SelectOption[] = [
  { value: "", label: "　" },
  { value: "◯", label: "◯" },
  { value: "✕", label: "✕" },
] as const;

/** ページサイズ */
export const PAGE_SIZE_OPTIONS: readonly SelectOption<number>[] = [
  { value: 30, label: "30件" },
  { value: 50, label: "50件" },
  { value: 100, label: "100件" },
] as const;

/** 金額条件 */
export const AMOUNT_CONDITION_OPTIONS: readonly SelectOption[] = [
  { value: "equal", label: "等しい" },
  { value: "greater", label: "以上" },
  { value: "less", label: "以下" },
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 共通UI
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** ソート方向 */
export const SORT_ORDER_OPTIONS: readonly SelectOption[] = [
  { value: "asc", label: "昇順" },
  { value: "desc", label: "降順" },
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 証票ドキュメント種別（voucher document type）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 証票ドキュメント種別フィルタ */
export const VOUCHER_DOC_FILTER_OPTIONS = [
  { key: "", label: "全て" },
  { key: "RECEIPT", label: "領収書" },
  { key: "INVOICE", label: "請求書" },
  { key: "BANK_STATEMENT", label: "通帳" },
  { key: "CREDIT_CARD", label: "クレカ" },
  { key: "TRANSPORT", label: "交通費" },
  { key: "MEDICAL", label: "医療費" },
] as const;

/** 証票意味分類（仕訳の用途分類） */
export const VOUCHER_TYPES = [
  "売上",
  "経費",
  "給与",
  "立替経費",
  "振替",
  "クレカ",
  "クレカ引落",
  "その他",
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 共通プレースホルダ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** フィルタのデフォルト値「全て」 */
export const FILTER_ALL_LABEL = '全て'

/** null選択肢のラベル「—」 */
export const PLACEHOLDER_DASH = '—'

/** 未選択プレースホルダ「--」 */
export const PLACEHOLDER_EMPTY = '--'

/** 選択肢のデフォルト「選択してください」 */
export const PLACEHOLDER_SELECT = '選択してください'

/** 区切り線「------」 */
export const PLACEHOLDER_DIVIDER = '------'

/** 追加操作ラベル「＋追加」 */
export const PLACEHOLDER_ADD = '＋追加'

/** 全セクションラベル */
export const FILTER_ALL_SECTIONS = '全セクション'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 学習ルール（MockLearningPage）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 学習ルール: 証票種別タブラベル（countは動的なのでlabel/valueのみ） */
export const LEARNING_SOURCE_TAB_LABELS: readonly { label: string; value: string }[] = [
  { label: '全て', value: 'all' },
  { label: '領収書', value: 'receipt' },
  { label: '口座', value: 'bank' },
  { label: 'カード', value: 'credit' },
]

/** 学習ルール: 証憑種別（モーダル用） */
export const LEARNING_SOURCE_CATEGORY_OPTIONS: readonly SelectOption[] = [
  { value: 'receipt', label: '領収書/請求書' },
  { value: 'bank', label: '口座' },
  { value: 'credit', label: 'カード' },
] as const

/** 学習ルール: キーワード照合方式 */
export const LEARNING_MATCH_TYPE_OPTIONS: readonly SelectOption[] = [
  { value: 'exact', label: '等しい' },
  { value: 'contains', label: '含む' },
] as const

/** 学習ルール: 金額条件モード */
export const LEARNING_AMOUNT_MODE_OPTIONS: readonly SelectOption[] = [
  { value: 'none', label: '金額を条件としない' },
  { value: 'min', label: '以上' },
  { value: 'max', label: '以下' },
  { value: 'exact', label: '同額' },
  { value: 'range', label: '範囲' },
] as const

/** 学習ルール: 金額タイプ（仕訳エントリ用） */
export const LEARNING_AMOUNT_TYPE_OPTIONS: readonly SelectOption[] = [
  { value: 'auto', label: '自動計算' },
  { value: 'total', label: '取引金額' },
  { value: 'fixed', label: '固定金額' },
] as const
