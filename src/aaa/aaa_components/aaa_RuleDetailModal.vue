<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Overlay -->
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>

    <!-- Modal Content -->
    <div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
        <h3 class="font-bold text-slate-700 flex items-center gap-2">
            <i class="fa-solid fa-robot text-purple-500"></i> ルール詳細編集
        </h3>
        <button @click="close" class="text-gray-400 hover:text-gray-600 transition">
            <i class="fa-solid fa-times text-lg"></i>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 overflow-y-auto space-y-6">

        <!-- Top Row: Status & Priority -->
        <div class="flex gap-6">
            <!-- Priority Slider -->
            <div class="flex-1">
                <label class="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                    適用優先度
                    <span class="text-[9px] text-gray-400 font-normal ml-1 bg-gray-100 px-1 rounded" title="同じ条件に複数のルールが該当した場合、数字が小さい（高い）ものが優先して適用され、他は無視されます。">
                        <i class="fa-solid fa-circle-question"></i> 推論の競合順位
                    </span>
                </label>
                <div class="flex items-center gap-4">
                    <input type="range" min="1" max="5" step="1" v-model.number="localRule.priority"
                        class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600">
                    <span class="font-bold text-lg w-8 text-center"
                        :class="localRule.priority === 1 ? 'text-red-600' : 'text-gray-700'">
                        {{ localRule.priority }}
                    </span>
                </div>
                <div class="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>高 (最優先)</span>
                    <span>低 (後回し)</span>
                </div>
                <div class="mt-2 text-[10px] text-gray-500 bg-yellow-50 p-1.5 rounded border border-yellow-100">
                    <i class="fa-solid fa-lightbulb text-yellow-500"></i>
                    <span v-if="localRule.priority === 1">「Amazon」等の広範な条件より優先して適用されます (例: AWS利用料)。</span>
                    <span v-else>一般的なルールとして適用されます。より強いルールがある場合は無視されます。</span>
                </div>
            </div>

            <!-- Status Toggle -->
            <div class="flex-shrink-0">
                <label class="block text-xs font-bold text-gray-500 mb-2">状態</label>
                <div class="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        @click="localRule.status = 'active'"
                        class="px-3 py-1.5 rounded text-xs font-bold transition"
                        :class="localRule.status === 'active' ? 'bg-white shadow text-emerald-600' : 'text-gray-400 hover:text-gray-600'"
                    >有効</button>
                    <button
                        @click="localRule.status = 'inactive'"
                        class="px-3 py-1.5 rounded text-xs font-bold transition"
                        :class="localRule.status === 'inactive' ? 'bg-white shadow text-gray-600' : 'text-gray-400 hover:text-gray-600'"
                    >無効</button>
                </div>
            </div>
        </div>

        <div class="border-t border-gray-100"></div>

        <!-- Logic Builder -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- IF (Trigger) -->
            <div class="space-y-4">
                <div class="flex items-center gap-2 mb-2">
                    <span class="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded">条件</span>
                    <span class="text-sm font-bold text-gray-700">いつ発動するか</span>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                    <div>
                        <label class="block text-[10px] font-bold text-gray-400 mb-1">対象フィールド</label>
                        <select v-model="localRule.trigger.type" class="w-full text-xs font-bold border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500">
                            <option value="description">摘要</option>
                            <option value="vendor">取引先</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-400 mb-1">キーワード (部分一致)</label>
                        <input type="text" v-model="localRule.trigger.keyword" class="w-full text-sm font-bold border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500 placeholder-gray-300" placeholder="例: タクシー">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-400 mb-1">金額範囲 (任意)</label>
                        <div v-if="localRule.trigger.amountRange" class="flex items-center gap-2">
                            <input type="number" v-model.number="localRule.trigger.amountRange.min" class="w-24 text-xs font-mono border-gray-300 rounded" placeholder="Min">
                            <span class="text-gray-400">~</span>
                            <input type="number" v-model.number="localRule.trigger.amountRange.max" class="w-24 text-xs font-mono border-gray-300 rounded" placeholder="Max">
                        </div>
                    </div>
                </div>
            </div>

            <!-- THEN (Result) -->
            <div class="space-y-4">
                <div class="flex items-center gap-2 mb-2">
                    <span class="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded">結果</span>
                    <span class="text-sm font-bold text-blue-800">推論結果</span>
                </div>

                <div class="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                     <div>
                        <label class="block text-[10px] font-bold text-blue-400 mb-1">借方勘定科目</label>
                        <input type="text" v-model="localRule.result.debitAccount" class="w-full text-sm font-bold border-blue-200 rounded focus:ring-blue-500 focus:border-blue-500 bg-white" placeholder="勘定科目">
                    </div>
                     <div>
                        <label class="block text-[10px] font-bold text-blue-400 mb-1">税区分 (任意)</label>
                         <input type="text" v-model="localRule.result.targetTaxClass" class="w-full text-xs font-bold border-blue-200 rounded focus:ring-blue-500 focus:border-blue-500 bg-white" placeholder="税区分">
                    </div>
                </div>
            </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <div class="text-xs text-gray-500">
            プレビュー: <span class="font-mono bg-gray-200 px-1 rounded">{{ localRule.trigger.keyword }}</span> → <span class="font-bold text-blue-700">{{ localRule.result.debitAccount }}</span>
        </div>
        <div class="flex gap-3">
            <button @click="close" class="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800">キャンセル</button>
            <button @click="save" class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded shadow-sm text-xs font-bold transition flex items-center gap-2">
                <i class="fa-solid fa-save"></i> 保存
            </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { LearningRuleUi } from '@/aaa/aaa_types/aaa_LearningRuleUi';

const props = defineProps<{
    modelValue: boolean;
    rule: LearningRuleUi | null;
}>();

const emit = defineEmits(['update:modelValue', 'save']);

const localRule = ref<LearningRuleUi>({
    id: '', clientId: '', priority: 3, status: 'draft', confidence: 0, hitCount: 0, generatedBy: 'human',
    trigger: { type: 'description', keyword: '', amountRange: {} },
    result: { debitAccount: '', targetTaxClass: '' }
});

const isOpen = ref(false);

watch(() => props.modelValue, (val) => {
    isOpen.value = val;
    if (val && props.rule) {
        // Deep Clone to avoid mutation
        localRule.value = JSON.parse(JSON.stringify(props.rule));
        // Reset amountRange if missing
        if(!localRule.value.trigger.amountRange) localRule.value.trigger.amountRange = {};
    } else if (val && !props.rule) {
        // New Rule
        localRule.value = {
            id: 'new-' + Date.now(),
            clientId: 'client-abc',
            priority: 3,
            status: 'active',
            trigger: { type: 'description', keyword: '', amountRange: {} },
            result: { debitAccount: '' },
            confidence: 1.0,
            hitCount: 0,
            generatedBy: 'human'
        };
    }
});

const close = () => {
    emit('update:modelValue', false);
};

const save = () => {
    emit('save', localRule.value);
    close();
};
</script>

<style scoped>
.animate-scale-in {
    animation: scaleIn 0.2s ease-out forwards;
}
@keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}
</style>
