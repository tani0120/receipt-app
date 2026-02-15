<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <!-- 緑ヘッダー -->
    <div class="bg-[#2d5a3d] text-white px-3 py-1.5 flex justify-between items-center">
      <h1 class="text-sm font-bold">仕訳一覧</h1>
      <div class="flex items-center gap-2">
        <button class="w-6 h-6 rounded bg-white/90 text-gray-700 flex items-center justify-center text-xs hover:bg-white">
          <i class="fa-solid fa-arrows-rotate"></i>
        </button>
        <button class="w-6 h-6 rounded bg-white/90 text-gray-700 flex items-center justify-center text-xs hover:bg-white">
          <i class="fa-regular fa-calendar"></i>
        </button>
        <button class="w-6 h-6 rounded bg-white/90 text-gray-700 flex items-center justify-center text-xs hover:bg-white">
          <i class="fa-solid fa-gear"></i>
        </button>
        <input type="text" placeholder="検索..." class="px-2 py-0.5 text-[10px] rounded w-24">
      </div>
    </div>

    <!-- テーブルヘッダー（22列） -->
    <div class="bg-[#1a1a1a] text-white text-[10px] flex border-b border-gray-800">
      <div class="w-6 p-1 flex items-center justify-center border-r border-gray-700">選</div>
      <div class="w-8 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('display_order')">No.</div>
      <div class="w-12 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('has_photo')">写真</div>
      <div class="w-12 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('past_journal')">過去仕訳</div>
      <div class="w-12 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('status')">コメント</div>
      <div class="w-12 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('requires_action')">要対応</div>
      <div class="w-10 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('label_type')">証票</div>
      <div class="w-10 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('warning')">警告</div>
      <div class="w-8 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('rule')">学習</div>
      <div class="w-8 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('tax_rate')">軽減</div>
      <div class="w-8 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('memo')">メモ</div>
      <div class="w-10 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('invoice')">適格</div>
      <div class="w-16 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('transaction_date')">取引日</div>
      <div class="flex-1 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('description')">摘要</div>
      <div class="w-20 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('debit_account')">借方勘定科目</div>
      <div class="w-16 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('debit_sub_account')">借方補助</div>
      <div class="w-20 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('debit_tax')">借方税区分</div>
      <div class="w-16 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('debit_amount')">借方金額</div>
      <div class="w-20 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('credit_account')">貸方勘定科目</div>
      <div class="w-16 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('credit_sub_account')">貸方補助</div>
      <div class="w-20 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('credit_tax')">貸方税区分</div>
      <div class="w-16 p-1 flex items-center justify-center border-r border-gray-700 cursor-pointer hover:bg-gray-700" @click="sortBy('credit_amount')">貸方金額</div>
      <div class="w-8 p-1 flex items-center justify-center"><i class="fa-solid fa-trash text-[9px]"></i></div>
    </div>

    <!-- テーブルボディ -->
    <div class="flex-1 overflow-y-auto">
      <template v-for="(journal, journalIndex) in journals" :key="journal.id">
        <div v-for="(row, rowIndex) in getCombinedRows(journal)" :key="`${journal.id}-${rowIndex}`"
             :class="[
               'flex text-[10px] border-b border-gray-200',
               getRowBackground(journal)
             ]">

          <!-- 1. 選 -->
          <div class="w-6 p-0.5 flex items-center justify-center border-r border-gray-200">
            <input v-if="rowIndex === 0" type="checkbox" class="w-2.5 h-2.5">
          </div>

          <!-- 2. No. -->
          <div v-if="rowIndex === 0" class="w-8 p-0.5 flex items-center justify-center border-r border-gray-200 font-mono text-gray-600 text-[9px]">
            {{ journalIndex + 1 }}
          </div>
          <div v-else class="w-8 border-r border-gray-200"></div>

          <!-- 3. 写真 -->
          <div v-if="rowIndex === 0" class="w-12 p-0.5 flex items-center justify-center border-r border-gray-200">
            <i class="fa-solid fa-camera text-[10px] text-gray-800 cursor-pointer"
               title="写真（クリックで固定）"
               @mouseenter="showImageModal(journal.id, journal.receipt_id)"
               @mouseleave="hideImageModal"
               @click="togglePinModal(journal.id, journal.receipt_id)"></i>
          </div>
          <div v-else class="w-12 border-r border-gray-200"></div>

          <!-- 過去仕訳 -->
          <div v-if="rowIndex === 0" class="w-12 p-0.5 flex items-center justify-center border-r border-gray-200">
            <i v-if="journalIndex < 25"
               class="fa-solid fa-magnifying-glass text-[10px] text-gray-600 cursor-pointer"
               title="過去仕訳（クリックで固定）"
               @mouseenter="showImageModal(journal.id, journal.receipt_id)"
               @mouseleave="hideImageModal"
               @click="togglePinModal(journal.id, journal.receipt_id)"></i>
          </div>
          <div v-else class="w-12 border-r border-gray-200"></div>

          <!-- 4. コメント -->
          <div v-if="rowIndex === 0" class="w-12 p-0.5 flex items-center justify-center border-r border-gray-200 gap-0.5 relative group">

            <!-- ホバーメモ -->
            <div v-if="journal.memo" class="hidden group-hover:block absolute z-10 bg-yellow-50 border-2 border-yellow-400 rounded p-2 shadow-xl text-[10px] w-56 top-full left-0 mt-1">
              <div class="font-bold text-yellow-900"><i class="fa-solid fa-note-sticky text-xs"></i> {{ journal.memo }}</div>
              <div class="text-gray-600 mt-1 text-[9px]">{{ journal.memo_author }}</div>
            </div>
          </div>
          <div v-else class="w-12 border-r border-gray-200"></div>

          <!-- 4. 要対応 -->
          <div v-if="rowIndex === 0" class="w-16 p-0.5 flex items-center justify-center border-r border-gray-200 gap-0.5">
            <button
              @click="toggleNeed(journal.id, 'NEED_DOCUMENT')"
              :class="journal.labels.includes('NEED_DOCUMENT') ? 'text-red-600' : 'text-gray-400 opacity-50'"
              class="hover:scale-110 transition-transform text-sm"
              :title="journal.labels.includes('NEED_DOCUMENT') ? '資料必要（ON）' : '資料必要（OFF）'"
            >
              📄
            </button>
            <button
              @click="toggleNeed(journal.id, 'NEED_CONFIRM')"
              :class="journal.labels.includes('NEED_CONFIRM') ? 'text-red-600' : 'text-gray-400 opacity-50'"
              class="hover:scale-110 transition-transform text-sm"
              :title="journal.labels.includes('NEED_CONFIRM') ? '確認必要（ON）' : '確認必要（OFF）'"
            >
              ✅
            </button>
            <button
              @click="toggleNeed(journal.id, 'NEED_CONSULT')"
              :class="journal.labels.includes('NEED_CONSULT') ? 'text-red-600' : 'text-gray-400 opacity-50'"
              class="hover:scale-110 transition-transform text-sm"
              :title="journal.labels.includes('NEED_CONSULT') ? '相談必要（ON）' : '相談必要（OFF）'"
            >
              💬
            </button>
          </div>
          <div v-else class="w-16 border-r border-gray-200"></div>

          <!-- 5. 証票 -->
          <div v-if="rowIndex === 0" class="w-10 p-0.5 flex items-center justify-center border-r border-gray-200 gap-0.5">
            <span v-if="journal.labels.includes('TRANSPORT')" class="text-[10px] font-bold text-gray-800" title="領収書">領</span>
            <span v-if="journal.labels.includes('RECEIPT')" class="text-[10px] font-bold text-gray-800" title="レシート">レ</span>
            <span v-if="journal.labels.includes('INVOICE')" class="text-[10px] font-bold text-gray-800" title="請求書">請</span>
            <span v-if="journal.labels.includes('CREDIT_CARD')" class="text-[10px] font-bold text-gray-800" title="クレジットカード">ク</span>
            <span v-if="journal.labels.includes('BANK_STATEMENT')" class="text-[10px] font-bold text-gray-800" title="銀行明細">銀</span>
          </div>
          <div v-else class="w-10 border-r border-gray-200"></div>

          <!-- 5. 警告 -->
          <div v-if="rowIndex === 0" class="w-10 p-0.5 flex items-center justify-center border-r border-gray-200 flex-wrap gap-0.5">
            <i v-if="hasErrorLabels(journal.labels)" class="fa-solid fa-triangle-exclamation text-[10px] text-red-600" title="エラー"></i>
            <i v-if="hasWarningLabels(journal.labels)" class="fa-solid fa-triangle-exclamation text-[10px] text-yellow-600" title="警告"></i>
          </div>
          <div v-else class="w-10 border-r border-gray-200"></div>

          <!-- 6. 学習 -->
          <div v-if="rowIndex === 0" class="w-8 p-0.5 flex items-center justify-center border-r border-gray-200">
            <i v-if="journal.labels.includes('RULE_APPLIED')" class="fa-solid fa-graduation-cap text-[10px] text-green-600" title="学習適用済み"></i>
            <i v-if="journal.labels.includes('RULE_AVAILABLE')" class="fa-solid fa-lightbulb text-[10px] text-blue-500" title="学習できます"></i>
          </div>
          <div v-else class="w-8 border-r border-gray-200"></div>

          <!-- 7. 軽減 -->
          <div v-if="rowIndex === 0" class="w-8 p-0.5 flex items-center justify-center border-r border-gray-200">
            <span v-if="journal.labels.includes('MULTI_TAX_RATE')" class="text-[9px] font-bold text-green-600 bg-green-50 px-1 rounded">軽</span>
          </div>
          <div v-else class="w-8 border-r border-gray-200"></div>

          <!-- 8. メモ -->
          <div v-if="rowIndex === 0" class="w-8 p-0.5 flex items-center justify-center border-r border-gray-200">
            <i v-if="journal.labels.includes('HAS_MEMO')" class="fa-solid fa-pencil text-[10px] text-gray-600" title="メモあり"></i>
          </div>
          <div v-else class="w-8 border-r border-gray-200"></div>

          <!-- 9. 適格 -->
          <div v-if="rowIndex === 0" class="w-10 p-0.5 flex items-center justify-center border-r border-gray-200">
            <span v-if="journal.labels.includes('INVOICE_QUALIFIED')" class="text-green-600 text-sm font-bold">◯</span>
            <span v-else-if="journal.labels.includes('INVOICE_NOT_QUALIFIED')" class="text-red-600 text-sm font-bold">✕</span>
          </div>
          <div v-else class="w-10 border-r border-gray-200"></div>

          <!-- 10. 取引日 -->
          <div v-if="rowIndex === 0" class="w-16 p-0.5 flex items-center justify-center border-r border-gray-200 text-[8px]">
            {{ formatDate(journal.transaction_date) }}
          </div>
          <div v-else class="w-16 border-r border-gray-200"></div>

          <!-- 11. 摘要 -->
          <div v-if="rowIndex === 0" class="flex-1 p-0.5 flex items-center border-r border-gray-200">
            {{ journal.description }}
          </div>
          <div v-else class="flex-1 border-r border-gray-200"></div>

          <!-- 12. 借方勘定科目 -->
          <div class="w-20 p-0.5 flex items-center border-r border-gray-200">
            {{ row.debit?.account || '' }}
          </div>

          <!-- 13. 借方補助 -->
          <div class="w-16 p-0.5 flex items-center justify-center border-r border-gray-200 text-[10px]">
            {{ row.debit?.sub_account || '' }}
          </div>

          <!-- 14. 借方税区分 -->
          <div class="w-20 p-0.5 flex items-center justify-center border-r border-gray-200 text-[10px]">
            {{ row.debit?.tax_category || '' }}
          </div>

          <!-- 15. 借方金額 -->
          <div class="w-16 p-0.5 flex items-center justify-end border-r border-gray-200 font-mono text-[10px]">
            {{ row.debit ? row.debit.amount.toLocaleString() : '' }}
          </div>

          <!-- 16. 貸方勘定科目 -->
          <div class="w-20 p-0.5 flex items-center border-r border-gray-200">
            {{ row.credit?.account || '' }}
          </div>

          <!-- 17. 貸方補助 -->
          <div class="w-16 p-0.5 flex items-center justify-center border-r border-gray-200 text-[10px]">
            {{ row.credit?.sub_account || '' }}
          </div>

          <!-- 18. 貸方税区分 -->
          <div class="w-20 p-0.5 flex items-center justify-center border-r border-gray-200 text-[10px]">
            {{ row.credit?.tax_category || '' }}
          </div>

          <!-- 19. 貸方金額 -->
          <div class="w-16 p-0.5 text-right border-r border-gray-200 text-[10px] font-mono">
            {{ row.credit?.amount?.toLocaleString() || '' }}
          </div>

          <!-- 20. ゴミ箱 -->
          <div class="w-8 p-0.5 flex items-center justify-center">
            <i class="fa-solid fa-trash text-[9px] text-gray-400 hover:text-red-600 cursor-pointer" title="削除"></i>
          </div>
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
         class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
         @click="showPastJournalModal = false">
      <div class="bg-white rounded-lg shadow-2xl w-[90%] h-[80%] flex flex-col pointer-events-auto"
           @click.stop>
        <!-- モーダルヘッダー -->
        <div class="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
          <h2 class="text-sm font-bold">過去仕訳検索</h2>
          <button @click="showPastJournalModal = false"
                  class="text-gray-500 hover:text-gray-700">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <!-- 検索条件 -->
        <div class="p-4 border-b bg-gray-50">
          <div class="grid grid-cols-3 gap-4 mb-3">
            <!-- 支払先 -->
            <div>
              <label class="text-xs text-gray-700 block mb-1">支払先</label>
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
              <input type="text"
                     v-model="pastJournalSearch.dateFrom"
                     placeholder="yyyy/mm/dd"
                     class="w-40 px-2 py-1 text-xs border rounded">
              <span class="text-xs">〜</span>
              <input type="text"
                     v-model="pastJournalSearch.dateTo"
                     placeholder="yyyy/mm/dd"
                     class="w-40 px-2 py-1 text-xs border rounded">
            </div>
          </div>

          <!-- 金額 -->
          <div class="mb-3">
            <label class="text-xs text-gray-700 block mb-1">金額</label>
            <select v-model="pastJournalSearch.amountCondition"
                    class="w-40 px-2 py-1 text-xs border rounded">
              <option value="">選択してください</option>
              <option value="equal">等しい</option>
              <option value="greater">以上</option>
              <option value="less">以下</option>
            </select>
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
            STREAMEDの過去仕訳
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
            <span class="inline-block bg-blue-100 px-2 py-0.5 ml-2">未出力</span>
            <span class="inline-block bg-green-100 px-2 py-0.5 ml-2">中出力</span>
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
              <tr v-for="(result, index) in ([] as JournalPhase5Mock[])"
                  :key="index"
                  :class="index % 2 === 0 ? 'bg-blue-50' : 'bg-white'"
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
              <tr v-if="([] as JournalPhase5Mock[]).length === 0">
                <td colspan="9" class="border px-2 py-4 text-center text-gray-500">
                  検索結果がありません
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { mockJournalsPhase5 } from '../data/journal_test_fixture_30cases';
import { getReceiptImageUrl } from '../data/receipt_mock_data';
import type { JournalPhase5Mock, JournalEntryLine } from '../types/journal_phase5_mock.type';

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
  debitAccount: '',
  creditAccount: ''
});

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
  let result = [...mockJournalsPhase5].sort((a, b) => {
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
          // TODO: status列のソートは未実装（現在の型定義では'exported' | nullのみ）
          aVal = 0;
          bVal = 0;
          break;
        case 'past_journal':
          // 虎眼鏡アイコンの有無でソート（journalIndexが25未満）
          const getPastJournalWeight = (index: number) => {
            return index < 25 ? 1 : 0;
          };
          aVal = getPastJournalWeight(journals.value.indexOf(a));
          bVal = getPastJournalWeight(journals.value.indexOf(b));
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

  return result;
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
  // 行21-30を黄色ハイライト
  if (journal.display_order >= 21 && journal.display_order <= 30) {
    return 'bg-yellow-100';
  }
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
