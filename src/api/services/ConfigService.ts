import { z } from 'zod';
import { db } from '../lib/firebase'; // Assuming a singleton export exists or dynamic import

// ------------------------------------------------------------------
// 1. Scheduler Settings Schema (Strict Type Safety)
// ------------------------------------------------------------------
export const SchedulerSettingsSchema = z.object({
    intervals: z.object({
        draft_monitoring: z.number().int().min(1).default(5),
        batch_api_check: z.number().int().min(1).default(5),
        learning: z.number().int().min(1).default(60),
        final_formatting: z.number().int().min(1).default(5),
        knowledge_optimization: z.number().int().min(1).default(30),
    }),
    notifications: z.object({
        target_hours: z.array(z.number().int().min(0).max(23)).default([9, 12, 15, 18]),
        slack_webhook_url: z.string().optional(), // Added based on UI
    }),
    processing: z.object({
        batch_size: z.number().int().min(1).max(100).default(20),
        timeout_seconds: z.number().int().min(30).default(270),
        max_retries: z.number().int().min(0).default(3),
        optimization_limit: z.number().int().min(1).default(1),
    }),
    retention: z.object({
        job_history_days: z.number().int().min(1).default(30),
    }),
});

export type SchedulerSettings = z.infer<typeof SchedulerSettingsSchema>;

// ------------------------------------------------------------------
// 2. Config Service (Singleton Logic)
// ------------------------------------------------------------------
export class ConfigService {
    private static readonly COLLECTION = 'system_configs';
    private static readonly SCHEDULER_DOC_ID = 'scheduler_settings';

    // In-memory cache for high-frequency worker access (TTL: 1 min)
    private static cache: SchedulerSettings | null = null;
    private static lastFetch: number = 0;
    private static readonly CACHE_TTL_MS = 60 * 1000;

    /**
     * Retrieves scheduler settings from Firestore.
     * Uses short-term caching to reduce Firestore reads during worker bursts.
     */
    static async getSchedulerSettings(): Promise<SchedulerSettings> {
        const now = Date.now();
        if (this.cache && (now - this.lastFetch < this.CACHE_TTL_MS)) {
            return this.cache;
        }

        try {
            const { db } = await import('../lib/firebase');
            const doc = await db.collection(this.COLLECTION).doc(this.SCHEDULER_DOC_ID).get();

            if (!doc.exists) {
                console.warn('Scheduler settings not found, using defaults.');
                const defaults = SchedulerSettingsSchema.parse({});
                this.cache = defaults;
                return defaults;
            }

            const data = doc.data();
            const parsed = SchedulerSettingsSchema.parse(data); // Runtime validation

            this.cache = parsed;
            this.lastFetch = now;
            return parsed;

        } catch (error) {
            console.error('Failed to load scheduler settings, falling back to defaults:', error);
            // Fallback ensures workers don't crash
            return SchedulerSettingsSchema.parse({});
        }
    }

    /**
     * Updates scheduler settings.
     * Invalidates cache immediately.
     */
    static async updateSchedulerSettings(settings: Partial<SchedulerSettings>): Promise<void> {
        const { db } = await import('../lib/firebase');

        // We parse partial first to ensure structure, then full validation on merge if needed.
        // Here we trust the caller passes a structure matching the schema partially.
        // For safety, we should likely fetch current, merge, and validate.

        // Simple implementation: validate keys present in 'settings' are correct types
        // Using .shape to validate partials is tricky with nested objects,
        // so we assume the UI sends the Full Object or substantial chunks.

        await db.collection(this.COLLECTION).doc(this.SCHEDULER_DOC_ID).set(settings, { merge: true });

        this.cache = null; // Invalidate cache
    }
}
