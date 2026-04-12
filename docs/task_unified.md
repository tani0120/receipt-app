# 統合タスクリスト（MECE版）

> 統合元: task_restored.md / task_03_resolved29.md / task_01_bd8b5ef7.md / task_02_prev_task.md / task.md / prev_task.md（bd8b5ef7）
> 統合日: 2026-04-08（セッション 1cd25cab）
> 最終更新: 2026-04-12（セッション 70eb9668 — DL-037 PDFプレビュー対応 + MIMEタイプバグ修正）
> 実査方法: git log・grep_search・view_file・list_dir による実ファイル確認
> ルール: **型・コード・シグネチャは今やる。実行行為（テスト実施・データ整備）のみ先送り可。**

---

## A. 設計原則（確定済み・変更なし）

### TSルールベース vs Gemini の使い分け

| 優先順位          | 方式                        | 採用条件                                                     |
| ----------------- | --------------------------- | ------------------------------------------------------------ |
| **1（最優先）**   | Vision OCR + TSルールベース | 安定性最優先                                                 |
| **2（最終手段）** | Gemini                      | TSルールベースの実装コストが高すぎる or 画像の文脈理解が必要 |

> **Geminiは「目」。TSは「電卓」。**
> journal_inference（Geminiに仕訳推論させる）は不要の可能性大。

### 型定義前テストの原則

Geminiを採用する箇所は、型定義を書く前に必ずプロトタイプで実際の出力形式を確認する。

---

## B. 完了済みタスク一覧

### B-1. 型定義・コード基盤（Phase 1）

| タスク     | 内容                                                                                          | git                  |
| ---------- | --------------------------------------------------------------------------------------------- | -------------------- |
| T-00a      | SourceType型(12種) + Direction型(4種) + ProcessingMode型(3種)                                 | 完了                 |
| T-00b      | JournalPhase5Mock型に3フィールド追加                                                          | 完了                 |
| T-00i      | テストスクリプト整備（document_filter_test.ts）                                               | 完了                 |
| T-00j      | 実物証票28件配置（初回分）                                                                    | 完了                 |
| T-00k      | document_filterテスト実行（100%正解率確認）                                                   | 完了                 |
| T-01       | VendorVector型 68種（vendor.type.ts）                                                         | 完了                 |
| T-02       | Vendor型（vendor.type.ts内。DL027-4で統合済み）                                               | 完了                 |
| T-04       | IndustryVectorEntry型（vendor.type.ts内で先行完了）                                           | 完了                 |
| T-06c      | バリデーション設計記録                                                                        | 完了                 |
| T-06d      | flatten変換関数設計                                                                           | 完了                 |
| T-P1       | direction判定テスト（v5: 28/28=100%）                                                         | 完了                 |
| T-LI1-1〜4 | line_item.type.ts v1.4（全フィールド完了）                                                    | `c1ae2c3`            |
| A-1〜A-13  | LineItem拡張（NonVendorType・TaxPaymentType含む）                                             | `c1ae2c3`            |
| N-1        | non_vendor.type.ts 新規作成（24種・5種・辞書型）                                              | 完了                 |
| N-2        | line_item.type.ts v1.4更新                                                                    | 完了                 |
| N-3        | non_vendor_account_corporate.ts（法人用マップ26件）→ **DL027-4でvendors_global.tsに統合済み** | 完了                 |
| N-4        | non_vendor_account_sole.ts（個人用マップ26件）→ **同上**                                      | 完了                 |
| N-5        | tsc --noEmit エラー0件確認                                                                    | 完了                 |
| B-1〜B-tsc | classify_schema.ts 旧LineItem矛盾解消                                                         | `d3e83ee`            |
| C-1〜C-tsc | COUNTERPART_ACCOUNT_MAP 定数定義                                                              | `d3e83ee`            |
| D-1〜D-tsc | lineItemToJournalMock.ts 変換関数                                                             | `e2ac014`            |
| E-1〜E-tsc | validation.ts（isValidTNumber・normalizePhoneNumber・normalizeTNumber）                       | `e2ac014`            |
| F-1〜F-2   | 設計文書更新                                                                                  | `e2ac014`            |
| G-1〜G-3   | コミット・プッシュ完了                                                                        | `d3e83ee`, `e2ac014` |
| Z-1〜Z-15  | tsc --noEmit 全件解消                                                                         | `a1c4692`            |
| vue-tsc    | 77件→0件                                                                                      | `a1c4692`            |

### B-2. DL-027（照合キー統合）

| タスク  | 内容                                                                                      | git       |
| ------- | ----------------------------------------------------------------------------------------- | --------- |
| DL027-1 | normalizeVendorName() 改修（ひらがな→カタカナ、NormalizationService削除、テスト11件PASS） | `ffe9dc2` |
| DL027-2 | vendor.type.ts normalized_name削除 → match_key/display_name追加                           | `ffe9dc2` |
| DL027-3 | vendors_global.ts 224件 normalized_name → match_key 一括置換                              | `ffe9dc2` |
| DL027-4 | 取引先と取引先外TS統合（non*vendor_account*\*.ts → vendors_global.tsに統合）              | `e2ecf1c` |

### B-3. マスタUI

| タスク         | 内容                                                                               | git                 |
| -------------- | ---------------------------------------------------------------------------------- | ------------------- |
| I-①a           | 全社取引先マスタUI（MockMasterVendorsPage.vue / `/master/vendors/list`）           | `f3a156f`→`a16e701` |
| I-①c           | 全社取引先外マスタUI（MockMasterNonVendorPage.vue / `/master/vendors/non-vendor`） | `e2ecf1c`           |
| マスタ統合ハブ | MockMasterHub画面                                                                  | `f3a156f`           |

### B-4. 取引先特定ユーティリティ

| タスク | 内容                                                                | 実査結果                                        |
| ------ | ------------------------------------------------------------------- | ----------------------------------------------- |
| T-N1a  | T番号抽出・検証（extractTNumber / validateTNumber）                 | vendorIdentification.ts L38-56 で**実装済み**   |
| T-N1b  | 電話番号正規化（normalizePhone / validatePhone / matchPhonePrefix） | vendorIdentification.ts L72-149 で**実装済み**  |
| T-N1c  | 取引先名正規化（normalizeVendorName）DL-027 D6対応含む              | vendorIdentification.ts L182-212 で**実装済み** |

### B-5. 顧客自律型アップロードUI（今セッション）

| タスク     | 内容                                                                                    | git       |
| ---------- | --------------------------------------------------------------------------------------- | --------- |
| A画面      | MockUploadPage.vue 全面書き直し（カメラ起動・SHA-256重複検知・撮り直し・CONCURRENCY=4） | `609b360` |
| B画面      | MockUploadDocsPage.vue 新規作成（謄本・CSV等バリデーションなし・CONCURRENCY=3）         | `609b360` |
| サービス層 | receiptService.ts（VITE_USE_MOCK切り替え・モック75%成功率）                             | `609b360` |
| ルーター   | `/client/upload-docs/:clientId` 追加 + 後方互換リダイレクト                             | `609b360` |
| vite設定   | server.host: true（LAN内モバイルアクセス可能に）                                        | `609b360` |

### B-7. DL-034: UUID方式ID設計 + AnalyzeOptions拡張 + 全メトリクスログ出力

| タスク   | 内容                                                                            | git        |
| -------- | ------------------------------------------------------------------------------- | ---------- |
| DL-034-1 | `AnalyzeOptions`型追加（clientId/role/device/documentId）                       | 未コミット |
| DL-034-2 | `logClassifyResult`全30項目構造化出力                                           | 未コミット |
| DL-034-3 | `FileEntry.documentId` / `ReceiptItem.documentId` 追加（`crypto.randomUUID()`） | 未コミット |
| DL-034-4 | `generateJournalId()` UUID化（連番衝突リスク排除）                              | 未コミット |
| DL-034-5 | `lineItemToJournalMock()` document_id/line_id生成対応                           | 未コミット |
| DL-034-6 | `MockUploadPage.vue` retake時 isDuplicate/hash/documentId修正                   | 未コミット |
| DL-034-7 | `18_account_classification_comparison.md` 復元                                  | 未コミット |

### B-8. DL-035: AI分類キーワード外部化 + classify_reason + supplementary_doc 12種化

| タスク   | 内容                                                                                                  | git        |
| -------- | ----------------------------------------------------------------------------------------------------- | ---------- |
| DL-035-1 | `source_type_keywords.ts` 新規作成（全12種キーワード定義 + 境界ガイド10件 + `buildKeywordsPrompt()`） | 未コミット |
| DL-035-2 | `classify.service.ts` プロンプトを外部ファイルからの動的結合方式に変更                                | 未コミット |
| DL-035-3 | `types.ts` に `supplementary_doc` 追加、`classify_reason` フィールド追加                              | 未コミット |
| DL-035-4 | `postprocess.ts` MODE_MAP に supplementary_doc 追加、classify_reason 伝播                             | 未コミット |
| DL-035-5 | `receiptService.ts` ログ出力に classify_reason 追加                                                   | 未コミット |
| DL-035-6 | UI結合テスト通過（journal_voucher判定確認）                                                           | ✅ 確認済  |

### B-6. その他完了

| タスク            | 内容                                                           | git                 |
| ----------------- | -------------------------------------------------------------- | ------------------- |
| DL-022            | 取引先マスタアーキテクチャ確定（2層構造）                      | 設計確定            |
| DL-023            | VendorVector 68種確定                                          | 設計確定            |
| DL-024            | 税区分設計確定                                                 | 設計確定            |
| DL-027            | match_key設計確定                                              | `4625561`           |
| DL-028            | 科目推定アーキテクチャ採否確定（全社科目なし・一意性判定採用） | 設計確定            |
| DL-029            | 実行戦略確定（Supabase不要の精度テスト5フェーズ）              | 設計確定            |
| DL-030            | Repository設計方針確定（データアクセス抽象化・Promise統一）    | 設計確定            |
| vendors_global.ts | 全社共通取引先224件                                            | `6695367`→`04bc90a` |
| husky             | pre-commit非推奨2行削除                                        | 未コミット          |

### B-9. DL-037: PDFプレビュー対応 + MIMEタイプバグ修正

| タスク   | 内容                                                                                                                             | git        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| DL-037-1 | `image_preprocessor.ts` PDF前処理の `mimeType` を `'image/jpeg'` → `'application/pdf'` に修正（Geminiトークン0件バグの根本原因） | 未コミット |
| DL-037-2 | `PreprocessResult.mimeType` 型を `'image/jpeg' \| 'application/pdf'` に拡張                                                      | 未コミット |
| DL-037-3 | `MockUploadPage.vue` PDFプレビューをiframe表示に変更（scale(0.5)縮小 + pointer-events:none）                                     | 未コミット |
| DL-037-4 | `MockDriveSelectPage.vue` サムネイル＋プレビュー両方にPDF分岐追加                                                                | 未コミット |
| DL-037-5 | `JournalListLevel3Mock.vue` 画像モーダルにPDF分岐追加（iframe表示）                                                              | 未コミット |
| DL-037-6 | `ScreenE_JournalEntry.vue` 画像ビューアにPDF分岐追加（iframe表示）                                                               | 未コミット |

---

## C. 未完了タスク（MECE・優先度順）

### C-0. Repository化（DL-030 + DL-032: データアクセス抽象化 + Supabase先行実装）

> **方針（DL-030確定）**: Repositoryはデータの出し入れだけ。ロジックは絶対に入れない。全メソッドPromise\<T\>で統一。
> **DL-032（2026-04-08確定）**: モック型ベースでDBスキーマ確定済み。Supabase版Repository先行実装済み。`.env`の`VITE_USE_MOCK=false`で即切り替え。
> 詳細設計: `pipeline_design_master.md` DL-030, DL-032参照

| タスク | 内容                                                                                            | 対象ファイル                                                        | 状態                    | 対応フェーズ    |
| ------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------- | --------------- |
| R-1    | Repository型定義（6種: 上記5種 + ShareStatus）                                                  | `src/repositories/types.ts`                                         | ✅ 完了                 | —               |
| R-2    | VendorRepository モック実装                                                                     | `src/repositories/mock/vendor.repository.mock.ts`                   | ✅ 完了                 | —               |
| R-3    | IndustryVectorRepository モック実装                                                             | `src/repositories/mock/industryVector.repository.mock.ts`（新規）   | ❌ 未着手（スタブ有）   | 4. Step 2-4     |
| R-4    | AccountRepository モック実装                                                                    | `src/repositories/mock/account.repository.mock.ts`（新規）          | ❌ 未着手（スタブ有）   | 4. Step 2-4     |
| R-5    | ConfirmedJournalRepository モック実装                                                           | `src/repositories/mock/confirmedJournal.repository.mock.ts`（新規） | ❌ 未着手（型T-03待ち） | 4. Step 2-4     |
| R-6    | ClientVendorRepository モック実装                                                               | `src/repositories/mock/clientVendor.repository.mock.ts`（新規）     | ❌ 未着手（スタブ有）   | 4. Step 2-4     |
| R-7    | Repository集約index + factory関数（VITE_USE_MOCK切り替え）                                      | `src/repositories/index.ts` + `mock/index.ts`                       | ✅ 完了                 | —               |
| R-8    | ShareStatusRepository モック実装                                                                | `src/repositories/mock/shareStatus.repository.mock.ts`              | ✅ 完了                 | —               |
| R-9    | 共有設定composable（Repository経由）                                                            | `src/composables/useShareStatus.ts`                                 | ✅ 完了                 | —               |
| R-10   | 進捗管理テーブル共有設定列 + アップロードUI共有設定ボタン                                       | `MockProgressDetailPage.vue` + `MockUploadSelectorPage.vue`         | ✅ 完了                 | —               |
| R-S    | Supabase版Repository先行実装（5種: Vendor, ClientVendor, IndustryVector, Account, ShareStatus） | `src/repositories/supabase/`                                        | ✅ 完了（DL-032）       | —               |
| R-S2   | SQLマイグレーション（9テーブル + RLS + trigger + Realtime）                                     | `supabase/migrations/001_share_status.sql` + `002_core_tables.sql`  | ✅ 完了                 | —               |
| R-S3   | Supabase版ConfirmedJournalRepository                                                            | `src/repositories/supabase/confirmedJournal.repository.supabase.ts` | ❌ T-03完了後           | 5. Supabase接続 |
| R-S4   | seedスクリプト（vendors_global 224件等のDB投入）                                                | `supabase/seed/`（新規）                                            | ❌ 未着手               | 5. Supabase接続 |

> **注意**: 既存コード（`vendors_global.ts`を直接importしている箇所等）は今は触らない。新規パイプラインロジックのみこの規約に従う。既存コードのリファクタはフェーズ5で一括実施。

### C-1. 最優先: 川上からのパイプライン接続・精度テスト

> **方針**: アップロードUI（`/client/upload/:clientId/pc`）をエントリーポイントとし、Step 0から順にGemini接続→精度実測→修正→次ステップの順で進める。
> **テストURL**: [アップロードページ（PC版）](http://localhost:5173/#/client/upload/test-client/pc)
>
> **実行戦略（DL-029: 2026-04-08確定 → DL-033: 2026-04-10更新）**: Supabase接続なしでパイプライン精度テストを完結させる。
>
> - バックエンド: Hono サーバー（`src/server.ts`、ポート8080）で Vertex AI を直接呼び出し
> - フロントエンド: Vite proxy（`/api` → `http://localhost:8080`）経由でバックエンドに接続
> - 前処理: sharp pipeline（EXIF回転補正→リサイズ2000px→白黒化→コントラスト正規化→シャープ処理→JPEG 85%）を `classify.service.ts` に統合済み
> - 認証: ADC（Application Default Credentials）で Vertex AI に接続。`gcloud auth application-default login` で認証
> - Supabase接続: 全モックテスト完了後にデータ駆動化（型固定）と合わせて実施

#### 5フェーズ実行計画

| 順番 | 作業フェーズ                          | 内容                                                                                                            | 状態          | 前提タスク                   |
| ---- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------- |
| 1    | **UI修正**                            | モック世界の改善（遅延修正済み、他UI微調整等）                                                                  | ✅ 完了       | —                            |
| 2    | **結合テスト環境構築**                | Honoサーバー＋Vite proxy＋sharp前処理＋Vertex AI接続（DL-033）                                                  | ✅ 完了       | 1 完了                       |
| 3    | **Step 0-1 UI結合テスト**             | MockUploadPcPage → classify API → Vertex AI 貫通テスト（ADC認証通過後に実測）                                   | 🔶 進行中     | 2 完了                       |
| 3.5  | **★drive-select改修（人間チェック）** | AI分類結果をdrive-select画面に表示 → 人間が全件チェック → 仕訳対象/対象外を確定。URL: `/drive-select/:clientId` | ❌ 次ステップ | 3 完了                       |
| 4    | **Step 2-4 精度テスト**               | TSロジック＋Gemini（L4）検証（history_match, vendor_vector等）                                                  | ❌ 未着手     | 3.5 完了                     |
| 5    | **Supabase接続**                      | 全モックテスト完了後、データ駆動化（型固定）と合わせて本番DB接続                                                | ❌ 未着手     | 全てのモック検証（1〜4）完了 |

#### フェーズ2 結合テスト環境（DL-033）実装済みファイル

| ファイル                                        | 内容                                                    | 状態        |
| ----------------------------------------------- | ------------------------------------------------------- | ----------- |
| `src/server.ts`                                 | Hono HTTPサーバー（ポート8080）                         | ✅ 実装済み |
| `src/api/routes/pipeline.route.ts`              | `/api/pipeline/health`・`/api/pipeline/classify` ルート | ✅ 実装済み |
| `src/api/services/pipeline/classify.service.ts` | Vertex AI呼び出し＋sharp前処理統合＋Structured Output   | ✅ 実装済み |
| `src/api/services/pipeline/postprocess.ts`      | AI出力→ClassifyResponse変換＋fallback設計               | ✅ 実装済み |
| `src/api/services/pipeline/types.ts`            | ClassifyRequest/ClassifyResponse等の型定義              | ✅ 実装済み |
| `src/mocks/views/MockUploadPcPage.vue`          | classify API呼び出し＋バッジ表示                        | ✅ 実装済み |
| `src/scripts/preprocess.ts`                     | スタンドアロン前処理パイプライン（A/Bテスト対応）       | ✅ 実装済み |
| `vite.config.ts`                                | Vite proxyルール（`/api` → 8080）                       | ✅ 設定済み |
| `src/database/supabase/client.ts`               | Proxy遅延初期化（環境変数未設定でもクラッシュしない）   | ✅ 修正済み |

#### フェーズ2 前処理パイプライン実測結果

| 画像                | 元サイズ | 処理後 | 削減率 |
| ------------------- | -------- | ------ | ------ |
| 20250912_075647.jpg | 4077KB   | 1143KB | 72%    |
| 20250912_075650.jpg | 3551KB   | 909KB  | 74%    |
| 20250912_075642.jpg | 4354KB   | 1328KB | 69%    |

#### 各ステップ詳細（フェーズ3・4の内訳）

| ステップ   | 内容                                                           | 前提タスク                                     | 対応フェーズ           |
| ---------- | -------------------------------------------------------------- | ---------------------------------------------- | ---------------------- |
| **Step 0** | source_type（12種）判定の精度実測                              | ADC認証通過                                    | 3. Step 0-1            |
| **Step 1** | direction（4種）判定の精度実測                                 | Step 0完了                                     | 3. Step 0-1            |
| **Step 2** | 過去仕訳照合（history_match）ロジック接続・精度実測            | Step 1完了、T-03（ConfirmedJournal型）、T-N2   | 4. Step 2-4            |
| **Step 3** | 取引先照合（T番号→電話→match_key→Layer 4）接続・精度実測       | Step 2完了、H（vendors_client.ts）、T-N3、T-P3 | 4. Step 2-4            |
| **Step 4** | 科目確定（vendor_vector × direction → 業種辞書）接続・精度実測 | Step 3完了、E-1対応（industry_vector接続）     | 4. Step 2-4            |
| **E2E**    | 全5ステップ結合テスト                                          | Step 0-4完了                                   | 3. UI結合 または 5以降 |
| **H**      | `vendors_client.ts` 作成（Step 3着手時に必要に応じて）         | Step 2-4着手時                                 | 4. Step 2-4            |

### C-2. マスタUI（残り）

| タスク   | 内容                                                         | 状態      | 依存 |
| -------- | ------------------------------------------------------------ | --------- | ---- |
| **I-①b** | 全社業種マスタUI（vendor_vector 68種の閲覧・科目候補確認）   | ❌ 未実装 | —    |
| **I-②a** | 個別顧問先取引先マスタUI（取引先・取引先外を同一画面で管理） | ❌ 未実装 | H    |
| **I-②b** | 個別顧問先業種マスタUI（業種→科目マッピング上書き）          | ❌ 未実装 | I-①b |

### C-3. テストデータ・型定義（Phase 1残り）

| タスク | 内容                                                                     | 状態         | 実査結果                                      |
| ------ | ------------------------------------------------------------------------ | ------------ | --------------------------------------------- |
| T-00f  | テストデータ35件に3フィールド追加（source_type/direction/vendor_vector） | ❌ 未完了    | grep `source_type` → 0件                      |
| T-00g  | PipelineResult型                                                         | [/] 部分完了 | ファイル9KB存在。VendorVector正式import要確認 |
| T-03   | ConfirmedJournal型（確定済み仕訳型）                                     | ❌ 未完了    | confirmed_journal.type.ts **存在しない**      |
| T-05   | VendorAlias型 + VendorKeyword型                                          | **廃止**     | DL-027でalias/keyword不採用。match_keyに統一  |

### C-4. 顧問先データ整備

| タスク | 内容                          | 状態                    |
| ------ | ----------------------------- | ----------------------- |
| H-2    | vendors_ldi.ts（LDI社取引先） | ❌ 未着手               |
| H-3    | vendors_abc.ts（ABC社取引先） | ❌ 未着手               |
| H-4    | vendors_ghi.ts（GHI社取引先） | ❌ 未着手               |
| T-08   | LDI社固有取引先               | ❌ 未着手（=H-2と同一） |
| T-09   | LDI社confirmed_journals 50件  | ❌ 未着手               |
| T-10   | ABC社固有取引先               | ❌ 未着手（=H-3と同一） |
| T-11   | ABC社confirmed_journals 50件  | ❌ 未着手               |
| T-12   | GHI社固有取引先               | ❌ 未着手（=H-4と同一） |
| T-13   | GHI社confirmed_journals 50件  | ❌ 未着手               |

### C-5. テスト実施（実行行為）

> C-1の川上テスト（Step 0→1→2→3→4）の中で実施する。

| タスク    | 内容                                                        | 状態                                            | 対応ステップ |
| --------- | ----------------------------------------------------------- | ----------------------------------------------- | ------------ |
| T-P3      | 取引先特定4層OCR精度テスト（T番号/電話/名称の読取精度実測） | ❌ 未実施                                       | Step 3       |
| T-P4      | journal_inference Gemini出力形式確認                        | ❌ **不要の可能性大**                           | —            |
| T-00j追加 | T-P3用追加証票（T番号付きレシート等）配置                   | ❌ 人間タスク                                   | Step 3       |
| T-V0      | 型定義コンパイル検証                                        | ❌（tsc/vue-tscは都度確認済みだが網羅テスト未） | 随時         |
| T-V1      | データ整合性チェック（4種assert）                           | ❌                                              | 随時         |
| T-V2      | 全体コンパイル検証                                          | ❌                                              | 随時         |

### C-6. Phase 2 ロジック実装（C-1の川上テストと並行で着手）

> C-1の各ステップ精度テスト時に、必要なロジックを都度実装する。

| タスク  | 内容                                                   | 状態      | 対応フェーズ |
| ------- | ------------------------------------------------------ | --------- | ------------ |
| T-N2    | 過去仕訳照合ロジック（historyMatch.ts）                | ❌ 未着手 | 4. Step 2-4  |
| T-N3    | vendor_vector判定ロジック（vendorVectorClassifier.ts） | ❌ 未着手 | 4. Step 2-4  |
| T-N4    | 取引先マスタ学習ロジック（vendorLearning.ts）          | ❌ 未着手 | 4. Step 2-4  |
| T-N5    | vendors_global拡充（224件→1000件）                     | ❌ 未着手 | 4. Step 2-4  |
| Group 1 | Step 0（証票分類）+ Step 1（仕訳方向判定）テスト       | ❌        | 3. Step 0-1  |
| Group 2 | Step 2（history_match）テスト — AI不要                 | ❌        | 4. Step 2-4  |
| Group 3 | Step 3（業種ベクトル）+ Step 4（科目確定）テスト       | ❌        | 4. Step 2-4  |
| E2E     | 全5ステップ結合テスト                                  | ❌        | 5以降        |

### C-8. Phase 2 技術的負債解消（C-1の川上テストで必要な順に着手）

| タスク  | 内容                                                                         | 根拠                                        | 対応フェーズ                   |
| ------- | ---------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------ |
| E-2対応 | GeminiVisionService.ts を新パイプラインに全面書き換え                        | 旧世代コード。classify.service.tsが実質後継 | ~~2. Step 0-1~~ → 完了時に削除 |
| E-5対応 | classify_schema.ts / FileTypeDetector.ts / journal_inference.ts の新設計移行 | 旧世代が新11種と不整合                      | 3. Step 0-1                    |
| E-1対応 | industry_vector_corporate.ts 等をStep 3+4ロジックに接続                      | デッドコード                                | 4. Step 2-4                    |
| E-5対応 | Supabase Edge Functions接続（receiptService.ts本番実装）                     | スタブ。全モック完了後に実施                | **5. 全モック完了後**          |

### C-7. UI変更（Phase 2完了後）

| タスク | 内容                                        | 状態 |
| ------ | ------------------------------------------- | ---- |
| T-00c  | journalColumns.ts 列変更（3列削除+3列追加） | ❌   |
| T-00d  | JournalListLevel3Mock.vue 列描画対応        | ❌   |
| T-00e  | voucherTypeRules.ts 再設計                  | ❌   |
| T-14   | ABC社 JournalPhase5Mock 作成                | ❌   |
| T-15   | GHI社 JournalPhase5Mock 作成                | ❌   |
| T-16   | useJournals.ts フィクスチャインポート追加   | ❌   |
| T-17   | useJournals.ts フォールバック削除           | ❌   |

---

## D. 絶対先送り（正当理由付き）

| 項目                                     | 理由                                 | 解除条件                            |
| ---------------------------------------- | ------------------------------------ | ----------------------------------- |
| T-P3実施                                 | 実物証票・Gemini API呼出が必要       | 日程確認後                          |
| vendors\_\*.ts データ整備（H-2〜4）      | データ入力行為                       | T-P3完了後                          |
| confirmed*journals*\*.ts                 | 実データ収集が必要                   | 顧問先データ収集後                  |
| classify_postprocess.ts voucher_type移行 | Phase 2 Group 1で一括移行            | Phase 2着手時                       |
| Supabase移行                             | 別フェーズ                           | Phase 3                             |
| マウスだけでリカバリ（囲んで再抽出）     | パイプライン貫通後                   | パイプライン貫通後                  |
| DL-028 メガベンダーフラグ                | 顧問先レベルの履歴で代替可能なため   | VendorVector+履歴学習の精度検証次第 |
| DL-028 ジャンル中間マスタ                | VendorVectorと役割が重複するため     | VendorVector+履歴学習の精度検証次第 |
| DL-028 3軸クロスマッチ                   | N×68×Mで整備コストが事実上無限のため | VendorVector+履歴学習の精度検証次第 |

---

## E. 技術的負債・未解消問題（報告義務）

### ⚠️ E-1: industry_vector_corporate.ts / industry_vector_sole.ts がデッドコード

- **実査結果**: `grep industry_vector_corporate` → 自ファイル内のみヒット。**プロジェクト全体でどこからもimportされていない**
- **影響**: Step 4（科目確定ロジック）が未接続。パイプラインのStep 3→4がつながっていない
- **対処**: Phase 2 Group 3（Step 3+4）実装時に接続。それまではデッドコードとして残置

### ⚠️ E-2: GeminiVisionService.ts 旧世代アーキテクチャ

- Phase 1遺物。gemini-pro-vision モデル（廃止済み）を使用
- `@/core/journal` から `JournalEntryDraftSchema` をimportしており、新パイプライン（LineItem→JournalPhase5Mock）とは無関係
- **対処**: Phase 2 Group 1で全面書き換え対象

### ✅ E-3: receiptService.ts L50 toISOString() タイムゾーンバグ — **修正済み（2026-04-08）**

- `toISOString()` → `getFullYear/getMonth/getDate` 方式に修正
- lintエラー2件（配列インデックスの `string | undefined` → `?? null`）も同時修正

### ✅ E-4: non_vendor.type.ts 廃止ファイル参照 — **修正済み（2026-04-08）**

- L25: 旧ファイル名（non_vendor_account_corporate.ts等）への言及を削除。統合先情報のみ残す
- L152-154: 空の廃止セクション見出し（NonVendorAccountEntry等）を全削除
- `grep non_vendor_account` → プロジェクト全体で0件確認

### ⚠️ E-5: 既存コード世代問題 → **Phase 2（C-8）で一括対応**

| コード                  | 世代             | 問題                                                  |
| ----------------------- | ---------------- | ----------------------------------------------------- |
| classify_schema.ts      | 旧               | voucher_type 7種（旧設計）→ 新12種source_typeに未対応 |
| GeminiVisionService.ts  | 旧               | gemini-pro-vision（廃止済み）                         |
| FileTypeDetector.ts     | 旧               | 8種ファイル形式（新12種と不整合）                     |
| journal_inference.ts    | 新（スケルトン） | 287行だが未実装（throw Error）。不要の可能性大        |
| document_filter_test.ts | **新（稼働中）** | 12種+4種                                              |
| source_type.type.ts     | **新（稼働中）** | 12種+ProcessingMode                                   |

### ✅ E-6: router の `props: true` 問題 — **修正済み（2026-04-08）**

- `router/index.ts` の `/client/upload-docs/:clientId` から `props: true` を削除
- code_quality.md §4 違反を解消

---

## F. Gemini責務境界（確定済み）

| Gemini責務                              | テスト状態      | 精度     |
| --------------------------------------- | --------------- | -------- |
| ① source_type（12種）                   | ✅ 完了         | **100%** |
| ② direction（4種）                      | ✅ 完了         | **100%** |
| ③ vendor_vector（68種）— 新規取引先のみ | ❌ **未テスト** | —        |
| ④ OCR読み取り（最小限）                 | 🔶 旧実験のみ   | 部分検証 |

---

## G. 取引先特定4層（照合順序）

| Layer | 方法                                      | 精度（T-P3 round2実測） | Gemini？ |
| ----- | ----------------------------------------- | ----------------------- | -------- |
| 1     | T番号マッチ（T+13桁完全一致）             | 100%（32/32）           | 不要     |
| 2     | 電話番号マッチ（正規化+バリデーション）   | 72%（23/32）            | 不要     |
| 3     | 正規化取引先名マッチ                      | 94%（30/32）            | 不要     |
| 4     | Geminiフォールバック（vendor_vector推定） | 88%（28/32）            | 必要     |

---

## H. 後でやること（条件付き）

| #   | タスク                                 | 実施条件                 | 備考                              |
| --- | -------------------------------------- | ------------------------ | --------------------------------- |
| L-1 | ブラックリストのキーワードマップ       | Gemini精度が低い場合のみ | 不要の可能性                      |
| L-2 | 重複判定ロジック設計                   | パイプライン基盤完成後   | SHA-256はアップロードUIで実装済み |
| L-3 | FilterResult.passのdocumentType追加    | JournalableType確定後    | —                                 |
| L-4 | 仕訳対象外UIのlabel表示設計            | UI実装フェーズ           | —                                 |
| L-5 | PipelineResult.source_typeの型差し替え | JournalableType確定後    | —                                 |
| L-6 | healthエンドポイントにADC疎通確認追加   | パイプライン安定化後     | 現状はproject/model名を返すだけで認証有効性を検証していない |
| L-7 | UI撮影ガイド表示（1枚ずつ平置き撮影の案内） | UI実装フェーズ      | 重畳撮影の間接的防止策 |

---

## 2026-04-12 実施済みタスク

### 証票枚数バリデーション強化

| 項目 | 状態 |
|---|---|
| thinkingBudget制限（2048） | 完了 |
| document_countフィールド追加 | 完了（前回セッション） |
| document_count_reasonフィールド追加 | 完了 |
| プロンプト最優先タスク追加 | 完了 |
| 並列撮影検出テスト | 合格 |
| スクリーンショット混在検出テスト | 合格 |
| 重畳撮影検出テスト | 不合格（Gemini画像認識の限界。対策断念） |
