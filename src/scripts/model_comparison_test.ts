/**
 * モデル比較テストスクリプト（previewExtractと同一プロンプト使用）
 *
 * 比較対象: gemini-2.5-flash / gemini-3-flash / gemini-3.1-flash-lite
 * テスト内容: OCR（画像→仕訳データ抽出）— previewExtract.service.tsと完全同一のプロンプト・スキーマ
 *
 * 実行: npx tsx src/scripts/model_comparison_test.ts
 */

import { GoogleGenAI } from '@google/genai';
import { Type } from '@google/genai';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// previewExtractと同じスキーマ記述・キーワード・プロンプトを参照
import {
  DESC_SOURCE_TYPE, DESC_SOURCE_TYPE_CONFIDENCE,
  DESC_DIRECTION, DESC_DIRECTION_CONFIDENCE,
  DESC_EXTRACT_REASON, DESC_DOCUMENT_COUNT, DESC_DOCUMENT_COUNT_REASON,
  DESC_DESCRIPTION, DESC_ISSUER_NAME, DESC_DATE, DESC_TOTAL_AMOUNT,
  DESC_LINE_ITEMS, DESC_LINE_DATE, DESC_LINE_DESCRIPTION,
  DESC_LINE_AMOUNT, DESC_LINE_DIRECTION, DESC_LINE_BALANCE,
  REQUEST_PROMPT,
} from '../api/services/pipeline/schemaDescriptions';
import { buildKeywordsPrompt } from '../api/services/pipeline/source_type_keywords';

dotenv.config({ path: '.env.local' });

// ============================================================
// 設定
// ============================================================

const PROJECT_ID = process.env['VERTEX_PROJECT_ID'] ?? '';
const LOCATION = 'global';

if (!PROJECT_ID) {
  console.error('VERTEX_PROJECT_ID が未設定です');
  process.exit(1);
}

const MODELS = [
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
];

/** 料金テーブル（$/100万トークン） */
const PRICING: Record<string, { input: number; output: number; thinking: number }> = {
  'gemini-2.5-flash':      { input: 0.15, output: 0.60, thinking: 3.50 },
  'gemini-3-flash-preview': { input: 0.50, output: 3.00, thinking: 0 },
  'gemini-3.1-flash-lite': { input: 0.25, output: 1.50, thinking: 0 },
  'gemini-3.5-flash':      { input: 0.15, output: 0.60, thinking: 3.50 },
};

const USD_JPY = 150;

// ============================================================
// previewExtractと完全同一の System Instruction
// ============================================================

const SYSTEM_INSTRUCTION_BASE = `あなたは日本の会計事務所向けのAI証票分類エンジンです。
【最優先タスク】まず画像内に独立した情報源が1つだけか、2つ以上あるかを判定せよ。判定後、主要な1つについて詳細情報を抽出せよ。
1枚の証票画像から、証票種別（source_type）と仕訳方向（direction）を判定し、行データ（line_items）を抽出してください。
`;

const SYSTEM_INSTRUCTION_RULES = `
## 仕訳方向（direction）判定基準

| direction | 判定基準 |
|---|---|
| expense | 出金・支払い。レシート、請求書の支払い等 |
| income | 入金・受取り。売上入金、利息入金等 |
| transfer | 振替。口座間移動、クレカ引落し等 |
| mixed | 混在。通帳ページ等で入金と出金が混在 |

## 行データ（line_items）抽出ルール

| source_type | line_itemsの抽出方法 |
|---|---|
| bank_statement | 通帳の全取引行を抽出。各行にdate/description/amount/direction/balanceを設定 |
| credit_card | クレカ明細の全利用行を抽出。balanceはnull |
| cash_ledger | 全取引行を抽出。balanceあり |
| supplementary_doc | 可能な限り全行抽出。収支報告書なら収入・支出全行。契約書なら主要金額行 |
| receipt | 1行。date=取引日、description=摘要、amount=税込合計、direction=expense |
| invoice_received | 1行。同上 |
| tax_payment | 1行。同上 |
| non_journal / other | 空配列[] |
| その他 | 可能な限り抽出。不明な場合は空配列[] |

## 出力ルール
- source_typeとdirectionは必ず上記のenumから選択。
- confidence（信頼度）は0.0〜1.0で評価。
- description: 取引内容を1文で要約。
- issuer_name: 発行者名・作成者名。全source_typeで必ず読み取りを試みる。読み取れない場合はnull。
- date: 取引日・契約日・報告対象期間の開始日（YYYY-MM-DD）。全source_typeで必ず読み取りを試みる。読み取れない場合はnull。
- total_amount: 合計金額・契約金額（税込）。全source_typeで必ず読み取りを試みる。読み取れない場合はnull。
- preview_extract_reason: 判定根拠。なぜそのsource_typeを選んだかを日本語で1、2文で説明。例:「『領収書』の表記があり、POSレシート形式」
- document_count: 画像内に独立した情報源が何個あるかを数える。純粋に1枚の証票だけが写っている場合のみ1を返す。以下のケースは全て2以上: 複数の証票が並んでいるまたは重なっている / 証票以外のもの（他の書類・画面等）が同時に写っている。必ず整数で返す。
- document_count_reason: 上記document_countの判定根拠。画像の端・背景・重なり部分に他の書類や証票の片鲞が写っていないかを確認し、その結果を日本語で1、2文で説明。例:「主証票の左下に別のレシートの端が見える」「証票以外のものは写っていない」
- line_items: 行データ配列。各行のamountは必ず正の整数。入出金はdirectionで区別。`;

/** previewExtractと同一のSystem Instruction */
const SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTION_BASE + buildKeywordsPrompt() + SYSTEM_INSTRUCTION_RULES;

// ============================================================
// previewExtractと完全同一の Structured Output Schema
// ============================================================

const PREVIEW_EXTRACT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    source_type: {
      type: Type.STRING,
      enum: [
        'receipt', 'invoice_received', 'tax_payment', 'journal_voucher',
        'bank_statement', 'credit_card', 'cash_ledger', 'supplementary_doc',
        'invoice_issued', 'receipt_issued', 'non_journal', 'other',
      ],
      description: DESC_SOURCE_TYPE,
    },
    source_type_confidence: {
      type: Type.NUMBER,
      description: DESC_SOURCE_TYPE_CONFIDENCE,
    },
    direction: {
      type: Type.STRING,
      enum: ['expense', 'income', 'transfer', 'mixed'],
      description: DESC_DIRECTION,
    },
    direction_confidence: {
      type: Type.NUMBER,
      description: DESC_DIRECTION_CONFIDENCE,
    },
    preview_extract_reason: {
      type: Type.STRING,
      nullable: true,
      description: DESC_EXTRACT_REASON,
    },
    document_count: {
      type: Type.NUMBER,
      description: DESC_DOCUMENT_COUNT,
    },
    document_count_reason: {
      type: Type.STRING,
      nullable: true,
      description: DESC_DOCUMENT_COUNT_REASON,
    },
    description: {
      type: Type.STRING,
      nullable: true,
      description: DESC_DESCRIPTION,
    },
    issuer_name: {
      type: Type.STRING,
      nullable: true,
      description: DESC_ISSUER_NAME,
    },
    date: {
      type: Type.STRING,
      nullable: true,
      description: DESC_DATE,
    },
    total_amount: {
      type: Type.NUMBER,
      nullable: true,
      description: DESC_TOTAL_AMOUNT,
    },
    line_items: {
      type: Type.ARRAY,
      description: DESC_LINE_ITEMS,
      items: {
        type: Type.OBJECT,
        properties: {
          date: {
            type: Type.STRING,
            nullable: true,
            description: DESC_LINE_DATE,
          },
          description: {
            type: Type.STRING,
            description: DESC_LINE_DESCRIPTION,
          },
          amount: {
            type: Type.NUMBER,
            description: DESC_LINE_AMOUNT,
          },
          direction: {
            type: Type.STRING,
            enum: ['expense', 'income'],
            description: DESC_LINE_DIRECTION,
          },
          balance: {
            type: Type.NUMBER,
            nullable: true,
            description: DESC_LINE_BALANCE,
          },
        },
        required: ['description', 'amount', 'direction'],
      },
    },
  },
  required: [
    'source_type', 'source_type_confidence',
    'direction', 'direction_confidence',
    'document_count',
  ],
};

// ============================================================
// 実行関数
// ============================================================

interface TestResult {
  model: string;
  promptTokens: number;
  completionTokens: number;
  thinkingTokens: number;
  totalTokens: number;
  durationMs: number;
  costYen: number;
  success: boolean;
  sourceType: string;
  issuerName: string;
  totalAmount: number | null;
  date: string | null;
  lineItemCount: number;
  error: string | null;
}

async function runTest(ai: GoogleGenAI, model: string, imageBase64: string, mimeType: string): Promise<TestResult> {
  const start = Date.now();
  try {
    // thinkingConfigはgemini-2.5-flashのみ対応
    const thinkingConfig = model === 'gemini-2.5-flash'
      ? { thinkingBudget: 2048 }
      : undefined;

    const response = await ai.models.generateContent({
      model,
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: REQUEST_PROMPT },
        ],
      }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: PREVIEW_EXTRACT_SCHEMA,
        temperature: 0,
        ...(thinkingConfig ? { thinkingConfig } : {}),
      },
    });

    const usage = response.usageMetadata;
    const promptTokens = usage?.promptTokenCount ?? 0;
    const completionTokens = usage?.candidatesTokenCount ?? 0;
    const thinkingTokens = (usage as Record<string, unknown>)?.thoughtsTokenCount as number ?? 0;
    const totalTokens = promptTokens + completionTokens;
    const durationMs = Date.now() - start;

    const price = PRICING[model] ?? { input: 0, output: 0, thinking: 0 };
    const costYen = (
      (promptTokens * price.input / 1_000_000) +
      (completionTokens * price.output / 1_000_000) +
      (thinkingTokens * price.thinking / 1_000_000)
    ) * USD_JPY;

    const text = response.text ?? '';
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(text); } catch { /* 無視 */ }

    return {
      model, promptTokens, completionTokens, thinkingTokens, totalTokens,
      durationMs, costYen,
      success: !!parsed['source_type'],
      sourceType: String(parsed['source_type'] ?? ''),
      issuerName: String(parsed['issuer_name'] ?? ''),
      totalAmount: parsed['total_amount'] as number ?? null,
      date: parsed['date'] as string ?? null,
      lineItemCount: Array.isArray(parsed['line_items']) ? (parsed['line_items'] as unknown[]).length : 0,
      error: null,
    };
  } catch (err) {
    return {
      model, promptTokens: 0, completionTokens: 0, thinkingTokens: 0, totalTokens: 0,
      durationMs: Date.now() - start, costYen: 0,
      success: false, sourceType: '', issuerName: '', totalAmount: null, date: null, lineItemCount: 0,
      error: String(err),
    };
  }
}

// ============================================================
// メイン
// ============================================================

async function main() {
  console.log('='.repeat(80));
  console.log('モデル比較テスト（previewExtract同一プロンプト）');
  console.log(`プロジェクト: ${PROJECT_ID}, リージョン: ${LOCATION}`);
  console.log(`対象モデル: ${MODELS.join(', ')}`);
  console.log('='.repeat(80));

  const ai = new GoogleGenAI({ vertexai: true, project: PROJECT_ID, location: LOCATION });

  // テスト画像: 2枚（レシート + 通帳）
  const TEST_IMAGES = [
    { name: '鳥貴族レシート', path: join(process.cwd(), 'src/scripts/test_torikizoku.jpg') },
    { name: '普通預金通帳', path: join(process.cwd(), 'src/scripts/test_passbook.jpg') },
  ];

  console.log(`\nプロンプト長: System=${SYSTEM_INSTRUCTION.length}文字, Request="${REQUEST_PROMPT}"`);

  for (const img of TEST_IMAGES) {
    const imageBuffer = readFileSync(img.path);
    const imageBase64 = imageBuffer.toString('base64');
    console.log(`\n${'━'.repeat(80)}`);
    console.log(`📷 テスト画像: ${img.name} (${(imageBuffer.length / 1024).toFixed(0)}KB)`);
    console.log('━'.repeat(80));

    const results: TestResult[] = [];

    for (const model of MODELS) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`[${model}] 実行中...`);
      const result = await runTest(ai, model, imageBase64, 'image/jpeg');
      results.push(result);

      if (result.success) {
        console.log(`[${model}] ✅ 成功 (${result.durationMs}ms)`);
        console.log(`  種別: ${result.sourceType}`);
        console.log(`  発行者: ${result.issuerName}`);
        console.log(`  金額: ${result.totalAmount}`);
        console.log(`  日付: ${result.date}`);
        console.log(`  行数: ${result.lineItemCount}`);
        console.log(`  トークン: 入力=${result.promptTokens}, 出力=${result.completionTokens}, 思考=${result.thinkingTokens}, 合計=${result.totalTokens}`);
        console.log(`  コスト: ¥${result.costYen.toFixed(4)}`);
      } else {
        console.log(`[${model}] ❌ 失敗 (${result.durationMs}ms)`);
        console.log(`  エラー: ${result.error?.slice(0, 200)}`);
      }
    }

    // ━━ サマリ ━━
    console.log(`\n${'='.repeat(80)}`);
    console.log(`比較サマリ: ${img.name}`);
    console.log('='.repeat(80));
    console.log('');
    console.log('モデル                  | 成否 | 時間(ms) | 入力    | 出力   | 思考   | 合計    | コスト(¥)');
    console.log('─'.repeat(95));
    for (const r of results) {
      console.log(
        `${r.model.padEnd(24)}| ${r.success ? '✅' : '❌'}   | ` +
        `${String(r.durationMs).padStart(8)} | ` +
        `${String(r.promptTokens).padStart(7)} | ` +
        `${String(r.completionTokens).padStart(6)} | ` +
        `${String(r.thinkingTokens).padStart(6)} | ` +
        `${String(r.totalTokens).padStart(7)} | ` +
        `${r.costYen.toFixed(4).padStart(9)}`
      );
    }

    console.log('');
    console.log('モデル                  | 種別              | 発行者          | 金額       | 日付       | 行数');
    console.log('─'.repeat(95));
    for (const r of results) {
      if (r.success) {
        console.log(
          `${r.model.padEnd(24)}| ${r.sourceType.padEnd(18)}| ` +
          `${r.issuerName.slice(0, 14).padEnd(16)}| ` +
          `${String(r.totalAmount ?? '-').padStart(10)} | ` +
          `${(r.date ?? '-').padEnd(10)} | ` +
          `${r.lineItemCount}`
        );
      } else {
        console.log(`${r.model.padEnd(24)}| (失敗)`);
      }
    }
  }
}

main().catch(console.error);
