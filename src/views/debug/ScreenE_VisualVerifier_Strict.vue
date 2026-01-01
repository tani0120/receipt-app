<template>
  <div class="h-screen flex flex-col">
    <!-- Verification Header -->
    <div class="bg-red-900 text-white p-2 text-xs flex justify-between items-center z-50 shadow-md shrink-0">
        <div class="font-bold flex items-center gap-2">
            <i class="fa-solid fa-microscope text-red-300"></i>
            VISUAL VERIFIER: Screen E LogicMaster Restoration (12/28 02:36 Version)
        </div>
        <div class="flex gap-2">
             <button @click="injectScenario('ai_proposal')" class="bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded border border-indigo-400 font-bold transition">
                <i class="fa-solid fa-robot"></i> Inject AI Proposal
            </button>
            <button @click="injectScenario('image_viewer')" class="bg-green-600 hover:bg-green-500 px-3 py-1 rounded border border-green-400 font-bold transition">
                <i class="fa-solid fa-image"></i> Show Viewer
            </button>
            <button @click="injectScenario('batch_confirm')" class="bg-orange-600 hover:bg-orange-500 px-3 py-1 rounded border border-orange-400 font-bold transition">
                <i class="fa-solid fa-list-check"></i> Batch Mode
            </button>
        </div>
    </div>

    <!-- Target Component Mount Point -->
    <div class="flex-1 relative overflow-hidden bg-gray-100">
        <!-- We mount the Mirror World version of Screen E -->
        <ScreenE_JournalEntry ref="targetComponent" />
    </div>

    <!-- Injection Status Overlay -->
    <div v-if="injectionStatus" class="absolute bottom-4 right-4 bg-black/80 text-green-400 font-mono text-xs p-3 rounded pointer-events-none animate-fade-out">
        > {{ injectionStatus }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import ScreenE_JournalEntry from '@/Mirror_sandbox/components/ScreenE_JournalEntry.vue';

const targetComponent = ref(null);
const injectionStatus = ref('');

const scenarios = {
    ai_proposal: {
        description: 'AI Proposal Logic',
        apply: (comp) => {
            // Force state injection into the component instance
            // We are assigning directly to reactive props/refs if exposed, or internal state if accessible.
            // Since <script setup> by default doesn't expose, we might need to rely on the fact that
            // in Vue 3 dev mode or non-strict setup, or via accessing properties if they were exposed via defineExpose.
            // However, for verification without modifying the source, we can try to manipulate the STORE data it reads?
            // No, user requested "Force values into component".
            // If the component uses a Composable, we can't easily reach into providing a mock just for it via props.
            // BUT, if the component has reactive state 'currentTransaction', we can try to find it.

            // Note: Accessing internal state of <script setup> component from parent is restricted by default (closed by default).
            // WE MUST MODIFY SCREEN E TO EXPOSE STATE?
            // "ScreenE_LogicMaster.vue" likely does NOT have defineExpose.
            // User said: "ScreenE_LogicMaster.vue を読み込み、その内部変数 ... に ... 直接 ... 文字列を与える"
            // This implies we CAN modify Screen E slightly to facilitate this, OR we assume we can somehow reach it.

            // STRATEGY: We will assume we can modify Screen E *slightly* in the Mirror World to add `defineExpose` for verification.
            // This is "Restoration" so making it testable is valid.
            if (comp.setCurrentTransaction) {
                 comp.setCurrentTransaction({
                    id: 'tx_mock_ai_001',
                    date: '2024-12-28',
                    amount: 15800,
                    description: 'アマゾンジャパン（同）',
                    ai_proposal: {
                        summary: '消耗品費 / 未払金',
                        confidence: 0.94,
                        reason: '過去の同額・同名称の取引履歴および一般的商習慣に基づき、消耗品費として計上することを提案します。'
                    },
                    status: 'review'
                });
            } else {
                console.warn("Component does not expose 'setCurrentTransaction'. Verification might fail without expose.");
            }
        }
    },
    image_viewer: {
        description: 'Image Viewer Active',
        apply: (comp) => {
            if (comp.showImageViewer !== undefined) comp.showImageViewer = true;
            if (comp.toggleImageViewer) comp.toggleImageViewer(true);
        }
    }
};

const injectScenario = async (key) => {
    const scenario = scenarios[key];
    if (scenario && targetComponent.value) {
        scenario.apply(targetComponent.value);
        injectionStatus.value = `Injected: ${scenario.description}`;
        setTimeout(() => injectionStatus.value = '', 3000);
    }
};
</script>

<style scoped>
@keyframes fade-out {
    0% { opacity: 1; }
    80% { opacity: 1; }
    100% { opacity: 0; }
}
.animate-fade-out {
    animation: fade-out 3s forwards;
}
</style>
