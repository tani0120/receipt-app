/**
 * voucherTypeRules.ts — 証票意味ごとの許容科目ルール定義
 *
 * 各証票意味に対して、借方・貸方に許容される科目を定義する。
 * allowedGroups: accountGroupが一致する科目は全てOK
 * allowedIds: 個別にOKにする科目ID
 *
 * ルール未定義の証票意味（例: null）はバリデーション対象外。
 */

// ────────────────────────────────────────────
// 型定義
// ────────────────────────────────────────────

export type VoucherTypeSideRule = {
  /** このaccountGroupに属する科目は全てOK */
  allowedGroups?: string[]
  /** 個別にOKにする科目ID（コピー元IDも自動照合） */
  allowedIds?: string[]
  /** このcategoryに属する科目は全てOK（コピー・カスタム科目も動的に含まれる） */
  allowedCategories?: string[]
}

export type VoucherTypeRule = {
  /** 証票意味の日本語名 */
  label: string
  /** ユーザー向け説明（モーダル表示用） */
  description: string
  /** 借方に許容される科目 */
  debit: VoucherTypeSideRule
  /** 貸方に許容される科目 */
  credit: VoucherTypeSideRule
}

// ────────────────────────────────────────────
// 共通科目IDセット
// ────────────────────────────────────────────

/** 預金系科目（口座振替・引落の両側で使用） */
const DEPOSIT_IDS = [
  'ORDINARY_DEPOSIT',   // 普通預金
  'CHECKING_DEPOSIT',   // 当座預金
  'TIME_DEPOSIT',       // 定期預金
  'OTHER_DEPOSIT',      // その他の預金（個人用）
] as const

/** 支払手段科目（経費等の貸方に使用） */
const PAYMENT_IDS = [
  'CASH',               // 現金
  ...DEPOSIT_IDS,
  'ACCRUED_EXPENSES',   // 未払金
  'TEMPORARY_PAYMENTS', // 仮払金（仮払精算用）
] as const

/** 売上受取手段科目（売上の借方に使用） */
const RECEIVABLE_IDS = [
  'ACCOUNTS_RECEIVABLE', // 売掛金
  'NOTES_RECEIVABLE',    // 受取手形
  'CASH',                // 現金
  ...DEPOSIT_IDS,
] as const

/** 給与系科目（給与の借方に使用） */
const SALARY_IDS = [
  'SALARIES',              // 給料手当
  'OFFICER_COMPENSATION',  // 役員報酬
  'BONUSES',               // 賞与
] as const

/** 給与貸方科目（手取り+天引き） */
const SALARY_CREDIT_IDS = [
  ...DEPOSIT_IDS,
  'DEPOSITS_RECEIVED',  // 預り金（源泉・社保）
] as const

/** 立替系科目（立替経費の貸方に使用） */
const ADVANCE_IDS = [
  'ADVANCE_PAID',     // 立替金
  'ACCRUED_REVENUE',  // 未収金
] as const

// ────────────────────────────────────────────
// ルールテーブル
// ────────────────────────────────────────────

/** コピー科目のIDからコピー元IDを抽出（ORDINARY_DEPOSIT_COPY_1 → ORDINARY_DEPOSIT） */
export function getBaseAccountId(id: string): string {
  return id.replace(/_COPY_\d+$/, '')
}

export const VOUCHER_TYPE_RULES: Record<string, VoucherTypeRule> = {
  '経費': {
    label: '経費',
    description: '費用が発生した証票。借方に費用科目、貸方に支払手段（現金・預金・未払金・仮払金）。',
    debit: {
      allowedGroups: ['PL_EXPENSE'],
    },
    credit: {
      allowedIds: [...PAYMENT_IDS],
      allowedCategories: ['現金及び預金', 'その他流動資産', 'その他流動負債'],
    },
  },

  '売上': {
    label: '売上',
    description: '収益が発生した証票。借方に受取手段（売掛金・現金・預金）、貸方に収益科目。',
    debit: {
      allowedIds: [...RECEIVABLE_IDS],
      allowedCategories: ['売上債権', '現金及び預金'],
    },
    credit: {
      allowedGroups: ['PL_REVENUE'],
    },
  },

  'クレカ': {
    label: 'クレカ',
    description: 'クレジットカード利用明細。借方に費用科目、貸方は未払金のみ。',
    debit: {
      allowedGroups: ['PL_EXPENSE'],
    },
    credit: {
      allowedIds: ['ACCRUED_EXPENSES'],
    },
  },

  'クレカ引落': {
    label: 'クレカ引落',
    description: 'クレジットカード代金の引落し。借方は未払金、貸方は預金口座。',
    debit: {
      allowedIds: ['ACCRUED_EXPENSES'],
    },
    credit: {
      allowedIds: [...DEPOSIT_IDS],
      allowedCategories: ['現金及び預金'],
    },
  },

  '給与': {
    label: '給与',
    description: '給与支払の証票。借方に給与系科目（給料手当・役員報酬・賞与）、貸方に預金（手取り）+預り金（源泉・社保の天引き）。',
    debit: {
      allowedIds: [...SALARY_IDS],
      allowedGroups: ['PL_EXPENSE'],
    },
    credit: {
      allowedIds: [...SALARY_CREDIT_IDS],
      allowedCategories: ['現金及び預金', 'その他流動負債'],
    },
  },

  '立替経費': {
    label: '立替経費',
    description: '従業員が立て替えた経費の精算。借方に費用科目、貸方に立替金または未収金。',
    debit: {
      allowedGroups: ['PL_EXPENSE'],
    },
    credit: {
      allowedIds: [...ADVANCE_IDS],
      allowedCategories: ['その他流動資産'],
    },
  },

  '振替': {
    label: '振替',
    description: '口座間の資金移動。借方・貸方ともに預金科目（普通預金・当座預金・定期預金）。',
    debit: {
      allowedIds: [...DEPOSIT_IDS],
      allowedCategories: ['現金及び預金'],
    },
    credit: {
      allowedIds: [...DEPOSIT_IDS],
      allowedCategories: ['現金及び預金'],
    },
  },
}
