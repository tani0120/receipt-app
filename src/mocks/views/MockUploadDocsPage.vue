<template>
  <div
    class="h-full overflow-y-auto flex flex-col"
    style="font-family: &quot;Noto Sans JP&quot;, sans-serif; position: relative; background: #fff"
  >
    <!-- ポータル共通ヘッダー -->
    <PortalHeader :clientName="clientName" />

    <!-- 件数バッジ（ファイル追加時のみ） -->
    <div
      v-if="files.length"
      style="position: absolute; top: 56px; right: 24px; z-index: 30; display: flex; gap: 6px"
    >
      <span
        v-if="counts.done"
        class="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full"
      >
        ✓ {{ counts.done }}
      </span>
      <span
        v-if="counts.failed"
        class="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full"
      >
        ✗ {{ counts.failed }}
      </span>
      <span
        v-if="counts.uploading"
        class="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full animate-pulse"
      >
        ⏳ {{ counts.uploading }}
      </span>
      <span class="text-[10px] text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">
        計 {{ files.length }} 件
      </span>
    </div>

    <!-- ===== メイン ===== -->
    <main class="flex-1 max-w-2xl mx-auto w-full px-3 py-4 pb-40" style="padding-top: 80px">
      <!-- 空の状態 -->
      <div
        v-if="files.length === 0"
        class="mt-10 flex flex-col items-center"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <div
          :class="[
            'w-full max-w-sm border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-200 cursor-pointer select-none',
            isDragging
              ? 'border-blue-400 bg-blue-50 scale-[1.02]'
              : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50',
          ]"
          @click="openPicker()"
        >
          <div class="text-6xl mb-4 leading-none">📂</div>
          <p class="text-[16px] font-bold text-gray-700">資料を選ぶ</p>
          <p class="text-[12px] text-gray-400 mt-2 leading-relaxed">
            タップして選択 / ドラッグ&ドロップ
          </p>
          <div
            class="mt-6 bg-blue-600 text-white text-[14px] font-bold py-3.5 px-8 rounded-2xl shadow-md hover:bg-blue-700 active:scale-95 transition-transform"
          >
            ファイルを選ぶ
          </div>
        </div>
        <p class="mt-5 text-[11px] text-gray-400 text-center leading-relaxed">
          謄本・CSV・Excel・PDF など何でも送れます<br />
          <span class="text-gray-300">ファイル形式の制限なし</span>
        </p>

        <!-- 説明カード -->
        <div class="mt-8 w-full max-w-sm space-y-3">
          <div
            v-for="item in howToItems"
            :key="item.step"
            class="flex items-start gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm"
          >
            <span class="text-xl mt-0.5 flex-shrink-0">{{ item.icon }}</span>
            <div>
              <p class="text-[12px] font-bold text-gray-700">{{ item.title }}</p>
              <p class="text-[11px] text-gray-400 mt-0.5">{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ファイルリスト -->
      <div v-else>
        <!-- 進捗バー -->
        <div class="mb-4 bg-white rounded-2xl px-4 py-3 shadow-sm">
          <div class="flex justify-between text-[11px] text-gray-500 mb-2">
            <span class="font-semibold">アップロードの進捗</span>
            <span>{{ counts.done + counts.failed }} / {{ files.length }} 件完了</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              class="h-2 rounded-full transition-all duration-700 ease-out"
              :class="counts.failed > 0 ? 'bg-amber-400' : 'bg-emerald-500'"
              :style="{ width: `${progressPct}%` }"
            ></div>
          </div>
          <div class="flex gap-3 mt-2 text-[10px]">
            <span class="text-emerald-600">✅ 完了: {{ counts.done }}</span>
            <span v-if="counts.failed" class="text-red-500">❌ 失敗: {{ counts.failed }}</span>
            <span v-if="counts.uploading" class="text-amber-500 animate-pulse"
              >⏳ 送信中: {{ counts.uploading }}</span
            >
            <span v-if="counts.queued" class="text-gray-400">待機: {{ counts.queued }}</span>
          </div>
        </div>

        <!-- ファイルリスト -->
        <div class="space-y-2">
          <div
            v-for="(f, idx) in files"
            :key="f.id"
            :class="[
              'bg-white rounded-2xl px-4 py-3 flex items-center gap-3 border-2 transition-all duration-300',
              f.status === 'failed'
                ? 'border-red-300'
                : f.status === 'done'
                  ? 'border-emerald-300'
                  : 'border-gray-200',
            ]"
          >
            <!-- ファイル種別アイコン -->
            <div
              class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              :class="fileIconBg(f.file.name)"
            >
              {{ fileIcon(f.file.name) }}
            </div>

            <!-- ファイル情報 -->
            <div class="flex-1 min-w-0">
              <p class="text-[12px] font-semibold text-gray-800 truncate">{{ f.file.name }}</p>
              <p class="text-[10px] text-gray-400 mt-0.5">{{ formatSize(f.file.size) }}</p>
              <!-- 重複警告 -->
              <p v-if="f.isDuplicate" class="text-[9px] text-amber-600 font-bold mt-0.5">
                ⚠ {{ MSG_DUPLICATE_SHORT }}
              </p>
            </div>

            <!-- ステータス -->
            <div class="flex-shrink-0 flex items-center">
              <!-- queued -->
              <span
                v-if="f.status === 'queued'"
                class="text-[9px] text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full"
              >
                待機中
              </span>
              <!-- uploading -->
              <div v-else-if="f.status === 'uploading'" class="flex items-center gap-1.5">
                <div
                  class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
                ></div>
                <span class="text-[9px] text-blue-500">送信中</span>
              </div>
              <!-- done -->
              <span v-else-if="f.status === 'done'" class="text-emerald-500 text-xl">✅</span>
              <!-- failed: リトライボタン -->
              <button
                v-else-if="f.status === 'failed'"
                class="text-[9px] text-red-500 border border-red-300 px-2 py-1 rounded-lg hover:bg-red-50 active:scale-95 transition-all"
                @click="retry(idx)"
              >
                ↩ 再送
              </button>
            </div>

            <!-- 削除ボタン（queued のみ） -->
            <button
              v-if="f.status === 'queued'"
              class="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
              @click="removeFile(idx)"
            >
              ×
            </button>
          </div>

          <!-- ファイル追加ボタン -->
          <button
            class="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-[12px] text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all active:scale-95"
            @click="openPicker()"
          >
            ＋ ファイルを追加
          </button>
        </div>
      </div>
    </main>

    <!-- ===== 底部固定エリア ===== -->
    <footer
      class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
    >
      <div class="max-w-2xl mx-auto">
        <transition name="fade">
          <p v-if="counts.failed" class="text-[11px] text-center font-semibold mb-2 text-red-500">
            ⚠ {{ counts.failed }}件の送信に失敗しました。再送してください
          </p>
          <p
            v-else-if="counts.uploading"
            class="text-[11px] text-center text-amber-600 mb-2 animate-pulse"
          >
            送信中... しばらくお待ちください
          </p>
          <p
            v-else-if="canConfirm && files.length"
            class="text-[11px] text-center text-emerald-600 font-semibold mb-2"
          >
            全件送信完了！確定してください ✅
          </p>
        </transition>

        <button
          :disabled="!canConfirm"
          :class="[
            'w-full py-4 rounded-2xl text-[15px] font-bold transition-all duration-300',
            canConfirm
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 active:scale-95 hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed',
          ]"
          @click="handleConfirm"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </footer>

    <!-- ===== 完了モーダル ===== -->
    <transition name="modal">
      <div
        v-if="showComplete"
        class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
        @click.self="showComplete = false"
      >
        <div class="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
          <div class="text-6xl mb-4">📨</div>
          <h2 class="text-[18px] font-bold text-gray-800 mb-2">送付完了！</h2>
          <p class="text-[13px] text-gray-500 mb-2">
            <span class="font-bold text-blue-600">{{ confirmedCount }}件</span>
            の送付が完了しました。
          </p>
          <p class="text-[11px] text-gray-400 mb-6">確認後、担当者よりご連絡します。</p>
          <button
            class="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform"
            @click="resetAll"
          >
            続けて送る
          </button>
        </div>
      </div>
    </transition>

    <!-- 隠し input: 何でも選択可 -->
    <input ref="fileInputRef" type="file" multiple class="hidden" @change="handleFileSelect" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import PortalHeader from "@/mocks/components/PortalHeader.vue";
import { useClients } from "@/features/client-management/composables/useClients";
import { MSG_DUPLICATE_SHORT } from "@/shared/validationMessages";

// ===== ルート =====
const route = useRoute();
const clientId = route.params.clientId as string;
const { clients } = useClients();
const clientName = computed(
  () => clients.value.find((c) => c.clientId === clientId)?.companyName ?? clientId,
);

// ===== 型 =====
type FileStatus = "queued" | "uploading" | "done" | "failed";

interface DocFile {
  id: string;
  file: File;
  status: FileStatus;
  isDuplicate: boolean;
  hash: string | null;
}

// ===== 状態 =====
const files = ref<DocFile[]>([]);
const fileInputRef = ref<HTMLInputElement>();
const isDragging = ref(false);
const showComplete = ref(false);
const confirmedCount = ref(0);

const CONCURRENCY = 3;

// ===== 説明カード =====
const howToItems = [
  { step: 1, icon: "📂", title: "ファイルを選ぶ", desc: "謄本・CSV・Excel・PDF など何でも対応" },
  {
    step: 2,
    icon: "📤",
    title: "自動アップロード",
    desc: "ファイル選択後に自動で送信が始まります",
  },
  {
    step: 3,
    icon: "✅",
    title: "全件完了で確定",
    desc: "全て送信できたら「確定」ボタンを押してください",
  },
];

// ===== 集計 =====
const counts = computed(() => ({
  done: files.value.filter((f) => f.status === "done").length,
  failed: files.value.filter((f) => f.status === "failed").length,
  uploading: files.value.filter((f) => f.status === "uploading").length,
  queued: files.value.filter((f) => f.status === "queued").length,
}));

const progressPct = computed(() =>
  files.value.length === 0
    ? 0
    : Math.round(((counts.value.done + counts.value.failed) / files.value.length) * 100),
);

const canConfirm = computed(
  () => files.value.length > 0 && counts.value.done === files.value.length,
);

const confirmLabel = computed(() => {
  if (!files.value.length) return "ファイルを選んでください";
  if (counts.value.uploading || counts.value.queued) return `送信中... (${progressPct.value}%)`;
  if (counts.value.failed) return `再送してください（${counts.value.failed}件）`;
  return `${counts.value.done}件を確定する`;
});

// ===== ファイル選択 =====
const openPicker = () => fileInputRef.value?.click();

const handleFileSelect = (e: Event) => {
  const selected = Array.from((e.target as HTMLInputElement).files ?? []);
  if (selected.length) addFiles(selected);
  (e.target as HTMLInputElement).value = "";
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  const dropped = Array.from(e.dataTransfer?.files ?? []);
  if (dropped.length) addFiles(dropped);
};

const addFiles = (newFiles: File[]) => {
  const items: DocFile[] = newFiles.map((file) => ({
    id: `d-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    status: "queued",
    isDuplicate: false,
    hash: null,
  }));
  files.value.push(...items);
  processQueue();
};

// ===== キュー処理 =====
const processQueue = () => {
  const available = CONCURRENCY - counts.value.uploading;
  if (available <= 0) return;
  files.value
    .filter((f) => f.status === "queued")
    .slice(0, available)
    .forEach((f) => uploadOne(f.id));
};

const uploadOne = async (id: string) => {
  const item = files.value.find((f) => f.id === id);
  if (!item) return;

  item.status = "uploading";
  // モック: 0.5〜2秒（ファイルサイズで変動を模擬）
  const delay = 500 + Math.random() * 1500;
  await new Promise((res) => setTimeout(res, delay));

  // モック: 95%成功
  item.status = Math.random() > 0.05 ? "done" : "failed";
  processQueue();
};

// ===== 再送 =====
const retry = (idx: number) => {
  const item = files.value[idx];
  if (!item || item.status !== "failed") return;
  item.status = "queued";
  processQueue();
};

// ===== ファイル削除（queued のみ） =====
const removeFile = (idx: number) => {
  const item = files.value[idx];
  if (!item || item.status !== "queued") return;
  files.value.splice(idx, 1);
};

// ===== 確定 =====
const isConfirming = ref(false);
const handleConfirm = async () => {
  if (!canConfirm.value || isConfirming.value) return;
  isConfirming.value = true;

  const doneFiles = files.value.filter((f) => f.status === "done");
  const docEntries: Array<Record<string, unknown>> = [];

  // 各ファイルをDriveにアップロードし、DocEntry情報を作成
  const client = clients.value.find((c) => c.clientId === clientId);
  const folderId = client?.sharedFolderId;
  for (const f of doneFiles) {
    let driveFileId: string | null = null;
    let fileHash: string | null = null;
    try {
      if (folderId) {
        const formData = new FormData();
        formData.append("file", f.file);
        formData.append("folderId", folderId);
        const res = await fetch("/api/drive/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = (await res.json()) as { fileId: string };
          driveFileId = data.fileId;
        }
      }
    } catch (err) {
      console.error(`[DocsPage] ファイルアップロード失敗 (${f.file.name}):`, err);
    }

    docEntries.push({
      id: f.id,
      clientId,
      source: "staff-upload",
      fileName: f.file.name,
      fileType: f.file.type || "application/octet-stream",
      fileSize: f.file.size,
      fileHash,
      driveFileId,
      thumbnailUrl: null,
      previewUrl: driveFileId ? `/api/drive/preview/${driveFileId}` : null,
      status: "pending",
      receivedAt: new Date().toISOString(),
      batchId: null,
      journalId: null,
      createdBy: null,
      updatedBy: null,
      updatedAt: null,
      statusChangedBy: null,
      statusChangedAt: null,
    });
  }

  // 2. documentStoreに保存
  try {
    const res = await fetch("/api/doc-store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documents: docEntries }),
    });
    if (!res.ok) {
      alert("データ保存に失敗しました。再度お試しください。");
      isConfirming.value = false;
      return;
    }
    const result = (await res.json()) as { added: number };
    console.log(`[DocsPage] ${result.added}件をサーバーに保存`);
  } catch (err) {
    console.error("[DocsPage] 保存エラー:", err);
    alert("データ保存に失敗しました。ネットワーク接続を確認してください。");
    isConfirming.value = false;
    return;
  }

  isConfirming.value = false;
  confirmedCount.value = counts.value.done;
  showComplete.value = true;
};

const resetAll = () => {
  files.value = [];
  showComplete.value = false;
};

// ===== ファイルアイコン =====
const fileIcon = (name: string): string => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp", "heic", "gif"].includes(ext)) return "🖼";
  if (ext === "pdf") return "📄";
  if (["xls", "xlsx"].includes(ext)) return "📊";
  if (["csv"].includes(ext)) return "📋";
  if (["doc", "docx"].includes(ext)) return "📝";
  return "📁";
};

const fileIconBg = (name: string): string => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp", "heic"].includes(ext)) return "bg-blue-50";
  if (ext === "pdf") return "bg-red-50";
  if (["xls", "xlsx", "csv"].includes(ext)) return "bg-green-50";
  return "bg-gray-50";
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ===== クリーンアップ =====
onBeforeUnmount(() => {
  // DocFileはObjectURLを使わないのでクリーンアップ不要
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: translateY(40px);
}
</style>
