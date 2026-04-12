/**
 * source_type_keywords.ts
 * 証票種別ごとの判定キーワード・除外ルール・補足情報
 *
 * 用途: classify.service.ts のプロンプト生成時にimportし、
 *       SYSTEM_INSTRUCTIONに動的結合する
 * 将来: Supabase移行時にDB格納に差し替え可能
 */

// ============================================================
// 型定義
// ============================================================

/** 1つのsource_typeに対応するキーワード定義 */
export interface SourceTypeKeywords {
  /** source_type値 */
  type: string;
  /** 日本語名 */
  label: string;
  /** 判定キーワード（画像内にこれがあれば該当） */
  keywords: string[];
  /** 除外ルール（このキーワードがあっても該当しない） */
  exclude: string[];
  /** 判定補足（AIへの追加説明） */
  note: string;
}

/** 紛らわしい境界の判定ガイド1件 */
export interface BoundaryGuide {
  /** 書類名 */
  document: string;
  /** 誤判定されやすいカテゴリ */
  wrongType: string;
  /** 正しいカテゴリ */
  correctType: string;
  /** 判定ポイント */
  reason: string;
}

// ============================================================
// 全12種のキーワード定義
// ============================================================

export const SOURCE_TYPE_KEYWORDS: SourceTypeKeywords[] = [
  // ─── 1. receipt（領収書・レシート） ───
  {
    type: 'receipt',
    label: '領収書・レシート',
    keywords: [
      '領収書', '領収証', 'レシート',
      'お買上げ', '合計', '小計', 'お預り', 'お釣り',
      '上記正に領収いたしました',
    ],
    exclude: [
      '自社発行の領収書 → receipt_issued',
      '「領収書在中」の封筒のみ → non_journal',
    ],
    note: 'POS端末出力のレシート形式も含む',
  },

  // ─── 2. invoice_received（受取請求書） ───
  {
    type: 'invoice_received',
    label: '受取請求書',
    keywords: [
      '請求書', '御請求書', 'ご請求書',
      '納品書兼請求書',
      '下記の通りご請求申し上げます',
      'お支払期限', '振込先',
      'インボイス番号', 'T+13桁',
    ],
    exclude: [
      '自社発行の請求書 → invoice_issued',
      '見積書 → supplementary_doc',
      '納品書のみ（請求書表記なし） → supplementary_doc',
    ],
    note: '自社が支払い側となる請求書',
  },

  // ─── 3. tax_payment（納付書） ───
  {
    type: 'tax_payment',
    label: '納付書',
    keywords: [
      '納付書', '納付済通知書', '領収済通知書',
      '法人税', '消費税', '源泉所得税', '住民税', '事業税',
      '税務署', '都道府県税事務所', '市区町村',
      '金融機関の受付印', '収納印',
    ],
    exclude: [
      '納税通知書（「いくら払え」の通知） → supplementary_doc',
      '源泉徴収票 → supplementary_doc',
      '予定納税通知書 → supplementary_doc',
      '確定申告書 → non_journal',
    ],
    note: '支払済みの納付書のみ。金融機関の受付印・収納印があることが判定ポイント',
  },

  // ─── 4. journal_voucher（振替伝票） ───
  {
    type: 'journal_voucher',
    label: '振替伝票',
    keywords: [
      '振替伝票',
      '借方', '貸方',
      '伝票番号', '起票日',
    ],
    exclude: [
      '入金伝票・出金伝票 → supplementary_doc',
      '銀行の振替依頼書 → bank_statement',
    ],
    note: '社内の振替処理を記録する伝票',
  },

  // ─── 5. bank_statement（通帳・銀行明細） ───
  {
    type: 'bank_statement',
    label: '通帳・銀行明細',
    keywords: [
      '普通預金', '当座預金', '定期預金',
      '通帳', '取引明細', '入出金明細',
      'お支払金額', 'お預り金額', '差引残高',
      '銀行名', '支店名',
    ],
    exclude: [
      '残高証明書 → supplementary_doc',
      '口座振替結果通知 → supplementary_doc',
      '銀行の手数料領収書 → receipt',
      'クレジットカードの引落通知 → supplementary_doc',
    ],
    note: '通帳ページの罫線形式（日付・摘要・お支払金額・お預り金額・差引残高）',
  },

  // ─── 6. credit_card（クレカ明細） ───
  {
    type: 'credit_card',
    label: 'クレカ明細',
    keywords: [
      'クレジットカード利用明細', 'カードご利用明細',
      'ご利用日', 'ご利用先', 'ご利用金額',
      'カード番号',
      'お支払額', 'リボ払い', '分割払い',
    ],
    exclude: [
      'クラウド利用明細（AWS・Google Cloud等） → supplementary_doc',
      'SaaS（Slack・Zoom等）の請求書 → invoice_received',
      'ポイント明細 → non_journal',
      'カード年会費領収書 → receipt',
    ],
    note: 'クレジットカード会社が発行した利用明細のみ',
  },

  // ─── 7. cash_ledger（現金出納帳） ───
  {
    type: 'cash_ledger',
    label: '現金出納帳',
    keywords: [
      '現金出納帳', '小口現金出納帳',
      '入金', '出金', '残高',
    ],
    exclude: [
      '通帳 → bank_statement',
      'レジ精算レポート → supplementary_doc',
    ],
    note: '現金の入出金を記録した帳簿',
  },

  // ─── 8. supplementary_doc（仕訳補助資料） ───
  {
    type: 'supplementary_doc',
    label: '仕訳補助資料',
    keywords: [
      // 契約・固定条件系
      '賃貸契約書', '賃貸借契約書', '不動産賃貸借契約書',
      '売買契約書', '不動産売買契約書',
      '業務委託契約書', '外注契約書',
      'リース契約書',
      '金銭消費貸借契約書', '借用書',
      'フランチャイズ契約書',
      '雇用契約書', '労働契約書',
      // 支払・請求の内訳補助
      '見積書', '御見積書',
      '納品書', // ※請求書表記がないもの
      '検収書',
      '発注書', '注文書', '注文請書',
      '支払明細書',
      '利用明細', // ※クラウド・SaaS
      'AWS利用明細', 'Google Cloud請求明細',
      '源泉徴収票',
      '法定調書', '支払調書',
      '納税通知書', '予定納税通知書',
      '年金保険料通知書',
      '口座振替結果通知書',
      // 不動産・物件系
      '物件別収支報告書',
      '管理報告書', '賃貸管理報告書',
      '修繕見積書', '修繕報告書',
      '入退去精算書',
      // 人件費・労務系
      '給与明細', '給料明細',
      '賞与計算書', '賞与明細',
      '勤怠データ', '勤怠表', 'タイムカード',
      '社会保険料通知書', '算定基礎届',
      '労働保険料通知書',
      // 固定資産・在庫
      '固定資産台帳',
      '減価償却計算書',
      '償却資産申告書',
      '棚卸表', '在庫表',
      '原価計算表',
      // 保険・金融
      '保険証券', '保険契約書',
      '保険満期通知書',
      '借入返済予定表', '返済明細',
      '配当金支払通知書',
      '残高証明書',
      '口座振替通知書',
      // 精算・報告
      '経費精算書', '立替精算書',
      '交通費精算書',
      '出張精算書',
      '旅費精算書',
      '収支報告書', '収支計算書',
      // その他
      '助成金交付決定通知書', '補助金交付決定通知書',
      '通関書類', '輸入許可通知書',
      '車検証',
      '登記簿謄本', // ※不動産取得時
      'レジ精算レポート',
      '入金伝票', '出金伝票',
    ],
    exclude: [
      '「領収書」の表記がある → receipt',
      '「請求書」の表記がある → invoice_received',
      '「納付書」で受付印あり → tax_payment',
      '通帳の取引明細 → bank_statement',
      'クレジットカード利用明細 → credit_card',
      '名刺・メモ・手紙 → non_journal',
    ],
    note: '上記7種（receipt〜cash_ledger）に該当しないが、仕訳の根拠・補助資料となる書類。取引情報（金額・日付・取引先等）が記載されている',
  },

  // ─── 9. invoice_issued（発行請求書） ───
  {
    type: 'invoice_issued',
    label: '発行請求書',
    keywords: [
      '請求書', // ※自社名が発行者欄にある
      '御中',
      '下記の通りご請求申し上げます',
    ],
    exclude: [
      '取引先から受け取った請求書 → invoice_received',
    ],
    note: '自社が取引先に発行した請求書。⚠現在、自社名をAIに渡していないため精度が低い',
  },

  // ─── 10. receipt_issued（発行領収書） ───
  {
    type: 'receipt_issued',
    label: '発行領収書',
    keywords: [
      '領収書', // ※自社名が発行者欄にある
      '上記正に領収いたしました',
    ],
    exclude: [
      '取引先から受け取った領収書 → receipt',
    ],
    note: '自社が取引先に発行した領収書。⚠自社名の情報がないため精度が低い',
  },

  // ─── 11. non_journal（仕訳対象外） ───
  {
    type: 'non_journal',
    label: '仕訳対象外',
    keywords: [
      '名刺',
      'メモ', '付箋',
      '手紙', '挨拶状', '年賀状',
      '謄本', // ※会社設立時を除く
      '定款',
      'パンフレット', 'カタログ',
      'チラシ', '広告',
      'マニュアル', '取扱説明書',
      '確定申告書',
      '議事録',
      'ポイント明細',
      'IDカード', '社員証',
    ],
    exclude: [
      '金額・日付・取引先の情報がある書類 → 他カテゴリを検討',
      '登記簿謄本（不動産取得時） → supplementary_doc',
    ],
    note: '仕訳不要の書類。取引情報が含まれていない、または仕訳の根拠にならない書類',
  },

  // ─── 12. other（その他） ───
  {
    type: 'other',
    label: 'その他',
    keywords: [
      '判別不能な画像',
      '文字が読み取れない画像',
      '証票以外の写真',
    ],
    exclude: [
      '少しでも取引情報が読み取れる → 他カテゴリを検討',
    ],
    note: '上記11種のいずれにも該当しない。判断できない場合のフォールバック',
  },
];

// ============================================================
// 紛らわしい境界の判定ガイド
// ============================================================

export const BOUNDARY_GUIDES: BoundaryGuide[] = [
  {
    document: '納税通知書',
    wrongType: 'tax_payment',
    correctType: 'supplementary_doc',
    reason: '受付印・収納印がない。「いくら払え」の通知であり、支払済みの納付書ではない',
  },
  {
    document: 'クラウド利用明細（AWS・Google Cloud等）',
    wrongType: 'credit_card',
    correctType: 'supplementary_doc',
    reason: 'カード会社発行ではない。サービス提供者が発行した利用明細',
  },
  {
    document: '源泉徴収票',
    wrongType: 'tax_payment',
    correctType: 'supplementary_doc',
    reason: '納付書ではない。年末調整結果の報告書',
  },
  {
    document: '納品書（請求書表記なし）',
    wrongType: 'invoice_received',
    correctType: 'supplementary_doc',
    reason: '「請求書」の表記がない。納品確認のみの書類',
  },
  {
    document: '見積書',
    wrongType: 'non_journal',
    correctType: 'supplementary_doc',
    reason: '取引情報あり。請求書なしで仕訳根拠になるケースが多い',
  },
  {
    document: '残高証明書',
    wrongType: 'bank_statement',
    correctType: 'supplementary_doc',
    reason: '取引明細ではない。特定日の残高のみを証明する書類',
  },
  {
    document: 'レジ精算レポート',
    wrongType: 'receipt',
    correctType: 'supplementary_doc',
    reason: '領収書ではない。店舗側の精算記録',
  },
  {
    document: '口座振替結果通知',
    wrongType: 'bank_statement',
    correctType: 'supplementary_doc',
    reason: '通帳ではない。振替結果の通知書',
  },
  {
    document: '保険料控除証明書',
    wrongType: 'receipt',
    correctType: 'supplementary_doc',
    reason: '領収書ではない。年末調整用の証明書',
  },
  {
    document: 'カード年会費領収書',
    wrongType: 'credit_card',
    correctType: 'receipt',
    reason: 'カード利用明細ではなく領収書形式',
  },
];

// ============================================================
// プロンプト生成ユーティリティ
// ============================================================

/**
 * キーワード定義をプロンプト用テキストに変換
 * classify.service.ts のSYSTEM_INSTRUCTIONに結合する
 */
export function buildKeywordsPrompt(): string {
  // 判定基準テーブル
  let text = `## 証票種別（source_type）判定基準\n\n`;
  text += `| source_type | 判定キーワード | 除外（該当しない） |\n|---|---|---|\n`;

  for (const st of SOURCE_TYPE_KEYWORDS) {
    const kw = st.keywords.slice(0, 5).join('、'); // 主要5件
    const ex = st.exclude.length > 0 ? st.exclude.join('／') : '-';
    const suffix = st.type === 'supplementary_doc' ? '（詳細は下記参照）' : '';
    text += `| ${st.type} | ${kw}${suffix} | ${ex} |\n`;
  }

  // supplementary_doc詳細
  const suppDoc = SOURCE_TYPE_KEYWORDS.find(st => st.type === 'supplementary_doc');
  if (suppDoc) {
    text += `\n## supplementary_doc詳細（仕訳補助資料）\n`;
    text += `${suppDoc.note}\n\n`;
    text += `### 判定キーワード一覧\n`;
    text += suppDoc.keywords.join('、') + '\n';
  }

  // 紛らわしい境界ガイド
  text += `\n## 紛らわしい境界の判定ガイド\n`;
  text += `以下の書類は誤判定しやすいため注意:\n`;
  for (const bg of BOUNDARY_GUIDES) {
    text += `- ${bg.document} → ${bg.wrongType}ではなく${bg.correctType}（${bg.reason}）\n`;
  }

  return text;
}
