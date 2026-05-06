<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <div class="flex-1 overflow-auto">
      <div class="cm-settings">
        <!-- ヘッダー -->
        <div class="cm-header">
          <h1 class="cm-title">顧問先管理</h1>
        </div>

        <!-- ツールバー（共通コンポーネント） -->
        <TableFilterToolbar
          :columns="allColumns"
          v-model:visible-columns="visibleColumns"
          :total-count="filteredRows.length"
          :views="clientViews"
          v-model:active-view-index="activeViewIndex"
          :filter-columns="clientFilterColumns"
          :filter-conditions="filterConditions"
          :filter-logic="filterLogic"
          :filter-sort="filterSortSetting"
          :default-conditions="currentViewDefaults.filters"
          :default-sort="currentViewDefaults.sort"
          @filter-change="onFilterChange"
          @filter-apply="onFilterApply"
          @filter-remove="onFilterRemove"
          @view-change="onViewChange"
        >
          <template #actions>
            <button class="cm-action-btn primary" @click="$router.push('/master/clients/new')">
              <i class="fa-solid fa-plus"></i> 新規追加
            </button>
          </template>
        </TableFilterToolbar>

        <!-- テーブル -->
        <div class="cm-table-wrap">
          <table class="cm-table" style="table-layout: fixed;">
            <colgroup>
              <col :style="{ width: clColWidths['status'] + 'px' }">
              <col v-for="col in visibleColumnDefs" :key="'cg-'+col.key" :style="{ width: getColWidth(col) + 'px' }">
            </colgroup>
            <thead>
              <tr>
                <th class="sortable relative cm-th-status" @click="sortBy('status')">
                  <i :class="getSortIcon('status')"></i>
                  <div class="resize-handle" @mousedown.stop="onClResizeStart('status', $event)"></div>
                </th>
                <th v-for="col in visibleColumnDefs" :key="'th-'+col.key" class="sortable relative cm-th-cell" @click="sortBy(col.key)">
                  {{ col.label }} <i :class="getSortIcon(col.key)"></i>
                  <div class="resize-handle" @mousedown.stop="onClResizeStart(col.key, $event)"></div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in pagedRows"
                :key="row.clientId"
                :class="{ 'row-inactive': row.status === 'inactive', 'row-suspension': row.status === 'suspension' }"
              >
                <!-- ステータス固定列 -->
                <td class="cm-td-status">
                  <div class="cm-status-icon-group" @click.stop="$router.push(`/master/clients/${row.clientId}`)">
                    <i class="fa-solid fa-pen cm-status-pen" :class="'pen-' + row.status"></i>
                  </div>
                </td>
                <!-- 動的列（全列統一v-for） -->
                <td v-for="col in visibleColumnDefs" :key="'td-'+col.key" class="cm-td-cell"
                  :class="getCellClass(col.key)"
                  @dblclick.stop="isEditableCol(col.key) ? (col.key === 'staffName' ? startStaffInlineEdit(row, $event) : startInlineEdit(row, col.key as InlineEditableField, $event)) : undefined"
                >
                  <!-- 3コード -->
                  <template v-if="col.key === 'threeCode'">
                    <input v-if="inlineEditId === row.clientId && inlineEditField === 'threeCode'" v-model="inlineEditValue" class="cm-inline-input" maxlength="3" @input="inlineEditValue = String(inlineEditValue).toUpperCase().replace(/[^A-Z]/g, '')" @blur="commitInlineEdit(row)" @keydown.enter="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                    <span v-else>{{ row.threeCode }}</span>
                  </template>
                  <!-- 種別 -->
                  <template v-else-if="col.key === 'type'">
                    <select v-if="inlineEditId === row.clientId && inlineEditField === 'type'" v-model="inlineEditValue" class="cm-inline-select" @blur="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                      <option value="corp">法人</option>
                      <option value="individual">個人</option>
                    </select>
                    <span v-else>{{ row.type === 'corp' ? '法人' : '個人' }}</span>
                  </template>
                  <!-- 課税方式 -->
                  <template v-else-if="col.key === 'taxMode'">{{ taxModeLabel(row.consumptionTaxMode) }}</template>
                  <!-- 会社名 -->
                  <template v-else-if="col.key === 'companyName'">
                    <input v-if="inlineEditId === row.clientId && inlineEditField === 'companyName'" v-model="inlineEditValue" class="cm-inline-input" @blur="commitInlineEdit(row)" @keydown.enter="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                    <span v-else>{{ row.type === 'individual' && row.repName ? row.repName : row.companyName }}</span>
                  </template>
                  <!-- 担当者 -->
                  <template v-else-if="col.key === 'staffName'">
                    <select v-if="inlineEditId === row.clientId && inlineEditField === 'staffName'" v-model="inlineEditValue" class="cm-inline-select" @blur="commitStaffEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                      <option value="">未設定</option>
                      <option v-for="s in staffList" :key="s.uuid" :value="s.uuid">{{ s.name }}</option>
                    </select>
                    <span v-else>{{ getStaffNameForClient(row.clientId) || '—' }}</span>
                  </template>
                  <!-- 会計ソフト -->
                  <template v-else-if="col.key === 'accountingSoftware'">
                    <select v-if="inlineEditId === row.clientId && inlineEditField === 'accountingSoftware'" v-model="inlineEditValue" class="cm-inline-select" @blur="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                      <option value="mf">MF</option><option value="freee">freee</option><option value="yayoi">弥生</option><option value="tkc">TKC</option><option value="other">その他</option>
                    </select>
                    <span v-else>{{ softwareLabel(row.accountingSoftware) }}</span>
                  </template>
                  <!-- 決算日 -->
                  <template v-else-if="col.key === 'fiscalMonth'">
                    <template v-if="inlineEditId === row.clientId && inlineEditField === 'fiscalMonth'">
                      <div class="cm-inline-fiscal-group">
                        <select v-model="inlineEditValue" class="cm-inline-select cm-inline-fiscal-sel" @keydown.escape="cancelInlineEdit" @click.stop>
                          <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
                        </select>
                        <span class="cm-inline-fiscal-sep">/</span>
                        <select v-model="inlineEditFiscalDay" class="cm-inline-select cm-inline-fiscal-sel" @keydown.escape="cancelInlineEdit" @click.stop>
                          <option value="末日">末日</option>
                          <option v-for="d in 31" :key="d" :value="d">{{ d }}日</option>
                        </select>
                        <button class="cm-inline-fiscal-ok" @click.stop="commitFiscalEdit(row)">✓</button>
                      </div>
                    </template>
                    <span v-else>{{ row.fiscalMonth }}月/{{ row.fiscalDay === '末日' ? '末日' : row.fiscalDay + '日' }}</span>
                  </template>
                  <!-- sharedEmail -->
                  <template v-else-if="col.key === 'sharedEmail'">
                    <input v-if="inlineEditId === row.clientId && inlineEditField === 'sharedEmail'" v-model="inlineEditValue" class="cm-inline-input" @blur="commitInlineEdit(row)" @keydown.enter="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                    <span v-else-if="row.sharedEmail" class="cm-shared-email">🔗 {{ row.sharedEmail }}</span>
                    <span v-else class="cm-shared-email-none">未取得（顧問先が登録）</span>
                  </template>
                  <!-- Drive取込 -->
                  <template v-else-if="col.key === 'driveUrl'">
                    <template v-if="!row.sharedFolderId"><span class="cm-drive-none">—</span></template>
                    <template v-else>
                      <span v-if="driveUrlCopied === row.clientId" class="cm-drive-copied">✅ コピー済</span>
                      <span v-else class="cm-drive-link" @click.stop="copyDriveUrl(row)">📋 URLコピー</span>
                    </template>
                  </template>
                  <!-- 主な連絡手段 -->
                  <template v-else-if="col.key === 'contact'">
                    <span v-if="row.chatRoomUrl">チャットワーク</span>
                    <span v-else-if="row.email" class="cm-contact-fallback">メール <i class="fa-solid fa-triangle-exclamation cm-contact-warn" title="チャットワークURLが空白です。"></i></span>
                    <span v-else>—</span>
                  </template>
                  <!-- 汎用テキスト入力（phoneNumber, email, chatRoomUrl等） -->
                  <template v-else-if="isTextEditCol(col.key)">
                    <input v-if="inlineEditId === row.clientId && inlineEditField === col.key" v-model="inlineEditValue" class="cm-inline-input" @blur="commitInlineEdit(row)" @keydown.enter="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                    <span v-else>{{ (row as any)[col.key] || '—' }}</span>
                  </template>
                  <!-- 汎用表示（追加フィールド等） -->
                  <template v-else>{{ getFieldValue(row, col.key) }}</template>
                </td>
              </tr>
              <tr v-if="isLoading || pagedRows.length === 0">
                <td :colspan="visibleColumnDefs.length + 1" class="cm-empty">
                  <template v-if="isLoading">
                    <i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px;"></i>読み込み中…
                  </template>
                  <template v-else>該当する顧問先がありません</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ページネーション -->
        <div class="cm-pagination" v-if="totalPages > 1">
          <span class="cm-page-arrow" :class="{ disabled: currentPage <= 1 }" @click="currentPage = Math.max(1, currentPage - 1)">＜</span>
          <span
            v-for="p in totalPages" :key="p"
            class="cm-page-num" :class="{ active: p === currentPage }"
            @click="currentPage = p"
          >{{ p }}</span>
          <span class="cm-page-arrow" :class="{ disabled: currentPage >= totalPages }" @click="currentPage = Math.min(totalPages, currentPage + 1)">＞</span>
        </div>
      </div>
    </div>

    <!-- スライドインパネル（追加/編集） -->
    <transition name="slide-panel">
      <div v-if="panelMode" class="cm-panel-overlay" @click.self="closePanel">
        <div class="cm-panel-container">
          <div class="cm-panel-header">
            <h2 class="cm-panel-title">{{ panelMode === 'add' ? '顧問先を追加' : '顧問先を編集' }}</h2>
            <div class="cm-panel-header-actions">
              <button v-if="panelMode === 'edit' && panelForm.status === 'active'" class="cm-panel-stop-btn" @click="confirmSuspend">
                ⏸️ 休眠
              </button>
              <button v-if="panelMode === 'edit' && panelForm.status === 'active'" class="cm-panel-terminate-btn" @click="confirmTerminate">
                ⛔ 契約終了
              </button>
              <button v-if="panelMode === 'edit' && (panelForm.status === 'inactive' || panelForm.status === 'suspension')" class="cm-panel-restore-btn" @click="restoreClient">
                <i class="fa-solid fa-rotate-left"></i> 稼働に戻す
              </button>
              <button class="cm-panel-cancel" @click="closePanel">キャンセル</button>
              <button class="cm-panel-save" @click="saveClient">
                <i class="fa-solid fa-save"></i> 保存
              </button>
            </div>
          </div>
          <div class="cm-panel-body">
            <!-- 基本情報セクション -->
            <div class="cm-section">
              <h3 class="cm-section-title">基本情報</h3>
              <div class="cm-field">
                <label class="cm-label">法人/個人</label>
                <div class="cm-radio-group">
                  <label class="cm-radio"><input type="radio" v-model="panelForm.type" value="corp"><span>法人</span></label>
                  <label class="cm-radio"><input type="radio" v-model="panelForm.type" value="individual"><span>個人</span></label>
                </div>
              </div>
              <div class="cm-field">
                <label class="cm-label">内部ID</label>
                <input type="text" :value="panelMode === 'edit' ? editingId : '（自動生成）'" class="cm-input cm-client-id-input" disabled>
              </div>
              <div class="cm-field">
                <label class="cm-label">3コード <span class="cm-hint">※大文字アルファベット3文字</span></label>
                <input type="text" v-model="panelForm.threeCode" class="cm-input cm-code-input" maxlength="3" placeholder="ABC" @input="panelForm.threeCode = panelForm.threeCode.toUpperCase().replace(/[^A-Z]/g, '')">
              </div>
              <div class="cm-field">
                <label class="cm-label">会社名</label>
                <input type="text" v-model="panelForm.companyName" class="cm-input" placeholder="株式会社サンプル">
              </div>
              <div class="cm-field">
                <label class="cm-label">会社名（全角カナ）</label>
                <input type="text" v-model="panelForm.companyNameKana" class="cm-input" placeholder="カブシキガイシャサンプル" @input="panelForm.companyNameKana = panelForm.companyNameKana.replace(/[^\u30A0-\u30F6\u30FC\u3000 ]/g, '')">
              </div>
              <div class="cm-field">
                <label class="cm-label">代表者名</label>
                <input type="text" v-model="panelForm.repName" class="cm-input" placeholder="山田 太郎">
              </div>
              <div class="cm-field">
                <label class="cm-label">代表者名（全角カナ）</label>
                <input type="text" v-model="panelForm.repNameKana" class="cm-input" placeholder="ヤマダ タロウ" @input="panelForm.repNameKana = panelForm.repNameKana.replace(/[^\u30A0-\u30F6\u30FC\u3000 ]/g, '')">
              </div>
              <div class="cm-field">
                <label class="cm-label">担当者</label>
                <select v-model="panelStaffId" class="cm-select">
                  <option value="">未設定</option>
                  <option v-for="s in activeStaffList" :key="s.uuid" :value="s.uuid">{{ s.name }}</option>
                </select>
              </div>
              <div class="cm-field">
                <label class="cm-label">電話番号</label>
                <input type="text" v-model="panelForm.phoneNumber" class="cm-input" placeholder="03-1234-5678">
              </div>
              <div class="cm-field">
                <label class="cm-label">メールアドレス</label>
                <input type="email" v-model="panelForm.email" class="cm-input" placeholder="example@mail.com">
              </div>
              <!-- Drive関連UI削除（ロジックは温存） -->
              <div class="cm-field">
                <label class="cm-label">チャットルームURL</label>
                <input type="url" v-model="panelForm.chatRoomUrl" class="cm-input" placeholder="https://www.chatwork.com/#!rid...">
              </div>
              <div class="cm-field">
                <label class="cm-label">主な連絡手段</label>
                <div class="cm-radio-group">
                  <label class="cm-radio"><input type="radio" v-model="panelForm.contactType" value="email"><span>メール</span></label>
                  <label class="cm-radio"><input type="radio" v-model="panelForm.contactType" value="chatwork"><span>チャットワーク</span></label>
                </div>
              </div>
              <div class="cm-field">
                <label class="cm-label">連絡先</label>
                <input type="text" v-model="panelForm.contactValue" class="cm-input" :placeholder="panelForm.contactType === 'email' ? 'example@mail.com' : 'Chatwork ID'">
              </div>
              <div class="cm-field">
                <label class="cm-label">顧問先ログインメール <span class="cm-hint">※自動取得（顧問先がポータルログイン時に登録）</span></label>
                <input type="email" v-model="panelSharedEmail" class="cm-input" placeholder="shared@example.com">
              </div>
              <div class="cm-field">
                <label class="cm-label">共有用チャットURL <span class="cm-hint">※顧問先との共有チャットルーム</span></label>
                <input type="url" v-model="panelSharedChatUrl" class="cm-input" placeholder="https://www.chatwork.com/#!rid...">
              </div>
              <div class="cm-field">
                <label class="cm-label">決算日</label>
                <div class="cm-date-group">
                  <select v-model="panelForm.fiscalMonth" class="cm-select">
                    <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
                  </select>
                  <span class="cm-date-separator">/</span>
                  <select v-model="panelForm.fiscalDay" class="cm-select">
                    <option value="末日">末日</option>
                    <option v-for="d in 31" :key="d" :value="d">{{ d }}日</option>
                  </select>
                </div>
              </div>
              <div class="cm-field" style="position: relative;">
                <label class="cm-label">業種</label>
                <div class="cm-custom-select" @click.stop="showIndustryDropdown = !showIndustryDropdown">
                  <span :class="{ 'cm-placeholder': !panelForm.industry }">{{ panelForm.industry || '未設定' }}</span>
                  <i class="fa-solid fa-chevron-down cm-select-arrow" :class="{ rotated: showIndustryDropdown }"></i>
                </div>
                <div v-if="showIndustryDropdown" class="cm-dropdown" @click.stop>
                  <div v-for="opt in industryOptions" :key="opt" class="cm-dropdown-item" :class="{ selected: panelForm.industry === opt }" @click="panelForm.industry = opt; showIndustryDropdown = false">{{ opt || '未設定' }}</div>
                </div>
              </div>
              <div class="cm-field">
                <label class="cm-label">設立日</label>
                <input type="text" v-model="panelForm.establishedDate" class="cm-input" placeholder="YYYYMMDD" maxlength="8">
              </div>
            </div>

            <!-- 会計設定セクション -->
            <div class="cm-section">
              <h3 class="cm-section-title">会計設定</h3>
              <div class="cm-field">
                <label class="cm-label">会計ソフト</label>
                <select v-model="panelForm.accountingSoftware" class="cm-select">
                  <option value="mf">マネーフォワード</option>
                  <option value="freee">freee</option>
                  <option value="yayoi">弥生</option>
                  <option value="tkc">TKC</option>
                  <option value="other">その他</option>
                </select>
              </div>
              <div class="cm-field">
                <label class="cm-label">確定申告</label>
                <div class="cm-radio-group">
                  <label class="cm-radio"><input type="radio" v-model="panelForm.taxFilingType" value="blue"><span>青色</span></label>
                  <label class="cm-radio"><input type="radio" v-model="panelForm.taxFilingType" value="white"><span>白色</span></label>
                </div>
              </div>
              <div class="cm-field">
                <label class="cm-label">課税方式</label>
                <div class="cm-radio-group">
                  <label class="cm-radio"><input type="radio" v-model="panelForm.consumptionTaxMode" value="general"><span>原則課税</span></label>
                  <label class="cm-radio"><input type="radio" v-model="panelForm.consumptionTaxMode" value="simplified"><span>簡易課税</span></label>
                  <label class="cm-radio"><input type="radio" v-model="panelForm.consumptionTaxMode" value="exempt"><span>免税</span></label>
                </div>
              </div>
              <div v-if="panelForm.consumptionTaxMode === 'simplified'" class="cm-field">
                <label class="cm-label">事業区分</label>
                <select v-model="panelForm.simplifiedTaxCategory" class="cm-select">
                  <option :value="undefined">未設定</option>
                  <option :value="1">第一種（卸売業）90%</option>
                  <option :value="2">第二種（小売業）80%</option>
                  <option :value="3">第三種（製造業・建設業）70%</option>
                  <option :value="4">第四種（飲食店・その他）60%</option>
                  <option :value="5">第五種（サービス業）50%</option>
                  <option :value="6">第六種（不動産業）40%</option>
                </select>
              </div>
              <div class="cm-field">
                <label class="cm-label">税込/税抜</label>
                <div class="cm-radio-group">
                  <label class="cm-radio"><input type="radio" v-model="panelForm.taxMethod" value="inclusive"><span>税込</span></label>
                  <label class="cm-radio"><input type="radio" v-model="panelForm.taxMethod" value="exclusive"><span>税抜</span></label>
                </div>
              </div>
              <div class="cm-field">
                <label class="cm-label">経理方式</label>
                <select v-model="panelForm.calculationMethod" class="cm-select">
                  <option value="accrual">発生主義</option>
                  <option value="cash">現金主義</option>
                  <option value="interim_cash">中間現金主義</option>
                </select>
              </div>
              <div class="cm-field">
                <label class="cm-label">デフォルト支払方法</label>
                <select v-model="panelForm.defaultPaymentMethod" class="cm-select">
                  <option value="cash">現金</option>
                  <option value="owner_loan">事業主借</option>
                  <option value="accounts_payable">買掛金</option>
                </select>
              </div>
              <div class="cm-field">
                <label class="cm-checkbox-label">
                  <input type="checkbox" v-model="panelForm.isInvoiceRegistered">
                  <span>インボイス登録事業者</span>
                </label>
              </div>
              <div v-if="panelForm.isInvoiceRegistered" class="cm-field">
                <label class="cm-label">登録番号</label>
                <input type="text" v-model="panelForm.invoiceRegistrationNumber" class="cm-input" placeholder="T1234567890123">
              </div>
              <div class="cm-field">
                <label class="cm-checkbox-label">
                  <input type="checkbox" v-model="panelForm.hasDepartmentManagement">
                  <span>部門管理あり</span>
                </label>
              </div>
              <!-- 不動産所得あり（個人事業主のみ表示） -->
              <div v-if="panelForm.type === 'individual'" class="cm-field">
                <label class="cm-checkbox-label">
                  <input type="checkbox" v-model="panelForm.hasRentalIncome">
                  <span>不動産所得あり</span>
                </label>
                <span class="cm-hint" style="margin-left: 22px;">有効にすると不動産関連15科目が選択可能になります</span>
              </div>
            </div>

            <!-- 報酬設定セクション -->
            <div class="cm-section">
              <h3 class="cm-section-title">報酬設定</h3>
              <div class="cm-field">
                <label class="cm-label">月額顧問報酬</label>
                <div class="cm-amount-input">
                  <input type="number" v-model.number="panelForm.advisoryFee" class="cm-input cm-num-input" min="0">
                  <span class="cm-amount-unit">円</span>
                </div>
              </div>
              <div class="cm-field">
                <label class="cm-label">記帳代行</label>
                <div class="cm-amount-input">
                  <input type="number" v-model.number="panelForm.bookkeepingFee" class="cm-input cm-num-input" min="0">
                  <span class="cm-amount-unit">円</span>
                </div>
              </div>
              <div class="cm-field cm-computed-field">
                <label class="cm-label">月次合計（自動算出）</label>
                <span class="cm-computed-value">{{ (panelForm.advisoryFee + panelForm.bookkeepingFee).toLocaleString() }} 円</span>
              </div>
              <div class="cm-field">
                <label class="cm-label">決算報酬</label>
                <div class="cm-amount-input">
                  <input type="number" v-model.number="panelForm.settlementFee" class="cm-input cm-num-input" min="0">
                  <span class="cm-amount-unit">円</span>
                </div>
              </div>
              <div class="cm-field">
                <label class="cm-label">消費税申告報酬</label>
                <div class="cm-amount-input">
                  <input type="number" v-model.number="panelForm.taxFilingFee" class="cm-input cm-num-input" min="0">
                  <span class="cm-amount-unit">円</span>
                </div>
              </div>
              <div class="cm-field cm-computed-field">
                <label class="cm-label">年間総報酬（自動算出）</label>
                <span class="cm-computed-value">{{ annualTotal.toLocaleString() }} 円</span>
              </div>
            </div>

            <!-- マスタ自動コピー通知 (K14) -->
            <div v-if="panelMode === 'add'" class="cm-auto-copy-notice">
              <i class="fa-solid fa-circle-info"></i>
              新規作成時、勘定科目マスタと税区分マスタ（デフォルト表示27件）が自動的にコピーされます。
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 確認モーダル -->
    <ConfirmModal
      :show="modal.confirmState.show"
      :title="modal.confirmState.title"
      :message="modal.confirmState.message"
      :confirm-label="modal.confirmState.confirmLabel"
      :cancel-label="modal.confirmState.cancelLabel"
      :variant="modal.confirmState.variant"
      @confirm="modal.onConfirm"
      @cancel="modal.onCancel"
    />
    <!-- 通知モーダル -->
    <NotifyModal
      :show="modal.notifyState.show"
      :title="modal.notifyState.title"
      :message="modal.notifyState.message"
      :variant="modal.notifyState.variant"
      @close="modal.onNotifyClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, onActivated, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  useClients,
  emptyClientForm,
  createClientId,
} from '@/features/client-management/composables/useClients';
import type { Client, ClientForm } from '@/features/client-management/composables/useClients';
import { useStaff } from '@/features/staff-management/composables/useStaff';
import { useColumnResize } from '@/composables/useColumnResize';
import { useUnsavedGuard } from '@/composables/useUnsavedGuard';
import { useModalHelper } from '@/composables/useModalHelper';
import ConfirmModal from '@/components/ConfirmModal.vue';
import NotifyModal from '@/components/NotifyModal.vue';
import TableFilterToolbar from '@/components/TableFilterToolbar.vue';
import type { FilterColumnDef, FilterCondition, FilterResult, SortSetting } from '@/components/list-view/types';
import {
  parseViewFromQuery,
  parseFiltersFromQuery,
  parseLogicFromQuery,
  parseSortFromQuery,
  buildQueryParams,
  findViewByKey,
} from '@/utils/urlFilterSync';
import type { ViewDefWithDefaults } from '@/utils/urlFilterSync';

// 列幅カスタマイズ
const clDefaultWidths: Record<string, number> = {
  status: 70,
  clientId: 100,
  threeCode: 60,
  type: 50,
  taxMode: 70,
  companyName: 160,
  staffName: 90,
  accountingSoftware: 80,
  fiscalMonth: 90,
  phoneNumber: 110,
  email: 140,
  sharedEmail: 140,
  driveUrl: 100,
  chatRoomUrl: 140,
};
const { columnWidths: clColWidths, onResizeStart: onClResizeStart } = useColumnResize('master-clients', clDefaultWidths);

// --- クライアントデータ（composableから取得） ---
const { clients, getStaffNameForClient, updateSharedFolderId, addClient, updateClientLocal } = useClients();
const { staffList, activeStaff: activeStaffList } = useStaff();

// モーダルヘルパー
const modal = useModalHelper();

// 未保存変更ガード（JSON永続化移行済み。composable経由でAPI呼び出し済み）
const { markDirty, markClean } = useUnsavedGuard(null, modal);

// --- 業種リスト（ScreenS_Settings.vueと同一） ---
const industryOptions: string[] = [
  '', '飲食業', '建設業', '製造業・メーカー', '卸売業・小売業', '商社',
  '不動産業', '銀行・金融', '保険業', '医療・福祉関係業', 'コンサルティング',
  '専門事務所', '運輸・運送業', '旅行／宿泊／レジャー', 'IT・ソフトウェア関連',
  'スポーツ・ヘルス関連', '理容・美容・サロン', '冠婚葬祭', '警備関連',
  '清掃業', '教育業', '他サービス業', '官公庁・自治体', 'その他',
];

// --- URL同期・ビュー・フィルタ管理 ---
const route = useRoute();
const router = useRouter();

// 表示列管理 — 全フィールド定義（ビュー切替で表示/非表示を制御）
const allColumns = [
  // 基本情報（従来の14列）
  { key: 'clientId', label: '内部ID' },
  { key: 'threeCode', label: '3コード' },
  { key: 'type', label: '種別' },
  { key: 'taxMode', label: '課税方式' },
  { key: 'companyName', label: '会社名/代表者名' },
  { key: 'staffName', label: '担当者' },
  { key: 'accountingSoftware', label: '会計ソフト' },
  { key: 'fiscalMonth', label: '決算日' },
  { key: 'phoneNumber', label: '電話番号' },
  { key: 'email', label: 'メール' },
  { key: 'sharedEmail', label: '顧問先ログインメール' },
  { key: 'driveUrl', label: 'Drive取込' },
  { key: 'chatRoomUrl', label: 'チャットURL' },
  { key: 'contact', label: '主な連絡手段' },
  // 追加フィールド（「すべて」ビューで表示）
  { key: 'companyNameKana', label: '会社名（カナ）' },
  { key: 'repName', label: '代表者名' },
  { key: 'repNameKana', label: '代表者名（カナ）' },
  { key: 'contactType', label: '連絡手段区分' },
  { key: 'contactValue', label: '連絡先' },
  { key: 'sharedChatUrl', label: '共有チャットURL' },
  { key: 'industry', label: '業種' },
  { key: 'establishedDate', label: '設立日' },
  { key: 'taxFilingType', label: '確定申告' },
  { key: 'consumptionTaxMode', label: '課税方式（詳細）' },
  { key: 'simplifiedTaxCategory', label: '簡易課税 事業区分' },
  { key: 'taxMethod', label: '税込/税抜' },
  { key: 'calculationMethod', label: '経理方式' },
  { key: 'defaultPaymentMethod', label: 'デフォルト支払方法' },
  { key: 'isInvoiceRegistered', label: 'インボイス登録' },
  { key: 'invoiceRegistrationNumber', label: 'インボイス登録番号' },
  { key: 'hasDepartmentManagement', label: '部門管理' },
  { key: 'hasRentalIncome', label: '不動産所得' },
  { key: 'advisoryFee', label: '月額顧問報酬' },
  { key: 'bookkeepingFee', label: '記帳代行' },
  { key: 'settlementFee', label: '決算報酬' },
  { key: 'taxFilingFee', label: '消費税申告報酬' },
];

/** 基本情報ビューで表示する列キー（従来の14列） */
const basicViewCols = [
  'clientId', 'threeCode', 'type', 'taxMode', 'companyName', 'staffName',
  'accountingSoftware', 'fiscalMonth', 'phoneNumber', 'email',
  'sharedEmail', 'driveUrl', 'chatRoomUrl', 'contact',
];

// --- ビュー定義（デフォルトフィルタ・ソート付き） ---
const clientViews: ViewDefWithDefaults[] = [
  {
    name: '基本情報',
    key: 'basic',
    columns: basicViewCols,
    defaultFilters: [{ field: 'status', operator: 'in', value: ['active'] }],
    defaultSort: { key: 'threeCode', order: 'asc' },
  },
  {
    name: '（すべて）',
    key: 'all',
    columns: null,
    defaultFilters: [],
    defaultSort: { key: 'clientId', order: 'asc' },
  },
];

// URLからビュー・フィルタ・ソートを復元
const urlViewKey = parseViewFromQuery(route.query);
const initialView = findViewByKey(clientViews, urlViewKey) ?? clientViews[0]!;
const activeViewIndex = ref(clientViews.indexOf(initialView));

// URLにフィルタ条件がある場合はそれを使い、なければビューのデフォルトを適用
const urlFilters = parseFiltersFromQuery(route.query);
const initialFilters = urlFilters.length > 0 ? urlFilters : [...initialView.defaultFilters];
const initialSort = parseSortFromQuery(route.query, initialView.defaultSort);

// 表示列復元
const visibleColumns = ref<string[]>(
  initialView.columns === null
    ? allColumns.map(c => c.key)
    : [...initialView.columns]
);

/** 現在のビューのデフォルト値（フィルタモーダルの「デフォルトに戻す」用） */
const currentViewDefaults = computed(() => {
  const view = clientViews[activeViewIndex.value] ?? clientViews[0]!;
  return {
    filters: view.defaultFilters,
    sort: view.defaultSort,
  };
});


/** URLクエリパラメータを現在の状態で更新 */
function syncUrlQuery() {
  const currentView = clientViews[activeViewIndex.value] ?? clientViews[0]!;
  const query = buildQueryParams({
    viewName: currentView.key,
    conditions: filterConditions.value,
    logic: filterLogic.value,
    sort: filterSortSetting.value,
  });
  router.replace({ query });
}

/** ビュー切替時: デフォルトフィルタ・ソートに切替 + URL更新 */
const onViewChange = (idx: number) => {
  const view = clientViews[idx] ?? clientViews[0]!;
  // フィルタ・ソートをビューのデフォルトに戻す
  filterConditions.value = [...view.defaultFilters];
  filterSortSetting.value = { ...view.defaultSort };
  sortKey.value = view.defaultSort.key;
  sortOrder.value = view.defaultSort.order;
  syncUrlQuery();
};

// ステータス選択肢（テンプレート用）
const clientStatusOptions = [
  { value: 'active', label: '稼働中' },
  { value: 'suspension', label: '休眠中' },
  { value: 'inactive', label: '契約終了' },
];

// --- 絞り込みモーダル用列定義（ClientEditPageの全フィールド） ---
// staffListがリアクティブなためcomputedで動的生成
const clientFilterColumns = computed<FilterColumnDef[]>(() => [
  // ステータス
  { key: 'status', label: 'ステータス', filterType: 'select', filterOptions: clientStatusOptions },
  // 基本情報
  { key: 'type', label: '法人/個人', filterType: 'select', filterOptions: [
    { value: 'corp', label: '法人' }, { value: 'individual', label: '個人' },
  ] },
  { key: 'clientId', label: '内部ID', filterType: 'text' },
  { key: 'threeCode', label: '3コード', filterType: 'text' },
  { key: 'companyName', label: '会社名', filterType: 'text' },
  { key: 'companyNameKana', label: '会社名（カナ）', filterType: 'text' },
  { key: 'repName', label: '代表者名', filterType: 'text' },
  { key: 'repNameKana', label: '代表者名（カナ）', filterType: 'text' },
  { key: 'staffId', label: '担当者', filterType: 'select', filterOptions:
    staffList.value.map(s => ({ value: s.uuid, label: s.name }))
  },
  { key: 'phoneNumber', label: '電話番号', filterType: 'text' },
  { key: 'email', label: 'メールアドレス', filterType: 'text' },
  { key: 'chatRoomUrl', label: 'チャットルームURL', filterType: 'text' },
  { key: 'contactType', label: '主な連絡手段', filterType: 'select', filterOptions: [
    { value: 'email', label: 'メール' }, { value: 'chatwork', label: 'チャットワーク' },
    { value: 'none', label: 'なし' },
  ] },
  { key: 'contactValue', label: '連絡先', filterType: 'text' },
  { key: 'sharedEmail', label: '顧問先ログインメール', filterType: 'text' },
  { key: 'sharedChatUrl', label: '共有用チャットURL', filterType: 'text' },
  { key: 'fiscalMonth', label: '決算月', filterType: 'select', filterOptions:
    Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}月` }))
  },
  { key: 'industry', label: '業種', filterType: 'select', filterOptions: [
    { value: '飲食業', label: '飲食業' }, { value: '建設業', label: '建設業' },
    { value: '製造業・メーカー', label: '製造業・メーカー' }, { value: '卸売業・小売業', label: '卸売業・小売業' },
    { value: '商社', label: '商社' }, { value: '不動産業', label: '不動産業' },
    { value: '銀行・金融', label: '銀行・金融' }, { value: '保険業', label: '保険業' },
    { value: '医療・福祉関係業', label: '医療・福祉関係業' }, { value: 'コンサルティング', label: 'コンサルティング' },
    { value: '専門事務所', label: '専門事務所' }, { value: '運輸・運送業', label: '運輸・運送業' },
    { value: 'IT・ソフトウェア関連', label: 'IT・ソフトウェア関連' }, { value: 'その他', label: 'その他' },
  ] },
  { key: 'establishedDate', label: '設立日', filterType: 'text' },
  // 会計設定
  { key: 'accountingSoftware', label: '会計ソフト', filterType: 'select', filterOptions: [
    { value: 'mf', label: 'マネーフォワード' }, { value: 'freee', label: 'freee' },
    { value: 'yayoi', label: '弥生' }, { value: 'tkc', label: 'TKC' },
    { value: 'other', label: 'その他' },
  ] },
  { key: 'taxFilingType', label: '確定申告', filterType: 'select', filterOptions: [
    { value: 'blue', label: '青色' }, { value: 'white', label: '白色' },
  ] },
  { key: 'consumptionTaxMode', label: '課税方式', filterType: 'select', filterOptions: [
    { value: 'general', label: '原則課税' }, { value: 'simplified', label: '簡易課税' },
    { value: 'exempt', label: '免税' },
  ] },
  { key: 'simplifiedTaxCategory', label: '簡易課税 事業区分', filterType: 'select', filterOptions: [
    { value: '1', label: '第一種（卸売業）' }, { value: '2', label: '第二種（小売業）' },
    { value: '3', label: '第三種（製造業・建設業）' }, { value: '4', label: '第四種（飲食店・その他）' },
    { value: '5', label: '第五種（サービス業）' }, { value: '6', label: '第六種（不動産業）' },
  ] },
  { key: 'taxMethod', label: '税込/税抜', filterType: 'select', filterOptions: [
    { value: 'inclusive', label: '税込' }, { value: 'exclusive', label: '税抜' },
  ] },
  { key: 'calculationMethod', label: '経理方式', filterType: 'select', filterOptions: [
    { value: 'accrual', label: '発生主義' }, { value: 'cash', label: '現金主義' },
    { value: 'interim_cash', label: '中間現金主義' },
  ] },
  { key: 'defaultPaymentMethod', label: 'デフォルト支払方法', filterType: 'select', filterOptions: [
    { value: 'cash', label: '現金' }, { value: 'owner_loan', label: '事業主借' },
    { value: 'accounts_payable', label: '買掛金' },
  ] },
  { key: 'isInvoiceRegistered', label: 'インボイス登録', filterType: 'select', filterOptions: [
    { value: 'true', label: '登録済み' }, { value: 'false', label: '未登録' },
  ] },
  { key: 'invoiceRegistrationNumber', label: 'インボイス登録番号', filterType: 'text' },
  { key: 'hasDepartmentManagement', label: '部門管理', filterType: 'select', filterOptions: [
    { value: 'true', label: 'あり' }, { value: 'false', label: 'なし' },
  ] },
  { key: 'hasRentalIncome', label: '不動産所得', filterType: 'select', filterOptions: [
    { value: 'true', label: 'あり' }, { value: 'false', label: 'なし' },
  ] },
  // 報酬設定
  { key: 'advisoryFee', label: '月額顧問報酬', filterType: 'number' },
  { key: 'bookkeepingFee', label: '記帳代行', filterType: 'number' },
  { key: 'settlementFee', label: '決算報酬', filterType: 'number' },
  { key: 'taxFilingFee', label: '消費税申告報酬', filterType: 'number' },
]);

// --- 絞り込み条件state（URLから初期値復元） ---
const filterConditions = ref<FilterCondition[]>(initialFilters);
const filterLogic = ref<'and' | 'or'>(parseLogicFromQuery(route.query));
const filterSortSetting = ref<SortSetting>(initialSort);

/** フィルター変更時: URLクエリパラメータを更新 */
const onFilterChange = () => {
  syncUrlQuery();
};

/** 絞り込みモーダル適用時 */
const onFilterApply = (result: FilterResult) => {
  filterConditions.value = result.conditions;
  filterLogic.value = result.logic;
  filterSortSetting.value = result.sort;
  // ソート設定をローカルstateに反映
  sortKey.value = result.sort.key;
  sortOrder.value = result.sort.order;
  // URL同期
  syncUrlQuery();
};

/** フィルタ条件を個別削除（タグの×ボタン） */
const onFilterRemove = (index: number) => {
  filterConditions.value.splice(index, 1);
  syncUrlQuery();
};

/** visibleColumnsの順序でallColumnsから列定義を取得（全列統一描画用） */
const visibleColumnDefs = computed(() => {
  return visibleColumns.value
    .map(k => allColumns.find(c => c.key === k))
    .filter((c): c is { key: string; label: string } => !!c);
});

/** セルのCSSクラスを列キーから動的取得 */
const getCellClass = (key: string): string => {
  const editableKeys = new Set(['threeCode', 'type', 'companyName', 'staffName', 'accountingSoftware', 'fiscalMonth', 'phoneNumber', 'email', 'sharedEmail', 'chatRoomUrl']);
  const classes: string[] = [];
  if (editableKeys.has(key)) classes.push('td-editable');
  if (['email', 'sharedEmail', 'chatRoomUrl'].includes(key)) classes.push('cm-ellipsis');
  if (key === 'companyName') classes.push('cm-company-name');
  if (key === 'fiscalMonth') classes.push('cm-fiscal');
  if (key === 'driveUrl') classes.push('cm-drive-cell');
  if (key === 'contact') classes.push('cm-contact-cell');
  if (key === 'clientId') classes.push('cm-client-id');
  if (key === 'threeCode') classes.push('cm-code');
  return classes.join(' ');
};

/** インライン編集可能列か（dblclick対象） */
const isEditableCol = (key: string): boolean => {
  return ['threeCode', 'type', 'companyName', 'staffName', 'accountingSoftware', 'fiscalMonth', 'phoneNumber', 'email', 'sharedEmail', 'chatRoomUrl'].includes(key);
};

/** 汎用テキスト入力で編集する列 */
const isTextEditCol = (key: string): boolean => {
  return ['phoneNumber', 'email', 'chatRoomUrl'].includes(key);
};

/** データ行から動的フィールド値を取得（汎用） */
const getFieldValue = (row: any, key: string): string => {
  const val = row[key];
  if (val === undefined || val === null) return '—';
  if (typeof val === 'boolean') return val ? 'あり' : 'なし';
  if (typeof val === 'number') return val.toLocaleString();
  return String(val);
};

/** 列幅をラベル文字数から動的算出 or 保存値から取得 */
const getColWidth = (col: { key: string; label: string }): number => {
  const saved = clColWidths.value[col.key];
  if (saved) return saved;
  let w = 0;
  for (const ch of col.label) {
    w += ch.charCodeAt(0) > 0x7F ? 16 : 9;
  }
  return Math.max(w + 32, 100);
};

// --- ソート（URLから初期値復元） ---
const sortKey = ref<string>(initialSort.key);
const sortOrder = ref<'asc' | 'desc'>(initialSort.order);

const sortBy = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

const getSortIcon = (key: string) => {
  if (sortKey.value !== key) return 'fa-solid fa-sort cm-sort-icon';
  return sortOrder.value === 'asc' ? 'fa-solid fa-sort-up cm-sort-icon active' : 'fa-solid fa-sort-down cm-sort-icon active';
};

// --- フィルター＋ソート済みデータ（API化済み） ---
const isLoading = ref(true);
const filteredRows = ref<Client[]>([]);
const PAGE_SIZE = 50;
const currentPage = ref(1);
const totalPages = ref(1);
const pagedRows = computed(() => filteredRows.value);

/** POST /api/clients/list でサーバー側でフィルタ+ソート+ページネーション */
const fetchClientList = async () => {
  isLoading.value = true;
  try {
    const res = await fetch('/api/clients/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: filterConditions.value,
        logic: filterLogic.value,
        sortKey: sortKey.value,
        sortOrder: sortOrder.value,
        page: currentPage.value,
        pageSize: PAGE_SIZE,
      }),
    });
    const data = await res.json();
    filteredRows.value = data.rows;
    totalPages.value = data.totalPages;
  } catch (e) {
    console.error('[ClientsPage] リスト取得失敗:', e);
  } finally {
    isLoading.value = false;
  }
};

// フィルタ・ソート・ページ変更時に自動でAPI再呼び出し（バッチ化で二重発火防止）
let fetchPending = false;
watch([filterConditions, filterLogic, sortKey, sortOrder, currentPage], () => {
  if (fetchPending) return;
  fetchPending = true;
  nextTick(() => {
    fetchPending = false;
    fetchClientList();
  });
}, { immediate: true, deep: true });

// 初回表示時にURLパラメータを書き込む（デフォルト設定をURLに反映）
if (!urlViewKey) {
  nextTick(() => syncUrlQuery());
}

// KeepAliveからの復帰時にデータを再取得
onActivated(() => fetchClientList());

/** データ変更後にリストを再取得 */
const refreshList = () => fetchClientList();

// --- インライン編集 ---
const inlineEditId = ref<string | null>(null);
const inlineEditField = ref<string | null>(null);
const inlineEditValue = ref<string | number>('');
const inlineEditFiscalDay = ref<string | number>('末日');

/** インライン編集対象フィールド（Client型のキーに限定） */
type InlineEditableField = 'status' | 'threeCode' | 'type' | 'companyName' | 'accountingSoftware' | 'fiscalMonth' | 'phoneNumber' | 'email' | 'sharedEmail' | 'chatRoomUrl';

const startInlineEdit = (row: Client, field: InlineEditableField, event: Event) => {
  event.stopPropagation();
  inlineEditId.value = row.clientId;
  inlineEditField.value = field;
  inlineEditValue.value = row[field] ?? '';
  if (field === 'fiscalMonth') {
    inlineEditFiscalDay.value = row.fiscalDay ?? '末日';
  }
  nextTick(() => {
    const el = document.querySelector('.cm-inline-input, .cm-inline-select') as HTMLElement;
    if (el) el.focus();
  });
};

const commitInlineEdit = async (_row: Client) => {
  if (inlineEditId.value && inlineEditField.value) {
    // --- 3コード重複チェック（インライン編集時） ---
    if (inlineEditField.value === 'threeCode' && inlineEditValue.value) {
      const duplicate = clients.value.find(
        c => c.threeCode === inlineEditValue.value && c.clientId !== inlineEditId.value
      );
      if (duplicate) {
        await modal.notify({
          title: '3コードが重複しています。変更してください',
          message: `「${duplicate.companyName}（${duplicate.clientId}）」で既に使用されています。`,
          variant: 'warning',
        });
        cancelInlineEdit();
        return;
      }
    }
    // composable経由でサーバーに永続化
    updateClientLocal(inlineEditId.value, { [inlineEditField.value]: inlineEditValue.value } as Partial<Client>);
    // 3コード変更時はDriveフォルダもリネーム
    if (inlineEditField.value === 'threeCode') {
      const client = clients.value.find(c => c.clientId === inlineEditId.value);
      if (client) {
        const renamed = await renameDriveFolderForClient(client);
        if (renamed) {
          await modal.notify({ title: `Googleドライブ名を「${renamed}」に変更しました`, variant: 'success' });
        }
      }
    }
  }
  const clFieldLabels: Record<string, string> = { threeCode: '3コード', companyName: '会社名', companyNameKana: '会社名カナ', repName: '代表者名', repNameKana: '代表者名カナ', type: '種別', status: 'ステータス', industry: '業種', phoneNumber: '電話番号', email: 'メール', sharedEmail: '顧問先ログインメール' };
  const clLabel = clFieldLabels[inlineEditField.value ?? ''] ?? inlineEditField.value;
  markDirty(`${clLabel}を変更`);
  markClean();
  cancelInlineEdit();
  refreshList();
};

const commitFiscalEdit = (_row: Client) => {
  if (inlineEditId.value) {
    // composable経由でサーバーに永続化
    updateClientLocal(inlineEditId.value, {
      fiscalMonth: Number(inlineEditValue.value),
      fiscalDay: inlineEditFiscalDay.value,
    });
  }
  markDirty('決算日を変更');
  markClean();
  cancelInlineEdit();
};

const cancelInlineEdit = () => {
  inlineEditId.value = null;
  inlineEditField.value = null;
  inlineEditValue.value = '';
  inlineEditFiscalDay.value = '末日';
};

// --- パネル ---
const panelMode = ref<'add' | 'edit' | null>(null);
const editingId = ref<string | null>(null);
const showIndustryDropdown = ref(false);

const panelForm = reactive<ClientForm>(emptyClientForm());
const panelStaffId = ref(''); // パネル用スタッフID
const panelSharedEmail = ref(''); // パネル用共有メール
const panelSharedChatUrl = ref(''); // パネル用共有チャットURL

// B修正: 法人→個人切替時にhasRentalIncomeをリセット
watch(() => panelForm.type, (newType) => {
  if (newType === 'corp') {
    panelForm.hasRentalIncome = false;
  }
});


const closePanel = () => {
  panelMode.value = null;
  editingId.value = null;
  showIndustryDropdown.value = false;
};

const saveClient = async () => {
  if (!panelForm.companyName && !panelForm.repName) {
    await modal.notify({ title: '会社名または代表者名のどちらかを入力してください', variant: 'warning' });
    return;
  }
  // --- 3コード重複チェック ---
  if (panelForm.threeCode) {
    const duplicate = clients.value.find(
      c => c.threeCode === panelForm.threeCode && c.clientId !== editingId.value
    );
    if (duplicate) {
      await modal.notify({
        title: '3コードが重複しています。変更してください',
        message: `「${duplicate.companyName}（${duplicate.clientId}）」で既に使用されています。`,
        variant: 'warning',
      });
      return;
    }
  }
  const { contactType, contactValue, ...fields } = panelForm;
  const clientId = editingId.value
    ? editingId.value
    : createClientId(panelForm.threeCode, clients.value);
  const data: Client = {
    ...fields,
    clientId,
    staffId: panelStaffId.value || null,
    sharedEmail: panelSharedEmail.value,
    sharedChatUrl: panelSharedChatUrl.value,
    contact: { type: contactType, value: contactValue },
  };
  if (panelMode.value === 'add') {
    addClient(data);
    // Driveフォルダ自動作成（共有ドライブ内にフォルダを作成）
    createDriveFolderForClient(data).catch(err => {
      console.error('[clients] Driveフォルダ作成失敗:', err);
    });
    await modal.notify({ title: `「${data.companyName}」を追加しました`, message: '勘定科目マスタと税区分マスタ（デフォルト表示27件）が自動的にコピーされました。\nGoogle Driveフォルダも自動作成されます。', variant: 'success' });
  } else {
    // 編集時: 3コードが変わった場合はDriveフォルダもリネーム
    const oldClient = clients.value.find(c => c.clientId === data.clientId);
    updateClientLocal(data.clientId, data);
    if (oldClient && oldClient.threeCode !== data.threeCode) {
      const renamed = await renameDriveFolderForClient(data);
      if (renamed) {
        await modal.notify({ title: `Googleドライブ名を「${renamed}」に変更しました`, variant: 'success' });
      }
    }
    await modal.notify({ title: `「${data.companyName}」を更新しました`, variant: 'success' });
  }
  closePanel();
  markDirty(panelMode.value === 'add' ? `「${data.companyName}」を追加` : `「${data.companyName}」を更新`);
  markClean();
  refreshList();
};

// --- K13: 休眠・契約終了 ---
const confirmSuspend = async () => {
  const ok = await modal.confirm({
    title: `「${panelForm.companyName}」を休眠にしますか？`,
    message: '休眠中も顧問先データは保持されます。再開も可能です。',
    variant: 'danger',
    confirmLabel: '休眠にする',
    cancelLabel: 'キャンセル',
  });
  if (ok) {
    panelForm.status = 'suspension';
    saveClient();
  }
};

const confirmTerminate = async () => {
  const ok = await modal.confirm({
    title: `「${panelForm.companyName}」の契約を終了しますか？`,
    message: '顧問先データは保持されますが、契約終了として記録されます。',
    variant: 'danger',
    confirmLabel: '契約終了',
    cancelLabel: 'キャンセル',
  });
  if (ok) {
    panelForm.status = 'inactive';
    saveClient();
  }
};

const restoreClient = () => {
  panelForm.status = 'active';
  saveClient();
};

// --- ヘルパー ---
const softwareLabel = (s: string) => {
  const map: Record<string, string> = { mf: 'MF', freee: 'freee', yayoi: '弥生', tkc: 'TKC', other: 'その他' };
  return map[s] || s;
};

const taxModeLabel = (mode: string) => {
  const map: Record<string, string> = { general: '本則', simplified: '簡易', exempt: '免税' };
  return map[mode] || mode;
};



const annualTotal = computed(() => {
  const monthly = panelForm.advisoryFee + panelForm.bookkeepingFee;
  return monthly * 12 + panelForm.settlementFee + panelForm.taxFilingFee;
});

// --- スタッフ紐付けインライン編集 ---
const startStaffInlineEdit = (row: Client, event: Event) => {
  event.stopPropagation();
  inlineEditId.value = row.clientId;
  inlineEditField.value = 'staffName';
  // Client.staffIdから直接取得
  inlineEditValue.value = row.staffId ?? '';
  nextTick(() => {
    const el = document.querySelector('.cm-inline-select') as HTMLElement;
    if (el) el.focus();
  });
};

const commitStaffEdit = (_row: Client) => {
  if (inlineEditId.value) {
    const staffId = inlineEditValue.value as string;
    // composable経由でサーバーに永続化
    updateClientLocal(inlineEditId.value, { staffId: staffId || null });
  }
  markDirty('担当者を変更');
  markClean();
  cancelInlineEdit();
  refreshList();
};

// --- ドロップダウン外クリックで閉じる ---
const closeDropdowns = () => { showIndustryDropdown.value = false; };
onMounted(() => document.addEventListener('click', closeDropdowns));
onUnmounted(() => document.removeEventListener('click', closeDropdowns));

// --- Drive取込 URL ---
const driveUrlCopied = ref<string | null>(null);

/** テーブル行のDrive共有フォルダURLをコピー */
const copyDriveUrl = async (row: Client) => {
  const url = `https://drive.google.com/drive/folders/${row.sharedFolderId}`;
  try {
    await navigator.clipboard.writeText(url);
    driveUrlCopied.value = row.clientId;
    setTimeout(() => { driveUrlCopied.value = null; }, 2500);
  } catch {
    window.prompt('URLをコピーしてください:', url);
  }
};
/** Driveフォルダ自動作成（新規登録時） */
const createDriveFolderForClient = async (client: Client) => {
  const folderName = `${client.threeCode}_${client.companyName}`;
  const sharedEmail = client.sharedEmail || '';
  try {
    const res = await fetch('/api/drive/folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderName, sharedEmail: sharedEmail || undefined }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    const data = await res.json() as { folderId: string };
    console.log(`[clients] Driveフォルダ作成完了: ${folderName} (id=${data.folderId})`);
    // sharedFolderIdを更新（driveIdではなくsharedFolderIdに統一）
    updateSharedFolderId(client.clientId, data.folderId);
    markDirty('Driveフォルダ作成');
    markClean();
  } catch (err) {
    console.error(`[clients] Driveフォルダ作成失敗 (${folderName}):`, err);
  }
};

/** Driveフォルダリネーム（3コードまたは会社名変更時） */
const renameDriveFolderForClient = async (client: Client): Promise<string | null> => {
  if (!client.sharedFolderId) return null;
  const newName = `${client.threeCode}_${client.companyName}`;
  try {
    const res = await fetch('/api/drive/folder/rename', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId: client.sharedFolderId, newName }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    console.log(`[clients] Driveフォルダリネーム完了: ${newName}`);
    return newName;
  } catch (err) {
    console.error(`[clients] Driveフォルダリネーム失敗 (${newName}):`, err);
    return null;
  }
};

</script>

<style>
@import '@/styles/master-list.css';
</style>
