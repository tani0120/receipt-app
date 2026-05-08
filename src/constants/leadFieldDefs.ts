/**
 * 見込先編集画面のフィールド定義
 * テンプレートのHTML直書きから抽出したデータ駆動型定義
 */
import type { FieldDef, SectionDef } from '@/types/fieldLayout';

/** セクション定義 */
export const leadSections: SectionDef[] = [
  { key: '基本情報', title: '基本情報', defaultCols: 4 },
  { key: '会計設定', title: '会計設定', defaultCols: 3 },
  { key: '報酬設定', title: '報酬設定', defaultCols: 4 },
];

/** 全フィールド定義 */
export const leadFields: FieldDef[] = [
  // ── 基本情報 ──
  { key: 'type', label: '法人/個人', section: '基本情報', component: 'custom', widthPercent: 20, order: 1 },
  { key: 'leadId', label: '内部ID', section: '基本情報', component: 'readonly', widthPercent: 20, order: 2, alwaysReadonly: true },
  { key: 'threeCode', label: '3コード', section: '基本情報', component: 'text', widthPercent: 20, order: 3, maxLength: 3, placeholder: 'ABC', smallWidth: true, hint: '※大文字3文字' },
  { key: 'companyName', label: '会社名', section: '基本情報', component: 'text', widthPercent: 20, order: 4, placeholder: '株式会社サンプル' },
  { key: 'companyNameKana', label: '会社名（全角カナ）', section: '基本情報', component: 'text', widthPercent: 20, order: 5, placeholder: 'カブシキガイシャサンプル' },
  { key: 'repName', label: '代表者名', section: '基本情報', component: 'text', widthPercent: 20, order: 6, placeholder: '山田 太郎' },
  { key: 'repNameKana', label: '代表者名（全角カナ）', section: '基本情報', component: 'text', widthPercent: 20, order: 7, placeholder: 'ヤマダ タロウ' },
  { key: 'staffId', label: '担当者', section: '基本情報', component: 'staffSelect', widthPercent: 20, order: 8, modelKey: 'staffId' },
  { key: 'phoneNumber', label: '電話番号', section: '基本情報', component: 'text', widthPercent: 20, order: 9, placeholder: '03-1234-5678' },
  { key: 'email', label: 'メールアドレス', section: '基本情報', component: 'email', widthPercent: 20, order: 10, placeholder: 'example@mail.com' },
  { key: 'chatRoomUrl', label: 'チャットルームURL', section: '基本情報', component: 'url', widthPercent: 20, order: 11, placeholder: 'https://www.chatwork.com/#!rid...' },
  { key: 'contactType', label: '主な連絡手段', section: '基本情報', component: 'custom', widthPercent: 20, order: 12 },
  { key: 'contactValue', label: '連絡先', section: '基本情報', component: 'text', widthPercent: 20, order: 13 },
  { key: 'sharedEmail', label: '見込先ログインメール', section: '基本情報', component: 'email', widthPercent: 20, order: 14, placeholder: 'shared@example.com', hint: '※自動取得', modelKey: 'sharedEmail' },
  { key: 'sharedChatUrl', label: '共有用チャットURL', section: '基本情報', component: 'url', widthPercent: 20, order: 15, placeholder: 'https://www.chatwork.com/#!rid...', modelKey: 'sharedChatUrl' },
  { key: 'fiscalDate', label: '決算日', section: '基本情報', component: 'dateGroup', widthPercent: 20, order: 16 },
  { key: 'industry', label: '業種', section: '基本情報', component: 'select', widthPercent: 20, order: 17, options: 'INDUSTRY_OPTIONS' },
  { key: 'establishedDate', label: '設立日', section: '基本情報', component: 'text', widthPercent: 20, order: 18, placeholder: 'YYYYMMDD', maxLength: 8, smallWidth: true },

  // ── 会計設定 ──
  { key: 'accountingSoftware', label: '会計ソフト', section: '会計設定', component: 'select', widthPercent: 20, order: 1, options: 'ACCOUNTING_SOFTWARE_OPTIONS' },
  { key: 'taxFilingType', label: '確定申告', section: '会計設定', component: 'select', widthPercent: 20, order: 2, options: 'TAX_FILING_OPTIONS' },
  { key: 'consumptionTaxMode', label: '課税方式', section: '会計設定', component: 'select', widthPercent: 20, order: 3, options: 'TAX_MODE_OPTIONS' },
  { key: 'simplifiedTaxCategory', label: '事業区分', section: '会計設定', component: 'select', widthPercent: 20, order: 4, options: 'SIMPLIFIED_CATEGORY_OPTIONS', visibleWhen: { field: 'consumptionTaxMode', value: 'simplified' } },
  { key: 'taxMethod', label: '税込/税抜', section: '会計設定', component: 'select', widthPercent: 20, order: 5, options: 'TAX_METHOD_OPTIONS' },
  { key: 'calculationMethod', label: '経理方式', section: '会計設定', component: 'select', widthPercent: 20, order: 6, options: 'CALCULATION_METHOD_OPTIONS' },
  { key: 'defaultPaymentMethod', label: 'デフォルト支払方法', section: '会計設定', component: 'select', widthPercent: 20, order: 7, options: 'DEFAULT_PAYMENT_OPTIONS' },
  { key: 'isInvoiceRegistered', label: 'インボイス登録事業者', section: '会計設定', component: 'checkbox', widthPercent: 20, order: 8 },
  { key: 'invoiceRegistrationNumber', label: '登録番号', section: '会計設定', component: 'text', widthPercent: 20, order: 9, placeholder: 'T1234567890123', visibleWhen: { field: 'isInvoiceRegistered', value: true } },
  { key: 'hasDepartmentManagement', label: '部門管理あり', section: '会計設定', component: 'checkbox', widthPercent: 20, order: 10 },
  { key: 'hasRentalIncome', label: '不動産所得あり', section: '会計設定', component: 'checkbox', widthPercent: 20, order: 11, hint: '有効にすると不動産関連15科目が選択可能になります', visibleWhen: { field: 'type', value: 'individual' } },

  // ── 報酬設定 ──
  { key: 'advisoryFee', label: '月額顧問報酬', section: '報酬設定', component: 'amount', widthPercent: 20, order: 1, min: 0 },
  { key: 'bookkeepingFee', label: '記帳代行', section: '報酬設定', component: 'amount', widthPercent: 20, order: 2, min: 0 },
  { key: 'monthlyTotal', label: '月次合計（自動算出）', section: '報酬設定', component: 'computed', widthPercent: 20, order: 3 },
  { key: 'settlementFee', label: '決算報酬', section: '報酬設定', component: 'amount', widthPercent: 20, order: 4, min: 0 },
  { key: 'taxFilingFee', label: '消費税申告報酬', section: '報酬設定', component: 'amount', widthPercent: 20, order: 5, min: 0 },
  { key: 'annualTotal', label: '年間総報酬（自動算出）', section: '報酬設定', component: 'computed', widthPercent: 20, order: 6 },
];
