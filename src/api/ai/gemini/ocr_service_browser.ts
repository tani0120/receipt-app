/**
 * Gemini OCR Service（ブラウザ版・@google/genai SDK）
 *
 * Node.js版のocr_service.tsをブラウザ環境に移植
 *
 * 主な変更点:
 * - readFileSync → FileReader API
 * - import.meta.env でAPI Key取得
 */

import { GoogleGenAI } from '@google/genai';
import { OCR_DETAILED_PROMPT } from '../../../constants/aiPrompts';
import type { AIIntermediateOutput } from '../../../types/GeminiOCR.types';

/**
 * ブラウザ版: API経由でプロンプト本文を取得（フォールバック: 定数）
 */
async function getPromptContentBrowser(promptId: string): Promise<string> {
  try {
    const res = await fetch(`/api/ai-prompts/${promptId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.content ?? '';
  } catch {
    // API未起動・エラー時は定数にフォールバック
    if (promptId === 'ocr-detailed') return OCR_DETAILED_PROMPT;
    return '';
  }
}

/**
 * Gemini OCR実行（ブラウザ版）
 */
export async function executeOCRBrowser(
    imageFile: File,
    clientId: string = 'CL-001'
): Promise<AIIntermediateOutput> {
    console.log(`🔍 [Browser] OCR実行開始: ${imageFile.name}, clientId: ${clientId}`);

    const base64Image = await fileToBase64(imageFile);

    const responseText = await callGeminiAPIBrowser(
        base64Image,
        imageFile.type,
        []
    );

    const rawJSON = extractJSONFromResponse(responseText);

    console.log(`✅ [Browser] OCR完了`);

    return rawJSON as AIIntermediateOutput;
}

/**
 * File → Base64変換（ブラウザ専用）
 */
async function fileToBase64(file: File): Promise<string> {
    console.log('[fileToBase64] 開始', {
        type: typeof file,
        isFile: file instanceof File,
        isBlob: file instanceof Blob,
        name: file?.name,
        size: file?.size
    });

    if (!(file instanceof File)) {
        console.error('[fileToBase64] File object expected, got:', file);
        throw new Error(`Expected File object, got ${typeof file}`);
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            console.log('[fileToBase64] 成功', {
                base64Length: base64?.length
            });
            resolve(base64 ?? '');
        };

        reader.onerror = () => {
            console.error('[fileToBase64] FileReader error');
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Gemini API呼び出し（ブラウザ版・@google/genai SDK）
 */
async function callGeminiAPIBrowser(
    base64Image: string,
    mimeType: string,
    _batchHistory: unknown[]
): Promise<string> {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    if (!API_KEY) {
        throw new Error('VITE_GEMINI_API_KEY が設定されていません');
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        console.log('📤 [Browser] Gemini API呼び出し中...');

        const result = await ai.models.generateContent({
            model: import.meta.env.VITE_MODEL_ID || 'gemini-3.1-flash-lite',
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Image
                            }
                        },
                        {
                            text: await getPromptContentBrowser('ocr-detailed')
                        }
                    ]
                }
            ],
        });

        const responseText = result.text ?? '';

        // トークン使用量を取得
        const usageMetadata = result.usageMetadata;
        if (usageMetadata) {
            console.log('📊 [Browser] トークン使用量:', {
                promptTokenCount: usageMetadata.promptTokenCount,
                candidatesTokenCount: usageMetadata.candidatesTokenCount,
                totalTokenCount: usageMetadata.totalTokenCount
            });

            const inputTokens = usageMetadata.promptTokenCount ?? 0;
            const outputTokens = usageMetadata.candidatesTokenCount ?? 0;

            // Gemini 2.5 Flash料金で実コスト計算（$1=¥150）
            const inputCost = (inputTokens / 1_000_000) * 0.15 * 150;
            const outputCost = (outputTokens / 1_000_000) * 0.60 * 150;
            const totalCost = inputCost + outputCost;

            console.log('💰 [Browser] 推定コスト:', {
                入力: `¥${inputCost.toFixed(4)}`,
                出力: `¥${outputCost.toFixed(4)}`,
                合計: `¥${totalCost.toFixed(4)}`
            });
        }

        console.log(`✅ [Browser] Gemini API呼び出し成功`);

        return responseText;
    } catch (error) {
        console.error('❌ [Browser] Gemini API呼び出し失敗:', error);
        throw new Error(`Gemini API call failed: ${error}`);
    }
}

/**
 * レスポンスからJSON抽出
 */
function extractJSONFromResponse(responseText: string): unknown {
    const jsonMatch = responseText.match(/```json\s*\n([\s\S]*?)\n```/);

    if (jsonMatch) {
        return JSON.parse(jsonMatch[1] ?? '{}');
    }

    try {
        return JSON.parse(responseText);
    } catch {
        console.error('JSON解析失敗:', responseText);
        throw new Error('Invalid JSON response from Gemini');
    }
}
