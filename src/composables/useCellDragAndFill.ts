/**
 * useCellDragAndFill.ts — セル間ドラッグ&ドロップ + フィルハンドル composable
 *
 * JournalListLevel3Mock.vue から抽出。
 * テンプレートが参照する startCellDrag / isDragOver / startFillDrag / isFillTargetCell 等を提供。
 * onMounted/onUnmounted でグローバルイベント登録も内包。
 */

import { ref, onMounted, onUnmounted } from 'vue'
import type { ShallowRef, Ref } from 'vue'
import type { JournalPhase5Mock, JournalEntryLine } from '@/types/journal_phase5_mock.type'
import type { UiJournal } from '@/types/journal-ui.types'
import { isImportedJournal } from '@/types/journal-list-row'
import type { UndoSnapshot } from '@/composables/useInlineEdit'

// ────── 型定義 ──────

export interface CellDragState {
  sourceColKey: string
  sourceValue: unknown
  sourceLabel: string
  startX: number
  startY: number
  dragReady: boolean
  dragging: boolean
  dropJournalIndex: number | null
  dropRowIndex: number | null
  dropColKey: string | null
}

export interface FillHandleState {
  colKey: string
  sourceJournalIndex: number
  sourceValue: unknown
  targetJournalIndices: number[]
}

export interface UseCellDragAndFillOptions {
  journals: ShallowRef<UiJournal[]>
  editingCell: Ref<{ journalId: string; rowIndex: number; colKey: string } | null>
  updateJournalField: (journalId: string, patch: Record<string, unknown>, options?: { silent?: boolean }) => void
  snapshotJournal: (journalId: string) => UndoSnapshot | null
  pushUndo: (before: UndoSnapshot[], after: UndoSnapshot[]) => void
  setEntryField: (entry: JournalEntryLine, field: string, value: unknown) => void
  isCompoundJournal: (journal: UiJournal) => boolean
  assertEditableJournal: (journal: UiJournal, caller: string) => journal is JournalPhase5Mock
  resolveDefaultTaxForClient: (defaultTaxName: string) => string
  accounts: { value: { accountId: string; name: string; defaultTaxCategoryId?: string }[] }
  subAccounts: { value: Record<string, { name: string }[]> }
  /** 初回ロード時に呼ばれるコールバック（syncWarningLabels等） */
  onMountedCallback?: () => void
}

// ────── composable ──────

export function useCellDragAndFill(options: UseCellDragAndFillOptions) {
  const {
    journals,
    editingCell,
    updateJournalField,
    snapshotJournal,
    pushUndo,
    setEntryField,
    isCompoundJournal,
    assertEditableJournal,
    resolveDefaultTaxForClient,
    accounts,
    subAccounts,
    onMountedCallback,
  } = options

  // ────── フィルハンドル ──────

  const FILL_HANDLE_COLS = new Set([
    'voucher_date',
    'description',
    'debit.account',
    'debit.sub_account',
    'debit.tax_category_id',
    'credit.account',
    'credit.sub_account',
    'credit.tax_category_id',
  ])

  function isFillable(colKey: string): boolean {
    return FILL_HANDLE_COLS.has(colKey)
  }

  const fillHandle = ref<FillHandleState | null>(null)

  function startFillDrag(
    journalIndex: number,
    colKey: string,
    value: unknown,
    event: MouseEvent,
  ): void {
    event.preventDefault()
    fillHandle.value = {
      colKey,
      sourceJournalIndex: journalIndex,
      sourceValue: value,
      targetJournalIndices: [],
    }
  }

  function onFillMove(event: MouseEvent): void {
    if (!fillHandle.value) return
    const el = document.elementFromPoint(event.clientX, event.clientY)
    if (!el) return
    if (!(el instanceof HTMLElement)) return
    const rowEl = el.closest<HTMLElement>('[data-journal-index]')
    if (!rowEl) return
    const idx = parseInt(rowEl.dataset.journalIndex ?? '', 10)
    if (isNaN(idx)) return
    const src = fillHandle.value.sourceJournalIndex
    if (idx === src) {
      fillHandle.value = { ...fillHandle.value, targetJournalIndices: [] }
      return
    }
    const start = Math.min(src, idx)
    const end = Math.max(src, idx)
    const indices: number[] = []
    for (let i = start; i <= end; i++) {
      if (i === src) continue
      const j = journals.value[i]
      if (j && j.status !== 'exported' && j.deleted_at === null && !isCompoundJournal(j)) {
        indices.push(i)
      }
    }
    fillHandle.value = { ...fillHandle.value, targetJournalIndices: indices }
  }

  function endFillDrag(): void {
    if (!fillHandle.value) return
    const { colKey, sourceValue, targetJournalIndices } = fillHandle.value
    const beforeSnaps = targetJournalIndices
      .map((idx) => journals.value[idx])
      .filter((x): x is JournalPhase5Mock => !!x)
      .map((j) => snapshotJournal(j.journalId))
      .filter((s): s is UndoSnapshot => s !== null)
    for (const idx of targetJournalIndices) {
      const journal = journals.value[idx]
      if (!journal) continue
      if (isImportedJournal(journal)) continue
      applyFillValue(journal, colKey, sourceValue)
      const fillPatch: Record<string, unknown> = {}
      if (!colKey.includes('.')) {
        if (colKey === 'voucher_date') fillPatch.voucher_date = journal.voucher_date
        else if (colKey === 'description') fillPatch.description = journal.description
      } else {
        fillPatch.debit_entries = journal.debit_entries
        fillPatch.credit_entries = journal.credit_entries
      }
      updateJournalField(journal.journalId, fillPatch)
    }
    if (beforeSnaps.length > 0) {
      const afterSnaps = beforeSnaps
        .map((s) => snapshotJournal(s.journalId))
        .filter((s): s is UndoSnapshot => s !== null)
      pushUndo(beforeSnaps, afterSnaps)
    }
    fillHandle.value = null
  }

  function applyFillValue(
    journal: UiJournal,
    colKey: string,
    value: unknown,
    targetRowIndex?: number,
  ): void {
    if (!assertEditableJournal(journal, 'applyFillValue')) return
    if (!colKey.includes('.')) {
      if (colKey === 'voucher_date') {
        journal.voucher_date = typeof value === 'string' ? value : null
      } else if (colKey === 'description') {
        journal.description = typeof value === 'string' ? value : ''
      }
    } else {
      const parts = colKey.split('.')
      const sideStr = parts[0]
      if (sideStr !== 'debit' && sideStr !== 'credit') return
      const field = parts[1]
      if (!field) return

      const entries = sideStr === 'debit' ? journal.debit_entries : journal.credit_entries
      const targetEntries = (
        targetRowIndex != null && targetRowIndex < entries.length
          ? [entries[targetRowIndex]]
          : entries
      ).filter((e): e is NonNullable<typeof e> => e != null)
      const strValue = typeof value === 'string' ? value : ''
      for (const entry of targetEntries) {
        if (colKey.endsWith('.account')) {
          entry.account = strValue || null
          const accountId = strValue
          if (accountId) {
            const allAccts = accounts.value
            const acc = allAccts.find((a) => a.accountId === accountId)
            if (acc?.defaultTaxCategoryId) {
              entry.tax_category_id = resolveDefaultTaxForClient(acc.defaultTaxCategoryId)
            }
            if (acc) {
              const sub = subAccounts.value[acc.accountId]
              entry.sub_account = sub?.length === 1 ? sub[0]?.name ?? null : null
            }
          } else {
            entry.sub_account = null
          }
        } else {
          setEntryField(entry, field, value)
        }
      }
    }
  }

  function isFillTargetCell(journalIndex: number, colKey: string): boolean {
    if (!fillHandle.value) return false
    return (
      fillHandle.value.targetJournalIndices.includes(journalIndex) &&
      fillHandle.value.colKey === colKey
    )
  }

  // ────── セル間ドラッグ&ドロップ ──────

  const DRAG_HOLD_MS = 150
  const cellDrag = ref<CellDragState | null>(null)
  let dragTimerId: ReturnType<typeof setTimeout> | null = null

  const dragLabelVisible = ref(false)
  const dragLabelText = ref('')
  const dragLabelX = ref(0)
  const dragLabelY = ref(0)

  function startCellDrag(colKey: string, value: unknown, event: MouseEvent): void {
    if (editingCell.value) return
    const x = event.clientX
    const y = event.clientY
    const label = value != null ? String(value) : ''
    cancelDragTimer()
    dragTimerId = setTimeout(() => {
      cellDrag.value = {
        sourceColKey: colKey,
        sourceValue: value,
        sourceLabel: label,
        startX: x,
        startY: y,
        dragReady: true,
        dragging: false,
        dropJournalIndex: null,
        dropRowIndex: null,
        dropColKey: null,
      }
      document.body.classList.add('cell-drag-ready')
    }, DRAG_HOLD_MS)
  }

  function cancelDragTimer(): void {
    if (dragTimerId !== null) {
      clearTimeout(dragTimerId)
      dragTimerId = null
    }
  }

  function onCellDragMove(event: MouseEvent): void {
    if (!cellDrag.value || !cellDrag.value.dragReady) return
    if (!cellDrag.value.dragging) {
      const dx = event.clientX - cellDrag.value.startX
      const dy = event.clientY - cellDrag.value.startY
      if (Math.sqrt(dx * dx + dy * dy) < 5) return
      cellDrag.value = { ...cellDrag.value, dragging: true }
      document.body.classList.remove('cell-drag-ready')
      document.body.classList.add('cell-dragging')
    }
    dragLabelText.value = cellDrag.value.sourceLabel
    dragLabelX.value = event.clientX + 14
    dragLabelY.value = event.clientY - 10
    dragLabelVisible.value = true
    const el = document.elementFromPoint(event.clientX, event.clientY)
    if (!el) return
    if (!(el instanceof HTMLElement)) return
    const cellEl = el.closest<HTMLElement>('[data-drag-col]')
    const rowEl = el.closest<HTMLElement>('[data-journal-index]')
    if (cellEl && rowEl) {
      const ji = parseInt(rowEl.dataset.journalIndex ?? '', 10)
      const ri = parseInt(cellEl.dataset.dragRow ?? '0', 10)
      const ck = cellEl.dataset.dragCol ?? ''
      cellDrag.value = {
        ...cellDrag.value,
        dropJournalIndex: ji,
        dropRowIndex: ri,
        dropColKey: ck,
      }
    } else {
      cellDrag.value = {
        ...cellDrag.value,
        dropJournalIndex: null,
        dropRowIndex: null,
        dropColKey: null,
      }
    }
  }

  /** D&D列一致判定（借方↔貸方の同フィールドも許可） */
  function isDragColCompatible(sourceColKey: string, dropColKey: string): boolean {
    if (sourceColKey === dropColKey) return true
    const srcField = sourceColKey.includes('.') ? sourceColKey.split('.')[1] : sourceColKey
    const dstField = dropColKey.includes('.') ? dropColKey.split('.')[1] : dropColKey
    return srcField === dstField
  }

  function endCellDrag(): void {
    cancelDragTimer()
    if (!cellDrag.value) return
    if (
      cellDrag.value.dragging &&
      cellDrag.value.dropJournalIndex !== null &&
      cellDrag.value.dropColKey &&
      isDragColCompatible(cellDrag.value.sourceColKey, cellDrag.value.dropColKey)
    ) {
      const journal = journals.value[cellDrag.value.dropJournalIndex]
      if (journal && assertEditableJournal(journal, 'endCellDrag') && journal.status !== 'exported' && journal.deleted_at === null) {
        const beforeSnap = snapshotJournal(journal.journalId)
        applyFillValue(
          journal,
          cellDrag.value.dropColKey,
          cellDrag.value.sourceValue,
          cellDrag.value.dropRowIndex ?? undefined,
        )
        const dragPatch: Record<string, unknown> = {}
        const dColKey = cellDrag.value.dropColKey
        if (!dColKey.includes('.')) {
          if (dColKey === 'voucher_date') dragPatch.voucher_date = journal.voucher_date
          else if (dColKey === 'description') dragPatch.description = journal.description
        } else {
          dragPatch.debit_entries = journal.debit_entries
          dragPatch.credit_entries = journal.credit_entries
        }
        updateJournalField(journal.journalId, dragPatch)
        if (beforeSnap) {
          const afterSnap = snapshotJournal(journal.journalId)
          if (afterSnap) pushUndo([beforeSnap], [afterSnap])
        }
      }
    }
    document.body.classList.remove('cell-drag-ready', 'cell-dragging')
    cellDrag.value = null
    dragLabelVisible.value = false
  }

  function isDragOver(journalIndex: number, rowIndex: number, colKey: string): boolean {
    if (!cellDrag.value || !cellDrag.value.dragging) return false
    return (
      cellDrag.value.dropJournalIndex === journalIndex &&
      cellDrag.value.dropRowIndex === rowIndex &&
      cellDrag.value.dropColKey === colKey
    )
  }

  function isDragCompatibleCol(colKey: string): boolean {
    if (!cellDrag.value || !cellDrag.value.dragging) return false
    return isDragColCompatible(cellDrag.value.sourceColKey, colKey)
  }

  function isDragIncompatibleCol(colKey: string): boolean {
    if (!cellDrag.value || !cellDrag.value.dragging) return false
    return !isDragColCompatible(cellDrag.value.sourceColKey, colKey)
  }

  // ────── グローバルイベント登録 ──────

  function onGlobalMouseMove(event: MouseEvent) {
    onFillMove(event)
    onCellDragMove(event)
  }

  function onGlobalMouseUp() {
    endFillDrag()
    endCellDrag()
  }

  onMounted(() => {
    document.addEventListener('mousemove', onGlobalMouseMove)
    document.addEventListener('mouseup', onGlobalMouseUp)
    onMountedCallback?.()
  })

  onUnmounted(() => {
    document.removeEventListener('mousemove', onGlobalMouseMove)
    document.removeEventListener('mouseup', onGlobalMouseUp)
  })

  return {
    // フィルハンドル
    fillHandle,
    isFillable,
    startFillDrag,
    isFillTargetCell,
    applyFillValue,
    // セルドラッグ
    cellDrag,
    dragLabelVisible,
    dragLabelText,
    dragLabelX,
    dragLabelY,
    startCellDrag,
    isDragOver,
    isDragCompatibleCol,
    isDragIncompatibleCol,
  }
}
