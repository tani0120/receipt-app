<template>
    <section class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 class="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <i class="fa-solid fa-database text-indigo-500"></i> 学習用CSV保管エリア
        </h2>

        <div class="flex flex-col lg:flex-row gap-8">
            <!-- Drop Zone -->
            <div class="flex-1 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-colors p-8 flex flex-col items-center justify-center text-center cursor-pointer group min-h-[200px]">
                <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                    <i class="fa-solid fa-cloud-arrow-up text-3xl text-indigo-400"></i>
                </div>
                <p class="text-sm font-bold text-slate-700 mb-1">ファイルをここにドラッグ＆ドロップ</p>
                <p class="text-xs text-slate-400 mb-4">または</p>
                <button class="bg-white border border-slate-300 text-slate-600 hover:text-indigo-600 hover:border-indigo-400 px-4 py-1.5 rounded text-xs font-bold transition">
                    ファイルを選択
                </button>
                <p class="text-[10px] text-slate-400 mt-4">
                    学習用に <span class="font-bold text-slate-500">仕訳CSV</span> <span class="font-bold text-slate-500">総勘定元帳CSV</span> <span class="font-bold text-slate-500">決算書一式PDF</span> を保存してください。
                </p>
            </div>

            <!-- File List -->
            <div class="flex-1 space-y-4">
                <!-- Group: General Ledger -->
                <div>
                    <h3 class="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                        <i class="fa-solid fa-list-ol"></i> 総勘定元帳CSV
                    </h3>
                    <div class="space-y-2">
                        <div v-for="i in 3" :key="'gl-'+i" class="flex items-center justify-between bg-white border border-slate-200 p-3 rounded text-sm hover:border-indigo-200 transition">
                            <a :href="'/mock/gl_csv_'+i+'.csv'" download class="flex items-center gap-3 hover:underline decoration-slate-400 underline-offset-4">
                                <i class="fa-solid fa-file-csv text-green-500 text-lg"></i>
                                <span class="font-mono text-slate-700">202{{i}}年12月決算_総勘定元帳CSV_202{{i}}0101-202{{i}}1231.csv</span>
                            </a>
                            <button @click="$emit('delete-file', { type: 'gl', id: i })" class="text-slate-400 hover:text-red-500 transition px-2">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Group: Journal -->
                <div>
                    <h3 class="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                        <i class="fa-solid fa-book"></i> 仕訳帳CSV
                    </h3>
                    <div class="space-y-2">
                        <div v-for="i in 3" :key="'j-'+i" class="flex items-center justify-between bg-white border border-slate-200 p-3 rounded text-sm hover:border-indigo-200 transition">
                            <a :href="'/mock/journal_csv_'+i+'.csv'" download class="flex items-center gap-3 hover:underline decoration-slate-400 underline-offset-4">
                                <i class="fa-solid fa-file-csv text-blue-500 text-lg"></i>
                                <span class="font-mono text-slate-700">202{{i}}年12月決算_仕訳帳CSV_202{{i}}0101-202{{i}}1231.csv</span>
                            </a>
                            <button @click="$emit('delete-file', { type: 'journal', id: i })" class="text-slate-400 hover:text-red-500 transition px-2">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                </div>

                    <!-- Group: PDF -->
                <div>
                    <h3 class="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                        <i class="fa-solid fa-file-pdf"></i> 決算書一式PDF
                    </h3>
                    <div class="space-y-2">
                        <div v-for="i in 3" :key="'pdf-'+i" class="flex items-center justify-between bg-white border border-slate-200 p-3 rounded text-sm hover:border-indigo-200 transition">
                            <a :href="'/mock/final_report_'+i+'.pdf'" download class="flex items-center gap-3 hover:underline decoration-slate-400 underline-offset-4">
                                <i class="fa-solid fa-file-pdf text-red-500 text-lg"></i>
                                <span class="font-mono text-slate-700">202{{i}}年12月決算_決算申告書.pdf</span>
                            </a>
                            <button @click="$emit('delete-file', { type: 'pdf', id: i })" class="text-slate-400 hover:text-red-500 transition px-2">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
// Phase A: No props needed yet as data is internal mock loop
// Phase C: will accept file lists
defineEmits(['delete-file']);
</script>
