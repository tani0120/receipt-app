/**
 * journalConstants.ts — 仕訳リスト固有の定数集約
 *
 * 責務: JournalListLevel3Mock.vue 内にハードコードされていた
 *       勘定科目グループラベル・税区分グループラベル・警告ラベル・
 *       逆仕訳科目ID等をconstantsに移動し、一元管理する。
 *
 * 参照元: JournalListLevel3Mock.vue
 * 移行先: Supabase移行時にマスタテーブルへ投入するデータソース
 */

import {
  SALES_CATEGORIES,
  PURCHASE_CATEGORIES,
  BS_ASSET_CATEGORIES,
  BS_LIABILITY_CATEGORIES,
  BS_EQUITY_CATEGORIES,
} from '@/data/master/account-category-rules'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BS全カテゴリ（UI表示用: 資産+負債+純資産の統合リスト）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * BS全カテゴリ（UIドロップダウン用）
 * account-category-rules.tsの3分類を統合。
 * 注意: 項目名はaccount-category-rules.tsのBS系と若干異なる
 *       （例: '投資その他の資産' vs '投資その他'）ため、
 *       UI表示専用の固定リストとして独立定義。
 */
export const BS_CATEGORIES: readonly string[] = [
  '現金及び預金',
  '売上債権',
  '有価証券',
  'その他流動資産',
  '有形固定資産',
  '無形固定資産',
  '投資その他の資産',
  '買入債務',
  '短期借入金',
  'その他流動負債',
  '長期借入金',
  'その他固定負債',
  '純資産',
]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3大グループ定義（科目選択ドロップダウン用）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 3大グループ（勘定科目選択時のメガグループ表示用） */
export const MEGA_GROUPS: readonly { label: string; categories: readonly string[] }[] = [
  { label: '💰 売上', categories: SALES_CATEGORIES },
  { label: '📋 経費・仕入', categories: PURCHASE_CATEGORIES },
  { label: '🏦 資産・負債', categories: BS_CATEGORIES },
]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 税区分グループラベル
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 税区分グループラベル: 売上系 */
export const TAX_GROUP_SALES = '売上系'
/** 税区分グループラベル: 仕入系 */
export const TAX_GROUP_PURCHASE = '仕入系'
/** 税区分グループラベル: 共通 */
export const TAX_GROUP_COMMON = '共通'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 逆仕訳科目ID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 逆仕訳科目: 借方に出ても正当な売上系科目（値引き・返品等） */
export const CONTRA_REVENUE_IDS: readonly string[] = ['SALES_RETURNS', 'SALES_RETURNS_CORP']
/** 逆仕訳科目: 貸方に出ても正当な経費系科目（値引き・返品等） */
export const CONTRA_EXPENSE_IDS: readonly string[] = ['PURCHASE_RETURNS', 'PURCHASE_RETURNS_CORP']

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5分類グループ型（貸借バリデーション用）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 勘定科目の5分類グループ */
export type MegaGroupType = 'sales' | 'expense' | 'bs_al' | 'bs_equity' | null

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// accountGroupキー定数
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** accountGroupキー: PL収益 */
export const AG_PL_REVENUE = 'PL_REVENUE'
/** accountGroupキー: PL費用 */
export const AG_PL_EXPENSE = 'PL_EXPENSE'
/** accountGroupキー: BS純資産 */
export const AG_BS_EQUITY = 'BS_EQUITY'
/** accountGroupキー: BS資産 */
export const AG_BS_ASSET = 'BS_ASSET'
/** accountGroupキー: BS負債 */
export const AG_BS_LIABILITY = 'BS_LIABILITY'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 警告ラベルマップ (Single Source of Truth)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 警告レベル */
export type WarningLevel = 'error' | 'warn'

/** 警告ラベル定義 */
export interface WarningLabelDef {
  /** レベル: 'error'(赤) | 'warn'(黄) */
  level: WarningLevel
  /** 日本語定義（ホバーメッセージ） */
  label: string
  /** アイコン色（Tailwind CSSクラス） */
  color: string
  /** ソート優先度（大きいほど上位） */
  weight: number
}

/**
 * 警告ラベルマップ: Single Source of Truth
 *
 * level: 'error'(赤) | 'warn'(黄)
 * label: 日本語定義（ホバーメッセージ）
 * color: アイコン色
 * weight: ソート優先度（大きいほど上位）
 */
export const WARNING_LABEL_MAP: Record<string, WarningLabelDef> = {
  // エラー（赤）
  DEBIT_CREDIT_MISMATCH: {
    level: 'error',
    label: '借方貸方の合計額不一致',
    color: 'text-red-600',
    weight: 17,
  },
  DATE_UNKNOWN: { level: 'error', label: '日付が不明', color: 'text-red-600', weight: 16 },
  ACCOUNT_UNKNOWN: { level: 'error', label: '勘定科目が不明', color: 'text-red-600', weight: 15 },
  TAX_UNKNOWN: { level: 'error', label: '税区分が不明', color: 'text-red-600', weight: 14.5 },
  DUPLICATE_CONFIRMED: {
    level: 'error',
    label: '完全重複（同一画像）',
    color: 'text-red-600',
    weight: 13,
  },
  MULTIPLE_VOUCHERS: { level: 'error', label: '複数の証票あり', color: 'text-red-600', weight: 12 },
  AMOUNT_UNCLEAR: { level: 'error', label: '金額が不明', color: 'text-red-600', weight: 14 },
  FUTURE_DATE: { level: 'error', label: '未来日付', color: 'text-red-600', weight: 9 },
  // 注意（黄）
  CATEGORY_CONFLICT: {
    level: 'warn',
    label: '借方/貸方の区分が矛盾',
    color: 'text-yellow-600',
    weight: 7,
  },
  VOUCHER_TYPE_CONFLICT: {
    level: 'warn',
    label: '証票意味と科目が不整合',
    color: 'text-yellow-600',
    weight: 6.5,
  },
  TAX_ACCOUNT_MISMATCH: {
    level: 'warn',
    label: '税区分と勘定科目が矛盾',
    color: 'text-yellow-600',
    weight: 7.5,
  },
  DUPLICATE_SUSPECT: { level: 'warn', label: '重複疑い', color: 'text-yellow-600', weight: 6 },
  UNREADABLE_ESTIMATED: {
    level: 'warn',
    label: '判読困難（AI推測値）',
    color: 'text-yellow-600',
    weight: 4,
  },
  MEMO_DETECTED: { level: 'warn', label: '手書きメモ検出', color: 'text-yellow-600', weight: 3 },
  DESCRIPTION_UNKNOWN: { level: 'warn', label: '摘要が不明', color: 'text-yellow-600', weight: 2 },
  SAME_ACCOUNT_BOTH_SIDES: {
    level: 'warn',
    label: '同一科目が借方/貸方の両方に存在',
    color: 'text-yellow-600',
    weight: 6.7,
  },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 証票種類バッジマップ（labelKeyMap）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 証票種類バッジ定義 */
export interface LabelKeyDef {
  /** 短縮表示（1文字） */
  short: string
  /** フルラベル（tooltipに表示） */
  label: string
  /** 背景色クラス（Tailwind CSS） */
  bgClass: string
}

/** 証票種類バッジマップ: 仕訳リストの証票バッジ表示に使用 */
export const LABEL_KEY_MAP: Record<string, LabelKeyDef> = {
  RECEIPT: { short: 'レ', label: 'レシート・領収証', bgClass: 'bg-emerald-600' },
  INVOICE: { short: '請', label: '請求書', bgClass: 'bg-blue-600' },
  TRANSPORT: { short: '交', label: '交通費', bgClass: 'bg-cyan-600' },
  CREDIT_CARD: { short: 'ク', label: 'クレジットカード', bgClass: 'bg-purple-600' },
  BANK_STATEMENT: { short: '銀', label: '銀行明細', bgClass: 'bg-indigo-600' },
  MEDICAL: { short: '医', label: '医療費', bgClass: 'bg-pink-600' },
  NOT_JOURNAL: { short: '外', label: '仕訳対象外', bgClass: 'bg-gray-600' },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ツールチップラベル
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** ツールチップ: 学習適用済み */
export const TIP_RULE_APPLIED = '学習適用済み'
/** ツールチップ: 学習できます */
export const TIP_RULE_AVAILABLE = '学習できます'
/** ツールチップ: クレジットカード払い */
export const TIP_CREDIT_CARD_PAY = 'クレジットカード払い'
/** ツールチップ: 証票にメモあり */
export const TIP_MEMO_EXISTS = '証票にメモあり'
/** ツールチップ: 非適格 */
export const TIP_NOT_QUALIFIED = '非適格'
