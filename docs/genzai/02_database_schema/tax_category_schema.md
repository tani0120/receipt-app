# 税区分・勘定科目テーブル設計書

> 作成日: 2026-03-02
> 根拠: domain_type_design.md v2、streamed_design_policy.md

---

## 1. tax_categories テーブル

| カラム | 型 | NOT NULL | デフォルト | 説明 |
|---|---|:---:|:---:|---|
| id | TEXT | ✅ | - | 概念ID（PK。例: `PURCHASE_TAXABLE_10`） |
| name | TEXT | ✅ | - | MF正式名称（CSV出力時にそのまま使用） |
| short_name | TEXT | ✅ | - | 省略名（UI表示用） |
| direction | TEXT | ✅ | - | `sales` / `purchase` / `common` |
| qualified | BOOLEAN | ✅ | false | 適格判定対象 |
| ai_selectable | BOOLEAN | ✅ | false | AI自動選択可否 |
| active | BOOLEAN | ✅ | true | 新規利用可否 |
| default_visible | BOOLEAN | ✅ | true | デフォルト表示 |
| display_order | INTEGER | ✅ | - | 表示順 |

- **PK**: `id`（概念ID。不変）
- **制約**: `direction IN ('sales', 'purchase', 'common')`
- **削除禁止**: 物理削除しない。`active = false` で無効化
- **初期データ**: 151件（`tax-category-master.ts` と同一）

---

## 2. accounts テーブル

| カラム | 型 | NOT NULL | デフォルト | 説明 |
|---|---|:---:|:---:|---|
| id | TEXT | ✅ | - | 内部ID（PK。例: `ACC_GENKIN`） |
| name | TEXT | ✅ | - | MF正式科目名 |
| sub | TEXT | - | NULL | 補助科目 |
| default_tax_category_id | TEXT | - | NULL | デフォルト税区分（FK → tax_categories.id） |
| sort_order | INTEGER | ✅ | - | 表示順 |
| client_id | UUID | ✅ | - | 顧問先ID（FK → clients.id） |

- **PK**: `id`（顧問先ごとに重複可のため、実運用では `(id, client_id)` が候補キー）
- **FK**: `default_tax_category_id → tax_categories(id)`

---

## 3. client_tax_settings テーブル（顧問先別税区分表示設定）

| カラム | 型 | NOT NULL | デフォルト | 説明 |
|---|---|:---:|:---:|---|
| client_id | UUID | ✅ | - | 顧問先ID |
| tax_category_id | TEXT | ✅ | - | 税区分ID（FK → tax_categories.id） |
| visible | BOOLEAN | ✅ | - | この顧問先で表示するか |
| display_order | INTEGER | - | NULL | 顧問先固有の表示順（NULLなら税区分マスタの順） |

- **PK**: `(client_id, tax_category_id)`
- **初期値**: 27件の `default_visible = true` の税区分を自動挿入

---

## 設計原則

- 税区分マスタは**全顧問先共通**（151件固定）
- 顧問先ごとの表示/非表示は `client_tax_settings` で管理
- 税率はカラムに持たない（エンジンの責務外）
- 税区分のCSV出力は `name` をそのまま使用

---

## 実装状況（2026-03-02時点）

| コンポーネント | ファイル | 状態 |
|---|---|---|
| 税区分マスタデータ（151件） | `src/shared/data/tax-category-master.ts` | ✅ 実装済み |
| TaxCategory型定義 | `src/shared/types/tax-category.ts` | ✅ 実装済み |
| Account型定義 | `src/shared/types/account.ts` | ✅ 実装済み |
| SimpleTaxRule型定義 | `src/shared/types/simple-tax-rule.ts` | ✅ 実装済み |
| TaxCodeMapper（概念ID→MF正式名称） | `src/features/journal/services/TaxCodeMapper.ts` | ✅ 実装済み |
| domain型 JournalEntryLine.tax_category_id | `src/domain/types/journal.ts` | ✅ 実装済み |
| fixtureデータ（概念ID化） | `src/mocks/data/journal_test_fixture_30cases.ts` | ✅ 実装済み |
| UI表示変換（概念ID→名称） | `src/mocks/components/JournalListLevel3Mock.vue` | ✅ 実装済み |
| 設定画面（税区分タブ） | `src/views/ScreenS_AccountSettings.vue` | ✅ 実装済み |
| DBテーブル作成 | PostgreSQL migration | ⬜ 未着手（Phase C） |

### 概念IDフロー

```
fixtureデータ → tax_category_id: 'PURCHASE_TAXABLE_10'
       ↓
getText()    → resolveTaxCategoryName() でマスタからname取得
       ↓
UI表示       → 「課税仕入 10%」（MF正式名称）
       ↓
CSV出力      → TaxCodeMapper.toMF() で正式名称に変換
```

