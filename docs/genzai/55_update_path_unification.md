# DL-050 監査結果: 更新経路の一元化

> 作成: 2026-06-16（セッション 6d3dc882）
> 最終更新: 2026-06-18（P0〜P3全完了。フロントfetch直叩き→repos移行完了）

---

## 監査対象

DL-050が対象とするのは**サーバー側の永続化更新経路**のみ。

```
DL-050の対象:
  script → writeFileSync / supabase直叩き（サーバーを経由しない永続化）
  server → save()（サーバー内の永続化）
  → これらが2系統あると壊れる

DL-050の対象外:
  Vue → fetch() → HTTP API → server → save()
  Vue → repos.xxx() → HTTP API → server → save()
  → サーバー側から見ると同じ経路。フロントの抽象化はDL-050とは別問題
```

調査対象:
1. **スクリプト層** — `src/scripts/` からアプリデータへの直接書き込み
2. **バックエンド層** — サーバー側の永続化更新経路が1本に統一されているか

---

## 1. スクリプト層（src/scripts/）

### 結果: ✅ DL-050準拠

| スクリプト | writeFileSync先 | アプリデータか | DL-050 |
|---|---|---|---|
| normalizeConfirmedJournals.ts | なし（Service経由） | - | ✅ **修正済み** |
| romaji_benchmark.ts | テスト結果出力 | ❌ | ✅ 対象外 |
| preview_extract_test.ts | テスト結果出力 | ❌ | ✅ 対象外 |
| mcp_tools_dump.ts | MCPツールダンプ | ❌ | ✅ 対象外 |
| mcp_response_dump.ts | MCPレスポンスダンプ | ❌ | ✅ 対象外 |
| fetch_mf_master_snapshot.ts | スナップショット | ❌ | ✅ 対象外 |
| fetch_mf_accounts.ts | MF科目ダンプ | ❌ | ✅ 対象外 |
| dump_sub_dept.ts | 補助科目ダンプ | ❌ | ✅ 対象外 |
| ai_command_model_test.ts | テスト結果出力 | ❌ | ✅ 対象外 |

> スクリプトでアプリのデータファイル（`data/confirmed_journals.json`, `data/mf-accounts-*.json` 等）を直接書き換えている箇所は**ゼロ**。normalizeConfirmedJournals.tsは今回の修正でService経由に変更済み。

---

## 2. バックエンド層（src/api/）

### confirmed_journals の更新経路

| 呼び出し元 | 関数 | 種別 | DL-050 |
|---|---|---|---|
| [normalizeConfirmedJournalsService.ts](file:///c:/dev/receipt-app/src/api/services/normalizeConfirmedJournalsService.ts) | `getAll()`, `replaceAll()` | Service→Store | ✅ |
| [confirmedJournalRoutes.ts](file:///c:/dev/receipt-app/src/api/routes/confirmedJournalRoutes.ts) POST /normalize | `normalizeConfirmedJournals()` | Route→Service | ✅ |
| [confirmedJournalRoutes.ts](file:///c:/dev/receipt-app/src/api/routes/confirmedJournalRoutes.ts) POST /:clientId/import | `importJournals()` | Route→Service | ✅ Service化完了 |
| [confirmedJournalRoutes.ts](file:///c:/dev/receipt-app/src/api/routes/confirmedJournalRoutes.ts) DELETE /batch/:batchId | `deleteByBatchId()` | Route→Service | ✅ Service化完了 |
| [confirmedJournalRoutes.ts](file:///c:/dev/receipt-app/src/api/routes/confirmedJournalRoutes.ts) DELETE /:clientId | `deleteByClientId()` | Route→Service | ✅ Service化完了 |
| [mfJournalImporter.ts](file:///c:/dev/receipt-app/src/api/services/mfJournalImporter.ts) | `importJournals()` | Service→Store | ✅ |
| [journalListService.ts](file:///c:/dev/receipt-app/src/api/services/journalListService.ts) | `getJournals()` | Service→Store | ✅（読み取りのみ） |

---

## 3. フロントエンド層（src/views/）

### 結果: ✅ DL-050違反なし

DL-050はサーバー側の永続化更新経路が対象。フロントが`fetch()`を使うか`repos.xxx()`を使うかは、サーバー側から見れば同じ経路：

```
Vue → fetch('/api/...') → HTTP API → Server → Repository → Storage
Vue → repos.xxx()    → HTTP API → Server → Repository → Storage
↑ サーバー側から見ると同じ
```

### フロントの抽象化: ✅ P3で完了済み

| パターン | 件数 | DL-050 | 影響 |
|---|---|---|---|
| `repos.xxx.method()` 経由 | **全ファイル** | ✅ 対象外 | APIパス変更時: repos内だけ修正 |
| `fetch('/api/...')` 直接 | **blob DL 6件のみ** | ✅ 対象外 | バイナリDLはJSONでないためrepos化対象外 |

> **P3完了済み。** JSON系のfetch直叩きは全てrepos経由に移行完了。残存はblob DL（download-supporting / download-excluded）6件のみ。

### repos経由で正しく実装されているファイル（既存）

| ファイル | repos | 内容 |
|---|---|---|
| [MockHistoryImportPage.vue](file:///c:/dev/receipt-app/src/views/history/MockHistoryImportPage.vue) | `repos.confirmedJournal` | 過去仕訳インポート |
| [MockLearningPage.vue](file:///c:/dev/receipt-app/src/views/MockLearningPage.vue) | `repos.learningRule` | 学習ルール |
| [MockMasterVendorsPage.vue](file:///c:/dev/receipt-app/src/views/master/MockMasterVendorsPage.vue) | `repos.vendor` | 取引先マスタ |
| [MockMasterStaffPage.vue](file:///c:/dev/receipt-app/src/views/master/MockMasterStaffPage.vue) | `repos.staff` | 担当者マスタ |
| [MockMasterNonVendorPage.vue](file:///c:/dev/receipt-app/src/views/master/MockMasterNonVendorPage.vue) | `repos.vendor` | 非取引先 |
| [MockClientIndustryVectorPage.vue](file:///c:/dev/receipt-app/src/views/client/MockClientIndustryVectorPage.vue) | `repos.industryVector` | 業種ベクトル |

---

## 4. 総合判定

| レイヤー | DL-050判定 | 詳細 |
|---|---|---|
| **スクリプト層** | ✅ 準拠 | アプリデータ直接操作なし |
| **バックエンド層** | ✅ 準拠 | 更新経路は全てStore内のsave()に一元化 |
| **フロントエンド層** | ✅ 対象外 | DL-050はサーバー側の永続化経路が対象 |

> fetch直叩きはDL-050違反ではなかったが、P3で全件repos経由に移行完了。技術的負債解消済み。

### 優先順位と実施状況

| 優先度 | 対象 | 状態 | 理由 |
|---|---|---|---|
| **P0** | file write / db writeをサービス層を通さず実行することの禁止 | ✅完了 | データ破壊の直接原因 |
| **P1** | サーバー側Repository統一 | ✅準拠 | 全Storeがsave()に一元化済み |
| **P2** | Application Service統一 | ✅完了 | normalizeはService化済み。Route→Store直呼び3箇所もService化完了 |
| **P3** | フロントの直接fetch削減 | ✅完了 | JSON系fetch全件repos化完了（blob DLのみ対象外） |

---

## 5. Repositoryパターンの構造

```
Vue (views/)
  ↓ repos.xxx.method()
Repository Interface (repositories/types.ts)
  ↓
├─ Mock実装 (repositories/mock/) → サーバーStore直結
├─ HTTP実装 (repositories/http/) → fetch() → HTTP API → サーバー
└─ Supabase実装 (repositories/supabase/) → 現在はHTTP実装を使用（将来DB直結）
```

### 実装ファイル構成

| ファイル | 役割 |
|---|---|
| [repositories/types.ts](file:///c:/dev/receipt-app/src/repositories/types.ts) | 全Repository型定義 |
| [repositories/mock/index.ts](file:///c:/dev/receipt-app/src/repositories/mock/index.ts) | Mock実装（throw new Error スタブ） |
| [repositories/http/index.ts](file:///c:/dev/receipt-app/src/repositories/http/index.ts) | HTTP実装（fetch()ラッパー） |
| [repositories/supabase/index.ts](file:///c:/dev/receipt-app/src/repositories/supabase/index.ts) | Supabase実装（現在はHTTPフォールバック） |
| [composables/useRepositories.ts](file:///c:/dev/receipt-app/src/composables/useRepositories.ts) | Vue composable（シングルトンキャッシュ） |

### Repository一覧

| Repository | 種別 | 追加時期 |
|---|---|---|
| ShareStatusRepository | Supabase実装済み | 初期 |
| VendorRepository | Supabase実装済み | 初期 |
| ClientVendorRepository | Supabase実装済み | 初期 |
| IndustryVectorRepository | Supabase実装済み | 初期 |
| AccountRepository | Supabase実装済み | 初期 |
| AccountMasterRepository | HTTPフォールバック | 初期 |
| TaxMasterRepository | HTTPフォールバック | 初期 |
| LeadRepository | HTTPフォールバック | 初期 |
| LearningRuleRepository | HTTPフォールバック | 初期 |
| ConfirmedJournalRepository | HTTPフォールバック | 初期 |
| StaffRepository | HTTPフォールバック | DL-042 |
| ClientRepository | HTTPフォールバック | DL-042 |
| DocumentRepository | HTTPフォールバック | DL-042 |
| ListViewRepository | HTTPフォールバック | P3-1 |
| DriveRepository | HTTPフォールバック | P3-2 |
| ExportRepository | HTTPフォールバック | P3-3 |
| MfAuthRepository | HTTPフォールバック | P3-4 |
| AttachmentRepository | HTTPフォールバック | P3-5 |
| CommentRepository | HTTPフォールバック | P3-5 |
| AdminRepository | HTTPフォールバック | P3-6 |
| ClientTaxCategoryRepository | HTTPフォールバック | P3-7 |
| LeadExtraRepository | HTTPフォールバック | P3-7 |

Supabase移行時はsupabase実装を差し替えるだけの構造になっている。

---

## 6. P2実装結果: Route→Store直呼びのService化

### 対象

[confirmedJournalRoutes.ts](file:///c:/dev/receipt-app/src/api/routes/confirmedJournalRoutes.ts) 内の3箇所。
Route層にビジネスロジック（CSVパース、バッチID生成等）が混在していた → Service化完了。

| エンドポイント | 移行前 | 移行後 | 状態 |
|---|---|---|---|
| POST /:clientId/import | Route→Store直 | Route→Service→Store | ✅完了 |
| DELETE /batch/:batchId | Route→Store直 | Route→Service→Store | ✅完了 |
| DELETE /:clientId | Route→Store直 | Route→Service→Store | ✅完了 |

---

## 7. P3実装結果: フロントのfetch()直叩き→repos移行

### 実装完了

| フェーズ | カテゴリ | 件数 | 対象ファイル | 状態 |
|---|---|---|---|---|
| P3-1 | ListViewRepository | 9→0 | MockMasterClientsPage, LeadListPage, ListViewEditPage, ListViewSettingsPage | ✅ |
| P3-2 | DriveRepository | 16→0 | MockDriveUploadPage, MockDriveSelectPage, MockUploadSelectorUnifiedPage, MockUploadDocsPage, MockOutputPortalPage, MockExcludedHistoryPage, MockSupportingHistoryPage, MockPortalLoginPage | ✅ |
| P3-3 | ExportRepository | 7→0 | MockExportPage, MockExportHistoryPage, MockExportDetailPage | ✅ |
| P3-4 | MfAuthRepository | 11→0 | MockClientAccountsPage, MockMasterAccountsPage, MockPortalPage, MockAdminDashboardPage, MockPortalLoginPage | ✅ |
| P3-5 | Attachment+Comment | 12→0 | ClientEditPage, LeadEditPage | ✅ |
| P3-6 | AdminRepository | 4→0 | MockAdminDashboardPage, ScreenH_TaskDashboard, MockProgressDetailPage | ✅ |
| P3-7 | 既存repos統合 | 5→0 | MockClientTaxPage, MockClientAccountsPage, LeadListPage, LeadEditPage | ✅ |

### 対象外（意図的除外）

| 種別 | 件数 | 理由 |
|---|---|---|
| blob DL（download-supporting / download-excluded） | 6件 | JSONでないバイナリDL。reposの抽象化に不向き |

### 基盤作業（全カテゴリ共通）

```
実施済み:
1. repositories/types.ts に Repository型を9カテゴリ分追加
2. repositories/mock/ に HTTP実装を9ファイル作成
3. mock/index.ts に未実装スタブ追加（throw new Error パターン）
4. http/index.ts に HTTP実装を登録
5. supabase/index.ts に HTTP版フォールバックを登録
6. useRepositories.ts composable作成（シングルトンキャッシュ）
7. 対象Vueファイルの fetch() → repos.xxx.method() に書き換え
```

### 型チェック

`npx vue-tsc --noEmit` → ✅ パス済み

---

## 8. P3リファクタリング検証（旧HTTP契約との一致証明）

> P3は「fetch → repos」の純粋リファクタリング。最重要なのは**旧HTTP契約と新HTTP契約が完全一致**していること。

### 検証項目

| # | 検証項目 | 手法 | 結果 |
|---|---|---|---|
| 0 | FormData / Content-Type問題 | コード確認 | ✅ FormData送信箇所はapiClient未使用。直接fetchしている |
| 1 | URL / HTTPメソッド / Query / Path一致 | コード比較 | ✅ 全件一致（**F2除く**） |
| 2 | Request Body構造一致 | コード比較 | ✅ 全件一致 |
| 3 | Response型一致 | コード比較 | ✅ 問題なし |
| 4 | エラー処理差異 | コード比較 | ✅ P3対象全箇所がtry/catchで囲まれている |
| 5 | vue-tsc | 実行 | ✅ パス済み |
| 6 | 実機Networkタブ確認 | ブラウザ | ✅ 全画面正常表示確認済み |

### apiClientの振る舞い差異（検証時の着眼点）

| 項目 | 元の`fetch()` | `apiClient`経由 | 実際の影響 |
|---|---|---|---|
| GETリトライ | なし | `fetchWithRetry`で自動リトライ | 改善（API起動待ち対応） |
| POSTリトライ | なし | `fetchWithRetry`で自動リトライ | 改善 |
| PUT戻り値 | `res.json()`可能 | `void`を返す | 該当箇所なし（PUTのレスポンスボディ使用箇所0件） |
| エラー時 | `if(res.ok)`で無視するコードあり | 常に例外を投げる | P3対象全箇所がtry/catchで囲まれており問題なし |

### 発見事項

| # | 問題 | 重要度 | 対象 | 結果 |
|---|---|---|---|---|
| **F1** | downloadSupporting/downloadExcludedがapi.get()でJSON解析 | 🟢 無害 | [drive.repository.http.ts](file:///c:/dev/receipt-app/src/repositories/mock/drive.repository.http.ts) | Vueから呼ばれていない。blob DLは直接fetchのまま |
| **F2** | saveByClientがPUT→POSTに変わっていた | 🔴 **バグ・修正済み** | [clientTaxCategory.repository.http.ts](file:///c:/dev/receipt-app/src/repositories/mock/clientTaxCategory.repository.http.ts) | 直接fetchでPUTに修正済み |
| **F3** | 元fetchでエラー無視だった箇所がapiClient経由で例外投げに変わる | 🟢 問題なし | 全般 | P3対象全箇所がtry/catchで囲まれている |
| **F4** | listView.saveViewsでres.okチェックなし | 🟢 低 | [listView.repository.http.ts](file:///c:/dev/receipt-app/src/repositories/mock/listView.repository.http.ts) | 元のfetchも同様にチェックなしだった |
| **F5** | MockMasterClientsPage.vueのuseRepositories重複import | 🔴 **バグ・修正済み** | [MockMasterClientsPage.vue](file:///c:/dev/receipt-app/src/views/master/MockMasterClientsPage.vue) L540 | コンパイルエラーで画面全体が表示不可。重複削除で修正 |

> [!CAUTION]
> **F2は検証しなければ発見できなかった致命的バグ。** 顧問先税区分の保存がAPIルート（PUT）と不一致（POST）のため、404エラーで完全に壊れていた。
> リファクタリング時のHTTPメソッド転記ミス。

### 実機検証結果

| 画面 | URL | 結果 | 確認内容 |
|---|---|---|---|
| 管理者ダッシュボード | `/admin-dashboard` | ✅ 正常表示 | 登録顧問先数15件、稼働中13件、担当者数6名 |
| 顧問先一覧 | `/master/clients` | ✅ 正常表示 | 1〜13 / 全13件。F5修正後コンパイル正常 |
| 全社税区分マスタ | `/master/tax` | ✅ 正常表示 | ユーザー指定URLで確認 |
| 顧問先税区分（MF連携済み） | `/client-settings/tax/c_wTdnMKDO` | ✅ 正常表示 | PUT保存成功（サーバーログで151件永続化を確認） |
| 顧問先税区分（MF未連携） | `/client-settings/tax/c_VdAnGFq3` | ✅ 正常表示 | ユーザーブラウザ + サブエージェントで確認 |
| リード一覧 | `/master/leads` | ✅ 正常表示 | 1〜2 / 全2件 |
| リード編集 | `/master/leads/l_mN3pQ7xR` | ✅ 正常表示 | コメントセクション表示（1件）。P3-5b CommentRepository動作確認 |
| エクスポート | `/export/c_I9YZIpVE` | ✅ 正常表示 | 「出力対象のデータがありません」（0件、正常） |

> 全画面 http://localhost:5173 で検証。スクリーンショット撮影済み。

---

## 関連設計書

| ドキュメント | 関係 |
|---|---|
| [53_client_account_architecture.md](file:///c:/dev/receipt-app/docs/genzai/53_client_account_architecture.md) | 顧問先科目Override方式。Repository構造の前提 |
| [50_romaji_id_migration.md](file:///c:/dev/receipt-app/docs/genzai/50_romaji_id_migration.md) | ID体系。generateMasterId()関連 |

