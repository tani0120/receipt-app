/**
 * ============================================================
 * useJournalEntries.ts
 * ------------------------------------------------------------
 * Journal Entry用のhooks層（Zod境界）
 * Step 4 Phase C: Hooks層でZod Boundaryを確立
 * ============================================================
 *
 * 責務:
 * - Firestore → raw data
 * - Zod.parse()で型安全性を確保
 * - mapToUI()でUI型に変換
 * - UIは整形済みの安全なデータのみを受け取る
 *
 * 構造:
 * UI ← useJournalEntries() ← Zod.parse() ← Firestore
 */

import { ref, computed } from 'vue';
import { JournalEntrySchema } from '@/features/journal';
import type { JournalEntryDraft } from '@/features/journal';
import type { JournalEntryUI, JournalEntrySummaryUI } from '@/types/JournalEntryUI';
import { mapToUI, mapToSummaryUI } from '@/adapters/journalEntryAdapter';

/**
 * 仕訳エントリの取得・管理hooks
 *
 * @returns 仕訳エントリのUI型配列と操作関数
 */
export function useJournalEntries() {
    // ローカル状態（モック実装）
    // TODO: Firestoreとの接続実装（Phase C後半）
    const rawEntries = ref<unknown[]>([]);
    const loading = ref(false);
    const error = ref<Error | null>(null);

    /**
     * Zod.parse()済みの安全なエントリ配列
     */
    const parsedEntries = computed<JournalEntryDraft[]>(() => {
        return rawEntries.value
            .map(raw => {
                try {
                    // Zod boundary: ここで型安全性を確保
                    return JournalEntrySchema.parse(raw);
                } catch (e) {
                    console.error('[useJournalEntries] Zod parse failed:', e);
                    return null;
                }
            })
            .filter((entry): entry is JournalEntryDraft => entry !== null);
    });

    /**
     * UI型に変換されたエントリ配列
     */
    const entries = computed<JournalEntryUI[]>(() => {
        return parsedEntries.value.map(mapToUI);
    });

    /**
     * サマリーUI型に変換されたエントリ配列（一覧表示用）
     */
    const entrySummaries = computed<JournalEntrySummaryUI[]>(() => {
        return parsedEntries.value.map(mapToSummaryUI);
    });

    /**
     * エントリを取得
     *
     * @param clientId - 顧問先ID（オプション）
     */
    async function fetchEntries(clientId?: string) {
        loading.value = true;
        error.value = null;

        try {
            // TODO: Firestore実装
            // const snapshot = await db.collection('journalEntries')
            //   .where('clientId', '==', clientId)
            //   .get();
            // rawEntries.value = snapshot.docs.map(doc => doc.data());

            // モックデータ（Phase B検証用）
            rawEntries.value = [];

        } catch (e) {
            error.value = e as Error;
            console.error('[useJournalEntries] Fetch failed:', e);
        } finally {
            loading.value = false;
        }
    }

    /**
     * エントリを作成
     *
     * @param entry - JournalEntryUI（UI型）
     */
    async function createEntry(entry: JournalEntryUI) {
        try {
            // Zod.parse()で確定型に変換
            const confirmed = JournalEntrySchema.parse(entry);

            // TODO: Firestore実装
            // await db.collection('journalEntries').add(confirmed);

            console.log('[useJournalEntries] Entry created:', confirmed);
        } catch (e) {
            console.error('[useJournalEntries] Create failed:', e);
            throw e;
        }
    }

    /**
     * エントリを更新
     *
     * @param id - エントリID
     * @param entry - JournalEntryUI（UI型）
     */
    async function updateEntry(id: string, entry: JournalEntryUI) {
        try {
            // Zod.parse()で確定型に変換
            const confirmed = JournalEntrySchema.parse(entry);

            // TODO: Firestore実装
            // await db.collection('journalEntries').doc(id).update(confirmed);

            console.log('[useJournalEntries] Entry updated:', id, confirmed);
        } catch (e) {
            console.error('[useJournalEntries] Update failed:', e);
            throw e;
        }
    }

    return {
        // データ
        entries,
        entrySummaries,
        loading,
        error,

        // 操作
        fetchEntries,
        createEntry,
        updateEntry,
    };
}
