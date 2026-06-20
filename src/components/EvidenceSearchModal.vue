<script setup lang="ts">
/**
 * EvidenceSearchModal — 根拠資料検索モーダル + 画像プレビュー
 *
 * journals への依存はゼロ。API経由で根拠資料を検索し、プレビュー表示する。
 * supportingMatchMap（紐づけキャッシュ）はテーブル行内で使われるため親に残す。
 */
import { ref, nextTick } from "vue";
import { useDraggable } from "@/composables/useDraggable";
import { modalDrag } from "@/utils/modalDrag";
import { UI_MSG } from "@/constants/uiMessages";

const props = defineProps<{
  visible: boolean;
  clientId: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

// ── 検索モーダル ──
const supportingSearchModalRef = ref<HTMLElement | null>(null);
const {
  position: supportingSearchPos,
  zIndex: supportingSearchZ,
  startDrag: startSupportingSearchDrag,
} = useDraggable(supportingSearchModalRef);

// ── 画像プレビューモーダル ──
const supportingImageModalRef = ref<HTMLElement | null>(null);
const {
  position: supportingImagePos,
  zIndex: supportingImageZ,
  startDrag: startSupportingImageDrag,
} = useDraggable(supportingImageModalRef);

// ── 検索状態 ──
const supportingSearchQuery = ref("");

export type SupportingMetaItem = {
  id: string;
  fileName: string;
  previewUrl: string;
  date: string | null;
  amount: number | null;
  vendor: string | null;
  description: string | null;
  sourceType: string | null;
};

const supportingSearchResults = ref<SupportingMetaItem[]>([]);
const isSupportingSearching = ref(false);
const supportingSearchDone = ref(false);
const supportingSearchInputRef = ref<HTMLInputElement | null>(null);

// ── 画像プレビュー状態 ──
const supportingPreviewUrl = ref<string | null>(null);
const supportingRotation = ref(0);
const supportingZoom = ref(1);

let supportingSearchTimer: ReturnType<typeof setTimeout> | null = null;

// ── 検索操作 ──
function openSearch() {
  supportingSearchQuery.value = "";
  supportingSearchResults.value = [];
  supportingSearchDone.value = false;
  executeSupportingSearch();
  nextTick(() => {
    supportingSearchInputRef.value?.focus();
  });
}

function debounceSupportingSearch() {
  if (supportingSearchTimer) clearTimeout(supportingSearchTimer);
  supportingSearchTimer = setTimeout(() => {
    executeSupportingSearch();
  }, 300);
}

async function executeSupportingSearch() {
  isSupportingSearching.value = true;
  supportingSearchDone.value = false;
  try {
    const q = encodeURIComponent(supportingSearchQuery.value.trim());
    const res = await fetch(
      `/api/drive/search-supporting/${encodeURIComponent(props.clientId)}?q=${q}`,
    );
    if (res.ok) {
      const data = (await res.json()) as { results: SupportingMetaItem[] };
      supportingSearchResults.value = data.results;
    }
  } catch (err) {
    console.warn("[根拠資料検索] エラー:", err);
  } finally {
    isSupportingSearching.value = false;
    supportingSearchDone.value = true;
  }
}

function previewSupportingImage(item: { previewUrl: string }) {
  supportingPreviewUrl.value = item.previewUrl || null;
  supportingRotation.value = 0;
  supportingZoom.value = 1;
}

function closeSupportingPreview() {
  supportingPreviewUrl.value = null;
}

// visible が true になったら検索を開始
import { watch } from "vue";
watch(() => props.visible, (newVal) => {
  if (newVal) openSearch();
});

// 外部から呼ばれる関数を公開
defineExpose({ openSearch });
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="supportingSearchModalRef"
      :style="{
        top: supportingSearchPos.top + 'px',
        left: supportingSearchPos.left + 'px',
        zIndex: supportingSearchZ,
      }"
      class="fixed bg-white rounded-lg shadow-2xl flex flex-col pointer-events-auto overflow-hidden cursor-move w-[400px] h-[500px] border-2 border-amber-300"
      style="resize: both; min-width: 300px; min-height: 300px"
      @mousedown="modalDrag(startSupportingSearchDrag, $event)"
      @click.stop
    >
      <!-- ヘッダー（ドラッグハンドル） -->
      <div
        class="bg-linear-to-r from-amber-100 to-orange-50 px-3 py-1.5 flex justify-between items-center cursor-move rounded-t-lg select-none border-b border-amber-200"
        @mousedown="startSupportingSearchDrag"
      >
        <span class="text-xs font-bold text-amber-900 flex items-center gap-2">
          <i class="fa-solid fa-paperclip text-amber-600"></i>
          根拠資料検索 <span class="font-normal text-amber-600">※移動できます</span>
        </span>
        <button @click="emit('close')" class="text-gray-500 hover:text-gray-700">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>
      <!-- 検索バー -->
      <div class="px-3 py-2 border-b border-gray-100 bg-gray-50">
        <div class="relative">
          <i
            class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
          ></i>
          <input
            ref="supportingSearchInputRef"
            v-model="supportingSearchQuery"
            type="text"
            :placeholder="UI_MSG.日付金額検索"
            class="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            @input="debounceSupportingSearch"
            @mousedown.stop
          />
        </div>
        <div class="flex items-center justify-between mt-1 text-[9px] text-gray-500">
          <span>スペース区切りAND検索</span>
          <span v-if="supportingSearchResults.length > 0"
            >{{ supportingSearchResults.length }}件</span
          >
        </div>
      </div>
      <!-- 検索結果 -->
      <div class="flex-1 overflow-y-auto p-2" @mousedown.stop>
        <div
          v-if="isSupportingSearching"
          class="flex items-center justify-center py-8 text-gray-400"
        >
          <i class="fa-solid fa-spinner fa-spin mr-2"></i>検索中...
        </div>
        <div
          v-else-if="supportingSearchResults.length === 0 && supportingSearchDone"
          class="text-center py-8 text-gray-400"
        >
          <i class="fa-solid fa-inbox text-2xl mb-2 block"></i>
          <span class="text-[11px]">{{
            supportingSearchQuery ? UI_MSG.検索結果_該当なし : UI_MSG.検索結果_未登録
          }}</span>
        </div>
        <div v-else class="grid grid-cols-2 gap-1.5">
          <div
            v-for="item in supportingSearchResults"
            :key="item.id"
            class="border border-gray-200 rounded p-2 hover:bg-amber-50 hover:border-amber-300 cursor-pointer transition-colors"
            @click="previewSupportingImage(item)"
          >
            <div
              class="w-full h-16 bg-gray-100 rounded mb-1.5 overflow-hidden flex items-center justify-center"
            >
              <img
                v-if="item.previewUrl"
                :src="item.previewUrl"
                :alt="item.fileName"
                class="max-w-full max-h-full object-contain"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
              <i v-else class="fa-solid fa-file-image text-xl text-gray-300"></i>
            </div>
            <div class="text-[9px] space-y-0.5">
              <div class="font-bold text-gray-800 truncate" :title="item.fileName">
                {{ item.fileName }}
              </div>
              <div v-if="item.date" class="text-gray-600">
                <i class="fa-solid fa-calendar text-[7px] mr-0.5 text-amber-500"></i
                >{{ item.date }}
              </div>
              <div v-if="item.amount != null" class="text-gray-600">
                <i class="fa-solid fa-yen-sign text-[7px] mr-0.5 text-green-500"></i
                >{{ Number(item.amount).toLocaleString() }}
              </div>
              <div v-if="item.vendor" class="text-gray-600 truncate">
                <i class="fa-solid fa-building text-[7px] mr-0.5 text-blue-500"></i
                >{{ item.vendor }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- リサイズグリップ -->
      <div
        class="absolute bottom-0 right-0 w-5 h-5 pointer-events-none"
        style="
          background: linear-gradient(
            135deg,
            transparent 50%,
            rgba(217, 119, 6, 0.5) 50%,
            rgba(217, 119, 6, 0.7) 100%
          );
          border-radius: 0 0 0.5rem 0;
        "
      ></div>
    </div>

    <!-- 根拠資料画像プレビュー（検索結果から選択時） -->
    <div
      v-if="supportingPreviewUrl"
      ref="supportingImageModalRef"
      :style="{
        top: supportingImagePos.top + 'px',
        left: supportingImagePos.left + 'px',
        zIndex: supportingImageZ,
      }"
      class="fixed bg-white rounded-lg shadow-2xl flex flex-col pointer-events-auto overflow-auto cursor-move w-[300px] h-[400px]"
      style="resize: both; min-width: 200px; min-height: 200px"
      @mousedown="modalDrag(startSupportingImageDrag, $event)"
    >
      <div
        class="bg-amber-100 px-3 py-1.5 flex justify-between items-center cursor-move rounded-t-lg select-none"
        @mousedown="startSupportingImageDrag"
      >
        <span class="text-xs font-bold text-gray-900"
          >根拠資料プレビュー <span class="font-normal text-amber-600">※移動できます</span></span
        >
        <button @click="closeSupportingPreview" class="text-gray-500 hover:text-gray-700">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>
      <div class="flex items-center gap-1 px-2 py-1 bg-gray-100 border-b border-gray-200">
        <button
          @click.stop="supportingRotation = (supportingRotation + 90) % 360"
          class="bg-amber-500 hover:bg-amber-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow transition-colors"
          :title="UI_MSG.ツールチップ_回転"
        >
          <i class="fa-solid fa-rotate-right text-xs"></i>
        </button>
        <button
          @click.stop="supportingZoom = Math.min(supportingZoom + 0.25, 7)"
          class="bg-green-500 hover:bg-green-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow transition-colors"
          :title="UI_MSG.ツールチップ_拡大"
        >
          <i class="fa-solid fa-magnifying-glass-plus text-xs"></i>
        </button>
        <button
          @click.stop="supportingZoom = Math.max(supportingZoom - 0.25, 0.25)"
          class="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow transition-colors"
          :title="UI_MSG.ツールチップ_縮小"
        >
          <i class="fa-solid fa-magnifying-glass-minus text-xs"></i>
        </button>
      </div>
      <div class="flex-1 flex items-center justify-center overflow-hidden rounded-b-lg">
        <img
          :src="supportingPreviewUrl"
          :alt="UI_MSG.画像ALT_根拠資料"
          :style="{
            transform: `rotate(${supportingRotation}deg) scale(${supportingZoom})`,
            imageOrientation: 'from-image',
          }"
          class="max-w-full max-h-full object-contain transition-transform duration-300"
        />
      </div>
      <div
        class="absolute bottom-0 right-0 w-5 h-5 pointer-events-none"
        style="
          background: linear-gradient(
            135deg,
            transparent 50%,
            rgba(217, 119, 6, 0.5) 50%,
            rgba(217, 119, 6, 0.7) 100%
          );
          border-radius: 0 0 0.5rem 0;
        "
      ></div>
    </div>
  </Teleport>
</template>
