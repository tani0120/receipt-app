<template>
  <div class="h-full flex flex-col bg-white overflow-hidden text-[#333] font-sans relative" tabindex="0" @keyup.left="goBack" @keyup.right="goNext" ref="containerRef">

    <!-- 1. Header Area (Ironclad) -->
    <header class="shrink-0 z-50 bg-white border-b border-gray-200 shadow-sm relative">
        <!-- Main Nav Bar -->
        <div class="h-12 flex items-center justify-between px-4">
             <div class="flex items-center gap-4 w-full">
                <!-- Client Info & Link -->
                <div class="text-xs font-bold flex items-center gap-1 shrink-0 text-gray-500">
                    <button @click="router.push('/journal-status')" class="hover:underline">全社仕訳 (リンク)</button>
                    <i class="fa-solid fa-chevron-right text-[10px]"></i>
                    <span>{{ client?.companyName || '読込中...' }} ({{ client?.clientCode }})</span>
                </div>

                <div class="h-4 w-px bg-gray-300 mx-1"></div>

                <!-- Navigation Buttons -->
                <div class="flex gap-2 shrink-0">
                    <button @click="goBack" class="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded transition shadow-sm border bg-white text-slate-700 hover:bg-slate-100 border-gray-300 active:scale-95">
                        <i class="fa-solid fa-arrow-left"></i> 一つ戻る
                    </button>
                    <button @click="goNext" class="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded transition bg-blue-600 text-white shadow-sm hover:bg-blue-700 border border-blue-600 active:scale-95">
                        次に進む <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>

                <!-- Spacer -->
                <div class="flex-1"></div>

                <!-- Right Side Controls -->
                <div class="relative ml-4 flex items-center gap-4">
                     <!-- Lock Warning (Simulation Toggle) -->
                     <button @click="toggleLock" :class="['text-[10px] font-bold px-2 py-1 rounded border', currentJob?.isLocked ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'text-gray-400 border-gray-200']">
                        <i class="fa-solid fa-lock"></i> ロック (検証)
                     </button>

                    <!-- History Toggle -->
                    <button @click.stop="showHistory = !showHistory" class="text-xs text-slate-600 font-bold hover:text-blue-600 flex items-center gap-1 transition-colors">
                        <i class="fa-solid fa-clock-rotate-left"></i> 処理履歴 ({{ historyCount }})
                    </button>
                    <!-- History Dropdown -->
                    <transition name="fade">
                        <div v-if="showHistory" class="absolute right-0 top-full mt-2 w-64 bg-white rounded shadow-xl border border-gray-200 p-2 z-50">
                            <div v-if="historyCount === 0" class="text-xs text-gray-400 p-2 text-center">履歴はありません</div>
                            <ul v-else class="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                                <li v-for="(h, i) in mockHistory" :key="i" class="text-xs p-2 hover:bg-slate-50 cursor-pointer rounded border-b border-gray-50 last:border-0">
                                    <div class="font-bold text-blue-600">{{ h.action }}</div>
                                    <div class="truncate text-gray-500">{{ h.date }} - {{ h.user }}</div>
                                </li>
                            </ul>
                        </div>
                    </transition>
                </div>
             </div>
        </div>

        <!-- Mode Indicator Bar (Full Width) -->
        <div class="w-full flex justify-end px-4 py-2 border-t border-gray-100 bg-slate-50 relative overflow-hidden">
             <!-- Lock Warning Banner (Conditional from JobUi) -->
             <div v-if="currentJob?.journalEditMode === 'locked'" class="absolute inset-0 bg-yellow-400 flex items-center justify-center z-10 animate-stripe">
                 <span class="text-yellow-900 font-bold text-xs flex items-center gap-2">
                     <i class="fa-solid fa-user-lock"></i> 👨‍💼 他のユーザーが現在この仕訳を編集中です。変更は保存されません。
                 </span>
             </div>

             <div v-if="currentJob?.journalEditMode === 'work'" class="bg-blue-600 text-white px-6 py-1.5 rounded text-sm font-bold shadow-md flex items-center gap-2 transition-all">
                <i class="fa-solid fa-pen-to-square"></i> 🟦 1次仕訳入力モード (未処理: {{ pendingCount }}件)
             </div>
             <div v-else-if="currentJob?.journalEditMode === 'remand'" class="bg-red-600 text-white px-6 py-1.5 rounded text-sm font-bold shadow-md flex items-center gap-2 animate-pulse transition-all">
                <i class="fa-solid fa-triangle-exclamation"></i> 🟥 ⚠ 差戻し対応モード (残数: {{ pendingCount }}件)
             </div>
             <div v-else-if="currentJob?.journalEditMode === 'approve'" class="bg-pink-600 text-white px-6 py-1.5 rounded text-sm font-bold shadow-md flex items-center gap-2 transition-all">
                <i class="fa-solid fa-stamp"></i> 🟪 最終承認決済モード (承認待ち: {{ pendingCount }}件)
             </div>
        </div>
    </header>

    <!-- 2. Main Content -->
    <main class="flex-1 flex overflow-hidden">
        <!-- Left Column: Form & Alerts -->
        <section class="w-[60%] flex flex-col bg-slate-50 border-r border-gray-200 relative z-10">
            <div class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">

                <!-- Alert Stack (Driven by JobUi.alerts) -->
                <div class="space-y-2">
                    <div v-for="(alert, idx) in currentJob?.alerts" :key="idx"
                         :class="['border-l-4 p-3 rounded shadow-sm flex items-start gap-3',
                                  alert.level === 'error' ? 'bg-red-50 border-red-500 border-red-200' :
                                  alert.level === 'warning' ? 'bg-yellow-50 border-yellow-500 border-yellow-200' : 'bg-blue-50 border-blue-500 border-blue-200']">
                        <div :class="['text-lg', alert.level === 'error' ? 'text-red-600' : alert.level === 'warning' ? 'text-yellow-600' : 'text-blue-600']">
                             <i :class="alert.level === 'error' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-info'"></i>
                        </div>
                        <div>
                            <h4 :class="['font-bold text-xs', alert.level === 'error' ? 'text-red-800' : 'text-slate-800']">{{ alert.title }}</h4>
                            <p :class="['text-[11px] font-bold', alert.level === 'error' ? 'text-red-700' : 'text-slate-700']">{{ alert.message }}</p>
                        </div>
                    </div>
                </div>

                <!-- 3. Main Form (Grid Layout) -->
                <div class="bg-white border border-slate-300 rounded-lg p-4 shadow-sm space-y-3">
                    <!-- Summary (Top) -->
                    <div>
                        <label class="block text-[10px] text-gray-500 font-bold mb-1">摘要 <span class="font-normal">(全行共通)</span></label>
                        <input type="text" v-model="selectedJobSummary" class="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-sm text-slate-800 focus:bg-white transition" :disabled="!currentJob?.canEdit">
                    </div>

                    <!-- Date & Totals Header -->
                    <div class="grid grid-cols-12 gap-3">
                        <div class="col-span-4">
                            <label class="block text-[10px] text-gray-500 font-bold mb-1">取引日付</label>
                            <input type="date" v-model="transactionDateStr" class="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-sm font-mono" :disabled="!currentJob?.canEdit">
                        </div>
                        <div class="col-span-4">
                            <label class="block text-[10px] text-gray-500 font-bold mb-1">合計金額 (税込)</label>
                            <input type="text" :value="totalAmount.toLocaleString()" disabled class="w-full bg-gray-100 border border-slate-300 rounded px-2 py-1.5 text-sm font-mono text-right text-gray-600">
                        </div>
                        <div class="col-span-4 flex items-end justify-end pb-1">
                            <div v-if="isBalanced" class="text-xs font-bold text-green-600 flex items-center bg-green-50 px-2 py-1 rounded border border-green-200">
                                <i class="fa-solid fa-check-circle mr-1"></i> 貸借一致
                            </div>
                            <div v-else class="text-xs font-bold text-red-600 flex items-center bg-red-50 px-2 py-1 rounded border border-red-200 animate-pulse">
                                <i class="fa-solid fa-scale-unbalanced mr-1"></i> 差額: {{ balanceDiff.toLocaleString() }}
                            </div>
                        </div>
                    </div>

                    <!-- Debit / Credit Split Area -->
                    <div class="flex gap-4 border-t border-slate-100 pt-3 items-stretch">
                        <!-- Debit Side -->
                        <div class="relative flex-1 flex flex-col">
                            <div class="text-xs font-bold text-blue-600 flex items-center mb-2"><i class="fa-solid fa-arrow-right-to-bracket mr-1"></i> 借方 (費用)</div>
                            <div v-for="(row, idx) in debitRows" :key="'dr-'+idx" class="mb-3 relative group bg-blue-50/30 p-2 rounded border border-blue-100 flex flex-col gap-2">
                                <button v-if="currentJob?.canEdit && debitRows.length > 1" @click="removeDebitRow(idx)" class="absolute -right-2 -top-2 bg-white rounded-full border border-gray-200 p-1 text-gray-400 hover:text-red-500 shadow-sm z-10 w-5 h-5 flex items-center justify-center text-[10px]"><i class="fa-solid fa-trash"></i></button>

                                <label class="block text-[10px] text-gray-500 mb-0.5">勘定科目</label>
                                <input type="text" v-model="row.drAccount" :disabled="!currentJob?.canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-sm font-bold text-slate-800 mb-2" placeholder="科目">

                                <label class="block text-[10px] text-gray-500 mb-0.5">補助科目</label>
                                <input type="text" v-model="row.drSub" :disabled="!currentJob?.canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-xs mb-2" placeholder="(指定なし)">

                                <label class="block text-[10px] text-gray-500 mb-0.5">税区分</label>
                                <select v-model="row.drTaxClass" :disabled="!currentJob?.canEdit" class="w-full border border-slate-300 rounded px-1 py-1 text-[10px] bg-white mb-2">
                                    <option v-for="opt in filteredDebitTaxOptions" :key="opt.code" :value="opt.code">
                                        {{ opt.label }}
                                    </option>
                                </select>

                                <label class="block text-[10px] text-gray-500 mb-0.5">金額</label>
                                <div class="relative">
                                    <input type="number" v-model.number="row.drAmount" :disabled="!currentJob?.canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-sm font-mono text-right bg-white">
                                    <div v-if="row.drTaxClass !== 'TAX_PURCHASE_NONE' && row.drTaxClass !== 'TAX_SALES_NONE'" class="text-[9px] text-gray-400 text-right mt-1">(内税 val)</div>
                                </div>
                            </div>
                            <button v-if="currentJob?.canEdit" @click="addDebitRow" class="text-[10px] text-blue-500 hover:text-blue-700 flex items-center font-bold mt-1"><i class="fa-solid fa-plus-circle mr-1"></i> 行を追加</button>
                        </div>

                        <!-- Credit Side -->
                        <div class="relative flex-1 flex flex-col">
                            <div class="text-xs font-bold text-green-600 flex items-center justify-end mb-2">貸方 (決済) <i class="fa-solid fa-arrow-right-from-bracket ml-1"></i></div>
                            <div v-for="(row, idx) in creditRows" :key="'cr-'+idx" class="mb-3 relative group bg-green-50/30 p-2 rounded border border-green-100 flex flex-col gap-2">
                                <button v-if="currentJob?.canEdit && creditRows.length > 1" @click="removeCreditRow(idx)" class="absolute -left-2 -top-2 bg-white rounded-full border border-gray-200 p-1 text-gray-400 hover:text-red-500 shadow-sm z-10 w-5 h-5 flex items-center justify-center text-[10px]"><i class="fa-solid fa-trash"></i></button>

                                <label class="block text-[10px] text-gray-500 mb-0.5 text-right">勘定科目</label>
                                <input type="text" v-model="row.crAccount" :disabled="!currentJob?.canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-sm font-bold text-slate-800 mb-2 text-right" placeholder="科目">

                                <label class="block text-[10px] text-gray-500 mb-0.5 text-right">補助科目</label>
                                <input type="text" v-model="row.crSub" :disabled="!currentJob?.canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-xs mb-2 text-right" placeholder="(指定なし)">

                                <label class="block text-[10px] text-gray-500 mb-0.5 text-right">税区分</label>
                                <select v-model="row.crTaxClass" :disabled="!currentJob?.canEdit" class="w-full border border-slate-300 rounded px-1 py-1 text-[10px] bg-white mb-2">
                                    <option v-for="opt in filteredCreditTaxOptions" :key="opt.code" :value="opt.code">
                                        {{ opt.label }}
                                    </option>
                                </select>

                                <label class="block text-[10px] text-gray-500 mb-0.5 text-right">金額</label>
                                <input type="number" v-model.number="row.crAmount" :disabled="!currentJob?.canEdit" class="w-full border border-slate-300 rounded px-2 py-1 text-sm font-mono text-right bg-white">
                            </div>
                            <button v-if="currentJob?.canEdit" @click="addCreditRow" class="text-[10px] text-green-500 hover:text-green-700 flex items-center font-bold justify-end w-full mt-1">行を追加 <i class="fa-solid fa-plus-circle ml-1"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- AI Analysis & History Panels -->
            <div class="grid grid-cols-2 gap-4 pb-10 px-4">
                <!-- History Panel (Blue) -->
                <div class="bg-white border border-blue-100 rounded-lg shadow-sm overflow-hidden">
                     <div class="bg-blue-50 px-3 py-2 border-b border-blue-100">
                         <h5 class="text-[10px] font-bold text-blue-700">過去の取引履歴</h5>
                     </div>
                     <div class="p-2 space-y-1">
                         <div v-for="i in 3" :key="i" class="text-[10px] text-gray-600 border-b border-gray-50 pb-1 last:border-0 cursor-pointer hover:bg-blue-50 transition p-1 rounded">
                             2024/11/{{10-i}}: <span class="font-bold">旅費交通費</span> / 現金 (¥1,200)
                         </div>
                     </div>
                </div>
                <!-- AI Analysis Panel (Purple) - Driven by JobUi.aiProposal -->
                <div class="bg-white border border-purple-100 rounded-lg shadow-sm overflow-hidden">
                     <div class="bg-purple-50 px-3 py-2 border-b border-purple-100 flex justify-between items-center">
                         <h5 class="text-[10px] font-bold text-purple-700 flex items-center gap-1"><i class="fa-solid fa-robot"></i> AI推論</h5>
                         <button v-if="currentJob?.canEdit && currentJob?.aiProposal?.hasProposal" @click="applyAIProposal" class="bg-purple-600 text-white text-[9px] px-2 py-0.5 rounded shadow hover:bg-purple-700 font-bold">採用する</button>
                     </div>
                     <div class="p-2">
                         <p class="text-[10px] text-gray-600 leading-relaxed">
                            {{ currentJob?.aiProposal?.reason || 'AI提案はありません。' }}
                         </p>
                         <div v-if="currentJob?.aiProposal?.hasProposal" class="mt-1 text-[9px] text-purple-600 font-bold">
                             {{ currentJob?.aiProposal?.confidenceLabel }}
                         </div>
                     </div>
                </div>
            </div>

            <!-- Sticky Footer (Driven by JobUi) -->
            <div class="bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 flex gap-3 h-20 items-stretch">
                <!-- 1. Remand / Unknown Button -->
                <button v-if="currentJob?.journalEditMode === 'approve'"
                        @click="toggleDecision('remand')"
                        :class="['flex-1 rounded-lg font-bold transition shadow-sm flex items-center justify-center text-lg border', 'bg-red-500 hover:bg-red-600 text-white border-red-600 opacity-90']">
                    <i class="fa-solid fa-rotate-left mr-2"></i> 差戻し
                </button>
                <button v-else
                        @click="toggleDecision('unknown')"
                        :class="['flex-1 rounded-lg font-bold transition shadow-sm flex items-center justify-center text-lg border', 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-yellow-500 opacity-90']">
                    <i class="fa-solid fa-circle-question mr-2"></i> 不明仕訳あり
                </button>

                <!-- 2. Exclude Button -->
                <button @click="toggleDecision('exclude')"
                        :class="['flex-1 rounded-lg font-bold transition shadow-sm flex items-center justify-center text-lg border', 'bg-red-600 hover:bg-red-700 text-white border-red-700 opacity-90']">
                    <i class="fa-solid fa-ban mr-2"></i> 仕訳から除外
                </button>

                <!-- 3. Confirm / CSV Button -->
                <button v-if="currentJob?.journalEditMode === 'approve'"
                        @click="toggleDecision('csv')"
                        :disabled="!isBalanced"
                        :class="['flex-1 rounded-lg font-bold transition shadow-sm flex items-center justify-center text-lg border', isBalanced ? 'bg-blue-600 hover:bg-blue-700 text-white opacity-90' : 'bg-gray-300 cursor-not-allowed border-gray-300']">
                    <i class="fa-solid fa-file-csv mr-2"></i> 仕訳CSV化
                </button>
                <button v-else
                        @click="toggleDecision('confirmed')"
                        :disabled="!isBalanced"
                        :class="['flex-1 rounded-lg font-bold transition shadow-sm flex items-center justify-center text-lg border', isBalanced ? 'bg-blue-600 hover:bg-blue-700 text-white opacity-90' : 'bg-gray-300 cursor-not-allowed border-gray-300']">
                    <i class="fa-solid fa-check-circle mr-2"></i> 仕訳確定済み
                </button>
            </div>
        </section>

        <!-- Right Column: Image Viewer (12/17 Features) -->
        <section class="w-[40%] bg-slate-800 relative z-20 flex flex-col">
             <!-- 5. Overlay Info Header -->
             <!-- 5. Overlay Info Header (12/17 Exact Match: 5 Items) -->
             <!-- 5. Overlay Info Header (12/17 Exact Match: 5 Items from Client Settings) -->
             <div class="absolute top-0 left-0 right-0 h-10 bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center gap-2 px-2 shadow-sm">
                 <span class="text-[11px] text-slate-800 font-bold bg-white/90 px-2 py-1 rounded shadow-sm border border-white">{{ client?.fiscalMonthLabel || '-' }}</span>
                 <span class="text-[11px] text-slate-800 font-bold bg-white/90 px-2 py-1 rounded shadow-sm border border-white">{{ client?.softwareLabel || '-' }}</span>
                 <span class="text-[11px] text-slate-800 font-bold bg-white/90 px-2 py-1 rounded shadow-sm border border-white">{{ client?.taxInfoLabel || '-' }}</span>
                 <!-- contact icon maybe? -->
             </div>

             <!-- Image Area -->
             <div class="flex-1 flex items-center justify-center overflow-hidden relative group">
                 <!-- Zoom Controls (Floating) -->
                 <div class="absolute left-4 top-20 bg-black/60 backdrop-blur rounded-lg flex flex-col gap-1 p-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button class="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded"><i class="fa-solid fa-plus"></i></button>
                     <button class="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded"><i class="fa-solid fa-minus"></i></button>
                     <button class="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded"><i class="fa-solid fa-rotate-right"></i></button>
                 </div>

                 <img v-if="selectedJob?.driveFileUrl" :src="selectedJob.driveFileUrl" class="max-w-full max-h-full object-contain shadow-2xl transition-transform duration-200" alt="Receipt">
                 <div v-else class="text-gray-500 flex flex-col items-center">
                     <i class="fa-regular fa-image text-5xl mb-2"></i>
                     <span class="text-xs">画像未選択</span>
                 </div>
             </div>

             <!-- Keyboard Shortcut Help -->
             <div class="absolute bottom-4 right-4 group">
                 <div class="w-8 h-8 bg-white/10 text-white rounded-full flex items-center justify-center cursor-help hover:bg-white/20">
                     <i class="fa-regular fa-keyboard"></i>
                 </div>
                 <!-- Tooltip -->
                 <div class="absolute bottom-full right-0 mb-2 w-48 bg-black/90 text-white text-[10px] p-3 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                     <div class="font-bold border-b border-gray-600 pb-1 mb-1">ショートカット一覧</div>
                     <div class="flex justify-between"><span>Enter</span> <span class="text-gray-400">確定/次へ</span></div>
                     <div class="flex justify-between"><span>Ctrl+Enter</span> <span class="text-gray-400">上書き保存</span></div>
                     <div class="flex justify-between"><span>Esc</span> <span class="text-gray-400">戻る</span></div>
                 </div>
             </div>
        </section>

        <!-- ================= MODALS (Ver.10.17) ================= -->

        <!-- 1. Completion Popup (Done) -->
        <transition name="fade">
            <div v-if="showCompletionPopup" class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
                <div class="bg-white rounded-lg shadow-2xl p-8 text-center animate-fade-in max-w-sm w-full relative">
                    <div class="text-5xl mb-4">🎉</div>
                    <h3 class="text-xl font-bold text-slate-800 mb-2">全ての確認が完了しました</h3>
                    <p class="text-gray-500 mb-6">未承認件数: <span class="font-bold text-slate-800">0件</span></p>
                    <div class="flex gap-3">
                        <button @click="showCompletionPopup = false; goBack()" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded font-bold hover:bg-gray-50">戻る</button>
                        <button @click="openBatchModal" class="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 shadow-md">最終確認へ進む</button>
                    </div>
                </div>
            </div>
        </transition>

        <!-- 2. Revert Confirm Modal -->
        <transition name="fade">
            <div v-if="showRevertConfirmModal" class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
                <div class="bg-white rounded-lg shadow-xl p-6 text-center animate-fade-in max-w-xs w-full">
                    <h3 class="text-md font-bold text-slate-800 mb-2">ステータス解除の確認</h3>
                    <p class="text-xs text-gray-500 mb-4">この仕訳のステータスを解除して、未処理に戻しますか？</p>
                    <div class="flex gap-2">
                        <button @click="showRevertConfirmModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded text-xs font-bold hover:bg-gray-50">いいえ</button>
                        <button @click="confirmRevert" class="flex-1 bg-red-600 text-white py-2 rounded text-xs font-bold hover:bg-red-700 shadow-sm">はい（解除）</button>
                    </div>
                </div>
            </div>
        </transition>

        <!-- 3. Batch/Final Confirmation Modal -->
        <transition name="fade">
            <div v-if="showBatchModal" class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                <div class="bg-white rounded-lg w-full max-w-4xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                    <div class="bg-slate-800 text-white p-4 font-bold flex justify-between items-center shrink-0">
                        <span class="text-lg"><i class="fa-solid fa-layer-group mr-2"></i>処理を実行しますか？</span>
                        <button @click="showBatchModal = false" class="text-gray-400 hover:text-white"><i class="fa-solid fa-xmark text-xl"></i></button>
                    </div>
                    <div class="p-6 overflow-y-auto bg-slate-50 flex-1">
                        <p class="text-sm text-gray-600 mb-4 font-bold">以下の内容で確定し、各フォルダへ移動・ファイル出力を行います。</p>

                        <!-- Confirmed Section -->
                        <div class="mb-6">
                            <h4 class="font-bold text-blue-700 mb-2 flex items-center"><i class="fa-solid fa-file-csv mr-2"></i>{{ pageMode === 'approve' ? '【仕訳CSV化】' : '【仕訳確定済み】' }} {{ approvalQueue.filter(i => i.decision === 'csv' || i.decision === 'confirmed').length }}件</h4>
                            <div class="h-48 overflow-y-auto border rounded bg-white">
                                <table class="w-full text-left text-xs">
                                    <thead class="bg-gray-100 sticky top-0 font-bold text-gray-500">
                                        <tr><th class="p-2 w-8 text-center"><i class="fa-solid fa-check"></i></th><th class="p-2">日付</th><th class="p-2 text-right">金額</th><th class="p-2">借方</th><th class="p-2">貸方</th><th class="p-2">摘要</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(item, idx) in approvalQueue.filter(i => i.decision === 'csv' || i.decision === 'confirmed')" :key="idx" class="border-t border-gray-100 hover:bg-blue-50">
                                            <td class="p-2 text-center"><input type="checkbox" v-model="item.selected" class="cursor-pointer"></td>
                                            <td class="p-2 font-mono">{{ item.date }}</td>
                                            <td class="p-2 text-right font-mono">{{ item.amount }}</td>
                                            <td class="p-2 font-bold text-blue-600">{{ item.debit }}</td>
                                            <td class="p-2">{{ item.credit }}</td>
                                            <td class="p-2 truncate max-w-[150px]">{{ item.summary }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Remand/Unknown Section -->
                        <div class="mb-6">
                            <h4 class="font-bold text-yellow-700 mb-2 flex items-center"><i class="fa-solid fa-rotate-left mr-2"></i>{{ pageMode === 'approve' ? '【差戻し】' : '【不明仕訳あり】' }} {{ approvalQueue.filter(i => i.decision === 'remand' || i.decision === 'unknown').length }}件</h4>
                            <div class="h-32 overflow-y-auto border rounded bg-yellow-50/50">
                                <table class="w-full text-left text-xs">
                                    <thead class="bg-yellow-100/80 sticky top-0 font-bold text-yellow-800">
                                        <tr><th class="p-2 w-8 text-center"><i class="fa-solid fa-check"></i></th><th class="p-2">状態</th><th class="p-2">日付</th><th class="p-2 text-right">金額</th><th class="p-2">摘要</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(item, idx) in approvalQueue.filter(i => i.decision === 'remand' || i.decision === 'unknown')" :key="idx" class="border-t border-yellow-200">
                                            <td class="p-2 text-center"><input type="checkbox" v-model="item.selected" class="cursor-pointer"></td>
                                            <td class="p-2 font-bold text-yellow-700">{{ item.decision }}</td>
                                            <td class="p-2 font-mono">{{ item.date }}</td>
                                            <td class="p-2 text-right font-mono">{{ item.amount }}</td>
                                            <td class="p-2 truncate max-w-[150px]">{{ item.summary }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Excluded Section -->
                        <div class="mb-6">
                            <h4 class="font-bold text-red-700 mb-2 flex items-center"><i class="fa-solid fa-ban mr-2"></i>【仕訳から除外】 {{ approvalQueue.filter(i => i.decision === 'exclude').length }}件</h4>
                            <div class="h-32 overflow-y-auto border rounded bg-red-50/50">
                                <table class="w-full text-left text-xs">
                                     <thead class="bg-red-100/80 sticky top-0 font-bold text-red-800">
                                        <tr><th class="p-2 w-8 text-center"><i class="fa-solid fa-check"></i></th><th class="p-2">日付</th><th class="p-2 text-right">金額</th><th class="p-2">摘要</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(item, idx) in approvalQueue.filter(i => i.decision === 'exclude')" :key="idx" class="border-t border-red-200">
                                            <td class="p-2 text-center"><input type="checkbox" v-model="item.selected" class="cursor-pointer"></td>
                                            <td class="p-2 font-mono">{{ item.date }}</td>
                                            <td class="p-2 text-right font-mono">{{ item.amount }}</td>
                                            <td class="p-2 truncate max-w-[150px]">{{ item.summary }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white border-t border-slate-200 p-4 flex justify-between shrink-0">
                        <div class="flex gap-2">
                            <button @click="showBatchModal = false" class="px-6 py-3 rounded-lg font-bold text-gray-500 hover:bg-gray-100 transition">キャンセル</button>
                            <button @click="revertItems" class="px-4 py-3 rounded-lg font-bold text-red-600 border border-red-200 hover:bg-red-50 transition flex items-center"><i class="fa-solid fa-rotate-left mr-2"></i> チェックした項目を未承認に戻す</button>
                        </div>
                        <button @click="executeBatch" class="px-8 py-3 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg transition flex items-center"><i class="fa-solid fa-check-double mr-2"></i> 確定して実行</button>
                    </div>
                </div>
            </div>
        </transition>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { aaa_useAccountingSystem, type JobUi, type JournalLineUi, type ClientUi } from '@/composables/useAccountingSystem';
import { TAX_OPTIONS } from '@/shared/schema_dictionary';

const route = useRoute();
const router = useRouter();
const containerRef = ref<HTMLElement|null>(null);

const { jobs, getClientByCode } = aaa_useAccountingSystem();

// -- State --
const selectedJob = ref<JobUi | null>(null);
const currentJob = computed(() => selectedJob.value); // Alias for Template

const currentIndex = ref(0);
const client = ref<ClientUi | null>(null);
const showHistory = ref(false);

const filteredDebitTaxOptions = computed(() => {
    return TAX_OPTIONS.filter(opt => opt.type === 'purchase' || opt.code === 'TAX_SALES_NONE');
});
const filteredCreditTaxOptions = computed(() => {
    return TAX_OPTIONS.filter(opt => opt.type === 'sales' || opt.code === 'TAX_PURCHASE_NONE');
});

// Modals & Queue Logic
const showCompletionPopup = ref(false);
const showRevertConfirmModal = ref(false);
const showBatchModal = ref(false);
const pendingRevertId = ref<string | null>(null);
const lastAction = ref<{id: string, decision: string} | null>(null);

// Determine Mode from Route
const pageMode = computed(() => (route.query.mode as string) || 'work');

interface QueueItem {
    id: string;
    decision: string;
    date: string;
    amount: number;
    debit: string;
    credit: string;
    summary: string;
    selected: boolean;
}
const approvalQueue = ref<QueueItem[]>([]);

// Mock History
const mockHistory = [
    { action: '1次入力完了', date: '2024/11/15 14:30', user: '山田 太郎' },
    { action: 'OCR解析', date: '2024/11/15 14:29', user: 'System' },
    { action: 'アップロード', date: '2024/11/15 14:28', user: '鈴木 花子' }
];

// -- Computed --
const pendingCount = computed(() => Math.max(0, jobs.value.length - approvalQueue.value.length));
const historyCount = computed(() => mockHistory.length);

const transactionDateStr = computed({
    get: () => selectedJob.value?.transactionDate?.replace(/\//g, '-') || new Date().toISOString().split('T')[0],
    set: (v: string) => {
        if (selectedJob.value) {
            // JobUi.transactionDate is string
            (selectedJob.value as any).transactionDate = v;
        }
    }
});

// UI Form Helper Interface (Flat Structure for N:M UI)
interface EditableJournalLine {
    lineNo: number;
    drAccount: string;
    drSubAccount: string;
    drSub: string;
    drAmount: number;
    drTaxClass: string;
    drTaxAmount: number;
    crAccount: string;
    crSubAccount: string;
    crSub: string;
    crAmount: number;
    crTaxClass: string;
    crTaxAmount: number;
    description: string;
    departmentCode: string;
    note: string;
    invoiceIssuer: string;
    taxRate: number;
    isReducedRate: boolean;
    isAutoMaster: boolean;
    isTenThousandYen: boolean;
    isSocialExpense: boolean;
    isTaxDiff: boolean;
}

// Form Rows
const debitRows = ref<EditableJournalLine[]>([]);
const creditRows = ref<EditableJournalLine[]>([]);

const totalAmount = computed(() => debitRows.value.reduce((sum, r) => sum + (Number(r.drAmount) || 0), 0));
const creditTotal = computed(() => creditRows.value.reduce((sum, r) => sum + (Number(r.crAmount) || 0), 0));

const isBalanced = computed(() => Math.abs(totalAmount.value - creditTotal.value) < 1 && totalAmount.value > 0);
const balanceDiff = computed(() => totalAmount.value - creditTotal.value);


// -- Lifecycle --
onMounted(async () => {
    containerRef.value?.focus();
    const routeJobId = route.params.jobId as string;
    if (routeJobId) {
        const idx = jobs.value.findIndex(j => j.id === routeJobId);
        if (idx !== -1) selectJob(idx);
        else if (jobs.value.length > 0) selectJob(0);
    } else if (jobs.value.length > 0) {
        selectJob(0);
    }
});

watch(selectedJob, (newJob) => {
    if (newJob?.clientCode) {
        const c = getClientByCode(newJob.clientCode);
        client.value = c || null;
    }
});

// -- Methods --

function selectJob(index: number) {
    if (index >= 0 && index < jobs.value.length) {
        currentIndex.value = index;
        selectedJob.value = jobs.value[index];

        // Reset Rows
        const job = selectedJob.value;
        const rawLines = job?.lines && job.lines.length > 0 ? job.lines : [];

        // Helper to create valid EditableJournalLine from JournalLineUi or Empty
        const mapToEditable = (l?: JournalLineUi): EditableJournalLine => {
            if (!l) {
                // Empty Default
                return {
                    lineNo: 1,
                    drAccount: '', drSubAccount: '', drSub: '', drAmount: 0, drTaxClass: 'TAX_PURCHASE_10', drTaxAmount: 0,
                    crAccount: '', crSubAccount: '', crSub: '', crAmount: 0, crTaxClass: 'TAX_PURCHASE_NONE', crTaxAmount: 0,
                    description: '', departmentCode: '', note: '', invoiceIssuer: 'unknown',
                    taxRate: 10, isReducedRate: false, isAutoMaster: false, isTenThousandYen: false, isSocialExpense: false, isTaxDiff: false
                };
            }
            // Map Nested to Flat
            return {
                lineNo: l.lineNo,
                drAccount: l.debit.account,
                drSubAccount: l.debit.subAccount,
                drSub: l.debit.subAccount,
                drAmount: l.debit.amount,
                drTaxClass: l.debit.taxCode || 'TAX_PURCHASE_10',
                drTaxAmount: 0,
                crAccount: l.credit.account,
                crSubAccount: l.credit.subAccount,
                crSub: l.credit.subAccount,
                crAmount: l.credit.amount,
                crTaxClass: l.credit.taxCode || 'TAX_PURCHASE_NONE',
                crTaxAmount: 0,
                description: l.description,
                departmentCode: '', note: '', invoiceIssuer: 'unknown',
                taxRate: 10, isReducedRate: false, isAutoMaster: false, isTenThousandYen: false, isSocialExpense: false, isTaxDiff: false
            };
        };

        if (rawLines.length === 0) {
            const defItem = mapToEditable();
            debitRows.value = [defItem];
            creditRows.value = [{ ...defItem }];
        } else {
            debitRows.value = rawLines.map(l => mapToEditable(l));
            creditRows.value = rawLines.map(l => mapToEditable(l)); // Duplicate for N:M start point
        }

        // Sync Summary
        selectedJobSummary.value = rawLines[0]?.description || '';
    }
}

const selectedJobSummary = ref('');

function addDebitRow() {
    debitRows.value.push({
        lineNo: debitRows.value.length + 1,
        drAccount: '', drSubAccount: '', drSub: '', drAmount: 0, drTaxClass: 'TAX_PURCHASE_10', drTaxAmount: 0,
        crAccount: '', crSubAccount: '', crSub: '', crAmount: 0, crTaxClass: 'TAX_PURCHASE_NONE', crTaxAmount: 0,
        description: selectedJobSummary.value,
        departmentCode: '', note: '', invoiceIssuer: 'unknown',
        taxRate: 10, isReducedRate: false, isAutoMaster: false, isTenThousandYen: false, isSocialExpense: false, isTaxDiff: false
    });
}
function removeDebitRow(idx: number) { debitRows.value.splice(idx, 1); }

function addCreditRow() {
    creditRows.value.push({
        lineNo: creditRows.value.length + 1,
        drAccount: '', drSubAccount: '', drSub: '', drAmount: 0, drTaxClass: 'TAX_PURCHASE_10', drTaxAmount: 0,
        crAccount: '', crSubAccount: '', crSub: '', crAmount: 0, crTaxClass: 'TAX_PURCHASE_NONE', crTaxAmount: 0,
        description: selectedJobSummary.value,
        departmentCode: '', note: '', invoiceIssuer: 'unknown',
        taxRate: 10, isReducedRate: false, isAutoMaster: false, isTenThousandYen: false, isSocialExpense: false, isTaxDiff: false
    });
}
function removeCreditRow(idx: number) { creditRows.value.splice(idx, 1); }

function goNext() {
    if (currentIndex.value < jobs.value.length - 1) {
        selectJob(currentIndex.value + 1);
    } else {
        selectJob(0);
        if (pendingCount.value === 0) showCompletionPopup.value = true;
    }
}
function goBack() {
    if (currentIndex.value > 0) {
        selectJob(currentIndex.value - 1);
    } else {
        selectJob(jobs.value.length - 1);
    }
}

// Actions
function toggleLock() {
    if (selectedJob.value) {
        (selectedJob.value as any).isLocked = !selectedJob.value.isLocked;
        if (selectedJob.value.isLocked) (selectedJob.value as any).journalEditMode = 'locked';
        else (selectedJob.value as any).journalEditMode = 'work';
    }
}

function applyAIProposal() {
    const job = selectedJob.value;
    if (!job?.aiProposal?.hasProposal) return;
    const p = job.aiProposal;

    // Helper to create valid EditableJournalLine from Partial
    const createEmptyRow = (lineNo: number): EditableJournalLine => ({
        lineNo,
        drAccount: '', drSubAccount: '', drSub: '', drAmount: 0, drTaxClass: 'TAX_PURCHASE_10', drTaxAmount: 0,
        crAccount: '', crSubAccount: '', crSub: '', crAmount: 0, crTaxClass: 'TAX_PURCHASE_NONE', crTaxAmount: 0,
        description: p.summary || '',
        departmentCode: '', note: '', invoiceIssuer: 'unknown',
        taxRate: 10, isReducedRate: false, isAutoMaster: false, isTenThousandYen: false, isSocialExpense: false, isTaxDiff: false
    });

    // 1. Populate Debit Rows
    const newDebitRows: EditableJournalLine[] = [];
    if (p.debits && p.debits.length > 0) {
        p.debits.forEach((d, i) => {
            const row = createEmptyRow(i + 1);
            row.drAccount = d.account;
            row.drSubAccount = d.subAccount;
            row.drSub = d.subAccount;
            row.drAmount = d.amount || 0;
            row.drAmount = d.amount || 0;
            // Map generic tax rate to UI specific string if needed
            row.drTaxClass = d.taxRate === 0 ? 'TAX_PURCHASE_NONE' : (d.taxRate === 8 ? 'TAX_PURCHASE_8_RED' : 'TAX_PURCHASE_10');
            newDebitRows.push(row);
        });
    } else {
        // Fallback or empty
        newDebitRows.push(createEmptyRow(1));
    }

    // 2. Populate Credit Rows
    const newCreditRows: EditableJournalLine[] = [];
    if (p.credits && p.credits.length > 0) {
        p.credits.forEach((c, i) => {
            const row = createEmptyRow(i + 1);
            row.crAccount = c.account;
            row.crSubAccount = c.subAccount;
            row.crSub = c.subAccount;
            row.crAmount = c.amount || 0;
            row.crTaxClass = c.taxRate === 0 ? 'TAX_PURCHASE_NONE' : (c.taxRate === 8 ? 'TAX_PURCHASE_8_RED' : 'TAX_PURCHASE_10');
            newCreditRows.push(row);
        });
    } else {
        newCreditRows.push(createEmptyRow(1));
    }

    debitRows.value = newDebitRows;
    creditRows.value = newCreditRows;

    selectedJobSummary.value = p.summary || '';
}

// Queue / Decision Logic

function toggleDecision(decision: string) {
    if (!selectedJob.value) return;
    const txId = selectedJob.value.id;
    const existingIdx = approvalQueue.value.findIndex(q => q.id === txId);

    if (existingIdx !== -1) {
         const item = approvalQueue.value[existingIdx];
         if (item && item.decision === decision) {
             pendingRevertId.value = txId;
             showRevertConfirmModal.value = true;
         } else if (item) {
             (approvalQueue.value[ existingIdx ] as any).decision = decision; // safe access
             lastAction.value = { id: txId, decision };
             goNext();
         }
    } else {
        addToQueue(decision);
    }
}

function addToQueue(decision: string) {
    if (!selectedJob.value) return;
    const txId = selectedJob.value.id;

    const record: QueueItem = {
        id: txId,
        decision: decision,
        date: transactionDateStr.value || '',
        amount: totalAmount.value || 0,
        debit: debitRows.value[0]?.drAccount || '-',
        credit: creditRows.value[0]?.crAccount || '-',
        summary: selectedJobSummary.value || '',
        selected: false
    };

    approvalQueue.value.push(record);
    lastAction.value = { id: txId, decision };

    if (approvalQueue.value.length >= jobs.value.length) {
        showCompletionPopup.value = true;
    } else {
        goNext();
    }
}

function confirmRevert() {
    if (pendingRevertId.value) {
        approvalQueue.value = approvalQueue.value.filter(q => q.id !== pendingRevertId.value);
        showRevertConfirmModal.value = false;
        pendingRevertId.value = null;
    }
}

function openBatchModal() {
    showCompletionPopup.value = false;
    showBatchModal.value = true;
}

function revertItems() {
    const kept = approvalQueue.value.filter(item => !item.selected);
    const removedCount = approvalQueue.value.length - kept.length;
    if (removedCount === 0) {
        alert('戻す項目を選択してください');
        return;
    }
    approvalQueue.value = kept;
    showBatchModal.value = false;
    selectJob(0);
}

function executeBatch() {
    showBatchModal.value = false;
    alert('全件の処理が完了しました。フォルダへ移動しました。');
    approvalQueue.value = [];
    router.push(`/journal-status?client=${currentJob.value?.clientCode || '1001'}`);
}

</script>

<style scoped>
/* 12/17 Baseline Custom Animations */
@keyframes stripe {
    0% { background-position: 0 0; }
    100% { background-position: 50px 50px; }
}
.animate-stripe {
    background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);
    background-size: 50px 50px;
    animation: stripe 1s linear infinite;
}
.animate-bounce-short {
    animation: bounce 0.5s infinite;
}
@keyframes bounce {
    0%, 100% { transform: translateY(-2%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
    50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
}
/* Scrollbar Styling from 12/17 */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a0aec0; }

.animate-fade-in {
    animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
