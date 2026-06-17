# 51. MFインポート基盤 — プロジェクトファイル

> **作成日**: 2026-06-12
> **前セッション**: 71ca3b0b（2026-06-11〜12）— 基盤構築・エラーモーダル・スケジューラ
> **現セッション**: b0e88e81（2026-06-12）— 裏取り・フィルタ修正
> **最終更新**: 2026-06-12 18:25 — 顧問先税区分修正完了（税区分2ページ全完了）

---

## 1. 概要

MFクラウド会計からのデータインポート基盤。全5ページに共通のMfImportButtonコンポーネントを導入し、エラーモーダル・スケジューラ・displayTaxRows廃止を実施。

---

## 2. ファイル構成

### 2-1. 共通コンポーネント

| ファイル | 行数 | 役割 |
|---|---|---|
| [MfImportButton.vue](file:///c:/dev/receipt-app/src/components/MfImportButton.vue) | 250行 | MFインポートボタン + エラーモーダル内蔵。showError()で呼び出し側からエラー表示可能 |

**MfImportButton API:**

```typescript
// Props（プロパティ）
authenticated: boolean    // MF認証済みか
loading?: boolean         // インポート処理中か
tooltip?: string          // ボタンツールチップ
disabledTooltip?: string  // 未連携時ツールチップ

// Emits（イベント）
(e: 'import'): void       // ボタン押下時

// Expose（公開メソッド）
showError(title: string, message: string, log?: string): void  // エラーモーダル表示
```

**エラーモーダル機能:**
- タイトル / メッセージ / スタックトレース表示
- クリップボードコピーボタン（フォールバック: テキスト選択）
- モーダルオーバーレイ（z-index: 10000）

**CSS:** `cm-mf-import-btn` → [main.css:251-261](file:///c:/dev/receipt-app/src/assets/main.css#L251-L261) に共通定義

---

### 2-2. フロントエンド — 5ページの導入状況

| # | ページ | ファイル | MfImportButton | インポートAPI | エラーモーダル | フィルタ基準 |
|---|---|---|---|---|---|---|
| 1 | 全社税区分マスタ | [MockMasterTaxCategoriesPage.vue](file:///c:/dev/receipt-app/src/views/master/MockMasterTaxCategoriesPage.vue) | ✅ L49 | POST /api/mf/import-taxes/{preview,apply} | ✅ showError L605 | ✅ MF available（修正済み 2026-06-12） |
| 2 | 顧問先税区分 | [MockClientTaxPage.vue](file:///c:/dev/receipt-app/src/views/client/MockClientTaxPage.vue) | ✅ L101 | POST /api/mf/import-client-taxes | ✅ showError L480 | ✅ MF available（修正済み 2026-06-12） |
| 3 | 全社勘定科目マスタ | [MockMasterAccountsPage.vue](file:///c:/dev/receipt-app/src/views/master/MockMasterAccountsPage.vue) | ✅ L56 | POST /api/mf/import-master-accounts | ✅ showError L444 | ✅ target（修正不要） |
| 4 | 顧問先勘定科目 | [MockClientAccountsPage.vue](file:///c:/dev/receipt-app/src/views/client/MockClientAccountsPage.vue) | ✅ L64 | POST /api/mf/import-client-accounts | ✅ showError L391 | ✅ target（修正不要） |
| 5 | 顧問先管理 | [MockMasterClientsPage.vue](file:///c:/dev/receipt-app/src/views/master/MockMasterClientsPage.vue) | ✅ L66 | POST /api/mf/import-offices | ✅ showError L1427 | ✅ サーバー側（修正不要） |

### 2-3. バックエンド — APIエンドポイント

全エンドポイントは [mfRoutes.ts](file:///c:/dev/receipt-app/src/api/routes/mfRoutes.ts) に定義。

| メソッド | パス | 用途 | 行番号 |
|---|---|---|---|
| GET | /api/mf/tax-available | 4方式分のavailableデータ取得 | [L646-650](file:///c:/dev/receipt-app/src/api/routes/mfRoutes.ts#L646-L650) |
| PUT | /api/mf/tax-available/:method | 特定方式のavailable更新 | [L652-653](file:///c:/dev/receipt-app/src/api/routes/mfRoutes.ts#L652-L653) |
| POST | /api/mf/import-taxes/preview | 全社税区分 差分プレビュー | [L705](file:///c:/dev/receipt-app/src/api/routes/mfRoutes.ts#L705) |
| POST | /api/mf/import-taxes/apply | 全社税区分 差分適用 | [L731](file:///c:/dev/receipt-app/src/api/routes/mfRoutes.ts#L731) |
| POST | /api/mf/import-client-taxes | 顧問先税区分 インポート | [L757](file:///c:/dev/receipt-app/src/api/routes/mfRoutes.ts#L757) |
| POST | /api/mf/import-master-accounts | 全社勘定科目 インポート | [L786](file:///c:/dev/receipt-app/src/api/routes/mfRoutes.ts#L786) |
| POST | /api/mf/import-client-accounts | 顧問先勘定科目+補助科目+部門+税区分を一括インポート（§54で全データ保存に拡張） | [L855](file:///c:/dev/receipt-app/src/api/routes/mfRoutes.ts#L855) |
| POST | /api/mf/import-offices | 顧問先 事業所情報インポート | [L292](file:///c:/dev/receipt-app/src/api/routes/mfRoutes.ts#L292) |
| POST | /api/mf/sync-all | 全自動同期（スケジューラ用） | — |

### 2-4. バックエンド — サービス層

| ファイル | 役割 |
|---|---|
| [mfTaxImportService.ts](file:///c:/dev/receipt-app/src/api/services/mfTaxImportService.ts) | 税区分インポート処理（プレビュー / 適用 / 顧問先） |
| [mfTaxAvailableStore.ts](file:///c:/dev/receipt-app/src/api/services/mfTaxAvailableStore.ts) | MF課税方式別availableデータ管理（data/mf-tax-available.json） |
| [mfAccountImportService.ts](file:///c:/dev/receipt-app/src/api/services/mfAccountImportService.ts) | 勘定科目インポート処理（差分マージ） |
| [mfMappingService.ts](file:///c:/dev/receipt-app/src/api/services/mfMappingService.ts) | スグスルID → MF-ID 変換マップ生成 |
| [mfSyncScheduler.ts](file:///c:/dev/receipt-app/src/api/services/mfSyncScheduler.ts) | MF自動取得スケジューラ（116行。setTimeout/setInterval） |
| [accountMasterApi.ts](file:///c:/dev/receipt-app/src/api/services/accountMasterApi.ts) | 勘定科目APIロジック（filterByTaxMethod含む） |

### 2-5. データファイル

| ファイル | 用途 |
|---|---|
| data/mf-tax-available.json | 4課税方式分の税区分表示可否（MFインポート時に更新） |
| data/tax-category-master.json | 全社税区分マスタ（151件） |
| data/account-master.json | 全社勘定科目マスタ（法人133件 + 個人108件） |
| data/mf-raw/*.json | MCPスナップショット（MF生データ。税区分4方式 + 勘定科目 + 期設定） |

---

## 3. 実施済み作業（2026-06-11〜12 セッション71ca3b0b）

### 3-1. MfImportButton.vue 作成・全5ページ導入

| 項目 | 状態 | 検証 |
|---|---|---|
| MfImportButton.vue コンポーネント作成 | ✅ 完了 | 250行。showError / エラーモーダル / コピー機能 |
| 全社税区分マスタ 導入 | ✅ 完了 | L49, L301, L355, L605 |
| 顧問先税区分 導入 | ✅ 完了 | L101, L373, L423, L480 |
| 全社勘定科目マスタ 導入 | ✅ 完了 | L56, L255, L339, L444 |
| 顧問先勘定科目 導入 | ✅ 完了 | L64, L266, L355, L391 |
| 顧問先管理 導入 | ✅ 完了 | L66, L527, L1427 |

### 3-2. displayTaxRows(ref) → filteredTaxRows(computed) 置換

| 項目 | 状態 | 検証 |
|---|---|---|
| MockClientTaxPage.vue | ✅ 完了 | L527: filteredTaxRows = computed。Repository直叩き排除 |
| MockMasterTaxCategoriesPage.vue | ✅ 完了 | L630: filteredTaxRows = computed。Repository直叩き排除 |
| grepで旧displayTaxRows残存確認 | ✅ 完了 | コメントのみ残存。実コードには使用なし |

### 3-3. mfSyncScheduler.ts 作成・server.ts統合

| 項目 | 状態 | 検証 |
|---|---|---|
| mfSyncScheduler.ts 作成 | ✅ 完了 | 116行。環境変数MF_AUTO_SYNC_ENABLED / MF_SYNC_SCHEDULE |
| server.ts にimport・呼び出し追加 | ✅ 完了 | L202: import { startMfSyncScheduler, stopMfSyncScheduler } |

### 3-4. MCPスナップショット突合せ

| 項目 | 状態 | 検証 |
|---|---|---|
| mf-tax-available.json vs MCPスナップショット | ✅ 完了 | 全4方式一致確認済み |
| SALES_RETURN_10_T3 修正 | ✅ 完了 | true→false（git管理外ファイル） |

### 3-5. filterByTaxMethod維持

サーバー側filterByTaxMethodは廃止しない方針に確定。将来のSupabase移行時に再活用の可能性あり。

### 3-6. gitコミット・プッシュ

- コミットハッシュ: 57b9302
- メッセージ: `fix: MFインポート基盤の全面改修 — エラーモーダル内蔵・スケジューラ・composable統合・バリデーション強化`
- 変更ファイル: 32 files changed, 5127 insertions(+), 4341 deletions(-)

---

## 4. 修正実績（2026-06-12 セッションb0e88e81）

### 4-1. 全社税区分マスタ — filteredTaxRowsをMF availableベースに修正 ✅

**修正日時:** 2026-06-12 17:48

**変更ファイル:**
- [MockMasterTaxCategoriesPage.vue](file:///c:/dev/receipt-app/src/views/master/MockMasterTaxCategoriesPage.vue)（+32/-9行）
- [check-hardcode.ts](file:///c:/dev/receipt-app/scripts/check-hardcode.ts)（+1行 — MasterFieldFlowPage.vue許可リスト追加）

**修正内容:**
1. L357-366: `taxAvailable` ref + `fetchTaxAvailable()`関数を追加
2. L473-474: onMounted内でavailableデータ取得を追加
3. L613-614: finally内でインポート後のavailable再取得を追加
4. L637-655: filteredTaxRowsを`simplifiedOnly`ベースから**MF availableベース**に全面修正

**検証結果:**

| 検証項目 | 結果 |
|---|---|
| `npx vue-tsc --noEmit` | ✅ エラー0件 |
| `npx eslint MockMasterTaxCategoriesPage.vue` | ✅ エラー0件 |
| `npx vite build` | ✅ 成功（18.95秒） |
| `npm run lint:hardcode` | ✅ 0件 |
| ブラウザ: 一括比例タブ | ✅ **44件**（期待値44件と一致） |
| ブラウザ: 個別対応タブ | ✅ **73件**（期待値73件と一致） |
| ブラウザ: 簡易タブ | ✅ **78件**（期待値78件と一致） |
| ブラウザ: 免税タブ | ✅ **2件**（期待値2件と一致） |

---

### 4-2. 顧問先税区分 — filteredTaxRowsをMF availableベースに修正 ✅

**修正日時:** 2026-06-12 18:05

**変更ファイル:**
- [MockClientTaxPage.vue](file:///c:/dev/receipt-app/src/views/client/MockClientTaxPage.vue)

**修正内容:** 全社マスタ（§4-1）と同一パターン。
1. L427-435: `taxAvailable` ref + `fetchTaxAvailable()`関数を追加
2. L447-448: onMounted内でavailableデータ取得を追加
3. L499-500: finally内でインポート後のavailable再取得を追加
4. L537-558: filteredTaxRowsを`simplifiedOnly`ベースから**MF availableベース**に全面修正

**検証結果:**

| 検証項目 | 結果 |
|---|---|
| `npx vue-tsc --noEmit` | ✅ エラー0件 |
| `npx vite build` | ✅ 成功（6.93秒） |
| `npm run lint:hardcode` | ✅ 0件 |
| ブラウザ: c_rODnkCDN（個別対応） | ✅ **73件**（期待値73件と一致） |
| ブラウザ: c_wTdnMKDO（免税） | ✅ **2件**（期待値2件と一致） |

---

## 5. 未修正の問題

### 5-1. 軽微: 顧問先勘定科目のcomposable同期不足

[MockClientAccountsPage.vue:367-399](file:///c:/dev/receipt-app/src/views/client/MockClientAccountsPage.vue#L367-L399) のimportFromMf()で、API呼び出し後にaccountRowsを直接spliceしているが、composable側（`settings.saveAccounts()`）への同期がない。

**影響:** 他ページへのリアルタイム反映に影響（画面遷移・リロードすれば解消）

---

## 6. 残修正計画

### 変更A: 顧問先勘定科目のcomposable同期追加（§5-1）

**対象:** [MockClientAccountsPage.vue](file:///c:/dev/receipt-app/src/views/client/MockClientAccountsPage.vue)

```typescript
// importFromMf成功後に追加
settings.saveAccounts(data.updatedAccounts, {});
```

---

## 7. 検証計画（残修正分）

### 7-1. 型・ビルド検証

| コマンド | 合格基準 |
|---|---|
| `npx vue-tsc --noEmit` | エラー0件 |
| `npx vite build` | 成功 |
| `npm run lint:hardcode` | 0件 |

---

## 8. 未解決・要確認

### 8-1. MF未連携顧問先のフォールバック動作

availableデータが存在しない場合、`active && defaultVisible`でフォールバック → 全件表示（151件）になる可能性がある。
MF未連携の顧問先が存在する場合、この動作が正しいか要確認。

### 8-2. 顧問先ごとのavailableデータ

現在のmf-tax-available.jsonは全顧問先共通。設計書§4-1では1つの基準顧問先（c_rODnkCDN）から取得した4スナップショット。
税区分の表示可否は事業者固有ではなく課税方式で決まるため全顧問先共通で正しいと思われるが要確認。

### 8-3. simplifiedOnlyフラグの今後

`simplifiedOnly`フラグは表示フィルタ用ではなく、MF送信バリデーション（設計書§2-2 #5）で使用するもの。
フィルタからは除去するが、フラグ自体は[shared-tax-category.ts:61](file:///c:/dev/receipt-app/src/types/shared-tax-category.ts#L61)と[journalValidationCore.ts:143](file:///c:/dev/receipt-app/src/shared/validation/journalValidationCore.ts#L143)で引き続き使用。削除しない。

---

## 9. 関連設計書

| 文書 | 関連箇所 |
|---|---|
| [43_master_factsheet.md §4-1](file:///c:/dev/receipt-app/docs/genzai/43_master_factsheet.md) | MF availableの設計図 |
| [37_infra_mcp.md](file:///c:/dev/receipt-app/docs/genzai/37_infra_mcp.md) | MCP API基盤の設計 |
| [accounting_software_policy.md](file:///c:/dev/receipt-app/.agent/workflows/accounting_software_policy.md) | 会計ソフト別対応方針 |
| [47_tax_id_rule_based_conversion.md](file:///c:/dev/receipt-app/docs/genzai/47_tax_id_rule_based_conversion.md) | 税区分IDのルールベース変換 |
