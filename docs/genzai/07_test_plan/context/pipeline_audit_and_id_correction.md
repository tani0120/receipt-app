# パイプライン監査 + ID完全置換 + 設計決定（テスト戦略統合版）

> 作成日: 2026-03-29
> 更新日: **2026-04-04**（T-P4完了（目的変更：line_items[]抽出精度確認）・N:N統一設計確定・LineItem v1設計確定・2段階型確定方針確定）
> 目的: ACCOUNT_MASTERの既存IDとパイプライン設計のIDの完全突合
> **全IDに日本語科目名を括弧付記**
>
> ## 確定設計決定（2026-04-04 最新版）
> | 項目 | 決定 |
> |---|---|
> | TS層（TypeScript層） | プロパティ方式（`{ vector, expense: [...], income: [...] }`） |
> | DB層（Supabase） | 列方式（`vector \| direction \| account`）前提 |
> | 変換（flatten展開） | flatten関数を先に作る |
> | 判定ルール | ①history_match（過去仕訳照合）→ ②レベルA一意確定 → ③それ以外insufficient（候補不足） |
> | バリデーション（検証） | 2種のみ（`NEW_INDIVIDUAL_VENDOR`（初回個人取引先）+ `UNKNOWN_VENDOR`（取引先不明）） |
> | voucherTypeRules（証票種類ルール） | **判定ルール + バリデーション兼用** |
> | source_type（証票種類） | **11種**（自動7+手入力2+対象外2）→ **Gemini直接判定に確定（T-00k/T-P1完了）** |
> | ProcessingMode（処理区分） | auto/manual/excluded — source_typeからルックアップ1回で導出 |
> | CSV/エクセル | 前処理で弾く（sugusuruでは処理しない。MF側で処理） |
> | VendorVector（業種ベクトル） | **66種**（STREAMED全分類統合済み） |
> | パイプライン | Step 0: source_type（証票種類）→1→**2:history_match（過去仕訳照合）**→3→4 |
> | UI列変更 | 証票意味/クレ払い/証票 **削除** → 証票種類/仕訳方向/証票業種 **追加** |
> | 税区分連動 | 科目確定 → ACCOUNT_MASTERの`default_tax_category`（デフォルト税区分）→ 税区分自動設定 |
> | JournalPhase5Mock（仕訳モック型） | `source_type`（証票種類）, `direction`（仕訳方向）, `vendor_vector`（証票業種）**3フィールド追加** |
> | 旧voucher_type（旧・証票意味） | **非推奨**（コメント付きで残す。将来削除） |
> | is_credit_card_payment（クレカ払いフラグ） | **データとして残す**（CSV出力用。UI列は削除） |
> | 仕訳対象外 | 謄本、返済予定表、見積書、名刺、メモ書き、契約書 **→拡充済み18件（医療費3件含む）** |
> | 医療費 | **全て仕訳対象外**（MEDICAL_TRIAGE削除。取りこぼしはdrive-select UIで再判定可能） |
> | medical VV（医院ベクトル） | 法人=`WELFARE`（福利厚生費）/ 個人=`OWNER_DRAWING`（事業主貸） |
> | **実装方式原則** | **TSルールベース優先（安定性最優先）。Geminiは実装コスト高・画像文脈理解が必要な場合のみ** |
> | **型定義前テスト** | **Gemini採用箇所は型定義前にプロトタイプで出力形式確認必須（T-P1/T-P3/T-P4）** |
> | **N:N統一設計** | **全source_typeで`line_items[]`を使用。1:N/N:N分岐なし（2026-04-04確定）** |
> | **LineItem v1** | **date/description/amount/direction/balance/line_index の6フィールド（T-P4実測根拠）** |
> | **ReceiptItem/LineItem** | **分離維持。ReceiptItemはquantity/unit_price/tax_rateを持つ別型** |
> | **日付フォーマット** | **Gemini出力はYYYY-MM-DD維持。toMfCsvDate()でMF出力時に変換（変換レイヤー実装済み）** |
> | **旧classiy_schema.ts LineItem** | **@deprecated。debit_account/credit_accountはT-P4実測と乖離。line_item.type.tsへ移行** |



---

## テスト戦略との連携（2026-03-30追加）

> **本文書の監査結果（科目ID突合）は、Phase 1整合性チェック T-V1 の `assert(allAccountsExist)` で自動検証される。**
> 手動監査の結果をコードで再現し、データ追加・修正時にリグレッションを防止する。

| 本文書の監査 | T-V1の対応assert |
|---|---|
| 科目IDがACCOUNT_MASTERに存在するか | `assert(allAccountsExist)` |
| 法人用IDに個人専用IDが混入していないか | `assert(noDuplicateKeys)` の一部 |
| 科目候補が空でないか | `assert(accountCandidates.length > 0)` |

---

## 1. パイプライン関連ファイル全量マップ

### 既存ファイル（今動いている）

| ファイル | 用途 | パイプラインとの関係 |
|---|---|---|
| `src/domain/types/journal.ts` | ドメイン型（AccountCode 30種、JournalEntryLine等） | パイプラインの科目IDはここのAccountCodeとACCOUNT_MASTERの両方を参照 |
| `src/shared/types/account.ts` | Account型（id, name, target等） | パイプラインの科目候補はこのid |
| `src/shared/types/tax-category.ts` | TaxCategory型 | パイプラインのtax_categoryはこのid |
| `src/shared/data/account-master.ts` | 全勘定科目マスタ（ACCOUNT_MASTER定数、約160件） | **パイプラインのaccount_codeはここから取る** |
| `src/mocks/types/journal_phase5_mock.type.ts` | UI表示用仕訳型（JournalPhase5Mock） | パイプラインの出力先 |
| `src/mocks/data/journal_test_fixture_30cases.ts` | 既存テストデータ（35件、client_id='LDI-00008'） | Step 6で各社データに置き換え |
| `src/mocks/composables/useJournals.ts` | 仕訳データCRUD | パイプライン出力をUIに渡すゲートウェイ |
| `src/mocks/utils/exportMfCsv.ts` | MF CSV出力 | パイプラインの最終出力 |
| `src/mocks/utils/journalWarningSync.ts` | バリデーション警告計算 | NEW_INDIVIDUAL_VENDORはここに追加 |
| `src/mocks/utils/voucherTypeRules.ts` | 証憑種別バリデーション | パイプラインとは独立 |
| `src/mocks/components/JournalListLevel3Mock.vue` | 仕訳一覧UI（232KB） | パイプライン出力の表示先 |
| `src/features/account-settings/composables/useAccountSettings.ts` | 勘定科目・税区分設定 | パイプラインの科目名解決に使用 |

### 新規作成ファイル（これから作る）

| ファイル | 用途 | 状態 |
|---|---|---|
| `src/mocks/types/pipeline/source_type.type.ts` | SourceType 11種 + Direction 4種 + ProcessingMode 3種 + PROCESSING_MODE_MAP | ✅ **完了（2026-04-02）** |
| `src/mocks/types/pipeline/vendor.type.ts` | VendorVector **66種** + Vendor型 + IndustryVectorEntry先行定義 | ✅ **完了（2026-04-02）** |
| `src/mocks/types/pipeline/line_item.type.ts` | **LineItem v1型**（6フィールド + 科目候補フィールド群。N:N統一。T-P4実測根拠）★2026-04-05完了 | ✅ **完了（2026-04-05）** |
| `src/mocks/types/pipeline/confirmed_journal.type.ts` | ConfirmedJournal型 | ⬜ 未着手 |
| `src/mocks/types/pipeline/industry_vector.type.ts` | IndustryVectorEntry型（vendor.type.tsから分離予定） | ⬜ 未着手 |
| `src/mocks/types/pipeline/pipeline_result.type.ts` | **PipelineResult型**（契約v1.0。processing_modeフィールド追加） | ✅ **完了（2026-04-02）** |
| `src/mocks/types/pipeline/vendor_alias.type.ts` | VendorAlias型 | ⬜ 未着手 |
| `src/mocks/types/pipeline/vendor_keyword.type.ts` | VendorKeyword型 | ⬜ 未着手 |
| ~~`src/mocks/types/pipeline/validation.ts`~~ → `src/mocks/utils/pipeline/validation.ts` | `isValidTNumber()` / `normalizePhoneNumber()` / `normalizeTNumber()` | ✅ **完了（2026-04-05）**（配置先修正済み） |
| `src/mocks/data/pipeline/industry_vector_corporate.ts` | 法人用辞書 | ✅ **完了（2026-04-03）** |
| `src/mocks/data/pipeline/industry_vector_sole.ts` | 個人用辞書 | ✅ **完了（2026-04-03）** |
| `src/mocks/data/pipeline/vendors_global.ts` | 全社共通取引先 | ⬜ 未着手 |
| `src/mocks/data/pipeline/vendors_ldi.ts` | LDI社取引先 | ⬜ 未着手 |
| `src/mocks/data/pipeline/vendors_abc.ts` | ABC社取引先 | ⬜ 未着手 |
| `src/mocks/data/pipeline/vendors_ghi.ts` | GHI社取引先 | ⬜ 未着手 |
| `src/mocks/data/pipeline/confirmed_journals_ldi.ts` | LDI社過去仕訳 | ⬜ 未着手 |
| `src/mocks/data/pipeline/confirmed_journals_abc.ts` | ABC社過去仕訳 | ⬜ 未着手 |
| `src/mocks/data/pipeline/confirmed_journals_ghi.ts` | GHI社過去仕訳 | ⬜ 未着手 |
| `src/mocks/types/pipeline/document_filter.type.ts` | document_filter型（T-00k結果確定後） | ✅ **T-00k完了（不要と判定）** |
| `docs/genzai/07_test_plan/scripts/document_filter_test.ts` | document_filterテストスクリプト（T-00i） | ✅ **完了（2026-04-02）** |

---

## 2. 科目ID完全置換表（パイプライン → ACCOUNT_MASTER）

### ■ 共通科目（target='both'）— 法人/個人で同じID

| パイプラインで使用中 | ACCOUNT_MASTER正式ID | 日本語名 | 状態 |
|---|---|---|---|
| TRAVEL | `TRAVEL` | 旅費交通費 | ✅ 一致 |
| COMMUNICATION | `COMMUNICATION` | 通信費 | ✅ 一致 |
| MEETING | `MEETING` | 会議費 | ✅ 一致 |
| ENTERTAINMENT | `ENTERTAINMENT` | 接待交際費 | ✅ 一致 |
| RENT | `RENT` | 地代家賃 | ✅ 一致 |
| UTILITIES | `UTILITIES` | 水道光熱費 | ✅ 一致 |
| WELFARE | `WELFARE` | 福利厚生費 | ✅ 一致 |
| LEGAL_WELFARE | `LEGAL_WELFARE` | 法定福利費 | ✅ 一致 |
| ADVERTISING | `ADVERTISING` | 広告宣伝費 | ✅ 一致 |
| REPAIRS | `REPAIRS` | 修繕費 | ✅ 一致 |
| MISCELLANEOUS | `MISCELLANEOUS` | 雑費 | ✅ 一致 |
| TAXES_DUES | `TAXES_DUES` | 租税公課 | ✅ 一致 |
| VEHICLE_COSTS | `VEHICLE_COSTS` | 車両費 | ✅ 一致 |
| CASH | `CASH` | 現金 | ✅ 一致 |
| ORDINARY_DEPOSIT | `ORDINARY_DEPOSIT` | 普通預金 | ✅ 一致 |
| SALES | `SALES` | 売上高 | ✅ 一致 |
| ACCOUNTS_RECEIVABLE | `ACCOUNTS_RECEIVABLE` | 売掛金 | ✅ 一致 |
| ACCOUNTS_PAYABLE | `ACCOUNTS_PAYABLE` | 買掛金 | ✅ 一致 |
| ACCRUED_EXPENSES | `ACCRUED_EXPENSES` | 未払金 | ✅ 一致 |
| TEMPORARY_PAYMENTS | `TEMPORARY_PAYMENTS` | 仮払金 | ✅ 一致 |
| DEPOSITS_RECEIVED | `DEPOSITS_RECEIVED` | 預り金 | ✅ 一致 |
| PACKING_SHIPPING | `PACKING_SHIPPING` | 荷造運賃 | ✅ 一致 |
| BOOKS_PERIODICALS | `BOOKS_PERIODICALS` | 新聞図書費 | ✅ 一致 |
| FEES | `FEES` | 支払手数料 | ✅ 一致 |
| LEASE | `LEASE` | リース料 | ✅ 一致（個人/共通） |

### ■ 法人専用科目（target='corp'）

| パイプラインで使用中 | ACCOUNT_MASTER正式ID | 日本語名 | 状態 |
|---|---|---|---|
| OUTSOURCING（計画書） | **`OUTSOURCING_CORP`** | 外注費 | ❌ **修正済** |
| SUPPLIES（計画書） | **`SUPPLIES_CORP`** | 消耗品費 | ❌ **修正済** |
| PURCHASES（計画書） | **`PURCHASES_CORP`** | 仕入高 | ❌ **修正済** |
| SALARY（計画書） | **`SALARIES`** | 給料手当 | ❌ **修正済** |
| SERVICE_FEES（計画書） | **`FEES`** | 支払手数料 | ❌ **修正済（FEESに統一）** |
| BANK_FEES（計画書） | **`FEES`** | 支払手数料 | ❌ **修正済（FEESに統一）** |
| PACKING_FREIGHT（計画書） | **`PACKING_SHIPPING`** | 荷造運賃 | ❌ **修正済** |
| OFFICER_COMPENSATION | `OFFICER_COMPENSATION` | 役員報酬 | ✅ 一致 |
| OFFICER_BORROWINGS | `OFFICER_BORROWINGS` | 役員借入金 | ✅ 一致 |
| OFFICER_LOANS | `OFFICER_LOANS` | 役員貸付金 | ✅ 追加済み |
| INSURANCE_CORP | `INSURANCE_CORP` | 保険料 | ✅ 一致 |
| LEASE_CORP | `LEASE_CORP` | 賃借料 | ✅ 一致 |
| MISC_INCOME_CORP | `MISC_INCOME_CORP` | 雑収入 | ✅ 一致 |
| FIXTURES_CORP | `FIXTURES_CORP` | 器具備品 | ✅ 一致 |
| MEMBERSHIP_FEES | `MEMBERSHIP_FEES` | 諸会費 | ✅ 一致 |
| DONATIONS | `DONATIONS` | 寄付金 | ✅ 一致 |
| TRAINING | `TRAINING` | 研修採用費 | ✅ 一致 |
| COMMUTING | `COMMUTING` | 通勤費 | ✅ 一致 |

### ■ 個人専用科目（target='individual'）

| パイプラインで使用中 | ACCOUNT_MASTER正式ID | 日本語名 | 状態 |
|---|---|---|---|
| OWNER_WITHDRAWAL（計画書） | **`OWNER_DRAWING`** | 事業主貸 | ❌ **修正済** |
| OWNER_DEPOSIT（計画書） | **`OWNER_INVESTMENT`** | 事業主借 | ❌ **修正済** |
| RENT_INCOME（計画書） | **`RENTAL_INCOME`** | 賃貸料(不動産) | ❌ **修正済** |
| OUTSOURCING（個人） | `OUTSOURCING` | 外注工賃 | ✅ 一致 |
| SUPPLIES（個人） | `SUPPLIES` | 消耗品費 | ✅ 一致 |
| PURCHASES（個人） | `PURCHASES` | 仕入高 | ✅ 一致 |
| WAGES（個人） | `WAGES` | 給料賃金 | ✅ 一致 |
| INSURANCE（個人） | `INSURANCE` | 損害保険料 | ✅ 一致 |
| MISC_INCOME（個人） | `MISC_INCOME` | 雑収入 | ✅ 一致 |
| FIXTURES（個人） | `FIXTURES` | 工具器具備品 | ✅ 一致 |
| INTEREST_DISCOUNT | `INTEREST_DISCOUNT` | 利子割引料 | ✅ 一致 |

### ■ 修正箇所まとめ（全16箇所 → 全て修正済）

| 場所 | 旧ID | 新ID（日本語名） | 理由 |
|---|---|---|---|
| LDI confirmed_journals #8-#12 | `SERVICE_FEES` | `FEES`（支払手数料） | ACCOUNT_MASTERのIDは`FEES` |
| LDI confirmed_journals #32-#36 | `SUPPLIES` | `SUPPLIES_CORP`（消耗品費） | LDI=法人 |
| LDI confirmed_journals #37-#40 | `OUTSOURCING` | `OUTSOURCING_CORP`（外注費） | LDI=法人 |
| LDI confirmed_journals #50 | `MISC_INCOME` | `MISC_INCOME_CORP`（雑収入） | LDI=法人 |
| ABC confirmed_journals 丸山食品 | `PURCHASES` | `PURCHASES_CORP`（仕入高） | ABC=法人 |
| ABC confirmed_journals 佐川 | `PACKING_FREIGHT` | `PACKING_SHIPPING`（荷造運賃） | ID誤り |
| ABC confirmed_journals 佐川変更後 | `OUTSOURCING` | `OUTSOURCING_CORP`（外注費） | ABC=法人 |
| ABC confirmed_journals Amazon | `PURCHASES` | `PURCHASES_CORP`（仕入高） | ABC=法人 |
| ABC confirmed_journals 鈴木 | `SALARY` | `SALARIES`（給料手当） | 法人の給料手当 |
| ABC confirmed_journals 三菱UFJ | `BANK_FEES` | `FEES`（支払手数料） | ACCOUNT_MASTERのIDは`FEES` |
| GHI confirmed_journals 佐々木 | `RENT_INCOME` | `RENTAL_INCOME`（賃貸料） | ID誤り |
| vendor_vector #5 法人出金 | 立替清算 | `ADVANCE_PAID_CORP`（立替金） | IDに統一 |
| vendor_vector #5 個人出金 | 立替清算 | `ADVANCE_PAID`（立替金） | IDに統一 |
| vendor_vector #5 法人出金 | 役員貸付金 | `OFFICER_LOANS`（役員貸付金） | IDに統一 |
| vendor_vector #5 入金法人 | 役員借入金 | `OFFICER_BORROWINGS`（役員借入金） | IDに統一 |
| vendor_vector #3 | 燃料費 | `VEHICLE_COSTS`（車両費） | MFに燃料費は存在しない |

---

## 3. VendorVector 66種 判定ルール

### ■ 判定レベル定義（簡素化）

| レベル | 意味 | 処理 |
|---|---|---|
| **A: 一意確定** | 科目候補が1つ。迷わない | AI自動確定 |
| **insufficient** | 科目候補が2つ以上 | 人間がUIで科目候補から選択 |

> **廃止**: 旧レベルB（金額・摘要分岐）、C（history_match必須）、D（insufficient確定）を**Aとinsufficientの2値に簡素化**

### ■ 統計

| レベル | 件数 | 割合 |
|---|---|---|
| A: 一意確定 | **44種** | 67% |
| insufficient | **22種** | 33% |
| 合計 | **66種** | 100% |

> 詳細は vendor_vector_41_reference.md（66種拡張済み）参照

### ■ バリデーション（2種のみ）

| バリデーション名 | トリガー条件 | UIメッセージ |
|---|---|---|
| `NEW_INDIVIDUAL_VENDOR`（初回個人取引先） | `individual`（個人名）+ confirmed_journals（過去仕訳）なし | ⚠️ 初回の個人取引先です。科目を判断してください |
| `UNKNOWN_VENDOR`（取引先不明） | 取引先特定失敗 or `unknown`（不明） | ⚠️ 取引先が特定できません |

> **廃止**: `AMOUNT_BASED_SPLIT`（金額分岐）×2、`NEW_EC_PURCHASE`（EC初回購入）→ 全て人間判断

---

## 4. 次のアクション

> 最終更新: 2026-04-04（セッション bd8b5ef7）

### Gemini責務境界（2026-04-04 更新）

> **Geminiは「目」。TSは「電卓」。**

| Gemini責務 | テスト | 精度 |
|---|---|---|
| ① source_type（11種） | ✅ 100% | T-00k/T-P1 |
| ② direction（4種） | ✅ 100% | T-P1(v5: 28/28) |
| ③ line_items[]抽出（通帳/クレカ） | ✅ 100% | **T-P4完了（2026-04-03）通帳23行・クレカ6行** |
| ④ vendor_vector（66種）— 新規取引先のみ | ❌ 未テスト | T-P3 ★最優先 |
| ⑤ OCR読取（最小限: 日付/金額/取引先名/T番号） | 🔶 旧実験のみ | Phase A-2 |

> **journal_inference（Geminiに仕訳推論させる）は不要。**
> vendor_vector × direction → industry_vector辞書 → 科目候補のTSルックアップで代替確定。

### 取引先特定4層（照合順序 — 2026-04-03確定）

| Layer | 方法 | Gemini？ |
|---|---|---|
| 1 | T番号マッチ（T+13桁完全一致） | 不要 |
| 2 | 電話番号マッチ（正規化後一致） | 不要 |
| 3 | 正規化取引先名マッチ | 不要 |
| 4 | Geminiフォールバック（vendor_vector推定） | 必要 |

- [x] ① `implementation_plan.md` 廃止マーク追加
- [x] ② `detailed_implementation_plan.md` 科目ID全面修正（16箇所）+ 日本語付記
- [x] ③ `vendor_vector_41_reference.md` 66種拡張
- [x] ④ `task_list.md` 同期更新（★2026-03-30 Tier別再整理完了）
- [x] ⑤ 設計決定最終版
- [x] ⑥ テスト戦略統合（Phase分離 + 整合性チェック4種 + PipelineResult型 + Group分け）★2026-03-30追加
- [x] ⑦ JournalPhase5Mock型に `source_type`, `direction`, `vendor_vector` フィールド追加 ← 完了（2026-04-02）
- [ ] ⑧ journalColumns.ts 列変更（3列削除+3列追加）← Step 6に移動
- [ ] ⑨ voucherTypeRules.ts 再設計（判定+バリデーション兼用）← Step 6に移動
- [x] ⑩ Step 0 型定義ファイル作成 — **7/9完了** ★2026-04-04更新
  - [x] `pipeline_result.type.ts`（契約 v1.0。processing_modeフィールド追加）
  - [x] `source_type.type.ts`（SourceType 11種 + Direction 4種 + ProcessingMode + PROCESSING_MODE_MAP）← **再設計完了（2026-04-02）**
  - [x] `vendor.type.ts`（VendorVector 66種 + Vendor型 + IndustryVectorEntry先行定義）← **2026-04-02完了**
  - [x] `line_item.type.ts`（LineItem v1: 6フィールド + 科目候補フィールド群。N:N統一設計）← **T-LI1: 完了（2026-04-05）**
  - [ ] `confirmed_journal.type.ts`
  - [ ] `industry_vector.type.ts`（vendor.type.tsから分離予定）
  - [ ] `vendor_alias.type.ts`
  - [ ] `vendor_keyword.type.ts`
  - [x] `validation.ts` → `src/mocks/utils/pipeline/validation.ts`（配置先修正済み）← **完了（2026-04-05）**
- [x] ⑪ 不足事項の実施（2026-04-04更新）
  - [x] **T-00i: テストスクリプト整備** ← 完了（2026-04-02。11種再設計済み）
  - [x] **T-00j: 実物証票資料の用意** ← 初回完了（2026-04-02。19件。追加8件未配置）
  - [x] **T-00k: document_filterテスト実行** ← 完了（15/15=100%。前処理あり6.3秒/枚）
  - [x] **T-P1: direction先行テスト** ← 完了（direction_v5: 28/28=100%。事業者フル情報+用途限定）
  - [x] **T-P4: line_items[]抽出精度確認** ← 完了（2026-04-03。通帳23行・クレカ6行で全5フィールド100%。LineItem v1根拠確定）
  - [x] ガード関数追加（isNonJournal, getProcessingMode）→ T-00a再設計時に実施済み
  - [x] NON_JOURNAL_EXAMPLES拡充（6件→18件。医療費3件含む）→ T-00a再設計時に実施済み
  - [x] **T-LI1: LineItem v1型定義** ← **完了（2026-04-05）**
  - [ ] **T-P3: 取引先特定4層OCR精度確認** ← ★最優先（T-LI1完了後）
  - [ ] パイプライン接続ロジック → Phase 2 Group 1
  - [ ] テストデータ3フィールド追加 → T-00f
  - [ ] NON_JOURNALマスタデータ化 → Supabase移行時

### 追加完了ファイル（2026-04-04 更新）

| ファイル | 内容 | 完了日 |
|---|---|---|
| `src/scripts/pipeline/image_preprocessor.ts` | 画像前処理（リサイズ・EXIF回転・コントラスト補正） | 2026-04-02 |
| `src/mocks/types/pipeline/vendor.type.ts` | T-01+T-02+T-04先行実装 | 2026-04-02 |
| `src/mocks/utils/pipeline/vendorIdentification.ts` | T-N1a: T番号抽出・検証 / T-N1b: 電話番号正規化 / T-N1c: 取引先名正規化スケルトン | 2026-04-03 |
| `src/mocks/data/pipeline/industry_vector_corporate.ts` | T-06a: 法人用業種ベクトル辞書（66種） | 2026-04-03 |
| `src/mocks/data/pipeline/industry_vector_sole.ts` | T-06b: 個人事業主用業種ベクトル辞書（66種） | 2026-04-03 |
| `src/mocks/types/pipeline/line_item.type.ts` | **T-LI1: LineItem v1型（6フィールド + 科目候補フィールド群。N:N統一）** | **2026-04-05** |
| `src/mocks/types/pipeline/non_vendor.type.ts` | NonVendorType 24種（銀行9/クレカ7/人間判断8）+ TaxPaymentType 5種 | 2026-04-05 |
| `src/mocks/data/pipeline/non_vendor_account_corporate.ts` | 法人用取引先外科目候補マップ（26エントリ） | 2026-04-05 |
| `src/mocks/data/pipeline/non_vendor_account_sole.ts` | 個人事業主用取引先外科目候補マップ（26エントリ） | 2026-04-05 |
| `src/mocks/utils/lineItemToJournalMock.ts` | COUNTERPART_ACCOUNT_MAP（相手勘定マップ）+ lineItemToJournalMock()変換関数 | 2026-04-05 |
| `src/mocks/utils/pipeline/validation.ts` | E-1: isValidTNumber() / E-2: normalizePhoneNumber() / E-3: normalizeTNumber() | 2026-04-05 |

---

## 5. Phase 1 型基盤構築 検証結果（2026-03-30追加）

| 指標 | 開始時 | 完了時 | 変化 |
|---|---|---|---|
| type-check エラー | 138件 | **90件** | **-48件 (35%↓)** |
| ESLint エラー | 複数 | **0件** | クリーン |
| 修正ファイル数 | — | **20ファイル** | — |
| 新規ファイル数 | — | **2ファイル** | pipeline_result + source_type |

### 設計文書との整合性

| 検証項目 | 結果 |
|---|---|
| source_type.type.ts ↔ vendor_vector_41_reference.md | ✅ 完全一致 |
| pipeline_result.type.ts ↔ detailed_implementation_plan.md L57-69 | ✅ 完全一致 |
| 型エラー削減 ↔ task_list.md | ✅ 完全一致 |
| 不一致 | **0件** |

---

## 6. コスト実測要約（2026-03-31追記）

> 詳細: [detailed_implementation_plan.md コスト実測データ](file:///C:/Users/kazen/.gemini/antigravity/brain/9c7321f6-2b13-443d-a4f2-c6531acd240a/detailed_implementation_plan.md)

| 項目 | 値 |
|---|---|
| Run A テスト（18件） | 総コスト 27.5円 |
| **1枚平均** | **1.53円（Gemini）+ 0.23円（OCR）= 1.8円** |
| Phase A見積り | 7-9円/枚（OCR=5円が22倍過大） |
| 15円/枚制約 | **大幅に下回る** |
| 結論 | 全件Gemini処理でもコスト無視可能。document_filterの価値は品質管理 |

