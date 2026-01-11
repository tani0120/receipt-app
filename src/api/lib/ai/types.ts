
export type AIProviderType = 'vertex_ai' | 'ai_studio';

export type AIPhase = 'ocr' | 'learning' | 'conversion' | 'optimization';

export interface PhaseConfig {
    provider: AIProviderType;
    mode: 'realtime' | 'batch';
    model: string;
}

// Model information structure for UI dropdown
export interface ModelInfo {
    id: string;        // e.g., 'gemini-1.5-pro-002'
    name: string;      // e.g., 'Gemini 1.5 Pro (Preview)'
    provider: AIProviderType;
    capabilities: {
        batch: boolean;
        image: boolean;
    };
}

export interface ReceiptAnalysisResult {
    date: string;
    totalAmount: number;
    merchantName?: string;
    items?: Array<{
        name: string;
        amount: number;
    }>;
    rawResponse?: string;
}

export interface AIProvider {
    /**
     * Get available models for this provider (for UI selection)
     */
    listAvailableModels(): Promise<ModelInfo[]>;

    /**
     * Analyze a receipt image
     * @param gcsUri Image URI starting with gs://
     * @param modelId Model ID to use (optional, uses factory-configured default if omitted)
     */
    analyzeReceipt(gcsUri: string, modelId?: string): Promise<ReceiptAnalysisResult>;

    /**
     * Create a batch processing job (Optional)
     */
    createBatchJob?(gcsUris: string[], modelId?: string): Promise<string>;
}
