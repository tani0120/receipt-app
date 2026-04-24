/**
 * プロンプト定義パネル用データ
 * classify.service.tsのプロンプト構成をフロント側で可視化するためのre-export
 *
 * ※ サーバー側コード（source_type_keywords.ts）を直接importすると
 *    Node.js依存が入る可能性があるため、型とデータのみ抽出
 */

export interface SourceTypeKeywords {
  type: string
  label: string
  keywords: string[]
  exclude: string[]
  note: string
}

export interface BoundaryGuide {
  document: string
  wrongType: string
  correctType: string
  reason: string
}

export const SOURCE_TYPE_KEYWORDS: SourceTypeKeywords[] = [
  {
    type: 'receipt', label: '領収書・レシート',
    keywords: ['領収書', '領収証', 'レシート', 'お買上げ', '合計', '小計', 'お預り', 'お釣り', '上記正に領収いたしました'],
    exclude: ['自社発行の領収書 → receipt_issued', '「領収書在中」の封筒のみ → non_journal'],
    note: 'POS端末出力のレシート形式も含む',
  },
  {
    type: 'invoice_received', label: '受取請求書',
    keywords: ['請求書', '御請求書', 'ご請求書', '納品書兼請求書', '下記の通りご請求申し上げます', 'お支払期限', '振込先', 'インボイス番号', 'T+13桁'],
    exclude: ['自社発行の請求書 → invoice_issued', '見積書 → supplementary_doc', '納品書のみ → supplementary_doc'],
    note: '自社が支払い側となる請求書',
  },
  {
    type: 'tax_payment', label: '納付書',
    keywords: ['納付書', '納付済通知書', '領収済通知書', '法人税', '消費税', '源泉所得税', '住民税', '事業税', '税務署', '金融機関の受付印', '収納印'],
    exclude: ['納税通知書 → supplementary_doc', '源泉徴収票 → supplementary_doc', '予定納税通知書 → supplementary_doc', '確定申告書 → non_journal'],
    note: '支払済みの納付書のみ。受付印・収納印が判定ポイント',
  },
  {
    type: 'journal_voucher', label: '振替伝票',
    keywords: ['振替伝票', '借方', '貸方', '伝票番号', '起票日'],
    exclude: ['入金伝票・出金伝票 → supplementary_doc', '銀行の振替依頼書 → bank_statement'],
    note: '社内の振替処理を記録する伝票',
  },
  {
    type: 'bank_statement', label: '通帳・銀行明細',
    keywords: ['普通預金', '当座預金', '定期預金', '通帳', '取引明細', '入出金明細', 'お支払金額', 'お預り金額', '差引残高', '銀行名', '支店名'],
    exclude: ['残高証明書 → supplementary_doc', '口座振替結果通知 → supplementary_doc', '銀行の手数料領収書 → receipt'],
    note: '通帳ページの罫線形式',
  },
  {
    type: 'credit_card', label: 'クレカ明細',
    keywords: ['クレジットカード利用明細', 'カードご利用明細', 'ご利用日', 'ご利用先', 'ご利用金額', 'カード番号', 'お支払額'],
    exclude: ['クラウド利用明細 → supplementary_doc', 'SaaS請求書 → invoice_received', 'ポイント明細 → non_journal'],
    note: 'クレジットカード会社が発行した利用明細のみ',
  },
  {
    type: 'cash_ledger', label: '現金出納帳',
    keywords: ['現金出納帳', '小口現金出納帳', '入金', '出金', '残高'],
    exclude: ['通帳 → bank_statement', 'レジ精算レポート → supplementary_doc'],
    note: '現金の入出金を記録した帳簿',
  },
  {
    type: 'supplementary_doc', label: '仕訳補助資料',
    keywords: ['賃貸契約書', '売買契約書', '業務委託契約書', '見積書', '納品書', '検収書', '発注書', '支払明細書', '源泉徴収票', '物件別収支報告書', '給与明細', '固定資産台帳', '保険証券', '経費精算書'],
    exclude: ['「領収書」表記あり → receipt', '「請求書」表記あり → invoice_received', '通帳の取引明細 → bank_statement'],
    note: '上記7種に該当しないが、仕訳の根拠・補助資料となる書類',
  },
  {
    type: 'invoice_issued', label: '発行請求書',
    keywords: ['請求書', '御中', '下記の通りご請求申し上げます'],
    exclude: ['取引先から受け取った請求書 → invoice_received'],
    note: '⚠自社名をAIに渡していないため精度が低い',
  },
  {
    type: 'receipt_issued', label: '発行領収書',
    keywords: ['領収書', '上記正に領収いたしました'],
    exclude: ['取引先から受け取った領収書 → receipt'],
    note: '⚠自社名の情報がないため精度が低い',
  },
  {
    type: 'non_journal', label: '仕訳対象外',
    keywords: ['名刺', 'メモ', '付箋', '手紙', '挨拶状', 'パンフレット', 'カタログ', 'チラシ', '確定申告書', '議事録'],
    exclude: ['金額・日付・取引先の情報がある → 他カテゴリを検討'],
    note: '仕訳不要の書類',
  },
  {
    type: 'other', label: 'その他',
    keywords: ['判別不能な画像', '文字が読み取れない画像', '証票以外の写真'],
    exclude: ['少しでも取引情報が読み取れる → 他カテゴリを検討'],
    note: 'フォールバック',
  },
]

export const BOUNDARY_GUIDES: BoundaryGuide[] = [
  { document: '納税通知書', wrongType: 'tax_payment', correctType: 'supplementary_doc', reason: '受付印・収納印がない。「いくら払え」の通知' },
  { document: 'クラウド利用明細', wrongType: 'credit_card', correctType: 'supplementary_doc', reason: 'カード会社発行ではない' },
  { document: '源泉徴収票', wrongType: 'tax_payment', correctType: 'supplementary_doc', reason: '納付書ではない。年末調整結果の報告書' },
  { document: '納品書（請求書表記なし）', wrongType: 'invoice_received', correctType: 'supplementary_doc', reason: '「請求書」の表記がない' },
  { document: '見積書', wrongType: 'non_journal', correctType: 'supplementary_doc', reason: '取引情報あり。仕訳根拠になるケースが多い' },
  { document: '残高証明書', wrongType: 'bank_statement', correctType: 'supplementary_doc', reason: '取引明細ではない。特定日の残高のみ' },
  { document: 'レジ精算レポート', wrongType: 'receipt', correctType: 'supplementary_doc', reason: '領収書ではない。店舗側の精算記録' },
  { document: '口座振替結果通知', wrongType: 'bank_statement', correctType: 'supplementary_doc', reason: '通帳ではない。振替結果の通知書' },
  { document: '保険料控除証明書', wrongType: 'receipt', correctType: 'supplementary_doc', reason: '領収書ではない。年末調整用の証明書' },
  { document: 'カード年会費領収書', wrongType: 'credit_card', correctType: 'receipt', reason: 'カード利用明細ではなく領収書形式' },
]
