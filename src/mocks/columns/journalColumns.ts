/**
 * 仕訳一覧列定義（単一ソース）
 *
 * 準拠: 00_モック実装時のルール.md §3
 * 設計原則: §3.5 参照
 *
 * - 配列順 = UI表示順
 * - key: text/amount型はデータパス、その他はUI識別子
 * - sortKey: ソート可能な列のキー名（ソート処理はVueコンポーネント側）
 * - defaultPx: useColumnResize用デフォルト幅(px)。flex列は0（CSS flex-1で管理）
 */
type JournalColumn = {
  key: string
  label: string
  width: string
  defaultPx: number
  type: 'checkbox' | 'index' | 'component' | 'text' | 'amount' | 'action' | 'account-dropdown' | 'category-dropdown' | 'voucher-type-dropdown'
  sortKey?: string
  icon?: string
}

export const journalColumns: JournalColumn[] = [
  // --- 操作 ---
  { key: "select", label: "選", width: "w-6", defaultPx: 24, type: "checkbox" },
  { key: "no", label: "No.", width: "w-8", defaultPx: 32, type: "index", sortKey: "display_order" },

  // --- 特殊描画（component型） ---
  { key: "photo", label: "写真", width: "w-12", defaultPx: 28, type: "component", sortKey: "has_photo" },
  { key: "pastJournal", label: "過去仕訳", width: "w-14", defaultPx: 37, type: "component", sortKey: "past_journal" },
  { key: "rule", label: "学習", width: "w-8", defaultPx: 26, type: "component", sortKey: "rule" },
  { key: "comment", label: "コメント", width: "w-12", defaultPx: 39, type: "component", sortKey: "staff_notes" },
  { key: "needAction", label: "要対応", width: "w-20", defaultPx: 80, type: "component", sortKey: "requires_action" },
  { key: "labelType", label: "証票", width: "w-12", defaultPx: 49, type: "component", sortKey: "label_type" },
  { key: "warning", label: "警告", width: "w-12", defaultPx: 45, type: "component", sortKey: "warning" },
  { key: "creditCardPayment", label: "クレ払い", width: "w-10", defaultPx: 33, type: "component", sortKey: "is_credit_card_payment" },
  { key: "taxRate", label: "軽減", width: "w-8", defaultPx: 24, type: "component", sortKey: "tax_rate" },
  { key: "memo", label: "証票メモ", width: "w-8", defaultPx: 32, type: "component", sortKey: "memo" },
  { key: "invoice", label: "適格", width: "w-10", defaultPx: 40, type: "component", sortKey: "invoice" },

  // --- データ（journal-level: text型） ---
  { key: "voucher_type", label: "証票意味", width: "w-16", defaultPx: 64, type: "voucher-type-dropdown", sortKey: "voucher_type" },
  { key: "voucher_date", label: "日付", width: "w-16", defaultPx: 64, type: "text", sortKey: "voucher_date" },
  { key: "description", label: "摘要", width: "flex-1", defaultPx: 0, type: "text", sortKey: "description" },

  // --- データ（entry-level: text/amount型） ---
  { key: "debit.account", label: "借方勘定科目", width: "w-20", defaultPx: 80, type: "account-dropdown", sortKey: "debit_account" },
  { key: "debit.sub_account", label: "借方補助", width: "w-16", defaultPx: 64, type: "text", sortKey: "debit_sub_account" },
  { key: "debit.tax_category_id", label: "借方税区分", width: "w-20", defaultPx: 80, type: "text", sortKey: "debit_tax" },
  { key: "debit.amount", label: "借方金額", width: "w-16", defaultPx: 64, type: "amount", sortKey: "debit_amount" },

  { key: "credit.account", label: "貸方勘定科目", width: "w-20", defaultPx: 80, type: "account-dropdown", sortKey: "credit_account" },
  { key: "credit.sub_account", label: "貸方補助", width: "w-16", defaultPx: 64, type: "text", sortKey: "credit_sub_account" },
  { key: "credit.tax_category_id", label: "貸方税区分", width: "w-20", defaultPx: 80, type: "text", sortKey: "credit_tax" },
  { key: "credit.amount", label: "貸方金額", width: "w-16", defaultPx: 64, type: "amount", sortKey: "credit_amount" },

  // --- 操作（末尾） ---
  { key: "actions", label: "操作", width: "w-8", defaultPx: 32, type: "action", icon: "⋮" },
];

/** useColumnResize用のデフォルト幅マップ生成 */
export function getDefaultColumnWidths(): Record<string, number> {
  const map: Record<string, number> = {}
  for (const col of journalColumns) {
    if (col.defaultPx > 0) {
      map[col.key] = col.defaultPx
    }
  }
  return map
}
