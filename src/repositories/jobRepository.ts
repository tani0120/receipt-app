import { FirestoreRepository } from '../services/firestoreRepository';
import type { JobApi } from '../types/zod_schema';

/**
 * Job Repository Adapter
 * Bridges the gap between the API layer (Legacy calls) and the FirestoreService.
 */
export const jobRepository = {
    /**
     * Get a Job by ID
     * Maps to FirestoreRepository.getJobById
     */
    async getJob(id: string): Promise<JobApi | null> {
        // Force Cast to Sacred Type to satisfy Hono Inference
        return await FirestoreRepository.getJobById(id) as unknown as JobApi | null;
    },

    /**
     * Get All Jobs
     * Maps to FirestoreRepository.getAllJobs
     */
    async getAllJobs(): Promise<JobApi[]> {
        return await FirestoreRepository.getAllJobs() as unknown as JobApi[];
    },

    /**
     * Save/Update a Job
     * Maps to FirestoreRepository.updateJob
     */
    async saveJob(id: string, data: Partial<JobApi>): Promise<void> {
        await FirestoreRepository.updateJob(id, data as any);
    }
};
