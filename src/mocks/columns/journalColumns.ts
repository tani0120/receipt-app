/**
 * 仕訳一覧列定義（単一ソース）
 *
 * 準拠: 00_モック実装時のルール.md §3
 * 設計原則: §3.5 参照
 *
 * - 配列順 = UI表示順
 * - key: text/amount型はデータパス、その他はUI識別子
 * - sortKey: ソート可能な列のキー名（ソート処理はVueコンポーネント側）
 */
export const journalColumns = [
    // --- 操作 ---
    { key: "select", label: "選", width: "w-6", type: "checkbox" },
    { key: "no", label: "No.", width: "w-8", type: "index", sortKey: "display_order" },

    // --- 特殊描画（component型: ボディはPhase A-0では直書き） ---
    { key: "photo", label: "写真", width: "w-12", type: "component", sortKey: "has_photo" },
    { key: "pastJournal", label: "過去仕訳", width: "w-12", type: "component", sortKey: "past_journal" },
    { key: "comment", label: "コメント", width: "w-12", type: "component", sortKey: "status" },
    { key: "needAction", label: "要対応", width: "w-16", type: "component", sortKey: "requires_action" },
    { key: "labelType", label: "証票", width: "w-10", type: "component", sortKey: "label_type" },
    { key: "warning", label: "警告", width: "w-10", type: "component", sortKey: "warning" },
    { key: "rule", label: "学習", width: "w-8", type: "component", sortKey: "rule" },
    { key: "taxRate", label: "軽減", width: "w-8", type: "component", sortKey: "tax_rate" },
    { key: "memo", label: "メモ", width: "w-8", type: "component", sortKey: "memo" },
    { key: "invoice", label: "適格", width: "w-10", type: "component", sortKey: "invoice" },

    // --- データ（journal-level: text型） ---
    { key: "transaction_date", label: "取引日", width: "w-16", type: "text", sortKey: "transaction_date" },
    { key: "description", label: "摘要", width: "flex-1", type: "text", sortKey: "description" },

    // --- データ（entry-level: text/amount型） ---
    { key: "debit.account", label: "借方勘定科目", width: "w-20", type: "text", sortKey: "debit_account" },
    { key: "debit.sub_account", label: "借方補助", width: "w-16", type: "text", sortKey: "debit_sub_account" },
    { key: "debit.tax_category", label: "借方税区分", width: "w-20", type: "text", sortKey: "debit_tax" },
    { key: "debit.amount", label: "借方金額", width: "w-16", type: "amount", sortKey: "debit_amount" },
    { key: "credit.account", label: "貸方勘定科目", width: "w-20", type: "text", sortKey: "credit_account" },
    { key: "credit.sub_account", label: "貸方補助", width: "w-16", type: "text", sortKey: "credit_sub_account" },
    { key: "credit.tax_category", label: "貸方税区分", width: "w-20", type: "text", sortKey: "credit_tax" },
    { key: "credit.amount", label: "貸方金額", width: "w-16", type: "amount", sortKey: "credit_amount" },

    // --- 操作（末尾） ---
    { key: "trash", label: "🗑", width: "w-8", type: "action" },
] as const;
