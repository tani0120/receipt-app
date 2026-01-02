<template>
  <div v-if="visible" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
    <div class="bg-white rounded-lg shadow-xl w-[400px] overflow-hidden animate-scale-in">

        <div class="p-6 text-center">
            <div class="mb-4">
                <i v-if="type === 'approve'" class="fa-solid fa-circle-check text-4xl text-blue-500"></i>
                <i v-else class="fa-solid fa-circle-xmark text-4xl text-red-500"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-800 mb-2">確定しますか？</h3>
            <p class="text-sm text-slate-500 mb-6">
                {{ type === 'approve' ? 'このAI提案を承認し、ルールとして保存します。' : 'このAI提案を却下します。\nよろしいですか？' }}
            </p>

            <div class="flex justify-center gap-3">
                <button @click="$emit('cancel')" class="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded transition">いいえ</button>
                <button @click="$emit('confirm')"
                    :class="type === 'approve' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'"
                    class="text-white px-6 py-2 rounded text-sm font-bold shadow-md transition transform active:scale-95">
                    はい
                </button>
            </div>
        </div>

    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
  type: 'approve' | 'reject';
}>();

defineEmits(['confirm', 'cancel']);
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
