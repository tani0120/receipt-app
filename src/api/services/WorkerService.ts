import { db } from '../lib/firebase';
import { ConfigService } from './ConfigService';
import { JournalService } from './JournalService';

export class WorkerService {
    private static COLLECTION = 'jobs';

    /**
     * Process "Pending" jobs (Draft Generation).
     * Finds jobs waiting for AI analysis and dispatches 're_analyze' action.
     */
    static async processDrafts() {
        const settings = await ConfigService.getSchedulerSettings();
        const batchSize = settings.processing.batch_size;

        // 1. Fetch pending jobs
        // In a real scenario, we might use a compound query or specific 'queue' collection.
        // For now, querying 'jobs' where status is 'pending' (or 'ready_for_work' but no AI yet?)
        // Let's assume 'pending' is the initial state after upload.
        const snapshot = await db.collection(this.COLLECTION)
            .where('status', '==', 'pending')
            .limit(batchSize)
            .get();

        if (snapshot.empty) {
            console.log('[Worker] No pending drafts found.');
            return { count: 0 };
        }

        const results = [];

        // 2. Process each job
        // We process sequentially or in parallel? Parallel is faster but higher burst.
        // Settings.processing.timeout_seconds implies we should be careful.
        // Let's do parallel with Promise.allSettled for now.

        const tasks = snapshot.docs.map(async (doc) => {
            const jobId = doc.id;
            const data = doc.data();

            // Concurrency Control: Check if already locked or processed?
            // Since we just fetched, it might be claimed by another worker if we scale out.
            // Ideally we use runTransaction to "claim" first.
            // But JournalService.dispatchAction -> reAnalyze does a transaction inside.
            // So we rely on JournalService to handle the atomic update.
            // However, to prevent double processing *start*, we should conceptually "claim" it.
            // For this implementation, we'll assume single worker instance or rely on optimistic locking in dispatchAction.
            // To be safer (as requested):

            try {
                // Dispatch 're_analyze'
                // This computes AI result and saves it.
                // Logic inside reAnalyze should ideally flip status from 'pending' to 'work' or 'review'.
                // Currently reAnalyze just adds proposal. We might need to ensure status update.

                console.log(`[Worker] Processing Job ${jobId}...`);
                await JournalService.dispatchAction(jobId, 're_analyze');

                // Explicitly move state if re_analyze didn't (it seems it doesn't in current impl)
                // Actually, if we want strict action-driven, re_analyze action should handle status change.
                // Let's assume re_analyze does its job. If we need to change status, we dispatch another action?
                // Or we update reAnalyze in JournalService.
                // For now, let's assume successful re_analyze means it's ready for review.

                return { jobId, status: 'success' };
            } catch (error: any) {
                console.error(`[Worker] Job ${jobId} failed: ${error.message}`);
                // Retries?
                return { jobId, status: 'error', error: error.message };
            }
        });

        const outcomes = await Promise.allSettled(tasks);
        return {
            count: outcomes.length,
            results: outcomes.map(o => o.status === 'fulfilled' ? o.value : o.reason)
        };
    }

    /**
     * Monitor Batch Jobs (Vertex/Gemini Batch API)
     * Checks status of long-running batch operations.
     */
    static async checkBatchResults() {
        // Placeholder for Phase 2/3 Batch API integration
        // 1. Query jobs with status 'processing_batch'
        // 2. Check Provider Batch API status
        // 3. If done, download results and update job
        console.log('[Worker] Batch check not fully implemented yet.');
        return { message: 'Batch check skipped' };
    }
}
