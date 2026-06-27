/**
 * 統一仕訳型定義（journal.type.ts）
 *
 * 全経路（AI生成・MF CSV取込・MF MCP取込・手動作成・旧データ）の
 * 仕訳を単一の型で表現する。
 *
 * 準拠: docs/genzai/60_journal_domain_model.md
 *
 * 統合元（廃止済み）:
 *   - JournalPhase5Mock: src/types/journal_phase5_mock.type.ts → Phase 2で廃止
 *   - ConfirmedJournal: src/types/confirmed_journal.type.ts → Phase 2で廃止
 *
 * Phase 2: JournalPhase5Mock / ConfirmedJournal → Journal に統一完了。
 */

import type { StaffNotes } from './staff_notes'
import type { DeterminationMethod } from './determination-method'
import type { JournalLabel, JournalEntryLine } from '@/types/domain-journal'
import type { SourceType, Direction } from './pipeline/source_type.type'
import type { VendorVector } from './pipeline/vendor.type'

// domain層（ドメイン層）からの再export（他ファイルがjournal.type.tsから一括importできるようにする）
export type { JournalLabel, JournalEntryLine }

// ============================================================
// ステータス定義（2値 + null）
// ============================================================

/**
 * 仕訳ステータス
 *
 * null: 通常状態（未出力、編集可能）
 * 'exported': 出力済み（CSV/MCP送信完了、編集不可）
 * 'historical': 過去仕訳（参照専用、編集不可、出力不可）
 */
export type JournalStatus =
  | 'exported'     // 出力済み（CSV出力完了、編集不可）
  | 'historical'   // 過去仕訳（参照専用。ConfirmedJournalの後継）
  | null;          // 未出力（デフォルト）

// ============================================================
// モック専用ラベル（domain JournalLabel + 導出ラベル + 事実ラベル）
// ============================================================

import type { StaffNoteKey } from './staff_notes'

export type JournalLabelMock =
  | JournalLabel

  // ── 導出ラベル（毎回再計算。Supabase では保存しない）──
  // syncWarningLabelsCore() が計算する警告ラベル
  | 'CATEGORY_CONFLICT'       // 貸借科目矛盾（3大グループ）
  | 'TAX_UNKNOWN'             // 税区分不明
  | 'DESCRIPTION_UNKNOWN'     // 摘要不明
  | 'VOUCHER_TYPE_CONFLICT'   // 証票意味矛盾
  | 'TAX_ACCOUNT_MISMATCH'    // 税区分科目矛盾
  | 'DATE_OUT_OF_RANGE'       // 日付異常（未来日付・期外日付）
  | 'SAME_ACCOUNT_BOTH_SIDES' // 借方貸方に同一科目

  // ── 導出ラベル（determination_method / level から導出可能）──
  | 'AI_ESTIMATED'            // AI推定科目（level='B'）→ determination_method === 'ai_fallback' で導出可能

  // ── 事実ラベル（ユーザー操作 or バリデーション結果。永続化必須）──
  | 'DIRECTOR_LOAN'           // 役員貸付金検出（バリデーション結果）

  // ── 移行予定ラベル（staff_notesに移行済み。syncLabelsFromStaffNotes()が書き戻し中）──
  | StaffNoteKey              // QUESTION / NEEDS_REVIEW / RESOLVED / IMPORTANT

  // ── 事実ラベル（出力制御。Phase Cでexport_excludeカラムに移行予定）──
  | 'EXPORT_EXCLUDE';        // 出力対象外（ユーザー操作）

// ============================================================
// データ経路（source）— 5値。NOT NULL（設計書§2.1）
// ============================================================

export type JournalSource =
  | 'ai_pipeline'  // AI生成（パイプラインで生成）
  | 'manual'       // 手動作成（スタッフが手動作成）
  | 'mf_import'    // MF CSV取込（MF仕訳帳CSVからインポート）
  | 'system'       // MF MCP取込（MF MCP APIからインポート）
  | 'legacy';      // 旧データ（パイプライン実装前の仕訳）

// ============================================================
// Journal 統一仕訳型
// 準拠: 60_journal_domain_model.md 第2部〜第9部
// ============================================================

export interface Journal {
  // ── 基本情報（事実。§2.2 #3-#14）──

  /** 仕訳ID（jrn-00000001形式。接頭辞+連番、一意ID） */
  journalId: string;
  /** 顧問先ID（例: LDI-00008、接頭辞+連番） */
  client_id: string;
  /** 表示順 */
  display_order: number;
  /**
   * 取引日（voucher_date）
   *
   * 初期値: 証憑に記載された日付（STREAMED/AIが読み取った伝票日）
   * ユーザーが取引実態に合わせて修正可能。
   * nullable（null許容）: 証憑から日付が読み取れない場合。
   * MF取込仕訳は常に値あり。
   */
  voucher_date: string | null;
  /**
   * 日付の項目存在フラグ（date_on_document）
   * false（項目なし）+ null → DATE_UNKNOWN（日付不明）
   * true（項目あり）+ null → DATE_UNKNOWN（日付不明）
   * MF取込仕訳はtrue固定。
   */
  date_on_document: boolean;
  /** 摘要（空文字許容。NOT NULL） */
  description: string;
  /**
   * @deprecated 旧証票意味（将来削除予定）
   * パイプライン移行後は source_type / direction / vendor_vector を使用すること。
   * 現在のUI表示・CSVエクスポートとの後方互換性のため残存。
   * UIでユーザーが手動編集可能なため、JSONに保存を維持（§4.4参照）。
   */
  voucher_type: string | null;

  // ── データ経路（source）（§2.1 #1-#2）──

  /**
   * データ経路（source）— NOT NULL（設計書§2.1 L106）
   * 全仕訳に設定済み（タスク3実施済み）。
   * isImportedJournal()（取込仕訳判定関数）はsourceの値で判定。
   */
  source: JournalSource;

  // ── パイプライン3フィールド（§2.3 #15-#16）──

  /** 証票種類（receipt/invoice_received等11種）。MF取込仕訳はnull */
  source_type: SourceType | null;
  /** 仕訳方向（expense（出金）/income（入金）/transfer（振替）/mixed（混在））。MF取込仕訳は3値（mixedなし） */
  direction: Direction | null;
  /** 証票業種（restaurant/cafe/taxi等66種）。MF取込仕訳はnull */
  vendor_vector: VendorVector | null;

  // ── 取引先特定結果（§2.2 #11-#12）──

  /** 取引先ID（vendors_global/client の vendor_id。照合成功時に設定） */
  vendor_id: string | null;
  /** 取引先名（表示用。照合成功時はマスタ名、失敗時はAI抽出名） */
  vendor_name: string | null;

  // ── 照合キー（§2.2 #13）──

  /**
   * 照合キー（match_key）
   * normalizeVendorName(description)（取引先名正規化関数）の出力。
   * 科目確定Step 2（過去仕訳照合）で使用。
   * AI仕訳: Phase 4で付与予定。MF取込仕訳: 取込時に付与。
   */
  match_key?: string | null;

  // ── 証票紐付け（§2.3 #18-#19）──

  /** 証票ID（documentsテーブル参照）。MF取込仕訳はnull */
  document_id: string | null;
  /** 証票行ID（冗長だがクエリ高速化用）。MF取込仕訳はnull */
  line_id: string | null;

  // ── N対N複合仕訳（無制限、UI上限15行）──

  /** 借方明細（配列） */
  debit_entries: JournalEntryLine[];
  /** 貸方明細（配列） */
  credit_entries: JournalEntryLine[];

  // ── ステータス・ワークフロー（§2.5 #32-#34）──

  /** ステータス（null=未出力, 'exported'=出力済み, 'historical'=過去仕訳） */
  status: JournalStatus;
  /** 既読フラグ。MF取込仕訳はtrue固定 */
  is_read: boolean;
  /** 既読操作者（誰がマークしたか） */
  read_by?: string | null;
  /** 既読日時（ISO 8601） */
  read_at?: string | null;
  /** ゴミ箱日時（null=有効、non-null=ゴミ箱入り）。MF取込仕訳はnull固定 */
  deleted_at: string | null;
  /** 削除操作者スタッフID */
  deleted_by?: string | null;

  // ── ラベル（§2.12。22種類+導出ラベル、非排他的）──

  /** ラベル配列。MF取込仕訳はデフォルト空配列 */
  labels: JournalLabelMock[];
  /** 警告確認済み（ユーザーが「確認済み」とした警告タイプを記録）。MF取込仕訳はデフォルト空配列 */
  warning_dismissals: string[];
  /** 警告の具体的理由（ホバーツールチップで表示）。キャッシュ（JSON保存除外済み） */
  warning_details: Record<string, string>;

  // ── 出力・MF送信（§2.6 #35-#38）──

  /** 出力バッチID（CSVダウンロード時に設定） */
  export_batch_id: string | null;
  /** クレジットカード払い判定（Gemini層A、独立カラム）。MF取込仕訳はfalse */
  is_credit_card_payment: boolean;

  // ── ルール関連（§2.3 #22）──

  /** ルールID。MF取込仕訳はnull */
  rule_id: string | null;

  // ── インボイス関連（§2.7 #44-#45）──

  /** インボイスステータス */
  invoice_status: 'qualified' | 'not_qualified' | null;
  /** インボイス番号（T + 13桁） */
  invoice_number: string | null;

  // ── メモ関連（§2.7 #39-#41。証票メモ: 顧問先が証票に記載したメモ）──

  /** メモ内容 */
  memo: string | null;
  /** メモ作成者 */
  memo_author: string | null;
  /** メモ宛先 */
  memo_target: string | null;
  /** メモ作成日時（ISO 8601） */
  memo_created_at: string | null;

  // ── スタッフノート（§2.7 #42-#43。スタッフが自発的に記入するコメント）──

  /** 4カテゴリの対応情報 */
  staff_notes?: StaffNotes | null;
  /** 担当者名 */
  staff_notes_author?: string | null;

  // ── MF送信結果（MCP経由送信後に紐付け。§2.6 #36-#38）──

  /** MF内部ID（Base64エンコード文字列） */
  mf_journal_id?: string | null;
  /** MF取引No（自動採番） */
  mf_journal_number?: number | null;
  /** MF送信日時（ISO 8601） */
  mf_sent_at?: string | null;

  // ── 出力関連（監査。§2.9 #54-#55）──

  /** CSV出力日時（ISO 8601） */
  exported_at?: string | null;
  /** CSV出力者（スタッフID） */
  exported_by?: string | null;

  // ── 監査用（§2.9 #47-#53）──

  /** 作成日時（＝取込日） */
  created_at?: string | null;
  /** 更新日時 */
  updated_at?: string | null;
  /** 作成者（スタッフID or 'AI'） */
  created_by?: string | null;
  /** 更新者 */
  updated_by?: string | null;

  // ── AI推定関連（§2.3 #21, #23-#24）──

  /** AI仕訳生成完了日時 */
  ai_completed_at?: string | null;
  /** 科目確定方法（determination_method） */
  determination_method?: DeterminationMethod | null;
  /** 推定信頼度 */
  prediction_score?: number | null;
  /** 使用モデルバージョン */
  model_version?: string | null;

  // ── MF専用メタデータ（§2.4 #25-#31。AI仕訳ではNULL固定）──

  /** MF仕訳タイプ（簡単入力 / 振替伝票 等。MF CSV 22列目） */
  mf_journal_type?: string | null;
  /** 決算整理仕訳フラグ（MF CSV 23列目）。AI仕訳はfalse */
  is_closing_entry?: boolean;
  /** タグ（MF CSV 21列目） */
  tags?: string | null;
  /** MF取引No（CSVの元行番号。重複排除に使用） */
  mf_transaction_no?: number | null;
  /** インポートバッチID（どのCSVインポートで入ったか） */
  import_batch_id?: string | null;
  /** インポート日時（ISO 8601） */
  imported_at?: string | null;
  /**
   * MF API生レスポンス（全フィールド保持）
   * MFデータ取込時にMfMcpJournalをまるごと格納。
   * CSVインポート時はnull。
   */
  mf_raw?: Record<string, unknown> | null;
}
