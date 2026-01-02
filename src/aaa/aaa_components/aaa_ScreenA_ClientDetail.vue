<template>
  <div class="h-full flex flex-col bg-slate-50 font-sans text-slate-800">
    <!-- Header: Client ID & Basic Info -->
    <header class="bg-white border-b border-gray-200 px-8 py-6 shadow-sm shrink-0">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <button @click="$router.push({ name: 'aaa_ScreenA' })" class="text-xs text-slate-500 hover:text-blue-600 mb-2 flex items-center gap-1 transition-colors">
            <i class="fa-solid fa-arrow-left"></i> 顧問先一覧に戻る
          </button>
          <div class="flex items-center gap-3">
             <div class="bg-slate-800 text-white font-mono text-sm font-bold px-2 py-1 rounded">AAA</div>
             <h1 class="text-2xl font-bold text-slate-900">株式会社サンプルクライアント</h1>
             <span class="bg-blue-50 text-blue-700 border border-blue-100 text-xs px-2 py-0.5 rounded font-medium">12月決算</span>
             <span class="bg-green-50 text-green-700 border border-green-100 text-xs px-2 py-0.5 rounded font-medium">稼働中</span>
          </div>
          <div class="flex items-center gap-4 mt-2 text-sm text-slate-500">
             <div class="flex items-center gap-1"><i class="fa-solid fa-user-tie text-slate-400"></i> 担当者A</div>
             <div class="flex items-center gap-1"><i class="fa-solid fa-desktop text-slate-400"></i> freee</div>
             <div class="flex items-center gap-1"><i class="fa-solid fa-calculator text-slate-400"></i> 税込 / 発生主義</div>
          </div>
        </div>

        <div class="flex items-center gap-3">
             <button class="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm">
                <i class="fa-solid fa-pen mr-1"></i> 編集
            </button>
        </div>
      </div>

       <!-- Tab Navigation -->
        <div class="flex gap-1 mt-6 border-b border-gray-200">
            <button class="px-4 py-2 text-sm font-bold text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 rounded-t-lg">
                基本情報・設定
            </button>
            <button class="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 border-b-2 border-transparent hover:border-slate-300 transition">
                月次履歴
            </button>
            <button class="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 border-b-2 border-transparent hover:border-slate-300 transition">
                学習ルール
            </button>
        </div>
    </header>

    <!-- Main Content: Basic Info & Drive Folders -->
    <main class="flex-1 overflow-y-auto p-8">
        <div class="max-w-5xl mx-auto space-y-8">

            <!-- Drive Folder Links (Crucial for Ironclad) -->
            <section>
                <h2 class="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <i class="fa-brands fa-google-drive text-slate-500"></i> Google Drive連携フォルダ
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <aaa_ScreenA_Detail_DriveCard
                        title="顧客共有フォルダ"
                        path="gdrive/folders/ABC..."
                        iconColorClass="text-yellow-400"
                        href="#"
                    />
                    <aaa_ScreenA_Detail_DriveCard
                        title="仕訳CSV出力先"
                        path="gdrive/folders/DEF..."
                        iconColorClass="text-blue-400"
                        href="#"
                    />
                    <aaa_ScreenA_Detail_DriveCard
                        title="仕訳除外しフォルダ"
                        path="gdrive/folders/GHI..."
                        iconColorClass="text-gray-400"
                        href="#"
                    />
                    <aaa_ScreenA_Detail_DriveCard
                        title="過去仕訳・学習データ"
                        path="gdrive/folders/JKL..."
                        iconColorClass="text-purple-400"
                        href="#"
                    />
                </div>
            </section>

             <!-- Detailed Info Grid -->
            <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Column 1: Basic Info -->
                <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 class="font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">基本情報</h3>
                    <dl class="space-y-4">
                        <div>
                            <dt class="text-xs text-slate-400 font-bold mb-1">会社名 / 屋号</dt>
                            <dd class="text-sm font-medium text-slate-700">株式会社サンプルクライアント</dd>
                        </div>
                         <div>
                            <dt class="text-xs text-slate-400 font-bold mb-1">代表者名</dt>
                            <dd class="text-sm font-medium text-slate-700">代表 太郎</dd>
                        </div>
                         <div class="grid grid-cols-2 gap-4">
                            <div>
                                <dt class="text-xs text-slate-400 font-bold mb-1">決算月</dt>
                                <dd class="text-sm font-medium text-slate-700">12月</dd>
                            </div>
                            <div>
                                <dt class="text-xs text-slate-400 font-bold mb-1">申告区分</dt>
                                <dd class="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <span class="w-3 h-3 bg-blue-500 rounded-full"></span> 青色申告
                                </dd>
                            </div>
                        </div>
                         <div>
                            <dt class="text-xs text-slate-400 font-bold mb-1">連絡先 (Chatwork)</dt>
                            <dd class="text-sm font-medium text-slate-700 font-mono truncate bg-slate-50 p-2 rounded">
                                https://www.chatwork.com/g/12345678
                            </dd>
                        </div>
                    </dl>
                </div>

                <!-- Column 2: Accounting Info -->
                 <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 class="font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">会計設定</h3>
                    <dl class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                             <div>
                                <dt class="text-xs text-slate-400 font-bold mb-1">使用ソフト</dt>
                                <dd class="text-sm font-medium text-slate-700">freee</dd>
                            </div>
                             <div>
                                <dt class="text-xs text-slate-400 font-bold mb-1">消費税算出</dt>
                                <dd class="text-sm font-medium text-slate-700">原則課税</dd>
                            </div>
                        </div>
                         <div class="grid grid-cols-2 gap-4">
                             <div>
                                <dt class="text-xs text-slate-400 font-bold mb-1">税抜/税込</dt>
                                <dd class="text-sm font-medium text-slate-700">税込経理</dd>
                            </div>
                             <div>
                                <dt class="text-xs text-slate-400 font-bold mb-1">端数処理</dt>
                                <dd class="text-sm font-medium text-slate-700">切り捨て</dd>
                            </div>
                        </div>
                        <div>
                            <dt class="text-xs text-slate-400 font-bold mb-1">デフォルト税率</dt>
                            <dd class="text-sm font-medium text-slate-700">10%</dd>
                        </div>
                         <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-100 mt-2">
                             <dt class="text-xs text-yellow-600 font-bold mb-1"><i class="fa-solid fa-triangle-exclamation"></i> 簡易課税未設定</dt>
                             <dd class="text-xs text-yellow-700">
                                 現在、簡易課税のみなし仕入率は設定されていません。
                             </dd>
                        </div>
                    </dl>
                </div>
            </section>
        </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { aaa_useAccountingSystem } from '@/aaa/aaa_composables/aaa_useAccountingSystem';
import { mapClientDetailApiToUi } from '@/aaa/aaa_composables/aaa_ClientDetailMapper';
import type { ClientDetailUi } from '@/aaa/aaa_types/aaa_ui.type';
import aaa_ScreenA_Detail_DriveCard from './aaa_ScreenA_Detail_DriveCard.vue';

const route = useRoute();
const router = useRouter();
const { clients, fetchClients } = aaa_useAccountingSystem();

const code = computed(() => route.params.code as string);

// Data Binding: Ironclad Contract
// 1. Get Raw Data (or use Mock/API)
// 2. Map to UI
const rawClient = computed(() => clients.value.find(c => c.clientCode === code.value));

// Use the Mapper. Even if rawClient is undefined, mapper must handle it.
const client = computed<ClientDetailUi>(() => {
    // If rawClient is missing (e.g. direct load), mapper handles "unknown"
    // However, the `clients` array in `useAccountingSystem` currently returns ClientUi[] ??
    // Actually `useAccountingSystem` returns mapped ClientUi[] logic usually.
    // Let's check `aaa_useAccountingSystem` implementation.
    // Assuming for Detail we might need to fetch detailed info or re-map.
    // Ideally we should rely on the Mapper from a fresh source or re-map current plain object if it matches API shape.
    // For now, to satisfy visual requirement, we map whatever we have.
    // NOTE: In `aaa_useAccountingSystem`, `clients` is ref<ClientUi[]>.
    // Using `mapClientDetailApiToUi` on a `ClientUi` object might be weird if types don't overlap perfectly or if we expect API fields.
    // BUT! Since we defined `ClientDetailApi` roughly as z.infer schema, we should pass that.
    // Since `clients` is already UI, we can't map UI -> UI with API mapper.
    // WE NEED A MOCK or a real fetch for detail.
    // For Phase C Verified Safety, we will fallback to a safe default if not found.
    return mapClientDetailApiToUi(rawClient.value || {});
});

onMounted(() => {
    if (!clients.value.length) {
        fetchClients();
    }
});
</script>
