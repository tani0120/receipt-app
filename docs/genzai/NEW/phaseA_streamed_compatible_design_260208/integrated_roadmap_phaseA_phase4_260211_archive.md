# 統合ロードマップ: Phase A完了 → Phase 4完了（2週間）

**作成日**: 2026-02-11  
**レビュー者**: Gemini AI  
**ステータス**: レビュー版（修正案含む）

---

## 📊 全体評価

### ✅ 優れている点
1. **具体的なコード例**: TypeScript/Vue実装が明確
2. **テストケースの明記**: 各実装にテストが紐づいている
3. **成果物チェックリスト**: 各Dayの完了条件が明確
4. **段階的な進行**: Phase A → Phase 4 の依存関係が正しい

### ⚠️ 修正が必要な点
1. **Day配分が楽観的**: 一部のタスクに時間不足の懸念
2. **Phase A Task A.0.1の扱い**: 既存の修正案との統合が不明確
3. **Phase 5への言及**: スコープ外の内容が混在
4. **バックエンドAPI**: Phase 4でモック、Phase 5で実装の境界が曖昧

---

## 🔧 修正版: Week 1（Phase A完了）

### Day 1-2: Task A.0の詳細セクション精査 ✅ そのまま採用

**変更なし**。以下の内容で進行:
- [ ] 8-11章の精査（学習ロジック、ルール劣化、GA+AI、安全弁）
- [ ] ChatGPT議論ログとの整合性確認
- [ ] 修正が必要な箇所のリスト作成

**成果物**: concept_phaseA_overview_260208.md 8-11章精査完了

---

### Day 3-4: Task A.0.1 + A.0.4 統合決定 ⚠️ 修正

**問題点**: Task A.0.1（前文修正案）が既に存在するが、Day 3-4で扱われていない

**修正案**:

#### Day 3: Task A.0.1 最終化
```markdown
### 作業内容
□ plan_phaseA_A01_final_revision_260210.md のレビュー
□ 前文の最終版確定:
  - 哲学セクション（AIは決定責任を持たない）
  - 価値定義の明確化
  - ユーザー視点の強調

□ concept_phaseA_overview_260208.md 0-2章の更新
  - 前文を最終版で上書き
  - 整合性チェック

### 成果物
- concept_phaseA_overview_260208.md 0-2章確定
```

#### Day 4: Task A.0.4 最終決定（ルール閾値）
```markdown
### 決定プロセス（元の内容を維持）
□ verification_A04_comparison.md レビュー
□ UI/UX影響評価
□ 最終判断: 1回案 or 2回案

### 追加: Phase 4への影響分析
□ 1回案採用の場合:
  - RuleConfirmationModal が必須
  - API: POST /api/receipts/:id/learn
  
□ 2回案採用の場合:
  - 自動ルール化ロジック（バックエンド）
  - UI: 「2回目です」バッジ表示のみ

### 成果物
- verification_A04_comparison.md 更新
- Phase 4実装仕様への影響明記
```

---

### Day 5-6: Task A.1 + A.2 ⚠️ 日程延長

**問題点**: Task A.1（status/label定義）とA.2（イベント駆動）は相互依存が強く、1日では不足

**修正案**:

#### Day 5: Task A.1 status/label/readonly 定義 v1.0
```markdown
### v0.1レビュー
☑ Task A.0の概要を基にレビュー
☑ 不明点の洗い出し

### v1.0確定
☑ [journal_v1_20260211.md](file:///C:/dev/receipt-app/docs/genzai/02_database_schema/journal/journal_v1_20260211.md) 作成
  
  ## status定義（5つ）
  - draft: 下書き（編集可能）
  - submitted: 提出済み（判断待ち、編集可能）
  - needs_info: 判断保留（情報不足、編集可能）
  - approved: 承認済み（判断完了、編集可能）
  - exported: 出力済み（処理完了、編集不可）
  
  ## label定義（9つ）
  - MULTI_TAX: 軽減税率混在警告
  - LOW_OCR_CONF: OCR信頼度低警告
  - OUT_OF_PERIOD: 期間外警告
  - DUPLICATE_SUSPECT: 重複疑い警告
  - NEEDS_REVIEW: 手動レビュー推奨
  - HIGH_AMOUNT: 高額取引警告（100万円超）
  - TAX_RISKY: 税務リスク科目警告
  - VENDOR_UNKNOWN: 取引先不明警告
  - RULE_CONFLICT: ルール競合警告
  
  ## readonly計算式
  readonly = (status === 'exported')
  
  ## uiMode導出
  type JournalUiMode = 'editable' | 'readonly' | 'fallback';
  
  uiMode = status === 'exported' ? 'readonly' 
         : status in ['draft', 'submitted', 'needs_info', 'approved'] ? 'editable'
         : 'fallback';
  
  ## バッチ管理
  - export_batches テーブル: CSV出力履歴
  - journal_exports テーブル: 仕訳とバッチの紐付け
  - CSVファイル名: `{clientId}_{timestamp}_journals.csv`

### 成果物
- [journal_v1_20260211.md](file:///C:/dev/receipt-app/docs/genzai/02_database_schema/journal/journal_v1_20260211.md)
- Phase 4実装への影響分析
```

#### Day 6: Task A.2 Streamed互換（イベント駆動）
```markdown
### イベントストリーム設計
□ concept_streamed_event_driven.md 作成

  ## イベント種類
  1. receipt.uploaded
  2. receipt.preprocessed
  3. receipt.ocr_done
  4. journal.suggested
  5. journal.needs_info
  6. journal.exported（不可逆）
  
### 実装方針
□ PostgreSQL trigger設計
  - status変更監査ログ自動記録
  - journal.exported → status: 'exported'（不可逆）
  - journal.needs_info → status: 'needs_info'
  - journal.approved → status: 'approved'
  
  ## Firestore vs PostgreSQL
  - Firestore: イベントログ（過程の記録）
  - PostgreSQL: 現在状態（単一の真実）

### PostgreSQL trigger設計（Phase 5準備）
□ status変更時の自動監査ログ記録
□ exported後の編集防止（CHECK制約）

### 成果物
- concept_streamed_event_driven.md
- PostgreSQL trigger設計案（Phase 5用）
```

---

### Day 7: Task A.3 Phase 4再設計指針 + Phase A完了

```markdown
### Phase 4修正箇所の明確化
□ plan_phase4_redesign_260211.md 作成

  ## 修正対象
  1. Step 4.3.11: 明細disabled制御
     - readonly判定ロジック実装
  
  2. Step 4.4: ルール化UI実装
     - 1回案 or 2回案に基づく
     - RuleConfirmationModal.vue 新規作成
  
  3. uiMode再設計
     - JournalUiMode型定義
     - status → uiMode 導出ロジック

  ## 実装方針
  - Phase A定義を厳密に適用
  - テストファーストアプローチ
  - ブラウザ実機テスト必須

### Phase A完了報告書作成
□ report_phaseA_completion_260211.md 作成
  - 完了タスク一覧
  - 確定した設計思想
  - Phase 4への橋渡し内容
  - 残課題（あれば）

### 成果物
- plan_phase4_redesign_260211.md
- report_phaseA_completion_260211.md
- Phase A完了宣言 ✅
```

---

## 🔧 修正版: Week 2（Phase 4再開）

### Day 8-9: Step 4.3.11 実装 ✅ コード例そのまま採用

**変更点**: テストを先に書く（TDDアプローチ）

```markdown
### Day 8: テスト作成
□ JournalLineEditor.spec.ts 先行作成
  - status='exported' → 全項目disabled
  - status='draft' → 全項目enabled
  - 状態遷移テスト
  
### Day 9: 実装
□ JournalLineEditor.vue 実装
  - isEditable computed実装
  - getFieldDisabled()実装
  - 7項目全てにdisabled適用

□ テスト実行 → 全合格確認
```

---

### Day 10-11: Step 4.4 実装 ⚠️ 1回案 or 2回案で分岐

**問題点**: Day 4でルール閾値が決まるまで、UIが確定しない

**修正案**: Day 4の決定に応じて実装内容を変更

#### パターンA: 1回案採用の場合
```markdown
### Day 10: RuleConfirmationModal 実装
□ RuleConfirmationModal.vue 作成（元の計画通り）
□ テスト作成: RuleConfirmationModal.spec.ts
□ ScreenE_Workbench.vue に統合

### Day 11: API連携（モック）
□ モックAPI実装: /api/receipts/:id/learn
□ 成功/失敗ハンドリング
□ ローディング状態管理
```

#### パターンB: 2回案採用の場合
```markdown
### Day 10: 自動ルール化ロジック（フロント部分のみ）
□ 「2回目です」バッジ表示UI
□ ルール化の自動提案（バックエンド待ち）

### Day 11: API連携準備
□ モックAPI: 自動ルール化判定
□ UI: 確認なしで次へ進む
```

**推奨**: **1回案を推奨**（Phase A文書の価値定義に合致）

---

### Day 12: Phase 4-🅲 安定化フェーズ ✅ そのまま採用

**変更なし**。以下の内容で進行:
- [ ] JournalStatus → JournalUiMode 網羅性テスト
- [ ] Fallback動作の境界値テスト
- [ ] disabled制御の境界テスト

---

### Day 13-14: ブラウザ実機テスト + 完了報告 ⚠️ 1日追加

**問題点**: 実機テストで問題が見つかった場合の修正時間が不足

**修正案**:

#### Day 13: ブラウザ実機テスト
```bash
# 開発環境起動
npm run dev

# テストシナリオ
1. Journal作成（status='draft'）
2. 明細入力（全7項目編集可能を確認）
3. 仕訳確定
4. ルール化モーダル表示確認
5. 「ルール化する」選択
6. status='exported'変更
7. 全項目disabledを確認
8. Console警告・エラー: 0件確認
```

**予想される問題**:
- Vue Devtools警告
- TypeScript型エラー
- CSS崩れ

#### Day 14: 修正 + 完了報告
```markdown
### 修正作業
□ Day 13で見つかった問題の修正
□ 再テスト実行

### Phase 4完了報告書作成
□ report_phase4_completion_260211.md 作成
  - 実装完了内容
  - テスト結果（自動 + 手動）
  - 残課題（Phase 5に持ち越し）
  - Phase 5への橋渡し

### 成果物
- report_phase4_completion_260211.md
- Phase 4完了宣言 ✅
```

---

## 📊 修正版成果物チェックリスト

### Phase A関連（Week 1）
- [ ] concept_phaseA_overview_260208.md 完全版（0-11章）
- [ ] [journal_v1_20260211.md](file:///C:/dev/receipt-app/docs/genzai/02_database_schema/journal/journal_v1_20260211.md)
- [ ] concept_streamed_event_driven.md
- [ ] verification_A04_comparison.md 更新（最終決定記録）
- [ ] plan_phase4_redesign_260211.md
- [ ] report_phaseA_completion_260211.md ← ✨新規追加

### Phase 4関連（Week 2）
- [ ] JournalLineEditor.spec.ts（Day 8）
- [ ] JournalLineEditor.vue（Day 9）
- [ ] RuleConfirmationModal.spec.ts（Day 10）
- [ ] RuleConfirmationModal.vue（Day 10）
- [ ] ScreenE_Workbench.vue 更新（Day 11）
- [ ] report_phase4_completion_260211.md ← ✨新規追加

---

## 🚨 重要な修正点まとめ

### 1. **日程の再配分**
- Task A.0.1を独立したDay（Day 3）に配置
- Task A.1 + A.2を2日に延長（Day 5-6）
- Day 14を予備日兼完了報告日に設定

### 2. **Phase 5への言及削減**
- Phase 4ではモック実装のみ
- バックエンドAPI実装はPhase 5で明確化
- trigger設計は「Phase 5準備」として分離

### 3. **完了報告書の追加**
- Phase A完了報告書（Day 7）
- Phase 4完了報告書（Day 14）
- 各Phaseの正式な完了を文書化

### 4. **1回案を推奨**
- Phase A価値定義に合致
- UI実装がシンプル
- ユーザー制御が明確

---

## ✅ 最終的な2週間スケジュール

```
Week 1: Phase A完了
  Day 1-2: 詳細セクション精査
  Day 3:   Task A.0.1最終化
  Day 4:   Task A.0.4決定
  Day 5:   Task A.1実施
  Day 6:   Task A.2実施
  Day 7:   Task A.3 + Phase A完了報告

Week 2: Phase 4完了
  Day 8:   Step 4.3.11テスト作成
  Day 9:   Step 4.3.11実装
  Day 10:  Step 4.4テスト + 実装（Modal）
  Day 11:  Step 4.4 API連携（モック）
  Day 12:  安定化フェーズ（自動テスト）
  Day 13:  ブラウザ実機テスト
  Day 14:  修正 + Phase 4完了報告
```

---

## 💡 追加の推奨事項

### デイリーチェックポイント
毎日終了時に以下を確認:
- [ ] その日の成果物が完成
- [ ] Gitコミット完了
- [ ] 翌日のタスクが明確

### リスク管理
- **予備日**: Day 14を予備日として確保
- **ブロッカー**: Task A.0.4の決定が遅れた場合、Day 10-11に影響
- **対策**: Day 4で必ず決定、保留不可

---

**この修正版で、より実行可能で達成感のある2週間になります！**
