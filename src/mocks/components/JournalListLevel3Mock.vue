<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <!-- 上部バー -->
    <div class="bg-white px-3 py-1 flex justify-between items-center text-[10px] text-gray-700">
      <!-- 表示条件ドロップダウン + チェックボックス -->
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
      </div>
      <!-- 行の背景色 凡例 -->
      <div class="flex items-center gap-2">
        <span class="text-gray-600">行の背景色</span>
        <span class="bg-yellow-100 border border-gray-400 px-2 py-0.5 text-gray-800 font-bold">未読</span>
        <span class="bg-white border border-gray-400 px-2 py-0.5 text-gray-800">既読</span>
        <span class="bg-gray-200 border border-gray-400 px-2 py-0.5 text-gray-800">出力済</span>
      </div>
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
        <template v-if="col.type === 'action'">
          <i class="fa-solid fa-trash text-[9px]"></i>
        </template>
        <template v-else>
          {{ col.label }}
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
              <input v-if="rowIndex === 0" type="checkbox" class="w-2.5 h-2.5">
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

              <!-- コメント -->
              <template v-else-if="col.key === 'comment'">
                <div v-if="rowIndex === 0" :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200 gap-0.5 relative group']">
                  <i v-if="journal.memo" class="fa-solid fa-note-sticky text-[10px] text-yellow-600 cursor-pointer"></i>
                  <div v-if="journal.memo" class="hidden group-hover:block absolute z-10 bg-yellow-50 border-2 border-yellow-400 rounded p-2 shadow-xl text-[10px] w-56 top-full left-0 mt-1">
                    <div class="font-bold text-yellow-900"><i class="fa-solid fa-note-sticky text-xs"></i> {{ journal.memo }}</div>
                    <div class="text-gray-600 mt-1 text-[9px]">{{ journal.memo_author }}</div>
                  </div>
                </div>
                <div v-else :class="[col.width, 'border-r border-gray-200']"></div>
              </template>

              <!-- 要対応 -->
              <template v-else-if="col.key === 'needAction'">
                <div v-if="rowIndex === 0" :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200 gap-0.5']">
                  <button
                    @click="toggleNeed(journal.id, 'NEED_DOCUMENT')"
                    :class="journal.labels.includes('NEED_DOCUMENT') ? 'text-red-600' : 'text-gray-400 opacity-50'"
                    class="hover:scale-110 transition-transform text-sm"
                    :title="journal.labels.includes('NEED_DOCUMENT') ? '資料必要（ON）' : '資料必要（OFF）'"
                  >📄</button>
                  <button
                    @click="toggleNeed(journal.id, 'NEED_CONFIRM')"
                    :class="journal.labels.includes('NEED_CONFIRM') ? 'text-red-600' : 'text-gray-400 opacity-50'"
                    class="hover:scale-110 transition-transform text-sm"
                    :title="journal.labels.includes('NEED_CONFIRM') ? '確認必要（ON）' : '確認必要（OFF）'"
                  >✅</button>
                  <button
                    @click="toggleNeed(journal.id, 'NEED_CONSULT')"
                    :class="journal.labels.includes('NEED_CONSULT') ? 'text-red-600' : 'text-gray-400 opacity-50'"
                    class="hover:scale-110 transition-transform text-sm"
                    :title="journal.labels.includes('NEED_CONSULT') ? '相談必要（ON）' : '相談必要（OFF）'"
                  >💬</button>
                </div>
                <div v-else :class="[col.width, 'border-r border-gray-200']"></div>
              </template>

              <!-- 証票 -->
              <template v-else-if="col.key === 'labelType'">
                <div v-if="rowIndex === 0" :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200 gap-0.5']">
                  <span v-if="journal.labels.includes('TRANSPORT')" class="text-[10px] font-bold text-gray-800" title="領収書">領</span>
                  <span v-if="journal.labels.includes('RECEIPT')" class="text-[10px] font-bold text-gray-800" title="レシート">レ</span>
                  <span v-if="journal.labels.includes('INVOICE')" class="text-[10px] font-bold text-gray-800" title="請求書">請</span>
                  <span v-if="journal.labels.includes('CREDIT_CARD')" class="text-[10px] font-bold text-gray-800" title="クレジットカード">ク</span>
                  <span v-if="journal.labels.includes('BANK_STATEMENT')" class="text-[10px] font-bold text-gray-800" title="銀行明細">銀</span>
                </div>
                <div v-else :class="[col.width, 'border-r border-gray-200']"></div>
              </template>

              <!-- 警告 -->
              <template v-else-if="col.key === 'warning'">
                <div v-if="rowIndex === 0" :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200 flex-wrap gap-0.5']">
                  <i v-if="hasErrorLabels(journal.labels)" class="fa-solid fa-triangle-exclamation text-[10px] text-red-600" title="エラー"></i>
                  <i v-if="hasWarningLabels(journal.labels)" class="fa-solid fa-triangle-exclamation text-[10px] text-yellow-600" title="警告"></i>
                </div>
                <div v-else :class="[col.width, 'border-r border-gray-200']"></div>
              </template>

              <!-- 学習 -->
              <template v-else-if="col.key === 'rule'">
                <div v-if="rowIndex === 0" :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200']">
                  <i v-if="journal.labels.includes('RULE_APPLIED')" class="fa-solid fa-graduation-cap text-[10px] text-green-600" title="学習適用済み"></i>
                  <i v-if="journal.labels.includes('RULE_AVAILABLE')" class="fa-solid fa-lightbulb text-[10px] text-blue-500" title="学習できます"></i>
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

              <!-- メモ -->
              <template v-else-if="col.key === 'memo'">
                <div v-if="rowIndex === 0" :class="[col.width, 'p-0.5 flex items-center justify-center border-r border-gray-200']">
                  <i v-if="journal.labels.includes('HAS_MEMO')" class="fa-solid fa-pencil text-[10px] text-gray-600" title="メモあり"></i>
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

            <!-- action型 -->
            <div v-else-if="col.type === 'action'" :class="[col.width, 'p-0.5 flex items-center justify-center']">
              <i class="fa-solid fa-trash text-[9px] text-gray-400 hover:text-red-600 cursor-pointer" title="削除"></i>
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
         class="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
         @click="hideImageModal">
      <div :style="{ width: `${actualModalWidth}px`, height: `${actualModalHeight}px` }" class="relative bg-white rounded-lg shadow-2xl flex flex-col pointer-events-auto">
        <!-- 回転ボタン -->
        <button @click.stop="rotationAngle = (rotationAngle + 90) % 360"
                class="absolute top-2 right-2 z-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-colors"
                title="90度回転">
          <i class="fa-solid fa-rotate-right text-sm"></i>
        </button>
        <!-- 閉じるボタン -->
        <button @click="closeModal"
                class="absolute top-2 left-2 z-10 bg-gray-500 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-colors"
                title="閉じる">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
        <!-- ズームインボタン -->
        <button @click.stop="zoomIn"
                class="absolute top-12 right-2 z-10 bg-green-500 hover:bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-colors"
                title="拡大">
          <i class="fa-solid fa-magnifying-glass-plus text-sm"></i>
        </button>
        <!-- ズームアウトボタン -->
        <button @click.stop="zoomOut"
                class="absolute top-22 right-2 z-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-colors"
                title="縮小">
          <i class="fa-solid fa-magnifying-glass-minus text-sm"></i>
        </button>
        <!-- 画像表示エリア -->
        <div class="flex-1 flex items-center justify-center overflow-hidden">
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
    </div>

    <!-- 過去仕訳検索モーダル -->
    <div v-if="showPastJournalModal"
         class="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
         >
      <div class="bg-white rounded-lg shadow-2xl w-[600px] h-[600px] flex flex-col pointer-events-auto border-2 border-gray-300"
           @click.stop>
        <!-- モーダルヘッダー -->
        <div class="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
          <h2 class="text-sm font-bold">過去仕訳検索</h2>
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
                <td class="border px-2 py-1 text-center">{{ formatDate(result.transaction_date) }}</td>
                <td class="border px-2 py-1">{{ result.description }}</td>
                <td class="border px-2 py-1">{{ result.debit_entries[0]?.account || '' }}</td>
                <td class="border px-2 py-1">{{ result.debit_entries[0]?.sub_account || '' }}</td>
                <td class="border px-2 py-1 text-center">{{ result.debit_entries[0]?.tax_category || '' }}</td>
                <td class="border px-2 py-1">{{ result.credit_entries[0]?.account || '' }}</td>
                <td class="border px-2 py-1">{{ result.credit_entries[0]?.sub_account || '' }}</td>
                <td class="border px-2 py-1 text-center">{{ result.credit_entries[0]?.tax_category || '' }}</td>
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { journalColumns } from '@/mocks/columns/journalColumns';
import { mockJournalsPhase5 } from '../data/journal_test_fixture_30cases';
import { getReceiptImageUrl } from '../data/receipt_mock_data';
import type { JournalPhase5Mock, JournalEntryLine } from '../types/journal_phase5_mock.type';

// フィルタリング状態（チェックボックス）
const showUnexported = ref<boolean>(true);   // 未出力を表示（初期: ON）
const showExported = ref<boolean>(false);    // 出力済を表示（初期: OFF）
const showExcluded = ref<boolean>(false);    // 出力対象外を表示（初期: OFF）

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

// 画像ドラッグ用
const offsetX = ref<number>(0);
const offsetY = ref<number>(0);
const isDragging = ref<boolean>(false);
const dragStartX = ref<number>(0);
const dragStartY = ref<number>(0);

// 過去仕訳検索モーダル用
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
  let results = [...mockJournalsPhase5];

  // 支払先フィルタ
  if (pastJournalSearch.value.vendor) {
    results = results.filter(j =>
      j.description.includes(pastJournalSearch.value.vendor)
    );
  }

  // 日付範囲フィルタ
  if (pastJournalSearch.value.dateFrom) {
    results = results.filter(j => j.transaction_date >= pastJournalSearch.value.dateFrom);
  }
  if (pastJournalSearch.value.dateTo) {
    results = results.filter(j => j.transaction_date <= pastJournalSearch.value.dateTo);
  }

  // 金額フィルタ
  if (pastJournalSearch.value.amount !== null && pastJournalSearch.value.amountCondition) {
    results = results.filter(j => {
      const debitTotal = j.debit_entries.reduce((sum, e) => sum + e.amount, 0);
      const creditTotal = j.credit_entries.reduce((sum, e) => sum + e.amount, 0);
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
  const result = [...mockJournalsPhase5].sort((a, b) => {
    return new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
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
        case 'status':
          aVal = a.memo ? 1 : 0;
          bVal = b.memo ? 1 : 0;
          break;
        case 'past_journal':
          aVal = mockJournalsPhase5.findIndex(j => j.id === a.id) < 25 ? 1 : 0;
          bVal = mockJournalsPhase5.findIndex(j => j.id === b.id) < 25 ? 1 : 0;
          break;
        case 'requires_action':
          aVal = a.display_order;
          bVal = b.display_order;
          break;
        case 'label_type':
          aVal = a.labels.join(',');
          bVal = b.labels.join(',');
          break;
        case 'warning':
          // 事故フラグの有無と重み付け: 赤色（エラー）＞黄色（警告）の順
          const getWarningWeight = (labels: string[]) => {
            // 赤色（エラー）- 10点台
            if (labels.includes('DEBIT_CREDIT_MISMATCH')) return 16;
            if (labels.includes('TAX_CALCULATION_ERROR')) return 15;
            if (labels.includes('MISSING_RECEIPT')) return 14;
            if (labels.includes('OCR_FAILED')) return 13;
            // 黄色（警告）- 1点台
            if (labels.includes('DUPLICATE_SUSPECT')) return 4;
            if (labels.includes('DATE_ANOMALY')) return 3;
            if (labels.includes('AMOUNT_ANOMALY')) return 2;
            if (labels.includes('OCR_LOW_CONFIDENCE')) return 1;
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
          aVal = new Date(a.transaction_date).getTime();
          bVal = new Date(b.transaction_date).getTime();
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
          aVal = a.debit_entries[0]?.tax_category || '';
          bVal = b.debit_entries[0]?.tax_category || '';
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
          aVal = a.credit_entries[0]?.tax_category || '';
          bVal = b.credit_entries[0]?.tax_category || '';
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
    const isExcluded = journal.labels.includes('EXPORT_EXCLUDE');
    const isExported = journal.status === 'exported';
    const isUnexported = journal.status === null && !isExcluded;

    if (showUnexported.value && isUnexported) return true;
    if (showExported.value && isExported) return true;
    if (showExcluded.value && isExcluded) return true;

    // すべてOFFの場合は全表示
    if (!showUnexported.value && !showExported.value && !showExcluded.value) return true;

    return false;
  });
});

function sortBy(column: string) {
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

function getRowBackground(journal: JournalPhase5Mock): string {
  // 優先度1: 出力済み → グレー（未読より優先）
  if (journal.status === 'exported') {
    return 'bg-gray-200';
  }
  // 優先度2: 未読 → 黄色
  if (!journal.is_read) {
    return 'bg-yellow-100';
  }
  // 優先度3: 既読 → 白
  return 'bg-white';
}

function hasErrorLabels(labels: string[]): boolean {
  const errorLabels = ['DEBIT_CREDIT_MISMATCH', 'TAX_CALCULATION_ERROR', 'MISSING_RECEIPT', 'OCR_FAILED'];
  return labels.some(label => errorLabels.includes(label));
}

function hasWarningLabels(labels: string[]): boolean {
  const warningLabels = ['DUPLICATE_SUSPECT', 'DATE_ANOMALY', 'AMOUNT_ANOMALY', 'OCR_LOW_CONFIDENCE'];
  return labels.some(label => warningLabels.includes(label));
}

function hasPastJournal(journal: JournalPhase5Mock): boolean {
  return mockJournalsPhase5.findIndex(j => j.id === journal.id) < 25;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getValue(obj: any, path: string): unknown {
  return path.split('.').reduce((o: any, key: string) => o?.[key], obj)
}

function formatDate(date: string): string {
  const d = new Date(date);
  const y = d.getFullYear().toString().slice(2);
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}/${m}/${day}`;
}

// 要対応フラグの切り替え
function toggleNeed(
  journalId: string,
  label: 'NEED_DOCUMENT' | 'NEED_CONFIRM' | 'NEED_CONSULT'
) {
  const journal = mockJournalsPhase5.find(j => j.id === journalId);
  if (!journal) {
    console.error(`Journal not found: ${journalId}`);
    return;
  }

  const index = journal.labels.indexOf(label);
  if (index > -1) {
    // 削除
    journal.labels.splice(index, 1);
    console.log(`Label removed: ${label} from ${journalId}`);
  } else {
    // 追加
    journal.labels.push(label);
    journal.is_read = false;  // 要対応フラグが立ったら未読にする
    console.log(`Label added: ${label} to ${journalId}, set to unread`);
  }
}
</script>
