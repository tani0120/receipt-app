import type { AIProvider, AIPhase, PhaseConfig } from './types';
import { VertexAIStrategy } from './strategies/VertexAIStrategy';
import { AIStudioStrategy } from './strategies/AIStudioStrategy';
import { config } from '../config';
import { DEFAULT_MODEL_ID } from './modelConfig';
// 設定はデフォルト値を使用。Supabase移行後にsystem_configsテーブルから読み込み予定。

// ============================================================
// モデル → location 自動判定
// ============================================================
// Gemini 3系は現時点で asia-northeast1 未対応。global のみ。
// 東京リージョンに展開され次第、このマップから該当モデルを削除すれば
// 自動的に asia-northeast1（デフォルト）に切り替わる。
// ============================================================

/** globalエンドポイントが必須なモデル一覧（東京リージョン未対応） */
const GLOBAL_ONLY_MODELS = new Set([
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3-flash-preview',
]);

/** デフォルトのリージョン（環境変数から取得、未設定時は asia-northeast1） */
const DEFAULT_LOCATION = process.env['VERTEX_LOCATION'] ?? 'asia-northeast1';

/**
 * モデル名からVertex AIのlocationを自動判定する。
 * - GLOBAL_ONLY_MODELS に含まれるモデル → 'global'
 * - それ以外 → DEFAULT_LOCATION（通常 asia-northeast1）
 */
export function resolveLocation(modelId: string): string {
    if (GLOBAL_ONLY_MODELS.has(modelId)) {
        return 'global';
    }
    return DEFAULT_LOCATION;
}

// デフォルト設定
const DEFAULT_CONFIGS: Record<AIPhase, PhaseConfig> = {
    ocr: { provider: 'vertex_ai', mode: 'realtime', model: DEFAULT_MODEL_ID },
    learning: { provider: 'vertex_ai', mode: 'realtime', model: DEFAULT_MODEL_ID },
    conversion: { provider: 'vertex_ai', mode: 'realtime', model: DEFAULT_MODEL_ID },
    optimization: { provider: 'vertex_ai', mode: 'batch', model: DEFAULT_MODEL_ID },
    command: { provider: 'vertex_ai', mode: 'realtime', model: 'gemini-3.5-flash' }
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

        // モデルに応じたlocationを自動判定
        const location = resolveLocation(phaseConfig.model);

        switch (phaseConfig.provider) {
            case 'vertex_ai':
                // Check if Vertex credentials exist, else fallback or throw
                if (config.GCP_PROJECT_ID) {
                    strategy = new VertexAIStrategy(config.GCP_PROJECT_ID, location);
                    console.log(`[AI Factory] Vertex AI: model=${phaseConfig.model}, location=${location}`);
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
                strategy = new VertexAIStrategy(config.GCP_PROJECT_ID || 'demo', location);
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

        // デフォルト設定を使用。Supabase移行後にsystem_configsテーブルから読み込み予定。
        console.warn(`[AI Factory] デフォルト設定を使用: ${phase}`);

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
