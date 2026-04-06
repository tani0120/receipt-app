/**
 * vendor.type.ts — T-01: VendorVector型 + T-02: Vendor型
 *
 * 準拠: vendor_vector_41_reference.md（68種拡張済み）
 * 全科目ID: ACCOUNT_MASTER（src/shared/data/account-master.ts）準拠
 *
 * 【VendorVector（68種）】
 *   AIパイプライン Step 3 で判定する取引先業種ベクトル。
 *   取引先名・キーワードから業種を特定し、科目候補リストを得る。
 *
 * 【Vendor】
 *   取引先マスタのinterface（T-02）。
 *   scope: 'global'（全社共通）または 'client'（顧問先固有）
 *
 * 【flatten関数設計（T-06d 完了済み）】
 *   TS層（プロパティ方式）→ DB層（列方式）への変換設計を末尾に記載。
 *
 * 【バリデーション（2種）】
 *   NEW_INDIVIDUAL_VENDOR: individual + 過去仕訳なし → ⚠️ 警告
 *   UNKNOWN_VENDOR: 取引先特定失敗 or unknown → ⚠️ 警告
 */

// ============================================================
// § VendorVector union型（66種）
// ============================================================

/**
 * 取引先業種ベクトル（66種）
 *
 * 飲食（2）+ 小売（19）+ サービス（19）+ 不動産・保険（2）+
 * スポーツ・娯楽（5）+ 交通機関（9）+ 公共機関（5）+
 * 金融（1）+ 個人・卸売・会費・不明（4）= 66種
 *
 * level定義:
 *   'A'          = 科目候補1つ（AI自動確定）
 *   'insufficient' = 科目候補2つ以上（人間がUIで選択）
 */
export type VendorVector =
  // ── 🍽️ 飲食（2種）──────────────────────────────────
  | 'restaurant'        // レストラン・居酒屋（insufficient）
  | 'cafe'              // カフェ・喫茶店（A）

  // ── 🛒 小売（19種）─────────────────────────────────
  | 'food_market'       // 食品・食材・飲料（insufficient）
  | 'supermarket'       // スーパー・デパート（insufficient）
  | 'convenience_store' // コンビニ等（insufficient）
  | 'general_goods'     // 雑貨・生活用品（A）
  | 'souvenir'          // おみやげ（A）
  | 'drugstore'         // ドラッグストア（A）
  | 'apparel'           // 衣類・靴・カバン・小物（A）
  | 'cosmetics'         // 化粧品類（A）
  | 'books'             // 書籍（A）
  | 'electronics'       // 家電量販店（insufficient）
  | 'bicycle'           // 自転車販売（A）
  | 'sports_goods'      // スポーツ用品（A）
  | 'media_disc'        // CD・DVD販売（A）
  | 'jewelry'           // 貴金属・アクセサリー・時計（insufficient）
  | 'florist'           // 生花店（A）
  | 'auto_dealer'       // 自動車バイク販売・修理（insufficient）
  | 'auto_parts'        // 自動車バイク用品（A）
  | 'building_materials'// 建築材料販売（A）
  | 'stationery'        // 文具（A）

  // ── 🔧 サービス（19種）─────────────────────────────
  | 'beauty'            // 美容・エステ・クリーニング（A）
  | 'printing'          // 印刷（A）
  | 'advertising'       // 広告・マーケティング（A）
  | 'post_office'       // 郵便局（insufficient）
  | 'waste'             // ゴミ処理・廃棄物（A）
  | 'it_service'        // ITサービス（insufficient）
  /** @deprecated 2026-04-05: telecom / saas に分割。互換性のため残存 */
  | 'telecom_saas'
  | 'telecom'           // 通信・インフラ（A: COMMUNICATION）携帯/固定回線/ISP
  | 'saas'             // SaaS・クラウドサービス（insufficient: COMMUNICATION, FEES）AWS/Google/Microsoft等
  | 'education'         // 研修・各種スクール（A）
  | 'outsourcing'       // アウトソーシング（A）
  | 'lease_rental'      // リース・レンタル（insufficient）
  | 'staffing'          // 人材派遣（A）
  | 'camera_dpe'        // カメラ・DPE（A）
  | 'funeral'           // 仏壇・仏事（A）
  | 'platform'          // プラットフォーム（insufficient）
  | 'ec_site'           // ECサイト（insufficient）
  | 'logistics'         // 物流・運送（A）
  | 'consulting'        // コンサルティング・顧問（insufficient）
  | 'legal_firm'        // 士業（弁護士・税理士等）（A）
  | 'construction'      // 工事業・建設住宅（A）

  // ── 🏢 不動産・保険（2種）──────────────────────────
  | 'real_estate'       // 不動産（insufficient）
  | 'insurance'         // 保険会社（A）

  // ── 🎾 スポーツ・娯楽（5種）────────────────────────
  | 'entertainment'     // ゴルフ場等（insufficient）※restaurantと名称衝突注意
  | 'leisure'           // 娯楽施設・スポーツ施設（insufficient）
  | 'cinema_music'      // 映画・音楽（A）
  | 'spa'               // 温泉・銭湯（A）
  | 'travel_agency'     // 旅行代理店（A）

  // ── 🚃 交通機関（9種）──────────────────────────────
  | 'gas_station'       // ガソリンスタンド（A: VEHICLE_COSTS）
  | 'taxi'              // タクシー（A）
  | 'rental_car'        // レンタカー（A）
  | 'train'             // 電車（A）
  | 'bus'               // バス（A）
  | 'highway'           // 有料道路（A）
  | 'airline_ship'      // 飛行機・船（A）
  | 'parking'           // 駐車場（A）
  | 'hotel'             // ホテル等（A）

  // ── 🏛️ 公共機関（5種）──────────────────────────────
  | 'utility'           // 水道・ガス・電力（A）
  | 'government'        // 官公庁・税金（insufficient）
  | 'social_insurance'  // 社会保険（A）
  | 'medical'           // 医院・病院（A）※法人→WELFARE、個人→WELFARE
  | 'religious'         // 神社・教会等（insufficient）

  // ── 💰 金融（1種）───────────────────────────────────
  | 'financial'         // 金融機関・銀行（insufficient）

  // ── 👤 個人・卸売・会費・不明（4種）────────────────
  | 'individual'        // 個人名（insufficient + NEW_INDIVIDUAL_VENDOR警告）
  | 'wholesale'         // 卸売（A）
  | 'association'       // 会費・親睦会（insufficient）
  | 'unknown';          // 不明（insufficient + UNKNOWN_VENDOR警告）

/** VendorVector全値の定数配列（網羅性チェック・T-V1用） */
export const VENDOR_VECTORS = [
  // 飲食
  'restaurant', 'cafe',
  // 小売
  'food_market', 'supermarket', 'convenience_store', 'general_goods', 'souvenir',
  'drugstore', 'apparel', 'cosmetics', 'books', 'electronics', 'bicycle',
  'sports_goods', 'media_disc', 'jewelry', 'florist', 'auto_dealer', 'auto_parts',
  'building_materials', 'stationery',
  // サービス
  'beauty', 'printing', 'advertising', 'post_office', 'waste', 'it_service',
  'telecom_saas', 'telecom', 'saas', 'education', 'outsourcing', 'lease_rental', 'staffing',
  'camera_dpe', 'funeral', 'platform', 'ec_site', 'logistics', 'consulting',
  'legal_firm', 'construction',
  // 不動産・保険
  'real_estate', 'insurance',
  // スポーツ・娯楽
  'entertainment', 'leisure', 'cinema_music', 'spa', 'travel_agency',
  // 交通機関
  'gas_station', 'taxi', 'rental_car', 'train', 'bus', 'highway',
  'airline_ship', 'parking', 'hotel',
  // 公共機関
  'utility', 'government', 'social_insurance', 'medical', 'religious',
  // 金融
  'financial',
  // 個人・卸売・会費・不明
  'individual', 'wholesale', 'association', 'unknown',
] as const satisfies readonly VendorVector[];

// ============================================================
// § VendorVector 日本語ラベル（UI表示用）
// ============================================================

export const VENDOR_VECTOR_LABELS: Record<VendorVector, string> = {
  restaurant: 'レストラン・居酒屋',
  cafe: 'カフェ・喫茶店',
  food_market: '食品・食材・飲料',
  supermarket: 'スーパー・デパート',
  convenience_store: 'コンビニ等',
  general_goods: '雑貨・生活用品',
  souvenir: 'おみやげ',
  drugstore: 'ドラッグストア',
  apparel: '衣類・靴・カバン・小物',
  cosmetics: '化粧品類',
  books: '書籍',
  electronics: '家電量販店',
  bicycle: '自転車販売',
  sports_goods: 'スポーツ用品',
  media_disc: 'CD・DVD販売',
  jewelry: '貴金属・アクセサリー・時計',
  florist: '生花店',
  auto_dealer: '自動車バイク販売・修理',
  auto_parts: '自動車バイク用品',
  building_materials: '建築材料販売',
  stationery: '文具',
  beauty: '美容・エステ・クリーニング',
  printing: '印刷',
  advertising: '広告・マーケティング',
  post_office: '郵便局',
  waste: 'ゴミ処理・廃棄物',
  it_service: 'ITサービス',
  telecom_saas: '通信・SaaS（@deprecated）',
  telecom: '通信・インフラ',
  saas: 'SaaS・クラウドサービス',
  education: '研修・各種スクール',
  outsourcing: 'アウトソーシング',
  lease_rental: 'リース・レンタル',
  staffing: '人材派遣',
  camera_dpe: 'カメラ・DPE',
  funeral: '仏壇・仏事',
  platform: 'プラットフォーム',
  ec_site: 'ECサイト',
  logistics: '物流・運送',
  consulting: 'コンサルティング・顧問',
  legal_firm: '士業（弁護士・税理士等）',
  construction: '工事業・建設住宅',
  real_estate: '不動産',
  insurance: '保険会社',
  entertainment: 'ゴルフ場等（接待娯楽）',
  leisure: '娯楽施設・スポーツ施設',
  cinema_music: '映画・音楽',
  spa: '温泉・銭湯',
  travel_agency: '旅行代理店',
  gas_station: 'ガソリンスタンド',
  taxi: 'タクシー',
  rental_car: 'レンタカー',
  train: '電車',
  bus: 'バス',
  highway: '有料道路',
  airline_ship: '飛行機・船',
  parking: '駐車場',
  hotel: 'ホテル等',
  utility: '水道・ガス・電力',
  government: '官公庁・税金',
  social_insurance: '社会保険',
  medical: '医院・病院',
  religious: '神社・教会等',
  financial: '金融機関・銀行',
  individual: '個人名',
  wholesale: '卸売',
  association: '会費・親睦会',
  unknown: '不明',
};

// ============================================================
// § バリデーション種別（2種のみ）
// ============================================================

/**
 * VendorVector起因のバリデーション警告
 *
 * NEW_INDIVIDUAL_VENDOR: individual + confirmed_journals なし
 *   → ⚠️ 初回の個人取引先です。科目を判断してください
 *
 * UNKNOWN_VENDOR: 取引先特定失敗 or unknown
 *   → ⚠️ 取引先が特定できません
 */
export type VendorVectorWarning =
  | 'NEW_INDIVIDUAL_VENDOR'
  | 'UNKNOWN_VENDOR';

// ============================================================
// § T-02: Vendor型（取引先マスタ）
// ============================================================

/**
 * 取引先マスタ
 *
 * scope:
 *   'global' = 全社共通（Amazon, AWS, NTT等）
 *   'client' = 顧問先固有（client_idと紐付く）
 *
 * 確定閾値（score）:
 *   T番号一致      → 即確定（スコア計算スキップ）
 *   score >= 10    → confirmed（確定）
 *   score 5〜9     → candidate（候補）
 *   score < 5      → unknown（不明）
 */
export interface Vendor {
  /** 取引先ID（UUID） */
  vendor_id: string;
  /** 正式会社名・屋号 */
  company_name: string;
  /**
   * 照合キー（normalizeVendorName()の出力。DL-027 SSOT）
   * NFKC・法人格除去・記号除去・ひらがな→カタカナ・小文字化済み。
   * 照合は match_key の完全一致のみ。aliases は照合に使用しない。
   */
  match_key: string;
  /**
   * 表示名（証票に表示された正規化前の原文）
   * 通帳・クレカ明細のカタカナ表記等、証票上の原文を保持する。
   * 全社マスタ（vendors_global）では null。顧問先マスタで設定。
   */
  display_name: string | null;
  /**
   * 別名リスト（正規化済み）
   *
   * L3（名称マッチ）での表記ゆれ・略称対応。
   * クレカ・銀行明細の摘要は法人正式名称と異なる略称で記載されることが多い。
   *
   * 例（Amazon Japan G.K.）:
   *   match_key: 'amazonjapan'
   *   aliases: ['amazoncojp', 'amazon', 'amazonjapangk']
   *
   * 例（Amazon Web Services Japan G.K.）:
   *   match_key: 'amazonwebservicesjapan'
   *   aliases: ['aws', 'amazonwebservices', 'awsjapan']
   *
   * マッチ判定: normalizeVendorName(摘要) が match_key と完全一致（DL-027）。aliases は照合に使用しない（記録・UI表示のみ）
   */
  aliases: string[];
  /**
   * インボイス番号リスト（T + 13桁）
   *
   * FC・フランチャイズ等、同一ブランドが複数T番号を持つ場合に対応（DL-022）。
   * Layer 1（T番号照合）で t_numbers のいずれかに一致した場合に業種確定。
   * 本社・主要直営のT番号のみ登録。未登録FCはLayer 3（正規化名称）にフォールバック。
   * 未登録（インボイス番号なし）の場合は空配列 [] とする。
   */
  t_numbers: string[];
  /**
   * 電話番号リスト（正規化済み）
   *
   * 複数拠点・代表番号・サポート番号に対応。
   * 例: ["0722221234", "0120001234"]
   * 未登録の場合は空配列 [] とする。
   */
  phone_numbers: string[];
  /**
   * ブランドID（任意）
   *
   * FC・グループ企業等で複数法人が同一ブランドを使う場合に設定（DL-022）。
   * 例: 'MCDONALDS', 'SEVEN_ELEVEN'
   * 未設定の場合は match_key でグループ識別する。
   */
  brand_id?: string;
  /** 住所（正規化済み。未登録の場合 null） */
  address: string | null;
  /** 業種ベクトル（68種） */
  vendor_vector: VendorVector;

  // ============================================================
  // § 仕訳テンプレート（DL-027 Streamed互換）
  // UI表示: 学習ワード | T番号 | 電話番号 | 入出金 | 金額 | 借方科目 | 借方補助 | 借方税区 | 借方部門
  //                                                         | 貸方科目 | 貸方補助 | 貸方税区 | 貸方部門
  //
  // vendors_global: ACCOUNT_MASTER参照で例示値を設定（法人本則・出金前提）
  // vendors_client: 個別顧問先勘定科目マスタ参照。過去仕訳から学習して上書き。
  // ============================================================

  /**
   * 入出金区分（'expense' | 'income' | null）
   * null = 未設定（UI上は空欄）
   */
  direction: 'expense' | 'income' | null;

  /**
   * 金額閾値（円。Streamed互換）
   * この金額以下の場合に本エントリのテンプレートを適用。
   * null = 金額制限なし（全額対象）
   * 例: 4999 → 4999円以下は会議費、それ以上は別エントリで接待交際費
   */
  amount_threshold: number | null;

  /**
   * 借方勘定科目（ACCOUNT_MASTER ID）
   * vendors_global: ACCOUNT_MASTER参照の例示値（法人本則出金前提）
   * vendors_client: 顧問先固有科目マスタ参照
   * null = マスタ未設定（industry_vectorから自動導出）
   */
  debit_account: string | null;

  /**
   * 借方勘定科目（閾値超）（ACCOUNT_MASTER ID）
   * amount_thresholdを超えた場合に適用する借方科目。
   * 例: restaurant → ≤10000: MEETING, >10000: ENTERTAINMENT
   *   → debit_account: 'MEETING', debit_account_over: 'ENTERTAINMENT'
   * null = 閾値分岐なし（debit_accountのみ使用）
   */
  debit_account_over: string | null;

  /**
   * 借方補助科目（任意）
   * 顧問先固有の補助科目コード。vendors_globalでは基本null。
   */
  debit_sub_account: string | null;

  /**
   * 借方税区分
   * 例: '対象外', '課税仕入', '非課税仕入'
   * vendors_globalでは法人本則に基づく例示値を設定。
   * null = ACCOUNT_MASTERから自動導出（DL-024）
   */
  debit_tax_category: string | null;

  /**
   * 借方部門（任意）
   * 顧問先固有の部門コード。vendors_globalでは基本null。
   */
  debit_department: string | null;

  /**
   * 貸方勘定科目（ACCOUNT_MASTER ID）
   * source_type（銀行/カード/小口）によって異なる。
   * vendors_globalでは基本null（仕訳時にsource_typeから自動設定）。
   * vendors_clientで顧問先固有の口座・未払金等に上書き可能。
   */
  credit_account: string | null;

  /**
   * 貸方補助科目（任意）
   * 例: 銀行口座名「○○銀行普通預金」
   * 顧問先固有。vendors_globalでは基本null。
   */
  credit_sub_account: string | null;

  /**
   * 貸方税区分（任意）
   * 貸方は基本「対象外」固定だが、例外時に設定。
   */
  credit_tax_category: string | null;

  /**
   * 貸方部門（任意）
   * 顧問先固有の部門コード。vendors_globalでは基本null。
   */
  credit_department: string | null;

  /** スコープ */
  scope: 'global' | 'client';
  /** 顧問先ID（scope='client' の場合のみ。例: "LDI-00008"） */
  client_id: string | null;
}

// ============================================================
// § IndustryVectorEntry型（T-04 先行定義）
// ============================================================

/**
 * 業種ベクトルマスタ（プロパティ方式）
 *
 * TS層: プロパティ方式（expense[], income[]）
 * DB層: 列方式（vector | direction | account）
 *
 * 変換は flattenIndustryVector() で行う。
 */
export interface IndustryVectorEntry {
  /** 業種ベクトル */
  vector: VendorVector;
  /** 出金時の科目候補（ACCOUNT_MASTER IDの配列。順序=優先度） */
  expense: string[];
  /** 入金時の科目候補（ACCOUNT_MASTER IDの配列。なければ空配列） */
  income: string[];
}

/** DB層用のフラット行（vector | direction | account） */
export interface FlatIndustryVectorRow {
  vector: VendorVector;
  direction: 'expense' | 'income';
  account: string;
}

/**
 * TS層 → DB層への変換関数（T-06d 設計済み）
 *
 * @example
 * ```ts
 * const rows = flattenIndustryVector({
 *   vector: 'taxi',
 *   expense: ['TRAVEL'],
 *   income: [],
 * });
 * // → [{ vector: 'taxi', direction: 'expense', account: 'TRAVEL' }]
 * ```
 */
export function flattenIndustryVector(entry: IndustryVectorEntry): FlatIndustryVectorRow[] {
  return [
    ...entry.expense.map(account => ({
      vector: entry.vector,
      direction: 'expense' as const,
      account,
    })),
    ...entry.income.map(account => ({
      vector: entry.vector,
      direction: 'income' as const,
      account,
    })),
  ];
}
