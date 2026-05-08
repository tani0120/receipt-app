/**
 * 進捗管理画面のカラム＆フィルタ定義
 * MockProgressDetailPage で使用
 */

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
