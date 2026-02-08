# PostgreSQL移行 実装タスクトラッカー

**最終更新**: 2026-02-07T13:42:05+09:00  
**現在位置**: 🔵 Phase 1-1.1 Supabase環境構築（ユーザー作業待ち）  
**全体進捗**: 11% (7/62タスク完了)

---

## 📊 フェーズ別進捗サマリー

| フェーズ | ステータス | 進捗 | 期間 | 完了予定 |
|---------|-----------|------|------|---------|
| **Phase 1: PostgreSQL導入** | 🔵 進行中 | 7/24 | 1週間 | 未定 |
| **Phase 2: UI切り替え** | ⚪ 未着手 | 0/18 | 3日 | 未定 |
| **Phase 3: データ移行** | ⚪ 未着手 | 0/20 | 1週間 | 未定 |

**凡例**: 🔵 進行中 | 🟢 完了 | ⚪ 未着手 | 🔴 ブロック中

---

## 🎯 現在のアクション

### 📍 次にやること（ユーザー）
1. ✅ **Supabaseアカウント作成** (https://supabase.com)
2. ✅ **新規プロジェクト作成** (プロジェクト名: receipt-app-production)
3. ✅ **認証情報取得** (Settings → API)
4. **環境変数設定** (.env.local.template → .env.local にリネーム＆値設定)
5. **npm install @supabase/supabase-js** 実行
6. **Supabase SQL Editorで schema.sql 実行**

### ✅ 完了したこと（AI）
- schema.sql 作成
- ディレクトリ構造準備（supabase/、repositories/、types/）
- Supabaseクライアント作成（client.ts）
- 型定義作成（receipt.types.ts）
- Repository作成（receiptRepository.ts、auditLogRepository.ts）
- .env.local.template 作成

### ⚠️ ブロッカー
**ユーザー作業待ち**: Supabase環境構築（アカウント作成〜認証情報設定）

---

## Phase 1: PostgreSQL導入（1週間）

**目標**: Firestore + PostgreSQL の二重書き込み体制確立

### 1.1 Supabase環境構築 (0/6)

- [ ] **1.1.1** Supabaseアカウント作成
  - URL: https://supabase.com
  - 所要時間: 5分
  - 完了条件: アカウント作成完了

- [ ] **1.1.2** 新規プロジェクト作成
  - プロジェクト名: `receipt-app-production` (推奨)
  - リージョン: Northeast Asia (Tokyo)
  - 完了条件: プロジェクトダッシュボードにアクセス可能

- [ ] **1.1.3** 認証情報取得
  - Settings → API から以下を取得:
    - `SUPABASE_URL`
    - `SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
  - 完了条件: 3つのキーをメモ帳に保存

- [ ] **1.1.4** 環境変数設定
  - ファイル: `.env.local`（新規作成）
  - 内容:
    ```
    SUPABASE_URL=your-project-url
    SUPABASE_ANON_KEY=your-anon-key
    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
    ```
  - 完了条件: `.env.local` 作成完了

- [ ] **1.1.5** `.gitignore` に追加
  - `.env.local` を追加
  - 完了条件: git status で `.env.local` が無視される

- [ ] **1.1.6** 環境変数の動作確認
  - `console.log(process.env.SUPABASE_URL)` で確認
  - 完了条件: 環境変数が正しく読み込まれる

---

### 1.2 DDL実行（1/4）

- [x] **1.2.1** `schema.sql` ファイル作成
  - 場所: `src/database/supabase/schema.sql`
  - 内容: implementation_plan.md の schema.sql をコピー
  - 完了条件: ファイル作成完了（約100行）
  - ✅ **完了**: 2026-02-07T13:42

- [ ] **1.2.2** Supabase SQL Editorで実行
  - Supabase Studio → SQL Editor
  - `schema.sql` の内容を貼り付けて実行
  - 完了条件: エラーなく実行完了

- [ ] **1.2.3** テーブル作成確認
  - Table Editor → `receipts` テーブルが存在
  - Table Editor → `audit_logs` テーブルが存在
  - 完了条件: 2つのテーブルが表示される

- [ ] **1.2.4** ENUM型とFunction確認
  - Database → Types → `receipt_status` が存在
  - Database → Functions → `update_receipt_status` が存在
  - 完了条件: ENUM型とFunctionが表示される

---

### 1.3 依存関係追加（0/3）

- [ ] **1.3.1** `@supabase/supabase-js` インストール
  - コマンド: `npm install @supabase/supabase-js`
  - 完了条件: package.json に追加される

- [ ] **1.3.2** package.json 確認
  - `"@supabase/supabase-js": "^2.x.x"` が存在
  - 完了条件: バージョン確認完了

- [ ] **1.3.3** TypeScript型定義確認
  - `node_modules/@supabase/supabase-js` が存在
  - 完了条件: 型定義ファイルが存在

---

### 1.4 ディレクトリ構造準備（3/3）

- [x] **1.4.1** `src/database/supabase/` 作成
  - 完了条件: ディレクトリ作成完了
  - ✅ **完了**: 2026-02-07T13:42

- [x] **1.4.2** `src/database/repositories/` 作成
  - 完了条件: ディレクトリ作成完了
  - ✅ **完了**: 2026-02-07T13:42

- [x] **1.4.3** `src/database/types/` 作成
  - 完了条件: ディレクトリ作成完了
  - ✅ **完了**: 2026-02-07T13:42

---

### 1.5 Supabaseクライアント作成（1/2）

- [x] **1.5.1** `src/database/supabase/client.ts` 作成
  - 内容: implementation_plan.md のコードをコピー
  - 完了条件: ファイル作成完了（約15行）
  - ✅ **完了**: 2026-02-07T13:42

- [ ] **1.5.2** クライアント動作確認
  - `console.log(supabase)` で確認
  - 完了条件: エラーなく初期化される

---

### 1.6 型定義作成（1/2）

- [x] **1.6.1** `src/database/types/receipt.types.ts` 作成
  - 内容: implementation_plan.md のコードをコピー
  - 完了条件: ファイル作成完了（約30行）
  - ✅ **完了**: 2026-02-07T13:42

- [ ] **1.6.2** 型定義のインポート確認
  - 他ファイルで `import type { Receipt } from '@/database/types/receipt.types'` が動作
  - 完了条件: TypeScriptエラーなし

---

### 1.7 Repository作成（2/2）

- [x] **1.7.1** `src/database/repositories/receiptRepository.ts` 作成
  - 内容: implementation_plan.md のコードをコピー
  - 完了条件: ファイル作成完了（約50行）
  - ✅ **完了**: 2026-02-07T13:42

- [x] **1.7.2** `src/database/repositories/auditLogRepository.ts` 作成
  - 内容: implementation_plan.md のコードをコピー
  - 完了条件: ファイル作成完了（約30行）
  - ✅ **完了**: 2026-02-07T13:42

---

### 1.8 APIルート実装（0/2）

- [ ] **1.8.1** `src/api/routes/receipts.ts` 作成（二重書き込み）
  - Firestore + Supabase の両方に書き込み
  - 内容: implementation_plan.md のコードをコピー
  - 完了条件: ファイル作成完了（約80行）

- [ ] **1.8.2** APIルートのテスト
  - POSTリクエストで動作確認
  - Firestore + Supabase 両方にデータが書き込まれる
  - 完了条件: 両方のDBにデータ確認

---

## Phase 2: UI切り替え（3日）

**目標**: フロントエンドをSupabase参照に切り替え

### 2.1 型定義更新（0/3）

- [ ] **2.1.1** `zod_schema.ts` のバックアップ作成
  - `zod_schema.ts.backup` として保存
  - 完了条件: バックアップファイル作成

- [ ] **2.1.2** JobSchema簡略化（242→20フィールド）
  - 239-481行目を削除
  - statusベースの必須フィールドのみ残す
  - 完了条件: 547行 → 約200行に削減

- [ ] **2.1.3** TypeScriptコンパイル確認
  - `npm run build` でエラーなし
  - 完了条件: ビルド成功

---

### 2.2 Pinia Store更新（0/4）

- [ ] **2.2.1** Firestore参照をSupabase参照に変更
  - `useJobStore.ts` 等を修正
  - 完了条件: Supabase SDKでデータ取得

- [ ] **2.2.2** Status駆動の状態管理に変更
  - `switch (job.status)` パターンに統一
  - 完了条件: 12状態すべて対応

- [ ] **2.2.3** display_snapshot参照の実装
  - UI表示用データは `display_snapshot` から取得
  - 完了条件: 正解データとUI表示の分離

- [ ] **2.2.4** Store動作確認
  - ブラウザでデータ取得確認
  - 完了条件: Supabaseからデータ表示

---

### 2.3 UIコンポーネント更新（0/11）

以下の各ファイルを `switch (status)` パターンに書き換え：

- [ ] **2.3.1** `ScreenE_LogicMaster.vue`
  - 行72-83: ai_reason条件分岐をstatus駆動化
  - 完了条件: status駆動のUI表示

- [ ] **2.3.2** `ScreenB_JournalTable.vue`
  - 完了条件: status駆動のUI表示

- [ ] **2.3.3** `ScreenA_ClientDetail.vue`
  - 完了条件: status駆動のUI表示

- [ ] **2.3.4** `ScreenC_CollectionStatus.vue`
  - 完了条件: status駆動のUI表示

- [ ] **2.3.5** その他30件のVueファイル確認
  - status条件分岐を確認・修正
  - 完了条件: 全ファイル確認完了

- [ ] **2.3.6** 12状態すべてのUIパターン実装
  - uploaded, preprocessed, ocr_done, suggested
  - reviewing, confirmed, rejected
  - 全状態に対応するUIを実装
  - 完了条件: 12状態すべてカバー

- [ ] **2.3.7** default分岐の実装
  - 未知の状態でも必ず表示される
  - 完了条件: フォールバック処理実装

- [ ] **2.3.8** ブラウザテスト（uploaded）
  - 完了条件: 正しく表示

- [ ] **2.3.9** ブラウザテスト（confirmed）
  - 完了条件: 正しく表示

- [ ] **2.3.10** ブラウザテスト（rejected）
  - 完了条件: 正しく表示

- [ ] **2.3.11** 全画面のビジュアルチェック
  - スクリーンショット撮影
  - 完了条件: UI真っ白が0件

---

## Phase 3: データ移行（1週間）

**目標**: 既存Firestoreデータを完全にPostgreSQLへ移行

### 3.1 移行スクリプト作成（0/5）

- [ ] **3.1.1** `scripts/migrate_jobs_to_supabase.ts` 作成
  - ui_analysis_and_migration_strategy.md のコードをベースに作成
  - 完了条件: スクリプトファイル作成

- [ ] **3.1.2** JobStatus → ReceiptStatus マッピング実装
  - 12状態 → 7状態の変換ロジック
  - 完了条件: マッピング関数実装

- [ ] **3.1.3** display_snapshot生成ロジック実装
  - 元のJobデータを保存
  - 完了条件: snapshot生成機能実装

- [ ] **3.1.4** バッチ処理の実装
  - 100件ずつ移行（メモリ考慮）
  - 完了条件: バッチ処理実装

- [ ] **3.1.5** エラーハンドリング実装
  - 失敗時のログ出力
  - ロールバック機能
  - 完了条件: エラーハンドリング実装

---

### 3.2 テスト環境での移行（0/6）

- [ ] **3.2.1** テストデータ準備（10件）
  - Firestoreに10件のJobを用意
  - 完了条件: テストデータ作成

- [ ] **3.2.2** 移行スクリプト実行（テスト）
  - 10件のデータを移行
  - 完了条件: エラーなく実行完了

- [ ] **3.2.3** Supabase Studio でデータ確認
  - 10件のreceiptsが存在
  - 完了条件: データ確認完了

- [ ] **3.2.4** 整合性検証スクリプト作成
  - Firestore件数 === Supabase件数
  - 完了条件: 検証スクリプト作成

- [ ] **3.2.5** 整合性検証実行
  - 完了条件: 100%一致

- [ ] **3.2.6** テスト環境でのUI動作確認
  - 10件すべてが正しく表示される
  - 完了条件: UI表示確認

---

### 3.3 本番環境への移行（0/9）

- [ ] **3.3.1** 本番データ件数確認
  - Firestoreの総Job件数を記録
  - 完了条件: 件数記録（例: 1,234件）

- [ ] **3.3.2** バックアップ取得
  - Firestore全データをエクスポート
  - 完了条件: バックアップファイル作成

- [ ] **3.3.3** メンテナンスモード開始
  - Firestoreへの書き込みを停止
  - ユーザーに通知
  - 完了条件: 書き込み停止確認

- [ ] **3.3.4** 本番移行スクリプト実行
  - 全データ移行（進捗表示付き）
  - 完了条件: エラーなく完了

- [ ] **3.3.5** 整合性検証（本番）
  - Firestore件数 === Supabase件数
  - 完了条件: 100%一致

- [ ] **3.3.6** サンプリング検証
  - ランダム100件を手動確認
  - 完了条件: データ内容が正しい

- [ ] **3.3.7** アプリ切り替え
  - フロントエンドをSupabase参照に切り替え
  - 完了条件: デプロイ完了

- [ ] **3.3.8** 本番動作確認
  - 全画面で動作確認
  - 完了条件: 正常動作確認

- [ ] **3.3.9** Firestore格下げ
  - Firestoreをイベントログ専用に変更
  - 完了条件: 役割変更完了

---

## 🎓 完了基準

### Phase 1完了条件
- ✅ Supabaseプロジェクト作成完了
- ✅ テーブル・ENUM・Function作成完了
- ✅ Repository実装完了
- ✅ 二重書き込み動作確認（Firestore + Supabase）

### Phase 2完了条件
- ✅ 型定義を547行→200行に削減
- ✅ 全UIコンポーネントがstatus駆動
- ✅ 12状態すべてに対応
- ✅ UI真っ白が0件

### Phase 3完了条件
- ✅ 全データ移行完了
- ✅ Firestore件数 === Supabase件数（100%一致）
- ✅ 本番環境で正常動作
- ✅ Firestoreをイベントログ専用に格下げ

---

## 📚 参考資料

- [implementation_plan_UPDATED.md](file:///C:/Users/kazen/.gemini/antigravity/brain/969b0a66-a361-48a4-9679-359b9c632af4/implementation_plan_UPDATED.md)
- [ui_analysis_and_migration_strategy.md](file:///C:/Users/kazen/.gemini/antigravity/brain/969b0a66-a361-48a4-9679-359b9c632af4/ui_analysis_and_migration_strategy.md)
- [architecture_comparison_UPDATED.md](file:///C:/Users/kazen/.gemini/antigravity/brain/969b0a66-a361-48a4-9679-359b9c632af4/architecture_comparison_UPDATED.md)

---

## 📝 更新履歴

| 日付 | 更新内容 | 更新者 |
|------|---------|--------|
| 2026-02-07 | 初版作成 | AI |

---

**このファイルは作業進捗に応じて随時更新してください**
