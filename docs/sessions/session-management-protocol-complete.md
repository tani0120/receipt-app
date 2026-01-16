# セッション管理プロトコル【完全版】

**作成日**: 2026-01-15  
**最終更新**: 2026-01-17  
**ステータス**: Active  
**関連ファイル**: PROJECT_INDEX.md, READING_INDEX.md, task.md, SESSION_INDEX.md

**策定日**: 2026-01-16  
**Version**: 1.0  
**目的**: セッション間での知識継続性の確保、AIの忘却防止、哲学・動機の保持

---

## 1. セッション開始プロトコル

```markdown
【セッション開始プロトコル】
会話の最初のターンで、必ず以下を実行すること：

0. （オプション）前回セッションの確認
   - [SESSION_INDEX.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_INDEX.md) を見て、前回のセッションを確認
   - 続きがある場合のみ、該当の SESSION_YYYYMMDD.md を読む
   - 新しい議題の場合は読まなくてよい

1. 必須ファイルを読む
   - [SYSTEM_PHILOSOPHY.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/SYSTEM_PHILOSOPHY.md) （システムの本質・哲学・最新版）
   - [CHANGELOG_SYSTEM_PHILOSOPHY.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/CHANGELOG_SYSTEM_PHILOSOPHY.md) （過去3ヶ月分の変更履歴）
   - [archive/](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/archive/) （過去の変更履歴アーカイブ、参照時のみ）
   - [ADR-001-type-safe-mapping.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-001-type-safe-mapping.md) （型安全戦略）
   - [ADR-002-gradual-ui-implementation.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-002-gradual-ui-implementation.md) （段階的UI実装）
   - [ADR-003-file-organization-strategy.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-003-file-organization-strategy.md) （ファイル整理戦略）
   - [task.md](file:///C:/Users/kazen/.gemini/antigravity/brain/129dd3c2-bc83-48ac-91da-9736f587788a/task.md) （現在のタスク）
   - [session-management-protocol-complete.md](file:///C:/Users/kazen/.gemini/antigravity/brain/129dd3c2-bc83-48ac-91da-9736f587788a/session-management-protocol-complete.md) （本プロトコル）

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
   1. [SYSTEM_PHILOSOPHY.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/SYSTEM_PHILOSOPHY.md)
   2. [CHANGELOG_SYSTEM_PHILOSOPHY.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/CHANGELOG_SYSTEM_PHILOSOPHY.md)
   3. [ADR-001-type-safe-mapping.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-001-type-safe-mapping.md)
   4. [ADR-002-gradual-ui-implementation.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-002-gradual-ui-implementation.md)
   5. [ADR-003-file-organization-strategy.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-003-file-organization-strategy.md)
   6. [CANONICAL_SOURCES.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/CANONICAL_SOURCES.md)
   7. [task.md](file:///C:/Users/kazen/.gemini/antigravity/brain/129dd3c2-bc83-48ac-91da-9736f587788a/task.md)
   8. [session-management-protocol-complete.md](file:///C:/Users/kazen/.gemini/antigravity/brain/129dd3c2-bc83-48ac-91da-9736f587788a/session-management-protocol-complete.md)
   
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

## 2. セッション終了プロトコル

**最終更新**: 2026-01-17

### 必須作業（完全チェックリスト）

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
