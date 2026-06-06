/**
 * G1: 勘定科目AI分類テスト（本番同等条件）
 *
 * 本番フロー:
 *   1. 既存マスタ157件が参考データとして存在（全フィールド確定済み）
 *   2. MFから新規科目名が来る
 *   3. AIに「既存マスタを参考にして推定しろ」と頼む
 *
 * AI判定対象（4フィールド）:
 *   - category（29種）
 *   - target（corp/individual/both）
 *   - accountGroup（BS_ASSET/BS_LIABILITY/PL_REVENUE/PL_EXPENSE/BS_EQUITY）
 *   - englishId（UPPER_SNAKE_CASE）
 *
 * 整合性チェック:
 *   - accountGroupはcategoryから導出可能（deriveCategoryDefaults）
 *   - AIが出したaccountGroupと導出値が一致するか検証
 *
 * 実行: npx tsx src/scripts/test-account-classifier.ts
 */

import { GoogleGenAI, Type } from '@google/genai';
import { readFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// ============================================================
// 設定
// ============================================================

const PROJECT_ID = process.env['VERTEX_PROJECT_ID'] ?? '';
const LOCATION = 'global';

if (!PROJECT_ID) {
  console.error('VERTEX_PROJECT_ID が未設定です（.env.local を確認）');
  process.exit(1);
}

/** 比較対象モデル */
const MODELS = [
  'gemini-3-flash-preview',
  'gemini-3.5-flash',
];

/** 各モデルの繰り返し回数 */
const REPEAT_COUNT = 3;

/** 料金テーブル（$/100万トークン） */
const PRICING: Record<string, { input: number; output: number }> = {
  'gemini-3-flash-preview': { input: 0.50, output: 3.00 },
  'gemini-3.5-flash':       { input: 1.50, output: 9.00 },
};

const USD_JPY = 150;

// ============================================================
// 型定義
// ============================================================

/** 既存マスタ（参考データ） */
interface MasterAccount {
  id: string;
  name: string;
  target: string;
  category: string;
  accountGroup: string;
}

/** テスト用新規科目（ユーザー作成、正解付き） */
interface TestNewAccount {
  name: string;
  expectedCategory: string;
  expectedTarget: string;
  expectedAccountGroup: string;
  expectedEnglishId: string;
}

/** AI応答 */
interface ClassifyResult {
  name: string;
  category: string;
  target: string;
  accountGroup: string;
  englishId: string;
  reasoning: string;
  missingInfo: string;
}

// ============================================================
// カテゴリ定義
// ============================================================

const ALL_CATEGORIES = {
  'PL_REVENUE': [
    'NET_SALES', 'SALES_REVENUE', 'REAL_ESTATE_INCOME',
    'NON_OPERATING_INCOME', 'EXTRAORDINARY_INCOME', 'REVERSALS',
  ],
  'PL_EXPENSE': [
    'COST_OF_PURCHASED_GOODS', 'BEGINNING_INVENTORY', 'BEGINNING_MERCHANDISE_INVENTORY',
    'ENDING_INVENTORY', 'ENDING_MERCHANDISE_INVENTORY',
    'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES', 'EXPENSES',
    'REAL_ESTATE_EXPENSES', 'REAL_ESTATE_EMPLOYEE_SALARY',
    'NON_OPERATING_EXPENSES', 'EXTRAORDINARY_LOSSES',
    'PROVISIONS', 'CORPORATE_INCOME_TAXES_CURRENT', 'CORPORATE_INCOME_TAXES_DEFERRED',
    'TRANSFERS_TO_OTHER_ACCOUNTS',
  ],
  'BS_ASSET': [
    'CASH_AND_DEPOSITS', 'TRADE_RECEIVABLES', 'MARKETABLE_SECURITIES',
    'INVENTORIES', 'OTHER_CURRENT_ASSETS', 'PROPERTY_PLANT_AND_EQUIPMENT',
    'INTANGIBLE_ASSETS', 'INVESTMENTS_AND_OTHER_ASSETS', 'DEFERRED_ASSETS',
    'OWNERS_DRAWINGS', 'SUNDRIES',
  ],
  'BS_LIABILITY': [
    'TRADE_PAYABLES', 'OTHER_CURRENT_LIABILITIES', 'NON_CURRENT_LIABILITIES',
    'OWNERS_CAPITAL',
  ],
  'BS_EQUITY': [
    'CAPITAL_STOCK', 'EQUITY', 'LEGAL_CAPITAL_SURPLUS', 'OTHER_CAPITAL_SURPLUS',
    'STOCK_SUBSCRIPTION_DEPOSITS', 'LEGAL_RETAINED_EARNINGS',
    'APPROPRIATED_RETAINED_EARNINGS', 'RETAINED_EARNINGS_BROUGHT_FORWARD',
    'TREASURY_STOCK', 'TREASURY_STOCK_SUBSCRIPTION_DEPOSITS',
    'VALUATION_AND_TRANSLATION_ADJUSTMENTS', 'SUBSCRIPTION_RIGHTS_TO_SHARES',
  ],
} as const;

const VALID_CATEGORIES = Object.values(ALL_CATEGORIES).flat();

/** categoryからaccountGroupを導出（MF英語categoryベース。MCP実機データに準拠） */
const REVENUE_CATEGORIES = ALL_CATEGORIES['PL_REVENUE'];
const EXPENSE_CATEGORIES = ALL_CATEGORIES['PL_EXPENSE'];
const ASSET_CATEGORIES = ALL_CATEGORIES['BS_ASSET'];
const LIABILITY_CATEGORIES = ALL_CATEGORIES['BS_LIABILITY'];

function deriveAccountGroup(category: string): string {
  if ((REVENUE_CATEGORIES as readonly string[]).includes(category)) return 'PL_REVENUE';
  if ((EXPENSE_CATEGORIES as readonly string[]).includes(category)) return 'PL_EXPENSE';
  if ((ASSET_CATEGORIES as readonly string[]).includes(category)) return 'BS_ASSET';
  if ((LIABILITY_CATEGORIES as readonly string[]).includes(category)) return 'BS_LIABILITY';
  return 'BS_EQUITY';
}

// ============================================================
// プロンプト構築
// ============================================================

function buildReferenceData(master: MasterAccount[]): string {
  const header = '科目名 | category | target | accountGroup | englishId';
  const separator = '─'.repeat(70);
  const rows = master.map(a =>
    `${a.name} | ${a.category} | ${a.target} | ${a.accountGroup} | ${a.id}`
  );
  return [header, separator, ...rows].join('\n');
}

function buildSystemInstruction(master: MasterAccount[]): string {
  const refData = buildReferenceData(master);
  return `# あなたの役割

あなたは会計事務所のアシスタントです。
新しい勘定科目が追加されたとき、以下の4つを決める仕事をします。

# 判定対象（4フィールド）

1. **category**: 29種のどのカテゴリに属するか
2. **target**: 法人専用(corp)、個人専用(individual)、両方(both)のどれか
3. **accountGroup**: BS_ASSET / BS_LIABILITY / PL_REVENUE / PL_EXPENSE / BS_EQUITY のどれか
4. **englishId**: プログラム用英語ID（UPPER_SNAKE_CASE）

# 判定の進め方（この順番で必ず確認すること）

## ステップ1: 既存マスタに同名または類似の科目があるか確認する

既存マスタに同名の科目があれば、そのcategory・target・accountGroupをそのまま使う。
名前が似ている科目（例:「交際費」と「接待交際費」）があれば、それに合わせる。

## ステップ2: target（事業形態）を判定する

**原則: 法人/個人特有の科目である合理的な根拠がなければ both（法人・個人共通）にする。**

以下に既存マスタのcorp/individual全科目を列挙する。新規科目がこれらと同じ制度的概念に属する場合のみcorp/individualにする。該当しなければboth。

### 既存マスタのcorp（法人専用）科目一覧（49件）:
その他の預金、商品、製品、材料、仕掛品、貯蔵品、前払費用、短期貸付金、未収入金、立替金、貸倒引当金、建物附属設備、機械装置、器具備品、建設仮勘定、ソフトウェア、投資有価証券、長期貸付金、役員貸付金、長期前払費用、短期借入金、未払費用、役員借入金、退職給付引当金、資本金、資本準備金、繰越利益剰余金、売上値引・返品、外注費、仕入高、仕入値引・返品、役員報酬、給料手当、賞与、通勤費、消耗品費、保険料、賃借料、諸会費、寄付金、貸倒引当金繰入額、貸倒損失、受取利息、受取配当金、雑収入、支払利息、雑損失、固定資産売却益、固定資産売却損

### 既存マスタのindividual（個人事業専用）科目一覧（52件）:
その他の預金、商品、貯蔵品、材料、仕掛品、製品、貸付金、立替金、未収金、工具器具備品、機械装置、開業費、事業主貸、事業主借、元入金、借入金、貸倒引当金、未確定勘定、売上値引・返品、家事消費等、雑収入、期首商品棚卸高、仕入高、仕入値引・返品、期末商品棚卸高、損害保険料、消耗品費、給料賃金、退職給与、外注工賃、利子割引料、貸倒金(損失)、研修採用費、貸倒引当金戻入、専従者給与、貸倒引当金繰入、賃貸料(不動産)、礼金・権利金更新料(不動産)、名義書換料その他(不動産)、租税公課(不動産)、損害保険料(不動産)、修繕費(不動産)、減価償却費(不動産)、借入金利子(不動産)、地代家賃(不動産)、給料賃金(不動産)、外注管理費(不動産)、旅費交通費(不動産)、新聞図書費(不動産)、その他の経費(不動産)、専従者給与(不動産)、資産譲渡損

### corp/individualの判定ポイント:
上記リストの多くは**同じ概念で名前が違うだけ**（例: 法人「器具備品」= 個人「工具器具備品」）。
本当に制度的にcorp/individualでなければならないのは以下の概念のみ:

**corp固有の制度的概念:**
- 「役員」を含む科目（役員報酬、役員貸付金、役員借入金 等）
- 「資本金」「資本準備金」「剰余金」「利益準備金」→ 法人の資本制度
- 「株式」「株主」「新株」→ 法人の株式制度
- 「賞与」→ 法人特有の費目
- 「退職給付引当金」→ 法人会計基準

**individual固有の制度的概念:**
- 「事業主貸」「事業主借」→ 個人事業特有
- 「元入金」→ 個人事業の資本
- 「専従者」を含む科目 → 個人事業の専従者制度
- 「家事消費」→ 個人事業特有
- 「(不動産)」が付いた科目 → 個人の不動産所得

### 上記以外は全て both
法人/個人特有の科目である合理的な根拠がなければ both にする。
例: ポイント引当金→both（個人でもポイント制度は使える。引当金という名前だけでcorpにしない）

## ステップ3: categoryを判定する

以下の条件分岐に従ってcategoryを決める。上から順に確認し、最初にマッチしたものを使う。

### BS資産系（accountGroup = BS_ASSET）
- 科目名に「現金」「預金」「キャッシュ」が含まれる → **現金及び預金**
- 科目名に「売掛」「受取手形」「未収売上」が含まれる → **売上債権**
- 科目名に「有価証券」が含まれる（「投資」が付かない） → **有価証券**
- 科目名に「商品」「製品」「材料」「仕掛品」「貯蔵品」「棚卸」が含まれる → **棚卸資産**
- 科目名に「建物」「構築物」「車両」「機械」「工具」「器具」「備品」「土地」「船舶」「附属設備」が含まれる → **有形固定資産**
- 科目名に「ソフトウェア」「特許」「商標」「借地権」「電話加入権」「のれん」が含まれる → **無形固定資産**
- 科目名に「出資金」「投資有価証券」「長期貸付」「差入保証金」「敷金」「保証金」が含まれる → **投資その他**
- 科目名に「創立費」「開業費」「開発費」が含まれる → **繰延資産**
- 科目名に「前払」「未収」「立替」「仮払」「短期貸付」「貸付金」が含まれる → **その他流動資産**

### BS負債系（accountGroup = BS_LIABILITY）
- 科目名に「買掛」「支払手形」が含まれる → **仕入債務**
- 科目名に「長期借入」「退職給付」「役員借入」が含まれる → **固定負債**
- 科目名に「未払」「預り」「前受」「仮受」「短期借入」「借入金」が含まれる → **その他流動負債**

### BS純資産系（accountGroup = BS_EQUITY）
- 科目名が「事業主貸」 → **事業主貸**
- 科目名が「事業主借」 → **事業主借**
- 科目名に「元入金」が含まれる → **資本の部**
- 科目名に「資本金」「剰余金」「資本準備金」が含まれる → **純資産**
- 科目名に「諸口」「未確定」が含まれる → **諸口**

### PL収益系（accountGroup = PL_REVENUE）
- 科目名に「(不動産)」が付いていて収入系 → **不動産収入**
- 科目名に「売上」「売上高」が含まれる → **売上**
- 科目名に「受取利息」「受取配当」「雑収入」が含まれる → **営業外収益**
- 科目名に「固定資産売却益」が含まれる → **特別利益**

### PL費用系（accountGroup = PL_EXPENSE）
- 科目名に「(不動産)」が付いている → **不動産経費**
- 科目名に「仕入」「期首商品」「期末商品」「売上原価」「外注費」が含まれる → **売上原価**
- 科目名に「支払利息」「為替差損」「雑損失」が含まれる → **営業外費用**
- 科目名に「固定資産売却損」が含まれる → **特別損失**
- 科目名に「引当金繰入」「貸倒引当金繰入」が含まれる → **繰入額等**
- 科目名に「引当金戻入」が含まれる → **繰戻額等**
- 科目名に「専従者給与」が含まれる → **繰入額等**
- 上記に該当しない経費系 → targetがindividualなら**経費**、corpなら**販管費**、bothなら既存マスタの類似科目に合わせる

## ステップ4: accountGroupを判定する

categoryとaccountGroupは連動する。以下のルールに従う：
- 売上/不動産収入/営業外収益/特別利益 → **PL_REVENUE**
- 経費/売上原価/販管費/不動産経費/営業外費用/繰入額等/特別損失/繰戻額等 → **PL_EXPENSE**
- 現金及び預金/売上債権/有価証券/その他流動資産/有形固定資産/無形固定資産/投資その他/棚卸資産/繰延資産 → **BS_ASSET**
- 仕入債務/その他流動負債/固定負債 → **BS_LIABILITY**
- 純資産/事業主貸/事業主借/資本の部/諸口 → **BS_EQUITY**

## ステップ5: チェックリスト（判定後に必ず全項目を確認）

判定した結果が正しいか、以下の全項目を確認してください。
1つでもNGなら判定をやり直してください。

### categoryチェック
- [ ] categoryは29種のどれかか？
- [ ] targetがindividualなのに「販管費」にしていないか？（個人事業の一般経費は「経費」）
- [ ] targetがcorpなのに「経費」にしていないか？（法人の一般経費は「販管費」）
- [ ] 「(不動産)」が付いた科目なのに不動産系カテゴリにしているか確認
- [ ] 既存マスタに同名科目があれば、そのcategoryと一致しているか？

### targetチェック
- [ ] targetはcorp/individual/bothのどれかか？
- [ ] corp/individualにした場合、法人/個人特有の制度的概念である合理的な根拠があるか？根拠がなければboth
- [ ] 「役員」「株式」「株主」「新株」が含まれるのにbothにしていないか？ → corpにすべき
- [ ] 「事業主」「元入金」「専従者」「家事消費」「(不動産)」が含まれるのにbothにしていないか？ → individualにすべき
- [ ] 「引当金」という名前だけでcorpにしていないか？ → 引当金は個人でも使える

### accountGroupチェック
- [ ] categoryとaccountGroupが連動しているか？（上記ルール参照）

### englishIdチェック
- [ ] UPPER_SNAKE_CASEか？（英大文字とアンダースコアと数字のみ）
- [ ] 意味のある英語になっているか？
- [ ] 既存マスタのIDと重複していないか？
- [ ] 30文字以内か？
- [ ] 「〜費」「〜料」の部分を英語にしていないか？（下記の命名規約を参照）

### englishId命名規約（重要）

既存マスタのIDは「〜費」「〜料」「〜金」の部分を英語に含めない。概念だけをIDにする。
FEES, EXPENSES, COSTS, CHARGES 等を末尾に付けてはいけない。

具体例（既存マスタから）:
- 福利厚生費 → WELFARE（× WELFARE_EXPENSES）
- 通信費 → COMMUNICATION（× COMMUNICATION_FEES）
- 広告宣伝費 → ADVERTISING（× ADVERTISING_EXPENSES）
- 消耗品費 → SUPPLIES（× SUPPLIES_EXPENSES）
- 旅費交通費 → TRAVEL（× TRAVEL_EXPENSES）
- 水道光熱費 → UTILITIES（× UTILITY_COSTS）
- 外注工賃 → OUTSOURCING（× OUTSOURCING_FEES）
- 地代家賃 → RENT（× RENT_EXPENSES）

ただし「支払手数料」→ FEES のように、概念自体がFEESの場合はOK。
「決済手数料」→ SETTLEMENT_FEES のように「手数料」が概念の本質の場合もOK。

# 「分かりません」の回答について

自信がない場合、無理に答えないでください。
- 判断できないフィールド → 「UNKNOWN」と返す
間違った回答をするより「UNKNOWN」と正直に言う方がずっと良いです。

UNKNOWNと答えた場合は、missingInfoに「どんな情報や前提条件があれば判断できるか」を必ず書いてください。
例:
- 「この科目が費用なのか資産なのか不明。勘定科目の性質（BS/PL）が分かれば判定可能」
- 「類似科目が既存マスタにないため判断根拠がない。業種情報があれば判定可能」

# 既存マスタ（参考データ: ${master.length}件）

以下は既に確定している勘定科目です。新規科目の判定時に必ず参考にしてください。

${refData}

# 出力ルール
- categoryは29種 + 「UNKNOWN」から選択
- targetはcorp / individual / both / UNKNOWN から選択
- accountGroupはBS_ASSET / BS_LIABILITY / PL_REVENUE / PL_EXPENSE / BS_EQUITY / UNKNOWN から選択
- englishIdはUPPER_SNAKE_CASE。判断できない場合は「UNKNOWN」
- reasoning（判定根拠）を必ず書く
- missingInfo: UNKNOWNの場合に「どんな情報があれば判断できるか」を書く。判断できた場合は空文字
- 各科目について name、category、target、accountGroup、englishId、reasoning、missingInfo を返す
`;
}

function buildRequestPrompt(newAccounts: TestNewAccount[]): string {
  const list = newAccounts.map((a, i) =>
    `${i + 1}. ${a.name}`
  ).join('\n');

  return `以下の${newAccounts.length}件は新規追加される勘定科目です。
既存マスタを参考にして、それぞれの category、target、accountGroup、englishId を判定してください。

${list}

各科目について results 配列に順番通りに結果を返してください。`;
}

// ============================================================
// Structured Output Schema
// ============================================================

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      description: '各科目の判定結果。入力と同じ順序で返す',
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: '科目名（入力と同じ値をそのまま返す）',
          },
          category: {
            type: Type.STRING,
            description: '科目分類（29種のいずれか、またはUNKNOWN）',
          },
          target: {
            type: Type.STRING,
            description: '事業形態（corp/individual/both、またはUNKNOWN）',
          },
          accountGroup: {
            type: Type.STRING,
            description: '勘定科目グループ（BS_ASSET/BS_LIABILITY/PL_REVENUE/PL_EXPENSE/BS_EQUITY、またはUNKNOWN）',
          },
          englishId: {
            type: Type.STRING,
            description: '英語ID（UPPER_SNAKE_CASE、またはUNKNOWN）',
          },
          reasoning: {
            type: Type.STRING,
            description: '判定根拠。なぜそう判断したか、どの既存科目を参考にしたかを簡潔に説明',
          },
          missingInfo: {
            type: Type.STRING,
            description: 'UNKNOWNの場合、どんな情報があれば判断できるかを説明。判断できた場合は空文字',
          },
        },
        required: ['name', 'category', 'target', 'accountGroup', 'englishId', 'reasoning', 'missingInfo'],
      },
    },
  },
  required: ['results'],
};

// ============================================================
// API呼出
// ============================================================

interface TestResult {
  model: string;
  round: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  durationMs: number;
  costYen: number;
  results: ClassifyResult[];
  error: string | null;
}

async function runClassifyTest(
  ai: GoogleGenAI,
  model: string,
  round: number,
  systemInstruction: string,
  testAccounts: TestNewAccount[],
): Promise<TestResult> {
  const start = Date.now();

  try {
    const prompt = buildRequestPrompt(testAccounts);

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0,
      },
    });

    const usage = response.usageMetadata;
    const promptTokens = usage?.promptTokenCount ?? 0;
    const completionTokens = usage?.candidatesTokenCount ?? 0;

    const price = PRICING[model] ?? { input: 0, output: 0 };
    const costYen = (
      (promptTokens * price.input / 1_000_000) +
      (completionTokens * price.output / 1_000_000)
    ) * USD_JPY;

    const text = response.text ?? '';
    let parsed: { results?: ClassifyResult[] } = {};
    try { parsed = JSON.parse(text); } catch { /* パース失敗 */ }

    return {
      model,
      round,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      durationMs: Date.now() - start,
      costYen,
      results: parsed.results ?? [],
      error: null,
    };
  } catch (err) {
    return {
      model, round,
      promptTokens: 0, completionTokens: 0, totalTokens: 0,
      durationMs: Date.now() - start, costYen: 0,
      results: [],
      error: String(err),
    };
  }
}

// ============================================================
// 精度評価
// ============================================================

interface DetailRecord {
  name: string;
  expectedCategory: string;
  actualCategory: string;
  categoryOk: boolean;
  expectedTarget: string;
  actualTarget: string;
  targetOk: boolean;
  expectedAccountGroup: string;
  actualAccountGroup: string;
  accountGroupOk: boolean;
  accountGroupConsistent: boolean; // categoryから導出した値と一致するか
  expectedEnglishId: string;
  actualEnglishId: string;
  englishIdOk: boolean;
  reasoning: string;
  missingInfo: string;
}

interface AccuracyReport {
  model: string;
  round: number;
  total: number;
  categoryCorrect: number;
  categoryRate: string;
  targetCorrect: number;
  targetRate: string;
  accountGroupCorrect: number;
  accountGroupRate: string;
  accountGroupInconsistent: number;
  englishIdExact: number;
  englishIdExactRate: string;
  unknownCount: number;
  details: DetailRecord[];
}

function evaluate(
  model: string,
  round: number,
  testAccounts: TestNewAccount[],
  results: ClassifyResult[],
): AccuracyReport {
  const total = testAccounts.length;
  let categoryCorrect = 0;
  let targetCorrect = 0;
  let accountGroupCorrect = 0;
  let accountGroupInconsistent = 0;
  let englishIdExact = 0;
  let unknownCount = 0;
  const details: DetailRecord[] = [];

  for (let i = 0; i < total; i++) {
    const expected = testAccounts[i];
    if (!expected) continue;

    const actual = results.find(r => r.name === expected.name) ?? results[i];

    const catOk = actual?.category === expected.expectedCategory;
    const tgtOk = actual?.target === expected.expectedTarget;
    const agOk = actual?.accountGroup === expected.expectedAccountGroup;
    const idOk = actual?.englishId === expected.expectedEnglishId;

    if (catOk) categoryCorrect++;
    if (tgtOk) targetCorrect++;
    if (agOk) accountGroupCorrect++;
    if (idOk) englishIdExact++;

    // 整合性チェック: AIのcategoryから導出したaccountGroupと、AIのaccountGroupが一致するか
    let consistent = true;
    if (actual && actual.category !== 'UNKNOWN' && actual.accountGroup !== 'UNKNOWN') {
      const derived = deriveAccountGroup(actual.category);
      consistent = derived === actual.accountGroup;
      if (!consistent) accountGroupInconsistent++;
    }

    if (actual?.category === 'UNKNOWN' || actual?.target === 'UNKNOWN' || actual?.accountGroup === 'UNKNOWN') {
      unknownCount++;
    }

    // category妥当性チェック（29種 + UNKNOWN以外は無効）
    if (actual && actual.category !== 'UNKNOWN' && !(VALID_CATEGORIES as readonly string[]).includes(actual.category)) {
      console.warn(`  ⚠️ 無効なcategory: "${actual.category}"（${expected.name}）`);
    }

    details.push({
      name: expected.name,
      expectedCategory: expected.expectedCategory,
      actualCategory: actual?.category ?? '(応答なし)',
      categoryOk: catOk,
      expectedTarget: expected.expectedTarget,
      actualTarget: actual?.target ?? '(応答なし)',
      targetOk: tgtOk,
      expectedAccountGroup: expected.expectedAccountGroup,
      actualAccountGroup: actual?.accountGroup ?? '(応答なし)',
      accountGroupOk: agOk,
      accountGroupConsistent: consistent,
      expectedEnglishId: expected.expectedEnglishId,
      actualEnglishId: actual?.englishId ?? '(応答なし)',
      englishIdOk: idOk,
      reasoning: actual?.reasoning ?? '(根拠なし)',
      missingInfo: actual?.missingInfo ?? '',
    });
  }

  return {
    model, round, total,
    categoryCorrect, categoryRate: (categoryCorrect / total * 100).toFixed(1),
    targetCorrect, targetRate: (targetCorrect / total * 100).toFixed(1),
    accountGroupCorrect, accountGroupRate: (accountGroupCorrect / total * 100).toFixed(1),
    accountGroupInconsistent,
    englishIdExact, englishIdExactRate: (englishIdExact / total * 100).toFixed(1),
    unknownCount,
    details,
  };
}

// ============================================================
// メイン
// ============================================================

const TARGET_LABELS: Record<string, string> = {
  individual: '個人',
  corp: '法人',
  both: '共通',
};

async function main() {
  console.log('='.repeat(80));
  console.log('G1: 勘定科目AI分類テスト（本番同等条件・4フィールド判定）');
  console.log('★ 既存マスタを参考データとして渡し、新規科目を推定');
  console.log(`プロジェクト: ${PROJECT_ID}`);
  console.log(`モデル: ${MODELS.join(' / ')}  ×${REPEAT_COUNT}回ずつ`);
  console.log('='.repeat(80));

  // 既存マスタ読み込み
  const master = JSON.parse(readFileSync('data/account-master.json', 'utf8')) as MasterAccount[];
  console.log(`\n参考データ: ${master.length}件の既存マスタ`);

  // テスト用新規科目
  const testFile = 'data/test-new-accounts.json';
  if (!existsSync(testFile)) {
    console.error(`\n❌ テストデータが見つかりません: ${testFile}`);
    console.log('\n以下の形式でファイルを作成してください:');
    console.log(JSON.stringify([
      {
        name: '（新規科目名）',
        expectedCategory: '（29種のいずれか）',
        expectedTarget: 'both | corp | individual',
        expectedAccountGroup: 'BS_ASSET | BS_LIABILITY | PL_REVENUE | PL_EXPENSE | BS_EQUITY',
        expectedEnglishId: '（UPPER_SNAKE_CASE）',
      },
    ], null, 2));
    process.exit(1);
  }

  const testAccounts = JSON.parse(readFileSync(testFile, 'utf8')) as TestNewAccount[];
  console.log(`テスト対象: ${testAccounts.length}件`);
  for (const a of testAccounts) {
    console.log(`  - ${a.name}`);
  }

  const systemInstruction = buildSystemInstruction(master);
  console.log(`\nSystem Instruction: ${systemInstruction.length}文字`);

  const ai = new GoogleGenAI({ vertexai: true, project: PROJECT_ID, location: LOCATION });

  const allReports: AccuracyReport[] = [];

  for (const model of MODELS) {
    for (let round = 1; round <= REPEAT_COUNT; round++) {
      console.log(`\n${'━'.repeat(80)}`);
      console.log(`🤖 ${model} — 第${round}回`);
      console.log('━'.repeat(80));

      const result = await runClassifyTest(ai, model, round, systemInstruction, testAccounts);

      if (result.error) {
        console.log(`❌ エラー: ${result.error}`);
        continue;
      }

      console.log(`✅ ${result.durationMs}ms | トークン: ${result.totalTokens} | ¥${result.costYen.toFixed(4)}`);

      const report = evaluate(model, round, testAccounts, result.results);
      allReports.push(report);

      // 精度サマリ
      console.log(`\n📊 精度:`);
      console.log(`  category:     ${report.categoryCorrect}/${report.total} (${report.categoryRate}%)`);
      console.log(`  target:       ${report.targetCorrect}/${report.total} (${report.targetRate}%)`);
      console.log(`  accountGroup: ${report.accountGroupCorrect}/${report.total} (${report.accountGroupRate}%)`);
      console.log(`  englishId:    ${report.englishIdExact}/${report.total} (${report.englishIdExactRate}%)`);
      if (report.unknownCount > 0) console.log(`  ❓ UNKNOWN: ${report.unknownCount}件`);
      if (report.accountGroupInconsistent > 0) console.log(`  ⚠️ accountGroup不整合: ${report.accountGroupInconsistent}件`);

      // 全件詳細
      console.log(`\n📋 全件詳細:`);
      for (const d of report.details) {
        const catMark = d.categoryOk ? '✅' : d.actualCategory === 'UNKNOWN' ? '❓' : '❌';
        const tgtMark = d.targetOk ? '✅' : d.actualTarget === 'UNKNOWN' ? '❓' : '❌';
        const agMark = d.accountGroupOk ? '✅' : d.actualAccountGroup === 'UNKNOWN' ? '❓' : '❌';
        const idMark = d.englishIdOk ? '✅' : d.actualEnglishId === 'UNKNOWN' ? '❓' : '❌';
        console.log(`  ${'─'.repeat(70)}`);
        console.log(`  📌 ${d.name}（target正解: ${TARGET_LABELS[d.expectedTarget] ?? d.expectedTarget}）`);
        console.log(`     category:     ${catMark} ${d.actualCategory}${!d.categoryOk && d.actualCategory !== 'UNKNOWN' ? ` (正解: ${d.expectedCategory})` : ''}`);
        console.log(`     target:       ${tgtMark} ${d.actualTarget}${!d.targetOk && d.actualTarget !== 'UNKNOWN' ? ` (正解: ${d.expectedTarget})` : ''}`);
        console.log(`     accountGroup: ${agMark} ${d.actualAccountGroup}${!d.accountGroupOk && d.actualAccountGroup !== 'UNKNOWN' ? ` (正解: ${d.expectedAccountGroup})` : ''}${!d.accountGroupConsistent ? ' ⚠️不整合' : ''}`);
        console.log(`     englishId:    ${idMark} ${d.actualEnglishId}${!d.englishIdOk && d.actualEnglishId !== 'UNKNOWN' ? ` (正解: ${d.expectedEnglishId})` : ''}`);
        console.log(`     根拠: ${d.reasoning}`);
        if (d.missingInfo) {
          console.log(`     💡 必要情報: ${d.missingInfo}`);
        }
      }
    }
  }

  // 全ラウンド比較
  if (allReports.length >= 2) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 全ラウンド比較');
    console.log('='.repeat(80));
    console.log('');
    console.log('モデル                  | 回 | category | target | accGroup | englishId | UNKNOWN | 不整合');
    console.log('─'.repeat(95));
    for (const r of allReports) {
      console.log(
        `${r.model.padEnd(24)}| ${String(r.round).padStart(2)} | ` +
        `${r.categoryRate.padStart(5)}%   | ` +
        `${r.targetRate.padStart(5)}% | ` +
        `${r.accountGroupRate.padStart(5)}%   | ` +
        `${r.englishIdExactRate.padStart(5)}%    | ` +
        `${String(r.unknownCount).padStart(3)}件  | ` +
        `${r.accountGroupInconsistent}件`
      );
    }
  }
}

main().catch(console.error);
