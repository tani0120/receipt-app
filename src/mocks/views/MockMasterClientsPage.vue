<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <div class="flex-1 overflow-auto">
      <div class="cm-settings">
        <!-- ヘッダー -->
        <div class="cm-header">
          <h1 class="cm-title">顧問先管理</h1>
        </div>

        <!-- ツールバー -->
        <div class="cm-toolbar">
          <div class="cm-toolbar-left">
            <!-- ステータスフィルター（複数選択） -->
            <div class="cm-filter-checkboxes">
              <label class="cm-filter-cb"><input type="checkbox" value="active" v-model="statusFilters"><span class="cb-label status-active">稼働中</span></label>
              <label class="cm-filter-cb"><input type="checkbox" value="suspension" v-model="statusFilters"><span class="cb-label status-suspension">休眠中</span></label>
              <label class="cm-filter-cb"><input type="checkbox" value="inactive" v-model="statusFilters"><span class="cb-label status-inactive">契約終了</span></label>
            </div>
            <span class="cm-page-info">全{{ filteredRows.length }}件</span>
          </div>
          <div class="cm-toolbar-right">
            <button class="cm-action-btn primary" @click="openAddPanel">
              <i class="fa-solid fa-plus"></i> 新規追加
            </button>
          </div>
        </div>

        <!-- テーブル -->
        <div class="cm-table-wrap">
          <table class="cm-table" style="table-layout: fixed;">
            <colgroup>
              <col :style="{ width: clColWidths['status'] + 'px' }">
              <col :style="{ width: clColWidths['clientId'] + 'px' }">
              <col :style="{ width: clColWidths['threeCode'] + 'px' }">
              <col :style="{ width: clColWidths['type'] + 'px' }">
              <col :style="{ width: clColWidths['taxMode'] + 'px' }">
              <col :style="{ width: clColWidths['companyName'] + 'px' }">
              <col :style="{ width: clColWidths['staffName'] + 'px' }">
              <col :style="{ width: clColWidths['accountingSoftware'] + 'px' }">
              <col :style="{ width: clColWidths['fiscalMonth'] + 'px' }">
              <col :style="{ width: clColWidths['phoneNumber'] + 'px' }">
              <col :style="{ width: clColWidths['email'] + 'px' }">
              <col :style="{ width: clColWidths['sharedEmail'] + 'px' }">
              <col :style="{ width: clColWidths['driveUrl'] + 'px' }">
              <col :style="{ width: clColWidths['chatRoomUrl'] + 'px' }">
              <col style="width: auto;">
            </colgroup>
            <thead>
              <tr>
                <th class="sortable relative" @click="sortBy('status')">
                  ステータス <i :class="getSortIcon('status')"></i>
                  <div class="resize-handle" @mousedown.stop="onClResizeStart('status', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortBy('clientId')">
                  内部ID <i :class="getSortIcon('clientId')"></i>
                  <div class="resize-handle" @mousedown.stop="onClResizeStart('clientId', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortBy('threeCode')">
                  3コード <i :class="getSortIcon('threeCode')"></i>
                  <div class="resize-handle" @mousedown.stop="onClResizeStart('threeCode', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortBy('type')">
                  種別 <i :class="getSortIcon('type')"></i>
                  <div class="resize-handle" @mousedown.stop="onClResizeStart('type', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortBy('consumptionTaxMode')">
                  課税方式 <i :class="getSortIcon('consumptionTaxMode')"></i>
                  <div class="resize-handle" @mousedown.stop="onClResizeStart('taxMode', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortBy('companyName')">
                  会社名/代表者名 <i :class="getSortIcon('companyName')"></i>
                  <div class="resize-handle" @mousedown.stop="onClResizeStart('companyName', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortBy('staffName')">
                  担当者 <i :class="getSortIcon('staffName')"></i>
                  <div class="resize-handle" @mousedown.stop="onClResizeStart('staffName', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortBy('accountingSoftware')">
                  会計ソフト <i :class="getSortIcon('accountingSoftware')"></i>
                  <div class="resize-handle" @mousedown.stop="onClResizeStart('accountingSoftware', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortBy('fiscalMonth')">
                  決算日 <i :class="getSortIcon('fiscalMonth')"></i>
                  <div class="resize-handle" @mousedown.stop="onClResizeStart('fiscalMonth', $event)"></div>
                </th>
                <th class="relative">電話番号
                  <div class="resize-handle" @mousedown.stop="onClResizeStart('phoneNumber', $event)"></div>
                </th>
                <th class="relative">メール
                  <div class="resize-handle" @mousedown.stop="onClResizeStart('email', $event)"></div>
                </th>
                <th class="relative">共有用メール
                  <div class="resize-handle" @mousedown.stop="onClResizeStart('sharedEmail', $event)"></div>
                </th>
                <th class="relative">Drive取込
                  <div class="resize-handle" @mousedown.stop="onClResizeStart('driveUrl', $event)"></div>
                </th>
                <th class="relative">チャットURL
                  <div class="resize-handle" @mousedown.stop="onClResizeStart('chatRoomUrl', $event)"></div>
                </th>
                <th>主な連絡手段</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in pagedRows"
                :key="row.clientId"
                :class="{ 'row-inactive': row.status === 'inactive', 'row-suspension': row.status === 'suspension' }"
                @click="delayedOpenEditPanel(row)"
              >
                <!-- ステータス: select -->
                <td class="td-editable" @dblclick.stop="startInlineEdit(row, 'status', $event)">
                  <select v-if="inlineEditId === row.clientId && inlineEditField === 'status'" v-model="inlineEditValue" class="cm-inline-select" @blur="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                    <option value="active">稼働中</option>
                    <option value="suspension">休眠中</option>
                    <option value="inactive">契約終了</option>
                  </select>
                  <span v-else class="cm-status-badge" :class="'status-' + row.status">
                    {{ row.status === 'active' ? '稼働中' : row.status === 'suspension' ? '休眠中' : '契約終了' }}
                  </span>
                </td>
                <td class="cm-client-id">{{ row.clientId }}</td>
                <td class="cm-code td-editable" @dblclick.stop="startInlineEdit(row, 'threeCode', $event)">
                  <input v-if="inlineEditId === row.clientId && inlineEditField === 'threeCode'" v-model="inlineEditValue" class="cm-inline-input" @blur="commitInlineEdit(row)" @keydown.enter="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                  <span v-else>{{ row.threeCode }}</span>
                </td>
                <!-- 種別: select -->
                <td class="td-editable" @dblclick.stop="startInlineEdit(row, 'type', $event)">
                  <select v-if="inlineEditId === row.clientId && inlineEditField === 'type'" v-model="inlineEditValue" class="cm-inline-select" @blur="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                    <option value="corp">法人</option>
                    <option value="individual">個人</option>
                  </select>
                  <span v-else>{{ row.type === 'corp' ? '法人' : '個人' }}</span>
                </td>
                <td>{{ taxModeLabel(row.consumptionTaxMode) }}</td>
                <td class="cm-company-name td-editable" @dblclick.stop="startInlineEdit(row, 'companyName', $event)">
                  <input v-if="inlineEditId === row.clientId && inlineEditField === 'companyName'" v-model="inlineEditValue" class="cm-inline-input" @blur="commitInlineEdit(row)" @keydown.enter="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                  <span v-else>{{ row.type === 'individual' && row.repName ? row.repName : row.companyName }}</span>
                </td>
                <td class="td-editable" @dblclick.stop="startStaffInlineEdit(row, $event)">
                  <select v-if="inlineEditId === row.clientId && inlineEditField === 'staffName'" v-model="inlineEditValue" class="cm-inline-select" @blur="commitStaffEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                    <option value="">未設定</option>
                    <option v-for="s in staffList" :key="s.uuid" :value="s.uuid">{{ s.name }}</option>
                  </select>
                  <span v-else>{{ getStaffNameForClient(row.clientId) || '—' }}</span>
                </td>
                <!-- 会計ソフト: select -->
                <td class="td-editable" @dblclick.stop="startInlineEdit(row, 'accountingSoftware', $event)">
                  <select v-if="inlineEditId === row.clientId && inlineEditField === 'accountingSoftware'" v-model="inlineEditValue" class="cm-inline-select" @blur="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                    <option value="mf">MF</option>
                    <option value="freee">freee</option>
                    <option value="yayoi">弥生</option>
                    <option value="tkc">TKC</option>
                    <option value="other">その他</option>
                  </select>
                  <span v-else>{{ softwareLabel(row.accountingSoftware) }}</span>
                </td>
                <!-- 決算日: 月select + 日select -->
                <td class="cm-fiscal td-editable" @dblclick.stop="startInlineEdit(row, 'fiscalMonth', $event)">
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
                </td>
                <td class="td-editable" @dblclick.stop="startInlineEdit(row, 'phoneNumber', $event)">
                  <input v-if="inlineEditId === row.clientId && inlineEditField === 'phoneNumber'" v-model="inlineEditValue" class="cm-inline-input" @blur="commitInlineEdit(row)" @keydown.enter="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                  <span v-else>{{ row.phoneNumber || '—' }}</span>
                </td>
                <td class="td-editable cm-ellipsis" @dblclick.stop="startInlineEdit(row, 'email', $event)">
                  <input v-if="inlineEditId === row.clientId && inlineEditField === 'email'" v-model="inlineEditValue" class="cm-inline-input" @blur="commitInlineEdit(row)" @keydown.enter="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                  <span v-else>{{ row.email || '—' }}</span>
                </td>
                <td class="cm-ellipsis">
                  <span v-if="row.sharedEmail" class="cm-shared-email">🔗 {{ row.sharedEmail }}</span>
                  <span v-else class="cm-shared-email-none">未取得</span>
                </td>
                <td class="cm-drive-cell" @click.stop="row.sharedFolderId ? copyDriveUrl(row) : undefined">
                  <template v-if="!row.sharedFolderId">
                    <span class="cm-drive-none">—</span>
                  </template>
                  <template v-else>
                    <span v-if="driveUrlCopied === row.clientId" class="cm-drive-copied">✅ コピー済</span>
                    <span v-else class="cm-drive-link">📋 URLコピー</span>
                  </template>
                </td>
                <td class="td-editable cm-ellipsis" @dblclick.stop="startInlineEdit(row, 'chatRoomUrl', $event)">
                  <input v-if="inlineEditId === row.clientId && inlineEditField === 'chatRoomUrl'" v-model="inlineEditValue" class="cm-inline-input" @blur="commitInlineEdit(row)" @keydown.enter="commitInlineEdit(row)" @keydown.escape="cancelInlineEdit" @click.stop>
                  <span v-else>{{ row.chatRoomUrl || '—' }}</span>
                </td>
                <!-- 主な連絡手段: チャットワーク優先ロジック -->
                <td class="cm-contact-cell">
                  <span v-if="row.chatRoomUrl">チャットワーク</span>
                  <span v-else-if="row.email" class="cm-contact-fallback">
                    メール
                    <i class="fa-solid fa-triangle-exclamation cm-contact-warn" title="チャットワークURLが空白です。メールを表示しています。"></i>
                  </span>
                  <span v-else>—</span>
                </td>
              </tr>
              <tr v-if="pagedRows.length === 0">
                <td colspan="15" class="cm-empty">該当する顧問先がありません</td>
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
                <label class="cm-label">会社名（カナ）</label>
                <input type="text" v-model="panelForm.companyNameKana" class="cm-input" placeholder="カブシキガイシャサンプル">
              </div>
              <div class="cm-field">
                <label class="cm-label">代表者名</label>
                <input type="text" v-model="panelForm.repName" class="cm-input" placeholder="山田 太郎">
              </div>
              <div class="cm-field">
                <label class="cm-label">代表者名（カナ）</label>
                <input type="text" v-model="panelForm.repNameKana" class="cm-input" placeholder="ヤマダ タロウ">
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
              <div class="cm-field">
                <label class="cm-label">Drive取込 URL（自動生成）</label>
                <div class="cm-drive-url-box">
                  <input type="text" :value="driveUploadUrl" class="cm-input cm-drive-url-input" readonly @click="($event.target as HTMLInputElement).select()">
                  <button class="cm-drive-copy-btn" :class="{ copied: driveUrlPanelCopied }" @click="copyDriveUrlPanel">
                    <span>{{ driveUrlPanelCopied ? '✅ コピー済' : '📋 コピー' }}</span>
                  </button>
                </div>
                <p class="cm-hint" style="margin-top: 4px">顧問先にこのURLを共有 → スマホからDrive取込アップロード可能</p>
              </div>
              <!-- Driveフォルダ状態（編集モード時のみ） -->
              <div v-if="panelMode === 'edit'" class="cm-field">
                <label class="cm-label">Driveフォルダ状態</label>
                <div class="cm-drive-folder-status">
                  <template v-if="folderCheckLoading">
                    <span class="cm-folder-checking">🔄 確認中...</span>
                  </template>
                  <template v-else-if="folderStatus === 'ok'">
                    <span class="cm-folder-ok">✅ フォルダ存在（正常）</span>
                  </template>
                  <template v-else-if="folderStatus === 'trashed'">
                    <span class="cm-folder-warn">⚠️ ゴミ箱に入っています（Driveで復元可能）</span>
                    <button class="cm-folder-recreate-btn" @click="recreateDriveFolder" :disabled="folderRecreating">
                      {{ folderRecreating ? '作成中...' : '📁 Driveフォルダ再作成' }}
                    </button>
                  </template>
                  <template v-else-if="folderStatus === 'deleted'">
                    <span class="cm-folder-error">❌ フォルダが削除されています</span>
                    <button class="cm-folder-recreate-btn" @click="recreateDriveFolder" :disabled="folderRecreating">
                      {{ folderRecreating ? '作成中...' : '📁 Driveフォルダ再作成' }}
                    </button>
                  </template>
                  <template v-else-if="folderStatus === 'none'">
                    <span class="cm-folder-none">📭 未作成</span>
                    <button class="cm-folder-recreate-btn" @click="recreateDriveFolder" :disabled="folderRecreating">
                      {{ folderRecreating ? '作成中...' : '📁 Driveフォルダ作成' }}
                    </button>
                  </template>
                </div>
              </div>
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
              <div v-if="panelForm.contactType !== 'none'" class="cm-field">
                <label class="cm-label">連絡先</label>
                <input type="text" v-model="panelForm.contactValue" class="cm-input" :placeholder="panelForm.contactType === 'email' ? 'example@mail.com' : 'Chatwork ID'">
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import {
  useClients,
  emptyClientForm,
  createClientId,
} from '@/features/client-management/composables/useClients';
import type { Client, ClientForm } from '@/features/client-management/composables/useClients';
import { useStaff } from '@/features/staff-management/composables/useStaff';
import { useColumnResize } from '@/mocks/composables/useColumnResize';
import { useUnsavedGuard } from '@/mocks/composables/useUnsavedGuard';

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
const { clients, getStaffNameForClient, updateSharedFolderId } = useClients();
const { staffList, activeStaff: activeStaffList } = useStaff();

// 未保存変更ガード
const { markDirty } = useUnsavedGuard(() => {
  localStorage.setItem('sugu-suru:clients', JSON.stringify(clients.value));
});

// --- 業種リスト（ScreenS_Settings.vueと同一） ---
const industryOptions: string[] = [
  '', '飲食業', '建設業', '製造業・メーカー', '卸売業・小売業', '商社',
  '不動産業', '銀行・金融', '保険業', '医療・福祉関係業', 'コンサルティング',
  '専門事務所', '運輸・運送業', '旅行／宿泊／レジャー', 'IT・ソフトウェア関連',
  'スポーツ・ヘルス関連', '理容・美容・サロン', '冠婚葬祭', '警備関連',
  '清掃業', '教育業', '他サービス業', '官公庁・自治体', 'その他',
];

// --- ステータスフィルター（複数選択） ---
const statusFilters = ref<string[]>(['active']);

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
const filteredRows = computed((): Client[] => {
  let rows = clients.value.slice();
  if (statusFilters.value.length > 0) {
    rows = rows.filter(r => statusFilters.value.includes(r.status));
  }
  const key = sortKey.value as keyof Client | 'staffName';
  rows.sort((a, b) => {
    let va: unknown;
    let vb: unknown;
    if (key === 'staffName') {
      // staffId → staffListから名前を取得してソート
      const nameA = a.staffId ? staffList.value.find(s => s.uuid === a.staffId)?.name : '';
      const nameB = b.staffId ? staffList.value.find(s => s.uuid === b.staffId)?.name : '';
      va = nameA ?? '';
      vb = nameB ?? '';
    } else {
      va = a[key] ?? '';
      vb = b[key] ?? '';
      // clientId: 数字部分(ハイフン以降)のみでソート
      if (key === 'clientId') {
        const na = parseInt((va as string).split('-').pop() || '0', 10);
        const nb = parseInt((vb as string).split('-').pop() || '0', 10);
        va = na; vb = nb;
      }
    }
    if ((va as string | number) < (vb as string | number)) return sortOrder.value === 'asc' ? -1 : 1;
    if ((va as string | number) > (vb as string | number)) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });
  return rows;
});

// --- ページネーション ---
const PAGE_SIZE = 50;
const currentPage = ref(1);
const totalPages = computed(() => Math.ceil(filteredRows.value.length / PAGE_SIZE));
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredRows.value.slice(start, start + PAGE_SIZE);
});

// --- インライン編集 ---
const inlineEditId = ref<string | null>(null);
const inlineEditField = ref<string | null>(null);
const inlineEditValue = ref<string | number>('');
const inlineEditFiscalDay = ref<string | number>('末日');

const startInlineEdit = (row: Client, field: string, event: Event) => {
  event.stopPropagation();
  inlineEditId.value = row.clientId;
  inlineEditField.value = field;
  inlineEditValue.value = (row as unknown as Record<string, string | number>)[field] ?? '';
  if (field === 'fiscalMonth') {
    inlineEditFiscalDay.value = row.fiscalDay ?? '末日';
  }
  if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
  nextTick(() => {
    const el = document.querySelector('.cm-inline-input, .cm-inline-select') as HTMLElement;
    if (el) el.focus();
  });
};

const commitInlineEdit = (_row: Client) => {
  if (inlineEditId.value && inlineEditField.value) {
    const idx = clients.value.findIndex(c => c.clientId === inlineEditId.value);
    if (idx >= 0) {
      (clients.value[idx] as unknown as Record<string, string | number>)[inlineEditField.value!] = inlineEditValue.value;
    }
  }
  markDirty();
  cancelInlineEdit();
};

const commitFiscalEdit = (_row: Client) => {
  if (inlineEditId.value) {
    const idx = clients.value.findIndex(c => c.clientId === inlineEditId.value);
    if (idx >= 0) {
      const target = clients.value[idx]!;
      target.fiscalMonth = Number(inlineEditValue.value);
      target.fiscalDay = inlineEditFiscalDay.value;
    }
  }
  markDirty();
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

// B修正: 法人→個人切替時にhasRentalIncomeをリセット
watch(() => panelForm.type, (newType) => {
  if (newType === 'corp') {
    panelForm.hasRentalIncome = false;
  }
});

// --- クリック/ダブルクリック競合回避 ---
let clickTimer: ReturnType<typeof setTimeout> | null = null;

const delayedOpenEditPanel = (row: Client) => {
  if (inlineEditId.value) return; // インライン編集中はパネルを開かない
  if (clickTimer) clearTimeout(clickTimer);
  clickTimer = setTimeout(() => {
    openEditPanel(row);
    clickTimer = null;
  }, 250);
};

const openAddPanel = () => {
  Object.assign(panelForm, emptyClientForm());
  panelStaffId.value = '';
  panelMode.value = 'add';
  editingId.value = null;
};

const openEditPanel = (row: Client) => {
  const { clientId: _clientId, contact, ...rest } = row;
  Object.assign(panelForm, {
    ...rest,
    contactType: contact.type,
    contactValue: contact.value,
  });
  // Client.staffIdから直接取得
  panelStaffId.value = row.staffId ?? '';
  panelMode.value = 'edit';
  editingId.value = row.clientId;
  // Driveフォルダ存在確認（非同期）
  checkDriveFolderStatus(row);
};

const closePanel = () => {
  panelMode.value = null;
  editingId.value = null;
  showIndustryDropdown.value = false;
  folderStatus.value = null;
  folderCheckLoading.value = false;
};

const saveClient = () => {
  if (!panelForm.companyName && !panelForm.repName) {
    globalThis.alert('会社名または代表者名のどちらかを入力してください');
    return;
  }
  const { contactType, contactValue, ...fields } = panelForm;
  const clientId = editingId.value
    ? editingId.value
    : createClientId(panelForm.threeCode, clients.value);
  const data: Client = {
    ...fields,
    clientId,
    staffId: panelStaffId.value || null,
    contact: { type: contactType, value: contactValue },
  };
  if (panelMode.value === 'add') {
    clients.value.push(data);
    // Driveフォルダ自動作成（共有ドライブ内にフォルダを作成）
    createDriveFolderForClient(data).catch(err => {
      console.error('[clients] Driveフォルダ作成失敗:', err);
    });
    globalThis.alert(`「${data.companyName}」を追加しました。\n\n勘定科目マスタと税区分マスタ（デフォルト表示27件）が自動的にコピーされました。\nGoogle Driveフォルダも自動作成されます。`);
  } else {
    const idx = clients.value.findIndex(c => c.clientId === editingId.value);
    if (idx >= 0) clients.value[idx] = data;
    globalThis.alert(`「${data.companyName}」を更新しました。`);
  }
  closePanel();
  markDirty();
};

// --- K13: 休眠・契約終了 ---
const confirmSuspend = () => {
  if (globalThis.confirm(`「${panelForm.companyName}」を休眠にしますか？\n\n休眠中も顧問先データは保持されます。再開も可能です。`)) {
    panelForm.status = 'suspension';
    saveClient();
  }
};

const confirmTerminate = () => {
  if (globalThis.confirm(`「${panelForm.companyName}」の契約を終了しますか？\n\n顧問先データは保持されますが、契約終了として記録されます。`)) {
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
  if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
  nextTick(() => {
    const el = document.querySelector('.cm-inline-select') as HTMLElement;
    if (el) el.focus();
  });
};

const commitStaffEdit = (_row: Client) => {
  if (inlineEditId.value) {
    const staffId = inlineEditValue.value as string;
    // Client.staffIdを直接更新
    const idx = clients.value.findIndex(c => c.clientId === inlineEditId.value);
    if (idx >= 0 && clients.value[idx]) {
      clients.value[idx].staffId = staffId || null;
    }
  }
  markDirty();
  cancelInlineEdit();
};

// --- ドロップダウン外クリックで閉じる ---
const closeDropdowns = () => { showIndustryDropdown.value = false; };
onMounted(() => document.addEventListener('click', closeDropdowns));
onUnmounted(() => document.removeEventListener('click', closeDropdowns));

// --- Drive取込 URL ---
const driveUrlCopied = ref<string | null>(null);
const driveUrlPanelCopied = ref(false);

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

/** パネル内のDrive共有フォルダURL（編集時はsharedFolderIdから生成） */
const driveUploadUrl = computed(() => {
  if (!editingId.value) return '（保存後に自動生成）';
  const client = clients.value.find(c => c.clientId === editingId.value);
  return client?.sharedFolderId
    ? `https://drive.google.com/drive/folders/${client.sharedFolderId}`
    : '（Driveフォルダ未作成）';
});

/** パネル内のDrive URLコピー */
const copyDriveUrlPanel = async () => {
  try {
    await navigator.clipboard.writeText(driveUploadUrl.value);
    driveUrlPanelCopied.value = true;
    setTimeout(() => { driveUrlPanelCopied.value = false; }, 2500);
  } catch {
    window.prompt('URLをコピーしてください:', driveUploadUrl.value);
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
    markDirty();
  } catch (err) {
    console.error(`[clients] Driveフォルダ作成失敗 (${folderName}):`, err);
  }
};

// --- Driveフォルダ状態確認 ---
const folderStatus = ref<'ok' | 'trashed' | 'deleted' | 'none' | null>(null);
const folderCheckLoading = ref(false);
const folderRecreating = ref(false);

/** パネルopen時にDriveフォルダの存在を確認 */
const checkDriveFolderStatus = async (row: Client) => {
  const folderId = row.sharedFolderId;
  if (!folderId) {
    folderStatus.value = 'none';
    return;
  }

  folderCheckLoading.value = true;
  try {
    const res = await fetch(`/api/drive/folder/check?folderId=${encodeURIComponent(folderId)}`);
    if (!res.ok) {
      folderStatus.value = 'deleted';
      return;
    }
    const data = await res.json() as { exists: boolean; trashed: boolean };
    if (!data.exists) {
      folderStatus.value = 'deleted';
    } else if (data.trashed) {
      folderStatus.value = 'trashed';
    } else {
      folderStatus.value = 'ok';
    }
  } catch {
    folderStatus.value = 'deleted';
  } finally {
    folderCheckLoading.value = false;
  }
};

/** Driveフォルダ再作成 */
const recreateDriveFolder = async () => {
  if (!editingId.value) return;
  const client = clients.value.find(c => c.clientId === editingId.value);
  if (!client) return;

  folderRecreating.value = true;
  try {
    await createDriveFolderForClient(client);
    // 再チェック
    await checkDriveFolderStatus(client);
    globalThis.alert(`Driveフォルダを再作成しました。`);
  } catch (err) {
    console.error('[clients] Driveフォルダ再作成失敗:', err);
    globalThis.alert(`Driveフォルダの再作成に失敗しました。`);
  } finally {
    folderRecreating.value = false;
  }
};
</script>

<style scoped>
.cm-settings { max-width: 100%; margin: 0 auto; padding: 20px 24px; }
.cm-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.cm-back-link { color: #3b82f6; font-size: 13px; text-decoration: none; display: flex; align-items: center; gap: 4px; }
.cm-back-link:hover { text-decoration: underline; }
.cm-title { font-size: 18px; font-weight: 700; color: #1e293b; }

/* ツールバー */
.cm-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 8px 0; }
.cm-toolbar-left { display: flex; align-items: center; gap: 12px; }
.cm-toolbar-right { display: flex; align-items: center; gap: 8px; }
.cm-filter-select { border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 10px; font-size: 12px; color: #334155; background: white; cursor: pointer; outline: none; }
.cm-filter-select:focus { border-color: #3b82f6; }
.cm-page-info { font-size: 12px; color: #64748b; }
.cm-action-btn { border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 14px; font-size: 12px; cursor: pointer; background: white; color: #334155; transition: all 0.15s; display: flex; align-items: center; gap: 4px; }
.cm-action-btn:hover { border-color: #3b82f6; color: #3b82f6; }
.cm-action-btn.primary { background: #3b82f6; color: white; border-color: #3b82f6; }
.cm-action-btn.primary:hover { background: #2563eb; }

/* テーブル */
.cm-table-wrap { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 6px; background: white; }
.cm-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.cm-table thead th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 10px 12px; text-align: left; font-weight: 600; color: #475569; white-space: nowrap; user-select: none; }
.cm-table thead th.sortable { cursor: pointer; }
.cm-table thead th.sortable:hover { color: #3b82f6; }
.cm-table tbody td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; white-space: nowrap; }
.cm-table tbody tr:hover { background: #f8fafc; }
.cm-table tbody tr.row-inactive { opacity: 0.5; background: #f1f5f9; }
.cm-code { font-weight: 700; letter-spacing: 1px; color: #1e293b; font-family: 'Menlo', monospace; }
.cm-client-id { font-size: 10px; color: #64748b; font-family: 'Menlo', monospace; letter-spacing: 0.5px; }
.cm-client-id-input { background: #f1f5f9 !important; color: #94a3b8 !important; cursor: not-allowed; font-family: 'Menlo', monospace; letter-spacing: 0.5px; }
.cm-company-name { font-weight: 600; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
.cm-fiscal { text-align: center; }
.cm-empty { text-align: center; color: #94a3b8; padding: 40px 12px !important; }
.cm-sort-icon { font-size: 10px; color: #94a3b8; margin-left: 2px; }
.cm-sort-icon.active { color: #3b82f6; }

/* ステータスバッジ */
.cm-status-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
.status-active { background: #dcfce7; color: #166534; }
.status-inactive { background: #fee2e2; color: #991b1b; }
.status-suspension { background: #fef3c7; color: #92400e; }
.row-suspension { opacity: 0.6; background: #fefce8; }

/* 決算日セレクトグループ */
.cm-date-group { display: flex; align-items: center; gap: 8px; }
.cm-date-separator { font-size: 14px; color: #64748b; }

/* 主な連絡手段セル */
.cm-contact-cell { font-size: 11px; }
.cm-contact-fallback { color: #64748b; }
.cm-contact-warn { color: #f59e0b; font-size: 10px; margin-left: 4px; cursor: help; }

/* フィルターチェックボックス */
.cm-filter-checkboxes { display: flex; align-items: center; gap: 10px; }
.cm-filter-cb { display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; }
.cm-filter-cb input[type="checkbox"] { accent-color: #3b82f6; }
.cb-label { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }

/* インライン編集 */
.cm-inline-input { width: 100%; border: 1px solid #3b82f6; border-radius: 3px; padding: 4px 6px; font-size: 12px; color: #334155; outline: none; background: #eff6ff; box-sizing: border-box; }
.cm-inline-select { width: 100%; border: 1px solid #3b82f6; border-radius: 3px; padding: 3px 4px; font-size: 12px; color: #334155; outline: none; background: #eff6ff; box-sizing: border-box; cursor: pointer; }

/* 決算日インライン編集グループ */
.cm-inline-fiscal-group { display: flex; align-items: center; gap: 2px; }
.cm-inline-fiscal-sel { width: auto !important; min-width: 52px; padding: 2px 3px; font-size: 11px; }
.cm-inline-fiscal-sep { font-size: 11px; color: #64748b; }
.cm-inline-fiscal-ok { background: #3b82f6; color: white; border: none; border-radius: 3px; padding: 2px 6px; font-size: 11px; cursor: pointer; line-height: 1; }
.cm-inline-fiscal-ok:hover { background: #2563eb; }

/* 編集可能セルホバー（accounts準拠） */
.td-editable { cursor: text; }
.td-editable:hover { background: #fff9c4; outline: 1px dashed #fbc02d; }

/* 省略表示 */
.cm-ellipsis { max-width: 150px; overflow: hidden; text-overflow: ellipsis; }

/* ページネーション */
.cm-pagination { display: flex; justify-content: center; align-items: center; gap: 4px; margin-top: 16px; padding: 8px 0; }
.cm-page-arrow { cursor: pointer; padding: 4px 8px; color: #3b82f6; font-size: 13px; user-select: none; }
.cm-page-arrow.disabled { color: #cbd5e1; pointer-events: none; }
.cm-page-num { cursor: pointer; padding: 4px 10px; border-radius: 4px; font-size: 12px; color: #64748b; }
.cm-page-num.active { background: #3b82f6; color: white; }

/* スライドインパネル */
.cm-panel-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 100; display: flex; justify-content: flex-end; background: rgba(0,0,0,0.15); }
.cm-panel-container { width: 480px; max-width: 90vw; background: white; box-shadow: -4px 0 24px rgba(0,0,0,0.12); display: flex; flex-direction: column; height: 100%; }
.cm-panel-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; }
.cm-panel-title { font-size: 15px; font-weight: 700; color: #1e293b; }
.cm-panel-header-actions { display: flex; align-items: center; gap: 10px; }
.cm-panel-cancel { color: #3b82f6; font-size: 13px; background: none; border: none; cursor: pointer; }
.cm-panel-cancel:hover { text-decoration: underline; }
.cm-panel-save { color: white; font-size: 13px; background: #3b82f6; border: none; border-radius: 4px; padding: 6px 14px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.cm-panel-save:hover { background: #2563eb; }
.cm-panel-stop-btn { color: white; font-size: 12px; background: #f59e0b; border: none; border-radius: 4px; padding: 5px 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.cm-panel-stop-btn:hover { background: #d97706; }
.cm-panel-terminate-btn { color: white; font-size: 12px; background: #ef4444; border: none; border-radius: 4px; padding: 5px 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.cm-panel-terminate-btn:hover { background: #dc2626; }
.cm-panel-restore-btn { color: white; font-size: 12px; background: #22c55e; border: none; border-radius: 4px; padding: 5px 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.cm-panel-restore-btn:hover { background: #16a34a; }
.cm-panel-body { flex: 1; overflow-y: auto; padding: 20px; }

/* セクション */
.cm-section { margin-bottom: 24px; }
.cm-section-title { font-size: 14px; font-weight: 700; color: #1e293b; padding-bottom: 8px; border-bottom: 2px solid #3b82f6; margin-bottom: 14px; }
.cm-field { margin-bottom: 12px; }
.cm-label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px; }
.cm-hint { font-weight: 400; font-size: 10px; color: #94a3b8; }
.cm-required { color: #ef4444; }
.cm-input { width: 100%; border: 1px solid #cbd5e1; border-radius: 4px; padding: 7px 10px; font-size: 13px; color: #334155; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
.cm-input:focus { border-color: #3b82f6; }
.cm-code-input { width: 90px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; font-family: 'Menlo', monospace; }
.cm-select { border: 1px solid #cbd5e1; border-radius: 4px; padding: 7px 10px; font-size: 13px; color: #334155; background: white; cursor: pointer; outline: none; width: 100%; }
.cm-select:focus { border-color: #3b82f6; }
.cm-radio-group { display: flex; align-items: center; gap: 14px; margin-top: 2px; }
.cm-radio { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #334155; cursor: pointer; }
.cm-radio input[type="radio"] { accent-color: #3b82f6; }
.cm-checkbox-label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer; }
.cm-checkbox-label input[type="checkbox"] { accent-color: #3b82f6; }

/* 金額入力 */
.cm-amount-input { display: flex; align-items: center; gap: 6px; }
.cm-num-input { width: 160px !important; text-align: right; }
.cm-amount-unit { font-size: 12px; color: #64748b; }
.cm-computed-field { background: #f8fafc; border-radius: 4px; padding: 8px 10px; }
.cm-computed-value { font-size: 14px; font-weight: 700; color: #1e293b; }

/* カスタムドロップダウン */
.cm-custom-select { width: 100%; border: 1px solid #cbd5e1; border-radius: 4px; padding: 7px 10px; font-size: 13px; color: #334155; background: white; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; box-sizing: border-box; }
.cm-custom-select:hover { border-color: #3b82f6; }
.cm-placeholder { color: #94a3b8; }
.cm-select-arrow { font-size: 10px; color: #64748b; transition: transform 0.2s; }
.cm-select-arrow.rotated { transform: rotate(180deg); }
.cm-dropdown { position: absolute; top: 100%; left: 0; width: 100%; max-height: 220px; overflow-y: auto; background: white; border: 1px solid #cbd5e1; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 200; margin-top: 2px; }
.cm-dropdown-item { padding: 7px 10px; font-size: 12px; color: #334155; cursor: pointer; }
.cm-dropdown-item:hover { background: #f1f5f9; }
.cm-dropdown-item.selected { background: #eff6ff; color: #3b82f6; font-weight: 600; }

/* マスタ自動コピー通知 */
.cm-auto-copy-notice { display: flex; align-items: flex-start; gap: 8px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 12px 14px; font-size: 12px; color: #1e40af; line-height: 1.6; margin-top: 8px; }

/* スライドアニメーション */
.slide-panel-enter-active, .slide-panel-leave-active { transition: opacity 0.25s ease; }
.slide-panel-enter-active .cm-panel-container, .slide-panel-leave-active .cm-panel-container { transition: transform 0.25s ease; }
.slide-panel-enter-from { opacity: 0; }
.slide-panel-enter-from .cm-panel-container { transform: translateX(100%); }
.slide-panel-leave-to { opacity: 0; }
.slide-panel-leave-to .cm-panel-container { transform: translateX(100%); }

/* リサイズハンドル */
.resize-handle {
  position: absolute; top: 0; right: 0; width: 4px; height: 100%;
  cursor: col-resize; background: transparent; transition: background 0.15s; z-index: 2;
}
.resize-handle:hover { background: #3b82f6; }

/* Drive取込セル（テーブル） */
.cm-drive-cell {
  cursor: pointer;
  text-align: center;
  transition: background 0.15s;
}
.cm-drive-cell:hover { background: #fffbeb; }
.cm-drive-link {
  font-size: 11px; font-weight: 600;
  color: #92400e;
  padding: 2px 8px; border-radius: 4px;
  background: #fef3c7;
}
.cm-drive-copied {
  font-size: 11px; font-weight: 700;
  color: #166534;
  padding: 2px 8px; border-radius: 4px;
  background: #dcfce7;
}

/* Drive取込URL（パネル内） */
.cm-drive-url-box {
  display: flex; gap: 6px; align-items: center;
}
.cm-drive-url-input {
  flex: 1; min-width: 0;
  font-size: 11px; font-family: monospace;
  color: #64748b; background: #f8fafc;
}
.cm-drive-copy-btn {
  flex-shrink: 0;
  padding: 6px 14px; border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #fff; cursor: pointer;
  font-size: 11px; font-weight: 600;
  color: #334155; font-family: inherit;
  transition: all 0.2s;
}
.cm-drive-copy-btn:hover { background: #f0f7ff; border-color: #93c5fd; }
.cm-drive-copy-btn.copied { background: #dcfce7; border-color: #86efac; color: #166534; }

/* Driveフォルダ状態 */
.cm-drive-folder-status {
  display: flex; flex-direction: column; gap: 8px;
}
.cm-folder-checking { font-size: 12px; color: #64748b; }
.cm-folder-ok   { font-size: 12px; font-weight: 600; color: #166534; }
.cm-folder-warn  { font-size: 12px; font-weight: 600; color: #92400e; }
.cm-folder-error { font-size: 12px; font-weight: 600; color: #dc2626; }
.cm-folder-none  { font-size: 12px; font-weight: 600; color: #64748b; }
.cm-folder-recreate-btn {
  padding: 6px 16px; border-radius: 8px;
  border: 1px solid #f59e0b;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  color: #92400e; font-size: 12px; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
  font-family: inherit; width: fit-content;
}
.cm-folder-recreate-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  box-shadow: 0 2px 8px rgba(245,158,11,0.2);
}
.cm-folder-recreate-btn:disabled {
  opacity: 0.5; cursor: not-allowed;
}

/* 共有用メール */
.cm-shared-email { font-size: 11px; color: #2563eb; }
.cm-shared-email-none { font-size: 11px; color: #cbd5e1; font-style: italic; }
</style>
