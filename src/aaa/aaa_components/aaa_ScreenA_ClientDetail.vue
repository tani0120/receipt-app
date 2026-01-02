<template>
    <div class="h-full flex flex-col bg-slate-50 font-sans text-slate-800">
        <!-- Header Area -->
        <header class="bg-white border-b border-gray-200 px-8 py-6 shadow-sm shrink-0">
            <!-- Top Row: Navigation & Edit -->
            <div class="flex items-center justify-between mb-4">
                <button @click="$router.push({ name: 'aaa_ScreenA' })" class="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                    <i class="fa-solid fa-arrow-left"></i> 顧問先一覧に戻る
                </button>
                <button class="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded shadow-sm text-sm font-bold transition flex items-center gap-2">
                    <i class="fa-solid fa-pen"></i> 修正
                </button>
            </div>

            <!-- Main Info Row -->
            <div class="flex flex-col gap-4">
                <!-- Line 1: Basic Stats -->
                <div class="flex flex-wrap items-center gap-4">
                    <span class="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded border border-green-200">稼働中</span>
                    <span class="bg-slate-800 text-white font-mono text-sm font-bold px-2 py-1 rounded">AMT</span>
                    <h1 class="text-2xl font-bold text-slate-900">アマテラス商事</h1>
                    <span class="bg-blue-50 text-blue-700 border border-blue-100 text-xs px-2 py-0.5 rounded font-bold">12月決算</span>
                    <div class="flex items-center gap-2 text-sm text-slate-600">
                        <i class="fa-solid fa-desktop text-slate-400"></i>
                        <span class="font-bold">freee</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-slate-600">
                        <i class="fa-solid fa-user-tie text-slate-400"></i>
                        <span>担当: <span class="font-bold">山田 太郎</span></span>
                    </div>
                    <div class="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                        第5期 (2025/01/01 ～ 2025/12/31)
                    </div>
                </div>

                <!-- Line 2: Tax & Accounting Details -->
                <div class="flex flex-wrap items-center gap-3">
                    <div class="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs">
                        <span class="text-slate-400 font-bold">課税区分</span>
                        <span class="font-bold text-slate-700">原則課税</span>
                    </div>
                    <div class="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs">
                        <span class="text-slate-400 font-bold">計上基準</span>
                        <span class="font-bold text-slate-700">発生主義</span>
                    </div>
                    <div class="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs">
                        <span class="text-slate-400 font-bold">申告種類</span>
                        <span class="font-bold text-blue-600">青色申告</span>
                    </div>
                </div>

                <!-- Line 3: Drive Links -->
                <div class="flex flex-wrap gap-3 mt-2">
                    <a href="#" class="flex items-center gap-2 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 text-slate-600 px-4 py-2 rounded transition shadow-sm text-sm font-bold">
                        <i class="fa-brands fa-google-drive text-yellow-400 text-lg"></i>
                        顧客共有用フォルダ
                    </a>
                    <a href="#" class="flex items-center gap-2 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 text-slate-600 px-4 py-2 rounded transition shadow-sm text-sm font-bold">
                        <i class="fa-brands fa-google-drive text-blue-400 text-lg"></i>
                        仕訳出力結果保管用フォルダ
                    </a>
                    <a href="#" class="flex items-center gap-2 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 text-slate-600 px-4 py-2 rounded transition shadow-sm text-sm font-bold">
                        <i class="fa-brands fa-google-drive text-gray-400 text-lg"></i>
                        仕訳除外ファイル用フォルダ
                    </a>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1 overflow-y-auto px-8 py-8 space-y-8">

            <!-- Section: Learning CSV Storage Area -->
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
                                <div class="flex items-center justify-between bg-white border border-slate-200 p-3 rounded text-sm hover:border-indigo-200 transition">
                                    <div class="flex items-center gap-3">
                                        <i class="fa-solid fa-file-csv text-green-500 text-lg"></i>
                                        <span class="font-mono text-slate-700">2024年12月決算_総勘定元帳CSV_20240101-20241231.csv</span>
                                    </div>
                                    <button class="text-slate-400 hover:text-red-500 transition px-2">
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
                                <div class="flex items-center justify-between bg-white border border-slate-200 p-3 rounded text-sm hover:border-indigo-200 transition">
                                    <div class="flex items-center gap-3">
                                        <i class="fa-solid fa-file-csv text-blue-500 text-lg"></i>
                                        <span class="font-mono text-slate-700">2024年12月決算_仕訳帳CSV_20240101-20241231.csv</span>
                                    </div>
                                    <button class="text-slate-400 hover:text-red-500 transition px-2">
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
                                <div class="flex items-center justify-between bg-white border border-slate-200 p-3 rounded text-sm hover:border-indigo-200 transition">
                                    <div class="flex items-center gap-3">
                                        <i class="fa-solid fa-file-pdf text-red-500 text-lg"></i>
                                        <span class="font-mono text-slate-700">2024年12月決算_決算申告書.pdf</span>
                                    </div>
                                    <button class="text-slate-400 hover:text-red-500 transition px-2">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Section: AI Knowledge Prompt Area -->
            <section class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Left: AI Proposals -->
                <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
                    <h2 class="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-robot text-purple-500"></i> AI提案ルール
                    </h2>
                    <div class="flex-1 overflow-auto border border-slate-100 rounded-lg">
                        <table class="w-full text-sm text-left">
                            <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                <tr>
                                    <th class="px-4 py-3 whitespace-nowrap">コード / 会社名</th>
                                    <th class="px-4 py-3">AI提案内容・理由・効果</th>
                                    <th class="px-4 py-3 w-32">アクション</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 text-slate-700">
                                <tr class="hover:bg-slate-50/50">
                                    <td class="px-4 py-3 align-top">
                                        <div class="font-mono font-bold">AMT</div>
                                        <div class="text-xs text-slate-500">アマテラス商事</div>
                                    </td>
                                    <td class="px-4 py-3 align-top">
                                        <p class="leading-relaxed">
                                            <span class="font-bold text-purple-600">提案:</span> ドールト社の領収書は駐車場だが、過去仕訳では3回「旅費交通費」で計上。次回から「旅費交通費」で統一する。
                                        </p>
                                    </td>
                                    <td class="px-4 py-3 align-top">
                                        <div class="flex flex-col gap-1.5">
                                            <button class="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded font-bold transition">承認</button>
                                            <button class="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs rounded transition">修正</button>
                                            <button class="px-2 py-1 text-slate-400 hover:text-red-500 text-xs transition">却下</button>
                                        </div>
                                    </td>
                                </tr>
                                <!-- More mock rows if needed -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Right: Current AI Rules (Editor) -->
                <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-bold text-slate-700 flex items-center gap-2">
                            <i class="fa-solid fa-scroll text-emerald-500"></i> 現時点のAI知識プロンプト
                        </h2>
                        <button class="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-full font-bold transition">
                            <i class="fa-solid fa-pen mr-1"></i> 修正
                        </button>
                    </div>

                    <div class="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-sm leading-relaxed text-slate-700 overflow-y-auto whitespace-pre-wrap">【固有ルール】
・Amazonの領収書は「消耗品費」ではなく、金額5万円以上なら「工具器具備品」として提案すること。
・「カフェ・ベローチェ」は会議費として処理する。
・インボイス登録番号のないタクシー利用は「旅費交通費(免税)」とすること。</div>
                </div>
            </section>

        </main>
    </div>
</template>

<script setup lang="ts">
// Phase A: Visual Truth (v2)
// Implementing new layout based on specification.
// All data is hardcoded for visual verification.
</script>
