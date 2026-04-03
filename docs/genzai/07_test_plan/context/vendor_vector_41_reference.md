# VendorVector 全66種 科目候補一覧（法人/個人別）— ACCOUNT_MASTER ID準拠

> STREAMED全業種分類を統合。66種に拡張（旧41種から25種追加）
> **全IDに日本語科目名を括弧付記**
> **TS層：プロパティ方式（`{ vector, expense: [...], income: [...] }`）**
> **DB層：列方式（`vector | direction | account`）前提**
> **flatten変換関数を先に作る（移行時ではなく今）**
> 更新: 2026-04-03 — source_type 11種再設計反映・Gemini責務境界確定・journal_inference不要判断

> ### vendor_vector の設計原則（2026-04-02 確定）
> **vendor_vectorはvendors_masterに人間が手動設定するフィールド。Geminiがリアルタイムに判定するものではない。**
> - vendors_global.ts / vendors_ldi.ts 等に `vendor_vector` フィールドを直接記述（マスタ照合）
> - 新規取引先でマスタに存在しない場合のみ → Gemini（画像の文脈・特徴語）でベクトル推定
> - **TSルールベース優先**: T番号→電話→名称のTS正規化マッチが優先。全て失敗した場合のみGemini
> - **型定義前テスト必須**: vendor特定4層の精度は T-P3 で実測確認してからT-07に着手する



---

## テスト戦略との連携（2026-03-30追加）

> **本文書の66種データは、Phase 1整合性チェック T-V1 で以下3項目が自動検証される。**

| 本文書のデータ | T-V1の対応assert | 検証内容 |
|---|---|---|
| 各ベクトルのexpense/income科目ID | `assert(allAccountsExist)` | 全IDがACCOUNT_MASTERに存在するか |
| 66種のうちexpense/incomeが空のもの | `assert(vectorHasExpenseOrIncome)` | unknownのincome以外は空でないか |
| 科目候補配列 | `assert(accountCandidates.length > 0)` | 候補が1つ以上あるか |

> **PipelineResult型との対応**: 本文書の「レベル」列が `PipelineResult.level`（`'A' | 'insufficient'`）に直結。
> 科目候補が1つ → `level: 'A'`（自動確定）、2つ以上 → `level: 'insufficient'`（人間判断）

---

## 設計決定（確定 — 2026-03-29 最終版）

| 項目 | 決定 |
|---|---|
| TS層（TypeScript層） | プロパティ方式（`{ vector, expense: [...], income: [...] }`） |
| DB層（Supabase） | 列方式（`vector \| direction \| account`） |
| 変換（flatten展開） | flatten関数を**先に**作る |
| 判定ルール | ①history_match（過去仕訳照合）→ ②レベルA一意確定 → ③それ以外insufficient（候補不足） |
| バリデーション（検証） | 2種のみ（`NEW_INDIVIDUAL_VENDOR`（初回個人取引先）+ `UNKNOWN_VENDOR`（取引先不明）） |
| voucherTypeRules（証票種類ルール） | **判定ルール + バリデーション兼用**（事後バリデーション専用ではない） |
| source_type（証票種類） | **11種**（自動7+手入力2+対象外2）→ **Gemini直接判定に確定（T-00k/T-P1完了）** |
| 税区分連動 | 科目確定 → ACCOUNT_MASTERの`default_tax_category`（デフォルト税区分）→ 税区分自動設定 |
| JournalPhase5Mock（仕訳モック型） | `source_type`（証票種類）, `direction`（証票向き）, `vendor_vector`（証票業種）**3フィールド追加** |
| 旧voucher_type（旧・証票意味） | **非推奨**（コメント付きで残す。将来削除） |
| is_credit_card_payment（クレカ払いフラグ） | **データとして残す**（CSV出力で使用。UI列は削除） |
| **journal_inference** | **不要の可能性大**（vendor_vector辞書引きで科目確定が可能。2026-04-03判断） |

## AIパイプラインフロー（2026-04-03 再設計）

```
Step 0: source_type判定（11種。Gemini直接判定。T-00k/T-P1完了 100%）
  → non_journal（仕訳対象外）→ 仕訳生成しない（即終了）
  → receipt / invoice_received / tax_payment / journal_voucher /
    bank_statement / credit_card / cash_ledger /
    invoice_issued / receipt_issued / other

Step 1: direction判定 + 貸方確定（Gemini直接判定。T-P1(v5) 100%）
  → expense（出金）/ income（入金）/ transfer（振替）/ mixed（混在）
  → source_type + direction → voucherTypeRulesで貸方確定

Step 2: ★ history_match（過去仕訳照合）★【TS完結・Gemini不要】
  → マッチあり → 過去と同じ科目+税区分で即確定（終了）
  → マッチなし → Step 3へ

Step 3: 取引先特定4層 + vendor_vector判定（66種）
  Layer 1: T番号マッチ（T+13桁完全一致）【TS完結】
  Layer 2: 電話番号マッチ（正規化後一致）【TS完結】
  Layer 3: 正規化取引先名マッチ【TS完結】
  Layer 4: Geminiフォールバック（vendor_vector 66種から推定）
  → vendor_vectorのexpense/incomeプロパティから科目候補取得

Step 4: 科目確定【TS完結】
  → レベルA（候補1つ）→ AI自動確定
  → insufficient（候補2つ以上）→ 人間がUIで選択
  → 科目確定 → ACCOUNT_MASTERのdefault_tax_categoryから税区分自動設定
```

> **journal_inference（Geminiに仕訳推論させる）は不要の可能性大。**
> vendor_vector × direction → industry_vector辞書 → 科目候補のTSルックアップで代替可能。（2026-04-03判断）

## source_type（証票種類 — 11種。再設計 2026-04-02）

| 値 | 日本語名 | 仕訳生成 | AI最初の判定 | 貸方確定 |
|---|---|---|---|---|
| `non_journal` | **仕訳対象外** | ❌ | **🔴 最優先** | — |
| `receipt` | 領収書 | ✅ | ✅ | `CASH`（現金）等 |
| `invoice_received` | 受取請求書 | ✅ | ✅ | `ACCOUNTS_PAYABLE`（買掛金）or `ACCRUED_EXPENSES`（未払金） |
| `tax_payment` | 納付書 | ✅ | ✅ | `ORDINARY_DEPOSIT`（普通預金）等 |
| `journal_voucher` | 振替伝票 | ✅ | ✅ | — |
| `bank_statement` | 通帳・銀行明細 | ✅ | ✅ | `ORDINARY_DEPOSIT`（普通預金）等 |
| `credit_card` | クレカ明細 | ✅ | ✅ | `ACCRUED_EXPENSES`（未払金） |
| `cash_ledger` | 現金出納帳 | ✅ | ✅ | `CASH`（現金） |
| `invoice_issued` | 発行請求書 | ✅（手入力） | ✅ | `ACCOUNTS_RECEIVABLE`（売掛金） |
| `receipt_issued` | 発行領収書 | ✅（手入力） | ✅ | `CASH`（現金） |
| `other` | その他 | ✅ | ✅ | — |

## 仕訳対象外（non_journal）定義（2026-03-31更新。合計18件）

### 既存6件

| 文書 | なぜ仕訳対象外か |
|---|---|
| 登記簿謄本 | 証明書。仕訳不要 |
| 返済予定表 | 参考資料。仕訳は引落時 |
| 見積書 | 取引未成立 |
| 名刺 | 参考資料 |
| メモ書き | 参考資料 |
| 契約書 | 参考資料 |

#### 追加6件

| 文書 | なぜ仕訳対象外か |
|---|---|
| 保険証券 | 保険契約の証明。仕訳は保険料支払時 |
| ふるさと納税証明書 | 個人の寄附金控除。法人経費ではない |
| 年金通知書 | 個人の年金情報。事業経費ではない |
| 確定申告書の控え | 過去の申告書。仕訳不要 |
| 届出書（税務署向け） | 届出行為自体に金銭取引なし |
| 委任状 | 代理権の証明。仕訳不要 |

#### ブラックリスト差分6件（document_filter設計より。H系証票）

| 文書 | なぜ仕訳対象外か |
|---|---|
| 料金表・価格表 | 参考資料。取引なし |
| カタログ・パンフレット | 販促物。仕訳不要 |
| 議事録 | 内部文書。仕訳不要 |
| 社内稟議書 | 承認文書。仕訳不要 |
| FAX送付状 | 送付連絡。仕訳不要 |
| 配送伝票（金額なし） | 配送記録。金額計上不要 |

> 合計 **18件**。
> Supabase移行時にマスタデータ化し、税理士がUIから追加・削除可能にする。
> コスト参照: [detailed_implementation_plan.md コスト実測データ](file:///C:/Users/kazen/.gemini/antigravity/brain/9c7321f6-2b13-443d-a4f2-c6531acd240a/detailed_implementation_plan.md)

### ガード関数（source_type.type.ts に実装済み 2026-04-02）

```typescript
export function isNonJournal(type: SourceType): boolean
export function getProcessingMode(type: SourceType): ProcessingMode
export function getSourceTypeLabel(type: SourceType): string
export function getDirectionLabel(dir: Direction): string
```

## 医療費3分岐（MEDICAL_TRIAGE）

#### 旧設計（3分岐）

| 分岐先 | source_type | 処理 | 典型例 |
|---|---|---|---|
| 仕訳しない | `non_journal` | 即終了 | 医療費控除対象の領収書 |
| 確定申告用 | `medical_certificate` | 仕訳生成 | 医療費証明書 |
| 通常経費 | `receipt` | 通常パイプライン | 健康診断費用（法人→WELFARE） |

#### 新設計（2026-03-31 コスト実測後に変更）

> 医療費領収書は**全て仕訳対象外**。UI上で「法人の場合は福利厚生費の可能性あり」という注意labelを付与して人間に判断させる。
> 理由: 1000件に1回の福利厚生費よりも、毎年大量発生する個人の医療費領収書を分別する方が価値が高い。仕訳対象外後は人間が処理。

## medical（医院）VV扱い

| 事業形態 | vendor_vector | 科目 | 備考 |
|---|---|---|---|
| 法人 | `medical`（#60） | `WELFARE`（福利厚生費） | 健康診断等。稀。注意label付与 |
| 個人事業主 | `medical`（#60） | `OWNER_DRAWING`（事業主貸） | 医療費控除の場合はnon_journal |

## document_filterとの関係（2026-04-02 T-00k完了後更新）

> VendorVectorは**Step 3**で使用。document_filter（Step 0）とは直接の関係はない。
> ただしNON_JOURNAL定義はdocument_filterの「仕訳対象外」判定に共有される。
>
> | 処理 | Step | 担当 |
> |---|---|---|
> | 仕訳対象 / 仕訳対象外の判定 | Step 0（document_filter） | Gemini直接判定（**T-00k完了。15/15=100%確認済み**） |
> | 証票向き（expense/income/transfer） | Step 1 | パイプラインロジック |
> | 過去仕訳照合 | Step 2 | history_match |
> | 業種ベクトル判定 | **Step 3（VendorVector）** | パイプラインロジック |
> | 科目確定 | Step 4 | ACCOUNT_MASTER照合 |

### T-00k テスト結果（2026-04-02）

| ラベル | 件数 | 分類正解率 | 証票種類正解率 | 前処理 | 平均処理時間 |
|---|---|---|---|---|---|
| draft_1（前処理なし） | 15/15 | **100%** | **100%** | なし | 18.0秒 |
| draft_2_with_preprocess | 15/15 | **100%** | **100%** | あり | **6.3秒** |

**確定事項**:
- TSキーワードマッチ不要（廃止確定）
- Gemini直接判定で100%正解
- 前処理（image_preprocessor.ts）でトークン18%削減・処理時間65%短縮
- image_preprocessor.ts: `src/scripts/pipeline/image_preprocessor.ts` ✅ 完了



## UI列変更（確定）

| 旧列 | 変更 | 新列 |
|---|---|---|
| 証票意味（voucher_type） | **削除**（3列に分解。バリデーション再設計） | — |
| クレ払い（creditCardPayment） | **削除**（証票種類で代替。`is_credit_card_payment`データは残す） | — |
| 証票（labelType） | **削除**（証票種類で代替） | — |
| — | **新規** | 証票種類（source_type） |
| — | **新規** | 証票向き（direction） |
| — | **新規** | 証票業種（vendor_vector） |

---

## 🍽️ 飲食（2種）

| # | 値 | 日本語名 | レベル | 法人expense | 個人expense | income | 状態 |
|---|---|---|---|---|---|---|---|
| 1 | `restaurant` | レストラン・居酒屋 | insufficient | `MEETING`（会議費）, `ENTERTAINMENT`（接待交際費） | 同左 | — | 既存 |
| 2 | `cafe` | カフェ・喫茶店 | **A** | `MEETING`（会議費） | `MEETING`（会議費） | — | 新規 |

## 🛒 小売（19種）

| # | 値 | 日本語名 | レベル | 法人expense | 個人expense | income | 状態 |
|---|---|---|---|---|---|---|---|
| 3 | `food_market` | 食品・食材・飲料 | insufficient | `MEETING`（会議費）, `PURCHASES_CORP`（仕入高） | `MEETING`（会議費）, `PURCHASES`（仕入高） | — | 新規 |
| 4 | `supermarket` | スーパー・デパート | insufficient | `SUPPLIES_CORP`（消耗品費）, `PURCHASES_CORP`（仕入高） | `SUPPLIES`（消耗品費）, `PURCHASES`（仕入高） | — | 新規 |
| 5 | `convenience_store` | コンビニ等 | insufficient | `SUPPLIES_CORP`（消耗品費）, `MEETING`（会議費） | `SUPPLIES`（消耗品費）, `MEETING`（会議費） | — | 既存 |
| 6 | `general_goods` | 雑貨・生活用品 | **A** | `SUPPLIES_CORP`（消耗品費） | `SUPPLIES`（消耗品費） | — | 新規 |
| 7 | `souvenir` | おみやげ | **A** | `ENTERTAINMENT`（接待交際費） | `ENTERTAINMENT`（接待交際費） | — | 新規 |
| 8 | `drugstore` | ドラッグストア | **A** | `SUPPLIES_CORP`（消耗品費） | `SUPPLIES`（消耗品費） | — | 既存 |
| 9 | `apparel` | 衣類・靴・カバン・小物 | **A** | `SUPPLIES_CORP`（消耗品費） | `SUPPLIES`（消耗品費） | — | 新規 |
| 10 | `cosmetics` | 化粧品類 | **A** | `SUPPLIES_CORP`（消耗品費） | `SUPPLIES`（消耗品費） | — | 新規 |
| 11 | `books` | 書籍 | **A** | `BOOKS_PERIODICALS`（新聞図書費） | `BOOKS_PERIODICALS`（新聞図書費） | — | 既存 |
| 12 | `electronics` | 家電量販店 | insufficient | `SUPPLIES_CORP`（消耗品費）, `FIXTURES_CORP`（器具備品）, `PURCHASES_CORP`（仕入高） | `SUPPLIES`（消耗品費）, `FIXTURES`（工具器具備品）, `PURCHASES`（仕入高） | — | 既存 |
| 13 | `bicycle` | 自転車販売 | **A** | `SUPPLIES_CORP`（消耗品費） | `SUPPLIES`（消耗品費） | — | 新規 |
| 14 | `sports_goods` | スポーツ用品 | **A** | `SUPPLIES_CORP`（消耗品費） | `SUPPLIES`（消耗品費） | — | 新規 |
| 15 | `media_disc` | CD・DVD販売 | **A** | `SUPPLIES_CORP`（消耗品費） | `SUPPLIES`（消耗品費） | — | 新規 |
| 16 | `jewelry` | 貴金属・アクセサリー・時計 | insufficient | `SUPPLIES_CORP`（消耗品費）, `ENTERTAINMENT`（接待交際費） | `SUPPLIES`（消耗品費）, `ENTERTAINMENT`（接待交際費） | — | 新規 |
| 17 | `florist` | 生花店 | **A** | `ENTERTAINMENT`（接待交際費） | `ENTERTAINMENT`（接待交際費） | — | 既存 |
| 18 | `auto_dealer` | 自動車バイク販売・修理 | insufficient | `VEHICLE_COSTS`（車両費）, `REPAIRS`（修繕費） | `VEHICLE_COSTS`（車両費）, `REPAIRS`（修繕費） | — | 既存 |
| 19 | `auto_parts` | 自動車バイク用品 | **A** | `VEHICLE_COSTS`（車両費） | `VEHICLE_COSTS`（車両費） | — | 新規 |
| 20 | `building_materials` | 建築材料販売 | **A** | `SUPPLIES_CORP`（消耗品費） | `SUPPLIES`（消耗品費） | — | 新規 |
| 21 | `stationery` | 文具 | **A** | `SUPPLIES_CORP`（消耗品費） | `SUPPLIES`（消耗品費） | — | 既存 |

## 🔧 サービス（19種）

| # | 値 | 日本語名 | レベル | 法人expense | 個人expense | income | 状態 |
|---|---|---|---|---|---|---|---|
| 22 | `beauty` | 美容・エステ・クリーニング | **A** | `WELFARE`（福利厚生費） | `WELFARE`（福利厚生費） | — | 既存 |
| 23 | `printing` | 印刷 | **A** | `ADVERTISING`（広告宣伝費） | `ADVERTISING`（広告宣伝費） | — | 既存 |
| 24 | `advertising` | 広告・マーケティング | **A** | `ADVERTISING`（広告宣伝費） | `ADVERTISING`（広告宣伝費） | — | 既存 |
| 25 | `post_office` | 郵便局 | insufficient | `COMMUNICATION`（通信費）, `FEES`（支払手数料）, `TAXES_DUES`（租税公課） | `COMMUNICATION`（通信費）, `FEES`（支払手数料）, `TAXES_DUES`（租税公課） | — | 新規 |
| 26 | `waste` | ゴミ処理・廃棄物 | **A** | `FEES`（支払手数料） | `FEES`（支払手数料） | — | 既存 |
| 27 | `it_service` | ITサービス | insufficient | `COMMUNICATION`（通信費）, `FEES`（支払手数料） | `COMMUNICATION`（通信費）, `FEES`（支払手数料） | — | 新規 |
| 28 | `telecom_saas` | 通信・SaaS | insufficient | `COMMUNICATION`（通信費）, `FEES`（支払手数料） | `COMMUNICATION`（通信費）, `FEES`（支払手数料） | — | 既存 |
| 29 | `education` | 研修・各種スクール | **A** | `TRAINING`（研修採用費） | `TRAINING`（研修採用費） | — | 既存 |
| 30 | `outsourcing` | アウトソーシング | **A** | `OUTSOURCING_CORP`（外注費） | `OUTSOURCING`（外注費） | — | 既存 |
| 31 | `lease_rental` | リース・レンタル | insufficient | `LEASE_CORP`（賃借料）, `LEASE`（リース料） | `LEASE`（リース料）, `LEASE_CORP`（賃借料） | — | 既存 |
| 32 | `staffing` | 人材派遣 | **A** | `OUTSOURCING_CORP`（外注費） | `OUTSOURCING_CORP`（外注費） | — | 新規 |
| 33 | `camera_dpe` | カメラ・DPE | **A** | `SUPPLIES_CORP`（消耗品費） | `SUPPLIES`（消耗品費） | — | 新規 |
| 34 | `funeral` | 仏壇・仏事 | **A** | `ENTERTAINMENT`（接待交際費） | `ENTERTAINMENT`（接待交際費） | — | 新規 |
| 35 | `platform` | プラットフォーム | insufficient | `FEES`（支払手数料）, `ADVERTISING`（広告宣伝費） | `FEES`（支払手数料）, `ADVERTISING`（広告宣伝費） | `SALES`（売上高） | 既存 |
| 36 | `ec_site` | ECサイト | insufficient | `SUPPLIES_CORP`（消耗品費）, `PURCHASES_CORP`（仕入高）, `ADVERTISING`（広告宣伝費） | `SUPPLIES`（消耗品費）, `PURCHASES`（仕入高）, `ADVERTISING`（広告宣伝費） | — | 既存 |
| 37 | `logistics` | 物流・運送 | **A** | `PACKING_SHIPPING`（荷造運賃） | `PACKING_SHIPPING`（荷造運賃） | — | 既存 |
| 38 | `consulting` | コンサルティング・顧問 | insufficient | `FEES`（支払手数料）, `OUTSOURCING_CORP`（外注費） | `FEES`（支払手数料）, `OUTSOURCING`（外注費） | — | 既存 |
| 39 | `legal_firm` | 士業（弁護士・税理士等） | **A** | `FEES`（支払手数料） | `FEES`（支払手数料） | — | 既存 |
| 40 | `construction` | 工事業・建設住宅 | **A** | `OUTSOURCING_CORP`（外注費） | `OUTSOURCING_CORP`（外注費） | — | 既存 |

## 🏢 不動産・保険（2種）

| # | 値 | 日本語名 | レベル | 法人expense | 個人expense | income | 状態 |
|---|---|---|---|---|---|---|---|
| 41 | `real_estate` | 不動産 | insufficient | `RENT`（地代家賃）, `REPAIRS`（修繕費） | `RENT`（地代家賃）, `REPAIRS`（修繕費） | 個人のみ：`RENTAL_INCOME`（賃貸料） | 既存 |
| 42 | `insurance` | 保険会社 | **A** | `INSURANCE_CORP`（保険料） | `INSURANCE`（損害保険料） | — | 既存 |

## 🎾 スポーツ・娯楽（5種）

| # | 値 | 日本語名 | レベル | 法人expense | 個人expense | income | 状態 |
|---|---|---|---|---|---|---|---|
| 43 | `entertainment` | ゴルフ場等 | insufficient | `ENTERTAINMENT`（接待交際費）, `WELFARE`（福利厚生費） | `ENTERTAINMENT`（接待交際費）, `WELFARE`（福利厚生費） | — | 既存 |
| 44 | `leisure` | 娯楽施設・スポーツ施設 | insufficient | `WELFARE`（福利厚生費）, `ENTERTAINMENT`（接待交際費） | `WELFARE`（福利厚生費）, `ENTERTAINMENT`（接待交際費） | — | 新規 |
| 45 | `cinema_music` | 映画・音楽 | **A** | `ENTERTAINMENT`（接待交際費） | `ENTERTAINMENT`（接待交際費） | — | 新規 |
| 46 | `spa` | 温泉・銭湯 | **A** | `WELFARE`（福利厚生費） | `WELFARE`（福利厚生費） | — | 新規 |
| 47 | `travel_agency` | 旅行代理店 | **A** | `TRAVEL`（旅費交通費） | `TRAVEL`（旅費交通費） | — | 既存 |

## 🚃 交通機関（9種）

| # | 値 | 日本語名 | レベル | 法人expense | 個人expense | income | 状態 |
|---|---|---|---|---|---|---|---|
| 48 | `gas_station` | ガソリンスタンド | **A** | `TRAVEL`（旅費交通費） | `TRAVEL`（旅費交通費） | — | 既存 |
| 49 | `taxi` | タクシー | **A** | `TRAVEL`（旅費交通費） | `TRAVEL`（旅費交通費） | — | 既存 |
| 50 | `rental_car` | レンタカー | **A** | `TRAVEL`（旅費交通費） | `TRAVEL`（旅費交通費） | — | 既存 |
| 51 | `train` | 電車 | **A** | `TRAVEL`（旅費交通費） | `TRAVEL`（旅費交通費） | — | 新規 |
| 52 | `bus` | バス | **A** | `TRAVEL`（旅費交通費） | `TRAVEL`（旅費交通費） | — | 新規 |
| 53 | `highway` | 有料道路 | **A** | `TRAVEL`（旅費交通費） | `TRAVEL`（旅費交通費） | — | 新規 |
| 54 | `airline_ship` | 飛行機・船 | **A** | `TRAVEL`（旅費交通費） | `TRAVEL`（旅費交通費） | — | 新規 |
| 55 | `parking` | 駐車場 | **A** | `TRAVEL`（旅費交通費） | `TRAVEL`（旅費交通費） | — | 既存 |
| 56 | `hotel` | ホテル等 | **A** | `TRAVEL`（旅費交通費） | `TRAVEL`（旅費交通費） | — | 既存 |

## 🏛️ 公共機関（5種）

| # | 値 | 日本語名 | レベル | 法人expense | 個人expense | income | 状態 |
|---|---|---|---|---|---|---|---|
| 57 | `utility` | 水道・ガス・電力 | **A** | `UTILITIES`（水道光熱費） | `UTILITIES`（水道光熱費） | — | 既存 |
| 58 | `government` | 官公庁・税金 | insufficient | `TAXES_DUES`（租税公課）, `FEES`（支払手数料）, `LEGAL_WELFARE`（法定福利費） | `TAXES_DUES`（租税公課）, `FEES`（支払手数料） | `SUBSIDY_INCOME`（補助金収入）, `MISC_INCOME_CORP`（雑収入） | 既存 |
| 59 | `social_insurance` | 社会保険 | **A** | `LEGAL_WELFARE`（法定福利費） | `LEGAL_WELFARE`（法定福利費） | — | 新規 |
| 60 | `medical` | 医院・病院 | **A** | `WELFARE`（福利厚生費） | `WELFARE`（福利厚生費） | — | 既存 |
| 61 | `religious` | 神社・教会等 | insufficient | `DONATIONS`（寄付金）, `MEMBERSHIP_FEES`（諸会費）, `FEES`（支払手数料） | `DONATIONS`（寄付金）, `MEMBERSHIP_FEES`（諸会費）, `FEES`（支払手数料） | — | 既存 |

## 💰 金融（1種）

| # | 値 | 日本語名 | レベル | 法人expense | 個人expense | income | 状態 |
|---|---|---|---|---|---|---|---|
| 62 | `financial` | 金融機関・銀行 | insufficient | `LONG_TERM_BORROWINGS`（長期借入金）, `INTEREST_EXPENSE`（支払利息）, `FEES`（支払手数料） | `INTEREST_DISCOUNT`（利子割引料）, `FEES`（支払手数料） | `LONG_TERM_BORROWINGS`（長期借入金）, `INTEREST_INCOME`（受取利息） | 既存 |

## 👤 個人・卸売・会費・不明（4種）

| # | 値 | 日本語名 | レベル | 法人expense | 個人expense | income（法人） | income（個人） | 状態 |
|---|---|---|---|---|---|---|---|---|
| 63 | `individual` | 個人名 | insufficient + `NEW_INDIVIDUAL_VENDOR`警告 | `OUTSOURCING_CORP`（外注費）, `SALARIES`（給料手当）, `OFFICER_COMPENSATION`（役員報酬）, `ADVANCE_PAID_CORP`（立替金）, `OFFICER_LOANS`（役員貸付金）, `TEMPORARY_PAYMENTS`（仮払金） | `OUTSOURCING`（外注費）, `WAGES`（給料賃金）, `ADVANCE_PAID`（立替金）, `OWNER_DRAWING`（事業主貸） | `SALES`（売上高）, `ADVANCE_PAID_CORP`（立替金）, `MISC_INCOME_CORP`（雑収入）, `OFFICER_BORROWINGS`（役員借入金）, `DEPOSITS_RECEIVED`（預り金） | `SALES`（売上高）, `ADVANCE_PAID`（立替金）, `MISC_INCOME`（雑収入）, `OWNER_INVESTMENT`（事業主借）, `DEPOSITS_RECEIVED`（預り金） | 既存 |
| 64 | `wholesale` | 卸売 | **A** | `PURCHASES_CORP`（仕入高） | `PURCHASES`（仕入高） | — | — | 既存 |
| 65 | `association` | 会費・親睦会 | insufficient | `MEMBERSHIP_FEES`（諸会費）, `ENTERTAINMENT`（接待交際費） | `MEMBERSHIP_FEES`（諸会費）, `ENTERTAINMENT`（接待交際費） | — | — | 既存 |
| 66 | `unknown` | 不明 | insufficient + `UNKNOWN_VENDOR`警告 | — | — | — | — | 既存 |

---

## 統計

| 項目 | 値 |
|---|---|
| 全種類 | **66種** |
| A 一意確定（法人） | **44種** |
| insufficient（法人） | **22種** |
| 法人/個人でレベルが変わるもの | **0種** |
| 入金パターンがあるもの | 6種（#35 `platform`、#41 `real_estate`、#58 `government`、#62 `financial`、#63 `individual`、#66 `unknown`） |
| 新規追加 | **25種** |
| バリデーション | 2種（`NEW_INDIVIDUAL_VENDOR`、`UNKNOWN_VENDOR`） |

---

## flatten変換関数（設計）

```typescript
// TS層 → DB層への変換
function flattenIndustryVector(entry: IndustryVectorEntry): FlatRow[] {
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
  ]
}
```

## バリデーション（2種のみ）

| バリデーション名 | トリガー条件 | UIメッセージ |
|---|---|---|
| `NEW_INDIVIDUAL_VENDOR`（初回個人取引先） | `individual`（個人名）+ confirmed_journals（過去仕訳）なし | ⚠️ 初回の個人取引先です。科目を判断してください |
| `UNKNOWN_VENDOR`（取引先不明） | 取引先特定失敗 or `unknown`（不明） | ⚠️ 取引先が特定できません |
