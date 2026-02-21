import { ref, watch, onUnmounted, nextTick, type Ref } from 'vue'

// グローバルz-indexカウンタ（モジュールレベル）
let globalZIndex = 1000

/**
 * ドラッグ可能モーダル用composable
 * 方式B: elRefをwatchし、DOM出現時に自動で中央配置
 *
 * @param elRef - ドラッグ対象要素のtemplate ref
 * @returns position, zIndex, startDrag, bringToFront
 */
export function useDraggable(elRef: Ref<HTMLElement | null>) {
    const position = ref({ top: 0, left: 0 })
    const zIndex = ref(++globalZIndex)
    const isDragging = ref(false)
    const dragOffset = ref({ x: 0, y: 0 })

    // --- 中央配置 ---
    function centerModal() {
        const el = elRef.value
        if (!el) return
        const rect = el.getBoundingClientRect()
        position.value = {
            left: (window.innerWidth - rect.width) / 2,
            top: (window.innerHeight - rect.height) / 2
        }
    }

    // --- DOM出現時に中央配置（方式B） ---
    watch(elRef, async (el) => {
        if (!el) return
        await nextTick()
        centerModal()
        bringToFront()
    })

    // --- 最前面に持ってくる ---
    function bringToFront() {
        globalZIndex++
        zIndex.value = globalZIndex
    }

    // --- ドラッグ開始（ヘッダーのmousedownで呼ぶ） ---
    function startDrag(e: MouseEvent) {
        isDragging.value = true
        dragOffset.value = {
            x: e.clientX - position.value.left,
            y: e.clientY - position.value.top
        }
        // テキスト選択防止（方式B: body user-select制御）
        document.body.style.userSelect = 'none'
        document.addEventListener('mousemove', onDrag)
        document.addEventListener('mouseup', stopDrag)
        bringToFront()
    }

    // --- 移動処理（clamp付き） ---
    function onDrag(e: MouseEvent) {
        if (!isDragging.value) return

        const el = elRef.value
        if (!el) return

        const rect = el.getBoundingClientRect()
        const newLeft = e.clientX - dragOffset.value.x
        const newTop = e.clientY - dragOffset.value.y

        // 画面外に出ないようclamp
        const maxLeft = window.innerWidth - rect.width
        const maxTop = window.innerHeight - rect.height

        position.value = {
            left: Math.max(0, Math.min(newLeft, maxLeft)),
            top: Math.max(0, Math.min(newTop, maxTop))
        }
    }

    // --- ドラッグ終了 ---
    function stopDrag() {
        isDragging.value = false
        document.body.style.userSelect = ''
        document.removeEventListener('mousemove', onDrag)
        document.removeEventListener('mouseup', stopDrag)
    }

    // --- クリーンアップ（リーク防止） ---
    onUnmounted(() => {
        document.removeEventListener('mousemove', onDrag)
        document.removeEventListener('mouseup', stopDrag)
        document.body.style.userSelect = ''
    })

    return {
        position,
        zIndex,
        startDrag,
        bringToFront
    }
}
