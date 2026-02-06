/**
 * Vertex AI OCR Service
 *
 * Vertex AI + Context Cacheを使用したOCR実行
 * - ADC（Application Default Credentials）認証
 * - Context Cache活用（System Instruction含む）
 * - べき等性維持（Phase 6.2と同等）
 */

import { VertexAI } from '@google-cloud/vertexai';
import { getOrCreateCache } from './cache_manager_vertex';
import type { AIIntermediateOutput } from '../gemini/schemas';

/**
 * Vertex AI OCR実行
 *
 * @param imageFile - File object（Node.js環境）
 * @param clientId - クライアントID
 * @param projectId - GCPプロジェクトID
 * @param location - リージョン
 * @returns AIIntermediateOutput
 */
export async function executeOCRVertex(
    imageBase64: string,
    mimeType: string,
    clientId: string = 'CL-001',
    projectId: string = 'sugu-suru',
    location: string = 'asia-northeast1'
): Promise<AIIntermediateOutput> {
    console.log(`🔍 [Vertex] OCR実行開始: clientId=${clientId}`);

    // 使用モデル（定数）
    const MODEL_NAME = 'gemini-2.5-flash';

    // Context Cache取得
    const cacheInfo = await getOrCreateCache({
        client_id: clientId,
        master_file_path: 'master_data.txt', // Phase 6.3: 固定値
        projectId,
        location,
        model_name: MODEL_NAME  // モデル名を渡す
    });

    console.log(`[Vertex] Cache取得完了: ${cacheInfo.cacheName}`);

    // Vertex AI呼び出し
    const responseText = await callVertexAI(
        imageBase64,
        mimeType,
        cacheInfo.cacheName,
        projectId,
        location,
        MODEL_NAME  // モデル名を渡す
    );

    // レスポンスJSON抽出
    const rawJSON = extractJSONFromResponse(responseText);

    console.log(`✅ [Vertex] OCR完了`);

    return rawJSON as AIIntermediateOutput;
}

/**
 * Vertex AI呼び出し
 *
 * @param imageBase64 - Base64エンコード画像
 * @param mimeType - MIMEタイプ
 * @param cacheName - Cache名（文字列）
 * @param projectId - GCPプロジェクトID
 * @param location - リージョン
 * @returns レスポンステキスト
 */
async function callVertexAI(
    imageBase64: string,
    mimeType: string,
    cacheName: string,
    projectId: string,
    location: string,
    modelName: string  // 追加
): Promise<string> {
    const vertexAI = new VertexAI({
        project: projectId,
        location: location
    });

    try {
        // Cached Content参照でモデル取得
        // SDK API: getGenerativeModelFromCachedContent(cachedContent, modelParams?, requestOptions?)
        // 第1引数は { name, model } を持つオブジェクトを直接渡す
        const model = vertexAI.preview.getGenerativeModelFromCachedContent({
            name: cacheName,
            model: modelName  // パラメータを使用
        });

        console.log('📤 [Vertex] Gemini API呼び出し中...');

        // プロンプト（べき等性向上版）
        const prompt = `【画像を確認してJSONのみを出力してください】

この画像は領収書です。以下のJSON形式で出力してください。説明文やMarkdownは不要です。

{
  "category": "RECEIPT",
  "vendor": "店名（画像から正確に読み取る）",
  "date": "YYYY-MM-DD",
  "total_amount": 数値,
  "t_number": "T番号（13桁の数字がある場合）または null",
  "tax_items": [{"rate": 10, "net": 税抜額, "tax": 消費税}],
  "inferred_category": "勘定科目（下記ルール参照）",
  "explanation": "選択理由（1文）"
}

【inferred_category決定ルール（厳守）】
1. T番号マスタに一致 → T番号マスタの科目を使用
2. T番号マスタに不一致または無し → 以下の判断基準で決定:
   - 飲食店での個人的な食事 → 「飲食費」
   - 居酒屋・バー・料亭 → 「接待交際費」
   - 金額10,000円以上の飲食 → 「接待交際費」
   - その他軽食・コンビニ → 「飲食費」
   - 判断困難 → 「仮払金」

【べき等性ルール（最重要）】
- 同じ画像には常に同じ結果を返してください
- 店名が飲食店で金額10,000円未満なら「飲食費」を選択
- 迷った場合は「飲食費」を選択

【出力形式】
- JSONオブジェクトのみ出力
- コードブロック不要
- 説明文不要`;

        // API呼び出し（画像データを含むリクエスト）
        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: imageBase64
                        }
                    },
                    {
                        text: prompt
                    }
                ]
            }]
        });

        // レスポンス構造をデバッグ
        console.log('🔍 [Debug] result.response:', JSON.stringify(result.response, null, 2).substring(0, 500));

        const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('🔍 [Debug] responseText length:', responseText.length);

        // トークン使用量を取得
        const usageMetadata = result.response.usageMetadata;
        if (usageMetadata) {
            console.log('📊 [Vertex] トークン使用量:', {
                promptTokenCount: usageMetadata.promptTokenCount,
                candidatesTokenCount: usageMetadata.candidatesTokenCount,
                totalTokenCount: usageMetadata.totalTokenCount,
                cachedContentTokenCount: usageMetadata.cachedContentTokenCount || 0
            });

            // Gemini 2.5 Flash料金で実コスト計算（$1=¥150）
            const cachedTokens = usageMetadata.cachedContentTokenCount || 0;
            const inputTokens = usageMetadata.promptTokenCount || 0;
            const outputTokens = usageMetadata.candidatesTokenCount || 0;

            // モデル別料金定義（Vertex AI）
            const PRICING_FLASH = {
                name: 'Gemini 2.5 Flash',
                INPUT_NORMAL: 0.30 / 1_000_000,   // $0.30 per 1M tokens
                INPUT_CACHED: 0.03 / 1_000_000,   // $0.03 per 1M tokens (90% discount)
                OUTPUT: 2.50 / 1_000_000,         // $2.50 per 1M tokens
            };
            const PRICING_PRO = {
                name: 'Gemini 2.5 Pro',
                INPUT_NORMAL: 3.50 / 1_000_000,   // $3.50 per 1M tokens
                INPUT_CACHED: 0.875 / 1_000_000,  // $0.875 per 1M tokens (75% discount)
                OUTPUT: 10.50 / 1_000_000,        // $10.50 per 1M tokens
            };
            const EXCHANGE_RATE = 150;  // $1 = ¥150

            // 使用モデルに基づいて料金選択
            const PRICING = modelName.includes('pro') ? PRICING_PRO : PRICING_FLASH;

            // 計算ロジック（マイナス値を防止）
            const costCache = cachedTokens * PRICING.INPUT_CACHED * EXCHANGE_RATE;
            const nonCachedTokens = Math.max(0, inputTokens - cachedTokens);
            const costInput = nonCachedTokens * PRICING.INPUT_NORMAL * EXCHANGE_RATE;
            const costOutput = outputTokens * PRICING.OUTPUT * EXCHANGE_RATE;
            const totalCost = costCache + costInput + costOutput;

            console.log(`💰 [Vertex] 推定コスト (${PRICING.name}):`, {
                'Cache入力': `¥${costCache.toFixed(4)} (${cachedTokens} tokens)`,
                '通常入力': `¥${costInput.toFixed(4)} (${inputTokens - cachedTokens} tokens)`,
                '出力': `¥${costOutput.toFixed(4)} (${outputTokens} tokens)`,
                '合計': `¥${totalCost.toFixed(4)}`
            });
        }

        console.log(`✅ [Vertex] API呼び出し成功`);

        return responseText;
    } catch (error) {
        console.error('❌ [Vertex] API呼び出し失敗:', error);
        throw new Error(`Vertex AI call failed: ${error}`);
    }
}

/**
 * レスポンスからJSON抽出
 *
 * Geminiは ```json ... ``` 形式で返すことが多い
 *
 * @param responseText - レスポンステキスト
 * @returns JSON object
 */
function extractJSONFromResponse(responseText: string): any {
    // パターン1: マークダウンコードブロック (```json ... ```)
    const jsonCodeBlockMatch = responseText.match(/```json\s*\n([\s\S]*?)\n```/);
    if (jsonCodeBlockMatch) {
        try {
            return JSON.parse(jsonCodeBlockMatch[1]);
        } catch {
            // パース失敗時は次のパターンへ
        }
    }

    // パターン2: 通常のコードブロック (``` ... ```)
    const codeBlockMatch = responseText.match(/```\s*\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
        try {
            return JSON.parse(codeBlockMatch[1]);
        } catch {
            // パース失敗時は次のパターンへ
        }
    }

    // パターン3: テキスト内のJSONオブジェクトを探す
    const jsonObjectMatch = responseText.match(/\{[\s\S]*"category"[\s\S]*\}/);
    if (jsonObjectMatch) {
        try {
            return JSON.parse(jsonObjectMatch[0]);
        } catch {
            // パース失敗時は次のパターンへ
        }
    }

    // パターン4: 直接パース
    try {
        return JSON.parse(responseText);
    } catch {
        console.error('JSON解析失敗。レスポンス冒頭500文字:', responseText.substring(0, 500));
        throw new Error('Invalid JSON response from Vertex AI');
    }
}
