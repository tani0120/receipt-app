/**
 * Repository型定義（DL-030: データアクセス抽象化）
 *
 * 【設計原則】
 * - Repositoryはデータの出し入れだけ。ロジックは絶対に入れない
 * - 全メソッドはPromise<T>で統一（将来のSupabase移行でシグネチャ崩壊を防止）
 * - モック実装（TSファイル）とSupabase実装を中身差し替えで切り替え可能
 *
 * 【ファイル構成】
 * src/repositories/
 *   types.ts                    ← このファイル（Repository interface + ドメイン型re-export）
 *   types/                      ← ドメイン型（分割ファイル）
 *     staff.types.ts            ← Staff, StaffForm
 *     client.types.ts           ← Client, ClientForm, ClientContact等
 *     lead.types.ts             ← Lead, LeadForm
 *     doc-entry.types.ts        ← DocEntry, AI_FIELD_KEYS
 *     notification.types.ts     ← AppNotification
 *     activity.types.ts         ← ActivityLog
 *     share-status.types.ts     ← ShareStatus, ShareStatusRecord
 *     ai-command.types.ts       ← AiCommandLog, AiChatMessage等
 *     index.ts                  ← 全ドメイン型のre-export
 *   mock/                       ← モック実装（TSファイルからデータ取得）
 *   supabase/                   ← Supabase実装
 *   index.ts                    ← factory関数（環境切り替え）
 *
 * 準拠: pipeline_design_master.md DL-030, DL-042
 */


// ============================================================
// § ドメイン型の再公開（re-export）
// ============================================================
// 分割ファイルから全ドメイン型を再公開。
// 既存の `import ... from '@/repositories/types'` を壊さない。

export type { Staff, StaffForm, StaffRole, StaffStatus } from './types/staff.types'
export type { Client, ClientForm, ClientStatus, ClientContact, PastStaffEntry, AttachmentFile } from './types/client.types'
import type { ClientStatus } from './types/client.types'
export type { Lead, LeadForm, LeadStatus } from './types/lead.types'
export type { DocEntry, DocSource, DocStatus } from './types/doc-entry.types'
export { AI_FIELD_KEYS } from './types/doc-entry.types'
export type { AppNotification, NotificationType } from './types/notification.types'
import type { AppNotification } from './types/notification.types'
export type { ActivityLog, StaffActivitySummary, ClientActivitySummary, TrackablePage } from './types/activity.types'
export type { ShareStatus, ShareStatusRecord } from './types/share-status.types'
export type {
  AiCostCategory, AiCommandLog, AiCommandContext,
  AiChatMessage, AiActionButton, AiChatSession,
  AiCostRecord, AiCostLimit
} from './types/ai-command.types'


// ============================================================
// § 外部型のre-export（既存互換）
// ============================================================

import type { Vendor, IndustryVectorEntry, VendorVector } from '@/types/pipeline/vendor.type'
import type { Account, AccountGroup } from '@/types/shared-account'
import type { FilterOperator } from '@/api/helpers/applyFilterConditions'
import type { TaxCategory } from '@/types/shared-tax-category'
import type { LearningRule } from '@/types/learning_rule.type'
import type { Journal } from '@/types/journal.type'
export type { LearningRule }
export type { Journal }


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

  /** type指定で取得（'vendor' | 'non-vendor'） */
  getByType(type: 'vendor' | 'non-vendor'): Promise<Vendor[]>

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

  /** 取引先を新規作成（サーバーでvendor_id発番） */
  create(vendor: Omit<Vendor, 'vendor_id'> & { vendor_id?: string }): Promise<Vendor>

  /** 取引先を部分更新 */
  update(vendorId: string, partial: Partial<Vendor>): Promise<boolean>

  /** vendor_idで1件取得 */
  getById(vendorId: string): Promise<Vendor | undefined>

  /** 取引先を削除 */
  deleteById(vendorId: string): Promise<void>

  /** 一覧取得（フィルタ+ソート+ページネーション） */
  list(query: {
    type?: string
    search?: string
    vectorFilter?: string
    directionFilter?: string
    /** 証票種類フィルタ（NonVendor用） */
    sourceFilter?: string
    /** 確定レベルフィルタ（NonVendor用） */
    levelFilter?: string
    sortKey?: string
    sortOrder?: 'asc' | 'desc'
    page?: number
    pageSize?: number
  }): Promise<{
    rows: Vendor[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    uniqueVectors: string[]
  }>
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

  /**
   * 業種辞書を全件上書き保存
   * フロントからの一括更新用
   */
  saveAll(
    businessType: 'corporate' | 'sole',
    entries: IndustryVectorEntry[]
  ): Promise<{ ok: true; count: number }>
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
// § 4b. AccountMasterRepository（勘定科目マスタ編集）
// ============================================================

/**
 * 勘定科目マスタ編集へのデータアクセス
 *
 * 対象データ: account-master.json（マスタ科目一覧）
 * 用途: マスタ管理画面での科目編集・保存
 *
 * AccountRepositoryとの責務分離:
 * - AccountRepository: 仕訳処理・バリデーション用の参照系
 * - AccountMasterRepository: マスタメンテナンス・管理画面編集用
 */
import type { MfSubAccountEntry, MfDepartmentEntry } from '../types/shared-sub-account'
import type { TaxDirection } from '../types/shared-tax-category'

export type AccountMasterRepository = {
  /** マスタ科目全件取得（管理画面用） */
  getMaster(): Promise<Account[]>

  /** マスタ科目全件上書き保存 */
  saveMaster(accounts: Account[]): Promise<{ ok: true; count: number }>

  /** 顧問先科目全件取得 */
  getClient(clientId: string): Promise<{ accounts: Account[] }>

  /** 顧問先科目全件上書き保存 */
  saveClient(clientId: string, data: { accounts: Account[]; subAccounts?: Record<string, string> }): Promise<{ ok: true; count: number }>

  /** 顧問先科目フル取得（subAccountsMap/departments含む） */
  getClientAccountsFull(clientId: string): Promise<{
    accounts: Account[]
    subAccountsMap: Record<string, MfSubAccountEntry[]>
    departments: MfDepartmentEntry[]
  }>

  /** マスタ科目フィルタ取得（ページネーション付き） */
  getFilteredMaster(params: {
    businessType?: 'corp' | 'individual'
    search?: string
    page?: number
    pageSize?: number
  }): Promise<{
    items: Account[]
    totalCount: number
    pagedItems: Account[]
    page: number
    totalPages: number
  }>

  /** 顧問先科目フィルタ取得（ページネーション付き） */
  getFilteredClient(clientId: string, params: {
    businessType?: 'corp' | 'individual'
    search?: string
    page?: number
    pageSize?: number
  }): Promise<{
    items: Account[]
    totalCount: number
    pagedItems: Account[]
    page: number
    totalPages: number
  }>

  /** 顧問先の補助科目を取得 */
  getClientSubAccounts(clientId: string): Promise<Record<string, MfSubAccountEntry[]>>

  /** 顧問先の部門を取得 */
  getClientDepartments(clientId: string): Promise<MfDepartmentEntry[]>

  /** 顧問先のOverride/MFデータが存在するか */
  hasClientAccounts(clientId: string): Promise<boolean>

  /** MFインポートデータを保存 */
  saveMfAccounts(clientId: string, accounts: Account[]): Promise<{ ok: true; count: number }>

  /** 補助科目を永続化 */
  persistSubAccounts(clientId: string, data: Record<string, MfSubAccountEntry[]>): Promise<void>

  /** 部門を永続化 */
  persistDepartments(clientId: string, data: MfDepartmentEntry[]): Promise<void>

  /** 顧問先別科目をバリデーション用最小形式で返す */
  getClientAccountsForValidation(clientId: string): Promise<{
    accountId: string
    name: string
    accountGroup: AccountGroup
    category: string
    defaultTaxCategoryId?: string
    isContraRevenue?: boolean
    isContraExpense?: boolean
  }[]>


  /** 科目名マップ（ID→名前）を返す */
  getAccountNameMap(clientId?: string): Promise<Record<string, string>>

  /** 孤立Overrideを検出 */
  detectOrphanedOverrides(clientId: string): Promise<string[]>

  /** accountIdをリネーム（マイグレーション用） */
  renameAccountId(oldId: string, newId: string): Promise<{
    updated: { master: boolean; overrides: string[]; mfAccounts: string[] }
  }>
}


// ============================================================
// § 4c. TaxMasterRepository（税区分マスタ編集）
// ============================================================

/**
 * 税区分マスタ編集へのデータアクセス
 *
 * 対象データ: tax-categories-master.json（マスタ税区分一覧）
 * 用途: マスタ管理画面での税区分編集・保存
 *
 * AccountMasterRepositoryと同パターン。
 */
export type TaxMasterRepository = {
  /** マスタ税区分全件取得（管理画面用） */
  getMaster(): Promise<TaxCategory[]>

  /** マスタ税区分全件上書き保存 */
  saveMaster(taxCategories: TaxCategory[]): Promise<{ ok: true; count: number }>

  /** 顧問先税区分全件取得 */
  getClient(clientId: string): Promise<{ taxCategories: TaxCategory[] }>

  /** 顧問先税区分全件上書き保存 */
  saveClient(clientId: string, taxCategories: TaxCategory[]): Promise<{ ok: true; count: number }>

  /** マスタ税区分フィルタ+ページネーション取得 */
  getFilteredMaster(params: { taxMethod: 'general' | 'individual' | 'proportional' | 'simplified' | 'exempt' | 'all'; page: number; pageSize: number }): Promise<{
    pagedItems: TaxCategory[]
    totalCount: number
    page: number
    totalPages: number
  }>

  /** 顧問先税区分フィルタ+ページネーション取得 */
  getFilteredClient(clientId: string, params: { taxMethod: 'general' | 'individual' | 'proportional' | 'simplified' | 'exempt' | 'all'; page: number; pageSize: number }): Promise<{
    pagedItems: TaxCategory[]
    totalCount: number
    page: number
    totalPages: number
  }>

  /** 税区分名マップ（ID→名前）を返す */
  getNameMap(): Promise<Record<string, string>>

  /** 顧問先別税区分をバリデーション用最小形式で返す */
  getClientTaxCategoriesForValidation(clientId: string): Promise<{
    taxCategoryId: string
    direction: TaxDirection
    simplifiedOnly?: boolean
    baseId?: string
    isExemptDefault?: boolean
    isUnknownDefault?: boolean
  }[]>
}

// ============================================================
// § 4d. LeadRepository（見込先マスタ）
// ============================================================

// Lead型は ./types/lead.types.ts から再公開済み
import type { Lead } from './types/lead.types'

/**
 * 見込先マスタへのデータアクセス
 *
 * 対象データ: leads.json（見込先一覧）
 * 用途: 見込先管理画面でのCRUD・一覧表示
 */
export type LeadRepository = {
  /** 全見込先取得 */
  getAll(): Promise<Lead[]>
  /** leadIdで1件取得 */
  getById(leadId: string): Promise<Lead | undefined>
  /** 見込先追加（サーバーでleadId発番。作成されたLeadを返す） */
  create(lead: Lead): Promise<Lead>
  /** 見込先更新（部分更新） */
  update(leadId: string, partial: Partial<Lead>): Promise<void>
  /** Drive共有フォルダ設定 */
  updateSharedFolderId(leadId: string, folderId: string): Promise<boolean>
  /** 見込先一覧（フィルタ+ソート+ページネーション） */
  list(query: {
    filters?: { field: string; operator: FilterOperator; value: string | string[] }[]
    logic?: 'and' | 'or'
    sorts?: { key: string; order: 'asc' | 'desc' }[]
    page?: number
    pageSize?: number
  }): Promise<{ rows: Lead[]; totalCount: number; page: number; pageSize: number; totalPages: number }>
  /** アクティブ見込先取得（status != converted && status != lost） */
  getActiveLeads(): Promise<Lead[]>
  /** ステータスで絞り込み */
  getByStatus(status: string): Promise<Lead[]>
  /** 担当スタッフ更新 */
  updateStaffAssignment(leadId: string, staffId: string): Promise<boolean>
  /** 共有メール更新 */
  updateSharedEmail(leadId: string, email: string): Promise<boolean>
  /** leadId発番 */
  generateLeadId(): Promise<string>
  /** 担当スタッフで絞り込み */
  getByStaffId(staffId: string): Promise<Lead[]>
}

// ============================================================
// § 5. ConfirmedJournalRepository（確定済み仕訳マスタ）
// ============================================================

/**
 * 確定済み仕訳マスタへのデータアクセス
 *
 * 対象データ: confirmed_journals_*.ts（未作成。T-03で型定義後に実装）
 * 用途: Step 2（過去仕訳照合）で match_key × 科目の履歴を取得
 */
export type ConfirmedJournalRepository = {
  /** 顧問先の確定済み仕訳全件取得 */
  getByClientId(clientId: string): Promise<Journal[]>

  /**
   * 顧問先の確定済み仕訳をmatch_key（照合キー）で絞り込み
   * 過去仕訳照合（Step 2）のコアメソッド
   */
  findByMatchKey(clientId: string, matchKey: string): Promise<Journal[]>

  /** 顧問先のインポートバッチ一覧を取得 */
  listBatches(clientId: string): Promise<{
    batches: {
      import_batch_id: string
      client_id?: string
      count: number
      imported_at: string
      min_voucher_date?: string
      max_voucher_date?: string
    }[]
  }>

  /** CSVテキストをパースしてインポート */
  importCsv(clientId: string, csvText: string): Promise<{
    ok: boolean
    added: number
    skipped: number
    total_in_db: number
    warnings?: string[]
    message?: string
  }>

  /** バッチを削除 */
  deleteBatch(batchId: string): Promise<{ removed: number }>

  /** バッチ内の仕訳一覧を取得 */
  getJournalsByBatch(batchId: string): Promise<{ journals: Journal[] }>

  /** 仕訳を重複排除付きで一括追加（CSVパース後/MF API変換後の生仕訳を受け取る） */
  importBatch(journals: Journal[]): Promise<{ added: number; skipped: number }>

  /** 顧問先の全件削除 */
  deleteByClientId(clientId: string): Promise<{ removed: number }>

  /** 顧問先の件数取得 */
  countByClientId(clientId: string): Promise<number>

  /** 顧問先の確定済み仕訳を全件置換（正規化後の書き戻し用） */
  replaceByClientId(clientId: string, journals: Journal[]): Promise<void>

  /** インメモリキャッシュをJSONから再読み込み（管理用。Supabase移行後は空実装） */
  reload(): Promise<void>
}

// ============================================================
// § 5b. LearningRuleRepository（学習ルールマスタ）
// ============================================================


/**
 * 学習ルールマスタへのデータアクセス
 *
 * 対象データ: learning_rules（顧問先別の学習ルール一覧）
 * 用途: 学習ルール管理画面でのCRUD・一覧表示
 */
export type LearningRuleRepository = {
  /** 顧問先のルール全件取得 */
  getByClientId(clientId: string): Promise<{ rules: LearningRule[] }>

  /** フィルタ付き一覧取得 */
  list(clientId: string, query: {
    sourceFilter?: string
    filterMode?: string
    searchText?: string
  }): Promise<{
    rules: LearningRule[]
    sourceCounts: { all: number; receipt: number; bank: number; credit: number }
    statusCounts: { all: number; active: number; inactive: number }
    generatedByCounts: { ai: number; human: number }
  }>

  /** ルール新規作成 */
  create(clientId: string, rule: LearningRule): Promise<{ rule: LearningRule }>

  /** ルール更新（部分更新） */
  update(clientId: string, ruleId: string, rule: Partial<LearningRule>): Promise<void>

  /** ルール削除 */
  deleteById(clientId: string, ruleId: string): Promise<void>
}

// ============================================================
// § 6. ShareStatusRepository（共有設定マスタ）
// ============================================================

// ShareStatus, ShareStatusRecord は ./types/share-status.types.ts から再公開済み
import type { ShareStatusRecord } from './types/share-status.types'

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
  updateStatus(clientId: string, status: import('./types/share-status.types').ShareStatus): Promise<void>

  /** 招待コードを保存 */
  saveInviteCode(clientId: string, code: string): Promise<void>

  /** 招待コードをサーバーで生成して返す */
  generateInviteCode(clientId: string): Promise<{ code: string }>

  /** 招待コードからclientIdを逆引き */
  resolveInviteCode(code: string): Promise<string | null>
}

// ============================================================
// § 7. DocumentRepository（資料マスタ）
// ============================================================

// DocEntry, DocSource, DocStatus, AI_FIELD_KEYS は ./types/doc-entry.types.ts から再公開済み
import type { DocEntry } from './types/doc-entry.types'

/**
 * 資料マスタへのデータアクセス
 *
 * 対象データ: 顧問先ごとの資料一覧
 * 用途: 資料選別画面、進捗管理の通知（未選別件数・資料受取日）
 */
export type DocumentRepository = {
  /** 全資料を取得 */
  getAll(): Promise<DocEntry[]>

  /** 顧問先の全資料を取得 */
  getByClientId(clientId: string): Promise<DocEntry[]>

  /** 資料の選別ステータスを更新（データ書き換えのみ） */
  updateStatus(id: string, updates: Partial<DocEntry>): Promise<void>

  /** 資料を1件保存（Drive取り込み/PCアップロード時） */
  save(doc: DocEntry): Promise<void>

  /** 資料を複数件一括保存（バッチ取り込み用） */
  saveBatch(docs: DocEntry[]): Promise<{ added: number; skipped: number }>

  /** 顧問先の全資料を削除 */
  removeByClientId(clientId: string): Promise<void>

  /** 選別完了→送出時にbatchId/journalIdを全件付与 */
  assignBatch(clientId: string): Promise<{ batchId: string; count: number }>

  /** firstAiデータ（ai*フィールド）を完全削除 */
  clearAiFields(clientId: string): Promise<void>

  /** IDで1件取得 */
  getById(id: string): Promise<DocEntry | undefined>

  /** IDで1件削除 */
  deleteById(id: string): Promise<boolean>

  /** 件数取得（clientIdフィルタ任意） */
  countDocuments(clientId?: string): Promise<number>

  /** AI解析結果を更新（変換済みのPartial<DocEntry>を受け取る） */
  updateAiResults(docId: string, aiResults: Partial<DocEntry>): Promise<boolean>
}

// ============================================================
// § PipelineRepository（アップロード・メトリクス）
// ============================================================

/** チャンクアップロード完了時のサーバー応答 */
export interface UploadCompleteResult {
  fileHash?: string
  thumbnail?: string
  isDuplicate?: boolean
  fileUrl?: string
}

/**
 * パイプラインRepository（アップロード・メトリクス・ハッシュ管理）
 *
 * useUpload.tsの直接fetchをRepository経由に移行。
 * Supabase移行時にStorage APIに差し替え可能。
 */
export interface PipelineRepository {
  /** チャンクアップロード（512KB単位のバイナリ送信） */
  uploadChunk: (chunk: Blob, uploadId: string) => Promise<void>
  /** アップロード完了通知（サーバーでチャンク結合+ハッシュ+サムネイル生成） */
  uploadComplete: (params: { uploadId: string; filename: string; documentId: string; clientId: string }) => Promise<UploadCompleteResult>
  /** メトリクス送信（fire-and-forget） */
  sendMetrics: (data: Record<string, unknown>) => void
  /** メトリクスビーコン送信（sendBeacon経由。クラッシュ時にも送信される可能性が高い） */
  sendMetricsBeacon: (data: Record<string, unknown>) => void
  /** サーバー側の重複ハッシュ記録をクリア */
  clearHashes: () => void
}

// § Repositories集約型（factory関数の戻り値型）
// ============================================================

// Staff, Client型はRepository interfaceの引数で使用
import type { Staff } from './types/staff.types'
import type { Client } from './types/client.types'

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
  /** 勘定科目マスタ編集（管理画面用） */
  accountMaster: AccountMasterRepository
  /** 税区分マスタ編集（管理画面用） */
  taxMaster: TaxMasterRepository
  /** 見込先マスタ */
  lead: LeadRepository
  /** 確定済み仕訳マスタ（過去仕訳照合用） */
  confirmedJournal: ConfirmedJournalRepository
  /** 共有設定マスタ（DL-031） */
  shareStatus: ShareStatusRepository
  /** 資料マスタ（DL-039） */
  document: DocumentRepository
  /** 学習ルールマスタ */
  learningRule: LearningRuleRepository
  /** 一覧ビュー設定（P3-1） */
  listView: ListViewRepository
  /** Drive連携（P3-2） */
  drive: DriveRepository
  /** エクスポート（P3-3） */
  export: ExportRepository
  /** MF認証・連携（P3-4） */
  mfAuth: MfAuthRepository
  /** 添付ファイル（P3-5） */
  attachment: AttachmentRepository
  /** コメント（P3-5） */
  comment: CommentRepository
  /** 管理画面（P3-6） */
  admin: AdminRepository
  /** 顧問先別税区分（P3-7） */
  clientTaxCategory: ClientTaxCategoryRepository
  /** 見込先拡張（一括・変換）（P3-7） */
  leadExtra: LeadExtraRepository
  /** 仕訳（P3-8） */
  journal: JournalRepository
  /** パイプライン（アップロード・メトリクス・ハッシュ） */
  pipeline: PipelineRepository
  /** 出力履歴 + CSVスナップショット */
  exportHistory: ExportHistoryRepository
  /** 通知 */
  notification: NotificationRepository
  /** 活動ログ（Phase 3.7） */
  activityLog: ActivityLogRepository
  /** CSV変換ログ（Phase 3.7） */
  conversionLog: ConversionLogRepository
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
  /** スタッフ追加（サーバーでuuid発番。作成されたStaffを返す） */
  create(staff: Omit<Staff, 'uuid'> & { uuid?: string }): Promise<Staff>
  /** スタッフ更新（部分更新） */
  update(uuid: string, partial: Partial<Staff>): Promise<void>
  /** スタッフ一覧（フィルタ+ソート+ページネーション） */
  list(query: {
    statusFilter?: 'all' | 'active' | 'inactive'
    sortKey?: string
    sortOrder?: 'asc' | 'desc'
    page?: number
    pageSize?: number
  }): Promise<{ rows: Staff[]; totalCount: number; totalPages: number }>
  /** スタッフ一括追加（CSVインポート用） */
  bulkCreate(items: Record<string, unknown>[]): Promise<{
    ok: boolean
    results: { index: number; ok: boolean; uuid?: string; error?: string }[]
    total: number
  }>
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
  /** 顧問先追加（サーバーでclientId発番。作成されたClientを返す） */
  create(client: Client): Promise<Client>
  /** 顧問先更新（部分更新） */
  update(clientId: string, partial: Partial<Client>): Promise<void>
  /** 顧問先一覧（フィルタ+ソート+ページネーション） */
  list(query: {
    filters?: { field: string; operator: FilterOperator; value: string | string[] }[]
    logic?: 'and' | 'or'
    sorts?: { key: string; order: 'asc' | 'desc' }[]
    page?: number
    pageSize?: number
  }): Promise<{ rows: Client[]; totalCount: number; page: number; pageSize: number; totalPages: number }>
  /** 顧問先一括追加（CSVインポート用） */
  bulkCreate(items: Record<string, unknown>[]): Promise<{
    ok: boolean
    results: { index: number; ok: boolean; clientId?: string; threeCode?: string; companyName?: string; error?: string }[]
    total: number
  }>

  /** threeCode（3文字コード）で1件取得 */
  getByThreeCode(code: string): Promise<Client | undefined>

  /** ステータス別取得 */
  getByStatus(status: ClientStatus): Promise<Client[]>

  /** 新しいclientIdを生成 */
  generateClientId(): Promise<string>
}

// ============================================================
// § P3-1: ListViewRepository（一覧ビュー設定）
// ============================================================

export type ListViewRepository = {
  /** エンティティ別のビュー一覧取得 */
  getViews(entityType: string): Promise<{ views: unknown[] }>
  /** エンティティ別のビュー一覧保存（全件上書き） */
  saveViews(entityType: string, data: unknown): Promise<{ success: boolean }>
}

// ============================================================
// § P3-2: DriveRepository（Drive連携）
// ============================================================

export type DriveRepository = {
  /** フォルダ内ファイル一覧取得 */
  getFiles(folderId: string, withThumbnails?: boolean): Promise<unknown>
  /** フォルダ作成 */
  createFolder(data: { clientId: string; parentFolderId?: string; folderName: string; sharedEmail?: string }): Promise<unknown>
  /** フォルダ存在確認 */
  checkFolder(folderId: string): Promise<unknown>
  /** ファイルアップロード */
  upload(formData: FormData): Promise<unknown>
  /** 移行ジョブ開始 */
  migrate(data: unknown): Promise<unknown>
  /** 移行ステータス確認 */
  getMigrateStatus(jobId: string): Promise<unknown>
  /** 移行ジョブ一覧（顧問先別） */
  getMigrateJobs(clientId: string): Promise<unknown>
  /** 検証済みダウンロード（顧問先別） */
  downloadSupporting(clientId: string, params?: { jobId?: string; all?: boolean }): Promise<unknown>
  /** 除外ダウンロード（顧問先別） */
  downloadExcluded(clientId: string, params?: { jobId?: string; all?: boolean }): Promise<unknown>
  /** 検証済み履歴（顧問先別） */
  getSupportingHistory(clientId: string): Promise<unknown>
  /** 除外履歴（顧問先別） */
  getExcludedHistory(clientId: string): Promise<unknown>
  /** 検証済みメタ保存 */
  saveSupportingMeta(clientId: string, data: unknown): Promise<unknown>
  /** 権限付与 */
  grantPermission(data: { email: string; folderId: string }): Promise<unknown>
  /** 権限取り消し */
  revokePermission(data: { email: string; folderId: string }): Promise<unknown>
  /** 仕訳外件数取得 */
  getExcludedCount(clientId: string): Promise<unknown>
  /** 単社Driveポーリング（新着ファイル取込） */
  pollClient(clientId: string): Promise<{ ok: boolean; added?: number; error?: string }>
  /** 全社一括Driveポーリング */
  pollAll(): Promise<{ ok: boolean; targetCount: number; totalAdded: number; totalErrors: number; details: Array<{ clientId: string; companyName: string; added: number; error: string | null }> }>
}

// ============================================================
// § P3-3: ExportRepository（エクスポート）
// ============================================================

export type ExportRepository = {
  /** エクスポート一覧取得 */
  getExportList(data: unknown): Promise<unknown>
  /** エクスポート詳細取得 */
  getExportDetail(data: unknown): Promise<unknown>
  /** エクスポート履歴取得（顧問先別） */
  getHistory(clientId: string): Promise<unknown>
  /** エクスポート履歴保存（顧問先別） */
  saveHistory(clientId: string, data: unknown): Promise<unknown>
  /** CSVスナップショット取得 */
  getCsvSnapshot(clientId: string, historyId: string): Promise<unknown>
  /** CSVスナップショット保存 */
  saveCsvSnapshot(clientId: string, data: unknown): Promise<unknown>
  /** 仕訳ステータスPATCH（出力済み更新） */
  patchJournalStatus(clientId: string, journalId: string, data: unknown): Promise<unknown>
}

// ============================================================
// § P3-4: MfAuthRepository（MF認証・連携）
// ============================================================

export type MfAuthRepository = {
  /** 認証ステータス確認（顧問先別） */
  getAuthStatus(clientId: string): Promise<unknown>
  /** 認証ステータス一括確認 */
  getAuthStatusBulk(clientIds: string[]): Promise<unknown>
  /** 認証URL取得 */
  getAuthUrl(clientId: string): Promise<unknown>
  /** MFマスター科目インポート */
  importMasterAccounts(): Promise<unknown>
  /** MF顧問先科目インポート */
  importClientAccounts(clientId: string): Promise<unknown>
  /** MF決算期チェック */
  fiscalCheck(clientId: string): Promise<unknown>
  /** MF事業所インポート */
  importOffices(data: unknown): Promise<unknown>
  /** MCP仕訳送信 */
  sendJournals(clientId: string, data: { journalIds: string[] }): Promise<unknown>
  /** 期設定取得 */
  getTermSettings(clientId: string): Promise<unknown>
  /** MFインポート仕訳 */
  importJournals(data: unknown): Promise<unknown>
}

// ============================================================
// § P3-5a: AttachmentRepository（添付ファイル）
// ============================================================

export type AttachmentRepository = {
  /** 添付ファイルアップロード */
  upload(entityId: string, formData: FormData): Promise<unknown>
  /** 添付ファイル削除 */
  deleteFile(entityId: string, fileId: string): Promise<void>
}

// ============================================================
// § P3-5b: CommentRepository（コメント）
// ============================================================

export type CommentRepository = {
  /** エンティティのコメントを取得（新しい順） */
  getByEntity(entityType: string, entityId: string): Promise<Comment[]>
  /** コメント追加 */
  create(comment: Comment): Promise<Comment>
  /** コメント削除 */
  deleteById(commentId: string): Promise<boolean>
  /** エンティティの全コメントを削除。削除件数を返す */
  deleteAllByEntity(entityType: string, entityId: string): Promise<number>
}

// ============================================================
// § P3-6: AdminRepository（管理画面）
// ============================================================

export type AdminRepository = {
  /** AIコスト設定取得 */
  getAiCostConfig(): Promise<unknown>
  /** 活動ログサマリー取得 */
  getActivitySummary(): Promise<unknown>
  /** タスクサマリー取得 */
  getTaskSummary(): Promise<unknown>
  /** 進捗一覧取得 */
  getProgressList(data: unknown): Promise<unknown>
  /** 移行ジョブ一覧（顧問先別） */
  getMigrateJobs(clientId: string): Promise<unknown>
}

// ============================================================
// § P3-7a: ClientTaxCategoryRepository（顧問先別税区分）
// ============================================================

export type ClientTaxCategoryRepository = {
  /** 顧問先の税区分一覧取得 */
  getByClient(clientId: string, params?: { pageSize?: number; taxMethod?: string }): Promise<unknown>
  /** 顧問先の税区分保存 */
  saveByClient(clientId: string, data: unknown): Promise<unknown>
}

// ============================================================
// § P3-7b: LeadRepository拡張（一括作成・顧問先変換）
// ============================================================

export type LeadExtraRepository = {
  /** 一括インポート */
  bulkCreate(data: unknown): Promise<unknown>
  /** 見込先→顧問先変換 */
  convert(leadId: string): Promise<unknown>
}

// ============================================================
// § P3-8: JournalRepository（仕訳）
// ============================================================

export type JournalRepository = {
  /** 1件取得 */
  get(clientId: string, journalId: string): Promise<Journal | null>
  /** 顧問先の全件取得 */
  list(clientId: string): Promise<Journal[]>
  /** 1件追加。発番後のJournalを返す */
  create(clientId: string, journal: Journal): Promise<Journal>
  /** 複数件追加。追加件数とID一覧を返す */
  createMany(clientId: string, journals: Journal[]): Promise<{ added: number; ids: string[] }>
  /** 1件部分更新。見つからなければnull */
  update(clientId: string, journalId: string, patch: Partial<Journal>): Promise<Journal | null>
  /** 複数件部分更新。更新件数を返す */
  updateMany(clientId: string, patches: { journalId: string; patch: Partial<Journal> }[]): Promise<{ updated: number }>
  /** 1件ソフトデリート（deleted_atを設定）。見つからなければnull */
  delete(clientId: string, journalId: string): Promise<Journal | null>
  /** 複数件ソフトデリート。削除件数を返す */
  deleteMany(clientId: string, journalIds: string[]): Promise<{ deleted: number }>
}

// ============================================================
// § ExportHistoryRepository（出力履歴 + CSVスナップショット）
// ============================================================

/** 出力履歴エントリ */
export interface ExportHistoryEntry {
  id: string
  exportDate: string
  fileName: string
  /** 仕訳件数（証票数） */
  count: number
  /** CSV行数（複合仕訳展開後） */
  csvLineCount?: number
  /** 出力者スタッフID */
  staffId?: string
  status: string
}

/** CSVスナップショット */
export interface CsvSnapshot {
  historyId: string
  fileName: string
  exportDate: string
  journalCount: number
  csvContent: string
}

/** 期間別集計バケット */
export interface PeriodBucket {
  csvLineCount: number
  journalCount: number
  exportCount: number
}

export type ExportHistoryRepository = {
  /** 顧問先の出力履歴を取得 */
  getByClientId(clientId: string): Promise<ExportHistoryEntry[]>
  /** 出力履歴を追加（サーバーでID発番） */
  add(clientId: string, entry: Omit<ExportHistoryEntry, 'id'>): Promise<ExportHistoryEntry>
  /** CSVスナップショット取得 */
  getCsvSnapshot(clientId: string, historyId: string): Promise<CsvSnapshot | null>
  /** CSVスナップショット保存 */
  saveCsvSnapshot(clientId: string, snapshot: CsvSnapshot): Promise<void>
  /** 全顧問先のCSV出力実績集計 */
  summarizeCsvLines(): Promise<{
    thisMonth: PeriodBucket
    monthlyAvg: PeriodBucket
    lastYearSameMonth: PeriodBucket
    thisYear: PeriodBucket
    lastYear: PeriodBucket
    byClient: { clientId: string; thisMonth: PeriodBucket; thisYear: PeriodBucket; lastYear: PeriodBucket }[]
    byStaff: { staffId: string; thisMonth: PeriodBucket; thisYear: PeriodBucket; lastYear: PeriodBucket }[]
  }>
}

// ============================================================
// § NotificationRepository（通知）
// ============================================================

export type NotificationRepository = {
  /** 全通知を取得（新しい順） */
  getAll(): Promise<AppNotification[]>
  /** 指定スタッフ宛の通知を取得 */
  getForStaff(staffId: string): Promise<AppNotification[]>
  /** 通知を追加 */
  add(notification: AppNotification): Promise<void>
  /** 指定スタッフが通知を既読にする */
  markAsRead(id: string, staffId: string): Promise<boolean>
  /** 指定スタッフが全通知を既読にする */
  markAllAsRead(staffId: string): Promise<void>
  /** 通知を削除 */
  deleteById(id: string): Promise<boolean>
  /** 全通知を削除 */
  clearAll(): Promise<void>
}

// ============================================================
// § Comment型（commentStore.ts由来）
// ============================================================

/** コメント1件の型 */
export interface Comment {
  /** コメントID（cmt-xxxxxxxx） */
  id: string
  /** エンティティ種別（client / lead） */
  entityType: 'client' | 'lead'
  /** エンティティID（clientId / leadId） */
  entityId: string
  /** 投稿者名 */
  author: string
  /** 本文 */
  body: string
  /** 日時文字列 */
  date: string
}

// ============================================================
// § ActivityLogRepository（活動ログ）— Phase 3.7で追加
// ============================================================

import type { ActivityLog, StaffActivitySummary, ClientActivitySummary } from './types/activity.types'

/**
 * 活動ログへのデータアクセス
 *
 * 対象データ: data/activity-log.json
 * 用途: スタッフ別・顧問先別の稼働時間計測・集計
 */
export type ActivityLogRepository = {
  /** ログ1件追加 */
  addLog(entry: Omit<ActivityLog, 'id'>): Promise<ActivityLog>
  /** 全件取得 */
  getAll(): Promise<ActivityLog[]>
  /** スタッフID指定で取得 */
  getByStaff(staffId: string): Promise<ActivityLog[]>
  /** 顧問先ID指定で取得 */
  getByClient(clientId: string): Promise<ActivityLog[]>
  /** スタッフ別集計（今月） */
  summarizeByStaff(): Promise<StaffActivitySummary[]>
  /** 顧問先別集計（今月） */
  summarizeByClient(): Promise<ClientActivitySummary[]>
  /** スタッフ×顧問先クロス集計（今月） */
  summarizeCross(): Promise<{ staffId: string; clientId: string; totalActiveMs: number }[]>
}

// ============================================================
// § ConversionLogRepository（CSV変換ログ）— Phase 3.7で追加
// ============================================================

/** CSV変換ログ1件の型 */
export interface ConversionLog {
  id: string
  timestamp: string
  clientName: string
  sourceSoftware: string
  targetSoftware: string
  fileName: string
  size: number
  csvPath: string
  isDownloaded: boolean
}

/**
 * CSV変換ログへのデータアクセス
 *
 * 対象データ: data/conversion-logs.json + data/conversions/
 * 用途: CSVファイル変換履歴のCRUD
 */
export type ConversionLogRepository = {
  /** 全ログ取得 */
  getAllLogs(): Promise<ConversionLog[]>
  /** 変換ログ+CSVファイルを追加 */
  addLog(clientName: string, sourceSoftware: string, targetSoftware: string, csvContent: string, fileName: string): Promise<ConversionLog>
  /** ダウンロード済みマーク */
  markAsDownloaded(id: string): Promise<boolean>
  /** ログ削除（CSVファイルも削除） */
  deleteLog(id: string): Promise<boolean>
  /** CSVファイルのフルパスを取得 */
  getCsvFilePath(id: string): Promise<string | null>
}
