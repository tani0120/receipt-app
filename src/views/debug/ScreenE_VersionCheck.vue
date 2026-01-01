<template>
  <div class="h-full flex flex-col bg-white overflow-hidden animate-fade-in relative text-[#333] font-sans">
      <!-- DEBUG BANNER (ISOLATION INDICATOR) -->
      <div class="bg-stripes-indigo px-4 py-1 flex justify-between items-center border-b border-indigo-200 shadow-sm z-50">
          <div class="flex items-center gap-2">
              <span class="bg-indigo-600 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded tracking-wider shadow">Sandbox</span>
              <span class="text-[10px] font-bold text-indigo-900"><i class="fa-solid fa-flask"></i> Screen E UI Version Check (Isolated)</span>
          </div>
          <div class="flex gap-2 text-[9px] font-bold text-indigo-800">
              <button @click="switchMock('draft')" :class="['px-2 py-0.5 rounded', currentMockKey==='draft'?'bg-indigo-600 text-white':'bg-white hover:bg-indigo-50']">Draft</button>
              <button @click="switchMock('duplicate')" :class="['px-2 py-0.5 rounded', currentMockKey==='duplicate'?'bg-indigo-600 text-white':'bg-white hover:bg-indigo-50']">Duplicate</button>
              <button @click="switchMock('remand')" :class="['px-2 py-0.5 rounded', currentMockKey==='remand'?'bg-indigo-600 text-white':'bg-white hover:bg-indigo-50']">Remand</button>
              <button @click="switchMock('approve')" :class="['px-2 py-0.5 rounded', currentMockKey==='approve'?'bg-indigo-600 text-white':'bg-white hover:bg-indigo-50']">Approve</button>
          </div>
      </div>

      <!-- Header -->
      <div class="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 shadow-sm shrink-0 z-20 relative">
          <div class="flex items-center gap-4">
              <div class="bg-indigo-600 text-white w-8 h-8 rounded flex items-center justify-center font-bold text-xs shadow-md">
                  {{ currentClient.code }}
              </div>
              <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                      <span class="font-bold text-sm text-slate-800">{{ currentClient.name }}</span>
                      <span class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">2025/11/12</span>
                  </div>
                  <div class="flex items-center gap-2 text-[10px] text-gray-400">
                      <span><i class="fa-solid fa-user-circle mr-1"></i>担当: {{ currentClient.rep || '担当者' }}</span>
                      <span class="text-gray-300">|</span>
                      <span>{{ currentClient.settings.software }}</span>
                      <span>{{ currentClient.settings.taxMethod === 'inclusive' ? '税込' : '税抜' }}</span>
                  </div>
              </div>
          </div>

          <!-- Central Status Indicator -->
          <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" v-if="currentClient.action !== 'work'">
               <div :class="['px-6 py-1.5 rounded-full font-bold text-xs shadow-sm flex items-center gap-2 border',
                  currentClient.action === 'approve' ? 'bg-pink-50 text-pink-600 border-pink-200' : 'bg-orange-50 text-orange-600 border-orange-200']">
                  <i :class="['fa-solid', currentClient.action === 'approve' ? 'fa-gavel' : 'fa-reply']"></i>
                  {{ currentClient.action === 'approve' ? '最終承認モード' : '差戻し対応モード' }}
               </div>
          </div>

          <div class="flex items-center gap-3">
              <div class="text-right mr-2">
                   <div :class="['text-xs font-bold font-mono', 1 > 0 ? 'text-red-500' : 'text-green-500']">
                      未処理: 1件
                   </div>
                   <div class="text-[10px] text-gray-400">全 5 件中</div>
              </div>
              <div class="h-8 w-[1px] bg-gray-200 mx-1"></div>
              <button class="text-gray-500 hover:text-slate-700 font-bold text-xs flex flex-col items-center gap-0.5 px-2 transition group">
                  <i class="fa-solid fa-arrow-left group-hover:-translate-x-0.5 transition-transform"></i>
                  <span class="text-[9px]">戻る</span>
              </button>
              <button class="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-4 py-2 rounded shadow text-xs font-bold transition flex items-center gap-2 group">
                  次へスキップ <i class="fa-solid fa-forward group-hover:translate-x-0.5 transition-transform text-slate-400 group-hover:text-white"></i>
              </button>
          </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex overflow-hidden">

          <!-- Left: Editor & Forms -->
          <div class="w-[60%] flex flex-col bg-slate-50 border-r border-slate-200 relative z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
              <!-- Scrollable Form Area -->
              <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">

                  <!-- Alert / Message Area -->
                  <div class="mb-4 space-y-2">
                       <div v-if="currentTransaction.hasDuplicate" class="bg-yellow-50 border border-yellow-200 rounded p-2 flex items-start gap-3 shadow-sm animate-pulse-slow">
                          <i class="fa-solid fa-triangle-exclamation text-yellow-500 mt-0.5"></i>
                          <div>
                              <div class="text-xs font-bold text-yellow-700">重複の可能性があります</div>
                              <div class="text-[10px] text-yellow-600">類似する仕訳: 2024/10/24 21,450円 (試算表)</div>
                          </div>
                      </div>

                      <div v-if="currentTransaction.isExcluded" class="bg-gray-100 border border-gray-300 rounded p-2 flex items-center gap-3 shadow-inner">
                          <i class="fa-solid fa-ban text-gray-500"></i>
                          <div class="text-xs font-bold text-gray-600">この取引は「除外」としてマークされています</div>
                      </div>
                      <div v-if="currentTransaction.status === 'confirmed'" class="bg-blue-50 border border-blue-200 rounded p-2 flex items-center gap-3 shadow-inner">
                          <i class="fa-solid fa-check text-blue-500"></i>
                          <div class="text-xs font-bold text-blue-600">この取引は「確定済み」です</div>
                      </div>

                       <!-- AI Reason Box (Crucial for Verification) -->
                      <div v-if="currentTransaction.ai_reason" class="bg-indigo-50 border border-indigo-100 rounded p-3 relative group">
                          <div class="absolute -left-1 top-3 w-1 h-8 bg-indigo-400 rounded-r"></div>
                          <div class="flex justify-between items-start mb-1">
                              <span class="text-[10px] font-bold text-indigo-500 flex items-center gap-1"><i class="fa-solid fa-robot"></i> AI提案理由</span>
                          </div>
                          <p class="text-xs text-indigo-900 leading-relaxed">{{ currentTransaction.ai_reason }}</p>
                      </div>

                       <!-- Invoice Alert (Crucial for Verification) -->
                      <div v-if="currentTransaction.invoiceLog && !currentTransaction.invoiceLog.isValid"
                           class="bg-red-50 border border-red-200 p-2.5 rounded flex items-center gap-3 text-red-700 shadow-sm mt-2">
                          <i class="fa-solid fa-ban"></i>
                          <span class="text-xs font-bold leading-tight">インボイス登録番号が無効または確認できません ({{ currentTransaction.invoiceLog.registrationNumber }})</span>
                      </div>
                       <div v-if="currentTransaction.status === 'remanded'"
                           class="bg-orange-50 border border-orange-200 p-2.5 rounded flex items-center gap-3 text-orange-700 shadow-sm mt-2">
                          <i class="fa-solid fa-rotate-left"></i>
                          <span class="text-xs font-bold leading-tight">差戻し理由: {{ currentTransaction.errorMessage || '理由未記入' }}</span>
                      </div>
                  </div>

                  <!-- Form Card -->
                  <div class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-6">
                      <div class="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center px-4">
                          <h3 class="font-bold text-sm text-slate-600"><i class="fa-solid fa-pen-to-square mr-2 text-slate-400"></i>仕訳入力</h3>
                          <div class="text-[10px] text-gray-400">ショートカット: Ctrl+Enterで保存</div>
                      </div>
                      <div class="p-5">
                          <!-- Basic Info -->
                          <div class="grid grid-cols-12 gap-4 mb-5">
                              <div class="col-span-4">
                                  <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">取引日付</label>
                                  <input type="date" v-model="form.date" class="w-full bg-slate-50 border border-slate-300 rounded px-2 py-2 text-sm font-bold text-slate-700 shadow-sm focus:bg-white focus:border-blue-500 transition">
                              </div>
                              <div class="col-span-8">
                                  <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">摘要 (取引先/内容)</label>
                                  <div class="relative">
                                      <input type="text" v-model="form.summary" class="w-full bg-slate-50 border border-slate-300 rounded px-2 py-2 text-sm font-bold text-slate-700 shadow-sm focus:bg-white focus:border-blue-500 transition pr-8" placeholder="取引先名や内容を入力">
                                      <i class="fa-solid fa-pen absolute right-3 top-3 text-gray-300 text-xs"></i>
                                  </div>
                              </div>
                          </div>

                          <!-- Accounting Rows -->
                          <div class="flex gap-4 items-start">
                              <!-- Debit (Left) -->
                              <div class="flex-1 bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                                  <div class="flex justify-between items-center mb-2 px-1">
                                      <span class="text-[10px] font-bold text-blue-800">借方 (費用)</span>
                                      <button @click="addRow('debit')" class="text-blue-400 hover:text-blue-600"><i class="fa-solid fa-plus-circle"></i></button>
                                  </div>
                                  <div v-for="(row, idx) in form.debit" :key="'d'+idx" class="mb-2 last:mb-0 relative group">
                                      <div class="bg-white border border-blue-200 rounded p-2 shadow-sm relative z-10">
                                          <div class="flex gap-2 mb-2">
                                              <input type="text" v-model="row.acct" class="flex-1 border-b border-dashed border-gray-300 text-sm font-bold text-slate-700 focus:border-blue-500 outline-none pb-1" placeholder="勘定科目">
                                              <input type="text" v-model="row.sub" class="w-1/3 border-b border-dashed border-gray-300 text-xs text-slate-500 focus:border-blue-500 outline-none pb-1" placeholder="補助科目">
                                          </div>
                                          <div class="flex justify-between items-center">
                                              <select v-model="row.tax" class="text-[10px] bg-gray-100 rounded px-1 py-0.5 border-none text-gray-600 cursor-pointer hover:bg-gray-200">
                                                  <option value="tax_10">課対仕入10%</option>
                                                  <option value="tax_8">課対仕入8% (軽)</option>
                                                  <option value="tax_none">対象外</option>
                                              </select>
                                              <input type="text" v-model="row.amount" class="w-1/2 text-right font-mono font-bold text-slate-700 border-none outline-none bg-transparent" placeholder="0">
                                          </div>
                                      </div>
                                      <button @click="removeRow('debit', idx)" class="absolute -right-2 -top-2 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition shadow-lg z-20 pointer-events-auto cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
                                  </div>
                              </div>

                              <!-- Separator -->
                              <div class="text-gray-300 pt-10"><i class="fa-solid fa-arrow-right-long"></i></div>

                              <!-- Credit (Right) -->
                              <div class="flex-1 bg-green-50/50 rounded-lg p-3 border border-green-100">
                                  <div class="flex justify-between items-center mb-2 px-1">
                                      <span class="text-[10px] font-bold text-green-800">貸方 (支払)</span>
                                      <button @click="addRow('credit')" class="text-green-400 hover:text-green-600"><i class="fa-solid fa-plus-circle"></i></button>
                                  </div>
                                  <div v-for="(row, idx) in form.credit" :key="'c'+idx" class="mb-2 last:mb-0 relative group">
                                      <div class="bg-white border border-green-200 rounded p-2 shadow-sm relative z-10">
                                          <div class="flex gap-2 mb-2">
                                              <input type="text" v-model="row.acct" class="flex-1 border-b border-dashed border-gray-300 text-sm font-bold text-slate-700 focus:border-green-500 outline-none pb-1" placeholder="勘定科目">
                                              <input type="text" v-model="row.sub" class="w-1/3 border-b border-dashed border-gray-300 text-xs text-slate-500 focus:border-green-500 outline-none pb-1" placeholder="補助科目">
                                          </div>
                                          <div class="flex justify-between items-center">
                                              <select v-model="row.tax" class="text-[10px] bg-gray-100 rounded px-1 py-0.5 border-none text-gray-600 cursor-pointer hover:bg-gray-200">
                                                  <option value="tax_none">対象外</option>
                                                  <option value="tax_10">課対売上10%</option>
                                              </select>
                                              <input type="text" v-model="row.amount" class="w-1/2 text-right font-mono font-bold text-slate-700 border-none outline-none bg-transparent" placeholder="0">
                                          </div>
                                      </div>
                                      <button @click="removeRow('credit', idx)" class="absolute -right-2 -top-2 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition shadow-lg z-20 pointer-events-auto cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
                                  </div>
                              </div>
                          </div>

                          <!-- Balance Check -->
                          <div class="mt-4 flex justify-between items-center bg-slate-100 rounded p-2 px-3">
                              <div class="text-[10px] font-bold text-gray-500 uppercase">Total Amount</div>
                              <div class="flex items-center gap-4">
                                  <div v-if="!isBalanced" class="text-xs font-bold text-red-500 flex items-center animate-pulse">
                                      <i class="fa-solid fa-triangle-exclamation mr-1"></i> 貸借不一致 (差額: {{ balanceDiff }})
                                  </div>
                                  <div v-else class="text-xs font-bold text-green-600 flex items-center">
                                      <i class="fa-solid fa-check-circle mr-1"></i> 貸借一致
                                  </div>
                                  <div class="text-lg font-mono font-bold text-slate-800">¥ {{ totalAmount }}</div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              <!-- Action Bar (Footer) -->
              <div class="bg-white border-t border-gray-200 p-4 shrink-0 shadow-[0_-4px_6px_rgba(0,0,0,0.02)] z-30">
                  <div class="flex gap-3">
                      <!-- Mode: 1次仕訳入力 & 差戻し対応 (Default) -->
                      <template v-if="currentClient.action !== 'approve'">
                          <button class="flex-1 py-3 rounded-lg font-bold text-sm bg-white border-2 border-yellow-200 text-yellow-600 hover:bg-yellow-50 flex flex-col items-center justify-center">
                              <div class="flex items-center gap-2"><i class="fa-solid fa-circle-question text-lg"></i> <span>不明仕訳</span></div>
                          </button>

                          <button class="flex-1 py-3 rounded-lg font-bold text-sm bg-white border-2 border-gray-200 text-gray-500 hover:bg-gray-50 flex flex-col items-center justify-center">
                              <div class="flex items-center gap-2"><i class="fa-solid fa-ban text-lg"></i> <span>対象外</span></div>
                          </button>

                          <button :disabled="!isBalanced"
                              :class="['flex-[2] py-3 rounded-lg font-bold text-sm transition flex flex-col items-center justify-center border-2 h-14 relative shadow-md group', isBalanced ? 'bg-white border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed']">
                              <div class="flex items-center gap-2">
                                  <i class="fa-solid fa-paper-plane text-lg group-hover:scale-110 transition"></i>
                                  <span>これで確定する</span>
                              </div>
                          </button>
                      </template>

                      <!-- Mode: 最終承認 (Approve) -->
                      <template v-else>
                          <button class="flex-1 py-3 rounded-lg font-bold text-sm bg-white border-2 border-orange-200 text-orange-600 hover:bg-orange-50 flex flex-col items-center justify-center">
                              <div class="flex items-center gap-2"><i class="fa-solid fa-rotate-left text-lg"></i> <span>差戻し</span></div>
                          </button>

                          <button class="flex-1 py-3 rounded-lg font-bold text-sm bg-white border-2 border-red-200 text-red-500 hover:bg-red-50 flex flex-col items-center justify-center">
                              <div class="flex items-center gap-2"><i class="fa-solid fa-ban text-lg"></i> <span>除外</span></div>
                          </button>

                          <button :disabled="!isBalanced"
                              :class="['flex-[2] py-3 rounded-lg font-bold text-sm transition flex flex-col items-center justify-center border-2 h-14 relative shadow-md group', isBalanced ? 'bg-white border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed']">
                              <div class="flex items-center gap-2">
                                  <i class="fa-solid fa-file-csv text-lg group-hover:scale-110 transition"></i>
                                  <span>CSV出力へ回す</span>
                              </div>
                          </button>
                      </template>
                  </div>
              </div>
          </div>

          <!-- Right: Viewer Area -->
          <div class="w-[40%] bg-slate-800 flex flex-col relative overflow-hidden group">
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div class="text-white opacity-50 font-bold text-xl">Image Viewer Mock</div>
              </div>
          </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';

// --- ISOLATED TYPE DEFINITIONS (No dependencies) ---
interface MockJob {
  id: string;
  transactionDate: string;
  status: string;
  hasDuplicate: boolean;
  aiAnalysisRaw?: string;
  errorMessage?: string;
  invoiceLog?: { isValid: boolean, registrationNumber: string };
  lines: Array<{
      drAccount: string;
      drSubAccount?: string;
      drTaxClass: string;
      drAmount: number;
      description: string;
      crAccount: string;
      crSubAccount?: string;
      crTaxClass: string;
      crAmount: number;
  }>;
}

interface FormRow {
    acct: string;
    sub?: string;
    tax: string;
    amount: number;
}

// --- LOCAL MOCK DATA (Self-contained) ---
// This data allows us to verify UI logic without touching useAccountingSystem.ts
const MOCK_DB: Record<string, MockJob> = {
  'draft': {
      id: 'job_draft',
      transactionDate: '2024-12-01',
      status: 'ready_for_work',
      hasDuplicate: false,
      aiAnalysisRaw: '明細「PCモニター」より消耗品費と推論 (確度:92%)',
      lines: [{ drAccount: '消耗品費', drTaxClass: 'tax_10', drAmount: 11000, description: 'PCモニター', crAccount: '未払金', crTaxClass: 'tax_none', crAmount: 11000 }]
  },
  'duplicate': {
      id: 'job_dup',
      transactionDate: '2024-12-05',
      status: 'ready_for_work',
      hasDuplicate: true,
      aiAnalysisRaw: '重複警告テスト',
      lines: [{ drAccount: '消耗品費', drTaxClass: 'tax_10', drAmount: 5500, description: 'ケーブル', crAccount: '現金', crTaxClass: 'tax_none', crAmount: 5500 }]
  },
  'remand': {
      id: 'job_remand',
      transactionDate: '2024-12-02',
      status: 'remanded',
      hasDuplicate: false,
      errorMessage: '摘要が具体的ではありません。訪問先を追記してください。',
      lines: [{ drAccount: '旅費交通費', drTaxClass: 'tax_10', drAmount: 2200, description: 'タクシー代', crAccount: '現金', crTaxClass: 'tax_none', crAmount: 2200 }]
  },
  'approve': {
      id: 'job_approve',
      transactionDate: '2024-12-03',
      status: 'waiting_approval',
      hasDuplicate: false,
      invoiceLog: { isValid: false, registrationNumber: '登録なし' },
      lines: [{ drAccount: '接待交際費', drTaxClass: 'tax_10', drAmount: 33000, description: '会食', crAccount: '未払金', crTaxClass: 'tax_none', crAmount: 33000 }]
  }
};

const currentMockKey = ref('draft');
const selectedJob = computed(() => MOCK_DB[currentMockKey.value]);

const switchMock = (key: string) => {
  currentMockKey.value = key;
  if(selectedJob.value) loadJobToForm(selectedJob.value);
};

// --- Mapped Logic ---
const currentClient = computed(() => {
  let action = 'work';
  if (currentMockKey.value === 'remand') action = 'remand';
  if (currentMockKey.value === 'approve') action = 'approve';
  return {
      name: '株式会社 テスト商事 (Sandbox)',
      code: '9999',
      rep: 'テスト担当',
      action,
      settings: { software: 'MFクラウド', taxMethod: 'inclusive' }
  };
});

const currentTransaction = computed(() => {
  const j = selectedJob.value;
  if (!j) return {
    hasDuplicate: false, isExcluded: false, status: 'ready_for_work',
    ai_reason: '', invoiceLog: undefined, errorMessage: ''
  };
  return {
      hasDuplicate: j.hasDuplicate,
      isExcluded: false,
      status: j.status,
      ai_reason: j.aiAnalysisRaw,
      invoiceLog: j.invoiceLog,
      errorMessage: j.errorMessage
  };
});

// Form Data
const form = reactive({
    date: '',
    summary: '',
    debit: [] as FormRow[],
    credit: [] as FormRow[]
});

function loadJobToForm(job: MockJob) {
    if (!job) return;
    form.date = job.transactionDate;
    form.summary = job.lines[0]?.description || '';
    form.debit = job.lines.map(l => ({ acct: l.drAccount, tax: l.drTaxClass, amount: l.drAmount, sub: l.drSubAccount }));
    form.credit = job.lines.map(l => ({ acct: l.crAccount, tax: l.crTaxClass, amount: l.crAmount, sub: l.crSubAccount }));
}

// Balance Logic (Simplified)
const totalAmount = computed(() => form.debit.reduce((s, r) => s + (Number(r.amount)||0), 0).toLocaleString());
const isBalanced = computed(() => {
    const d = form.debit.reduce((s, r) => s + (Number(r.amount)||0), 0);
    const c = form.credit.reduce((s, r) => s + (Number(r.amount)||0), 0);
    return Math.abs(d - c) < 1;
});
const balanceDiff = computed(() => {
    const d = form.debit.reduce((s, r) => s + (Number(r.amount)||0), 0);
    const c = form.credit.reduce((s, r) => s + (Number(r.amount)||0), 0);
    return Math.abs(d - c);
});

const addRow = (side: 'debit'|'credit') => {
    form[side].push({ acct: '', tax: 'tax_10', amount: 0 });
};
const removeRow = (side: 'debit'|'credit', idx: number) => {
    form[side].splice(idx, 1);
};

onMounted(() => {
  if(selectedJob.value) loadJobToForm(selectedJob.value);
});
</script>

<style scoped>
.bg-stripes-indigo {
    background-color: #e0e7ff;
    background-image: linear-gradient(135deg, #c7d2fe 25%, transparent 25%, transparent 50%, #c7d2fe 50%, #c7d2fe 75%, transparent 75%, transparent);
    background-size: 20px 20px;
}
.animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .7; } }
</style>
