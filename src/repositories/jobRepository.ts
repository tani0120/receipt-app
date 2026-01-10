import {
    doc,
    getDoc,
    updateDoc,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Job } from '../types/firestore';

const COLLECTION_JOBS = 'jobs';

export const jobRepository = {
    /**
     * Fetch Job (Legacy)
     */
    async getJob(id: string): Promise<Job | null> {
        try {
            const ref = doc(db, COLLECTION_JOBS, id);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                return { ...snap.data(), id: snap.id } as Job;
            }
            return null;
        } catch (e) {
            console.error('[JobRepo] Failed to fetch job:', e);
            return null;
        }
    },

    /**
     * Save Job (Legacy Partial Update)
     */
    async saveJob(id: string, data: Partial<Job>): Promise<void> {
        const ref = doc(db, COLLECTION_JOBS, id);
        // Explicitly update updatedAt
        await updateDoc(ref, {
            ...data,
            updatedAt: Timestamp.now()
        });
    }
};
