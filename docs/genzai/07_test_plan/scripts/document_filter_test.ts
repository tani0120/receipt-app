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

// フォルダ名 → 期待値マッピング（正解率計算に使用）
const FOLDER_EXPECTED: Record<string, { classification: Classification; source_type: JournalableType; direction: DirectionType } | null> = {
  // 自動仕訳対象（7種）
  'receipt':          { classification: 'journalable',     source_type: 'receipt',           direction: 'expense' },
  'invoice_received': { classification: 'journalable',     source_type: 'invoice_received',  direction: 'expense' },
  'tax_payment':      { classification: 'journalable',     source_type: 'tax_payment',       direction: 'expense' },
  'journal_voucher':  { classification: 'journalable',     source_type: 'journal_voucher',   direction: 'income' },
  'bank_statement':   { classification: 'journalable',     source_type: 'bank_statement',    direction: 'mixed' },
  'credit_card':      { classification: 'journalable',     source_type: 'credit_card',       direction: 'expense' },
  'cash_ledger':      { classification: 'journalable',     source_type: 'cash_ledger',       direction: 'mixed' },
  // 手入力仕訳対象（2種）
  'invoice_issued':   { classification: 'journalable',     source_type: 'invoice_issued',    direction: 'income' },
  'receipt_issued':   { classification: 'journalable',     source_type: 'receipt_issued',    direction: 'income' },
  // 仕訳対象外（2種）
  'non_journal_test': { classification: 'non_journalable', source_type: 'non_journal',       direction: null },
  'medical':          { classification: 'non_journalable', source_type: 'non_journal',       direction: null },
  // フォルダなし（input/直下）= 期待値なし → 正解率計算から除外
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
  "readability": "clear" | "partial" | "unreadable"
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
| null | 仕訳対象外 | 見積書、契約書、医療費領収書等 |`;

// ============================================================
// 型定義
// ============================================================

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
}

interface TestResult {
  file: string;
  folder: string;          // サブフォルダ名（期待値の参照に使用）
  expected: {
    classification: Classification;
    source_type: JournalableType;
    direction: DirectionType;
  } | null;                // フォルダマッピングがない場合はnull
  is_classification_correct: boolean | null;
  is_source_type_correct: boolean | null;
  is_direction_correct: boolean | null;
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
  return Math.round(usd * 150);
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
  try {
    filter = JSON.parse(text) as FilterResult;
  } catch {
    console.error(`   JSON解析失敗: ${text.substring(0, 200)}`);
    throw new Error('JSON解析失敗');
  }

  // 期待値・正解判定
  const expected = FOLDER_EXPECTED[folder] ?? null;
  const isClassificationCorrect = expected
    ? filter.classification === expected.classification
    : null;
  const isSourceTypeCorrect = expected
    ? filter.source_type === expected.source_type
    : null;
  const isDirectionCorrect = expected && expected.direction !== undefined
    ? filter.direction === expected.direction
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
  console.log(`   トークン: 入力=${promptTokens} 出力=${completionTokens} 思考=${thinkingTokens} | ${costJpy}円`);
  console.log(`   処理時間: ${(duration / 1000).toFixed(1)}秒`);

  return {
    file: displayName,
    folder,
    expected,
    is_classification_correct: isClassificationCorrect,
    is_source_type_correct: isSourceTypeCorrect,
    is_direction_correct: isDirectionCorrect,
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
  console.log('document_filter テスト（T-00i）');
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
    const expected = FOLDER_EXPECTED[e.folder];
    const tag = expected ? `[期待: ${expected.classification} / ${expected.source_type}]` : '[期待値なし]';
    console.log(`   ${e.folder ? e.folder + '/' : ''}${path.basename(e.filePath)} ${tag}`);
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

  console.log(`\nコスト:`);
  console.log(`   総コスト: ${totalCostJpy}円`);
  console.log(`   1枚平均: ${avgCostJpy}円`);
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
    purpose: 'document_filter テスト（3分類 + 証票種類のみ。JSON抽出なし）',
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
    type_stats: typeStats,
    cost: {
      total_jpy: totalCostJpy,
      per_file_jpy: avgCostJpy,
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
