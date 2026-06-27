/**
 * 見込先（Lead）ドメイン型定義
 *
 * 分割元: repositories/types.ts §0-3
 * 用途: 見込先管理、営業進捗トラッキング
 */

import type { PastStaffEntry, ClientContact, AttachmentFile } from './client.types'

/** 見込先ステータス（見込先状態） */
export type LeadStatus = 'active' | 'inactive' | 'converted' | 'suspension'

/**
 * 見込先（営業リード管理）
 *
 * 対象データ: まだ正式顧問先ではないが見込みのある企業/個人
 * 用途: 見込先管理、営業進捗トラッキング
 * 構造: Client型と同一構成（項目は後で調整）
 */
export interface Lead {
  leadId: string;       // 不変。DB primary key。形式: l_{8文字ランダム}
  threeCode: string;    // 識別コード
  companyName: string;
  companyNameKana: string;
  type: 'corp' | 'individual' | 'sole_proprietor';
  repName: string;
  repNameKana: string;
  /** @deprecated contactsに統合済み。後方互換用に残置 */
  phoneNumber?: string;
  /** @deprecated contactsに統合済み。後方互換用に残置 */
  email?: string;
  /** @deprecated contactsに統合済み。後方互換用に残置 */
  chatRoomUrl?: string;
  contact: { type: 'email' | 'chatwork' | 'none'; value: string };
  fiscalMonth: number;
  fiscalDay: string | number;
  industry: string;
  establishedDate: string;
  status: LeadStatus;
  accountingSoftware: 'mf' | 'freee' | 'yayoi' | 'tkc' | 'other';
  taxFilingType: 'blue' | 'white';
  consumptionTaxMode: 'individual' | 'proportional' | 'simplified' | 'exempt';
  simplifiedTaxCategory?: number;
  taxMethod: 'tax_included' | 'tax_excluded_included' | 'tax_excluded_separate';
  calculationMethod: 'accrual' | 'cash' | 'interim_cash';
  defaultPaymentMethod: 'cash' | 'owner_loan' | 'accounts_payable';
  isInvoiceRegistered: boolean;
  invoiceRegistrationNumber: string;
  hasDepartmentManagement: boolean;
  hasRentalIncome: boolean;
  staffId: string | null;
  sharedFolderId: string;
  sharedEmail: string;
  advisoryFee: number;
  bookkeepingFee: number;
  settlementFee: number;
  taxFilingFee: number;

  // ── Kintone拡張フィールド（Client型と統一） ──

  /** 関与開始日（ISO日付） */
  engagementStartDate?: string;
  /** 関与終了日（ISO日付。稼働中はnull） */
  engagementEndDate?: string | null;
  /** 副担当者ID（記帳担当スタッフ） */
  subStaffId?: string | null;
  /** 給与・社会保険担当スタッフID */
  payrollStaffId?: string | null;
  /** 法人番号（13桁。※マイナンバーは入れない） */
  corporateNumber?: string;
  /** 代表肩書（代表取締役等） */
  repTitle?: string;
  /** WebサイトURL */
  websiteUrl?: string;
  /** 売上高（「1億円以上（Eクラス）」等） */
  annualRevenue?: string;
  /** 総従業員数（役員含む） */
  employeeCount?: number | null;
  /** 事業内容（複数行テキスト） */
  businessDescription?: string;
  /** 親号先/グループ会社 */
  parentCompany?: string;
  /** 備考（自由テキスト） */
  memo?: string;
  /** 過去担当者履歴テーブル */
  pastStaffHistory?: PastStaffEntry[];
  /** 連絡先テーブル */
  contacts?: ClientContact[];

  // ── ニーズ管理 ──
  /** 保険ニーズ */
  needsInsurance?: string;
  /** 節税ニーズ */
  needsTaxSaving?: string;
  /** 補助金・助成金ニーズ */
  needsSubsidy?: string;
  /** 借入ニーズ */
  needsLoan?: string;
  /** 不動産ニーズ */
  needsRealEstate?: string;

  // ── 税務関連 ──
  /** 消費税中間申告（不要/1回/3回/11回） */
  consumptionTaxInterim?: string;

  // ── システム導入状況 ──
  /** 会計ソフト備考 */
  accountingSoftwareMemo?: string;
  /** 給与計算ソフト名 */
  payrollSoftware?: string;
  /** 給与計算備考 */
  payrollSoftwareMemo?: string;
  /** 勤怠管理システム名 */
  attendanceSystem?: string;
  /** 勤怠管理備考 */
  attendanceSystemMemo?: string;
  /** その他システム名 */
  otherSystem?: string;
  /** その他システム備考 */
  otherSystemMemo?: string;

  // ── 報酬情報拡張 ──
  /** 契約内容（決算のみ/顧問/年1〜12回） */
  contractScope?: string;
  /** 記帳代行・自計化 */
  bookkeepingType?: string;
  /** 社労士契約（なし/あり） */
  hasSocialInsuranceContract?: string;
  /** 給与サービス（なし/あり） */
  hasPayrollService?: string;
  /** 経理代行（なし/あり） */
  hasAccountingService?: string;
  /** 社労士報酬 */
  socialInsuranceFee?: number;
  /** 給与報酬 */
  payrollFee?: number;
  /** 経理代行報酬 */
  accountingServiceFee?: number;
  /** システム報酬 */
  systemFee?: number;
  /** 契約書リンクURL */
  contractDocUrl?: string;
  /** 引き落とし方法（紙/口座引落し） */
  paymentMethod?: string;
  /** 引き落とし日（8日/その他） */
  paymentDay?: string;
  /** 報酬備考 */
  feeNotes?: string;
  /** 添付ファイル */
  attachmentFiles?: AttachmentFile[];
  /** カスタムフィールドの値（key→value）。keyは 'custom_xxxx' 形式 */
  extraFields?: Record<string, unknown>;

  // ── 自動算出（保存時に計算） ──
  /** 月次合計 */
  monthlyTotal?: number;
  /** 年間総報酬 */
  annualTotal?: number;
}

/** 見込先フォーム用型 */
export interface LeadForm extends Omit<Lead, 'leadId' | 'contact'> {
  contactType: 'email' | 'chatwork' | 'none';
  contactValue: string;
}
