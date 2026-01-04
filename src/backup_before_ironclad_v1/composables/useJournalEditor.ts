
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { JournalService } from '@/services/JournalService';
import type { JournalEntry, JournalLine, ValidationResult } from '@/types/journal';

export function aaa_useJournalEditor() {
    const route = useRoute();
    const router = useRouter();
    const id = route.params.id as string;

    // State
    const entry = ref<JournalEntry | null>(null);
    const loading = ref(false);
    const isSaving = ref(false);
    const error = ref<Error | null>(null);

    // Validation State
    const validation = ref<ValidationResult>({
        isValid: false,
        errors: [],
        warnings: [],
        balanceDiff: 0
    });

    // Lifecycle
    onMounted(async () => {
        if (!id) return;
        loading.value = true;
        try {
            const data = await JournalService.fetchJournalById(id);
            if (!data) throw new Error('Journal not found');
            entry.value = data;

            // Initial Validation
            validation.value = JournalService.validateJournal(data);
        } catch (err) {
            console.error(err);
            error.value = err as Error;
        } finally {
            loading.value = false;
        }
    });

    // Real-time Validation
    watch(
        () => entry.value,
        (newVal) => {
            if (newVal) {
                validation.value = JournalService.validateJournal(newVal);
            }
        },
        { deep: true }
    );

    // Grid Actions
    const addRow = () => {
        if (!entry.value) return;
        const newLine: JournalLine = {
            lineNo: (entry.value.lines.length || 0) + 1,
            description: '',
            drAccount: '',
            drAmount: 0,
            crAccount: '',
            crAmount: 0,
            drTaxClass: '課対仕入10%', // Default
            crTaxClass: '課対仕入10%'  // Default
        };
        entry.value.lines.push(newLine);
    };

    const removeRow = (index: number) => {
        if (!entry.value) return;
        entry.value.lines.splice(index, 1);
        // Re-numbering if strictly needed, or just let lineNo be ID-like
    };

    // Workflow Actions
    const handleSave = async () => {
        if (!entry.value) return;
        isSaving.value = true;
        try {
            await JournalService.saveJournal(entry.value.id, entry.value);
            // Optional: Toast message
        } catch (err) {
            console.error(err);
            alert('保存に失敗しました');
        } finally {
            isSaving.value = false;
        }
    };

    const handleSubmit = async () => {
        if (!entry.value || !validation.value.isValid) return;
        isSaving.value = true;
        try {
            await JournalService.saveJournal(entry.value.id, entry.value); // Save first

            if (entry.value.status === 'READY_FOR_WORK') {
                await JournalService.completePrimaryStage(entry.value.id);
            } else if (entry.value.status === 'REMANDED') {
                await JournalService.resolveRemand(entry.value.id);
            }

            // Redirect back to dashboard (Mirror)
            router.push('/dashboard');
        } catch (err) {
            console.error(err);
            alert('完了処理に失敗しました');
        } finally {
            isSaving.value = false;
        }
    };

    // UI Helpers
    const primaryActionButtonLabel = computed(() => {
        if (!entry.value) return '';
        if (entry.value.status === 'REMANDED') return '差戻し対応完了';
        return '1次仕訳完了';
    });

    return {
        entry,
        loading,
        isSaving,
        error,
        validation,
        addRow,
        removeRow,
        handleSave,
        handleSubmit,
        primaryActionButtonLabel
    };
}
