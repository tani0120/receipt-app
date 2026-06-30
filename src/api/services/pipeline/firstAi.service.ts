/**
 * パイプライン firstAi service（AI呼び出し層）
 *
 * レイヤー: route → ★service★ → postprocess
 * 責務: Vertex AI呼び出し + ログ出力。ビジネスロジックは postprocess に委譲。
 *
 * 経緯: 元々previewExtract（事前分類）と本番AI（Extract API）を分離する設計だったが、
 *       ドライブ・独自アップロードでAI呼び出ししない決定後、firstAiに統一リネーム。
 *       本ファイルが唯一のAI呼び出し（証票分類 + 仕訳行抽出）。
 */

import { GoogleGenAI } from '@google/genai';
import { Type } from '@google/genai';
import { resolveLocation } from '../../ai/AIProviderFactory';
import { getDefaultModelId, MODEL_PRICING, USD_JPY_RATE } from '../../ai/modelConfig';
import { preprocessImage } from './image_preprocessor';
import type { MimeType } from './image_preprocessor';
import { buildKeywordsPrompt } from './source_type_keywords';
import type {
  FirstAiRequest,
  FirstAiRawResponse,
  FirstAiResponse,
  PipelineLogEntry,
} from './types';
import { postprocessFirstAi } from './postprocess';
import type { CalculationMethod } from './postprocess';
import { validateFirstAiResult } from './validateFirstAiResult';
import { determineAccount } from './accountDetermination';
import { createMockRepositories } from '../../../repositories/mock'
const repos = createMockRepositories()
const learningRuleRepo = repos.learningRule
const industryVectorRepo = repos.industryVector
const clientRepo = repos.client
const accountMasterRepo = repos.accountMaster
import { isIndividualType } from '../../../constants/clientOptions';
import {
  DESC_SOURCE_TYPE, DESC_SOURCE_TYPE_CONFIDENCE,
  DESC_DIRECTION, DESC_DIRECTION_CONFIDENCE,
  DESC_EXTRACT_REASON, DESC_DOCUMENT_COUNT, DESC_DOCUMENT_COUNT_REASON,
  DESC_DESCRIPTION, DESC_ISSUER_NAME, DESC_DATE, DESC_TOTAL_AMOUNT,
  DESC_LINE_ITEMS, DESC_LINE_DATE, DESC_LINE_DESCRIPTION,
  DESC_LINE_AMOUNT, DESC_LINE_DIRECTION, DESC_LINE_BALANCE,
  REQUEST_PROMPT,
} from './schemaDescriptions';

// ============================================================
// 設定
// ============================================================

// SHA-256重複チェック用（メモリ内Set。Supabase移行時はDB照合に差替）
const knownFileHashes = new Set<string>();

/** doc-storeの既存ファイルハッシュをknownFileHashesにロード */
export async function loadKnownHashesFromDocStore(): Promise<void> {
  // 動的importで循環参照回避
  const { getDocuments } = await import('../documentsApi');
  const docs = getDocuments();
  let count = 0;
  for (const d of docs) {
    if (d.fileHash) {
      knownFileHashes.add(d.fileHash);
      count++;
    }
  }
  console.log(`[pipeline] knownFileHashes: doc-storeから${count}件ロード`);
}

// 起動時にdoc-store既存ハッシュをロード
loadKnownHashesFromDocStore();

/** 重複ハッシュ記録をクリア → doc-store既存ハッシュを再ロード */
export function clearKnownHashes(): void {
  knownFileHashes.clear();
  loadKnownHashesFromDocStore();
}

/** 既知ハッシュかどうか確認（重複検出用） */
export function isKnownHash(hash: string): boolean {
  return knownFileHashes.has(hash);
}

// シングルトン（リクエスト毎に生成しない）
let _ai: GoogleGenAI | null = null;
let _aiLocation: string | null = null;

function getAI(): GoogleGenAI {
  const modelId = getModelId();
  const location = resolveLocation(modelId);

  // locationが変わったらクライアントを再生成
  if (!_ai || _aiLocation !== location) {
    const projectId = process.env['VERTEX_PROJECT_ID'] ?? '';
    if (!projectId) {
      throw new Error('VERTEX_PROJECT_ID 環境変数が未設定です');
    }
    _ai = new GoogleGenAI({ vertexai: true, project: projectId, location });
    _aiLocation = location;
    console.log(`[pipeline] ✅ Vertex AI初期化: project=${projectId}, location=${location}, model=${modelId}`);
  }
  return _ai;
}

function getModelId(): string {
  return getDefaultModelId();
}

// ============================================================
// firstAi用 Structured Output Schema
// ============================================================

const FIRST_AI_SCHEMA = {
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
    first_ai_reason: {
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
    is_credit_card_payment: {
      type: Type.BOOLEAN,
      description: 'source_typeが receipt または receipt_issued の場合のみ判定。証票に「クレジット」「カード」「VISA」「Mastercard」「JCB」「AMEX」「デビット」「電子マネー」「iD」「QUICPay」「PayPay」等の記載がある場合はtrue。現金払いまたは支払方法不明の場合はfalse。receipt/receipt_issued以外の場合はfalse。',
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
- first_ai_reason: 判定根拠。なぜそのsource_typeを選んだかを日本語で1、2文で説明。例:「『領収書』の表記があり、POSレシート形式」
- document_count: 画像内に独立した情報源が何個あるかを数える。純粋に1枚の証票だけが写っている場合のみ1を返す。以下のケースは全て2以上: 複数の証票が並んでいるまたは重なっている / 証票以外のもの（他の書類・画面等）が同時に写っている。必ず整数で返す。
- document_count_reason: 上記document_countの判定根拠。画像の端・背景・重なり部分に他の書類や証票の片鲞が写っていないかを確認し、その結果を日本語で1、2文で説明。例:「主証票の左下に別のレシートの端が見える」「証票以外のものは写っていない」
- line_items: 行データ配列。各行のamountは必ず正の整数。入出金はdirectionで区別。
- is_credit_card_payment: source_typeがreceiptまたはreceipt_issuedの場合のみ判定。証票画像内に「クレジット」「カード」「VISA」「Mastercard」「JCB」「AMEX」「デビット」「電子マネー」「iD」「QUICPay」「PayPay」等の記載があればtrue。現金払い・支払方法不明・receipt/receipt_issued以外はfalse。`;

/** プロンプト生成: ベース + キーワード集（外部） + ルール */
const SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTION_BASE + buildKeywordsPrompt() + SYSTEM_INSTRUCTION_RULES;



// ============================================================
// 画像前処理 → image_preprocessor.ts に委譲
// ============================================================

// ============================================================
// メイン関数
// ============================================================

/**
 * 画像1枚のfirstAi（証票AI分類 + 仕訳行抽出）を実行する。
 * AI呼び出し失敗時もfallbackレスポンスを返す（例外を投げない）。
 */
export async function firstAiExtract(req: FirstAiRequest): Promise<FirstAiResponse> {
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

  console.log(`[pipeline/service] firstAi開始: ${filename} (${ppMimeType}, ${Math.round(ppSize / 1024)}KB, 前処理=${ppPreprocessed})`);

  let raw: FirstAiRawResponse | null = null;
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
        responseSchema: FIRST_AI_SCHEMA,
        temperature: 0,
        // 思考機能: gemini-3.1-flash-liteは思考なし、それ以外は2048トークン
        ...(getModelId().includes('flash-lite') ? {} : { thinkingConfig: { thinkingBudget: 2048 } }),
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
      raw = JSON.parse(responseText) as FirstAiRawResponse;
    }
  } catch (err) {
    error = String(err);
    console.error(`[pipeline/service] AI呼び出し失敗: ${error}`);
  }

  const durationMs = Date.now() - startTime;

  // ログ出力（④ ログ絶対入れる）
  const logEntry: PipelineLogEntry = {
    timestamp: new Date().toISOString(),
    step: 'first-ai',
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
  const modelId = getModelId();

  // モデル別料金テーブル（modelConfig.ts一元管理）
  const price = MODEL_PRICING[modelId] ?? MODEL_PRICING[getDefaultModelId()]!;
  const costYen = (
    (promptTokens * price.input / 1_000_000) +
    (completionTokens * price.output / 1_000_000) +
    (thinkingTokens * price.thinking / 1_000_000)
  ) * USD_JPY_RATE;

  // 顧問先のcalculationMethodを取得（ProcessingMode動的分岐用）
  let calculationMethod: CalculationMethod | undefined;
  if (req.clientId) {
    const client = await clientRepo.getById(req.clientId);
    if (client?.calculationMethod) {
      calculationMethod = client.calculationMethod as CalculationMethod;
    }
  }

  const result = postprocessFirstAi(raw, {
    duration_ms: durationMs,
    duration_seconds: Math.round(durationMs / 100) / 10,  // 小数1桁
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    thinking_tokens: thinkingTokens,
    token_count: totalTokens,
    cost_yen: Math.round(costYen * 10000) / 10000,  // 小数4桁
    model: modelId,
    original_size_kb: Math.round(originalSize / 1024),
    processed_size_kb: Math.round(ppSize / 1024),
    preprocess_reduction_pct: Math.round((1 - ppSize / originalSize) * 100),
  }, calculationMethod);

  // ログにpostprocess結果を追加
  logEntry.postprocess = {
    source_type: result.source_type,
    direction: result.direction,
    processing_mode: result.processing_mode,
    fallback_applied: result.fallback_applied,
  };

  // ━━ 人間向けサマリログ ━━
  const srcType = result.source_type ?? '不明';
  const dir = result.direction ?? '不明';
  const amt = raw?.total_amount != null ? `¥${raw.total_amount.toLocaleString()}` : '-';
  const issuer = raw?.issuer_name ?? '-';
  const lineCount = raw?.line_items?.length ?? 0;
  const dSec = (durationMs / 1000).toFixed(1);
  console.log(
    `[pipeline] 📄 ${filename} → ${srcType}(${dir}) | ${issuer} ${amt} | ` +
    `${lineCount}行 | ${dSec}秒 ¥${costYen.toFixed(2)} | ${modelId} ` +
    `[in=${promptTokens} out=${completionTokens} think=${thinkingTokens}]`
  );
  if (error) console.error(`[pipeline] ❌ エラー: ${error}`);
  if (result.fallback_applied) console.warn(`[pipeline] ⚠️ フォールバック適用`);

  // ━━ 詳細ログ（元のJSON出力を維持）━━
  console.log(`[pipeline/service] firstAi完了:`, JSON.stringify(logEntry, null, 0));

  // ━━ Step4-C: 科目確定（辞書接続）━━━━━━━━━━━━━━━━━━
  // fallback未適用（AI正常応答）の場合のみ、line_items毎に科目確定を実行
  if (!result.fallback_applied && result.line_items.length > 0) {
    // 学習ルール取得（顧問先ごと。LearningRuleRepository経由）
    const { rules: learningRules } = await learningRuleRepo.getByClientId(req.clientId)

    // 業種辞書取得（Client.typeで法人/個人を切り替え。IndustryVectorRepository経由）
    const client = await clientRepo.getById(req.clientId)
    const businessType = isIndividualType(client?.type) ? 'sole' as const : 'corporate' as const
    const industryVectors = await industryVectorRepo.getAll(businessType)

    for (const li of result.line_items) {
      const acctResult = await determineAccount({
        vendorNameRaw: result.issuer_name,
        description: li.description,
        amount: li.amount,
        direction: li.direction,
        sourceType: result.source_type,
        clientId: req.clientId,
        tNumberRaw: null,       // 現時点ではinvoice_numberは未抽出
        learningRules,
        industryVectors,
        // B-1: 科目マスタを渡して第5層AI推定を有効化
        accountMaster: (await accountMasterRepo.getClientAccountsFull(req.clientId)).accounts.map(a => ({
          accountId: a.accountId,
          name: a.name,
          defaultTaxCategoryId: a.defaultTaxCategoryId,
        })),
      })
      // 科目確定結果をline_itemに設定
      li.vendor_id = acctResult.vendorId
      li.vendor_name = acctResult.vendorName
      li.determined_account = acctResult.determinedAccount
      li.tax_category = acctResult.taxCategory
      li.sub_account = acctResult.subAccount
      li.department = acctResult.department
      li.rule_id = acctResult.ruleId
      li.level = acctResult.level
      li.determination_method = acctResult.determinationMethod
      li.candidates = acctResult.candidates
    }
    const determined = result.line_items.filter(li => li.level === 'A').length
    console.log(`[pipeline/service] 科目確定: ${determined}/${result.line_items.length}件確定`)
  }

  // バリデーション（postprocess後に実行）
  const validation = validateFirstAiResult(result);
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
