<template>
    <div class="space-y-6 animate-fade-in relative">
        <div class="flex items-center justify-between mb-2">
             <div>
                 <div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
                     <span class="cursor-pointer hover:text-blue-600" @click="$emit('back')"><i class="fa-solid fa-arrow-left"></i> 戻る</span>
                     <span>/</span>
                     <span>プロンプト編集</span>
                 </div>
                 <h2 class="text-xl font-bold text-slate-700 flex items-center gap-2">
                    <span class="bg-purple-100 text-purple-600 px-2 py-1 rounded text-sm font-mono">{{ promptId }}</span>
                    {{ promptName }}
                 </h2>
             </div>
             <button @click="showConfirmModal = true" class="bg-blue-600 text-white font-bold px-6 py-2 rounded shadow hover:bg-blue-700 transition flex items-center gap-2">
                 <i class="fa-solid fa-save"></i> 登録・編集
             </button>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <label class="block text-sm font-bold text-gray-700 mb-2">プロンプト定義</label>
            <textarea
                v-model="content"
                class="w-full h-[32rem] border border-gray-300 rounded p-4 font-mono text-sm leading-relaxed focus:border-blue-500 outline-none resize-none bg-gray-50"
                placeholder="ここにプロンプトを入力してください..."
            ></textarea>
        </div>

        <!-- Confirm Modal -->
        <div v-if="showConfirmModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in">
            <div class="bg-white rounded-lg shadow-xl p-6 w-96 text-center">
                <i class="fa-solid fa-circle-question text-4xl text-blue-500 mb-4"></i>
                <h3 class="font-bold text-gray-800 text-lg mb-2">保存・修正しますか？</h3>
                <p class="text-xs text-gray-500 mb-6">変更内容は即座にシステムに反映されます。</p>
                <div class="flex justify-center gap-4">
                    <button @click="showConfirmModal = false" class="bg-gray-100 text-gray-600 font-bold px-6 py-2.5 rounded hover:bg-gray-200 transition">いいえ</button>
                    <button @click="confirmSave" class="bg-blue-600 text-white font-bold px-6 py-2.5 rounded hover:bg-blue-700 transition shadow-lg">はい (保存)</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
    promptId: string;
    promptName: string;
    initialContent?: string;
}>();

const emit = defineEmits(['back', 'save']);

const content = ref(props.initialContent || '');
const showConfirmModal = ref(false);

const confirmSave = () => {
    emit('save', content.value);
    showConfirmModal.value = false;
};
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
