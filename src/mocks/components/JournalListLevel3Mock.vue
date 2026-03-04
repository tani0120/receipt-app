<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans" @click="closeDropdown">
    <!-- L3ツールバー（共通ナビバー） -->
    <MockNavBar activeItem="home" />
    <!-- 上部バー -->
    <div class="bg-white px-3 py-[5.2px] flex justify-between items-center text-[10px] text-gray-700">
      <!-- フィルタモード（通常時） -->
      <template v-if="!isSelectionMode">
        <div class="flex items-center gap-3">
          <select class="border border-blue-400 text-blue-600 text-[10px] px-2 py-0.5 rounded cursor-pointer">
            <option>表示条件</option>
            <option>未読</option>
            <option>メモ</option>
            <option>エラー ⚠</option>
            <option>重複</option>
            <option>要確認</option>
            <option>電子帳簿保存法</option>
            <option>学習未適用</option>
            <option>学習適用済</option>
            <option>学習なし</option>
          </select>
          <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" v-model="showUnexported" class="w-2.5 h-2.5">未出力を表示</label>
          <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" v-model="showExported" class="w-2.5 h-2.5">出力済を表示</label>
          <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" v-model="showExcluded" class="w-2.5 h-2.5">出力対象外を表示</label>
          <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" v-model="showTrashed" class="w-2.5 h-2.5">ゴミ箱を表示</label>
        </div>
      </template>
      <!-- アクションモード（選択時） -->
      <template v-else>
        <div class="flex items-center gap-2">
          <span class="text-blue-600 font-bold">{{ selectedIds.size }}件選択中</span>
          <button @click="clearSelection" class="text-gray-500 hover:text-gray-700 px-1" title="選択解除">✖</button>
          <div class="border-l border-gray-300 h-4 mx-1"></div>
          <div class="flex border border-gray-300 rounded overflow-hidden">
            <button @click="bulkSetReadStatus(false)" class="px-2 py-0.5 hover:bg-gray-100">📖 未読</button>
            <button @click="bulkSetReadStatus(true)" class="px-2 py-0.5 hover:bg-gray-100 border-l border-gray-300">📖 既読</button>
          </div>
          <div class="flex border border-gray-300 rounded overflow-hidden">
            <button @click="bulkSetExportExclude(true)" class="px-2 py-0.5 hover:bg-gray-100">📤 対象外</button>
            <button @click="bulkSetExportExclude(false)" class="px-2 py-0.5 hover:bg-gray-100 border-l border-gray-300">📤 対象</button>
          </div>
          <button @click="showBulkCopyDialog" class="px-2 py-0.5 border border-gray-300 rounded hover:bg-gray-100">📋 コピー</button>
          <button @click="showBulkTrashDialog" class="px-2 py-0.5 border border-red-300 rounded hover:bg-red-50 text-red-600">🗑 ゴミ箱</button>
        </div>
      </template>
      <!-- 行の背景色 凡例（両モードで表示） -->
      <div class="flex items-center gap-2">
        <span class="text-gray-600">行の背景色</span>
        <span class="bg-yellow-100 border border-gray-400 px-2 py-0.5 text-gray-800 font-bold">未読</span>
        <span class="bg-white border border-gray-400 px-2 py-0.5 text-gray-800">既読</span>
        <span class="bg-gray-200 border border-gray-400 px-2 py-0.5 text-gray-800">出力済</span>
        <span class="bg-gray-600 border border-gray-400 px-2 py-0.5 text-white">ゴミ箱</span>
      </div>
    </div>
    <!-- 初回選択ヘルプ（fadeOut） -->
    <div v-if="showSelectionHelp"
         class="bg-blue-50 text-blue-700 text-[10px] px-3 py-1 text-center transition-opacity duration-1000"
         :class="{ 'opacity-0': !showSelectionHelp }">
      💡 チェックを入れると一括操作バーに切り替わります。全解除でフィルタに戻ります。
    </div>

    <!-- テーブルヘッダー（23列） -->
    <div class="bg-blue-100 text-gray-800 text-[10px] flex border-b border-gray-300 pr-[8px]">
      <div
        v-for="col in journalColumns"
        :key="col.key"
        :class="[
          col.width,
          'p-1 flex items-center justify-center',
          col.type !== 'action' ? 'border-r border-gray-300' : '',
          col.sortKey ? 'cursor-pointer hover:bg-blue-200' : ''
        ]"
        @click="col.sortKey && sortBy(col.sortKey)"
      >
        <!-- checkbox列ヘッダー: 全選択/全解除 -->
        <template v-if="col.type === 'checkbox'">
          <input type="checkbox" class="w-2.5 h-2.5 cursor-pointer" :checked="isAllSelected" @change="toggleSelectAll">
        </template>
        <template v-else>
          <span class="flex items-center gap-0.5">
            {{ col.label }}
            <span v-if="col.key === 'labelType' || col.key === 'warning'"
                  class="relative inline-flex"
                  @mouseenter="legendModalType = col.key as any"
                  @mouseleave="legendModalType = null">
              <span class="inline-flex items-center justify-center w-3 h-3 rounded-full bg-gray-800 text-white text-[7px] font-bold cursor-pointer hover:bg-blue-600 shrink-0">?</span>
              <!-- 証票ポップオーバー -->
              <div v-if="legendModalType === 'labelType' && col.key === 'labelType'"
                   class="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-[110] transform scale-[0.9] origin-top">
                <div class="bg-gray-900/90 rounded-xl shadow-2xl w-56 overflow-hidden border border-gray-700">
                  <div class="flex items-center justify-between px-3 py-2 border-b border-gray-700">
                    <span class="text-white font-bold text-[13px] flex items-center gap-1">📋 証票種類</span>
                  </div>
                  <div class="p-2 space-y-0.5">
                     <div v-for="item in labelTypeLegend" :key="item.short"
                          class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800/60 transition-colors">
                      <span class="inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold text-white"
                            :class="item.bgClass">{{ item.short }}</span>
                      <span class="text-gray-200 text-[12px]">{{ item.label }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 警告ポップオーバー -->
              <div v-if="legendModalType === 'warning' && col.key === 'warning'"
                   class="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-[110] transform scale-[0.9] origin-top">
                <div class="bg-gray-900/90 rounded-xl shadow-2xl w-60 overflow-hidden border border-gray-700">
                  <div class="flex items-center justify-between px-3 py-2 border-b border-gray-700">
                    <span class="text-white font-bold text-[13px] flex items-center gap-1">⚠️ 警告ラベル一覧</span>
                  </div>
                  <div class="p-2">
                    <div class="mb-2">
                       <div class="flex items-center gap-1 px-1.5 py-0.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        <span class="text-red-400 text-[14px] font-bold">エラー（赤）</span>
                      </div>
                      <div v-for="[, item] in errorLegend" :key="item.label"
                           class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800/60 transition-colors">
                        <span class="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                        <span class="text-gray-200 text-[12px]">{{ item.label }}</span>
                      </div>
                    </div>
                    <div>
                      <div class="flex items-center gap-1 px-1.5 py-0.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                        <span class="text-yellow-400 text-[14px] font-bold">注意（黄）</span>
                      </div>
                      <div v-for="[, item] in warnLegend" :key="item.label"
                           class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800/60 transition-colors">
                        <span class="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0"></span>
                        <span class="text-gray-200 text-[12px]">{{ item.label }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </span>
          </span>
        </template>
      </div>
    </div>

    <!-- テーブルボディ -->
    <div class="flex-1 overflow-y-scroll">
      <template v-for="(journal, journalIndex) in journals" :key="journal.id">
        <div v-for="(row, rowIndex) in getCombinedRows(journal)" :key="`${journal.id}-${rowIndex}`"
             :class="[
               'flex text-[10px] border-b border-gray-200',
               getRowBackground(journal)
             ]">

          <!-- 列定義駆動ボディ（v-for by journalColumns） -->
          <template v-for="col in journalColumns" :key="col.key">

            <!-- checkbox型 -->
            <div v-if="col.type === 'checkbox'" :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200']">
              <input v-if="rowIndex === 0" type="checkbox" class="w-2.5 h-2.5 cursor-pointer"
                     :checked="selectedIds.has(journal.id)" @change="toggleSelect(journal.id)">
            </div>

            <!-- index型 -->
            <template v-else-if="col.type === 'index'">
              <div v-if="rowIndex === 0" :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200 font-mono text-gray-600 text-[9px]']">
                {{ journalIndex + 1 }}
              </div>
              <div v-else :class="[col.width, 'border-r border-gray-200']"></div>
            </template>

            <!-- component型（col.key別に既存ロジック維持） -->
            <template v-else-if="col.type === 'component'">

              <!-- 写真 -->
              <template v-if="col.key === 'photo'">
                <div v-if="rowIndex === 0" :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200']">
                  <i class="fa-solid fa-camera text-[10px] text-gray-800 cursor-pointer"
                     title="写真（クリックで固定）"
                     @mouseenter="showImageModal(journal.id, journal.receipt_id)"
                     @mouseleave="hideImageModal"
                     @click="togglePinModal(journal.id, journal.receipt_id)"></i>
                </div>
                <div v-else :class="[col.width, 'border-r border-gray-200']"></div>
              </template>

              <!-- 過去仕訳 -->
              <template v-else-if="col.key === 'pastJournal'">
                <div v-if="rowIndex === 0" :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200']">
                  <i v-if="hasPastJournal(journal)"
                     class="fa-solid fa-magnifying-glass text-[10px] text-gray-600 cursor-pointer"
                     title="過去仕訳（クリックでピン留め）"
                     @mouseenter="showPastJournalSearchModal()"
                     @mouseleave="hidePastJournalSearchModal()"
                     @click="togglePastJournalSearchModalPin()"></i>
                </div>
                <div v-else :class="[col.width, 'border-r border-gray-200']"></div>
              </template>

              <!-- コメント（staff_notesベース） -->
              <template v-else-if="col.key === 'comment'">
                <div v-if="rowIndex === 0" :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200 cursor-pointer']" @click="openCommentModal(journal.id)">
                  <i v-if="hasAnyStaffNote(journal)" class="fa-solid fa-comment-dots text-[10px] text-emerald-600"></i>
                  <i v-else class="fa-solid fa-comment-dots text-[10px] text-gray-300 opacity-50"></i>
                </div>
                <div v-else :class="[col.width, 'border-r border-gray-200']"></div>
              </template>

              <!-- 要対応（4FAアイコン + ホバーポップアップ） -->
              <template v-else-if="col.key === 'needAction'">
                <div v-if="rowIndex === 0" :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200 gap-1']">
                  <template v-for="noteKey in staffNoteKeys" :key="noteKey">
                    <div class="relative"
                         @mouseenter="showNeedPopup(journal.id, noteKey)"
                         @mouseleave="scheduleHideNeedPopup()">
                      <button
                        @click="toggleStaffNote(journal.id, noteKey)"
                        :class="[
                          getStaffNoteEnabled(journal, noteKey) ? staffNoteConfig[noteKey].activeColor : 'text-gray-300 opacity-50',
                          'hover:scale-125 transition-transform text-[11px] cursor-pointer'
                        ]"

                      >
                        <i :class="['fa-solid', staffNoteConfig[noteKey].icon]"></i>
                      </button>
                      <!-- ホバーポップアップ（JS制御、マウスオーバーで消えない） -->
                      <div v-if="needPopupJournalId === journal.id && needPopupKey === noteKey && getStaffNoteEnabled(journal, noteKey) && (getStaffNoteText(journal, noteKey) || getStaffNoteChatworkUrl(journal, noteKey))"
                           class="absolute z-20 bg-blue-50 border-2 border-blue-400 rounded p-2 shadow-xl text-[10px] w-56 top-full left-1/2 -translate-x-1/2 mt-1"
                           @mouseenter="cancelHideNeedPopup()"
                           @mouseleave="scheduleHideNeedPopup()">
                        <div class="font-bold text-blue-900 mb-1">
                          <i :class="['fa-solid', staffNoteConfig[noteKey].icon, 'text-xs mr-1']" :style="{ color: staffNoteConfig[noteKey].hoverIconColor }"></i>
                          {{ staffNoteConfig[noteKey].label }}
                        </div>
                        <div v-if="getStaffNoteText(journal, noteKey)" class="text-gray-700">{{ getStaffNoteText(journal, noteKey) }}</div>
                        <div v-if="getStaffNoteChatworkUrl(journal, noteKey)" class="mt-1">
                          <a :href="getStaffNoteChatworkUrl(journal, noteKey)" target="_blank" rel="noopener noreferrer"
                             class="text-blue-600 underline hover:text-blue-800 break-all">
                            <i class="fa-solid fa-arrow-up-right-from-square text-[8px] mr-0.5"></i>
                            Chatworkで確認
                          </a>
                        </div>
                        <div v-if="journal.staff_notes_author" class="text-gray-500 mt-1 text-[9px]">担当: {{ journal.staff_notes_author }}</div>
                      </div>
                    </div>
                  </template>
                </div>
                <div v-else :class="[col.width, 'border-r border-gray-200']"></div>
              </template>

              <!-- 証票 -->
              <template v-else-if="col.key === 'labelType'">
                <div v-if="rowIndex === 0" :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200 gap-0.5']">
                  <template v-for="label in journal.labels" :key="label">
                    <span v-if="labelKeyMap[label]"
                          class="inline-flex items-center justify-center w-4 h-4 rounded text-[8px] font-bold text-white cursor-default"
                          :class="labelKeyMap[label].bgClass"
                          @mouseenter="showTooltip($event, labelKeyMap[label].label)"
                          @mouseleave="hideTooltip()">{{ labelKeyMap[label].short }}</span>
                  </template>
                </div>
                <div v-else :class="[col.width, 'border-r border-gray-200']"></div>
              </template>

              <!-- 警告（STREAMED風: 赤△！統一、JS制御ツールチップ） -->
              <template v-else-if="col.key === 'warning'">
                <div v-if="rowIndex === 0"
                     :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200']">
                  <i v-if="journal.labels.some((l: string) => warningLabelMap[l])"
                     class="fa-solid fa-triangle-exclamation text-[10px] text-red-600 cursor-default"
                     @mouseenter="showWarningTooltip($event, journal.labels)"
                     @mouseleave="hideTooltip()"></i>
                </div>
                <div v-else :class="[col.width, 'border-r border-gray-200']"></div>
              </template>

              <!-- 学習 -->
              <template v-else-if="col.key === 'rule'">
                <div v-if="rowIndex === 0" :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200']">
                  <i v-if="journal.labels.includes('RULE_APPLIED')" class="fa-solid fa-graduation-cap text-[10px] text-green-600 cursor-default"
                     @mouseenter="showTooltip($event, '学習適用済み')"
                     @mouseleave="hideTooltip()"></i>
                  <i v-if="journal.labels.includes('RULE_AVAILABLE')" class="fa-solid fa-lightbulb text-[10px] text-blue-500 cursor-default"
                     @mouseenter="showTooltip($event, '学習できます')"
                     @mouseleave="hideTooltip()"></i>
                </div>
                <div v-else :class="[col.width, 'border-r border-gray-200']"></div>
              </template>

              <!-- クレ払い -->
              <template v-else-if="col.key === 'creditCardPayment'">
                <div v-if="rowIndex === 0" :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200']">
                  <span v-if="journal.is_credit_card_payment" class="text-[12px] cursor-default"
                        @mouseenter="showTooltip($event, 'クレジットカード払い')"
                        @mouseleave="hideTooltip()">💳</span>
                </div>
                <div v-else :class="[col.width, 'border-r border-gray-200']"></div>
              </template>

              <!-- 軽減 -->
              <template v-else-if="col.key === 'taxRate'">
                <div v-if="rowIndex === 0" :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200']">
                  <span v-if="journal.labels.includes('MULTI_TAX_RATE')" class="text-[9px] font-bold text-green-600 bg-green-50 px-1 rounded">軽</span>
                </div>
                <div v-else :class="[col.width, 'border-r border-gray-200']"></div>
              </template>

              <!-- 証票メモ（journal.memo truthy判定、アイコンのみ） -->
              <template v-else-if="col.key === 'memo'">
                <div v-if="rowIndex === 0" :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200']">
                  <i v-if="journal.memo" class="fa-solid fa-pencil text-[10px] text-gray-600 cursor-default"
                     @mouseenter="showTooltip($event, '証票にメモあり')"
                     @mouseleave="hideTooltip()"></i>
                </div>
                <div v-else :class="[col.width, 'border-r border-gray-200']"></div>
              </template>

              <!-- 適格 -->
              <template v-else-if="col.key === 'invoice'">
                <div v-if="rowIndex === 0" :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200']">
                  <span v-if="journal.labels.includes('INVOICE_QUALIFIED')" class="text-green-600 text-sm font-bold">◯</span>
                  <span v-else-if="journal.labels.includes('INVOICE_NOT_QUALIFIED')" class="text-red-600 text-sm font-bold">✕</span>
                </div>
                <div v-else :class="[col.width, 'border-r border-gray-200']"></div>
              </template>

            </template>

            <!-- text型 -->
            <template v-else-if="col.type === 'text'">
              <!-- journal-level（keyにドットなし）: rowIndex===0のみ表示 -->
              <template v-if="!col.key.includes('.')">
                <div v-if="rowIndex === 0" :class="[col.width, 'p-0.5 flex items-center border-r border-gray-200', col.key === 'transaction_date' ? 'justify-center text-[8px]' : '']">
                  {{ col.key === 'transaction_date' ? formatDate(String(getValue(journal, col.key))) : getValue(journal, col.key) }}
                </div>
                <div v-else :class="[col.width, 'border-r border-gray-200']"></div>
              </template>
              <!-- entry-level（keyにドットあり）: 全row表示 -->
              <div v-else :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200 text-[10px]']">
                {{ getValue(row, col.key) || '' }}
              </div>
            </template>

            <!-- amount型 -->
            <template v-else-if="col.type === 'amount'">
              <div :class="[col.width, 'p-0.5 flex items-center justify-end border-r border-gray-200 font-mono text-[10px]']">
                {{ getValue(row, col.key) != null ? Number(getValue(row, col.key)).toLocaleString() : '' }}
              </div>
            </template>

            <!-- action型（ワークフローハブ） -->
            <div v-else-if="col.type === 'action'" :class="[col.width, 'p-0.5 flex items-center justify-center relative']">
              <!-- ⋮ ボタン（rowIndex===0のみ活性） -->
              <span v-if="rowIndex === 0"
                    class="text-gray-500 hover:text-blue-600 cursor-pointer text-xs font-bold"
                    :title="col.label"
                    @click.stop="toggleDropdown(journal.id)">
                {{ col.icon }}
              </span>

              <!-- ドロップダウンメニュー（w-44固定、拡張対応） -->
              <div v-if="rowIndex === 0 && openDropdownId === journal.id"
                   class="absolute right-full top-0 z-50 w-44 bg-white border border-gray-300 rounded shadow-lg text-[10px] whitespace-nowrap"
                   @click.stop>

                <!-- ゴミ箱状態 → 復活のみ -->
                <template v-if="journal.deleted_at !== null">
                  <button @click="restoreJournal(journal)"
                          class="w-full px-2 py-1.5 text-left hover:bg-green-50 text-green-700 font-bold flex items-center gap-1">
                    ♻️ 復活
                  </button>
                </template>

                <!-- 通常状態 → フルメニュー -->
                <template v-else>
                  <!-- ────── セクション1: 状態トグル（軽い操作） ────── -->

                  <!-- 未読/既読トグル（並列濃淡） -->
                  <div class="flex border-b border-gray-200">
                    <button @click="setReadStatus(journal, false)"
                            :disabled="journal.status === 'exported'"
                            :class="['flex-1 px-2 py-1.5 text-left flex items-center gap-1',
                                     journal.status === 'exported' ? 'text-gray-300 cursor-not-allowed' :
                                     !journal.is_read ? 'font-bold text-gray-800 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-100']">
                      📖 未読
                    </button>
                    <button @click="setReadStatus(journal, true)"
                            :disabled="journal.status === 'exported'"
                            :class="['flex-1 px-2 py-1.5 text-left flex items-center gap-1',
                                     journal.status === 'exported' ? 'text-gray-300 cursor-not-allowed' :
                                     journal.is_read ? 'font-bold text-gray-800 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-100']">
                      📖 既読
                    </button>
                  </div>

                  <!-- 対象/対象外トグル（並列濃淡） -->
                  <div class="flex border-b border-gray-200">
                    <button @click="setExportExclude(journal, false)"
                            :disabled="journal.status === 'exported'"
                            :class="['flex-1 px-2 py-1.5 text-left flex items-center gap-1',
                                     journal.status === 'exported' ? 'text-gray-300 cursor-not-allowed' :
                                     !journal.labels.includes('EXPORT_EXCLUDE') ? 'font-bold text-gray-800 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-100']">
                      📤 対象
                    </button>
                    <button @click="setExportExclude(journal, true)"
                            :disabled="journal.status === 'exported'"
                            :class="['flex-1 px-2 py-1.5 text-left flex items-center gap-1',
                                     journal.status === 'exported' ? 'text-gray-300 cursor-not-allowed' :
                                     journal.labels.includes('EXPORT_EXCLUDE') ? 'font-bold text-gray-800 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-100']">
                      📤 対象外
                    </button>
                  </div>

                  <!-- ────── セクション2: 単発操作（中の重さ） ────── -->

                  <button @click="copyJournal(journal, journalIndex)"
                          class="w-full px-2 py-1.5 text-left hover:bg-gray-100 flex items-center gap-1 border-b border-gray-200">
                    📋 コピー
                  </button>

                  <!-- ────── セクション3: 破壊操作（重い・赤・心理的距離） ────── -->
                  <!-- 制約: exported行はゴミ箱不可 -->

                  <button @click="trashJournal(journal)"
                          :disabled="journal.status === 'exported'"
                          :class="['w-full px-2 py-1.5 text-left flex items-center gap-1 border-b border-gray-200',
                                   journal.status === 'exported' ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-red-50 text-red-600']">
                    🗑 ゴミ箱
                  </button>

                  <!-- ────── セクション4: 拡張メニュー（プレースホルダー） ────── -->

                  <button disabled class="w-full px-2 py-1.5 text-left text-gray-300 cursor-not-allowed flex items-center gap-1">
                    ① 拡張メニュー
                  </button>
                  <button disabled class="w-full px-2 py-1.5 text-left text-gray-300 cursor-not-allowed flex items-center gap-1">
                    ② 拡張メニュー
                  </button>
                  <button disabled class="w-full px-2 py-1.5 text-left text-gray-300 cursor-not-allowed flex items-center gap-1">
                    ③ 拡張メニュー
                  </button>
                  <button disabled class="w-full px-2 py-1.5 text-left text-gray-300 cursor-not-allowed flex items-center gap-1">
                    ④ 拡張メニュー
                  </button>
                  <button disabled class="w-full px-2 py-1.5 text-left text-gray-300 cursor-not-allowed flex items-center gap-1">
                    ⑤ 拡張メニュー
                  </button>
                </template>
              </div>
            </div>

          </template>
        </div>
      </template>
    </div>

    <!-- フッター -->
    <div class="bg-gray-100 text-[9px] text-center py-1 border-t text-gray-600">
      1-30 / 150件 > >|
    </div>

    <!-- 画像モーダル -->
    <div v-if="modalImageUrl"
         class="fixed inset-0 z-40 pointer-events-none"
         @click="hideImageModal">
    </div>
    <div v-if="modalImageUrl"
         ref="imageModalRef"
         :style="{ width: `${actualModalWidth}px`, height: `${actualModalHeight}px`, top: imageModalPos.top + 'px', left: imageModalPos.left + 'px', zIndex: imageModalZ }"
         class="fixed bg-white rounded-lg shadow-2xl flex flex-col pointer-events-auto">
      <!-- ドラッグハンドル（ヘッダー） -->
      <div class="bg-blue-100 px-3 py-1.5 flex justify-between items-center cursor-move rounded-t-lg select-none"
           @mousedown="startImageDrag">
        <span class="text-xs font-bold text-gray-900">画像プレビュー <span class="font-normal text-amber-600">※移動できます</span></span>
        <button @click="closeModal"
                class="text-gray-500 hover:text-gray-700">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>
      <!-- ツールバー -->
      <div class="flex items-center gap-1 px-2 py-1 bg-gray-100 border-b border-gray-200">
        <button @click.stop="rotationAngle = (rotationAngle + 90) % 360"
                class="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow transition-colors"
                title="90度回転">
          <i class="fa-solid fa-rotate-right text-xs"></i>
        </button>
        <button @click.stop="zoomIn"
                class="bg-green-500 hover:bg-green-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow transition-colors"
                title="拡大">
          <i class="fa-solid fa-magnifying-glass-plus text-xs"></i>
        </button>
        <button @click.stop="zoomOut"
                class="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow transition-colors"
                title="縮小">
          <i class="fa-solid fa-magnifying-glass-minus text-xs"></i>
        </button>
      </div>
      <!-- 画像表示エリア -->
      <div class="flex-1 flex items-center justify-center overflow-hidden rounded-b-lg">
        <img :src="modalImageUrl"
             alt="領収書"
             :style="{
               transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotationAngle}deg) scale(${zoomScale})`,
               imageOrientation: 'from-image',
               cursor: isDragging ? 'grabbing' : 'grab'
             }"
             class="max-w-full max-h-full object-contain transition-transform duration-300"
             @load="onImageLoad"
             @mousedown="onMouseDown"
             @mousemove="onMouseMove"
             @mouseup="onMouseUp"
             @mouseleave="onMouseUp" />
      </div>
    </div>

    <!-- 過去仕訳検索モーダル -->
    <div v-if="showPastJournalModal"
         ref="pastJournalModalRef"
         :style="{ top: pastJournalPos.top + 'px', left: pastJournalPos.left + 'px', zIndex: pastJournalZ }"
         class="fixed bg-white rounded-lg shadow-2xl w-[600px] h-[600px] flex flex-col pointer-events-auto border-2 border-gray-300"
         @click.stop>
        <!-- モーダルヘッダー（ドラッグハンドル） -->
        <div class="bg-blue-100 px-4 py-3 border-b flex justify-between items-center cursor-move select-none rounded-t-lg"
             @mousedown="startPastJournalDrag">
          <h2 class="text-sm font-bold text-gray-900">過去仕訳検索 <span class="font-normal text-xs text-amber-600">※移動できます</span></h2>
          <button @click="closePastJournalModal()"
                  class="text-gray-500 hover:text-gray-700">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <!-- 検索条件 -->
        <div class="p-4 border-b bg-gray-50">
          <div class="grid grid-cols-3 gap-4 mb-3">
            <!-- 摘要 -->
            <div>
              <label class="text-xs text-gray-700 block mb-1">摘要</label>
              <input type="text"
                     v-model="pastJournalSearch.vendor"
                     placeholder="パーク宝小路"
                     class="w-full px-2 py-1 text-xs border rounded">
            </div>
          </div>

          <!-- 日付 -->
          <div class="mb-3">
            <label class="text-xs text-gray-700 block mb-1">日付</label>
            <div class="flex items-center gap-2">
              <input type="date"
                     v-model="pastJournalSearch.dateFrom"
                     class="w-40 px-2 py-1 text-xs border rounded">
              <span class="text-xs">〜</span>
              <input type="date"
                     v-model="pastJournalSearch.dateTo"
                     class="w-40 px-2 py-1 text-xs border rounded">
            </div>
          </div>

          <!-- 金額条件 -->
          <div class="mb-3">
            <label class="text-xs text-gray-700 block mb-1">金額条件</label>
            <div class="flex items-center gap-2">
              <select v-model="pastJournalSearch.amountCondition"
                      class="w-40 px-2 py-1 text-xs border rounded">
                <option value="">選択してください</option>
                <option value="equal">等しい</option>
                <option value="greater">以上</option>
                <option value="less">以下</option>
              </select>
              <input type="number"
                     v-model.number="pastJournalSearch.amount"
                     placeholder="金額を入力"
                     class="w-32 px-2 py-1 text-xs border rounded">
            </div>
          </div>

          <!-- 借方勘定科目、貸方勘定科目 -->
          <div class="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label class="text-xs text-gray-700 block mb-1">借方勘定科目</label>
              <select v-model="pastJournalSearch.debitAccount"
                      class="w-full px-2 py-1 text-xs border rounded">
                <option value="">選択してください</option>
                <option value="旅費交通費">旅費交通費</option>
                <option value="消耗品費">消耗品費</option>
                <option value="会議費">会議費</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-gray-700 block mb-1">貸方勘定科目</label>
              <select v-model="pastJournalSearch.creditAccount"
                      class="w-full px-2 py-1 text-xs border rounded">
                <option value="">選択してください</option>
                <option value="現金">現金</option>
                <option value="普通預金">普通預金</option>
                <option value="未払金">未払金</option>
              </select>
            </div>
          </div>

          <!-- 絞り込みボタン -->
          <div class="flex gap-2">
            <button @click="() => {/* TODO: searchPastJournals */}"
                    class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-xs">
              絞り込み
            </button>
          </div>
        </div>

        <!-- タブ -->
        <div class="flex border-b">
          <button @click="pastJournalTab = 'streamed'"
                  :class="[
                    'px-4 py-2 text-xs font-medium',
                    pastJournalTab === 'streamed'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  ]">
            システム上の過去仕訳
          </button>
          <button @click="pastJournalTab = 'accounting'"
                  :class="[
                    'px-4 py-2 text-xs font-medium',
                    pastJournalTab === 'accounting'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  ]">
            会計ソフトから取り込んだ過去仕訳
          </button>
        </div>

        <!-- 検索結果テーブル -->
        <div class="flex-1 overflow-auto p-4">
          <div class="text-xs text-gray-600 mb-2">
            行の背景色:
            <button @click="toggleOutputFilter('unexported')"
                    :class="[
                      'inline-block px-4 py-0.5 ml-2 text-xs cursor-pointer rounded',
                      outputFilter === 'unexported' ? 'bg-blue-200 border-2 border-blue-500 font-bold' : 'bg-blue-50 border border-blue-300'
                    ]">
              未出力
            </button>
            <button @click="toggleOutputFilter('exported')"
                    :class="[
                      'inline-block px-4 py-0.5 ml-2 text-xs cursor-pointer rounded',
                      outputFilter === 'exported' ? 'bg-gray-200 border-2 border-black font-bold' : 'bg-white border border-black'
                    ]">
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
              <tr v-for="(result, index) in paginatedPastJournals"
                  :key="index"
                  :class="result.status === 'exported' ? 'bg-white' : 'bg-blue-50'"
                  class="hover:bg-blue-100 cursor-pointer">
                <td class="border px-2 py-1 text-center">{{ result.transaction_date ? formatDate(result.transaction_date) : '-' }}</td>
                <td class="border px-2 py-1">{{ result.description }}</td>
                <td class="border px-2 py-1">{{ result.debit_entries[0]?.account || '' }}</td>
                <td class="border px-2 py-1">{{ result.debit_entries[0]?.sub_account || '' }}</td>
                <td class="border px-2 py-1 text-center">{{ resolveTaxCategoryName(result.debit_entries[0]?.tax_category_id) }}</td>
                <td class="border px-2 py-1">{{ result.credit_entries[0]?.account || '' }}</td>
                <td class="border px-2 py-1">{{ result.credit_entries[0]?.sub_account || '' }}</td>
                <td class="border px-2 py-1 text-center">{{ resolveTaxCategoryName(result.credit_entries[0]?.tax_category_id) }}</td>
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
            <button @click="goToPage(pastJournalPage - 1)"
                    :disabled="pastJournalPage <= 1"
                    class="px-2 py-1 text-xs border rounded"
                    :class="pastJournalPage <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'">
              &lt;
            </button>
            <button v-for="page in totalPages"
                    :key="page"
                    @click="goToPage(page)"
                    class="px-2 py-1 text-xs border rounded min-w-[28px]"
                    :class="page === pastJournalPage ? 'bg-blue-500 text-white border-blue-500 font-bold' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'">
              {{ page }}
            </button>
            <button @click="goToPage(pastJournalPage + 1)"
                    :disabled="pastJournalPage >= totalPages"
                    class="px-2 py-1 text-xs border rounded"
                    :class="pastJournalPage >= totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'">
              &gt;
            </button>
          </div>
        </div>
    </div>
  </div>

    <!-- コメントモーダル -->
    <div v-if="commentModalJournalId"
         ref="commentModalRef"
         class="fixed z-[90]"
         :style="{ left: commentModalPos.left + 'px', top: commentModalPos.top + 'px', zIndex: commentModalZ }">
      <div class="bg-white rounded-lg shadow-2xl border-2 border-blue-300 w-[480px]" @click.stop>
        <!-- ドラッグ可能ヘッダー -->
        <div @mousedown="startCommentDrag"
             class="bg-blue-100 px-3 py-2 rounded-t-lg cursor-move flex items-center justify-between select-none">
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
          <div class="text-xs text-gray-500 mb-3 bg-gray-50 rounded px-2 py-1 border border-gray-200">
            <i class="fa-solid fa-circle-info text-blue-400 mr-1"></i>
            ✓を入れるとテキスト入力欄が表示されます
          </div>
          <!-- ◆顧問先に確認 -->
          <div class="font-bold text-gray-800 mb-2 text-[11px]">◆ 顧問先に確認</div>
          <template v-for="noteKey in (['NEED_DOCUMENT', 'NEED_INFO'] as const)" :key="noteKey">
            <div class="mb-3 ml-2">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox"
                       :checked="getStaffNoteEnabled(commentModalJournal!, noteKey)"
                       @change="toggleStaffNoteInModal(noteKey)"
                       class="rounded border-gray-300">
                <i :class="['fa-solid', staffNoteConfig[noteKey].icon, staffNoteConfig[noteKey].activeColor, 'text-[11px]']"></i>
                <span class="text-gray-800">{{ staffNoteConfig[noteKey].label }}</span>
              </label>
              <div v-if="getStaffNoteEnabled(commentModalJournal!, noteKey)" class="ml-5 mt-1 space-y-1">
                <textarea v-model="commentModalJournal!.staff_notes![noteKey].text"
                          class="w-full border border-gray-300 rounded p-1.5 text-[10px] resize-none"
                          rows="2" placeholder="テキストを入力..."></textarea>
                <input v-model="commentModalJournal!.staff_notes![noteKey].chatworkUrl"
                       type="text" class="w-full border border-gray-300 rounded p-1 text-[10px]"
                       placeholder="Chatwork URL（任意）">
              </div>
            </div>
          </template>

          <!-- ◆社内で確認 -->
          <div class="font-bold text-gray-800 mb-2 mt-3 text-[11px]">◆ 社内で確認</div>
          <template v-for="noteKey in (['REMINDER', 'NEED_CONSULT'] as const)" :key="noteKey">
            <div class="mb-3 ml-2">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox"
                       :checked="getStaffNoteEnabled(commentModalJournal!, noteKey)"
                       @change="toggleStaffNoteInModal(noteKey)"
                       class="rounded border-gray-300">
                <i :class="['fa-solid', staffNoteConfig[noteKey].icon, staffNoteConfig[noteKey].activeColor, 'text-[11px]']"></i>
                <span class="text-gray-800">{{ staffNoteConfig[noteKey].label }}</span>
              </label>
              <div v-if="getStaffNoteEnabled(commentModalJournal!, noteKey)" class="ml-5 mt-1 space-y-1">
                <textarea v-model="commentModalJournal!.staff_notes![noteKey].text"
                          class="w-full border border-gray-300 rounded p-1.5 text-[10px] resize-none"
                          rows="2" placeholder="テキストを入力..."></textarea>
                <input v-model="commentModalJournal!.staff_notes![noteKey].chatworkUrl"
                       type="text" class="w-full border border-gray-300 rounded p-1 text-[10px]"
                       placeholder="Chatwork URL（任意）">
              </div>
            </div>
          </template>

          <!-- 担当名 -->
          <div class="border-t border-gray-200 pt-2 mt-2">
            <label class="text-[10px] text-gray-600 font-bold">担当名</label>
            <select v-model="commentModalAuthor" class="ml-2 border border-gray-300 rounded p-1 text-[10px]">
              <option v-for="staff in staffList" :key="staff" :value="staff">{{ staff }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 確認ダイアログ（モーダル） -->
    <div v-if="confirmDialog.show"
         class="fixed inset-0 z-[100] flex items-center justify-center bg-black/30"
         @click.self="confirmDialog.show = false">
      <div class="bg-white rounded-lg shadow-xl p-4 w-72 text-sm" @click.stop>
        <h3 class="font-bold mb-2 text-gray-800">{{ confirmDialog.title }}</h3>
        <p class="text-gray-600 mb-4 whitespace-pre-line text-xs">{{ confirmDialog.message }}</p>
        <div class="flex justify-end gap-2">
          <button @click="confirmDialog.show = false"
                  class="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 text-gray-600">
            キャンセル
          </button>
          <button @click="confirmDialog.onConfirm(); confirmDialog.show = false"
                  class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
            実行
          </button>
        </div>
      </div>
    </div>
    <!-- グローバルツールチップ（fixed、overflow親を越えて表示） -->
    <Teleport to="body">
      <div v-show="tooltipVisible"
           class="fixed z-[9999] pointer-events-none transition-opacity duration-100"
           :class="tooltipVisible ? 'opacity-100' : 'opacity-0'"
           :style="{ left: tooltipX + 'px', top: tooltipY + 'px', transform: 'translateX(-50%)' }">
        <div class="bg-gray-900/95 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
          <span v-if="tooltipText">{{ tooltipText }}</span>
          <span v-else-if="tooltipHtml" class="flex flex-col gap-0.5" v-html="tooltipHtml"></span>
        </div>
        <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-gray-900/95"></div>
      </div>
    </Teleport>


</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { TAX_CATEGORY_MASTER } from '@/shared/data/tax-category-master';
import { useDraggable } from '@/mocks/composables/useDraggable';
import { useCurrentUser, STAFF_LIST } from '@/mocks/composables/useCurrentUser';
import { journalColumns } from '@/mocks/columns/journalColumns';
import { mockJournalsPhase5 as fixtureData } from '../data/journal_test_fixture_30cases';
import { getReceiptImageUrl } from '../data/receipt_mock_data';
import type { JournalPhase5Mock, JournalEntryLine } from '../types/journal_phase5_mock.type';
import { createEmptyStaffNotes, STAFF_NOTE_KEYS } from '../types/staff_notes';
import type { StaffNoteKey } from '../types/staff_notes';
import MockNavBar from '@/mocks/components/MockNavBar.vue';

// ローカル可変データ（fixtureの深いコピー、Phase A用）
const localJournals = ref<JournalPhase5Mock[]>(
  JSON.parse(JSON.stringify(fixtureData))
);

// フィルタリング状態（チェックボックス）
const showUnexported = ref<boolean>(true);   // 未出力を表示（初期: ON）
const showExported = ref<boolean>(false);    // 出力済を表示（初期: OFF）
const showExcluded = ref<boolean>(false);    // 出力対象外を表示（初期: OFF）
const showTrashed = ref<boolean>(false);     // ゴミ箱を表示（初期: OFF）

// ────── 選択状態管理（一括操作バー用） ──────
const selectedIds = ref<Set<string>>(new Set());

// 確認ダイアログ
const confirmDialog = ref<{
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}>({ show: false, title: '', message: '', onConfirm: () => {} });

// 初回ヘルプ表示
const showSelectionHelp = ref(false);
const hasShownHelp = ref(false);

// ドロップダウン制御
const openDropdownId = ref<string | null>(null);

// 凡例モーダル
const legendModalType = ref<'labelType' | 'warning' | null>(null);

const labelTypeLegend = [
  { short: 'レ', label: 'レシート・領収証', bgClass: 'bg-emerald-600' },
  { short: '請', label: '請求書', bgClass: 'bg-blue-600' },
  { short: '交', label: '交通費', bgClass: 'bg-cyan-600' },
  { short: 'ク', label: 'クレジットカード', bgClass: 'bg-purple-600' },
  { short: '銀', label: '銀行明細', bgClass: 'bg-indigo-600' },
  { short: '医', label: '医療費', bgClass: 'bg-pink-600' },
  { short: '外', label: '仕訳対象外', bgClass: 'bg-gray-600' },
];

// ボディ用: ラベル名→バッジ情報マッピング
const labelKeyMap: Record<string, { short: string; label: string; bgClass: string }> = {
  RECEIPT:        { short: 'レ', label: 'レシート・領収証', bgClass: 'bg-emerald-600' },
  INVOICE:        { short: '請', label: '請求書', bgClass: 'bg-blue-600' },
  TRANSPORT:      { short: '交', label: '交通費', bgClass: 'bg-cyan-600' },
  CREDIT_CARD:    { short: 'ク', label: 'クレジットカード', bgClass: 'bg-purple-600' },
  BANK_STATEMENT: { short: '銀', label: '銀行明細', bgClass: 'bg-indigo-600' },
  MEDICAL:        { short: '医', label: '医療費', bgClass: 'bg-pink-600' },
  NOT_JOURNAL:    { short: '外', label: '仕訳対象外', bgClass: 'bg-gray-600' },
};

// 警告ラベルマップ: Single Source of Truth
// 統合版: MISSING_FIELD/UNREADABLE_FAILED/TAX_CALCULATION_ERROR を削除し、フィールド別ラベルに分離
// level: 'error'(赤) | 'warn'(黄) / label: 日本語定義（ホバーメッセージ） / color: アイコン色 / weight: ソート優先度
const warningLabelMap: Record<string, { level: 'error' | 'warn'; label: string; color: string; weight: number }> = {
  // エラー（赤）
  DEBIT_CREDIT_MISMATCH: { level: 'error', label: '借方貸方の合計額不一致', color: 'text-red-600', weight: 17 },
  DATE_UNKNOWN:          { level: 'error', label: '日付が不明', color: 'text-red-600', weight: 16 },
  ACCOUNT_UNKNOWN:       { level: 'error', label: '勘定科目が不明', color: 'text-red-600', weight: 15 },
  DUPLICATE_CONFIRMED:   { level: 'error', label: '完全重複（同一画像）', color: 'text-red-600', weight: 13 },
  MULTIPLE_VOUCHERS:     { level: 'error', label: '複数の証票あり', color: 'text-red-600', weight: 12 },
  AMOUNT_UNCLEAR:        { level: 'error', label: '内訳が不明瞭な金額あり', color: 'text-red-600', weight: 14 },
  // 注意（黄）
  DUPLICATE_SUSPECT:     { level: 'warn', label: '重複疑い', color: 'text-yellow-600', weight: 6 },
  DATE_OUT_OF_RANGE:     { level: 'warn', label: '期間外日付', color: 'text-yellow-600', weight: 5 },
  UNREADABLE_ESTIMATED:  { level: 'warn', label: '判読困難（AI推測値）', color: 'text-yellow-600', weight: 4 },
  MEMO_DETECTED:         { level: 'warn', label: '手書きメモ検出', color: 'text-yellow-600', weight: 3 },
};

// ======== グローバルツールチップ（position:fixed、overflow親を越えて表示） ========
const tooltipVisible = ref(false);
const tooltipText = ref('');
const tooltipHtml = ref('');
const tooltipX = ref(0);
const tooltipY = ref(0);

function showTooltip(event: MouseEvent, text: string) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  tooltipText.value = text;
  tooltipHtml.value = '';
  tooltipX.value = rect.left + rect.width / 2;
  tooltipY.value = rect.bottom + 6;
  tooltipVisible.value = true;
}

function showWarningTooltip(event: MouseEvent, labels: string[]) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const warnings = labels.filter(l => warningLabelMap[l]);
  tooltipHtml.value = warnings.map(l => {
    const w = warningLabelMap[l];
    const dotColor = w?.level === 'error' ? 'bg-red-400' : 'bg-yellow-400';
    return `<span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}"></span>${w?.label}</span>`;
  }).join('');
  tooltipText.value = '';
  tooltipX.value = rect.left + rect.width / 2;
  tooltipY.value = rect.bottom + 6;
  tooltipVisible.value = true;
}

function hideTooltip() {
  tooltipVisible.value = false;
}

// ポップオーバー凡例: warningLabelMapから動的生成
const errorLegend = Object.entries(warningLabelMap).filter(([, v]) => v.level === 'error');
const warnLegend = Object.entries(warningLabelMap).filter(([, v]) => v.level === 'warn');

function toggleDropdown(journalId: string) {
  openDropdownId.value = openDropdownId.value === journalId ? null : journalId;
}

function closeDropdown() {
  openDropdownId.value = null;
}

// ────── ワークフローハブ操作（レベル②ローカル状態変更） ──────

function setReadStatus(journal: JournalPhase5Mock, value: boolean) {
  const target = localJournals.value.find(j => j.id === journal.id);
  if (!target || target.is_read === value) return; // 同じ状態なら何もしない
  closeDropdown();
  confirmDialog.value = {
    show: true,
    title: value ? '既読にする' : '未読にする',
    message: `「${journal.description}」を${value ? '既読' : '未読'}にしますか？`,
    onConfirm: () => {
      target.is_read = value;
      console.log(`[DD] 既読変更: ${journal.id} → is_read=${value}`);
      confirmDialog.value = {
        show: true, title: '完了',
        message: `${value ? '既読' : '未読'}にしました。`,
        onConfirm: () => {}
      };
    }
  };
}

function setExportExclude(journal: JournalPhase5Mock, exclude: boolean) {
  const target = localJournals.value.find(j => j.id === journal.id);
  if (!target) return;
  const hasLabel = target.labels.includes('EXPORT_EXCLUDE');
  if (exclude === hasLabel) return; // 同じ状態なら何もしない
  closeDropdown();
  confirmDialog.value = {
    show: true,
    title: exclude ? '出力対象外にする' : '出力対象にする',
    message: `「${journal.description}」を${exclude ? '出力対象外' : '出力対象'}にしますか？`,
    onConfirm: () => {
      if (exclude) {
        target.labels.push('EXPORT_EXCLUDE');
        console.log(`[DD] 出力対象外に変更: ${journal.id}`);
      } else {
        const idx = target.labels.indexOf('EXPORT_EXCLUDE');
        if (idx >= 0) target.labels.splice(idx, 1);
        console.log(`[DD] 出力対象に変更: ${journal.id}`);
      }
      confirmDialog.value = {
        show: true, title: '完了',
        message: `${exclude ? '出力対象外' : '出力対象'}にしました。`,
        onConfirm: () => {}
      };
    }
  };
}

function copyJournal(journal: JournalPhase5Mock, _index: number) {
  closeDropdown();
  confirmDialog.value = {
    show: true,
    title: 'コピー',
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
      const originalIndex = localJournals.value.findIndex(j => j.id === journal.id);
      if (originalIndex >= 0) {
        localJournals.value.splice(originalIndex + 1, 0, clone);
      }
      console.log(`[DD] コピー作成: ${clone.id} (元: ${journal.id})`);
      confirmDialog.value = {
        show: true, title: 'コピー完了',
        message: '未出力にコピーしました。',
        onConfirm: () => {}
      };
    }
  };
}

function trashJournal(journal: JournalPhase5Mock) {
  // 制約: 出力済みはゴミ箱不可
  if (journal.status === 'exported') {
    console.warn(`[DD] exported journal cannot be trashed: ${journal.id}`);
    return;
  }
  closeDropdown();
  confirmDialog.value = {
    show: true, title: 'ゴミ箱に移動',
    message: `「${journal.description}」をゴミ箱に移動しますか？`,
    onConfirm: () => {
      const target = localJournals.value.find(j => j.id === journal.id);
      if (!target) return;
      target.deleted_at = new Date().toISOString();
      console.log(`[DD] ゴミ箱: ${journal.id}`);
      confirmDialog.value = {
        show: true, title: '完了',
        message: `「${journal.description}」をゴミ箱に移動しました。`,
        onConfirm: () => {}
      };
    }
  };
}

function restoreJournal(journal: JournalPhase5Mock) {
  const target = localJournals.value.find(j => j.id === journal.id);
  if (!target || target.deleted_at === null) return;
  closeDropdown();
  confirmDialog.value = {
    show: true,
    title: '復活',
    message: `「${journal.description}」を復活しますか？`,
    onConfirm: () => {
      target.deleted_at = null;
      console.log(`[DD] 復活: ${journal.id}`);
      confirmDialog.value = {
        show: true, title: '復活完了',
        message: `「${journal.description}」を復活しました。`,
        onConfirm: () => {}
      };
    }
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
    setTimeout(() => { showSelectionHelp.value = false; }, 3000);
  }
}

function clearSelection() {
  selectedIds.value = new Set();
}

// ────── 一括操作関数（冪等 + 0件ガード） ──────

function bulkSetReadStatus(value: boolean) {
  const all = selectedJournals.value;
  const exportedCount = all.filter(j => j.status === 'exported').length;
  const targets = all.filter(j => j.status !== 'exported' && j.is_read !== value);
  // 0件ガード
  if (targets.length === 0) {
    confirmDialog.value = {
      show: true, title: '実行不可',
      message: exportedCount > 0
        ? `選択: ${all.length}件 / 出力済み: ${exportedCount}件（スキップ）\n実行可能な仕訳がありません。`
        : `すべて既に${value ? '既読' : '未読'}状態です。`,
      onConfirm: () => {}
    };
    return;
  }
  // 確認ダイアログ
  const capturedTargets = [...targets];
  const confirmMsg = exportedCount > 0
    ? `選択: ${all.length}件 / 出力済み: ${exportedCount}件（スキップ）/ 実行対象: ${capturedTargets.length}件`
    : `${capturedTargets.length}件を${value ? '既読' : '未読'}にしますか？`;
  confirmDialog.value = {
    show: true,
    title: value ? '既読にする' : '未読にする',
    message: confirmMsg,
    onConfirm: () => {
      capturedTargets.forEach(j => { j.is_read = value; });
      console.log(`[一括] ${value ? '既読' : '未読'}: ${capturedTargets.length}件変更`);
      const count = capturedTargets.length;
      clearSelection();
      confirmDialog.value = {
        show: true, title: '完了',
        message: `${count}件を${value ? '既読' : '未読'}にしました。`,
        onConfirm: () => {}
      };
    }
  };
}

function bulkSetExportExclude(exclude: boolean) {
  const all = selectedJournals.value;
  const exportedCount = all.filter(j => j.status === 'exported').length;
  const targets = all.filter(j => {
    if (j.status === 'exported') return false;
    return exclude !== j.labels.includes('EXPORT_EXCLUDE');
  });
  // 0件ガード
  if (targets.length === 0) {
    confirmDialog.value = {
      show: true,
      title: '実行不可',
      message: exportedCount > 0
        ? `選択: ${all.length}件 / 出力済み: ${exportedCount}件（スキップ）\n実行可能な仕訳がありません。`
        : '実行可能な仕訳がありません。',
      onConfirm: () => {}
    };
    return;
  }
  // exported含む場合の制限メッセージ
  if (exportedCount > 0) {
    const capturedTargets = [...targets]; // クロージャキャプチャ
    confirmDialog.value = {
      show: true,
      title: exclude ? '出力対象外に変更' : '出力対象に変更',
      message: `選択: ${all.length}件 / 出力済み: ${exportedCount}件（スキップ）/ 実行対象: ${capturedTargets.length}件`,
      onConfirm: () => {
        capturedTargets.forEach(j => {
          if (exclude && !j.labels.includes('EXPORT_EXCLUDE')) {
            j.labels.push('EXPORT_EXCLUDE');
          } else if (!exclude) {
            const idx = j.labels.indexOf('EXPORT_EXCLUDE');
            if (idx >= 0) j.labels.splice(idx, 1);
          }
        });
        console.log(`[一括] ${exclude ? '対象外' : '対象'}: ${capturedTargets.length}件変更`);
        const count = capturedTargets.length;
        clearSelection();
        confirmDialog.value = {
          show: true, title: '完了',
          message: `${count}件を${exclude ? '出力対象外' : '出力対象'}にしました。`,
          onConfirm: () => {}
        };
      }
    };
    return;
  }
  // exported含まない場合も確認ダイアログ
  const capturedTargets = [...targets];
  confirmDialog.value = {
    show: true,
    title: exclude ? '出力対象外にする' : '出力対象にする',
    message: `${capturedTargets.length}件を${exclude ? '出力対象外' : '出力対象'}にしますか？`,
    onConfirm: () => {
      capturedTargets.forEach(j => {
        if (exclude && !j.labels.includes('EXPORT_EXCLUDE')) {
          j.labels.push('EXPORT_EXCLUDE');
        } else if (!exclude) {
          const idx = j.labels.indexOf('EXPORT_EXCLUDE');
          if (idx >= 0) j.labels.splice(idx, 1);
        }
      });
      console.log(`[一括] ${exclude ? '対象外' : '対象'}: ${capturedTargets.length}件変更`);
      const count = capturedTargets.length;
      clearSelection();
      confirmDialog.value = {
        show: true, title: '完了',
        message: `${count}件を${exclude ? '出力対象外' : '出力対象'}にしました。`,
        onConfirm: () => {}
      };
    }
  };
}

function showBulkCopyDialog() {
  const targets = [...selectedJournals.value]; // クロージャキャプチャ（コピーはexportedスキップなし）
  confirmDialog.value = {
    show: true,
    title: 'コピー',
    message: `${targets.length}件を未出力にコピーしますか？`,
    onConfirm: () => {
      targets.forEach(j => {
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
        const originalIndex = localJournals.value.findIndex(lj => lj.id === j.id);
        if (originalIndex >= 0) {
          localJournals.value.splice(originalIndex + 1, 0, clone);
        }
      });
      console.log(`[一括] コピー: ${targets.length}件`);
      clearSelection();
      confirmDialog.value = {
        show: true, title: 'コピー完了',
        message: `${targets.length}件を未出力にコピーしました。`,
        onConfirm: () => {}
      };
    }
  };
}

function showBulkTrashDialog() {
  const all = selectedJournals.value;
  const exportedCount = all.filter(j => j.status === 'exported').length;
  const targets = all.filter(j => j.status !== 'exported' && j.deleted_at === null);
  // 0件ガード
  if (targets.length === 0) {
    confirmDialog.value = {
      show: true,
      title: '実行不可',
      message: exportedCount > 0
        ? `選択: ${all.length}件 / 出力済み: ${exportedCount}件（スキップ）\n実行可能な仕訳がありません。`
        : '実行可能な仕訳がありません。',
      onConfirm: () => {}
    };
    return;
  }
  const capturedTargets = [...targets]; // クロージャキャプチャ
  const msg = exportedCount > 0
    ? `選択: ${all.length}件 / 出力済み: ${exportedCount}件（スキップ）/ 実行対象: ${capturedTargets.length}件\nゴミ箱に移動しますか？`
    : `${capturedTargets.length}件をゴミ箱に移動しますか？`;
  confirmDialog.value = {
    show: true,
    title: 'ゴミ箱',
    message: msg,
    onConfirm: () => {
      const now = new Date().toISOString();
      capturedTargets.forEach(j => {
        j.deleted_at = now;
      });
      console.log(`[一括] ゴミ箱: ${capturedTargets.length}件`);
      clearSelection();
      confirmDialog.value = {
        show: true, title: '完了',
        message: `${capturedTargets.length}件をゴミ箱に移動しました。`,
        onConfirm: () => {}
      };
    }
  };
}

// ソート状態
const sortColumn = ref<string | null>(null);
const sortDirection = ref<'asc' | 'desc'>('asc');

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
const { position: imageModalPos, zIndex: imageModalZ, startDrag: startImageDrag } = useDraggable(imageModalRef);

// 過去仕訳検索モーダル用
const pastJournalModalRef = ref<HTMLElement | null>(null);
const { position: pastJournalPos, zIndex: pastJournalZ, startDrag: startPastJournalDrag } = useDraggable(pastJournalModalRef);

// コメントモーダル用
const commentModalRef = ref<HTMLElement | null>(null);
const { position: commentModalPos, zIndex: commentModalZ, startDrag: startCommentDrag } = useDraggable(commentModalRef);
const showPastJournalModal = ref<boolean>(false);
const pastJournalTab = ref<'streamed' | 'accounting'>('streamed');
const pastJournalSearch = ref({
  vendor: '',
  dateFrom: '',
  dateTo: '',
  amountCondition: '',
  amount: null as number | null,
  debitAccount: '',
  creditAccount: ''
});

const isPastJournalModalPinned = ref<boolean>(false);
const outputFilter = ref<'all' | 'unexported' | 'exported'>('all');
const pastJournalPage = ref<number>(1);
const PAST_JOURNAL_PAGE_SIZE = 50;

function showPastJournalSearchModal() {
  showPastJournalModal.value = true;
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
    results = results.filter(j =>
      j.description.includes(pastJournalSearch.value.vendor)
    );
  }

  // 日付範囲フィルタ
  if (pastJournalSearch.value.dateFrom) {
    results = results.filter(j => j.transaction_date !== null && j.transaction_date >= pastJournalSearch.value.dateFrom);
  }
  if (pastJournalSearch.value.dateTo) {
    results = results.filter(j => j.transaction_date !== null && j.transaction_date <= pastJournalSearch.value.dateTo);
  }

  // 金額フィルタ
  if (pastJournalSearch.value.amount !== null && pastJournalSearch.value.amountCondition) {
    results = results.filter(j => {
      const debitTotal = j.debit_entries.reduce((sum, e) => sum + (e.amount ?? 0), 0);
      const creditTotal = j.credit_entries.reduce((sum, e) => sum + (e.amount ?? 0), 0);
      const amount = Math.max(debitTotal, creditTotal);

      switch (pastJournalSearch.value.amountCondition) {
        case 'equal': return amount === pastJournalSearch.value.amount;
        case 'greater': return amount >= (pastJournalSearch.value.amount || 0);
        case 'less': return amount <= (pastJournalSearch.value.amount || 0);
        default: return true;
      }
    });
  }

  // 借方勘定科目フィルタ
  if (pastJournalSearch.value.debitAccount) {
    results = results.filter(j =>
      j.debit_entries.some(e => e.account === pastJournalSearch.value.debitAccount)
    );
  }

  // 貸方勘定科目フィルタ
  if (pastJournalSearch.value.creditAccount) {
    results = results.filter(j =>
      j.credit_entries.some(e => e.account === pastJournalSearch.value.creditAccount)
    );
  }

  // タブによる表示制御
  if (pastJournalTab.value === 'accounting') {
    return [];  // 会計ソフトデータは未実装
  }

  // 出力ステータスフィルタ
  if (outputFilter.value === 'unexported') {
    results = results.filter(j => j.status === null);
  } else if (outputFilter.value === 'exported') {
    results = results.filter(j => j.status === 'exported');
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

function toggleOutputFilter(filter: 'unexported' | 'exported') {
  if (outputFilter.value === filter) {
    outputFilter.value = 'all';
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

// 回転角度に応じてモーダルサイズを調整
const actualModalWidth = computed(() => {
  return (rotationAngle.value === 90 || rotationAngle.value === 270)
    ? baseModalHeight.value
    : baseModalWidth.value;
});

const actualModalHeight = computed(() => {
  return (rotationAngle.value === 90 || rotationAngle.value === 270)
    ? baseModalWidth.value
    : baseModalHeight.value;
});

function showImageModal(journalId: string, receiptId: string | null) {
  hoveredJournalId.value = journalId;
  modalImageUrl.value = getReceiptImageUrl(receiptId);
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

function togglePinModal(journalId: string, receiptId: string | null) {
  if (isModalPinned.value && hoveredJournalId.value === journalId) {
    // すでに固定されている場合は閉じる
    isModalPinned.value = false;
    hoveredJournalId.value = null;
    modalImageUrl.value = null;
  } else {
    // 固定モードに切り替え
    isModalPinned.value = true;
    hoveredJournalId.value = journalId;
    modalImageUrl.value = getReceiptImageUrl(receiptId);
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

const journals = computed(() => {
  const result = [...localJournals.value].sort((a, b) => {
    return new Date(a.transaction_date ?? '9999-12-31').getTime() - new Date(b.transaction_date ?? '9999-12-31').getTime();
  });

  if (sortColumn.value) {
    result.sort((a, b) => {
      type SortValue = number | string;
      let aVal: SortValue = 0;
      let bVal: SortValue = 0;

      switch (sortColumn.value) {
        case 'display_order':
          aVal = a.display_order;
          bVal = b.display_order;
          break;
        case 'has_photo':
          aVal = a.receipt_id ? 1 : 0;
          bVal = b.receipt_id ? 1 : 0;
          break;
        case 'staff_notes': {
          // staff_notesのいずれかがenabledならソート上位
          const hasNotes = (j: JournalPhase5Mock): number => {
            if (!j.staff_notes) return 0;
            return Object.values(j.staff_notes).some(n => n.enabled) ? 1 : 0;
          };
          aVal = hasNotes(a);
          bVal = hasNotes(b);
          break;
        }
        case 'past_journal':
          aVal = localJournals.value.findIndex(j => j.id === a.id) < 25 ? 1 : 0;
          bVal = localJournals.value.findIndex(j => j.id === b.id) < 25 ? 1 : 0;
          break;
        case 'requires_action': {
          // staff_notesの重み付けソート: NEED_DOCUMENT(8) > NEED_INFO(4) > REMINDER(2) > NEED_CONSULT(1) > なし(0)
          const getNeedWeight = (j: JournalPhase5Mock): number => {
            if (!j.staff_notes) return 0;
            let w = 0;
            if (j.staff_notes.NEED_DOCUMENT?.enabled) w += 8;
            if (j.staff_notes.NEED_INFO?.enabled) w += 4;
            if (j.staff_notes.REMINDER?.enabled) w += 2;
            if (j.staff_notes.NEED_CONSULT?.enabled) w += 1;
            return w;
          };
          aVal = getNeedWeight(a);
          bVal = getNeedWeight(b);
          break;
        }
        case 'label_type':
          aVal = a.labels.join(',');
          bVal = b.labels.join(',');
          break;
        case 'warning':
          // 事故フラグの有無と重み付け: 赤色（エラー）＞黄色（警告）の順
          const getWarningWeight = (labels: string[]) => {
            for (const l of labels) {
              const entry = warningLabelMap[l];
              if (entry) return entry.weight;
            }
            return 0;
          };
          aVal = getWarningWeight(a.labels);
          bVal = getWarningWeight(b.labels);
          break;
        case 'rule':
          // RULE_APPLIED=2, RULE_AVAILABLE=1, なし=0
          const getRuleWeight = (labels: string[]) => {
            if (labels.includes('RULE_APPLIED')) return 2;
            if (labels.includes('RULE_AVAILABLE')) return 1;
            return 0;
          };
          aVal = getRuleWeight(a.labels);
          bVal = getRuleWeight(b.labels);
          break;
        case 'is_credit_card_payment':
          aVal = a.is_credit_card_payment ? 1 : 0;
          bVal = b.is_credit_card_payment ? 1 : 0;
          break;
        case 'tax_rate':
          // 軽減税率アイコン(MULTI_TAX_RATEラベル)の有無でソート
          aVal = a.labels.includes('MULTI_TAX_RATE') ? 1 : 0;
          bVal = b.labels.includes('MULTI_TAX_RATE') ? 1 : 0;
          break;
        case 'memo':
          aVal = a.memo ? 1 : 0;
          bVal = b.memo ? 1 : 0;
          break;
        case 'invoice':
          // INVOICE_QUALIFIED=2, INVOICE_NOT_QUALIFIED=1, なし=0
          const getInvoiceWeight = (labels: string[]) => {
            if (labels.includes('INVOICE_QUALIFIED')) return 2;
            if (labels.includes('INVOICE_NOT_QUALIFIED')) return 1;
            return 0;
          };
          aVal = getInvoiceWeight(a.labels);
          bVal = getInvoiceWeight(b.labels);
          break;
        case 'transaction_date':
          aVal = a.transaction_date ? new Date(a.transaction_date).getTime() : Infinity;
          bVal = b.transaction_date ? new Date(b.transaction_date).getTime() : Infinity;
          break;
        case 'description':
          aVal = a.description;
          bVal = b.description;
          break;
        case 'debit_account':
          aVal = a.debit_entries[0]?.account || '';
          bVal = b.debit_entries[0]?.account || '';
          break;
        case 'debit_sub_account':
          aVal = a.debit_entries[0]?.sub_account || '';
          bVal = b.debit_entries[0]?.sub_account || '';
          break;
        case 'debit_tax':
          aVal = a.debit_entries[0]?.tax_category_id || '';
          bVal = b.debit_entries[0]?.tax_category_id || '';
          break;
        case 'debit_amount':
          aVal = a.debit_entries[0]?.amount || 0;
          bVal = b.debit_entries[0]?.amount || 0;
          break;
        case 'credit_account':
          aVal = a.credit_entries[0]?.account || '';
          bVal = b.credit_entries[0]?.account || '';
          break;
        case 'credit_sub_account':
          aVal = a.credit_entries[0]?.sub_account || '';
          bVal = b.credit_entries[0]?.sub_account || '';
          break;
        case 'credit_tax':
          aVal = a.credit_entries[0]?.tax_category_id || '';
          bVal = b.credit_entries[0]?.tax_category_id || '';
          break;
        case 'credit_amount':
          aVal = a.credit_entries[0]?.amount || 0;
          bVal = b.credit_entries[0]?.amount || 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // チェックボックスフィルタリング
  return result.filter(journal => {
    // ゴミ箱フィルタ（AND条件: OFFならtrashed非表示）
    if (journal.deleted_at !== null && !showTrashed.value) return false;

    const isExcluded = journal.labels.includes('EXPORT_EXCLUDE');
    const isExported = journal.status === 'exported';
    const isUnexported = journal.status === null && !isExcluded;

    if (showUnexported.value && isUnexported) return true;
    if (showExported.value && isExported) return true;
    if (showExcluded.value && isExcluded) return true;
    if (showTrashed.value && journal.deleted_at !== null) return true;

    // すべてOFFの場合は全表示（trashed除外済み）
    if (!showUnexported.value && !showExported.value && !showExcluded.value && !showTrashed.value) return true;

    return false;
  });
});

// ────── journals依存のcomputed（journals computedの後に配置必須） ──────

const visibleIds = computed(() => journals.value.map(j => j.id));

const selectedJournals = computed(() =>
  localJournals.value.filter(j => selectedIds.value.has(j.id))
);

const isSelectionMode = computed(() => selectedIds.value.size > 0);

const isAllSelected = computed(() =>
  visibleIds.value.length > 0 &&
  visibleIds.value.every(id => selectedIds.value.has(id))
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
  selectedIds.value = new Set(
    [...selectedIds.value].filter(id => visible.has(id))
  );
});

function sortBy(column: string) {
  closeDropdown();
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'asc';
  }
}

function getCombinedRows(journal: JournalPhase5Mock): Array<{ debit: JournalEntryLine | null, credit: JournalEntryLine | null }> {
  const maxRows = Math.max(journal.debit_entries.length, journal.credit_entries.length);
  return Array.from({ length: maxRows }, (_, i) => ({
    debit: journal.debit_entries[i] || null,
    credit: journal.credit_entries[i] || null
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
    return 'bg-gray-600 text-white';
  }
  // 優先度2: 出力済み → 薄グレー
  if (journal.status === 'exported') {
    return 'bg-gray-200';
  }
  // 優先度3: 未読 → 黄色
  if (!journal.is_read) {
    return 'bg-yellow-100';
  }
  // 優先度4: 通常 → 白
  return 'bg-white';
}

function hasPastJournal(journal: JournalPhase5Mock): boolean {
  return localJournals.value.findIndex(j => j.id === journal.id) < 25;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getValue(obj: any, path: string): unknown {
  const raw = path.split('.').reduce((o: any, key: string) => o?.[key], obj)
  // 概念ID → MF正式名称に変換（tax_category_idキーの場合）
  if (path.endsWith('tax_category_id') && typeof raw === 'string') {
    return resolveTaxCategoryName(raw)
  }
  return raw
}

/** 概念IDからMF正式名称を取得。マスタになければIDをそのまま返す */
function resolveTaxCategoryName(id: string | null | undefined): string {
  if (!id) return ''
  const entry = TAX_CATEGORY_MASTER.find(tc => tc.id === id)
  return entry ? entry.name : id
}

function formatDate(date: string): string {
  const d = new Date(date);
  const y = d.getFullYear().toString().slice(2);
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}/${m}/${day}`;
}

// 要対応フラグの切り替え（staff_notes同期付き）
const staffNoteKeys = STAFF_NOTE_KEYS
const staffNoteConfig: Record<StaffNoteKey, { label: string; icon: string; activeColor: string; hoverIconColor: string }> = {
  NEED_DOCUMENT: { label: '書類が不足', icon: 'fa-file-circle-exclamation', activeColor: 'text-red-600', hoverIconColor: '#dc2626' },
  NEED_INFO: { label: '情報が不足', icon: 'fa-circle-question', activeColor: 'text-amber-600', hoverIconColor: '#d97706' },
  REMINDER: { label: '備忘メモ', icon: 'fa-thumbtack', activeColor: 'text-blue-600', hoverIconColor: '#2563eb' },
  NEED_CONSULT: { label: '社内相談する', icon: 'fa-comments', activeColor: 'text-purple-600', hoverIconColor: '#9333ea' },
}

// 要対応ポップアップ制御（遅延付きshow/hide）
const needPopupJournalId = ref<string | null>(null)
const needPopupKey = ref<StaffNoteKey | null>(null)
let needPopupHideTimer: ReturnType<typeof setTimeout> | null = null

function showNeedPopup(journalId: string, key: StaffNoteKey) {
  if (needPopupHideTimer) {
    clearTimeout(needPopupHideTimer)
    needPopupHideTimer = null
  }
  needPopupJournalId.value = journalId
  needPopupKey.value = key
}

function scheduleHideNeedPopup() {
  if (needPopupHideTimer) clearTimeout(needPopupHideTimer)
  needPopupHideTimer = setTimeout(() => {
    needPopupJournalId.value = null
    needPopupKey.value = null
    needPopupHideTimer = null
  }, 1500)  // 1.5秒の遅延
}

function cancelHideNeedPopup() {
  if (needPopupHideTimer) {
    clearTimeout(needPopupHideTimer)
    needPopupHideTimer = null
  }
}

function hasAnyStaffNote(journal: JournalPhase5Mock): boolean {
  if (!journal.staff_notes) return false
  return STAFF_NOTE_KEYS.some(key => journal.staff_notes?.[key]?.enabled)
}

function getStaffNoteEnabled(journal: JournalPhase5Mock, key: StaffNoteKey): boolean {
  return journal.staff_notes?.[key]?.enabled ?? false
}

function getStaffNoteText(journal: JournalPhase5Mock, key: StaffNoteKey): string {
  return journal.staff_notes?.[key]?.text ?? ''
}

function getStaffNoteChatworkUrl(journal: JournalPhase5Mock, key: StaffNoteKey): string {
  return journal.staff_notes?.[key]?.chatworkUrl ?? ''
}

// staff_notes → labels 同期関数
function syncLabelsFromStaffNotes(journal: JournalPhase5Mock) {
  const NEED_KEYS: readonly StaffNoteKey[] = STAFF_NOTE_KEYS
  // NEED_*系を一旦除去
  journal.labels = journal.labels.filter(l => !NEED_KEYS.includes(l as StaffNoteKey))
  // enabledなものだけ追加
  for (const key of NEED_KEYS) {
    if (journal.staff_notes?.[key]?.enabled) {
      journal.labels.push(key)
    }
  }
}

function toggleStaffNote(journalId: string, key: StaffNoteKey) {
  const journal = localJournals.value.find(j => j.id === journalId)
  if (!journal) return

  // staff_notesがなければ初期化
  if (!journal.staff_notes) {
    journal.staff_notes = createEmptyStaffNotes()
  }

  // トグル
  journal.staff_notes[key].enabled = !journal.staff_notes[key].enabled

  // 同期
  syncLabelsFromStaffNotes(journal)

  if (journal.staff_notes[key].enabled) {
    journal.is_read = false  // フラグON時は未読にする
  }
  console.log(`StaffNote toggled: ${key} = ${journal.staff_notes[key].enabled} for ${journalId}`)
}

// コメントモーダル
const commentModalJournalId = ref<string | null>(null)
const { userName: commentModalAuthor } = useCurrentUser()
const staffList = STAFF_LIST

const commentModalJournal = computed(() => {
  if (!commentModalJournalId.value) return null
  return localJournals.value.find(j => j.id === commentModalJournalId.value) ?? null
})

function openCommentModal(journalId: string) {
  const journal = localJournals.value.find(j => j.id === journalId)
  if (!journal) return

  // staff_notesがなければ初期化
  if (!journal.staff_notes) {
    journal.staff_notes = createEmptyStaffNotes()
  }

  commentModalJournalId.value = journalId
}

function closeCommentModal() {
  if (commentModalJournal.value) {
    // 担当者名を保存
    commentModalJournal.value.staff_notes_author = commentModalAuthor.value
    // labels同期
    syncLabelsFromStaffNotes(commentModalJournal.value)
  }
  commentModalJournalId.value = null
}

function toggleStaffNoteInModal(key: StaffNoteKey) {
  if (!commentModalJournal.value || !commentModalJournal.value.staff_notes) return
  commentModalJournal.value.staff_notes[key].enabled = !commentModalJournal.value.staff_notes[key].enabled
  // labels即時同期
  syncLabelsFromStaffNotes(commentModalJournal.value)
}
</script>
