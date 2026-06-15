/**
 * mfApiConstants.ts — MF API定数の一元定義
 *
 * MF APIのenum値・仕訳種別・経過措置日付をSSOT化。
 * journalToMfConverter.ts / mfJournalImporter.ts から参照。
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// インボイス区分（MF API enum値）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 適格請求書（インボイス登録済み） */
export const MF_INVOICE_KIND_QUALIFIED = 'INVOICE_KIND_QUALIFIED'
/** 非適格（経過措置80%控除: 2023/10/01〜2026/09/30） */
export const MF_INVOICE_KIND_UNQUALIFIED_80 = 'INVOICE_KIND_UNQUALIFIED_80'
/** 非適格（経過措置50%控除: 2026/10/01〜2029/09/30） */
export const MF_INVOICE_KIND_UNQUALIFIED_50 = 'INVOICE_KIND_UNQUALIFIED_50'
/** 非適格（経過措置終了後: 2029/10/01〜。控除なし） */
export const MF_INVOICE_KIND_NOT_QUALIFIED_0 = 'INVOICE_KIND_NOT_QUALIFIED_0'
/** インボイス対象外（免税事業者等） */
export const MF_INVOICE_KIND_NOT_TARGET = 'INVOICE_KIND_NOT_TARGET'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 経過措置日付
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 経過措置50%控除開始日（80%→50%の切替日） */
export const INVOICE_TRANSITION_50_DATE = '2026-10-01'
/** 経過措置終了日（50%→0%の切替日） */
export const INVOICE_TRANSITION_0_DATE = '2029-10-01'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 仕訳種別・タグ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** MF API仕訳種別: 仕訳帳エントリ */
export const MF_JOURNAL_TYPE_ENTRY = 'journal_entry'
/** MF API仕訳種別: 決算整理仕訳 */
export const MF_JOURNAL_TYPE_ADJUSTING = 'adjusting_entry'
/** sugusuru → MF送信時に付与するタグ */
export const MF_SUGUSURU_TAG = 'SUGUSRU'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// デフォルト値
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 税区分のデフォルト施行日（軽減税率制度開始日） */
export const DEFAULT_EFFECTIVE_FROM = '2019-10-01'

/** 勘定科目のデフォルト施行日（勘定科目に施行日の概念はないためnull） */
export const DEFAULT_ACCOUNT_EFFECTIVE_FROM: string | null = null

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ヘルパー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * sugusuru内部のinvoice値 → MF APIのinvoice_kind enum値に変換
 *
 * @param status sugusuru側: 'qualified' | 'not_qualified' | null
 * @param isTaxExempt 免税事業者か
 * @param voucherDate 伝票日付（経過措置判定用）
 */
export function toMfInvoiceKind(
  status: string | null | undefined,
  isTaxExempt: boolean,
  voucherDate?: string | null,
): string | null {
  if (isTaxExempt) return null

  switch (status) {
    case 'qualified': return MF_INVOICE_KIND_QUALIFIED
    case 'not_qualified': {
      if (voucherDate && voucherDate >= INVOICE_TRANSITION_0_DATE) {
        return MF_INVOICE_KIND_NOT_QUALIFIED_0
      }
      if (voucherDate && voucherDate >= INVOICE_TRANSITION_50_DATE) {
        return MF_INVOICE_KIND_UNQUALIFIED_50
      }
      return MF_INVOICE_KIND_UNQUALIFIED_80
    }
    default: return MF_INVOICE_KIND_NOT_TARGET
  }
}

/**
 * MF APIのinvoice_kind → sugusuru内部のinvoice値に逆変換
 */
export function fromMfInvoiceKind(mfKind: string | null | undefined): string | null {
  if (!mfKind) return null
  if (mfKind === MF_INVOICE_KIND_QUALIFIED) return 'qualified'
  if (mfKind.startsWith('INVOICE_KIND_UNQUALIFIED')) return 'not_qualified'
  if (mfKind === MF_INVOICE_KIND_NOT_TARGET) return null
  return null
}
