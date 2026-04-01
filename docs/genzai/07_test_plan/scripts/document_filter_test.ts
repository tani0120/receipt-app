/**
 * document_filter テストスクリプト（T-00i 修正版）
 *
 * 目的: Geminiに「3分類 + 証票種類」だけ質問し、精度とコストを測定する
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
 *       input/receipt/        ← 領収書
 *       input/invoice_received/ ← 請求書
 *       input/tax_payment/    ← 納付書
 *       input/journal_voucher/ ← 振替伝票
 *       input/bank_statement/ ← 通帳・銀行明細
 *       input/credit_card/    ← クレカ明細
 *       input/cash_ledger/    ← 現金出納帳
 *       input/non_journal_test/ ← 仕訳外（ブラックリスト精度確認用）
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
// ホワイトリスト7種 + 仕訳外（設計書 document_filter_design.md と一致）
// ============================================================

type JournalableType =
  | 'receipt'           // 領収書・レシート
  | 'invoice_received'  // 受取請求書
  | 'tax_payment'       // 納付書
  | 'journal_voucher'   // 振替伝票・入出金伝票
  | 'bank_statement'    // 通帳・預金PDF
  | 'credit_card'       // クレカ・Pay・スマホ決済明細
  | 'cash_ledger'       // 現金出納帳
  | 'non_journal'       // 仕訳対象外
  | 'other';            // Gemini判断不能時のフォールバック

type Classification = 'journalable' | 'non_journalable' | 'medical';

// フォルダ名 → 期待値マッピング（正解率計算に使用）
const FOLDER_EXPECTED: Record<string, { classification: Classification; source_type: JournalableType } | null> = {
  'receipt':          { classification: 'journalable',     source_type: 'receipt' },
  'invoice_received': { classification: 'journalable',     source_type: 'invoice_received' },
  'tax_payment':      { classification: 'journalable',     source_type: 'tax_payment' },
  'journal_voucher':  { classification: 'journalable',     source_type: 'journal_voucher' },
  'bank_statement':   { classification: 'journalable',     source_type: 'bank_statement' },
  'credit_card':      { classification: 'journalable',     source_type: 'credit_card' },
  'cash_ledger':      { classification: 'journalable',     source_type: 'cash_ledger' },
  'non_journal_test': { classification: 'non_journalable', source_type: 'non_journal' },
  // フォルダなし（input/直下）= 期待値なし → 正解率計算から除外
};

// ============================================================
// コマンドライン引数
// ============================================================

const labelIndex = process.argv.indexOf('--label');
if (labelIndex === -1 || !process.argv[labelIndex + 1]) {
  console.error('使い方: npx tsx docs/genzai/07_test_plan/scripts/document_filter_test.ts --label <ラベル名> [--dry-run]');
  process.exit(1);
}
const RUN_LABEL = process.argv[labelIndex + 1] as string;
const DRY_RUN = process.argv.includes('--dry-run');

// ============================================================
// プロンプト（設計書のホワイトリスト7種 + non_journal に準拠）
// ============================================================

const SYSTEM_INSTRUCTION = `あなたは日本の会計事務所の受付係です。
届いた書類を見て、2つだけ判断してください。

1. この書類は仕訳が必要か？（3分類）
2. この書類は何か？（証票種類）

それ以外の情報（金額・日付・科目等）は一切不要です。`;

const REQUEST_PROMPT = `この書類を見て、以下のJSONだけを返してください。

{
  "classification": "journalable" | "non_journalable" | "medical",
  "classification_reason": "判定理由（1文）",
  "source_type": "receipt" | "invoice_received" | "tax_payment" | "journal_voucher" | "bank_statement" | "credit_card" | "cash_ledger" | "non_journal" | "other",
  "source_type_label": "日本語名（例: 領収書、請求書、通帳）",
  "confidence": 0.0〜1.0,
  "is_handwritten": true | false,
  "readability": "clear" | "partial" | "unreadable"
}

## 分類ルール（classification）:
- journalable: 仕訳が必要な書類
- non_journalable: 仕訳不要（見積書、契約書、名刺、メモ、謄本、カタログ、議事録、給与明細等）
- medical: 医療費の領収書・明細書（病院、薬局、クリニック）

## 証票種類（source_type）:
| 値 | 日本語 | 仕訳生成 |
|---|---|---|
| receipt | 領収書・レシート | ✅ |
| invoice_received | 受取請求書 | ✅ |
| tax_payment | 納付書（税金・社会保険） | ✅ |
| journal_voucher | 振替伝票・入出金伝票 | ✅ |
| bank_statement | 通帳・銀行明細 | ✅ |
| credit_card | クレカ・Pay・スマホ決済明細 | ✅ |
| cash_ledger | 現金出納帳 | ✅ |
| non_journal | 仕訳対象外（上記以外の仕訳不要書類） | ❌ |
| other | 判別不能 | ❓ |`;

// ============================================================
// 型定義
// ============================================================

interface FilterResult {
  classification: Classification;
  classification_reason: string;
  source_type: JournalableType;
  source_type_label: string;
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
  } | null;                // フォルダマッピングがない場合はnull
  is_classification_correct: boolean | null;
  is_source_type_correct: boolean | null;
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

  // コンソール出力
  const icon = filter.classification === 'journalable' ? '✅'
    : filter.classification === 'medical' ? '🏥'
    : '❌';
  const correctMark = isClassificationCorrect === null ? '（期待値なし）'
    : isClassificationCorrect ? '⭕' : `✗ 期待: ${expected?.classification}`;
  const sourceCorrect = isSourceTypeCorrect === null ? ''
    : isSourceTypeCorrect ? ' ⭕' : ` ✗期待:${expected?.source_type}`;

  console.log(`   ${icon} ${filter.classification} ${correctMark}`);
  console.log(`   証票: ${filter.source_type_label}（${filter.source_type}）${sourceCorrect}`);
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
  const medical        = results.filter(r => r.filter.classification === 'medical').length;

  // 正解率（期待値ありのファイルのみ）
  const evalTargets = results.filter(r => r.is_classification_correct !== null);
  const classificationCorrect = evalTargets.filter(r => r.is_classification_correct).length;
  const sourceTypeCorrect = evalTargets.filter(r => r.is_source_type_correct).length;
  const classAccuracy = evalTargets.length > 0
    ? Math.round((classificationCorrect / evalTargets.length) * 1000) / 10
    : null;
  const sourceAccuracy = evalTargets.length > 0
    ? Math.round((sourceTypeCorrect / evalTargets.length) * 1000) / 10
    : null;

  const totalCostJpy = results.reduce((s, r) => s + r.metadata.cost_jpy, 0);
  const avgCostJpy   = results.length > 0 ? Math.round(totalCostJpy / results.length) : 0;
  const avgDurationMs = results.length > 0
    ? results.reduce((s, r) => s + r.metadata.duration_ms, 0) / results.length
    : 0;

  console.log(`\n3分類:`);
  console.log(`   仕訳対象（journalable）:    ${journalable}件`);
  console.log(`   仕訳対象外（non_journalable）: ${nonJournalable}件`);
  console.log(`   医療費（medical）:           ${medical}件`);
  console.log(`   エラー:                      ${errors.length}件`);

  console.log(`\n精度（期待値ありの${evalTargets.length}件）:`);
  if (classAccuracy !== null) {
    console.log(`   分類正解率:   ${classificationCorrect}/${evalTargets.length} = ${classAccuracy}%`);
    console.log(`   証票種類正解: ${sourceTypeCorrect}/${evalTargets.length} = ${sourceAccuracy}%`);
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
      medical,
    },
    accuracy: {
      eval_targets: evalTargets.length,
      classification_correct: classificationCorrect,
      classification_accuracy_pct: classAccuracy,
      source_type_correct: sourceTypeCorrect,
      source_type_accuracy_pct: sourceAccuracy,
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
