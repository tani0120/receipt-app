<script setup lang="ts">
import { ref } from 'vue';
import {
    AI_LOGIC_MAP_TREE,
    TAX_SCOPE_DEFINITIONS,
    SPECIFIC_RISK_RULES,
    SOFTWARE_TAX_MAPPINGS_TEXT,
    SOFTWARE_EXPORT_CSV_SCHEMAS
} from '@/aaa/aaa_composables/aaa_useAccountingSystem';

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

// Helper: Format Schema Object to Text
const formatSchema = (schemaArray: any[]) => {
    let text = "Index,項目名,内容\n";
    schemaArray.forEach((row: any) => {
        text += `${row.index},${row.name},${row.value}\n`;
    });
    return text;
};

// System Defaults for Injection
const injectDefault = (key: string) => {
    let textToInsert = "";
    switch(key) {
        case 'LOGIC_MAP': textToInsert = AI_LOGIC_MAP_TREE; break;
        case 'TAX_SCOPE': textToInsert = TAX_SCOPE_DEFINITIONS; break;
        case 'RISK_RULES': textToInsert = SPECIFIC_RISK_RULES; break;
        case 'YAYOI_MAP': textToInsert = SOFTWARE_TAX_MAPPINGS_TEXT.YAYOI; break;
        case 'MF_MAP': textToInsert = SOFTWARE_TAX_MAPPINGS_TEXT.MF; break;
        case 'FREEE_MAP': textToInsert = SOFTWARE_TAX_MAPPINGS_TEXT.FREEE; break;
        case 'YAYOI_CSV': textToInsert = formatSchema(SOFTWARE_EXPORT_CSV_SCHEMAS.YAYOI); break;
        case 'MF_CSV': textToInsert = formatSchema(SOFTWARE_EXPORT_CSV_SCHEMAS.MF); break;
        case 'FREEE_CSV': textToInsert = formatSchema(SOFTWARE_EXPORT_CSV_SCHEMAS.FREEE); break;
    }

    // Insert at cursor or append (simple append for now to be safe, or just set if empty)
    // To be user friendly, we append with a newline
    content.value += (content.value ? "\n\n" : "") + textToInsert;
};
</script>

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

        <div class="flex gap-6">
            <!-- Main Editor -->
            <div class="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <label class="block text-sm font-bold text-gray-700 mb-2">プロンプト定義</label>
                <textarea
                    v-model="content"
                    class="w-full h-[32rem] border border-gray-300 rounded p-4 font-mono text-sm leading-relaxed focus:border-blue-500 outline-none resize-none bg-gray-50"
                    placeholder="ここにプロンプトを入力してください..."
                ></textarea>
            </div>

            <!-- Defaults Sidebar -->
            <div class="w-64 flex flex-col gap-3">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 class="text-xs font-bold text-slate-500 mb-3 uppercase flex items-center gap-2">
                        <i class="fa-solid fa-book-bookmark"></i> System Defaults
                    </h3>
                    <div class="flex flex-col gap-2">
                        <button @click="injectDefault('LOGIC_MAP')" class="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2 rounded text-left transition flex items-center gap-2">
                            <i class="fa-solid fa-sitemap text-slate-400"></i> 論理地図 (Tree)
                        </button>
                        <button @click="injectDefault('TAX_SCOPE')" class="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2 rounded text-left transition flex items-center gap-2">
                            <i class="fa-solid fa-scale-balanced text-slate-400"></i> 非課税定義 (Scope)
                        </button>
                        <button @click="injectDefault('RISK_RULES')" class="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2 rounded text-left transition flex items-center gap-2">
                            <i class="fa-solid fa-triangle-exclamation text-slate-400"></i> 特定リスク (Rule B)
                        </button>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 class="text-xs font-bold text-slate-500 mb-3 uppercase flex items-center gap-2">
                        <i class="fa-solid fa-right-left"></i> Tax Mappings
                    </h3>
                    <div class="flex flex-col gap-2">
                        <button @click="injectDefault('YAYOI_MAP')" class="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2 rounded text-left transition">
                            🤖 弥生 (Yayoi)
                        </button>
                        <button @click="injectDefault('MF_MAP')" class="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2 rounded text-left transition">
                            🟠 MFクラウド
                        </button>
                        <button @click="injectDefault('FREEE_MAP')" class="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2 rounded text-left transition">
                            🐦 freee
                        </button>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                     <h3 class="text-xs font-bold text-slate-500 mb-3 uppercase flex items-center gap-2">
                        <i class="fa-solid fa-file-csv"></i> CSV Schemas
                    </h3>
                    <div class="flex flex-col gap-2">
                        <button @click="injectDefault('YAYOI_CSV')" class="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2 rounded text-left transition">
                            📄 弥生出力形式
                        </button>
                        <button @click="injectDefault('MF_CSV')" class="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2 rounded text-left transition">
                            📄 MF出力形式
                        </button>
                        <button @click="injectDefault('FREEE_CSV')" class="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2 rounded text-left transition">
                            📄 freee出力形式
                        </button>
                    </div>
                </div>
            </div>
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

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
