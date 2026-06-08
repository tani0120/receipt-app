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
const data = computed(() => useAccountSettings("client", id.value));

// ✅ 正解: setupトップレベルで1回だけ呼ぶ
const data = useAccountSettings("client", id.value);
```

**理由**: Vueのリアクティブシステムが破壊され、scheduler flushエラー・メモリリークを引き起こす。

### 🔴 禁止: 呼び出し側でのフォールバック分岐

```ts
// ❌ 絶対禁止: 呼び出し側にフォールバック責任を持たせない
const result = clientData.value
  ? clientSettings.accounts.value
  : masterSettings.accounts.value;

// ✅ 正解: composable内部でフォールバックを完結させる
const result = clientSettings.accounts.value; // 内部でマスタフォールバック済み
```

**理由**: フォールバックが散在すると、Supabase移行時に20箇所以上の修正が必要になる。
データソースの切り替えはcomposable内で完結させ、呼び出し側は「1つのデータソース」だけを参照せよ。

---

## 2. データ検索ルール

### 🔴 禁止: nameによる検索

```ts
// ❌ 絶対禁止: 名前は重複・変更の可能性がある
accounts.find((a) => a.name === entry.account);

// ✅ 正解: idで検索する
accounts.find((a) => a.id === entry.account);
```

**理由**: nameは表示用ラベル。データの一意識別にはidを使え。

---

## 3. デッドコード防止ルール

### 🔴 禁止: 到達不能なフォールバック

```ts
// ❌ 禁止: clientIdはURL由来で必ず存在する。masterフォールバックは到達不能
const settings = clientId.value
  ? useAccountSettings("client", clientId.value)
  : useAccountSettings("master");

// ✅ 正解: エラーガード + 確定呼び出し
if (!clientId.value) throw new Error("[PageName] clientId is required");
const settings = useAccountSettings("client", clientId.value);
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

| 失敗                                 | 原因                  | 修正コスト                       |
| ------------------------------------ | --------------------- | -------------------------------- |
| computed内useAccountSettings呼び出し | Vueライフサイクル無視 | JournalListLevel3Mock 25箇所修正 |
| masterSettingsフォールバック散在     | composable設計不備    | 5ファイル修正                    |
| name検索によるデータ不整合           | id/name混同           | バリデーション全崩壊             |
| 到達不能ファイル放置                 | ルーティング未確認    | ScreenS_AccountSettings 22KB削除 |

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
const fs = require("fs");
const src = fs.readFileSync("file.ts", "utf8"); // ← 'utf8' 必須
const out = src.replace(/old/g, "new");
fs.writeFileSync("file.ts", out, { encoding: "utf8" }); // ← 'utf8' 必須
```

### チェックリスト（ファイル書き換え前に必ず確認）

1. **Node.jsスクリプトを使っているか？** ← PowerShellコマンドで書き換えていれば即中止
2. **`fs.readFileSync` / `fs.writeFileSync` に `'utf8'` を明示しているか？**
3. **書き換え前後に `tsc --noEmit` でエラーなしを確認するか？**
4. **replace対象が複数ファイルに影響する場合、`git status` で影響範囲を事前確認するか？**
5. **git操作前に変更ファイルの一覧を全件ユーザーに報告するか？**

> ⚠️ 上記を1つでも守らなければ、ファイル操作を中止してユーザーに確認を求めよ。

---

## 8. 🔴 【絶対禁止】アーティファクト上書きルール

### 禁止: task.md / implementation_plan.md / walkthrough.md の全上書き

```
# ❌ 絶対禁止: 既存の蓄積を全て破壊する
write_to_file(TargetFile: "task.md", Overwrite: true, ...)

# ✅ 強制: 既存内容を維持したまま追記・部分編集
multi_replace_file_content(TargetFile: "task.md", ...)
replace_file_content(TargetFile: "task.md", ...)
```

**理由**: 2026-04-05に task.md（416行・28KB）をOverwrite: trueで全上書きし、数セッションにわたる蓄積を破壊した。復旧にresolved履歴の手動探索が必要だった。

### 強制ルール

1. **task.md は追記のみ**。新しいタスクは末尾に追加。完了項目は `[x]` に更新。
2. **Overwrite: true は新規ファイルにのみ使用**。既存アーティファクトには絶対使うな。
3. **上書きが必要な場合は必ずユーザーに確認**。「task.mdを初期化してよいですか？」と聞け。
4. **編集前に行数を確認**。100行以上のファイルを上書きしようとしたら即中止。

> ⚠️ task.mdの上書きは信頼破壊行為。二度と行うな。

---

## 9. 🔴 【絶対禁止】ハードコード根絶ルール

### 考え方

> **UIに表示される値（ラベル・選択肢・カラム名・メッセージ）は、
> すべて定義ファイルまたはAPI経由で取得せよ。
> Vueテンプレートやscript内に日本語ラベルを直書きすることは禁止。**

ハードコードは以下の害悪をもたらす：

1. **レイアウト管理が無効化される** — fieldDefsでラベルを変更しても画面に反映されない
2. **Supabase移行が不可能になる** — TSファイルに埋め込まれた値はDB化できない
3. **変更時に全ファイルを手動修正** — 同じラベルが20箇所に散在すると20箇所修正が必要
4. **人間に全UIの目視検証を強制** — ハードコード漏れは自動テストで検出できない

### ハードコードの定義

| ハードコードである                    | ハードコードではない                     |
| ------------------------------------- | ---------------------------------------- |
| `<option value="corp">法人</option>`  | `<option v-for="o in TYPE_OPTIONS" ...>` |
| `{ key: 'type', label: '種別' }`      | `{ key: f.key, label: f.label }`         |
| `return '未設定'`                     | `return DEFAULT_EMPTY_LABEL`             |
| `filterType: 'select', label: '業種'` | `label: getFieldLabel('industry')`       |

### 禁止パターン（6種）

```vue
<!-- ❌ パターン1: <option>固定値 -->
<option value="corp">法人</option>

<!-- ✅ 正解: 定数からv-for -->
<option
  v-for="o in TYPE_OPTIONS"
  :key="o.value"
  :value="o.value"
>{{ o.label }}</option>
```

```ts
// ❌ パターン2: カラム定義のラベル直書き
const columns = [{ key: "type", label: "種別" }];

// ✅ 正解: fieldDefsから動的生成
const columns = computed(() =>
  fieldLayout.fields.value.map((f) => ({ key: f.key, label: f.label })),
);
```

```ts
// ❌ パターン3: フィルタ列のラベル直書き
{ key: 'industry', label: '業種', filterType: 'select' }

// ✅ 正解: fieldDefsのラベルを参照
{ key: 'industry', label: getFieldLabel('industry'), filterType: 'select' }
```

```ts
// ❌ パターン4: 日本語リテラル
return "未設定";

// ✅ 正解: 定数定義
const DEFAULT_EMPTY_LABEL = "未設定";
return DEFAULT_EMPTY_LABEL;
```

```ts
// ❌ パターン5: 三項演算子で日本語直書き
row.type === "corp" ? "法人" : "個人";

// ✅ 正解: Options定数からgetLabel
getLabel(TYPE_OPTIONS, row.type);
```

```ts
// ❌ パターン6: useFieldLayout()を使ってloadLayout()を呼ばない
const layout = useFieldLayout(fields, sections);
// loadLayout()がない → localStorageのカスタム設定が適用されない

// ✅ 正解: 必ずloadLayout()を呼ぶ
const layout = useFieldLayout(fields, sections);
layout.loadLayout();
```

### 新規コード追加時のチェックリスト

コードを追加する前に以下を**必ず**確認：

1. **UIラベルを直書きしていないか？** → 定義ファイルからインポートせよ
2. **`<option>`タグにv-forを使っているか？** → 固定値は禁止
3. **カラム/フィルタ定義のlabelはfieldDefsから取得しているか？**
4. **三項演算子で日本語を出し分けていないか？** → getLabel()を使え
5. **useFieldLayout使用時にloadLayout()を呼んでいるか？**

### 検出スクリプト

`npm run lint:hardcode`（`scripts/check-hardcode.ts`）を以下のタイミングで実行：

| タイミング         | 実行義務                               |
| ------------------ | -------------------------------------- |
| セッション開始時   | 必須（残存件数確認）                   |
| コミット前         | 必須（増加していないこと確認）         |
| 新規ファイル作成後 | 必須（新規ハードコードがないこと確認） |

**検出件数が前回より増加した場合、コミットを中止し修正せよ。**

---

## 10. 🔴 【必須】破損検証ルール

### 考え方

> **コード変更後の破損確認をブラウザ目視に頼るな。
> 自動化されたチェックを定義されたタイミングで必ず実行せよ。**

### 検証コマンド一覧

| #   | コマンド                         | 確認内容           | 合格基準  |
| --- | -------------------------------- | ------------------ | --------- |
| 1   | `npx vue-tsc --noEmit`           | TypeScript型エラー | エラー0件 |
| 2   | `npx eslint src/ --ext .ts,.vue` | Lintエラー         | エラー0件 |
| 3   | `npx vite build`                 | ビルド可否         | 成功      |
| 4   | `git status --short`             | 一時ファイル残存   | 出力ゼロ  |
| 5   | `npm run lint:hardcode`          | ハードコード残存数 | エラー0件 |

### 実行タイミング（厳守）

| タイミング              | 実行するチェック       | 省略     |
| ----------------------- | ---------------------- | -------- |
| **セッション開始時**    | 1+2+4+5                | **不可** |
| **各ファイル修正後**    | 1                      | 不可     |
| **5ファイル以上変更後** | 1+2+3                  | 不可     |
| **コミット前**          | 1+2+3+4+5              | **不可** |
| **ステップ完了時**      | 1+2+3+4+5+ブラウザ確認 | **不可** |

### 失敗時の対応

- **チェック1〜3が失敗**: 作業を中止し、エラーを修正してから再開
- **チェック4が失敗**: 一時ファイルを削除
- **チェック5が増加**: 新規ハードコードを特定し修正してからコミット
- **修正不可能なエラー**: 人間に必ず報告（隠蔽禁止）

> ⚠️ 「確認しますか？」と人間に聞くな。定義されたタイミングで自動的に実行しろ。
