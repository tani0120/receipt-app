---
description: 作業完了判定チェックリスト（全タスク完了前に強制適用）。設計・型・依存・移行性を確認し、過去の失敗パターンを再発させない。
---

# 【強制】作業完了判定チェックリスト

> **「作業完了」と判断する前に、このチェックリストを全項目確認せよ。**
> 過去に発生した失敗パターン（型決め打ち・import漏れ・source設計忘れ・検証計画なし等）は、
> ほぼ全てこのチェックリストで事前検出できる。

---

## 1. 設計整合性

### □ ドメインキーを破壊していないか

```ts
// ❌ 禁止: nameで保存
entry.account = accountName   // 名前で保存
entry.tax_category_id = taxName  // 名前で保存

// ✅ 許可: IDで保存
entry.account = accountId         // IDで保存
entry.tax_category_id = taxCategoryId  // IDで保存
```

### □ name検索で問題を隠していないか

```ts
// ❌ 禁止: 本来 accountId を使うべき箇所をname検索で回避
accounts.find(a => a.name === entry.account)

// ✅ 正解: IDで検索
accounts.find(a => a.accountId === entry.account)
```

### □ 一時対応が永続設計になっていないか

```ts
// ❌ 危険: as でエラーを消しただけ
const j = parsed as JournalPhase5Mock  // 本当にそうか？

// ✅ 正解: 型ガードで判別
if (assertEditableJournal(parsed)) { /* JournalPhase5Mock確定 */ }
```

---

## 2. 型チェック

### □ anyを消した場合、その型は本当に入るデータ全体を表現しているか

```ts
// ❌ 失敗例: any → 単一型に決め打ち
// 実際は JournalPhase5Mock | NormalizedConfirmedJournal だった
const journals: JournalPhase5Mock[] = ...

// ✅ 正解: 判別共用体で全パターンを表現
const journals: UiJournal[] = ...
// UiJournal = JournalPhase5Mock | NormalizedConfirmedJournal
```

### □ 判別共用体を使うべき箇所で単一型にしていないか

```ts
// ❌ 悪い例: 取込仕訳を無視
journals: JournalPhase5Mock[]

// ✅ 良い例: 全パターンを包含
journals: UiJournal[]
```

### □ 型ガードで解決できるのに as を増やしていないか

先に以下で解決できないか確認：
- `isImportedJournal(j)` — 取込仕訳判定
- `assertEditableJournal(j)` — 編集可能仕訳の型ナロウイング

### □ as を追加した場合、理由を説明できるか

```
✅ 許可される as の理由:
  - JSON.parse 後（境界データ）
  - DOM API 戻り値
  - ライブラリの型定義不足

❌ 禁止される as の理由:
  - 「型が通らなかったから」
  - 「とりあえず動かすため」
```

---

## 3. Repositoryルール

### □ 新規fetchを書いていないか

```ts
// ❌ 禁止: 直接fetch追加
const res = await fetch('/api/xxx')

// ✅ 正解: Repository経由
const data = await repos.xxx.method()
```

### □ 対応するrepositoryが存在するか

```
確認: repos.xxx.method() が定義されているか
```

### □ mock実装も存在するか

```
確認:
  repository.http.ts   ← HTTP版
  repository.mock.ts   ← モック版
両方存在すること
```

### □ URL/HTTP Method一致確認したか

```
元のAPI:  POST /api/journal
Repo:     POST /api/journal
→ 一致確認
```

---

## 4. UI責務

### □ フロントが永続化していないか

```ts
// ❌ 禁止: フロントから直接ファイル/DB操作
writeFileSync(...)
save()
```

### □ 更新経路が1つか

```
理想の経路（1本道）:
  UI → Repository → API → Store → Persistence
```

### □ shallowRefだけ変更していないか

```ts
// ❌ 事故パターン: journals変更 → localJournals未変更
journals.value[idx] = updated  // ← localJournalsは古いまま

// ✅ 確認: 関連する全Refを更新しているか
```

### □ 表示用データと保存用データを混同していないか

```
確認: 以下のどれを更新しているか明確にせよ
  - journals（編集用）
  - localJournals（表示用キャッシュ）
  - confirmedJournals（取込仕訳、読み取り専用）
```

---

## 5. Imported Journal ガード

### □ `_isPastJournal` を追加していないか

```
❌ 新規追加禁止（レガシーフラグ）
```

### □ source判定を使っているか

```ts
// ✅ 推奨: 判別共用体の型ガード
isImportedJournal(j)
```

### □ 書き込み系は `assertEditableJournal` を通るか

```
確認対象:
  - updateJournalField()
  - trashJournal()
  - bulk操作（一括ステータス変更等）
```

### □ 最終防御が存在するか

```ts
// 理想: updateJournalField() 内部で assertEditableJournal() が呼ばれること
function updateJournalField(journalId, patch) {
  const j = journals.value.find(...)
  if (!assertEditableJournal(j)) return  // ← 最終防御
  ...
}
```

---

## 6. Composable抽出

### □ テンプレートは変えていないか

```
目的: スクリプト分離であって、UI再設計ではない
テンプレートの変更はゼロであるべき
```

### □ composableがUI状態を持ちすぎていないか

```
確認: props地獄・emit地獄になっていないか
```

### □ import整理したか

```
確認:
  - unused import がないか
  - composableに移動した関数のimportが親に残っていないか
  - composableが必要とするimportが漏れていないか
```

### □ 戻り値型が実態と一致しているか

```ts
// ❌ 失敗例: composableの型定義が実際のuseAccountSettingsと不一致
filteredTaxCategories: (direction: string, ...) => ...
// 実際は direction: 'sales' | 'purchase' | 'common'

// ✅ 正解: 実際の型に一致させる
filteredTaxCategories: (direction: 'sales' | 'purchase' | 'common', ...) => ...
```

---

## 7. Supabase移行耐性

### □ 「今は動く」が移行後も成立するか

```
確認: JSON → DB になっても壊れないか
```

### □ SSOTが1つか

```
❌ 禁止: ファイル＋インメモリ の二重管理
✅ 正解: 単一のデータソース
```

### □ API経由で完結するか

```
理想の経路:
  バッチ → API → Repository → Store
```

---

## 8. 最終確認（リリース前）

### 必須コマンド

```bash
# 型チェック（必須）
npx vue-tsc --noEmit

# ビルド（必須）
npx vite build
```

### 実画面確認

変更した画面を実際に開き、以下を確認：

- [ ] 表示
- [ ] 編集
- [ ] 保存
- [ ] 検索
- [ ] ソート
- [ ] Undo/Redo
- [ ] モーダル

---

## 完了判定

> **以下を全て満たしたら「作業完了」と判断してよい。1つでも欠けていれば未完了。**

| # | 条件 | 確認 |
|---|---|---|
| 1 | 出口条件を満たした | □ |
| 2 | ドメインキー（accountId等）を破壊していない | □ |
| 3 | 新規fetchなし | □ |
| 4 | 新規anyなし | □ |
| 5 | 不要なasなし | □ |
| 6 | source判定（isImportedJournal）へ統一 | □ |
| 7 | vue-tsc通過 | □ |
| 8 | build通過 | □ |
| 9 | 実画面確認済み | □ |
| 10 | Supabase移行後も成立 | □ |
