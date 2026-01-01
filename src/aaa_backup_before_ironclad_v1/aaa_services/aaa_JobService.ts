import { db } from '@/aaa/aaa_firebase';
import { collection, doc, updateDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import type { Job, JobStatus, JobActionType } from '@/aaa/aaa_types/aaa_job';

const COLLECTION_NAME = 'jobs';

export const JobService = {
  subscribeAllJobs(onSuccess: (jobs: Job[]) => void, onError: (error: Error) => void): () => void {
    const q = query(collection(db, COLLECTION_NAME), orderBy('transactionDate', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => onSuccess(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Job))),
      onError
    );
  },

  async updateJobProgress(jobId: string, action: JobActionType): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, jobId);
    const now = Timestamp.now();

    let nextStatus: JobStatus | null = null;
    const updateData: any = { updatedAt: now };

    switch (action) {
      case 'COMPLETE_PRIMARY':
        // 1次仕訳完了 -> 承認待ち
        nextStatus = 'primary_completed';
        updateData.primaryCompletedAt = now;
        break;

      case 'APPROVE_FINAL':
        // 最終承認 -> 完了
        nextStatus = 'completed';
        updateData.finalCompletedAt = now;
        break;

      case 'REMAND':
        // 差戻し
        nextStatus = 'remanded';
        break;

      case 'RESOLVE_REMAND':
        // 差戻し対応完了 -> 再度承認待ち
        nextStatus = 'primary_completed';
        break;
    }

    if (nextStatus) {
      updateData.status = nextStatus;
      await updateDoc(docRef, updateData);
    }
  }
};
