import { computed } from 'vue';
import { aaa_useAccountingSystem } from '@/composables/useAccountingSystem';
import type { JobUi, JobStatusUi } from '@/types/ui.type';

export function aaa_useJobDashboard() {
    // Integration Bridge
    const { jobs, isLoading, error, updateJobStatus } = aaa_useAccountingSystem();

    // Computed Stats (Keep this or move to Mapper too? Stats are aggregate, fits Composable/Store)
    const stats = computed(() => {
        const total = jobs.value.length;
        // Ironclad: jobs.value is JobUi[]. No nulls.
        if (total === 0) return { total: 0, progress: 0, pending: 0, completed: 0 };

        const pending = jobs.value.filter(j => j.status === 'pending').length;
        const completed = jobs.value.filter(j => j.status === 'done' || j.status === 'approved').length; // Check 'done' status mapping
        const progress = Math.round((completed / total) * 100);

        return {
            total,
            progress,
            pending,
            completed
        };
    });

    // Actions (Bridge)
    const handleJobAction = async (jobId: string, action: string) => { // action type?
        try {
            // Mapping Action to Status?
            // The Mapper now returns nextAction.type. We might need a mapBack.
            // Simplified for now:
            if (action === 'RESOLVE_REMAND') {
                await updateJobStatus(jobId, 'ready_for_work'); // Back to work? or review?
            } else if (action === 'APPROVE_FINAL') {
                await updateJobStatus(jobId, 'approved' as JobStatusUi); // or done
            }
        } catch (err) {
            console.error('Action failed:', err);
            alert('操作に失敗しました。');
        }
    };

    return {
        jobs, // : Ref<JobUi[]>
        loading: isLoading,
        error,
        stats,
        handleJobAction
    };
}
