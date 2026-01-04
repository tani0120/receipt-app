<template>
  <div class="h-full flex flex-col bg-white rounded-lg shadow border border-gray-200 overflow-hidden animate-fade-in relative">
      <!-- MOCK CONTROLS FOR TESTING -->
      <div v-if="testControls" class="bg-red-50 p-2 text-xs border-b border-red-200 flex gap-4 items-center shrink-0">
          <span class="font-bold text-red-600">[MIRROR WORLD] Screen C (BFF)</span>
          <label><input type="checkbox" v-model="mockIsDetailView"> 詳細モード</label>
      </div>

      <!-- DETAIL VIEW (Stub for now, focused on Grid) -->
      <!-- DETAIL VIEW -->
      <div v-if="isDetailView" class="h-full flex flex-col bg-slate-50 overflow-hidden animate-fade-in relative w-full">
           <div class="p-6 h-full flex flex-col">
                <button @click="goBack" class="text-xs text-gray-500 hover:text-blue-500 mb-4 flex items-center shrink-0">
                   <i class="fa-solid fa-arrow-left mr-1"></i> 一覧に戻る
               </button>

               <div v-if="isDetailLoading" class="flex justify-center items-center h-full">
                    <i class="fa-solid fa-spinner fa-spin text-2xl text-blue-500"></i>
               </div>

               <template v-else-if="currentDetail">
                   <div class="flex items-center gap-4 mb-6 shrink-0">
                       <h1 class="text-2xl font-bold text-slate-800">{{ currentDetail.name }}</h1>
                       <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-mono">{{ currentDetail.code }}</span>
                   </div>

                   <!-- History Grid Card -->
                   <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex-1 overflow-y-auto">
                        <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <i class="fa-solid fa-clock-rotate-left"></i> 回収履歴・詳細
                        </h3>
                        <div class="space-y-4">
                            <div v-for="item in currentDetail.history" :key="`${item.year}-${item.month}`" class="flex items-start gap-4 p-4 border-b border-gray-100 last:border-0 hover:bg-slate-50 transition rounded-lg">
                                <div class="w-20 text-center shrink-0">
                                    <div class="text-xs font-bold text-slate-500">{{ item.year }}年</div>
                                    <div class="text-xl font-bold text-slate-800">{{ item.month }}月</div>
                                    <div class="mt-2 text-2xl">
                                        <i v-if="item.status === 'check'" class="fa-solid fa-circle-check text-green-500"></i>
                                        <i v-else-if="item.status === 'cross'" class="fa-solid fa-xmark text-red-500"></i>
                                        <i v-else-if="item.status === 'triangle'" class="fa-solid fa-triangle-exclamation text-yellow-500"></i>
                                        <i v-else class="fa-solid fa-minus text-gray-300"></i>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <div v-if="item.files.length > 0" class="flex flex-wrap gap-2">
                                        <a v-for="file in item.files" :key="file.id" :href="file.driveLink || '#'" target="_blank" class="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded text-xs font-bold hover:bg-blue-100 transition border border-blue-100">
                                            <i class="fa-solid fa-file-pdf"></i>
                                            {{ file.name }}
                                            <span class="text-[9px] text-blue-400 ml-1">{{ file.timestamp.slice(0, 10) }}</span>
                                        </a>
                                    </div>
                                    <div v-else class="text-sm text-gray-400 italic py-2">
                                        提出資料はありません
                                    </div>
                                </div>
                            </div>
                        </div>
                   </div>
               </template>

               <div v-else class="text-center text-gray-500 mt-10">
                   データの取得に失敗しました
               </div>
           </div>
      </div>

      <!-- LIST VIEW -->
      <template v-else>
        <div class="p-3 border-b border-gray-200 flex justify-between items-center bg-slate-50 shrink-0">
              <div class="flex items-center gap-4">
                  <div class="font-bold text-slate-700 text-sm flex items-center gap-2 mr-4">
                      <i class="fa-solid fa-calendar-days text-blue-500"></i> 全社資料回収状況
                  </div>
                  <div class="flex items-center bg-white rounded p-0.5 text-xs border border-gray-200 shadow-sm">
                      <button @click="changeYear('prev')" class="px-3 py-1 hover:bg-gray-100 rounded-l text-gray-500"><i class="fa-solid fa-backward"></i> 過去</button>
                      <span class="px-3 font-bold text-slate-700 border-x border-gray-200 bg-white">{{ viewYearStart }}年 〜 {{ viewYearStart + 1}}年</span>
                      <button @click="changeYear('next')" class="px-3 py-1 hover:bg-gray-100 rounded-r text-gray-500">未来 <i class="fa-solid fa-forward"></i></button>
                  </div>
                  <div v-if="isLoading" class="text-xs font-bold text-blue-500 flex items-center gap-2">
                       <i class="fa-solid fa-spinner fa-spin"></i> 読込中...
                  </div>
              </div>
              <div class="flex gap-4 text-[10px] text-gray-500 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm">
                  <span class="flex items-center"><i class="fa-solid fa-circle-check text-green-500 mr-1"></i>完了</span>
                  <span class="flex items-center"><i class="fa-solid fa-xmark text-red-500 mr-1"></i>未着</span>
                  <span class="flex items-center"><i class="fa-solid fa-triangle-exclamation text-yellow-500 mr-1"></i>一部未着</span>
                  <span class="border-l pl-3 ml-2 flex items-center"><span class="w-0.5 h-3 bg-blue-500 mr-1 block"></span> 決算月</span>
              </div>
          </div>

          <div class="overflow-auto flex-1 p-0 relative">
              <table v-if="!isLoading" class="w-full border-collapse text-xs min-w-[1500px]">
                  <thead class="sticky top-0 z-30 shadow-sm">
                      <tr class="bg-slate-100 text-gray-600 text-[10px] font-bold uppercase h-6 border-b border-gray-300">
                          <th class="p-0 w-64 text-left sticky left-0 z-20 bg-slate-50 border-r border-gray-200"><div class="px-3 py-1">クライアント情報</div></th>
                          <th colspan="12" class="border-r border-gray-300 text-center bg-slate-200 text-slate-700">{{ viewYearStart }}年</th>
                          <th colspan="12" class="text-center bg-slate-100 text-slate-500">{{ viewYearStart + 1 }}年</th>
                      </tr>
                      <tr class="bg-slate-50 text-gray-500 text-[9px] font-bold border-b border-gray-300 h-6">
                          <th class="sticky left-0 z-20 bg-slate-50 border-r border-gray-200"></th>
                          <th v-for="m in 24" :key="m" class="w-8 border-r text-center align-middle relative">
                              <span class="text-[7px] absolute top-0 left-0 text-gray-400 transform scale-75 origin-top-left">'{{ m <= 12 ? String(viewYearStart).slice(2) : String(viewYearStart + 1).slice(2) }}</span>
                              {{ m <= 12 ? m : m - 12 }}
                          </th>
                      </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                      <tr v-for="client in clients" :key="client.jobId" class="hover:bg-blue-50/10 transition h-10">
                          <td class="p-0 sticky left-0 z-20 border-r border-gray-200 align-middle bg-white group">
                              <div class="flex items-stretch h-10 cursor-pointer" @click="goToCollectionDetail(client)">
                                  <div class="w-10 bg-slate-100 flex items-center justify-center border-r border-slate-200 text-[10px] font-mono font-bold text-slate-500 shrink-0">{{ client.code }}</div>
                                  <div class="flex-1 px-3 flex flex-col justify-center min-w-0 hover:bg-blue-50">
                                      <div class="font-bold text-slate-700 text-xs truncate">{{ client.name }}</div>
                                      <div class="flex gap-1"><span class="text-[9px] text-blue-600 font-bold">{{ client.type === 'individual' ? '個人(12月)' : client.fiscalMonth + '月決算' }}</span></div>
                                  </div>
                                  <div class="w-8 flex items-center justify-center border-l border-slate-100 shrink-0"><i class="fa-solid fa-folder-open text-slate-300 hover:text-blue-600"></i></div>
                              </div>
                          </td>
                          <td v-for="(cell, idx) in client.cells" :key="idx" :class="['w-8 h-10 border-r border-b border-gray-200 text-center align-middle relative', getBgColor(cell.style)]">
                               <div v-if="cell.isFiscalMonth" class="absolute right-0 top-0 bottom-0 border-r-2 border-blue-500 z-0"><span class="absolute bottom-0 right-0 bg-blue-500 text-white text-[8px] px-0.5 leading-none rounded-tl shadow-sm">決</span></div>
                               <i v-if="cell.status === 'check'" class="fa-solid fa-circle-check text-green-500 relative z-10 text-xs"></i>
                               <i v-if="cell.status === 'cross'" class="fa-solid fa-xmark text-red-500 relative z-10 text-xs"></i>
                               <i v-if="cell.status === 'triangle'" class="fa-solid fa-triangle-exclamation text-orange-500 relative z-10 text-xs"></i>
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useCollectionStatusRPC } from '@/composables/useCollectionStatusRPC';

const { clients, viewYearStart, fetchCollectionData, isLoading, currentDetail, isDetailLoading, fetchClientDetail } = useCollectionStatusRPC();

const testControls = ref(true);
const mockIsDetailView = ref(false);
const selectedClientCode = ref<string|null>(null);

const isDetailView = computed(() => mockIsDetailView.value || !!selectedClientCode.value);

onMounted(() => {
    fetchCollectionData(viewYearStart.value);
});

const changeYear = (dir: 'next' | 'prev') => {
    const newYear = dir === 'next' ? viewYearStart.value + 1 : viewYearStart.value - 1;
    fetchCollectionData(newYear);
};

const goBack = () => {
    mockIsDetailView.value = false;
    selectedClientCode.value = null;
};

// Map generic 'jobId' based click to 'code' fetching
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const goToCollectionDetail = async (client: any) => {
    selectedClientCode.value = client.code;
    mockIsDetailView.value = true;
    await fetchClientDetail(client.code);
};

const getBgColor = (style: string) => {
    if (style === 'active-1') return 'bg-white';
    if (style === 'active-2') return 'bg-blue-50';
    return 'bg-diagonal';
};

</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
/* Diagonal stripe for inactive */
.bg-diagonal {
    background-image: linear-gradient(45deg, #f3f4f6 25%, transparent 25%, transparent 50%, #f3f4f6 50%, #f3f4f6 75%, transparent 75%, transparent);
    background-size: 10px 10px;
}
</style>
