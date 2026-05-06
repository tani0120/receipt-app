<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans" @click="closeDropdown">
    <!-- L3ツールバー（共通ナビバー） -->
    <!-- 上部バー -->
    <div
      class="bg-white px-3 py-[5.2px] flex justify-between items-center text-[10px] text-gray-700"
    >
      <!-- フィルタモード（通常時） -->
      <template v-if="!isSelectionMode">
        <div class="flex items-center gap-3 text-[11px]">
          <div class="flex items-center gap-1">
            <i class="fa-solid fa-magnifying-glass text-[10px] text-gray-400"></i>
            <input
              type="text"
              v-model="globalSearchQuery"
              placeholder="全列検索（摘要・科目・金額…）"
              class="border border-blue-400 text-blue-700 text-[11px] px-2 py-0.5 rounded w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              v-if="globalSearchQuery"
              @click="globalSearchQuery = ''"
              class="text-gray-400 hover:text-gray-600 text-[10px] -ml-5"
            >✕</button>
          </div>
          <label class="flex items-center gap-1 cursor-pointer"
            ><input
              type="checkbox"
              v-model="showUnexported"
              class="w-2.5 h-2.5"
            />未出力を表示</label
          >
          <label class="flex items-center gap-1 cursor-pointer"
            ><input
              type="checkbox"
              v-model="showExported"
              class="w-2.5 h-2.5"
            />過去出力済を表示</label
          >
          <label class="flex items-center gap-1 cursor-pointer"
            ><input
              type="checkbox"
              v-model="showPastCsv"
              class="w-2.5 h-2.5"
            />過去仕訳CSV</label
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
            title="選択解除"
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
          title="元に戻す (Ctrl+Z)"
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
          title="やり直し (Ctrl+Y)"
        >
          <i class="fa-solid fa-rotate-right text-[10px]"></i>進める
        </button>
        <span class="text-gray-300">|</span>
        <button
          class="text-[13px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 transition-all"
          @click="resetColWidths()"
          title="列幅をデフォルトに戻す"
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
                v-if="col.key === 'labelType' || col.key === 'warning' || col.key === 'voucher_type'"
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
                  class="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-[110] transform scale-[0.9] origin-top"
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
                  class="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-[110] transform scale-[0.9] origin-top"
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
                    </div>
                  </div>
                </div>
              </span>
              <!-- 証票意味ポップオーバー -->
              <div
                v-if="legendModalType === 'voucher_type' && col.key === 'voucher_type'"
                class="absolute top-full left-0 mt-1 z-[110] transform origin-top-left"
              >
                <div
                  class="bg-gray-900/95 rounded-xl shadow-2xl w-[520px] overflow-hidden border border-gray-700"
                >
                  <div
                    class="flex items-center justify-between px-4 py-2.5 border-b border-gray-700 bg-gradient-to-r from-blue-900/40 to-purple-900/40"
                  >
                    <span class="text-white font-bold text-[14px] flex items-center gap-1.5"
                      >📋 証票意味ごとの許容科目ルール</span
                    >
                  </div>
                  <div class="p-3 text-[12px]">
                    <table class="w-full border-collapse">
                      <thead>
                        <tr class="text-gray-400 text-[11px]">
                          <th class="text-left px-2 py-1.5 w-[90px] border-b-2 border-gray-600">証票意味</th>
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
                            <span class="inline-flex items-center gap-1 text-blue-300">🧾 経費</span>
                          </td>
                          <td class="px-2 py-2 text-gray-200">
                            <span class="bg-blue-500/20 text-blue-200 px-1.5 py-0.5 rounded text-[10px]">費用科目全般</span>
                          </td>
                          <td class="px-2 py-2 text-gray-300">現金・預金・未払金・仮払金</td>
                        </tr>
                        <tr class="border-b border-gray-800/60">
                          <td class="px-2 py-2 font-bold">
                            <span class="inline-flex items-center gap-1 text-blue-300">💰 売上</span>
                          </td>
                          <td class="px-2 py-2 text-gray-300">売掛金・現金・預金</td>
                          <td class="px-2 py-2 text-gray-200">
                            <span class="bg-green-500/20 text-green-200 px-1.5 py-0.5 rounded text-[10px]">収益科目全般</span>
                          </td>
                        </tr>
                        <tr class="border-b border-gray-800/60 bg-gray-800/20">
                          <td class="px-2 py-2 font-bold">
                            <span class="inline-flex items-center gap-1 text-purple-300">💳 クレカ</span>
                          </td>
                          <td class="px-2 py-2 text-gray-200">
                            <span class="bg-blue-500/20 text-blue-200 px-1.5 py-0.5 rounded text-[10px]">費用科目全般</span>
                          </td>
                          <td class="px-2 py-2 text-gray-300">未払金のみ</td>
                        </tr>
                        <tr class="border-b border-gray-800/60">
                          <td class="px-2 py-2 font-bold">
                            <span class="inline-flex items-center gap-1 text-purple-300">🏦 クレカ引落</span>
                          </td>
                          <td class="px-2 py-2 text-gray-300">未払金のみ</td>
                          <td class="px-2 py-2 text-gray-300">預金口座</td>
                        </tr>
                        <tr class="border-b border-gray-800/60 bg-gray-800/20">
                          <td class="px-2 py-2 font-bold">
                            <span class="inline-flex items-center gap-1 text-green-300">👤 給与</span>
                          </td>
                          <td class="px-2 py-2 text-gray-300">給料手当・役員報酬・賞与</td>
                          <td class="px-2 py-2 text-gray-300">預金<span class="text-gray-500 text-[10px]">（手取）</span>+ 預り金<span class="text-gray-500 text-[10px]">（天引）</span></td>
                        </tr>
                        <tr class="border-b border-gray-800/60">
                          <td class="px-2 py-2 font-bold">
                            <span class="inline-flex items-center gap-1 text-orange-300">📝 立替経費</span>
                          </td>
                          <td class="px-2 py-2 text-gray-200">
                            <span class="bg-blue-500/20 text-blue-200 px-1.5 py-0.5 rounded text-[10px]">費用科目全般</span>
                          </td>
                          <td class="px-2 py-2 text-gray-300">立替金・未収金</td>
                        </tr>
                        <tr>
                          <td class="px-2 py-2 font-bold">
                            <span class="inline-flex items-center gap-1 text-cyan-300">🔄 振替</span>
                          </td>
                          <td class="px-2 py-2 text-gray-300">預金口座</td>
                          <td class="px-2 py-2 text-gray-300">預金口座</td>
                        </tr>
                      </tbody>
                    </table>
                    <div class="mt-3 pt-2 border-t border-gray-700 text-[10px] text-gray-400 px-1 flex items-center gap-1">
                      <span class="text-yellow-400">⚠</span> 上記以外の科目を使用した場合、証票意味矛盾警告が表示されます
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
        <template v-for="(journal, journalIndex) in paginatedJournals" :key="journal.id">
          <div
            v-for="(row, rowIndex) in getCombinedRows(journal)"
            :key="`${journal.id}-${rowIndex}`"
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
                  v-if="rowIndex === 0"
                  type="checkbox"
                  class="w-2.5 h-2.5 cursor-pointer"
                  :checked="selectedIds.has(journal.id)"
                  @change="toggleSelect(journal.id)"
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

              <!-- component型（col.key別に既存ロジック維持） -->
              <template v-else-if="col.type === 'component'">
                <!-- 写真 -->
                <template v-if="col.key === 'photo'">
                  <div
                    v-if="rowIndex === 0"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200',
                    ]"
                  >
                    <i
                      class="fa-solid fa-camera text-[10px] text-gray-800 cursor-pointer"
                      title="写真（クリックで固定）"
                      @mouseenter="showImageModal(journal.id, journal.document_id)"
                      @mouseleave="hideImageModal"
                      @click="togglePinModal(journal.id, journal.document_id)"
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
                    v-if="rowIndex === 0"
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
                      title="根拠資料あり（クリックで表示）"
                      @click="previewSupportingImage(supportingMatchMap.get(journal.id)?.[0] ?? { previewUrl: '' })"
                    ></i>
                    <!-- 紐づけなし: グレー → クリックで検索モーダル -->
                    <i
                      v-else
                      class="fa-solid fa-paperclip text-[10px] text-gray-300 cursor-pointer hover:text-gray-500 transition-colors"
                      title="根拠資料を検索"
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
                    v-if="rowIndex === 0"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200',
                    ]"
                  >
                    <i
                      v-if="hasPastJournal(journal)"
                      class="fa-solid fa-magnifying-glass text-[10px] text-gray-600 cursor-pointer"
                      title="過去仕訳（クリックでピン留め）"
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
                    v-if="rowIndex === 0"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200 cursor-pointer relative',
                    ]"
                    @mouseenter="hoverOpenCommentModal(journal)"
                    @mouseleave="scheduleHoverCloseCommentModal()"
                    @click.stop="
                      openCommentModal(journal.id);
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
                    v-if="rowIndex === 0"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200 gap-1',
                    ]"
                  >
                    <template v-for="noteKey in staffNoteKeys" :key="noteKey">
                      <div
                        class="relative"
                        @mouseenter="showNeedPopup(journal.id, noteKey)"
                        @mouseleave="scheduleHideNeedPopup()"
                      >
                        <button
                          @click="toggleStaffNote(journal.id, noteKey)"
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
                            needPopupJournalId === journal.id &&
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
                    v-if="rowIndex === 0"
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
                    v-if="rowIndex === 0"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200',
                    ]"
                  >
                    <span
                      v-if="journal.labels.some((l) => warningLabelMap[l])"
                      class="relative inline-flex items-center"
                    >
                      <i
                        class="fa-solid fa-triangle-exclamation text-[10px] text-red-600 cursor-pointer"
                        @mouseenter="showWarningTooltip($event, journal.labels, journal)"
                        @mouseleave="hideTooltip()"
                        @click.stop="openWarningConfirmModal(journal)"
                      ></i>
                      <span
                        v-if="journal.labels.filter((l) => warningLabelMap[l]).length >= 2"
                        class="absolute -top-1.5 -right-2 bg-red-500 text-white text-[7px] font-bold rounded-full w-3 h-3 flex items-center justify-center"
                        >{{ journal.labels.filter((l) => warningLabelMap[l]).length }}</span
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
                    v-if="rowIndex === 0"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200',
                    ]"
                  >
                    <i
                      v-if="journal.labels.includes('RULE_APPLIED')"
                      class="fa-solid fa-graduation-cap text-[10px] text-green-600 cursor-default"
                      @mouseenter="showTooltip($event, '学習適用済み')"
                      @mouseleave="hideTooltip()"
                    ></i>
                    <i
                      v-if="journal.labels.includes('RULE_AVAILABLE')"
                      class="fa-solid fa-lightbulb text-[10px] text-blue-500 cursor-default"
                      @mouseenter="showTooltip($event, '学習できます')"
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
                    v-if="rowIndex === 0"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200',
                    ]"
                  >
                    <span
                      v-if="journal.is_credit_card_payment"
                      class="text-[12px] cursor-default"
                      @mouseenter="showTooltip($event, 'クレジットカード払い')"
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
                    v-if="rowIndex === 0"
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

                <!-- 証票メモ（journal.memo truthy判定、アイコンのみ） -->
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
                      v-if="journal.memo"
                      class="fa-solid fa-pencil text-[10px] text-gray-600 cursor-default"
                      @mouseenter="showTooltip($event, '証票にメモあり')"
                      @mouseleave="hideTooltip()"
                    ></i>
                  </div>
                  <div
                    v-else
                    :style="colWidthStyle(col)"
                    :class="[colWidthClass(col), 'border-r border-gray-200']"
                  ></div>
                </template>

                <!-- 適格 -->
                <template v-else-if="col.key === 'invoice'">
                  <div
                    v-if="rowIndex === 0"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 flex items-center justify-center border-r border-gray-200 relative jl-editable',
                    ]"
                    @dblclick.stop="
                      startCellEdit(
                        journal.id,
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
                    <template v-if="isEditing(journal.id, rowIndex, 'invoice')">
                      <select
                        class="inline-edit-input w-full text-[9px] bg-yellow-50 border border-blue-400 rounded outline-none px-0.5 py-0"
                        style="height: 100%; min-height: 0; line-height: 1"
                        v-model="editingValue"
                        @change="commitCellEdit()"
                        @keydown.escape="cancelCellEdit()"
                        @blur="commitCellEdit()"
                      >
                        <option value="">　</option>
                        <option value="◯">◯</option>
                        <option value="✕">✕</option>
                      </select>
                    </template>
                    <template v-else>
                      <span
                        v-if="journal.labels.includes('INVOICE_QUALIFIED')"
                        class="text-green-600 text-sm font-bold cursor-pointer"
                        @mouseenter="showTooltip($event, journal.invoice_number ? `${journal.invoice_number}` : '適格（T番号なし）')"
                        @mouseleave="hideTooltip()"
                        >◯</span
                      >
                      <span
                        v-else-if="journal.labels.includes('INVOICE_NOT_QUALIFIED')"
                        class="text-red-600 text-sm font-bold cursor-pointer"
                        @mouseenter="showTooltip($event, '非適格')"
                        @mouseleave="hideTooltip()"
                        >✕</span
                      >
                    </template>
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
                <template v-if="rowIndex === 0">
                  <div
                    :data-drag-col="col.key"
                    :data-drag-row="rowIndex"
                    :style="colWidthStyle(col)"
                    :class="[
                      colWidthClass(col),
                      'p-0.5 border-r border-gray-200 text-[10px] relative jl-editable',
                      getWarningCellClass(journal, col.key),
                      isDragOver(journalIndex, 0, col.key)
                        ? 'ring-2 ring-blue-500 !bg-yellow-200 !text-black'
                        : '',
                      isDragCompatibleCol(col.key) ? '!bg-blue-50' : '',
                      isDragIncompatibleCol(col.key) ? 'opacity-30' : '',
                    ]"
                    @dblclick.stop="
                      startCellEdit(journal.id, 0, col.key, journal.voucher_type || '')
                    "
                    @mousedown="startCellDrag(col.key, journal.voucher_type || '', $event)"
                  >
                    <template v-if="isEditing(journal.id, 0, col.key)">
                      <select
                        class="inline-edit-input w-full text-[9px] bg-white border border-blue-400 rounded outline-none px-0.5 py-0"
                        v-model="editingValue"
                        @change="
                          journal.voucher_type = editingValue;
                          journal.is_read = true;
                          syncWarningLabels(journal);
                          editingCell = null;
                        "
                        @blur="editingCell = null"
                        @keydown.escape="cancelCellEdit()"
                      >
                        <option value="">--</option>
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
                    hasEntry(row, col.key) ? 'jl-editable' : '',
                    isDragOver(journalIndex, rowIndex, col.key)
                      ? 'ring-2 ring-blue-500 !bg-yellow-200 !text-black'
                      : '',
                    isFillTargetCell(journalIndex, col.key) ? 'fill-target-cell' : '',
                    getWarningCellClass(
                      journal,
                      col.key,
                      row[col.key.startsWith('debit') ? 'debit' : 'credit'] ?? undefined,
                    ),
                    isDragCompatibleCol(col.key) ? '!bg-blue-50' : '',
                    isDragIncompatibleCol(col.key) ? 'opacity-30' : '',
                  ]"
                  @dblclick.stop="
                    hasEntry(row, col.key) &&
                    (startCellEdit(
                      journal.id,
                      rowIndex,
                      col.key,
                      (getRawValue(row, col.key) as string) ?? '',
                    ),
                    (expandedMegaGroup = null))
                  "
                  @mousedown="
                    hasEntry(row, col.key) &&
                    startCellDrag(col.key, getRawValue(row, col.key), $event)
                  "
                >
                  <template v-if="isEditing(journal.id, rowIndex, col.key)">
                    <div class="relative">
                      <input
                        type="text"
                        class="inline-edit-input w-full text-[9px] bg-white border border-blue-400 rounded outline-none pl-0.5 pr-5 py-0"
                        v-model="editingValue"
                        placeholder="検索..."
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
                              @mousedown.prevent="selectAccountItem(journal, row, col.key, a.id)"
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
                          <template v-if="getRawValue(row, col.key) as string">
                            <div
                              class="px-2 py-1 text-[9px] font-bold text-blue-700 bg-blue-50 border-b border-blue-200 flex items-center gap-1"
                            >
                              <i class="fa-solid fa-check text-[7px]"></i>
                              {{ resolveAccountName(getRawValue(row, col.key) as string) }}
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
                                @mousedown.prevent="selectAccountItem(journal, row, col.key, a.id)"
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
                    {{ resolveAccountName(getRawValue(row, col.key) as string) || "--" }}
                  </template>
                  <span
                    v-if="
                      isFillable(col.key) &&
                      !isEditing(journal.id, rowIndex, col.key) &&
                      !isCompoundJournal(journal)
                    "
                    class="fill-handle absolute bottom-0 right-0 w-[3px] h-[3px] bg-blue-500 cursor-crosshair z-10"
                    @mousedown.stop.prevent="
                      startFillDrag(
                        journalIndex,
                        col.key,
                        getRawValue(row, col.key) as string,
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
                      'p-0.5 flex items-center border-r border-gray-200 relative jl-editable',
                      col.key === 'voucher_date' ? 'justify-center text-[8px]' : '',
                      isDragOver(journalIndex, rowIndex, col.key)
                        ? 'ring-2 ring-blue-500 !bg-yellow-200 !text-black'
                        : '',
                      isFillTargetCell(journalIndex, col.key) ? 'fill-target-cell' : '',
                      getWarningCellClass(journal, col.key),
                      col.key === 'voucher_date' ? getDatePeriodClass(journal.voucher_date) : '',
                      isDragCompatibleCol(col.key) ? '!bg-blue-50' : '',
                      isDragIncompatibleCol(col.key) ? 'opacity-30' : '',
                    ]"
                    @dblclick.stop="
                      startCellEdit(journal.id, rowIndex, col.key, getValue(journal, col.key))
                    "
                    @mousedown="startCellDrag(col.key, getValue(journal, col.key), $event)"
                  >
                    <!-- 日付: 編集中はdate input -->
                    <template
                      v-if="col.key === 'voucher_date' && isEditing(journal.id, rowIndex, col.key)"
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
                        col.key === 'description' && isEditing(journal.id, rowIndex, col.key)
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
                        !isEditing(journal.id, rowIndex, col.key) &&
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
                    hasEntry(row, col.key) ? 'jl-editable' : '',
                    isDragOver(journalIndex, rowIndex, col.key)
                      ? 'ring-2 ring-blue-500 !bg-yellow-200 !text-black'
                      : '',
                    isFillTargetCell(journalIndex, col.key) ? 'fill-target-cell' : '',
                    getWarningCellClass(
                      journal,
                      col.key,
                      row[col.key.split('.')[0] as 'debit' | 'credit'] ?? undefined,
                    ),
                    isDragCompatibleCol(col.key) ? '!bg-blue-50' : '',
                    isDragIncompatibleCol(col.key) ? 'opacity-30' : '',
                  ]"
                  @dblclick.stop="
                    hasEntry(row, col.key) &&
                    startCellEdit(journal.id, rowIndex, col.key, getValue(row, col.key))
                  "
                  @mousedown="
                    hasEntry(row, col.key) && startCellDrag(col.key, getValue(row, col.key), $event)
                  "
                >
                  <template v-if="isEditing(journal.id, rowIndex, col.key)">
                    <!-- F4: 税区分は検索付きoptgroupコンボボックス（方向フィルタ） -->
                    <div v-if="col.key.endsWith('.tax_category_id')" class="relative">
                      <input
                        type="text"
                        class="inline-edit-input w-full text-[9px] bg-white border border-blue-400 rounded outline-none px-0.5 py-0"
                        v-model="editingValue"
                        placeholder="検索..."
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
                              :key="tc.id"
                              class="px-2 py-0.5 text-[9px] truncate hover:bg-blue-100 cursor-pointer text-gray-800 pl-4"
                              @mousedown.prevent="selectTaxItem(journal, tc.id)"
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
                              :key="tc.id"
                              class="px-2 py-0.5 text-[9px] truncate hover:bg-blue-100 cursor-pointer text-gray-800 pl-4"
                              @mousedown.prevent="selectTaxItem(journal, tc.id)"
                            >
                              {{ tc.name }}
                            </div>
                          </template>
                        </template>
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
                        isTaxCategoryInvalid(getRawValue(row, col.key) as string)
                      "
                      class="text-red-600 font-bold"
                      :title="
                        '課税方式と不整合: ' +
                        (activeClientFull?.consumptionTaxMode === 'exempt'
                          ? '免税事業者は対象外のみ'
                          : '本則課税に業種区分は不要')
                      "
                    >
                      ⚠ {{ getValue(row, col.key) ?? "" }}
                    </span>
                    <template v-else>{{ getValue(row, col.key) ?? "" }}</template>
                  </template>
                  <span
                    v-if="
                      isFillable(col.key) &&
                      !isEditing(journal.id, rowIndex, col.key) &&
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
                    hasEntry(row, col.key) ? 'jl-editable' : '',
                    col.key === 'debit.amount' ? 'border-r-2 border-r-blue-300' : '',
                    getWarningCellClass(
                      journal,
                      col.key,
                      row[col.key.split('.')[0] as 'debit' | 'credit'] ?? undefined,
                    ),
                    isDragOver(journalIndex, rowIndex, col.key)
                      ? 'ring-2 ring-blue-500 !bg-yellow-200 !text-black'
                      : '',
                    isDragCompatibleCol(col.key) ? '!bg-blue-50' : '',
                    isDragIncompatibleCol(col.key) ? 'opacity-30' : '',
                  ]"
                  @dblclick.stop="
                    hasEntry(row, col.key) &&
                    startCellEdit(journal.id, rowIndex, col.key, getValue(row, col.key))
                  "
                  @mousedown="
                    hasEntry(row, col.key) && startCellDrag(col.key, getValue(row, col.key), $event)
                  "
                >
                  <template v-if="isEditing(journal.id, rowIndex, col.key)">
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
                <!-- 💡 ヒントアイコン（全行表示） -->
                <span
                  class="text-amber-400 hover:text-amber-600 cursor-pointer text-xs"
                  title="ヒント"
                  @click.stop="openHintModal(journal)"
                >
                  {{ col.icon }}
                </span>

                <!-- ドロップダウンメニュー（w-44固定、拡張対応） -->
                <div
                  v-if="rowIndex === 0 && openDropdownId === journal.id"
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
        <option :value="30">30件</option>
        <option :value="50">50件</option>
        <option :value="100">100件</option>
      </select>
    </div>

    <!-- 画像モーダル（Teleportでbody直下に移動、ナビバーより前面に表示） -->
    <Teleport to="body">
      <div
        v-if="modalImageUrl"
        class="fixed inset-0 z-40 pointer-events-none"
        @click="hideImageModal"
      ></div>
      <div
        v-if="modalImageUrl"
        ref="imageModalRef"
        :style="{
          top: imageModalPos.top + 'px',
          left: imageModalPos.left + 'px',
          zIndex: imageModalZ,
        }"
        class="fixed bg-white rounded-lg shadow-2xl flex flex-col pointer-events-auto overflow-auto cursor-move w-[300px] h-[400px]"
        style="resize: both; min-width: 200px; min-height: 200px"
        @mousedown="modalDrag(startImageDrag, $event)"
      >
        <!-- ドラッグハンドル（ヘッダー） -->
        <div
          class="bg-blue-100 px-3 py-1.5 flex justify-between items-center cursor-move rounded-t-lg select-none"
          @mousedown="startImageDrag"
        >
          <span class="text-xs font-bold text-gray-900"
            >画像プレビュー <span class="font-normal text-amber-600">※移動できます</span></span
          >
          <button @click="closeModal" class="text-gray-500 hover:text-gray-700">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>
        <!-- ツールバー -->
        <div class="flex items-center gap-1 px-2 py-1 bg-gray-100 border-b border-gray-200">
          <button
            @click.stop="rotationAngle = (rotationAngle + 90) % 360"
            class="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow transition-colors"
            title="90度回転"
          >
            <i class="fa-solid fa-rotate-right text-xs"></i>
          </button>
          <button
            @click.stop="zoomIn"
            class="bg-green-500 hover:bg-green-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow transition-colors"
            title="拡大"
          >
            <i class="fa-solid fa-magnifying-glass-plus text-xs"></i>
          </button>
          <button
            @click.stop="zoomOut"
            class="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow transition-colors"
            title="縮小"
          >
            <i class="fa-solid fa-magnifying-glass-minus text-xs"></i>
          </button>
        </div>
        <!-- 画像表示エリア -->
        <div class="flex-1 flex items-center justify-center overflow-hidden rounded-b-lg">
          <template v-if="modalImageUrl?.toLowerCase().endsWith('.pdf')">
            <iframe :src="modalImageUrl" class="w-full h-full border-0"></iframe>
          </template>
          <img v-else
            :src="modalImageUrl"
            alt="領収書"
            :style="{
              transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotationAngle}deg) scale(${zoomScale})`,
              imageOrientation: 'from-image',
              cursor: isDragging ? 'grabbing' : 'grab',
            }"
            class="max-w-full max-h-full object-contain transition-transform duration-300"
            @load="onImageLoad"
            @mousedown="onMouseDown"
            @mousemove="onMouseMove"
            @mouseup="onMouseUp"
            @mouseleave="onMouseUp"
          />
        </div>
        <!-- リサイズグリップインジケーター -->
        <div
          class="absolute bottom-0 right-0 w-5 h-5 pointer-events-none"
          style="
            background: linear-gradient(
              135deg,
              transparent 50%,
              rgba(59, 130, 246, 0.5) 50%,
              rgba(59, 130, 246, 0.7) 100%
            );
            border-radius: 0 0 0.5rem 0;
          "
        ></div>
      </div>
    </Teleport>

    <!-- 根拠資料検索モーダル（ドラッグ移動・リサイズ可能） -->
    <Teleport to="body">
      <div
        v-if="showSupportingSearchModal"
        ref="supportingSearchModalRef"
        :style="{
          top: supportingSearchPos.top + 'px',
          left: supportingSearchPos.left + 'px',
          zIndex: supportingSearchZ,
        }"
        class="fixed bg-white rounded-lg shadow-2xl flex flex-col pointer-events-auto overflow-hidden cursor-move w-[400px] h-[500px] border-2 border-amber-300"
        style="resize: both; min-width: 300px; min-height: 300px"
        @mousedown="modalDrag(startSupportingSearchDrag, $event)"
        @click.stop
      >
        <!-- ヘッダー（ドラッグハンドル） -->
        <div
          class="bg-gradient-to-r from-amber-100 to-orange-50 px-3 py-1.5 flex justify-between items-center cursor-move rounded-t-lg select-none border-b border-amber-200"
          @mousedown="startSupportingSearchDrag"
        >
          <span class="text-xs font-bold text-amber-900 flex items-center gap-2">
            <i class="fa-solid fa-paperclip text-amber-600"></i>
            根拠資料検索 <span class="font-normal text-amber-600">※移動できます</span>
          </span>
          <button @click="closeSupportingSearchModal" class="text-gray-500 hover:text-gray-700">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>
        <!-- 検索バー -->
        <div class="px-3 py-2 border-b border-gray-100 bg-gray-50">
          <div class="relative">
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            <input
              ref="supportingSearchInputRef"
              v-model="supportingSearchQuery"
              type="text"
              placeholder="日付 金額 取引先名 ファイル名 等"
              class="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              @input="debounceSupportingSearch"
              @mousedown.stop
            />
          </div>
          <div class="flex items-center justify-between mt-1 text-[9px] text-gray-500">
            <span>スペース区切りAND検索</span>
            <span v-if="supportingSearchResults.length > 0">{{ supportingSearchResults.length }}件</span>
          </div>
        </div>
        <!-- 検索結果 -->
        <div class="flex-1 overflow-y-auto p-2" @mousedown.stop>
          <div v-if="isSupportingSearching" class="flex items-center justify-center py-8 text-gray-400">
            <i class="fa-solid fa-spinner fa-spin mr-2"></i>検索中...
          </div>
          <div v-else-if="supportingSearchResults.length === 0 && supportingSearchDone" class="text-center py-8 text-gray-400">
            <i class="fa-solid fa-inbox text-2xl mb-2 block"></i>
            <span class="text-[11px]">{{ supportingSearchQuery ? '該当なし' : '根拠資料未登録' }}</span>
          </div>
          <div v-else class="grid grid-cols-2 gap-1.5">
            <div
              v-for="item in supportingSearchResults"
              :key="item.id"
              class="border border-gray-200 rounded p-2 hover:bg-amber-50 hover:border-amber-300 cursor-pointer transition-colors"
              @click="previewSupportingImage(item)"
            >
              <div class="w-full h-16 bg-gray-100 rounded mb-1.5 overflow-hidden flex items-center justify-center">
                <img
                  v-if="item.previewUrl"
                  :src="item.previewUrl"
                  :alt="item.fileName"
                  class="max-w-full max-h-full object-contain"
                  @error="($event.target as HTMLImageElement).style.display = 'none'"
                />
                <i v-else class="fa-solid fa-file-image text-xl text-gray-300"></i>
              </div>
              <div class="text-[9px] space-y-0.5">
                <div class="font-bold text-gray-800 truncate" :title="item.fileName">{{ item.fileName }}</div>
                <div v-if="item.date" class="text-gray-600">
                  <i class="fa-solid fa-calendar text-[7px] mr-0.5 text-amber-500"></i>{{ item.date }}
                </div>
                <div v-if="item.amount != null" class="text-gray-600">
                  <i class="fa-solid fa-yen-sign text-[7px] mr-0.5 text-green-500"></i>{{ Number(item.amount).toLocaleString() }}
                </div>
                <div v-if="item.vendor" class="text-gray-600 truncate">
                  <i class="fa-solid fa-building text-[7px] mr-0.5 text-blue-500"></i>{{ item.vendor }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- リサイズグリップ -->
        <div class="absolute bottom-0 right-0 w-5 h-5 pointer-events-none" style="background:linear-gradient(135deg,transparent 50%,rgba(217,119,6,0.5) 50%,rgba(217,119,6,0.7) 100%);border-radius:0 0 0.5rem 0"></div>
      </div>

      <!-- 根拠資料画像プレビュー（検索結果から選択時） -->
      <div
        v-if="supportingPreviewUrl"
        ref="supportingImageModalRef"
        :style="{
          top: supportingImagePos.top + 'px',
          left: supportingImagePos.left + 'px',
          zIndex: supportingImageZ,
        }"
        class="fixed bg-white rounded-lg shadow-2xl flex flex-col pointer-events-auto overflow-auto cursor-move w-[300px] h-[400px]"
        style="resize: both; min-width: 200px; min-height: 200px"
        @mousedown="modalDrag(startSupportingImageDrag, $event)"
      >
        <div
          class="bg-amber-100 px-3 py-1.5 flex justify-between items-center cursor-move rounded-t-lg select-none"
          @mousedown="startSupportingImageDrag"
        >
          <span class="text-xs font-bold text-gray-900">根拠資料プレビュー <span class="font-normal text-amber-600">※移動できます</span></span>
          <button @click="closeSupportingPreview" class="text-gray-500 hover:text-gray-700">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>
        <div class="flex items-center gap-1 px-2 py-1 bg-gray-100 border-b border-gray-200">
          <button @click.stop="supportingRotation = (supportingRotation + 90) % 360" class="bg-amber-500 hover:bg-amber-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow transition-colors" title="90度回転">
            <i class="fa-solid fa-rotate-right text-xs"></i>
          </button>
          <button @click.stop="supportingZoom = Math.min(supportingZoom + 0.25, 7)" class="bg-green-500 hover:bg-green-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow transition-colors" title="拡大">
            <i class="fa-solid fa-magnifying-glass-plus text-xs"></i>
          </button>
          <button @click.stop="supportingZoom = Math.max(supportingZoom - 0.25, 0.25)" class="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow transition-colors" title="縮小">
            <i class="fa-solid fa-magnifying-glass-minus text-xs"></i>
          </button>
        </div>
        <div class="flex-1 flex items-center justify-center overflow-hidden rounded-b-lg">
          <img :src="supportingPreviewUrl" alt="根拠資料" :style="{ transform: `rotate(${supportingRotation}deg) scale(${supportingZoom})`, imageOrientation: 'from-image' }" class="max-w-full max-h-full object-contain transition-transform duration-300" />
        </div>
        <div class="absolute bottom-0 right-0 w-5 h-5 pointer-events-none" style="background:linear-gradient(135deg,transparent 50%,rgba(217,119,6,0.5) 50%,rgba(217,119,6,0.7) 100%);border-radius:0 0 0.5rem 0"></div>
      </div>
    </Teleport>

    <!-- 過去仕訳検索モーダル（Teleportでbody直下に移動） -->
    <Teleport to="body">
      <div
        v-if="showPastJournalModal"
        ref="pastJournalModalRef"
        :style="{
          top: pastJournalPos.top + 'px',
          left: pastJournalPos.left + 'px',
          zIndex: pastJournalZ,
        }"
        class="fixed bg-white rounded-lg shadow-2xl flex flex-col pointer-events-auto border-2 border-gray-300 overflow-auto w-[600px] h-[600px] cursor-move"
        style="resize: both; min-width: 300px; min-height: 200px"
        @click.stop
        @mousedown="modalDrag(startPastJournalDrag, $event)"
      >
        <!-- モーダルヘッダー（ドラッグハンドル） -->
        <div
          class="bg-blue-100 px-4 py-3 border-b flex justify-between items-center cursor-move select-none rounded-t-lg"
          @mousedown="startPastJournalDrag"
        >
          <h2 class="text-sm font-bold text-gray-900">
            過去仕訳検索 <span class="font-normal text-xs text-amber-600">※移動できます</span>
          </h2>
          <button @click="closePastJournalModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <!-- 検索条件 -->
        <div class="p-4 border-b bg-gray-50">
          <div class="grid grid-cols-3 gap-4 mb-3">
            <!-- 摘要 -->
            <div>
              <label class="text-xs text-gray-700 block mb-1">摘要</label>
              <input
                type="text"
                v-model="pastJournalSearch.vendor"
                placeholder="パーク宝小路"
                class="w-full px-2 py-1 text-xs border rounded"
              />
            </div>
          </div>

          <!-- 日付 -->
          <div class="mb-3">
            <label class="text-xs text-gray-700 block mb-1">日付</label>
            <div class="flex items-center gap-2">
              <input
                type="date"
                v-model="pastJournalSearch.dateFrom"
                class="w-40 px-2 py-1 text-xs border rounded"
              />
              <span class="text-xs">〜</span>
              <input
                type="date"
                v-model="pastJournalSearch.dateTo"
                class="w-40 px-2 py-1 text-xs border rounded"
              />
            </div>
          </div>

          <!-- 金額条件 -->
          <div class="mb-3">
            <label class="text-xs text-gray-700 block mb-1">金額条件</label>
            <div class="flex items-center gap-2">
              <select
                v-model="pastJournalSearch.amountCondition"
                class="w-40 px-2 py-1 text-xs border rounded"
              >
                <option value="">選択してください</option>
                <option value="equal">等しい</option>
                <option value="greater">以上</option>
                <option value="less">以下</option>
              </select>
              <input
                type="number"
                v-model.number="pastJournalSearch.amount"
                placeholder="金額を入力"
                class="w-32 px-2 py-1 text-xs border rounded"
              />
            </div>
          </div>

          <!-- 借方勘定科目、貸方勘定科目 -->
          <div class="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label class="text-xs text-gray-700 block mb-1">借方勘定科目</label>
              <select
                v-model="pastJournalSearch.debitAccount"
                class="w-full px-2 py-1 text-xs border rounded"
              >
                <option value="">選択してください</option>
                <option value="旅費交通費">旅費交通費</option>
                <option value="消耗品費">消耗品費</option>
                <option value="会議費">会議費</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-gray-700 block mb-1">貸方勘定科目</label>
              <select
                v-model="pastJournalSearch.creditAccount"
                class="w-full px-2 py-1 text-xs border rounded"
              >
                <option value="">選択してください</option>
                <option value="現金">現金</option>
                <option value="普通預金">普通預金</option>
                <option value="未払金">未払金</option>
              </select>
            </div>
          </div>

          <!-- 絞り込みボタン -->
          <div class="flex gap-2">
            <button
              @click="
                () => {
                  /* TODO (2026-05): searchPastJournals。Supabase移行後に実装 */
                }
              "
              class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-xs"
            >
              絞り込み
            </button>
          </div>
        </div>

        <!-- タブ -->
        <div class="flex border-b">
          <button
            @click="pastJournalTab = 'streamed'"
            :class="[
              'px-4 py-2 text-xs font-medium',
              pastJournalTab === 'streamed'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800',
            ]"
          >
            システム上の過去仕訳
          </button>
          <button
            @click="pastJournalTab = 'accounting'; fetchConfirmedJournals()"
            :class="[
              'px-4 py-2 text-xs font-medium',
              pastJournalTab === 'accounting'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800',
            ]"
          >
            会計ソフトから取り込んだ過去仕訳
            <span v-if="confirmedJournals.length > 0" class="ml-1 px-1.5 py-0.5 text-[9px] bg-amber-100 text-amber-700 rounded-full font-bold">{{ confirmedJournals.length }}</span>
          </button>
        </div>

        <!-- 検索結果テーブル -->
        <div class="flex-1 overflow-auto p-4">
          <!-- ローディング表示（会計タブ） -->
          <div v-if="pastJournalTab === 'accounting' && isConfirmedLoading" class="text-center py-8 text-gray-400 text-sm">
            <i class="fa-solid fa-spinner fa-spin mr-2"></i>過去仕訳データを読み込み中...
          </div>
          <!-- 件数サマリー（会計タブ） -->
          <div v-if="pastJournalTab === 'accounting' && !isConfirmedLoading && confirmedJournals.length > 0" class="text-xs text-gray-500 mb-2">
            取込済み過去仕訳: <span class="font-bold text-gray-700">{{ confirmedJournals.length }}件</span>
            <span v-if="filteredPastJournals.length !== confirmedJournals.length" class="ml-2">→ 絞込結果: <span class="font-bold text-blue-600">{{ filteredPastJournals.length }}件</span></span>
          </div>
          <div class="text-xs text-gray-600 mb-2" v-if="pastJournalTab !== 'accounting'">
            行の背景色:
            <button
              @click="toggleOutputFilter('unexported')"
              :class="[
                'inline-block px-4 py-0.5 ml-2 text-xs cursor-pointer rounded',
                outputFilter === 'unexported'
                  ? 'bg-blue-200 border-2 border-blue-500 font-bold'
                  : 'bg-blue-50 border border-blue-300',
              ]"
            >
              未出力
            </button>
            <button
              @click="toggleOutputFilter('exported')"
              :class="[
                'inline-block px-4 py-0.5 ml-2 text-xs cursor-pointer rounded',
                outputFilter === 'exported'
                  ? 'bg-gray-200 border-2 border-black font-bold'
                  : 'bg-white border border-black',
              ]"
            >
              出力済み
            </button>
          </div>

          <table class="w-full text-[10px] border-collapse">
            <thead class="bg-gray-100 sticky top-0">
              <tr>
                <th class="border px-2 py-1 text-center">日付</th>
                <th class="border px-2 py-1 text-center">摘要</th>
                <th class="border px-2 py-1 text-center">借方勘定科目</th>
                <th class="border px-2 py-1 text-center">借方補助科目</th>
                <th class="border px-2 py-1 text-center">借方税区分</th>
                <th class="border px-2 py-1 text-center">貸方勘定科目</th>
                <th class="border px-2 py-1 text-center">貸方補助科目</th>
                <th class="border px-2 py-1 text-center">貸方税区分</th>
                <th class="border px-2 py-1 text-center">証憑種別</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(result, index) in paginatedPastJournals"
                :key="index"
                :class="result.status === 'exported' ? 'bg-white' : 'bg-blue-50'"
                class="hover:bg-blue-100 cursor-pointer"
              >
                <td class="border px-2 py-1 text-center">
                  {{ result.voucher_date ? formatDate(result.voucher_date) : "-" }}
                </td>
                <td class="border px-2 py-1">{{ result.description }}</td>
                <td class="border px-2 py-1">
                  {{ resolveAccountName(result.debit_entries[0]?.account) || "" }}
                </td>
                <td class="border px-2 py-1">{{ result.debit_entries[0]?.sub_account || "" }}</td>
                <td class="border px-2 py-1 text-center">
                  {{ resolveTaxCategoryName(result.debit_entries[0]?.tax_category_id) }}
                </td>
                <td class="border px-2 py-1">
                  {{ resolveAccountName(result.credit_entries[0]?.account) || "" }}
                </td>
                <td class="border px-2 py-1">{{ result.credit_entries[0]?.sub_account || "" }}</td>
                <td class="border px-2 py-1 text-center">
                  {{ resolveTaxCategoryName(result.credit_entries[0]?.tax_category_id) }}
                </td>
                <td class="border px-2 py-1 text-center">
                  <span v-if="result.labels.includes('TRANSPORT')">領</span>
                  <span v-if="result.labels.includes('RECEIPT')">レ</span>
                  <span v-if="result.labels.includes('INVOICE')">請</span>
                </td>
              </tr>
              <tr v-if="paginatedPastJournals.length === 0">
                <td colspan="9" class="border px-2 py-4 text-center text-gray-500">
                  検索結果がありません
                </td>
              </tr>
            </tbody>
          </table>

          <!-- ページネーション -->
          <div v-if="totalPages > 1" class="flex items-center justify-center gap-1 mt-3">
            <button
              @click="goToPage(pastJournalPage - 1)"
              :disabled="pastJournalPage <= 1"
              class="px-2 py-1 text-xs border rounded"
              :class="
                pastJournalPage <= 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100 cursor-pointer'
              "
            >
              &lt;
            </button>
            <button
              v-for="page in totalPages"
              :key="page"
              @click="goToPage(page)"
              class="px-2 py-1 text-xs border rounded min-w-[28px]"
              :class="
                page === pastJournalPage
                  ? 'bg-blue-500 text-white border-blue-500 font-bold'
                  : 'text-gray-600 hover:bg-gray-100 cursor-pointer'
              "
            >
              {{ page }}
            </button>
            <button
              @click="goToPage(pastJournalPage + 1)"
              :disabled="pastJournalPage >= totalPages"
              class="px-2 py-1 text-xs border rounded"
              :class="
                pastJournalPage >= totalPages
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100 cursor-pointer'
              "
            >
              &gt;
            </button>
          </div>
        </div>
        <!-- リサイズグリップインジケーター -->
        <div
          class="sticky bottom-0 ml-auto w-5 h-5 pointer-events-none flex-shrink-0"
          style="
            background: linear-gradient(
              135deg,
              transparent 50%,
              rgba(59, 130, 246, 0.5) 50%,
              rgba(59, 130, 246, 0.7) 100%
            );
            border-radius: 0 0 0.5rem 0;
          "
        ></div>
      </div>
    </Teleport>

    <!-- ────── ヒントモーダル（ドラッグ可能） ────── -->
    <Teleport to="body">
      <div
        v-if="hintModalJournal"
        ref="hintModalRef"
        :style="{
          top: hintModalPos.top + 'px',
          left: hintModalPos.left + 'px',
          zIndex: hintModalZ,
        }"
        class="fixed bg-white rounded-xl shadow-2xl w-[520px] max-h-[80vh] overflow-y-auto border border-gray-200 cursor-move"
        style="resize: both; min-width: 360px; min-height: 200px"
        @click.stop
        @mousedown="modalDrag(startHintDrag, $event)"
      >
        <!-- ヘッダー（ドラッグハンドル） -->
        <div
          class="bg-gradient-to-r from-amber-50 to-amber-100 px-5 py-3 border-b flex items-center justify-between rounded-t-xl cursor-move select-none"
          @mousedown="startHintDrag"
        >
          <div class="flex items-center gap-2">
            <span class="text-lg">💡</span>
            <h3 class="text-sm font-bold text-gray-800">ヒント</h3>
            <span class="text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded-full border">No.{{ hintModalJournalIndex + 1 }}</span>
            <span class="text-[10px] text-amber-600">※移動できます</span>
          </div>
          <button @click="hintModalJournal = null" class="text-gray-400 hover:text-gray-700 text-lg">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- 仕訳概要 -->
        <div class="px-5 py-3 bg-gray-50 border-b text-xs">
          <div class="flex gap-4">
            <span><b>日付:</b> {{ hintModalJournal.voucher_date || '未設定' }}</span>
            <span><b>摘要:</b> {{ hintModalJournal.description || '未設定' }}</span>
            <span><b>証票意味:</b> {{ hintModalJournal.voucher_type || '未設定' }}</span>
          </div>
        </div>

        <!-- ローディング表示（API待ち） -->
        <div v-if="hintLoading" class="px-5 py-8 flex items-center justify-center gap-2 text-xs text-gray-500">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <span>ヒントを取得中...</span>
        </div>

        <!-- ① バリデーション結果 -->
        <div v-else class="px-5 py-3 border-b">
          <h4 class="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
            📋 バリデーション結果
          </h4>
          <div v-if="hintValidations.length === 0" class="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
            <span class="text-base">✅</span>
            <span>この仕訳に問題は検出されませんでした</span>
          </div>
          <div v-else class="space-y-1.5">
            <div
              v-for="(v, vi) in hintValidations"
              :key="vi"
              :class="[
                'flex items-start gap-2 text-xs rounded-lg px-3 py-2',
                v.level === 'error' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800',
              ]"
            >
              <span class="text-base flex-shrink-0">{{ v.level === 'error' ? '❌' : '⚠️' }}</span>
              <span>{{ v.message }}</span>
            </div>
          </div>
        </div>

        <!-- ② 修正候補（ルールベース） -->
        <div class="px-5 py-3 border-b">
          <h4 class="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
            💡 修正候補
          </h4>
          <div v-if="hintSuggestions.length === 0" class="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            修正候補はありません
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="(s, si) in hintSuggestions"
              :key="si"
              class="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                  <span class="text-blue-600 font-bold flex-shrink-0">{{ s.side === 'debit' ? '借方' : '貸方' }}</span>
                  <span class="text-gray-500 flex-shrink-0">{{ s.field }}:</span>
                  <span class="text-red-500 line-through flex-shrink-0">{{ s.currentLabel }}</span>
                  <span class="text-gray-400 flex-shrink-0">→</span>
                  <!-- 択一候補: ドロップダウン -->
                  <select
                    v-if="s.alternatives.length > 1"
                    :value="s.selectedValue"
                    @change="onHintAlternativeChange(si, ($event.target as HTMLSelectElement).value)"
                    class="border border-blue-300 rounded px-1.5 py-0.5 text-xs bg-white text-green-700 font-bold max-w-[200px] cursor-pointer"
                    @click.stop
                    @mousedown.stop
                  >
                    <option v-for="alt in s.alternatives" :key="alt.value" :value="alt.value">
                      {{ alt.label }}
                    </option>
                  </select>
                  <!-- 単一候補: テキスト表示 -->
                  <span v-else class="text-green-700 font-bold">{{ s.selectedLabel }}</span>
                </div>
                <button
                  @click="applyHintSuggestion(s)"
                  class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-[10px] font-bold transition-colors flex-shrink-0 ml-2"
                >
                  適用
                </button>
              </div>
            </div>
            <!-- 全て適用ボタン -->
            <button
              v-if="hintSuggestions.length > 1"
              @click="hintSuggestions.forEach(s => applyHintSuggestion(s)); hintModalJournal = null"
              class="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-xs font-bold transition-colors mt-1"
            >
              ✨ 全て適用（各行の選択値を適用）
            </button>
          </div>
        </div>

        <!-- ③ AI推論（工事中） -->
        <div class="px-5 py-3 border-b">
          <h4 class="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
            🤖 AI推論
          </h4>
          <div class="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-3 text-center flex items-center justify-center gap-2">
            <span class="text-base">🚧</span>
            <span>工事中 — Gemini連携による高精度推論を準備中です</span>
          </div>
        </div>

        <!-- ④ 過去の類似仕訳（工事中） -->
        <div class="px-5 py-3">
          <h4 class="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
            📚 過去の類似仕訳
          </h4>
          <div class="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-3 text-center flex items-center justify-center gap-2">
            <span class="text-base">🚧</span>
            <span>工事中 — DB接続後に有効化予定</span>
          </div>
        </div>

        <!-- フッター -->
        <div class="px-5 py-3 bg-gray-50 border-t rounded-b-xl flex justify-end">
          <button
            @click="hintModalJournal = null"
            class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1.5 rounded text-xs font-bold transition-colors"
          >
            閉じる
          </button>
        </div>

        <!-- リサイズグリップ -->
        <div
          class="absolute bottom-0 right-0 w-5 h-5 pointer-events-none"
          style="background: linear-gradient(135deg, transparent 50%, rgba(217, 119, 6, 0.4) 50%, rgba(217, 119, 6, 0.6) 100%); border-radius: 0 0 0.75rem 0;"
        ></div>
      </div>
    </Teleport>
  </div>
  <!-- コメントモーダル（Teleportでbody直下に移動） -->
  <Teleport to="body">
    <div
      v-if="commentModalJournalId"
      ref="commentModalRef"
      class="fixed z-[90]"
      :style="{
        left: commentModalPos.left + 'px',
        top: commentModalPos.top + 'px',
        zIndex: commentModalZ,
      }"
      @mouseenter="cancelHoverCloseCommentModal()"
      @mouseleave="scheduleHoverCloseCommentModal()"
    >
      <div
        class="bg-white rounded-lg shadow-2xl border-2 border-blue-300 w-[480px] overflow-auto flex flex-col cursor-move"
        style="resize: both; min-width: 200px; min-height: 150px"
        @click.stop
        @mousedown="modalDrag(startCommentDrag, $event)"
      >
        <!-- ドラッグ可能ヘッダー -->
        <div
          @mousedown="startCommentDrag"
          class="bg-blue-100 px-3 py-2 rounded-t-lg cursor-move flex items-center justify-between select-none"
        >
          <span class="text-xs font-bold text-blue-800">
            <i class="fa-solid fa-comment-dots mr-1"></i>
            コメントを記入 ※移動できます
          </span>
          <button @click="closeCommentModal()" class="text-gray-500 hover:text-red-500 text-sm">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- モーダル本体 -->
        <div class="p-3 max-h-[500px] overflow-y-auto text-xs">
          <!-- ヒントテキスト -->
          <div
            class="text-xs text-gray-500 mb-3 bg-gray-50 rounded px-2 py-1 border border-gray-200"
          >
            <i class="fa-solid fa-circle-info text-blue-400 mr-1"></i>
            ✓を入れるとテキスト入力欄が表示されます
          </div>
          <!-- ◆顧問先に確認 -->
          <div class="font-bold text-gray-800 mb-2 text-[11px]">◆ 顧問先に確認</div>
          <template v-for="noteKey in ['NEED_DOCUMENT', 'NEED_INFO'] as const" :key="noteKey">
            <div class="mb-3 ml-2">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="getStaffNoteEnabled(commentModalJournal!, noteKey)"
                  @change="toggleStaffNoteInModal(noteKey)"
                  class="rounded border-gray-300"
                />
                <i
                  :class="[
                    'fa-solid',
                    staffNoteConfig[noteKey].icon,
                    staffNoteConfig[noteKey].activeColor,
                    'text-[11px]',
                  ]"
                ></i>
                <span class="text-gray-800">{{ staffNoteConfig[noteKey].label }}</span>
              </label>
              <div
                v-if="getStaffNoteEnabled(commentModalJournal!, noteKey)"
                class="ml-5 mt-1 space-y-1"
              >
                <textarea
                  v-model="commentModalJournal!.staff_notes![noteKey].text"
                  class="w-full border border-gray-300 rounded p-1.5 text-[10px] resize-none"
                  rows="2"
                  placeholder="テキストを入力..."
                ></textarea>
                <input
                  v-model="commentModalJournal!.staff_notes![noteKey].chatworkUrl"
                  type="text"
                  class="w-full border border-gray-300 rounded p-1 text-[10px]"
                  placeholder="Chatwork URL（任意）"
                />
              </div>
            </div>
          </template>

          <!-- ◆社内で確認 -->
          <div class="font-bold text-gray-800 mb-2 mt-3 text-[11px]">◆ 社内で確認</div>
          <template v-for="noteKey in ['REMINDER', 'NEED_CONSULT'] as const" :key="noteKey">
            <div class="mb-3 ml-2">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="getStaffNoteEnabled(commentModalJournal!, noteKey)"
                  @change="toggleStaffNoteInModal(noteKey)"
                  class="rounded border-gray-300"
                />
                <i
                  :class="[
                    'fa-solid',
                    staffNoteConfig[noteKey].icon,
                    staffNoteConfig[noteKey].activeColor,
                    'text-[11px]',
                  ]"
                ></i>
                <span class="text-gray-800">{{ staffNoteConfig[noteKey].label }}</span>
              </label>
              <div
                v-if="getStaffNoteEnabled(commentModalJournal!, noteKey)"
                class="ml-5 mt-1 space-y-1"
              >
                <textarea
                  v-model="commentModalJournal!.staff_notes![noteKey].text"
                  class="w-full border border-gray-300 rounded p-1.5 text-[10px] resize-none"
                  rows="2"
                  placeholder="テキストを入力..."
                ></textarea>
                <input
                  v-model="commentModalJournal!.staff_notes![noteKey].chatworkUrl"
                  type="text"
                  class="w-full border border-gray-300 rounded p-1 text-[10px]"
                  placeholder="Chatwork URL（任意）"
                />
              </div>
            </div>
          </template>

          <!-- 担当名 -->
          <div class="border-t border-gray-200 pt-2 mt-2">
            <label class="text-[10px] text-gray-600 font-bold">担当名</label>
            <select
              v-model="commentModalAuthor"
              class="ml-2 border border-gray-300 rounded p-1 text-[10px]"
            >
              <option v-for="staff in staffList" :key="staff" :value="staff">{{ staff }}</option>
            </select>
          </div>
        </div>
      </div>
      <!-- リサイズグリップインジケーター -->
      <div
        class="absolute bottom-0 right-0 w-5 h-5 pointer-events-none"
        style="
          background: linear-gradient(
            135deg,
            transparent 50%,
            rgba(59, 130, 246, 0.5) 50%,
            rgba(59, 130, 246, 0.7) 100%
          );
          border-radius: 0 0 0.5rem 0;
        "
      ></div>
    </div>
  </Teleport>

  <!-- 税区分矛盾モーダル（非ブロッキング: 右上フローティング） -->
  <div
    v-if="showTaxMismatchModal"
    class="fixed inset-0 z-[89]"
    @click="showTaxMismatchModal = false"
  ></div>
  <div
    v-if="showTaxMismatchModal"
    class="fixed top-20 right-4 z-[90] w-80 bg-white rounded-lg shadow-2xl border border-red-200 p-4 text-sm"
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
      <span class="font-bold">{{ activeClientFull?.companyName }}</span>
      （{{
        activeClientFull?.consumptionTaxMode === "exempt"
          ? "免税事業者"
          : activeClientFull?.consumptionTaxMode === "simplified"
            ? "簡易課税"
            : "本則課税"
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

  <!-- 確認ダイアログ（モーダル） -->
  <div
    v-if="confirmDialog.show"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/30"
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
          {{ confirmDialog.confirmLabel || "実行" }}
        </button>
      </div>
    </div>
  </div>
  <!-- グローバルツールチップ（fixed、overflow親を越えて表示） -->
  <Teleport to="body">
    <div
      v-show="tooltipVisible"
      class="fixed z-[9999] pointer-events-none transition-opacity duration-100"
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
      class="fixed z-[9999] pointer-events-none bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap flex items-center gap-1"
      :style="{ left: dragLabelX + 'px', top: dragLabelY + 'px' }"
    >
      📋 コピー: {{ dragLabelText || "--" }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, triggerRef, watch } from "vue";
import { useAccountSettings } from "@/features/account-settings/composables/useAccountSettings";
import { useClients } from "@/features/client-management/composables/useClients";
import { NULL_DISPLAY_UNKNOWN } from "@/shared/field-nullable-spec";
import { useDraggable } from "@/composables/useDraggable";
import { useCurrentUser } from "@/composables/useCurrentUser";
import { journalColumns, getDefaultColumnWidths } from "@/shared/journalColumns";
import { useColumnResize } from "@/composables/useColumnResize";
import { useJournals } from "@/composables/useJournals";
import { useRoute } from "vue-router";
import { getDocumentImageUrl } from "../data/document_mock_data";
import type {
  JournalPhase5Mock,
  JournalEntryLine,
  JournalLabelMock,
} from "../types/journal_phase5_mock.type";
import { createEmptyStaffNotes, STAFF_NOTE_KEYS } from "../types/staff_notes";
import type { StaffNoteKey } from "../types/staff_notes";
import type { ConfirmedJournal } from "../types/confirmed_journal.type";

import { toMfCsvDate } from "@/utils/mf-csv-date";
import { validateByVoucherType, getVoucherTypeConflictAccounts } from "@/utils/journalWarningSync";
// VOUCHER_TYPE_RULES, getBaseAccountId は API側 (journalHintService.ts) に移設済み (Step 6-A3)

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

// ローカル可変データ（useJournals composableで統一管理）
const route = useRoute();
const journalClientId = computed(() => (route.params.clientId as string) || "default");
const { journals: localJournals } = useJournals(journalClientId);

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
const clientSettings = useAccountSettings("client", currentClient.value?.clientId ?? '');

/** 顧問先のtype/hasRentalIncomeでフィルタ済み勘定科目リスト */
const filteredAccounts = computed(() => {
  const client = activeClientFull.value;
  const clientType = client?.type ?? "corp";
  const hasRental = client?.hasRentalIncome ?? false;

  // composableがあればvisibleAccountsを使用（非表示科目除外済み）
  const source = clientSettings.visibleAccounts.value;

  return source
    .filter((acc) => {
      if (acc.deprecated) return false;
      if (acc.target === "both") return true;
      if (acc.target === clientType) {
        if (clientType === "individual" && !hasRental && acc.category.includes("不動産"))
          return false;
        return true;
      }
      return false;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
});

/** ドットパスで生値を取得（税区分名称変換なし）
 * 動的パスアクセスのためkeyof型安全性は保証できない。内部でunknown経由でRecordにキャストする。
 */
function getRawValue(obj: JournalPhase5Mock | CombinedRow, path: string): unknown {
  return path.split(".").reduce((o: unknown, key: string) => (o as Record<string, unknown>)?.[key], obj as unknown);
}

// ────── 区分ドロップダウン（D7a: category-first選択の起点） ──────
// 科目分類定数は shared/data/account-category-rules.ts に統合済み
import {
  SALES_CATEGORIES,
  PURCHASE_CATEGORIES,
  getCategoryDirection,
} from '@/data/master/account-category-rules';
const BS_CATEGORIES = [
  "現金及び預金",
  "売上債権",
  "有価証券",
  "その他流動資産",
  "有形固定資産",
  "無形固定資産",
  "投資その他の資産",
  "買入債務",
  "短期借入金",
  "その他流動負債",
  "長期借入金",
  "その他固定負債",
  "純資産",
];

/** 3大グループ定義 */
const MEGA_GROUPS: { label: string; categories: readonly string[] }[] = [
  { label: "💰 売上", categories: SALES_CATEGORIES },
  { label: "📋 経費・仕入", categories: PURCHASE_CATEGORIES },
  { label: "🏦 資産・負債", categories: BS_CATEGORIES },
];

/** 証票意味選択肢 */
const VOUCHER_TYPES = [
  "売上",
  "経費",
  "給与",
  "立替経費",
  "振替",
  "クレカ",
  "クレカ引落",
  "その他",
];

/**
 * 顧問先の課税方式に基づいて、デフォルト税区分名を変換する。
 * - 免税: すべて「対象外」に強制変換
 * - 本則/簡易: そのまま返す
 */
function resolveDefaultTaxForClient(defaultTaxName: string): string {
  const taxMode = activeClientFull.value?.consumptionTaxMode;
  if (taxMode === "exempt") return "COMMON_EXEMPT";
  return defaultTaxName;
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

  if (taxMode === "exempt") {
    return taxCategoryId !== "COMMON_EXEMPT";
  }
  if (taxMode === "general") {
    // 概念IDで判定: 業種区分付きは _T1〜_T6 で終わる
    return /_T[1-6]$/.test(taxCategoryId);
  }
  return false;
}

// ── 税区分矛盾モーダル ──
const showTaxMismatchModal = ref(false);

/** 矛盾サマリ: { total, items: [{ from, to, count }] } */
const taxMismatchSummary = computed(() => {
  const taxMode = activeClientFull.value?.consumptionTaxMode;
  if (!taxMode) return { total: 0, items: [] as { from: string; to: string; count: number }[] };

  const countMap = new Map<string, number>();
  for (const j of localJournals.value) {
    for (const e of [...j.debit_entries, ...j.credit_entries]) {
      if (isTaxCategoryInvalid(e.tax_category_id)) {
        countMap.set(e.tax_category_id!, (countMap.get(e.tax_category_id!) || 0) + 1);
      }
    }
  }

  const resolveTo = (from: string): string => {
    if (taxMode === "exempt") return "COMMON_EXEMPT";
    if (taxMode === "general") return from.replace(/_T[1-6]$/, "");
    return from;
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
  for (const j of localJournals.value) {
    for (const e of [...j.debit_entries, ...j.credit_entries]) {
      if (e && isTaxCategoryInvalid(e.tax_category_id)) {
        targetJournalIds.add(j.id);
      }
    }
  }
  if (targetJournalIds.size === 0) return;

  // 修正前のスナップショットを保存
  const beforeSnapshots = [...targetJournalIds]
    .map((id) => snapshotJournal(id))
    .filter(Boolean) as UndoSnapshot[];

  // 修正を適用
  for (const j of localJournals.value) {
    if (!targetJournalIds.has(j.id)) continue;
    for (const e of [...j.debit_entries, ...j.credit_entries]) {
      if (!e || !isTaxCategoryInvalid(e.tax_category_id)) continue;
      if (taxMode === "exempt") e.tax_category_id = "COMMON_EXEMPT";
      else if (taxMode === "general")
        e.tax_category_id = (e.tax_category_id ?? "").replace(/_T[1-6]$/, "");
    }
  }

  // 修正後のスナップショットを保存 → pushUndo
  const afterSnapshots = [...targetJournalIds]
    .map((id) => snapshotJournal(id))
    .filter(Boolean) as UndoSnapshot[];
  pushUndo(beforeSnapshots, afterSnapshots);
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
/** 仕訳入力用: 勘定科目をカテゴリでグルーピング */
const accountGroupsForJournal = computed(() => {
  const categoryMap = new Map<string, typeof filteredAccounts.value>();
  for (const acc of filteredAccounts.value) {
    const cat = acc.category;
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(acc);
  }
  const groups: { label: string; items: typeof filteredAccounts.value }[] = [];
  for (const [label, items] of categoryMap) {
    groups.push({ label, items });
  }
  return groups;
});

/** 仕訳入力用: 選択中の勘定科目の区分から方向判定し、税区分をフィルタ+グルーピング */
function getTaxGroupsForEntry(row: CombinedRow, colKey: string) {
  const side = colKey.startsWith("debit") ? "debit" : "credit" as const;
  const entry = row[side];
  const accountName = entry?.account ?? null;

  const settings = clientSettings;

  if (!accountName) {
    // 勘定科目未選択: 全表示税区分をグルーピング
    const visible = settings.visibleTaxCategories.value;
    return [
      { label: "売上系", items: visible.filter((tc) => tc.direction === "sales") },
      { label: "仕入系", items: visible.filter((tc) => tc.direction === "purchase") },
      { label: "共通", items: visible.filter((tc) => tc.direction === "common") },
    ].filter((g) => g.items.length > 0);
  }

  const allAccounts = settings.accounts.value;
  const acc = allAccounts.find((a) => a.id === accountName);
  if (!acc) {
    const visible = settings.visibleTaxCategories.value;
    return [
      { label: "売上系", items: visible.filter((tc) => tc.direction === "sales") },
      { label: "仕入系", items: visible.filter((tc) => tc.direction === "purchase") },
      { label: "共通", items: visible.filter((tc) => tc.direction === "common") },
    ].filter((g) => g.items.length > 0);
  }

  const cat = acc.category;
  const direction = getCategoryDirection(cat);

  const taxMode = activeClientFull.value?.consumptionTaxMode;
  const filtered = settings.filteredTaxCategories(direction, taxMode);
  if (direction === "sales") {
    return [
      { label: "売上系", items: filtered.filter((tc) => tc.direction === "sales") },
      { label: "共通", items: filtered.filter((tc) => tc.direction === "common") },
    ].filter((g) => g.items.length > 0);
  } else if (direction === "purchase") {
    return [
      { label: "仕入系", items: filtered.filter((tc) => tc.direction === "purchase") },
      { label: "共通", items: filtered.filter((tc) => tc.direction === "common") },
    ].filter((g) => g.items.length > 0);
  }
  return [{ label: "共通", items: filtered }].filter((g) => g.items.length > 0);
}

// ────── 検索付きコンボボックス: フィルタ関数 ──────

/** 勘定科目候補をテキストでフィルタ（区分連動廃止） */
function filterAccountGroups(query: string, _row?: CombinedRow, _colKey?: string) {
  const groups = accountGroupsForJournal.value;
  if (!query) return groups;
  const q = query.toLowerCase();
  return groups
    .map((g) => ({ ...g, items: g.items.filter((a) => a.name.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length > 0);
}

/** 3大グループの展開状態管理 */
const expandedMegaGroup = ref<string | null>(null);

/** 3大グループ配下の勘定科目を取得 */
function getAccountsForMegaGroup(megaLabel: string) {
  const mega = MEGA_GROUPS.find((g) => g.label === megaLabel);
  if (!mega) return [];
  return filteredAccounts.value
    .filter((acc) => mega.categories.includes(acc.category))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** 税区分候補をテキストでフィルタ（方向フィルタ済みグループに対してさらに検索） */
function filterTaxGroups(row: CombinedRow, colKey: string, query: string) {
  const groups = getTaxGroupsForEntry(row, colKey);
  if (!query) return groups;
  const q = query.toLowerCase();
  return groups
    .map((g) => ({ ...g, items: g.items.filter((tc) => tc.name.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length > 0);
}

// ────── 貸借科目バリデーション（5分類 + 逆仕訳例外） ──────

type MegaGroupType = "sales" | "expense" | "bs_al" | "bs_equity" | null;

/** 逆仕訳科目: 借方に出ても正当な売上系科目（値引き・返品等） */
const CONTRA_REVENUE_IDS = ["SALES_RETURNS", "SALES_RETURNS_CORP"];
/** 逆仕訳科目: 貸方に出ても正当な経費系科目（値引き・返品等） */
const CONTRA_EXPENSE_IDS = ["PURCHASE_RETURNS", "PURCHASE_RETURNS_CORP"];

/** 勘定科目名から5分類グループを判定（accountGroupベース） */
function getMegaGroup(accountName: string | null): MegaGroupType {
  if (!accountName) return null;
  const allAccounts = clientSettings.accounts.value;
  const acc = allAccounts.find((a) => a.id === accountName);
  if (!acc) return null;
  if (acc.accountGroup === "PL_REVENUE") return "sales";
  if (acc.accountGroup === "PL_EXPENSE") return "expense";
  if (acc.accountGroup === "BS_EQUITY") return "bs_equity";
  if (acc.accountGroup === "BS_ASSET" || acc.accountGroup === "BS_LIABILITY") return "bs_al";
  return null;
}

/** 勘定科目が逆仕訳科目かどうか判定 */
function isContraAccount(accountName: string | null): {
  isContraRevenue: boolean;
  isContraExpense: boolean;
} {
  if (!accountName) return { isContraRevenue: false, isContraExpense: false };
  const allAccounts = clientSettings.accounts.value;
  const acc = allAccounts.find((a) => a.id === accountName);
  if (!acc) return { isContraRevenue: false, isContraExpense: false };
  return {
    isContraRevenue: CONTRA_REVENUE_IDS.includes(acc.id),
    isContraExpense: CONTRA_EXPENSE_IDS.includes(acc.id),
  };
}

/** 5分類グループの表示名 */
function megaGroupLabel(group: MegaGroupType): string {
  switch (group) {
    case "sales":
      return "売上";
    case "expense":
      return "経費・仕入";
    case "bs_al":
      return "資産・負債";
    case "bs_equity":
      return "純資産";
    default:
      return "不明";
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
function validateDebitCreditCombination(
  debitGroup: MegaGroupType,
  creditGroup: MegaGroupType,
  debitAccount?: string | null,
  creditAccount?: string | null,
): string | null {
  if (!debitGroup || !creditGroup) return null;

  // ── 正常パターン ──
  if (debitGroup === "expense" && creditGroup === "bs_al") return null;
  if (debitGroup === "bs_al" && creditGroup === "sales") return null;
  if (debitGroup === "bs_al" && creditGroup === "bs_al") return null;
  if (debitGroup === "expense" && creditGroup === "bs_equity") return null;
  if (debitGroup === "bs_equity" && creditGroup === "bs_al") return null;
  if (debitGroup === "bs_al" && creditGroup === "bs_equity") return null;

  // ── 逆仕訳許容パターン（例外科目チェック） ──
  // 売上 × 資産負債: 売上値引き・返品なら許容
  if (debitGroup === "sales" && creditGroup === "bs_al") {
    const { isContraRevenue } = isContraAccount(debitAccount ?? null);
    if (isContraRevenue) return null;
    return "売上は通常貸方です。返品・値引ですか？";
  }
  // 資産負債 × 経費: 仕入値引き・返品なら許容
  if (debitGroup === "bs_al" && creditGroup === "expense") {
    const { isContraExpense } = isContraAccount(creditAccount ?? null);
    if (isContraExpense) return null;
    return "経費は通常借方です。戻入・返品ですか？";
  }

  // ── 不正パターン ──
  if (debitGroup === "sales" && creditGroup === "sales")
    return "借方・貸方が同じ区分（売上×売上）です";
  if (debitGroup === "expense" && creditGroup === "expense")
    return "借方・貸方が同じ区分（経費×経費）です";
  if (debitGroup === "sales" && creditGroup === "expense")
    return "借方が売上、貸方が経費は通常あり得ません";
  if (debitGroup === "expense" && creditGroup === "sales")
    return "借方が経費、貸方が売上は通常あり得ません";
  // 純資産 × PL系
  if (debitGroup === "bs_equity" && creditGroup === "sales")
    return "純資産×売上の組み合わせは通常あり得ません";
  if (debitGroup === "bs_equity" && creditGroup === "expense")
    return "純資産×経費の組み合わせは通常あり得ません";
  if (debitGroup === "sales" && creditGroup === "bs_equity")
    return "売上×純資産の組み合わせは通常あり得ません";
  if (debitGroup === "expense" && creditGroup === "bs_equity")
    return "経費×純資産の組み合わせは通常あり得ません";
  if (debitGroup === "bs_equity" && creditGroup === "bs_equity")
    return "純資産×純資産の組み合わせは通常あり得ません";

  return null;
}

/** 勘定科目選択後の3大グループバリデーション実行 */
function runAccountValidation(journal: JournalPhase5Mock): void {
  // まず全警告ラベルを同期（CATEGORY_CONFLICT / VOUCHER_TYPE_CONFLICT含む）
  syncWarningLabels(journal);

  // 全借方×全貸方のクロスチェック（複合仕訳対応）
  let warning: string | null = null;
  let debitAccount: string | null = null;
  let creditAccount: string | null = null;
  let debitGroup: MegaGroupType = null;
  let creditGroup: MegaGroupType = null;
  for (const dEntry of journal.debit_entries) {
    for (const cEntry of journal.credit_entries) {
      const dAcct = dEntry.account ?? null;
      const cAcct = cEntry.account ?? null;
      const dGrp = getMegaGroup(dAcct);
      const cGrp = getMegaGroup(cAcct);
      const w = validateDebitCreditCombination(dGrp, cGrp, dAcct, cAcct);
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
    const debitLabel = debitAccount ? `${debitAccount}（${megaGroupLabel(debitGroup)}）` : "未設定";
    const creditLabel = creditAccount
      ? `${creditAccount}（${megaGroupLabel(creditGroup)}）`
      : "未設定";
    confirmDialog.value = {
      show: true,
      title: "⚠ 勘定科目の組み合わせ警告",
      message: `${warning}\n\n借方: ${debitLabel}\n貸方: ${creditLabel}`,
      onConfirm: () => {
        // モーダルを閉じるのみ。CATEGORY_CONFLICTラベルは
        // syncWarningLabelsが科目修正時に自動除去する
      },
      confirmLabel: "確認済み",
      showCancel: false,
    };
    return; // 基本バリデーション警告があれば高度バリデーションはスキップ
  }

  // Step 2: 種別ごと高度バリデーション（voucher_typeベース）→ モーダル表示のみ
  const voucherType = journal.voucher_type;
  if (!voucherType || !debitAccount || !creditAccount) return;

  const accts = clientSettings.accounts.value;
  const voucherWarning = validateByVoucherType(voucherType, journal, accts);
  if (voucherWarning) {
    confirmDialog.value = {
      show: true,
      title: "⚠ 種別チェック警告",
      message: `${voucherWarning}\n\n証票意味: ${voucherType}\n借方: ${debitAccount}\n貸方: ${creditAccount}`,
      onConfirm: () => {
        // モーダルを閉じるのみ。VOUCHER_TYPE_CONFLICTラベルは
        // syncWarningLabelsが科目修正時に自動除去する
      },
      confirmLabel: "確認済み",
      showCancel: false,
    };
  }
}

/** 証票意味矛盾の勘定科目マップ（セルハイライト用） */
const voucherTypeConflictMap = new Map<string, { debit: Set<string>; credit: Set<string> }>();

/**
 * 段階A: 警告列バリデーション（双方向同期）
 * 6条件を判定し、labels[]を自動的に追加/除去する。
 * 新規追加されたラベルがあれば警告モーダルを表示する。
 */
function syncWarningLabels(journal: JournalPhase5Mock, silent = false): void {
  const labels = journal.labels;
  const addedLabels: JournalLabelMock[] = [];
  const removedLabels: JournalLabelMock[] = [];

  // ヘルパー: ラベル追加（重複なし）＋モーダル表示用記録（既存でも記録）
  function addLabel(key: JournalLabelMock) {
    if (!labels.includes(key)) {
      labels.push(key);
    }
    addedLabels.push(key);
  }
  // ヘルパー: ラベル除去（実際に除去した場合にremovedLabelsに記録）
  function removeLabel(key: JournalLabelMock) {
    const idx = labels.indexOf(key);
    if (idx >= 0) {
      labels.splice(idx, 1);
      removedLabels.push(key);
    }
  }

  // 1. ACCOUNT_UNKNOWN（勘定科目不明）: 全エントリのaccountが非null かつ マスタに存在
  const allAccounts = clientSettings.accounts.value;
  const accountIds = new Set(allAccounts.map((a) => a.id));
  const isValidAccount = (id: string | null) => id != null && id !== "" && accountIds.has(id);
  const allAccountsValid =
    journal.debit_entries.every((e) => isValidAccount(e.account)) &&
    journal.credit_entries.every((e) => isValidAccount(e.account));
  if (allAccountsValid) removeLabel("ACCOUNT_UNKNOWN");
  else addLabel("ACCOUNT_UNKNOWN");

  // 2. TAX_UNKNOWN（税区分不明）: 全エントリのtax_category_idが非null かつ マスタ/顧問先設定に存在
  const allTaxCategories = clientSettings.taxCategories.value;
  const taxCategoryIds = new Set(allTaxCategories.map((t) => t.id));
  const isValidTax = (id: string | null | undefined) =>
    id != null && id !== "" && taxCategoryIds.has(id);
  const allTaxValid =
    journal.debit_entries.every((e) => isValidTax(e.tax_category_id)) &&
    journal.credit_entries.every((e) => isValidTax(e.tax_category_id));
  if (allTaxValid) removeLabel("TAX_UNKNOWN");
  else addLabel("TAX_UNKNOWN");

  // 3. DESCRIPTION_UNKNOWN（摘要不明）: descriptionが非null
  if (journal.description != null && journal.description !== "") removeLabel("DESCRIPTION_UNKNOWN");
  else addLabel("DESCRIPTION_UNKNOWN");

  // 4. DATE_UNKNOWN（日付不明）: voucher_dateが非null
  if (journal.voucher_date != null && journal.voucher_date !== "") removeLabel("DATE_UNKNOWN");
  else addLabel("DATE_UNKNOWN");

  // 5. AMOUNT_UNCLEAR（金額不明）: 全エントリのamountが非null
  const allAmountsFilled =
    journal.debit_entries.every((e) => e.amount != null) &&
    journal.credit_entries.every((e) => e.amount != null);
  if (allAmountsFilled) removeLabel("AMOUNT_UNCLEAR");
  else addLabel("AMOUNT_UNCLEAR");

  // 6. DEBIT_CREDIT_MISMATCH（貸借不一致）: 借方合計 = 貸方合計
  const debitSum = journal.debit_entries.reduce((s, e) => s + (e.amount ?? 0), 0);
  const creditSum = journal.credit_entries.reduce((s, e) => s + (e.amount ?? 0), 0);
  if (debitSum === creditSum && debitSum > 0) removeLabel("DEBIT_CREDIT_MISMATCH");
  else addLabel("DEBIT_CREDIT_MISMATCH");

  // 7. CATEGORY_CONFLICT（貸借科目矛盾）: 5分類バリデーション（全借方×全貸方クロスチェック）
  const conflictDebitAccounts = new Set<string>();
  const conflictCreditAccounts = new Set<string>();
  for (const dEntry of journal.debit_entries) {
    for (const cEntry of journal.credit_entries) {
      const dAcct = dEntry.account ?? null;
      const cAcct = cEntry.account ?? null;
      if (
        dAcct &&
        cAcct &&
        validateDebitCreditCombination(getMegaGroup(dAcct), getMegaGroup(cAcct), dAcct, cAcct)
      ) {
        conflictDebitAccounts.add(dAcct);
        conflictCreditAccounts.add(cAcct);
      }
    }
  }
  if (conflictDebitAccounts.size > 0 || conflictCreditAccounts.size > 0) {
    addLabel("CATEGORY_CONFLICT");
    categoryConflictMap.set(journal.id, {
      debit: conflictDebitAccounts,
      credit: conflictCreditAccounts,
    });
  } else {
    removeLabel("CATEGORY_CONFLICT");
    categoryConflictMap.delete(journal.id);
  }

  // 7b. SAME_ACCOUNT_BOTH_SIDES（借方貸方に同一科目）
  const debitAccountSet = new Set(
    journal.debit_entries.map((e) => e.account).filter((v): v is string => v != null),
  );
  const creditAccountSet = new Set(
    journal.credit_entries.map((e) => e.account).filter((v): v is string => v != null),
  );
  const sameAccounts = [...debitAccountSet].filter((a) => creditAccountSet.has(a));
  if (sameAccounts.length > 0) {
    addLabel("SAME_ACCOUNT_BOTH_SIDES");
    sameAccountBothSidesMap.set(journal.id, new Set(sameAccounts));
  } else {
    removeLabel("SAME_ACCOUNT_BOTH_SIDES");
    sameAccountBothSidesMap.delete(journal.id);
  }

  // 8. VOUCHER_TYPE_CONFLICT（証票意味矛盾）: 証票タイプ別バリデーション
  const voucherType = journal.voucher_type;
  if (voucherType && validateByVoucherType(voucherType, journal, allAccounts)) {
    addLabel("VOUCHER_TYPE_CONFLICT");
    // 矛盾科目のマップを更新（セルハイライト用）
    const conflictInfo = getVoucherTypeConflictAccounts(voucherType, journal, allAccounts);
    voucherTypeConflictMap.set(journal.id, conflictInfo);
  } else {
    removeLabel("VOUCHER_TYPE_CONFLICT");
    voucherTypeConflictMap.delete(journal.id);
  }

  // 9. TAX_ACCOUNT_MISMATCH（税区分科目矛盾）: taxDeterminationベースの方向チェック
  const allEntries = [...journal.debit_entries, ...journal.credit_entries];
  let hasTaxAccountMismatch = false;
  const settings = clientSettings;
  const accounts = settings.accounts.value;
  const taxCats = clientSettings.taxCategories.value;
  for (const entry of allEntries) {
    if (!entry.account || !entry.tax_category_id) continue;
    const acct = accounts.find((a) => a.id === entry.account);
    if (!acct) continue;
    const taxCat = taxCats.find((t) => t.id === entry.tax_category_id);
    if (!taxCat) continue;
    if (acct.taxDetermination === "fixed") {
      // 厳密一致: defaultTaxCategoryIdと一致必須
      if (acct.defaultTaxCategoryId) {
        const defaultTax = taxCats.find((t) => t.id === acct.defaultTaxCategoryId);
        if (defaultTax && taxCat.id !== defaultTax.id) {
          hasTaxAccountMismatch = true;
          break;
        }
      }
    } else if (acct.taxDetermination === "auto_purchase") {
      // 方向一致: purchase/commonのみ正常
      if (taxCat.direction === "sales") {
        hasTaxAccountMismatch = true;
        break;
      }
    } else if (acct.taxDetermination === "auto_sales") {
      // 方向一致: sales/commonのみ正常
      if (taxCat.direction === "purchase") {
        hasTaxAccountMismatch = true;
        break;
      }
    }
  }
  if (hasTaxAccountMismatch) {
    addLabel("TAX_ACCOUNT_MISMATCH");
  } else {
    removeLabel("TAX_ACCOUNT_MISMATCH");
  }

  // 10. FUTURE_DATE（未来日付）: voucher_dateが明日以降
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`; // ローカルTZ
  if (journal.voucher_date != null && journal.voucher_date !== "" && journal.voucher_date >= tomorrowStr) {
    addLabel("FUTURE_DATE");
  } else {
    removeLabel("FUTURE_DATE");
  }

  // 新規追加されたラベルがあれば警告モーダルを表示（silentモードでは非表示）
  if (addedLabels.length > 0 && !silent) {
    const warningText = addedLabels.map((l) => warningLabelMap[l]?.label ?? l).join("\n");
    confirmDialog.value = {
      show: true,
      title: "⚠ 警告が検出されました",
      message: `以下の警告が検出されました：\n${warningText}`,
      onConfirm: () => {
        /* 確認済み */
      },
      confirmLabel: "確認",
      showCancel: false,
    };
  } else if (removedLabels.length > 0 && !silent) {
    // 警告が解消された場合のフィードバック
    const resolvedText = removedLabels.map((l) => warningLabelMap[l]?.label ?? l).join("\n");
    confirmDialog.value = {
      show: true,
      title: "✅ 警告が解消されました",
      message: `以下の警告が解消されました：\n${resolvedText}`,
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
  journal: JournalPhase5Mock,
  colKey: string,
  entry?: JournalEntryLine | null,
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
    const acctIdSet = new Set(acctList.map((a) => a.id));
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
    if (!acctName) return '';
    const side = colKey.startsWith("debit") ? "debit" : "credit";
    const conflict = categoryConflictMap.get(journal.id);
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
      const overlap = sameAccountBothSidesMap.get(journal.id);
      if (overlap && overlap.has(acctName)) return "!bg-yellow-300 !text-black";
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
    if (
      colKey.includes("account") &&
      !colKey.includes("sub_account") &&
      entry
    ) {
      const acctName = entry.account;
      if (!acctName) return W; // null科目は無条件で赤背景
      const side = colKey.startsWith("debit") ? "debit" : "credit";
      const vtConflict = voucherTypeConflictMap.get(journal.id);
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
  const fiscalStartStr = `${fiscalStartDate.getFullYear()}-${String(fiscalStartDate.getMonth() + 1).padStart(2, '0')}-${String(fiscalStartDate.getDate()).padStart(2, '0')}`; // ローカルTZ

  // 判定
  if (dateStr < fiscalStartStr) {
    return "text-blue-500"; // 前期以前
  }
  // 当期（fiscalStartStr <= dateStr <= fiscalEndStr）またはそれ以降はデフォルト
  return "";
}

// validateByVoucherType は journalWarningSync.ts からインポート済み

// ────── 検索付きコンボボックス: 選択関数 ──────

function selectAccountItem(
  journal: JournalPhase5Mock,
  row: CombinedRow,
  colKey: string,
  accountId: string,
): void {
  // Undo記録: 変更前スナップショット
  const beforeSnap = snapshotJournal(journal.id);
  const side = colKey.startsWith("debit") ? "debit" : "credit" as const;
  const entry = row[side];
  if (!entry) {
    editingCell.value = null;
    return;
  }

  entry.account = accountId || null;

  if (accountId) {
    const allAccounts = clientSettings.accounts.value;
    const acc = allAccounts.find((a) => a.id === accountId);
    if (acc?.defaultTaxCategoryId) {
      // デフォルト税区分IDを直接セット（免税時はCOMMON_EXEMPTに変換）
      entry.tax_category_id = resolveDefaultTaxForClient(acc.defaultTaxCategoryId);
    }
    if (acc) {
      const sub = clientSettings.subAccounts.value[acc.id];
      entry.sub_account = sub || null;
    }
  } else {
    entry.sub_account = null;
  }

  journal.is_read = true;
  // 操作者追跡
  journal.updated_by = currentStaffId.value ?? null;
  journal.updated_at = new Date().toISOString();
  editingCell.value = null;

  // 勘定科目選択確定後、3大グループバリデーションを実行
  runAccountValidation(journal);
  // Undo記録: 変更後スナップショット
  if (beforeSnap) {
    const afterSnap = snapshotJournal(journal.id);
    if (afterSnap) pushUndo([beforeSnap], [afterSnap]);
  }
}

/** 税区分アイテム選択: 税区分セット + 既読化 + 編集モード解除 */
function selectTaxItem(journal: JournalPhase5Mock, taxId: string): void {
  editingValue.value = taxId;
  commitCellEdit();
  journal.is_read = true;
}

// ────── 検索付きコンボボックス: blur関数 ──────

/** 勘定科目blur: 入力値が有効な科目名なら確定、そうでなければキャンセル */
function blurAccountEdit(
  journal: JournalPhase5Mock,
  row: CombinedRow,
  colKey: string,
): void {
  if (!editingCell.value) return; // selectItemで既に閉じていたら何もしない（DOM削除時のblur再発火防止）
  const val = editingValue.value;
  // 入力値がID一致 or 名前一致する科目を検索
  const matched = filteredAccounts.value.find((a) => a.id === val || a.name === val);
  if (matched) {
    selectAccountItem(journal, row, colKey, matched.id);
    return;
  }
  editingCell.value = null;
}

/** 税区分blur: 入力値が有効な税区分名なら確定、そうでなければキャンセル */
function blurTaxEdit(journal: JournalPhase5Mock): void {
  if (!editingCell.value) return; // selectItemで既に閉じていたら何もしない（DOM削除時のblur再発火防止）
  const val = editingValue.value;
  const settings = clientSettings;
  // 入力値がID一致 or 名前一致する税区分を検索
  const matched = settings.visibleTaxCategories.value.find(
    (tc) => tc.id === val || tc.name === val,
  );
  if (matched) {
    editingValue.value = matched.id; // IDで保存
    commitCellEdit();
    journal.is_read = true;
    return;
  }
  editingCell.value = null;
}

// ────── インライン編集（ダブルクリック） ──────
const editingCell = ref<{ journalId: string; rowIndex: number; colKey: string } | null>(null);
const editingValue = ref<string>("");
const editingOriginalValue = ref<string>("");

// ────── Undo/Redo ──────
interface UndoSnapshot {
  journalId: string;
  json: string;
}
interface UndoEntry {
  before: UndoSnapshot[];
  after: UndoSnapshot[];
}
const undoStack = ref<UndoEntry[]>([]);
const redoStack = ref<UndoEntry[]>([]);
const UNDO_MAX = 50;

function snapshotJournal(journalId: string): UndoSnapshot | null {
  const j = localJournals.value.find((x) => x.id === journalId);
  if (!j) return null;
  return { journalId, json: JSON.stringify(j) };
}

function restoreSnapshot(snap: UndoSnapshot): void {
  const idx = localJournals.value.findIndex((x) => x.id === snap.journalId);
  if (idx < 0) return;
  localJournals.value[idx] = JSON.parse(snap.json) as JournalPhase5Mock;
}

function pushUndo(before: UndoSnapshot[], after: UndoSnapshot[]): void {
  undoStack.value.push({ before, after });
  if (undoStack.value.length > UNDO_MAX) undoStack.value.shift();
  redoStack.value = []; // 新しい操作でredoスタックをクリア
}

function undo(): void {
  const entry = undoStack.value.pop();
  if (!entry) return;
  // 復元前に現在状態をredoスタックに保存
  const currentSnapshots = entry.before
    .map((s) => snapshotJournal(s.journalId))
    .filter(Boolean) as UndoSnapshot[];
  for (const snap of entry.before) restoreSnapshot(snap);
  redoStack.value.push({ before: currentSnapshots, after: entry.before });
}

function redo(): void {
  const entry = redoStack.value.pop();
  if (!entry) return;
  // 復元前に現在状態をundoスタックに保存
  const currentSnapshots = entry.before
    .map((s) => snapshotJournal(s.journalId))
    .filter(Boolean) as UndoSnapshot[];
  for (const snap of entry.before) restoreSnapshot(snap);
  undoStack.value.push({ before: currentSnapshots, after: entry.before });
}

function isEditing(journalId: string, rowIndex: number, colKey: string): boolean {
  const e = editingCell.value;
  return e !== null && e.journalId === journalId && e.rowIndex === rowIndex && e.colKey === colKey;
}

function startCellEdit(
  journalId: string,
  rowIndex: number,
  colKey: string,
  currentValue: unknown,
): void {
  editingCell.value = { journalId, rowIndex, colKey };
  let val = currentValue != null ? String(currentValue) : "";
  // 勘定科目列の場合: IDを日本語名に変換して検索欄に表示
  if (colKey.endsWith(".account") && val) {
    const allAccts = clientSettings.accounts.value;
    const acc = allAccts.find((a) => a.id === val);
    if (acc) val = acc.name;
  }
  editingValue.value = val;
  editingOriginalValue.value = val;
  nextTick(() => {
    const el = document.querySelector(".inline-edit-input") as
      | HTMLInputElement
      | HTMLSelectElement
      | null;
    if (el) {
      el.focus();
      if ("select" in el) el.select();
    }
  });
}

function commitCellEdit(): void {
  const e = editingCell.value;
  if (!e) return;
  const journal = paginatedJournals.value.find((j) => j.id === e.journalId);
  if (!journal) {
    editingCell.value = null;
    return;
  }

  const val = editingValue.value;

  // Undo記録: 変更前スナップショット
  const beforeSnap = snapshotJournal(journal.id);

  // 適格列の特殊処理
  if (e.colKey === "invoice") {
    const labels = journal.labels;
    const idx1 = labels.indexOf("INVOICE_QUALIFIED");
    const idx2 = labels.indexOf("INVOICE_NOT_QUALIFIED");
    if (idx1 >= 0) labels.splice(idx1, 1);
    if (idx2 >= 0) labels.splice(idx2, 1);
    if (val === "◯") labels.push("INVOICE_QUALIFIED");
    else if (val === "✕") labels.push("INVOICE_NOT_QUALIFIED");
    journal.is_read = true;
    editingCell.value = null;
    return;
  }

  // journal-level（keyにドットなし）
  if (!e.colKey.includes(".")) {
    if (e.colKey === "voucher_date") {
      journal.voucher_date = parseDateInput(val);
    } else if (e.colKey === "description") {
      journal.description = val;
    }
  } else {
    // entry-level（debit.amount → row.debit.amount）
    const rows = getCombinedRows(journal);
    const row = rows[e.rowIndex];
    if (row) {
      const parts = e.colKey.split(".");
      const side = parts[0] as "debit" | "credit";
      const field = parts[1];
      if (side && field) {
        const entry = row[side];
        if (entry) {
          setEntryField(entry, field, val);
        }
      }
    }
  }
  journal.is_read = true;
  // 操作者追跡: 仕訳編集時にupdated_by/updated_atを記録
  journal.updated_by = currentStaffId.value ?? null;
  journal.updated_at = new Date().toISOString();
  editingCell.value = null;
  // 変更4: セル編集確定時に警告列バリデーション（段階A: 双方向同期）を実行
  syncWarningLabels(journal);
  // Undo記録: 変更後スナップショット
  if (beforeSnap) {
    const afterSnap = snapshotJournal(journal.id);
    if (afterSnap) pushUndo([beforeSnap], [afterSnap]);
  }
}

function cancelCellEdit(): void {
  editingCell.value = null;
}

/** 金額入力: 半角数字以外を除去 */
function onAmountInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  input.value = input.value.replace(/[^0-9]/g, "");
  editingValue.value = input.value;
}

/** 日付入力: YYYYMMDD → YYYY-MM-DD変換 */
function parseDateInput(val: string): string {
  // 既にYYYY-MM-DD形式ならそのまま
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  // YYYYMMDD形式
  const digits = val.replace(/[^0-9]/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  return val;
}

// ────── フィルハンドル連続コピー ──────
const FILL_HANDLE_COLS = new Set([
  "voucher_date",
  "description",
  "debit.account",
  "debit.sub_account",
  "debit.tax_category_id",
  "credit.account",
  "credit.sub_account",
  "credit.tax_category_id",
]);
function isFillable(colKey: string): boolean {
  return FILL_HANDLE_COLS.has(colKey);
}

/** 複合仕訳判定（1対N or N対N） — フィルハンドル無効化に使用 */
function isCompoundJournal(journal: JournalPhase5Mock): boolean {
  return journal.debit_entries.length > 1 || journal.credit_entries.length > 1;
}

/** エントリが存在するか判定（複合仕訳の空セル無反応化に使用） */
function hasEntry(
  row: { debit: JournalEntryLine | null; credit: JournalEntryLine | null },
  colKey: string,
): boolean {
  if (!colKey.includes(".")) return true; // journal-levelは常にtrue
  const side = colKey.startsWith("debit") ? "debit" : "credit";
  return row[side] != null;
}

/** CATEGORY_CONFLICT: 問題のあるエントリ科目名を記録 */
const categoryConflictMap = new Map<string, { debit: Set<string>; credit: Set<string> }>();
/** SAME_ACCOUNT_BOTH_SIDES: 借方貸方の両方に存在する科目名を記録 */
const sameAccountBothSidesMap = new Map<string, Set<string>>();

const fillHandle = ref<{
  colKey: string;
  sourceJournalIndex: number;
  sourceValue: unknown;
  targetJournalIndices: number[];
} | null>(null);

function startFillDrag(
  journalIndex: number,
  colKey: string,
  value: unknown,
  event: MouseEvent,
): void {
  event.preventDefault();
  fillHandle.value = {
    colKey,
    sourceJournalIndex: journalIndex,
    sourceValue: value,
    targetJournalIndices: [],
  };
}

function onFillMove(event: MouseEvent): void {
  if (!fillHandle.value) return;
  // マウス位置から対象行を特定
  const el = document.elementFromPoint(event.clientX, event.clientY);
  if (!el) return;
  // data-journal-index属性を持つ祖先を探す
  const rowEl = (el as HTMLElement).closest("[data-journal-index]") as HTMLElement | null;
  if (!rowEl) return;
  const idx = parseInt(rowEl.dataset.journalIndex ?? "", 10);
  if (isNaN(idx)) return;
  const src = fillHandle.value.sourceJournalIndex;
  if (idx === src) {
    // ソース行自身は対象外
    fillHandle.value = { ...fillHandle.value, targetJournalIndices: [] };
    return;
  }
  // 上方向・下方向両対応
  const start = Math.min(src, idx);
  const end = Math.max(src, idx);
  const indices: number[] = [];
  for (let i = start; i <= end; i++) {
    if (i === src) continue; // ソース行はスキップ
    const j = paginatedJournals.value[i];
    if (j && j.status !== "exported" && j.deleted_at === null && !isCompoundJournal(j)) {
      indices.push(i);
    }
  }
  // オブジェクト再代入でリアクティビティ確保
  fillHandle.value = { ...fillHandle.value, targetJournalIndices: indices };
}

function endFillDrag(): void {
  if (!fillHandle.value) return;
  const { colKey, sourceValue, targetJournalIndices } = fillHandle.value;
  // Undo記録: 変更前スナップショット（全対象ジャーナル）
  const beforeSnaps = targetJournalIndices
    .map((idx) => paginatedJournals.value[idx])
    .filter((x): x is JournalPhase5Mock => !!x)
    .map((j) => snapshotJournal(j.id))
    .filter(Boolean) as UndoSnapshot[];
  for (const idx of targetJournalIndices) {
    const journal = paginatedJournals.value[idx];
    if (!journal) continue;
    applyFillValue(journal, colKey, sourceValue);
    syncWarningLabels(journal);
  }
  // Undo記録: 変更後スナップショット
  if (beforeSnaps.length > 0) {
    const afterSnaps = beforeSnaps
      .map((s) => snapshotJournal(s.journalId))
      .filter(Boolean) as UndoSnapshot[];
    pushUndo(beforeSnaps, afterSnaps);
  }
  fillHandle.value = null;
}

function applyFillValue(journal: JournalPhase5Mock, colKey: string, value: unknown, targetRowIndex?: number): void {
  if (!colKey.includes(".")) {
    if (colKey === "voucher_date") {
      journal.voucher_date = value as string | null;
    } else if (colKey === "description") {
      journal.description = value as string;
    }
  } else {
    const parts = colKey.split(".");
    const side = parts[0] as "debit" | "credit";
    const field = parts[1];
    if (!side || !field) return;

    // 複合仕訳対応: targetRowIndex指定時はその行のみ、未指定時は全エントリ
    const entries = side === "debit" ? journal.debit_entries : journal.credit_entries;
    const targetEntries = (targetRowIndex != null && targetRowIndex < entries.length
      ? [entries[targetRowIndex]]
      : entries).filter((e): e is NonNullable<typeof e> => e != null);
    for (const entry of targetEntries) {
      if (colKey.endsWith(".account")) {
        // 勘定科目フィル時に税区分・区分・補助科目も連動（selectAccountItemと同じ挙動）
        entry.account = (value as string) || null;
        const accountId = value as string;
        if (accountId) {
          const allAccts = clientSettings.accounts.value;
          const acc = allAccts.find((a) => a.id === accountId);
          // デフォルト税区分の自動設定
          if (acc?.defaultTaxCategoryId) {
            entry.tax_category_id = resolveDefaultTaxForClient(acc.defaultTaxCategoryId);
          }
          // 補助科目連動
          if (acc) {
            const sub = clientSettings.subAccounts.value[acc.id];
            entry.sub_account = sub || null;
          }
        } else {
          entry.sub_account = null;
        }
      } else {
        setEntryField(entry, field, value);
      }
    }
  }
}

function isFillTargetCell(journalIndex: number, colKey: string): boolean {
  if (!fillHandle.value) return false;
  return (
    fillHandle.value.targetJournalIndices.includes(journalIndex) &&
    fillHandle.value.colKey === colKey
  );
}

// ────── セル間ドラッグ&ドロップ（長押し150ms方式） ──────
const DRAG_HOLD_MS = 150; // 長押し判定ミリ秒

const cellDrag = ref<{
  sourceColKey: string;
  sourceValue: unknown;
  sourceLabel: string; // フローティングラベル用の表示テキスト
  startX: number;
  startY: number;
  dragReady: boolean; // 長押し完了でtrue
  dragging: boolean; // 5px以上動いたらtrue
  dropJournalIndex: number | null;
  dropRowIndex: number | null;
  dropColKey: string | null;
} | null>(null);

let dragTimerId: ReturnType<typeof setTimeout> | null = null;

// フローティングラベル（ドラッグ中のコピー値表示）
const dragLabelVisible = ref(false);
const dragLabelText = ref("");
const dragLabelX = ref(0);
const dragLabelY = ref(0);

function startCellDrag(colKey: string, value: unknown, event: MouseEvent): void {
  // 編集中は無視
  if (editingCell.value) return;
  const x = event.clientX;
  const y = event.clientY;
  const label = value != null ? String(value) : "";
  // 前回のタイマーをクリア
  cancelDragTimer();
  // 150ms長押しタイマー開始
  dragTimerId = setTimeout(() => {
    cellDrag.value = {
      sourceColKey: colKey,
      sourceValue: value,
      sourceLabel: label,
      startX: x,
      startY: y,
      dragReady: true,
      dragging: false,
      dropJournalIndex: null,
      dropRowIndex: null,
      dropColKey: null,
    };
    document.body.classList.add("cell-drag-ready");
  }, DRAG_HOLD_MS);
}

function cancelDragTimer(): void {
  if (dragTimerId !== null) {
    clearTimeout(dragTimerId);
    dragTimerId = null;
  }
}

function onCellDragMove(event: MouseEvent): void {
  if (!cellDrag.value || !cellDrag.value.dragReady) return;
  // 5px以上動いたらドラッグモード開始
  if (!cellDrag.value.dragging) {
    const dx = event.clientX - cellDrag.value.startX;
    const dy = event.clientY - cellDrag.value.startY;
    if (Math.sqrt(dx * dx + dy * dy) < 5) return;
    cellDrag.value = { ...cellDrag.value, dragging: true };
    document.body.classList.remove("cell-drag-ready");
    document.body.classList.add("cell-dragging");
  }
  // フローティングラベル表示（マウス付近）
  dragLabelText.value = cellDrag.value.sourceLabel;
  dragLabelX.value = event.clientX + 14;
  dragLabelY.value = event.clientY - 10;
  dragLabelVisible.value = true;
  // ドロップ先セルを特定
  const el = document.elementFromPoint(event.clientX, event.clientY);
  if (!el) return;
  const cellEl = (el as HTMLElement).closest("[data-drag-col]") as HTMLElement | null;
  const rowEl = (el as HTMLElement).closest("[data-journal-index]") as HTMLElement | null;
  if (cellEl && rowEl) {
    const ji = parseInt(rowEl.dataset.journalIndex ?? "", 10);
    const ri = parseInt(cellEl.dataset.dragRow ?? "0", 10);
    const ck = cellEl.dataset.dragCol ?? "";
    cellDrag.value = {
      ...cellDrag.value,
      dropJournalIndex: ji,
      dropRowIndex: ri,
      dropColKey: ck,
    };
  } else {
    cellDrag.value = {
      ...cellDrag.value,
      dropJournalIndex: null,
      dropRowIndex: null,
      dropColKey: null,
    };
  }
}

/** D&D列一致判定（借方↔貸方の同フィールドも許可） */
function isDragColCompatible(sourceColKey: string, dropColKey: string): boolean {
  if (sourceColKey === dropColKey) return true;
  // 例: debit.account（借方勘定科目）→ credit.account（貸方勘定科目）を許可
  const srcField = sourceColKey.includes(".") ? sourceColKey.split(".")[1] : sourceColKey;
  const dstField = dropColKey.includes(".") ? dropColKey.split(".")[1] : dropColKey;
  return srcField === dstField;
}

function endCellDrag(): void {
  cancelDragTimer();
  if (!cellDrag.value) return;
  if (
    cellDrag.value.dragging &&
    cellDrag.value.dropJournalIndex !== null &&
    cellDrag.value.dropColKey &&
    isDragColCompatible(cellDrag.value.sourceColKey, cellDrag.value.dropColKey)
  ) {
    const journal = paginatedJournals.value[cellDrag.value.dropJournalIndex];
    if (journal && journal.status !== "exported" && journal.deleted_at === null) {
      // Undo記録: 変更前スナップショット
      const beforeSnap = snapshotJournal(journal.id);
      applyFillValue(journal, cellDrag.value.dropColKey, cellDrag.value.sourceValue, cellDrag.value.dropRowIndex ?? undefined);
      syncWarningLabels(journal);
      // Undo記録: 変更後スナップショット
      if (beforeSnap) {
        const afterSnap = snapshotJournal(journal.id);
        if (afterSnap) pushUndo([beforeSnap], [afterSnap]);
      }
    }
  }
  document.body.classList.remove("cell-drag-ready", "cell-dragging");
  cellDrag.value = null;
  dragLabelVisible.value = false;
}

/** ドロップ先ホバー判定（特定セルのみ） */
function isDragOver(journalIndex: number, rowIndex: number, colKey: string): boolean {
  if (!cellDrag.value || !cellDrag.value.dragging) return false;
  return (
    cellDrag.value.dropJournalIndex === journalIndex &&
    cellDrag.value.dropRowIndex === rowIndex &&
    cellDrag.value.dropColKey === colKey
  );
}

/** ドラッグ中にドロップ可能列か判定（同フィールド全セル青背景用） */
function isDragCompatibleCol(colKey: string): boolean {
  if (!cellDrag.value || !cellDrag.value.dragging) return false;
  return isDragColCompatible(cellDrag.value.sourceColKey, colKey);
}

/** ドラッグ中にドロップ不可列か判定（グレーアウト用） */
function isDragIncompatibleCol(colKey: string): boolean {
  if (!cellDrag.value || !cellDrag.value.dragging) return false;
  return !isDragColCompatible(cellDrag.value.sourceColKey, colKey);
}

// グローバルイベント登録（フィルハンドル + ドラッグ&ドロップ統合）
function onGlobalMouseMove(event: MouseEvent) {
  onFillMove(event);
  onCellDragMove(event);
}
function onGlobalMouseUp() {
  endFillDrag();
  endCellDrag();
}
onMounted(() => {
  document.addEventListener("mousemove", onGlobalMouseMove);
  document.addEventListener("mouseup", onGlobalMouseUp);
  // 初回ロード時: 全仕訳に対して警告ラベルを同期（モーダルなし）
  localJournals.value.forEach((j) => syncWarningLabels(j, true));
});
onUnmounted(() => {
  document.removeEventListener("mousemove", onGlobalMouseMove);
  document.removeEventListener("mouseup", onGlobalMouseUp);
});

// フィルタリング状態（チェックボックス）
const showUnexported = ref<boolean>(true); // 未出力を表示（初期: ON）
const showExported = ref<boolean>(false); // 出力済を表示（初期: OFF）
const showExcluded = ref<boolean>(false); // 出力対象外を表示（初期: OFF）
const showTrashed = ref<boolean>(false); // ゴミ箱を表示（初期: OFF）
const showPastCsv = ref<boolean>(false); // 過去仕訳CSVを表示（初期: OFF）
const globalSearchQuery = ref<string>(''); // 全列横断検索クエリ

// 証票種別フィルタ（空文字 = 全て）
const voucherFilter = ref<string>("");
const voucherFilterOptions = [
  { key: "", label: "全て" },
  { key: "RECEIPT", label: "領収書" },
  { key: "INVOICE", label: "請求書" },
  { key: "BANK_STATEMENT", label: "通帳" },
  { key: "CREDIT_CARD", label: "クレカ" },
  { key: "TRANSPORT", label: "交通費" },
  { key: "MEDICAL", label: "医療費" },
] as const;

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
  { short: "レ", label: "レシート・領収証", bgClass: "bg-emerald-600" },
  { short: "請", label: "請求書", bgClass: "bg-blue-600" },
  { short: "交", label: "交通費", bgClass: "bg-cyan-600" },
  { short: "ク", label: "クレジットカード", bgClass: "bg-purple-600" },
  { short: "銀", label: "銀行明細", bgClass: "bg-indigo-600" },
  { short: "医", label: "医療費", bgClass: "bg-pink-600" },
  { short: "外", label: "仕訳対象外", bgClass: "bg-gray-600" },
];

// ボディ用: ラベル名→バッジ情報マッピング
const labelKeyMap: Record<string, { short: string; label: string; bgClass: string }> = {
  RECEIPT: { short: "レ", label: "レシート・領収証", bgClass: "bg-emerald-600" },
  INVOICE: { short: "請", label: "請求書", bgClass: "bg-blue-600" },
  TRANSPORT: { short: "交", label: "交通費", bgClass: "bg-cyan-600" },
  CREDIT_CARD: { short: "ク", label: "クレジットカード", bgClass: "bg-purple-600" },
  BANK_STATEMENT: { short: "銀", label: "銀行明細", bgClass: "bg-indigo-600" },
  MEDICAL: { short: "医", label: "医療費", bgClass: "bg-pink-600" },
  NOT_JOURNAL: { short: "外", label: "仕訳対象外", bgClass: "bg-gray-600" },
};

// 警告ラベルマップ: Single Source of Truth
// 統合版: MISSING_FIELD/UNREADABLE_FAILED/TAX_CALCULATION_ERROR を削除し、フィールド別ラベルに分離
// level: 'error'(赤) | 'warn'(黄) / label: 日本語定義（ホバーメッセージ） / color: アイコン色 / weight: ソート優先度
const warningLabelMap: Record<
  string,
  { level: "error" | "warn"; label: string; color: string; weight: number }
> = {
  // エラー（赤）
  DEBIT_CREDIT_MISMATCH: {
    level: "error",
    label: "借方貸方の合計額不一致",
    color: "text-red-600",
    weight: 17,
  },
  DATE_UNKNOWN: { level: "error", label: "日付が不明", color: "text-red-600", weight: 16 },
  ACCOUNT_UNKNOWN: { level: "error", label: "勘定科目が不明", color: "text-red-600", weight: 15 },
  TAX_UNKNOWN: { level: "error", label: "税区分が不明", color: "text-red-600", weight: 14.5 },
  DUPLICATE_CONFIRMED: {
    level: "error",
    label: "完全重複（同一画像）",
    color: "text-red-600",
    weight: 13,
  },
  MULTIPLE_VOUCHERS: { level: "error", label: "複数の証票あり", color: "text-red-600", weight: 12 },
  AMOUNT_UNCLEAR: { level: "error", label: "金額が不明", color: "text-red-600", weight: 14 },
  // 注意（黄）
  CATEGORY_CONFLICT: {
    level: "warn",
    label: "借方/貸方の区分が矛盾",
    color: "text-yellow-600",
    weight: 7,
  },
  VOUCHER_TYPE_CONFLICT: {
    level: "warn",
    label: "証票意味と科目が不整合",
    color: "text-yellow-600",
    weight: 6.5,
  },
  TAX_ACCOUNT_MISMATCH: {
    level: "warn",
    label: "税区分と勘定科目が矛盾",
    color: "text-yellow-600",
    weight: 7.5,
  },
  DUPLICATE_SUSPECT: { level: "warn", label: "重複疑い", color: "text-yellow-600", weight: 6 },
  FUTURE_DATE: { level: "error", label: "未来日付", color: "text-red-600", weight: 9 },
  UNREADABLE_ESTIMATED: {
    level: "warn",
    label: "判読困難（AI推測値）",
    color: "text-yellow-600",
    weight: 4,
  },
  MEMO_DETECTED: { level: "warn", label: "手書きメモ検出", color: "text-yellow-600", weight: 3 },
  DESCRIPTION_UNKNOWN: { level: "warn", label: "摘要が不明", color: "text-yellow-600", weight: 2 },
  SAME_ACCOUNT_BOTH_SIDES: {
    level: "warn",
    label: "同一科目が借方/貸方の両方に存在",
    color: "text-yellow-600",
    weight: 6.7,
  },
};

// ======== グローバルツールチップ（position:fixed、overflow親を越えて表示） ========
const tooltipVisible = ref(false);
const tooltipText = ref("");
const tooltipHtml = ref("");
const tooltipX = ref(0);
const tooltipY = ref(0);

function showTooltip(event: MouseEvent, text: string) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  tooltipText.value = text;
  tooltipHtml.value = "";
  tooltipX.value = rect.left + rect.width / 2;
  tooltipY.value = rect.bottom + 6;
  tooltipVisible.value = true;
}

function showWarningTooltip(event: MouseEvent, labels: string[], journal?: JournalPhase5Mock) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const warnings = labels.filter((l) => warningLabelMap[l]);
  tooltipHtml.value = warnings
    .map((l) => {
      const w = warningLabelMap[l];
      const dotColor = w?.level === "error" ? "bg-red-400" : "bg-yellow-400";
      // D4: on_document（項目存在フラグ）によるホバーメッセージ分岐
      let msg = w?.label ?? l;
      if (journal) {
        // warning_detailsに具体的な理由がある場合はそちらを優先
        const details = journal.warning_details;
        if (details && details[l]) {
          msg = details[l];
        } else if (l === "DATE_UNKNOWN") {
          msg = journal.date_on_document
            ? "日付の読み取りに失敗しました"
            : "証憑に日付の記載がありません";
        } else if (l === "ACCOUNT_UNKNOWN") {
          const onDoc =
            journal.debit_entries[0]?.account_on_document ??
            journal.credit_entries[0]?.account_on_document ??
            false;
          msg = onDoc ? "勘定科目の読み取りに失敗しました" : "証憑に勘定科目の記載がありません";
        } else if (l === "AMOUNT_UNCLEAR") {
          const onDoc =
            journal.debit_entries[0]?.amount_on_document ??
            journal.credit_entries[0]?.amount_on_document ??
            false;
          msg = onDoc ? "金額の読み取りに失敗しました" : "証憑に金額の記載がありません";
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
function openWarningConfirmModal(journal: JournalPhase5Mock) {
  const warningKeys = Object.keys(warningLabelMap);
  const warnings = journal.labels.filter((l) => warningKeys.includes(l));
  if (warnings.length === 0) return;
  hideTooltip();
  const warningText = warnings.map((l) => warningLabelMap[l]?.label ?? l).join("\n");
  confirmDialog.value = {
    show: true,
    title: "警告確認",
    message: `以下の警告があります:\n${warningText}\n\n確認済みとして警告を解除し、出力対象にしますか？`,
    onConfirm: () => {
      // warning_dismissalsに追加（syncWarningLabelsCore再実行時もスキップされる）
      if (!journal.warning_dismissals) journal.warning_dismissals = [];
      for (const w of warnings) {
        if (!journal.warning_dismissals.includes(w)) {
          journal.warning_dismissals.push(w);
        }
      }
      // labelsから警告ラベルとEXPORT_EXCLUDEを除去
      journal.labels = journal.labels.filter(
        (l) => !warningKeys.includes(l) && l !== "EXPORT_EXCLUDE",
      );
    },
  };
}

// ポップオーバー凡例: warningLabelMapから動的生成
const errorLegend = Object.entries(warningLabelMap).filter(([, v]) => v.level === "error");
const warnLegend = Object.entries(warningLabelMap).filter(([, v]) => v.level === "warn");



// ────── ヒントモーダル ──────
type HintValidation = { level: 'error' | 'warn'; message: string };
type HintAlternative = { value: string; label: string };
type HintSuggestion = {
  side: 'debit' | 'credit';
  field: string;
  currentValue: string | null;
  currentLabel: string;
  selectedValue: string;
  selectedLabel: string;
  alternatives: HintAlternative[];  // ドロップダウン全候補（勘定科目のみ）
  entryIndex: number;
};

const hintModalJournal = ref<JournalPhase5Mock | null>(null);
const hintValidations = ref<HintValidation[]>([]);
const hintSuggestions = ref<HintSuggestion[]>([]);
const hintLoading = ref(false);

const hintModalJournalIndex = computed(() => {
  if (!hintModalJournal.value) return -1;
  return paginatedJournals.value.findIndex((j) => j.id === hintModalJournal.value!.id);
});

/** ヒントAPIを呼び出してvalidations/suggestionsを更新 */
async function fetchHintsFromAPI(journalId: string): Promise<void> {
  hintLoading.value = true;
  try {
    // Phase 2: サーバー側マスタから科目・税区分を取得するため、POSTボディ不要
    const res = await fetch(
      `/api/journals/${encodeURIComponent(journalClientId.value)}/${encodeURIComponent(journalId)}/hints`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
    );
    if (res.ok) {
      const data = await res.json();
      hintValidations.value = data.validations;
      hintSuggestions.value = data.suggestions;
    } else {
      console.warn('[Hint API] レスポンスエラー:', res.status);
    }
  } catch (err) {
    console.error('[Hint API] 通信エラー:', err);
  } finally {
    hintLoading.value = false;
  }
}

async function openHintModal(journal: JournalPhase5Mock): Promise<void> {
  hintModalJournal.value = journal;
  // 画面中央に配置（モーダル幅520px, 想定高さ500px）
  hintModalPos.value = {
    top: Math.max(50, (window.innerHeight - 500) / 2),
    left: Math.max(50, (window.innerWidth - 520) / 2),
  };
  await fetchHintsFromAPI(journal.id);
}

// generateHintValidations / generateHintSuggestions は
// API側 (api/services/journalHintService.ts) に移設済み。
// Phase 1 Step 6-A3 (2026-05-03)
// フロントからは fetchHintsFromAPI() 経由で呼び出す。

// ★ ドロップダウン変更時のハンドラ
function onHintAlternativeChange(suggestionIndex: number, newValue: string): void {
  const s = hintSuggestions.value[suggestionIndex];
  if (!s) return;
  const alt = s.alternatives.find((a) => a.value === newValue);
  if (alt) {
    s.selectedValue = newValue;
    s.selectedLabel = alt.label;
  }
}

function applyHintSuggestion(s: HintSuggestion): void {
  const journal = hintModalJournal.value;
  if (!journal) return;

  const beforeSnap = snapshotJournal(journal.id);

  const entries = s.side === 'debit' ? journal.debit_entries : journal.credit_entries;

  if (s.field === '勘定科目') {
    const entry = entries[s.entryIndex];
    if (!entry) return;
    entry.account = s.selectedValue;
    // 科目に連動して税区分・補助科目を自動補完
    const allAccts = clientSettings.accounts.value;
    const acctObj = allAccts.find((a) => a.id === s.selectedValue);
    if (acctObj) {
      if (acctObj.defaultTaxCategoryId) entry.tax_category_id = acctObj.defaultTaxCategoryId;
      // 補助科目: selectAccountItemと同じくclientSettings.subAccountsから取得
      const sub = clientSettings.subAccounts.value[s.selectedValue];
      entry.sub_account = sub || null;
    }
  } else if (s.field === '税区分') {
    const entry = entries[s.entryIndex];
    if (!entry) return;
    entry.tax_category_id = s.selectedValue;
  } else if (s.field === '金額') {
    const entry = entries[s.entryIndex];
    if (!entry) return;
    entry.amount = Number(s.selectedValue);
  } else if (s.field === '金額（差額）') {
    console.log('[Hint] N:N差額は自動修正不可 → 手動修正してください');
    return;
  }

  journal.is_read = true;
  syncWarningLabels(journal);

  const afterSnap = snapshotJournal(journal.id);
  if (beforeSnap && afterSnap) {
    undoStack.value.push({ before: [beforeSnap], after: [afterSnap] });
    redoStack.value = [];
  }

  // ヒントをAPI経由で再計算（Phase 1 Step 6-A3）
  fetchHintsFromAPI(journal.id);

  console.log(`[Hint] 修正適用: ${s.side} [${s.entryIndex}] ${s.field}: ${s.currentLabel} → ${s.selectedLabel}`);
}

function closeDropdown() {
  openDropdownId.value = null;
}

// ────── ワークフローハブ操作（レベル②ローカル状態変更） ──────

function setReadStatus(journal: JournalPhase5Mock, value: boolean) {
  const target = localJournals.value.find((j) => j.id === journal.id);
  if (!target || target.is_read === value) return; // 同じ状態なら何もしない
  closeDropdown();
  confirmDialog.value = {
    show: true,
    title: value ? "既読にする" : "未読にする",
    message: `「${journal.description}」を${value ? "既読" : "未読"}にしますか？`,
    onConfirm: () => {
      target.is_read = value;
      if (value) {
        target.read_by = currentStaffId.value ?? null;
        target.read_at = new Date().toISOString();
      }
      console.log(`[DD] 既読変更: ${journal.id} → is_read=${value} by ${currentStaffId.value}`);
      confirmDialog.value = {
        show: true,
        title: "完了",
        message: `${value ? "既読" : "未読"}にしました。`,
        onConfirm: () => {},
      };
    },
  };
}

function setExportExclude(journal: JournalPhase5Mock, exclude: boolean) {
  const target = localJournals.value.find((j) => j.id === journal.id);
  if (!target) return;
  const hasLabel = target.labels.includes("EXPORT_EXCLUDE");
  if (exclude === hasLabel) return; // 同じ状態なら何もしない
  closeDropdown();
  confirmDialog.value = {
    show: true,
    title: exclude ? "出力対象外にする" : "出力対象にする",
    message: `「${journal.description}」を${exclude ? "出力対象外" : "出力対象"}にしますか？`,
    onConfirm: () => {
      if (exclude) {
        target.labels.push("EXPORT_EXCLUDE");
        console.log(`[DD] 出力対象外に変更: ${journal.id}`);
      } else {
        const idx = target.labels.indexOf("EXPORT_EXCLUDE");
        if (idx >= 0) target.labels.splice(idx, 1);
        console.log(`[DD] 出力対象に変更: ${journal.id}`);
      }
      confirmDialog.value = {
        show: true,
        title: "完了",
        message: `${exclude ? "出力対象外" : "出力対象"}にしました。`,
        onConfirm: () => {},
      };
    },
  };
}

function copyJournal(journal: JournalPhase5Mock, _index: number) {
  closeDropdown();
  confirmDialog.value = {
    show: true,
    title: "コピー",
    message: `「${journal.description}」を未出力にコピーしますか？`,
    onConfirm: () => {
      const clone: JournalPhase5Mock = JSON.parse(JSON.stringify(journal));
      clone.id = `copy-${Date.now()}`;
      clone.display_order = journal.display_order + 0.5;
      clone.description = `★コピー ${journal.description}`;
      clone.is_read = false;
      clone.status = null;
      clone.labels = [];
      clone.memo = null;
      clone.memo_author = null;
      clone.memo_target = null;
      clone.memo_created_at = null;
      clone.deleted_at = null;
      const originalIndex = localJournals.value.findIndex((j) => j.id === journal.id);
      if (originalIndex >= 0) {
        localJournals.value.splice(originalIndex + 1, 0, clone);
      }
      console.log(`[DD] コピー作成: ${clone.id} (元: ${journal.id})`);
      confirmDialog.value = {
        show: true,
        title: "コピー完了",
        message: "未出力にコピーしました。",
        onConfirm: () => {},
      };
    },
  };
}

function trashJournal(journal: JournalPhase5Mock) {
  // 制約: 出力済みはゴミ箱不可
  if (journal.status === "exported") {
    console.warn(`[DD] exported journal cannot be trashed: ${journal.id}`);
    return;
  }
  closeDropdown();
  confirmDialog.value = {
    show: true,
    title: "ゴミ箱に移動",
    message: `「${journal.description}」をゴミ箱に移動しますか？`,
    onConfirm: () => {
      const target = localJournals.value.find((j) => j.id === journal.id);
      if (!target) return;
      target.deleted_at = new Date().toISOString();
      target.deleted_by = currentStaffId.value ?? null;
      console.log(`[DD] ゴミ箱: ${journal.id} by ${currentStaffId.value}`);
      confirmDialog.value = {
        show: true,
        title: "完了",
        message: `「${journal.description}」をゴミ箱に移動しました。`,
        onConfirm: () => {},
      };
    },
  };
}

function restoreJournal(journal: JournalPhase5Mock) {
  const target = localJournals.value.find((j) => j.id === journal.id);
  if (!target || target.deleted_at === null) return;
  closeDropdown();
  confirmDialog.value = {
    show: true,
    title: "復活",
    message: `「${journal.description}」を復活しますか？`,
    onConfirm: () => {
      target.deleted_at = null;
      target.deleted_by = null;
      console.log(`[DD] 復活: ${journal.id} by ${currentStaffId.value}`);
      confirmDialog.value = {
        show: true,
        title: "復活完了",
        message: `「${journal.description}」を復活しました。`,
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
  const all = selectedJournals.value;
  const exportedCount = all.filter((j) => j.status === "exported").length;
  const targets = all.filter((j) => j.status !== "exported" && j.is_read !== value);
  // 0件ガード
  if (targets.length === 0) {
    confirmDialog.value = {
      show: true,
      title: "実行不可",
      message:
        exportedCount > 0
          ? `選択: ${all.length}件 / 出力済み: ${exportedCount}件（スキップ）\n実行可能な仕訳がありません。`
          : `すべて既に${value ? "既読" : "未読"}状態です。`,
      onConfirm: () => {},
    };
    return;
  }
  // 確認ダイアログ
  const capturedTargets = [...targets];
  const confirmMsg =
    exportedCount > 0
      ? `選択: ${all.length}件 / 出力済み: ${exportedCount}件（スキップ）/ 実行対象: ${capturedTargets.length}件`
      : `${capturedTargets.length}件を${value ? "既読" : "未読"}にしますか？`;
  confirmDialog.value = {
    show: true,
    title: value ? "既読にする" : "未読にする",
    message: confirmMsg,
    onConfirm: () => {
      capturedTargets.forEach((j) => {
        j.is_read = value;
        if (value) {
          j.read_by = currentStaffId.value ?? null;
          j.read_at = new Date().toISOString();
        }
      });
      console.log(`[一括] ${value ? "既読" : "未読"}: ${capturedTargets.length}件変更 by ${currentStaffId.value}`);
      const count = capturedTargets.length;
      clearSelection();
      confirmDialog.value = {
        show: true,
        title: "完了",
        message: `${count}件を${value ? "既読" : "未読"}にしました。`,
        onConfirm: () => {},
      };
    },
  };
}

function bulkSetExportExclude(exclude: boolean) {
  const all = selectedJournals.value;
  const exportedCount = all.filter((j) => j.status === "exported").length;
  const targets = all.filter((j) => {
    if (j.status === "exported") return false;
    return exclude !== j.labels.includes("EXPORT_EXCLUDE");
  });
  // 0件ガード
  if (targets.length === 0) {
    confirmDialog.value = {
      show: true,
      title: "実行不可",
      message:
        exportedCount > 0
          ? `選択: ${all.length}件 / 出力済み: ${exportedCount}件（スキップ）\n実行可能な仕訳がありません。`
          : "実行可能な仕訳がありません。",
      onConfirm: () => {},
    };
    return;
  }
  // exported含む場合の制限メッセージ
  if (exportedCount > 0) {
    const capturedTargets = [...targets]; // クロージャキャプチャ
    confirmDialog.value = {
      show: true,
      title: exclude ? "出力対象外に変更" : "出力対象に変更",
      message: `選択: ${all.length}件 / 出力済み: ${exportedCount}件（スキップ）/ 実行対象: ${capturedTargets.length}件`,
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
          title: "完了",
          message: `${count}件を${exclude ? "出力対象外" : "出力対象"}にしました。`,
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
    title: exclude ? "出力対象外にする" : "出力対象にする",
    message: `${capturedTargets.length}件を${exclude ? "出力対象外" : "出力対象"}にしますか？`,
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
        title: "完了",
        message: `${count}件を${exclude ? "出力対象外" : "出力対象"}にしました。`,
        onConfirm: () => {},
      };
    },
  };
}

function showBulkCopyDialog() {
  const targets = [...selectedJournals.value]; // クロージャキャプチャ（コピーはexportedスキップなし）
  confirmDialog.value = {
    show: true,
    title: "コピー",
    message: `${targets.length}件を未出力にコピーしますか？`,
    onConfirm: () => {
      targets.forEach((j) => {
        const clone: JournalPhase5Mock = JSON.parse(JSON.stringify(j));
        clone.id = `copy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        clone.display_order = j.display_order + 0.5;
        clone.description = `★コピー ${j.description}`;
        clone.is_read = false;
        clone.status = null;
        clone.labels = [];
        clone.memo = null;
        clone.memo_author = null;
        clone.memo_target = null;
        clone.memo_created_at = null;
        clone.deleted_at = null;
        const originalIndex = localJournals.value.findIndex((lj) => lj.id === j.id);
        if (originalIndex >= 0) {
          localJournals.value.splice(originalIndex + 1, 0, clone);
        }
      });
      console.log(`[一括] コピー: ${targets.length}件`);
      clearSelection();
      confirmDialog.value = {
        show: true,
        title: "コピー完了",
        message: `${targets.length}件を未出力にコピーしました。`,
        onConfirm: () => {},
      };
    },
  };
}

function showBulkTrashDialog() {
  const all = selectedJournals.value;
  const exportedCount = all.filter((j) => j.status === "exported").length;
  const targets = all.filter((j) => j.status !== "exported" && j.deleted_at === null);
  // 0件ガード
  if (targets.length === 0) {
    confirmDialog.value = {
      show: true,
      title: "実行不可",
      message:
        exportedCount > 0
          ? `選択: ${all.length}件 / 出力済み: ${exportedCount}件（スキップ）\n実行可能な仕訳がありません。`
          : "実行可能な仕訳がありません。",
      onConfirm: () => {},
    };
    return;
  }
  const capturedTargets = [...targets]; // クロージャキャプチャ
  const msg =
    exportedCount > 0
      ? `選択: ${all.length}件 / 出力済み: ${exportedCount}件（スキップ）/ 実行対象: ${capturedTargets.length}件\nゴミ箱に移動しますか？`
      : `${capturedTargets.length}件をゴミ箱に移動しますか？`;
  confirmDialog.value = {
    show: true,
    title: "ゴミ箱",
    message: msg,
    onConfirm: () => {
      const now = new Date().toISOString();
      capturedTargets.forEach((j) => {
        j.deleted_at = now;
        j.deleted_by = currentStaffId.value ?? null;
      });
      console.log(`[一括] ゴミ箱: ${capturedTargets.length}件 by ${currentStaffId.value}`);
      clearSelection();
      confirmDialog.value = {
        show: true,
        title: "完了",
        message: `${capturedTargets.length}件をゴミ箱に移動しました。`,
        onConfirm: () => {},
      };
    },
  };
}

// ソート状態
const sortColumn = ref<string | null>(null);
const sortDirection = ref<"asc" | "desc">("asc");

// ────── メイン仕訳ページネーション ──────
const journalPageSize = ref(30);
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

// 画像モーダル用
const hoveredJournalId = ref<string | null>(null);
const modalImageUrl = ref<string | null>(null);
const rotationAngle = ref<number>(0);
const isModalPinned = ref<boolean>(false);
const zoomScale = ref<number>(1);
const baseModalWidth = ref<number>(300);
const baseModalHeight = ref<number>(400);

// 画像ドラッグ用（画像パン操作）
const offsetX = ref<number>(0);
const offsetY = ref<number>(0);
const isDragging = ref<boolean>(false);
const dragStartX = ref<number>(0);
const dragStartY = ref<number>(0);

// 画像モーダル ドラッグ移動用
const imageModalRef = ref<HTMLElement | null>(null);
const {
  position: imageModalPos,
  zIndex: imageModalZ,
  startDrag: startImageDrag,
} = useDraggable(imageModalRef);

/** モーダル全体ドラッグ用フィルタ（フォーム要素・リサイズ領域はドラッグ除外） */
function modalDrag(startFn: (e: MouseEvent) => void, e: MouseEvent) {
  const t = e.target as HTMLElement;
  if (t.closest("input, select, button, textarea, a, [contenteditable], .fill-handle")) return;
  // 右下角のリサイズ領域（20px）をドラッグから除外
  const el = e.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  if (e.clientX > rect.right - 20 && e.clientY > rect.bottom - 20) return;
  startFn(e);
}

// 過去仕訳検索モーダル用
const pastJournalModalRef = ref<HTMLElement | null>(null);
const {
  position: pastJournalPos,
  zIndex: pastJournalZ,
  startDrag: startPastJournalDrag,
} = useDraggable(pastJournalModalRef);

// コメントモーダル用
const commentModalRef = ref<HTMLElement | null>(null);
const {
  position: commentModalPos,
  zIndex: commentModalZ,
  startDrag: startCommentDrag,
} = useDraggable(commentModalRef);

// ヒントモーダル用
const hintModalRef = ref<HTMLElement | null>(null);
const {
  position: hintModalPos,
  zIndex: hintModalZ,
  startDrag: startHintDrag,
} = useDraggable(hintModalRef);

// ━━━ 根拠資料検索モーダル ━━━
const supportingSearchModalRef = ref<HTMLElement | null>(null);
const {
  position: supportingSearchPos,
  zIndex: supportingSearchZ,
  startDrag: startSupportingSearchDrag,
} = useDraggable(supportingSearchModalRef);

const supportingImageModalRef = ref<HTMLElement | null>(null);
const {
  position: supportingImagePos,
  zIndex: supportingImageZ,
  startDrag: startSupportingImageDrag,
} = useDraggable(supportingImageModalRef);

const showSupportingSearchModal = ref(false);
const supportingSearchQuery = ref('');
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
const supportingSearchResults = ref<SupportingMetaItem[]>([]);
const isSupportingSearching = ref(false);
const supportingSearchDone = ref(false);
const supportingSearchInputRef = ref<HTMLInputElement | null>(null);

// 画像プレビュー
const supportingPreviewUrl = ref<string | null>(null);
const supportingRotation = ref(0);
const supportingZoom = ref(1);

let supportingSearchTimer: ReturnType<typeof setTimeout> | null = null;

// ━━━ 根拠資料 自動紐づけ（API経由）━━━
// matchScore / supportingMatchMap computed は API側に移設済み。
// Phase 1 Step 6-B3 (2026-05-03)

/** 仕訳ID → マッチした根拠資料の紐づけマップ（APIレスポンスをキャッシュ） */
const supportingMatchMap = ref<Map<string, SupportingMetaItem[]>>(new Map());

/** 証票マッチングAPI呼び出し（マウント時 + 仕訳変更時） */
async function fetchSupportingMatches() {
  try {
    const res = await fetch(`/api/journals/${encodeURIComponent(journalClientId.value)}/supporting-match`);
    if (res.ok) {
      const data = await res.json() as { matches: Record<string, SupportingMetaItem[]>; matchedCount: number };
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
function hasSupportingMatch(journal: JournalPhase5Mock): boolean {
  return supportingMatchMap.value.has(journal.id);
}

// マウント時に証票マッチング取得
onMounted(() => {
  fetchSupportingMatches();
});

function openSupportingSearchModal() {
  showSupportingSearchModal.value = true;
  supportingSearchQuery.value = '';
  supportingSearchResults.value = [];
  supportingSearchDone.value = false;
  // 開いた直後に全件取得
  executeSupportingSearch();
  // フォーカス
  nextTick(() => {
    supportingSearchInputRef.value?.focus();
  });
}

function closeSupportingSearchModal() {
  showSupportingSearchModal.value = false;
  supportingSearchQuery.value = '';
  supportingSearchResults.value = [];
}

function debounceSupportingSearch() {
  if (supportingSearchTimer) clearTimeout(supportingSearchTimer);
  supportingSearchTimer = setTimeout(() => {
    executeSupportingSearch();
  }, 300);
}

async function executeSupportingSearch() {
  isSupportingSearching.value = true;
  supportingSearchDone.value = false;
  try {
    const q = encodeURIComponent(supportingSearchQuery.value.trim());
    const res = await fetch(`/api/drive/search-supporting/${encodeURIComponent(journalClientId.value)}?q=${q}`);
    if (res.ok) {
      const data = await res.json() as { results: typeof supportingSearchResults.value };
      supportingSearchResults.value = data.results;
    }
  } catch (err) {
    console.warn('[根拠資料検索] エラー:', err);
  } finally {
    isSupportingSearching.value = false;
    supportingSearchDone.value = true;
  }
}

function previewSupportingImage(item: { previewUrl: string }) {
  supportingPreviewUrl.value = item.previewUrl || null;
  supportingRotation.value = 0;
  supportingZoom.value = 1;
}

function closeSupportingPreview() {
  supportingPreviewUrl.value = null;
}

const showPastJournalModal = ref<boolean>(false);
const pastJournalTab = ref<"streamed" | "accounting">("streamed");
const pastJournalSearch = ref({
  vendor: "",
  dateFrom: "",
  dateTo: "",
  amountCondition: "",
  amount: null as number | null,
  debitAccount: "",
  creditAccount: "",
});

const isPastJournalModalPinned = ref<boolean>(false);
const outputFilter = ref<"all" | "unexported" | "exported">("all");
const pastJournalPage = ref<number>(1);
const PAST_JOURNAL_PAGE_SIZE = 50;

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
      const data = await res.json() as { journals: ConfirmedJournal[]; count: number };
      confirmedJournals.value = data.journals;
      console.log(`[過去仕訳] confirmed_journals ${data.count}件取得 (${journalClientId.value})`);
    }
    confirmedLoaded.value = true;
  } catch (err) {
    console.warn('[過去仕訳] 取得失敗:', err);
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

const filteredPastJournals = computed(() => {
  let results = [...localJournals.value];

  // 支払先フィルタ
  if (pastJournalSearch.value.vendor) {
    results = results.filter((j) => j.description.includes(pastJournalSearch.value.vendor));
  }

  // 日付範囲フィルタ
  if (pastJournalSearch.value.dateFrom) {
    results = results.filter(
      (j) => j.voucher_date !== null && j.voucher_date >= pastJournalSearch.value.dateFrom,
    );
  }
  if (pastJournalSearch.value.dateTo) {
    results = results.filter(
      (j) => j.voucher_date !== null && j.voucher_date <= pastJournalSearch.value.dateTo,
    );
  }

  // 金額フィルタ
  if (pastJournalSearch.value.amount !== null && pastJournalSearch.value.amountCondition) {
    results = results.filter((j) => {
      const debitTotal = j.debit_entries.reduce((sum, e) => sum + (e.amount ?? 0), 0);
      const creditTotal = j.credit_entries.reduce((sum, e) => sum + (e.amount ?? 0), 0);
      const amount = Math.max(debitTotal, creditTotal);

      switch (pastJournalSearch.value.amountCondition) {
        case "equal":
          return amount === pastJournalSearch.value.amount;
        case "greater":
          return amount >= (pastJournalSearch.value.amount || 0);
        case "less":
          return amount <= (pastJournalSearch.value.amount || 0);
        default:
          return true;
      }
    });
  }

  // 借方勘定科目フィルタ
  if (pastJournalSearch.value.debitAccount) {
    results = results.filter((j) =>
      j.debit_entries.some(
        (e) =>
          resolveAccountName(e.account) === pastJournalSearch.value.debitAccount ||
          e.account === pastJournalSearch.value.debitAccount,
      ),
    );
  }

  // 貸方勘定科目フィルタ
  if (pastJournalSearch.value.creditAccount) {
    results = results.filter((j) =>
      j.credit_entries.some(
        (e) =>
          resolveAccountName(e.account) === pastJournalSearch.value.creditAccount ||
          e.account === pastJournalSearch.value.creditAccount,
      ),
    );
  }

  // タブによる表示制御
  if (pastJournalTab.value === "accounting") {
    // 会計ソフトから取り込んだ過去仕訳（confirmed_journals API）
    let cjResults = [...confirmedJournals.value];

    // 摘要フィルタ
    if (pastJournalSearch.value.vendor) {
      cjResults = cjResults.filter((j) => j.description.includes(pastJournalSearch.value.vendor));
    }
    // 日付範囲フィルタ
    if (pastJournalSearch.value.dateFrom) {
      cjResults = cjResults.filter((j) => j.voucher_date >= pastJournalSearch.value.dateFrom);
    }
    if (pastJournalSearch.value.dateTo) {
      cjResults = cjResults.filter((j) => j.voucher_date <= pastJournalSearch.value.dateTo);
    }
    // 金額フィルタ
    if (pastJournalSearch.value.amount !== null && pastJournalSearch.value.amountCondition) {
      cjResults = cjResults.filter((j) => {
        const debitTotal = j.debit_entries.reduce((sum, e) => sum + (e.amount ?? 0), 0);
        const creditTotal = j.credit_entries.reduce((sum, e) => sum + (e.amount ?? 0), 0);
        const amount = Math.max(debitTotal, creditTotal);
        switch (pastJournalSearch.value.amountCondition) {
          case "equal": return amount === pastJournalSearch.value.amount;
          case "greater": return amount >= (pastJournalSearch.value.amount || 0);
          case "less": return amount <= (pastJournalSearch.value.amount || 0);
          default: return true;
        }
      });
    }
    // 借方勘定科目フィルタ
    if (pastJournalSearch.value.debitAccount) {
      cjResults = cjResults.filter((j) =>
        j.debit_entries.some((e) => e.account === pastJournalSearch.value.debitAccount)
      );
    }
    // 貸方勘定科目フィルタ
    if (pastJournalSearch.value.creditAccount) {
      cjResults = cjResults.filter((j) =>
        j.credit_entries.some((e) => e.account === pastJournalSearch.value.creditAccount)
      );
    }
    // JournalPhase5Mock互換オブジェクトに変換して返す
    return cjResults.map((cj) => ({
      id: cj.id,
      voucher_date: cj.voucher_date,
      description: cj.description,
      debit_entries: cj.debit_entries.map((e) => ({
        account: e.account,
        sub_account: e.sub_account,
        tax_category_id: e.tax_category_id,
        amount: e.amount,
      })),
      credit_entries: cj.credit_entries.map((e) => ({
        account: e.account,
        sub_account: e.sub_account,
        tax_category_id: e.tax_category_id,
        amount: e.amount,
      })),
      status: 'exported' as const,
      labels: [] as JournalLabelMock[],
      source: cj.source,
    }));
  }

  // 出力ステータスフィルタ
  if (outputFilter.value === "unexported") {
    results = results.filter((j) => j.status === null);
  } else if (outputFilter.value === "exported") {
    results = results.filter((j) => j.status === "exported");
  }

  return results;
});

const paginatedPastJournals = computed(() => {
  const start = (pastJournalPage.value - 1) * PAST_JOURNAL_PAGE_SIZE;
  return filteredPastJournals.value.slice(start, start + PAST_JOURNAL_PAGE_SIZE);
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredPastJournals.value.length / PAST_JOURNAL_PAGE_SIZE));
});

function toggleOutputFilter(filter: "unexported" | "exported") {
  if (outputFilter.value === filter) {
    outputFilter.value = "all";
  } else {
    outputFilter.value = filter;
  }
  pastJournalPage.value = 1;
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    pastJournalPage.value = page;
  }
}

// baseModalWidth/baseModalHeight は画像読込時の初期サイズ記録用（CSS resize: bothで管理）

function showImageModal(journalId: string, documentId: string | null) {
  hoveredJournalId.value = journalId;
  modalImageUrl.value = getDocumentImageUrl(documentId);
  rotationAngle.value = 0; // リセット
  zoomScale.value = 1; // ズームリセット
  offsetX.value = 0; // 位置リセット
  offsetY.value = 0;
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
    rotationAngle.value = 0;
    zoomScale.value = 1; // ズームリセット
    offsetX.value = 0; // 位置リセット
    offsetY.value = 0;
  }
}

function closeModal() {
  isModalPinned.value = false;
  hoveredJournalId.value = null;
  modalImageUrl.value = null;
}

function zoomIn() {
  zoomScale.value = Math.min(zoomScale.value + 0.25, 7); // 最大7倍
}

function zoomOut() {
  zoomScale.value = Math.max(zoomScale.value - 0.25, 0.5); // 最小0.5倍
}

function onImageLoad(event: Event) {
  const img = event.target as HTMLImageElement;
  const aspectRatio = img.naturalWidth / img.naturalHeight;

  // アスペクト比に応じてモーダルの基本サイズを調整
  if (aspectRatio > 1.2) {
    // 横長画像
    baseModalWidth.value = 500;
    baseModalHeight.value = 300;
  } else if (aspectRatio < 0.8) {
    // 縦長画像
    baseModalWidth.value = 300;
    baseModalHeight.value = 500;
  } else {
    // 正方形に近い
    baseModalWidth.value = 400;
    baseModalHeight.value = 400;
  }
}

function onMouseDown(event: MouseEvent) {
  isDragging.value = true;
  dragStartX.value = event.clientX - offsetX.value;
  dragStartY.value = event.clientY - offsetY.value;
  event.preventDefault();
}

function onMouseMove(event: MouseEvent) {
  if (isDragging.value) {
    offsetX.value = event.clientX - dragStartX.value;
    offsetY.value = event.clientY - dragStartY.value;
  }
}

function onMouseUp() {
  isDragging.value = false;
}

// ────────────────────────────────────────────
// Step 5: journals をAPI統合一覧で取得（Phase 1 Step 4のAPIを使用）
// 旧 journals computed (290行のソート・フィルタ・検索・pastRows統合) を削除。
// API側の journalListService がソート・フィルタ・検索・pastRows統合・ページネーションを実行。
// セル編集の即時反映は localJournals の deep watch → autoSave → fetchJournalList で維持。
// ────────────────────────────────────────────

const journals = shallowRef<JournalPhase5Mock[]>([]);

/** 統合一覧APIの呼び出し（POST: 科目名マッピング付き） */
let _fetchVersion = 0;
async function fetchJournalList() {
  const version = ++_fetchVersion;

  // Phase 2: accountMap/taxMapはサーバー側マスタから自動生成（POSTボディ送信不要）

  const body: Record<string, unknown> = {
    showPastCsv: showPastCsv.value,
    showUnexported: showUnexported.value,
    showExported: showExported.value,
    showExcluded: showExcluded.value,
    showTrashed: showTrashed.value,
    page: journalCurrentPage.value,
    pageSize: journalPageSize.value,
  };
  if (sortColumn.value) {
    body.sort = sortColumn.value;
    body.order = sortDirection.value;
  }
  if (globalSearchQuery.value.trim()) {
    body.search = globalSearchQuery.value.trim();
  }
  if (voucherFilter.value) {
    body.voucherFilter = voucherFilter.value;
  }

  try {
    const res = await fetch(`/api/journals/${journalClientId.value}/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error('[fetchJournalList] API error:', res.status);
      return;
    }
    const data = await res.json();
    // バージョンチェック: 新しいリクエストが発行されていたら棄却
    if (_fetchVersion !== version) return;
    journals.value = data.journals ?? [];
    _apiTotalCount.value = data.totalCount ?? 0;
    _apiTotalPages.value = data.totalPages ?? 1;
    triggerRef(journals);
  } catch (err) {
    console.error('[fetchJournalList] fetch失敗:', err);
  }
}

// 条件変更時にAPI再呼び出し（検索はデバウンス付き）
let _searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  [sortColumn, sortDirection, showPastCsv, showUnexported, showExported, showExcluded, showTrashed, voucherFilter, journalCurrentPage, journalPageSize],
  () => { fetchJournalList(); },
);
watch(globalSearchQuery, () => {
  if (_searchTimer) clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => fetchJournalList(), 300);
});

// autoSave完了後にAPI再フェッチ（localJournalsのdeep watch）
// useJournals内のautoSaveは500msデバウンス。その完了後にfetchJournalListを呼ぶ。
// localJournalsの変更は即座にセル上に反映される（テンプレートがlocalJournalsを直接参照する行もある）が、
// journals ref（ソート・フィルタ済みリスト）はAPI再フェッチで更新される。
let _localSaveTimer: ReturnType<typeof setTimeout> | null = null;
watch(localJournals, () => {
  if (_localSaveTimer) clearTimeout(_localSaveTimer);
  // autoSaveの500ms + 余裕200ms = 700ms後にfetchJournalList + 証票マッチング再取得
  _localSaveTimer = setTimeout(() => {
    fetchJournalList();
    fetchSupportingMatches(); // 仕訳変更後にマッチング結果を再計算（Step 6 #4修正）
  }, 700);
}, { deep: true });

// 初期ロード
fetchJournalList();

// ────── journals依存のcomputed（journals ref の後に配置必須） ──────

/** ページネーション適用済み仕訳リスト（APIがページング済みなのでjournalsそのまま） */
const paginatedJournals = computed(() => journals.value);

const visibleIds = computed(() => journals.value.map((j) => j.id));

const selectedJournals = computed(() =>
  localJournals.value.filter((j) => selectedIds.value.has(j.id)),
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
  localJournals.value.forEach((j) => {
    const docId = j.document_id ?? "";
    const date = j.voucher_date ?? "\uffff";
    const cur = minDateMap.get(docId);
    if (!cur || date < cur) minDateMap.set(docId, date);
  });
  localJournals.value.sort((a, b) => {
    const da = minDateMap.get(a.document_id ?? "") ?? "\uffff";
    const db = minDateMap.get(b.document_id ?? "") ?? "\uffff";
    if (da !== db) return da < db ? -1 : 1;
    const va = a.voucher_date ?? "\uffff";
    const vb = b.voucher_date ?? "\uffff";
    if (va !== vb) return va < vb ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/** getCombinedRowsの戳り値行型（getValue/getRawValueの引数型に使用） */
type CombinedRow = { debit: JournalEntryLine | null; credit: JournalEntryLine | null };

/**
 * JournalEntryLineの動的フィールド書き込み（型安全ヘルパー）
 *
 * commitCellEdit / applyFillValue で entry[field] = value の動的書き込みが必要な箇所で使用。
 * JournalEntryLineの既知フィールドのみ書き込み可能。未知フィールドは無視。
 */
function setEntryField(entry: JournalEntryLine, field: string, value: unknown): void {
  switch (field) {
    case 'account':
      entry.account = (value as string) || null;
      break;
    case 'sub_account':
      entry.sub_account = (value as string) || null;
      break;
    case 'department':
      entry.department = (value as string) || null;
      break;
    case 'amount':
      entry.amount = value != null && value !== '' ? Number(value) : null;
      break;
    case 'tax_category_id':
      entry.tax_category_id = (value as string) || null;
      break;
    default:
      // JournalEntryLineに存在しないフィールド（selectedCategory等）は書き込まない
      console.warn(`[setEntryField] 未知のフィールド: ${field}`);
      break;
  }
}

function getCombinedRows(
  journal: JournalPhase5Mock,
): CombinedRow[] {
  const maxRows = Math.max(journal.debit_entries.length, journal.credit_entries.length);
  return Array.from({ length: maxRows }, (_, i) => ({
    debit: journal.debit_entries[i] || null,
    credit: journal.credit_entries[i] || null,
  }));
}

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
function getRowBackground(journal: JournalPhase5Mock): string {
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
  // 優先度4: 未読 → 黄色
  if (!journal.is_read) {
    return "bg-yellow-100";
  }
  // 優先度5: 通常 → 白
  return "bg-white";
}

function hasPastJournal(journal: JournalPhase5Mock): boolean {
  return localJournals.value.findIndex((j) => j.id === journal.id) < 25;
}

/**
 * ドットパスで値を取得（税区分名称・勘定科目名変換付き）
 * 動的パスアクセスのためkeyof型安全性は保証できない。内部でunknown経由でRecordにキャストする。
 */
function getValue(obj: JournalPhase5Mock | CombinedRow, path: string): unknown {
  const raw = path.split(".").reduce((o: unknown, key: string) => (o as Record<string, unknown>)?.[key], obj as unknown);
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

/** 概念IDからMF正式名称を取得。顧問先税区分を優先、なければマスタフォールバック */
function resolveTaxCategoryName(id: string | null | undefined): string {
  if (!id) return "";
  const allTaxCats = clientSettings.taxCategories.value;
  const entry = allTaxCats.find((tc) => tc.id === id);
  return entry ? entry.name : id;
}

/** IDから勘定科目の表示名を取得。顧問先科目を優先、なければマスタフォールバック */
function resolveAccountName(id: string | null | undefined): string {
  if (!id) return "";
  const allAccts = clientSettings.accounts.value;
  const account = allAccts.find((a) => a.id === id);
  return account ? account.name : id;
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
    label: "書類が不足",
    icon: "fa-file-circle-exclamation",
    activeColor: "text-red-600",
    hoverIconColor: "#dc2626",
  },
  NEED_INFO: {
    label: "情報が不足",
    icon: "fa-circle-question",
    activeColor: "text-amber-600",
    hoverIconColor: "#d97706",
  },
  REMINDER: {
    label: "備忘メモ",
    icon: "fa-thumbtack",
    activeColor: "text-blue-600",
    hoverIconColor: "#2563eb",
  },
  NEED_CONSULT: {
    label: "社内相談する",
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

function hoverOpenCommentModal(journal: JournalPhase5Mock) {
  if (commentModalPinned.value) return;
  if (commentHoverCloseTimer) {
    clearTimeout(commentHoverCloseTimer);
    commentHoverCloseTimer = null;
  }
  openCommentModal(journal.id);
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

function hasAnyStaffNote(journal: JournalPhase5Mock): boolean {
  if (!journal.staff_notes) return false;
  return STAFF_NOTE_KEYS.some((key) => journal.staff_notes?.[key]?.enabled);
}

function getStaffNoteEnabled(journal: JournalPhase5Mock, key: StaffNoteKey): boolean {
  return journal.staff_notes?.[key]?.enabled ?? false;
}

function getStaffNoteText(journal: JournalPhase5Mock, key: StaffNoteKey): string {
  return journal.staff_notes?.[key]?.text ?? "";
}

function getStaffNoteChatworkUrl(journal: JournalPhase5Mock, key: StaffNoteKey): string {
  return journal.staff_notes?.[key]?.chatworkUrl ?? "";
}

// staff_notes → labels 同期関数
function syncLabelsFromStaffNotes(journal: JournalPhase5Mock) {
  const NEED_KEYS: readonly StaffNoteKey[] = STAFF_NOTE_KEYS;
  // NEED_*系を一旦除去
  journal.labels = journal.labels.filter((l) => !NEED_KEYS.includes(l as StaffNoteKey));
  // enabledなものだけ追加
  for (const key of NEED_KEYS) {
    if (journal.staff_notes?.[key]?.enabled) {
      journal.labels.push(key);
    }
  }
}

function toggleStaffNote(journalId: string, key: StaffNoteKey) {
  const journal = localJournals.value.find((j) => j.id === journalId);
  if (!journal) return;

  // staff_notesがなければ初期化
  if (!journal.staff_notes) {
    journal.staff_notes = createEmptyStaffNotes();
  }

  // トグル
  journal.staff_notes[key].enabled = !journal.staff_notes[key].enabled;

  // 同期
  syncLabelsFromStaffNotes(journal);

  if (journal.staff_notes[key].enabled) {
    journal.is_read = false; // フラグON時は未読にする
  }
  console.log(`StaffNote toggled: ${key} = ${journal.staff_notes[key].enabled} for ${journalId}`);
}

// コメントモーダル
const commentModalJournalId = ref<string | null>(null);
const { userName, staffList, currentStaffId } = useCurrentUser();
// コメント投稿者名（ローカルref。v-model互換のためcomputedのuserNameとは別管理）
const commentModalAuthor = ref<string>(userName.value);
// userNameが変わったら同期
watch(userName, (v) => { commentModalAuthor.value = v; });

const commentModalJournal = computed(() => {
  if (!commentModalJournalId.value) return null;
  return localJournals.value.find((j) => j.id === commentModalJournalId.value) ?? null;
});

function openCommentModal(journalId: string) {
  const journal = localJournals.value.find((j) => j.id === journalId);
  if (!journal) return;

  // staff_notesがなければ初期化
  if (!journal.staff_notes) {
    journal.staff_notes = createEmptyStaffNotes();
  }

  commentModalJournalId.value = journalId;
}

function closeCommentModal() {
  if (commentModalJournal.value) {
    commentModalJournal.value.staff_notes_author = commentModalAuthor.value;
    syncLabelsFromStaffNotes(commentModalJournal.value);
  }
  commentModalJournalId.value = null;
  commentModalPinned.value = false;
}

function toggleStaffNoteInModal(key: StaffNoteKey) {
  if (!commentModalJournal.value || !commentModalJournal.value.staff_notes) return;
  commentModalJournal.value.staff_notes[key].enabled =
    !commentModalJournal.value.staff_notes[key].enabled;
  // labels即時同期
  syncLabelsFromStaffNotes(commentModalJournal.value);
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
  console.log(`[セッション] 仕訳画面開始: ${new Date().toISOString()} スタッフ: ${currentStaffId.value}`);
  // ツールバーの過去仕訳CSV件数表示用に自動取得
  fetchConfirmedJournals();
});
onUnmounted(() => {
  window.removeEventListener("keydown", handleUndoRedoKeydown);
  const elapsed = Math.round((Date.now() - sessionStartTime.value) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  console.log(`[セッション] 仕訳画面終了: ${new Date().toISOString()} スタッフ: ${currentStaffId.value} 滞在: ${minutes}分${seconds}秒`);
});
</script>

<style scoped>
/* 出力済み行: 縦罫線も白に */
.exported-row > div {
  border-right-color: white !important;
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
