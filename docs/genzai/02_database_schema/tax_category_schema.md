# 税区分・勘定科目テーブル設計書

> 作成日: 2026-03-02
> 更新日: 2026-03-06（accounts テーブルに deprecated/effective_from/effective_to/ai_selectable 追加、管理者UI→モック実装済み、master_design_rules.md 13ルール確定、実装状況テーブル更新）
> 根拠: domain_type_design.md v2、streamed_design_policy.md、ChatGPT設計議論（2026-03-03）、マスタ設計議論（2026-03-06）

---

## 設計思想

### 責任境界（確定）

| 領域 | 責任 |
|------|------|
| システム | 選択肢制御（UI非表示で不正選択を防止） |
| スタッフ | 顧問先単位の有効/無効制御、表示名調整 |
| 管理者 | 税法改正時のマスタ更新、新税区分追加 |
| MF | 最終整合性・インポート時警告 |

### 基本方針

- **制度保証システムではない。ミス低減システムである**
- MFが会計の真実（Source of Truth）
- 税率はnumberで保持（将来の検算復活用）
- 保存時の強制バリデーションは行わない（UI選択制御のみ）

### マスタ運用ルール（確定）

- **新ID方式**: 税率変更時は既存IDを上書きしない。新IDを追加する
- **イミュータブル原則**: 既存IDのrate/kind変更は禁止
- **物理削除禁止**: `deprecated = true` で無効化
- **管理者のみ操作可能**: 通常スタッフはマスタ編集不可

---

## 1. tax_categories テーブル（グローバルマスタ）

| カラム | 型 | NOT NULL | デフォルト | 説明 |
|---|---|:---:|:---:|---|
| id | TEXT | ✅ | - | 概念ID（PK。例: `PURCHASE_TAXABLE_10`）**不変** |
| name | TEXT | ✅ | - | MF正式名称（CSV出力時にそのまま使用） |
| short_name | TEXT | ✅ | - | 省略名（UI表示用） |
| direction | TEXT | ✅ | - | `sales` / `purchase` / `common` |
| rate | NUMERIC | ✅ | - | 税率（例: 10, 8, 0）。将来の検算用にnumber保持 |
| qualified | BOOLEAN | ✅ | false | 適格判定対象 |
| ai_selectable | BOOLEAN | ✅ | false | AI自動選択可否 |
| active | BOOLEAN | ✅ | true | 新規利用可否 |
| default_visible | BOOLEAN | ✅ | true | デフォルト表示（27件がtrue） |
| display_order | INTEGER | ✅ | - | 表示順 |
| effective_from | DATE | ✅ | - | 制度適用開始日（例: 2019-10-01） |
| effective_to | DATE | - | NULL | 制度適用終了日（NULLなら現行有効） |
| deprecated | BOOLEAN | ✅ | false | 非推奨（旧制度で使用終了） |
| created_at | TIMESTAMP | ✅ | NOW() | 作成日時 |

- **PK**: `id`（概念ID。不変）
- **制約**: `direction IN ('sales', 'purchase', 'common')`
- **削除禁止**: 物理削除しない。`deprecated = true` で無効化
- **初期データ**: 151件（`tax-category-master.ts` と同一）

### 税率変更時のフロー（新ID方式）

```
例: 標準税率 10% → 12%（仮）

1. TAX_SALES_10 → deprecated = true, effective_to = '2027-03-31'
2. TAX_SALES_12 → 新規追加, effective_from = '2027-04-01'
3. 顧問先UIに新税区分表示
4. 旧税区分は新規選択不可（過去仕訳表示のみ）
```

### 仕訳入力UIでの表示条件

```
deprecated = false
AND active = true
AND enabled = true（client_tax_settings）
AND（伝票日がある場合のみ:
  effective_from <= 伝票日
  AND (effective_to IS NULL OR 伝票日 <= effective_to)
）
```

> 伝票日がない場合は現行有効税区分のみ表示。

---

## 2. accounts テーブル（勘定科目マスタ）

| カラム | 型 | NOT NULL | デフォルト | 説明 |
|---|---|:---:|:---:|---|
| id | TEXT | ✅ | - | 内部ID（PK。例: `ACC_GENKIN`） |
| name | TEXT | ✅ | - | MF正式科目名 |
| sub | TEXT | - | NULL | 補助科目 |
| default_tax_category_id | TEXT | - | NULL | デフォルト税区分（FK → tax_categories.id） |
| sort_order | INTEGER | ✅ | - | 表示順 |
| ai_selectable | BOOLEAN | ✅ | false | AI自動選択可否 |
| deprecated | BOOLEAN | ✅ | false | 非推奨（論理削除用。UIではグレーアウト表示） |
| effective_from | DATE | ✅ | - | 適用開始日 |
| effective_to | DATE | - | NULL | 適用終了日（NULLなら現役） |
| is_custom | BOOLEAN | ✅ | false | カスタム科目フラグ（ユーザー追加=true、システム提供=false） |
| client_id | UUID | ✅ | - | 顧問先ID（FK → clients.id） |

- **PK**: `id`（顧問先ごとに重複可のため、実運用では `(id, client_id)` が候補キー）
- **FK**: `default_tax_category_id → tax_categories(id)`
- **物理削除禁止**: `deprecated = true` で無効化（→ [master_design_rules.md](file:///c:/dev/receipt-app/docs/genzai/02_database_schema/master_design_rules.md) ルール3）
- **適用期間**: 現役は `effective_to = NULL`（→ ルール1）

---

## 3. client_tax_settings テーブル（顧問先別税区分設定）

| カラム | 型 | NOT NULL | デフォルト | 説明 |
|---|---|:---:|:---:|---|
| client_id | UUID | ✅ | - | 顧問先ID |
| tax_category_id | TEXT | ✅ | - | 税区分ID（FK → tax_categories.id） |
| visible | BOOLEAN | ✅ | - | この顧問先で表示するか |
| display_order | INTEGER | - | NULL | 顧問先固有の表示順（NULLならマスタ順） |
| mf_name_override | TEXT | - | NULL | 名称変更時のMF向け名称 |
| is_modified | BOOLEAN | ✅ | false | マスタから変更があるか |

- **PK**: `(client_id, tax_category_id)`
- **初期値**: 27件の `default_visible = true` の税区分を自動挿入

### 名称変更時のMFインポート警告

顧問先で `mf_name_override` を設定した場合:

```
UIメッセージ:
「この名称を変更すると、MFインポート時に税区分警告が表示される可能性があります。
対応はMFの指示に従ってください。」
```

### UI表示ルール

| 状態 | 表示 |
|------|------|
| マスタ通り | 何も表示しない |
| 名称変更あり (`is_modified = true`) | 🟡「名称変更あり」マーク |
| deprecated | グレー表示（選択不可） |
| 無効 (`visible = false`) | 非表示 |

---

## 4. 管理者UI（新規設計必要）

> 詳細ルールは [master_design_rules.md](file:///c:/dev/receipt-app/docs/genzai/02_database_schema/master_design_rules.md) に集約

### 管理者の責務

- 税法改正時の新税区分追加（全顧問先に**強制適用** → ルール12）
- 旧税区分の非推奨化（`deprecated = true`）
- 勘定科目の追加・非推奨化（顧問先への反映は**手動** → ルール8, 12）
- 表示名・MF正式名称の変更
- 変更理由コメントの記録
- **マスタ管理権限がないスタッフはアクセス不可**（→ ルール2）

### 管理者UIの表示

| 状態 | 表示 |
|------|------|
| 現行有効 | 通常表示 |
| 非推奨 | **グレーアウト表示**（→ ルール3） |
| 未使用 | トグルで無効化可能 |

### 操作方式（→ ルール6）

- **行内編集（インライン）**: カスタム科目のみセルクリックで編集可能。デフォルト科目は編集不可
- **保存ボタン**で確定（即時保存ではない）
- **チェックボックス（✓）選択** → 削除・コピー・追加・復元
  - コピー: チェック行の直下に「○○（コピー）」としてカスタム科目を挿入
  - 追加: チェック行の直下に「新規科目」（税区分: 対象外）としてカスタム科目を挿入
  - 削除: デフォルト科目は非推奨化のみ、カスタム科目は物理削除可能
  - 復元: 非推奨行を現役に戻す（`deprecated = false`, `effective_to = NULL`）
- **ドラッグ＆ドロップ**で並び替え → `sort_order`（表示順）をDB保存（→ ルール10）

#### デフォルト科目 vs カスタム科目（→ ルール4）

| 操作 | デフォルト科目 | カスタム科目 |
|------|:---:|:---:|
| 名前編集 | ❌ 不可 | ✅ 可能 |
| 税区分変更 | ❌ 不可 | ✅ 可能 |
| 非推奨化 | ✅ 可能 | ✅ 可能 |
| 削除（物理） | ❌ 不可 | ✅ 可能 |
| 並び替え | ✅ 可能 | ✅ 可能 |

### 変更履歴（→ ルール13）

- **別テーブル**（`master_change_log`）で管理
- 変更前後の値（before / after）をJSON保存

> 税務系ではログ必須。

---

## 設計原則（確定）

- 税区分マスタは**全顧問先共通**（151件＋将来追加分）
- 顧問先ごとの表示/非表示は `client_tax_settings` で管理
- **税率はrateカラムで保持**（将来の検算エンジン復活に備える）
- 税区分のCSV出力は `name`（または `mf_name_override`）をそのまま使用
- **新ID方式**: 既存IDは上書きしない。税率変更時は新ID追加
- **管理者UIを別途設計**: 通常スタッフはマスタ編集不可
- **effectiveFrom/To**: 制度の時間的境界として保持。UI制御のみに使用
- **保存時バリデーションなし**: UIで物理的に選べなくすれば十分

---

## 実装状況（2026-03-03時点）

| コンポーネント | ファイル | 状態 |
|---|---|---|
| 税区分マスタデータ（151件） | `src/shared/data/tax-category-master.ts` | ✅ 実装済み |
| 勘定科目マスタデータ（79科目） | `src/shared/data/account-master.ts` | ✅ 実装済み |
| TaxCategory型定義 | `src/shared/types/tax-category.ts` | ✅ 実装済み |
| Account型定義 | `src/shared/types/account.ts` | ✅ 実装済み |
| SimpleTaxRule型定義 | `src/shared/types/simple-tax-rule.ts` | ✅ 実装済み |
| TaxCodeMapper（概念ID→MF正式名称） | `src/features/journal/services/TaxCodeMapper.ts` | ✅ 実装済み |
| domain型 JournalEntryLine.tax_category_id | `src/domain/types/journal.ts` | ✅ 実装済み |
| fixtureデータ（概念ID化） | `src/mocks/data/journal_test_fixture_30cases.ts` | ✅ 実装済み |
| UI表示変換（概念ID→名称） | `src/mocks/components/JournalListLevel3Mock.vue` | ✅ 実装済み |
| 設定画面（税区分タブ） | `src/views/ScreenS_AccountSettings.vue` | ✅ 実装済み |
| 設定画面（勘定科目タブ） | `src/views/ScreenS_AccountSettings.vue` | ✅ 実装済み |
| 勘定科目マスタUI | `src/mocks/views/MockMasterAccountsPage.vue`（`/master/accounts`） | ✅ モック実装済み（2026-03-06） |
| 税区分マスタUI | `src/mocks/views/MockMasterTaxCategoriesPage.vue`（`/master/tax-categories`） | ✅ モック実装済み（2026-03-06） |
| マスタハブUI | `src/mocks/views/MockMasterHubPage.vue`（`/master`） | ✅ モック実装済み（2026-03-06） |
| rate / effectiveFrom / deprecated追加 | 型定義への反映 | ⬜ 未着手 |
| マスタ設計ルール（13項目） | `master_design_rules.md` | ✅ 確定済み（2026-03-06） |
| client_tax_settings UI | 顧問先設定への統合 | ✅ モック実装済み |
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
