# STREAMED vs 本システム マスタ調査比較表（全量版）

> 調査日: 2026-03-25
> ソース: STREAMEDヘルプ（help/8090, help/8369, help/950, help/8941）+ ネット検索のみ
> **mdファイル・MF CSVは参照していない**
> **移動元**: brain/9c9a1fc9 `streamed_master_comparison.md`（2026-03-25作成）
> **最終更新**: 2026-03-29（利子割引料税区分修正。減価償却費・利子割引料・法定福利費の3件全て確定）

---

## 1. 税区分マスタ比較

### 1-1. STREAMED初期設定の税区分（15件）

STREAMED公式ヘルプ（help/8090, help/8369）から確定した初期設定の税区分。これ以外は手動追加が必要。

| # | STREAMEDの税区分 | 本システム概念ID | 存在 | STREAMEDでの用途 |
|---|-----------------|-----------------|:---:|-----------------| 
| 1 | 課税仕入10% | `PURCHASE_TAXABLE_10` | ✅ | 自動判定(仕入)の判定先 |
| 2 | 課税仕入8% | `PURCHASE_TAXABLE_8` | ✅ | 自動判定(仕入)の判定先 |
| 3 | 課税仕入(軽)8% | `PURCHASE_REDUCED_8` | ✅ | 自動判定(仕入)の判定先 |
| 4 | 非課税仕入 | `PURCHASE_NON_TAXABLE` | ✅ | 自動判定(仕入)の判定先 |
| 5 | 課税売上10% | `SALES_TAXABLE_10` | ✅ | 自動判定(売上)の判定先 |
| 6 | 課税売上8% | `SALES_TAXABLE_8` | ✅ | 自動判定(売上)の判定先 |
| 7 | 課税売上(軽)8% | `SALES_REDUCED_8` | ✅ | 自動判定(売上)の判定先 |
| 8 | 非課税売上 | `SALES_NON_TAXABLE` | ✅ | 自動判定(売上)の判定先 |
| 9 | 課税売上貸倒10% | `SALES_BAD_DEBT_10` | ✅ | 自動判定(売上貸倒)の判定先 |
| 10 | 課税売上貸倒8% | `SALES_BAD_DEBT_8` | ✅ | 自動判定(売上貸倒)の判定先 |
| 11 | 課税売上貸倒(軽)8% | `SALES_BAD_DEBT_REDUCED_8` | ✅ | 自動判定(売上貸倒)の判定先 |
| 12 | 対象外 | `COMMON_EXEMPT` | ✅ | BS科目・不課税取引 |
| 13 | 自動判定(仕入) | （設計概念） | ✅ | `taxDetermination: 'auto'` |
| 14 | 自動判定(売上) | （設計概念） | ✅ | `taxDetermination: 'auto'` |
| 15 | 自動判定(売上貸倒) | （設計概念） | ✅ | `taxDetermination: 'auto'` |

### 1-2. STREAMEDの初期設定に含まれない税区分（help/8090 FAQで明記）

| 税区分 | 本システム概念ID | 本システムに存在 | 備考 |
|--------|-----------------|:---:|------|
| 対象外仕入 | `PURCHASE_EXEMPT` | ✅ | STREAMED初期設定にない。MFのみに存在 |
| 対象外売上 | `SALES_EXEMPT` | ✅ | STREAMED初期設定にない |
| 簡易課税の税区分 | `*_T1`〜`*_T6`系 | ✅ | STREAMED初期設定にない。手動追加要 |
| 共通対応仕入 | `PURCHASE_COMMON_*`系 | ✅ | STREAMED初期設定にない。手動追加要 |

### 1-3. 本システムの税区分151件の分類

| カテゴリ | 件数 | STREAMED初期設定 | 備考 |
|---------|:---:|:---:|------|
| 共通（COMMON_*） | 2 | 1件のみ（対象外） | `COMMON_UNKNOWN`はSTREAMEDに相当なし |
| 売上-課税（SALES_TAXABLE_*） | 22 | 3件（10%/8%/軽8%） | 簡易課税T1〜T6はSTREAMED初期設定外 |
| 売上-非課税等 | 6 | 1件（非課税売上） | 輸出・対象外売上はSTREAMED初期設定外 |
| 売上-返還 | 22 | 0件 | STREAMED初期設定外 |
| 売上-貸倒 | 7 | 3件（10%/8%/軽8%） | |
| 売上-回収 | 4 | 0件 | STREAMED初期設定外 |
| 仕入-課税（PURCHASE_*） | 12 | 1件（課税仕入10%） | 共通/非課税対応/旧税率はSTREAMED初期設定外 |
| 仕入-軽減8% | 3 | 1件 | |
| 仕入-8%/5% | 6 | 1件（8%のみ） | |
| 輸入仕入（IMPORT_*） | 36 | 0件 | 全てSTREAMED初期設定外 |
| 特定課税仕入 | 6 | 0件 | STREAMED初期設定外 |
| 仕入-非課税/対象外 | 2 | 1件（非課税仕入） | `PURCHASE_EXEMPT`はSTREAMED初期設定外 |
| 仕入-返還 | 18 | 0件 | STREAMED初期設定外 |
| 特定課税仕入-返還 | 6 | 0件 | STREAMED初期設定外 |
| **合計** | **151** | **15** | |

> [!IMPORTANT]
> 本システムの151件中、STREAMED初期設定に対応するのは**15件のみ**。
> 残り136件はMF固有の税区分（簡易課税・個別対応方式・輸入仕入等）。

---

## 2. 勘定科目マスタ比較

### 2-1. STREAMED初期勘定科目（46件）vs 本システム

ネット検索で取得したSTREAMEDの初期勘定科目46件と、本システムの勘定科目を比較。

| # | STREAMED科目名 | STREAMED税区分 | 本システムID | 本システム税区分 | 科目一致 | 税区分一致 |
|---|---------------|---------------|-------------|-----------------|:---:|:---:|
| 1 | 未確定 | 自動判定(仕入) | `UNCONFIRMED` | `COMMON_EXEMPT` | ✅ | ❌ |
| 2 | 現金 | 対象外 | `CASH` | `COMMON_EXEMPT` | ✅ | ✅ |
| 3 | 普通預金 | 対象外 | `ORDINARY_DEPOSIT` | `COMMON_EXEMPT` | ✅ | ✅ |
| 4 | 当座預金 | 対象外 | `CHECKING_DEPOSIT` | `COMMON_EXEMPT` | ✅ | ✅ |
| 5 | 売掛金 | 対象外 | `ACCOUNTS_RECEIVABLE` | `COMMON_EXEMPT` | ✅ | ✅ |
| 6 | 仮払金 | 対象外 | `TEMPORARY_PAYMENTS` | `COMMON_EXEMPT` | ✅ | ✅ |
| 7 | 工具器具備品 | 自動判定(仕入) | `FIXTURES` | `PURCHASE_TAXABLE_10` | ✅ | ✅ |
| 8 | 事業主貸 | 対象外 | `OWNER_DRAWING` | `COMMON_EXEMPT` | ✅ | ✅ |
| 9 | 買掛金 | 対象外 | `ACCOUNTS_PAYABLE` | `COMMON_EXEMPT` | ✅ | ✅ |
| 10 | 短期借入金 | 対象外 | `SHORT_TERM_BORROWINGS` | `COMMON_EXEMPT` | ✅ | ✅ |
| 11 | 未払金 | 対象外 | `ACCRUED_EXPENSES` | `COMMON_EXEMPT` | ✅ | ✅ |
| 12 | 未払費用 | 対象外 | `ACCRUED_LIABILITIES` | `COMMON_EXEMPT` | ✅ | ✅ |
| 13 | 仮受金 | 対象外 | `TEMPORARY_RECEIVED` | `COMMON_EXEMPT` | ✅ | ✅ |
| 14 | 長期借入金 | 対象外 | `LONG_TERM_BORROWINGS` | `COMMON_EXEMPT` | ✅ | ✅ |
| 15 | 売上高 | 自動判定(売上) | `SALES` | `SALES_TAXABLE_10` | ✅ | ✅ |
| 16 | 仕入高 | 自動判定(仕入) | `PURCHASES` | `PURCHASE_TAXABLE_10` | ✅ | ✅ |
| 17 | **給料賃金** | **対象外** | `WAGES` | `COMMON_EXEMPT` | ✅ | ✅ |
| 18 | **法定福利費** | **非課税仕入** | `LEGAL_WELFARE` | `COMMON_EXEMPT` | ✅ | ❌ |
| 19 | 福利厚生費 | 自動判定(仕入) | `WELFARE` | `PURCHASE_TAXABLE_10` | ✅ | ✅ |
| 20 | 業務委託料 | 自動判定(仕入) | `OUTSOURCING`（外注工賃） | `PURCHASE_TAXABLE_10` | ⚠️ | ✅ |
| 21 | 通信費 | 自動判定(仕入) | `COMMUNICATION` | `PURCHASE_TAXABLE_10` | ✅ | ✅ |
| 22 | 荷造運賃 | 自動判定(仕入) | `PACKING_SHIPPING` | `PURCHASE_TAXABLE_10` | ✅ | ✅ |
| 23 | 水道光熱費 | 自動判定(仕入) | `UTILITIES` | `PURCHASE_TAXABLE_10` | ✅ | ✅ |
| 24 | 旅費交通費 | 自動判定(仕入) | `TRAVEL` | `PURCHASE_TAXABLE_10` | ✅ | ✅ |
| 25 | 広告宣伝費 | 自動判定(仕入) | `ADVERTISING` | `PURCHASE_TAXABLE_10` | ✅ | ✅ |
| 26 | 接待交際費 | 自動判定(仕入) | `ENTERTAINMENT` | `PURCHASE_TAXABLE_10` | ✅ | ✅ |
| 27 | 会議費 | 自動判定(仕入) | `MEETING` | `PURCHASE_TAXABLE_10` | ✅ | ✅ |
| 28 | 備品・消耗品費 | 自動判定(仕入) | `SUPPLIES`（消耗品費） | `PURCHASE_TAXABLE_10` | ⚠️ | ✅ |
| 29 | 備品・消耗品費 | 自動判定(仕入) | ―（重複） | ― | ⚠️ | ― |
| 30 | 新聞図書費 | 自動判定(仕入) | `BOOKS_PERIODICALS` | `PURCHASE_TAXABLE_10` | ✅ | ✅ |
| 31 | 修繕費 | 自動判定(仕入) | `REPAIRS` | `PURCHASE_TAXABLE_10` | ✅ | ✅ |
| 32 | 地代家賃 | 自動判定(仕入) | `RENT` | `PURCHASE_TAXABLE_10` | ✅ | ✅ |
| 33 | 車両費 | 自動判定(仕入) | `VEHICLE_COSTS` | `PURCHASE_TAXABLE_10` | ✅ | ✅ |
| 34 | **保険料** | **非課税仕入** | `INSURANCE`（損害保険料） | `PURCHASE_NON_TAXABLE` | ⚠️ | ✅ |
| 35 | **租税公課** | **非課税仕入** | `TAXES_DUES` | `PURCHASE_NON_TAXABLE` | ✅ | ✅ |
| 36 | 諸会費 | 自動判定(仕入) | `MEMBERSHIP_FEES` | `PURCHASE_TAXABLE_10` | ✅ | ✅ |
| 37 | リース料 | 自動判定(仕入) | `LEASE` | `PURCHASE_TAXABLE_10` | ✅ | ✅ |
| 38 | 支払手数料 | 自動判定(仕入) | `FEES` | `PURCHASE_TAXABLE_10` | ✅ | ✅ |
| 39 | **減価償却費** | **非課税仕入** | `DEPRECIATION` | `COMMON_EXEMPT` | ✅ | ❌ |
| 40 | 雑費 | 自動判定(仕入) | `MISCELLANEOUS` | `PURCHASE_TAXABLE_10` | ✅ | ✅ |
| 41 | 貸倒金 | 自動判定(売上貸倒) | `BAD_DEBT_LOSS`（貸倒金(損失)） | `SALES_BAD_DEBT_10` | ⚠️ | ✅ |
| 42 | **支払利息** | **非課税仕入** | `INTEREST_DISCOUNT`（利子割引料） | `PURCHASE_NON_TAXABLE` | ⚠️ | ✅ |
| 43 | 受取利息 | 非課税売上 | `INTEREST_INCOME` | `SALES_NON_TAXABLE` | ✅ | ✅ |
| 44 | 雑収入 | 自動判定(売上) | `MISC_INCOME` | `SALES_TAXABLE_10` | ✅ | ✅ |
| 45 | 諸口 | 対象外 | ―（未実装） | ― | ❌ | ― |
| 46 | 未確定勘定 | 自動判定(仕入) | `UNCONFIRMED` | `COMMON_EXEMPT` | ✅ | ❌ |

### 2-2. 統計

| 区分 | 件数 |
|------|:---:|
| 科目名完全一致 | 37 |
| 科目名差異あり（⚠️） | 5 |
| 本システムに存在しない（❌） | 1（諸口） |
| STREAMED重複（#29） | 1 |
| **税区分一致** | **39** |
| **税区分不一致** | **3** |
| 判定不能 | 2（#29,#45） |

### 2-3. 税区分不一致の3件（2026-03-29確定）

| # | 科目名 | STREAMED | 本システム | 判断 |
|---|--------|---------|-----------|------|
| 1 | 未確定（#1,#46） | 自動判定(仕入) | `COMMON_EXEMPT`（対象外） | 要検討（`taxDetermination`で対応中？） |
| 18 | 法定福利費 | 非課税仕入 | `COMMON_EXEMPT`（対象外） | **ユーザー決定：対象外のまま** ✅ |
| 39 | 減価償却費 | 非課税仕入 | `COMMON_EXEMPT`（対象外） | **対象外が正しい** ✅（税務上は不課税。MF公式も「対象外」採用） |

> [!NOTE]
> **利子割引料（#42）は不一致→一致に変更**。実コード（account-master.ts L992）は`PURCHASE_NON_TAXABLE`（非課税仕入）であり、STREAMEDの「非課税仕入」と一致していた。以前のドキュメントが`COMMON_EXEMPT`と誤記載していたため修正（2026-03-29）。

> [!IMPORTANT]
> **減価償却費の「対象外」は正しい**。税務上、減価償却費は消費税課税4要件（①事業者が事業として ②対価を得て ③資産の譲渡等を行う ④国内取引）のうち②③を満たさず「不課税」。MF公式（moneyforward.com）でも「対象外（不課税）」を採用。STREAMEDの「非課税仕入」は厳密には不適切だが、消費税計算結果には影響しない。

### 2-4. 科目名差異の5件

| # | STREAMED | 本システム | 差異内容 |
|---|---------|-----------|---------| 
| 20 | 業務委託料 | 外注工賃 | 完全に別名称 |
| 28 | 備品・消耗品費 | 消耗品費 | STREAMED側が「備品・」付き |
| 34 | 保険料 | 損害保険料 | MF個人は「損害保険料」 |
| 41 | 貸倒金 | 貸倒金(損失) | MF個人は括弧付き |
| 42 | 支払利息 | 利子割引料 | MF個人は「利子割引料」 |

---

## 3. 税区分不一致の最終判断（2026-03-29確定）

| # | 科目 | STREAMED | 本システム | 税務上 | 判断 |
|---|------|---------|-----------|--------|------|
| 1 | 減価償却費 | 非課税仕入 | 対象外 | 不課税 | ✅ **対象外が正しい**。MF公式準拠 |
| 2 | 利子割引料 | 非課税仕入 | 非課税仕入 | 非課税 | ✅ **一致**（ドキュメント誤記を修正） |
| 3 | 法定福利費 | 非課税仕入 | 対象外 | 不課税 | ✅ **対象外が正しい**。ユーザー決定済み |

> 全3件確定。未決定事項なし。

## 変更履歴

| 日付 | 変更内容 |
|------|---------| 
| 2026-03-25 | 初版作成（STREAMED vs 本システム全量比較表） |
| 2026-03-29 | プロジェクトに移動。§3 全量一覧は #18（account_classification_comparison）に統合のため省略 |
| 2026-03-29 | 利子割引料の税区分を実コード準拠に修正（COMMON_EXEMPT→PURCHASE_NON_TAXABLE）。減価償却費・利子割引料・法定福利費の3件全て確定。不一致4件→3件 |
