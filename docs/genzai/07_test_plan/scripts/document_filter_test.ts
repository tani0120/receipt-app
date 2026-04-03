/**
 * document_filter テストスクリプト（T-00i 再設計版 2026-04-02）
 *
 * 目的: Geminiに「2分類 + 証票種類（11種）+ 仕訳方向」を質問し、精度とコストを測定する
 *       JSON抽出は一切行わない（金額・日付・科目等は聞かない）
 *
 * 使い方:
 *   # 通常実行
 *   npx tsx docs/genzai/07_test_plan/scripts/document_filter_test.ts --label draft_1
 *
 *   # ファイル確認のみ（API呼び出しなし）
 *   npx tsx docs/genzai/07_test_plan/scripts/document_filter_test.ts --label draft_1 --dry-run
 *
 * 前提:
 *   - gcloud auth application-default login 済み
 *   - src/scripts/test_results/document_filter/input/ に証票を配置済み
 *     構造例:
 *       input/receipt/          ← 領収書（自動仕訳対象）
 *       input/receipt_issued/   ← 発行領収書（手入力仕訳対象）
 *       input/invoice_received/ ← 受取請求書（自動仕訳対象）
 *       input/invoice_issued/   ← 発行請求書（手入力仕訳対象）
 *       input/tax_payment/      ← 納付書（自動仕訳対象）
 *       input/journal_voucher/  ← 振替伝票（自動仕訳対象）
 *       input/bank_statement/   ← 通帳・銀行明細（自動仕訳対象）
 *       input/credit_card/      ← クレカ明細（自動仕訳対象）
 *       input/cash_ledger/      ← 現金出納帳（自動仕訳対象）
 *       input/non_journal_test/ ← 仕訳対象外
 *       input/medical/          ← 医療費（仕訳対象外として判定されるか検証）
 *
 * 出力:
 *   src/scripts/test_results/document_filter/<label>/
 *     - 個別結果JSON（ファイルごと）
 *     - _summary.json（全件集計・正解率付き）
 */

import { VertexAI } from '@google-cloud/vertexai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { preprocessImage, getMimeType } from '../../../../src/scripts/pipeline/image_preprocessor';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// 設定
// ============================================================

const PROJECT_ID = 'sugu-suru';
const LOCATION = 'asia-northeast1';
// 注意: モデルIDはAPIバージョンによって変わる。動かない場合は以下を試す
//   'gemini-2.5-flash-preview-04-17'
//   'gemini-2.5-flash-001'
const MODEL_ID = 'gemini-2.5-flash';

// 入力・出力ディレクトリ（スクリプトから見た相対パス）
// __dirname = docs/genzai/07_test_plan/scripts/ → 4階層上でプロジェクトルート
const INPUT_DIR = path.resolve(
  __dirname,
  '../../../../src/scripts/test_results/document_filter/input'
);
const OUTPUT_BASE = path.resolve(
  __dirname,
  '../../../../src/scripts/test_results/document_filter'
);

// 料金定数（USD / 100万tokens）
const PRICE = {
  prompt_per_million: 0.30,
  completion_per_million: 2.50,
  thinking_per_million: 2.50,
} as const;

const SUPPORTED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.heic', '.pdf',
]);

// ============================================================
// 証票種類11種 + 仕訳対象外（2026-04-02 再設計。source_type_redesign_checklist.md 準拠）
// ============================================================

type JournalableType =
  // ── 自動仕訳対象（7種）──
  | 'receipt'           // 領収書・レシート
  | 'invoice_received'  // 受取請求書（仕入・経費）
  | 'tax_payment'       // 納付書（税金・社会保険）
  | 'journal_voucher'   // 振替伝票・入出金伝票
  | 'bank_statement'    // 通帳・銀行明細
  | 'credit_card'       // クレカ・Pay・スマホ決済明細
  | 'cash_ledger'       // 現金出納帳
  // ── 手入力仕訳対象（2種）──
  | 'invoice_issued'    // 発行請求書（自社が発行。摘要は人間入力）
  | 'receipt_issued'    // 発行領収書（自社が発行。摘要は人間入力）
  // ── 仕訳対象外（2種）──
  | 'non_journal'       // 仕訳対象外（見積書・名刺・メモ・医療費等）
  | 'other';            // 判別不能（AI分類失敗時のフォールバック）

// 2分類（2026-04-02 再設計: medicalを削除。医療費は全てnon_journalable）
type Classification = 'journalable' | 'non_journalable';
type DirectionType = 'expense' | 'income' | 'transfer' | 'mixed' | null;

// vendor_vector 66種（T-P3テスト用。vendor.type.ts準拠）
type VendorVector =
  | 'restaurant' | 'cafe'
  | 'food_market' | 'supermarket' | 'convenience_store' | 'general_goods' | 'souvenir'
  | 'drugstore' | 'apparel' | 'cosmetics' | 'books' | 'electronics' | 'bicycle'
  | 'sports_goods' | 'media_disc' | 'jewelry' | 'florist' | 'auto_dealer' | 'auto_parts'
  | 'building_materials' | 'stationery'
  | 'beauty' | 'printing' | 'advertising' | 'post_office' | 'waste' | 'it_service'
  | 'telecom_saas' | 'education' | 'outsourcing' | 'lease_rental' | 'staffing'
  | 'camera_dpe' | 'funeral' | 'platform' | 'ec_site' | 'logistics' | 'consulting'
  | 'legal_firm' | 'construction'
  | 'real_estate' | 'insurance'
  | 'entertainment' | 'leisure' | 'cinema_music' | 'spa' | 'travel_agency'
  | 'gas_station' | 'taxi' | 'rental_car' | 'train' | 'bus' | 'highway'
  | 'airline_ship' | 'parking' | 'hotel'
  | 'utility' | 'government' | 'social_insurance' | 'medical' | 'religious'
  | 'financial'
  | 'individual' | 'wholesale' | 'association' | 'unknown';

// ファイル別期待値（D-1統合: 旧FOLDER_EXPECTED + 旧FILE_EXPECTEDを1箇所に統合）
// キー = "フォルダ/ファイル名"。全ファイルの全期待値をここに集約。
interface FileExpected {
  classification: Classification;
  source_type: JournalableType;
  direction: DirectionType;
  t_number: string | null;
  phone: string | null;
  vendor_name: string | null;
  vendor_vector: VendorVector | null;
  is_multiple?: boolean;  // 複数証票検出テスト用
}

const FILE_EXPECTED: Record<string, FileExpected> = {
  // ── bank_statement（5件）── classification: journalable, source_type: bank_statement, direction: mixed
  'bank_statement/Gemini_Generated_Image_e4ux9ae4ux9ae4ux.jpg': { classification: 'journalable', source_type: 'bank_statement', direction: 'mixed', t_number: null, phone: null, vendor_name: 'さかい銀行',   vendor_vector: 'financial' },
  'bank_statement/Gemini_Generated_Image_z3q2xrz3q2xrz3q2.jpg': { classification: 'journalable', source_type: 'bank_statement', direction: 'mixed', t_number: null, phone: null, vendor_name: 'さかい銀行',   vendor_vector: 'financial' },
  'bank_statement/ldi_bank_statement_mufj.jpg':                   { classification: 'journalable', source_type: 'bank_statement', direction: 'mixed', t_number: null, phone: null, vendor_name: '三菱UFJ銀行', vendor_vector: 'financial' },
  'bank_statement/ldi_bank_statement_v2.jpg':                     { classification: 'journalable', source_type: 'bank_statement', direction: 'mixed', t_number: null, phone: null, vendor_name: null,           vendor_vector: 'unknown' },
  'bank_statement/unnamed.jpg':                                    { classification: 'journalable', source_type: 'bank_statement', direction: 'mixed', t_number: null, phone: null, vendor_name: null,           vendor_vector: 'unknown' },
  // ── cash_ledger（1件）── classification: journalable, source_type: cash_ledger, direction: mixed
  'cash_ledger/Gemini_Generated_Image_1nnbal1nnbal1nnb.jpg':      { classification: 'journalable', source_type: 'cash_ledger', direction: 'mixed', t_number: null, phone: null, vendor_name: null,           vendor_vector: 'unknown' },
  // ── credit_card（2件）── classification: journalable, source_type: credit_card, direction: expense
  'credit_card/Gemini_Generated_Image_1j50gm1j50gm1j50.jpg':     { classification: 'journalable', source_type: 'credit_card', direction: 'expense', t_number: null, phone: null, vendor_name: 'さかいカード',   vendor_vector: 'financial' },
  'credit_card/unnamed (1).jpg':                                   { classification: 'journalable', source_type: 'credit_card', direction: 'expense', t_number: null, phone: null, vendor_name: 'Rakuten Card', vendor_vector: 'financial' },
  // ── invoice_issued（4件）── classification: journalable, source_type: invoice_issued, direction: income
  'invoice_issued/invoice_ldi_to_copp_180man.jpg':                 { classification: 'journalable', source_type: 'invoice_issued', direction: 'income', t_number: null, phone: '0722331234',  vendor_name: 'LDIデジタル', vendor_vector: 'it_service' },
  'invoice_issued/invoice_ldi_to_copp.jpg':                        { classification: 'journalable', source_type: 'invoice_issued', direction: 'income', t_number: null, phone: '02055535735', vendor_name: 'LDIデジタル', vendor_vector: 'it_service' },
  'invoice_issued/invoice_ldi_to_deckis.jpg':                      { classification: 'journalable', source_type: 'invoice_issued', direction: 'income', t_number: null, phone: '0205578890',  vendor_name: 'LDIデジタル', vendor_vector: 'it_service' },
  'invoice_issued/ldi_invoice_issued_550000.jpg':                  { classification: 'journalable', source_type: 'invoice_issued', direction: 'income', t_number: null, phone: '0312345678',  vendor_name: 'LDIデジタル', vendor_vector: 'it_service' },
  // ── invoice_received（3件）── classification: journalable, source_type: invoice_received, direction: expense
  'invoice_received/Gemini_Generated_Image_9zlx629zlx629zlx.jpg': { classification: 'journalable', source_type: 'invoice_received', direction: 'expense', t_number: null, phone: null,         vendor_name: 'クラウドソリューションズ', vendor_vector: 'it_service' },
  'invoice_received/Gemini_Generated_Image_y5mr82y5mr82y5mr.jpg': { classification: 'journalable', source_type: 'invoice_received', direction: 'expense', t_number: null, phone: '0722223344', vendor_name: '堺商事',                   vendor_vector: 'wholesale' },
  'invoice_received/unnamed (2).jpg':                              { classification: 'journalable', source_type: 'invoice_received', direction: 'expense', t_number: null, phone: null,         vendor_name: '田中商事',                 vendor_vector: 'unknown' },
  // ── journal_voucher（1件）── classification: journalable, source_type: journal_voucher, direction: income
  'journal_voucher/Gemini_Generated_Image_74rpwm74rpwm74rp.jpg':  { classification: 'journalable', source_type: 'journal_voucher', direction: 'income', t_number: null, phone: null, vendor_name: 'さかい銀行', vendor_vector: 'financial' },
  // ── medical（2件）── classification: non_journalable, source_type: non_journal, direction: null
  'medical/shinryouhi_ryoshusho_aichi.jpg':                        { classification: 'non_journalable', source_type: 'non_journal', direction: null, t_number: null, phone: null,         vendor_name: '愛知医科大学病院', vendor_vector: 'medical' },
  'medical/yakkyoku_ryoshusho_himawari.jpg':                       { classification: 'non_journalable', source_type: 'non_journal', direction: null, t_number: null, phone: '0206589500', vendor_name: 'ひまわり薬局',     vendor_vector: 'medical' },
  // ── non_journal_test（3件）── classification: non_journalable, source_type: non_journal, direction: null
  'non_journal_test/keiyakusho_torihiki_kihon.jpg':                { classification: 'non_journalable', source_type: 'non_journal', direction: null, t_number: null, phone: null,         vendor_name: null,                     vendor_vector: 'unknown' },
  'non_journal_test/meishi_sato_kenji.jpg':                        { classification: 'non_journalable', source_type: 'non_journal', direction: null, t_number: null, phone: '0205321230', vendor_name: 'ミライイノベーション', vendor_vector: 'unknown' },
  'non_journal_test/mitsumori_ldi_web.jpg':                        { classification: 'non_journalable', source_type: 'non_journal', direction: null, t_number: null, phone: '02012455788', vendor_name: 'LDIデジタル',             vendor_vector: 'it_service' },
  // ── receipt（9件）── classification: journalable, source_type: receipt, direction: expense
  'receipt/20250912_075642.jpg':                                   { classification: 'journalable', source_type: 'receipt', direction: 'expense', t_number: 'T2120001160795', phone: '0669478080', vendor_name: '鳥貴族',           vendor_vector: 'restaurant' },
  'receipt/20250912_075647.jpg':                                   { classification: 'journalable', source_type: 'receipt', direction: 'expense', t_number: 'T2120005015186', phone: '0725415860', vendor_name: '近畿陸運協会',     vendor_vector: 'association' },
  'receipt/Gemini_Generated_Image_ei4lt1ei4lt1ei4l.jpg':           { classification: 'journalable', source_type: 'receipt', direction: 'expense', t_number: null,              phone: '0908151138', vendor_name: '名店',             vendor_vector: 'restaurant' },
  'receipt/Gemini_Generated_Image_svipdjsvipdjsvip.jpg':           { classification: 'journalable', source_type: 'receipt', direction: 'expense', t_number: null,              phone: null,         vendor_name: 'サクラマート',     vendor_vector: 'convenience_store' },
  'receipt/receipt_05.jpg':                                        { classification: 'journalable', source_type: 'receipt', direction: 'expense', t_number: 'T6120001018791',  phone: '0723381866', vendor_name: '万代',             vendor_vector: 'supermarket' },
  'receipt/receipt_06.jpg':                                        { classification: 'journalable', source_type: 'receipt', direction: 'expense', t_number: 'T3120002069003',  phone: null,         vendor_name: '鳥貴族',           vendor_vector: 'restaurant' },
  'receipt/receipt_07.jpg':                                        { classification: 'journalable', source_type: 'receipt', direction: 'expense', t_number: 'T1010001190193',  phone: '0669663641', vendor_name: 'ベローチェ',       vendor_vector: 'cafe' },
  'receipt/receipt_08.jpg':                                        { classification: 'journalable', source_type: 'receipt', direction: 'expense', t_number: 'T1010001190193',  phone: '0669663641', vendor_name: 'ベローチェ',       vendor_vector: 'cafe' },
  // 複数証票: classification/source_type/directionはnon_journalable/non_journal/null
  'receipt/receipt_09.jpg':                                        { classification: 'non_journalable', source_type: 'non_journal', direction: null, t_number: null, phone: null, vendor_name: null, vendor_vector: null, is_multiple: true },
  // ── receipt_issued（2件）── classification: journalable, source_type: receipt_issued, direction: income
  'receipt_issued/ldi_receipt_issued_550000.jpg':                  { classification: 'journalable', source_type: 'receipt_issued', direction: 'income', t_number: null, phone: '0312345678',  vendor_name: 'LDIデジタル', vendor_vector: 'it_service' },
  'receipt_issued/receipt_ldi_to_copp_180man.jpg':                 { classification: 'journalable', source_type: 'receipt_issued', direction: 'income', t_number: null, phone: '01022383323', vendor_name: 'LDIデジタル', vendor_vector: 'it_service' },
  // ── tax_payment（1件）── classification: journalable, source_type: tax_payment, direction: expense
  'tax_payment/20250912_075627.jpg':                               { classification: 'journalable', source_type: 'tax_payment', direction: 'expense', t_number: null, phone: null, vendor_name: '堺市', vendor_vector: 'government' },
};

// ============================================================
// コマンドライン引数（事業者情報）
// ============================================================

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const labelIndex = process.argv.indexOf('--label');
if (labelIndex === -1 || !process.argv[labelIndex + 1]) {
  console.error(`使い方: npx tsx docs/genzai/07_test_plan/scripts/document_filter_test.ts \\
  --label <ラベル名> \\
  --company <顧問先名> \\
  [--company-kana <カナ>] \\
  [--representative <代表者名>] \\
  [--phone <電話番号>] \\
  [--fiscal-month <決算月>] \\
  [--dry-run]`);
  process.exit(1);
}
const RUN_LABEL = process.argv[labelIndex + 1] as string;
const companyIndex = process.argv.indexOf('--company');
if (companyIndex === -1 || !process.argv[companyIndex + 1]) {
  console.error('エラー: --company <顧問先名> が必須です。例: --company "株式会社LDIデジタル"');
  process.exit(1);
}
const COMPANY_NAME = process.argv[companyIndex + 1] as string;
const COMPANY_KANA = getArg('company-kana') ?? '';
const REPRESENTATIVE = getArg('representative') ?? '';
const PHONE = getArg('phone') ?? '';
const FISCAL_MONTH = getArg('fiscal-month') ?? '';
const DRY_RUN = process.argv.includes('--dry-run');

// 事業者情報ブロック（プロンプト埋め込み用）
const companyInfoLines = [
  `会社名: ${COMPANY_NAME}`,
  COMPANY_KANA ? `会社名（カナ）: ${COMPANY_KANA}` : null,
  REPRESENTATIVE ? `代表者名: ${REPRESENTATIVE}` : null,
  PHONE ? `電話番号: ${PHONE}` : null,
  FISCAL_MONTH ? `決算月: ${FISCAL_MONTH}月末日` : null,
].filter(Boolean).join('\n');

// ============================================================
// プロンプト（2026-04-03 v2: 顧問先情報の用途限定 + 対象外判断禁止）
// ============================================================

const SYSTEM_INSTRUCTION = `あなたは日本の会計事務所の受付係です。

## 大前提:
この書類は顧問先の経理書類の中から届いたものです。
書類に記載された会社名・個人名が誰であっても、全て顧問先の会計処理に関係する書類です。
「顧問先の書類ではない」「自社と無関係」という理由で non_journalable と判断することは禁止です。

届いた書類を見て、3つだけ判断してください。

1. この書類は仕訳が必要か？（2分類）
   ※ 書類の種類だけで判断すること。記載された会社名は使わない。
2. この書類は何か？（証票種類）
   ※ 請求書・領収書の「受取/発行」判別のみ、下記の顧問先情報を参照すること。
3. この書類のお金の流れの方向は？（仕訳方向）
   ※ 仕訳方向は顧問先の立場で判断すること。②の受取/発行の結果に従う。

それ以外の情報（金額・日付・科目等）は一切不要です。

## 顧問先情報（受取/発行の判別専用）:
以下の情報は「受取 vs 発行」の区別のみに使用すること。
仕訳対象/対象外の判定には絶対に使わないこと。

${companyInfoLines}`;

const REQUEST_PROMPT = `この書類を見て、以下のJSONだけを返してください。

{
  "classification": "journalable" | "non_journalable",
  "classification_reason": "判定理由（1文）",
  "source_type": "receipt" | "invoice_received" | "invoice_issued" | "receipt_issued" | "tax_payment" | "journal_voucher" | "bank_statement" | "credit_card" | "cash_ledger" | "non_journal" | "other",
  "source_type_label": "日本語名（例: 領収書、受取請求書、発行請求書、通帳）",
  "direction": "expense" | "income" | "transfer" | "mixed" | null,
  "direction_reason": "仕訳方向の判定理由（1文）",
  "confidence": 0.0〜1.0,
  "is_handwritten": true | false,
  "readability": "clear" | "partial" | "unreadable",
  "vendor_info": {
    "t_number": "T+13桁のインボイス登録番号。ハイフンなし。なければnull",
    "phone": "電話番号。ハイフンなし数字のみ。なければnull",
    "vendor_name": "発行者（取引先）の名称。なければnull",
    "vendor_vector": "業種ベクトル（66種から1つ選択）。不明ならunknown"
  }
}

## 分類ルール（classification）:
- journalable: 仕訳が必要な書類（自動仕訳対象 + 手入力仕訳対象の両方を含む）
- non_journalable: 仕訳不要（見積書、契約書、名刺、メモ、謄本、カタログ、議事録、給与明細、医療費領収書等）
  ※ 医療費（病院・薬局・クリニックの領収書）は全て non_journalable です

## 証票種類（source_type — 11種）:
| 値 | 日本語 | 処理区分 |
|---|---|---|
| receipt | 領収書・レシート（他社発行。自社が受け取った） | 自動仕訳 |
| invoice_received | 受取請求書（他社発行。自社が受け取った請求書） | 自動仕訳 |
| invoice_issued | 発行請求書（自社「${COMPANY_NAME}」が発行した請求書） | 手入力仕訳 |
| receipt_issued | 発行領収書（自社「${COMPANY_NAME}」が発行した領収書） | 手入力仕訳 |
| tax_payment | 納付書（税金・社会保険の納付書） | 自動仕訳 |
| journal_voucher | 振替伝票・入出金伝票 | 自動仕訳 |
| bank_statement | 通帳・銀行明細 | 自動仕訳 |
| credit_card | クレカ・Pay・スマホ決済明細 | 自動仕訳 |
| cash_ledger | 現金出納帳 | 自動仕訳 |
| non_journal | 仕訳対象外（上記以外の仕訳不要書類・医療費領収書） | 対象外 |
| other | 判別不能 | 対象外 |

## 受取 vs 発行の判定基準（顧問先情報の唯一の用途）:
- 顧問先情報は、請求書・領収書が「受取」か「発行」かを判別する目的のみに使う
- 書類の発行者が顧問先（${COMPANY_NAME}${COMPANY_KANA ? '／' + COMPANY_KANA : ''}）と一致 → invoice_issued / receipt_issued
- 書類の発行者が顧問先以外 → invoice_received / receipt
- 照合には会社名・カナ表記・代表者名・電話番号を総合的に使うこと${REPRESENTATIVE ? `
- 代表者「${REPRESENTATIVE}」個人名宛ての領収書も自社の書類として扱うこと` : ''}

⚠️ 禁止事項:
- 「顧問先の通帳ではない」「顧問先の納付書ではない」等の理由で non_journalable にしてはならない
- 請求書・領収書以外の書類（通帳・納付書・伝票等）の判定に顧問先情報を使ってはならない

## 仕訳方向（direction）:
| 値 | 意味 | 例 |
|---|---|---|
| expense | 出金（経費・仕入等） | 受取領収書、受取請求書、税金納付書 |
| income | 入金（売上・雑収入等） | 発行請求書・発行領収書（自社が発行した書類） |
| transfer | 振替（口座間移動等） | ATM入出金、口座間振替 |
| mixed | 入金・出金が混在 | 通帳（複数行で方向が異なる） |
| null | 仕訳対象外 | 見積書、契約書、医療費領収書等 |

## vendor_info抽出ルール:
- t_number: 書類に印字された「T」で始まる13桁の数字（インボイス登録番号）。ハイフンは除去して返すこと。なければnull
- phone: 書類に印字された電話番号。ハイフン・括弧・スペースを除去し数字のみで返すこと。なければnull
- vendor_name: 書類の発行者（店舗名・会社名）。支店名は含めず本体名のみ。なければnull
- vendor_vector: 発行者の業種を以下66種から1つ選択:
  飲食: restaurant（レストラン・居酒屋）, cafe（カフェ・喫茶店）
  小売: food_market, supermarket, convenience_store, general_goods, souvenir, drugstore, apparel, cosmetics, books, electronics, bicycle, sports_goods, media_disc, jewelry, florist, auto_dealer, auto_parts, building_materials, stationery
  サービス: beauty, printing, advertising, post_office, waste, it_service, telecom_saas, education, outsourcing, lease_rental, staffing, camera_dpe, funeral, platform, ec_site, logistics, consulting, legal_firm, construction
  不動産・保険: real_estate, insurance
  スポーツ・娯楽: entertainment, leisure, cinema_music, spa, travel_agency
  交通: gas_station, taxi, rental_car, train, bus, highway, airline_ship, parking, hotel
  公共: utility, government, social_insurance, medical, religious
  金融: financial
  その他: individual, wholesale, association, unknown`;

// ============================================================
// 型定義
// ============================================================

interface VendorInfoResult {
  t_number: string | null;
  phone: string | null;
  vendor_name: string | null;
  vendor_vector: string | null;
}

interface FilterResult {
  classification: Classification;
  classification_reason: string;
  source_type: JournalableType;
  source_type_label: string;
  direction: DirectionType;
  direction_reason: string;
  confidence: number;
  is_handwritten: boolean;
  readability: 'clear' | 'partial' | 'unreadable';
  vendor_info: VendorInfoResult;
}

interface TestResult {
  file: string;
  folder: string;
  expected: FileExpected | null;
  is_multiple_documents: boolean;
  is_classification_correct: boolean | null;
  is_source_type_correct: boolean | null;
  is_direction_correct: boolean | null;
  is_t_number_correct: boolean | null;
  is_phone_correct: boolean | null;
  is_vendor_name_correct: boolean | null;
  is_vendor_vector_correct: boolean | null;
  filter: FilterResult;
  metadata: {
    duration_ms: number;
    prompt_tokens: number;
    completion_tokens: number;
    thinking_tokens: number;
    cost_jpy: number;
  };
}

// ============================================================
// ユーティリティ
// ============================================================

function calcCostJpy(prompt: number, completion: number, thinking: number): number {
  const usd =
    (prompt / 1_000_000) * PRICE.prompt_per_million +
    (completion / 1_000_000) * PRICE.completion_per_million +
    (thinking / 1_000_000) * PRICE.thinking_per_million;
  return Math.round(usd * 150 * 100) / 100;
}

/**
 * 取引先名正規化関数（T-N1c相当）
 * テストの部分一致判定とパイプラインの取引先照合で共通使用を想定
 *
 * ルール:
 *   1. 法人格除去: 株式会社, (株), 有限会社, (有), 合同会社, 一般社団法人, 一般財団法人 等
 *   2. 全角英数 → 半角英数
 *   3. 半角カナ → 全角カナ（将来実装。現在はスキップ）
 *   4. 記号除去: ・（中点）, -（ハイフン）, スペース, (), 「」
 *   5. 小文字化（英字のみ）
 *   6. 前後トリム + 連続スペース圧縮
 */
function normalizeVendorName(name: string | null): string {
  if (!name) return '';
  let s = name;
  // 1. 法人格除去
  s = s.replace(/(?:株式会社|有限会社|合同会社|一般社団法人|一般財団法人|特定非営利活動法人|医療法人|社会福祉法人)/g, '');
  s = s.replace(/[（(]株[）)]/g, '');
  s = s.replace(/[（(]有[）)]/g, '');
  s = s.replace(/[（(]合[）)]/g, '');
  // 2. 全角英数 → 半角英数
  s = s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
  // 3. 記号除去: 中点・ハイフン・スペース・括弧
  s = s.replace(/[・\-\s　()（）「」]/g, '');
  // 4. 小文字化
  s = s.toLowerCase();
  return s;
}

/** サブフォルダを再帰的に探索し、対象ファイルを返す */
function collectFiles(dir: string): Array<{ filePath: string; folder: string }> {
  const results: Array<{ filePath: string; folder: string }> = [];

  function walk(current: string, folder: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, entry.name);
      } else if (SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        results.push({ filePath: fullPath, folder });
      }
    }
  }

  walk(dir, '');
  return results.sort((a, b) => {
    const folderCmp = a.folder.localeCompare(b.folder);
    return folderCmp !== 0 ? folderCmp : a.filePath.localeCompare(b.filePath);
  });
}

// ============================================================
// メイン処理（1ファイル）
// ============================================================

async function processOneFile(
  vertexAI: VertexAI,
  entry: { filePath: string; folder: string },
  index: number,
  total: number,
): Promise<TestResult> {
  const { filePath, folder } = entry;
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const displayName = folder ? `${folder}/${fileName}` : fileName;

  console.log(`\n[${index + 1}/${total}] ${displayName}`);

  // 画像読込 + 前処理（リサイズ・EXIF回転・コントラスト補正）
  const fileData = fs.readFileSync(filePath);
  const mime = getMimeType(filePath);
  const preprocessed = await preprocessImage(fileData, mime);
  const base64 = preprocessed.base64;
  const mimeType = preprocessed.mimeType;

  // 前処理の適用状況をログ出力
  const steps = [
    preprocessed.applied.exifRotation ? 'EXIF回転' : null,
    preprocessed.applied.resize
      ? `縮小(${preprocessed.originalSize.width}→${preprocessed.processedSize.width}px)`
      : null,
    preprocessed.applied.contrast ? 'コントラスト補正' : null,
  ].filter(Boolean);
  if (steps.length > 0) {
    console.log(`   [前処理] ${steps.join(' / ')}`);
  }

  const model = vertexAI.getGenerativeModel({
    model: MODEL_ID,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0,
    },
  });

  const startTime = Date.now();

  const response = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: REQUEST_PROMPT },
      ],
    }],
  });

  const duration = Date.now() - startTime;
  const candidate = response.response.candidates?.[0];
  const usage = response.response.usageMetadata;
  const promptTokens = usage?.promptTokenCount ?? 0;
  const completionTokens = usage?.candidatesTokenCount ?? 0;
  const thinkingTokens = (usage as Record<string, unknown>)?.thoughtsTokenCount as number ?? 0;
  const costJpy = calcCostJpy(promptTokens, completionTokens, thinkingTokens);

  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) throw new Error('レスポンスが空');

  let filter: FilterResult;
  let isMultipleDocuments = false;
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      // 複数証票検出: Geminiが配列を返した = 画像に2枚以上の証票がある
      isMultipleDocuments = true;
      filter = parsed[0] as FilterResult; // 暫定: 先頭要素を使用
      console.log(`   ⚠️ 複数証票検出（MULTIPLE_DOCUMENTS）: ${parsed.length}枚の証票が検出されました`);
    } else {
      filter = parsed as FilterResult;
    }
  } catch {
    console.error(`   JSON解析失敗: ${text.substring(0, 200)}`);
    throw new Error('JSON解析失敗');
  }

  // 複数証票の追加検出: vendor_info内に異なるT番号/電話/取引先名が2つ以上
  if (!isMultipleDocuments && filter.vendor_info) {
    const vi_check = filter.vendor_info;
    // T番号やvendor_nameにパイプ区切りや改行区切りで複数値が入っている場合
    const hasMultiT = vi_check.t_number && /[|,\n]/.test(vi_check.t_number);
    const hasMultiPhone = vi_check.phone && /[|,\n]/.test(vi_check.phone);
    const hasMultiName = vi_check.vendor_name && /[|,\n]/.test(vi_check.vendor_name);
    if (hasMultiT || hasMultiPhone || hasMultiName) {
      isMultipleDocuments = true;
      console.log(`   ⚠️ 複数証票検出（MULTIPLE_DOCUMENTS）: vendor_info内に複数の取引先情報が含まれています`);
    }
  }

  // 期待値・正解判定（D-1統合: FILE_EXPECTEDのみ参照）
  const expected = FILE_EXPECTED[displayName] ?? null;
  const skipVendorEval = expected?.is_multiple ?? false;

  // 複数証票の場合: Geminiの分類を上書き
  const effectiveClassification = isMultipleDocuments ? 'non_journalable' as Classification : filter.classification;
  const effectiveSourceType = isMultipleDocuments ? 'non_journal' as JournalableType : filter.source_type;
  const effectiveDirection = isMultipleDocuments ? null as DirectionType : filter.direction;

  const isClassificationCorrect = expected
    ? effectiveClassification === expected.classification
    : null;
  const isSourceTypeCorrect = expected
    ? effectiveSourceType === expected.source_type
    : null;
  const isDirectionCorrect = expected && expected.direction !== undefined
    ? effectiveDirection === expected.direction
    : null;

  // vendor_info正解判定（T-P3）
  const vi = filter.vendor_info ?? { t_number: null, phone: null, vendor_name: null, vendor_vector: null };
  // D-2修正: null同士の比較も正解として計算に含める（全フィールド統一）
  const normT = (s: string | null) => s ? s.replace(/[-\s]/g, '').toUpperCase() : null;
  const isTNumberCorrect = expected && !skipVendorEval
    ? normT(vi.t_number) === normT(expected.t_number)
    : null;
  const normPhone = (s: string | null) => s ? s.replace(/[-()\s]/g, '') : null;
  const isPhoneCorrect = expected && !skipVendorEval
    ? normPhone(vi.phone) === normPhone(expected.phone)
    : null;
  // D-4修正: 正規化後の双方向部分一致（短い方が長い方に含まれていれば正解）
  const isVendorNameCorrect = (() => {
    if (!expected || skipVendorEval) return null;
    const a = normalizeVendorName(vi.vendor_name);
    const b = normalizeVendorName(expected.vendor_name);
    if (a === '' && b === '') return true; // 両方null → 正解
    if (a === '' || b === '') return false; // 片方のみnull → 不正解
    return a.includes(b) || b.includes(a);
  })();
  const isVendorVectorCorrect = expected && !skipVendorEval
    ? vi.vendor_vector === expected.vendor_vector
    : null;

  // コンソール出力
  const icon = filter.classification === 'journalable' ? '✅' : '❌';
  const correctMark = isClassificationCorrect === null ? '（期待値なし）'
    : isClassificationCorrect ? '⭕' : `✗ 期待: ${expected?.classification}`;
  const sourceCorrect = isSourceTypeCorrect === null ? ''
    : isSourceTypeCorrect ? ' ⭕' : ` ✗期待:${expected?.source_type}`;
  const dirCorrect = isDirectionCorrect === null ? ''
    : isDirectionCorrect ? ' ⭕' : ` ✗期待:${expected?.direction}`;

  console.log(`   ${icon} ${filter.classification} ${correctMark}`);
  console.log(`   証票: ${filter.source_type_label}（${filter.source_type}）${sourceCorrect}`);
  console.log(`   方向: ${filter.direction ?? 'null'}${dirCorrect}`);
  console.log(`   方向理由: ${filter.direction_reason ?? '—'}`);
  console.log(`   信頼度: ${filter.confidence} | 読取: ${filter.readability} | 手書き: ${filter.is_handwritten}`);
  console.log(`   理由: ${filter.classification_reason}`);
  // vendor_info出力（T-P3）
  console.log(`   --- vendor_info ---`);
  console.log(`   T番号: ${vi.t_number ?? 'null'} ${isTNumberCorrect === null ? '' : isTNumberCorrect ? '⭕' : `✗期待:${expected?.t_number}`}`);
  console.log(`   電話: ${vi.phone ?? 'null'} ${isPhoneCorrect === null ? '' : isPhoneCorrect ? '⭕' : `✗期待:${expected?.phone}`}`);
  console.log(`   取引先: ${vi.vendor_name ?? 'null'} ${isVendorNameCorrect === null ? '' : isVendorNameCorrect ? '⭕' : `✗期待:${expected?.vendor_name}`}`);
  console.log(`   業種VV: ${vi.vendor_vector ?? 'null'} ${isVendorVectorCorrect === null ? '' : isVendorVectorCorrect ? '⭕' : `✗期待:${expected?.vendor_vector}`}`);
  console.log(`   トークン: 入力=${promptTokens} 出力=${completionTokens} 思考=${thinkingTokens} | ${costJpy}円`);
  console.log(`   処理時間: ${(duration / 1000).toFixed(1)}秒`);

  return {
    file: displayName,
    folder,
    expected,
    is_multiple_documents: isMultipleDocuments,
    is_classification_correct: isClassificationCorrect,
    is_source_type_correct: isSourceTypeCorrect,
    is_direction_correct: isDirectionCorrect,
    is_t_number_correct: isTNumberCorrect,
    is_phone_correct: isPhoneCorrect,
    is_vendor_name_correct: isVendorNameCorrect,
    is_vendor_vector_correct: isVendorVectorCorrect,
    filter,
    metadata: {
      duration_ms: duration,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      thinking_tokens: thinkingTokens,
      cost_jpy: costJpy,
    },
  };
}

// ============================================================
// main
// ============================================================

async function main() {
  console.log('='.repeat(60));
  console.log('document_filter + vendor_info テスト（T-P3）');
  console.log(`ラベル: ${RUN_LABEL}${DRY_RUN ? ' [DRY-RUN]' : ''}`);
  console.log('='.repeat(60));

  // 入力ディレクトリ確認
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`入力ディレクトリがありません: ${INPUT_DIR}`);
    process.exit(1);
  }

  const entries = collectFiles(INPUT_DIR);

  if (entries.length === 0) {
    console.error('テストファイルが0件です。各サブフォルダに証票ファイルを配置してください（T-00j）');
    process.exit(1);
  }

  console.log(`\n入力: ${entries.length}件`);
  entries.forEach(e => {
    const displayName = e.folder ? `${e.folder}/${path.basename(e.filePath)}` : path.basename(e.filePath);
    const expected = FILE_EXPECTED[displayName];
    const tag = expected
      ? `[期待: ${expected.classification} / ${expected.source_type}${expected.is_multiple ? '（複数証票）' : ''}]`
      : '[期待値なし]';
    console.log(`   ${displayName} ${tag}`);
  });

  if (DRY_RUN) {
    console.log('\n[DRY-RUN] ファイル確認のみ。API呼び出しは行いません。');
    return;
  }

  // 出力ディレクトリ
  const outputDir = path.join(OUTPUT_BASE, RUN_LABEL);
  fs.mkdirSync(outputDir, { recursive: true });

  // 全件処理
  const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
  const results: TestResult[] = [];
  const errors: Array<{ file: string; error: string }> = [];

  for (let i = 0; i < entries.length; i++) {
    try {
      const result = await processOneFile(vertexAI, entries[i]!, i, entries.length);
      results.push(result);

      // 個別結果保存（フォルダ名付きで重複しないファイル名に）
      const safeName = result.file.replace(/\//g, '_').replace(/\.[^.]+$/, '') + '_result.json';
      fs.writeFileSync(path.join(outputDir, safeName), JSON.stringify(result, null, 2), 'utf-8');
    } catch (err) {
      const displayName = entries[i]!.folder
        ? `${entries[i]!.folder}/${path.basename(entries[i]!.filePath)}`
        : path.basename(entries[i]!.filePath);
      console.error(`   エラー: ${displayName}: ${err}`);
      errors.push({ file: displayName, error: String(err) });
    }
  }

  // ============================================================
  // 集計
  // ============================================================

  console.log('\n' + '='.repeat(60));
  console.log('集計');
  console.log('='.repeat(60));

  const journalable    = results.filter(r => r.filter.classification === 'journalable').length;
  const nonJournalable = results.filter(r => r.filter.classification === 'non_journalable').length;

  // 正解率（期待値ありのファイルのみ）
  const evalTargets = results.filter(r => r.is_classification_correct !== null);
  const classificationCorrect = evalTargets.filter(r => r.is_classification_correct).length;
  const sourceTypeCorrect = evalTargets.filter(r => r.is_source_type_correct).length;
  const directionEvalTargets = results.filter(r => r.is_direction_correct !== null);
  const directionCorrect = directionEvalTargets.filter(r => r.is_direction_correct).length;
  const classAccuracy = evalTargets.length > 0
    ? Math.round((classificationCorrect / evalTargets.length) * 1000) / 10
    : null;
  const sourceAccuracy = evalTargets.length > 0
    ? Math.round((sourceTypeCorrect / evalTargets.length) * 1000) / 10
    : null;
  const directionAccuracy = directionEvalTargets.length > 0
    ? Math.round((directionCorrect / directionEvalTargets.length) * 1000) / 10
    : null;

  const totalCostJpy = results.reduce((s, r) => s + r.metadata.cost_jpy, 0);
  const avgCostJpy   = results.length > 0 ? Math.round(totalCostJpy / results.length) : 0;
  const avgDurationMs = results.length > 0
    ? results.reduce((s, r) => s + r.metadata.duration_ms, 0) / results.length
    : 0;

  console.log(`\n2分類:`);
  console.log(`   仕訳対象（journalable）:      ${journalable}件`);
  console.log(`   仕訳対象外（non_journalable）: ${nonJournalable}件`);
  console.log(`   エラー:                        ${errors.length}件`);

  console.log(`\n精度（期待値ありの${evalTargets.length}件）:`);
  if (classAccuracy !== null) {
    console.log(`   分類正解率:   ${classificationCorrect}/${evalTargets.length} = ${classAccuracy}%`);
    console.log(`   証票種類正解: ${sourceTypeCorrect}/${evalTargets.length} = ${sourceAccuracy}%`);
    console.log(`   仕訳方向正解: ${directionCorrect}/${directionEvalTargets.length} = ${directionAccuracy}%`);
  } else {
    console.log(`   期待値ありのファイルが0件のため計算不可`);
  }

  console.log(`\n証票種類:`);
  const typeStats: Record<string, number> = {};
  for (const r of results) {
    const key = `${r.filter.source_type_label}（${r.filter.source_type}）`;
    typeStats[key] = (typeStats[key] ?? 0) + 1;
  }
  for (const [type, count] of Object.entries(typeStats)) {
    console.log(`   ${type}: ${count}件`);
  }

  // vendor_info精度（T-P3）
  const vendorEvalTargets = results.filter(r => r.is_t_number_correct !== null || r.is_vendor_vector_correct !== null);
  if (vendorEvalTargets.length > 0) {
    const tNumTargets = results.filter(r => r.is_t_number_correct !== null);
    const tNumCorrect = tNumTargets.filter(r => r.is_t_number_correct).length;
    const phoneTargets = results.filter(r => r.is_phone_correct !== null);
    const phoneCorrect = phoneTargets.filter(r => r.is_phone_correct).length;
    const nameTargets = results.filter(r => r.is_vendor_name_correct !== null);
    const nameCorrect = nameTargets.filter(r => r.is_vendor_name_correct).length;
    const vvTargets = results.filter(r => r.is_vendor_vector_correct !== null);
    const vvCorrect = vvTargets.filter(r => r.is_vendor_vector_correct).length;

    console.log(`\nvendor_info精度（T-P3。期待値ありの${vendorEvalTargets.length}件）:`);
    console.log(`   T番号正解:     ${tNumCorrect}/${tNumTargets.length} = ${tNumTargets.length > 0 ? Math.round(tNumCorrect / tNumTargets.length * 1000) / 10 : 0}%`);
    if (phoneTargets.length > 0) console.log(`   電話番号正解:   ${phoneCorrect}/${phoneTargets.length} = ${Math.round(phoneCorrect / phoneTargets.length * 1000) / 10}%`);
    console.log(`   取引先名正解:   ${nameCorrect}/${nameTargets.length} = ${nameTargets.length > 0 ? Math.round(nameCorrect / nameTargets.length * 1000) / 10 : 0}%`);
    console.log(`   業種VV正解:     ${vvCorrect}/${vvTargets.length} = ${vvTargets.length > 0 ? Math.round(vvCorrect / vvTargets.length * 1000) / 10 : 0}%`);
  }

  console.log(`\nコスト:`);
  console.log(`   総コスト: ${totalCostJpy}円`);
  console.log(`   1枚平均: ${(totalCostJpy / results.length).toFixed(2)}円`);
  console.log(`   平均処理時間: ${(avgDurationMs / 1000).toFixed(1)}秒`);

  // 不正解一覧
  const wrongResults = results.filter(r => r.is_classification_correct === false);
  if (wrongResults.length > 0) {
    console.log(`\n不正解（分類ミス）:`);
    for (const r of wrongResults) {
      console.log(`   ✗ ${r.file}`);
      console.log(`     期待: ${r.expected?.classification} / 実際: ${r.filter.classification}`);
      console.log(`     理由: ${r.filter.classification_reason}`);
    }
  }

  // サマリー保存
  const summary = {
    run: RUN_LABEL,
    timestamp: new Date().toISOString(),
    model: MODEL_ID,
    purpose: 'document_filter + vendor_info テスト（T-P3統合。分類+証票種類+方向+T番号+電話+取引先名+業種VV）',
    pricing_usd_per_million: PRICE,
    stats: {
      total: entries.length,
      success: results.length,
      errors: errors.length,
      journalable,
      non_journalable: nonJournalable,
    },
    accuracy: {
      eval_targets: evalTargets.length,
      classification_correct: classificationCorrect,
      classification_accuracy_pct: classAccuracy,
      source_type_correct: sourceTypeCorrect,
      source_type_accuracy_pct: sourceAccuracy,
      direction_eval_targets: directionEvalTargets.length,
      direction_correct: directionCorrect,
      direction_accuracy_pct: directionAccuracy,
    },
    vendor_info_accuracy: (() => {
      const tNumTargets = results.filter(r => r.is_t_number_correct !== null);
      const phoneTargets = results.filter(r => r.is_phone_correct !== null);
      const nameTargets = results.filter(r => r.is_vendor_name_correct !== null);
      const vvTargets = results.filter(r => r.is_vendor_vector_correct !== null);
      return {
        eval_targets: results.filter(r => r.expected !== null && !r.expected?.is_multiple).length,
        t_number: { correct: tNumTargets.filter(r => r.is_t_number_correct).length, total: tNumTargets.length },
        phone: { correct: phoneTargets.filter(r => r.is_phone_correct).length, total: phoneTargets.length },
        vendor_name: { correct: nameTargets.filter(r => r.is_vendor_name_correct).length, total: nameTargets.length },
        vendor_vector: { correct: vvTargets.filter(r => r.is_vendor_vector_correct).length, total: vvTargets.length },
      };
    })(),
    type_stats: typeStats,
    cost: {
      total_jpy: totalCostJpy,
      per_file_jpy: results.length > 0 ? Math.round(totalCostJpy / results.length * 100) / 100 : 0,
    },
    avg_duration_ms: avgDurationMs,
    results,
    errors,
  };

  fs.writeFileSync(
    path.join(outputDir, '_summary.json'),
    JSON.stringify(summary, null, 2),
    'utf-8'
  );
  console.log(`\n保存先: ${outputDir}`);
}

main().catch(err => {
  console.error('致命的エラー:', err);
  process.exit(1);
});
