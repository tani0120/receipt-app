/**
 * vendorOptions.ts — 取引先・取引先外（NonVendor）関連の選択肢を一元管理
 *
 * 責務: 選択肢定数の定義
 * 参照元: MockMasterNonVendorPage / MockMasterVendorsPage / JournalListLevel3Mock
 *
 * ルール: 選択肢の追加・変更はこのファイルのみで行う。
 *         各ページでのハードコードは禁止。
 */

import type { SelectOption } from '@/constants/clientOptions'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 証票種類（source_category）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 証票種類 — フィルタ用（短縮ラベル） */
export const SOURCE_CATEGORY_FILTER_OPTIONS: readonly SelectOption[] = [
  { value: 'bank', label: '🏦 銀行明細' },
  { value: 'credit', label: '💳 クレカ明細' },
  { value: 'all', label: '📋 全共通' },
] as const

/** 証票種類 — インラインselect用（短縮ラベル） */
export const SOURCE_CATEGORY_OPTIONS: readonly SelectOption[] = [
  { value: 'bank', label: '🏦 銀行' },
  { value: 'credit', label: '💳 クレカ' },
  { value: 'all', label: '📋 全共通' },
] as const

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 入出金（direction）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 入出金 */
export const DIRECTION_OPTIONS: readonly SelectOption[] = [
  { value: 'expense', label: '出金' },
  { value: 'income', label: '入金' },
] as const

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 確定レベル（level）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 確定レベル */
export const LEVEL_OPTIONS: readonly SelectOption[] = [
  { value: 'A', label: 'A（自動確定）' },
  { value: 'insufficient', label: '❓ 人間判断' },
] as const

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 税区分 — 取引区分（direction）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 税区分の取引区分（共通/売上/仕入） */
export const TAX_DIRECTION_OPTIONS: readonly SelectOption[] = [
  { value: 'common', label: '共通' },
  { value: 'sales', label: '売上' },
  { value: 'purchase', label: '仕入' },
] as const

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 税区分 — 適格判定対象（qualified）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 適格判定のboolean選択肢 */
export const QUALIFIED_OPTIONS: readonly SelectOption[] = [
  { value: 'true', label: '○' },
  { value: 'false', label: '' },
] as const

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 課税方式
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 課税方式（本則/簡易/免税） */
export const TAX_METHOD_TYPE_OPTIONS: readonly SelectOption[] = [
  { value: 'general', label: '本則' },
  { value: 'simplified', label: '簡易' },
  { value: 'exempt', label: '免税' },
] as const
