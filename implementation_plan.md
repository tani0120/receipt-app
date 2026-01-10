# AI経理システム 実装計画書 (Implementation Plan)

**ファイルの運用方針 (File Policy)**:
*   **追加 (Append)**: `NEXT_SESSION_BRIEF.md` 等。既存内容を維持し末尾に追加。
*   **修正 (Modify)**: `implementation_plan.md` 等。常に最新の状態に書き換える。

## Phase 1: フロントエンド基盤構築 & 基本構造 (完了)
- [x] **プロジェクトセットアップ**: リポジトリ作成, 環境変数設定, Cloud Run構成。
- [x] **UI実装 (Screen A - H)**:
    - [x] Screen A: 顧客一覧 (モックデータ)
    - [x] Screen B: 仕訳ステータス (カンバンボード)
    - [x] Screen C: 照合 (UI骨子) ※9バケツUIは実装しないことに決定
    - [x] Screen E: 仕訳エディタ (インタラクティブ動作)
- [x] **デプロイ**: Cloud Run + Firebase Hosting (検証済)。
- [x] **セキュリティ実装**: `src/router/index.ts` (Admin Guard) 実装済み。

## Phase 2: AIロジック & バックエンド (次回セッション)
**目標**: 「ハイブリッド・アーキテクチャ」と「照合エンジン」を高精度で実装する。

### Step 0: 詳細設計 & ロジック監査 (完了)
- [x] **技術詳細定義**: `src/api/lib/ai/strategy/ZuboraLogic.ts` および `NEXT_SESSION_BRIEF.md` にて定義済。
    - [x] L1 GAS層のための `ハッシュマップ関数`。
    - [x] `重複排除フィンガープリント` アルゴリズム。
    - [x] `論理削除` 用ディレクトリ構造。
    - [x] `ズボラルール` 判定ロジック (A-1...A-6, B-1...B-6)。
- [x] **スキーマ確定 (Schema V2)**: `accounting_judgment` Gatekeeperロジックを導入。
- [x] **AIモデル選定**: Gemini 2.0 Flash を正式採用 (コスト/性能バランス)。

### Step 2: AI & データロジック実装 (Backend)

- [ ] **型定義の更新 (`types.ts`)**
    - [ ] `Universal_OCR_Schema` の実装 (Appendix A)。
    - [ ] `document_type` enum の追加 (RECEIPT, BANK_STATEMENT, etc.)。
    - [ ] `issuer`, `transaction_header`, `line_items` の追加 (Universal構造)。
    - [ ] `validation` フィールドの追加 (`is_invoice_qualified`, `has_stamp_duty`)。
    - [ ] `strategy` ロジック型の追加 (Universal Schemaからの `learningKey` 生成)。
- [ ] **Vertex AI 戦略の更新 (`VertexAIStrategy.ts`)**
    - [ ] **モデル指定**: `gemini-2.0-flash-exp` を採用。
    - [ ] **Gatekeeperロジック**: 画像が「会計証憑」か否かを判定する `accounting_judgment` プロンプトの実装。
    - [ ] `Universal OCR Schema V2` (Gatekeeper付き) の適用。
    - [ ] **Prompt Annotation**: `line_items` の抽出モード切り替えロジック実装 (領収書 vs 通帳)。
    - [ ] **Prompt Annotation**: `is_invoice_qualified` ロジック実装 (< 30,000円 ルール)。
    - [ ] `Multi-dimensional Key` 生成の実装 (`issuer.name` + `transaction_header.total_amount` + `transaction_header.payment_method`)。
- [ ] **GAS ロジック更新 (Mock/Test)**
    - [ ] Universal schema を使用した `Amount Range` 分類ロジックの検証。
- [ ] **結合テスト**: 「CSVアップロード」から「仕訳作成」までの一連フロー検証。
- [ ] **負荷テスト**: 大量の重複データセットを用いたバッチ処理検証。
- [ ] **UX改善**: レスポンシブ確認とアニメーション調整。
