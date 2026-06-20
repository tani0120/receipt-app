<script setup lang="ts">
/**
 * CommentModal — コメント（staff_notes）編集モーダル
 *
 * 親から journal / author / staffList を受け取る。
 * journal は reactive 参照共有。staff_notes への v-model バインドは
 * journal オブジェクト参照を通じて親と共有する。
 * toggleStaffNoteInModal / closeCommentModal は emit で親に委譲。
 */
import { ref } from "vue";
import { useDraggable } from "@/composables/useDraggable";
import { modalDrag } from "@/utils/modalDrag";
import { UI_MSG } from "@/constants/uiMessages";
import type { StaffNoteKey } from "@/types/staff_notes";
import type { JournalPhase5Mock } from "@/types/journal_phase5_mock.type";

const props = defineProps<{
  journal: JournalPhase5Mock | null;
  author: string;
  staffList: string[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "toggle-note", key: StaffNoteKey): void;
  (e: "update-author", author: string): void;
  (e: "mouseenter"): void;
  (e: "mouseleave"): void;
}>();

// ── ドラッグ移動 ──
const commentModalRef = ref<HTMLElement | null>(null);
const {
  position: commentModalPos,
  zIndex: commentModalZ,
  startDrag: startCommentDrag,
} = useDraggable(commentModalRef);

// ── staffNoteConfig ──
const staffNoteConfig: Record<
  StaffNoteKey,
  { label: string; icon: string; activeColor: string; hoverIconColor: string }
> = {
  NEED_DOCUMENT: {
    label: UI_MSG.付箋_書類不足,
    icon: "fa-file-circle-exclamation",
    activeColor: "text-red-600",
    hoverIconColor: "#dc2626",
  },
  NEED_INFO: {
    label: UI_MSG.付箋_情報不足,
    icon: "fa-circle-question",
    activeColor: "text-amber-600",
    hoverIconColor: "#d97706",
  },
  REMINDER: {
    label: UI_MSG.付箋_備忘メモ,
    icon: "fa-thumbtack",
    activeColor: "text-blue-600",
    hoverIconColor: "#2563eb",
  },
  NEED_CONSULT: {
    label: UI_MSG.付箋_社内相談,
    icon: "fa-comments",
    activeColor: "text-purple-600",
    hoverIconColor: "#9333ea",
  },
};

function getStaffNoteEnabled(journal: JournalPhase5Mock, key: StaffNoteKey): boolean {
  return journal.staff_notes?.[key]?.enabled ?? false;
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="journal"
      ref="commentModalRef"
      class="fixed z-90"
      :style="{
        left: commentModalPos.left + 'px',
        top: commentModalPos.top + 'px',
        zIndex: commentModalZ,
      }"
      @mouseenter="emit('mouseenter')"
      @mouseleave="emit('mouseleave')"
    >
      <div
        class="bg-white rounded-lg shadow-2xl border-2 border-blue-300 w-[480px] overflow-auto flex flex-col cursor-move"
        style="resize: both; min-width: 200px; min-height: 150px"
        @click.stop
        @mousedown="modalDrag(startCommentDrag, $event)"
      >
        <!-- ドラッグ可能ヘッダー -->
        <div
          @mousedown="startCommentDrag"
          class="bg-blue-100 px-3 py-2 rounded-t-lg cursor-move flex items-center justify-between select-none"
        >
          <span class="text-xs font-bold text-blue-800">
            <i class="fa-solid fa-comment-dots mr-1"></i>
            コメントを記入 ※移動できます
          </span>
          <button @click="emit('close')" class="text-gray-500 hover:text-red-500 text-sm">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- モーダル本体 -->
        <div class="p-3 max-h-[500px] overflow-y-auto text-xs">
          <!-- ヒントテキスト -->
          <div
            class="text-xs text-gray-500 mb-3 bg-gray-50 rounded px-2 py-1 border border-gray-200"
          >
            <i class="fa-solid fa-circle-info text-blue-400 mr-1"></i>
            ✓を入れるとテキスト入力欄が表示されます
          </div>
          <!-- ◆顧問先に確認 -->
          <div class="font-bold text-gray-800 mb-2 text-[11px]">◆ 顧問先に確認</div>
          <template v-for="noteKey in ['NEED_DOCUMENT', 'NEED_INFO'] as const" :key="noteKey">
            <div class="mb-3 ml-2">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="getStaffNoteEnabled(journal!, noteKey)"
                  @change="emit('toggle-note', noteKey)"
                  class="rounded border-gray-300"
                />
                <i
                  :class="[
                    'fa-solid',
                    staffNoteConfig[noteKey].icon,
                    staffNoteConfig[noteKey].activeColor,
                    'text-[11px]',
                  ]"
                ></i>
                <span class="text-gray-800">{{ staffNoteConfig[noteKey].label }}</span>
              </label>
              <div
                v-if="getStaffNoteEnabled(journal!, noteKey)"
                class="ml-5 mt-1 space-y-1"
              >
                <textarea
                  v-model="journal!.staff_notes![noteKey]!.text"
                  class="w-full border border-gray-300 rounded p-1.5 text-[10px] resize-none"
                  rows="2"
                  :placeholder="UI_MSG.テキスト入力"
                ></textarea>
                <input
                  v-model="journal!.staff_notes![noteKey]!.chatworkUrl"
                  type="text"
                  class="w-full border border-gray-300 rounded p-1 text-[10px]"
                  :placeholder="UI_MSG.ChatworkURL"
                />
              </div>
            </div>
          </template>

          <!-- ◆社内で確認 -->
          <div class="font-bold text-gray-800 mb-2 mt-3 text-[11px]">◆ 社内で確認</div>
          <template v-for="noteKey in ['REMINDER', 'NEED_CONSULT'] as const" :key="noteKey">
            <div class="mb-3 ml-2">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="getStaffNoteEnabled(journal!, noteKey)"
                  @change="emit('toggle-note', noteKey)"
                  class="rounded border-gray-300"
                />
                <i
                  :class="[
                    'fa-solid',
                    staffNoteConfig[noteKey].icon,
                    staffNoteConfig[noteKey].activeColor,
                    'text-[11px]',
                  ]"
                ></i>
                <span class="text-gray-800">{{ staffNoteConfig[noteKey].label }}</span>
              </label>
              <div
                v-if="getStaffNoteEnabled(journal!, noteKey)"
                class="ml-5 mt-1 space-y-1"
              >
                <textarea
                  v-model="journal!.staff_notes![noteKey]!.text"
                  class="w-full border border-gray-300 rounded p-1.5 text-[10px] resize-none"
                  rows="2"
                  :placeholder="UI_MSG.テキスト入力"
                ></textarea>
                <input
                  v-model="journal!.staff_notes![noteKey]!.chatworkUrl"
                  type="text"
                  class="w-full border border-gray-300 rounded p-1 text-[10px]"
                  :placeholder="UI_MSG.ChatworkURL"
                />
              </div>
            </div>
          </template>

          <!-- 担当名 -->
          <div class="border-t border-gray-200 pt-2 mt-2">
            <label class="text-[10px] text-gray-600 font-bold">担当名</label>
            <select
              :value="author"
              @change="emit('update-author', ($event.target as HTMLSelectElement).value)"
              class="ml-2 border border-gray-300 rounded p-1 text-[10px]"
            >
              <option v-for="staff in staffList" :key="staff" :value="staff">{{ staff }}</option>
            </select>
          </div>
        </div>
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
