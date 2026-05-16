<template>
  <div class="absolute inset-0 flex flex-col overflow-hidden bg-gray-50 font-sans">
    <div class="cm-settings">
        <!-- ヘッダー -->
        <div class="cm-header">
          <h1 class="cm-title">見込管理</h1>
          <div class="cm-header-actions" v-if="isAdmin">
            <button
              class="cm-admin-btn"
              @click="$router.push({ name: 'LeadViewSettings' })"
            >
              <i class="fa-solid fa-list-check"></i> 一覧管理
            </button>
            <button
              class="cm-admin-btn"
              :class="{ active: leadAdminMode === 'field' }"
              :disabled="leadAdminMode === 'layout'"
              @click="toggleLeadAdminMode('field')"
            >
              <i class="fa-solid fa-puzzle-piece"></i> フィールド管理
            </button>
            <button
              class="cm-admin-btn"
              :class="{ active: leadAdminMode === 'layout' }"
              :disabled="leadAdminMode === 'field'"
              @click="toggleLeadAdminMode('layout')"
            >
              <i class="fa-solid fa-grip"></i> レイアウト管理
            </button>
          </div>
        </div>

        <!-- ツールバー（共通コンポーネント） -->
        <TableFilterToolbar
          :columns="allColumns"
          v-model:visible-columns="visibleColumns"
          :total-count="filteredRows.length"
          :views="leadViews"
          v-model:active-view-index="activeViewIndex"
          :filter-columns="leadFilterColumns"
          :filter-conditions="filterConditions"
          :filter-logic="filterLogic"
          :filter-sorts="filterSortSettings"
          @filter-change="onFilterChange"
          @filter-apply="onFilterApply"
          @view-change="onViewChange"
        >
          <template #actions>
            <button class="cm-action-btn primary" @click="$router.push('/master/leads/new')">
              <i class="fa-solid fa-plus"></i> 新規追加
            </button>
          </template>
        </TableFilterToolbar>

        <!-- ページネーション + CSVボタン -->
        <div class="cm-pagination-row">
          <div class="cm-pagination">
            <span class="cm-page-arrow" :class="{ disabled: currentPage <= 1 }" @click="currentPage = Math.max(1, currentPage - 1)">＜</span>
            <span
              v-for="p in totalPages" :key="p"
              class="cm-page-num" :class="{ active: p === currentPage }"
              @click="currentPage = p"
            >{{ p }}</span>
            <span class="cm-page-arrow" :class="{ disabled: currentPage >= totalPages }" @click="currentPage = Math.min(totalPages, currentPage + 1)">＞</span>
            <span class="cm-page-info">{{ leadPageStartIndex }}~{{ leadPageEndIndex }} / 全{{ leadTotalCount }}件</span>
          </div>
          <div class="cm-csv-actions">
            <div class="cm-io-dropdown" :class="{ open: importDropdownOpen }" @click.stop>
              <button class="cm-admin-btn" @click="toggleImportDropdown">
                <i class="fa-solid fa-file-import"></i> インポート <i class="fa-solid fa-caret-down" style="font-size:10px;margin-left:2px"></i>
              </button>
              <div class="cm-io-dropdown-menu">
                <button class="cm-io-dropdown-item" @click="handleLeadCsvImport(); importDropdownOpen = false">
                  <i class="fa-solid fa-file-csv"></i> CSV
                </button>
                <button class="cm-io-dropdown-item" @click="handleLeadCsvImport(); importDropdownOpen = false">
                  <i class="fa-solid fa-file-excel"></i> Excel (.xlsx / .xls)
                </button>
              </div>
            </div>
            <div class="cm-io-dropdown" :class="{ open: exportDropdownOpen }" @click.stop>
              <button class="cm-admin-btn" @click="toggleExportDropdown">
                <i class="fa-solid fa-file-export"></i> エクスポート <i class="fa-solid fa-caret-down" style="font-size:10px;margin-left:2px"></i>
              </button>
              <div class="cm-io-dropdown-menu">
                <button class="cm-io-dropdown-item" @click="handleLeadCsvExport(); exportDropdownOpen = false">
                  <i class="fa-solid fa-file-csv"></i> CSV
                </button>
                <button class="cm-io-dropdown-item" @click="handleLeadExcelExport(); exportDropdownOpen = false">
                  <i class="fa-solid fa-file-excel"></i> Excel (.xlsx)
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- テーブル -->
        <div class="cm-table-wrap">
          <table class="cm-table" :style="{ tableLayout: 'fixed', width: '100%', minWidth: tableWidth + 'px' }">
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
              <tr v-for="row in pagedRows" :key="row.leadId"
                :class="{ 'row-inactive': row.status === 'inactive', 'row-suspension': row.status === 'suspension' }">
                <td class="cm-td-status">
                  <div class="cm-status-icon-group" @click.stop="$router.push(`/master/leads/${row.leadId}`)">
                    <i class="fa-solid fa-pen cm-status-pen" :class="'pen-' + row.status"></i>
                  </div>
                </td>
                <td v-for="col in visibleColumnDefs" :key="'td-'+col.key" class="cm-td-cell"
                  :class="getCellClass(col.key)"
                  @dblclick.stop="isEditableCol(col.key) ? (col.key === 'staffId' ? startStaffInlineEdit(row, $event) : startInlineEdit(row, col.key as InlineEditableField, $event)) : undefined"
                >
                  <template v-if="col.key === 'threeCode'">
                    <input v-if="inlineEditId === row.leadId && inlineEditField === 'threeCode'" v-model="inlineEditValue" class="cm-inline-input" maxlength="3" @input="inlineEditValue = String(inlineEditValue).toUpperCase().replace(/[^A-Z]/g, '')" @blur="commitInlineEdit(row)" @keydown.enter="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                    <span v-else>{{ row.threeCode }}</span>
                  </template>
                  <template v-else-if="col.key === 'type'">
                    <select v-if="inlineEditId === row.leadId && inlineEditField === 'type'" v-model="inlineEditValue" class="cm-inline-select" @blur="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                      <option v-for="o in TYPE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </select>
                    <span v-else>{{ getLabel(TYPE_OPTIONS, row.type) }}</span>
                  </template>
                  <template v-else-if="col.key === 'consumptionTaxMode'">{{ taxModeLabel(row.consumptionTaxMode) }}</template>
                  <template v-else-if="col.key === 'companyName'">
                    <input v-if="inlineEditId === row.leadId && inlineEditField === 'companyName'" v-model="inlineEditValue" class="cm-inline-input" @blur="commitInlineEdit(row)" @keydown.enter="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                    <span v-else>{{ (row.type === 'individual' || row.type === 'sole_proprietor') && row.repName ? row.repName : row.companyName }}</span>
                  </template>
                  <template v-else-if="col.key === 'staffId'">
                    <select v-if="inlineEditId === row.leadId && inlineEditField === 'staffId'" v-model="inlineEditValue" class="cm-inline-select" @blur="commitStaffEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                      <option value="">{{ PLACEHOLDER_UNSET }}</option>
                      <option v-for="s in staffList" :key="s.uuid" :value="s.uuid">{{ s.name }}</option>
                    </select>
                    <span v-else>{{ getStaffNameForLead(row.leadId) || '—' }}</span>
                  </template>
                  <template v-else-if="col.key === 'accountingSoftware'">
                    <select v-if="inlineEditId === row.leadId && inlineEditField === 'accountingSoftware'" v-model="inlineEditValue" class="cm-inline-select" @blur="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                      <option v-for="o in ACCOUNTING_SOFTWARE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </select>
                    <span v-else>{{ softwareLabel(row.accountingSoftware) }}</span>
                  </template>
                  <template v-else-if="col.key === 'fiscalDate'">
                    <template v-if="inlineEditId === row.leadId && inlineEditField === 'fiscalDate'">
                      <div class="cm-inline-fiscal-group">
                        <select v-model="inlineEditValue" class="cm-inline-select cm-inline-fiscal-sel" @keydown.escape="cancelInlineEdit" @click.stop><option v-for="m in 12" :key="m" :value="m">{{ m }}月</option></select>
                        <span class="cm-inline-fiscal-sep">/</span>
                        <select v-model="inlineEditFiscalDay" class="cm-inline-select cm-inline-fiscal-sel" @keydown.escape="cancelInlineEdit" @click.stop><option :value="FISCAL_DAY_END_LABEL">{{ FISCAL_DAY_END_LABEL }}</option><option v-for="d in 31" :key="d" :value="d">{{ d }}日</option></select>
                        <button class="cm-inline-fiscal-ok" @click.stop="commitFiscalEdit(row)">✓</button>
                      </div>
                    </template>
                    <span v-else>{{ row.fiscalMonth }}月/{{ row.fiscalDay === FISCAL_DAY_END_LABEL ? FISCAL_DAY_END_LABEL : row.fiscalDay + '日' }}</span>
                  </template>
                  <template v-else-if="col.key === 'sharedEmail'">
                    <input v-if="inlineEditId === row.leadId && inlineEditField === 'sharedEmail'" v-model="inlineEditValue" class="cm-inline-input" @blur="commitInlineEdit(row)" @keydown.enter="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                    <span v-else-if="row.sharedEmail" class="cm-shared-email">🔗 {{ row.sharedEmail }}</span>
                    <span v-else class="cm-shared-email-none">未取得（見込先が登録）</span>
                  </template>
                  <template v-else-if="col.key === 'driveUrl'">
                    <template v-if="!row.sharedFolderId"><span class="cm-drive-none">—</span></template>
                    <template v-else>
                      <span v-if="driveUrlCopied === row.leadId" class="cm-drive-copied">✅ コピー済</span>
                      <span v-else class="cm-drive-link" @click.stop="copyDriveUrl(row)">📋 URLコピー</span>
                    </template>
                  </template>
                  <template v-else-if="col.key === 'contact'">
                    <span v-if="row.contacts?.find((c: any) => c.method === 'チャット' && c.value)">チャットワーク</span>
                    <span v-else-if="row.contacts?.find((c: any) => c.method === 'メール' && c.value)" class="cm-contact-fallback">メール <i class="fa-solid fa-triangle-exclamation cm-contact-warn" title="チャットワークURLが空白です。"></i></span>
                    <span v-else-if="row.chatRoomUrl">チャットワーク</span>
                    <span v-else-if="row.email" class="cm-contact-fallback">メール <i class="fa-solid fa-triangle-exclamation cm-contact-warn" title="チャットワークURLが空白です。"></i></span>
                    <span v-else>—</span>
                  </template>
                  <template v-else-if="isTextEditCol(col.key)">
                    <input v-if="inlineEditId === row.leadId && inlineEditField === col.key" v-model="inlineEditValue" class="cm-inline-input" @blur="commitInlineEdit(row)" @keydown.enter="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                    <span v-else>{{ (row as any)[col.key] || '—' }}</span>
                  </template>
                  <template v-else>{{ getFieldValue(row, col.key) }}</template>
                </td>
              </tr>
              <tr v-if="isLoading || pagedRows.length === 0">
                <td :colspan="visibleColumnDefs.length + 1" class="cm-empty">
                  <template v-if="isLoading">
                    <i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px;"></i>{{ loadingMessage }}
                  </template>
                  <template v-else>該当する見込先がありません</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    <!-- スライドインパネル（追加/編集） -->
    <transition name="slide-panel">
      <div v-if="panelMode" class="cm-panel-overlay" @click.self="closePanel">
        <div class="cm-panel-container">
          <div class="cm-panel-header">
            <h2 class="cm-panel-title">{{ panelMode === 'add' ? UI_MSG.見込先を追加 : UI_MSG.見込先を編集 }}</h2>
            <div class="cm-panel-header-actions">
              <button v-if="panelMode === 'edit' && panelForm.status === 'active'" class="cm-panel-stop-btn" @click="confirmSuspend">
                ⏸️ 休眠
              </button>
              <button v-if="panelMode === 'edit' && panelForm.status === 'active'" class="cm-panel-terminate-btn" @click="confirmTerminate">
                ⛔ 契約終了
              </button>
              <button v-if="panelMode === 'edit' && (panelForm.status === 'inactive' || panelForm.status === 'suspension')" class="cm-panel-restore-btn" @click="restoreLead">
                <i class="fa-solid fa-rotate-left"></i> 稼働に戻す
              </button>
              <button class="cm-panel-cancel" @click="closePanel">キャンセル</button>
              <button class="cm-panel-save" @click="saveLead">
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
                  <option value="">{{ PLACEHOLDER_UNSET }}</option>
                  <option v-for="s in activeStaffList" :key="s.uuid" :value="s.uuid">{{ s.name }}</option>
                </select>
              </div>
              <!-- Drive関連UI削除（ロジックは温存） -->
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
                <label class="cm-label">見込先ログインメール <span class="cm-hint">※自動取得（見込先がポータルログイン時に登録）</span></label>
                <input type="email" v-model="panelSharedEmail" class="cm-input" placeholder="shared@example.com">
              </div>
              <div class="cm-field">
                <label class="cm-label">決算日</label>
                <div class="cm-date-group">
                  <select v-model="panelForm.fiscalMonth" class="cm-select">
                    <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
                  </select>
                  <span class="cm-date-separator">/</span>
                  <select v-model="panelForm.fiscalDay" class="cm-select">
                    <option :value="FISCAL_DAY_END_LABEL">{{ FISCAL_DAY_END_LABEL }}</option>
                    <option v-for="d in 31" :key="d" :value="d">{{ d }}日</option>
                  </select>
                </div>
              </div>
              <div class="cm-field" style="position: relative;">
                <label class="cm-label">業種</label>
                <div class="cm-custom-select" @click.stop="showIndustryDropdown = !showIndustryDropdown">
                  <span :class="{ 'cm-placeholder': !panelForm.industry }">{{ panelForm.industry || UI_MSG.未設定 }}</span>
                  <i class="fa-solid fa-chevron-down cm-select-arrow" :class="{ rotated: showIndustryDropdown }"></i>
                </div>
                <div v-if="showIndustryDropdown" class="cm-dropdown" @click.stop>
                  <div v-for="opt in industryOptions" :key="opt.value" class="cm-dropdown-item" :class="{ selected: panelForm.industry === opt.value }" @click="panelForm.industry = opt.value; showIndustryDropdown = false">{{ opt.label }}</div>
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
                  <option v-for="o in ACCOUNTING_SOFTWARE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
              </div>
              <div class="cm-field">
                <label class="cm-label">確定申告</label>
                <select v-model="panelForm.taxFilingType" class="cm-select">
                  <option v-for="o in TAX_FILING_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
              </div>
              <div class="cm-field">
                <label class="cm-label">課税方式</label>
                <select v-model="panelForm.consumptionTaxMode" class="cm-select">
                  <option v-for="o in TAX_MODE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
              </div>
              <div v-if="panelForm.consumptionTaxMode === 'simplified'" class="cm-field">
                <label class="cm-label">事業区分</label>
                <select v-model="panelForm.simplifiedTaxCategory" class="cm-select">
                  <option :value="undefined">{{ PLACEHOLDER_UNSET }}</option>
                  <option v-for="o in SIMPLIFIED_CATEGORY_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
              </div>
              <div class="cm-field">
                <label class="cm-label">税込/税抜</label>
                <select v-model="panelForm.taxMethod" class="cm-select">
                  <option v-for="o in TAX_METHOD_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
              </div>
              <div class="cm-field">
                <label class="cm-label">経理方式</label>
                <select v-model="panelForm.calculationMethod" class="cm-select">
                  <option v-for="o in CALCULATION_METHOD_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
              </div>
              <div class="cm-field">
                <label class="cm-label">デフォルト支払方法</label>
                <select v-model="panelForm.defaultPaymentMethod" class="cm-select">
                  <option v-for="o in DEFAULT_PAYMENT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
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
              <div v-if="panelForm.type === 'individual' || panelForm.type === 'sole_proprietor'" class="cm-field">
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

    <!-- フィールド管理モーダル（全社共通） -->
    <CustomFieldModal
      :visible="showLeadFieldModal"
      :custom-defs="leadFieldLayout.customDefs.value"
      :section-keys="leadSectionKeys"
      :layout-fields="leadFieldLayout.fields.value"
      :field-rows="leadFieldLayout.fieldRows.value"
      :default-field-keys="leadFieldLayout.defaultFields.map(f => f.key)"
      :label-overrides="leadFieldLayout.labelOverrides.value"
      :hidden-fields="leadFieldLayout.hiddenFields.value"
      :deleted-fields="leadFieldLayout.deletedFields.value"
      :field-options="leadFieldLayout.fieldOptions.value"
      @update:visible="showLeadFieldModal = $event"
      @save="handleLeadFieldSave"
    />

    <!-- フィールド追加モーダル -->
    <AddFieldModal
      :visible="showLeadAddFieldModal"
      :section-keys="leadSectionKeys"
      :default-section="leadAddFieldDefaultSection"
      @update:visible="showLeadAddFieldModal = $event"
      @add="handleLeadAddField"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, onActivated, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  useLeads,
  emptyLeadForm,
} from '@/features/lead-management/composables/useLeads';
import type { Lead, LeadForm } from '@/features/lead-management/composables/useLeads';
import { useStaff } from '@/features/staff-management/composables/useStaff';
import { useColumnResize } from '@/composables/useColumnResize';
import { useUnsavedGuard } from '@/composables/useUnsavedGuard';
import { useModalHelper } from '@/composables/useModalHelper';
import { useDriveFolder } from '@/composables/useDriveFolder';
import { useCurrentUser } from '@/composables/useCurrentUser';
import {
  INDUSTRY_OPTIONS, ACCOUNTING_SOFTWARE_OPTIONS, TAX_MODE_OPTIONS,
  TAX_FILING_OPTIONS, SIMPLIFIED_CATEGORY_OPTIONS, TAX_METHOD_OPTIONS,
  CALCULATION_METHOD_OPTIONS, DEFAULT_PAYMENT_OPTIONS,
  TYPE_OPTIONS, CONTACT_METHOD_OPTIONS, LEAD_STATUS_OPTIONS,
  PLACEHOLDER_UNSET, FISCAL_DAY_END_LABEL,
  getLabel, getValueByLabel,
} from '@/constants/clientOptions';
import { useFieldLayout } from '@/composables/useFieldLayout';
import type { CustomFieldDef } from '@/composables/useFieldLayout';
import { leadSections, leadFields, leadFieldsFlat } from '@/constants/leadFieldDefs';
import { UI_MSG } from '@/constants/uiMessages';
import CustomFieldModal from '@/components/CustomFieldModal.vue';
import AddFieldModal from '@/components/AddFieldModal.vue';
import { LEAD_FIELD_LABELS } from '@/constants/fieldLabels';
import { BOOLEAN_FILTER_OPTIONS } from '@/constants/vendorOptions';
import ConfirmModal from '@/components/ConfirmModal.vue';
import NotifyModal from '@/components/NotifyModal.vue';
import TableFilterToolbar from '@/components/TableFilterToolbar.vue';
import type { FilterColumnDef, FilterCondition, FilterResult, SortSetting } from '@/components/list-view/types';
import type { ViewDefWithDefaults } from '@/utils/urlFilterSync';

// 列幅カスタマイズ
const clDefaultWidths: Record<string, number> = {
  status: 70,
  leadId: 100,
  threeCode: 60,
  type: 50,
  consumptionTaxMode: 70,
  companyName: 160,
  staffId: 90,
  accountingSoftware: 80,
  fiscalDate: 90,
  phoneNumber: 110,
  email: 140,
  sharedEmail: 140,
  driveUrl: 100,
  chatRoomUrl: 140,
};
const { columnWidths: clColWidths, onResizeStart: onClResizeStart } = useColumnResize('master-clients', clDefaultWidths);

// --- 見込先データ（composableから取得） ---
const { leads, getStaffNameForLead, updateSharedFolderId, addLead, updateLeadLocal, refresh } = useLeads();
const { staffList, activeStaff: activeStaffList } = useStaff();
const { isAdmin } = useCurrentUser();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 全社共通フィールド管理・レイアウト管理
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 管理モード（排他制御: null=通常, 'field'=フィールド管理, 'layout'=レイアウト管理） */
const leadAdminMode = ref<'field' | 'layout' | null>(null);

/** 管理モード切替（排他制御） */
const toggleLeadAdminMode = (mode: 'field' | 'layout') => {
  if (leadAdminMode.value === mode) {
    leadAdminMode.value = null;
    if (mode === 'field') {
      showLeadFieldModal.value = false;
    } else {
      leadFieldLayout.isLayoutEditing.value = false;
    }
  } else {
    if (mode === 'field') {
      leadAdminMode.value = mode;
      showLeadFieldModal.value = true;
    } else {
      router.push({ name: 'LeadLayout' });
      leadAdminMode.value = null;
    }
  }
};

/** フィールドレイアウト管理（全社共通） */
const leadFieldLayout = useFieldLayout('lead', leadSections, leadFieldsFlat);
leadFieldLayout.loadLayout();

// カスタムフィールド復元
for (const def of leadFieldLayout.customDefs.value) {
  leadFieldLayout.addDynamicField({
    key: def.key, label: def.label, section: def.section,
    component: def.component, widthPercent: def.widthPercent, order: def.order,
  });
}

const showLeadFieldModal = ref(false);
const showLeadAddFieldModal = ref(false);
const leadAddFieldDefaultSection = ref('');
const leadSectionKeys = leadSections.map(s => s.key);

/** フィールド追加ハンドラ */
const handleLeadAddField = (payload: { label: string; component: import('@/types/fieldLayout').FieldComponent; section: string }) => {
  const key = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const def: CustomFieldDef = {
    key, label: payload.label, section: payload.section,
    component: payload.component, widthPercent: 20,
    order: 100 + leadFieldLayout.customDefs.value.length,
  };
  leadFieldLayout.customDefs.value = [...leadFieldLayout.customDefs.value, def];
  leadFieldLayout.addDynamicField({
    key: def.key, label: def.label, section: def.section,
    component: def.component, widthPercent: def.widthPercent, order: def.order,
  });
};

/** フィールド管理保存ハンドラ */
const handleLeadFieldSave = (payload: {
  customDefs: CustomFieldDef[];
  labelOverrides: Record<string, string>;
  hiddenFields: string[];
  deletedFields: string[];
  fieldOptions: Record<string, import('@/types/fieldLayout').FieldOption[]>;
}) => {
  const oldKeys = new Set(leadFieldLayout.customDefs.value.map(d => d.key));
  const newKeys = new Set(payload.customDefs.map(d => d.key));
  for (const key of oldKeys) {
    if (!newKeys.has(key)) leadFieldLayout.removeDynamicField(key);
  }
  for (const def of payload.customDefs) {
    const existing = leadFieldLayout.fields.value.find(f => f.key === def.key);
    if (existing) {
      existing.label = def.label; existing.section = def.section; existing.component = def.component;
    } else {
      leadFieldLayout.addDynamicField({
        key: def.key, label: def.label, section: def.section,
        component: def.component, widthPercent: def.widthPercent, order: def.order,
      });
    }
  }
  leadFieldLayout.customDefs.value = payload.customDefs;
  for (const key of Object.keys(leadFieldLayout.labelOverrides.value)) leadFieldLayout.removeLabelOverride(key);
  for (const [key, newLabel] of Object.entries(payload.labelOverrides)) leadFieldLayout.updateLabelOverride(key, newLabel);
  for (const key of [...leadFieldLayout.hiddenFields.value]) leadFieldLayout.toggleFieldVisibility(key, true);
  for (const key of payload.hiddenFields) leadFieldLayout.toggleFieldVisibility(key, false);
  const currentDeleted = new Set(leadFieldLayout.deletedFields.value);
  const newDeleted = new Set(payload.deletedFields);
  for (const key of payload.deletedFields) { if (!currentDeleted.has(key)) leadFieldLayout.softDeleteField(key); }
  for (const key of [...leadFieldLayout.deletedFields.value]) { if (!newDeleted.has(key)) leadFieldLayout.restoreDeletedField(key); }
  for (const [key, opts] of Object.entries(payload.fieldOptions)) {
    if (opts.length > 0) leadFieldLayout.updateFieldOptions(key, opts);
  }
  leadAdminMode.value = null;
};

/** CustomFieldModalが閉じられた時の管理モード解除 */
watch(showLeadFieldModal, (v) => {
  if (!v && leadAdminMode.value === 'field') leadAdminMode.value = null;
});

// モーダルヘルパー
const modal = useModalHelper();

// 未保存変更ガード（JSON永続化移行済み。composable経由でAPI呼び出し済み）
const { markDirty, markClean } = useUnsavedGuard(null, modal);

// 業種リスト（clientOptions.tsから一元参照）
const industryOptions = INDUSTRY_OPTIONS;

// --- ステータスフィルター（単一値ドロップダウン） ---
const route = useRoute();
const router = useRouter();
const statusFilter = ref<string>((route.query.status as string) || '');

/** フィールドレイアウト管理 */
const fieldLayout = useFieldLayout('lead', leadSections, leadFields);
fieldLayout.loadLayout();

// fieldLayout.fieldsからラベルを取得（ラベル上書き適用済み）
const getFieldLabel = (key: string): string => {
  const f = fieldLayout.fields.value.find(ff => ff.key === key);
  return f?.label ?? key;
};

// 一覧テーブルで表示不可のコンポーネント種別
const NON_LIST_COMPONENTS = ['heading', 'spacer', 'contactTable', 'table'];

// 表示列管理 — fieldLayout.fieldsから動的生成（レイアウト管理の並び順に準拠）
const allColumns = computed(() => {
  // fieldRowsをflatten→順序インデックスマップ作成
  const rowOrder = (fieldLayout.fieldRows.value ?? []).flat();
  const orderMap = new Map<string, number>();
  rowOrder.forEach((key, idx) => orderMap.set(key, idx));

  const fromLayout = fieldLayout.fields.value
    .filter(f => !NON_LIST_COMPONENTS.includes(f.component))
    .filter(f => !f.isDeleted)
    .map(f => ({ key: f.key, label: f.label }));

  // fieldRowsの順序でソート（fieldRowsに含まれないフィールドは末尾）
  fromLayout.sort((a, b) => {
    const ia = orderMap.get(a.key) ?? 99999;
    const ib = orderMap.get(b.key) ?? 99999;
    return ia - ib;
  });

  return fromLayout;
});

/** 基本情報ビューで表示する列キー（従来の14列） */
const basicViewCols = [
  'leadId', 'threeCode', 'type', 'consumptionTaxMode', 'companyName', 'staffId',
  'accountingSoftware', 'fiscalDate',
  'sharedEmail', 'driveUrl', 'contact',
];

const colsFromUrl = route.query.cols ? (route.query.cols as string).split(',') : null;
const visibleColumns = ref<string[]>(colsFromUrl || [...basicViewCols]);

// allColumnsがcomputedになったためvisibleColumnDefsの参照を.valueに統一

// --- ビュー定義（デフォルトフィルタ・ソート付き） ---
// 初期値: フォールバック定義（API未取得時の表示用）
const defaultLeadViews: ViewDefWithDefaults[] = [
  {
    name: UI_MSG.ビュー基本情報,
    key: 'basic',
    columns: basicViewCols,
    defaultFilters: [],
    defaultSorts: [{ key: 'threeCode', order: 'asc' as const }],
  },
  {
    name: UI_MSG.ビューすべて,
    key: 'all',
    columns: null,
    defaultFilters: [],
    defaultSorts: [{ key: 'threeCode', order: 'asc' as const }],
  },
];
const leadViews = ref<ViewDefWithDefaults[]>([...defaultLeadViews]);
const activeViewIndex = ref(0);

/** API: ビュー一覧取得（「(すべて)」は末尾に自動追加）+ 表示状態を再同期 */
const loadListViews = async () => {
  try {
    const res = await fetch('/api/list-views/lead');
    const data = await res.json();
    let apiViews: ViewDefWithDefaults[] = data.views ?? [];

    // APIが空の場合: デフォルトビューをシーディング（「すべて」は除外して保存）
    if (apiViews.length === 0) {
      const seedViews = defaultLeadViews.filter(v => v.key !== 'all');
      await fetch('/api/list-views/lead', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ views: seedViews }),
      });
      apiViews = seedViews;
    }

    // APIビュー + 末尾に「(すべて)」固定ビュー
    const allView: ViewDefWithDefaults = {
      name: UI_MSG.ビューすべて,
      key: 'all',
      columns: null,
      defaultFilters: [],
      defaultSorts: [{ key: 'threeCode', order: 'asc' as const }],
    };
    leadViews.value = [...apiViews, allView];

    // ビュー定義更新後に表示列を再同期
    const currentIdx = Math.min(activeViewIndex.value, leadViews.value.length - 1);
    activeViewIndex.value = currentIdx >= 0 ? currentIdx : 0;
    const view = leadViews.value[activeViewIndex.value];
    if (view) {
      visibleColumns.value = view.columns === null
        ? allColumns.value.map(c => c.key)
        : [...view.columns];
    }
  } catch (e) {
    console.error('[LeadList] ビュー一覧取得失敗:', e);
  }
};
loadListViews();

// KeepAliveからの復帰時にAPIからビュー定義を再取得
let isFirstActivation = true;
onActivated(async () => {
  if (isFirstActivation) {
    isFirstActivation = false;
    return;
  }
  await loadListViews();
});

/** ビュー切替時 */
const onViewChange = (_idx: number) => {
  const query: Record<string, string> = {};
  if (statusFilter.value) query.status = statusFilter.value;
  router.replace({ query });
  // fetchLeadList()はwatch発火に任せる（二重呼び出し防止）
};

// ステータス選択肢（clientOptions.tsから一元参照）
const leadStatusOptions = LEAD_STATUS_OPTIONS;

// --- 絞り込みモーダル用列定義（LeadEditPageの全フィールド） ---
const leadFilterColumns = computed<FilterColumnDef[]>(() => [
  // ステータス
  { key: 'status', label: getFieldLabel('status') || UI_MSG.ステータス, filterType: 'select', filterOptions: leadStatusOptions },
  // 基本情報
  { key: 'type', label: getFieldLabel('type'), filterType: 'select', filterOptions: TYPE_OPTIONS },
  { key: 'leadId', label: getFieldLabel('leadId'), filterType: 'text' },
  { key: 'threeCode', label: getFieldLabel('threeCode'), filterType: 'text' },
  { key: 'companyName', label: getFieldLabel('companyName'), filterType: 'text' },
  { key: 'companyNameKana', label: getFieldLabel('companyNameKana'), filterType: 'text' },
  { key: 'repName', label: getFieldLabel('repName'), filterType: 'text' },
  { key: 'repNameKana', label: getFieldLabel('repNameKana'), filterType: 'text' },
  { key: 'staffId', label: getFieldLabel('staffId'), filterType: 'text' },
  { key: 'contactType', label: getFieldLabel('contactType'), filterType: 'select', filterOptions: [...CONTACT_METHOD_OPTIONS] },
  { key: 'contactValue', label: getFieldLabel('contactValue'), filterType: 'text' },
  { key: 'sharedEmail', label: getFieldLabel('sharedEmail'), filterType: 'text' },
  { key: 'fiscalDate', label: getFieldLabel('fiscalDate'), filterType: 'number' },
  { key: 'industry', label: getFieldLabel('industry'), filterType: 'select', filterOptions: INDUSTRY_OPTIONS.filter(o => o.value !== '') },
  { key: 'establishedDate', label: getFieldLabel('establishedDate'), filterType: 'text' },
  // 会計設定
  { key: 'accountingSoftware', label: getFieldLabel('accountingSoftware'), filterType: 'select', filterOptions: ACCOUNTING_SOFTWARE_OPTIONS },
  { key: 'taxFilingType', label: getFieldLabel('taxFilingType'), filterType: 'select', filterOptions: TAX_FILING_OPTIONS },
  { key: 'consumptionTaxMode', label: getFieldLabel('consumptionTaxMode'), filterType: 'select', filterOptions: TAX_MODE_OPTIONS },
  { key: 'simplifiedTaxCategory', label: getFieldLabel('simplifiedTaxCategory'), filterType: 'select', filterOptions: SIMPLIFIED_CATEGORY_OPTIONS.map(o => ({ value: String(o.value), label: o.label })) },
  { key: 'taxMethod', label: getFieldLabel('taxMethod'), filterType: 'select', filterOptions: TAX_METHOD_OPTIONS },
  { key: 'calculationMethod', label: getFieldLabel('calculationMethod'), filterType: 'select', filterOptions: CALCULATION_METHOD_OPTIONS },
  { key: 'defaultPaymentMethod', label: getFieldLabel('defaultPaymentMethod'), filterType: 'select', filterOptions: DEFAULT_PAYMENT_OPTIONS },
  { key: 'isInvoiceRegistered', label: getFieldLabel('isInvoiceRegistered'), filterType: 'select', filterOptions: BOOLEAN_FILTER_OPTIONS },
  { key: 'invoiceRegistrationNumber', label: getFieldLabel('invoiceRegistrationNumber'), filterType: 'text' },
  { key: 'hasDepartmentManagement', label: getFieldLabel('hasDepartmentManagement'), filterType: 'select', filterOptions: BOOLEAN_FILTER_OPTIONS },
  { key: 'hasRentalIncome', label: getFieldLabel('hasRentalIncome'), filterType: 'select', filterOptions: BOOLEAN_FILTER_OPTIONS },
  // 報酬設定
  { key: 'advisoryFee', label: getFieldLabel('advisoryFee'), filterType: 'number' },
  { key: 'bookkeepingFee', label: getFieldLabel('bookkeepingFee'), filterType: 'number' },
  { key: 'settlementFee', label: getFieldLabel('settlementFee'), filterType: 'number' },
  { key: 'taxFilingFee', label: getFieldLabel('taxFilingFee'), filterType: 'number' },
]);

// --- 絞り込み条件state ---
const filterConditions = ref<FilterCondition[]>([]);
const filterLogic = ref<'and' | 'or'>('and');
const filterSortSettings = ref<SortSetting[]>([{ key: 'threeCode', order: 'asc' }]);

/** フィルター変更時: URLクエリパラメータを更新 */
const onFilterChange = () => {
  const query: Record<string, string> = {};
  if (statusFilter.value) query.status = statusFilter.value;
  router.replace({ query });
  // fetchLeadList()はwatch発火に任せる（二重呼び出し防止）
};

/** 絞り込みモーダル適用時 */
const onFilterApply = (result: FilterResult) => {
  filterConditions.value = result.conditions;
  filterLogic.value = result.logic;
  filterSortSettings.value = result.sorts;
  // ソート設定をローカルstateに反映（1位のソートをヘッダーソートに使用）
  sortKey.value = result.sorts[0]?.key ?? 'threeCode';
  sortOrder.value = result.sorts[0]?.order ?? 'asc';
  // ステータス条件が含まれていればstatusFilterにも反映
  const statusCond = result.conditions.find(c => c.field === 'status');
  if (statusCond && typeof statusCond.value === 'string') {
    statusFilter.value = statusCond.value;
  } else if (statusCond && Array.isArray(statusCond.value) && statusCond.value.length === 1) {
    statusFilter.value = statusCond.value[0] ?? '';
  }
  // fetchLeadList()はsortKey/sortOrder/statusFilter変更でwatch発火する（二重呼び出し防止）
};


/** allColumnsの順序（レイアウト管理準拠）で、表示対象の列だけを返す */
const visibleColumnDefs = computed(() => {
  const visible = new Set(visibleColumns.value);
  return allColumns.value.filter(c => visible.has(c.key));
});

/** セルのCSSクラスを列キーから動的取得 */
const getCellClass = (key: string): string => {
  const editableKeys = new Set(['threeCode', 'type', 'companyName', 'staffId', 'accountingSoftware', 'fiscalDate', 'sharedEmail']);
  const classes: string[] = [];
  if (editableKeys.has(key)) classes.push('td-editable');
  if (['sharedEmail'].includes(key)) classes.push('cm-ellipsis');
  if (key === 'companyName') classes.push('cm-company-name');
  if (key === 'fiscalDate') classes.push('cm-fiscal');
  if (key === 'driveUrl') classes.push('cm-drive-cell');
  if (key === 'contact') classes.push('cm-contact-cell');
  if (key === 'leadId') classes.push('cm-client-id');
  if (key === 'threeCode') classes.push('cm-code');
  return classes.join(' ');
};

/** インライン編集可能列か */
const isEditableCol = (key: string): boolean => {
  return ['threeCode', 'type', 'companyName', 'staffId', 'accountingSoftware', 'fiscalDate', 'sharedEmail'].includes(key);
};

/** 汎用テキスト入力で編集する列 */
const isTextEditCol = (_key: string): boolean => {
  return false; // phoneNumber/email/chatRoomUrlはcontactsに統合済み
};

/** データ行から動的フィールド値を取得（汎用） */
const getFieldValue = (row: Record<string, unknown>, key: string): string => {
  const val = row[key];
  if (val === undefined || val === null) return '—';
  if (typeof val === 'boolean') return val ? UI_MSG.あり : UI_MSG.なし;
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

/** テーブル合計幅（列幅の総和 → table widthに動的設定） */
const tableWidth = computed(() => {
  const statusW = clColWidths.value['status'] ?? 70;
  const colsW = visibleColumnDefs.value.reduce((sum, col) => sum + getColWidth(col), 0);
  return statusW + colsW;
});

// --- ソート ---
const sortKey = ref<string>('threeCode');
const sortOrder = ref<'asc' | 'desc'>('asc');

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

// --- フィルター＋ソート済みデータ ---
const isLoading = ref(true);
const loadingMessage = ref('読み込み中…');
const filteredRows = ref<Lead[]>([]);
const PAGE_SIZE = 50;
const currentPage = ref(1);
const totalPages = ref(1);
const leadTotalCount = ref(0);
const pagedRows = computed(() => filteredRows.value);
const leadPageStartIndex = computed(() => leadTotalCount.value === 0 ? 0 : (currentPage.value - 1) * PAGE_SIZE + 1);
const leadPageEndIndex = computed(() => Math.min(currentPage.value * PAGE_SIZE, leadTotalCount.value));

/** GET /api/leads で見込先一覧取得 */
const fetchLeadList = async () => {
  isLoading.value = true;
  try {
    // composable経由で最新データを取得
    await refresh();
    let rows = [...leads.value];
    // フロント側ソート
    rows.sort((a: Lead, b: Lead) => {
      const aVal = String((a as unknown as Record<string, unknown>)[sortKey.value] ?? '');
      const bVal = String((b as unknown as Record<string, unknown>)[sortKey.value] ?? '');
      return sortOrder.value === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    // ステータスフィルタ
    if (statusFilter.value) {
      rows = rows.filter((r: Lead) => r.status === statusFilter.value);
    }
    filteredRows.value = rows;
    leadTotalCount.value = rows.length;
    totalPages.value = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  } catch (e) {
    console.error('[LeadsPage] リスト取得失敗:', e);
  } finally {
    isLoading.value = false;
  }
};

// フィルタ・ソート・ページ変更時に自動でAPI再呼び出し（バッチ化で二重発火防止）
let fetchPending = false;
watch([statusFilter, sortKey, sortOrder, currentPage], () => {
  if (fetchPending) return;
  fetchPending = true;
  nextTick(() => {
    fetchPending = false;
    fetchLeadList();
  });
}, { immediate: true });

// KeepAliveからの復帰時にデータを再取得
onActivated(() => fetchLeadList());

/** データ変更後にリストを再取得 */
const refreshList = () => fetchLeadList();

// --- インライン編集 ---
const inlineEditId = ref<string | null>(null);
const inlineEditField = ref<string | null>(null);
const inlineEditValue = ref<string | number>('');
const inlineEditFiscalDay = ref<string | number>(FISCAL_DAY_END_LABEL);

/** インライン編集対象フィールド（Lead型のキーに限定） */
type InlineEditableField = 'status' | 'threeCode' | 'type' | 'companyName' | 'accountingSoftware' | 'fiscalDate' | 'sharedEmail';

const startInlineEdit = (row: Lead, field: InlineEditableField, event: Event) => {
  event.stopPropagation();
  inlineEditId.value = row.leadId;
  inlineEditField.value = field;
  if (field === 'fiscalDate') {
    inlineEditValue.value = row.fiscalMonth ?? '';
    inlineEditFiscalDay.value = row.fiscalDay ?? FISCAL_DAY_END_LABEL;
  } else {
    inlineEditValue.value = row[field] ?? '';
  }
  nextTick(() => {
    const el = document.querySelector('.cm-inline-input, .cm-inline-select') as HTMLElement;
    if (el) el.focus();
  });
};

const commitInlineEdit = async (_row: Lead) => {
  if (inlineEditId.value && inlineEditField.value) {
    // --- 3コード重複チェック（インライン編集時） ---
    if (inlineEditField.value === 'threeCode' && inlineEditValue.value) {
      const duplicate = leads.value.find(
        c => c.threeCode === inlineEditValue.value && c.leadId !== inlineEditId.value
      );
      if (duplicate) {
        await modal.notify({
          title: UI_MSG.コード重複,
          message: `「${duplicate.companyName}（${duplicate.leadId}）」${UI_MSG.コード重複使用中}`,
          variant: 'warning',
        });
        cancelInlineEdit();
        return;
      }
    }
    // composable経由でサーバーに永続化
    updateLeadLocal(inlineEditId.value, { [inlineEditField.value]: inlineEditValue.value } as Partial<Lead>);
    // 3コード変更時はDriveフォルダもリネーム
    if (inlineEditField.value === 'threeCode') {
      const client = leads.value.find(c => c.leadId === inlineEditId.value);
      if (client) {
        const renamed = await renameDriveFolderForLead(client);
        if (renamed) {
          await modal.notify({ title: `Googleドライブ名を「${renamed}」${UI_MSG.ドライブ名変更済}`, variant: 'success' });
        }
      }
    }
  }
  const clFieldLabels = LEAD_FIELD_LABELS;
  const clLabel = clFieldLabels[inlineEditField.value ?? ''] ?? inlineEditField.value;
  markDirty(`${clLabel}${UI_MSG.フィールド変更}`);
  markClean();
  cancelInlineEdit();
  refreshList();
};

const commitFiscalEdit = (_row: Lead) => {
  if (inlineEditId.value) {
    // composable経由でサーバーに永続化
    updateLeadLocal(inlineEditId.value, {
      fiscalMonth: Number(inlineEditValue.value),
      fiscalDay: inlineEditFiscalDay.value,
    });
  }
  markDirty(UI_MSG.決算日を変更);
  markClean();
  cancelInlineEdit();
};

const cancelInlineEdit = () => {
  inlineEditId.value = null;
  inlineEditField.value = null;
  inlineEditValue.value = '';
  inlineEditFiscalDay.value = FISCAL_DAY_END_LABEL;
};

// --- パネル ---
const panelMode = ref<'add' | 'edit' | null>(null);
const editingId = ref<string | null>(null);
const showIndustryDropdown = ref(false);

const panelForm = reactive<LeadForm>(emptyLeadForm());
const panelStaffId = ref(''); // パネル用スタッフID
const panelSharedEmail = ref(''); // パネル用共有メール


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

const saveLead = async () => {
  if (!panelForm.companyName && !panelForm.repName) {
    await modal.notify({ title: UI_MSG.名前必須, variant: 'warning' });
    return;
  }
  // --- 3コード重複チェック ---
  if (panelForm.threeCode) {
    const duplicate = leads.value.find(
      c => c.threeCode === panelForm.threeCode && c.leadId !== editingId.value
    );
    if (duplicate) {
      await modal.notify({
        title: UI_MSG.コード重複,
        message: `「${duplicate.companyName}（${duplicate.leadId}）」${UI_MSG.コード重複使用中}`,
        variant: 'warning',
      });
      return;
    }
  }
  const { contactType, contactValue, ...fields } = panelForm;
  const cleanFields = { ...fields } as Record<string, unknown>;
  // contacts→旧フィールド同期（後方互換）
  const contacts = (cleanFields.contacts as { method: string; value: string }[]) ?? [];
  const phoneRow = contacts.find(r => r.method === '電話');
  const emailRow = contacts.find(r => r.method === 'メール');
  const chatRow = contacts.find(r => r.method === 'チャット');
  cleanFields.phoneNumber = phoneRow?.value || '';
  cleanFields.email = emailRow?.value || '';
  cleanFields.chatRoomUrl = chatRow?.value || '';
  // 新規追加時にcontactsが未設定ならデフォルト3行を生成
  if (!cleanFields.contacts || (cleanFields.contacts as unknown[]).length < 3) {
    cleanFields.contacts = [
      { name: '', method: '電話', value: cleanFields.phoneNumber || '', usage: '', memo: '' },
      { name: '', method: 'メール', value: cleanFields.email || '', usage: '', memo: '' },
      { name: '', method: 'チャット', value: cleanFields.chatRoomUrl || '', usage: '', memo: '' },
    ];
  }
  if (panelMode.value === 'add') {
    // 新規: サーバーがIDを発番して返す
    const data = {
      ...cleanFields,
      staffId: panelStaffId.value || null,
      sharedEmail: panelSharedEmail.value,

      contact: { type: contactType, value: contactValue },
    };
    try {
      const saved = await addLead(data as Omit<Lead, 'leadId'>);
      createDriveFolderForLead(saved).catch(err => {
        console.error('[leads] Driveフォルダ作成失敗:', err);
      });
      await modal.notify({ title: `「${saved.companyName}」${UI_MSG.追加しました}`, message: UI_MSG.マスタ自動コピー完了詳細, variant: 'success' });
    } catch (err) {
      await modal.notify({ title: UI_MSG.見込先追加失敗, message: String(err), variant: 'warning' });
      return;
    }
  } else {
    // 編集: 既存leadIdを使用
    const leadId = editingId.value!;
    const data = {
      ...cleanFields,
      leadId,
      staffId: panelStaffId.value || null,
      sharedEmail: panelSharedEmail.value,

      contact: { type: contactType, value: contactValue },
    } as unknown as Lead;
    try {
      const oldLead = leads.value.find(c => c.leadId === data.leadId);
      await updateLeadLocal(data.leadId, data);
      if (oldLead && oldLead.threeCode !== data.threeCode) {
        const renamed = await renameDriveFolderForLead(data);
        if (renamed) {
          await modal.notify({ title: `Googleドライブ名を「${renamed}」${UI_MSG.ドライブ名変更済}`, variant: 'success' });
        }
      }
      await modal.notify({ title: `「${data.companyName}」${UI_MSG.更新しました}`, variant: 'success' });
    } catch (err) {
      await modal.notify({ title: UI_MSG.見込先更新失敗, message: String(err), variant: 'warning' });
      return;
    }
  }
  closePanel();
  markDirty(panelMode.value === 'add' ? `「${panelForm.companyName}」${UI_MSG.追加しました}` : `「${panelForm.companyName}」${UI_MSG.更新しました}`);
  markClean();
  refreshList();
};

// --- K13: 休眠・契約終了 ---
const confirmSuspend = async () => {
  const ok = await modal.confirm({
    title: `「${panelForm.companyName}」${UI_MSG.休眠確認タイトル末尾}`,
    message: UI_MSG.休眠確認見込先,
    variant: 'danger',
    confirmLabel: UI_MSG.休眠にする,
    cancelLabel: UI_MSG.キャンセル,
  });
  if (ok) {
    panelForm.status = 'suspension';
    saveLead();
  }
};

const confirmTerminate = async () => {
  const ok = await modal.confirm({
    title: `「${panelForm.companyName}」${UI_MSG.契約終了確認タイトル末尾}`,
    message: UI_MSG.契約終了確認見込先,
    variant: 'danger',
    confirmLabel: UI_MSG.契約終了,
    cancelLabel: UI_MSG.キャンセル,
  });
  if (ok) {
    panelForm.status = 'inactive';
    saveLead();
  }
};

const restoreLead = () => {
  panelForm.status = 'active';
  saveLead();
};

// --- ヘルパー ---
const softwareLabel = (s: string) => getLabel(ACCOUNTING_SOFTWARE_OPTIONS, s);
const taxModeLabel = (mode: string) => getLabel(TAX_MODE_OPTIONS, mode);



const annualTotal = computed(() => {
  const monthly = panelForm.advisoryFee + panelForm.bookkeepingFee;
  return monthly * 12 + panelForm.settlementFee + panelForm.taxFilingFee;
});

// --- スタッフ紐付けインライン編集 ---
const startStaffInlineEdit = (row: Lead, event: Event) => {
  event.stopPropagation();
  inlineEditId.value = row.leadId;
  inlineEditField.value = 'staffId';
  // Lead.staffIdから直接取得
  inlineEditValue.value = row.staffId ?? '';
  nextTick(() => {
    const el = document.querySelector('.cm-inline-select') as HTMLElement;
    if (el) el.focus();
  });
};

const commitStaffEdit = (_row: Lead) => {
  if (inlineEditId.value) {
    const staffId = inlineEditValue.value as string;
    // composable経由でサーバーに永続化
    updateLeadLocal(inlineEditId.value, { staffId: staffId || null });
  }
  markDirty(UI_MSG.担当者を変更);
  markClean();
  cancelInlineEdit();
  refreshList();
};

// --- ドロップダウン外クリックで閉じる（業種・CSV統合） ---
// ※ closeAllDropdowns に統合済み（ファイル末尾で定義）

// --- Drive取込 URL ---
const driveUrlCopied = ref<string | null>(null);

/** テーブル行のDrive共有フォルダURLをコピー */
const copyDriveUrl = async (row: Lead) => {
  const url = `https://drive.google.com/drive/folders/${row.sharedFolderId}`;
  try {
    await navigator.clipboard.writeText(url);
    driveUrlCopied.value = row.leadId;
    setTimeout(() => { driveUrlCopied.value = null; }, 2500);
  } catch {
    window.prompt(UI_MSG.URLコピープロンプト, url);
  }
};
/** Driveフォルダ自動作成（新規登録時） */
const createDriveFolderForLead = async (lead: Lead) => {
  const folderName = `${lead.threeCode}_${lead.companyName}`;
  try {
    const { createFolder } = useDriveFolder();
    const folderId = await createFolder(folderName, lead.sharedEmail || undefined);
    console.log(`[leads] Driveフォルダ作成完了: ${folderName} (id=${folderId})`);
    updateSharedFolderId(lead.leadId, folderId);
    markDirty(UI_MSG.ドライブフォルダ作成);
    markClean();
  } catch (err) {
    console.error(`[leads] Driveフォルダ作成失敗 (${folderName}):`, err);
  }
};

/** Driveフォルダリネーム（3コードまたは会社名変更時） */
const renameDriveFolderForLead = async (lead: Lead): Promise<string | null> => {
  if (!lead.sharedFolderId) return null;
  const newName = `${lead.threeCode}_${lead.companyName}`;
  try {
    const { renameFolder } = useDriveFolder();
    await renameFolder(lead.sharedFolderId, newName);
    console.log(`[leads] Driveフォルダリネーム完了: ${newName}`);
    return newName;
  } catch (err) {
    console.error(`[leads] Driveフォルダリネーム失敗 (${newName}):`, err);
    return null;
  }
};

// --- インポート / エクスポート ---
import { exportCsv, exportExcel, importCsv } from '@/composables/useCsv';
import type { CsvColumnDef } from '@/composables/useCsv';

const importDropdownOpen = ref(false);
const exportDropdownOpen = ref(false);

/** CSV列ごとのformat/parse/type拡張 */
const leadCsvExtensions: Record<string, Partial<CsvColumnDef>> = {
  status: {
    format: (v) => getLabel(LEAD_STATUS_OPTIONS, v as string),
    parse: (v) => getValueByLabel(LEAD_STATUS_OPTIONS as unknown as { value: string; label: string }[], v),
  },
  type: {
    format: (v) => getLabel(TYPE_OPTIONS, v as string),
    parse: (v) => getValueByLabel(TYPE_OPTIONS as unknown as { value: string; label: string }[], v),
  },
  consumptionTaxMode: {
    format: (v) => getLabel(TAX_MODE_OPTIONS, v as string),
    parse: (v) => getValueByLabel(TAX_MODE_OPTIONS as unknown as { value: string; label: string }[], v),
  },
  accountingSoftware: {
    format: (v) => getLabel(ACCOUNTING_SOFTWARE_OPTIONS, v as string),
    parse: (v) => getValueByLabel(ACCOUNTING_SOFTWARE_OPTIONS as unknown as { value: string; label: string }[], v),
  },
  staffId: {
    format: (v) => staffList.value.find(s => s.uuid === v)?.name ?? String(v ?? ''),
    parse: (v) => staffList.value.find(s => s.name === v)?.uuid ?? v,
  },
  fiscalMonth: { type: 'number' as const },
  fiscalDay: { type: 'number' as const },
  isInvoiceRegistered: {
    type: 'boolean' as const,
    format: (v) => v ? 'あり' : 'なし',
  },
};

const leadCsvColumns = computed<CsvColumnDef[]>(() =>
  visibleColumnDefs.value.map(col => ({
    key: col.key,
    label: col.label,
    ...leadCsvExtensions[col.key],
  }))
);

const handleLeadCsvExport = async () => {
  const cols = leadCsvColumns.value;
  const rows = leads.value as unknown as Record<string, unknown>[];
  const timestamp = new Date().toISOString().slice(0, 10);
  exportCsv(`見込先_${timestamp}.csv`, cols, rows);
  await modal.notify({
    title: 'エクスポート完了',
    message: `${rows.length}件をCSV出力しました`,
    variant: 'success',
  });
};

const handleLeadExcelExport = async () => {
  const cols = leadCsvColumns.value;
  const rows = leads.value as unknown as Record<string, unknown>[];
  const timestamp = new Date().toISOString().slice(0, 10);
  exportExcel(`見込先_${timestamp}.xlsx`, cols, rows);
  await modal.notify({
    title: 'エクスポート完了',
    message: `${rows.length}件をExcel出力しました`,
    variant: 'success',
  });
};

const handleLeadCsvImport = async () => {
  const cols = leadCsvColumns.value;
  const result = await importCsv(cols);
  if (!result) return;

  if (result.unmatchedHeaders.length > 0) {
    console.warn('[見込先インポート] マッチしなかったヘッダー:', result.unmatchedHeaders);
  }

  isLoading.value = true;
  loadingMessage.value = 'インポート中…';

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const skipReasons: string[] = [];

  // インポート前にleads.valueを最新化（重複チェック精度向上）
  await refresh();

  // 既存データのthreeCode/会社名セットを構築（重複チェック用）
  const existingCodes = new Set(leads.value.map(l => l.threeCode?.toUpperCase()).filter(Boolean));
  const existingNames = new Set(leads.value.map(l => l.companyName).filter(Boolean));

  // バリデーション + 重複チェック（フロント側）
  const validItems: Record<string, unknown>[] = [];
  const validItemRowNums: number[] = [];

  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows[i]!;
    const rowNum = i + 1;

    const companyName = String(row.companyName || '').trim();
    if (!companyName) {
      skipCount++;
      skipReasons.push(`行${rowNum}: 会社名が空のためスキップ`);
      continue;
    }

    const code = String(row.threeCode || '').trim().toUpperCase();
    if (code && existingCodes.has(code)) {
      skipCount++;
      skipReasons.push(`行${rowNum}: 3コード「${code}」が既に存在するためスキップ`);
      continue;
    }
    if (existingNames.has(companyName)) {
      skipCount++;
      skipReasons.push(`行${rowNum}: 会社名「${companyName}」が既に存在するためスキップ`);
      continue;
    }

    const base = emptyLeadForm();
    const data: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(row)) {
      if (value !== '' && value !== null && value !== undefined) {
        data[key] = value;
      }
    }
    if (!data.threeCode) {
      skipCount++;
      skipReasons.push(`行${rowNum}: 3コードが空のためスキップ`);
      continue;
    }
    // 3コード形式チェック（大文字アルファベット3文字 — 新規登録画面と同じ制約）
    const codeStr = String(data.threeCode).toUpperCase().replace(/[^A-Z]/g, '');
    if (codeStr.length !== 3) {
      skipCount++;
      skipReasons.push(`行${rowNum}: 3コード「${data.threeCode}」が不正（大文字A-Z 3文字）`);
      continue;
    }
    data.threeCode = codeStr;
    data.contact = {
      type: data.contactType || 'email',
      value: data.contactValue || '',
    };
    // contactsデフォルト3行生成（通常の新規登録と同じ）
    if (!data.contacts || (data.contacts as unknown[]).length < 3) {
      data.contacts = [
        { name: '', method: '電話', value: '', usage: '', memo: '' },
        { name: '', method: 'メール', value: '', usage: '', memo: '' },
        { name: '', method: 'チャット', value: '', usage: '', memo: '' },
      ];
    }

    existingCodes.add(String(data.threeCode).toUpperCase());
    existingNames.add(companyName);
    validItems.push(data);
    validItemRowNums.push(rowNum);
  }

  // --- 確認ダイアログ ---
  const confirmLines = [`インポート対象: ${validItems.length}件`];
  if (skipCount > 0) confirmLines.push(`スキップ: ${skipCount}件`);
  if (skipReasons.length > 0) confirmLines.push('', ...skipReasons.slice(0, 20));
  confirmLines.push('', 'インポートしますか？');

  const confirmed = await modal.confirm({
    title: 'インポート確認',
    message: confirmLines.join('\n'),
  });
  if (!confirmed) {
    isLoading.value = false;
    return;
  }

  // バルクAPIで一括保存
  if (validItems.length > 0) {
    try {
      const res = await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: validItems }),
      });
      const bulkResult = await res.json();
      if (bulkResult.results) {
        for (const r of bulkResult.results) {
          if (r.ok) {
            successCount++;
            // Driveフォルダ自動作成（通常の新規登録と同じ処理を発火）
            if (r.leadId && r.threeCode && r.companyName) {
              createDriveFolderForLead({
                leadId: r.leadId,
                threeCode: r.threeCode,
                companyName: r.companyName,
                sharedEmail: String(validItems[r.index]?.sharedEmail || ''),
              } as Lead).catch(err => {
                console.error(`[見込先インポート] Driveフォルダ作成失敗 (${r.companyName}):`, err);
              });
            }
          } else {
            errorCount++;
            skipReasons.push(`行${validItemRowNums[r.index]}: 保存エラー — ${r.error}`);
          }
        }
      }
    } catch (err) {
      errorCount += validItems.length;
      skipReasons.push(`バルク保存エラー — ${err}`);
      console.error('[見込先インポート] バルク保存エラー:', err);
    }
  }

  await refreshList();
  isLoading.value = false;

  const lines = [`保存: ${successCount}件`];
  if (skipCount > 0) lines.push(`スキップ: ${skipCount}件`);
  if (errorCount > 0) lines.push(`エラー: ${errorCount}件`);
  if (skipReasons.length > 0) lines.push('', ...skipReasons.slice(0, 20));

  await modal.notify({
    title: 'インポート完了',
    message: lines.join('\n'),
    variant: (errorCount > 0 || skipCount > 0) ? 'warning' : 'success',
  });
};

// --- ドロップダウン外クリック閉じ ---
const closeAllDropdowns = () => {
  showIndustryDropdown.value = false;
  importDropdownOpen.value = false;
  exportDropdownOpen.value = false;
};
const toggleImportDropdown = () => {
  exportDropdownOpen.value = false;
  importDropdownOpen.value = !importDropdownOpen.value;
};
const toggleExportDropdown = () => {
  importDropdownOpen.value = false;
  exportDropdownOpen.value = !exportDropdownOpen.value;
};

onMounted(() => document.addEventListener('click', closeAllDropdowns));
onUnmounted(() => document.removeEventListener('click', closeAllDropdowns));

</script>

<style>
@import "@/styles/master-list.css";
</style>
