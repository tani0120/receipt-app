/**
 * 顧問先編集フォーム型定義
 *
 * ScreenA_Detail_EditModal.vue で使用する
 * フォームデータの型。defaultFormの構造と完全に一致する。
 */

/** 連絡先情報 */
export interface ClientFormContact {
  type: 'chatwork' | 'email' | 'none';
  value: string;
}

/** 会計設定 */
export interface ClientFormSettings {
  software: string;
  taxMethod: 'inclusive' | 'exclusive';
  calcMethod: '発生主義' | '期中現金主義' | '現金主義';
  taxType: '青色' | '白色';
  consumptionTax: string;  // 'general' | 'exempt' | 'simplified_1' ~ 'simplified_6'
  taxCalculationMethod: 'stack' | 'back';
  roundingSettings: 'floor' | 'round' | 'ceil';
  isInvoiceRegistered: boolean;
  invoiceRegistrationNumber: string;
}

/** Driveリンク */
export interface ClientFormDriveLinks {
  storage: string;
  journalOutput: string;
  journalExclusion: string;
  pastJournals: string;
}

/** 顧問先編集フォーム全体 */
export interface ClientFormData {
  jobId: string;
  code: string;
  name: string;
  type: 'corp' | 'individual';
  rep: string;
  staffName?: string;
  contact: ClientFormContact;
  isActive: boolean;
  fiscalMonth: number;
  establishmentDate: string;
  settings: ClientFormSettings;
  driveLinks: ClientFormDriveLinks;
}
