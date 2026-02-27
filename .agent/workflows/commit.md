---
description: git commit & push手順（セキュリティチェック強制停止付き）
---

# コミット手順（厳守: 漏れ防止）

## Step 1: 全変更をステージング
```
git add .
```
- ファイル名手動列挙は**禁止**

## Step 2: 残りゼロ確認
```
git status --short
```
- **出力がゼロ行**であること
- 1行でもあればStep 1からやり直し

## Step 3: セキュリティチェック（★強制停止ルール）
```
git diff --cached | Out-File -Encoding utf8 .git/diff_output.txt
Select-String -Path .git/diff_output.txt -Pattern "key|secret|token|password|apikey|api_key|supabase_key|service_role|anon_key|project_id|VITE_" -CaseSensitive:$false
```

### ★ 判定ルール（例外なし）

- **出力ゼロ行** → Step 4に進んでよい
- **出力1行以上** → **即座に全停止**。以下のチェックリストを実行:

#### 強制停止チェックリスト

1. [ ] コミット操作を**完全停止**する（Step 4以降に絶対に進まない）
2. [ ] 各マッチ行を**1行ずつ**テーブル形式で人間に報告する
3. [ ] 各行について以下を明記する:
   - ファイル名
   - 行番号
   - マッチした内容（全文）
   - マッチしたキーワード
4. [ ] **AIが「安全」と判断することを禁止する** — 判断は人間のみ
5. [ ] 人間から「問題なし、続行」の明示的承認を得てからStep 4に進む

> **禁止事項**: AIが「これはメソッド名なので安全」等と自己判断してコミットに進むこと。
> findstrが1行でも出力したら、AIに判断権限はない。人間に報告して承認を待て。

## Step 4: コミットメッセージをファイルに書き出し
- `write_to_file`ツールで `.git/COMMIT_MSG.txt` にUTF-8でメッセージを書く
- コメントには作成/修正/削除したファイル、修正内容を**詳細に**記載

## Step 5: コミット
```
git commit -F .git/COMMIT_MSG.txt
```

## Step 6: プッシュ
```
$env:GIT_TERMINAL_PROMPT=0; git push 2>&1
```

## Step 7: プッシュ後再確認
```
git status --short
```
- **出力ゼロ**であること
