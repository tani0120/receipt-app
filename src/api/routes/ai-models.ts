
import { Hono } from 'hono'
import { AIProviderFactory } from '../lib/ai/AIProviderFactory'

const app = new Hono()

const route = app
    // GET /api/ai/models - List available models for the current provider
    .get('/models', async (c) => {
        try {
            const provider = AIProviderFactory.getProvider();
            const models = await provider.listAvailableModels();
            return c.json({ success: true, models });
        } catch (e: unknown) {
            const err = e as Error;
            console.error('[BFF] Failed to list AI models:', err);
            return c.json({ success: false, message: err.message }, 500);
        }
    })

export default route
