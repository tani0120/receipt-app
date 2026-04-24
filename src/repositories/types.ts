/**
 * Repository型定義（DL-030: データアクセス抽象化）
 *
 * 【設計原則】
 * - Repositoryはデータの出し入れだけ。ロジックは絶対に入れない
 * - 全メソッドはPromise<T>で統一（将来のSupabase移行でシグネチャ崩壊を防止）
 * - モック実装（TSファイル）とSupabase実装を中身差し替えで切り替え可能
 * - ★Staff/Client/DocEntry等のドメイン型もこのファイルに集約（唯一の型定義源泉）
 *
 * 【ファイル構成】
 * src/repositories/
 *   types.ts                    ← このファイル（全Repository型 + ドメイン型を集約）
 *   mock/                       ← モック実装（TSファイルからデータ取得）
 *   supabase/                   ← 将来作成（フェーズ5）
 *   index.ts                    ← factory関数（環境切り替え）
 *
 * 準拠: pipeline_design_master.md DL-030, DL-042
 */


import type { Vendor, IndustryVectorEntry, VendorVector } from '@/mocks/types/pipeline/vendor.type'
import type { Account } from '@/shared/types/account'

// ============================================================
// § 0-1. Staff（スタッフ）— DL-042で追加
// ============================================================

/** スタッフのロール */
export type StaffRole = 'admin' | 'general'

/** スタッフのステータス */
export type StaffStatus = 'active' | 'inactive'

/**
 * スタッフ（一覧・詳細で共通利用）
 *
 * 対象データ: 事務所スタッフ（ログインユーザー）
 * 用途: ログイン認証、顧問先担当者紐付け、仕訳画面のスタッフ切替
 */
export interface Staff {
  uuid: string
  name: string
  email: string
  // passwordはサーバーサイドのみ。フロントエンドには返らない
  role: StaffRole
  status: StaffStatus
}

/** パネルフォーム用型（Staffからuuidを除外、新規登録時のみパスワード入力） */
export interface StaffForm {
  name: string
  email: string
  password: string    // 新規登録・パスワード変更時のみ使用
  role: StaffRole
  status: StaffStatus
}

// ============================================================
// § 0-2. Client（顧問先）— DL-042で追加
// ============================================================

/** クライアントステータス */
export type ClientStatus = 'active' | 'inactive' | 'suspension'

/**
 * 顧問先（一覧・詳細で共通利用）
 *
 * 対象データ: 税理士事務所の顧問先企業/個人事業主
 * 用途: 顧問先管理、仕訳対象の選択、Drive共有フォルダ管理、進捗管理
 */
export interface Client {
  clientId: string;   // 不変。DB primary key。形式: {3コード}-{5桁連番}（例: ABC-00001）
  threeCode: string;  // 可変。人間用の識別コード。大文字3文字（例: ABC）
  companyName: string;
  companyNameKana: string;
  type: 'corp' | 'individual';
  repName: string;
  repNameKana: string;
  phoneNumber: string;
  email: string;
  chatRoomUrl: string;
  contact: { type: 'email' | 'chatwork' | 'none'; value: string };
  fiscalMonth: number;
  fiscalDay: string | number;
  industry: string;
  establishedDate: string;
  status: ClientStatus;
  accountingSoftware: 'mf' | 'freee' | 'yayoi' | 'tkc' | 'other';
  taxFilingType: 'blue' | 'white';
  consumptionTaxMode: 'general' | 'simplified' | 'exempt';
  simplifiedTaxCategory?: number;
  taxMethod: 'inclusive' | 'exclusive';
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
  /** 共有用メール（Googleログイン時に自動取得。Drive共有権限付与 + PC独自システム認証に使用） */
  sharedEmail: string;
  advisoryFee: number;
  bookkeepingFee: number;
  settlementFee: number;
  taxFilingFee: number;
}

/** パネルフォーム用型（ClientからclientIdを除き、contactをフラット化） */
export interface ClientForm extends Omit<Client, 'clientId' | 'contact'> {
  contactType: 'email' | 'chatwork' | 'none';
  contactValue: string;
}

// ============================================================
// § ConfirmedJournal 仮定義（T-03未着手のため）

// ============================================================

/**
 * 確定済み仕訳（仮定義）
 *
 * ⚠️ T-03（確定済み仕訳マスタ型定義）完了時に正式な型に差し替えること。
 * ⚠️ この型はtypes.ts内に封じ込める。Repository外に漏らさない。
 * ⚠️ パイプライン側ではT-03完了まで使用しない。
 */
type ConfirmedJournal = unknown

// ============================================================
// § 1. VendorRepository（全社取引先マスタ）
// ============================================================

/**
 * 全社共通取引先マスタへのデータアクセス
 *
 * 対象データ: vendors_global.ts（224件）
 * 照合フロー: Step 3-1（T番号）→ 3-2（電話番号）→ 3-3（match_key完全一致）
 */
export type VendorRepository = {
  /** 全社共通取引先マスタ全件取得 */
  getAll(): Promise<Vendor[]>

  /**
   * match_key（照合キー）で完全一致検索
   * normalizeVendorName()の出力値を渡す（DL-027）
   */
  findByMatchKey(key: string): Promise<Vendor | undefined>

  /**
   * T番号（インボイス番号）で検索
   * t_numbers配列のいずれかに一致した場合にヒット（Layer 1照合）
   */
  findByTNumber(tNumber: string): Promise<Vendor | undefined>

  /**
   * 電話番号で検索
   * phone_numbers配列のいずれかに一致した場合にヒット（Layer 2照合）
   */
  findByPhoneNumber(phone: string): Promise<Vendor | undefined>
}

// ============================================================
// § 2. ClientVendorRepository（顧問先取引先マスタ）
// ============================================================

/**
 * 顧問先固有の取引先マスタへのデータアクセス
 *
 * 対象データ: vendors_client_*.ts（未作成。フェーズ4で実装）
 * 優先順位: 顧問先マスタ ＞ 全社マスタ（DL-022）
 */
export type ClientVendorRepository = {
  /** 顧問先の取引先マスタ全件取得 */
  getByClientId(clientId: string): Promise<Vendor[]>

  /**
   * 顧問先マスタでmatch_key（照合キー）検索
   * 過去仕訳照合（Step 2）の優先ソース
   */
  findByMatchKey(clientId: string, key: string): Promise<Vendor | undefined>

  /**
   * 顧問先マスタに取引先を追加（学習結果の蓄積）
   * 人間が手入力した科目が次回から自動確定される仕組みの基盤
   */
  save(clientId: string, vendor: Vendor): Promise<void>
}

// ============================================================
// § 3. IndustryVectorRepository（業種辞書マスタ）
// ============================================================

/**
 * 業種ベクトル→科目候補マッピング辞書へのデータアクセス
 *
 * 対象データ: industry_vector_corporate.ts / industry_vector_sole.ts（68種）
 * 用途: Step 4（科目確定）で vendor_vector × direction → 科目候補を取得
 */
export type IndustryVectorRepository = {
  /** 業種辞書全件取得（法人 or 個人事業主） */
  getAll(businessType: 'corporate' | 'sole'): Promise<IndustryVectorEntry[]>

  /**
   * 業種ベクトルから科目候補を取得
   * vendor_vector（例: 'taxi'）→ IndustryVectorEntry（expense: ['TRAVEL']）
   */
  findByVector(
    businessType: 'corporate' | 'sole',
    vector: VendorVector
  ): Promise<IndustryVectorEntry | undefined>
}

// ============================================================
// § 4. AccountRepository（勘定科目マスタ）
// ============================================================

/**
 * 勘定科目マスタへのデータアクセス
 *
 * 対象データ: account-master.ts（ACCOUNT_MASTER配列）
 * 用途: 科目ID → 科目名/税区分の解決、UI表示
 */
export type AccountRepository = {
  /** 科目マスタ全件取得 */
  getAll(): Promise<Account[]>

  /**
   * 科目IDで検索
   * 例: findById('TRAVEL') → { id: 'TRAVEL', name: '旅費交通費', ... }
   */
  findById(id: string): Promise<Account | undefined>

  /**
   * 顧問先のカスタム科目を含む全件取得
   * ACCOUNT_MASTER + 顧問先固有科目（isCustom: true）をマージ
   */
  getAllForClient(clientId: string): Promise<Account[]>
}

// ============================================================
// § 5. ConfirmedJournalRepository（確定済み仕訳マスタ）
// ============================================================

/**
 * 確定済み仕訳マスタへのデータアクセス
 *
 * 対象データ: confirmed_journals_*.ts（未作成。T-03で型定義後に実装）
 * 用途: Step 2（過去仕訳照合）で match_key × 科目の履歴を取得
 *
 * ⚠️ ConfirmedJournal型がunknown仮置きのため、モック実装はフェーズ4（T-03完了後）
 */
export type ConfirmedJournalRepository = {
  /** 顧問先の確定済み仕訳全件取得 */
  getByClientId(clientId: string): Promise<ConfirmedJournal[]>

  /**
   * 顧問先の確定済み仕訳をmatch_key（照合キー）で絞り込み
   * 過去仕訳照合（Step 2）のコアメソッド
   */
  findByMatchKey(clientId: string, matchKey: string): Promise<ConfirmedJournal[]>
}

// ============================================================
// § 6. ShareStatusRepository（共有設定マスタ）
// ============================================================

/** 共有設定ステータス */
export type ShareStatus = 'pending' | 'active' | 'revoked'

/** 顧問先ごとの共有設定レコード */
export interface ShareStatusRecord {
  clientId: string
  status: ShareStatus
  /** 招待コード（発行済みの場合） */
  inviteCode: string | null
  /** 最終更新日時（ISO 8601） */
  updatedAt: string
}

/**
 * 共有設定マスタへのデータアクセス
 *
 * 対象データ: 顧問先ごとの共有ステータス（pending/active/revoked）
 * 用途: アップロードURL共有のステータス管理
 * 連携: 進捗管理画面（/master/progress）・アップロード管理画面（/client/upload/:clientId）
 *
 * 準拠: DL-031（認証・認可設計）
 */
export type ShareStatusRepository = {
  /** 全顧問先の共有設定を取得 */
  getAll(): Promise<ShareStatusRecord[]>

  /** 顧問先IDで共有設定を取得 */
  getByClientId(clientId: string): Promise<ShareStatusRecord | undefined>

  /** 共有設定ステータスを更新（データの書き換えのみ。判断ロジックは呼び出し側） */
  updateStatus(clientId: string, status: ShareStatus): Promise<void>

  /** 招待コードを保存 */
  saveInviteCode(clientId: string, code: string): Promise<void>
}

// ============================================================
// § 7. DocumentRepository（資料マスタ）
// ============================================================

/** 資料のデータソース */
export type DocSource = 'drive' | 'upload' | 'staff-upload' | 'guest-upload'

/** 資料の選別ステータス */
export type DocStatus = 'pending' | 'target' | 'supporting' | 'excluded'

/**
 * 資料1件（Drive/PCアップロードで取り込んだファイル）
 *
 * 対象データ: Drive共有フォルダ or PCアップロードで投入された画像/PDF
 * 用途: 資料選別画面での人間チェック、進捗管理の未選別/資料受取日算出
 *
 * 準拠: DL-039（ゲスト認証・Drive権限付与設計）
 */
export interface DocEntry {
  /** UUID（一意識別子） */
  id: string
  /** 顧問先ID（例: 'LDI-00008'） */
  clientId: string
  /** データソース（'drive' | 'upload'） */
  source: DocSource
  /** ファイル名（例: 'IMG_20250305_143200.jpg'） */
  fileName: string
  /** MIMEタイプ（例: 'image/jpeg', 'application/pdf'） */
  fileType: string
  /** ファイルサイズ（バイト） */
  fileSize: number
  /** SHA-256ハッシュ（重複検知用。未算出時はnull） */
  fileHash: string | null
  /** Drive fileId（source='drive'時のみ） */
  driveFileId: string | null
  /** サムネイルURL（Googleが自動生成する200px画像 or ローカルパス） */
  thumbnailUrl: string | null
  /** プレビュー用画像パス（フルサイズ閲覧用） */
  previewUrl: string | null
  /** 選別ステータス（'pending' | 'target' | 'supporting' | 'excluded'） */
  status: DocStatus
  /** 取得日時（ISO 8601形式。バッチ取り込み時のタイムスタンプ） */
  receivedAt: string
  /** バッチID（選別完了→送出時に付与。1回の送出=1バッチ） */
  batchId: string | null
  /** 仕訳ID（選別完了→送出時に全件付与） */
  journalId: string | null
  /** 操作者スタッフID（アップロード/取込時に記録。ゲストの場合は'guest'。DL-042追加） */
  createdBy: string | null
  /** 最終更新者スタッフID（ステータス変更・メタデータ編集時に記録） */
  updatedBy: string | null
  /** 最終更新日時（ISO 8601） */
  updatedAt: string | null
  /** ステータス変更者スタッフID（選別操作の追跡用） */
  statusChangedBy: string | null
  /** ステータス変更日時（ISO 8601） */
  statusChangedAt: string | null

  // ── AI分類結果（classify API。独自アップロード時に取得、Drive経路はフェーズ3.5で追加予定） ──
  /** AI抽出日付（YYYY-MM-DD） */
  aiDate?: string | null
  /** AI抽出金額（整数） */
  aiAmount?: number | null
  /** AI抽出取引先名 */
  aiVendor?: string | null
  /** AI判定証票種別（例: 'receipt', 'bank_statement'） */
  aiSourceType?: string | null
  /** AI判定仕訳方向（'expense' | 'income' | 'transfer' | 'mixed'） */
  aiDirection?: string | null
  /** AI抽出摘要 */
  aiDescription?: string | null
  /** AI判定根拠 */
  aiClassifyReason?: string | null
  /** AI抽出行データ（通帳/クレカ: N行、レシート: 1行、対象外: 空） */
  aiLineItems?: {
    line_index: number
    date: string | null
    description: string
    amount: number
    direction: 'expense' | 'income'
    balance: number | null
  }[] | null
  /** AI行データ件数 */
  aiLineItemsCount?: number
  /** 補助資料フラグ（CSV/Excel等。AI処理スキップ対象） */
  aiSupplementary?: boolean
  /** AI判定証票枚数（2以上は複数証票警告） */
  aiDocumentCount?: number
  /** AI警告メッセージ（OK判定だが注意が必要） */
  aiWarning?: string | null
  /** AI処理モード（auto/manual/excluded） */
  aiProcessingMode?: string | null
  /** AIフォールバック適用フラグ */
  aiFallbackApplied?: boolean
  /** AI処理メトリクス（コスト・トークン数等） */
  aiMetrics?: {
    source_type_confidence: number
    direction_confidence: number
    duration_ms: number
    prompt_tokens: number
    completion_tokens: number
    thinking_tokens: number
    token_count: number
    cost_yen: number
    model: string
  } | null
}

/**
 * 資料マスタへのデータアクセス
 *
 * 対象データ: 顧問先ごとの資料一覧
 * 用途: 資料選別画面、進捗管理の通知（未選別件数・資料受取日）
 *
 * ⚠️ 現在のフェーズではcomposableが直接refで保持。
 *    移行時にこのRepository経由に差し替え。
 */
export type DocumentRepository = {
  /** 顧問先の全資料を取得 */
  getByClientId(clientId: string): Promise<DocEntry[]>

  /** 資料の選別ステータスを更新（データ書き換えのみ） */
  updateStatus(id: string, status: DocStatus): Promise<void>

  /** 資料を1件保存（Drive取り込み/PCアップロード時） */
  save(doc: DocEntry): Promise<void>

  /** 資料を複数件一括保存（バッチ取り込み用） */
  saveBatch(docs: DocEntry[]): Promise<void>
}

// ============================================================
// § Repositories集約型（factory関数の戻り値型）
// ============================================================

/**
 * 全Repositoryをまとめた集約型
 * createRepositories()の戻り値として使用
 */
export type Repositories = {
  /** スタッフマスタ（DL-042） */
  staff: StaffRepository
  /** 顧問先マスタ（DL-042） */
  client: ClientRepository
  /** 全社取引先マスタ */
  vendor: VendorRepository
  /** 顧問先取引先マスタ */
  clientVendor: ClientVendorRepository
  /** 業種辞書マスタ（業種→科目候補） */
  industryVector: IndustryVectorRepository
  /** 勘定科目マスタ */
  account: AccountRepository
  /** 確定済み仕訳マスタ（過去仕訳照合用） */
  confirmedJournal: ConfirmedJournalRepository
  /** 共有設定マスタ（DL-031） */
  shareStatus: ShareStatusRepository
  /** 資料マスタ（DL-039） */
  document: DocumentRepository
}

// ============================================================
// § StaffRepository（スタッフマスタ）— DL-042で追加
// ============================================================

/**
 * スタッフマスタへのデータアクセス
 *
 * 対象データ: 事務所スタッフ
 * 用途: ログイン認証、担当者名解決、仕訳画面のスタッフ切替
 */
export type StaffRepository = {
  /** 全スタッフ取得 */
  getAll(): Promise<Staff[]>
  /** UUIDで1件取得 */
  getById(uuid: string): Promise<Staff | undefined>
  /** メールアドレスでスタッフ検索（ログイン認証用） */
  getByEmail(email: string): Promise<Staff | undefined>
  /** 有効スタッフのみ取得（担当者選択ドロップダウン用） */
  getActiveStaff(): Promise<Staff[]>
  /** スタッフ追加 */
  create(staff: Staff): Promise<void>
  /** スタッフ更新（部分更新） */
  update(uuid: string, partial: Partial<Staff>): Promise<void>
}

// ============================================================
// § ClientRepository（顧問先マスタ）— DL-042で追加
// ============================================================

/**
 * 顧問先マスタへのデータアクセス
 *
 * 対象データ: 税理士事務所の顧問先企業/個人事業主
 * 用途: 顧問先管理、仕訳対象の選択、Drive共有フォルダ管理
 */
export type ClientRepository = {
  /** 全顧問先取得 */
  getAll(): Promise<Client[]>
  /** clientIdで1件取得 */
  getById(clientId: string): Promise<Client | undefined>
  /** 担当者別顧問先取得（進捗管理フィルタ） */
  getByStaffId(staffId: string): Promise<Client[]>
  /** 有効顧問先のみ取得 */
  getActiveClients(): Promise<Client[]>
  /** 顧問先追加 */
  create(client: Client): Promise<void>
  /** 顧問先更新（部分更新） */
  update(clientId: string, partial: Partial<Client>): Promise<void>
}

// ============================================================
// § AppNotification（アプリ通知）— 通知センター用
// Supabase: notifications テーブルに対応予定
// ============================================================

/** 通知の種別 */
export type NotificationType =
  | 'migration_complete'    // 移行完了（Drive→ローカル移行ジョブ完了）
  | 'migration_failed'      // 移行失敗
  | 'batch_complete'        // バッチ処理完了（将来拡張）
  | 'error'                 // エラー通知（将来拡張）

/**
 * アプリ通知（通知センターに表示される1件の通知）
 *
 * 対象データ: バックグラウンド処理の完了/失敗通知
 * 用途: ナビバーの🔔アイコン + 通知センタードロワー
 * Supabase移行時: notifications テーブル（id, type, title, body, ...）
 */
export interface AppNotification {
  /** 一意ID（UUID） */
  id: string
  /** 通知種別 */
  type: NotificationType
  /** 通知タイトル（例: 「TST-00011 移行完了」） */
  title: string
  /** 通知本文（例: 「5件移行完了。1件失敗。」） */
  body: string
  /** 既読フラグ */
  isRead: boolean
  /** 作成日時（ISO 8601） */
  createdAt: string
  /** 関連する顧問先ID（任意。顧問先に紐づく通知の場合） */
  clientId?: string
  /** 関連するジョブID（任意。移行ジョブ通知の場合） */
  jobId?: string
  /**
   * アクション（任意。通知に紐づく操作）
   * 例: { label: '仕訳外ZIP DL', url: '/api/drive/download-excluded/TST-00011' }
   */
  action?: {
    /** アクションボタンのラベル */
    label: string
    /** 遷移先URL or APIエンドポイント */
    url: string
  }
}
