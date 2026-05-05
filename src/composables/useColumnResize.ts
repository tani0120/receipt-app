import { ref, onMounted, type Ref } from 'vue'

/**
 * テーブル列幅カスタマイズ用composable
 *
 * - ドラッグで列幅変更
 * - localStorageで永続化
 * - リロード後に復元
 *
 * @param pageKey - ページ識別子（localStorageキーに使用）
 * @param defaultWidths - 列keyごとのデフォルト幅(px)
 */
export function useColumnResize(
  pageKey: string,
  defaultWidths: Record<string, number>
) {
  const STORAGE_KEY = `sugu-suru:column-widths:${pageKey}`
  const MIN_WIDTH = 24

  // --- 列幅state ---
  const columnWidths: Ref<Record<string, number>> = ref({ ...defaultWidths })

  // --- localStorage復元 ---
  onMounted(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, number>
        // デフォルトにないキーは無視、あるキーだけマージ
        for (const key of Object.keys(defaultWidths)) {
          if (typeof parsed[key] === 'number' && parsed[key] >= MIN_WIDTH) {
            columnWidths.value[key] = parsed[key]
          }
        }
      }
    } catch {
      // パースエラーは無視
    }
  })

  // --- localStorage保存 ---
  function saveWidths() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnWidths.value))
    } catch {
      // ストレージ満杯等は無視
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
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // 無視
    }
  }

  return {
    columnWidths,
    onResizeStart,
    resetWidths
  }
}
