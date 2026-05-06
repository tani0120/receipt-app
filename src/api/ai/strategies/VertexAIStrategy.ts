
import { GoogleGenAI } from '@google/genai';
import type { AIProvider, ModelInfo, ReceiptAnalysisResult } from '../types';

export class VertexAIStrategy implements AIProvider {
    private client: GoogleGenAI;

    constructor(projectId: string, location = 'us-central1') {
        this.client = new GoogleGenAI({ vertexai: true, project: projectId, location });
    }

    async listAvailableModels(): Promise<ModelInfo[]> {
        return [
            {
                id: 'gemini-2.5-flash',
                name: 'Vertex Gemini 2.5 Flash',
                provider: 'vertex_ai',
                capabilities: { batch: true, image: true }
            },
            {
                id: 'gemini-2.5-pro',
                name: 'Vertex Gemini 2.5 Pro',
                provider: 'vertex_ai',
                capabilities: { batch: true, image: true }
            },
        ];
    }

    async analyzeReceipt(gcsUri: string, modelId?: string): Promise<ReceiptAnalysisResult> {
        const finalModelId = modelId || 'gemini-2.5-flash';

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
                        { fileData: { fileUri: gcsUri, mimeType: 'image/jpeg' } }
                    ]
                }
            ],
        });

        const responseText = result.text ?? '{}';

        // Clean markdown code blocks if present
        const jsonStr = responseText.replace(/```json\n?|\n?```/g, '');

        try {
            return JSON.parse(jsonStr) as ReceiptAnalysisResult;
        } catch {
            console.error('Failed to parse AI response', jsonStr);
            throw new Error('AI Response was not valid JSON');
        }
    }

    // Example stub for Batch API
    async createBatchJob(gcsUris: string[], modelId: string): Promise<string> {
        console.log(`[VertexAI] Creating Batch Job for ${gcsUris.length} files using ${modelId}`);
        // Logic to construct JSONL file on GCS and submit batch job would go here
        return 'batch-job-id-mock-12345';
    }
}
