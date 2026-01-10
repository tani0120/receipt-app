import { ref } from 'vue';
import { jobRepository } from '@/repositories/jobRepository';
import { receiptRepository } from '@/repositories/receiptRepository';
import { convertLegacyJobToWorkLog, convertLegacyJobToReceipt } from '@/libs/adapters/legacy_to_v2';
import type { JournalEntryUi, JournalLineUi, JournalEntryActionUi } from '@/types/ui.type';
import type { Job as LegacyJob } from '@/types/firestore';

export function useJournalEntryRPC() {
  const journalEntry = ref<JournalEntryUi | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Helper: Map Legacy Job to JournalEntryUi
   */
  const mapJobToUi = (job: LegacyJob): JournalEntryUi => {
    // Basic Status Mapping
    const statusLabelVal = job.status === 'completed' ? '完了' :
      job.status === 'review' ? '承認待' :
        job.status === 'in_progress' ? '作業中' : '未着手';

    // Actions Logic (Simple)
    const actions: JournalEntryActionUi[] = [];
    if (job.status === 'draft' || job.status === 'in_progress') {
      actions.push({ id: 'save', label: '保存', disabled: false, style: 'primary' });
    } else if (job.status === 'review') {
      actions.push({ id: 'save', label: '修正保存', disabled: false, style: 'primary' });
      actions.push({ id: 'approve', label: '承認', disabled: false, style: 'secondary' });
    }
    if (job.status !== 'completed' && job.status !== 'draft') {
      actions.push({ id: 'remand', label: '差戻し', disabled: false, style: 'danger' });
    }

    return {
      id: job.id,
      clientCode: job.clientCode || 'UNKNOWN',
      companyName: job.clientName || 'Unknown Client',
      transactionDate: job.transactionDate ? new Date((job.transactionDate as any).seconds * 1000).toLocaleDateString('ja-JP') : '-',
      summary: job.summary || (job.lines && job.lines.length > 0 ? job.lines[0].description : ''),
      status: job.status,
      statusLabel: statusLabelVal,

      isLocked: job.status === 'completed',
      canEdit: job.status !== 'completed',
      journalEditMode: job.status === 'review' ? 'approve' : 'work',

      lines: (job.lines || []).map((l: any, idx: number) => ({
        lineNo: idx + 1,
        debit: l.debit || { account: '', subAccount: '', amount: 0, taxRate: 10, taxCode: '' },
        credit: l.credit || { account: '', subAccount: '', amount: 0, taxRate: 10, taxCode: '' },
        description: l.description || ''
      } as JournalLineUi)),

      totalAmount: (job.lines || []).reduce((sum: number, l: any) => sum + (l.debit?.amount || 0), 0),

      alerts: [],
      actions,
      driveFileUrl: '', // Could be derived if needed

      // AI Proposal (Simulated or from Legacy if exists)
      aiProposal: undefined
    };
  };

  // Fetch Entry
  const fetchJournalEntry = async (id: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const job = await jobRepository.getJob(id);
      if (job) {
        journalEntry.value = mapJobToUi(job);
      } else {
        error.value = 'Failed to fetch journal entry (Not Found)';
      }
    } catch (e) {
      console.error(e);
      error.value = 'Network error';
    } finally {
      isLoading.value = false;
    }
  };

  // Update Entry
  const updateJournalEntry = async (id: string, payload: any) => {
    isLoading.value = true;
    try {
      // 1. Legacy Save (Repository)
      await jobRepository.saveJob(id, payload);

      // 2. [Dual_Write] V2 Sync
      try {
        const updatedJob = await jobRepository.getJob(id);
        if (updatedJob) {
          const v2WorkLog = convertLegacyJobToWorkLog(updatedJob);
          const v2Receipt = convertLegacyJobToReceipt(updatedJob);
          await receiptRepository.saveDualEntry(v2WorkLog, v2Receipt);
          console.log('[Dual_Write] V2 Sync Success:', id);
        }
      } catch (syncError) {
        console.error('[Dual_Write] V2 Sync Failed:', syncError);
        // Suppress error to maintain Legacy flow success
      }

      return { success: true };
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    journalEntry,
    isLoading,
    error,
    fetchJournalEntry,
    updateJournalEntry
  };
}
