/**
 * commandCatalog.ts — コマンドカタログ定義（唯一の真実）
 *
 * 責務: 全コマンドのID・名前・カテゴリ・説明を一元管理
 *
 * 参照元:
 *   - aiSuggestService.ts（AIプロンプトに埋め込み）
 *   - aiCommandRoutes.ts（GET /api/ai-command/catalog）
 *   - aiPatternMatcher.ts（パターンマッチ定義）
 *
 * コマンド追加時はここだけ修正すればAI提案・ブラウザ・パターンマッチすべてに反映される。
 *
 * 準拠:
 *   - 34_command_catalog.md コマンド一覧
 *   - 35_parts_catalog.md 処理部品 aiSuggest
 */

export interface CommandDef {
  /** コマンドID（英字スネークケース） */
  id: string
  /** 表示名（日本語） */
  name: string
  /** カテゴリ: 仕訳 / 分析 / 管理 / データ */
  cat: '仕訳' | '分析' | '管理' | 'データ'
  /** 1行説明 */
  desc: string
  /** パターンマッチ用キーワード（完全一致・部分一致） */
  keywords?: string[]
}

/**
 * コマンドカタログ（唯一の真実）
 * コマンド追加時はここに追記するだけで全箇所に反映される
 */
export const COMMAND_CATALOG: CommandDef[] = [
  // ===== 仕訳系 =====
  { id: 'bank_journal', name: '銀行/カード明細の仕訳候補', cat: '仕訳', desc: '銀行・カード明細から仕訳候補を自動生成', keywords: ['銀行仕訳', 'カード仕訳', '銀行明細'] },
  { id: 'receipt_journal', name: '領収書の仕訳候補', cat: '仕訳', desc: '領収書・レシートから仕訳候補を自動生成', keywords: ['領収書', 'レシート'] },
  { id: 'journal_confirm', name: '仕訳✓（確認・選択）', cat: '仕訳', desc: '仕訳候補を確認して承認・修正する', keywords: ['仕訳確認', '仕訳チェック'] },
  { id: 'journal_post', name: '仕訳投入（MFへ登録）', cat: '仕訳', desc: '承認済み仕訳をマネーフォワードに投入する', keywords: ['仕訳投入', 'MF登録'] },
  { id: 'journal_cancel', name: '仕訳取消（修正・削除）', cat: '仕訳', desc: '投入済み仕訳を修正または削除する', keywords: ['仕訳取消', '仕訳削除', '仕訳修正'] },
  { id: 'ar_matching', name: '売掛消込リスト', cat: '仕訳', desc: '売掛金と入金を突合して消込候補を表示', keywords: ['売掛消込', '売掛金'] },
  { id: 'ap_matching', name: '買掛消込リスト', cat: '仕訳', desc: '買掛金と出金を突合して消込候補を表示', keywords: ['買掛消込', '買掛金'] },
  { id: 'journal_rules', name: '仕訳ルールの言語化', cat: '仕訳', desc: '過去仕訳のパターンをAIがテキストで説明', keywords: ['仕訳ルール'] },
  { id: 'past_similar', name: '過去同一取引の仕訳', cat: '仕訳', desc: '同一摘要の過去仕訳を検索して表示', keywords: ['過去仕訳', '同一取引'] },
  { id: 'recurring_detect', name: '定期取引検出', cat: '仕訳', desc: '毎月発生する定期取引を自動検出', keywords: ['定期取引', '固定費'] },
  { id: 'suspense_pattern', name: '中間勘定パターン', cat: '仕訳', desc: '仮払金・仮受金等の中間勘定の対応関係を表示', keywords: ['中間勘定', '仮払金', '仮受金'] },

  // ===== 分析系 =====
  { id: 'sales_ranking', name: '売上ランキング', cat: '分析', desc: '売上を取引先別に集計してランキング表示', keywords: ['売上ランキング', '売上トップ'] },
  { id: 'expense_ranking', name: '経費ランキング', cat: '分析', desc: '経費を科目別に集計してランキング表示', keywords: ['経費ランキング'] },
  { id: 'monthly_variance', name: '月次変動科目', cat: '分析', desc: '月次推移で異常な変動がある科目を検出', keywords: ['月次変動', '変動科目'] },
  { id: 'biz_overview', name: 'ビジネスモデル概況', cat: '分析', desc: 'PLから事業モデルの特徴をAIが要約', keywords: ['ビジネスモデル', '概況'] },
  { id: 'partner_list', name: '売上先・仕入先・外注先一覧', cat: '分析', desc: '取引先を売上/仕入/外注に分類して一覧表示', keywords: ['取引先一覧', '売上先', '仕入先', '外注先'] },
  { id: 'payroll_trend', name: '給与・役員報酬月次推移', cat: '分析', desc: '人件費の月次推移を表示', keywords: ['給与推移', '役員報酬'] },
  { id: 'data_sources', name: '口座カードリスト', cat: '分析', desc: 'MF連携済みの口座・カード一覧を表示', keywords: ['口座一覧', '口座カード'] },
  { id: 'three_year_plan', name: '過去3期計画', cat: '分析', desc: '過去3期のPLを比較してAIが傾向を要約', keywords: ['3期', '過去3期'] },
  { id: 'collection_cycle', name: '回収/支払サイト', cat: '分析', desc: '売掛・買掛の回収/支払日数を算出', keywords: ['回収サイト', '支払サイト'] },
  { id: 'fund_flow', name: '口座役割と資金の流れ', cat: '分析', desc: '口座間の資金移動パターンをAIが分析', keywords: ['資金フロー', '資金の流れ'] },
  { id: 'sales_change', name: '売上増減ランキング', cat: '分析', desc: '前期比で売上が増減した取引先をランキング', keywords: ['売上増減'] },

  // ===== 管理系 =====
  { id: 'sync_mf_data', name: 'MFデータ取込', cat: '管理', desc: 'MFから仕訳・科目・税区分をDBに取り込む', keywords: ['データ取込', 'MF取込', 'データ同期'] },

  // ===== データ取得系 =====
  { id: 'accounts_list', name: '科目一覧', cat: 'データ', desc: '勘定科目マスタを一覧表示', keywords: ['科目一覧', '勘定科目'] },
  { id: 'taxes_list', name: '税区分一覧', cat: 'データ', desc: '税区分マスタを一覧表示', keywords: ['税区分一覧', '税区分'] },
  { id: 'journals_period', name: '仕訳取得（期間）', cat: 'データ', desc: '指定期間の仕訳一覧を取得', keywords: ['仕訳一覧', '仕訳取得'] },
  { id: 'journal_detail', name: '仕訳取得（ID）', cat: 'データ', desc: '仕訳IDを指定して詳細を取得', keywords: ['仕訳詳細'] },
  { id: 'pl_trial', name: 'PL試算表', cat: 'データ', desc: '損益計算書（試算表）を取得', keywords: ['PL', '試算表', '損益'] },
  { id: 'bs_trial', name: 'BS試算表', cat: 'データ', desc: '貸借対照表（試算表）を取得', keywords: ['BS', '貸借対照表'] },
  { id: 'pl_transition', name: 'PL推移表', cat: 'データ', desc: '損益計算書の月次推移を取得', keywords: ['PL推移'] },
  { id: 'bs_transition', name: 'BS推移表', cat: 'データ', desc: '貸借対照表の月次推移を取得', keywords: ['BS推移'] },
  { id: 'partners_list', name: '取引先一覧', cat: 'データ', desc: '取引先マスタを一覧表示', keywords: ['取引先'] },
  { id: 'office_info', name: '事業者情報', cat: 'データ', desc: '事業者の基本情報を取得', keywords: ['事業者情報', '事業者'] },
  { id: 'term_settings', name: '会計年度設定', cat: 'データ', desc: '会計年度・決算月の設定を取得', keywords: ['会計年度', '決算月'] },
  { id: 'departments', name: '部門一覧', cat: 'データ', desc: '部門マスタを一覧表示', keywords: ['部門一覧', '部門'] },
  { id: 'sub_accounts', name: '補助科目一覧', cat: 'データ', desc: '補助科目マスタを一覧表示', keywords: ['補助科目'] },
  { id: 'connected', name: '連携サービス一覧', cat: 'データ', desc: '連携済みサービスを一覧表示', keywords: ['連携サービス', '連携一覧'] },
]

/** カタログJSON文字列（AIプロンプト埋め込み用。keywordsは除外） */
export const CATALOG_JSON_FOR_PROMPT = JSON.stringify(
  COMMAND_CATALOG.map(({ id, name, cat, desc }) => ({ id, name, cat, desc }))
)

/** 有効なコマンドIDセット（バリデーション用） */
export const VALID_COMMAND_IDS = new Set(COMMAND_CATALOG.map(c => c.id))
