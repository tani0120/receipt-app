# 勘定科目 大分類・中分類・小分類 MF対比（英日併記）

> 根拠: MF公式ヘルプ、本システム [account-master.ts](file:///c:/dev/receipt-app/src/shared/data/account-master.ts) 全79科目
> **移動元**: brain/e4995e3d `account_classification_comparison.md`（2026-03-22作成）
> **最終更新**: 2026-03-29（プロジェクト移動）

---

## 0. 大分類（Account Group）

| 大分類 / Account Group | 値 | 税区分判定の制限 |
|----------------------|-----|----------------|
| BS資産 / BS Asset | `BS_ASSET` | `fixed` のみ（例外: 有形固定資産等は `auto_purchase` も可） |
| BS負債 / BS Liability | `BS_LIABILITY` | `fixed` のみ |
| BS純資産 / BS Equity | `BS_EQUITY` | `fixed` のみ |
| PL収益 / PL Revenue | `PL_REVENUE` | `auto_sales` / `fixed` |
| PL費用 / PL Expense | `PL_EXPENSE` | `auto_purchase` / `fixed` |

---

## 1. 中分類（科目分類 / Category）の採用要否比較

### BS資産 / BS Asset

| # | MF決算書科目 | 英語名 | 本システム `category` | 採用 | target |
|---|------------|--------|---------------------|:----:|:------:|
| 1 | 現金及び預金 | Cash and Deposits | 現金及び預金 | ✅ | both |
| 2 | 売上債権 | Trade Receivables | 売上債権 | ✅ | both |
| 3 | 有価証券 | Securities | 有価証券 | ✅ | both |
| 4 | 棚卸資産 | Inventories | 棚卸資産 | ✅ | ind/corp |
| 5 | その他流動資産 | Other Current Assets | その他流動資産 | ✅ | both |
| 6 | 有形固定資産 | Tangible Fixed Assets | 有形固定資産 | ✅ | both |
| 7 | 無形固定資産 | Intangible Fixed Assets | 無形固定資産 | ✅ | both |
| 8 | 投資その他の資産 | Investments & Other Assets | 投資その他 | ✅ | both |
| 9 | 繰延資産 | Deferred Assets | 繰延資産 | ✅ | ind |

### BS負債 / BS Liability

| # | MF決算書科目 | 英語名 | 本システム `category` | 採用 | target |
|---|------------|--------|---------------------|:----:|:------:|
| 10 | 仕入債務 | Trade Payables | 仕入債務 | ✅ | both |
| 11 | その他流動負債 | Other Current Liabilities | その他流動負債 | ✅ | both |
| 12 | 固定負債 | Long-term Liabilities | 固定負債 | ✅ | both |

### BS純資産 / BS Equity

| # | MF決算書科目 | 英語名 | 本システム `category` | 採用 | target |
|---|------------|--------|---------------------|:----:|:------:|
| 13 | 純資産 | Net Assets | 純資産 | ✅ | corp |
| 14 | 事業主貸 | Owner's Drawing | 事業主貸 | ✅ | ind |
| 15 | 事業主借 | Owner's Investment | 事業主借 | ✅ | ind |
| 16 | 元入金 | Owner's Capital | 資本の部 | ✅ | ind |
| 17 | 諸口 | Suspense Account | 諸口 | ✅ | ind |

### PL収益 / PL Revenue

| # | MF決算書科目 | 英語名 | 本システム `category` | 採用 | target |
|---|------------|--------|---------------------|:----:|:------:|
| 18 | 売上高 | Sales | 売上 | ✅ | both |
| 19 | 不動産収入 | Rental Income | 不動産収入 | ✅ | ind |
| 20 | 営業外収益 | Non-operating Revenue | 営業外収益 | ✅ | corp |
| 21 | 特別利益 | Extraordinary Gains | ❌ 未採用 | 🔍 | corp |

### PL費用 / PL Expense

| # | MF決算書科目 | 英語名 | 本システム `category` | 採用 | target |
|---|------------|--------|---------------------|:----:|:------:|
| 22 | 売上原価 | Cost of Sales | 売上原価 | ✅ | both |
| 23 | 販売費及び一般管理費 | SG&A Expenses | 経費 / 販管費 | ✅ | both |
| 24 | 不動産経費 | Rental Expenses | 不動産経費 | ✅ | ind |
| 25 | 営業外費用 | Non-operating Expenses | 営業外費用 | ✅ | corp |
| 26 | 特別損失 | Extraordinary Losses | ❌ 未採用 | 🔍 | corp |
| 27 | 繰入額等 | Provision Expenses | 繰入額等 | ✅ | ind |
| 28 | 繰戻額等 | Provision Reversals | 繰戻額等 | ✅ | ind |

---

## 2. 小分類（勘定科目 / Account）の採用要否比較

### 共通 / Common（target: both）

| # | 日本語名 | 英語名 | ID | 科目分類 | 採用 |
|---|---------|--------|-----|---------|:----:|
| 1 | 現金 | Cash | `CASH` | 現金及び預金 | ✅ |
| 2 | 普通預金 | Ordinary Deposit | `ORDINARY_DEPOSIT` | 現金及び預金 | ✅ |
| 3 | 当座預金 | Checking Deposit | `CHECKING_DEPOSIT` | 現金及び預金 | ✅ |
| 4 | 定期預金 | Time Deposit | `TIME_DEPOSIT` | 現金及び預金 | ✅ |
| 5 | 受取手形 | Notes Receivable | `NOTES_RECEIVABLE` | 売上債権 | ✅ |
| 6 | 売掛金 | Accounts Receivable | `ACCOUNTS_RECEIVABLE` | 売上債権 | ✅ |
| 7 | 有価証券 | Securities | `SECURITIES` | 有価証券 | ✅ |
| 8 | 前払金 | Advance Payments | `ADVANCE_PAYMENTS` | その他流動資産 | ✅ |
| 9 | 仮払金 | Temporary Payments | `TEMPORARY_PAYMENTS` | その他流動資産 | ✅ |
| 10 | 建物 | Buildings | `BUILDINGS` | 有形固定資産 | ✅ |
| 11 | 構築物 | Structures | `STRUCTURES` | 有形固定資産 | ✅ |
| 12 | 車両運搬具 | Vehicles | `VEHICLES` | 有形固定資産 | ✅ |
| 13 | 土地 | Land | `LAND` | 有形固定資産 | ✅ |
| 14 | 電話加入権 | Telephone Rights | `TELEPHONE_RIGHTS` | 無形固定資産 | ✅ |
| 15 | 敷金 | Security Deposits | `SECURITY_DEPOSITS` | 投資その他 | ✅ |
| 16 | 差入保証金 | Guarantee Deposits | `GUARANTEE_DEPOSITS` | 投資その他 | ✅ |
| 17 | 支払手形 | Notes Payable | `NOTES_PAYABLE` | 仕入債務 | ✅ |
| 18 | 買掛金 | Accounts Payable | `ACCOUNTS_PAYABLE` | 仕入債務 | ✅ |
| 19 | 未払金 | Accrued Expenses | `ACCRUED_EXPENSES` | その他流動負債 | ✅ |
| 20 | 預り金 | Deposits Received | `DEPOSITS_RECEIVED` | その他流動負債 | ✅ |
| 21 | 前受金 | Advance Received | `ADVANCE_RECEIVED` | その他流動負債 | ✅ |
| 22 | 仮受金 | Temporary Received | `TEMPORARY_RECEIVED` | その他流動負債 | ✅ |
| 23 | 長期借入金 | Long-term Borrowings | `LONG_TERM_BORROWINGS` | 固定負債 | ✅ |
| 24 | 売上高 | Sales | `SALES` | 売上 | ✅ |
| 25 | 福利厚生費 | Welfare Expenses | `WELFARE` | 経費 | ✅ |
| 26 | 法定福利費 | Legal Welfare | `LEGAL_WELFARE` | 経費 | ✅ |
| 27 | 通信費 | Communication | `COMMUNICATION` | 経費 | ✅ |
| 28 | 荷造運賃 | Packing & Shipping | `PACKING_SHIPPING` | 経費 | ✅ |
| 29 | 水道光熱費 | Utilities | `UTILITIES` | 経費 | ✅ |
| 30 | 旅費交通費 | Travel Expenses | `TRAVEL` | 経費 | ✅ |
| 31 | 広告宣伝費 | Advertising | `ADVERTISING` | 経費 | ✅ |
| 32 | 接待交際費 | Entertainment | `ENTERTAINMENT` | 経費 | ✅ |
| 33 | 会議費 | Meeting Expenses | `MEETING` | 経費 | ✅ |
| 34 | 修繕費 | Repairs | `REPAIRS` | 経費 | ✅ |
| 35 | 地代家賃 | Rent | `RENT` | 経費 | ✅ |
| 36 | 租税公課 | Taxes & Dues | `TAXES_DUES` | 経費 | ✅ |
| 37 | 支払手数料 | Fees & Commissions | `FEES` | 経費 | ✅ |
| 38 | 減価償却費 | Depreciation | `DEPRECIATION` | 経費 | ✅ |
| 39 | 雑費 | Miscellaneous | `MISCELLANEOUS` | 経費 | ✅ |
| 40 | 車両費 | Vehicle Costs | `VEHICLE_COSTS` | 経費 | ✅ |
| 41 | リース料 | Lease Expenses | `LEASE` | 経費 | ✅ |
| 42 | 新聞図書費 | Books & Periodicals | `BOOKS_PERIODICALS` | 経費 | ✅ |
| 43 | 繰延資産償却 | Deferred Amortization | `DEFERRED_AMORTIZATION` | 経費 | ✅ |

### 個人 / Individual（target: individual）

| # | 日本語名 | 英語名 | ID | 科目分類 | 採用 |
|---|---------|--------|-----|---------|:----:|
| 44 | その他の預金 | Other Deposits | `OTHER_DEPOSIT` | 現金及び預金 | ✅ |
| 45 | 商品 | Merchandise | `MERCHANDISE` | 棚卸資産 | ✅ |
| 46 | 貯蔵品 | Stored Goods | `STORED_GOODS` | 棚卸資産 | ✅ |
| 47 | 材料 | Materials | `MATERIALS` | 棚卸資産 | ✅ |
| 48 | 仕掛品 | Work in Progress | `WORK_IN_PROGRESS` | 棚卸資産 | ✅ |
| 49 | 製品 | Products | `PRODUCTS` | 棚卸資産 | ✅ |
| 50 | 貸付金 | Loans | `LOANS` | その他流動資産 | ✅ |
| 51 | 立替金 | Advance Paid | `ADVANCE_PAID` | その他流動資産 | ✅ |
| 52 | 未収金 | Accrued Revenue | `ACCRUED_REVENUE` | その他流動資産 | ✅ |
| 53 | 工具器具備品 | Fixtures | `FIXTURES` | 有形固定資産 | ✅ |
| 54 | 機械装置 | Machinery | `MACHINERY` | 有形固定資産 | ✅ |
| 55 | 開業費 | Startup Costs | `STARTUP_COSTS` | 繰延資産 | ✅ |
| 56 | 事業主貸 | Owner's Drawing | `OWNER_DRAWING` | 事業主貸 | ✅ |
| 57 | 事業主借 | Owner's Investment | `OWNER_INVESTMENT` | 事業主借 | ✅ |
| 58 | 元入金 | Owner's Capital | `OWNER_CAPITAL` | 資本の部 | ✅ |
| 59 | 借入金 | Borrowings | `BORROWINGS` | その他流動負債 | ✅ |
| 60 | 貸倒引当金 | Allowance for Doubtful | `ALLOWANCE_DOUBTFUL` | その他流動負債 | ✅ |
| 61 | 未確定勘定 | Unconfirmed | `UNCONFIRMED` | 諸口 | ✅ |
| 62 | 売上値引・返品 | Sales Returns | `SALES_RETURNS` | 売上 | ✅ |
| 63 | 家事消費等 | Personal Consumption | `PERSONAL_CONSUMPTION` | 売上 | ✅ |
| 64 | 雑収入 | Misc Income | `MISC_INCOME` | 売上 | ✅ |
| 65 | 期首商品棚卸高 | Beginning Inventory | `BEGINNING_INVENTORY` | 売上原価 | ✅ |
| 66 | 仕入高 | Purchases | `PURCHASES` | 売上原価 | ✅ |
| 67 | 仕入値引・返品 | Purchase Returns | `PURCHASE_RETURNS` | 売上原価 | ✅ |
| 68 | 期末商品棚卸高 | Ending Inventory | `ENDING_INVENTORY` | 売上原価 | ✅ |
| 69 | 損害保険料 | Insurance | `INSURANCE` | 経費 | ✅ |
| 70 | 消耗品費 | Supplies | `SUPPLIES` | 経費 | ✅ |
| 71 | 給料賃金 | Wages | `WAGES` | 経費 | ✅ |
| 72 | 退職給与 | Retirement Pay | `RETIREMENT_PAY` | 経費 | ✅ |
| 73 | 外注工賃 | Outsourcing | `OUTSOURCING` | 経費 | ✅ |
| 74 | 利子割引料 | Interest & Discount | `INTEREST_DISCOUNT` | 経費 | ✅ |
| 75 | 貸倒金(損失) | Bad Debt Loss | `BAD_DEBT_LOSS` | 経費 | ✅ |
| 76 | 研修採用費 | Training | `TRAINING` | 経費 | ✅ |
| 77 | 貸倒引当金戻入 | Bad Debt Reversal | `BAD_DEBT_REVERSAL` | 繰戻額等 | ✅ |
| 78 | 専従者給与 | Family Employee Pay | `FAMILY_EMPLOYEE_PAY` | 繰入額等 | ✅ |
| 79 | 貸倒引当金繰入 | Bad Debt Provision | `BAD_DEBT_PROVISION` | 繰入額等 | ✅ |
| **不動産所得 / Real Estate** | | | | | |
| 80 | 賃貸料(不動産) | Rental Income | `RENTAL_INCOME` | 不動産収入 | ✅ |
| 81 | 礼金・権利金更新料 | Key Money & Renewal | `RENTAL_KEY_MONEY` | 不動産収入 | ✅ |
| 82 | 名義書換料その他 | Transfer Fee | `RENTAL_TRANSFER_FEE` | 不動産収入 | ✅ |
| 83 | 租税公課(不動産) | Rental Taxes | `RENTAL_TAXES` | 不動産経費 | ✅ |
| 84 | 損害保険料(不動産) | Rental Insurance | `RENTAL_INSURANCE` | 不動産経費 | ✅ |
| 85 | 修繕費(不動産) | Rental Repairs | `RENTAL_REPAIRS` | 不動産経費 | ✅ |
| 86 | 減価償却費(不動産) | Rental Depreciation | `RENTAL_DEPRECIATION` | 不動産経費 | ✅ |
| 87 | 借入金利子(不動産) | Rental Interest | `RENTAL_INTEREST` | 不動産経費 | ✅ |
| 88 | 地代家賃(不動産) | Rental Rent | `RENTAL_RENT` | 不動産経費 | ✅ |
| 89 | 給料賃金(不動産) | Rental Wages | `RENTAL_WAGES` | 不動産経費 | ✅ |
| 90 | 外注管理費(不動産) | Rental Outsourcing | `RENTAL_OUTSOURCING` | 不動産経費 | ✅ |
| 91 | 旅費交通費(不動産) | Rental Travel | `RENTAL_TRAVEL` | 不動産経費 | ✅ |
| 92 | 新聞図書費(不動産) | Rental Books | `RENTAL_BOOKS` | 不動産経費 | ✅ |
| 93 | その他の経費(不動産) | Rental Other | `RENTAL_OTHER` | 不動産経費 | ✅ |
| 94 | 専従者給与(不動産) | Rental Family Pay | `RENTAL_FAMILY_PAY` | 不動産経費 | ✅ |

### 法人 / Corporate（target: corp）

| # | 日本語名 | 英語名 | ID | 科目分類 | 採用 |
|---|---------|--------|-----|---------|:----:|
| 95 | その他の預金 | Other Deposits | `OTHER_DEPOSIT_CORP` | 現金及び預金 | ✅ |
| 96 | 商品 | Merchandise | `MERCHANDISE_CORP` | 棚卸資産 | ✅ |
| 97 | 製品 | Products | `PRODUCTS_CORP` | 棚卸資産 | ✅ |
| 98 | 材料 | Materials | `MATERIALS_CORP` | 棚卸資産 | ✅ |
| 99 | 仕掛品 | Work in Progress | `WORK_IN_PROGRESS_CORP` | 棚卸資産 | ✅ |
| 100 | 貯蔵品 | Stored Goods | `STORED_GOODS_CORP` | 棚卸資産 | ✅ |
| 101 | 前払費用 | Prepaid Expenses | `PREPAID_EXPENSES` | その他流動資産 | ✅ |
| 102 | 短期貸付金 | Short-term Loans | `SHORT_TERM_LOANS` | その他流動資産 | ✅ |
| 103 | 未収入金 | Accrued Revenue | `ACCRUED_REVENUE_CORP` | その他流動資産 | ✅ |
| 104 | 立替金 | Advance Paid | `ADVANCE_PAID_CORP` | その他流動資産 | ✅ |
| 105 | 貸倒引当金 | Allowance for Doubtful | `ALLOWANCE_DOUBTFUL_CORP` | その他流動資産 | ✅ |
| 106 | 建物附属設備 | Building Equipment | `BUILDING_EQUIPMENT_CORP` | 有形固定資産 | ✅ |
| 107 | 機械装置 | Machinery | `MACHINERY_CORP` | 有形固定資産 | ✅ |
| 108 | 器具備品 | Fixtures | `FIXTURES_CORP` | 有形固定資産 | ✅ |
| 109 | 建設仮勘定 | Construction in Progress | `CONSTRUCTION_IN_PROGRESS` | 有形固定資産 | ✅ |
| 110 | ソフトウェア | Software | `SOFTWARE` | 無形固定資産 | ✅ |
| 111 | 投資有価証券 | Investment Securities | `INVESTMENT_SECURITIES` | 投資その他 | ✅ |
| 112 | 長期貸付金 | Long-term Loans | `LONG_TERM_LOANS` | 投資その他 | ✅ |
| 113 | 長期前払費用 | Long-term Prepaid | `LONG_TERM_PREPAID` | 投資その他 | ✅ |
| 114 | 短期借入金 | Short-term Borrowings | `SHORT_TERM_BORROWINGS` | その他流動負債 | ✅ |
| 115 | 未払費用 | Accrued Liabilities | `ACCRUED_LIABILITIES` | その他流動負債 | ✅ |
| 116 | 役員借入金 | Officer Borrowings | `OFFICER_BORROWINGS` | 固定負債 | ✅ |
| 117 | 退職給付引当金 | Retirement Allowance | `RETIREMENT_ALLOWANCE` | 固定負債 | ✅ |
| 118 | 資本金 | Capital | `CAPITAL` | 純資産 | ✅ |
| 119 | 資本準備金 | Capital Reserve | `CAPITAL_RESERVE` | 純資産 | ✅ |
| 120 | 繰越利益剰余金 | Retained Earnings | `RETAINED_EARNINGS` | 純資産 | ✅ |
| 121 | 売上値引・返品 | Sales Returns | `SALES_RETURNS_CORP` | 売上 | ✅ |
| 122 | 外注費 | Outsourcing | `OUTSOURCING_CORP` | 売上原価 | ✅ |
| 123 | 仕入高 | Purchases | `PURCHASES_CORP` | 売上原価 | ✅ |
| 124 | 役員報酬 | Officer Compensation | `OFFICER_COMPENSATION` | 販管費 | ✅ |
| 125 | 給料手当 | Salaries | `SALARIES` | 販管費 | ✅ |
| 126 | 賞与 | Bonuses | `BONUSES` | 販管費 | ✅ |
| 127 | 通勤費 | Commuting | `COMMUTING` | 販管費 | ✅ |
| 128 | 消耗品費 | Supplies | `SUPPLIES_CORP` | 販管費 | ✅ |
| 129 | 保険料 | Insurance | `INSURANCE_CORP` | 販管費 | ✅ |
| 130 | 賃借料 | Lease | `LEASE_CORP` | 販管費 | ✅ |
| 131 | 諸会費 | Membership Fees | `MEMBERSHIP_FEES` | 販管費 | ✅ |
| 132 | 寄付金 | Donations | `DONATIONS` | 販管費 | ✅ |
| 133 | 貸倒引当金繰入額 | Bad Debt Provision | `BAD_DEBT_PROVISION_CORP` | 販管費 | ✅ |
| 134 | 貸倒損失 | Bad Debt Loss | `BAD_DEBT_LOSS_CORP` | 販管費 | ✅ |
| 135 | 受取利息 | Interest Income | `INTEREST_INCOME` | 営業外収益 | ✅ |
| 136 | 受取配当金 | Dividend Income | `DIVIDEND_INCOME` | 営業外収益 | ✅ |
| 137 | 雑収入 | Misc Income | `MISC_INCOME_CORP` | 営業外収益 | ✅ |
| 138 | 支払利息 | Interest Expense | `INTEREST_EXPENSE` | 営業外費用 | ✅ |
| 139 | 雑損失 | Misc Loss | `MISC_LOSS` | 営業外費用 | ✅ |

### MFにあって本システムにない科目 / Missing from Our System

| # | 日本語名 | 英語名 | 中分類 | target | 検討 |
|---|---------|--------|--------|:------:|:----:|
| 1 | 未払消費税 | Consumption Tax Payable | その他流動負債 | corp | 🔍 |
| 2 | 未払法人税等 | Corp Tax Payable | その他流動負債 | corp | 🔍 |
| 3 | 利益準備金 | Legal Reserve | 純資産 | corp | 🔍 |
| 4 | 社債 | Bonds | 固定負債 | corp | 🔍 |
| 5 | 固定資産売却益 | Gain on Sale of Fixed Assets | 特別利益 | corp | 🔍 |
| 6 | 固定資産売却損 | Loss on Sale of Fixed Assets | 特別損失 | corp | 🔍 |
| 7 | 事務用品費 | Office Supplies | 販管費 | corp | 🔍 |

## 変更履歴

| 日付 | 変更内容 |
|------|---------|
| 2026-03-22 | 初版作成（全139科目MF対比表） |
| 2026-03-29 | プロジェクトに移動 |
