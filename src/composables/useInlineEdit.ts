/**
 * useInlineEdit.ts — セルインライン編集 + Undo/Redo composable
 *
 * JournalListLevel3Mock.vue から抽出。
 * テンプレートが参照する editingCell / editingValue / isEditing 等を提供。
 *
 * 依存:
 *   - journals (ShallowRef): 仕訳一覧データ
 *   - paginatedJournals (ComputedRef): ページネーション済み仕訳
 *   - updateJournalField: 中央更新口
 *   - clientSettings.accounts: 科目名解決（startCellEdit内）
 *   - getCombinedRows: 行展開
 *   - assertEditableJournal: 取込仕訳ガード
 */

import { ref, nextTick } from 'vue'
import type { ShallowRef, ComputedRef } from 'vue'
import type { JournalPhase5Mock, JournalEntryLine } from '@/types/journal_phase5_mock.type'
import type { UiJournal } from '@/types/journal-ui.types'
import type { ConfirmedJournalEntry } from '@/types/confirmed_journal.type'
import type { Account } from '@/types/shared-account'

// ────── 型定義 ──────

/** getCombinedRowsの行型 */
export type UiEntryLine = JournalEntryLine | ConfirmedJournalEntry
export type CombinedRow = { debit: UiEntryLine | null; credit: UiEntryLine | null }

/** Undoスナップショット */
export interface UndoSnapshot {
  journalId: string
  json: string
}
export interface UndoEntry {
  before: UndoSnapshot[]
  after: UndoSnapshot[]
}

/** 編集中セル情報 */
export interface EditingCellInfo {
  journalId: string
  rowIndex: number
  colKey: string
}

/** composable初期化パラメータ */
export interface UseInlineEditOptions {
  journals: ShallowRef<UiJournal[]>
  updateJournalField: (journalId: string, patch: Record<string, unknown>, options?: { silent?: boolean }) => void
  accounts: ComputedRef<Account[]>
  assertEditableJournal: (journal: UiJournal, caller: string) => journal is JournalPhase5Mock
}

// ────── composable ──────

export function useInlineEdit(options: UseInlineEditOptions) {
  const {
    journals,
    updateJournalField,
    accounts,
    assertEditableJournal,
  } = options

  // ────── 編集状態 ──────
  const editingCell = ref<EditingCellInfo | null>(null)
  const editingValue = ref<string>('')
  const editingOriginalValue = ref<string>('')

  // ────── Undo/Redo ──────
  const undoStack = ref<UndoEntry[]>([])
  const redoStack = ref<UndoEntry[]>([])
  const UNDO_MAX = 50

  function snapshotJournal(journalId: string): UndoSnapshot | null {
    const j = journals.value.find((x) => x.journalId === journalId)
    if (!j) return null
    return { journalId, json: JSON.stringify(j) }
  }

  function restoreSnapshot(snap: UndoSnapshot): void {
    const idx = journals.value.findIndex((x) => x.journalId === snap.journalId)
    if (idx < 0) return
    const parsed: unknown = JSON.parse(snap.json)
    if (!parsed || typeof parsed !== 'object' || !('journalId' in parsed)) return
    const restored: JournalPhase5Mock = parsed as JournalPhase5Mock
    journals.value[idx] = restored
    // 復元後の全フィールドをPATCH送信
    updateJournalField(snap.journalId, {
      voucher_date: restored.voucher_date,
      description: restored.description,
      debit_entries: restored.debit_entries,
      credit_entries: restored.credit_entries,
      labels: [...restored.labels],
      is_read: restored.is_read,
      status: restored.status,
      deleted_at: restored.deleted_at,
      deleted_by: restored.deleted_by,
      voucher_type: restored.voucher_type,
      staff_notes: restored.staff_notes,
      warning_dismissals: restored.warning_dismissals,
      determination_method: restored.determination_method ?? null,
      source: restored.source ?? null,
    })
  }

  function pushUndo(before: UndoSnapshot[], after: UndoSnapshot[]): void {
    undoStack.value.push({ before, after })
    if (undoStack.value.length > UNDO_MAX) undoStack.value.shift()
    redoStack.value = [] // 新しい操作でredoスタックをクリア
  }

  function undo(): void {
    const entry = undoStack.value.pop()
    if (!entry) return
    // 復元前に現在状態をredoスタックに保存
    const currentSnapshots = entry.before
      .map((s) => snapshotJournal(s.journalId))
      .filter((s): s is UndoSnapshot => s !== null)
    for (const snap of entry.before) restoreSnapshot(snap)
    redoStack.value.push({ before: currentSnapshots, after: entry.before })
  }

  function redo(): void {
    const entry = redoStack.value.pop()
    if (!entry) return
    // 復元前に現在状態をundoスタックに保存
    const currentSnapshots = entry.before
      .map((s) => snapshotJournal(s.journalId))
      .filter((s): s is UndoSnapshot => s !== null)
    for (const snap of entry.before) restoreSnapshot(snap)
    undoStack.value.push({ before: currentSnapshots, after: entry.before })
  }

  // ────── セル編集 ──────

  function isEditing(journalId: string, rowIndex: number, colKey: string): boolean {
    const e = editingCell.value
    return e !== null && e.journalId === journalId && e.rowIndex === rowIndex && e.colKey === colKey
  }

  function startCellEdit(
    journalId: string,
    rowIndex: number,
    colKey: string,
    currentValue: unknown,
  ): void {
    const journal = journals.value.find((j) => j.journalId === journalId)
    if (!journal || !assertEditableJournal(journal, 'startCellEdit')) return
    editingCell.value = { journalId, rowIndex, colKey }
    let val = currentValue != null ? String(currentValue) : ''
    // 勘定科目列の場合: IDを日本語名に変換して検索欄に表示
    if (colKey.endsWith('.account') && val) {
      const allAccts = accounts.value
      const acc = allAccts.find((a) => a.accountId === val)
      if (acc) val = acc.name
    }
    editingValue.value = val
    editingOriginalValue.value = val
    nextTick(() => {
      const el = document.querySelector('.inline-edit-input')
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
        el.focus()
        if (el instanceof HTMLInputElement) el.select()
      }
    })
  }

  function commitCellEdit(): void {
    const e = editingCell.value
    if (!e) return
    const journal = journals.value.find((j) => j.journalId === e.journalId)
    if (!journal) {
      editingCell.value = null
      return
    }
    if (!assertEditableJournal(journal, 'commitCellEdit')) {
      editingCell.value = null
      return
    }

    const val = editingValue.value

    // Undo記録: 変更前スナップショット
    const beforeSnap = snapshotJournal(journal.journalId)

    // 適格列の特殊処理
    if (e.colKey === 'invoice') {
      const newLabels = journal.labels.filter(
        (l: string) => l !== 'INVOICE_QUALIFIED' && l !== 'INVOICE_NOT_QUALIFIED',
      )
      if (val === '◯') newLabels.push('INVOICE_QUALIFIED')
      else if (val === '✕') newLabels.push('INVOICE_NOT_QUALIFIED')
      editingCell.value = null
      updateJournalField(e.journalId, { labels: newLabels })
      // Undo記録
      if (beforeSnap) {
        const afterSnap = snapshotJournal(journal.journalId)
        if (afterSnap) pushUndo([beforeSnap], [afterSnap])
      }
      return
    }

    // patch構築（直接変更せずupdateJournalFieldに委譲）
    const patch: Partial<JournalPhase5Mock> = {}

    // journal-level（keyにドットなし）
    if (!e.colKey.includes('.')) {
      if (e.colKey === 'voucher_date') {
        patch.voucher_date = parseDateInput(val)
      } else if (e.colKey === 'description') {
        patch.description = val
      }
    } else {
      // entry-level（debit.amount → row.debit.amount）
      const rows = getCombinedRows(journal)
      const row = rows[e.rowIndex]
      if (row) {
        const parts = e.colKey.split('.')
        const sideStr = parts[0]
        if (sideStr !== 'debit' && sideStr !== 'credit') return
        const field = parts[1]
        if (field) {
          const entry = row[sideStr]
          if (entry) {
            setEntryField(entry as JournalEntryLine, field, val)
          }
        }
      }
      // entry変更後、entries全体をpatchに含める
      patch.debit_entries = journal.debit_entries
      patch.credit_entries = journal.credit_entries
    }

    editingCell.value = null

    // updateJournalFieldで一括処理
    updateJournalField(e.journalId, patch, { silent: false })

    // Undo記録: 変更後スナップショット
    if (beforeSnap) {
      const afterSnap = snapshotJournal(journal.journalId)
      if (afterSnap) pushUndo([beforeSnap], [afterSnap])
    }
  }

  function cancelCellEdit(): void {
    editingCell.value = null
  }

  // ────── ユーティリティ ──────

  /** 金額入力: 半角数字以外を除去 */
  function onAmountInput(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return
    event.target.value = event.target.value.replace(/[^0-9]/g, '')
    editingValue.value = event.target.value
  }

  /** 日付入力: YYYYMMDD → YYYY-MM-DD変換 */
  function parseDateInput(val: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val
    const digits = val.replace(/[^0-9]/g, '')
    if (digits.length === 8) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
    }
    return val
  }

  /**
   * JournalEntryLineの動的フィールド書き込み（型安全ヘルパー）
   */
  function setEntryField(entry: JournalEntryLine, field: string, value: unknown): void {
    const strVal = typeof value === 'string' ? value : ''
    switch (field) {
      case 'account':
        entry.account = strVal || null
        break
      case 'sub_account':
        entry.sub_account = strVal || null
        break
      case 'department':
        entry.department = strVal || null
        break
      case 'amount':
        entry.amount = value != null && value !== '' ? Number(value) : null
        break
      case 'tax_category_id':
        entry.tax_category_id = strVal || null
        break
      default:
        console.warn(`[setEntryField] 未知のフィールド: ${field}`)
        break
    }
  }

  /** 借方/貸方行の結合（テーブル行展開） */
  function getCombinedRows(journal: UiJournal): CombinedRow[] {
    const maxRows = Math.max(journal.debit_entries.length, journal.credit_entries.length)
    return Array.from({ length: maxRows }, (_, i) => ({
      debit: journal.debit_entries[i] || null,
      credit: journal.credit_entries[i] || null,
    }))
  }

  /** 複合仕訳判定（1対N or N対N） */
  function isCompoundJournal(journal: UiJournal): boolean {
    return journal.debit_entries.length > 1 || journal.credit_entries.length > 1
  }

  /** エントリが存在するか判定（複合仕訳の空セル無反応化に使用） */
  function hasEntry(row: CombinedRow, colKey: string): boolean {
    if (!colKey.includes('.')) return true
    const side = colKey.startsWith('debit') ? 'debit' : 'credit'
    return row[side] != null
  }

  return {
    // 編集状態
    editingCell,
    editingValue,
    editingOriginalValue,
    // Undo/Redo
    undoStack,
    redoStack,
    snapshotJournal,
    pushUndo,
    undo,
    redo,
    // セル編集
    isEditing,
    startCellEdit,
    commitCellEdit,
    cancelCellEdit,
    onAmountInput,
    parseDateInput,
    // ユーティリティ
    setEntryField,
    getCombinedRows,
    isCompoundJournal,
    hasEntry,
  }
}
