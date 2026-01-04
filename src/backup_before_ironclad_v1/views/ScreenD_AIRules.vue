<template>
  <!-- [UI_Structure] Line:3 -->
  <div class="h-full flex flex-col bg-white rounded-lg shadow border border-gray-200 overflow-hidden animate-fade-in">
    <!-- [UI_Structure] Line:5 -->
    <div class="p-4 border-b border-gray-200 bg-slate-50 flex justify-between items-center shrink-0">
      <div class="font-bold text-slate-700 text-sm flex items-center gap-2">
        <i class="fa-solid fa-robot text-purple-500"></i> AI自動仕訳ルール (Mirror)
      </div>
      <!-- [UI_Structure] Line:9 -->
      <button @click="openRuleModal()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-xs font-bold shadow-md transition flex items-center gap-2">
        <i class="fa-solid fa-plus"></i> 新規ルール
      </button>
    </div>

    <!-- [UI_Structure] Line:15 -->
    <div class="flex-1 overflow-auto p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Loop Item -->
        <div v-for="rule in rules" :key="rule.id" class="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition group relative">
            <!-- Actions -->
            <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition flex gap-2">
                <button class="text-gray-400 hover:text-blue-500"><i class="fa-solid fa-pen"></i></button>
                <button class="text-gray-400 hover:text-red-500"><i class="fa-solid fa-trash"></i></button>
            </div>

            <!-- Priority & Status -->
            <div class="flex items-center gap-2 mb-3">
                <span class="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200">
                    Priority: {{ rule.priority }}
                </span>
                <span v-if="rule.isActive" class="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <i class="fa-solid fa-circle text-[6px]"></i> 有効
                </span>
                <span v-else class="text-[10px] text-gray-400 font-bold">無効</span>
            </div>

            <!-- Main Content -->
            <div class="space-y-3">
                <!-- Trigger -->
                <div class="bg-gray-50 p-2 rounded border border-gray-100">
                    <div class="text-[10px] text-gray-400 font-bold uppercase mb-1">Trigger (条件)</div>
                    <div class="text-xs text-gray-700 font-mono">
                        <span class="bg-yellow-100 px-1 rounded mr-1">"{{ rule.trigger.keyword }}"</span>
                        <span v-if="rule.trigger.amount" class="bg-blue-100 px-1 rounded">>= ¥{{ rule.trigger.amount.toLocaleString() }}</span>
                    </div>
                </div>

                <!-- Arrow -->
                <div class="flex justify-center text-gray-300">
                    <i class="fa-solid fa-arrow-down"></i>
                </div>

                <!-- Result -->
                <div class="bg-blue-50 p-2 rounded border border-blue-100">
                    <div class="text-[10px] text-blue-400 font-bold uppercase mb-1">Result (推論結果)</div>
                    <div class="text-sm font-bold text-blue-800">{{ rule.result.debit }}</div>
                    <div class="text-[10px] text-blue-600 mt-1">{{ rule.description }}</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// [Internal_Import_Dependency] Line:56
import { ref } from 'vue';

// [Internal_State_Definition] Line:59
const rules = ref([
    {
        id: 1,
        priority: 1,
        isActive: true,
        trigger: { keyword: 'タクシー', amount: null },
        result: { debit: '旅費交通費' },
        description: '「タクシー」が含まれる場合は旅費交通費'
    },
    {
        id: 2,
        priority: 2,
        isActive: true,
        trigger: { keyword: 'Amazon', amount: 50000 },
        result: { debit: '工具器具備品' },
        description: 'Amazonかつ5万円以上は備品処理 (特例)'
    },
    {
        id: 3,
        priority: 1,
        isActive: true,
        trigger: { keyword: 'コーヒー', amount: null },
        result: { debit: '会議費' },
        description: 'コーヒーは会議費として推定'
    },
    {
        id: 4,
        priority: 5,
        isActive: false,
        trigger: { keyword: '振込手数料', amount: null },
        result: { debit: '支払手数料' },
        description: '休止中: 振込手数料の自動判定'
    }
]);

// [Internal_Logic_Flow] Line:94
const openRuleModal = () => {
    alert('ルール追加モーダルは未実装です (Placeholder)');
};
</script>

<style scoped>
/* [Style_Definition] Items 81-87 */
.animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
