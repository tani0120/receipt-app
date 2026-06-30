/**
 * 顧問先（Client）ドメイン型定義
 *
 * 分割元: repositories/types.ts §0-2
 * 用途: 顧問先管理、仕訳対象の選択、Drive共有フォルダ管理、進捗管理
 */

/** クライアントステータス（顧問先状態） */
export type ClientStatus = 'active' | 'inactive' | 'suspension'

/**
 * 顧問先（一覧・詳細で共通利用）
 *
 * 対象データ: 税理士事務所の顧問先企業/個人事業主
 * 用途: 顧問先管理、仕訳対象の選択、Drive共有フォルダ管理、進捗管理
 */
export interface Client {
  clientId: string;   // 不変。DB primary key。形式: c_ + ランダム8文字（例: c_I9YZIpVE）
  threeCode: string;  // 可変。人間用の識別コード。大文字3文字（例: ABC）
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
  status: ClientStatus;
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
  /** 不動産所得あり（個人事業主の場合のみ有効。account-master.tsの不動産関連15科目の表示可否を制御） */
  hasRentalIncome: boolean;
  /** 主担当スタッフID（useStaff紐付けと同期。Phase C: clients.staff_id FKに移行） */
  staffId: string | null;
  /** Google Drive共有フォルダID（顧問先登録時にcreateDriveFolderで自動作成） */
  sharedFolderId: string;
  /** 顧問先ログインメール（ポータルログイン時にGoogleアカウントから自動取得。Drive共有権限付与 + PC独自システム認証に使用） */
  sharedEmail: string;
  advisoryFee: number;
  bookkeepingFee: number;
  settlementFee: number;
  taxFilingFee: number;

  // ── Kintoneスタイル拡張フィールド（31_client_management） ──

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
  /** 添付ファイル（レガシー: 今後はextraFields[fieldKey]で管理） */
  attachmentFiles?: AttachmentFile[];
  /** カスタムフィールドの値（key→value）。keyは 'custom_xxxx' 形式 */
  extraFields?: Record<string, unknown>;

  // ── 自動算出（保存時に計算） ──
  /** 月次合計（顧問報酬 + 記帳代行 + 社労士 + 給与 + 経理代行 + システム） */
  monthlyTotal?: number;
  /** 年間総報酬（月次合計 × 12 + 決算報酬 + 消費税申告報酬） */
  annualTotal?: number;

  // ── 昇格元見込先 ──
  /** 昇格元の見込先ID（見込先→顧問先昇格時に自動設定。直接登録の場合はnull） */
  sourceLeadId?: string | null;
}

/** 連絡先テーブルの1行 */
export interface ClientContact {
  /** 担当者名（松平様 等） */
  name: string;
  /** 種別（メール/電話/チャットワーク） */
  method: string;
  /** 連絡先値（メールアドレス等） */
  value: string;
  /** 利用方法（資料依頼・通常連絡等） */
  usage: string;
  /** 備考 */
  memo: string;
  /** 動的追加列データ（列キー→値） */
  extra?: Record<string, string>;
}

/** 過去担当者テーブルの1行 */
export interface PastStaffEntry {
  /** スタッフID */
  staffId: string;
  /** 区分（主担当/副担当/給与社保担当） */
  role: string;
  /** 期間（まで）ISO日付 */
  endDate: string;
  /** 備考 */
  memo: string;
}

/** 添付ファイルの1件 */
export interface AttachmentFile {
  /** UUID */
  id: string;
  /** ファイル名 */
  name: string;
  /** ファイルURL */
  url: string;
  /** バイト数 */
  size: number;
  /** アップロード日時（ISO） */
  uploadedAt: string;
}

/** パネルフォーム用型（ClientからclientIdを除き、contactをフラット化） */
export interface ClientForm extends Omit<Client, 'clientId' | 'contact'> {
  contactType: 'email' | 'chatwork' | 'none';
  contactValue: string;
}
