<template>
    <div class="p-8 bg-gray-900 min-h-screen text-white">
        <h1 class="text-2xl font-bold bg-red-600 inline-block px-4 py-1 mb-4">Screen A: Kill Test (Ironclad Verify)</h1>

        <div class="flex gap-4 mb-4">
            <button @click="runWorst" class="px-4 py-2 bg-red-700 hover:bg-red-600 font-bold border-2 border-white">
                C-1: WORST CASE (NaN / Null / Undefined)
            </button>
            <button @click="runLong" class="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 font-bold border-2 border-white">
                C-2: LONG TEXT (10,000 chars)
            </button>
            <button @click="reset" class="px-4 py-2 bg-gray-600 hover:bg-gray-500 font-bold">
                Reset
            </button>
        </div>

        <div class="bg-white text-slate-800 p-2 rounded shadow-lg overflow-hidden h-[600px] relative border-4 border-red-500">
            <div class="absolute top-0 right-0 bg-red-500 text-white px-2 text-xs font-bold z-50">KILL ZONE</div>
            <!-- Target Component -->
            <aaa_ScreenA_ClientList v-if="ready" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import aaa_ScreenA_ClientList from '@/aaa/aaa_components/aaa_ScreenA_ClientList.vue';
import { aaa_useAccountingSystem } from '@/aaa/aaa_composables/aaa_useAccountingSystem';

const ready = ref(true);
const { debugInjectClients, fetchClients } = aaa_useAccountingSystem();

// C-1: Worst Case Data
// Goal: Verify no whiteout, safe fallback rendering
const runWorst = () => {
    ready.value = false;
    setTimeout(() => {
        // @ts-ignore
        debugInjectClients([
            {
                clientCode: undefined, // Type violation
                companyName: null, // Type violation
                repName: 12345, // Type violation
                fiscalMonth: NaN, // Logic violation
                status: 'invalid_status_code', // Enum violation
                contact: null, // Sub-object violation (might crash if not guarded)
                driveLinked: undefined,
                driveLinks: {} // Missing keys
            },
            {
                // Partial Object
                clientCode: 'BAD_002',
            }
        ]);
        ready.value = true;
    }, 100);
};

// C-2: Long Text
const runLong = () => {
    ready.value = false;
    setTimeout(() => {
        const longStr = "A".repeat(10000);
        const longName = "株式会社 " + "長い名前".repeat(500);

        // @ts-ignore
        debugInjectClients([
            {
                clientCode: 'LONG_001',
                companyName: longName,
                repName: 'Long Rep Name',
                fiscalMonth: 12,
                status: 'active',
                // Important: Need structurally valid enough to pass pipeline if pipeline exists,
                // OR raw enough to crash if pipeline fails.
                // Use Accounting System uses 'processClientPipeline'.
                // If we inject directly to `clients.value`, we BYPASS the pipeline if `debugInjectClients` writes to state.
                // This simulates "Corrupt State" or "Mapper Failure".

                // We need to provide enough structure for UI helpers:
                contact: { type: 'none', value: '' },
                driveLinks: { storage: '#', journalOutput: '#', journalExclusion: '#', pastJournals: '#' },

                // Mapped props expected by UI (since we are injecting into UI State directly):
                // If UI state expects `fiscalMonthLabel`, we must provide it OR the component must calculate it?
                // `ClientUi` has `fiscalMonthLabel`.
                // `aaa_useAccountingSystem` uses `mapClientApiToUi`.
                // If we inject RAW data into `clients` (which is ClientUi[]), we MUST match ClientUi strictness OR test if Component crashes on missing UI props.
                // IRONCLAD Rule: UI Types are Strict.
                // If we inject MISSING props (e.g. no fiscalMonthLabel), TS says "Prop missing", but runtime is what matters.
                // We want to verify: "If data is corrupted/missing keys, does VIEW crash?"

                fiscalMonthLabel: '12月決算', // Providing valid
                softwareLabel: 'freee',
                taxInfoLabel: '一般/青色',
                isActive: true,
                driveLinked: true
            }
        ]);
        ready.value = true;
    }, 100);
};

const reset = async () => {
    ready.value = false;
    await fetchClients();
    ready.value = true;
};
</script>
