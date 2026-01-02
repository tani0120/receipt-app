<template>
  <div v-if="visible" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
    <div class="bg-white rounded-lg shadow-xl w-[800px] max-h-[85vh] flex flex-col overflow-hidden animate-fade-in-up">

        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 shrink-0">
             <h3 class="font-bold text-slate-700 flex items-center gap-2">
                <i class="fa-solid fa-scroll text-emerald-500"></i>
                AI知識プロンプト編集
            </h3>
            <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 transition"><i class="fa-solid fa-times"></i></button>
        </div>

        <div class="p-6 flex-1 overflow-hidden flex flex-col">
             <label class="block text-xs font-bold text-gray-500 mb-2">現在のプロンプト定義</label>
             <textarea v-model="localContent" class="flex-1 w-full border border-gray-300 rounded-lg px-4 py-3 text-sm font-mono leading-relaxed focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none resize-none bg-slate-50"></textarea>
             <p class="text-xs text-slate-400 mt-2 text-right">※ここでの変更は次回のAI提案生成時に適用されます。</p>
        </div>

        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
            <button @click="$emit('close')" class="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded transition">キャンセル</button>
            <button @click="save" class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded shadow-md text-sm font-bold flex items-center gap-2 transition transform active:scale-95">
                <i class="fa-solid fa-check"></i> 保存する
            </button>
        </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  visible: boolean;
  initialContent: string;
}>();

const emit = defineEmits(['close', 'save']);

const localContent = ref('');

watch(() => props.visible, (newVal) => {
    if (newVal) {
        localContent.value = props.initialContent;
    }
});

const save = () => {
    emit('save', localContent.value);
    emit('close');
};
</script>

<style scoped>
.animate-fade-in-up {
    animation: fadeInUp 0.3s ease-out forwards;
}
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
