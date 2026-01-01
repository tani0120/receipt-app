<template>
  <div class="min-h-screen bg-gray-100 font-sans p-8">
    <div class="max-w-7xl mx-auto">
        <h1 class="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <i class="fa-solid fa-timeline text-indigo-600"></i> Screen E Timeline Verifier
        </h1>
        <p class="text-gray-500 mb-8 ml-10">4つの時点のデータ状態を再現し、UIコンポーネントの挙動を検証します。</p>

        <!-- Timeline 1: Latest (LogicMaster) -->
        <section class="mb-12 border-l-4 border-indigo-500 pl-6 relative">
            <div class="absolute -left-[11px] top-0 w-5 h-5 bg-indigo-500 rounded-full border-4 border-white"></div>
            <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-4">
                <span>12/28 02:36</span>
                <span class="text-xs font-normal bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">LogicMaster (Current)</span>
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Data Injection Controls -->
                 <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 class="font-bold text-sm text-gray-500 mb-3 uppercase tracking-wide">Scenarios</h3>
                    <div class="space-y-3">
                        <button @click="injectData('v1', 'work')" :class="['w-full py-3 px-4 rounded font-bold text-sm flex items-center justify-between transition border-2', activeScenario==='v1-work' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200']">
                            <span><i class="fa-solid fa-pen-to-square mr-2"></i> 1次仕訳 (Work)</span>
                            <i v-if="activeScenario==='v1-work'" class="fa-solid fa-chevron-right"></i>
                        </button>
                        <button @click="injectData('v1', 'approve')" :class="['w-full py-3 px-4 rounded font-bold text-sm flex items-center justify-between transition border-2', activeScenario==='v1-approve' ? 'bg-pink-50 border-pink-500 text-pink-700' : 'bg-white border-gray-100 text-gray-600 hover:border-pink-200']">
                             <span><i class="fa-solid fa-check-double mr-2"></i> 最終承認 (Approve)</span>
                             <i v-if="activeScenario==='v1-approve'" class="fa-solid fa-chevron-right"></i>
                        </button>
                        <button @click="injectData('v1', 'remand')" :class="['w-full py-3 px-4 rounded font-bold text-sm flex items-center justify-between transition border-2', activeScenario==='v1-remand' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-gray-100 text-gray-600 hover:border-orange-200']">
                             <span><i class="fa-solid fa-reply mr-2"></i> 差戻 (Remand)</span>
                             <i v-if="activeScenario==='v1-remand'" class="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                 </div>
                 <!-- Description -->
                 <div class="md:col-span-2 bg-slate-50 p-6 rounded-lg text-sm text-gray-600 leading-relaxed border border-gray-100">
                    <h4 class="font-bold text-slate-700 mb-2">バージョン特徴:</h4>
                    <p class="mb-2">AI提案理由の表示エリア、画像ビューアのツールバー、および確認ボタン群のロジックが完成形に近い状態。</p>
                    <div class="mt-4 p-3 bg-white border border-gray-200 rounded font-mono text-xs">
                        Ref Check: <span class="font-bold text-indigo-600">{{ activeScenario === 'v1-work' ? 'Injected Work Data' : (activeScenario?.startsWith('v1') ? 'Injected Scenario' : '-') }}</span>
                    </div>
                 </div>
            </div>
        </section>

        <!-- Timeline 2 -->
        <section class="mb-12 border-l-4 border-gray-300 pl-6 relative">
             <div class="absolute -left-[11px] top-0 w-5 h-5 bg-gray-300 rounded-full border-4 border-white"></div>
            <h2 class="text-xl font-bold text-gray-500 mb-4">12/27 01:40</h2>
            <div class="flex gap-4">
                 <button @click="injectData('v2', 'work')" class="bg-white border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50">Work</button>
                 <button @click="injectData('v2', 'approve')" class="bg-white border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50">Approve</button>
                 <button @click="injectData('v2', 'remand')" class="bg-white border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50">Remand</button>
            </div>
        </section>

        <!-- Timeline 3 -->
        <section class="mb-12 border-l-4 border-gray-300 pl-6 relative">
             <div class="absolute -left-[11px] top-0 w-5 h-5 bg-gray-300 rounded-full border-4 border-white"></div>
            <h2 class="text-xl font-bold text-gray-500 mb-4">12/26 21:33</h2>
            <div class="flex gap-4">
                 <button @click="injectData('v3', 'work')" class="bg-white border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50">Work</button>
                 <button @click="injectData('v3', 'approve')" class="bg-white border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50">Approve</button>
                 <button @click="injectData('v3', 'remand')" class="bg-white border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50">Remand</button>
            </div>
        </section>

        <!-- Timeline 4 -->
        <section class="mb-12 border-l-4 border-gray-300 pl-6 relative">
             <div class="absolute -left-[11px] top-0 w-5 h-5 bg-gray-300 rounded-full border-4 border-white"></div>
            <h2 class="text-xl font-bold text-gray-500 mb-4">12/26 17:59</h2>
            <div class="flex gap-4">
                 <button @click="injectData('v4', 'work')" class="bg-white border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50">Work</button>
                 <button @click="injectData('v4', 'approve')" class="bg-white border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50">Approve</button>
                 <button @click="injectData('v4', 'remand')" class="bg-white border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50">Remand</button>
            </div>
        </section>

        <!-- Viewport -->
        <div class="fixed bottom-0 right-0 w-[600px] h-[600px] bg-white border-t border-l border-gray-300 shadow-2xl z-50 flex flex-col">
            <div class="bg-slate-800 text-white p-2 text-xs flex justify-between font-bold">
                <span>View: {{ activeTitle }}</span>
                <button @click="closeViewer" class="hover:text-red-400"><i class="fa-solid fa-times"></i></button>
            </div>
            <div class="flex-1 overflow-hidden relative">
                <component :is="currentComponent" ref="targetRef" :injectedData="currentData" :injectedMode="currentMode" />
            </div>
        </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import ScreenE_1228 from './timelines/ScreenE_1228_Strict.vue';
import ScreenE_1227 from './timelines/ScreenE_1227.vue';
import ScreenE_1226L from './timelines/ScreenE_1226_Late.vue';
import ScreenE_1226E from './timelines/ScreenE_1226_Early.vue';

const targetRef = ref(null);
const activeScenario = ref('');
const currentData = ref(null);
const currentMode = ref('work');

const activeTitle = computed(() => {
    if(!activeScenario.value) return 'Ready';
    return activeScenario.value.toUpperCase();
});

const currentComponent = computed(() => {
    if (!activeScenario.value) return null;
    const v = activeScenario.value.split('-')[0];
    if (v === 'v1') return ScreenE_1228;
    if (v === 'v2') return ScreenE_1227;
    if (v === 'v3') return ScreenE_1226L;
    if (v === 'v4') return ScreenE_1226E;
    return null;
});

const closeViewer = () => { activeScenario.value = ''; };

// Data Snapshots
const snapshots = {
    v1: { // 12/28 02:36
        work: {
            id: 'v1_work', status: 'ready_for_work', mode: 'new',
            imageTitle: '12/28 02:36 Work',
            amount: 12100,
            ai_reason: '接待交際費としての推論確度(94%)。同席者: 佐藤様、他2名。',
            ai_proposal: { d: '接待交際費', c: '未払金', amount: 12100 }
        },
        approve: {
            id: 'v1_approve', status: 'waiting_approval', mode: 'new',
            imageTitle: '12/28 02:36 Approve',
            amount: 55000,
            ai_reason: '',
            ai_proposal: null
        },
        remand: {
            id: 'v1_remand', status: 'remanded', mode: 'new',
            imageTitle: '12/28 02:36 Remand',
            amount: 980,
            ai_reason: '勘定科目エラーのため差戻し。消耗品費ではなく旅費交通費として処理してください。',
            ai_proposal: null
        }
    },
    v2: { // 12/27
         work: { id: 'v2_work', amount: 5000, ai_reason: 'V2 Logic: Basic Inference', imageTitle: '12/27 Work' },
         approve: { id: 'v2_approve', amount: 5000, imageTitle: '12/27 Approve' },
         remand: { id: 'v2_remand', amount: 5000, imageTitle: '12/27 Remand' }
    },
    v3: { // 12/26 21:33
         work: { id: 'v3_work', amount: 3000, ai_reason: 'V3 Logic', imageTitle: '12/26 21:33 Work' },
         approve: { id: 'v3_approve', amount: 3000, imageTitle: '12/26 21:33 Approve' },
         remand: { id: 'v3_remand', amount: 3000, imageTitle: '12/26 21:33 Remand' }
    },
    v4: { // 12/26 17:59
         work: { id: 'v4_work', amount: 1000, ai_reason: 'V4 Logic', imageTitle: '12/26 17:59 Work' },
         approve: { id: 'v4_approve', amount: 1000, imageTitle: '12/26 17:59 Approve' },
         remand: { id: 'v4_remand', amount: 1000, imageTitle: '12/26 17:59 Remand' }
    }
};

const injectData = (version, type) => {
    activeScenario.value = `${version}-${type}`;
    const data = snapshots[version][type];

    // Set props data directly
    currentData.value = data;
    currentMode.value = type;

    // Also try to call setTx if ref is ready (for reactivity)
    nextTick(() => {
        if (targetRef.value && targetRef.value.setTx) {
            targetRef.value.setTx(data, type);
        }
    });
};
</script>
