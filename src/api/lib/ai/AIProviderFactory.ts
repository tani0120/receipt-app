import type { AIProvider, AIPhase, PhaseConfig } from './types';
import { VertexAIStrategy } from './strategies/VertexAIStrategy';
import { AIStudioStrategy } from './strategies/AIStudioStrategy';
import { config } from '../../config';
// 2026-04-18: Firebase db参照削除。設定はデフォルト値を使用。
// Supabase移行後に設定テーブルからの読み込みを再実装予定。

// Mock config for fallback
const DEFAULT_CONFIGS: Record<AIPhase, PhaseConfig> = {
    ocr: { provider: 'vertex_ai', mode: 'realtime', model: 'gemini-1.5-flash-001' },
    learning: { provider: 'ai_studio', mode: 'realtime', model: 'gemini-1.5-pro-001' },
    conversion: { provider: 'vertex_ai', mode: 'realtime', model: 'gemini-1.5-flash-001' },
    optimization: { provider: 'vertex_ai', mode: 'batch', model: 'gemini-1.5-flash-001' }
};

export class AIProviderFactory {
    private static cache: { [key in AIPhase]?: { config: PhaseConfig, timestamp: number } } = {};
    private static CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    /**
     * Get a configured AI Provider for a specific phase
     */
    static async getProviderForPhase(phase: AIPhase): Promise<AIProvider> {
        // 1. Resolve Config (Cache -> DB -> Default)
        const phaseConfig = await this.resolveConfig(phase);

        // 2. Instantiate Strategy based on provider type
        let strategy: AIProvider;

        switch (phaseConfig.provider) {
            case 'vertex_ai':
                // Check if Vertex credentials exist, else fallback or throw
                if (config.GCP_PROJECT_ID) {
                    strategy = new VertexAIStrategy(config.GCP_PROJECT_ID);
                } else {
                    console.warn(`[AI Factory] Vertex AI requested for ${phase} but no Project ID found. Falling back to AI Studio.`);
                    strategy = new AIStudioStrategy(config.GEMINI_API_KEY || 'mock-key');
                }
                break;
            case 'ai_studio':
                strategy = new AIStudioStrategy(config.GEMINI_API_KEY || 'mock-key');
                break;
            default:
                // Fallback / Unknown
                strategy = new VertexAIStrategy(config.GCP_PROJECT_ID || 'demo');
        }

        // 3. Wrap strategy to inject configured model and mode
        return this.createConfiguredProxy(strategy, phaseConfig);
    }

    /**
     * Resolve configuration with caching and fallback
     */
    private static async resolveConfig(phase: AIPhase): Promise<PhaseConfig> {
        const now = Date.now();
        const cached = this.cache[phase];

        // キャッシュヒット
        if (cached && (now - cached.timestamp < this.CACHE_TTL_MS)) {
            return cached.config;
        }

        // [Firebase削除済み] Firestoreからの設定読み込みは廃止。
        // Supabase移行後、system_configsテーブルからの読み込みを再実装予定。
        console.warn(`[AI Factory] Firestore削除済み。デフォルト設定を使用: ${phase}`);

        // デフォルト値をキャッシュして返却
        const defaultConfig = DEFAULT_CONFIGS[phase];
        this.cache[phase] = { config: defaultConfig, timestamp: now };
        return defaultConfig;
    }

    /**
     * Create a proxy to automatically inject modelId and handle mode if not provided
     */
    private static createConfiguredProxy(strategy: AIProvider, config: PhaseConfig): AIProvider {
        return {
            listAvailableModels: () => strategy.listAvailableModels(),

            analyzeReceipt: async (gcsUri: string, modelId?: string) => {
                // Use provided modelId override, or configured default
                const finalModelId = modelId || config.model;
                console.log(`[AI Factory] Execution strategy: ${config.provider}, Mode: ${config.mode}, Model: ${finalModelId}`);

                // If mode is batch, we might handle differently here or inside strategy
                // For now, assume analyzeReceipt is realtime.
                // If config.mode === 'batch', we might throw or queue?
                // Request says: "Service calls analyze() ... Factory ... sets mode"
                // Ideally strategy.analyzeReceipt should handle it, or we assume analyzeReceipt IS realtime call
                // and createBatchJob IS batch call.

                return strategy.analyzeReceipt(gcsUri, finalModelId);
            },

            createBatchJob: async (gcsUris: string[], modelId?: string) => {
                const finalModelId = modelId || config.model;
                if (strategy.createBatchJob) {
                    return strategy.createBatchJob(gcsUris, finalModelId);
                }
                throw new Error(`Batch mode not supported by ${config.provider}`);
            }
        };
    }

    // Legacy support if needed, or remove
    static getProvider() {
        // Default to OCR phase or generic
        return this.getProviderForPhase('ocr');
    }
}
