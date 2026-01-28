# Gemini APIキーの削除と再生成手順

**実施日**: 2026-01-24  
**対象キー**: `***REMOVED***`  
**プロジェクト**: `gen-lang-client-0837543731`  
**理由**: Git履歴に漏洩

---

## 🚨 問題の概要

Git履歴を調査した結果、Gemini APIキーが以下の形式でコミットされていることが判明：

```
GEMINI_API_KEY=***REMOVED***
```

このキーはGit履歴に残っており、GitHubに公開されている可能性があります。

---

## 📋 削除・再生成手順

### Step 1: 現在の使用状況を確認

**確認項目**:
- [ ] `.env.local`にこのキーが含まれていないか
- [ ] コード内にハードコードされていないか
- [ ] Git履歴のどのコミットに含まれているか

---

### Step 2: Git履歴から削除

#### 方法A: 特定のファイルから削除（推奨）

キーが含まれているファイルを特定してから削除：

```powershell
# キーが含まれているファイルを検索
git log --all --full-history --source --pretty=format:"%H" -- | ForEach-Object { git show $_ } | Select-String -Pattern "***REMOVED***"

# 該当ファイルのパスを確認（例: .env, config.ts など）
# そのファイルの履歴を削除
git filter-repo --path <該当ファイル> --invert-paths --force
```

#### 方法B: BFGを使用（全ての参照を削除）

```powershell
# BFGをダウンロード（まだの場合）
# https://rtyley.github.io/bfg-repo-cleaner/

# パスワードファイルを作成
echo "***REMOVED***" > gemini_key.txt

# BFGで削除
java -jar bfg.jar --replace-text gemini_key.txt

# クリーンアップ
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# リモートにforce push
git push origin --force --all
```

---

### Step 3: 新しいGemini APIキーを作成

1. Google Cloud Console を開く: https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0837543731
2. 「+ 認証情報を作成」→「APIキー」を選択
3. 新しいキーが生成される
4. **重要**: 制限を設定
   - アプリケーションの制限: HTTPリファラー（`localhost`, 本番ドメイン）
   - API制限: Generative Language API のみ
5. キーをコピー

---

### Step 4: `.env.local`に新しいキーを設定

```bash
# .env.local に追加
VITE_GEMINI_API_KEY=<新しいキー>
```

**注意**: `.env.local`は`.gitignore`に含まれているため、Gitにコミットされません。

---

### Step 5: アプリケーションのテスト

```powershell
# 開発サーバーを再起動
npm run dev
```

ブラウザで以下を確認：
- [ ] Gemini API機能が正常に動作する
- [ ] エラーが表示されない

---

### Step 6: 旧キーを削除

Google Cloud Console で：
1. 「Default Gemini API Key」（旧キー）を削除
2. 削除確認

---

### Step 7: GitHub Secret Scanningの確認

6-24時間後にGitHub Secret Scanningアラートが自動的にクローズされるか確認。

---

## ✅ チェックリスト

- [ ] Step 1: 現在の使用状況を確認
- [ ] Step 2: Git履歴から削除
- [ ] Step 3: 新しいキーを作成
- [ ] Step 4: `.env.local`に設定
- [ ] Step 5: テスト
- [ ] Step 6: 旧キーを削除
- [ ] Step 7: GitHubアラートの確認

---

## 🔒 セキュリティレベル

**修正前**: 🔴 **危険** （Git履歴に漏洩）  
**修正後**: 🟢 **安全** （新キー、制限あり）

---

**実施担当者**: AI + ユーザー  
**予定所要時間**: 約30分
