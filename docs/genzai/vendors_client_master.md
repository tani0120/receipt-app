# 【個別顧問先用】取引先マスタ（vendors_client）

> ⚠️ このファイルは **個別顧問先ごとにカスタマイズ**するためのマスタです。
> 全社共通の雛形は `vendors_global_master.md` を参照してください。
>
> 作成日: 2026-04-05
> 最終更新: 2026-04-06
> 目的: vendors_client.ts のソースデータ。顧問先固有の勘定科目・補助科目・部門を上書き設定する。
> 照合キー: `normalizeVendorName()` で自動導出した `match_key` を照合に使用。
> 電話番号: 後工程で追加予定（現時点は空欄）。
> 勘定科目: ACCOUNT_MASTER ID（日本語名を括弧内に記載）。
> insufficient: 借方/貸方勘定科目が特定できず人間判断が必要なケース。
> 優先度: このファイルの設定 > vendors_global_master.md の設定（顧問先設定が最優先）。
>
> **DL-027 照合キー（match_key）設計確定（2026-04-06）**:
> - `normalized_name` → **廃止**。`match_key`（照合キー）に置き換え。`normalizeVendorName()` で自動導出
> - `aliases` は照合キーとして使わない。記録・UI表示のみ
> - 3フィールド構成: `match_key`（照合用）・`company_name`（正式名称。通帳由来はnull）・`display_name`（証票表示原文。領収書由来はnull）
> - 顧問先マスタには同一取引先の複数エントリが蓄積される（漢字/カタカナは別照合キー。同じ科目に到達する）
> - 取引先と取引先外は概念的に同質。同一テーブルで管理する方針（TS統合は計画的に実施）
>
> **同期方針（DL-022 2026-04-05確定）**: vendors_global との同期は不要。顧問先別マスタは発生した取引先を都度追加する方式。
> **DL-026 t_numbers設計**: t_numbers: [] = T番号不明（免税事業者・個人含む）。個人（individual）は t_numbers: [] で警告レベル低下。

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

*残り業種（21〜66）は次工程で順次追加*
