/**
 * commandCatalog.ts — コマンドカタログ定義（唯一の真実）
 *
 * 責務: 全コマンドのID・名前・カテゴリ・説明・実行方式を一元管理
 *
 * 再編（2026-05-25）:
 *   旧30コマンド → 7コマンドに統合。
 *   全コマンドの最終形は「直接API」。未実装のものは暫定的にMCP直叩き。
 *   財務分析のみAI解釈（Gemini FC）が残る。
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

/**
 * 実行方式
 *   direct_api: 自前エンドポイント経由で直接実行（Geminiトークン0）
 *   mcp_direct: MCPツールを直接呼び出し（Geminiトークン0、業務ロジック未完成の暫定）
 *   ai_fc:      層3 Function Calling（Geminiトークン消費あり、AI解釈が必要）
 */
export type ActionType = 'direct_api' | 'mcp_direct' | 'ai_fc'

export interface CommandDef {
  /** コマンドID（英字スネークケース） */
  id: string
  /** 表示名（日本語） */
  name: string
  /** カテゴリ: 仕訳 / 分析 / データ */
  cat: '仕訳' | '分析' | 'データ'
  /** 1行説明 */
  desc: string
  /** 実行方式 */
  actionType: ActionType
  /** 直接APIのエンドポイント（actionType='direct_api'の場合） */
  apiEndpoint?: string
  /** パターンマッチ用キーワード（完全一致・部分一致） */
  keywords?: string[]
  /** 統合元の旧コマンドID一覧（移行追跡用） */
  legacyIds?: string[]
  /** 実装状況 */
  status: 'implemented' | 'partial' | 'planned'
  /** コスト/回 */
  costPerCall: string
}

/**
 * コマンドカタログ（唯一の真実）
 *
 * 全7コマンド。優先度順（P1〜P7）。
 * 全コマンドの最終形は直接API。暫定MCP直叩きはstatusで区別。
 */
export const COMMAND_CATALOG: CommandDef[] = [
  // ===== P1: MF全データ同期 =====
  {
    id: 'mf_sync_all',
    name: 'MF全データ同期',
    cat: 'データ',
    desc: '事業者情報・科目・税区分・仕訳・取引先をMFから一括取込（常に3期分）',
    actionType: 'direct_api',
    apiEndpoint: '/api/mf/sync-all',
    keywords: [
      'MF取込', 'データ取込', '同期', 'MFインポート',
      '事業者情報', '科目一覧', '税区分', '部門一覧',
      '補助科目', '連携サービス', '会計年度', '取引先一覧',
      'データ同期',
    ],
    legacyIds: [
      'sync_mf_data', 'accounts_list', 'taxes_list', 'departments',
      'sub_accounts', 'connected', 'office_info', 'term_settings',
      'partners_list',
    ],
    status: 'implemented',
    costPerCall: '0円',
  },

  // ===== P2: 仕訳取得・確認 =====
  {
    id: 'journal_view',
    name: '仕訳取得・確認',
    cat: '仕訳',
    desc: '仕訳一覧の取得・検索・確認・過去同一取引の参照',
    actionType: 'mcp_direct',
    keywords: [
      '仕訳一覧', '仕訳確認', '仕訳取得', '過去仕訳',
      '同一取引', '仕訳チェック', '仕訳詳細',
    ],
    legacyIds: ['journals_period', 'journal_detail', 'journal_confirm', 'past_similar'],
    status: 'partial',
    costPerCall: '0円',
  },

  // ===== P3: 仕訳投入 =====
  {
    id: 'journal_write',
    name: '仕訳投入',
    cat: '仕訳',
    desc: '銀行明細・領収書から仕訳を作成してMFに投入',
    actionType: 'mcp_direct',
    keywords: [
      '仕訳投入', '銀行仕訳', 'カード仕訳', '銀行明細',
      '領収書', 'レシート', 'MF登録',
    ],
    legacyIds: ['bank_journal', 'receipt_journal', 'journal_post'],
    status: 'partial',
    costPerCall: '0円',
  },

  // ===== P4: 仕訳取消 =====
  {
    id: 'journal_cancel',
    name: '仕訳取消',
    cat: '仕訳',
    desc: '投入済み仕訳を修正または削除',
    actionType: 'mcp_direct',
    keywords: ['仕訳取消', '仕訳削除', '仕訳修正'],
    legacyIds: ['journal_cancel'],
    status: 'planned',
    costPerCall: '0円',
  },

  // ===== P5: マスタ参照 =====
  {
    id: 'master_ref',
    name: 'マスタ参照',
    cat: 'データ',
    desc: '取引先一覧・口座一覧・定期取引検出・仕訳ルール・中間勘定パターン',
    actionType: 'mcp_direct',
    keywords: [
      '取引先', '口座', '口座カード', '定期取引', '固定費',
      '仕訳ルール', '中間勘定', '仮払金', '仮受金',
      '売上先', '仕入先', '外注先',
    ],
    legacyIds: ['partner_list', 'data_sources', 'recurring_detect', 'suspense_pattern', 'journal_rules'],
    status: 'planned',
    costPerCall: '0円',
  },

  // ===== P6: 消込 =====
  {
    id: 'matching',
    name: '消込',
    cat: '仕訳',
    desc: '売掛消込・買掛消込（売掛金/買掛金と入出金の突合）',
    actionType: 'mcp_direct',
    keywords: ['消込', '売掛消込', '買掛消込', '売掛金', '買掛金'],
    legacyIds: ['ar_matching', 'ap_matching'],
    status: 'planned',
    costPerCall: '0円',
  },

  // ===== P7: 財務分析 =====
  {
    id: 'financial_analysis',
    name: '財務分析',
    cat: '分析',
    desc: 'PL/BS試算表・推移表・売上/経費ランキング・月次変動・概況分析',
    actionType: 'ai_fc',
    keywords: [
      'PL', 'BS', '試算表', '損益', '貸借対照表',
      'PL推移', 'BS推移', '売上ランキング', '経費ランキング',
      '売上', '経費', '月次変動', '変動科目',
      'ビジネスモデル', '概況', '給与推移', '役員報酬',
      '3期', '過去3期', '回収サイト', '支払サイト',
      '資金フロー', '資金の流れ', '売上増減', '分析',
    ],
    legacyIds: [
      'pl_trial', 'bs_trial', 'pl_transition', 'bs_transition',
      'sales_ranking', 'expense_ranking', 'monthly_variance',
      'biz_overview', 'partner_list', 'payroll_trend',
      'data_sources', 'three_year_plan', 'collection_cycle',
      'fund_flow', 'sales_change',
    ],
    status: 'partial',
    costPerCall: '¥1〜5/回',
  },
]

/** カタログJSON文字列（AIプロンプト埋め込み用。keywords・legacyIds等は除外） */
export const CATALOG_JSON_FOR_PROMPT = JSON.stringify(
  COMMAND_CATALOG.map(({ id, name, cat, desc, actionType }) => ({ id, name, cat, desc, actionType }))
)

/** 有効なコマンドIDセット（バリデーション用） */
export const VALID_COMMAND_IDS = new Set(COMMAND_CATALOG.map(c => c.id))

/**
 * 旧コマンドID → 新コマンドIDの逆引きマップ
 * 旧IDで参照している箇所の移行を支援する
 */
export const LEGACY_ID_MAP: Record<string, string> = {}
for (const cmd of COMMAND_CATALOG) {
  if (cmd.legacyIds) {
    for (const legacyId of cmd.legacyIds) {
      LEGACY_ID_MAP[legacyId] = cmd.id
    }
  }
}

/**
 * 旧コマンドIDを新コマンドIDに変換する
 * 旧IDが見つからない場合はそのまま返す
 */
export function resolveCommandId(idOrLegacyId: string): string {
  return LEGACY_ID_MAP[idOrLegacyId] ?? idOrLegacyId
}
