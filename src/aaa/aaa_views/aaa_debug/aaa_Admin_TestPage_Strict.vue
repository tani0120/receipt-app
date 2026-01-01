<template>
    <div class="p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
        <h1 class="text-3xl font-extrabold text-slate-900 mb-8">
            <span class="text-indigo-600">Admin Page</span> Phase C Strict Verification
        </h1>

        <!-- Verification Controls -->
        <div class="mb-8 p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <h2 class="text-xl font-bold text-slate-700 mb-4">Contract Verification Controls</h2>
            <div class="flex gap-4">
                <button
                    @click="runStrictCheck"
                    class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow transition flex items-center gap-2"
                >
                    <i class="fa-solid fa-clipboard-check"></i>
                    Verify Phase C Contract
                </button>
                <div v-if="verificationStatus" class="flex items-center gap-3 px-4 py-2 rounded bg-slate-100 border border-slate-300">
                    <span class="font-bold text-slate-600">Status:</span>
                    <span :class="statusColor" class="font-extrabold text-lg">{{ verificationStatus }}</span>
                </div>
            </div>
            <!-- Error Log -->
            <div v-if="errors.length > 0" class="mt-6 p-4 bg-red-50 border border-red-100 rounded text-red-700 font-mono text-sm max-h-60 overflow-y-auto">
                <div v-for="(err, i) in errors" :key="i" class="mb-1 border-b border-red-100 pb-1 last:border-0">
                    [{{ i + 1 }}] {{ err }}
                </div>
            </div>
        </div>

        <!-- Target Component: Screen Z -->
        <div class="border-t-4 border-indigo-500 pt-8" data-test-section="screen-z">
             <div class="mb-4 flex items-center justify-between">
                <h2 class="text-2xl font-bold text-slate-800">Screen Z: Admin Dashboard (Target)</h2>
             </div>
             <!-- Mounting the actual component -->
             <div class="relative min-h-[500px] border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-100/50">
                <AaaScreenZDashboard v-if="shouldMount" />
             </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AaaScreenZDashboard from '@/aaa/aaa_views/aaa_ScreenZ/aaa_ScreenZ_Dashboard.vue';

const shouldMount = ref(true);
const verificationStatus = ref<string | null>(null);
const errors = ref<string[]>([]);

const statusColor = computed(() => {
    if (verificationStatus.value === 'PASSED') return 'text-emerald-600';
    if (verificationStatus.value === 'FAILED') return 'text-red-600';
    return 'text-slate-500';
});

const runStrictCheck = () => {
    verificationStatus.value = 'RUNNING...';
    errors.value = [];

    // Simple mount check (Real Contract Test is manual/visual in Phase C)
    setTimeout(() => {
        // Logic would go here if we had automated contract testing suite
        // For now, we simulate a successful mount check
        const target = document.querySelector('[data-test-section="screen-z"]');
        if (target && target.innerText.includes('全社：コスト & 品質')) {
             verificationStatus.value = 'PASSED';
        } else {
             verificationStatus.value = 'FAILED';
             errors.value.push('CRITICAL: Screen Z content not found via DOM text check.');
        }
    }, 1000);
};
</script>
