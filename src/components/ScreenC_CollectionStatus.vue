<template>
    <div class="h-full flex flex-col bg-white rounded-lg shadow border border-gray-200 overflow-hidden animate-fade-in relative">
        <!-- DETAIL VIEW (If code is present) -->
        <div v-if="isDetailView && currentClient" class="h-full flex flex-col bg-slate-50 overflow-hidden animate-fade-in relative w-full">
            <div class="p-6 max-w-7xl mx-auto w-full overflow-y-auto">
                <button @click="goBack" class="text-xs text-gray-500 hover:text-blue-500 mb-4 flex items-center">
                    <i class="fa-solid fa-arrow-left mr-1"></i> 全社回収一覧に戻る
                </button>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 flex justify-between items-start">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <span class="bg-slate-100 text-slate-600 text-sm px-2 py-1 rounded font-mono font-bold">{{ currentClient.code }}</span>
                            <h1 class="text-2xl font-bold text-slate-800">{{ currentClient.name }}</h1>
                            <span class="text-xs bg-slate-100 px-2 py-1 rounded border text-slate-500">
                                {{ currentClient.type === 'individual' ? '個人' : '法人' }} ({{ currentClient.fiscalMonth }}月決算)
                            </span>
                        </div>
                        <div class="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 inline-flex">
                            <i class="fa-solid fa-calendar-check text-blue-500"></i>
                            <span class="text-sm text-blue-800 font-bold">第 5 期 ({{ viewYearStart }}/04 〜 {{ viewYearStart + 1 }}/03)</span>
                            <span class="text-xs text-blue-400 border-l border-blue-200 pl-3">現在 8ヶ月目</span>
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                        <button @click="openReportModal" class="bg-slate-700 text-white px-4 py-2 rounded text-sm font-bold hover:bg-slate-800 shadow-sm flex items-center gap-2">
                            <i class="fa-regular fa-copy"></i> 報告文作成
                        </button>
                        <p class="text-[10px] text-gray-400">設定に基づきリアルタイム生成します</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 grid grid-cols-2 gap-4">
                        <!-- Receipt (Always Active) -->
                        <div class="flex flex-col justify-between p-4 rounded-lg border shadow-sm h-36 relative transition bg-green-50 border-green-200 text-green-800">
                            <div class="space-y-1">
                                <div class="font-bold text-sm flex items-center gap-2">
                                    <i class="fa-solid fa-receipt"></i> 領収書
                                </div>
                                <div class="text-xs">最新受領日: <span class="font-bold">2025/11/25</span></div>
                            </div>
                            <div class="flex justify-between items-end border-t border-green-100 pt-2">
                                <span class="text-xs text-green-600 font-bold"><i class="fa-solid fa-check"></i> 順調</span>
                            </div>
                        </div>

                        <!-- Banks (Dynamic) -->
                        <template v-for="bank in currentClient.banks" :key="bank.id">
                            <div :class="['flex flex-col justify-between p-4 rounded-lg border shadow-sm h-36 relative transition', bank.status === 'connected' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800']">
                                <button @click.stop="deleteBank(bank.id)" class="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition">
                                    <i class="fa-solid fa-trash text-xs"></i>
                                </button>
                                <div class="space-y-1 pr-4">
                                    <div class="font-bold text-sm truncate flex flex-wrap gap-x-2 items-baseline">
                                        <span class="text-xs text-slate-500"><i class="fa-solid fa-building-columns"></i></span>
                                        <span>{{ bank.bankName }}</span>
                                        <span class="text-xs font-normal">{{ bank.branchName }}</span>
                                        <span class="text-xs font-mono bg-white/50 px-1 rounded">{{ maskNumber(bank.accountNumber) }}</span>
                                    </div>
                                    <div class="text-xs mt-2">受領期間: <span class="font-bold">10/01 〜 10/31</span></div>
                                </div>
                                <div class="flex justify-between items-end border-t pt-2" :class="bank.status === 'connected' ? 'border-green-100' : 'border-red-100'">
                                    <span v-if="bank.status === 'connected'" class="text-xs text-green-600 font-bold"><i class="fa-solid fa-check"></i> 連携OK</span>
                                    <span v-else-if="bank.status === 'error'" class="text-xs text-red-600 font-bold"><i class="fa-solid fa-triangle-exclamation"></i> エラー</span>
                                    <span v-else class="text-xs text-gray-400 font-bold">手動</span>
                                </div>
                            </div>
                        </template>

                        <div v-if="!currentClient.banks?.length" class="flex flex-col justify-center items-center p-4 rounded-lg border border-dashed border-gray-300 text-gray-400 h-36">
                            <i class="fa-solid fa-building-columns text-2xl mb-2"></i>
                            <span class="text-xs">銀行口座未登録</span>
                        </div>

                        <!-- Add Bank Button -->
                        <div class="flex flex-col justify-center items-center p-4 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 text-blue-500 hover:bg-blue-50 hover:border-blue-300 cursor-pointer h-36 transition" @click="openBankModal">
                            <i class="fa-solid fa-plus text-xl mb-1"></i>
                            <span class="text-xs font-bold">銀行口座を追加</span>
                        </div>

                        <!-- Credit Cards (Dynamic) -->
                        <template v-for="card in currentClient.creditCards" :key="card.id">
                            <div :class="['flex flex-col justify-between p-4 rounded-lg border shadow-sm h-36 relative transition', card.status === 'connected' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800']">
                                <button @click.stop="deleteCard(card.id)" class="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition">
                                    <i class="fa-solid fa-trash text-xs"></i>
                                </button>
                                <div class="space-y-1 pr-4">
                                    <div class="font-bold text-sm truncate flex flex-wrap gap-x-2 items-baseline">
                                        <span class="text-xs text-slate-500"><i class="fa-regular fa-credit-card"></i></span>
                                        <span>{{ card.companyName }}</span>
                                        <span class="text-xs font-mono bg-white/50 px-1 rounded">{{ maskNumber(card.last4Digits) }}</span>
                                    </div>
                                    <div class="text-[10px] text-gray-500 pl-4">{{ card.withdrawalAccount || '引落口座未設定' }}</div>
                                    <div class="text-xs mt-1">受領期間: <span class="font-bold">10/01 〜 10/31</span></div>
                                </div>
                                <div class="flex justify-between items-end border-t pt-2" :class="card.status === 'connected' ? 'border-green-100' : 'border-red-100'">
                                    <p v-if="card.status === 'connected'" class="text-xs text-green-600 font-bold mt-1">連携OK</p>
                                    <p v-else-if="card.status === 'error'" class="text-xs text-red-500 font-bold mt-1">エラー</p>
                                    <p v-else class="text-xs text-gray-400 font-bold mt-1">手動</p>
                                </div>
                            </div>
                        </template>

                        <div v-if="!currentClient.creditCards?.length" class="flex flex-col justify-center items-center p-4 rounded-lg border border-dashed border-gray-300 text-gray-400 h-36">
                            <i class="fa-regular fa-credit-card text-2xl mb-2"></i>
                            <span class="text-xs">カード未登録</span>
                        </div>

                        <!-- Add Card Button -->
                        <div class="flex flex-col justify-center items-center p-4 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 text-blue-500 hover:bg-blue-50 hover:border-blue-300 cursor-pointer h-36 transition" @click="openCardModal">
                            <i class="fa-solid fa-plus text-xl mb-1"></i>
                            <span class="text-xs font-bold">カードを追加</span>
                        </div>

                        <!-- Other Expected Materials (Dynamic) -->
                        <template v-for="mat in materialStatuses" :key="mat.name">
                            <div :class="['flex flex-col justify-between p-4 rounded-lg border shadow-sm h-36 relative transition', mat.status === 'received' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800']">
                                <div class="space-y-1">
                                    <div class="font-bold text-sm flex items-center gap-2">
                                        <i class="fa-solid fa-file-contract"></i> {{ mat.name }}
                                    </div>
                                    <div class="text-xs mt-2" v-if="mat.status === 'received'">状態: 受領済み</div>
                                    <div class="text-xs mt-2" v-else>状態: 未受領</div>
                                </div>
                                <div class="flex justify-between items-end border-t pt-2" :class="mat.status === 'received' ? 'border-green-100' : 'border-red-100'">
                                    <span v-if="mat.status === 'received'" class="text-xs text-green-600 font-bold"><i class="fa-solid fa-check"></i> 順調</span>
                                    <span v-else class="text-xs text-red-600 font-bold"><i class="fa-solid fa-triangle-exclamation"></i> 遅延</span>
                                </div>
                            </div>
                        </template>

                        <!-- Cash (Toggleable) -->
                        <div :class="['flex flex-col justify-between p-4 rounded-lg border shadow-sm h-36 relative transition', c_config.cash ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60']">
                            <div class="space-y-1">
                                <div class="font-bold text-sm flex items-center gap-2"><i class="fa-solid fa-book"></i> 現金出納帳</div>
                                <template v-if="c_config.cash">
                                    <div class="text-xs">受領: <span class="font-bold">10月分まで</span></div>
                                    <div class="text-xs text-red-600 font-bold">未着: 11月分</div>
                                </template>
                                <div v-else class="text-xs mt-2">設定: 監視OFF</div>
                            </div>
                            <div class="flex justify-between items-end border-t border-gray-200 pt-2">
                                <span class="text-xs" v-if="c_config.cash"><i class="fa-solid fa-triangle-exclamation text-red-500"></i> 遅延</span>
                                <span class="text-xs" v-else>対象外</span>
                            </div>
                        </div>

                        <!-- Payroll (Toggleable) -->
                        <div :class="['flex flex-col justify-between p-4 rounded-lg border shadow-sm h-36 relative transition', c_config.payroll ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60']">
                            <div class="space-y-1">
                                <div class="font-bold text-sm flex items-center gap-2"><i class="fa-solid fa-file-invoice-dollar"></i> 給与台帳</div>
                                <template v-if="c_config.payroll">
                                    <div class="text-xs">受領: <span class="font-bold">11月分まで</span></div>
                                    <div class="text-xs text-gray-400">未着: なし</div>
                                </template>
                                <div v-else class="text-xs mt-2">設定: 監視OFF</div>
                            </div>
                            <div class="flex justify-between items-end border-t border-gray-200 pt-2">
                                <span class="text-xs text-green-600 font-bold" v-if="c_config.payroll"><i class="fa-solid fa-check"></i> 順調</span>
                                <span class="text-xs" v-else>対象外</span>
                            </div>
                        </div>

                        <!-- Invoice (Toggleable) -->
                        <div :class="['flex flex-col justify-between p-4 rounded-lg border shadow-sm h-36 relative transition', c_config.invoice ? 'bg-red-50 border-red-200 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60']">
                           <div class="space-y-1">
                                <div class="font-bold text-sm flex items-center gap-2"><i class="fa-solid fa-file-invoice"></i> 請求書</div>
                                <template v-if="c_config.invoice">
                                    <div class="text-xs">受領: <span class="font-bold">9月分まで</span></div>
                                    <div class="text-xs text-red-600 font-bold">未着: 10月分</div>
                                </template>
                                <div v-else class="text-xs mt-2">設定: 監視OFF</div>
                            </div>
                            <div class="flex justify-between items-end border-t border-gray-200 pt-2">
                                <span class="text-xs text-red-500 font-bold" v-if="c_config.invoice"><i class="fa-solid fa-triangle-exclamation"></i> 遅延</span>
                                <span class="text-xs" v-else>対象外</span>
                            </div>
                        </div>

                        <!-- Social (Toggleable) -->
                        <div :class="['flex flex-col justify-between p-4 rounded-lg border shadow-sm h-36 relative transition', c_config.social ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60']">
                            <div class="space-y-1">
                                <div class="font-bold text-sm flex items-center gap-2"><i class="fa-solid fa-id-card"></i> 社会保険通知</div>
                                <template v-if="c_config.social">
                                    <div class="text-xs font-bold mt-2">受領済み</div>
                                </template>
                                <div v-else class="text-xs mt-2">設定: 監視OFF</div>
                            </div>
                             <div class="flex justify-between items-end border-t border-gray-200 pt-2">
                                <span class="text-xs text-green-600 font-bold" v-if="c_config.social"><i class="fa-solid fa-check"></i> 順調</span>
                                <span class="text-xs" v-else>対象外</span>
                            </div>
                        </div>
                    </div>

                    <!-- Config Panel -->
                    <div class="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-4 h-fit shadow-sm">
                        <h3 class="text-sm font-bold text-slate-700 mb-4 flex items-center"><i class="fa-solid fa-sliders mr-2 text-gray-400"></i> クイック設定</h3>
                        <div class="space-y-4">
                            <div class="flex justify-between items-center pb-2 border-b border-gray-100">
                                <div class="flex items-center gap-2"><i class="fa-solid fa-book text-gray-400"></i><span class="text-sm text-gray-600">現金出納帳</span></div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" v-model="c_config.cash" class="sr-only peer">
                                  <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>
                            <div class="flex justify-between items-center pb-2 border-b border-gray-100">
                                <div class="flex items-center gap-2"><i class="fa-solid fa-file-invoice-dollar text-gray-400"></i><span class="text-sm text-gray-600">給与台帳</span></div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" v-model="c_config.payroll" class="sr-only peer">
                                  <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>
                            <div class="flex justify-between items-center pb-2 border-b border-gray-100">
                                <div class="flex items-center gap-2"><i class="fa-solid fa-id-card text-gray-400"></i><span class="text-sm text-gray-600">社会保険通知</span></div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" v-model="c_config.social" class="sr-only peer">
                                  <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>
                            <div class="flex justify-between items-center pb-2 border-b border-gray-100">
                                <div class="flex items-center gap-2"><i class="fa-solid fa-file-invoice text-gray-400"></i><span class="text-sm text-gray-600">請求書</span></div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" v-model="c_config.invoice" class="sr-only peer">
                                  <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>
                        </div>
                        <button @click="saveCConfig" :class="['mt-6 w-full py-2 rounded text-xs font-bold text-white transition flex justify-center items-center gap-2 shadow-sm', c_isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700']">
                            <i v-if="c_isSaving" class="fa-solid fa-circle-notch fa-spin"></i>
                            <span v-else><i class="fa-solid fa-save"></i> 設定を保存</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Report Modal -->
            <div v-if="showCReportModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                    <div class="bg-slate-800 text-white px-4 py-3 font-bold flex justify-between items-center">
                        <span><i class="fa-regular fa-envelope mr-2"></i> 報告文プレビュー</span>
                        <button @click="showCReportModal = false" class="text-gray-400 hover:text-white">✕</button>
                    </div>
                    <div class="p-4">
                        <textarea v-model="c_reportText" class="w-full h-64 border border-gray-300 rounded p-2 text-xs font-mono focus:border-blue-500 outline-none resize-none"></textarea>
                    </div>
                    <div class="bg-gray-100 px-4 py-3 flex justify-end gap-2">
                        <button @click="showCReportModal = false" class="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded text-xs font-bold hover:bg-gray-50">キャンセル</button>
                        <button @click="copyCReport" class="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-700 shadow-sm">
                            <i class="fa-regular fa-copy mr-1"></i> コピー
                        </button>
                    </div>
                </div>
            </div>

            <!-- Bank Registration Modal -->
            <div v-if="showBankModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" @click="showBankModal = false">
                <div class="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up" @click.stop>
                    <div class="bg-slate-50 px-4 py-3 border-b flex justify-between items-center">
                        <span class="font-bold text-slate-700"><i class="fa-solid fa-building-columns mr-2 text-blue-500"></i>銀行口座の追加</span>
                        <button @click="showBankModal = false" class="text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                    <div class="p-6 space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">銀行名</label>
                            <input v-model="bankForm.bankName" type="text" class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none" placeholder="例: みずほ銀行">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">支店名</label>
                            <input v-model="bankForm.branchName" type="text" class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none" placeholder="例: 渋谷支店">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">口座番号</label>
                            <input v-model="bankForm.accountNumber" type="text" class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none" placeholder="例: 1234567">
                        </div>
                    </div>
                    <div class="bg-gray-50 px-4 py-3 flex justify-end gap-2 border-t">
                        <button @click="showBankModal = false" class="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded">キャンセル</button>
                        <button @click="saveBank" class="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm" :disabled="!bankForm.bankName || !bankForm.branchName || !bankForm.accountNumber">登録</button>
                    </div>
                </div>
            </div>

            <!-- Card Registration Modal -->
            <div v-if="showCardModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" @click="showCardModal = false">
                <div class="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up" @click.stop>
                    <div class="bg-slate-50 px-4 py-3 border-b flex justify-between items-center">
                        <span class="font-bold text-slate-700"><i class="fa-regular fa-credit-card mr-2 text-orange-500"></i>クレジットカードの追加</span>
                        <button @click="showCardModal = false" class="text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                    <div class="p-6 space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">カード会社名</label>
                            <input v-model="cardForm.companyName" type="text" class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none" placeholder="例: 楽天カード">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">カード番号 (下4桁/全桁)</label>
                            <input v-model="cardForm.cardNumber" type="text" class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none" placeholder="例: 1234">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">引き落とし口座</label>
                            <input v-model="cardForm.withdrawalAccount" type="text" class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none" placeholder="例: みずほ銀行">
                        </div>
                    </div>
                    <div class="bg-gray-50 px-4 py-3 flex justify-end gap-2 border-t">
                        <button @click="showCardModal = false" class="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded">キャンセル</button>
                        <button @click="saveCard" class="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm" :disabled="!cardForm.companyName">登録</button>
                    </div>
                </div>
            </div>


        </div>

        <!-- LIST VIEW (Default) -->
        <template v-else>
            <div class="p-3 border-b border-gray-200 flex justify-between items-center bg-slate-50 shrink-0">
                <div class="flex items-center gap-4">
                    <div class="font-bold text-slate-700 text-sm flex items-center gap-2 mr-4">
                        <i class="fa-solid fa-calendar-days text-blue-500"></i> 全社資料回収状況
                    </div>
                    <div class="flex items-center bg-white rounded p-0.5 text-xs border border-gray-200 shadow-sm">
                        <button @click="changeYear('prev')" class="px-3 py-1 hover:bg-gray-100 rounded-l text-gray-500"><i class="fa-solid fa-backward"></i> 過去</button>
                        <span class="px-3 font-bold text-slate-700 border-x border-gray-200 bg-white">{{ viewYearStart }}年 〜 {{ viewYearStart + 1}}年</span>
                        <button @click="changeYear('next')" class="px-3 py-1 hover:bg-gray-100 rounded-r text-gray-500">未来 <i class="fa-solid fa-forward"></i></button>
                    </div>
                </div>
                <div class="flex gap-4 text-[10px] text-gray-500 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm">
                    <span class="flex items-center"><i class="fa-solid fa-circle-check text-green-500 mr-1"></i>完了</span>
                    <span class="flex items-center"><i class="fa-solid fa-xmark text-red-500 mr-1"></i>未着</span>
                    <span class="flex items-center"><i class="fa-solid fa-triangle-exclamation text-yellow-500 mr-1"></i>一部未着</span>
                    <span class="border-l pl-3 ml-2 flex items-center"><span class="w-0.5 h-3 bg-blue-500 mr-1 block"></span> 決算月</span>
                </div>
            </div>

            <div class="overflow-auto flex-1 p-0 relative">
                <div v-if="isCalendarLoading" class="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
                    <div class="text-blue-500 font-bold"><i class="fa-solid fa-circle-notch fa-spin text-3xl"></i></div>
                </div>

                <table class="w-full border-collapse text-xs min-w-[1500px]">
                    <thead class="sticky top-0 z-30 shadow-sm">
                        <tr class="bg-slate-100 text-gray-600 text-[10px] font-bold uppercase h-6 border-b border-gray-300">
                            <th class="p-0 w-64 text-left sticky left-0 z-20 bg-slate-50 border-r border-gray-200"><div class="px-3 py-1">クライアント情報</div></th>
                            <th colspan="12" class="border-r border-gray-300 text-center bg-slate-200 text-slate-700">{{ viewYearStart }}年</th>
                            <th colspan="12" class="text-center bg-slate-100 text-slate-500">{{ viewYearStart + 1 }}年</th>
                        </tr>
                        <tr class="bg-slate-50 text-gray-500 text-[9px] font-bold border-b border-gray-300 h-6">
                            <th class="sticky left-0 z-20 bg-slate-50 border-r border-gray-200"></th>
                            <th v-for="m in 24" :key="m" class="w-8 border-r text-center align-middle relative">
                                <span class="text-[7px] absolute top-0 left-0 text-gray-400 transform scale-75 origin-top-left">'{{ m <= 12 ? String(viewYearStart).slice(2) : String(viewYearStart + 1).slice(2) }}</span>
                                {{ m <= 12 ? m : m - 12 }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        <tr v-for="client in sortedCalendarDocs" :key="client.jobId" class="hover:bg-blue-50/10 transition h-10">
                            <td class="p-0 sticky left-0 z-20 border-r border-gray-200 align-middle bg-white group">
                                <div class="flex items-stretch h-10 cursor-pointer" @click="goToCollectionDetail(client)">
                                    <div class="w-10 bg-slate-100 flex items-center justify-center border-r border-slate-200 text-[10px] font-mono font-bold text-slate-500 shrink-0">{{ client.code }}</div>
                                    <div class="flex-1 px-3 flex flex-col justify-center min-w-0 hover:bg-blue-50">
                                        <div class="font-bold text-slate-700 text-xs truncate">{{ client.name }}</div>
                                        <div class="flex gap-1"><span class="text-[9px] text-blue-600 font-bold">{{ client.type === 'individual' ? '個人(12月)' : client.fiscalMonth + '月決算' }}</span></div>
                                    </div>
                                    <div class="w-8 flex items-center justify-center border-l border-slate-100 shrink-0"><i class="fa-solid fa-folder-open text-slate-300 hover:text-blue-600"></i></div>
                                </div>
                            </td>
                            <td v-for="m in 24" :key="m" :class="['w-8 h-10 border-r border-b border-gray-200 text-center align-middle relative', getCellStyle(client, m)]">
                                <div v-if="isFiscalMonth(client, m)" class="absolute right-0 top-0 bottom-0 border-r-2 border-blue-500 z-0"><span class="absolute bottom-0 right-0 bg-blue-500 text-white text-[8px] px-0.5 leading-none rounded-tl shadow-sm">決</span></div>

                                <template v-if="shouldShowIcon(client, m)">
                                    <i v-if="getPeriodStatus(client, m) === 1" class="fa-solid fa-circle-check text-green-500 relative z-10 text-xs"></i>
                                    <i v-if="getPeriodStatus(client, m) === 0" class="fa-solid fa-xmark text-red-500 relative z-10 text-xs"></i>
                                    <i v-if="getPeriodStatus(client, m) === 2" class="fa-solid fa-triangle-exclamation text-yellow-500 relative z-10 text-xs"></i>
                                </template>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, inject, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAccountingSystem } from '@/composables/useAccountingSystem';
import { FirestoreRepository } from '@/services/firestoreRepository';
import type { Client, BankAccount, CreditCard } from '@/types/firestore';
import moment from 'moment';

const route = useRoute();
const router = useRouter();
const { clients, fetchClients, subscribeToClientJobs, jobs, checkMaterialStatus, unsubscribeFromJobs } = useAccountingSystem();

onMounted(() => {
    fetchClients();
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const showToast = inject<any>('showToast');

// ---------------------------------------------------------
// Local State for Assets
// ---------------------------------------------------------
const fetchedBanks = ref<BankAccount[]>([]);
const fetchedCards = ref<CreditCard[]>([]);
const isAssetsLoading = ref(false);

const fetchAssets = async (clientCode: string) => {
    isAssetsLoading.value = true;
    try {
        const [banks, cards] = await Promise.all([
            FirestoreRepository.getBankAccounts(clientCode),
            FirestoreRepository.getCreditCards(clientCode)
        ]);
        fetchedBanks.value = banks;
        fetchedCards.value = cards;
    } catch (e) {
        console.error("Failed to fetch assets", e);
    } finally {
        isAssetsLoading.value = false;
    }
};

// ---------------------------------------------------------
// View State & Data Mapping
// ---------------------------------------------------------
const isDetailView = computed(() => !!route.params.code);

const currentClient = computed(() => {
    if (!isDetailView.value) return null;

    // Find client in the master list
    // Note: useAccountingSystem.clients is Client[]
    // Firestore Client has clientCode, companyName
    // UI Template expects: code, name, type, fiscalMonth, banks, creditCards
    const found = clients.value.find((c: Client) => c.clientCode === route.params.code);

    if (!found) return null;

    // Map Firestore Client -> UI Format
    return {
        ...found,
        code: found.clientCode,
        name: found.companyName,
        // fiscalMonth is direct
        // Derive 'type' based on fiscalMonth or other logic if needed.
        // For now, assume 'corp' unless fiscalMonth is 12 and explicitly 'individual'?
        // Let's assume generic logic or just pass it if Client type has it.
        // Firestore Client type doesn't have 'type' property in the defined interface?
        // Let's add simple logic: if companyName contains "様" or "Personal", maybe Individual?
        // Or just default to corp. The template handles 'individual' check properly.
        type: 'corp',

        // Attach fetched assets
        banks: fetchedBanks.value,
        creditCards: fetchedCards.value,

        // Mock ID for Job Logic (Screen B used job.id, here we use clientCode mostly)
        jobId: found.clientCode
    };
});

// Computed Status for Materials
const materialStatuses = computed(() => {
    if (!currentClient.value) return [];
    // Convert currentClient ref back to plain Client object or pass as is if compatible
    // Use the `found` object logic essentially
    const found = clients.value.find((c: Client) => c.clientCode === route.params.code);
    if (!found) return [];

    return checkMaterialStatus(found, jobs.value);
});

// Watch for route change to fetch assets & jobs
watch(() => route.params.code, async (newCode) => {
    if (newCode && typeof newCode === 'string') {
        await fetchAssets(newCode);
        subscribeToClientJobs(newCode); // Subscribe to jobs for status check
    } else {
        fetchedBanks.value = [];
        fetchedCards.value = [];
    }
}, { immediate: true });


// Helper for masking Account numbers
const maskNumber = (num: string) => {
    if (!num || num.length < 4) return num;
    return '**** ' + num.slice(-4);
};

// ---------------------------------------------------------
// List View Logic
// ---------------------------------------------------------
const isCalendarLoading = ref(false);
const currentDateMock = moment(); // Strict Today

const viewYearStart = ref(2025); // Default start year

const sortedCalendarDocs = computed(() => {
    // Map Firestore Clients to UI List format (Code/Name)
    const list = clients.value.map((c: Client) => ({
        ...c,
        code: c.clientCode,
        name: c.companyName,
        type: 'corp', // Default
        jobId: c.clientCode
    }));

    return list.sort((a, b) => {
        // Simple Sort
        return a.code.localeCompare(b.code);
    });
});

const changeYear = (dir: 'next' | 'prev') => {
    isCalendarLoading.value = true;
    setTimeout(() => {
        if (dir === 'next') viewYearStart.value++;
        else viewYearStart.value--;

        isCalendarLoading.value = false;
    }, 400);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const goToCollectionDetail = (client: any) => {
    router.push({ name: 'ScreenC_Detail', params: { code: client.code } });
};

// --- Active Period Logic ---

const getDateForCell = (m: number) => {
    const year = m <= 12 ? viewYearStart.value : viewYearStart.value + 1;
    const month = m <= 12 ? m : m - 12;
    return moment(`${year}-${String(month).padStart(2, '0')}-01`);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getFiscalTermEnd = (client: any, targetDate: moment.Moment) => {
    const fiscalMonth = client.type === 'individual' ? 12 : client.fiscalMonth;
    const month = targetDate.month() + 1;
    let year = targetDate.year();
    if (month > fiscalMonth) {
        year++;
    }
    return moment(`${year}-${String(fiscalMonth).padStart(2, '0')}-01`).endOf('month');
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getActiveTerm1End = (client: any) => {
    const checkDate = currentDateMock.clone().subtract(2, 'years');
    const today = currentDateMock;

    for (let i = 0; i < 5; i++) {
        const termEnd = getFiscalTermEnd(client, checkDate);
        const filingOffset = client.type === 'individual' ? 3 : 2;
        const filingDeadline = termEnd.clone().add(filingOffset, 'months').endOf('month');

        if (today.isSameOrBefore(filingDeadline)) {
            return termEnd;
        }
        checkDate.add(1, 'year');
    }
    return getFiscalTermEnd(client, today);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getCellStyle = (client: any, m: number) => {
    const cellDate = getDateForCell(m);

    const term1End = getActiveTerm1End(client);
    const term1Start = term1End.clone().subtract(1, 'year').add(1, 'day');

    const term2End = term1End.clone().add(1, 'year');
    const term2Start = term1End.clone().add(1, 'day');

    if (cellDate.isBetween(term1Start, term1End, 'month', '[]')) {
        return 'bg-white'; // Active 1
    }
    if (cellDate.isBetween(term2Start, term2End, 'month', '[]')) {
        return 'bg-blue-50'; // Active 2
    }

    return 'bg-diagonal'; // Inactive
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const shouldShowIcon = (client: any, m: number) => {
    // 1. Must be Active Period
    if (getCellStyle(client, m) === 'bg-diagonal') return false;

    // 2. Must NOT be in the future (Strict Today)
    const cellDate = getDateForCell(m);

    if (cellDate.isAfter(currentDateMock, 'month')) {
        return false;
    }

    return true;
};


// ---------------------------------------------------------
// Existing Helpers
// ---------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getPeriodStatus = (client: any, m: number): number => {
    const seed = (client.jobId.charCodeAt(2) || 0) + m;
    const mod = seed % 10;
    if (mod < 2) return 0;
    if (mod === 2) return 2;
    return 1;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isFiscalMonth = (client: any, m: number): boolean => {
    const month = m <= 12 ? m : m - 12;
    return client.fiscalMonth === month;
};

// ---------------------------------------------------------
// Detail View Logic (unchanged)
// ---------------------------------------------------------
const c_config = ref({ cash: false, payroll: false, social: false, invoice: false });
const c_isSaving = ref(false);
const showCReportModal = ref(false);
const c_reportText = ref('');

const goBack = () => {
    router.push({ name: 'ScreenC' });
};

const saveCConfig = () => {
    c_isSaving.value = true;
    setTimeout(() => {
        c_isSaving.value = false;
        if (showToast) showToast('設定を保存しました', 'success');
    }, 800);
};

const openReportModal = () => {
    if (!currentClient.value) return;

    c_reportText.value = `
【資料回収報告】 ${currentClient.value.name} 様

いつも大変お世話になっております。
${new Date().getMonth() + 1}月分の資料回収状況についてご報告いたします。

■ 受領済み
・領収書 (11/25受領)
${currentClient.value.banks.filter(b => b.status === 'connected').map(b => `・${b.bankName} 通帳コピー`).join('\n') || ''}

■ 未受領 (至急ご手配ください)
${currentClient.value.creditCards.filter(c => c.status !== 'connected').map(c => `・${c.companyName} (${c.note || '未着'})`).join('\n') || ''}
${c_config.value.invoice ? '・請求書' : ''}

ご確認のほどよろしくお願いいたします。
    `.trim();
    showCReportModal.value = true;
};

const copyCReport = () => {
    navigator.clipboard.writeText(c_reportText.value);
    if (showToast) showToast('クリップボードにコピーしました', 'success');
    showCReportModal.value = false;
};

// ---------------------------------------------------------
// Registration Logic
// ---------------------------------------------------------
const showBankModal = ref(false);
const showCardModal = ref(false);

const bankForm = reactive({
    bankName: '',
    branchName: '',
    accountNumber: '',
    accountName: ''
});

const cardForm = reactive({
    companyName: '',
    cardNumber: '',
    withdrawalAccount: ''
});

const openBankModal = () => {
    bankForm.bankName = '';
    bankForm.branchName = '';
    bankForm.accountNumber = '';
    bankForm.accountName = '';
    showBankModal.value = true;
};

const openCardModal = () => {
    cardForm.companyName = '';
    cardForm.cardNumber = '';
    cardForm.withdrawalAccount = '';
    showCardModal.value = true;
};

const saveBank = async () => {
    if (!currentClient.value) return;
    const clientCode = currentClient.value.code;

    try {
        await FirestoreRepository.addBankAccount(clientCode, {
            bankName: bankForm.bankName,
            branchName: bankForm.branchName,
            accountNumber: bankForm.accountNumber,
            status: 'connected'
        });

        await fetchAssets(clientCode); // Refresh
        if (showToast) showToast('銀行口座を追加しました', 'success');
        showBankModal.value = false;
    } catch(e) {
        console.error(e);
        alert('追加に失敗しました');
    }
};

const saveCard = async () => {
    if (!currentClient.value) return;
    const clientCode = currentClient.value.code;

    try {
        await FirestoreRepository.addCreditCard(clientCode, {
            companyName: cardForm.companyName,
            brand: '不明',
            last4Digits: cardForm.cardNumber.slice(-4),
            status: 'connected'
        });

        await fetchAssets(clientCode); // Refresh
        if (showToast) showToast('クレジットカードを追加しました', 'success');
        showCardModal.value = false;
    } catch(e) {
        console.error(e);
        alert('追加に失敗しました');
    }
};

const deleteBank = async (id: string) => {
    if (!currentClient.value || !confirm('この銀行口座を削除してもよろしいですか？')) return;

    try {
        await FirestoreRepository.deleteBankAccount(currentClient.value.code, id);
        await fetchAssets(currentClient.value.code); // Refresh
        if (showToast) showToast('銀行口座を削除しました', 'success');
    } catch(e) {
        console.error(e);
        alert('削除に失敗しました');
    }
};

const deleteCard = async (id: string) => {
    if (!currentClient.value || !confirm('このクレジットカードを削除してもよろしいですか？')) return;

    try {
        await FirestoreRepository.deleteCreditCard(currentClient.value.code, id);
        await fetchAssets(currentClient.value.code); // Refresh
        if (showToast) showToast('クレジットカードを削除しました', 'success');
    } catch(e) {
        console.error(e);
        alert('削除に失敗しました');
    }
};

</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
}
.animate-fade-in-up {
    animation: fadeInUp 0.3s ease-out forwards;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Custom Scrollbar */
.overflow-auto::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}
.overflow-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
}
.overflow-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}

/* Diagonal Pattern - Matches HTML Linear Gradient */
.bg-diagonal {
    background-image: linear-gradient(45deg, #f1f5f9 25%, #ffffff 25%, #ffffff 50%, #f1f5f9 50%, #f1f5f9 75%, #ffffff 75%, #ffffff 100%);
    background-size: 8px 8px; /* HTML matches 8px */
}
</style>
