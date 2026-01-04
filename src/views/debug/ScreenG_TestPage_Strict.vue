<template>
  <!-- [UI_Structure] Line:2 -->
  <div class="h-full flex flex-col bg-slate-50 relative overflow-hidden">
    <!-- [UI_Structure] Line:4 -->
    <div class="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-green-100/50 to-transparent rounded-bl-full pointer-events-none z-0"></div>

    <!-- [UI_Structure] Line:7 -->
    <header class="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0 relative z-10">
      <div class="flex items-center gap-4">
        <div class="bg-green-100 p-2 rounded-lg">
          <i class="fa-solid fa-arrow-right-arrow-left text-green-600 text-xl"></i>
        </div>
        <div>
           <h1 class="text-xl font-bold text-slate-800">会計ソフトデータ変換</h1>
           <p class="text-xs text-gray-400">CSVデータを他社ソフト形式に変換します</p>
        </div>
      </div>
    </header>

    <!-- [UI_Structure] Line:20 -->
    <main class="flex-1 p-8 overflow-y-auto relative z-10">
      <div class="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Input Section -->
        <div class="flex flex-col gap-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
             <h2 class="text-sm font-bold text-gray-700 mb-6 flex items-center gap-2">
                 <span class="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                 変換設定
             </h2>

             <div class="space-y-4">
                 <div>
                     <label class="block text-xs font-bold text-gray-500 mb-1">顧問先名 <span class="text-red-500">*</span></label>
                     <input v-model="form.clientName" type="text" class="w-full border border-gray-300 rounded p-2 text-sm">
                 </div>

                 <div>
                     <label class="block text-xs font-bold text-gray-500 mb-1">移行前の会計ソフト名 <span class="text-xs font-normal text-gray-400">(自動検出)</span></label>
                     <div class="relative">
                         <input v-model="form.sourceSoftware" type="text" class="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50" readonly>
                         <i v-if="form.sourceSoftware" class="fa-solid fa-check text-green-500 absolute right-3 top-3 text-xs animate-bounce-in"></i>
                     </div>
                 </div>

                 <!-- Target Software Selection -->
                 <div>
                     <label class="block text-xs font-bold text-gray-500 mb-2">移行したい会計ソフト名 <span class="text-red-500">*</span></label>
                     <div class="grid grid-cols-3 gap-3">
                         <label class="cursor-pointer group">
                             <input type="radio" v-model="form.targetSoftware" value="Yayoi" class="peer sr-only">
                             <div class="border-2 border-gray-100 peer-checked:border-yellow-400 peer-checked:bg-yellow-50 rounded-lg p-3 text-center transition group-hover:border-gray-200">
                                 <div class="text-xs font-bold text-slate-700">弥生会計</div>
                             </div>
                         </label>
                         <label class="cursor-pointer group">
                            <input type="radio" v-model="form.targetSoftware" value="MF" class="peer sr-only">
                            <div class="border-2 border-gray-100 peer-checked:border-orange-400 peer-checked:bg-orange-50 rounded-lg p-3 text-center transition group-hover:border-gray-200">
                                <div class="text-xs font-bold text-slate-700">マネーフォワード</div>
                            </div>
                        </label>
                         <label class="cursor-pointer group">
                            <input type="radio" v-model="form.targetSoftware" value="Freee" class="peer sr-only">
                            <div class="border-2 border-gray-100 peer-checked:border-blue-400 peer-checked:bg-blue-50 rounded-lg p-3 text-center transition group-hover:border-gray-200">
                                <div class="text-xs font-bold text-slate-700">freee</div>
                            </div>
                        </label>
                     </div>
                 </div>
             </div>
          </div>

          <!-- Upload Section -->
           <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden"
                @drop.prevent="handleDrop" @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false">

                <h2 class="text-sm font-bold text-gray-700 mb-6 flex items-center gap-2">
                    <span class="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                    ファイルアップロード
                </h2>

                <div v-if="!uploadedFile" class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center" :class="{'bg-green-50 border-green-400': isDragging}">
                    <input ref="fileInput" type="file" class="hidden" @change="handleFileSelect" accept=".csv">
                    <div class="pointer-events-none">
                        <div class="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition duration-300">
                            <i class="fa-solid fa-cloud-arrow-up text-2xl text-gray-400 group-hover:text-green-500 transition"></i>
                        </div>
                        <h3 class="font-bold text-gray-700 mb-1">ファイルをここにドラッグ＆ドロップ</h3>
                        <p class="text-xs text-gray-400 mb-4">または</p>
                        <button @click="(($refs.fileInput as HTMLInputElement).click())" class="pointer-events-auto bg-slate-800 text-white px-6 py-2 rounded-full text-xs font-bold hover:bg-slate-700 transition shadow hover:shadow-lg">ファイルを選択</button>
                        <p class="text-[10px] text-gray-400 mt-4">対応形式: CSV (弥生, freee, MFなど)</p>
                    </div>
                </div>

                <div v-else class="animate-fade-in">
                    <div class="bg-blue-50 text-blue-700 p-4 rounded-lg flex items-center justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <i class="fa-solid fa-file-csv text-2xl"></i>
                            <div class="text-left">
                                <div class="font-bold text-sm">{{ uploadedFile.name }}</div>
                                <div class="text-[10px] opacity-70">{{ formatFileSize(uploadedFile.size) }}</div>
                            </div>
                        </div>
                        <button @click="uploadedFile = null" class="text-blue-400 hover:text-blue-600"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <button @click="startConversion" :disabled="!canConvert" class="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> 変換実行
                    </button>
                </div>

                <!-- Processing Overlay -->
                <div v-if="isProcessing" class="absolute inset-0 bg-white/90 flex flex-col items-center justify-center p-6 z-10">
                    <div class="relative w-20 h-20 mb-4">
                        <div class="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                        <div class="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
                        <i class="fa-solid fa-sync absolute inset-0 m-auto w-fit h-fit text-green-500 animate-pulse"></i>
                    </div>
                    <h3 class="font-bold text-gray-800 text-lg mb-1">変換処理中...</h3>
                    <p class="text-xs text-gray-500">{{ loadingStatus }}</p>
                </div>
           </div>
        </div>

        <!-- History Section -->
        <div class="flex flex-col h-full">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full relative overflow-hidden">
                <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 class="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <i class="fa-solid fa-clock-rotate-left text-gray-400"></i> 変換履歴
                    </h2>
                    <span class="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded border border-red-200 animate-pulse">Auto-Saved</span>
                </div>

                <div class="flex-1 overflow-y-auto p-4 space-y-3">
                    <div v-if="logs.length === 0" class="h-full flex flex-col items-center justify-center text-gray-300">
                        <i class="fa-solid fa-box-open text-4xl mb-2"></i>
                        <p class="text-xs">履歴はありません</p>
                    </div>

                    <div v-for="log in logs" :key="log.id" class="border border-gray-100 rounded-lg p-3 hover:border-blue-200 transition group animate-slide-in-right bg-white">
                        <div class="flex justify-between items-start mb-2 pl-2">
                            <div class="flex items-center gap-2 mb-1">
                                <span v-if="!log.isDownloaded" class="bg-[#FDE047] text-[#854D0E] text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">NEW</span>
                                <span class="bg-gray-100 text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded">ID: {{ log.id.slice(-4) }}</span>
                            </div>
                            <span class="text-[10px] text-gray-400">{{ log.timestamp }}</span>
                        </div>

                        <div class="font-bold text-sm text-slate-800 mb-2 pl-2">{{ log.clientName }}</div>

                        <div class="flex items-center gap-2 mb-3 pl-2">
                            <span class="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-700 transition hover:bg-gray-200">{{ log.sourceSoftwareLabel }}</span>
                            <i class="fa-solid fa-arrow-right text-gray-400 text-xs"></i>
                            <span class="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded transition hover:bg-green-200">{{ log.targetSoftwareLabel === 'MF' ? 'マネーフォワード' : (log.targetSoftwareLabel === 'Freee' ? 'freee' : '弥生会計') }}</span>
                        </div>

                        <a :href="log.downloadUrl" :download="log.fileName" @click="handleDownload(log.id)" class="bg-slate-50 rounded p-2 pl-3 flex items-center justify-between group-hover:bg-slate-100 transition text-decoration-none">
                            <div class="flex items-center gap-2 overflow-hidden">
                                <i class="fa-solid fa-file-csv text-green-600"></i>
                                <span class="text-xs font-mono text-gray-600 truncate">{{ log.fileName }}</span>
                            </div>
                            <i class="fa-solid fa-download text-gray-400 group-hover:text-blue-500 transition"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// [Internal_Import_Dependency] Line:204
import { ref, computed } from 'vue';
import { useDataConversion } from '@/composables/useDataConversion';

// [Internal_Logic_Flow] Line:207
const { logs, addLog, markAsDownloaded } = useDataConversion();
const isDragging = ref(false);
const isProcessing = ref(false);
const uploadedFile = ref<File | null>(null);
const loadingStatus = ref('');
const form = ref({
    clientName: '',
    sourceSoftware: '',
    targetSoftware: 'Yayoi'
});

const canConvert = computed(() => {
    return form.value.clientName && form.value.targetSoftware && uploadedFile.value;
});

const getSoftwareLabel = (val: string) => {
    switch(val) {
        case 'Yayoi': return '弥生会計';
        case 'MF': return 'マネーフォワード';
        case 'Freee': return 'freee';
        default: return val;
    }
};

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const handleDownload = (id: string) => {
    markAsDownloaded(id);
};

const handleDrop = (e: DragEvent) => {
    isDragging.value = false;
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
        const file = files[0];
        if (file) processFile(file);
    }
};

const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        const file = target.files[0];
        if (file) processFile(file);
    }
};

const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('CSVファイルのみ対応しています');
        return;
    }
    uploadedFile.value = file;
    if (!form.value.sourceSoftware) {
        setTimeout(() => {
            form.value.sourceSoftware = '会計王';
        }, 500);
    }
};

const startConversion = () => {
    if (!canConvert.value) return;
    isProcessing.value = true;
    loadingStatus.value = 'CSVファイルを解析中...';
    setTimeout(() => { loadingStatus.value = 'フォーマットを標準化しています...'; }, 1000);
    setTimeout(() => { loadingStatus.value = `${getSoftwareLabel(form.value.targetSoftware)}形式へ変換中...`; }, 2000);
    setTimeout(() => { loadingStatus.value = 'ファイルを生成しています...'; }, 3000);
    setTimeout(() => {
        completeConversion();
    }, 4000);
};

const completeConversion = () => {
    isProcessing.value = false;
    const today = new Date();
    const yyyymmdd = today.toISOString().slice(0,10).replace(/-/g, '');
    const fileName = `${form.value.clientName}_${form.value.sourceSoftware}_変換後${form.value.targetSoftware}_${yyyymmdd}.csv`;
    const content = '日付,借方勘定科目,借方金額,貸方勘定科目,貸方金額,摘要\n' +
                    `2024/12/26,消耗品費,1000,現金,1000,変換テストデータ\n`;
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    addLog({
        id: Date.now().toString(),
        timestamp: today.toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
        clientName: form.value.clientName,
        sourceSoftware: form.value.sourceSoftware,
        targetSoftware: form.value.targetSoftware,
        fileName: fileName,
        downloadUrl: url,
        isDownloaded: false
    });
    uploadedFile.value = null;
    alert(`${fileName} の生成が完了しました！`);
};

</script>

<style scoped>
/* [Style_Definition] Items 201-215 */
.animate-slide-in-right {
    animation: slideInRight 0.5s ease-out;
}
@keyframes slideInRight {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
}
.animate-bounce-in {
    animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
@keyframes bounceIn {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
}
</style>
