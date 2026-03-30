import { ref } from 'vue';

/** スタブ型: 将来ui.typeに正式定義後に差し替え */
interface JournalEntryUi {
  id: string;
  [key: string]: unknown;
}

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
