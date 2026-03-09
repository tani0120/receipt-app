<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans text-gray-700" style="font-family: 'Noto Sans JP', sans-serif">
    <!-- ヘッダー -->
    <div class="bg-white px-4 py-2 border-b border-gray-300 flex items-center gap-4">
      <span class="text-[14px] font-bold text-gray-800">Drive資料選別</span>
      <div class="flex items-center gap-3 text-[12px]">
        <span class="bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-semibold">未処理: {{ counts.pending }}件</span>
        <span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold">仕訳対象: {{ counts.target }}件</span>
        <span class="bg-red-100 text-red-600 px-2 py-0.5 rounded font-semibold">対象外: {{ counts.excluded }}件</span>
      </div>
      <div class="ml-auto text-[11px] text-gray-400">
        キーボード: <kbd class="bg-gray-100 border border-gray-300 rounded px-1 text-[10px]">A</kbd> 仕訳対象
        <kbd class="bg-gray-100 border border-gray-300 rounded px-1 text-[10px] ml-1">D</kbd> 対象外
        <kbd class="bg-gray-100 border border-gray-300 rounded px-1 text-[10px] ml-1">S</kbd> 戻す
        <kbd class="bg-gray-100 border border-gray-300 rounded px-1 text-[10px] ml-1">↑↓</kbd> 移動
      </div>
    </div>

    <!-- メインエリア -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 左: サムネ一覧 -->
      <div class="w-[260px] border-r border-gray-300 bg-white overflow-y-auto">
        <div
          v-for="(doc, idx) in documents" :key="doc.id"
          class="flex items-center gap-2 px-2 py-2 cursor-pointer border-b border-gray-100 transition-colors"
          :class="selectedIdx === idx ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50 border-l-4 border-l-transparent'"
          @click="selectDoc(idx)"
        >
          <!-- サムネ（実画像） -->
          <img
            :src="doc.imagePath"
            :alt="doc.fileName"
            class="w-[50px] h-[50px] rounded object-cover flex-shrink-0 bg-gray-200"
          />
          <!-- ファイル情報 -->
          <div class="flex-1 min-w-0">
            <div class="text-[11px] font-medium truncate">{{ doc.fileName }}</div>
            <div class="text-[10px] text-gray-400">{{ doc.fileSize }} · {{ doc.uploadDate }}</div>
          </div>
          <!-- ステータスバッジ -->
          <span
            class="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
            :class="statusClass(doc.status)"
          >{{ statusLabel(doc.status) }}</span>
        </div>
      </div>

      <!-- 右: プレビュー -->
      <div class="flex-1 flex flex-col items-center justify-center bg-gray-100 p-6">
        <template v-if="selected">
          <!-- スケルトンローディング -->
          <template v-if="isLoading">
            <div class="w-[480px] h-[360px] rounded-lg bg-gray-200 animate-pulse flex items-center justify-center">
              <div class="text-center">
                <svg class="w-12 h-12 text-gray-400 mx-auto animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <div class="text-[12px] text-gray-400 mt-3">読み込み中...</div>
              </div>
            </div>
            <!-- スケルトン情報 -->
            <div class="mt-4 space-y-2 w-[300px]">
              <div class="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
              <div class="h-3 bg-gray-200 rounded animate-pulse w-1/2 mx-auto"></div>
            </div>
          </template>

          <!-- プレビュー本体 -->
          <template v-else>
            <!-- プレビュー画像（実画像） -->
            <div class="max-w-[560px] max-h-[400px] rounded-lg shadow-lg overflow-hidden bg-white border border-gray-200">
              <img
                :src="selected.imagePath"
                :alt="selected.fileName"
                class="w-full h-full object-contain"
              />
            </div>

            <!-- ファイル情報 -->
            <div class="mt-4 text-center text-[12px] text-gray-600">
              <div class="font-bold text-[14px] text-gray-800">{{ selected.fileName }}</div>
              <div class="mt-1">{{ selected.fileSize }} · {{ selected.fileType }} · 投入日: {{ selected.uploadDate }}</div>
              <div class="mt-1 text-[11px]">
                {{ selectedIdx + 1 }} / {{ documents.length }}件
              </div>
            </div>

            <!-- アクションボタン -->
            <div class="mt-6 flex gap-4">
              <button
                class="px-10 py-3 rounded-lg text-[16px] font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
                :class="selected.status === 'target' ? 'bg-blue-700 text-white ring-4 ring-blue-300' : 'bg-blue-600 text-white hover:bg-blue-700'"
                @click="setStatus('target')"
              >
                ✓ 仕訳対象
              </button>
              <button
                class="px-10 py-3 rounded-lg text-[16px] font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
                :class="selected.status === 'excluded' ? 'bg-red-700 text-white ring-4 ring-red-300' : 'bg-red-500 text-white hover:bg-red-600'"
                @click="setStatus('excluded')"
              >
                ✗ 対象外
              </button>
              <!-- 未処理に戻すボタン -->
              <button
                v-if="selected.status !== 'pending'"
                class="px-6 py-3 rounded-lg text-[14px] font-bold transition-all shadow-md hover:shadow-lg active:scale-95 bg-gray-500 text-white hover:bg-gray-600"
                @click="resetStatus"
              >
                ↩ 戻す
              </button>
            </div>

            <!-- 現在のステータス表示 -->
            <div v-if="selected.status !== 'pending'" class="mt-3 text-[12px] font-semibold" :class="selected.status === 'target' ? 'text-blue-600' : 'text-red-500'">
              現在: {{ statusLabel(selected.status) }}
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

// --- モックデータ（8件、実画像使用） ---
interface DriveDoc {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  uploadDate: string;
  imagePath: string;
  expectedStatus: 'target' | 'excluded';
  status: 'pending' | 'target' | 'excluded';
}

const documents = ref<DriveDoc[]>([
  { id: 'd01', fileName: 'IMG_20250305_143200.jpg',       fileType: 'JPEG', fileSize: '460KB', uploadDate: '25/03/05', imagePath: '/mock-receipts/medical_receipt.png',       expectedStatus: 'target',   status: 'pending' },
  { id: 'd02', fileName: 'scan_003.pdf',                 fileType: 'PDF',  fileSize: '600KB', uploadDate: '25/03/05', imagePath: '/mock-receipts/delivery_note.png',         expectedStatus: 'target',   status: 'pending' },
  { id: 'd03', fileName: '写真 2025-03-04 12.45.30.jpg', fileType: 'JPEG', fileSize: '590KB', uploadDate: '25/03/04', imagePath: '/mock-receipts/convenience_receipt.png',    expectedStatus: 'target',   status: 'pending' },
  { id: 'd04', fileName: 'IMG_4872.jpg',                 fileType: 'JPEG', fileSize: '720KB', uploadDate: '25/03/04', imagePath: '/mock-receipts/izakaya_receipt.png',        expectedStatus: 'target',   status: 'pending' },
  { id: 'd05', fileName: 'document(1).pdf',              fileType: 'PDF',  fileSize: '660KB', uploadDate: '25/03/03', imagePath: '/mock-receipts/bank_passbook.png',          expectedStatus: 'excluded', status: 'pending' },
  { id: 'd06', fileName: 'CamScanner_20250303.pdf',      fileType: 'PDF',  fileSize: '550KB', uploadDate: '25/03/03', imagePath: '/mock-receipts/invoice.png',                expectedStatus: 'target',   status: 'pending' },
  { id: 'd07', fileName: 'IMG_20250302_091500.jpg',      fileType: 'JPEG', fileSize: '630KB', uploadDate: '25/03/02', imagePath: '/mock-receipts/credit_card_statement.png',  expectedStatus: 'excluded', status: 'pending' },
  { id: 'd08', fileName: 'photo_2025_03_02.jpg',         fileType: 'JPEG', fileSize: '680KB', uploadDate: '25/03/02', imagePath: '/mock-receipts/business_card.png',           expectedStatus: 'excluded', status: 'pending' },
]);

const selectedIdx = ref(0);
const selected = computed(() => documents.value[selectedIdx.value] ?? null);

// --- 読み込みシミュレーション ---
const isLoading = ref(false);
const simulateLoad = () => {
  isLoading.value = true;
  const delay = 800 + Math.random() * 1200; // 800〜2000ms（本番想定: 署名付きURL取得+画像DL）
  setTimeout(() => { isLoading.value = false; }, delay);
};

// 選択変更時にローディングをシミュレート
watch(selectedIdx, () => { simulateLoad(); });

// 初回ロード
onMounted(() => { simulateLoad(); });

// --- 選択変更 ---
const selectDoc = (idx: number) => {
  selectedIdx.value = idx;
};

// --- 件数集計 ---
const counts = computed(() => {
  const docs = documents.value;
  return {
    pending:  docs.filter(d => d.status === 'pending').length,
    target:   docs.filter(d => d.status === 'target').length,
    excluded: docs.filter(d => d.status === 'excluded').length,
  };
});

// --- ステータス設定 + 自動次送り ---
const setStatus = (status: 'target' | 'excluded') => {
  if (!selected.value) return;
  selected.value.status = status;
  const nextPending = documents.value.findIndex((d, i) => i > selectedIdx.value && d.status === 'pending');
  if (nextPending !== -1) {
    selectedIdx.value = nextPending;
  } else {
    const prevPending = documents.value.findIndex(d => d.status === 'pending');
    if (prevPending !== -1) {
      selectedIdx.value = prevPending;
    }
  }
};

// --- 未処理に戻す ---
const resetStatus = () => {
  if (!selected.value) return;
  selected.value.status = 'pending';
};

// --- ステータス表示 ---
const statusLabel = (s: string) => {
  if (s === 'target') return '仕訳対象';
  if (s === 'excluded') return '対象外';
  return '未処理';
};
const statusClass = (s: string) => {
  if (s === 'target') return 'bg-blue-100 text-blue-700';
  if (s === 'excluded') return 'bg-red-100 text-red-600';
  return 'bg-gray-200 text-gray-500';
};

// --- キーボードショートカット ---
const handleKey = (e: KeyboardEvent) => {
  if (e.key === 'a' || e.key === 'A') { setStatus('target'); e.preventDefault(); }
  if (e.key === 'd' || e.key === 'D') { setStatus('excluded'); e.preventDefault(); }
  if (e.key === 's' || e.key === 'S') { resetStatus(); e.preventDefault(); }
  if (e.key === 'ArrowUp')   { selectedIdx.value = Math.max(0, selectedIdx.value - 1); e.preventDefault(); }
  if (e.key === 'ArrowDown') { selectedIdx.value = Math.min(documents.value.length - 1, selectedIdx.value + 1); e.preventDefault(); }
};
onMounted(() => window.addEventListener('keydown', handleKey));
onUnmounted(() => window.removeEventListener('keydown', handleKey));
</script>
