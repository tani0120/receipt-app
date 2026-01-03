<template>
  <div class="h-screen flex flex-col bg-slate-100 font-sans overflow-hidden">
    <!-- Top Nav -->
    <header class="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4 shrink-0 z-20">
      <div class="flex items-center gap-4">
        <button @click="$router.push('/aaa_journal-status')" class="text-slate-500 hover:text-slate-800 transition-colors">
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
            :class="entry.status === 'remanded' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'">
             {{ entry.status }}
         </span>
      </div>
    </header>

    <!-- Main Split View -->
    <div class="flex-1 flex overflow-hidden" v-if="entry">

      <!-- Left: Evidence (PDF/Image Viewer) -->
      <div class="w-1/2 bg-slate-800 relative flex items-center justify-center border-r border-slate-300">
        <template v-if="entry.evidenceUrl">
            <!-- Simple Iframe for PDF/Image Preview. In production, use a dedicated Viewer component. -->
            <iframe :src="entry.evidenceUrl" class="w-full h-full border-none bg-white"></iframe>
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
        <div class="p-4 border-b border-slate-100 grid grid-cols-2 gap-4 shrink-0">
             <div>
                 <label class="block text-xs font-bold text-slate-500 mb-1">取引日</label>
                 <!-- Simple Date Input binding to Date object might need formatting helper in v-model. Using ISO string for simple input type=date -->
                 <input type="date" :value="entry.transactionDate.toISOString().substr(0,10)"
                        @input="e => entry!.transactionDate = new Date((e.target as HTMLInputElement).value)"
                        class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
             </div>
             <div>
                 <label class="block text-xs font-bold text-slate-500 mb-1">取引先名</label>
                 <input v-model="entry.vendorName" type="text"
                        class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
             </div>
             <div>
                 <label class="block text-xs font-bold text-slate-500 mb-1">T番号</label>
                 <input v-model="entry.tNumber" type="text" placeholder="T0000000000000"
                        class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
             </div>
        </div>

        <!-- Journal Lines Table -->
        <div class="flex-1 overflow-auto p-4">
             <table class="w-full min-w-[600px] border-collapse relative">
                 <thead class="sticky top-0 bg-white z-10 shadow-sm">
                     <tr class="text-xs text-slate-500 text-left border-b border-slate-200">
                         <th class="py-2 pl-2 w-8">#</th>
                         <th class="py-2 w-1/4">借方 (Dr)</th>
                         <th class="py-2 w-24">金額</th>
                         <th class="py-2 w-1/4">貸方 (Cr)</th>
                         <th class="py-2 w-24">金額</th>
                         <th class="py-2">摘要</th>
                         <th class="py-2 w-8"></th>
                     </tr>
                 </thead>
                 <tbody class="text-sm">
                     <tr v-for="(line, idx) in entry.lines" :key="idx" class="border-b border-slate-100 group hover:bg-slate-50">
                         <td class="py-2 pl-2 text-slate-400">{{ idx + 1 }}</td>

                         <!-- Debit Side -->
                         <td class="py-2 pr-2">
                             <input v-model="line.drAccount" placeholder="科目" class="w-full border-b border-transparent focus:border-blue-500 bg-transparent outline-none py-1" />
                              <!-- Tax Select (Debit) -->
                             <select v-model="line.drTaxClass" class="w-full text-xs text-slate-700 border border-slate-300 bg-white outline-none mt-1 cursor-pointer hover:bg-slate-50 focus:ring-1 focus:ring-blue-300 rounded shadow-sm py-1 px-1">
                                 <option value="" disabled>税区分</option>
                                 <optgroup label="仕入区分">
                                     <option v-for="opt in TAX_OPTIONS.filter(o => o.type === 'purchase')"
                                             :key="opt.code"
                                             :value="opt.code"
                                             :disabled="isOptionDisabled(opt.code, 'purchase')"
                                             class="text-slate-700 disabled:text-slate-300 disabled:bg-slate-50">
                                         {{ opt.code }} ({{ opt.label }})
                                     </option>
                                 </optgroup>
                                 <optgroup label="売上区分 (例外)">
                                 </optgroup>
                             </select>
                         </td>
                         <td class="py-2 pr-2">
                             <input v-model.number="line.drAmount" type="number" class="w-full text-right border-b border-transparent focus:border-blue-500 bg-transparent outline-none py-1 font-mono" />
                         </td>

                         <!-- Credit Side -->
                         <td class="py-2 pr-2 border-l border-slate-100 pl-2">
                             <input v-model="line.crAccount" placeholder="科目" class="w-full border-b border-transparent focus:border-blue-500 bg-transparent outline-none py-1" />
                             <!-- Tax Select (Credit) -->
                             <select v-model="line.crTaxClass" class="w-full text-xs text-slate-500 border-none bg-transparent outline-none mt-1 cursor-pointer hover:bg-slate-50 focus:ring-1 focus:ring-blue-100 rounded">
                                 <option value="" disabled>税区分</option>
                                 <optgroup label="売上区分">
                                     <option v-for="opt in TAX_OPTIONS.filter(o => o.type === 'sales')"
                                             :key="opt.code"
                                             :value="opt.code"
                                             :disabled="isOptionDisabled(opt.code, 'sales')"
                                             class="text-slate-700 disabled:text-slate-300 disabled:bg-slate-50">
                                         {{ opt.code }} ({{ opt.label }})
                                     </option>
                                 </optgroup>
                             </select>
                         </td>
                         <td class="py-2 pr-2">
                             <input v-model.number="line.crAmount" type="number" class="w-full text-right border-b border-transparent focus:border-blue-500 bg-transparent outline-none py-1 font-mono" />
                         </td>

                         <!-- Description -->
                         <td class="py-2 pr-2 border-l border-slate-100 pl-2">
                             <input v-model="line.description" class="w-full border-b border-transparent focus:border-blue-500 bg-transparent outline-none py-1" />
                         </td>

                         <!-- Actions -->
                         <td class="text-center">
                             <button @click="removeRow(idx)" class="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                 ×
                             </button>
                         </td>
                     </tr>
                 </tbody>
             </table>

             <button @click="addRow" class="mt-4 text-blue-600 text-sm hover:underline flex items-center gap-1">
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
             <div v-if="validation.warnings.length > 0" class="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-3 py-2 rounded">
                <div v-for="warn in validation.warnings" :key="warn" class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {{ warn }}
                </div>
            </div>

            <!-- Totals & Actions -->
            <div class="flex items-end justify-between">
                <div class="flex gap-6 text-sm">
                    <div>
                        <span class="text-slate-500 block text-xs mb-0.5">借方合計</span>
                        <span class="font-mono font-bold text-lg text-slate-700">{{ entry.totalDebit?.toLocaleString() || 0 }}</span>
                    </div>
                    <div>
                        <span class="text-slate-500 block text-xs mb-0.5">貸方合計</span>
                        <span class="font-mono font-bold text-lg text-slate-700">{{ entry.totalCredit?.toLocaleString() || 0 }}</span>
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
    <div v-else class="flex-1 flex items-center justify-center text-slate-400">
        <div class="flex flex-col items-center">
            <span class="animate-spin h-8 w-8 border-4 border-slate-200 border-t-blue-500 rounded-full mb-3"></span>
            読み込み中...
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { aaa_useJournalEditor } from '@/aaa/aaa_composables/aaa_useJournalEditor';
import { TAX_OPTIONS } from '@/aaa/aaa_composables/aaa_useAccountingSystem';

const {
    entry,
    loading,
    isSaving,
    validation,
    addRow,
    removeRow,
    handleSave,
    handleSubmit,
    primaryActionButtonLabel
} = aaa_useJournalEditor();

// Helper: Dynamic Gray-out Logic
const isOptionDisabled = (optionCode: string, side: 'sales' | 'purchase') => {
    if (!entry.value) return false;
    const mode = entry.value.consumptionTaxMode || 'general';

    // 1. Exempt (免税): All Taxable/Export codes are disabled. Only None/Exempt allowed.
    if (mode === 'exempt') {
        const allowed = ['TAX_NONE', 'TAX_EXEMPT', 'TAX_SALES_NONE', 'TAX_SALES_NON_TAXABLE', 'TAX_PURCHASE_NONE', 'TAX_PURCHASE_FROM_EXEMPT'];
        return !allowed.includes(optionCode);
    }

    // 2. Simplified (簡易):
    if (mode === 'simplified') {
        if (side === 'purchase') {
            // Purchase: Taxable Purchase (10/8) is effectively useless/converted to None.
            const taxablePurchases = ['TAX_PURCHASE_10', 'TAX_PURCHASE_8_RED'];
            if (taxablePurchases.includes(optionCode)) return true;
        }
        // Sales: Allow all (Standard codes are converted to Simplified Class by system)
    }

    // 3. General (本則): All enabled.
    return false;
};
</script>
F o r c i n g   a   f i l e   t o u c h   t o   t r i g g e r   H M R  
 