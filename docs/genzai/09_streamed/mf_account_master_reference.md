# MF デフォルト勘定科目マスター（参照用）

> 作成日: 2026-03-02（最終更新: 2026-03-25）
> 根拠: MFクラウド確定申告CSVエクスポート(`indiv_items_download.csv`) + 手入力リスト + account-master.ts確認
> 凡例: ✅確認済（CSV一致） / ⚠️未確認（法人のみ/CSVなし）

---

## 1. 個人向け（MFクラウド確定申告）— CSV確認済み

> 以下は `indiv_items_download.csv` から抽出した**MF正式名称**。
> 補助科目付き行は除外し、勘定科目レベルのみ掲載。

### 貸借対照表

| # | MF正式科目名 | 確認 | 分類 | デフォルト税区分 | 概念ID案 |
|---|-------------|:----:|------|-----------------|---------|
| 1 | 現金 | ✅ | 現金及び預金 | 対象外 | CASH |
| 2 | 当座預金 | ✅ | 現金及び預金 | 対象外 | CHECKING_DEPOSIT |
| 3 | 普通預金 | ✅ | 現金及び預金 | 対象外 | ORDINARY_DEPOSIT |
| 4 | 定期預金 | ✅ | 現金及び預金 | 対象外 | TIME_DEPOSIT |
| 5 | その他の預金 | ✅ | 現金及び預金 | 対象外 | OTHER_DEPOSIT |
| 6 | 受取手形 | ✅ | 売上債権 | 対象外 | NOTES_RECEIVABLE |
| 7 | 売掛金 | ✅ | 売上債権 | 対象外 | ACCOUNTS_RECEIVABLE |
| 8 | 有価証券 | ✅ | 有価証券 | 対象外 | SECURITIES |
| 9 | 商品 | ✅ | 棚卸資産 | 対象外 | MERCHANDISE |
| 10 | 貯蔵品 | ✅ | 棚卸資産 | 対象外 | STORED_GOODS |
| 11 | 材料 | ✅ | 棚卸資産 | 対象外 | MATERIALS |
| 12 | 仕掛品 | ✅ | 棚卸資産 | 対象外 | WORK_IN_PROGRESS |
| 13 | 製品 | ✅ | 棚卸資産 | 対象外 | PRODUCTS |
| 14 | 未収賃貸料 | ✅ | その他流動資産 | 対象外 | ACCRUED_RENTAL |
| 15 | 前払金 | ✅ | その他流動資産 | 対象外 | ADVANCE_PAYMENTS |
| 16 | 貸付金 | ✅ | その他流動資産 | 対象外 | LOANS |
| 17 | 立替金 | ✅ | その他流動資産 | 対象外 | ADVANCE_PAID |
| 18 | 未収金 | ✅ | その他流動資産 | 対象外 | ACCRUED_REVENUE |
| 19 | 仮払金 | ✅ | その他流動資産 | 対象外 | TEMPORARY_PAYMENTS |
| 20 | 仮払消費税 | ✅ | その他流動資産 | 対象外 | INPUT_TAX |
| 21 | 建物 | ✅ | 有形固定資産 | 課仕 10% | BUILDINGS |
| 22 | 附属設備 | ✅ | 有形固定資産 | 課仕 10% | BUILDING_EQUIPMENT |
| 23 | 構築物 | ✅ | 有形固定資産 | 課仕 10% | STRUCTURES |
| 24 | 機械装置 | ✅ | 有形固定資産 | 課仕 10% | MACHINERY |
| 25 | 車両運搬具 | ✅ | 有形固定資産 | 課仕 10% | VEHICLES |
| 26 | 工具器具備品 | ✅ | 有形固定資産 | 課仕 10% | FIXTURES |
| 27 | 船舶 | ✅ | 有形固定資産 | 課仕 10% | SHIPS |
| 28 | 一括償却資産 | ✅ | 有形固定資産 | 課仕 10% | LUMP_SUM_DEPRECIATION |
| 29 | 土地 | ✅ | 有形固定資産 | 対象外 | LAND |
| 30 | 減価償却累計額 | ✅ | 有形固定資産 | 対象外 | ACCUM_DEPRECIATION |
| 31 | 電話加入権 | ✅ | 無形固定資産 | 課仕 10% | TELEPHONE_RIGHTS |
| 32 | 借地権 | ✅ | 無形固定資産 | 対象外 | LEASEHOLD_RIGHTS |
| 33 | 公共施設負担金 | ✅ | 無形固定資産 | 課仕 10% | PUBLIC_FACILITY_COSTS |
| 34 | 敷金 | ✅ | 投資その他 | 対象外 | SECURITY_DEPOSITS |
| 35 | 差入保証金 | ✅ | 投資その他 | 対象外 | GUARANTEE_DEPOSITS |
| 36 | 預託金 | ✅ | 投資その他 | 対象外 | ENTRUSTED_DEPOSITS |
| 37 | 開業費 | ✅ | 繰延資産 | 課仕 10% | STARTUP_COSTS |
| 38 | 事業主貸 | ✅ | 事業主貸 | 対象外 | OWNER_DRAWING |
| 39 | 資産譲渡損 | ✅ | 事業主貸 | 対象外 | ASSET_TRANSFER_LOSS |
| 40 | 未確定勘定 | ✅ | 諸口 | 対象外 | UNCONFIRMED |
| 41 | 支払手形 | ✅ | 仕入債務 | 対象外 | NOTES_PAYABLE |
| 42 | 買掛金 | ✅ | 仕入債務 | 対象外 | ACCOUNTS_PAYABLE |
| 43 | 借入金 | ✅ | その他流動負債 | 対象外 | BORROWINGS |
| 44 | 未払金 | ✅ | その他流動負債 | 対象外 | ACCRUED_EXPENSES |
| 45 | 前受金 | ✅ | その他流動負債 | 対象外 | ADVANCE_RECEIVED |
| 46 | 預り金 | ✅ | その他流動負債 | 対象外 | DEPOSITS_RECEIVED |
| 47 | 貸倒引当金 | ✅ | その他流動負債 | 対象外 | ALLOWANCE_DOUBTFUL |
| 48 | 仮受金 | ✅ | その他流動負債 | 対象外 | TEMPORARY_RECEIVED |
| 49 | 未払消費税 | ✅ | その他流動負債 | 対象外 | OUTPUT_TAX_PAYABLE |
| 50 | 保証金・敷金 | ✅ | その他流動負債 | 対象外 | GUARANTEE_DEPOSIT_LIABILITY |
| 51 | 商品券 | ✅ | その他流動負債 | 対象外 | GIFT_CERTIFICATES |
| 52 | 仮受消費税 | ✅ | その他流動負債 | 対象外 | OUTPUT_TAX |
| 53 | 長期借入金 | ✅ | 固定負債 | 対象外 | LONG_TERM_BORROWINGS |
| 54 | 事業主借 | ✅ | 事業主借 | 対象外 | OWNER_INVESTMENT |
| 55 | 元入金 | ✅ | 資本の部 | 対象外 | OWNER_CAPITAL |

### 損益計算書

| # | MF正式科目名 | 確認 | 分類 | デフォルト税区分 | 概念ID案 |
|---|-------------|:----:|------|-----------------|---------|
| 56 | 売上高 | ✅ | 売上(収入)金額 | 課売 10% | SALES |
| 57 | 売上値引・返品 | ✅ | 売上(収入)金額 | 課売-返還 10% | SALES_RETURNS |
| 58 | 家事消費等 | ✅ | 売上(収入)金額 | 課売 10% | PERSONAL_CONSUMPTION |
| 59 | 雑収入 | ✅ | 売上(収入)金額 | 課売 10% | MISC_INCOME |
| 60 | 期首商品棚卸高 | ✅ | 期首棚卸 | 対象外 | BEGINNING_INVENTORY |
| 61 | 仕入高 | ✅ | 当期仕入高 | 課仕 10% | PURCHASES |
| 62 | 仕入値引・返品 | ✅ | 当期仕入高 | 課仕-返還 10% | PURCHASE_RETURNS |
| 63 | 期末商品棚卸高 | ✅ | 期末棚卸 | 対象外 | ENDING_INVENTORY |
| 64 | 租税公課 | ✅ | 経費 | 対象外 | TAXES_DUES |
| 65 | 荷造運賃 | ✅ | 経費 | 課仕 10% | PACKING_SHIPPING |
| 66 | 水道光熱費 | ✅ | 経費 | 課仕 10% | UTILITIES |
| 67 | 旅費交通費 | ✅ | 経費 | 課仕 10% | TRAVEL |
| 68 | 通信費 | ✅ | 経費 | 課仕 10% | COMMUNICATION |
| 69 | 広告宣伝費 | ✅ | 経費 | 課仕 10% | ADVERTISING |
| 70 | 接待交際費 | ✅ | 経費 | 課仕 10% | ENTERTAINMENT |
| 71 | 損害保険料 | ✅ | 経費 | 非仕 | INSURANCE |
| 72 | 修繕費 | ✅ | 経費 | 課仕 10% | REPAIRS |
| 73 | 消耗品費 | ✅ | 経費 | 課仕 10% | SUPPLIES |
| 74 | 減価償却費 | ✅ | 経費 | 対象外 | DEPRECIATION |
| 75 | 福利厚生費 | ✅ | 経費 | 課仕 10% | WELFARE |
| 76 | 法定福利費 | ✅ | 経費 | 対象外 | LEGAL_WELFARE |
| 77 | 給料賃金 | ✅ | 経費 | 対象外 | WAGES |
| 78 | 退職給与 | ✅ | 経費 | 対象外 | RETIREMENT_PAY |
| 79 | 外注工賃 | ✅ | 経費 | 課仕 10% | OUTSOURCING |
| 80 | 利子割引料 | ✅ | 経費 | 非仕 | INTEREST_DISCOUNT |
| 81 | 地代家賃 | ✅ | 経費 | 課仕 10% | RENT |
| 82 | 貸倒金(損失) | ✅ | 経費 | 課売-貸倒 10% | BAD_DEBT_LOSS |
| 83 | 車両費 | ✅ | 経費 | 課仕 10% | VEHICLE_COSTS |
| 84 | リース料 | ✅ | 経費 | 課仕 10% | LEASE |
| 85 | 支払手数料 | ✅ | 経費 | 課仕 10% | FEES |
| 86 | 研修採用費 | ✅ | 経費 | 課仕 10% | TRAINING |
| 87 | 新聞図書費 | ✅ | 経費 | 課仕 10% | BOOKS_PERIODICALS |
| 88 | 会議費 | ✅ | 経費 | 課仕 10% | MEETING |
| 89 | 繰延資産償却 | ✅ | 経費 | 対象外 | DEFERRED_AMORTIZATION |
| 90 | 雑費 | ✅ | 経費 | 課仕 10% | MISCELLANEOUS |
| 91 | 貸倒引当金戻入 | ✅ | 繰戻額等 | 対象外 | BAD_DEBT_REVERSAL |
| 92 | 専従者給与 | ✅ | 繰入額等 | 対象外 | FAMILY_EMPLOYEE_PAY |
| 93 | 貸倒引当金繰入 | ✅ | 繰入額等 | 対象外 | BAD_DEBT_PROVISION |

### 損益計算書（不動産所得）

| # | MF正式科目名 | 確認 | 分類 | デフォルト税区分 | 概念ID案 |
|---|-------------|:----:|------|-----------------|---------|
| 94 | 賃貸料(不動産) | ✅ | 収入金額 | 課売 10% | RENTAL_INCOME |
| 95 | 礼金・権利金更新料(不動産) | ✅ | 収入金額 | 課売 10% | RENTAL_KEY_MONEY |
| 96 | 名義書換料その他(不動産) | ✅ | 収入金額 | 課売 10% | RENTAL_TRANSFER_FEE |
| 97 | 租税公課(不動産) | ✅ | 必要経費 | 対象外 | RENTAL_TAXES |
| 98 | 損害保険料(不動産) | ✅ | 必要経費 | 非仕 | RENTAL_INSURANCE |
| 99 | 修繕費(不動産) | ✅ | 必要経費 | 課仕 10% | RENTAL_REPAIRS |
| 100 | 減価償却費(不動産) | ✅ | 必要経費 | 対象外 | RENTAL_DEPRECIATION |
| 101 | 借入金利子(不動産) | ✅ | 必要経費 | 非仕 | RENTAL_INTEREST |
| 102 | 地代家賃(不動産) | ✅ | 必要経費 | 課仕 10% | RENTAL_RENT |
| 103 | 給料賃金(不動産) | ✅ | 必要経費 | 対象外 | RENTAL_WAGES |
| 104 | 外注管理費(不動産) | ✅ | 必要経費 | 課仕 10% | RENTAL_OUTSOURCING |
| 105 | 旅費交通費(不動産) | ✅ | 必要経費 | 課仕 10% | RENTAL_TRAVEL |
| 106 | 新聞図書費(不動産) | ✅ | 必要経費 | 課仕 10% | RENTAL_BOOKS |
| 107 | その他の経費(不動産) | ✅ | 必要経費 | 課仕 10% | RENTAL_OTHER |
| 108 | 専従者給与(不動産) | ✅ | 専従者給与 | 対象外 | RENTAL_FAMILY_PAY |

**個人向け合計: 108科目（全てCSV確認済み）**

---

## 2. 法人向け（MFクラウド会計）— ⚠️ 未確認

> 法人向けMFアカウントがないため正式名称は未確認。
> 将来テスト登録時にCSVエクスポートで確認する予定。
> 以下は手入力のため全角半角等が正確でない可能性あり。

### 貸借対照表

| # | 科目名（手入力） | 確認 | 概念ID案 |
|---|-----------------|:----:|---------|
| 1 | 現金 | ⚠️ | CASH |
| 2 | 普通預金 | ⚠️ | ORDINARY_DEPOSIT |
| 3 | 当座預金 | ⚠️ | CHECKING_DEPOSIT |
| 4 | 定期預金 | ⚠️ | TIME_DEPOSIT |
| 5 | その他の預金 | ⚠️ | OTHER_DEPOSIT |
| 6 | 受取手形 | ⚠️ | NOTES_RECEIVABLE |
| 7 | 売掛金 | ⚠️ | ACCOUNTS_RECEIVABLE |
| 8 | 有価証券 | ⚠️ | SECURITIES |
| 9 | 商品 | ⚠️ | MERCHANDISE |
| 10 | 製品 | ⚠️ | PRODUCTS |
| 11 | 材料 | ⚠️ | MATERIALS |
| 12 | 仕掛品 | ⚠️ | WORK_IN_PROGRESS |
| 13 | 貯蔵品 | ⚠️ | STORED_GOODS |
| 14 | 前払金 | ⚠️ | ADVANCE_PAYMENTS |
| 15 | 前払費用 | ⚠️ | PREPAID_EXPENSES |
| 16 | 短期貸付金 | ⚠️ | SHORT_TERM_LOANS |
| 17 | 未収入金 | ⚠️ | ACCRUED_REVENUE_CORP |
| 18 | 仮払金 | ⚠️ | TEMPORARY_PAYMENTS |
| 19 | 立替金 | ⚠️ | ADVANCE_PAID |
| 20 | 貸倒引当金 | ⚠️ | ALLOWANCE_DOUBTFUL |
| 21 | 建物 | ⚠️ | BUILDINGS |
| 22 | 建物附属設備 | ⚠️ | BUILDING_EQUIPMENT_CORP |
| 23 | 構築物 | ⚠️ | STRUCTURES |
| 24 | 機械装置 | ⚠️ | MACHINERY |
| 25 | 車両運搬具 | ⚠️ | VEHICLES |
| 26 | 器具備品 | ⚠️ | FIXTURES_CORP |
| 27 | 土地 | ⚠️ | LAND |
| 28 | 建設仮勘定 | ⚠️ | CONSTRUCTION_IN_PROGRESS |
| 29 | ソフトウェア | ⚠️ | SOFTWARE |
| 30 | 電話加入権 | ⚠️ | TELEPHONE_RIGHTS |
| 31 | 投資有価証券 | ⚠️ | INVESTMENT_SECURITIES |
| 32 | 長期貸付金 | ⚠️ | LONG_TERM_LOANS |
| 33 | 差入保証金 | ⚠️ | GUARANTEE_DEPOSITS |
| 34 | 敷金 | ⚠️ | SECURITY_DEPOSITS |
| 35 | 長期前払費用 | ⚠️ | LONG_TERM_PREPAID |
| 36 | 創立費 | ⚠️ | ORGANIZATION_COSTS |
| 37 | 開業費 | ⚠️ | STARTUP_COSTS |
| 38 | 開発費 | ⚠️ | DEVELOPMENT_COSTS |
| 39 | 社債発行費 | ⚠️ | BOND_ISSUANCE_COSTS |
| 40 | 支払手形 | ⚠️ | NOTES_PAYABLE |
| 41 | 買掛金 | ⚠️ | ACCOUNTS_PAYABLE |
| 42 | 短期借入金 | ⚠️ | SHORT_TERM_BORROWINGS |
| 43 | 未払金 | ⚠️ | ACCRUED_EXPENSES |
| 44 | 未払費用 | ⚠️ | ACCRUED_LIABILITIES |
| 45 | 預り金 | ⚠️ | DEPOSITS_RECEIVED |
| 46 | 前受金 | ⚠️ | ADVANCE_RECEIVED |
| 47 | 仮受金 | ⚠️ | TEMPORARY_RECEIVED |
| 48 | 長期借入金 | ⚠️ | LONG_TERM_BORROWINGS |
| 49 | 役員借入金 | ⚠️ | OFFICER_BORROWINGS |
| 50 | 社債 | ⚠️ | BONDS |
| 51 | 退職給付引当金 | ⚠️ | RETIREMENT_ALLOWANCE |
| 52 | 資本金 | ⚠️ | CAPITAL |
| 53 | 資本準備金 | ⚠️ | CAPITAL_RESERVE |
| 54 | 利益準備金 | ⚠️ | EARNED_RESERVE |
| 55 | 繰越利益剰余金 | ⚠️ | RETAINED_EARNINGS |

### 損益計算書

| # | 科目名（手入力） | 確認 | 概念ID案 |
|---|-----------------|:----:|---------|
| 56 | 売上高 | ⚠️ | SALES |
| 57 | 売上値引・返品 | ⚠️ | SALES_RETURNS |
| 58 | 期首商品棚卸高 | ⚠️ | BEGINNING_MERCHANDISE |
| 59 | 期首製品棚卸高 | ⚠️ | BEGINNING_PRODUCTS |
| 60 | 仕入高 | ⚠️ | PURCHASES |
| 61 | 仕入値引・返品 | ⚠️ | PURCHASE_RETURNS |
| 62 | 外注費 | ⚠️ | OUTSOURCING_CORP |
| 63 | 他勘定振替高 | ⚠️ | ACCOUNT_TRANSFER |
| 64 | 期末商品棚卸高 | ⚠️ | ENDING_MERCHANDISE |
| 65 | 期末製品棚卸高 | ⚠️ | ENDING_PRODUCTS |
| 66 | 役員報酬 | ⚠️ | OFFICER_COMPENSATION |
| 67 | 給料手当 | ⚠️ | SALARIES |
| 68 | 賞与 | ⚠️ | BONUSES |
| 69 | 退職金 | ⚠️ | RETIREMENT_PAY_CORP |
| 70 | 法定福利費 | ⚠️ | LEGAL_WELFARE |
| 71 | 福利厚生費 | ⚠️ | WELFARE |
| 72 | 採用費 | ⚠️ | RECRUITING |
| 73 | 教育研修費 | ⚠️ | TRAINING_CORP |
| 74 | 広告宣伝費 | ⚠️ | ADVERTISING |
| 75 | 荷造運賃 | ⚠️ | PACKING_SHIPPING |
| 76 | 接待交際費 | ⚠️ | ENTERTAINMENT |
| 77 | 会議費 | ⚠️ | MEETING |
| 78 | 旅費交通費 | ⚠️ | TRAVEL |
| 79 | 通勤費 | ⚠️ | COMMUTING |
| 80 | 通信費 | ⚠️ | COMMUNICATION |
| 81 | 消耗品費 | ⚠️ | SUPPLIES |
| 82 | 修繕費 | ⚠️ | REPAIRS |
| 83 | 水道光熱費 | ⚠️ | UTILITIES |
| 84 | 地代家賃 | ⚠️ | RENT |
| 85 | 賃借料 | ⚠️ | LEASE_CORP |
| 86 | 租税公課 | ⚠️ | TAXES_DUES |
| 87 | 支払手数料 | ⚠️ | FEES |
| 88 | 保険料 | ⚠️ | INSURANCE_CORP |
| 89 | 新聞図書費 | ⚠️ | BOOKS_PERIODICALS |
| 90 | 諸会費 | ⚠️ | MEMBERSHIP_FEES |
| 91 | 寄付金 | ⚠️ | DONATIONS |
| 92 | 雑費 | ⚠️ | MISCELLANEOUS |
| 93 | 減価償却費 | ⚠️ | DEPRECIATION |
| 94 | 繰延資産償却 | ⚠️ | DEFERRED_AMORTIZATION |
| 95 | 貸倒引当金繰入額 | ⚠️ | BAD_DEBT_PROVISION_CORP |
| 96 | 貸倒損失 | ⚠️ | BAD_DEBT_LOSS_CORP |
| 97 | 受取利息 | ⚠️ | INTEREST_INCOME |
| 98 | 受取配当金 | ⚠️ | DIVIDEND_INCOME |
| 99 | 有価証券売却益 | ⚠️ | SECURITIES_GAIN |
| 100 | 雑収入 | ⚠️ | MISC_INCOME |
| 101 | 支払利息 | ⚠️ | INTEREST_EXPENSE |
| 102 | 有価証券売却損 | ⚠️ | SECURITIES_LOSS |
| 103 | 雑損失 | ⚠️ | MISC_LOSS |
| 104 | 固定資産売却益 | ⚠️ | FIXED_ASSET_GAIN |
| 105 | 固定資産売却損 | ⚠️ | FIXED_ASSET_LOSS |

**法人向け合計: 105科目（全て未確認）**

---

## 3. 個人 ↔ 法人 名称差異（判明済み）

| 個人（✅確認済） | 法人（⚠️未確認） | 備考 |
|----------------|----------------|------|
| 工具器具備品 | 器具備品 | 「工具」の有無 |
| 未収金 | 未収入金 | 「入」の有無 |
| 損害保険料 | 保険料 | 個人のみ「損害」付き |
| 附属設備 | 建物附属設備 | 個人は短い |
| 外注工賃 | 外注費 | 完全に別名称 |
| 給料賃金 | 給料手当 | 完全に別名称 |
| 利子割引料 | 支払利息 | 完全に別名称 |
| 貸倒金(損失) | 貸倒損失 | 括弧の有無 |
| 研修採用費 | 採用費 / 教育研修費 | 個人は統合、法人は分離 |
| 借入金 | 短期借入金 | 個人は区分なし |

---

## 4. 統計

| カテゴリ | 科目数 | 確認状態 |
|---------|--------|---------|
| 個人向け | 108 | ✅ 全件CSV確認済み |
| 法人向け | 105 | ⚠️ 全件未確認 |
| 重複除外後の推定合計 | 150〜160 | |

---

## 5. 未確認事項

| # | 項目 | 確認方法 | 状態 |
|---|------|----------|------|
| 1 | 法人向け科目の正式名称 | MF法人テスト登録 → CSVエクスポート | ⬜ ユーザー検討中 |
| 2 | STREAMED「備品・消耗品費」とMF「消耗品費」の関係 | STREAMED → MFインポート時の変換ルール確認 | ⬜ 未確認 |
| 3 | STREAMED「業務委託料」とMF「外注工賃」の関係 | 同上 | ⬜ 未確認 |
| 4 | 税区分の省略名と正式名称の対応 | `tax-category-master.ts`のshortNameと照合 | ✅ 確認済（2026-03-25、MF公式ヘルプで半角スペース・半角括弧確認） |
