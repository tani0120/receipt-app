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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// フラットフィールド定義（セクション廃止後の統合レイアウト用）
// heading/spacer/contactTable を含む全フィールドをグローバルorder順で定義
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const clientFieldsFlat: FieldDef[] = [
  // ── 基本情報 ──
  { key: 'heading_basic', label: '基本情報', section: '', component: 'heading', widthPercent: 100, order: 1, headingSize: 14, headingBg: '#4a8dc9' },
  { key: 'status', label: '契約状況', section: '', component: 'select', widthPercent: 20, order: 2, cssClass: 'ce-status', options: 'STATUS_OPTIONS' },
  { key: 'type', label: '区分', section: '', component: 'select', widthPercent: 20, order: 3, options: 'TYPE_OPTIONS' },
  { key: 'engagementStartDate', label: '関与開始日', section: '', component: 'date', widthPercent: 20, order: 4, smallWidth: true },
  { key: 'engagementEndDate', label: '関与終了日', section: '', component: 'date', widthPercent: 20, order: 5, smallWidth: true },
  { key: 'staffId', label: '担当者', section: '', component: 'staffSelect', widthPercent: 20, order: 6, modelKey: 'staffId' },
  { key: 'subStaffId', label: '副担当（記帳担当）', section: '', component: 'staffSelect', widthPercent: 20, order: 7 },
  { key: 'payrollStaffId', label: '給与社保担当', section: '', component: 'staffSelect', widthPercent: 20, order: 8 },
  { key: 'progressLink', label: '進捗管理', section: '', component: 'link', widthPercent: 20, order: 9 },
  { key: 'clientId', label: '内部ID', section: '', component: 'readonly', widthPercent: 20, order: 10, alwaysReadonly: true, cssClass: 'ce-muted' },
  { key: 'threeCode', label: '3コード', section: '', component: 'text', widthPercent: 20, order: 11, required: true, maxLength: 3, placeholder: 'ABC', smallWidth: true, cssClass: 'ce-code' },
  { key: 'companyName', label: '会社名', section: '', component: 'text', widthPercent: 20, order: 12, placeholder: '株式会社サンプル' },
  { key: 'companyNameKana', label: '会社名（カナ）', section: '', component: 'text', widthPercent: 20, order: 13, placeholder: 'カブシキガイシャサンプル' },
  { key: 'corporateNumber', label: '法人番号', section: '', component: 'text', widthPercent: 20, order: 14, maxLength: 13, placeholder: '13桁', smallWidth: true, warnText: '※マイナンバーは入れない' },
  { key: 'repTitle', label: '代表肩書', section: '', component: 'text', widthPercent: 20, order: 15, placeholder: '代表取締役' },
  { key: 'repName', label: '代表者名', section: '', component: 'text', widthPercent: 20, order: 16, placeholder: '山田 太郎' },
  { key: 'repNameKana', label: '代表者名（カナ）', section: '', component: 'text', widthPercent: 20, order: 17, placeholder: 'ヤマダ タロウ' },

  // ── ニーズ管理 ──
  { key: 'heading_needs', label: 'ニーズ管理', section: '', component: 'heading', widthPercent: 100, order: 20, headingSize: 13, headingBg: '#7fb0d4' },
  { key: 'needsInsurance', label: '保険ニーズ', section: '', component: 'select', widthPercent: 20, order: 21, options: 'NEEDS_OPTIONS' },
  { key: 'needsTaxSaving', label: '節税ニーズ', section: '', component: 'select', widthPercent: 20, order: 22, options: 'NEEDS_OPTIONS' },
  { key: 'needsSubsidy', label: '補助金ニーズ', section: '', component: 'select', widthPercent: 20, order: 23, options: 'NEEDS_OPTIONS' },
  { key: 'needsLoan', label: '借入ニーズ', section: '', component: 'select', widthPercent: 20, order: 24, options: 'NEEDS_OPTIONS' },
  { key: 'needsRealEstate', label: '不動産ニーズ', section: '', component: 'select', widthPercent: 20, order: 25, options: 'NEEDS_OPTIONS' },

  // ── 決算・税務 ──
  { key: 'heading_fiscal', label: '決算・税務', section: '', component: 'heading', widthPercent: 100, order: 30, headingSize: 13, headingBg: '#7fb0d4' },
  { key: 'fiscalDate', label: '決算日', section: '', component: 'dateGroup', widthPercent: 20, order: 31 },
  { key: 'consumptionTaxInterim', label: '消費税中間申告', section: '', component: 'select', widthPercent: 20, order: 32, options: 'CONSUMPTION_TAX_INTERIM_OPTIONS' },
  { key: 'isInvoiceRegistered', label: 'インボイス登録', section: '', component: 'checkbox', widthPercent: 20, order: 33 },
  { key: 'invoiceRegistrationNumber', label: '登録番号', section: '', component: 'text', widthPercent: 20, order: 34, placeholder: 'T1234567890123', visibleWhen: { field: 'isInvoiceRegistered', value: true } },
  { key: 'establishedDate', label: '設立日', section: '', component: 'text', widthPercent: 20, order: 35, placeholder: 'YYYYMMDD', maxLength: 8, smallWidth: true },

  // ── 備考・URL・その他 ──
  { key: 'heading_memo', label: '備考・URL・その他', section: '', component: 'heading', widthPercent: 100, order: 40, headingSize: 13, headingBg: '#7fb0d4' },
  { key: 'memo', label: '備考', section: '', component: 'textarea', widthPercent: 60, order: 41, placeholder: 'メモ' },
  { key: 'websiteUrl', label: 'WebサイトURL', section: '', component: 'url', widthPercent: 20, order: 42, placeholder: 'https://example.com' },
  { key: 'sharedEmail', label: '顧問先ログインメール（自動取得）', section: '', component: 'readonly', widthPercent: 20, order: 43, alwaysReadonly: true, hint: '※編集不可' },
  { key: 'uploadUrlStaff', label: '社内用アップロードURL（自動）', section: '', component: 'urlCopy', widthPercent: 20, order: 44, alwaysReadonly: true },
  { key: 'uploadUrlGuest', label: '顧問先用アップロードURL（自動）', section: '', component: 'urlCopy', widthPercent: 20, order: 45, alwaysReadonly: true },
  { key: 'annualRevenue', label: '売上高', section: '', component: 'text', widthPercent: 20, order: 46, placeholder: '1億円以上' },
  { key: 'employeeCount', label: '総従業員数', section: '', component: 'number', widthPercent: 20, order: 47, smallWidth: true, min: 0 },
  { key: 'industry', label: '業種', section: '', component: 'select', widthPercent: 20, order: 48, options: 'INDUSTRY_OPTIONS' },
  { key: 'parentCompany', label: '親号先/グループ会社', section: '', component: 'text', widthPercent: 20, order: 49 },
  { key: 'businessDescription', label: '事業内容', section: '', component: 'textarea', widthPercent: 60, order: 50, placeholder: '事業内容の詳細' },

  // ── スペーサー ──
  { key: 'spacer_1', label: '', section: '', component: 'spacer', widthPercent: 100, order: 55, spacerHeight: 20 },

  // ── 連絡先 ──
  { key: 'heading_contact', label: '連絡先', section: '', component: 'heading', widthPercent: 100, order: 60, headingSize: 14, headingBg: '#4a8dc9' },
  { key: 'contactTable', label: '連絡先テーブル', section: '', component: 'contactTable', widthPercent: 100, order: 61 },

  // ── スペーサー ──
  { key: 'spacer_2', label: '', section: '', component: 'spacer', widthPercent: 100, order: 65, spacerHeight: 20 },

  // ── 会計設定 ──
  { key: 'heading_accounting', label: '会計設定', section: '', component: 'heading', widthPercent: 100, order: 70, headingSize: 14, headingBg: '#4a8dc9' },
  { key: 'accountingSoftware', label: '会計ソフト', section: '', component: 'select', widthPercent: 20, order: 71, options: 'ACCOUNTING_SOFTWARE_OPTIONS' },
  { key: 'taxFilingType', label: '確定申告', section: '', component: 'select', widthPercent: 20, order: 72, options: 'TAX_FILING_OPTIONS' },
  { key: 'consumptionTaxMode', label: '課税方式', section: '', component: 'select', widthPercent: 20, order: 73, options: 'TAX_MODE_OPTIONS' },
  { key: 'simplifiedTaxCategory', label: '事業区分', section: '', component: 'select', widthPercent: 20, order: 74, options: 'SIMPLIFIED_CATEGORY_OPTIONS', visibleWhen: { field: 'consumptionTaxMode', value: 'simplified' } },
  { key: 'taxMethod', label: '税込/税抜', section: '', component: 'select', widthPercent: 20, order: 75, options: 'TAX_METHOD_OPTIONS' },
  { key: 'calculationMethod', label: '経理方式', section: '', component: 'select', widthPercent: 20, order: 76, options: 'CALCULATION_METHOD_OPTIONS' },
  { key: 'defaultPaymentMethod', label: 'デフォルト支払方法', section: '', component: 'select', widthPercent: 20, order: 77, options: 'DEFAULT_PAYMENT_OPTIONS' },
  { key: 'hasDepartmentManagement', label: '部門管理', section: '', component: 'checkbox', widthPercent: 20, order: 78 },
  { key: 'hasRentalIncome', label: '不動産所得', section: '', component: 'checkbox', widthPercent: 20, order: 79, hint: '有効にすると不動産関連15科目が選択可能になります', visibleWhen: { field: 'type', value: ['individual', 'sole_proprietor'] } },

  // ── スペーサー ──
  { key: 'spacer_3', label: '', section: '', component: 'spacer', widthPercent: 100, order: 85, spacerHeight: 20 },

  // ── システム導入状況 ──
  { key: 'heading_system', label: 'システム導入状況', section: '', component: 'heading', widthPercent: 100, order: 90, headingSize: 14, headingBg: '#4a8dc9' },
  { key: 'accountingSoftwareDisplay', label: '会計ソフト', section: '', component: 'readonly', widthPercent: 20, order: 91, alwaysReadonly: true },
  { key: 'accountingSoftwareMemo', label: '会計ソフト備考', section: '', component: 'text', widthPercent: 20, order: 92 },
  { key: 'payrollSoftware', label: '給与計算ソフト', section: '', component: 'text', widthPercent: 20, order: 93 },
  { key: 'payrollSoftwareMemo', label: '給与計算備考', section: '', component: 'text', widthPercent: 20, order: 94 },
  { key: 'attendanceSystem', label: '勤怠管理システム', section: '', component: 'text', widthPercent: 20, order: 95 },
  { key: 'attendanceSystemMemo', label: '勤怠管理備考', section: '', component: 'text', widthPercent: 20, order: 96 },
  { key: 'otherSystem', label: 'その他システム', section: '', component: 'text', widthPercent: 20, order: 97 },
  { key: 'otherSystemMemo', label: 'その他システム備考', section: '', component: 'text', widthPercent: 20, order: 98 },

  // ── スペーサー ──
  { key: 'spacer_4', label: '', section: '', component: 'spacer', widthPercent: 100, order: 105, spacerHeight: 20 },

  // ── 報酬情報 ──
  { key: 'heading_fee', label: '報酬情報', section: '', component: 'heading', widthPercent: 100, order: 110, headingSize: 14, headingBg: '#4a8dc9' },
  { key: 'contractScope', label: '契約内容', section: '', component: 'select', widthPercent: 20, order: 111, options: 'CONTRACT_SCOPE_OPTIONS' },
  { key: 'bookkeepingType', label: '記帳代行・自計化', section: '', component: 'select', widthPercent: 20, order: 112, options: 'BOOKKEEPING_TYPE_OPTIONS' },
  { key: 'hasSocialInsuranceContract', label: '社労士契約', section: '', component: 'select', widthPercent: 20, order: 113, options: 'YES_NO_OPTIONS' },
  { key: 'hasPayrollService', label: '給与', section: '', component: 'select', widthPercent: 20, order: 114, options: 'YES_NO_OPTIONS' },
  { key: 'hasAccountingService', label: '経理代行', section: '', component: 'select', widthPercent: 20, order: 115, options: 'YES_NO_OPTIONS' },

  // ── 報酬金額 ──
  { key: 'heading_fee_amount', label: '報酬金額', section: '', component: 'heading', widthPercent: 100, order: 120, headingSize: 13, headingBg: '#7fb0d4' },
  { key: 'advisoryFee', label: '月額顧問報酬', section: '', component: 'amount', widthPercent: 20, order: 121, min: 0 },
  { key: 'bookkeepingFee', label: '記帳代行報酬', section: '', component: 'amount', widthPercent: 20, order: 122, min: 0 },
  { key: 'socialInsuranceFee', label: '社労士報酬', section: '', component: 'amount', widthPercent: 20, order: 123, min: 0 },
  { key: 'payrollFee', label: '給与報酬', section: '', component: 'amount', widthPercent: 20, order: 124, min: 0 },
  { key: 'accountingServiceFee', label: '経理代行報酬', section: '', component: 'amount', widthPercent: 20, order: 125, min: 0 },
  { key: 'systemFee', label: 'システム報酬', section: '', component: 'amount', widthPercent: 20, order: 126, min: 0 },
  { key: 'monthlyTotal', label: '月次合計（自動算出）', section: '', component: 'computed', widthPercent: 20, order: 127 },
  { key: 'settlementFee', label: '決算報酬', section: '', component: 'amount', widthPercent: 20, order: 128, min: 0 },
  { key: 'taxFilingFee', label: '消費税申告報酬', section: '', component: 'amount', widthPercent: 20, order: 129, min: 0 },
  { key: 'annualTotal', label: '年間総報酬（自動算出）', section: '', component: 'computed', widthPercent: 20, order: 130 },

  // ── 契約・引き落とし ──
  { key: 'heading_payment', label: '契約・引き落とし', section: '', component: 'heading', widthPercent: 100, order: 135, headingSize: 13, headingBg: '#7fb0d4' },
  { key: 'contractDocUrl', label: '契約書リンク', section: '', component: 'url', widthPercent: 20, order: 136, placeholder: 'https://...' },
  { key: 'paymentMethod', label: '引き落とし方法', section: '', component: 'select', widthPercent: 20, order: 137, options: 'PAYMENT_METHOD_OPTIONS' },
  { key: 'paymentDay', label: '引き落とし日', section: '', component: 'select', widthPercent: 20, order: 138, options: 'PAYMENT_DAY_OPTIONS' },
  { key: 'feeNotes', label: '報酬備考', section: '', component: 'textarea', widthPercent: 60, order: 139, placeholder: '報酬に関するメモ' },
];
