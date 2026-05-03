<template>
  <!-- 🔴 Phase 6 動作確認マーカー 2026-04-04 新型JournalEntry対応済み -->
  <div class="h-screen flex flex-col bg-slate-100 font-sans overflow-hidden">
    <!-- Top Nav -->
    <header class="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4 shrink-0 z-20">
      <div class="flex items-center gap-4">
        <button @click="$router.push('/journal-status')" class="text-slate-500 hover:text-slate-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <span class="font-bold text-slate-700">仕訳ワークベンチ (Mirror)</span>
        <span v-if="entry" class="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">{{ entry.clientCode }}</span>
      </div>
      <div>
         <!-- Status Indicator -->
         <span v-if="entry" class="text-sm font-bold px-3 py-1 rounded-full"
            :class="{
              'bg-green-100 text-green-700': uiMode === 'editable',
              'bg-red-100 text-red-700': uiMode === 'remanded',
              'bg-blue-50 text-blue-700': uiMode === 'readonly',
              'bg-gray-100 text-gray-700': uiMode === 'fallback'
            }">
             {{ entry.status }}
         </span>
      </div>
    </header>

    <!-- Main Split View -->
    <div class="flex-1 flex overflow-hidden" v-if="uiMode !== 'loading'">

      <!-- Left: Evidence (PDF/Image Viewer) -->
      <div class="w-1/2 bg-slate-800 relative flex items-center justify-center border-r border-slate-300">
        <template v-if="entry && entry.sourceFiles.length > 0">
            <!-- sourceFiles[0].driveFileId を使って表示（本番ではDrive URL を取得して渡す） -->
            <div class="text-slate-300 flex flex-col items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="font-mono text-xs opacity-70">{{ entry.sourceFiles[0]?.fileName ?? '証憑ファイル' }}</span>
                <!-- TODO Phase 6.3: Google Drive Viewer URLを組み立ててiframeで表示 -->
            </div>
        </template>
        <template v-else>
            <div class="text-slate-400 flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>証憑プレビューなし</span>
            </div>
        </template>
      </div>

      <!-- Right: Editor -->
      <div class="w-1/2 flex flex-col bg-white overflow-hidden">

        <!-- Editor Header Info -->
        <div v-if="entry" class="p-4 border-b border-slate-100 grid grid-cols-2 gap-4 shrink-0">
             <div>
                 <label class="block text-xs font-bold text-slate-500 mb-1">取引日</label>
                 <!-- date フィールドは YYYY-MM-DD文字列 -->
                 <input type="date" v-model="entry.date"
                        :disabled="uiMode === 'readonly'"
                        class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
             </div>
             <div>
                 <label class="block text-xs font-bold text-slate-500 mb-1">摘要</label>
                 <!-- description = 取引摘要（JournalEntry.description） -->
                 <input v-model="entry.description" type="text"
                        :disabled="uiMode === 'readonly'"
                        class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
             </div>
             <div>
                 <label class="block text-xs font-bold text-slate-500 mb-1">適格請求書</label>
                 <!-- tNumberは廃止。hasQualifiedInvoice（boolean）で代替 -->
                 <label class="flex items-center gap-2 text-sm text-slate-700 mt-1">
                     <input type="checkbox" v-model="entry.hasQualifiedInvoice"
                            :disabled="uiMode === 'readonly'"
                            class="rounded border-slate-300" />
                     適格請求書あり
                 </label>
             </div>
        </div>

        <!-- Journal Lines Table （新型: 1行=借方または貸方） -->
        <div class="flex-1 overflow-auto p-4">
             <table class="w-full min-w-[600px] border-collapse relative">
                 <thead class="sticky top-0 bg-white z-10 shadow-sm">
                     <tr class="text-xs text-slate-500 text-left border-b border-slate-200">
                         <th class="py-2 pl-2 w-8">#</th>
                         <th class="py-2 w-16">区分</th>
                         <th class="py-2 w-1/4">科目コード</th>
                         <th class="py-2 w-1/4">科目名</th>
                         <th class="py-2 w-28">借方 (Dr)</th>
                         <th class="py-2 w-28">貸方 (Cr)</th>
                         <th class="py-2">税コード</th>
                         <th class="py-2 w-8"></th>
                     </tr>
                 </thead>
                 <tbody v-if="entry" class="text-sm">
                     <tr v-for="(line, idx) in entry.lines" :key="line.lineId" class="border-b border-slate-100 group hover:bg-slate-50">
                         <td class="py-2 pl-2 text-slate-400">{{ idx + 1 }}</td>

                         <!-- 借方/貸方 区分（debit > 0 → Dr, credit > 0 → Cr） -->
                         <td class="py-2 pr-2">
                             <span :class="line.debit > 0 ? 'text-blue-600 font-bold' : 'text-red-500 font-bold'">
                                 {{ line.debit > 0 ? 'Dr' : 'Cr' }}
                             </span>
                         </td>

                         <!-- 科目コード -->
                         <td class="py-2 pr-2">
                             <input v-model="line.accountCode" placeholder="科目コード"
                                    :disabled="uiMode === 'readonly'"
                                    class="w-full border-b border-transparent focus:border-blue-500 bg-transparent outline-none py-1 font-mono text-xs" />
                         </td>

                         <!-- 科目名 -->
                         <td class="py-2 pr-2">
                             <input v-model="line.accountName" placeholder="科目名"
                                    :disabled="uiMode === 'readonly'"
                                    class="w-full border-b border-transparent focus:border-blue-500 bg-transparent outline-none py-1" />
                         </td>

                         <!-- 借方金額 -->
                         <td class="py-2 pr-2">
                             <input v-model.number="line.debit" type="number"
                                    :disabled="uiMode === 'readonly'"
                                    class="w-full text-right border-b border-transparent focus:border-blue-500 bg-transparent outline-none py-1 font-mono" />
                         </td>

                         <!-- 貸方金額 -->
                         <td class="py-2 pr-2">
                             <input v-model.number="line.credit" type="number"
                                    :disabled="uiMode === 'readonly'"
                                    class="w-full text-right border-b border-transparent focus:border-blue-500 bg-transparent outline-none py-1 font-mono" />
                         </td>

                         <!-- 税コード -->
                         <td class="py-2 pr-2">
                             <select v-model="line.taxCode"
                                     :disabled="uiMode === 'readonly'"
                                     class="w-full text-xs text-slate-700 border border-slate-300 bg-white outline-none cursor-pointer hover:bg-slate-50 focus:ring-1 focus:ring-blue-300 rounded shadow-sm py-1 px-1">
                                 <option value="" disabled>税コード</option>
                                 <optgroup label="仕入区分">
                                     <option v-for="opt in purchaseOptions"
                                             :key="opt.code"
                                             :value="opt.code"
                                             class="text-slate-700">
                                         {{ opt.code }} ({{ opt.label }})
                                     </option>
                                 </optgroup>
                                 <optgroup label="売上区分">
                                     <option v-for="opt in salesOptions"
                                             :key="opt.code"
                                             :value="opt.code"
                                             class="text-slate-700">
                                         {{ opt.code }} ({{ opt.label }})
                                     </option>
                                 </optgroup>
                             </select>
                         </td>

                         <!-- Actions -->
                         <td class="text-center">
                             <button @click="removeRow(idx)" :disabled="uiMode === 'readonly'" class="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                 ×
                             </button>
                         </td>
                     </tr>
                 </tbody>
             </table>

             <button @click="addRow" :disabled="uiMode === 'readonly'" class="mt-4 text-blue-600 text-sm hover:underline flex items-center gap-1">
                 + 行を追加
             </button>
        </div>

        <!-- Editor Footer -->
        <div class="bg-slate-50 border-t border-slate-200 p-4 shrink-0 z-10 space-y-4 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">

            <!-- Messages -->
            <div v-if="validation.errors.length > 0" class="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
                <div v-for="err in validation.errors" :key="err" class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {{ err }}
                </div>
            </div>
            <!-- warnings は validation.warnings ?? [] でoptional対処 -->
             <div v-if="(validation.warnings ?? []).length > 0" class="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-3 py-2 rounded">
                <div v-for="warn in (validation.warnings ?? [])" :key="warn" class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {{ warn }}
                </div>
            </div>

            <!-- Totals & Actions -->
            <div class="flex items-end justify-between">
                <div class="flex gap-6 text-sm">
                    <div>
                        <span class="text-slate-500 block text-xs mb-0.5">借方合計</span>
                        <span class="font-mono font-bold text-lg text-slate-700">{{ totalDebit.toLocaleString() }}</span>
                    </div>
                    <div>
                        <span class="text-slate-500 block text-xs mb-0.5">貸方合計</span>
                        <span class="font-mono font-bold text-lg text-slate-700">{{ totalCredit.toLocaleString() }}</span>
                    </div>
                    <div>
                        <span class="text-slate-500 block text-xs mb-0.5">差額</span>
                        <span class="font-mono font-bold text-lg" :class="validation.balanceDiff === 0 ? 'text-slate-300' : 'text-red-500'">
                            {{ validation.balanceDiff?.toLocaleString() || 0 }}
                        </span>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <button @click="handleSave" :disabled="isSaving"
                            class="px-4 py-2 text-slate-600 font-bold text-sm bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
                        一時保存
                    </button>
                    <button @click="handleSubmit" :disabled="!validation.isValid || isSaving"
                            class="px-6 py-2 bg-blue-600 text-white font-bold text-sm rounded shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">
                        <span v-if="isSaving" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        {{ primaryActionButtonLabel }}
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>

    <!-- Loading State -->
    <div v-if="uiMode === 'loading'" class="flex-1 flex items-center justify-center text-slate-400">
        <div class="flex flex-col items-center">
            <span class="animate-spin h-8 w-8 border-4 border-slate-200 border-t-blue-500 rounded-full mb-3"></span>
            読み込み中...
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
// [レガシー] useJournalEditor は Firebase依存のため削除済み
// TODO: Supabase移行後に再実装
// import { useJournalEditor } from '@/composables/useJournalEditor';
// TAX_OPTIONS の正しいimport元: @/shared/schema_dictionary（旧: useAccountingSystem に存在しない）
import { TAX_OPTIONS } from '@/shared/schema_dictionary';
import type { JournalUiMode } from '@/shared/journalUiMode';

// スタブ実装（レガシー画面の表示維持用）
const entry = ref(null as null | {
    clientCode: string; status: string; date: string; description: string;
    hasQualifiedInvoice: boolean; sourceFiles: { fileName: string }[];
    lines: { lineId: string; accountCode: string; accountName: string; debit: number; credit: number; taxCode: string }[];
})
const isSaving = ref(false)
const validation = ref({ errors: [] as string[], warnings: [] as string[], isValid: false, balanceDiff: 0 })
const addRow = () => {}
const removeRow = (_idx: number) => {}
const handleSave = () => {}
const handleSubmit = () => {}
const primaryActionButtonLabel = ref('確定（レガシー画面）')

// UI Mode: status駆動UIの基盤
const uiMode = computed<JournalUiMode>(() => {
  if (!entry.value) return 'loading';

  switch (entry.value.status) {
    case 'READY_FOR_WORK':
      return 'editable';
    case 'REMANDED':
      return 'remanded';
    case 'Submitted':
    case 'Approved':
      return 'readonly';
    default:
      return 'fallback';
  }
});

// 借方合計（新型: line.debit を集計）
const totalDebit = computed(() => {
  if (!entry.value) return 0;
  return entry.value.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
});

// 貸方合計（新型: line.credit を集計）
const totalCredit = computed(() => {
  if (!entry.value) return 0;
  return entry.value.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
});

// 税コードオプション（TAX_OPTIONS を仕入/売上でフィルタ）
// consumptionTaxMode は JournalEntry に存在しないため、全オプションを有効化
// TODO Phase 6.3: クライアント設定（免税/簡易）に基づく動的グレーアウトを実装
const purchaseOptions = computed(() =>
    TAX_OPTIONS.filter((opt: { code: string; label: string; type: string }) => opt.type === 'purchase')
);
const salesOptions = computed(() =>
    TAX_OPTIONS.filter((opt: { code: string; label: string; type: string }) => opt.type === 'sales')
);
</script>
