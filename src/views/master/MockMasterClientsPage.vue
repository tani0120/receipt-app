<template>
  <div class="absolute inset-0 flex flex-col overflow-hidden bg-gray-50 font-sans">
    <div class="cm-settings">
        <!-- ヘッダー -->
        <div class="cm-header">
          <h1 class="cm-title">顧問先管理</h1>
          <div class="cm-header-actions" v-if="isAdmin">
            <button
              class="cm-admin-btn"
              @click="$router.push({ name: 'ClientViewSettings' })"
            >
              <i class="fa-solid fa-list-check"></i> 一覧管理
            </button>
            <button
              class="cm-admin-btn"
              :class="{ active: adminMode === 'field' }"
              :disabled="adminMode === 'layout'"
              @click="toggleAdminMode('field')"
            >
              <i class="fa-solid fa-puzzle-piece"></i> フィールド管理
            </button>
            <button
              class="cm-admin-btn"
              :class="{ active: adminMode === 'layout' }"
              :disabled="adminMode === 'field'"
              @click="toggleAdminMode('layout')"
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
          :views="clientViews"
          v-model:active-view-index="activeViewIndex"
          :filter-columns="clientFilterColumns"
          :filter-conditions="filterConditions"
          :filter-logic="filterLogic"
          :filter-sorts="filterSortSettings"
          :default-conditions="currentViewDefaults.filters"
          :default-sorts="currentViewDefaults.sorts"
          @filter-change="onFilterChange"
          @filter-apply="onFilterApply"
          @filter-remove="onFilterRemove"
          @view-change="onViewChange"
        >
        </TableFilterToolbar>

        <!-- ページネーション + CSVボタン -->
        <div class="cm-pagination-row">
          <div class="cm-pagination">
            <span class="cm-page-arrow" :class="{ disabled: currentPage <= 1 }" @click="goToPage(currentPage - 1)">＜</span>
            <span
              v-for="p in totalPages" :key="p"
              class="cm-page-num" :class="{ active: p === currentPage }"
              @click="goToPage(p)"
            >{{ p }}</span>
            <span class="cm-page-arrow" :class="{ disabled: currentPage >= totalPages }" @click="goToPage(currentPage + 1)">＞</span>
            <span class="cm-page-info">{{ pageStartIndex }}~{{ pageEndIndex }} / 全{{ totalCount }}件</span>
          </div>
          <div class="cm-csv-actions">
            <MfImportButton
              ref="mfImportBtnRef"
              :authenticated="true"
              :loading="mfImportLoading"
              tooltip="MF連携済み顧問先の事業所情報をインポート"
              @import="handleMfImport"
            />
            <div class="cm-io-dropdown" :class="{ open: importDropdownOpen }" @click.stop>
              <button class="cm-admin-btn" @click="toggleImportDropdown">
                <i class="fa-solid fa-file-import"></i> インポート <i class="fa-solid fa-caret-down" style="font-size:10px;margin-left:2px"></i>
              </button>
              <div class="cm-io-dropdown-menu">
                <button class="cm-io-dropdown-item" @click="handleCsvImport(); importDropdownOpen = false">
                  <i class="fa-solid fa-file-csv"></i> CSV
                </button>
                <button class="cm-io-dropdown-item" @click="handleCsvImport(); importDropdownOpen = false">
                  <i class="fa-solid fa-file-excel"></i> Excel (.xlsx / .xls)
                </button>
              </div>
            </div>
            <div class="cm-io-dropdown" :class="{ open: exportDropdownOpen }" @click.stop>
              <button class="cm-admin-btn" @click="toggleExportDropdown">
                <i class="fa-solid fa-file-export"></i> エクスポート <i class="fa-solid fa-caret-down" style="font-size:10px;margin-left:2px"></i>
              </button>
              <div class="cm-io-dropdown-menu">
                <button class="cm-io-dropdown-item" @click="handleCsvExport(); exportDropdownOpen = false">
                  <i class="fa-solid fa-file-csv"></i> CSV
                </button>
                <button class="cm-io-dropdown-item" @click="handleExcelExport(); exportDropdownOpen = false">
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
                >
                  <!-- 3コード -->
                  <template v-if="col.key === 'threeCode'">{{ row.threeCode }}</template>
                  <!-- 種別 -->
                  <template v-else-if="col.key === 'type'">{{ getLabel(TYPE_OPTIONS, row.type) }}</template>
                  <!-- 課税方式 -->
                  <template v-else-if="col.key === 'consumptionTaxMode'">{{ taxModeLabel(row.consumptionTaxMode) }}</template>
                  <!-- 会社名 -->
                  <template v-else-if="col.key === 'companyName'">
                    <span><MfCloudIcon v-if="mfStatusMap[row.clientId]" :size="12" tooltip="MF連携済み" />{{ getClientDisplayName(row) }}</span>
                  </template>
                  <!-- 担当者 -->
                  <template v-else-if="col.key === 'staffId'">{{ getStaffNameForClient(row.clientId) || '—' }}</template>
                  <!-- 会計ソフト -->
                  <template v-else-if="col.key === 'accountingSoftware'">{{ softwareLabel(row.accountingSoftware) }}</template>
                  <!-- 決算日 -->
                  <template v-else-if="col.key === 'fiscalDate'">{{ row.fiscalMonth }}月/{{ row.fiscalDay === FISCAL_DAY_END_LABEL ? FISCAL_DAY_END_LABEL : row.fiscalDay + '日' }}</template>
                  <!-- sharedEmail -->
                  <template v-else-if="col.key === 'sharedEmail'">
                    <span v-if="row.sharedEmail" class="cm-shared-email">🔗 {{ row.sharedEmail }}</span>
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
                  <!-- MF連携 -->
                  <template v-else-if="col.key === 'mfStatus'">
                    <span v-if="mfStatusMap[row.clientId]" class="cm-mf-linked">
                      🟢 連携済み
                      <button
                        class="cm-fiscal-check-btn"
                        :disabled="fiscalCheckLoading === row.clientId"
                        @click.stop="checkFiscalMonth(row)"
                        title="MFクラウドとの決算月を照合"
                      >
                        <i v-if="fiscalCheckLoading === row.clientId" class="fa-solid fa-spinner fa-spin"></i>
                        <i v-else class="fa-solid fa-scale-balanced"></i>
                      </button>
                    </span>
                    <span v-else class="cm-mf-unlinked">○ 未連携</span>
                  </template>
                  <!-- 主な連絡手段 -->
                  <template v-else-if="col.key === 'contact'">
                    <span v-if="row.contacts?.find((c: any) => c.method === 'チャット' && c.value)">チャットワーク</span>
                    <span v-else-if="row.contacts?.find((c: any) => c.method === 'メール' && c.value)" class="cm-contact-fallback">メール <i class="fa-solid fa-triangle-exclamation cm-contact-warn" title="チャットワークURLが空白です。"></i></span>
                    <span v-else-if="row.chatRoomUrl">チャットワーク</span>
                    <span v-else-if="row.email" class="cm-contact-fallback">メール <i class="fa-solid fa-triangle-exclamation cm-contact-warn" title="チャットワークURLが空白です。"></i></span>
                    <span v-else>—</span>
                  </template>
                  <!-- 汎用表示（追加フィールド等） -->
                  <template v-else>{{ getFieldValue(row, col.key) }}</template>
                </td>
              </tr>
              <tr v-if="isLoading || pagedRows.length === 0">
                <td :colspan="visibleColumnDefs.length + 1" class="cm-empty">
                  <template v-if="isLoading">
                    <i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px;"></i>{{ loadingMessage }}
                  </template>
                  <template v-else>該当する顧問先がありません</template>
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
            <h2 class="cm-panel-title">{{ panelMode === 'add' ? UI_MSG.顧問先を追加 : UI_MSG.顧問先を編集 }}</h2>
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
                <label class="cm-label">3コード <span class="cm-required">*</span> <span class="cm-hint">※大文字アルファベット3文字</span></label>
                <input type="text" v-model="panelForm.threeCode" class="cm-input cm-code-input" maxlength="3" placeholder="ABC" @input="panelForm.threeCode = panelForm.threeCode.toUpperCase().replace(/[^A-Z]/g, '')">
              </div>
              <div class="cm-field">
                <label class="cm-label">会社名 <span class="cm-hint">※会社名・代表者名のどちらか必須</span></label>
                <input type="text" v-model="panelForm.companyName" class="cm-input" placeholder="株式会社サンプル">
              </div>
              <div class="cm-field">
                <label class="cm-label">会社名（全角カナ）</label>
                <input type="text" v-model="panelForm.companyNameKana" class="cm-input" placeholder="カブシキガイシャサンプル" @input="panelForm.companyNameKana = panelForm.companyNameKana.replace(/[^\u30A0-\u30F6\u30FC\u3000 ]/g, '')">
              </div>
              <div class="cm-field">
                <label class="cm-label">代表者名 <span class="cm-hint">※会社名・代表者名のどちらか必須</span></label>
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
                <label class="cm-label">顧問先ログインメール <span class="cm-hint">※自動取得（顧問先がポータルログイン時に登録）</span></label>
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
              <div v-if="isIndividualType(panelForm.type)" class="cm-field">
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
      :visible="showCustomFieldModal"
      :custom-defs="fieldLayout.customDefs.value"
      :section-keys="sectionKeys"
      :layout-fields="fieldLayout.fields.value"
      :field-rows="fieldLayout.fieldRows.value"
      :default-field-keys="fieldLayout.defaultFields.map(f => f.key)"
      :label-overrides="fieldLayout.labelOverrides.value"
      :hidden-fields="fieldLayout.hiddenFields.value"
      :deleted-fields="fieldLayout.deletedFields.value"
      :field-options="fieldLayout.fieldOptions.value"
      @update:visible="showCustomFieldModal = $event"
      @save="handleSaveFieldManagement"
    />

    <!-- フィールド追加モーダル -->
    <AddFieldModal
      :visible="showAddFieldModal"
      :section-keys="sectionKeys"
      :default-section="addFieldDefaultSection"
      @update:visible="showAddFieldModal = $event"
      @add="handleAddField"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, onActivated, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  useClients,
  emptyClientForm,
} from '@/features/client-management/composables/useClients';
import type { Client, ClientForm } from '@/features/client-management/composables/useClients';
import { useStaff } from '@/features/staff-management/composables/useStaff';
import { useColumnResize } from '@/composables/useColumnResize';
import { useUnsavedGuard } from '@/composables/useUnsavedGuard';
import { useModalHelper } from '@/composables/useModalHelper';
import { useDriveFolder } from '@/composables/useDriveFolder';
import { useServerTable } from '@/composables/useServerTable';
import type { ServerTableResult } from '@/composables/useServerTable';
import {
  INDUSTRY_OPTIONS, ACCOUNTING_SOFTWARE_OPTIONS, TAX_MODE_OPTIONS,
  TAX_FILING_OPTIONS, SIMPLIFIED_CATEGORY_OPTIONS, TAX_METHOD_OPTIONS,
  CALCULATION_METHOD_OPTIONS, DEFAULT_PAYMENT_OPTIONS,
  TYPE_OPTIONS, STATUS_OPTIONS,
  PLACEHOLDER_UNSET, FISCAL_DAY_END_LABEL,
  getLabel, getValueByLabel, resolveFieldOptions,
  isIndividualType, getClientDisplayName,
} from '@/constants/clientOptions';
import ConfirmModal from '@/components/ConfirmModal.vue';
import NotifyModal from '@/components/NotifyModal.vue';
import CustomFieldModal from '@/components/CustomFieldModal.vue';
import type { CustomFieldDef } from '@/composables/useFieldLayout';
import AddFieldModal from '@/components/AddFieldModal.vue';
import TableFilterToolbar from '@/components/TableFilterToolbar.vue';
import type { FilterColumnDef, FilterCondition, FilterResult, SortSetting } from '@/components/list-view/types';
import { useFieldLayout } from '@/composables/useFieldLayout';

import { useCurrentUser } from '@/composables/useCurrentUser';
import { clientSections, clientFieldsFlat } from '@/constants/clientFieldDefs';
import { UI_MSG } from '@/constants/uiMessages';

import { BOOLEAN_FILTER_OPTIONS } from '@/constants/vendorOptions';
import type { FieldComponent } from '@/types/fieldLayout';
import MfCloudIcon from '@/components/MfCloudIcon.vue';
import MfImportButton from '@/components/MfImportButton.vue';
import { useRepositories } from '@/composables/useRepositories';

const { repos } = useRepositories();
import {
  parseViewFromQuery,
  parseFiltersFromQuery,
  parseLogicFromQuery,
  parseSortsFromQuery,
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
  consumptionTaxMode: 70,
  companyName: 160,
  staffId: 90,
  accountingSoftware: 80,
  fiscalDate: 90,
  phoneNumber: 110,
  email: 140,
  sharedEmail: 140,
  driveUrl: 100,
  mfStatus: 130,
  chatRoomUrl: 140,
};
const { columnWidths: clColWidths, onResizeStart: onClResizeStart } = useColumnResize('master-clients', clDefaultWidths);

// --- クライアントデータ（composableから取得） ---
const { clients, getStaffNameForClient, updateSharedFolderId, addClient, updateClientLocal, listClients, refresh } = useClients();
const { staffList, activeStaff: activeStaffList } = useStaff();

// モーダルヘルパー
const modal = useModalHelper();

// 未保存変更ガード（JSON永続化移行済み。composable経由でAPI呼び出し済み）
const { markDirty, markClean } = useUnsavedGuard(null, modal);

// 現在のユーザー情報（管理者判定用）
const { isAdmin } = useCurrentUser();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 全社共通フィールド管理・レイアウト管理
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 管理モード（排他制御: null=通常, 'field'=フィールド管理, 'layout'=レイアウト管理） */
const adminMode = ref<'field' | 'layout' | null>(null);

/** 管理モード切替（排他制御） */
const toggleAdminMode = (mode: 'field' | 'layout') => {
  if (adminMode.value === mode) {
    // 同じモードを再押下→解除
    adminMode.value = null;
    if (mode === 'field') {
      showCustomFieldModal.value = false;
    } else {
      fieldLayout.isLayoutEditing.value = false;
    }
  } else {
    if (mode === 'field') {
      adminMode.value = mode;
      showCustomFieldModal.value = true;
    } else {
      // レイアウト管理: 全社共通レイアウト編集ページに遷移
      router.push({ name: 'ClientLayout' });
      adminMode.value = null;
    }
  }
};

/** フィールドレイアウト管理（全社共通） */
const fieldLayout = useFieldLayout('client', clientSections, clientFieldsFlat);
// デフォルトレイアウトをAPIから読み込み（ラベル上書き等を適用）
fieldLayout.loadLayout();

// カスタムフィールドはfieldLayout.customDefsに統合済み（loadLayout時にAPIから復元）
for (const def of fieldLayout.customDefs.value) {
  fieldLayout.addDynamicField({
    key: def.key,
    label: def.label,
    section: def.section,
    component: def.component,
    widthPercent: def.widthPercent,
    order: def.order,
  });
}

const showCustomFieldModal = ref(false);
const showAddFieldModal = ref(false);
const addFieldDefaultSection = ref('');
const sectionKeys = clientSections.map(s => s.key);

/** フィールド追加ハンドラ */
const handleAddField = (payload: { label: string; component: import('@/types/fieldLayout').FieldComponent; section: string }) => {
  const key = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const def: CustomFieldDef = {
    key,
    label: payload.label,
    section: payload.section,
    component: payload.component,
    widthPercent: 20,
    order: 100 + fieldLayout.customDefs.value.length,
  };
  fieldLayout.customDefs.value = [...fieldLayout.customDefs.value, def];
  fieldLayout.addDynamicField({
    key: def.key,
    label: def.label,
    section: def.section,
    component: def.component,
    widthPercent: def.widthPercent,
    order: def.order,
  });
};

/** フィールド管理保存ハンドラ（統合版） */
const handleSaveFieldManagement = (payload: {
  customDefs: CustomFieldDef[];
  labelOverrides: Record<string, string>;
  hiddenFields: string[];
  deletedFields: string[];
  fieldOptions: Record<string, import('@/types/fieldLayout').FieldOption[]>;
}) => {
  // カスタムフィールドの差分管理（fieldRows順序を壊さない）
  const oldKeys = new Set(fieldLayout.customDefs.value.map(d => d.key));
  const newKeys = new Set(payload.customDefs.map(d => d.key));

  for (const key of oldKeys) {
    if (!newKeys.has(key)) {
      fieldLayout.removeDynamicField(key);
    }
  }
  for (const def of payload.customDefs) {
    const existing = fieldLayout.fields.value.find(f => f.key === def.key);
    if (existing) {
      existing.label = def.label;
      existing.section = def.section;
      existing.component = def.component;
    } else {
      fieldLayout.addDynamicField({
        key: def.key,
        label: def.label,
        section: def.section,
        component: def.component,
        widthPercent: def.widthPercent,
        order: def.order,
      });
    }
  }
  fieldLayout.customDefs.value = payload.customDefs;

  // ラベル上書きを適用
  for (const key of Object.keys(fieldLayout.labelOverrides.value)) {
    fieldLayout.removeLabelOverride(key);
  }
  for (const [key, newLabel] of Object.entries(payload.labelOverrides)) {
    fieldLayout.updateLabelOverride(key, newLabel);
  }
  // 非表示フィールドを適用
  for (const key of [...fieldLayout.hiddenFields.value]) {
    fieldLayout.toggleFieldVisibility(key, true);
  }
  for (const key of payload.hiddenFields) {
    fieldLayout.toggleFieldVisibility(key, false);
  }
  // 論理削除の同期
  const currentDeleted = new Set(fieldLayout.deletedFields.value);
  const newDeleted = new Set(payload.deletedFields);
  for (const key of payload.deletedFields) {
    if (!currentDeleted.has(key)) {
      fieldLayout.softDeleteField(key);
    }
  }
  for (const key of [...fieldLayout.deletedFields.value]) {
    if (!newDeleted.has(key)) {
      fieldLayout.restoreDeletedField(key);
    }
  }
  // 選択肢の同期
  for (const [key, opts] of Object.entries(payload.fieldOptions)) {
    if (opts.length > 0) {
      fieldLayout.updateFieldOptions(key, opts);
    }
  }
  // モーダルを閉じて管理モード解除
  adminMode.value = null;
};

/** CustomFieldModalが閉じられた時の管理モード解除 */
watch(showCustomFieldModal, (v) => {
  if (!v && adminMode.value === 'field') {
    adminMode.value = null;
  }
});

// 業種リスト（clientOptions.tsから一元参照）
const industryOptions = INDUSTRY_OPTIONS;

// --- URL同期・ビュー・フィルタ管理 ---
const route = useRoute();
const router = useRouter();

// 一覧テーブルで表示不可のコンポーネント種別
const NON_LIST_COMPONENTS: FieldComponent[] = ['heading', 'spacer', 'contactTable', 'table'];
// フィルタ対象外のコンポーネント種別
const NON_FILTER_COMPONENTS: FieldComponent[] = ['heading', 'spacer', 'contactTable', 'table'];

/**
 * 全列定義 — fieldLayout.fieldsから動的生成
 * レイアウト管理の並び順（fieldRows）に従って列を並べ替え
 */
const allColumns = computed(() => {
  // fieldRowsをflatten→順序インデックスマップ作成
  const rowOrder = (fieldLayout.fieldRows.value ?? []).flat();
  const orderMap = new Map<string, number>();
  rowOrder.forEach((key, idx) => orderMap.set(key, idx));

  // fieldLayout.fieldsから一覧表示可能な列を動的生成
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

  // mfStatus を driveUrl の直後に固定挿入（フィールド管理対象外・副作用なし）
  const mfCol = { key: 'mfStatus', label: 'MF連携' };
  const driveIdx2 = fromLayout.findIndex(c => c.key === 'driveUrl');
  const withMf = driveIdx2 >= 0
    ? [...fromLayout.slice(0, driveIdx2 + 1), mfCol, ...fromLayout.slice(driveIdx2 + 1)]
    : [...fromLayout, mfCol];

  return withMf;
});

/** 基本情報ビューで表示する列キー（ビジネスロジック上の固定列） */
const basicViewCols = [
  'clientId', 'threeCode', 'type', 'consumptionTaxMode', 'companyName', 'staffId',
  'accountingSoftware', 'fiscalDate',
  'sharedEmail', 'driveUrl', 'mfStatus', 'contact',
];

// --- ビュー定義（デフォルトフィルタ・ソート付き） ---
// 初期値: フォールバック定義（API未取得時の表示用）
const defaultClientViews: ViewDefWithDefaults[] = [
  {
    name: UI_MSG.ビュー基本情報,
    key: 'basic',
    columns: basicViewCols,
    defaultFilters: [{ field: 'status', operator: 'in', value: ['active'] }],
    defaultSorts: [{ key: 'threeCode', order: 'asc' }],
  },
  {
    name: UI_MSG.ビューすべて,
    key: 'all',
    columns: null,
    defaultFilters: [],
    defaultSorts: [{ key: 'threeCode', order: 'asc' }],
  },
];
const clientViews = ref<ViewDefWithDefaults[]>([...defaultClientViews]);

/** API: ビュー一覧取得（「(すべて)」は末尾に自動追加）+ 表示状態を再同期（repos経由: P3-1） */
const loadListViews = async () => {
  try {
    const data = await repos.listView.getViews('client');
    let apiViews: ViewDefWithDefaults[] = (data.views ?? []) as ViewDefWithDefaults[];

    // APIが空の場合: デフォルトビューをシーディング（「すべて」は除外して保存）
    if (apiViews.length === 0) {
      const seedViews = defaultClientViews.filter((v) => v.key !== 'all');
      await repos.listView.saveViews('client', { views: seedViews });
      apiViews = seedViews;
    }

    // 新列追加互換パッチ: mfStatus が各ビューの columns にない場合は driveUrl の直後に挿入
    let _needsSave = false;
    apiViews = apiViews.map((view) => {
      if (!view.columns) return view;
      if (view.columns.includes('mfStatus')) return view;
      const cols = [...view.columns];
      const driveIdx = cols.indexOf('driveUrl');
      if (driveIdx >= 0) {
        cols.splice(driveIdx + 1, 0, 'mfStatus');
      } else {
        cols.push('mfStatus');
      }
      _needsSave = true;
      return { ...view, columns: cols };
    });
    if (_needsSave) {
      repos.listView.saveViews('client', { views: apiViews.filter((v) => v.key !== 'all') }).catch(() => {});
    }

    // APIビュー + 末尾に「(すべて)」固定ビュー
    const allView: ViewDefWithDefaults = {
      name: UI_MSG.ビューすべて,
      key: 'all',
      columns: null,
      defaultFilters: [],
      defaultSorts: [{ key: 'threeCode', order: 'asc' }],
    };
    clientViews.value = [...apiViews, allView];

    // ビュー定義更新後に表示状態を再同期
    const urlViewKey = parseViewFromQuery(route.query);
    const view = findViewByKey(clientViews.value, urlViewKey) ?? clientViews.value[0]!;
    const viewIdx = clientViews.value.indexOf(view);
    activeViewIndex.value = viewIdx >= 0 ? viewIdx : 0;
    visibleColumns.value = view.columns === null
      ? allColumns.value.map(c => c.key)
      : [...view.columns];
    // URLにフィルタ/ソートが明示されていなければビューのデフォルトを適用
    const urlF = parseFiltersFromQuery(route.query);
    filterConditions.value = urlF.length > 0 ? urlF : [...view.defaultFilters];
    const urlS = parseSortsFromQuery(route.query, view.defaultSorts);
    filterSortSettings.value = urlS;
    sortKey.value = urlS[0]?.key ?? 'threeCode';
    sortOrder.value = urlS[0]?.order ?? 'asc';
    syncUrlQuery();
  } catch (e) {
    console.error('[ClientList] ビュー一覧取得失敗:', e);
  }
};

// URLからビュー・フィルタ・ソートを復元
const urlViewKey = parseViewFromQuery(route.query);
const initialView = findViewByKey(clientViews.value, urlViewKey) ?? clientViews.value[0]!;
const activeViewIndex = ref(clientViews.value.indexOf(initialView));

// URLにフィルタ条件がある場合はそれを使い、なければビューのデフォルトを適用
const urlFilters = parseFiltersFromQuery(route.query);
const initialFilters = urlFilters.length > 0 ? urlFilters : [...initialView.defaultFilters];
const initialSorts = parseSortsFromQuery(route.query, initialView.defaultSorts);

// 表示列復元
const visibleColumns = ref<string[]>(
  initialView.columns === null
    ? allColumns.value.map(c => c.key)
    : [...initialView.columns]
);

/** 現在のビューのデフォルト値（フィルタモーダルの「デフォルトに戻す」用） */
const currentViewDefaults = computed(() => {
  const view = clientViews.value[activeViewIndex.value] ?? clientViews.value[0]!;
  return {
    filters: view.defaultFilters,
    sorts: view.defaultSorts,
  };
});


/** URLクエリパラメータを現在の状態で更新 */
function syncUrlQuery() {
  const currentView = clientViews.value[activeViewIndex.value] ?? clientViews.value[0]!;
  const query = buildQueryParams({
    viewName: currentView.key,
    conditions: filterConditions.value,
    logic: filterLogic.value,
    sorts: filterSortSettings.value,
    defaultConditions: currentView.defaultFilters,
    defaultSorts: currentView.defaultSorts,
  });
  router.replace({ query });
}

/** ビュー切替時: デフォルトフィルタ・ソート・列に切替 + URL更新 + データ再取得 */
const onViewChange = (idx: number) => {
  const view = clientViews.value[idx] ?? clientViews.value[0]!;
  // 表示列をビューの定義に切替
  visibleColumns.value = view.columns
    ? [...view.columns]
    : allColumns.value.map(c => c.key);
  // フィルタ・ソートをビューのデフォルトに戻す
  filterConditions.value = [...view.defaultFilters];
  filterSortSettings.value = [...view.defaultSorts];
  sortKey.value = view.defaultSorts[0]?.key ?? 'threeCode';
  sortOrder.value = view.defaultSorts[0]?.order ?? 'asc';
  syncUrlQuery();
  fetchClientList();
};

// ステータス選択肢（テンプレート用）

/**
 * FieldComponent → FilterType のマッピング
 * fieldLayout.fieldsのコンポーネント種別から絞り込みのフィルタタイプを自動決定
 * optionsが定義されている場合はcomponentに関係なくselectとして扱う
 */
function componentToFilterType(component: FieldComponent, hasOptions: boolean): FilterColumnDef['filterType'] {
  // optionsが定義されていればselect型（readonly＋optionsのケース）
  if (hasOptions) return 'select';
  switch (component) {
    case 'select':
    case 'staffSelect':
      return 'select';
    case 'checkbox':
      return 'select';  // チェックボックスはあり/なしの選択肢フィルタ
    case 'number':
    case 'amount':
      return 'number';
    case 'date':
      return 'date';
    default:
      return 'text';
  }
}

/**
 * 絞り込みモーダル用列定義 — fieldLayout.fieldsから動的生成
 * staffListがリアクティブなためcomputedで動的生成
 */
const clientFilterColumns = computed<FilterColumnDef[]>(() => {
  return fieldLayout.fields.value
    .filter(f => !NON_FILTER_COMPONENTS.includes(f.component))
    .filter(f => !f.isDeleted)
    .map(f => {
      const filterType = componentToFilterType(f.component, !!f.options);
      const col: FilterColumnDef = {
        key: f.key,
        label: f.label,
        filterType,
      };
      // staffSelectの場合は動的にスタッフリストを使用
      if (f.component === 'staffSelect') {
        col.filterOptions = staffList.value.map(s => ({ value: s.uuid, label: s.name }));
      // checkboxの場合は真偽値フィルタ
      } else if (f.component === 'checkbox') {
        col.filterOptions = BOOLEAN_FILTER_OPTIONS;
      // dateGroupの場合は月選択肢を動的生成
      } else if (f.component === 'dateGroup') {
        col.filterOptions = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}${UI_MSG.列月}` }));
      // 選択肢ありのフィールドはresolveFieldOptionsで解決
      } else if (filterType === 'select' && f.options) {
        col.filterOptions = resolveFieldOptions(f.options);
      }
      return col;
    });
});

// --- 絞り込み条件state（URLから初期値復元） ---
const filterConditions = ref<FilterCondition[]>(initialFilters);
const filterLogic = ref<'and' | 'or'>(parseLogicFromQuery(route.query));
const filterSortSettings = ref<SortSetting[]>(initialSorts);

/** フィルター変更時: URLクエリパラメータを更新 + データ再取得 */
const onFilterChange = () => {
  syncUrlQuery();
  fetchClientList();
};

/** 絞り込みモーダル適用時 */
const onFilterApply = (result: FilterResult) => {
  filterConditions.value = result.conditions;
  filterLogic.value = result.logic;
  filterSortSettings.value = result.sorts;
  sortKey.value = result.sorts[0]?.key ?? 'threeCode';
  sortOrder.value = result.sorts[0]?.order ?? 'asc';
  syncUrlQuery();
  fetchClientList();
};

/** フィルタ条件を個別削除（タグの×ボタン） */
const onFilterRemove = (index: number) => {
  filterConditions.value = filterConditions.value.filter((_, i) => i !== index);
  syncUrlQuery();
  fetchClientList();
};

/** allColumnsの順序（レイアウト管理準拠）で、表示対象の列だけを返す */
const visibleColumnDefs = computed(() => {
  const visible = new Set(visibleColumns.value);
  return allColumns.value.filter(c => visible.has(c.key));
});

/** セルのCSSクラスを列キーから動的取得 */
const getCellClass = (key: string): string => {
  const classes: string[] = [];
  if (['sharedEmail'].includes(key)) classes.push('cm-ellipsis');
  if (key === 'companyName') classes.push('cm-company-name');
  if (key === 'fiscalDate') classes.push('cm-fiscal');
  if (key === 'driveUrl') classes.push('cm-drive-cell');
  if (key === 'mfStatus') classes.push('cm-drive-cell');
  if (key === 'contact') classes.push('cm-contact-cell');
  if (key === 'clientId') classes.push('cm-client-id');
  if (key === 'threeCode') classes.push('cm-code');
  return classes.join(' ');
};

/** データ行から動的フィールド値を取得（汎用） */
const getFieldValue = (row: Record<string, unknown> | Client, key: string): string => {
  // カスタムフィールド(custom_*)はextraFieldsから取得
  const val = key.startsWith('custom_')
    ? (row as Record<string, unknown>).extraFields != null
      ? ((row as Record<string, unknown>).extraFields as Record<string, unknown>)[key]
      : undefined
    : (row as Record<string, unknown>)[key];
  if (val === undefined || val === null) return '—';
  if (typeof val === 'boolean') return val ? UI_MSG.あり : UI_MSG.なし;
  if (typeof val === 'number') return val.toLocaleString();
  // select型フィールドの値→ラベル変換（fieldLayout.fieldsからoptions参照）
  const fieldDef = fieldLayout.fields.value.find(f => f.key === key);
  if (fieldDef?.options) {
    const resolved = resolveFieldOptions(fieldDef.options);
    const found = resolved.find(o => o.value === String(val));
    if (found) return found.label;
  }
  return String(val);
};

// --- フィルター＋ソート済みデータ（useServerTable統合） ---
const PAGE_SIZE = 50;

/** fetchFn: refresh() + listClients() の二重呼び出しを統合 */
const clientFetchFn = async (query: Record<string, unknown>): Promise<ServerTableResult<Client>> => {
  const filtersToSend = filterConditions.value.length > 0 ? [...filterConditions.value] : undefined;
  const sortsToSend = filterSortSettings.value.length > 0 ? [...filterSortSettings.value] : undefined;
  // composable経由で最新の全件データも同期（インライン編集の3コード重複チェック用）
  await refresh();
  const result = await listClients({
    filters: filtersToSend,
    logic: filterLogic.value,
    sorts: sortsToSend,
    page: query.page as number,
    pageSize: query.pageSize as number,
  });
  return {
    rows: result.rows,
    totalCount: result.totalCount ?? 0,
    totalPages: result.totalPages,
  };
};

const {
  rows: filteredRows,
  pagedRows,
  isLoading,
  loadingMessage,
  currentPage,
  totalPages,
  totalCount,
  pageStartIndex,
  pageEndIndex,
  fetchList: fetchClientList,
  goToPage,
  refreshList,
  updateRow: updateTableRow,
} = useServerTable<Client>({ fetchFn: clientFetchFn, idKey: 'clientId', pageSize: PAGE_SIZE });

// イベント駆動: watchは使わず、各ハンドラから直接fetchClientListを呼ぶ
// 初回表示: APIからビュー定義を取得してから初期化
const initPage = async () => {
  await loadListViews();   // API取得 → ビュー状態再同期（syncUrlQuery含む）
  await fetchClientList(); // clientsロード完了を待つ
  fetchMfStatuses();       // clients.valueが揃ってからMF認証状態を取得
};
initPage();

// KeepAliveからの復帰時にAPIからビュー定義を再取得 + データ再取得
// 初回マウント時はinitPage()で処理済みなのでスキップ
let isFirstActivation = true;
onActivated(async () => {
  if (isFirstActivation) {
    isFirstActivation = false;
    return;
  }
  // 一覧管理ページからの復帰時: APIから最新ビュー定義を再取得 → 表示状態も再同期
  await loadListViews();
  await fetchClientList();
  fetchMfStatuses();
});

// route.query watchは削除済み（無限ループの原因）
// KeepAlive復帰時はonActivatedでURL→state復元する

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

// --- ソート（URLから初期値復元） ---
const sortKey = ref<string>(initialSorts[0]?.key ?? 'threeCode');
const sortOrder = ref<'asc' | 'desc'>(initialSorts[0]?.order ?? 'asc');

const sortBy = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
  filterSortSettings.value = [{ key: sortKey.value, order: sortOrder.value }];
  syncUrlQuery();
  fetchClientList();
};

const getSortIcon = (key: string) => {
  if (sortKey.value !== key) return 'fa-solid fa-sort cm-sort-icon';
  return sortOrder.value === 'asc' ? 'fa-solid fa-sort-up cm-sort-icon active' : 'fa-solid fa-sort-down cm-sort-icon active';
};




// --- パネル ---
const panelMode = ref<'add' | 'edit' | null>(null);
const editingId = ref<string | null>(null);
const showIndustryDropdown = ref(false);

const panelForm = reactive<ClientForm>(emptyClientForm());
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

const saveClient = async () => {
  if (!panelForm.companyName && !panelForm.repName) {
    await modal.notify({ title: UI_MSG.名前必須, variant: 'warning' });
    return;
  }
  // --- 3コード重複チェック ---
  if (panelForm.threeCode) {
    const duplicate = clients.value.find(
      c => c.threeCode === panelForm.threeCode && c.clientId !== editingId.value
    );
    if (duplicate) {
      await modal.notify({
        title: UI_MSG.コード重複,
        message: `「${duplicate.companyName}（${duplicate.clientId}）」${UI_MSG.コード重複使用中}`,
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
      const saved = await addClient(data as Omit<Client, 'clientId'>);
      createDriveFolderForClient(saved).catch(err => {
        console.error('[clients] Driveフォルダ作成失敗:', err);
      });
      await modal.notify({ title: `「${saved.companyName}」${UI_MSG.追加しました}`, message: UI_MSG.マスタ自動コピー完了詳細, variant: 'success' });
    } catch (err) {
      await modal.notify({ title: UI_MSG.顧問先追加失敗, message: String(err), variant: 'warning' });
      return;
    }
  } else {
    // 編集: 既存clientIdを使用
    const clientId = editingId.value!;
    const data = {
      ...cleanFields,
      clientId,
      staffId: panelStaffId.value || null,
      sharedEmail: panelSharedEmail.value,

      contact: { type: contactType, value: contactValue },
    } as unknown as Client;
    try {
      const oldClient = clients.value.find(c => c.clientId === data.clientId);
      await updateClientLocal(data.clientId, data);
      if (oldClient && oldClient.threeCode !== data.threeCode) {
        const renamed = await renameDriveFolderForClient(data);
        if (renamed) {
          await modal.notify({ title: `Googleドライブ名を「${renamed}」${UI_MSG.ドライブ名変更済}`, variant: 'success' });
        }
      }
      await modal.notify({ title: `「${data.companyName}」${UI_MSG.更新しました}`, variant: 'success' });
    } catch (err) {
      await modal.notify({ title: UI_MSG.顧問先更新失敗, message: String(err), variant: 'warning' });
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
    message: UI_MSG.休眠確認顧問先,
    variant: 'danger',
    confirmLabel: UI_MSG.休眠にする,
    cancelLabel: UI_MSG.キャンセル,
  });
  if (ok) {
    panelForm.status = 'suspension';
    saveClient();
  }
};

const confirmTerminate = async () => {
  const ok = await modal.confirm({
    title: `「${panelForm.companyName}」${UI_MSG.契約終了確認タイトル末尾}`,
    message: UI_MSG.契約終了確認顧問先,
    variant: 'danger',
    confirmLabel: UI_MSG.契約終了,
    cancelLabel: UI_MSG.キャンセル,
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
const softwareLabel = (s: string) => getLabel(ACCOUNTING_SOFTWARE_OPTIONS, s);
const taxModeLabel = (mode: string) => getLabel(TAX_MODE_OPTIONS, mode);



const annualTotal = computed(() => {
  const monthly = panelForm.advisoryFee + panelForm.bookkeepingFee;
  return monthly * 12 + panelForm.settlementFee + panelForm.taxFilingFee;
});



// --- ドロップダウン外クリックで閉じる（業種・CSV統合） ---
// ※ closeAllDropdowns に統合済み（ファイル末尾で定義）

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
    window.prompt(UI_MSG.URLコピープロンプト, url);
  }
};

// --- MF連携ステータス ---
/** clientId → 認証済みかどうか */
const mfStatusMap = ref<Record<string, boolean>>({});

/** 全顧問先のMF認証状態を一括取得 */
const fetchMfStatuses = async () => {
  // clients.valueが未ロードの場合は再取得（サーバー起動直後の500エラーリカバリ）
  if (clients.value.length === 0) {
    await refresh();
  }
  const ids = clients.value.map(c => c.clientId);
  console.log('[MF連携] fetchMfStatuses 開始: clientIds =', ids);
  if (ids.length === 0) {
    console.warn('[MF連携] clients.value が空 → スキップ');
    return;
  }
  try {
    const data = await repos.mfAuth.getAuthStatusBulk(ids) as Record<string, { authenticated: boolean }>;
    console.log('[MF連携] APIレスポンス:', JSON.stringify(data));
    const map: Record<string, boolean> = {};
    for (const [id, v] of Object.entries(data)) {
      map[id] = v.authenticated;
    }
    console.log('[MF連携] mfStatusMap 更新:', JSON.stringify(map));
    mfStatusMap.value = map;
  } catch (e) {
    console.warn('[MF連携] 認証状態取得失敗:', e);
  }
};

// --- MF決算月チェック ---
/** チェック中のclientId（ローディング表示用） */
const fiscalCheckLoading = ref<string | null>(null);

/** MFクラウドとの決算月を照合 */
const checkFiscalMonth = async (row: Client) => {
  fiscalCheckLoading.value = row.clientId;
  try {
    const data = await repos.mfAuth.fiscalCheck(row.clientId) as { mfLinked: boolean; mismatch: boolean; localFiscalMonth: number; mfFiscalMonth: number; mfEndDate: string };
    if (!data.mfLinked) {
      modal.notify({ title: UI_MSG.MF未連携タイトル, message: UI_MSG.MF未連携メッセージ, variant: 'warning' });
      return;
    }
    if (!data.mismatch) {
      modal.notify({ title: UI_MSG.決算月一致タイトル, message: `決算月: ${data.localFiscalMonth}月（MFと一致）`, variant: 'success' });
      return;
    }
    // 不一致 → 確認モーダル表示
    const confirmed = await modal.confirm({
      title: UI_MSG.決算月不一致タイトル,
      message: `sugu-sru: ${data.localFiscalMonth}月\nMFクラウド: ${data.mfFiscalMonth}月（期末: ${data.mfEndDate}）\n\nMFクラウドの値で修正しますか？`,
      variant: 'danger',
      confirmLabel: UI_MSG.MFに合わせる,
      cancelLabel: UI_MSG.そのまま,
    });
    if (confirmed) {
      try {
        // composable経由で更新（clients ref即反映 + サーバー保存）
        await updateClientLocal(row.clientId, { fiscalMonth: data.mfFiscalMonth });
        // 楽観的更新: テーブル表示用refも即時更新
        updateTableRow(row.clientId, { fiscalMonth: data.mfFiscalMonth } as Partial<Client>);
        modal.notify({ title: UI_MSG.決算月修正完了タイトル, message: `決算月を ${data.mfFiscalMonth}月 に更新しました`, variant: 'success' });
      } catch {
        modal.notify({ title: UI_MSG.エラー, message: UI_MSG.決算月更新失敗, variant: 'warning' });
      }
    }
  } catch (e) {
    console.error('[MF決算月チェック] エラー:', e);
    modal.notify({ title: UI_MSG.エラー, message: UI_MSG.決算月チェックエラー, variant: 'warning' });
  } finally {
    fiscalCheckLoading.value = null;
  }
};

// --- MFインポート ---
const mfImportLoading = ref(false);
const mfImportBtnRef = ref<InstanceType<typeof MfImportButton> | null>(null);

/** MF連携済み顧問先の事業所情報をMCPから取得し、clientStoreに反映 */
const handleMfImport = async () => {
  const linkedIds = Object.entries(mfStatusMap.value)
    .filter(([, v]) => v)
    .map(([id]) => id);

  if (linkedIds.length === 0) {
    modal.notify({ title: UI_MSG.MFインポートタイトル, message: UI_MSG.MF連携なし, variant: 'warning' });
    return;
  }

  const confirmed = await modal.confirm({
    title: UI_MSG.MFインポートタイトル,
    message: `MF連携済みの ${linkedIds.length}件 の顧問先の事業所情報をMFクラウドから取得します。\n\n実行しますか？`,
    confirmLabel: UI_MSG.MFインポート実行,
    cancelLabel: UI_MSG.キャンセル,
  });
  if (!confirmed) return;

  mfImportLoading.value = true;
  try {
    const result = await repos.mfAuth.importOffices({ clientIds: linkedIds }) as {
      updated: number;
      skipped: number;
      errors: string[];
      details: Array<{ clientId: string; threeCode: string; name: string; changes: string[] }>;
    };

    await refresh();
    await refreshList();

    const detailLines = result.details
      .filter((d: { changes: string[] }) => d.changes.length > 0)
      .map((d: { threeCode: string; name: string; changes: string[] }) => `${d.threeCode}(${d.name}): ${d.changes.join(', ')}`)
      .join('\n');
    const errorLines = result.errors.length > 0 ? `\n\nエラー:\n${result.errors.join('\n')}` : '';

    modal.notify({
      title: UI_MSG.MFインポート事業所完了,
      message: `更新: ${result.updated}件 / スキップ: ${result.skipped}件${detailLines ? `\n\n変更内容:\n${detailLines}` : ''}${errorLines}`,
      variant: result.errors.length > 0 ? 'warning' : 'success',
    });
  } catch (e) {
    console.error('[MFインポート] エラー:', e);
    const msg = e instanceof Error ? e.message : String(e);
    const log = e instanceof Error ? `${e.name}: ${e.message}\n${e.stack ?? ''}` : String(e);
    if (mfImportBtnRef.value) {
      mfImportBtnRef.value.showError(UI_MSG.エラー, msg, log);
    } else {
      modal.notify({ title: UI_MSG.エラー, message: UI_MSG.MFインポートエラー, variant: 'warning' });
    }
  } finally {
    mfImportLoading.value = false;
  }
};

/** Driveフォルダ自動作成（新規登録時） */
const createDriveFolderForClient = async (client: Client) => {
  const folderName = `${client.threeCode}_${client.companyName}`;
  try {
    const { createFolder } = useDriveFolder();
    const folderId = await createFolder(folderName, client.sharedEmail || undefined);
    console.log(`[clients] Driveフォルダ作成完了: ${folderName} (id=${folderId})`);
    updateSharedFolderId(client.clientId, folderId);
    markDirty(UI_MSG.ドライブフォルダ作成);
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
    const { renameFolder } = useDriveFolder();
    await renameFolder(client.sharedFolderId, newName);
    console.log(`[clients] Driveフォルダリネーム完了: ${newName}`);
    return newName;
  } catch (err) {
    console.error(`[clients] Driveフォルダリネーム失敗 (${newName}):`, err);
    return null;
  }
};

// --- インポート / エクスポート ---
import { exportCsv, exportExcel, importCsv } from '@/composables/useCsv';
import type { CsvColumnDef } from '@/composables/useCsv';

const importDropdownOpen = ref(false);
const exportDropdownOpen = ref(false);

/** CSV列ごとのformat/parse/type拡張 */
const clientCsvExtensions: Record<string, Partial<CsvColumnDef>> = {
  status: {
    format: (v) => getLabel(STATUS_OPTIONS, v as string),
    parse: (v) => getValueByLabel(STATUS_OPTIONS as unknown as { value: string; label: string }[], v),
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
  advisoryFee: { type: 'number' as const },
  bookkeepingFee: { type: 'number' as const },
  settlementFee: { type: 'number' as const },
  taxFilingFee: { type: 'number' as const },
  isInvoiceRegistered: {
    type: 'boolean' as const,
    format: (v) => v ? 'あり' : 'なし',
  },
  hasDepartmentManagement: {
    type: 'boolean' as const,
    format: (v) => v ? 'あり' : 'なし',
  },
  hasRentalIncome: {
    type: 'boolean' as const,
    format: (v) => v ? 'あり' : 'なし',
  },
};

/** 現在の表示列をCSV列定義に変換 */
const clientCsvColumns = computed<CsvColumnDef[]>(() =>
  visibleColumnDefs.value.map(col => ({
    key: col.key,
    label: col.label,
    ...clientCsvExtensions[col.key],
  }))
);

const handleCsvExport = async () => {
  const cols = clientCsvColumns.value;
  const rows = clients.value as unknown as Record<string, unknown>[];
  const timestamp = new Date().toISOString().slice(0, 10);
  exportCsv(`顧問先_${timestamp}.csv`, cols, rows);
  await modal.notify({
    title: UI_MSG.エクスポート完了,
    message: `${rows.length}件をCSV出力しました`,
    variant: 'success',
  });
};

const handleExcelExport = async () => {
  const cols = clientCsvColumns.value;
  const rows = clients.value as unknown as Record<string, unknown>[];
  const timestamp = new Date().toISOString().slice(0, 10);
  exportExcel(`顧問先_${timestamp}.xlsx`, cols, rows);
  await modal.notify({
    title: UI_MSG.エクスポート完了,
    message: `${rows.length}件をExcel出力しました`,
    variant: 'success',
  });
};

const handleCsvImport = async () => {
  const cols = clientCsvColumns.value;
  const result = await importCsv(cols);
  if (!result) return;

  if (result.unmatchedHeaders.length > 0) {
    console.warn('[顧問先インポート] マッチしなかったヘッダー:', result.unmatchedHeaders);
  }

  isLoading.value = true;
  loadingMessage.value = UI_MSG.インポート中;

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const skipReasons: string[] = [];

  await refresh();

  const existingCodes = new Set(clients.value.map(c => c.threeCode?.toUpperCase()).filter(Boolean));
  const existingNames = new Set(clients.value.map(c => c.companyName).filter(Boolean));

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

    const base = emptyClientForm();
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
    title: UI_MSG.インポート確認,
    message: confirmLines.join('\n'),
  });
  if (!confirmed) {
    isLoading.value = false;
    return;
  }

  if (validItems.length > 0) {
    try {
      const { createRepositories } = await import('@/repositories');
      const repos = createRepositories();
      const bulkResult = await repos.client.bulkCreate(validItems);
      if (bulkResult.results) {
        for (const r of bulkResult.results) {
          if (r.ok) {
            successCount++;
            // Driveフォルダ自動作成（通常の新規登録と同じ処理を発火）
            if (r.clientId && r.threeCode && r.companyName) {
              createDriveFolderForClient({
                clientId: r.clientId,
                threeCode: r.threeCode,
                companyName: r.companyName,
                sharedEmail: String(validItems[r.index]?.sharedEmail || ''),
              } as Client).catch(err => {
                console.error(`[顧問先インポート] Driveフォルダ作成失敗 (${r.companyName}):`, err);
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
      console.error('[顧問先インポート] バルク保存エラー:', err);
    }
  }

  await refreshList();
  isLoading.value = false;

  const lines = [`保存: ${successCount}件`];
  if (skipCount > 0) lines.push(`スキップ: ${skipCount}件`);
  if (errorCount > 0) lines.push(`エラー: ${errorCount}件`);
  if (skipReasons.length > 0) lines.push('', ...skipReasons.slice(0, 20));

  await modal.notify({
    title: UI_MSG.インポート完了,
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
/* 共通CSS読込 */
@import '@/styles/master-list.css';

/* MF決算月チェックボタン */
.cm-fiscal-check-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-left: 4px;
  padding: 0;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #f9fafb;
  color: #6b7280;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.15s;
  vertical-align: middle;
}
.cm-fiscal-check-btn:hover:not(:disabled) {
  background: #e0e7ff;
  border-color: #818cf8;
  color: #4f46e5;
}
.cm-fiscal-check-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
