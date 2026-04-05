# 全社用取引先マスタ（vendors_global）

> 作成日: 2026-04-05
> 目的: vendors_global.ts のソースデータ。業種68種対応（telecom/saas分割後）＋メタベンダー対応。完成（2026-04-05）。
> 正規化: 学習ワードは後工程で normalizeVendorName() にかけてnormalized_nameを生成する。
> 電話番号: 後工程で追加予定（現時点は空欄）。
> 勘定科目: ACCOUNT_MASTER ID（日本語名を括弧内に記載）。
> insufficient: 借方/貸方勘定科目が特定できず人間判断が必要なケース。
>
> **DL-026 T番号設計原則（2026-04-05確定）**:
> - T番号の目的: 取引先・サービス名の一意特定。税額控除確認は目的ではない
> - 同一T番号（同一法人）は1エントリに統合。サービス名は learning_words に列挙
> - t_numbers: [] = T番号不明（免税事業者・個人・未確認は税務上同一扱い）
> - 銀行明細・カード明細にはT番号記載なし → Layer 3（learning_words）が実質的な主力照合


---

## 凡例

| 記号 | 意味 |
|---|---|
| `※insufficient` | 購入内容不明のため人間判断。candidates 欄に候補科目を列挙 |
| `—` | 該当なし・空欄 |
| `corp` | 法人専用科目 |
| `indv` | 個人事業主専用科目 |

### 優先表示科目のルール

> **「借方勘定科目」欄に最初に記載した科目 = `expense[0]`（優先表示科目）**
> UIでユーザーに最初に提示されるデフォルト選択科目。
>
> **優先度**:
> ```
> Vendor.default_account  ← 取引先マスタの個別設定（最優先）
>   ↓ 未設定
> expense[0]              ← 業種デフォルト（VV確定値の先頭）
>   ↓ 複数候補（insufficient）
> expense[1], [2]...      ← UIで人間に選択させる
> ```

---

## 1. コンビニ等（convenience_store）

> VV確定: insufficient（expense: SUPPLIES_CORP→MEETING の順）。
> 優先表示科目 = `SUPPLIES_CORP`（消耗品費） = expense[0]。AI独自の候補は一切記載しない。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| セブンイレブン | T1010001088181 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | 課税仕入 | — | CASH（現金）/ ORDINARY_DEPOSIT（普通預金） | — | 対象外 | — |
| ファミリーマート | T2013301010706 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ローソン | T2010701019195 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ミニストップ | — | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| デイリーヤマザキ | — | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `SUPPLIES_CORP`（消耗品費）【優先表示科目 = expense[0]】: 文房具・消耗品・日用品
- `MEETING`（会議費）【expense[1]】: 食品・飲料・弁当（会議・打合せ用）

---

## 2. 電車（train）

> T1〜T3 は大手鉄道各社の本部T番号。IC決済の場合は領収書にT番号が印字されないケースあり。
> 旅費交通費（TRAVEL）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| JR西日本 | — | — | 出金 | — | TRAVEL（旅費交通費） | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| JR東日本 | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| JR東海 | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 近鉄（近畿日本鉄道） | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 阪急電鉄 | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 阪神電気鉄道 | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 大阪市高速電気軌道（大阪メトロ） | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 南海電気鉄道 | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 京阪電気鉄道 | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 東京メトロ | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 3. ガソリンスタンド（gas_station）

> VEHICLE_COSTS（車両費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ENEOS | — | — | 出金 | — | VEHICLE_COSTS（車両費） | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 出光 / apollostation | — | — | 出金 | — | VEHICLE_COSTS | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| コスモ石油 | — | — | 出金 | — | VEHICLE_COSTS | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 4. カフェ・喫茶店（cafe）— **A（一意確定）**

> VV確定: MEETING（会議費）に一意確定（vendor_vector_41_reference #2）。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| スターバックス コーヒー ジャパン | — | — | 出金 | — | MEETING（会議費） | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ドトールコーヒー | — | — | 出金 | — | MEETING | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| コメダ珈琲店 | — | — | 出金 | — | MEETING | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| タリーズコーヒー | — | — | 出金 | — | MEETING | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| サンマルクカフェ | — | — | 出金 | — | MEETING | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 5. タクシー（taxi）

> TRAVEL（旅費交通費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 梅田交通 | — | — | 出金 | — | TRAVEL（旅費交通費） | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 第一交通産業 | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 未来都（ミライト） | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 大阪MK（エムケイ） | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 近鉄タクシー | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 日本交通（大阪） | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 6. 水道・ガス・電力（utility）

> UTILITIES（水道光熱費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 関西電力 | — | — | 出金 | — | UTILITIES（水道光熱費） | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 東京電力 | — | — | 出金 | — | UTILITIES | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 中部電力 | — | — | 出金 | — | UTILITIES | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 大阪ガス | — | — | 出金 | — | UTILITIES | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 東京ガス | — | — | 出金 | — | UTILITIES | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 大阪市水道局 | — | — | 出金 | — | UTILITIES | — | 非課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 7. 物流・運送（logistics）

> PACKING_SHIPPING（荷造運賃）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ヤマト運輸 | — | — | 出金 | — | PACKING_SHIPPING（荷造運賃） | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 佐川急便 | — | — | 出金 | — | PACKING_SHIPPING | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 日本郵便 | — | — | 出金 | — | PACKING_SHIPPING | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 西濃運輸 | — | — | 出金 | — | PACKING_SHIPPING | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 福山通運 | — | — | 出金 | — | PACKING_SHIPPING | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 8. ホテル等（hotel）

> TRAVEL（旅費交通費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 東横イン | — | — | 出金 | — | TRAVEL（旅費交通費） | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| アパホテル | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ルートイン | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ドーミーイン | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| スーパーホテル | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 9a. 通信・インフラ（telecom）— **A（一意確定）**

> 携帯回線・固定回線・ISP等。COMMUNICATION（通信費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| NTTドコモ | — | — | 出金 | — | COMMUNICATION（通信費） | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| ソフトバンク | — | — | 出金 | — | COMMUNICATION | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| KDDI（au） | — | — | 出金 | — | COMMUNICATION | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 楽天モバイル | — | — | 出金 | — | COMMUNICATION | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| NTT東日本 | — | — | 出金 | — | COMMUNICATION | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| NTT西日本 | — | — | 出金 | — | COMMUNICATION | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |

## 9b. SaaS・クラウドサービス（saas）— insufficient

> AWS/Google/Microsoft等。COMMUNICATION or FEES（insufficient。リバースチャージ対象）。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Amazon Web Services Japan | — | — | 出金 | — | ※insufficient（COMMUNICATION / FEES） | — | 課税仕入（リバースチャージ対象） | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| Microsoft（Microsoft 365） | — | — | 出金 | — | ※insufficient（COMMUNICATION / FEES） | — | 課税仕入（リバースチャージ対象） | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| Google（Google Workspace） | — | — | 出金 | — | ※insufficient（COMMUNICATION / FEES） | — | 課税仕入（リバースチャージ対象） | — | ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 10. ドラッグストア（drugstore）— **A（一意確定）**

> VV確定: SUPPLIES_CORP（法人）/ SUPPLIES（個人）消耗品費に一意確定（vendor_vector_41_reference #8）。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| マツモトキヨシ | — | — | 出金 | — | SUPPLIES_CORP / SUPPLIES（消耗品費） | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| スギ薬局 | — | — | 出金 | — | SUPPLIES_CORP / SUPPLIES | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ウエルシア | — | — | 出金 | — | SUPPLIES_CORP / SUPPLIES | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| コスモス薬品 | — | — | 出金 | — | SUPPLIES_CORP / SUPPLIES | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ツルハ | — | — | 出金 | — | SUPPLIES_CORP / SUPPLIES | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 11. 駐車場（parking）— **A（一意確定）**

> VV確定: TRAVEL（旅費交通費）に一意確定（vendor_vector_41_reference #55）。契約駐車場はREAL_ESTATEや不動産会社の別エントリで管理。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| タイムズ | — | — | 出金 | — | TRAVEL（旅費交通費） | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 三井のリパーク | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| NPC24H | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| パラカ | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 12. 有料道路（highway）

> TRAVEL（旅費交通費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 東日本高速道路（NEXCO東日本） | — | — | 出金 | — | TRAVEL（旅費交通費） | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 中日本高速道路（NEXCO中日本） | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 西日本高速道路（NEXCO西日本） | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 首都高速道路 | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 阪神高速道路 | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 13. バス（bus）

> TRAVEL（旅費交通費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 大阪シティバス | — | — | 出金 | — | TRAVEL（旅費交通費） | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 近鉄バス | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 阪急バス | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 西日本JRバス | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 14. 飛行機・船（airline_ship）

> TRAVEL（旅費交通費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 全日本空輸（ANA） | — | — | 出金 | — | TRAVEL（旅費交通費） | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 日本航空（JAL） | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| ピーチ・アビエーション | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| ジェットスター・ジャパン | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| スカイマーク | — | — | 出金 | — | TRAVEL | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 15. 郵便局（post_office）

> 用途によりinsufficient。荷物発送はPACKING_SHIPPING、切手はCOMMUNICATION、貯金はFINANCIAL。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 日本郵便（郵便局） | — | — | 出金 | — | ※insufficient | — | — | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ゆうちょ銀行 | — | — | 出金/入金 | — | FINANCIAL（金融機関） | — | 対象外 | — | ORDINARY_DEPOSIT | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `COMMUNICATION`（通信費）【優先表示科目 = expense[0]】: 切手・書留・レターパック
- `FEES`（支払手数料）【expense[1]】: 各種手数料・ゆうパック等
- `TAXES_DUES`（租税公課）【expense[2]】: 印紙

---

## 16. 美容・エステ・クリーニング（beauty）— **A（一意確定）**

> VV確定: WELFARE（福利厚生費）に一意確定（vendor_vector_41_reference #22）。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QB HOUSE | — | — | 出金 | — | WELFARE（福利厚生費） | — | 課税仕入 | — | CASH | — | 対象外 | — |
| アースホールディングス | — | — | 出金 | — | WELFARE | — | 課税仕入 | — | CASH | — | 対象外 | — |
| 白洋舎（クリーニング） | — | — | 出金 | — | WELFARE | — | 課税仕入 | — | CASH | — | 対象外 | — |

---

## 17. 印刷（printing）— **A（一意確定）**

> VV確定: ADVERTISING（広告宣伝費）に一意確定（vendor_vector_41_reference #23）。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| キンコーズ（FedEx Kinko's） | — | — | 出金 | — | ADVERTISING（広告宣伝費） | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ラクスル | — | — | 出金 | — | ADVERTISING | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| プリントパック | — | — | 出金 | — | ADVERTISING | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| グラフィック | — | — | 出金 | — | ADVERTISING | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 18. 広告・マーケティング（advertising）

> ADVERTISING（広告宣伝費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Google（Google 広告） | — | — | 出金 | — | ADVERTISING（広告宣伝費） | — | 課税仕入（リバースチャージ） | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| Meta（Instagram/Facebook広告） | — | — | 出金 | — | ADVERTISING | — | 課税仕入（リバースチャージ） | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| Yahoo（Yahoo!広告） | — | — | 出金 | — | ADVERTISING | — | 課税仕入 | — | ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 19. 書籍（books）

> BOOKS_PERIODICALS（新聞図書費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 丸善・ジュンク堂書店 | — | — | 出金 | — | BOOKS_PERIODICALS（新聞図書費） | — | 軽減税率仕入（8%） | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 紀伊國屋書店 | — | — | 出金 | — | BOOKS_PERIODICALS | — | 軽減税率仕入（8%） | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 楽天ブックス | — | — | 出金 | — | BOOKS_PERIODICALS | — | 軽減税率仕入（8%） | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| Amazon（書籍） | — | — | 出金 | — | BOOKS_PERIODICALS | — | 軽減税率仕入（8%） | — | ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 20. 文具（stationery）

> SUPPLIES_CORP / SUPPLIES（消耗品費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| LOFT | — | — | 出金 | — | SUPPLIES_CORP / SUPPLIES（消耗品費） | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 東急ハンズ | — | — | 出金 | — | SUPPLIES_CORP / SUPPLIES | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| コクヨ | — | — | 出金 | — | SUPPLIES_CORP / SUPPLIES | — | 課税仕入 | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## A. メタベンダー（後工程）

> 業種確定不能ベンダー。法人サービス別に独立エントリを設ける方針。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 備考 |
|---|---|---|---|---|---|---|
| Amazon.co.jp（物販） | — | — | 出金 | — | ※insufficient | ECモール物販。購入品目で科目変動 |
| Amazon Web Services Japan | — | — | 出金 | — | COMMUNICATION | telecom_saas確定 |
| Amazon Music | — | — | 出金 | — | ※insufficient | cinema_music候補だが用途不明 |
| 楽天市場 | — | — | 出金 | — | ※insufficient | ECモール物販 |
| 楽天トラベル | — | — | 出金 | — | TRAVEL | hotel/travel_agencyに確定 |
| Google Workspace | — | — | 出金 | — | COMMUNICATION | telecom_saas確定 |
| Google 広告 | — | — | 出金 | — | ADVERTISING | advertising確定 |
| Microsoft 365 | — | — | 出金 | — | COMMUNICATION | telecom_saas確定 |
| PayPay | — | — | 出金 | — | ※insufficient | 元取引先隠蔽。platform/人間判断 |

---

## 21. レストラン・居酒屋（restaurant）

> VV確定: insufficient（expense: MEETING → ENTERTAINMENT の順）。
> 優先表示科目 = `MEETING`（会議費） = expense[0]。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| すかいらーく（ガスト・バーミヤン等） | T4010001055084 | — | 出金 | — | ※insufficient（MEETING / ENTERTAINMENT） | — | ← ACCT[MEETING].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 串カツ田中 | T3011001072484 | — | 出金 | — | ※insufficient（MEETING / ENTERTAINMENT） | — | ← ACCT[MEETING].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ワタミ（和民・鳥メロ等） | T3120001076468 | — | 出金 | — | ※insufficient（MEETING / ENTERTAINMENT） | — | ← ACCT[MEETING].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 大庄（庄や・日本海庄や等） | T5010001073025 | — | 出金 | — | ※insufficient（MEETING / ENTERTAINMENT） | — | ← ACCT[MEETING].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| コロワイド（甘太郎・牛角等） | T9011001071428 | — | 出金 | — | ※insufficient（MEETING / ENTERTAINMENT） | — | ← ACCT[MEETING].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `MEETING`（会議費）【優先表示科目 = expense[0]】: 打合せ・会議での飲食
- `ENTERTAINMENT`（接待交際費）【expense[1]】: 顧客・取引先との接待

---

## 22. 食品・食材・飲料（food_market）

> VV確定: insufficient（expense: MEETING → PURCHASES_CORP の順）。
> 優先表示科目 = `MEETING`（会議費） = expense[0]。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| コカ・コーラ ボトラーズジャパン | T9011001000067 | — | 出金 | — | ※insufficient（MEETING / PURCHASES_CORP） | — | ← ACCT[MEETING].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| キリンビバレッジ | T5010001020879 | — | 出金 | — | ※insufficient（MEETING / PURCHASES_CORP） | — | ← ACCT[MEETING].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| UCC上島珈琲 | T7140001003756 | — | 出金 | — | ※insufficient（MEETING / PURCHASES_CORP） | — | ← ACCT[MEETING].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `MEETING`（会議費）【優先表示科目 = expense[0]】: 会議・打合せ用の飲料・食品購入
- `PURCHASES_CORP`（仕入高）【expense[1]】: 商品・材料として仕入れる場合

---

## 23. スーパー・デパート（supermarket）

> VV確定: insufficient（expense: SUPPLIES_CORP → PURCHASES_CORP の順）。
> 優先表示科目 = `SUPPLIES_CORP`（消耗品費） = expense[0]。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| イオン | T6260001019869 | — | 出金 | — | ※insufficient（SUPPLIES_CORP / PURCHASES_CORP） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| イトーヨーカ堂 | T2011001025514 | — | 出金 | — | ※insufficient（SUPPLIES_CORP / PURCHASES_CORP） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 阪急オアシス | — | — | 出金 | — | ※insufficient（SUPPLIES_CORP / PURCHASES_CORP） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 近鉄百貨店 | T7120001016540 | — | 出金 | — | ※insufficient（SUPPLIES_CORP / PURCHASES_CORP） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 高島屋 | T7130001007490 | — | 出金 | — | ※insufficient（SUPPLIES_CORP / PURCHASES_CORP） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `SUPPLIES_CORP`（消耗品費）【優先表示科目 = expense[0]】: 事務用品・清掃用品等
- `PURCHASES_CORP`（仕入高）【expense[1]】: 商品・材料として仕入れる場合

---

## 24. 雑貨・生活用品（general_goods）— **A（一意確定）**

> VV確定: SUPPLIES_CORP（消耗品費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ニトリ | T8011001027505 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 無印良品（良品計画） | T5011001009767 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| IKEAジャパン | T3010001131748 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| セリア | T6200001015022 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ダイソー | T3120001015368 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 25. おみやげ（souvenir）— **A（一意確定）**

> VV確定: ENTERTAINMENT（接待交際費）に一意確定。事業関連のおみやげ・贈答品は接待交際費。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 空港免税店（ANA FESTA等） | — | — | 出金 | — | ENTERTAINMENT（接待交際費） | — | ← ACCT[ENTERTAINMENT].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 伊勢丹（土産売り場） | — | — | 出金 | — | ENTERTAINMENT（接待交際費） | — | ← ACCT[ENTERTAINMENT].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 26. 衣類・靴・カバン（apparel）— **A（一意確定）**

> VV確定: SUPPLIES_CORP（消耗品費）に一意確定。業務用ユニフォーム・作業着等。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ユニクロ（ファーストリテイリング） | T7210001014144 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ワークマン | T7100001014817 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ミドリ安全（安全靴・作業服） | T6010001012094 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 27. 化粧品類（cosmetics）— **A（一意確定）**

> VV確定: SUPPLIES_CORP（消耗品費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 資生堂 | T4011001004597 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| コーセー | T8011001005118 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ロレアル（日本法人） | T4010001078432 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 28. 家電量販店（electronics）

> VV確定: insufficient（expense: SUPPLIES_CORP → FIXTURES_CORP → PURCHASES_CORP の順）。
> 優先表示科目 = `SUPPLIES_CORP`（消耗品費） = expense[0]。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ヨドバシカメラ | T2011001024804 | — | 出金 | — | ※insufficient（SUPPLIES_CORP / FIXTURES_CORP / PURCHASES_CORP） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ビックカメラ | T7011001021993 | — | 出金 | — | ※insufficient（SUPPLIES_CORP / FIXTURES_CORP / PURCHASES_CORP） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ケーズデンキ | T7050001004403 | — | 出金 | — | ※insufficient（SUPPLIES_CORP / FIXTURES_CORP / PURCHASES_CORP） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| エディオン | T5120001051893 | — | 出金 | — | ※insufficient（SUPPLIES_CORP / FIXTURES_CORP / PURCHASES_CORP） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ジョーシン（上新電機） | T7120001016427 | — | 出金 | — | ※insufficient（SUPPLIES_CORP / FIXTURES_CORP / PURCHASES_CORP） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `SUPPLIES_CORP`（消耗品費）【優先表示科目 = expense[0]】: 10万円未満のPC周辺機器・小型家電
- `FIXTURES_CORP`（什器備品）【expense[1]】: 10万円以上の資産計上対象（PC・カメラ等）
- `PURCHASES_CORP`（仕入高）【expense[2]】: 商品として仕入れる場合

---

## 29. 自転車販売（bicycle）— **A（一意確定）**

> VV確定: SUPPLIES_CORP（消耗品費）に一意確定。業務用配達自転車等。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| あさひ（サイクルベースあさひ） | T7130001006754 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| イオンバイク | — | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 30. スポーツ用品（sports_goods）— **A（一意確定）**

> VV確定: SUPPLIES_CORP（消耗品費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ゼビオ | T5011001026823 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| アルペン | T7230001037483 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| スポーツオーソリティ | — | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 31. CD・DVD販売（media_disc）— **A（一意確定）**

> VV確定: SUPPLIES_CORP（消耗品費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| タワーレコード | T6011001054891 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| HMVジャパン | — | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 32. 貴金属・アクセサリー・時計（jewelry）

> VV確定: insufficient（expense: SUPPLIES_CORP → ENTERTAINMENT の順）。
> 優先表示科目 = `SUPPLIES_CORP`（消耗品費） = expense[0]。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 大丸松坂屋（ジュエリー） | — | — | 出金 | — | ※insufficient（SUPPLIES_CORP / ENTERTAINMENT） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ベルーナ | T5010001022025 | — | 出金 | — | ※insufficient（SUPPLIES_CORP / ENTERTAINMENT） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `SUPPLIES_CORP`（消耗品費）【優先表示科目 = expense[0]】: 業務用小物・名刺入れ等
- `ENTERTAINMENT`（接待交際費）【expense[1]】: 贈答品・記念品

---

## 33. 生花店（florist）— **A（一意確定）**

> VV確定: ENTERTAINMENT（接待交際費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 日比谷花壇 | T4011001022041 | — | 出金 | — | ENTERTAINMENT（接待交際費） | — | ← ACCT[ENTERTAINMENT].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 青山フラワーマーケット | T4011001088183 | — | 出金 | — | ENTERTAINMENT（接待交際費） | — | ← ACCT[ENTERTAINMENT].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 34. 自動車バイク販売・修理（auto_dealer）

> VV確定: insufficient（expense: VEHICLE_COSTS → REPAIRS の順）。
> 優先表示科目 = `VEHICLE_COSTS`（車両費） = expense[0]。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| トヨタカローラ（販売店） | — | — | 出金 | — | ※insufficient（VEHICLE_COSTS / REPAIRS） | — | ← ACCT[VEHICLE_COSTS].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ホンダカーズ（販売店） | — | — | 出金 | — | ※insufficient（VEHICLE_COSTS / REPAIRS） | — | ← ACCT[VEHICLE_COSTS].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| カーコンビニ倶楽部 | T5011001034851 | — | 出金 | — | ※insufficient（VEHICLE_COSTS / REPAIRS） | — | ← ACCT[VEHICLE_COSTS].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `VEHICLE_COSTS`（車両費）【優先表示科目 = expense[0]】: 車検・整備・修理
- `REPAIRS`（修繕費）【expense[1]】: 業務用車両の大規模修理

## 35. 自動車バイク用品（auto_parts）— **A（一意確定）**

> VV確定: VEHICLE_COSTS（車両費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| オートバックス | T6011001009993 | — | 出金 | — | VEHICLE_COSTS（車両費） | — | ← ACCT[VEHICLE_COSTS].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| イエローハット | T7011001025847 | — | 出金 | — | VEHICLE_COSTS（車両費） | — | ← ACCT[VEHICLE_COSTS].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 36. 建築材料販売（building_materials）— **A（一意確定）**

> VV確定: SUPPLIES_CORP（消耗品費）に一意確定。ホームセンター・資材販売。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| コメリ | T6110001014340 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| カインズ | T3010001119474 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| コーナン | T3120001018116 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 37. ゴミ処理・廃棄物（waste）— **A（一意確定）**

> VV確定: FEES（支払手数料）に一意確定。産業廃棄物処理・一般廃棄物回収。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 大栄環境 | T9120001052897 | — | 出金 | — | FEES（支払手数料） | — | ← ACCT[FEES].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 市区町村廃棄物処理 | — | — | 出金 | — | FEES（支払手数料） | — | ← ACCT[FEES].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 38. ITサービス（it_service）

> VV確定: insufficient（expense: COMMUNICATION → FEES の順）。
> 優先表示科目 = `COMMUNICATION`（通信費） = expense[0]。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| freee（フリー） | T1011001094196 | — | 出金 | — | ※insufficient（COMMUNICATION / FEES） | — | ← ACCT[COMMUNICATION].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| マネーフォワード | T4011001082640 | — | 出金 | — | ※insufficient（COMMUNICATION / FEES） | — | ← ACCT[COMMUNICATION].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| Zoom Video Communications | — | — | 出金 | — | ※insufficient（COMMUNICATION / FEES） | — | ← ACCT[COMMUNICATION].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `COMMUNICATION`（通信費）【優先表示科目 = expense[0]】: SaaSライセンス・月額サービス
- `FEES`（支払手数料）【expense[1]】: 保守・サポート・単発コンサル料

---

## 39. 研修・各種スクール（education）— **A（一意確定）**

> VV確定: TRAINING（研修費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| リクルートマネジメントソリューションズ | T4011001097823 | — | 出金 | — | TRAINING（研修費） | — | ← ACCT[TRAINING].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 産業能率大学（研修） | T5010001009124 | — | 出金 | — | TRAINING（研修費） | — | ← ACCT[TRAINING].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| ユーキャン | T2011001052810 | — | 出金 | — | TRAINING（研修費） | — | ← ACCT[TRAINING].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 40. アウトソーシング（outsourcing）— **A（一意確定）**

> VV確定: OUTSOURCING_CORP（外注費）に一意確定。業務委託・BPO。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| トランスコスモス | T5011001055994 | — | 出金 | — | OUTSOURCING_CORP（外注費） | — | ← ACCT[OUTSOURCING_CORP].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| ベルシステム24 | T6011001018017 | — | 出金 | — | OUTSOURCING_CORP（外注費） | — | ← ACCT[OUTSOURCING_CORP].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 41. リース・レンタル（lease_rental）

> VV確定: insufficient（expense: LEASE_CORP → LEASE の順）。
> 優先表示科目 = `LEASE_CORP`（リース料・法人） = expense[0]。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| オリックス（リース部門） | T8014001062765 | — | 出金 | — | ※insufficient（LEASE_CORP / LEASE） | — | ← ACCT[LEASE_CORP].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| リコーリース | T8010001022012 | — | 出金 | — | ※insufficient（LEASE_CORP / LEASE） | — | ← ACCT[LEASE_CORP].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 日本通運（レンタル部門） | — | — | 出金 | — | ※insufficient（LEASE_CORP / LEASE） | — | ← ACCT[LEASE_CORP].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `LEASE_CORP`（リース料・法人）【優先表示科目 = expense[0]】: 法人向け機器・車両リース
- `LEASE`（リース料）【expense[1]】: 個人事業主向け

---

## 42. 人材派遣（staffing）— **A（一意確定）**

> VV確定: OUTSOURCING_CORP（外注費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| パーソルテンプスタッフ | T6010001134984 | — | 出金 | — | OUTSOURCING_CORP（外注費） | — | ← ACCT[OUTSOURCING_CORP].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| リクルートスタッフィング | T6011001077618 | — | 出金 | — | OUTSOURCING_CORP（外注費） | — | ← ACCT[OUTSOURCING_CORP].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| スタッフサービス | T8011001002576 | — | 出金 | — | OUTSOURCING_CORP（外注費） | — | ← ACCT[OUTSOURCING_CORP].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 43. カメラ・DPE（camera_dpe）— **A（一意確定）**

> VV確定: SUPPLIES_CORP（消耗品費）に一意確定。写真現像・プリント・撮影機材等。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| カメラのキタムラ | T4230001006234 | — | 出金 | — | SUPPLIES_CORP（消耗品費） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 44. 仏壇・仏事（funeral）— **A（一意確定）**

> VV確定: ENTERTAINMENT（接待交際費）に一意確定。香典・供花等、事業関連の仏事費用。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 小さなお葬式 | T4011001115316 | — | 出金 | — | ENTERTAINMENT（接待交際費） | — | ← ACCT[ENTERTAINMENT].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| イオンのお葬式 | — | — | 出金 | — | ENTERTAINMENT（接待交際費） | — | ← ACCT[ENTERTAINMENT].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 45. プラットフォーム（platform）

> VV確定: insufficient（expense: FEES → ADVERTISING の順。income: SALES）。
> 優先表示科目 = `FEES`（支払手数料） = expense[0]。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| メルカリ | T5011001093297 | — | 出金/入金 | — | ※insufficient（FEES / ADVERTISING） | — | ← ACCT[FEES].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| ヤフーオークション（Yahoo!） | T3010001022680 | — | 出金/入金 | — | ※insufficient（FEES / ADVERTISING） | — | ← ACCT[FEES].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `FEES`（支払手数料）【優先表示科目 = expense[0]】: プラットフォーム手数料
- `ADVERTISING`（広告宣伝費）【expense[1]】: プラットフォーム内広告出稿
- `SALES`（売上）【income[0]】: 商品販売の入金

---

## 46. ECサイト（ec_site）

> VV確定: insufficient（expense: SUPPLIES_CORP → PURCHASES_CORP → ADVERTISING の順）。
> 優先表示科目 = `SUPPLIES_CORP`（消耗品費） = expense[0]。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Amazon.co.jp（物販） | — | — | 出金 | — | ※insufficient（SUPPLIES_CORP / PURCHASES_CORP / ADVERTISING） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 楽天市場 | T2130001010758 | — | 出金 | — | ※insufficient（SUPPLIES_CORP / PURCHASES_CORP / ADVERTISING） | — | ← ACCT[SUPPLIES_CORP].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `SUPPLIES_CORP`（消耗品費）【優先表示科目 = expense[0]】: 事務用品・消耗品購入
- `PURCHASES_CORP`（仕入高）【expense[1]】: 商品・材料として仕入れる場合
- `ADVERTISING`（広告宣伝費）【expense[2]】: 広告出稿料

---

## 47. コンサルティング・顧問（consulting）

> VV確定: insufficient（expense: FEES → OUTSOURCING_CORP の順）。
> 優先表示科目 = `FEES`（支払手数料） = expense[0]。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| デロイト トーマツ | T6010001132063 | — | 出金 | — | ※insufficient（FEES / OUTSOURCING_CORP） | — | ← ACCT[FEES].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| PwCジャパン | T6010001127278 | — | 出金 | — | ※insufficient（FEES / OUTSOURCING_CORP） | — | ← ACCT[FEES].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `FEES`（支払手数料）【優先表示科目 = expense[0]】: コンサル料・顧問料（単発・定額）
- `OUTSOURCING_CORP`（外注費）【expense[1]】: 業務委託として継続的に発注している場合

---

## 48. 士業（legal_firm）— **A（一意確定）**

> VV確定: FEES（支払手数料）に一意確定。弁護士・税理士・司法書士・行政書士等。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 弁護士法人○○ | — | — | 出金 | — | FEES（支払手数料） | — | ← ACCT[FEES].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 税理士法人○○ | — | — | 出金 | — | FEES（支払手数料） | — | ← ACCT[FEES].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 司法書士○○事務所 | — | — | 出金 | — | FEES（支払手数料） | — | ← ACCT[FEES].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 49. 工事業・建設住宅（construction）— **A（一意確定）**

> VV確定: OUTSOURCING_CORP（外注費）に一意確定。建設・内装・設備工事等。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 大和ハウス工業 | T6047001008737 | — | 出金 | — | OUTSOURCING_CORP（外注費） | — | ← ACCT[OUTSOURCING_CORP].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 積水ハウス | T8120001091605 | — | 出金 | — | OUTSOURCING_CORP（外注費） | — | ← ACCT[OUTSOURCING_CORP].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 地域工務店・ゼネコン | — | — | 出金 | — | OUTSOURCING_CORP（外注費） | — | ← ACCT[OUTSOURCING_CORP].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 50. 不動産（real_estate）

> VV確定: insufficient（expense: RENT → REPAIRS の順）。
> 優先表示科目 = `RENT`（地代家賃） = expense[0]。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 三井不動産リアルティ | T8010001027355 | — | 出金 | — | ※insufficient（RENT / REPAIRS） | — | ← ACCT[RENT].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 大東建託 | T8450001012640 | — | 出金 | — | ※insufficient（RENT / REPAIRS） | — | ← ACCT[RENT].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 地域不動産管理会社 | — | — | 出金 | — | ※insufficient（RENT / REPAIRS） | — | ← ACCT[RENT].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `RENT`（地代家賃）【優先表示科目 = expense[0]】: 事務所・倉庫・駐車場の賃借料
- `REPAIRS`（修繕費）【expense[1]】: 原状回復工事・修繕費

---

## 51. 保険会社（insurance）— **A（一意確定）**

> VV確定: INSURANCE_CORP（保険料・法人）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 東京海上日動火災保険 | T6010001020897 | — | 出金 | — | INSURANCE_CORP（保険料・法人） | — | ← ACCT[INSURANCE_CORP].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 損害保険ジャパン | T2010001020613 | — | 出金 | — | INSURANCE_CORP（保険料・法人） | — | ← ACCT[INSURANCE_CORP].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 日本生命保険 | T7140001007161 | — | 出金 | — | INSURANCE_CORP（保険料・法人） | — | ← ACCT[INSURANCE_CORP].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 52. ゴルフ場等（entertainment）

> VV確定: insufficient（expense: ENTERTAINMENT → WELFARE の順）。
> 優先表示科目 = `ENTERTAINMENT`（接待交際費） = expense[0]。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PGMホールディングス（ゴルフ場） | T6010001108367 | — | 出金 | — | ※insufficient（ENTERTAINMENT / WELFARE） | — | ← ACCT[ENTERTAINMENT].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| アコーディア・ゴルフ | T5010001098698 | — | 出金 | — | ※insufficient（ENTERTAINMENT / WELFARE） | — | ← ACCT[ENTERTAINMENT].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `ENTERTAINMENT`（接待交際費）【優先表示科目 = expense[0]】: 顧客・取引先との接待ゴルフ
- `WELFARE`（福利厚生費）【expense[1]】: 従業員向け社内イベント

## 53. 娯楽施設・スポーツ施設（leisure）

> VV確定: insufficient（expense: WELFARE → ENTERTAINMENT の順）。
> 優先表示科目 = `WELFARE`（福利厚生費） = expense[0]。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ラウンドワン | T9120001085040 | — | 出金 | — | ※insufficient（WELFARE / ENTERTAINMENT） | — | ← ACCT[WELFARE].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| コナミスポーツクラブ | T9010001017498 | — | 出金 | — | ※insufficient（WELFARE / ENTERTAINMENT） | — | ← ACCT[WELFARE].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `WELFARE`（福利厚生費）【優先表示科目 = expense[0]】: 従業員向け福利厚生利用
- `ENTERTAINMENT`（接待交際費）【expense[1]】: 顧客・取引先との接待利用

---

## 54. 映画・音楽（cinema_music）— **A（一意確定）**

> VV確定: ENTERTAINMENT（接待交際費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TOHOシネマズ | T7011001024609 | — | 出金 | — | ENTERTAINMENT（接待交際費） | — | ← ACCT[ENTERTAINMENT].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| イオンシネマ | — | — | 出金 | — | ENTERTAINMENT（接待交際費） | — | ← ACCT[ENTERTAINMENT].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 55. 温泉・銭湯（spa）— **A（一意確定）**

> VV確定: WELFARE（福利厚生費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| スーパー銭湯（地域施設） | — | — | 出金 | — | WELFARE（福利厚生費） | — | ← ACCT[WELFARE].defaultTaxCategoryId | — | CASH | — | 対象外 | — |
| ニフティ温泉（予約サイト） | — | — | 出金 | — | WELFARE（福利厚生費） | — | ← ACCT[WELFARE].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 56. 旅行代理店（travel_agency）— **A（一意確定）**

> VV確定: TRAVEL（旅費交通費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| JTB | T6010001019916 | — | 出金 | — | TRAVEL（旅費交通費） | — | ← ACCT[TRAVEL].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| HIS | T3010001022476 | — | 出金 | — | TRAVEL（旅費交通費） | — | ← ACCT[TRAVEL].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 楽天トラベル | — | — | 出金 | — | TRAVEL（旅費交通費） | — | ← ACCT[TRAVEL].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 57. レンタカー（rental_car）— **A（一意確定）**

> VV確定: TRAVEL（旅費交通費）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| トヨタレンタカー | — | — | 出金 | — | TRAVEL（旅費交通費） | — | ← ACCT[TRAVEL].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| ニッポンレンタカー | T8010001024007 | — | 出金 | — | TRAVEL（旅費交通費） | — | ← ACCT[TRAVEL].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| オリックスレンタカー | — | — | 出金 | — | TRAVEL（旅費交通費） | — | ← ACCT[TRAVEL].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 58. 官公庁・税金（government）

> VV確定: insufficient（expense: TAXES_DUES（租税公課）→ FEES（支払手数料）→ LEGAL_WELFARE（法定福利費）の順。income: MISC_INCOME_CORP（雑収入・法人））。
> 優先表示科目 = `TAXES_DUES`（租税公課） = expense[0]。
> ▶ SUBSIDY_INCOME（補助金収入）は ACCOUNT_MASTER（勘定科目マスタ）に存在しない。「存在しない」ことが正しい設計。二度と追加するな。補助金入金は MISC_INCOME_CORP（雑収入・法人）で処理する。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 国税局（法人税等納付） | — | — | 出金 | — | ※insufficient（TAXES_DUES / FEES / LEGAL_WELFARE） | — | ← ACCT[TAXES_DUES].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 都道府県税事務所 | — | — | 出金 | — | ※insufficient（TAXES_DUES / FEES / LEGAL_WELFARE） | — | ← ACCT[TAXES_DUES].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 市区町村役所（住民税等） | — | — | 出金 | — | ※insufficient（TAXES_DUES / FEES / LEGAL_WELFARE） | — | ← ACCT[TAXES_DUES].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `TAXES_DUES`（租税公課）【優先表示科目 = expense[0]】: 固定資産税・印紙税・登録免許税
- `FEES`（支払手数料）【expense[1]】: 各種証明書取得手数料
- `LEGAL_WELFARE`（法定福利費）【expense[2]】: 社会保険料関連

---

## 59. 社会保険（social_insurance）— **A（一意確定）**

> VV確定: LEGAL_WELFARE（法定福利費）に一意確定。健康保険・厚生年金・雇用保険等。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 日本年金機構 | T2021005008540 | — | 出金 | — | LEGAL_WELFARE（法定福利費） | — | ← ACCT[LEGAL_WELFARE].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 全国健康保険協会（協会けんぽ） | T7010005009767 | — | 出金 | — | LEGAL_WELFARE（法定福利費） | — | ← ACCT[LEGAL_WELFARE].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 60. 医院・病院（medical）— **A（一意確定）**

> VV確定: WELFARE（福利厚生費）に一意確定。健康診断・予防接種等、業務関連の医療費。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 一般社団法人○○医院 | — | — | 出金 | — | WELFARE（福利厚生費） | — | ← ACCT[WELFARE].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |
| 健診センター | — | — | 出金 | — | WELFARE（福利厚生費） | — | ← ACCT[WELFARE].defaultTaxCategoryId | — | CASH / ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 61. 神社・教会等（religious）

> VV確定: insufficient（expense: DONATIONS → MEMBERSHIP_FEES → FEES の順）。
> 優先表示科目 = `DONATIONS`（寄付金） = expense[0]。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ○○神社（初穂料・玉串料） | — | — | 出金 | — | ※insufficient（DONATIONS / MEMBERSHIP_FEES / FEES） | — | ← ACCT[DONATIONS].defaultTaxCategoryId | — | CASH | — | 対象外 | — |
| 宗教法人○○ | — | — | 出金 | — | ※insufficient（DONATIONS / MEMBERSHIP_FEES / FEES） | — | ← ACCT[DONATIONS].defaultTaxCategoryId | — | CASH | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `DONATIONS`（寄付金）【優先表示科目 = expense[0]】: 初穂料・玉串料・献金
- `MEMBERSHIP_FEES`（会費）【expense[1]】: 氏子会費・教会会費
- `FEES`（支払手数料）【expense[2]】: 各種式典費用

---

## 62. 金融機関・銀行（financial）

> VV確定: insufficient（expense: LONG_TERM_BORROWINGS → INTEREST_EXPENSE → FEES の順）。
> 優先表示科目 = `LONG_TERM_BORROWINGS`（長期借入金） = expense[0]。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 三菱UFJ銀行 | T0200001008417 | — | 出金/入金 | — | ※insufficient（LONG_TERM_BORROWINGS / INTEREST_EXPENSE / FEES） | — | ← ACCT[LONG_TERM_BORROWINGS].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| みずほ銀行 | T6010001027262 | — | 出金/入金 | — | ※insufficient（LONG_TERM_BORROWINGS / INTEREST_EXPENSE / FEES） | — | ← ACCT[LONG_TERM_BORROWINGS].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| 地方銀行（信用金庫含む） | — | — | 出金/入金 | — | ※insufficient（LONG_TERM_BORROWINGS / INTEREST_EXPENSE / FEES） | — | ← ACCT[LONG_TERM_BORROWINGS].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `LONG_TERM_BORROWINGS`（長期借入金）【優先表示科目 = expense[0]】: 借入金返済元本
- `INTEREST_EXPENSE`（支払利息）【expense[1]】: ローン利息
- `FEES`（支払手数料）【expense[2]】: 振込手数料・口座維持手数料

---

## 63. 個人名（individual）

> VV確定: insufficient（expense多数）。⚠️ NEW_INDIVIDUAL_VENDOR警告: 初回の個人取引先は要注意。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 山田太郎（個人名） | — | — | 出金/入金 | — | ※insufficient | — | — | — | ORDINARY_DEPOSIT | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `OUTSOURCING_CORP`（外注費）【優先表示科目 = expense[0]】: フリーランス業務委託
- `SALARIES`（給料手当）【expense[1]】: 給与支払
- `OFFICER_COMPENSATION`（役員報酬）【expense[2]】: 役員への支払

---

## 64. 卸売（wholesale）— **A（一意確定）**

> VV確定: PURCHASES_CORP（仕入高）に一意確定。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ○○卸売センター | — | — | 出金 | — | PURCHASES_CORP（仕入高） | — | ← ACCT[PURCHASES_CORP].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| ○○問屋 | — | — | 出金 | — | PURCHASES_CORP（仕入高） | — | ← ACCT[PURCHASES_CORP].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |

---

## 65. 会費・親睦会（association）

> VV確定: insufficient（expense: MEMBERSHIP_FEES → ENTERTAINMENT の順）。
> 優先表示科目 = `MEMBERSHIP_FEES`（会費） = expense[0]。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 借方補助科目 | 借方税区分 | 借方部門 | 貸方勘定科目 | 貸方補助科目 | 貸方税区分 | 貸方部門 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ○○商工会議所 | — | — | 出金 | — | ※insufficient（MEMBERSHIP_FEES / ENTERTAINMENT） | — | ← ACCT[MEMBERSHIP_FEES].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| ○○業界団体 | — | — | 出金 | — | ※insufficient（MEMBERSHIP_FEES / ENTERTAINMENT） | — | ← ACCT[MEMBERSHIP_FEES].defaultTaxCategoryId | — | ORDINARY_DEPOSIT | — | 対象外 | — |
| ○○親睦会・同窓会 | — | — | 出金 | — | ※insufficient（MEMBERSHIP_FEES / ENTERTAINMENT） | — | ← ACCT[MEMBERSHIP_FEES].defaultTaxCategoryId | — | CASH | — | 対象外 | — |

**candidates（insufficient時の優先順位 = TS expense[]準拠）**:
- `MEMBERSHIP_FEES`（会費）【優先表示科目 = expense[0]】: 業界団体・商工会年会費
- `ENTERTAINMENT`（接待交際費）【expense[1]】: 親睦会・懇親会の会費

---

## 66. 不明（unknown）

> VV確定: insufficient（業種特定不能）。Layer 4でGeminiが降参宣言した業種。
> ⚠️ UNKNOWN_VENDOR警告が発動する。expense[]は空配列—科目全て人間判断。

| 学習ワード | T番号 | 電話番号 | 入金/出金 | 金額 | 借方勘定科目 | 備考 |
|---|---|---|---|---|---|---|
| （業種不明取引先） | — | — | 出金/入金 | — | ※insufficient（全科目人間判断） | Layer 4で`'unknown'`が返された先 |

---

*全68業種の記載完了（2026-04-05）*
