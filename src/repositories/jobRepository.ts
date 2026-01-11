import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase-admin';
import type { Job } from '../types/firestore';

const COLLECTION_JOBS = 'jobs';

export const jobRepository = {
    /**
     * Fetch Job (Admin SDK)
     */
    async getJob(id: string): Promise<Job | null> {
        try {
            const docRef = db.collection(COLLECTION_JOBS).doc(id);
            const snap = await docRef.get();
            if (snap.exists) {
                return { ...snap.data(), id: snap.id } as Job;
            }
            return null;
        } catch (e) {
            console.error('[JobRepo] Failed to fetch job:', e);
            return null;
        }
    },

    /**
     * Save Job (Admin SDK - Upsert)
     */
    async saveJob(id: string, data: Partial<Job>): Promise<void> {
        const docRef = db.collection(COLLECTION_JOBS).doc(id);
        // Explicitly update updatedAt
        await docRef.set({
            ...data,
            updatedAt: Timestamp.now()
        }, { merge: true });
    }
};
