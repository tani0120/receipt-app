# ADR作成時の更新チェックリスト

**作成日**: 2026-01-22  
**目的**: ADR作成時に更新すべきファイルを漏れなくチェック

---

## 必須更新ファイル（ADR作成時）

### 1. READING_INDEX.md ✅

**場所**: `docs/READING_INDEX.md`

**更新内容**:
```markdown
### Penta-Shield関連ADR

XX. [ADR-0XX: タイトル](file:///...) ✅ 現行
```

**理由**: 必読ファイルマスター。すべてのADRを一覧化。

---

### 2. SYSTEM_PHILOSOPHY.md（該当箇所があれば）

**場所**: `docs/architecture/SYSTEM_PHILOSOPHY.md`

**更新内容**:
- ADRで決定した内容が SYSTEM_PHILOSOPHY に影響する場合のみ
- 例: AI モデル、アーキテクチャ図、システム哲学

**理由**: 現行のシステム哲学ドキュメント。

---

### 3. TASK_MASTER.md

**場所**: `docs/TASK_MASTER.md`

**更新内容**:
```markdown
## 現在進行中

### タスクX: ADR-0XX作成
→ 詳細: [ADR-0XX](file:///...)

**完了内容**:
- ADR-0XX作成（タイトル）
- 作成ファイル: X件
- git commit: xxxxx
```

**理由**: 現在のタスク状況を記録。最終更新日時を確認。

---

### 4. SESSION_YYYYMMDD.md（当日のセッション記録）

**場所**: `docs/sessions/SESSION_YYYYMMDD.md`

**更新内容**:
```markdown
### X. ADR-0XX作成

**タイトル**: タイトル

**内容**:
1. 背景
2. 決定事項
3. 作成したファイル

**所要時間**: 約X時間
```

**理由**: その日のセッション記録。

---

### 5. Brainディレクトリのwalkthrough.md

**場所**: `C:\Users\kazen\.gemini\antigravity\brain\{conversation-id}\walkthrough.md`

**更新内容**:
- 作成したADRの概要
- 背景、決定事項、成果物

**理由**: セッションの成果物を記録。

---

## 条件付き更新ファイル

### 6. UNRESOLVED_DISCUSSIONS.md（議論を解決した場合）

**場所**: `docs/sessions/UNRESOLVED_DISCUSSIONS.md`

**更新タイミング**: ADRが未解決議論を解決した場合のみ

**更新内容**:
```markdown
## #X: 議論タイトル

**ステータス**: ✅ 解決済み（2026-XX-XX）

**解決方法**: ADR-0XXで決定
```

---

### 7. 既存ADR（Supersede する場合）

**場所**: `docs/architecture/ADR-XXX.md`

**更新タイミング**: 既存ADRを廃止する場合のみ

**更新内容**:
```markdown
**Status**: Superseded by ADR-0XX  
**Date**: 2026-XX-XX (Superseded)
```

---

### 8. Brainディレクトリのtask.md（タスク完了の場合）

**場所**: `C:\Users\kazen\.gemini\antigravity\brain\{conversation-id}\task.md`

**更新タイミング**: ADR作成がタスクの一部の場合

**更新内容**:
```markdown
- [x] ADR-0XX作成（完了）
```

---

## チェックリスト（ADR作成時に実施）

### 作成中

- [ ] **grep検索実施**（関連キーワードで既存情報確認）
- [ ] **UseCase、Decision Log確認**
- [ ] **既存ADRとの矛盾チェック**
- [ ] **SYSTEM_PHILOSOPHY.md確認**

### 作成直後

- [x] **ADR-XXX.md作成**
- [ ] **READING_INDEX.md更新**
- [ ] **SYSTEM_PHILOSOPHY.md更新**（該当箇所があれば）
- [ ] **TASK_MASTER.md更新**
- [ ] **SESSION_YYYYMMDD.md更新**
- [ ] **walkthrough.md更新**
- [ ] **UNRESOLVED_DISCUSSIONS.md更新**（議論解決の場合）
- [ ] **既存ADR Status更新**（Supersede の場合）
- [ ] **task.md更新**（タスク完了の場合）

### セッション終了時

- [ ] **git add .**
- [ ] **git commit -m "..."**
- [ ] **git push**

---

## 失敗事例（ADR-010）

### 更新したファイル

1. ✅ READING_INDEX.md
2. ✅ SYSTEM_PHILOSOPHY.md
3. ✅ walkthrough.md

### ❌ 更新忘れたファイル

1. ❌ **TASK_MASTER.md** - 最終更新2026-01-17（古い）
2. ❌ **SESSION_20260122.md** - ADR-010の記載なし

### 根本原因

- ✅ **チェックリストがなかった**
- ✅ **手順が不明確だった**
- ✅ **セッション終了時の確認プロセスがなかった**

---

## 運用ルール

### ルール1: チェックリストの活用

**手順**:
1. ADR作成前に本チェックリストを開く
2. ADR作成中・作成後にチェックボックスを確認
3. すべてチェック完了してからセッション終了

---

### ルール2: TASK_MASTER.mdの最終更新日時確認

**手順**:
1. TASK_MASTER.mdを開く
2. **最終更新**: 2026-XX-XX を確認
3. 今日の日付と異なれば、**更新必須**

---

### ルール3: SESSION_YYYYMMDD.mdの内容確認

**手順**:
1. 当日のSESSION_YYYYMMDD.mdを開く
2. 今日作成したADRの記載があるか確認
3. なければ、**追記必須**

---

### ルール4: セッション終了時のダブルチェック

**手順**:
1. grep検索で今日作成したADR番号（例: ADR-010）を検索
2. 以下のファイルにヒットするか確認:
   - READING_INDEX.md
   - SYSTEM_PHILOSOPHY.md（該当箇所があれば）
   - TASK_MASTER.md
   - SESSION_YYYYMMDD.md
   - walkthrough.md
3. ヒットしないファイルがあれば、**更新漏れ**

---

## 今後の改善

### 提案1: session-management-protocol-complete.mdへの追記

**内容**: 「ADR作成時の更新チェックリスト」を追加

**場所**: `docs/sessions/session-management-protocol-complete.md`

---

### 提案2: TASK_MASTER.mdの自動更新

**内容**: セッション終了時に自動的にTASK_MASTER.mdを更新

**実装**: セッション終了プロトコルに組み込み

---

### 提案3: 更新忘れ検知スクリプト

**内容**: git commitフックで更新漏れを検知

**実装方法**:
```bash
# .git/hooks/pre-commit
if git diff --cached --name-only | grep -q "ADR-"; then
  echo "ADR更新を検知。チェックリストを確認してください。"
fi
```

---

## まとめ

**ADR作成時に必ず更新すべきファイル（5ファイル）**:
1. ✅ READING_INDEX.md
2. ✅ SYSTEM_PHILOSOPHY.md（該当箇所があれば）
3. ✅ TASK_MASTER.md
4. ✅ SESSION_YYYYMMDD.md
5. ✅ walkthrough.md

**条件付き更新（3ファイル）**:
6. UNRESOLVED_DISCUSSIONS.md（議論解決の場合）
7. 既存ADR（Supersede の場合）
8. task.md（タスク完了の場合）

**運用ルール**: チェックリストの活用、最終更新日時確認、セッション終了時のダブルチェック
