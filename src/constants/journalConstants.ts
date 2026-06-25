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

import type { AccountGroup } from '@/types/shared-account'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3大グループ定義（科目選択ドロップダウン用）
// accountGroupベースで判定（データ駆動）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 3大グループ定義 */
export interface MegaGroupDef {
  label: string
  accountGroups: AccountGroup[]
}

/** 3大グループ（勘定科目選択時のメガグループ表示用。accountGroupで判定） */
export const MEGA_GROUPS: readonly MegaGroupDef[] = [
  { label: '💰 売上', accountGroups: ['PL_REVENUE'] },
  { label: '📋 経費・仕入', accountGroups: ['PL_EXPENSE'] },
  { label: '🏦 資産・負債', accountGroups: ['BS_ASSET', 'BS_LIABILITY', 'BS_EQUITY'] },
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
// 逆仕訳科目ID — マスタのisContraRevenue/isContraExpenseフラグに移行済み
// journalValidationCore.ts → isContraAccount() でデータ駆動判定
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5分類グループ型（貸借バリデーション用）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 勘定科目の5分類グループ（shared/validation/journalValidationCore.ts からre-export） */
export type { MegaGroupType } from '@/shared/validation/journalValidationCore'

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

/** 警告レベル（error=赤, warn=黄, info=青） */
export type WarningLevel = 'error' | 'warn' | 'info'

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
  DATE_OUT_OF_RANGE: {
    level: 'warn',
    label: '日付が当期の範囲外',
    color: 'text-yellow-600',
    weight: 8,
  },
  DIRECTOR_LOAN: {
    level: 'warn',
    label: '役員貸付金（税務リスク注意）',
    color: 'text-yellow-600',
    weight: 5,
  },
  // NOTE:
  // AI_ESTIMATED は警告ではなく情報ラベル。
  // 将来的に labels を warnings / badges に分離する際の移行対象。
  // determination_method === 'ai_fallback' が根拠データ。
  AI_ESTIMATED: {
    level: 'info',
    label: 'AI推定（確認推奨）',
    color: 'text-blue-500',
    weight: 1,
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MF会計CSV列ヘッダー（仕訳帳エクスポート23列）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/** MF仕訳帳CSVのヘッダー検出キーワード */
export const MF_CSV_HEADER_KEYWORD = '取引No' as const

/** MF仕訳帳CSV 23列ヘッダー */
export const MF_CSV_HEADERS = [
  '取引No', '取引日', '借方勘定科目', '借方補助科目', '借方部門', '借方取引先',
  '借方税区分', '借方インボイス', '借方金額(円)', '借方税額',
  '貸方勘定科目', '貸方補助科目', '貸方部門', '貸方取引先',
  '貸方税区分', '貸方インボイス', '貸方金額(円)', '貸方税額',
  '摘要', '仕訳メモ', 'タグ', 'MF仕訳タイプ', '決算整理仕訳',
] as const
