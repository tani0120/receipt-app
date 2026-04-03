/**
 * vision_ocr_compare_test.ts — T-P4: Vision OCR vs Gemini 比較テスト
 *
 * 目的: 通帳・クレカ明細の画像を Vision OCR と Gemini の両方で読み取り、
 *       行データ（日付/摘要/金額）の抽出精度を比較する。
 *
 * 使い方:
 *   npx tsx docs/genzai/07_test_plan/scripts/vision_ocr_compare_test.ts --label bank_v1
 *
 * 前提:
 *   - gcloud auth application-default login 済み
 *   - src/scripts/test_results/document_filter/input/bank_statement/ に通帳画像
 *   - src/scripts/test_results/document_filter/input/credit_card/ にクレカ画像
 *
 * 出力:
 *   src/scripts/test_results/vision_compare/<label>/
 *     - <ファイル名>_vision.json   （Vision OCR生テキスト）
 *     - <ファイル名>_gemini.json   （Gemini line_items出力）
 *     - _summary.json              （コスト・速度比較）
 */

import { VertexAI } from '@google-cloud/vertexai';
import { ImageAnnotatorClient } from '@google-cloud/vision';
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
const MODEL_ID = 'gemini-2.5-flash';

const INPUT_DIR = path.resolve(
  __dirname,
  '../../../../src/scripts/test_results/document_filter/input'
);
const OUTPUT_BASE = path.resolve(
  __dirname,
  '../../../../src/scripts/test_results/vision_compare'
);

// 対象フォルダ（通帳とクレカのみ）
const TARGET_FOLDERS = ['bank_statement', 'credit_card'];

const SUPPORTED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.heic',
]);

// 料金定数
const PRICE = {
  // Gemini 2.5 Flash（USD / 100万tokens）
  gemini_prompt_per_million: 0.30,
  gemini_completion_per_million: 2.50,
  gemini_thinking_per_million: 2.50,
  // Vision API（USD / 1000画像）
  vision_per_1000: 1.50,
} as const;

// ============================================================
// CLI引数
// ============================================================

function getArg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const labelIndex = process.argv.indexOf('--label');
if (labelIndex === -1 || !process.argv[labelIndex + 1]) {
  console.error('使い方: npx tsx docs/genzai/07_test_plan/scripts/vision_ocr_compare_test.ts --label <ラベル名>');
  process.exit(1);
}
const RUN_LABEL = process.argv[labelIndex + 1] as string;
const DRY_RUN = process.argv.includes('--dry-run');

// ============================================================
// Gemini プロンプト（通帳/クレカ用 — 個別行抽出）
// ============================================================

const GEMINI_LINE_ITEMS_PROMPT = `この書類の各取引行を読み取り、以下のJSON配列で返してください。

{
  "source_type": "bank_statement" | "credit_card",
  "institution_name": "金融機関名（例: 三菱UFJ銀行）またはカード会社名",
  "line_items": [
    {
      "date": "YYYY-MM-DD形式。年が不明なら月日のみ（MM-DD）",
      "description": "摘要・利用先名（印字されたまま）",
      "amount": 数値（円。カンマなし整数）,
      "direction": "expense" | "income",
      "balance": 数値 | null（残高。通帳のみ。なければnull）
    }
  ]
}

## ルール:
- 全ての取引行を漏れなく抽出すること
- 金額は数値で返す（カンマ・円マーク不要）
- direction: 出金/引落/支払い → "expense"、入金/振込入/利息 → "income"
- 通帳の場合: お支払金額列 → expense、お預り金額列 → income
- クレカの場合: 全て expense（利用明細なので）
- date: 年が省略されている場合は "MM-DD" 形式で返す
- description: 印字されたカナ・英数字をそのまま転記（翻訳しない）
- JSON以外のテキストは一切不要`;

// ============================================================
// ファイル走査
// ============================================================

function collectFiles(): string[] {
  const files: string[] = [];
  for (const folder of TARGET_FOLDERS) {
    const dir = path.join(INPUT_DIR, folder);
    if (!fs.existsSync(dir)) {
      console.log(`⚠️ フォルダなし: ${dir}`);
      continue;
    }
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const ext = path.extname(entry).toLowerCase();
      if (SUPPORTED_EXTENSIONS.has(ext)) {
        files.push(path.join(folder, entry));
      }
    }
  }
  return files;
}

// ============================================================
// Vision OCR
// ============================================================

async function runVisionOcr(imagePath: string): Promise<{
  text: string;
  duration_ms: number;
  cost_jpy: number;
}> {
  const client = new ImageAnnotatorClient();
  const start = Date.now();

  // 画像を読み込み
  const imageBuffer = fs.readFileSync(imagePath);

  // DOCUMENT_TEXT_DETECTION（表形式に強い）
  const [result] = await client.documentTextDetection({
    image: { content: imageBuffer },
  });

  const duration_ms = Date.now() - start;
  const text = result.fullTextAnnotation?.text ?? '';

  // Vision API: $1.50 / 1000画像 = 0.0015 USD/枚 = 約0.23円/枚
  const cost_jpy = Math.round(0.0015 * 150 * 100) / 100;

  return { text, duration_ms, cost_jpy };
}

// ============================================================
// Gemini
// ============================================================

async function runGemini(imagePath: string): Promise<{
  raw_json: string;
  parsed: unknown;
  duration_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  thinking_tokens: number;
  cost_jpy: number;
}> {
  const vertex = new VertexAI({ project: PROJECT_ID, location: LOCATION });
  const model = vertex.getGenerativeModel({
    model: MODEL_ID,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0,
    } as never,
  });

  // 画像前処理
  const mimeType = getMimeType(imagePath);
  const processed = await preprocessImage(imagePath, mimeType);
  const base64 = processed.base64;

  const start = Date.now();

  const response = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: GEMINI_LINE_ITEMS_PROMPT },
      ],
    }],
  });

  const duration_ms = Date.now() - start;
  const candidate = response.response?.candidates?.[0];
  const raw_json = candidate?.content?.parts?.[0]?.text ?? '{}';
  const usage = response.response?.usageMetadata;
  const prompt_tokens = usage?.promptTokenCount ?? 0;
  const completion_tokens = usage?.candidatesTokenCount ?? 0;
  const thinking_tokens = (usage as Record<string, number>)?.thoughtsTokenCount ?? 0;

  const usd =
    (prompt_tokens / 1_000_000) * PRICE.gemini_prompt_per_million +
    (completion_tokens / 1_000_000) * PRICE.gemini_completion_per_million +
    (thinking_tokens / 1_000_000) * PRICE.gemini_thinking_per_million;
  const cost_jpy = Math.round(usd * 150 * 100) / 100;

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(raw_json);
  } catch {
    parsed = { error: 'JSON parse failed', raw: raw_json };
  }

  return { raw_json, parsed, duration_ms, prompt_tokens, completion_tokens, thinking_tokens, cost_jpy };
}

// ============================================================
// メイン
// ============================================================

interface CompareResult {
  file: string;
  vision: {
    text: string;
    duration_ms: number;
    cost_jpy: number;
  };
  gemini: {
    parsed: unknown;
    duration_ms: number;
    prompt_tokens: number;
    completion_tokens: number;
    thinking_tokens: number;
    cost_jpy: number;
  };
}

async function main() {
  const files = collectFiles();
  if (files.length === 0) {
    console.error('❌ 対象ファイルが見つかりません。bank_statement/ または credit_card/ に画像を配置してください。');
    process.exit(1);
  }

  console.log(`\n🔍 Vision OCR vs Gemini 比較テスト`);
  console.log(`   ラベル: ${RUN_LABEL}`);
  console.log(`   対象: ${files.length}ファイル`);
  console.log(`   モード: ${DRY_RUN ? 'ドライラン' : '本番実行'}\n`);

  if (DRY_RUN) {
    console.log('📋 対象ファイル:');
    files.forEach(f => console.log(`   ${f}`));
    return;
  }

  const outputDir = path.join(OUTPUT_BASE, RUN_LABEL);
  fs.mkdirSync(outputDir, { recursive: true });

  const results: CompareResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fullPath = path.join(INPUT_DIR, file);
    const baseName = path.basename(file, path.extname(file));
    const folderName = path.dirname(file);

    console.log(`\n[${i + 1}/${files.length}] ${file}`);

    // ── Vision OCR ──
    console.log('   🔵 Vision OCR...');
    let visionResult;
    try {
      visionResult = await runVisionOcr(fullPath);
      const lineCount = visionResult.text.split('\n').length;
      console.log(`   ✅ ${lineCount}行取得 (${visionResult.duration_ms}ms, ${visionResult.cost_jpy}円)`);
    } catch (e) {
      console.error(`   ❌ Vision OCRエラー: ${e}`);
      visionResult = { text: `ERROR: ${e}`, duration_ms: 0, cost_jpy: 0 };
    }

    // Vision結果保存
    fs.writeFileSync(
      path.join(outputDir, `${folderName}_${baseName}_vision.json`),
      JSON.stringify({
        file,
        method: 'vision_ocr',
        text: visionResult.text,
        line_count: visionResult.text.split('\n').length,
        duration_ms: visionResult.duration_ms,
        cost_jpy: visionResult.cost_jpy,
      }, null, 2),
      'utf-8'
    );

    // ── Gemini ──
    console.log('   🟠 Gemini...');
    let geminiResult;
    try {
      geminiResult = await runGemini(fullPath);
      const lineItems = (geminiResult.parsed as Record<string, unknown[]>)?.line_items;
      const count = Array.isArray(lineItems) ? lineItems.length : '?';
      console.log(`   ✅ ${count}行取得 (${geminiResult.duration_ms}ms, ${geminiResult.cost_jpy}円)`);
    } catch (e) {
      console.error(`   ❌ Geminiエラー: ${e}`);
      geminiResult = {
        raw_json: '', parsed: { error: String(e) },
        duration_ms: 0, prompt_tokens: 0, completion_tokens: 0, thinking_tokens: 0, cost_jpy: 0,
      };
    }

    // Gemini結果保存
    fs.writeFileSync(
      path.join(outputDir, `${folderName}_${baseName}_gemini.json`),
      JSON.stringify({
        file,
        method: 'gemini',
        parsed: geminiResult.parsed,
        duration_ms: geminiResult.duration_ms,
        tokens: {
          prompt: geminiResult.prompt_tokens,
          completion: geminiResult.completion_tokens,
          thinking: geminiResult.thinking_tokens,
        },
        cost_jpy: geminiResult.cost_jpy,
      }, null, 2),
      'utf-8'
    );

    results.push({
      file,
      vision: {
        text: visionResult.text,
        duration_ms: visionResult.duration_ms,
        cost_jpy: visionResult.cost_jpy,
      },
      gemini: {
        parsed: geminiResult.parsed,
        duration_ms: geminiResult.duration_ms,
        prompt_tokens: geminiResult.prompt_tokens,
        completion_tokens: geminiResult.completion_tokens,
        thinking_tokens: geminiResult.thinking_tokens,
        cost_jpy: geminiResult.cost_jpy,
      },
    });
  }

  // ── サマリ ──
  const summary = {
    run: RUN_LABEL,
    timestamp: new Date().toISOString(),
    total_files: results.length,
    vision: {
      total_cost_jpy: Math.round(results.reduce((s, r) => s + r.vision.cost_jpy, 0) * 100) / 100,
      avg_duration_ms: Math.round(results.reduce((s, r) => s + r.vision.duration_ms, 0) / results.length),
      per_file_cost_jpy: Math.round((results.reduce((s, r) => s + r.vision.cost_jpy, 0) / results.length) * 100) / 100,
    },
    gemini: {
      total_cost_jpy: Math.round(results.reduce((s, r) => s + r.gemini.cost_jpy, 0) * 100) / 100,
      avg_duration_ms: Math.round(results.reduce((s, r) => s + r.gemini.duration_ms, 0) / results.length),
      per_file_cost_jpy: Math.round((results.reduce((s, r) => s + r.gemini.cost_jpy, 0) / results.length) * 100) / 100,
    },
    comparison: {
      cost_ratio: `Vision はGeminiの ${Math.round(
        (results.reduce((s, r) => s + r.vision.cost_jpy, 0) /
         Math.max(results.reduce((s, r) => s + r.gemini.cost_jpy, 0), 0.01)) * 100
      ) / 100} 倍`,
      speed_ratio: `Vision はGeminiの ${Math.round(
        (results.reduce((s, r) => s + r.vision.duration_ms, 0) /
         Math.max(results.reduce((s, r) => s + r.gemini.duration_ms, 0), 1)) * 100
      ) / 100} 倍`,
    },
    files: results.map(r => ({
      file: r.file,
      vision_lines: r.vision.text.split('\n').length,
      vision_ms: r.vision.duration_ms,
      vision_jpy: r.vision.cost_jpy,
      gemini_line_items: Array.isArray((r.gemini.parsed as Record<string, unknown>)?.line_items)
        ? ((r.gemini.parsed as Record<string, unknown[]>).line_items).length
        : null,
      gemini_ms: r.gemini.duration_ms,
      gemini_jpy: r.gemini.cost_jpy,
    })),
  };

  fs.writeFileSync(
    path.join(outputDir, '_summary.json'),
    JSON.stringify(summary, null, 2),
    'utf-8'
  );

  // ── 結果表示 ──
  console.log('\n' + '='.repeat(60));
  console.log('📊 比較結果サマリ');
  console.log('='.repeat(60));
  console.log(`\n| 項目 | Vision OCR | Gemini |`);
  console.log(`|---|---|---|`);
  console.log(`| 費用/枚 | ${summary.vision.per_file_cost_jpy}円 | ${summary.gemini.per_file_cost_jpy}円 |`);
  console.log(`| 速度(平均) | ${summary.vision.avg_duration_ms}ms | ${summary.gemini.avg_duration_ms}ms |`);
  console.log(`| 合計費用 | ${summary.vision.total_cost_jpy}円 | ${summary.gemini.total_cost_jpy}円 |`);
  console.log(`\n${summary.comparison.cost_ratio}`);
  console.log(summary.comparison.speed_ratio);

  console.log(`\n✅ 結果保存先: ${outputDir}`);
  console.log('   各ファイルの _vision.json と _gemini.json を目視比較してください。');
}

main().catch(console.error);
