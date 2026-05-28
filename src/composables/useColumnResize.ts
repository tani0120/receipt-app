import { ref, onMounted, type Ref } from 'vue'
import { useColumnResizeStore } from '@/stores/columnResizeStore'

/**
 * テーブル列幅カスタマイズ用composable（Piniaストア委譲版）
 *
 * 内部はcolumnResizeStoreに完全委譲。returnインターフェース変更ゼロ。
 *
 * @param pageKey - ページ識別子
 * @param defaultWidths - 列keyごとのデフォルト幅(px)
 */
export function useColumnResize(
  pageKey: string,
  defaultWidths: Record<string, number>
) {
  const store = useColumnResizeStore()
  const MIN_WIDTH = 24

  // --- 列幅state ---
  const columnWidths: Ref<Record<string, number>> = ref({ ...defaultWidths })

  // --- ストアから復元 ---
  onMounted(() => {
    const saved = store.getWidths(pageKey, defaultWidths)
    for (const key of Object.keys(defaultWidths)) {
      if (typeof saved[key] === 'number' && saved[key] >= MIN_WIDTH) {
        columnWidths.value[key] = saved[key]
      }
    }
  })

  // --- ストア保存 ---
  function saveWidths() {
    for (const [key, width] of Object.entries(columnWidths.value)) {
      store.setWidth(pageKey, key, width)
    }
  }

  // --- リサイズ開始（ヘッダーのリサイズハンドルのmousedownで呼ぶ） ---
  function onResizeStart(colKey: string, e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation() // ソートクリックと競合防止

    const startX = e.clientX
    const startWidth = columnWidths.value[colKey] ?? defaultWidths[colKey] ?? 80

    // テキスト選択防止
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'

    function onMouseMove(ev: MouseEvent) {
      const diff = ev.clientX - startX
      const newWidth = Math.max(MIN_WIDTH, startWidth + diff)
      columnWidths.value[colKey] = newWidth
    }

    function onMouseUp() {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      saveWidths()
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // --- 幅リセット ---
  function resetWidths() {
    columnWidths.value = { ...defaultWidths }
    store.resetPage(pageKey)
  }

  return {
    columnWidths,
    onResizeStart,
    resetWidths
  }
}
