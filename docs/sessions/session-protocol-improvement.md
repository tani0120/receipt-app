# セッション管理プロトコル改善提案

**作成日**: 2026-01-21  
**目的**: セッション開始・終了時の更新対象ファイルを明確化し、ブレを防止する

---

## 現状分析

### セッション開始プロトコル（現状）

**session-management-protocol-complete.md 14-41行目の定義**:

```markdown
1. 必須ファイルを読む
   - READING_INDEX.md
   - TASK_MASTER.md
   - session-management-protocol-complete.md
   - SYSTEM_PHILOSOPHY.md (存在する場合)
   - CHANGELOG_SYSTEM_PHILOSOPHY.md (存在する場合)
   - ADR-004, ADR-005, ADR-006

2. 理解度を自己チェック

3. 結果を報告
```

#### 問題点

| 問題 | 症状 |
|------|------|
| **実施されていない** | 今回のセッションでSYSTEM_PHILOSOPHY.mdを読まずに作業開始 |
| **優先順位が不明確** | どのファイルを最初に読むべきか不明 |
| **チェック漏れ** | 「存在する場合」という条件で読み飛ばしてしまう |

#### 根本原因

1. **強制力がない**: 「必須」と書かれているが、実際には実施しなくても作業開始できる
2. **報告形式が曖昧**: 理解度チェック結果を報告する義務があるが、省略されることがある
3. **ファイル数が多い**: 8ファイルを読むのは負担が大きい

---

### セッション終了プロトコル（現状）

**session-management-protocol-complete.md 110-143行目の定義**:

```markdown
セッション終了時:
1. task.md更新
2. walkthrough.md作成または更新
3. SESSION_YYYYMMDD.md作成（必要に応じて）
4. session-management-protocol-complete.md更新（プロトコル変更時）
```

#### 問題点

| 問題 | 症状 |
|------|------|
| **ブレがある** | あるセッションでは2ファイル、別のセッションでは4ファイル更新 |
| **判断基準が曖昧** | 「必要に応じて」の判断がAIに委ねられている |
| **TASK_MASTER.mdの扱いが不明** | いつ更新すべきか定義されていない |

#### 根本原因

1. **条件が主観的**: 「必要に応じて」「プロトコル変更時」という曖昧な基準
2. **チェックリストがない**: 何を確認すべきか明確でない
3. **brain/ vs docs/の使い分けが不明確**: task.md（brain/）とTASK_MASTER.md（docs/）の関係が不明

---

## 改善案

### 【改善案A】最小セット + 段階的拡張

#### セッション開始

**レベル1（必須・1分以内）**:
1. **SYSTEM_PHILOSOPHY.md** - アーキテクチャ理解（最優先）
2. **TASK_MASTER.md** - 現在のタスク確認

**レベル2（推奨・必要に応じて）**:
3. READING_INDEX.md - 参照先確認
4. session-management-protocol-complete.md - プロトコル確認

**レベル3（特定ケースのみ）**:
5. ADR-004/005/006 - Penta-Shield関連作業時のみ
6. SESSION_YYYYMMDD.md - 前回セッションの続きの場合のみ

**報告形式（簡略化）**:
```
【セッション開始確認】
✅ SYSTEM_PHILOSOPHY.md読了: アーキテクチャ理解OK
✅ TASK_MASTER.md読了: 現在Phase X、次タスクはY
```

#### セッション終了

**必須（すべてのセッション）**:
1. ✅ `brain/task.md` - 今回のセッションのタスク状況
2. ✅ `brain/walkthrough.md` - 今回のセッションの成果

**条件付き（明確な基準）**:
| ファイル | 更新条件 | 判断方法 |
|---------|---------|---------|
| **TASK_MASTER.md** | Phaseが完了した | task.mdに「Phase X完了」と記載された |
| **session-management-protocol-complete.md** | プロトコルに関する議論があった | 「プロトコル」「セッション管理」というキーワードで議論 |
| **SYSTEM_PHILOSOPHY.md** | アーキテクチャを変更した | ADR作成レベルの設計変更 |
| **SESSION_YYYYMMDD.md** | 重要な意思決定があった | ADR作成、大きな方針転換 |

**チェックリスト形式**:
```
【セッション終了チェックリスト】
必須:
- [x] brain/task.md更新
- [x] brain/walkthrough.md作成

条件付き:
- [ ] TASK_MASTER.md更新 - Phase完了？ → No
- [x] session-management-protocol-complete.md更新 - プロトコル議論？ → Yes (Firebase設定プロトコル追加)
- [ ] SYSTEM_PHILOSOPHY.md更新 - アーキテクチャ変更？ → No
- [ ] SESSION_YYYYMMDD.md作成 - 重要意思決定？ → No
```

#### メリット

- ✅ 最小限のファイル数で開始できる（2ファイル）
- ✅ 判断基準が明確
- ✅ チェックリスト形式で漏れ防止

#### デメリット

- ⚠️ レベル2以降を読まないと全体像が把握できない可能性

---

### 【改善案B】完全チェックリスト方式

#### セッション開始

**すべて必須（例外なし）**:
1. READING_INDEX.md
2. TASK_MASTER.md
3. SYSTEM_PHILOSOPHY.md
4. CHANGELOG_SYSTEM_PHILOSOPHY.md
5. session-management-protocol-complete.md
6. ADR-004
7. ADR-005
8. ADR-006

**報告形式（詳細）**:
```
【セッション開始確認】
読了ファイル:
✅ READING_INDEX.md
✅ TASK_MASTER.md
✅ SYSTEM_PHILOSOPHY.md
✅ CHANGELOG_SYSTEM_PHILOSOPHY.md
✅ session-management-protocol-complete.md
✅ ADR-004
✅ ADR-005
✅ ADR-006

理解度チェック:
Q: システムの本質は？
A: [回答]

Q: 現在のフェーズは？
A: [回答]
```

#### セッション終了

**すべて必須（例外なし）**:
1. brain/task.md
2. brain/walkthrough.md
3. TASK_MASTER.md - 常に最新状態を反映
4. session-management-protocol-complete.md - 今回のセッション記録を追記
5. SESSION_YYYYMMDD.md - 常に作成

#### メリット

- ✅ 完全な記録として残る
- ✅ 例外処理がない（シンプル）

#### デメリット

- ❌ 毎回8ファイルを読む必要がある（時間がかかる）
- ❌ すべてのセッションで5ファイルを更新（冗長）

---

### 【改善案C】ハイブリッド方式

#### セッション開始

**Tier 1（必須・3ファイル）**:
1. **SYSTEM_PHILOSOPHY.md**
2. **TASK_MASTER.md**
3. **READING_INDEX.md** - 他のファイルへのポインタとして

**Tier 2（継続セッションのみ）**:
4. SESSION_YYYYMMDD.md（前回の続きの場合）

**Tier 3（タスク依存）**:
5. ADR-XXX（実施タスクに関連するADRのみ）

**報告形式（中間）**:
```
【セッション開始確認】
Tier 1 (必須):
✅ SYSTEM_PHILOSOPHY.md: アーキテクチャ = Vue.js + Firestore直接 + GAS(ファイル移動+AI解析)
✅ TASK_MASTER.md: Phase 3-A準備完了、次はUIモック
✅ READING_INDEX.md: 参照先確認

Tier 2:
- SESSION_20260120.md: 読まない（新規議題）

Tier 3:
- ADR-007: 読まない（今回は関係なし）
```

#### セッション終了

**Tier 1（必須）**:
1. brain/task.md
2. brain/walkthrough.md

**Tier 2（自動判定）**:
```python
if "Phase" in task.md and "完了" in task.md:
    update TASK_MASTER.md
    
if "プロトコル" in discussion or "セッション管理" in discussion:
    update session-management-protocol-complete.md
    
if "ADR" in created_files or "アーキテクチャ" in discussion:
    update SYSTEM_PHILOSOPHY.md
    
if "ADR" in created_files or 重要意思決定 == True:
    create SESSION_YYYYMMDD.md
```

**チェックリスト形式（自動生成）**:
```
【セッション終了チェックリスト】
Tier 1 (必須):
- [x] brain/task.md
- [x] brain/walkthrough.md

Tier 2 (自動判定):
- [ ] TASK_MASTER.md - Phase完了検知: No
- [x] session-management-protocol-complete.md - プロトコル議論検知: Yes
- [ ] SYSTEM_PHILOSOPHY.md - アーキテクチャ変更検知: No
- [ ] SESSION_YYYYMMDD.md - ADR作成検知: No
```

#### メリット

- ✅ 最小限のファイル数（3ファイル）
- ✅ 自動判定でブレ防止
- ✅ 柔軟性あり

#### デメリット

- ⚠️ 自動判定ロジックが複雑
- ⚠️ 誤判定のリスク

---

## 推奨案：改善案A（最小セット + 段階的拡張）

### 理由

1. **実現可能性が高い**: 2ファイルの必読なら確実に実施できる
2. **判断基準が明確**: チェックリスト形式で漏れ防止
3. **段階的**: 必要に応じて追加ファイルを読める

### 今回のセッションでの適用例

#### セッション開始（改善案A適用時）

**レベル1（必須）**:
✅ SYSTEM_PHILOSOPHY.md読了 → アーキテクチャ理解：Vue.js + Firestore直接 + GAS
✅ TASK_MASTER.md読了 → Phase 3-A準備完了、次はFirebase設定

**レベル2**:
❌ 読まなかった → **今回の混乱の原因**

#### セッション終了（改善案A適用時）

**必須**:
- [x] brain/task.md更新
- [x] brain/walkthrough.md作成

**条件付き**:
- [ ] TASK_MASTER.md - Phase完了？ → No
- [x] session-management-protocol-complete.md - プロトコル議論？ → Yes（Firebase設定完了を追記）
- [ ] SYSTEM_PHILOSOPHY.md - アーキテクチャ変更？ → No
- [ ] SESSION_YYYYMMDD.md - 重要意思決定？ → No

---

## 次のアクション

1. **session-management-protocol-complete.mdを改善案Aで更新**
2. **次回セッションから適用**
3. **数セッション運用して効果を検証**

---

**この提案を承認しますか？**
