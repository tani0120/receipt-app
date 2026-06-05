# 47. 税区分マスタID — ルールベース変換設計書

> 作成: 2026-06-05
> 最終更新: 2026-06-05（mfTaxIdフィールド追加、フロント保持修正、検証結果追加）
> 根拠: MCP実機データ（151件全件一致検証済み）
> 前提: MFのIDは事業者固有（45_mf_id_comparison.md で確定）。名前ベース照合のみ可能

---

## 1. 背景と問題

### 1-1. 旧実装の問題（`MF_CUSTOM_{mfId}`）

MFインポートで全社マスタに存在しない税区分が検出された場合、
旧実装ではMFの事業者固有ID（mfId）をマスタIDに使用していた。

```
id: `MF_CUSTOM_${a.mfId}`   // 例: MF_CUSTOM_NDmgf+1zDq/wlK...
```

**問題点:**

| # | 問題 | 影響 |
|---|---|---|
| 1 | MF IDは事業者固有 | 事業者Aと事業者Bで同じ税区分でもIDが異なる |
| 2 | 全社マスタに事業者固有IDが混入 | マスタの一貫性が崩壊 |
| 3 | AIがルールを理解できない | セッション間でIDの意味を喪失 |
| 4 | Base64文字列で可読性なし | 人間が見ても何の税区分かわからない |

### 1-2. 新実装の方針

**2層ID構造：マスタID（全社共通）+ mfTaxId（顧問先別）**

```
全社マスタ:
  id: SALES_TAXABLE_10    ← ルールベース生成。全社共通。不変
  mfTaxId: なし            ← 事業者固有IDは全社マスタに入れない

顧問先別（MF連携済み）:
  id: SALES_TAXABLE_10    ← マスタと同一
  mfTaxId: aXV9OyVl...    ← MFの事業者固有ID。仕訳送信に使用

顧問先別（MF未連携）:
  id: SALES_TAXABLE_10    ← マスタと同一
  mfTaxId: なし            ← MFに接続していないので不要
```

**原則:**
- マスタIDはルールベース。AI推論は使わない
- 変換テーブルはJSONファイルに外出し（データ駆動）
- ルールに当てはまらない場合は仮IDで登録し、管理者に警告
- MFの事業者固有ID（mfTaxId）は顧問先別データにのみ保持
- 仕訳送信時はmfTaxIdを使用（毎回MCP取得を回避）

---

## 2. 変換ルールの仕組み

### 2-1. 変換フロー

```
MF税区分名（日本語）
    │
    ├─ ① プレフィックス照合（最長一致）
    │     「課税売上-返還等」→ SALES_RETURN
    │
    ├─ ② 軽減税率判定
    │     (軽) → _REDUCED（TAXABLEがあれば置換）
    │
    ├─ ③ 税率抽出（正規表現）
    │     10% → _10, 7.8% → _7_8
    │
    └─ ④ 簡易課税種別（正規表現）
          一種 → _T1 〜 六種 → _T6

最終ID: SALES_RETURN_REDUCED_8_T3
```

### 2-2. 変換例

| MF税区分名 | 生成されるマスタID | 分解 |
|---|---|---|
| 課税売上 10% | `SALES_TAXABLE_10` | プレフィックス + 税率 |
| 課税売上 (軽)8% 一種 | `SALES_REDUCED_8_T1` | プレフィックス(TAXABLE→REDUCED) + 税率 + 種別 |
| 輸入仕入-消費税額 7.8% | `IMPORT_TAX_7_8` | プレフィックス + 小数点税率 |
| 共通課税仕入-返還等 (軽)8% | `PURCHASE_RETURN_COMMON_REDUCED_8` | プレフィックス + REDUCED + 税率 |
| 対象外 | `COMMON_EXEMPT` | プレフィックスのみ |
| 不明 | `COMMON_UNKNOWN` | プレフィックスのみ |

---

## 3. 変換テーブル（データ駆動）

### 3-1. ファイル配置

```
data/tax-id-rules.json       ← 変換テーブル（管理者がルール追加）
src/api/services/taxIdGenerator.ts  ← 変換ロジック（コード変更不要）
```

**データ駆動の仕組み:**
- `taxIdGenerator.ts`は起動時にJSONを読み込んでキャッシュ
- `reloadTaxIdRules()`でサーバー再起動なしにホットリロード可能
- ルール追加はJSONファイルの編集のみ。コード変更不要

### 3-2. プレフィックス変換テーブル（40エントリ）

> **ソート順序: 長い順（最長一致を優先）。順序を変えてはならない。**

| # | 日本語プレフィックス | 英語プレフィックス | カテゴリ |
|---|---|---|---|
| 1 | 非課税対応特定課税仕入-返還等 | PURCHASE_SPECIFIC_RETURN_NT | 特定課税仕入 |
| 2 | 非課税対応特定課税仕入 | PURCHASE_SPECIFIC_NT | 特定課税仕入 |
| 3 | 共通特定課税仕入-返還等 | PURCHASE_SPECIFIC_RETURN_COMMON | 特定課税仕入 |
| 4 | 共通特定課税仕入 | PURCHASE_SPECIFIC_COMMON | 特定課税仕入 |
| 5 | 特定課税仕入-返還等 | PURCHASE_SPECIFIC_RETURN | 特定課税仕入 |
| 6 | 特定課税仕入 | PURCHASE_SPECIFIC | 特定課税仕入 |
| 7 | 非課税対応輸入-地方消費税額 | IMPORT_NT_LOCAL | 輸入仕入 |
| 8 | 非課税対応輸入-消費税額 | IMPORT_NT_TAX | 輸入仕入 |
| 9 | 非課税対応輸入-本体 | IMPORT_NT_BODY | 輸入仕入 |
| 10 | 共通輸入仕入-地方消費税額 | IMPORT_COMMON_LOCAL | 輸入仕入 |
| 11 | 共通輸入仕入-消費税額 | IMPORT_COMMON_TAX | 輸入仕入 |
| 12 | 共通輸入仕入-本体 | IMPORT_COMMON_BODY | 輸入仕入 |
| 13 | 輸入仕入-地方消費税額 | IMPORT_LOCAL | 輸入仕入 |
| 14 | 輸入仕入-消費税額 | IMPORT_TAX | 輸入仕入 |
| 15 | 輸入仕入-本体 | IMPORT_BODY | 輸入仕入 |
| 16 | 非課税対応仕入-返還等 | PURCHASE_RETURN_NT | 課税仕入 |
| 17 | 非課税対応仕入 | PURCHASE_NT | 課税仕入 |
| 18 | 共通課税仕入-返還等 | PURCHASE_RETURN_COMMON | 課税仕入 |
| 19 | 共通課税仕入 | PURCHASE_COMMON | 課税仕入 |
| 20 | 課税仕入-返還等 | PURCHASE_RETURN | 課税仕入 |
| 21 | 課税仕入 | PURCHASE_TAXABLE | 課税仕入 |
| 22 | 課税売上-貸倒回収 | SALES_RECOVERY | 課税売上 |
| 23 | 課税売上-貸倒 | SALES_BAD_DEBT | 課税売上 |
| 24 | 課税売上-返還等 | SALES_RETURN | 課税売上 |
| 25 | 課税売上 | SALES_TAXABLE | 課税売上 |
| 26 | 非課税資産輸出-返還等 | SALES_NON_TAXABLE_EXPORT_RETURN | 非課税資産 |
| 27 | 非課税資産輸出-貸倒 | SALES_NON_TAXABLE_EXPORT_BAD_DEBT | 非課税資産 |
| 28 | 非課税資産輸出 | SALES_NON_TAXABLE_EXPORT | 非課税資産 |
| 29 | 非課税売上-有価証券譲渡 | SALES_NON_TAXABLE_SECURITIES | 非課税売上 |
| 30 | 非課税売上-返還等 | SALES_NON_TAXABLE_RETURN | 非課税売上 |
| 31 | 非課税売上-貸倒 | SALES_NON_TAXABLE_BAD_DEBT | 非課税売上 |
| 32 | 非課税売上 | SALES_NON_TAXABLE | 非課税売上 |
| 33 | 輸出売上-返還等 | SALES_EXPORT_RETURN | 輸出売上 |
| 34 | 輸出売上-貸倒 | SALES_EXPORT_BAD_DEBT | 輸出売上 |
| 35 | 輸出売上 | SALES_EXPORT | 輸出売上 |
| 36 | 対象外仕入 | PURCHASE_EXEMPT | 対象外 |
| 37 | 対象外売上 | SALES_EXEMPT | 対象外 |
| 38 | 対象外 | COMMON_EXEMPT | 対象外 |
| 39 | 非課税仕入 | PURCHASE_NON_TAXABLE | 非課税 |
| 40 | 不明 | COMMON_UNKNOWN | その他 |

### 3-3. 簡易課税種別テーブル（6エントリ）

| 日本語 | サフィックス |
|---|---|
| 一（種） | T1 |
| 二（種） | T2 |
| 三（種） | T3 |
| 四（種） | T4 |
| 五（種） | T5 |
| 六（種） | T6 |

### 3-4. 軽減税率の特殊ルール

```
TAXABLE を含むプレフィックスの場合:
  SALES_TAXABLE → SALES_REDUCED（置換）
  PURCHASE_TAXABLE → PURCHASE_REDUCED（置換）

TAXABLE を含まないプレフィックスの場合:
  PURCHASE_COMMON → PURCHASE_COMMON_REDUCED（末尾追加）
  IMPORT_BODY → IMPORT_BODY_REDUCED（末尾追加）
```

### 3-5. 税率のフォーマット規則

| 税率 | ID内の表現 | 規則 |
|---|---|---|
| 10% | `_10` | 整数はそのまま |
| 8% | `_8` | 整数はそのまま |
| 5% | `_5` | 整数はそのまま |
| 0% | `_0` | 整数はそのまま |
| 7.8% | `_7_8` | 小数点は`_`で区切る |
| 6.3% | `_6_3` | 小数点は`_`で区切る |
| 6.24% | `_6_24` | 小数点は`_`で区切る |
| 1.76% | `_1_76` | 小数点は`_`で区切る |
| 1.7% | `_1_7` | 小数点は`_`で区切る |
| 1% | `_1` | 整数はそのまま |

---

## 4. MF事業者固有ID（mfTaxId）の管理

### 4-1. 設計方針

MFの税区分IDは事業者固有（TSK vs TST で 0/151件一致）。
従って、全社マスタには持たず、顧問先別データにのみ保持する。

```
TaxCategory型（shared-tax-category.ts）:
  id: string         ← マスタID（全社共通。ルールベース生成）
  mfTaxId?: string   ← MF事業者固有ID（顧問先別のみ。optional）
```

### 4-2. mfTaxIdがセットされるタイミング

| 経路 | API | mfTaxIdの挙動 |
|---|---|---|
| 顧問先MFインポート | `POST /api/mf/import-client-taxes` | MCPから取得した`t.id`をセット |
| sync-all | `POST /api/mf/sync-all` | MCPから取得した`t.id`をセット |
| 全社マスタ同期 | `syncMasterTaxCategoriesToClients()` | セットしない（MFに未接続） |
| フロントPUT上書き | `PUT /api/tax-categories/client/:id` | composableのmfTaxIdMapから復元 |

### 4-3. 連携/未連携の挙動

**MF連携済み顧問先:**

```
① MFインポートボタン押下
② POST /api/mf/import-client-taxes
③ MCPで税区分一覧取得（151件。各件にMF IDあり）
④ 全社マスタと名前照合 → マスタ属性コピー + mfTaxId付与
⑤ 名前不一致 → generateTaxMasterId()でマスタID生成 + mfTaxId付与
⑥ saveClientTaxCategories()で顧問先別JSONに保存
⑦ フロントのsaveAll()がmfTaxIdMapに格納 → PUT上書き時も保持
```

**MF未連携顧問先:**

```
① 全社マスタのsaveAllTaxCategories()実行時に自動呼出
② syncMasterTaxCategoriesToClients()
③ マスタにあって顧問先にないID → 追加（mfTaxIdなし）
④ 名前・税率変更 → 更新
⑤ マスタから消えたID → 削除しない（仕訳参照を壊さない）
```

### 4-4. フロント側のmfTaxId保持の仕組み

フロントのcomposable（useClientTaxCategories.ts）はoverrides形式でデータを管理する。
`mfTaxIdMap`という辞書（マスタID → mfTaxId）をoverridesに持ち、
PUT上書き時にmfTaxIdが消えないようにする。

```typescript
interface ClientTaxOverrides {
  hiddenIds: string[]
  aiSelectableOverrides: Record<string, boolean>
  copiedMasterIds: string[]
  customTaxCategories: TaxCategory[]
  mfTaxIdMap: Record<string, string>  // ← 追加
}
```

**保持フロー:**

```
サーバーからGET → items[].mfTaxId → mfTaxIdMapに格納
  ↓
overrides変更 → buildFullTaxCategoryList() → mfTaxIdMapから復元
  ↓
PUT /api/tax-categories/client/:id → mfTaxId付きで送信
```

**修正経緯:** 当初mfTaxIdMapがなかった。import-client-taxesでmfTaxIdを保存しても、
フロントのautoSave（watch→PUT）で上書きされ消えていた。
mfTaxIdMapの導入で、composableのライフサイクル全体でmfTaxIdが保持されるようになった。

---

## 5. 呼び出し箇所（コード）

### 5-1. マスタID生成の使用箇所

| ファイル | 関数 | 用途 |
|---|---|---|
| mfTaxImportService.ts | `applyTaxImport()` | 全社マスタへの税区分追加時 |
| mfTaxImportService.ts | `importClientTaxes()` | 顧問先別税区分インポート時 |
| mfTaxImportService.ts | available更新（2箇所） | 税区分利用可否のキー生成 |
| mfRoutes.ts | `/sync-all` | MF全データ一括取込時 |

### 5-2. mfTaxId保存の使用箇所

| ファイル | 箇所 | 処理内容 |
|---|---|---|
| mfRoutes.ts L482 | sync-all マッチ時 | `mfTaxId: t.id` をセット |
| mfRoutes.ts L514 | sync-all 未マッチ時 | `mfTaxId: t.id` をセット |
| mfTaxImportService.ts L485 | importClientTaxes マッチ時 | `mfTaxId: t.id` をセット |
| mfTaxImportService.ts L521 | importClientTaxes 未マッチ時 | `mfTaxId: t.id` をセット |

### 5-3. mfTaxId保持のフロント箇所

| ファイル | 箇所 | 処理内容 |
|---|---|---|
| useClientTaxCategories.ts | fetchClientFromServer後 | サーバーデータからmfTaxIdMapを構築 |
| useClientTaxCategories.ts | buildFullTaxCategoryList() | mfTaxIdMapから各行にmfTaxIdを復元 |
| useClientTaxCategories.ts | saveAll() | allRowsからmfTaxIdMapを再構築 |

### 5-4. 変換失敗時のフロー

```
generateTaxMasterId('未知の税区分名')
    │
    └→ null を返す
         │
         ├─ バックエンド: 仮ID「UNKNOWN_{timestamp}_{random}」で登録
         │                コンソールにwarn出力
         │
         └─ フロント: 警告モーダルを表示
                      ・失敗した税区分名をコピペ可能な形で表示
                      ・管理者がdata/tax-id-rules.jsonにルールを追加する必要がある旨を表示
```

### 5-5. レスポンス構造

```typescript
interface TaxImportApplyResult {
  success: boolean
  summary: string
  updatedMaster: TaxCategory[]
  pattern: TaxMethodKey
  /** ルールベースID変換に失敗した税区分名（呼び出し元で警告表示用） */
  unknownTaxNames?: string[]
}
```

---

## 6. 運用手順

### 6-1. 新しい税区分が追加された場合

1. MFインポート実行 → 警告モーダルが表示される
2. モーダルから税区分名をコピー
3. `data/tax-id-rules.json` の `prefixRules` に1行追加
4. サーバー再起動（キャッシュクリア）

```json
// 例: 新しい税区分「インボイス特例仕入」が追加された場合
["インボイス特例仕入", "PURCHASE_INVOICE_SPECIAL"]
```

> [!IMPORTANT]
> **挿入位置に注意。** 長い文字列を先にソートする（最長一致ルール）。
> 例: 「インボイス特例仕入-返還等」は「インボイス特例仕入」より前に置く。

### 6-2. 税率変更の場合

**JSONの変更は不要。** 税率は正規表現で動的抽出するため、何%になっても自動対応する。

例: 軽減税率が8%→1%に変更された場合
- MFが「課税売上 (軽)1%」を返す → `SALES_REDUCED_1` が自動生成される

### 6-3. Supabase移行後

`data/tax-id-rules.json` → DBテーブル `tax_id_rules` に差し替え。
`loadRules()` のファイル読み込みをDB読み込みに変更するだけ。

---

## 7. 検証結果

### 7-1. マスタID生成の全件一致検証

既存の`tax-category-master.json`にある全151件のマスタIDと、
`data/tax-id-rules.json`のルールで生成されるIDが完全に同一であることを確認。

```
=== 結果 ===
一致: 151 件
不一致: 0 件
合計: 151 件
一致率: 100.0%
```

### 7-2. 仮想税制変更テスト（軽減1%）

税率は正規表現で動的抽出するため、税率が何%になっても自動対応する。

| MF税区分名 | 生成されるID |
|---|---|
| 課税売上 (軽)1% | `SALES_REDUCED_1` |
| 課税売上 (軽)1% 一種 | `SALES_REDUCED_1_T1` |
| 課税仕入 (軽)1% | `PURCHASE_REDUCED_1` |
| 輸入仕入-消費税額 (軽)0.78% | `IMPORT_TAX_REDUCED_0_78` |

### 7-3. ルール不一致テスト

| MF税区分名 | 結果 |
|---|---|
| 見たことない税区分 | `null`（警告モーダル表示） |
| 空文字 | `null`（警告モーダル表示） |

### 7-4. mfTaxId保存の検証（実機テスト）

TST（株式会社すぐする）とTSK（あああ/谷風行寛）の2事業者で検証。

**全社マスタ:**

| 項目 | 結果 |
|---|---|
| 合計 | 151件 |
| mfTaxIdあり | 0件 |
| 判定 | ✅ 正しい。全社マスタに事業者固有IDは入れない |

**連携済み顧問先（TST・TSK）:**

| 項目 | TST | TSK |
|---|---|---|
| 合計 | 151件 | 151件 |
| mfTaxIdあり | 151件 | 151件 |
| 判定 | ✅ 全件保存 | ✅ 全件保存 |

**マスタID一致テスト（TST vs TSK）:**

| 項目 | 結果 |
|---|---|
| 同名税区分のマスタID | 151件全件**同一** ✅ |
| 同名税区分のmfTaxId | 151件全件**異なる** ✅ |

```
サンプル:
  不明
    マスタID: TSK=COMMON_UNKNOWN  TST=COMMON_UNKNOWN  → ✅同一
    mfTaxId:  TSK=NDmgf%2B1z...   TST=G1ThCLEFBo...   → ✅異なる
  課税売上 10%
    マスタID: TSK=SALES_TAXABLE_10  TST=SALES_TAXABLE_10  → ✅同一
    mfTaxId:  TSK=JADP5Ohw2u...     TST=aXV9OyVlGZ...     → ✅異なる
```

**未連携顧問先（12社）:**

| 項目 | 結果 |
|---|---|
| mfTaxIdあり | 全社0件 |
| 判定 | ✅ 正しい。MFに接続していないのでmfTaxIdは不要 |

---

## 8. ファイル一覧

### 8-1. バックエンド

| ファイル | 役割 | 変更内容 |
|---|---|---|
| `data/tax-id-rules.json` | 変換テーブル（データ駆動。管理者が編集） | [新規] ルール定義40件+簡易課税6件 |
| `src/api/services/taxIdGenerator.ts` | 変換ロジック（コード変更不要） | JSONからの読み込み、キャッシュ、ホットリロード |
| `src/api/services/mfTaxImportService.ts` | 全社マスタ・顧問先インポート | mfTaxIdの保存追加。MF_CUSTOM全廃 |
| `src/api/routes/mfRoutes.ts` | sync-all（MF全データ一括取込） | mfTaxIdの保存追加。MF_CUSTOM全廃 |
| `src/types/shared-tax-category.ts` | TaxCategory型定義 | `mfTaxId?: string`フィールド追加 |
| `src/api/services/accountMasterStore.ts` | 全社マスタ管理・顧問先別ストア | syncMasterTaxCategoriesToClients（mfTaxIdなしで同期） |

### 8-2. フロントエンド

| ファイル | 役割 | 変更内容 |
|---|---|---|
| `src/features/tax-management/composables/useClientTaxCategories.ts` | 顧問先税区分composable | mfTaxIdMap追加。PUT上書き時の消失防止 |
| `src/views/master/MockMasterTaxCategoriesPage.vue` | マスタ税区分ページ | 警告モーダルUI |
| `src/views/client/MockClientTaxPage.vue` | 顧問先税区分ページ | MFインポートボタン → import-client-taxes呼出 |

### 8-3. データ

| ファイル | 役割 |
|---|---|
| `data/tax-category-master.json` | 既存151件のマスタデータ（検証対象） |
| `data/tax-categories-c_{clientId}.json` | 顧問先別税区分データ（mfTaxId含む） |
