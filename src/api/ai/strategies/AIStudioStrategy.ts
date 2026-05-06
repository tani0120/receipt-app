
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import type { AIProvider, ModelInfo, ReceiptAnalysisResult } from '../types';

export class AIStudioStrategy implements AIProvider {
    private client: GoogleGenAI;

    constructor(apiKey: string) {
        this.client = new GoogleGenAI({ apiKey });
    }

    async listAvailableModels(): Promise<ModelInfo[]> {
        return [
            {
                id: 'gemini-2.5-flash',
                name: 'Gemini 2.5 Flash',
                provider: 'ai_studio',
                capabilities: { batch: false, image: true }
            },
            {
                id: 'gemini-2.5-pro',
                name: 'Gemini 2.5 Pro',
                provider: 'ai_studio',
                capabilities: { batch: false, image: true }
            },
        ];
    }

    async analyzeReceipt(storagePath: string, modelId?: string): Promise<ReceiptAnalysisResult> {
        const finalModelId = modelId || 'gemini-2.5-flash';

        // Supabase Storageからファイルをダウンロード
        const fileBuffer = await this.downloadFile(storagePath);

        // Base64に変換してAI Studioに送信
        const base64Data = fileBuffer.toString('base64');

        const prompt = `
            Analyze this receipt image and extract the following JSON:
            {
                "date": "YYYY-MM-DD",
                "totalAmount": 1234,
                "merchantName": "Store Name",
                "items": [{"name": "item", "amount": 100}]
            }
            Return ONLY raw JSON.
        `;

        const result = await this.client.models.generateContent({
            model: finalModelId,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                data: base64Data,
                                mimeType: 'image/jpeg'
                            }
                        }
                    ]
                }
            ],
        });

        const responseText = result.text ?? '';
        const jsonStr = responseText.replace(/```json\n?|\n?```/g, '');

        try {
            return JSON.parse(jsonStr) as ReceiptAnalysisResult;
        } catch (error) {
            console.error('Failed to parse AI response', jsonStr, error);
            throw new Error('AI Response was not valid JSON');
        }
    }

    /**
     * Supabase Storageからファイルをダウンロード
     * storagePath = "receipts/path/to/file.jpg"
     */
    private async downloadFile(storagePath: string): Promise<Buffer> {
        const url = process.env.SUPABASE_URL
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!url || !key) {
            throw new Error('[AIStudioStrategy] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です')
        }
        const supabase = createClient(url, key)

        const parts = storagePath.split('/')
        const bucket = parts[0]
        const filePath = parts.slice(1).join('/')

        if (!bucket || !filePath) {
            throw new Error(`[AIStudioStrategy] 不正なパス: ${storagePath}`)
        }

        const { data, error } = await supabase.storage
            .from(bucket)
            .download(filePath)

        if (error || !data) {
            throw new Error(`[AIStudioStrategy] ダウンロード失敗: ${error?.message ?? '不明'}`)
        }

        const arrayBuffer = await data.arrayBuffer()
        return Buffer.from(arrayBuffer)
    }
}
