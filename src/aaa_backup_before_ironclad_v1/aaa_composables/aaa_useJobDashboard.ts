import { ref, computed, onMounted, onUnmounted } from 'vue';
import { JobService } from '@/aaa/aaa_services/aaa_JobService';
import type { Job, JobStatus, JobActionType } from '@/aaa/aaa_types/aaa_job';
import { Timestamp } from 'firebase/firestore';

export function aaa_useJobDashboard() {
    // State
    const jobs = ref<Job[]>([]);
    const loading = ref(false);
    const error = ref<Error | null>(null);

    let unsubscribe: (() => void) | null = null;

    // Computed Stats
    const stats = computed(() => {
        const total = jobs.value.length;
        if (total === 0) return { total: 0, progress: 0, pending: 0, completed: 0 };

        const pending = jobs.value.filter(j => j.status === 'pending').length;
        const completed = jobs.value.filter(j => j.status === 'completed').length;
        const progress = Math.round((completed / total) * 100);

        return {
            total,
            progress,
            pending,
            completed
        };
    });

    // Lifecycle
    onMounted(() => {
        loading.value = true;
        unsubscribe = JobService.subscribeAllJobs(
            (data) => {
                jobs.value = data;
                loading.value = false;
            },
            (err) => {
                error.value = err;
                loading.value = false;
            }
        );
    });

    onUnmounted(() => {
        if (unsubscribe) {
            unsubscribe();
        }
    });

    // Actions
    const handleJobAction = async (jobId: string, action: JobActionType) => {
        try {
            await JobService.updateJobProgress(jobId, action);
        } catch (err) {
            console.error('Action failed:', err);
            // Optionally set error state or show toast
            alert('操作に失敗しました。');
        }
    };

    // --- UI Logic Helpers (Strictly typed for Template) ---

    // 1. Primary Step UI Logic
    const getPrimaryState = (job: Job) => {
        // pending -> Show Action Button
        if (job.status === 'pending') {
            return { showButton: true, showCheck: false, label: '1次仕訳' };
        }
        // remanded -> Show Remand Button (High Priority)??
        // Note: Request says "Primary completed implies Check mark".
        // If remanded, usually it means it went back. But let's follow the specific request logic:
        // "1次仕訳完了：ボタンを [☑] マークに差し替え"
        // "差戻し発生：... [差戻し] ボタンを生成" (Where? separate column or same?)
        // Usually Primary column shows "Done" if basic primary is done.
        // If 'remanded', it depends if it's remanded to Primary or to Client.
        // Assuming Remand is a special state.

        // Simple logic based on request:
        // "pending なら「[1次仕訳] ボタン」。それ以外（完了済み）なら「☑ アイコン」。"
        return { showButton: false, showCheck: true };
    };

    // 2. Final Approval / Remand UI Logic
    // This handles the "Next Step" column
    const getNextActionState = (job: Job) => {
        // remanded -> Show Remand Button
        if (job.status === 'remanded') {
            return {
                type: 'REMAND',
                showButton: true,
                label: '差戻し対応',
                action: 'RESOLVE_REMAND' as JobActionType,
                style: 'bg-red-500 text-white hover:bg-red-600'
            };
        }

        // primary_completed -> Show Final Approval Button
        if (job.status === 'primary_completed') {
            return {
                type: 'FINAL',
                showButton: true,
                label: '最終承認',
                action: 'APPROVE_FINAL' as JobActionType,
                style: 'bg-indigo-600 text-white hover:bg-indigo-700'
            };
        }

        // others (pending, combined, final_pending) -> Show nothing or Waiting
        if (job.status === 'completed') {
            return { type: 'DONE', showButton: false, label: '完了' };
        }

        return { type: 'WAITING', showButton: false, label: '待機中' };
    };

    // 3. Status Display Helper
    const getStatusBadge = (job: Job) => {
        switch (job.status) {
            case 'pending': return { label: '未着手', class: 'bg-slate-100 text-slate-600' };
            case 'primary_completed': return { label: '承認待ち', class: 'bg-blue-100 text-blue-700' };
            case 'remanded': return { label: '差戻し', class: 'bg-red-100 text-red-700 font-bold' };
            case 'completed': return { label: '完了', class: 'bg-emerald-100 text-emerald-700' };
            default: return { label: job.status, class: 'bg-gray-100' };
        }
    };

    // Date formatting helper
    const formatDate = (ts: any) => {
        if (!ts) return '-';
        if (ts instanceof Timestamp) return ts.toDate().toLocaleDateString();
        // fallback if string
        return new Date(ts).toLocaleDateString();
    };

    return {
        jobs,
        loading,
        error,
        stats,
        handleJobAction,

        // UI Helpers
        getPrimaryState,
        getNextActionState,
        getStatusBadge,
        formatDate
    };
}
