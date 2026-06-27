<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans" @click="closeDropdown">
    <!-- 決算年度バー（期間フィルタ） -->
    <div
      class="bg-white px-3 py-[3px] flex items-center gap-2 text-[10px] text-gray-600 border-b border-gray-200"
      style="min-height: 26px; user-select: none"
      @mousedown.prevent="onBarMouseDown"
    >
      <!-- 年度ピル（直近3期分、ドラッグでまとめて選択/解除） -->
      <div class="flex items-center gap-[3px] pl-1">
        <button
          v-for="fy in fiscalYearOptions"
          :key="fy.year"
          :data-drag-year="fy.year"
          @mousedown.prevent.stop="onYearMouseDown(fy.year)"
          @mouseenter="onYearMouseEnter(fy.year)"
          class="px-2 py-[1px] rounded text-[10px] font-medium transition-colors cursor-pointer"
          :class="yearPillClass(fy.year)"
        >{{ fy.label }}</button>
      </div>
      <!-- 区切り線 -->
      <div class="border-l border-gray-300 h-3.5"></div>
      <!-- 選択期間テキスト -->
      <span class="text-[10px] text-gray-500 whitespace-nowrap">{{ fiscalPeriodLabel }}</span>
      <!-- 区切り線 -->
      <div class="border-l border-gray-300 h-3.5"></div>
      <!-- 月タブ（ドラッグでまとめて選択/解除） -->
      <div class="flex items-center gap-[2px] px-1">
        <button
          v-for="m in fiscalMonthTabs"
          :key="m"
          :data-drag-month="m"
          @mousedown.prevent.stop="onMonthMouseDown(m)"
          @mouseenter="onMonthMouseEnter(m)"
          class="w-[22px] h-[18px] rounded text-[10px] text-center leading-[18px] transition-colors cursor-pointer"
          :class="monthTabClass(m)"
        >{{ m }}</button>
      </div>
      <!-- 未仕訳取込ボタン -->
      <button
        class="ml-2 px-3 py-[3px] rounded text-[11px] font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm"
        :class="isDriveImporting
          ? 'bg-gray-300 text-gray-500 cursor-wait'
          : 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 cursor-pointer'"
        :disabled="isDriveImporting"
        @mousedown.stop
        @click.stop="showDriveImportModal"
        title="Driveから未仕訳ファイルを取り込み"
      >
        <i :class="isDriveImporting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-download'" class="text-[10px]"></i>
        未仕訳取込
      </button>
      <!-- 売上/経費/差額サマリー -->
      <div class="ml-auto flex items-center gap-4 text-[14px] font-mono whitespace-nowrap pr-1">
        <span class="text-blue-600 font-semibold">売上 <span class="font-bold text-[15px]">{{ formatSummaryAmount(journalSummary.revenue) }}</span></span>
        <span class="text-red-500 font-semibold">経費 <span class="font-bold text-[15px]">{{ formatSummaryAmount(journalSummary.expense) }}</span></span>
        <span
          class="font-bold text-[15px] px-2 py-[2px] rounded"
          :class="journalSummary.profit >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'"
        >差額 {{ formatSummaryAmount(journalSummary.profit) }}</span>
      </div>
    </div>
    <!-- L3ツールバー（共通ナビバー） -->
    <!-- 上部バー -->
    <div
      class="bg-white px-3 py-[5.2px] flex justify-between items-center text-[10px] text-gray-700"
    >
      <!-- フィルタモード（通常時） -->
      <template v-if="!isSelectionMode">
        <div class="flex items-center gap-3 text-[11px]">
          <div class="flex items-center gap-1" data-search-drop>
            <i class="fa-solid fa-magnifying-glass text-[10px] text-gray-400"></i>
            <input
              type="text"
              v-model="globalSearchQuery"
              :placeholder="UI_MSG.全列検索"
              class="border text-[11px] px-2 py-0.5 rounded w-48 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              :class="isSearchDropTarget
                ? 'border-green-500 bg-green-50 ring-2 ring-green-400 text-green-800'
                : 'border-blue-400 text-blue-700'"
            />
            <button
              v-if="globalSearchQuery"
              @click="globalSearchQuery = ''"
              class="text-red-500 hover:text-red-700 text-[13px] font-bold -ml-6 z-10"
            >
              ✕
            </button>
          </div>
          <label class="flex items-center gap-1 cursor-pointer"
            ><input
              type="checkbox"
              v-model="showUnexported"
              class="w-2.5 h-2.5"
            />未出力を表示</label
          >
          <!-- 「過去出力済を表示」廃止: 出力済みはダウンロード履歴画面で確認。仕訳一覧に混在表示しない -->
          <label class="flex items-center gap-1 cursor-pointer"
            ><input type="checkbox" v-model="showImported" class="w-2.5 h-2.5" />取込仕訳（MCP取込 / CSV取込）</label
          >
          <label class="flex items-center gap-1 cursor-pointer"
            ><input
              type="checkbox"
              v-model="showExcluded"
              class="w-2.5 h-2.5"
            />出力対象外を表示</label
          >
          <label class="flex items-center gap-1 cursor-pointer"
            ><input type="checkbox" v-model="showTrashed" class="w-2.5 h-2.5" />ゴミ箱を表示</label
          >
          <div class="border-l-2 border-gray-400 h-4 mx-1"></div>
          <div class="flex items-center gap-0.5">
            <span class="text-gray-400 text-[11px] mr-0.5">証票</span>
            <button
              v-for="vf in voucherFilterOptions"
              :key="vf.key"
              @click="voucherFilter = voucherFilter === vf.key ? '' : vf.key"
              :class="[
                'px-1.5 py-0.5 rounded text-[11px] border transition-colors',
                voucherFilter === vf.key
                  ? 'bg-blue-600 text-white border-blue-600 font-bold'
                  : 'border-gray-300 text-gray-500 hover:bg-gray-100',
              ]"
            >
              {{ vf.label }}
            </button>
          </div>
        </div>
      </template>
      <!-- アクションモード（選択時） -->
      <template v-else>
        <div class="flex items-center gap-2">
          <span class="text-blue-600 font-bold">{{ selectedIds.size }}件選択中</span>
          <button
            @click="clearSelection"
            class="text-gray-500 hover:text-gray-700 px-1"
            :title="UI_MSG.ツールチップ_選択解除"
          >
            ✖
          </button>
          <div class="border-l border-gray-300 h-4 mx-1"></div>
          <div class="flex border border-gray-300 rounded overflow-hidden">
            <button @click="bulkSetReadStatus(false)" class="px-2 py-0.5 hover:bg-gray-100">
              📖 未読
            </button>
            <button
              @click="bulkSetReadStatus(true)"
              class="px-2 py-0.5 hover:bg-gray-100 border-l border-gray-300"
            >
              📖 既読
            </button>
          </div>
          <div class="flex border border-gray-300 rounded overflow-hidden">
            <button @click="bulkSetExportExclude(true)" class="px-2 py-0.5 hover:bg-gray-100">
              📤 対象外
            </button>
            <button
              @click="bulkSetExportExclude(false)"
              class="px-2 py-0.5 hover:bg-gray-100 border-l border-gray-300"
            >
              📤 対象
            </button>
          </div>
          <button
            @click="showBulkCopyDialog"
            class="px-2 py-0.5 border border-gray-300 rounded hover:bg-gray-100"
          >
            📋 コピー
          </button>
          <button
            @click="showBulkTrashDialog"
            class="px-2 py-0.5 border border-red-300 rounded hover:bg-red-50 text-red-600"
          >
            🗑 ゴミ箱
          </button>
          <div class="border-l-2 border-gray-400 h-4 mx-1"></div>
          <div class="flex items-center gap-0.5">
            <span class="text-gray-400 text-[9px] mr-0.5">証票</span>
            <button
              v-for="vf in voucherFilterOptions"
              :key="vf.key"
              @click="voucherFilter = voucherFilter === vf.key ? '' : vf.key"
              :class="[
                'px-1.5 py-0.5 rounded text-[9px] border transition-colors',
                voucherFilter === vf.key
                  ? 'bg-blue-600 text-white border-blue-600 font-bold'
                  : 'border-gray-300 text-gray-500 hover:bg-gray-100',
              ]"
            >
              {{ vf.label }}
            </button>
          </div>
        </div>
      </template>
      <!-- 行の背景色 凡例（両モードで表示） -->
      <div class="flex items-center gap-2">
        <button
          :disabled="undoStack.length === 0"
          :class="[
            'text-[13px] font-bold flex items-center gap-0.5 transition-all',
            undoStack.length > 0
              ? 'text-orange-600 hover:text-orange-800'
              : 'text-gray-300 cursor-not-allowed',
          ]"
          @click="undo()"
          :title="UI_MSG.ツールチップ_元に戻す"
        >
          <i class="fa-solid fa-rotate-left text-[10px]"></i>戻す
        </button>
        <button
          :disabled="redoStack.length === 0"
          :class="[
            'text-[13px] font-bold flex items-center gap-0.5 transition-all',
            redoStack.length > 0
              ? 'text-orange-600 hover:text-orange-800'
              : 'text-gray-300 cursor-not-allowed',
          ]"
          @click="redo()"
          :title="UI_MSG.ツールチップ_やり直し"
        >
          <i class="fa-solid fa-rotate-right text-[10px]"></i>進める
        </button>
        <span class="text-gray-300">|</span>
        <button
          class="text-[13px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 transition-all"
          @click="resetColWidths()"
          :title="UI_MSG.ツールチップ_列幅リセット"
        >
          <i class="fa-solid fa-arrows-left-right text-[10px]"></i>列幅リセット
        </button>
      </div>
    </div>
    <!-- 初回選択ヘルプ（fadeOut） -->
    <div
      v-if="showSelectionHelp"
      class="bg-blue-50 text-blue-700 text-[10px] px-3 py-1 text-center transition-opacity duration-1000"
      :class="{ 'opacity-0': !showSelectionHelp }"
    >
      💡 チェックを入れると一括操作バーに切り替わります。全解除でフィルタに戻ります。
    </div>


    <!-- テーブルラッパー（横スクロール+縦スクロール） -->
    <div class="flex-1 overflow-x-auto overflow-y-scroll">
      <!-- テーブルヘッダー（25列） -->
      <div
        v-if="sortColumn"
        class="bg-orange-100 px-3 py-1.5 flex items-center justify-center gap-3 border-b-2 border-orange-300"
      >
        <span class="text-[15px] font-bold text-orange-800"
          >ソート中:
          {{ journalColumns.find((c) => c.sortKey === sortColumn)?.label ?? sortColumn }}</span
        >
        <button
          class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-[12px] font-bold rounded shadow-sm"
          @click="resetToDefaultOrder"
        >
          デフォルト順
        </button>
      </div>
      <div
        class="bg-blue-100 text-gray-800 text-[10px] flex border-b border-gray-300 min-w-[1400px] sticky top-0 z-10"
      >
        <div
          v-for="col in journalColumns"
          :key="col.key"
          :class="[
            col.defaultPx === 0 ? col.width : '',
            'p-1 flex items-center justify-center relative',
            col.type !== 'action' ? 'border-r border-gray-300' : '',
            col.key === 'debit.amount' ? 'border-r-2 border-r-blue-300' : '',
            col.sortKey ? 'cursor-pointer hover:bg-blue-200' : '',
            col.sortKey && sortColumn === col.sortKey ? 'bg-red-100 font-bold' : '',
          ]"
          :style="col.defaultPx > 0 ? { width: columnWidths[col.key] + 'px', flexShrink: 0 } : {}"
          @click="col.sortKey && sortBy(col.sortKey)"
        >
          <!-- checkbox列ヘッダー: 全選択/全解除 -->
          <template v-if="col.type === 'checkbox'">
            <input
              type="checkbox"
              class="w-2.5 h-2.5 cursor-pointer"
              :checked="isAllSelected"
              @change="toggleSelectAll"
            />
          </template>
          <template v-else>
            <span class="flex items-center gap-0.5">
              {{ col.label }}
              <span
                v-if="
                  col.key === 'labelType' || col.key === 'warning' || col.key === 'voucher_type'
                "
                class="relative inline-flex"
                @mouseenter="legendModalType = col.key as 'labelType' | 'warning' | 'voucher_type'"
                @mouseleave="legendModalType = null"
              >
                <span
                  class="inline-flex items-center justify-center w-3 h-3 rounded-full bg-gray-800 text-white text-[7px] font-bold cursor-pointer hover:bg-blue-600 shrink-0"
                  >?</span
                >
                <!-- 証票ポップオーバー -->
                <div
                  v-if="legendModalType === 'labelType' && col.key === 'labelType'"
                  class="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-110 transform scale-[0.9] origin-top"
                >
                  <div
                    class="bg-gray-900/90 rounded-xl shadow-2xl w-56 overflow-hidden border border-gray-700"
                  >
                    <div
                      class="flex items-center justify-between px-3 py-2 border-b border-gray-700"
                    >
                      <span class="text-white font-bold text-[13px] flex items-center gap-1"
                        >📋 証票種類</span
                      >
                    </div>
                    <div class="p-2 space-y-0.5">
                      <div
                        v-for="item in labelTypeLegend"
                        :key="item.short"
                        class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800/60 transition-colors"
                      >
                        <span
                          class="inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold text-white"
                          :class="item.bgClass"
                          >{{ item.short }}</span
                        >
                        <span class="text-gray-200 text-[12px]">{{ item.label }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- 警告ポップオーバー -->
                <div
                  v-if="legendModalType === 'warning' && col.key === 'warning'"
                  class="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-110 transform scale-[0.9] origin-top"
                >
                  <div
                    class="bg-gray-900/90 rounded-xl shadow-2xl w-60 overflow-hidden border border-gray-700"
                  >
                    <div
                      class="flex items-center justify-between px-3 py-2 border-b border-gray-700"
                    >
                      <span class="text-white font-bold text-[13px] flex items-center gap-1"
                        >⚠️ 警告ラベル一覧</span
                      >
                    </div>
                    <div class="p-2">
                      <div class="mb-2">
                        <div class="flex items-center gap-1 px-1.5 py-0.5">
                          <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          <span class="text-red-400 text-[14px] font-bold">エラー（赤）</span>
                        </div>
                        <div
                          v-for="[, item] in errorLegend"
                          :key="item.label"
                          class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800/60 transition-colors"
                        >
                          <span class="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                          <span class="text-gray-200 text-[12px]">{{ item.label }}</span>
                        </div>
                      </div>
                      <div>
                        <div class="flex items-center gap-1 px-1.5 py-0.5">
                          <span class="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                          <span class="text-yellow-400 text-[14px] font-bold">注意（黄）</span>
                        </div>
                        <div
                          v-for="[, item] in warnLegend"
                          :key="item.label"
                          class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800/60 transition-colors"
                        >
                          <span class="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0"></span>
                          <span class="text-gray-200 text-[12px]">{{ item.label }}</span>
                        </div>
                      </div>
                      <div v-if="infoLegend.length > 0">
                        <div class="flex items-center gap-1 px-1.5 py-0.5">
                          <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          <span class="text-blue-400 text-[14px] font-bold">情報（青）</span>
                        </div>
                        <div
                          v-for="[, item] in infoLegend"
                          :key="item.label"
                          class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800/60 transition-colors"
                        >
                          <span class="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                          <span class="text-gray-200 text-[12px]">{{ item.label }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </span>
              <!-- 証票意味ポップオーバー -->
              <div
                v-if="legendModalType === 'voucher_type' && col.key === 'voucher_type'"
                class="absolute top-full left-0 mt-1 z-110 transform origin-top-left"
              >
                <div
                  class="bg-gray-900/95 rounded-xl shadow-2xl w-[520px] overflow-hidden border border-gray-700"
                >
                  <div
                    class="flex items-center justify-between px-4 py-2.5 border-b border-gray-700 bg-linear-to-r from-blue-900/40 to-purple-900/40"
                  >
                    <span class="text-white font-bold text-[14px] flex items-center gap-1.5"
                      >📋 証票意味ごとの許容科目ルール</span
                    >
                  </div>
                  <div class="p-3 text-[12px]">
                    <table class="w-full border-collapse">
                      <thead>
                        <tr class="text-gray-400 text-[11px]">
                          <th class="text-left px-2 py-1.5 w-[90px] border-b-2 border-gray-600">
                            証票意味
                          </th>
                          <th class="text-left px-2 py-1.5 border-b-2 border-gray-600">
                            <span class="flex items-center gap-1">⬅ 借方（左）</span>
                          </th>
                          <th class="text-left px-2 py-1.5 border-b-2 border-gray-600">
                            <span class="flex items-center gap-1">➡ 貸方（右）</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr class="border-b border-gray-800/60 bg-gray-800/20">
                          <td class="px-2 py-2 font-bold">
                            <span class="inline-flex items-center gap-1 text-blue-300"
                              >🧾 経費</span
                            >
                          </td>
                          <td class="px-2 py-2 text-gray-200">
                            <span
                              class="bg-blue-500/20 text-blue-200 px-1.5 py-0.5 rounded text-[10px]"
                              >費用科目全般</span
                            >
                          </td>
                          <td class="px-2 py-2 text-gray-300">現金・預金・未払金・仮払金</td>
                        </tr>
                        <tr class="border-b border-gray-800/60">
                          <td class="px-2 py-2 font-bold">
                            <span class="inline-flex items-center gap-1 text-blue-300"
                              >💰 売上</span
                            >
                          </td>
                          <td class="px-2 py-2 text-gray-300">売掛金・現金・預金</td>
                          <td class="px-2 py-2 text-gray-200">
                            <span
                              class="bg-green-500/20 text-green-200 px-1.5 py-0.5 rounded text-[10px]"
                              >収益科目全般</span
                            >
                          </td>
                        </tr>
                        <tr class="border-b border-gray-800/60 bg-gray-800/20">
                          <td class="px-2 py-2 font-bold">
                            <span class="inline-flex items-center gap-1 text-purple-300"
                              >💳 クレカ</span
                            >
                          </td>
                          <td class="px-2 py-2 text-gray-200">
                            <span
                              class="bg-blue-500/20 text-blue-200 px-1.5 py-0.5 rounded text-[10px]"
                              >費用科目全般</span
                            >
                          </td>
                          <td class="px-2 py-2 text-gray-300">未払金のみ</td>
                        </tr>
                        <tr class="border-b border-gray-800/60">
                          <td class="px-2 py-2 font-bold">
                            <span class="inline-flex items-center gap-1 text-purple-300"
                              >🏦 クレカ引落</span
                            >
                          </td>
                          <td class="px-2 py-2 text-gray-300">未払金のみ</td>
                          <td class="px-2 py-2 text-gray-300">預金口座</td>
                        </tr>
                        <tr class="border-b border-gray-800/60 bg-gray-800/20">
                          <td class="px-2 py-2 font-bold">
                            <span class="inline-flex items-center gap-1 text-green-300"
                              >👤 給与</span
                            >
                          </td>
                          <td class="px-2 py-2 text-gray-300">給料手当・役員報酬・賞与</td>
                          <td class="px-2 py-2 text-gray-300">
                            預金<span class="text-gray-500 text-[10px]">（手取）</span>+ 預り金<span
                              class="text-gray-500 text-[10px]"
                              >（天引）</span
                            >
                          </td>
                        </tr>
                        <tr class="border-b border-gray-800/60">
                          <td class="px-2 py-2 font-bold">
                            <span class="inline-flex items-center gap-1 text-orange-300"
                              >📝 立替経費</span
                            >
                          </td>
                          <td class="px-2 py-2 text-gray-200">
                            <span
                              class="bg-blue-500/20 text-blue-200 px-1.5 py-0.5 rounded text-[10px]"
                              >費用科目全般</span
                            >
                          </td>
                          <td class="px-2 py-2 text-gray-300">立替金・未収金</td>
                        </tr>
                        <tr>
                          <td class="px-2 py-2 font-bold">
                            <span class="inline-flex items-center gap-1 text-cyan-300"
                              >🔄 振替</span
                            >
                          </td>
                          <td class="px-2 py-2 text-gray-300">預金口座</td>
                          <td class="px-2 py-2 text-gray-300">預金口座</td>
                        </tr>
                      </tbody>
                    </table>
                    <div
                      class="mt-3 pt-2 border-t border-gray-700 text-[10px] text-gray-400 px-1 flex items-center gap-1"
                    >
                      <span class="text-yellow-400">⚠</span>
                      上記以外の科目を使用した場合、証票意味矛盾警告が表示されます
                    </div>
                  </div>
                </div>
              </div>
            </span>
          </template>
          <!-- リサイズハンドル -->
          <div
            v-if="col.defaultPx > 0 && col.key !== 'actions'"
            class="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400/60 z-20"
            @mousedown="onResizeStart(col.key, $event)"
          ></div>
        </div>
      </div>

      <!-- テーブルボディ -->
      <div>
        <template v-for="(journal, journalIndex) in paginatedJournals" :key="journal.journalId">
          <div
            v-for="(row, rowIndex) in getCombinedRows(journal)"
            :key="`${journal.journalId}-${rowIndex}`"
            :data-journal-index="journalIndex"
            :class="[
              'flex text-[10px] min-w-[1400px]',
              getRowBackground(journal),
              journal.status === 'exported' ? 'border-b border-white' : 'border-b border-gray-200',
              rowIndex === 0 && journalIndex > 0 ? 'border-t-2 border-t-gray-300' : '',
            ]"
          >
            <!-- 列定義駆動ボディ（v-for by journalColumns） -->
            <template v-for="col in journalColumns" :key="col.key">
              <!-- checkbox型 -->
              <div
                v-if="col.type === 'checkbox'"
                :style="colWidthStyle(col)"
                :class="[
                  colWidthClass(col),
                  'p-0.5 flex items-center justify-center border-r border-gray-200',
                ]"
              >
                <input
                  v-if="rowIndex === 0 && !isImportedJournal(journal)"
                  type="checkbox"
                  class="w-2.5 h-2.5 cursor-pointer"
                  :checked="selectedIds.has(journal.journalId)"
                  @change="toggleSelect(journal.journalId)"
                />
              </div>

              <!-- index型 -->
              <template v-else-if="col.type === 'index'">
                <div
                  v-if="rowIndex === 0"
                  :style="colWidthStyle(col)"
                  :class="[
                    colWidthClass(col),
                    'p-0.5 flex items-center justify-center border-r border-gray-200 font-mono text-gray-600 text-[9px]',
                  ]"
                >
                  {{ journalIndex + 1 }}
                </div>
                <div
                  v-else
                  :style="colWidthStyle(col)"
                  :class="[colWidthClass(col), 'border-r border-gray-200']"
                ></div>
              </template>

              <!-- 取込日（過去仕訳のみ: imported_at表示） -->
              <template v-else-if="col.key === 'importedAt'">
                <div
                  v-if="rowIndex === 0"
                  :style="colWidthStyle(col)"
                  :class="[
                    colWidthClass(col),
                    'p-0.5 flex items-center justify-center border-r border-gray-200 text-[8px] text-gray-500',
                  ]"
                >
                  <span v-if="isImportedJournal(journal) && journal.imported_at">{{
                    formatDate(journal.imported_at.slice(0, 10))
                  }}</span>
                </div>
                <div
                  v-else
                  :style="colWidthStyle(col)"
                  :class="[colWidthClass(col), 'border-r border-gray-200']"
                ></div>
              </template>

              <!-- component型（col.key別に既存ロジック維持） -->
              <template v-else-if="col.type === 'component'">
                <!-- 写真 -->
                <template v-if="col.key === 'photo'">
                  <div
                    v-if="rowIndex === 0 && !isImportedJournal(journal)"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200',
                    ]"
                  >
                    <i
                      class="fa-solid fa-camera text-[10px] text-gray-800 cursor-pointer"
                      :title="UI_MSG.ツールチップ_写真"
                      @mouseenter="showImageModal(journal.journalId, journal.document_id)"
                      @mouseleave="hideImageModal"
                      @click="togglePinModal(journal.journalId, journal.document_id)"
                    ></i>
                  </div>
                  <div
                    v-else
                    :style="colWidthStyle(col)"
                    :class="[colWidthClass(col), 'border-r border-gray-200']"
                  ></div>
                </template>

                <!-- 根拠資料（紐づけありなら即画像、なしなら検索モーダル） -->
                <template v-else-if="col.key === 'supportingDoc'">
                  <div
                    v-if="rowIndex === 0 && !isImportedJournal(journal)"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200',
                    ]"
                  >
                    <!-- 紐づけあり: オレンジ活性 → クリックで即画像表示 -->
                    <i
                      v-if="hasSupportingMatch(journal)"
                      class="fa-solid fa-paperclip text-[10px] text-amber-600 cursor-pointer hover:text-amber-800 hover:scale-125 transition-all"
                      :title="UI_MSG.ツールチップ_根拠資料あり"
                      @click="
                        modalImageUrl = supportingMatchMap.get(journal.journalId)?.[0]?.previewUrl ?? null;
                        isModalPinned = true;
                      "
                    ></i>
                    <!-- 紐づけなし: グレー → クリックで検索モーダル -->
                    <i
                      v-else
                      class="fa-solid fa-paperclip text-[10px] text-gray-300 cursor-pointer hover:text-gray-500 transition-colors"
                      :title="UI_MSG.ツールチップ_根拠資料検索"
                      @click="openSupportingSearchModal()"
                    ></i>
                  </div>
                  <div
                    v-else
                    :style="colWidthStyle(col)"
                    :class="[colWidthClass(col), 'border-r border-gray-200']"
                  ></div>
                </template>

                <!-- 過去仕訳 -->
                <template v-else-if="col.key === 'pastJournal'">
                  <div
                    v-if="rowIndex === 0 && !isImportedJournal(journal)"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200',
                    ]"
                  >
                    <i
                      v-if="hasPastJournal(journal)"
                      class="fa-solid fa-magnifying-glass text-[10px] text-gray-600 cursor-pointer"
                      :title="UI_MSG.ツールチップ_過去仕訳"
                      @mouseenter="showPastJournalSearchModal()"
                      @mouseleave="hidePastJournalSearchModal()"
                      @click="togglePastJournalSearchModalPin()"
                    ></i>
                  </div>
                  <div
                    v-else
                    :style="colWidthStyle(col)"
                    :class="[colWidthClass(col), 'border-r border-gray-200']"
                  ></div>
                </template>

                <!-- コメント（staff_notesベース: ホバーでモーダル表示、クリックで固定） -->
                <template v-else-if="col.key === 'comment'">
                  <div
                    v-if="rowIndex === 0 && !isImportedJournal(journal)"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200 cursor-pointer relative',
                    ]"
                    @mouseenter="hoverOpenCommentModal(journal)"
                    @mouseleave="scheduleHoverCloseCommentModal()"
                    @click.stop="
                      openCommentModal(journal.journalId);
                      pinCommentModal();
                    "
                  >
                    <i
                      v-if="hasAnyStaffNote(journal)"
                      class="fa-solid fa-comment-dots text-[10px] text-emerald-600"
                    ></i>
                    <i
                      v-else
                      class="fa-solid fa-comment-dots text-[10px] text-gray-300 opacity-50"
                    ></i>
                  </div>
                  <div
                    v-else
                    :style="colWidthStyle(col)"
                    :class="[colWidthClass(col), 'border-r border-gray-200']"
                  ></div>
                </template>

                <!-- 要対応（4FAアイコン + ホバーポップアップ） -->
                <template v-else-if="col.key === 'needAction'">
                  <div
                    v-if="rowIndex === 0 && !isImportedJournal(journal)"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200 gap-1',
                    ]"
                  >
                    <template v-for="noteKey in staffNoteKeys" :key="noteKey">
                      <div
                        class="relative"
                        @mouseenter="showNeedPopup(journal.journalId, noteKey)"
                        @mouseleave="scheduleHideNeedPopup()"
                      >
                        <button
                          @click="toggleStaffNote(journal.journalId, noteKey)"
                          :class="[
                            getStaffNoteEnabled(journal, noteKey)
                              ? staffNoteConfig[noteKey].activeColor
                              : 'text-gray-300 opacity-50',
                            'hover:scale-125 transition-transform text-[11px] cursor-pointer',
                          ]"
                        >
                          <i :class="['fa-solid', staffNoteConfig[noteKey].icon]"></i>
                        </button>
                        <!-- ホバーポップアップ（JS制御、マウスオーバーで消えない） -->
                        <div
                          v-if="
                            needPopupJournalId === journal.journalId &&
                            needPopupKey === noteKey &&
                            getStaffNoteEnabled(journal, noteKey) &&
                            (getStaffNoteText(journal, noteKey) ||
                              getStaffNoteChatworkUrl(journal, noteKey))
                          "
                          class="absolute z-20 bg-blue-50 border-2 border-blue-400 rounded p-2 shadow-xl text-[10px] w-56 top-full left-1/2 -translate-x-1/2 mt-1"
                          @mouseenter="cancelHideNeedPopup()"
                          @mouseleave="scheduleHideNeedPopup()"
                        >
                          <div class="font-bold text-blue-900 mb-1">
                            <i
                              :class="['fa-solid', staffNoteConfig[noteKey].icon, 'text-xs mr-1']"
                              :style="{ color: staffNoteConfig[noteKey].hoverIconColor }"
                            ></i>
                            {{ staffNoteConfig[noteKey].label }}
                          </div>
                          <div v-if="getStaffNoteText(journal, noteKey)" class="text-gray-700">
                            {{ getStaffNoteText(journal, noteKey) }}
                          </div>
                          <div v-if="getStaffNoteChatworkUrl(journal, noteKey)" class="mt-1">
                            <a
                              :href="getStaffNoteChatworkUrl(journal, noteKey)"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="text-blue-600 underline hover:text-blue-800 break-all"
                            >
                              <i
                                class="fa-solid fa-arrow-up-right-from-square text-[8px] mr-0.5"
                              ></i>
                              Chatworkで確認
                            </a>
                          </div>
                          <div
                            v-if="journal.staff_notes_author"
                            class="text-gray-500 mt-1 text-[9px]"
                          >
                            担当: {{ journal.staff_notes_author }}
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                  <div
                    v-else
                    :style="colWidthStyle(col)"
                    :class="[colWidthClass(col), 'border-r border-gray-200']"
                  ></div>
                </template>

                <!-- 証票 -->
                <template v-else-if="col.key === 'labelType'">
                  <div
                    v-if="rowIndex === 0 && !isImportedJournal(journal)"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200 gap-0.5',
                    ]"
                  >
                    <template v-for="label in journal.labels" :key="label">
                      <span
                        v-if="labelKeyMap[label]"
                        class="inline-flex items-center justify-center w-4 h-4 rounded text-[8px] font-bold text-white cursor-default"
                        :class="labelKeyMap[label].bgClass"
                        @mouseenter="showTooltip($event, labelKeyMap[label].label)"
                        @mouseleave="hideTooltip()"
                        >{{ labelKeyMap[label].short }}</span
                      >
                    </template>
                  </div>
                  <div
                    v-else
                    :style="colWidthStyle(col)"
                    :class="[colWidthClass(col), 'border-r border-gray-200']"
                  ></div>
                </template>

                <!-- 警告（STREAMED風: 赤△！統一、JS制御ツールチップ） -->
                <template v-else-if="col.key === 'warning'">
                  <div
                    v-if="rowIndex === 0 && !isImportedJournal(journal)"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200',
                    ]"
                  >
                    <span
                      v-if="journal.labels.some((l: string) => warningLabelMap[l])"
                      class="relative inline-flex items-center"
                    >
                      <i
                        class="fa-solid fa-triangle-exclamation text-[10px] text-red-600 cursor-pointer"
                        @mouseenter="showWarningTooltip($event, journal.labels, journal)"
                        @mouseleave="hideTooltip()"
                        @click.stop="openWarningConfirmModal(journal)"
                      ></i>
                      <span
                        v-if="journal.labels.filter((l: string) => warningLabelMap[l]).length >= 2"
                        class="absolute -top-1.5 -right-2 bg-red-500 text-white text-[7px] font-bold rounded-full w-3 h-3 flex items-center justify-center"
                        >{{ journal.labels.filter((l: string) => warningLabelMap[l]).length }}</span
                      >
                    </span>
                  </div>
                  <div
                    v-else
                    :style="colWidthStyle(col)"
                    :class="[colWidthClass(col), 'border-r border-gray-200']"
                  ></div>
                </template>

                <!-- 学習 -->
                <template v-else-if="col.key === 'rule'">
                  <div
                    v-if="rowIndex === 0 && !isImportedJournal(journal)"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200',
                    ]"
                  >
                    <i
                      v-if="journal.labels.includes('RULE_APPLIED')"
                      class="fa-solid fa-graduation-cap text-[10px] text-green-600 cursor-default"
                      @mouseenter="showTooltip($event, TIP_RULE_APPLIED)"
                      @mouseleave="hideTooltip()"
                    ></i>
                    <i
                      v-if="journal.labels.includes('RULE_AVAILABLE')"
                      class="fa-solid fa-lightbulb text-[10px] text-blue-500 cursor-default"
                      @mouseenter="showTooltip($event, TIP_RULE_AVAILABLE)"
                      @mouseleave="hideTooltip()"
                    ></i>
                  </div>
                  <div
                    v-else
                    :style="colWidthStyle(col)"
                    :class="[colWidthClass(col), 'border-r border-gray-200']"
                  ></div>
                </template>

                <!-- クレ払い -->
                <template v-else-if="col.key === 'creditCardPayment'">
                  <div
                    v-if="rowIndex === 0 && !isImportedJournal(journal)"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200',
                    ]"
                  >
                    <span
                      v-if="journal.is_credit_card_payment"
                      class="text-[12px] cursor-default"
                      @mouseenter="showTooltip($event, TIP_CREDIT_CARD_PAY)"
                      @mouseleave="hideTooltip()"
                      >💳</span
                    >
                  </div>
                  <div
                    v-else
                    :style="colWidthStyle(col)"
                    :class="[colWidthClass(col), 'border-r border-gray-200']"
                  ></div>
                </template>

                <!-- 軽減 -->
                <template v-else-if="col.key === 'taxRate'">
                  <div
                    v-if="rowIndex === 0 && !isImportedJournal(journal)"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200',
                    ]"
                  >
                    <span
                      v-if="journal.labels.includes('MULTI_TAX_RATE')"
                      class="text-[9px] font-bold text-green-600 bg-green-50 px-1 rounded"
                      >軽</span
                    >
                  </div>
                  <div
                    v-else
                    :style="colWidthStyle(col)"
                    :class="[colWidthClass(col), 'border-r border-gray-200']"
                  ></div>
                </template>

                <!-- 証票メモ（通常仕訳のみ: journal.memo truthy判定、アイコンのみ） -->
                <template v-else-if="col.key === 'memo'">
                  <div
                    v-if="rowIndex === 0"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200',
                    ]"
                  >
                    <i
                      v-if="!isImportedJournal(journal) && journal.memo"
                      class="fa-solid fa-pencil text-[10px] text-gray-600 cursor-default"
                      @mouseenter="showTooltip($event, TIP_MEMO_EXISTS)"
                      @mouseleave="hideTooltip()"
                    ></i>
                  </div>
                  <div
                    v-else
                    :style="colWidthStyle(col)"
                    :class="[colWidthClass(col), 'border-r border-gray-200']"
                  ></div>
                </template>

                <!-- MFメモ（過去仕訳のみ: MF仕訳メモをツールチップで表示） -->
                <template v-else-if="col.key === 'mfMemo'">
                  <div
                    v-if="rowIndex === 0"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200',
                    ]"
                  >
                    <i
                      v-if="isImportedJournal(journal) && journal.memo"
                      class="fa-solid fa-note-sticky text-[10px] text-blue-500 cursor-pointer"
                      @mouseenter="showTooltip($event, journal.memo)"
                      @mouseleave="hideTooltip()"
                    ></i>
                  </div>
                  <div
                    v-else
                    :style="colWidthStyle(col)"
                    :class="[colWidthClass(col), 'border-r border-gray-200']"
                  ></div>
                </template>

                <!-- 適格（3値: 適/非/外） -->
                <template v-else-if="col.key === 'invoice'">
                  <div
                    v-if="rowIndex === 0"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200 relative',
                      !isImportedJournal(journal) && journal.status !== 'exported' ? 'jl-editable' : '',
                    ]"
                    @dblclick.stop="
                      !isImportedJournal(journal) &&
                      startCellEdit(
                        journal.journalId,
                        rowIndex,
                        'invoice',
                        journal.labels.includes('INVOICE_QUALIFIED')
                          ? '◯'
                          : journal.labels.includes('INVOICE_NOT_QUALIFIED')
                            ? '✕'
                            : '',
                      )
                    "
                  >
                    <template v-if="!isImportedJournal(journal) && isEditing(journal.journalId, rowIndex, 'invoice')">
                      <select
                        class="inline-edit-input w-full text-[9px] bg-yellow-50 border border-blue-400 rounded outline-none px-0.5 py-0"
                        style="height: 100%; min-height: 0; line-height: 1"
                        v-model="editingValue"
                        @change="commitCellEdit()"
                        @keydown.escape="cancelCellEdit()"
                        @blur="commitCellEdit()"
                      >
                        <option v-for="o in CHECK_STATUS_OPTIONS" :key="o.value" :value="o.value">
                          {{ o.label }}
                        </option>
                      </select>
                    </template>
                    <template v-else>
                      <span
                        v-if="journal.labels.includes('INVOICE_QUALIFIED')"
                        class="text-green-600 text-[9px] font-bold cursor-pointer"
                        @mouseenter="
                          showTooltip(
                            $event,
                            journal.invoice_number
                              ? `${journal.invoice_number}`
                              : UI_MSG.適格_T番号なし,
                          )
                        "
                        @mouseleave="hideTooltip()"
                        >適</span
                      >
                      <span
                        v-else-if="journal.labels.includes('INVOICE_NOT_QUALIFIED')"
                        class="text-red-600 text-[9px] font-bold cursor-pointer"
                        @mouseenter="showTooltip($event, TIP_NOT_QUALIFIED)"
                        @mouseleave="hideTooltip()"
                        >非</span
                      >
                      <span
                        v-else
                        class="text-gray-400 text-[9px] cursor-default"
                        @mouseenter="showTooltip($event, 'インボイス対象外')"
                        @mouseleave="hideTooltip()"
                        >外</span
                      >
                    </template>
                  </div>
                  <div
                    v-else
                    :style="colWidthStyle(col)"
                    :class="[colWidthClass(col), 'border-r border-gray-200']"
                  ></div>
                </template>

                <!-- 決算整理（過去仕訳のみ: is_closing_entry=trueで「決」表示） -->
                <template v-else-if="col.key === 'closingEntry'">
                  <div
                    v-if="rowIndex === 0"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200',
                    ]"
                  >
                    <span
                      v-if="isImportedJournal(journal) && journal.is_closing_entry"
                      class="text-[9px] font-bold text-purple-600 bg-purple-50 px-1 rounded"
                      @mouseenter="showTooltip($event, '決算整理仕訳')"
                      @mouseleave="hideTooltip()"
                      >決</span
                    >
                  </div>
                  <div
                    v-else
                    :style="colWidthStyle(col)"
                    :class="[colWidthClass(col), 'border-r border-gray-200']"
                  ></div>
                </template>
              </template>

              <!-- voucher-type-dropdown型（証票意味: journal-levelデータ、ダブルクリック→ドロップダウン） -->
              <template v-else-if="col.type === 'voucher-type-dropdown'">
                <template v-if="rowIndex === 0 && !isImportedJournal(journal)">
                  <div
                    :data-drag-col="col.key"
                    :data-drag-row="rowIndex"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 border-r border-gray-200 text-[10px] relative',
                      journal.status !== 'exported' ? 'jl-editable' : '',
                      getWarningCellClass(journal, col.key),
                      isDragOver(journalIndex, 0, col.key)
                        ? 'ring-2 ring-blue-500 bg-yellow-200! text-black!'
                        : '',
                      isDragCompatibleCol(col.key) ? 'bg-blue-50!' : '',
                      isDragIncompatibleCol(col.key) ? 'opacity-30' : '',
                    ]"
                    @dblclick.stop="
                      startCellEdit(journal.journalId, 0, col.key, journal.voucher_type || '')
                    "
                    @mousedown="startCellDrag(col.key, journal.voucher_type || '', $event)"
                  >
                    <template v-if="isEditing(journal.journalId, 0, col.key)">
                      <select
                        class="inline-edit-input w-full text-[9px] bg-white border border-blue-400 rounded outline-none px-0.5 py-0"
                        v-model="editingValue"
                        @change="
                          updateJournalField(journal.journalId, {
                            voucher_type: editingValue,
                          });
                          editingCell = null;
                        "
                        @blur="editingCell = null"
                        @keydown.escape="cancelCellEdit()"
                      >
                        <option value="">{{ PLACEHOLDER_EMPTY }}</option>
                        <option v-for="vt in VOUCHER_TYPES" :key="vt" :value="vt">{{ vt }}</option>
                      </select>
                    </template>
                    <template v-else>
                      {{ journal.voucher_type || "--" }}
                    </template>
                  </div>
                </template>
                <div
                  v-else
                  :style="colWidthStyle(col)"
                  :class="[colWidthClass(col), 'border-r border-gray-200']"
                ></div>
              </template>

              <!-- account-dropdown型（勘定科目: ダブルクリック→検索付きoptgroup→テキスト戻り） -->
              <template v-else-if="col.type === 'account-dropdown'">
                <div
                  :data-drag-col="col.key"
                  :data-drag-row="rowIndex"
                  :style="colWidthStyle(col)"
                  :class="[
                    colWidthClass(col),
                    'p-0.5 relative border-r border-gray-200 text-[10px]',
                    hasEntry(row, col.key) && !isImportedJournal(journal) && journal.status !== 'exported' ? 'jl-editable' : '',
                    isDragOver(journalIndex, rowIndex, col.key)
                      ? 'ring-2 ring-blue-500 bg-yellow-200! text-black!'
                      : '',
                    isFillTargetCell(journalIndex, col.key) ? 'fill-target-cell' : '',
                    getWarningCellClass(
                      journal,
                      col.key,
                      row[col.key.startsWith('debit') ? 'debit' : 'credit'] ?? undefined,
                    ),
                    isDragCompatibleCol(col.key) ? 'bg-blue-50!' : '',
                    isDragIncompatibleCol(col.key) ? 'opacity-30' : '',
                    (journal.labels.includes('AI_ESTIMATED') || isPipelineDetermined(journal)) ? '!bg-blue-50 !border-2 !border-blue-400' : '',
                  ]"
                  @dblclick.stop="
                    !isImportedJournal(journal) && hasEntry(row, col.key) &&
                    (startCellEdit(
                      journal.journalId,
                      rowIndex,
                      col.key,
                      getRawString(row, col.key),
                    ),
                    (expandedMegaGroup = null))
                  "
                  @mousedown="
                    hasEntry(row, col.key) &&
                    startCellDrag(col.key, getRawValue(row, col.key), $event, String(getValue(row, col.key) ?? ''))
                  "
                >
                  <template v-if="isEditing(journal.journalId, rowIndex, col.key)">
                    <div class="relative">
                      <input
                        type="text"
                        class="inline-edit-input w-full text-[9px] bg-white border border-blue-400 rounded outline-none pl-0.5 pr-5 py-0"
                        v-model="editingValue"
                        :placeholder="UI_MSG.検索"
                        @keydown.escape="cancelCellEdit()"
                        @blur="blurAccountEdit(journal, row, col.key)"
                      />
                      <i
                        class="fa-solid fa-magnifying-glass absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 text-[8px] pointer-events-none"
                      ></i>
                      <div
                        class="absolute left-0 top-full z-50 bg-white border border-gray-300 shadow-lg rounded max-h-48 overflow-y-auto w-52"
                      >
                        <!-- テキストが元の値から変更された場合: 全横断検索 -->
                        <template v-if="editingValue !== editingOriginalValue">
                          <template v-for="g in filterAccountGroups(editingValue)" :key="g.label">
                            <div class="px-2 py-0.5 text-[9px] font-bold text-gray-500 bg-gray-50">
                              {{ g.label }}
                            </div>
                            <div
                              v-for="a in g.items"
                              :key="a.name"
                              class="px-2 py-0.5 text-[9px] truncate hover:bg-blue-100 cursor-pointer text-gray-800 pl-4"
                              @mousedown.prevent="selectAccountItem(journal, row, col.key, a.accountId)"
                            >
                              {{ a.name }}
                            </div>
                          </template>
                          <div
                            v-if="filterAccountGroups(editingValue).length === 0"
                            class="px-2 py-1 text-[9px] text-gray-400"
                          >
                            該当なし
                          </div>
                        </template>
                        <!-- テキスト空: 既存科目先頭 + 3大グループ表示 -->
                        <template v-else>
                          <!-- 既存科目が入っている場合: 先頭に表示 -->
                          <template v-if="getRawString(row, col.key)">
                            <div
                              class="px-2 py-1 text-[9px] font-bold text-blue-700 bg-blue-50 border-b border-blue-200 flex items-center gap-1"
                            >
                              <i class="fa-solid fa-check text-[7px]"></i>
                              {{ resolveAccountName(getRawString(row, col.key)) }}
                            </div>
                          </template>
                          <template v-for="mega in MEGA_GROUPS" :key="mega.label">
                            <div
                              class="px-2 py-1 text-[10px] font-bold cursor-pointer hover:bg-blue-50 flex items-center gap-1"
                              :class="
                                expandedMegaGroup === mega.label
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'text-gray-700 bg-gray-50'
                              "
                              @mousedown.prevent="
                                expandedMegaGroup =
                                  expandedMegaGroup === mega.label ? null : mega.label
                              "
                            >
                              <span>{{ expandedMegaGroup === mega.label ? "▼" : "▶" }}</span>
                              <span>{{ mega.label }}</span>
                              <span class="ml-auto text-[8px] text-gray-400">{{
                                getAccountsForMegaGroup(mega.label).length
                              }}</span>
                            </div>
                            <template v-if="expandedMegaGroup === mega.label">
                              <div
                                v-for="a in getAccountsForMegaGroup(mega.label)"
                                :key="a.name"
                                class="px-2 py-0.5 text-[9px] truncate hover:bg-blue-100 cursor-pointer text-gray-800 pl-5"
                                @mousedown.prevent="selectAccountItem(journal, row, col.key, a.accountId)"
                              >
                                {{ a.name }}
                              </div>
                            </template>
                          </template>
                        </template>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <span v-if="journal.labels.includes('AI_ESTIMATED')" class="text-blue-500 mr-0.5" title="AI推定（確認推奨）">☁️</span><span v-else-if="isLearningDetermined(journal)" class="text-green-600 mr-0.5" title="学習ルール適用">🎓</span>{{ resolveAccountName(getRawString(row, col.key)) || "--" }}
                  </template>
                  <span
                    v-if="
                      isFillable(col.key) &&
                      !isEditing(journal.journalId, rowIndex, col.key) &&
                      !isCompoundJournal(journal)
                    "
                    class="fill-handle absolute bottom-0 right-0 w-[3px] h-[3px] bg-blue-500 cursor-crosshair z-10"
                    @mousedown.stop.prevent="
                      startFillDrag(
                        journalIndex,
                        col.key,
                        getRawString(row, col.key),
                        $event,
                      )
                    "
                  ></span>
                </div>
              </template>

              <!-- text型 -->
              <template v-else-if="col.type === 'text'">
                <!-- journal-level（keyにドットなし）: rowIndex===0のみ表示 -->
                <template v-if="!col.key.includes('.')">
                  <div
                    v-if="rowIndex === 0"
                    :data-drag-col="col.key"
                    :data-drag-row="rowIndex"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center border-r border-gray-200 relative',
                      !isImportedJournal(journal) && journal.status !== 'exported' ? 'jl-editable' : '',
                      col.key === 'voucher_date' ? 'justify-center text-[8px]' : '',
                      isDragOver(journalIndex, rowIndex, col.key)
                        ? 'ring-2 ring-blue-500 bg-yellow-200! text-black!'
                        : '',
                      isFillTargetCell(journalIndex, col.key) ? 'fill-target-cell' : '',
                      getWarningCellClass(journal, col.key),
                      col.key === 'voucher_date' ? getDatePeriodClass(journal.voucher_date) : '',
                      isDragCompatibleCol(col.key) ? 'bg-blue-50!' : '',
                      isDragIncompatibleCol(col.key) ? 'opacity-30' : '',
                    ]"
                    @dblclick.stop="
                      !isImportedJournal(journal) &&
                      startCellEdit(journal.journalId, rowIndex, col.key, getValue(journal, col.key))
                    "
                    @mousedown="startCellDrag(col.key, getValue(journal, col.key), $event)"
                  >
                    <!-- 日付: 編集中はdate input -->
                    <template
                      v-if="col.key === 'voucher_date' && isEditing(journal.journalId, rowIndex, col.key)"
                    >
                      <input
                        type="date"
                        class="inline-edit-input w-full text-[8px] bg-yellow-50 border border-blue-400 rounded outline-none px-0.5 py-0"
                        v-model="editingValue"
                        @keydown.enter="commitCellEdit()"
                        @keydown.escape="cancelCellEdit()"
                        @blur="commitCellEdit()"
                      />
                    </template>
                    <!-- 摘要: 編集中はtext input -->
                    <template
                      v-else-if="
                        col.key === 'description' && isEditing(journal.journalId, rowIndex, col.key)
                      "
                    >
                      <input
                        type="text"
                        class="inline-edit-input w-full text-[10px] bg-yellow-50 border border-blue-400 rounded outline-none px-0.5 py-0"
                        v-model="editingValue"
                        @keydown.enter="commitCellEdit()"
                        @keydown.escape="cancelCellEdit()"
                        @blur="commitCellEdit()"
                      />
                    </template>
                    <!-- 非編集中 -->
                    <template v-else>
                      {{
                        col.key === "voucher_date"
                          ? formatDate(getValue(journal, col.key))
                          : (getValue(journal, col.key) ?? NULL_DISPLAY_UNKNOWN)
                      }}
                    </template>
                    <span
                      v-if="
                        isFillable(col.key) &&
                        !isEditing(journal.journalId, rowIndex, col.key) &&
                        !isCompoundJournal(journal)
                      "
                      class="fill-handle absolute bottom-0 right-0 w-[3px] h-[3px] bg-blue-500 cursor-crosshair z-10"
                      @mousedown.stop.prevent="
                        startFillDrag(journalIndex, col.key, getValue(journal, col.key), $event)
                      "
                    ></span>
                  </div>
                  <div
                    v-else
                    :style="colWidthStyle(col)"
                    :class="[colWidthClass(col), 'border-r border-gray-200']"
                  ></div>
                </template>
                <!-- entry-level（keyにドットあり）: 補助科目・税区分等 -->
                <div
                  v-else
                  :data-drag-col="col.key"
                  :data-drag-row="rowIndex"
                  :style="colWidthStyle(col)"
                  :class="[
                    colWidthClass(col),
                    'p-0.5 flex items-center justify-center border-r border-gray-200 text-[10px] relative',
                    hasEntry(row, col.key) && !isImportedJournal(journal) && journal.status !== 'exported' ? 'jl-editable' : '',
                    isDragOver(journalIndex, rowIndex, col.key)
                      ? 'ring-2 ring-blue-500 bg-yellow-200! text-black!'
                      : '',
                    isFillTargetCell(journalIndex, col.key) ? 'fill-target-cell' : '',
                    getWarningCellClass(
                      journal,
                      col.key,
                      row[col.key.split('.')[0] as 'debit' | 'credit'] ?? undefined,
                    ),
                    isDragCompatibleCol(col.key) ? 'bg-blue-50!' : '',
                    isDragIncompatibleCol(col.key) ? 'opacity-30' : '',
                  ]"
                  @dblclick.stop="
                    !isImportedJournal(journal) && hasEntry(row, col.key) &&
                    startCellEdit(journal.journalId, rowIndex, col.key, getValue(row, col.key))
                  "
                  @mousedown="
                    hasEntry(row, col.key) && startCellDrag(col.key, getValue(row, col.key), $event)
                  "
                >
                  <template v-if="isEditing(journal.journalId, rowIndex, col.key)">
                    <!-- F4: 税区分は検索付きoptgroupコンボボックス（方向フィルタ） -->
                    <div v-if="col.key.endsWith('.tax_category_id')" class="relative">
                      <input
                        type="text"
                        class="inline-edit-input w-full text-[9px] bg-white border border-blue-400 rounded outline-none px-0.5 py-0"
                        v-model="editingValue"
                        :placeholder="UI_MSG.検索"
                        @keydown.escape="cancelCellEdit()"
                        @blur="blurTaxEdit(journal)"
                      />
                      <div
                        class="absolute left-0 top-full z-50 bg-white border border-gray-300 shadow-lg rounded max-h-40 overflow-y-auto w-48"
                      >
                        <!-- テキストが元の値から変更された場合: 検索フィルタ -->
                        <template v-if="editingValue !== editingOriginalValue">
                          <template
                            v-for="g in filterTaxGroups(row, col.key, editingValue)"
                            :key="g.label"
                          >
                            <div class="px-2 py-0.5 text-[9px] font-bold text-gray-600 bg-gray-50">
                              ▼ {{ g.label }}
                            </div>
                            <div
                              v-for="tc in g.items"
                              :key="tc.taxCategoryId"
                              class="px-2 py-0.5 text-[9px] truncate hover:bg-blue-100 cursor-pointer text-gray-800 pl-4"
                              @mousedown.prevent="selectTaxItem(journal, tc.taxCategoryId)"
                            >
                              {{ tc.name }}
                            </div>
                          </template>
                          <div
                            v-if="filterTaxGroups(row, col.key, editingValue).length === 0"
                            class="px-2 py-1 text-[9px] text-gray-400"
                          >
                            該当なし
                          </div>
                        </template>
                        <!-- 初期状態（ダブルクリック直後）: 全件グルーピング表示 -->
                        <template v-else>
                          <template v-for="g in filterTaxGroups(row, col.key, '')" :key="g.label">
                            <div class="px-2 py-0.5 text-[9px] font-bold text-gray-600 bg-gray-50">
                              ▼ {{ g.label }}
                            </div>
                            <div
                              v-for="tc in g.items"
                              :key="tc.taxCategoryId"
                              class="px-2 py-0.5 text-[9px] truncate hover:bg-blue-100 cursor-pointer text-gray-800 pl-4"
                              @mousedown.prevent="selectTaxItem(journal, tc.taxCategoryId)"
                            >
                              {{ tc.name }}
                            </div>
                          </template>
                        </template>
                      </div>
                    </div>
                    <!-- F5: 補助科目は検索付きドロップダウン（勘定科目に紐づく補助科目候補） -->
                    <div v-else-if="col.key.endsWith('.sub_account') && getSubAccountCandidates(row, col.key).length > 0" class="relative">
                      <input
                        type="text"
                        class="inline-edit-input w-full text-[9px] bg-white border border-green-400 rounded outline-none px-0.5 py-0"
                        v-model="editingValue"
                        :placeholder="UI_MSG.検索"
                        @keydown.enter="commitCellEdit()"
                        @keydown.escape="cancelCellEdit()"
                        @blur="blurSubAccountEdit()"
                      />
                      <div
                        class="absolute left-0 top-full z-50 bg-white border border-gray-300 shadow-lg rounded max-h-40 overflow-y-auto w-56"
                      >
                        <div
                          v-for="sa in filterSubAccountCandidates(row, col.key, editingValue)"
                          :key="sa.mfSubId"
                          class="px-2 py-0.5 text-[9px] truncate hover:bg-green-100 cursor-pointer text-gray-800"
                          @mousedown.prevent="selectSubAccountItem(journal, sa.name)"
                        >
                          {{ sa.name }}
                        </div>
                        <div
                          v-if="filterSubAccountCandidates(row, col.key, editingValue).length === 0"
                          class="px-2 py-1 text-[9px] text-gray-400"
                        >
                          該当なし
                        </div>
                      </div>
                    </div>
                    <!-- その他はテキスト入力 -->
                    <input
                      v-else
                      type="text"
                      class="inline-edit-input w-full text-[9px] bg-yellow-50 border border-blue-400 rounded outline-none px-0.5 py-0"
                      v-model="editingValue"
                      @keydown.enter="commitCellEdit()"
                      @keydown.escape="cancelCellEdit()"
                      @blur="commitCellEdit()"
                    />
                  </template>
                  <template v-else>
                    <span
                      v-if="
                        col.key.endsWith('.tax_category_id') &&
                        isTaxCategoryInvalid(getRawString(row, col.key))
                      "
                      class="text-red-600 font-bold"
                      :title="
                        UI_MSG.課税方式不整合接頭 +
                        (activeClientFull?.consumptionTaxMode === 'exempt'
                          ? UI_MSG.課税方式_免税
                          : UI_MSG.課税方式_本則)
                      "
                    >
                      ⚠ {{ getValue(row, col.key) ?? "" }}
                    </span>
                    <template v-else>{{ getValue(row, col.key) ?? "" }}</template>
                  </template>
                  <span
                    v-if="
                      isFillable(col.key) &&
                      !isEditing(journal.journalId, rowIndex, col.key) &&
                      !isCompoundJournal(journal)
                    "
                    class="fill-handle absolute bottom-0 right-0 w-[3px] h-[3px] bg-blue-500 cursor-crosshair z-10"
                    @mousedown.stop.prevent="
                      startFillDrag(journalIndex, col.key, getValue(row, col.key), $event)
                    "
                  ></span>
                </div>
              </template>

              <!-- amount型 -->
              <template v-else-if="col.type === 'amount'">
                <div
                  :data-drag-col="col.key"
                  :data-drag-row="rowIndex"
                  :style="colWidthStyle(col)"
                  :class="[
                    colWidthClass(col),
                    'p-0.5 flex items-center justify-end border-r border-gray-200 font-mono text-[10px]',
                    hasEntry(row, col.key) && !isImportedJournal(journal) && journal.status !== 'exported' ? 'jl-editable' : '',
                    col.key === 'debit.amount' ? 'border-r-2 border-r-blue-300' : '',
                    getWarningCellClass(
                      journal,
                      col.key,
                      row[col.key.split('.')[0] as 'debit' | 'credit'] ?? undefined,
                    ),
                    isDragOver(journalIndex, rowIndex, col.key)
                      ? 'ring-2 ring-blue-500 bg-yellow-200! text-black!'
                      : '',
                    isDragCompatibleCol(col.key) ? 'bg-blue-50!' : '',
                    isDragIncompatibleCol(col.key) ? 'opacity-30' : '',
                  ]"
                  @dblclick.stop="
                    !isImportedJournal(journal) && hasEntry(row, col.key) &&
                    startCellEdit(journal.journalId, rowIndex, col.key, getValue(row, col.key))
                  "
                  @mousedown="
                    hasEntry(row, col.key) && startCellDrag(col.key, getValue(row, col.key), $event)
                  "
                >
                  <template v-if="isEditing(journal.journalId, rowIndex, col.key)">
                    <input
                      type="text"
                      inputmode="numeric"
                      class="inline-edit-input w-full text-[9px] bg-yellow-50 border border-blue-400 rounded outline-none px-0.5 py-0 text-right font-mono"
                      v-model="editingValue"
                      @input="onAmountInput($event)"
                      @keydown.enter="commitCellEdit()"
                      @keydown.escape="cancelCellEdit()"
                      @blur="commitCellEdit()"
                    />
                  </template>
                  <template v-else>
                    {{
                      getValue(row, col.key) != null
                        ? Number(getValue(row, col.key)).toLocaleString()
                        : ""
                    }}
                  </template>
                </div>
              </template>

              <!-- action型（ワークフローハブ） -->
              <div
                v-else-if="col.type === 'action'"
                :style="colWidthStyle(col)"
                :class="[colWidthClass(col), 'p-0.5 flex items-center justify-center relative']"
              >
                <!-- 💡 ヒントアイコン（canShowHintで制御） -->
                <span
                  v-if="canShowHint(journal)"
                  class="text-amber-400 hover:text-amber-600 cursor-pointer text-xs"
                  :title="UI_MSG.ツールチップ_ヒント"
                  @click.stop="openHintModal(journal)"
                >
                  {{ col.icon }}
                </span>

                <!-- ドロップダウンメニュー（w-44固定、拡張対応） -->
                <div
                  v-if="rowIndex === 0 && openDropdownId === journal.journalId && !isImportedJournal(journal)"
                  class="absolute right-full top-0 z-50 w-44 bg-white border border-gray-300 rounded shadow-lg text-[10px] whitespace-nowrap"
                  @click.stop
                >
                  <!-- ゴミ箱状態 → 復活のみ -->
                  <template v-if="journal.deleted_at !== null">
                    <button
                      @click="restoreJournal(journal)"
                      class="w-full px-2 py-1.5 text-left hover:bg-green-50 text-green-700 font-bold flex items-center gap-1"
                    >
                      ♻️ 復活
                    </button>
                  </template>

                  <!-- 通常状態 → フルメニュー -->
                  <template v-else>
                    <!-- ────── セクション1: 状態トグル（軽い操作） ────── -->

                    <!-- 未読/既読トグル（並列濃淡） -->
                    <div class="flex border-b border-gray-200">
                      <button
                        @click="setReadStatus(journal, false)"
                        :disabled="journal.status === 'exported'"
                        :class="[
                          'flex-1 px-2 py-1.5 text-left flex items-center gap-1',
                          journal.status === 'exported'
                            ? 'text-gray-300 cursor-not-allowed'
                            : !journal.is_read
                              ? 'font-bold text-gray-800 hover:bg-gray-100'
                              : 'text-gray-400 hover:bg-gray-100',
                        ]"
                      >
                        📖 未読
                      </button>
                      <button
                        @click="setReadStatus(journal, true)"
                        :disabled="journal.status === 'exported'"
                        :class="[
                          'flex-1 px-2 py-1.5 text-left flex items-center gap-1',
                          journal.status === 'exported'
                            ? 'text-gray-300 cursor-not-allowed'
                            : journal.is_read
                              ? 'font-bold text-gray-800 hover:bg-gray-100'
                              : 'text-gray-400 hover:bg-gray-100',
                        ]"
                      >
                        📖 既読
                      </button>
                    </div>

                    <!-- 対象/対象外トグル（並列濃淡） -->
                    <div class="flex border-b border-gray-200">
                      <button
                        @click="setExportExclude(journal, false)"
                        :disabled="journal.status === 'exported'"
                        :class="[
                          'flex-1 px-2 py-1.5 text-left flex items-center gap-1',
                          journal.status === 'exported'
                            ? 'text-gray-300 cursor-not-allowed'
                            : !journal.labels.includes('EXPORT_EXCLUDE')
                              ? 'font-bold text-gray-800 hover:bg-gray-100'
                              : 'text-gray-400 hover:bg-gray-100',
                        ]"
                      >
                        📤 対象
                      </button>
                      <button
                        @click="setExportExclude(journal, true)"
                        :disabled="journal.status === 'exported'"
                        :class="[
                          'flex-1 px-2 py-1.5 text-left flex items-center gap-1',
                          journal.status === 'exported'
                            ? 'text-gray-300 cursor-not-allowed'
                            : journal.labels.includes('EXPORT_EXCLUDE')
                              ? 'font-bold text-gray-800 hover:bg-gray-100'
                              : 'text-gray-400 hover:bg-gray-100',
                        ]"
                      >
                        📤 対象外
                      </button>
                    </div>

                    <!-- ────── セクション2: 単発操作（中の重さ） ────── -->

                    <button
                      @click="copyJournal(journal, journalIndex)"
                      class="w-full px-2 py-1.5 text-left hover:bg-gray-100 flex items-center gap-1 border-b border-gray-200"
                    >
                      📋 コピー
                    </button>

                    <!-- ────── セクション3: 破壊操作（重い・赤・心理的距離） ────── -->
                    <!-- 制約: exported行はゴミ箱不可 -->

                    <button
                      @click="trashJournal(journal)"
                      :disabled="journal.status === 'exported'"
                      :class="[
                        'w-full px-2 py-1.5 text-left flex items-center gap-1 border-b border-gray-200',
                        journal.status === 'exported'
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'hover:bg-red-50 text-red-600',
                      ]"
                    >
                      🗑 ゴミ箱
                    </button>

                    <!-- ────── セクション4: 拡張メニュー（プレースホルダー） ────── -->

                    <button
                      disabled
                      class="w-full px-2 py-1.5 text-left text-gray-300 cursor-not-allowed flex items-center gap-1"
                    >
                      ① 拡張メニュー
                    </button>
                    <button
                      disabled
                      class="w-full px-2 py-1.5 text-left text-gray-300 cursor-not-allowed flex items-center gap-1"
                    >
                      ② 拡張メニュー
                    </button>
                    <button
                      disabled
                      class="w-full px-2 py-1.5 text-left text-gray-300 cursor-not-allowed flex items-center gap-1"
                    >
                      ③ 拡張メニュー
                    </button>
                    <button
                      disabled
                      class="w-full px-2 py-1.5 text-left text-gray-300 cursor-not-allowed flex items-center gap-1"
                    >
                      ④ 拡張メニュー
                    </button>
                    <button
                      disabled
                      class="w-full px-2 py-1.5 text-left text-gray-300 cursor-not-allowed flex items-center gap-1"
                    >
                      ⑤ 拡張メニュー
                    </button>
                  </template>
                </div>
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>
    <!-- テーブルラッパー閉じ -->

    <!-- フッター: ページネーション -->
    <div
      class="bg-gray-100 text-[10px] py-1.5 px-3 border-t text-gray-700 flex items-center justify-center gap-2"
    >
      <button
        @click="journalCurrentPage > 1 && journalCurrentPage--"
        :disabled="journalCurrentPage <= 1"
        class="px-1.5 py-0.5 rounded border border-gray-300 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
      >
        &lt;
      </button>
      <template v-for="p in journalTotalPages" :key="p">
        <button
          @click="journalCurrentPage = p"
          :class="[
            'px-2 py-0.5 rounded border',
            p === journalCurrentPage
              ? 'bg-blue-600 text-white border-blue-600 font-bold'
              : 'border-gray-300 hover:bg-white',
          ]"
        >
          {{ p }}
        </button>
      </template>
      <button
        @click="journalCurrentPage < journalTotalPages && journalCurrentPage++"
        :disabled="journalCurrentPage >= journalTotalPages"
        class="px-1.5 py-0.5 rounded border border-gray-300 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
      >
        &gt;
      </button>
      <span class="ml-2 text-gray-500"
        >{{ journalPageStart }}〜{{ journalPageEnd }} / 全{{ journalTotalCount }}件</span
      >
      <select
        v-model="journalPageSize"
        class="ml-2 border border-gray-300 rounded text-[10px] px-1 py-0.5 cursor-pointer"
      >
        <option v-for="o in PAGE_SIZE_OPTIONS" :key="o.value" :value="o.value">
          {{ o.label }}
        </option>
      </select>
    </div>

    <!-- 画像モーダル（子コンポーネントに分離） -->
    <ImageModal
      :imageUrl="modalImageUrl"
      @close="closeModal"
      @hide="hideImageModal"
    />

    <!-- 根拠資料検索モーダル（子コンポーネントに分離） -->
    <EvidenceSearchModal
      :visible="showSupportingSearchModal"
      :clientId="journalClientId"
      @close="closeSupportingSearchModal"
    />


    <!-- 過去仕訳検索モーダル（子コンポーネントに分離） -->
    <PastJournalSearchModal
      :visible="showPastJournalModal"
      :pinned="isPastJournalModalPinned"
      :journals="aiJournalsForModal"
      :confirmedJournals="confirmedJournals"
      :isConfirmedLoading="isConfirmedLoading"
      :accountOptions="accountOptionsForModal"
      :resolveAccountName="resolveAccountName"
      :resolveTaxCategoryName="resolveTaxCategoryName"
      @close="closePastJournalModal"
      @toggle-pin="togglePastJournalSearchModalPin"
      @fetch-confirmed="fetchConfirmedJournals"
      @mouseenter="showPastJournalSearchModal()"
      @mouseleave="hidePastJournalSearchModal()"
    />

    <!-- ヒントモーダル（子コンポーネントに分離） -->
    <HintModal
      :journal="hintModalJournal"
      :journalIndex="hintModalJournalIndex"
      :clientId="journalClientId"
      @close="hintModalJournal = null"
      @apply-suggestion="applyHintSuggestion"
    />


    <!-- コメントモーダル（子コンポーネントに分離） -->
    <CommentModal
      :journal="commentModalJournal"
      :author="commentModalAuthor"
      :staffList="staffList"
      @close="closeCommentModal"
      @toggle-note="toggleStaffNoteInModal"
      @update-author="(v) => commentModalAuthor = v"
      @mouseenter="cancelHoverCloseCommentModal"
      @mouseleave="scheduleHoverCloseCommentModal"
    />


  <!-- 税区分矛盾モーダル（非ブロッキング: 右上フローティング） -->
  <div
    v-if="showTaxMismatchModal"
    class="fixed inset-0 z-89"
    @click="showTaxMismatchModal = false"
  ></div>
  <div
    v-if="showTaxMismatchModal"
    class="fixed top-20 right-4 z-90 w-80 bg-white rounded-lg shadow-2xl border border-red-200 p-4 text-sm"
  >
    <h3 class="font-bold mb-2 text-red-600 flex items-center gap-1 text-xs">
      <span class="text-base">⚠</span> 税区分の不整合
      <button
        @click="showTaxMismatchModal = false"
        class="ml-auto text-gray-400 hover:text-gray-600 text-base leading-none"
      >
        &times;
      </button>
    </h3>
    <p class="text-gray-600 mb-2 text-[11px]">
      <span class="font-bold">{{ getClientDisplayName(activeClientFull) }}</span>
      （{{
        activeClientFull?.consumptionTaxMode === "exempt"
          ? UI_MSG.ラベル_免税事業者
          : activeClientFull?.consumptionTaxMode === "simplified"
            ? UI_MSG.ラベル_簡易課税
            : UI_MSG.ラベル_本則課税
      }}）で <span class="font-bold text-red-600">{{ taxMismatchSummary.total }}件</span> の不整合
    </p>
    <div class="border rounded bg-gray-50 p-1.5 mb-3 max-h-24 overflow-y-auto">
      <div
        v-for="item in taxMismatchSummary.items"
        :key="item.from"
        class="flex items-center text-[10px] py-0.5"
      >
        <span class="text-red-500">⚠ {{ item.from }}</span>
        <span class="mx-1 text-gray-400">→</span>
        <span class="text-green-600 font-bold">{{ item.to }}</span>
        <span class="ml-auto text-gray-400">({{ item.count }}件)</span>
      </div>
    </div>
    <div class="flex justify-end gap-1.5">
      <button
        @click="showTaxMismatchModal = false"
        class="px-2 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-100 text-gray-600"
      >
        閉じる
      </button>
      <button
        @click="showTaxMismatchModal = false"
        class="px-2 py-1 text-[11px] border border-blue-300 rounded hover:bg-blue-50 text-blue-600"
      >
        個別に確認
      </button>
      <button
        @click="
          fixAllTaxMismatches();
          showTaxMismatchModal = false;
        "
        class="px-2 py-1 text-[11px] bg-red-500 text-white rounded hover:bg-red-600 font-bold"
      >
        一括修正
      </button>
    </div>
  </div>

  <!-- Drive未仕訳取込モーダル -->
  <div
    v-if="driveImportModal.show"
    class="fixed inset-0 z-100 flex items-center justify-center bg-black/30"
    @click.self="!isDriveImporting && (driveImportModal.show = false)"
  >
    <div class="bg-white rounded-lg shadow-xl w-80 overflow-hidden" @click.stop>
      <!-- ヘッダー -->
      <div class="bg-emerald-600 px-4 py-2.5 flex items-center gap-2">
        <i class="fa-solid fa-download text-white text-[13px]"></i>
        <span class="text-white font-bold text-[13px]">未仕訳取込</span>
      </div>
      <!-- コンテンツ -->
      <div class="p-4">
        <!-- 取込前 -->
        <template v-if="driveImportModal.phase === 'confirm'">
          <p class="text-[12px] text-gray-700 mb-1">Google Driveから新着ファイルを確認し、仕訳パイプラインに取り込みます。</p>
          <p class="text-[11px] text-gray-400 mb-3">顧問先: {{ activeClientFull?.companyName ?? journalClientId }}</p>
          <div class="flex justify-end gap-2">
            <button @click="driveImportModal.show = false" class="px-3 py-1.5 text-[11px] border border-gray-300 rounded hover:bg-gray-100 text-gray-600">キャンセル</button>
            <button @click="executeDriveImport" class="px-3 py-1.5 text-[11px] bg-emerald-600 text-white rounded hover:bg-emerald-700 font-bold flex items-center gap-1">
              <i class="fa-solid fa-download text-[10px]"></i> 取込開始
            </button>
          </div>
        </template>
        <!-- 取込中 -->
        <template v-else-if="driveImportModal.phase === 'loading'">
          <div class="flex flex-col items-center py-3">
            <i class="fa-solid fa-spinner fa-spin text-emerald-600 text-[24px] mb-2"></i>
            <p class="text-[12px] text-gray-600 font-bold">Driveを確認中...</p>
            <p class="text-[10px] text-gray-400 mt-1">新着ファイルを検索しています</p>
          </div>
        </template>
        <!-- 取込完了 -->
        <template v-else-if="driveImportModal.phase === 'done'">
          <div class="flex flex-col items-center py-2">
            <i :class="driveImportModal.icon" class="text-[28px] mb-2"></i>
            <p class="text-[13px] font-bold" :class="driveImportModal.resultColor">{{ driveImportModal.resultTitle }}</p>
            <p class="text-[11px] text-gray-500 mt-1">{{ driveImportModal.resultDetail }}</p>
          </div>
          <div class="flex justify-center mt-3">
            <button @click="driveImportModal.show = false" class="w-full px-4 py-2 text-[12px] bg-emerald-600 text-white rounded hover:bg-emerald-700 font-bold">OK</button>
          </div>
        </template>
      </div>
    </div>
  </div>

  <!-- 確認ダイアログ（モーダル） -->
  <div
    v-if="confirmDialog.show"
    class="fixed inset-0 z-100 flex items-center justify-center bg-black/30"
    @click.self="confirmDialog.show = false"
  >
    <div class="bg-white rounded-lg shadow-xl p-4 w-72 text-sm" @click.stop>
      <h3 class="font-bold mb-2 text-gray-800">{{ confirmDialog.title }}</h3>
      <p class="text-gray-600 mb-4 whitespace-pre-line text-xs">{{ confirmDialog.message }}</p>
      <div class="flex justify-end gap-2">
        <button
          v-if="confirmDialog.showCancel !== false"
          @click="confirmDialog.show = false"
          class="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 text-gray-600"
        >
          キャンセル
        </button>
        <button
          @click="
            confirmDialog.onConfirm();
            confirmDialog.show = false;
          "
          class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {{ confirmDialog.confirmLabel || UI_MSG.実行 }}
        </button>
      </div>
    </div>
  </div>
  <!-- グローバルツールチップ（fixed、overflow親を越えて表示） -->
  <Teleport to="body">
    <div
      v-show="tooltipVisible"
      class="fixed z-9999 pointer-events-none transition-opacity duration-100"
      :class="tooltipVisible ? 'opacity-100' : 'opacity-0'"
      :style="{ left: tooltipX + 'px', top: tooltipY + 'px', transform: 'translateX(-50%)' }"
    >
      <div
        class="bg-gray-900/95 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap"
      >
        <span v-if="tooltipText">{{ tooltipText }}</span>
        <span v-else-if="tooltipHtml" class="flex flex-col gap-0.5" v-html="tooltipHtml"></span>
      </div>
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-gray-900/95"
      ></div>
    </div>
  </Teleport>
  <!-- ドラッグコピー フローティングラベル -->
  <Teleport to="body">
    <div
      v-if="dragLabelVisible"
      class="fixed z-9999 pointer-events-none bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap flex items-center gap-1"
      :style="{ left: dragLabelX + 'px', top: dragLabelY + 'px' }"
    >
      📋 コピー: {{ dragLabelText || "--" }}
    </div>
  </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  triggerRef,
  watch,
} from "vue";
import { useAccountSettings } from "@/features/account-settings/composables/useAccountSettings";
import { useClients } from "@/features/client-management/composables/useClients";
import { NULL_DISPLAY_UNKNOWN } from "@/shared/field-nullable-spec";
// useDraggable は PastJournalSearchModal.vue に移動済み
import ImageModal from "@/components/ImageModal.vue";
import EvidenceSearchModal from "@/components/EvidenceSearchModal.vue";
import HintModal from "@/components/HintModal.vue";
import CommentModal from "@/components/CommentModal.vue";
import PastJournalSearchModal from "@/components/PastJournalSearchModal.vue";
// modalDrag は PastJournalSearchModal.vue に移動済み
import { useCurrentUser } from "@/composables/useCurrentUser";
import { journalColumns, getDefaultColumnWidths } from "@/shared/journalColumns";
import { useColumnResize } from "@/composables/useColumnResize";
// import { useJournals } from "@/composables/useJournals"; // Phase C: 廃止
import { useRoute } from "vue-router";
import { getDocumentImageUrl } from "../data/document_mock_data";
import type { Journal, JournalLabelMock, JournalEntryLine } from "../types/journal.type";
import { createEmptyStaffNotes, STAFF_NOTE_KEYS, isStaffNoteKey } from "../types/staff_notes";
import type { StaffNoteKey } from "../types/staff_notes";
import type { ConfirmedJournal, ConfirmedJournalEntry } from "../types/confirmed_journal.type";
import { isImportedJournal, isMfJournal } from "../types/journal-list-row";
import type { JournalListRow } from "../types/journal-list-row";

import { toMfCsvDate } from "@/utils/mf-csv-date";
import { syncWarningLabelsCore, validateByVoucherType, getMegaGroup, validateDebitCreditCombination, isTaxCategoryInvalidForMode, resolveValidTaxCategoryForMode } from "@/utils/journalWarningSync";
import type { SyncWarningResult } from "@/utils/journalWarningSync";
import { VOUCHER_TYPE_RULES } from '@/data/master/voucherTypeRules';
import {
  CHECK_STATUS_OPTIONS, PAGE_SIZE_OPTIONS,
  PLACEHOLDER_EMPTY,
  VOUCHER_DOC_FILTER_OPTIONS, VOUCHER_TYPES,
} from '@/constants/vendorOptions';
import { isIndividualType, getClientDisplayName } from '@/constants/clientOptions';
import type { SelectOption } from '@/constants/clientOptions';
import { UI_MSG } from '@/constants/uiMessages';
import {
  FIELD_ACCOUNT, FIELD_TAX_CATEGORY, FIELD_AMOUNT, FIELD_AMOUNT_DIFF,
} from '@/constants/validationMessages';
import type { HintSuggestion } from '@/types/hintTypes';
import { useInlineEdit } from '@/composables/useInlineEdit';
import type { CombinedRow, UndoSnapshot, UiEntryLine } from '@/composables/useInlineEdit';
import { useCellDragAndFill } from '@/composables/useCellDragAndFill';
import { useAccountCombobox } from '@/composables/useAccountCombobox';
import { useRepositories } from '@/composables/useRepositories';

const { repos } = useRepositories();

// 過去仕訳検索モーダル用の科目選択肢（顧問先科目から生成）
const accountOptionsForModal = computed<SelectOption[]>(() =>
  clientSettings.accounts.value
    .filter((a) => !a.hidden)
    .map((a) => ({ value: a.accountId, label: a.name })),
);

/** 過去仕訳検索モーダル用: AI仕訳のみ抽出（取込仕訳はconfirmedJournalsで別送） */
const aiJournalsForModal = computed<Journal[]>(() =>
  journals.value.filter((j): j is Journal => !isImportedJournal(j)),
);

// 列幅カスタマイズ
const {
  columnWidths,
  onResizeStart,
  resetWidths: resetColWidths,
} = useColumnResize("journal-list", getDefaultColumnWidths());

/** 列幅クラス（flex-1列はTailwindクラス、他は空） */
function colWidthClass(col: { defaultPx: number; width: string }) {
  return col.defaultPx === 0 ? col.width : "";
}
/** 列幅スタイル（px列はwidth+flexShrink、flex-1列は空） */
function colWidthStyle(col: { defaultPx: number; key: string }) {
  return col.defaultPx > 0 ? { width: columnWidths.value[col.key] + "px", flexShrink: 0 } : {};
}

// ── determination_method（科目確定方法）UI表示判定 ──
// パイプライン由来の確定方法のみ青背景・アイコンを表示する。
// legacy（旧データ）/ imported（MF取込）/ manual（手動）は表示対象外。
const PIPELINE_METHODS = ['t_number', 'match_key', 'learning_rule', 'industry_vector', 'ai_fallback'] as const
const LEARNING_METHODS = ['t_number', 'match_key', 'learning_rule', 'industry_vector'] as const
/** パイプラインで科目確定された仕訳か（青背景表示用） */
function isPipelineDetermined(journal: Journal): boolean {
  return !!journal.determination_method && PIPELINE_METHODS.includes(journal.determination_method as typeof PIPELINE_METHODS[number])
}
/** 学習/ルールで確定された仕訳か（🎓アイコン表示用） */
function isLearningDetermined(journal: Journal): boolean {
  return !!journal.determination_method && LEARNING_METHODS.includes(journal.determination_method as typeof LEARNING_METHODS[number])
}

// Phase C: localJournals廃止。全更新はupdateJournalField()経由のPATCH API。
const route = useRoute();
const journalClientId = computed(() => {
  const id = route.params.clientId;
  return typeof id === 'string' ? id : 'default';
});
// const { journals: localJournals } = useJournals(journalClientId); // ← 廃止
// Phase C: journalsはshallowRefで管理。API経由で取得。
const journals = shallowRef<Journal[]>([]);
/** API応答の売上/経費/差額サマリー */
const journalSummary = ref<{ revenue: number; expense: number; profit: number }>({ revenue: 0, expense: 0, profit: 0 });

// ────── 未仕訳取込（Drive API経由 + モーダル） ──────
const isDriveImporting = ref(false);
const driveImportModal = ref<{
  show: boolean;
  phase: 'confirm' | 'loading' | 'done';
  icon: string;
  resultTitle: string;
  resultDetail: string;
  resultColor: string;
}>({
  show: false,
  phase: 'confirm',
  icon: '',
  resultTitle: '',
  resultDetail: '',
  resultColor: '',
});

function showDriveImportModal() {
  if (isDriveImporting.value) return;
  driveImportModal.value = {
    show: true,
    phase: 'confirm',
    icon: '',
    resultTitle: '',
    resultDetail: '',
    resultColor: '',
  };
}

async function executeDriveImport() {
  isDriveImporting.value = true;
  driveImportModal.value.phase = 'loading';

  try {
    const data = await repos.drive.pollClient(journalClientId.value);

    if (data.ok && data.added && data.added > 0) {
      driveImportModal.value.icon = 'fa-solid fa-circle-check text-emerald-500';
      driveImportModal.value.resultTitle = `${data.added}件 取り込み完了`;
      driveImportModal.value.resultDetail = '仕訳一覧に反映しました';
      driveImportModal.value.resultColor = 'text-emerald-700';
      await fetchJournalList();
    } else if (data.error) {
      driveImportModal.value.icon = 'fa-solid fa-triangle-exclamation text-amber-500';
      driveImportModal.value.resultTitle = '取込できませんでした';
      driveImportModal.value.resultDetail = data.error;
      driveImportModal.value.resultColor = 'text-amber-700';
    } else {
      driveImportModal.value.icon = 'fa-solid fa-circle-info text-blue-500';
      driveImportModal.value.resultTitle = '新着ファイルなし';
      driveImportModal.value.resultDetail = '未取込のファイルはありません';
      driveImportModal.value.resultColor = 'text-gray-600';
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    driveImportModal.value.icon = 'fa-solid fa-circle-xmark text-red-500';
    driveImportModal.value.resultTitle = 'エラー';
    driveImportModal.value.resultDetail = msg;
    driveImportModal.value.resultColor = 'text-red-700';
  } finally {
    isDriveImporting.value = false;
    driveImportModal.value.phase = 'done';
  }
}

// ────── 顧問先連動（勘定科目・税区分フィルタ） ──────
const { clients, currentClient } = useClients();

/** 選択中の顧問先の完全なClientオブジェクト */
const activeClientFull = computed(() => {
  if (!currentClient.value) return null;
  return clients.value.find((c) => c.clientId === currentClient.value!.clientId) ?? null;
});

// 顧問先の勘定科目 composable（useAccountSettings経由）
// ※ フォールバックはuseAccountSettings内部で処理済み。masterSettings不要。
// ※ clientIdが変わった場合はVue Routerが再マウントするため、setupトップレベルで安全。
const clientSettings = useAccountSettings("client", currentClient.value?.clientId ?? "");

// ────── Phase C-1: インライン編集 + Undo/Redo composable ──────
const {
  editingCell,
  editingValue,
  editingOriginalValue,
  undoStack,
  redoStack,
  snapshotJournal,
  pushUndo,
  undo,
  redo,
  isEditing,
  startCellEdit,
  commitCellEdit,
  cancelCellEdit,
  onAmountInput,
  // parseDateInput — 現在未使用（将来の日付セル実装で復活予定）
  setEntryField,
  getCombinedRows,
  isCompoundJournal,
  hasEntry,
} = useInlineEdit({
  journals,
  updateJournalField,
  accounts: computed(() => clientSettings.accounts.value),
  assertEditableJournal,
});

// ────── Phase C-2: セルドラッグ&フィルハンドル composable ──────
const {
  // fillHandle — 現在未使用（将来のフィルハンドルUI実装で復活予定）
  isFillable,
  startFillDrag,
  isFillTargetCell,
  // applyFillValue — 現在未使用（フィル確定処理で復活予定）
  cellDrag,
  dragLabelVisible,
  dragLabelText,
  dragLabelX,
  dragLabelY,
  startCellDrag,
  isDragOver,
  isDragCompatibleCol,
  isDragIncompatibleCol,
} = useCellDragAndFill({
  journals,
  editingCell,
  updateJournalField,
  snapshotJournal,
  pushUndo,
  setEntryField,
  isCompoundJournal,
  assertEditableJournal,
  resolveDefaultTaxForClient,
  accounts: computed(() => clientSettings.accounts.value),
  subAccounts: computed(() => clientSettings.subAccounts.value),
  onDropToSearch: (text: string) => {
    globalSearchQuery.value = text;
  },
  onMountedCallback: () => {
    journals.value.forEach((j) => syncWarningLabels(j, true));
  },
});

const filteredAccounts = computed(() => {
  const client = activeClientFull.value;
  const clientType = client?.type ?? "corp";
  const hasRental = client?.hasRentalIncome ?? false;

  // composableがあればvisibleAccountsを使用（非表示科目除外済み）
  const source = clientSettings.visibleAccounts.value;

  return source
    .filter((acc) => {
      if (acc.hidden) return false;
      if (acc.target === clientType) {
        if (isIndividualType(clientType) && !hasRental && acc.category.includes(UI_MSG.カテゴリ_不動産))
          return false;
        return true;
      }
      return false;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
});

// ────── Phase C-3: 科目/税区分/補助科目コンボボックス composable ──────
const {
  // accountGroupsForJournal — 現在未使用（テンプレート側でfilterAccountGroupsを直接使用）
  // getTaxGroupsForEntry — 現在未使用（テンプレート側でfilterTaxGroupsを直接使用）
  filterAccountGroups,
  expandedMegaGroup,
  getAccountsForMegaGroup,
  filterTaxGroups,
  selectAccountItem,
  selectTaxItem,
  blurAccountEdit,
  blurTaxEdit,
  getSubAccountCandidates,
  filterSubAccountCandidates,
  selectSubAccountItem,
  blurSubAccountEdit,
} = useAccountCombobox({
  editingCell,
  editingValue,
  commitCellEdit,
  snapshotJournal,
  pushUndo,
  updateJournalField,
  resolveDefaultTaxForClient,
  runAccountValidation,
  filteredAccounts,
  clientSettings,
  consumptionTaxMode: computed(() => activeClientFull.value?.consumptionTaxMode),
});

/** ドットパスで生値を取得（税区分名称変換なし）
 * 動的パスアクセスのためkeyof型安全性は保証できない。内部でunknown経由でRecordにキャストする。
 */
function getRawValue(obj: Journal | CombinedRow, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (o, key) => {
        if (o == null || typeof o !== 'object') return undefined;
        return (o as Record<string, unknown>)[key];
      },
      obj as unknown,
    );
}

/** getRawValueのstring特化版（テンプレートで安全に使用） */
function getRawString(obj: Journal | CombinedRow, path: string): string {
  const v = getRawValue(obj, path);
  return typeof v === 'string' ? v : '';
}

// ────── 区分ドロップダウン（D7a: category-first選択の起点） ──────
// 科目分類定数は shared/data/account-category-rules.ts に統合済み
// 3大グループ・BS全カテゴリは constants/journalConstants.ts に集約
// getAccountGroupDirection, getCategoryLabel → useAccountCombobox.ts に移動済み
import {
  MEGA_GROUPS,
  WARNING_LABEL_MAP,
  LABEL_KEY_MAP,
  TIP_RULE_APPLIED,
  TIP_RULE_AVAILABLE,
  TIP_CREDIT_CARD_PAY,
  TIP_MEMO_EXISTS,
  TIP_NOT_QUALIFIED,
} from "@/constants/journalConstants";
import type { MegaGroupType } from "@/constants/journalConstants";
import { resolveTaxNameForSoftware } from '@/shared/mappings/taxCategoryMappings';
import type { AccountingSoftwareKey } from '@/shared/mappings/taxCategoryMappings';

/** 証票意味選択肢 — vendorOptionsの共有定数を使用 */
// VOUCHER_TYPES は vendorOptions.ts からimport済み

/**
 * 顧問先の課税方式に基づいて、デフォルト税区分名を変換する。
 * - 免税: すべて「対象外」に強制変換
 * - 本則/簡易: そのまま返す
 */
function resolveDefaultTaxForClient(defaultTaxName: string): string {
  const taxMode = activeClientFull.value?.consumptionTaxMode;
  if (!taxMode) return defaultTaxName;
  // 免税時はCOMMON_EXEMPTに変換（sharedのSSOTと同じロジック）
  return resolveValidTaxCategoryForMode(defaultTaxName, taxMode, clientSettings.taxCategories.value);
}

/**
 * 税区分が顧問先の課税方式と矛盾しているかチェックする。
 * - 免税: 「対象外」以外は不正
 * - 本則: 業種区分付き（_T1〜_T6）は不正
 * - 簡易: 不正なし
 * @returns true = 矛盾あり（赤背景で警告すべき）
 */
function isTaxCategoryInvalid(taxCategoryId: string | null | undefined): boolean {
  if (!taxCategoryId) return false;
  const taxMode = activeClientFull.value?.consumptionTaxMode;
  if (!taxMode) return false;
  // sharedの共通判定関数を使用（データ駆動。IDパターンマッチに依存しない）
  return isTaxCategoryInvalidForMode(taxCategoryId, taxMode, clientSettings.taxCategories.value);
}

// ── 税区分矛盾モーダル ──
const showTaxMismatchModal = ref(false);

/** 矛盾サマリ: { total, items: [{ from, to, count }] } */
const taxMismatchSummary = computed(() => {
  const taxMode = activeClientFull.value?.consumptionTaxMode;
  if (!taxMode) return { total: 0, items: [] as { from: string; to: string; count: number }[] };

  const countMap = new Map<string, number>();
  for (const j of journals.value) {
    if (isImportedJournal(j)) continue; // 取込仕訳は税区分不整合カウント対象外
    for (const e of [...j.debit_entries, ...j.credit_entries]) {
      if (isTaxCategoryInvalid(e.tax_category_id)) {
        countMap.set(e.tax_category_id!, (countMap.get(e.tax_category_id!) || 0) + 1);
      }
    }
  }

  const resolveTo = (from: string): string => {
    return resolveValidTaxCategoryForMode(from, taxMode, clientSettings.taxCategories.value);
  };

  const items = [...countMap.entries()].map(([from, count]) => ({
    from: resolveTaxCategoryName(from),
    to: resolveTaxCategoryName(resolveTo(from)),
    count,
  }));

  return { total: items.reduce((s, i) => s + i.count, 0), items };
});

/** 一括修正: 全ての矛盾税区分を適切な値に変換（既存undo/redoで取り消し可能） */
function fixAllTaxMismatches() {
  const taxMode = activeClientFull.value?.consumptionTaxMode;
  if (!taxMode) return;

  // 修正対象の仕訳IDを収集
  const targetJournalIds = new Set<string>();
  for (const j of journals.value) {
    if (isImportedJournal(j)) continue; // 取込仕訳は修正対象外
    for (const e of [...j.debit_entries, ...j.credit_entries]) {
      if (e && isTaxCategoryInvalid(e.tax_category_id)) {
        targetJournalIds.add(j.journalId);
      }
    }
  }
  if (targetJournalIds.size === 0) return;

  // 修正前のスナップショットを保存
  const beforeSnapshots = [...targetJournalIds]
    .map((id) => snapshotJournal(id))
    .filter((s): s is UndoSnapshot => s !== null);

  // 修正を適用
  for (const j of journals.value) {
    if (!targetJournalIds.has(j.journalId)) continue;
    if (isImportedJournal(j)) continue; // 取込仕訳は税区分修正対象外
    for (const e of [...j.debit_entries, ...j.credit_entries]) {
      if (!e || !isTaxCategoryInvalid(e.tax_category_id)) continue;
      e.tax_category_id = resolveValidTaxCategoryForMode(e.tax_category_id ?? "", taxMode, clientSettings.taxCategories.value);
    }
  }

  // 修正後のスナップショットを保存 → pushUndo
  const afterSnapshots = [...targetJournalIds]
    .map((id) => snapshotJournal(id))
    .filter((s): s is UndoSnapshot => s !== null);
  pushUndo(beforeSnapshots, afterSnapshots);
  // Phase C: 変更した仕訳のentriesをPATCH送信
  for (const j of journals.value) {
    if (!targetJournalIds.has(j.journalId)) continue;
    if (isImportedJournal(j)) continue;
    updateJournalField(j.journalId, {
      debit_entries: j.debit_entries,
      credit_entries: j.credit_entries,
    });
  }
}

// ページ初回表示時: 矛盾があればモーダルを自動表示
watch(
  taxMismatchSummary,
  (summary) => {
    if (summary.total > 0 && !showTaxMismatchModal.value) {
      showTaxMismatchModal.value = true;
    }
  },
  { immediate: true },
);
// ────── 貸借科目バリデーション（5分類 + 逆仕訳例外） ──────
// getMegaGroup / validateDebitCreditCombination は
// shared/validation/journalValidationCore.ts（SSOT）から import済み

/** 5分類グループの表示名 */
function megaGroupLabel(group: MegaGroupType): string {
  switch (group) {
    case "sales":
      return UI_MSG.分類_売上;
    case "expense":
      return UI_MSG.分類_経費仕入;
    case "bs_al":
      return UI_MSG.分類_資産負債;
    case "bs_equity":
      return UI_MSG.分類_純資産;
    default:
      return UI_MSG.分類_不明;
  }
}

/**
 * 借方/貸方の5分類バリデーション（逆仕訳例外付き）
 *
 * 正当な組み合わせ（借方×貸方）:
 *   経費    × 資産負債  → 正常（通常の経費支払い）
 *   資産負債 × 売上     → 正常（通常の売上計上）
 *   資産負債 × 資産負債  → 正常（振替）
 *   経費    × 純資産    → 正常（事業主借で経費支払い等）
 *   純資産   × 資産負債  → 正常（事業主貸で出金等）
 *   資産負債 × 経費     → 逆仕訳（戻入・返品のみ許容）
 *   売上    × 資産負債  → 逆仕訳（値引き・返品のみ許容）
 *
 * 不正な組み合わせ:
 *   売上 × 売上, 経費 × 経費, 売上 × 経費, 経費 × 売上
 *   純資産 × 売上, 純資産 × 経費, 売上 × 純資産, 経費 × 純資産
 *   純資産 × 純資産
 *
 * @returns null=正常、string=警告メッセージ
 */
// validateDebitCreditCombination は shared からimport済み（上記参照）

/** 勘定科目選択後の3大グループバリデーション実行 */
function runAccountValidation(journal: Journal): void {
  // まず全警告ラベルを同期（CATEGORY_CONFLICT / VOUCHER_TYPE_CONFLICT含む）
  syncWarningLabels(journal);

  // 全借方×全貸方のクロスチェック（複合仕訳対応）
  const accounts = clientSettings.accounts.value;
  let warning: string | null = null;
  let debitAccount: string | null = null;
  let creditAccount: string | null = null;
  let debitGroup: MegaGroupType = null;
  let creditGroup: MegaGroupType = null;
  for (const dEntry of journal.debit_entries) {
    for (const cEntry of journal.credit_entries) {
      const dAcct = dEntry.account ?? null;
      const cAcct = cEntry.account ?? null;
      const dGrp = getMegaGroup(dAcct, accounts);
      const cGrp = getMegaGroup(cAcct, accounts);
      const w = validateDebitCreditCombination(dGrp, cGrp, dAcct, cAcct, accounts);
      if (w) {
        warning = w;
        debitAccount = dAcct;
        creditAccount = cAcct;
        debitGroup = dGrp;
        creditGroup = cGrp;
        break;
      }
    }
    if (warning) break;
  }

  // Step 1: 5分類バリデーション（逆仕訳例外付き）→ モーダル表示のみ
  if (warning) {
    const debitLabel = debitAccount ? `${debitAccount}（${megaGroupLabel(debitGroup)}）` : UI_MSG.未設定;
    const creditLabel = creditAccount
      ? `${creditAccount}（${megaGroupLabel(creditGroup)}）`
      : UI_MSG.未設定;
    confirmDialog.value = {
      show: true,
      title: UI_MSG.科目組み合わせ警告,
      message: `${warning}\n\n借方: ${debitLabel}\n貸方: ${creditLabel}`,
      onConfirm: () => {
        // モーダルを閉じるのみ。CATEGORY_CONFLICTラベルは
        // syncWarningLabelsが科目修正時に自動除去する
      },
      confirmLabel: UI_MSG.確認済み,
      showCancel: false,
    };
    return; // 基本バリデーション警告があれば高度バリデーションはスキップ
  }

  // Step 2: 種別ごと高度バリデーション（voucher_typeベース）→ モーダル表示のみ
  const voucherType = journal.voucher_type;
  if (!voucherType || !debitAccount || !creditAccount) return;

  const accts = clientSettings.accounts.value;
  const voucherWarning = validateByVoucherType(voucherType, journal, accts, VOUCHER_TYPE_RULES);
  if (voucherWarning) {
    confirmDialog.value = {
      show: true,
      title: UI_MSG.種別チェック警告,
      message: `${voucherWarning}\n\n証票意味: ${voucherType}\n借方: ${debitAccount}\n貸方: ${creditAccount}`,
      onConfirm: () => {
        // モーダルを閉じるのみ。VOUCHER_TYPE_CONFLICTラベルは
        // syncWarningLabelsが科目修正時に自動除去する
      },
      confirmLabel: UI_MSG.確認済み,
      showCancel: false,
    };
  }
}

/** 証票意味矛盾の勘定科目マップ（セルハイライト用） */
const voucherTypeConflictMap = new Map<string, { debit: Set<string>; credit: Set<string> }>();

/**
 * 段階A: 警告列バリデーション（双方向同期）
 * shared/validation/journalValidationCore.ts（SSOT）を呼び出し、
 * UI固有のセルハイライトMap更新 + モーダル表示を行う。
 */
function syncWarningLabels(journal: Journal, silent = false): void {
  // 取込仕訳は確定済みなので警告ラベル同期不要
  if (isImportedJournal(journal)) return;
  const allAccounts = clientSettings.accounts.value;
  const allTaxCategories = clientSettings.taxCategories.value;

  // 顧問先コンテキスト（期外日付・役員貸付金・少額適格用）
  const client = activeClientFull.value;
  const validationContext = {
    fiscalMonth: client?.fiscalMonth ?? 3,
  };

  // shared（SSOT）を呼び出し — labels を直接 mutate する
  const result: SyncWarningResult = syncWarningLabelsCore(journal, allAccounts, allTaxCategories, VOUCHER_TYPE_RULES, validationContext);

  // ── UI固有: セルハイライトMap更新 ──

  // #7 CATEGORY_CONFLICT
  if (result.categoryConflicts.debit.size > 0 || result.categoryConflicts.credit.size > 0) {
    categoryConflictMap.set(journal.journalId, result.categoryConflicts);
  } else {
    categoryConflictMap.delete(journal.journalId);
  }

  // #8 VOUCHER_TYPE_CONFLICT
  if (result.voucherTypeConflicts.debit.size > 0 || result.voucherTypeConflicts.credit.size > 0) {
    voucherTypeConflictMap.set(journal.journalId, result.voucherTypeConflicts);
  } else {
    voucherTypeConflictMap.delete(journal.journalId);
  }

  // #7b SAME_ACCOUNT_BOTH_SIDES
  if (result.sameAccountBothSides.size > 0) {
    sameAccountBothSidesMap.set(journal.journalId, result.sameAccountBothSides);
  } else {
    sameAccountBothSidesMap.delete(journal.journalId);
  }

  // ── UI固有: モーダル表示 ──
  if (result.addedLabels.length > 0 && !silent) {
    const warningText = result.addedLabels.map((l) => warningLabelMap[l]?.label ?? l).join("\n");
    confirmDialog.value = {
      show: true,
      title: UI_MSG.警告検出,
      message: `${UI_MSG.警告検出接頭}${warningText}`,
      onConfirm: () => {
        /* 確認済み */
      },
      confirmLabel: UI_MSG.確認,
      showCancel: false,
    };
  } else if (result.removedLabels.length > 0 && !silent) {
    const resolvedText = result.removedLabels.map((l) => warningLabelMap[l]?.label ?? l).join("\n");
    confirmDialog.value = {
      show: true,
      title: UI_MSG.警告解消,
      message: `${UI_MSG.警告解消接頭}${resolvedText}`,
      onConfirm: () => {
        /* OK */
      },
      confirmLabel: "OK",
      showCancel: false,
    };
  }
}

/**
 * 変更6: 対象セルの赤背景ハイライト
 * 警告ラベルと列キーの対応を判定し、赤背景CSSクラスを返す。
 */
function getWarningCellClass(
  journal: Journal,
  colKey: string,
  entry?: UiEntryLine | null,
): string {
  const labels = journal.labels;
  /** 警告セルの共通背景CSSクラス（一箇所管理） */
  const W = "!bg-red-400 !text-white";

  // DEBIT_CREDIT_MISMATCH（貸借不一致）→ 全金額セル
  if (colKey.includes("amount") && labels.includes("DEBIT_CREDIT_MISMATCH")) return W;

  // AMOUNT_UNCLEAR（金額不明）→ nullの金額セルのみ
  if (colKey.includes("amount") && labels.includes("AMOUNT_UNCLEAR") && entry) {
    if (entry.amount == null) return W;
  }

  // ACCOUNT_UNKNOWN（勘定科目不明）→ null or マスタに存在しない科目セル
  if (
    colKey.includes("account") &&
    !colKey.includes("sub_account") &&
    labels.includes("ACCOUNT_UNKNOWN") &&
    entry
  ) {
    if (entry.account == null || entry.account === "") return W;
    // マスタに存在しない科目も赤背景
    const acctList = clientSettings.accounts.value;
    const acctIdSet = new Set(acctList.map((a) => a.accountId));
    if (!acctIdSet.has(entry.account)) return W;
  }

  // TAX_UNKNOWN（税区分不明）→ nullの税区分セルのみ
  if (colKey.includes("tax_category") && labels.includes("TAX_UNKNOWN") && entry) {
    if (entry.tax_category_id == null || entry.tax_category_id === "") return W;
  }

  // CATEGORY_CONFLICT（貸借科目矛盾）→ 問題のある勘定科目セルのみ
  if (
    colKey.includes("account") &&
    !colKey.includes("sub_account") &&
    labels.includes("CATEGORY_CONFLICT") &&
    entry
  ) {
    const acctName = entry.account;
    if (!acctName) return "";
    const side = colKey.startsWith("debit") ? "debit" : "credit";
    const conflict = categoryConflictMap.get(journal.journalId);
    if (
      conflict &&
      ((side === "debit" && conflict.debit.has(acctName)) ||
        (side === "credit" && conflict.credit.has(acctName)))
    )
      return W;
  }

  // SAME_ACCOUNT_BOTH_SIDES（借方貸方に同一科目）→ 該当科目セルのみ黄色
  if (
    colKey.includes("account") &&
    !colKey.includes("sub_account") &&
    labels.includes("SAME_ACCOUNT_BOTH_SIDES") &&
    entry
  ) {
    const acctName = entry.account;
    if (acctName) {
      const overlap = sameAccountBothSidesMap.get(journal.journalId);
      if (overlap && overlap.has(acctName)) return "!bg-yellow-300 text-black!";
    }
  }

  // DATE_UNKNOWN（日付不明）→ 日付セル
  if (colKey === "voucher_date" && labels.includes("DATE_UNKNOWN")) return W;

  // FUTURE_DATE（未来日付）→ 日付セル赤背景
  if (colKey === "voucher_date" && labels.includes("FUTURE_DATE")) return W;

  // DESCRIPTION_UNKNOWN（摘要不明）→ 摘要セル
  if (colKey === "description" && labels.includes("DESCRIPTION_UNKNOWN")) return W;

  // VOUCHER_TYPE_CONFLICT（証票意味矛盾）→ 証票意味セル + 矛盾科目セル
  if (labels.includes("VOUCHER_TYPE_CONFLICT")) {
    if (colKey === "voucher_type") return W;
    // 矛盾している勘定科目セルも赤ハイライト
    if (colKey.includes("account") && !colKey.includes("sub_account") && entry) {
      const acctName = entry.account;
      if (!acctName) return W; // null科目は無条件で赤背景
      const side = colKey.startsWith("debit") ? "debit" : "credit";
      const vtConflict = voucherTypeConflictMap.get(journal.journalId);
      if (
        vtConflict &&
        ((side === "debit" && vtConflict.debit.has(acctName)) ||
          (side === "credit" && vtConflict.credit.has(acctName)))
      )
        return W;
    }
  }

  // TAX_ACCOUNT_MISMATCH（税区分科目矛盾）→ 税区分セル
  if (colKey.includes("tax_category") && labels.includes("TAX_ACCOUNT_MISMATCH")) return W;

  return "";
}

/**
 * 日付セルの期間別テキスト色を返す
 * - 前期以前: 青文字（text-blue-500）
 * - 当期: 黒文字（空文字＝デフォルト）
 * - 未来日付: 赤背景はgetWarningCellClassで処理済みのためここでは空
 *
 * 会計期間の算出: activeClientFull.fiscalMonthから当期の開始日・終了日を計算
 *   例: fiscalMonth=3 → 当期: 2025/04/01〜2026/03/31（本日=2026/04/03の場合）
 */
function getDatePeriodClass(dateStr: string | null): string {
  if (!dateStr) return "";

  const client = activeClientFull.value;
  const fiscalMonth = client?.fiscalMonth ?? 3; // デフォルト3月決算

  // 本日を取得
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // 当期の期末年月日を算出
  // fiscalMonth=3の場合、本日が2026/04/03なら期末=2027/03/31
  // fiscalMonth=3の場合、本日が2026/02/01なら期末=2026/03/31
  let fiscalEndYear: number;
  if (currentMonth <= fiscalMonth) {
    // 本日の月が決算月以前 → 当期期末は今年のfiscalMonth末日
    fiscalEndYear = currentYear;
  } else {
    // 本日の月が決算月より後 → 当期期末は翌年のfiscalMonth末日
    fiscalEndYear = currentYear + 1;
  }

  // 期首日: fiscalEndYear-1年のfiscalMonth+1月の1日
  const fiscalStartDate = new Date(fiscalEndYear - 1, fiscalMonth, 1);
  const fiscalStartStr = `${fiscalStartDate.getFullYear()}-${String(fiscalStartDate.getMonth() + 1).padStart(2, "0")}-${String(fiscalStartDate.getDate()).padStart(2, "0")}`; // ローカルTZ

  // 判定
  if (dateStr < fiscalStartStr) {
    return "text-blue-500"; // 前期以前
  }
  // 当期（fiscalStartStr <= dateStr <= fiscalEndStr）またはそれ以降はデフォルト
  return "";
}

// validateByVoucherType は journalWarningSync.ts からインポート済み


// ────── インライン編集 + Undo/Redo → useInlineEdit.ts に移動済み ──────

// ────── フィルハンドル + セルドラッグ + イベント登録 → useCellDragAndFill.ts に移動済み ──────




// isCompoundJournal, hasEntry → useInlineEdit.ts に移動済み


/** CATEGORY_CONFLICT: 問題のあるエントリ科目名を記録 */
const categoryConflictMap = new Map<string, { debit: Set<string>; credit: Set<string> }>();
/** SAME_ACCOUNT_BOTH_SIDES: 借方貸方の両方に存在する科目名を記録 */
const sameAccountBothSidesMap = new Map<string, Set<string>>();

// フィルタリング状態（チェックボックス）
const showUnexported = ref<boolean>(true); // 未出力を表示（初期: ON）
const showExported = ref<boolean>(false); // 出力済を表示: 廃止（常にfalse。出力済みはダウンロード履歴画面で確認）
const showExcluded = ref<boolean>(false); // 出力対象外を表示（初期: OFF）
const showTrashed = ref<boolean>(false); // ゴミ箱を表示（初期: OFF）
const showImported = ref<boolean>(false); // 過去仕訳CSVを表示（初期: OFF）
const globalSearchQuery = ref<string>(""); // 全列横断検索クエリ

/** セルドラッグ中に検索窓の上にいるか（ドロップ先ハイライト用） */
const isSearchDropTarget = computed(() => {
  return cellDrag.value?.dragging === true && cellDrag.value?.dropToSearch === true;
});

// 証票種別フィルタ（空文字 = 全て） — vendorOptionsの共有定数を使用
const voucherFilter = ref<string>("");
const voucherFilterOptions = VOUCHER_DOC_FILTER_OPTIONS;

// ────── 決算年度バー（期間フィルタ） ──────

/**
 * 決算月から会計年度の期首月を算出する。
 * 例: fiscalMonth=6（6月決算）→ 期首月=7（7月始まり）
 * 例: fiscalMonth=12（個人事業主）→ 期首月=1（1月始まり）
 */
function getFiscalStartMonth(fiscalMonth: number): number {
  return (fiscalMonth % 12) + 1;
}

/**
 * 指定年度の期首日・期末日を算出する。
 * 年度ラベルは期末の暦年を使用（例: 2026年度 = 2026年の決算月末に終了する期）。
 * 個人事業主（fiscalMonth=12）→ 2026年度 = 2026/01/01〜2026/12/31
 * 法人（fiscalMonth=6）→ 2026年度 = 2025/07/01〜2026/06/30
 */
function getFiscalYearRange(year: number, fiscalMonth: number): { from: string; to: string } {
  const startMonth = getFiscalStartMonth(fiscalMonth);
  // 期首の暦年: 決算月が12月→期首も同年。それ以外→前年
  const startYear = startMonth <= fiscalMonth ? year : year - 1;
  const fromM = String(startMonth).padStart(2, '0');
  const toM = String(fiscalMonth).padStart(2, '0');
  // 期末日: 決算月の末日
  const lastDay = new Date(year, fiscalMonth, 0).getDate();
  const toD = String(lastDay).padStart(2, '0');
  return {
    from: `${startYear}-${fromM}-01`,
    to: `${year}-${toM}-${toD}`,
  };
}

/** 直近3期分の年度オプション */
const fiscalYearOptions = computed(() => {
  const fm = activeClientFull.value?.fiscalMonth ?? 12;
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  // 現在の暦年・月が決算月を超えていれば当年度の期末年=来年、そうでなければ今年
  const currentFiscalEndYear = currentMonth > fm ? currentYear + 1 : currentYear;
  const fmStr = String(fm).padStart(2, '0');
  // 直近3期分（当期 + 過去2期）
  const labels = [UI_MSG.年度ラベル_2期前, UI_MSG.年度ラベル_1期前, UI_MSG.年度ラベル_進行期];
  return [0, 1, 2].map(i => {
    const y = currentFiscalEndYear - 2 + i;
    return {
      year: y,
      label: `${labels[i]}-${y}-${fmStr}月`,
      ...getFiscalYearRange(y, fm),
    };
  });
});

/** 選択中の年度（Set: 複数選択可） */
const selectedFiscalYears = ref<Set<number>>(new Set());

// 初期値: 全期間（全年度を選択）
watch(fiscalYearOptions, (opts) => {
  if (selectedFiscalYears.value.size === 0 && opts.length > 0) {
    selectedFiscalYears.value = new Set(opts.map(o => o.year));
  }
}, { immediate: true });

/** 月タブ（決算月基準の12ヶ月配列） */
const fiscalMonthTabs = computed(() => {
  const fm = activeClientFull.value?.fiscalMonth ?? 12;
  const start = getFiscalStartMonth(fm);
  const tabs: number[] = [];
  for (let i = 0; i < 12; i++) {
    tabs.push(((start - 1 + i) % 12) + 1);
  }
  return tabs;
});

/** 選択中の月（Set: 全12月がデフォルト選択） */
const selectedMonths = ref<Set<number>>(new Set());

// 初期値: 全月を選択
watch(fiscalMonthTabs, (tabs) => {
  if (selectedMonths.value.size === 0 && tabs.length > 0) {
    selectedMonths.value = new Set(tabs);
  }
}, { immediate: true });

// ────── 期間バー: ドラッグ選択/解除（年度・月共通、スナップショット+範囲ベース） ──────
const barDragType = ref<'none' | 'pending' | 'year' | 'month'>('none');
const barDragMode = ref<'select' | 'deselect'>('select');
const dragSnapshot = ref<Set<number>>(new Set());
let _dragStartIndex = -1;
let _dragMouseMoved = false; // ドラッグ中にマウスが動いたか

/** バー余白: mousedown（ドラッグ待機状態） */
function onBarMouseDown() {
  barDragType.value = 'pending';
  document.addEventListener('mousemove', onBarMouseMove);
  document.addEventListener('mouseup', onBarMouseUp, { once: true });
}

/** バー: mouseup（ドラッグ終了） */
function onBarMouseUp() {
  barDragType.value = 'none';
  dragSnapshot.value = new Set();
  _dragStartIndex = -1;
  _dragMouseMoved = false;
  document.removeEventListener('mousemove', onBarMouseMove);
}

/** バー: mousemove（ドラッグ中のマウス追跡、mouseenterスキップ防止） */
function onBarMouseMove(event: MouseEvent) {
  const dt = barDragType.value;
  if (dt !== 'year' && dt !== 'month' && dt !== 'pending') return;
  _dragMouseMoved = true; // マウスが動いた
  const el = document.elementFromPoint(event.clientX, event.clientY);
  if (!el || !(el instanceof HTMLElement)) return;

  // closest()で最寄りのdata属性を持つボタンを検出
  const yearEl = el.closest('[data-drag-year]') as HTMLElement | null;
  if (yearEl) {
    const year = Number(yearEl.getAttribute('data-drag-year'));
    if (dt === 'pending') {
      onYearMouseEnter(year);
    } else if (dt === 'year') {
      const idx = fiscalYearOptions.value.findIndex(o => o.year === year);
      if (idx !== -1) applyRangeDrag('year', idx);
    }
    return;
  }

  const monthEl = el.closest('[data-drag-month]') as HTMLElement | null;
  if (monthEl) {
    const month = Number(monthEl.getAttribute('data-drag-month'));
    if (dt === 'pending') {
      onMonthMouseEnter(month);
    } else if (dt === 'month') {
      const idx = fiscalMonthTabs.value.indexOf(month);
      if (idx !== -1) applyRangeDrag('month', idx);
    }
    return;
  }

  // ボタン外（gap/余白）にマウスがある場合: 最寄りのボタンをX座標で判定
  if (dt === 'month') {
    const buttons = document.querySelectorAll<HTMLElement>('[data-drag-month]');
    let closest: { idx: number; dist: number } | null = null;
    buttons.forEach((btn) => {
      const rect = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const dist = Math.abs(event.clientX - centerX);
      const month = Number(btn.getAttribute('data-drag-month'));
      const idx = fiscalMonthTabs.value.indexOf(month);
      if (idx !== -1 && (!closest || dist < closest.dist)) {
        closest = { idx, dist };
      }
    });
    if (closest) applyRangeDrag('month', (closest as { idx: number; dist: number }).idx);
  } else if (dt === 'year') {
    const buttons = document.querySelectorAll<HTMLElement>('[data-drag-year]');
    let closest: { idx: number; dist: number } | null = null;
    buttons.forEach((btn) => {
      const rect = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const dist = Math.abs(event.clientX - centerX);
      const year = Number(btn.getAttribute('data-drag-year'));
      const idx = fiscalYearOptions.value.findIndex(o => o.year === year);
      if (idx !== -1 && (!closest || dist < closest.dist)) {
        closest = { idx, dist };
      }
    });
    if (closest) applyRangeDrag('year', (closest as { idx: number; dist: number }).idx);
  }
}

// ── 年度ピル ──

/** 年度ピル: mousedown */
function onYearMouseDown(year: number) {
  const idx = fiscalYearOptions.value.findIndex(o => o.year === year);
  barDragType.value = 'year';
  barDragMode.value = selectedFiscalYears.value.has(year) ? 'deselect' : 'select';
  dragSnapshot.value = new Set(selectedFiscalYears.value);
  _dragStartIndex = idx;
  applyRangeDrag('year', idx);
  document.addEventListener('mousemove', onBarMouseMove);
  document.addEventListener('mouseup', onBarMouseUp, { once: true });
}

/** 年度ピル: mouseenter */
function onYearMouseEnter(year: number) {
  const idx = fiscalYearOptions.value.findIndex(o => o.year === year);
  if (barDragType.value === 'pending') {
    barDragType.value = 'year';
    barDragMode.value = selectedFiscalYears.value.has(year) ? 'deselect' : 'select';
    dragSnapshot.value = new Set(selectedFiscalYears.value);
    _dragStartIndex = idx;
  }
  if (barDragType.value !== 'year') return;
  applyRangeDrag('year', idx);
}

/** 年度ピルの色判定（4状態） */
function yearPillClass(year: number): string {
  const isSelected = selectedFiscalYears.value.has(year);
  if (barDragType.value === 'year' && dragSnapshot.value.size > 0) {
    const wasSelected = dragSnapshot.value.has(year);
    if (isSelected && !wasSelected) return 'bg-blue-200 text-blue-800'; // 選択予定
    if (!isSelected && wasSelected) return 'bg-red-100 text-red-600';   // 解除予定
  }
  return isSelected
    ? 'bg-blue-600 text-white'
    : 'bg-gray-100 text-gray-500 hover:bg-gray-200';
}

// ── 月タブ ──

/** 月タブ: mousedown */
function onMonthMouseDown(month: number) {
  const idx = fiscalMonthTabs.value.indexOf(month);
  barDragType.value = 'month';
  barDragMode.value = selectedMonths.value.has(month) ? 'deselect' : 'select';
  dragSnapshot.value = new Set(selectedMonths.value);
  _dragStartIndex = idx;
  applyRangeDrag('month', idx);
  document.addEventListener('mousemove', onBarMouseMove);
  document.addEventListener('mouseup', onBarMouseUp, { once: true });
}

/** 月タブ: mouseenter */
function onMonthMouseEnter(month: number) {
  const idx = fiscalMonthTabs.value.indexOf(month);
  if (barDragType.value === 'pending') {
    barDragType.value = 'month';
    barDragMode.value = selectedMonths.value.has(month) ? 'deselect' : 'select';
    dragSnapshot.value = new Set(selectedMonths.value);
    _dragStartIndex = idx;
  }
  if (barDragType.value !== 'month') return;
  applyRangeDrag('month', idx);
}

/** 月タブの色判定（4状態） */
function monthTabClass(month: number): string {
  const isSelected = selectedMonths.value.has(month);
  if (barDragType.value === 'month' && dragSnapshot.value.size > 0) {
    const wasSelected = dragSnapshot.value.has(month);
    if (isSelected && !wasSelected) return 'bg-blue-200 text-blue-800'; // 選択予定
    if (!isSelected && wasSelected) return 'bg-red-100 text-red-600';   // 解除予定
  }
  return isSelected
    ? 'bg-blue-600 text-white'
    : 'bg-gray-50 text-gray-500 hover:bg-gray-200';
}

// ── 共通: 範囲ベースドラッグ適用 ──

/** スナップショットから復元し、範囲内のみモード適用（逆方向対応） */
function applyRangeDrag(type: 'year' | 'month', currentIndex: number) {
  // ドラッグ後に開始位置に戻った場合: スナップショットを完全復元
  if (currentIndex === _dragStartIndex && _dragMouseMoved) {
    if (type === 'year') {
      selectedFiscalYears.value = new Set(dragSnapshot.value);
    } else {
      selectedMonths.value = new Set(dragSnapshot.value);
    }
    return;
  }

  const minIdx = Math.min(_dragStartIndex, currentIndex);
  const maxIdx = Math.max(_dragStartIndex, currentIndex);

  if (type === 'year') {
    const opts = fiscalYearOptions.value;
    const next = new Set(dragSnapshot.value); // スナップショットから復元
    for (let i = 0; i < opts.length; i++) {
      const y = opts[i]?.year;
      if (y === undefined) continue;
      if (i >= minIdx && i <= maxIdx) {
        if (barDragMode.value === 'deselect') { next.delete(y); } else { next.add(y); }
      }
    }
    selectedFiscalYears.value = next;
  } else {
    const tabs = fiscalMonthTabs.value;
    const next = new Set(dragSnapshot.value);
    for (let i = 0; i < tabs.length; i++) {
      const m = tabs[i];
      if (m === undefined) continue;
      if (i >= minIdx && i <= maxIdx) {
        if (barDragMode.value === 'deselect') { next.delete(m); } else { next.add(m); }
      }
    }
    selectedMonths.value = next;
  }
}

/** 全月が選択されているか判定 */
const isAllMonthsSelected = computed(() => {
  return selectedMonths.value.size === 12;
});

/** 選択期間のラベル（YYYY/MM/DD 〜 YYYY/MM/DD） */
const fiscalPeriodLabel = computed(() => {
  const opts = fiscalYearOptions.value;
  const selected = [...selectedFiscalYears.value].sort();
  if (selected.length === 0) return '';
  const first = opts.find(o => o.year === selected[0]);
  const last = opts.find(o => o.year === selected[selected.length - 1]);
  if (!first || !last) return '';
  const fmtDate = (d: string) => d.replace(/-/g, '/');
  return `${fmtDate(first.from)} 〜 ${fmtDate(last.to)}`;
});

/** API送信用: 期間フィルタのdateFrom（選択年度の最小from） */
const fiscalDateFrom = computed(() => {
  const opts = fiscalYearOptions.value;
  const selected = [...selectedFiscalYears.value].sort();
  if (selected.length === 0) return undefined;
  const first = opts.find(o => o.year === selected[0]);
  return first?.from;
});

/** API送信用: 期間フィルタのdateTo（選択年度の最大to） */
const fiscalDateTo = computed(() => {
  const opts = fiscalYearOptions.value;
  const selected = [...selectedFiscalYears.value].sort();
  if (selected.length === 0) return undefined;
  const last = opts.find(o => o.year === selected[selected.length - 1]);
  return last?.to;
});

// ────── 選択状態管理（一括操作バー用） ──────
const selectedIds = ref<Set<string>>(new Set());

// 確認ダイアログ
const confirmDialog = ref<{
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmLabel?: string;
  showCancel?: boolean;
}>({ show: false, title: "", message: "", onConfirm: () => {} });

// 初回ヘルプ表示
const showSelectionHelp = ref(false);
const hasShownHelp = ref(false);

// ドロップダウン制御
const openDropdownId = ref<string | null>(null);

// 凡例モーダル
const legendModalType = ref<"labelType" | "warning" | "voucher_type" | null>(null);

const labelTypeLegend = [
  { short: "レ", label: UI_MSG.証票バッジ_レシート, bgClass: "bg-emerald-600" },
  { short: "請", label: UI_MSG.証票バッジ_請求書, bgClass: "bg-blue-600" },
  { short: "交", label: UI_MSG.証票バッジ_交通費, bgClass: "bg-cyan-600" },
  { short: "ク", label: UI_MSG.証票バッジ_クレカ, bgClass: "bg-purple-600" },
  { short: "銀", label: UI_MSG.証票バッジ_銀行明細, bgClass: "bg-indigo-600" },
  { short: "医", label: UI_MSG.証票バッジ_医療費, bgClass: "bg-pink-600" },
  { short: "外", label: UI_MSG.証票バッジ_対象外, bgClass: "bg-gray-600" },
];

// ボディ用: ラベル名→バッジ情報マッピング
// 証票種類バッジマップ → constants/journalConstants.ts に移動済み
const labelKeyMap = LABEL_KEY_MAP;

// 警告ラベルマップ: Single Source of Truth → constants/journalConstants.ts に移動済み
// WARNING_LABEL_MAP は constants/journalConstants.ts からimport済み
const warningLabelMap = WARNING_LABEL_MAP;

// ======== グローバルツールチップ（position:fixed、overflow親を越えて表示） ========
const tooltipVisible = ref(false);
const tooltipText = ref("");
const tooltipHtml = ref("");
const tooltipX = ref(0);
const tooltipY = ref(0);

function showTooltip(event: MouseEvent, text: string) {
  if (!(event.currentTarget instanceof HTMLElement)) return;
  const rect = event.currentTarget.getBoundingClientRect();
  tooltipText.value = text;
  tooltipHtml.value = "";
  tooltipX.value = rect.left + rect.width / 2;
  tooltipY.value = rect.bottom + 6;
  tooltipVisible.value = true;
}

function showWarningTooltip(event: MouseEvent, labels: string[], journal?: Journal) {
  if (!(event.currentTarget instanceof HTMLElement)) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const warnings = labels.filter((l) => warningLabelMap[l]);
  tooltipHtml.value = warnings
    .map((l) => {
      const w = warningLabelMap[l];
      const dotColor = w?.level === "error" ? "bg-red-400" : w?.level === "info" ? "bg-blue-400" : "bg-yellow-400";
      // D4: on_document（項目存在フラグ）によるホバーメッセージ分岐
      let msg = w?.label ?? l;
      if (journal) {
        // warning_detailsに具体的な理由がある場合はそちらを優先
        const details = journal.warning_details;
        if (details && details[l]) {
          msg = String(details[l]);
        } else if (!isImportedJournal(journal)) {
          // on_document情報はAI仕訳のみ（取込仕訳にはdate_on_document等が存在しない）
          if (l === "DATE_UNKNOWN") {
              msg = journal.date_on_document
                ? UI_MSG.OCR日付読取失敗
                : UI_MSG.OCR日付記載なし;
          } else if (l === "ACCOUNT_UNKNOWN") {
            const onDoc =
              journal.debit_entries[0]?.account_on_document ??
              journal.credit_entries[0]?.account_on_document ??
              false;
            msg = onDoc ? UI_MSG.OCR科目読取失敗 : UI_MSG.OCR科目記載なし;
          } else if (l === "AMOUNT_UNCLEAR") {
            const onDoc =
              journal.debit_entries[0]?.amount_on_document ??
              journal.credit_entries[0]?.amount_on_document ??
              false;
            msg = onDoc ? UI_MSG.OCR金額読取失敗 : UI_MSG.OCR金額記載なし;
          }
        }
      }
      return `<span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}"></span>${msg}</span>`;
    })
    .join("");
  tooltipText.value = "";
  tooltipX.value = rect.left + rect.width / 2;
  tooltipY.value = rect.bottom + 6;
  tooltipVisible.value = true;
}

function hideTooltip() {
  tooltipVisible.value = false;
}

/** B2: 警告モーダル — 確認済みとして警告をdismissalに記録 */
function openWarningConfirmModal(journal: Journal) {
  if (!assertEditableJournal(journal, 'openWarningConfirmModal')) return;
  const warningKeys = Object.keys(warningLabelMap);
  const warnings = journal.labels.filter((l) => warningKeys.includes(l));
  if (warnings.length === 0) return;
  hideTooltip();
  const warningText = warnings.map((l) => warningLabelMap[l]?.label ?? l).join("\n");
  confirmDialog.value = {
    show: true,
    title: UI_MSG.警告確認,
    message: `${UI_MSG.警告確認して出力}${warningText}${UI_MSG.警告確認して出力接尾}`,
    onConfirm: () => {
      // warning_dismissalsに追加（syncWarningLabelsCore再実行時もスキップされる）
      const newDismissals = [...(journal.warning_dismissals || [])];
      for (const w of warnings) {
        if (!newDismissals.includes(w)) newDismissals.push(w);
      }
      // labelsから警告ラベルとEXPORT_EXCLUDEを除去
      const newLabels = journal.labels.filter(
        (l) => !warningKeys.includes(l) && l !== "EXPORT_EXCLUDE",
      );
      // updateJournalFieldで一括処理
      updateJournalField(journal.journalId, {
        warning_dismissals: newDismissals,
        labels: newLabels,
      }, { syncWarnings: false });
    },
  };
}

// ポップオーバー凡例: warningLabelMapから動的生成
const errorLegend = Object.entries(warningLabelMap).filter(([, v]) => v.level === "error");
const warnLegend = Object.entries(warningLabelMap).filter(([, v]) => v.level === "warn");
const infoLegend = Object.entries(warningLabelMap).filter(([, v]) => v.level === "info");

// ────── ヒントモーダル ──────
// 型定義は types/hintTypes.ts に抽出済み
// fetchHintsFromAPI / hintValidations / hintSuggestions / hintLoading / onHintAlternativeChange は HintModal.vue に移動済み

const hintModalJournal = ref<Journal | null>(null);

const hintModalJournalIndex = computed(() => {
  if (!hintModalJournal.value) return -1;
  return paginatedJournals.value.findIndex((j) => j.journalId === hintModalJournal.value!.journalId);
});


async function openHintModal(journal: Journal): Promise<void> {
  if (!canShowHint(journal)) return;
  // canShowHint通過 = AI仕訳確定。isImportedJournalで明示narrow
  if (isImportedJournal(journal)) return;
  hintModalJournal.value = journal;
  // ヒント取得は HintModal.vue の watch が自動実行
}

// generateHintValidations / generateHintSuggestions は
// API側 (api/services/journalHintService.ts) に移設済み。
// onHintAlternativeChange は HintModal.vue に移動済み。

function applyHintSuggestion(s: HintSuggestion): void {
  const journal = hintModalJournal.value;
  if (!journal) return;
  if (!assertEditableJournal(journal, 'applyHintSuggestion')) return;

  const beforeSnap = snapshotJournal(journal.journalId);

  const entries = s.side === "debit" ? journal.debit_entries : journal.credit_entries;

  if (s.field === FIELD_ACCOUNT) {
    const entry = entries[s.entryIndex];
    if (!entry) return;
    entry.account = s.selectedValue;
    // 科目に連動して税区分・補助科目を自動補完
    const allAccts = clientSettings.accounts.value;
    const acctObj = allAccts.find((a) => a.accountId === s.selectedValue);
    if (acctObj) {
      if (acctObj.defaultTaxCategoryId) entry.tax_category_id = acctObj.defaultTaxCategoryId;
      // 補助科目: selectAccountItemと同じくclientSettings.subAccountsから取得
      const sub = clientSettings.subAccounts.value[s.selectedValue];
      // 補助科目: 1件→name自動代入、複数→null（ユーザー選択）、0件→null
      entry.sub_account = sub?.length === 1 ? sub[0]?.name ?? null : null;
    }
  } else if (s.field === FIELD_TAX_CATEGORY) {
    const entry = entries[s.entryIndex];
    if (!entry) return;
    entry.tax_category_id = s.selectedValue;
  } else if (s.field === FIELD_AMOUNT) {
    const entry = entries[s.entryIndex];
    if (!entry) return;
    entry.amount = Number(s.selectedValue);
  } else if (s.field === FIELD_AMOUNT_DIFF) {
    console.log("[Hint] N:N差額は自動修正不可 → 手動修正してください");
    return;
  }

  // updateJournalFieldで一括処理（autoMeta + syncWarningLabels + PATCH送信）
  updateJournalField(journal.journalId, {
    debit_entries: journal.debit_entries,
    credit_entries: journal.credit_entries,
  });

  const afterSnap = snapshotJournal(journal.journalId);
  if (beforeSnap && afterSnap) {
    undoStack.value.push({ before: [beforeSnap], after: [afterSnap] });
    redoStack.value = [];
  }

  // ヒント再計算は HintModal.vue の handleApply 内で自動実行

  console.log(
    `[Hint] 修正適用: ${s.side} [${s.entryIndex}] ${s.field}: ${s.currentLabel} → ${s.selectedLabel}`,
  );
}

function closeDropdown() {
  openDropdownId.value = null;
}

// ────── ワークフローハブ操作（レベル②ローカル状態変更） ──────

/**
 * 編集可能な仕訳を検索する（PATCH送信先特定用）
 * 戻り値はJournal | undefined（取込仕訳は返さない）。
 */
function findEditableJournal(journalId: string): Journal | undefined {
  return journals.value.find(
    (j): j is Journal => j.journalId === journalId && !isImportedJournal(j)
  );
}

function setReadStatus(journal: Journal, value: boolean) {
  if (!assertEditableJournal(journal, 'setReadStatus')) return;
  const target = findEditableJournal(journal.journalId);
  if (!target || target.is_read === value) return; // 同じ状態なら何もしない
  closeDropdown();
  confirmDialog.value = {
    show: true,
    title: value ? UI_MSG.既読にする : UI_MSG.未読にする,
    message: `「${journal.description}」を${value ? UI_MSG.既読 : UI_MSG.未読}${UI_MSG.にしますか}`,
    onConfirm: () => {
      target.is_read = value;
      const patch: Record<string, unknown> = { is_read: value };
      if (value) {
        target.read_by = currentStaffId.value ?? null;
        target.read_at = new Date().toISOString();
        patch.read_by = target.read_by;
        patch.read_at = target.read_at;
      }
      updateJournalField(journal.journalId, patch);
      console.log(`[DD] 既読変更: ${journal.journalId} → is_read=${value} by ${currentStaffId.value}`);
      confirmDialog.value = {
        show: true,
        title: UI_MSG.完了,
        message: `${value ? UI_MSG.既読 : UI_MSG.未読}${UI_MSG.にしました}`,
        onConfirm: () => {},
      };
    },
  };
}

function setExportExclude(journal: Journal, exclude: boolean) {
  if (!assertEditableJournal(journal, 'setExportExclude')) return;
  const target = findEditableJournal(journal.journalId);
  if (!target) return;
  const hasLabel = target.labels.includes("EXPORT_EXCLUDE");
  if (exclude === hasLabel) return; // 同じ状態なら何もしない
  closeDropdown();
  confirmDialog.value = {
    show: true,
    title: exclude ? UI_MSG.出力対象外にする : UI_MSG.出力対象にする,
    message: `「${journal.description}」を${exclude ? UI_MSG.出力対象外 : UI_MSG.出力対象}${UI_MSG.にしますか}`,
    onConfirm: () => {
      if (exclude) {
        target.labels.push("EXPORT_EXCLUDE");
        console.log(`[DD] 出力対象外に変更: ${journal.journalId}`);
      } else {
        const idx = target.labels.indexOf("EXPORT_EXCLUDE");
        if (idx >= 0) target.labels.splice(idx, 1);
        console.log(`[DD] 出力対象に変更: ${journal.journalId}`);
      }
      updateJournalField(journal.journalId, { labels: [...target.labels] });
      confirmDialog.value = {
        show: true,
        title: UI_MSG.完了,
        message: `${exclude ? UI_MSG.出力対象外 : UI_MSG.出力対象}${UI_MSG.にしました}`,
        onConfirm: () => {},
      };
    },
  };
}

function copyJournal(journal: Journal, _index: number) {
  closeDropdown();
  confirmDialog.value = {
    show: true,
    title: UI_MSG.コピー,
    message: `「${journal.description}」${UI_MSG.を未出力にコピーしますか}`,
    onConfirm: async () => {
      const clone: Journal = JSON.parse(JSON.stringify(journal));
      clone.journalId = `copy-${crypto.randomUUID().slice(0, 12)}`;
      clone.display_order = journal.display_order + 0.5;
      clone.description = `${UI_MSG.コピー接頭_星}${journal.description}`;
      clone.is_read = false;
      clone.status = null;
      clone.labels = [];
      clone.memo = null;
      clone.memo_author = null;
      clone.memo_target = null;
      clone.memo_created_at = null;
      clone.deleted_at = null;
      // Phase C: POST APIでサーバーに追加
      try {
        await fetch(`/api/journals/${encodeURIComponent(journalClientId.value)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ journals: [clone] }),
        });
        await fetchJournalList();
      } catch (err) {
        console.error('[copyJournal] POST失敗:', err);
      }
      console.log(`[DD] コピー作成: ${clone.journalId} (元: ${journal.journalId})`);
      confirmDialog.value = {
        show: true,
        title: UI_MSG.コピー完了,
        message: UI_MSG.を未出力にコピーしました,
        onConfirm: () => {},
      };
    },
  };
}

function trashJournal(journal: Journal) {
  if (!assertEditableJournal(journal, 'trashJournal')) return;
  // 制約: 出力済みはゴミ箱不可
  if (journal.status === "exported") {
    console.warn(`[DD] exported journal cannot be trashed: ${journal.journalId}`);
    return;
  }
  closeDropdown();
  confirmDialog.value = {
    show: true,
    title: UI_MSG.ゴミ箱に移動,
    message: `「${journal.description}」${UI_MSG.をゴミ箱に移動しますか}`,
    onConfirm: () => {
      const target = findEditableJournal(journal.journalId);
      if (!target) return;
      target.deleted_at = new Date().toISOString();
      target.deleted_by = currentStaffId.value ?? null;
      updateJournalField(journal.journalId, {
        deleted_at: target.deleted_at,
        deleted_by: target.deleted_by,
      });
      console.log(`[DD] ゴミ箱: ${journal.journalId} by ${currentStaffId.value}`);
      confirmDialog.value = {
        show: true,
        title: UI_MSG.完了,
        message: `「${journal.description}」${UI_MSG.をゴミ箱に移動しました}`,
        onConfirm: () => {},
      };
    },
  };
}

function restoreJournal(journal: Journal) {
  if (!assertEditableJournal(journal, 'restoreJournal')) return;
  const target = findEditableJournal(journal.journalId);
  if (!target || target.deleted_at === null) return;
  closeDropdown();
  confirmDialog.value = {
    show: true,
    title: UI_MSG.復活,
    message: `「${journal.description}」${UI_MSG.を復活しますか}`,
    onConfirm: () => {
      target.deleted_at = null;
      target.deleted_by = null;
      updateJournalField(journal.journalId, {
        deleted_at: null,
        deleted_by: null,
      });
      console.log(`[DD] 復活: ${journal.journalId} by ${currentStaffId.value}`);
      confirmDialog.value = {
        show: true,
        title: UI_MSG.復活完了,
        message: `「${journal.description}」${UI_MSG.を復活しました}`,
        onConfirm: () => {},
      };
    },
  };
}

// ────── 選択操作関数 ──────

function toggleSelect(journalId: string) {
  const newSet = new Set(selectedIds.value);
  if (newSet.has(journalId)) {
    newSet.delete(journalId);
  } else {
    newSet.add(journalId);
  }
  selectedIds.value = newSet;
  // 初回チェック時ヘルプ
  if (!hasShownHelp.value && newSet.size > 0) {
    showSelectionHelp.value = true;
    hasShownHelp.value = true;
    setTimeout(() => {
      showSelectionHelp.value = false;
    }, 3000);
  }
}

function clearSelection() {
  selectedIds.value = new Set();
}

// ────── 一括操作関数（冪等 + 0件ガード） ──────

function bulkSetReadStatus(value: boolean) {
  const all = selectedJournals.value.filter((j): j is Journal => !isImportedJournal(j));
  const exportedCount = all.filter((j) => j.status === "exported").length;
  const targets = all.filter((j) => j.status !== "exported" && j.is_read !== value);
  // 0件ガード
  if (targets.length === 0) {
    confirmDialog.value = {
      show: true,
      title: UI_MSG.実行不可,
      message:
        exportedCount > 0
          ? `${UI_MSG.一括選択接頭}${all.length}${UI_MSG.件を}${UI_MSG.一括出力済接頭}${exportedCount}${UI_MSG.一括スキップ接尾}\n${UI_MSG.実行可能な仕訳がありません}`
          : `${UI_MSG.一括全て既に接頭}${value ? UI_MSG.既読 : UI_MSG.未読}${UI_MSG.一括状態です接尾}`,
      onConfirm: () => {},
    };
    return;
  }
  // 確認ダイアログ
  const capturedTargets = [...targets];
  const confirmMsg =
    exportedCount > 0
      ? `${UI_MSG.一括選択接頭}${all.length}${UI_MSG.件を}${UI_MSG.一括出力済接頭}${exportedCount}${UI_MSG.一括スキップ接尾}${UI_MSG.一括実行対象接頭}${capturedTargets.length}件`
      : `${capturedTargets.length}${UI_MSG.件を}${value ? UI_MSG.既読 : UI_MSG.未読}${UI_MSG.にしますか}`;
  confirmDialog.value = {
    show: true,
    title: value ? UI_MSG.既読にする : UI_MSG.未読にする,
    message: confirmMsg,
    onConfirm: () => {
      capturedTargets.forEach((j) => {
        j.is_read = value;
        if (value) {
          j.read_by = currentStaffId.value ?? null;
          j.read_at = new Date().toISOString();
        }
      });
      console.log(
        `[一括] ${value ? "既読" : "未読"}: ${capturedTargets.length}件変更 by ${currentStaffId.value}`,
      );
      const count = capturedTargets.length;
      clearSelection();
      confirmDialog.value = {
        show: true,
        title: UI_MSG.完了,
        message: `${count}${UI_MSG.件を}${value ? UI_MSG.既読 : UI_MSG.未読}${UI_MSG.にしました}`,
        onConfirm: () => {},
      };
    },
  };
}

function bulkSetExportExclude(exclude: boolean) {
  const all = selectedJournals.value.filter((j): j is Journal => !isImportedJournal(j));
  const exportedCount = all.filter((j) => j.status === "exported").length;
  const targets = all.filter((j) => {
    if (j.status === "exported") return false;
    return exclude !== j.labels.includes("EXPORT_EXCLUDE");
  });
  // 0件ガード
  if (targets.length === 0) {
    confirmDialog.value = {
      show: true,
      title: UI_MSG.実行不可,
      message:
        exportedCount > 0
          ? `${UI_MSG.一括選択接頭}${all.length}${UI_MSG.件を}${UI_MSG.一括出力済接頭}${exportedCount}${UI_MSG.一括スキップ接尾}\n${UI_MSG.実行可能な仕訳がありません}`
          : UI_MSG.実行可能な仕訳がありません,
      onConfirm: () => {},
    };
    return;
  }
  // exported含む場合の制限メッセージ
  if (exportedCount > 0) {
    const capturedTargets = [...targets]; // クロージャキャプチャ
    confirmDialog.value = {
      show: true,
      title: exclude ? UI_MSG.出力対象外に変更 : UI_MSG.出力対象に変更,
      message: `${UI_MSG.一括選択接頭}${all.length}${UI_MSG.件を}${UI_MSG.一括出力済接頭}${exportedCount}${UI_MSG.一括スキップ接尾}${UI_MSG.一括実行対象接頭}${capturedTargets.length}件`,
      onConfirm: () => {
        capturedTargets.forEach((j) => {
          if (exclude && !j.labels.includes("EXPORT_EXCLUDE")) {
            j.labels.push("EXPORT_EXCLUDE");
          } else if (!exclude) {
            const idx = j.labels.indexOf("EXPORT_EXCLUDE");
            if (idx >= 0) j.labels.splice(idx, 1);
          }
        });
        console.log(`[一括] ${exclude ? "対象外" : "対象"}: ${capturedTargets.length}件変更`);
        const count = capturedTargets.length;
        clearSelection();
        confirmDialog.value = {
          show: true,
          title: UI_MSG.完了,
          message: `${count}${UI_MSG.件を}${exclude ? UI_MSG.出力対象外 : UI_MSG.出力対象}${UI_MSG.にしました}`,
          onConfirm: () => {},
        };
      },
    };
    return;
  }
  // exported含まない場合も確認ダイアログ
  const capturedTargets = [...targets];
  confirmDialog.value = {
    show: true,
    title: exclude ? UI_MSG.出力対象外にする : UI_MSG.出力対象にする,
    message: `${capturedTargets.length}${UI_MSG.件を}${exclude ? UI_MSG.出力対象外 : UI_MSG.出力対象}${UI_MSG.にしますか}`,
    onConfirm: () => {
      capturedTargets.forEach((j) => {
        if (exclude && !j.labels.includes("EXPORT_EXCLUDE")) {
          j.labels.push("EXPORT_EXCLUDE");
        } else if (!exclude) {
          const idx = j.labels.indexOf("EXPORT_EXCLUDE");
          if (idx >= 0) j.labels.splice(idx, 1);
        }
        updateJournalField(j.journalId, { labels: [...j.labels] });
      });
      console.log(`[一括] ${exclude ? "対象外" : "対象"}: ${capturedTargets.length}件変更`);
      const count = capturedTargets.length;
      clearSelection();
      confirmDialog.value = {
        show: true,
        title: UI_MSG.完了,
        message: `${count}${UI_MSG.件を}${exclude ? UI_MSG.出力対象外 : UI_MSG.出力対象}${UI_MSG.にしました}`,
        onConfirm: () => {},
      };
    },
  };
}

function showBulkCopyDialog() {
  const targets = [...selectedJournals.value]; // クロージャキャプチャ（コピーはexportedスキップなし）
  confirmDialog.value = {
    show: true,
    title: UI_MSG.コピー,
    message: `${targets.length}${UI_MSG.件を}${UI_MSG.を未出力にコピーしますか}`,
    onConfirm: async () => {
      const clones: Journal[] = [];
      targets.forEach((j) => {
        const clone: Journal = JSON.parse(JSON.stringify(j));
        clone.journalId = `copy-${crypto.randomUUID().slice(0, 12)}`;
        clone.display_order = j.display_order + 0.5;
        clone.description = `${UI_MSG.コピー接頭_星}${j.description}`;
        clone.is_read = false;
        clone.status = null;
        clone.labels = [];
        clone.memo = null;
        clone.memo_author = null;
        clone.memo_target = null;
        clone.memo_created_at = null;
        clone.deleted_at = null;
        clones.push(clone);
      });
      // Phase C: POST APIでサーバーに追加
      try {
        await fetch(`/api/journals/${encodeURIComponent(journalClientId.value)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ journals: clones }),
        });
        await fetchJournalList();
      } catch (err) {
        console.error('[showBulkCopyDialog] POST失敗:', err);
      }
      console.log(`[一括] コピー: ${targets.length}件`);
      clearSelection();
      confirmDialog.value = {
        show: true,
        title: UI_MSG.コピー完了,
        message: `${targets.length}${UI_MSG.件を}${UI_MSG.を未出力にコピーしました}`,
        onConfirm: () => {},
      };
    },
  };
}

function showBulkTrashDialog() {
  const all = selectedJournals.value.filter((j): j is Journal => !isImportedJournal(j));
  const exportedCount = all.filter((j) => j.status === "exported").length;
  const targets = all.filter((j) => j.status !== "exported" && j.deleted_at === null);
  // 0件ガード
  if (targets.length === 0) {
    confirmDialog.value = {
      show: true,
      title: UI_MSG.実行不可,
      message:
        exportedCount > 0
          ? `${UI_MSG.一括選択接頭}${all.length}${UI_MSG.件を}${UI_MSG.一括出力済接頭}${exportedCount}${UI_MSG.一括スキップ接尾}\n${UI_MSG.実行可能な仕訳がありません}`
          : UI_MSG.実行可能な仕訳がありません,
      onConfirm: () => {},
    };
    return;
  }
  const capturedTargets = [...targets]; // クロージャキャプチャ
  const msg =
    exportedCount > 0
      ? `${UI_MSG.一括選択接頭}${all.length}${UI_MSG.件を}${UI_MSG.一括出力済接頭}${exportedCount}${UI_MSG.一括スキップ接尾}${UI_MSG.一括実行対象接頭}${capturedTargets.length}件${UI_MSG.一括ゴミ箱確認接尾}`
      : `${capturedTargets.length}${UI_MSG.件を}${UI_MSG.をゴミ箱に移動しますか}`;
  confirmDialog.value = {
    show: true,
    title: UI_MSG.ゴミ箱,
    message: msg,
    onConfirm: () => {
      const now = new Date().toISOString();
      capturedTargets.forEach((j) => {
        j.deleted_at = now;
        j.deleted_by = currentStaffId.value ?? null;
        updateJournalField(j.journalId, {
          deleted_at: j.deleted_at,
          deleted_by: j.deleted_by,
        });
      });
      console.log(`[一括] ゴミ箱: ${capturedTargets.length}件 by ${currentStaffId.value}`);
      clearSelection();
      confirmDialog.value = {
        show: true,
        title: UI_MSG.完了,
        message: `${capturedTargets.length}${UI_MSG.件を}${UI_MSG.をゴミ箱に移動しました}`,
        onConfirm: () => {},
      };
    },
  };
}

// ソート状態
const sortColumn = ref<string | null>(null);
const sortDirection = ref<"asc" | "desc">("asc");

// ────── メイン仕訳ページネーション ──────
const journalPageSize = ref(100);
const journalCurrentPage = ref(1);
// Step 5: API結果から取得（journals computedの依存を排除）
const _apiTotalCount = ref(0);
const _apiTotalPages = ref(1);
const journalTotalCount = computed(() => _apiTotalCount.value);
const journalTotalPages = computed(() => _apiTotalPages.value);
const journalPageStart = computed(() => (journalCurrentPage.value - 1) * journalPageSize.value + 1);
const journalPageEnd = computed(() =>
  Math.min(journalCurrentPage.value * journalPageSize.value, journalTotalCount.value),
);

// ページサイズ変更時にページをリセット
watch(journalPageSize, () => {
  journalCurrentPage.value = 1;
});

// 画像モーダル用（ImageModal.vue に分離。hoveredJournalId/modalImageUrl/isModalPinned は親で管理）
const hoveredJournalId = ref<string | null>(null);
const modalImageUrl = ref<string | null>(null);
const isModalPinned = ref<boolean>(false);

// modalDrag は utils/modalDrag.ts に抽出済み（import は上部に追加済み）


// コメントモーダル用 ref/useDraggable は CommentModal.vue に移動済み
// ヒントモーダル用 ref/useDraggable は HintModal.vue に移動済み

// ━━━ 根拠資料検索モーダル UI → EvidenceSearchModal.vue に分離済み ━━━
// 紐づけロジック（supportingMatchMap/hasSupportingMatch/fetchSupportingMatches）はテーブル行内で使用するため親に残す

const showSupportingSearchModal = ref(false);

type SupportingMetaItem = {
  id: string;
  fileName: string;
  previewUrl: string;
  date: string | null;
  amount: number | null;
  vendor: string | null;
  description: string | null;
  sourceType: string | null;
};

// ━━━ 根拠資料 自動紐づけ（API経由）━━━
// matchScore / supportingMatchMap computed は API側に移設済み。
// Phase 1 Step 6-B3 (2026-05-03)

/** 仕訳ID → マッチした根拠資料の紐づけマップ（APIレスポンスをキャッシュ） */
const supportingMatchMap = ref<Map<string, SupportingMetaItem[]>>(new Map());

/** 証票マッチングAPI呼び出し（マウント時 + 仕訳変更時） */
async function fetchSupportingMatches() {
  try {
    const res = await fetch(
      `/api/journals/${encodeURIComponent(journalClientId.value)}/supporting-match`,
    );
    if (res.ok) {
      const data = (await res.json()) as {
        matches: Record<string, SupportingMetaItem[]>;
        matchedCount: number;
      };
      const map = new Map<string, SupportingMetaItem[]>();
      for (const [journalId, items] of Object.entries(data.matches)) {
        map.set(journalId, items);
      }
      supportingMatchMap.value = map;
      console.log(`[根拠資料紐づけ] ${data.matchedCount}件マッチ`);
    }
  } catch {
    // 取得失敗は無視
  }
}

/** 仕訳に紐づく根拠資料があるか */
function hasSupportingMatch(journal: Journal): boolean {
  return supportingMatchMap.value.has(journal.journalId);
}

// マウント時に証票マッチング取得
onMounted(() => {
  fetchSupportingMatches();
});

function openSupportingSearchModal() {
  showSupportingSearchModal.value = true;
}

function closeSupportingSearchModal() {
  showSupportingSearchModal.value = false;
}

// 検索実行 / プレビュー / デバウンスは EvidenceSearchModal.vue に移動済み

const showPastJournalModal = ref<boolean>(false);
const isPastJournalModalPinned = ref<boolean>(false);

// ── 会計ソフトから取り込んだ過去仕訳（confirmed_journals API） ──
const confirmedJournals = ref<ConfirmedJournal[]>([]);
const isConfirmedLoading = ref(false);
const confirmedLoaded = ref(false);

async function fetchConfirmedJournals() {
  if (confirmedLoaded.value) return;
  isConfirmedLoading.value = true;
  try {
    const res = await fetch(`/api/confirmed-journals/${encodeURIComponent(journalClientId.value)}`);
    if (res.ok) {
      const data = (await res.json()) as { journals: ConfirmedJournal[]; count: number };
      confirmedJournals.value = data.journals;
      console.log(`[過去仕訳] confirmed_journals ${data.count}件取得 (${journalClientId.value})`);
    }
    confirmedLoaded.value = true;
  } catch (err) {
    console.warn("[過去仕訳] 取得失敗:", err);
  } finally {
    isConfirmedLoading.value = false;
  }
}

function showPastJournalSearchModal() {
  showPastJournalModal.value = true;
  // 会計タブのデータを事前取得
  fetchConfirmedJournals();
}

function hidePastJournalSearchModal() {
  if (!isPastJournalModalPinned.value) {
    showPastJournalModal.value = false;
  }
}

function togglePastJournalSearchModalPin() {
  isPastJournalModalPinned.value = !isPastJournalModalPinned.value;
  if (!isPastJournalModalPinned.value) {
    showPastJournalModal.value = false;
  }
}

function closePastJournalModal() {
  showPastJournalModal.value = false;
  isPastJournalModalPinned.value = false;
}


// baseModalWidth/baseModalHeight は ImageModal.vue に移動済み

function showImageModal(journalId: string, documentId: string | null) {
  hoveredJournalId.value = journalId;
  modalImageUrl.value = getDocumentImageUrl(documentId);
}

function hideImageModal() {
  if (!isModalPinned.value) {
    hoveredJournalId.value = null;
    modalImageUrl.value = null;
  }
}

function togglePinModal(journalId: string, documentId: string | null) {
  if (isModalPinned.value && hoveredJournalId.value === journalId) {
    // すでに固定されている場合は閉じる
    isModalPinned.value = false;
    hoveredJournalId.value = null;
    modalImageUrl.value = null;
  } else {
    // 固定モードに切り替え
    isModalPinned.value = true;
    hoveredJournalId.value = journalId;
    modalImageUrl.value = getDocumentImageUrl(documentId);
  }
}

function closeModal() {
  isModalPinned.value = false;
  hoveredJournalId.value = null;
  modalImageUrl.value = null;
}

// ────── 画像モーダル関数は ImageModal.vue に移動済み ──────
// zoomIn/zoomOut/onImageLoad/onMouseDown/onMouseMove/onMouseUp

// ────────────────────────────────────────────
// Step 5: journals をAPI統合一覧で取得（Phase 1 Step 4のAPIを使用）
// 旧 journals computed (290行のソート・フィルタ・検索・pastRows統合) を削除。
// API側の journalListService がソート・フィルタ・検索・pastRows統合・ページネーションを実行。
// Phase C: 全更新はupdateJournalField()経由のPATCH API。localJournals廃止済み。
// ────────────────────────────────────────────

// ↑ journals shallowRefはL2800付近に移動済み（setup内の参照順序制約）
// 全てのデータ変更はこの関数を経由する。
// 楽観的UI更新 → journalId単位マージ → 500msデバウンスでPATCH送信。
const _patchQueue = new Map<string, Partial<Journal>>();
let _patchTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 仕訳1件の部分更新（単一更新入口）
 * @param journalId 更新対象の仕訳ID
 * @param patch 変更フィールドのオブジェクト
 */
/**
 * 過去仕訳（読み取り専用）への編集操作をブロックするガード関数。
 * 全編集系関数の入口で呼び出す。サイレント失敗を防ぐためログ出力付き。
 * @returns true=編集可能, false=過去仕訳のためブロック
 */
function assertEditableJournal(journal: Journal, caller: string): journal is Journal {
  if (isImportedJournal(journal)) {
    console.warn(`[JournalGuard] ${caller}: 過去仕訳への操作をブロック (${journal.journalId})`);
    return false;
  }
  return true;
}

/**
 * 💡ヒントアイコン表示可否（意味ベースで制御）。
 * 現在はAI仕訳のみヒントあり。将来「仕訳詳細」等に拡張する場合はここを修正。
 */
function canShowHint(journal: Journal): boolean {
  return !isImportedJournal(journal);
}

function updateJournalField(
  journalId: string,
  patch: Partial<Journal>,
  options: { syncWarnings?: boolean; silent?: boolean; autoMeta?: boolean } = {},
) {
  const journal = journals.value.find((j) => j.journalId === journalId);
  if (!journal) return;

  // 最終防御: 取込仕訳への書き込み禁止（全書き込みの集約点）
  if (isImportedJournal(journal)) {
    console.error(`[JournalGuard][BLOCKED] updateJournalField: 取込仕訳への書き込み試行 (${journalId})`);
    return;
  }

  // 自動メタデータ付与（autoMeta: false で抑制可。既読状態の一括変更等で使用）
  if (options.autoMeta !== false) {
    if (patch.is_read === undefined) patch.is_read = true;
    if (!patch.updated_at) patch.updated_at = new Date().toISOString();
    if (!patch.updated_by) patch.updated_by = currentStaffId.value ?? null;
  }

  // 1. 楽観的UI更新（表示中のjournalsに即反映）
  Object.assign(journal, patch);

  // 2. syncWarningLabels自動実行（syncWarnings: false で抑制可）
  if (options.syncWarnings !== false) {
    syncWarningLabels(journal, options.silent ?? true);
    // labelsが変更された可能性があるのでpatchに追加
    patch.labels = [...journal.labels];
  }

  triggerRef(journals);

  // 3. デバウンスキュー（journalId単位マージ）
  const existing = _patchQueue.get(journalId) ?? {};
  _patchQueue.set(journalId, { ...existing, ...patch });
  if (_patchTimer) clearTimeout(_patchTimer);
  _patchTimer = setTimeout(() => flushPendingPatches(), 500);
}

/** 保留中のPATCHを全て送信（fetchJournalList前に呼ぶ） */
async function flushPendingPatches(): Promise<void> {
  if (_patchQueue.size === 0) return;
  const entries = [..._patchQueue.entries()];
  _patchQueue.clear();
  if (_patchTimer) { clearTimeout(_patchTimer); _patchTimer = null; }
  await Promise.all(
    entries.map(([journalId, patch]) =>
      fetch(`/api/journals/${encodeURIComponent(journalClientId.value)}/${encodeURIComponent(journalId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }).catch((err) => console.error(`[updateJournalField] PATCH失敗: ${journalId}`, err)),
    ),
  );
}
/**
 * Journal Factory（唯一の変換境界）
 *
 * JournalListRow（サーバーAPIレスポンス）→ Journal（統一仕訳型）への変換。
 * この関数を通過した時点から、下流（composable / Vue）は Journal のみ扱う。
 *
 * ConfirmedJournal（確定仕訳型）にはlabels/status/is_read等が存在しないため、
 * 全フィールドをここで保証する（asキャストなし）。
 *
 * Phase 3で永続化を統合すれば、この関数自体が不要になる。
 */
/**
 * ConfirmedJournalEntry → JournalEntryLine 変換ヘルパー
 *
 * MF取込仕訳は勘定科目・金額が常に存在する（MF仕訳帳CSVの必須列）ため、
 * account_on_document / amount_on_document は true 固定。
 *
 * 将来 JournalEntryLine にフィールドが追加された場合、この関数だけ修正すればよい。
 */
function normalizeConfirmedEntry(entry: ConfirmedJournalEntry): JournalEntryLine {
  return {
    ...entry,
    account_on_document: true,   // MF取込: 証憑に勘定科目が常に存在
    amount_on_document: true,    // MF取込: 証憑に金額が常に存在
  }
}

function normalizeJournalForUI(row: JournalListRow): Journal {
  if (isMfJournal(row)) {
    // ConfirmedJournal → Journal: 不足フィールドをデフォルト値で補完
    const normalized: Journal = {
      ...row,
      // ConfirmedJournalEntry → JournalEntryLine: ヘルパー経由で変換
      debit_entries: row.debit_entries.map(normalizeConfirmedEntry),
      credit_entries: row.credit_entries.map(normalizeConfirmedEntry),
      // source は row 自体に既存（'mf_import' | 'system'）
      // ConfirmedJournal に存在しないフィールドをデフォルト値で補完
      labels: [],
      status: null,
      is_read: true,
      deleted_at: null,
      warning_dismissals: [],
      warning_details: {},
      is_credit_card_payment: false,
      voucher_type: null,
      source_type: null,
      vendor_vector: null,
      document_id: null,
      line_id: null,
      staff_notes: null,
      display_order: 90000 + (row.mf_transaction_no ?? 0),
      invoice_status: null,
      rule_id: null,
      invoice_number: null,
      export_batch_id: null,
      date_on_document: true,  // MF取込仕訳は日付項目あり
      description: row.description ?? '',
      memo: row.memo ?? null,
      memo_author: null,
      memo_target: null,
      memo_created_at: null,
    }
    return normalized
  }
  // Journal: 全フィールド既存（source必須化済み）
  return { ...row }
}

/** 統合一覧APIの呼び出し（POST: 科目名マッピング付き） */
let _fetchVersion = 0;
async function fetchJournalList() {
  // 保留中のPATCHを先に送信してからfetch（データ整合性保証）
  await flushPendingPatches();
  const version = ++_fetchVersion;

  // Phase 2: accountMap/taxMapはサーバー側マスタから自動生成（POSTボディ送信不要）

  const body: {
    showImported: boolean;
    showUnexported: boolean;
    showExported: boolean;
    showExcluded: boolean;
    showTrashed: boolean;
    dateFrom: string | undefined;
    dateTo: string | undefined;
    filterMonths?: number[];
    page: number;
    pageSize: number;
    sort?: string;
    order?: 'asc' | 'desc';
    search?: string;
    voucherFilter?: string;
  } = {
    showImported: showImported.value,
    showUnexported: showUnexported.value,
    showExported: showExported.value,
    showExcluded: showExcluded.value,
    showTrashed: showTrashed.value,
    dateFrom: fiscalDateFrom.value,
    dateTo: fiscalDateTo.value,
    // 全月選択時はfilterMonths送信不要（サーバー側で全月扱い）
    filterMonths: isAllMonthsSelected.value ? undefined : [...selectedMonths.value],
    page: journalCurrentPage.value,
    pageSize: journalPageSize.value,
    sort: sortColumn.value || undefined,
    order: sortColumn.value ? sortDirection.value : undefined,
    search: globalSearchQuery.value.trim() || undefined,
    voucherFilter: voucherFilter.value || undefined,
  };

  try {
    const res = await fetch(`/api/journals/${journalClientId.value}/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("[fetchJournalList] API error:", res.status);
      return;
    }
    const data = await res.json();
    // バージョンチェック: 新しいリクエストが発行されていたら棄却
    if (_fetchVersion !== version) return;
    journals.value = (data.journals ?? []).map(normalizeJournalForUI);
    _apiTotalCount.value = data.totalCount ?? 0;
    _apiTotalPages.value = data.totalPages ?? 1;
    journalSummary.value = data.summary ?? { revenue: 0, expense: 0, profit: 0 };
    triggerRef(journals);
  } catch (err) {
    console.error("[fetchJournalList] fetch失敗:", err);
  }
}

// 条件変更時にAPI再呼び出し（検索はデバウンス付き）
let _searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  [
    sortColumn,
    sortDirection,
    showImported,
    showUnexported,
    // showExported は廃止（常にfalse）。watch不要
    showExcluded,
    showTrashed,
    voucherFilter,
    journalCurrentPage,
    journalPageSize,
    fiscalDateFrom,
    fiscalDateTo,
    selectedMonths,
  ],
  () => {
    fetchJournalList();
  },
);
watch(globalSearchQuery, () => {
  journalCurrentPage.value = 1; // 検索時はページ1にリセット
  if (_searchTimer) clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => fetchJournalList(), 300);
});

// Phase C: autoSave watch廃止。全更新はupdateJournalField()経由のPATCH API。
// 以前のlocalJournals deep watch + autoSaveは不要。

// 初期ロード
fetchJournalList();

// ────── journals依存のcomputed（journals ref の後に配置必須） ──────

/** ページネーション適用済み仕訳リスト（APIがページング済みなのでjournalsそのまま） */
const paginatedJournals = computed(() => journals.value);

const visibleIds = computed(() => journals.value.filter((j: Journal) => !isImportedJournal(j)).map((j) => j.journalId));

const selectedJournals = computed(() =>
  journals.value.filter((j) => selectedIds.value.has(j.journalId)),
);

const isSelectionMode = computed(() => selectedIds.value.size > 0);

const isAllSelected = computed(
  () => visibleIds.value.length > 0 && visibleIds.value.every((id) => selectedIds.value.has(id)),
);

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = new Set();
  } else {
    selectedIds.value = new Set(visibleIds.value);
  }
}

// フィルタ変更時の選択prune（visibleIds依存 — ソート変更では発火しない）
watch(visibleIds, (ids) => {
  const visible = new Set(ids);
  selectedIds.value = new Set([...selectedIds.value].filter((id) => visible.has(id)));
});

function sortBy(column: string) {
  closeDropdown();
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortColumn.value = column;
    sortDirection.value = "asc";
  }
}

function resetToDefaultOrder() {
  sortColumn.value = null;
  sortDirection.value = "asc";
  // 3キーソート: document_idグループの最小日付 → 同一証票内日付昇順 → id昇順
  const minDateMap = new Map<string, string>();
  journals.value.forEach((j) => {
    const docId = j.document_id ?? "";
    const date = j.voucher_date ?? "\uffff";
    const cur = minDateMap.get(docId);
    if (!cur || date < cur) minDateMap.set(docId, date);
  });
  journals.value.sort((a, b) => {
    const da = minDateMap.get(a.document_id ?? "") ?? "\uffff";
    const db = minDateMap.get(b.document_id ?? "") ?? "\uffff";
    if (da !== db) return da < db ? -1 : 1;
    const va = a.voucher_date ?? "\uffff";
    const vb = b.voucher_date ?? "\uffff";
    if (va !== vb) return va < vb ? -1 : 1;
    return a.journalId < b.journalId ? -1 : a.journalId > b.journalId ? 1 : 0;
  });
}

// UiEntryLine, CombinedRow, setEntryField, getCombinedRows → useInlineEdit.ts に移動済み


/**
 * 行背景色の優先順位
 *
 * 1. deleted_at!=null : 濃グレー+白字（ワークフロー終了・最優先）
 * 2. status=exported : 薄グレー（出力完了）
 * 3. !is_read        : 黄色（未読・注意）
 * 4. それ以外        : 白（通常）
 *
 * 制約: exported && deleted_at は禁止（trashJournalでガード）
 * 許可: export_exclude && deleted_at は許可（外部未出力のため）
 * フィルタ: showTrashed=ONは「追加表示型」（通常+ゴミ箱）
 */
function getRowBackground(journal: Journal): string {
  // 優先度1: ゴミ箱 → 濃グレー+白字（最優先）
  if (journal.deleted_at !== null) {
    return "bg-gray-600 text-white";
  }
  // 優先度2: 出力対象外 → 薄緑
  if (journal.labels.includes("EXPORT_EXCLUDE")) {
    return "bg-green-50";
  }
  // 優先度3: 出力済み → 薄グレー + exported-rowクラス
  if (journal.status === "exported") {
    return "bg-gray-200 exported-row";
  }
  // 優先度4: 過去仕訳（MFインポート） → 薄グレー
  if (isImportedJournal(journal)) {
    return "bg-gray-100";
  }
  // 優先度5: 未読 → 黄色
  if (!journal.is_read) {
    return "bg-yellow-100";
  }
  // 優先度6: 通常 → 白
  return "bg-white";
}

function hasPastJournal(journal: Journal): boolean {
  return journals.value.findIndex((j) => j.journalId === journal.journalId) < 25;
}

/**
 * ドットパスで値を取得（税区分名称・勘定科目名変換付き）
 * 動的パスアクセスのためkeyof型安全性は保証できない。内部でunknown経由でRecordにキャストする。
 */
function getValue(obj: Journal | CombinedRow, path: string): unknown {
  const raw = path
    .split(".")
    .reduce<unknown>(
      (o, key) => {
        if (o == null || typeof o !== 'object') return undefined;
        return (o as Record<string, unknown>)[key];
      },
      obj as unknown,
    );
  // 概念ID → MF正式名称に変換（tax_category_idキーの場合）
  if (path.endsWith("tax_category_id") && typeof raw === "string") {
    return resolveTaxCategoryName(raw);
  }
  // マスタID → 勘定科目名に変換（accountキーの場合）
  if (path.endsWith(".account") && typeof raw === "string") {
    return resolveAccountName(raw);
  }
  return raw;
}

/**
 * 概念IDから会計ソフト別の税区分名を取得（データ駆動）。
 * 顧問先のaccountingSoftwareに応じて変換テーブルから名前を返す。
 * MF: マスタのnameをそのまま返す（マスタがSSOT）
 * 弥生/Freee: オーバーライドテーブルから取得、なければMF名にフォールバック
 */
function resolveTaxCategoryName(id: string | null | undefined): string {
  if (!id) return "";
  const allTaxCats = clientSettings.taxCategories.value;
  const software = activeClientFull.value?.accountingSoftware ?? 'mf';
  // 型ガード: AccountingSoftwareKeyに該当しないソフト（tkc/other）はmfにフォールバック
  const resolvedSoftware: AccountingSoftwareKey =
    software === 'mf' || software === 'yayoi' || software === 'freee' ? software : 'mf';
  return resolveTaxNameForSoftware(id, resolvedSoftware, allTaxCats);
}

/** IDから勘定科目の表示名を取得。顧問先科目を優先、なければマスタフォールバック */
function resolveAccountName(id: string | null | undefined): string {
  if (!id) return "";
  const allAccts = clientSettings.accounts.value;
  const account = allAccts.find((a) => a.accountId === id);
  return account ? account.name : id;
}

/** サマリー金額をカンマ区切りで表示（マイナスは先頭に-） */
function formatSummaryAmount(value: number): string {
  const abs = Math.abs(Math.round(value));
  const formatted = abs.toLocaleString('ja-JP');
  return value < 0 ? `−${formatted}` : formatted;
}

function formatDate(date: unknown): string {
  if (date == null || date === "") return NULL_DISPLAY_UNKNOWN;
  const result = toMfCsvDate(String(date));
  return result || NULL_DISPLAY_UNKNOWN;
}

// 要対応フラグの切り替え（staff_notes同期付き）
const staffNoteKeys = STAFF_NOTE_KEYS;
const staffNoteConfig: Record<
  StaffNoteKey,
  { label: string; icon: string; activeColor: string; hoverIconColor: string }
> = {
  NEED_DOCUMENT: {
    label: UI_MSG.付箋_書類不足,
    icon: "fa-file-circle-exclamation",
    activeColor: "text-red-600",
    hoverIconColor: "#dc2626",
  },
  NEED_INFO: {
    label: UI_MSG.付箋_情報不足,
    icon: "fa-circle-question",
    activeColor: "text-amber-600",
    hoverIconColor: "#d97706",
  },
  REMINDER: {
    label: UI_MSG.付箋_備忘メモ,
    icon: "fa-thumbtack",
    activeColor: "text-blue-600",
    hoverIconColor: "#2563eb",
  },
  NEED_CONSULT: {
    label: UI_MSG.付箋_社内相談,
    icon: "fa-comments",
    activeColor: "text-purple-600",
    hoverIconColor: "#9333ea",
  },
};

// 要対応ポップアップ制御（遅延付きshow/hide）
const needPopupJournalId = ref<string | null>(null);
const needPopupKey = ref<StaffNoteKey | null>(null);
let needPopupHideTimer: ReturnType<typeof setTimeout> | null = null;

function showNeedPopup(journalId: string, key: StaffNoteKey) {
  if (needPopupHideTimer) {
    clearTimeout(needPopupHideTimer);
    needPopupHideTimer = null;
  }
  needPopupJournalId.value = journalId;
  needPopupKey.value = key;
}

function scheduleHideNeedPopup() {
  if (needPopupHideTimer) clearTimeout(needPopupHideTimer);
  needPopupHideTimer = setTimeout(() => {
    needPopupJournalId.value = null;
    needPopupKey.value = null;
    needPopupHideTimer = null;
  }, 500); // 500msの遅延
}

function cancelHideNeedPopup() {
  if (needPopupHideTimer) {
    clearTimeout(needPopupHideTimer);
    needPopupHideTimer = null;
  }
}

// B: コメント列ホバー制御（ホバーでフルモーダル、クリックで固定）
const commentModalPinned = ref(false);
let commentHoverCloseTimer: ReturnType<typeof setTimeout> | null = null;

function hoverOpenCommentModal(journal: Journal) {
  if (commentModalPinned.value) return;
  if (commentHoverCloseTimer) {
    clearTimeout(commentHoverCloseTimer);
    commentHoverCloseTimer = null;
  }
  openCommentModal(journal.journalId);
}

function pinCommentModal() {
  commentModalPinned.value = true;
  if (commentHoverCloseTimer) {
    clearTimeout(commentHoverCloseTimer);
    commentHoverCloseTimer = null;
  }
}

function scheduleHoverCloseCommentModal() {
  if (commentModalPinned.value) return;
  if (commentHoverCloseTimer) clearTimeout(commentHoverCloseTimer);
  commentHoverCloseTimer = setTimeout(() => {
    closeCommentModal();
    commentHoverCloseTimer = null;
  }, 500);
}

function cancelHoverCloseCommentModal() {
  if (commentHoverCloseTimer) {
    clearTimeout(commentHoverCloseTimer);
    commentHoverCloseTimer = null;
  }
}

function hasAnyStaffNote(journal: Journal): boolean {
  if (!journal.staff_notes) return false;
  return STAFF_NOTE_KEYS.some((key) => journal.staff_notes?.[key]?.enabled);
}

function getStaffNoteEnabled(journal: Journal, key: StaffNoteKey): boolean {
  return journal.staff_notes?.[key]?.enabled ?? false;
}

function getStaffNoteText(journal: Journal, key: StaffNoteKey): string {
  return journal.staff_notes?.[key]?.text ?? "";
}

function getStaffNoteChatworkUrl(journal: Journal, key: StaffNoteKey): string {
  return journal.staff_notes?.[key]?.chatworkUrl ?? "";
}

// staff_notes → labels 同期: toggleStaffNote / closeCommentModal / toggleStaffNoteInModal でインライン化済み

function toggleStaffNote(journalId: string, key: StaffNoteKey) {
  const journal = findEditableJournal(journalId);
  if (!journal) return;

  // staff_notesがなければ初期化
  const notes = journal.staff_notes ? { ...journal.staff_notes } : createEmptyStaffNotes();
  notes[key] = { ...notes[key], enabled: !notes[key].enabled };

  // labels同期（新しいnotesからlabels構築）
  const NEED_KEYS: readonly StaffNoteKey[] = STAFF_NOTE_KEYS;
  const newLabels: JournalLabelMock[] = journal.labels.filter((l) => !isStaffNoteKey(l));
  for (const k of NEED_KEYS) {
    if (notes[k]?.enabled) newLabels.push(k);
  }

  // updateJournalFieldで一括処理
  updateJournalField(journalId, {
    staff_notes: notes,
    labels: newLabels,
    is_read: notes[key].enabled ? false : undefined, // フラグON時は未読にする
  }, { syncWarnings: false });
  console.log(`StaffNote toggled: ${key} = ${journal.staff_notes?.[key]?.enabled} for ${journalId}`);
}

// コメントモーダル
const commentModalJournalId = ref<string | null>(null);
const { userName, staffList, currentStaffId } = useCurrentUser();
// コメント投稿者名（ローカルref。v-model互換のためcomputedのuserNameとは別管理）
const commentModalAuthor = ref<string>(userName.value);
// userNameが変わったら同期
watch(userName, (v) => {
  commentModalAuthor.value = v;
});

const commentModalJournal = computed(() => {
  if (!commentModalJournalId.value) return null;
  return findEditableJournal(commentModalJournalId.value) ?? null;
});

function openCommentModal(journalId: string) {
  const journal = journals.value.find((j) => j.journalId === journalId);
  if (!journal) return;
  if (!assertEditableJournal(journal, 'openCommentModal')) return;

  // staff_notesがなければ初期化
  if (!journal.staff_notes) {
    // staff_notes初期化もupdateJournalField経由
    updateJournalField(journalId, { staff_notes: createEmptyStaffNotes() }, { syncWarnings: false, autoMeta: false });
  }

  commentModalJournalId.value = journalId;
}

function closeCommentModal() {
  if (commentModalJournal.value) {
    if (!assertEditableJournal(commentModalJournal.value, 'closeCommentModal')) {
      commentModalJournalId.value = null;
      commentModalPinned.value = false;
      return;
    }
    // labels同期（notesからlabels構築）
    const NEED_KEYS_CLOSE: readonly StaffNoteKey[] = STAFF_NOTE_KEYS;
    const closingLabels: JournalLabelMock[] = commentModalJournal.value.labels.filter((l) => !isStaffNoteKey(l));
    for (const k of NEED_KEYS_CLOSE) {
      if (commentModalJournal.value.staff_notes?.[k]?.enabled) closingLabels.push(k);
    }
    // updateJournalFieldで一括処理（モーダル閉じる時にまとめてPATCH送信）
    updateJournalField(commentModalJournal.value.journalId, {
      staff_notes: commentModalJournal.value.staff_notes,
      staff_notes_author: commentModalAuthor.value,
      labels: closingLabels,
      memo: commentModalJournal.value.memo,
      memo_author: commentModalJournal.value.memo_author,
      memo_target: commentModalJournal.value.memo_target,
      memo_created_at: commentModalJournal.value.memo_created_at,
    }, { syncWarnings: false });
  }
  commentModalJournalId.value = null;
  commentModalPinned.value = false;
}

function toggleStaffNoteInModal(key: StaffNoteKey) {
  if (!commentModalJournal.value || !commentModalJournal.value.staff_notes) return;
  if (!assertEditableJournal(commentModalJournal.value, 'toggleStaffNoteInModal')) return;
  // 直接変更せずオブジェクトコピーで更新
  const modalNotes = { ...commentModalJournal.value.staff_notes };
  modalNotes[key] = { ...modalNotes[key], enabled: !modalNotes[key].enabled };
  commentModalJournal.value.staff_notes = modalNotes;
  // labels即時同期（直接変更せず再構築）
  const NEED_KEYS_MODAL: readonly StaffNoteKey[] = STAFF_NOTE_KEYS;
  commentModalJournal.value.labels = commentModalJournal.value.labels.filter((l) => !isStaffNoteKey(l));
  for (const k of NEED_KEYS_MODAL) {
    if (modalNotes[k]?.enabled) commentModalJournal.value.labels.push(k);
  }
}
// ────── キーボードショートカット: Ctrl+Z / Ctrl+Y ──────
function handleUndoRedoKeydown(e: KeyboardEvent): void {
  if (e.ctrlKey && e.key === "z") {
    e.preventDefault();
    undo();
  } else if (e.ctrlKey && e.key === "y") {
    e.preventDefault();
    redo();
  }
}
// ────── セッション滞在時間計測（Phase 4: 操作時間追跡基礎） ──────
const sessionStartTime = ref<number>(Date.now());
onMounted(() => {
  window.addEventListener("keydown", handleUndoRedoKeydown);
  sessionStartTime.value = Date.now();
  console.log(
    `[セッション] 仕訳画面開始: ${new Date().toISOString()} スタッフ: ${currentStaffId.value}`,
  );
  // ツールバーの過去仕訳CSV件数表示用に自動取得
  fetchConfirmedJournals();
});
onUnmounted(() => {
  window.removeEventListener("keydown", handleUndoRedoKeydown);
  const elapsed = Math.round((Date.now() - sessionStartTime.value) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  console.log(
    `[セッション] 仕訳画面終了: ${new Date().toISOString()} スタッフ: ${currentStaffId.value} 滞在: ${minutes}分${seconds}秒`,
  );
});
</script>

<style scoped>
/* 出力済み行: 背景グレー統一 + 編集不可の外観 */
.exported-row > div {
  background: #e5e7eb !important; /* gray-200 */
  border-right-color: #d1d5db !important; /* gray-300 */
  cursor: default !important;
}
.exported-row > div:hover {
  background: #e5e7eb !important;
  outline: none !important;
}
.exported-row .jl-editable {
  background: #e5e7eb !important;
  cursor: default !important;
}
.exported-row .jl-editable:hover {
  background: #e5e7eb !important;
  outline: none !important;
}
/* E: フィル対象セルのみハイライト（行全体ではなくセル単位） */
.fill-target-cell {
  background: #fef9c3 !important;
  outline: 2px dashed #2563eb;
}
/* 編集可能セル共通スタイル（B3統一） */
.jl-editable {
  background: #fff5f5;
  cursor: text;
}
.jl-editable:hover {
  background: #fef3c7 !important;
  outline: 1px dashed #22c55e;
}
/* D: フィルハンドル判定拡大 */
.fill-handle::after {
  content: "";
  position: absolute;
  inset: -3px;
  cursor: crosshair;
}
/* 警告セル（赤背景白字）内の入力フィールドは黒字を保証 */
.inline-edit-input {
  color: #111 !important;
}
</style>

<!-- ドラッグ中のカーソル強制（グローバル、scoped外） -->
<style>
body.cell-drag-ready,
body.cell-drag-ready * {
  cursor: grab !important;
}
body.cell-dragging,
body.cell-dragging * {
  cursor: grabbing !important;
  user-select: none !important;
  -webkit-user-select: none !important;
}
</style>
