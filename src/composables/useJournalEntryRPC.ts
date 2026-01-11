import { ref } from 'vue';
import { client } from '@/client';
import type { JournalEntryUi, JournalLineUi, JournalEntryActionUi } from '@/types/ui.type';

// Type from Backend (Approximate since we don't have shared DTOs fully set up yet)
// We rely on 'any' for the response data for now, or infer from AppType if possible.
// But for now, mapping logic handles the structure.

export function useJournalEntryRPC() {
  const journalEntry = ref<JournalEntryUi | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Helper: Map API Data to JournalEntryUi
   */
  const mapApiDataToUi = (job: any): JournalEntryUi => {
    const status = job.status as string;
    const statusLabelVal = status === 'completed' ? '完了' :
      status === 'review' ? '承認待' :
        status === 'in_progress' ? '作業中' : '未着手';

    const actions: JournalEntryActionUi[] = [];
    if (status === 'draft' || status === 'in_progress') {
      actions.push({ id: 'save', label: '保存', disabled: false, style: 'primary' });
    } else if (status === 'review') {
      actions.push({ id: 'save', label: '修正保存', disabled: false, style: 'primary' });
      actions.push({ id: 'approve', label: '承認', disabled: false, style: 'secondary' });
    }
    if (status !== 'completed' && status !== 'draft') {
      actions.push({ id: 'remand', label: '差戻し', disabled: false, style: 'danger' });
    }

    return {
      id: job.id,
      clientCode: job.clientCode || 'UNKNOWN',
      companyName: 'Unknown Client (' + (job.clientCode || '?') + ')',
      transactionDate: job.transactionDate && job.transactionDate.seconds
        ? new Date(job.transactionDate.seconds * 1000).toLocaleDateString('ja-JP')
        : (typeof job.transactionDate === 'string' ? job.transactionDate : ''),

      summary: job.summary || (job.lines && job.lines.length > 0 ? job.lines[0].description : ''),
      status: status,
      statusLabel: statusLabelVal,

      isLocked: status === 'completed',
      canEdit: status !== 'completed',
      journalEditMode: status === 'review' ? 'approve' : 'work',

      // Map Flat or Nested (Backend returns Job)
      // If Backend uses jobRepository.getJob, it returns Firestore Object.
      // Firestore Object might be Flat (drAccount) or Nested (debit).
      // We'll handle Flat as per previous verification.
      lines: (job.lines || []).map((l: any, idx: number) => ({
        lineNo: idx + 1,
        debit: {
          account: l.drAccount || l.debit?.account || '',
          subAccount: l.drSubAccount || l.debit?.subAccount || '',
          amount: l.drAmount || l.debit?.amount || 0,
          taxRate: l.taxDetails?.rate || l.debit?.taxRate || 10,
          taxCode: l.drTaxClass || l.debit?.taxCode || ''
        },
        credit: {
          account: l.crAccount || l.credit?.account || '',
          subAccount: l.crSubAccount || l.credit?.subAccount || '',
          amount: l.crAmount || l.credit?.amount || 0,
          taxRate: l.taxDetails?.rate || l.credit?.taxRate || 10,
          taxCode: l.crTaxClass || l.credit?.taxCode || ''
        },
        description: l.description || ''
      } as JournalLineUi)),

      totalAmount: (job.lines || []).reduce((sum: number, l: any) => sum + (l.drAmount || l.debit?.amount || 0), 0),

      alerts: [],
      actions,
      driveFileUrl: '',
      aiProposal: undefined
    };
  };

  // Fetch Entry (Hono RPC)
  const fetchJournalEntry = async (id: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await client.api.jobs[':id'].$get({ param: { id } });

      if (!res.ok) {
        if (res.status === 404) {
          error.value = 'Job not found';
        } else {
          error.value = 'Failed to fetch job';
        }
        return;
      }

      const job = await res.json();
      journalEntry.value = mapApiDataToUi(job);
    } catch (e) {
      console.error(e);
      error.value = 'Network error';
    } finally {
      isLoading.value = false;
    }
  };

  // Update Entry (Hono RPC)
  const updateJournalEntry = async (id: string, payload: any) => {
    isLoading.value = true;
    try {
      // Backend handles partial update logic
      const res = await client.api.jobs[':id'].$patch({
        param: { id },
        json: payload // Payload should match what backend expects (Partial<Job>)
      });

      if (!res.ok) {
        throw new Error('Failed to save job');
      }

      isSuccessModalOpen.value = true; // Trigger Modal
      return { success: true };
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const isSuccessModalOpen = ref(false);

  return {
    journalEntry,
    isLoading,
    error,
    isSuccessModalOpen, // Exported state
    fetchJournalEntry,
    updateJournalEntry
  };
}
