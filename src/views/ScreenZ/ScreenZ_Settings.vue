<template>
    <div class="animate-fade-in p-6 space-y-6">
        <!-- Header & Status -->
        <div class="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
                <h2 class="text-lg font-bold text-slate-700 flex items-center gap-2">
                    <i class="fa-solid fa-cogs"></i> システム設計・環境設定
                </h2>
                <div class="text-xs text-slate-400 mt-1">システム全体の定数およびAPI接続設定</div>
            </div>
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span class="w-2 h-2 rounded-full" :class="data.settings.systemStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'"></span>
                    <span class="font-mono font-bold text-sm text-slate-600">{{ data.settings.systemStatus }}</span>
                </div>
                <button @click="toggleSystemStatus" class="text-xs bg-slate-100 px-3 py-1.5 rounded font-bold border border-slate-300 hover:bg-slate-200 transition">
                    稼働切替
                </button>
                <button @click="saveSettings" class="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm">
                    <i class="fa-solid fa-save mr-1"></i> 設定を保存
                </button>
            </div>
        </div>

        <!-- Main Settings Sheet -->
        <section class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                <i class="fa-solid fa-sliders text-blue-600"></i> システム設定概要
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- 1. API & Base IDs -->

                <!-- Scene-specific AI Model Settings -->
                <div class="col-span-full space-y-4">
                    <h4 class="text-sm font-bold text-slate-700 border-l-4 border-blue-500 pl-2">シーン別モデル設定 (Scenario Settings)</h4>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <!-- 1. OCR Analysis -->
                        <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">Phase 1</span>
                                <h5 class="text-xs font-bold text-slate-700">仕訳OCR解析 (OCR)</h5>
                            </div>
                            <!-- Provider -->
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-500">AIプロバイダー設定 <span class="font-normal text-slate-400 ml-1">(推奨：Gemini API ※最新の視覚認識精度が高いため)</span></label>
                                <div class="flex gap-2">
                                    <label class="flex-1 cursor-pointer">
                                        <input type="radio" v-model="data.settings.aiPhases.ocr.provider" value="gemini" class="peer sr-only">
                                        <div class="px-2 py-1.5 bg-white border border-slate-300 rounded text-center text-xs text-slate-600 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 transition">Gemini API</div>
                                    </label>
                                    <label class="flex-1 cursor-pointer">
                                        <input type="radio" v-model="data.settings.aiPhases.ocr.provider" value="vertex" class="peer sr-only">
                                        <div class="px-2 py-1.5 bg-white border border-slate-300 rounded text-center text-xs text-slate-600 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 transition">Vertex AI</div>
                                    </label>
                                </div>
                            </div>
                            <!-- Mode -->
                             <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-500">処理モード選択 <span class="font-normal text-slate-400 ml-1">(推奨：通常 ※ユーザー待機時間を最小化するため)</span></label>
                                <div class="flex gap-2">
                                    <label class="flex-1 cursor-pointer">
                                        <input type="radio" v-model="data.settings.aiPhases.ocr.mode" value="normal" class="peer sr-only">
                                        <div class="px-2 py-1.5 bg-white border border-slate-300 rounded text-center text-xs text-slate-600 peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-600 transition">通常 (即時)</div>
                                    </label>
                                    <label class="flex-1 cursor-pointer">
                                        <input type="radio" v-model="data.settings.aiPhases.ocr.mode" value="batch" class="peer sr-only">
                                        <div class="px-2 py-1.5 bg-white border border-slate-300 rounded text-center text-xs text-slate-600 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600 transition">Batch API (半額)</div>
                                    </label>
                                </div>
                            </div>
                            <!-- Model Name -->
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-500">使用モデル名 <span class="font-normal text-slate-400 ml-1">(推奨：Gemini 3 Pro ※複雑な手書き文字に対応)</span></label>
                                <div class="relative">
                                    <select v-model="data.settings.aiPhases.ocr.modelName" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs text-slate-600 font-mono appearance-none bg-white focus:border-blue-500 transition">
                                        <option value="models/gemini-3-flash-001">gemini-3-flash-001 (安い)</option>
                                        <option value="models/gemini-3-pro-001">gemini-3-pro-001 (複雑な手書き文字)</option>
                                        <option value="models/gemini-3-deep-think-001">gemini-3-deep-think-001 (高度な論理説明や税務判断)</option>
                                    </select>
                                    <i class="fa-solid fa-chevron-down absolute right-2 top-2 text-slate-400 pointer-events-none text-[10px]"></i>
                                </div>
                            </div>
                        </div>

                        <!-- 2. Rule Learning -->
                        <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                             <div class="flex items-center gap-2 mb-2">
                                <span class="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded">Phase 2</span>
                                <h5 class="text-xs font-bold text-slate-700">AIルール生成・学習 (Learning)</h5>
                            </div>
                            <!-- Provider -->
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-500">AIプロバイダー設定 <span class="font-normal text-slate-400 ml-1">(推奨：Vertex AI ※安定した出力とガバナンスのため)</span></label>
                                <div class="flex gap-2">
                                    <label class="flex-1 cursor-pointer">
                                        <input type="radio" v-model="data.settings.aiPhases.learning.provider" value="gemini" class="peer sr-only">
                                        <div class="px-2 py-1.5 bg-white border border-slate-300 rounded text-center text-xs text-slate-600 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 transition">Gemini API</div>
                                    </label>
                                    <label class="flex-1 cursor-pointer">
                                        <input type="radio" v-model="data.settings.aiPhases.learning.provider" value="vertex" class="peer sr-only">
                                        <div class="px-2 py-1.5 bg-white border border-slate-300 rounded text-center text-xs text-slate-600 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 transition">Vertex AI</div>
                                    </label>
                                </div>
                            </div>
                            <!-- Mode -->
                             <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-500">処理モード選択 <span class="font-normal text-slate-400 ml-1">(推奨：Batch API ※大量データの学習コストを抑えるため)</span></label>
                                <div class="flex gap-2">
                                    <label class="flex-1 cursor-pointer">
                                        <input type="radio" v-model="data.settings.aiPhases.learning.mode" value="normal" class="peer sr-only">
                                        <div class="px-2 py-1.5 bg-white border border-slate-300 rounded text-center text-xs text-slate-600 peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-600 transition">通常 (即時)</div>
                                    </label>
                                    <label class="flex-1 cursor-pointer">
                                        <input type="radio" v-model="data.settings.aiPhases.learning.mode" value="batch" class="peer sr-only">
                                        <div class="px-2 py-1.5 bg-white border border-slate-300 rounded text-center text-xs text-slate-600 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600 transition">Batch API (半額)</div>
                                    </label>
                                </div>
                            </div>
                             <!-- Model Name -->
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-500">使用モデル名 <span class="font-normal text-slate-400 ml-1">(推奨：Gemini 3 Deep Think ※高度な論理説明や税務判断)</span></label>
                                <div class="relative">
                                    <select v-model="data.settings.aiPhases.learning.modelName" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs text-slate-600 font-mono appearance-none bg-white focus:border-blue-500 transition">
                                        <option value="models/gemini-3-flash-001">gemini-3-flash-001 (安い)</option>
                                        <option value="models/gemini-3-pro-001">gemini-3-pro-001 (複雑な手書き文字)</option>
                                        <option value="models/gemini-3-deep-think-001">gemini-3-deep-think-001 (高度な論理説明や税務判断)</option>
                                    </select>
                                    <i class="fa-solid fa-chevron-down absolute right-2 top-2 text-slate-400 pointer-events-none text-[10px]"></i>
                                </div>
                            </div>
                        </div>

                         <!-- 3. Data Conversion -->
                        <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                             <div class="flex items-center gap-2 mb-2">
                                <span class="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded">Phase 3</span>
                                <h5 class="text-xs font-bold text-slate-700">データ変換 (Conversion)</h5>
                            </div>
                            <!-- Provider -->
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-500">AIプロバイダー設定 <span class="font-normal text-slate-400 ml-1">(推奨：Vertex AI ※厳格なフォーマット遵守が求められるため)</span></label>
                                <div class="flex gap-2">
                                    <label class="flex-1 cursor-pointer">
                                        <input type="radio" v-model="data.settings.aiPhases.conversion.provider" value="gemini" class="peer sr-only">
                                        <div class="px-2 py-1.5 bg-white border border-slate-300 rounded text-center text-xs text-slate-600 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 transition">Gemini API</div>
                                    </label>
                                    <label class="flex-1 cursor-pointer">
                                        <input type="radio" v-model="data.settings.aiPhases.conversion.provider" value="vertex" class="peer sr-only">
                                        <div class="px-2 py-1.5 bg-white border border-slate-300 rounded text-center text-xs text-slate-600 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 transition">Vertex AI</div>
                                    </label>
                                </div>
                            </div>
                            <!-- Mode -->
                             <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-500">処理モード選択 <span class="font-normal text-slate-400 ml-1">(推奨：Batch API ※一括変換時のコストを抑えるため)</span></label>
                                <div class="flex gap-2">
                                    <label class="flex-1 cursor-pointer">
                                        <input type="radio" v-model="data.settings.aiPhases.conversion.mode" value="normal" class="peer sr-only">
                                        <div class="px-2 py-1.5 bg-white border border-slate-300 rounded text-center text-xs text-slate-600 peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-600 transition">通常 (即時)</div>
                                    </label>
                                    <label class="flex-1 cursor-pointer">
                                        <input type="radio" v-model="data.settings.aiPhases.conversion.mode" value="batch" class="peer sr-only">
                                        <div class="px-2 py-1.5 bg-white border border-slate-300 rounded text-center text-xs text-slate-600 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600 transition">Batch API (半額)</div>
                                    </label>
                                </div>
                            </div>
                             <!-- Model Name -->
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-500">使用モデル名 <span class="font-normal text-slate-400 ml-1">(推奨：Gemini 3 Flash ※安い)</span></label>
                                <div class="relative">
                                    <select v-model="data.settings.aiPhases.conversion.modelName" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs text-slate-600 font-mono appearance-none bg-white focus:border-blue-500 transition">
                                        <option value="models/gemini-3-flash-001">gemini-3-flash-001 (安い)</option>
                                        <option value="models/gemini-3-pro-001">gemini-3-pro-001 (複雑な手書き文字)</option>
                                        <option value="models/gemini-3-deep-think-001">gemini-3-deep-think-001 (高度な論理説明や税務判断)</option>
                                    </select>
                                    <i class="fa-solid fa-chevron-down absolute right-2 top-2 text-slate-400 pointer-events-none text-[10px]"></i>
                                </div>
                            </div>
                        </div>

                         <!-- 4. Optimization -->
                        <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                             <div class="flex items-center gap-2 mb-2">
                                <span class="bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded">Phase 4</span>
                                <h5 class="text-xs font-bold text-slate-700">知識最適化・監査 (Optimization)</h5>
                            </div>
                            <!-- Provider -->
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-500">AIプロバイダー設定 <span class="font-normal text-slate-400 ml-1">(推奨：Vertex AI ※大規模コンテキストの処理が安定しているため)</span></label>
                                <div class="flex gap-2">
                                    <label class="flex-1 cursor-pointer">
                                        <input type="radio" v-model="data.settings.aiPhases.optimization.provider" value="gemini" class="peer sr-only">
                                        <div class="px-2 py-1.5 bg-white border border-slate-300 rounded text-center text-xs text-slate-600 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 transition">Gemini API</div>
                                    </label>
                                    <label class="flex-1 cursor-pointer">
                                        <input type="radio" v-model="data.settings.aiPhases.optimization.provider" value="vertex" class="peer sr-only">
                                        <div class="px-2 py-1.5 bg-white border border-slate-300 rounded text-center text-xs text-slate-600 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 transition">Vertex AI</div>
                                    </label>
                                </div>
                            </div>
                            <!-- Mode -->
                             <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-500">処理モード選択 <span class="font-normal text-slate-400 ml-1">(推奨：Batch API ※夜間バッチでの実行に適しているため)</span></label>
                                <div class="flex gap-2">
                                    <label class="flex-1 cursor-pointer">
                                        <input type="radio" v-model="data.settings.aiPhases.optimization.mode" value="normal" class="peer sr-only">
                                        <div class="px-2 py-1.5 bg-white border border-slate-300 rounded text-center text-xs text-slate-600 peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-600 transition">通常 (即時)</div>
                                    </label>
                                    <label class="flex-1 cursor-pointer">
                                        <input type="radio" v-model="data.settings.aiPhases.optimization.mode" value="batch" class="peer sr-only">
                                        <div class="px-2 py-1.5 bg-white border border-slate-300 rounded text-center text-xs text-slate-600 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600 transition">Batch API (半額)</div>
                                    </label>
                                </div>
                            </div>
                             <!-- Model Name -->
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-500">使用モデル名 <span class="font-normal text-slate-400 ml-1">(推奨：Gemini 3 Deep Think ※高度な論理説明や税務判断)</span></label>
                                <div class="relative">
                                    <select v-model="data.settings.aiPhases.optimization.modelName" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs text-slate-600 font-mono appearance-none bg-white focus:border-blue-500 transition">
                                        <option value="models/gemini-3-flash-001">gemini-3-flash-001 (安い)</option>
                                        <option value="models/gemini-3-pro-001">gemini-3-pro-001 (複雑な手書き文字)</option>
                                        <option value="models/gemini-3-deep-think-001">gemini-3-deep-think-001 (高度な論理説明や税務判断)</option>
                                    </select>
                                    <i class="fa-solid fa-chevron-down absolute right-2 top-2 text-slate-400 pointer-events-none text-[10px]"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-500 uppercase">国税局アプリケーションID</label>
                    <input type="text" v-model="data.settings.invoiceApiKey" class="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 transition">
                </div>
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-500 uppercase">SYSTEM_ROOT_ID</label>
                    <input type="text" v-model="data.settings.systemRootId" class="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 transition" placeholder="1ZWiIS73fPVaS5MrxI0-9lw_RTj43wZyG">
                    <p class="text-[10px] text-gray-400">全顧問先フォルダを格納する親フォルダのGoogle Drive ID</p>
                </div>
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-500 uppercase">MASTER_SS_ID</label>
                    <input type="text" v-model="data.settings.masterSsId" class="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 transition" placeholder="例: 1XyZ...">
                    <p class="text-[10px] text-gray-400">本システム本体（00_管理用）のスプレッドシートID</p>
                </div>

                <!-- 2. AI Model & Pricing -->
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">使用モデル名（費用概算用）</label>
                    <div class="relative">
                        <select v-model="data.settings.modelName" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono appearance-none bg-slate-50 focus:border-blue-500 transition">
                            <option value="models/gemini-3-flash-001">gemini-3-flash-001 (安い)</option>
                            <option value="models/gemini-3-pro-001">gemini-3-pro-001 (複雑な手書き文字)</option>
                            <option value="models/gemini-3-deep-think-001">gemini-3-deep-think-001 (高度な論理説明や税務判断)</option>
                        </select>
                        <i class="fa-solid fa-chevron-down absolute right-3 top-3 text-slate-400 pointer-events-none text-xs"></i>
                    </div>
                </div>
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">為替レート (JPY/USD)</label>
                     <input type="number" v-model="data.settings.exchangeRate" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                </div>
                <div class="space-y-2 col-span-1 md:col-span-2 lg:col-span-3">
                    <div class="grid grid-cols-2 gap-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                        <div>
                            <label class="block text-[10px] font-bold text-blue-600 mb-1">API入力単価 ($/1M Token)</label>
                            <input type="number" v-model="data.settings.apiPriceInput" class="w-full px-2 py-1 border border-blue-200 rounded text-xs font-mono bg-white text-slate-600" readonly>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-blue-600 mb-1">API出力単価 ($/1M Token)</label>
                            <input type="number" v-model="data.settings.apiPriceOutput" class="w-full px-2 py-1 border border-blue-200 rounded text-xs font-mono bg-white text-slate-600" readonly>
                        </div>
                    </div>
                    <!-- Cost Estimate -->
                    <div class="mt-2 p-3 bg-orange-50/50 rounded-lg border border-orange-100 flex items-center justify-between">
                        <div>
                            <label class="block text-[10px] font-bold text-orange-600">領収書1000枚当たりの処理費目安</label>
                            <div class="text-[10px] text-orange-400 mt-0.5">※ 入力1000token/枚, 出力500token/枚, 1$={{data.settings.exchangeRate}}円 で試算</div>
                        </div>
                        <div class="text-right">
                             <div class="text-xl font-bold font-mono text-orange-600">
                                 ¥{{ Math.round(((data.settings.apiPriceInput * 1000 + data.settings.apiPriceOutput * 500) / 1000000 * 1000) * data.settings.exchangeRate).toLocaleString() }}
                             </div>
                        </div>
                    </div>
                </div>

                <!-- 3. Scheduling & Limits -->
                <!-- 3. Scheduling & Limits -->
                 <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">ドラフト生成・監視間隔(分)</label>
                    <input type="number" min="1" v-model="data.settings.intervalDispatchMin" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                    <div class="text-[10px] text-slate-400">未処理の領収書を検知してジョブを作成する間隔</div>
                </div>
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">Batch API結果確認間隔(分)</label>
                    <input type="number" min="1" v-model="data.settings.intervalWorkerMin" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                </div>
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">学習処理間隔(分)</label>
                    <input type="number" min="1" v-model="data.settings.intervalLearnerMin" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                </div>
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">最終確認整形間隔(分)</label>
                    <input type="number" min="1" v-model="data.settings.intervalValidatorMin" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                </div>
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">知識最適化間隔(日)</label>
                    <input type="number" min="1" v-model="data.settings.intervalOptimizerDays" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                </div>
                 <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">完了通知時刻 (カンマ区切り)</label>
                    <input type="text" v-model="data.settings.notifyHours" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono" placeholder="9,12,15,18">
                </div>
                 <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">最大処理件数/1回 (Batch Size)</label>
                    <input type="number" min="1" v-model="data.settings.maxBatchSize" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                    <div class="text-[10px] text-slate-400">Batch API利用時の1リクエストあたりの推奨: 10~50件</div>
                </div>
                <div class="space-y-2">
                     <label class="block text-xs font-bold text-slate-600 mb-1">タイムアウト秒</label>
                     <input type="number" min="1" v-model="data.settings.gasTimeoutLimit" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                </div>
                 <div class="space-y-2">
                     <label class="block text-xs font-bold text-slate-600 mb-1">最大リトライ回数</label>
                     <input type="number" min="1" v-model="data.settings.maxAttemptLimit" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                </div>
                <div class="space-y-2">
                     <label class="block text-xs font-bold text-slate-600 mb-1">最適化処理数/1回</label>
                     <input type="number" min="1" v-model="data.settings.maxOptBatch" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                </div>
                 <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">ジョブ履歴保持期間(日)</label>
                     <input type="number" min="1" v-model="data.settings.dataRetentionDays" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                     <div class="text-[10px] text-red-400 font-bold">※会計データ本体は削除されません</div>
                </div>
                <div class="space-y-2 col-span-1 md:col-span-2">
                     <label class="block text-xs font-bold text-slate-600 mb-1">Slack Webhook URL (通知用)</label>
                     <input type="text" v-model="data.settings.slackWebhookUrl" class="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono" placeholder="https://hooks.slack.com/services/...">
                </div>
            </div>

            <!-- Debug at bottom -->
            <div class="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                 <div>
                     <div class="font-bold text-slate-700 text-xs">デバッグモード (DEBUG_MODE)</div>
                     <div class="text-[10px] text-slate-400">詳細ログを出力します</div>
                 </div>
                 <div class="relative">
                    <input type="checkbox" v-model="data.settings.debugMode" class="sr-only peer">
                    <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </div>
             </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue';
import { useAdminDashboard } from '@/composables/useAdminDashboard';

const { data, fetchSettings, saveAiSettings } = useAdminDashboard();

// Auto-set API Prices based on Model Selection (2026 Pricing)
watch(() => data.value.settings.modelName, (newModel) => {
    switch (newModel) {
        case 'models/gemini-3-flash-001':
            data.value.settings.apiPriceInput = 0.50;
            data.value.settings.apiPriceOutput = 3.00;
            break;
        case 'models/gemini-3-pro-001':
            data.value.settings.apiPriceInput = 2.00;
            data.value.settings.apiPriceOutput = 12.00;
            break;
        case 'models/gemini-3-deep-think-001':
            data.value.settings.apiPriceInput = 5.00;
            data.value.settings.apiPriceOutput = 15.00;
            break;
    }
});

const toggleSystemStatus = () => {
    if (data.value.settings.systemStatus === 'ACTIVE') {
        data.value.settings.systemStatus = 'PAUSE';
    } else {
        data.value.settings.systemStatus = 'ACTIVE';
    }
};

const saveSettings = async () => {
    try {
        await saveAiSettings();
        alert('設定を保存しました (Firestore同期完了)');
    } catch (e: any) {
        alert('保存に失敗しました: ' + e.message);
    }
};

onMounted(() => {
    fetchSettings();
});
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
