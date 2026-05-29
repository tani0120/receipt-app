# 税区分マスタ設計（方式マスタ + MFインポート差分マージ）

> 作成: 2026-05-28
> 実装完了: 2026-05-29
> 最終更新: 2026-05-29（simplifiedOnlyフラグ追加・名前パターンマッチ完全排除・taxRate優先化）
> 統合元: tax_method_master_plan.md（計画書） + report_tax_master_issues.md（課題レポート）

---

## 背景

- MFが税区分の唯一の正しいソース
- MFのMCP `mfc_ca_getTaxes` は引数なし。トークンに紐づく事業者（顧問先）の税区分を返す
- 全社マスタは顧問先非依存 → MFの `available` は特定顧問先の課税方式に依存するため、全社マスタのフィルタに使えない
- MFインポートは特定顧問先経由でしかできないが、税区分定義（ID、名前、税率）は全顧問先で共通
- 全社マスタの全151件に `mfId` フィールドが設定済み（スグスルID ↔ MF IDの対応表）

---

## 設計方針

### データの分離

| データ | ソース | 全社マスタでの扱い |
|-------|-------|----------------|
| **税区分定義**（ID、名前、税率等） | MFインポート | 差分マージで更新 |
| **方式分類**（どの税区分がどの方式に属するか） | 初回の4方式インポート結果 `mf-tax-available.json` | スグスル側で管理。新規追加時は名前パターンで推定 |
| **available**（顧問先の使用可否） | MFインポート | 全社マスタでは**使わない**。顧問先ページでのみ使用 |

### フラグの分離（2つの独立したフラグ）

| フラグ | 表現 | 意味 | 誰が決める |
|-------|------|------|------------|
| **MFインポート表示** | MFインポート表示 / MFインポート利用非表示化 | MFに存在するか。方式マスタでその方式に属するか | MFインポートで自動決定 |
| **表示** | 表示 / 非表示 | ユーザーに見せるか | ユーザーの手動切替（既存の `deprecated` フラグ） |

この2つは独立。「MFインポート表示」でも「非表示」にできるし、「MFインポート利用非表示化」でも「表示」のままにできる。
例：免税の「不明」「対象外」はMFインポートでは0件だが、スグスル側で `direction='common'` として強制表示。

---

## 実装内容

### 1. 方式マスタデータ管理（サーバー側）

**ストア**: `src/api/services/mfTaxAvailableStore.ts`

- `data/mf-tax-available.json` に4方式分（proportional/individual/simplified/exempt）のavailableデータを永続化
- インメモリキャッシュ + JSON読み書き
- `loadTaxAvailable()` / `saveTaxAvailable()` / `getAllTaxAvailable()` / `isAvailableByMfId()`
- **ゴミデータ清掃**: `loadTaxAvailable()`で有効キー（4方式）以外を自動除去。過去のバグでmfIdがルートキーに混入したデータを起動時に清掃

**APIエンドポイント**: `src/api/routes/mfRoutes.ts`

- `GET /api/mf/tax-available` — 4方式分のavailableデータ取得
- `PUT /api/mf/tax-available/:method` — 特定方式のavailable更新

### 2. 全社マスタのフィルタ（方式マスタベース・データ駆動）

**実装**: `MockMasterTaxCategoriesPage.vue` `filteredTaxRows`

- セグメントボタンで方式を選択 → `mf-tax-available.json` の方式マスタデータでフィルタ
- 顧問先依存のMFリアルタイム `available` は使わない
- ~~IDパターンマッチはフォールバック~~ → **削除済み（2026-05-29）。availableデータなし時は`defaultVisible`で全件表示**
- `direction='common'`（不明・対象外）は全方式で常に表示
- MF独自カスタム税区分（`isCustom && source === 'mf'`）は常に表示

> [!IMPORTANT]
> IDパターンマッチヘルパー（`isSimplifiedSales`/`isIndividualPurchase`/`isObsoleteRate`）は2026-05-29に完全削除。
> availableデータが存在する限りIDベースのフィルタは不要であり、IDの命名規則変更時に壊れるリスクがあった。

### 3. MFインポート差分マージ（バックエンドAPI）

> [!IMPORTANT]
> **2026-05-29にフロント（Vue）からバックエンド（Node/Hono）に完全移行。**
> フロントの`executeImport`は200行超 → 85行（API呼び出しのみ）に簡素化。

**バックエンドサービス**: `src/api/services/mfTaxImportService.ts`（新規作成）

- `previewTaxImport(clientId)` — 差分プレビュー（副作用なし・dryRun）
- `applyTaxImport(clientId)` — 差分適用（マスタ保存・available更新・MF生データ保存）
- `detectDiff(clientId, dryRun)` — preview/apply共通の差分検知ロジック（ディープコピーで元データ非破壊）

**APIエンドポイント**: `src/api/routes/mfRoutes.ts`

- `POST /api/mf/import-taxes/preview` — 差分プレビュー（認証チェック付き）
- `POST /api/mf/import-taxes/apply` — 差分適用（認証チェック付き）

**フロント**: `MockMasterTaxCategoriesPage.vue` `executeImport`

- preview API → 差分レポートモーダル → apply API → allTaxRows更新

処理フロー（バックエンド側）:
1. MFから税区分取得（`mcpFetchTaxes`）+ 課税方式自動検知（`mcpFetchTermSettings`）
2. 自動ルール適用（一種〜六種の強制非表示化）
3. 現在の全社マスタと名前ベースで突合（ディープコピーで非破壊）
4. 差分検知（追加/税率変更/削除候補）
5. deprecated自動リセット（availableでtrue=有効なのにdeprecated=trueの行）
6. preview: 差分レポートを返す（保存なし）
7. apply: 差分適用 → マスタ保存 → available更新 → MF生データ保存

**定数（データ駆動化済み）**: `mfTaxImportService.ts`

```typescript
// MF税区分IDのパターンキーへの変換（実測値 2026-05-29確認済み）
export const MF_TAX_METHOD_TO_PATTERN: Record<string, TaxMethodKey> = {
  'PROPORTIONAL_ALLOCATION': 'proportional',
  'INDIVIDUAL_ALLOCATION': 'individual',
  'SIMPLE': 'simplified',        // ★実測値（SIMPLIFIEDではない）
  'FREE': 'exempt',
}
```

### 4. 自動ルール（一種〜六種の強制非表示化）

**実装**: `mfTaxImportService.ts` `detectDiff`内

`TaxCategory.simplifiedOnly`フラグが`true`の税区分（マスタの`mfId`で逆引き）:
- 簡易 → MFインポート表示
- 一括比例 → MFインポート利用非表示化（MFの値に関わらず強制）
- 個別対応 → MFインポート利用非表示化（MFの値に関わらず強制）
- 免税 → MFインポート利用非表示化（MFの値に関わらず強制）

対象: 48件（151件中）。MFは特定顧問先の簡易N種設定に依存して、一括比例・個別対応でもTrue（有効）を返すことがあるため。

> [!NOTE]
> 旧実装では名前パターンマッチ `/(一種|二種|三種|四種|五種|六種)/` で判定していたが、
> `simplifiedOnly`フラグ導入により名前依存を完全排除（2026-05-29）。

### 5. 新規税区分の方式推定

**実装**: `mfTaxImportService.ts` `applyTaxImport`内

| 名前パターン | MFインポート表示にする方式 |
|---------|------|
| `direction='common'`（不明・対象外） | 全方式（共通） |
| 上記以外 | 一括比例・個別対応・簡易（免税はfalse） |

> [!NOTE]
> 旧実装では名前正規表現で「一種〜六種」「共通/非課税対応」を判定していたが、
> バックエンド移行時に `guessDirectionFromName()` の結果（direction）ベースに統一。

### 6. sync-all（サーバー側一括同期）

**実装**: `src/api/routes/mfRoutes.ts` sync-allエンドポイント

- mfIdでマスタの全社税区分と照合 → マスタの属性（id/direction/active/qualified等）をそのまま維持
- マッチしない場合 → `MF_CUSTOM_${t.id}` IDで新規追加、`guessDirectionFromName()` でフォールバック推定
- 旧問題の `direction: 'common'` 固定値は完全に排除済み

### 7. 顧問先ページ（MFリアルタイムavailable使用）

**実装**: `MockClientTaxPage.vue`

- 引き続きMFのリアルタイム `available` でフィルタ（顧問先の課税方式に依存するため正しい）
- mfId照合でマスタ属性を引き継ぐ処理を実装済み
- MFインポート時に `consumptionTaxMode`（課税方式）を自動更新
- IDパターンマッチ・名前パターンマッチは完全削除。`simplifiedOnly`フラグ + `taxRate`フィールドでデータ駆動
- 詳細は 41_tax_client_design.md を参照

### 8. MFカスタム税区分

3箇所全てで統一実装:

| 箇所 | カスタムID形式 | isCustom | source |
|------|-------------|----------|--------|
| 全社マスタ（バックエンド） | `MF_CUSTOM_${mfId}` | `true` | `'mf'` |
| sync-all（サーバー） | `MF_CUSTOM_${t.id}` | `true` | `'mf'` |
| 顧問先 importFromMf | `MF_CUSTOM_${t.id}` | `true` | `'mf'` |

---

## Supabase移行時の対応（保留中）

TaxCategory型に構造化属性（`tax_type` / `business_type` / `purpose_type`）を追加する。
現時点ではavailableデータベースのフィルタ + mfId照合で動作しており、Supabase移行時にENUMカラムで実施する方が型安全。

---

## 関連ファイル一覧

| ファイル | 役割 |
|---------|------|
| `src/api/services/mfTaxImportService.ts` | **税区分インポート処理（バックエンド）** preview/apply/detectDiff |
| `src/api/services/mfTaxAvailableStore.ts` | 4方式分available管理ストア（ゴミデータ清掃バリデーション付き） |
| `src/api/routes/mfRoutes.ts` | MF API・sync-all・tax-available・import-taxes エンドポイント |
| `data/mf-tax-available.json` | 4方式分availableデータ（永続化） |
| `data/tax-category-master.json` | 全社マスタ税区分151件（mfId付き） |
| `src/views/master/MockMasterTaxCategoriesPage.vue` | 全社マスタUI（フィルタ・API呼び出し） |
| `src/views/client/MockClientTaxPage.vue` | 顧問先税区分UI（MF available使用） |
| `src/types/shared-tax-category.ts` | TaxCategory型・ユーティリティ関数 |

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-05-28 | 初版作成 |
| 2026-05-29 | 実装完了 |
| 2026-05-29 | **バックエンド移行完了。** `mfTaxImportService.ts`新規作成。フロントexecuteImport 200行→85行。IDパターンマッチフォールバック削除。`mfTaxAvailableStore`にゴミデータ清掃バリデーション追加。`MF_TAX_METHOD_TO_PATTERN`定数をサービスに定義（実測値`SIMPLE`を含む） |
| 2026-05-29 | **データ駆動化完了。** `simplifiedOnly`フラグ追加（276件JSON更新）。名前パターンマッチ`/(一種|二種|三種|四種|五種|六種)/`を完全排除。`extractRateFromName`→`taxRate`優先化。顧問先設計を41_tax_client_design.mdに分離 |
