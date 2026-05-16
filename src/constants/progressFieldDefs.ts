/**
 * 進捗管理画面のカラム＆フィルタ定義
 * MockProgressDetailPage で使用
 */
import type { FieldDef, SectionDef } from '@/types/fieldLayout';

/** 進捗管理の全列定義 */
export const PROGRESS_ALL_COLUMNS = [
  { key: 'status', label: 'ステータス' },
  { key: 'threeCode', label: '3コード' },
  { key: 'companyName', label: '顧問先' },
  { key: 'staffName', label: '担当者' },
  { key: 'fiscalMonth', label: '決算月' },
  { key: 'shareStatus', label: '共有状態' },
  { key: 'receivedDate', label: '受取日' },
  { key: 'unsorted', label: '未選別' },
  { key: 'unexported', label: '未出力' },
  { key: 'jobStatus', label: '取込' },
  { key: 'currentYearJournals', label: '当年' },
  { key: 'lastYearJournals', label: '前年' },
] as const;

/** 進捗管理のフィルタ列定義キーとラベル（filterOptionsは画面側でcomputed注入） */
export const PROGRESS_FILTER_COLUMN_DEFS = [
  { key: 'clientStatus', label: 'ステータス', filterType: 'select' as const, optionsKey: 'STATUS_OPTIONS' },
  { key: 'code', label: '3コード', filterType: 'text' as const },
  { key: 'companyName', label: '顧問先', filterType: 'text' as const },
  { key: 'repName', label: '代表者名', filterType: 'text' as const },
  { key: 'type', label: '種別', filterType: 'select' as const, optionsKey: 'TYPE_OPTIONS' },
  { key: 'staffId', label: '担当者', filterType: 'select' as const, optionsKey: 'dynamic_staff' },
  { key: 'fiscalMonth', label: '決算月', filterType: 'select' as const, optionsKey: 'dynamic_month' },
  { key: 'receivedDate', label: '資料受取日', filterType: 'date' as const },
  { key: 'unsorted', label: '未選別', filterType: 'number' as const },
  { key: 'unexported', label: '未出力', filterType: 'number' as const },
  { key: 'currentYearJournals', label: '今期累計', filterType: 'number' as const },
  { key: 'lastYearJournals', label: '前期合計', filterType: 'number' as const },
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// フィールド管理・レイアウト管理用 基盤定義
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** セクション定義 */
export const progressSections: SectionDef[] = [
  { key: '基本情報', title: '基本情報', defaultCols: 4 },
  { key: '進捗状況', title: '進捗状況', defaultCols: 3 },
  { key: '月次仕訳', title: '月次仕訳', defaultCols: 6 },
];

/** 全フィールド定義 */
export const progressFields: FieldDef[] = [
  // ── 基本情報 ──
  { key: 'status', label: 'ステータス', section: '基本情報', component: 'select', widthPercent: 20, order: 1 },
  { key: 'threeCode', label: '3コード', section: '基本情報', component: 'readonly', widthPercent: 20, order: 2, alwaysReadonly: true },
  { key: 'companyName', label: '顧問先名', section: '基本情報', component: 'readonly', widthPercent: 20, order: 3, alwaysReadonly: true },
  { key: 'staffName', label: '担当者', section: '基本情報', component: 'staffSelect', widthPercent: 20, order: 4, modelKey: 'staffId' },
  { key: 'fiscalMonth', label: '決算月', section: '基本情報', component: 'readonly', widthPercent: 20, order: 5, alwaysReadonly: true },

  // ── 進捗状況 ──
  { key: 'shareStatus', label: '共有設定', section: '進捗状況', component: 'select', widthPercent: 20, order: 1 },
  { key: 'receivedDate', label: '資料受取日', section: '進捗状況', component: 'date', widthPercent: 20, order: 2 },
  { key: 'unsorted', label: '未選別', section: '進捗状況', component: 'readonly', widthPercent: 20, order: 3, alwaysReadonly: true },
  { key: 'unexported', label: '未出力', section: '進捗状況', component: 'readonly', widthPercent: 20, order: 4, alwaysReadonly: true },
  { key: 'jobStatus', label: '移行ジョブ', section: '進捗状況', component: 'readonly', widthPercent: 20, order: 5, alwaysReadonly: true },

  // ── 月次仕訳 ──
  { key: 'month6', label: '6月', section: '月次仕訳', component: 'readonly', widthPercent: 8, order: 1, alwaysReadonly: true },
  { key: 'month7', label: '7月', section: '月次仕訳', component: 'readonly', widthPercent: 8, order: 2, alwaysReadonly: true },
  { key: 'month8', label: '8月', section: '月次仕訳', component: 'readonly', widthPercent: 8, order: 3, alwaysReadonly: true },
  { key: 'month9', label: '9月', section: '月次仕訳', component: 'readonly', widthPercent: 8, order: 4, alwaysReadonly: true },
  { key: 'month10', label: '10月', section: '月次仕訳', component: 'readonly', widthPercent: 8, order: 5, alwaysReadonly: true },
  { key: 'month11', label: '11月', section: '月次仕訳', component: 'readonly', widthPercent: 8, order: 6, alwaysReadonly: true },
  { key: 'month12', label: '12月', section: '月次仕訳', component: 'readonly', widthPercent: 8, order: 7, alwaysReadonly: true },
  { key: 'month1', label: '1月', section: '月次仕訳', component: 'readonly', widthPercent: 8, order: 8, alwaysReadonly: true },
  { key: 'month2', label: '2月', section: '月次仕訳', component: 'readonly', widthPercent: 8, order: 9, alwaysReadonly: true },
  { key: 'month3', label: '3月', section: '月次仕訳', component: 'readonly', widthPercent: 8, order: 10, alwaysReadonly: true },
  { key: 'month4', label: '4月', section: '月次仕訳', component: 'readonly', widthPercent: 8, order: 11, alwaysReadonly: true },
  { key: 'month5', label: '5月', section: '月次仕訳', component: 'readonly', widthPercent: 8, order: 12, alwaysReadonly: true },
  { key: 'currentYearJournals', label: '今期累計', section: '月次仕訳', component: 'readonly', widthPercent: 10, order: 13, alwaysReadonly: true },
  { key: 'lastYearJournals', label: '前期合計', section: '月次仕訳', component: 'readonly', widthPercent: 10, order: 14, alwaysReadonly: true },
];

/** フラットレイアウト用: heading付き全フィールド（グローバルorder順） */
export const progressFieldsFlat: FieldDef[] = [
  // ── 基本情報（heading） ──
  { key: 'heading_basic', label: '基本情報', section: '', component: 'heading', widthPercent: 100, order: 1, headingSize: 14, headingBg: '#4a8dc9', deletable: true },
  ...progressFields.filter(f => f.section === '基本情報').map((f, i) => ({ ...f, section: '', order: 2 + i })),
  // ── 進捗状況（heading） ──
  { key: 'heading_progress', label: '進捗状況', section: '', component: 'heading', widthPercent: 100, order: 10, headingSize: 14, headingBg: '#4a8dc9', deletable: true },
  ...progressFields.filter(f => f.section === '進捗状況').map((f, i) => ({ ...f, section: '', order: 11 + i })),
  // ── 月次仕訳（heading） ──
  { key: 'heading_monthly', label: '月次仕訳', section: '', component: 'heading', widthPercent: 100, order: 20, headingSize: 14, headingBg: '#4a8dc9', deletable: true },
  ...progressFields.filter(f => f.section === '月次仕訳').map((f, i) => ({ ...f, section: '', order: 21 + i })),
];
