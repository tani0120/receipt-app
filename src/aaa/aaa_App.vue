
<template>
  <div id="app" class="flex flex-col h-full bg-slate-50 text-slate-700 font-sans h-screen overflow-hidden">
    <!-- Navigation (Reference Design) -->
    <nav class="bg-white border-b border-gray-200 px-6 py-2 flex justify-between items-center shadow-sm z-50 shrink-0">
        <div class="flex items-center gap-6">
            <div class="font-bold text-lg text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-robot text-blue-600"></i> AI経理プラットフォーム
                <span class="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded border">Ver.10.17</span>
            </div>
            <div class="flex space-x-1">
                <button @click="$router.push('/clients')" :class="['px-3 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2', isActive('/clients') ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:bg-gray-50']">
                    <i class="fa-solid fa-users"></i> A:顧問先管理
                </button>
                <button @click="$router.push('/journal-status')" :class="['px-3 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2', isActive('/journal-status') ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:bg-gray-50']">
                    <i class="fa-solid fa-calculator"></i> B:全社仕訳
                </button>
                <button @click="$router.push('/collection-status')" :class="['px-3 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2', isActive('/collection-status') ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:bg-gray-50']">
                    <i class="fa-solid fa-calendar-days"></i> C:全社回収
                </button>
                <button @click="$router.push('/ai-rules')" :class="['px-3 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 relative', isActive('/ai-rules') ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:bg-gray-50']">
                    <i class="fa-solid fa-brain"></i> D:AIルール
                    <span class="bg-red-500 text-white text-[9px] px-1.5 rounded-full ml-1">3</span>
                </button>
                <button @click="$router.push('/data-conversion')" :class="['px-3 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 relative', isActive('/data-conversion') ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:bg-gray-50']">
                    <i class="fa-solid fa-arrow-right-arrow-left"></i> G:会計ソフト変換
                    <span v-if="pendingDownloadCount > 0" class="bg-red-500 text-white text-[9px] px-1.5 rounded-full ml-1">{{ pendingDownloadCount }}</span>
                </button>
                <button @click="$router.push('/task-dashboard')" :class="['px-3 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 relative', isActive('/task-dashboard') ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:bg-gray-50']">
                    <i class="fa-solid fa-list-check"></i> H:全社タスク
                </button>
            </div>
        </div>
        <div class="flex items-center gap-4">
            <button @click="toggleEmergencyStop" :class="['text-xs font-bold px-4 py-2 rounded-full transition flex items-center gap-2 border', isEmergencyStopped ? 'kill-switch-active text-white bg-red-600 border-red-700' : 'bg-white text-red-600 border-red-200 hover:bg-red-50']">
                <i class="fa-solid fa-power-off"></i> {{ isEmergencyStopped ? '緊急停止中' : '緊急停止' }}
            </button>
            <div class="text-xs text-right mr-2">
                <div class="font-bold">{{ currentUser.name }}</div>
                <div class="text-[10px] text-gray-400">{{ currentUser.email }}</div>
            </div>
            <button
              @click="handleSeedJobs"
              class="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded hover:bg-orange-200 transition ml-2 border border-orange-200"
              title="開発用: テストジョブデータ投入"
            >
              <i class="fa-solid fa-database mr-1"></i>Seed Job
            </button>
            <button @click="$router.push('/admin')" class="text-xs font-bold px-3 py-1.5 rounded transition flex items-center gap-2 bg-white border text-slate-600 hover:bg-slate-100">
                <i class="fa-solid fa-screwdriver-wrench"></i> 管理者用
            </button>
        </div>
    </nav>

    <!-- Main Content -->
    <!-- Main Content -->
    <main class="flex-1 overflow-hidden relative bg-slate-100 p-4">
         <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
    </main>

    <!-- DEV TOOLS -->
    <!-- DEV TOOLS Removed -->

    <!-- Global Seed Modal -->
    <div v-if="showSeedModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-fade-in">
        <div class="bg-white rounded-lg shadow-xl w-96 p-6 animate-scale-in">
            <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-database text-orange-500"></i> テストデータ投入
            </h3>
            <p class="text-xs text-gray-500 mb-4 leading-relaxed">
                指定したクライアントコードに対して、開発用のリッチなジョブデータ（自動検知銀行、回収状況確認用など）を投入します。
            </p>
            <div class="mb-6">
                <label class="block text-xs font-bold text-gray-700 mb-1">クライアントコード</label>
                <input v-model="seedClientCode" type="text" class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none uppercase font-mono" placeholder="例: AMT">
            </div>
            <div class="flex justify-end gap-3">
                <button @click="showSeedModal = false" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition">
                    キャンセル
                </button>
                <button @click="executeSeed" class="px-4 py-2 text-sm bg-orange-500 text-white font-bold rounded hover:bg-orange-600 shadow transition flex items-center gap-2">
                    <i class="fa-solid fa-play"></i> 実行
                </button>
            </div>
        </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref } from 'vue';
import { aaa_useAccountingSystem } from '@/aaa/aaa_composables/aaa_useAccountingSystem';
import { seedRichJobs } from '@/aaa/aaa_utils/aaa_seedRichJobs';
import { aaa_useDataConversion } from '@/aaa/aaa_composables/aaa_useDataConversion';

const route = useRoute();
const { currentUser, isEmergencyStopped, toggleEmergencyStop } = aaa_useAccountingSystem();
const { pendingDownloadCount } = aaa_useDataConversion();

const isActive = (path: string) => route.path.startsWith(path);

// Seed Modal State
const showSeedModal = ref(false);
const seedClientCode = ref('AMT');

// Open Seed Modal
const handleSeedJobs = () => {
    seedClientCode.value = 'AMT';
    showSeedModal.value = true;
};

// Execute Seeding
const executeSeed = async () => {
    if (seedClientCode.value) {
        showSeedModal.value = false;
        await seedRichJobs(seedClientCode.value);
    }
};
</script>

<style>
/* Global styles are imported in main.ts */
</style>
```
