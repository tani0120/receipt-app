import { db } from '@/firebase';
import { collection, doc, updateDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import type { Job, JobStatus, JobActionType } from '@/types/job';
import { mockJobUiList } from '@/aaa/aaa_mocks/aaa_mockJobUi'; // Import Mock Data

const COLLECTION_NAME = 'jobs';

export const JobService = {
  subscribeAllJobs(onSuccess: (jobs: Job[]) => void, onError: (error: Error) => void): () => void {
    const q = query(collection(db, COLLECTION_NAME), orderBy('transactionDate', 'desc'));

    // TEMPORARY: Return Mock Data immediately for User Verification
    const mocks: Job[] = mockJobUiList.map(m => ({
      id: m.id,
      clientCode: m.clientCode,
      clientName: m.clientName, // Injected here to fix display
      status: 'pending',
      transactionDate: Timestamp.now(),
      driveFileId: 'mock-file',
      driveFileUrl: '',
      lines: m.id === '1001' || m.clientCode === '1001' ? [
        {
          lineNo: 1,
          drAccount: '消耗品費',
          drAmount: 1650000,
          drTaxClass: 'TAX_PURCHASE_10',
          crAccount: '未払金',
          crAmount: 1650000,
          crTaxClass: 'TAX_NONE',
          description: 'MacBook Pro 5台',
          taxDetails: { rate: 10, type: 'taxable', isReducedRate: false }
        }
      ] : [],
      remandReason: '',
      updatedAt: Timestamp.now(),
    } as any as Job));

    onSuccess(mocks);

    return onSnapshot(
      q,
      () => { }, // Ignore real data for now to prioritize mock for verification
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
