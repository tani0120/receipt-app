/**
 * 学習ルール型定義（mocks層）
 *
 * ④科目確定AI（Step 4）の学習ルール照合で使用。
 * 仕訳一覧の rule_id から逆引きするFK元テーブル。
 *
 * ストリームド・MF同等の学習機能:
 *   - 照合方式: 完全一致（exact） / 部分一致（contains）を人間が選択
 *   - 金額条件: MF方式（amountMin/amountMax で以上・以下・同額・範囲を表現）
 *   - 複合仕訳: entries[] で借方/貸方N行のテンプレートを保持
 *   - 証票種別: sourceCategory で領収書/口座/カード/全共通を区別
 *
 * Supabase移行時に learning_rules + learning_rule_entries テーブルに対応する。
 */

// ────────────────────────────────────────────
// 複合仕訳テンプレート1行
// ────────────────────────────────────────────

/** 複合仕訳テンプレート1行（借方または貸方） */
export interface LearningRuleEntryLine {
  /** 行ID（PK。Supabase learning_rule_entries テーブルのPK） */
  id: string

  /** 親ルールID（FK。LearningRule.id への参照） */
  ruleId: string

  /** 借方/貸方 */
  side: 'debit' | 'credit'

  /** 勘定科目（ACCOUNT_MASTER ID） */
  account: string

  /** 補助科目（任意） */
  subAccount: string | null

  /** 税区分（任意） */
  taxCategory: string | null

  /** 部門（任意） */
  department: string | null

  /**
   * 金額タイプ（ストリームド同等の3択）
   *   'auto'  = 自動計算（単一仕訳=証憑金額、複合仕訳=他行との差額）
   *   'total' = 取引金額（証憑記載の金額をそのまま）
   *   'fixed' = 固定金額（学習に入力した金額を常に使用）
   */
  amountType: 'auto' | 'total' | 'fixed'

  /** 固定金額（amountType='fixed' の場合のみ使用。それ以外は null） */
  fixedAmount: number | null

  /**
   * 摘要表示名（上書き方式）
   * 照合キーワードとは別に、摘要欄に書き出す取引先名。
   * 例：キーワード「ﾐﾆｽﾄｯﾌﾟ」で照合し、摘要には「ミニストップ」と正規化して書き出す。
   */
  displayName: string | null

  /** 取引内容（摘要の一部。例：事務用品購入、電気代） */
  description: string | null

  /** 対象月（摘要の一部。例：4月分） */
  targetMonth: string | null

  /** 表示順（1始まり） */
  displayOrder: number
}

// ────────────────────────────────────────────
// 学習ルール本体
// ────────────────────────────────────────────

/** 学習ルール */
export interface LearningRule {
  /** ルールID（PK。journal.rule_id の FK元） */
  id: string

  /** 顧問先ID（LDI-00008形式） */
  clientId: string

  /** 摘要マッチキーワード（取引先名に限定しない。任意の摘要テキスト） */
  keyword: string

  /**
   * 照合方式（ストリームド・MF同等）
   *   exact    = 完全一致（デフォルト: 領収書・レシート。優先度高）
   *   contains = 部分一致（デフォルト: 銀行・カード明細）
   * 複数ルール該当時は完全一致が優先される。
   */
  matchType: 'exact' | 'contains'

  /** 入出金条件（null = 条件なし） */
  direction: 'expense' | 'income' | null

  /**
   * 証票種別カテゴリ
   *   'receipt' = 領収書・レシート・請求書のみ
   *   'bank'    = 銀行明細のみ
   *   'credit'  = クレカ明細のみ
   *   'all'     = 全種別共通
   *   null      = 条件なし
   */
  sourceCategory: 'receipt' | 'bank' | 'credit' | 'all' | null

  /**
   * 金額下限（MF方式: この金額以上）
   * null = 下限なし
   * amountMin === amountMax の場合は「同額一致」（ストリームド方式）
   */
  amountMin: number | null

  /**
   * 金額上限（MF方式: この金額以下）
   * null = 上限なし
   */
  amountMax: number | null

  /**
   * 仕訳テンプレート行（複合仕訳対応）
   *
   * 単科目の場合: 2行（借方1行 + 貸方1行）
   * 複合仕訳の場合: 3行以上
   *
   * 例: タナカタロウ × 220,000円
   *   行1: debit  外注費     fixed   200000  課対仕入10%
   *   行2: debit  仮払消費税 auto    null    対象外
   *   行3: credit 普通預金   total   null    対象外
   */
  entries: LearningRuleEntryLine[]

  /** 有効/無効 */
  isActive: boolean

  /** 累計適用回数 */
  hitCount: number

  /** 生成元 */
  generatedBy: 'ai' | 'human'

  /** 作成日時（ISO 8601） */
  createdAt: string

  /** 更新日時（ISO 8601） */
  updatedAt: string
}
