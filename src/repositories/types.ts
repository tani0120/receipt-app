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
 *   types.ts                    ← このファイル（全Repository型を集約）
 *   mock/                       ← モック実装（TSファイルからデータ取得）
 *   supabase/                   ← 将来作成（フェーズ5）
 *   index.ts                    ← factory関数（環境切り替え）
 *
 * 準拠: pipeline_design_master.md DL-030
 */

import type { Vendor, IndustryVectorEntry, VendorVector } from '@/mocks/types/pipeline/vendor.type'
import type { Account } from '@/shared/types/account'

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
// § Repositories集約型（factory関数の戻り値型）
// ============================================================

/**
 * 全Repositoryをまとめた集約型
 * createRepositories()の戻り値として使用
 */
export type Repositories = {
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
}
