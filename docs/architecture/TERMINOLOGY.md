# プロジェクト用語定義

**作成日**: 2026-01-22  
**最終更新**: 2026-01-22  
**目的**: プロジェクト全体で使用する用語を統一定義

---

## Phase（フェーズ）

### 定義

**意味**: プロジェクト全体の大きな区切り

**特徴**:
- 開発環境・技術スタックが変わる
- ユーザーへの価値提供のタイミング
- デプロイ単位
- 所要時間: 数週間〜数ヶ月

**例**:
- **Phase 1（テスト環境）**: Gemini API、Firebase Spark Plan（無料版）、手動アップロード
- **Phase 2（本番環境）**: Vertex AI、Firebase Blaze Plan（有料版）、GAS自動化

---

## Step（ステップ）

### 定義

**意味**: 1つのPhase内の作業手順

**特徴**:
- 順序がある（Step 1 → Step 2 → Step 3）
- 1つ完了したら次に進む
- 所要時間: 数時間〜数日
- 完了条件が明確

**例**:
- Step 1: 小さく開発のスコープ決定（1-2時間）
- Step 2: L1-3定義（3-4時間）
- Step 3: AI API実装（2-3時間）
- Step 4: UIモック（4-6時間）

---

## 使い分けの原則

### Phaseを使うべき場合

1. **開発環境が変わる**
   - テスト環境 → 本番環境
   - 無料版 → 有料版
   - 同期処理 → 非同期処理

2. **技術スタックが変わる**
   - Gemini API → Vertex AI
   - 手動アップロード → GAS自動化
   - Cloud Functions追加

3. **ユーザーへの価値提供**
   - Phase 1完了 → 顧問先がテスト利用可能
   - Phase 2完了 → 本番運用開始

---

### Stepを使うべき場合

1. **1つのPhase内の作業手順**
   - Phase 1の中で、Step 1 → Step 2 → Step 3

2. **順序依存がある**
   - Step 2（L1-3定義）は Step 3（AI API実装）の前提

3. **完了条件が明確**
   - Step 1完了: スコープ決定ドキュメント作成
   - Step 2完了: Zodスキーマ作成

---

## 混同しやすい用語

### ❌ 誤り

- 「Phase 1のStep 1」を「Phase 1.1」と表記
- 「Step 1〜4」を「Phase 1〜4」と表記

### ✅ 正しい

- 「Phase 1のStep 1」
- 「Phase 1（テスト環境）のStep 1〜4」

---

## 実際の使用例

### ADR-010: AI API移行戦略

**Phase 1（テスト環境）**:
- Step 1: 依存関係インストール
- Step 2: ディレクトリ作成
- Step 3: ファイル作成（5ファイル）
- Step 4: Gemini API Key取得
- Step 5: 環境変数設定
- Step 6: Vueコンポーネント作成
- Step 7: 動作確認

**Phase 2（本番環境）**:
- Step 1: Firebase Blaze Plan移行
- Step 2: Cloud Functions初期化
- Step 3: Vertex AI API有効化
- Step 4: Service Account作成
- Step 5: Cloud Functionsデプロイ
- Step 6: 本番環境動作確認

---

### UseCase 3レイヤー化

**Phase 3-A（UseCase定義）**:
- Step 1: 全207件を4箱に分類
- Step 1.5: サブクラスタ分解
- Step 2: サブクラスタ判定（core/reference/log）
- Step 3: coreサブクラスタ内部役割分解

**Phase 3-B（UIモック作成）**:
- Step 1: core 29件のUIモック作成
- Step 2: ユーザーレビュー
- Step 3: UIモック修正

**Phase 3-C（意味定義確定）**:
- Step 1: プロパティとUseCaseの対応付け
- Step 2: property-integration-map.md更新

---

## 関連用語

### Task（タスク）

**意味**: 完了すべき作業単位（PhaseやStepを含む上位概念）

**例**:
- タスクE: Penta-Shield実装（複数のPhaseを含む）
- タスクF: アーキテクチャ改善（ADR-009/010作成）

---

### Milestone（マイルストーン）

**意味**: プロジェクトの重要な節目（複数のPhaseをまたぐ）

**例**:
- Milestone 1: MVP完成
- Milestone 2: 本番リリース

---

## 参照

**関連ドキュメント**:
- [ADR-010: AI API移行戦略](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-010-ai-api-migration.md)
- [session-management-protocol-complete.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/session-management-protocol-complete.md)
- [TASK_MASTER.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/TASK_MASTER.md)
