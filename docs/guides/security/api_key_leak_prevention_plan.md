**作成日**: 2026-01-30 00:30:00  
**最終更新**: 2026-01-30 00:51:00  
**ステータス**: 完了  
**関連ファイル**: [api_key_leak_fix_tasks.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/guides/security/api_key_leak_fix_tasks.md), [security_implementation_report_20260130.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/guides/security/security_implementation_report_20260130.md)

---

# セキュリティ対策実装計画

## 概要

APIキー漏洩の再発防止のため、6層のセキュリティ対策を実装します。

**全6項目:**
1. GitHub Secret Scanning（必須）
2. ggshield pre-commit（必須）
3. GitHubサポート依頼（必須）
4. .gemini全体のAPIキー置換（推奨）
5. Mask Secrets in Logs（オプション）
6. Post-Commit Command: None（オプション）

## 実装順序

> [!NOTE]
> 全6項目の実装計画。Phase 1-4は必須、Phase 5-6は効果が限定的だが、ユーザー指示により含める。

### **Phase 1: GitHub Secret Scanning（所要時間: 3分）**

**目的:** GitHubサーバー側でAPIキーを自動検出

**手順:**
1. ブラウザで https://github.com/tani0120/receipt-app/settings/security_analysis を開く
2. "Secret scanning" セクションで "Enable" をクリック
3. "Push protection" も "Enable" にする

**検証:**
- Settings画面で "Secret scanning: Enabled" と表示されること

---

### **Phase 2: ggshield pre-commit（所要時間: 5分）**

**目的:** ローカルでcommit前にAPIキーを検出

**手順:**

1. **pre-commitファイル作成**
```powershell
cd C:\Users\kazen\OneDrive\デスクトップ\ai_gogleanti
New-Item -Path .git\hooks\pre-commit -ItemType File -Force
```

2. **スクリプト記述**
```powershell
@"
#!/bin/sh
ggshield secret scan pre-commit
"@ | Set-Content -Path .git\hooks\pre-commit -Encoding UTF8
```

3. **実行権限付与（Windowsでは不要だが、念のため確認）**
```powershell
git config core.hooksPath .git/hooks
```

**検証:**
```powershell
# テストファイルを作成
echo "[REDACTED_GOOGLE_API_KEY]" > test_secret.txt
git add test_secret.txt
git commit -m "test"
# → ggshieldがブロックすればOK
git reset HEAD test_secret.txt
rm test_secret.txt
```

---

### **Phase 3: GitHubサポート依頼（所要時間: 5分）**

**目的:** オーファンコミットのガベージコレクション

**前提条件:**
- ✅ git-filter-repo完了
- ✅ 強制プッシュ完了

**手順:**

1. **GitHub Support Formを開く**
   - https://support.github.com/request

2. **フォーム入力**
   - Subject: `Request for removal of cached sensitive data (orphaned commits)`
   - Category: `Account and repository settings`
   - Message: 以下の英語文を貼り付け

```
Dear GitHub Support Team,

I accidentally pushed a commit containing a sensitive API key to my repository. I have already rewritten the repository's history and performed a force-push to remove the secret from all branches.

However, I understand that the sensitive information may still be accessible via cached views or orphaned commits on GitHub's servers. Could you please run a garbage collection and purge the cached views for the following repository to ensure the sensitive data is completely removed?

Repository: https://github.com/tani0120/receipt-app

Thank you for your assistance.

Best regards
```

3. **送信**

**検証:**
- 数日以内にGitHubから返信が来る
- "Garbage collection completed" の通知を確認

---

### **Phase 4: .gemini全体のAPIキー置換（所要時間: 5分）**

**目的:** チャット履歴の痕跡を削除

**手順:**

```powershell
$geminiDir = "C:\Users\kazen\.gemini"
$count = 0
$patterns = @(
    @{Pattern='AIzaSy[0-9A-Za-z_-]{30,}'; Replacement='[REDACTED_GOOGLE_API_KEY]'},
    @{Pattern='sk-[0-9A-Za-z]{48}'; Replacement='[REDACTED_OPENAI_API_KEY]'}
)

Get-ChildItem -Path $geminiDir -Recurse -File | 
Where-Object { 
    $_.Extension -ne '.webp' -and 
    $_.Extension -ne '.png' -and 
    $_.Extension -ne '.jpg' 
} | ForEach-Object {
    try {
        $content = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
        $originalContent = $content
        foreach ($p in $patterns) {
            $content = $content -replace $p.Pattern, $p.Replacement
        }
        if ($content -ne $originalContent) {
            [System.IO.File]::WriteAllText($_.FullName, $content, [System.Text.Encoding]::UTF8)
            $count++
        }
    } catch {}
}

Write-Host "合計 $count 個のファイルを修正しました"
```

**検証:**
```powershell
# 再スキャン
$foundCount = 0
Get-ChildItem -Path $geminiDir -Recurse -File | ForEach-Object {
    try {
        $content = [System.IO.File]::ReadAllText($_.FullName)
        if ($content -match 'AIzaSy[0-9A-Za-z_-]{30,}') {
            $foundCount++
        }
    } catch {}
}
Write-Host "残存APIキー: $foundCount 件"
```

---

### **Phase 5: Mask Secrets in Logs（所要時間: 3分）**

**目的:** ログやレポートに出力されるAPIキーを自動的にマスキング

> [!NOTE]
> **効果は限定的**: そもそもログにAPIキーを書かないのが正解。対症療法的な対策。

**手順:**

1. **VS Code設定（例）**
```json
// .vscode/settings.json
{
  "files.associations": {
    "*.log": "log"
  },
  "log.secretMasking": {
    "enabled": true,
    "patterns": [
      "AIzaSy[0-9A-Za-z_-]{30,}",
      "sk-[0-9A-Za-z]{48}"
    ]
  }
}
```

2. **PowerShellスクリプトでログファイルをマスキング（オプション）**
```powershell
# マスキング用スクリプト
$logFiles = Get-ChildItem -Path . -Recurse -Include *.log,*.md -File
foreach ($file in $logFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $content = $content -replace 'AIzaSy[0-9A-Za-z_-]{30,}', '***REDACTED_API_KEY***'
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8
}
```

**検証:**
- ログファイルにAPIキーが書かれていないことを確認

---

### **Phase 6: Post-Commit Command: None（所要時間: 1分）**

**目的:** コミット後の自動プッシュを停止

> [!NOTE]
> **ggshield pre-commitがあれば不要**: 二重防御としては有効だが、利便性が下がる。

**手順:**

1. **Git設定確認**
```powershell
git config --get alias.cmp
```

2. **自動プッシュエイリアスがあれば削除**
```powershell
# もし "cmp = commit -a && push" のようなエイリアスがあれば削除
git config --global --unset alias.cmp
```

3. **VS Code設定（オプション）**
```json
// .vscode/settings.json
{
  "git.postCommitCommand": "none",
  "git.autofetch": false,
  "git.autoStash": false
}
```

**検証:**
```powershell
# commitしてもpushされないことを確認
git add .
git commit -m "test"
git status
# → "Your branch is ahead of 'origin/main' by 1 commit" と表示されればOK
```

---

## 検証計画

### Phase 1-2 検証（ggshield pre-commitテスト）

1. テストファイルにAPIキーを書いてcommit試行
2. ggshieldがブロックすることを確認
3. APIキーを削除してcommit成功を確認

### Phase 3 検証

- GitHubサポートからの返信を待つ（数日）

### Phase 4 検証

- .geminiディレクトリ全体を再スキャン
- APIキー検出0件を確認
