<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
    <div class="bg-white rounded-lg shadow-xl p-6 w-[400px] transform transition-all scale-100 animate-pop-in flex flex-col items-center">

      <!-- Icon -->
      <div class="text-green-500 text-5xl mb-4">
        <i class="fa-solid fa-circle-check"></i>
      </div>

      <!-- Title -->
      <h3 class="text-lg font-bold text-gray-800 mb-2">保存しました</h3>

      <!-- Message -->
      <p class="text-sm text-gray-500 mb-6 text-center">
        仕訳データの更新が完了しました。<br>
        一覧画面に戻ります。
      </p>

      <!-- Button -->
      <button
        @click="$emit('close')"
        class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow-md transition-colors w-full"
      >
        OK
      </button>

    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean
}>();

defineEmits(['close']);
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes popIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
.animate-pop-in {
  animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
