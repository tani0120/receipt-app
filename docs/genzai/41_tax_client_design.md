# 税区分 個別会社設計（顧問先税区分ページ + バックエンドAPI）

> 作成: 2026-05-29
> 最終更新: 2026-06-04（MF IDは事業者固有と確定。全照合を名前ベースに統一。available.jsonキーをマスタIDに移行）
> 前提: 40_tax_method_master.md（全社マスタ設計）

---

## 背景

- 全社マスタ（40_）は**顧問先非依存**。税区分定義（ID、名前、税率、direction等）を全社共通で管理
- 顧問先ページは**顧問先依存**。特定顧問先のMFの`available`（課税方式に依存）でフィルタし、顧問先ごとの税区分カスタマイズを管理
- MFの`mfc_ca_getTaxes`はトークンに紐づく事業者（顧問先）の税区分を返す。`available`フィールドがその顧問先の課税方式に基づいた有効/無効を示す
- 40_では全社マスタの差分マージを設計。本書では顧問先単位の税区分管理を設計する

---

## 全社マスタとの関係

| 項目 | 全社マスタ（40_） | 個別会社（本書） |
|------|----------------|--------------|
| **データソース** | MFインポート差分マージ | MFインポート一括取得 |
| **フィルタ方式** | `mf-tax-available.json`（方式マスタ） | MFリアルタイム`available`（顧問先依存） |
| **保存先** | `data/tax-category-master.json` | `data/tax-categories-{clientId}.json` |
| **consumptionTaxMode** | 使用しない | 顧問先の課税方式を決定（セグメントボタン表示） |
| **IDパターンマッチ** | 使用しない（削除済み） | 使用しない（削除済み） |
| **インポート処理** | preview→apply 2段階 | 1回のAPI呼び出しで全処理 |

---

## 設計方針

### consumptionTaxMode（課税方式モード）の統一

| 項目 | 値 |
|------|------|
| 統一値 | `'individual'` / `'proportional'` / `'simplified'` / `'exempt'` |
| 旧値（廃止） | `'individual_allocation'` / `'proportional_allocation'` |
| 型定義 | `ConsumptionTaxModeUi`（`src/types/ui.type.ts`） |
| マイグレーション | `clientStore.ts` `migrateConsumptionTaxMode()` で起動時自動変換 |

MFの`tax_method`値（`INDIVIDUAL_ALLOCATION`等）と内部値の変換は `MF_TAX_METHOD_TO_CONSUMPTION_MODE` 定数で管理。
変換関数（`toTaxMethodType`）は不要になり削除済み。`consumptionTaxMode`を直接使用。

### データ駆動の原則

| 判定 | データ駆動の方法 | 旧実装（削除済み） |
|------|-------------|-------------|
| 課税方式フィルタ | `mf-tax-available.json`の`available[method][masterId]` | IDパターンマッチ（`_T[1-6]$`等） |
| 簡易課税専用判定 | `TaxCategory.simplifiedOnly`フラグ | 名前パターンマッチ（`/(一種|二種|三種|四種|五種|六種)/`） |
| 税率表示 | `TaxCategory.taxRate`フィールド優先 | `extractRateFromName()`（名前正規表現） |
| 課税方式 | `consumptionTaxMode`直接使用 | `toTaxMethodType()`変換関数 |

---

## 実装内容

### 1. 顧問先税区分インポート（バックエンドAPI一括処理）

**バックエンドサービス**: `src/api/services/mfTaxImportService.ts` `importClientTaxes()`

処理フロー:
1. MFから`termSettings`取得 → `consumptionTaxMode`自動更新（`clients.json`に保存）
2. MFから税区分一覧取得（`mcpFetchTaxes(clientId)`）
3. 全社マスタと**名前で突合**（マスタ属性を継承）— †MF IDは事業者固有のため名前照合が正しい（2026-06-04修正）
4. 未マッチ → `MF_CUSTOM_{mfId}`で新規作成（`guessDirectionFromName()`で初期推定）
5. 顧問先ストアに保存（`data/tax-categories-{clientId}.json`）
6. `available`データを更新（`mf-tax-available.json`の該当方式）
7. MF生データを保存（`data/mf-raw/`に記録）

**APIエンドポイント**: `POST /api/mf/import-client-taxes`

```
Request:  { clientId: string }
Response: {
  success: boolean
  imported: TaxCategory[]
  matchedCount: number      // マスタ照合成功件数
  customCount: number       // MF独自カスタム件数
  consumptionTaxMode: string | null  // 更新後の課税方式
  availableUpdated: boolean // available更新有無
}
```

**フロント**: `MockClientTaxPage.vue` `importFromMf()`

- API 1回呼び出し → テーブル更新 → composable同期 → available再取得
- 旧実装の200行超のフロントロジック（termSettings取得、マスタ突合、保存）は全て削除済み

### 2. 課税方式の表示と判定

**セグメントボタン**（編集不可）:

```
原則（一括比例） | 原則（個別対応） | 簡易 | 免税
```

- `currentClientData.consumptionTaxMode`の値でアクティブボタンを決定
- `consumptionTaxMode`は統一値を直接使用（変換関数不要）
- MFインポート時に自動更新される

### 3. 税区分フィルタ（データ駆動）

**実装**: `MockClientTaxPage.vue` `displayTaxRows`（API取得+2ref方式）

```
判定順序:
1. isCustom && source === 'mf' → 常に表示（顧問先が意図的に作成）
2. direction === 'common' → 常に表示（不明・対象外は全方式共通）
3. availableData[method][row.id] === true → 表示（マスタIDキーでデータ駆動）
4. availableデータなし → active && defaultVisible（安全なデフォルト）
5. method === 'exempt' → 非表示（免税はcommonのみ表示）
```

> [!IMPORTANT]
> IDパターンマッチ（`isSimplifiedSales`/`isIndividualPurchase`/`isObsoleteRate`）は完全削除済み。
> フォールバックフィルタも削除。`available`データがない場合は`active && defaultVisible`のみで判定。

### 4. 顧問先固有のカスタマイズ

| 操作 | 対象 | 実装 |
|------|------|------|
| **表示/非表示** | 全税区分 | `deprecated`フラグ + `effectiveTo`日付 |
| **コピー** | 全税区分 | `{id}_COPY_{n}` IDで複製。`isCustom=true` |
| **追加** | 新規のみ | `NEW_{n}` IDで作成。`isCustom=true` |
| **削除** | `isCustom=true`のみ | 物理削除。MF公式税区分は削除不可（非表示のみ） |
| **名前編集** | `isCustom=true`のみ | MF公式税区分の名前は変更不可 |
| **direction編集** | `isCustom=true`のみ | 売上/仕入/共通を変更 |
| **qualified編集** | `isCustom=true`のみ | 適格判定対象のON/OFF |

### 5. 保存処理

**フロント** → **バックエンドAPI**:

```
PUT /api/tax-categories/client/{clientId}
Body: { taxCategories: TaxCategory[] }
```

- composable側にも同期（`settings.saveTaxCategories()`）
- 未保存変更ガード（`useUnsavedGuard`）でページ離脱時に警告

### 6. MF認証状態の管理

- `onMounted`で`GET /api/mf/auth/status?clientId={clientId}`を確認
- `mfAuthenticated=true`の場合のみインポートボタン有効
- MF未認証時はインポートボタンがグレーアウト（ツールチップで認証を促す）

---

## 永続化

| データ | ファイル | 管理ストア |
|--------|---------|-----------|
| 顧問先税区分 | `data/tax-categories-{clientId}.json` | `accountMasterStore.ts` |
| 課税方式available | `data/mf-tax-available.json` | `mfTaxAvailableStore.ts` |
| 顧問先情報（consumptionTaxMode含む） | `data/clients.json` | `clientStore.ts`（バックエンド） |
| MF生データ | `data/mf-raw/client-taxes-{method}.json` | `mfRawDataStore.ts` |

---

## simplifiedOnlyフラグ（データ駆動）

`TaxCategory.simplifiedOnly?: boolean`

簡易課税専用税区分（一種〜六種）を示すフラグ。マスタJSONに276件設定済み。

| 用途 | 実装箇所 |
|------|---------|
| 全社マスタインポート時の自動ルール | `mfTaxImportService.ts` `detectDiff()` |
| 原則課税・免税方式での強制非表示化 | `simplifiedOnlyMfIds` Setで判定 |

> [!NOTE]
> 旧実装では名前パターンマッチ `/(一種|二種|三種|四種|五種|六種)/` で判定していたが、
> `simplifiedOnly`フラグ導入により名前依存を完全排除。

---

## 定数

```typescript
// MF課税方式→consumptionTaxMode（統一値）
export const MF_TAX_METHOD_TO_CONSUMPTION_MODE = {
  'FREE': 'exempt',
  'SIMPLE': 'simplified',
  'INDIVIDUAL_ALLOCATION': 'individual',
  'PROPORTIONAL_ALLOCATION': 'proportional',
  'SIMPLIFIED': 'simplified',
  'GENERAL': 'individual',
}
```

---

## 関連ファイル一覧

| ファイル | 役割 |
|---------|------|
| `src/api/services/mfTaxImportService.ts` | **顧問先インポート処理** `importClientTaxes()` + 全社マスタ `previewTaxImport()`/`applyTaxImport()` |
| `src/api/routes/mfRoutes.ts` | `POST /api/mf/import-client-taxes` エンドポイント |
| `src/views/client/MockClientTaxPage.vue` | 顧問先税区分UI（フィルタ・インライン編集・保存） |
| `src/features/account-settings/composables/useAccountSettings.ts` | 科目/税区分のcomposable（顧問先/マスタ共用） |
| `src/stores/clientStore.ts` | consumptionTaxModeマイグレーション（起動時自動変換） |
| `src/api/services/accountMasterStore.ts` | `saveClientTaxCategories()` / `getClientTaxCategories()` |
| `src/types/shared-tax-category.ts` | `TaxCategory`型（`simplifiedOnly`/`taxRate`フィールド含む） |
| `data/tax-categories-{clientId}.json` | 顧問先別税区分データ（永続化） |

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-05-29 | 初版作成。consumptionTaxMode値統一（12ファイル横断）、バックエンドAPI集約（`importClientTaxes`）、IDパターンマッチ完全削除、`simplifiedOnly`フラグ追加（276件）、`extractRateFromName`→`taxRate`優先化を実施済み |
| 2026-06-07 | **顧問先税区分フィルタ方式変更:** `filteredTaxRows`（computed）→`displayTaxRows`（API取得+2ref方式）に移行。`refreshDisplayTaxRows()`でインポート後にAPI再取得。全社税区分と同一パターン |
