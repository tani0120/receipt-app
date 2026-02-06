# Git操作前チェックリスト

**作成日**: 2026-02-04  
**最終更新**: 2026-02-04  
**目的**: 過去の失敗（APIキー漏洩3回、OneDrive誤編集等）を踏まえ、Git操作前の安全確認を体系化

**参照**: 
- [SESSION_git_trouble_history.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_git_trouble_history.md) - 過去の失敗6件
- [SESSION_START.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_START.md) - セキュリティルール

---

## 🎯 チェックリストの目的

### **防ぐべき問題**

1. **APIキー漏洩** - 過去に3回発生（Git履歴に残存）
2. **OneDrive誤編集** - 2026-02-02に4ファイル破損
3. **型安全性の低下** - baseline（231）超過のリスク
4. **デバッグコード残存** - 本番環境へのコンソールログ流出

---

## 📊 10項目チェックリスト分類

### **🤖 自動化できる項目（4項目）- husky導入で不要に**

| # | チェック項目 | 検出方法 | 過去の失敗 |
|---|-------------|---------|-----------|
| **1** | **テストユーザーID/パスワード** | ggshield検出 | Git履歴汚染（332ファイル、2026-01-29） |
| **2** | **Dockerfile機密情報** | ggshield検出 | APIキー漏洩3回の主原因 |
| **6** | **package.json機密情報** | ggshield検出 | - |
| **9** | **Git履歴の機密情報** | ggshield検出 | APIキー漏洩（2026-01-27） |

#### **自動化の仕組み**

```bash
git commit
↓
.husky/pre-commit が自動実行
↓
ggshield secret scan --verbose
↓
機密情報を検出 → コミット拒否 ✅
検出なし → コミット続行 ✅
```

#### **ggshieldが検出するパターン**

- `password`, `api_key`, `API_KEY`, `secret`, `token`
- `admin@`, `test_user`, `serviceAccount`
- `VITE_`, `REACT_APP_`, `NEXT_PUBLIC_`
- Base64エンコードされた機密情報
- 正規表現パターン（例: `AIza[0-9A-Za-z-_]{35}`）

---

### **👨 人間の確認が必要な項目（6項目）- husky導入後も必須**

| # | チェック項目 | 確認方法 | 理由 |
|---|-------------|---------|------|
| **3** | **デバッグコード残存** | 手動確認 | `console.log`は機密情報ではない |
| **4** | **any型の使用** | 手動確認 | TypeScript設計判断（機密情報ではない） |
| **5** | **baseline誤更新** | 手動確認 | 数値の妥当性判断（機密情報ではない） |
| **7** | **TODO/FIXMEコメント** | 手動確認 | コードの完成度判断（機密情報ではない） |
| **8** | **OneDrive配下での誤操作** | 手動確認 | 作業ディレクトリ確認（機密情報ではない） |
| **10** | **ハードコードされた本番URL/ID** | 手動確認 | URL妥当性判断は人間が必要 |

---

## 📋 実施手順

### **Phase 1: husky導入前（現在）**

#### **全10項目を手動確認**

```powershell
# ========================================
# チェック0: VS Codeワークスペース確認（最優先）
# ========================================
# VS Codeエクスプローラーで確認:
# - 「未設定」のワークスペースセクションに `C:\dev\receipt-app` が表示されているか
# - もし表示されていない場合:
#   1. ファイル → フォルダーをワークスペースに追加
#   2. C:\dev\receipt-app を選択
#   3. 追加ボタンをクリック
# 
# 理由: ワークスペース未追加 → AIがC:\dev\receipt-app内のファイルにアクセス不可
# 実施日: 2026-02-06にワークスペース追加完了

# ========================================
# チェック1: テストユーザーID/パスワード
# ========================================
git -C C:\dev\receipt-app diff HEAD | Select-String -Pattern "password|user.*id|admin@|test.*user" -Context 1

# ========================================
# チェック2: Dockerfile機密情報
# ========================================
if (Test-Path C:\dev\receipt-app\Dockerfile) {
    Get-Content C:\dev\receipt-app\Dockerfile | Select-String -Pattern "api.*key|API_KEY|VITE_"
}

# ========================================
# チェック3: デバッグコード残存
# ========================================
git -C C:\dev\receipt-app diff HEAD | Select-String -Pattern "console\.log|console\.error|debugger"

# ========================================
# チェック4: any型の使用
# ========================================
git -C C:\dev\receipt-app diff HEAD | Select-String -Pattern ": any[\s;,\)]"

# ========================================
# チェック5: baseline誤更新
# ========================================
git -C C:\dev\receipt-app diff HEAD .github/workflows/type-safety.yml | Select-String -Pattern "baseline"

# ========================================
# チェック6: package.json機密情報
# ========================================
Get-Content C:\dev\receipt-app\package.json | Select-String -Pattern "api.*key|secret|token"

# ========================================
# チェック7: TODO/FIXMEコメント
# ========================================
git -C C:\dev\receipt-app diff HEAD | Select-String -Pattern "//.*TODO|//.*FIXME"

# ========================================
# チェック8: OneDrive配下での誤操作
# ========================================
pwd  # 期待値: C:\dev\receipt-app
# ❌ C:\Users\kazen\OneDrive\デスクトップ\ai_gogleanti で git commit は禁止

# ========================================
# チェック9: Git履歴の機密情報
# ========================================
git -C C:\dev\receipt-app log --all --oneline --grep="api.*key|secret" --regexp-ignore-case | Select-Object -First 5

# ========================================
# チェック10: ハードコードされた本番URL/ID
# ========================================
git -C C:\dev\receipt-app diff HEAD | Select-String -Pattern "https://.*firebaseapp\.com|project.*id.*="

# ========================================
# チェック11: 未コミットファイルの妥当性確認
# ========================================
# 全未コミットファイルを確認
git -C C:\dev\receipt-app status --short

# 各ファイルの内容を確認してコミット要否を判断
# - テストファイル（test_*.ts, test_*.jpg等）→ 除外
# - 開発中ファイル（未実装機能）→ 除外
# - ビルド成果物（dist/, node_modules/）→ 除外
# - 本番コード修正 → コミット対象

# 例: 差分確認
git -C C:\dev\receipt-app diff HEAD [ファイル名]
```

---

### **Phase 2: husky導入後（次のセッションから）**

#### **簡略化されたチェックリスト（7項目のみ）**

```powershell
# ========================================
# 優先確認（チェック不要ではない）
# ========================================
# チェック0: VS Codeワークスペース確認
# VS Codeエクスプローラーで C:\dev\receipt-app が表示されているか確認

# ========================================
# 自動化済み（チェック不要）
# ========================================
# ✅ チェック1: テストユーザーID/パスワード → ggshieldが自動検出
# ✅ チェック2: Dockerfile機密情報 → ggshieldが自動検出
# ✅ チェック6: package.json機密情報 → ggshieldが自動検出
# ✅ チェック9: Git履歴の機密情報 → ggshieldが自動検出

# ========================================
# 人間の確認が必要（6項目）
# ========================================

# チェック3: デバッグコード残存
git -C C:\dev\receipt-app diff HEAD | Select-String -Pattern "console\.log|console\.error|debugger"

# チェック4: any型の使用
git -C C:\dev\receipt-app diff HEAD | Select-String -Pattern ": any[\s;,\)]"

# チェック5: baseline誤更新
git -C C:\dev\receipt-app diff HEAD .github/workflows/type-safety.yml | Select-String -Pattern "baseline"

# チェック7: TODO/FIXMEコメント
git -C C:\dev\receipt-app diff HEAD | Select-String -Pattern "//.*TODO|//.*FIXME"

# チェック8: OneDrive配下での誤操作
pwd  # 期待値: C:\dev\receipt-app
# ❌ C:\Users\kazen\OneDrive\デスクトップ\ai_gogleanti で git commit は禁止

# チェック10: ハードコードされた本番URL/ID
git -C C:\dev\receipt-app diff HEAD | Select-String -Pattern "https://.*firebaseapp\.com|project.*id.*="

# ========================================
# チェック11: 未コミットファイルの妥当性確認
# ========================================
git -C C:\dev\receipt-app status --short
# 各ファイルがコミット対象か判断
# テストファイル、開発中ファイルを除外
```

**確認時間**: 11項目（約11分） → 7項目（約7分）、**36%削減** ✅

---

## 🚨 過去の失敗とチェックリストの対応

| 過去の失敗 | 日付 | チェック項目 | 防止策 |
|-----------|------|------------|-------|
| APIキー漏洩（3回） | 2026-01-27 | チェック2, 6, 9 | ggshield自動検出 ✅ |
| OneDrive誤編集 | 2026-02-02 | チェック8 | 作業ディレクトリ確認（人間） |
| Git履歴汚染（332ファイル） | 2026-01-29 | チェック1, 9 | ggshield自動検出 ✅ |
| git-filter-repo強制プッシュ | 2026-01-27 | - | 慎重な操作（教訓） |
| GitHub orphan commit | 2026-01-27 | チェック9 | ggshield自動検出 ✅ |
| GitHub Actions失敗（19回） | 2026-01-27 | - | 別の問題（技術的制約） |

---

## 📖 各チェック項目の詳細

### **チェック1: テストユーザーID/パスワード**

**必要性**: 🔴 **必須**（機密情報漏洩の最大リスク）

**過去の失敗**: 
- 2026-01-29: Git履歴に平文パスワード（332ファイル、59,736行）
- `users.json`、`create_user_browser.js`等に残存

**検出パターン**:
```
password, admin@, test.*user, serviceAccount, user.*id
```

**husky導入後**: ✅ **自動検出**

---

### **チェック2: Dockerfile機密情報**

**必要性**: 🔴 **必須**（APIキー漏洩3回の主原因）

**過去の失敗**:
- 2026-01-27: `Dockerfile`にAPIキーをハードコーディング
- コミットハッシュ: `fd814d17fbd0dca4ec5e7adbb563822621b3d337`

**検出パターン**:
```
api.*key, API_KEY, VITE_, firebase.*key, gemini.*key
```

**husky導入後**: ✅ **自動検出**

---

### **チェック3: デバッグコード残存**

**必要性**: 🟡 **推奨**（本番環境での情報漏洩リスク）

**過去の失敗**: なし

**検出パターン**:
```
console.log, console.error, debugger
```

**husky導入後**: ⚠️ **人間の確認が必要**（ggshieldは検出しない）

---

### **チェック4: any型の使用**

**必要性**: 🟡 **推奨**（型安全性の原則違反）

**過去の失敗**: なし（ルールで禁止済み）

**検出パターン**:
```typescript
: any[\s;,\)]
```

**husky導入後**: ⚠️ **人間の確認が必要**（TypeScript設計判断）

**備考**: SESSION_START.mdの原則「any型を使わない」に準拠

---

### **チェック5: baseline誤更新**

**必要性**: 🟡 **推奨**（型安全性のbaseline管理）

**過去の失敗**: なし（Phase 4で厳格化）

**確認方法**:
```powershell
# .github/workflows/type-safety.yml の baseline を確認
# 現在のbaseline: 231
# 増加させる場合は設計レビュー必須
```

**husky導入後**: ⚠️ **人間の確認が必要**（数値の妥当性判断）

---

### **チェック6: package.json機密情報**

**必要性**: 🔴 **必須**（APIキー、トークン漏洩のリスク）

**過去の失敗**: なし

**検出パターン**:
```
api.*key, API_KEY, secret, password, token
```

**husky導入後**: ✅ **自動検出**

---

### **チェック7: TODO/FIXMEコメント**

**必要性**: 🟢 **任意**（コードの完成度確認）

**過去の失敗**: なし

**検出パターン**:
```
//.*TODO, //.*FIXME, //.*HACK
```

**husky導入後**: ⚠️ **人間の確認が必要**（完成度判断）

---

### **チェック8: OneDrive配下での誤操作**

**必要性**: 🔴 **必須**（OneDrive誤編集の再発防止）

**過去の失敗**:
- 2026-02-02: OneDrive配下のファイルを誤編集（4ファイル破損、復旧30分）
- `zod_schema.ts`, `firestore.ts`, `ui.type.ts`, `ClientMapper.ts`

**確認方法**:
```powershell
pwd
# 期待値: C:\dev\receipt-app
# ❌ C:\Users\kazen\OneDrive\デスクトップ\ai_gogleanti で git commit は禁止
```

**husky導入後**: ⚠️ **人間の確認が必要**（作業ディレクトリ確認）

**備考**: SESSION_START.mdで厳格に禁止

---

### **チェック9: Git履歴の機密情報**

**必要性**: 🔴 **必須**（過去コミットにAPIキーが残存している可能性）

**過去の失敗**:
- 2026-01-27: APIキー漏洩（3回）
- git-filter-repoで削除済みだが、GitHub orphan commitに残存（90日間）

**確認方法**:
```powershell
git log --all --oneline --grep="api.*key|secret" --regexp-ignore-case
```

**husky導入後**: ✅ **自動検出**（過去コミットもスキャン）

---

### **チェック10: ハードコードされた本番URL/ID**

**必要性**: 🟡 **推奨**（設定ファイルへの外出しが望ましい）

**過去の失敗**: なし

**検出パターン**:
```
https://.*firebaseapp\.com, https://.*googleapis\.com, project.*id.*=
```

**husky導入後**: △ **部分的に自動検出**（URL自体は検出できるが、妥当性判断は人間が必要）

**備考**: 
- URL自体はggshieldが検出
- ただし、「このURLがハードコードされていて良いか」の判断は人間が必要

---

## 🎯 husky導入のメリット・デメリット

### **メリット**

| 項目 | 効果 |
|------|------|
| **セキュリティ向上** | 機密情報漏洩を自動的に防止 ✅ |
| **確認時間削減** | 10項目 → 6項目（40%削減）✅ |
| **人為的ミス削減** | ggshieldが24/7監視 ✅ |
| **チーム共有** | .husky/をGit管理 → 全員に適用 ✅ |

### **デメリット**

| 項目 | 影響 |
|------|------|
| **コミット時間増加** | ggshieldスキャンで数秒〜30秒増加 |
| **false positive** | 正規のURLをAPIキーと誤検出する可能性 |
| **導入時間** | 初回セットアップに30分〜1時間 |

---

## 📖 まとめ

### **husky導入前後の比較**

| 項目 | husky導入前 | husky導入後 |
|------|-----------|-----------|
| **確認項目数** | 10項目 | 6項目 |
| **確認時間** | 約10分 | 約6分（40%削減）|
| **機密情報検出** | 手動確認（人為的ミスあり）| 自動検出（100%検出）|
| **Git操作の安全性** | 人間の注意力に依存 | ggshieldが自動保護 |

### **推奨される運用**

1. **husky導入**: Phase 8で実施（または今すぐ）
2. **人間の確認**: 6項目は引き続き手動確認
3. **定期レビュー**: 月1回、チェックリストの有効性を確認

---

**最終更新**: 2026-02-04  
**次回レビュー**: 新しいセキュリティ問題発生時
