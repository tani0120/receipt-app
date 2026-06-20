<script setup lang="ts">
/**
 * HintModal — ヒントモーダル（バリデーション結果 + 修正候補表示）
 *
 * 親から journal / journalIndex / clientId を受け取る。
 * fetchHintsFromAPI / hintValidations / hintSuggestions は子で管理。
 * applyHintSuggestion は emit('apply-suggestion', s) で親に委譲。
 */
import { ref, computed, watch } from "vue";
import { useDraggable } from "@/composables/useDraggable";
import { modalDrag } from "@/utils/modalDrag";
import { UI_MSG } from "@/constants/uiMessages";
import { SIDE_DEBIT, SIDE_CREDIT, LABEL_UNSET } from "@/constants/validationMessages";
import type { HintValidation, HintSuggestion } from "@/types/hintTypes";
import type { JournalPhase5Mock } from "@/types/JournalPhase5Mock";

const props = defineProps<{
  journal: JournalPhase5Mock | null;
  journalIndex: number;
  clientId: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "apply-suggestion", suggestion: HintSuggestion): void;
}>();

// ── ドラッグ移動 ──
const hintModalRef = ref<HTMLElement | null>(null);
const {
  position: hintModalPos,
  zIndex: hintModalZ,
  startDrag: startHintDrag,
} = useDraggable(hintModalRef);

// ── ヒントデータ ──
const hintValidations = ref<HintValidation[]>([]);
const hintSuggestions = ref<HintSuggestion[]>([]);
const hintLoading = ref(false);

/** ヒントAPIを呼び出してvalidations/suggestionsを更新 */
async function fetchHintsFromAPI(journalId: string): Promise<void> {
  hintLoading.value = true;
  try {
    const res = await fetch(
      `/api/journals/${encodeURIComponent(props.clientId)}/${encodeURIComponent(journalId)}/hints`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
    );
    if (res.ok) {
      const data = await res.json();
      hintValidations.value = data.validations;
      hintSuggestions.value = data.suggestions;
    } else {
      console.warn("[Hint API] レスポンスエラー:", res.status);
    }
  } catch (err) {
    console.error("[Hint API] 通信エラー:", err);
  } finally {
    hintLoading.value = false;
  }
}

// ★ ドロップダウン変更時のハンドラ
function onHintAlternativeChange(suggestionIndex: number, newValue: string): void {
  const s = hintSuggestions.value[suggestionIndex];
  if (!s) return;
  const alt = s.alternatives.find((a) => a.value === newValue);
  if (alt) {
    s.selectedValue = newValue;
    s.selectedLabel = alt.label;
  }
}

function handleApply(s: HintSuggestion): void {
  emit("apply-suggestion", s);
  // 適用後にヒント再取得
  if (props.journal) {
    fetchHintsFromAPI(props.journal.journalId);
  }
}

function handleApplyAll(): void {
  hintSuggestions.value.forEach((s) => emit("apply-suggestion", s));
  emit("close");
}

// journal が変わったらヒントを取得
watch(
  () => props.journal,
  (newJournal) => {
    if (newJournal) {
      // 画面中央に配置（モーダル幅520px, 想定高さ500px）
      hintModalPos.value = {
        top: Math.max(50, (window.innerHeight - 500) / 2),
        left: Math.max(50, (window.innerWidth - 520) / 2),
      };
      fetchHintsFromAPI(newJournal.journalId);
    }
  },
);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="journal"
      ref="hintModalRef"
      :style="{
        top: hintModalPos.top + 'px',
        left: hintModalPos.left + 'px',
        zIndex: hintModalZ,
      }"
      class="fixed bg-white rounded-xl shadow-2xl w-[520px] max-h-[80vh] overflow-y-auto border border-gray-200 cursor-move"
      style="resize: both; min-width: 360px; min-height: 200px"
      @click.stop
      @mousedown="modalDrag(startHintDrag, $event)"
    >
      <!-- ヘッダー（ドラッグハンドル） -->
      <div
        class="bg-linear-to-r from-amber-50 to-amber-100 px-5 py-3 border-b flex items-center justify-between rounded-t-xl cursor-move select-none"
        @mousedown="startHintDrag"
      >
        <div class="flex items-center gap-2">
          <span class="text-lg">💡</span>
          <h3 class="text-sm font-bold text-gray-800">ヒント</h3>
          <span class="text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded-full border"
            >No.{{ journalIndex + 1 }}</span
          >
          <span class="text-[10px] text-amber-600">※移動できます</span>
        </div>
        <button
          @click="emit('close')"
          class="text-gray-400 hover:text-gray-700 text-lg"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- 仕訳概要 -->
      <div class="px-5 py-3 bg-gray-50 border-b text-xs">
        <div class="flex gap-4">
          <span><b>{{ UI_MSG.ラベル_日付 }}</b> {{ journal.voucher_date || LABEL_UNSET }}</span>
          <span><b>{{ UI_MSG.ラベル_摘要 }}</b> {{ journal.description || LABEL_UNSET }}</span>
          <span><b>{{ UI_MSG.ラベル_証票意味 }}</b> {{ journal.voucher_type || LABEL_UNSET }}</span>
        </div>
      </div>

      <!-- ローディング表示（API待ち） -->
      <div
        v-if="hintLoading"
        class="px-5 py-8 flex items-center justify-center gap-2 text-xs text-gray-500"
      >
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>ヒントを取得中...</span>
      </div>

      <!-- ① バリデーション結果 -->
      <div v-else class="px-5 py-3 border-b">
        <h4 class="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
          📋 バリデーション結果
        </h4>
        <div
          v-if="hintValidations.length === 0"
          class="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2"
        >
          <span class="text-base">✅</span>
          <span>この仕訳に問題は検出されませんでした</span>
        </div>
        <div v-else class="space-y-1.5">
          <div
            v-for="(v, vi) in hintValidations"
            :key="vi"
            :class="[
              'flex items-start gap-2 text-xs rounded-lg px-3 py-2',
              v.level === 'error' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800',
            ]"
          >
            <span class="text-base shrink-0">{{ v.level === "error" ? "❌" : "⚠️" }}</span>
            <span>{{ v.message }}</span>
          </div>
        </div>
      </div>

      <!-- ② 修正候補（ルールベース） -->
      <div class="px-5 py-3 border-b">
        <h4 class="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">💡 修正候補</h4>
        <div
          v-if="hintSuggestions.length === 0"
          class="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2"
        >
          修正候補はありません
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="(s, si) in hintSuggestions"
            :key="si"
            class="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                <span class="text-blue-600 font-bold shrink-0">{{
                  s.side === "debit" ? SIDE_DEBIT : SIDE_CREDIT
                }}</span>
                <span class="text-gray-500 shrink-0">{{ s.field }}:</span>
                <span class="text-red-500 line-through shrink-0">{{ s.currentLabel }}</span>
                <span class="text-gray-400 shrink-0">→</span>
                <!-- 択一候補: ドロップダウン -->
                <select
                  v-if="s.alternatives.length > 1"
                  :value="s.selectedValue"
                  @change="
                    onHintAlternativeChange(si, ($event.target as HTMLSelectElement).value)
                  "
                  class="border border-blue-300 rounded px-1.5 py-0.5 text-xs bg-white text-green-700 font-bold max-w-[200px] cursor-pointer"
                  @click.stop
                  @mousedown.stop
                >
                  <option v-for="alt in s.alternatives" :key="alt.value" :value="alt.value">
                    {{ alt.label }}
                  </option>
                </select>
                <!-- 単一候補: テキスト表示 -->
                <span v-else class="text-green-700 font-bold">{{ s.selectedLabel }}</span>
              </div>
              <button
                @click="handleApply(s)"
                class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-[10px] font-bold transition-colors shrink-0 ml-2"
              >
                適用
              </button>
            </div>
          </div>
          <!-- 全て適用ボタン -->
          <button
            v-if="hintSuggestions.length > 1"
            @click="handleApplyAll"
            class="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-xs font-bold transition-colors mt-1"
          >
            ✨ 全て適用（各行の選択値を適用）
          </button>
        </div>
      </div>

      <!-- ③ AI推論（工事中） -->
      <div class="px-5 py-3 border-b">
        <h4 class="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">🤖 AI推論</h4>
        <div
          class="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-3 text-center flex items-center justify-center gap-2"
        >
          <span class="text-base">🚧</span>
          <span>工事中 — Gemini連携による高精度推論を準備中です</span>
        </div>
      </div>

      <!-- ④ 過去の類似仕訳（工事中） -->
      <div class="px-5 py-3">
        <h4 class="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
          📚 過去の類似仕訳
        </h4>
        <div
          class="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-3 text-center flex items-center justify-center gap-2"
        >
          <span class="text-base">🚧</span>
          <span>工事中 — DB接続後に有効化予定</span>
        </div>
      </div>

      <!-- フッター -->
      <div class="px-5 py-3 bg-gray-50 border-t rounded-b-xl flex justify-end">
        <button
          @click="emit('close')"
          class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1.5 rounded text-xs font-bold transition-colors"
        >
          閉じる
        </button>
      </div>

      <!-- リサイズグリップ -->
      <div
        class="absolute bottom-0 right-0 w-5 h-5 pointer-events-none"
        style="
          background: linear-gradient(
            135deg,
            transparent 50%,
            rgba(217, 119, 6, 0.4) 50%,
            rgba(217, 119, 6, 0.6) 100%
          );
          border-radius: 0 0 0.75rem 0;
        "
      ></div>
    </div>
  </Teleport>
</template>
