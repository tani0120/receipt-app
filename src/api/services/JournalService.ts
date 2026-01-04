import { db } from '../lib/firebase';
import type { JournalLineUi } from '../../types/ui.type';
import { z } from 'zod';

// Types for Action Payloads
export const FinalizePayloadSchema = z.object({
    jobId: z.string(),
    lines: z.array(z.any()), // We will validate lines in the route or service more strictly if needed
    summary: z.string(),
    transactionDate: z.string(),
});

export type FinalizePayload = z.infer<typeof FinalizePayloadSchema>;

export class JournalService {
    private static COLLECTION = 'jobs';

    /**
     * Finalize the journal entry.
     * Uses a transaction to ensure no double-booking.
     */
    static async finalize(payload: FinalizePayload) {
        const jobRef = db.collection(this.COLLECTION).doc(payload.jobId);

        return await db.runTransaction(async (t) => {
            const doc = await t.get(jobRef);

            if (!doc.exists) {
                // For Pilot, we might auto-create if it doesn't exist (Mock transition)
                // But strictly, it should exist.
                // throw new Error('Job not found');
            }

            const data = doc.data() || {};

            // Idempotency check or status check
            if (data.status === 'completed' || data.status === 'confirmed') {
                return { success: true, message: 'Already finalized', alreadyDone: true };
            }

            // Update Status and History
            const history = data.history || [];
            history.push({
                action: 'finalize',
                timestamp: new Date().toISOString(),
                user: 'system', // or from auth context
                details: 'Action-Driven Finalize'
            });

            t.set(jobRef, {
                ...data,
                id: payload.jobId, // Ensure ID is set
                lines: payload.lines,
                summary: payload.summary,
                transactionDate: payload.transactionDate,
                status: 'confirmed', // Changing status to confirmed
                journalEditMode: 'view', // UI mode
                history,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            return { success: true, message: 'Journal finalized successfully' };
        });
    }

    /**
     * Fetch a single journal entry (or return mock if missing in Real DB for pilot phase)
     */
    static async getEntry(id: string) {
        const doc = await db.collection(this.COLLECTION).doc(id).get();
        if (doc.exists) {
            return doc.data();
        }
        return null; // Signals caller to fall back to Mock if needed, or return 404
    }
}
