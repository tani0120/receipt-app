# エンティティID定義

**制定日**: 2026-03-07
**ステータス**: 確定（Phase A）

---

## ID一覧

| エンティティ | 日本語 | ID形式 | URLパラメータ名 | 例 |
|------------|--------|--------|---------------|-----|
| 顧問先 | 顧問先 | `{3コード}-{5桁連番}` | `:clientId` | `ABC-00001` |
| スタッフ | 担当者 | `staff-{4桁連番}` | `:staffId` | `staff-0001` |
| 証票 | 証票（ドキュメント） | `doc-{8桁連番}` | `:documentId` | `doc-00000001` |
| 証票行 | 証票明細行 | `{親doc ID}-line-{3桁連番}` | `:lineId` | `doc-00000001-line-003` |
| 仕訳 | 仕訳 | `jrn-{8桁連番}` | `:journalId` | `jrn-00000001` |
| ジョブ | 処理ジョブ | `job-{8桁連番}` | `:jobId` | `job-00000001` |

---

## 顧問先IDの構造

```
client_id = {3コード}-{5桁連番}
例: ABC-00001
```

| 層 | フィールド | 例 | 用途 |
|---|-----------|-----|------|
| 内部処理（DB・API） | `clientId` | `ABC-00001` | DB primary key |
| URL | `clientId` | `ABC-00001` | ブックマーク、URL共有 |
| UI表示 | `threeCode` | `ABC` | 一覧・ラベル表示 |

- ID生成タイミング: 顧問先作成時に1度だけ
- clientCode変更時: **IDは変えない**（先頭3文字と現行コードが不一致になるが許容）
- ヘルパー関数: `createClientId(code)` → `{ clientId, threeCode }`

---

## 証票の2階層構造

```
documents（証票）
  └ document_lines（証票行）
       └ journals（仕訳）
```

| テーブル | ID | 親 | 例 |
|---------|-----|-----|-----|
| documents | doc-{8桁連番} | client_id | 通帳PDF 1冊 = 1 document |
| document_lines | {親doc ID}-line-{3桁連番} | document_id | 通帳の各行 = 1 line |
| journals | jrn-{8桁連番} | line_id | 各行に対する仕訳 |

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

## URL構造（2026-03-11 N1適用済み）

```
# 上段バー（管理ページ）
/progress/:code?                        ← 進捗管理
/master/clients                          ← 顧問先管理
/master/staff                            ← スタッフ管理
/master/accounts                         ← 勘定科目マスタ
/master/tax                              ← 税区分マスタ（旧 /master/tax-categories）
/master/costs                            ← 想定費用（未実装）
/master/settings                         ← 設定管理（未実装）

# 顧問先個別（個別CLページURL体系 — 確定後に変更予定）
/clients/:clientId/settings              ← 設定（新UI）
# 以下は /mock/ 配下に残存（個別CLページURL確定後に /:clientId/ 形式に変更）
/mock/journal-list                       ← 仕訳一覧
/mock/export                             ← 出力
/mock/drive-select                       ← Drive資料選別

# 旧ページ（/old/ 配下。Phase B完了後に一括削除）
/old/journals/:clientId                  ← 旧Screen B 仕訳ステータス
/old/collection/:clientId                ← 旧Screen C 回収状況
/old/ai-rules/:clientId                  ← 旧Screen D AIルール
/old/journal-entry/:jobId                ← 旧Screen E 仕訳入力
/old/data-conversion/:clientId           ← 旧Screen G データ変換
/old/tasks/:clientId                     ← 旧Screen H タスク管理
/old/admin                               ← 旧Screen Z 管理者設定
/old/settings-accounts                   ← 旧Screen S 顧問先別設定
/old/documents/:clientId/:documentId     ← 旧 証票詳細
```

---

## 旧パス互換リダイレクト（Phase Bで削除）

旧レイアウト（`App.vue`、`AaaLayout.vue` 等）からの参照を維持するため、
暫定 clientId `demo` 経由で `/old/` 配下にリダイレクト。

| 旧パス | リダイレクト先 |
|--------|------------------|
| `/journal-status` | `/old/journals/demo` |
| `/collection-status` | `/old/collection/demo` |
| `/ai-rules` | `/old/ai-rules/demo` |
| `/data-conversion` | `/old/data-conversion/demo` |
| `/task-dashboard` | `/old/tasks/demo` |
| `/admin-settings` | `/old/admin` |
| `/settings` | `/clients/demo/settings`（新UIのため`/old/`にしない） |
| `/journal-list` | `/old/journals/demo` |
| `/receipts/:id` | `/old/documents/demo/:id` |
| `/clients` | `/master/clients` |
| `/master` | `/master/accounts`（ハブ廃止） |
| `/master/tax-categories` | `/master/tax`（短縮） |
| `/clients/list` | `/master/clients` |
