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

## Phase 2: Parallel Change Backend Preparation (Completed)
- [x] **Schema V2.8 Definition**: Isolated `src/types/schema_v2.ts` created.
- [x] **Legacy Survey**: Audited `firestore.ts` and `ui.type.ts`.
- [x] **Migration Logic**:
    - [x] **Adapter**: `legacy_to_v2.ts` implemented (Split Job -> WorkLog + Receipt).
    - [x] **Service**: `migration_service.ts` created (Idempotent, Dry-Run).
- [x] **Debugger**: `MigrationTester.vue` deployed to Admin Settings.
- [x] **Verification**: Data Seeding & Dry Run verified.

## Phase 3: UI Migration (Vertical Slice Strategy)
- **Step 1: Pilot & Read Access (Target: Screen H)**
  - [ ] Create `src/repositories/receiptRepository.ts` (Read-only first).
  - [ ] Migrate `ScreenH` (Receipt Detail/Dashboard) to fetch from `receipts` collection.
  - **Goal**: Validate V2 Schema visualization.

- **Step 2: Core Write Logic (Target: Screen E)**
  - [ ] Implement Write methods in Repository.
  - [ ] Update `ScreenE` (Journal Entry) to save data to `work_logs` & `receipts` (Split Write).
  - **Goal**: Establish data integrity and "Parallel Change" write path.

- **Step 3: Horizontal Expansion (Target: Screen A, B)**
  - [ ] Migrate List views (`ScreenA`, `ScreenB`).
  - [ ] Switch data source from `jobs` to `work_logs` + `receipts`.

