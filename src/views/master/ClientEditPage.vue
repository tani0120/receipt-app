<template>
  <div class="ce-page">
    <!-- ヘッダー1行目: ページタイトル -->
    <div class="ce-header-top">
      <span class="ce-page-label">顧問先管理</span>
    </div>
    <!-- ヘッダー2行目: アクション -->
    <div class="ce-header">
      <div class="ce-header-left">
        <!-- 閲覧モード -->
        <template v-if="!isEditing">
          <button class="ce-btn ce-btn-back" @click="$router.push('/master/clients')"><i class="fa-solid fa-arrow-left"></i> 一覧に戻る</button>
        </template>
        <!-- 編集モード -->
        <template v-else>
          <button class="ce-btn ce-btn-cancel" @click="onCancel">キャンセル</button>
          <button class="ce-btn ce-btn-save" @click="saveClient"><i class="fa-solid fa-save"></i> 保存</button>
        </template>
      </div>
      <div class="ce-header-right">
        <div class="ce-action-icons">
          <button class="ce-icon-btn" title="新規登録" @click="$router.push('/master/clients/new')"><i class="fa-solid fa-plus"></i></button>
          <button v-if="!isEditing && !isNew" class="ce-icon-btn" title="編集" @click="startEditing"><i class="fa-solid fa-pen"></i></button>
          <button v-if="!isEditing && !isNew" class="ce-icon-btn" title="コピーして新規作成" @click="copyAndCreate"><i class="fa-regular fa-copy"></i></button>
        </div>
      </div>
    </div>

    <div class="ce-body">
      <!-- 左カラム: フォーム -->
      <div class="ce-main">
      <!-- 基本情報 -->
      <section class="ce-section">
        <h2 class="ce-section-title">基本情報</h2>
        <div class="ce-grid-5">
          <div class="ce-field">
            <label>契約状況</label>
            <span class="ce-readonly" :class="'ce-status-' + form.status">{{ getLabel(STATUS_OPTIONS, form.status) }}</span>
          </div>
          <div class="ce-field">
            <label>区分</label>
            <template v-if="isEditing">
              <select v-model="form.type" class="ce-select">
                <option v-for="o in TYPE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ typeLabel }}</span>
          </div>
          <div class="ce-field">
            <label>関与開始日</label>
            <input v-if="isEditing" type="date" v-model="form.engagementStartDate" class="ce-input ce-w-sm">
            <span v-else class="ce-readonly">{{ form.engagementStartDate || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>関与終了日</label>
            <input v-if="isEditing" type="date" v-model="form.engagementEndDate" class="ce-input ce-w-sm">
            <span v-else class="ce-readonly">{{ form.engagementEndDate || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>担当者</label>
            <template v-if="isEditing">
              <select v-model="staffId" class="ce-select">
                <option value="">未設定</option>
                <option v-for="s in activeStaffList" :key="s.uuid" :value="s.uuid">{{ s.name }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ staffLabel }}</span>
          </div>
          <div class="ce-field">
            <label>副担当（記帳担当）</label>
            <template v-if="isEditing">
              <select v-model="form.subStaffId" class="ce-select">
                <option :value="null">未設定</option>
                <option v-for="s in activeStaffList" :key="s.uuid" :value="s.uuid">{{ s.name }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ getStaffName(form.subStaffId) }}</span>
          </div>
          <div class="ce-field">
            <label>給与社保担当</label>
            <template v-if="isEditing">
              <select v-model="form.payrollStaffId" class="ce-select">
                <option :value="null">未設定</option>
                <option v-for="s in activeStaffList" :key="s.uuid" :value="s.uuid">{{ s.name }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ getStaffName(form.payrollStaffId) }}</span>
          </div>
          <div class="ce-field">
            <label>進捗管理</label>
            <a v-if="clientId" :href="journalListUrl" target="_blank" class="ce-link-btn"><i class="fa-solid fa-chart-line"></i> 仕訳一覧を開く</a>
            <span v-else class="ce-readonly ce-muted">（保存後に表示）</span>
          </div>
        </div>
        <div class="ce-grid-4" style="margin-top: 16px;">
          <div class="ce-field">
            <label>内部ID</label>
            <span class="ce-readonly ce-muted">{{ isNew ? '（自動生成）' : clientId }}</span>
          </div>
          <div class="ce-field">
            <label>3コード <span class="ce-required">*</span></label>
            <input v-if="isEditing" type="text" v-model="form.threeCode" class="ce-input ce-w-sm" maxlength="3" placeholder="ABC" @input="form.threeCode = form.threeCode.toUpperCase().replace(/[^A-Z]/g, '')">
            <span v-else class="ce-readonly ce-code">{{ form.threeCode || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>会社名</label>
            <input v-if="isEditing" type="text" v-model="form.companyName" class="ce-input" placeholder="株式会社サンプル">
            <span v-else class="ce-readonly">{{ form.companyName || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>会社名（カナ）</label>
            <input v-if="isEditing" type="text" v-model="form.companyNameKana" class="ce-input" placeholder="カブシキガイシャサンプル">
            <span v-else class="ce-readonly">{{ form.companyNameKana || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>法人番号 <span class="ce-warn-text">※マイナンバーは入れない</span></label>
            <input v-if="isEditing" type="text" v-model="form.corporateNumber" class="ce-input ce-w-sm" maxlength="13" placeholder="13桁">
            <span v-else class="ce-readonly">{{ form.corporateNumber || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>代表肩書</label>
            <input v-if="isEditing" type="text" v-model="form.repTitle" class="ce-input" placeholder="代表取締役">
            <span v-else class="ce-readonly">{{ form.repTitle || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>代表者名</label>
            <input v-if="isEditing" type="text" v-model="form.repName" class="ce-input" placeholder="山田 太郎">
            <span v-else class="ce-readonly">{{ form.repName || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>代表者名（カナ）</label>
            <input v-if="isEditing" type="text" v-model="form.repNameKana" class="ce-input" placeholder="ヤマダ タロウ">
            <span v-else class="ce-readonly">{{ form.repNameKana || '—' }}</span>
          </div>
        </div>
        <!-- ニーズ管理 -->
        <h3 class="ce-sub-title">ニーズ管理</h3>
        <div class="ce-grid-5">
          <div class="ce-field" v-for="(nLabel, nKey) in { needsInsurance: '保険', needsTaxSaving: '節税', needsSubsidy: '補助金', needsLoan: '借入', needsRealEstate: '不動産' }" :key="nKey">
            <label>{{ nLabel }}ニーズ</label>
            <template v-if="isEditing">
              <select v-model="(form as any)[nKey]" class="ce-select">
                <option v-for="o in NEEDS_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ getLabel(NEEDS_OPTIONS, (form as any)[nKey] ?? '') }}</span>
          </div>
        </div>
        <!-- 決算・税務 -->
        <h3 class="ce-sub-title">決算・税務</h3>
        <div class="ce-grid-4">
          <div class="ce-field">
            <label>決算日</label>
            <template v-if="isEditing">
              <div class="ce-date-group">
                <select v-model="form.fiscalMonth" class="ce-select ce-w-sm">
                  <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
                </select>
                <span>/</span>
                <select v-model="form.fiscalDay" class="ce-select ce-w-sm">
                  <option value="末日">末日</option>
                  <option v-for="d in 31" :key="d" :value="d">{{ d }}日</option>
                </select>
              </div>
            </template>
            <span v-else class="ce-readonly">{{ form.fiscalMonth }}月 / {{ form.fiscalDay === '末日' ? '末日' : form.fiscalDay + '日' }}</span>
          </div>
          <div class="ce-field">
            <label>消費税中間申告</label>
            <template v-if="isEditing">
              <select v-model="form.consumptionTaxInterim" class="ce-select">
                <option v-for="o in CONSUMPTION_TAX_INTERIM_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ getLabel(CONSUMPTION_TAX_INTERIM_OPTIONS, form.consumptionTaxInterim ?? 'none') }}</span>
          </div>
          <div class="ce-field">
            <template v-if="isEditing">
              <label class="ce-checkbox"><input type="checkbox" v-model="form.isInvoiceRegistered"><span>インボイス登録事業者</span></label>
            </template>
            <template v-else>
              <label>インボイス登録</label>
              <span class="ce-readonly">{{ form.isInvoiceRegistered ? '✅ 登録済み' : '☐ 未登録' }}</span>
            </template>
          </div>
          <div v-if="form.isInvoiceRegistered" class="ce-field">
            <label>登録番号</label>
            <input v-if="isEditing" type="text" v-model="form.invoiceRegistrationNumber" class="ce-input" placeholder="T1234567890123">
            <span v-else class="ce-readonly">{{ form.invoiceRegistrationNumber || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>設立日</label>
            <input v-if="isEditing" type="text" v-model="form.establishedDate" class="ce-input ce-w-sm" placeholder="YYYYMMDD" maxlength="8">
            <span v-else class="ce-readonly">{{ form.establishedDate || '—' }}</span>
          </div>
        </div>
        <!-- 備考・URL・その他 -->
        <h3 class="ce-sub-title">備考・URL・その他</h3>
        <div class="ce-grid-full">
          <div class="ce-field">
            <label>備考</label>
            <textarea v-if="isEditing" v-model="form.memo" class="ce-input ce-textarea" rows="3" placeholder="メモ"></textarea>
            <span v-else class="ce-readonly ce-pre-wrap">{{ form.memo || '—' }}</span>
          </div>
        </div>
        <div class="ce-grid-3" style="margin-top: 12px;">
          <div class="ce-field">
            <label>WebサイトURL</label>
            <input v-if="isEditing" type="url" v-model="form.websiteUrl" class="ce-input" placeholder="https://example.com">
            <span v-else class="ce-readonly">{{ form.websiteUrl || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>顧問先ログインメール（自動取得）<span class="ce-hint">※編集不可</span></label>
            <span class="ce-readonly ce-muted">{{ sharedEmail || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>社内用アップロードURL（自動）</label>
            <div v-if="clientId" class="ce-url-row">
              <span class="ce-readonly ce-url-text">{{ uploadUrlStaff }}</span>
              <button class="ce-copy-btn" @click="copyToClipboard(uploadUrlStaff)" title="コピー"><i class="fa-regular fa-copy"></i></button>
            </div>
            <span v-else class="ce-readonly ce-muted">（保存後に表示）</span>
          </div>
          <div class="ce-field">
            <label>顧問先用アップロードURL（自動）</label>
            <div v-if="clientId" class="ce-url-row">
              <span class="ce-readonly ce-url-text">{{ uploadUrlGuest }}</span>
              <button class="ce-copy-btn" @click="copyToClipboard(uploadUrlGuest)" title="コピー"><i class="fa-regular fa-copy"></i></button>
            </div>
            <span v-else class="ce-readonly ce-muted">（保存後に表示）</span>
          </div>
          <div class="ce-field">
            <label>売上高</label>
            <input v-if="isEditing" type="text" v-model="form.annualRevenue" class="ce-input" placeholder="1億円以上">
            <span v-else class="ce-readonly">{{ form.annualRevenue || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>総従業員数</label>
            <input v-if="isEditing" type="number" v-model.number="form.employeeCount" class="ce-input ce-w-sm" min="0">
            <span v-else class="ce-readonly">{{ form.employeeCount != null ? form.employeeCount + '名' : '—' }}</span>
          </div>
          <div class="ce-field">
            <label>業種</label>
            <template v-if="isEditing">
              <select v-model="form.industry" class="ce-select">
                <option v-for="opt in INDUSTRY_OPTIONS" :key="opt" :value="opt">{{ opt || '未設定' }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ form.industry || '未設定' }}</span>
          </div>
          <div class="ce-field">
            <label>親号先/グループ会社</label>
            <input v-if="isEditing" type="text" v-model="form.parentCompany" class="ce-input">
            <span v-else class="ce-readonly">{{ form.parentCompany || '—' }}</span>
          </div>
        </div>
        <div class="ce-grid-full" style="margin-top: 12px;">
          <div class="ce-field">
            <label>事業内容</label>
            <textarea v-if="isEditing" v-model="form.businessDescription" class="ce-input ce-textarea" rows="3" placeholder="事業内容の詳細"></textarea>
            <span v-else class="ce-readonly ce-pre-wrap">{{ form.businessDescription || '—' }}</span>
          </div>
        </div>
      </section>

      <!-- 連絡先 -->
      <section class="ce-section">
        <h2 class="ce-section-title">連絡先</h2>
        <div class="ce-grid-3">
          <div class="ce-field">
            <label>電話番号</label>
            <input v-if="isEditing" type="text" v-model="form.phoneNumber" class="ce-input" placeholder="03-1234-5678">
            <span v-else class="ce-readonly">{{ form.phoneNumber || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>メールアドレス</label>
            <input v-if="isEditing" type="email" v-model="form.email" class="ce-input" placeholder="example@mail.com">
            <span v-else class="ce-readonly">{{ form.email || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>社内チャットURL</label>
            <input v-if="isEditing" type="url" v-model="form.chatRoomUrl" class="ce-input" placeholder="https://www.chatwork.com/#!rid...">
            <span v-else class="ce-readonly">{{ form.chatRoomUrl || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>顧問先共有チャットURL</label>
            <input v-if="isEditing" type="url" v-model="sharedChatUrl" class="ce-input" placeholder="https://www.chatwork.com/#!rid...">
            <span v-else class="ce-readonly">{{ sharedChatUrl || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>主な連絡手段</label>
            <template v-if="isEditing">
              <select v-model="form.contactType" class="ce-select">
                <option v-for="o in CONTACT_METHOD_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ contactTypeLabel }}</span>
          </div>
          <div class="ce-field">
            <label>連絡先</label>
            <input v-if="isEditing" type="text" v-model="form.contactValue" class="ce-input" :placeholder="form.contactType === 'email' ? 'example@mail.com' : 'Chatwork ID'">
            <span v-else class="ce-readonly">{{ form.contactValue || '—' }}</span>
          </div>
        </div>
      </section>

      <!-- 会計設定 -->
      <section class="ce-section">
        <h2 class="ce-section-title">会計設定</h2>
        <div class="ce-grid-3">
          <div class="ce-field">
            <label>会計ソフト</label>
            <template v-if="isEditing">
              <select v-model="form.accountingSoftware" class="ce-select">
                <option v-for="o in ACCOUNTING_SOFTWARE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ accountingSoftwareLabel }}</span>
          </div>
          <div class="ce-field">
            <label>確定申告</label>
            <template v-if="isEditing">
              <select v-model="form.taxFilingType" class="ce-select">
                <option v-for="o in TAX_FILING_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ taxFilingLabel }}</span>
          </div>
          <div class="ce-field">
            <label>課税方式</label>
            <template v-if="isEditing">
              <select v-model="form.consumptionTaxMode" class="ce-select">
                <option v-for="o in TAX_MODE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ consumptionTaxLabel }}</span>
          </div>
          <div v-if="form.consumptionTaxMode === 'simplified'" class="ce-field">
            <label>事業区分</label>
            <template v-if="isEditing">
              <select v-model="form.simplifiedTaxCategory" class="ce-select">
                <option :value="undefined">未設定</option>
                <option v-for="o in SIMPLIFIED_CATEGORY_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ simplifiedCategoryLabel }}</span>
          </div>
          <div class="ce-field">
            <label>税込/税抜</label>
            <template v-if="isEditing">
              <select v-model="form.taxMethod" class="ce-select">
                <option v-for="o in TAX_METHOD_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ taxMethodLabel }}</span>
          </div>
          <div class="ce-field">
            <label>経理方式</label>
            <template v-if="isEditing">
              <select v-model="form.calculationMethod" class="ce-select">
                <option v-for="o in CALCULATION_METHOD_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ calculationMethodLabel }}</span>
          </div>
          <div class="ce-field">
            <label>デフォルト支払方法</label>
            <template v-if="isEditing">
              <select v-model="form.defaultPaymentMethod" class="ce-select">
                <option v-for="o in DEFAULT_PAYMENT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ defaultPaymentLabel }}</span>
          </div>
          <div class="ce-field">
            <template v-if="isEditing">
              <label class="ce-checkbox"><input type="checkbox" v-model="form.hasDepartmentManagement"><span>部門管理あり</span></label>
            </template>
            <template v-else>
              <label>部門管理</label>
              <span class="ce-readonly">{{ form.hasDepartmentManagement ? '✅ あり' : '☐ なし' }}</span>
            </template>
          </div>
          <div v-if="form.type === 'individual' || form.type === 'sole_proprietor'" class="ce-field">
            <template v-if="isEditing">
              <label class="ce-checkbox"><input type="checkbox" v-model="form.hasRentalIncome"><span>不動産所得あり</span></label>
              <span class="ce-hint">有効にすると不動産関連15科目が選択可能になります</span>
            </template>
            <template v-else>
              <label>不動産所得</label>
              <span class="ce-readonly">{{ form.hasRentalIncome ? '✅ あり' : '☐ なし' }}</span>
            </template>
          </div>
        </div>
      </section>

      <!-- システム導入状況 -->
      <section class="ce-section">
        <h2 class="ce-section-title">システム導入状況</h2>
        <div class="ce-grid-3">
          <div class="ce-field">
            <label>会計ソフト</label>
            <span class="ce-readonly">{{ accountingSoftwareLabel }}</span>
          </div>
          <div class="ce-field">
            <label>会計ソフト備考</label>
            <input v-if="isEditing" type="text" v-model="form.accountingSoftwareMemo" class="ce-input">
            <span v-else class="ce-readonly">{{ form.accountingSoftwareMemo || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>給与計算ソフト</label>
            <input v-if="isEditing" type="text" v-model="form.payrollSoftware" class="ce-input">
            <span v-else class="ce-readonly">{{ form.payrollSoftware || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>給与計算備考</label>
            <input v-if="isEditing" type="text" v-model="form.payrollSoftwareMemo" class="ce-input">
            <span v-else class="ce-readonly">{{ form.payrollSoftwareMemo || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>勤怠管理システム</label>
            <input v-if="isEditing" type="text" v-model="form.attendanceSystem" class="ce-input">
            <span v-else class="ce-readonly">{{ form.attendanceSystem || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>勤怠管理備考</label>
            <input v-if="isEditing" type="text" v-model="form.attendanceSystemMemo" class="ce-input">
            <span v-else class="ce-readonly">{{ form.attendanceSystemMemo || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>その他システム</label>
            <input v-if="isEditing" type="text" v-model="form.otherSystem" class="ce-input">
            <span v-else class="ce-readonly">{{ form.otherSystem || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>その他システム備考</label>
            <input v-if="isEditing" type="text" v-model="form.otherSystemMemo" class="ce-input">
            <span v-else class="ce-readonly">{{ form.otherSystemMemo || '—' }}</span>
          </div>
        </div>
      </section>

      <!-- 報酬情報 -->
      <section class="ce-section">
        <h2 class="ce-section-title">報酬情報</h2>
        <!-- 契約種別 -->
        <div class="ce-grid-3">
          <div class="ce-field">
            <label>契約内容</label>
            <template v-if="isEditing">
              <select v-model="form.contractScope" class="ce-select">
                <option value="">未設定</option>
                <option v-for="o in CONTRACT_SCOPE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ form.contractScope ? getLabel(CONTRACT_SCOPE_OPTIONS, form.contractScope) : '—' }}</span>
          </div>
          <div class="ce-field">
            <label>記帳代行・自計化</label>
            <template v-if="isEditing">
              <select v-model="form.bookkeepingType" class="ce-select">
                <option value="">未設定</option>
                <option v-for="o in BOOKKEEPING_TYPE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ form.bookkeepingType ? getLabel(BOOKKEEPING_TYPE_OPTIONS, form.bookkeepingType) : '—' }}</span>
          </div>
          <div class="ce-field">
            <label>社労士契約</label>
            <template v-if="isEditing">
              <select v-model="form.hasSocialInsuranceContract" class="ce-select">
                <option v-for="o in YES_NO_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ getLabel(YES_NO_OPTIONS, form.hasSocialInsuranceContract ?? 'no') }}</span>
          </div>
          <div class="ce-field">
            <label>給与</label>
            <template v-if="isEditing">
              <select v-model="form.hasPayrollService" class="ce-select">
                <option v-for="o in YES_NO_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ getLabel(YES_NO_OPTIONS, form.hasPayrollService ?? 'no') }}</span>
          </div>
          <div class="ce-field">
            <label>経理代行</label>
            <template v-if="isEditing">
              <select v-model="form.hasAccountingService" class="ce-select">
                <option v-for="o in YES_NO_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ getLabel(YES_NO_OPTIONS, form.hasAccountingService ?? 'no') }}</span>
          </div>
        </div>
        <!-- 報酬金額 -->
        <h3 class="ce-sub-title">報酬金額</h3>
        <div class="ce-grid-4">
          <div class="ce-field">
            <label>月額顧問報酬</label>
            <template v-if="isEditing">
              <div class="ce-amount"><input type="number" v-model.number="form.advisoryFee" class="ce-input ce-w-sm" min="0"><span>円</span></div>
            </template>
            <span v-else class="ce-readonly">{{ form.advisoryFee.toLocaleString() }} 円</span>
          </div>
          <div class="ce-field">
            <label>記帳代行報酬</label>
            <template v-if="isEditing">
              <div class="ce-amount"><input type="number" v-model.number="form.bookkeepingFee" class="ce-input ce-w-sm" min="0"><span>円</span></div>
            </template>
            <span v-else class="ce-readonly">{{ form.bookkeepingFee.toLocaleString() }} 円</span>
          </div>
          <div class="ce-field">
            <label>社労士報酬</label>
            <template v-if="isEditing">
              <div class="ce-amount"><input type="number" v-model.number="form.socialInsuranceFee" class="ce-input ce-w-sm" min="0"><span>円</span></div>
            </template>
            <span v-else class="ce-readonly">{{ (form.socialInsuranceFee ?? 0).toLocaleString() }} 円</span>
          </div>
          <div class="ce-field">
            <label>給与報酬</label>
            <template v-if="isEditing">
              <div class="ce-amount"><input type="number" v-model.number="form.payrollFee" class="ce-input ce-w-sm" min="0"><span>円</span></div>
            </template>
            <span v-else class="ce-readonly">{{ (form.payrollFee ?? 0).toLocaleString() }} 円</span>
          </div>
          <div class="ce-field">
            <label>経理代行報酬</label>
            <template v-if="isEditing">
              <div class="ce-amount"><input type="number" v-model.number="form.accountingServiceFee" class="ce-input ce-w-sm" min="0"><span>円</span></div>
            </template>
            <span v-else class="ce-readonly">{{ (form.accountingServiceFee ?? 0).toLocaleString() }} 円</span>
          </div>
          <div class="ce-field">
            <label>システム報酬</label>
            <template v-if="isEditing">
              <div class="ce-amount"><input type="number" v-model.number="form.systemFee" class="ce-input ce-w-sm" min="0"><span>円</span></div>
            </template>
            <span v-else class="ce-readonly">{{ (form.systemFee ?? 0).toLocaleString() }} 円</span>
          </div>
          <div class="ce-field ce-computed">
            <label>月次合計（自動算出）</label>
            <span class="ce-computed-val">{{ (form.advisoryFee + form.bookkeepingFee + (form.socialInsuranceFee ?? 0) + (form.payrollFee ?? 0) + (form.accountingServiceFee ?? 0) + (form.systemFee ?? 0)).toLocaleString() }} 円</span>
          </div>
          <div class="ce-field">
            <label>決算報酬</label>
            <template v-if="isEditing">
              <div class="ce-amount"><input type="number" v-model.number="form.settlementFee" class="ce-input ce-w-sm" min="0"><span>円</span></div>
            </template>
            <span v-else class="ce-readonly">{{ form.settlementFee.toLocaleString() }} 円</span>
          </div>
          <div class="ce-field">
            <label>消費税申告報酬</label>
            <template v-if="isEditing">
              <div class="ce-amount"><input type="number" v-model.number="form.taxFilingFee" class="ce-input ce-w-sm" min="0"><span>円</span></div>
            </template>
            <span v-else class="ce-readonly">{{ form.taxFilingFee.toLocaleString() }} 円</span>
          </div>
          <div class="ce-field ce-computed">
            <label>年間総報酬（自動算出）</label>
            <span class="ce-computed-val">{{ annualTotal.toLocaleString() }} 円</span>
          </div>
        </div>
        <!-- 契約・引落 -->
        <h3 class="ce-sub-title">契約・引き落とし</h3>
        <div class="ce-grid-3">
          <div class="ce-field">
            <label>契約書リンク</label>
            <input v-if="isEditing" type="url" v-model="form.contractDocUrl" class="ce-input" placeholder="https://...">
            <span v-else class="ce-readonly">{{ form.contractDocUrl || '—' }}</span>
          </div>
          <div class="ce-field">
            <label>引き落とし方法</label>
            <template v-if="isEditing">
              <select v-model="form.paymentMethod" class="ce-select">
                <option value="">未設定</option>
                <option v-for="o in PAYMENT_METHOD_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ form.paymentMethod ? getLabel(PAYMENT_METHOD_OPTIONS, form.paymentMethod) : '—' }}</span>
          </div>
          <div class="ce-field">
            <label>引き落とし日</label>
            <template v-if="isEditing">
              <select v-model="form.paymentDay" class="ce-select">
                <option value="">未設定</option>
                <option v-for="o in PAYMENT_DAY_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </template>
            <span v-else class="ce-readonly">{{ form.paymentDay ? getLabel(PAYMENT_DAY_OPTIONS, form.paymentDay) : '—' }}</span>
          </div>
        </div>
        <div class="ce-grid-full" style="margin-top: 12px;">
          <div class="ce-field">
            <label>報酬備考</label>
            <textarea v-if="isEditing" v-model="form.feeNotes" class="ce-input ce-textarea" rows="3" placeholder="報酬に関するメモ"></textarea>
            <span v-else class="ce-readonly ce-pre-wrap">{{ form.feeNotes || '—' }}</span>
          </div>
        </div>
      </section>






      <!-- マスタ自動コピー通知 -->
      <div v-if="isNew" class="ce-notice">
        <i class="fa-solid fa-circle-info"></i>
        新規作成時、勘定科目マスタと税区分マスタ（デフォルト表示27件）が自動的にコピーされます。
      </div>
      </div>
      <!-- 右カラム: コメント -->
      <aside class="ce-comment-panel">
        <h3 class="ce-comment-title"><i class="fa-regular fa-comment-dots"></i> コメント</h3>
        <div class="ce-comment-input-area">
          <div class="ce-mention-wrapper">
            <textarea ref="commentTextarea" v-model="newComment" class="ce-comment-input" placeholder="コメントする（@でメンション）" rows="1" @keydown.ctrl.enter="addComment" @input="onCommentInput" @keydown="onMentionKeydown"></textarea>
            <button class="ce-comment-submit" :disabled="!newComment.trim()" @click="addComment"><i class="fa-solid fa-paper-plane"></i></button>
          </div>
        </div>
        <!-- メンションポップアップ（overflow制約回避のためパネル直下に配置） -->
        <div v-if="showMentionPopup" class="ce-mention-popup">
          <div v-if="mentionCandidates.length === 0" class="ce-mention-empty">該当なし</div>
          <button v-for="(s, i) in mentionCandidates" :key="s.uuid" class="ce-mention-item" :class="{ active: i === mentionIndex, inactive: s.status === 'inactive', 'mention-all': s.uuid === '__all__' }" @mousedown.prevent="selectMention(s)"><span v-if="s.uuid === '__all__'" class="ce-mention-all-icon">👥</span><span class="ce-mention-name">{{ s.name }}</span><span v-if="s.nameRomaji" class="ce-mention-romaji">{{ s.nameRomaji }}</span><span v-if="s.status === 'inactive'" class="ce-mention-badge-inactive">停止中</span></button>
        </div>
        <div class="ce-comment-list">
          <div v-if="comments.length === 0" class="ce-comment-empty">コメントはありません。</div>
          <div v-for="c in comments" :key="c.id" class="ce-comment-item">
            <div class="ce-comment-meta">
              <span class="ce-comment-author">{{ c.author }}</span>
              <span class="ce-comment-date">{{ c.date }}</span>
              <button class="ce-comment-delete" title="削除" @click="deleteComment(c.id)"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <p class="ce-comment-body" v-html="renderMentions(c.body)"></p>
          </div>
        </div>
      </aside>
    </div>

    <ConfirmModal :show="modal.confirmState.show" :title="modal.confirmState.title" :message="modal.confirmState.message" :confirm-label="modal.confirmState.confirmLabel" :cancel-label="modal.confirmState.cancelLabel" :variant="modal.confirmState.variant" @confirm="modal.onConfirm" @cancel="modal.onCancel" />
    <NotifyModal :show="modal.notifyState.show" :title="modal.notifyState.title" :message="modal.notifyState.message" :variant="modal.notifyState.variant" @close="modal.onNotifyClose" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClients, emptyClientForm } from '@/features/client-management/composables/useClients';
import type { Client, ClientForm } from '@/features/client-management/composables/useClients';
import { useStaff } from '@/features/staff-management/composables/useStaff';
import type { Staff } from '@/features/staff-management/composables/useStaff';
import { useCurrentUser } from '@/composables/useCurrentUser';
import { useNotificationCenter } from '@/composables/useNotificationCenter';
import { useModalHelper } from '@/composables/useModalHelper';
import { useDriveFolder } from '@/composables/useDriveFolder';
import {
  TYPE_OPTIONS, INDUSTRY_OPTIONS, ACCOUNTING_SOFTWARE_OPTIONS,
  TAX_FILING_OPTIONS, TAX_MODE_OPTIONS, SIMPLIFIED_CATEGORY_OPTIONS,
  TAX_METHOD_OPTIONS, CALCULATION_METHOD_OPTIONS, DEFAULT_PAYMENT_OPTIONS,
  CONSUMPTION_TAX_INTERIM_OPTIONS, NEEDS_OPTIONS, CONTRACT_SCOPE_OPTIONS,
  BOOKKEEPING_TYPE_OPTIONS, YES_NO_OPTIONS, PAYMENT_METHOD_OPTIONS,
  PAYMENT_DAY_OPTIONS, CONTACT_METHOD_OPTIONS,
  STATUS_OPTIONS, getLabel,
} from '@/constants/clientOptions';
import ConfirmModal from '@/components/ConfirmModal.vue';
import NotifyModal from '@/components/NotifyModal.vue';

const route = useRoute();
const router = useRouter();
const { clients, updateClientLocal, addClient, updateSharedFolderId } = useClients();
const { activeStaff: activeStaffList } = useStaff();
const { userName: currentUserName, currentStaffId: myStaffId } = useCurrentUser();
const { sendMentionNotification } = useNotificationCenter();
const modal = useModalHelper();
const { createFolder, renameFolder } = useDriveFolder();

/** 新規 or 編集判定 */
const clientId = computed(() => route.params.clientId as string | undefined);
const routeIsNew = computed(() => !clientId.value || route.name === 'ClientNew');
/** コピー新規モード（画面遷移なしで新規作成として保存する） */
const isCopyNew = ref(false);
/** 実質的な新規判定（ルート上の新規 or コピー新規） */
const isNew = computed(() => routeIsNew.value || isCopyNew.value);
/** 編集モード（false=閲覧、true=編集） */
const isEditing = ref(false);

const form = reactive<ClientForm>(emptyClientForm());
const staffId = ref('');
const sharedEmail = ref('');
const sharedChatUrl = ref('');
/** 編集前のスナップショット（キャンセル時の復元用） */
let originalSnapshot: string = '';

/** 閲覧モード用ラベル変換（clientOptions.ts の getLabel に統一） */
const typeLabel = computed(() => getLabel(TYPE_OPTIONS, form.type));
const taxFilingLabel = computed(() => getLabel(TAX_FILING_OPTIONS, form.taxFilingType));
const consumptionTaxLabel = computed(() => getLabel(TAX_MODE_OPTIONS, form.consumptionTaxMode));
const taxMethodLabel = computed(() => getLabel(TAX_METHOD_OPTIONS, form.taxMethod));
const contactTypeLabel = computed(() => getLabel(CONTACT_METHOD_OPTIONS, form.contactType));
const accountingSoftwareLabel = computed(() => getLabel(ACCOUNTING_SOFTWARE_OPTIONS, form.accountingSoftware));
const calculationMethodLabel = computed(() => getLabel(CALCULATION_METHOD_OPTIONS, form.calculationMethod));
const defaultPaymentLabel = computed(() => getLabel(DEFAULT_PAYMENT_OPTIONS, form.defaultPaymentMethod));
const simplifiedCategoryLabel = computed(() => {
  return form.simplifiedTaxCategory ? getLabel(SIMPLIFIED_CATEGORY_OPTIONS, form.simplifiedTaxCategory) : '未設定';
});
const staffLabel = computed(() => {
  if (!staffId.value) return '未設定';
  const s = activeStaffList.value.find(s => s.uuid === staffId.value);
  return s?.name ?? '不明';
});
/** スタッフ名取得ヘルパー（副担当・給与社保担当用） */
const getStaffName = (id: string | null | undefined): string => {
  if (!id) return '未設定';
  const s = activeStaffList.value.find(s => s.uuid === id);
  return s?.name ?? '不明';
};
/** 自動生成URL */
const uploadUrlStaff = computed(() => clientId.value ? `${location.origin}/#/upload/${clientId.value}/staff` : '');
const uploadUrlGuest = computed(() => clientId.value ? `${location.origin}/#/guest/${clientId.value}` : '');
const journalListUrl = computed(() => clientId.value ? `${location.origin}/#/journal-list/${clientId.value}` : '');
/** クリップボードコピー */
const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); };

/** スナップショット取得（現在のフォーム状態を文字列化） */
const takeSnapshot = () => JSON.stringify({ ...form, staffId: staffId.value, sharedEmail: sharedEmail.value, sharedChatUrl: sharedChatUrl.value });

/** 編集モードに入る */
const startEditing = () => {
  originalSnapshot = takeSnapshot();
  isEditing.value = true;
};

/** 変更があるか判定 */
const hasChanges = () => takeSnapshot() !== originalSnapshot;

const annualTotal = computed(() => {
  const monthly = form.advisoryFee + form.bookkeepingFee
    + (form.socialInsuranceFee ?? 0) + (form.payrollFee ?? 0)
    + (form.accountingServiceFee ?? 0) + (form.systemFee ?? 0);
  return monthly * 12 + form.settlementFee + form.taxFilingFee;
});

/** 法人→個人切替時にhasRentalIncomeリセット */
watch(() => form.type, (v) => { if (v === 'corp') form.hasRentalIncome = false; });

/** メンション用スタッフリスト（useStaffから取得） */
const { staffList: mentionStaffList } = useStaff();

/** 既存データをフォームに読み込み */
const loadClientData = () => {
  if (clientId.value) {
    const c = clients.value.find(cl => cl.clientId === clientId.value);
    if (!c) { router.replace('/master/clients'); return; }
    const { clientId: _id, contact, ...rest } = c;
    Object.assign(form, { ...rest, contactType: contact.type, contactValue: contact.value });
    staffId.value = c.staffId ?? '';
    sharedEmail.value = c.sharedEmail ?? '';
    sharedChatUrl.value = c.sharedChatUrl ?? '';
  }
};

/** スナップショットからフォームを復元 */
const restoreFromSnapshot = () => {
  try {
    const data = JSON.parse(originalSnapshot);
    const { staffId: sId, sharedEmail: sEmail, sharedChatUrl: sChat, ...rest } = data;
    Object.assign(form, rest);
    staffId.value = sId ?? '';
    sharedEmail.value = sEmail ?? '';
    sharedChatUrl.value = sChat ?? '';
  } catch { /* 復元失敗時は何もしない */ }
};

onMounted(async () => {
  initPage();
});

/** ルート変更時（同一コンポーネント間遷移）にフォームを再初期化 */
watch(() => route.fullPath, () => {
  initPage();
});

/** ページ初期化（新規/既存の判定とフォーム設定） */
const initPage = () => {
  // コピー新規モードをリセット
  isCopyNew.value = false;
  if (routeIsNew.value) {
    // 新規作成: フォームをまっさらにして編集モード
    Object.assign(form, emptyClientForm());
    staffId.value = '';
    sharedEmail.value = '';
    sharedChatUrl.value = '';
    isEditing.value = true;
    comments.value = [];
  } else {
    // 既存顧問先: データ読み込み → 閲覧モード
    loadClientData();
    isEditing.value = false;
  }
  originalSnapshot = takeSnapshot();
  loadComments();
};

/** キャンセル処理 */
const onCancel = async () => {
  // 変更があればconfirm
  if (hasChanges()) {
    const ok = await modal.confirm({ title: '変更を破棄しますか？', message: '保存されていない変更は失われます。', confirmLabel: '破棄する', cancelLabel: '編集を続ける', variant: 'danger' });
    if (!ok) return;
  }

  if (routeIsNew.value) {
    // 新規登録 or コピー新規: 直前の画面に戻る
    router.back();
    return;
  }

  // 既存編集: スナップショットから復元 → 閲覧モードに戻る（画面遷移なし）
  restoreFromSnapshot();
  isEditing.value = false;
  isCopyNew.value = false;
};

/** コピーして新規作成（画面遷移なし） */
const copyAndCreate = () => {
  // clientId・3コードをクリアして新規作成モードに切替
  form.threeCode = '';
  isCopyNew.value = true;
  isEditing.value = true;
  comments.value = [];
  originalSnapshot = takeSnapshot();
};

// --- コメント機能 ---
interface ClientComment { id: string; author: string; body: string; date: string; }
const newComment = ref('');
const comments = ref<ClientComment[]>([]);
const commentStorageKey = computed(() => `client-comments-${clientId.value || 'new'}`);
const commentTextarea = ref<HTMLTextAreaElement | null>(null);

const loadComments = () => {
  try {
    const raw = localStorage.getItem(commentStorageKey.value);
    comments.value = raw ? JSON.parse(raw) as ClientComment[] : [];
  } catch { comments.value = []; }
};
const saveComments = () => { localStorage.setItem(commentStorageKey.value, JSON.stringify(comments.value)); };
const addComment = () => {
  if (!newComment.value.trim()) return;
  showMentionPopup.value = false;
  const body = newComment.value.trim();
  const cmtId = `cmt-${crypto.randomUUID().slice(0, 8)}`;
  comments.value.unshift({ id: cmtId, author: currentUserName.value, body, date: new Date().toLocaleString('ja-JP') });
  newComment.value = '';
  // テキストエリアの高さをリセット
  if (commentTextarea.value) {
    commentTextarea.value.style.height = 'auto';
  }
  saveComments();
  // メンション通知をサーバーAPIに委譲（フロントにロジックなし）
  if (body.includes('@')) {
    sendMentionNotification({
      commentBody: body,
      authorName: currentUserName.value,
      authorStaffId: myStaffId.value ?? '',
      clientId: clientId.value ?? '',
      clientName: form.companyName || '新規顧問先',
    });
  }
};
const deleteComment = (id: string) => { comments.value = comments.value.filter(c => c.id !== id); saveComments(); };

/** @メンションをハイライト表示 */
const renderMentions = (text: string): string => {
  // URL自動リンク化（メンション処理の前に実行）
  let html = text.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener" class="ce-comment-link">$1</a>');
  // @メンションハイライト
  html = html.replace(/@([\u3000-\u9FFF\w\s]+?)(?=\s|$|@)/g, '<span class="ce-mention-tag">@$1</span>');
  return html;
};

// --- メンションポップアップ ---
const showMentionPopup = ref(false);
const mentionQuery = ref('');
const mentionStart = ref(0);
const mentionIndex = ref(0);

const mentionCandidates = computed(() => {
  // @all 候補を先頭に追加
  const allEntry: Staff = { uuid: '__all__', name: 'all（全員）', email: '', role: 'general' as const, status: 'active' as const };
  const staffEntries = mentionStaffList.value;
  if (!mentionQuery.value) return [allEntry, ...staffEntries];
  const q = mentionQuery.value.toLowerCase();
  if ('all'.includes(q) || '全員'.includes(q)) {
    return [allEntry, ...staffEntries.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.nameRomaji && s.nameRomaji.toLowerCase().includes(q))
    )];
  }
  return staffEntries.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.email.toLowerCase().includes(q) ||
    (s.nameRomaji && s.nameRomaji.toLowerCase().includes(q))
  );
});

const onCommentInput = () => {
  const ta = commentTextarea.value;
  if (!ta) return;
  // テキストエリア自動拡張
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight + 'px';
  const pos = ta.selectionStart;
  const text = newComment.value.slice(0, pos);
  const atMatch = text.match(/@([^@]*)$/);
  if (atMatch) {
    const query = atMatch[1] ?? '';
    // 確定済みメンションチェック: @名前 の後にスペースがあれば確定済み
    const isConfirmed = query.startsWith('all ') ||
      mentionStaffList.value.some(s => query.startsWith(s.name + ' '));
    if (isConfirmed) {
      showMentionPopup.value = false;
      return;
    }
    showMentionPopup.value = true;
    mentionQuery.value = query;
    mentionStart.value = pos - atMatch[0].length;
    mentionIndex.value = 0;
  } else {
    showMentionPopup.value = false;
  }
};

const onMentionKeydown = (e: KeyboardEvent) => {
  if (!showMentionPopup.value) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    mentionIndex.value = Math.min(mentionIndex.value + 1, mentionCandidates.value.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    mentionIndex.value = Math.max(mentionIndex.value - 1, 0);
  } else if (e.key === 'Enter' && !e.ctrlKey) {
    e.preventDefault();
    const candidate = mentionCandidates.value[mentionIndex.value];
    if (candidate) selectMention(candidate);
  } else if (e.key === 'Escape') {
    showMentionPopup.value = false;
  }
};

const selectMention = (staff: Staff) => {
  if (!commentTextarea.value) return;
  const insertName = staff.uuid === '__all__' ? 'all' : staff.name;
  const before = newComment.value.slice(0, mentionStart.value);
  const after = newComment.value.slice(commentTextarea.value?.selectionStart ?? mentionStart.value);
  newComment.value = `${before}@${insertName} ${after}`;
  showMentionPopup.value = false;
  nextTick(() => {
    const pos = mentionStart.value + insertName.length + 2;
    commentTextarea.value?.setSelectionRange(pos, pos);
    commentTextarea.value?.focus();
  });
};

const saveClient = async () => {
  if (!form.threeCode) {
    await modal.notify({ title: '3コードは必須です', message: '大文字アルファベット3文字を入力してください', variant: 'warning' });
    return;
  }
  if (!form.companyName && !form.repName) {
    await modal.notify({ title: '会社名または代表者名のどちらかを入力してください', variant: 'warning' });
    return;
  }
  if (form.threeCode) {
    const dup = clients.value.find(c => c.threeCode === form.threeCode && c.clientId !== clientId.value);
    if (dup) {
      await modal.notify({ title: '3コードが重複しています', message: `「${dup.companyName}（${dup.clientId}）」で既に使用`, variant: 'warning' });
      return;
    }
  }
  const { contactType, contactValue, ...fields } = form;

  if (isNew.value) {
    // 新規: サーバーがIDを発番して返す
    const data = { ...fields, staffId: staffId.value || null, sharedEmail: sharedEmail.value, sharedChatUrl: sharedChatUrl.value, contact: { type: contactType, value: contactValue } };
    try {
      const saved = await addClient(data as any);
      createDriveFolderForClient(saved).catch(e => console.error('[clients] Driveフォルダ作成失敗:', e));
      await modal.notify({ title: `「${saved.companyName}」を追加しました`, message: '勘定科目マスタと税区分マスタが自動コピーされました。', variant: 'success' });
      router.push(`/master/clients/${saved.clientId}`);
    } catch (err) {
      await modal.notify({ title: '顧問先の追加に失敗しました', message: String(err), variant: 'warning' });
    }
  } else {
    // 既存更新
    const id = clientId.value!;
    const data: Client = { ...fields, clientId: id, staffId: staffId.value || null, sharedEmail: sharedEmail.value, sharedChatUrl: sharedChatUrl.value, contact: { type: contactType, value: contactValue } };
    try {
      const old = clients.value.find(c => c.clientId === id);
      await updateClientLocal(id, data);
      if (old && old.threeCode !== data.threeCode) {
        const renamed = await renameDriveFolderForClient(data);
        if (renamed) await modal.notify({ title: `Googleドライブ名を「${renamed}」に変更`, variant: 'success' });
      }
      await modal.notify({ title: `「${data.companyName}」を更新しました`, variant: 'success' });
      isEditing.value = false;
      isCopyNew.value = false;
      originalSnapshot = takeSnapshot();
    } catch (err) {
      await modal.notify({ title: '顧問先の更新に失敗しました', message: String(err), variant: 'warning' });
    }
  }
};


/** Driveフォルダ自動作成 */
const createDriveFolderForClient = async (client: Client) => {
  const folderName = `${client.threeCode}_${client.companyName}`;
  try {
    const folderId = await createFolder(folderName, client.sharedEmail || undefined);
    updateSharedFolderId(client.clientId, folderId);
  } catch (e) { console.error(`[clients] Driveフォルダ作成失敗:`, e); }
};

/** Driveフォルダリネーム */
const renameDriveFolderForClient = async (client: Client): Promise<string | null> => {
  if (!client.sharedFolderId) return null;
  const newName = `${client.threeCode}_${client.companyName}`;
  try {
    return await renameFolder(client.sharedFolderId, newName);
  } catch (e) { console.error(`[clients] Driveフォルダリネーム失敗:`, e); return null; }
};
</script>

<style scoped>
/* ページ全体 */
.ce-page { height: 100%; display: flex; flex-direction: column; background: #fff; font-family: 'Meiryo', 'Noto Sans JP', sans-serif; font-size: 13px; }

/* ヘッダー1行目: 顧問先管理タイトル */
.ce-header-top { padding: 12px 24px; background: #0284c7; }
.ce-page-label { font-size: 18px; font-weight: 700; color: #fff; letter-spacing: 0.5px; }

/* ヘッダー2行目 */
.ce-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background: #fff; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; }
.ce-header-left { display: flex; align-items: center; gap: 16px; }
.ce-header-right { display: flex; align-items: center; gap: 8px; }
.ce-back-btn { background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 4px; padding: 6px 10px; border-radius: 6px; transition: background 0.15s; }
.ce-back-btn:hover { background: #eff6ff; }
.ce-title { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
.ce-client-id { font-size: 12px; color: #94a3b8; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }

/* ボタン */
.ce-btn { border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.ce-btn-save { background: #3b82f6; color: #fff; }
.ce-btn-save:hover { background: #2563eb; }
.ce-btn-cancel { background: #f1f5f9; color: #475569; }
.ce-btn-cancel:hover { background: #e2e8f0; }
.ce-btn-back { background: none; border: 1px solid #d1d5db; color: #475569; display: flex; align-items: center; gap: 6px; }
.ce-btn-back:hover { background: #f1f5f9; color: #1e293b; }

/* 閲覧モード用テキスト表示（薄灰色背景の枠付きボックス） */
.ce-readonly { font-size: 13px; color: #333; padding: 6px 8px; min-height: 18px; line-height: 1.4; background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 3px; }
.ce-readonly.ce-muted { color: #999; font-size: 12px; background: #fafafa; }
.ce-readonly.ce-code { font-family: 'Consolas', 'Monaco', monospace; font-weight: 700; font-size: 13px; color: #0284c7; letter-spacing: 1px; }
.ce-btn-warn { background: #fef3c7; color: #92400e; }
.ce-btn-warn:hover { background: #fde68a; }
.ce-btn-danger { background: #fee2e2; color: #991b1b; }
.ce-btn-danger:hover { background: #fecaca; }
.ce-btn-restore { background: #dcfce7; color: #166534; }
.ce-btn-restore:hover { background: #bbf7d0; }

/* ボディ */
.ce-body { flex: 1; overflow-y: auto; padding: 0 16px 16px; display: flex; gap: 16px; }
.ce-main { flex: 1; min-width: 0; overflow-y: auto; }

/* セクション（kintone風: フラット、カードなし） */
.ce-section { background: none; border-radius: 0; padding: 0; margin-bottom: 8px; box-shadow: none; }
.ce-section-title { font-size: 14px; font-weight: 700; color: #fff; margin: 0 0 12px; padding: 6px 12px; border-bottom: none; background: #4a8dc9; border-radius: 0; }

/* グリッド */
.ce-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; }
.ce-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 12px; }
.ce-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px 12px; }
.ce-grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px 12px; }
.ce-field-wide { grid-column: span 2; }

/* フィールド */
.ce-field { display: flex; flex-direction: column; gap: 2px; }
.ce-field label { font-size: 11px; font-weight: 700; color: #333; }
.ce-input { border: 1px solid #ccc; border-radius: 3px; padding: 6px 8px; font-size: 13px; transition: border-color 0.15s; background: #fff; }
.ce-input:focus { border-color: #4a8dc9; outline: none; box-shadow: 0 0 0 2px rgba(74,141,201,0.15); }
.ce-input:disabled { background: #f5f5f5; color: #999; }
.ce-select { border: 1px solid #ccc; border-radius: 3px; padding: 6px 8px; font-size: 13px; background: #fff; }
.ce-w-sm { max-width: 160px; }
.ce-hint { font-size: 10px; color: #999; font-weight: 400; }
.ce-required { color: #e74c3c; font-weight: 700; font-size: 13px; }

/* ラジオ/チェックボックス */
.ce-radio-group { display: flex; gap: 16px; align-items: center; }
.ce-radio-group label { display: flex; align-items: center; gap: 4px; font-size: 13px; cursor: pointer; }
.ce-checkbox { display: flex; align-items: center; gap: 6px; cursor: pointer; }

/* 日付グループ */
.ce-date-group { display: flex; align-items: center; gap: 8px; }

/* 金額 */
.ce-amount { display: flex; align-items: center; gap: 8px; }
.ce-amount span { font-size: 13px; color: #475569; }
.ce-computed { background: #f8fafc; padding: 12px; border-radius: 8px; }
.ce-computed-val { font-size: 16px; font-weight: 700; color: #1e293b; }

/* 通知 */
.ce-notice { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #1e40af; display: flex; align-items: center; gap: 8px; }

/* アクションアイコン */
.ce-action-icons { display: flex; gap: 4px; margin-left: 8px; }
.ce-icon-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid #d1d5db; background: #fff; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; transition: all 0.15s; }
.ce-icon-btn:hover { background: #f1f5f9; color: #3b82f6; border-color: #3b82f6; }
.ce-icon-active { background: #3b82f6; color: #fff; border-color: #3b82f6; }
.ce-icon-active:hover { background: #2563eb; }

/* コメントパネル */
.ce-comment-panel { width: 320px; flex-shrink: 0; background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); display: flex; flex-direction: column; max-height: calc(100vh - 100px); }
.ce-comment-title { font-size: 14px; font-weight: 700; color: #1e293b; margin: 0; padding: 16px 16px 12px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 8px; }
.ce-comment-input-area { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
.ce-comment-input { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 40px 8px 12px; font-size: 13px; resize: none; font-family: inherit; overflow: hidden; min-height: 36px; box-sizing: border-box; field-sizing: content; }
.ce-comment-input:focus { border-color: #3b82f6; outline: none; }
.ce-comment-submit { position: absolute; right: 8px; bottom: 6px; width: 28px; height: 28px; border-radius: 50%; border: none; background: #3b82f6; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px; transition: background 0.15s; flex-shrink: 0; }
.ce-comment-submit:hover { background: #2563eb; }
.ce-comment-submit:disabled { background: #cbd5e1; cursor: not-allowed; }
.ce-comment-list { flex: 1; overflow-y: auto; padding: 8px 0; }
.ce-comment-empty { padding: 24px 16px; text-align: center; color: #94a3b8; font-size: 13px; }
.ce-comment-item { padding: 10px 16px; border-bottom: 1px solid #f8fafc; }
.ce-comment-item:hover { background: #f8fafc; }
.ce-comment-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.ce-comment-author { font-size: 12px; font-weight: 600; color: #1e293b; }
.ce-comment-date { font-size: 10px; color: #94a3b8; }
.ce-comment-delete { background: none; border: none; color: #cbd5e1; cursor: pointer; font-size: 11px; margin-left: auto; padding: 2px; }
.ce-comment-delete:hover { color: #ef4444; }
.ce-comment-body { font-size: 13px; color: #475569; margin: 0; white-space: pre-wrap; line-height: 1.5; }

/* メンション */
.ce-mention-wrapper { position: relative; }
.ce-mention-popup { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); max-height: 360px; overflow-y: auto; z-index: 10; margin: 0 0 4px 0; }
.ce-mention-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 14px; border: none; background: none; text-align: left; font-size: 13px; cursor: pointer; color: #1e293b; transition: background 0.1s; border-bottom: 1px solid #f8fafc; }
.ce-mention-item:last-child { border-bottom: none; }
.ce-mention-item:hover, .ce-mention-item.active { background: #eff6ff; color: #1d4ed8; }
.ce-mention-name { font-weight: 600; }
.ce-mention-romaji { font-size: 12px; color: #64748b; font-style: italic; }
.ce-mention-item.inactive { opacity: 0.5; }
.ce-mention-badge-inactive { font-size: 10px; color: #ef4444; background: #fee2e2; padding: 1px 6px; border-radius: 8px; margin-left: auto; }
.ce-mention-item.mention-all { background: #eff6ff; border-bottom: 2px solid #dbeafe; }
.ce-mention-item.mention-all .ce-mention-name { color: #2563eb; }
.ce-mention-all-icon { font-size: 16px; }
.ce-mention-empty { padding: 12px; text-align: center; color: #94a3b8; font-size: 12px; }
.ce-comment-body :deep(.ce-mention-tag) { color: #2563eb; font-weight: 600; background: #eff6ff; padding: 0 4px; border-radius: 3px; }
.ce-comment-body :deep(.ce-comment-link) { color: #2563eb; text-decoration: underline; word-break: break-all; }
.ce-comment-body :deep(.ce-comment-link:hover) { color: #1d4ed8; }

/* Kintone拡張スタイル */
.ce-sub-title { font-size: 13px; font-weight: 700; color: #fff; margin: 12px 0 8px; padding: 4px 10px; background: #7fb0d4; border-radius: 0; border-bottom: none; }
.ce-warn-text { color: #ef4444; font-size: 10px; font-weight: 400; }
.ce-grid-full { display: grid; grid-template-columns: 1fr; gap: 16px; }
.ce-textarea { resize: vertical; min-height: 60px; font-family: inherit; }
.ce-pre-wrap { white-space: pre-wrap; }
.ce-url-row { display: flex; align-items: center; gap: 6px; }
.ce-url-text { font-size: 12px; color: #64748b; word-break: break-all; }
.ce-copy-btn { background: none; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; cursor: pointer; color: #64748b; font-size: 12px; transition: all 0.15s; }
.ce-copy-btn:hover { background: #eff6ff; color: #3b82f6; border-color: #3b82f6; }
.ce-link-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #eff6ff; color: #2563eb; border-radius: 6px; font-size: 13px; text-decoration: none; transition: background 0.15s; }
.ce-link-btn:hover { background: #dbeafe; }
.ce-status-active { color: #16a34a; font-weight: 600; }
.ce-status-suspension { color: #d97706; font-weight: 600; }
.ce-status-inactive { color: #dc2626; font-weight: 600; }
</style>
