/**
 * パイプライン classify service（AI呼び出し層）
 *
 * レイヤー: route → ★service★ → postprocess
 * 責務: Vertex AI呼び出し + ログ出力。ビジネスロジックは postprocess に委譲。
 */

import { GoogleGenAI } from '@google/genai';
import { Type } from '@google/genai';
import sharp from 'sharp';
import type {
  ClassifyRequest,
  ClassifyRawResponse,
  ClassifyResponse,
  PipelineLogEntry,
} from './types';
import { postprocessClassify } from './postprocess';

// ============================================================
// 設定
// ============================================================

const PROJECT_ID = process.env['VERTEX_PROJECT_ID'] ?? '';
const LOCATION   = process.env['VERTEX_LOCATION']   ?? 'us-central1';
const MODEL_ID   = process.env['VERTEX_MODEL_ID']    ?? 'gemini-2.5-flash-preview-04-17';

// シングルトン（リクエスト毎に生成しない）
let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!_ai) {
    if (!PROJECT_ID) {
      throw new Error('VERTEX_PROJECT_ID 環境変数が未設定です');
    }
    _ai = new GoogleGenAI({ vertexai: true, project: PROJECT_ID, location: LOCATION });
    console.log(`[pipeline/service] Vertex AI初期化完了: project=${PROJECT_ID}, location=${LOCATION}, model=${MODEL_ID}`);
  }
  return _ai;
}

// ============================================================
// classify用 Structured Output Schema
// ============================================================

const CLASSIFY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    source_type: {
      type: Type.STRING,
      enum: [
        'receipt', 'invoice_received', 'tax_payment', 'journal_voucher',
        'bank_statement', 'credit_card', 'cash_ledger',
        'invoice_issued', 'receipt_issued', 'non_journal', 'other',
      ],
      description: '証票種別（11種から1つ選択）',
    },
    source_type_confidence: {
      type: Type.NUMBER,
      description: '証票種別の信頼度（0.0〜1.0）',
    },
    direction: {
      type: Type.STRING,
      enum: ['expense', 'income', 'transfer', 'mixed'],
      description: '仕訳方向（4種から1つ選択）',
    },
    direction_confidence: {
      type: Type.NUMBER,
      description: '仕訳方向の信頼度（0.0〜1.0）',
    },
    description: {
      type: Type.STRING,
      nullable: true,
      description: '摘要（取引内容の要約）',
    },
    issuer_name: {
      type: Type.STRING,
      nullable: true,
      description: '発行者名（会社名・店舗名）',
    },
    date: {
      type: Type.STRING,
      nullable: true,
      description: '取引日（YYYY-MM-DD）',
    },
    total_amount: {
      type: Type.NUMBER,
      nullable: true,
      description: '合計金額（税込）',
    },
  },
  required: [
    'source_type', 'source_type_confidence',
    'direction', 'direction_confidence',
  ],
};

// ============================================================
// System Instruction（Step 0-1専用、軽量版）
// ============================================================

const SYSTEM_INSTRUCTION = `あなたは日本の会計事務所向けのAI証票分類エンジンです。
1枚の証票画像から、証票種別（source_type）と仕訳方向（direction）を判定してください。

## 証票種別（source_type）判定基準

| source_type | 判定基準 |
|---|---|
| receipt | 「領収書」「レシート」の表記、またはPOS端末出力 |
| invoice_received | 「請求書」「御請求書」「納品書兼請求書」の表記（受け取った請求書） |
| tax_payment | 「納付書」「納税」の表記。税金の支払い書類 |
| journal_voucher | 「振替伝票」の表記 |
| bank_statement | 通帳ページ、「普通預金」「当座預金」の表記 |
| credit_card | 「クレジットカード利用明細」「カードご利用」の表記 |
| cash_ledger | 「現金出納帳」の表記 |
| invoice_issued | 自社が発行した請求書（「御中」が宛先にある等） |
| receipt_issued | 自社が発行した領収書 |
| non_journal | 名刺、メモ、謄本、定款等の仕訳不要書類 |
| other | 上記のいずれにも該当しない |

## 仕訳方向（direction）判定基準

| direction | 判定基準 |
|---|---|
| expense | 出金・支払い。レシート、請求書の支払い等 |
| income | 入金・受取り。売上入金、利息入金等 |
| transfer | 振替。口座間移動、クレカ引落し等 |
| mixed | 混在。通帳ページ等で入金と出金が混在 |

## 出力ルール
- source_typeとdirectionは必ず上記のenumから選択。
- confidence（信頼度）は0.0〜1.0で評価。
- description: 取引内容を1文で要約。
- issuer_name: 発行者名。読み取れない場合はnull。
- date: 取引日（YYYY-MM-DD）。読み取れない場合はnull。
- total_amount: 合計金額（税込）。読み取れない場合はnull。`;

const REQUEST_PROMPT = `この証票画像を分析し、証票種別と仕訳方向を判定してください。`;

// ============================================================
// 画像前処理（sharp pipeline）
// ============================================================

interface PreprocessResult {
  data: string;       // base64
  mimeType: string;
  originalSize: number;
  processedSize: number;
  preprocessed: boolean;
}

/**
 * base64画像をsharp pipelineで前処理する
 * 1. rotate()     — EXIF回転補正
 * 2. resize(2000) — 横幅2000px上限
 * 3. grayscale()  — 白黒化
 * 4. normalize()  — コントラスト正規化
 * 5. sharpen(1.0) — 文字エッジ強調
 * 6. jpeg(85)     — JPEG出力
 */
async function preprocessForClassify(
  base64: string,
  mimeType: string
): Promise<PreprocessResult> {
  const inputBuffer = Buffer.from(base64, 'base64');
  const originalSize = inputBuffer.length;

  // PDF は前処理不要（Geminiが直接読める）
  if (mimeType === 'application/pdf') {
    return { data: base64, mimeType, originalSize, processedSize: originalSize, preprocessed: false };
  }

  try {
    const processed = await sharp(inputBuffer)
      .rotate()                                           // EXIF回転補正
      .resize(2000, null, { withoutEnlargement: true })   // 横幅上限
      .grayscale()                                        // 白黒化
      .normalize()                                        // コントラスト正規化
      .sharpen({ sigma: 1.0 })                            // 文字エッジ強調
      .jpeg({ quality: 85 })                              // JPEG出力
      .toBuffer();

    const reduction = ((1 - processed.length / originalSize) * 100).toFixed(0);
    console.log(`[pipeline/preprocess] ${(originalSize / 1024).toFixed(0)}KB → ${(processed.length / 1024).toFixed(0)}KB (${reduction}%削減)`);

    return {
      data: processed.toString('base64'),
      mimeType: 'image/jpeg',
      originalSize,
      processedSize: processed.length,
      preprocessed: true,
    };
  } catch (err) {
    console.warn(`[pipeline/preprocess] 前処理失敗、生画像で続行:`, err);
    return { data: base64, mimeType, originalSize, processedSize: originalSize, preprocessed: false };
  }
}

// ============================================================
// メイン関数
// ============================================================

/**
 * 画像1枚のclassify（Step 0-1）を実行する。
 * AI呼び出し失敗時もfallbackレスポンスを返す（例外を投げない）。
 */
export async function classifyImage(req: ClassifyRequest): Promise<ClassifyResponse> {
  const startTime = Date.now();
  const filename = req.filename ?? 'unknown';

  // ① 前処理（sharp pipeline）
  const pp = await preprocessForClassify(req.image, req.mimeType);
  console.log(`[pipeline/service] classify開始: ${filename} (${pp.mimeType}, ${Math.round(pp.processedSize / 1024)}KB, 前処理=${pp.preprocessed})`);

  let raw: ClassifyRawResponse | null = null;
  let promptTokens = 0;
  let completionTokens = 0;
  let thinkingTokens = 0;
  let error: string | null = null;

  try {
    const ai = getAI();

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: pp.mimeType, data: pp.data } },
            { text: REQUEST_PROMPT },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: CLASSIFY_SCHEMA,
        temperature: 0,
      },
    });

    // トークン使用量
    const usage = response.usageMetadata;
    promptTokens = usage?.promptTokenCount ?? 0;
    completionTokens = usage?.candidatesTokenCount ?? 0;
    thinkingTokens = (usage as Record<string, unknown>)?.thoughtsTokenCount as number ?? 0;

    // JSON解析
    const responseText = response.text ?? '';
    if (responseText) {
      raw = JSON.parse(responseText) as ClassifyRawResponse;
    }
  } catch (err) {
    error = String(err);
    console.error(`[pipeline/service] AI呼び出し失敗: ${error}`);
  }

  const durationMs = Date.now() - startTime;

  // ログ出力（④ ログ絶対入れる）
  const logEntry: PipelineLogEntry = {
    timestamp: new Date().toISOString(),
    step: 'classify',
    input: {
      filename,
      mimeType: req.mimeType,
      sizeBytes: Math.round(req.image.length * 0.75),
      clientId: req.clientId,
    },
    ai_raw: raw ? { ...raw } : {},
    postprocess: {},  // 後で埋める
    error,
    duration_ms: durationMs,
  };

  // postprocess（③ fallback設計）
  const result = postprocessClassify(raw, {
    duration_ms: durationMs,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    thinking_tokens: thinkingTokens,
    model: MODEL_ID,
  });

  // ログにpostprocess結果を追加
  logEntry.postprocess = {
    source_type: result.source_type,
    direction: result.direction,
    processing_mode: result.processing_mode,
    fallback_applied: result.fallback_applied,
  };

  // ログ出力
  console.log(`[pipeline/service] classify完了:`, JSON.stringify(logEntry, null, 0));

  return result;
}
