# 全社用取引先マスタ（vendors_global）

> 作成日: 2026-04-05
> 最終更新: 2026-04-05
>
> **⚠️ 正規ソース（SSOT）: `src/mocks/data/pipeline/vendors_global.ts`（224件）**
> **本MDは設計方針・分類ルールの記録のみ。取引先データの参照・編集はTSファイルで行うこと。**
>
> 業種68種対応（telecom/saas分割後）。
> 勘定科目: ACCOUNT_MASTER ID準拠。
> 税区分: null維持（DL-024: ACCOUNT_MASTER.defaultTaxCategoryIdから自動導出。未実装）。
>
> **DL-026 T番号設計原則（2026-04-05確定）**:
> - T番号の目的: 取引先・サービス名の一意特定。税額控除確認は目的ではない
> - 同一T番号（同一法人）は1エントリに統合。サービス名は aliases に列挙
> - t_numbers: [] = T番号不明（免税事業者・個人・未確認は税務上同一扱い）
> - 銀行明細・カード明細にはT番号記載なし → Layer 3（aliases）が実質的な主力照合



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
> **vector修正済み（2026-04-05）**:
> - Amazon / 楽天 / メルカリ / ZOZO: `platform` → `ec_site`（購入側）
> - BASE / Shopify: `ec_site` / `saas` → `platform`（出店側）
> - サイバーエージェント: `platform` → `advertising`
> - GMOインターネット: `platform` → `it_service`
> - メルペイ: 削除（メルカリのaliasesに統合）

---

*全68業種の取引先データはTSファイルに移行完了（2026-04-05）*

