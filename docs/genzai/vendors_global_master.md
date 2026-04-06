# 全社用取引先マスタ（vendors_global）

> 作成日: 2026-04-05
> 最終更新: 2026-04-06
>
> **⚠️ 正規ソース（SSOT）: `src/mocks/data/pipeline/vendors_global.ts`（224件）**
> **本MDは設計方針・分類ルールの記録のみ。取引先データの参照・編集はTSファイルで行うこと。**
>
> 業種68種対応（telecom/saas分割後）。
> 勘定科目: ACCOUNT_MASTER ID準拠。
> 税区分: null維持（DL-024: ACCOUNT_MASTER.defaultTaxCategoryIdから自動導出。未実装）。
>
> **DL-027 照合キー（match_key）設計確定（2026-04-06）**:
> - `normalized_name` → **廃止**。`match_key`（照合キー）に置き換え。`normalizeVendorName(company_name)` で自動導出
> - `aliases` は照合キーとして使わない。記録・UI表示のみ
> - 3フィールド構成確定: `match_key`（照合キー）・`company_name`（正式名称）・`display_name`（表示名。全社マスタではnull）
> - 漢字↔カタカナの一致は追求しない（別エントリとして管理）
> - ひらがな→カタカナ変換を `normalizeVendorName()` に追加済み（DL027-1。2026-04-06）
>
> **DL-026 T番号設計原則（2026-04-05確定）**:
> - T番号の目的: 取引先・サービス名の一意特定。税額控除確認は目的ではない
> - 同一T番号（同一法人）は1エントリに統合。サービス名は aliases に列挙（照合には使わない）
> - t_numbers: [] = T番号不明（免税事業者・個人・未確認は税務上同一扱い）



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

## 取引先データ

> **⚠️ 個別取引先データは `src/mocks/data/pipeline/vendors_global.ts` を参照せよ。**
> 本MDには個別取引先（会社名・T番号・aliases等）を記載しない。
> TSファイルが唯一の正規ソース（SSOT）である。
>
> **TS実装状態（2026-04-05）**:
> - 総数: 224件
> - direction: 全件 `'expense'` 設定済み
> - debit_account: 全件設定済み（industry_vector_corporate.ts expense[0]準拠）
> - debit_account_over: restaurant系のみ `'ENTERTAINMENT'`（閾値10,000円超）
> - amount_threshold: restaurant/cafe系のみ `10000`
> - 税区分（debit_tax_category / credit_tax_category）: 全件null（DL-024未実装）
> - credit_account: 全件null（パイプラインがsource_typeから自動設定予定）
>
> **マスタ管理UI実装状態（2026-04-06）**:
> - マスタ管理ハブ: `MockMasterManagementPage.vue`（ルート `/master/vendors`）実装済み
> - 取引先マスタ一覧: `MockMasterVendorsPage.vue`（ルート `/master/vendors/list`）実装済み
>   - 全行インライン編集（テキスト入力＋ドロップダウン）
>   - 日本語表示: `VENDOR_VECTOR_LABELS`・`ACCOUNT_MASTER` からimport（ハードコードゼロ）
>   - 照合キー自動計算: `normalizeVendorName(company_name)` のリアルタイム表示
>   - 追加ボタン（先頭に空行挿入、ID自動採番）
>   - 削除モーダル（ゴミ箱アイコン→確認→物理削除）
>   - 貸方科目列・表示名列を追加
>   - T番号: T枠外固定＋数字13桁のみ表示・編集
>   - 検索・フィルタ（業種・入出金）・ソート・ページネーション
>
> **vector修正済み（2026-04-05）**:
> - Amazon / 楽天 / メルカリ / ZOZO: `platform` → `ec_site`（購入側）
> - BASE / Shopify: `ec_site` / `saas` → `platform`（出店側）
> - サイバーエージェント: `platform` → `advertising`
> - GMOインターネット: `platform` → `it_service`
> - メルペイ: 削除（メルカリのaliasesに統合）

---

*全68業種の取引先データはTSファイルに移行完了（2026-04-05）*

