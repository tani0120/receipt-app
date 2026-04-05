---
description: コード品質ルール（全タスクで強制適用）。Supabase移行を前提とした設計制約。
---

# 【絶対遵守】コード品質ルール (Code Quality Protocol)

このドキュメントは、過去に発生した技術的負債の再発を防止するための**強制ルール**である。
全てのコード変更タスクにおいて、着手前にこのファイルを読み込み、遵守すること。

---

## 0. 大前提：Supabase移行

本プロジェクトはFirestore → PostgreSQL(Supabase)移行を予定している。
すべての設計判断は**移行後にも壊れない構造**を前提とせよ。
「今はモックだから」「localStorageだから」は設計を崩す理由にならない。

---

## 1. Composableルール（Vue固有）

### 🔴 禁止: computed/watch内でのcomposable呼び出し
```ts
// ❌ 絶対禁止: 再評価のたびに新インスタンスが生成される
const data = computed(() => useAccountSettings('client', id.value))

// ✅ 正解: setupトップレベルで1回だけ呼ぶ
const data = useAccountSettings('client', id.value)
```
**理由**: Vueのリアクティブシステムが破壊され、scheduler flushエラー・メモリリークを引き起こす。

### 🔴 禁止: 呼び出し側でのフォールバック分岐
```ts
// ❌ 絶対禁止: 呼び出し側にフォールバック責任を持たせない
const result = clientData.value
  ? clientSettings.accounts.value
  : masterSettings.accounts.value

// ✅ 正解: composable内部でフォールバックを完結させる
const result = clientSettings.accounts.value  // 内部でマスタフォールバック済み
```
**理由**: フォールバックが散在すると、Supabase移行時に20箇所以上の修正が必要になる。
データソースの切り替えはcomposable内で完結させ、呼び出し側は「1つのデータソース」だけを参照せよ。

---

## 2. データ検索ルール

### 🔴 禁止: nameによる検索
```ts
// ❌ 絶対禁止: 名前は重複・変更の可能性がある
accounts.find(a => a.name === entry.account)

// ✅ 正解: idで検索する
accounts.find(a => a.id === entry.account)
```
**理由**: nameは表示用ラベル。データの一意識別にはidを使え。

---

## 3. デッドコード防止ルール

### 🔴 禁止: 到達不能なフォールバック
```ts
// ❌ 禁止: clientIdはURL由来で必ず存在する。masterフォールバックは到達不能
const settings = clientId.value
  ? useAccountSettings('client', clientId.value)
  : useAccountSettings('master')

// ✅ 正解: エラーガード + 確定呼び出し
if (!clientId.value) throw new Error('[PageName] clientId is required')
const settings = useAccountSettings('client', clientId.value)
```

---

## 4. ルーティングルール

### 🔴 禁止: コンポーネントが受け取らないprops:true
```ts
// ❌ コンポーネントがdefinePropsしていないのにprops:trueを設定
{ path: '/client/xxx/:clientId', component: XxxPage, props: true }

// ✅ useRoute()で取得するなら props:true は不要
{ path: '/client/xxx/:clientId', component: XxxPage }
```

---

## 5. 新規コード追加時のチェックリスト

コードを追加・変更する前に、以下を**必ず**確認せよ：

1. **composableはsetupトップレベルで呼んでいるか？**
2. **フォールバック分岐を呼び出し側に書いていないか？**
3. **データ検索はidベースか？nameで検索していないか？**
4. **同じパターンが既存コードに3箇所以上あるか？** ない場合は設計を疑え。
5. **この変更はSupabase移行後も正しく動くか？**
6. **到達不能な分岐（デッドコード）を書いていないか？**
7. **propsとuseRouteの二重取得をしていないか？**

---

## 6. 過去の失敗事例（教訓）

| 失敗 | 原因 | 修正コスト |
|---|---|---|
| computed内useAccountSettings呼び出し | Vueライフサイクル無視 | JournalListLevel3Mock 25箇所修正 |
| masterSettingsフォールバック散在 | composable設計不備 | 5ファイル修正 |
| name検索によるデータ不整合 | id/name混同 | バリデーション全崩壊 |
| 到達不能ファイル放置 | ルーティング未確認 | ScreenS_AccountSettings 22KB削除 |

**これらの失敗を二度と繰り返すな。**

---

## 7. 🔴 【絶対禁止】ファイル書き換えルール

### 禁止: PowerShell / シェルコマンドによるファイル直接書き換え

```powershell
# ❌ 絶対禁止（文字化け・BOM汚染・エンコード破壊の原因）
(Get-Content 'file.ts' -Raw) -replace 'old', 'new' | Set-Content 'file.ts'
(Get-Content 'file.ts' -Raw) -replace 'old', 'new' | Set-Content 'file.ts' -NoNewline
$content | Out-File 'file.ts'
```

**理由**: PowerShellのSet-Content / Out-Fileは日本語マルチバイト文字を破壊する。2026-04-05に `vendors_global.ts` 全体が文字化けした実害事故が発生した。

### 強制: ファイル書き換えはNode.jsスクリプトを使え

```js
// ✅ 強制: Node.jsスクリプトで必ずUTF-8を明示（scripts/*.cjs に配置）
const fs = require('fs');
const src = fs.readFileSync('file.ts', 'utf8');           // ← 'utf8' 必須
const out = src.replace(/old/g, 'new');
fs.writeFileSync('file.ts', out, { encoding: 'utf8' });   // ← 'utf8' 必須
```

### チェックリスト（ファイル書き換え前に必ず確認）

1. **Node.jsスクリプトを使っているか？** ← PowerShellコマンドで書き換えていれば即中止
2. **`fs.readFileSync` / `fs.writeFileSync` に `'utf8'` を明示しているか？**
3. **書き換え前後に `tsc --noEmit` でエラーなしを確認するか？**
4. **replace対象が複数ファイルに影響する場合、`git status` で影響範囲を事前確認するか？**
5. **git操作前に変更ファイルの一覧を全件ユーザーに報告するか？**

> ⚠️ 上記を1つでも守らなければ、ファイル操作を中止してユーザーに確認を求めよ。
