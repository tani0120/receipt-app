# 統合タスクリスト: Phase A + Phase 4（2週間）

**作成日**: 2026-02-11  
**期間**: Week 1-2（Phase A完了 → Phase 4完了）  
**目的**: Day 1-14の進捗を一元管理

---

## 📊 完了済みPhase（Phase 0-3）

### Phase 0: アーキテクチャ設計 ✅ 完了（2026-02-05）
- [x] Firestore vs PostgreSQL比較分析
- [x] optional地獄の特定（242個のoptionalフィールド）
- [x] UI真っ白問題の特定（12種statusを無視）
- [x] PostgreSQL追加の正当化

**完了レポート**: [design_architecture_comparison_260205.md](file:///C:/dev/receipt-app/docs/genzai/OLD/phase0_architecture_design_260205/design_architecture_comparison_260205.md)

---

### Phase 1: PostgreSQL導入 ✅ 完了（2026-02-07）
- [x] Step 1.1: Supabaseプロジェクト作成
- [x] Step 1.2: テーブル作成（receipts, audit_logs）
- [x] Step 1.3: SDK導入とリポジトリ作成
- [x] Step 1.4: API統合（Firestore + Supabase両方書き込み）

**成果**:
- optional地獄 91.7%削減（242個 → 20個）
- 監査証跡完備（audit_logs）
- status ENUM化、SQL function化、CHECK制約

**完了レポート**: [plan_phase1_overall_260207.md](file:///C:/dev/receipt-app/docs/genzai/OLD/phase1_postgresql_introduction_260207/plan_phase1_overall_260207.md)  
**詳細タスク**: [task_phase1_260207.md](file:///C:/dev/receipt-app/docs/genzai/OLD/phase1_postgresql_introduction_260207/task_phase1_260207.md)

---

### Phase 2: Receipt UI実装 ✅ 完了（2026-02-07）
- [x] Step 2.1: フロント型定義の統合
- [x] Step 2.2: UI条件分岐のstatus化（6種UIモード）
- [x] Step 2.3: 既存画面の改修

**核心設計**: `status → uiMode → template` 2段階構造

**完了レポート**: [report_phase2_completion_260207.md](file:///C:/dev/receipt-app/docs/genzai/OLD/phase2_receipt_ui_refactor_260207/report_phase2_completion_260207.md)  
**詳細タスク**: [task_phase2_260207.md](file:///C:/dev/receipt-app/docs/genzai/OLD/phase2_receipt_ui_refactor_260207/task_phase2_260207.md)

---

### Phase 🅲: 安定化フェーズ ✅ 完了（2026-02-07）
- [x] Task 1: ReceiptStatus → ReceiptUiMode 網羅性テスト（7/7合格）
- [x] Task 2: Fallback動作の境界値テスト（4/4合格）
- [x] Task 3: ViewModel正規化の境界テスト（5/5合格）
- [x] Task 4: ブラウザ実機テスト（6種UIモード確認）

**自動テスト結果**: 16/16合格 ✅  
**手動テスト結果**: ブラウザ実機確認完了 ✅

---

### Phase 3: データ移行 ✅ スキップ確定（2026-02-07）
- [x] Firestoreに`receipts`コレクション不在を確認
- [x] 移行対象データ = 0件
- [x] ドメイン境界の完全分離確認

**スキップ理由**: Receiptドメインは最初からSupabase専用

**完了レポート**: [decision_phase3_migration_skip_260207.md](file:///C:/dev/receipt-app/docs/genzai/OLD/phase3_data_migration_skip_260207/decision_phase3_migration_skip_260207.md)  
**詳細決定**: 同上（スキップ決定のため個別タスク不在）

---

## 🔵 Week 1: Phase A完了（7日間）

### Day 1-2: Task A.0 詳細セクション精査 ✅ 完了（2026-02-11）
- [x] 8章精査: 学習ロジック詳細
  - [x] 学習の正体（モデル学習 vs ルール最適化）
  - [x] 学習の種3種（制約失敗、人修正、自動成功）
  - [x] 顧問先ローカルルール生成条件（1回案採用確認）
- [x] 9章精査: ルール劣化・破棄ロジック
  - [x] 劣化検知の3シグナル（修正率、confidence低下、時間経過）
  - [x] decay_score計算式の妥当性
  - [x] 降格フロー（AUTO_RULE → SUGGEST_ONLY → DISABLED）
- [x] 10章精査: GA + AI 正規化
  - [x] GAの役割（重み探索）
  - [x] AIの役割（境界判定のみ、3-7%）
  - [x] コスト配分（15円/枚制約、7-9円で達成）
- [x] 11章精査: 自動化率安全弁
  - [x] 上限85%制限の根拠
  - [x] 金額・重要度ブレーキ（50,000円超、固定資産）
  - [x] 定期リセットの必要性（月次レビュー）
- [x] ChatGPT議論ログとの整合性確認
- [x] 修正が必要な箇所のリスト作成 → **修正不要と結論**
- [x] アイデア.mdの整合性確認 → **完全に整合**

**詳細手順**: [integrated_roadmap Day 1-2](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/integrated_roadmap_phaseA_phase4_260211.md#day-1-2-task-a0-詳細セクション精査)  
**関連タスク**: [task_phaseA_260208.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/task_phaseA_260208.md)  
**参照**: [discussion_chatgpt_postgresql_migration_260209.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/discussion_chatgpt_postgresql_migration_260209.md)  
**成果物**: [concept_phaseA_overview_260208.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/concept_phaseA_overview_260208.md) 8-11章精査完了

---

### Day 3: Task A.0.1 前文最終化 ✅ 完了（2026-02-11）
- [x] [plan_phaseA_A01_final_revision_260210.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/plan_phaseA_A01_final_revision_260210.md) レビュー
- [x] 前文の最終版確定:
  - [x] 「何を」セクション（75-87行）: 最終定義 + 意味の説明 + 導出過程リンク
  - [x] レイヤー2（124-131行）: 「選択するだけで仕訳完了」を追加
  - [x] 序文の最終定義との整合性確認
- [x] [concept_phaseA_overview_260208.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/concept_phaseA_overview_260208.md) 0-2章を最終版で更新
- [x] 整合性チェック

**詳細手順**: [integrated_roadmap Day 3](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/integrated_roadmap_phaseA_phase4_260211.md#day-3-task-a01-前文最終化)  
**使用プラン**: [plan_phaseA_A01_final_revision_260210.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/plan_phaseA_A01_final_revision_260210.md)  
**関連タスク**: [task_phaseA_260208.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/task_phaseA_260208.md)  
**成果物**: concept_phaseA_overview_260208.md 0-2章確定

---

### Day 4: Task A.0.4 ルール閾値決定（保留禁止） ✅ 完了（2026-02-11）
- [x] [verification_A04_comparison.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/verification_A04_comparison.md) レビュー
- [x] 1回案 vs 2回案の比較内容を再確認
- [x] 価値定義との整合性チェック
- [x] UI/UX への影響評価
- [x] **最終判断（必須）**:
  - [x] **1回案（明示的制御）採用決定** ← Phase A文書で推奨
  - [ ] 2回案（段階的信頼）
- [x] 決定理由の文書化
- [x] Phase 4への影響明記（RuleConfirmationModal.vue Day 10-11）
- [x] verification_A04_comparison.md 更新
- [x] アイデア.md 整合性修正

**詳細手順**: [integrated_roadmap Day 4](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/integrated_roadmap_phaseA_phase4_260211.md#day-4-task-a04-ルール閾値決定保留禁止)  
**検証文書**: [verification_A04_comparison.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/verification_A04_comparison.md)  
**UI/UX評価**: [day4_decision_uiux_impact.md](file:///C:/Users/kazen/.gemini/antigravity/brain/738bd95a-e545-4f4a-9d65-0a0317a4158c/day4_decision_uiux_impact.md)  
**関連タスク**: [task_phaseA_260208.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/task_phaseA_260208.md)  
**成果物**: 
- verification_A04_comparison.md 更新（最終決定記録）
- アイデア.md 修正（1回案に統一）

---

### Day 5: Task A.1 status/label/readonly定義 + PostgreSQL制約設計 ✅
- [x] **v0.1レビュー（5文書の総合的整合性確認）**:
  - [x] concept_phaseA_overview_260208.md - Section 7「設計への翻訳メモ」
  - [x] discussion_chatgpt_postgresql_migration_260209.md - status設計・UI状態管理
  - [x] アイデア.md - ルール学習機能・ステータス管理
  - [x] setup_status_report_260211.md - PostgreSQL設定状況
  - [x] integrated_roadmap_phaseA_phase4_260211.md - Day 5詳細
- [x] 整合性チェック:
  - [x] statusの定義が文書間で統一されているか
  - [x] labelの役割が明確で一貫しているか
  - [x] readonlyの計算式が矛盾していないか
  - [x] PostgreSQL制約との整合性
- [x] 不明点の洗い出し
- [x] `journal_v1_20260211.md` 作成:
  - [x] status定義（draft, submitted, needs_info, approved, **exported**）
  - [x] label定義（基本5つ + HIGH_AMOUNT, TAX_RISKY, VENDOR_UNKNOWN, RULE_CONFLICT）
  - [x] readonly計算式（`readonly = (status === 'exported')`）
  - [x] uiMode導出ロジック（exported対応）
  - [x] バッチ管理設計（export_batches, journal_exports）
  - [x] 責任範囲の明確化（本システム: CSV出力まで、MF: インポート後）
  - [x] 完全なjournalsテーブルスキーマ（22カラム）
  - [x] MF連携カラム定義（遠い将来用）
  - [x] CSV出力フロー仕様
  - [x] APIガード句仕様
  - [x] UI表示仕様（Composable）
- [x] PostgreSQL制約設計（仕様のみ、実装はPhase 5）:
  - [x] exported後の編集防止仕様（CHECK制約の設計）
  - [x] status ENUM型の仕様
  - [x] 制約の文書化（SQL実装はPhase 5で実施）
- [x] Phase 4実装への影響分析

**詳細手順**: [integrated_roadmap Day 5](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/integrated_roadmap_phaseA_phase4_260211.md#day-5-task-a1-statuslabelreadonly定義--trigger基礎)  
**関連タスク**: [task_phaseA_260208.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/task_phaseA_260208.md)  
**事前チェック**: [day5_prechecklist.md](file:///C:/Users/kazen/.gemini/antigravity/brain/738bd95a-e545-4f4a-9d65-0a0317a4158c/day5_prechecklist.md)  
**成果物**: 
- [journal_v1_20260211.md](file:///C:/dev/receipt-app/docs/genzai/02_database_schema/journal/journal_v1_20260211.md)
- PostgreSQL制約設計案（仕様文書、SQL実装はPhase 5）

---

### Day 6: Task A.2 Streamed互換（イベント駆動） + trigger実装案
- [ ] **v0.2レビュー（9文書の総合的整合性確認）**:
  - [ ] concept_phaseA_overview_260208.md - Section 5「税理士にとっての価値」
  - [ ] discussion_chatgpt_postgresql_migration_260209.md - イベント設計、Firestore vs Supabase
  - [ ] アイデア.md - イベント駆動設計（全文検索）
  - [ ] task_phaseA_260208.md - Task A.2詳細
  - [ ] integrated_roadmap_phaseA_phase4_260211.md - Day 6詳細
  - [ ] setup_status_report_260211.md - Firestore設定状況
  - [ ] task_integrated_phaseA_phase4_260211.md - Day 6タスク
  - [ ] verification_A04_comparison.md - AI推論の位置づけ（参考）
  - [ ] (その他関連文書)
- [ ] 整合性チェック:
  - [ ] イベント定義が文書間で統一されているか
  - [ ] Firestore vs PostgreSQLの役割分離が明確か
  - [ ] status変更とイベントのマッピングが一貫しているか
  - [ ] trigger設計がPostgreSQL制約と整合しているか
- [ ] `concept_streamed_event_driven.md` 作成:
  - [ ] イベント種類（receipt.uploaded, journal.suggested等）
  - [ ] イベント → status マッピング
  - [ ] Firestore vs PostgreSQL役割分離
- [ ] PostgreSQL trigger設計:
  - [ ] status変更時の自動監査ログ記録
  - [ ] exported後の編集防止trigger
  - [ ] SQL実装案作成

**詳細手順**: [integrated_roadmap Day 6](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/integrated_roadmap_phaseA_phase4_260211.md#day-6-task-a2-イベント駆動設計--trigger実装案)  
**関連タスク**: [task_phaseA_260208.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/task_phaseA_260208.md)  
**参照マトリクス**: [phaseA_reference_matrix.md](file:///C:/Users/kazen/.gemini/antigravity/brain/738bd95a-e545-4f4a-9d65-0a0317a4158c/phaseA_reference_matrix.md)  
**成果物**:
- concept_streamed_event_driven.md
- trigger実装案（SQL付き、Phase 5実装用）

---

### Day 7: Task A.3 Phase 4再設計指針 + Phase A完了報告
### Day 7: Phase A完了報告作成 + Phase 4準備
- [ ] **Phase A完了レビュー（9文書の総合的整合性確認）**:
  - [ ] concept_phaseA_overview_260208.md - 全体レビュー
  - [ ] discussion_chatgpt_postgresql_migration_260209.md - 全体確認
  - [ ] integrated_roadmap_phaseA_phase4_260211.md - Week 1完了条件
  - [ ] アイデア.md - 全体機能一覧
  - [ ] task_phaseA_260208.md - Phase A完了条件
  - [ ] setup_status_report_260211.md - 環境確認
  - [ ] task_integrated_phaseA_phase4_260211.md - Week 1完了チェック
  - [ ] verification_A04_comparison.md - 決定事項整理
  - [ ] plan_phaseA_A01_final_revision_260210.md - 前文最終版
- [ ] Phase A完了チェック:
  - [ ] タスクA.0.1-A.2がすべて完了しているか
  - [ ] 成果物がすべて作成されているか
  - [ ] 不明点がすべて解決されているか
  - [ ] Phase 4への影響がすべて明記されているか
- [ ] `report_phaseA_completion_260211.md` 作成:
  - [ ] Phase A完了サマリー
  - [ ] 成果物一覧（7ドキュメント）
  - [ ] 主要決定事項（1回案採用等）
  - [ ] Phase 4への影響まとめ
- [ ] Phase 4準備:
  - [ ] Phase 4再設計ガイドライン骨子
  - [ ] Week 2スケジュール確認

**詳細手順**: [integrated_roadmap Day 7](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/integrated_roadmap_phaseA_phase4_260211.md#day-7-phase-a完了報告--phase-4準備)  
**関連タスク**: [task_phaseA_260208.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/task_phaseA_260208.md)  
**参照マトリクス**: [phaseA_reference_matrix.md](file:///C:/Users/kazen/.gemini/antigravity/brain/738bd95a-e545-4f4a-9d65-0a0317a4158c/phaseA_reference_matrix.md)  
**成果物**:
- report_phaseA_completion_260211.md
- Phase 4再設計ガイドライン骨子

**完了宣言**: Phase A完了 ✅

---

## 🟡 Week 2: Phase 4完了（7日間）

### Day 8: Step 4.3.11 テスト作成（TDD）
- [ ] **Phase A成果物レビュー**:
  - [ ] [journal_v1_20260211.md](file:///C:/dev/receipt-app/docs/genzai/02_database_schema/journal/journal_v1_20260211.md) - status定義確認
  - [ ] plan_phase4_redesign_260211.md - Phase 4再設計指針
  - [ ] report_phaseA_completion_260211.md - Phase A決定事項
- [ ] `JournalLineEditor.spec.ts` 作成:
  - [ ] status='exported' → 全7項目disabled
  - [ ] status='draft' → 全7項目enabled
  - [ ] status='submitted' → 全7項目enabled
  - [ ] status='needs_info' → 全7項目enabled
  - [ ] 状態遷移テスト（draft → approved → exported）
  - [ ] フィールド個別テスト（各入力項目）
- [ ] テスト実行（失敗することを確認）

**詳細手順**: [integrated_roadmap Day 8](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/integrated_roadmap_phaseA_phase4_260211.md#day-8-9-step-4311-実装-✅-コード例そのまま採用)  
**関連タスク**: [task_phase4_260208.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/task_phase4_260208.md)  
**参照（Phase A成果物）**:
- [journal_v1_20260211.md](file:///C:/dev/receipt-app/docs/genzai/02_database_schema/journal/journal_v1_20260211.md)（Day 5作成）
- plan_phase4_redesign_260211.md（Day 7作成）
- report_phaseA_completion_260211.md（Day 7作成）

**成果物**: JournalLineEditor.spec.ts

---

### Day 9: Step 4.3.11 実装
- [ ] **Phase A定義の再確認**:
  - [ ] status定義（draft, submitted, needs_info, approved, exported）
  - [ ] readonly計算式: `readonly = (status === 'exported')`
  - [ ] uiMode導出ロジック確認
- [ ] `JournalLineEditor.vue` 実装:
  - [ ] `isEditable` computed実装（Phase A定義に基づく）
  - [ ] `getFieldDisabled()` 実装
  - [ ] 7項目全てに`:disabled`適用:
    1. [ ] 借方勘定科目
    2. [ ] 借方補助科目
    3. [ ] 借方金額
    4. [ ] 貸方勘定科目
    5. [ ] 貸方補助科目
    6. [ ] 貸方金額
    7. [ ] 摘要
- [ ] テスト実行 → 全合格確認

**詳細手順**: [integrated_roadmap Day 9](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/integrated_roadmap_phaseA_phase4_260211.md#day-8-9-step-4311-実装-✅-コード例そのまま採用)  
**関連タスク**: [task_phase4_260208.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/task_phase4_260208.md)  
**参照（Phase A成果物）**: [journal_v1_20260211.md](file:///C:/dev/receipt-app/docs/genzai/02_database_schema/journal/journal_v1_20260211.md)  
**成果物**: JournalLineEditor.vue

---

### Day 10: Step 4.4 Modal実装（1回案に基づく）
- [ ] **1回案の再確認**:
  - [ ] verification_A04_comparison.md - 1回案採用の決定理由
  - [ ] day4_decision_uiux_impact.md - UI/UX影響評価
  - [ ] RuleConfirmationModal仕様確認
- [ ] `RuleConfirmationModal.spec.ts` 作成:
  - [ ] 「ルール化する」ボタン → create_ruleイベント
  - [ ] 「例外として扱う」ボタン → mark_exceptionイベント
  - [ ] 「後で決める」ボタン → cancelイベント
  - [ ] 表示コンテンツ確認テスト
- [ ] `RuleConfirmationModal.vue` 実装:
  - [ ] モーダルUI作成（Phase A価値定義に基づくデザイン）
  - [ ] 3つのボタン実装
  - [ ] イベントemit実装
  - [ ] 説明文実装（「次回この条件の取引を：」）
- [ ] テスト実行 → 全合格確認

**詳細手順**: [integrated_roadmap Day 10](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/integrated_roadmap_phaseA_phase4_260211.md#day-10-11-step-44-実装-⚠️-1回案-or-2回案で分岐)  
**関連タスク**: [task_phase4_260208.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/task_phase4_260208.md)  
**参照（Phase A成果物）**:
- verification_A04_comparison.md（Day 4 - 1回案採用決定）
- day4_decision_uiux_impact.md（Day 4 - UI/UX評価）

**成果物**:
- RuleConfirmationModal.spec.ts
- RuleConfirmationModal.vue

---

### Day 11: Step 4.4 API連携（モック）
- [ ] **イベント駆動設計の確認**:
  - [ ] concept_streamed_event_driven.md - イベント定義
  - [ ] journal.exported イベント仕様確認
  - [ ] rule.created イベント仕様確認
- [ ] モックAPI実装:
  - [ ] `POST /api/receipts/:id/learn`
  - [ ] リクエストボディ: `{ action: 'create_rule' | 'mark_exception' }`
  - [ ] レスポンス: `{ success: true }` のみ（Phase 5で詳細化）
- [ ] `ScreenE_Workbench.vue` 更新:
  - [ ] RuleConfirmationModal統合
  - [ ] handleJournalConfirm実装
  - [ ] handleRuleDecision実装（3つのアクション対応）
- [ ] 成功/失敗ハンドリング
- [ ] ローディング状態管理
- [ ] エラーメッセージ表示

**詳細手順**: [integrated_roadmap Day 11](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/integrated_roadmap_phaseA_phase4_260211.md#day-10-11-step-44-実装-⚠️-1回案-or-2回案で分岐)  
**関連タスク**: [task_phase4_260208.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/task_phase4_260208.md)  
**参照（Phase A成果物）**: concept_streamed_event_driven.md（Day 6作成）  
**成果物**: ScreenE_Workbench.vue 更新

---

### Day 12: Phase 4-🅲 安定化フェーズ
- [ ] **Phase A定義との整合性確認**:
  - [ ] [journal_v1_20260211.md](file:///C:/dev/receipt-app/docs/genzai/02_database_schema/journal/journal_v1_20260211.md) - status/uiMode定義
  - [ ] テストケースがPhase A定義を網羅しているか確認
- [ ] Task 1: JournalStatus → JournalUiMode 網羅性テスト
  - [ ] draft → editable（Phase A定義に基づく）
  - [ ] submitted → editable（Phase A定義に基づく）
  - [ ] needs_info → editable（Phase A定義に基づく）
  - [ ] exported → readonly（Phase A定義に基づく）
  - [ ] null/undefined → fallback（Phase A定義に基づく）
- [ ] Task 2: Fallback動作の境界値テスト
  - [ ] journal = null → uiMode = 'fallback'
  - [ ] journal.status = undefined → uiMode = 'fallback'
  - [ ] journal.status = 'INVALID' → uiMode = 'fallback'
- [ ] Task 3: disabled制御の境界テスト
  - [ ] status='exported' → 全7項目disabled
  - [ ] status='draft' → 全7項目enabled
  - [ ] status='submitted' → 全7項目enabled
  - [ ] status='needs_info' → 全7項目enabled
  - [ ] 状態遷移テスト（各状態間の遷移）
- [ ] Task 4: ルール化Modal表示テスト
  - [ ] 仕訳確定後にModal表示
  - [ ] 各ボタンの動作確認

**詳細手順**: [integrated_roadmap Day 12](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/integrated_roadmap_phaseA_phase4_260211.md#day-12-phase-4-🅲-安定化フェーズ-✅-そのまま採用)  
**関連タスク**: [task_phase4_260208.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/task_phase4_260208.md)  
**参照（Phase A成果物）**: [journal_v1_20260211.md](file:///C:/dev/receipt-app/docs/genzai/02_database_schema/journal/journal_v1_20260211.md)  
**成果物**: 自動テスト全合格（100%）

---

### Day 13: ブラウザ実機テスト
- [ ] **Phase A価値定義の体験確認**:
  - [ ] concept_phaseA_overview_260208.md - UXの3原則確認
  - [ ] 「自動=勝手に確定しない」が体現されているか
  - [ ] 「直したら終わりにならない」が体現されているか
  - [ ] 「止めるUIが目立つ」が体現されているか
- [ ] 開発環境起動（`npm run dev`）
- [ ] テストシナリオ実行:
  1. [ ] Journal作成（status='draft'）
  2. [ ] 明細入力（全7項目編集可能を確認）
  3. [ ] 仕訳確定
  4. [ ] **ルール化モーダル表示確認**（1回案の体験）
     - [ ] 説明文が明確か
     - [ ] 「ルール化する」「例外として扱う」ボタンが分かりやすいか
  5. [ ] 「ルール化する」選択
  6. [ ] status='exported'変更
  7. [ ] **全項目disabledを確認**（readonly体験）
  8. [ ] UI状態がPhase A定義と一致しているか確認
- [ ] Console警告リスト作成
- [ ] 問題リスト作成
- [ ] Phase A価値定義との差異リスト作成

**詳細手順**: [integrated_roadmap Day 13](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/integrated_roadmap_phaseA_phase4_260211.md#day-13-14-ブラウザ実機テスト--完了報告-⚠️-1日追加)  
**関連タスク**: [task_phase4_260208.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/task_phase4_260208.md)  
**参照（Phase A成果物）**:
- concept_phaseA_overview_260208.md（UXの3原則）
- verification_A04_comparison.md（1回案の体験確認）

**成果物**: 
- テストレポート
- Console警告リスト
- 問題リスト
- Phase A差異リスト

---

### Day 14: 警告修正 + Phase 4完了報告
- [ ] Console警告修正（全て）:
  - [ ] Vue Devtools警告対応
  - [ ] 未使用import削除
  - [ ] TypeScript型エラー修正
  - [ ] ESLint警告修正
- [ ] 再テスト実行（自動 + 手動）
- [ ] Console警告: 0件を達成
- [ ] **Phase A整合性の最終確認**:
  - [ ] Phase A価値定義がすべて実装されているか
  - [ ] 1回案が正しく実装されているか
  - [ ] status/label/readonly定義が正しく適用されているか
  - [ ] イベント駆動設計が反映されているか
- [ ] `report_phase4_completion_260211.md` 作成:
  - [ ] 実装完了内容（Phase A対応項目を明記）
  - [ ] テスト結果（自動 + 手動）
  - [ ] Phase A定義との整合性確認結果
  - [ ] 残課題（Phase 5に持ち越し）
  - [ ] Phase 5への橋渡し（Phase A成果物の活用方針）

**詳細手順**: [integrated_roadmap Day 14](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/integrated_roadmap_phaseA_phase4_260211.md#day-13-14-ブラウザ実機テスト--完了報告-⚠️-1日追加)  
**関連タスク**: [task_phase4_260208.md](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/task_phase4_260208.md)  
**参照（Phase A全成果物）**:
- report_phaseA_completion_260211.md（Day 7作成）
- 全Phase A成果物との整合性確認

**成果物**: report_phase4_completion_260211.md

**完了宣言**: Phase 4完了 ✅

---

## 📚 関連ドキュメント

### 全体計画
- [統合ロードマップ](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/integrated_roadmap_phaseA_phase4_260211.md) - 2週間の詳細計画

### Phase A関連
- [Phase Aタスク詳細](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/task_phaseA_260208.md)
- [Phase A概要](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/concept_phaseA_overview_260208.md)
- [前文修正案](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/plan_phaseA_A01_final_revision_260210.md)
- [ルール閾値検証](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/verification_A04_comparison.md)
- [価値定義議論](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/discussion_phaseA_value_definition_260209.md)
- [ChatGPT議論ログ](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/discussion_chatgpt_postgresql_migration_260209.md)

### Phase 4関連
- [Phase 4タスク詳細](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/task_phase4_260208.md)
- [Phase 4再設計指針](予定) - Day 7作成予定

### 引き継ぎ資料
- [Claude引き継ぎ資料](file:///C:/Users/kazen/.gemini/antigravity/brain/b317fb3f-1c5a-46ab-9b80-d50923f2ae26/for_claude_handoff_260211.md)

### セットアップ関連
- [ツール・セットアップガイド](file:///C:/dev/receipt-app/docs/genzai/01_tools_and_setups/tools_and_setup_guide.md)
- [セットアップ状況レポート](file:///C:/dev/receipt-app/docs/genzai/01_tools_and_setups/setup_status_report_260211.md)

---

## 🎯 完了条件

### Phase A完了条件
- [x] concept_phaseA_overview_260208.md 完全版（0-11章）
- [x] ルール閾値決定（1回案 or 2回案）
- [x] status/label/readonly v1.0確定
- [x] Streamed互換の概念定義完了
- [x] Phase 4再設計指針確定
- [x] Phase A完了報告書作成

### Phase 4完了条件
- [x] Step 4.3.11完了（明細disabled制御）
- [x] Step 4.4完了（ルール化UI + モックAPI）
- [x] 自動テスト合格率: 100%
- [x] ブラウザ実機テスト成功
- [x] Console警告・エラー: 0件
- [x] Phase 4完了報告書作成

---

**次のアクション**: Day 1-2（Task A.0 詳細セクション精査）を開始
