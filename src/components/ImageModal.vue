<script setup lang="ts">
/**
 * ImageModal — 画像プレビューモーダル（ドラッグ移動・回転・ズーム・パン対応）
 *
 * 親コンポーネントから imageUrl を受け取り、Teleport で body 直下に描画する。
 * journals への依存はゼロ。hoveredJournalId は親で管理する。
 */
import { ref } from "vue";
import { useDraggable } from "@/composables/useDraggable";
import { modalDrag } from "@/utils/modalDrag";
import { UI_MSG } from "@/constants/uiMessages";

const props = defineProps<{
  imageUrl: string | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "hide"): void;
}>();

// ── 回転・ズーム ──
const rotationAngle = ref(0);
const zoomScale = ref(1);

// ── 画像パン操作 ──
const offsetX = ref(0);
const offsetY = ref(0);
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);

// ── ドラッグ移動 ──
const imageModalRef = ref<HTMLElement | null>(null);
const {
  position: imageModalPos,
  zIndex: imageModalZ,
  startDrag: startImageDrag,
} = useDraggable(imageModalRef);

// ── 画像読込時のサイズ調整（CSS resize: both で実質未使用だが情報記録用） ──
const baseModalWidth = ref(300);
const baseModalHeight = ref(400);

function zoomIn() {
  zoomScale.value = Math.min(zoomScale.value + 0.25, 7);
}

function zoomOut() {
  zoomScale.value = Math.max(zoomScale.value - 0.25, 0.5);
}

function onImageLoad(event: Event) {
  const img = event.target as HTMLImageElement;
  const aspectRatio = img.naturalWidth / img.naturalHeight;
  if (aspectRatio > 1.2) {
    baseModalWidth.value = 500;
    baseModalHeight.value = 300;
  } else if (aspectRatio < 0.8) {
    baseModalWidth.value = 300;
    baseModalHeight.value = 500;
  } else {
    baseModalWidth.value = 400;
    baseModalHeight.value = 400;
  }
}

function onMouseDown(event: MouseEvent) {
  isDragging.value = true;
  dragStartX.value = event.clientX - offsetX.value;
  dragStartY.value = event.clientY - offsetY.value;
  event.preventDefault();
}

function onMouseMove(event: MouseEvent) {
  if (isDragging.value) {
    offsetX.value = event.clientX - dragStartX.value;
    offsetY.value = event.clientY - dragStartY.value;
  }
}

function onMouseUp() {
  isDragging.value = false;
}

/** imageUrl が変わったら状態リセット（親の showImageModal 相当） */
function resetState() {
  rotationAngle.value = 0;
  zoomScale.value = 1;
  offsetX.value = 0;
  offsetY.value = 0;
}

// imageUrl 変更時にリセット
import { watch } from "vue";
watch(() => props.imageUrl, (newVal) => {
  if (newVal) resetState();
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="imageUrl"
      class="fixed inset-0 z-40 pointer-events-none"
      @click="emit('hide')"
    ></div>
    <div
      v-if="imageUrl"
      ref="imageModalRef"
      :style="{
        top: imageModalPos.top + 'px',
        left: imageModalPos.left + 'px',
        zIndex: imageModalZ,
      }"
      class="fixed bg-white rounded-lg shadow-2xl flex flex-col pointer-events-auto overflow-auto cursor-move w-[300px] h-[400px]"
      style="resize: both; min-width: 200px; min-height: 200px"
      @mousedown="modalDrag(startImageDrag, $event)"
    >
      <!-- ドラッグハンドル（ヘッダー） -->
      <div
        class="bg-blue-100 px-3 py-1.5 flex justify-between items-center cursor-move rounded-t-lg select-none"
        @mousedown="startImageDrag"
      >
        <span class="text-xs font-bold text-gray-900"
          >画像プレビュー <span class="font-normal text-amber-600">※移動できます</span></span
        >
        <button @click="emit('close')" class="text-gray-500 hover:text-gray-700">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>
      <!-- ツールバー -->
      <div class="flex items-center gap-1 px-2 py-1 bg-gray-100 border-b border-gray-200">
        <button
          @click.stop="rotationAngle = (rotationAngle + 90) % 360"
          class="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow transition-colors"
          :title="UI_MSG.ツールチップ_回転"
        >
          <i class="fa-solid fa-rotate-right text-xs"></i>
        </button>
        <button
          @click.stop="zoomIn"
          class="bg-green-500 hover:bg-green-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow transition-colors"
          :title="UI_MSG.ツールチップ_拡大"
        >
          <i class="fa-solid fa-magnifying-glass-plus text-xs"></i>
        </button>
        <button
          @click.stop="zoomOut"
          class="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow transition-colors"
          :title="UI_MSG.ツールチップ_縮小"
        >
          <i class="fa-solid fa-magnifying-glass-minus text-xs"></i>
        </button>
      </div>
      <!-- 画像表示エリア -->
      <div class="flex-1 flex items-center justify-center overflow-hidden rounded-b-lg">
        <template v-if="imageUrl?.toLowerCase().endsWith('.pdf')">
          <iframe :src="imageUrl" class="w-full h-full border-0"></iframe>
        </template>
        <img
          v-else
          :src="imageUrl"
          :alt="UI_MSG.画像ALT_領収書"
          :style="{
            transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotationAngle}deg) scale(${zoomScale})`,
            imageOrientation: 'from-image',
            cursor: isDragging ? 'grabbing' : 'grab',
          }"
          class="max-w-full max-h-full object-contain transition-transform duration-300"
          @load="onImageLoad"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseUp"
        />
      </div>
      <!-- リサイズグリップインジケーター -->
      <div
        class="absolute bottom-0 right-0 w-5 h-5 pointer-events-none"
        style="
          background: linear-gradient(
            135deg,
            transparent 50%,
            rgba(59, 130, 246, 0.5) 50%,
            rgba(59, 130, 246, 0.7) 100%
          );
          border-radius: 0 0 0.5rem 0;
        "
      ></div>
    </div>
  </Teleport>
</template>
