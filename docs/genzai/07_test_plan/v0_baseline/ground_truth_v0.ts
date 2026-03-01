/**
 * 正解データ（Ground Truth）
 *
 * ═══════════════════════════════════════════════════════════
 * 前提条件（この条件下での正解）
 * ═══════════════════════════════════════════════════════════
 *
 * 【事業者情報】
 *   事業者名:
 *   ヨミカナ:
 *   事業者種別: 個人事業主（法人ではない）
 *   会計期間: 2025-01-01〜2025-12-31（暦年。個人は必ず1月-12月）
 *   源泉徴収義務: なし（社員0名の個人事業主）
 *   不動産所得: あり（住宅貸付 → 非課税売上）
 *
 * 【会計設定（12項目）】
 *   #1  会計ソフト:         MF
 *   #2  経理方式:           税込
 *   #3  計上基準:           期中現金
 *   #4  課税方式:           原則課税（課税事業者）
 *   #5  事業区分:           簡易1（原則課税のため不使用）
 *   #6  消費税端数処理:     切捨て
 *   #7  消費税適用特例:     なし
 *   #8  仕入税額控除方式:   個別対応方式
 *       ⚠️ 住宅貸付（非課税売上）があるため課税売上割合が95%を下回る可能性あり。
 *       ⚠️ ただし仕訳段階では影響しない（申告時に適用）。
 *   #9  経過措置計算:       適用する（免税事業者からの仕入 80%控除）
 *   #10 インボイス登録:     あり（適格請求書発行事業者）
 *   #11 標準決済手段:       現金（支払方法が不明な場合のデフォルト貸方科目）
 *   #12 部門管理:           あり
 *
 * 【業務ルール】
 *   宛名チェック: 証票の宛名が事業者名（ああああ）と異なる場合
 *     → is_not_applicable: true、entries: []（空配列）。仕訳を作成しない。
 *   飲食費判定基準: 1万円（2025年度改正済）
 *     → ≤1万円: MEETING、>1万円: ENTERTAINMENT
 *   医療費の取扱い: OWNER_DRAWING（事業外支出＝医療費控除）
 *     → MEDICAL_EXPENSEは使用不可
 *   源泉徴収義務: なし
 *     → 社員0名 → 税理士報酬も源泉不要 → 全額をFEES
 *   住宅貸付: RENTAL_INCOME + NON_TAXABLE_SALES
 *     → 住宅の貸付は消費税法上非課税
 *   私的支出: OWNER_DRAWING
 *   事業外入金: OWNER_INVESTMENT
 *   貸方デフォルト: CASH（支払方法不明時）
 *   福利厚生費: 社員0名なので使用不可
 *
 * 【勘定科目（30科目enum）】→ classify_schema.ts AccountCode参照
 *
 * 【税区分（8値enum）】
 *   TAXABLE_PURCHASE_10:    課税仕入10%（一般経費: 消耗品、通信、家賃等）
 *   TAXABLE_PURCHASE_8:     課税仕入8%（軽減: 飲食料品、定期購読新聞）
 *   NON_TAXABLE_PURCHASE:   非課税仕入（保険料、利息、土地代、行政手数料）
 *   OUT_OF_SCOPE_PURCHASE:  対象外・仕入（給与、税金、寄付金、慶弔）
 *   TAXABLE_SALES_10:       課税売上10%（一般売上）
 *   TAXABLE_SALES_8:        課税売上8%（軽減: 飲食料品売上）
 *   NON_TAXABLE_SALES:      非課税売上（有価証券譲渡、住宅貸付）
 *   OUT_OF_SCOPE_SALES:     対象外売上（配当金、損害賠償）
 *
 * ═══════════════════════════════════════════════════════════
 * 対応する検証フィールド
 * ═══════════════════════════════════════════════════════════
 *
 * 層A: Gemini出力（30項目のうち正解を定義可能な21項目）
 *   A1  voucher_type                → voucher_type
 *   A3  date                        → date
 *   A5  total_amount                → total_amount
 *   A7  issuer_name                 → issuer_name
 *   A9  issuer_branch               → issuer_branch
 *   A10 description                 → description（証票摘要）
 *   A11 payment_method              → payment_method
 *   A12 invoice_registration_number → invoice_registration_number
 *   A13 is_invoice_qualified        → is_invoice_qualified
 *   A14 tax_entries[]               → tax_entries[]
 *   A20 journal_entry_suggestions[] → entries[]（account, sub_account, tax_category, amount, description）
 *   A22 handwritten_flag             → handwritten_flag
 *   A23 handwritten_memo_content    → handwritten_memo_content
 *   A24 is_medical_expense          → is_medical_expense
 *   A25 is_not_applicable           → is_not_applicable
 *   A26 not_applicable_reason       → not_applicable_reason
 *   A27 has_multiple_vouchers       → has_multiple_vouchers
 *   A30 is_credit_card_payment      → is_credit_card_payment
 *
 * 自動導出（正解データ不要、他フィールドから計算）:
 *   A15 has_multiple_tax_rates  ← tax_entries[]に複数税率があるか
 *   A16 has_reduced_tax_rate    ← tax_entries[]に8%があるか
 *   A21 is_composite_transaction ← entries.length > 2
 *   A4  date_unreadable         ← 正解dateがnullかどうかで間接判定
 *   A6  amount_unreadable       ← 正解total_amountがnullかどうかで間接判定
 *   A8  issuer_unreadable       ← 正解issuer_nameがnullかどうかで間接判定
 *
 * 正解定義不可能（チェックレベル）:
 *   A2  voucher_type_confidence ← 正解値を定義できない（0.8以上かのみチェック）
 *   A17-A19 銀行推定            ← 通帳のみ。正解は定義可能だが別途対応
 *   A28 receipt_items[]         ← 商品明細。正解定義が膨大で優先度低
 *   A29 line_items[]            ← 通帳/カード明細行。同上
 *
 * 層B: 後処理（8項目）
 *   → コードロジック検証。正解データ不要（入力→出力のユニットテスト）
 *
 * ═══════════════════════════════════════════════════════════
 * 記入ガイド（各フィールドの判定基準）
 * ═══════════════════════════════════════════════════════════
 *
 * --- file ---
 * テスト画像のファイル名をそのまま記入（例: '1.pdf'）
 *
 * --- voucher_type (A1) ---
 * 画像の内容を見て7値から1つ選択:
 *   RECEIPT:        レシート・領収書（店舗が発行した支払証明）
 *   INVOICE:        請求書（支払を求める文書）
 *   TRANSPORT:      交通費（ICカード履歴、タクシー領収書等）
 *   CREDIT_CARD:    クレジットカード明細（カード会社発行の月次明細）
 *   BANK_STATEMENT: 口座取引履歴（通帳、ネットバンクの取引一覧）
 *   MEDICAL:        医療費（薬局・クリニック・病院の領収書）
 *   NOT_APPLICABLE: 仕訳対象外（料金表、名刺、メモ、謄本等）
 *
 * --- date (A3) ---
 * 画像上の日付をYYYY-MM-DD形式で記入。
 *   和暦の場合は西暦に変換（令和7年 = 2025年）。
 *   日付欄が存在しない場合: null
 *   日付欄はあるが読めない場合: null（notesに「読取不可」と記入）
 *   通帳等で複数日付がある場合: 一番目立つ日付 or null
 *
 * --- total_amount (A5) ---
 * 画像上の税込合計金額を数値で記入（1円単位）。
 *   税込金額が明記されている場合: その値
 *   税抜のみ記載の場合: 税込を計算（端数切捨て）
 *   金額欄が存在しない場合: null
 *   通帳等で複数金額がある場合: null（個別金額はentriesで記入）
 *
 * --- issuer_name (A7) ---
 * 発行者の正式名称を記入。
 *   「株式会社」「(株)」等は画像に記載されている通りに記入。
 *   判読できない場合: null（notesに「読取不可」と記入）
 *   発行者欄が存在しない場合: null
 *
 * --- issuer_branch (A9) ---
 * 「〇〇店」「〇〇支店」「〇〇営業所」等があれば記入。
 *   存在しない場合: null
 *
 * --- description (A10) ---
 * 取引内容の要約。20文字以内。推測は禁止。
 *   画像から読み取れる事実のみ記入。
 *   例: 'コーヒー購入', '税理士顧問料', '家賃支払'
 *   判断できない場合: null
 *
 * --- payment_method (A11) ---
 * 支払方法を6値から選択:
 *   CASH:          現金（「現金」表記、お釣り記載あり）
 *   CREDIT_CARD:   クレジットカード（カード番号、カード会社名）
 *   BANK_TRANSFER: 銀行振込（「振込」表記）
 *   E_MONEY:       電子マネー（Suica、PASMO、nanaco等）
 *   QR_PAY:        QR決済（PayPay、d払い等）
 *   OTHER:         その他
 *   null:          判別不能
 *
 * --- invoice_registration_number (A12) ---
 * 画像上のT番号をハイフンなしで記入（例: 'T6011001032554'）。
 *   T番号が見つからない場合: null
 *
 * --- is_invoice_qualified (A13) ---
 * T番号が画像上に存在する: true
 * T番号が存在しない: false
 *
 * --- tax_entries (A14) ---
 * 画像上の税率別内訳を記入。
 *   例: [{ rate: 10, taxable_amount: 1000, tax_amount: 100 }]
 *   軽減税率混在: [{ rate: 10, ... }, { rate: 8, ... }]
 *   税情報が画像にない場合: []（空配列）
 *   ⚠️ 端数処理: 切捨て（前提条件より）
 *
 * --- entries (A20) ---
 * 仕訳の正解を記入。以下の判断基準で各項目を決定:
 *
 *   entry_type: 'debit'（借方）or 'credit'（貸方）
 *
 *   account: 30科目enumから選択。判断基準:
 *     - 業務ルールを優先適用（医療費→OWNER_DRAWING、飲食1万円基準等）
 *     - 福利厚生費(WELFARE)は使用不可（社員0名）
 *     - MEDICAL_EXPENSEは使用不可（正解はOWNER_DRAWING）
 *     - 支払方法不明時の貸方はCASH
 *
 *   sub_account: 補助科目
 *     - 銀行名（例: '三井住友銀行'）
 *     - カード名（例: '楽天カード'）
 *     - 判別できない場合: null
 *
 *   tax_category: 8値enumから選択。判断基準:
 *     - 経費の仕入: 通常TAXABLE_PURCHASE_10、飲食料品はTAXABLE_PURCHASE_8
 *     - 保険料: NON_TAXABLE_PURCHASE
 *     - 税金・慶弔: OUT_OF_SCOPE_PURCHASE
 *     - 住宅貸付収入: NON_TAXABLE_SALES
 *     - 貸方（現金・預金等）の税区分: OUT_OF_SCOPE_PURCHASE
 *
 *   amount: 税込金額（数値）
 *     - 借方合計 = 貸方合計 であること（必須）
 *
 *   description: 仕訳摘要
 *     - 取引内容の要約。推測禁止。画像から読み取れる事実のみ。
 *     - 例: 'ドトール モーニング', 'XXX事務所 顧問料'
 *
 *   仕訳対象外（NOT_APPLICABLE）の場合: entries = []（空配列）
 *
 *   複合仕訳の場合: 全エントリを配列に並べる。
 *     借方1, 借方2, ..., 貸方1, 貸方2, ... の順序。
 *
 *   通帳（複数独立取引）の場合: 全取引のエントリをフラットに並べる。
 *     取引ごとにdebit→creditのペアで並べる。
 *
 * --- handwritten_flag (A22) ---
 * 手書き判定。3値から1つ選択:
 *   NONE:            手書き文字なし
 *   NON_MEANINGFUL:  チェックマーク、走り書き、無意味なメモ等
 *   MEANINGFUL:      金額修正、用途追記、日付修正等（会計的に意味のある手書き）
 * ℹ️ 角印・受領印・社判・スタンプは手書きに含めない。
 * ℹ️ 警告発火: MEANINGFULのみ（ラベル#10 MEMO_DETECTED）
 *
 * --- handwritten_memo_content (A23) ---
 * 手書きの内容を記入。読み取れた範囲で。
 * 手書きがない場合（NONE）: null
 *
 * --- is_medical_expense (A24) ---
 * 医療関連の証票（薬局、クリニック、病院）: true
 * それ以外: false
 *
 * --- is_not_applicable (A25) ---
 * 以下のいずれかに該当する場合: true
 *   - 仕訳対象外の証票（料金表、名刺、メモ等）
 *   - 宛名が事業者名（　　　）と異なる
 * 仕訳すべき証票: false
 *
 * ⚠️ 除外時の出力ルール（選択肢B）:
 *   is_not_applicable=true でも、OCR抽出結果は全て記入すること。
 *   - date（日付）, total_amount（税込合計）, issuer_name（発行者名）: 読み取った値
 *   - tax_entries（税率別明細）: 読み取った値
 *   - invoice_registration_number（T番号）, is_invoice_qualified（適格判定）: 読み取った値
 *   - payment_method（支払方法）, description（摘要）: 読み取った値
 *   - handwritten_flag（手書き判定）, is_credit_card_payment（クレカ判定）: 読み取った値
 *   - entries（仕訳候補）のみ []（空配列）にする
 *   理由: 除外された証票の情報を一覧UIで確認・管理するため。
 *         将来の除外ファイル管理UI（削除・移動・復帰）にも対応。
 *
 * --- not_applicable_reason (A26) ---
 * 対象外の理由を記入
 *   例: 'サービス料金表の説明資料'
 *   例: '宛名が事業者名と不一致（株式会社〇〇宛）'
 * 対象外でない場合: null
 *
 * --- has_multiple_vouchers (A27) ---
 * 1画像に2枚以上の証票が写っている: true
 * 1枚のみ: false
 *
 * ⚠️ 複数証票時の出力ルール:
 *   has_multiple_vouchers=true の場合、他のフィールドは全てnull/false/[]にする。
 *   - date（日付）: null（どの証票の日付か不明）
 *   - total_amount（税込合計）: null（同上）
 *   - issuer_name（発行者名）: null（同上）
 *   - tax_entries（税率別明細）: []（空配列）
 *   - entries（仕訳候補）: []（空配列）
 *   - 他のフィールドも全てnull/false
 *   理由: OCR結果がどの証票に対応するか判別不能。
 *         ラベルMULTIPLE_VOUCHERS（🔴赤）で人間に画像分割・再取込を促す。
 *   ※ is_not_applicable（対象外）とは異なる:
 *     対象外=1枚の証票のOCRは信頼できる→保持
 *     複数証票=OCR自体が曖昧→保持しない
 * --- is_credit_card_payment (A30) ---
 * カード会社ロゴ、「カード」テキスト、下4桁番号等がある: true
 * ない: false
 * ⚠️ voucher_typeとは独立。RECEIPTでもカード払いならtrue。
 *
 * --- notes ---
 * 判断に迷ったケースの根拠を記録。
 * 例: '飲食1万円以下のためMEETING', '手書きで「3月分」と記載あり'
 * 迷いがなければ空文字 ''
 */
import type { AccountCode, TaxCategory, VoucherType, PaymentMethod } from './classify_schema';

// ============================================================
// 型定義
// ============================================================

/** 税率別明細の正解 */
export interface GroundTruthTaxEntry {
  rate: number;           // 8 or 10
  taxable_amount: number; // 税抜額
  tax_amount: number;     // 消費税額
}

/** 仕訳エントリの正解 */
export interface GroundTruthEntry {
  entry_type: 'debit' | 'credit';
  account: AccountCode;            // 勘定科目（30科目enum）
  sub_account: string | null;      // 補助科目（銀行名、カード名等）
  tax_category: TaxCategory;       // 税区分（8値enum）
  amount: number;                  // 金額
  description: string;             // 仕訳摘要
}

/** 1件分の正解データ（検証計画A1-A30に対応） */
export interface GroundTruth {
  // === 識別 ===
  file: string;                                    // テスト画像ファイル名

  // === A1: 証票分類 ===
  voucher_type: VoucherType;                       // 7値enum

  // === A3: 日付 ===
  date: string | null;                             // YYYY-MM-DD（読取不可 or 欄なし = null）

  // === A5: 税込合計金額 ===
  total_amount: number | null;                     // 税込合計（欄なし = null）

  // === A7, A9: 発行者 ===
  issuer_name: string | null;                      // 発行者名
  issuer_branch: string | null;                    // 支店名・店舗名

  // === A10: 摘要（証票レベル） ===
  description: string | null;                      // 証票の摘要

  // === A11: 支払方法 ===
  payment_method: PaymentMethod | null;             // 6値enum + null

  // === A12-A13: 適格請求書 ===
  invoice_registration_number: string | null;       // T + 13桁
  is_invoice_qualified: boolean;                    // T番号あり = true

  // === A14: 税率別明細 ===
  tax_entries: GroundTruthTaxEntry[];               // 空配列 = 税情報なし

  // === A20: 仕訳候補 ===
  entries: GroundTruthEntry[];                      // 空配列 = 仕訳対象外

  // === A22-A23: 手書き判定 ===
  handwritten_flag: 'NONE' | 'NON_MEANINGFUL' | 'MEANINGFUL';
  handwritten_memo_content: string | null;

  // === A24: 医療費 ===
  is_medical_expense: boolean;

  // === A25-A26: 除外判定 ===
  is_not_applicable: boolean;
  not_applicable_reason: string | null;

  // === A27: 複数証票 ===
  has_multiple_vouchers: boolean;

  // === A30: クレジットカード払い ===
  is_credit_card_payment: boolean;

  // === メモ（判断理由。曖昧なケースの根拠を記録） ===
  notes: string;
}

