<template>
  <div v-if="visible" class="modal-mask">
    <!-- Height Limited to 75vh, Fixed Width -->
    <div class="bg-white rounded-lg shadow-xl w-[600px] max-h-[75vh] flex flex-col overflow-hidden animate-fade-in-up">

        <!-- Header (Fixed) -->
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 shrink-0">
            <h3 class="font-bold text-slate-700 flex items-center gap-2">
                <i class="fa-solid fa-building text-blue-500"></i>
                {{ mode === 'new' ? '新規顧問先登録' : '顧問先情報編集' }}
            </h3>
            <button @click="close" class="text-gray-400 hover:text-gray-600 transition"><i class="fa-solid fa-times"></i></button>
        </div>

        <!-- Scrollable Content -->
        <div class="p-6 space-y-4 overflow-y-auto custom-scrollbar">
            <!-- Form Fields -->
            <div class="grid grid-cols-2 gap-4">
                <!-- Status Field -->
                <div class="col-span-2 bg-blue-50/50 p-2 rounded border border-blue-100 flex items-center gap-4">
                    <label class="text-xs font-bold text-gray-500">設定状況</label>
                    <div class="flex items-center gap-4">
                        <label class="flex items-center gap-1 cursor-pointer">
                            <input type="radio" v-model="form.isActive" :value="true" class="text-blue-600 focus:ring-blue-500">
                            <span class="text-sm font-bold text-gray-700">稼働中</span>
                        </label>
                        <label class="flex items-center gap-1 cursor-pointer">
                            <input type="radio" v-model="form.isActive" :value="false" class="text-red-600 focus:ring-red-500">
                            <span class="text-sm font-bold text-gray-700 bg-red-100 text-red-600 px-1 rounded">停止中</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">JOB ID (自動採番)</label>
                    <input type="text" v-model="form.jobId" class="w-full bg-slate-100 border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 cursor-not-allowed" readonly>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">コード (3文字)</label>
                    <input type="text"
                           :value="form.code"
                           @input="handleCodeInput"
                           maxlength="3"
                           class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none uppercase font-mono"
                           placeholder="ABC">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">会社名</label>
                    <input type="text" v-model="form.name" class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="株式会社サンプル">
                    <p v-if="errors.name" class="text-[10px] text-red-500 mt-1">{{ errors.name }}</p>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">代表者名</label>
                    <input type="text" v-model="form.rep" class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none" placeholder="山田 太郎">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">担当者名 (自社担当)</label>
                    <input type="text" v-model="form.staffName" class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none" placeholder="担当者名">
                </div>
                <div>
                     <label class="block text-xs font-bold text-gray-500 mb-1">連絡先 (Chatwork / Email)</label>
                     <div class="flex gap-2">
                         <select v-model="form.contact.type" class="border border-gray-300 rounded px-2 py-2 text-sm bg-gray-50 focus:border-blue-500 outline-none w-28 shrink-0">
                             <option value="chatwork">Chatwork</option>
                             <option value="email">Email</option>
                             <option value="none">なし</option>
                         </select>
                         <input type="text" v-model="form.contact.value" class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none" placeholder="URL または Email">
                     </div>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
               <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">法人/個人</label>
                    <select v-model="form.type" class="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                        <option value="corp">法人</option>
                        <option value="individual">個人</option>
                    </select>
               </div>
               <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">決算月</label>
                    <select v-model="form.fiscalMonth" class="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                        <option v-for="n in 12" :key="n" :value="n">{{ n }}月</option>
                    </select>
               </div>
               <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">設立日</label>
                    <input type="date" v-model="form.establishmentDate" class="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
               </div>
            </div>

             <div class="border-t border-gray-100 pt-4 mt-2">
                <div class="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">会計設定</div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1">利用ソフト</label>
                        <select v-model="form.settings.software" class="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                            <option value="弥生会計">弥生会計</option>
                            <option value="freee">freee</option>
                            <option value="MFクラウド">MFクラウド</option>
                        </select>
                    </div>
                    <div>
                         <label class="block text-xs font-bold text-gray-500 mb-1">課税区分</label>
                         <select v-model="form.settings.taxMethod" class="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                             <option value="inclusive">税込経理</option>
                             <option value="exclusive">税抜経理</option>
                         </select>
                    </div>
                    <div>
                         <label class="block text-xs font-bold text-gray-500 mb-1">計上基準</label>
                         <select v-model="form.settings.calcMethod" class="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                             <option value="発生主義">発生主義</option>
                             <option value="期中現金主義">期中現金主義</option>
                             <option value="現金主義">現金主義</option>
                         </select>
                    </div>
                    <div>
                         <label class="block text-xs font-bold text-gray-500 mb-1">申告種類</label>
                         <select v-model="form.settings.taxType" class="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                             <option value="青色">青色申告</option>
                             <option value="白色">白色申告</option>
                         </select>
                    </div>
                </div>
            </div>

        </div>

        <!-- Footer (Fixed) -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
            <button @click="close" class="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded transition">キャンセル</button>
            <button @click="save" :disabled="!isFormValid" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow-md text-sm font-bold flex items-center gap-2 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                <i class="fa-solid fa-check"></i> {{ mode === 'new' ? '登録する' : '更新する' }}
            </button>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, toRefs, computed } from 'vue';

const props = defineProps<{
  visible: boolean;
  mode: 'new' | 'edit';
  initialData?: any;
}>();

const emit = defineEmits(['close', 'save']);

// Default empty form
const defaultForm = {
    jobId: '',
    code: '',
    name: '',
    type: 'corp',
    rep: '',
    contact: {
        type: 'chatwork', // Default to Chatwork
        value: ''
    },
    isActive: true, // Default to Active
    fiscalMonth: 3,
    establishmentDate: '',
    settings: {
        software: '弥生会計',
        taxMethod: 'inclusive',
        calcMethod: '発生主義',
        taxType: '青色'
    },
    driveLinks: {
        storage: '',
        journalOutput: '',
        journalExclusion: '',
        pastJournals: ''
    }
};

const state = reactive({
    form: JSON.parse(JSON.stringify(defaultForm)),
    errors: {
        name: ''
    }
});

const { form, errors } = toRefs(state);

watch(() => props.visible, (newVal) => {
    if (newVal) {
        state.errors.name = '';
        if (props.mode === 'new') {
             // Reset form and generate ID
             Object.assign(state.form, JSON.parse(JSON.stringify(defaultForm)));
             state.form.jobId = (Math.floor(Math.random() * 9000) + 1000).toString(); // Simple Random Code
        } else if (props.initialData) {
            // Load initial data (Deep Copy and Map)
            const d = props.initialData;

            // Basic Fields
            state.form.code = d.clientCode || '';
            state.form.name = d.companyName || '';
            state.form.rep = d.repName || '';
            state.form.staffName = d.staffName || ''; // Mapped
            state.form.type = d.type || 'corp'; // Mapped
            state.form.fiscalMonth = d.fiscalMonth || 3;
            state.form.isActive = d.isActive !== undefined ? d.isActive : true;
            state.form.establishmentDate = ''; // Not in UI, leave empty or need to fetch?
            state.form.type = 'corp'; // Not in UI, default to corp

            // Contact
            state.form.contact = {
                type: d.contact?.type || 'none',
                value: d.contact?.value || ''
            };

            // Settings Mapping
            state.form.settings.software = d.accountingSoftware || 'freee';
            state.form.settings.taxMethod = d.taxMethod || 'inclusive';
            state.form.settings.calcMethod = d.calculationMethodLabel || '発生主義';
            state.form.settings.taxType = (d.taxFilingType === 'white') ? '白色' : '青色';

            // Links
            if (d.driveLinks) {
                state.form.driveLinks = JSON.parse(JSON.stringify(d.driveLinks));
            }
        }
    }
});

const handleCodeInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const val = target.value.toUpperCase().replace(/[^A-Z]/g, '');
    state.form.code = val.slice(0, 3);
    target.value = state.form.code; // Force update input view
};

const isFormValid = computed(() => {
    return !!state.form.name && state.form.name.trim() !== '';
});

const close = () => {
    emit('close');
};

const save = () => {
    if (!state.form.name) {
        state.errors.name = '会社名は必須です';
        return;
    }
    emit('save', state.form);
    close();
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
/* Custom Scrollbar for Table Body - duplicated from parent/global but good for safety */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
.modal-mask {
    position: fixed;
    z-index: 9998;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    transition: opacity 0.3s ease;
}
</style>
