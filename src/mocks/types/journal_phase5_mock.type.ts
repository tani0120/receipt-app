
import type { StaffNotes } from './staff_notes'

// ============================================================
// domain層からの再export（型の出自はdomain層）
// ============================================================
import type { JournalLabel, JournalEntryLine } from '@/domain/types/journal';
export type { JournalLabel, JournalEntryLine };
import type { SourceType, Direction } from './pipeline/source_type.type';
import type { VendorVector } from './pipeline/vendor.type';


/**
 * Phase 5 仕訳モック型定義
 *
 * 目的: UIモック検証用の型定義（Supabase実装前）
 * 準拠: journal_v2_20260214.md（Definition B）
 *
 * JournalLabel: domain層で定義（22種）
 * JournalLabelMock: mocks層専用（domain + Phase B/C用ラベル）
 */

// ============================================================
// ステータス定義（1種類 + null）
// ============================================================

export type JournalStatusPhase5 =
  | 'exported'  // 出力済み（CSV出力完了、編集不可）
  | null;       // 未出力（デフォルト）

// ============================================================
// モック専用ラベル（domain JournalLabel + Phase B/C用）
// Phase B/Cで除去予定の型はここに残す
// ============================================================



export type JournalLabelMock =
  | JournalLabel

  // --- 警告列バリデーション用（warningLabelMapと対応） ---
  | 'CATEGORY_CONFLICT'       // 貸借科目矛盾（3大グループ）
  | 'TAX_UNKNOWN'             // 税区分不明
  | 'DESCRIPTION_UNKNOWN'     // 摘要不明
  | 'VOUCHER_TYPE_CONFLICT'   // 証票意味矛盾
  | 'TAX_ACCOUNT_MISMATCH'   // 税区分科目矛盾
  | 'DATE_OUT_OF_RANGE'       // 日付異常（未来日付・期外日付）

  // --- 以下はPhase B/Cで除去予定（現在のモックで使用中） ---

  // 要対応（4個）— staff_notesに移行済み。syncLabelsFromStaffNotes()が書き戻し中（B4で廃止）
  | 'NEED_DOCUMENT'          // 書類が不足
  | 'NEED_INFO'              // 情報が不足
  | 'REMINDER'               // 備忘メモ
  | 'NEED_CONSULT'           // 社内相談する

  // 出力制御（1個）— Phase Cでexport_excludeカラムに移行予定
  | 'EXPORT_EXCLUDE';        // 出力対象外

// ============================================================
// Phase 5 仕訳モック定義
// 準拠: 12_full_schema_design_20260311.md §5.1
// ============================================================

export interface JournalPhase5Mock {
  // 基本情報
  // TODO Supabase: id→VARCHAR(20) PK, client_id→VARCHAR(20) FK
  id: string;                           // jrn-00000001形式（接頭辞+連番、一意ID）
  client_id: string;                     // 顧問先ID（例: LDI-00008、接頭辞+連番）
  display_order: number;                 // 表示順
  /**
   * 取引日（voucher_date）
   *
   * 【3つの日付概念と本システムの方針】
   *   取引日: 経済活動が実際に起きた日（物の引渡日、サービスの提供完了日）
   *   伝票日: 証憑（レシート・請求書等）に記載された日付
   *   計上日: 帳簿上の収益・費用とする日（決算整理で取引日とずれる場合がある）
   *
   * 【本システムの方針（C案）】
   *   - 初期値: 証憑に記載された日付（STREAMED/AIが読み取った伝票日）
   *   - ユーザーが取引実態に合わせて修正可能
   *   - 伝票日と取引日がずれるケース（月またぎ仕入等）はユーザー修正で対応
   *   - 計上日は管理しない（決算整理はMF側の責務）
   *   - nullable: 証憑から日付が読み取れない場合
   *   - 税区分の期間制御はUI側のみ（保存時バリデーションなし）
   *
   * 【根拠】
   *   - STREAMEDも証憑日付ベースで処理
   *   - MF CSV出力の「取引日」カラムと一致
   *   - 実務上99%は伝票日=取引日（中小企業）
   */
  // TODO Supabase: voucher_date→DATE型
  voucher_date: string | null;
  /**
   * 日付の項目存在フラグ（date_on_document）
   * false（項目なし）+ null → DATE_UNKNOWN（日付不明）ホバー「証憑に日付の記載がありません」
   * true（項目あり）+ null → DATE_UNKNOWN（日付不明）ホバー「日付の読み取りに失敗しました」
   */
  date_on_document: boolean;
  description: string;                   // 摘要
  /**
   * @deprecated 旧証票意味（将来削除予定）
   * パイプライン移行後は source_type / direction / vendor_vector を使用すること。
   * 現在のUI表示・CSVエクスポートとの後方互換性のため残存。
   */
  voucher_type: string | null;           // 証票意味（売上/経費/給与/立替経費/振替/クレカ/クレカ引落/その他）

  // ── パイプライン3フィールド（T-00b追加 2026-04-02 / 再設計 2026-04-02）──
  // Step 0出力: 証票種類（11種。Gemini直接判定）
  // Step 1出力: 仕訳方向（4種。expense/income/transfer/mixed）
  // Step 3出力: 証票業種ベクトル（66種）
  // 全て nullable（パイプライン未実行 or non_journalの場合はnull）
  source_type: SourceType | null;        // 証票種類（receipt/invoice_received/bank_statement等11種）
  direction: Direction | null;           // 仕訳方向（expense（出金）/income（入金）/transfer（振替）/mixed（混在））
  vendor_vector: VendorVector | null;    // 証票業種（restaurant/cafe/taxi等66種）
  // ─────────────────────────────────────────────────────────────


  // 証票紐付け（スキーマ準拠）
  document_id: string | null;             // 証票ID（documentsテーブル参照）
  line_id: string | null;                 // 証票行ID（冗長だがクエリ高速化用）

  // N対N複合仕訳（無制限、UI上限15行）
  // TODO Supabase: debit_entries/credit_entries→journal_entriesテーブルに分離（§5.2）
  debit_entries: JournalEntryLine[];     // 借方明細（配列）
  credit_entries: JournalEntryLine[];    // 貸方明細（配列）

  // ステータス（並列遷移、exported戻し可）
  status: JournalStatusPhase5;

  // 未読/既読（背景色管理）
  is_read: boolean;
  // 既読操作者（誰がマークしたか）
  read_by?: string | null;
  // 既読日時（ISO 8601）
  read_at?: string | null;

  // ゴミ箱（論理削除・ワークフロー終了状態）
  // null = 有効、non-null = ゴミ箱（削除日時）
  // 制約: exported && deleted_at は禁止（外部出力済みの仕訳はゴミ箱不可）
  // 許可: export_exclude && deleted_at は許可（外部未出力のため）
  // TODO Supabase: deleted_at→TIMESTAMPTZ
  deleted_at: string | null;
  // 削除操作者スタッフID
  deleted_by?: string | null;

  // ラベル（22種類、非排他的）
  labels: JournalLabelMock[];

  // 警告確認済み（ユーザーが「確認済み」とした警告タイプを記録）
  // syncWarningLabelsCoreで警告を再計算する際、ここに含まれるタイプはスキップされる
  // TODO Supabase: journal_warning_dismissalsテーブルに分離（journal_id, warning_type, dismissed_by, dismissed_at）
  warning_dismissals: string[];

  // 警告の具体的理由（ホバーツールチップで表示）
  // キー=警告ラベル名、値=日本語の詳細理由（例: 「借方合計5,000 ≠ 貸方合計3,000」）
  // syncWarningLabelsCoreで自動設定される
  warning_details: Record<string, string>;

  // 出力バッチID（CSVダウンロード時に設定）
  // どのバッチで出力されたかを記録し、ダウンロード履歴から仕訳を逆引き可能にする
  // TODO Supabase: export_batch_items(batch_id, journal_id)テーブルに分離
  export_batch_id: string | null;

  // クレジットカード払い判定（Gemini層A、独立カラム）
  is_credit_card_payment: boolean;

  // ルール関連（オプション）
  rule_id: string | null;                // ルールID
  rule_confidence: number | null;        // ルール信頼度（0.0-1.0）

  // インボイス関連（オプション）
  invoice_status: 'qualified' | 'not_qualified' | null;  // インボイスステータス
  invoice_number: string | null;         // インボイス番号（T + 13桁）

  // メモ関連（証票メモ: 顧問先が証票に記載したメモ）
  memo: string | null;                   // メモ内容
  memo_author: string | null;            // メモ作成者
  memo_target: string | null;            // メモ宛先
  // TODO Supabase: memo_created_at→TIMESTAMPTZ
  memo_created_at: string | null;        // メモ作成日時（ISO 8601）

  // スタッフノート（スタッフが自発的に記入するコメント）
  // Phase B TODO: journal_staff_notesテーブルに分離
  staff_notes?: StaffNotes | null;       // 4カテゴリの対応情報
  staff_notes_author?: string | null;    // 担当者名

  // 出力関連（12_full_schema_design §5.1準拠）
  exported_at?: string | null;            // CSV出力日時（ISO 8601）
  exported_by?: string | null;            // CSV出力者（スタッフID）

  // 監査用（12_full_schema_design §5.1準拠）
  // TODO Supabase: created_at→TIMESTAMPTZ DEFAULT NOW(), updated_at→TIMESTAMPTZ DEFAULT NOW()
  // TODO Supabase: status_updated_at/status_updated_by, read_at追加
  created_at?: string | null;             // 作成日時（＝取込日）
  updated_at?: string | null;             // 更新日時
  created_by?: string | null;             // 作成者（スタッフID or 'AI'）
  updated_by?: string | null;             // 更新者

  // AI推定関連（2026-03-11追加）
  // TODO Supabase: ai_completed_at→TIMESTAMPTZ
  ai_completed_at?: string | null;        // AI仕訳生成完了日時
  prediction_method?: string | null;      // 推定方法（keyword, alias, ai等）
  prediction_score?: number | null;       // 推定信頼度
  model_version?: string | null;          // 使用モデルバージョン
}
