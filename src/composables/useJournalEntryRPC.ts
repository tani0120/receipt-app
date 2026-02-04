import { ref } from 'vue';
import type { JournalEntryUi } from '@/types/ui.type';

/**
 * useJournalEntryRPC - RPC/API層（スタブ版）
 *
 * 将来実装予定のため、現在はスタブ化してexportのみ維持。
 * Layer 2 B判定: TS2367エラー8件を解消するためロジック削除。
 *
 * TODO: 以下の機能を実装
 * - Legacy Job → UI型マッピング
 * - 仕訳エントリfetch/update
 * - V2 Dual Write対応
 */
export function useJournalEntryRPC() {
  const journalEntry = ref<JournalEntryUi | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchJournalEntry = async (id: string) => {
    console.log('TODO: implement fetchJournalEntry', id);
    // 将来実装予定
  };

  const updateJournalEntry = async (id: string, payload: any) => {
    console.log('TODO: implement updateJournalEntry', id, payload);
    // 将来実装予定
  };

  return {
    journalEntry,
    isLoading,
    error,
    fetchJournalEntry,
    updateJournalEntry
  };
}
