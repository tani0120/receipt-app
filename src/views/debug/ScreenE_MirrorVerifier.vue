<template>
  <div class="h-screen flex flex-col bg-slate-900 text-white">
    <div class="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center shrink-0">
        <h1 class="text-xl font-bold flex items-center gap-3">
            <span class="text-3xl">🪞</span>
            <div>
                <div>Mirror World Verification</div>
                <div class="text-xs text-slate-400 font-mono">src/Mirror_sandbox/Mirror_components/Mirror_ScreenE_JournalEntry.vue</div>
            </div>
        </h1>
        <div class="flex gap-4">
            <div class="text-right">
                <div class="text-xs text-slate-400">Target</div>
                <div class="font-bold text-green-400">12/17 Baseline (Ver.10.17)</div>
            </div>
            <div class="h-8 w-px bg-slate-600"></div>
            <div class="text-right">
                <div class="text-xs text-slate-400">Status</div>
                <div class="font-bold text-yellow-400">Sandboxed</div>
            </div>
        </div>
    </div>

    <div class="flex-1 bg-white relative overflow-hidden border-8 border-slate-900 rounded-lg m-4">
        <!-- Error Boundary / Fallback -->
        <component :is="MirrorComponent" v-if="MirrorComponent" />
        <div v-else class="flex h-full items-center justify-center text-slate-400">
            Scanning Mirror Dimension...
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { shallowRef, onMounted, defineAsyncComponent } from 'vue';

// Dynamically import from the sandbox path to ensure we are testing the right file
const MirrorComponent = shallowRef<any>(null);

onMounted(() => {
    // Explicitly target the sandbox file
    MirrorComponent.value = defineAsyncComponent(() =>
        // @ts-ignore
        import('../../Mirror_sandbox/Mirror_components/Mirror_ScreenE_JournalEntry.vue')
    );
});
</script>
