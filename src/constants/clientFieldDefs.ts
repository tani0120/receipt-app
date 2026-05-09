/**
 * 顧問先編集画面のフィールド定義
 * テンプレートのHTML直書きから抽出したデータ駆動型定義
 */
import type { FieldDef, SectionDef } from '@/types/fieldLayout';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// セクション名キー定数（ClientEditPage / useFieldLayout で参照）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const SEC_BASIC    = '基本情報' as const;
export const SEC_CONTACT  = '連絡先' as const;
export const SEC_ACCOUNTING = '会計設定' as const;
export const SEC_SYSTEM   = 'システム導入' as const;
export const SEC_FEE      = '報酬情報' as const;

// サブセクション名キー定数
export const SUB_NEEDS    = 'ニーズ管理' as const;
export const SUB_FISCAL   = '決算税務' as const;
export const SUB_MEMO_URL = '備考URL' as const;
export const SUB_FEE_AMT  = '報酬金額' as const;
export const SUB_PAYMENT  = '契約引落' as const;

/** セクション定義 */
export const clientSections: SectionDef[] = [
  {
    key: '基本情報',
    title: '基本情報',
    defaultCols: 5,
    subSections: [
      { key: 'ニーズ管理', title: 'ニーズ管理', defaultCols: 5 },
      { key: '決算税務', title: '決算・税務', defaultCols: 4 },
      { key: '備考URL', title: '備考・URL・その他', defaultCols: 3 },
    ],
  },
  { key: '連絡先', title: '連絡先', defaultCols: 3 },
  { key: '会計設定', title: '会計設定', defaultCols: 3 },
  { key: 'システム導入', title: 'システム導入状況', defaultCols: 3 },
  {
    key: '報酬情報',
    title: '報酬情報',
    defaultCols: 3,
    subSections: [
      { key: '報酬金額', title: '報酬金額', defaultCols: 4 },
      { key: '契約引落', title: '契約・引き落とし', defaultCols: 3 },
    ],
  },
];

/** 全フィールド定義 */
export const clientFields: FieldDef[] = [
  // ── 基本情報 ──
  { key: 'status', label: '契約状況', section: '基本情報', component: 'readonly', widthPercent: 20, order: 1, cssClass: 'ce-status' },
  { key: 'type', label: '区分', section: '基本情報', component: 'select', widthPercent: 20, order: 2, options: 'TYPE_OPTIONS' },
  { key: 'engagementStartDate', label: '関与開始日', section: '基本情報', component: 'date', widthPercent: 20, order: 3, smallWidth: true },
  { key: 'engagementEndDate', label: '関与終了日', section: '基本情報', component: 'date', widthPercent: 20, order: 4, smallWidth: true },
  { key: 'staffId', label: '担当者', section: '基本情報', component: 'staffSelect', widthPercent: 20, order: 5, modelKey: 'staffId' },
  { key: 'subStaffId', label: '副担当（記帳担当）', section: '基本情報', component: 'staffSelect', widthPercent: 20, order: 6 },
  { key: 'payrollStaffId', label: '給与社保担当', section: '基本情報', component: 'staffSelect', widthPercent: 20, order: 7 },
  { key: 'progressLink', label: '進捗管理', section: '基本情報', component: 'link', widthPercent: 20, order: 8 },
  { key: 'clientId', label: '内部ID', section: '基本情報', component: 'readonly', widthPercent: 20, order: 9, alwaysReadonly: true, cssClass: 'ce-muted' },
  { key: 'threeCode', label: '3コード', section: '基本情報', component: 'text', widthPercent: 20, order: 10, required: true, maxLength: 3, placeholder: 'ABC', smallWidth: true, cssClass: 'ce-code' },
  { key: 'companyName', label: '会社名', section: '基本情報', component: 'text', widthPercent: 20, order: 11, placeholder: '株式会社サンプル' },
  { key: 'companyNameKana', label: '会社名（カナ）', section: '基本情報', component: 'text', widthPercent: 20, order: 12, placeholder: 'カブシキガイシャサンプル' },
  { key: 'corporateNumber', label: '法人番号', section: '基本情報', component: 'text', widthPercent: 20, order: 13, maxLength: 13, placeholder: '13桁', smallWidth: true, warnText: '※マイナンバーは入れない' },
  { key: 'repTitle', label: '代表肩書', section: '基本情報', component: 'text', widthPercent: 20, order: 14, placeholder: '代表取締役' },
  { key: 'repName', label: '代表者名', section: '基本情報', component: 'text', widthPercent: 20, order: 15, placeholder: '山田 太郎' },
  { key: 'repNameKana', label: '代表者名（カナ）', section: '基本情報', component: 'text', widthPercent: 20, order: 16, placeholder: 'ヤマダ タロウ' },

  // ── ニーズ管理 ──
  { key: 'needsInsurance', label: '保険ニーズ', section: '基本情報', subSection: 'ニーズ管理', component: 'select', widthPercent: 20, order: 1, options: 'NEEDS_OPTIONS' },
  { key: 'needsTaxSaving', label: '節税ニーズ', section: '基本情報', subSection: 'ニーズ管理', component: 'select', widthPercent: 20, order: 2, options: 'NEEDS_OPTIONS' },
  { key: 'needsSubsidy', label: '補助金ニーズ', section: '基本情報', subSection: 'ニーズ管理', component: 'select', widthPercent: 20, order: 3, options: 'NEEDS_OPTIONS' },
  { key: 'needsLoan', label: '借入ニーズ', section: '基本情報', subSection: 'ニーズ管理', component: 'select', widthPercent: 20, order: 4, options: 'NEEDS_OPTIONS' },
  { key: 'needsRealEstate', label: '不動産ニーズ', section: '基本情報', subSection: 'ニーズ管理', component: 'select', widthPercent: 20, order: 5, options: 'NEEDS_OPTIONS' },

  // ── 決算・税務 ──
  { key: 'fiscalDate', label: '決算日', section: '基本情報', subSection: '決算税務', component: 'dateGroup', widthPercent: 20, order: 1 },
  { key: 'consumptionTaxInterim', label: '消費税中間申告', section: '基本情報', subSection: '決算税務', component: 'select', widthPercent: 20, order: 2, options: 'CONSUMPTION_TAX_INTERIM_OPTIONS' },
  { key: 'isInvoiceRegistered', label: 'インボイス登録', section: '基本情報', subSection: '決算税務', component: 'checkbox', widthPercent: 20, order: 3 },
  { key: 'invoiceRegistrationNumber', label: '登録番号', section: '基本情報', subSection: '決算税務', component: 'text', widthPercent: 20, order: 4, placeholder: 'T1234567890123', visibleWhen: { field: 'isInvoiceRegistered', value: true } },
  { key: 'establishedDate', label: '設立日', section: '基本情報', subSection: '決算税務', component: 'text', widthPercent: 20, order: 5, placeholder: 'YYYYMMDD', maxLength: 8, smallWidth: true },

  // ── 備考・URL・その他 ──
  { key: 'memo', label: '備考', section: '基本情報', subSection: '備考URL', component: 'textarea', widthPercent: 60, order: 1, placeholder: 'メモ' },
  { key: 'websiteUrl', label: 'WebサイトURL', section: '基本情報', subSection: '備考URL', component: 'url', widthPercent: 20, order: 2, placeholder: 'https://example.com' },
  { key: 'sharedEmail', label: '顧問先ログインメール（自動取得）', section: '基本情報', subSection: '備考URL', component: 'readonly', widthPercent: 20, order: 3, alwaysReadonly: true, hint: '※編集不可' },
  { key: 'uploadUrlStaff', label: '社内用アップロードURL（自動）', section: '基本情報', subSection: '備考URL', component: 'urlCopy', widthPercent: 20, order: 4, alwaysReadonly: true },
  { key: 'uploadUrlGuest', label: '顧問先用アップロードURL（自動）', section: '基本情報', subSection: '備考URL', component: 'urlCopy', widthPercent: 20, order: 5, alwaysReadonly: true },
  { key: 'annualRevenue', label: '売上高', section: '基本情報', subSection: '備考URL', component: 'text', widthPercent: 20, order: 6, placeholder: '1億円以上' },
  { key: 'employeeCount', label: '総従業員数', section: '基本情報', subSection: '備考URL', component: 'number', widthPercent: 20, order: 7, smallWidth: true, min: 0 },
  { key: 'industry', label: '業種', section: '基本情報', subSection: '備考URL', component: 'select', widthPercent: 20, order: 8, options: 'INDUSTRY_OPTIONS' },
  { key: 'parentCompany', label: '親号先/グループ会社', section: '基本情報', subSection: '備考URL', component: 'text', widthPercent: 20, order: 9 },
  { key: 'businessDescription', label: '事業内容', section: '基本情報', subSection: '備考URL', component: 'textarea', widthPercent: 60, order: 10, placeholder: '事業内容の詳細' },

  // ── 連絡先 ──
  { key: 'phoneNumber', label: '電話番号', section: '連絡先', component: 'text', widthPercent: 20, order: 1, placeholder: '03-1234-5678' },
  { key: 'email', label: 'メールアドレス', section: '連絡先', component: 'email', widthPercent: 20, order: 2, placeholder: 'example@mail.com' },
  { key: 'chatRoomUrl', label: '社内チャットURL', section: '連絡先', component: 'url', widthPercent: 20, order: 3, placeholder: 'https://www.chatwork.com/#!rid...' },
  { key: 'sharedChatUrl', label: '顧問先共有チャットURL', section: '連絡先', component: 'url', widthPercent: 20, order: 4, placeholder: 'https://www.chatwork.com/#!rid...', modelKey: 'sharedChatUrl' },
  { key: 'contactType', label: '主な連絡手段', section: '連絡先', component: 'select', widthPercent: 20, order: 5, options: 'CONTACT_METHOD_OPTIONS' },
  { key: 'contactValue', label: '連絡先', section: '連絡先', component: 'text', widthPercent: 20, order: 6 },

  // ── 会計設定 ──
  { key: 'accountingSoftware', label: '会計ソフト', section: '会計設定', component: 'select', widthPercent: 20, order: 1, options: 'ACCOUNTING_SOFTWARE_OPTIONS' },
  { key: 'taxFilingType', label: '確定申告', section: '会計設定', component: 'select', widthPercent: 20, order: 2, options: 'TAX_FILING_OPTIONS' },
  { key: 'consumptionTaxMode', label: '課税方式', section: '会計設定', component: 'select', widthPercent: 20, order: 3, options: 'TAX_MODE_OPTIONS' },
  { key: 'simplifiedTaxCategory', label: '事業区分', section: '会計設定', component: 'select', widthPercent: 20, order: 4, options: 'SIMPLIFIED_CATEGORY_OPTIONS', visibleWhen: { field: 'consumptionTaxMode', value: 'simplified' } },
  { key: 'taxMethod', label: '税込/税抜', section: '会計設定', component: 'select', widthPercent: 20, order: 5, options: 'TAX_METHOD_OPTIONS' },
  { key: 'calculationMethod', label: '経理方式', section: '会計設定', component: 'select', widthPercent: 20, order: 6, options: 'CALCULATION_METHOD_OPTIONS' },
  { key: 'defaultPaymentMethod', label: 'デフォルト支払方法', section: '会計設定', component: 'select', widthPercent: 20, order: 7, options: 'DEFAULT_PAYMENT_OPTIONS' },
  { key: 'hasDepartmentManagement', label: '部門管理', section: '会計設定', component: 'checkbox', widthPercent: 20, order: 8 },
  { key: 'hasRentalIncome', label: '不動産所得', section: '会計設定', component: 'checkbox', widthPercent: 20, order: 9, hint: '有効にすると不動産関連15科目が選択可能になります', visibleWhen: { field: 'type', value: ['individual', 'sole_proprietor'] } },

  // ── システム導入状況 ──
  { key: 'accountingSoftwareDisplay', label: '会計ソフト', section: 'システム導入', component: 'readonly', widthPercent: 20, order: 1, alwaysReadonly: true },
  { key: 'accountingSoftwareMemo', label: '会計ソフト備考', section: 'システム導入', component: 'text', widthPercent: 20, order: 2 },
  { key: 'payrollSoftware', label: '給与計算ソフト', section: 'システム導入', component: 'text', widthPercent: 20, order: 3 },
  { key: 'payrollSoftwareMemo', label: '給与計算備考', section: 'システム導入', component: 'text', widthPercent: 20, order: 4 },
  { key: 'attendanceSystem', label: '勤怠管理システム', section: 'システム導入', component: 'text', widthPercent: 20, order: 5 },
  { key: 'attendanceSystemMemo', label: '勤怠管理備考', section: 'システム導入', component: 'text', widthPercent: 20, order: 6 },
  { key: 'otherSystem', label: 'その他システム', section: 'システム導入', component: 'text', widthPercent: 20, order: 7 },
  { key: 'otherSystemMemo', label: 'その他システム備考', section: 'システム導入', component: 'text', widthPercent: 20, order: 8 },

  // ── 報酬情報（契約種別） ──
  { key: 'contractScope', label: '契約内容', section: '報酬情報', component: 'select', widthPercent: 20, order: 1, options: 'CONTRACT_SCOPE_OPTIONS' },
  { key: 'bookkeepingType', label: '記帳代行・自計化', section: '報酬情報', component: 'select', widthPercent: 20, order: 2, options: 'BOOKKEEPING_TYPE_OPTIONS' },
  { key: 'hasSocialInsuranceContract', label: '社労士契約', section: '報酬情報', component: 'select', widthPercent: 20, order: 3, options: 'YES_NO_OPTIONS' },
  { key: 'hasPayrollService', label: '給与', section: '報酬情報', component: 'select', widthPercent: 20, order: 4, options: 'YES_NO_OPTIONS' },
  { key: 'hasAccountingService', label: '経理代行', section: '報酬情報', component: 'select', widthPercent: 20, order: 5, options: 'YES_NO_OPTIONS' },

  // ── 報酬金額 ──
  { key: 'advisoryFee', label: '月額顧問報酬', section: '報酬情報', subSection: '報酬金額', component: 'amount', widthPercent: 20, order: 1, min: 0 },
  { key: 'bookkeepingFee', label: '記帳代行報酬', section: '報酬情報', subSection: '報酬金額', component: 'amount', widthPercent: 20, order: 2, min: 0 },
  { key: 'socialInsuranceFee', label: '社労士報酬', section: '報酬情報', subSection: '報酬金額', component: 'amount', widthPercent: 20, order: 3, min: 0 },
  { key: 'payrollFee', label: '給与報酬', section: '報酬情報', subSection: '報酬金額', component: 'amount', widthPercent: 20, order: 4, min: 0 },
  { key: 'accountingServiceFee', label: '経理代行報酬', section: '報酬情報', subSection: '報酬金額', component: 'amount', widthPercent: 20, order: 5, min: 0 },
  { key: 'systemFee', label: 'システム報酬', section: '報酬情報', subSection: '報酬金額', component: 'amount', widthPercent: 20, order: 6, min: 0 },
  { key: 'monthlyTotal', label: '月次合計（自動算出）', section: '報酬情報', subSection: '報酬金額', component: 'computed', widthPercent: 20, order: 7 },
  { key: 'settlementFee', label: '決算報酬', section: '報酬情報', subSection: '報酬金額', component: 'amount', widthPercent: 20, order: 8, min: 0 },
  { key: 'taxFilingFee', label: '消費税申告報酬', section: '報酬情報', subSection: '報酬金額', component: 'amount', widthPercent: 20, order: 9, min: 0 },
  { key: 'annualTotal', label: '年間総報酬（自動算出）', section: '報酬情報', subSection: '報酬金額', component: 'computed', widthPercent: 20, order: 10 },

  // ── 契約・引き落とし ──
  { key: 'contractDocUrl', label: '契約書リンク', section: '報酬情報', subSection: '契約引落', component: 'url', widthPercent: 20, order: 1, placeholder: 'https://...' },
  { key: 'paymentMethod', label: '引き落とし方法', section: '報酬情報', subSection: '契約引落', component: 'select', widthPercent: 20, order: 2, options: 'PAYMENT_METHOD_OPTIONS' },
  { key: 'paymentDay', label: '引き落とし日', section: '報酬情報', subSection: '契約引落', component: 'select', widthPercent: 20, order: 3, options: 'PAYMENT_DAY_OPTIONS' },
  { key: 'feeNotes', label: '報酬備考', section: '報酬情報', subSection: '契約引落', component: 'textarea', widthPercent: 60, order: 4, placeholder: '報酬に関するメモ' },
];

/**
 * 一覧画面専用の派生列（fieldDefsに存在しない、一覧表示のみで使用する列）
 * LeadListPage / MockMasterClientsPage で共用
 */
export const LIST_ONLY_COLUMNS = [
  { key: 'companyName', label: '会社名/代表者名' },
  { key: 'taxMode', label: '課税方式' },
  { key: 'staffName', label: '担当者' },
  { key: 'fiscalMonth', label: '決算日' },
  { key: 'driveUrl', label: 'Drive取込' },
  { key: 'contact', label: '主な連絡手段' },
] as const;
