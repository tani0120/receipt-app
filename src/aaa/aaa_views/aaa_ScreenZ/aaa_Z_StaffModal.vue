<template>
    <div v-if="visible" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
        <div class="bg-white rounded-lg shadow-xl w-96 overflow-hidden">
            <div class="bg-slate-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 class="font-bold text-slate-700">担当者登録・編集</h3>
                <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-times"></i></button>
            </div>

            <div class="p-6 space-y-4">
                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">ID</label>
                    <input type="text" value="S004 (Auto)" disabled class="w-full border border-gray-300 bg-gray-100 text-gray-400 rounded px-2 py-1.5 text-sm font-mono cursor-not-allowed">
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">名前</label>
                    <input type="text" v-model="form.name" class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 outline-none" placeholder="例: 山田 花子">
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">メールアドレス</label>
                    <input type="email" v-model="form.email" class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 outline-none" placeholder="example@sugu-suru.com">
                </div>
            </div>

            <div class="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between">
                <button class="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1" @click="confirmDelete">
                    <i class="fa-solid fa-trash-can"></i> 削除
                </button>
                <button class="bg-blue-600 text-white text-sm font-bold px-4 py-1.5 rounded hover:bg-blue-700 transition" @click="confirmRegister">
                    登録
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

defineProps<{ visible: boolean }>();
const emit = defineEmits(['close', 'save', 'delete']);

const form = reactive({
    name: '',
    email: ''
});

const confirmDelete = () => {
    if(confirm('削除しますか？')) {
        emit('delete');
        emit('close');
    }
};

const confirmRegister = () => {
    if(confirm('登録しますか？')) {
        emit('save', { ...form });
        emit('close');
    }
};
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.1s ease-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}
</style>
