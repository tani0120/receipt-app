<template>
  <div class="h-full flex flex-col bg-white overflow-hidden animate-fade-in relative text-[#333] font-sans">
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
                   <div :class="['text-xs font-bold font-mono', remainingApprovalCount > 0 ? 'text-red-500' : 'text-green-500']">
                      未処理: {{ remainingApprovalCount }}件
                   </div>
                   <div class="text-[10px] text-gray-400">全 {{ jobs.length }} 件中</div>
              </div>
              <div class="h-8 w-[1px] bg-gray-200 mx-1"></div>
              <button @click="screen='B'" class="text-gray-500 hover:text-slate-700 font-bold text-xs flex flex-col items-center gap-0.5 px-2 transition group">
                  <i class="fa-solid fa-arrow-left group-hover:-translate-x-0.5 transition-transform"></i>
                  <span class="text-[9px]">戻る</span>
              </button>
              <button @click="goNext" class="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-4 py-2 rounded shadow text-xs font-bold transition flex items-center gap-2 group">
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

                      <div v-if="currentTransaction.ai_reason" class="bg-indigo-50 border border-indigo-100 rounded p-3 relative group">
                          <div class="absolute -left-1 top-3 w-1 h-8 bg-indigo-400 rounded-r"></div>
                          <div class="flex justify-between items-start mb-1">
                              <span class="text-[10px] font-bold text-indigo-500 flex items-center gap-1"><i class="fa-solid fa-robot"></i> AI提案理由</span>
                          </div>
                          <p class="text-xs text-indigo-900 leading-relaxed">{{ currentTransaction.ai_reason }}</p>
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

                  <!-- Assistant Log -->
                  <div class="border-t border-gray-200 pt-4">
                      <div class="text-[10px] font-bold text-gray-400 mb-2 flex justify-between">
                          <span>アクティビティログ</span>
                          <span class="text-blue-500 cursor-pointer hover:underline">履歴をすべて表示</span>
                      </div>
                      <div class="space-y-2">
                          <div class="flex gap-2 text-[10px]">
                              <div class="text-gray-400 whitespace-nowrap">14:24</div>
                              <div class="text-gray-600"><span class="font-bold">AI Assistant</span> が仕訳案を作成しました。（確度: 92%）</div>
                          </div>
                          <div v-if="currentTransaction.mode === 'history'" class="flex gap-2 text-[10px]">
                              <div class="text-gray-400 whitespace-nowrap">10/24</div>
                              <div class="text-gray-600"><span class="font-bold text-blue-600">鈴木一郎</span> が前回の類似仕訳を確定しました。</div>
                          </div>
                      </div>
                  </div>
              </div>

              <!-- Action Bar (Footer) -->
              <div class="bg-white border-t border-gray-200 p-4 shrink-0 shadow-[0_-4px_6px_rgba(0,0,0,0.02)] z-30">
                  <div class="flex gap-3">
                      <!-- Mode: 1次仕訳入力 & 差戻し対応 (Default) -->
                      <template v-if="currentClient.action !== 'approve'">
                          <button @click="toggleDecision('unknown')"
                              :class="['flex-1 py-3 rounded-lg font-bold text-sm transition flex flex-col items-center justify-center border-2 h-14 relative', currentDecision==='unknown' ? 'bg-yellow-500 text-white border-yellow-500 shadow-inner' : 'bg-white border-yellow-200 text-yellow-600 hover:bg-yellow-50 hover:border-yellow-300']">
                              <div class="flex items-center gap-2"><i class="fa-solid fa-circle-question text-lg"></i> <span>不明仕訳</span></div>
                              <div v-if="currentDecision==='unknown'" class="absolute -top-2 -right-2 bg-white text-yellow-500 rounded-full w-5 h-5 flex items-center justify-center shadow border border-yellow-200"><i class="fa-solid fa-check text-xs"></i></div>
                          </button>

                          <button @click="toggleDecision('exclude')"
                              :class="['flex-1 py-3 rounded-lg font-bold text-sm transition flex flex-col items-center justify-center border-2 h-14 relative', currentDecision==='exclude' ? 'bg-gray-600 text-white border-gray-600 shadow-inner' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300']">
                              <div class="flex items-center gap-2"><i class="fa-solid fa-ban text-lg"></i> <span>対象外</span></div>
                              <div v-if="currentDecision==='exclude'" class="absolute -top-2 -right-2 bg-white text-gray-600 rounded-full w-5 h-5 flex items-center justify-center shadow border border-gray-200"><i class="fa-solid fa-check text-xs"></i></div>
                          </button>

                          <button @click="toggleDecision('confirmed')" :disabled="!isBalanced"
                              :class="['flex-[2] py-3 rounded-lg font-bold text-sm transition flex flex-col items-center justify-center border-2 h-14 relative shadow-md group', isBalanced ? (currentDecision==='confirmed' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white') : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed']">
                              <div class="flex items-center gap-2">
                                  <i :class="['fa-solid text-lg group-hover:scale-110 transition', currentDecision==='confirmed'?'fa-check':'fa-paper-plane']"></i>
                                  <span>{{ currentDecision==='confirmed' ? '確定済み' : 'これで確定する' }}</span>
                              </div>
                              <div v-if="currentDecision==='confirmed'" class="absolute -top-2 -right-2 bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center shadow border border-blue-200"><i class="fa-solid fa-check text-xs"></i></div>
                          </button>
                      </template>

                      <!-- Mode: 最終承認 (Approve) -->
                      <template v-else>
                          <button @click="toggleDecision('remand')"
                              :class="['flex-1 py-3 rounded-lg font-bold text-sm transition flex flex-col items-center justify-center border-2 h-14 relative', currentDecision==='remand' ? 'bg-orange-500 text-white border-orange-500 shadow-inner' : 'bg-white border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300']">
                              <div class="flex items-center gap-2"><i class="fa-solid fa-rotate-left text-lg"></i> <span>差戻し</span></div>
                              <div v-if="currentDecision==='remand'" class="absolute -top-2 -right-2 bg-white text-orange-500 rounded-full w-5 h-5 flex items-center justify-center shadow border border-orange-200"><i class="fa-solid fa-check text-xs"></i></div>
                          </button>

                          <button @click="toggleDecision('exclude')"
                              :class="['flex-1 py-3 rounded-lg font-bold text-sm transition flex flex-col items-center justify-center border-2 h-14 relative', currentDecision==='exclude' ? 'bg-red-600 text-white border-red-600 shadow-inner' : 'bg-white border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300']">
                              <div class="flex items-center gap-2"><i class="fa-solid fa-ban text-lg"></i> <span>除外</span></div>
                              <div v-if="currentDecision==='exclude'" class="absolute -top-2 -right-2 bg-white text-red-600 rounded-full w-5 h-5 flex items-center justify-center shadow border border-red-200"><i class="fa-solid fa-check text-xs"></i></div>
                          </button>

                          <button @click="toggleDecision('csv')" :disabled="!isBalanced"
                              :class="['flex-[2] py-3 rounded-lg font-bold text-sm transition flex flex-col items-center justify-center border-2 h-14 relative shadow-md group', isBalanced ? (currentDecision==='csv' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white') : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed']">
                              <div class="flex items-center gap-2">
                                  <i :class="['fa-solid text-lg group-hover:scale-110 transition', currentDecision==='csv'?'fa-check':'fa-file-csv']"></i>
                                  <span>{{ currentDecision==='csv' ? 'CSV出力候補へ' : 'CSV出力へ回す' }}</span>
                              </div>
                              <div v-if="currentDecision==='csv'" class="absolute -top-2 -right-2 bg-emerald-100 text-emerald-600 rounded-full w-5 h-5 flex items-center justify-center shadow border border-emerald-200"><i class="fa-solid fa-check text-xs"></i></div>
                          </button>
                      </template>
                  </div>
              </div>
          </div>

          <!-- Right: Viewer Area -->
          <div class="w-[40%] bg-slate-800 flex flex-col relative overflow-hidden group">
              <!-- Toolbar -->
              <div class="absolute top-4 left-4 z-20 flex gap-2">
                  <div class="bg-black/50 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-2">
                      <i class="fa-regular fa-file-image"></i> {{ currentTransaction.imageTitle }}
                  </div>
              </div>
              <div class="absolute top-4 right-4 z-20 flex flex-col gap-2">
                  <button @click="zoomIn" class="bg-white text-slate-700 w-8 h-8 rounded-full shadow flex items-center justify-center hover:bg-slate-100"><i class="fa-solid fa-plus"></i></button>
                  <button @click="zoomOut" class="bg-white text-slate-700 w-8 h-8 rounded-full shadow flex items-center justify-center hover:bg-slate-100"><i class="fa-solid fa-minus"></i></button>
              </div>

              <!-- Main Image Area -->
              <div class="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing"
                  @mousedown="startDrag" @mousemove="onDrag" @mouseup="stopDrag" @mouseleave="stopDrag" @wheel.prevent="onWheel">

                  <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div class="origin-center transition-transform duration-100 ease-out shadow-2xl"
                          :style="{ transform: `translate(${posX}px, ${posY}px) scale(${scale})` }">
                          <!-- Placeholder for Document Image -->
                          <div class="w-[400px] h-[550px] bg-white text-slate-300 flex flex-col items-center justify-center border border-slate-600 select-none pointer-events-auto">
                              <i class="fa-regular fa-image text-6xl mb-4 opacity-50"></i>
                              <div class="text-sm font-bold">Document Image Preview</div>
                              <div class="text-xs mt-2 opacity-50 text-center px-8">本番環境ではここにGoogle Driveの画像が表示されます<br>(ID: {{ currentTransaction.id }})</div>

                              <!-- Emulate Document Content for visuals -->
                              <div class="mt-8 p-6 bg-slate-50 w-3/4 text-slate-500 font-mono text-[10px] space-y-2 opacity-50 blur-[1px]">
                                  <div class="flex justify-between border-b border-slate-300 pb-1"><span>Item A</span><span>10,000</span></div>
                                  <div class="flex justify-between"><span>Tax</span><span>1,000</span></div>
                                  <div class="flex justify-between font-bold text-slate-800 pt-2"><span>Total</span><span>11,000</span></div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              <!-- Bottom Metadata Overlay -->
              <div class="bg-black/80 backdrop-blur p-3 text-white text-[10px] flex justify-between items-center z-20">
                  <div class="flex gap-4">
                      <span><i class="fa-solid fa-calendar-days text-gray-400 mr-1"></i> 2024/11/12</span>
                      <span><i class="fa-solid fa-building text-gray-400 mr-1"></i> {{ currentTransaction.vendor }}</span>
                  </div>
                  <div>
                      <span class="font-bold text-lg">¥ {{ currentTransaction.amount }}</span>
                  </div>
              </div>
          </div>
      </div>

    <!-- Modals -->
    <transition name="fade">
        <div v-if="showCompletionPopup" class="modal-mask">
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

    <transition name="fade">
        <div v-if="showRevertConfirmModal" class="modal-mask">
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

    <transition name="fade">
        <div v-if="showBatchModal" class="modal-mask">
            <div class="bg-white rounded-lg w-full max-w-4xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                <div class="bg-slate-800 text-white p-4 font-bold flex justify-between items-center shrink-0">
                    <span class="text-lg"><i class="fa-solid fa-layer-group mr-2"></i>処理を実行しますか？</span>
                    <button @click="showBatchModal = false" class="text-gray-400 hover:text-white"><i class="fa-solid fa-xmark text-xl"></i></button>
                </div>
                <div class="p-6 overflow-y-auto bg-slate-50 flex-1">
                    <p class="text-sm text-gray-600 mb-4 font-bold">以下の内容で確定し、各フォルダへ移動・ファイル出力を行います。</p>

                    <div class="mb-6">
                        <h4 class="font-bold text-blue-700 mb-2 flex items-center"><i class="fa-solid fa-file-csv mr-2"></i>{{ currentClient.action === 'approve' ? '【仕訳CSV化】' : '【仕訳確定済み】' }} {{ approvalQueue.filter(i => i.decision === 'csv' || i.decision === 'confirmed').length }}件</h4>
                        <div class="scrolling-table-wrapper h-48 overflow-y-auto">
                            <table class="w-full text-left">
                                <thead class="scrolling-table-header sticky top-0"><tr><th class="p-2 w-8 text-center"><i class="fa-solid fa-check"></i></th><th class="p-2">理由</th><th class="p-2">日付</th><th class="p-2 text-right">合計金額</th><th class="p-2">借方科目</th><th class="p-2">貸方科目</th><th class="p-2">摘要</th></tr></thead>
                                <tbody><tr v-for="(item, idx) in approvalQueue.filter(i => i.decision === 'csv' || i.decision === 'confirmed')" :key="idx" class="scrolling-table-row bg-white"><td class="p-2 text-center"><input type="checkbox" v-model="item.selected" class="cursor-pointer"></td><td class="p-2 text-gray-400">-</td><td class="p-2 font-mono">{{ item.date }}</td><td class="p-2 text-right font-mono">{{ item.amount }}</td><td class="p-2 font-bold text-blue-600">{{ item.debit }}</td><td class="p-2">{{ item.credit }}</td><td class="p-2 text-xs truncate max-w-[150px]">{{ item.summary }}</td></tr></tbody>
                            </table>
                        </div>
                    </div>

                    <div class="mb-6">
                        <h4 class="font-bold text-yellow-700 mb-2 flex items-center"><i class="fa-solid fa-rotate-left mr-2"></i>{{ currentClient.action === 'approve' ? '【差戻し】' : '【不明仕訳あり】' }} {{ approvalQueue.filter(i => i.decision === 'remand' || i.decision === 'unknown').length }}件</h4>
                        <div class="scrolling-table-wrapper h-32 overflow-y-auto">
                            <table class="w-full text-left">
                                <thead class="scrolling-table-header sticky top-0"><tr><th class="p-2 w-8 text-center"><i class="fa-solid fa-check"></i></th><th class="p-2">理由</th><th class="p-2">日付</th><th class="p-2 text-right">合計金額</th><th class="p-2">借方科目</th><th class="p-2">貸方科目</th><th class="p-2">摘要</th></tr></thead>
                                <tbody><tr v-for="(item, idx) in approvalQueue.filter(i => i.decision === 'remand' || i.decision === 'unknown')" :key="idx" class="scrolling-table-row bg-yellow-50/50"><td class="p-2 text-center"><input type="checkbox" v-model="item.selected" class="cursor-pointer"></td><td class="p-2 text-yellow-600 font-bold text-xs">{{ currentClient.action === 'approve' ? '差戻し' : '不明' }}</td><td class="p-2 font-mono">{{ item.date }}</td><td class="p-2 text-right font-mono">{{ item.amount }}</td><td class="p-2">{{ item.debit }}</td><td class="p-2">{{ item.credit }}</td><td class="p-2 text-xs truncate max-w-[150px]">{{ item.summary }}</td></tr></tbody>
                            </table>
                        </div>
                    </div>

                    <div class="mb-6">
                        <h4 class="font-bold text-red-700 mb-2 flex items-center"><i class="fa-solid fa-ban mr-2"></i>【仕訳から除外】 {{ approvalQueue.filter(i=>i.decision==='exclude').length }}件</h4>
                        <div class="scrolling-table-wrapper h-32 overflow-y-auto">
                            <table class="w-full text-left">
                                <thead class="scrolling-table-header sticky top-0"><tr><th class="p-2 w-8 text-center"><i class="fa-solid fa-check"></i></th><th class="p-2">理由</th><th class="p-2">日付</th><th class="p-2 text-right">合計金額</th><th class="p-2">借方科目</th><th class="p-2">貸方科目</th><th class="p-2">摘要</th></tr></thead>
                                <tbody><tr v-for="(item, idx) in approvalQueue.filter(i=>i.decision==='exclude')" :key="idx" class="scrolling-table-row bg-red-50/50"><td class="p-2 text-center"><input type="checkbox" v-model="item.selected" class="cursor-pointer"></td><td class="p-2 text-red-500 font-bold text-xs">除外</td><td class="p-2 font-mono">{{ item.date }}</td><td class="p-2 text-right font-mono">{{ item.amount }}</td><td class="p-2">{{ item.debit }}</td><td class="p-2">{{ item.credit }}</td><td class="p-2 text-xs truncate max-w-[150px]">{{ item.summary }}</td></tr></tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="bg-white border-t border-slate-200 p-4 flex justify-between shrink-0">
                    <div class="flex gap-2"><button @click="showBatchModal = false" class="px-6 py-3 rounded-lg font-bold text-gray-500 hover:bg-gray-100 transition">キャンセル</button><button @click="revertItems" class="px-4 py-3 rounded-lg font-bold text-red-600 border border-red-200 hover:bg-red-50 transition flex items-center"><i class="fa-solid fa-rotate-left mr-2"></i> チェックした項目を未承認に戻す</button></div>
                    <button @click="executeBatch" class="px-8 py-3 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg transition flex items-center"><i class="fa-solid fa-check-double mr-2"></i> 確定して実行</button>
                </div>
            </div>
        </div>
    </transition>

    <transition name="toast">
        <div v-if="toast.visible" :class="['fixed bottom-24 left-4 z-[100] px-6 py-3 rounded-full shadow-xl font-bold text-sm flex items-center gap-4 transition', toast.type==='error'?'bg-red-600 text-white':'bg-slate-800 text-white']">
            <span><i class="fa-solid mr-2" :class="toast.type==='error'?'fa-triangle-exclamation':'fa-check'"></i> {{ toast.message }}</span>
            <button v-if="toast.isUndo" @click="performUndo" class="bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 rounded text-xs uppercase font-bold tracking-wide">元に戻す</button>
        </div>
    </transition>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { aaa_useAccountingSystem, type Job, type JobStatus } from '@/composables/useAccountingSystem';
import { Timestamp } from 'firebase/firestore';

const route = useRoute();
const router = useRouter();
const { jobs, getClientByCode, updateJobStatus } = aaa_useAccountingSystem();

// -- HTML Compatibility State --
const screen = computed({
    get: () => 'E',
    set: (v) => { if (v === 'B') router.push('/journal-status'); }
});

const currentIndex = ref(0);
const selectedJob = ref<Job | null>(null);
const client = ref<any>(null); // raw client data

// Map 'pageMode' to currentClient.action
const pageMode = computed(() => (route.query.mode as string) || 'details');

const currentClient = computed(() => {
    const base = client.value || {};
    let action = 'work';
    if (pageMode.value === 'remand') action = 'remand';
    if (pageMode.value === 'approved') action = 'approve';

    return {
        ...base,
        action,
        settings: base.settings || { software: 'MFクラウド', taxMethod: 'inclusive', calcMethod: '現金主義', taxType: '青色' }
    };
});

// Map selectedJob to currentTransaction
const currentTransaction = computed(() => {
    const j = selectedJob.value;
    if (!j) return { id: '', mode: 'new', isExcluded: false, status: 'ready_for_work', imageTitle: '', vendor: '', item: '', amount: 0, ai_reason: '', ai_proposal: null };
    return {
        id: j.id,
        mode: 'new',
        isExcluded: j.status === 'excluded',
        status: j.status,
        imageTitle: '領収書',
        vendor: j.lines?.[0]?.description || '', // default from line
        item: j.lines?.[0]?.drAccount || '',
        amount: j.lines?.reduce((s,l)=>s+(Number(l.drAmount)||0),0).toLocaleString() || 0,
        ai_reason: j.aiAnalysisRaw || '',
        ai_proposal: {
             d: j.lines?.[0]?.drAccount || '',
             c: j.lines?.[0]?.crAccount || '',
             amount: j.lines?.reduce((s,l)=>s+(Number(l.drAmount)||0),0) || 0
        },
        hasDuplicate: false
    };
});

// Form Data (The detailed editor state)
const form = reactive({
    date: '',
    summary: '',
    debit: [] as any[], // { acct, sub, tax, amount }
    credit: [] as any[]
});

// Helper to load job into form
function loadJobToForm(job: Job) {
    if (!job) return;
    try {
       form.date = job.transactionDate ? job.transactionDate.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    } catch { form.date = ''; }

    // Naively assume lines are split. In real app we parse lines.
    // For now, map existing lines to debit/credit
    const lines = job.lines || [];
    // If no lines, add default
    if (lines.length === 0) {
        form.debit = [{ acct: '', sub: '', tax: 'tax_10', amount: 0 }];
        form.credit = [{ acct: '', sub: '', tax: 'tax_none', amount: 0 }];
        form.summary = '';
    } else {
        form.debit = lines.map(l => ({
            acct: l.drAccount,
            sub: l.drSubAccount,
            tax: l.drTaxClass || 'tax_10',
            amount: l.drAmount
        }));
        form.credit = lines.map(l => ({
            acct: l.crAccount,
            sub: l.crSubAccount,
            tax: l.crTaxClass || 'tax_none',
            amount: l.crAmount
        }));
        form.summary = lines[0]?.description || '';
    }
}

// Watch selection
watch(currentIndex, (idx) => {
    if (jobs.value[idx]) {
        selectedJob.value = jobs.value[idx];
        loadJobToForm(selectedJob.value);
    }
});

// Image Viewer State
const scale = ref(1);
const posX = ref(0);
const posY = ref(0);
const isDragging = ref(false);
const zoomIn = () => scale.value += 0.1;
const zoomOut = () => { if (scale.value > 0.2) scale.value -= 0.1; };
const onWheel = (e: WheelEvent) => {
    if(e.ctrlKey || e.metaKey) {
        scale.value -= e.deltaY * 0.01;
    } else {
        scale.value -= e.deltaY * 0.001;
    }
    if(scale.value < 0.2) scale.value = 0.2;
    if(scale.value > 5) scale.value = 5;
};
const startDrag = (e: MouseEvent) => { isDragging.value = true; };
const onDrag = (e: MouseEvent) => { if (!isDragging.value) return; posX.value += e.movementX; posY.value += e.movementY; };
const stopDrag = () => { isDragging.value = false; };


// Computed logic for amounts
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

// Navigation
const nextTransaction = () => {
    if (currentIndex.value < jobs.value.length - 1) {
        currentIndex.value++;
    } else {
        // End of list
        if (approvalQueue.value.length >= jobs.value.length) {
            showCompletionPopup.value = true;
        }
    }
};
const prevTransaction = () => {
    if (currentIndex.value > 0) currentIndex.value--;
};
const goNext = nextTransaction; // alias
const goBack = prevTransaction; // alias (partially)

// Queue Logic
const approvalQueue = ref<any[]>([]);
const remainingApprovalCount = computed(() => jobs.value.length - approvalQueue.value.length);
const currentDecision = computed(() => {
    if(!selectedJob.value) return null;
    const found = approvalQueue.value.find(q => q.id === selectedJob.value!.id);
    return found ? found.decision : null;
});

// Modals
const showCompletionPopup = ref(false);
const showBatchModal = ref(false);
const showRevertConfirmModal = ref(false);
const pendingRevertId = ref<string|null>(null);

// Toast
const toast = reactive({ visible: false, message: '', isUndo: false, type: 'normal' });
let toastTimeout: any;
const showToast = (msg: string, type: 'normal'|'undo'|'success'|'error' = 'normal') => {
    clearTimeout(toastTimeout);
    toast.message = msg;
    toast.isUndo = (type === 'undo');
    // Simplified type mapping logic for demo
    if (type === 'undo') type = 'normal';
    toast.type = type;
    toast.visible = true;
    toastTimeout = setTimeout(() => toast.visible = false, 3000);
};

// Actions (Toggle, Add, Revert, Undo)
const toggleDecision = (decision: string) => {
    if (!currentTransaction.value.id) return;
    const txId = currentTransaction.value.id;
    const existing = approvalQueue.value.find(q => q.id === txId);

    if (existing && existing.decision === decision) {
        pendingRevertId.value = txId;
        showRevertConfirmModal.value = true;
        return;
    }
    addToQueue(decision);
};

const addToQueue = (decision: string) => {
    const txId = currentTransaction.value.id;
    const record = {
        id: txId,
        decision: decision,
        date: form.date,
        amount: totalAmount.value,
        debit: form.debit[0]?.acct || '',
        credit: form.credit[0]?.acct || '',
        summary: form.summary,
        selected: false
    };
    const existingIdx = approvalQueue.value.findIndex(q => q.id === txId);
    if (existingIdx !== -1) approvalQueue.value[existingIdx] = record;
    else approvalQueue.value.push(record);

    let label = decision;
    if(decision === 'csv') label = '仕訳CSV化';
    else if(decision === 'exclude') label = '除外';
    else if(decision === 'remand') label = '差戻し';
    else if(decision === 'confirmed') label = '確定';

    showToast(`『${label}』しました`, 'undo');

    if (approvalQueue.value.length >= jobs.value.length) showCompletionPopup.value = true;
    else nextTransaction();
};

const confirmRevert = () => {
    if (pendingRevertId.value) {
        approvalQueue.value = approvalQueue.value.filter(q => q.id !== pendingRevertId.value);
        showToast('ステータスを解除し、未処理に戻しました');
        showRevertConfirmModal.value = false;
        pendingRevertId.value = null;
        showCompletionPopup.value = false;
    }
};

const performUndo = () => {
    // Simplified undo: revert the last item in active session for demo
    showToast('Undo not fully implemented in demo', 'error');
};
const lastAction = ref<any>(null); // Add this

const revertItems = () => {
    // removal logic
    const kept = approvalQueue.value.filter(item => !item.selected);
    approvalQueue.value = kept;
    showBatchModal.value = false;
    showToast('未承認に戻しました');
    currentIndex.value = 0;
};

const executeBatch = async () => {
    showToast('処理を実行中...', 'success');
    for (const item of approvalQueue.value) {
        let status: JobStatus = 'ready_for_work';
        let reviewStatus: any = undefined;
        switch (item.decision) {
            case 'confirmed': status = 'review'; reviewStatus = 'confirmed'; break;
            case 'unknown': status = 'review'; reviewStatus = 'unknown'; break;
            case 'exclude_candidate': status = 'review'; reviewStatus = 'exclude_candidate'; break;
            case 'remand': status = 'remanded'; break;
            case 'exclude': status = 'excluded'; break;
            case 'csv': status = 'approved'; break;
        }

        await updateJobStatus(item.id, status, undefined);
    }
    showBatchModal.value = false;
    setTimeout(() => {
       router.push('/journal-status');
    }, 1000);
};

const addRow = (side: 'debit'|'credit') => {
    form[side].push({ acct: '', sub: '', tax: side==='debit'?'tax_10':'tax_none', amount: 0 });
};
const removeRow = (side: 'debit'|'credit', idx: number) => {
    form[side].splice(idx, 1);
};
const applyTemplate = (data: any) => {
    // ...
};

const openBatchModal = () => {
    showCompletionPopup.value = false;
    showBatchModal.value = true;
};

// Lifecycle
onMounted(() => {
    if (jobs.value.length > 0) {
        selectedJob.value = jobs.value[0];
        loadJobToForm(selectedJob.value);
    }
    const code = route.params.clientCode || jobs.value[0]?.clientCode;
    if(code) client.value = getClientByCode(code as string);
});
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(20px); }
.modal-mask { position: fixed; z-index: 9998; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; transition: opacity 0.3s ease; }

.scrolling-table-wrapper { border: 1px solid #e2e8f0; border-radius: 4px; background: white; }
.scrolling-table-header { background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-size: 11px; color: #64748b; }
.scrolling-table-row { border-bottom: 1px solid #f1f5f9; font-size: 11px; }
.scrolling-table-row:last-child { border-bottom: none; }
.bg-diagonal { background-image: linear-gradient(45deg, #f1f5f9 25%, #ffffff 25%, #ffffff 50%, #f1f5f9 50%, #f1f5f9 75%, #ffffff 75%, #ffffff 100%); background-size: 8px 8px; }

/* Drive Link Compact Style */
.drive-link-compact { display: flex; align-items: center; gap: 2px; font-size: 10px; color: #2563eb; text-decoration: none; padding: 2px 4px; border-radius: 2px; transition: background-color 0.2s; }
.drive-link-compact:hover { background-color: #eff6ff; text-decoration: none; }
.drive-link-compact span { text-decoration: underline; text-decoration-color: #93c5fd; }
</style>
