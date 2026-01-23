<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<!-- CRITICAL: AI TYPE SAFETY RULES - MUST FOLLOW WITHOUT EXCEPTION             -->
<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<!-- 
【型安全性ルール - AI必須遵守事項】

## ❌ 禁止事項（6項目）- NEVER DO THESE:
1. Partial<T> + フォールバック値 (client.name || 'XXX') - TYPE CONTRACT DESTRUCTION
2. any型（実装済み機能） - TYPE SYSTEM ABANDONMENT
3. status フィールドの無視 - AUDIT TRAIL DESTRUCTION
4. Zodスキーマでのany型 (z.any()) - SCHEMA LEVEL TYPE ABANDONMENT
5. 型定義ファイルでのany型 (interface { field: any }) - INTERFACE LEVEL DESTRUCTION
6. 型定義の二重管理（新旧スキーマ混在） - TYPE DEFINITION CONFLICT

## ✅ 許可事項（3項目）- ALLOWED:
1. 将来のフェーズ未実装機能でのeslint-disable + throw new Error()
2. unknown型の使用（型ガードと組み合わせて）
3. 必要最小限の型定義（Pick<T>, Omit<T>等）

## 📋 類型分類（9種）:
| 類型 | 今すぐ修正 | 将来Phase | 修正不要 |
|------|-----------|----------|---------|
| 1. Partial+フォールバック | ✅ | - | - |
| 2. any型（実装済み） | ✅ | - | - |
| 3. status未使用 | ✅ | - | - |
| 4. eslint-disable | - | - | ✅ |
| 5. Zod.strict()偽装 | ※1+2 | - | - |
| 6. Zodスキーマany型 | ✅ | - | - |
| 7. 型定義any型 | ✅ | - | - |
| 8. 全体any型濫用 | - | ✅ | - |
| 9. 型定義不整合 | ✅ | - | - |

詳細: complete_evidence_no_cover_up.md
-->
<!-- ═══════════════════════════════════════════════════════════════════════════ -->

# セッション管理プロトコル【完全版】

**作成日**: 2026-01-15  
**最終更新**: 2026-01-24  
**ステータス**: Active  
**関連ファイル**: PROJECT_INDEX.md, READING_INDEX.md, task.md, SESSION_INDEX.md

**策定日**: 2026-01-16  
**Version**: 1.0  
**目的**: セッション間での知識継続性の確保、AIの忘却防止、哲学・動機の保持

**重要**: 本ドキュメントで使用する用語（Phase/Step等）の定義は [TERMINOLOGY.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/TERMINOLOGY.md) を参照してください。

---

## 1. セッション開始プロトコル

```markdown
【セッション開始プロトコル】
会話の最初のターンで、必ず以下を実行すること：

**0. SESSION_CHECKLIST.md作成（最優先・必須）**
   - brain/SESSION_CHECKLIST.mdを即座に作成
   - 今回のセッションで実施すべきことをリスト化
   - 以降、このファイルを「外部記憶」として使用
   - 短期記憶が飛んでも、このファイルを読めば継続可能
   - **理由**: AIの短期記憶は200k token制限があり、長いセッションでは必ず忘れる

0.1. （オプション）前回セッションの確認
   - [SESSION_INDEX.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_INDEX.md) を見て、前回のセッションを確認
   - 続きがある場合のみ、該当の SESSION_YYYYMMDD.md を読む
   - 新しい議題の場合は読まなくてよい

0.5. **未解決議論の確認（必須・例外なし）**
   - [UNRESOLVED_DISCUSSIONS.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/UNRESOLVED_DISCUSSIONS.md) を必ず読む
   - 未解決議論が0件か確認
   - 0件でなければ、ユーザーに確認:
     ```
     【未解決議論があります】
     1. [項目1]
     2. [項目2]
     
     今回のセッションで対応しますか？ [Yes/Later]
     ```

1. 必須ファイルを読む
   - [READING_INDEX.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/READING_INDEX.md) （必読ファイルマスター）
   - [TASK_MASTER.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/TASK_MASTER.md) （現在のタスク・進行状況、AI矯正ログ）
   - [session-management-protocol-complete.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/session-management-protocol-complete.md) （本プロトコル）
   - [ADR-004: Penta-Shield](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-004-penta-shield-defense-layers.md) （Staged Freeze Model、AI矯正ログ、Phase 6検証）
   - [ADR-005: 防御層実装](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-005-defense-layer-implementation.md) （L1/L2/L3）
   - [ADR-006: UI・CI統合](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-006-ui-ci-integration.md) （L4/L5）
   - [SYSTEM_PHILOSOPHY.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/SYSTEM_PHILOSOPHY.md) （システム哲学、存在する場合）
   - [CHANGELOG_SYSTEM_PHILOSOPHY.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/CHANGELOG_SYSTEM_PHILOSOPHY.md) （変更履歴、存在する場合）

2. 理解度を自己チェック
   - システムの本質は何か？（人間承認・タスク化の概念）
   - 哲学の変遷（直近）は？（CHANGELOG参照）
   - 型安全戦略は何か？
   - 現在のフェーズは何か？
   - 今日のタスクは何か？

3. 結果を必ず報告（以下の形式で）
   
   **まず、クリック可能なリンクを表示**：
   
   ## 📋 必読ファイル（クリックして開く）
   
   ### オプション
   - [SESSION_INDEX.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_INDEX.md)
   
   ### 必須
   1. [READING_INDEX.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/READING_INDEX.md)
   2. [TASK_MASTER.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/TASK_MASTER.md)
   3. [session-management-protocol-complete.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/session-management-protocol-complete.md)
   4. [ADR-004: Penta-Shield](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-004-penta-shield-defense-layers.md)
   5. [ADR-005: 防御層実装](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-005-defense-layer-implementation.md)
   6. [ADR-006: UI・CI統合](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-006-ui-ci-integration.md)
   7. [SYSTEM_PHILOSOPHY.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/SYSTEM_PHILOSOPHY.md) (存在する場合)
   8. [CHANGELOG_SYSTEM_PHILOSOPHY.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/CHANGELOG_SYSTEM_PHILOSOPHY.md) (存在する場合)
   
   ---
   
   **次に、理解度チェック結果を報告**：
   
   【セッション開始確認】
    
   **Q: システムの本質は何か？**
   A: [SYSTEM_PHILOSOPHY.mdから引用]
    
   **Q: 哲学の変遷（直近）は？**
   A: [CHANGELOG.mdから引用]
    
   **Q: 現在のフェーズは何か？**
   A: [task.mdから引用]
    
   **Q: 今日のタスクは何か？**
   A: [task.mdから引用]
    
   **読んだファイル:**
   - [リスト]
    
   **理解度:** ⭐⭐⭐⭐☆ (X/5)
   **不足している理解:** [具体的に記載]
   
   ---
   
   ### ⚠️ Anti-Rebellion Protocol（要約版）
   
   **ファイル更新時は必ず以下を遵守**：
   
   1. **更新前に提示**
      - diff形式で変更箇所を明示
      - 「〜を更新しますか？」と明確に確認
   
   2. **承認を待つ**
      - ユーザーの承認を得るまで更新しない
      - 「実装しろ」等の明示的指示がない限り、勝手に更新禁止
   
   3. **承認後に実行**
      - 承認された内容のみ更新
   
   **詳細**: [dev_guide.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/dev_guide.md)のAnti-Rebellion Protocol参照

---

## セッション記録

### 2026-01-21: Firebase認証設定完了 + プロトコル改善

**主な成果**:
- Firebase認証ガード修正完了
- セッション管理プロトコル改善提案作成（session-protocol-improvement.md）
- SESSION_CHECKLIST.md導入（外部記憶として活用）
- UNRESOLVED_DISCUSSIONS.md作成（未解決議論の明示的記録）

**教訓**:
- AIの短期記憶問題 → SESSION_CHECKLIST.mdで解決
- 議論途中の放棄問題 → UNRESOLVED_DISCUSSIONS.mdで記録

---

## 1.5. セッション中プロトコル（重要な議論発生時）

**最終更新**: 2026-01-21

### 重要な議論を検知したら即座に記録

**検知キーワード**:
- アーキテクチャ、設計、技術選定
- 原則、哲学、プロトコル
- ADR、重要な決定

**検知したら即座に実施**:

1. **一旦停止**
   ```
   【重要な議論を検知】
   キーワード: [具体的に]
   
   SESSION_CHECKLIST.mdに追記が必要です。
   今すぐ記録しますか？ [Yes/Later]
   ```

2. **SESSION_CHECKLIST.mdに追記**
   ```markdown
   ## セッション中に記録すべきこと
   - [ ] SYSTEM_PHILOSOPHY.md更新（Firebase認証層追加）
   - [ ] CHANGELOG_SYSTEM_PHILOSOPHY.md更新
   ```

3. **議論が中断・保留した場合**
   - 理由、再開条件、記録先を明記

---

## 1.7. Phase/Step/Milestone提示プロトコル（必須）

**最終更新**: 2026-01-23  
**目的**: 常に全体の見通しを提供し、現在地を明確にする

### 必須提示タイミング

以下のすべての場合に、Phase/Step/Milestoneの全体像を提示:

1. ✅ **セッション開始時**
   - セッション開始プロトコル実施後
   - ユーザーに現在地と次のアクションを明示

2. ✅ **タスク開始時**
   - task_boundary呼び出し後
   - 新しいタスクの位置付けを明示

3. ✅ **ステップ完了時**
   - Step完了報告と同時に
   - 次のStepへの移行を明示

4. ✅ **ユーザーから進捗確認があった時**
   - 「未解決議論と次のタスクを出せ」等の要求
   - 即座に全体像を提示

5. ✅ **方向転換が必要な時**
   - 計画と実際の乖離が発生した場合
   - ユーザーに現在地と計画を再確認

---

### 提示フォーマット

必ず以下の3つを含める:

#### 1. ✅ 完了したフェーズ・ステップ
- 既に終わった作業
- 成果物へのファイルリンク
- 完了日

#### 2. 🔄 現在のフェーズ・ステップ
- 今やっている作業
- 次にやるべきステップ
- 参照ドキュメントへのファイルリンク

#### 3. ⏳ 将来のフェーズ・ステップ
- まだ着手していない作業
- 全体の見通し
- 各Milestoneへのファイルリンク

---

### 参照ファイル

常に以下を参照してリンクを提示:

**Brain（セッション固有）**:
- [implementation_plan.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/implementation_plan.md) - Phase 1実装計画の詳細
- [task.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/task.md) - 進捗チェックリスト

**Docs（プロジェクト全体）**:
- [TASK_MASTER.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/TASK_MASTER.md) - プロジェクト全体のタスク管理
- [TERMINOLOGY.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/TERMINOLOGY.md) - Phase/Step/Milestone定義

---

### テンプレート

```markdown
## 📋 Phase/Step/Milestoneの全体像（ファイルリンク付き）

### 📚 参照ドキュメント
- [implementation_plan.md](file://...) - Phase 1実装計画
- [TASK_MASTER.md](file://...) - プロジェクト全体のタスク
- [task.md](file://...) - 進捗チェックリスト

### ✅ 既に完了したフェーズ・ステップ

#### Phase 0: 準備・設計（完了）
- ✅ [ADR-009](file://...)作成
- ✅ [TERMINOLOGY.md](file://...)作成

#### Phase 1 - Step 1（完了）
- ✅ **Step 1: スコープ決定**（2026-01-22）
  - [implementation_plan.md](file://...)作成

---

### 🔄 現在のフェーズ・ステップ

#### Phase 1（テスト環境）- 進行中

**環境**: Gemini API（無料版）、Firebase Spark Plan（無料版）

**Milestone 1.1: OCR→仕訳表示（2-3日）** ← **現在ここ**

**完了したStep**:
- ✅ Step 1: スコープ決定

**次のStep**（未着手）:
- [ ] **Step 2: L1-3定義（2-3時間）** ← **次はこれ**
  - src/features/journal/JournalEntrySchema.ts
  - 参照: [implementation_plan.md L87-120](file://...)

---

### ⏳ 将来のフェーズ・ステップ

#### Milestone 1.2: マスターデータ管理（2-3日）
- [ ] Step 5: 顧問先CRUD実装
- 参照: [implementation_plan.md L215-236](file://...)

#### Milestone 1.3-1.4（省略）

#### Phase 2（本番環境）- 未着手
- 参照: [ADR-010](file://...)

---

## 📊 進捗サマリー

| Phase | Milestone | 所要時間 | 進捗 | 参照 |
|-------|----------|---------|------|------|
| Phase 1 | Milestone 1.1 | 2-3日 | Step 1/4完了 | [L69-213](file://...) |
| Phase 2 | - | 1-2週間 | 未着手 | [ADR-010](file://...) |

---

## 🎯 次のアクション（優先順位順）

1. **Step 2: L1-3定義** ← **次はこれ**
   - 所要時間: 2-3時間
   - 参照: [implementation_plan.md L87-120](file://...)
```

---

### 違反時の対応

**提示を忘れた場合**:
- ユーザーから「次のタスク」「進捗確認」等の要求があった場合
- 即座に全体像を提示
- 「提示が漏れていました」と明示

---

### 運用ルール

#### ルール1: 簡潔性と完全性のバランス

**簡潔に**:
- 完了したフェーズは要約（詳細はファイルリンクで参照）
- 現在のステップは詳細に記載

**完全に**:
- 将来のフェーズは全体を俯瞰できる程度に記載

#### ルール2: ファイルリンクの徹底

**すべてリンク化**:
- ❌ 「implementation_plan.mdを参照」
- ✅ 「[implementation_plan.md](file://...)を参照」

#### ルール3: 進捗サマリーの更新

**必ず最新に保つ**:
- Step完了のたびに進捗率を更新
- 所要時間の見積もりを更新

---

## 1.6. 議論ライフサイクル管理プロトコル

**最終更新**: 2026-01-22  
**目的**: 議論の発生から決定/保留まで、各フェーズで更新すべきファイルを明確化

### 基本原則

**議論が起点、成果物は結果**:
- ✅ 議論が発生 → 進行 → 決定/保留
- ✅ 決定の形式（ADR、Design、実装）は議論の結果
- ✅ すべての更新は議論のライフサイクルに従う

---

### Phase 1: 議論発生

**状態**: 何かを決める必要が出てきた

**検知キーワード**:
- 「どうすべきか？」「どちらがいいか？」
- アーキテクチャの選択、技術選定
- 設計方針、実装方法

**必ず更新**:
- [ ] **UNRESOLVED_DISCUSSIONS.md** - 新しい議論を記録
  - 議論のタイトル
  - 背景・問題
  - 検討すべき選択肢
- [ ] **SESSION_YYYYMMDD.md** - 議論の背景を記録
  - なぜこの議論が発生したか
  - 関連する過去の議論

**Brain（conversation-id）**:
- [ ] **task.md** - 議論を検討タスクとして記録（該当する場合）

---

### Phase 2: 議論進行中

**状態**: 調査、議論、検証、比較検討

**実施内容**:
- 選択肢の調査
- メリット・デメリット比較
- 実験・検証
- ユーザーとの議論

**必ず更新**:
- [ ] **SESSION_YYYYMMDD.md** - 議論の進行状況を記録
  - 調査結果
  - 比較検討内容
  - 暫定結論

**Brain（conversation-id）**:
- [ ] **walkthrough.md** - 調査結果・検証結果を記録

---

### Phase 3: 議論決定

**状態**: 結論が出た

#### 3-A. ADRとして決定

**適用条件**:
- アーキテクチャに影響する決定
- システム全体に関わる原則
- 将来の設計に影響する技術選定

**必ず更新**:
- [ ] **ADR-XXX.md作成**
  - Status: Accepted
  - Date: 決定日
  - Context: 背景
  - Decision: 決定内容
  - Consequences: 結果・影響
- [ ] **READING_INDEX.md更新**
  - 新しいADRを追加
- [ ] **UNRESOLVED_DISCUSSIONS.md更新**
  - ステータスを「解決済み」に
  - 解決方法: ADR-XXXへのリンク
- [ ] **SYSTEM_PHILOSOPHY.md更新**（該当箇所があれば）
  - ADRの内容がシステム哲学に影響する場合
- [ ] **TASK_MASTER.md更新**
  - ADR作成を記録
- [ ] **SESSION_YYYYMMDD.md更新**
  - ADR作成の経緯を記録

**Brain（conversation-id）**:
- [ ] **walkthrough.md更新**
  - ADR作成の成果を記録
- [ ] **task.md更新**（該当タスクがある場合）
  - ADR作成タスクを完了

---

#### 3-B. Designとして決定

**適用条件**:
- 特定機能の設計
- データ構造の決定
- UIフローの決定

**必ず更新**:
- [ ] **Design文書作成**
  - `docs/design/` 配下
  - または usecase-workbook.md へ追記
- [ ] **関連する設計ドキュメント更新**
  - property-integration-map.md
  - その他関連する設計ファイル
- [ ] **UNRESOLVED_DISCUSSIONS.md更新**
  - ステータスを「解決済み」に
  - 解決方法: Design文書へのリンク
- [ ] **TASK_MASTER.md更新**
  - Design作成を記録
- [ ] **SESSION_YYYYMMDD.md更新**
  - Design決定の経緯を記録

**Brain（conversation-id）**:
- [ ] **walkthrough.md更新**
- [ ] **task.md更新**（該当タスクがある場合）

---

#### 3-C. 実装として決定

**適用条件**:
- 議論の結果、すぐに実装することが決まった
- 設計が明確で、実装のみが必要

**必ず更新**:
- [ ] **コード実装**
  - 実装ファイル作成・修正
- [ ] **TASK_MASTER.md更新**
  - 実装タスク完了を記録
- [ ] **UNRESOLVED_DISCUSSIONS.md更新**
  - ステータスを「解決済み」に
  - 解決方法: 実装完了（コミットハッシュ）
- [ ] **SESSION_YYYYMMDD.md更新**
  - 実装完了の経緯を記録

**Brain（conversation-id）**:
- [ ] **walkthrough.md更新**
  - 実装内容を記録
- [ ] **task.md更新**
  - 実装タスクを完了

---

### Phase 4: 議論未決定（保留）

**状態**: 結論が出ない、保留が必要

**保留理由の例**:
- 情報不足（さらなる調査が必要）
- ユーザー判断待ち
- 実装の優先度が低い
- 議論が発散した

**必ず更新**:
- [ ] **UNRESOLVED_DISCUSSIONS.md更新**
  - ステータス: 保留中
  - 保留理由を明記
  - 再開条件を明記
  - 検討した選択肢を記録
- [ ] **SESSION_YYYYMMDD.md更新**
  - 議論の経緯を記録
  - なぜ保留したか

**Brain（conversation-id）**:
- [ ] **walkthrough.md更新**
  - 議論の経緯と保留理由
- [ ] **task.md更新**（該当タスクがある場合）
  - タスクを保留状態に

---

### 運用ルール

#### ルール1: 議論検知の徹底

**重要なキーワードを検知したら**:
1. ✅ 議論が発生したことを認識
2. ✅ Phase 1のチェックリストを即座に実施
3. ✅ UNRESOLVED_DISCUSSIONS.mdに記録

**検知を見逃した場合**:
- ❌ 議論が記録されない
- ❌ 決定プロセスが不透明
- ❌ 将来の参照が困難

---

#### ルール2: フェーズの明確化

**各フェーズで明示的に宣言**:
```
【Phase 1: 議論発生】
議論: Firebase無料版で十分か？
UNRESOLVED_DISCUSSIONS.md更新完了
```

```
【Phase 3-A: ADRとして決定】
ADR-010作成完了
関連ファイル更新完了
```

---

#### ルール3: セッション終了時のダブルチェック

**セッション終了前に確認**:
1. ✅ 今日発生した議論はすべて記録されたか？
2. ✅ 決定した議論の更新は完了したか？
3. ✅ 保留した議論の理由は明記されたか？

**grep検索での確認**:
```bash
# 今日のセッション記録を検索
grep -r "2026-01-22" docs/sessions/SESSION_20260122.md

# UNRESOLVED_DISCUSSIONS.mdで今日の更新を確認
grep -r "2026-01-22" docs/sessions/UNRESOLVED_DISCUSSIONS.md
```

---

### 失敗事例と対策

#### 事例1: ADR-010作成時の更新漏れ

**問題**:
- TASK_MASTER.md未更新（最終更新2026-01-17）
- SESSION_20260122.md に ADR-010の記載なし

**原因**:
- チェックリストがなかった
- セッション終了時の確認プロセスがなかった

**対策**:
- ✅ 本プロトコルを作成
- ✅ Phase 3-Aのチェックリストを徹底
- ✅ セッション終了時のダブルチェック実施

---

### まとめ

**議論ライフサイクル管理の本質**:
1. ✅ **議論が起点**（成果物は結果）
2. ✅ **フェーズごとに更新ファイルが決まる**
3. ✅ **すべてのフェーズで記録を残す**

**期待効果**:
- ✅ 更新漏れの防止
- ✅ 議論プロセスの透明化
- ✅ 将来の参照性向上



## 2. セッション終了プロトコル

**最終更新**: 2026-01-17

### 必須作業（完全チェックリスト）

#### 0. SESSION_CHECKLIST.md確認（最優先）

**外部記憶の活用**:
```
1. brain/SESSION_CHECKLIST.mdを必ず読む
2. 未実施項目（[ ]）を列挙
3. ユーザーに確認
4. すべて完了（[x]）になるまで終了しない
```

**理由**:
- AIの短期記憶は飛ぶ
- SESSION_CHECKLIST.mdが唯一の信頼できる記録
- このファイルを読まずに終了すると、必ず漏れが発生

---

#### 1. ファイル作成・更新の記録
- [ ] SESSION_YYYYMMDD.md作成
  - セッション概要（目標・成果）
  - **作成ファイル完全一覧**（ファイルパス）
  - **更新ファイル一覧**
  - **更新なしファイルの確認**
  - git commit記録（hash, メッセージ）
  - 確立した設計原則・哲学
  - 次回セッション必読ファイル
  - 次のアクション候補

#### 2. メタデータ更新
- [ ] 今日作成したファイルにメタデータ追加
  ```markdown
  **作成日**: YYYY-MM-DD  
  **最終更新**: YYYY-MM-DD  
  **ステータス**: Draft / Active / Frozen / Archived / Deprecated
  ```
- [ ] 今日更新したファイルの「最終更新日」を更新
- [ ] ステータスの確認・更新

#### 3. インデックス更新
- [ ] [PROJECT_INDEX.md](file:///C:/Users/kazen/.gemini/antigravity/brain/129dd3c2-bc83-48ac-91da-9736f587788a/PROJECT_INDEX.md)更新
  - 新規ファイル追加
  - 更新日更新
  - ステータス更新
- [ ] [SESSION_INDEX.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_INDEX.md)更新
  - セッション一覧に追加
  - 重要セッションセクションに詳細追加
- [ ] [READING_INDEX.md](file:///C:/Users/kazen/.gemini/antigravity/brain/129dd3c2-bc83-48ac-91da-9736f587788a/READING_INDEX.md)確認
  - 新規ADR/タスクを追加

#### 4. タスク管理
- [ ] [task.md](file:///C:/Users/kazen/.gemini/antigravity/brain/129dd3c2-bc83-48ac-91da-9736f587788a/task.md)更新
  - 完了したタスクをマーク
  - 次回タスクを明確化
- [ ] 該当TASK_*.md更新
  - 進捗状況を記録
  - Phase完了をマーク

#### 5. ファイル鮮度チェック
- [ ] 今日更新されなかった重要ファイルをリスト化
- [ ] 古いファイルの検出（2週間以上更新なし等）
- [ ] 廃止候補の確認
- [ ] ANALYSIS/ARTIFACTファイルのアーカイブ判定

#### 6. 重要ADR/哲学の確認
- [ ] 今日確立した原則がADRに記録されているか
- [ ] 必要なら追記
- [ ] CHANGELOG_SYSTEM_PHILOSOPHY.md更新（哲学変更があった場合）

#### 6.5. 未解決議論の確認と申し送り（必須）

**目的**: 次回セッションへの確実な申し送り

1. **UNRESOLVED_DISCUSSIONS.mdを読む**

2. **各項目を分類**:
   - [ ] 今回解決 → 削除
   - [ ] 次回対応 → 次回SESSION_CHECKLISTに記載
   - [ ] 長期保留 → TASK_MASTER.mdに転記

3. **ユーザーに提示**:
   ```
   【未解決議論があります】
   1. [項目1] - 再開条件: [条件]
   2. [項目2] - 再開条件: [条件]
   
   次回対応しますか？ [Yes/Later/Archive]
   ```

4. **ユーザー承認後にセッション終了**
   - 未解決議論の扱いが決まるまで終了しない

#### 7. 重要ファイルのプロジェクトディレクトリへの移行

**目的**: セッション間制約を回避し、全セッションで共有可能にする

**対象ファイル**:
- [ ] PROJECT_INDEX.md（brainにある場合）
- [ ] READING_INDEX.md（brainにある場合）
- [ ] その他の全セッション共有すべき重要ドキュメント

**実施方法**:
1. brainディレクトリのファイルを読み取り
2. プロジェクトディレクトリ（docs/）に新規作成
3. 内容を更新（新規ファイル追加等）
4. git commit/push

**判断基準**:
- ✅ 全セッションで共有すべき → プロジェクトディレクトリに移行
- ✅ セッション固有の記録 → brainディレクトリに保持

**注意**:
- brainディレクトリのファイルは削除しない（記録として保持）
- プロジェクトディレクトリ版を最新版とする

---

## 3. メタプロトコル：ファイル管理のルール

**最終更新**: 2026-01-17

### ファイル4分類

#### A. PROTOCOL（永続・人間が見る）
```
session-management-protocol-complete.md
task.md
TASK_*.md
PROJECT_INDEX.md
READING_INDEX.md
```

**特徴**:
- 人間が読む
- 常に最新に保つ
- セッション間で参照
- 削除・アーカイブ禁止

---

#### B. REPORT（永続・記録）
```
SESSION_YYYYMMDD.md
PHASE_N_COMPLETION.md
ADR-XXX.md
```

**特徴**:
- 完了報告・決定記録
- 参照専用
- 更新しない（Frozen）
- 削除禁止

---

#### C. ANALYSIS（一時・分析）
```
*-analysis-*.md
*-gap-*.md
*-protocol.md（分析用）
```

**特徴**:
- 問題分析・検討用
- **protocolへの反映が目的**
- 反映後は**削除またはアーカイブ**

**処理方法**:
1. protocolに重要部分を反映
2. `ARCHIVED_<filename>-YYYYMMDD.md`にリネーム

---

#### D. ARTIFACT（一時・作業用）
```
implementation_plan.md（上書きされる）
その他セッション内作業ファイル
```

**特徴**:
- セッション内で使い捨て
- 完了後は削除またはアーカイブ

---

### 使い捨て判定基準

**削除またはアーカイブ条件**:
- カテゴリC（ANALYSIS） + protocolに反映済み
- カテゴリD（ARTIFACT） + セッション完了

**アーカイブ方法**:
```
ARCHIVED_<filename>-YYYYMMDD.md
```

**永続保存**:
- カテゴリA（PROTOCOL）
- カテゴリB（REPORT）

---

### タスク化の基準

**タスクにする条件**:
1. 複数セッションにまたがる
2. Phase構成が必要
3. 人間の意思決定が複数回必要

**タスクにしない条件**:
- 1セッションで完結
- 単純な改善作業
- 分析のみ

**判定例**:
- protocol-gap-analysis.md → **タスク化不要**（1セッションで完結）
- Penta-Shield実装 → **タスク化必要**（Phase 1-5、複数セッション）

---

### Protocolへの集約原則

**原則**: **すべてはprotocolに集約**

**方法**:
1. 分析ファイル（カテゴリC）で問題を整理
2. session-management-protocol-complete.mdに重要部分を反映
3. 分析ファイルを削除またはアーカイブ

**例外**: 
- 詳細すぎる内容は別ファイル化してprotocolからリンク
- 教科書的なファイル（PHASE_X_COMPLETION.md等）は別ファイルとして保存

---

### 3.1 タスク管理のルール

**最終更新**: 2026-01-17

#### ファイル名の役割分担

**目的**: タスクの散逸防止、完了タスクの網羅性確保

##### TASK_MASTER.md（親タスク）

**配置**: プロジェクトディレクトリ（[docs/TASK_MASTER.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/TASK_MASTER.md)）  
**役割**: 全体マップ、進行中・中断中・完了タスクの一覧  
**更新**: 全セッション共有、都度更新  
**内容**:
- 🔴 現在進行中のタスク
- 🟡 中断中のタスク
- 🟢 完了したタスク
- セッション別完了タスク（全記録）

##### task.md（作業用タスク/アーティファクト）

**配置**: brainディレクトリ（各セッション固有）  
**役割**: セッション内の詳細な作業記録  
**更新**: セッション固有  
**特徴**: Antigravityのアーティファクト機能により自動生成

##### TASK_*.md（子タスク）

**配置**: brainまたはプロジェクトディレクトリ  
**役割**: 特定タスクの詳細（Phase構成、中断・復帰ログ等）  
**参照**: TASK_MASTER.mdから参照

---

#### セッション終了時の転記ルール

**必須作業**:
1. 当該セッションのtask.md（アーティファクト）を確認
2. **TASK_MASTER.mdのセッション別完了タスクセクションに全文コピペ**
3. 進行状況を更新（🔴進行中、🟡中断中、🟢完了）
4. git commit/push

**転記方法**:
```markdown
### セッションYYYYMMDD（日付）

#### task.md
（task.md全文をコピペ）

#### task_xxx.md（あれば）
（task_xxx.md全文をコピペ）
```

**重要**: 
- AIが「重要」を判断しない（全てコピー）
- タスク処理の過程も全て保存
- セッション間で情報が散逸しない

---

## 4. ファイル命名規則

**最終更新**: 2026-01-17

### 永続ドキュメント（ADR等）
```
ADR-XXX-<topic>-YYYYMMDD.md
例: ADR-004-penta-shield-20260116.md
```

### タスクファイル
```
TASK_<NAME>_YYYYMMDD.md
例: TASK_PENTA_SHIELD_20260116.md
```

### セッション記録
```
SESSION_YYYYMMDD.md
```

### 一時分析ファイル
```
<topic>-analysis-YYYYMMDD.md
例: receipt-l1-l3-analysis-20260116.md
```

### 実装計画
```
<entity>-implementation-plan-YYYYMMDD.md
例: client-implementation-plan-20260116.md
```

### アーカイブファイル
```
ARCHIVED_<filename>-YYYYMMDD.md
```

---

## 5. ファイルメタデータ標準

**すべての重要ファイルに必須**:

```markdown
**作成日**: YYYY-MM-DD  
**最終更新**: YYYY-MM-DD  
**ステータス**: Draft / Active / Frozen / Archived / Deprecated  
**関連ファイル**: （オプション）
```

### ステータス定義

| ステータス | 意味 | 更新可否 |
|-----------|------|---------|
| Draft | 作成中、レビュー前 | 可 |
| Active | 使用中、更新中 | 可 |
| Frozen | 確定、更新禁止 | 不可 |
| Archived | 参照専用、古い情報 | 不可 |
| Deprecated | 廃止予定、使用禁止 | 不可 |

---

## 6. インデックスファイル階層

```
READING_INDEX.md（必読ファイル一覧）
  ├─ session-management-protocol-complete.md（このファイル）
  ├─ PROJECT_INDEX.md（ファイル網羅）
  ├─ SESSION_INDEX.md（セッション一覧）
  └─ task.md（タスク管理）
```

---

## 7. 関連ファイル最新性ルール

**最終更新**: 2026-01-17

### 原則

**ファイルAを更新したら、Aを参照しているファイルBの「最終更新日」も更新する**

### 理由

- ファイルBのユーザーに「参照先が更新された」と通知
- 古い情報を参照し続けるリスクを回避

### 実施方法

1. **ファイル更新時**:
   - そのファイルを参照している他のファイルを確認
   - 該当ファイルの「最終更新日」を今日の日付に更新

2. **関連ファイルの見つけ方**:
   - メタデータの「関連ファイル」欄を確認
   - grep検索でファイル名を検索

### 例

**ADR-004を更新した場合**:
```markdown
# 更新すべきファイル
- PHASE_1_COMPLETION.md（ADR-004を参照）
- task.md（ADR-004に言及）
- PROJECT_INDEX.md（ADR-004のステータス更新）
```

**更新内容**:
```markdown
**最終更新**: 2026-01-17  
```

### セッション終了プロトコルへの統合

- [ ] **チェック項目「2. メタデータ更新」に含まれる**
- 今日更新したファイルの「最終更新日」を更新
- **参照元ファイルの「最終更新日」も更新**

---

## 8. 今回のセッション（2026-01-16）で確立した重要な仕組み

### 1. 正史確定（CANONICAL_SOURCES.md、archive分離）

**目的**: ADR-001/002以降の実装根拠を明確化

**内容**:
- [CANONICAL_SOURCES.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/CANONICAL_SOURCES.md)作成
- archive/philosophy/（参照専用・再利用禁止）
- archive/rejected/（虚偽報告）
- archive配下絶対禁止ルールの明文化

**効果**:
- AIが古い資料を誤参照することを防ぐ
- 「何を実装根拠にして良いか」が明確

---

### 2. 2層構造タスク管理（task.md、TASK_*.md）

**目的**: タスクが失われる問題を解決

**内容**:
- [task.md](file:///C:/Users/kazen/.gemini/antigravity/brain/129dd3c2-bc83-48ac-91da-9736f587788a/task.md): 全体マップ（簡潔）
- TASK_*.md: 詳細（人間の思い・目的、Phase構成、枝葉、中断ログ）

**例**:
- [TASK_AI_CONTEXT.md](file:///C:/Users/kazen/.gemini/antigravity/brain/129dd3c2-bc83-48ac-91da-9736f587788a/TASK_AI_CONTEXT.md)
- [TASK_CANONICAL.md](file:///C:/Users/kazen/.gemini/antigravity/brain/129dd3c2-bc83-48ac-91da-9736f587788a/TASK_CANONICAL.md)
- [TASK_CLIENT_DATA.md](file:///C:/Users/kazen/.gemini/antigravity/brain/129dd3c2-bc83-48ac-91da-9736f587788a/TASK_CLIENT_DATA.md)

**効果**:
- 中断したタスクを再開できる
- 人間の思い・目的が失われない

---

### 3. 変更差分承認プロトコル（Diff-based Update Approval Protocol）

**目的**: ファイル更新時の承認プロセスを明確化

**手順**:
1. AIが更新箇所をdiff形式で提示
2. 「〜を更新しますか？」と確認
3. ユーザーがAccept/Rejectで承認
4. Acceptの場合のみ実行
5. 修正結果を差分と一緒に報告

**詳細**: [dev_guide.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/dev_guide.md)の第6項

**効果**:
- 修正箇所が明確
- 誤った更新を防げる
- 承認の証跡が残る

---

4. 【ルール】必読ファイル修正時
   - 議論中に修正が必要になったらAIが提案
   - 人間承認後にAIが修正実施
   
5. 【警告】型安全保護
   - 型安全を脅かす指示には警告と対案を提示

6. 想像で答えない
   - 文書に記載がない情報は「記載なし」と明記
   - チェックポイント要約のみに頼らない
   - 不明点は質問する

7. 【禁止】notify_userの使用制限
   - BlockedOnUser=true は原則使用しない
   - 理由：人間が次の入力をできなくなる
   - 例外：人間が明示的に「承認フローで進めて」と指示した場合のみ

8. 【義務】ファイルリンク提示
   - 人間にファイルを提示する際は、必ずクリック可能なリンクを含めること
   - 形式：[ファイル名](file:///絶対パス)
   - 理由：人間がすぐにファイルを開けるようにする
```

---

## 3. CHANGELOG.mdの必読化【重要】

### なぜCHANGELOG.mdを必読化するのか

#### AI要約の限界

| 要素 | AI要約 | CHANGELOG（詳細） |
|------|--------|------------------|
| What（何を変更） | ✅ 抽出可能 | ✅ |
| How（どう変更） | ✅ 抽出可能 | ✅ |
| **Why（なぜ変更）** | ⚠️ **不完全** | ✅ |
| **哲学・動機** | ❌ **失われる** | ✅ |
| **温度感** | ❌ **失われる** | ✅ |

#### 具体例：動機の消失

**人間の議論**：
```
「5次元分析で、手のかかる客を炙り出し、値上げ交渉する。
デジタルで送ってくれる客は良客だが、紙で送る客はダメ客。
この差を数字で証明したい」
```

**AIの要約（不完全）**：
```
「5次元分析の概念を追加」
```

**問題**：
→ **動機（値上げ交渉、顧客評価）が完全に消失**

#### 解決策

**CHANGELOG.md（過去3ヶ月分）を必読化**

**効果**：
- 哲学・コンセプトの変遷を保持
- 「なぜこの思想に至ったか」が分かる
- AI要約の限界を補完
- ビジネス上の動機・戦略が記録される

**運用**：
- 最近3ヶ月分のみ必読
- それ以前は`docs/architecture/archive/`へ移動

---

## 4. AIの変更履歴出力形式【標準テンプレート】

```markdown
### vX.Y (YYYY-MM-DD): [変更の要約]

**変更箇所**:
- Line XX: 「[旧]」→「[新]」
- Line YY: 「[旧]」→「[新]」
- 新規セクション追加: 「[セクション名]」
- セクション削除: 「[セクション名]」

**変更理由**:
[なぜこの変更が必要か、どの議論・決定に基づくか]

**議論の背景**:
[人間の意図、動機、温度感を記録]
[「Why」を明確に記述]
[ビジネス上の目的、戦略を含む]

**哲学の進化**:
[以前の思想 → 現在の思想]

**影響範囲**:
[この変更により影響を受ける他のファイル、機能、概念]

**関連**:
- SESSION_YYYYMMDD.md （本日の議論詳細）
- ADR-XXX （技術的根拠）

**Diff** (オプション、大きな変更時のみ):
```diff
- 旧い記述
+ 新しい記述
```
```

### テンプレート使用時の注意点

1. **「議論の背景」は必須**
   - 人間の発言をそのまま引用
   - 動機、意図を明確に記述
   - ビジネス戦略を含める

2. **「哲学の進化」も必須**
   - 単なる変更ではなく、思想の変遷を記述

3. **Diffは大きな変更時のみ**
   - 小さな変更は「変更箇所」で十分

---

## 5. AIがファイル修正を提案する基準【完全版】

### 重要度の判定式

```
重要度 = (人間の哲学・コンセプト + システムの本質) × 影響範囲 × 永続性
```

### 高（必ず提案）

#### 人間の思想・哲学

- **システムの目的・価値観の変更**
  - 例：「効率化」→「人間の承認」
  - 例：「コスト削減」→「顧客価値の最大化」

- **開発方針の根本的変更**
  - 例：「AI単独判断」→「人間が最終判断」
  - 例：「完璧な自動化」→「適度な自動化＋人間の補完」

- **プロジェクトのコンセプト追加**
  - 例：タスク化
  - 例：5次元分析
  - 例：デジタル資産化

- **ビジネス戦略の明確化**
  - 例：「手のかかる客を炙り出して値上げ交渉」
  - 例：「良客・ダメ客の数値化」

#### システムの本質

- **全画面に影響するデータモデル変更**
  - 例：ClientSchemaにfiscalMonth追加
  - 例：usage_logsコレクションの追加

- **永続的なルール**
  - 例：型安全の原則（ADR-001）
  - 例：UI Freeze（ADR-002）

- **アーキテクチャの変更**
  - 例：3層構造の追加
  - 例：ハイブリッドDB構成

### 中（議論の文脈で判断）

- **特定画面のみの仕様**
  - 例：Screen Aのフィールド配置
  - 例：ボタンの文言変更

- **一時的な方針**
  - 例：Week 3の優先事項
  - 例：今月のフォーカス

- **設計の詳細化**
  - 例：既存概念の補足説明
  - 例：具体例の追加

### 低（提案しない）

- **実装の詳細**
  - 例：変数名の変更
  - 例：関数名の統一

- **一時的なメモ、TODOリスト**

- **誤字修正、軽微な表現変更**

### 判断基準の具体例

| 議論内容 | 分類 | 判断理由 |
|---------|------|----------|
| 「AI単独→人間承認に変更」 | **高（哲学）** | システムの目的・価値観の根本変更 |
| 「タスク化の概念を追加」 | **高（コンセプト）** | 新しい開発思想の導入 |
| 「5次元分析で値上げ交渉」 | **高（哲学）** | ビジネス戦略の明確化 |
| 「ClientSchemaにfiscalMonth追加」 | **高（本質）** | 全顧問先に影響するデータモデル変更 |
| 「usage_logsで経営分析」 | **高（哲学）** | ROI可視化という新戦略 |
| 「Screen Aのボタン配置」 | **中** | 特定画面のみ、UIの詳細 |
| 「変数名をclientIdに統一」 | **低** | 実装の詳細 |

---

## 6. 提案テンプレート【最終版】

```markdown
💡 必読ファイル更新の提案

**対象ファイル**: docs/architecture/SYSTEM_PHILOSOPHY.md

**重要度**: 高（人間の哲学/コンセプト）

**修正理由**: 
[詳細な説明]

**議論の背景**:
[人間の動機、意図、ビジネス上の目的]
[発言をそのまま引用]

**修正内容**:
```diff
- 旧い記述
+ 新しい記述
```

**CHANGELOG.mdへの追加**:
```markdown
### vX.Y (YYYY-MM-DD): [変更要約]

**変更箇所**:
- Line XX: ...

**変更理由**:
[詳細な理由]

**議論の背景**:
[Why、動機、哲学、ビジネス戦略]

**哲学の進化**:
[以前の思想 → 現在の思想]

**影響範囲**:
[影響を受けるファイル、機能、概念]

**関連**:
- SESSION_YYYYMMDD.md
- ADR-XXX
```

**承認されますか？**
```

---

## 7. バージョン管理ルール

### バージョン番号の定義

- **メジャー更新（v1→v2）**
  - 根本的な思想・哲学の変更
  - 例：「AI単独」→「人間承認」
  - 例：「効率化」→「ROI最大化」

- **マイナー更新（v1.0→v1.1）**
  - セクション追加
  - 概念の詳細化
  - 例：「5次元分析の追加」

- **パッチ更新（v1.0.0→v1.0.1）**
  - 誤字修正
  - 軽微な表現変更

### archiveへの移動タイミング

- **メジャーバージョンアップ時（v1→v2）**
  - 旧版を`docs/architecture/archive/`へ移動
  - ファイル名：`SYSTEM_PHILOSOPHY_v1.0_YYYYMMDD.md`

- **変更履歴が10件を超えたら**
  - 古い版をarchiveへ移動
  - CHANGELOG.mdは最近3ヶ月分のみ残す

---

## 8. 型安全保護ルール

```markdown
【型安全保護ルール】
人間の指示が以下に該当する場合、AIは警告を出す：

1. Zodスキーマの破壊
   - 必須フィールド（required）の削除
   - 型の変更（string → number等）
   - スキーマ全体の削除

2. UI Freeze違反
   - Freeze宣言後のUIスキーマ変更
   - Mapperの変更（緊急時以外）

3. Import制限違反
   - src/features/ から src/legacy/ への参照
   - src/legacy/ から src/features/ への参照

4. tsconfig設定の緩和
   - strict: true → false
   - noEmitOnError: true → false

5. 型安全マッピング（Lv.2.5）の放棄
   - 手動ハードコード（Lv.1）への逆戻り
   - keyof().enum を使わない実装

警告形式：
「⚠️ 型安全性への影響
この変更により、以下のリスクがあります：
- [具体的なリスク]

代替案：
- [安全な実装方法]

承認されますか？」
```

### 警告の具体例

**ケース1: 必須フィールドの削除**
```markdown
⚠️ 型安全性への影響
ClientSchemaのfiscalMonth（必須フィールド）を削除しようとしています。

リスク：
- 既存のClientデータとの不整合
- 決算期判定ロジックの破壊
- 全顧問先データのマイグレーションが必要

代替案：
- optional()に変更（後方互換性を保つ）
- デフォルト値を設定（例：fiscalMonth: 3）

承認されますか？
```

**ケース2: Lv.1への逆戻り**
```markdown
⚠️ 型安全性への影響
手動で name="total" と記述しようとしています。
これはADR-001で「絶滅危惧種」とされたLv.1（手動ハードコード）です。

リスク：
- タイポによる不整合
- Zodスキーマとの同期が保証されない
- IDEが検知できない

代替案：
- Lv.2.5の鍵リストを使用：
  const Keys = ReceiptSchema.keyof().enum;
  <input :name="Keys.total" />

承認されますか？
```

---

## 9. notify_user使用制限の詳細【強化版】

### 原則

**BlockedOnUser=true は使用しない**

### 理由

#### **1. 人間が次の入力をできなくなる**
- 「まて」「質問がある」等のコメントができない
- 議論の流れを強制的に止める
- 人間の制御を奪う

#### **2. 実際に発生した問題**
- AIが`notify_user(BlockedOnUser=true)`を使用
- 人間が「まて」とコメントしようとしたができなかった
- AIが勝手に動き出し、承認前にファイルを作成

### 例外（極めて限定的）

人間が明示的に以下のように指示した場合**のみ**：
- 「承認フローで進めて」
- 「BlockedOnUserで待って」
- 「承認が必要」

**かつ**、緊急性が高く、即座の承認が必要な場合のみ

### 正しい提案方法

**❌ 間違い**：
```markdown
notify_user(BlockedOnUser=true, ...)
→ 人間が入力できなくなる
```

**✅ 正しい**：
```markdown
通常の返信で：
「💡 提案内容
...
承認されますか？」
→ 人間が自由にコメント・質問できる
```

### AIの自己チェック

提案・報告前に必ず自問：
1. **「BlockedOnUser=trueを使おうとしていないか？」**
2. **「人間が自由にコメントできる状態か？」**
3. **「人間の明示的な指示があったか？」**

→ 1つでもNoなら、通常の返信を使う

---

## 10. セッション議論インデックス（SESSION_INDEX.md）

### 目的

過去のセッション議論を時系列で管理

### 場所

`docs/sessions/SESSION_INDEX.md`

### 内容

- セッション一覧（日付、セッションID、主な議題、ファイルリンク）
- 重要セッションのブックマーク
- セッション別サマリー

### 運用

- **各セッション終了時**、AIがSESSION_INDEX.mdを更新
- 新しいSESSION_YYYYMMDD.mdのリンクを追加
- 主な議題、決定事項を簡潔に記録

### 必読化

- **❌ 必読ファイルには含めない**
- 理由：毎セッション読む必要はない
- 必要に応じて参照（セッション開始プロトコルの「0. オプション」で確認）

---

## 11. よくある質問

### Q1: CHANGELOG.mdが長くなりすぎたら？

**A**: 過去3ヶ月分のみ必読。それ以前は`archive/`へ移動。

### Q2: notify_userは一切使わないのか？

**A**: 原則使わない。例外は人間が「承認フローで進めて」と明示した場合のみ。

### Q3: 必読ファイルが増えすぎたら？

**A**: 古いADRは統合または削除。核心的なファイルのみ残す。

### Q4: AIが提案してこない場合は？

**A**: 人間が「必読ファイルを更新して」と明示的に指示。

---

**以上、粒度を一切落とさない完全版です。**
