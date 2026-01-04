
import { VertexAI } from '@google-cloud/vertexai';
import type { AIProvider, ModelInfo, ReceiptAnalysisResult } from '../types';

export class VertexAIStrategy implements AIProvider {
    private client: VertexAI;
    private location = 'us-central1'; // Default for batch jobs

    constructor(projectId: string, location = 'us-central1') {
        this.client = new VertexAI({ project: projectId, location });
        this.location = location;
    }

    async listAvailableModels(): Promise<ModelInfo[]> {
        // In real world, we might query Model Garden API, but for now hardcode known good models
        return [
            {
                id: 'gemini-1.5-pro-002',
                name: 'Vertex Gemini 1.5 Pro (002)',
                provider: 'vertex_ai',
                capabilities: { batch: true, image: true }
            },
            {
                id: 'gemini-1.5-flash-002',
                name: 'Vertex Gemini 1.5 Flash (002)',
                provider: 'vertex_ai',
                capabilities: { batch: true, image: true }
            }
        ];
    }

    async analyzeReceipt(gcsUri: string, modelId?: string): Promise<ReceiptAnalysisResult> {
        const finalModelId = modelId || 'gemini-1.5-flash-002'; // Default fallback
        const generativeModel = this.client.getGenerativeModel({ model: finalModelId });

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

        const request = {
            contents: [{
                role: 'user',
                parts: [
                    { text: prompt },
                    { fileData: { fileUri: gcsUri, mimeType: 'image/jpeg' } } // Vertex Accesses GCS directly
                ]
            }]
        };

        const result = await generativeModel.generateContent(request);
        const candidates = result.response.candidates;
        const responseText = candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        // Clean markdown code blocks if present
        const jsonStr = responseText.replace(/```json\n?|\n?```/g, '');

        try {
            return JSON.parse(jsonStr) as ReceiptAnalysisResult;
        } catch (unknown) {
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
