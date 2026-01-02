<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
    <!-- Height Limited to 85vh, Fixed Width -->
    <div class="bg-white rounded-xl shadow-2xl w-[800px] max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">

      <!-- Header -->
      <div class="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
        <h3 class="font-bold text-xl text-slate-800 flex items-center gap-3">
          <div class="bg-blue-100 p-2 rounded-lg text-blue-600">
            <i class="fa-solid fa-pen-to-square"></i>
          </div>
          顧問先情報編集
        </h3>
        <button @click="close" class="text-slate-400 hover:text-slate-600 transition p-2 rounded-full hover:bg-slate-50">
          <i class="fa-solid fa-times text-lg"></i>
        </button>
      </div>

      <!-- Scrollable Content -->
      <div class="p-8 space-y-8 overflow-y-auto custom-scrollbar bg-slate-50/50">

        <!-- Section: Basic Info -->
        <section class="space-y-4">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">基本情報</h4>

          <div class="grid grid-cols-12 gap-6">
            <!-- Code -->
            <div class="col-span-3">
              <label class="block text-xs font-bold text-slate-500 mb-1.5">コード <span class="text-red-500">*</span></label>
              <input type="text" v-model="form.clientCode" class="w-full font-mono text-center bg-slate-100 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed" readonly>
            </div>

            <!-- Company Name -->
            <div class="col-span-9">
              <label class="block text-xs font-bold text-slate-500 mb-1.5">会社名 <span class="text-red-500">*</span></label>
              <input type="text" v-model="form.companyName" class="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" placeholder="株式会社サンプル">
            </div>

            <!-- Rep Name -->
            <div class="col-span-6">
              <label class="block text-xs font-bold text-slate-500 mb-1.5">代表者名</label>
              <input type="text" v-model="form.repName" class="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" placeholder="山田 太郎">
            </div>

            <!-- Staff -->
            <div class="col-span-6">
               <label class="block text-xs font-bold text-slate-500 mb-1.5">担当者名</label>
               <input type="text" v-model="form.staffName" class="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" placeholder="社内担当者">
            </div>
          </div>
        </section>

        <!-- Section: Accounting Settings -->
        <section class="space-y-4">
           <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">会計・税務設定</h4>

           <div class="grid grid-cols-2 gap-6">
              <!-- Accounting Software -->
              <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                 <label class="block text-xs font-bold text-slate-500 mb-2">会計ソフト</label>
                 <select v-model="form.accountingSoftware" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                     <option value="freee">freee</option>
                     <option value="弥生会計">弥生会計</option>
                     <option value="MFクラウド">MFクラウド</option>
                 </select>
              </div>

              <!-- Fiscal Month -->
              <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                 <label class="block text-xs font-bold text-slate-500 mb-2">決算月</label>
                 <select v-model="form.fiscalMonth" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                     <option v-for="n in 12" :key="n" :value="n">{{ n }}月決算</option>
                 </select>
              </div>

               <!-- Attributes Group -->
               <div class="col-span-2 grid grid-cols-3 gap-4">
                  <div>
                      <label class="block text-xs font-bold text-slate-500 mb-1.5">課税区分</label>
                      <select v-model="form.consumptionTaxMode" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                          <option value="general">原則課税</option>
                          <option value="simplified">簡易課税</option>
                          <option value="exempt">免税</option>
                      </select>
                  </div>
                   <div>
                      <label class="block text-xs font-bold text-slate-500 mb-1.5">計上基準</label>
                      <select v-model="form.taxMethod" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                          <option :value="1">税込経理</option>
                          <option :value="2">税抜経理</option>
                      </select>
                  </div>
                   <div>
                      <label class="block text-xs font-bold text-slate-500 mb-1.5">申告種類</label>
                      <select v-model="form.taxFilingType" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                          <option value="blue">青色申告</option>
                          <option value="white">白色申告</option>
                      </select>
                  </div>
               </div>
           </div>
        </section>

      </div>

      <!-- Footer -->
      <div class="px-8 py-5 bg-white border-t border-slate-100 flex justify-end gap-4 shrink-0">
        <button @click="close" class="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition">キャンセル</button>
        <button @click="save" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg shadow-lg hover:shadow-blue-500/30 text-sm font-bold flex items-center gap-2 transition transform active:scale-95">
          <i class="fa-solid fa-cloud-arrow-up"></i> 保存する
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, toRefs } from 'vue';
import type { ClientDetailUi } from '@/aaa/aaa_types/aaa_ui.type';

const props = defineProps<{
  isOpen: boolean;
  data: ClientDetailUi | null;
}>();

const emit = defineEmits(['close', 'save']);

const state = reactive({
  form: {} as ClientDetailUi
});

const { form } = toRefs(state);

// Initialize form on open
watch(() => props.isOpen, (newVal) => {
  if (newVal && props.data) {
    // Deep copy to avoid mutating prop directly
    state.form = JSON.parse(JSON.stringify(props.data));
  }
});

const close = () => {
  emit('close');
};

const save = () => {
  emit('save', state.form);
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

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>
