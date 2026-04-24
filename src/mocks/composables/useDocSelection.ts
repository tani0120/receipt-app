/**
 * useDocSelection.ts — 選別操作（Undo/Redo含む）
 *
 * MockDriveSelectPage.vueから分離。
 * 責務: ステータス変更、Undo/Redo、一括操作、チェックボックス管理
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue';
import { useDocuments } from '@/composables/useDocuments';
import type { DocStatus } from '@/repositories/types';
import type { DocEntry } from '@/repositories/types';
import type { DocView } from './useDriveDocuments';

// --- 型定義 ---
export interface HistoryEntry {
  docId: string;
  from: DocStatus;
  to: DocStatus;
}
export type HistoryGroup = HistoryEntry[];

export interface UseDocSelectionReturn {
  /** Undoスタック */
  undoStack: Ref<HistoryGroup[]>;
  /** Redoスタック */
  redoStack: Ref<HistoryGroup[]>;
  /** Undo可能か */
  canUndo: ComputedRef<boolean>;
  /** Redo可能か */
  canRedo: ComputedRef<boolean>;
  /** 元に戻す */
  undo: () => void;
  /** やり直し */
  redo: () => void;
  /** 単一ファイルのステータス変更 */
  setStatus: (status: DocStatus) => void;
  /** ステータスをpendingに戻す */
  resetStatus: () => void;
  /** 一括ステータス変更 */
  bulkSetStatus: (status: DocStatus) => void;
  /** チェックされたID */
  checkedIds: Ref<Set<string>>;
  /** チェック切替 */
  toggleCheck: (id: string) => void;
  /** 全選択/全解除 */
  toggleCheckAll: () => void;
  /** 件数集計（全件ベース） */
  counts: ComputedRef<{
    pending: number;
    target: number;
    supporting: number;
    excluded: number;
  }>;
  /** 確定送信モーダル */
  showCompleteModal: Ref<boolean>;
  /** 一括操作モーダル */
  showBulkModal: Ref<boolean>;
}

/**
 * 選別操作を提供するcomposable
 *
 * @param driveSelections - Driveファイルの選別結果Map
 * @param uploadedDocs - 独自アップロードファイル
 * @param allDocsView - マージ済み全ドキュメント
 * @param documents - フィルタ後ドキュメント
 * @param selected - 現在選択中のドキュメント
 * @param selectedIdx - 現在選択インデックス
 * @param markDirty - 離脱ガード: 変更あり記録
 */
export function useDocSelection(
  driveSelections: Ref<Map<string, DocStatus>>,
  uploadedDocs: Ref<DocEntry[]>,
  allDocsView: ComputedRef<DocView[]>,
  documents: ComputedRef<DocView[]>,
  selected: ComputedRef<DocView | null>,
  selectedIdx: Ref<number>,
  markDirty: (msg: string) => void,
): UseDocSelectionReturn {
  const { updateStatus: updateDocStatus } = useDocuments();

  // --- 件数集計（全件から算出。フィルタの影響を受けない） ---
  const counts = computed(() => {
    const docs = allDocsView.value;
    return {
      pending:    docs.filter(d => d.status === 'pending').length,
      target:     docs.filter(d => d.status === 'target').length,
      supporting: docs.filter(d => d.status === 'supporting').length,
      excluded:   docs.filter(d => d.status === 'excluded').length,
    };
  });

  // --- 複数選択（チェックボックス） ---
  const checkedIds = ref<Set<string>>(new Set());
  const toggleCheck = (id: string) => {
    const next = new Set(checkedIds.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    checkedIds.value = next;
  };
  const toggleCheckAll = () => {
    if (checkedIds.value.size === documents.value.length) {
      checkedIds.value = new Set();
    } else {
      checkedIds.value = new Set(documents.value.map(d => d.id));
    }
  };

  // --- Undo/Redo ---
  const undoStack = ref<HistoryGroup[]>([]);
  const redoStack = ref<HistoryGroup[]>([]);
  const canUndo = computed(() => undoStack.value.length > 0);
  const canRedo = computed(() => redoStack.value.length > 0);

  const pushHistoryGroup = (entries: HistoryEntry[]) => {
    if (entries.length === 0) return;
    undoStack.value.push(entries);
    redoStack.value = [];
  };

  // --- ステータス適用（全ソース共通） ---
  const applyStatus = (docId: string, source: string, status: DocStatus) => {
    if (source === 'drive') {
      driveSelections.value.set(docId, status);
    } else {
      const doc = uploadedDocs.value.find(d => d.id === docId);
      if (doc) doc.status = status;
    }
    updateDocStatus(docId, status);
  };

  const statusLabel = (s: DocStatus): string => {
    if (s === 'target') return '仕訳対象';
    if (s === 'supporting') return '根拠資料';
    if (s === 'excluded') return '仕訳外';
    return '未処理';
  };

  const undo = () => {
    const group = undoStack.value.pop();
    if (!group) return;
    for (const entry of group) {
      driveSelections.value.set(entry.docId, entry.from);
      const doc = uploadedDocs.value.find(d => d.id === entry.docId);
      if (doc) doc.status = entry.from;
      updateDocStatus(entry.docId, entry.from);
    }
    redoStack.value.push(group);
    showCompleteModal.value = false;
  };

  const redo = () => {
    const group = redoStack.value.pop();
    if (!group) return;
    for (const entry of group) {
      driveSelections.value.set(entry.docId, entry.to);
      const doc = uploadedDocs.value.find(d => d.id === entry.docId);
      if (doc) doc.status = entry.to;
      updateDocStatus(entry.docId, entry.to);
    }
    undoStack.value.push(group);
  };

  // --- モーダル ---
  const showCompleteModal = ref(false);
  const showBulkModal = ref(false);

  // --- ステータス設定 ---
  const setStatus = (status: DocStatus) => {
    if (!selected.value) return;
    const currentStatus = selected.value.status as DocStatus;
    if (currentStatus === status) return;

    pushHistoryGroup([{ docId: selected.value.id, from: currentStatus, to: status }]);
    applyStatus(selected.value.id, selected.value.source, status);
    markDirty(`${selected.value.fileName}: ${statusLabel(status)}`);

    // 次のpendingに自動移動
    const nextPendingIdx = documents.value.findIndex((d, i) => i > selectedIdx.value && d.status === 'pending');
    if (nextPendingIdx !== -1) {
      selectedIdx.value = nextPendingIdx;
    } else {
      const prevPendingIdx = documents.value.findIndex(d => d.status === 'pending');
      if (prevPendingIdx !== -1) selectedIdx.value = prevPendingIdx;
    }
  };

  const resetStatus = () => {
    if (!selected.value || selected.value.status === 'pending') return;
    pushHistoryGroup([{ docId: selected.value.id, from: selected.value.status as DocStatus, to: 'pending' }]);
    applyStatus(selected.value.id, selected.value.source, 'pending');
    markDirty(`${selected.value.fileName}: 未処理に戻す`);
  };

  // --- 一括操作 ---
  const bulkSetStatus = (status: DocStatus) => {
    const entries: HistoryEntry[] = [];
    for (const id of checkedIds.value) {
      const doc = documents.value.find(d => d.id === id);
      if (!doc || (doc.status as DocStatus) === status) continue;
      entries.push({ docId: doc.id, from: doc.status as DocStatus, to: status });
      applyStatus(doc.id, doc.source, status);
    }
    if (entries.length > 0) {
      pushHistoryGroup(entries);
      markDirty(`${entries.length}件を一括「${statusLabel(status)}」に変更`);
    }
    checkedIds.value = new Set();
    showBulkModal.value = false;
  };

  return {
    undoStack,
    redoStack,
    canUndo,
    canRedo,
    undo,
    redo,
    setStatus,
    resetStatus,
    bulkSetStatus,
    checkedIds,
    toggleCheck,
    toggleCheckAll,
    counts,
    showCompleteModal,
    showBulkModal,
  };
}
