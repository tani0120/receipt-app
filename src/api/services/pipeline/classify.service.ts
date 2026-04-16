/**
 * パイプライン classify service（AI呼び出し層）
 *
 * レイヤー: route → ★service★ → postprocess
 * 責務: Vertex AI呼び出し + ログ出力。ビジネスロジックは postprocess に委譲。
 */

import { GoogleGenAI } from '@google/genai';
import { Type } from '@google/genai';
import { preprocessImage } from '../../../scripts/pipeline/image_preprocessor';
import type { MimeType } from '../../../scripts/pipeline/image_preprocessor';
import { buildKeywordsPrompt } from './source_type_keywords';
import type {
  ClassifyRequest,
  ClassifyRawResponse,
  ClassifyResponse,
  PipelineLogEntry,
} from './types';
import { postprocessClassify } from './postprocess';
import { validateClassifyResult } from './validateClassifyResult';

// ============================================================
// 設定
// ============================================================

// SHA-256重複チェック用（メモリ内Set。Supabase移行時はDB照合に差替）
const knownFileHashes = new Set<string>();

/** 重複ハッシュ記録をクリア（テスト・リセット用） */
export function clearKnownHashes(): void {
  knownFileHashes.clear();
}

// シングルトン（リクエスト毎に生成しない）
let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!_ai) {
    // ESMではimportが先に解決されるため、トップレベルではなくここで遅延取得する
    const projectId = process.env['VERTEX_PROJECT_ID'] ?? '';
    const location  = process.env['VERTEX_LOCATION']   ?? 'us-central1';
    if (!projectId) {
      throw new Error('VERTEX_PROJECT_ID 環境変数が未設定です');
    }
    _ai = new GoogleGenAI({ vertexai: true, project: projectId, location });
    console.log(`[pipeline/service] Vertex AI初期化完了: project=${projectId}, location=${location}, model=${getModelId()}`);
  }
  return _ai;
}

function getModelId(): string {
  return process.env['VERTEX_MODEL_ID'] ?? 'gemini-2.5-flash';
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
        'bank_statement', 'credit_card', 'cash_ledger', 'supplementary_doc',
        'invoice_issued', 'receipt_issued', 'non_journal', 'other',
      ],
      description: '証票種別（12種から1つ選択）',
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
    classify_reason: {
      type: Type.STRING,
      nullable: true,
      description: '判定根拠。なぜそのsource_typeを選んだかの理由を日本語で1、2文で説明',
    },
    document_count: {
      type: Type.NUMBER,
      description: '画像内の独立した情報源の数。純粋に1枚の証票だけが写っている場合のみ1。それ以外は2以上を返す',
    },
    document_count_reason: {
      type: Type.STRING,
      nullable: true,
      description: '画像内の情報源数の判定根拠。他の書類・証票の端や影が写っていないかを確認した結果を日本語で1、2文で説明',
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
    line_items: {
      type: Type.ARRAY,
      description: '行データ。通帳・クレカは全行、レシートは1行、仕訳対象外は空配列。',
      items: {
        type: Type.OBJECT,
        properties: {
          date: {
            type: Type.STRING,
            nullable: true,
            description: '取引日（YYYY-MM-DD）。日付欄がない行はnull',
          },
          description: {
            type: Type.STRING,
            description: '摘要（印字テキストそのまま）',
          },
          amount: {
            type: Type.NUMBER,
            description: '金額（円・整数・負数なし）',
          },
          direction: {
            type: Type.STRING,
            enum: ['expense', 'income'],
            description: '入出金方向（行レベル）',
          },
          balance: {
            type: Type.NUMBER,
            nullable: true,
            description: '残高。通帳のみ有効。クレカ・レシートはnull',
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
// System Instruction（Step 0-1専用、軽量版）
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
- classify_reason: 判定根拠。なぜそのsource_typeを選んだかを日本語で1、2文で説明。例:「『領収書』の表記があり、POSレシート形式」
- document_count: 画像内に独立した情報源が何個あるかを数える。純粋に1枚の証票だけが写っている場合のみ1を返す。以下のケースは全て2以上: 複数の証票が並んでいるまたは重なっている / 証票以外のもの（他の書類・画面等）が同時に写っている。必ず整数で返す。
- document_count_reason: 上記document_countの判定根拠。画像の端・背景・重なり部分に他の書類や証票の片鲞が写っていないかを確認し、その結果を日本語で1、2文で説明。例:「主証票の左下に別のレシートの端が見える」「証票以外のものは写っていない」
- line_items: 行データ配列。各行のamountは必ず正の整数。入出金はdirectionで区別。`;

/** プロンプト生成: ベース + キーワード集（外部） + ルール */
const SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTION_BASE + buildKeywordsPrompt() + SYSTEM_INSTRUCTION_RULES;

const REQUEST_PROMPT = `この証票画像を分析し、証票種別と仕訳方向を判定し、行データを抽出してください。`;

// ============================================================
// 画像前処理 → image_preprocessor.ts に委譲
// ============================================================

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

  // ①-0 SHA-256重複チェック（フロントから送られたハッシュをサーバー側Setで照合）
  let isDuplicate = false;
  if (req.fileHash) {
    if (knownFileHashes.has(req.fileHash)) {
      isDuplicate = true;
      console.log(`[pipeline/service] 重複検出: ${filename} (hash=${req.fileHash.slice(0, 12)}...)`);
    } else {
      knownFileHashes.add(req.fileHash);
    }
  }

  // ① 前処理（image_preprocessor.ts に委譲）
  const inputBuffer = Buffer.from(req.image, 'base64');
  const originalSize = inputBuffer.length;
  let ppData: string;
  let ppMimeType: string;
  let ppSize: number;
  let ppPreprocessed: boolean;

  try {
    const ppResult = await preprocessImage(inputBuffer, req.mimeType as MimeType);
    ppData = ppResult.base64;
    ppMimeType = ppResult.mimeType;
    ppSize = ppResult.buffer.length;
    ppPreprocessed = true;

    const reduction = ((1 - ppSize / originalSize) * 100).toFixed(0);
    console.log(`[pipeline/preprocess] ${(originalSize / 1024).toFixed(0)}KB → ${(ppSize / 1024).toFixed(0)}KB (${reduction}%削減)`);
  } catch (err) {
    console.warn(`[pipeline/preprocess] 前処理失敗、生画像で続行:`, err);
    ppData = req.image;
    ppMimeType = req.mimeType;
    ppSize = originalSize;
    ppPreprocessed = false;
  }

  console.log(`[pipeline/service] classify開始: ${filename} (${ppMimeType}, ${Math.round(ppSize / 1024)}KB, 前処理=${ppPreprocessed})`);

  let raw: ClassifyRawResponse | null = null;
  let promptTokens = 0;
  let completionTokens = 0;
  let thinkingTokens = 0;
  let error: string | null = null;

  try {
    const ai = getAI();

    const response = await ai.models.generateContent({
      model: getModelId(),
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: ppMimeType, data: ppData } },
            { text: REQUEST_PROMPT },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: CLASSIFY_SCHEMA,
        temperature: 0,
        thinkingConfig: {
          thinkingBudget: 2048,
        },
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
  const totalTokens = promptTokens + completionTokens;
  // gemini-2.5-flash料金: 入力$0.15/1M, 出力$0.60/1M, thinking$3.50/1M (1USD=150JPY)
  const costYen = (
    (promptTokens * 0.15 / 1_000_000) +
    (completionTokens * 0.60 / 1_000_000) +
    (thinkingTokens * 3.50 / 1_000_000)
  ) * 150;

  const result = postprocessClassify(raw, {
    duration_ms: durationMs,
    duration_seconds: Math.round(durationMs / 100) / 10,  // 小数1桁
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    thinking_tokens: thinkingTokens,
    token_count: totalTokens,
    cost_yen: Math.round(costYen * 10000) / 10000,  // 小数4桁
    model: getModelId(),
    original_size_kb: Math.round(originalSize / 1024),
    processed_size_kb: Math.round(ppSize / 1024),
    preprocess_reduction_pct: Math.round((1 - ppSize / originalSize) * 100),
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

  // バリデーション（postprocess後に実行）
  const validation = validateClassifyResult(result);
  result.validation = {
    ok: validation.ok,
    errorReason: validation.errorReason,
    warning: validation.warning,
    supplementary: validation.supplementary,
    isDuplicate,
  };

  // fileHashをレスポンスに含める（フロントでのグループ化・重複表示用）
  result.fileHash = req.fileHash;

  return result;
}
