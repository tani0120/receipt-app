
import { GoogleGenAI } from '@google/genai';
import { getStorage } from 'firebase-admin/storage';
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

    async analyzeReceipt(gcsUri: string, modelId?: string): Promise<ReceiptAnalysisResult> {
        const finalModelId = modelId || 'gemini-2.5-flash';

        // AI Studio cannot access gs:// URIs directly. We must download and send buffer.
        // Helper to download from GCS
        const fileBuffer = await this.downloadFile(gcsUri);

        // Convert buffer to base64 for AI Studio
        // Note: For large files, File API (uploading to AI Studio temporary storage) is better,
        // but for receipts Base64 is usually fine (< 4MB).
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

    private async downloadFile(gcsUri: string): Promise<Buffer> {
        const match = gcsUri.match(/^gs:\/\/([^\/]+)\/(.+)$/);
        if (!match) throw new Error(`Invalid GCS URI: ${gcsUri}`);

        const [, bucketName, filePath] = match;
        if (!bucketName || !filePath) throw new Error(`Invalid Budget Name in URI: ${gcsUri}`);

        const bucket = getStorage().bucket(bucketName);
        const [buffer] = await bucket.file(filePath).download();
        return buffer;
    }
}
