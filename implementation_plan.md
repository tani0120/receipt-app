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

## Phase 2: Firebase全面移行 & バックエンド実装 (Architecture Change)
**方針**: 顧問先共有フォルダ(Drive)以外は全てFirebaseで実装する。
**優先順位**: 設計(Schema) -> パイプライン(Ingest) -> UI接続(Frontend)

### Step 0: 詳細設計 & ロジック監査 (完了)
- [x] **技術詳細定義**: `src/api/lib/ai/strategy/ZuboraLogic.ts` および `NEXT_SESSION_BRIEF.md` にて定義済。
    - [x] L1 GAS層のための `ハッシュマップ関数` (概念完了)。
    - [x] `重複排除フィンガープリント` アルゴリズム。
    - [x] `論理削除` 用ディレクトリ構造 (Drive設計として完了)。
    - [x] `ズボラルール` 判定ロジック。
- [x] **スキーマ確定 (Schema V2)**: `accounting_judgment` Gatekeeperロジック導入完了。
- [x] **AIモデル選定**: Gemini 2.0 Flash 正式採用。

### Step 1: Firestoreデータ設計 (Design)
*UIを作る前に「データの形」を確定させる。*
- [ ] **Firestore Schema定義**:
    - [ ] `clients` collection (企業設定, ズボラルール設定)。
    - [ ] `documents` collection (取引データの本体, Universal Schema構造)。
    - [ ] `ledger` collection (仕訳データ, 会計ソフト連携用)。
- [ ] **型定義の実装 (`types.ts`)**:
    - [ ] `Universal_OCR_Schema` の TypeScript化。
    - [ ] `document_type` (RECEIPT, INVOICE, etc.)。

### Step 2: データ取り込みパイプライン (Backend Ingest)
*Driveにファイルが置かれたらFirebaseに取り込む。*
- [ ] **Cloud Functions (Triggers)**:
    - [ ] Drive変更検知、またはGASからのWebhook受信。
    - [ ] 画像ファイルの Storage への転送。
- [ ] **AI処理パイプライン (`VertexAIStrategy.ts`)**:
    - [ ] **Gatekeeper**: 会計証憑かどうかの判定 (Accounting Judgment)。
    - [ ] **OCR/推論**: Gemini 2.0 Flash によるデータ抽出 (Schema V2)。
    - [ ] **ズボラルール適用**: `ZuboraLogic` (ハイブリッド判定) の実行。
    - [ ] **Firestore保存**: 結果を `documents` へ書き込み。

### Step 3: UI接続 (Frontend Integration)
*データが流れてくることを確認してからUIを繋ぐ。*
- [ ] **Screen E (仕訳エディタ) 接続**:
    - [ ] Firestore `documents` をリアルタイムリスン (`onSnapshot`)。
    - [ ] 編集結果を Firestore へ書き戻す (`updateDoc`)。
    - [ ] **9バケツロジック**: UIではなくバックエンドのフィルタとして実装。
- [ ] **結合テスト**: ファイルアップロード -> AI解析 -> 画面表示 の一気通貫。
