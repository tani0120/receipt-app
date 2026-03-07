# エンティティID定義

**制定日**: 2026-03-07
**ステータス**: 確定（Phase A）

---

## ID一覧

| エンティティ | 日本語 | ID形式 | URLパラメータ名 | 例 |
|------------|--------|--------|---------------|-----|
| 顧問先 | 顧問先 | `{3コード}-{UUID}` | `:clientId` | `ABC-a1b2c3d4-e5f6-...` |
| スタッフ | 担当者 | UUID | `:staffId` | `f8e7d6c5-b4a3-...` |
| 証票 | 証票（ドキュメント） | UUID | `:documentId` | `d6123ee8-2d5d-...` |
| 証票行 | 証票明細行 | UUID | `:lineId` | `c5dae3d8-1c4c-...` |
| 仕訳 | 仕訳 | UUID | `:journalId` | `a3b8d1b6-0b3b-...` |
| ジョブ | 処理ジョブ | UUID | `:jobId` | `b4c9e2c7-1c4c-...` |

---

## 顧問先IDの特殊ルール

```
client_id = {3コード}-{UUID}
例: ABC-a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

| 層 | フィールド | 例 | 用途 |
|---|-----------|-----|------|
| 内部処理（DB・API） | `uuid` | `a1b2c3d4-e5f6-7890-...` | Phase BでDB primary key |
| URL | `id` | `ABC-a1b2c3d4-e5f6-7890-...` | ブックマーク、URL共有 |
| UI表示 | `clientCode` | `ABC` | 一覧・ラベル表示 |

- ID生成タイミング: 顧問先作成時に1度だけ
- clientCode変更時: **IDは変えない**（先頭3文字と現行コードが不一致になるが許容）
- ヘルパー関数: `createClientId(code)` → `{ id, uuid }` / `parseClientId(id)` → `{ clientCode, uuid }`

---

## 証票の2階層構造

```
documents（証票）
  └ document_lines（証票行）
       └ journals（仕訳）
```

| テーブル | ID | 親 | 例 |
|---------|-----|-----|-----|
| documents | document_id (UUID) | client_id | 通帳PDF 1冊 = 1 document |
| document_lines | line_id (UUID) | document_id | 通帳の各行 = 1 line |
| journals | journal_id (UUID) | line_id | 各行に対する仕訳 |

### 関係

- `document_lines` → `journals`: 1対1（基本）、1対N（分割仕訳）
- `documents` → `document_lines`: 1対N
- 領収書の場合: document_lines = 1行のみ

---

## ジョブとの関係

```
jobs（作業単位）
  └ job_documents（中間テーブル）
       └ documents
```

ジョブは作業単位であり、証票を所有しない。中間テーブルで関連付ける。

---

## URL構造

```
# マスタ管理
/master/clients                          ← 顧問先一覧管理
/master/accounts                         ← 勘定科目マスタ
/master/tax-categories                   ← 税区分マスタ

# 顧問先個別
/clients/:clientId/settings              ← 設定
/clients/:clientId/journals              ← 仕訳一覧
/clients/:clientId/journals/:journalId   ← 個別仕訳
/clients/:clientId/jobs/:jobId           ← ジョブ詳細
/clients/:clientId/documents/:documentId ← 証票詳細
/clients/:clientId/collection            ← 回収状況
/clients/:clientId/ai-rules              ← AI学習ルール
/clients/:clientId/data-conversion       ← データ変換
/clients/:clientId/tasks                 ← タスク管理

# スタッフ
/staff/:staffId/...                      ← スタッフ管理（将来）

# 全体設定
/settings/admin                          ← 管理者設定
```

---

## 旧パス互換リダイレクト（Phase Bで削除）

旧レイアウト（`App.vue`、`AaaLayout.vue` 等）からの参照を維持するため、
暂定 clientId `demo` 経由で新URLにリダイレクト。

| 旧パス | リダイレクト先 |
|--------|------------------|
| `/journal-status` | `/clients/demo/journals` |
| `/collection-status` | `/clients/demo/collection` |
| `/ai-rules` | `/clients/demo/ai-rules` |
| `/data-conversion` | `/clients/demo/data-conversion` |
| `/task-dashboard` | `/clients/demo/tasks` |
| `/admin-settings` | `/settings/admin` |
| `/settings` | `/clients/demo/settings` |
| `/journal-list` | `/clients/demo/journals` |
| `/receipts/:id` | `/clients/demo/documents/:id` |
| `/clients` | `/master/clients` |
| `/master` | `/master/accounts` |
