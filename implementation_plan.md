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

### Step 1: Firestoreデータ設計 (Schema Definition V2.8)

### 方針: 安全なマージ (Safe Merge Strategy)
既存の `src/types.ts` を上書きせず、以下のV2.8要件を統合する形をとる。

### 1. ユーザーマスタ (Staff)
`path: /users/{userId}`
* **目的:** 担当者の原価管理。
* **必須フィールド:**
    * `hourly_charge_rate_jpy`: number (標準チャージレート/時給)

### 2. 企業マスタ (Client)
`path: /companies/{companyId}`
* **目的:** 顧問先の契約管理、予実管理、リアルタイム集計。
* **必須フィールド:**
    * `financials`:
        * `annual_contract_fee_jpy`: number (年間報酬)
        * `expected_journal_count_monthly`: number (契約上の想定仕訳数)
        * `expected_work_hours_monthly`: number (契約上の想定工数)
    * `current_month_stats`: (AIコスト、枚数、実働時間などの集計値)

### 3. 日報・工数ログ (Work Logs)
`path: /companies/{companyId}/work_logs/{logId}`
* **目的:** システム外作業（電話、面談など）のコスト捕捉。
* **必須フィールド:**
    * `duration_mins`: number
    * `category`: 'MEETING' | 'CALL' | etc.
    * `cost_jpy`: number (スナップショット原価)

### 4. 証憑データ (Receipts) - The Core
`path: /companies/{companyId}/receipts/{receiptId}`
* **Fact/Opinion分離:** `ocr_data` と `accounting_data` の分離構造を維持。
* **System Meta:** `file_hash` (SHA-256) を追加し重複排除に対応。
* **Analytics (Metrics):**
    * `usage_logs`: 配列。`step`, `model`, `cost_usd`, `duration_ms` を記録し、工程別ボトルネック分析に対応。
* **ROI (Human Analytics):**
    * `review_duration_ms`: 画面滞在時間。
    * `staff_hourly_rate_snapshot`: 承認時の時給を記録。
    * `actual_human_cost_jpy`: 確定した労務コスト。

### Step 2: データ取り込みパイプライン (Backend Ingest)
*Driveにファイルが置かれたらFirebaseに取り込む (Tracer Bullet)。*
- [ ] **Cloud Functions & GAS連携**:
    - [ ] **GAS (Trigger)**: ファイル監視のみ。「ファイルID」と「会社ID」を Webhook で通知 (Payloadのみ)。
    - [ ] **Cloud Functions (Ingest)**: Drive APIストリームを使用してバイパス転送 (GASメモリ回避)。
- [ ] **Firestore構造化 (Subcollection)**:
    - [ ] `companies/{id}/receipts/{docId}` パターンでの保存実装。
- [ ] **AI処理パイプライン (Batch & Realtime)**:
    - [ ] **Gatekeeper**: 会計証憑かどうかの判定 (Accounting Judgment)。
    - [ ] **OCR/推論**: Gemini 2.0 Flash によるデータ抽出 (Schema V2)。
    - [ ] **ズボラルール適用**: `ZuboraLogic` (ハイブリッド判定) の実行。
    - [ ] **Batch構成**: Storage蓄積 -> Scheduler -> Batch API -> Firestore一括更新 (50%コスト減)。

### Step 3: UI接続 (Frontend Integration)
*データが流れてくることを確認してからUIを繋ぐ。*
- [ ] **Screen E (仕訳エディタ) 接続**:
    - [ ] Firestore `documents` をリアルタイムリスン (`onSnapshot`)。
    - [ ] 編集結果を Firestore へ書き戻す (`updateDoc`)。
    - [ ] **9バケツロジック**: UIではなくバックエンドのフィルタとして実装。
- [ ] **結合テスト**: ファイルアップロード -> AI解析 -> 画面表示 の一気通貫。
