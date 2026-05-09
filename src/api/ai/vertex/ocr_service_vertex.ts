/**
 * Vertex AI OCR Service（@google/genai SDK版）
 *
 * @google/genai + vertexai:true を使用したOCR実行
 * - ADC（Application Default Credentials）認証
 * - Context Cache活用（System Instruction含む）
 */

import { GoogleGenAI } from '@google/genai';
import { getPromptContent } from '../../routes/aiPromptRoutes';
import { getOrCreateCache } from './cache_manager_vertex';
import type { AIIntermediateOutput } from '../../../types/GeminiOCR.types';

/**
 * Vertex AI OCR実行
 */
export async function executeOCRVertex(
    imageBase64: string,
    mimeType: string,
    clientId: string = 'CL-001',
    projectId: string = 'sugu-suru',
    location: string = 'asia-northeast1'
): Promise<AIIntermediateOutput> {
    console.log(`🔍 [Vertex] OCR実行開始: clientId=${clientId}`);

    const MODEL_NAME = 'gemini-2.5-flash';

    // Context Cache取得
    const cacheInfo = await getOrCreateCache({
        client_id: clientId,
        master_file_path: 'master_data.txt',
        projectId,
        location,
        model_name: MODEL_NAME
    });

    console.log(`[Vertex] Cache取得完了: ${cacheInfo.cacheName}`);

    // Vertex AI呼び出し
    const responseText = await callVertexAI(
        imageBase64,
        mimeType,
        cacheInfo.cacheName,
        projectId,
        location,
        MODEL_NAME
    );

    // レスポンスJSON抽出
    const rawJSON = extractJSONFromResponse(responseText);

    console.log(`✅ [Vertex] OCR完了`);

    return rawJSON as AIIntermediateOutput;
}

/**
 * Vertex AI呼び出し（@google/genai SDK版）
 */
async function callVertexAI(
    imageBase64: string,
    mimeType: string,
    cacheName: string,
    projectId: string,
    location: string,
    modelName: string
): Promise<string> {
    const ai = new GoogleGenAI({
        vertexai: true,
        project: projectId,
        location: location,
    });

    try {
        console.log('📤 [Vertex] Gemini API呼び出し中...');

        const prompt = await getPromptContent('ocr-vertex');

        const result = await ai.models.generateContent({
            model: modelName,
            contents: [
                {
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
                }
            ],
            config: {
                cachedContent: cacheName,
            },
        });

        const responseText = result.text ?? '';

        // トークン使用量を取得
        const usageMetadata = result.usageMetadata;
        if (usageMetadata) {
            const cachedTokens = usageMetadata.cachedContentTokenCount || 0;
            const inputTokens = usageMetadata.promptTokenCount || 0;
            const outputTokens = usageMetadata.candidatesTokenCount || 0;

            console.log('📊 [Vertex] トークン使用量:', {
                promptTokenCount: inputTokens,
                candidatesTokenCount: outputTokens,
                totalTokenCount: usageMetadata.totalTokenCount,
                cachedContentTokenCount: cachedTokens
            });

            // Gemini 2.5 Flash料金で実コスト計算（$1=¥150）
            const PRICING_FLASH = {
                name: 'Gemini 2.5 Flash',
                INPUT_NORMAL: 0.15 / 1_000_000,
                INPUT_CACHED: 0.0375 / 1_000_000,
                OUTPUT: 0.60 / 1_000_000,
            };
            const PRICING_PRO = {
                name: 'Gemini 2.5 Pro',
                INPUT_NORMAL: 1.25 / 1_000_000,
                INPUT_CACHED: 0.3125 / 1_000_000,
                OUTPUT: 10.00 / 1_000_000,
            };
            const EXCHANGE_RATE = 150;

            const PRICING = modelName.includes('pro') ? PRICING_PRO : PRICING_FLASH;

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
 */
function extractJSONFromResponse(responseText: string): unknown {
    const jsonCodeBlockMatch = responseText.match(/```json\s*\n([\s\S]*?)\n```/);
    if (jsonCodeBlockMatch) {
        try {
            return JSON.parse(jsonCodeBlockMatch[1] ?? '{}');
        } catch {
            // パース失敗時は次のパターンへ
        }
    }

    const codeBlockMatch = responseText.match(/```\s*\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
        try {
            return JSON.parse(codeBlockMatch[1] ?? '{}');
        } catch {
            // パース失敗時は次のパターンへ
        }
    }

    const jsonObjectMatch = responseText.match(/\{[\s\S]*"category"[\s\S]*\}/);
    if (jsonObjectMatch) {
        try {
            return JSON.parse(jsonObjectMatch[0]);
        } catch {
            // パース失敗時は次のパターンへ
        }
    }

    try {
        return JSON.parse(responseText);
    } catch {
        console.error('JSON解析失敗。レスポンス冒頭500文字:', responseText.substring(0, 500));
        throw new Error('Invalid JSON response from Vertex AI');
    }
}
