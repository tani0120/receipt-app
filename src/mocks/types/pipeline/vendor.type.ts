/**
 * vendor.type.ts — T-01: VendorVector型 + T-02: Vendor型
 *
 * 準拠: vendor_vector_41_reference.md（66種拡張済み）
 * 全科目ID: ACCOUNT_MASTER（src/shared/data/account-master.ts）準拠
 *
 * 【VendorVector（66種）】
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
  | 'drugstore'         // ドラッグストア（insufficient）
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
  | 'beauty'            // 美容・エステ・クリーニング（insufficient）
  | 'printing'          // 印刷（insufficient）
  | 'advertising'       // 広告・マーケティング（A）
  | 'post_office'       // 郵便局（insufficient）
  | 'waste'             // ゴミ処理・廃棄物（A）
  | 'it_service'        // ITサービス（insufficient）
  | 'telecom_saas'      // 通信・SaaS（insufficient）
  | 'education'         // 研修・各種スクール（法人:insufficient / 個人:A）
  | 'outsourcing'       // アウトソーシング（A）
  | 'lease_rental'      // リース・レンタル（A）
  | 'staffing'          // 人材派遣（A）
  | 'camera_dpe'        // カメラ・DPE（A）
  | 'funeral'           // 仏壇・仏事（A）
  | 'platform'          // プラットフォーム（insufficient）
  | 'ec_site'           // ECサイト（insufficient）
  | 'logistics'         // 物流・運送（insufficient）
  | 'consulting'        // コンサルティング・顧問（insufficient）
  | 'legal_firm'        // 士業（弁護士・税理士等）（insufficient）
  | 'construction'      // 工事業・建設住宅（insufficient）

  // ── 🏢 不動産・保険（2種）──────────────────────────
  | 'real_estate'       // 不動産（insufficient）
  | 'insurance'         // 保険会社（A）

  // ── 🎾 スポーツ・娯楽（5種）────────────────────────
  | 'entertainment'     // ゴルフ場等（insufficient）※restaurantと名称衝突注意
  | 'leisure'           // 娯楽施設・スポーツ施設（insufficient）
  | 'cinema_music'      // 映画・音楽（A）
  | 'spa'               // 温泉・銭湯（A）
  | 'travel_agency'     // 旅行代理店（法人:insufficient / 個人:A）

  // ── 🚃 交通機関（9種）──────────────────────────────
  | 'gas_station'       // ガソリンスタンド（insufficient）
  | 'taxi'              // タクシー（A）
  | 'rental_car'        // レンタカー（insufficient）
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
  | 'religious'         // 神社・教会等（A）

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
  'telecom_saas', 'education', 'outsourcing', 'lease_rental', 'staffing',
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
  telecom_saas: '通信・SaaS',
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
  /** 正規化後の名称（照合キー。小文字・全角半角統一済み） */
  normalized_name: string;
  /** インボイス番号（T + 13桁。未登録の場合 null） */
  T_number: string | null;
  /** 電話番号（正規化済み。例: "0722221234"） */
  phone: string | null;
  /** 住所（正規化済み） */
  address: string | null;
  /** 業種ベクトル（66種） */
  vendor_vector: VendorVector;
  /** デフォルト科目（ACCOUNT_MASTER ID。null = マスタ未設定） */
  default_account: string | null;
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
