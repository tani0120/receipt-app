# Supabase移行 全体計画

> 作成日: 2026-06-28
> ベース: [migration_tasks.md](file:///c:/dev/receipt-app/docs/supabase/migration_tasks.md)（全13セクション, 793行）
> 前提: [store_direct_import_inventory.md](file:///C:/Users/kazen/.gemini/antigravity-ide/brain/2efc35e5-fd85-4597-a9c8-7cb0fb780331/store_direct_import_inventory.md)（全Store棚卸し）
> 前提: [61_journal_field_inventory.md](file:///c:/dev/receipt-app/docs/genzai/61_journal_field_inventory.md)（Phase 0-3完了記録）

---

## 全体像

```
Phase 3.5  Pipelineコア直接import移行（3 Store, 8箇所）
     ↓
Phase 3.6  残り全Store直接import移行（10 Store, 52箇所）
     ↓
Phase 3.7  計画外Store 7件の棚卸し + Repository化 ← ★2026-06-30 監査で発覚
     ↓  全Store(※)がRepository(mock)経由。可逆性が最大化
     ↓  VITE_USE_MOCK=true/false で JSON⇔Supabase を環境変数1つで切替可能
     ↓  ※ guestUserStoreはSupabase Auth統合のため対象外、mfAuthServiceは認証トークン管理のため対象外
Phase A    DB基盤（テーブル作成 + seed + マイグレーションSQL）
     ↓  データの器ができる
Phase B    データ移行（JSON/TS → Supabase DB）+ Supabase版Repository作成
     ↓  全データがDBに入る。旧Store + JSONファイルを削除
Phase C    認証・RLS本番化 + ゲスト認証厳格化
     ↓  セキュリティが本番レベルになる
Phase D    フロント統合（localStorage廃止 + composable統一 + Realtime）
     ↓  UIがSupabaseと直接連携
Phase E    後回し項目 + 運用基盤（Anonymizer, CI, Edge Functions等）
```

### 設計原則

1. **下層→上層の順**（DB → API/Repository → フロント）
2. **同じ種類の作業はまとめてやる**（import差し替え60件 → Supabase版作成 → 認証 → フロント）
3. **Phase 3.5/3.6 + Phase A-B は可逆**（`VITE_USE_MOCK=true`でJSON開発に即復帰）
4. **Phase C以降は不可逆**（認証基盤が変わるため）
5. **Repositoryは単一ドメインのデータアクセスのみ**（複数ドメインの結合・ソートはRoute/Service層の責務）
6. **Repositoryに変換ロジックを含めない**（FirstAiResponse→DocEntry等の変換は呼び出し側で行い、RepositoryはPartial<T>を受け取るだけ）

### なぜ「まとめて先に」やるか

| | まとめて先に（60件全部→Supabase） | テーブル単位で順番に |
|---|---|---|
| 作業の種類 | 1種類（import差し替え）の繰り返し | 毎回2種類（import差し替え+Supabase版）を切り替え |
| 中間状態 | なし | 「documentsはSupabase、clientsはJSON」が長期間 |
| 失敗時の切り分け | ビルドエラーで即発見 | Repository移行の問題かSupabase側の問題か不明 |
| 可逆性 | 全件mock経由→いつでもJSONに戻せる | 途中のテーブルは戻せない |

---

## Phase 3.5: Pipelineコア直接import移行 ✅ 完了

> 詳細: [store_direct_import_inventory.md](file:///C:/Users/kazen/.gemini/antigravity-ide/brain/2efc35e5-fd85-4597-a9c8-7cb0fb780331/store_direct_import_inventory.md)
> 完了日: 2026-06-28

### 目的
accountDetermination.ts / firstAi.service.ts がvendorStore等を直接importしている「近道」を塞ぐ。

### タスク（8箇所）→ 全件完了

| # | 対象Store | 箇所数 | 対象ファイル | 状態 |
|---|---|:---:|---|:---:|
| 3.5-1 | vendorStore | 4 | accountDetermination.ts, vendorRoutes.ts, vendorListService.ts, server.ts | ✅ |
| 3.5-2 | learningRuleStore | 2 | firstAi.service.ts, learningRuleRoutes.ts | ✅ |
| 3.5-3 | industryVectorStore | 2 | firstAi.service.ts, industryVectorRoutes.ts | ✅ |

### 実施内容
- 全ファイルで`createMockRepositories()`経由に変更
- accountDetermination.ts: 同期呼び出し → await変換（関数は既にasync）
- server.ts: `loadVendors()` 削除（Repository初期化で不要）
- learningRuleRoutes.ts / industryVectorRoutes.ts: 全ハンドラasync化

### 既知の問題（Phase 3.6以降で対応） → ✅ 全件解消済み

| ファイル | エンドポイント | 原因 | 対応 |
|---|---|---|---|
| vendorRoutes.ts | PUT /:vendorId | `VendorRepository`に`update`メソッド未定義 | ✅ Interface拡張済み（2026-06-30） |
| industryVectorRoutes.ts | PUT / | `IndustryVectorRepository`に`saveAll`メソッド未定義 | ✅ Interface拡張済み。Repository経由に移行済み |

### 検証結果
- `vue-tsc --noEmit` EXIT: 0（エラー0件）
- 3 Storeのトップレベル直接import = mock実装以外に0件
- dynamic import暫定残し = 0件（全解消）

---

## Phase 3.6: 残り全Store直接import移行

> 詳細: [store_direct_import_inventory.md](file:///C:/Users/kazen/.gemini/antigravity-ide/brain/2efc35e5-fd85-4597-a9c8-7cb0fb780331/store_direct_import_inventory.md) §②

### 目的
残り10 Store, 52箇所の直接importをRepository(mock)経由に移行。Phase 3.5と合わせて計13 StoreがRepository経由になる。

> [!WARNING]
> **2026-06-30 監査結果**: Phase 3.6は対象13 Storeについては完了しているが、計画が網羅していないStore 7件（11箇所の直接import）が残存。詳細は後述の「Phase 3.7」を参照。

### タスク（52箇所）

作業順序: 依存件数が多いStore（影響範囲が広い）から先に処理。

| # | 対象Store | 箇所数 | 対象ファイル | mock実装 | 移行状態 |
|---|---|:---:|---|:---:|:---:|
| 3.6-1 | clientsApi | 14 | admin.ts, clientRoutes.ts, mfRoutes.ts, firstAi.service.ts等 | ✅ client.repository.mock.ts | ✅ 完了 |
| 3.6-2 | accountMasterApi | 13 | accountMasterRoutes.ts, journalRoutes.ts, firstAi.service.ts等 | ✅ accountMaster.repository.mock.ts | ✅ 完了 |
| 3.6-3 | staffsApi | 9 | authRoutes.ts, staffRoutes.ts, admin.ts等 | ✅ staff.repository.mock.ts | ✅ 完了 |
| 3.6-4 | documentsApi | 5 | docStore.ts, drivePollingWorker.ts, admin.ts等 | ✅ document.repository.mock.ts | ✅ 完了 |
| 3.6-5 | leadStore | 3 | leadRoutes.ts, useLeads.ts | ✅ lead.repository.mock.ts | ✅ 完了 |
| 3.6-6 | exportHistoryStore | 3 | exportHistoryRoutes.ts, admin.ts, exportListService.ts | ✅ exportHistory.repository.mock.ts | ✅ 完了 |
| 3.6-7 | taxCategoryMasterApi | 2 | taxCategoryRoutes.ts | ✅ taxMaster.repository.mock.ts | ✅ 完了 |
| 3.6-8 | shareStatusStore | 1 | shareStatusRoutes.ts | ✅ shareStatus.repository.mock.ts | ✅ 完了 |
| 3.6-9 | commentStore | 1 | commentRoutes.ts | ✅ comment.repository.mock.ts | ✅ 完了 |
| 3.6-10 | notificationStore | 1 | notificationRoutes.ts | ✅ notification.repository.mock.ts | ✅ 完了 |

### 注意点
- ✅ 全タスク完了済み。Route/Serviceからの直接importは全てRepository経由に移行済み
- ✅ `IndustryVectorRepository.saveAll` Interface拡張済み（industryVectorRoutes PUTのdynamic import解消）
- ✅ `VendorRepository.update` Interface拡張済み（vendorRoutes PUTのdynamic import解消）

### dynamic import残留（2件）

> [!WARNING]
> 以下2件はRoute/ServiceからStoreへのdynamic importが残っている。
> いずれもRepository Interfaceに対応メソッドが未定義のため残留している。

| ファイル | 行 | import内容 | 原因 | 対応 |
|---|:---:|---|---|---|
| firstAi.service.ts | L56 | `getDocuments` from documentsApi | DocumentRepositoryに対応メソッド未定義 | Interface拡張が必要 |
| mfTaxImportService.ts | L554 | `enrichRow` from taxCategoryMasterApi | 純粋な変換処理。dynamic importで正しい | ⚠️ 変換関数のService→Service呼び出し。DL-050の対象外（データアクセスではない） |

### Store間の直接import依存（意図的な残留）

> [!CAUTION]
> 以下はStore層→Store層の依存であり、設計上は正しい方向の依存。
> ただし、**Phase Bで旧Storeを削除する際の順序制約になる**。
>
> - `journalStore.ts` → `clientsApi.getById()` … clientsApiを先に削除するとjournalStoreが壊れる
> - `accountMasterApi.ts` → `taxCategoryMasterApi` … taxCategoryMasterApiを先に削除するとaccountMasterApiが壊れる
> - `migrationWorker.ts` → `documentsApi.convertFirstAiToDocFields()` … 変換関数のみ。documentsApi削除時に変換関数を別ファイルに移動するか、Supabase版workerでは不要になる
>
> Phase Bでは「全StoreをSupabase版に差し替えてから一括削除」するか、削除順序を守る必要がある。

### ✅ 2026-06-30 完了: ListService統合 + 循環参照解消 + updateAiResults分離

> [!NOTE]
> Phase 3.6の準備として以下の設計的負債を全件解消済み。

#### ListService → Repository.list() 統合（循環参照の根本解決）

Repository mock → ListService → createMockRepositories → Repository mock の循環参照を根本解決。
4つのListServiceのフィルタ・ソート・ページネーションロジックをRepository.list()に統合し、ListServiceファイルを削除。

| 旧ListService（削除済み） | 統合先Repository mock |
|---|---|
| vendorListService.ts | vendor.repository.mock.ts |
| clientListService.ts | client.repository.mock.ts |
| staffListService.ts | staff.repository.mock.ts |
| leadListService.ts | lead.repository.mock.ts |

**設計判断**: staffNameソート（Client+Staffの結合）はRepository層に含めない。Route/Service層で`staffRepo.getAll()` + `clientRepo.list()` を取得して結合ソート。Supabase移行時に性能要件が出た場合のみ、Repository interfaceに `sortBy: 'staff_name'` を追加してJOIN + ORDER BYで対応する（YAGNI原則）。

**トレードオフ: ページネーションとの整合性**:
staffNameソートをService層で行う場合、Repository.list()のページネーションは使えない（50件だけ取得してその中でソートしても全件ソートにならない）。そのためstaffNameソート時は**全件取得→Service側ソート→自前スライス**が必要になる。現状JSON（メモリ上の全件）では性能問題なし。Supabase移行時にデータ量が増えて性能問題が出た場合、その時点でRepository.list()にJOIN検索を追加する。

#### updateAiResults 変換ロジック分離

`FirstAiResponse → DocEntry` の変換ロジックをRepository外に分離。
- `documentsApi.ts` に `convertFirstAiToDocFields()` 変換関数を新設
- Repository interfaceの `updateAiResults()` は `Partial<DocEntry>` のみ受け取る設計に変更
- types.ts から `FirstAiResponse` のimportを削除

#### migrationWorker Repository経由化

`migrationWorker.ts` の `updateAiResults` 直接importをRepository経由に変更。
`convertFirstAiToDocFields()` で変換後、`documentRepo.updateAiResults()` で保存。

#### journalStore 循環参照解消

`createMockRepositories().client` → `clientsApi.getById()` 直接importに変更。
Store層→Store層の依存は正しい方向なので、Repository経由にする必要がない。遅延初期化ハックを完全除去。

### 完了条件
- 対象13 Storeの直接importがmock実装ファイル以外に0件 → ✅ 達成
- `vue-tsc --noEmit` エラー0件 → ✅ 達成
- `VITE_USE_MOCK=true`（JSON）と`VITE_USE_MOCK=false`（Supabase）の両方でビルド通過 → ❓ 未検証

> [!CAUTION]
> **旧完了条件「全21 Storeの直接import = 0件」は未達成。**
> 計画が対象とした13 Storeは完了しているが、計画外の7 Storeが手付かず。
> Phase 3.7で対応する。

---

## Phase 3.7: 計画外Store棚卸し + Repository化 ★2026-06-30 監査で追加

> 追加理由: Phase A開始前の監査で、Phase 3.6が対象としていない永続化Store 7件が発覚。
> これらはRoute/Serviceから直接importされており、Phase Bの旧Store削除やPhase Aのテーブル設計に影響する。

### 全Store棚卸し結果（2026-06-30 監査 → 再調査 → 実装反映）

`src/api/` 配下でJSON永続化（readFileSync/writeFileSync）を持つ全ファイル（scripts/は除外）：

| # | Store | Phase 3.5/3.6対象 | Repository mock | 直接import残留 | DB化対象 | 状態 |
|---|---|:---:|:---:|:---:|---|:---:|
| 1 | vendorStore | ✅ 3.5 | ✅ | 0件 | vendors | ✅ |
| 2 | learningRuleStore | ✅ 3.5 | ✅ | 0件 | learning_rules | ✅ |
| 3 | industryVectorStore | ✅ 3.5 | ✅ | 0件 | industry_vectors（seed） | ✅ |
| 4 | clientsApi | ✅ 3.6 | ✅ | 1件（journalStore→Store→Store依存） | clients | ✅ |
| 5 | accountMasterApi | ✅ 3.6 | ✅ | 4件（taxCategoryMasterApi→Store→Store依存） | accounts | ✅ |
| 6 | staffsApi | ✅ 3.6 | ✅ | 0件 | staff | ✅ |
| 7 | documentsApi | ✅ 3.6 | ✅ | 1件（migrationWorker→変換関数） | documents | ✅ |
| 8 | leadStore | ✅ 3.6 | ✅ | 0件 | leads | ✅ |
| 9 | exportHistoryStore | ✅ 3.6 | ✅ | 0件 | export_history | ✅ |
| 10 | taxCategoryMasterApi | ✅ 3.6 | ✅ | 0件 | tax_categories | ✅ |
| 11 | shareStatusStore | ✅ 3.6 | ✅ | 0件 | share_status | ✅ |
| 12 | commentStore | ✅ 3.6 | ✅ | 0件 | comments | ✅ |
| 13 | notificationStore | ✅ 3.6 | ✅ | 0件 | notifications | ✅ |
| 14 | journalStore | ✅ 3.6（mock既存） | ✅ | 0件 | journals | ✅ |
| 15 | confirmedJournalsApi | ❌ 計画外 | 部分的※ | 0件（Route経由）| journals（統合） | ⚠️ |
| 16 | aiLogStore | ❌ 計画外 → **3.7** | ✅ aiLog.repository.mock.ts | **0件** | ai_command_logs + ai_chat_sessions | ✅ 完了 |
| 17 | mfRawDataStore | ❌ 計画外 → **3.7** | ✅ mfRawData.repository.mock.ts | **0件** | mf_raw_data | ✅ 完了 |
| 18 | mfTaxAvailableStore | ❌ 計画外 → **3.7** | ✅ mfTaxAvailable.repository.mock.ts | **0件**（※1件③許容） | mf_tax_available | ✅ 完了 |
| 19 | conversionStore | ❌ 計画外 → **3.7** | ✅ conversion.repository.mock.ts | **0件** | conversion_logs | ✅ 完了 |
| 20 | activityLogStore | ❌ 計画外 → **3.7** | ✅ activityLog.repository.mock.ts | **0件** | activity_logs | ✅ 完了 |
| 21 | supportingSearchService | ❌ 計画外 → **3.7** | ✅ supportingSearch.repository.mock.ts | **0件** | supporting_meta | ✅ 完了 |

### DL-050 判断基準（Phase 3.7で確定）

```
データの性質
    ↓
Repository管理対象か？（業務データ・ユーザー更新データ）
    ↓
YES → まだ長く使うか？（廃止・置換予定がないか）
        YES → ② Repository化する
        NO  → ③ 違反を認識して据え置き（計画書で理由を明記）
NO → ① DL-050 適用対象外
```

| 区分 | 判断基準 | 対応 |
|---|---|---|
| ① 適用対象外 | Repositoryが管理すべきデータではない（変換ルール・システム設定・バイナリI/O等） | Repository化しない |
| ② 適用対象 | Repository管理すべき業務データ | Repository化する |
| ③ 違反を一時許容 | 本来は②だが、構造的制約（循環参照等）または廃止・置換予定のため投資回収できない | 計画書で理由を明記し据え置き |

> [!IMPORTANT]
> ①の「適用対象外」は「データの性質」による設計判断。
> ③の「違反を一時許容」は「ライフサイクル」または「構造的制約」によるコスト判断。
> この2つを混同しないこと。

### Phase 3.7の対象外ファイル一覧

**① DL-050 適用対象外（Repositoryが管理すべきデータではない）:**

| ファイル | 永続化内容 | 理由 |
|---|---|---|
| migrationRepository.json.ts | data/migration_jobs.json | ✅ 既にMigrationRepository interfaceの実装。Repository化完了済み |
| ai/storage.ts | data/storage/ にバイナリ保存 | ✅ 既にStorageProvider interfaceでSupabase/ローカル切替済み |
| mfAuthService（7件） | data/mf-tokens.json | OAuthトークン管理。Repositoryではなく**Supabase Vault**が適切な管理方式 |
| pipeline.ts（route） | data/uploads/{clientId}/ にファイル保存 | バイナリファイルI/O。Repositoryではなく**Supabase Storage**が適切な管理方式（Phase E） |
| drive/driveService.ts | ファイルバッファ保存 | 同上 |
| normalizeConfirmedJournalsService.ts | data/account-alias-map.json（読み取りのみ） | DB（Supabase）の管理対象ではないアプリケーション変換ルール。tax-id-rules.jsonと同分類。起動時に読む設定ファイル |
| taxIdGenerator.ts | data/tax-id-rules.json（読み取りのみ） | 同上。起動時に1回読む変換ルールファイル |
| ocr_service.ts / cache_manager.ts | 画像ファイル読み取りのみ | readFileSyncで画像Bufferを読むだけ。永続化なし |
| image_preprocessor.ts | 画像ファイル読み取りのみ | fsはPDFバッファの読み込みのみ。永続化なし |

**② DL-050 適用対象（Repository化する → 修正すべき違反）:**

| ファイル | 永続化内容 | 対応 |
|---|---|---|
| ~~mfMappingService.ts~~ | ~~data/tax-category-master.json（読み取りのみ）~~ | ✅ **修正済み（2026-06-30 第1回実装）**: taxMasterRepo経由に変更 |

**③ DL-050 違反を一時許容（本来②だが、構造的制約または廃止・置換予定のため投資しない）:**

| ファイル | 永続化内容 | 理由 | 解消時期 |
|---|---|---|---|
| guestUserStore（1件） | data/guest_users.json | Supabase Auth統合で`signInWithPassword/signUp`に置換。Repository化しても使い捨て | Phase C |
| listViewRoutes.ts（route） | data/list-views/{entityType}.json | Route内で直接readFile/writeFile。Phase DでSupabase化時にRoute書き換えで解消 | Phase D |
| fieldLayoutRoutes.ts（route） | data/field-layouts/{pageId}.json | 同上 | Phase D |
| aiPromptRoutes.ts（route） | data/ai-prompts/prompts.json | Route内で直接readFile/writeFile。Phase Eの「AI_PROMPTS定数DB移行」で解消。**Phase E到達前はRoute削除不可** | Phase E |
| attachmentRoutes.ts（route） | data/attachments/{clientId}/ にファイル+メタJSON | ファイル本体はSupabase Storage移行。**メタJSON（`.meta.json`: ファイル名・サイズ・uploadedAt）はDB化対象→Phase A-2にattachmentsテーブル追加済み**。メタとファイル本体の結合度が高く、Phase Eで一体移行する方が合理的 | Phase E |
| **taxCategoryMasterApi.ts L96**（1箇所） | `getTaxAvailableForMethod`直接import | **循環参照回避**: taxCategoryMasterApi.ts自体がTaxMasterRepository実装の内部に近い。ここに`createMockRepositories()`を導入すると `mock/index.ts → taxMaster.repository.mock.ts → taxCategoryMasterApi.ts → createMockRepositories() → mock/index.ts` の循環が発生する。Supabase移行時にファイルごとDB版に置き換わるため自然消滅 | Phase B |

**data/配下のアプリ無関係ファイル（3方法突合で確認済み）:**

| ファイル | 中身 | コードからの参照 | 結論 |
|---|---|:---:|---|
| settings_backup_reinstall.json | VS Code設定バックアップ（`workbench.colorTheme`等） | 0件 | アプリ無関係。手動保存された残骸 |
| test-results/*.json | scripts/のテスト出力（mcp_tools_dump等） | 0件（scripts/のみ） | 開発ツール出力。移行対象外 |
| romaji_*.json | scripts/romaji_benchmark出力 | 0件（scripts/のみ） | 開発ツール出力。移行対象外 |
| test-new-accounts.json | テストデータ | 0件 | 開発用。移行対象外 |

※ confirmedJournalsApiの「部分的」: `confirmedJournal.repository.mock.ts`が存在するが、これは`confirmedJournalsApi.ts`をラップしている。Route/ServiceはRepository経由で呼んでおり、Store直接importは0件。

### タスク（計6 Store, 13箇所）

| # | 対象Store | 参照元 | 箇所数 | 対象ファイル | 状態 |
|---|---|---|:---:|---|:---:|
| 3.7-1 | aiLogStore | Route | 2→12※ | aiCommandRoutes.ts（10箇所）, admin.ts（4箇所） | ✅ 完了 |
| 3.7-2 | mfRawDataStore | **Route+Service** | 6 | mfRoutes.ts（3箇所）, mfTaxImportService.ts（2箇所）, mfAccountImportService.ts（1箇所） | ✅ 完了 |
| 3.7-3 | mfTaxAvailableStore | **Route+Service** | 7（+1③許容） | mfRoutes.ts（3箇所）, mfTaxImportService.ts（4箇所）, ~~taxCategoryMasterApi.ts（1箇所③許容）~~ | ✅ 完了 |
| 3.7-4 | conversionStore | Route | 1 | conversion.ts（route） | ✅ 完了 |
| 3.7-5 | activityLogStore | Route | 1 | activityLogRoutes.ts | ✅ 完了 |
| 3.7-6 | supportingSearchService | Route | 2→5※ | journalRoutes.ts（1箇所）, drive.ts（4箇所） | ✅ 完了 |

※ 3.7-1: 当初の箇所数は「2件」だったが、aiLogStoreのメソッド数が20個あり実際の差し替え箇所は14箇所。
※ 3.7-6: drive.tsの参照が4箇所（searchSupporting, saveSupportingMeta, getSupportingMetaCount×2）。

> [!IMPORTANT]
> **3.7-2/3.7-3の特殊性**: 他の4 Store（3.7-1,4,5,6）はRoute層のみの参照だったが、
> mfRawDataStoreとmfTaxAvailableStoreは**Service層（mfTaxImportService, mfAccountImportService）からも直接import**されている。
> Service層は既に`createMockRepositories()`パターンを使用中（clientRepo, taxMasterRepo等）なので、
> 同じパターンで`mfRawDataRepo` / `mfTaxAvailableRepo`を追加取得する方針。

### ✅ 第1回実装完了（2026-06-30）

| タスク | 変更内容 |
|---|---|
| mfMappingService DL-050違反修正 | `readFile`→`taxMasterRepo.getMaster()`経由に変更 |
| zodバリデーション修正 | `display_order`, `date_on_document`, `voucher_type`の3フィールドを`.optional()`に変更 |
| 3.7-4: conversionStore | ConversionRepository Interface + mock + Route差し替え |
| 3.7-5: activityLogStore | ActivityLogRepository Interface + mock + Route差し替え |

### ✅ 第2回実装完了（2026-06-30）

| タスク | 変更内容 |
|---|---|
| 3.7-1: aiLogStore | AiLogRepository Interface（20メソッド+4集計型）+ mock + aiCommandRoutes.ts（10箇所）+ admin.ts（4箇所）差し替え |
| 3.7-6: supportingSearchService | SupportingSearchRepository Interface + mock + journalRoutes.ts（1箇所）+ drive.ts（4箇所）差し替え |

### ✅ 第3回実装完了（2026-06-30）

**他のStoreと構造が異なる点:**
- Route層だけでなく**Service層（mfTaxImportService, mfAccountImportService）からも直接import**されていた
- taxCategoryMasterApi.tsは循環参照リスクにより**③一時許容**（1箇所のみ。Phase Bで自然消滅）
- 型（`MfRawDataEnvelope`, `TaxMethodKey`, `TaxAvailableMap`）を`types.ts`に新規定義

| タスク | 変更内容 |
|---|---|
| 3.7-2: mfRawDataStore | MfRawDataRepository Interface（3メソッド+MfRawDataEnvelope型）+ mock + mfRoutes.ts（3箇所）+ mfTaxImportService.ts（2箇所）+ mfAccountImportService.ts（1箇所）差し替え |
| 3.7-3: mfTaxAvailableStore | MfTaxAvailableRepository Interface（4メソッド+TaxMethodKey/TaxAvailableMap型）+ mock + mfRoutes.ts（3箇所）+ mfTaxImportService.ts（4箇所）差し替え。taxCategoryMasterApi.ts（1箇所）は③一時許容 |

### confirmedJournalsApi 経路整理

> [!WARNING]
> confirmedJournalsApiのRoute/Serviceは既にRepository経由に移行済み（Store直接import 0件）。
> ただし以下の問題が残存：
>
> 1. **normalizeConfirmedJournalsService L35**: `readFileSync`で`account-alias-map.json`を直接読んでいる → **① DL-050適用対象外**（アプリケーション変換ルール。修正不要）
> 2. ~~**mfMappingService L120**: `readFile`で`tax-category-master.json`を直接読んでいる~~ → ✅ **修正済み（2026-06-30）**: taxMasterRepo経由に変更
> 3. ~~**journals + confirmed_journals の統合/分離方針**~~ → ✅ **1テーブル統合に確定（2026-07-01）**: A-1.5で調査完了。source列で分岐、Repository Interfaceは統合不要

### zodバリデーション警告 → ✅ 修正済み（2026-06-30）

> [!NOTE]
> zodスキーマの3フィールド（`display_order`, `date_on_document`, `voucher_type`）を`.optional()`に変更済み。
> 1898件の不適合警告は解消。Phase AのDB設計方針は以下の通り:
> - `display_order`: DBではNOT NULL + DEFAULT 0
> - `date_on_document`: DBではNOT NULL + DEFAULT true
> - `voucher_type`: @deprecated。DBではNULLABLE

### 完了条件
- ✅ Phase 3.7対象6 Store全てのRepository Interface + mock + Route/Service差し替え完了
- ✅ zodバリデーション警告3フィールド修正済み
- ✅ mfMappingService DL-050違反修正済み
- ⚠️ taxCategoryMasterApi.ts 1箇所: ③一時許容（循環参照回避。Phase Bで自然消滅）
- ✅ journals + confirmed_journals → **1テーブル統合に確定**（2026-07-01 A-1.5判断完了）
- ✅ `tsc --noEmit` エラー0件（第1回〜第3回実装後に毎回確認済み）

---

## Phase A: DB基盤

> 対応: migration_tasks.md §4（DB設計）+ §8-1の一部

### 目的
Supabase上に全テーブルを作成する。データはまだ入れない。

### Phase Aの実行順序（2026-06-30確定）

```
A-1    既存SQL 5本のレビュー
  ↓    ENUM/FK/CHECK/migration方針の前提が見える
A-1.5  Journalデータモデル差分調査 → 統合/分離の設計判断
  ↓    CREATE TABLEを書く前に差分一覧で客観的に判断
A-2    新規SQL作成（journalsのテーブル設計含む）
  ↓
A-3    ENUM型・CHECK制約
  ↓
A-4    seedスクリプト
  ↓
A-5    clientId発番方式（UUID移行）
```

> [!IMPORTANT]
> **A-1.5を先にやる理由**: 「型が同じだからテーブルも1つ」はまだ証明されておらず、
> 「ライフサイクルが違うからRepositoryは分ける」もまだ証明されていない。
> A-1で既存SQLのENUM/FK/CHECK制約の全体像が見えてから、journalsの統合/分離を
> **実際のデータモデルとライフサイクルの差分に基づいて**判断する。
> 案C（Phase Aでは2テーブル→Phase Bで統合）は**判断の先送り**であり、
> 統合するなら migration/Repository/seed/FK 全て二度設計になるため採用しない。

### A-1: 既存SQLの確認・更新 → ✅ レビュー完了（2026-07-01）

| テーブル | SQL | 状態 | レビュー結果 |
|---|---|:---:|---|
| share_status + invitations + client_users | 001_share_status.sql | ✅作成済み | ✅ 問題なし |
| clients + vendors_global | 002_core_tables.sql | ✅作成済み | 🔴 **要修正6件**（後述） |
| documents | 003_documents.sql | ✅作成済み | 🔴 **要修正2件**（後述） |
| staff | 004_staff.sql | ✅作成済み | 🟡 注意2件（後述） |
| migration_jobs | 005_migration_jobs.sql | ✅作成済み | ✅ 問題なし |
| *(receipts + audit_logs)* | *schema.sql（参考）* | *未配置* | 🔴 **要整理2件**（後述） |

#### 🔴 重大問題（5件）

| ID | SQL | 問題 | 詳細 |
|---|---|---|---|
| C-1 | 002 | **clients.type: CHECK値不一致** | SQL: `'corp','individual'`（2値）。アプリ: `'corp','individual','sole_proprietor'`（3値） |
| C-2 | 002 | **clients.consumption_tax_mode: CHECK値不一致** | SQL: `'general','simplified','exempt'`。アプリ: `'individual','proportional','simplified','exempt'`（4値） |
| C-3 | 002 | **clients.tax_method: CHECK値不一致** | SQL: `'inclusive','exclusive'`。アプリ: `'tax_included','tax_excluded_included','tax_excluded_separate'`（3値） |
| D-1 | 003 | **documents.status: CHECK値がschema.sqlのreceipt_status ENUMと矛盾** | 003: 4値。schema.sql: 7値。同じ証票エンティティに2つのステータス定義が存在 |
| R-1 | schema | **receiptsとdocumentsの関係が未定義** | schema.sqlの`receipts`はStreamed互換設計、003の`documents`はDrive取込用。統合方針が必要 |

#### 🟡 注意問題（5件）

| ID | SQL | 問題 | 詳細 |
|---|---|---|---|
| C-4 | 002 | **clients: 約60フィールド未反映** | アプリのClient型は約100フィールド（Kintoneスタイル拡張含む）。SQLは約30カラム |
| C-5 | 002 | **camelCase→snake_case命名規則** | SQL側はsnake_case、アプリ側はcamelCase。マッピング層が必要 |
| C-6 | 002 | **vendors: Vendor型との差分未確認** | Phase 3以前の定義。現在のVendor型と差分がある可能性 |
| S-1 | 004 | **staff.uuid: PK命名** | `uuid`はPostgreSQL予約語に近い。`staff_id`が望ましい |
| R-2 | schema | **schema.sqlの配置場所** | `src/repositories/supabase/`にあるが`supabase/migrations/`に統合すべきか |

#### ENUM/FK/CHECK 全体マップ（A-1レビューで確定）

| テーブル | ENUM/CHECK数 | FK | 問題 |
|---|---|---|---|
| user_profiles | 1 | auth.users | ✅ |
| invitations | 0 | auth.users | ✅ |
| client_users | 0 | auth.users | ✅ |
| share_status | 1 | invitations(code) | ✅ |
| clients | 6個のCHECK | — | ⚠️ C-1,C-2,C-3 |
| vendors | 5個のCHECK | — | 🟡 C-6 |
| accounts | 2個のCHECK | — | ✅ |
| client_accounts | 0 | clients, accounts | ✅ |
| industry_vectors | 1 | accounts(id) | ✅ |
| documents | 2個のCHECK | clients(client_id) | ⚠️ D-1 |
| staff | 2個のCHECK | — | 🟡 S-1 |
| migration_jobs | 2個のCHECK | — | ✅ |
| receipts（schema.sql） | receipt_status ENUM | — | ⚠️ R-1 |

### A-1.5: Journalデータモデル差分調査 → 統合/分離判断

> 追加理由: 「統合するか」ではなく「統合できる条件が揃っているか」を客観的に判断するため。
> CREATE TABLEを書く前に差分一覧を作るべき（2026-06-30ユーザー指示）。

#### 実データの基本情報（2026-06-30調査済み）

| 項目 | AI仕訳（journals） | 確定仕訳（confirmed） |
|---|---|---|
| 件数 | 38件（最大ファイル） | 1,898件（1ファイル） |
| source分布 | `legacy`: 36, `ai_pipeline`: 2 | `mf_import`: 1,898（全件） |
| フィールド数 | 35 | 20 |
| ファイル構造 | `journals-{clientId}.json`（顧問先別） | `confirmed_journals.json`（全顧問先1ファイル） |

#### フィールド差分一覧（調査済み）

| 分類 | フィールド数 | 具体例 |
|---|---|---|
| **共通（両方使用）** | 9 | journalId, client_id, voucher_date, description, source, debit/credit_entries, determination_method, memo |
| **confirmed専用** | 8 | import_batch_id, imported_at, mf_transaction_no, mf_journal_type, is_closing_entry, tags, mf_raw, direction |
| **AI専用** | 16 | display_order, document_id, status, deleted_at, labels, warning_dismissals, export_batch_id, invoice系, staff_notes等 |
| **両方未使用** | 4 | line_id, source_type, vendor_vector, vendor_id |

#### ライフサイクル差分（調査済み）

| 操作 | AI仕訳 | confirmed |
|---|---|---|
| **作成** | Pipeline（1件ずつID発番） | バッチインポート（重複排除付き） |
| **更新** | フィールド単位PATCH（ホワイトリスト制限） | 全件置換（正規化時のみ） |
| **削除** | ソフトデリート（deleted_at） | 物理削除（バッチ単位 or 顧問先単位） |
| **ステータス遷移** | null→exported | なし（全件historical相当） |
| **主用途** | 仕訳一覧→編集→エクスポート | 科目確定照合（match_key検索）・MF送信 |

#### 統合/分離判断 → ✅ **1テーブル統合に確定**（2026-07-01）

> [!IMPORTANT]
> **判断を確定させた3つの事実:**
>
> **1. アプリ層が既に1テーブルとして扱っている**
> `journalListService.ts` L424-441: 通常仕訳とconfirmedを同一`JournalListRow[]`配列に`push`して
> ソート・検索・集計を実行。`isMfJournal()`（=`source`列判定）で分岐。
>
> **2. 型は完全に同一**
> `JournalListRow = Journal`（型エイリアス）。判別は`source`列のみ。
> 型レベルの分離は既に存在しない。
>
> **3. 物理/ソフト削除の違いはJSON実装制約であり、DB設計制約ではない**
> DB移行後は`DELETE FROM journals WHERE import_batch_id = ?`（物理削除維持）も
> `UPDATE SET deleted_at = now()`（ソフトデリート統一）も選択可能。

#### 統合方式（確定）

```
JournalRepository ────────→ journals テーブル（WHERE source IN ('ai_pipeline','manual','legacy')）
ConfirmedJournalRepository → journals テーブル（WHERE source IN ('mf_import','system')）
```

- **Repository Interfaceは統合しない**: `JournalRepository`（7メソッド）と`ConfirmedJournalRepository`（10メソッド）をそのまま維持
- **Supabase版の実装だけが同じテーブルを参照する**: mock層は変更ゼロ。Phase 3.7の安定性に影響なし
- **source列がパーティション**: CHECK制約 `source IN ('ai_pipeline','manual','legacy','mf_import','system')` で保護

### A-2: 新規SQL作成

#### ✅ 設計判断全件確定済み（2026-07-01）— CREATE TABLEが書ける状態

> [!NOTE]
> 依存グラフ分析と実データ調査により、全ブロッカーが解消。
> 判断順序: J-5→J-1→J-2,J-3,J-4→J-6（依存関係による決定論的順序）

| ID | 設計判断 | **確定結果** | 根拠 |
|---|---|---|---|
| **J-5** | documents/receipts二重定義 | **receipts廃止。document_id FKはdocuments(id)参照** | receiptsはアプリコードでgrep 0件。KI（2026-02）の設計検討段階の遺物 |
| **J-1** | debit/credit_entries格納 | **JSONB列** | 実データ95%以上が1行。クエリは全てアプリ層で配列操作。DBレベル科目検索SQL不要 |
| **J-2** | labels格納 | **TEXT[]配列** | `labels.includes()`（含有チェック）のみ。`@>`演算子+GINインデックスで高速化可能 |
| **J-3** | staff_notes格納 | **JSONB列** | アプリ層で構造全体を読む。DBレベルの検索なし |
| **J-4** | mf_raw格納 | **JSONB列** | MF API全フィールド保持用 |
| **J-6** | journal_id形式 | **TEXT維持**（`jrn_XXXXXXXX`） | プレフィックスで可読性高い。UUIDにする利点なし。A-5（clientId UUID）とは独立 |
| テーブル統合 | journals + confirmed | **1テーブル統合** | A-1.5で確定（2026-07-01） |
| source列 | CHECK制約 | `IN ('ai_pipeline','manual','legacy','mf_import','system')` | 2026-07-01 |
| Repository統合 | 統合しない | 2つのInterfaceを維持、Supabase版だけ同じテーブル参照 | 2026-07-01 |
| camelCase/snake_case | SQL側snake_case | マッピングはSupabase版Repositoryで吸収 | A-1レビュー |

#### J-1 判断根拠: 実データ分布（2026-07-01調査）

| データ | 借方2行以上 | 貸方2行以上 | 最大行数 |
|---|---|---|---|
| AI仕訳（38件） | 2件（5%） | 4件（11%） | 借方3, 貸方10 |
| confirmed（1,898件） | 78件（4%） | 38件（2%） | 借方10, 貸方5 |

#### 🟡 確認のみ（判断材料あり）

| ID | 設計判断 | 判断材料 |
|---|---|---|
| J-7 | warning_details の扱い | 導出値（JSON保存除外済み）。DBにカラム不要 |
| J-8 | インデックス設計 | `client_id`, `source`, `voucher_date`, `match_key`, `import_batch_id`, `status`。クエリパターンから設計可能 |
| J-9 | RLSポリシー | 既存テーブルと同じパターン（staff全件、client_user自分のclient_idのみ） |

#### テーブル一覧

##### ✅ 作成済み

| テーブル | SQL | カラム/インデックス/RLS |
|---|---|---|
| **journals** | 006_journals.sql | 50カラム / 11インデックス / 2ポリシー |
| **journal_warning_dismissals** | 007_journal_warning_dismissals.sql | 5カラム / 2インデックス / 2ポリシー |
| **learning_rules + learning_rule_entries** | 008_learning_rules.sql | 14+13カラム / 3インデックス / 4ポリシー |
| **notifications** | 009_notifications.sql | 10カラム / 4インデックス / 2ポリシー |
| **mf_tokens** | 010_mf_tokens.sql | 8カラム / 0インデックス / 1ポリシー（スタッフのみ） |
| **ai_command_logs** | 011_ai_command_logs.sql | 24カラム / 5インデックス / 1ポリシー（スタッフのみ） |
| **ai_chat_sessions** | 012_ai_chat_sessions.sql | 5カラム / 2インデックス / 1ポリシー（スタッフのみ） |
| **activity_logs** | 013_activity_logs.sql | 8カラム / 4インデックス / 1ポリシー（スタッフのみ） |
| **conversion_logs** | 014_conversion_logs.sql | 9カラム / 1インデックス / 1ポリシー（スタッフのみ） |
| **supporting_meta** | 015_supporting_meta.sql | 12カラム / 3インデックス / 2ポリシー |
| **mf_raw_data** | 016_mf_raw_data.sql | 6カラム / 1インデックス / 1ポリシー（スタッフのみ） |
| **mf_tax_available** | 017_mf_tax_available.sql | 3カラム / 0インデックス / 1ポリシー（スタッフのみ） |

##### ⏸️ 後回し（低優先度。Phase D/E/seed対象）

| テーブル | 現在のデータソース | 対応時期 |
|---|---|---|
| **attachments** | data/attachments/{clientId}/{fileId}.meta.json | Phase E（メタのみ。本体はStorage） |
| **list_views** | data/list-views/{entityType}.json | Phase D（UI設定） |
| **field_layouts** | data/field-layouts/{pageId}.json | Phase D（UI設定） |
| **ai_prompts** | data/ai-prompts/prompts.json | Phase E |
| industry_vectors | industry_vector_corporate.ts / industry_vector_sole.ts | A-4（seedで入れる。テーブルは002で作成済み） |
| accounts | account-master.json | A-4（seedで入れる。テーブルは002で作成済み） |
| tax_categories | tax-categories-master.json | A-4（seedで入れる。テーブルは002で作成済み） |

### A-3: ENUM型・CHECK制約

> 対応: migration_tasks.md §4-3, KI: postgresql_migration_streamed_architecture

- ~~`receipt_status` ENUM~~ → ✅ **廃止（J-5で確定）**: receiptsテーブルがアプリ未使用のため不要
- ~~`update_receipt_status` SQL function~~ → ✅ **廃止（J-5で確定）**: 同上
- ~~`confirmed_requires_journal` CHECK制約~~ → ✅ **廃止（J-5で確定）**: 同上
- ~~**新規**: journalsテーブルの`source` CHECK制約, `status` CHECK制約~~ → ✅ **006_journals.sqlで作成済み**
- ~~**修正対象**: clientsのCHECK値不一致3件（C-1, C-2, C-3）~~ → ✅ **修正済み（2026-07-01）**:
  - C-1: `type` CHECK に `'sole_proprietor'` 追加（2値→3値）
  - C-2: `consumption_tax_mode` CHECK を `'individual','proportional','simplified','exempt'` に変更。DEFAULT `'general'`→`'proportional'`
  - C-3: `tax_method` CHECK を `'tax_included','tax_excluded_included','tax_excluded_separate'` に変更。DEFAULT `'inclusive'`→`'tax_included'`

> [!NOTE]
> **schema.sql統合問題 → ✅ 解決済み（2026-07-01 J-5確定）**:
> `src/repositories/supabase/schema.sql`の`receipts`テーブルと`receipt_status` ENUMは、
> アプリコードで未使用（grep 0件）。KI（2026-02）の設計検討段階の遺物。
> **方針**: schema.sqlはreceipts/audit_logs部分を廃止。audit_logsが必要な場合は別のmigrationで再作成。

### A-4: seed スクリプト → ✅ 完了（2026-07-01）

> 対応: migration_tasks.md §5-1 R-S4

| データ | 件数 | 方式 | 状態 |
|---|---|---|---|
| staff | 7件 | INSERT文 | ✅ |
| vendors（scope=global） | 250件 | INSERT文 | ✅ |
| accounts | 241件 | INSERT文 | ✅ |
| tax_categories | 151件 | INSERT文 + CREATE TABLE IF NOT EXISTS | ✅ |
| industry_vectors | 68(法人)+68(個人) ベクトル | INSERT文（vector×account展開） | ✅ |

**成果物**:
- [seed.cjs](file:///c:/dev/receipt-app/supabase/seed.cjs): JSONデータからseed.sqlを自動生成するスクリプト
- [seed.sql](file:///c:/dev/receipt-app/supabase/seed.sql): 生成済みSQL（10,427行 / 410KB）
- ON CONFLICT DO NOTHING で冪等性保証

### A-5: clientId発番方式の移行 → ❌ 不要（取り下げ）

> 対応: migration_tasks.md §4-6

> [!NOTE]
> **取り下げ理由（2026-07-01 実データ調査で判明）:**
>
> migration_tasks.md §4-6は「clientIdが `ABC-00001` 形式の連番で推測可能」という前提だったが、
> **実際のコードでは既に `c_` + ランダム8文字（nanoid風）で発番されている。**
>
> ```
> 実データ:
> c_I9YZIpVE （株式会社ABC商事）
> c_wTdnMKDO （あああ）
> c_rODnkCDN （株式会社すぐする）
> ```
>
> - clientId: `c_XXXXXXXX`（ランダム。推測不可能）← **既に安全**
> - threeCode: `TSK`, `ABC` 等（別カラムで独立済み）
> - 3コード+5桁連番（`TSK-00001`）: **使われていない。§4-6の想定が間違い**
>
> **UUID化の動機5件の検証:**
> | 懸念 | 実態 |
> |---|---|
> | 推測可能 | ❌ 既にランダムID。推測不可能 |
> | レースコンディション | ❌ サーバー側でnanoid発番済み。フロント発番ではない |
> | 3コード変更時の不整合 | ❌ clientIdに3コードは含まれない。独立済み |
> | 3コード重複 | ⚠️ DB側UNIQUE制約は未設定 → **three_code UNIQUE追加のみで解決** |
> | フロント発番 | ❌ サーバー側発番済み |
>
> **結論**: UUID型への変更は不要。必要なのは`three_code UNIQUE`制約の追加のみ（A-3またはPhase Bで対応）。

#### 旧形式clientId残存の修正（2026-07-01）

A-5取り下げに伴い、コード内に残存していた旧形式clientId（`ABC-00001`, `LDI-00008`, `TST-00011`）を
実際の形式（`c_I9YZIpVE`, `c_VdAnGFq3`, `c_rODnkCDN`）に修正。

**✅ 修正済み（コメント / JSDoc: 10箇所）:**

| ファイル | 修正内容 |
|---|---|
| client.types.ts L18 | `{3コード}-{5桁連番}（例: ABC-00001）` → `c_ + ランダム8文字（例: c_I9YZIpVE）` |
| journal.type.ts L93 | `LDI-00008` → `c_wTdnMKDO` |
| doc-entry.types.ts L27 | `LDI-00008` → `c_VdAnGFq3` |
| activity.types.ts L27 | `TST-00011` → `c_rODnkCDN` |
| ai-command.types.ts L71 | `TST-00011` → `c_rODnkCDN` |
| vendor.type.ts L455 | `LDI-00008` → `c_VdAnGFq3` |
| notification.types.ts L28, L42 | `TST-00011` → `c_rODnkCDN`（2箇所） |
| lineItemToJournalMock.ts L338 | `LDI-00008` → `c_VdAnGFq3` |
| mfCsvParser.ts L92 | `LDI-00008` → `c_VdAnGFq3` |
| activityLogRoutes.ts L30 | `TST-00011` → `c_rODnkCDN` |

**✅ 修正済み（フォールバック値 / redirect: 16箇所）:**

| ファイル | 箇所数 | 修正内容 |
|---|---|---|
| router/index.ts | 9箇所 | `ABC-00001` → `c_I9YZIpVE` |
| MockNavBar.vue | 1箇所 | `ABC-00001` → `c_I9YZIpVE` |
| ScreenS_Settings.vue | 1箇所 | `ABC-00001` → `c_I9YZIpVE` |
| MockExportPage.vue | 2箇所 | `ABC-00001`/`LDI-00008` → `c_I9YZIpVE`/`c_VdAnGFq3` |
| MockExportHistoryPage.vue | 1箇所 | `ABC-00001` → `c_I9YZIpVE` |
| MockExportDetailPage.vue | 1箇所 | `ABC-00001` → `c_I9YZIpVE` |
| MockLearningPage.vue | 1箇所 | `TST-00011` → `c_rODnkCDN` |

**⏸️ 未修正（廃止予定のため修正しない）:**

| ファイル | 旧形式 | 理由 | 解消時期 |
|---|---|---|---|
| learning_rules_TST00011.ts（16箇所） | `TST-00011` | 旧テストシードデータ。Phase E（LearningRule二重管理廃止 DL-051）でファイルごと削除 | Phase E |
| document_mock_data.ts（1箇所） | `client-001` | モックデータ。Phase D（localStorage廃止）で不要になる | Phase D |
| accountDetermination.test.ts（2箇所） | `TST-00011` | テスト内ハードコード値。テストのclientIdは任意文字列で動作に影響なし | ─ |
| matchLearningRule.test.ts（1箇所） | `TST-00011` | 同上 | ─ |
| learningRuleStore.ts L72（1箇所） | `TST-00011` | 旧Store。Phase BでSupabase版に差し替え時に自然消滅 | Phase B |
| TestOCRPage.vue（2箇所） | `CL-001` | OCRテスト画面。テスト用値で動作に影響なし | ─ |
| DocumentDetail.vue（1箇所） | `client-001` | モックデータ。Phase Dで不要 | Phase D |
| ocr_service_vertex.ts（1箇所） | `CL-001` | デフォルト引数。テスト用値 | ─ |

### 完了条件
- ✅ 全テーブルのCREATE + INDEX + RLS が揃う（14テーブル / 12 SQL）
- ✅ CHECK制約の不一致修正済み（C-1, C-2, C-3）
- ✅ seedスクリプト完成（5種マスタデータ / 700件超）
- ❌ A-5 clientId UUID移行: 不要（取り下げ）
- ✅ 旧形式clientId残存修正（コメント10箇所 + フォールバック16箇所）
- ⏸️ `supabase db reset` でエラー0件 → Phase B開始時に検証
- ⏸️ `supabase gen types` → Phase B開始時に検証

---

## Phase B: Supabase版Repository作成 + データ投入 + 旧コード削除

> 対応: migration_tasks.md §5（Repository化残り）+ §8（データ移行）
> 前提: Phase 3.5/3.6で全60件のStore直接importがRepository(mock)経由に移行済み

### 目的
Supabase版Repository実装を作成し、JSON/TSのデータをDBに投入。旧Store + JSONファイルを削除する。

> [!TIP]
> Phase 3.5/3.6で全呼び出し元がRepository経由になっているため、Phase Bの作業は純粋に「Repository実装の中身の差し替え」のみ。Route/Serviceのimport変更は不要。

### 移行順序（依存関係順）

```
B-1: documents（最も独立。OCR/Pipelineで使用）
  ↓
B-2: journals + confirmed_journals → journalsテーブル1枚に統合
  ↓
B-3: vendors（Pipeline科目確定で使用）
  ↓
B-4: learning_rules（Pipeline科目確定で使用）
  ↓
B-5: accounts + tax_categories（マスタ参照系）
  ↓
B-6: staff + clients（マスタ管理系。clientId UUID移行を含む）
  ↓
B-7: share_status, notifications, mf_tokens等（残りテーブル）
```

### 各ステップの作業パターン（共通）

1. Supabase版Repository実装を作成（`xxx.repository.supabase.ts`）
2. factory関数（`repositories/index.ts`）にSupabase版を接続
3. `VITE_USE_MOCK=false`で動作確認
4. 旧Store（xxxStore.ts / xxxApi.ts）のコードを削除
5. 旧JSON/TSデータファイルを削除

> Phase 3.5/3.6で全呼び出し元がRepository経由に移行済みのため、
> 旧Storeの「Store直接import → Repository経由に差し替え」ステップは不要。

> [!CAUTION]
> **旧Store削除の順序制約**:
> Store間の直接import依存があるため、1つずつ削除する場合は以下の順序を守る必要がある。
>
> - `clientsApi` は `journalStore` より後に削除（journalStore.ts が clientsApi.getById() を直接importしている）
> - `taxCategoryMasterApi` は `accountMasterApi` より後に削除（accountMasterApi.ts が taxCategoryMasterApi を直接importしている）
> - `documentsApi` は `migrationWorker` より後に削除（migrationWorker.ts が convertFirstAiToDocFields() を直接importしている）
>
> あるいは、全StoreをSupabase版に差し替えてから一括削除する。

> [!IMPORTANT]
> **Repository設計原則（2026-06-30確定）**:
> - Repositoryは**単一ドメインのデータアクセスのみ**。`list()`はWHERE/ORDER BY/LIMIT相当。
> - 複数ドメインの結合（例: Client+StaffのstaffNameソート）は**Route/Service層**で実装。
> - Supabase移行時に性能要件が出た場合のみ、Repository interfaceに結合検索を追加してJOIN化。
> - Repositoryに変換ロジックを含めない。`updateAiResults()`等は`Partial<T>`を受け取るだけ。変換関数は呼び出し側に配置。

### B-8: snake_case統一

> 対応: migration_tasks.md §9 DL-054

Supabase移行と同時に実施。対象:
- learning_rule.type.ts（LearningRule + LearningRuleEntryLine）のcamelCase → snake_case
- accountDetermination.ts（AccountDeterminationResult）のcamelCase → snake_case

### 完了条件
- `VITE_USE_MOCK=false` で全画面が正常動作
- 旧JSON/TSデータファイルが全削除済み
- 旧Store（xxxStore.ts / xxxApi.ts）が全削除済み
- `vue-tsc --noEmit` エラー0件

### ★ 可逆性 ★

> [!IMPORTANT]
> **Phase B完了前（旧Store/JSON削除前）:** `VITE_USE_MOCK=true`に戻すだけでJSON開発に即復帰。
> **Phase B完了後（旧Store/JSON削除後）:** git checkoutで旧ファイルを復元すれば復帰可能。
> **Phase C以降:** 認証基盤が変わるため、単純な切り戻しは不可能。
>
> Phase 3.5/3.6で全呼び出し元がRepository(mock)経由になっているため、
> Phase Bの途中でも「Supabase版が動かない → VITE_USE_MOCK=trueに戻す」が常に可能。
> これがPhase 3.5/3.6を先にやった最大の成果。

---

## Phase C: 認証・RLS本番化

> 対応: migration_tasks.md §1（認証）+ §2（ゲスト）+ §4-1（RLS本番化）+ §4-5（role分岐）

### 目的
開発用RLS（USING(true)）を本番ポリシーに置換。ゲスト認証を厳格化。

### C-1: RLS本番化

| テーブル | 現在 | 本番ポリシー |
|---|---|---|
| receipts | USING(true) | client_id IN (SELECT client_id FROM client_users WHERE user_id = auth.uid()) |
| audit_logs | SELECT only | INSERT = SECURITY DEFINER関数経由のみ |
| 全テーブル | USING(true) | テーブルごとのRLSポリシー設計 |

### C-2: ゲスト認証厳格化

> 対応: migration_tasks.md §2

| タスク | 対応 |
|---|---|
| 2-2: ゲスト認証厳格化 | サーバー側JWT検証追加 |
| 2-3: /guest/:clientId/login直接アクセス | clientId UUID化で推測不可能に（A-5で対応済み） |
| 1-4: signInWithPassword/signUp | パソコンのみフローの実装 |
| 1-5: signInWithOAuth callback | grantFolderPermission呼び出し |

### C-3: roleベース画面分岐

> 対応: migration_tasks.md §4-5

- `app_metadata.role` による厳密なロール判定
- staff → `/mode-select` / client_user → `/client/upload/{clientId}`

### C-4: エラーハンドリング

> 対応: migration_tasks.md §9（エラー表示設計関連5件）

- normalizeSupabaseError.ts新設
- errorRole.ts差し替え（JWT+guest → app_metadata.role）
- 403→404変換のサーバー側実装
- 401→再ログインフロー

### 完了条件
- 全テーブルのRLSが本番ポリシー
- ゲスト認証がサーバー側で検証される
- roleベースの画面分岐が動作

---

## Phase D: フロント統合

> 対応: migration_tasks.md §11（棚卸し）+ §12（フロントAPI化）+ §9の一部

### 目的
localStorage廃止、composable統一、Supabase Realtime接続。

### D-1: localStorage廃止

> 対応: migration_tasks.md §11-1（16ファイル）

| 分類 | 件数 | 対応 |
|---|---|---|
| データキャッシュ（useClients等） | 15件 | Supabase直接取得に差し替え |
| UI設定（useColumnResize等） | 3件 | **許容。localStorageのまま** |
| ログイン状態（MockPortalLoginPage） | 3件 | Supabase Authセッションに置換 |

### D-2: useServerTable composable統合

> 対応: migration_tasks.md §12-2（全7ページ）

- filteredRows/pagedRows/fetchListの個別コピペ → useServerTable\<T\>に統合
- 楽観的更新の一元化
- Supabase Realtimeとの統合ポイントを1箇所に集約

| ページ | idKey |
|---|---|
| MockMasterClientsPage.vue | clientId |
| MockMasterStaffPage.vue | staffId |
| MockMasterVendorsPage.vue | vendor_id |
| MockMasterNonVendorPage.vue | vendor_id |
| LeadListPage.vue | leadId |
| MockExportPage.vue | id |
| MockExportDetailPage.vue | id |

### D-3: Supabase Realtime

> 対応: migration_tasks.md §9 Realtime

- `supabase.channel('table-changes').on('postgres_changes', ...)`
- 対象: clients, staff, documents, journals
- composable内のrefを差分更新

### D-4: 既存fetch 19箇所のapiFetch移行

> 対応: migration_tasks.md §9

- composable層 → SupabaseClient直接呼び出しに置換
- Vueページ側 → apiFetch.withError()に統一

### D-5: 旧Screen系コード廃止

> 対応: migration_tasks.md §11-4

| ファイル | 判断 |
|---|---|
| ScreenA_ClientDetail.vue（34KB） | 廃止（MockMasterClientsPage.vueに統合済み） |
| ScreenA_Detail_EditModal.vue（5KB） | 廃止 |
| ScreenC_CollectionStatus.vue（34KB） | 廃止 |
| ScreenE_LogicMaster.vue（46KB） | 要判断 |
| client-form.type.ts（2KB） | 廃止 |

### D-6: TODO残存の解消

> 対応: migration_tasks.md §11-2（20件）

- Supabase移行関連12件 → 移行完了で自然消滅
- API化関連3件 → D-1/D-2で解消
- 科目確定DB化2件 → B-4で解消

### 完了条件
- localStorage依存がUI設定（useColumnResize等）以外に0件
- 全7ページがuseServerTable統一
- Supabase Realtimeで他タブ同期が動作

---

## Phase E: 後回し項目 + 運用基盤

> 対応: migration_tasks.md §7（Edge Functions）+ §9（後回し）+ §6（Drive借景残り）

### E-1: CI/CD自動化

> 対応: migration_tasks.md §9 supabase gen types

- `supabase gen types` → `vue-tsc --noEmit` パイプライン
- AssertExtends型ガード
- DBマイグレーション + types.tsの同時デプロイ

### E-2: セキュリティ・運用

| タスク | 対応セクション |
|---|---|
| Docker network=none テスト環境 | §9 |
| PostgreSQL Anonymizer | §9 |
| 本番Workload Identity移行 | §9 |
| AI_PROMPTS定数のDB移行 | §9 |
| リクエストID・Slack連携 | §9 |

### E-3: Drive借景残り

> 対応: migration_tasks.md §6

- F-4: documentStore.ts廃止（Supabase版DocumentRepository完成後）
- F-7: useDocuments.tsの/api/doc-store参照廃止
- pipeline.tsのsaveUploadedFile廃止（Drive upload完全移行後）

### E-4: Edge Functions

> 対応: migration_tasks.md §7

- receiptService.ts本番実装
- Supabase Edge Functions接続

### E-5: その他

| タスク | 対応 |
|---|---|
| LearningRule二重管理廃止（DL-051） | 旧系統（LearningRuleUi.ts等）削除 |
| DocEntry/JobRow二重データストア統合 | documentsテーブル+migration_jobsのJOIN |
| isDuplicate消失修正（DL-051 T-AUD-5） | DocEntry型にisDuplicate追加 |
| 確定送信のトランザクション化 | INSERT + UPDATE を1トランザクション |
| warning_dismissals別テーブル化 | journal_warning_dismissalsテーブル |
| useAccountingSystem.ts仕分け | モックデータ削除 + composable書き換え |

---

## migration_tasks.mdセクション → Phase対応表

| migration_tasks.mdセクション | 本計画のPhase |
|---|---|
| §0 既に完了済み | — |
| §1 認証・アクセス制御 | Phase C |
| §2 ゲストアクセス制御 | Phase C |
| §3 Drive共有・権限管理のDB化 | Phase B-6 |
| §4 DB設計（テーブル・RLS） | Phase A + Phase C |
| §5 Repository化（残り） | Phase 3.5 + Phase 3.6 |
| §6 Drive借景→Supabase移行 | Phase E-3 |
| §7 Edge Functions | Phase E-4 |
| §8 データ移行 | Phase B |
| §9 後回し項目 | Phase D + Phase E |
| §10 暫定実装の置換リスト | Phase B + Phase C |
| §11 移行前の棚卸しタスク | Phase D |
| §12 フロントロジックAPI化 | Phase D |
| warning_dismissals別テーブル化 | Phase A-2 + Phase E-5 |

---

## 想定スケジュール（規模感）

| Phase | 作業量 | 見積もり |
|---|---|---|
| 3.5 | 小（8箇所のimport差し替え） | ✅ 完了 |
| 3.6 | 中〜大（52箇所のimport差し替え + mock新規作成3件） | ✅ 完了 |
| **3.7** | **小〜中（6 Store, 27箇所のimport差し替え + mock新規作成6件 + zod/経路整理）** | ✅ 完了 |
| A | 中（SQL作成・確認 + seed）※Phase 3.7で6テーブル追加 | 3-4セッション |
| B | 中（Supabase版Repository作成 + データ投入 + 旧コード削除） | 3-5セッション |
| C | 中（RLS本番化 + 認証厳格化） | 2-3セッション |
| D | 大（localStorage廃止 + composable統一 + Realtime） | 5-8セッション |
| E | 中〜大（運用基盤・CI/CD） | 3-5セッション |

> [!IMPORTANT]
> Phase 3.7が追加された分、全体の見積もりは1-2セッション増加。
> ただしPhase 3.7で発覚した6テーブルをPhase Aに含めたため、
> Phase A開始後にテーブル追加で手戻りするリスクは排除された。

---

## 関連ドキュメント

| ドキュメント | 用途 |
|---|---|
| [migration_tasks.md](file:///c:/dev/receipt-app/docs/supabase/migration_tasks.md) | 全タスクの詳細（793行）。本計画のベース |
| [store_direct_import_inventory.md](file:///C:/Users/kazen/.gemini/antigravity-ide/brain/2efc35e5-fd85-4597-a9c8-7cb0fb780331/store_direct_import_inventory.md) | 全21 Storeの直接import棚卸し |
| [61_journal_field_inventory.md](file:///c:/dev/receipt-app/docs/genzai/61_journal_field_inventory.md) | Phase 0-3完了記録 + Phase 3.5/4計画 |
| KI: postgresql_migration_streamed_architecture | ENUM型・CHECK制約・SQL function設計 |
