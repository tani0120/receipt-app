# パイプライン 意思決定ログ（Decision Log）

> **このファイルの役割：Why + Evidence（なぜそう決めたか・証拠）**
> TSファイルで確認できるWhat（型・定数・実装）はここに書かない。
> 更新ルール：設計変更・テスト実施・廃止判断の都度、日付と根拠を追記すること。

---

## DL-001 | N:N統一設計の採用（2026-04-04）

**決定**: 全source_typeで `line_items[]` を使用。1枚1行/1枚N行の分岐なし。

**なぜ採用したか**:

- T-P4実測で、Geminiは通帳・クレカの全行（N件）を `line_items[]` として正確に返せることが確認できた
- 「レシート=1件」「通帳=N件」でプロンプトを分岐させると、ルール管理が2倍になる
- `line_items.length === 1`（レシート）と `line_items.length === N`（通帳）を同じ型で処理できる

**根拠（Evidence）（T-P4実測 2026-04-03）**:

- 通帳23行: date/description/amount/direction/balance の5フィールドを **100%正確**に抽出
- クレカ6行: 同上（balance=null）**100%正確**
- ファイル: `src/scripts/classify_test.ts`

**廃止した代替案**:

- 1:N設計（レシート専用プロンプト + 明細専用プロンプト）→ プロンプト分岐管理コストが高い

---

## DL-002 | journal_inference不要確定（2026-04-04）

**決定**: GeminiにJournal（仕訳）を推論させない。TSルールで確定できる。

**なぜ不要か**:

- vendor_vector（66種）× direction（expense/income）→ industry_vector辞書でACCOUNT_MASTER IDが導出できる
- 44種（67%）はレベルA（自動確定）なのでGeminiに推論させる必要がない
- 残り22種はinsufficient（情報不足）で人間がUIで選択する設計のため、Geminiの推論精度が問題にならない

**根拠（Evidence）**:

- vendor_vector_41_reference.md: 66種中44種が一意確定（67%）
- Geminiの仕訳推論精度はテスト未実施。テストせずに不要と判定した理由:
  TSルールが決定論的（再現性100%）なのに対し、Geminiは確率的。科目は決定論的であるべき。

---

## DL-003 | LineItem v1で含めなかったフィールドとその理由（2026-04-04）

**決定**: 以下のフィールドはLineItemに含めない。

| フィールド                         | 含めない理由                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| `tax_rate`                         | ReceiptItemの責務。通帳・クレカの1行には税率欄が存在しない                                      |
| `date_on_document`                 | `date === null` のフラグとして `date` 自体が機能する。冗長                                      |
| `debit_account` / `credit_account` | classify_schema.ts旧世代の残骸。T-P4実測でdirectionで代替確認済み                               |
| `vendor_id`                        | マスタ照合前の段階（Step 3入力前）では未確定。不確定な外部IDをLineItemに持たせない              |
| `line_index`（Gemini出力から）     | Geminiに返させない。コード側（assignLineIndex）で付番する設計（任意の順序で返す可能性への防御） |

---

## DL-004 | transformToJournalMock.ts 削除判断（2026-04-04）

**決定**: 即削除（Phase 2まで待たない）。

**削除の根拠（3点）**:

1. どこからもimportされていない（`src/` 内grep: 参照ゼロ件確認）
2. 入力型が `GeminiClassifyResponse`（旧設計）のため新パイプライン（LineItem→JournalPhase5Mock）の変換関数として機能しない
3. `source_type / direction / vendor_vector = null` で埋めていた（型エラー回避の穴埋め）

**「Phase 2まで待つ」という先送りを拒否した理由**:

- 使用箇所ゼロ・旧世代・穴埋めが揃っており「残す価値ゼロ」を確認できていた
- 先送りにより「変換関数が存在する」という錯覚を生み出すリスクの方が高い

---

## DL-005 | tsconfig.scripts.json 新規作成（根本解決）（2026-04-04）

**決定**: src/scripts/ 専用のtsconfig.scripts.jsonを新規作成して@/エイリアスを有効化。

**なぜ対症療法（個別ファイルの@/→相対パス書き換え）ではなく根本解決にしたか**:

- `tsconfig.app.json` が `"exclude": ["src/scripts/**"]` しているため、今後も同じ問題が再発する
- 毎回個別修正は技術的負債の積み上げ
- tsconfig.json の `references` に追加することで VSCode が認識し、IDE補完も機能するようになる

---

## DL-006 | VendorVector 66種の採用判断（2026-04-04）

**決定**: 66種はGemini精度テスト（T-P3）の結果に関係なく採用確定。

**なぜGemini精度に依存しないか**:

- vendor_vector は「Geminiがリアルタイムに推定するもの」ではない
- vendors_global.ts / vendors_ldi.ts 等のマスタに**人間が手動設定するフィールド**（主用途）
- Layer 1-3（T番号・電話・名称）でマスタ照合できれば Gemini不要で vendor_vector が確定する
- T-P3で確認するのは「Layer 4 Geminiフォールバックの精度」のみ

**根拠（Evidence）**: vendor_vector_41_reference.md（設計原則セクション参照）

---

## DL-007 | MEDICAL_TRIAGE廃止（2026-03-31）

**決定**: 医療費領収書は全て non_journal（仕訳対象外）。MEDICAL_TRIAGE（3分岐）廃止。

**旧設計**:

- 仕訳しない（non_journal）/ 確定申告用（medical_certificate）/ 通常経費（receipt）の3分岐

**廃止の理由**:

- コスト実測（1.8円/枚）から、1000件に1回の福利厚生費よりも、毎年大量発生する個人医療費の分別の方が価値が高いと判断
- medical_certificate（医療費証明書）を新たなsource_typeとして維持するコストが高い
- 法人で健康診断費用（WELFARE）になるケースはUI上で「注意label」を付与して人間に判断させる

**結果**: source_type から `medical_certificate` を削除。source_type は11種に確定。
→ **2026-04-12 DL-035で `supplementary_doc`（補助資料）追加。12種に拡張。**

---

## DL-008 | Gemini責務境界の確定（2026-04-04）

**決定**: Geminiは「目」（読み取り専用）。TSは「電卓」（確定的計算）。

**Geminiを使う・使わない の分類基準**:

| 基準                         | Gemini  | TS      |
| ---------------------------- | ------- | ------- |
| 画像の文脈理解が必要         | ✅ 使う | ✗       |
| 決定論的に計算できる         | ✗       | ✅ 使う |
| 精度が100%未満でも許容できる | ✅ 使う | ✗       |
| 仕訳科目の確定（決定論必須） | ✗       | ✅ 使う |

**責務確定（テスト済み）**:

| 責務                                       | 担当         | 根拠（Evidence）                                 |
| ------------------------------------------ | ------------ | ------------------------------------------------ |
| source_type判定（12種：証票種別）          | Gemini       | T-00k/T-P1: **100%**（2026-04-02）               |
| direction判定（4種：仕訳方向）             | Gemini       | T-P1(v5): **28/28=100%**（2026-04-02）           |
| line_items[]抽出                           | Gemini       | T-P4: **通帳23行・クレカ6行=100%**（2026-04-03） |
| vendor_vector（Layer 4フォールバックのみ） | Gemini       | **T-P3未実施（★最優先）**                        |
| history_match（過去仕訳照合）              | TS完結       | —                                                |
| Layer 1-3マッチ（マスタ照合）              | TS完結       | —                                                |
| 科目確定（Step 4）                         | TS完結       | —                                                |
| 税区分自動設定                             | TS完結       | —                                                |
| journal_inference（仕訳推論）              | **不要確定** | DL-002参照                                       |

---

## DL-009 | LineItem.counterpart_account の設計根拠（2026-04-04）

**決定**: `counterpart_account` フィールドをLineItemに追加。source_type×directionのマップで導出。

**なぜLineItemに持たせるか**:

- JournalPhase5Mock への変換時（lineItemToJournalMock()）に相手勘定が必要
- source_type は PipelineResult が持つが、LineItem への変換関数に都度渡すよりフィールドとして持たせる方が見通しがよい

**マッピング根拠**:

- voucherTypeRules.ts のルール（クレカ→ACCRUED_EXPENSES等）と整合している
- account-master.ts で全ID確認済み
- voucherTypeRules.ts と矛盾がないことを設計時に確認済み

---

## DL-010 | コスト実測（2026-03-31）

**根拠（Evidence）（Run A: 18件テスト）**:

| 項目                  | 値                                                                  |
| --------------------- | ------------------------------------------------------------------- |
| 総コスト              | 27.5円                                                              |
| **1枚平均**           | **1.53円（Gemini）+ 0.23円（OCR前処理）= 1.8円**                    |
| Phase A見積り（当初） | 7-9円/枚                                                            |
| 15円/枚制約           | **大幅に下回る**                                                    |
| 結論                  | 全件Gemini処理でコスト無視可能。document_filterの価値は品質管理のみ |

---

## DL-011 | document_filter廃止・Gemini直接判定採用（2026-04-02）

**決定**: TSキーワードマッチ（document_filter）は不要。Geminiに直接判定させる。

**根拠（Evidence）（T-00k: 実物証票15件）**:

| 条件                                | 件数  | 分類正解率 | source_type正解率 | 処理時間                |
| ----------------------------------- | ----- | ---------- | ----------------- | ----------------------- |
| 前処理なし                          | 15/15 | **100%**   | **100%**          | 18.0秒/枚               |
| 前処理あり（image_preprocessor.ts） | 15/15 | **100%**   | **100%**          | **6.3秒/枚（65%短縮）** |

**廃止した代替案**:

- TSキーワードマッチによる事前フィルタリング → 実装・メンテコストのわりに効果なし
- 画像前処理（image_preprocessor.ts）によるトークン18%削減の方が高効率

---

## DL-012 | vendor_name フィールドのLineItem追加判断（2026-04-04）

**決定**: `vendor_name?: string | null` を今（T-P3前に）追加する。

**なぜT-P3前でも追加できるか**:

- 型は `string | null` でGemini精度に関係なく確定できる
- 精度が悪い場合は `null` が返るだけで、型として問題ない
- 「T-P3精度確認前に追加できない」は誤り（型定義はGemini精度に依存しない）

**T-P3で確認すること（型追加とは別）**:

- vendor_nameの実際の抽出精度（摘要からの取引先名）
- nullの発生割合
- T-N1c（正規化）に渡すのに十分な品質かどうか

---

## DL-013 | Honoルートはチェーン形式でないとRPC型推論が機能しない（2026-04-04）

**決定**: `src/api/routes/` 配下の全Honoルートファイルはメソッドチェーン形式で定義する。命令型（`app.get(...)` を個別に呼び出す）を禁止。

**なぜか（技術的根拠）**:

- Honoの `hc<AppType>()` RPC クライアントは `AppType = typeof routes` で型を推論する
- `const routes = app.get(...).post(...).route(...)` のチェーン形式では各ルートの型情報が `routes` 変数に蓄積される
- `app.get(...)` を個別の文として実行すると、戻り値（型情報）が捨てられ `app` の型は `Hono<Env, BlankSchema>` のまま変わらない
- 結果: `client.api['ai-rules']` にアクセスしても TypeScript が型を解決できず `TS7053: any` になる

**根拠・証拠（Evidence）（修正前後）**:

- 修正前: `useAIRulesRPC.ts` L38, L52 に `TS7053: Property 'ai-rules' does not exist` × 2件
- 修正後: 命令型 → チェーン形式に書き直し → TS7053 0件

**副次的に発見した問題**:

- `LearningRuleUi` 型に存在しない `actions` フィールドがモックデータに混入していた
  → 命令型のときは型が `any` だったため検出されなかった（チェーン形式で初めて表面化）
- `rules[index]` の `undefined` の可能性が `findIndex` 確認後でも型推論上残る
  → `as LearningRuleUi` キャストで対処（`findIndex !== -1` の後なので実行時安全）

**今後のルール（再発防止）**:

- 新規ルートファイル作成時は必ずチェーン形式: `const app = new Hono().get(...).post(...)`
- `export default app` の前に `export type AppRouteType = typeof app` を追加することを推奨

---

## DL-014 | Layer 4 取引先業種判定フロー確定（2026-04-04）

**状態**: 設計確定（未定義事項あり。T-P3プロンプト設計時に補完）

### 確定フロー

```
Step 3: L1-3（T番号・電話・正規化）
  ↓ 照合成功 → 科目直決定（vendor_vectorはマスタ取得。Gemini不要）

  ↓ 照合失敗 → Layer 4（Geminiフォールバック）

  ① 人名のみ
     → 即 'unknown'（絶対ルール。名前から業種は判断不可能）

  ② source_type が bank_statement / credit_card
     → 即 'unknown'（構造的に住所・電話が存在しない）

  ③ source_type が receipt / invoice_received かつ
     住所または電話番号がOCRで取得できている
     → GSG（Google Search Grounding）実行
       ↓ 2つ以上の独立ソース一致かつ業種が明記
         → 65種のいずれかを返す
       ↓ 不一致・業種不明記・混同リスク
         → 'unknown'

  ④ ③以外（住所・電話なし）
     → 即 'unknown'

  ⑤ 摘要・取引先情報が空または意味不明
     → null（情報がそもそもない）
```

### vendor_vector 3状態の確定定義

| 値              | 意味                                                           | 設定者                    |
| --------------- | -------------------------------------------------------------- | ------------------------- |
| `'taxi'` 等65種 | 業種確定                                                       | L1-3マスタ照合 or GSG成功 |
| `'unknown'`     | 情報はあるが業種を確信を持って判断できない（Geminiの降参宣言） | Gemini Layer 4            |
| `null`          | 取引先情報そのものがない（摘要空・数字のみ等）                 | Gemini Layer 4            |
| `undefined`     | Step 3未実行                                                   | —                         |

**重要**: Geminiに65種への強制分類を禁止。判断できなければ必ず `'unknown'`。

### GSGプロンプトルール（確定）

```
【発動条件】
- L1-3照合失敗 かつ
- source_type が receipt または invoice_received かつ
- 住所または電話番号がOCRで取得できている場合のみ

【検索ルール】
- T番号がある場合: 法人番号で検索（最優先）
- T番号なし: 社名＋住所完全一致 または 電話番号で検索
- 部分一致禁止

【情報採用ルール】
- 公式サイトまたは政府データを最優先
- 2つ以上の独立ソースで一致した情報のみ採用
- 業種は明記されている場合のみ採用
- 推測・補完禁止

【排除ルール】
- 同名企業の混同禁止
- 住所不一致の情報は無効
- 古い情報は除外

【出力ルール】
- 結論を最初に書く
- 特定できない場合は「特定できない」と明記 → 'unknown'を返す
- 根拠を簡潔に示す（使用ソース）
```

### 未定義事項（T-P3プロンプト設計時に確定）

| #   | 未定義項目                                                               | 重要度 |
| --- | ------------------------------------------------------------------------ | ------ |
| U-1 | L2（電話照合）失敗後にGSGで同じ電話番号を使う場合の明文化                | 中     |
| U-2 | 「古い情報は除外」の具体的判断基準                                       | 低     |
| U-3 | GSG結果から65種への変換ロジック（「飲食業」→'restaurant'等のマッピング） | 高     |
| U-4 | `vendor_vector_confidence` フィールドを追加するか否か                    | 中     |

---

## DL-015 | 全体パイプラインフロー確定（2026-04-04）

**状態**: 確定

### 入力ファイル判定（Step 0より前）

> **エントリーポイント**: アップロードUI（`/client/upload/:clientId`）
> **テストURL**: `http://localhost:5173/#/client/upload/LDI-00008`

| ファイル種別       | 処理                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------- |
| CSV・Excelファイル | アップロードUI（B画面: `/client/upload-docs/:clientId`）で受付。人間がMFに直接インポート |
| 画像・PDFファイル  | アップロードUI（A画面）で受付 → 以降のパイプラインへ                                     |

### Step 0: 証票種別判定（source_type 12種）→ ProcessingMode 3種に分類

| ProcessingMode             | source_type（英語値）                                                                                   | source_type（日本語）                                                              | 内容                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------- |
| `auto`（自動仕訳 7種）     | receipt / invoice_received / tax_payment / journal_voucher / bank_statement / credit_card / cash_ledger | 領収書 / 受取請求書 / 納付書 / 振替伝票 / 通帳・銀行明細 / クレカ明細 / 現金出納帳 | Step 1以降のパイプラインへ |
| `manual`（手入力仕訳 2種） | invoice_issued / receipt_issued                                                                         | 発行請求書 / 発行領収書                                                            | 情報不足フローへ           |
| `excluded`（対象外 3種）   | non_journal / other / supplementary_doc                                                                 | 仕訳対象外 / その他 / 補助資料                                                     | Drive資料選別UIへ          |

### excluded（仕訳対象外）の以降

```
drive-select UI（/client/drive-select/:clientId）
  └ 戻す   → 通常パイプライン（auto）に差戻し
  └ 戻さない → 仕訳対象外フォルダに保存
               CSVやExcelは人間がMFに直接インポート
```

**実装確認**: `isNonJournal()` 関数が `source_type.type.ts` に実装済み。  
**UIで確認**: `/client/drive-select/:clientId` ページが存在し、drive-selectセレクター機能が実装済み。

### level: 'insufficient' の出力方針（確定）

| フィールド   | 出力内容                      | 理由                               |
| ------------ | ----------------------------- | ---------------------------------- |
| 日付         | OCR確定値（事実データ）       | UIで「未確定」赤警告を出さないため |
| 金額         | OCR確定値（事実データ）       | 同上                               |
| 摘要（原文） | OCR取得テキスト（事実データ） | 人間が内容を確認できるように       |
| 仕訳方向     | 判定済み確定値（事実データ）  | 科目選択の前提情報                 |
| 科目         | 「--」または `null`           | UIが赤背景で警告→人間が選択        |
| 税区分       | `null`                        | 科目選択後に連動して絞り込み       |
| 科目候補     | 推定できる場合のみ配列        | 人間の選択を助けるため             |

**確認**: journal-list UI（/client/journal-list/:clientId）で科目「--」行が赤背景で表示され、人間の注意を促す設計が実装済み（2026-04-04 UI確認済み）。

---

## DL-016 | 取引先外（non_vendor）フロー確定（2026-04-04）

**状態**: 確定・実装完了（2026-04-04 A-9〜A-13完了）

**実装済みファイル**: `src/mocks/types/pipeline/line_item.type.ts` v1.3

### null（取引先情報なし）は上位概念

```
Step 3 入り口判定:
  取引先として識別できる情報がある？（会社名・T番号・電話等）

  YES → 取引先ありフロー（L1-3 → Layer 4）
  NO  → 取引先外フロー（non_vendor_type / tax_type で処理）
```

### transaction_type フィールドは不要（削除確定）

```
❌ transaction_type: 'vendor_based' | 'non_vendor'
   → vendor_vector または non_vendor_type のどちらが設定されているかで判定できる。冗長。
```

### LineItemに追加するフィールド（A-9 / A-10）

```typescript
non_vendor_type?: NonVendorType | null
// どちらか一方のみ設定される（相互排他。両方同時に設定しない）
tax_type?: TaxType | null
```

### NonVendorType 確定定義（→ DL-017で8種→24種に拡張済み。最新定義は `non_vendor.type.ts` を参照）

```typescript
/**
 * 取引先外取引の種別（non_vendor_type）
 * → DL-017で8種→24種に拡張済み（銀行9+クレカ7+人間判断8）
 * → CREDIT_CARD_FEEは廃止。クレカ7種に分割済み
 * 最新定義: src/mocks/types/pipeline/non_vendor.type.ts
 */
type NonVendorType = ...; // 24種。詳細は non_vendor.type.ts 参照
```

### TaxPaymentType 確定定義（→ TaxTypeからTaxPaymentTypeに改名済み: 2026-04-04）

```typescript
/**
 * 税金の種別（tax_type）
 * → 型名を TaxType から TaxPaymentType に改名済み（2026-04-04）
 * 納付書（source_type: 'tax_payment'）および
 * 通帳・銀行明細（bank_statement）内の税金行の両方で使用
 * 税金（TAX）は取引先外（non_vendor）に含めない。独立カテゴリ。
 * 最新定義: src/mocks/types/pipeline/non_vendor.type.ts
 */
type TaxPaymentType =
  // ✅ 科目推定可能（自動確定）
  | "CORPORATE_TAX" // 法人税等　　　　 法人税等 ／ 普通預金
  | "CONSUMPTION_TAX" // 消費税　　　　　 未払消費税 ／ 普通預金
  | "BUSINESS_TAX" // 事業税　　　　　 租税公課 ／ 普通預金
  | "WITHHOLDING_TAX" // 源泉所得税　　　 預り金 ／ 普通預金

  // ❌ 科目推定不可（情報不足。人間が判断）― 事業形態で変わる
  | "RESIDENT_TAX"; // 住民税（法人→法人税等 ／ 個人事業主→事業主貸）
```

### 主に発生するsource_type

| source_type（英語値） | 日本語         | 取引先外発生      | 備考                             |
| --------------------- | -------------- | ----------------- | -------------------------------- |
| bank_statement        | 通帳・銀行明細 | ✅ 頻繁           | ATM・利息・手数料・振込等        |
| credit_card           | クレカ明細     | ✅ 頻繁           | 年会費・利息・キャッシュバック等 |
| cash_ledger           | 現金出納帳     | △ 稀              | 現金入出金の一部                 |
| receipt               | 領収書         | ❌ 基本発生しない | 取引先名が必ず存在する           |
| invoice_received      | 受取請求書     | ❌ 基本発生しない | 同上                             |
| tax_payment           | 納付書         | ❌ 発生しない     | tax_typeで独立処理               |

---

## 📌 アーキテクチャ概要（全体像・確定版）

```
【入力ファイル判定】
  CSV・Excelファイル → drive-select UIへ（仕訳対象外）
                       人間がMFに直接インポート
  画像・PDFファイル  → パイプラインへ
        ↓
  Step 0: 証票種別判定（source_type 12種）
    excluded（対象外）: non_journal（仕訳対象外） / other（その他） / supplementary_doc（補助資料）
      → Drive資料選別UI → 戻す/戻さない判断
    manual（手入力仕訳）: invoice_issued（発行請求書） / receipt_issued（発行領収書）
      → 情報不足フローへ（日付・金額のみ確定して科目は人間が入力）
    auto（自動仕訳）: receipt（領収書） / bank_statement（通帳・銀行明細） 等
      → Step 1へ
        ↓
  Step 1: 仕訳方向判定（direction）
    expense（出金） / income（入金） / transfer（振替） / mixed（混在）
        ↓
  Step 2: 過去仕訳照合（history_match: confirmed_journals_*.ts）
    一致 → 科目直決定（終了）
    不一致 ↓
        ↓
  Step 3: 【取引先あり】か【取引先外】かを判定

    【取引先あり】（DL-027確定フロー）
      3-1: T番号照合（全社マスタ.t_numbers）
      3-2: 電話番号照合（全社マスタ.phone_numbers）
      3-3: 会社名照合（全社マスタ.match_key 完全一致）
        → 照合成功 → 業種（vendor_vector）確定 → Step 4へ
        → 照合失敗 → Layer 4（Geminiフォールバック）
            人名のみ・通帳（bank_statement）/クレカ明細（credit_card）・住所電話なし
              → 業種不明（vendor_vector: 'unknown'）
            領収書（receipt）/受取請求書（invoice_received） + 住所か電話あり
              → GSG（Google Search Grounding）実行
                検索成功 → 65種のいずれか確定
                検索失敗 → 業種不明（'unknown'）

    【取引先外】（DL-017: 24種。ATM・利息・手数料・税金・口座間移動 等）
      3-0: 取引先外パターン照合（顧問先マスタ.match_key）
      科目推定可能 → 自動確定（16種）:
        銀行明細: ATM / INTEREST_INCOME / INTEREST_EXPENSE / BANK_FEE /
          ACCOUNT_FEE / FOREIGN_EXCHANGE_FEE / INTERNAL_TRANSFER /
          LOAN_RECEIPT / LOAN_REPAYMENT
        クレカ明細: CREDIT_CARD_ANNUAL_FEE / CREDIT_CARD_STATEMENT_FEE /
          REVOLVING_FEE / CARD_CASH_ADVANCE_FEE / CARD_CASH_ADVANCE_INTEREST /
          FOREIGN_TRANSACTION_FEE
        税金: CORPORATE_TAX / CONSUMPTION_TAX / BUSINESS_TAX / WITHHOLDING_TAX
      科目推定不可 → 人間が選択（8種）:
        CREDIT_CARD_LATE_FEE / CASHBACK / UNIDENTIFIED_SALARY /
        UNIDENTIFIED_INFLOW / UNIDENTIFIED_OUTFLOW / PETTY_CASH_ADJUSTMENT /
        SUBSIDY_RECEIVED / INSURANCE_RECEIVED / OTHER_NON_VENDOR /
        RESIDENT_TAX（住民税）
        ↓
  Step 4: 科目確定
    取引先あり: 業種（vendor_vector） × 仕訳方向（direction） → 業種辞書 → 科目マスタ
    取引先外:   取引先外種別（non_vendor_type）/ 税種別（tax_type） → 科目マスタ直参照

  自動確定（level: 'A'）    → 科目確定（自動出力）
  情報不足（level: 'insufficient'） → 確定値（日付・金額・摘要）のみ確定。
                                      科目「--」・税区分空白でUI返却。
                                      UIが赤背景警告→人間が選択
        ↓
  LineItem[]（line_item.type.ts）
        ↓ lineItemToJournalMock()（変換関数）
  JournalPhase5Mock[]
        ↓ expandJournalToMfRows()
  MfCsvRow[]（23列・MF実機エクスポート準拠。2026-04-25 DL-049で確定）
        ↓ downloadMfCsv()
  CSV / Excel ダウンロード（MFクラウドインポート用・UTF-8 BOM付き）

担当分担:
  Gemini: 画像読み取り・Step 0〜1・Step 3 Layer 4（GSG含む）
  TS:     Step 2〜4・変換・CSV出力・バリデーション
```

---

## 旧ページ（OLD系 UI）一覧（2026-04-04 調査済み）

Z-1〜Z-15の型エラー修正が旧ページに影響しないことを全件確認済み。

| URL                                       | マップ先コンポーネント                        | `aaa_useJournalEditor` / `JournalService`（旧）依存 | 備考                                                                                              |
| ----------------------------------------- | --------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `/#/old/journals/demo`                    | `src/views/ScreenB_JournalStatus.vue`         | なし ✅                                             | 顧問先仕訳一覧（旧）                                                                              |
| `/#/old/tasks/demo`                       | `src/views/ScreenH_TaskDashboard.vue`         | なし ✅                                             | タスクダッシュボード（旧）                                                                        |
| `/#/old/admin`                            | `src/views/ScreenZ_AdminSettings.vue`         | なし ✅                                             | 管理者設定（旧）                                                                                  |
| `/#/old/collection/demo`                  | `src/components/ScreenC_CollectionStatus.vue` | なし ✅                                             | 資料収集状況（旧）                                                                                |
| `/#/old/ai-rules/demo`                    | `src/views/ScreenD_AIRules.vue`               | なし ✅                                             | AIルール設定（旧）                                                                                |
| `/#/old/data-conversion/demo`             | `src/views/ScreenG_DataConversion.vue`        | なし ✅                                             | データ変換（旧）                                                                                  |
| `/#/journal-entry/job_draft_01?mode=work` | `src/views/ScreenE_Workbench.vue`             | スタブ化済み（2026-04-18 Firebase移行でuseJournalEditor削除） | **レガシー画面。表示のみ維持。** |

### 調査方法

各コンポーネントファイルを直接 `grep` で検索（`useJournalEditor` / `JournalService` / `aaa_use`）。全件ヒットなし確認済み。

### ⚠️ 発見した旧ページの問題（全件解消済み 2026-04-05）

- `/#/journal-entry/job_draft_01?mode=work` — ルート未定義 → **解消**: `/journal-entry/:id` → `ScreenE_Workbench.vue` を追加

---

## DL-017 | NonVendorType拡張（8種→24種）とファイル分離設計（2026-04-05）

**状態**: 設計確定・`non_vendor.type.ts` 新規作成完了

### 決定内容

1. **`NonVendorType` を `line_item.type.ts` から `non_vendor.type.ts` に分離する**
   - `vendor.type.ts` に `VendorVector` が定義されているのと対称的な設計
   - `line_item.type.ts` は `re-export`（`export type { NonVendorType, TaxPaymentType } from './non_vendor.type'`）に変更

2. **`NonVendorType` を 8種 → 24種に拡張する**
   - 銀行明細（自動確定）9種 + クレカ明細（自動確定）7種 + 人間判断8種
   - 廃止: `CREDIT_CARD_FEE`（単一）→ クレカ7種に分割

3. **科目候補辞書データファイルを法人/個人で分離する**
   - `industry_vector_corporate.ts` / `industry_vector_sole.ts` と同じパターン
   - `non_vendor_account_corporate.ts`（法人用）
   - `non_vendor_account_sole.ts`（個人事業主用）
   - 差異点: `UNIDENTIFIED_SALARY`（法人: SALARIES / 個人: OWNER_DRAWING）等

### パイプラインStep4 現状調査結果（2026-04-05）

**調査方法**: `INDUSTRY_VECTOR_CORPORATE` / `INDUSTRY_VECTOR_SOLE` のimport先を全件grep

**結果**:

```
INDUSTRY_VECTOR_CORPORATE → import先: 0件（デッドコード）
INDUSTRY_VECTOR_SOLE      → import先: 0件（デッドコード）
```

**現状アーキテクチャ（確定）**:

```
UI層（仕訳一覧）:
  JournalListLevel3Mock.vue
    └── useAccountSettings('client', clientId)
          └── useClientAccounts(clientId) ← localStorage
                └── ACCOUNT_MASTER + 顧問先カスタム科目
  ✅ UIは顧問先科目マスタに接続済み

パイプライン層:
  INDUSTRY_VECTOR_CORPORATE / INDUSTRY_VECTOR_SOLE（辞書定義のみ）
    ← どこからもimportされていない（Step4 = 科目確定ロジック 未実装）

  NON_VENDOR_ACCOUNT_CORPORATE / NON_VENDOR_ACCOUNT_SOLE（今回作成予定）
    ← 同様。辞書定義のみ（Step4実装まで未接続）
```

**技術的負債（既存）**:
| ファイル | 問題 |
|---|---|
| `industry_vector_corporate.ts` | Step4未接続。辞書定義のみで科目確定ロジックに食わせていない |
| `industry_vector_sole.ts` | 同上 |
| パイプライン→UI 科目連携 | Step4（`INDUSTRY_VECTOR_*` → `useClientAccounts` フィルタ → 確定）が未実装 |

**なぜStep4を今実装しないか**:

- Step4実装には「パイプライン一括統合」が必要（Phase 2 Group 1）
- 個別に接続すると設計が分散するリスクがある
- 現状はモックデータで仕訳UIが動作しているため、業務影響なし

### ACCOUNT_MASTER 確認事項（IDハードコード防止）

```
調査済みACCOUNT_MASTER ID（non_vendor_account_*.tsで使用するもの）:
  ORDINARY_DEPOSIT     = 普通預金（L39、both）
  CASH                 = 現金（L26、both）
  FEES                 = 支払手数料（L500、both）
  INTEREST_INCOME      = 受取利息（L1818、corp）
  INTEREST_EXPENSE     = 支払利息（L1857、corp）
  SHORT_TERM_BORROWINGS= 短期借入金（L1530、corp）
  MISC_LOSS            = 雑損失（L1870、corp専用）
  ACCRUED_EXPENSES     = 未払金（L261、both）
  SALARIES             = 給料手当（L1688、corp）
  OWNER_DRAWING        = 事業主貸（L751、individual）
  WAGES                = 給料賃金（L948、individual）
  DEPOSITS_RECEIVED    = 預り金（L275、both）
  TAXES_DUES           = 租税公課（L487、both）
  MISCELLANEOUS        = 雑費（L526、both、target: both）

ACCOUNT_MASTERに存在しないID（使用禁止）:
  SUBSIDY_INCOME → 存在しない。SUBSIDY_RECEIVED は insufficient(null) とする。
  MISC_LOSS_CORP → 存在しない。MISC_LOSS（corp専用）を使用。
```

---

## DL-018 | COUNTERPART_ACCOUNT_MAP設計確定（2026-04-05）

**状態**: 設計確定・`src/mocks/utils/lineItemToJournalMock.ts` 作成完了

### 決定内容

| source_type（証票種別）           | direction      | 相手勘定ID         | 科目名                                                    |
| --------------------------------- | -------------- | ------------------ | --------------------------------------------------------- |
| `bank_statement`（銀行明細）      | expense/income | `ORDINARY_DEPOSIT` | 普通預金                                                  |
| `credit_card`（クレカ明細）       | expense/income | `ACCRUED_EXPENSES` | 未払金                                                    |
| `receipt`（レシート・現金払い）   | expense        | `CASH`             | 現金                                                      |
| `receipt`（レシート・クレカ払い） | expense        | `ACCRUED_EXPENSES` | 未払金                                                    |
| `invoice_received`（受取請求書）  | expense        | `ACCOUNTS_PAYABLE` | 買掛金                                                    |
| `tax_payment`（納付書）           | expense        | `ORDINARY_DEPOSIT` | 普通預金                                                  |
| `cash_ledger`（現金出納帳）       | expense/income | `CASH`             | 現金                                                      |
| `journal_voucher`（振替伝票）     | —              | `null`             | **insufficient確定。専用設計不要（2026-04-05 人間判断）** |

- 相手勘定の税区分は全件 `COMMON_EXEMPT`（対象外）で確定
- `receipt` の `is_credit_card_payment=true` 時は `ACCRUED_EXPENSES`（未払金）に上書き
  → `resolveCounterpartAccount()` 関数で分岐を吸収

---

## DL-019 | lineItemToJournalMock() 変換関数実装確定（2026-04-05）

**状態**: 実装完了・`src/mocks/utils/lineItemToJournalMock.ts` に D-1〜D-6 追記

### 確定内容

| 項目 | 実装内容                                                                                      |
| ---- | --------------------------------------------------------------------------------------------- |
| D-1  | `lineItemToJournalMock(items, sourceType, clientId, isCreditCardPayment?, idOffset?)`         |
| D-2  | expense: 借方=確定科目, 貸方=相手勘定 / income: 逆。null → entries=[]                         |
| D-3  | `LineItem.sub_account`（補助科目）→ `JournalEntryLine.sub_account`                            |
| D-4  | 主科目: `LineItem.tax_category` → `tax_category_id` / 相手勘定: `COMMON_EXEMPT`（対象外）固定 |
| D-5  | `level='insufficient'` または `determined_account=null` → `labels: ['ACCOUNT_UNKNOWN']`       |
| D-6  | `VOUCHER_TYPE_MAP` + `resolveVoucherType()`                                                   |

### D-5 設計ズレ修正（2026-04-05 確定）

**旧設計（task.md記載）**: `level='insufficient'` → `classification_status: 'needs_review'`
**問題**: `JournalPhase5Mock.status` は `'exported' | null` のみ。`classification_status`フィールドが存在しない
**修正後確定実装**: `labels: ['ACCOUNT_UNKNOWN']` を付与することで代替

### voucher_type マッピング確定値（D-6）

| source_type × direction         | voucher_type                 |
| ------------------------------- | ---------------------------- |
| bank_statement × expense        | `'経費'`                     |
| bank_statement × income         | `null`（内容次第・人間判断） |
| credit_card × expense           | `'クレカ'`                   |
| receipt × expense（現金払い）   | `'経費'`                     |
| receipt × expense（クレカ払い） | `'クレカ'`                   |
| invoice_received × expense      | `'経費'`                     |
| tax_payment × expense           | `'経費'`                     |
| cash_ledger × expense           | `'経費'`                     |
| cash_ledger × income            | `null`（内容次第・人間判断） |
| journal_voucher                 | `'振替'`                     |
| その他                          | `null`                       |

---

## DL-020 | validation.ts 実装確定（2026-04-05）

**状態**: 実装完了・`src/mocks/utils/pipeline/validation.ts` 新規作成

### 確定内容

| 関数                                    | 実装内容                                                    |
| --------------------------------------- | ----------------------------------------------------------- |
| `isValidTNumber(s): boolean`            | T+13桁 boolean ラッパー（E-1）                              |
| `normalizePhoneNumber(s): string\|null` | `validatePhone()` alias。10/11桁以外はnull（E-2）           |
| `normalizeTNumber(s): string\|null`     | Tプレフィックス補完・スペース/ハイフン除去（E-3。新規実装） |

### 配置先修正

- **旧（task.md記載）**: `src/mocks/types/pipeline/validation.ts`
- **修正後**: `src/mocks/utils/pipeline/validation.ts`
- **理由**: ユーティリティ関数を `types/` に配置するのは設計上不適切

### スコープ外問題（E-2前提の誤り）

- task.md では「`vendorIdentification.ts` に空実装あり」と記載
- **実際**: `normalizePhone()` / `validatePhone()` は T-P3 round2 実測結果を踏まえて**完全実装済み**
- `normalizePhoneNumber()` は `validatePhone()` の alias として実装

---

## DL-021 | 次フェーズ方針確定（2026-04-05）

**確定内容:**

- **T-P3（取引先特定4層OCR精度確認）は後回し**。UI作成を優先。
- **UIより前に取引先マスタTSデータ（`vendors_*.ts`）を先に作成**する
- 業種マスタUI・取引先外マスタUIはTSデータ完了済みのため次フェーズで即作成可能

### 次フェーズ優先順位

| 優先    | タスク                                       | 依存                        |
| ------- | -------------------------------------------- | --------------------------- |
| **H**   | `vendors_*.ts` 取引先マスタTSデータ作成      | なし（次の最優先）          |
| **I-①** | 全社用マスタUI 3種（取引先外・業種・取引先） | H完了（取引先マスタUIのみ） |
| **I-②** | 個別顧問先マスタUI 3種                       | H完了                       |
| T-P3    | 取引先特定4層OCR精度テスト                   | H完了後以降                 |

### T-P3補足（2026-04-05確認）

- Layer 1〜3（T番号・電話・名称マッチ）は T-P3 round2 実測済み（100%/72%/94%）
- T-P3の主目的は **Layer 4（Geminiフォールバック）の vendor_vector 66種推定精度 + 降参宣言率（`'unknown'`を正直に返せるか）**
- 降参宣言率の確認がパイプライン品質に最も影響する

---

## DL-022 | マスタアーキテクチャ確定（2026-04-05）

**決定**: 全社共通マスタ（vendors_global）と顧問先固有マスタ（vendors_client）の2層構造。

### マージ方式

| 方式                                 | 決定          |
| ------------------------------------ | ------------- |
| TSビルド時マージ                     | ❌ 採用しない |
| UIレイヤー（composable）で実行時解決 | ✅ 採用       |

**参照優先順序**:

```
vendors_client[clientId]  ← 顧問先固有設定（最優先）
    ↓ 未登録
vendors_global            ← 全社共通設定（fallback）
    ↓ 未登録
→ unknown（人間が判断）
```

### Vendor型設計確定（t_numbers配列化 + DL-027 match_key導入）

| 変更内容                                   | 詳細                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `t_number: string` → `t_numbers: string[]` | FCなど同一ブランドで複数T番号対応                                                          |
| `brand_id?: string`（任意）                | 'MCDONALDS'等，FCグループ識別用                                                            |
| `phone_numbers?: string[]`                 | 電話番号も複数対応                                                                         |
| `normalized_name` → **廃止**               | `match_key`（照合キー。`normalizeVendorName(company_name)`で自動導出）に置き換え（DL-027） |
| `match_key: string`（新規）                | 照合キー。正規化済み。照合用。最上位概念                                                   |
| `display_name: string                      | null`（新規）                                                                              | 証票に表示された正規化前の原文（通帳・クレカ用） |
| `aliases`                                  | 照合キーとしては使わない（DL-027確定）。記録・UI表示のみ                                   |

**なぜt_numbers配列か**:

- マクドナルド等FCでは各FC法人が独自のT番号（法人番号）を持つ
- 本社・主要直営のT番号のみ `t_numbers[]` に登録
- 未登録FCはStep 3-3（match_key完全一致）にフォールバック
- 科目・業種はブランド（match_key）単位で1つに統一

### ファイル構成確定

| ファイル                   | 役割                       | 状態                              |
| -------------------------- | -------------------------- | --------------------------------- |
| `vendors_global_master.md` | 設計記録のみ（TSがSSOT）   | 取引先詳細削除済み（2026-04-05）  |
| `vendors_client_master.md` | 顧問先固有の差分（最優先） | 作成中                            |
| `vendors_global.ts`        | 全社共通TSデータ（SSOT）   | **実装完了（224件。2026-04-05）** |
| `vendors_client.ts`        | 顧問先固有TSデータ         | 未実装（次フェーズH優先）         |

**vendors_client_master.md への vendors_global 同期は不要（2026-04-05 確定）**:

- 顧問先別取引先マスタは「過去仕訳・今後の仕訳で発生した取引先を都度追加」する方式
- 全社マスタ（vendors_global）の内容をコピーしない
- vendors_client は顧問先固有の差分設定のみを保持する

---

## DL-023 | 業種ベクトル68種確定（2026-04-05）

**決定**: VendorVector を66種から68種に拡張（telecom/saas分割）。

| 変更内容            | 詳細                                                       |
| ------------------- | ---------------------------------------------------------- |
| `telecom_saas`      | **@deprecated**（互換性のため残存。新規使用禁止）          |
| `telecom`（新規）   | A確定: COMMUNICATION（通信費）。携帯/固定回線/ISP          |
| `saas`（新規）      | insufficient: COMMUNICATION / FEES。AWS/Google/Microsoft等 |
| `gas_station`       | TRAVEL → **VEHICLE_COSTS**（車両費）に変更                 |
| `parking`           | A確定: TRAVEL（旅費交通費）                                |
| `convenience_store` | insufficient: expense[0]=SUPPLIES_CORP, expense[1]=MEETING |
| `cafe`              | A確定: MEETING（会議費）                                   |
| `drugstore`         | A確定: SUPPLIES_CORP（消耗品費）                           |
| `beauty`            | A確定: WELFARE（福利厚生費）                               |
| `printing`          | A確定: ADVERTISING（広告宣伝費）                           |

**優先表示科目ルール確定**:

- `expense[0]` = 優先表示科目（UIで最初に提示するデフォルト）
- 優先度: `Vendor.default_account` > `expense[0]` > `expense[1...]`
- vendors\_\*\_master.md の借方勘定科目欄先頭 = `expense[0]`
- AIの独自意見は記載禁止。VV確定（業種68）のみ正

**実装済みファイル**:

- `src/mocks/types/pipeline/vendor.type.ts`（VendorVector型定義 68種 + `debit_account_over`フィールド追加。2026-04-05）
- `src/mocks/data/pipeline/industry_vector_corporate.ts`（68種。ec_siteにincome: ['SALES']追加。2026-04-05）
- `src/mocks/data/pipeline/industry_vector_sole.ts`（68種）
- `src/mocks/data/pipeline/vendors_global.ts`（224件。全件direction/debit_account/debit_account_over設定済み。2026-04-05）

---

## DL-024 | 取引先マスタ税区分設計確定（2026-04-05）

**決定**: vendor系取引先の税区分は `ACCOUNT_MASTER.defaultTaxCategoryId` から自動連動。

| 系統                     | 税区分の取得元                                                        |
| ------------------------ | --------------------------------------------------------------------- |
| vendor系（取引先あり）   | `ACCOUNT_MASTER[借方科目ID].defaultTaxCategoryId` から自動連動        |
| non_vendor系（取引先外） | `NonVendorAccountEntry.tax_category` に明示（TAX_CATEGORY_MASTER ID） |

**実装影響**:

- `vendors_global_master.md` / `vendors_client_master.md` の借方税区分欄は `← ACCT[科目ID].defaultTaxCategoryId` 表記にする（参照式・具体値なし）
- 免税顧問先（`consumptionTaxCategory: 'EXEMPT'`）はパイプラインが全件 `COMMON_EXEMPT`（対象外）に自動変換
- 簡易課税は本則と同じ税区分を記録し、申告時のみ簡易計算

---

## DL-025 | JobStatus型拡張・ルーター整備（2026-04-05）※旧DL-017重複を番号修正

**状態**: 完了（コミット `a1c4692`）

### JobStatus型拡張

**決定**: `src/types/job.ts` の `JobStatus` に `'excluded'`（対象外）と `'approved'`（承認済み）を追加。

**なぜか**:

- `ScreenE_LogicMaster.vue` の `executeBatch` で `case 'exclude'` が `status = 'remanded'` にフォールバックしていた（意味が誤り）
- `JobStatus` 型にこれらが存在しなかったため、型エラーを避けるために近い値で代用していた
- 追加後、`case 'exclude': status = 'excluded'` に正しく修正

**今後のルール**:

- `JobStatus` の拡張は、UI・パイプラインの業務フロー上の状態遷移設計と整合させること
- 新しい状態を追加したら `executeBatch` のswitch文・UIのステータスバッジも必ず同時更新

### ルーター整備

**決定**: 以下4ルートを `src/router/index.ts` に追加。

| パス                          | コンポーネント             | 用途                                       |
| ----------------------------- | -------------------------- | ------------------------------------------ |
| `/client/detail/:clientId`    | `ScreenA_ClientDetail.vue` | 顧問先詳細                                 |
| `/client/workbench/:clientId` | `ScreenE_Workbench.vue`    | 仕訳ワークベンチ（clientId引き）           |
| `/screen-e/:clientId`         | `ScreenE_LogicMaster.vue`  | 旧ScreenE互換URL                           |
| `/journal-entry/:id`          | `ScreenE_Workbench.vue`    | 仕訳エントリー（jobId引き・mode=work対応） |

**確認済み**:

- `/journal-entry/job_draft_01?mode=work` — MockデータがJournalServiceから正常取得・画面表示確認
- `/client/detail/LDI-00001` — `taxFilingTypeLabel`「青色申告」表示確認

---

## DL-026 | T番号・照合設計原則確定（2026-04-05）

**目的**: vendors_global.ts生成にあたりT番号の役割を確定する。

### 確定内容

| 原則                | 内容                                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **T番号の目的**     | 取引先・サービス名の一意特定が目的。税額控除確認は目的ではない                                                                    |
| **適格性前提**      | 全社取引先マスタ登録企業は100%適格事業者                                                                                          |
| **照合フロー**      | Step 2（過去仕訳照合）→ Step 3-1（T番号）→ Step 3-2（電話番号）→ Step 3-3（match_key完全一致）→ null（人間が手入力）※DL-027で確定 |
| **source_type分岐** | 不要。T番号・電話番号の有無で自然にフォールバック                                                                                 |
| **T番号と証票**     | 領収書・請求書にはT番号記載あり。銀行明細・カード明細には記載なし                                                                 |
| **match_keyの役割** | 全source_typeに共通して機能する照合キー（`normalizeVendorName()` で自動導出）                                                     |

### t_numbers 設計

| 値                   | 意味                                                                            |
| -------------------- | ------------------------------------------------------------------------------- |
| `['T1234567890123']` | T番号確認済み                                                                   |
| `[]`                 | T番号不明（免税事業者・個人・未確認。税務上は同一扱い。バリデーション警告対象） |

- `null` は使用しない（外形的に免税事業者と未確認を区別できないため）
- `vendor_vector === 'individual'` の場合、`t_numbers: []` のバリデーション警告レベルを下げる

### T番号重複（同一法人・異なるサービス名）の方針

- 同一T番号 = 同一法人 → **1エントリに統合**
- 通帳・カード明細にはサービス名が記載されるため `aliases` にブランド名を列挙（照合キーとしては使わない。記録・UI表示のみ。DL-027確定）
- 例: オプテージ + mineo + eo光 → `t_numbers: ['T9120001062589']`, `aliases: ['mineo', 'eo光']`

---

## DL-027 | 照合キー（match_key）設計確定（2026-04-06）

**目的**: 照合キーの概念を統一し、取引先・取引先外を同一のロジックで処理可能にする。Geminiの推測を排除し、factのみ出力するパイプラインを構築する。

### 設計思想

パイプラインは**Geminiに安定して降参させるための仕組み**。Geminiは「目」（OCR読み取り）のみ。科目判断には関与させない。確実にわかること（日付・金額・摘要）だけ自動出力。わからないことはnullで返し、UIバリデーション（赤背景）で人間に通知。手入力結果は顧問先マスタに蓄積され、次回から自動確定。使えば使うほど手入力が減る自動学習サイクル。

### 3フィールド構成（案B確定）

| フィールド                 | 日本語   | 用途                           | 全社マスタ         | 顧問先マスタ（領収書由来） | 顧問先マスタ（通帳由来） | 取引先外              |
| -------------------------- | -------- | ------------------------------ | ------------------ | -------------------------- | ------------------------ | --------------------- |
| `match_key`（照合キー）    | 照合キー | 正規化済み。照合用             | `関西電力`         | `関西電力`                 | `カンサイデンリョク`     | `ジドウフリカエリボ`  |
| `company_name`（正式名称） | 正式名称 | 登記名。T番号と1:1             | `関西電力株式会社` | `関西電力株式会社`         | null                     | null                  |
| `display_name`（表示名）   | 表示名   | 証票に表示された正規化前の原文 | null               | null                       | `カンサイデンリョク`     | `ジドウフリカエ リボ` |

- フィールド順序: `match_key` → `company_name` → `display_name`（照合キーが最上位概念）
- 顧問先マスタの領収書由来エントリは、全社マスタと同じ`company_name`を持つ（全社マスタからコピー）
- 通帳由来エントリは`company_name`がnull（通帳には登記名が記載されない）
- 同一取引先でも漢字/カタカナは別エントリ。同じ科目に到達する

### aliasesは照合キーに使わない

aliases照合は一意確定が保証されない。記録・UI表示のみ（同一法人の別ブランド名の記録）。

### 照合フロー（全体・優先順位付き）

```
Step 0: 証票種別判定（source_type 11種）
  → excluded / manual / auto に分岐

Step 1: 仕訳方向判定（direction）
  → expense / income / transfer / mixed

Step 2: 過去仕訳照合（confirmed_journals）
  → 顧問先マスタ.match_key と完全一致 → 科目確定（終了）
  → 不一致 ↓

Step 3: 取引先照合
  3-0: 取引先外パターン照合
    → 顧問先マスタ.match_key（取引先外エントリ）と一致 → non_vendor_type確定（終了）
    → 不一致 ↓
  3-1: T番号照合
    → 全社マスタ.t_numbers と一致 → 取引先確定（終了）
    → 不一致 ↓
  3-2: 電話番号照合
    → 全社マスタ.phone_numbers と一致 → 取引先確定（終了）
    → 不一致 ↓
  3-3: 会社名照合
    → 全社マスタ.match_key と完全一致 → 取引先確定（終了）
    → 不一致 ↓
  3-4: 不一致
    → null（人間が手入力 → 顧問先マスタに蓄積 → 次回から自動）

Step 4: 科目確定
  取引先あり → vendor_vector × direction → 業種辞書 → 科目
  取引先外 → non_vendor_type → 科目直参照
  不明 → null → UIで赤背景警告 → 人間が手入力
```

### 取引先と取引先外は概念的に同質

取引先外（ATM・利息等）も通帳摘要の正規化した照合キーとして同一テーブルで扱える。TSファイルの統合が正しい方針。計画的に実施する。

### 全社マスタと顧問先マスタの役割分離

| マスタ                                    | 照合対象                                                       | 照合キー                                  | データ生成方法                             |
| ----------------------------------------- | -------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------ |
| **全社取引先マスタ（vendors_global.ts）** | 領収書・請求書（コールドスタート用。通帳・クレカには使えない） | T番号・電話番号・match_key                | 人間が手動登録                             |
| **顧問先取引先マスタ（vendors_client）**  | 全証票                                                         | match_key（過去仕訳の摘要を正規化した値） | 過去仕訳CSVから自動抽出 + 人間の手入力蓄積 |

### normalizeVendorName() 改修事項

- ひらがな→カタカナ変換を追加（カタカナ統一。通帳がカタカナ表記のため）
- exampleの嘘（`エン・ジャパン→えんじゃぱん`）を修正（カタカナ→ひらがな変換は実装にない）
- 漢字はそのまま残す（読み仮名変換は不可能。上手＝ジョウズ/カミテ）
- 漢字↔カタカナの一致は追求しない（別のmatch_keyとして別エントリで管理）

### 経緯

1. `normalized_name`が手動入力されており共通関数で自動導出すべきか→ 廃止してmatch_keyに統一
2. 全社マスタは領収書専用、通帳・クレカは顧問先マスタが担当と確認
3. aliasesの照合キー利用は一意性が保証されないため不採用
4. 取引先外も照合キーとして同質であることを確認（TS統合方針確定）
5. 漢字↔カタカナの一致は技術的に不可能と確認
6. `company_name`と`display_name`の2フィールド分離を確定（性質が異なる：法的名称 vs 証票表示原文）

### 実施すべきこと

| #   | 項目                                                                                                                                                                                             | 依存 | 状態                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- | ------------------------------------------------------------------------- |
| 1   | **normalizeVendorName()改修** — ひらがな→カタカナ変換追加。exampleの嘘修正。NormalizationService削除                                                                                             | なし | ✅ 完了（2026-04-06）                                                     |
| 2   | **match_key / company_name / display_name の3要素をTSに反映** — Vendor型からnormalized_name削除。match_key・display_name追加。224件を`{ match_key, company_name, display_name: null }`形式に変換 | #1   | ✅ 完了（2026-04-06）                                                     |
| 3   | **取引先と取引先外TSの統合** — non*vendor_account*\*.ts削除。vendors_global.tsにコア要素を統合。MockMasterNonVendorPage.vue実装                                                                  | #2   | ✅ 完了（git `e2ecf1c` 2026-04-07）                                       |
| 4   | **全社取引先マスタUI** — match_key・company_name・業種・科目の閲覧・インライン編集・追加・削除                                                                                                   | #2   | ✅ 完了（MockMasterVendorsPage.vue。git `f3a156f`→`a16e701`。2026-04-06） |
| 5   | **全社業種（vendor_vector）マスタUI** — 68業種の閲覧・科目候補の確認                                                                                                                             | #2   | ❌ 未実施                                                                 |
| 6   | **全社取引先外マスタUI** — MockMasterNonVendorPage.vue。CRUD機能・検索・フィルタ・ページネーション                                                                                               | #2   | ✅ 完了（git `e2ecf1c` 2026-04-07）                                       |
| 7   | **顧問先取引先マスタUI** — 取引先・取引先外を同一画面で管理。過去仕訳からの蓄積表示                                                                                                              | #3   | ❌ 未実施                                                                 |
| 8   | **顧問先業種マスタUI** — 顧問先別の業種→科目マッピング上書き                                                                                                                                     | #3   | ❌ 未実施                                                                 |

### 決定済み事項（本セッション 2026-04-06）

| #   | 決定事項                                                                             | 根拠                                                   |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| D1  | `normalized_name` 廃止 → `match_key`（照合キー）に統一                               | 手動入力を排除し共通関数で自動導出                     |
| D2  | `match_key` = `normalizeVendorName(company_name or 摘要)` の出力                     | 正規化のみ。読み仮名変換はしない                       |
| D3  | 3フィールド構成: `match_key` / `company_name` / `display_name`                       | 法的名称と証票表示原文は性質が異なる（案B確定）        |
| D4  | `aliases` は照合キーとして使わない                                                   | 一意確定が保証されない。記録・UI表示のみ               |
| D5  | 漢字↔カタカナの一致は追求しない                                                      | 技術的に不可能（上手＝ジョウズ/カミテ）                |
| D6  | ひらがな→カタカナ変換を `normalizeVendorName()` に追加                               | カタカナ統一（通帳がカタカナ表記のため）               |
| D7  | 同一取引先でも漢字/カタカナは別エントリ                                              | 別match_key。別照合経路。同じ科目に到達                |
| D8  | 顧問先マスタには領収書由来・通帳由来の両方が蓄積される                               | 漢字(`関西電力`)とカタカナ(`カンサイデンリョク`)が共存 |
| D9  | 取引先と取引先外は概念的に同質                                                       | 同一照合キーテーブルとしてTS統合する方針               |
| D10 | `vendor_alias.type.ts` / `vendor_keyword.type.ts` は作成しない                       | DL-027でmatch_keyに統一。専用型不要                    |
| D11 | 照合フロー: Step 2（過去仕訳）が最優先。Step 3（T番号→電話→match_key）は全社マスタ用 | 過去仕訳で一致すれば全社マスタの照合自体が不要         |
| D12 | 重複チェックは日付＋金額＋仕訳方向で行う                                             | 取引先名の一致は補助情報。漢字↔カタカナ一致不要        |

### 実施済み事項

> 最終更新: 2026-04-07（セッション 1cd25cab）

| #   | セッション | 日付       | 実施内容                                                                                                                                                                                                                | ファイル                               |
| --- | ---------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| E1  | bd8b5ef7   | 2026-04-06 | DL-026 照合フロー記述を match_key ベースに更新                                                                                                                                                                          | `pipeline_design_master.md`            |
| E2  | bd8b5ef7   | 2026-04-06 | DL-022 Vendor型設計にmatch_key/display_name/aliases不使用を追記                                                                                                                                                         | `pipeline_design_master.md`            |
| E3  | bd8b5ef7   | 2026-04-06 | DL-027 照合キー設計確定を追記                                                                                                                                                                                           | `pipeline_design_master.md`            |
| E4  | bd8b5ef7   | 2026-04-06 | DL-027 設計確定を冒頭に追記。DL-026 aliases主力照合記述を削除                                                                                                                                                           | `vendors_global_master.md`             |
| E5  | bd8b5ef7   | 2026-04-06 | DL-027 設計確定を冒頭に追記。正規化記述をmatch_keyに更新                                                                                                                                                                | `vendors_client_master.md`             |
| E6  | bd8b5ef7   | 2026-04-06 | DL027-1〜4タスク追加。I項目をDL-027設計に再構成。vendor_alias/keyword廃止確定                                                                                                                                           | `task.md`                              |
| E7  | bd8b5ef7   | 2026-04-06 | コミット `4625561` プッシュ完了                                                                                                                                                                                         | git                                    |
| E8  | 7d74add7   | 2026-04-06 | DL027-1: normalizeVendorName() §3b ひらがな→カタカナ変換追加、@example嘘修正、JSDoc更新                                                                                                                                 | `vendorIdentification.ts`              |
| E9  | 7d74add7   | 2026-04-06 | DL027-1: GeminiVisionService import先をNormalizationService→vendorIdentification.tsに統一                                                                                                                               | `GeminiVisionService.ts`               |
| E10 | 7d74add7   | 2026-04-06 | DL027-1: NormalizationService.ts 削除（呼び出し元ゼロ。6メソッド全デッドコード）                                                                                                                                        | `NormalizationService.ts`（削除）      |
| E11 | 7d74add7   | 2026-04-06 | DL027-1: NormalizationService re-export削除                                                                                                                                                                             | `core/journal/index.ts`                |
| E12 | 7d74add7   | 2026-04-06 | DL027-1: ユニットテスト11ケース新規作成（全PASSED）                                                                                                                                                                     | `vendorIdentification.test.ts`（新規） |
| E13 | 7d74add7   | 2026-04-06 | DL027-2: Vendor型 normalized_name → match_key + display_name 追加。JSDoc全箇所修正                                                                                                                                      | `vendor.type.ts`                       |
| E14 | 7d74add7   | 2026-04-06 | DL027-3: vendors_global.ts 224件一括置換（Node.jsスクリプト。normalized_name残留0件確認）                                                                                                                               | `vendors_global.ts`                    |
| E15 | 1cd25cab   | 2026-04-07 | DL027-2: vendor.type.ts 全文（514行）実ファイル確認。normalized_name 0件・match_key（L282）・display_name（L288）定義済みを確認                                                                                         | `vendor.type.ts`（確認のみ）           |
| E16 | 1cd25cab   | 2026-04-07 | DL027-3: vendors_global.ts normalized_name残留をgrep確認。0件確認（置換完了）                                                                                                                                           | `vendors_global.ts`（確認のみ）        |
| E17 | 1cd25cab   | 2026-04-07 | DL-027 #3（取引先と取引先外統合）: non_vendor_type/source_category/levelフィールドで統合済みを実ファイル確認。#3未実施→確認済みに更新                                                                                   | `vendor.type.ts`（確認のみ）           |
| E18 | 1cd25cab   | 2026-04-07 | マスタ管理ハブUI・全社取引先マスタUI（MockMasterVendorsPage.vue）実装済みを確認。DL-027 #4を完了済みに更新                                                                                                              | `vendors_global_master.md`（確認のみ） |
| E19 | 1cd25cab   | 2026-04-07 | task.md・pipeline_design_master.md を今セッション（1cd25cab）brainにコピー・最新状態に更新                                                                                                                              | ブレインファイル                       |
| E20 | —          | 2026-04-06 | I-①a: MockMasterManagementPage.vue（マスタ管理ハブ）新規実装。MockMasterVendorsPage.vue（全社取引先マスタ一覧）新規実装。NavBar整理・ルーター追加（/master/vendors → ハブ、/master/vendors/list → 一覧）                | git `f3a156f`                          |
| E21 | —          | 2026-04-06 | I-①a: MockMasterVendorsPage.vue を全面改修（データ駆動型UI・SSOT化・インライン編集・normalizeVendorName連動・追加・削除機能）。vendors_global_master.md 更新                                                            | git `a16e701`                          |
| E22 | —          | 2026-04-07 | DL027-4・I-①c: non_vendor_account_corporate.ts / \_sole.ts 削除。vendors_global.tsに統合。MockMasterNonVendorPage.vue（全社取引先外マスタ・CRUD）新規実装。vendor.type.ts/non_vendor.type.ts拡張。load_context.md厳格化 | git `e2ecf1c`                          |

---

## DL-028 | 科目推定アーキテクチャ設計議論（2026-04-08）

**状態**: 議論完了・採否確定

### 背景

Phase 2 Group 3（Step 3: 業種ベクトル + Step 4: 科目確定）の実装に向け、科目推定の全体アーキテクチャについて6つの設計提案が出された。ユーザーがこれら全提案を冷徹に批評し、AIがそれを受けて見解を述べ、ユーザーが承認する形で採否が確定した。

### 議論の経緯

#### Phase A: ユーザーによる6提案の批評

**① 全社マスタは科目を持たない・学習ありき**

ユーザー評価: 良い点あり・問題あり

- 良い点: 想像属性排除で現実的。既存仕訳活用は整合
- 問題点: 「学習ありき」はコールドスタートを解決していない。新規顧問先の初回はどうする？ 既存仕訳データを全社マスタに正規化する処理の設計がない。vendors_global.ts（224件）との関係が曖昧

**② メガベンダーフラグ（is_mega_vendor）**

ユーザー評価: 致命的問題あり

- Amazonが「仕入のみ」の顧問先（小売業）では is_mega_vendor は不要または有害
- is_mega_vendor は「一般論」であって「この顧問先にとって」ではない
- 顧問先レベルで「過去仕訳の科目種類数」で自動判定できる → フラグ不要論

**③ 一意性判定（科目種類数 / 80%基準）**

ユーザー評価: FACTベースで健全・問題あり

- 良い点: 履歴があれば機能する
- 問題点: 80%基準は根拠がない（恣意的）。選択肢の並び順・絞り込み方の設計がない。コールドスタートで完全に機能しない

**④ ジャンル中間マスタ（3層: キーワード→ジャンル→科目）**

ユーザー評価: 最も重大な問題あり

- 良い点: 経理ルール変更時の保守性が高い。AIはジャンル分類が得意という観察は正しい
- 問題点: ジャンルマスタを**誰が作るのか？** 初期整備コストが高い。vendors_global.ts（224件）と二重管理リスク。**VendorVector（68種）との役割がかぶっていないか？**（VendorVectorも実質「相手業種」分類）。Phase 2に必要か不明。過剰設計の可能性

**⑤ 3軸クロスマッチング（自社業種×相手業種×ジャンル）**

ユーザー評価: 最重大問題

- 3軸マトリクスはほぼ無限に膨らむ（N × 68 × M = 管理不能）
- STREAMEDは2軸（自社業種×相手業種）ですら会計事務所が泥臭く手作業整備
- ジャンル軸を足すと指数的に組み合わせ増大。整備できるか？

**⑥ STREAMEDのFACT記録をpipeline_design_masterに入れた件**

ユーザー評価: 場所が不適切

- リサーチメモであり設計決定事項ではない
- pipeline_design_masterの役割は「Why + Evidence」
- docs/に別ファイル（例: streamed_benchmark.md）として配置すべき

#### Phase B: ユーザーの整理

ユーザーが採用候補と不採用候補を整理した：

| 提案                       | ユーザー評価 | 理由                                                 |
| -------------------------- | ------------ | ---------------------------------------------------- |
| 全社マスタは科目を持たない | 採用候補     | DL-027と整合。ただしコールドスタート解決策が別途必要 |
| メガベンダーフラグ（全社） | 要再検討     | 顧問先レベルの判定で代替できる可能性あり             |
| 一意性判定（科目種類数）   | 採用候補     | FACTベース。80%基準は調整要                          |
| ジャンル中間マスタ         | 要再検討     | VendorVectorとの役割分担を先に整理すべき             |
| 3軸クロスマッチング        | 優先度低     | 整備コストが高い。Phase 2以降                        |
| STREAMED FACT記録位置      | 要移動       | pipeline_design_masterではなくdocsへ                 |

**ユーザーの核心質問**: 「最初に議論すべきは何か？」→「**VendorVectorとジャンルは役割が重複しているか**が最も影響範囲が大きい」

#### Phase C: AIの見解

核心問題「VendorVectorとジャンルの役割重複」に対するAI回答：

**結論: 重複している。が、レイヤーが違う。**

| 分類軸         | VendorVector（68種）                 | ジャンル中間マスタ                  |
| -------------- | ------------------------------------ | ----------------------------------- |
| 何を分類するか | 取引**相手**の属性（何屋か）         | 取引**内容**の属性（何を買ったか）  |
| 例             | セブンイレブン → `convenience_store` | セブンイレブンで買った弁当 → `食品` |
| 科目推定の精度 | 相手から推定（曖昧）                 | 内容から推定（精密）                |
| データソース   | マスタ照合で自動取得                 | **品目OCRが必要**（開発コスト高）   |

```
VendorVector = convenience_store
  → 科目候補: 会議費 / 消耗品 / 福利厚生費 / 雑費（5→3に絞る）

ジャンル = 食品
  → 科目候補: 会議費 / 福利厚生費（3→2に絞る）
  → まだ一意に決まらない（会議か福利厚生かは状況依存）

差分はわずか1段階の絞り込み。品目OCR開発コストに見合うか？→ 現時点ではない。
```

**コールドスタート解決策（AI提案）**:

```
新規顧問先の初回仕訳:
  Step 2（過去仕訳照合）→ null（履歴なし）
  Step 3（取引先特定）→ T番号/電話/名称で照合 → vendors_global.ts にヒット
  Step 4（科目推定）→ VendorVector + 自社業種 → 科目候補を提示
  → 人間が選択 → 学習 → 2回目以降は自動

初回は「候補提示 + 人間選択」で割り切る。STREAMEDも同じ方式。
```

#### Phase D: ユーザー承認

AIの見解に対しユーザーが「OK」と承認。以下が確定した。

### 確定事項

| 提案                       | 採否      | 確定理由                                                                                     |
| -------------------------- | --------- | -------------------------------------------------------------------------------------------- |
| 全社マスタは科目を持たない | ✅ 採用   | DL-027と整合。コールドスタートはVendorVector→候補提示→人間選択で対応                         |
| メガベンダーフラグ         | ❌ 先送り | 顧問先レベルの科目種類数で代替できる可能性あり（ユーザー指摘）。代替案の検証結果次第で再検討 |
| 一意性判定                 | ✅ 採用   | FACTベースで健全。80%は初期仮値。実データで調整                                              |
| ジャンル中間マスタ         | ❌ 先送り | VendorVector+履歴学習で精度不足が実測された場合のみ再検討                                    |
| 3軸クロスマッチング        | ❌ 先送り | 整備コスト高（N×68×M）。データ十分・精度不足時のみ再検討                                     |
| STREAMED FACT記録          | 📁 移動   | docs/に別ファイルとして配置すべき                                                            |

> **②④⑤は全て同じ条件**: 「VendorVector + 履歴学習」の精度検証結果次第で再検討。現時点では不要。

---

## DL-029 | 顧客自律型不備解消アーキテクチャ（2026-04-08）

**状態**: 設計確定（アップロードUIのコア価値として記録）

### 背景・問題

現状（Streamed導入前後共通）の不備対応フローは往復コストが高い。

```
【Before: 現状の損失構造】

客が不備な資料を送る（ChatWork等）
  ↓
スタッフがStreamedで処理 → 不備発見（金額不明等）
  ↓ 数時間〜数日後
スタッフが客に通知「この領収書の金額が読めません」
  ↓ さらに数時間〜数日後
客が撮り直して再送
  ↓
スタッフが再アップロード

往復コスト: スタッフ2回 × 客2回 = 4アクション / 不備1件
```

### 解決設計（このシステムの本質価値）

```
【After: 顧客自律型フロー】

客が撮影してシステムに直接アップロード
  ↓ 即座（〜2秒）
Geminiがバリデーション → 不備を客の画面に即時表示（赤カード）
  ↓ その場で
客が赤カードをタップ → 撮り直し → 即再チェック
  ↓
全件OK → 「確定送信」ボタンが活性化 → 送付完了

往復コスト: スタッフ0回 × 客が自己完結 = 0往復
```

### 価値の定量評価

| 削減できる損失                         | 削減理由                                   |
| -------------------------------------- | ------------------------------------------ |
| 「不備の発見と通知」スタッフ工数       | Geminiが即時自動発見・客の画面に直接表示   |
| 「再送待ち」のタイムラグ（数日）       | その場で撮り直しが完結                     |
| 「再アップロード」スタッフ工数         | 客が最初から正しいデータを送る             |
| 「不備の問い合わせ」コミュニケーション | エラー理由が画面に明示されるため不明点なし |

**月10時間→2時間の8時間削減の大半がこのフローから生まれる。**

### 設計上の確定事項

#### バリデーションエラーメッセージの品質が核心

エラーメッセージの質 = 顧客が自律修正できるかどうかを直接決める。

```
NG: 「金額が判読できません」
    → 客は何をすれば直るか分からない

GOOD: 「金額が読み取れませんでした。
       影や手で数字が隠れていませんか？」
    → 原因の見当がつく

BEST: 上記 + 固定の撮影ヒントを画面に常時表示
    → 客が自律修正できる
```

#### エラー種別と撮影ヒントの対応（確定）

| Geminiのエラー判定                    | 客への表示メッセージ                   | 撮影ヒント                                                 |
| ------------------------------------- | -------------------------------------- | ---------------------------------------------------------- |
| 金額が読み取れない                    | 「金額が読み取れませんでした」         | 影・暗さ・角度を確認して撮り直し                           |
| 日付が読み取れない                    | 「日付が確認できませんでした」         | 上部が切れていないか確認                                   |
| 取引先が不明                          | 「店名・会社名が確認できませんでした」 | ヘッダー部分を含めて全体を撮影                             |
| 複数の証票が写っている                | 「複数の書類が写っています」           | 1枚ずつ別々に撮影して送ってください                        |
| 証票として認識できない（non_journal） | 「証票として認識できませんでした」     | 領収書・レシート・請求書・通帳・クレカ明細を送ってください |

**共通ヒント（UI常時表示）:**

- 明るい場所で、真上からまっすぐ撮影してください
- レシート全体（上から下まで）が枠に収まるようにしてください
- ピントが合っているか確認してから送ってください
- 暗い場所ではスマホの画面を反射させると照らせます

#### Step 0の判定結果を客のUIにフィードバックするフローが必要（未実装）

**現状（DL-015）の問題点**:

- Step 0でnon_journal/otherと判定された場合、Drive資料選別UIへ→事務所内部フローで完結する
- 客の画面にStep 0の判定結果が返らない → 客は「送れた」と思ったまま

**必要な追加設計**:

- Geminiからのレスポンス（source_type + バリデーション結果）を客向けアップロードUIに返す
- non_journal判定 = 「証票として認識できませんでした」エラーカードを表示
- excluded（対象外）であっても、客側では撮り直しを促すUXにする

### 実装状況

| 要素                                                     | 状態                               |
| -------------------------------------------------------- | ---------------------------------- |
| A画面: アップロードUI（MockUploadPage.vue）              | ✅ 実装済み（モック）`609b360`     |
| A画面: バリデーション4項目（モック）                     | ✅ receiptService.tsでランダム返却 |
| A画面: エラーカード表示（赤枠・撮り直し）                | ✅ 実装済み                        |
| A画面: カメラ直接起動（capture="environment"）           | ✅ 実装済み                        |
| A画面: SHA-256重複検知（バックグラウンド）               | ✅ 実装済み                        |
| A画面: スライディングウィンドウ並列処理（CONCURRENCY=4） | ✅ 実装済み                        |
| B画面: 資料アップロードUI（MockUploadDocsPage.vue）      | ✅ 実装済み（モック）`609b360`     |
| B画面: バリデーションなし（謄本・CSV・Excel等）          | ✅ 設計通り                        |
| B画面: ファイル種別アイコン自動判定                      | ✅ 実装済み                        |
| B画面: CONCURRENCY=3・再送・ドラッグ&ドロップ            | ✅ 実装済み                        |
| サービス層: receiptService.ts（VITE_USE_MOCK切り替え）   | ✅ 実装済み `609b360`              |
| ルーター: `/client/upload-docs/:clientId`                | ✅ 実装済み `609b360`              |
| vite設定: server.host: true（モバイルアクセス）          | ✅ 実装済み `609b360`              |
| 撮影ヒント（固定テキスト）                               | ❌ 未実装                          |
| Step 0（non_journal）→ 客UIへフィードバック              | ❌ 未実装（Gemini接続前）          |
| エラーメッセージの詳細化                                 | ❌ 現状はランダム文言のみ          |
| Supabase Edge Functions接続（本番モード）                | ❌ スタブのみ（Phase 2 Group 1）   |

### 修正記録（2026-04-08）

| 問題ID | 内容                                                   | 修正                                                     |
| ------ | ------------------------------------------------------ | -------------------------------------------------------- |
| E-3    | receiptService.ts L50 `toISOString()` タイムゾーンバグ | `getFullYear/getMonth/getDate` 方式に修正                |
| E-6    | router `props: true` 設定（code_quality.md §4違反）    | `props: true` を削除（コンポーネントはuseRoute()で取得） |

**状態**: 設計確定（Phase 2 Group 1 実装前の根拠として記録）

### 背景

設計議論（2026-04-07）において、仕訳自動化パイプラインの根本設計を整理した。以下を確定する。

---

### 1. 全社取引先マスタの役割再定義

| 項目                         | 決定内容                                                                    |
| ---------------------------- | --------------------------------------------------------------------------- |
| 全社取引先マスタへの科目付与 | ❌ 不要。科目は顧問先依存であり、全社に持たせると現実とズレる               |
| 全社取引先マスタの実態       | 「最初の仮説」。方向性（仕入系/経費系/混在）を持つ。科目は持たない          |
| 全社取引先マスタの整備方針   | 想像で属性を付与しない。**学習ありき**。仕訳 → 実績蓄積 → マスタ化          |
| 顧問先取引先マスタの実態     | 「現実の答え」。過去仕訳を正規化取引先名×科目で保持                         |
| 2層構造                      | 全社マスタ（初期仮説）＋ 顧問先マスタ（最終確定）。優先順位: 顧問先 ＞ 全社 |

### 2. メガベンダー定義

**定義**: 複数科目を含む取引先（科目が一意に決まらない取引先）

| 分類                     | 代表例                                      | 特徴                             |
| ------------------------ | ------------------------------------------- | -------------------------------- |
| EC・通販                 | Amazon、楽天市場、Yahoo!ショッピング        | 仕入・備品・消耗品が混在         |
| 大手量販・小売           | ヨドバシカメラ、ビックカメラ、コーナン      | 家電・備品・消耗品すべてあり     |
| コンビニ・総合小売       | セブン-イレブン、ファミリーマート、ローソン | 会議費・消耗品・雑費が少額混在   |
| SaaS・ITプラットフォーム | Google、Microsoft、Adobe                    | 通信費/ソフト利用料/広告費が混在 |
| 決済プラットフォーム     | PayPay、Stripe                              | 複数取引の集合体。科目混在       |
| 商社・総合取扱           | ○○商事、○○トレーディング                    | 仕入+備品+外注が混在             |

**システム上の扱い**:

- `is_mega_vendor: boolean` フラグを取引先マスタに付与
- メガベンダー = 通常ルールを適用しない → 個別判定・選択肢提示へ

### 3. 一意性判定ロジック

仕訳の科目決定を「一意に決まるか否か」で分岐する。

```
Step 1: 顧問先マスタで取引先×科目の履歴を取得
  → 科目の種類が1種類のみ → 一意 → 自動確定
  → 科目が複数種類    → 非一意 → 選択肢提示（人間）

Step 2: 準一意の扱い
  → 最大比率 > 80% → デフォルト提示（人間が承認するだけ）
  → 最大比率 <= 80% → 顧問先属性フィルタで順位付けして候補提示

Step 3: 履歴なし（コールドスタート）
  → 全社マスタ + 業種マトリクス辞書から候補提示
  → 決まらなければ人間が入力 → 顧問先マスタに蓄積
```

### 4. ジャンル（品目カテゴリ）中間マスタ設計

キーワードから科目に直接紐付けるのではなく、**3層構造**を採用する。

```
【入力】キーワード（摘要テキスト: 「キャベツ」「AWS」等）
  ↓ 部分一致 or AI推論
【中間マスタ】ジャンル（食材 / ITインフラ / 事務用品 / 等）
  ↓ 自社業種 × ジャンル × 方向 のマッピング
【出力】勘定科目 + 税区分（仕入高 8% / 通信費 10% / 等）
```

**3層構造の理由**:

- 経理ルール変更時は「ジャンル→科目マッピング」を1箇所変えるだけで全キーワードに反映できる
- AIはジャンル分類（事実確認）は得意。科目確定（経理ルール）はTS側で制御する
- 消費税（軽減8%/10%）の自動判定がジャンルレベルで完結する

### 5. クロスマッチング設計

```
自社業種 × 相手業種 × 仕入ジャンル = 科目候補
```

| 自社業種 | 相手業種       | 仕入ジャンル | → 科目                               |
| -------- | -------------- | ------------ | ------------------------------------ |
| IT企業   | 家電小売       | IT機器       | 消耗品費 or 工具器具備品（金額分岐） |
| 飲食店   | スーパー       | 食材         | 仕入高（8%）                         |
| 飲食店   | スーパー       | 日用品       | 消耗品費（10%）                      |
| 建設業   | ホームセンター | 建設資材     | 材料費                               |

### 6. ストリームドのFACT（ベンチマーク）

| 仕様                       | STREAMED                                                       | マネーフォワード                                           |
| -------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| 自社業種設定               | 顧問先登録時の業種選択 → 業種辞書（マトリクス）を一括セット    | 事業者設定に業種区分あり。レポート・簡易課税ロジックに影響 |
| 領収書の科目自動判定       | ✅ 対応（自社業種×相手業種のマトリクス辞書）                   | ✅ 対応（AI推論 + ビッグデータ参照）                       |
| 通帳・クレカの科目自動判定 | ❌ 非対応。デフォルト科目（仮払金/仮受金）を適用               | ✅ 対応（AI推論 + 自社過去履歴参照）                       |
| 学習の方式                 | **受動的**（ユーザーが「学習」ボタンを明示的に押す時のみ記録） | 半自動（AIが推測、ユーザーが承認で確定）                   |
| 学習しない場合の挙動       | 業種辞書デフォルト科目を毎回提示（過去履歴を参照しない）       | AI推測 + 過去履歴から候補提示（継続）                      |
| マスター辞書の実態         | 会計事務所が事前登録した「キーワード→科目」のルールをコピー    | LLM + 全ユーザーの匿名化ビッグデータからAIが推論           |

### 7. 自社システムへの適用方針

> **❗ 注意**: 以下はPhase A-BのAI提案原文。Phase C-Dの採否確定（上記「確定事項」テーブル）が優先する。
> B/C/Eは先送り確定済み。A/D/Fのみ採用。（2026-04-13 矛盾8解消）

| #   | 適用方針                                                                          | 採否      |
| --- | --------------------------------------------------------------------------------- | --------- |
| A   | 全社取引先マスタへの科目付与は行わない。学習実績ベースでのみ整備                  | ✅ 採用   |
| B   | メガベンダーフラグ（`is_mega_vendor`）を Vendor 型に追加する                      | ❌ 先送り |
| C   | ジャンル中間マスタ（`VendorItemCategory`）を設計・実装する                        | ❌ 先送り |
| D   | 一意性判定ロジック（科目出現頻度チェック）をパイプラインStep 4に組み込む          | ✅ 採用   |
| E   | クロスマッチング（自社業種×相手業種×ジャンル）を科目候補生成の基軸とする          | ❌ 先送り |
| F   | 通帳・クレカの科目判定はSTREAMED同様、学習ルールが主役。デフォルトは仮払金/仮受金 | ✅ 採用   |

---

## DL-030 | Repository設計方針（データアクセス抽象化）（2026-04-08）

**状態**: 設計確定

### 背景・問題

現状、マスタデータがTSファイルにハードコードされている（`vendors_global.ts` 224件、`industry_vector_corporate.ts` 68種、`account-master.ts` 等）。Supabase移行時に「配列を直接渡す」設計だと全関数シグネチャがasync化で崩壊する。

### 決定事項

**原則: Repositoryはデータの出し入れだけ。ロジックは絶対に入れない。**

```
┌─────────────────────────────────────┐
│  パイプラインロジック層              │ ← ロジックはここ
│  matchVendor(repo) / classify(repo) │    （matchVendor, classifySourceType,
│  determineAccount(repo)             │     scoreConfidence 等）
└──────────┬──────────────────────────┘
           │ await repo.getAll()
           │ await repo.findByMatchKey(key)
┌──────────▼──────────────────────────┐
│  Repository型（インターフェース）    │ ← データアクセスだけ
│  getAll() / findByKey() / save()    │    （全メソッドPromise<T>で統一）
└──────────┬──────────────────────────┘
           │
    ┌──────┴──────┐
    │             │
  モック実装    Supabase実装    ← 中身差し替えるだけ
  (TSファイル)  (将来)
```

### ルール

| ルール                             | 内容                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Repositoryに入れていいもの**     | `getAll()`, `findByMatchKey()`, `findByClientId()`, `save()` 等のデータ取得・保存                       |
| **Repositoryに入れてはダメなもの** | `matchVendor()`, `classifySourceType()`, `scoreConfidence()`, `determineAccount()` 等のビジネスロジック |
| **全メソッドの戻り値**             | `Promise<T>` で統一（最初からasync。将来のDB移行でシグネチャ崩壊を完全防止）                            |
| **既存コード**                     | 精度テスト完了後（フェーズ5）にリファクタ。今は触らない                                                 |
| **新規コード**                     | この規約に従う                                                                                          |

### なぜ配列渡しではなくRepository型か

| 項目             | 配列渡し `fn(vendors: Vendor[])`         | Repository渡し `fn(repo: VendorRepository)` |
| ---------------- | ---------------------------------------- | ------------------------------------------- |
| 今のコスト       | 低い                                     | 少し高い（async/await記述）                 |
| DB移行時のコスト | **全関数シグネチャ崩壊**（sync→async化） | **差し替えのみ（ゼロ修正）**                |
| テスト           | 配列を直接渡す                           | mockRepo を渡すだけ                         |
| tenant分離       | 対応不可                                 | repoに`clientId`を持たせれば対応可          |
| キャッシュ       | 対応不可                                 | repo内部で自由にキャッシュ可能              |
| フィルタ条件追加 | 関数シグネチャ変更必要                   | repoメソッド追加のみ                        |

**初期コストの差は微小（awaitを書くだけ）。後での爆発コストは甚大。**

### Repository型定義（全5種）

#### 1. VendorRepository（取引先マスタ）

```typescript
// src/repositories/vendor.repository.ts
import type { Vendor, VendorVector } from "@/mocks/types/pipeline/vendor.type";

export type VendorRepository = {
  /** 全社共通取引先マスタ全件取得 */
  getAll(): Promise<Vendor[]>;
  /** match_keyで完全一致検索 */
  findByMatchKey(key: string): Promise<Vendor | undefined>;
  /** T番号で検索（t_numbers配列内を検索） */
  findByTNumber(tNumber: string): Promise<Vendor | undefined>;
  /** 電話番号で検索（phone_numbers配列内を検索） */
  findByPhoneNumber(phone: string): Promise<Vendor | undefined>;
};
```

**モック実装:**

```typescript
// src/repositories/mock/vendor.repository.mock.ts
import { VENDORS_GLOBAL } from "@/mocks/data/pipeline/vendors_global";

export const mockVendorRepo: VendorRepository = {
  getAll: async () => VENDORS_GLOBAL,
  findByMatchKey: async (key) =>
    VENDORS_GLOBAL.find((v) => v.match_key === key),
  findByTNumber: async (tNumber) =>
    VENDORS_GLOBAL.find((v) => v.t_numbers?.includes(tNumber)),
  findByPhoneNumber: async (phone) =>
    VENDORS_GLOBAL.find((v) => v.phone_numbers?.includes(phone)),
};
```

**将来のSupabase実装:**

```typescript
// src/repositories/supabase/vendor.repository.supabase.ts
export const supabaseVendorRepo: VendorRepository = {
  getAll: async () => {
    const { data } = await supabase.from("vendors_global").select("*");
    return data ?? [];
  },
  findByMatchKey: async (key) => {
    const { data } = await supabase
      .from("vendors_global")
      .select("*")
      .eq("match_key", key)
      .maybeSingle();
    return data ?? undefined;
  },
  findByTNumber: async (tNumber) => {
    const { data } = await supabase
      .from("vendors_global")
      .select("*")
      .contains("t_numbers", [tNumber])
      .maybeSingle();
    return data ?? undefined;
  },
  findByPhoneNumber: async (phone) => {
    const { data } = await supabase
      .from("vendors_global")
      .select("*")
      .contains("phone_numbers", [phone])
      .maybeSingle();
    return data ?? undefined;
  },
};
```

#### 2. ClientVendorRepository（顧問先取引先マスタ）

```typescript
export type ClientVendorRepository = {
  /** 顧問先の取引先マスタ全件取得 */
  getByClientId(clientId: string): Promise<Vendor[]>;
  /** 顧問先マスタでmatch_key検索 */
  findByMatchKey(clientId: string, key: string): Promise<Vendor | undefined>;
  /** 顧問先マスタに取引先を追加（学習結果の蓄積） */
  save(clientId: string, vendor: Vendor): Promise<void>;
};
```

#### 3. IndustryVectorRepository（業種辞書マスタ）

```typescript
import type {
  IndustryVectorEntry,
  VendorVector,
} from "@/mocks/types/pipeline/vendor.type";

export type IndustryVectorRepository = {
  /** 業種辞書全件取得（法人 or 個人） */
  getAll(businessType: "corporate" | "sole"): Promise<IndustryVectorEntry[]>;
  /** 業種ベクトルから科目候補を取得 */
  findByVector(
    businessType: "corporate" | "sole",
    vector: VendorVector,
  ): Promise<IndustryVectorEntry | undefined>;
};
```

**モック実装:**

```typescript
import { INDUSTRY_VECTOR_CORPORATE } from "@/mocks/data/pipeline/industry_vector_corporate";
import { INDUSTRY_VECTOR_SOLE } from "@/mocks/data/pipeline/industry_vector_sole";

export const mockIndustryVectorRepo: IndustryVectorRepository = {
  getAll: async (businessType) =>
    businessType === "corporate"
      ? INDUSTRY_VECTOR_CORPORATE
      : INDUSTRY_VECTOR_SOLE,
  findByVector: async (businessType, vector) => {
    const data =
      businessType === "corporate"
        ? INDUSTRY_VECTOR_CORPORATE
        : INDUSTRY_VECTOR_SOLE;
    return data.find((e) => e.vendor_vector === vector);
  },
};
```

#### 4. AccountRepository（勘定科目マスタ）

```typescript
export type AccountRepository = {
  /** 科目マスタ全件取得 */
  getAll(): Promise<AccountMasterEntry[]>;
  /** 科目IDで検索 */
  findById(id: string): Promise<AccountMasterEntry | undefined>;
  /** 顧問先のカスタム科目を含む全件取得 */
  getAllForClient(clientId: string): Promise<AccountMasterEntry[]>;
};
```

#### 5. ConfirmedJournalRepository（確定済み仕訳マスタ）

```typescript
export type ConfirmedJournalRepository = {
  /** 顧問先の確定済み仕訳全件取得 */
  getByClientId(clientId: string): Promise<ConfirmedJournal[]>;
  /** 顧問先の確定済み仕訳をmatch_keyで絞り込み（過去仕訳照合用） */
  findByMatchKey(
    clientId: string,
    matchKey: string,
  ): Promise<ConfirmedJournal[]>;
};
```

### ファイル構成

```
src/repositories/
  types.ts                              ← 全Repository型定義（上記5種）を集約
  mock/
    vendor.repository.mock.ts           ← VendorRepository モック実装
    clientVendor.repository.mock.ts     ← ClientVendorRepository モック実装
    industryVector.repository.mock.ts   ← IndustryVectorRepository モック実装
    account.repository.mock.ts          ← AccountRepository モック実装
    confirmedJournal.repository.mock.ts ← ConfirmedJournalRepository モック実装
    index.ts                            ← 全モック実装をまとめてexport
  supabase/                             ← 将来作成（フェーズ5）
    vendor.repository.supabase.ts
    ...
    index.ts
  index.ts                              ← 環境変数でモック/Supabaseを切り替え
```

### 環境切り替え（`src/repositories/index.ts`）

```typescript
import { mockRepos } from "./mock";
// import { supabaseRepos } from './supabase' // 将来

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

export const repos = USE_MOCK ? mockRepos : mockRepos; // 将来: supabaseRepos
```

### パイプラインロジック側の使い方

```typescript
// ❌ NG: 直接import（ハードコード密結合）
import { VENDORS_GLOBAL } from "@/mocks/data/pipeline/vendors_global";
function matchVendor(name: string) {
  return VENDORS_GLOBAL.find((v) => v.match_key === name); // sync
}

// ✅ OK: Repository経由（疎結合・DB移行安全）
import type { VendorRepository } from "@/repositories/types";
async function matchVendor(name: string, repo: VendorRepository) {
  return await repo.findByMatchKey(name); // async
}
```

### 対象ファイルと移行タイミング

| 現行ファイル                                | Repository型                                | 移行タイミング        |
| ------------------------------------------- | ------------------------------------------- | --------------------- |
| `vendors_global.ts`（224件）                | `VendorRepository`                          | C-0（精度テスト前）   |
| `vendors_client_*.ts`（未作成）             | `ClientVendorRepository`                    | フェーズ4（Step 2-4） |
| `industry_vector_corporate.ts` / `_sole.ts` | `IndustryVectorRepository`                  | フェーズ4（Step 2-4） |
| `account-master.ts`                         | `AccountRepository`                         | フェーズ4（Step 2-4） |
| `confirmed_journals_*.ts`（未作成）         | `ConfirmedJournalRepository`                | フェーズ4（Step 2-4） |
| `tax-category-master.ts`                    | 将来検討（AccountRepositoryに統合の可能性） | フェーズ5             |

### 経緯

1. 「配列を引数で渡す」案が提案された → 疎結合だがDB移行時にsync→async化で全関数崩壊するリスクを指摘（ユーザー）
2. Repository型（取得関数）を渡す方式に改善 → 差し替えだけでOK
3. 最初からPromise<T>で統一 → 後での爆発を完全防止（ユーザー提案・採用）
4. Repositoryにロジックを入れない → データアクセスのみ（ユーザー確定）

---

## DL-031 | 認証・認可設計（統一認証 + 招待リンク方式）（2026-04-08）

**状態**: 設計確定

### 背景・問題

アップロードUI（`/client/upload/:clientId`）を顧問先担当者に直接使わせる設計（DL-029）において、認証・認可が未設計だった。以下の要件を同時に満たす必要がある：

1. 顧問先にURLを渡したら永続的にセキュアに使える（ワンタイムではない）
2. 顧問先の担当者が**自分で**登録する（スタッフの管理手間ゼロ）
3. スタッフも同じ認証システムを利用する（別系統にしない）
4. Google / / メール+パスワードの2方式に対応

### 確定設計

#### ユーザー種別（role）

| role          | 対象           | アクセス範囲                         |
| ------------- | -------------- | ------------------------------------ |
| `staff`       | 事務所スタッフ | 全顧問先・全画面にアクセス可能       |
| `client_user` | 顧問先担当者   | 自分のclientIdのアップロード画面のみ |

#### 認証方式

Google / Apple ID / メール+パスワード（Supabase Auth）。スタッフも顧問先も同一の認証基盤を使用。

#### 招待リンク方式（顧問先の自己登録）

```
【スタッフの作業（1回だけ）】
顧問先管理画面 → 「招待リンクを発行」ボタン
→ URL自動生成: https://app.example.com/#/invite/x7k9m2
→ ChatWork等で顧問先に送信
→ 以降、スタッフの管理作業なし

【顧問先担当者の初回】
招待リンクをタップ → 登録画面
→ Google / Apple ID / メール+パスワードで自己登録
→ 自動的にclientIdと紐付け → アップロード画面に直行

【2回目以降】
ブックマーク or 同じURL → 自動ログイン → 即利用可能
```

#### 招待リンクの仕様

| 項目          | 仕様                                               |
| ------------- | -------------------------------------------------- |
| 形式          | `/invite/:code`（ランダム6文字。36^6 = 21億通り）  |
| 利用回数      | **無制限**（同じリンクで複数担当者が自己登録可能） |
| 有効期限      | なし（人員交代時も同じリンクで新担当者が登録）     |
| 無効化        | スタッフが管理画面でOFFにすれば即無効              |
| URLの推測耐性 | ランダム生成のため推測不可能                       |

#### テーブル設計（Supabase）

```sql
-- ユーザープロファイル（auth.usersの拡張）
CREATE TABLE user_profiles (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id),
  role         TEXT NOT NULL DEFAULT 'client_user',  -- 'staff' / 'client_user'
  display_name TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 招待テーブル
CREATE TABLE invitations (
  code         TEXT PRIMARY KEY,          -- 'x7k9m2'（ランダム6文字）
  client_id    TEXT NOT NULL,             -- 'LDI-00008'
  created_by   UUID REFERENCES auth.users(id),  -- 発行したスタッフ
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 顧問先×ユーザー紐付（認可）
CREATE TABLE client_users (
  client_id    TEXT NOT NULL,
  user_id      UUID NOT NULL REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (client_id, user_id)
);
```

#### アクセス制御

| URL                              | スタッフ（staff） | 顧問先担当者（client_user） |
| -------------------------------- | ----------------- | --------------------------- |
| `/client/upload/:clientId`       | ✅（全clientId）  | ✅（自分のclientIdのみ）    |
| `/client/journal-list/:clientId` | ✅                | ❌                          |
| `/master/*`                      | ✅                | ❌                          |
| `/invite/:code`                  | ❌（不要）        | ✅（初回登録時のみ）        |

#### ログイン後の画面分岐

```
ログイン完了
  ↓
role === 'staff'?
  YES → /mode-select（通常ダッシュボード）
  NO  → /client/upload/{自分のclientId}（アップロード画面に直行）
```

### URL設計（確定）

| URL                               | 用途                                            | 変更                 |
| --------------------------------- | ----------------------------------------------- | -------------------- |
| `/client/upload/:clientId`        | アップロード分岐セレクター（PC用/スマホ用選択） | 現在のURL構造を維持  |
| `/client/upload/:clientId/mobile` | スマホ用アップロードUI                          | 新規サブルート       |
| `/client/upload/:clientId/pc`     | PC用アップロードUI                              | 新規サブルート       |
| `/invite/:code`                   | 招待→自己登録画面（将来実装）                   | Supabase接続時に追加 |

### 実装タイミング

| タイミング                | やること                                    |
| ------------------------- | ------------------------------------------- |
| 今（モック段階）          | URL構造のみ確定。認証なしで動作             |
| フェーズ5（Supabase接続） | Auth + invitations + client_users + RLS実装 |

### 経緯

1. clientIdがURL推測可能 → 認証必要と判断
2. ワンタイムトークン方式 → URLが変わるため却下
3. Google/Apple ID/メール+パスワード認証 → 採用（顧問先が自分で登録）
4. スタッフも同じ認証システム → 採用（別系統にしない）
5. 招待リンク方式 → 採用（スタッフ管理手間ゼロ。複数担当者対応。無期限）
6. Google Drive共有フォルダとの差 → DL-029の即時AIバリデーションが差別化要因

---

## DL-032: DBスキーマ確定・Supabase先行実装（2026-04-08確定）

### 概要

モック型（TS interface）をベースにPostgreSQLスキーマを確定し、
Supabase版Repositoryを**接続前に先行実装**。
`.env`の`VITE_USE_MOCK=false`でモック→Supabase即切り替え可能。

### テーブル構成

| #   | テーブル             | 型ソース              | SQL                  | 状態 |
| --- | -------------------- | --------------------- | -------------------- | ---- |
| 1   | `user_profiles`      | DL-031新規            | 001_share_status.sql | ✅   |
| 2   | `invitations`        | DL-031新規            | 001_share_status.sql | ✅   |
| 3   | `client_users`       | DL-031新規            | 001_share_status.sql | ✅   |
| 4   | `share_status`       | ShareStatusRecord     | 001_share_status.sql | ✅   |
| 5   | `clients`            | Client型              | 002_core_tables.sql  | ✅   |
| 6   | `vendors`            | Vendor型              | 002_core_tables.sql  | ✅   |
| 7   | `accounts`           | Account型             | 002_core_tables.sql  | ✅   |
| 8   | `client_accounts`    | Account拡張           | 002_core_tables.sql  | ✅   |
| 9   | `industry_vectors`   | FlatIndustryVectorRow | 002_core_tables.sql  | ✅   |
| 10  | `confirmed_journals` | unknown（T-03待ち）   | 未作成               | ❌   |

### Repository実装状況

| Repository                 | モック | Supabase | 備考                                 |
| -------------------------- | ------ | -------- | ------------------------------------ |
| ShareStatusRepository      | ✅     | ✅       | Realtime subscription付き            |
| VendorRepository           | ✅     | ✅       | GINインデックスでT番号・電話番号検索 |
| ClientVendorRepository     | スタブ | ✅       | vendorsテーブルのscope='client'行    |
| IndustryVectorRepository   | スタブ | ✅       | フラット→プロパティ変換付き          |
| AccountRepository          | スタブ | ✅       | client_accountsマージ付き            |
| ConfirmedJournalRepository | スタブ | スタブ   | T-03完了後                           |

### ファイル構成

```
src/repositories/
  types.ts                    ← 全Repository型（ShareStatus追加済み）
  index.ts                    ← factory（VITE_USE_MOCK分岐）
  mock/
    index.ts                  ← モック集約
    vendor.repository.mock.ts
    shareStatus.repository.mock.ts
  supabase/
    index.ts                  ← Supabase集約
    helpers.ts                ← DB行↔TS型 変換関数（DRY）
    vendor.repository.supabase.ts
    clientVendor.repository.supabase.ts
    account.repository.supabase.ts
    industryVector.repository.supabase.ts
    shareStatus.repository.supabase.ts
src/lib/
  supabase.ts                 ← Supabaseクライアント初期化
src/composables/
  useShareStatus.ts           ← 共有設定composable（Repository経由）
supabase/migrations/
  001_share_status.sql        ← 認証・共有設定テーブル
  002_core_tables.sql         ← コアテーブル5つ
```

### 切り替え方法

```bash
# .envに以下を設定
VITE_USE_MOCK=false
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

### 正規化方針（確定）

| TS型                    | DB表現                                 | 根拠                            |
| ----------------------- | -------------------------------------- | ------------------------------- |
| `string[]`（aliases等） | `TEXT[]`（PostgreSQL配列）             | 別テーブルは管理コスト過大      |
| `VendorVector`（66種）  | `TEXT + CHECK`                         | ENUMテーブルはメンテ地獄        |
| `Client.contact`        | `JSONB`                                | 構造が単純。正規化不要          |
| `IndustryVectorEntry`   | フラット行（vector/direction/account） | flattenIndustryVector()設計済み |

### 残課題

1. **confirmed_journals**: T-03で型確定後にSQL + Supabase版Repository作成
2. **seedスクリプト**: モックデータ（vendors_global 224件等）のDB投入スクリプト未作成
3. **Supabase Realtime**: share_status以外のsubscription未実装（必要時に追加）

---

## 障害記録: Supabaseクライアント即時初期化によるナビゲーションブロック（2026-04-08）

### 症状

NavBarの「進捗管理」ボタンをクリックしても `/master/progress` に遷移しない。
ブラウザコンソールに以下のエラー:

```
[Vue Router warn]: uncaught error during route navigation:
Error: supabaseUrl is required.
    at supabase.ts:23:25
```

### 根本原因

`src/lib/supabase.ts` がモジュールレベル（トップレベル）で `createClient('', '')` を即実行していた。
`@supabase/supabase-js` v2 は第1引数が空文字の場合に `supabaseUrl is required` エラーを投げる。

モック運用時（`VITE_USE_MOCK=true`、または未設定）でも、ESモジュールのimportチェーンにより
Supabase版Repositoryが必ず読み込まれ、連鎖的に `supabase.ts` が実行されていた。

**エラー伝搬経路:**

```
repositories/index.ts（factory関数）
  → repositories/supabase/index.ts（バレルexport）
    → 各 *.repository.supabase.ts（import { supabase } from '@/lib/supabase'）
      → src/lib/supabase.ts（createClient() がモジュールレベルで即実行 → エラー）
```

factory関数は `VITE_USE_MOCK` でモック版を返すが、ESモジュール仕様上
import文はモジュール読み込み時に全て解決されるため、分岐に関係なく `supabase.ts` が読み込まれた。

### 修正内容

1. `src/lib/supabase.ts`: `export const supabase = createClient(...)` を廃止。
   `export function getSupabase(): SupabaseClient` を新設（遅延初期化・シングルトン）。
   モジュール読み込み時には何も実行せず、初回呼び出し時にのみ `createClient()` を実行。
2. Supabase版Repository全5ファイル: `import { supabase }` → `import { getSupabase }`、
   `supabase.from(...)` → `getSupabase().from(...)` に変更。

### 二次障害（AI起因）

修正過程でPowerShellの正規表現一括置換（`Get-Content | -replace | Set-Content`）を使用した結果、
日本語コメントが文字化けしファイルが破損。`git restore` で復元したが、
コミット済みバージョンへの巻き戻しとなり、セッション中の未コミット作業が失われた。

**教訓:**

- PowerShellでのコード操作は禁止（`.agent/workflows/load_context.md` に追記済み）
- ファイル編集は必ず `replace_file_content` / `multi_replace_file_content` を1ファイルずつ使用する
- コード変更後は早期にコミットし、長時間の未コミット状態を避ける

### 対応コミット

`79c7fca` — `fix: Supabaseクライアントの遅延初期化導入によるナビゲーションブロックの解消`

---

## DL-033 | パイプライン結合テスト環境構築（2026-04-10）

**状態**: 環境構築完了・ADC認証通過後にStep 0-1精度テスト実施予定

### 背景・問題

DL-029で「Supabase接続なしでパイプライン精度テストを完結させる」方針を確定したが、具体的な結合テスト環境（バックエンド→Vertex AI→フロントエンド）が未構築だった。

### 確定アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│  ブラウザ（localhost:5173）                                   │
│  MockUploadPcPage.vue                                        │
│    ↓ POST /api/pipeline/classify （base64画像）              │
└──────────┬──────────────────────────────────────────────────┘
           │ Vite proxy (/api → localhost:8080)
┌──────────▼──────────────────────────────────────────────────┐
│  Honoサーバー（localhost:8080）                               │
│  src/server.ts → pipeline.route.ts                           │
│    ↓                                                         │
│  classify.service.ts                                         │
│    ① sharp前処理（EXIF回転→リサイズ→白黒→正規化→シャープ）  │
│    ② Vertex AI呼び出し（Structured Output + System Prompt）  │
│    ③ postprocess（fallback設計）                             │
│    ④ ログ出力                                                │
└──────────┬──────────────────────────────────────────────────┘
           │ ADC認証（gcloud auth application-default login）
┌──────────▼──────────────────────────────────────────────────┐
│  Vertex AI (gemini-2.5-flash-preview-04-17)                  │
│  project: sugu-suru / location: asia-northeast1              │
└─────────────────────────────────────────────────────────────┘
```

### 設計決定

| #   | 決定事項                                                      | 根拠                                                                                         |
| --- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| D1  | Supabase Edge Functionsではなく**Honoローカルサーバー**を使う | Supabase接続なしでテストする方針（DL-029）。Edge Functions版は全モック完了後に実装           |
| D2  | Vite proxyで`/api`→8080に転送                                 | CORSなし・フロントエンドから透過的にAPIを呼べる                                              |
| D3  | 前処理（sharp pipeline）を`classify.service.ts`に**直接統合** | `preprocess.ts`はスタンドアロン版。APIではbase64→Buffer→sharp→base64の変換が必要なため別実装 |
| D4  | PDFは前処理スキップ                                           | GeminiがPDFを直接読めるため                                                                  |
| D5  | 前処理失敗時は生画像で続行（例外を投げない）                  | AI呼び出し自体は可能。前処理失敗でパイプライン全体を止めない                                 |
| D6  | GoogleGenAIクライアントはシングルトン                         | リクエスト毎にnewしない。`_ai`変数でキャッシュ                                               |
| D7  | `src/database/supabase/client.ts`をProxy遅延初期化に変更      | 環境変数未設定でもバックエンドがクラッシュしない                                             |

### 前処理パイプライン（sharp pipeline）

```
入力: base64画像（ブラウザから送信）
  ↓ Buffer.from(base64, 'base64')
  ↓ sharp(inputBuffer)
    .rotate()                                    // 1. EXIF回転補正
    .resize(2000, null, { withoutEnlargement })  // 2. 横幅2000px上限
    .grayscale()                                 // 3. 白黒化
    .normalize()                                 // 4. コントラスト正規化
    .sharpen({ sigma: 1.0 })                     // 5. 文字エッジ強調
    .jpeg({ quality: 85 })                       // 6. JPEG出力
  ↓ processed.toString('base64')
出力: 前処理済みbase64（image/jpeg）
```

### 実測結果

| 画像                | 元サイズ | 処理後 | 削減率 |
| ------------------- | -------- | ------ | ------ |
| 20250912_075647.jpg | 4077KB   | 1143KB | 72%    |
| 20250912_075650.jpg | 3551KB   | 909KB  | 74%    |
| 20250912_075642.jpg | 4354KB   | 1328KB | 69%    |

**平均削減率: 72%**。DL-011実測（前処理あり/なしの比較）と整合。

### Classify API仕様

```
POST /api/pipeline/classify
Content-Type: application/json

{
  "image": "<base64>",
  "mimeType": "image/jpeg",
  "filename": "xxx.jpg",
  "clientId": "LDI-00008"
}

→ ClassifyResponse {
  source_type, source_type_confidence,
  direction, direction_confidence,
  description, issuer_name, date, total_amount,
  processing_mode, fallback_applied,
  duration_ms, model, prompt_tokens, ...
}
```

### UI連携（MockUploadPcPage.vue）

アップロード時に自動で`/api/pipeline/classify`を呼び出し、結果をバッジ表示：

| バッジ色  | 内容                                            |
| --------- | ----------------------------------------------- |
| 紫/ピンク | source_type（領収書、請求書等）                 |
| 青        | direction（支払、入金等）                       |
| 緑/黄/赤  | confidence（80%以上=緑、50-80%=黄、50%未満=赤） |
| グレー    | 発行者名（AI推定）                              |
| 緑        | 金額（税込合計）                                |
| 薄灰      | 処理時間（ms）                                  |

### 残課題

| #   | 課題                                 | 状態            |
| --- | ------------------------------------ | --------------- |
| 1   | ADC認証通過後のStep 0-1精度実測      | 🔶 次のステップ |
| 2   | Extract（明細抽出）APIの実装         | ❌ 未着手       |
| 3   | CSV出力機能                          | ❌ 未着手       |
| 4   | 分類失敗時のUIエラーハンドリング改善 | ❌ 未着手       |

### 経緯

1. `src/scripts/classify_test.ts`でNode.jsスクリプトによるスタンドアロンテストを先行実施（DL-011）
2. UI結合テストのためHonoサーバー＋Vite proxy構成を構築
3. Supabaseクライアント即時初期化がサーバー起動をブロック → Proxy遅延初期化で解消
4. `preprocess.ts`の前処理パイプラインを`classify.service.ts`に統合（base64→Buffer→sharp→base64の変換対応）
5. ADC認証エラー（`invalid_grant` / `invalid_rapt`）が発生 → `gcloud auth application-default login`で再認証が必要

---

## DL-034 | UUID方式ID設計 + AnalyzeOptions拡張 + 全メトリクスログ出力（2026-04-12）

**状態**: 実装完了

### 決定内容

#### 1. ID設計をUUID方式に変更（衝突リスク排除）

| ID                      | 旧方式         | 新方式                             | 生成タイミング             |
| ----------------------- | -------------- | ---------------------------------- | -------------------------- |
| `document_id`（証票ID） | 存在しなかった | `crypto.randomUUID()`              | アップロード時（フロント） |
| `id`（仕訳ID）          | `jrn-${連番}`  | `jrn-${crypto.randomUUID()}`       | 仕訳生成時                 |
| `line_id`（行ID）       | 常にnull       | `${documentId}_line-${line_index}` | 仕訳生成時                 |

**なぜ変更したか**:

- 旧連番方式（`jrn-00000001`）は並行アップロード時にidOffset管理が必要で衝突リスクがあった
- UUID v4（122ビット暗号乱数）は315万件（300社×3,500仕訳/年×3年）規模で衝突確率 ≈ 10^-31（事実上ゼロ）
- Supabase移行時にUUID PKとしてそのまま使用可能。追加変換不要

**Supabase移行方針**:

- クライアント側（フロント or APIサーバー）で `crypto.randomUUID()` を使ってUUIDを生成
- Supabase テーブルは `UUID PRIMARY KEY DEFAULT gen_random_uuid()` でフォールバック
- INSERT前の使用有無チェックは不要（衝突確率 ≈ 0、PK制約が最終防御）

#### 2. AnalyzeOptions 拡張

`analyzeReceipt()` の第2引数を `clientId: string` → `AnalyzeOptions` オブジェクトに変更。

```typescript
interface AnalyzeOptions {
  clientId?: string; // 顧問先ID
  role?: string; // 'staff' | 'guest'
  device?: string; // 'pc' | 'mobile'
  documentId?: string; // 証票ID（crypto.randomUUID()）
}
```

`role` / `device` は `route.name` から導出（UploadStaffPc → staff/pc 等）。

#### 3. テスト用全メトリクスログ出力

`logClassifyResult()` でブラウザコンソールに全30項目を構造化出力。

```
▼ フロント情報（7項目）
  顧問先ID / 証票ID / 権限 / 端末 / ファイル名 / 形式 / サイズ
▼ AIレスポンス（11項目）
  OK/NG / 種別 / 種別信頼度 / 方向 / 方向信頼度 / モード / 日付 / 金額 / 取引先 / 摘要 / fallback
▼ メトリクス（7項目）
  処理時間 / 入力トークン / 出力トークン / 思考トークン / 合計 / コスト / モデル
▼ 前処理（3項目）
  元サイズ / 圧縮後 / 削減率
```

### 変更ファイル一覧

| ファイル                                   | 変更内容                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| `src/mocks/services/receiptService.ts`     | `AnalyzeOptions`型追加（documentId含む）、`logClassifyResult`全30項目出力 |
| `src/mocks/views/MockUploadPcPage.vue`     | `FileEntry.documentId`追加、`crypto.randomUUID()`生成、classify時に渡す   |
| `src/mocks/views/MockUploadPage.vue`       | `ReceiptItem.documentId`追加、同上 + retake時再生成                       |
| `src/mocks/utils/lineItemToJournalMock.ts` | `generateJournalId()` UUID化、`documentId`引数追加、`line_id`生成         |

### 根拠（Evidence）

- 型チェック: `tsc --noEmit` エラー0件確認（2026-04-12）
- UUID v4衝突確率: 315万件で ≈ 10^-31（数学的証明）

### ファイルアップロード データ項目一覧（全30項目・全項目テスト出力済み）

#### フロントエンド側（送信前に取得可能）

| #   | 変数名                      | 日本語                 | 値の例                 | null | 出力 |
| --- | --------------------------- | ---------------------- | ---------------------- | ---- | ---- |
| 1   | `clientId`（顧問先ID）      | 顧問先コード           | LDI-00008              | 不可 | ✅   |
| 2   | `documentId`（証票ID）      | 証票UUID               | 9b1deb4d-3b7d-4bad-... | 不可 | ✅   |
| 3   | `role`（権限）              | 事務所 or 顧問先       | staff / guest          | 不可 | ✅   |
| 4   | `device`（端末）            | PC or スマホ           | pc / mobile            | 不可 | ✅   |
| 5   | `filename`（ファイル名）    | 元ファイル名           | 20250912.jpg           | 不可 | ✅   |
| 6   | `mimeType`（形式）          | ファイル形式           | image/jpeg             | 不可 | ✅   |
| 7   | `fileSizeBytes`（元サイズ） | アップロード前バイト数 | 4174788                | 不可 | ✅   |

#### AIレスポンス（サーバーから返却）

| #   | 変数名                                   | 日本語                     | 値の例                 | null可 | 出力 |
| --- | ---------------------------------------- | -------------------------- | ---------------------- | ------ | ---- |
| 8   | `source_type`（証票種別）                | 領収書・請求書等12種       | receipt（領収書）      | 不可   | ✅   |
| 9   | `source_type_confidence`（種別信頼度）   | AI確信度0.0〜1.0           | 1                      | 不可   | ✅   |
| 10  | `direction`（仕訳方向）                  | 支払・入金・振替・混在     | expense（支払）        | 不可   | ✅   |
| 11  | `direction_confidence`（方向信頼度）     | AI確信度0.0〜1.0           | 1                      | 不可   | ✅   |
| 12  | `processing_mode`（処理モード）          | 自動・手動・除外           | auto（自動）           | 不可   | ✅   |
| 13  | `description`（摘要）                    | AIが生成した取引内容       | コンビニでの飲食物購入 | null可 | ✅   |
| 14  | `issuer_name`（取引先名）                | 発行者名                   | サクラマート コンビニ  | null可 | ✅   |
| 15  | `date`（日付）                           | 取引日 YYYY-MM-DD          | 2022-06-16             | null可 | ✅   |
| 16  | `total_amount`（合計金額）               | 税込金額（整数）           | 799                    | null可 | ✅   |
| 17  | `fallback_applied`（フォールバック適用） | AI失敗時のデフォルト値置換 | false / true           | 不可   | ✅   |

#### メトリクス（metadata内）

| #   | 変数名                               | 日本語                | 値の例           | 出力 |
| --- | ------------------------------------ | --------------------- | ---------------- | ---- |
| 18  | `duration_ms`（処理ミリ秒）          | AI処理時間（ms）      | 10226            | ✅   |
| 19  | `duration_seconds`（処理秒）         | AI処理時間（秒）      | 10.2             | ✅   |
| 20  | `prompt_tokens`（入力トークン）      | プロンプトトークン数  | 1965             | ✅   |
| 21  | `completion_tokens`（出力トークン）  | 応答トークン数        | 104              | ✅   |
| 22  | `thinking_tokens`（思考トークン）    | 思考トークン数        | 286              | ✅   |
| 23  | `token_count`（トークン合計）        | 入力+出力合計         | 2069             | ✅   |
| 24  | `cost_yen`（利用料）                 | 1枚あたりAI費用（円） | 0.2037           | ✅   |
| 25  | `model`（モデル名）                  | 使用AIモデル          | gemini-2.5-flash | ✅   |
| 26  | `original_size_kb`（前処理前）       | 元画像サイズ（KB）    | 593              | ✅   |
| 27  | `processed_size_kb`（前処理後）      | 圧縮後サイズ（KB）    | 91               | ✅   |
| 28  | `preprocess_reduction_pct`（削減率） | サイズ削減率（%）     | 85               | ✅   |

#### バリデーション結果（フロント側で判定）

| #   | 変数名                  | 日本語   | 値の例                      | 出力 |
| --- | ----------------------- | -------- | --------------------------- | ---- |
| 29  | `ok`（判定結果）        | OK / NG  | true / false                | ✅   |
| 30  | `errorReason`（NG理由） | 却下理由 | 日付が読み取れません / null | ✅   |

> **全30項目テスト出力済み。未出力項目ゼロ。**（2026-04-12確認）

---

## DL-035 | AI分類キーワード外部化 + classify_reason追加（2026-04-12）

**状態**: 実装完了・テスト通過

### 決定内容

#### 1. source_type 12種化（supplementary_doc追加）

| 変更           | 内容                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| 新種別         | `supplementary_doc`（補助資料：見積書・契約書・保険証券・検査報告書等、仕訳対象外だが業務に必要な書類） |
| ProcessingMode | `excluded`（対象外）に分類                                                                              |
| 影響ファイル   | `types.ts`（SOURCE_TYPES列挙）、`postprocess.ts`（MODE_MAP追加）、`classify.service.ts`（スキーマ追加） |

#### 2. 分類キーワードの外部ファイル化（source_type_keywords.ts）

**なぜ外部化したか**:

- `classify.service.ts` のSYSTEM_INSTRUCTIONに全12種のキーワードが直書きされていた（約200行）
- キーワード追加・変更のたびにプロンプト全体を触る必要があり保守性が低かった
- 将来的にSupabase等のDB格納や顧問先別カスタマイズを見据えた設計

**新アーキテクチャ**:

```
SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTION_BASE（導入部）
                   + buildKeywordsPrompt()（← source_type_keywords.tsから動的生成）
                   + SYSTEM_INSTRUCTION_RULES（出力ルール）
```

**実装ファイル**: `src/api/services/pipeline/source_type_keywords.ts`

- `SourceTypeKeywords` インターフェース（keywords / excludeRules / notes）
- `BoundaryGuide` インターフェース（pair / guide）
- 全12種のキーワード定義 + 紛らわしい境界ガイド10件
- `buildKeywordsPrompt()` 関数でプロンプトテキストに変換

#### 3. classify_reason フィールド追加

| 変更                                  | 内容                                               |
| ------------------------------------- | -------------------------------------------------- |
| `ClassifyRawResponse.classify_reason` | AIが判定根拠を自然言語で返すフィールド             |
| `ClassifyResponse.classify_reason`    | postprocessでフロントに伝播                        |
| 用途                                  | テスト時の精度検証・判定根拠のトレーサビリティ向上 |

### テスト結果（2026-04-12）

| テスト                              | 結果                                                             |
| ----------------------------------- | ---------------------------------------------------------------- |
| tsc --noEmit                        | エラー0件                                                        |
| journal_voucher判定（仕訳一覧画像） | ✅ 正常判定（classify_reason: 「借方」「貸方」の項目があるため） |
| 仕訳一覧→journal_voucher            | 許容（振替伝票と仕訳一覧の区別はキーワードベースでは困難）       |

### 変更ファイル一覧

| ファイル                                            | 変更内容                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/api/services/pipeline/source_type_keywords.ts` | 新規作成。全12種キーワード定義 + 境界ガイド10件 + `buildKeywordsPrompt()` |
| `src/api/services/pipeline/classify.service.ts`     | プロンプトを外部ファイルからの動的結合方式に変更                          |
| `src/api/services/pipeline/types.ts`                | `supplementary_doc`追加、`classify_reason`フィールド追加                  |
| `src/api/services/pipeline/postprocess.ts`          | MODE_MAPにsupplementary_doc追加、classify_reason伝播                      |
| `src/mocks/services/receiptService.ts`              | ログ出力にclassify_reason追加                                             |

---

## DL-036 | 全体処理フロー確定 + 人間チェック原則（2026-04-12）

**決定**: AIの分類結果は「提案」であり、最終判断は必ず人間が行う。

### 設計原則

> **AIを信じるな。人間がチェックする。**
> AIは「目」であり「判断者」ではない。全件を人間が確認してから次工程へ進む。

### 全体処理フロー（確定版）

```
① アップロード（スマホ / PC）
   画面: MockUploadPage.vue / MockUploadPcPage.vue
   URL:  /upload/:clientId/:role/mobile  or  /upload/:clientId/:role/pc
   処理: ファイル形式チェック（ホワイトリスト6種） → Gemini classify API
   結果: source_type / direction / confidence / classify_reason
         ↓
② AI分類結果の人間チェック（Drive資料選別）★次ステップ★
   画面: MockDriveSelectPage.vue
   URL:  /drive-select/:clientId
   処理: AIの提案（仕訳対象/対象外）を表示 → 人間が1件ずつ確認・修正
   操作: [A] 仕訳対象  [D] 対象外  [S] 戻す  [↑↓] 移動
         ↓
③ 仕訳変換（TSルールベース）
   処理: 確定済みline_items → lineItemToJournalMock() → 仕訳データ
   科目: vendor_vector × direction → ACCOUNT_MASTER辞書で決定論的に導出
         ↓
④ 仕訳確認・修正（人間）
   画面: 仕訳一覧画面
   処理: 自動仕訳の内容を人間が確認・修正
         ↓
⑤ エクスポート → マネーフォワード
```

### ファイル形式による分岐（DL-036a: 2026-04-12確定）

| ファイル形式                               | 処理                                     |
| ------------------------------------------ | ---------------------------------------- |
| .jpg / .jpeg / .png / .heic / .webp / .pdf | ① → ② → ③ → ④ → ⑤ のフルフロー           |
| .csv / .xlsx / .xls / .ods                 | エラー「MFに直接インポートしてください」 |
| .ks / .mf 等（会計ソフト独自）             | エラー「MFに直接インポートしてください」 |
| その他                                     | エラー「対応していないファイル形式です」 |

### エラー種類一覧（11種）

> 2026-04-13更新: document_count・issuer_name・重複警告を追加（矛盾3解消）

| #   | レイヤー | エラーメッセージ                                                                   | Geminiコスト | 判定           |
| --- | -------- | ---------------------------------------------------------------------------------- | ------------ | -------------- |
| 1   | フロント | CSV・Excelファイルはマネーフォワードに直接インポートしてください                   | ゼロ         | 補助対象       |
| 2   | フロント | 対応していないファイル形式です。画像（JPG/PNG/HEIC/WebP）またはPDFを送ってください | ゼロ         | 補助対象       |
| 3   | フロント | サーバーエラー (${status})                                                         | ゼロ         | NG             |
| 4   | 後処理   | この画像にはN枚の証票が写っています。1枚ずつ撮影してください                       | 発生済       | NG（最優先）   |
| 5   | 後処理   | 仕訳対象外の書類です                                                               | 発生済       | 補助対象       |
| 6   | 後処理   | 日付が読み取れません                                                               | 発生済       | NG             |
| 7   | 後処理   | 金額が読み取れません                                                               | 発生済       | NG             |
| 8   | 後処理   | 取引先が読み取れません                                                             | 発生済       | NG             |
| 9   | 後処理   | AI処理に失敗しました。撮り直してください                                           | 発生済       | NG             |
| 10  | フロント | 重複の可能性（同日・同額・同取引先 or T番号一致）                                  | ゼロ         | OK（警告のみ） |
| 11  | フロント | 通信エラー: ${message}                                                             | ゼロ         | NG             |

---

## DL-037 | PDFプレビュー表示対応 + MIMEタイプバグ修正（2026-04-12）

**状態**: 実装完了

### バグ修正: PDF前処理のMIMEタイプ不整合

**発見**: `image_preprocessor.ts` のPDF前処理スキップ時に `mimeType: 'image/jpeg'` を返していた。
実際のデータはPDFバイナリであるため、Gemini APIがMIMEタイプとデータの不一致で処理できず、fallback（トークン0件）になっていた。

```diff
- mimeType: 'image/jpeg',   // ← バグ: PDFなのにimage/jpeg
+ mimeType: 'application/pdf', // ← 修正: 正しいMIMEタイプ
```

**型拡張**: `PreprocessResult.mimeType` を `'image/jpeg' | 'application/pdf'` に変更。

**修正ファイル**: `src/scripts/pipeline/image_preprocessor.ts` L85-86, L149-161

### PDFプレビュー表示（全5ページ対応）

**問題**: `<img>` タグはPDFを表示できない。`URL.createObjectURL(pdfFile)` で作ったBlobURLを `<img src>` に渡しても描画不能。

**解決方針**: PDFファイルの場合は `<iframe>` でブラウザ内蔵PDFビューアを使って表示する。URLの拡張子 `.pdf` またはファイルの `type === 'application/pdf'` で判定。

| ページ                     | ファイル                               | 判定方法                                                    | 対応内容                                                    |
| -------------------------- | -------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| スマホアップロード         | `MockUploadPage.vue` L135-149          | `r.file.type === 'application/pdf'`                         | iframeで200%→scale(0.5)縮小プレビュー + pointer-events:none |
| drive-select（サムネ）     | `MockDriveSelectPage.vue` L29-39       | `doc.fileName?.toLowerCase().endsWith('.pdf')`              | iframe 100px→scale(0.5)縮小                                 |
| drive-select（プレビュー） | `MockDriveSelectPage.vue` L71-81       | `selected.fileName?.toLowerCase().endsWith('.pdf')`         | iframe h-[400px]フル表示                                    |
| 仕訳一覧モーダル           | `JournalListLevel3Mock.vue` L1599-1620 | `modalImageUrl?.toLowerCase().endsWith('.pdf')`             | iframe w-full h-full                                        |
| 仕訳入力画面               | `ScreenE_JournalEntry.vue` L274-280    | `selectedJob?.driveFileUrl?.toLowerCase().endsWith('.pdf')` | iframe w-full h-full                                        |

**影響なしのページ**:

- PC版アップロード（`MockUploadPcPage.vue`）: プレビュー画像なし（ファイルリスト表示のみ）
- OCRテスト（`TestOCRPage.vue`）: OCR結果表示用（別用途）
- エクスポート履歴（`MockExportHistoryPage.vue`）: CSV/ファイルダウンロード用

---

## 2026-04-12 証票枚数バリデーション強化（document_count）

### 実装内容

| 項目                  | 内容                                                                   |
| --------------------- | ---------------------------------------------------------------------- |
| thinkingBudget        | 2048トークンに制限（思考ループによるコスト爆発防止）                   |
| document_count        | Geminiに画像内の独立した情報源数をカウントさせるフィールド             |
| document_count_reason | 枚数判定の根拠をGeminiに言語化させるフィールド（Chain of Thought効果） |
| プロンプト強化        | SYSTEM_INSTRUCTION_BASEに「最優先タスク：情報源数の判定」を明示        |

### 検出精度（テスト結果）

| ケース                           | 検出可否 | 備考                                                             |
| -------------------------------- | -------- | ---------------------------------------------------------------- |
| 並列撮影（2枚を横に並べて撮影）  | 安定検出 | document_count=2でNG判定                                         |
| スクリーンショット混在           | 安定検出 | document_count=2でNG判定                                         |
| 重畳撮影（レシートを重ねて撮影） | 検出不能 | Geminiが画像認識レベルで認識できない。プロンプト改善では解決不可 |

### 既知の制約

- 重畳撮影はGeminiの画像認識の限界であり、プロンプト改善・スキーマ変更では解決できない
- 重畳ケースではdocument_count=1（誤判定）かつ金額・日付も正常に読み取れるためOKで通過してしまう
- 対策としてUI側の撮影ガイド（1枚ずつ平置き撮影の案内）で間接的に防止する方針

### 変更ファイル

| ファイル            | 変更内容                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------ |
| classify.service.ts | thinkingBudget:2048設定、スキーマにdocument_count_reason追加、プロンプトに最優先タスク追加 |
| types.ts            | ClassifyRawResponse/ClassifyResponseにdocument_count_reason追加                            |
| postprocess.ts      | document_count_reasonの伝播処理追加                                                        |

---

## DL-038 | 重複ハッシュ記録のライフサイクル管理（2026-04-16）

**状態**: 設計確定・A案実装済み

### 問題

アップロードUI画面遷移時にフロント側の`entries`（画像データ）は破棄されるが、サーバー側の`knownFileHashes`（SHA-256重複判定用Set）はメモリに残存する。再度同じページで同じファイルをアップロードすると、サーバーが「重複」と誤判定する。

### 選択肢と決定

| 案 | 内容 | メリット | デメリット | 採用 |
|---|---|---|---|---|
| **A（当面）** | 画面遷移時（`onBeforeUnmount`）+ `resetAll`時にDELETE APIでサーバー側記録をクリア | シンプル | 複数ユーザー同時利用時に他ユーザーの記録も消える | ✅ 採用 |
| **B（Supabase移行時）** | セッションID（clientId等）ごとにSetを分割管理。またはdocumentsテーブルでハッシュ照合 | マルチユーザー安全 | サーバー側改修が必要 | 移行時に実施 |
| C | TTL付きSet（30分で自動消去） | 放置しても自然消滅 | 30分以内の再アップロードで重複誤判定 | ❌ |

### A案の実装（現行）

- **APIエンドポイント**: `DELETE /api/pipeline/hashes` → `clearKnownHashes()` 呼出
- **フロント呼出タイミング**: `onBeforeUnmount` + `resetAll` の2箇所
- **対象ファイル**: `classify.service.ts`（clearKnownHashes関数）、`pipeline.ts`（DELETEルート）

### B案への移行パス（Supabase移行時）

- `documents`テーブルの`file_hash`カラムで重複照合に差し替え
- `knownFileHashes`（メモリ内Set）を廃止
- クライアントごと・セッションごとに自然にスコープが分離される
- DELETEエンドポイントは不要になる（DBライフサイクルで管理）

---

## DL-039 | ゲスト認証・Drive共有フォルダ権限付与設計（2026-04-18）

**状態**: UI実装完了・実証テスト成功（Supabase Auth統合は未着手）

### 決定内容

| 項目 | 決定 |
|---|---|
| フォルダ管理 | スタッフとゲストで**同一フォルダ**を共有 |
| 権限レベル | **writer（編集者）**（ファイル追加・編集可能、フォルダ削除不可） |
| 権限付与タイミング | ゲストのGoogleログイン成功時に自動実行 |
| 認証方式（PC） | メール+パスワード（Supabase Auth `signInWithPassword` / `signUp`） |
| 認証方式（スマホ） | Google OAuth（Supabase Auth `signInWithOAuth`） |
| デフォルト選択 | 「スマホも使う」がデフォルト（顧問先はスマホ利用が主） |
| `sharedFolderId` | `Client`型に追加。顧問先登録時に`createDriveFolder()`で自動作成 |

### 実装した関数

```typescript
// src/api/services/drive/driveService.ts
export async function grantFolderPermission(
  folderId: string,
  email: string,
  role: 'reader' | 'writer' = 'writer', // デフォルト: writer（編集者）
): Promise<void>
```

### 根拠（Evidence）

- **実証テスト（2026-04-18）**: `marke.hughug@gmail.com` にwriter権限を付与 → スマホからDriveフォルダにアクセス → 写真2枚 + 動画1本のアップロード成功 → サーバー側でファイル確認完了
- **権限分離**: 共有ドライブではwriter権限でもフォルダ構造の変更（削除・移動）は不可。organizer以上が必要。顧問先がフォルダを誤って削除するリスクはない

### 今後のタスク

| # | タスク | 状態 |
|---|---|---|
| 1 | Supabase Auth `signInWithOAuth({ provider: 'google' })` コールバック内で `grantFolderPermission()` 呼び出し | ❌ 未着手 |
| 2 | Supabase Auth `signInWithPassword` / `signUp` 実装（パソコンのみフロー） | ❌ 未着手 |
| 3 | 顧問先登録時に `sharedFolderId` をDBに保存する処理 | ❌ 未着手 |


---

## DL-040 | 資料管理基盤設計 — DocEntry型・documentsテーブル・資料選別連動（2026-04-18）

**状態**: 完了（型定義・SQL・composable・UI接続・進捗管理連動）

### 決定内容

| 項目 | 決定 |
|---|---|
| 型定義場所 | `src/repositories/types.ts` に `DocEntry` + `DocumentRepository` 追加 |
| SQL | `supabase/migrations/003_documents.sql` 新規作成（10番目のテーブル） |
| composable | `src/composables/useDocuments.ts`（モジュールスコープref → DL-041でAPI接続に改修） |
| 算出ロジック | `src/utils/documentUtils.ts` に分離（composable/Repositoryにロジックを入れない） |
| 資料選別ページ | `MockDriveSelectPage.vue` をuseDocuments接続に改修 |
| 進捗管理連動 | `useProgress.ts` のreceivedDate/unsortedをDocEntryから動的算出 |
| ナビバー名称 | 「Drive資料選別」→「資料選別」（Drive以外のデータも扱うため） |
| ナビバー順序 | アップロード → 資料選別（業務フロー順） |
| 進捗管理列 | 「未選別」列を「未出力」列の左に追加（オレンジハイライト）。**未選別＝送信確定前のトータル書類枚数（migrate後に0）** |

### フェーズルール準拠

| ルール | 準拠方法 |
|---|---|
| composableはrefで直接保持 | useDocumentsがモジュールスコープrefで全資料を保持 |
| createRepositories()に依存させるな | useDocumentsはRepositoryを使わない（移行時に差し替え） |
| ロジックは入れるな | countUnsorted/latestReceivedDateはutils/documentUtils.tsに分離 |
| 型はtypes.tsに定義 | DocEntry/DocumentRepositoryをrepositories/types.tsに追加 |
| SQLはmigrations/に配置 | 003_documents.sql新規作成 |

### 業務フロー設計

```
本番: 1時間に1回バッチでDrive/独自を確認 → 新規資料を取り込み → 進捗管理の「未選別」列で通知
モック: 人間がAIに「アップした」と伝える → AIがrefにデータ投入
即時性: 不要（前日昼に届いたら翌朝に資料選別にあればOK）
```

---

## DL-041 | JSON永続化 + サーバーAPI接続（2026-04-19）

**状態**: 完了（インメモリ+JSON永続化ストア + APIルート + composable API接続 + DocEntry型拡張 + Drive/独自アップロード結合テスト完了）

### 決定内容

| 項目 | 決定 | 理由 |
|---|---|---|
| 永続化方式 | **インメモリ + JSONファイル**（`data/documents.json`） | 1か月のモック期間。サーバー再起動でもデータ保持。Supabase移行時にDB操作に差し替えるだけ |
| Supabase直接接続 | **時期尚早。不採用** | UI+APIの形が固まってないのにDB繋ぐと柔軟性を失う。リポジトリパターンで移行対応済み |
| ブラウザ間共有 | **サーバー側にデータ保持で解決** | Vueのrefはブラウザメモリ内で閉じる。APIサーバー経由ならどのブラウザからも同じデータ |
| API設計 | RESTful（`/api/doc-store`） | 既存の`/api/documents`（Supabase向け）と共存 |
| 型参照 | `repositories/types.ts`から一元import | 二重定義を構造的に防止。TypeScriptコンパイラで同期漏れを検知 |

### 型参照構造（確定）

```
repositories/types.ts ← 唯一の型定義源泉
  ├── composables/useDocuments.ts（フロント）→ import type { DocEntry }
  ├── api/services/documentStore.ts（サーバー）→ import type { DocEntry }
  └── mocks/composables/useUpload.ts（フロント）→ import type { DocEntry }
```

### DocEntry型拡張（DL-040から差分）

| フィールド | 追加内容 |
|---|---|
| `source` | `'staff-upload' \| 'guest-upload'` 追加 |
| `status` | `'supporting'`（根拠資料）追加 |
| `batchId` | 選別完了→送出時に付与（`batch-{clientId}-{timestamp}`） |
| `journalId` | 選別完了→送出時にUUID付与 |

### 新規ファイル

| ファイル | パス | 役割 |
|---|---|---|
| `documentStore.ts` | `src/api/services/` | インメモリ+JSON永続化ストア |
| `docStore.ts` | `src/api/routes/` | APIルート（GET/POST/PUT/DELETE） |

### APIエンドポイント

| メソッド | パス | 用途 |
|---|---|---|
| `GET` | `/api/doc-store?clientId=xxx` | ドキュメント一覧取得 |
| `POST` | `/api/doc-store` | ドキュメント一括追加（重複チェック付き） |
| `PUT` | `/api/doc-store/:id` | ステータス更新 |
| `POST` | `/api/doc-store/batch` | 選別完了→batchId/journalId付与 |
| `DELETE` | `/api/doc-store/client/:clientId` | 顧問先の全資料削除 |

### フロント側の通信方式

**ローカルref即反映 + サーバーfire-and-forget**

- addDocuments: refに追加 → POSTをfire-and-forget
- updateStatus: refを更新 → PUTをfire-and-forget
- removeByClientId: refをフィルタ → DELETEをfire-and-forget
- refresh: サーバーからGET → refを差し替え

**なぜfire-and-forgetか**:
- モック段階でawaitすると体感遅延が発生
- サーバーエラー時もUI操作は継続可能
- Supabase移行時にawaitに変更すればリトライ/エラー表示が可能

### 検証結果（2026-04-19）

| テスト | 結果 |
|---|---|
| GET /api/doc-store（空） | ✅ `{ documents: [], count: 0 }` |
| POST（1件追加） | ✅ `{ ok: true, added: 1, skipped: 0 }` |
| POST（同一fileHash重複） | ✅ `{ ok: true, added: 0, skipped: 1 }` |
| JSONファイル永続化確認 | ✅ `data/documents.json` に書き出し |
| Drive取込→drive-select→ゴミ箱移動 | ✅ 3件取込成功 |
| 独自アップロード→drive-select | ✅ 5件反映成功 |
| batchId/journalId付与 | ✅ 全件付与成功 |
| TypeScript型チェック | ✅ 通過 |

---

## DL-042 | モーダルUI統一 + Vendors永続化基盤（2026-04-19）

**状態**: 完了

> 詳細は `task_unified.md` B-12参照。

---

## DL-043 | 招待リンク機能 + 未保存変更ガード最適化 + Driveフォルダ自動リネーム（2026-04-20）

**状態**: mock実装完了（Google OAuth未着手）

### 1. 招待リンク機能（/invite/:code）

#### 決定内容

| 項目 | 決定 |
|---|---|
| ルート | `/invite/:code` をrouter/index.tsに追加 |
| 逆引き | `useShareStatus.getClientIdByInviteCode(code)` 新規追加 |
| リダイレクト先 | `/guest/:clientId/login`（既存MockPortalLoginPage.vue再利用） |
| コード不正時 | `/mode-select` にリダイレクト + コンソール警告 |
| 処理タイミング | `beforeEnter` ガードで即座に逆引き・リダイレクト |

#### 本番移行時の変更量

| 要素 | mock（今） | 本番（Supabase） | 変更量 |
|---|---|---|---|
| `/invite/:code` ルート定義 | そのまま使う | そのまま使う | **0** |
| コード→clientId逆引き | mockキャッシュ検索 | `invitations`テーブルSELECT | **リポジトリ切替のみ**（Supabase版実装済み） |
| リダイレクト先 | `/guest/:clientId/login` | 同じ | **0** |
| ログインページ | MockPortalLoginPage | 同じ＋Google OAuth追加 | **OAuthボタン追加のみ** |

> **VITE_USE_MOCK=falseにするだけでSupabase版に切り替わる。**
> ルート定義・リダイレクトロジック・composableは全てそのまま本番で動く。
> 唯一追加が必要なのは、本番時にMockPortalLoginPageにGoogle OAuthボタンを実装する部分。

#### 本番移行タスク（DL-039と連動）

| # | タスク | 状態 |
|---|---|---|
| 1 | Google Cloud ConsoleでOAuthクライアントID発行 | ❌ 未着手 |
| 2 | MockPortalLoginPageにGoogle Identity Services（GIS）ボタン追加 | ❌ 未着手 |
| 3 | ログイン成功→JWTからメールアドレス抽出→`grantFolderPermission()`自動実行 | ❌ 未着手 |
| 4 | Supabase `invitations`テーブルからのコード逆引き（リポジトリ層は実装済み） | ❌ 未着手 |

> **補足**: SAキー（GOOGLE_SA_KEY_PATH）があるのでGCPプロジェクトは既に存在する。
> Google OAuthはSupabase不要。Google Identity Services（GIS）のclient libraryで直接ログイン可能。
> `google.accounts.id.initialize({ client_id: '...' })` でログインボタン表示→JWT→メールアドレス取得。

### 2. 未保存変更ガード最適化

#### 決定内容

| 項目 | 決定 |
|---|---|
| 変更ログ方式 | `markDirty(msg?)` でオプショナルに変更内容を記録。離脱モーダルに一覧表示 |
| 即時保存型ページ | Clients/Staffは各保存成功後に`markClean()`を呼びリセット（**案B**） |
| バッチ保存型ページ | Accounts/Tax系は保存ボタンで既にmarkClean済み（変更なし） |
| API失敗時の安全ネット | markDirtyに到達しない→dirty維持→離脱ガード発動 |

#### 変更ログ対応済みページ（全6ページ、計38箇所）

| ページ | markDirty箇所 | ページ種別 |
|---|---|---|
| MockMasterClientsPage | 5箇所 | 即時保存型（markClean追加済み） |
| MockMasterStaffPage | 2箇所 | 即時保存型（markClean追加済み） |
| MockMasterTaxCategoriesPage | 8箇所 | バッチ保存型 |
| MockMasterAccountsPage | 9箇所 | バッチ保存型 |
| MockClientTaxPage | 6箇所 | バッチ保存型 |
| MockClientAccountsPage | 8箇所 | バッチ保存型 |

### 3. Driveフォルダ自動リネーム

| 項目 | 決定 |
|---|---|
| リネームタイミング | 3コード変更時に自動実行 |
| フォルダ名形式 | `${threeCode}_${companyName}` |
| APIエンドポイント | `PATCH /api/drive/folder/rename` 新設 |
| フォルダ未作成時 | リネーム通知を抑制（sharedFolderIdが未設定の場合） |

### 実装済みファイル

| ファイル | 変更内容 |
|---|---|
| `src/composables/useShareStatus.ts` | `getClientIdByInviteCode()` 追加 |
| `src/router/index.ts` | `/invite/:code` ルート + beforeEnter逆引き |
| `src/mocks/composables/useUnsavedGuard.ts` | changeLog配列 + formatChangeLog() |
| `src/api/services/drive/driveService.ts` | `renameDriveFolder()` 追加 |
| `src/api/routes/drive.ts` | `PATCH /api/drive/folder/rename` 追加 |
| `src/mocks/views/MockMaster*.vue` (4ページ) | markDirty説明文追加 |
| `src/mocks/views/MockClient*.vue` (2ページ) | markDirty説明文追加 |

---

## DL-044: セキュリティ・DB・API一括実装（2026-04-23）

### 実施内容

| # | タスク | ファイル | 内容 |
|---|---|---|---|
| B-1 | staffテーブルSQL | `supabase/migrations/004_staff.sql` 新規 | staff.json互換。RLS: staffのみ |
| B-2 | migration_jobsテーブルSQL | `supabase/migrations/005_migration_jobs.sql` 新規 | CHECK制約+UNIQUE冪等性インデックス |
| A-1 | スタッフ認証JWT化 | `src/router/index.ts` L462 | localStorage→getCurrentUserAsync() |
| A-3 | ゲストログイン直接アクセス制限 | `src/router/index.ts` beforeEnter | sessionStorageフラグ+検証 |
| C-2 | 顧問先契約解除時ブロック | `src/router/index.ts` beforeEnter | API経由でclient.status確認 |
| A-2 | excluded ZIPルート接続 | `src/api/routes/drive.ts` | GET /download-excluded/:clientId |
| C-1 | PC D&D→Drive upload | `src/api/routes/drive.ts` | POST /upload |

### 検証

- `vue-tsc --noEmit` エラー0件

### SQLテーブル数（R-S2更新: 10→12）

| SQL | テーブル数 | テーブル |
|---|---|---|
| 001_share_status.sql | 4 | user_profiles, invitations, client_users, share_status |
| 002_core_tables.sql | 5 | clients, vendors, accounts, client_accounts, industry_vectors |
| 003_documents.sql | 1 | documents |
| 004_staff.sql | 1 | staff |
| 005_migration_jobs.sql | 1 | migration_jobs |
| **合計** | **12** | — |

---

## DL-045: バリデーション・エラーハンドリングアーキテクチャ刷新（2026-04-23）

### 設計思想

> **「フロントは優しさ、サーバーは真実」**
> 3層防御: フロント（UX用即時フィードバック）→ サーバーZod（ビジネスルール本体）→ DB制約（最後の砦）

### 実施内容

| # | タスク | ファイル | 内容 |
|---|---|---|---|
| 1 | zodHook新規作成 | `src/api/helpers/zodHook.ts` 新規 | zValidator共通エラーフック。Zodエラーを`apiError()`経由で統一フォーマットに変換。複数issues対応（`\n`結合） |
| 2 | zodHook全ルート適用 | 6ファイル・10箇所 | `ai-rules.ts`(2), `collection.ts`(1), `clients.ts`(3), `admin.ts`(1), `ocr.ts`(1), `api/index.ts`(1) |
| 3 | apiFetch全面改修 | `src/utils/apiFetch.ts` | 400系→ページ遷移しない（呼び出し元にAppError返却）、401→/login遷移、500系/404→/404遷移。`apiFetch.withError()`追加 |
| 4 | 後方互換定数削除 | `src/api/helpers/apiMessages.ts` | 使用箇所ゼロの`サーバーエラー`/`外部サービスエラー`/`メンテナンス中`を削除 |
| 5 | Zodスキーマ日本語化 | `ai-rules.ts`, `admin.ts`, `clients.ts` | Zod v4 `{ error: '...' }` 形式で`apiMessages.ts`の`必須()`関数をスキーマに埋め込み |
| 6 | 移行タスク記載 | `docs/supabase/migration_tasks.md` | 残3タスク（スキーマ日本語化残り・fetch19箇所移行・スキーマ分離）をセクション9に追記 |

### エラー処理フロー（最終形）

```
[フロントバリデーション] → UX用即時フィードバック（modal.notify等）
         ↓ OK
[apiFetch / apiFetch.withError] → サーバーにリクエスト
         ↓
[zValidator + zodHook] → Zodバリデーション失敗時 apiError(c, 400, 日本語メッセージ)
         ↓ OK
[ルートハンドラ] → apiError(c, 404, 未検出('xxx')) / apiCatchError(c, err)
         ↓
[レスポンス] → { error: "安全な日本語文面", requestId: "abc" }
         ↓
[apiFetch] → 401→/login, 500系/404→/404, 400系→呼び出し元にAppError返却
```

### apiFetch設計（改修後）

| エラー種別 | 動作 | 呼び出し元の責務 |
|---|---|---|
| 成功(2xx) | `{ data: T, error: null }` | dataを使う |
| 400系 | ページ遷移しない。`{ data: null, error: AppError }` | `error.メッセージ`をUI表示（toast/modal等） |
| 401 | /loginに自動遷移 | なし（自動） |
| 404/500/502/503 | /404エラーページに自動遷移 | なし（自動） |
| ネットワーク障害 | /404エラーページに自動遷移 | なし（自動） |

### 対象ファイル一覧

| ファイル | 変更種別 |
|---|---|
| `src/api/helpers/zodHook.ts` | 新規 |
| `src/api/helpers/apiMessages.ts` | 修正（定数削除） |
| `src/utils/apiFetch.ts` | 全面改修 |
| `src/api/routes/ai-rules.ts` | zodHook適用 + スキーマ日本語化 |
| `src/api/routes/collection.ts` | zodHook適用 |
| `src/api/routes/clients.ts` | zodHook適用 + スキーマ日本語化 |
| `src/api/routes/admin.ts` | zodHook適用 + スキーマ日本語化（インラインhook統一） |
| `src/api/routes/ocr.ts` | zodHook適用 |
| `src/api/index.ts` | zodHook適用（インラインhook統一） |
| `docs/supabase/migration_tasks.md` | 残タスク追記 |

### 検証

- `vue-tsc --noEmit` エラー0件
- Zod v4.3.6対応（`{ required_error }` → `{ error }` に修正）

---

## DL-046: プレビュー表示根本修正 + ブラウザ非対応形式変換（2026-04-24）

### 設計思想

> **「親に高さ、imgに100%、object-fit: containが基本」**
> 対症療法（max-height, transform, flex, grid）を繰り返した結果、根本原因は「object-fit: containの前提条件（①親の高さが固定②imgのwidth/heightが100%）を満たしていなかった」ことだった。

### 問題と原因

| 問題 | 根本原因 |
|---|---|
| JPEG画像が下に見切れる | `.ds-preview-container`に高さが未設定。overflow: hiddenで下部を切断 |
| PNG横長画像が枠内に収まらない | flexbox/grid子要素でmax-height%が期待通り動作しない |
| 25%縮小が効かない | zoomScale <= 0.5でインラインスタイルが空=CSS制限のみ→縮小不可 |
| PDF表示されない | ①canvasRefをdestructureから除外②CDN(cdnjs)にv5.6.205が未登録 |
| HEIC/HEIF/TIFF表示不可 | ブラウザネイティブ非対応。`<img>`に渡しても描画されない |

### 実施内容

| # | タスク | ファイル | 内容 |
|---|---|---|---|
| 1 | プレビューCSS根本修正 | `MockDriveSelectPage.vue` | container→height固定、scroll→height:100%、wrapper→width/height%でズーム、img→width/height:100%+object-fit:contain |
| 2 | ズーム方式変更 | `MockDriveSelectPage.vue` | transform:scale()→wrapper width/height%方式。全ズームレベルで統一動作 |
| 3 | PNG透過背景 | `MockDriveSelectPage.vue` | 背景色 #e5e7eb → #fff |
| 4 | EXIF回転対応 | `MockDriveSelectPage.vue` | `image-orientation: from-image` CSS追加 |
| 5 | PDF canvasRef接続 | `MockDriveSelectPage.vue` | usePdfRenderer()のcanvasRefをdestructure |
| 6 | PDF.js CDN修正 | `usePdfRenderer.ts` | cdnjs → jsDelivr npm CDN |
| 7 | HEIC/HEIF/TIFF→JPEG変換 | `drive.ts` | `sharp`でサーバー側自動変換。キャッシュにJPEGとして保存 |
| 8 | `sharp`インストール | `package.json` | `npm install sharp` |

### CSS階層構造（修正後）

```css
.ds-preview-container { height: calc(100vh - 200px); overflow: hidden; }
  .ds-preview-scroll { height: 100%; overflow: auto; }
    .ds-preview-wrapper { width: {zoom*200}%; height: {zoom*200}%; }
      .ds-preview-img { width: 100%; height: 100%; object-fit: contain; }
```

### ズーム計算

| zoomScale | wrapper | 動作 |
|---|---|---|
| 0.25 | 50% x 50% | 枠の半分に縮小 |
| 0.50（デフォルト） | 100% x 100% | 枠全体にcontain |
| 1.00 | 200% x 200% | はみ出し→スクロール |

### 拡張子別対策まとめ

| 拡張子 | ブラウザ対応 | 対策 |
|---|---|---|
| .jpg | ✅ | `image-orientation: from-image`（EXIF回転） |
| .png | ✅ | 背景白(#fff)、object-fit: contain |
| .gif | ✅ | ファイル名表示のみ（CSV等と同じ扱い） |
| .webp | ✅ | 対策不要 |
| .heic/.heif | ❌ | **サーバー側sharp変換→JPEG** |
| .tiff | ❌ | **サーバー側sharp変換→JPEG** |
| .pdf | ⚠️ Canvas | PDF.js + canvasRef接続 + jsDelivr CDN |

### 対象ファイル一覧

| ファイル | 変更種別 |
|---|---|
| `src/mocks/views/MockDriveSelectPage.vue` | CSS/テンプレート全面修正 |
| `src/composables/usePdfRenderer.ts` | CDN URL修正 |
| `src/api/routes/drive.ts` | HEIC/TIFF変換+sharpインポート |
| `package.json` | sharp追加 |

### 検証

- ✅ JPEG縦長（鳥貴族レシート）: 枠内に全体収まり、下の見切れなし
- ✅ PNG横長（スクリーンショット）: 枠内に全体収まり
- ✅ PDF（カインズ領収書）: Canvas描画で正常表示
- ✅ 25%縮小: 画像が小さく表示される
- ✅ 125%拡大: スクロールバーが出現しスクロール可能

### 追加修正: 「未選別」定義修正

| 項目 | 旧（誤り） | 新（正しい） |
|---|---|---|
| **定義** | `status === 'pending'` のみ | **送信確定前のトータル書類枚数** |
| **含むもの** | 未処理のみ | pending + target + supporting + excluded の全件 |
| **0になるタイミング** | 全件選別完了時 | **migrate（確定送信）完了後** |

修正ファイル:
- `src/utils/documentUtils.ts` — `countUnsorted()`: `filter(pending).length` → `docs.length`
- `src/features/progress-management/types.ts` — unsortedフィールドコメント修正
- `docs/genzai/24_upload_drive_integration.md` — countUnsorted定義修正

---

## DL-047: 出力ポータル統合 + アーキテクチャ改修 + composable分離（2026-04-24）

**決定**: 仕訳外ZIPダウンロード・MF用CSV出力を「出力ポータル」に集約。ジョブ単位DL対応。MockDriveSelectPage.vueをcomposable分離。

### 出力ポータルUI統合

| 項目 | 内容 |
|---|---|
| `/output/:clientId` | 出力ポータルページ。仕訳外ZIP（左）・MF用CSV（右）のカードUI |
| `/excluded-history/:clientId` | 仕訳外ダウンロード履歴。jobId単位のDL済/未DL一覧、複数選択一括DL |
| ナビバー | 出力関連5パス（`/output`, `/export`, `/excluded-history`, `/export-history`, `/export-detail`）でアクティブ維持 |

### バックエンドAPI追加・修正

| エンドポイント | 変更内容 |
|---|---|
| `GET /download-excluded/:clientId` | `?jobId=`パラメータ追加（ジョブ単位ZIP）。0件チェックをjobId指定時も実施（空ZIPリスク解消） |
| `GET /excluded-history/:clientId` | 新規。jobId単位グルーピングで履歴返却 |
| `GET /migrate/jobs/:clientId` | 新規。jobId単位でtotal/done/failed/excluded集計。interface〜JSON版〜Supabase版〜ラッパー〜エンドポイント全層実装 |

### バグ修正

| バグ | 原因 | 修正 |
|---|---|---|
| DL済みマークが付かない | `excludedZipService.ts`の`!all`条件により`all=true`時にmarkDownloadedがスキップ | `!all`条件を削除。DLしたら常にmarkDownloaded実行 |
| currentClient判定漏れ | `useClients.ts`の正規表現ハードコードに新ルートが欠落 | `route.params.clientId`優先方式に根本改修。新ルート追加時の追記漏れ問題を恒久解消 |

### MockDriveUploadPage.vue旧式コード削除

| 項目 | 変更 |
|---|---|
| `downloadExcludedZip`関数 | 削除（jobIdなし全件DLの旧式） |
| `isDownloadingZip` ref | 削除 |
| 仕訳外ZIPボタン | 「仕訳外ダウンロード履歴へ」遷移ボタンに変更 |

### MockDriveSelectPage.vue composable分離

**なぜ**: 1163行の巨大ファイルにデータ取得・選別操作・プレビュー制御が密結合していた。

| ファイル | 行数 | 責務 |
|---|---|---|
| MockDriveSelectPage.vue（本体） | **850行**（旧1163行→27%削減） | UI・キーボード・確定送信・表示ヘルパー |
| `useDriveDocuments.ts` | 249行 | Drive API + doc-store取得、DocView変換、フィルタ |
| `useDocSelection.ts` | 230行 | Undo/Redo、ステータス変更、一括操作、チェックボックス |
| `usePreviewZoom.ts` | 131行 | ファイル選択、ズーム制御、PDF判定 |

### useClients.ts型エラー修正

- L198, L220: スプレッド演算子の`noUncheckedIndexedAccess`相当の型エラーを`!`非null断定で解消

### 根拠

- 出力ポータルは「各顧問先に係る作業」であり第3段コンテンツ（clientId依存）
- DL済みマークバグは`all=true`パスのテスト不足が原因。条件自体が不要だった
- currentClient改修により、`router/index.ts`で`:clientId`パスを定義するだけでナビバー連動が自動適用される
- composable分離により単体テスト可能な3ブロックに責務を明確化

---

## DL-048: フェーズ3.5 migrationWorkerにclassify API統合 + メタデータ永続化全面修正（2026-04-24）

**決定**: migrationWorkerのprocessOneJob()にclassify API呼び出しを統合。Drive経路のファイルにもAI分類結果を付与し、独自アップロード経路と同等のデータ品質を実現する。

### アーキテクチャ

```
Drive → DL → SHA-256 → classify API → Storage PUT → markJobDone → doc-store書き戻し → ゴミ箱移動
                           ↑
                    excludedはスキップ（コスト削減）
```

### 修正ファイル一覧（10ファイル、+222行/-70行）

| ファイル | 変更内容 |
|---|---|
| `migrationWorker.ts` | processOneJob()にclassify API統合。7ステップフローに拡張。excludedスキップ設計。classify失敗でもジョブは完了（DL+Storageは続行） |
| `documentStore.ts` | `updateAiResults(driveFileId, result, hash)` 新設。ClassifyResponse→DocEntryの全20フィールドマッピング。`updateDocumentStatus()`をstatusChangedBy/At/updatedBy/At対応に拡張 |
| `docStore.ts` | PUT /:id ルートでstatusChangedBy/At/updatedBy/Atをbodyから受け取ってupdateDocumentStatusに渡す |
| `types.ts` | aiMetricsにoriginal_size_kb/processed_size_kb/preprocess_reduction_pct追加 |
| `useUpload.ts` | handleConfirmのaiMetricsにサイズ情報3フィールド追加。未使用useClients import削除 |
| `useMigrationPoller.ts` | ポーリング完了時にuseDocuments.refresh(clientId)でAI分類結果をフロント側refに反映 |
| `useDriveDocuments.ts` | DriveファイルDocEntry生成時にcreatedByにcurrentStaffId付与 |
| `useDocSelection.ts` | applyStatus/undo/redoでupdateDocStatusにcurrentStaffId渡し |
| `useDocuments.ts` | updateStatus()のタイムスタンプ生成を1回に集約（ローカル更新とAPIリクエスト間のミリ秒ズレ解消） |
| `typeDefinitionsData.ts` | selectDrive列 🔧→✅ を23件更新 |

### 設計判断

| 判断 | 根拠 |
|---|---|
| excludedはclassifyスキップ | 仕訳外ファイルにAI分類は不要。Vertex AIのAPIコスト削減。将来「仕訳外→仕訳対象に戻す」場合はステータス変更時に個別classifyを実行する設計で対応 |
| classify失敗でもジョブはdoneに | DL+Storage PUTは成功しているため、AI結果なしでもファイル自体の移行は完了。手動でclassifyを再実行する手段は将来追加可能 |
| updateAiResultsはインメモリ→save() | サーバー側doc-storeのJSON永続化はsave()で同期書き込み。フロント側refの更新はポーリング完了時のrefresh()で対応 |
| updateDocumentStatusの拡張 | フロントのuseDocuments.updateStatus()がstatusChangedBy/Atを送信していたが、サーバー側で無視されていた永続化漏れを修正 |
| aiMetricsにサイズ情報追加 | 画像前処理の効果測定データ（original_size_kb/processed_size_kb/preprocess_reduction_pct）をDocEntryに永続化。selectOwn/selectDriveの🔧を解消 |

### typeDefinitionsData.ts selectDrive列 残存🔧（3件のみ）

| フィールド | 列 | 理由 |
|---|---|---|
| `fileHash` | `uploadDrive` | Drive「アップロード」段階ではハッシュ計算不可。migrate後に付与される設計 |
| `isDuplicate` | `selectOwn` | 独自アップロード側の重複判定。fileHashで代替可能だが現在未実装 |
| `batchId` | `outMf` | 送出フェーズで付与。選別時点では物理的に未存在 |

---

## DL-049 | MF CSV実機仕様確定・データ変換Python検証環境整備（2026-04-25）

**状態**: 確定・実装完了

### 背景

会計データ変換パイプライン（`converter.py`）の検証過程で、MF CSV出力の列順序・列数・列名がMF実機エクスポートと乖離していることが判明。実機2ファイル（課税事業者27列・免税事業者19列）を根拠に、TS側・Python側両方を修正。

### MF実機確認結果（最終確定仕様）

| 事業者設定 | 列数 | エンコード | BOM |
|---|---|---|---|
| **課税事業者** | **27列** | UTF-8 | BOM付き |
| **免税事業者** | **19列** | Shift-JIS | BOMなし |

### 確定列順序（課税事業者27列版ベース）

```
取引No, 取引日,
借方勘定科目, 借方補助科目, 借方部門, 借方取引先, 借方税区分, 借方インボイス, 借方金額(円), 借方税額,
貸方勘定科目, 貸方補助科目, 貸方部門, 貸方取引先, 貸方税区分, 貸方インボイス, 貸方金額(円), 貸方税額,
摘要, 仕訳メモ, タグ, MF仕訳タイプ, 決算整理仕訳,
作成日時, 作成者, 最終更新日時, 最終更新者
```

**重要**: 列順序は `部門 → 取引先 → 税区分 → インボイス → 金額(円) → 税額`

### インポート用出力（23列版。作成日時等4列を除外）

| 列# | 列名 |
|---|---|
| 1-2 | 取引No, 取引日 |
| 3-10 | 借方勘定科目, 借方補助科目, 借方部門, 借方取引先, 借方税区分, 借方インボイス, 借方金額(円), 借方税額 |
| 11-18 | 貸方勘定科目, 貸方補助科目, 貸方部門, 貸方取引先, 貸方税区分, 貸方インボイス, 貸方金額(円), 貸方税額 |
| 19-23 | 摘要, 仕訳メモ, タグ, MF仕訳タイプ, 決算整理仕訳 |

### 修正内容

| 対象 | 修正前 | 修正後 |
|---|---|---|
| **TS** `exportMfCsv.ts` | 21列、`借方金額`、インボイス末尾 | 23列、`借方金額(円)`、取引先列追加、インボイス税区分直後 |
| **Python** `converter.py` MFExporter | 17列、税区分→部門逆順 | 23列、部門→取引先→税区分→インボイス→金額(円)→税額 |
| **Python** `to_sjis_safe()` | `shift_jis` | `cp932`（Windows-31J。髙崎栁等IBM拡張文字対応） |

### Python検証環境（converter.py）の位置付け — ⚠️ 2026-04-25 廃止決定

> **DL-050で廃止決定。** 弥生/freee→MF変換はMFインポート機能に任せるため、sugusuru側での変換ロジックは不要。
> 以下のファイルは `docs/genzai/参照資料_税区分変換/` に移動済み。

```
（廃止・参照資料に移動済み）
docs/genzai/参照資料_税区分変換/converter.py
docs/genzai/参照資料_税区分変換/test_converter.py
docs/genzai/参照資料_税区分変換/tax-category-mapping.ts
docs/genzai/参照資料_税区分変換/_*.py  ← 一時スクリプト類
```

### 根拠データ（実機出力ファイル）

| ファイル | 事業者設定 | 列数 | エンコード |
|---|---|---|---|
| `data/csv_samples/mf_journal_test.csv` | 課税 | 27列 | UTF-8 BOM |
| `（MF実機エクスポートサンプル）` | 免税（青色申告） | 19列 | Shift-JIS |
| `（sugu-suru出力サンプル）` | sugu-suru出力 | 23列 | UTF-8 BOM |

---

## DL-050 | 会計マスタ標準化・3ソフト変換方針確定・MF実機テスト（2026-04-25）

**状態**: 確定・実機テスト完了

### 設計決定: MF形式を唯一の出力フォーマットとする

**決定**: sugusuruは常にMF形式（本則・課税仕入10%等の正確な税区分付き）で出力する。弥生/freeeへの変換はMF側のインポート機能に委ねる。

**なぜか**:
- MFは弥生CSV/freeeCSVをインポートする際、税区分・勘定科目を自動マッチングする機能を持つ
- sugusuru側で3ソフト間の方言（151件×3ソフト）を吸収する変換テーブルは不要
- Python変換ロジック（converter.py）もTS変換テーブル（tax-category-mapping.ts）も不要

**結果: 不要になったもの**:

| 成果物 | 状態 |
|---|---|
| `tax-category-mapping.ts`（151件×4方言） | 参照資料に移動（廃止） |
| `converter.py` の変換ロジック | 参照資料に移動（廃止） |
| 3ソフト勘定科目対応表（account-mapping.ts） | 作成不要（廃止） |
| `tax-category-master.ts`（MF正本151件） | **残す（sugusuruの正本）** |

### 税区分マスタ標準化（完了）

| 項目 | 結果 |
|---|---|
| 名称突合（TS ↔ MF実機CSV） | ✅ **151件全件一致** |
| active | ✅ 全151件 true |
| effectiveFrom/To | ✅ 全件OK（輸入消費税額7.8%/6.24%修正含む） |
| displayOrder | ✅ 重複なし（1〜151） |
| defaultVisible | ✅ 42件true / 109件false |
| MF使用フラグ一致 | ✅ 完全一致 |
| 型チェック（vue-tsc） | ✅ 通過 |

### 本則CSV出力が免税MFでも動く理由

**MF実機テスト（2026-04-25実施）**: 4パターンのインポートテスト完了。

| # | CSV | MF環境 | 結果 |
|---|---|---|---|
| ① | 本則CSV → **免税MF** | 課税仕入10% → **対象外に自動変換** | ✅ |
| ② | 免税CSV → **免税MF** | そのまま | ✅ |
| ③ | 免税CSV → **本則MF** | **対象外のまま** 😱 | ⚠️ NG |
| ④ | 本則CSV → **本則MF** | そのまま | ✅ |

**結論**: 常に本則CSV形式で出力すれば、どの課税方式のMFでも正しく取り込まれる。免税→本則は税区分が「対象外」のまま残ってしまうため、免税用CSVの出力は危険。

### 勘定科目の個人/法人差異（5件のみ）

| MF個人名 | 法人/freee/弥生法人名 | MFの対応 |
|---|---|---|
| 外注工賃 | 外注費 | マッチング画面で紐づけ |
| 損害保険料 | 保険料 | マッチング画面で紐づけ |
| 利子割引料 | 支払利息 | マッチング画面で紐づけ |
| 貸倒金 | 貸倒損失 | マッチング画面で紐づけ |
| 接待交際費 | 交際費 | マッチング画面で紐づけ |

**sugusuru側での変換は不要。MFのマッチング機能が吸収する。**

### DL-024との整合性

DL-024「免税顧問先はパイプラインが全件 COMMON_EXEMPT（対象外）に自動変換」の方針は変更なし。ただしCSV出力時は本則税区分をそのまま出力し、MF側で吸収させる設計に変更。パイプライン内部の税区分管理とCSV出力時の扱いを分離。

### 今後の活用: 口座/カードCSV → MFインポート

今回のシステム（税区分マスタ・勘定科目マスタ・T番号照合・過去仕訳マッチング）は、将来の口座CSV/カードCSV→MFインポート機能でそのまま再利用可能。

| 今回の資産 | 口座/カードCSV対応 |
|---|---|
| `tax-category-master.ts` | ✅ 仕訳自動提案時の税区分選択に使用 |
| T番号/照合キー マッチング | ✅ 明細→過去仕訳マッチングの核心 |
| 勘定科目マスタ | ✅ 仕訳候補の科目提案 |
| `exportMfCsv.ts` | ✅ 仕訳帳CSV出力そのまま |

---

## DL-051 | 全108フィールド完全監査（2026-04-26）

**状態**: 監査完了・問題6種検出・修正タスク起票済み

### 目的

DocEntry（52件）・JournalPhase5Mock（45件）・UploadEntry（26件）・LineItem（15件）・JournalEntryLine（6件）の全フィールドについて、以下を機械的に検証する。

1. `typeDefinitionsData.ts`（監査テーブル）に全フィールドが定義されているか
2. TSコード（useUpload.ts / useDriveDocuments.ts / lineItemToJournalMock.ts等）でフィールドが正しく設定されているか
3. 全107個のVueファイルでフィールドが参照・表示されているか

### 調査方法

- TS型定義5ファイルからプロパティ名を全件抽出
- TSロジック5ファイルのデータフロー（設定元・設定行番号）を追跡
- 全107 Vueファイルに対して66プロパティ × 107ファイル = 7,062パターンのgrep検索を実施

### 検出した問題（6種）

| 問題種別 | 件数 | 詳細 |
|---|---|---|
| 欠落フィールド（typeDefに未定義だがTS型に存在） | 14件 | DocEntry内6件（direction_confidence, token_count, line_index, balance, original_size_kb, processed_size_kb） + LineItem内8件（determined_account, tax_category, vendor_name, candidates, level, history_match_hit, non_vendor_type, tax_type） |
| ハードコード（typeDefにあるがTS型に未定義） | 12件 | Drive移行（JobRow）7件（job_id, migration_status, retry_count, last_error, storage_path, downloaded_at, storage_purged_at） + リレーション5件（Staff, Client, ShareStatus, Notification, ConfirmedJournal） |
| 名前不一致 | 5件 | confidence→source_type_confidence, tokens(3種)→4プロパティ, size_kb(2種)→2プロパティ, reduction_pct→preprocess_reduction_pct, fallback→aiFallbackApplied |
| Vue未参照（型定義はある） | 23件 | AI分類結果15件（aiDate, aiAmount, aiVendor等がどのVue画面でも未表示） + Journal4件 + AI推定4件 |
| データ消失 | 1件 | `isDuplicate`がUploadEntry→DocEntry変換時（handleConfirm）に消失 |
| Vue未参照（typeDef定義） | 1件 | `line_id`（クエリ高速化用だがVue未使用） |

### 設計判断

#### セクションG（Drive移行7フィールド）の扱い

Drive移行の7フィールド（job_id, migration_status等）は `DocEntry` 型には含めない。これらは `migration_jobs` テーブル（`JobRow`型）のフィールドであり、DocEntryとは別テーブルで管理する。typeDefinitionsData.tsには「関連エンティティ」として記載し、DocEntry型の欠落ではないことを明示する。

#### AI分類結果15件のVue未表示

classify APIで取得してDocEntryに保存済みの15フィールド（aiDate, aiAmount, aiVendor, aiSourceType, aiDirection, aiDescription, aiClassifyReason, aiLineItems, aiLineItemsCount, aiSupplementary, aiDocumentCount, aiWarning, aiProcessingMode, aiFallbackApplied, aiMetrics）が、どのVue画面でも表示されていない。選別画面（`/drive-select/:clientId`）でAI結果を表示すべきだが未実装。task_unified.md L-8で「仕訳一覧UI（C-7）完了後に着手判断」として管理。

#### isDuplicateデータ消失

`useUpload.ts` の `handleConfirm()` でUploadEntry→DocEntry変換時に `isDuplicate` フラグが消失する。DocEntry型に `isDuplicate` プロパティが存在しないため。修正タスクとしてT-AUD-5を起票済み。

### 監査レポート

詳細は [field_audit.md v3](file:///C:/Users/kazen/.gemini/antigravity/brain/b29e23e6-88c0-4691-a867-4f898f874cd8/field_audit.md) を参照。

### 実施済み検証ツール

| ファイル | 目的 |
|---|---|
| `pipeline_flow.cjs` | フィールドのパイプラインフロー追跡 |
| `field_diff.cjs` | typeDefとTS型定義のフィールド差分検出 |
| `vue_prop_scan.cjs` | 全107 Vueファイルのプロパティ参照スキャン |

---

## DL-052 | typeDefinitionsData.ts 24列化・CellValue記号統一（2026-04-26）

**状態**: 実装完了

### 決定: CellValue記号を6種に刷新

| 記号 | 意味 | 用途 |
|---|---|---|
| `✅` | 初期設定 | このフェーズでフィールドの値を最初に設定する |
| `→` | 継承 | 前フェーズで設定された値がそのまま流れてくる |
| `✏️` | 更新 | 前フェーズの値を変更・上書きする |
| `🔧` | 未実装 | 設計上は必要だが未実装 |
| `⛔` | 不可 | この経路では物理的にデータが存在しない |
| `—` | 無関係 | このフェーズではこのフィールドに関与しない |

**なぜ刷新したか**: 旧方式（✅/🔧/⛔/—の4記号）では「前フェーズから継承」と「このフェーズで新規設定」の区別がつかず、データフローの追跡が不可能だった。`→`（継承）と`✏️`（更新）の追加により、フィールドがどこで生まれ、どこで変更され、どこまで到達するかが一目で分かるようになった。

### 決定: 18列→24列への拡張

旧方式の18列（6フェーズ × 3主体）から24列に拡張。

| # | グループ | AI列 | TS列 | 人間列 |
|---|---|---|---|---|
| 1 | アップロード独自 | uploadOwnAi | uploadOwnTs | uploadOwnHuman |
| 2 | アップロードDrive | uploadDriveAi | uploadDriveTs | uploadDriveHuman |
| 3 | 選別独自 | selectOwnAi | selectOwnTs | selectOwnHuman |
| 4 | 選別Drive | selectDriveAi | selectDriveTs | selectDriveHuman |
| 5 | 仕訳変換 | convertAi | convertTs | convertHuman |
| 6 | 科目確定 | accountAi | accountTs | accountHuman |
| 7 | 仕訳一覧 | journalAi | journalTs | journalHuman |
| 8 | 出力 | outMf | outCost | outStaffCount / outStaffTime |

+ 基本3列（field, label, tsType） + dataSource + note = 計29列

**なぜ拡張したか**: 独自アップロード経路とDrive経路ではデータフローが根本的に異なる（独自: classify API同期実行、Drive: migrationWorkerで非同期実行）。18列では両経路の区別が消えており、フィールドがどの経路で設定されるかの追跡が不可能だった。

### 実装ファイル

| ファイル | 変更内容 |
|---|---|
| [typeDefinitionsData.ts](file:///c:/dev/receipt-app/src/mocks/components/typeDefinitionsData.ts) | CellValue 6記号化、TypeField 24列化、全108フィールド値の再マッピング |
| [TypeDefinitionsPanel.vue](file:///c:/dev/receipt-app/src/mocks/components/TypeDefinitionsPanel.vue) | 3段ヘッダー構成（フェーズ名行 + AI名行 + AI/TS/人間行）、記号凡例刷新 |
| [MockSettingsPage.vue](file:///c:/dev/receipt-app/src/mocks/views/MockSettingsPage.vue) | activeTabの型を `string` → `'settings' | 'types' | 'prompts'` に強化 |

